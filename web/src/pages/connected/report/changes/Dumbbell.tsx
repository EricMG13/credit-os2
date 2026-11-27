import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { MeasureTone } from "./model";

const FILL = {
  better: "bg-better-mark",
  worse: "bg-worse-mark",
  flat: "bg-text-secondary",
} as const;

const INK = {
  better: "text-better-mark",
  worse: "text-worse-mark",
  flat: "text-text-secondary",
} as const;

/**
 * Earlier → current on one axis that starts at zero (or at the lowest figure when one is negative),
 * so the length between the two marks is the size of the move against the level. The earlier figure
 * is a tick taller than the current figure's dot, so a small move still shows two marks, and the
 * chevron points the way the figure went. The figures are written beside it; the mark adds none,
 * and its text alternative says what the axis starts at.
 */
export function Dumbbell({
  before,
  after,
  tone,
  reading,
}: {
  before: number;
  after: number;
  tone: MeasureTone | null;
  /** The two figures as the row writes them, for the text alternative. */
  reading: string;
}) {
  const low = Math.min(0, before, after);
  const high = Math.max(0, before, after);
  const at = (value: number) => (high === low ? 50 : ((value - low) / (high - low)) * 100);
  const [from, to] = [at(before), at(after)];
  const key = tone ?? "flat";
  const rose = after > before;
  const Way = rose ? ChevronRight : ChevronLeft;
  const basis =
    low < 0 ? "the axis starts at the lowest figure and marks zero" : "the axis starts at zero";
  return (
    <span
      role="img"
      aria-label={`${reading}; ${basis}`}
      className="flex min-w-0 flex-1 items-center gap-1.5"
      data-mark="dumbbell"
      data-direction={after === before ? "none" : rose ? "up" : "down"}
    >
      {low === 0 && (
        <span aria-hidden="true" className="font-mono text-caption text-text-secondary">
          0
        </span>
      )}
      <span aria-hidden="true" className="relative mr-5 block h-5 min-w-0 flex-1">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border-container" />
        <span
          data-axis-zero=""
          className="absolute top-1 bottom-1 w-px bg-border-control"
          style={{ left: `${String(at(0))}%` }}
        />
        <span
          className={cx("absolute top-1/2 h-0.5 -translate-y-1/2", FILL[key])}
          style={{
            left: `${String(Math.min(from, to))}%`,
            width: `${String(Math.abs(to - from))}%`,
          }}
        />
        <span
          data-earlier=""
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-ds-full bg-text-secondary"
          style={{ left: `${String(from)}%` }}
        />
        <span
          data-current=""
          className={cx(
            "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-ds-full",
            FILL[key],
          )}
          style={{ left: `${String(to)}%` }}
        />
        {after !== before && (
          <Way
            className={cx(
              "absolute top-1/2 size-3.5 -translate-y-1/2",
              rose ? "ml-1.5" : "-ml-1.5 -translate-x-full",
              INK[key],
            )}
            style={{ left: `${String(to)}%` }}
          />
        )}
      </span>
    </span>
  );
}
