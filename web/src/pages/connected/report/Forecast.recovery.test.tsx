import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { FORECAST_INPUTS } from "../publishedReport";
import type { Grid } from "../visuals/LegacyForecast";
import type { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";
import { ReportEvidence } from "./Evidence";
import { PublishedTraceProvider } from "./PublishedTrace";
import { forecastTraceContext, RecordedForecastAssumptions } from "./ForecastRecord";

type View = ReturnType<typeof buildReportView>;
const caseButton = (name: string | RegExp) =>
  within(screen.getByRole("group", { name: "Case" })).getByRole("button", { name });
/** The selected case's cash proxy figure, drawn in the header under the case switch. */
const caseFigure = () => screen.getByLabelText("Selected case cash proxy");
/** The read-only figure of one case, with its description, reason and trace: the case is
 * selected with the switch, and the figure names it. */
const caseItem = (name: string) => {
  const button = within(screen.getByRole("group", { name: "Case" }))
    .getAllByRole("button")
    .find((node) => node.textContent === name);
  if (!button) throw new Error(`No case named ${name}`);
  fireEvent.click(button);
  const figure = caseFigure();
  if (!figure.textContent.startsWith(`Cash proxy, ${name} · `))
    throw new Error(`The case figure does not name ${name}`);
  return figure.parentElement as HTMLElement;
};
/** The Revenue row of the forecast grid, with its cells and its trace. */
const revenueRow = () =>
  within(screen.getByRole("table", { name: "Forecast grid" }))
    .getByRole("rowheader", { name: "Revenue" })
    .closest("tr") as HTMLElement;
const traceRevenue = () =>
  fireEvent.click(
    within(screen.getByRole("region", { name: "Forecast grid table" })).getByRole("button", {
      name: "Show sources for Revenue",
    }),
  );
const digest = "a".repeat(64);
const missing = "Not calculable: cash is negative before funding";
const ledger = "Receivables: the forecast inputs do not name the row and period of this line.";
const input = {
  schema_version: "cpos-forecast-inputs/1",
  base: { revenue: { amount: "1000", reason: null }, cash: { amount: "100", reason: null } },
  base_drivers: {
    revenue_growth: {
      values: ["0.05", "0.04"],
      category: "Analyst Interpretation",
      rationale: "Recorded growth.",
      limitation: null,
    },
    interest_rate: {
      values: ["0.06", "0.06"],
      category: "Analyst Interpretation",
      rationale: "Recorded rate.",
      limitation: null,
    },
  },
  downside_shock: { ebitda_decline: "0.20", rate_increase: "0.10" },
  years: [
    { year: 2025, start: "2025-04-01", end: "2026-03-31" },
    { year: 2026, start: "2026-04-01", end: "2027-03-31" },
  ],
  scope_limits: ["Retained synthetic assumptions; not analytical review."],
};
const emptyEvidence = {
  sources: [],
  unused: [],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};
const run = {
  folder: "run",
  asOf: "2025-03-31",
  modules: {},
  evidence: emptyEvidence,
} as unknown as PublishedRun;
const snapshot = {
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
  chips: {},
} as unknown as Snapshot;

function fixture() {
  const source: OutputEntry = {
    selected: true,
    output: {
      id: "forward",
      module: "CP-2G",
      sha256: digest,
      label: "Forward credit model",
      href: "",
    },
    sections: [
      {
        heading: FORECAST_INPUTS,
        level: 3,
        line: 70,
        blocks: [
          {
            type: "text",
            line: 72,
            end: 74,
            text: `\x60\x60\x60json\n${JSON.stringify(input)}\n\x60\x60\x60`,
          },
        ],
      },
    ],
  };
  const cashflow: Grid & { units: string; notes: string[]; limits: string[]; other?: unknown } = {
    units: "USD millions",
    notes: [
      "Base case is a conditional illustration.",
      "Downside case is the stress case: a shock applied to the base-case drivers.",
    ],
    limits: [ledger],
    columns: ["Base case", "Downside case"].flatMap((group) => [
      { label: "FY2026E", group, start: "2025-04-01", end: "2026-03-31" },
      { label: "FY2027E", group, start: "2026-04-01", end: "2027-03-31" },
    ]),
    rows: [
      {
        label: "Revenue",
        band: "Revenue",
        total: false,
        cells: ["1050", "1092", "840", "873.6"].map((exact) => ({
          status: "value",
          exact,
          display: exact,
        })),
      },
      {
        label: "Cash proxy (not issuer free cash flow)",
        band: "Cash",
        total: true,
        cells: ["10.127", "12.345", "5", "6"].map((exact, index) => ({
          status: "value",
          exact,
          display: ["10", "12", "5", "6"][index],
        })),
      },
      {
        label: "Receivables",
        band: "Assets",
        total: false,
        cells: Array.from({ length: 4 }, () => ({
          status: "na",
          exact: null,
          display: "n.a.",
          reason: ledger,
        })),
      },
    ],
  };
  const model = {
    id: "model",
    issuerKey: "issuer",
    runId: "run",
    runFolder: "run",
    href: "",
    download: "",
    sources: [{ output: "forward", sha256: digest, role: "forecast" }],
    cashflow,
  };
  const view: View = {
    entries: [source],
    modules: [],
    models: [model],
    catalogue: undefined,
    lead: undefined,
  };
  return { view, source, model };
}

afterEach(() => vi.unstubAllGlobals());

it("keeps the full model qualification ledger once on Evidence Record, not on Forecast", () => {
  const { view, model } = fixture();
  const drawn = render(<Forecast view={view} run={run} />);
  expect(document.body.textContent).not.toContain(ledger);
  // The tile says once, as a count, where the line-level entries are.
  const scope = within(screen.getByRole("region", { name: "Scope and limits" }));
  expect(
    scope.getByRole("link", { name: "1 line-level entry is in the Evidence record" }),
  ).toHaveAttribute("href", "#evidence/record/notes");
  expect(screen.getByRole("link", { name: "Model notes and limitations" })).toHaveAttribute(
    "href",
    "#evidence/record/notes",
  );
  drawn.unmount();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("not available")));
  const props = {
    snapshot,
    run,
    entries: view.entries,
    target: "record",
    mode: "synthetic" as const,
    models: [model],
  };
  render(<ReportEvidence {...props} />);
  expect(screen.getAllByText(ledger)).toHaveLength(1);
  expect(screen.getByText(/Receivables.*Base case.*FY2026E/)).toBeInTheDocument();
});

