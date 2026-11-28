import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RunContext } from "../library/parts/RunContext";
import type { Block, OutputEntry, Snapshot, Table } from "./publishedReport";
import { FindingParagraph, PublishedTable, traceForLine } from "./ReportContent";

const table: Table = {
  type: "table",
  line: 1,
  headers: ["Item", "Note CP-L10"],
  rows: [{ line: 2, cells: ["CP-L10", "5.2x"] }],
};
const block: Extract<Block, { type: "text" }> = {
  type: "text",
  line: 4,
  end: 4,
  text: "CP-L10 holds the leverage figure.",
};

const entry: OutputEntry = {
  selected: true,
  output: { id: "a", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
  sections: [{ heading: "Findings", level: 2, line: 3, blocks: [block] }],
};
const trace = traceForLine({ chips: {} } as Snapshot, entry, 0, 4);
if (!trace) throw new Error("fixture has no trace");

it("names CP-L10 by the credit screening pathway's own name in a finding paragraph", () => {
  render(
    <RunContext.Provider value={{ traces: { k: trace }, open: () => {} }}>
      <FindingParagraph block={block} href="#e" trace="k" pathway="credit_screening" />
    </RunContext.Provider>,
  );
  expect(screen.getByText("Credit screening holds the leverage figure.")).toBeInTheDocument();
});

it("names CP-L10 by the credit screening pathway's own name in a table", () => {
  render(<PublishedTable heading="Findings" table={table} pathway="credit_screening" />);
  expect(screen.getByText("Credit screening")).toBeInTheDocument();
  expect(screen.getByText("Note Credit screening")).toBeInTheDocument();
  expect(screen.queryByText("Short credit snapshot")).toBeNull();
});
