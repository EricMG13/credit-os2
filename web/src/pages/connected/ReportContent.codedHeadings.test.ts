import { expect, it } from "vitest";
import type { OutputEntry, Section } from "./publishedReport";
import { findingBlocks, recordSections } from "./ReportContent";

const withTable = (heading: string, line: number): Section => ({
  heading,
  level: 3,
  line,
  blocks: [
    {
      type: "table",
      headers: ["Item", "Value"],
      line: line + 1,
      rows: [{ line: line + 2, cells: ["Row", "1"] }],
    },
  ],
});
const entryOf = (sections: Section[]): OutputEntry => ({
  selected: true,
  output: { id: "a", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
  sections: [{ heading: "Findings", level: 2, line: 1, blocks: [] }, ...sections],
});

it("draws a finding named like a code word, and holds a plainly coded register", () => {
  const entry = entryOf([
    withTable("T2 Heathrow", 10),
    withTable("P2 Priority creditors", 20),
    withTable("T2E.3 — Liquidity", 30),
    withTable("T4.18 Covenants", 40),
    withTable("T1 - Leverage", 50),
  ]);
  expect(recordSections(entry.sections, entry).map((s) => s.heading)).toEqual([
    "T2E.3 — Liquidity",
    "T4.18 Covenants",
    "T1 - Leverage",
  ]);
  expect(findingBlocks(entry.sections, entry).map((s) => s.heading)).toEqual([
    "T2 Heathrow",
    "P2 Priority creditors",
  ]);
});

it("draws the tables of a digit-less heading such as a ratio, loan or case name", () => {
  const headings = [
    "PD: Base case",
    "TLB - Terms",
    "PIK: Toggle",
    "TTM - Summary",
    "PPE: Capex",
    "PV: Bridge",
  ];
  const entry = entryOf(headings.map((heading, index) => withTable(heading, 10 + index * 10)));
  expect(recordSections(entry.sections, entry)).toEqual([]);
  expect(findingBlocks(entry.sections, entry).map((s) => s.heading)).toEqual(headings);
});
