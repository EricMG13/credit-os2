import type { TableViewData } from "../kit/LeadFrame";
import { signedText, waterfallAxis, waterfallReading, type WaterfallRow } from "../kit/marks";
import { group } from "../kit/numbers";
import { safeText } from "../kit/reader";
import { bridgeKind, cellText, type BridgeKind, type EbitdaBridge } from "./foundationData";

// The EBITDA bridge as the kit Waterfall draws it: the stated steps in order, each labelled as
// written and signed; a stated subtotal is a level drawn from the axis start like the totals; a
// step that is not a number is the gap row with its own words. No total of the changes, no largest
// step, no "add-back" word: a step is an increase or a decrease.

/**
 * Whether the bridge is drawn: not when a run of stated numbers between two levels (the opening,
 * a subtotal, the closing) does not add up to the later level. With a stated gap the Waterfall
 * draws what is known and writes the rest.
 */
export const bridgeDrawn = (data: EbitdaBridge) => !data.breaks;

const ROW_KIND = {
  opening: "level",
  subtotal: "level",
  closing: "closing",
  change: "step",
} as const;

/** Each step as a Waterfall row. */
export function bridgeRows(data: EbitdaBridge): WaterfallRow[] {
  return data.steps.map((step): WaterfallRow => {
    const label = safeText(step.label);
    const kind = ROW_KIND[step.kind];
    if (step.cell.kind !== "number")
      return {
        kind: "gap",
        label,
        reason: cellText(step.cell),
        of: kind === "step" ? "step" : "level",
      };
    return { kind, label, value: step.cell.value, text: group(step.cell.text) };
  });
}

const WORD: Record<BridgeKind, string> = {
  opening: "Opening",
  subtotal: "Subtotal",
  increase: "Increase",
  decrease: "Decrease",
  "no change": "No change",
  gap: "Not stated",
  closing: "Closing",
};

/** The figure's reading: every step with its signed amount, and where the axis starts. */
export function bridgeReading(rows: readonly WaterfallRow[], unit: string) {
  const reading = waterfallReading(rows, unit, waterfallAxis(rows, "auto"));
  return `EBITDA bridge, ${reading.slice("Waterfall, ".length)}`;
}

/** The legend's word for the bars drawn from the axis start before the closing. */
export const levelWord = (data: EbitdaBridge) =>
  data.steps.some((step) => step.kind === "subtotal") ? "Opening and subtotal" : "Opening";

/** Why a bridge that does not add up is not drawn, naming the levels it states. */
export const notAdding = (data: EbitdaBridge) =>
  `This page did not draw the bridge because its steps do not add up to ${
    data.steps.some((step) => step.kind === "subtotal")
      ? "the subtotal and closing figures it states"
      : "the closing figure"
  }.`;

/** A step's amount as the table states it: a change signed, a total grouped, a gap as written. */
function amountText(step: EbitdaBridge["steps"][number]) {
  if (step.cell.kind !== "number") return cellText(step.cell);
  const text = group(step.cell.text);
  return step.kind === "change" ? signedText(text, step.cell.value) : text;
}

/** The table view: each step, its amount as stated, and its kind. */
export function bridgeTable(data: EbitdaBridge): TableViewData {
  return {
    caption: `EBITDA bridge, ${data.unit}`,
    headers: ["Step", `Amount, ${data.unit}`, "Kind"],
    rows: data.steps.map((step) => [
      safeText(step.label),
      amountText(step),
      WORD[bridgeKind(step)],
    ]),
  };
}
