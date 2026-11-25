import { LEADS as credit } from "./credit";
import { LEADS as decision } from "./decision";
import { LEADS as financials } from "./financials";
import { LEADS as structure } from "./structure";
import type { Leads } from "./types";

const ALL: Leads = { ...financials, ...credit, ...structure, ...decision };

/** The module's own lead visual, or undefined where none is built yet. */
export function leadFor(module: string) {
  return Object.hasOwn(ALL, module) ? ALL[module] : undefined;
}
