import { fireEvent, render, screen, within } from "@testing-library/react";
import { type OutputEntry, type Table } from "../publishedReport";
import { Downside, downsideView, scenarioShareLabel } from "./Downside";
import { sourceOf, writtenTable } from "./leads/written";

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

const tile = () => screen.getByRole("region", { name: "Downside scenarios" });

it("contains unbroken scenario anchors and scope text within the desktop report", () => {
  const data = downsideView(entry("0.10 (10%)", "50.00"));
  if (!data) throw new Error("Test scenario matrix was rejected");
  const selected = data.cases[1];
  if (!selected) throw new Error("Test scenario missing");
  selected.anchor = `Anchor${"y".repeat(150)}`;
  selected.scope = `Left out ${"z".repeat(150)}`;
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  expect(tile().className).toMatch(/wrap-anywhere/);
});

it("joins the selected scenario by its identifier and keeps conflicting currencies in the source table", () => {
  const source = entry("0.10 (10%)", "-1.20 (-EUR 1.20 million)");
  const data = downsideView(source);
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  const figure = within(tile()).getByRole("img");
  expect(within(figure).queryByText(/Free cash flow/)).toBeNull();
  expect(within(tile()).getByText(/Free cash flow \(USD millions\) is not drawn/)).toBeVisible();
  fireEvent.click(within(tile()).getByRole("button", { name: "Table" }));
  const row = within(tile()).getByRole("row", { name: /Interest cover/ });
  expect(
    within(row)
      .getAllByRole("cell")
      .slice(0, 2)
      .map((item) => item.textContent),
  ).toEqual(["1.70", "1.00"]);
  expect(
    within(tile()).getByRole("link", { name: "Source for Interest cover (x)" }),
  ).toHaveAttribute("href", "#evidence/0-23");
  expect(
    within(tile()).getByRole("cell", { name: "-1.20 (-EUR 1.20 million)" }),
  ).toBeInTheDocument();
});

it("draws every case on each measure's own scale from zero, values as written, the control marked", () => {
  const data = downsideView(entry("0.10 (10%)", "50.00"));
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  const figure = within(tile()).getByRole("img");
  expect(figure).toHaveAccessibleName(
    /Free cash flow.*Observed period \(control\) 62\.00.*Lower margin 50\.00/,
  );
  for (const text of ["62.00", "50.00", "1.70", "1.00"])
    expect(within(figure).getByText(text)).toBeInTheDocument();
  const bars = [...figure.querySelectorAll("[data-bar]")].map((bar) =>
    bar.getAttribute("data-bar"),
  );
  expect(bars).toEqual(["62.00", "50.00", "1.70", "1.00"]);
  expect(figure.querySelector('[data-bar="62.00"]')).toHaveStyle({ left: "0%", width: "100%" });
  expect(within(figure).getAllByText("control")).toHaveLength(2);
});

