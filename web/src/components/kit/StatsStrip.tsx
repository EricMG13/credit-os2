import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

export interface Stat {
  label: string;
  /** The current value as the module wrote it, unit included. Null draws the gap state. */
  value: string | null;
  /** Why the value is absent; shown in place of it. */
  gap?: string;
  /** The prior value with its period, as written: "3.75x in FY2023". */
  prior?: string;
  /** The change as written or as an exact difference of the two figures: "-0.95x". */
  delta?: string;
  /** Set only where the owner's table gives the measure a direction. */
  tone?: "better" | "worse";
  /** A small mark drawn under the figures. */
  mark?: ReactNode;
  /** The stat's single source control. */
  trace?: ReactNode;
}

const TONE = { better: "text-success-text", worse: "text-warning-text" } as const;

/** Figures side by side in one tile, divided by hairlines: one strip, not a row of cards. */
export function StatsStrip({ label, stats }: { label: string; stats: readonly Stat[] }) {
  return (
    <dl
      aria-label={label}
      className="grid min-w-0 grid-cols-2 overflow-hidden rounded-ds-lg border border-border-subtle bg-surface-card md:grid-cols-3 xl:grid-flow-col xl:auto-cols-fr xl:grid-cols-none"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="-mt-px -ml-px flex min-w-0 flex-col gap-1.5 border-t border-l border-border-hairline p-4 sm:p-5"
        >
          <dt className="flex items-start justify-between gap-2 text-caption text-text-tertiary">
            {stat.label}
            {stat.trace}
          </dt>
          <dd className="flex min-w-0 flex-col gap-1">
            {stat.value === null ? (
              <span className="text-small text-gap-text">{stat.gap ?? "Not supplied"}</span>
            ) : (
              <span className="font-mono text-h3 font-medium wrap-anywhere text-text-primary tabular-nums">
                {stat.value}
              </span>
            )}
            {(stat.delta ?? stat.prior) !== undefined && (
              <span className="text-caption text-text-secondary">
                {stat.delta !== undefined && (
                  <span className={cx("font-mono tabular-nums", stat.tone && TONE[stat.tone])}>
                    {stat.delta}
                    {stat.tone ? ` ${stat.tone}` : ""}
                  </span>
                )}
                {stat.delta !== undefined && stat.prior !== undefined ? " · " : ""}
                {stat.prior !== undefined && `from ${stat.prior}`}
              </span>
            )}
            {stat.mark}
          </dd>
        </div>
      ))}
    </dl>
  );
}
