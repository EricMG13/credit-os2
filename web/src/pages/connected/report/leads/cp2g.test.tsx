import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry } from "../overview/rows.fixture";
import { ForwardLead } from "./cp2g";
import { bottomLine, leadProps } from "./lead.fixture";
import { fixtureEntry, retained } from "./markdown.fixture";

afterEach(cleanup);

// Outdated evidence: TransDigm as of 2024-09-30; sol-high-001-resume drivers, sol-medium declined.
const high = () =>
  fixtureEntry("CP-2G", retained("tdg_sol_high_2026_11_13", "CP-2G-forecast-block.md"));
const declined = () =>
  fixtureEntry("CP-2G", retained("sol_medium_run_2026_11_09", "CP-2G-forecast-block.md"));

const cell = (display: string, exact: string | null) =>
  exact === null
    ? { exact, display, reason: "the inputs do not state this period", status: "na" }
    : { exact, display, reason: null, status: "value" };

// A synthetic calculation-JSON grid in the shape the model publishes (cashflow.py).
const model = {
  cashflow: {
    columns: [
      { label: "LTM", group: "Last twelve months", start: null, end: null },
      { label: "FY2025E", group: "Base case", start: "2025-04-01", end: "2026-03-31" },
      { label: "FY2026E", group: "Base case", start: "2026-04-01", end: "2027-03-31" },
      { label: "FY2025E", group: "Downside case", start: "2025-04-01", end: "2026-03-31" },
      { label: "FY2026E", group: "Downside case", start: "2026-04-01", end: "2027-03-31" },
    ],
    rows: [
      {
        band: "Credit metrics",
        label: "Net leverage (net debt / Adj EBITDA)",
        kind: "multiple",
        total: false,
        cells: [
          cell("n.a.", null),
          cell("5.90x", "5.9"),
          cell("n.a.", null),
          cell("6.40x", "6.4"),
          cell("7.10x", "7.1"),
        ],
      },
    ],
    limits: ["Arithmetic over stated inputs; not analytical review."],
  },
};

it("draws net leverage by case as the model displays it, the highest year, the gap period and the link", () => {
  render(<ForwardLead {...leadProps(high(), [], [model])} />);
  const tile = screen.getByRole("region", { name: "Net leverage path" });
  expect(tile.className).toMatch(/lg:col-span-12/);
  // Ruling (a): a subject name, no reading assembled by the page.
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(
    /^Net leverage by case$/,
  );
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(
    /Base case: FY2025E 5\.90x, FY2026E no figure\. Downside case: FY2025E 6\.40x, FY2026E 7\.10x/,
  );
  for (const text of ["5.90x", "6.40x", "7.10x"])
    expect(within(figure).getByText(text)).toBeInTheDocument();
  expect(figure.querySelectorAll("[data-gap]")).toHaveLength(1);
  // F8: no peak mark, no "peaks at"; the highest year only where a case publishes two or more.
  expect(figure.querySelector("[data-peak]")).toBeNull();
  expect(tile.textContent).not.toMatch(/peak/i);
  expect(
    within(tile).getByText("Highest published forecast year, Downside case: 7.10x (FY2026E)."),
  ).toBeVisible();
  expect(within(tile).queryByText(/Highest published forecast year, Base case/)).toBeNull();
  expect(within(figure).queryByText("0")).toBeNull();
  const gap = within(tile).getByText("Base case, FY2026E").parentElement as HTMLElement;
  expect(within(gap).getByText("n.a.")).toHaveClass("border-dashed");
  expect(within(gap).getByText("The inputs do not state this period")).toBeVisible();
  // The covenant module owns limits, and the model's own limits are not a reader's note.
  expect(tile.textContent).not.toMatch(/limit|Arithmetic over stated inputs|methodology/i);
  const link = within(tile).getByRole("link", { name: "Open the forecast" });
  expect(link).toHaveAttribute("href", "#forecast");
  expect(link).toHaveClass("min-h-11", "outline-focus-ring", "focus-visible:outline-2");
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("row", { name: /Downside case/ })).toHaveTextContent("7.10x");
});

