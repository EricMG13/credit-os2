import { describe, expect, it } from "vitest";
import type { OutputEntry, PublishedChanges } from "../../publishedReport";
import { classifyMeasures } from "./model";

const entry: OutputEntry = {
  selected: true,
  output: { id: "a", module: "CP-8", label: "a", href: "", sha256: "a".repeat(64) },
  sections: [
    {
      heading: "What changed: the issuer",
      level: 3,
      line: 10,
      blocks: [
        {
          type: "table",
          headers: ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
          line: 11,
          rows: [
            {
              line: 12,
              cells: ["Leverage", "3x", "4x", "Correction", "Same definition: leverage restated"],
            },
            { line: 13, cells: ["Cover", "1x", "2x", "Reworked in CP-L10", "—"] },
          ],
        },
      ],
    },
  ],
};
const side = (value: string, period: string) => ({ value, unit: "x", period });
const change: PublishedChanges = {
  pack: {
    measures: [
      {
        key: "lev",
        label: "Leverage",
        prior: side("3", "FY2025"),
        current: side("4", "FY2026"),
        difference: 1,
        unit: "x",
      },
      {
        key: "cov",
        label: "Cover",
        prior: side("1", "FY2025"),
        current: side("2", "FY2026"),
        difference: 1,
        unit: "x",
      },
    ],
  },
  verdicts: {
    measures: {
      lev: { kind: "comparable", label: "L", reason: "Why", analysis_change: "Correction" },
      cov: { kind: "comparable", label: "L", reason: "Why" },
    },
  },
};

describe("classifyMeasures round 1", () => {
  it("takes the effect from the issuer row, not the verdict's analysis change (C2-2)", () => {
    const [lev] = classifyMeasures(change, () => undefined, entry, "cur").moved;
    expect(lev?.cause).toEqual({ kind: "written", text: "Correction" });
    expect(lev?.effect).toEqual({ kind: "written", text: "Same definition: leverage restated" });
  });

  it("uses the analysis change as the effect only when no issuer row exists (C2-2)", () => {
    const noRow: OutputEntry = { ...entry, sections: [] };
    const [lev] = classifyMeasures(change, () => undefined, noRow, "cur").moved;
    expect(lev?.effect).toEqual({ kind: "written", text: "Correction" });
  });

  it("names a module by the run's pathway (C2-4)", () => {
    const moved = classifyMeasures(change, () => undefined, entry, "cur", "credit_screening").moved;
    expect(moved[1]?.cause).toEqual({ kind: "written", text: "Reworked in Credit screening" });
  });
});
