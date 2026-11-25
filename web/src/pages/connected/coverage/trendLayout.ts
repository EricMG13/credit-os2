/**
 * Where a trend panel's text goes: which period ticks are shown, where the first and last value
 * labels sit, and which values are written under the panel instead. Pure: every width comes from
 * the caller's measure, so the same answer holds for what a browser draws.
 */

export type Box = { left: number; right: number; top: number; bottom: number };
export type Point = { x: number; y: number };
/** Text widths in SVG user units, and the font's box above and below the baseline. */
export type Metrics = { width: (text: string) => number; ascent: number; descent: number };
type Geometry = { width: number; height: number; plot: Box; zero: number; axis: number };
type ValuePoint = Point & { text: string; period: string };
type Tick = { x: number; text: string };
/** A dashed missing-period mark: a vertical stroke at x from top to bottom. */
type GapMark = { x: number; top: number; bottom: number };

export type TrendLayoutInput = {
  metrics: Metrics;
  geometry: Geometry;
  /** Every dot drawn, in order. */
  points: readonly ValuePoint[];
  /** Every series line segment drawn, exactly. */
  segments: readonly (readonly [Point, Point])[];
  /** A tick label per period, by period order; `index` in the result refers to these. */
  ticks: readonly Tick[];
  gaps: readonly GapMark[];
  dotRadius: number;
  /** Indices into `points` to label: the first and last. */
  labelled: readonly number[];
};

/** Text drawn with `text-anchor: start` at x (its left) and baseline y. */
export type Placed = { text: string; x: number; y: number; box: Box };
type ValueLabel = Placed & { index: number; withPeriod: boolean };
export type TrendLayout = {
  zeroLabel: Placed;
  ticks: (Placed & { index: number })[];
  labels: ValueLabel[];
  /** Labelled points with no clear spot: written, with their period, under the panel. */
  fallback: number[];
};

/** Labels keep this far inside the panel. */
const EDGE = 1;
/** Space between two period tick labels. */
const TICK_GAP = 4;
/** Space between a label and its dot, and between the axis-row text and the axis. */
const PAD = 2;
/** The '0' sits this far left of the plot. */
const ZERO_GAP = 4;
/** Lean of a label across its dot. */
const LEAN = 4;

const boxAt = (text: string, left: number, top: number, m: Metrics): Placed => {
  const w = m.width(text);
  const box = { left, right: left + w, top, bottom: top + m.ascent + m.descent };
  return { text, x: left, y: top + m.ascent, box };
};

const grow = (box: Box, by: number): Box => ({
  left: box.left - by,
  right: box.right + by,
  top: box.top - by,
  bottom: box.bottom + by,
});

const meet = (a: Box, b: Box): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const inside = (box: Box, g: Geometry): boolean =>
  box.left >= EDGE && box.right <= g.width - EDGE && box.top >= EDGE && box.bottom <= g.height - EDGE;

/** Distance from a point to a box (zero inside it). */
const distance = (box: Box, p: Point): number =>
  Math.hypot(
    Math.max(box.left - p.x, 0, p.x - box.right),
    Math.max(box.top - p.y, 0, p.y - box.bottom),
  );

/** Whether a segment runs through a box (Liang-Barsky clipping, edges included). */
function crosses(box: Box, a: Point, b: Point): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const edges: [number, number][] = [
    [-dx, a.x - box.left],
    [dx, box.right - a.x],
    [-dy, a.y - box.top],
    [dy, box.bottom - a.y],
  ];
  let enter = 0;
  let leave = 1;
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    if (p < 0) enter = Math.max(enter, q / p);
    else leave = Math.min(leave, q / p);
    if (enter > leave) return false;
  }
  return true;
}

/** The '0' right-aligned left of the plot, its box centred on the zero line. */
function zeroLabelOf(input: TrendLayoutInput): Placed {
  const m = input.metrics;
  const right = input.geometry.plot.left - ZERO_GAP;
  return boxAt("0", right - m.width("0"), input.geometry.zero - (m.ascent + m.descent) / 2, m);
}

/** A tick label centred on its tick, shifted inside the panel; none if it cannot keep its tick under it. */
function tickAt(tick: Tick, top: number, input: TrendLayoutInput): Placed | null {
  const { geometry: g, metrics: m } = input;
  const w = m.width(tick.text);
  const left = Math.min(Math.max(tick.x - w / 2, EDGE), g.width - EDGE - w);
  const placed = boxAt(tick.text, left, top, m);
  const { box } = placed;
  return inside(box, g) && box.left <= tick.x && tick.x <= box.right ? placed : null;
}

/** First and last when they fit together (else the first alone), then each between that clears both. */
function ticksOf(input: TrendLayoutInput, zero: Placed): (Placed & { index: number })[] {
  const m = input.metrics;
  // Below the axis and below a '0' centred on a zero line lying on it.
  const top = input.geometry.axis + (m.ascent + m.descent) / 2 + PAD;
  const all = input.ticks.map((tick, index) => {
    const placed = tickAt(tick, top, input);
    return placed && !meet(placed.box, zero.box) ? { ...placed, index } : null;
  });
  const shown: (Placed & { index: number })[] = [];
  const clearOf = (item: Placed) => shown.every((other) => !meet(grow(item.box, TICK_GAP), other.box));
  const last = all.length - 1;
  const order = [0, last, ...all.keys()].filter((i, k, list) => list.indexOf(i) === k);
  for (const i of order) {
    const item = all[i];
    if (item && clearOf(item)) shown.push(item);
  }
  return shown.sort((a, b) => a.index - b.index);
}

