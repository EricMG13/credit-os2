import { ChevronDown } from "@untitledui/icons";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { StatusShape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import type { SourceTable } from "./visualData";

export const EVENT_HEADERS = [
  "Event date",
  "Date precision",
  "Published",
  "Event",
  "Status",
  "Source",
  "Credit relevance",
];

export const EVENT_LANES = ["Historical", "Scheduled", "Scenario", "User reminder"] as const;
const DAY = 86_400_000;

/** A day event is a point; one that only records a period keeps the period's width. */
export const isPeriod = (event: { from: number; to: number }) => event.to > event.from;
/** The end of the drawn extent: a period runs to the end of its last day. */
export const endOf = (event: { from: number; to: number }) =>
  isPeriod(event) ? event.to + DAY : event.from;

/**
 * The range the events cover, in the events' own recorded date text: the first event's date and
 * the date of the event that reaches furthest. Null when they read the same, so a lone event
 * prints no range. No computed or padded date is ever returned.
 */
export function recordedRange(events: { date: string; from: number; to: number }[]) {
  const first = events.reduce<(typeof events)[number] | null>(
    (best, event) => (!best || event.from < best.from ? event : best),
    null,
  );
  const last = events.reduce<(typeof events)[number] | null>(
    (best, event) =>
      !best ||
      endOf(event) > endOf(best) ||
      (endOf(event) === endOf(best) && event.from >= best.from)
        ? event
        : best,
    null,
  );
  return first && last && first.date !== last.date ? { first: first.date, last: last.date } : null;
}

/** How a span is drawn, by recorded status category. */
export const SPAN_STYLE: Record<(typeof EVENT_LANES)[number], string> = {
  Historical: "border-text-tertiary bg-surface-subtle",
  Scheduled: "border-action bg-chart-1/50",
  Scenario: "border-dashed border-action bg-surface-card",
  "User reminder": "border-action bg-surface-card",
};

function dayOf(text: string) {
  const date = Date.parse(text);
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === text ? date : null;
}

function periodParts(date: string, precision: string) {
  const patterns: Partial<Record<string, RegExp>> = {
    year: /^(\d{4})$/,
    quarter: /^(\d{4})-Q([1-4])$/,
    month: /^(\d{4})-(0[1-9]|1[0-2])$/,
  };
  const pattern = Object.hasOwn(patterns, precision) ? patterns[precision] : undefined;
  const match = pattern?.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const part = Number(match[2]);
  const month = precision === "year" ? 1 : precision === "quarter" ? (part - 1) * 3 + 1 : part;
  const length = precision === "year" ? 12 : precision === "quarter" ? 3 : 1;
  return { year, month, length };
}

function dateSpan(date: string, precision: string) {
  if (precision === "day") {
    const from = /^\d{4}-\d{2}-\d{2}$/.test(date) ? dayOf(date) : null;
    return from === null ? null : { from, to: from };
  }
  const period = periodParts(date, precision);
  if (!period) return null;
  const from = dayOf(`${String(period.year)}-${String(period.month).padStart(2, "0")}-01`);
  if (from === null) return null;
  const end = new Date(from);
  end.setUTCFullYear(period.year, period.month - 1 + period.length, 1);
  return { from, to: end.getTime() - DAY };
}

export function eventRecords(table: SourceTable) {
  if (table.headers.join("\0") !== EVENT_HEADERS.join("\0")) return [];
  return table.rows.flatMap(
    (
      [
        date = "",
        precision = "",
        published = "",
        event = "",
        status = "",
        source = "",
        relevance = "",
      ],
      index,
    ) => {
      const category = EVENT_LANES.find(
        (lane) => status === lane || status.startsWith(`${lane} — `),
      );
      const span = dateSpan(date, precision);
      if (!category || !event || !span) return [];
      return [
        { index, date, precision, published, event, status, source, relevance, category, ...span },
      ];
    },
  );
}

export type EventRecord = ReturnType<typeof eventRecords>[number];
type Active = { index: number; from: "row" | "marker" } | null;

function activeHandlers(onActive: (active: boolean) => void) {
  return {
    onMouseEnter: () => {
      onActive(true);
    },
    onMouseLeave: () => {
      onActive(false);
    },
    onFocus: () => {
      onActive(true);
    },
    onBlur: () => {
      onActive(false);
    },
  };
}

const MARK_SHAPES = {
  Historical: "filled circle",
  Scheduled: "half-filled circle",
  "User reminder": "ring",
} as const;

export function Mark({ category }: { category: EventRecord["category"] }) {
  const shape = category === "Scenario" ? null : MARK_SHAPES[category];
  const tint = category === "Historical" ? "text-text-tertiary" : "text-action";
  return (
    <span aria-hidden="true" className={cx("inline-flex flex-none", tint)}>
      {shape ? (
        <StatusShape shape={shape} />
      ) : (
        <svg
          viewBox="0 0 10 10"
          width={10}
          height={10}
          aria-hidden="true"
          data-shape="diamond outline"
          className="shrink-0"
        >
          <polygon
            points="5,0.75 9.25,5 5,9.25 0.75,5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </span>
  );
}

function yearOf(event: EventRecord) {
  return Number(event.date.slice(0, 4));
}

function byYear(events: EventRecord[]) {
  const groups: { year: number; events: EventRecord[] }[] = [];
  for (const event of events) {
    const last = groups.at(-1);
    if (last?.year === yearOf(event)) last.events.push(event);
    else groups.push({ year: yearOf(event), events: [event] });
  }
  return groups;
}

function yearGaps(events: EventRecord[]) {
  const years = [...new Set(events.map(yearOf))].sort((a, b) => a - b);
  return years.flatMap((year, at) => {
    const next = years[at + 1];
    return next !== undefined && next - year > 1 ? [{ from: year + 1, to: next - 1 }] : [];
  });
}

function gapText(from: number, to: number) {
  return `No events ${String(from)}${to > from ? ` to ${String(to)}` : ""}`;
}

function Gap({ from, to }: { from: number; to: number }) {
  return (
    <span className="flex items-start px-1 text-text-tertiary">
      <span aria-hidden="true">⋯</span>
      <span className="sr-only">{gapText(from, to)}</span>
    </span>
  );
}

function focusRow(id: string) {
  const row = document.getElementById(id);
  if (!row) return;
  row.focus();
  if (typeof row.scrollIntoView === "function") row.scrollIntoView({ block: "nearest" });
}

function Marker({
  event,
  rowId,
  lit,
  onActive,
}: {
  event: EventRecord;
  rowId: string;
  lit: boolean;
  onActive: (active: boolean) => void;
}) {
  const { date, precision, status, category } = event;
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={`${event.event}, ${date}, ${precision}, ${status}`}
      aria-controls={rowId}
      data-event-category={category}
      data-event-precision={precision}
      data-active={lit}
      // 24 px mark, 32 px to a pointer: the touch area reaches 4 px past it.
      className="relative flex size-6 items-center justify-center rounded-ds-full after:absolute after:-inset-1 data-[active=true]:ring-2 data-[active=true]:ring-focus max-[480px]:pointer-events-none"
      onClick={() => {
        focusRow(rowId);
      }}
      {...activeHandlers(onActive)}
    >
      <Mark category={category} />
    </button>
  );
}

export type Hidden = ReadonlySet<EventRecord["category"]>;

/** The one category legend: toggles with 32px targets (44px on a phone). */
export function Legend({
  events,
  hidden,
  onToggle,
}: {
  events: EventRecord[];
  hidden: Hidden;
  onToggle: (category: EventRecord["category"]) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Show categories"
      className="flex flex-wrap gap-x-2 gap-y-1 text-small"
    >
      {EVENT_LANES.map((lane) => {
        const count = events.filter((event) => event.category === lane).length;
        const off = hidden.has(lane);
        return count ? (
          <button
            key={lane}
            type="button"
            aria-pressed={!off}
            aria-label={`${lane}, ${String(count)} ${count === 1 ? "event" : "events"}`}
            className={cx(
              "flex min-h-8 min-w-8 cursor-pointer items-center gap-1.5 rounded-ds-sm px-2 focus-visible:ring-2 focus-visible:ring-focus max-[480px]:min-h-11 max-[480px]:min-w-11",
              off ? "text-text-tertiary" : "text-text-secondary",
            )}
            onClick={() => {
              onToggle(lane);
            }}
          >
            <span className={cx("flex", off && "opacity-40 grayscale")}>
              <Mark category={lane} />
            </span>
            <span aria-hidden="true">
              {lane} <span className="tabular-nums">{count}</span>
            </span>
          </button>
        ) : null;
      })}
    </div>
  );
}

type Drawing = {
  events: EventRecord[];
  evidenceInDrawer: boolean;
  rowDetail?: (index: number) => ReactNode;
};

function YearStrip({
  events: all,
  hidden,
  onToggle,
  groups,
  active,
  rowId,
  setActive,
}: {
  events: EventRecord[];
  hidden: Hidden;
  onToggle: (category: EventRecord["category"]) => void;
  groups: ReturnType<typeof byYear>;
  active: Active;
  rowId: (index: number) => string;
  setActive: (active: Active) => void;
}) {
  const strip = groups.length
    ? [...groups, ...yearGaps(all)].sort(
        (a, b) => ("from" in a ? a.from : a.year) - ("from" in b ? b.from : b.year),
      )
    : [];
  return (
    <div role="group" aria-label="Events by year" className="grid gap-2">
      <Legend events={all} hidden={hidden} onToggle={onToggle} />
      <div className="flex flex-wrap items-start gap-x-2 gap-y-3">
        {strip.map((item) => {
          if ("from" in item) return <Gap key={`gap-${String(item.from)}`} {...item} />;
          const { year, events } = item;
          return (
            <div key={year} className="contents">
              <div
                role="group"
                aria-label={`${String(year)}, ${events.length === 1 ? "1 event" : `${String(events.length)} events`}`}
                className="grid gap-1"
              >
                <div className="flex max-w-[7.5rem] flex-wrap gap-2">
                  {events.map((event) => (
                    <Marker
                      key={event.index}
                      event={event}
                      rowId={rowId(event.index)}
                      lit={active?.index === event.index && active.from === "row"}
                      onActive={(on) => {
                        setActive(on ? { index: event.index, from: "marker" } : null);
                      }}
                    />
                  ))}
                </div>
                <span className="text-small tabular-nums text-text-secondary">{year}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({
  event,
  rowId,
  panelId,
  open,
  lit,
  showSource,
  rowDetail,
  onToggle,
  onActive,
}: {
  event: EventRecord;
  rowId: string;
  panelId: string;
  open: boolean;
  lit: boolean;
  showSource: boolean;
  rowDetail: Drawing["rowDetail"];
  onToggle: () => void;
  onActive: (active: boolean) => void;
}) {
  const wide = rowDetail ? "" : "col-span-2 @3xl:col-span-1";
  return (
    <li
      id={rowId}
      tabIndex={-1}
      data-active={lit}
      className={cx(
        "grid gap-x-3 gap-y-1 border-t border-border-hairline py-2 @3xl:py-1 text-small first:border-t-0 outline-hidden focus:ring-2 focus:ring-focus focus:ring-inset data-[active=true]:bg-action-subtle @3xl:items-start",
        rowDetail ? "" : "grid-cols-[minmax(0,1fr)_auto]",
        rowDetail
          ? "@3xl:grid-cols-[7.5rem_auto_minmax(0,5fr)_minmax(0,4fr)_13rem_auto]"
          : "@3xl:grid-cols-[7.5rem_auto_minmax(0,5fr)_minmax(0,4fr)_auto]",
      )}
      {...activeHandlers(onActive)}
    >
      <div className="flex items-center gap-2 @3xl:contents">
        <span className="tabular-nums text-text-secondary">
          {event.date} · {event.precision}
        </span>
        <span className="flex items-center gap-1 self-center text-text-secondary @3xl:h-[22px] @3xl:self-start">
          <Mark category={event.category} />
          <span>{event.category}</span>
        </span>
      </div>
      <span className={cx("min-w-0 font-medium break-words", wide)}>{event.event}</span>
      <span className={cx("min-w-0 break-words text-text-secondary", wide)}>{event.relevance}</span>
      <div
        className={cx(
          "flex flex-wrap items-center gap-5 @3xl:contents",
          !rowDetail && "col-start-2 row-start-1",
        )}
      >
        {rowDetail ? <div className="min-w-0 @3xl:-my-[3px]">{rowDetail(event.index)}</div> : null}
        <button
          type="button"
          aria-label={`Details for ${event.event}`}
          aria-expanded={open}
          aria-controls={panelId}
          className="relative flex size-8 flex-none cursor-pointer items-center justify-center self-center rounded-ds-sm border border-transparent bg-transparent text-text-tertiary transition-colors duration-150 hover:border-border-control hover:bg-action-subtle hover:text-action focus-visible:border-border-control focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none @3xl:-my-[3px] @3xl:self-start max-[480px]:z-10 max-[480px]:after:absolute max-[480px]:after:-inset-[7px]"
          onClick={onToggle}
        >
          <ChevronDown aria-hidden="true" className={cx("size-4", open && "rotate-180")} />
        </button>
      </div>
      <div
        id={panelId}
        hidden={!open}
        className={cx("grid gap-0.5 text-text-secondary @3xl:col-start-3 @3xl:col-end-[-1]", wide)}
      >
        <p>{event.status}</p>
        <p>Published {event.published}</p>
        {showSource ? <p>{event.source}</p> : null}
      </div>
    </li>
  );
}

function EventDrawing({ events, evidenceInDrawer, rowDetail }: Drawing) {
  const prefix = useId();
  const [active, setActive] = useState<Active>(null);
  const [opened, setOpened] = useState<ReadonlySet<number>>(new Set());
  const all = events.every((event) => opened.has(event.index));
  const [hidden, setHidden] = useState<Hidden>(new Set());
  const groups = byYear(events.filter((event) => !hidden.has(event.category)));
  const toggleCategory = (category: EventRecord["category"]) => {
    setActive(null);
    setHidden((prev) => {
      const next = new Set(prev);
      if (!next.delete(category)) next.add(category);
      return next;
    });
  };
  const rowId = (index: number) => `${prefix}-row-${String(index)}`;
  const toggle = (index: number) => {
    setOpened((prev) => {
      const next = new Set(prev);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  };
  return (
    <div className="@container grid gap-4">
      <YearStrip
        events={events}
        hidden={hidden}
        onToggle={toggleCategory}
        groups={groups}
        active={active}
        rowId={rowId}
        setActive={setActive}
      />
      <div role="group" aria-label="Events in date order" className="grid gap-2 @3xl:gap-0">
        <div className="@3xl:pb-2">
          <Button
            color="secondary"
            className="max-[480px]:min-h-11"
            size="sm"
            onClick={() => {
              setOpened(all ? new Set() : new Set(events.map((event) => event.index)));
            }}
          >
            {all ? "Hide all details" : "Show all details"}
          </Button>
        </div>
        {groups.length ? null : (
          <p role="status" className="text-small text-text-secondary">
            No categories are selected.
          </p>
        )}
        <div>
          {groups.map(({ year, events: members }) => (
            <div
              key={year}
              role="group"
              aria-labelledby={`${prefix}-year-${String(year)}`}
              className="grid gap-1 @3xl:gap-0 @3xl:border-t @3xl:border-border-hairline @3xl:first:border-t-0 @3xl:grid-cols-[3rem_minmax(0,1fr)]"
            >
              <span
                id={`${prefix}-year-${String(year)}`}
                className="font-semibold tabular-nums text-text-primary @3xl:pt-1.5"
              >
                {year}
              </span>
              <ul className="min-w-0">
                {members.map((event) => (
                  <EventRow
                    key={event.index}
                    event={event}
                    rowId={rowId(event.index)}
                    panelId={`${rowId(event.index)}-details`}
                    open={opened.has(event.index)}
                    lit={active?.index === event.index && active.from === "marker"}
                    showSource={!evidenceInDrawer}
                    rowDetail={rowDetail}
                    onToggle={() => {
                      toggle(event.index);
                    }}
                    onActive={(on) => {
                      setActive(on ? { index: event.index, from: "row" } : null);
                    }}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function eventLane(table: SourceTable, rowDetail?: (index: number) => ReactNode) {
  const events = eventRecords(table);
  if (!events.length || events.length !== table.rows.length) return null;
  events.sort((a, b) => a.from - b.from || a.to - b.to || a.index - b.index);
  return (
    <EventDrawing
      events={events}
      evidenceInDrawer={table.evidenceInDrawer === true}
      rowDetail={rowDetail}
    />
  );
}
