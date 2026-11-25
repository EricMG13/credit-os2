import { unitLabel } from "../../publishedReport";
import { Bento } from "../overview/Tile";
import { Bridge, BridgeLegend, bridgeOf, stepTable, type Step } from "./bridge";
import { withDraws } from "./draws";
import { onlyGaps, otherCharts, OtherCharts, rowBasis } from "./written";
import { CompactGap, LaneTile, LeadFigure, LeadGap, Trace, type LeadTable, Beside } from "./parts";
import { chartOf, eventsOf, leadHref, drawsNothing, statedInProse } from "./read";
import type { LeadProps } from "./types";

const TITLE = "Liquidity bridge";

/** The bridge's table view: each step's amount as written, then its own unit and basis cells. */
function bridgeTable(
  steps: readonly Step[],
  basis: ReturnType<typeof rowBasis>,
  href: (line?: number) => string,
): LeadTable | undefined {
  const table = stepTable(steps, href);
  return (
    table && {
      ...table,
      head: [...table.head, ...basis.head],
      rows: table.rows.map((row, at) => ({ ...row, cells: [...row.cells, ...basis.cells(at)] })),
    }
  );
}

function LiquidityBridge({
  entry,
  href,
  span,
}: {
  entry: LeadProps["entry"];
  href: (line?: number) => string;
  span: 8 | 12;
}) {
  const chart = chartOf(entry, TITLE);
  const read = bridgeOf(chart);
  if (!read)
    return (
      <LeadGap
        span={12}
        label={TITLE}
        title={TITLE}
        reason={
          chart.state === "gap" ? chart.reason : "This page could not read the liquidity bridge."
        }
      />
    );
  const { steps, unit, why, table } = read;
  const basis = rowBasis(table);
  return (
    <LeadFigure
      span={span}
      label={TITLE}
      title={TITLE}
      basis={unit ? unitLabel(unit) : undefined}
      legend={!why && <BridgeLegend fall="Uses" rises />}
      trace={<Trace href={href(table.line)} name={TITLE} />}
      figure={
        why ? (
          <CompactGap>{why}</CompactGap>
        ) : (
          <Bridge
            steps={steps}
            unit={unit}
            label={`${TITLE} in ${unitLabel(unit)}: ${steps
              .map((step) => `${step.label} ${step.cell.text}`)
              .join(", ")}.`}
          />
        )
      }
      table={bridgeTable(steps, basis, href)}
      notes={basis.shared}
    />
  );
}

/** CP-2D: does cash last, and until when. */
export const LiquidityLead = withDraws(
  function LiquidityLead(props: LeadProps) {
    const { entry, run } = props;
    if (drawsNothing(entry)) return null;
    const href = leadHref(props);
    const drawn = Boolean(bridgeOf(chartOf(entry, TITLE)));
    // A bridge or a lane the module wrote as prose only is the frame's, in the module's words.
    const bridge = !statedInProse(entry, `Chart data: ${TITLE}`);
    const dates = !statedInProse(entry, "Events: Financing") && (
      <LaneTile
        lane={eventsOf(entry, "Financing")}
        span={12}
        label="Funding dates"
        title="Funding dates"
        href={href}
        absent="This page could not read dated financing events."
        asOf={run.asOf}
      />
    );
    const others = <OtherCharts entry={entry} module="CP-2D" href={href} drawn={[TITLE]} />;
    // Short gap tiles stack beside a drawn bridge; with none the bridge takes the row. The dates
    // always take a row of their own, where their time axis has room.
    const beside = drawn && otherCharts(entry, [TITLE]) > 0 && onlyGaps(entry, [TITLE]);
    return (
      <Bento>
        {bridge && <LiquidityBridge entry={entry} href={href} span={beside ? 8 : 12} />}
        {beside ? <Beside>{others}</Beside> : others}
        {dates}
      </Bento>
    );
  },
  ["figures", "events"],
);
