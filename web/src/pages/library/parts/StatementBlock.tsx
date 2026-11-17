import type { RecordBlock } from "../slice";
import { InlineCell } from "./InlineCell";
import { Section } from "./Section";
import { SUBSECTION_HEADING } from "./heading";
import { TRACE_HOST, TraceControl } from "./TraceControl";

type Statement = Extract<RecordBlock, { kind: "statement" }>;

const HEAD = "bg-surface-card px-3 py-2 font-medium whitespace-nowrap text-text-tertiary";
const STICKY = "sticky left-0 bg-surface-card";

/**
 * A statement by period (R1, the HyperUI table look): the row labels stay in view while the figures
 * scroll inside the table's own region, so the page never scrolls sideways. The Bars view and the
 * trend column the predecessor had are not drawn (mock departure 5). A line the module marked
 * as emphasised is semibold, its figures only: a missing, withheld or gap cell keeps its own weight. The kit's ChartTable has no such line, so the table is drawn here.
 *
 * Where the caller gives `traceForRow`, each row carries its own control (or its own missing-trace
 * marker) and the table-level control is not drawn: a "no source recorded" marker beside a table whose
 * rows each have one would be wrong (ruling L9a). Without it, the table-level control or marker is drawn.
 */
export function StatementBlock({
  block,
  traceForRow,
}: {
  block: Statement;
  traceForRow?: (index: number) => string | null;
}) {
  return (
    <div className={TRACE_HOST}>
      <Section
        title={block.title}
        level={SUBSECTION_HEADING}
        actions={
          traceForRow ? undefined : (
            <TraceControl trace={block.trace} label="Show sources for this table" />
          )
        }
      >
        <div
          data-statement-surface
          className="overflow-x-auto rounded-xl border border-border-hairline bg-surface-card"
        >
          <table className="min-w-full border-collapse text-body">
            <caption className="sr-only">{block.title}</caption>
            <thead>
              <tr className="border-b-2 border-border-hairline">
                <th scope="col" className={`${HEAD} ${STICKY} text-left`}>
                  {block.stub}
                </th>
                {block.periods.map((period) => (
                  <th key={period} scope="col" className={`${HEAD} text-right`}>
                    {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => {
                const weight = row.emphasis ? "font-semibold" : "font-medium";
                return (
                  <tr
                    key={row.label}
                    className={`${TRACE_HOST} border-b border-border-hairline last:border-b-0`}
                  >
                    <th scope="row" className={`${STICKY} px-3 py-2 text-left ${weight}`}>
                      {row.label}
                    </th>
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        key={block.periods[cellIndex]}
                        className={`px-3 py-2 text-right whitespace-nowrap tabular-nums ${row.emphasis && cell?.kind === "value" ? "font-semibold" : ""}`}
                      >
                        <div className="flex justify-end">
                          <InlineCell cell={cell} />
                        </div>
                      </td>
                    ))}
                    {traceForRow && (
                      <td className="p-2">
                        <TraceControl
                          trace={traceForRow(index)}
                          label={`Show sources for ${row.label}`}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {block.basis === null ? null : (
          <p className="text-small text-text-tertiary">{block.basis}</p>
        )}
      </Section>
    </div>
  );
}
