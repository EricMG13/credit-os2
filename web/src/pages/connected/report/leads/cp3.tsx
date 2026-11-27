import { runMoneyUnit } from "../../reportView";
import { Bento } from "../overview/Tile";
import {
  InstrumentTable,
  PeerLevels,
  hasRelativeValueNarrative,
  peerLevels,
  quotedInstruments,
  recommendationInstruments,
  securityView,
  ValueMatrix,
} from "../Securities";
import { withDraws } from "./draws";
import { LeadGap } from "./parts";
import { leadHref, drawsNothing } from "./read";
import type { LeadProps } from "./types";

const TITLE = "Instrument decisions";

/** CP-3: which instrument, at what level, and why. */
export const SecurityLead = withDraws(
  function SecurityLead(props: LeadProps) {
    const { entry, run, view } = props;
    if (drawsNothing(entry)) return null;
    const href = leadHref(props);
    const data = securityView(entry, run.asOf);
    const instruments =
      (data && quotedInstruments(data, runMoneyUnit(view.catalogue))) ??
      recommendationInstruments(entry);
    const peers = peerLevels(entry);
    const relativeValueNarrative = hasRelativeValueNarrative(entry);
    return (
      <Bento>
        {instruments ? (
          <InstrumentTable data={instruments} href={href} />
        ) : data?.outcomes ? null : (
          <LeadGap
            span={12}
            label={TITLE}
            title={TITLE}
            reason="This page could not read the instrument decisions."
          />
        )}
        {peers ? (
          <PeerLevels peers={peers} href={href} />
        ) : (
          <LeadGap
            span={12}
            label="Relative value against peers"
            title="Relative value against peers"
            reason={
              relativeValueNarrative
                ? "No separate peer-level table is included; the module reports comparisons in its relative-value findings."
                : "No peer-level table or relative-value findings are included in this module."
            }
          />
        )}
        {data?.outcomes && <ValueMatrix table={data.outcomes} href={href} />}
      </Bento>
    );
  },
  ["figures"],
);
