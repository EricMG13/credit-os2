import { ticks } from "../../../../visuals/visualData";

export type AxisTick = { value: number; label: string };

export type NiceAxis = {
  /** The scale's ends: round numbers holding every value. */
  start: number;
  end: number;
  ticks: AxisTick[];
  /** True when the axis starts above zero: a bar measured from it must carry the break mark. */
  cut: boolean;
  /** The pixel position of `value` on a range from `from` (at `start`) to `to` (at `end`). */
  place: (value: number, from: number, to: number) => number;
};

const EDGE = 1e-9;

const decimalsOf = (step: number) => {
  const text = String(Number(step.toPrecision(12)));
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
};

function build(start: number, end: number, step: number, suffix: string): NiceAxis {
  const digits = decimalsOf(step);
  const round = (value: number) => Number(value.toFixed(digits)) + 0;
  const format = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const count = Math.max(1, Math.round((end - start) / step));
  const span = end - start || 1;
  return {
    start,
    end,
    ticks: Array.from({ length: count + 1 }, (_, at) => {
      const value = round(start + at * step);
      return { value, label: `${format.format(value).replace("-", "−")}${suffix}` };
    }),
    cut: start > 0,
    place: (value, from, to) => from + ((value - start) / span) * (to - from),
  };
}

/** The step `ticks` (visuals/visualData) gives for a range from zero to `span`. */
function stepFor(span: number) {
  const [first, second] = ticks([span]);
  return (second?.value ?? 1) - (first?.value ?? 0) || 1;
}

function throughZero(values: readonly number[], suffix: string) {
  const found = ticks([...values]);
  const start = found[0]?.value ?? 0;
  const end = found.at(-1)?.value ?? 1;
  const step = found.length > 1 ? (found[1]?.value ?? 1) - start : end - start || 1;
  return build(start, end, step, suffix);
}

function from(start: number, high: number, suffix: string) {
  const step = stepFor(high - start);
  const end = start + Math.max(1, Math.ceil((high - start) / step - EDGE)) * step;
  return build(start, end, step, suffix);
}

/**
 * The one round axis of the lead marks; it replaces the private `niceStep` copies.
 *
 * - `zero: true`: the axis holds zero and every value, at the round steps `ticks()` gives
 *   (at most six ticks; mixed signs bracket both sides).
 * - `zero: false`: a cut axis when every value is above zero and the values sit high: it starts at
 *   the round step at or below the lowest value less half their spread (the rule CP-1's bridge
 *   used). With `start`, the axis starts exactly there when no value lies below it. Otherwise it
 *   is the axis through zero: a value is never clipped.
 *
 * Labels are axis furniture (`−` for minus, `suffix` after); data labels keep the stated text.
 */
export function niceAxis(
  values: readonly number[],
  options: { zero: boolean; start?: number; suffix?: string },
): NiceAxis {
  const { zero, start, suffix = "" } = options;
  const present = values.filter((value) => Number.isFinite(value));
  if (zero || present.length === 0) return throughZero(present, suffix);
  const low = Math.min(...present);
  const high = Math.max(...present);
  if (start !== undefined && Number.isFinite(start) && start <= low && start < high)
    return start > 0 ? from(start, high, suffix) : throughZero(present, suffix);
  const spread = high - low || Math.abs(high) || 1;
  const edge = low - spread / 2;
  if (edge <= 0) return throughZero(present, suffix);
  const step = stepFor(high - edge);
  const cut = Math.floor(edge / step + EDGE) * step;
  return cut > 0
    ? from(Number(cut.toFixed(decimalsOf(step))), high, suffix)
    : throughZero(present, suffix);
}

/**
 * The ticks whose labels fit side by side on `width` px (every second, third … kept from the
 * first); the first and last are kept where they fit.
 */
export function fittingTicks(
  axis: NiceAxis,
  from: number,
  to: number,
  measure: (text: string) => number,
) {
  for (let every = 1; every <= axis.ticks.length; every += 1) {
    const kept = axis.ticks.filter((_, at) => at % every === 0);
    const boxes = kept.map((tick) => {
      const x = axis.place(tick.value, from, to);
      const half = measure(tick.label) / 2;
      return [x - half, x + half] as const;
    });
    if (boxes.every((box, at) => at === 0 || box[0] > (boxes[at - 1]?.[1] ?? 0) + 6)) return kept;
  }
  return axis.ticks.slice(0, 1);
}
