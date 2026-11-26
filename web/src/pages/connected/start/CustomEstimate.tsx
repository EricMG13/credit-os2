import type { ReactNode } from "react";
import { Figure, Well } from "../report/overview/Tile";
import { serviceText, type CustomEstimate } from "../api";
import { shownCapText } from "./intake";
import { ESTIMATE_LABEL } from "./customSelection";

/** "A, B and C": module names run together as a sentence. */
export function nameSentence(names: readonly string[]) {
  const last = names.at(-1) ?? "";
  return names.length < 2 ? last : `${names.slice(0, -1).join(", ")} and ${last}`;
}

const money = (amount: number) => shownCapText(amount) ?? "Unavailable";

/**
 * The sum of a custom selection's modules, the hold and the cap, under the label that says what
 * they are: an estimate from earlier runs, never a quote. The page's own figures before a summary,
 * the service's after it.
 */
export function EstimateFigures({
  sum,
  hold,
  cap,
  children,
}: {
  sum: number;
  hold: number;
  /** Whole USD, or null when the table gives no ceiling to compute it against. */
  cap: number | null;
  /** What goes under the figures in the same region (the review's line for each module). */
  children?: ReactNode;
}) {
  return (
    <section aria-label={ESTIMATE_LABEL}>
      <Well className="grid gap-3 p-4">
        <div className="grid gap-0.5">
          <h4 className="text-small font-medium text-text-primary">{ESTIMATE_LABEL}</h4>
          <p className="text-caption text-text-secondary">
            An estimate, not a quote. The hold is what one call of the largest module keeps against
            the cap while it is in flight.
          </p>
        </div>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-6 gap-y-2">
          <div className="grid gap-0.5">
            <dt className="text-caption text-text-tertiary">Sum of the modules</dt>
            <dd>
              <Figure className="text-body font-medium">{money(sum)}</Figure>
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-caption text-text-tertiary">Hold for one call</dt>
            <dd>
              <Figure className="text-body font-medium">{money(hold)}</Figure>
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-caption text-text-tertiary">Cap</dt>
            <dd>
              <Figure className="text-h4 font-medium">
                {cap === null ? "Unavailable" : money(cap)}
              </Figure>
            </dd>
          </div>
        </dl>
      </Well>
      {children}
    </section>
  );
}

/**
 * The service's estimate for the reviewed custom run: the figures it will launch at and one line
 * per module, by reader name, with the reason the rules added it and whether it reaches the Modules
 * page only.
 */
export function ReviewedEstimate({ estimate }: { estimate: CustomEstimate }) {
  return (
    <EstimateFigures
      sum={Number(estimate.sum)}
      hold={Number(estimate.hold)}
      cap={Number(estimate.cap)}
    >
      <ul
        aria-label="What each module is expected to cost"
        className="mt-3 grid gap-1.5 text-small"
      >
        {estimate.rows.map((row) => (
          <li
            key={row.module}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-border-hairline pb-1.5"
          >
            <span className="font-medium text-text-primary">{serviceText(row.name, "custom")}</span>
            <Figure>{money(Number(row.usd))}</Figure>
            {(row.added || row.modules_page_only || !row.measured) && (
              <span className="col-span-2 text-caption text-text-secondary">
                {[
                  row.added ? serviceText(row.added, "custom") : "",
                  row.modules_page_only ? "Modules page only" : "",
                  row.measured ? "" : "Not measured: the mean of the measured modules",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </EstimateFigures>
  );
}
