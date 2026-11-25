/**
 * The geometry the Overview's marks are laid out with, in screen pixels: each mark is drawn at its
 * measured width, so a 12 px label is 12 px on screen. Labels are placed clear of lines and of
 * each other; scale labels that cannot fit are thinned, a figure's own label never.
 */

/**
 * One period of a series: a stated figure, or a gap (`value` null) the line breaks at. `at` places
 * it in time (in years) where every period gives one, else the periods are spaced evenly in the
 * order given; a line joins two periods only when both are stated and their `basis` is the same.
 */
export type Slot = {
  label: string;
  value: number | null;
  text: string;
  at?: number;
  basis?: string;
  /** The latest reported period, where a later one (pro forma, forecast) follows it. */
  latest?: boolean;
};

/** The place of the latest reported period: the marked one, else the last. */
export const latestAt = (slots: Slot[]) => {
  const marked = slots.findIndex((slot) => slot.latest);
  return marked < 0 ? slots.length - 1 : marked;
};

/** A drawn line, x1 y1 x2 y2, that a label must keep clear of. */
export type Line = readonly [number, number, number, number];
type Anchor = "start" | "middle" | "end";
export type Spot = { x: number; y: number; anchor: Anchor };
export type Frame = { left: number; right: number; top: number; bottom: number };

import { LEAST_TEXT } from "./svgScale";

/** Scale labels, period names and small figures (the least size on screen); the slope's figures. */
export const TEXT = LEAST_TEXT;
export const VALUE = 13;

function niceStep(span: number, parts: number) {
  const raw = span > 0 ? span / parts : 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const factor = raw / power;
  return (factor <= 1 ? 1 : factor <= 2 ? 2 : factor <= 5 ? 5 : 10) * power;
}

/** A round axis that holds every value: its ends, its ticks and their labels. Scale labels only. */
export function axis(values: number[], parts: number, suffix: string) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = niceStep(max - min || Math.abs(max) / 10, parts);
  const lo = Math.floor(min / step) * step;
  const hi = Math.max(Math.ceil(max / step) * step, lo + step);
  const digits = Math.max(0, -Math.floor(Math.log10(step)));
  const count = Math.round((hi - lo) / step);
  const ticks = Array.from({ length: count + 1 }, (_, at) => lo + at * step);
  const label = (tick: number) =>
    `${tick.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`;
  const place = (value: number, from: number, to: number) =>
    from + ((value - lo) / (hi - lo)) * (to - from);
  return { ticks, label, place };
}

const spread = (count: number, from: number, to: number) => (at: number) =>
  count === 1 ? (from + to) / 2 : from + (at * (to - from)) / (count - 1);

/** Each period's place across `from`..`to`: by its time where every period has one, else evenly. */
export function across(slots: Slot[], from: number, to: number) {
  const times = slots.map((slot) => slot.at);
  const even = spread(slots.length, from, to);
  if (times.some((time) => time === undefined)) return even;
  const known = times as number[];
  const first = Math.min(...known);
  const span = Math.max(...known) - first;
  return (at: number) =>
    span > 0 ? from + (((known[at] ?? first) - first) / span) * (to - from) : even(at);
}

/** Two neighbouring periods are joined only when both state a figure on the same basis. */
const joined = (from: Slot | undefined, to: Slot) =>
  from?.value != null && to.value !== null && (from.basis ?? "") === (to.basis ?? "");

export const stated = (slots: Slot[]) =>
  slots.flatMap((slot) => (slot.value === null ? [] : [slot.value]));

/** Each pair of neighbouring periods that both state a figure: the line never crosses a gap. */
export function segments(slots: Slot[]) {
  return slots.slice(1).flatMap((to, at) => {
    const from = slots[at];
    return joined(from, to) && from?.value != null && to.value !== null
      ? [{ at, from: from.value, to: to.value, label: to.label }]
      : [];
  });
}

