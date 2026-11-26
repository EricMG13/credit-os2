import { cleanup, render, within } from "@testing-library/react";
import type { Trace } from "@/pages/library/slice";
import type { ReactNode } from "react";
import { afterEach, expect, it } from "vitest";
import { RunContext } from "@/pages/library/parts/RunContext";
import { ReportFindings } from "../ReportContent";
import type { OutputEntry, PublishedRun, Section, Snapshot, Table } from "../publishedReport";
import { traceKey } from "../reportView";
import { PassageBody } from "./changes/PassageTile";
import { ModuleFindings } from "./ModuleFrame";

afterEach(cleanup);

const UNIT_TABLE: Table = {
  type: "table",
  line: 7,
  headers: ["Measure", "Amount", "Unit", "Basis"],
  rows: [
    { line: 9, cells: ["Cash", "1,200", "USD millions", "Reported"] },
    { line: 10, cells: ["Revolver available", "800", "USD millions", "Reported"] },
  ],
};
const PARAGRAPH = {
  type: "text",
  line: 5,
  end: 5,
  text: "Liquidity covers maturities through 2027.\nBasis: Original filing, page 1.",
} as const;
const entryOf = (sections: Section[]): OutputEntry => ({
  output: { id: "run/CP-2.md", sha256: "a".repeat(64), module: "CP-2", href: "", label: "" },
  selected: true,
  sections,
});

function Frame({ children }: { children: ReactNode }) {
  return (
    <RunContext.Provider value={{ traces: TRACES, open: () => undefined }}>
      {children}
    </RunContext.Provider>
  );
}

/** A trace entry for each table row: the drawer is never opened, only its control is drawn. */
const TRACES = Object.fromEntries(
  UNIT_TABLE.rows.map(({ line }) => [traceKey(entryOf([]), line), {} as Trace]),
);

/** The text of every body cell the render drew, in order. */
function bodyCells() {
  return Array.from(document.querySelectorAll("tbody td")).map((cell) => cell.textContent);
}
function expectSymbolUnits(cells: (string | null)[]) {
  expect(cells.filter((text) => text === "$m")).toHaveLength(2);
  expect(cells).not.toContain("USD millions");
  expect(cells).not.toContain("US$m");
}

it("a finding section's table (ReportContent) draws a USD millions Unit cell as $m", () => {
  const entry = entryOf([
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    { heading: "Key findings", level: 3, line: 4, blocks: [PARAGRAPH, UNIT_TABLE] },
  ]);
  const run = { folder: "run", evidence: { handoffs: [] } } as unknown as PublishedRun;
  render(
    <Frame>
      <ReportFindings
        snapshot={{ chips: {} } as unknown as Snapshot}
        run={run}
        entry={entry}
        entryIndex={0}
        overview
      />
    </Frame>,
  );
  expectSymbolUnits(bodyCells());
});

it("a Key findings table (ModuleFrame) draws a USD millions Unit cell as $m", () => {
  const section: Section = {
    heading: "Key findings",
    level: 3,
    line: 4,
    blocks: [UNIT_TABLE],
  };
  render(
    <Frame>
      <ModuleFindings
        keyFindings={section}
        hollow={{}}
        missing={[]}
        entry={entryOf([section])}
        folder="run"
      />
    </Frame>,
  );
  expectSymbolUnits(bodyCells());
});

it("a Changes passage table (PassageTile) draws a USD millions Unit cell as $m", () => {
  const { container } = render(
    <Frame>
      <PassageBody
        items={[{ kind: "table", table: UNIT_TABLE }]}
        noun="passage"
        entry={entryOf([])}
        folder="run"
      />
    </Frame>,
  );
  expectSymbolUnits(
    within(container)
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  );
});
