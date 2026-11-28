import { CREDIT_LEADS } from "./credit";
import { DECISION_LEADS } from "./decision";
import { FINANCIAL_LEADS } from "./financials";
import { STRUCTURE_LEADS } from "./structure";
import type { Leads } from "./types";

const ALL: Leads = { ...FINANCIAL_LEADS, ...CREDIT_LEADS, ...STRUCTURE_LEADS, ...DECISION_LEADS };

/** The module's own lead visual, or undefined where none is built yet. */
export function leadFor(module: string) {
  return Object.hasOwn(ALL, module) ? ALL[module] : undefined;
}
