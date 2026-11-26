import { moduleName } from "../api";
import type { ScriptCheckRecord } from "../publishedReport";

function Hash({ value }: { value: string | null }) {
  return value === null ? (
    <span className="text-gap-text">Not recorded</span>
  ) : (
    // 64 characters as two even lines of 32, as on Sources.
    <code className="inline-block w-[32ch] max-w-full font-mono text-mono break-all text-text-tertiary">
      {value}
    </code>
  );
}

/** Each module's accepted attempt, its response hash and the scripts run with their hashes. */
export function CheckingRecord({
  records,
  pathway,
}: {
  records: readonly ScriptCheckRecord[];
  pathway?: string | null;
}) {
  return (
    <div
      role="region"
      aria-label="Checking record"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="relative min-w-0 overflow-x-auto rounded-ds-md border border-border-hairline max-[480px]:p-2"
    >
      <table className="w-full border-collapse text-small">
        <caption className="px-3 pt-3 pb-2 text-left text-small font-medium text-text-primary">
          Checking record
        </caption>
        <thead className="bg-surface-subtle">
          <tr>
            {["Module", "Accepted attempt", "Accepted response SHA-256", "Scripts run"].map(
              (label) => (
                <th
                  key={label}
                  scope="col"
                  className="px-3 py-2 text-left align-bottom font-medium text-text-secondary"
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index} className="border-t border-border-hairline">
              <th scope="row" className="px-3 py-2 text-left align-top font-medium">
                {moduleName(record.module, pathway)}
              </th>
              <td className="px-3 py-2 align-top font-mono tabular-nums">{record.attempt}</td>
              <td className="min-w-24 px-3 py-2 align-top">
                <Hash value={record.response} />
              </td>
              <td className="min-w-32 px-3 py-2 align-top">
                {record.scripts.length > 0 ? (
                  <ul className="grid gap-2">
                    {record.scripts.map((script) => (
                      <li className="grid min-w-0 gap-0.5" key={script.name}>
                        <span className="wrap-anywhere">{script.name}</span>
                        <Hash value={script.sha256} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gap-text">No script recorded</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
