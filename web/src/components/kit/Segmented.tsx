import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

const ITEM =
  "relative flex min-h-8 items-center gap-2 rounded-ds-sm border pr-3 pl-4 text-small font-medium whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11";
const ON = "border-action-subtle-hover bg-surface-selected text-text-link";
const OFF = "border-transparent text-text-secondary hover:bg-surface-card hover:text-text-primary";

export interface Segment {
  key: string;
  label: ReactNode;
  /** A link segment navigates; without it the segment is a button that calls `onSelect`. */
  href?: string;
  accessibleLabel?: string;
}

/**
 * One segmented control: sections of a page (links, `aria-current`) or views of a tile (buttons,
 * `aria-pressed`). The current segment carries the accent tint and a dot.
 */
export function Segmented({
  label,
  segments,
  current,
  onSelect,
  className,
}: {
  label: string;
  segments: readonly Segment[];
  current: string;
  onSelect?: (key: string) => void;
  className?: string;
}) {
  // The dot sits in the segment's own left padding (16 px: 4 clear, the 6 px dot, 6 clear), so
  // choosing a segment never changes a width.
  const dot = (
    <span
      aria-hidden="true"
      className="absolute top-1/2 left-1 size-1.5 -translate-y-1/2 rounded-ds-full bg-action"
    />
  );
  const frame = cx(
    "flex w-fit max-w-full flex-wrap gap-0.5 rounded-ds-md border border-border-hairline bg-surface-subtle p-1",
    className,
  );
  const items = segments.map((segment) => {
    const on = segment.key === current;
    const classes = cx(ITEM, on ? ON : OFF);
    return segment.href === undefined ? (
      <button
        key={segment.key}
        type="button"
        aria-label={segment.accessibleLabel}
        aria-pressed={on}
        className={cx(classes, "cursor-pointer")}
        onClick={() => onSelect?.(segment.key)}
      >
        {on && dot}
        {segment.label}
      </button>
    ) : (
      <a
        key={segment.key}
        href={segment.href}
        aria-label={segment.accessibleLabel}
        aria-current={on ? "page" : undefined}
        className={classes}
      >
        {on && dot}
        {segment.label}
      </a>
    );
  });
  return segments.some((segment) => segment.href !== undefined) ? (
    <nav aria-label={label} className={frame}>
      {items}
    </nav>
  ) : (
    <div role="group" aria-label={label} className={frame}>
      {items}
    </div>
  );
}
