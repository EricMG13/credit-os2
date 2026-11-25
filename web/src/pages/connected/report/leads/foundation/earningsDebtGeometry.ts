import type { Mark } from "../../overview/marks";
import { tone } from "../../../signal";
import { changeBetween } from "../kit/changes";
import {
  LINE,
  NARROW,
  SIZE,
  fittingTicks,
  niceAxis,
  signedText,
  textWidth,
  wrap,
  type DumbbellRow,
  type DumbbellSide,
  type NiceAxis,
} from "../kit/marks";
import { group, type Reading } from "../kit/numbers";
import { safeText } from "../kit/reader";
import type {
  EarningsAgainstDebt,
  EarningsMeasure,
  LeverageSeries,
  PeriodCell,
} from "./foundationData";

// The words and positions of the earnings-against-debt tile. Every figure is one the handoff states;
// the one computed figure is a measure's exact change between the comparison periods (ruling i).

/** What a cell the table does not state for a period is called: never zero, never blank. */
const NOT_IN_TABLE = "not read";

/** The owner's table names these measures; reported EBITDA it does not, so it gets direction only. */
const TONE_KEY: Record<EarningsMeasure["key"], string> = {
  sales: "revenue",
  reportedEbitda: "reported_ebitda",
  adjustedEbitda: "adjusted_ebitda",
  grossDebt: "gross_debt",
};

/** Debt is the second series: plum, with its own legend entry. */
const seriesOf = (measure: EarningsMeasure) =>
  measure.key === "grossDebt" ? ("secondary" as const) : ("primary" as const);

/** A cell as the page writes it: the figure grouped, a gap or words as written, or "not stated …". */
function cellWords(cell: Reading | null) {
  if (cell === null) return NOT_IN_TABLE;
  return cell.kind === "number" ? group(cell.text) : safeText(cell.text);
}

/** The cell of one period, or null. */
const at = (values: readonly PeriodCell[], label: string) =>
  values.find((value) => value.label === label)?.cell ?? null;

/**
 * The change a lead may print for one measure: the exact difference between the comparison periods
 * (kit `changeBetween`: the same kind of period exactly one year apart, one unit, both figures
 * numbers), else null: the stated figures stand with their periods and no change.
 */
function printedChange(
  values: readonly PeriodCell[],
  comparison: EarningsAgainstDebt["comparison"],
  unit: string,
): string | null {
  if (!comparison) return null;
  const change = changeBetween(
    { period: comparison.from, cell: at(values, comparison.from), unit },
    { period: comparison.to, cell: at(values, comparison.to), unit },
  );
  return change?.reading.kind === "number" ? change.text : null;
}

/**
 * The compared pair, named where more than two periods are drawn ("FY2023 → FY2024"): the change
 * and its tone are that pair's, not the last segment's. Null for two periods and for no change.
 */
export const pairNamed = (data: EarningsAgainstDebt) =>
  data.comparison && data.periods.length > 2
    ? `${data.comparison.from} → ${data.comparison.to}`
    : null;

/** The stated change with its sign: "+1,355", "−6,585", "0". */
export const changeText = (change: string) => signedText(group(change), Number(change));

/** "up, better", "up, worse", "down", "unchanged": direction, and better or worse only from `tone()`. */
function changeNote(key: string, change: string) {
  const judged = tone(key, change);
  const sign = Math.sign(Number(change));
  const way = sign > 0 ? "up" : sign < 0 ? "down" : "unchanged";
  return judged === "better" || judged === "worse" ? `${way}, ${judged}` : way;
}

function side(cell: Reading | null): DumbbellSide {
  if (cell?.kind === "number") return { value: cell.value, text: group(cell.text) };
  return { gap: cellWords(cell) };
}

/** The dumbbell rows for two compared periods: earnings blue, debt plum, the change and its note. */
export function dumbbellRows(data: EarningsAgainstDebt): DumbbellRow[] {
  const comparison = data.comparison;
  if (!comparison) return [];
  return data.measures.map((measure) => {
    const change = printedChange(measure.values, comparison, data.unit);
    return {
      label: measure.label,
      prior: side(at(measure.values, comparison.from)),
      current: side(at(measure.values, comparison.to)),
      series: seriesOf(measure),
      ...(change === null
        ? {}
        : { change: changeText(change), note: changeNote(TONE_KEY[measure.key], change) }),
    };
  });
}

