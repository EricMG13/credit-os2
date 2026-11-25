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
      line.map((point) => ({
        ...point,
        x: x(point.x),
        label: inside(x(point.x), point.display, width),
      })),
    ),
  };
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
