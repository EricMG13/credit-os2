import { useEffect, useRef, useState, type RefObject } from "react";
import { cx } from "@/utils/cx";
import { VerticalAxis } from "./EventAxisVertical";
import {
  endOf,
  EVENT_LANES,
  isPeriod,
  Legend,
  Mark,
  recordedRange,
  SPAN_STYLE,
  type EventRecord,
} from "./EventLane";

const DAY = 86_400_000;
/** The plot's width before it is measured. */
const FALLBACK_PX = 560;
/** One row of labelled marks; a target is at most this tall (44px on a phone). */
const ROW_PX = 48;
/** Half the widest hit area, so neighbouring targets never overlap. */
const HALF_HIT_PX = 22;
const LABEL_GAP_PX = 6;
/** A label may reach this far past the plot into its margin. */
const BOUND_PX = 12;
/** Space kept between the as-of rule and any label text, and inside a bar before its label. */
const RULE_CLEAR_PX = 4;
const INSIDE_PAD_PX = 6;
/** The least width worth drawing a truncated label in. */
const MIN_LABEL_PX = 56;
/** The widths a crowded lane's names are cut to, widest first; a cut is kept only if it saves a row. */
const NARROW_PX = [160, 112, 84];
/** A lane taking more rows than this draws shorter labels. */
const ROW_CAP = 3;
/** A period bar this wide can carry its own label. */
const INSIDE_MIN_PX = 72;
const TICK_GAP_PX = 72;
const PAD_DAYS = 30;
/** The least width the horizontal plot is drawn at; narrower than this the axis runs down the page. */
const PLOT_MIN_PX = 720;
/** The phone layout draws the axis down the page. */
const PHONE_QUERY = `(max-width: ${String(PLOT_MIN_PX)}px)`;
/** Padding a tick label carries left of its text (pl-1), plus a pixel of slack. */
const TICK_PAD_PX = 5;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Under about two years the axis is ticked by month, otherwise by year. */
const MONTH_TICK_RANGE = 2 * 366 * DAY;

type Category = EventRecord["category"];

type Side = "right" | "left" | "inside";

type Placed = {
  event: EventRecord;
  /** Left edge, percent of the plot. */
  start: number;
  /** A period's recorded width, percent of the plot; 0 for a day. */
  width: number;
  row: number;
  side: Side;
  /** The most pixels the label may take; the text decides the rest. */
  labelPx: number;
  /** An inside label starts this far right of its default so it clears the as-of rule. */
  shift: number;
};

/** Text widths: measured on a canvas in the page's own fonts, estimated where there is no canvas. */
type Kind = "mono" | "name" | "tick";
type Measure = (text: string, kind: Kind) => number;

const ESTIMATE: Measure = (text, kind) => text.length * (kind === "mono" ? 7.4 : 7.2);

/** A 2d canvas for measuring text, or null where there is none (jsdom reports one as an error). */
function measuringContext() {
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return null;
  try {
    return document.createElement("canvas").getContext("2d");
  } catch {
    return null;
  }
}

const fontOf = (element: Element | null) => {
  if (!element) return "";
  const { fontStyle, fontWeight, fontSize, fontFamily } = getComputedStyle(element);
  return fontSize && fontFamily ? `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}` : "";
};

type Fonts = Record<Kind, string>;

/** A measuring function for the label fonts; it re-reads them when the page's fonts finish loading. */
function useTextWidth() {
  const mono = useRef<HTMLSpanElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  const tick = useRef<HTMLSpanElement>(null);
  const canvas = useRef<CanvasRenderingContext2D | null>(null);
  const [fonts, setFonts] = useState<Fonts | null>(null);
  useEffect(() => {
    canvas.current = measuringContext();
    if (!canvas.current) return;
    const read = () => {
      setFonts({
        mono: fontOf(mono.current),
        name: fontOf(name.current),
        tick: fontOf(tick.current),
      });
    };
    read();
    void (document as Partial<Document>).fonts?.ready.then(read);
  }, []);
  const measure: Measure = (text, kind) => {
    const font = fonts?.[kind];
    const context = canvas.current;
    if (!context || !font) return ESTIMATE(text, kind);
    context.font = font;
    return context.measureText(text).width;
  };
  const probes = (
    <>
      <span
        ref={mono}
        aria-hidden="true"
        className="invisible absolute font-mono text-caption tabular-nums"
      />
      <span ref={name} aria-hidden="true" className="invisible absolute text-small font-medium" />
      <span
        ref={tick}
        aria-hidden="true"
        className="invisible absolute text-caption tabular-nums"
      />
    </>
  );
  return { measure, probes };
}