/** Whether every stated figure of a series is adjacent: a line never runs across an unstated period. */
export function contiguous(values: readonly PeriodCell[]) {
  const stated = values.flatMap((value, index) => (value.cell?.kind === "number" ? [index] : []));
  const [first] = stated;
  const last = stated.at(-1);
  return first === undefined || last === undefined || last - first + 1 === stated.length;
}

/** The leverage figures the Slope draws: the stated numbers only, each with its own text. */
export function leverageMarks(leverage: LeverageSeries): Mark[] {
  return leverage.values.flatMap((value) =>
    value.cell?.kind === "number"
      ? [{ label: value.label, value: value.cell.value, text: `${group(value.cell.text)}x` }]
      : [],
  );
}

/** The leverage change a lead may print, in `x`: the figures' exact change over the comparison. */
export const leverageChange = (
  leverage: LeverageSeries,
  comparison: EarningsAgainstDebt["comparison"],
) => printedChange(leverage.values, comparison, "x");

/** "worse" or "better" where the owner's table judges the printed move; otherwise no word. */
export function leverageWord(change: string | null) {
  const judged = change === null ? "none" : tone("leverage", change);
  return judged === "worse" || judged === "better" ? judged : null;
}

/** The leverage periods the module did not state as a number, each with its reason as written. */
export const leverageGaps = (leverage: LeverageSeries) =>
  leverage.values.flatMap((value) =>
    value.cell?.kind === "number" ? [] : [`${value.label}: ${cellWords(value.cell)}`],
  );

/** The leverage reading: every stated figure, the stated change and the owner's word. */
export function leverageReading(
  leverage: LeverageSeries,
  comparison: EarningsAgainstDebt["comparison"],
  pair: string | null = null,
) {
  const figures = leverage.values.map(
    (value) =>
      `${value.label} ${value.cell?.kind === "number" ? `${group(value.cell.text)}x` : cellWords(value.cell)}`,
  );
  const moved = leverageChange(leverage, comparison);
  const word = leverageWord(moved);
  const change =
    moved === null
      ? ""
      : `, ${changeText(moved)}x${word ? `, ${word}` : ""}${pair ? ` (${pair})` : ""}`;
  return `${leverage.label} on its own scale: ${figures.join(", ")}${change}.`;
}

/** The kicker's span: one period by name, otherwise the first to the last. */
export function periodSpan(labels: readonly string[], ordered = true) {
  if (!ordered) return labels.join(", ");
  const [first] = labels;
  const last = labels.at(-1);
  if (!first || !last) return "";
  return first === last ? first : `${first} → ${last}`;
}

// ---------------------------------------------------------------------------------------------
// One period: one bar per measure on one scale from zero
// ---------------------------------------------------------------------------------------------

const BAR = 16;
const ROW_GAP = 14;

export type BarRow = {
  label: string;
  labelLines: string[];
  series: "primary" | "secondary";
  top: number;
  barY: number;
  /** The stated figure, or the reason it is not drawn. */
  value: { value: number; text: string } | null;
  reason: string[];
};

/** The one-period bars at `width`: label beside (wide) or above (narrow), figure beyond the bar. */
export function barLayout(data: EarningsAgainstDebt, width: number) {
  const narrow = width < NARROW;
  const period = data.periods[0]?.label ?? "";
  const cells = data.measures.map((measure) => at(measure.values, period));
  const values = cells.flatMap((cell) => (cell?.kind === "number" ? [cell.value] : []));
  const axis = niceAxis(values, { zero: true });
  const longest = Math.max(0, ...data.measures.map((measure) => textWidth(measure.label)));
  const labelWidth = narrow ? width : Math.min(longest + 16, Math.round(width * 0.3));
  const figureRoom =
    Math.max(
      0,
      ...cells.map((cell) => (cell?.kind === "number" ? textWidth(group(cell.text)) : 0)),
    ) + 12;
  const plot = [narrow ? 0 : labelWidth, Math.max(labelWidth + 60, width - figureRoom)] as const;
  const left = narrow ? 0 : plot[0];
  const right = narrow ? width - figureRoom : plot[1];
  const x = (value: number) => axis.place(value, left, right);
  let y = 2;
  const rows = data.measures.map((measure, index): BarRow => {
    const cell = cells[index] ?? null;
    const labelLines = wrap(measure.label, labelWidth - (narrow ? 0 : 12));
    const labelHeight = narrow ? labelLines.length * LINE : 0;
    const reason = cell?.kind === "number" ? [] : wrap(cellWords(cell), right - left, SIZE.label);
    const markHeight = reason.length ? BAR + 4 + reason.length * LINE : BAR;
    const height = Math.max(narrow ? 0 : labelLines.length * LINE, labelHeight + markHeight);
    const row: BarRow = {
      label: measure.label,
      labelLines,
      series: seriesOf(measure),
      top: y,
      barY: y + labelHeight,
      value: cell?.kind === "number" ? { value: cell.value, text: group(cell.text) } : null,
      reason,
    };
    y += height + ROW_GAP;
    return row;
  });
  const plotBottom = y - ROW_GAP + 4;
  const ticks = fittingTicks(axis, left, right, (text) => textWidth(text, SIZE.tick));
  return { narrow, axis, rows, x, left, right, ticks, plotBottom, height: plotBottom + 22 };
}

