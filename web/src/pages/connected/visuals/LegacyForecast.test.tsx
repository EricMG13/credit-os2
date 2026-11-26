import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { EMPHASIS_CLASS } from "../../../components/chart/SeriesLine";
import {
  CashProxy,
  cashProxyCases,
  forecastCaseNames,
  forecastCaseOptions,
  ForecastScope,
  gridOf,
  LegacyForecast,
} from "./LegacyForecast";

import { Forecast } from "../report/Forecast";
import type { PublishedRun } from "../publishedReport";
import { ForecastStatement } from "./ForecastStatement";

const model = {
  cashflow: {
    units: "USD millions",
    notes: ["Downside case is the stress case: a shock applied to base case drivers."],
    columns: [
      { label: "FY2027E", group: "Base case" },
      { label: "FY2028E", group: "Base case" },
      { label: "FY2027E", group: "Downside case" },
      { label: "FY2028E", group: "Downside case" },
    ],
    rows: [
      {
        label: "Cash proxy (not issuer free cash flow)",
        band: "Cash",
        total: true,
        cells: [
          { status: "value", exact: "10", display: "10.00" },
          { status: "value", exact: "12", display: "12.00" },
          { status: "value", exact: "5", display: "5.00" },
          { status: "value", exact: "6", display: "6.00" },
        ],
      },
      {
        label: "Revenue",
        band: "Operating",
        total: false,
        cells: [
          { status: "value", exact: "100", display: "100" },
          { status: "value", exact: "110", display: "110" },
          { status: "value", exact: "80", display: "80" },
          { status: "value", exact: "90", display: "90" },
        ],
      },
    ],
  },
};

it("offers the published Base and Downside cases with actual latest cash proxy values", () => {
  expect(forecastCaseOptions(model)).toEqual([
    {
      name: "Base case",
      rawGroup: "Base case",
      period: "FY2028E",
      value: 12,
      units: "USD millions",
      description: undefined,
    },
    {
      name: "Downside shock",
      rawGroup: "Downside case",
      period: "FY2028E",
      value: 6,
      units: "USD millions",
      description: model.cashflow.notes[0],
    },
  ]);
});

it("labels absent units as not recorded in the case data and model", () => {
  const noUnits = { cashflow: { ...model.cashflow, units: null } };
  expect(forecastCaseOptions(noUnits).map(({ units }) => units)).toEqual([
    "Units not recorded",
    "Units not recorded",
  ]);
  render(<LegacyForecast model={noUnits} />);
  expect(screen.getByText("Units not recorded")).toBeInTheDocument();
});

it("applies the selected downside to forecast chart and model table", () => {
  render(<LegacyForecast model={model} selectedCase="Downside shock" />);
  const chart = within(screen.getByRole("figure", { name: "Revenue" }));
  fireEvent.click(chart.getByRole("button", { name: "Table" }));
  expect(chart.getByRole("cell", { name: "80" })).toBeInTheDocument();
  expect(chart.getByRole("cell", { name: "90" })).toBeInTheDocument();
  expect(chart.queryByRole("cell", { name: "100" })).toBeNull();
  expect(chart.queryByRole("cell", { name: "110" })).toBeNull();

  const table = within(screen.getByRole("region", { name: "Cash flow model" }));
  expect(table.getByRole("cell", { name: "80" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "90" })).toBeInTheDocument();
  expect(table.queryByRole("cell", { name: "100" })).toBeNull();
  expect(table.queryByRole("cell", { name: "110" })).toBeNull();
});

it("draws every case on the cash proxy chart and table, emphasising the selected one", () => {
  render(<CashProxy model={model} selectedCase="Downside shock" />);
  const chart = within(screen.getByRole("figure", { name: "Cash proxy by scenario" }));
  fireEvent.click(chart.getByRole("button", { name: "Table" }));
  expect(chart.getByRole("row", { name: /Downside shock/ })).toBeInTheDocument();
  expect(chart.getByRole("row", { name: /Base case/ })).toBeInTheDocument();
  expect(chart.getByRole("cell", { name: "6.00" })).toBeInTheDocument();
});

