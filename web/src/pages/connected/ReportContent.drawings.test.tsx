import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot } from "./publishedReport";
import type { buildReportView } from "./reportView";
import { findingBlocks } from "./ReportContent";
import { Modules } from "./report/Modules";

type View = ReturnType<typeof buildReportView>;
const FINDINGS: Section = { heading: "Findings", level: 2, line: 1, blocks: [] };
const drawing = (heading: string, line: number, texts: string[]): Section => ({
  heading,
  level: 3,
  line,
  blocks: [
    {
      type: "table",
      headers: ["Period", "Value"],
      line: line + 1,
      rows: [{ line: line + 2, cells: ["FY2026", "4.2"] }],
    },
    ...texts.map((text, at) => ({
      type: "text" as const,
      line: line + 4 + at * 2,
      end: line + 4 + at * 2,
      text,
    })),
  ],
});
function entryOf(
  module: string,
  sections: Section[],
  output: Partial<OutputEntry["output"]>,
): OutputEntry {
  return {
    selected: true,
    output: { id: "a", module, label: "a", href: "", sha256: "a".repeat(64), ...output },
    sections: [FINDINGS, ...sections],
  };
}
function page(entry: OutputEntry) {
  const view: View = {
    entries: [entry],
    modules: [{ id: entry.output.module, name: "Module", state: "Delivered", outputs: [entry] }],
    catalogue: undefined,
    lead: undefined,
    models: [],
  };
  const run = { folder: "retained case", issuer: "Issuer", asOf: "2026-10-31" } as PublishedRun;
  return render(
    <Modules
      snapshot={{ chips: {} } as Snapshot}
      run={run}
      view={view}
      module={entry.output.module}
    />,
  );
}

/** The chart descriptors' tables, with their qualification text, are in the closed records region. */
function openChartTables() {
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
}

describe("drawing sections leave no handoff scaffolding", () => {
  it("drops a chart section holding only the table and No qualification.", () => {
    const entry = entryOf(
      "CP-1",
      [drawing("Chart data: EBITDA bridge", 10, ["No qualification."])],
      {
        charts: [{ title: "EBITDA bridge", table: 11, unit: "x", columns: [1] }],
      },
    );
    expect(findingBlocks(entry.sections, entry).map((s) => s.heading)).not.toContain(
      "Chart data: EBITDA bridge",
    );
  });

  it("draws a chart qualification once, with its table in the records, and no Chart data heading", () => {
    const entry = entryOf("CP-1", [drawing("Chart data: leverage", 20, ["Q-TEXT"])], {
      charts: [{ title: "Leverage", table: 21, unit: "x", columns: [1] }],
    });
    page(entry);
    expect(screen.queryByText("Q-TEXT")).toBeNull();
    openChartTables();
    expect(screen.getAllByText("Q-TEXT")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Leverage", level: 4 })).toBeInTheDocument();
    expect(screen.queryByText(/Chart data:/)).toBeNull();
  });

  it("keeps text no chart draws, under a heading without the prefix", () => {
    const entry = entryOf("CP-1", [drawing("Events: calendar", 30, ["ORPHAN-TEXT"])], {
      events: [{ title: "Calendar", table: 31 }],
    });
    page(entry);
    openChartTables();
    expect(screen.getAllByText("ORPHAN-TEXT")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Calendar", level: 4 })).toBeInTheDocument();
    expect(screen.queryByText(/Events:/)).toBeNull();
  });

  it("keeps a qualification the chart does not draw when its section has two tables", () => {
    const entry = entryOf(
      "CP-1",
      [
        {
          ...drawing("Chart data: pair", 40, ["AMBIGUOUS-TEXT"]),
          blocks: [
            ...drawing("Chart data: pair", 40, ["AMBIGUOUS-TEXT"]).blocks,
            {
              type: "table",
              headers: ["Period", "Value"],
              line: 50,
              rows: [{ line: 51, cells: ["FY2026", "1"] }],
            },
          ],
        },
      ],
      { charts: [{ title: "Pair", table: 41, unit: "x", columns: [1] }] },
    );
    page(entry);
    openChartTables();
    expect(screen.getAllByText("AMBIGUOUS-TEXT")).toHaveLength(1);
  });

  it("keeps a qualification under a chart gap, which draws none", () => {
    const entry = entryOf("CP-1", [drawing("Chart data: gapped", 60, ["GAP-SIDE-TEXT"])], {
      chartGaps: [{ title: "Gapped", table: 61, gap: "no data" }],
    });
    page(entry);
    openChartTables();
    expect(screen.getAllByText("GAP-SIDE-TEXT")).toHaveLength(1);
  });

  it("draws a chartGaps descriptor with no gap reason once, like a chart", () => {
    const entry = entryOf("CP-1", [drawing("Chart data: nogap", 80, ["EMPTY-GAP-TEXT"])], {
      chartGaps: [{ title: "No reason", table: 81, unit: "x", columns: [1], gap: "" }],
    });
    page(entry);
    openChartTables();
    expect(screen.getAllByText("EMPTY-GAP-TEXT")).toHaveLength(1);
  });

  it("names another module in a qualification instead of drawing its code", () => {
    const text = "Cover is shown before the Fundamental credit adjustment CROSS-TEXT.";
    const entry = entryOf(
      "CP-1",
      [drawing("Chart data: cross", 70, [text.replace("Fundamental credit", "CP-2")])],
      {
        charts: [{ title: "Cross", table: 71, unit: "x", columns: [1] }],
      },
    );
    page(entry);
    openChartTables();
    expect(screen.getAllByText(text)).toHaveLength(1);
  });
});
