import { Table as KitTable } from "@/components/application/table/table";
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { Missing } from "@/components/gap/Missing";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { cx } from "@/utils/cx";
import { moduleName } from "../api";
import {
  type Block,
  blocked,
  containsReference,
  evidencePath,
  type OutputEntry,
  readerText,
  type Table,
} from "../publishedReport";
import { EventAxis } from "../visuals/EventAxis";
import { EVENT_HEADERS, eventRecords, recordedRange, type EventRecord } from "../visuals/EventLane";
import { asOfDate } from "../runFigures";
import { publishedTables, word } from "../visuals/visualData";
import { Bento, GapNote, Tile, Well } from "./overview/Tile";
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
    if (!containsReference(relevant)) return readerText(relevant);
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

function tableProblem(block: Table, blocks: Block[], readable: ReturnType<typeof publishedTables>) {
  if (blocks.filter((item) => item.type === "table" && item.line === block.line).length > 1) {
    return "The event table could not be read.";
  }
  if (block.headers.join("\0") === EVENT_HEADERS.join("\0")) return null;
  return readable.has(block.line) ? UNPLACED_REASON : "The event table could not be read.";
}

export function buildCalendar(entries: OutputEntry[], folder: string) {
  const calendars = entries.map((entry) => entryCalendar(entry, folder));
  const rows = calendars.flatMap(({ rows }) => rows);
  const gaps = calendars.flatMap(({ gaps }) => gaps);
  rows.sort((a, b) => a.from - b.from || a.to - b.to);
  return { rows, gaps };
}

function entryCalendar(entry: OutputEntry, folder: string) {
  const rows: CalendarRow[] = [];
  const gaps: CalendarGap[] = [];
  const { output, sections, selected } = entry;
  if (!selected || !output.events?.length || output.parseError) return { rows, gaps };
  const owner = [moduleName(output.module), output.state?.declared].filter(Boolean).join(" · ");
  const assessable = output.state?.established !== false && !blocked(entry);
  const tables = publishedTables(sections);
  const blocks = sections.flatMap((section) => section.blocks);
  const seen = new Set<number>();
  for (const descriptor of output.events) {
    addCalendarEvent(
      descriptor,
      entry,
      folder,
      owner,
      assessable,
      tables,
      blocks,
      seen,
      rows,
      gaps,
    );
  }
  return { rows, gaps };
}

function addCalendarEvent(
  descriptor: NonNullable<OutputEntry["output"]["events"]>[number],
  entry: OutputEntry,
  folder: string,
  owner: string,
  assessable: boolean,
  tables: ReturnType<typeof publishedTables>,
  blocks: Block[],
  seen: Set<number>,
  rows: CalendarRow[],
  gaps: CalendarGap[],
) {
  const title = word(descriptor.lane);
  if (!title || descriptor.table <= 0 || seen.has(descriptor.table)) return;
  const block = blocks.find((item) => item.type === "table" && item.line === descriptor.table);
  if (block?.type !== "table" || !block.rows.length) return;
  seen.add(block.line);
  const href = evidencePath(folder, entry, block.line);
  const gap = word(descriptor.gap);
  if (gap) {
    gaps.push({ owner, href, title, reason: gap });
    return;
  }
  if (!assessable) return;
  addPlacedEvents(block, entry, folder, owner, href, title, tables, blocks, rows, gaps);
}

function addPlacedEvents(
  block: Table,
  entry: OutputEntry,
  folder: string,
  owner: string,
  href: string,
  title: string,
  tables: ReturnType<typeof publishedTables>,
  blocks: Block[],
  rows: CalendarRow[],
  gaps: CalendarGap[],
) {
  const problem = tableProblem(block, blocks, tables);
  if (problem) {
    gaps.push({ owner, href, title, reason: problem });
    return;
  }
  const placed = placeEvents(block, entry, folder, owner);
  rows.push(...placed.rows);
  if (placed.reason) {
    const unplaced = placed.unplaced.length ? placed.unplaced : undefined;
    gaps.push({ owner, href, title, reason: placed.reason, unplaced });
  }
}

