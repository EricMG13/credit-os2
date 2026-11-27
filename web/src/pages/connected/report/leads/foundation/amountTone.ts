import { AMOUNT } from "../../../visuals/signal/scales";
import type { LegendEntry } from "../kit/marks/Legend";

export type AmountTone = "amount-1" | "amount-2" | "amount-3" | "amount-4" | "amount-5";

type ExactDecimal = { coefficient: bigint; scale: number };

function exactDecimal(value: number): ExactDecimal {
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value));
  const whole = match?.[1];
  if (whole === undefined)
    throw new RangeError("amountTone: finite input has no decimal representation");
  const fraction = match?.[2] ?? "";
  const exponent = Number(match?.[3] ?? 0);
  let coefficient = BigInt(`${whole}${fraction}`);
  const scale = fraction.length - exponent;
  if (scale < 0) coefficient *= 10n ** BigInt(-scale);
  return { coefficient, scale: Math.max(0, scale) };
}

function amountStep(value: number, largest: number): number {
  if (largest === 0) return 0;
  const amount = exactDecimal(Math.abs(value));
  const maximum = exactDecimal(Math.abs(largest));
  const scale = Math.max(amount.scale, maximum.scale);
  const numerator = amount.coefficient * 10n ** BigInt(scale - amount.scale);
  const denominator = maximum.coefficient * 10n ** BigInt(scale - maximum.scale);
  for (let boundary = 1; boundary < AMOUNT.length; boundary += 1)
    if (numerator * BigInt(AMOUNT.length) < denominator * BigInt(boundary)) return boundary - 1;
  return AMOUNT.length - 1;
}

/** C4: compare exact decimal shares with five bins; a zero largest figure has share zero. */
export function amountTone(value: number, largest: number): AmountTone {
  if (Number.isNaN(value) || Number.isNaN(largest)) {
    throw new RangeError("amountTone: value or largest is NaN");
  }
  if (!Number.isFinite(value) || !Number.isFinite(largest)) {
    throw new RangeError("amountTone: value or largest is infinite");
  }
  const index = amountStep(value, largest);
  return `amount-${String(index + 1)}` as AmountTone;
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
