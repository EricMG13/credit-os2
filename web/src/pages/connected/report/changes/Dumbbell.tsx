import { cx } from "@/utils/cx";
import type { MeasureTone } from "./model";

const FILL = {
  better: "bg-success-mark",
  worse: "bg-warning-mark",
  flat: "bg-chart-1",
} as const;

const EDGE = 8;

/**
 * Earlier → current on one axis that starts at zero (or at the lowest figure when one is negative),
 * so the length between the dots is the size of the move. The figures are written beside it; the
 * mark adds none.
 */
export function Dumbbell({
  before,
  after,
  tone,
}: {
  before: number;
  after: number;
  tone: MeasureTone | null;
}) {
  const low = Math.min(0, before, after);
  const high = Math.max(0, before, after);
  const at = (value: number) =>
    high === low ? 50 : EDGE + ((value - low) / (high - low)) * (100 - 2 * EDGE);
  const [from, to] = [at(before), at(after)];
  return (
    <span aria-hidden="true" className="relative block h-5 min-w-0 flex-1" data-mark="dumbbell">
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border-hairline" />
      {low < 0 && (
        <span
          className="absolute top-1 bottom-1 w-px bg-border-container"
          style={{ left: `${String(at(0))}%` }}
        />
      )}
      <span
        className={cx(
          "absolute top-1/2 h-0.5 -translate-y-1/2 rounded-ds-full",
          FILL[tone ?? "flat"],
        )}
        style={{ left: `${String(Math.min(from, to))}%`, width: `${String(Math.abs(to - from))}%` }}
      />
      <span
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-ds-full border-2 border-chart-3 bg-surface-card"
        style={{ left: `${String(from)}%` }}
      />
      <span
        className={cx(
          "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-ds-full",
          FILL[tone ?? "flat"],
        )}
        style={{ left: `${String(to)}%` }}
      />
    </span>
  );
}
