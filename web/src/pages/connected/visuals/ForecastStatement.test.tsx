import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { ForecastStatement } from "./ForecastStatement";
import {
  forecastTraceContext,
  type ForecastModel,
  type ForecastSelection,
} from "../report/ForecastRecord";

function model(columns: { label: string; group: string; start?: string; end?: string }[]) {
  return {
    cashflow: {
      units: "USD millions",
      columns,
      rows: [
        {
          label: "Revenue",
          band: "Operating",
          kind: "money",
          total: false,
          cells: columns.map(({ label, group }) =>
            group === "Downside case" && label === "Downside"
              ? {
                  status: "na",
                  exact: null,
                  display: "n.a.",
                  reason: "no downside case was computed in this run",
                }
              : { status: "value", exact: "10", display: "10" },
          ),
        },
      ],
    },
  };
}

const grid = () => within(screen.getByRole("table", { name: "Forecast grid" }));
const columnsSwitch = () => screen.queryByRole("group", { name: "Grid columns" });
const showColumns = (name: string) => {
  const group = columnsSwitch();
  if (!group) throw new Error("No Grid columns switch");
  fireEvent.click(within(group).getByRole("button", { name }));
};
const yearButtons = () =>
  within(screen.getByRole("group", { name: "Year" })).getAllByRole("button");

it("keeps an unavailable downside selectable without offering a false comparison", () => {
  render(
    <ForecastStatement
      model={model([
        { label: "FY2027E", group: "Base case" },
        { label: "Downside", group: "Downside case" },
      ])}
      selectedCase="Downside case"
    />,
  );

  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(screen.queryByRole("group", { name: "Year" })).toBeNull();
  expect(grid().getByRole("cell", { name: /n\.a\./ })).toBeInTheDocument();
});

it("offers comparison only when scenarios share a dated period and compatible recorded spans", () => {
  const statement = render(
    <ForecastStatement
      model={model([
        { label: "FY2027E", group: "Base case", start: "2026-01-01", end: "2026-12-31" },
        { label: "FY2027E", group: "Downside case", start: "2026-01-01", end: "2026-12-31" },
      ])}
    />,
  );
  expect(screen.getByRole("button", { name: "Compare one year" })).toBeInTheDocument();

  statement.rerender(
    <ForecastStatement
      model={model([
        { label: "FY2027E", group: "Base case", start: "2026-01-01", end: "2026-12-31" },
        { label: "FY2027E", group: "Downside case", start: "2026-01-01", end: "2026-06-30" },
      ])}
    />,
  );
  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(/start and end dates do not match/i);
});

it("retains label-based comparison for older grids where all candidate endpoints are absent", () => {
  render(
    <ForecastStatement
      model={model([
        { label: "FY2027E", group: "Base case" },
        { label: "FY2027E", group: "Downside case" },
      ])}
    />,
  );
  showColumns("Compare one year");
  const pressed = yearButtons().filter((button) => button.getAttribute("aria-pressed") === "true");
  expect(pressed.map((button) => button.textContent)).toEqual(["FY2027E"]);
});

function tracedStatement(
  columns: Parameters<typeof model>[0],
  props: { selectedCase?: string; selectedRawGroup?: string } = {},
) {
  const published = model(columns);
  const calls: { name: string; selection?: ForecastSelection }[] = [];
  render(
    <ForecastStatement
      model={published}
      {...props}
      source={(name, selection) => {
        calls.push({ name, selection });
        return null;
      }}
    />,
  );
  return () => {
    const selection = calls.filter(({ name }) => name === "Revenue").at(-1)?.selection;
    if (!selection) throw new Error("The Revenue row asked for no source");
    return forecastTraceContext(published as unknown as ForecastModel, {}, "Revenue", selection);
  };
}