// ---------------------------------------------------------------------------------------------
// Three or more periods: a small multiple, one line per measure on one shared scale from zero
// ---------------------------------------------------------------------------------------------

const PLOT_TOP = 40;
/** The plot's height: lower when the panels stack one per row, on a phone. */
const PLOT_HEIGHT = { side: 96, stacked: 72 } as const;
const GUTTER = 16;
const MARGIN = 50;
/**
 * The first period-label line's text baseline, below the axis. The zero tick's label is drawn 4 px
 * under the axis and 12 px text reaches 4 px below its baseline: a first label that runs left
 * under the tick gutter must start clear of it (its top is `PERIOD_BASE − 12`).
 */
export const PERIOD_BASE = 24;
const PAD = 32;

export type LinePoint = {
  label: string;
  x: number;
  /** The stated figure's position and text; null for a period the module did not state. */
  value: { y: number; value: number; text: string } | null;
  /** For a period not drawn: the cell as written, or "not stated in this table". */
  reason: string | null;
};

type LinePanel = {
  label: string;
  series: "primary" | "secondary";
  left: number;
  top: number;
  width: number;
  points: LinePoint[];
  /** Line segments between adjacent stated periods only: never across an unstated one. */
  segments: { x1: number; y1: number; x2: number; y2: number }[];
  periodLines: string[][];
  /**
   * How many label lines each period's label starts below the axis: neighbours whose words are
   * wider than the space between two points sit on alternating tiers, never over each other.
   */
  periodShift: number[];
  /** The label block's depth in lines, all tiers together. */
  periodDepth: number;
  reasons: string[];
  /** Whether this panel carries the scale's tick labels (the first of its row). */
  ticks: boolean;
};

/** Panels about 260 px wide at the least, so three or more periods' labels sit apart. */
const columnsFor = (width: number, count: number) =>
  Math.max(1, Math.min(count, 4, Math.floor((width + GUTTER) / (260 + GUTTER))));

