import { cx } from "@/utils/cx";

/**
 * A bar from a zero axis: figures above zero to the right of the line, figures below it to the
 * left, all to the one scale of the list (`low` and `high` are the list's own lowest and highest
 * figures; zero is always inside the scale). A stated figure that is not zero always draws, at
 * least three pixels wide on its side of the line, so a small figure is never mistaken for zero; a
 * zero figure draws the line alone. `text` is the figure as written; the bar adds no number, and
 * the sign is in the text, not only in the fill.
 */
export function ZeroAxisBar({
  text,
  value,
  low,
  high,
  valueWidth,
}: {
  text: string;
  value: number;
  low: number;
  high: number;
  valueWidth: string;
}) {
  const from = Math.min(0, low);
  const to = Math.max(0, high);
  const span = to - from || 1;
  const zero = ((0 - from) / span) * 100;
  const width = (Math.abs(value) / span) * 100;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cx(
          valueWidth,
          "flex-none text-right font-mono text-small text-text-primary tabular-nums",
        )}
      >
        {text}
      </span>
      <span
        aria-hidden="true"
        className="relative mb-3 h-2 min-w-0 flex-1 rounded-ds-full bg-surface-subtle"
      >
        {value !== 0 && (
          <span
            data-bar={value < 0 ? "below" : "above"}
            className={cx("absolute h-full", value < 0 ? "bg-chart-2" : "bg-chart-1")}
            style={
              value < 0
                ? { right: `${String(100 - zero)}%`, width: `${String(width)}%`, minWidth: "3px" }
                : { left: `${String(zero)}%`, width: `${String(width)}%`, minWidth: "3px" }
            }
          />
        )}
        <span
          className="absolute -top-1 h-4 w-px bg-text-tertiary"
          style={{ left: `${String(zero)}%` }}
        />
        <span
          className="absolute top-full -translate-x-1/2 font-mono text-caption text-text-tertiary"
          style={{ left: `${String(zero)}%` }}
        >
          0
        </span>
      </span>
    </span>
  );
}
