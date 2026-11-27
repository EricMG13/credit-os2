import { describe, expect, it } from "vitest";
import { AMOUNT_BAR, AMOUNT_LEGEND, amountTone } from "./amountTone";

describe("amountTone", () => {
  it.each([
    [3941, 3941, "amount-5"], // share 1
    [3809, 3941, "amount-5"], // 0.9665 x 5 = 4.83
    [2236, 3941, "amount-3"], // 0.5674 x 5 = 2.84
    [1962, 3941, "amount-3"], // 0.4978 x 5 = 2.489
    [190, 3941, "amount-1"], // 0.048 x 5 = 0.24
    [81, 3941, "amount-1"], // 0.021 x 5 = 0.10
    [6637, 12637, "amount-3"], // 0.5252 x 5 = 2.63
    [4768, 12637, "amount-2"], // 0.3773 x 5 = 1.89
    [580, 12637, "amount-1"], // 0.046 x 5 = 0.23
    [-106, 212, "amount-3"], // abs 0.5 x 5 = 2.5
    [0, 0, "amount-1"], // largest 0: share 0
    [5, 0, "amount-1"], // largest 0: share 0
  ])("amountTone(%d, %d) is %s", (value, largest, tone) => {
    expect(amountTone(value, largest)).toBe(tone);
  });

  it("throws RangeError on a NaN or infinite input", () => {
    expect(() => amountTone(NaN, 10)).toThrow(RangeError);
    expect(() => amountTone(1, Infinity)).toThrow(RangeError);
  });
});

describe("AMOUNT_BAR and AMOUNT_LEGEND", () => {
  it("maps a tone to the step fill and the amount edge", () => {
    expect(AMOUNT_BAR["amount-4"]).toBe("fill-scale-amount-4 stroke-scale-amount-edge");
  });

  it("words the five steps without numbers or banned terms", () => {
    expect(AMOUNT_LEGEND).toHaveLength(5);
    for (const entry of AMOUNT_LEGEND) {
      expect(entry.text).not.toMatch(/÷|ratio|margin|sum|reconcil|deriv|%|7,940|4,173|total/i);
      expect(entry.text).not.toMatch(/764|deriv|largest|before FY2028|only|wall of/i);
    }
  });
});