/** The small multiple at `width`: every measure's panel on the one axis, gaps in place. */
export function lineLayout(data: EarningsAgainstDebt, width: number) {
  const values = data.measures.flatMap((measure) =>
    measure.values.flatMap((value) => (value.cell?.kind === "number" ? [value.cell.value] : [])),
  );
  const axis: NiceAxis = niceAxis(values, { zero: true });
  const columns = columnsFor(width, data.measures.length);
  const panelWidth = (width - GUTTER * (columns - 1)) / columns;
  const plotHeight = columns === 1 ? PLOT_HEIGHT.stacked : PLOT_HEIGHT.side;
  const y = (value: number) => axis.place(value, PLOT_TOP + plotHeight, PLOT_TOP);
  // Tick labels at least 18 px apart: every second or third is kept on a low plot.
  const every = Math.ceil(18 / (plotHeight / Math.max(1, axis.ticks.length - 1)));
  const ticks = axis.ticks.filter((_, index) => index % every === 0);
  const count = data.periods.length;
  // A period label is drawn whole. Its longest word sets the side padding (the last label is
  // centred on the last point) and, where it is wider than the space between two points, how many
  // tiers the labels alternate over.
  const word = Math.max(
    0,
    ...data.periods.flatMap((period) =>
      period.label.split(/\s+/).map((part) => textWidth(part, SIZE.tick)),
    ),
  );
  const pad = Math.max(PAD, word / 2 + 2);
  const spacing = Math.max(1, (panelWidth - MARGIN - 2 * pad) / Math.max(1, count - 1));
  const tiers = Math.max(1, Math.min(count, Math.ceil((word + 8) / spacing)));
  const slot = tiers * spacing - (tiers > 1 ? 8 : 6);
  // The first label may run left under the tick gutter; the last has only the padding.
  const room = (index: number) =>
    Math.min(
      slot,
      index === 0 ? 2 * (MARGIN + pad) - 4 : Infinity,
      index === count - 1 ? 2 * pad - 4 : Infinity,
      // Untiered labels keep the measure they have always had.
      tiers === 1 ? 2 * pad - 4 : Infinity,
    );
  const periodLines = data.periods.map((period, index) =>
    wrap(period.label, room(index), SIZE.tick),
  );
  const tierDepth = Array.from({ length: tiers }, (_, tier) =>
    Math.max(1, ...periodLines.filter((_, index) => index % tiers === tier).map((l) => l.length)),
  );
  // A tier starts a third of a line below the one above it: 12 px text on a 13 px pitch is 16 px
  // tall, so two tiers set flush would touch.
  const TIER_GAP = 0.35;
  const periodShift = periodLines.map(
    (_, index) =>
      tierDepth.slice(0, index % tiers).reduce((a, b) => a + b, 0) + (index % tiers) * TIER_GAP,
  );
  const periodDepth = tierDepth.reduce((a, b) => a + b, 0) + (tiers - 1) * TIER_GAP;
  const xOf = (left: number, index: number) => left + MARGIN + pad + index * spacing;
  const laid = data.measures.map((measure, index) => {
    const column = index % columns;
    const left = column * (panelWidth + GUTTER);
    const points = measure.values.map((value, period): LinePoint => {
      const cell = value.cell;
      return {
        label: value.label,
        x: xOf(left, period),
        value:
          cell?.kind === "number"
            ? { y: y(cell.value), value: cell.value, text: group(cell.text) }
            : null,
        reason: cell?.kind === "number" ? null : `${value.label}: ${cellWords(cell)}`,
      };
    });
    // A period the period order could not place is never joined: its figure stands as stated.
    const placed = (label: string) => !data.unplaced.includes(label);
    const segments = points.slice(1).flatMap((point, at) => {
      const before = points[at];
      return before?.value && point.value && placed(before.label) && placed(point.label)
        ? [{ x1: before.x, y1: before.value.y, x2: point.x, y2: point.value.y }]
        : [];
    });
    const reasons = measure.values.flatMap((value) =>
      value.cell?.kind === "number"
        ? []
        : wrap(`${value.label}: ${cellWords(value.cell)}`, panelWidth, SIZE.label),
    );
    return {
      label: measure.label,
      series: seriesOf(measure),
      left,
      row: Math.floor(index / columns),
      width: panelWidth,
      points,
      segments,
      reasons,
      ticks: column === 0,
    };
  });
  const rowHeight = (row: number) =>
    Math.max(
      0,
      ...laid
        .filter((panel) => panel.row === row)
        .map(
          (panel) =>
            PLOT_TOP +
            plotHeight +
            (PERIOD_BASE - 10) +
            periodDepth * 13 +
            panel.reasons.length * LINE +
            12,
        ),
    );
  const rowCount = Math.ceil(data.measures.length / columns);
  const tops = Array.from({ length: rowCount }, (_, row) =>
    Array.from({ length: row }, (_, before) => rowHeight(before)).reduce((a, b) => a + b, 0),
  );
  const panels: LinePanel[] = laid.map((panel) => {
    const top = tops[panel.row] ?? 0;
    const shift = (n: number) => n + top;
    return {
      label: panel.label,
      series: panel.series,
      left: panel.left,
      top,
      width: panel.width,
      points: panel.points.map((point) => ({
        ...point,
        value: point.value ? { ...point.value, y: shift(point.value.y) } : null,
      })),
      segments: panel.segments.map((s) => ({ ...s, y1: shift(s.y1), y2: shift(s.y2) })),
      periodLines,
      periodShift,
      periodDepth,
      reasons: panel.reasons,
      ticks: panel.ticks,
    };
  });
  const height = (tops.at(-1) ?? 0) + rowHeight(rowCount - 1);
  return {
    axis,
    y,
    panels,
    height,
    ticks,
    plot: { top: PLOT_TOP, height: plotHeight, margin: MARGIN },
  };
}

// ---------------------------------------------------------------------------------------------
// Readings and the table view
// ---------------------------------------------------------------------------------------------

/** The figure's reading: every measure in every period as written, and the stated change. */
export function earningsReading(data: EarningsAgainstDebt, form: string) {
  const parts = data.measures.map((measure) => {
    const figures = measure.values.map((value) => `${value.label} ${cellWords(value.cell)}`);
    const moved = printedChange(measure.values, data.comparison, data.unit);
    const pair = pairNamed(data);
    const change =
      moved === null
        ? ""
        : `, ${changeText(moved)} ${changeNote(TONE_KEY[measure.key], moved)}${pair ? ` (${pair})` : ""}`;
    return `${measure.label} ${figures.join(", ")}${change}`;
  });
  return `${data.unit}, ${form} on one scale from zero: ${parts.join("; ")}.`;
}

