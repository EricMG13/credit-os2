import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

const SPANS = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  12: "lg:col-span-12",
} as const;

const TONES = {
  plain: "border-border-subtle bg-surface-card",
  counter: "border-info-edge bg-info-fill",
  gap: "gap-hatch border-dashed border-border-gap",
} as const;

/** The 12-column bento the Overview is laid on; a tile's span is its rank. */
export function Bento({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12">{children}</div>;
}

/** The small tile head: the 14 px (ramp `small`) heading and, at its right, a quiet caption and the trace. */
function SmallHead({
  as: Heading,
  title,
  kicker,
  trace,
}: {
  as: "h2" | "h3";
  title?: ReactNode;
  kicker?: ReactNode;
  trace?: ReactNode;
}) {
  return (
    // The head never wraps: a long title wraps inside itself and the trace keeps its place.
    <div className="flex items-start justify-between gap-3">
      {title != null && (
        <Heading className="flex min-w-0 items-center gap-2 text-small font-medium text-pretty text-text-primary">
          {title}
        </Heading>
      )}
      <div className="ml-auto flex flex-none items-center gap-3">
        {kicker != null && <p className="text-caption text-text-tertiary">{kicker}</p>}
        {trace}
      </div>
    </div>
  );
}

/**
 * One bento tile: one fact with one visual. `title` states the reading; `kicker` is the small
 * label above it; `trace` is the tile's single source control. `head="small"` draws the
 * Overview's 14 px (`small`) head with the kicker as a quiet caption at its right; `as` sets its level.
 */
export function Tile({
  span,
  label,
  kicker,
  title,
  trace,
  tone = "plain",
  head = "default",
  as = "h3",
  className,
  children,
}: {
  span: keyof typeof SPANS;
  /** The region's accessible name. */
  label: string;
  kicker?: ReactNode;
  title?: ReactNode;
  trace?: ReactNode;
  tone?: keyof typeof TONES;
  head?: "default" | "small";
  as?: "h2" | "h3";
  className?: string;
  children: ReactNode;
}) {
  const Heading = as;
  return (
    <section
      aria-label={label}
      className={cx(
        "flex min-w-0 flex-col gap-4 rounded-ds-lg border p-5 sm:p-6",
        SPANS[span],
        TONES[tone],
        className,
      )}
    >
      {head === "small" && (kicker ?? title ?? trace) != null && (
        <SmallHead as={as} title={title} kicker={kicker} trace={trace} />
      )}
      {head === "default" && (kicker ?? title ?? trace) != null && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {kicker != null && <p className="text-caption text-text-tertiary">{kicker}</p>}
            {title != null && (
              <Heading className="text-h4 font-medium text-balance text-text-primary">
                {title}
              </Heading>
            )}
          </div>
          {trace}
        </div>
      )}
      {children}
    </section>
  );
}

/** An inset well inside a tile: radius concentric with the tile's. */
export function Well({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("min-w-0 rounded-ds-sm bg-surface-subtle p-3", className)}>{children}</div>
  );
}

/** What is not known, drawn in place: never zero, never blank. */
export function GapNote({ children }: { children: ReactNode }) {
  return (
    <div className="gap-hatch flex min-h-24 items-center justify-center rounded-ds-sm border border-dashed border-border-gap p-4 text-center text-small text-gap-text">
      <span className="rounded-ds-xs bg-surface-card px-2 py-1">{children}</span>
    </div>
  );
}

/** A figure in mono, tabular numerals. */
export function Figure({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cx("font-mono text-text-primary tabular-nums", className)}>{children}</span>
  );
}