it.each(["0", "0.10 (25%)"])(
  "keeps the source table when the control or shock is ambiguous (%s)",
  (shock) => {
    const data = downsideView(entry(shock, "10"));
    expect(data?.cases).toEqual([]);
    expect(data?.matrix.rows).toHaveLength(2);
    if (!data) throw new Error("matrix was rejected");
    render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
    expect(within(tile()).queryByRole("img")).toBeNull();
    expect(
      within(tile()).getByText(
        "This page could not read a unique control and named cases for these results.",
      ),
    ).toBeVisible();
    fireEvent.click(within(tile()).getByRole("button", { name: "Table" }));
    expect(within(tile()).getByRole("cell", { name: "10" })).toBeVisible();
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
  const choice = screen.getByRole("group", {
    name: "Stress case to compare with the unstressed control",
  });
  expect(within(choice).getByRole("button", { name: "Lower margin" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const chosen = screen.getByRole("group", { name: "Lower margin scenario" });
  const decline = within(chosen).getByText("EBITDA decline").closest("div");
  const interest = within(chosen).getByText("Cash-interest increase").closest("div");
  expect(decline).toHaveTextContent("10%");
  expect(decline).not.toHaveTextContent("0.10");
  expect(interest).toHaveTextContent("0%");
});

it("keeps the exported share label's base behaviour: a negative share is returned as written", () => {
  expect(scenarioShareLabel("-0.05")).toBe("-0.05");
  expect(scenarioShareLabel("-0.025")).toBe("-0.025");
  expect(scenarioShareLabel("−0.1234")).toBe("−0.1234");
  expect(scenarioShareLabel("0.025")).toBe("2.5%");
  expect(scenarioShareLabel("0.10 (10%)")).toBe("10%");
  expect(scenarioShareLabel("-1.5")).toBe("-1.5");
  expect(scenarioShareLabel("-x")).toBe("-x");
});

it("gives every case its own scenario trace in the case details", () => {
  const source = entry("0.10 (10%)", "50.00");
  const [cases] = source.sections;
  const register = cases?.blocks[0];
  if (register?.type !== "table") throw new Error("scenario register missing");
  register.rows.push({
    line: 7,
    cells: ["b", "Deeper cut", "0.2 (20%)", "0", "Stress assumption", "", "", ""],
  });
  const results = source.sections[1]?.blocks[0];
  if (results?.type !== "table") throw new Error("results missing");
  results.headers = ["Metric", "a", "b", "c", "Source"];
  results.rows = [
    { line: 22, cells: ["Free cash flow (USD millions)", "50.00", "40.00", "62.00", "Filing p.1"] },
  ];
  const data = downsideView(source);
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  expect(
    within(tile()).getByRole("link", { name: "Source for Lower margin scenario" }),
  ).toHaveAttribute("href", "#evidence/0-6");
  fireEvent.click(within(tile()).getByRole("button", { name: "Deeper cut" }));
  expect(
    within(tile()).getByRole("link", { name: "Source for Deeper cut scenario" }),
  ).toHaveAttribute("href", "#evidence/0-7");
  expect(
    within(tile()).queryByRole("link", { name: "Source for Lower margin scenario" }),
  ).toBeNull();
});

it("draws a scenario named with a module code by the module's name, never the raw code", () => {
  const source = entry("0.10 (10%)", "50.00");
  const register = source.sections[0]?.blocks[0];
  if (register?.type !== "table") throw new Error("scenario register missing");
  const stress = register.rows[1];
  if (!stress) throw new Error("stress row missing");
  stress.cells[1] = "Stress CP-2G";
  const data = downsideView(source);
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  expect(tile().textContent).not.toMatch(/CP-2G/);
  expect(within(tile()).getByRole("img").getAttribute("aria-label")).not.toMatch(/CP-2G/);
  expect(
    within(tile()).getByRole("button", { name: "Stress Forward credit model" }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(within(tile()).getByRole("button", { name: "Table" }));
  expect(
    within(tile()).getByRole("columnheader", { name: "Stress Forward credit model" }),
  ).toBeVisible();
});

it("reads the stressed metrics and scenarios under the headings the real handoffs use", () => {
  const source = entry("0.10 (10%)", "50.00");
  const [cases, results] = source.sections;
  if (!cases || !results) throw new Error("sections missing");
  cases.heading = "T2DS.1 — Scenarios";
  results.heading = "T2DS.4 — Stressed metrics";
  const data = downsideView(source);
  expect(data?.cases.map(({ id }) => id)).toEqual(["c", "a"]);
  expect(data?.matrix.line).toBe(20);
  // A heading that only mentions the id further on is not the register.
  cases.heading = "Notes on T2DS.1 — Scenarios";
  expect(downsideView(source)?.cases).toEqual([]);
});

it("names a case's stated gap with its word and reason, never a double colon", () => {
  const data = downsideView(entry("0.10 (10%)", "Not calculated: net debt is missing"));
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  expect(within(tile()).getByText("Free cash flow (USD millions) is not drawn.")).toBeVisible();
  expect(within(tile()).getByText("Not calculated")).toBeVisible();
  expect(within(tile()).getByText("Net debt is missing")).toBeVisible();
  expect(tile().textContent).not.toMatch(/: Not calculated:/);
});

it("gives a written table cell that reads as nothing as missing, not an empty string", () => {
  const written = writtenTable(
    sourceOf(table(3, ["Measure", "Value"], [["Leverage", "**"]])),
    (line) => `#evidence/${String(line)}`,
  );
  expect(written?.rows[0]?.cells).toEqual([null]);
});

// Review 3, P10: the module's own headers, and the control row's Category and Confidence reachable.
it("names each case detail by the module's own header and draws the control's details too", () => {
  const source = entry("0.10 (10%)", "50.00");
  const control = source.sections[0]?.blocks[0];
  if (control?.type !== "table" || !control.rows[0]) throw new Error("scenario table missing");
  control.rows[0].cells = [
    "c",
    "Observed period",
    "0",
    "0",
    "LTM to 2025-03-31",
    "No forward view",
    "Documentary Fact",
    "High",
  ];
  const data = downsideView(source);
  if (!data) throw new Error("Test scenario matrix was rejected");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  const chosen = within(tile()).getByRole("group", { name: "Lower margin scenario" });
  expect(within(chosen).getByText("Anchor")).toBeVisible();
  expect(within(chosen).getByText("Stress assumption")).toBeVisible();
  expect(within(chosen).getByText("What the assumption leaves out")).toBeVisible();
  expect(within(chosen).getByText("Funding unchanged")).toBeVisible();
  expect(within(chosen).getByText("Analyst Interpretation")).toBeVisible();
  const observed = within(tile()).getByRole("group", {
    name: "Observed period scenario (control)",
  });
  expect(within(observed).getByText("Category")).toBeVisible();
  expect(within(observed).getByText("Documentary Fact")).toBeVisible();
  expect(within(observed).getByText("Confidence")).toBeVisible();
  expect(within(observed).getByText("High")).toBeVisible();
  expect(within(observed).getByText("No forward view")).toBeVisible();
  expect(
    within(observed).getByRole("link", { name: "Source for Observed period scenario" }),
  ).toHaveAttribute("href", "#evidence/0-5");
  expect(tile().textContent).not.toMatch(/Assumption basis|Scope limits/);
});
