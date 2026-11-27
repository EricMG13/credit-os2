import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";

type View = ReturnType<typeof buildReportView>;

const run = { folder: "current" } as PublishedRun;

function entry(
  module: string,
  title: string,
  options: { selected?: boolean; established?: boolean; value?: string } = {},
): OutputEntry {
  const { selected = true, established = true, value = "0.00" } = options;
  return {
    selected,
    output: {
      id: title,
      sha256: "d".repeat(64),
      module,
      label: "",
      href: "",
      state: { established, declared: null },
      charts: [{ title, table: 21, columns: [1], unit: "US$m" }],
      chartGaps: [{ title: "Recorded gap", table: 30, gap: "No dated proposal was evaluated" }],
      events: [{ lane: "Issuer dates", table: 21 }],
      maps: [{ name: "Operating model", table: 21 }],
    },
    sections: [
      {
        heading: "Chart data: figures",
        level: 3,
        line: 20,
        blocks: [
          {
            type: "table",
            line: 21,
            headers: ["Period", "Debt", "Reporting unit", "Basis and limitation"],
            rows: [
              { line: 23, cells: ["FY2026", value, "US$m", "Fiscal year end."] },
              { line: 24, cells: ["FY2027", "Not supplied: schedule ends", "US$m", "Filed."] },
            ],
          },
          { type: "text", line: 30, end: 30, text: "No dated proposal was evaluated" },
        ],
      },
    ],
  };
}

/** A chart's list row in the run-chart tables, found by its title. */
function chartRow(title: string) {
  const row = screen
    .getAllByRole("listitem")
    .find((item) => item.querySelector(":scope > div > span")?.textContent === title);
  if (!row) throw new Error(`No chart row for ${title}`);
  return row;
}

it("confines a replay to the unpublished preview and its two selected handoff digests", () => {
  const financial = entry("CP-1", "foundation");
  const forward = entry("CP-2G", "forecast");
  const foundation = financial.output;
  const forecast = { ...forward.output, sha256: "f".repeat(64) };
  const retained: PublishedRun = {
    ...run,
    modules: {
      "CP-1": { default: foundation.id, outputs: [foundation.id] },
      "CP-2G": { default: forecast.id, outputs: [forecast.id] },
    },
    forecastReplay: {
      foundationDigest: foundation.sha256,
      forecastDigest: forecast.sha256,
      cashflow: {},
      reconciliation: "Retained handoff 4.17x. Deterministic replay 4.19x.",
      calculationLine: 286,
    },
  };
  const snapshot: Snapshot = {
    preview: { reason: "Partial historical test" },
    catalogue: { real: [] },
    workspace: {
      runs: { current: retained },
      outputs: { [foundation.id]: foundation, [forecast.id]: forecast },
      handoffs: { [foundation.sha256]: financial.sections, [forecast.sha256]: forward.sections },
      models: [],
    },
    chips: {},
  };
  const view = buildReportView(snapshot, "current", retained);
  expect(view.previewForecast?.handoff.output).toBe(forecast);
  expect(view.models).toEqual([]);
  expect(
    buildReportView({ ...snapshot, preview: undefined }, "current", retained).previewForecast,
  ).toBeUndefined();
  expect(
    buildReportView(snapshot, "current", { ...retained, publicationVerified: true })
      .previewForecast,
  ).toBeUndefined();
  const wrong = {
    ...snapshot,
    workspace: {
      ...snapshot.workspace,
      outputs: {
        [foundation.id]: { ...foundation, sha256: "e".repeat(64) },
        [forecast.id]: forecast,
      },
    },
  };
  expect(buildReportView(wrong, "current", retained).previewForecast).toBeUndefined();

  render(<Forecast view={view} run={retained} preview />);
  expect(screen.getByRole("region", { name: "Forecast calculation replay" })).toHaveTextContent(
    "Retained handoff 4.17x. Deterministic replay 4.19x.",
  );
  expect(screen.getByRole("link", { name: "Forecast handoff calculation" })).toHaveAttribute(
    "href",
    `/report/current#evidence/forecast~${forecast.sha256}-286`,
  );
  expect(screen.queryByRole("region", { name: "Published model" })).toBeNull();
});

