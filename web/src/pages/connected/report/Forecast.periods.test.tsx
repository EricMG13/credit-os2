import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { PublishedRun } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";

type View = ReturnType<typeof buildReportView>;
const run = { folder: "current" } as PublishedRun;
const CASH_PROXY = "Cash proxy (not issuer free cash flow)";
const value = (exact: string) => ({ status: "value", exact, display: exact });

type Column = { label: string; group: string; start?: string; end?: string };

/** The Forecast page for one model: each case's periods, then each row's cells in column order. */
function page(columns: Column[], rows: Record<string, unknown[]>) {
  const model = {
    id: "model",
    issuerKey: "issuer",
    runId: "current",
    runFolder: "current",
    href: "",
    download: "",
    sources: [],
    cashflow: {
      units: "USD millions",
      limits: [],
      columns,
      rows: Object.entries(rows).map(([label, cells]) => ({
        label,
        band: "Cash",
        kind: "money",
        total: false,
        cells,
      })),
    },
  };
  const view = {
    catalogue: undefined,
    lead: undefined,
    entries: [],
    modules: [],
    models: [model],
  } as View;
  return render(<Forecast view={view} run={run} />);
}

const columnsOf = (cases: Record<string, string[]>): Column[] =>
  Object.entries(cases).flatMap(([group, periods]) => periods.map((label) => ({ label, group })));
const calendarYear = (label: string) => {
  const year = label.slice(2, 6);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
};

/** The grid's notice about the cases' periods, drawn above it in every column view. */
const gridNotice = () =>
  within(screen.getByRole("region", { name: "Forecast grid" })).getByRole("status");
/** The selected case's cash proxy figure in the header, with its notice. */
const caseFigure = () => screen.getByLabelText("Selected case cash proxy");
const caseCard = () => caseFigure().parentElement as HTMLElement;
const caseButton = (name: string) =>
  within(screen.getByRole("group", { name: "Case" })).getByRole("button", {
    name: name,
  });
const compareOneYear = () =>
  fireEvent.click(
    within(screen.getByRole("group", { name: "Grid columns" })).getByRole("button", {
      name: "Compare one year",
    }),
  );
const allCases = () =>
  fireEvent.click(
    within(screen.getByRole("group", { name: "Grid columns" })).getByRole("button", {
      name: "All cases",
    }),
  );
const selectYear = (year: string) =>
  fireEvent.click(
    within(screen.getByRole("group", { name: "Year" })).getByRole("button", { name: year }),
  );
/** The forecast grid's column names, under their bands. */
const gridColumns = () => {
  const [, columns] = within(screen.getByRole("table", { name: "Forecast grid" })).getAllByRole(
    "row",
  );
  return within(columns as HTMLElement)
    .getAllByRole("columnheader")
    .map((cell) => cell.textContent);
};
/** A row's figure cells in the forecast grid, in column order, as the reader reads them: a gap
 * cell's recorded reason with its word. The row's trace cell follows them. */
const gridCells = (row: string) =>
  within(
    within(screen.getByRole("table", { name: "Forecast grid" }))
      .getByRole("rowheader", { name: row })
      .closest("tr") as HTMLElement,
  )
    .getAllByRole("cell")
    .slice(0, gridColumns().length)
    .map((cell) => cell.getAttribute("aria-label") ?? cell.textContent);

const NO_COMMON_PERIOD =
  "The cases publish no period in common, so no scenario comparison is drawn.";
const ANY_OMISSION = /omitted|left out|cannot be compared/i;

