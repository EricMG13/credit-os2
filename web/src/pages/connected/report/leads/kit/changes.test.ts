// Inputs are the reviewer's (round 3, L2) and built here; every expected value is written out by
// hand, none computed by the code under test.
import { describe, expect, it } from "vitest";
import { changeBetween, changePeriod, yearApart } from "./changes";
import { readCell } from "./numbers";

const side = (period: string, cell: string, unit?: string) => ({ period, cell, unit });

describe("changeBetween: one kind of period, exactly one year apart", () => {
  it("gives the exact change FY n-1 → FY n", () => {
    expect(changeBetween(side("FY2024", "19750"), side("FY2025", "24880"))).toMatchObject({
      text: "5130",
      stated: false,
      sign: 1,
    });
    expect(changeBetween(side("FY23", "6.27", "x"), side("FY24", "6.53", "x"))?.text).toBe("0.26");
  });
  it("gives it for the same quarter, LTM end or half a year earlier", () => {
    expect(changeBetween(side("Q1 2024", "1920"), side("Q1 2025", "2005"))?.text).toBe("85");
    expect(changeBetween(side("LTM Mar-2024", "5.32"), side("LTM Mar-2025", "5.10"))).toMatchObject(
      { text: "-0.22", sign: -1 },
    );
    expect(changeBetween(side("H1 2024", "0"), side("H1 2025", "0"))).toMatchObject({
      text: "0",
      sign: 0,
    });
  });
  it("reads an accounting negative and a cell already read", () => {
    expect(changeBetween(side("FY2023", "(10)"), side("FY2024", "5"))?.text).toBe("15");
    expect(
      changeBetween(
        { period: "FY2023", cell: readCell("1,160") },
        { period: "FY2024", cell: readCell("1,250") },
      )?.text,
    ).toBe("90");
  });
  it.each([
    ["Q1 2024", "FY2025", "1920", "7940"],
    ["FY2024", "LTM Mar-2025", "4.88", "5.10"],
    ["FY2022", "FY2024", "2646", "7940"],
    ["FY2025", "FY2024", "7940", "6585"],
    ["Q1 2025", "Q2 2025", "1920", "2005"],
    ["LTM Mar-2024", "LTM Jun-2025", "5.0", "5.1"],
    ["FY2024", "CY2025", "1", "2"],
    ["Current", "FY2025", "1", "2"],
  ])("refuses %s → %s", (prior, current, a, b) => {
    expect(changeBetween(side(prior, a), side(current, b))).toBeNull();
  });
  it("refuses different units, and a gap or words on either side", () => {
    expect(changeBetween(side("FY2023", "6.27", "x"), side("FY2024", "6.53", "%"))).toBeNull();
    expect(changeBetween(side("FY2023", "6.27", "x"), side("FY2024", "6.53"))).toBeNull();
    expect(
      changeBetween(side("FY2023", "Not supplied: outside scope"), side("FY2024", "7940")),
    ).toBeNull();
    expect(changeBetween(side("FY2023", "n.m."), side("FY2024", "7940"))).toBeNull();
    expect(changeBetween({ period: "FY2023", cell: null }, side("FY2024", "1"))).toBeNull();
  });
});

describe("a change the handoff states is returned as written", () => {
  it("whatever the periods, marked stated, with the sign it is written with", () => {
    expect(changeBetween(side("FY2022", "1"), side("FY2024", "2"), "+3.02 pp")).toEqual({
      text: "+3.02 pp",
      stated: true,
      sign: 1,
      reading: { kind: "text", text: "+3.02 pp" },
    });
    expect(
      changeBetween(side("FY2024", "4.88"), side("LTM Mar-2025", "5.10"), " −0.22x "),
    ).toMatchObject({ text: "−0.22x", stated: true, sign: -1 });
    expect(changeBetween(side("FY2023", "1"), side("FY2024", "2"), "(1,160)")).toMatchObject({
      text: "(1,160)",
      sign: -1,
      reading: { kind: "number", value: -1160 },
    });
    expect(changeBetween(side("FY2023", "1"), side("FY2024", "2"), "n.m.")).toMatchObject({
      text: "n.m.",
      stated: true,
      sign: null,
    });
  });
  it("keeps a stated gap as the module's words, never computing in its place", () => {
    const change = changeBetween(
      side("FY2023", "1"),
      side("FY2024", "2"),
      "Not calculable: negative base",
    );
    expect(change).toMatchObject({ stated: true, text: "Not calculable: negative base" });
    expect(change?.reading.kind).toBe("gap");
  });
  it("computes when the stated cell is empty", () => {
    expect(changeBetween(side("FY2023", "1"), side("FY2024", "3"), "  ")?.stated).toBe(false);
    expect(changeBetween(side("FY2023", "1"), side("FY2024", "3"), null)?.text).toBe("2");
  });
});

describe("changePeriod and yearApart", () => {
  it("parses the label forms the tables share", () => {
    expect(changePeriod("LTM March 2025")).toMatchObject({ form: "LTMMAR", year: 2025 });
    expect(changePeriod("2Q 2025")).toMatchObject({ form: "Q2", year: 2025 });
    expect(changePeriod("2025-06-30")).toMatchObject({ year: 2025, kind: "other" });
    expect(changePeriod("FY2024")).toEqual({
      label: "FY2024",
      year: 2024,
      form: "FY",
      kind: "annual",
    });
    expect(changePeriod("")).toBeNull();
  });
  it("matches one form across two- and four-digit years", () => {
    expect(yearApart("FY24", "FY2025")).toBe(true);
    expect(yearApart("Q1 24", "Q1-25")).toBe(true);
    expect(yearApart("LTM Mar-2024", "LTM March 2025")).toBe(true);
    expect(yearApart("FY2024", "2025")).toBe(false);
  });
});
