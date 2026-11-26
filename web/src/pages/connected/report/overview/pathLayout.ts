import { thinTicks, inside, textWidth } from "./chartText";
import { PATH, type pathGeometry } from "./stressData";

type Geometry = ReturnType<typeof pathGeometry>;

/**
 * The forward path drawn at its frame's own `width` (one user unit a pixel, so 12 px text stays
 * 12 px): the model's geometry stretched across the room the tick labels leave, each label moved
 * in from the edges so it stays inside the figure.
 */
export function pathLayout(geometry: Geometry, width: number) {
  const left =
    Math.max(...geometry.ticks.map((tick) => textWidth(`${tick.label}x`, "mono")), 0) + 8;
  const x = (value: number) =>
    left + ((value - PATH.left) / (PATH.width - PATH.left)) * (width - left - 4);
  return {
    left,
    ticks: geometry.ticks,
    periods: periodLabels(
      geometry.periods.map((period) => ({ ...period, x: x(period.x) })),
      width,
    ),
    lines: geometry.lines.map((line) =>
      valueLabels(
        line.map((point) => ({ ...point, x: x(point.x) })),
        width,
      ),
    ),
  };
}

/**
 * The value written under each point: centred on its point and moved in from the edges; a value
 * that would print over a neighbour's is left out (the first and the latest are kept first), as
 * period labels are. Its point stays; the figure's reading and the table keep every value.
 */
function valueLabels<P extends { display: string; x: number }>(points: P[], width: number) {
  // Each label is centred first (as `inside` does), so a kept label's place identifies its point.
  const centred = points.map((point) => ({ point, at: inside(point.x, point.display, width) }));
  const kept = new Set(
    thinTicks(
      centred.map(({ point, at }) => ({ label: point.display, x: at })),
      width,
    ).map(({ x }) => x),
  );
  const used = new Set<number>();
  return centred.map(({ point, at }) => {
    const show = kept.has(at) && !used.has(at);
    if (show) used.add(at);
    return { ...point, label: show ? at : null };
  });
}

/**
 * The period labels under the path: each centred on its period and moved in from the edges; a
 * label that would print over a neighbour is left out (the latest and the first are kept first),
 * as axis ticks are. Its point keeps its place; the figure's reading names every period.
 */
function periodLabels<P extends { period: string; x: number }>(periods: P[], width: number) {
  const kept = new Set(
    thinTicks(
      periods.map(({ period, x }) => ({ label: period, x })),
      width,
    ).map(({ label }) => label),
  );
  return periods.map((period) => ({
    ...period,
    label: kept.has(period.period) ? inside(period.x, period.period, width, "body") : null,
  }));
}