it("includes the published currency and scale when one period can only be shown as a table", () => {
  const onePeriod = {
    cashflow: {
      units: "GBP millions",
      columns: [
        { label: "FY2027E", group: "Base case" },
        { label: "FY2027E", group: "Downside case" },
      ],
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          band: "Cash",
          total: true,
          cells: ["42", "31"].map((value) => ({
            status: "value",
            exact: value,
            display: value,
          })),
        },
      ],
    },
  };
  render(<CashProxy model={onePeriod} unified />);
  expect(screen.getByText("Cash proxy values (£m).")).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "Scenario comparison" })).toBeInTheDocument();
});

it("explains a recorded standalone cash proxy with no forecast periods", () => {
  const cashflow = {
    ...model.cashflow,
    columns: model.cashflow.columns.map((column) => ({ ...column, label: "Historical" })),
  };
  render(<CashProxy model={{ cashflow }} />);
  expect(screen.getByRole("note")).toHaveTextContent(
    "The recorded cases do not form a readable scenario comparison.",
  );
  expect(screen.queryByRole("figure")).toBeNull();
});

it("explains incompatible standalone case dates without drawing a comparison", () => {
  const cashflow = {
    ...model.cashflow,
    columns: model.cashflow.columns.map((column) => {
      const year = column.label.slice(2, 6);
      return {
        ...column,
        start: year + (column.group === "Base case" ? "-01-01" : "-07-01"),
        end: year + "-12-31",
      };
    }),
  };
  render(<CashProxy model={{ cashflow }} />);
  expect(screen.getByRole("note")).toHaveTextContent(
    "Periods left out of the scenario comparison: FY2027E, FY2028E (recorded start and end dates do not match between cases, or are incomplete or invalid). No other period is published by more than one case, so no scenario comparison is drawn.",
  );
  expect(screen.queryByRole("table", { name: "Scenario comparison" })).toBeNull();
});

it("reports an unreadable cash proxy comparison instead of claiming the row is absent", () => {
  const unreadable = structuredClone(model);
  unreadable.cashflow.rows.push({
    label: "Revenue",
    band: "Operating",
    total: false,
    cells: [
      { status: "value", exact: "100", display: "100" },
      { status: "value", exact: "110", display: "" },
      { status: "value", exact: "80", display: "80" },
      { status: "value", exact: "90", display: "90" },
    ],
  });
  render(
    <CashProxy model={unreadable} unified sourceFor={() => <a href="#evidence">Source table</a>} />,
  );
  expect(screen.getByRole("note")).toHaveTextContent(/cash proxy is recorded/i);
  expect(screen.getByRole("note")).toHaveTextContent(/calculation grid is unreadable/i);
  expect(screen.queryByText("No scenario cash proxy was recorded.")).toBeNull();
  expect(screen.getByRole("link", { name: "Source table" })).toHaveAttribute("href", "#evidence");
});

function fourCases() {
  const groups = ["Base case", "Downside case", "Upside", "Downside (CP-2G drivers)"];
  return {
    cashflow: {
      units: "USD millions",
      columns: groups.flatMap((group) => [
        { label: "FY2027E", group },
        { label: "FY2028E", group },
      ]),
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          band: "Cash",
          total: true,
          cells: [10, 12, 5, 6, 14, 18, 7, 8].map((value) => ({
            status: "value",
            exact: String(value),
            display: `${String(value)}.00`,
          })),
        },
      ],
    },
  };
}

