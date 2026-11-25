import { unitLabel } from "../../publishedReport";
import { Bento } from "../overview/Tile";
import { Bridge, BridgeLegend, bridgeOf, stepTable, type Step } from "./bridge";
import { withDraws } from "./draws";
import { onlyGaps, OtherCharts, rowBasis } from "./written";
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
}: {
  entry: LeadProps["entry"];
  href: (line?: number) => string;
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
      span={8}
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
        span={drawn ? 4 : 12}
        label="Funding dates"
        title="Funding dates"
        href={href}
        absent="This page could not read dated financing events."
        asOf={run.asOf}
      />
    );
    const others = <OtherCharts entry={entry} module="CP-2D" href={href} drawn={[TITLE]} />;
    const short = onlyGaps(entry, [TITLE]);
    // The bridge heads the page with the dates (and short gap tiles) stacked beside it; a bridge
    // that is only a gap is one full row and the dates take the next.
    return (
      <Bento>
        {bridge && <LiquidityBridge entry={entry} href={href} />}
        {drawn ? (
          <>
            <Beside>
              {dates}
              {short && others}
            </Beside>
            {!short && others}
          </>
        ) : (
          <>
            {dates}
            {others}
          </>
        )}
      </Bento>
    );
  },
  ["figures", "events"],
);