const ratio = (cell: Reading | null) =>
  cell?.kind === "number" ? `${group(cell.text)}x` : cellWords(cell);

/** The table view: every measure in every period as written, the stated change where there is one. */
export function earningsTable(data: EarningsAgainstDebt) {
  const labels = data.periods.map((period) => period.label);
  const comparison = data.comparison;
  const changeHeader = comparison ? [`Change, ${comparison.from} → ${comparison.to}`] : [];
  const rows = data.measures.map((measure) => {
    const moved = printedChange(measure.values, comparison, data.unit);
    return [
      measure.label,
      ...labels.map((label) => cellWords(at(measure.values, label))),
      ...(comparison
        ? [
            moved === null
              ? "Not stated"
              : `${changeText(moved)}, ${changeNote(TONE_KEY[measure.key], moved)}`,
          ]
        : []),
    ];
  });
  const lev = data.leverage;
  const levMoved = lev ? leverageChange(lev, comparison) : null;
  const levWord = leverageWord(levMoved);
  const leverageRow = lev
    ? [
        [
          lev.label,
          ...labels.map((label) => ratio(at(lev.values, label))),
          ...(comparison
            ? [
                levMoved === null
                  ? "Not stated"
                  : `${changeText(levMoved)}x${levWord ? `, ${levWord}` : ""}`,
              ]
            : []),
        ],
      ]
    : [];
  return {
    caption: `Earnings against debt and leverage, ${data.unit}, ${periodSpan(labels, data.ordered)}`,
    headers: ["Measure", ...labels, ...changeHeader],
    rows: [...rows, ...leverageRow],
  };
}

// ---------------------------------------------------------------------------------------------
// The leverage slope across more than two periods
// ---------------------------------------------------------------------------------------------

const SLOPE_HEIGHT = 190;
const SLOPE_TOP = 26;
const SLOPE_BOTTOM = 128;

export type SlopeDot = {
  label: string;
  x: number;
  /** The mark's y, null where the ratio is not a number. */
  y: number | null;
  value: number | null;
  text: string | null;
  periodLines: string[];
  /** The compared pair's later period carries the move's tone. */
  compared: boolean;
};

export type SlopeSegment = {
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  compared: boolean;
};

/**
 * Total debt / EBITDA over every stated period at `width` px, one scale: the segments between
 * stated neighbours, the compared pair's (and only that one) carrying the move's tone.
 */
export function leverageSlope(
  leverage: LeverageSeries,
  comparison: EarningsAgainstDebt["comparison"],
  width: number,
) {
  const numbers = leverage.values.flatMap((value) =>
    value.cell?.kind === "number" ? [value.cell.value] : [],
  );
  const axis = niceAxis(numbers, { zero: false, suffix: "x" });
  const left = Math.max(...axis.ticks.map((tick) => textWidth(tick.label, SIZE.tick))) + 16;
  // The end dots sit inside the plot so their figures and period names are never cut or on a tick.
  const first = left + 30;
  const last = width - 50;
  const right = width - 4;
  const step = leverage.values.length > 1 ? (last - first) / (leverage.values.length - 1) : 0;
  const y = (value: number) => axis.place(value, SLOPE_BOTTOM, SLOPE_TOP);
  const dots = leverage.values.map((value, at): SlopeDot => {
    const x = first + at * step;
    const cell = value.cell;
    return {
      label: value.label,
      x,
      y: cell?.kind === "number" ? y(cell.value) : null,
      value: cell?.kind === "number" ? cell.value : null,
      text: cell?.kind === "number" ? `${group(cell.text)}x` : null,
      periodLines: wrap(value.label, Math.max(60, step - 8), SIZE.tick),
      compared: comparison?.to === value.label,
    };
  });
  const segments = dots.flatMap((dot, at): SlopeSegment[] => {
    const next = dots[at + 1];
    return next && dot.y !== null && next.y !== null
      ? [
          {
            label: `${dot.label} → ${next.label}`,
            x1: dot.x,
            y1: dot.y,
            x2: next.x,
            y2: next.y,
            compared: comparison?.from === dot.label && comparison.to === next.label,
          },
        ]
      : [];
  });
  return {
    dots,
    segments,
    ticks: axis.ticks.map((tick) => ({ ...tick, y: y(tick.value) })),
    left,
    right,
    height: SLOPE_HEIGHT,
    bottom: SLOPE_BOTTOM,
  };
}
