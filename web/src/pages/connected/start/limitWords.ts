import { moduleName } from "../api";

/** A limit's outcome as the "Run limits" status set words it. */
export const OUTCOME_STATE = {
  will_refuse: "Will refuse",
  gap: "Gap",
  limited: "Limited",
  check: "Check",
} as const;

/** The module an item is scoped to, by name; "run" is the whole run. */
export function scopeText(scope: string) {
  return scope === "run" ? "Whole run" : moduleName(scope);
}

/** The modules of these items by name, each once, in order. */
export function moduleNames(items: readonly { scope: string }[]): string[] {
  return [...new Set(items.map((item) => scopeText(item.scope)))];
}
