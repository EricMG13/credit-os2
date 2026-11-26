import { describe, expect, it } from "vitest";
import { traceDetails } from "./ReportContent";
import type { OutputEntry, Section, Snapshot } from "./publishedReport";

// E2 (validation of TDG run 20261125-162721-01): the Basis line written once after a list of
// limitations (CP-2D handoff lines 61-65, verbatim) applies to the list; only the last bullet's
// drawer showed it, the others said "Basis was not recorded for this item".
const BULLETS = [
  "- The operating inflow, working-capital outflow and cash taxes in the bridge are FY2024 actuals held flat, because no FY2025 revenue, EBITDA or tax guidance is supplied; the ending liquidity of USD 3,550.1 million is therefore an analyst estimate whose size, not its sign, would change with actual FY2025 trading.",
  "- The bridge is annual and does not model intra-year timing of semi-annual note coupons or seasonal working capital, so the true intra-year trough after October 2024 may sit below the post-dividend USD 2,919 million level; the runway figure cannot locate it.",
  "- Revolver access is counted in full on the issuer's disclosed availability, but the credit agreement is not supplied, so whether letters of credit count toward the USD 364 million springing threshold and how net debt is defined are not established; this could reduce the drawable amount before the 7.50x test applies and would weaken, not reverse, the adequate rating.",
  "- The two figures for the October payment (USD 4,348 million and USD 4,396 million for the quarter, and dividend equivalents of USD 132 million against USD 131 million) are not reconciled; using the higher quarterly figure would lower ending liquidity by USD 48 million, which does not change the risk level.",
];
const BASIS =
  "Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–65; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 4, 44; calculation L15";
const EXPECTED =
  "TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–65; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 4, 44; calculation L15";

const snapshot = { chips: {} } as unknown as Snapshot;
const entry = {
  output: { id: "run/CP-2D.md" },
  sections: [],
  selected: true,
} as unknown as OutputEntry;

function limitations(): Section {
  const last = BULLETS.length - 1;
  return {
    heading: "Limitations",
    level: 3,
    line: 59,
    blocks: BULLETS.map((text, index) => ({
      type: "text" as const,
      line: 61 + index,
      end: 61 + index + (index === last ? 1 : 0),
      text: index === last ? `${text}\n${BASIS}` : text,
    })),
  };
}

describe("a Basis line written after a list of items", () => {
  it("is the Basis of every item of the list, not only the last", () => {
    const section = limitations();
    for (const block of section.blocks) {
      expect(traceDetails(snapshot, entry, section, block, block.line).basis).toBe(EXPECTED);
    }
  });

  it("does not reach across a blank line into another list", () => {
    const section = limitations();
    const first = section.blocks[0];
    if (first?.type !== "text") throw new Error("fixture");
    const apart = {
      ...section,
      blocks: [
        first,
        { ...first, line: 70, end: 70, text: "- A later item." },
        ...section.blocks
          .slice(1)
          .map((b) => ({ ...b, line: b.line + 20, end: "end" in b ? b.end + 20 : 0 })),
      ],
    };
    expect(traceDetails(snapshot, entry, apart, first, first.line).basis).toBeNull();
  });
});
