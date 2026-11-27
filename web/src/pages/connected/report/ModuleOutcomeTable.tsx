import { GapText } from "@/pages/library/parts/GapText";
import { XClose } from "@untitledui/icons";
import { moduleName } from "../api";
import type { ScriptCheckOutcome } from "../publishedReport";
import { CheckStatusMark } from "./scriptCheckParts";

const FAIL_WORDS = ["disagreed", "contradicted", "missing"];

const CELL = "px-3 py-2 text-right align-top font-mono text-text-primary tabular-nums";

/**
 * One status count, exact and in ink. A failing word's non-zero count carries its ink cross; a
 * non-zero "not checked" count sits on the hatch; a zero is the plain recorded 0.
 */
function CountCell({ status, count }: { status: string; count: number }) {
  if (count > 0 && FAIL_WORDS.includes(status))
    return (
      <span className="inline-flex items-center gap-1 rounded-ds-xs border border-border-hairline bg-surface-card px-1.5 text-text-primary">
        <XClose className="size-3 shrink-0 text-text-primary" aria-hidden="true" data-mark="fail" />
        {count}
      </span>
    );
  if (count > 0 && status === "not checked")
    return (
      <span className="gap-hatch inline-flex rounded-ds-xs border border-dashed border-border-gap p-0.5">
        <span className="rounded-ds-xs bg-surface-card px-1.5">{count}</span>
      </span>
    );
  return <>{count}</>;
}

/**
 * One row per module holding a record, one column per recorded status word, cells exact counts, a
 * Total column (a module with no outcome says so, never 0) and, for two or more modules, a Total row.
 */
export function ModuleOutcomeTable({
  modules,
  statuses,
  pathway,
}: {
  modules: readonly (readonly [string, readonly ScriptCheckOutcome[]])[];
  statuses: readonly string[];
  pathway?: string | null;
}) {
  const countOf = (outcomes: readonly ScriptCheckOutcome[], status: string) =>
    outcomes.filter((outcome) => outcome.status === status).length;
  const all = modules.flatMap(([, outcomes]) => outcomes);
  return (
    <div
      role="region"
      aria-label="Outcomes by module"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="relative min-w-0 overflow-x-auto rounded-ds-md border border-border-hairline max-[480px]:p-2"
    >
      <table className="w-full border-collapse text-small">
        <caption className="px-3 pt-3 pb-2 text-left text-small font-medium text-text-primary">
          Outcomes by module
        </caption>
        <thead className="bg-surface-subtle">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium text-text-secondary">
              Module
            </th>
            {statuses.map((status) => (
              <th
                key={status}
                scope="col"
                className="px-3 py-2 text-right font-medium text-text-secondary"
              >
                <CheckStatusMark status={status} />
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-right font-medium text-text-secondary">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {modules.map(([id, outcomes]) => (
            <tr key={id} className="border-t border-border-hairline">
              <th scope="row" className="px-3 py-1 text-left align-top font-medium">
                <a
                  href={`#evidence/checks/${encodeURIComponent(id)}`}
                  className="inline-flex min-h-8 flex-wrap items-center gap-x-2 text-text-primary underline-offset-2 hover:underline max-[480px]:min-h-11"
                >
                  {moduleName(id, pathway)}
                </a>
              </th>
              {statuses.map((status) => (
                <td key={status} className={CELL}>
                  <CountCell status={status} count={countOf(outcomes, status)} />
                </td>
              ))}
              <td className={CELL}>
                {outcomes.length > 0 ? outcomes.length : <GapText>No outcome recorded</GapText>}
              </td>
            </tr>
          ))}
        </tbody>
        {modules.length >= 2 && (
          <tfoot>
            <tr className="border-t border-border-hairline bg-surface-subtle">
              <th scope="row" className="px-3 py-2 text-left font-medium text-text-primary">
                Total
              </th>
              {statuses.map((status) => (
                <td key={status} className={CELL}>
                  {countOf(all, status)}
                </td>
              ))}
              <td className={CELL}>{all.length}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
