import { cx } from "@/utils/cx";

const FILL = {
  primary: "bg-chart-1",
  secondary: "bg-chart-2",
  prior: "bg-chart-3",
  signal: "bg-chart-4",
} as const;

/**
 * A table cell's figure with a proportional bar behind the text: `share` is the value over the
 * column's largest value, 0 to 1. The text is the figure exactly as written; the bar adds no number.
 * A share above zero draws at least `minimum` px, so a small figure is never mistaken for zero;
 * zero draws no fill but a 1 px tick at the track's start; a missing share draws neither.
 */
export function BarCell({
  text,
  share,
  tone = "primary",
  minimum = 2,
  valueWidth = "w-20",
}: {
  text: string;
  share: number | null;
  tone?: keyof typeof FILL;
  minimum?: number;
  /** The figure column's width class. Rows of one list pass the same class so their bars share a left edge. */
  valueWidth?: string;
}) {
  const width = share === null ? 0 : Math.max(0, Math.min(1, share)) * 100;
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
      <span aria-hidden="true" className="h-2 min-w-0 flex-1 rounded-ds-full bg-surface-subtle">
        {share !== null &&
          (width > 0 ? (
            <span
              key="fill"
              className={cx("block h-full rounded-ds-full", FILL[tone])}
              // The larger of the share and the floor: `max(<minimum>px, <share>%)`.
              style={{ width: `${String(width)}%`, minWidth: `${String(minimum)}px` }}
            />
          ) : (
            <span key="zero" className="block h-full w-px bg-border-control" />
          ))}
      </span>
    </span>
  );
}
