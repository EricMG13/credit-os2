import type { TableViewData } from "../kit/LeadFrame";
import {
  LINE,
  NARROW,
  SIZE,
  fittingTicks,
  niceAxis,
  signedText,
  textWidth,
  wrap,
} from "../kit/marks";
import type { LegendEntry } from "../kit/marks/Legend";
import { group } from "../kit/numbers";
import { isReported, unplacedNotes } from "../kit/tables";
import { cellText, handoffWords, type InterestCover } from "./foundationData";

// Interest cover as a dot strip at the measured width: one row per stated period in the one period
// order on one scale from zero, the latest reported period as the dot and the others as rings,
// consecutive stated periods joined (a line by period). A stated gap is the hatched slot with its
// reason in its row; words are written in place. A period the period order cannot place is drawn
// last, not joined, and named in a note. The one change printed is the kit's (`changeBetween`),
// between the two latest reported periods, with its better/worse from signal.ts.

/** A figure as the reader sees it: the stated number grouped, with the table's unit. */
function coverText(text: string, unit: string) {
  const grouped = group(text);
  return /^[x%]$/i.test(unit) ? `${grouped}${unit}` : `${grouped} ${unit}`;
}

type Mark =
  | { kind: "value"; value: number; text: string }
  | { kind: "gap"; reason: string }
  | { kind: "words"; text: string };

type CoverRow = {
  label: string;
  mark: Mark;
  /** True for the latest stated number: drawn as the dot. */
  latest: boolean;
  /** The centre line of the row's mark. */
  y: number;
  /** The label's baseline (above the mark when narrow). */
  labelY: number;
  /** The reason's or words' lines, written in the row (gap and words rows only). */
  lines: string[];
};

export type CoverLayout = {
  narrow: boolean;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotBottom: number;
  rows: CoverRow[];
  ticks: { value: number; label: string }[];
  x: (value: number) => number;
  /** Segments between consecutive rows that both state a number: the line by period. */
  links: { from: [number, number]; to: [number, number] }[];
};

const PITCH = 30;
const AFTER = 10;
const SLOT = 16;

function markOf(cover: InterestCover, at: number): Mark {
  const cell = cover.values[at]?.cell;
  if (!cell) return { kind: "words", text: "" };
  if (cell.kind === "number")
    return { kind: "value", value: cell.value, text: coverText(cell.text, cover.unit) };
  if (cell.kind === "gap") return { kind: "gap", reason: cellText(cell) };
  return { kind: "words", text: handoffWords(cell.text) };
}

const marksOf = (cover: InterestCover) => cover.values.map((_, at) => markOf(cover, at));

/**
 * The row of the latest reported period that states a number, or -1: the one drawn as the dot.
 * A pro forma or forecast period is never the latest (kit `isReported`).
 */
const latestStated = (cover: InterestCover, marks: readonly Mark[]) =>
  cover.values
    .map((value, at) => marks[at]?.kind === "value" && isReported(value.label))
    .lastIndexOf(true);

/** The legend: the other periods' ring, the latest reported period's dot, the gap's hatch where drawn. */
export function coverLegend(cover: InterestCover): LegendEntry[] {
  const marks = marksOf(cover);
  const latest = cover.values[latestStated(cover, marks)];
  const others = cover.values
    .filter((value, at) => marks[at]?.kind === "value" && value !== latest)
    .map((value) => value.label);
  return [
    ...(others.length
      ? [{ kind: "ring" as const, tone: "prior" as const, text: others.join(", ") }]
      : []),
    ...(latest && others.length ? [{ kind: "dot" as const, text: latest.label }] : []),
    ...(marks.some((mark) => mark.kind === "gap")
      ? [{ kind: "hatch" as const, text: "Not stated" }]
      : []),
  ];
}

/** The rows' vertical layout: label above the mark when narrow, beside it when wide. */
function layRows(
  rows: readonly Pick<CoverRow, "label" | "mark" | "latest">[],
  narrow: boolean,
  plot: number,
) {
  let y = 6;
  const laid = rows.map((row): CoverRow => {
    const { mark } = row;
    const text = mark.kind === "gap" ? mark.reason : mark.kind === "words" ? mark.text : null;
    const lines = text === null ? [] : wrap(text, plot - 4);
    const head = narrow ? LINE + 4 : 0;
    const body =
      mark.kind === "value"
        ? PITCH - AFTER
        : (mark.kind === "gap" ? SLOT : 0) + lines.length * LINE;
    const centre = y + head + (mark.kind === "value" ? body / 2 : 8);
    const placed = { ...row, y: centre, labelY: narrow ? y + 12 : centre + 4, lines };
    y += head + Math.max(body, narrow ? 0 : PITCH - AFTER) + AFTER;
    return placed;
  });
  return { rows: laid, bottom: y - AFTER + 4 };
}

