import { orderPeriods } from "@/utils/periodOrder";

interface SeriesValues {
  name: string;
  values: (number | null)[];
}

/** Positional keys keep issuer-provided names out of the chart data object's keys. */
export function seriesKey(index: number): string {
  return `s${String(index)}`;
}

export function checkDistinctSeries(series: { name: string }[]) {
  const repeated = series.find((s, i) => series.findIndex((other) => other.name === s.name) !== i);
  if (repeated !== undefined)
    throw new Error(`series names must be distinct: "${repeated.name}" repeats`);
}

export function checkLabeledSeriesLength(
  series: (SeriesValues & { labels: (string | null)[] })[],
  count: number,
  unit: "group" | "period",
) {
  const bad = series.find((s) => s.values.length !== count || s.labels.length !== count);
  if (bad !== undefined) {
    throw new Error(
      `series "${bad.name}" must have one value and one label per ${unit} (${String(count)} ${unit}s)`,
    );
  }
}

/**
 * Where each drawn position reads from, for periods as a caller wrote them: the one period rule
 * (oldest fiscal year to latest, then year to date, last twelve months, pro forma, forecasts), with
 * a label the rule cannot place kept last, as authored, and named in `gaps`. A period chart orders
 * itself with this once, so no caller owes it an order.
 */
export function periodPositions(periods: readonly string[]) {
  const { ordered, gaps } = orderPeriods(
    periods.map((period, at) => ({ period, at })),
    ({ period }) => period,
  );
  return { order: ordered.map(({ at }) => at), gaps: gaps.map(({ period }) => period) };
}

/** The items at `order`, each still its own: a value, label or cell moves with its period. */
export function atPositions<T>(items: readonly T[], order: readonly number[]): T[] {
  return order.flatMap((at) => (at < items.length ? [items[at] as T] : []));
}

/** What a period chart says of the labels it could not place, after its own note; the note alone
 * when it placed them all. `every` is for a chart none of whose labels could be placed. */
export function periodGapNote(gaps: readonly string[], note?: string, every = false) {
  if (!gaps.length) return note;
  const stated = every
    ? "Shown in the order written: the periods could not be placed in time order."
    : `Not placed in time order, shown last: ${gaps.join(", ")}.`;
  return note ? `${note} · ${stated}` : stated;
}

/** Exact values in the order given (a period chart gives rule order: `periodPositions`); absent
 * observations stay null, including sparse cells. */
export function periodSeriesData(periods: string[], series: SeriesValues[]) {
  return periods.map((period, index) => ({
    period,
    index,
    ...Object.fromEntries(series.map((s, i) => [seriesKey(i), s.values[index] ?? null])),
  }));
}