it("labels a retained test-preview high year as calculated, not published", () => {
  const cashflow = structuredClone(model.cashflow);
  cashflow.columns.push({
    label: "FY2027E",
    group: "Downside case",
    start: "2027-04-01",
    end: "2028-03-31",
  });
  const [row] = cashflow.rows;
  if (!row) throw new Error("one row");
  row.cells.push(cell("n.a.", null));
  const props = leadProps(high(), [], []);
  props.view = {
    ...props.view,
    previewForecast: {
      foundationDigest: "a".repeat(64),
      forecastDigest: props.entry.output.sha256,
      handoff: props.entry,
      cashflow,
      reconciliation: "Retained inputs; deterministic calculation replay.",
      calculationLine: 286,
    },
  };
  render(<ForwardLead {...props} />);
  const tile = screen.getByRole("region", { name: "Net leverage path" });
  expect(
    within(tile).getByText(
      "Highest calculated forecast year, Downside case: 7.10x (FY2026E); no calculated figure for FY2027E.",
    ),
  ).toBeVisible();
  expect(within(tile).queryByText(/Highest published forecast year/)).toBeNull();
  expect(within(tile).getByText("Test preview calculation")).toBeVisible();
});

// The real model publishes the upside case in `cashflow.other` (cashflow.py main_cases); the
// figures are the replayed TDG forecast's own (net leverage 4.86x, 3.96x, 3.19x for FY2025-27).
it("draws the upside case the model publishes in its other grid, beside the main grid's cases", () => {
  const withUpside = {
    cashflow: {
      ...model.cashflow,
      other: {
        columns: [
          { label: "FY2025E", group: "Upside", start: "2025-04-01", end: "2026-03-31" },
          { label: "FY2026E", group: "Upside", start: "2026-04-01", end: "2027-03-31" },
        ],
        rows: [
          {
            band: "Credit metrics",
            label: "Net leverage (net debt / Adj EBITDA)",
            kind: "multiple",
            total: false,
            cells: [cell("4.86x", "4.8593"), cell("3.96x", "3.9612")],
          },
        ],
      },
    },
  };
  render(<ForwardLead {...leadProps(high(), [], [withUpside])} />);
  const tile = screen.getByRole("region", { name: "Net leverage path" });
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(/Upside: FY2025E 4\.86x, FY2026E 3\.96x/);
  expect(figure.querySelector("[data-columns]")).toHaveAttribute("data-columns", "3");
  for (const text of ["4.86x", "3.96x"]) expect(within(figure).getByText(text)).toBeInTheDocument();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("row", { name: /Upside/ })).toHaveTextContent("3.96x");
});

it("draws every panel's text at 12px and one column per case", () => {
  render(<ForwardLead {...leadProps(high(), [], [model])} />);
  const figure = within(screen.getByRole("region", { name: "Net leverage path" })).getByRole("img");
  const svg = figure.querySelector("svg") as SVGSVGElement;
  // The view box is the drawn width: user units are CSS pixels.
  expect(svg.getAttribute("viewBox")).toBe(`0 0 ${String(svg.getAttribute("width"))} 232`);
  // Review 4, Q6: the plot itself, from the lowest gridline to the highest, is at least 160px tall.
  const grid = [...svg.querySelectorAll("line.stroke-border-hairline")].map((line) =>
    Number(line.getAttribute("y1")),
  );
  expect(Math.max(...grid) - Math.min(...grid)).toBeGreaterThanOrEqual(160);
  for (const text of figure.querySelectorAll("text"))
    expect(text).toHaveAttribute("font-size", "12");
  expect(figure.querySelector("[data-columns]")).toHaveAttribute("data-columns", "2");
  expect(figure.querySelector("[data-columns]")).toHaveClass("@xl:grid-cols-2");
  expect(figure.querySelector("[data-columns]")).not.toHaveClass("@4xl:grid-cols-3");
});