it("traces every displayed column, with a date span in the heading only when comparing", () => {
  const revenueTrace = tracedStatement(
    [
      { label: "FY2025A", group: "Reported", start: "2025-01-01", end: "2025-12-31" },
      { label: "FY2026E", group: "Base case", start: "2026-01-01", end: "2026-12-31" },
      { label: "FY2027E", group: "Base case", start: "2027-01-01", end: "2027-12-31" },
      { label: "FY2026E", group: "Downside case", start: "2026-01-01", end: "2026-12-31" },
      { label: "FY2027E", group: "Downside case", start: "2027-01-01", end: "2027-12-31" },
    ],
    { selectedCase: "Base case" },
  );

  const selected = revenueTrace();
  expect(selected.statement).toContain("Base case · FY2026E (2026-01-01 to 2026-12-31): 10");
  expect(selected.statement).toContain("Base case · FY2027E (2027-01-01 to 2027-12-31): 10");
  // The latest actual year leads the selected case's columns, so its trace covers it too.
  expect(selected.statement).toContain("Reported · FY2025A (2025-01-01 to 2025-12-31): 10");
  expect(selected.statement).not.toContain("Downside case");
  expect(selected.heading).toBe("Revenue · Base case");

  showColumns("History");
  const history = revenueTrace();
  expect(history.statement).toContain("Reported · FY2025A (2025-01-01 to 2025-12-31): 10");
  expect(history.statement).not.toContain("FY2027E");
  expect(history.heading).not.toContain(" to ");

  showColumns("Compare one year");
  const compared = revenueTrace();
  expect(compared.heading).toContain("(2027-01-01 to 2027-12-31)");
  expect(compared.statement).toContain("Base case · FY2027E");
  expect(compared.statement).toContain("Downside case · FY2027E");
  expect(compared.statement).not.toContain("FY2026E");
});

it("offers for comparison only the periods at least two cases publish", () => {
  render(
    <ForecastStatement
      model={model([
        { label: "FY2026E", group: "Base case" },
        { label: "FY2027E", group: "Base case" },
        { label: "FY2026E", group: "Downside case" },
      ])}
    />,
  );
  showColumns("Compare one year");
  expect(yearButtons()).toHaveLength(1);
  expect(yearButtons()[0]).toHaveTextContent("FY2026E");
  expect(yearButtons()[0]).toHaveAttribute("aria-pressed", "true");
});

it("shows the selected raw group's own columns when two groups share one label", () => {
  const columns = [
    { label: "FY2027E", group: "Base case" },
    { label: "FY2027E", group: "Upside" },
    { label: "FY2028E", group: "Upside" },
    { label: "FY2029E", group: "Upside case" },
  ];
  const first = tracedStatement(columns, {
    selectedCase: "Upside case",
    selectedRawGroup: "Upside case",
  });
  expect(grid().getByRole("columnheader", { name: /FY2029E/ })).toBeInTheDocument();
  expect(grid().queryByRole("columnheader", { name: /FY2027E/ })).toBeNull();
  expect(grid().queryByRole("columnheader", { name: /FY2028E/ })).toBeNull();
  expect(first().statement).toContain("FY2029E");
  expect(first().statement).not.toContain("FY2028E");
});

it("shows the other same-label raw group's columns when that one is selected", () => {
  render(
    <ForecastStatement
      model={model([
        { label: "FY2027E", group: "Base case" },
        { label: "FY2027E", group: "Upside" },
        { label: "FY2028E", group: "Upside" },
        { label: "FY2029E", group: "Upside case" },
      ])}
      selectedCase="Upside case"
      selectedRawGroup="Upside"
    />,
  );
  expect(grid().getByRole("columnheader", { name: /FY2027E/ })).toBeInTheDocument();
  expect(grid().getByRole("columnheader", { name: /FY2028E/ })).toBeInTheDocument();
  expect(grid().queryByRole("columnheader", { name: /FY2029E/ })).toBeNull();
});

// The redesigned grid: one flat measure × year table for the selected case.

const value = (display: string) => ({ status: "value", exact: display, display });
const gap = (reason?: string) => ({
  status: "na",
  exact: null,
  display: "n.a.",
  ...(reason ? { reason } : {}),
});

