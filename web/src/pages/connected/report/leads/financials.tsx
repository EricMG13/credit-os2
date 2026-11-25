import type { Leads } from "./types";
import { EarningsDeltaLead } from "./earningsDelta";
import { EarningsQualityLead } from "./earningsQuality";
import { FoundationLead } from "./foundation/Foundation";
import { ModelLead } from "./modelLead";
import { PeerBenchmarkLead } from "./peerBenchmark";
import { ShortSnapshotLead } from "./shortSnapshot";
import { SourceReadinessLead } from "./sourceReadiness";

/**
 * Lead visuals of the Sources and Financials stages (docs/design/screen-map.md, Modules).
 * CP-1 is proved on a retained real handoff; CP-0 and CP-1B are proved on a synthetic handoff and a
 * partial retained one; CP-1C, CP-1D and CP-L10 are built from their contracts and unproven on a real run.
 */
export const LEADS: Leads = {
  "CP-0": SourceReadinessLead,
  "CP-1": FoundationLead,
  "CP-1B": EarningsDeltaLead,
  "CP-1C": PeerBenchmarkLead,
  "CP-1D": EarningsQualityLead,
  "CP-MODEL": ModelLead,
  "CP-L10": ShortSnapshotLead,
};
