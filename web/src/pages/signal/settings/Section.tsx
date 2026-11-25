// A settings section: its h2 and hint line (a section with nothing to add has none), an optional
// action at the right of the head, then the section's content, all on one tile. A table section
// (`wide`) is drawn straight on the page at its full width and its table is the tile, so the
// table keeps the width the channel-list breakpoint leaves the page (parts/useWide.ts).
import { useId, type ReactNode } from "react";

/** The redesign's tile: 20px radius, a hairline edge, no shadow. */
const TILE = "min-w-0 rounded-ds-lg border border-border-subtle bg-surface-card p-5 sm:p-6";

export function Section({
  title,
  hint,
  action,
  wide = false,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  /** A table section: the full width, and no tile round it. */
  wide?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={wide ? "min-w-0" : `${TILE} max-w-[860px]`}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div>
          <h2 id={id} className="font-display text-h3 text-text-primary">
            {title}
          </h2>
          {hint === undefined ? null : (
            <p className="mt-1 max-w-[72ch] text-small text-text-secondary">{hint}</p>
          )}
        </div>
        {action === undefined ? null : <div className="ml-auto">{action}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
