import { ArrowRight, Calendar as CalendarIcon } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { buildCalendar, upcomingCalendarRows } from "../Calendar";
import { asOfDate } from "../../runFigures";
import { cx } from "@/utils/cx";
import { TextLink, textLinkClass } from "../../../run/TextLink";
import { PublishedSource } from "../PublishedTrace";
import { labelText, readerCell } from "./notes";
import { GapNote, GapSentence, Tile } from "./Tile";

type RowProps = { snapshot: Snapshot; run: PublishedRun; view: ReportView };
type WatchRow = NonNullable<ReturnType<typeof upcomingCalendarRows>>[number];

const SHOWN = 5;
/** Marks nearer than this share of the axis go on separate lanes so they never overprint. */
const NEAR = 18;
const LANES = 3;
const LANE = 30;

/**
 * One dated event as the reader sees it. Rows from several modules are one event only when they
 * state the same date, name, status, relevance and timing note; an unnamed row is never merged.
 */
type Event = { key: string; date: string; name: string; from: number; rows: WatchRow[] };

/** What the Calendar draws for a name that only cites a register; it says nothing about the event. */
const PLACEHOLDER_NAME = "See Evidence";

function events(rows: readonly WatchRow[]): Event[] {
  const found = new Map<string, Event>();
  for (const [at, row] of rows.entries()) {
    const name = row.cells[3] ? labelText(row.cells[3], "An event") : "Dated event";
    const facts = [row.cells[0], row.cells[3], row.cells[4], row.cells[6]].map(
      (cell) => cell ?? "",
    );
    const key =
      row.cells[3] && row.cells[3] !== PLACEHOLDER_NAME
        ? JSON.stringify([...facts, row.timingWithinRecordedPeriod])
        : `unnamed-${String(at)}`;
    const known = found.get(key);
    if (known) known.rows.push(row);
    else found.set(key, { key, date: row.cells[0] ?? "", name, from: row.from, rows: [row] });
  }
  return [...found.values()];
}

const shown = (date: string) => asOfDate(date);
const owners = (event: Event) => [...new Set(event.rows.map((row) => row.owner))];

/** The events of one day share one mark, numbered by their places in the list below. */
type Mark = { key: string; from: number; numbers: number[] };

function dayMarks(list: readonly Event[]): Mark[] {
  const days = new Map<number, Mark>();
  for (const [at, event] of list.entries()) {
    const known = days.get(event.from);
    if (known) known.numbers.push(at + 1);
    else days.set(event.from, { key: event.key, from: event.from, numbers: [at + 1] });
  }
  return [...days.values()];
}

/** A mark's numbers: "3", or "1–2" for a run of consecutive places, else "1, 3". */
function numbersText(numbers: readonly number[]) {
  const first = numbers[0] ?? 0;
  const last = numbers.at(-1) ?? first;
  if (numbers.length === 1) return String(first);
  const consecutive = numbers.every((n, at) => n === first + at);
  return consecutive ? `${String(first)}–${String(last)}` : numbers.join(", ");
}

/** Where each mark falls between the first and the last, and the lane that keeps it clear. */
function positions(marks: readonly Mark[]) {
  const start = Math.min(...marks.map((mark) => mark.from));
  const span = Math.max(...marks.map((mark) => mark.from)) - start;
  const ends: number[] = [];
  return marks.map((mark) => {
    const left = span === 0 ? 50 : ((mark.from - start) / span) * 100;
    const free = ends.findIndex((end) => left - end >= NEAR);
    const lane = free >= 0 ? free : Math.min(ends.length, LANES - 1);
    ends[lane] = left;
    return { ...mark, left, lane };
  });
}

/** The first of January of each year the axis crosses. */
function yearTicks(list: readonly Event[]) {
  const start = Math.min(...list.map((event) => event.from));
  const end = Math.max(...list.map((event) => event.from));
  const ticks: { year: number; left: number }[] = [];
  for (
    let year = new Date(start).getUTCFullYear() + 1;
    year <= new Date(end).getUTCFullYear();
    year++
  )
    ticks.push({ year, left: ((Date.UTC(year, 0, 1) - start) / (end - start)) * 100 });
  // A year next to either end would print over that end's date.
  return ticks.filter(({ left }) => left > 10 && left < 90);
}

