import type { ReactNode } from "react";

/**
 * Table parts that stack into labelled blocks on a phone. Explicit roles keep the table's
 * semantics when the parts are drawn as blocks; each cell carries `data-label` for its caption.
 */
export const STACK = {
  table: "w-full border-collapse text-left text-small max-md:block",
  head: "bg-surface-subtle text-text-secondary max-md:sr-only",
  body: "max-md:block",
  row: "border-t border-border-hairline align-top max-md:grid max-md:gap-1.5 max-md:p-4",
  cell: "px-4 py-3 wrap-anywhere max-md:p-0 max-md:before:mb-0.5 max-md:before:block max-md:before:text-caption max-md:before:text-text-tertiary max-md:before:content-[attr(data-label)]",
} as const;

/**
 * A block a reviewer opens on purpose: a boxed summary row, and the records beneath it as the
 * cards they are, not nested in a second card. It takes an address (`id`) so a link can land on it,
 * and `open` to start open.
 */
export function Disclosure({
  id,
  title,
  hint,
  open = false,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} tabIndex={-1} open={open} className="min-w-0 outline-none lg:col-span-12">
      <summary className="flex min-h-8 cursor-pointer flex-wrap items-baseline gap-x-3 rounded-ds-lg border border-border-subtle bg-surface-card px-5 py-3 text-h4 font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus max-[480px]:min-h-11">
        {title}
        <span className="text-small font-normal text-text-secondary">{hint}</span>
      </summary>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4">{children}</div>
    </details>
  );
}
