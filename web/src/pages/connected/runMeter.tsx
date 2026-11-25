import { cx } from "@/utils/cx";

/**
 * The one meter of the run screens: a value against a total, on a track you can see. `name` is
 * its accessible name; `valueText` says the reading in words; `limit` marks the total as a cap.
 */
export function Meter({
  value,
  max,
  name,
  valueText,
  limit = false,
  className,
}: {
  value: number;
  max: number;
  name: string;
  valueText?: string;
  limit?: boolean;
  className?: string;
}) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label={name}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={valueText}
      className={cx(
        "relative h-2.5 w-full min-w-0 overflow-hidden rounded-ds-full border border-border-container bg-surface-subtle",
        className,
      )}
    >
      <div className="h-full rounded-ds-full bg-chart-1" style={{ width: `${String(share)}%` }} />
      {limit && (
        <span aria-hidden="true" className="absolute inset-y-0 right-0 w-0.5 bg-text-primary" />
      )}
    </div>
  );
}
