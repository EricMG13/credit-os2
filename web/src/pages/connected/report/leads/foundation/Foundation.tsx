import { figureSource } from "../../overview/figureData";
import { GapTile, LeadFrame } from "../kit/LeadFrame";
import { UnreadFigures, chartTitles } from "../kit/UnreadFigures";
import type { Lead, LeadProps } from "../types";
import { CashLadderTile } from "./CashLadder";
import { DebtStackTile } from "./DebtStack";
import { EarningsDebtTile } from "./EarningsDebt";
import { EbitdaBridgeTile } from "./EbitdaBridge";
import {
  figureGap,
  netDebtView,
  showPeriodsTile,
  statedPeriods,
  type FoundationFigure,
} from "./foundationData";
import { InterestCoverTile } from "./InterestCover";
import { MaturityTile } from "./Maturity";
import { NetDebtTile } from "./NetDebt";
import { PeriodsTile } from "./Periods";
import { SegmentsTile } from "./Segments";

const FIGURES: readonly FoundationFigure[] = [
  "earnings",
  "ladder",
  "netDebt",
  "bridge",
  "segments",
  "cover",
  "stack",
];

/** The published charts (`Chart data:` titles) the tiles below draw; any other is listed as stated. */
const DRAWN = [
  "Revenue and EBITDA",
  "Leverage",
  "Liquidity",
  "EBITDA bridge",
  "Interest cover",
  "Debt stack",
  "Debt maturities",
] as const;

/** The liquidity chart is drawn by the Net debt view alone: with no readable net debt data it is not drawn. */
const drawn = (props: LeadProps) =>
  netDebtView(props.entry) === null ? DRAWN.filter((title) => title !== "Liquidity") : DRAWN;

const unread = (props: LeadProps) =>
  chartTitles(props.entry).filter(
    (title) => !DRAWN.some((one) => one.toLowerCase() === title.toLowerCase()),
  );

/** True when this page can read no figure of the handoff: every tile would be its gap. */
function nothingToDraw(props: LeadProps) {
  return (
    unread(props).length === 0 &&
    FIGURES.every((figure) => figureGap(props.entry, figure) !== null) &&
    figureSource(props.view, "CP-1", "Debt maturities", "Financial foundation").state === "gap" &&
    statedPeriods(props.entry).labels.length === 0
  );
}

/**
 * CP-1 Financial foundation (screen map, Modules > Financials), in rows of neighbours of like
 * height: earnings against debt and leverage in one composed figure (12); the cash conversion
 * ladder beside net debt (7 + 5); the EBITDA bridge beside segments (6 + 6); interest cover beside
 * the debt stack, the pair of credit-structure figures (6 + 6); the maturity wall last, beside the
 * periods strip when the periods need their own tile (three or more, another kind, or a gap). Every
 * tile is as tall as its content, never stretched to its neighbour. A published chart none of
 * these tiles draws follows as its stated rows (kit `UnreadFigures`); a handoff with no drawable
 * figure draws one gap.
 */
function Foundation(props: LeadProps) {
  return (
    <LeadFrame props={props}>
      {nothingToDraw(props) ? (
        <GapTile span={12} label="Financial foundation" kicker="Financial foundation">
          This page could not read a figure of the financial foundation.
        </GapTile>
      ) : (
        <div className="contents lg:[&>section]:self-start">
          <EarningsDebtTile lead={props} />
          <CashLadderTile lead={props} />
          <NetDebtTile lead={props} />
          <EbitdaBridgeTile lead={props} />
          <SegmentsTile lead={props} />
          <InterestCoverTile lead={props} />
          <DebtStackTile lead={props} />
          {/* The wall takes the whole row when no periods tile shares it. */}
          <MaturityTile lead={props} span={showPeriodsTile(props.entry) ? 6 : 12} />
          {showPeriodsTile(props.entry) && <PeriodsTile lead={props} />}
          <UnreadFigures lead={props} drawn={drawn(props)} />
        </div>
      )}
    </LeadFrame>
  );
}

/**
 * The kinds the lead draws itself, so the module frame does not draw them again: the lead draws
 * the maturity wall (the module's typed figure) as its own tile.
 */
export const FoundationLead: Lead = Foundation;
FoundationLead.draws = ["figures"];
