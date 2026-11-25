import { moduleName } from "../api";
import type { OutputEntry } from "../publishedReport";

export const BARE_MODULE_CODE = /^CP-[A-Z0-9]+$/;

/** The module's name, and for a handoff that is not the designated one, what sets it apart. */
export function handoffName(entry: OutputEntry) {
  const { module, label } = entry.output;
  if (entry.selected) return moduleName(module);
  return `${moduleName(module)} · ${BARE_MODULE_CODE.test(label.trim()) ? "Alternate handoff" : label}`;
}
