import type { ReactNode } from "react";
import { GapNote } from "../../overview/Tile";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import { Measured, Waterfall } from "../kit/marks";
import type { LeadProps } from "../types";
import {
  bridgeDrawn,
  bridgeReading,
  bridgeRows,
  bridgeTable,
  levelWord,
  notAdding,
} from "./bridgeGeometry";
import { ebitdaBridge, figureGap } from "./foundationData";

const LABEL = "EBITDA bridge";
const TITLE = "Reported to adjusted EBITDA";
/** As tall as its content, not stretched to the tile beside it in the row. */
const AsTall = ({ children }: { children: ReactNode }) => (
  <div className="contents lg:[&>section]:self-start">{children}</div>
);

/**
 * Tile 4: the stated EBITDA bridge, opening through each stated step (a stated subtotal drawn as a
 * level) to the closing figure, on an axis cut where the values sit high (marked on the totals).
 * A bridge whose stated amounts do not add up is not drawn as a bridge; its amounts stay in the
 * table view. A bridge whose every amount is a stated gap is the gap tile with the module's words.
 */
export function EbitdaBridgeTile({ lead }: { lead: LeadProps }) {
  const data = ebitdaBridge(lead.entry);
  if (!data)
    return (
      <GapTile span={6} label={LABEL} kicker={LABEL}>
        {figureGap(lead.entry, "bridge") ?? "This page could not read the EBITDA bridge."}
      </GapTile>
    );
  const common = {
    props: lead,
    span: 6 as const,
    label: LABEL,
    kicker: `EBITDA bridge · ${data.unit}`,
    title: TITLE,
    line: data.tableLine,
    source: "the EBITDA bridge",
    table: bridgeTable(data),
  };
  if (!bridgeDrawn(data))
    return (
      <AsTall>
        <FigureTile {...common}>
          <GapNote>{notAdding(data)}</GapNote>
        </FigureTile>
      </AsTall>
    );
  const rows = bridgeRows(data);
  return (
    <AsTall>
      <FigureTile {...common}>
        <Measured fallback={560}>
          {(width) => (
            <Waterfall
              rows={rows}
              unit={data.unit}
              width={width}
              axisStart="auto"
              label={bridgeReading(rows, data.unit)}
              legend={{
                level: levelWord(data),
                closing: "Closing",
                gap: "Not stated",
              }}
            />
          )}
        </Measured>
      </FigureTile>
    </AsTall>
  );
}
