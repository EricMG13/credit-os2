import type { ReactNode } from "react";

/**
 * A stated gap inside a line or a table cell: the hatch as the frame, the reason in words on a
 * plain chip so the text keeps its contrast. Never blank, never zero.
 */
export function GapText({ children }: { children: ReactNode }) {
  return (
    <span className="gap-hatch inline-flex max-w-full rounded-ds-xs border border-dashed border-border-gap p-0.5 align-middle">
      <span className="rounded-ds-xs bg-surface-card px-1.5 text-small wrap-anywhere text-gap-text">
        {children}
      </span>
    </span>
  );
}