/** The dates at the axis ends; one date is labelled once, under its mark in the middle. */
function AxisEnds({ list }: { list: readonly Event[] }) {
  const first = list.reduce((a, b) => (b.from < a.from ? b : a));
  const last = list.reduce((a, b) => (b.from > a.from ? b : a));
  const label = "absolute bottom-0 font-mono text-caption text-text-tertiary tabular-nums";
  if (first.from === last.from)
    return (
      <span data-axis-label className={`${label} left-1/2 -translate-x-1/2`}>
        {shown(first.date)}
      </span>
    );
  return (
    <>
      <span data-axis-label className={`${label} left-0`}>
        {shown(first.date)}
      </span>
      <span data-axis-label className={`${label} right-0`}>
        {shown(last.date)}
      </span>
    </>
  );
}

/**
 * A true time axis: one numbered mark per day, placed by date, each on a lane that keeps it clear
 * of its neighbours. Names are in the numbered list under the axis, never cut on the axis.
 */
function Axis({ list }: { list: readonly Event[] }) {
  const marks = positions(dayMarks(list));
  const lanes = Math.max(...marks.map(({ lane }) => lane)) + 1;
  // Room above the line for each lane's ring; the dates sit under the line.
  const line = 8 + lanes * LANE;
  return (
    <div aria-hidden="true" className="relative mx-4" style={{ height: `${String(line + 36)}px` }}>
      <span
        className="absolute inset-x-0 border-t border-connector"
        style={{ top: `${String(line)}px` }}
      />
      {yearTicks(list).map(({ year, left }) => (
        <span
          key={year}
          className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5"
          style={{ left: `${String(left)}%`, top: `${String(line - 6)}px` }}
        >
          <span className="h-3 border-l border-connector" />
          <span className="font-mono text-caption text-text-tertiary tabular-nums">{year}</span>
        </span>
      ))}
      {marks.map(({ key, left, lane, numbers }) => (
        <span
          key={key}
          data-mark
          className="absolute -translate-x-1/2"
          style={{ left: `${String(left)}%`, top: `${String(line - 12 - lane * LANE)}px` }}
        >
          <span className="flex h-6 min-w-6 items-center justify-center rounded-ds-full border-2 border-action bg-surface-card px-1 font-mono text-caption whitespace-nowrap text-text-primary tabular-nums">
            {numbersText(numbers)}
          </span>
        </span>
      ))}
      <AxisEnds list={list} />
    </div>
  );
}

/**
 * Which modules recorded the event. One is named; several are counted and sent to the Calendar,
 * which lists each module's own row with its own source, so the list here keeps one trace an event.
 */
function Recorded({ modules }: { modules: readonly string[] }) {
  const [only] = modules;
  if (modules.length <= 1)
    return only ? (
      <p className="text-caption text-text-secondary">{`Recorded by ${only}`}</p>
    ) : null;
  const count = `Recorded by ${String(modules.length)} modules`;
  return (
    <a
      className={cx(
        textLinkClass(true),
        "inline-flex min-h-8 w-fit items-center text-caption max-[480px]:min-h-11",
      )}
      href="#calendar"
    >
      {count}
      <span className="sr-only">{`: ${modules.join(", ")}. Open the issuer calendar`}</span>
    </a>
  );
}

