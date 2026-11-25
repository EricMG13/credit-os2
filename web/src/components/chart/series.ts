export type Marker = "circle" | "square" | "triangle" | "diamond" | "ring" | "cross" | "none";

export interface SeriesStyle {
  /** A colour token, never a literal colour. */
  color: string;
  /** The SVG stroke-dasharray of the line; "none" is solid. */
  dash: string;
  marker: Marker;
}

const SOLID = "none";
const DASHED = "6 4";
const DOTTED = "1.5 4";
const DASH_DOT = "8 4 1.5 4";
// Slot 5 is close to slot 1 in lightness, so its line is never solid.
const LONG_DASHED = "12 4";

/** The design system's Chart palette: six slots in order, then Other. */
export const SERIES: readonly SeriesStyle[] = [
  { color: "var(--color-chart-1)", dash: SOLID, marker: "circle" },
  { color: "var(--color-chart-2)", dash: DASHED, marker: "square" },
  { color: "var(--color-chart-3)", dash: SOLID, marker: "triangle" },
  { color: "var(--color-chart-4)", dash: DOTTED, marker: "diamond" },
  { color: "var(--color-chart-5)", dash: LONG_DASHED, marker: "ring" },
  { color: "var(--color-chart-6)", dash: DASH_DOT, marker: "cross" },
  { color: "var(--color-chart-other)", dash: SOLID, marker: "none" },
];

const OTHER_SLOT = SERIES.length - 1;

/**
 * The first six names take slots 1 to 6 by position; every later name takes the Other style.
 * It assigns styles only; it never adds series together.
 */
export function assignSeries(names: string[]): Map<string, SeriesStyle> {
  const styles = new Map<string, SeriesStyle>();
  names.forEach((name, i) => {
    const style = SERIES[Math.min(i, OTHER_SLOT)];
    if (style === undefined) throw new Error("the series table is empty");
    styles.set(name, style);
  });
  return styles;
}

/**
 * Label y positions spread to at least `gap` apart: a greedy push-down in ascending order, results
 * in input order. ponytail: a label near the bottom of the plot can be pushed below the axis; the
 * upgrade path is a two-sided relaxation that also moves the labels above it up.
 */
export function spread(ys: number[], gap: number): number[] {
  const out = [...ys];
  let previous = -Infinity;
  // Array.prototype.sort is stable, so equal ys keep their input order.
  for (const { y, i } of ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)) {
    previous = Math.max(y, previous + gap);
    out[i] = previous;
  }
  return out;
}
