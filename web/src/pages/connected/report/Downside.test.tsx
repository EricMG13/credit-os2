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

function typedEntry(): OutputEntry {
  const assumptions = table(
    146,
    [
      "Scenario ID",
      "Period / scope",
      "EBITDA decline fraction s",
      "Cash-interest increase fraction k",
      "Category / confidence",
      "Anchor and omissions",
    ],
    [
      [
        "s00",
        "FY2024, 12 months ended 2024-09-30; fixed close debt and cash",
        "0",
        "0",
        "Analyst Interpretation / Medium; no-shock control",
        "Chosen because FY2024 has all nine inputs on an annual basis.",
      ],
      [
        "s01",
        "Same FY2024 base; shipment delays and some loss of profitable replacement mix",
        "0.1000",
        "0.0259",
        "Analyst Interpretation / Medium",
        "Partial reversal of the FY2024 earnings gain.",
      ],
      [
        "s02",
        "Same FY2024 base; OEM and aftermarket weakening",
        "0.2500",
        "0.0259",
        "Analyst Interpretation / Medium",
        "Identical interest shock isolates the incremental EBITDA effect.",
      ],
      [
        "s03",
        "Same FY2024 base; deeper coincident commercial stress",
        "0.5000",
        "0.0518",
        "Analyst Interpretation / Low",
        "No refinancing, mitigation, hedge waterfall or probability assigned.",
      ],
    ],
  );
  const summary = table(
    74,
    [
      "Case",
      "EBITDA fall / cash-interest increase",
      "Gross / net leverage",
      "EBITDA / cash interest",
      "Free cash flow / carrying debt",
      "Creditor consequence",
    ],
    [
      [
        "FY2024 control",
        "0% / 0%",
        "6.53x / 4.88x",
        "3.29x",
        "USD 1,880 million / 7.56%",
        "Reported-year baseline.",
      ],
      [
        "Shipment and mix stress",
        "10% / 2.59%",
        "7.25x / 5.43x",
        "2.89x",
        "USD 1,468.7078 million / 5.90%",
        "Cash still covers capex and net interest.",
      ],
      [
        "Broader demand stress",
        "25% / 2.59%",
        "8.70x / 6.51x",
        "2.41x",
        "USD 896.7578 million / 3.60%",
        "Cash generation falls below the watch level.",
      ],
      [
        "Deep, synchronized stress",
        "50% / 5.18%",
        "13.05x / 9.77x",
        "1.57x",
        "-USD 86.4844 million / -0.35%",
        "EBITDA still covers modeled cash interest.",
      ],
    ],
  );
  const metrics = table(
    182,
    [
      "Scenario",
      "EBITDA (USD million)",
      "Cash interest (USD million)",
      "FCF (USD million)",
      "Total debt / EBITDA (x)",
      "Net debt / EBITDA (x)",
      "EBITDA / cash interest (x)",
      "FCF / debt (fraction)",
      "Calculation status",
    ],
    [
      [
        "s00",
        "3813",
        "1158",
        "1880",
        "6.525046",
        "4.883032",
        "3.292746",
        "0.075563",
        "Calculated; reconciles to all reported comparator precisions.",
      ],
      [
        "s01",
        "3431.7",
        "1187.9922",
        "1468.7078",
        "7.250051",
        "5.425591",
        "2.888655",
        "0.059032",
        "Calculated; positive denominators.",
      ],
      [
        "s02",
        "2859.75",
        "1187.9922",
        "896.7578",
        "8.700061",
        "6.510709",
        "2.407213",
        "0.036043",
        "Calculated; positive denominators.",
      ],
      [
        "s03",
        "1906.5",
        "1217.9844",
        "-86.4844",
        "13.050092",
        "9.766063",
        "1.565291",
        "-0.003476",
        "Calculated; negative FCF is a valid numerator, not missing.",
      ],
    ],
  );
  return {
    output: { module: "CP-2A", id: "retained", label: "Downside", sha256: "hash", href: "file.md" },
    selected: true,
    sections: [
      { heading: "Downside stress", level: 3, line: 70, blocks: [summary] },
      { heading: "T2DS.1 Scenarios", level: 4, line: 144, blocks: [assumptions] },
      { heading: "T2DS.4 Stressed metrics", level: 4, line: 180, blocks: [metrics] },
    ],
  };
}

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

it("reads retained CP-2A scenario and metric registers without losing units, signs, or precision", () => {
  const data = downsideView(typedEntry());
  if (!data) throw new Error("retained CP-2A tables were rejected");
  expect(data.cases.map(({ name }) => name)).toEqual([
    "FY2024 control",
    "Shipment and mix stress",
    "Broader demand stress",
    "Deep, synchronized stress",
  ]);
  expect(data.cases.map(({ decline, interest }) => [decline, interest])).toEqual([
    ["0", "0"],
    ["0.1000", "0.0259"],
    ["0.2500", "0.0259"],
    ["0.5000", "0.0518"],
  ]);
  expect(data.matrix.rows.map(({ cells }) => cells[0])).toEqual([
    "EBITDA (USD million)",
    "Cash interest (USD million)",
    "FCF (USD million)",
    "Total debt / EBITDA (x)",
    "Net debt / EBITDA (x)",
    "EBITDA / cash interest (x)",
    "FCF / debt (fraction)",
    "Calculation status",
  ]);
  expect(data.matrix.rows[2]?.cells).toContain("-86.4844");
  render(<Downside data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  const figure = within(tile()).getByRole("img");
  expect(figure).toHaveAccessibleName(/FCF \(\$m\).*Deep, synchronized stress -86\.4844/);
  expect(figure).not.toHaveAccessibleName(/s00|s01|s02|s03/);
  expect(within(figure).getByText("7.250051")).toBeVisible();
  expect(within(figure).getByText("-0.003476")).toBeVisible();
  expect(
    within(tile()).getByText(
      "Calculation status is not drawn; the table has its cells as written.",
    ),
  ).toBeVisible();
  fireEvent.click(within(tile()).getByRole("button", { name: "Table" }));
  expect(within(tile()).getByRole("cell", { name: "-86.4844" })).toBeVisible();
  expect(
    within(tile()).getByRole("cell", {
      name: "Calculated; negative FCF is a valid numerator, not missing.",
    }),
  ).toBeVisible();
  expect(
    within(tile()).getByRole("link", { name: "Source for FCF (USD million)" }),
  ).toHaveAttribute("href", "#evidence/0-182");
});

it("does not attach a rounded summary label to a different exact shock pair", () => {
  const source = typedEntry();
  const register = source.sections[1]?.blocks[0];
  if (register?.type !== "table") throw new Error("scenario register missing");
  const shipment = register.rows[1];
  if (!shipment) throw new Error("shipment scenario missing");
  shipment.cells[2] = "0.10000000005";
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