type Obstacles = { dots: Point[]; segments: (readonly [Point, Point])[]; boxes: Box[] };

function obstaclesOf(input: TrendLayoutInput, zero: Placed, ticks: readonly Placed[]): Obstacles {
  const { plot, zero: zy, axis } = input.geometry;
  const line = (y: number): [Point, Point] => [
    { x: plot.left, y },
    { x: plot.right, y },
  ];
  const gaps = input.gaps.map((gap) => ({
    left: gap.x - 1,
    right: gap.x + 1,
    top: gap.top,
    bottom: gap.bottom,
  }));
  return {
    dots: [...input.points],
    segments: [...input.segments, line(zy), line(axis)],
    boxes: [zero.box, ...ticks.map((tick) => tick.box), ...gaps],
  };
}

function clear(box: Box, input: TrendLayoutInput, obstacles: Obstacles, others: readonly Box[]): boolean {
  if (!inside(box, input.geometry)) return false;
  const margin = grow(box, 1);
  if (obstacles.dots.some((dot) => distance(box, dot) < input.dotRadius + 1)) return false;
  if (obstacles.segments.some(([a, b]) => crosses(margin, a, b))) return false;
  return [...obstacles.boxes, ...others].every((other) => !meet(margin, other));
}

type End = { index: number; at: ValuePoint; toward: Point | undefined; text: string; withPeriod: boolean };

/** Every spot tried for a label, best first: nearest side of the dot, then the other, then a line further, then beside it. */
function candidates(end: End, role: "single" | "first" | "last", input: TrendLayoutInput): ValueLabel[] {
  const { metrics: m, geometry: g, dotRadius: r } = input;
  const w = m.width(end.text);
  const h = m.ascent + m.descent;
  const { x, y } = end.at;
  const out = x + LEAN - w;
  const centred = x - w / 2;
  const lean = x - LEAN;
  const clamped = Math.min(Math.max(centred, EDGE), g.width - EDGE - w);
  const across = {
    first: [out, centred, lean, clamped],
    last: [lean, centred, out, clamped],
    single: [centred, out, lean, clamped],
  }[role];
  const rises = end.toward !== undefined && end.toward.y < y;
  const above = (k: number) => y - r - PAD - h - k * (h + PAD);
  const below = (k: number) => y + r + PAD + k * (h + PAD);
  const tops = rises
    ? [below(0), above(0), below(1), above(1)]
    : [above(0), below(0), above(1), below(1)];
  const beside = [x + r + PAD, x - r - PAD - w];
  const spots = [
    ...tops.flatMap((top) => across.map((left): [number, number] => [left, top])),
    ...beside.map((left): [number, number] => [left, y - h / 2]),
  ];
  return spots.map(([left, top]) => ({
    ...boxAt(end.text, left, top, m),
    index: end.index,
    withPeriod: end.withPeriod,
  }));
}

/**
 * Lays out a panel's text. Period ticks thin to what fits; a labelled value whose tick is thinned
 * out carries its period in the label; a value with no clear spot is listed in `fallback`.
 */
export function layoutTrend(input: TrendLayoutInput): TrendLayout {
  const zeroLabel = zeroLabelOf(input);
  const ticks = ticksOf(input, zeroLabel);
  const obstacles = obstaclesOf(input, zeroLabel, ticks);
  const shownAt = new Set(ticks.map((tick) => input.ticks[tick.index]?.x));
  const ends = [...new Set(input.labelled)].flatMap((index, k): End[] => {
    const at = input.points[index];
    if (!at) return [];
    const toward = input.points[k === 0 ? index + 1 : index - 1];
    const withPeriod = !shownAt.has(at.x);
    const text = withPeriod ? `${at.text} · ${at.period}` : at.text;
    return [{ index, at, toward, text, withPeriod }];
  });
  const roles = ends.length === 1 ? (["single"] as const) : (["first", "last"] as const);
  const options = ends.map((end, k) =>
    candidates(end, roles[k] ?? "single", input).filter((label) =>
      clear(label.box, input, obstacles, []),
    ),
  );
  const labels = pair(options, input, obstacles);
  const fallback = ends
    .map((end) => end.index)
    .filter((index) => !labels.some((label) => label.index === index));
  return { zeroLabel, ticks, labels, fallback };
}

/** Both labels on the first clear pair of spots; failing that, the first that can stand alone, then the other. */
function pair(options: ValueLabel[][], input: TrendLayoutInput, obstacles: Obstacles): ValueLabel[] {
  const [forA = [], forB] = options;
  if (!forB) return forA.slice(0, 1);
  for (const a of forA) {
    const b = forB.find((label) => clear(label.box, input, obstacles, [a.box]));
    if (b) return [a, b];
  }
  return [...forA.slice(0, 1), ...forB.slice(0, forA.length > 0 ? 0 : 1)];
}
