import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublishedChanges, PublishedRun, Snapshot } from "../publishedReport";
import { ReportChanges } from "./Changes";

const snapshot = { chips: {} } as unknown as Snapshot;

describe("Changes page round 1", () => {
  it("draws no file name or page in the Measures table view (C2-1)", () => {
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
    render(
      <ReportChanges
        snapshot={snapshot}
        run={{ folder: "current" } as PublishedRun}
        entries={[]}
        change={change}
      />,
    );
    const region = screen.getByRole("region", { name: "Measures that moved" });
    fireEvent.click(within(region).getByRole("button", { name: "Table" }));
    const table = within(region).getByRole("table");
    expect(table.textContent).not.toMatch(/filing\.pdf|report_2026|p\. 3|page 9/);
  });
});