/** What a label takes: the date in mono, a gap, then the name (cut to `cap` when a lane is crowded). */
const labelWidth = (event: EventRecord, measure: Measure, cap: number) =>
  Math.ceil(measure(event.date, "mono") + 6 + Math.min(measure(event.event, "name"), cap)) + 2;

type Extent = { left: number; right: number };

type Frame = { startPx: number; widthPx: number; period: boolean };

function extentOf({ startPx, widthPx, period }: Frame, side: Side, label: number): Extent {
  const left = period ? startPx : startPx - HALF_HIT_PX;
  const right = period ? startPx + Math.max(widthPx, 2 * HALF_HIT_PX) : startPx + HALF_HIT_PX;
  if (side === "inside") return { left, right };
  return side === "left"
    ? { left: left - LABEL_GAP_PX - label, right }
    : { left, right: right + LABEL_GAP_PX + label };
}

const overlaps = (a: Extent, b: Extent) =>
  a.left < b.right + LABEL_GAP_PX && b.left < a.right + LABEL_GAP_PX;

/** A side, the width its label takes in the packing, and the most it may use before it truncates. */
type Choice = { side: Side; label: number; max: number; shift: number };

/** Whether the as-of rule (a plot x, or null) would strike text drawn between `left` and `right`. */
const struck = (rule: number | null, left: number, right: number) =>
  rule !== null && rule > left - RULE_CLEAR_PX && rule < right + RULE_CLEAR_PX;

/**
 * A label drawn inside a period's bar: the whole bar, or, where the as-of rule crosses the bar,
 * the side of the rule that holds the label (the label is nudged; the rule stays put).
 */
function insideChoice(frame: Frame, wanted: number, rule: number | null): Choice | null {
  const whole = Math.floor(frame.widthPx - 10);
  const at = rule === null ? -1 : rule - frame.startPx;
  if (at <= 0 || at >= frame.widthPx) return { side: "inside", label: whole, max: whole, shift: 0 };
  const before = Math.floor(at - RULE_CLEAR_PX - INSIDE_PAD_PX);
  const after = Math.floor(frame.widthPx - at - RULE_CLEAR_PX - 4);
  const best = [before, after].find((room) => room >= wanted) ?? Math.max(before, after);
  if (best < MIN_LABEL_PX) return null;
  const shift = best === before ? 0 : Math.ceil(at + RULE_CLEAR_PX - INSIDE_PAD_PX);
  return { side: "inside", label: best, max: best, shift };
}

/** The sides a label can take, best first, each with the room it has inside the plot. */
function choices(frame: Frame, wanted: number, plotPx: number, rule: number | null): Choice[] {
  const hit = extentOf(frame, "inside", 0);
  const sides = [
    { side: "right" as const, room: Math.floor(plotPx + BOUND_PX - hit.right - LABEL_GAP_PX) },
    { side: "left" as const, room: Math.floor(hit.left - LABEL_GAP_PX + BOUND_PX) },
  ];
  const roomy = frame.period && frame.widthPx >= INSIDE_MIN_PX;
  const within = roomy ? insideChoice(frame, wanted, rule) : null;
  if (within && within.label >= wanted) return [within];
  const fits = sides.filter(({ room }) => room >= wanted);
  const clear = fits.filter(({ side }) => {
    const { left, right } = extentOf(frame, side, wanted);
    return side === "left" ? !struck(rule, left, hit.left) : !struck(rule, hit.right, right);
  });
  const whole = (clear.length ? clear : fits).map(({ side, room }) => ({
    side,
    label: wanted,
    max: room,
    shift: 0,
  }));
  if (whole.length) return whole;
  if (within && within.label >= wanted * 0.6) return [within];
  const [best] = [...sides].sort((a, b) => b.room - a.room);
  if (best && best.room >= MIN_LABEL_PX) {
    return [{ side: best.side, label: best.room, max: best.room, shift: 0 }];
  }
  const side = best?.side ?? "right";
  return within ? [within] : [{ side, label: MIN_LABEL_PX, max: MIN_LABEL_PX, shift: 0 }];
}

type Option = Choice & { extent: Extent };

/** A placed label with the geometry the packing used. */
type Slotted = { extent: Extent; frame: Frame; item: Placed };

