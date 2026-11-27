import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RunContext } from "@/pages/library/parts/RunContext";
import type { OutputEntry, Section, Snapshot, Table } from "../publishedReport";
import { sectionTraces } from "../ReportContent";
import { ModuleRecords } from "./ModuleRecords";

afterEach(cleanup);

const table = (line: number, headers: string[], rows: string[][]): Table => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const section = (heading: string, level: number, line: number, blocks: Section["blocks"] = []) => ({
  heading,
  level,
  line,
  blocks,
});

function draw(sections: Section[], pathway?: string) {
  const entry: OutputEntry = {
    selected: true,
    output: { id: "a", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
    sections,
  };
  const traces = sectionTraces({ chips: {} } as Snapshot, entry, entry.sections);
  render(
    <RunContext.Provider value={{ traces, open: vi.fn() }}>
      <ModuleRecords run={{ folder: "r", pathway }} entry={entry} />
    </RunContext.Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
}

it.each([
  ["4.5x (restated per credit_agreement.pdf cl. 12)", "4.5x"],
  ["12 (prior year 1,234, annual_report.pdf p. 40)", "12 (prior year 1,234)"],
  ["12 (restated, annual_report.pdf pp. 40-41, 45)", "12 (restated)"],
])("C6-S: %s draws its figure and no reference", (cell, words) => {
  draw([
    section("Findings", 2, 1),
    section("T4.9 Covenant tests", 3, 10, [
      table(
        11,
        ["Covenant", "Terms"],
        [
          ["Leverage", cell],
          ["Cover", "Net leverage <= 4.5x (credit_agreement.pdf cl. 12)"],
        ],
      ),
    ]),
  ]);
  expect(screen.getByText(words)).toBeInTheDocument();
  expect(screen.queryByText(/\.pdf|cl\. 12|pp?\. 4/)).toBeNull();
  expect(screen.queryByRole("link", { name: "In Evidence" })).toBeNull();
});
