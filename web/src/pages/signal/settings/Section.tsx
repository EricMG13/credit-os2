// A settings section: one tile holding its h2 and hint line (a section with nothing to add has
// none), an optional action at the right of the head, then the section's content.
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
  /** The mock lets a table section use the full width (`max-width:none`). */
  wide?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={wide ? TILE : `${TILE} max-w-[860px]`}>
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
