import { moduleName } from "../api";
import type { ScriptCheckOutcome } from "../publishedReport";

/** One row per module holding a record, one column per recorded status word, cells exact counts. */
export function ModuleOutcomeTable({
  modules,
  statuses,
}: {
  modules: readonly (readonly [string, readonly ScriptCheckOutcome[]])[];
  statuses: readonly string[];
}) {
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
                {status}
              </th>
            ))}
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
                  <span>{moduleName(id)}</span>
                  {moduleName(id) !== id && (
                    <span className="font-mono text-caption font-normal text-text-tertiary">
                      {id}
                    </span>
                  )}
                </a>
              </th>
              {statuses.map((status) => (
                <td
                  key={status}
                  className="px-3 py-2 text-right align-top font-mono text-text-primary tabular-nums"
                >
                  {outcomes.filter((outcome) => outcome.status === status).length}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
