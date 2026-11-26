import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { PublishedRun } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";

type View = ReturnType<typeof buildReportView>;
const run = { folder: "current" } as PublishedRun;
const value = (exact: string) => ({ status: "value", exact, display: exact });

type Columns = { label: string; group: string }[];
function gridOf(columns: Columns, rows: Record<string, unknown[]>) {
  return {
    columns,
    rows: Object.entries(rows).map(([label, cells]) => ({
      label,
      band: "Cash",
      kind: "money",
      total: false,
      cells,
    })),
  };
}

function viewOf(
  columns: Columns,
  rows: Record<string, unknown[]>,
  other?: ReturnType<typeof gridOf>,
) {
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
      ...gridOf(columns, rows),
      ...(other ? { other } : {}),
    },
  };
  return {
    catalogue: undefined,
    lead: undefined,
    entries: [],
    modules: [],
    models: [model],
  } as View;
}

const CASH_PROXY = "Cash proxy (not issuer free cash flow)";

const caseButtons = () =>
  within(screen.getByRole("group", { name: "Case" })).getAllByRole("button");
/** The selected case's cash proxy figure, drawn in the header under the case switch. */
const caseFigure = () => screen.getByLabelText("Selected case cash proxy");
/** The figure with its description and reason. */
const caseCard = () => caseFigure().parentElement as HTMLElement;
/** The case the figure names: "Cash proxy, <case> · <unit>". */
const figureName = () =>
  /^Cash proxy, (.*) · \$m$/u.exec(within(caseFigure()).getByRole("term").textContent)?.[1] ?? "";
/** Each case's figure, selected in turn with the case switch. */
function eachCase<T>(read: (name: string) => T): T[] {
  return caseButtons().map((button) => {
    fireEvent.click(button);
    return read(button.textContent);
  });
}
const selectByName = (name: string) =>
  fireEvent.click(caseButtons().find((button) => button.textContent === name) as HTMLElement);
/** The name of the case whose cash proxy figure shows `figure`. */
const caseShowing = (figure: string) => {
  const [name] = eachCase((label) =>
    within(caseFigure()).queryByText(figure) ? label : undefined,
  ).filter((label) => label !== undefined);
  if (!name) throw new Error(`No case figure shows ${figure}`);
  return name;
};
// These models publish no net leverage, so each case's button is named with that notice.
const selectCase = (name: string) =>
  fireEvent.click(
    within(screen.getByRole("group", { name: "Case" })).getByRole("button", {
      name: name,
    }),
  );

it("shows each same-label case's own columns and marks its own cash proxy row current", () => {
  const view = viewOf(
    ["Base case", "Upside", "Upside case"].flatMap((group) => [
      { label: "FY2027E", group },
      { label: "FY2028E", group },
    ]),
    {
      [CASH_PROXY]: ["10", "12", "21", "22", "31", "32"].map(value),
      Revenue: ["100", "101", "202", "203", "304", "305"].map(value),
    },
  );
  render(<Forecast view={view} run={run} />);
  const names = eachCase(figureName);
  expect(new Set(names).size).toBe(3);
  const buttons = caseButtons();
  expect(new Set(buttons.map((button) => button.textContent)).size).toBe(3);

  for (const [figure, own, peer, ownProxy] of [
    ["22", ["202", "203"], ["304", "305"], "22"],
    ["32", ["304", "305"], ["202", "203"], "32"],
  ] as const) {
    const name = caseShowing(figure);
    selectByName(name);
    expect(
      within(screen.getByRole("group", { name: "Case" }))
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-pressed") === "true"),
    ).toHaveLength(1);
    const statement = within(screen.getByRole("table", { name: "Forecast grid" }));
    for (const cell of own) expect(statement.getByRole("cell", { name: cell })).toBeInTheDocument();
    for (const cell of [...peer, "100", "101"])
      expect(statement.queryByRole("cell", { name: cell })).toBeNull();
    // The selected case's own cash proxy, in the header figure and in the grid's row.
    expect(figureName()).toBe(name);
    expect(within(caseFigure()).getByText(ownProxy)).toBeInTheDocument();
    const proxyRow = statement.getByRole("rowheader", { name: CASH_PROXY }).closest("tr");
    expect(
      within(proxyRow as HTMLElement).getByRole("cell", { name: ownProxy }),
    ).toBeInTheDocument();
  }
});

