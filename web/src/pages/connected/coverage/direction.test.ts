import { describe, expect, it } from "vitest";
import type { Fact } from "../coverageData";
import { headroom, verdict } from "./direction";

const NET = "cp-1/leverage/net-debt-ebitda";
const UNDRAWN = "cp-1/liquidity/undrawn-committed-facilities";

function row(text: string, more: Partial<Fact> = {}): Fact {
  return {
    field: "f",
    issuer: "i",
    run: "r",
    period: null,
    row: "Net leverage",
    text,
    at: Number(text) || 0,
    unit: "x",
    line: 7,
    output: "o",
    sha256: "s",
    ...more,
  };
}

describe("verdict", () => {
  it("reads lower and higher fields by the sign of the change", () => {
    expect(verdict(NET, "4.4", "-0.4")).toBe("better");
    expect(verdict(NET, "4.4", "0.4")).toBe("worse");
    expect(verdict(UNDRAWN, "511", "-39")).toBe("worse");
    expect(verdict(UNDRAWN, "511", "39")).toBe("better");
  });
  it("is none for no change, and null for a negative multiple, an unlisted field or cash", () => {
    expect(verdict(NET, "4.4", "0")).toBe("none");
    expect(verdict(NET, "-1.2", "-0.4")).toBeNull();
    expect(verdict("cp-9/other/thing", "1", "1")).toBeNull();
    expect(verdict("cp-1/liquidity/cash", "637", "-39")).toBeNull();
  });
});

describe("headroom", () => {
  it("is threshold minus current for the below words", () => {
    expect(headroom(row("4.5", { direction: "Passes at or below" }), row("3.2"))).toBe("1.3");
    expect(headroom(row("4.5", { direction: "Passes below" }), row("5.0"))).toBe("-0.5");
  });
  it("is current minus threshold for the above words", () => {
    expect(headroom(row("2.0", { direction: "Passes at or above" }), row("2.4"))).toBe("0.4");
    expect(headroom(row("2.0", { direction: "Passes above" }), row("1.5"))).toBe("-0.5");
  });
  it("is null for other units, a non-figure, no or unruled direction, or unpaired rows", () => {
    const t = row("4.5", { direction: "Passes below" });
    expect(headroom(t, row("3.2", { unit: "USD millions" }))).toBeNull();
    expect(headroom(t, row("n/a", { at: null }))).toBeNull();
    expect(headroom(row("4.5", { at: null, text: "Not supplied" , direction: "Passes below" }), row("3.2"))).toBeNull();
    expect(headroom(row("4.5"), row("3.2"))).toBeNull();
    expect(headroom(row("4.5", { direction: "Within" }), row("3.2"))).toBeNull();
    expect(headroom(t, row("3.2", { direction: "Passes above" }))).toBeNull();
    expect(headroom(t, row("3.2", { line: 8 }))).toBeNull();
    expect(headroom(t, row("3.2", { run: "other" }))).toBeNull();
  });
});