/** The as-of date as a timestamp, or null when it is not a real YYYY-MM-DD date. */
function asOfTimestamp(asOf: string | null | undefined) {
  if (!asOf || !/^\d{4}-\d{2}-\d{2}$/u.test(asOf)) return null;
  const timestamp = Date.parse(`${asOf}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== asOf) {
    return null;
  }
  return timestamp;
}

export function upcomingCalendarRows(rows: CalendarRow[], asOf: string | null) {
  const timestamp = asOfTimestamp(asOf);
  if (timestamp === null) return null;
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

const TABLE_HEAD = ["Event", "Date", "Status", "Credit relevance", "Module", "Evidence trace"];
const CAPTION =
  "Events keep their recorded status (Historical or Scheduled) regardless of the run’s as-of date. Dates can be precise to the day, month, quarter or year.";

function focusRow(id: string) {
  const row = document.getElementById(id);
  if (!row) return;
  row.focus();
  if (typeof row.scrollIntoView === "function") row.scrollIntoView({ block: "nearest" });
}

/** At 800px and below each row stacks as a block of label and value pairs; nothing scrolls. */
const STACK = "max-[800px]:block";
const CELL = cx(
  "px-3 py-1.5 text-left align-top max-[800px]:justify-items-start max-[800px]:grid max-[800px]:grid-cols-[7.5rem_minmax(0,1fr)] max-[800px]:gap-x-3 max-[800px]:px-0 max-[800px]:py-1",
  "max-[800px]:before:text-caption max-[800px]:before:text-text-tertiary max-[800px]:before:content-[attr(data-label)]",
);

function DateCell({ cells }: { cells: string[] }) {
  return (
    <td data-label="Date" className={CELL}>
      <span className="min-w-0">
        <span className="font-mono tabular-nums">{cells[0] || <Missing />}</span>{" "}
        <span className="text-text-tertiary">{cells[1]}</span>
        <span className="text-caption text-text-tertiary">
          {" · Published "}
          <span>{cells[2] || <Missing />}</span>
        </span>
      </span>
    </td>
  );
}

function EventsTable({ rows, rowId }: { rows: CalendarRow[]; rowId: (index: number) => string }) {
  return (
    <table className={cx("w-full border-collapse text-small", STACK)}>
      <caption className="sr-only">Published events</caption>
      <thead className="max-[800px]:sr-only">
        <tr className="border-b-2 border-border-hairline">
          {TABLE_HEAD.map((heading) => (
            <th
              key={heading}
              scope="col"
              className="px-3 py-2 text-left font-medium whitespace-nowrap text-text-tertiary"
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={STACK}>
        {rows.map(({ cells, owner, href }, index) => (
          <tr
            key={index}
            id={rowId(index)}
            tabIndex={-1}
            className="group/trace relative border-b border-border-hairline outline-hidden focus:ring-2 focus:ring-focus focus:ring-inset max-[800px]:block max-[800px]:px-3 max-[800px]:py-3"
          >
            <th
              scope="row"
              data-label="Event"
              className={cx(CELL, "font-medium max-[800px]:text-body")}
            >
              {eventName(cells)}
            </th>
            <DateCell cells={cells} />
            {[
              ["Status", cells[4]],
              ["Credit relevance", cells[6]],
              ["Module", owner],
            ].map(([label, value]) => (
              <td key={label} data-label={label} className={CELL}>
                <span className="min-w-0">{value || <Missing />}</span>
              </td>
            ))}
            <td data-label="Evidence trace" className={CELL}>
              <EventSource href={href} name={`${eventName(cells)} · ${owner}`} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function eventName(cells: string[]) {
  return cells[3] ?? "event";
}

function axisReading(events: EventRecord[], total: number) {
  const words = recordedRange(events);
  const count = total === 1 ? "1 dated event" : `${String(total)} dated events`;
  return words ? `${count}, ${words.first} to ${words.last}` : count;
}

/** From this viewport width up the table behind the axis starts open; on a phone it starts closed. */
const WIDE_QUERY = "(min-width: 641px)";

/** The table behind the axis, in a disclosure: open on a desktop, closed on a phone. */
function TableDisclosure({
  detailsRef,
  children,
}: {
  detailsRef: RefObject<HTMLDetailsElement | null>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(
    () => typeof window.matchMedia !== "function" || window.matchMedia(WIDE_QUERY).matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(WIDE_QUERY);
    const read = () => {
      setOpen(query.matches);
    };
    read();
    query.addEventListener("change", read);
    return () => {
      query.removeEventListener("change", read);
    };
  }, []);
  return (
    <details
      ref={detailsRef}
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="mb-2 flex min-h-8 cursor-pointer items-center text-small font-medium text-text-link max-[480px]:min-h-11">
        Table of events
      </summary>
      {children}
    </details>
  );
}

function CalendarFigure({ rows, asOf }: { rows: CalendarRow[]; asOf: string | null | undefined }) {
  const prefix = useId();
  const table = useRef<HTMLDetailsElement>(null);
  const rowId = (index: number) => `${prefix}-row-${String(index)}`;
  const events = eventRecords({
    line: 0,
    headers: EVENT_HEADERS,
    rows: rows.map(({ cells }) => cells),
  });
  const time = asOfTimestamp(asOf);
  const ordered = [...events].sort((a, b) => a.from - b.from || a.to - b.to);
  return (
    <>
      <Tile span={12} label="Dated events" title="Dated events">
        <p className="text-caption text-text-tertiary">{axisReading(ordered, events.length)}</p>
        <figure aria-label="Published events" className="grid min-w-0 gap-3">
          <EventAxis
            events={events}
            asOf={time === null || !asOf ? null : { time, text: asOf, label: asOfDate(asOf) }}
            rowId={rowId}
            onSelect={(index) => {
              if (table.current) table.current.open = true;
              focusRow(rowId(index));
            }}
          />
          <figcaption className="max-w-prose text-caption text-text-tertiary">{CAPTION}</figcaption>
        </figure>
      </Tile>
      <Tile span={12} label="Event list" title="Every event, in date order">
        <TableDisclosure detailsRef={table}>
          <EventsTable rows={rows} rowId={rowId} />
        </TableDisclosure>
      </Tile>
    </>
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
                <KitTable.Cell
                  key={at}
                  className={at === 0 || at === 2 ? "tabular-nums" : undefined}
                >
                  {value}
                </KitTable.Cell>
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

function GapTile({ gap }: { gap: CalendarGap }) {
  const { owner, href, title, reason, unplaced } = gap;
  return (
    <Tile span={12} label={title} tone="gap" className={TRACE_HOST}>
      <Well className="grid gap-3 bg-surface-card p-4">
        <h3 className="text-h4 font-medium text-text-primary">{title}</h3>
        <p className="text-small text-text-secondary">{owner}</p>
        <GapNote>
          <span role="note">
            {containsReference(reason)
              ? "An event gap is recorded in Evidence."
              : readerText(reason)}
          </span>
        </GapNote>
        {unplaced ? (
          <UnplacedTable owner={owner} events={unplaced} />
        ) : (
          <EventSource href={href} name={title} />
        )}
      </Well>
    </Tile>
  );
}

function emptySentence(calendar: ReturnType<typeof buildCalendar>) {
  if (calendar.gaps.some(({ unplaced }) => unplaced?.some((event) => !event.unreadable))) {
    return "No published events could be plotted. See the events and recorded gaps below.";
  }
  return calendar.gaps.length
    ? "No events could be plotted. See the recorded gaps below."
    : "No dated events were published for this run.";
}

export function Calendar({
  calendar,
  asOf,
}: {
  calendar: ReturnType<typeof buildCalendar>;
  asOf?: string | null;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <h2 className="font-display text-h3 text-text-primary">Issuer calendar</h2>
        <a
          href="#overview"
          className="inline-flex min-h-8 items-center rounded-ds-sm text-small text-text-secondary underline underline-offset-4 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus max-[480px]:min-h-11"
        >
          Overview
        </a>
      </div>
      <Bento>
        {calendar.rows.length ? (
          <CalendarFigure rows={calendar.rows} asOf={asOf} />
        ) : (
          <Tile span={12} label="Dated events" tone="gap">
            <GapNote>{emptySentence(calendar)}</GapNote>
          </Tile>
        )}
        {calendar.gaps.map((gap) => (
          <GapTile key={gap.href} gap={gap} />
        ))}
      </Bento>
    </>
  );
}
