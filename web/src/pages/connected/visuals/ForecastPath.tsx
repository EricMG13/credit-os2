import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Segmented } from "@/components/kit/Segmented";
import { cx } from "@/utils/cx";
import { parsePeriod } from "@/utils/periodOrder";
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
import { unitLabel } from "../publishedReport";
import { drawnReason, sentence } from "./drawnQualifications";
import { historyNotes, periodsInOrder, unplacedNote } from "./scenarioPeriods";
import { ticks } from "./visualData";
import { thinTicks } from "../report/overview/chartText";

/** The maturity schedule as its module publishes it, drawn under the fiscal years of the same axis. */
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

/**
 * One period on the X axis. `history` is a reported or pro forma period before the forecast,
 * `forecast` a period of the drawn cases, `reach` a later fiscal year a scheduled maturity falls in,
 * `unplaced` a figure under a label the period rule cannot place, drawn last.
 * `year` is the fiscal year the slot stands for; null for a period that is not one whole year.
 */
type Slot = {
  label: string;
  year: number | null;
  kind: "history" | "forecast" | "reach" | "unplaced";
};
const slotKey = (slot: Slot) => `${slot.kind}-${slot.label}`;
const isForecast = (slot: Slot) => slot.kind === "forecast";

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
 * The periods on X, in the one period order: every reported and pro forma period the measure
 * states a figure for, then the drawn cases' forecast periods (one slot per fiscal year from the
 * first to the last, published or not), then the fiscal years after them that a scheduled maturity
 * falls in, up to `REACH` years on, then the figures whose labels the rule cannot place, as
 * written. Only the drawn cases' periods are forecast slots: with no comparison, the selected
 * case's own periods alone.
 */
function axisSlots(measure: Measure, drawn: MeasureCase[], schedule: PathSchedule): Slot[] {
  const periods = [...new Set(drawn.flatMap((item) => [...item.cells.keys()]))];
  if (!periods.length) return [];
  const labels = new Map<number, string>();
  for (const period of periods) {
    const year = fiscalYear(period);
    if (year !== null) labels.set(year, period);
  }
  const years = [...labels.keys()];
  const first = Math.min(...years);
  const last = Math.max(...years);
  const everyYear = years.length
    ? Array.from({ length: last - first + 1 }, (_, at) => first + at)
    : [];
  const forecast = periodsInOrder([
    ...everyYear.map((year) => labels.get(year) ?? `FY${String(year)}E`),
    ...periods.filter((period) => fiscalYear(period) === null),
  ]);
  const end = Math.max(
    last,
    ...schedule.years.map(({ year }) => year).filter((year) => year > last && year - last <= REACH),
  );
  const reach = years.length ? Array.from({ length: end - last }, (_, at) => last + 1 + at) : [];
  return [
    ...measure.history.map(({ period }): Slot => ({
      label: period,
      year: fiscalYear(period),
      kind: "history",
    })),
    ...forecast.map((label): Slot => ({ label, year: fiscalYear(label), kind: "forecast" })),
    ...reach.map((year): Slot => ({ label: `FY${String(year)}`, year, kind: "reach" })),
    ...measure.unplaced.map(({ period }): Slot => ({
      label: period,
      year: null,
      kind: "unplaced",
    })),
  ];
}

/** The case's cell in a forecast slot: by fiscal year, or by label for a period that is not one. */
function cellAt(item: MeasureCase, slot: Slot): MeasureCell | undefined {
  if (!isForecast(slot)) return undefined;
  if (slot.year === null) return item.cells.get(slot.label);
  return [...item.cells.values()].find((cell) => fiscalYear(cell.period) === slot.year);
}

/** The figure in a slot outside the forecast: reported or pro forma before it, or unplaced. */
function historyAt(measure: Measure, slot: Slot): MeasureCell | undefined {
  if (slot.kind === "history") return measure.history.find((cell) => cell.period === slot.label);
  if (slot.kind === "unplaced") return measure.unplaced.find((cell) => cell.period === slot.label);
  return undefined;
}

/** Where a fiscal year is drawn: its forecast or later slot, else its reported one; -1 for none. */
function yearAt(slots: Slot[], year: number) {
  const later = slots.findIndex((slot) => slot.year === year && slot.kind !== "history");
  return later >= 0 ? later : slots.findIndex((slot) => slot.year === year);
}

