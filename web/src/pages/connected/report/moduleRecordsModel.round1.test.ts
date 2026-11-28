import { describe, expect, it } from "vitest";
import type { OutputEntry, Section, Table } from "../publishedReport";
import {
  moduleRecords,
  proseWithoutMachinery,
  readableTitle,
  scaleNote,
} from "./moduleRecordsModel";

const table = (line: number, headers: string[], rows: string[][]): Table => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const section = (heading: string, line: number, blocks: Section["blocks"]): Section => ({
  heading,
  level: heading === "Findings" ? 2 : 3,
  line,
  blocks,
});

describe("C6-1: the run's pathway names a module wherever the model draws one", () => {
  it("names CP-L10 as the credit screening pathway does in prose", () => {
    expect(proseWithoutMachinery("CP-L10 found no gap.", "credit_screening")).toBe(
      "Credit screening found no gap.",
    );
    expect(proseWithoutMachinery("CP-L10 found no gap.")).toBe(
      "Short credit snapshot found no gap.",
    );
  });

  it("names it in a heading", () => {
    expect(readableTitle("CP-L10 notes", "Untitled table", "credit_screening")).toBe(
      "Credit screening notes",
    );
    expect(readableTitle("CP-L10 notes")).toBe("Short credit snapshot notes");
  });

  it("names it in the records' titles and the scale note", () => {
    const entry = {
      selected: true,
      output: { id: "a", module: "CP-L10", label: "a", href: "", sha256: "a".repeat(64) },
      sections: [
        section("Findings", 1, []),
        section("T4.5 CP-L10 notes", 5, [table(7, ["Item", "Note"], [["a", "b"]])]),
      ],
    } as OutputEntry;
    expect(moduleRecords(entry, "credit_screening").tables.map(({ title }) => title)).toEqual([
      "Credit screening notes",
    ]);
    const bars = table(
      1,
      ["Instrument", "Principal"],
      [
        ["Loan A", "100"],
        ["Loan B", "200"],
        ["Total CP-L10", "300"],
      ],
    );
    expect(scaleNote(bars, "", "credit_screening")).toContain("Total Credit screening");
  });
});

describe("C6-2: a heading's reference goes before its ids are worded", () => {
  it.each([
    ["Maturities, credit_agreement.pdf", "Maturities"],
    ["Cash flow bridge q3_2025_results.pdf", "Cash flow bridge"],
    ["transaction_summary", "Transaction summary"],
  ])("%s", (heading, drawn) => {
    expect(readableTitle(heading)).toBe(drawn);
  });
});

describe("C6-4: a cut that leaves a dangling copula is broken", () => {
  it.each([
    "The figure is in T4.18.",
    "Not supplied; the figure is in T4.18, which is withheld.",
    "The notes are in T4.18.",
    "Rows were in T4.18.",
  ])("%s", (text) => {
    expect(proseWithoutMachinery(text)).toBe("");
  });

  it("keeps a clean cut", () => {
    expect(proseWithoutMachinery("Net leverage is 4.2x, drawn from T4.18 rows only.")).toBe(
      "Net leverage is 4.2x, drawn from rows only.",
    );
  });
});