it("matches the selected case by raw group where the other grid is drawn as its own statement", () => {
  const periods = ["FY2027E", "FY2028E"];
  // The other grid has different rows, so the statement draws each grid alone: the main grid's
  // "Upside" has its same-label peer, "Upside case", only in the other grid.
  const view = viewOf(
    ["Base case", "Upside"].flatMap((group) => periods.map((label) => ({ label, group }))),
    {
      [CASH_PROXY]: ["10", "12", "21", "22"].map(value),
      Revenue: ["100", "101", "202", "203"].map(value),
    },
    gridOf(
      periods.map((label) => ({ label, group: "Upside case" })),
      { [CASH_PROXY]: ["31", "32"].map(value) },
    ),
  );
  render(<Forecast view={view} run={run} />);
  selectCase(caseShowing("22"));
  const statement = within(screen.getByRole("table", { name: "Forecast grid" }));
  for (const cell of ["202", "203"])
    expect(statement.getByRole("cell", { name: cell })).toBeInTheDocument();
  for (const cell of ["100", "101"])
    expect(statement.queryByRole("cell", { name: cell })).toBeNull();
});

it("draws no period line on a case card that has only its placeholder column", () => {
  const reason = "no downside case was computed in this run";
  const view = viewOf(
    [
      { label: "FY2027E", group: "Base case" },
      { label: "FY2028E", group: "Base case" },
      { label: "Downside", group: "Downside case" },
    ],
    {
      [CASH_PROXY]: [
        value("10"),
        value("12"),
        { status: "na", exact: null, display: "n.a.", reason },
      ],
    },
  );
  render(<Forecast view={view} run={run} />);
  selectCase("Base case");
  expect(caseCard()).toHaveTextContent("FY2028E");
  selectCase("Downside case");
  const downside = caseCard();
  expect(downside).toHaveTextContent("n.a.");
  expect(downside).toHaveTextContent(reason);
  expect([...downside.querySelectorAll("span")].map((span) => span.textContent)).not.toContain(
    "Downside",
  );
});

it("draws no module code in a case name on the Forecast page", () => {
  const view = viewOf(
    ["Base case", "Downside (CP-2G drivers)", "Downside drivers"].map((group) => ({
      label: "FY2027E",
      group,
    })),
    { [CASH_PROXY]: ["10", "7", "8"].map(value) },
  );
  const { container } = render(<Forecast view={view} run={run} />);
  expect(eachCase(figureName).filter((name) => name.startsWith("Downside drivers"))).toHaveLength(
    2,
  );
  expect(
    within(screen.getByRole("group", { name: "Case" }))
      .getAllByRole("button")
      .filter((button) => button.textContent.startsWith("Downside drivers")),
  ).toHaveLength(2);
  expect(container.textContent).not.toMatch(/CP-/);
});

const cardNames = () => eachCase(figureName);

/** The main grid's one-year comparison: one column per case, named by the case. The main grid
 * is drawn first; an other grid of a single case offers no comparison. */
function showComparisonColumns() {
  const [controls] = screen.getAllByRole("group", { name: "Grid columns" });
  fireEvent.click(
    within(controls as HTMLElement).getByRole("button", { name: "Compare one year" }),
  );
  const [, columns] = within(screen.getByRole("table", { name: "Forecast grid" })).getAllByRole(
    "row",
  );
  return within(columns as HTMLElement)
    .getAllByRole("columnheader")
    .map((header) => header.textContent);
}

it("shows a case whose label no other case shares exactly as published", () => {
  // "CP" is also commercial paper: nothing rewrites a label because it starts that way.
  const groups = ["Base case", "CP-backstop downside", "Downside (CP-funded)", "CP-10"];
  const view = viewOf(
    groups.flatMap((group) => [
      { label: "FY2027E", group },
      { label: "FY2028E", group },
    ]),
    { [CASH_PROXY]: ["10", "12", "7", "8", "5", "6", "3", "4"].map(value) },
  );
  render(<Forecast view={view} run={run} />);
  const published = [...groups].sort();
  expect(cardNames().sort()).toEqual(published);
  expect(showComparisonColumns().sort()).toEqual(published);
  const statement = within(screen.getByRole("table", { name: "Forecast grid" }));
  for (const group of groups)
    expect(statement.getByRole("columnheader", { name: group })).toBeInTheDocument();
});

