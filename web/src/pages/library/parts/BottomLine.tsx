import { cx } from "@/utils/cx";
import type { ReactNode } from "react";
import type { BottomLineText } from "../slice";
import { TRACE_HOST, TraceControl } from "./TraceControl";

type Level = "h2" | "h3" | "h4";

/**
 * The bottom-line tile (P1): label, the lead as the largest text on the page, the rest and one
 * trace control. `level` is the heading level of the lead, so module pages can reuse the tile
 * under their own heading.
 */
export function BottomLine({
  text,
  level,
  lead,
  marker,
}: {
  text: BottomLineText;
  level: Level;
  lead?: ReactNode;
  /** A supplied marker replaces the decorative dot. Null leaves the space empty. */
  marker?: ReactNode;
}) {
  const Lead = level;
  return (
    <section
      aria-label={text.label}
      className={cx(
        TRACE_HOST,
        "flex h-full items-start gap-3 rounded-ds-lg border border-border-subtle bg-surface-card p-5 sm:gap-4 sm:p-8",
      )}
    >
      {marker === undefined ? (
        <span
          aria-hidden="true"
          className="mt-1 flex size-5 flex-none items-center justify-center rounded-ds-full bg-surface-selected"
        >
          <span className="size-2 rounded-ds-full bg-action" />
        </span>
      ) : (
        marker
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="text-caption text-text-tertiary">{text.label}</span>
        <Lead
          tabIndex={-1}
          className="max-w-bottom-line rounded-ds-xs font-display text-h2 font-medium text-balance wrap-anywhere text-text-primary outline-hidden focus-visible:ring-2 focus-visible:ring-focus sm:text-h1 sm:font-medium"
        >
          {lead ?? text.lead}
        </Lead>
        <p className="reading-copy text-body text-text-secondary">{text.rest}</p>
      </div>
      <TraceControl trace={text.trace} label="Show sources for the bottom line" />
    </section>
  );
}
