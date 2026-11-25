import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { Block, OutputEntry, PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { JudgementRow } from "./JudgementRow";

afterEach(cleanup);

const CONTRARY = "Contrary evidence and what would change the view";
const MISSING = "Not established for this run. The module wrote no such passage.";

const words = (line: number, text: string): Block => ({ type: "text", line, end: line, text });
const grid = (line: number, headers: string[], ...rows: string[][]): Block => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});

function lead(findings: Block[], contrary: Block[]): OutputEntry {
  return {
    output: {
      id: "CP-6-1",
      module: "CP-6",
      label: "CP-6",
      href: "CP-6.md",
      sha256: "c".repeat(64),
    },
    sections: [
      { heading: "CP-6", level: 1, line: 1, blocks: [] },
      { heading: "Findings", level: 2, line: 2, blocks: [] },
      { heading: "Key findings", level: 3, line: 3, blocks: findings },
      { heading: CONTRARY, level: 3, line: 40, blocks: contrary },
    ],
    selected: true,
  };
}

const draw = (entry: OutputEntry) =>
  render(
    <JudgementRow
      snapshot={{} as Snapshot}
      run={{ folder: "run-1" } as PublishedRun}
      view={{ entries: [entry], lead: entry } as unknown as ReportView}
    />,
  );

it("draws a table in Key findings as a table, cells in the reader's words, sources in Evidence", () => {
  draw(
    lead(
      [
        words(4, "Distributions exceed free cash flow."),
        grid(
          6,
          ["Measure", "FY2024", "Note", "Source"],
          ["Gross leverage", "6.53x", "Per CP-1C.", "annual_report.pdf page 4"],
          ["Interest cover", "2.10x", "As in notes_2024.pdf page 88.", "notes_2024.pdf"],
        ),
      ],
      [words(41, "Cash generation improved.")],
    ),
  );
  const findings = screen.getByRole("region", { name: "Key findings" });
  expect(within(findings).getAllByRole("listitem")).toHaveLength(2);
  const shown = within(findings).getByRole("table");
  expect(
    within(shown)
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent),
  ).toEqual(["Measure", "FY2024", "Note"]);
  expect(within(shown).getByRole("cell", { name: "6.53x" })).toBeVisible();
  expect(within(shown).getByRole("cell", { name: "Per Peer benchmark." })).toBeVisible();
  expect(within(shown).getByRole("link", { name: "Read this cell in Evidence" })).toBeVisible();
  expect(findings).not.toHaveTextContent(/annual_report|notes_2024|page 88|CP-1C/);
  expect(findings).not.toHaveTextContent(MISSING);
});

it("draws a table-only contrary passage, never as a passage the module did not write", () => {
  draw(
    lead(
      [words(4, "Distributions exceed free cash flow.")],
      [grid(42, ["Case", "Leverage"], ["Refinancing", "4.0x"])],
    ),
  );
  const counter = screen.getByRole("region", { name: CONTRARY });
  expect(counter).not.toHaveTextContent(MISSING);
  expect(
    within(within(counter).getByRole("table")).getByRole("cell", { name: "4.0x" }),
  ).toBeVisible();
  expect(within(counter).getAllByRole("link", { name: /^Source for / }).length).toBeGreaterThan(0);
});

it("heads both tiles with the small head, the kicker a quiet caption at the right", () => {
  draw(lead([words(4, "Distributions exceed free cash flow.")], [words(41, "Cash improved.")]));
  const findings = screen.getByRole("region", { name: "Key findings" });
  const heading = within(findings).getByRole("heading", { level: 3, name: "Key findings" });
  expect(heading).toHaveClass("text-small");
  expect(heading.nextElementSibling).toHaveTextContent("In the module's own words");
  const counter = screen.getByRole("region", { name: CONTRARY });
  expect(within(counter).getByRole("heading", { level: 3, name: CONTRARY })).toHaveClass(
    "text-small",
  );
});

it("draws one counter tile, the untyped outcomes a one-line gap inside it", () => {
  draw(lead([words(4, "Distributions exceed free cash flow.")], [words(41, "Cash improved.")]));
  expect(screen.queryByRole("region", { name: "What would change the view" })).toBeNull();
  const counter = screen.getByRole("region", { name: CONTRARY });
  const gap = within(counter).getByText(
    "The two outcomes, resolved favourably and resolved adversely, are not typed in this run.",
  );
  expect(gap.closest(".min-h-24")).toBeNull();
  expect(gap).toHaveClass("text-gap-text");
});

it("says under a passage table which columns are held in Evidence, and links the table", () => {
  draw(
    lead(
      [
        words(4, "Distributions exceed free cash flow."),
        grid(
          6,
          ["Measure", "Evidence", "Consumer", "Case ID", "Value"],
          ["Gross leverage", "Annual report", "Downside", "C1", "6.53x"],
        ),
      ],
      [words(41, "Cash generation improved.")],
    ),
  );
  const findings = screen.getByRole("region", { name: "Key findings" });
  const shown = within(findings).getByRole("table");
  expect(
    within(shown)
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent),
  ).toEqual(["Measure", "Value"]);
  expect(
    within(findings).getByText("Held in Evidence: Evidence, Consumer, Case ID."),
  ).toBeVisible();
  expect(within(findings).getByRole("link", { name: "Read this table in Evidence" })).toBeVisible();
});

it("links a block it cannot draw inside a passage instead of dropping it", () => {
  draw(
    lead(
      [
        words(4, "Distributions exceed free cash flow."),
        { type: "equity", line: 8, text: "Equity cushion chart" },
      ],
      [words(41, "Cash generation improved.")],
    ),
  );
  const findings = screen.getByRole("region", { name: "Key findings" });
  expect(within(findings).getAllByRole("listitem")).toHaveLength(2);
  expect(
    within(findings).getByRole("link", { name: "Read this passage in Evidence" }),
  ).toBeVisible();
});

it("lets the counter tile take its content height, the findings tile carrying the row", () => {
  draw(lead([words(4, "Distributions exceed free cash flow.")], [words(41, "Cash improved.")]));
  const counter = screen.getByRole("region", { name: CONTRARY });
  expect(counter).toHaveClass("self-start");
  expect(counter).not.toHaveClass("flex-1");
});

it("draws findings, counter paragraphs and table cells without inline markers or unnamed ids", () => {
  draw(
    lead(
      [
        words(4, "Leverage is 6.5x [E3]."),
        words(5, "The case holds per T4.18."),
        grid(6, ["Measure", "Note"], ["Gross leverage", "Per T4.18"], ["Cover", "Thin [E12, E14]"]),
      ],
      [words(41, "Cash generation improved [E3].")],
    ),
  );
  const findings = screen.getByRole("region", { name: "Key findings" });
  expect(within(findings).getByText("Leverage is 6.5x.")).toBeVisible();
  expect(
    within(findings).getByRole("link", { name: "Read this passage in Evidence" }),
  ).toBeVisible();
  const shown = within(findings).getByRole("table");
  expect(within(shown).getByRole("cell", { name: "Thin" })).toBeVisible();
  expect(within(shown).getByRole("link", { name: "Read this cell in Evidence" })).toBeVisible();
  expect(document.body).not.toHaveTextContent(/\[E\d|T4\.18/);
  expect(
    within(screen.getByRole("region", { name: CONTRARY })).getByText("Cash generation improved."),
  ).toBeVisible();
});
