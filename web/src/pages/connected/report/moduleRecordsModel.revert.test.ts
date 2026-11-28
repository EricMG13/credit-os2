import { describe, expect, it } from "vitest";
import type { Table } from "../publishedReport";
import { tableWithCellWords } from "./moduleRecordsModel";

const one = (cell: string): Table => ({
  type: "table",
  line: 1,
  headers: ["Item", "Value"],
  rows: [{ line: 3, cells: ["Row", cell] }],
});
const drawn = (cell: string) => tableWithCellWords(one(cell)).rows[0]?.cells[1];

describe("revert T1: only a plain integer or range after a page/clause locator continues it", () => {
  it.each([
    ["12 (annual_report.pdf p. 40, 2025)", "12 (2025)"],
    ["12 (restated; credit_agreement.pdf cl. 12; 4.5x)", "12 (restated; 4.5x)"],
    ["12 (annual_report.pdf p. 40, 12.5)", "12 (12.5)"],
    ["12 (annual_report.pdf p. 40, 3Q25)", "12 (3Q25)"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });
});

describe("revert T4: a label that looks like a page prefix is a label", () => {
  it.each([
    ["12 (P50, annual_report.pdf p. 40)", "12 (P50)"],
    ["12 (S1, annual_report.pdf p. 40)", "12 (S1)"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });
});

describe("revert T2/T3: brackets stay balanced", () => {
  it.each([
    ["12 (restated (IFRS 16, note 5), annual_report.pdf p. 40)", "12 (restated (IFRS 16, note 5))"],
    ["4.5x (restated (credit_agreement.pdf cl. 12))", "4.5x (restated)"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });

  it("a cell that cannot be built exactly stays as written, as BASE drew it", () => {
    const cell = "12 (restated (annual_report.pdf p. 40";
    expect(drawn(cell)).toBe(cell);
  });
});

describe("revert T5: a citing part that holds a figure is never dropped", () => {
  it.each([
    "Maturity 2029 (extended to 2031 per credit_agreement.pdf cl. 2.1)",
    "Term Loan B (EUR 450m per credit_agreement.pdf cl. 2.1)",
  ])("%s stays as written (BASE drew the In Evidence link)", (cell) => {
    expect(drawn(cell)).toBe(cell);
  });

  it("a comma without a space still splits the part", () => {
    expect(drawn("12 (restated,annual_report.pdf p. 40)")).toBe("12 (restated)");
  });

  it("a part of words only is still dropped", () => {
    expect(drawn("4.5x (restated per credit_agreement.pdf cl. 12)")).toBe("4.5x");
  });
});
