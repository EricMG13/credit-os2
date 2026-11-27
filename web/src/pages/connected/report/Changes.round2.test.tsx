import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OutputEntry, PublishedChanges, PublishedRun, Snapshot } from "../publishedReport";
import { ComparisonTable, ReportChanges } from "./Changes";

const snapshot = { chips: {} } as unknown as Snapshot;

const change: PublishedChanges = {
  pack: {
    measures: [
      {
        key: "lev",
        label: "Leverage",
        prior: { value: "3", unit: "x", period: "FY2025" },
        current: { value: "4", unit: "x", period: "FY2026" },
        difference: 1,
        unit: "x",
      },
    ],
  },
  verdicts: {
    measures: {
      lev: {
        kind: "comparable",
        label: "Comparable",
        reason: "Per filing.pdf p. 3 the definition is unchanged",
        analysis_change: "Restated in report_2026.xlsx page 9",
      },
    },
  },
};

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

describe("Changes page round 2", () => {
  it("the Evidence caller form (no evidence prop) draws the reference (C2-R1)", () => {
    render(
      <ComparisonTable
        rows={[
          [
            "Leverage",
            "3x",
            "4x",
            "+1x",
            "Per filing.pdf p. 3 the definition is unchanged",
            "Unchanged",
          ],
        ]}
      />,
    );
    expect(screen.getByRole("table").textContent).toContain("filing.pdf");
  });

  it("the Changes Measures table draws no reference and one trace control per row (C2-R5)", () => {
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
    expect(table.textContent).not.toMatch(/filing\.pdf|report_2026|p\. 3|page 9/);
    expect(table.textContent).not.toContain("Source reference unavailable");
    const body = within(table).getAllByRole("row").slice(1);
    expect(body).toHaveLength(1);
    expect(within(body[0] as HTMLElement).getAllByRole("link")).toHaveLength(1);
    expect(
      within(body[0] as HTMLElement).getByRole("link", { name: "Comparison row" }),
    ).toBeTruthy();
  });
});
