import { ChevronDown } from "@untitledui/icons";
import { ChartTable } from "@/components/chart/ChartTable";
import { ChartWithTable } from "@/components/chart/ChartWithTable";
import { BarRow } from "../report/leads/parts";
import type { PortfolioBasis } from "../report/PortfolioBasis";
import type { Frame } from "./charts";
import { amount, chartTable, distinct, type SourceTable } from "./visualData";

type LimitRow = {
  label: string;
  exposure: number;
  limit: number;
  exposureText: string;
  limitText: string;
};

/** A limit's place on the shared scale: at its value, kept inside the track at either end. */
const inset = (at: number) => (at >= 1 ? "-translate-x-full" : at <= 0 ? "" : "-translate-x-1/2");

/**
 * Value against a limit, as on the covenant tests: one row a limit, the exposure a bar from zero and
 * the limit a tick, every row on the one % NAV scale, both figures as written beside their names.
 * The page states no headroom: the table does not.
 */
function LimitBullets({ rows, max }: { rows: readonly LimitRow[]; max: number }) {
  return (
    <ul className="flex min-w-0 flex-col gap-3">
      {rows.map((row) => (
        <li
          key={row.label}
          className="flex min-w-0 flex-col gap-2 border-t border-border-hairline pt-3 first:border-t-0 first:pt-0"
        >
          <span className="text-small font-medium wrap-anywhere text-text-primary">
            {row.label}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-caption text-text-tertiary">
            <span>
              Current exposure{" "}
              <span className="font-mono text-small text-text-primary tabular-nums">
                {row.exposureText}
              </span>
            </span>
            <span>
              Limit{" "}
              <span className="font-mono text-small text-text-primary tabular-nums">
                {row.limitText}
              </span>
            </span>
          </span>
          <div
            role="img"
            aria-label={`${row.label}: current exposure ${row.exposureText} against a limit of ${row.limitText}.`}
          >
            <BarRow end={row.exposure / max} bar={{ "data-exposure": row.exposureText }}>
              <span
                data-limit={row.limitText}
                className={`absolute -inset-y-1 w-0.5 bg-text-primary ${inset(row.limit / max)}`}
                style={{ left: `${String((row.limit / max) * 100)}%` }}
              />
            </BarRow>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function portfolioLimits(table: SourceTable, basis: PortfolioBasis, frame: Frame) {
  if (
    table.headers.join("|") !==
    "Limit|Current exposure|Proposed exposure|Limit value|Reporting unit|Basis and limitation"
  )
    return null;
  const columns: LimitRow[] = [];
  for (const [label = "", current = "", , limit = "", unit] of table.rows) {
    const exposure = amount(current);
    const maximum = amount(limit);
    if (unit !== "% NAV" || exposure === null || maximum === null || exposure < 0 || maximum < 0)
      return null;
    columns.push({
      label,
      exposure,
      limit: maximum,
      exposureText: `${current}%`,
      limitText: `${limit}%`,
    });
  }
  if (!columns.length || !distinct(columns.map(({ label }) => label))) return null;
  // One scale for every row, from zero to the largest stated figure (at least 1% NAV).
  const commonMaximum = Math.max(1, ...columns.flatMap((row) => [row.exposure, row.limit]));
  return (
    <>
      <ChartWithTable
        {...frame}
        note={`Current exposure and limits in % NAV · ${basis.asOf}`}
        chart={<LimitBullets rows={columns} max={commonMaximum} />}
        table={{
          head: ["Limit", "Current exposure", "Limit value"],
          rows: columns.map(({ label, exposureText, limitText }) => ({
            label,
            cells: [exposureText, limitText],
          })),
        }}
      />
      <details className="group min-w-0">
        <summary className="flex min-h-8 w-fit cursor-pointer items-center gap-1.5 font-semibold max-[480px]:min-h-11">
          Published exposures and proposals
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-text-tertiary group-open:rotate-180"
          />
        </summary>
        <ChartTable caption="Published exposures and proposals" {...chartTable(table)} />
      </details>
    </>
  );
}