it("states missing or ambiguous forecast trace loss while preserving published figures", () => {
  const { view } = fixture();
  view.entries = [];
  render(
    <PublishedTraceProvider
      snapshot={snapshot}
      folder="run"
      entries={view.entries}
      route="forecast"
    >
      <Forecast view={view} run={run} />
    </PublishedTraceProvider>,
  );
  expect(
    screen.getByText(/The model could not be matched to a single readable record of its inputs/),
  ).toBeInTheDocument();
  // The published figures stay: the Revenue line in the grid, with the selected case's values.
  for (const figure of ["1050", "1092"])
    expect(within(revenueRow()).getByRole("cell", { name: figure })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Assumptions" })).toBeNull();
});

it("ties promoted excerpts to the full recorded input and sends generated notes to Evidence Record", () => {
  const { view, model } = fixture();
  const recorded = "Retained sources are unreviewed. Standalone perimeter applies.";
  model.cashflow.limits = [recorded];
  const handoff = view.entries[0]?.sections[0]?.blocks[0];
  if (handoff?.type !== "text") throw new Error("Missing forecast input fixture");
  handoff.text = handoff.text.replace(
    JSON.stringify(input),
    JSON.stringify({
      ...input,
      scope_limits: [recorded],
    }),
  );
  render(<Forecast view={view} run={run} />);
  const note = screen.getByText("Base case is a conditional illustration.", { selector: "p" });
  const group = note.parentElement;
  if (!group) throw new Error("Missing base case qualification");
  expect(within(group).getByRole("link")).toHaveAttribute("href", "#evidence/record/notes");

  const scope = screen.getByRole("region", { name: "Scope and limits" });
  // The limit whole, as recorded, with the trace to the recorded input.
  const excerpt = within(scope).getByText(recorded).parentElement;
  if (!excerpt) throw new Error("Missing scope qualification");
  expect(within(excerpt).getByRole("link")).toHaveAttribute("href", expect.stringContaining("-72"));
  expect(
    forecastTraceContext(model, { ...input, scope_limits: [recorded] }, "Scope", {
      recordedQualification: recorded,
    }),
  ).toMatchObject({
    statement: recorded,
    details: [{ label: "scope_limits.0", value: recorded }],
  });
});

it.each(["matching", "swapped headers", "duplicate row"])(
  "links an assumption register row only to a unique exact source (%s)",
  (variant) => {
    const { view, source, model } = fixture();
    const headers = ["Driver", "Basis"];
    const cells = ["Interest", "Debt only"];
    source.sections.push({
      heading: "Assumption register",
      level: 2,
      line: 100,
      blocks: [
        {
          type: "table",
          line: 101,
          headers: variant === "swapped headers" ? [...headers].reverse() : headers,
          rows: [
            { line: 103, cells },
            ...(variant === "duplicate row" ? [{ line: 104, cells }] : []),
          ],
        },
      ],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    render(
      <ReportEvidence
        snapshot={snapshot}
        run={run}
        entries={view.entries}
        target="record"
        mode="synthetic"
        models={[
          {
            ...model,
            register: {
              heading: "Assumption register",
              intro: "Recorded basis",
              headers,
              rows: [cells],
            },
          },
        ]}
      />,
    );
    const region = within(screen.getByRole("region", { name: "Assumption register: model" }));
    expect(region.getByRole("cell", { name: "Debt only" })).toBeInTheDocument();
    if (variant === "matching") {
      expect(region.getByRole("link", { name: "Source row" })).toHaveAttribute(
        "href",
        `/report/run#evidence/forward~${digest}-103`,
      );
    } else {
      expect(region.queryByRole("link", { name: "Source row" })).toBeNull();
      expect(region.getByText("Source row not matched")).toBeInTheDocument();
    }
  },
);

it("refuses a filename companion whose hash conflicts with retained model source identity", () => {
  const { view, model, source } = fixture();
  model.download = "/saved/run/annual.md";
  source.output.href = "/saved/run/CP-2G.md";
  source.output.sha256 = "b".repeat(64);
  render(<Forecast view={view} run={run} />);
  expect(
    screen.getByText(/could not be matched to a single readable record of its inputs/i),
  ).toBeInTheDocument();
  expect(screen.queryByText("Recorded growth.")).toBeNull();
  for (const figure of ["1050", "1092"])
    expect(within(revenueRow()).getByRole("cell", { name: figure })).toBeInTheDocument();
  expect(document.querySelector(`a[href*="${"b".repeat(64)}-72"]`)).toBeNull();
});

it("keeps the exact legacy filename companion when no source identity was retained", () => {
  const { view, model, source } = fixture();
  model.sources = [];
  model.download = "/saved/run/annual.md";
  source.output.href = "/saved/run/CP-2G.md";
  render(<Forecast view={view} run={run} />);
  expect(screen.queryByText(/Forecast source details are not available/)).toBeNull();
  expect(screen.getByText("Recorded growth.")).toBeInTheDocument();
});

it("labels raw recorded monetary assumptions in their original currency and scale", () => {
  const document = {
    ...input,
    currency: "GBP",
    scale: 1000,
    base_drivers: {
      dividends: {
        values: ["20000", "20000"],
        category: "Analyst Interpretation",
        rationale: "Retained dividend.",
        limitation: null,
      },
    },
    facilities: [
      {
        name: "Recorded bond",
        balance: "600000",
        annual_amortisation: "50000",
        fixed_rate_pct: "5.1250",
      },
    ],
  };
  render(<RecordedForecastAssumptions document={document} />);
  for (const region of ["Recorded forecast drivers", "Recorded facilities"])
    expect(
      within(screen.getByRole("region", { name: region })).getByText(/Amounts.*GBP thousands/),
    ).toBeInTheDocument();
  expect(screen.getAllByText("20000")).toHaveLength(2);
  expect(screen.getByText("600000")).toBeInTheDocument();
  expect(screen.getByText("5.1250")).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "2025 · 2025-04-01 to 2026-03-31" }),
  ).toBeInTheDocument();
  const trace = forecastTraceContext(fixture().model, document, "Dividends assumptions", {
    case: "Base case",
    inputPath: ["base_drivers", "dividends"],
  });
  expect(trace.details.find(({ label }) => label === "years")?.value).toContain("2025-04-01");
});

