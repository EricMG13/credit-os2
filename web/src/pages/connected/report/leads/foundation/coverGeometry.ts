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
import { safeText } from "../kit/reader";
import { UNORDERED_SENTENCE } from "../kit/tables";
import { cellText, type InterestCover } from "./foundationData";

// Interest cover as a dot strip at the measured width: one row per stated period in time order on
// one scale from zero, the earlier periods as rings, the latest as the dot, consecutive stated
// periods joined (a line by period). A stated gap is the hatched slot with its reason in its row;
// words are written in place. Periods that cannot be put in time order are drawn as stated, not
// joined. The one change printed is the kit's (`changeBetween`), with its better/worse from signal.ts.

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
  return { kind: "words", text: safeText(cell.text) };
}

const marksOf = (cover: InterestCover) => cover.values.map((_, at) => markOf(cover, at));

/** The legend: the earlier periods' ring, the latest period's dot, the gap's hatch where drawn. */
export function coverLegend(cover: InterestCover): LegendEntry[] {
  const marks = marksOf(cover);
  const stated = cover.values.filter((_, at) => marks[at]?.kind === "value");
  const latest = stated.at(-1);
  const earlier = stated.slice(0, -1).map((value) => value.label);
  return [
    ...(earlier.length
      ? [{ kind: "ring" as const, tone: "prior" as const, text: earlier.join(", ") }]
      : []),
    ...(latest && earlier.length ? [{ kind: "dot" as const, text: latest.label }] : []),
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
  const lastValue = marks.map((mark) => mark.kind).lastIndexOf("value");
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
  const links = cover.ordered
    ? rows.slice(1).flatMap((row, at) => {
        const before = rows[at];
        if (before?.mark.kind !== "value" || row.mark.kind !== "value") return [];
        const from: [number, number] = [x(before.mark.value), before.y];
        return [{ from, to: [x(row.mark.value), row.y] as [number, number] }];
      })
    : [];
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
  const { change } = cover;
  const [from, to] = cover.values.slice(-2);
  if (!change || !from || !to) return null;
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
  return `${from.label} to ${to.label}: ${[signed, ...words].join(", ")}`;
}

/** The notes under the strip: the order sentence for periods drawn as stated, then the module's own. */
export const coverNotes = (cover: InterestCover) => [
  ...(cover.ordered ? [] : [UNORDERED_SENTENCE]),
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
  const order = cover.ordered ? "by period" : "in the order stated";
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
