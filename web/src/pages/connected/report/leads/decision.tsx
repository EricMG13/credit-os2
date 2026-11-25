import type { Leads } from "./types";
import { CommitteeLead } from "./committee";
import { ClearanceLead } from "./validation";

/** Lead visuals of the Validation and decision stage (docs/design/screen-map.md, Modules). CP-8 has no module page (its route is Changes), so it has no lead. */
export const LEADS: Leads = {
  "CP-5": ClearanceLead,
  "CP-6": CommitteeLead,
};