it("traces a trend to the actual figure and selected case instead of generic JSON", () => {
  const { view } = fixture();
  render(
    <PublishedTraceProvider
      snapshot={snapshot}
      folder="run"
      entries={view.entries}
      route="forecast"
    >
      <Forecast view={view} run={run} />
    </PublishedTraceProvider>,
  );
  traceRevenue();
  let drawer = within(screen.getByRole("dialog"));
  expect(drawer.getByText(/Revenue.*Base case.*FY2026E.*1050/)).toBeInTheDocument();
  expect(drawer.getByRole("link", { name: "Open in Evidence" })).toHaveAttribute(
    "href",
    `/report/run#evidence/forward~${digest}-72`,
  );
  const close = drawer.getAllByRole("button", { name: "Close" })[0];
  if (!close) throw new Error("Missing drawer Close control");
  fireEvent.click(close);
  fireEvent.click(caseButton(/^Downside shock/));
  traceRevenue();
  drawer = within(screen.getByRole("dialog"));
  expect(drawer.getByText(/Revenue.*Downside shock.*FY2026E.*840/)).toBeInTheDocument();
  expect(drawer.queryByText(/Revenue.*Base case.*FY2026E.*1050/)).toBeNull();
  expect(drawer.getByText("0.20")).toBeInTheDocument();
});

