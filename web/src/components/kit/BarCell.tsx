import { cx } from "@/utils/cx";

const FILL = {
  primary: "bg-chart-1",
  secondary: "bg-chart-2",
  prior: "bg-chart-3",
  signal: "bg-chart-4",
} as const;

/** The five amount steps, smallest to largest, as literals so Tailwind generates each utility. */
const AMOUNT = [
  "bg-scale-amount-1",
  "bg-scale-amount-2",
  "bg-scale-amount-3",
  "bg-scale-amount-4",
  "bg-scale-amount-5",
] as const;

/**
 * A 1 px edge on the bar's top and bottom only, never its sides: a floor-width bar then keeps its
 * own step colour in 6 of its 8 px rows, while the pale steps still read on the track.
 */
const EDGE =
  "shadow-[inset_0_1px_0_var(--color-scale-amount-edge),inset_0_-1px_0_var(--color-scale-amount-edge)]";

/** The amount step of a share: five equal-width bins over 0 to 1, the last closed at 1. */
const stepOf = (share: number) =>
  AMOUNT[Math.min(AMOUNT.length - 1, Math.floor(Math.max(0, Math.min(1, share)) * AMOUNT.length))];

/**
 * A table cell's figure with a proportional bar behind the text: `share` is the value over the
 * column's largest value, 0 to 1. The text is the figure exactly as written; the bar adds no number.
 * A share above zero draws at least `minimum` px, so a small figure is never mistaken for zero;
 * zero draws no fill but a 1 px tick at the track's start; a missing share draws neither.
 * `tone="amount"` draws the fill in one of the five amount steps (`bg-scale-amount-1` to `-5`) by
 * the share's equal-width bin, with a 1 px edge on its top and bottom (not its sides) so a pale step reads on the track; the bar
 * still adds no number. The other tones are one colour each.
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
  tone?: keyof typeof FILL | "amount";
  minimum?: number;
  /** The figure column's width class. Rows of one list pass the same class so their bars share a left edge. */
  valueWidth?: string;
}) {
  const width = share === null ? 0 : Math.max(0, Math.min(1, share)) * 100;
  const fill = tone === "amount" ? cx(stepOf(share ?? 0), EDGE) : FILL[tone];
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
              className={cx("block h-full rounded-ds-full", fill)}
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
