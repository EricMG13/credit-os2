import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Segmented } from "@/components/kit/Segmented";
import { cx } from "@/utils/cx";
import { GapNote, Tile } from "../report/overview/Tile";
import {
  absentText,
  extremeOf,
  fiscalYear,
  periodList,
  type Measure,
  type MeasureCase,
  type MeasureCell,
  type ScheduleYear,
} from "../report/forecastData";
import { ticks } from "./visualData";

/** The maturity schedule as its module publishes it, drawn on the same fiscal-year axis. */
export type PathSchedule = {
  years: ScheduleYear[];
  offAxis: ScheduleYear[];
  unit?: string;
  /** Why there is no schedule, drawn in the designed gap or blocked state by the caller. */
  gap?: ReactNode;
  trace?: ReactNode;
};

/** The chart draws at most this many cases against each other, as the cash proxy does. */
const MOST_CASES = 6;
/** The axis reaches a scheduled maturity at most this many years after the last forecast year. */
const REACH = 3;
const SERIES = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-5", "stroke-chart-6"] as const;
const DOTS = ["fill-chart-1", "fill-chart-2", "fill-chart-5", "fill-chart-6"] as const;
/** Each case keeps one dash whichever case is selected, so none differs by colour alone; the
 * selected case is drawn heavier, never with another dash. */
const DASHES = [undefined, "7 4", "2 3", "9 3 2 3", "4 2 1 2", "1 3"] as const;
/** The short keys a direct label carries when a case's name does not fit beside its point. */
const KEYS = ["A", "B", "C", "D", "E", "F"] as const;

const TOP = 28;
const LEFT = 52;
const BOTTOM = 252;
const AXIS = BOTTOM + 24;
const LANE_BASE = BOTTOM + 112;
const LANE_HEIGHT = 44;
const THINNEST = 2;

/** The drawing's width in CSS pixels, so text keeps its size at every width. */
function useMeasuredWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry?.contentRect.width ?? 0);
      if (next > 0) setWidth(Math.max(300, next));
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, width };
}

type Slot = { year: number; label: string; forecast: boolean };

/** The cases drawn: all of them when they share a period, else the selected case alone. */
function drawnCases(measure: Measure, group: string | undefined) {
  // A selected case the measure has no row for is not replaced by another case.
  const selected =
    group === undefined ? measure.cases[0] : measure.cases.find((item) => item.group === group);
  if (!selected) return { selected: undefined, drawn: [] };
  const all = measure.compared && measure.cases.length <= MOST_CASES;
  return { selected, drawn: all ? measure.cases : [selected] };
}

/**
 * One slot per fiscal year, from the actual year (when earlier) through the drawn cases' periods,
 * reaching scheduled maturities up to `REACH` years past the last forecast year. Only the drawn
 * cases' periods are forecast slots: with no comparison, the selected case's own periods alone.
 */
function axisSlots(measure: Measure, drawn: MeasureCase[], schedule: PathSchedule) {
  const labels = new Map<number, string>();
  for (const period of drawn.flatMap((item) => [...item.cells.keys()])) {
    const year = fiscalYear(period);
    if (year !== null) labels.set(year, period);
  }
  const years = [...labels.keys()];
  if (!years.length) return [];
  const first = Math.min(...years);
  const last = Math.max(...years);
  const actual = measure.actual ? fiscalYear(measure.actual.period) : null;
  const start = actual !== null && actual < first ? actual : first;
  const scheduled = schedule.years
    .map(({ year }) => year)
    .filter((year) => year > last && year - last <= REACH);
  const end = Math.max(last, ...scheduled);
  return Array.from({ length: end - start + 1 }, (_, at): Slot => {
    const year = start + at;
    const forecast = year >= first && year <= last;
    const label =
      labels.get(year) ??
      (year === actual
        ? (measure.actual?.period ?? "")
        : `FY${String(year)}${forecast ? "E" : ""}`);
    return { year, label, forecast };
  });
}

function cellAt(item: MeasureCase, slot: Slot): MeasureCell | undefined {
  return [...item.cells.values()].find((cell) => fiscalYear(cell.period) === slot.year);
}

/** Line segments between consecutive years where both cells are values; never across a gap. */
function segments(item: MeasureCase, slots: Slot[]) {
  const out: { from: MeasureCell; to: MeasureCell }[] = [];
  slots.forEach((slot, at) => {
    const next = slots[at + 1];
    const from = cellAt(item, slot);
    const to = next && cellAt(item, next);
    if (from?.value != null && to?.value != null) out.push({ from, to });
  });
  return out;
}

function geometry(width: number, slots: Slot[], values: number[], lane: boolean, room: number) {
  const right = width - room;
  const step = (right - LEFT) / Math.max(1, slots.length);
  const first = slots[0]?.year ?? 0;
  const x = (year: number) => LEFT + (year - first + 0.5) * step;
  const scale = ticks(values);
  const low = scale[0]?.value ?? 0;
  const high = scale.at(-1)?.value ?? 1;
  const y = (value: number) => BOTTOM - ((value - low) / (high - low || 1)) * (BOTTOM - TOP);
  return { x, y, step, right, width, scale, height: lane ? LANE_BASE + 10 : AXIS + 14 };
}
type Geometry = ReturnType<typeof geometry>;