/** Where every row, mark and tick of the strip sits at `width` px. */
export function coverLayout(cover: InterestCover, width: number): CoverLayout {
  const narrow = width < NARROW;
  const marks = marksOf(cover);
  const lastValue = latestStated(cover, marks);
  const texts = marks.flatMap((mark) => (mark.kind === "value" ? [mark.text] : []));
  const room = Math.max(24, ...texts.map((text) => textWidth(text, SIZE.value))) + 14;
  const labelWidth = Math.max(56, ...cover.values.map((value) => textWidth(value.label))) + 16;
  const plotLeft = narrow ? 8 : labelWidth;
  const plotRight = Math.max(plotLeft + 60, width - room);
  const { rows, bottom } = layRows(
    cover.values.map((value, at) => ({
      label: value.label,
      mark: marks[at] ?? { kind: "words", text: "" },
      latest: at === lastValue,
    })),
    narrow,
    plotRight - plotLeft,
  );
  const values = marks.flatMap((mark) => (mark.kind === "value" ? [mark.value] : []));
  const axis = niceAxis([0, ...values], { zero: true, suffix: /^x$/i.test(cover.unit) ? "x" : "" });
  const x = (value: number) => axis.place(value, plotLeft, plotRight);
  // A period the period order could not place is drawn last and never joined.
  const placed = (label: string) => !cover.unplaced.includes(label);
  const links = rows.slice(1).flatMap((row, at) => {
    const before = rows[at];
    if (before?.mark.kind !== "value" || row.mark.kind !== "value") return [];
    if (!placed(before.label) || !placed(row.label)) return [];
    if (cover.separations.some(({ from, to }) => from === before.label && to === row.label))
      return [];
    const from: [number, number] = [x(before.mark.value), before.y];
    return [{ from, to: [x(row.mark.value), row.y] as [number, number] }];
  });
  return {
    narrow,
    height: bottom + 22,
    plotLeft,
    plotRight,
    plotBottom: bottom,
    rows,
    ticks: fittingTicks(axis, plotLeft, plotRight, (text) => textWidth(text, SIZE.tick)),
    x,
    links,
  };
}

const TONE_WORD = { better: "better", worse: "worse", flat: "no change", none: null } as const;

/**
 * The one change line, or null: "FY2023 to FY2024: +0.58x, up, better" — the change exactly as the
 * kit gives it, the direction in words, the better/worse word only from signal.ts.
 */
export function coverChange(cover: InterestCover): string | null {
  const { change, comparison } = cover;
  if (!change || !comparison) return null;
  const value = change.reading.kind === "number" ? change.reading.value : 0;
  const signed = change.stated
    ? change.text
    : coverText(signedText(group(change.text), value), cover.unit);
  const direction =
    change.sign === 1 ? "up" : change.sign === -1 ? "down" : change.sign === 0 ? "unchanged" : null;
  const word = TONE_WORD[cover.tone];
  const words = [direction, word === "no change" && direction === "unchanged" ? null : word].filter(
    Boolean,
  );
  return `${comparison.from} to ${comparison.to}: ${[signed, ...words].join(", ")}`;
}

/** The notes under the strip: the periods the period order could not place, then the module's own. */
export const coverNotes = (cover: InterestCover) => [
  ...unplacedNotes(cover.unplaced, cover.values.length),
  ...cover.notes,
];

/** The figure's reading: every period with its figure as written, gaps with their reasons. */
export function coverReading(cover: InterestCover) {
  const parts = marksOf(cover).map((mark, at) => {
    const label = cover.values[at]?.label ?? "";
    if (mark.kind === "value") return `${label} ${mark.text}`;
    if (mark.kind === "gap") return `${label} not stated: ${mark.reason}`;
    return `${label} ${mark.text}`;
  });
  const change = coverChange(cover);
  const order = cover.ordered ? "by period" : "by period, those not placed in time order last";
  return `${cover.label}, ${cover.unit}, ${order}: ${parts.join(", ")}.${change ? ` ${change}.` : ""} Axis from 0.`;
}

/** The table view: each period, its figure as written, and the module's basis words. */
export function coverTable(cover: InterestCover): TableViewData {
  return {
    caption: `${cover.label}, ${cover.unit}`,
    headers: ["Period", `${cover.label}, ${cover.unit}`, "Basis and limitation"],
    rows: cover.values.map((value, at) => [
      value.label,
      value.cell
        ? value.cell.kind === "number"
          ? group(value.cell.text)
          : cellText(value.cell)
        : "",
      cover.bases[at] ?? "",
    ]),
  };
}
