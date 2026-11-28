import { SecurityLead } from "./cp3";
import { RefinancingLead } from "./cp3c";
import { MarketLead } from "./cp3d";
import { LegalLead } from "./cp4";
import { RestructuringLead } from "./cp4c";
import type { Leads } from "./types";

/** Lead visuals of this stage's modules (docs/design/screen-map.md, Modules). */
export const STRUCTURE_LEADS: Leads = {
  "CP-3": SecurityLead,
  "CP-3C": RefinancingLead,
  "CP-3D": MarketLead,
  "CP-4": LegalLead,
  "CP-4C": RestructuringLead,
};
