import { fittingTicks, NARROW, niceAxis, SIZE, textWidth, wrap } from "../kit/marks";
import { group } from "../kit/numbers";
import { written as safeText } from "./periodsData";
import type { PeriodCell, Segment, SegmentView } from "./foundationData";
import { latestReported } from "../kit/tables";

// The segments figure at its measured width: per segment a net-sales bar and an EBITDA bar beneath
// it on one scale from zero, the drawn period's figures as written, and, when the handoff states a
// comparison, a thin tick beneath each bar at the prior period's figure with that figure written.
// No ratio, no sum, no group figure (ruling i).

/** Which periods the figure draws: bars for `drawn`, ticks for `prior`; the rest are named in a note. */
export type SegmentPeriods = { drawn: string; prior: string | null; notDrawn: string[] };

export function segmentPeriods(view: SegmentView): SegmentPeriods | null {
  const annual = view.periods.filter((period) => period.kind === "annual");
  // The bars are the compared period, else the latest annual one, else the latest reported one:
  // a pro forma or forecast period only when the schedule states no reported period.
  const drawn =
    view.comparison?.to ??
    annual.at(-1)?.label ??
    (latestReported(view.periods, (period) => period.label) ?? view.periods.at(-1))?.label;
  if (drawn === undefined) return null;
  const prior = view.comparison?.from ?? null;
  const notDrawn = view.periods
    .map((period) => period.label)
    .filter((label) => label !== drawn && label !== prior);
  return { drawn, prior, notDrawn };
}

/** One cell of the figure: a stated number, a stated gap with its words, or other words. */
export type SegmentValue =
  | { kind: "number"; value: number; text: string }
  | { kind: "gap"; text: string }
  | { kind: "words"; text: string };

/** A cell as the figure draws it; a period the schedule states nothing for is a gap, never zero. */
export function segmentValue(values: readonly PeriodCell[], period: string): SegmentValue {
  const cell = values.find((value) => value.label === period)?.cell ?? null;
  if (!cell) return { kind: "gap", text: `This page could not read ${period} for this row.` };
  if (cell.kind === "number") return { kind: "number", value: cell.value, text: group(cell.text) };
  return { kind: cell.kind === "gap" ? "gap" : "words", text: safeText(cell.text) };
}

export const SEG = {
  bar: 12,
  /** The prior tick row under a bar: tick, then its figure in 11 px. */
  tickRow: 14,
  rowGap: 5,
  blockGap: 16,
  nameLine: 15,
  gapSlot: 40,
  axis: 22,
  /** A stated amount too small to see is drawn this wide; a stated zero is drawn as zero. */
  thinnest: 2,
} as const;

export type MeasureRow = {
  measure: "sales" | "ebitda";
  current: SegmentValue;
  y: number;
  /** The bar for a number (width 0 for a stated zero). */
  bar: { x: number; width: number } | null;
  /** Where the figure, or the gap's words, start. */
  labelX: number;
  /** The words beside a gap slot or in place of a bar, wrapped. */
  lines: string[];
  prior: { x: number | null; text: string } | null;
  height: number;
};

type SegmentBlock = {
  segment: Segment;
  name: string;
  nameLines: string[];
  nameY: number[];
  rows: MeasureRow[];
};

export type SegmentLayout = {
  layout: "wide" | "narrow";
  width: number;
  height: number;
  from: number;
  to: number;
  zero: number;
  top: number;
  bottom: number;
  ticks: { value: number; label: string; x: number }[];
  blocks: SegmentBlock[];
};

const numbers = (values: readonly SegmentValue[]) =>
  values.flatMap((value) => (value.kind === "number" ? [value.value] : []));

const priorText = (prior: string, value: SegmentValue) =>
  value.kind === "number" ? `${prior} ${value.text}` : `${prior}: ${value.text}`;

