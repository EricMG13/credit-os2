import { AMOUNT, step } from "../../../visuals/signal/scales";
import type { LegendEntry } from "../kit/marks/Legend";

export type AmountTone = "amount-1" | "amount-2" | "amount-3" | "amount-4" | "amount-5";

/** C4: a figure's size against the largest figure in the same visual; share 0 when the largest is 0. */
export function amountTone(value: number, largest: number): AmountTone {
  if (Number.isNaN(value) || Number.isNaN(largest)) {
    throw new RangeError("amountTone: value or largest is NaN");
  }
  if (!Number.isFinite(value) || !Number.isFinite(largest)) {
    throw new RangeError("amountTone: value or largest is infinite");
  }
  const share = largest === 0 ? 0 : Math.abs(value) / Math.abs(largest);
  const scaled = share * AMOUNT.length;
  const boundary = Math.round(scaled);
  // IEEE division can put an exact decimal boundary just below its integer bin.
  const stable =
    Math.abs(scaled - boundary) <= Number.EPSILON * Math.max(1, scaled) * 2
      ? boundary / AMOUNT.length
      : share;
  const colour = step(stable, AMOUNT);
  return `amount-${String((AMOUNT as readonly string[]).indexOf(colour) + 1)}` as AmountTone;
}

/** The bar classes for a tone: the step fill and the 1 px amount edge (literal strings for Tailwind). */
export const AMOUNT_BAR: Record<AmountTone, string> = {
  "amount-1": "fill-scale-amount-1 stroke-scale-amount-edge",
  "amount-2": "fill-scale-amount-2 stroke-scale-amount-edge",
  "amount-3": "fill-scale-amount-3 stroke-scale-amount-edge",
  "amount-4": "fill-scale-amount-4 stroke-scale-amount-edge",
  "amount-5": "fill-scale-amount-5 stroke-scale-amount-edge",
};

/** The legend for an amount-tinted figure: five steps in words, no numbers, no "%". */
export const AMOUNT_LEGEND: readonly LegendEntry[] = [
  { kind: "square", tone: "amount-1", text: "Shade by size against the biggest bar: smallest" },
  { kind: "square", tone: "amount-2", text: "smaller" },
  { kind: "square", tone: "amount-3", text: "middle" },
  { kind: "square", tone: "amount-4", text: "bigger" },
  { kind: "square", tone: "amount-5", text: "biggest" },
];