it("names ties as ties on the displayed figures, and names the years with no published figure", () => {
  const tied = structuredClone(model);
  tied.cashflow.columns.push({
    label: "FY2027E",
    group: "Downside case",
    start: "2027-04-01",
    end: "2028-03-31",
  });
  const [row] = tied.cashflow.rows;
  if (!row) throw new Error("one row");
  // 7.104 and 7.096 both display 7.10x: a tie on what the reader sees, whatever the exact values.
  row.cells[3] = cell("7.10x", "7.104");
  row.cells[4] = cell("7.10x", "7.096");
  row.cells.push(cell("n.a.", null));
  render(<ForwardLead {...leadProps(high(), [], [tied])} />);
  expect(
    screen.getByText(
      "Highest published forecast year, Downside case: 7.10x (FY2025E and FY2026E, tied); no published figure for FY2027E.",
    ),
  ).toBeVisible();
});

it("states no highest year for a single published period", () => {
  const single = structuredClone(model);
  single.cashflow.columns = single.cashflow.columns.slice(0, 2);
  const [row] = single.cashflow.rows;
  if (!row) throw new Error("one row");
  row.cells = row.cells.slice(0, 2);
  render(<ForwardLead {...leadProps(high(), [], [single])} />);
  const tile = screen.getByRole("region", { name: "Net leverage path" });
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/Base case: FY2025E 5\.90x/);
  expect(tile.textContent).not.toMatch(/Highest|peak/i);
});

it("says why when the published model has no net leverage path", () => {
  render(<ForwardLead {...leadProps(high(), [], [{ cashflow: {} }])} />);
  expect(
    within(screen.getByRole("region", { name: "Net leverage path" })).getByText(
      "This page could not read a net leverage path from the published model.",
    ),
  ).toBeVisible();
});

it("states the model's reason, not a read failure, when every net leverage figure is a stated gap", () => {
  const gap = { exact: null, display: "n.m.", reason: "EBITDA is not positive", status: "na" };
  const column = (label: string) => ({
    label,
    group: "Base case",
    start: "2025-04-01",
    end: "2026-03-31",
  });
  const gaps = {
    cashflow: {
      columns: [column("FY2025E"), column("FY2026E")],
      rows: [
        {
          band: "Credit metrics",
          label: "Net leverage",
          kind: "multiple",
          total: false,
          cells: [gap, gap],
        },
      ],
      limits: [],
    },
  };
  render(<ForwardLead {...leadProps(high(), [], [gaps])} />);
  const tile = screen.getByRole("region", { name: "Net leverage path" });
  expect(within(tile).getByText(/EBITDA is not positive/)).toBeVisible();
  expect(tile.textContent).not.toMatch(/could not read a net leverage path/);
});

const gapGrid = (cashflow: Record<string, unknown>) => ({ cashflow });
const netLeverage = (cells: unknown[]) => ({
  band: "Credit metrics",
  label: "Net leverage",
  kind: "multiple",
  total: false,
  cells,
});
const colOf = (label: string, group: string, start: string | null = "2025-04-01") => ({
  label,
  group,
  start,
  end: start && "2026-03-31",
});

it("S16-3-1 names a forecast column's reason, not a history column's", () => {
  const history = {
    exact: null,
    display: "n.a.",
    reason: "the period history does not carry this line",
    status: "na",
  };
  const forecast = {
    exact: null,
    display: "n.m.",
    reason: "not modelled in the calculation record",
    status: "nm",
  };
  const gaps = gapGrid({
    columns: [colOf("FY2024", "Reported", null), colOf("FY2025E", "Base case")],
    rows: [netLeverage([history, forecast])],
    limits: [],
  });
  render(<ForwardLead {...leadProps(high(), [], [gaps])} />);
  const tile = screen.getByRole("region", { name: "Net leverage path" });
  expect(tile.textContent).toContain("not modelled in the calculation record");
  expect(tile.textContent).not.toContain("period history does not carry");
});

it("S16-3-2 draws the upside case when the main grid states no net leverage", () => {
  const nm = { exact: null, display: "n.m.", reason: null, status: "nm" };
  const upside = (exact: string, display: string) => ({
    exact,
    display,
    reason: null,
    status: "value",
  });
  const withUpside = gapGrid({
    columns: [colOf("FY2025E", "Base case"), colOf("FY2026E", "Base case")],
    rows: [netLeverage([nm, nm])],
    limits: [],
    other: {
      columns: [colOf("FY2025E", "Upside"), colOf("FY2026E", "Upside")],
      rows: [netLeverage([upside("4.8", "4.80x"), upside("3.9", "3.90x")])],
    },
  });
  render(<ForwardLead {...leadProps(high(), [], [withUpside])} />);
  const tile = screen.getByRole("region", { name: "Net leverage path" });
  expect(tile.textContent).toMatch(/4\.80x/);
  expect(tile.textContent).not.toMatch(/states no net leverage by period/);
});

