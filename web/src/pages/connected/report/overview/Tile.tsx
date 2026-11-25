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
    // 32 px, the trace control's height, with or without one: tiles in a row start level.
    <div className="flex min-h-8 items-start justify-between gap-3">
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
 * One bento tile: one fact with one visual. `title` states the reading; `kicker` is the quiet
 * caption under it (never a label above it); `trace` is the tile's single source control.
 * `head="small"` draws the Overview's 14 px (`small`) head with the kicker as a quiet caption at
 * its right; `as` sets its level.
 */
export function Tile({
  id,
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
  /** An address a link lands on: the tile then takes focus from script, with the token ring. */
  id?: string;
  span: keyof typeof SPANS;
  /** The region's accessible name. */
  label: string;
  /** A quiet caption under the title. */
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
      id={id}
      tabIndex={id === undefined ? undefined : -1}
      aria-label={label}
      className={cx(
        "flex min-w-0 flex-col gap-4 rounded-ds-lg border p-5 sm:p-6",
        id !== undefined &&
          "outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
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
            {title != null && (
              <Heading className="text-h4 font-medium text-balance text-text-primary">
                {title}
              </Heading>
            )}
            {kicker != null && (
              <p
                data-part="kicker"
                className="max-w-prose text-caption text-pretty text-text-tertiary"
              >
                {kicker}
              </p>
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
export function GapNote({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        "gap-hatch flex min-h-24 items-center justify-center rounded-ds-sm border border-dashed border-border-gap p-4 text-center text-small text-gap-text",
        className,
      )}
    >
      <span className="rounded-ds-xs bg-surface-card px-2 py-1">{children}</span>
    </div>
  );
}

/**
 * The same gap where a sentence stands in for a passage, not a figure: the hatched mark, then the
 * words. One line-sized member of the gap pattern, so a sentence that says what the page does not
 * show reads as a gap and not as a finding.
 */
export function GapSentence({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cx("flex min-w-0 items-start gap-2 text-small text-gap-text", className)}>
      <span
        aria-hidden="true"
        className="gap-hatch mt-0.5 size-4 flex-none rounded-ds-xs border border-dashed border-border-gap"
      />
      <span className="min-w-0 text-pretty">{children}</span>
    </p>
  );
}

/** A figure in mono, tabular numerals. */
export function Figure({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cx("font-mono text-text-primary tabular-nums", className)}>{children}</span>
  );
}
