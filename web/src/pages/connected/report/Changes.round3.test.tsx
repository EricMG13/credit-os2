import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OutputEntry, PublishedChanges, PublishedRun, Snapshot } from "../publishedReport";
import { ComparisonTable, ReportChanges } from "./Changes";

const snapshot = { chips: {} } as unknown as Snapshot;
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
          rows: [{ line: 12, cells: ["Leverage", "3x", "4x", "Higher debt", "Weaker"] }],
        },
      ],
    },
  ],
};
const lev = (
  current: string,
  period: string,
  difference: number,
  reason: string,
  analysis: string,
): PublishedChanges => ({
  pack: {
    measures: [
      {
        key: "lev",
        label: "Leverage",
        prior: { value: "3", unit: "x", period: "FY2025" },
        current: { value: current, unit: "x", period },
        difference,
        unit: "x",
      },
    ],
  },
  verdicts: {
    measures: {
      lev: { kind: "comparable", label: "Comparable", reason, analysis_change: analysis },
    },
  },
});

function tableRow(change: PublishedChanges) {
  render(
    <ReportChanges
      snapshot={snapshot}
      run={{ folder: "current" } as PublishedRun}
      entries={[entry]}
      change={change}
    />,
  );
  const region = screen.getByRole("region", { name: "Measures that moved" });
  fireEvent.click(within(region).getByRole("button", { name: "Table" }));
  const table = within(region).getByRole("table");
  const body = within(table).getAllByRole("row").slice(1);
  expect(body).toHaveLength(1);
  const row = body[0] as HTMLElement;
  return {
    table,
    row,
    cells: within(row)
      .getAllByRole("cell")
      .map((c) => c.textContent),
  };
}

describe("Changes table round 3", () => {
  it("a one-sentence cited reason and analysis change point to Evidence, never blank (C2-S1)", () => {
    const { table, row, cells } = tableRow(
      lev(
        "4",
        "FY2026",
        1,
        "Per filing.pdf p. 3 the definition is unchanged",
        "Restated in report_2026.xlsx page 9",
      ),
    );
    expect(cells.slice(0, 6)).toEqual([
      "Leverage",
      "3x (FY2025)",
      "4x (FY2026)",
      "+1x",
      "See comparison evidence.",
      "See comparison evidence.",
    ]);
    expect(within(table).queryByLabelText("Left blank")).toBeNull();
    expect(table.textContent).not.toMatch(
      /filing\.pdf|report_2026|p\. 3|page 9|Source reference unavailable/,
    );
    expect(within(row).getAllByRole("link")).toHaveLength(1);
  });

  it("a same-period revision keeps its marker when its reason cites (C2-S2)", () => {
    const { table, row, cells } = tableRow(
      lev("3.5", "FY2025", 0.5, "Per filing.pdf p. 3 the definition is unchanged", ""),
    );
    expect(cells.slice(0, 6)).toEqual([
      "Leverage",
      "3x (FY2025)",
      "3.5x (FY2025)",
      "—",
      "See comparison evidence. · Same-period analysis change",
      "—",
    ]);
    expect(table.textContent).not.toMatch(/filing\.pdf|p\. 3|Source reference unavailable/);
    expect(within(row).getAllByRole("link")).toHaveLength(1);
  });

  it("figure and label cells keep their figures; prose keeps its uncited sentences (C2-S1)", () => {
    render(
      <ComparisonTable
        evidence={false}
        source={() => "#row"}
        rows={[
          [
            "Net debt (CP-1C T4.10)",
            "1.2x (p. 3)",
            "∅ G12 n.m.",
            "—",
            "Restated per note 4: 3.1x",
            "Restated per note 4: 3.1x. Per filing.pdf p. 3 the definition is unchanged",
          ],
          [
            "Restated per note 4: 3.1x",
            "3.1x per filing.pdf",
            "2.0x (FY2025)",
            "+0.5x",
            "Per filing.pdf p. 3 the definition is unchanged · Same-period analysis change",
            "",
          ],
        ]}
      />,
    );
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    const text = rows.map((r) =>
      within(r)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    );
    expect(text[0]?.slice(0, 6)).toEqual([
      "Net debt",
      "1.2x",
      "∅ n.m.",
      "—",
      "Restated per note 4: 3.1x",
      "Restated per note 4: 3.1x.",
    ]);
    expect(text[1]?.slice(0, 6)).toEqual([
      "Restated per note 4: 3.1x",
      "3.1x",
      "2.0x (FY2025)",
      "+0.5x",
      "See comparison evidence. · Same-period analysis change",
      "—",
    ]);
    for (const r of rows) expect(within(r).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("table").textContent).not.toContain("Source reference unavailable");
  });
});