it("lists the retained drivers by case and year as stated, inheritance as words", () => {
  render(<ForwardLead {...leadProps(high(), [], [model])} />);
  const tile = screen.getByRole("region", { name: "Drivers by case" });
  const head = within(tile)
    .getAllByRole("columnheader")
    .map((item) => item.textContent);
  expect(head.slice(0, 4)).toEqual([
    "Driver",
    "Base case, 2025",
    "Base case, 2026",
    "Base case, 2027",
  ]);
  expect(head).toContain("Downside drivers, 2027");
  const row = (driver: string, kase: string) => {
    const cells = within(within(tile).getByRole("row", { name: new RegExp(`^${driver}`) }))
      .getAllByRole("cell")
      .map((item) => item.textContent);
    const from = head.indexOf(`${kase}, 2025`) - 1;
    return cells.slice(from, from + 3);
  };
  expect(row("Revenue growth", "Base case")).toEqual(["12%", "12%", "12%"]);
  expect(row("Revenue growth", "Upside case")).toEqual(["16.2%", "16.2%", "16.2%"]);
  expect(row("Revenue growth", "Downside drivers")).toEqual(["0%", "0%", "0%"]);
  expect(row("EBITDA margin", "Base case")).toEqual(["52.56%", "52.56%", "52.56%"]);
  expect(row("EBITDA margin", "Upside case")).toEqual(["As base", "As base", "As base"]);
  expect(row("Interest rate", "Base case")).toEqual(["6.13%", "6.13%", "6.13%"]);
  expect(row("Dividends", "Upside case")).toEqual(["4348", "38", "38"]);
  expect(row("Debt repayment", "Base case")).toEqual(["580", "92", "92"]);
  // Review 6, V1: the contract's rate_increase is the row's proportional cash-interest increase.
  expect(
    within(tile).getByText("Downside shock: EBITDA decline 20%, cash-interest increase 1.84%."),
  ).toBeVisible();
  expect(within(tile).getByText(/Amounts: \$m, as recorded/)).toBeVisible();
});

// Review 4, Q6: below sm the drivers table becomes one card per driver, case × year as a list.
it("gives each driver a card of its case and year values for a phone, the table above sm", () => {
  render(<ForwardLead {...leadProps(high(), [], [model])} />);
  const tile = screen.getByRole("region", { name: "Drivers by case" });
  const table = within(tile).getByRole("region", { name: "Drivers by case table" });
  expect(table.parentElement).toHaveClass("hidden", "sm:block");
  const cards = within(tile).getByRole("list", { name: "Drivers by case, by driver" });
  expect(cards).toHaveClass("sm:hidden");
  const growth = within(cards)
    .getAllByRole("listitem")
    .find((item) => within(item).queryByRole("heading", { name: "Revenue growth" }));
  if (!growth) throw new Error("revenue growth card missing");
  const terms = [...growth.querySelectorAll("dt")].map((item) => item.textContent);
  const values = [...growth.querySelectorAll("dd")].map((item) => item.textContent);
  expect(terms.slice(0, 3)).toEqual(["Base case, 2025", "Base case, 2026", "Base case, 2027"]);
  expect(values.slice(0, 3)).toEqual(["12%", "12%", "12%"]);
  expect(terms).toContain("Upside case, 2025");
  expect(values[terms.indexOf("Upside case, 2025")]).toBe("16.2%");
  const margin = within(cards)
    .getAllByRole("listitem")
    .find((item) => within(item).queryByRole("heading", { name: "EBITDA margin" }));
  if (!margin) throw new Error("margin card missing");
  const marginTerms = [...margin.querySelectorAll("dt")].map((item) => item.textContent);
  const marginValues = [...margin.querySelectorAll("dd")].map((item) => item.textContent);
  expect(marginValues[marginTerms.indexOf("Upside case, 2025")]).toBe("As base");
});