type Segment = { from: MeasureCell; to: MeasureCell; at: number };

/** Line segments between neighbouring slots where both cells are values; never across a gap. */
function segments(item: MeasureCase, slots: Slot[]) {
  const out: Segment[] = [];
  slots.forEach((slot, at) => {
    const next = slots[at + 1];
    const from = cellAt(item, slot);
    const to = next && cellAt(item, next);
    if (from?.value != null && to?.value != null) out.push({ from, to, at });
  });
  return out;
}

/** Reported fiscal years joined to the next fiscal year only: a year to date, last twelve months
 * or pro forma figure overlaps the years beside it, so no line runs to or from it. */
function historySegments(measure: Measure, slots: Slot[]) {
  const out: Segment[] = [];
  slots.forEach((slot, at) => {
    const next = slots[at + 1];
    const from = historyAt(measure, slot);
    const to = next && historyAt(measure, next);
    if (from?.value == null || to?.value == null) return;
    if (slot.year !== null && next?.year === slot.year + 1) out.push({ from, to, at });
  });
  return out;
}

function geometry(width: number, slots: Slot[], values: number[], lane: boolean, room: number) {
  const right = width - room;
  const step = (right - LEFT) / Math.max(1, slots.length);
  /** The centre of the slot at this place on the axis. */
  const x = (at: number) => LEFT + (at + 0.5) * step;
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
  const line = ({ from, to, at }: Segment) => {
    const [x1, y1] = [g.x(at), g.y(from.value ?? 0)];
    const [x2, y2] = [g.x(at + 1), g.y(to.value ?? 0)];
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 5));
    for (let step = 0; step <= steps; step += 1)
      boxes.push(dot(x1 + ((x2 - x1) * step) / steps, y1 + ((y2 - y1) * step) / steps, 2.5, 4));
  };
  for (const item of drawn) {
    slots.forEach((slot, at) => {
      const cell = cellAt(item, slot);
      if (cell?.value == null) return;
      boxes.push(dot(g.x(at), g.y(cell.value), 7));
      // A little room around every point, so no label sits against a point it does not name.
      boxes.push({
        ...dot(g.x(at), g.y(cell.value), 18, 2),
        around: { x: g.x(at), y: g.y(cell.value) },
      });
    });
    segments(item, slots).forEach(line);
  }
  slots.forEach((slot, at) => {
    const cell = historyAt(measure, slot);
    if (cell?.value != null) boxes.push(dot(g.x(at), g.y(cell.value), 7));
  });
  historySegments(measure, slots).forEach(line);
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
    const points = slots.flatMap((slot, at) => {
      const cell = cellAt(item, slot);
      return cell ? [{ cell, at }] : [];
    });
    const last = [...points].reverse().find(({ cell }) => cell.value !== null);
    if (last) {
      wanted.push({
        key: `${item.group}-end`,
        text: endText(item, last.cell, drawn, keyed),
        kind: "figure",
        own: { x: g.x(last.at), y: g.y(last.cell.value ?? 0) },
        spots: ringed(around(g.x(last.at), g.y(last.cell.value ?? 0))),
      });
    }
    if (item !== selected) continue;
    // The selected case's highest published year, by value and year: a selection, labelled so.
    const highest = extremeOf(
      points.map(({ cell }) => cell),
      "highest",
    );
    for (const { cell, at } of points)
      if (highest?.cells.includes(cell) && cell !== last?.cell) {
        const [x, y] = [g.x(at), g.y(cell.value ?? 0)];
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
  // Each figure outside the forecast is labelled at its own period, so it is never read as a
  // forecast: the latest reported one and each unplaced one always, an earlier one where there is
  // clear room (the table has them all).
  const reported = slots.flatMap((slot, at) => {
    const cell = historyAt(measure, slot);
    return cell?.value == null ? [] : [{ cell, at, value: cell.value }];
  });
  const always = new Set([measure.history.at(-1), ...measure.unplaced]);
  for (const { cell, at, value } of [...reported].reverse()) {
    const spots = around(g.x(at), g.y(value));
    wanted.push({
      key: `history-${cell.period}`,
      text: cell.display,
      kind: "figure",
      optional: !always.has(cell),
      spots: ringed(
        [spots[5], spots[3], spots[4], spots[0]].filter((spot): spot is Spot => spot !== undefined),
      ),
    });
  }
  // The selected case's gap words, inside its hatched column, clear of every other case's marks.
  for (const slot of gapSlots(selected, slots)) {
    const x = g.x(slots.indexOf(slot));
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
  return slots.filter((slot) => isForecast(slot) && cellAt(selected, slot)?.value == null);
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
        const centre = g.x(slots.indexOf(slot));
        const half = Math.min(46, g.step * 0.32);
        return (
          <rect
            key={slotKey(slot)}
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
          .filter((slot) => isForecast(slot) && cellAt(item, slot)?.value == null)
          .map((slot) => (
            <rect
              key={`${item.group}-${slotKey(slot)}`}
              data-case-gap={`${item.group} ${cellAt(item, slot)?.period ?? slot.label}`}
              x={g.x(slots.indexOf(slot)) - 5 + at * 12}
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
            {segments(item, slots).map(({ from, to, at }) => (
              <line
                key={from.period}
                data-segment={item.group}
                x1={g.x(at)}
                y1={g.y(from.value ?? 0)}
                x2={g.x(at + 1)}
                y2={g.y(to.value ?? 0)}
                strokeWidth={on ? 2.5 : 1.75}
                strokeDasharray={style.dash}
                strokeLinecap="round"
                className={style.stroke}
              />
            ))}
            {slots.map((slot, at) => {
              const cell = cellAt(item, slot);
              return cell?.value == null ? null : (
                <circle
                  key={slotKey(slot)}
                  data-point={`${item.group} ${cell.period}`}
                  cx={g.x(at)}
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

/** The reported and pro forma figures before the forecast: a ring at each period, in their own
 * colour, the fiscal years joined. */
function History({ measure, slots, g }: { measure: Measure; slots: Slot[]; g: Geometry }) {
  return (
    <g>
      {historySegments(measure, slots).map(({ from, to, at }) => (
        <line
          key={from.period}
          data-segment="history"
          x1={g.x(at)}
          y1={g.y(from.value ?? 0)}
          x2={g.x(at + 1)}
          y2={g.y(to.value ?? 0)}
          strokeWidth="1.75"
          strokeLinecap="round"
          className="stroke-chart-3"
        />
      ))}
      {slots.map((slot, at) => {
        const cell = historyAt(measure, slot);
        return cell?.value == null ? null : (
          <circle
            key={slotKey(slot)}
            data-point={`${slot.kind} ${cell.period}`}
            cx={g.x(at)}
            cy={g.y(cell.value)}
            r="5"
            strokeWidth="2"
            strokeDasharray={slot.kind === "unplaced" ? "2 2" : undefined}
            className="fill-surface-card stroke-chart-3"
          />
        );
      })}
    </g>
  );
}

function Axis({ slots, g }: { slots: Slot[]; g: Geometry }) {
  const narrow = g.step < 64;
  const words = slots.map((slot) => (narrow ? slot.label.replace(/^FY\d{2}/u, "FY") : slot.label));
  // A label that would print over a neighbour is left out (the first and the latest are kept
  // first), as axis ticks are; its point keeps its place and the figure's reading names every period.
  const kept = new Set(
    thinTicks(
      words.map((label, at) => ({ label, x: g.x(at), at })),
      g.width,
    ).map(({ x }) => x),
  );
  return (
    <g>
      {slots.map((slot, at) => (
        <text
          key={slotKey(slot)}
          data-axis-period={slot.label}
          x={g.x(at)}
          y={AXIS}
          textAnchor="middle"
          className="fill-text-secondary font-mono text-caption"
        >
          {kept.has(g.x(at)) ? words[at] : ""}
        </text>
      ))}
    </g>
  );
}

type ScheduleCell = NonNullable<ScheduleYear["cell"]>;

/** A schedule cell the module states has no amount; text it gives without a figure is no gap. */
const isStatedGap = (cell: ScheduleCell | null): cell is ScheduleCell =>
  cell !== null && cell.value === null && cell.reason !== null;

/** A schedule cell as a reader sees it: a cited source stays in Evidence. */
const scheduleText = (cell: ScheduleCell) => drawnReason(cell.text);
const scheduleLine = (item: ScheduleYear) =>
  `${item.label} ${item.cell ? scheduleText(item.cell) : ""}`;

/** A cell's own words for why it has no amount, short enough for the lane: "Not supplied". */
const gapWords = (text: string) => /^(Not \w+)/u.exec(text.trim())?.[1] ?? "No amount";

/** The maturity schedule as written, by fiscal year, under the path on the same axis. A year with
 * several rows draws each, side by side; a year with no row draws nothing. */
function Lane({ schedule, slots, g }: { schedule: PathSchedule; slots: Slot[]; g: Geometry }) {
  const placed = schedule.years.filter((item) => yearAt(slots, item.year) >= 0);
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
        const centre = g.x(yearAt(slots, item.year));
        const x = centre - (same.length * room) / 2 + same.indexOf(item) * room + room / 2;
        if (!item.cell) return null;
        const amount = item.cell.value;
        if (isStatedGap(item.cell)) {
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
        if (amount === null)
          return (
            <text
              key={item.key}
              x={x}
              y={LANE_BASE - 6}
              textAnchor="middle"
              className="fill-text-primary font-mono text-caption"
            >
              {scheduleText(item.cell)}
            </text>
          );
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
              {scheduleText(item.cell)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** What the chart calls the figures whose labels the period rule cannot place. */
const UNPLACED = "Not placed in time order, shown last";

/** The reported and pro forma figures before the forecast, named for what they hold. */
function historyName(measure: Measure) {
  const proForma = measure.history.some(({ period }) => parsePeriod(period)?.periodClass === "pf");
  return proForma ? "Reported and pro forma" : "Reported";
}

function reading(measure: Measure, drawn: MeasureCase[], slots: Slot[], schedule: PathSchedule) {
  const before = measure.history.length
    ? [
        `${historyName(measure)}: ${measure.history.map((cell) => `${cell.period} ${cell.display}`).join(", ")}`,
      ]
    : [];
  const cases = drawn.map(
    (item) =>
      `${item.name}: ${slots
        .filter(isForecast)
        .map((slot) => {
          const cell = cellAt(item, slot);
          return `${slot.label} ${!cell ? "not published" : cell.value === null ? "not calculated" : cell.display}`;
        })
        .join(", ")}`,
  );
  const placed = schedule.years.filter((item) => yearAt(slots, item.year) >= 0);
  const lane = placed.length ? ` Debt maturing: ${placed.map(scheduleLine).join(", ")}.` : "";
  const last = measure.unplaced.length
    ? [
        `${UNPLACED}: ${measure.unplaced.map((cell) => `${cell.period} ${cell.display}`).join(", ")}`,
      ]
    : [];
  return `Net leverage by period. ${[...before, ...cases, ...last].join("; ")}.${lane}`;
}

function missingNotes(drawn: MeasureCase[], slots: Slot[]) {
  return drawn.flatMap((item) => {
    const absent = slots.filter((slot) => isForecast(slot) && !cellAt(item, slot));
    const blank = slots.flatMap((slot) => {
      const cell = cellAt(item, slot);
      return cell && cell.value === null ? [cell] : [];
    });
    return [
      ...(absent.length
        ? [`${item.name}: ${periodList(absent.map(({ label }) => label))} not published.`]
        : []),
      ...blank.map((cell) =>
        sentence(
          `${item.name}, ${cell.period}: ${drawnReason(cell.reason) || "not calculated by the model"}`,
        ),
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
  out.push(
    // Said only of what the axis holds: with no forecast period nothing is drawn, last or not.
    ...unplacedNote(
      measure.unplaced.filter(({ period }) => slots.some((slot) => slot.label === period)),
    ),
    ...historyNotes(measure.historyGaps),
    ...missingNotes(drawn, slots),
  );
  for (const item of schedule.years)
    if (isStatedGap(item.cell) && yearAt(slots, item.year) >= 0)
      out.push(sentence(`Debt maturing, ${item.label}: ${drawnReason(item.cell.text)}`));
  const beyond = schedule.years.filter((item) => item.cell && yearAt(slots, item.year) < 0);
  if (beyond.length)
    out.push(`Debt maturing in years not on this axis: ${beyond.map(scheduleLine).join(", ")}.`);
  if (schedule.offAxis.length)
    out.push(
      `Debt maturing, not by fiscal year: ${schedule.offAxis.map(scheduleLine).join(", ")}.`,
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
  const lane = schedule.years.some((item) => yearAt(slots, item.year) >= 0);
  const gapped = (item: MeasureCase) =>
    slots.some((slot) => isForecast(slot) && cellAt(item, slot)?.value == null);
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
      {measure.history.length > 0 && (
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-ds-full border-2 border-chart-3" />
          {historyName(measure)}, before the forecast
        </li>
      )}
      {measure.unplaced.length > 0 && (
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-ds-full border-2 border-dashed border-chart-3"
          />
          {UNPLACED}
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

/** One row per period on the axis, as published: a reported year and a forecast year are
 * different columns of the model, so FY2025 and FY2025E are different rows, and a reported figure
 * is never put in a case's column. A later year is a row only where a maturity falls in it. */
function tableRows(slots: Slot[], schedule: PathSchedule) {
  return slots.filter(
    (slot) => slot.kind !== "reach" || schedule.years.some((item) => item.year === slot.year),
  );
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
  const reported = measure.history.length > 0;
  const unplaced = measure.unplaced.length > 0;
  const lane = schedule.years.some((item) => yearAt(slots, item.year) >= 0);
  const rows = tableRows(slots, schedule);
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
            {reported && (
              <th scope="col" className="py-2 pr-4 font-medium">
                {historyName(measure)}
              </th>
            )}
            {unplaced && (
              <th scope="col" className="py-2 pr-4 font-medium">
                Not placed in time order
              </th>
            )}
            {drawn.map((item) => (
              <th key={item.group} scope="col" className="py-2 pr-4 font-medium">
                {item.name}
              </th>
            ))}
            {lane && (
              <th scope="col" className="py-2 pr-4 font-medium">
                {`Debt maturing${schedule.unit ? `, ${unitLabel(schedule.unit)}` : ""}`}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            // A year's maturities sit once: on its forecast row where there is one.
            const owed = schedule.years.filter((item) => slots[yearAt(slots, item.year)] === row);
            return (
              <tr key={slotKey(row)} className="border-b border-border-hairline">
                <th scope="row" className="py-2 pr-4 text-left font-mono font-normal">
                  {row.label}
                </th>
                {reported && (
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {row.kind === "history" ? (historyAt(measure, row)?.display ?? "") : ""}
                  </td>
                )}
                {unplaced && (
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {row.kind === "unplaced" ? (historyAt(measure, row)?.display ?? "") : ""}
                  </td>
                )}
                {drawn.map((item) => {
                  if (!isForecast(row)) return <td key={item.group} className="py-2 pr-4" />;
                  const cell = cellAt(item, row);
                  const text = !cell
                    ? "Not published"
                    : cell.value === null
                      ? drawnReason(cell.reason) || cell.display
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
                          isStatedGap(item.cell) ? "text-gap-text" : "font-mono tabular-nums",
                        )}
                      >
                        {owed.length > 1 ? `${item.label}: ` : ""}
                        {item.cell && scheduleText(item.cell)}
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
    ...[...measure.history, ...measure.unplaced].map((cell) => cell.value),
  ].filter((value): value is number => value !== null);
  const lane = schedule.years.some((item) => yearAt(slots, item.year) >= 0);
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
            aria-label={reading(measure, drawn, slots, schedule)}
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
            <History measure={measure} slots={slots} g={g} />
            <Lines drawn={drawn} selected={selected} slots={slots} g={g} />
            <Axis slots={slots} g={g} />
            {lane && <Lane schedule={schedule} slots={slots} g={g} />}
            {/* Labels last, over every mark, each placed clear of the marks and of one another. */}
            <Labels labels={pointLabels(drawn, selected, slots, g, measure, keyed, widthOf)} />
          </svg>
        </div>
        {lane && (
          <p className="text-caption text-text-secondary">
            {`Bars under the axis: debt maturing in the year${schedule.unit ? `, ${unitLabel(schedule.unit)}` : ""}, as the schedule writes it; a hatched bar is a year the schedule states no amount for; text it gives without a figure is drawn as written.`}
          </p>
        )}
      </figure>
    </>
  );
}

/**
 * The lead: net leverage by period, the reported and pro forma periods then each case's forecast
 * years, with the maturity schedule under the fiscal years. A
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
  const forecast = slots.filter(isForecast);
  // The axis runs from the first period drawn, reported or forecast, to the last forecast period.
  const span = forecast.length
    ? `, ${slots[0]?.label ?? ""} to ${forecast.at(-1)?.label ?? ""}`
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
            { measure, rows, what: "net leverage", basis: "net debt over EBITDA" },
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
