// After the shadcnblocks announcement pill (sources/live-pages.md): the "AI" label badge and one
// line of AI text. AI text is never drawn as a message bubble.
import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

/** The "AI" label itself: what marks text a model wrote, alone or in front of a line. */
export function AiMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "shrink-0 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary",
        className,
      )}
    >
      AI
    </span>
  );
}

/** `marked` false leaves the label off the pill, where a group's own label already covers the line. */
export function Announcement({
  children,
  marked = true,
}: {
  children: ReactNode;
  marked?: boolean;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-hairline bg-surface-card py-0.5 pr-3 pl-3 text-xs font-medium text-text-primary shadow-1">
      {marked ? <AiMark className="-ml-2.5" /> : null}
      <span className="py-1">{children}</span>
    </span>
  );
}
