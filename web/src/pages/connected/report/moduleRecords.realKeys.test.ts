import { describe, expect, it } from "vitest";
import type { OutputEntry, Section } from "../publishedReport";
import { moduleRecords, readableTitle } from "./moduleRecordsModel";

const table = (heading: string, line: number, level = 3): Section => ({
  heading,
  level,
  line,
  blocks: [
    {
      type: "table",
      headers: ["question_id", "evidence_ids", "disposition"],
      line: line + 2,
      rows: [{ line: line + 4, cells: ["competition; regulation", "E1; E2", "QUALIFIED"] }],
    },
  ],
});

function entry(module: string, sections: Section[]): OutputEntry {
  return {
    selected: true,
    output: { id: "a", module, label: "a", href: "", sha256: "a".repeat(64) },
    sections: [{ heading: "Findings", level: 2, line: 1, blocks: [] }, ...sections],
  };
}

describe("machine-keyed registers of real handoffs", () => {
  it("holds cp2.* and cpdr.* keyed tables in Evidence under plain words (CP-2)", () => {
    const { tables, evidence } = moduleRecords(
      entry("CP-2", [table("cp2.cp_model_strengths_weaknesses", 10), table("cpdr.adoptions", 20)]),
    );
    expect(tables).toEqual([]);
    expect(evidence.map(({ title }) => title)).toEqual([
      "Fundamental credit model strengths weaknesses",
      "Research questions adoptions",
    ]);
  });

  it("holds the cp1_references register after the appendix heading (CP-2A)", () => {
    const { tables, evidence } = moduleRecords(
      entry("CP-2A", [
        {
          heading: "Analytical appendix — complete canonical registers",
          level: 3,
          line: 5,
          blocks: [],
        },
        table("cp1_references", 10),
      ]),
    );
    expect(tables).toEqual([]);
    expect(evidence.map(({ title }) => title)).toEqual(["Financial foundation references"]);
  });

  it("never reads a module code in a heading", () => {
    expect(readableTitle("cp2.cp_model_strengths_weaknesses")).not.toMatch(/cp2/i);
    expect(readableTitle("cpdr.adoptions")).toBe("Research questions adoptions");
    expect(readableTitle("cp1_references")).toBe("Financial foundation references");
  });
});
