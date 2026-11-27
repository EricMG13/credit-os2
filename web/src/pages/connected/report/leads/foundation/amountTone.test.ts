import { describe, expect, it } from "vitest";
import { amountTone } from "./amountTone";

describe("amountTone exact decimal boundaries", () => {
  it.each([
    [1.2, 3, "amount-3"],
    [0.39999999999999997, 1, "amount-2"],
    [1.2e200, 3e200, "amount-3"],
    [1.2e-200, 3e-200, "amount-3"],
  ])("amountTone(%d, %d) is %s", (value, largest, tone) => {
    expect(amountTone(value, largest)).toBe(tone);
  });
});
