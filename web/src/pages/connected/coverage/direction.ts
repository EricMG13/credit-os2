import type { Fact } from "../coverageData";
import { compare, dec, difference, type Dec } from "./coverageMath";

/** The ruled better/worse table (DESIGN.md, "Colour as signal"): exactly these fields, and no cash. */
export const DIRECTION: Readonly<Record<string, "lower" | "higher">> = {
  "cp-1/leverage/total-debt-ebitda": "lower",
  "cp-1/leverage/net-debt-ebitda": "lower",
  "cp-1/interest-cover/ebitda-cash-interest": "higher",
  "cp-1/liquidity/undrawn-committed-facilities": "higher",
  "cp-1/revenue-and-ebitda/revenue": "higher",
  "cp-1/revenue-and-ebitda/adjusted-ebitda": "higher",
  "cp-3c/refinancing-need/committed-resources": "higher",
};

/** Null when the field has no ruled direction, or a "lower" field's figure is negative (a negative multiple). */
export function verdict(field: string, value: Dec, change: Dec): "better" | "worse" | "none" | null {
  const wanted = DIRECTION[field];
  if (wanted === undefined) return null;
  if (wanted === "lower" && compare(value, "0") < 0) return null;
  const sign = compare(change, "0");
  if (sign === 0) return "none";
  return (sign < 0) === (wanted === "lower") ? "better" : "worse";
}

const BELOW = new Set(["Passes below", "Passes at or below"]);
const ABOVE = new Set(["Passes above", "Passes at or above"]);

/**
 * Room against a limit, from the module's own Direction word: threshold minus current for the
 * "below" words, current minus threshold for the "above" words. Both facts must be figures with
 * the same stated unit, from the same run and table row (`line`); a current that states a
 * different Direction than the threshold is not paired. Null otherwise.
 */
export function headroom(threshold: Fact, current: Fact): Dec | null {
  const word = threshold.direction;
  if (word === undefined || !(BELOW.has(word) || ABOVE.has(word))) return null;
  if (current.direction !== undefined && current.direction !== word) return null;
  if (threshold.run !== current.run || threshold.line !== current.line) return null;
  if (threshold.unit === undefined || threshold.unit !== current.unit) return null;
  if (threshold.at === null || current.at === null) return null;
  if (dec(threshold.text) === null || dec(current.text) === null) return null;
  return BELOW.has(word)
    ? difference(threshold.text, current.text)
    : difference(current.text, threshold.text);
}