/** A case's colour, dash and key, by its place among the drawn cases: the same whichever case is
 * selected. */
function styleOf(drawn: MeasureCase[], item: MeasureCase) {
  const at = Math.max(0, drawn.indexOf(item));
  return {
    stroke: SERIES[at % SERIES.length] ?? SERIES[0],
    fill: DOTS[at % DOTS.length] ?? DOTS[0],
    dash: DASHES[at % DASHES.length],
    key: KEYS[at] ?? String(at + 1),
  };
}

type Anchor = "start" | "middle" | "end";
/** Where a label may sit; `far` is how far it has moved out from the spots beside its point. */
type Spot = { x: number; y: number; anchor: Anchor; far?: number };
/** A mark a label should keep clear of; `weight` is what covering a pixel of it costs. */
type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  weight?: number;
  /** The point this box is the room around, where it is one. */
  around?: { x: number; y: number };
};
type Wanted = {
  key: string;
  text: string;
  /** Point labels are mono 14px; gap words are 12px captions. */
  kind: "figure" | "gap";
  spots: Spot[];
  /** The point the label names: it may sit in the room kept around that point, beside it. */
  own?: { x: number; y: number };
  /** A label the chart may leave out where no spot is clear: its figure is stated elsewhere. */
  optional?: boolean;
};
type Label = Wanted & Spot & { width: number };

/** How wide a label draws, as the browser measures its font; an estimate until it has. */
type TextWidth = (text: string, kind: Wanted["kind"]) => number;
const estimate: TextWidth = (text, kind) => text.length * (kind === "figure" ? 8.4 : 6.4);

function boxOf({ x, y, anchor }: Spot, width: number, kind: Wanted["kind"]): Box {
  const size = kind === "figure" ? 14 : 12;
  const left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
  return {
    left: left - 2,
    right: left + width + 2,
    // The box the browser draws the text in, ascent and descent, with 2px of air.
    top: y - size - 2,
    bottom: y + size * 0.3 + 2,
  };
}

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/**
 * Each label at the spot that costs least: inside the plot, clear of points and of the labels placed
 * before it above all, then clear of lines (a line behind a haloed label stays readable), then
 * nearest its own point, so it is never read as another case's.
 */
function place(wanted: Wanted[], marks: Box[], bounds: Box, widthOf: TextWidth): Label[] {
  const taken = [...marks];
  return wanted.flatMap((label) => {
    const width = widthOf(label.text, label.kind);
    let best: { spot: Spot; box: Box; cost: number } | undefined;
    for (const [rank, spot] of label.spots.entries()) {
      const box = boxOf(spot, width, label.kind);
      const outside =
        box.left < bounds.left ||
        box.right > bounds.right ||
        box.top < bounds.top ||
        box.bottom > bounds.bottom;
      const covered = taken.reduce(
        (sum, mark) =>
          // The room around a point keeps other points' labels away, not its own.
          mark.around && mark.around.x === label.own?.x && mark.around.y === label.own.y
            ? sum
            : sum + overlap(box, mark) * (mark.weight ?? 100),
        0,
      );
      const cost = (outside ? 1e6 : 0) + covered + rank + (spot.far ?? 0) * 6;
      if (!best || cost < best.cost) best = { spot, box, cost };
      if (cost === rank) break;
    }
    const box = best?.box;
    const clear =
      box !== undefined &&
      (best?.cost ?? 1e6) < 1e6 &&
      !taken.some((mark) => (mark.weight ?? 100) > 2 && overlap(box, mark) > 0);
    if (label.optional && !clear) return [];
    const spot = best?.spot ?? label.spots[0] ?? { x: 0, y: 0, anchor: "start" as const };
    if (box) taken.push(box);
    return [{ ...label, ...spot, width }];
  });
}

/** Every drawn point and line as boxes a label must stay clear of. */
function marksOf(drawn: MeasureCase[], slots: Slot[], g: Geometry, measure: Measure): Box[] {
  const dot = (x: number, y: number, r: number, weight = 100) => ({
    left: x - r,
    right: x + r,
    top: y - r,
    bottom: y + r,
    weight,
  });
  const boxes: Box[] = [];
  for (const item of drawn) {
    for (const slot of slots) {
      const cell = cellAt(item, slot);
      if (cell?.value == null) continue;
      boxes.push(dot(g.x(slot.year), g.y(cell.value), 7));
      // A little room around every point, so no label sits against a point it does not name.
      boxes.push({
        ...dot(g.x(slot.year), g.y(cell.value), 18, 2),
        around: { x: g.x(slot.year), y: g.y(cell.value) },
      });
    }
    for (const { from, to } of segments(item, slots)) {
      const [x1, y1] = [g.x(fiscalYear(from.period) ?? 0), g.y(from.value ?? 0)];
      const [x2, y2] = [g.x(fiscalYear(to.period) ?? 0), g.y(to.value ?? 0)];
      const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 5));
      for (let at = 0; at <= steps; at += 1)
        boxes.push(dot(x1 + ((x2 - x1) * at) / steps, y1 + ((y2 - y1) * at) / steps, 2.5, 4));
    }
  }
  const actual = measure.actual;
  const year = actual ? fiscalYear(actual.period) : null;
  if (actual?.value != null && year !== null) boxes.push(dot(g.x(year), g.y(actual.value), 7));
  return boxes;
}