/** Segment blocks on one scale from zero at `width` px; names left (wide) or above (narrow). */
export function segmentLayout(
  view: SegmentView,
  periods: SegmentPeriods,
  width: number,
): SegmentLayout {
  const layout = width < NARROW ? "narrow" : "wide";
  const cells = view.segments.map((segment) => ({
    segment,
    sales: segmentValue(segment.sales, periods.drawn),
    ebitda: segmentValue(segment.ebitda, periods.drawn),
    priorSales: periods.prior ? segmentValue(segment.sales, periods.prior) : null,
    priorEbitda: periods.prior ? segmentValue(segment.ebitda, periods.prior) : null,
  }));
  const all = cells.flatMap((cell) => [cell.sales, cell.ebitda]);
  const priors = cells
    .flatMap((cell) => [cell.priorSales, cell.priorEbitda])
    .flatMap((v) => v ?? []);
  const axis = niceAxis(numbers([...all, ...priors]), { zero: true });
  const names = view.segments.map((segment) => safeText(segment.name));
  const nameWidth =
    layout === "wide"
      ? Math.min(width * 0.3, Math.max(...names.map((name) => textWidth(name, 13))) + 14)
      : 0;
  // Room right of the longest bar for its figure and for the prior tick's words.
  const labels = [
    ...all.flatMap((value) => (value.kind === "number" ? [textWidth(value.text, SIZE.value)] : [])),
    ...(periods.prior
      ? priors.flatMap((value) =>
          value.kind === "number" ? [textWidth(priorText(periods.prior ?? "", value), 11)] : [],
        )
      : []),
  ];
  const from = nameWidth + 2;
  const to = Math.max(from + 80, width - Math.max(40, ...labels) - 10);
  const x = (value: number) => axis.place(value, from, to);
  const zero = x(0);

  const row = (
    measure: MeasureRow["measure"],
    current: SegmentValue,
    prior: SegmentValue | null,
    y: number,
  ): MeasureRow => {
    let bar: MeasureRow["bar"] = null;
    let labelX = zero + 6;
    let lines: string[] = [];
    if (current.kind === "number") {
      const span = Math.abs(x(current.value) - zero);
      const size = current.value === 0 ? 0 : Math.max(SEG.thinnest, span);
      bar = { x: current.value < 0 ? zero - size : zero, width: size };
      labelX = current.value < 0 ? zero + 6 : zero + size + 6;
    } else {
      labelX = zero + (current.kind === "gap" ? SEG.gapSlot + 6 : 4);
      lines = wrap(current.text, Math.max(60, width - labelX), 11);
    }
    const priorMark =
      prior && periods.prior
        ? {
            x: prior.kind === "number" ? x(prior.value) : null,
            text: priorText(periods.prior, prior),
          }
        : null;
    const body = Math.max(SEG.bar, lines.length * 13);
    return {
      measure,
      current,
      y,
      bar,
      labelX,
      lines,
      prior: priorMark,
      height: body + (priorMark ? SEG.tickRow : 0),
    };
  };

  let top = 6;
  const blocks = cells.map((cell, at): SegmentBlock => {
    const name = names[at] ?? "";
    const nameLines =
      layout === "wide" ? wrap(name, nameWidth - 10, 13) : wrap(name, width - 4, 13);
    const rowsTop = layout === "narrow" ? top + nameLines.length * SEG.nameLine + 3 : top;
    const sales = row("sales", cell.sales, cell.priorSales, rowsTop);
    const ebitda = row(
      "ebitda",
      cell.ebitda,
      cell.priorEbitda,
      rowsTop + sales.height + SEG.rowGap,
    );
    const rowsBottom = ebitda.y + ebitda.height;
    const nameTop = layout === "narrow" ? top : rowsTop;
    const block: SegmentBlock = {
      segment: cell.segment,
      name,
      nameLines,
      nameY: nameLines.map((_, line) => nameTop + 11 + line * SEG.nameLine),
      rows: [sales, ebitda],
    };
    const nameBottom = nameTop + nameLines.length * SEG.nameLine;
    top = Math.max(rowsBottom, nameBottom) + SEG.blockGap;
    return block;
  });
  const bottom = top - SEG.blockGap + 6;
  const ticks = fittingTicks(axis, from, to, (text) => textWidth(text, SIZE.tick)).map((tick) => ({
    ...tick,
    x: x(tick.value),
  }));
  return {
    layout,
    width,
    height: bottom + SEG.axis,
    from,
    to,
    zero,
    top: 2,
    bottom,
    ticks,
    blocks,
  };
}
