import { items, ticks, type SourceTable } from "../../visuals/visualData";
import { columnAt, readCell, type Cell } from "./figureData";
import { labelText } from "./notes";

type Descriptor = Record<string, unknown>;

/** One period on the wall. `cell` is null for a year the schedule has no row for; `line` is the
 * row's handoff line. */
type WallSlot = { label: string; cell: Cell | null; line?: number };

/** A single year as a period label: "2026", "FY2026", "FY 2026E". "2029+", "≥2030" or
 * "2030 and after" name no single year. */
const YEAR = /^([A-Za-z]*\s?)(\d{4})[A-Za-z]?$/;
const LONGEST_AXIS = 12;

type DatedRow = WallSlot & { year: number };

function datedSlots(dated: DatedRow[]): WallSlot[] {
  const sorted = [...dated].sort((a, b) => a.year - b.year);
  const first = sorted[0];
  const last = sorted.at(-1);
  if (!first || !last || last.year - first.year > LONGEST_AXIS) return sorted;
  const prefix = YEAR.exec(first.label)?.[1] ?? "";
  // A true time axis: every year between the first and the last has a slot, with or without a row.
  // A year with two rows keeps both, side by side as written: one is never hidden behind the other.
  return Array.from({ length: last.year - first.year + 1 }, (_, at) => {
    const year = first.year + at;
    const rows = sorted.filter((slot) => slot.year === year);
    return rows.length ? rows : [{ label: `${prefix}${String(year)}`, cell: null }];
  }).flat();
}

/** The maturity schedule as slots on a year axis, then the buckets with no year. */
export function wallSlots(table: SourceTable, descriptor: Descriptor, unit: string) {
  const column = columnAt(table, items(descriptor.columns)[0]);
  if (column === null || column === 0) return null;
  const texts = table.rows.map((row) => row[column] ?? "");
  const rows: WallSlot[] = table.rows.map((row, at) => ({
    label: labelText(row[0] ?? "", "A period"),
    cell: readCell(texts[at] ?? "", texts, unit),
    line: table.rowLines?.[at],
  }));
  if (!rows.some(({ cell }) => cell?.value != null)) return null;
  const dated = rows.flatMap((row) => {
    const year = YEAR.exec(row.label)?.[2];
    return year ? [{ ...row, year: Number(year) }] : [];
  });
  return {
    dated: datedSlots(dated),
    undated: rows.filter((row) => !YEAR.test(row.label)),
  };
}

export const WALL = { width: 872, height: 300, base: 250, top: 30, left: 16, gapMark: 36 } as const;
const BREAK = 40;
const WIDEST_BAR = 88;
const THINNEST = 2;

/** A stated zero (or less) is a figure with no height, drawn on the axis; no figure has none. */
function barHeight(value: number | null, top: number) {
  if (value === null) return null;
  return value <= 0 ? 0 : Math.max(THINNEST, (value / top) * (WALL.base - WALL.top));
}

/** Where each slot's mark sits: bar heights are the amounts on one scale from zero. */
export function wallGeometry(dated: WallSlot[], undated: WallSlot[], width: number = WALL.width) {
  const slots = [...dated, ...undated];
  const values = slots.map((slot) => slot.cell?.value ?? null);
  const top = ticks(values).at(-1)?.value ?? 1;
  const split = dated.length > 0 && undated.length > 0;
  const room = width - 2 * WALL.left - (split ? BREAK : 0);
  const slot = room / slots.length;
  const bar = Math.min(WIDEST_BAR, slot * 0.65);
  const marks = slots.map((entry, at) => {
    const start = WALL.left + at * slot + (split && at >= dated.length ? BREAK : 0);
    const value = entry.cell?.value ?? null;
    return {
      ...entry,
      undated: at >= dated.length,
      start,
      centre: start + slot / 2,
      height: barHeight(value, top),
    };
  });
  return { marks, bar, breakAt: split ? WALL.left + dated.length * slot + BREAK / 2 : null };
}

export type StackRow = {
  label: string;
  secured: boolean | null;
  amount: Cell;
  /** The published cumulative leverage, when the handoff states one for the row. */
  leverage: Cell | null;
  line?: number;
};

const flag = (text: string) => (/^yes$/i.test(text) ? true : /^no$/i.test(text) ? false : null);