const around = (x: number, y: number): Spot[] => [
  { x: x + 10, y: y + 4, anchor: "start" },
  { x: x + 10, y: y - 10, anchor: "start" },
  { x: x + 10, y: y + 18, anchor: "start" },
  { x, y: y - 12, anchor: "middle" },
  { x, y: y + 22, anchor: "middle" },
  { x: x - 10, y: y + 4, anchor: "end" },
  { x: x - 10, y: y - 10, anchor: "end" },
  { x: x - 10, y: y + 18, anchor: "end" },
];

/** The spots near a point first, then the same spots further up and down, so a crowded plot
 * still has a clear place before any label is laid over a line. */
function ringed(spots: Spot[]): Spot[] {
  const rings = [14, 28].flatMap((step) =>
    spots.flatMap((spot) => [
      { ...spot, y: spot.y - step, far: step },
      { ...spot, y: spot.y + step, far: step },
    ]),
  );
  return [...spots, ...rings];
}

/** The text of a case's end label: its figure and its name, or its key where names do not fit. */
function endText(item: MeasureCase, last: MeasureCell, drawn: MeasureCase[], keyed: boolean) {
  if (drawn.length === 1) return last.display;
  return `${last.display} ${keyed ? styleOf(drawn, item).key : item.name}`;
}

function pointLabels(
  drawn: MeasureCase[],
  selected: MeasureCase,
  slots: Slot[],
  g: Geometry,
  measure: Measure,
  keyed: boolean,
  widthOf: TextWidth,
) {
  const wanted: Wanted[] = [];
  for (const item of drawn) {
    const cells = slots.flatMap((slot) => cellAt(item, slot) ?? []);
    const last = [...cells].reverse().find((cell) => cell.value !== null);
    if (last) {
      const x = g.x(fiscalYear(last.period) ?? 0);
      const y = g.y(last.value ?? 0);
      wanted.push({
        key: `${item.group}-end`,
        text: endText(item, last, drawn, keyed),
        kind: "figure",
        own: { x, y },
        spots: ringed(around(x, y)),
      });
    }
    if (item !== selected) continue;
    // The selected case's highest published year, by value and year: a selection, labelled so.
    const highest = extremeOf(cells, "highest");
    for (const cell of highest?.cells ?? [])
      if (cell !== last) {
        const x = g.x(fiscalYear(cell.period) ?? 0);
        const y = g.y(cell.value ?? 0);
        const spots = around(x, y);
        wanted.push({
          key: `${item.group}-${cell.period}`,
          // The figure alone: the point's place on the axis is its year, and a short label fits
          // beside its own point where a longer one is pushed between the lines or left out.
          text: cell.display,
          kind: "figure",
          // The strip above states the highest year; the chart labels it only where it is clear.
          optional: true,
          own: { x, y },
          // Beside its point first, on the side a falling path leaves free; then straight above
          // it, clear of the marker; then the other spots around it.
          spots: ringed([
            { x: x - 12, y: y + 4, anchor: "end" },
            { x, y: y - 14, anchor: "middle" },
            ...[spots[6], spots[1], spots[0], spots[4], spots[7], spots[2]].filter(
              (spot): spot is Spot => spot !== undefined,
            ),
          ]),
        });
      }
  }
  // The actual year's figure is labelled with its own period, so it is never read as a forecast.
  const actual = measure.actual;
  const actualYear = actual ? fiscalYear(actual.period) : null;
  if (actual && actual.value !== null && actualYear !== null) {
    const spots = around(g.x(actualYear), g.y(actual.value));
    wanted.push({
      key: "actual",
      text: `${actual.display} ${actual.period}`,
      kind: "figure",
      spots: ringed(
        [spots[5], spots[3], spots[4], spots[0]].filter((spot): spot is Spot => spot !== undefined),
      ),
    });
  }
  // The selected case's gap words, inside its hatched column, clear of every other case's marks.
  for (const slot of gapSlots(selected, slots)) {
    const x = g.x(slot.year);
    const rows = Math.max(1, Math.floor((BOTTOM - TOP - 24) / 18));
    wanted.push({
      key: `gap-${slot.label}`,
      text: cellAt(selected, slot) ? "Not calculated" : "Not published",
      kind: "gap",
      spots: Array.from({ length: rows + 1 }, (_, at) => ({
        x,
        y: TOP + 16 + at * 18,
        anchor: "middle" as const,
      })),
    });
  }
  const bounds = { left: LEFT, right: g.width - 2, top: 2, bottom: BOTTOM - 2 };
  return place(wanted, marksOf(drawn, slots, g, measure), bounds, widthOf);
}