function EventItem({ event, index }: { event: Event; index: number }) {
  const [row] = event.rows;
  const kind = row?.cells[6] ? readerCell(row.cells[6]) : null;
  const status = row?.cells[4] ? readerCell(row.cells[4]) : null;
  const name = `${event.name} on ${shown(event.date)}`;
  return (
    <li className="flex items-start justify-between gap-2 border-t border-border-hairline pt-3">
      <div className="grid min-w-0 content-start gap-1">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-5 flex-none items-center justify-center rounded-ds-full border border-action font-mono text-caption text-text-primary tabular-nums"
          >
            {index + 1}
          </span>
          <span className="font-mono text-small text-text-primary tabular-nums">
            {shown(event.date)}
          </span>
        </p>
        <p className="text-body font-medium text-text-primary">{event.name}</p>
        {kind && <p className="text-caption text-text-secondary">{kind}</p>}
        {status && <p className="text-caption text-text-secondary">{status}</p>}
        {row?.timingWithinRecordedPeriod && (
          <p className="text-caption text-text-secondary">
            Timing falls within the recorded period; the exact date is unresolved.
          </p>
        )}
        <Recorded modules={owners(event)} />
      </div>
      {/* One trace an event: the first module's row. The Calendar holds every module's row. */}
      {row && (
        <PublishedSource
          href={row.href}
          name={`${name} from ${row.owner}`}
          linkLabel={`Source for ${name} from ${row.owner}`}
        >
          View source
        </PublishedSource>
      )}
    </li>
  );
}

function Watch({ rows }: { rows: readonly WatchRow[] | null }) {
  if (rows === null)
    return (
      <div role="status">
        <GapSentence>This run needs a valid as-of date to identify upcoming events.</GapSentence>
      </div>
    );
  if (rows.length === 0)
    return (
      <div role="status">
        <GapSentence>No recorded event dates fall on or after this run’s as-of date.</GapSentence>
      </div>
    );
  const all = events(rows);
  const list = all.slice(0, SHOWN);
  const more = all.length - list.length;
  return (
    <>
      <Axis list={list} />
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        {list.map((event, index) => (
          <EventItem key={event.key} event={event} index={index} />
        ))}
      </ol>
      {more > 0 && (
        <TextLink
          className="inline-flex min-h-8 w-fit items-center text-small max-[480px]:min-h-11"
          href="#calendar"
        >
          {`${String(more)} later ${more === 1 ? "event" : "events"} in the Calendar`}
        </TextLink>
      )}
    </>
  );
}

/**
 * The recorded events the axis could not place (no date, "TBD", a half year), counted beside the
 * dated ones and sent to the Calendar, which lists them; never left unmentioned.
 */
function Undated({ gaps }: { gaps: ReturnType<typeof buildCalendar>["gaps"] }) {
  if (gaps.length === 0) return null;
  const count = gaps.reduce((sum, gap) => sum + (gap.unplaced?.length ?? 0), 0);
  const words =
    count > 0
      ? `${String(count)} recorded ${count === 1 ? "event" : "events"} could not be placed on the axis; see the Calendar`
      : "Some recorded events could not be placed; see the Calendar";
  return (
    <TextLink
      className="inline-flex min-h-8 w-fit items-center text-small max-[480px]:min-h-11"
      href="#calendar"
    >
      {words}
    </TextLink>
  );
}

/** Dates to watch on a true time axis; a run with no recorded dates says so in place. */
export function DatesRow({ run, view }: RowProps) {
  const calendar = buildCalendar(view.entries, run.folder);
  return (
    <Tile span={12} label="Dates to watch">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3
          id="overview-dates"
          tabIndex={-1}
          className="flex items-center gap-2.5 text-small font-medium text-text-primary"
        >
          <CalendarIcon aria-hidden="true" className="size-4 text-text-secondary" />
          Dates to watch
        </h3>
        <Button
          href="#calendar"
          color="secondary"
          size="sm"
          iconTrailing={ArrowRight}
          className="max-[480px]:min-h-11"
        >
          Open issuer calendar
        </Button>
      </div>
      {calendar.rows.length === 0 && calendar.gaps.length > 0 ? (
        <GapNote>
          No recorded event could be placed on the time axis. The issuer calendar lists the recorded
          gaps.
        </GapNote>
      ) : calendar.rows.length === 0 ? (
        <div role="status">
          <GapSentence>No dated events were recorded in this run.</GapSentence>
        </div>
      ) : (
        <Watch rows={upcomingCalendarRows(calendar.rows, run.asOf)} />
      )}
      {calendar.rows.length > 0 && <Undated gaps={calendar.gaps} />}
    </Tile>
  );
}