it("names two same-label cases apart, the same in the cards, statement, comparison and trends", () => {
  const periods = ["FY2027E", "FY2028E"];
  // The other grid has different rows, so the statement draws each grid as its own table.
  const view = viewOf(
    ["Base case", "Upside"].flatMap((group) => periods.map((label) => ({ label, group }))),
    {
      [CASH_PROXY]: ["10", "12", "21", "22"].map(value),
      Revenue: ["100", "101", "202", "203"].map(value),
    },
    gridOf(
      periods.map((label) => ({ label, group: "Upside case" })),
      { [CASH_PROXY]: ["31", "32"].map(value) },
    ),
  );
  render(<Forecast view={view} run={run} />);
  const nameOn = caseShowing;
  const upside = nameOn("22");
  const upsideCase = nameOn("32");
  expect(upside).not.toBe(upsideCase);

  selectCase(upside);
  const main = within(screen.getByRole("table", { name: "Forecast grid" }));
  expect(main.getByRole("columnheader", { name: `Forecast · ${upside}` })).toBeInTheDocument();
  // The one-year comparison of the line items names the cases as the switch does; the other
  // grid's case is its own statement.
  expect(showComparisonColumns()).toEqual(["Base case", upside]);
  expect(main.getByRole("rowheader", { name: "Revenue" })).toBeInTheDocument();
  expect(cardNames().sort()).toEqual(["Base case", upside, upsideCase].sort());

  selectCase(upsideCase);
  const other = within(screen.getByRole("table", { name: "Other forecast cases" }));
  expect(other.getByRole("columnheader", { name: `Forecast · ${upsideCase}` })).toBeInTheDocument();

  // The raw group as reader text tells "Upside" apart; "Upside case" would only repeat the
  // label, so it takes a worded ordinal by raw-group order.
  expect([upside, upsideCase]).toEqual(["Upside case · Upside", "Upside case · second case"]);
});

it("adds no module code or number to a name it generates", () => {
  const view = viewOf(
    ["Base case", "Downside (CP-2G drivers)", "Downside drivers"].flatMap((group) => [
      { label: "FY2027E", group },
      { label: "FY2028E", group },
    ]),
    { [CASH_PROXY]: ["10", "12", "7", "8", "5", "6"].map(value) },
  );
  render(<Forecast view={view} run={run} />);
  const names = cardNames().sort();
  expect(names).toEqual([
    "Base case",
    "Downside drivers · Downside (Forward credit model drivers)",
    "Downside drivers · second case",
  ]);
  for (const name of names) expect(name).not.toMatch(/CP-|\d/);
  expect(showComparisonColumns().sort()).toEqual(names);
});

it("opens on the case the model marks as its base case, whatever order the cases are listed in", () => {
  const columns = ["Upside: asset sale completed", "Base case", "Downside case"].map((group) => ({
    label: "FY2025E",
    group,
  }));
  render(
    <Forecast
      view={viewOf(columns, { [CASH_PROXY]: [value("150"), value("120"), value("90")] })}
      run={run}
    />,
  );
  const pressed = caseButtons().find((button) => button.getAttribute("aria-pressed") === "true");
  expect(pressed).toHaveTextContent("Base case");
  expect(caseFigure()).toHaveTextContent("120");
});

it("opens on the first listed case when the model marks none as base", () => {
  const columns = ["Upside", "Downside case"].map((group) => ({ label: "FY2025E", group }));
  render(
    <Forecast view={viewOf(columns, { [CASH_PROXY]: [value("150"), value("90")] })} run={run} />,
  );
  expect(caseButtons()[0]).toHaveAttribute("aria-pressed", "true");
});

it("hatches no case when the page reads no net leverage row, and says why once, as the lead does", () => {
  const columns = ["Base case", "Downside case"].map((group) => ({ label: "FY2025E", group }));
  render(
    <Forecast
      view={viewOf(columns, {
        [CASH_PROXY]: [value("120"), value("90")],
        "Net leverage (covenant basis)": [value("2.1"), value("2.6")],
        "Net leverage (gross)": [value("2.4"), value("2.9")],
      })}
      run={run}
    />,
  );
  for (const button of caseButtons()) expect(button.getAttribute("aria-label")).toBeNull();
  expect(screen.queryByText(/^Hatched/)).toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Net leverage path" })).getByText(
      /^The model publishes 2 net leverage rows/,
    ),
  ).toBeInTheDocument();
});