/** The forecast years the selected case gives no figure for. */
function gapSlots(selected: MeasureCase, slots: Slot[]) {
  return slots.filter((slot) => slot.forecast && cellAt(selected, slot)?.value == null);
}

function Hatch() {
  return (
    <pattern
      id="forecast-path-hatch"
      width="7"
      height="7"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect width="7" height="7" className="fill-surface-canvas" />
      <line x1="0" y1="0" x2="0" y2="7" strokeWidth="1.5" className="stroke-border-container" />
    </pattern>
  );
}

function Grid({ g }: { g: Geometry }) {
  return (
    <g>
      {g.scale.map((tick) => (
        <g key={tick.value}>
          <line
            x1={LEFT}
            x2={g.right}
            y1={g.y(tick.value)}
            y2={g.y(tick.value)}
            className={tick.value === 0 ? "stroke-border-container" : "stroke-border-hairline"}
          />
          <text
            x={LEFT - 10}
            y={g.y(tick.value) + 4}
            textAnchor="end"
            className="fill-text-tertiary font-mono text-caption"
          >
            {tick.label}x
          </text>
        </g>
      ))}
    </g>
  );
}

/** The selected case's years with no figure, hatched in place; their words are labels, drawn
 * last. */
function GapColumns({ selected, slots, g }: { selected: MeasureCase; slots: Slot[]; g: Geometry }) {
  return (
    <g>
      {gapSlots(selected, slots).map((slot) => {
        const cell = cellAt(selected, slot);
        const centre = g.x(slot.year);
        const half = Math.min(46, g.step * 0.32);
        return (
          <rect
            key={slot.year}
            data-gap={cell?.period ?? slot.label}
            x={centre - half}
            y={TOP}
            width={half * 2}
            height={BOTTOM - TOP}
            rx="6"
            fill="url(#forecast-path-hatch)"
            strokeDasharray="4 3"
            className="stroke-border-gap"
          />
        );
      })}
    </g>
  );
}

/** A small hatched mark at the foot of each year another case does not give a figure for. */
function OtherGaps({
  drawn,
  selected,
  slots,
  g,
}: {
  drawn: MeasureCase[];
  selected: MeasureCase;
  slots: Slot[];
  g: Geometry;
}) {
  const others = drawn.filter((item) => item !== selected);
  return (
    <g>
      {others.flatMap((item, at) =>
        slots
          .filter((slot) => slot.forecast && cellAt(item, slot)?.value == null)
          .map((slot) => (
            <rect
              key={`${item.group}-${String(slot.year)}`}
              data-case-gap={`${item.group} ${cellAt(item, slot)?.period ?? slot.label}`}
              x={g.x(slot.year) - 5 + at * 12}
              y={BOTTOM - 14}
              width="10"
              height="10"
              rx="2"
              fill="url(#forecast-path-hatch)"
              strokeDasharray="2 1"
              className={styleOf(drawn, item).stroke}
            />
          )),
      )}
    </g>
  );
}

