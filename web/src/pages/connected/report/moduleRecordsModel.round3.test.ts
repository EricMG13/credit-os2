import { describe, expect, it } from "vitest";
import { containsReference, type Table } from "../publishedReport";
import { tableWithCellWords } from "./moduleRecordsModel";

const one = (cell: string): Table => ({
  type: "table",
  line: 1,
  headers: ["Item", "Value"],
  rows: [{ line: 3, cells: ["Row", cell] }],
});
const drawn = (cell: string) => tableWithCellWords(one(cell)).rows[0]?.cells[1];

describe("C6-S1: a bracket's other words keep their numbers and marks exactly", () => {
  it.each([
    ["12 (prior year 1,234, annual_report.pdf p. 40)", "12 (prior year 1,234)"],
    ["12 (USD 1,234m; annual_report.pdf p. 40)", "12 (USD 1,234m)"],
    ["12 (restated; IFRS 16, annual_report.pdf p. 40)", "12 (restated; IFRS 16)"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });
});

describe("C6-S2: a locator that continues a dropped reference goes with it", () => {
  it.each([
    ["12 (restated, annual_report.pdf pp. 40-41, 45)", "12 (restated)"],
    ["12 (restated, annual_report.pdf, cl. 12)", "12 (restated)"],
    ["12 (restated, cl. 12, credit_agreement.pdf)", "12 (restated)"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });
});

describe("C6-S3: a figure outside the citation is never lost", () => {
  it.each([
    ["4.5x (restated per credit_agreement.pdf cl. 12)", "4.5x"],
    ["4.5x (credit_agreement.pdf cl. 12(b))", "4.5x"],
    ["4.5x (Annual Report 2025.pdf p. 40)", "4.5x"],
    ["4.5x (investor_deck.pdf slide 3)", "4.5x"],
    ["4.5x (annual_report.pdf pp. 40 - 41)", "4.5x"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });
});

describe("C6-S: what round 1 and 2 drew stays", () => {
  it.each([
    ["Net leverage <= 4.5x (credit_agreement.pdf cl. 12)", "Net leverage <= 4.5x"],
    ["1,234 (restated, annual_report.pdf p. 40)", "1,234 (restated)"],
    ["4.5x (maintenance covenant, credit_agreement.pdf cl. 12)", "4.5x (maintenance covenant)"],
    ["4.5x (restated (IFRS 16), annual_report.pdf p. 40)", "4.5x (restated (IFRS 16))"],
    ["4.5x (restated, see note 5)", "4.5x (restated, see note 5)"],
    ["12 (restated, 2025)", "12 (restated, 2025)"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });

  it.each(["(annual_report.pdf p. 40)", "credit_agreement.pdf, page 12"])(
    "a cell that is only a reference stays a reference: %s",
    (cell) => {
      expect(drawn(cell)).toBe(cell);
      expect(containsReference(drawn(cell) ?? "")).toBe(true);
    },
  );
});
