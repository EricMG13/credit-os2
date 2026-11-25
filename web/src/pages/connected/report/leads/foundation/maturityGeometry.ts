import type { Cell } from "../../overview/figureData";
import { fittingTicks, LINE, niceAxis, SIZE, textWidth, wrap } from "../kit/marks";
import { group } from "../kit/numbers";

// The compact maturity wall drawn at its measured width, so its text is its real size (11 px ticks
// and years, 12 px amounts) at every width. A true year axis: one slot per year from the first to
// the last (a year with no row is a gap slot), then the undated buckets after an axis break. When
// the columns have no room for their labels the wall is drawn as rows, one period per row.

/** One period of the wall as `wallSlots` gives it: `cell` is null for a year with no row. */
export type WallSlot = { label: string; cell: Cell | null };

export type WallMark = {
  label: string;
  cell: Cell | null;
  undated: boolean;
  /** "bar": a stated amount; "gap": a stated gap; "none": a year with no row. */
  kind: "bar" | "gap" | "none";
  /** The amount as written, grouped; null for a gap. */
  text: string | null;
  /** Column layout: slot centre and bar box. Row layout: row top and bar box. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Drawn at the 2 px minimum: a stated amount too small to see. */
  least: boolean;
  centre: number;
  /**
   * Rows whose labels are too long to sit beside the bars: the label's lines, drawn above the bar
   * from `labelTop`. Absent where the label sits at the left of its row.
   */
  labelLines?: string[];
  labelTop?: number;
};

export type WallLayout = {
  layout: "columns" | "rows";
  width: number;
  height: number;
  marks: WallMark[];
  /** Columns: the baseline y. Rows: the zero x. */
  base: number;
  /** Where the axis break glyph is drawn (columns: x; rows: y), or null with no undated bucket. */
  breakAt: number | null;
  ticks: { label: string; at: number }[];
  /** Columns: the plot's left and right. Rows: the bars' top and bottom. */
  from: number;
  to: number;
};

const THINNEST = 2;
const GAP_MARK = 22;
const BREAK = 26;
const PLOT = 116;
const TOP = 22;
const ROW = 24;
const BAR_ROW = 14;
/** The two words a gap column writes above its slot. */
export const GAP_WORDS = { gap: ["Not", "supplied"], none: ["No row"] } as const;

const valueOf = (slot: WallSlot) => slot.cell?.value ?? null;
const kindOf = (slot: WallSlot): WallMark["kind"] =>
  slot.cell === null ? "none" : slot.cell.value === null ? "gap" : "bar";
const textOf = (slot: WallSlot) =>
  slot.cell && slot.cell.value !== null ? group(slot.cell.text) : null;

/** The widest label a column must hold: its period, its amount, or the gap's words. */
function columnNeed(slot: WallSlot) {
  const kind = kindOf(slot);
  const words = kind === "bar" ? [] : GAP_WORDS[kind];
  return Math.max(
    textWidth(slot.label, SIZE.tick),
    textWidth(textOf(slot) ?? "", SIZE.value),
    ...words.map((word) => textWidth(word, SIZE.tick)),
  );
}

/** The wall at `width` px: columns where every label fits its slot, rows otherwise. */
export function wallLayout(dated: WallSlot[], undated: WallSlot[], width: number): WallLayout {
  const values = [...dated, ...undated].flatMap((slot) => valueOf(slot) ?? []);
  const axis = niceAxis(values, { zero: true });
  const columns = columnLayout(dated, undated, width, axis);
  return columns ?? rowLayout(dated, undated, width, axis);
}

type Axis = ReturnType<typeof niceAxis>;

