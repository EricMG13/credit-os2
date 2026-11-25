import { describe, expect, it } from "vitest";
import { difference, group, numberOf, readCell, sum } from "./numbers";

describe("readCell", () => {
  it("reads a plain number, with commas and a unicode minus", () => {
    expect(readCell("7940")).toEqual({ kind: "number", text: "7940", value: 7940 });
    expect(readCell("1,250.5")).toEqual({ kind: "number", text: "1250.5", value: 1250.5 });
    expect(readCell("−302")).toEqual({ kind: "number", text: "-302", value: -302 });
  });
  it("keeps a stated gap with its reason and never makes it a number", () => {
    expect(readCell("Not supplied: source dash")).toEqual({
      kind: "gap",
      text: "Not supplied: source dash",
      reason: "source dash",
    });
    expect(readCell("Not calculable: negative signed prior base").kind).toBe("gap");
    expect(numberOf("Not supplied: no split")).toBeNull();
  });
  it("reads an accounting negative as the negative number, keeping the cell as written", () => {
    expect(readCell("(12.3)")).toEqual({
      kind: "number",
      text: "-12.3",
      value: -12.3,
      written: "(12.3)",
    });
    expect(readCell(" (1,160) ")).toEqual({
      kind: "number",
      text: "-1160",
      value: -1160,
      written: "(1,160)",
    });
    expect(numberOf("(2.0)")).toBe(-2);
    expect(readCell("(0)")).toEqual({ kind: "number", text: "0", value: 0, written: "(0)" });
    expect(Object.is(numberOf("(0.0)"), -0)).toBe(false);
    expect(group("(1,160)")).toBe("−1,160");
    expect(difference("(10)", "5")).toBe("-15");
    // Not a plain number in brackets: words as written.
    for (const cell of ["(-3)", "(12.3)x", "(n.m.)", "(1,16)", "()"])
      expect(readCell(cell), cell).toEqual({ kind: "text", text: cell });
  });
  it.each(["n.m.", "n.a.", "NM", "—", "–", "N/A"])(
    "keeps %s as the words written: never a gap, never zero",
    (cell) => {
      expect(readCell(cell)).toEqual({ kind: "text", text: cell });
      expect(numberOf(cell)).toBeNull();
    },
  );
  it("leaves other words as text: percentages with words, empty cells", () => {
    expect(readCell("20.6% reported").kind).toBe("text");
    expect(readCell("").kind).toBe("text");
    expect(numberOf("")).toBeNull();
  });
});

describe("exact arithmetic", () => {
  it("groups digits and uses a true minus, keeping decimals as written", () => {
    expect(group("7940")).toBe("7,940");
    expect(group("-2505")).toBe("−2,505");
    expect(group("6.50")).toBe("6.50");
    expect(group("Not supplied: x")).toBe("Not supplied: x");
  });
  it("adds and subtracts without float error", () => {
    expect(sum(["0.1", "0.2"])).toBe("0.3");
    expect(sum(["2347", "2038"])).toBe("4385");
    expect(sum(["1880", "-4385"])).toBe("-2505");
    expect(difference("24880", "19750")).toBe("5130");
    expect(difference("6.53", "6.27")).toBe("0.26");
  });
  it("refuses a sum or difference that has a gap or words in it", () => {
    expect(sum(["1", "Not supplied: x"])).toBeNull();
    expect(difference("5", "20.6% reported")).toBeNull();
    expect(sum([])).toBeNull();
  });
});

// percentOf is removed (ruling i, 2026-11-24): the leads print no ratio or growth rate the module did not write.

describe("a stated zero and a negative stay values", () => {
  it("reads 0 as the number zero, never a gap, and keeps a minus", () => {
    expect(readCell("0")).toEqual({ kind: "number", text: "0", value: 0 });
    expect(readCell("-2,347")).toEqual({ kind: "number", text: "-2347", value: -2347 });
    expect(difference("0", "0")).toBe("0");
  });
});
