import { withUnit } from "./publishedReport";

const decimal = /^(-?)(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/;

function parts(text: string) {
  const match = decimal.exec(text.trim());
  if (!match) return null;
  const [, sign = "", whole = "", fraction = ""] = match;
  return {
    negative: sign === "-",
    digits: whole.replace(/,/g, "") + fraction,
    scale: fraction.length,
  };
}

/** `current - prior` in exact decimal arithmetic, or `null` when either side is not a number. */
export function exactDifference(current: string, prior: string): string | null {
  const a = parts(current);
  const b = parts(prior);
  if (!a || !b) return null;
  const scale = Math.max(a.scale, b.scale);
  const scaled = ({ negative, digits, scale: own }: NonNullable<typeof a>) => {
    const value = BigInt(digits + "0".repeat(scale - own));
    return negative ? -value : value;
  };
  const difference = scaled(a) - scaled(b);
  const magnitude = (difference < 0n ? -difference : difference)
    .toString()
    .padStart(scale + 1, "0");
  const whole = magnitude.slice(0, magnitude.length - scale);
  const text = scale ? `${whole}.${magnitude.slice(magnitude.length - scale)}` : whole;
  return difference < 0n ? `-${text}` : text;
}

function direction(change: string) {
  const value = parts(change);
  if (!value || !/[1-9]/.test(value.digits)) return value ? 0 : null;
  return value.negative ? -1 : 1;
}

/** The change with its unit and a leading `+` when it is above zero. */
export function changeText(change: string, unit?: string | null) {
  return `${direction(change) === 1 ? "+" : ""}${withUnit(change, unit)}`;
}

const lowerIsBetter = new Set(["leverage", "net_leverage", "netDebt", "gross_debt", "net_debt"]);
const higherIsBetter = new Set([
  "coverage",
  "interestCover",
  "revenue",
  "adjusted_ebitda",
  "undrawn",
  "liquidity",
  "freeCashFlow",
  "free_cash_flow",
]);

/** Whether a change is better or worse for credit, by the owner's fixed table. */
export function tone(key: string, change: string): "better" | "worse" | "flat" | "none" {
  const known = lowerIsBetter.has(key) || higherIsBetter.has(key);
  const sign = direction(change);
  if (!known || sign === null) return "none";
  if (sign === 0) return "flat";
  return sign > 0 === higherIsBetter.has(key) ? "better" : "worse";
}

export { direction as changeSign };