it("binds a selected additional scenario row to its own case", () => {
  const { view, model } = fixture();
  model.cashflow.other = {
    columns: model.cashflow.columns
      .slice(0, 2)
      .map((column) => ({ ...column, group: "Downside (CP-2G drivers)" })),
    rows: model.cashflow.rows.map((row) => ({ ...row, cells: row.cells.slice(0, 2) })),
  };
  render(
    <PublishedTraceProvider
      snapshot={snapshot}
      folder="run"
      entries={view.entries}
      route="forecast"
    >
      <Forecast view={view} run={run} />
    </PublishedTraceProvider>,
  );
  fireEvent.click(caseButton(/^Downside drivers/));
  fireEvent.click(
    within(screen.getByRole("region", { name: "Forecast grid table" })).getByRole("button", {
      name: "Show sources for Revenue",
    }),
  );
  const drawer = within(screen.getByRole("dialog"));
  // The selected view shows every period of the case, so its trace names no single date span.
  const heading = drawer.getByRole("heading", { level: 2, name: /Revenue · Downside drivers/ });
  expect(heading).not.toHaveTextContent("2026-04-01 to 2027-03-31");
  expect(
    drawer.getByText(/Revenue.*Downside drivers.*FY2026E.*1050.*Downside drivers.*FY2027E.*1092/),
  ).toBeInTheDocument();
  expect(drawer.queryByText(/Revenue.*Base case/)).toBeNull();
});

it("compares one period across cases and keeps accounts, ratios and growth rates separate", () => {
  const { view, model } = fixture();
  model.cashflow.rows.push(
    {
      label: "Interest coverage",
      band: "Credit metrics",
      kind: "multiple",
      total: false,
      cells: ["4.19x", "4.25x", "n.a.", "n.a."].map((display) => ({
        display,
        status: display === "n.a." ? "na" : "value",
      })),
    },
    {
      label: "Revenue YoY growth",
      band: "Revenue",
      kind: "percent",
      total: false,
      cells: ["5.0%", "4.0%", "0.0%", "4.0%"].map((display) => ({ display, status: "value" })),
    },
  );
  render(<Forecast view={view} run={run} />);
  const statement = () => within(screen.getByRole("table", { name: "Forecast grid" }));
  fireEvent.click(
    within(screen.getByRole("group", { name: "Grid columns" })).getByRole("button", {
      name: "Compare one year",
    }),
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Year" })).getByRole("button", { name: "FY2026E" }),
  );
  expect(statement().getByRole("cell", { name: "1050" })).toBeInTheDocument();
  expect(statement().getByRole("cell", { name: "840" })).toBeInTheDocument();
  expect(statement().queryByRole("columnheader", { name: "FY2027E" })).toBeNull();
  // Accounts, ratios and growth rates are one table; each band heading names its kind.
  expect(statement().getByRole("cell", { name: "4.19x" })).toBeInTheDocument();
  expect(statement().getByRole("cell", { name: "n.a." })).toBeInTheDocument();
  expect(statement().getByRole("columnheader", { name: "Downside shock" })).toBeInTheDocument();
  expect(statement().getByRole("rowheader", { name: "Revenue" })).toBeInTheDocument();
  expect(statement().getByRole("cell", { name: "0.0%" })).toBeInTheDocument();
  expect(statement().getByRole("rowheader", { name: "Interest coverage" })).toBeInTheDocument();
  expect(statement().getByRole("rowheader", { name: /^Credit metrics/ })).toHaveTextContent(
    "Ratios",
  );
  expect(statement().getByRole("rowheader", { name: "Revenue Accounts" })).toBeInTheDocument();
  expect(statement().getByRole("rowheader", { name: "Revenue Growth rates" })).toBeInTheDocument();
});

