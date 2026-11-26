import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry, Snapshot, Table } from "./publishedReport";
import { PublishedTable, traceForLine } from "./ReportContent";

const table: Table = {
  type: "table",
  line: 1,
  headers: ["Item", "Note CP-2"],
  rows: [{ line: 2, cells: ["CP-1", "5.2x"] }],
};

it("names the module in an Evidence table too, never its code", () => {
  const { container } = render(<PublishedTable evidence heading="Evidence" table={table} />);
  expect(screen.getByText("Financial foundation")).toBeInTheDocument();
  expect(screen.getByText("Note Fundamental credit")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/CP-\d/);
});

it("names the module in the same table on a findings page", () => {
  render(<PublishedTable heading="Findings" table={table} />);
  expect(screen.getByText("Financial foundation")).toBeInTheDocument();
  expect(screen.getByText("Note Fundamental credit")).toBeInTheDocument();
});

it("keeps a bare module code in the trace drawer statement", () => {
  const entry: OutputEntry = {
    selected: true,
    output: { id: "a", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
    sections: [
      {
        heading: "Findings",
        level: 2,
        line: 1,
        blocks: [{ type: "text", line: 2, end: 2, text: "CP-1 holds the leverage figure." }],
      },
    ],
  };
  const trace = traceForLine({ chips: {} } as Snapshot, entry, 0, 2);
  expect(trace?.statement).toBe("CP-1 holds the leverage figure.");
});