function gridModel(
  rows: { label: string; band: string; kind: string; cells: Record<string, unknown>[] }[],
  columns: { label: string; group: string; start?: string; end?: string }[] = [
    "FY2026E",
    "FY2027E",
    "FY2028E",
  ].map((label) => ({ label, group: "Base case" })),
  limits: string[] = [],
) {
  return {
    cashflow: {
      units: "USD millions",
      limits,
      columns,
      rows: rows.map((row) => ({ total: false, ...row })),
    },
  };
}

const NOT_WRITTEN = "the forward model did not write this year";

function renderGrid(...args: Parameters<typeof gridModel>) {
  const calls: { name: string; selection?: ForecastSelection }[] = [];
  render(
    <ForecastStatement
      model={gridModel(...args)}
      selectedCase="Base case"
      source={(name, selection) => {
        calls.push({ name, selection });
        return <button type="button">{`Show sources for ${name}`}</button>;
      }}
    />,
  );
  return calls;
}

const rowOf = (label: string) => {
  const row = grid().getByRole("rowheader", { name: label }).closest("tr");
  if (!row) throw new Error(`No row for ${label}`);
  return row;
};

it("draws a missing cell in place as the gap cell, with its reason reachable", () => {
  renderGrid([
    {
      label: "Revenue",
      band: "Operating",
      kind: "money",
      cells: [value("100"), gap(NOT_WRITTEN), value("120")],
    },
  ]);
  const cells = within(rowOf("Revenue")).getAllByRole("cell");
  expect(cells.map((cell) => cell.textContent)).toEqual([
    "100",
    "n.a.",
    "120",
    "Show sources for Revenue",
  ]);
  expect(cells[0]?.className).toContain("font-mono");
  expect(cells[0]?.className).toContain("tabular-nums");
  const missing = cells[1];
  if (!missing) throw new Error("No gap cell");
  expect(missing.querySelector(".gap-hatch")).not.toBeNull();
  expect(missing.querySelector(".border-dashed")).not.toBeNull();
  // The reason is the cell's title and accessible name, and the row's trace carries it; it is
  // never page text, since a cell reason can be the model's ledger, drawn only on Evidence.
  expect(missing).toHaveAttribute("title", NOT_WRITTEN);
  expect(grid().getByRole("cell", { name: `n.a. ${NOT_WRITTEN}` })).toBe(missing);
  expect(document.body.textContent).not.toContain(NOT_WRITTEN);
  const key = screen.getByRole("list", { name: "Gap key" });
  expect(key).toHaveTextContent(/^n\.a\.: the model wrote no figure here; none is interpolated/);
  expect(key).toHaveTextContent("open the row's trace for the recorded reason");
  expect(
    screen.getByRole("table").compareDocumentPosition(key) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

it("merges consecutive gap cells with one display and reason into one spanning cell", () => {
  renderGrid(
    [
      {
        label: "Revenue",
        band: "Operating",
        kind: "money",
        cells: [value("100"), gap(NOT_WRITTEN), gap(NOT_WRITTEN), value("130"), gap()],
      },
    ],
    ["FY2026E", "FY2027E", "FY2028E", "FY2029E", "FY2030E"].map((label) => ({
      label,
      group: "Base case",
    })),
  );
  const cells = within(rowOf("Revenue")).getAllByRole("cell");
  expect(cells.map((cell) => cell.getAttribute("colspan"))).toEqual([null, "2", null, null, null]);
  expect(cells[3]).toHaveTextContent("n.a.");
  expect(cells[1]).toHaveAccessibleName(`n.a. ${NOT_WRITTEN}`);
  expect(cells[3]).toHaveAccessibleName("n.a.");
  // One gap word, listed once.
  const key = within(screen.getByRole("list", { name: "Gap key" })).getAllByRole("listitem");
  expect(key).toHaveLength(1);
});

it("shows a row whose every cell is a gap as one merged gap cell, with no row disclosure", () => {
  renderGrid([
    { label: "Revenue", band: "Operating", kind: "money", cells: ["1", "2", "3"].map(value) },
    {
      label: "Capex",
      band: "Operating",
      kind: "money",
      cells: [gap(NOT_WRITTEN), gap(NOT_WRITTEN), gap(NOT_WRITTEN)],
    },
  ]);
  const cells = within(rowOf("Capex")).getAllByRole("cell");
  expect(cells).toHaveLength(2);
  expect(cells[0]).toHaveAttribute("colspan", "3");
  expect(cells[0]).toHaveAccessibleName(`n.a. ${NOT_WRITTEN}`);
  expect(screen.queryByRole("button", { name: /unavailable rows/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /columns with no values/ })).toBeNull();
});

it("puts one trace per row in the row's last cell, never under the row label", () => {
  const calls = renderGrid([
    { label: "Revenue", band: "Operating", kind: "money", cells: ["1", "2", "3"].map(value) },
    { label: "EBITDA", band: "Operating", kind: "money", cells: ["4", "5", "6"].map(value) },
  ]);
  // The Trace header spans both header rows at the table's right edge.
  const trace = grid().getByRole("columnheader", { name: "Trace" });
  expect(trace).toHaveAttribute("rowspan", "2");
  expect(trace.parentElement?.lastElementChild).toBe(trace);
  for (const label of ["Revenue", "EBITDA"]) {
    const row = rowOf(label);
    expect(within(row).getAllByRole("button")).toHaveLength(1);
    expect(within(row).getAllByRole("cell").at(-1)).toContainElement(
      within(row).getByRole("button", { name: `Show sources for ${label}` }),
    );
    expect(within(within(row).getByRole("rowheader")).queryByRole("button")).toBeNull();
  }
  const revenue = calls.filter(({ name }) => name === "Revenue").at(-1)?.selection;
  expect(revenue).toMatchObject({
    case: "Base case",
    row: "Revenue",
    rawGroups: ["Base case"],
    periods: ["FY2026E", "FY2027E", "FY2028E"],
  });
});

it("groups the rows by their bands, with ratios and growth in the same table as revenue", () => {
  renderGrid([
    { label: "Revenue", band: "Operating", kind: "money", cells: ["1", "2", "3"].map(value) },
    {
      label: "Revenue YoY growth",
      band: "Operating",
      kind: "percent",
      cells: ["5.0%", "4.0%", "3.0%"].map(value),
    },
    {
      label: "Net leverage",
      band: "Credit metrics",
      kind: "multiple",
      cells: ["5.50x", "5.65x", "3.05x"].map(value),
    },
    {
      label: "Interest cover",
      band: "Credit metrics",
      kind: "multiple",
      cells: [value("3.01x"), gap(NOT_WRITTEN), gap(NOT_WRITTEN)],
    },
  ]);
  const table = screen.getByRole("table", { name: "Forecast grid" });
  const bodies = table.querySelectorAll("tbody");
  expect(bodies).toHaveLength(2);
  const [operating, credit] = [...bodies];
  if (!operating || !credit) throw new Error("Missing band groups");
  expect(
    within(operating).getByRole("rowheader", { name: "Operating Accounts and growth rates" }),
  ).toBeInTheDocument();
  expect(within(operating).getByRole("rowheader", { name: "Revenue" })).toBeInTheDocument();
  expect(within(operating).getByRole("rowheader", { name: "Revenue YoY growth" })).toBeVisible();
  expect(within(credit).getByRole("rowheader", { name: /^Credit metrics/ })).toHaveTextContent(
    "Ratios",
  );
  expect(within(credit).getByRole("cell", { name: "5.65x" })).toBeInTheDocument();
  expect(within(credit).getByRole("rowheader", { name: "Interest cover" })).toBeInTheDocument();
  expect(screen.queryByRole("radiogroup")).toBeNull();
  expect(screen.queryByRole("group", { name: /figure or table/u })).toBeNull();
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.queryByText("USD millions")).toBeNull();
});

it("leads the selected case with the latest actual year under an Actual band and names the case", () => {
  renderGrid(
    [
      {
        label: "Revenue",
        band: "Operating",
        kind: "money",
        cells: ["90", "95", "100", "110"].map(value),
      },
    ],
    [
      { label: "FY2024", group: "Fiscal year" },
      { label: "FY2025", group: "Fiscal year" },
      { label: "FY2026E", group: "Base case" },
      { label: "FY2027E", group: "Base case" },
    ],
  );
  const headers = grid()
    .getAllByRole("columnheader")
    .map((header) => header.textContent);
  expect(headers).toEqual([
    "Measure",
    "Actual",
    "Forecast · Base case",
    "Trace",
    "FY2025",
    "FY2026E",
    "FY2027E",
  ]);
  expect(within(rowOf("Revenue")).queryByRole("cell", { name: "90" })).toBeNull();
  showColumns("History");
  expect(grid().getByRole("columnheader", { name: "FY2024" })).toBeInTheDocument();
  expect(grid().queryByRole("columnheader", { name: "FY2026E" })).toBeNull();
});

it("reads Not published for a case that does not publish the compared year", () => {
  renderGrid(
    [
      {
        label: "Revenue",
        band: "Operating",
        kind: "money",
        cells: ["100", "101", "80", "81", "120"].map(value),
      },
    ],
    [
      { label: "FY2026E", group: "Base case" },
      { label: "FY2027E", group: "Base case" },
      { label: "FY2026E", group: "Downside case" },
      { label: "FY2027E", group: "Downside case" },
      { label: "FY2026E", group: "Upside case" },
    ],
  );
  showColumns("Compare one year");
  expect(yearButtons().map((button) => button.textContent)).toEqual(["FY2026E", "FY2027E"]);
  expect(
    grid()
      .getAllByRole("columnheader")
      .map((header) => header.textContent),
  ).toEqual([
    "Measure",
    "Forecast · FY2027E",
    "Trace",
    "Base case",
    "Downside case",
    "Upside case",
  ]);
  const cells = within(rowOf("Revenue")).getAllByRole("cell");
  expect(cells[0]).toHaveTextContent("101");
  expect(cells[1]).toHaveTextContent("81");
  expect(cells[2]).toHaveTextContent(/^Not published/);
  expect(cells[2]).toHaveAttribute("title", "This case publishes no FY2027E column.");
  expect(screen.getByRole("list", { name: "Gap key" })).toHaveTextContent(
    "Not published: the case publishes no column for this year.",
  );
  fireEvent.click(within(screen.getByRole("group", { name: "Year" })).getByText("FY2026E"));
  expect(within(rowOf("Revenue")).getAllByRole("cell")[2]).toHaveTextContent("120");
  expect(screen.queryByRole("list", { name: "Gap key" })).toBeNull();
});

it("draws the interest basis once, under the table, with its trace", () => {
  const basis = "Base interest is the cash coupon on the drawn facilities.";
  const calls = renderGrid(
    [
      { label: "Interest", band: "Cash", kind: "money", cells: ["7", "8", "9"].map(value) },
      {
        label: "Interest coverage",
        band: "Credit metrics",
        kind: "multiple",
        cells: ["4.0x", "4.1x", "4.2x"].map(value),
      },
    ],
    undefined,
    [basis],
  );
  expect(screen.getAllByText(basis)).toHaveLength(1);
  const item = screen.getByText(basis).closest("li");
  if (!item) throw new Error("The interest basis is not in a list");
  expect(within(item).getByText("Interest basis qualification")).toBeInTheDocument();
  expect(within(item).getByRole("button")).toBeInTheDocument();
  expect(
    screen.getByRole("table").compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(calls.some(({ selection }) => selection?.recordedQualification === basis)).toBe(true);
});

it("scrolls both ways in a named focusable region of its own height", () => {
  renderGrid([
    { label: "Revenue", band: "Operating", kind: "money", cells: ["1", "2", "3"].map(value) },
  ]);
  const region = screen.getByRole("region", { name: "Forecast grid table" });
  expect(region).toHaveAttribute("tabindex", "0");
  expect(region.className).toContain("overflow-auto");
  expect(region.className).toContain("max-h-[50vh]");
  expect(within(region).getByRole("rowheader", { name: "Revenue" }).className).toContain("sticky");
});

it("opens a long statement on its totals and the exact rows the page charts, no keyword", () => {
  const line = (label: string, kind = "money", total = false) => ({
    label,
    band: kind === "money" ? "Operating" : "Credit metrics",
    kind,
    total,
    cells: ["1", "2", "3"].map(value),
  });
  const totals = [line("Revenue", "money", true), line("Closing cash", "money", true)];
  // The rows the page's own measure reading chose for the lead and the stats, by row identity.
  const charted = [line("Net debt / Adj EBITDA", "multiple"), line("Interest cover", "multiple")];
  const other = [
    "COGS",
    "Opex",
    "D&A",
    "Cash interest",
    "Capex",
    "Distributions",
    "Opening cash",
    "Opening debt",
    "Leverage-neutral buybacks",
    "Accessible liquidity (incl. RCF)",
  ].map((label) => line(label));
  const rows = [
    ...totals,
    ...other,
    ...charted,
    line("Total leverage (debt / Adj EBITDA)", "multiple"),
  ];
  render(
    <ForecastStatement
      model={gridModel(rows)}
      selectedCase="Base case"
      chartedRows={charted.map(({ label }) => label)}
    />,
  );
  for (const { label } of [...totals, ...charted])
    expect(grid().getByRole("rowheader", { name: label })).toBeVisible();
  for (const { label } of other)
    expect(grid().queryByRole("rowheader", { name: label })).toBeNull();
  // A row named like a measure is not a key row unless the page charts it.
  expect(
    grid().queryByRole("rowheader", { name: "Total leverage (debt / Adj EBITDA)" }),
  ).toBeNull();
  expect(
    screen.getByText("Totals and the leverage, cover and liquidity rows read above: 4 of 15 rows."),
  ).toBeInTheDocument();
  fireEvent.click(
    within(screen.getByRole("group", { name: "Grid rows" })).getByRole("button", {
      name: "All rows",
    }),
  );
  for (const { label } of other)
    expect(grid().getByRole("rowheader", { name: label })).toBeVisible();
});

it("names a history band once where its placeholder column carries the band's name", () => {
  renderGrid(
    [{ label: "Revenue", band: "Operating", kind: "money", cells: [gap(NOT_WRITTEN), value("5")] }],
    [
      { label: "Quarter", group: "Quarter" },
      { label: "FY2026E", group: "Base case" },
    ],
  );
  showColumns("History");
  expect(grid().getAllByRole("columnheader", { name: "Quarter" })).toHaveLength(1);
  expect(grid().queryByRole("columnheader", { name: "FY2026E" })).toBeNull();
  expect(within(rowOf("Revenue")).getAllByRole("cell")[0]).toHaveAccessibleName(
    `n.a. ${NOT_WRITTEN}`,
  );
});

it("merges no gaps with different reasons, nor across the Actual and Forecast bands", () => {
  renderGrid(
    [
      {
        label: "Revenue",
        band: "Operating",
        kind: "money",
        cells: [gap(NOT_WRITTEN), gap(NOT_WRITTEN), gap("another reason"), value("130")],
      },
    ],
    [
      { label: "FY2025", group: "Fiscal year" },
      { label: "FY2026E", group: "Base case" },
      { label: "FY2027E", group: "Base case" },
      { label: "FY2028E", group: "Base case" },
    ],
  );
  const cells = within(rowOf("Revenue")).getAllByRole("cell");
  expect(cells.map((cell) => cell.getAttribute("colspan"))).toEqual([null, null, null, null, null]);
  expect(cells.slice(0, 3).map((cell) => cell.getAttribute("title"))).toEqual([
    NOT_WRITTEN,
    NOT_WRITTEN,
    "another reason",
  ]);
});

it("draws a year missing inside the selected case's span as Not published, in place", () => {
  render(
    <ForecastStatement
      model={{
        cashflow: {
          units: "USD millions",
          columns: [
            { label: "FY2025E", group: "Base case" },
            { label: "FY2027E", group: "Base case" },
          ],
          rows: [
            {
              label: "Revenue",
              band: "Revenue",
              kind: "money",
              total: false,
              cells: [
                { status: "value", exact: "100", display: "100" },
                { status: "value", exact: "120", display: "120" },
              ],
            },
          ],
        },
      }}
      selectedCase="Base case"
      selectedRawGroup="Base case"
    />,
  );
  const table = within(screen.getByRole("table", { name: "Forecast grid" }));
  expect(table.getByRole("columnheader", { name: /FY2026E/ })).toBeInTheDocument();
  const cells = within(
    table.getByRole("rowheader", { name: "Revenue" }).closest("tr") as HTMLElement,
  )
    .getAllByRole("cell")
    .map((cell) => cell.getAttribute("aria-label") ?? cell.textContent);
  expect(cells.slice(0, 3)).toEqual([
    "100",
    "Not published This case publishes no FY2026E column.",
    "120",
  ]);
});

// Review of 2026-11-25: the grid reads actual and forecast columns by the one period rule, and
// its leading actual column is the latest reported period. Expected values are written by hand.
const revenueRow = (cells: string[]) => [
  { label: "Revenue", band: "Operating", kind: "money", cells: cells.map(value) },
];
const headersOf = () =>
  grid()
    .getAllByRole("columnheader")
    .map((header) => header.textContent);

it("leads the selected case with the latest reported period, never a pro forma one", () => {
  renderGrid(revenueRow(["98", "95", "99", "90", "100", "110"]), [
    { label: "LTM Jun 2025", group: "Last twelve months" },
    { label: "FY2024", group: "Fiscal year" },
    { label: "PF LTM Jun 2025", group: "Pro forma" },
    { label: "2023", group: "Fiscal year" },
    { label: "FY2026E", group: "Base case" },
    { label: "FY2027E", group: "Base case" },
  ]);
  expect(headersOf()).toEqual([
    "Measure",
    "Actual",
    "Forecast · Base case",
    "Trace",
    "LTM Jun 2025",
    "FY2026E",
    "FY2027E",
  ]);
  expect(within(rowOf("Revenue")).getByRole("cell", { name: "98" })).toBeInTheDocument();
});

it("reads an actual year the rule reads, whatever its spelling", () => {
  renderGrid(revenueRow(["90", "95", "100", "110"]), [
    { label: "FY24", group: "Fiscal year" },
    { label: "2023", group: "Fiscal year" },
    { label: "FY2026E", group: "Base case" },
    { label: "FY2027E", group: "Base case" },
  ]);
  expect(headersOf().slice(4)).toEqual(["FY24", "FY2026E", "FY2027E"]);
});

it("draws a row-end sparkline from its exact comparable fiscal-year cells, keeping a gap", () => {
  const columns = ["FY2025E", "FY2026E", "FY2027E", "FY2028E"].map((label) => ({
    label,
    group: "Base case",
  }));
  renderGrid(
    [
      {
        label: "Revenue",
        band: "Operating",
        kind: "money",
        cells: [
          value("9007199254740992"),
          gap(NOT_WRITTEN),
          value("9007199254740994"),
          value("9007199254740995"),
        ],
      },
    ],
    columns,
  );

  const row = rowOf("Revenue");
  const sparkline = within(row).getByRole("img", {
    name: "Revenue, FY2025E to FY2028E",
  });
  expect(sparkline).toBeInTheDocument();
  expect(sparkline.querySelectorAll("path")).toHaveLength(1);
  expect(sparkline.querySelector("path")).toHaveAttribute(
    "data-values",
    "9007199254740994 9007199254740995",
  );
  expect(sparkline.querySelectorAll("line[data-gap]")).toHaveLength(1);
  expect(sparkline.querySelector("circle[data-end]")).toHaveAttribute(
    "data-value",
    "9007199254740995",
  );
});

it("does not draw a row trend across a missing year or a changed annual basis", () => {
  renderGrid(revenueRow(["10", "20", "30"]), [
    { label: "FY2025E", group: "Base case" },
    { label: "FY2027E", group: "Base case" },
    { label: "FY2028E", group: "Base case" },
  ]);
  expect(within(rowOf("Revenue")).queryByRole("img")).toBeNull();

  cleanup();
  renderGrid(revenueRow(["10", "20", "30"]), [
    {
      label: "FY2025E",
      group: "Base case",
      start: "2024-07-01",
      end: "2025-06-30",
    },
    {
      label: "FY2026E",
      group: "Base case",
      start: "2025-07-01",
      end: "2026-06-30",
    },
    {
      label: "FY2027E",
      group: "Base case",
      start: "2026-10-01",
      end: "2027-06-30",
    },
  ]);
  expect(within(rowOf("Revenue")).queryByRole("img")).toBeNull();
});

it("draws dated fiscal years when their recorded annual basis matches", () => {
  renderGrid(revenueRow(["10", "20", "30"]), [
    { label: "FY2025E", group: "Base case", start: "2024-07-01", end: "2025-06-30" },
    { label: "FY2026E", group: "Base case", start: "2025-07-01", end: "2026-06-30" },
    { label: "FY2027E", group: "Base case", start: "2026-07-01", end: "2027-06-30" },
  ]);
  expect(
    within(rowOf("Revenue")).getByRole("img", { name: "Revenue, FY2025E to FY2027E" }),
  ).toBeInTheDocument();
});

it("keeps the grid renderable without a sparkline when fewer than three cells have figures", () => {
  renderGrid(
    [
      {
        label: "Revenue",
        band: "Operating",
        kind: "money",
        cells: [value("10"), gap(NOT_WRITTEN), value("30")],
      },
    ],
    ["FY2025E", "FY2026E", "FY2027E"].map((label) => ({ label, group: "Base case" })),
  );
  expect(within(rowOf("Revenue")).queryByRole("img")).toBeNull();
});

it("keeps non-finite exact figures in the grid without sending them to pixel placement", () => {
  const tooLarge = "9".repeat(400);
  renderGrid(revenueRow([tooLarge, tooLarge, tooLarge]));
  expect(within(rowOf("Revenue")).queryByRole("img")).toBeNull();
  expect(within(rowOf("Revenue")).getAllByRole("cell", { name: tooLarge })).toHaveLength(3);
});

it("does not join the same row across separate forecast cases", () => {
  renderGrid(revenueRow(["10", "20", "30", "11", "21", "31"]), [
    { label: "FY2025E", group: "Base case" },
    { label: "FY2026E", group: "Base case" },
    { label: "FY2027E", group: "Base case" },
    { label: "FY2025E", group: "Downside case" },
    { label: "FY2026E", group: "Downside case" },
    { label: "FY2027E", group: "Downside case" },
  ]);
  showColumns("All cases");
  expect(within(rowOf("Revenue")).queryByRole("img")).toBeNull();
});

it("leads with no actual column where a fiscal year stands beside a dated period", () => {
  renderGrid(revenueRow(["90", "95", "100", "110"]), [
    { label: "FY2025", group: "Fiscal year" },
    { label: "2025-06-30", group: "Interim" },
    { label: "FY2026E", group: "Base case" },
    { label: "FY2027E", group: "Base case" },
  ]);
  expect(headersOf()).toEqual(["Measure", "Forecast · Base case", "Trace", "FY2026E", "FY2027E"]);
  showColumns("History");
  expect(headersOf().slice(-2)).toEqual(["FY2025", "2025-06-30"]);
});

it("finds a year missing inside a case's span from the years the rule reads", () => {
  renderGrid(revenueRow(["100", "120"]), [
    { label: "2026F", group: "Base case" },
    { label: "FY28E", group: "Base case" },
  ]);
  expect(headersOf().slice(3)).toEqual(["2026F", "FY2027E", "FY28E"]);
  expect(
    within(rowOf("Revenue"))
      .getAllByRole("cell")
      .slice(0, 3)
      .map((cell) => cell.getAttribute("aria-label") ?? cell.textContent),
  ).toEqual(["100", "Not published This case publishes no FY2027E column.", "120"]);
});