function Lines({
  drawn,
  selected,
  slots,
  g,
}: {
  drawn: MeasureCase[];
  selected: MeasureCase;
  slots: Slot[];
  g: Geometry;
}) {
  // The selected case is drawn last, over the others.
  const order = [...drawn.filter((item) => item !== selected), selected];
  return (
    <g>
      {order.map((item) => {
        const style = styleOf(drawn, item);
        const on = item === selected;
        return (
          <g key={item.group}>
            {segments(item, slots).map(({ from, to }) => (
              <line
                key={from.period}
                data-segment={item.group}
                x1={g.x(fiscalYear(from.period) ?? 0)}
                y1={g.y(from.value ?? 0)}
                x2={g.x(fiscalYear(to.period) ?? 0)}
                y2={g.y(to.value ?? 0)}
                strokeWidth={on ? 2.5 : 1.75}
                strokeDasharray={style.dash}
                strokeLinecap="round"
                className={style.stroke}
              />
            ))}
            {slots.map((slot) => {
              const cell = cellAt(item, slot);
              return cell?.value == null ? null : (
                <circle
                  key={slot.year}
                  data-point={`${item.group} ${cell.period}`}
                  cx={g.x(slot.year)}
                  cy={g.y(cell.value)}
                  r={on ? 5.5 : 4}
                  strokeWidth="2"
                  className={cx("stroke-surface-card", style.fill)}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function Labels({ labels }: { labels: Label[] }) {
  return (
    <g>
      {/* A figure's label sits on the tile's surface, so no gridline runs through its words. */}
      {labels
        .filter(({ kind }) => kind === "figure")
        .map(({ key, x, y, anchor, width }) => (
          <rect
            key={key}
            x={(anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2) - 3}
            y={y - 13}
            width={width + 6}
            height={17}
            className="fill-surface-card"
          />
        ))}
      {labels.map((label) => (
        <text
          key={label.key}
          data-label={label.key}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor}
          strokeWidth="4"
          paintOrder="stroke"
          className={
            label.kind === "gap"
              ? "fill-gap-text stroke-surface-canvas text-caption"
              : "fill-text-primary stroke-surface-card font-mono text-small font-medium"
          }
        >
          {label.text}
        </text>
      ))}
    </g>
  );
}

function Actual({ measure, g }: { measure: Measure; g: Geometry }) {
  const actual = measure.actual;
  const year = actual ? fiscalYear(actual.period) : null;
  if (!actual || actual.value === null || year === null) return null;
  return (
    <g>
      <circle
        cx={g.x(year)}
        cy={g.y(actual.value)}
        r="5"
        strokeWidth="2"
        className="fill-surface-card stroke-chart-3"
      />
    </g>
  );
}

function Axis({ slots, g }: { slots: Slot[]; g: Geometry }) {
  const narrow = g.step < 64;
  return (
    <g>
      {slots.map((slot) => (
        <text
          key={slot.year}
          x={g.x(slot.year)}
          y={AXIS}
          textAnchor="middle"
          className="fill-text-secondary font-mono text-caption"
        >
          {narrow ? slot.label.replace(/^FY\d{2}/u, "FY") : slot.label}
        </text>
      ))}
    </g>
  );
}

/** The maturity schedule as written, by fiscal year, under the path on the same axis. */
/** A cell's own words for why it has no amount, short enough for the lane: "Not supplied". */
const gapWords = (text: string) => /^(Not \w+)/u.exec(text.trim())?.[1] ?? "No amount";

/** The maturity schedule as written, by fiscal year, under the path on the same axis. A year with
 * several rows draws each, side by side; a year with no row draws nothing. */
function Lane({ schedule, slots, g }: { schedule: PathSchedule; slots: Slot[]; g: Geometry }) {
  const placed = schedule.years.filter((item) => slots.some((slot) => slot.year === item.year));
  const most = Math.max(0, ...placed.map((item) => item.cell?.value ?? 0));
  return (
    <g>
      <line
        x1={LEFT}
        x2={g.right}
        y1={LANE_BASE}
        y2={LANE_BASE}
        className="stroke-border-container"
      />
      {placed.map((item) => {
        const same = placed.filter((other) => other.year === item.year);
        const room = Math.min(56, g.step * 0.6) / same.length;
        const width = Math.max(8, room - 4);
        const x = g.x(item.year) - (same.length * room) / 2 + same.indexOf(item) * room + room / 2;
        if (!item.cell) return null;
        const amount = item.cell.value;
        if (amount === null) {
          const [first = "", second = ""] = gapWords(item.cell.text).split(" ");
          return (
            <g key={item.key} data-lane-gap={item.label}>
              <rect
                x={x - width / 2}
                y={LANE_BASE - 14}
                width={width}
                height="14"
                fill="url(#forecast-path-hatch)"
                strokeDasharray="3 2"
                className="stroke-border-gap"
              />
              <text
                x={x}
                y={LANE_BASE - 34}
                textAnchor="middle"
                className="fill-gap-text text-caption"
              >
                {/* One label, on two lines where the year is narrow: never two labels that touch. */}
                {g.step < 96 ? (
                  <>
                    <tspan x={x}>{first}</tspan>{" "}
                    <tspan x={x} dy="14">
                      {second}
                    </tspan>
                  </>
                ) : (
                  `${first} ${second}`
                )}
              </text>
            </g>
          );
        }
        const height =
          most > 0 && amount > 0 ? Math.max(THINNEST, (amount / most) * LANE_HEIGHT) : 0;
        return (
          <g key={item.key}>
            <rect
              x={x - width / 2}
              y={LANE_BASE - height}
              width={width}
              height={height}
              className="fill-chart-2"
            />
            <text
              x={x}
              y={LANE_BASE - height - 6}
              textAnchor="middle"
              className="fill-text-primary font-mono text-caption"
            >
              {item.cell.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function reading(drawn: MeasureCase[], slots: Slot[], schedule: PathSchedule) {
  const cases = drawn.map(
    (item) =>
      `${item.name}: ${slots
        .filter((slot) => slot.forecast)
        .map((slot) => {
          const cell = cellAt(item, slot);
          return `${slot.label} ${!cell ? "not published" : cell.value === null ? "not calculated" : cell.display}`;
        })
        .join(", ")}`,
  );
  const placed = schedule.years.filter((item) => slots.some((slot) => slot.year === item.year));
  const lane = placed.length
    ? ` Debt maturing: ${placed.map((item) => `${item.label} ${item.cell?.text ?? ""}`).join(", ")}.`
    : "";
  return `Net leverage by case. ${cases.join("; ")}.${lane}`;
}

function missingNotes(drawn: MeasureCase[], slots: Slot[]) {
  return drawn.flatMap((item) => {
    const absent = slots.filter((slot) => slot.forecast && !cellAt(item, slot));
    const blank = slots.flatMap((slot) => {
      const cell = slot.forecast ? cellAt(item, slot) : undefined;
      return cell && cell.value === null ? [cell] : [];
    });
    return [
      ...(absent.length
        ? [`${item.name}: ${periodList(absent.map(({ label }) => label))} not published.`]
        : []),
      ...blank.map(
        (cell) => `${item.name}, ${cell.period}: ${cell.reason || "not calculated by the model"}.`,
      ),
    ];
  });
}

function notes(measure: Measure, drawn: MeasureCase[], slots: Slot[], schedule: PathSchedule) {
  const out: string[] = [];
  if (measure.notice) out.push(measure.notice);
  if (measure.cases.length > MOST_CASES && measure.compared)
    out.push("More than six cases are published, so only the selected case is drawn.");
  if (measure.others.length)
    out.push(
      `The model also publishes ${periodList(measure.others)}; this chart reads ${measure.label}.`,
    );
  out.push(...missingNotes(drawn, slots));
  for (const item of schedule.years)
    if (item.cell?.value === null && slots.some((slot) => slot.year === item.year))
      out.push(`Debt maturing, ${item.label}: ${item.cell.text}.`);
  const beyond = schedule.years.filter(
    (item) => item.cell && !slots.some((slot) => slot.year === item.year),
  );
  if (beyond.length)
    out.push(
      `Debt maturing beyond this axis: ${beyond.map((item) => `${item.label} ${item.cell?.text ?? ""}`).join(", ")}.`,
    );
  if (schedule.offAxis.length)
    out.push(
      `Debt maturing, not by fiscal year: ${schedule.offAxis.map((item) => `${item.label} ${item.cell?.text ?? ""}`).join(", ")}.`,
    );
  return out;
}

function Swatch({
  dash,
  stroke,
  heavy,
}: {
  dash: string | undefined;
  stroke: string;
  heavy: boolean;
}) {
  return (
    <svg aria-hidden="true" width="24" height="8" className="flex-none">
      <line
        x1="1"
        y1="4"
        x2="23"
        y2="4"
        strokeWidth={heavy ? 2.5 : 1.75}
        strokeDasharray={dash}
        strokeLinecap="round"
        className={stroke}
      />
    </svg>
  );
}

/** One entry per case, with its key where the direct labels carry keys, and one per kind of mark,
 * naming the case it is for. */
function Legend({
  drawn,
  selected,
  measure,
  slots,
  schedule,
  keyed,
}: {
  drawn: MeasureCase[];
  selected: MeasureCase;
  measure: Measure;
  slots: Slot[];
  schedule: PathSchedule;
  keyed: boolean;
}) {
  const lane = schedule.years.some((item) => slots.some((slot) => slot.year === item.year));
  const gapped = (item: MeasureCase) =>
    slots.some((slot) => slot.forecast && cellAt(item, slot)?.value == null);
  return (
    <ul
      aria-label="Chart key"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-text-secondary"
    >
      {drawn.map((item) => {
        const style = styleOf(drawn, item);
        return (
          <li key={item.group} className="flex min-w-0 items-center gap-1.5">
            <Swatch dash={style.dash} stroke={style.stroke} heavy={item === selected} />
            {keyed && drawn.length > 1 && (
              <span className="font-mono font-medium text-text-primary">{style.key}</span>
            )}
            <span className={item === selected ? "font-medium text-text-primary" : undefined}>
              {item.name}
            </span>
          </li>
        );
      })}
      {measure.actual?.value != null && (
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-ds-full border-2 border-chart-3" />
          Actual, {measure.actual.period}
        </li>
      )}
      {lane && (
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2 bg-chart-2" />
          Debt maturing, Financial foundation
          {schedule.trace}
        </li>
      )}
      {gapped(selected) && (
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="gap-hatch h-3.5 w-2.5 rounded-ds-xs border border-dashed border-border-gap"
          />
          Hatched column: no figure for {selected.name}
        </li>
      )}
      {drawn
        .filter((item) => item !== selected && gapped(item))
        .map((item) => (
          <li key={`gap-${item.group}`} className="flex items-center gap-1.5">
            <svg aria-hidden="true" width="10" height="10" className="flex-none">
              <rect
                x="0.5"
                y="0.5"
                width="9"
                height="9"
                rx="2"
                strokeDasharray="2 1"
                className={cx("fill-surface-canvas", styleOf(drawn, item).stroke)}
              />
            </svg>
            Square at the foot: no figure for {item.name}
          </li>
        ))}
    </ul>
  );
}

type TableRow = {
  key: string;
  label: string;
  year: number;
  forecast: Slot | null;
  actual: boolean;
};

/** One row per period label as published: an actual year and a forecast year are different
 * columns of the model, so FY2025 and FY2025E are different rows, and an actual is never put in a
 * case's column. */
function tableRows(slots: Slot[], measure: Measure, schedule: PathSchedule): TableRow[] {
  const actual = measure.actual?.value != null ? measure.actual : null;
  const rows: TableRow[] = [];
  if (actual) {
    const year = fiscalYear(actual.period) ?? 0;
    rows.push({
      key: `actual-${actual.period}`,
      label: actual.period,
      year,
      forecast: null,
      actual: true,
    });
  }
  for (const slot of slots) {
    if (slot.forecast)
      rows.push({
        key: `forecast-${slot.label}`,
        label: slot.label,
        year: slot.year,
        forecast: slot,
        actual: false,
      });
    else if (
      !rows.some((row) => row.year === slot.year) &&
      schedule.years.some((item) => item.year === slot.year)
    )
      rows.push({
        key: `debt-${slot.label}`,
        label: slot.label,
        year: slot.year,
        forecast: null,
        actual: false,
      });
  }
  return rows.sort((a, b) => a.year - b.year || Number(b.actual) - Number(a.actual));
}

function PathTable({
  drawn,
  slots,
  measure,
  schedule,
}: {
  drawn: MeasureCase[];
  slots: Slot[];
  measure: Measure;
  schedule: PathSchedule;
}) {
  const actual = measure.actual?.value != null ? measure.actual : null;
  const lane = schedule.years.some((item) => slots.some((slot) => slot.year === item.year));
  const rows = tableRows(slots, measure, schedule);
  // A year's maturities sit once, on the forecast row of that year where there is one.
  const debtRow = (year: number) =>
    rows.find((row) => row.year === year && row.forecast) ?? rows.find((row) => row.year === year);
  return (
    <div
      role="region"
      aria-label="Net leverage table"
      // The wide read-only table must be reachable for keyboard scrolling.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="relative min-w-0 overflow-x-auto rounded-ds-sm outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:p-2"
    >
      <table className="w-full border-collapse text-small">
        <caption className="sr-only">Net leverage by case</caption>
        <thead>
          <tr className="border-b border-border-hairline text-left text-caption text-text-tertiary">
            <th scope="col" className="py-2 pr-4 font-medium">
              Period
            </th>
            {actual && (
              <th scope="col" className="py-2 pr-4 font-medium">
                Actual
              </th>
            )}
            {drawn.map((item) => (
              <th key={item.group} scope="col" className="py-2 pr-4 font-medium">
                {item.name}
              </th>
            ))}
            {lane && (
              <th scope="col" className="py-2 pr-4 font-medium">
                {`Debt maturing${schedule.unit ? `, ${schedule.unit}` : ""}`}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const owed =
              debtRow(row.year) === row
                ? schedule.years.filter((item) => item.year === row.year)
                : [];
            return (
              <tr key={row.key} className="border-b border-border-hairline">
                <th scope="row" className="py-2 pr-4 text-left font-mono font-normal">
                  {row.label}
                </th>
                {actual && (
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {row.actual ? actual.display : ""}
                  </td>
                )}
                {drawn.map((item) => {
                  const slot = row.forecast;
                  if (!slot) return <td key={item.group} className="py-2 pr-4" />;
                  const cell = cellAt(item, slot);
                  const text = !cell
                    ? "Not published"
                    : cell.value === null
                      ? cell.reason || cell.display
                      : cell.display;
                  return (
                    <td
                      key={item.group}
                      className={cx(
                        "py-2 pr-4",
                        cell?.value == null ? "text-gap-text" : "font-mono tabular-nums",
                      )}
                    >
                      {text}
                    </td>
                  );
                })}
                {lane && (
                  <td className="py-2 pr-4">
                    {owed.map((item) => (
                      <span
                        key={item.key}
                        className={cx(
                          "block",
                          item.cell?.value == null ? "text-gap-text" : "font-mono tabular-nums",
                        )}
                      >
                        {owed.length > 1 ? `${item.label}: ` : ""}
                        {item.cell?.text}
                      </span>
                    ))}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Text widths as the browser draws them, read from hidden probes once the chart is drawn. */
function useTextWidth() {
  const probe = useRef<SVGTextElement>(null);
  const [widths, setWidths] = useState<{ figure: number; gap: number } | null>(null);
  useLayoutEffect(() => {
    const node = probe.current;
    if (!node || typeof node.getComputedTextLength !== "function") return;
    const read = (className: string, text: string) => {
      node.setAttribute("class", className);
      node.textContent = text;
      return node.getComputedTextLength() / text.length;
    };
    const figure = read("font-mono text-small font-medium", "0000000000");
    const gap = read("text-caption", "Not calculated Not published");
    if (figure > 0 && gap > 0) setWidths({ figure, gap });
  }, []);
  const widthOf: TextWidth = (text, kind) =>
    widths ? text.length * widths[kind] : estimate(text, kind);
  return { probe, widthOf };
}

/** The room right of the plot for the end labels: names where they fit in a quarter of the width,
 * else the short keys the legend names. */
function labelRoom(drawn: MeasureCase[], slots: Slot[], width: number, widthOf: TextWidth) {
  const ends = drawn.flatMap((item) => {
    const last = [...slots]
      .reverse()
      .map((slot) => cellAt(item, slot))
      .find((cell) => cell?.value != null);
    return last ? [{ item, last }] : [];
  });
  const need = (keyed: boolean) =>
    Math.max(
      24,
      ...ends.map(({ item, last }) => widthOf(endText(item, last, drawn, keyed), "figure") + 16),
    );
  const named = need(false);
  // Names take up to a third of the drawing before the labels fall back to keys: at the
  // narrowest supported page two-word case names still sit beside their lines.
  return named <= width * 0.32 ? { keyed: false, room: named } : { keyed: true, room: need(true) };
}

function Chart({
  measure,
  selected,
  drawn,
  slots,
  schedule,
}: {
  measure: Measure;
  selected: MeasureCase;
  drawn: MeasureCase[];
  slots: Slot[];
  schedule: PathSchedule;
}) {
  const { ref, width } = useMeasuredWidth(872);
  const { probe, widthOf } = useTextWidth();
  const values = [
    ...drawn.flatMap((item) => [...item.cells.values()].map((cell) => cell.value)),
    measure.actual?.value ?? null,
  ].filter((value): value is number => value !== null);
  const lane = schedule.years.some((item) => slots.some((slot) => slot.year === item.year));
  const { keyed, room } = labelRoom(drawn, slots, width, widthOf);
  const g = geometry(width, slots, values, lane, room);
  return (
    <>
      <Legend
        drawn={drawn}
        selected={selected}
        measure={measure}
        slots={slots}
        schedule={schedule}
        keyed={keyed}
      />
      <figure className="m-0 grid min-w-0 gap-2">
        <div ref={ref} className="min-w-0">
          <svg
            role="img"
            aria-label={reading(drawn, slots, schedule)}
            width={width}
            height={g.height}
            viewBox={`0 0 ${String(width)} ${String(g.height)}`}
            className="block max-w-full"
          >
            <defs>
              <Hatch />
            </defs>
            <text ref={probe} aria-hidden="true" visibility="hidden" x="0" y="0" />
            <Grid g={g} />
            <GapColumns selected={selected} slots={slots} g={g} />
            <OtherGaps drawn={drawn} selected={selected} slots={slots} g={g} />
            <Actual measure={measure} g={g} />
            <Lines drawn={drawn} selected={selected} slots={slots} g={g} />
            <Axis slots={slots} g={g} />
            {lane && <Lane schedule={schedule} slots={slots} g={g} />}
            {/* Labels last, over every mark, each placed clear of the marks and of one another. */}
            <Labels labels={pointLabels(drawn, selected, slots, g, measure, keyed, widthOf)} />
          </svg>
        </div>
        {lane && (
          <p className="text-caption text-text-secondary">
            {`Bars under the axis: debt maturing in the year${schedule.unit ? `, ${schedule.unit}` : ""}, as the schedule writes it; a hatched bar is a year the schedule gives no amount for.`}
          </p>
        )}
      </figure>
    </>
  );
}

/**
 * The lead: net leverage by case on a fiscal-year axis with the maturity schedule under it. A
 * year the selected case does not publish, or publishes without a value, is a hatched column; no
 * line is joined across it. Covenant levels are not drawn on the model's path: the model's
 * figures are not covenant tests.
 */
export function LeveragePath({
  measure,
  rows = [],
  group,
  caseName,
  schedule,
  trace,
}: {
  measure: Measure | null;
  /** Every net leverage row the model publishes, to say what is true when none is read. */
  rows?: string[];
  group: string | undefined;
  caseName: string | undefined;
  schedule: PathSchedule;
  trace?: ReactNode;
}) {
  const [view, setView] = useState("chart");
  const { selected, drawn } = measure
    ? drawnCases(measure, group)
    : { selected: undefined, drawn: [] };
  const slots = measure && selected ? axisSlots(measure, drawn, schedule) : [];
  const forecast = slots.filter((slot) => slot.forecast);
  const span = forecast.length
    ? `, ${forecast[0]?.label ?? ""} to ${forecast.at(-1)?.label ?? ""}`
    : "";
  return (
    <Tile
      span={8}
      label="Net leverage path"
      title={
        drawn.length > 1
          ? "Net leverage by case"
          : `Net leverage, ${caseName ?? selected?.name ?? "model"}`
      }
      kicker={span ? span.slice(2) : undefined}
      className="lg:self-start"
      trace={
        <div className="flex flex-none items-center gap-2">
          {measure && selected && (
            <Segmented
              label="Net leverage view"
              segments={[
                { key: "chart", label: "Chart" },
                { key: "table", label: "Table" },
              ]}
              current={view}
              onSelect={setView}
            />
          )}
          {trace}
        </div>
      }
    >
      {!measure || !selected ? (
        <GapNote>
          {absentText(
            { measure, rows, what: "net leverage", basis: "net debt over Adj EBITDA" },
            caseName,
          )}
        </GapNote>
      ) : (
        <>
          {view === "chart" ? (
            <Chart
              measure={measure}
              selected={selected}
              drawn={drawn}
              slots={slots}
              schedule={schedule}
            />
          ) : (
            <figure className="m-0 min-w-0">
              <PathTable drawn={drawn} slots={slots} measure={measure} schedule={schedule} />
            </figure>
          )}
          {schedule.gap}
          <ul className="grid gap-1 text-small text-text-secondary">
            {notes(measure, drawn, slots, schedule).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      )}
    </Tile>
  );
}