it("keeps differently dated partial years out of comparisons while retaining each case", () => {
  const { view, model } = fixture();
  const downsideYear = model.cashflow.columns[3];
  if (!downsideYear) throw new Error("Fixture is missing its downside year");
  model.cashflow.columns[3] = {
    ...downsideYear,
    start: "2026-10-01",
  };
  render(<Forecast view={view} run={run} />);
  // The notice names the one period left out and why; FY2026E is still compared.
  expect(screen.getAllByRole("status").map((status) => status.textContent)).toContain(
    "Periods left out of the scenario comparison: FY2027E (recorded start and end dates do not match between cases, or are incomplete or invalid).",
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Grid columns" })).getByRole("button", {
      name: "Compare one year",
    }),
  );
  const periods = within(screen.getByRole("group", { name: "Year" }));
  expect(periods.getByRole("button", { name: "FY2026E" })).toBeInTheDocument();
  expect(periods.queryByRole("button", { name: "FY2027E" })).toBeNull();
  expect(caseItem("Base case").textContent).toContain("FY2027E · 2026-04-01 to 2027-03-31");
  expect(caseItem("Downside shock").textContent).toContain("FY2027E · 2026-10-01 to 2027-03-31");
});

it("shows the retained unavailable downside in the normal forecast case picker", () => {
  const { view, model } = fixture();
  model.cashflow.columns.splice(2, 2);
  for (const row of model.cashflow.rows) row.cells.splice(2, 2);
  model.cashflow.columns.push({ label: "Downside", group: "Downside case", start: "", end: "" });
  for (const row of model.cashflow.rows) {
    row.cells.push({
      status: "na",
      exact: null,
      display: "n.a.",
      reason: "No downside scenario was computed.",
    });
  }
  render(
    <PublishedTraceProvider
      snapshot={snapshot}
      folder="run"
      entries={view.entries}
      route="forecast"
    >
      <Forecast view={view} run={run} />
    </PublishedTraceProvider>,
  );
  fireEvent.click(caseButton(/^Downside shock/));
  expect(caseButton(/^Downside shock/)).toHaveAttribute("aria-pressed", "true");
  const downsideLabel = caseItem("Downside shock");
  expect(downsideLabel.textContent).toContain("No downside scenario was computed.");
  expect(screen.getByRole("table", { name: "Forecast grid" })).toHaveTextContent("n.a.");
  expect(screen.queryByRole("group", { name: "Year" })).toBeNull();
  fireEvent.click(
    within(downsideLabel).getByRole("button", { name: "Show sources for Downside shock" }),
  );
  expect(
    within(screen.getByRole("dialog")).getByText(
      /Downside shock · Downside: n\.a\..*No downside scenario was computed\./,
    ),
  ).toBeInTheDocument();
});

it("withholds duplicated comparison periods and traces every retained date for the ambiguous case card", () => {
  const { view, model } = fixture();
  const downsideYear = model.cashflow.columns[3];
  if (!downsideYear) throw new Error("Fixture is missing its downside year");
  const duplicated = { ...downsideYear, start: "2026-10-01" };
  model.cashflow.columns.push(duplicated);
  for (const row of model.cashflow.rows) {
    const cell = row.cells[3];
    if (cell) row.cells.push({ ...cell });
  }
  render(
    <PublishedTraceProvider
      snapshot={snapshot}
      folder="run"
      entries={view.entries}
      route="forecast"
    >
      <Forecast view={view} run={run} />
    </PublishedTraceProvider>,
  );
  expect(screen.getAllByRole("status").map((status) => status.textContent)).toContain(
    "Periods left out of the scenario comparison: FY2027E (published more than once by a case).",
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Grid columns" })).getByRole("button", {
      name: "Compare one year",
    }),
  );
  const periods = within(screen.getByRole("group", { name: "Year" }));
  expect(periods.getByRole("button", { name: "FY2026E" })).toBeInTheDocument();
  expect(periods.queryByRole("button", { name: "FY2027E" })).toBeNull();
  // The line item traced in the selected case's own years.
  fireEvent.click(
    within(screen.getByRole("group", { name: "Grid columns" })).getByRole("button", {
      name: "Selected case",
    }),
  );
  traceRevenue();
  const trendDrawer = within(screen.getByRole("dialog"));
  expect(trendDrawer.getByText(/Base case.*FY2027E.*1092/)).toBeInTheDocument();
  const close = trendDrawer.getAllByRole("button", { name: "Close" })[0];
  if (!close) throw new Error("Missing trend drawer close control");
  fireEvent.click(close);
  const downsideCard = caseItem("Downside shock");
  expect(downsideCard.textContent).toContain("n.a.");
  expect(downsideCard.textContent).toContain("More than one published observation uses FY2027E");
  expect(downsideCard.textContent).not.toContain("2026-04-01 to 2027-03-31");
  const caseTrace = within(downsideCard).getByRole("button", {
    name: "Show sources for Downside shock",
  });
  fireEvent.click(caseTrace);
  const drawer = within(screen.getByRole("dialog"));
  expect(drawer.getByText(/FY2027E \(2026-04-01 to 2027-03-31\)/)).toBeInTheDocument();
  expect(drawer.getByText(/FY2027E \(2026-10-01 to 2027-03-31\)/)).toBeInTheDocument();
});

