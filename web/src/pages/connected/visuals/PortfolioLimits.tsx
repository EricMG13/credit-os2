import { ChevronDown } from "@untitledui/icons";
import { ChartTable } from "@/components/chart/ChartTable";
import { LimitsChart, type LimitColumn } from "@/components/chart/LimitsChart";
import type { PortfolioBasis } from "../report/PortfolioBasis";
import type { Frame } from "./charts";
import { amount, chartTable, distinct, type SourceTable } from "./visualData";

export function portfolioLimits(table: SourceTable, basis: PortfolioBasis, frame: Frame) {
  if (
    table.headers.join("|") !==
    "Limit|Current exposure|Proposed exposure|Limit value|Reporting unit|Basis and limitation"
  )
    return null;
  const columns: LimitColumn[] = [];
  for (const [label = "", current = "", , limit = "", unit] of table.rows) {
    const exposure = amount(current);
    const maximum = amount(limit);
    if (unit !== "% NAV" || exposure === null || maximum === null || exposure < 0 || maximum < 0)
      return null;
    columns.push({
      label,
      exposure,
      limit: maximum,
      scaleMax: Math.max(exposure, maximum, 1),
      exposureText: `${current}%`,
      limitText: `limit ${limit}%`,
    });
  }
  if (!columns.length || !distinct(columns.map(({ label }) => label))) return null;
  const commonMaximum = Math.max(...columns.map(({ scaleMax }) => scaleMax));
  return (
    <>
      <LimitsChart
        {...frame}
        note={`Current exposure and limits in % NAV · ${basis.asOf}`}
        columns={columns.map((column) => ({ ...column, scaleMax: commonMaximum }))}
        table={{
          head: ["Limit", "Current exposure", "Limit value"],
          rows: columns.map(({ label, exposureText, limitText }) => ({
            label,
            cells: [exposureText, limitText?.replace(/^limit /, "") ?? null],
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