it("states a declined forecast block with the drivers' own reasons, never zeros", () => {
  render(<ForwardLead {...leadProps(declined())} />);
  const tile = screen.getByRole("region", { name: "Drivers by case" });
  expect(within(tile).getByText("The forecast block states no driver values.")).toBeVisible();
  expect(
    within(tile).getByText(
      "Revenue growth: No driver selected before required dependency and forecast-scope gates clear.",
    ),
  ).toBeVisible();
  expect(within(tile).queryByRole("table")).toBeNull();
  expect(within(tile).queryByText("0%")).toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Net leverage path" })).getByText(
      "No forecast model was published for this run.",
    ),
  ).toBeVisible();
});

it("draws nothing for a blocked module", () => {
  const stopped = entry(
    "CP-2G",
    [],
    bottomLine("Not assessable: the downside module was blocked."),
  );
  const { container } = render(<ForwardLead {...leadProps(stopped, [], [model])} />);
  expect(container).toBeEmptyDOMElement();
});

const forecastBlock = (document: Record<string, unknown>) =>
  entry(
    "CP-2G",
    [],
    [
      {
        heading: "Forecast inputs (machine-readable)",
        level: 3,
        line: 1,
        blocks: [
          {
            type: "text",
            line: 3,
            end: 5,
            text: `\`\`\`json\n${JSON.stringify(document)}\n\`\`\``,
          },
        ],
      },
    ],
  );

it("shows a negative share driver as a percentage, its digits unrounded", () => {
  const made = forecastBlock({
    currency: "USD",
    scale: 1,
    years: [{ year: 2025 }, { year: 2026 }, { year: 2027 }],
    base_drivers: { revenue_growth: { values: ["0.12", "0.12", "0.12"] } },
    downside_drivers: { revenue_growth: { values: ["-0.05", "-0.025", "0"] } },
  });
  render(<ForwardLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Drivers by case" });
  const growth = within(tile).getByRole("row", { name: /^Revenue growth/ });
  expect(
    within(growth)
      .getAllByRole("cell")
      .map((item) => item.textContent),
  ).toEqual(["12%", "12%", "12%", "-5%", "-2.5%", "0%"]);
  expect(within(tile).getByText(/Shares are shown as percentages/)).toBeVisible();
});

it("counts driver values beyond the stated years and prints a tiny decimal as a decimal", () => {
  const made = forecastBlock({
    currency: "USD",
    scale: 1,
    years: [{ year: 2025 }, { year: 2026 }],
    base_drivers: {
      revenue_growth: { values: [0.0000001, "0.12", "0.12", "0.12"] },
      dividends: { values: [0.0000001, 38] },
    },
  });
  render(<ForwardLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Drivers by case" });
  const growth = within(tile).getByRole("row", { name: /^Revenue growth/ });
  expect(
    within(growth)
      .getAllByRole("cell")
      .map((item) => item.textContent),
  ).toEqual(["0.00001%", "12%"]);
  const dividends = within(tile).getByRole("row", { name: /^Dividends/ });
  expect(
    within(dividends)
      .getAllByRole("cell")
      .map((item) => item.textContent),
  ).toEqual(["0.0000001", "38"]);
  expect(tile.textContent).not.toMatch(/e-7/);
  expect(
    within(tile).getByText(
      "Revenue growth, Base case: 2 values not drawn (beyond the stated years).",
    ),
  ).toBeVisible();
  // The drivers table scrolls inside its own named, focusable region.
  expect(within(tile).getByRole("region", { name: "Drivers by case table" })).toHaveAttribute(
    "tabindex",
    "0",
  );
});

it("prints the downside rate increase as the contract's cash-interest share", () => {
  const made = forecastBlock({
    currency: "USD",
    scale: 1,
    years: [{ year: 2025 }],
    base_drivers: { revenue_growth: { values: ["0.12"] } },
    downside_shock: { ebitda_decline: 0.15, rate_increase: 0.0259 },
  });
  render(<ForwardLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Drivers by case" });
  expect(
    within(tile).getByText("Downside shock: EBITDA decline 15%, cash-interest increase 2.59%."),
  ).toBeVisible();
});