/** The first row, from the top, where one of the options overlaps nothing. */
function slot(rows: Slotted[][], options: Option[]) {
  for (let row = 0; ; row += 1) {
    const option = options.find((candidate) =>
      (rows[row] ?? []).every((other) => !overlaps(candidate.extent, other.extent)),
    );
    if (option) return { row, option };
  }
}

/** A cut label may take any room its row leaves free beside it, up to the plot's edge. */
function grow(rows: Slotted[][], plotPx: number) {
  for (const row of rows) {
    for (const entry of row) {
      const { item, frame, extent } = entry;
      if (item.side === "inside") continue;
      const hit = extentOf(frame, "inside", 0);
      const rest = row.filter((other) => other !== entry);
      if (item.side === "right") {
        const next = rest.filter((o) => o.extent.left >= hit.right).map((o) => o.extent.left);
        const edge = Math.min(
          plotPx + BOUND_PX + LABEL_GAP_PX,
          ...next.map((n) => n - LABEL_GAP_PX),
        );
        item.labelPx = Math.max(item.labelPx, Math.floor(edge - hit.right - LABEL_GAP_PX));
        extent.right = hit.right + LABEL_GAP_PX + item.labelPx;
      } else {
        const prev = rest.filter((o) => o.extent.right <= hit.left).map((o) => o.extent.right);
        const edge = Math.max(-BOUND_PX, ...prev.map((p) => p + LABEL_GAP_PX));
        item.labelPx = Math.max(item.labelPx, Math.floor(hit.left - LABEL_GAP_PX - edge));
        extent.left = hit.left - LABEL_GAP_PX - item.labelPx;
      }
    }
  }
}

/** Stack labelled marks into sub-rows so no label or hit area covers another. */
function stack(
  events: EventRecord[],
  min: number,
  range: number,
  plotPx: number,
  measure: Measure,
  cap: number,
  rule: number | null,
): Placed[] {
  const pct = (time: number) => (time - min) / range;
  const rows: Slotted[][] = [];
  const placed = [...events]
    .sort((a, b) => a.from - b.from || a.to - b.to || a.index - b.index)
    .map((event) => {
      const start = pct(event.from) * 100;
      const width = isPeriod(event) ? (pct(endOf(event)) - pct(event.from)) * 100 : 0;
      const frame = {
        startPx: (start / 100) * plotPx,
        widthPx: (width / 100) * plotPx,
        period: isPeriod(event),
      };
      const wanted = labelWidth(event, measure, cap);
      const options = choices(frame, wanted, plotPx, rule).map((choice) => ({
        ...choice,
        max:
          choice.side === "inside" || !Number.isFinite(cap)
            ? choice.max
            : Math.min(choice.max, wanted),
        extent: extentOf(frame, choice.side, choice.label),
      }));
      const { row, option } = slot(rows, options);
      const item: Placed = {
        event,
        start,
        width,
        row,
        side: option.side,
        labelPx: option.max,
        shift: option.shift,
      };
      (rows[row] ??= []).push({ extent: option.extent, frame, item });
      return item;
    });
  if (Number.isFinite(cap)) grow(rows, plotPx);
  return placed;
}

const rowCount = (placed: Placed[]) => Math.max(0, ...placed.map(({ row }) => row + 1));

/**
 * Pack a lane with whole labels. When that takes more than a few rows, narrow the names step by
 * step, keeping a narrower step only if it lowers the row count. A label always keeps its date.
 */
function place(
  events: EventRecord[],
  min: number,
  range: number,
  plotPx: number,
  measure: Measure,
  rule: number | null,
): Placed[] {
  const pack = (cap: number) => stack(events, min, range, plotPx, measure, cap, rule);
  let best = pack(Infinity);
  for (const cap of NARROW_PX) {
    if (rowCount(best) <= ROW_CAP) break;
    const next = pack(cap);
    if (rowCount(next) < rowCount(best)) best = next;
  }
  return best;
}

type Tick = { key: string; label: string; time: number };

