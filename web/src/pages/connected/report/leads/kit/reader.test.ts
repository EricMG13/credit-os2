import { describe, expect, it } from "vitest";
import { citesSource, clauses, IN_EVIDENCE, namesSource, reasonText, safeText } from "./reader";

describe("safeText", () => {
  it("passes plain reader wording and turns module codes into names", () => {
    expect(safeText("  Revenue detail is incomplete ")).toBe("Revenue detail is incomplete");
    expect(safeText("Net debt rose")).toBe("Net debt rose");
  });
  it.each([
    "Calculation C07; register T4.4 row D14.",
    "see C07 in T1D.2 per 10-K p 45",
    "Not supplied: not in TDG_10-K.htm page 45",
    "register T5B.5",
    "TL10.1 scope",
    "D12–D13; adjustments grow",
  ])("sends text that names a source to Evidence: %s", (text) => {
    expect(namesSource(text)).toBe(true);
    expect(safeText(text)).toBe(IN_EVIDENCE);
  });
  it("does not mistake ordinary words, quarters or amounts for identifiers", () => {
    for (const text of [
      "Q3 results",
      "FY2024 rose 4.4 points",
      "Cover of 3.1x",
      "Tranche C is secured",
    ])
      expect(namesSource(text), text).toBe(false);
  });
});

describe("inline reference markers (review L10)", () => {
  it.each([
    ["Close the covenant gap [E3].", "Close the covenant gap."],
    ["Remediate [E12, E14] before committee", "Remediate before committee"],
    ["Leverage rose [C07] in the year", "Leverage rose in the year"],
    ["Two items [E3; E5] and [E7–E9] remain", "Two items and remain"],
  ])("strips the marker from %s", (text, drawn) => {
    expect(safeText(text)).toBe(drawn);
    expect(namesSource(text)).toBe(false);
  });
  it("still sends text that names a source to Evidence", () => {
    expect(safeText("See TDG_10-K.htm page 45 [E3]")).toBe(IN_EVIDENCE);
    expect(safeText("Per calculation C07 [E3]")).toBe(IN_EVIDENCE);
  });
  it("leaves square brackets that are not reference lists", () => {
    expect(safeText("Range [low, high]")).toBe("Range [low, high]");
    expect(safeText("Note [a]")).toBe("Note [a]");
  });
});

describe("reasonText", () => {
  it("draws a source dash as a dash, any other reason as safe text", () => {
    expect(reasonText("source dash")).toBe("—");
    expect(reasonText(" Source dash ")).toBe("—");
    expect(reasonText("source dash in TDG_10-K.htm page 45")).toBe(IN_EVIDENCE);
    expect(reasonText("no split [E3]")).toBe("no split");
  });
});

describe("citesSource", () => {
  it("counts a named filing or a Source: lead-in as a source reference", () => {
    expect(citesSource("Annual Form 10-K subsequent-events note")).toBe(true);
    expect(citesSource("Source: the lender's note.")).toBe(true);
    expect(citesSource("No later event is stated.")).toBe(false);
  });
});

describe("clauses", () => {
  it("splits at a full stop or semicolon followed by a space", () => {
    expect(clauses("Carrying debt; reported EBITDA. Pro forma.")).toEqual([
      "Carrying debt;",
      "reported EBITDA.",
      "Pro forma.",
    ]);
  });
  it("does not split after the page abbreviations p., pp. or pg., in any case (S15-4-1)", () => {
    expect(clauses("Debt; annual p. 120, P. 71; pp. 3-4 and PG. 9; Pg. 2. Up.")).toEqual([
      "Debt;",
      "annual p. 120, P. 71;",
      "pp. 3-4 and PG. 9;",
      "Pg. 2.",
      "Up.",
    ]);
  });
  it("still splits after a word that only ends in p", () => {
    expect(clauses("Debt rose in the group. Cash fell.")).toEqual([
      "Debt rose in the group.",
      "Cash fell.",
    ]);
  });
  it("still splits after S&P., L.P. and a percentage-point pp. that no page number follows (S15-5-2)", () => {
    // Answer key (S15-5-2 probe): only a page locator followed by its page number holds the cut.
    expect(clauses("Rated B+ by S&P. Annual p120.")).toEqual(["Rated B+ by S&P.", "Annual p120."]);
    expect(clauses("Borrower Holdings L.P. Annual p120.")).toEqual([
      "Borrower Holdings L.P.",
      "Annual p120.",
    ]);
    expect(clauses("Cost of debt up 0.4 pp. Annual p71.")).toEqual([
      "Cost of debt up 0.4 pp.",
      "Annual p71.",
    ]);
  });
  it("drops empty pieces", () => {
    expect(clauses("   ")).toEqual([]);
  });
});