it("sorts forecast labels before choosing the default latest case period", () => {
  const { view, model } = fixture();
  const original = model.cashflow.columns.slice(0, 2);
  const first = original[0];
  const second = original[1];
  if (!first || !second) throw new Error("Fixture is missing forecast periods");
  model.cashflow.columns.splice(0, 2, second, first);
  for (const row of model.cashflow.rows) {
    const cells = row.cells.slice(0, 2);
    const firstCell = cells[0];
    const secondCell = cells[1];
    if (firstCell && secondCell) row.cells.splice(0, 2, secondCell, firstCell);
  }
  render(<Forecast view={view} run={run} />);
  expect(caseButton(/^Base case/)).toHaveAttribute("aria-pressed", "true");
  expect(caseItem("Base case").textContent).toContain("FY2027E");
});

it.each(["separate grids", "one grid"])(
  "keeps canonicalized upside labels distinct in %s",
  (layout) => {
    const { view, model } = fixture();
    const downsideColumns = model.cashflow.columns.slice(2, 4);
    for (const column of downsideColumns) column.group = "Upside";
    const secondCase = {
      columns: model.cashflow.columns
        .slice(0, 2)
        .map((column) => ({ ...column, group: "Upside case" })),
      rows: model.cashflow.rows.map((row) => ({
        ...row,
        cells: row.cells.slice(0, 2).map(() => ({ status: "value", exact: "20", display: "20" })),
      })),
    };
    if (layout === "one grid") {
      model.cashflow.columns.push(...secondCase.columns);
      model.cashflow.rows.forEach((row, index) => {
        row.cells.push(...(secondCase.rows[index]?.cells ?? []));
      });
    } else {
      model.cashflow.other = secondCase;
    }
    render(
      <PublishedTraceProvider
        snapshot={snapshot}
        folder="run"
        entries={view.entries}
        route="forecast"
      >
        <Forecast view={view} run={run} />
      </PublishedTraceProvider>,
    );
    const first = caseButton("Upside case · Upside");
    // "Upside case" would only repeat the label, so the case takes its place by raw-group order;
    // the trace drawer below still identifies the column by its recorded raw group.
    const second = caseButton("Upside case · second case");
    expect(caseItem("Upside case · Upside").textContent).toContain("6");
    expect(caseItem("Upside case · second case").textContent).toContain("20");
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("aria-pressed", "false");
    traceRevenue();
    const drawer = within(screen.getByRole("dialog"));
    expect(drawer.getByText(/Upside case · Upside case.*FY2027E.*20/)).toBeInTheDocument();
    expect(drawer.queryByText(/Upside case · Upside.*FY2027E.*90/)).toBeNull();
  },
);

it.each([true, false])(
  "selects retained own-downside driver paths for the main downside (shock: %s)",
  (shock) => {
    const { model } = fixture();
    model.cashflow.notes = [
      shock
        ? "Downside case is the stress case: a shock applied to the model's own downside drivers."
        : "Downside case is CP-2G's own downside drivers; no CP-2A shock was supplied.",
    ];
    const document = {
      ...input,
      downside_drivers: {
        revenue_growth: {
          values: ["0.01", "0.01"],
          category: "Analyst Interpretation",
          rationale: "Recorded own-downside growth.",
          limitation: null,
        },
      },
      downside_shock: shock ? input.downside_shock : null,
    };
    const trace = forecastTraceContext(model, document, "Revenue", {
      case: shock ? "Downside shock" : "Downside case",
      row: "Revenue",
    });
    expect(
      trace.details.find(({ label }) => label === "downside_drivers.revenue_growth")?.value,
    ).toContain('"0.01"');
    expect(trace.details.some(({ label }) => label === "base_drivers.revenue_growth")).toBe(false);
    expect(trace.details.some(({ label }) => label === "downside_shock.ebitda_decline")).toBe(
      shock,
    );
  },
);

