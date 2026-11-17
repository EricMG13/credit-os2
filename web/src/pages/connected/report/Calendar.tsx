import { Table as KitTable } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";
import { ChartWithTable } from "@/components/chart/ChartWithTable";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { moduleName } from "../api";
import { card, heading } from "../layout";
import {
  type Block,
  blocked,
  containsReference,
  evidencePath,
  type OutputEntry,
  readerText,
  type Table,
} from "../publishedReport";
import { EVENT_HEADERS, eventLane, eventRecords } from "../visuals/EventLane";
import { publishedTables, word } from "../visuals/visualData";
import { PublishedSource } from "./PublishedTrace";

type EventLocation = { owner: string; href: string };
type CalendarRow = EventLocation & { cells: string[]; from: number; to: number };
type UnplacedEvent = { href: string; cells: string[]; unreadable?: boolean };
type CalendarGap = EventLocation & { title: string; reason: string; unplaced?: UnplacedEvent[] };

const UNPLACED_REASON = "The recorded event name, status, date or precision could not be plotted.";
const UNIDENTIFIED_REASON = "The event table does not identify each event row.";
const UNREADABLE_REASON = "An event row could not be read.";
const UNREADABLE_ROW = "This row could not be read";

/** A reference in a status keeps the lane before it, so the lane still reads (`isHistoricalStatus`). */
function eventDisplay(cells: string[]) {
  return cells.map((text, index) => {
    const relevant =
      index === 6
        ? ((
            {
              Wall: "Maturity wall",
              Cost: "Cost-related event",
              Rating: "Rating-related event",
            } as Record<string, string>
          )[text] ?? text)
        : text;
    if (!containsReference(relevant)) return relevant;
    if (index === 4) {
      const lane = /^(Historical|Scheduled|Scenario|User reminder)(?: — |$)/.exec(text)?.[1];
      return lane ? `${lane} — See Evidence` : "See Evidence";
    }
    if (index === 3) {
      const name = text
        .replace(
          /(?:\s+(?:per|from|in|see)\s+)?[\w.-]+\.(?:pdf|docx?|xlsx?|xlsm|csv|tsv|txt|md|jsonl?|html?|zip)\b(?:\s*,?\s*(?:p\.|page)\s*\d+(?:[-–]\d+)?)?/gi,
          "",
        )
        .trim()
        .replace(/[\s,;:(]+$/, "");
      return name && !containsReference(name) ? name : "See Evidence";
    }
    return "See Evidence";
  });
}

function readableCells(cells: unknown): cells is string[] {
  return (
    Array.isArray(cells) &&
    cells.length === EVENT_HEADERS.length &&
    cells.every((cell) => typeof cell === "string")
  );
}

/** Whether every row has its own Evidence line, after the table's and shared with no other row. */
function identifiesEachRow(block: Table) {
  const lines = block.rows.map(({ line }) => line);
  return (
    lines.every((line) => Number.isSafeInteger(line) && line > block.line) &&
    new Set(lines).size === lines.length
  );
}

/** As at 1778835: a table whose rows are not each identified is withheld as a whole. */
function unidentifiedReason(block: Table, placed: number) {
  if (!block.rows.every(({ cells }) => readableCells(cells))) {
    return "The event table could not be read.";
  }
  return placed === block.rows.length ? UNIDENTIFIED_REASON : UNPLACED_REASON;
}

function placeEvents(block: Table, entry: OutputEntry, folder: string, owner: string) {
  const readable = block.rows.flatMap(({ cells }, index) => (readableCells(cells) ? [index] : []));
  const events = eventRecords({
    line: block.line,
    headers: EVENT_HEADERS,
    rows: readable.map((index) => block.rows[index]?.cells ?? []),
  });
  if (!identifiesEachRow(block)) {
    return { rows: [], reason: unidentifiedReason(block, events.length), unplaced: [] };
  }
  const href = (index: number) =>
    evidencePath(folder, entry, block.rows[index]?.line ?? block.line);
  const placed = new Set(events.map(({ index }) => readable[index]));
  const rows: CalendarRow[] = events.flatMap(({ index, from, to }) => {
    const at = readable[index] ?? -1;
    const row = block.rows[at];
    return row ? [{ owner, href: href(at), cells: eventDisplay(row.cells), from, to }] : [];
  });
  const unplaced: UnplacedEvent[] = block.rows.flatMap(({ cells }, index) => {
    if (placed.has(index)) return [];
    return readableCells(cells)
      ? [
          {
            href: href(index),
            cells: eventDisplay(cells),
          },
        ]
      : [{ href: href(index), cells: [], unreadable: true }];
  });
  const reason = [
    unplaced.some((event) => !event.unreadable) ? UNPLACED_REASON : "",
    unplaced.some((event) => event.unreadable) ? UNREADABLE_REASON : "",
  ]
    .filter(Boolean)
    .join(" ");
  return { rows, reason, unplaced };
}

function tableProblem(block: Table, blocks: Block[], readable: boolean) {
  if (blocks.filter((item) => item.type === "table" && item.line === block.line).length > 1) {
    return "The event table could not be read.";
  }
  if (block.headers.join("\0") === EVENT_HEADERS.join("\0")) return null;
  return readable ? UNPLACED_REASON : "The event table could not be read.";
}

export function buildCalendar(entries: OutputEntry[], folder: string) {
  const rows: CalendarRow[] = [];
  const gaps: CalendarGap[] = [];
  entries.forEach((entry) => {
    const { output, sections, selected } = entry;
    if (!selected || !output.events?.length || output.parseError) return;
    const owner = [moduleName(output.module), output.state?.declared].filter(Boolean).join(" · ");
    const assessable = output.state?.established !== false && !blocked(entry);
    const tables = publishedTables(sections);
    const blocks = sections.flatMap((section) => section.blocks);
    const seen = new Set<number>();
    for (const descriptor of output.events) {
      const title = word(descriptor.lane);
      if (!title || descriptor.table <= 0 || seen.has(descriptor.table)) continue;
      const block = blocks.find((item) => item.type === "table" && item.line === descriptor.table);
      if (block?.type !== "table" || !block.rows.length) continue;
      seen.add(block.line);
      const href = evidencePath(folder, entry, block.line);
      const gap = word(descriptor.gap);
      if (gap) {
        gaps.push({ owner, href, title, reason: gap });
        continue;
      }
      if (!assessable) continue;
      const problem = tableProblem(block, blocks, tables.has(block.line));
      if (problem) {
        gaps.push({ owner, href, title, reason: problem });
        continue;
      }
      const placed = placeEvents(block, entry, folder, owner);
      rows.push(...placed.rows);
      if (placed.reason) {
        const unplaced = placed.unplaced.length ? placed.unplaced : undefined;
        gaps.push({ owner, href, title, reason: placed.reason, unplaced });
      }
    }
  });
  rows.sort((a, b) => a.from - b.from || a.to - b.to);
  return { rows, gaps };
}

export function upcomingCalendarRows(rows: CalendarRow[], asOf: string | null) {
  if (!asOf || !/^\d{4}-\d{2}-\d{2}$/u.test(asOf)) return null;
  const timestamp = Date.parse(`${asOf}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== asOf) {
    return null;
  }
  return rows
    .filter(({ cells, to }) => !isHistoricalStatus(cells[4] ?? "") && to >= timestamp)
    .map((row) => ({
      ...row,
      timingWithinRecordedPeriod: row.from < timestamp && timestamp <= row.to,
    }));
}

function isHistoricalStatus(status: string) {
  return status === "Historical" || status.startsWith("Historical — ");
}

function EventSource({ href, name }: { href: string; name: string }) {
  return (
    <PublishedSource href={href} name={name} linkLabel={`Source for ${name}`}>
      View source
    </PublishedSource>
  );
}

function CalendarFigure({ rows }: { rows: CalendarRow[] }) {
  const eventName = (cells: string[]) => cells[3] ?? "event";
  const chart = eventLane(
    {
      line: 0,
      headers: EVENT_HEADERS,
      rows: rows.map(({ cells }) => cells),
      evidenceInDrawer: true,
    },
    (index) => {
      const row = rows[index];
      return row ? (
        <p className={`${TRACE_HOST} flex flex-wrap items-center gap-x-2 text-text-secondary`}>
          <span>{row.owner}</span>
          <EventSource href={row.href} name={`${eventName(row.cells)} · ${row.owner}`} />
        </p>
      ) : null;
    },
  );
  return (
    <section className={`min-w-0 ${card}`}>
      <ChartWithTable
        title="Published events"
        as="h3"
        chart={chart}
        table={{
          head: [
            "Event",
            "Event date",
            "Date precision",
            "Published",
            "Status",
            "Credit relevance",
            "Module",
          ],
          rows: rows.map(({ cells, owner, href }) => ({
            label: eventName(cells),
            cells: [cells[0], cells[1], cells[2], cells[4], cells[6], owner].map(
              (value) => value || null,
            ),
            end: <EventSource href={href} name={`${eventName(cells)} · ${owner}`} />,
          })),
          endHeading: "Evidence",
        }}
      />
    </section>
  );
}

function UnplacedTable({ owner, events }: { owner: string; events: UnplacedEvent[] }) {
  const shown = (text: string | undefined) => text || "Not recorded";
  return (
    <KitTable aria-label="Events not placed on the calendar" size="sm">
      <KitTable.Header>
        <KitTable.Head id="event" isRowHeader label="Event" />
        <KitTable.Head id="date" label="Recorded date" />
        <KitTable.Head id="precision" label="Date precision" />
        <KitTable.Head id="published" label="Published" />
        <KitTable.Head id="status" label="Status" />
        <KitTable.Head id="relevance" label="Credit relevance" />
        <KitTable.Head id="evidence" label="Evidence" />
      </KitTable.Header>
      <KitTable.Body items={events.map((event, index) => ({ ...event, id: String(index) }))}>
        {({ id, href, cells, unreadable }) => {
          const name = unreadable ? UNREADABLE_ROW : shown(cells[3]);
          const values = unreadable
            ? ["", "", "", "", ""]
            : [0, 1, 2, 4, 6].map((at) => shown(cells[at]));
          return (
            <KitTable.Row id={id}>
              <KitTable.Cell>{name}</KitTable.Cell>
              {values.map((value, at) => (
                <KitTable.Cell key={at}>{value}</KitTable.Cell>
              ))}
              <KitTable.Cell>
                <EventSource href={href} name={`${name} · ${owner}`} />
              </KitTable.Cell>
            </KitTable.Row>
          );
        }}
      </KitTable.Body>
    </KitTable>
  );
}

export function Calendar({ calendar }: { calendar: ReturnType<typeof buildCalendar> }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-h2">Issuer calendar</h2>
        <Button href="#overview" color="link-gray" size="sm" iconTrailing={ArrowRight}>
          Back to Overview
        </Button>
      </div>
      <p className="max-w-[76ch] text-sm text-text-secondary">
        Historical and Scheduled are the module’s recorded categories, not classifications against
        this run’s as-of date.
      </p>
      <p className="max-w-[76ch] text-sm text-text-secondary">
        Date precision states whether the date identifies a day, month, quarter or year.
      </p>
      {calendar.rows.length ? (
        <CalendarFigure rows={calendar.rows} />
      ) : (
        <p className={card}>
          {calendar.gaps.some(({ unplaced }) => unplaced?.some((event) => !event.unreadable))
            ? "No published event could be placed on the calendar; the events and recorded gaps are listed below."
            : calendar.gaps.length
              ? "No events could be placed on the calendar; the recorded gaps are listed below."
              : "No dated events were published for this run."}
        </p>
      )}
      {calendar.gaps.map(({ owner, href, title, reason, unplaced }) => (
        <section className={`${TRACE_HOST} ${card}`} key={href}>
          <h3 className={heading}>{title}</h3>
          <p>{owner}</p>
          <p role="note">
            {containsReference(reason)
              ? "An event gap is recorded in Evidence."
              : readerText(reason)}
          </p>
          {unplaced ? (
            <UnplacedTable owner={owner} events={unplaced} />
          ) : (
            <EventSource href={href} name={title} />
          )}
        </section>
      ))}
    </>
  );
}
