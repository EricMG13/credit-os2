import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PublishedTable } from "./ReportContent";

afterEach(cleanup);

// Verbatim from the replayed TDG CP-3D yield table (row TransDigm K): the cell holds the module's
// limitation and, at its end, a file reference.
const LIMITATION =
  "Source-reported mid YTM only; assigned date. Sheet margin and size conflict with year-end K terms; no curve inference. Source: TDG market quotes 2024-09-30.md, page 1.";
const table = {
  type: "table" as const,
  line: 40,
  headers: ["Instrument", "Maturity date", "Yield", "Basis and limitation"],
  rows: [{ line: 45, cells: ["TransDigm K / BL522943 Corp", "2030-03-22", "5.9", LIMITATION] }],
};

it("keeps a cell's limitation and makes only its reference the Evidence link", () => {
  render(<PublishedTable table={table} href="#evidence/x" rowHref={() => "#evidence/x-45"} />);
  const row = screen.getByRole("row", { name: /TransDigm K/ });
  expect(row).toHaveTextContent("Source-reported mid YTM only; assigned date.");
  expect(row).toHaveTextContent(
    "Sheet margin and size conflict with year-end K terms; no curve inference.",
  );
  expect(row.textContent).not.toContain("TDG market quotes");
  expect(within(row).getByRole("link", { name: "In Evidence" })).toBeInTheDocument();
});

it("still draws only the link for a cell that is a reference alone", () => {
  const bare = {
    ...table,
    rows: [
      {
        line: 45,
        cells: ["K", "2030-03-22", "5.9", "TDG market quotes 2024-09-30.md, page 1"],
      },
    ],
  };
  render(<PublishedTable table={bare} href="#evidence/x" rowHref={() => "#evidence/x-45"} />);
  const row = screen.getByRole("row", { name: /K/ });
  expect(within(row).getByRole("link", { name: "In Evidence" })).toBeInTheDocument();
  expect(row.textContent).not.toContain("TDG market quotes");
});