it("preserves a retained historical stress explicitly recorded on base drivers", () => {
  const { model } = fixture();
  const document = {
    ...input,
    downside_drivers: {
      revenue_growth: {
        values: ["0.01", "0.01"],
        category: "Analyst Interpretation",
        rationale: "Separately recorded downside.",
        limitation: null,
      },
    },
  };
  const trace = forecastTraceContext(model, document, "Revenue", {
    case: "Downside shock",
    row: "Revenue",
  });
  expect(
    trace.details.find(({ label }) => label === "base_drivers.revenue_growth")?.value,
  ).toContain('"0.05"');
  expect(trace.details.some(({ label }) => label === "downside_drivers.revenue_growth")).toBe(
    false,
  );
});

it("retains the recorded facility fields behind debt, interest and cash figures", () => {
  const { model } = fixture();
  const document = {
    ...input,
    facilities: [
      {
        name: "Recorded fixed facility",
        balance: "600",
        fixed_rate_pct: "6.00",
        annual_amortisation: "50",
        maturity: "2028-03-31",
      },
    ],
  };
  for (const row of [
    "Closing debt",
    "Interest",
    "Closing cash",
    "Cash proxy (not issuer free cash flow)",
  ]) {
    const trace = forecastTraceContext(model, document, row, { case: "Base case", row });
    expect(trace.details.find(({ label }) => label === "facilities.0.name")?.value).toBe(
      "Recorded fixed facility",
    );
    expect(trace.details.find(({ label }) => label === "facilities.0.balance")?.value).toBe("600");
    expect(
      trace.details.find(({ label }) => label === "facilities.0.annual_amortisation")?.value,
    ).toBe("50");
    expect(trace.details.find(({ label }) => label === "facilities.0.fixed_rate_pct")?.value).toBe(
      "6.00",
    );
  }
});

it("shows repayment drivers in the interest trace", () => {
  const { model } = fixture();
  const document = {
    ...input,
    base_drivers: {
      ...input.base_drivers,
      debt_repayment: {
        values: ["20", "0"],
        category: "Analyst Interpretation",
        rationale: "Recorded repayments.",
        limitation: null,
      },
    },
  };
  const trace = forecastTraceContext(model, document, "Interest", {
    case: "Base case",
    row: "Interest",
    period: "FY2027E",
  });
  expect(
    trace.details.find(({ label }) => label === "base_drivers.debt_repayment")?.value,
  ).toContain('"20"');
});

it("ties same-labeled comparison trace values to the recorded period dates", () => {
  const { model } = fixture();
  const trace = forecastTraceContext(model, input, "Revenue comparison", {
    row: "Revenue",
    groups: ["Base case", "Downside shock"],
    periods: ["FY2026E"],
    periodStart: "2025-04-01",
    periodEnd: "2026-03-31",
  });
  expect(trace.statement).toContain("Base case · FY2026E (2025-04-01 to 2026-03-31): 1050");
  expect(trace.statement).toContain("Downside shock · FY2026E (2025-04-01 to 2026-03-31): 840");
  expect(trace.statement).not.toContain("1092");
  expect(trace.statement).not.toContain("873.6");
});

it("shows recorded drivers and the downside shock with a separate facilities notice", () => {
  const { view } = fixture();
  render(<Forecast view={view} run={run} />);
  expect(screen.getByRole("region", { name: "Assumptions by case" })).toBeInTheDocument();
  // The recorded drivers sit closed under the assumptions table, one press away.
  const recorded = screen
    .getByText("Recorded drivers, rationale and limitations")
    .closest("details");
  expect(recorded).not.toHaveAttribute("open");
  if (recorded) recorded.open = true;
  expect(screen.getByRole("table", { name: "Recorded forecast drivers" })).toBeInTheDocument();
  expect(screen.getByText("Recorded growth.")).toBeInTheDocument();
  // The table shows the shock as recorded, the fraction 0.20; the recorded shock reads it as 20.00%.
  expect(
    within(screen.getByRole("region", { name: "Assumptions by case table" })).getByText("0.20"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Recorded downside shock" })).getByText("20.00%"),
  ).toBeInTheDocument();
  const facilities = screen.getByRole("region", { name: "Recorded facilities" });
  expect(
    within(facilities).getByText(/No facility-level assumptions were recorded/),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("table", { name: "Recorded forecast drivers" })).queryByText(
      /facility-level/,
    ),
  ).toBeNull();
});