function columnLayout(
  dated: WallSlot[],
  undated: WallSlot[],
  width: number,
  axis: Axis,
): WallLayout | null {
  const gutter = Math.max(...axis.ticks.map((tick) => textWidth(tick.label, SIZE.tick))) + 10;
  const split = dated.length > 0 && undated.length > 0;
  const room = width - gutter - 4 - (split ? BREAK : 0);
  const needDated = Math.max(0, ...dated.map(columnNeed)) + 8;
  const needUndated = Math.max(0, ...undated.map(columnNeed)) + 8;
  const even = room / (dated.length + undated.length);
  const undatedSlot = Math.max(even, needUndated);
  const datedSlot = dated.length ? (room - undated.length * undatedSlot) / dated.length : 0;
  if ((dated.length && datedSlot < needDated) || undatedSlot * undated.length > room) return null;
  const base = TOP + PLOT;
  const y = (value: number) => axis.place(value, base, TOP);
  const zero = y(0);
  const bar = Math.min(40, (dated.length ? datedSlot : undatedSlot) * 0.62);
  const marks = [...dated, ...undated].map((slot, at): WallMark => {
    const isUndated = at >= dated.length;
    const start = isUndated
      ? gutter + dated.length * datedSlot + (split ? BREAK : 0) + (at - dated.length) * undatedSlot
      : gutter + at * datedSlot;
    const centre = start + (isUndated ? undatedSlot : datedSlot) / 2;
    const kind = kindOf(slot);
    const value = valueOf(slot);
    const span = value === null ? GAP_MARK : Math.abs(y(value) - zero);
    const least = value !== null && value !== 0 && span < THINNEST;
    const height = value === 0 ? 0 : Math.max(THINNEST, span);
    return {
      label: slot.label,
      cell: slot.cell,
      undated: isUndated,
      kind,
      text: textOf(slot),
      x: centre - bar / 2,
      y: value !== null && value < 0 ? zero : zero - height,
      width: bar,
      height,
      least,
      centre,
    };
  });
  return {
    layout: "columns",
    width,
    height: base + 26,
    marks,
    base: zero,
    breakAt: split ? gutter + dated.length * datedSlot + BREAK / 2 : null,
    ticks: axis.ticks.map((tick) => ({ label: tick.label, at: y(tick.value) })),
    from: gutter,
    to: width - 4,
  };
}

function rowLayout(dated: WallSlot[], undated: WallSlot[], width: number, axis: Axis): WallLayout {
  const slots = [...dated, ...undated];
  const widest = Math.max(...slots.map((slot) => textWidth(slot.label, SIZE.label))) + 10;
  // Labels that would take more than about two fifths of the row leave the bars no room: each
  // then stands whole above its bar, and the bars run the full width.
  const stacked = widest > width * 0.42;
  const labelWidth = stacked ? 4 : widest;
  // A gap row's slot and words start at zero, so only the amounts need room past the bars.
  const valueWidth =
    Math.max(0, ...slots.map((slot) => textWidth(textOf(slot) ?? "", SIZE.value))) + 8;
  const from = labelWidth;
  const to = Math.max(from + 60, width - valueWidth);
  const x = (value: number) => axis.place(value, from, to);
  const zero = x(0);
  const split = dated.length > 0 && undated.length > 0;
  const lines = slots.map((slot) => (stacked ? wrap(slot.label, width, SIZE.label) : []));
  const marks = slots.map((slot, at): WallMark => {
    const isUndated = at >= dated.length;
    const above = lines.slice(0, at).reduce((sum, own) => sum + own.length * LINE, 0);
    const labelTop = 4 + at * ROW + above + (split && isUndated ? BREAK / 2 : 0);
    const top = labelTop + (lines[at]?.length ?? 0) * LINE;
    const kind = kindOf(slot);
    const value = valueOf(slot);
    const span = value === null ? 40 : Math.abs(x(value) - zero);
    const least = value !== null && value !== 0 && span < THINNEST;
    const length = value === 0 ? 0 : Math.max(THINNEST, span);
    return {
      label: slot.label,
      cell: slot.cell,
      undated: isUndated,
      kind,
      text: textOf(slot),
      x: value !== null && value < 0 ? zero - length : zero,
      y: top + (ROW - BAR_ROW) / 2,
      width: length,
      height: BAR_ROW,
      least,
      centre: top + ROW / 2,
      ...(stacked ? { labelLines: lines[at] ?? [], labelTop } : {}),
    };
  });
  const last = marks.at(-1);
  const bottom = (last ? last.centre + ROW / 2 : 4) + 2;
  const ticks = fittingTicks(axis, from, to, (text) => textWidth(text, SIZE.tick));
  return {
    layout: "rows",
    width,
    height: bottom + 20,
    marks,
    base: zero,
    breakAt: split
      ? 4 +
        dated.length * ROW +
        lines.slice(0, dated.length).reduce((sum, own) => sum + own.length * LINE, 0) +
        BREAK / 4
      : null,
    ticks: ticks.map((tick) => ({ label: tick.label, at: x(tick.value) })),
    from: 4,
    to: bottom,
  };
}
