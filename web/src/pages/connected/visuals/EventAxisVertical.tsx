import { cx } from "@/utils/cx";
import {
  endOf,
  isPeriod,
  Mark,
  SPAN_STYLE,
  type EventRecord,
  type recordedRange,
} from "./EventLane";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BRACKET_PX = 10;
const RAIL_PX = 32;

/** `text` is the date as recorded; `label`, when given, is how the rule's words write it. */
type AsOf = { time: number; text: string; label?: string };

type Item =
  | { kind: "month"; key: string; label: string }
  | { kind: "asOf"; key: string; asOf: AsOf }
  | { kind: "event"; key: string; event: EventRecord };

type Group = { key: string; label: string; start: number; rank: number };

/**
 * The heading an event sits under, from its own recorded precision: a day or month event under
 * its month, a quarter under its own quarter and a year under its own year. A heading is never
 * a month the handoff does not state.
 */
function monthGroup(time: number): Group {
  const at = new Date(time);
  const month = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
  return {
    key: `month-${String(month.getUTCFullYear())}-${String(month.getUTCMonth()).padStart(2, "0")}`,
    label: `${MONTHS[month.getUTCMonth()] ?? ""} ${String(month.getUTCFullYear())}`,
    start: month.getTime(),
    rank: 2,
  };
}

function groupOf(event: EventRecord): Group {
  const { precision, date, from } = event;
  if (precision === "year") return { key: `year-${date}`, label: date, start: from, rank: 0 };
  if (precision === "quarter") {
    return { key: `quarter-${date}`, label: date.replace("-Q", " Q"), start: from, rank: 1 };
  }
  return monthGroup(from);
}

type Stop = { time: number; group: Group } & (
  { kind: "event"; event: EventRecord } | { kind: "asOf"; asOf: AsOf }
);

/**
 * The heading the as-of rule sits under: its month when an event already heads that month,
 * otherwise the narrowest quarter or year event period it falls in, but only while no event in a
 * later heading starts on or before it; otherwise its own month, so it keeps true date order.
 */
function asOfGroup(stops: Stop[], asOf: AsOf): Group {
  const month = monthGroup(asOf.time);
  if (stops.some(({ group }) => group.key === month.key)) return month;
  const events = stops.flatMap((stop) => (stop.kind === "event" ? [stop] : []));
  const [period] = events
    .filter(({ event }) => event.from <= asOf.time && asOf.time < endOf(event))
    .map(({ group }) => group)
    .filter(({ rank }) => rank < 2)
    .sort((a, b) => b.rank - a.rank);
  if (!period) return month;
  const passed = events.some(
    ({ group, event }) => byGroup(period, group) < 0 && event.from <= asOf.time,
  );
  return passed ? month : period;
}

const byGroup = (a: Group, b: Group) =>
  a.start - b.start || a.rank - b.rank || a.key.localeCompare(b.key);

/** Within one heading: by date; the rule follows a period dated the same day and precedes a day. */
function inGroup(a: Stop, b: Stop) {
  if (a.kind === "event" && b.kind === "event") {
    return a.event.from - b.event.from || a.event.to - b.event.to || a.event.index - b.event.index;
  }
  const rule = a.kind === "asOf" ? a : b;
  const event = a.kind === "asOf" ? b : a;
  if (rule.kind !== "asOf" || event.kind !== "event") return 0;
  const apart = rule.asOf.time - event.event.from;
  const before = apart < 0 || (apart === 0 && !isPeriod(event.event));
  return (a.kind === "asOf") === before ? -1 : 1;
}

/** Events grouped under their period's heading, headings in time order of the period start. */
function sequence(events: EventRecord[], asOf: AsOf | null): Item[] {
  const stops: Stop[] = events.map((event) => ({
    time: event.from,
    group: groupOf(event),
    kind: "event" as const,
    event,
  }));
  if (asOf) {
    stops.push({ time: asOf.time, group: asOfGroup(stops, asOf), kind: "asOf", asOf });
  }
  stops.sort((a, b) => byGroup(a.group, b.group) || inGroup(a, b));
  const items: Item[] = [];
  let heading = "";
  for (const stop of stops) {
    if (stop.group.key !== heading) {
      heading = stop.group.key;
      items.push({ kind: "month", key: `month-${heading}`, label: stop.group.label });
    }
    items.push(
      stop.kind === "event"
        ? { kind: "event", key: `event-${String(stop.event.index)}`, event: stop.event }
        : { kind: "asOf", key: "as-of", asOf: stop.asOf },
    );
  }
  return items;
}

type Bracket = { event: EventRecord; column: number; first: number; last: number };

/**
 * A period is a bracket from its own row to the last row dated inside it, in its own column. The
 * as-of rule counts as dated inside a period it falls in, so the rule reads as within the period.
 */
function brackets(items: Item[]): { drawn: Bracket[]; columns: number } {
  const ends: number[] = [];
  const drawn: Bracket[] = [];
  items.forEach((item, at) => {
    if (item.kind !== "event" || !isPeriod(item.event)) return;
    const { event } = item;
    // Items after the period's row are dated at or after its start, so only its end needs testing.
    const inside = items.flatMap((other, to) => {
      if (to < at || other.kind === "month") return [];
      const time = other.kind === "event" ? other.event.from : other.asOf.time;
      return time < endOf(event) ? [to] : [];
    });
    const last = Math.max(at, ...inside);
    const free = ends.findIndex((end) => end < at);
    const column = free === -1 ? ends.length : free;
    ends[column] = last;
    drawn.push({ event, column, first: at, last });
  });
  return { drawn, columns: ends.length };
}