it("draws the designated run figure with a same-output trace even when no model was published", () => {
  const alternative = entry("CP-1", "Retained maturity schedule", { selected: false, value: "75" });
  const selected = entry("CP-1", "Debt maturities");
  const withheld = entry("CP-2D", "Liquidity bridge", { established: false, value: "237" });
  const view: ReturnType<typeof buildReportView> = {
    catalogue: undefined,
    lead: undefined,
    entries: [alternative, selected, withheld],
    models: [],
    modules: [
      {
        id: "CP-1",
        name: "Financial foundation",
        state: "Delivered",
        outputs: [alternative, selected],
      },
      { id: "CP-2D", name: "Liquidity", state: "Not assessable", outputs: [withheld] },
    ],
  };
  render(<Forecast view={view} run={run} />);
  expect(screen.getByText(/No forecast model was published/)).toBeInTheDocument();
  const row = within(chartRow("Debt maturities"));
  expect(row.getByRole("link", { name: "Source table" })).toHaveAttribute(
    "href",
    `/report/current#evidence/Debt%20maturities~${"d".repeat(64)}-21`,
  );
  fireEvent.click(row.getByRole("button", { name: "Table for Debt maturities" }));
  const table = within(row.getByRole("region", { name: "Debt maturities table" }));
  expect(table.getByRole("cell", { name: "0.00" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "Not supplied: schedule ends" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Financial foundation" })).toHaveAttribute(
    "href",
    "#modules/CP-1",
  );
  expect(screen.getAllByText("No dated proposal was evaluated").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("Module not assessable.").length).toBeGreaterThanOrEqual(1);
  // The withheld module's chart is listed with its reason and offers no table.
  expect(
    within(chartRow("Liquidity bridge")).getByText("Module not assessable."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Table for Liquidity bridge" })).toBeNull();
  expect(screen.queryByText("237")).toBeNull();
  expect(screen.queryByText("Retained maturity schedule")).toBeNull();
  // The selected module's events and maps are listed beside its charts.
  expect(chartRow("Issuer dates")).toBeInTheDocument();
  expect(chartRow("Operating model")).toBeInTheDocument();
});

it("spells out a ratio chart caption while retaining its stored x unit", () => {
  const ratio = entry("CP-2G", "Interest cover", { value: "3.10" });
  const descriptor = ratio.output.charts?.[0];
  const table = ratio.sections[0]?.blocks[0];
  if (!descriptor || table?.type !== "table") throw new Error("Missing ratio fixture");
  descriptor.unit = "x";
  table.headers[1] = "Interest cover";
  for (const row of table.rows) row.cells[2] = "x";
  const view: View = {
    catalogue: undefined,
    lead: undefined,
    entries: [ratio],
    models: [],
    modules: [{ id: "CP-2G", name: "Forward credit model", state: "Delivered", outputs: [ratio] }],
  };
  render(<Forecast view={view} run={run} />);
  expect(within(chartRow("Interest cover")).getByText("x (times)")).toBeInTheDocument();
  expect(descriptor.unit).toBe("x");
  expect(table.rows[0]?.cells[2]).toBe("x");
});

it("shows the recorded build rejection and keeps its raw table in Evidence", () => {
  const returned = entry("CP-4", "Covenants", { value: "725" });
  returned.output.charts = [];
  returned.output.chartGaps = [];
  returned.output.events = [];
  returned.output.maps = [];
  returned.output.issue =
    "Events: legal is not in its fixed table; Chart data: figures is not in its fixed table";
  const view: ReturnType<typeof buildReportView> = {
    catalogue: undefined,
    lead: undefined,
    entries: [returned],
    models: [],
    modules: [{ id: "CP-4", name: "Legal terms", state: "Delivered", outputs: [returned] }],
  };
  render(<Forecast view={view} run={run} />);
  expect(within(chartRow("Figures")).getByText("Not established for this run")).toBeInTheDocument();
  expect(
    screen.getByText("The chart data did not fit the required table form, so no chart is drawn."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Source table" })).toHaveAttribute(
    "href",
    `/report/current#evidence/Covenants~${"d".repeat(64)}-21`,
  );
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByText("725")).toBeNull();
});

it("draws the Forecast tiles for a published model in place of section jumps", () => {
  const model = {
    id: "model",
    issuerKey: "issuer",
    runId: "run",
    runFolder: "current",
    href: "",
    download: "",
    sources: [],
    cashflow: {
      units: "USD millions",
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
            { status: "value", exact: "10", display: "10" },
            { status: "value", exact: "12", display: "12" },
            { status: "value", exact: "5", display: "5" },
            { status: "value", exact: "6", display: "6" },
          ],
        },
      ],
    },
    register: {
      heading: "Forecast assumptions",
      headers: ["Item"],
      intro: "Recorded assumption.",
      rows: [["Debt"]],
    },
  };
  const view: View = {
    catalogue: undefined,
    lead: undefined,
    entries: [],
    modules: [],
    models: [model as unknown as View["models"][number]],
  };
  render(<Forecast view={view} run={run} />);
  // Tiles replace the section jumps: each part of the page is a named region.
  expect(screen.queryByRole("navigation", { name: "Forecast sections" })).toBeNull();
  expect(screen.queryByLabelText("Jump to section")).toBeNull();
  for (const name of [
    "Forecast",
    "Net leverage path",
    "Forecast grid",
    "Assumptions by case",
    "Scope and limits",
  ])
    expect(screen.getByRole("region", { name })).toBeInTheDocument();
  expect(document.getElementById("forecast-run-charts")).not.toBeNull();
  // The cases' figures and the model are drawn with their values: each case in the header's
  // switch, the selected case's cash proxy under it.
  const items = within(screen.getByRole("group", { name: "Case" })).getAllByRole("button");
  expect(items.map((item) => item.textContent)).toEqual(["Base case", "Downside case"]);
  expect(screen.getByLabelText("Selected case cash proxy")).toHaveTextContent("12");
  fireEvent.click(items[1] as HTMLElement);
  expect(screen.getByLabelText("Selected case cash proxy")).toHaveTextContent("6");
  expect(document.getElementById("forecast-model")).not.toBeNull();
  expect(window.location.hash).toBe("");
});

it("draws only the header and the run charts when no model was published", () => {
  const view: View = {
    catalogue: undefined,
    lead: undefined,
    entries: [],
    modules: [],
    models: [],
  };
  const { rerender } = render(<Forecast view={view} run={run} />);
  const header = screen.getByRole("region", { name: "Forecast" });
  expect(
    within(header).getByText("No forecast model was published for this run."),
  ).toBeInTheDocument();
  for (const name of [
    "Net leverage path",
    "Forecast grid",
    "Assumptions by case",
    "Scope and limits",
  ])
    expect(screen.queryByRole("region", { name })).toBeNull();
  expect(screen.queryByRole("navigation", { name: "Forecast sections" })).toBeNull();
  expect(screen.queryByLabelText("Jump to section")).toBeNull();
  expect(screen.queryByRole("list", { name: "Forecast cases" })).toBeNull();
  expect(document.getElementById("forecast-cases")).toBeNull();
  expect(document.getElementById("forecast-model")).toBeNull();
  expect(document.getElementById("forecast-assumptions")).toBeNull();
  expect(document.getElementById("forecast-run-charts")).not.toBeNull();
  // The run's chart tables are drawn open, deep-linked or not.
  const charts = () => screen.getByRole("region", { name: "Chart tables from this run" });
  expect(charts()).toHaveTextContent("No charts were published for this run.");
  rerender(<Forecast view={view} run={run} section="run-charts" />);
  expect(charts()).toHaveTextContent("No charts were published for this run.");
});