function monthStarts(min: number, max: number) {
  const first = new Date(min);
  const ticks: { year: number; month: number; time: number }[] = [];
  let year = first.getUTCFullYear();
  let month = first.getUTCMonth();
  for (;;) {
    const time = Date.UTC(year, month, 1);
    if (time >= max) return ticks;
    if (time >= min) ticks.push({ year, month, time });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
}

/** Month ticks under about two years, year ticks beyond; the first partial period is never labelled. */
function axisTicks(min: number, max: number, plotPx: number): Tick[] {
  if (max - min < MONTH_TICK_RANGE) {
    const months = monthStarts(min, max);
    const monthPx = plotPx / Math.max((max - min) / (30.4 * DAY), 1);
    const step = Math.max(1, Math.ceil(TICK_GAP_PX / monthPx));
    return months
      .filter((_, at) => at % step === 0)
      .map(({ year, month, time }, at) => ({
        key: `${String(year)}-${String(month + 1).padStart(2, "0")}`,
        label:
          month === 0 || at === 0
            ? `${MONTHS[month] ?? ""} ${String(year)}`
            : (MONTHS[month] ?? ""),
        time,
      }));
  }
  const first = new Date(min).getUTCFullYear();
  const last = new Date(max).getUTCFullYear();
  const years = Array.from({ length: last - first + 2 }, (_, at) => first + at).filter(
    (year) => Date.UTC(year, 0, 1) >= min && Date.UTC(year, 0, 1) < max,
  );
  const step = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor(plotPx / 56))));
  return years
    .filter((_, at) => at % step === 0)
    .map((year) => ({ key: String(year), label: String(year), time: Date.UTC(year, 0, 1) }));
}

type TickLabel = { key: string; label: string; left: string };

/**
 * Where each tick's text sits. A label that would run past the plot's right edge slides left to
 * stay inside it; if that would touch the label before it, the label is left off (its line stays).
 */
function tickLabels(ticks: Tick[], min: number, range: number, plotPx: number, measure: Measure) {
  let end = -Infinity;
  return ticks.flatMap(({ key, label, time }): TickLabel[] => {
    const at = ((time - min) / range) * plotPx;
    const width = Math.ceil(measure(label, "tick")) + TICK_PAD_PX;
    const left = Math.min(at, plotPx + BOUND_PX - width);
    if (left < end + LABEL_GAP_PX) return [];
    end = left + width;
    const slid = left < at;
    return [{ key, label, left: slid ? `${String(left)}px` : `${String((at / plotPx) * 100)}%` }];
  });
}

/** The plot's measured width; the fallback holds until the browser reports one. */
function usePlotWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(FALLBACK_PX);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const read = () => {
      if (element.clientWidth > 0) setPx(element.clientWidth);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return [ref, px] as const;
}

function EventLabel({
  event,
  side,
  px,
  shift,
}: {
  event: EventRecord;
  side: Side;
  px: number;
  shift: number;
}) {
  return (
    <span
      aria-hidden="true"
      data-event-label=""
      data-label-side={side}
      className={cx(
        "pointer-events-none absolute flex items-baseline gap-1.5 overflow-hidden whitespace-nowrap",
        side === "inside" && "top-1/2 left-1.5 -translate-y-1/2 text-caption",
        side === "left" && "top-1/2 right-full mr-1.5 -translate-y-1/2 flex-row-reverse text-right",
        side === "right" && "top-1/2 left-full ml-1.5 -translate-y-1/2 text-left",
      )}
      style={{
        maxWidth: `${String(px)}px`,
        ...(shift ? { marginLeft: `${String(shift)}px` } : {}),
      }}
    >
      <span
        className={cx(
          "flex-none font-mono text-text-secondary tabular-nums",
          side !== "inside" && "text-caption",
        )}
      >
        {event.date}
      </span>
      <span
        className={cx(
          "min-w-0 truncate font-medium text-text-primary",
          side !== "inside" && "text-small",
        )}
      >
        {event.event}
      </span>
    </span>
  );
}

function EventButton({
  item,
  rowId,
  plotPx,
  onSelect,
}: {
  item: Placed;
  rowId: string;
  plotPx: number;
  onSelect: () => void;
}) {
  const { event, start, width, row, side, labelPx, shift } = item;
  const { date, precision, status, category } = event;
  const period = isPeriod(event);
  return (
    <button
      type="button"
      aria-label={`${event.event}, ${date}, ${precision}, ${status}`}
      aria-controls={rowId}
      data-event-category={category}
      data-event-precision={precision}
      data-event-shape={period ? "span" : "mark"}
      title={`${event.event} · ${date}`}
      className={cx(
        "group absolute flex h-11 cursor-pointer items-center rounded-ds-sm focus-visible:ring-2 focus-visible:ring-focus",
        period
          ? "min-w-8 max-[480px]:min-w-11"
          : "w-8 -translate-x-1/2 justify-center max-[480px]:w-11",
      )}
      style={{
        left: `${String(start)}%`,
        top: `${String(row * ROW_PX + 4)}px`,
        ...(period ? { width: `${String(width)}%` } : {}),
      }}
      onClick={onSelect}
    >
      {period ? (
        <span
          data-span-bar=""
          className={cx(
            "absolute left-0 h-4 rounded-ds-xs border group-hover:ring-2 group-hover:ring-focus",
            SPAN_STYLE[category],
          )}
          style={{ width: `${String((width / 100) * plotPx)}px` }}
        />
      ) : (
        <span className="flex rounded-ds-full p-1.5 group-hover:ring-2 group-hover:ring-focus">
          <Mark category={category} />
        </span>
      )}
      <EventLabel event={event} side={side} px={labelPx} shift={shift} />
    </button>
  );
}