it("draws all four scenarios, each named, with only the selected one emphasised", () => {
  const { container } = render(<CashProxy model={fourCases()} selectedCase="Upside case" />);
  const names = [...container.querySelectorAll(".recharts-wrapper [data-series-name]")];
  expect(names.map((name) => name.textContent).sort()).toEqual([
    "Base case",
    "Downside case",
    "Downside drivers",
    "Upside case",
  ]);
  expect(container.querySelectorAll(".recharts-wrapper path.recharts-line-curve")).toHaveLength(4);
  const emphasised = container.querySelectorAll(`.recharts-wrapper .${EMPHASIS_CLASS}`);
  expect(emphasised).toHaveLength(1);
  const heavy = emphasised[0]?.querySelector("path.recharts-line-curve");
  expect(heavy).toHaveAttribute("name", "Upside case");
  expect(heavy).not.toHaveAttribute("stroke", "var(--color-chart-other)");
  expect(Number(heavy?.getAttribute("stroke-width"))).toBeGreaterThan(2);
  const others = [
    ...container.querySelectorAll(`.recharts-wrapper .recharts-line:not(.${EMPHASIS_CLASS})`),
  ];
  expect(others).toHaveLength(3);
  for (const line of others) {
    const path = line.querySelector("path.recharts-line-curve");
    expect(path).toHaveAttribute("stroke", "var(--color-chart-other)");
    expect(path).toHaveAttribute("stroke-width", "2");
  }
});

it("moves the emphasis when another case is selected", () => {
  const { container, rerender } = render(
    <CashProxy model={fourCases()} selectedCase="Base case" />,
  );
  const emphasisedName = () =>
    container.querySelector(".recharts-wrapper [data-series-name][data-emphasised]")?.textContent;
  expect(emphasisedName()).toBe("Base case");
  rerender(<CashProxy model={fourCases()} selectedCase="Downside case" />);
  expect(emphasisedName()).toBe("Downside case");
});