it("draws no comparison of cases that publish no period in common, and says so", () => {
  const { container } = page(
    columnsOf({
      "Base case": ["FY2026E", "FY2027E"],
      "Downside case": ["FY2028E", "FY2029E"],
    }),
    {
      [CASH_PROXY]: ["10", "11", "5", "6"].map(value),
      Revenue: ["100", "101", "80", "81"].map(value),
    },
  );

  // No comparison is offered in the grid and no other case's line is drawn.
  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(screen.queryByRole("img", { name: /^Net leverage by case/ })).toBeNull();
  expect(screen.queryByText(/^Cash proxy values/)).toBeNull();
  expect(gridNotice()).toHaveTextContent(NO_COMMON_PERIOD);
  expect(within(caseCard()).getByRole("status")).toHaveTextContent(NO_COMMON_PERIOD);
  // Nothing was excluded, so nothing says a period is omitted, and no cell is drawn as unpublished.
  expect(container.textContent).not.toMatch(ANY_OMISSION);
  expect(container.textContent).not.toContain("Not published");

  // Each case's own figures stay: its figure in the header, and its own columns in the grid.
  const base = caseFigure();
  expect(base).toHaveTextContent("Cash proxy, Base case");
  expect(within(base).getByText("11")).toBeInTheDocument();
  expect(base).toHaveTextContent("FY2027E");
  const statement = () => within(screen.getByRole("table", { name: "Forecast grid" }));
  for (const cell of ["100", "101"])
    expect(statement().getByRole("cell", { name: cell })).toBeInTheDocument();
  fireEvent.click(caseButton("Downside case"));
  const downside = caseFigure();
  expect(downside).toHaveTextContent("Cash proxy, Downside case");
  expect(within(downside).getByText("6")).toBeInTheDocument();
  expect(downside).toHaveTextContent("FY2029E");
  for (const cell of ["80", "81"])
    expect(statement().getByRole("cell", { name: cell })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(gridNotice()).toHaveTextContent(NO_COMMON_PERIOD);
});

it("compares the shared periods and names the period left out, without saying the cases cannot be compared", () => {
  const { container } = page(
    [
      ...["FY2026E", "FY2027E", "FY2028E"].map((label) => ({
        label,
        group: "Base case",
        ...calendarYear(label),
      })),
      ...["FY2026E", "FY2027E"].map((label) => ({
        label,
        group: "Downside case",
        ...calendarYear(label),
      })),
      { label: "FY2028E", group: "Downside case", start: "2028-07-01", end: "2028-12-31" },
    ],
    {
      [CASH_PROXY]: ["10", "11", "12", "5", "6", "7"].map(value),
      Revenue: ["100", "101", "102", "80", "81", "82"].map(value),
    },
  );

  expect(container.textContent).not.toMatch(/cannot be compared|omitted|no period in common/i);
  const leftOut =
    "Periods left out of the scenario comparison: FY2028E (recorded start and end dates do not match between cases, or are incomplete or invalid).";
  const notices = screen.getAllByRole("status").map((status) => status.textContent);
  // Under the selected case's figure and above the grid, in every column view.
  expect(notices.filter((text) => text === leftOut)).toHaveLength(2);
  expect(within(caseCard()).getByRole("status").textContent).toBe(leftOut);
  expect(gridNotice().textContent).toBe(leftOut);

  compareOneYear();
  expect(gridNotice().textContent).toBe(leftOut);
  const periods = within(screen.getByRole("group", { name: "Year" }));
  expect(periods.getAllByRole("button").map((option) => option.textContent)).toEqual([
    "FY2026E",
    "FY2027E",
  ]);
  // The shared years compared case by case: the cash proxy of each case, the Downside case's
  // own 5 and 6.
  expect(gridColumns()).toEqual(["Base case", "Downside case"]);
  selectYear("FY2026E");
  expect(gridCells(CASH_PROXY)).toEqual(["10", "5"]);
  selectYear("FY2027E");
  expect(gridCells(CASH_PROXY)).toEqual(["11", "6"]);
});

it("says nothing is omitted when no case is selected and the cases share no period", () => {
  // No cash proxy row, so the page has no case cards and no selected case.
  const { container } = page(
    columnsOf({
      "Base case": ["FY2026E", "FY2027E"],
      "Downside case": ["FY2028E", "FY2029E"],
    }),
    { Revenue: ["100", "101", "80", "81"].map(value) },
  );
  expect(screen.queryByRole("radiogroup", { name: "Forecast case" })).toBeNull();
  expect(container.textContent).not.toMatch(ANY_OMISSION);
  expect(gridNotice()).toHaveTextContent(NO_COMMON_PERIOD);
  // No line-item comparison is drawn over columns each case leaves blank for the other.
  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(screen.queryByRole("figure", { name: "Revenue" })).toBeNull();
});

it("names an excluded period when no case is selected, and still draws no comparison", () => {
  const { container } = page(
    [
      ...columnsOf({
        "Base case": ["FY2026E", "FY2027E"],
        "Downside case": ["FY2028E", "FY2029E"],
      }),
      { label: "FY2030E", group: "Base case", start: "2030-01-01", end: "2030-12-31" },
      { label: "FY2030E", group: "Downside case", start: "2030-07-01", end: "2030-12-31" },
    ],
    { Revenue: ["100", "101", "80", "81", "110", "90"].map(value) },
  );
  expect(gridNotice()).toHaveTextContent(
    "Periods left out of the scenario comparison: FY2030E (recorded start and end dates do not match between cases, or are incomplete or invalid). No other period is published by more than one case, so no scenario comparison is drawn.",
  );
  expect(screen.queryByRole("button", { name: "Compare one year" })).toBeNull();
  expect(screen.queryByRole("figure", { name: "Revenue" })).toBeNull();
  expect(container.textContent).not.toMatch(/omitted|cannot be compared|no period in common/i);
});

it("marks a period a case does not publish apart from a figure it publishes as unavailable", () => {
  page(
    columnsOf({
      "Base case": ["FY2026E", "FY2027E", "FY2028E", "FY2029E", "FY2030E"],
      "Downside case": ["FY2026E", "FY2027E", "FY2028E"],
    }),
    {
      [CASH_PROXY]: [
        ...["10", "11", "12", "13", "14"].map(value),
        value("5"),
        { status: "na", exact: null, display: "n.a.", reason: "Not calculable" },
        { status: "na", exact: null, display: "n.a." },
      ],
    },
  );
  // Year by year, the Downside case's cash proxy beside the base case's: its figure, its
  // recorded reason, a cell without one, then the years it does not publish.
  compareOneYear();
  expect(gridColumns()).toEqual(["Base case", "Downside case"]);
  const downside = (years: string[]) =>
    years.map((year) => {
      selectYear(year);
      const [base, cell] = gridCells(CASH_PROXY);
      expect(base).not.toBe("Not published");
      return cell;
    });
  expect(downside(["FY2026E", "FY2027E", "FY2028E"])).toEqual(["5", "n.a. Not calculable", "n.a."]);
  // Every case over every kept year: the years only the base case publishes read Not published
  // for the Downside case, apart from its figure, its recorded reason and its cell without one.
  allCases();
  expect(gridCells(CASH_PROXY)).toEqual([
    ...["10", "11", "12", "13", "14"],
    "5",
    "n.a. Not calculable",
    "n.a.",
    "Not published This case publishes no FY2029E column.",
    "Not published This case publishes no FY2030E column.",
  ]);
});

it("marks an unpublished period in the line-item comparison when no case is selected", () => {
  page(
    columnsOf({
      "Base case": ["FY2026E", "FY2027E", "FY2028E"],
      "Downside case": ["FY2026E", "FY2027E"],
    }),
    { Revenue: ["100", "101", "102", "80", "81"].map(value) },
  );
  // The grid's one-year comparison, year by year: [Base case, Downside case].
  compareOneYear();
  expect(gridColumns()).toEqual(["Base case", "Downside case"]);
  const revenue = (years: string[]) =>
    years.map((year) => {
      selectYear(year);
      return gridCells("Revenue");
    });
  expect(revenue(["FY2026E", "FY2027E"])).toEqual([
    ["100", "80"],
    ["101", "81"],
  ]);
  // The year only the base case publishes: the Downside case reads Not published.
  allCases();
  expect(gridCells("Revenue")).toEqual([
    "100",
    "101",
    "102",
    "80",
    "81",
    "Not published This case publishes no FY2028E column.",
  ]);
});

it("says why more than six cases are not charted, and nothing about their periods", () => {
  const groups = ["Base case", ...["A", "B", "C", "D", "E", "F"].map((name) => `Case ${name}`)];
  const { container } = page(
    groups.flatMap((group) => [
      { label: "FY2026E", group },
      { label: "FY2027E", group },
    ]),
    { [CASH_PROXY]: groups.flatMap((_, index) => [String(index), String(index + 10)]).map(value) },
  );
  const tooMany = "More than six cases are published, so the cash proxy comparison is not drawn.";
  expect(within(caseCard()).getByRole("status")).toHaveTextContent(tooMany);
  expect(screen.queryByRole("figure", { name: "Cash proxy by scenario" })).toBeNull();
  // Every period is shared and none is excluded: no notice says otherwise.
  expect(container.textContent).not.toMatch(/period basis|omitted|left out|in common/i);
  expect(screen.getByRole("button", { name: "Compare one year" })).toBeInTheDocument();
});
