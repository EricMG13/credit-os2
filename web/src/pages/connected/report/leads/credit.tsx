import { BusinessLead } from "./cp1a";
import { CreditLead } from "./cp2";
import { DownsideLead } from "./cp2a";
import { LiquidityLead } from "./cp2d";
import { MacroLead } from "./cp2e";
import { ForwardLead } from "./cp2g";
import { RatingsLead } from "./cp2h";
import { ResearchLead } from "./cpdr";
import type { Leads } from "./types";

/** Lead visuals of this stage's modules (docs/design/screen-map.md, Modules). */
export const LEADS: Leads = {
  "CP-1A": BusinessLead,
  "CP-DR": ResearchLead,
  "CP-2": CreditLead,
  "CP-2A": DownsideLead,
  "CP-2D": LiquidityLead,
  "CP-2E": MacroLead,
  "CP-2G": ForwardLead,
  "CP-2H": RatingsLead,
};