/** The debt stack in rank order: the first claim first. */
export function stackRows(table: SourceTable, descriptor: Descriptor, unit: string) {
  const label = columnAt(table, descriptor.label);
  const amount = columnAt(table, descriptor.amount);
  if (label === null || amount === null) return null;
  const rank = columnAt(table, descriptor.rank);
  const secured = columnAt(table, descriptor.secured);
  const leverage = columnAt(table, descriptor.leverage);
  const amounts = table.rows.map((row) => row[amount] ?? "");
  const levers = leverage === null ? [] : table.rows.map((row) => row[leverage] ?? "");
  const rows = table.rows.map((row, at) => ({
    order: rank === null ? at : Number(row[rank]),
    label: labelText(row[label] ?? "", "A facility"),
    secured: secured === null ? null : flag(row[secured] ?? ""),
    amount: readCell(amounts[at] ?? "", amounts, unit),
    leverage: leverage === null ? null : readCell(levers[at] ?? "", levers, "x"),
    line: table.rowLines?.[at],
  }));
  if (!rows.some((row) => row.amount.value !== null)) return null;
  const place = (order: number) => (Number.isFinite(order) ? order : Infinity);
  return rows
    .sort((a, b) => place(a.order) - place(b.order))
    .map((row): StackRow => ({
      label: row.label,
      secured: row.secured,
      amount: row.amount,
      leverage: row.leverage,
      line: row.line,
    }));
}

/** A cumulative leverage cell as a multiple: "2.4" reads "2.4x"; "4.0x" stays as written. */
export const multiple = (text: string) => (/x$/i.test(text.trim()) ? text : `${text}x`);

export const STACK = {
  width: 56,
  tall: 252,
  gapSegment: 20,
  zeroSegment: 3,
  seam: 1,
  rankBreak: 6,
} as const;

/** A segment's height: in proportion to its amount; a stated zero a thin rule; no amount a gap. */
function segmentHeight(value: number | null, total: number) {
  if (value === null) return STACK.gapSegment;
  return value <= 0 ? STACK.zeroSegment : (value / total) * STACK.tall;
}

/** A segment's label: `room` tall, its first line `middle` below its top. */
export const STACK_LABEL = { room: 44, middle: 18, bracket: 24 } as const;

/** Each label's top: level with its segment's middle, pushed down only to clear the one above. */
function labelTops(segments: { y: number; height: number }[]) {
  let floor = 0;
  return segments.map(({ y, height }) => {
    const top = Math.max(floor, y + height / 2 - STACK_LABEL.middle);
    floor = top + STACK_LABEL.room;
    return top;
  });
}

/** Segment heights in proportion to the amounts; a row with no amount is a fixed gap mark. Each
 * segment carries its label's top; `height` holds the stack and its labels. */
export function stackGeometry(rows: StackRow[]) {
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.amount.value ?? 0), 0);
  let y = 0;
  const segments = rows.map((row, at) => {
    const previous = rows[at - 1];
    if (previous && previous.secured !== row.secured) y += STACK.rankBreak;
    const height = segmentHeight(row.amount.value, total);
    const segment = { ...row, y, height: Math.max(1, height - STACK.seam) };
    y += height;
    return segment;
  });
  const tops = labelTops(segments);
  const placed = segments.map((segment, at) => ({ ...segment, labelTop: tops[at] ?? 0 }));
  const labels = (tops.at(-1) ?? 0) + STACK_LABEL.room;
  return { segments: placed, height: Math.max(y, labels) };
}

/** Below this frame width the wall is drawn at the frame's own width, so its labels keep their size. */
const WALL_NARROW = 560;
const WALL_NARROWEST = 300;
/** The least room one period takes on a narrow frame: its amount and year stay legible. */
const SLOT_ROOM = 56;

/**
 * The drawing width for a frame of `measured` pixels holding `slots` periods: the frame's own
 * width, and on a narrow frame widened so each period keeps its room (the frame then scrolls).
 * Before the frame is measured, the full wall, drawn to the frame's width.
 */
export function wallWidth(measured: number | null, slots = 0) {
  if (measured === null || measured <= 0) return WALL.width;
  // At a desktop width the wall is drawn at its frame's own width: it fits and never scrolls.
  if (measured >= WALL_NARROW) return Math.round(measured);
  const least = 2 * WALL.left + SLOT_ROOM * slots;
  return Math.max(Math.round(measured), WALL_NARROWEST, least);
}
