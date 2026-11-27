const DECIMAL = /^-?\d+(?:\.\d+)?$/;
const INSET = 2;

type Slot = { index: number; text: string; x: number; y: number };

const px = (value: number) => String(Math.round(value * 100) / 100);

/**
 * A carried series as a small line: exact decimal strings (`Reading.text`), `null` for a period the
 * source does not state. The line never joins across a null (a dashed tick marks the slot); a
 * figure with no neighbour is a dot; the last figure is the end dot. `Number()` places pixels and
 * nothing is printed. Fewer than two figures draw nothing.
 */
export function Sparkline({
  values,
  width = 60,
  height = 16,
  end,
  label,
}: {
  values: readonly (string | null)[];
  width?: number;
  height?: number;
  end?: string;
  label: string;
}) {
  if (width <= 2 * INSET || height <= 2 * INSET)
    throw new RangeError(
      `Sparkline: ${String(width)} x ${String(height)} leaves no room inside the ${String(INSET)} px inset`,
    );
  for (const value of values)
    if (value !== null && !DECIMAL.test(value))
      throw new RangeError(`Sparkline: "${value}" is not a plain decimal figure`);
  const numbers = values.map((value) => {
    if (value === null) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) throw new RangeError(`Sparkline: "${value}" is not a finite number`);
    return n;
  });
  const stated = numbers.flatMap((n) => (n === null ? [] : [n]));
  if (stated.length < 2) return null;

  let low = Infinity;
  let high = -Infinity;
  for (const n of stated) {
    if (n < low) low = n;
    if (n > high) high = n;
  }
  const span = Math.max(values.length - 1, 1);
  const x = (index: number) => INSET + ((width - 2 * INSET) * index) / span;
  const y = (n: number) =>
    high === low ? height / 2 : height - INSET - ((height - 2 * INSET) * (n - low)) / (high - low);

  const slots: (Slot | null)[] = values.map((text, index) => {
    const n = numbers[index];
    return text === null || n === null || n === undefined
      ? null
      : { index, text, x: x(index), y: y(n) };
  });
  const first = slots.findIndex((slot) => slot !== null);
  const last = slots.map((slot) => slot !== null).lastIndexOf(true);

  // A run is consecutive figures; a null ends it.
  const runs: Slot[][] = [];
  let open: Slot[] | null = null;
  for (const slot of slots) {
    if (slot === null) open = null;
    else if (open) open.push(slot);
    else {
      open = [slot];
      runs.push(open);
    }
  }
  const lastSlot = slots[last];
  const inLine = new Set(runs.filter((run) => run.length >= 2).flat());

  return (
    <svg
      role="img"
      aria-label={label}
      width={width}
      height={height}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
    >
      {slots.map((slot, index) =>
        slot === null && index > first && index < last ? (
          <line
            key={`gap-${String(index)}`}
            data-gap
            x1={x(index)}
            x2={x(index)}
            y1={INSET}
            y2={height - INSET}
            strokeWidth="1"
            strokeDasharray="2 2"
            className="stroke-text-tertiary"
          />
        ) : null,
      )}
      {runs.map((run) =>
        run.length >= 2 ? (
          <path
            key={`run-${String(run[0]?.index)}`}
            data-values={run.map((slot) => slot.text).join(" ")}
            d={run
              .map((slot, at) => `${at === 0 ? "M" : "L"}${px(slot.x)} ${px(slot.y)}`)
              .join(" ")}
            fill="none"
            strokeWidth="1.25"
            className="stroke-text-secondary"
          />
        ) : null,
      )}
      {slots.map((slot) =>
        slot !== null && slot.index !== last && !inLine.has(slot) ? (
          <circle
            key={`dot-${String(slot.index)}`}
            data-value={slot.text}
            cx={px(slot.x)}
            cy={px(slot.y)}
            r="1.5"
            className="fill-text-secondary"
          />
        ) : null,
      )}
      {lastSlot && (
        <circle
          data-end
          data-value={lastSlot.text}
          cx={px(lastSlot.x)}
          cy={px(lastSlot.y)}
          r="2"
          style={end ? { fill: end } : undefined}
          className={end ? undefined : "fill-text-secondary"}
        />
      )}
    </svg>
  );
}
