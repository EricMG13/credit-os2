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

describe("C6-R5: a cell loses its reference, not the other words in its bracket", () => {
  it.each([
    ["1,234 (restated, annual_report.pdf p. 40)", "1,234 (restated)"],
    ["4.5x (maintenance covenant, credit_agreement.pdf cl. 12)", "4.5x (maintenance covenant)"],
    ["4.5x (credit_agreement.pdf cl. 12, maintenance covenant)", "4.5x (maintenance covenant)"],
    ["Net leverage <= 4.5x (credit_agreement.pdf cl. 12)", "Net leverage <= 4.5x"],
    ["Net leverage <= 4.5x (see credit_agreement.pdf p. 12)", "Net leverage <= 4.5x"],
  ])("%s", (cell, expected) => {
    expect(drawn(cell)).toBe(expected);
  });

  it("leaves a cell as written where the reference is mixed into other words", () => {
    const cell = "4.5x (restated per credit_agreement.pdf cl. 12)";
    expect(drawn(cell)).toBe("4.5x");
  });
});