it("compares every case while the chart follows the selection, including zero and missing", () => {
  const all = structuredClone(model);
  const row = all.cashflow.rows[0];
  if (!row) throw new Error("Missing cash proxy fixture");
  row.cells[0] = { status: "value", exact: "0", display: "0.00" };
  row.cells[1] = { status: "missing", exact: "", display: "n.a." };
  const { rerender } = render(
    <CashProxy model={all} selectedCase="Downside shock" source={<a href="#basis">Basis</a>} />,
  );
  const table = within(screen.getByRole("table", { name: "Scenario comparison" }));
  expect(table.getByRole("row", { name: /Base case/ })).not.toHaveAttribute("aria-current");
  expect(table.getByRole("cell", { name: "0.00" })).toBeInTheDocument();
  expect(table.getByRole("row", { name: /Downside shock/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(table.getAllByRole("link", { name: "Basis" })).toHaveLength(2);
  expect(table.getByText("not available")).toBeInTheDocument();
  rerender(<CashProxy model={all} selectedCase="Base case" />);
  expect(table.getByRole("row", { name: /Base case/ })).toHaveAttribute("aria-current", "true");
  expect(table.getByRole("row", { name: /Downside shock/ })).not.toHaveAttribute("aria-current");
  expect(table.getByRole("cell", { name: "6.00" })).toBeInTheDocument();
});

it("promotes exact scope qualifications and leaves source-bearing sentences out", () => {
  const limits = [
    "Every figure uses inputs CP-2G stated; the inputs are unreviewed. Not analytical review.",
    "Base period is twelve months to 30 June 2026.",
    "Base interest excludes rent; forecast interest includes rent and is not comparable.",
    "The second half of 2026 is not modelled; FY2027 opens from 30 June balances.",
    "Standalone pre-merger perimeter; no acquisition debt.",
    "The machine input is set to zero; cash is lower by USD 183.09 million.",
    "Standalone perimeter is defined in secret-file.pdf.",
  ];
  const baseNote =
    "Base case is a conditional illustration, not an evidence-supported central issuer forecast.";
  render(
    <ForecastScope
      model={{ cashflow: { notes: [baseNote], limits } }}
      source={(name) => <a href="#record">{name}</a>}
    />,
  );
  expect(screen.getByText(baseNote)).toBeInTheDocument();
  for (const line of limits.slice(1, 6)) expect(screen.getByText(line)).toBeInTheDocument();
  expect(screen.getByText("Not analytical review.")).toBeInTheDocument();
  expect(screen.queryByText(/CP-2G/)).toBeNull();
  expect(screen.queryByText(/secret-file/)).toBeNull();
  expect(screen.getAllByRole("link", { name: "Model scope qualification" })).toHaveLength(7);
});

it("does not invent missing qualifications or case descriptions", () => {
  render(<ForecastScope model={{ cashflow: {} }} />);
  expect(screen.getByText(/No qualifications are available in this summary/)).toBeInTheDocument();
  expect(forecastCaseOptions(model)[0]?.description).toBeUndefined();
});

it("places all four recorded cases between the conditional base qualification and full scope", () => {
  const cashflow = {
    ...model.cashflow,
    notes: ["Base case is a conditional illustration.", ...model.cashflow.notes],
    limits: ["Base interest and forecast interest are not comparable."],
    other: {
      columns: [
        { label: "FY2027E", group: "Upside" },
        { label: "FY2028E", group: "Upside" },
        { label: "FY2027E", group: "Downside (CP-2G drivers)" },
        { label: "FY2028E", group: "Downside (CP-2G drivers)" },
      ],
      rows: [model.cashflow.rows[0]],
    },
  };
  const published = {
    id: "model",
    issuerKey: "issuer",
    runId: "run",
    runFolder: "run",
    href: "",
    download: "",
    sources: [],
    cashflow,
  };
  render(
    <Forecast
      view={{
        catalogue: undefined,
        lead: undefined,
        entries: [],
        modules: [],
        models: [published],
      }}
      run={{ folder: "run" } as PublishedRun}
    />,
  );
  // Every case is in the header's switch; the selected one's figure, description and reason
  // are drawn under it.
  const buttons = within(screen.getByRole("group", { name: "Case" })).getAllByRole("button");
  expect(buttons).toHaveLength(4);
  expect(screen.queryByText("Two cases")).toBeNull();
  const cards = buttons.map((button) => {
    fireEvent.click(button);
    const card = screen.getByLabelText("Selected case cash proxy").parentElement as HTMLElement;
    expect(card).toHaveTextContent(`Cash proxy, ${button.textContent} · `);
    return card.textContent;
  });
  expect(cards.filter((text) => text.includes("Case description not recorded."))).toHaveLength(2);
  // The conditional base qualification stands in the scope tile, ahead of the full scope list.
  const tile = screen.getByRole("region", { name: "Scope and limits" });
  const limit = within(tile).getByText("Base interest and forecast interest are not comparable.");
  expect(within(tile).getByText("Base case is a conditional illustration.")).toBeInTheDocument();
  expect(
    within(tile)
      .getByText("Base case is a conditional illustration.")
      .compareDocumentPosition(limit) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  // No case's figure repeats it.
  for (const card of cards) expect(card).not.toContain("Base case is a conditional illustration.");
  // The full scope is a visible list, not behind a closed disclosure.
  expect(limit.closest("details")).toBeNull();
  expect(buttons.map((node) => node.textContent)).toEqual([
    "Base case",
    "Downside shock",
    "Upside case",
    "Downside drivers",
  ]);
});

it("retains other cases when the selected cash proxy is entirely missing", () => {
  const missing = structuredClone(model);
  const row = missing.cashflow.rows[0];
  if (!row) throw new Error("Missing cash proxy fixture");
  for (const index of [2, 3]) {
    row.cells[index] = { status: "missing", exact: "", display: "n.a." };
  }
  render(<CashProxy model={missing} selectedCase="Downside shock" />);
  const comparison = within(screen.getByRole("table", { name: "Scenario comparison" }));
  expect(comparison.getByRole("cell", { name: "12.00" })).toBeInTheDocument();
  expect(comparison.getByRole("row", { name: /Downside shock/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(comparison.getAllByText("not available")).toHaveLength(2);
  const chart = within(screen.getByRole("figure", { name: "Cash proxy by scenario" }));
  fireEvent.click(chart.getByRole("button", { name: "Table" }));
  expect(chart.getAllByText("not available")).toHaveLength(2);
  expect(chart.getByRole("row", { name: /Base case/ })).toBeInTheDocument();
});

it("separates the name labels of scenarios that end close together", () => {
  const close = fourCases();
  const row = close.cashflow.rows[0];
  if (!row) throw new Error("Missing cash proxy fixture");
  close.cashflow.columns = close.cashflow.columns.slice(0, 4);
  row.cells = [12000, 12000, 11400, 11400].map((value) => ({
    status: "value",
    exact: String(value),
    display: `${String(value)}.00`,
  }));
  const { container } = render(<CashProxy model={close} selectedCase="Base case" />);
  const ys = [...container.querySelectorAll(".recharts-wrapper [data-series-name]")].map((name) =>
    Number(name.getAttribute("y")),
  );
  expect(ys).toHaveLength(2);
  expect(Math.abs((ys[0] ?? 0) - (ys[1] ?? 0))).toBeGreaterThanOrEqual(14);
});

it("labels only the emphasised scenario's end value and keeps every scenario's name clear of it", () => {
  const ends = [12000, 11900, 11800, 11700];
  const groups = ["Base case", "Downside case", "Upside", "Downside (CP-2G drivers)"];
  const close = {
    cashflow: {
      units: "USD millions",
      columns: groups.flatMap((group) => [
        { label: "FY2027E", group },
        { label: "FY2028E", group },
      ]),
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          band: "Cash",
          total: true,
          cells: ends
            .flatMap((end) => [end - 500, end])
            .map((value) => ({
              status: "value",
              exact: String(value),
              display: `${String(value)}.00`,
            })),
        },
      ],
    },
  };
  const { container } = render(<CashProxy model={close} selectedCase="Downside case" />);
  const box = (el: Element) => ({
    text: el.textContent,
    x: Number(el.getAttribute("x")),
    y: Number(el.getAttribute("y")),
    series: el.getAttribute("data-series"),
    anchor: el.getAttribute("text-anchor"),
  });
  const labels = [...container.querySelectorAll(".recharts-wrapper [data-label]")].map(box);
  const names = [...container.querySelectorAll(".recharts-wrapper [data-series-name]")].map(box);
  expect(labels.map(({ text, series }) => [text, series])).toEqual([
    ["11,900.00", "Downside case"],
  ]);
  expect(names.map(({ text }) => text).sort()).toEqual([
    "Base case",
    "Downside case",
    "Downside drivers",
    "Upside case",
  ]);
  // The value label ends left of the line end and every name starts right of it: no name can sit on it.
  const [value] = labels;
  expect(value?.anchor).toBe("end");
  for (const name of names) expect(value?.x ?? Infinity).toBeLessThan(name.x);
});

function casesModel(
  columns: { label: string; group: string }[],
  cells: Record<string, unknown>[],
  notes: string[] = [],
) {
  return {
    cashflow: {
      units: "USD millions",
      notes,
      columns,
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          band: "Cash",
          total: true,
          cells,
        },
        {
          label: "Revenue",
          band: "Operating",
          total: false,
          cells: cells.map((_, index) => ({
            status: "value",
            exact: String(100 + index),
            display: String(100 + index),
          })),
        },
      ],
    },
  };
}
const valueCell = (value: string) => ({ status: "value", exact: value, display: value });

it("keeps the periods only the longer case publishes, the shorter case not published there", () => {
  const base = ["FY2026E", "FY2027E", "FY2028E", "FY2029E", "FY2030E"];
  const downside = ["FY2026E", "FY2027E", "FY2028E"];
  const { cashflow } = casesModel(
    [
      ...base.map((label) => ({ label, group: "Base case" })),
      ...downside.map((label) => ({ label, group: "Downside case" })),
    ],
    ["10", "11", "12", "13", "14", "5", "6", "7"].map(valueCell),
  );
  const grid = gridOf(cashflow);
  if (!grid) throw new Error("Unreadable fixture");
  const cases = cashProxyCases(grid, null, forecastCaseNames(cashflow));
  expect(cases.periods).toEqual(["FY2026E", "FY2027E", "FY2028E", "FY2029E", "FY2030E"]);
  expect(cases.series.map(({ name, values }) => [name, values])).toEqual([
    ["Base case", [10, 11, 12, 13, 14]],
    ["Downside case", [5, 6, 7, null, null]],
  ]);
  expect(cases.rows[1]?.cells).toEqual(["5.00", "6.00", "7.00", "Not published", "Not published"]);
  // Nothing was excluded and three periods are shared: the comparison is drawn with no notice.
  expect(cases.compared).toBe(true);
  expect(cases.notice).toBeNull();
});

function sameLabelModel() {
  return casesModel(
    ["Base case", "Upside", "Upside case"].flatMap((group) => [
      { label: "FY2027E", group },
      { label: "FY2028E", group },
    ]),
    ["10", "12", "21", "22", "31", "32"].map(valueCell),
  );
}

it("gives two raw groups with one label different names and keeps each raw group", () => {
  const options = forecastCaseOptions(sameLabelModel());
  expect(Object.fromEntries(options.map(({ rawGroup, value }) => [rawGroup, value]))).toEqual({
    "Base case": 12,
    Upside: 22,
    "Upside case": 32,
  });
  expect(new Set(options.map(({ name }) => name)).size).toBe(3);
});

it.each([
  ["Upside", "22.00", "32.00"],
  ["Upside case", "32.00", "22.00"],
])("marks the cash proxy row of the selected raw group %s current", (rawGroup, own, peer) => {
  render(
    <CashProxy model={sameLabelModel()} selectedCase="Upside case" selectedRawGroup={rawGroup} />,
  );
  const table = within(screen.getByRole("table", { name: "Scenario comparison" }));
  const current = table.getAllByRole("row").filter((row) => row.hasAttribute("aria-current"));
  expect(current).toHaveLength(1);
  expect(current[0]).toHaveTextContent(own);
  expect(current[0]).not.toHaveTextContent(peer);
});

it.each([
  ["Upside", ["102", "103"], ["104", "105"]],
  ["Upside case", ["104", "105"], ["102", "103"]],
])("draws the selected raw group %s alone in the trends and model table", (rawGroup, own, peer) => {
  render(
    <LegacyForecast
      model={sameLabelModel()}
      selectedCase="Upside case"
      selectedRawGroup={rawGroup}
    />,
  );
  const chart = within(screen.getByRole("figure", { name: "Revenue" }));
  fireEvent.click(chart.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("region", { name: "Cash flow model" }));
  for (const part of [chart, table]) {
    for (const value of own) expect(part.getByRole("cell", { name: value })).toBeInTheDocument();
    for (const value of [...peer, "100", "101"])
      expect(part.queryByRole("cell", { name: value })).toBeNull();
  }
});

const placeholderReason = "no downside case was computed in this run";
function placeholderModel() {
  return casesModel(
    [
      { label: "FY2027E", group: "Base case" },
      { label: "FY2028E", group: "Base case" },
      { label: "Downside", group: "Downside case" },
    ],
    [
      valueCell("10"),
      valueCell("12"),
      { status: "na", exact: null, display: "n.a.", reason: placeholderReason },
    ],
  );
}

it("records no period for a case that has only its placeholder column", () => {
  const downside = forecastCaseOptions(placeholderModel())[1];
  expect(downside).toMatchObject({
    name: "Downside case",
    rawGroup: "Downside case",
    value: null,
    reason: placeholderReason,
  });
  expect(downside?.period).toBeUndefined();
  expect(downside).not.toHaveProperty("periodStart");
  expect(downside).not.toHaveProperty("periodEnd");
});

it("gives a reason only where the case has no figure", () => {
  const valued = casesModel(
    [
      { label: "FY2027E", group: "Base case" },
      { label: "FY2027E", group: "Downside case" },
    ],
    [
      { ...valueCell("12"), reason: "Estimated from a partial year" },
      { status: "na", exact: null, display: "n.a.", reason: "Not calculable" },
    ],
  );
  const [base, downside] = forecastCaseOptions(valued);
  expect(base?.value).toBe(12);
  expect(base).not.toHaveProperty("reason");
  expect(downside?.value).toBeNull();
  expect(downside?.reason).toBe("Not calculable");

  const duplicated = casesModel(
    [
      { label: "FY2027E", group: "Base case" },
      { label: "FY2027E", group: "Base case" },
      { label: "FY2027E", group: "Downside case" },
    ],
    [valueCell("12"), valueCell("13"), valueCell("5")],
  );
  const [twice] = forecastCaseOptions(duplicated);
  expect(twice?.value).toBeNull();
  expect(twice?.reason).toBe(
    "More than one published observation uses FY2027E; no single value is shown.",
  );
});

it("names colliding cases in reader text, without a module code", () => {
  const options = forecastCaseOptions(
    casesModel(
      ["Base case", "Downside (CP-2G drivers)", "Downside drivers"].map((group) => ({
        label: "FY2027E",
        group,
      })),
      ["10", "7", "8"].map(valueCell),
    ),
  );
  const names = options.map(({ name }) => name).sort();
  expect(names).toEqual([
    "Base case",
    "Downside drivers · Downside (Forward credit model drivers)",
    // The raw group "Downside drivers" would only repeat the label, so it takes its place.
    "Downside drivers · second case",
  ]);
  expect(options.map(({ rawGroup }) => rawGroup)).toContain("Downside (CP-2G drivers)");
});

const NO_COMMON_PERIOD =
  "The cases publish no period in common, so no scenario comparison is drawn.";

function disjointModel() {
  return casesModel(
    [
      { label: "FY2026E", group: "Base case" },
      { label: "FY2027E", group: "Downside case" },
    ],
    ["10", "5"].map(valueCell),
  );
}

/** The real Forecast page for one model's cash flow record. */
function forecastPage(cashflow: ReturnType<typeof casesModel>["cashflow"]) {
  const published = {
    id: "model",
    issuerKey: "issuer",
    runId: "run",
    runFolder: "run",
    href: "",
    download: "",
    sources: [],
    cashflow: { limits: [], ...cashflow },
  };
  return render(
    <Forecast
      view={{
        catalogue: undefined,
        lead: undefined,
        entries: [],
        modules: [],
        models: [published],
      }}
      run={{ folder: "run" } as PublishedRun}
    />,
  );
}

it("tells the reader when the cases share no period, instead of drawing blank columns", () => {
  const { container, unmount } = forecastPage(disjointModel().cashflow);
  const grid = within(screen.getByRole("region", { name: "Forecast grid" }));
  expect(grid.getByRole("status")).toHaveTextContent(NO_COMMON_PERIOD);
  const figure = () => screen.getByLabelText("Selected case cash proxy");
  expect(within(figure().parentElement as HTMLElement).getByRole("status")).toHaveTextContent(
    NO_COMMON_PERIOD,
  );
  // No comparison is offered in the grid.
  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(container.textContent).not.toMatch(/omitted|left out|cannot be compared|Not published/i);
  // Each case keeps its own figure, selected in the header's switch.
  const caseItem = (name: string) => {
    fireEvent.click(
      within(screen.getByRole("group", { name: "Case" })).getByRole("button", {
        name: name,
      }),
    );
    expect(figure()).toHaveTextContent(`Cash proxy, ${name} · `);
    return figure();
  };
  expect(within(caseItem("Base case")).getByText("10")).toBeInTheDocument();
  expect(within(caseItem("Downside case")).getByText("5")).toBeInTheDocument();
  unmount();

  // The standalone comparison draws none either.
  render(<CashProxy model={disjointModel()} />);
  expect(screen.getByRole("note")).toHaveTextContent(NO_COMMON_PERIOD);
  expect(screen.queryByRole("figure")).toBeNull();
  expect(screen.queryByRole("table")).toBeNull();
});

it("draws no line-item comparison and names no omitted period when the cases share no period", () => {
  // Without a cash proxy row the page has no case cards, so no case is selected.
  const { cashflow } = disjointModel();
  const lineItems = { ...cashflow, rows: cashflow.rows.filter(({ label }) => label === "Revenue") };
  const { container, unmount } = forecastPage(lineItems);
  expect(screen.queryByRole("radiogroup", { name: "Forecast case" })).toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Forecast grid" })).getByRole("status"),
  ).toHaveTextContent(NO_COMMON_PERIOD);
  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(screen.queryByRole("figure", { name: "Revenue" })).toBeNull();
  expect(container.textContent).not.toMatch(/omitted|left out|cannot be compared/i);
  unmount();

  render(<LegacyForecast model={disjointModel()} />);
  expect(screen.getByRole("status")).toHaveTextContent(NO_COMMON_PERIOD);
  expect(screen.queryByRole("figure", { name: "Revenue" })).toBeNull();
});

it("names a module-coded raw group the same in every caller, with no module code", () => {
  const coded = "Downside (CP-2G drivers)";
  const main = casesModel(
    ["Base case", coded].flatMap((group) => [
      { label: "FY2027E", group },
      { label: "FY2028E", group },
    ]),
    ["10", "12", "7", "8"].map(valueCell),
  );
  // A second raw group with the same label, in a grid the statement draws on its own.
  const model = {
    cashflow: {
      ...main.cashflow,
      other: {
        columns: [
          { label: "FY2027E", group: "Downside drivers" },
          { label: "FY2028E", group: "Downside drivers" },
        ],
        rows: main.cashflow.rows.slice(0, 1).map((row) => ({
          ...row,
          cells: ["5", "6"].map(valueCell),
        })),
      },
    },
  };
  const name = forecastCaseOptions(model).find(({ rawGroup }) => rawGroup === coded)?.name;
  expect(name).toBe("Downside drivers · Downside (Forward credit model drivers)");
  if (!name) throw new Error("The module-coded case has no card");

  // The statement, which draws the main grid without the other group.
  const statement = render(<ForecastStatement model={model} />);
  expect(
    within(screen.getByRole("table", { name: "Forecast grid" })).getByRole("columnheader", {
      name: `Forecast · ${name}`,
    }),
  ).toBeInTheDocument();
  expect(statement.container.textContent).not.toContain("CP-");
  statement.unmount();

  // The comparison, over both grids.
  const comparison = render(<CashProxy model={model} />);
  expect(
    within(screen.getByRole("table", { name: "Scenario comparison" })).getByRole("rowheader", {
      name,
    }),
  ).toBeInTheDocument();
  expect(comparison.container.textContent).not.toContain("CP-");
  comparison.unmount();

  // The line-item trends and the model table, over the main grid.
  render(<LegacyForecast model={model} />);
  const chart = within(screen.getByRole("figure", { name: "Revenue" }));
  fireEvent.click(chart.getByRole("button", { name: "Table" }));
  expect(chart.getByRole("rowheader", { name })).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Cash flow model" })).getByRole("columnheader", {
      name,
    }),
  ).toBeInTheDocument();
});