/** Runs of neighbouring stated periods, for a polyline broken at each gap. */
export function runs(slots: Slot[]) {
  const all: { at: number; value: number }[][] = [[]];
  slots.forEach((slot, at) => {
    if (slot.value === null) return void all.push([]);
    if (at > 0 && !joined(slots[at - 1], slot)) all.push([]);
    all.at(-1)?.push({ at, value: slot.value });
  });
  return all.filter((run) => run.length > 1);
}

/** A text's width: glyphs 0.6 em wide (the mono face; the sans face is narrower). */
export const textWidth = (text: string, size: number) => text.length * size * 0.6;

/** A label's box: cap height above the baseline, a descender below. */
export function labelBox({ x, y, anchor }: Spot, text: string, size: number): Frame {
  const width = textWidth(text, size);
  const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  return { left, right: left + width, top: y - size * 0.8, bottom: y + size * 0.2 };
}

/** Whether a line passes through a box (Liang-Barsky clipping). */
function crosses([x1, y1, x2, y2]: Line, box: Frame) {
  const edges = [
    [x1 - x2, x1 - box.left],
    [x2 - x1, box.right - x1],
    [y1 - y2, y1 - box.top],
    [y2 - y1, box.bottom - y1],
  ] as const;
  let [from, to] = [0, 1];
  for (const [p, q] of edges) {
    if (p === 0 && q < 0) return false;
    if (p < 0) from = Math.max(from, q / p);
    if (p > 0) to = Math.min(to, q / p);
    if (from > to) return false;
  }
  return true;
}

export const meet = (a: Frame, b: Frame, gap = 2) =>
  a.left < b.right + gap &&
  b.left < a.right + gap &&
  a.top < b.bottom + gap &&
  b.top < a.bottom + gap;

const inside = (box: Frame, frame: Frame) =>
  box.left >= frame.left &&
  box.right <= frame.right &&
  box.top >= frame.top &&
  box.bottom <= frame.bottom;

/** What a label must keep clear of: lines, and the boxes of labels already placed. */
export type Obstacles = { lines: Line[]; taken: Frame[] };

/**
 * The first spot whose label fits the frame and touches no line or placed label; else the first
 * that fits the frame and touches no placed label; else the first that fits (a label is never cut
 * off); else the first.
 */
export function clearSpot(
  spots: [Spot, ...Spot[]],
  text: string,
  size: number,
  { lines, taken }: Obstacles,
  frame: Frame,
) {
  const box = (spot: Spot) => labelBox(spot, text, size);
  const fits = spots.filter((spot) => inside(box(spot), frame));
  const free = fits.filter((spot) => !taken.some((other) => meet(box(spot), other)));
  const clear = free.find((spot) => !lines.some((line) => crosses(line, box(spot))));
  return clear ?? free[0] ?? fits[0] ?? spots[0];
}

/** The spots around a point a label is tried at, nearest first; `gap` from the point's centre. */
export function around(x: number, y: number, size: number, gap: number): [Spot, ...Spot[]] {
  const above = y - gap;
  const below = y + gap + size * 0.8;
  const level = y + size * 0.35;
  return [
    { x, y: above, anchor: "middle" },
    { x, y: below, anchor: "middle" },
    { x: x + gap, y: level, anchor: "start" },
    { x: x - gap, y: level, anchor: "end" },
    { x: x + gap / 2, y: above, anchor: "end" },
    { x: x - gap / 2, y: above, anchor: "start" },
    { x: x + gap / 2, y: below, anchor: "end" },
    { x: x - gap / 2, y: below, anchor: "start" },
    { x, y: above - size - 2, anchor: "middle" },
    { x, y: below + size + 2, anchor: "middle" },
  ];
}

/**
 * The scale or period labels that fit without overprinting, kept from the last (the latest
 * period, the top of a scale) back; the rest are thinned. Each item is its index and box.
 */
export function thinned(boxes: Frame[]) {
  const kept: number[] = [];
  for (let at = boxes.length - 1; at >= 0; at -= 1) {
    const box = boxes[at] as Frame;
    if (kept.every((other) => !meet(box, boxes[other] as Frame, 4))) kept.push(at);
  }
  return new Set(kept);
}