/** Both ends of the drawn range; a zero-width range is padded for geometry only, never printed. */
function axisRange(events: EventRecord[], asOf: number | null) {
  const times = [
    ...events.flatMap((event) => [event.from, endOf(event)]),
    ...(asOf === null ? [] : [asOf]),
  ];
  const low = Math.min(...times);
  const high = Math.max(...times);
  const padded = high === low;
  const min = padded ? low - PAD_DAYS * DAY : low;
  const max = padded ? high + PAD_DAYS * DAY : high;
  return { min, max, range: max - min };
}

type AsOf = { time: number; text: string };
type Range = ReturnType<typeof axisRange>;

/**
 * Whether the axis runs down the page: when the viewport is 720px or narrower, or, once the
 * browser has measured it, whenever its container is narrower than the horizontal plot needs.
 */
function useNarrow(container: RefObject<HTMLDivElement | null>) {
  const [viewport, setViewport] = useState(
    () => typeof window.matchMedia === "function" && window.matchMedia(PHONE_QUERY).matches,
  );
  const [measured, setMeasured] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(PHONE_QUERY);
    const read = () => {
      setViewport(query.matches);
    };
    read();
    query.addEventListener("change", read);
    return () => {
      query.removeEventListener("change", read);
    };
  }, []);
  useEffect(() => {
    const element = container.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const read = () => {
      if (element.clientWidth > 0) setMeasured(element.clientWidth < PLOT_MIN_PX);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [container]);
  return measured ?? viewport;
}

function HorizontalAxis({
  events,
  asOf,
  hidden,
  label,
  range: { min, max, range },
  words,
  rowId,
  onSelect,
}: {
  events: EventRecord[];
  asOf: AsOf | null;
  hidden: ReadonlySet<Category>;
  label: string;
  range: Range;
  words: ReturnType<typeof recordedRange>;
  rowId: (index: number) => string;
  onSelect: (index: number) => void;
}) {
  const [plot, plotPx] = usePlotWidth();
  const { measure, probes } = useTextWidth();
  const x = (time: number) => ((time - min) / range) * 100;
  const rule = asOf === null ? null : (x(asOf.time) / 100) * plotPx;
  const lanes = EVENT_LANES.filter(
    (lane) => !hidden.has(lane) && events.some((event) => event.category === lane),
  ).map((lane) => {
    const placed = place(
      events.filter((event) => event.category === lane),
      min,
      range,
      plotPx,
      measure,
      rule,
    );
    return { lane, placed, rows: Math.max(...placed.map(({ row }) => row)) + 1 };
  });
  const ticks = axisTicks(min, max, plotPx);
  const labelled = tickLabels(ticks, min, range, plotPx, measure);
  const right = asOf !== null && x(asOf.time) > 80;
  return (
    <>
      <div
        role="group"
        aria-label={label}
        className="overflow-x-auto"
        data-testid="event-axis"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <div className="relative min-w-[720px]">
          {probes}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 bottom-7 left-28"
          >
            <div className="absolute inset-y-0 right-4 left-4">
              {ticks.map(({ key, time }) => (
                <div
                  key={key}
                  data-axis-tick={key}
                  className="absolute inset-y-0 border-l border-border-hairline"
                  style={{ left: `${String(x(time))}%` }}
                />
              ))}
            </div>
          </div>
          {asOf ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-6 right-0 bottom-7 left-28"
            >
              <div className="absolute inset-y-0 right-4 left-4">
                <div
                  data-as-of-rule={asOf.text}
                  className="absolute inset-y-0 border-l-2 border-action"
                  style={{ left: `${String(x(asOf.time))}%` }}
                />
              </div>
            </div>
          ) : null}
          <div className="relative flex h-6 items-end text-caption text-text-tertiary">
            <span className="w-28 flex-none" />
            <div ref={plot} className="relative mx-4 h-full flex-1">
              {labelled.map(({ key, label: tick, left }) => (
                <span
                  key={key}
                  data-axis-tick-label={key}
                  className="absolute bottom-0 pl-1 whitespace-nowrap tabular-nums"
                  style={{ left }}
                >
                  {tick}
                </span>
              ))}
            </div>
          </div>
          {asOf ? (
            <div className="relative flex h-5 items-center text-caption font-medium text-action">
              <span className="w-28 flex-none" />
              <div className="relative mx-4 h-full flex-1">
                <span
                  className={cx(
                    "absolute top-0 whitespace-nowrap",
                    right ? "-translate-x-full pr-1.5" : "pl-1.5",
                  )}
                  style={{ left: `${String(x(asOf.time))}%` }}
                >
                  {`As of ${asOf.text}`}
                </span>
              </div>
            </div>
          ) : null}
          {lanes.map(({ lane, placed, rows }) => (
            <div
              key={lane}
              role="group"
              aria-label={`${lane} lane`}
              className="flex border-t border-border-hairline"
              style={{ height: `${String(rows * ROW_PX + 8)}px` }}
            >
              <span className="sticky left-0 z-10 flex h-12 w-28 flex-none items-center gap-1.5 bg-surface-card text-small text-text-secondary">
                <Mark category={lane} />
                {lane}
              </span>
              <div className="relative mx-4 flex-1">
                {placed.map((item) => (
                  <EventButton
                    key={item.event.index}
                    item={item}
                    rowId={rowId(item.event.index)}
                    plotPx={plotPx}
                    onSelect={() => {
                      onSelect(item.event.index);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="relative flex h-7 items-center border-t border-border-hairline text-caption text-text-secondary">
            <span className="w-28 flex-none">{words ? "Axis range" : null}</span>
            {words ? (
              <div className="mx-4 flex flex-1 justify-between font-mono tabular-nums">
                <span data-axis-end="start">{words.first}</span>
                <span data-axis-end="end">{words.last}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * The calendar on one true time axis: a lane per recorded status category, x proportional to
 * date, every event labelled with its date and name. A day event is a mark; an event with only a
 * period is a span of the recorded width. On a phone the axis runs down the page instead.
 */
export function EventAxis({
  events,
  asOf,
  rowId,
  onSelect,
}: {
  events: EventRecord[];
  /** The run's as-of date as a timestamp and its text, already validated. */
  asOf: AsOf | null;
  rowId: (index: number) => string;
  onSelect: (index: number) => void;
}) {
  const [hidden, setHidden] = useState<ReadonlySet<Category>>(new Set());
  const frame = useRef<HTMLDivElement>(null);
  const phone = useNarrow(frame);
  const toggle = (category: Category) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (!next.delete(category)) next.add(category);
      return next;
    });
  };
  const range = axisRange(events, asOf?.time ?? null);
  const count = events.length === 1 ? "1 event" : `${String(events.length)} events`;
  const words = recordedRange(events);
  // An as-of date outside the events draws the axis past them, so their ends are not the axis ends.
  const outside =
    asOf !== null &&
    events.length > 0 &&
    (asOf.time < Math.min(...events.map((event) => event.from)) ||
      asOf.time > Math.max(...events.map(endOf)));
  const ends = outside ? null : words;
  const label = `Events on a time axis: ${count}${words ? `, ${words.first} to ${words.last}` : ""}`;
  const shown = events.filter((event) => !hidden.has(event.category));
  return (
    <div ref={frame} className="grid min-w-0 gap-3">
      <Legend events={events} hidden={hidden} onToggle={toggle} />
      {shown.length ? null : (
        <p role="status" className="text-small text-text-secondary">
          No categories are selected.
        </p>
      )}
      {phone ? (
        <VerticalAxis
          events={shown}
          asOf={asOf}
          label={label}
          words={ends}
          rowId={rowId}
          onSelect={onSelect}
        />
      ) : (
        <HorizontalAxis
          events={events}
          asOf={asOf}
          hidden={hidden}
          label={label}
          range={range}
          words={ends}
          rowId={rowId}
          onSelect={onSelect}
        />
      )}
      {words && !ends ? (
        <p data-events-span="" className="text-caption text-text-secondary">
          {`Events from ${words.first} to ${words.last}`}
        </p>
      ) : null}
    </div>
  );
}
