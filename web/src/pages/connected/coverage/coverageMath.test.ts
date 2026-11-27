import fc from "fast-check";
import { describe, expect, it } from "vitest";
import cases from "./coverageMath.cases.json";
import { band, compare, dec, difference, stats, sum, type Stats } from "./coverageMath";

type StatsCase = { name: string; values: string[]; expect: Stats | null };

const statsCases = cases.stats as StatsCase[];

describe("answer key", () => {
  it.each(cases.dec)("dec $text", ({ text, expect: want }) => {
    expect(dec(text)).toBe(want);
  });
  it.each(statsCases)("stats $name", ({ values, expect: want }) => {
    expect(stats(values)).toEqual(want);
  });
  it.each(cases.difference)("difference $a - $b", ({ a, b, expect: want }) => {
    expect(difference(a, b)).toBe(want);
  });
  it.each(cases.sum)("sum $values", ({ values, expect: want }) => {
    expect(sum(values)).toBe(want);
  });
  it.each(cases.band)("band $value in $of", ({ value, of, expect: want }) => {
    const source = statsCases.find((c) => c.name === of);
    if (!source?.expect) throw new Error(`band case names no stats case: ${of}`);
    expect(band(value, source.expect)).toBe(want);
  });
});

const decimal = fc
  .tuple(fc.bigInt({ min: -(10n ** 12n), max: 10n ** 12n }), fc.integer({ min: 0, max: 6 }))
  .map(([n, scale]) => {
    const negative = n < 0n;
    const digits = (negative ? -n : n).toString().padStart(scale + 1, "0");
    const whole = digits.slice(0, digits.length - scale);
    const fraction = digits.slice(digits.length - scale);
    return `${negative ? "-" : ""}${whole}${scale > 0 ? `.${fraction}` : ""}`;
  });

describe("properties", () => {
  it("sum is independent of order", () => {
    fc.assert(
      fc.property(
        fc.array(decimal, { minLength: 1, maxLength: 8 }).chain((xs) =>
          fc.tuple(fc.constant(xs), fc.shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length })),
        ),
        ([xs, shuffled]) => {
          expect(sum(shuffled)).toBe(sum(xs));
        },
      ),
    );
  });

  it("difference(a, b) is the negation of difference(b, a)", () => {
    fc.assert(
      fc.property(decimal, decimal, (a, b) => {
        const ab = difference(a, b);
        const ba = difference(b, a);
        expect(ab).not.toBeNull();
        expect(ba).not.toBeNull();
        expect(difference("0", ba as string)).toBe(ab);
      }),
    );
  });

  it("min <= q1 <= median <= q3 <= max", () => {
    fc.assert(
      fc.property(fc.array(decimal, { minLength: 3, maxLength: 12 }), (xs) => {
        const s = stats(xs);
        expect(s).not.toBeNull();
        const { min, q1, median, q3, max } = s as Stats;
        expect(compare(min, q1)).toBeLessThanOrEqual(0);
        expect(compare(q1, median)).toBeLessThanOrEqual(0);
        expect(compare(median, q3)).toBeLessThanOrEqual(0);
        expect(compare(q3, max)).toBeLessThanOrEqual(0);
      }),
    );
  });

  it("stats is unchanged by trailing zeros on every figure", () => {
    fc.assert(
      fc.property(
        fc.array(decimal, { minLength: 3, maxLength: 12 }),
        fc.integer({ min: 1, max: 4 }),
        (xs, zeros) => {
          const padded = xs.map((x) => (x.includes(".") ? x : `${x}.`) + "0".repeat(zeros));
          expect(stats(padded)).toEqual(stats(xs));
        },
      ),
    );
  });
});
