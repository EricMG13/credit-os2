import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

const TERMS = "Net leverage <= 4.5x (credit_agreement.pdf cl. 12)";

it("C6-3: a column whose cells carry words with a reference keeps its words", () => {
  draw([
    section("Findings", 2, 1),
    section("T4.9 Covenant tests", 3, 10, [
      table(
        11,
        ["Covenant", "Terms"],
        [
          ["Leverage", TERMS],
          ["Cover", TERMS],
        ],
      ),
    ]),
  ]);
  expect(screen.getAllByText("Net leverage <= 4.5x")).toHaveLength(2);
  expect(screen.queryByText("Terms: in Evidence, by row.")).toBeNull();
  expect(screen.queryByText(/credit_agreement/)).toBeNull();
});

it("C6-3: a column of pure references is still left out and stated once", () => {
  draw([
    section("Findings", 2, 1),
    section("T4.9 Covenant tests", 3, 10, [
      table(
        11,
        ["Covenant", "Terms"],
        [
          ["Leverage", "credit_agreement.pdf, page 12"],
          ["Cover", "credit_agreement.pdf, page 14"],
        ],
      ),
    ]),
  ]);
  expect(screen.getByText("Terms: in Evidence, by row.")).toBeInTheDocument();
});

it("C6-1: a table's scale note names a module as the run's pathway does", () => {
  draw(
    [
      section("Findings", 2, 1),
      section("T4.9 Loans", 3, 10, [
        table(
          11,
          ["Instrument", "Principal"],
          [
            ["Loan A", "100"],
            ["Loan B", "200"],
            ["Total CP-L10", "300"],
          ],
        ),
      ]),
    ],
    "credit_screening",
  );
  expect(
    screen.getByText(/No bar \(totals and rows below them\): Total Credit screening\./),
  ).toBeInTheDocument();
});

it("C6-7: a wide register's card is labelled without a file name or page", () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  try {
    draw([
      section("Findings", 2, 1),
      section("T4.18 Debt instruments", 3, 10, [
        table(
          11,
          [
            "Instrument",
            "Principal",
            "Coupon",
            "Maturity",
            "Region",
            "Agent",
            "Trustee",
            "Governing law",
          ],
          [
            [
              "Term loan (credit_agreement.pdf p. 12)",
              "1,871",
              "5%",
              "2028",
              "USD",
              "A",
              "B",
              "NY",
            ],
          ],
        ),
      ]),
    ]);
    const list = screen.getByRole("list", { name: "Debt instruments" });
    expect(
      within(list).getByRole("button", { name: "Show sources for Term loan" }),
    ).toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});