it("retains a cell qualification even when its calculation grid cannot be drawn", () => {
  const { view, model } = fixture();
  const row = model.cashflow.rows[0];
  const cell = row?.cells[0];
  if (!cell) throw new Error("Missing retained cell fixture");
  cell.display = "";
  cell.reason = "Retain the exact qualification from malformed-grid-source.pdf p.12";
  const forecast = render(<Forecast view={view} run={run} />);
  expect(screen.getByRole("link", { name: "Model notes and limitations" })).toHaveAttribute(
    "href",
    "#evidence/record/notes",
  );
  forecast.unmount();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("not available")));
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={view.entries}
      target="record"
      mode="synthetic"
      models={[model]}
    />,
  );
  expect(
    screen.getByText("Retain the exact qualification from malformed-grid-source.pdf p.12"),
  ).toBeInTheDocument();
});

it("keeps the missing cash-proxy reason on its case card and explains its precision", () => {
  const { view, model } = fixture();
  const cashProxy = model.cashflow.rows[1];
  if (!cashProxy) throw new Error("Missing test cash-proxy row");
  cashProxy.cells[3] = {
    status: "na",
    exact: null,
    display: "n.a.",
    reason: missing,
  };
  render(<Forecast view={view} run={run} />);
  const cases = within(caseItem("Downside shock"));
  expect(cases.getByText(missing)).toBeInTheDocument();
  expect(within(caseFigure()).getByText("n.a.")).toBeInTheDocument();
  // The figure is the model's own display, so the page claims no rounding of it; its
  // description names the measure.
  expect(caseFigure()).toHaveAccessibleDescription(/^Cash proxy, Downside shock/);
  expect(screen.queryByText(/rounded/)).toBeNull();
});

it("uses stored case names for descriptions and reader names for all column groups", () => {
  const { view, model } = fixture();
  model.cashflow.other = {
    columns: [
      { label: "FY2026E", group: "Upside" },
      { label: "FY2027E", group: "Upside" },
    ],
    rows: model.cashflow.rows.map((row) => ({ ...row, cells: row.cells.slice(0, 2) })),
  };
  model.cashflow.notes.push("Upside is the optimistic case recorded by the module.");
  render(<Forecast view={view} run={run} />);
  fireEvent.click(caseButton(/^Upside/));
  expect(
    within(caseFigure().parentElement as HTMLElement).getByText(
      "Upside is the optimistic case recorded by the module.",
    ),
  ).toBeInTheDocument();
  fireEvent.click(caseButton(/^Downside shock/));
  expect(
    within(screen.getByRole("region", { name: "Forecast grid table" })).getByRole("columnheader", {
      name: "Forecast · Downside shock",
    }),
  ).toBeInTheDocument();
});

it("names model choices by recorded cases and date, without builder mode jargon", () => {
  const { view, model } = fixture();
  view.models = [
    { ...model, mode: "candidate" },
    { ...model, id: "other", mode: "alternate" },
  ];
  render(<Forecast view={view} run={run} />);
  const selector = screen.getByRole("combobox", { name: "Published model" });
  expect(selector).not.toHaveTextContent(/candidate|alternate/);
  expect(selector).toHaveTextContent("31 March 2025");
  expect(selector).toHaveTextContent("Base case");
});

it("wraps recorded descriptions, model notes and qualifications at desktop widths", () => {
  const { view } = fixture();
  render(<Forecast view={view} run={run} />);
  expect(
    within(screen.getByRole("region", { name: "Scope and limits" })).getByRole("list").className,
  ).toMatch(/wrap-anywhere/);
  const figure = caseFigure().closest("#forecast-cases");
  expect(figure?.className).toMatch(/min-w-0/);
  expect(figure?.className).toMatch(/wrap-anywhere/);
});

it("lists a model-level limit that starts with a word and a colon which is no row of the statement", () => {
  const { view, model } = fixture();
  const scope = "Perimeter: the forecast covers the restricted group only.";
  model.cashflow.limits = [ledger, scope];
  render(<Forecast view={view} run={run} />);
  const tile = within(screen.getByRole("region", { name: "Scope and limits" }));
  expect(tile.getByText(scope)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain(ledger);
});
