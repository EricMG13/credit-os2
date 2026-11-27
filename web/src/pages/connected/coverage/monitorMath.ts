import type { Coverage, Fact } from "../coverageData";
import { writtenUnit } from "../moneyUnits";
import type { Dec } from "./coverageMath";

const LABELS: Readonly<Record<string, string>> = {
  "cp-1/leverage/total-debt-ebitda": "Total debt / EBITDA",
  "cp-1/leverage/net-debt-ebitda": "Net debt / EBITDA",
  "cp-1/interest-cover/ebitda-cash-interest": "EBITDA / cash interest",
  "cp-1/liquidity/cash": "Cash",
  "cp-1/liquidity/undrawn-committed-facilities": "Undrawn committed facilities",
  "cp-1/revenue-and-ebitda/revenue": "Revenue",
  "cp-1/revenue-and-ebitda/adjusted-ebitda": "Adjusted EBITDA",
  "cp-3c/refinancing-need/debt-maturing": "Debt maturing",
  "cp-4/covenant-headroom/current": "Covenant level",
  "cp-4/covenant-headroom/threshold": "Covenant limit",
};

export function fieldLabel(data: Coverage, field: string): string {
  return data.fields.find((item) => item.id === field)?.label ?? LABELS[field] ?? "Figure";
}

/** Keep the source's exact decimal text and append only its written unit. */
export function written(fact: Fact): string {
  return writtenUnit(fact.text, fact.unit);
}

/** Convert exact decimal position to a bounded pixel fraction without overflowing on large inputs. */
export function fraction(value: Dec, low: Dec, high: Dec): number {
  const parse = (text: string) => {
    const negative = text.startsWith("-");
    const unsigned = negative ? text.slice(1) : text;
    const [whole = "0", decimal = ""] = unsigned.split(".");
    return {
      coefficient: BigInt(`${whole}${decimal}`) * (negative ? -1n : 1n),
      scale: decimal.length,
    };
  };
  const values = [parse(value), parse(low), parse(high)];
  const scale = Math.max(...values.map((item) => item.scale));
  const scaled = values.map((item) => item.coefficient * 10n ** BigInt(scale - item.scale));
  const [current, minimum, maximum] = scaled as [bigint, bigint, bigint];
  const range = maximum - minimum;
  if (range === 0n) return 0.5;
  const precision = 1_000_000_000n;
  return Number(((current - minimum) * precision) / range) / Number(precision);
}