function RailRow({
  item,
  rowId,
  onSelect,
}: {
  item: Extract<Item, { kind: "event" }>;
  rowId: (index: number) => string;
  onSelect: (index: number) => void;
}) {
  const { event } = item;
  const { date, precision, status, category } = event;
  return (
    <button
      type="button"
      aria-label={`${event.event}, ${date}, ${precision}, ${status}`}
      aria-controls={rowId(event.index)}
      data-event-category={category}
      data-event-precision={precision}
      data-event-shape={isPeriod(event) ? "span" : "mark"}
      className="group grid min-h-11 w-full cursor-pointer grid-cols-[2rem_minmax(0,1fr)] items-start rounded-ds-sm text-left focus-visible:ring-2 focus-visible:ring-focus"
      onClick={() => {
        onSelect(event.index);
      }}
    >
      <span className="flex justify-center pt-3.5">
        <span className="flex rounded-ds-full bg-surface-card p-1 group-hover:ring-2 group-hover:ring-focus">
          <Mark category={category} />
        </span>
      </span>
      <span className="grid min-w-0 py-1.5">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-caption text-text-secondary tabular-nums">{date}</span>
          <span className="min-w-0 text-small font-medium text-text-primary">{event.event}</span>
        </span>
        <span className="text-caption text-text-tertiary">{status}</span>
      </span>
    </button>
  );
}

/** The as-of rule across the whole width; its words start clear of the period brackets. */
function AsOfRow({ asOf, columns }: { asOf: AsOf; columns: number }) {
  return (
    <div className="relative flex h-7 items-center text-caption font-medium text-action">
      <span
        data-as-of-rule={asOf.text}
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 border-t-2 border-action"
      />
      <span
        data-as-of-label=""
        className="relative bg-surface-card px-1.5 whitespace-nowrap"
        style={{ marginLeft: `${String(columns * BRACKET_PX)}px` }}
      >{`As of ${asOf.label ?? asOf.text}`}</span>
    </div>
  );
}

/**
 * The calendar on a phone: time runs down the page in date order. A left rail carries a mark per
 * event, a bracket per period and the month labels; the as-of date is a horizontal rule in place.
 */
export function VerticalAxis({
  events,
  asOf,
  label,
  words,
  rowId,
  onSelect,
}: {
  events: EventRecord[];
  asOf: AsOf | null;
  label: string;
  words: ReturnType<typeof recordedRange>;
  rowId: (index: number) => string;
  onSelect: (index: number) => void;
}) {
  const items = sequence(events, asOf);
  const { drawn, columns } = brackets(items);
  const rail = columns + 1;
  return (
    <div role="group" aria-label={label} data-testid="event-axis" className="grid min-w-0 gap-2">
      <div
        className="grid gap-x-0"
        style={{
          gridTemplateColumns: `repeat(${String(columns)}, ${String(BRACKET_PX)}px) ${String(RAIL_PX)}px minmax(0, 1fr)`,
        }}
      >
        <div
          aria-hidden="true"
          className="justify-self-center border-l border-border-hairline"
          style={{ gridColumn: rail, gridRow: `1 / span ${String(Math.max(items.length, 1))}` }}
        />
        {drawn.map(({ event, column, first, last }) => (
          <div
            key={event.index}
            aria-hidden="true"
            data-span-bracket={event.event}
            className={cx("mx-0.5 my-1 rounded-ds-xs border", SPAN_STYLE[event.category])}
            style={{
              gridColumn: column + 1,
              gridRow: `${String(first + 1)} / ${String(last + 2)}`,
            }}
          />
        ))}
        {/* Safari drops list semantics from an ol styled with list-style: none, so the role is kept. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
        <ol
          role="list"
          aria-label="Events in date order"
          className="grid grid-cols-subgrid grid-rows-subgrid"
          style={{ gridColumn: "1 / -1", gridRow: `1 / span ${String(Math.max(items.length, 1))}` }}
        >
          {items.map((item, at) => (
            <li
              key={item.key}
              data-rail-month={item.kind === "month" ? "" : undefined}
              className="relative z-10 min-w-0"
              style={{
                gridColumn: item.kind === "asOf" ? "1 / -1" : `${String(rail)} / -1`,
                gridRow: at + 1,
              }}
            >
              {item.kind === "event" ? (
                <RailRow item={item} rowId={rowId} onSelect={onSelect} />
              ) : item.kind === "month" ? (
                <h4 className="flex h-7 items-center gap-2 text-caption font-medium text-text-tertiary tabular-nums">
                  <span aria-hidden="true" className="flex w-8 flex-none justify-center">
                    <span className="w-3 border-t border-text-tertiary" />
                  </span>
                  {item.label}
                </h4>
              ) : (
                <AsOfRow asOf={item.asOf} columns={columns} />
              )}
            </li>
          ))}
        </ol>
      </div>
      {words ? (
        <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-1.5 text-caption text-text-secondary">
          <span>Axis range</span>
          <span className="flex gap-1 font-mono tabular-nums">
            <span data-axis-end="start">{words.first}</span>
            <span aria-hidden="true">to</span>
            <span data-axis-end="end">{words.last}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
