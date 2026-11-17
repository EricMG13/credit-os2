import { fireEvent, render, screen, within } from "@testing-library/react";
import { type OutputEntry, type Table } from "../publishedReport";
import { Downside, downsideView } from "./Downside";

function table(line: number, headers: string[], rows: string[][]): Table {
  return {
    type: "table",
    line,
    headers,
    rows: rows.map((cells, i) => ({ line: line + 2 + i, cells })),
  };
}

function entry(shock: string, stressedCash: string): OutputEntry {
  const cases = table(
    3,
    [
      "Scenario ID",
      "Name",
      "EBITDA decline s",
      "Cash-interest increase k",
      "Anchor",
      "What the assumption leaves out",
      "Category",
      "Confidence",
    ],
    [
      ["c", "Observed period", "0", "0", "LTM to 2025-03-31", "", "", ""],
      [
        "a",
        "Lower margin",
        shock,
        "0",
        "Stress assumption",
        "Funding unchanged",
        "Analyst Interpretation",
        "Medium",
      ],
    ],
  );
  const results = table(
    20,
    ["Metric", "a", "c", "Source"],
    [
      ["Free cash flow (USD millions)", stressedCash, "62.00", "Filing p.1"],
      ["Interest cover (x)", "1.00", "1.70", "Filing p.2"],
    ],
  );
  return {
    output: { module: "CP-2A", id: "bound", label: "Downside", sha256: "hash", href: "file.md" },
    sections: [
      { heading: "T2DS.1 Scenarios", level: 3, line: 2, blocks: [cases] },
      { heading: "T2DS.4 Stressed flows and metrics", level: 3, line: 19, blocks: [results] },
    ],
    selected: true,
  };
}

it("joins the selected scenario by its identifier and keeps conflicting currencies in the source table", () => {
  const source = entry("0.10 (10%)", "-1.20 (-EUR 1.20 million)");
  const data = downsideView(source);
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  const chart = screen.getByRole("figure", { name: "Stressed flows and credit metrics" });
  expect(within(chart).queryByText(/Free cash flow/)).toBeNull();
  fireEvent.click(within(chart).getByRole("radio", { name: "Table" }));
  const row = within(chart).getByRole("row", { name: /Interest cover/ });
  expect(
    within(row)
      .getAllByRole("cell")
      .slice(0, 2)
      .map((item) => item.textContent),
  ).toEqual(["1.70", "1.00"]);
  expect(within(chart).getByRole("link", { name: "Measure source" })).toHaveAttribute(
    "href",
    "#evidence/0-23",
  );
  fireEvent.click(screen.getByText("Full scenario results"));
  expect(screen.getByRole("cell", { name: "-1.20 (-EUR 1.20 million)" })).toBeInTheDocument();
});

it.each(["0", "0.10 (25%)"])(
  "keeps the source table when the control or shock is ambiguous (%s)",
  (shock) => {
    const data = downsideView(entry(shock, "10"));
    expect(data?.cases).toEqual([]);
    expect(data?.matrix.rows).toHaveLength(2);
  },
);

it("keeps the comparison on the owning output", () => {
  const source = entry("0.10", "10");
  expect(downsideView({ ...source, output: { ...source.output, module: "CP-2G" } })).toBeNull();
});

it("does not plot a module marked not established", () => {
  const source = entry("0.10", "10");
  expect(
    downsideView({
      ...source,
      output: { ...source.output, state: { established: false, declared: null } },
    }),
  ).toBeNull();
});

it("J3-016 labels the chosen stress and displays both shock quantities as percentages", () => {
  const data = downsideView(entry("0.10 (10%)", "10"));
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/${String(line)}`} />);
  expect(
    screen.getByRole("combobox", { name: "Stress case to compare with the unstressed control" }),
  ).toBeInTheDocument();
  const decline = screen.getByText("EBITDA decline").closest("div");
  const interest = screen.getByText("Cash-interest increase").closest("div");
  expect(decline).toHaveTextContent("10%");
  expect(decline).not.toHaveTextContent("0.10");
  expect(interest).toHaveTextContent("0%");
});
