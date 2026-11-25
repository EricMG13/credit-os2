import { cleanup, configure, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";
import { ReportChanges } from "./report/Changes";
import { buildReportView, runLimitations } from "./reportView";
import type { PublishedChanges, PublishedRun, Snapshot } from "./publishedReport";

// The first render of the whole reader, with its export formats, can pass the 1 s default.
configure({ asyncUtilTimeout: 5000 });

const EMPTY_EVIDENCE = {
  sources: [],
  unused: [],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};

function librarySnapshot() {
  const north = {
    id: "northbridge-2026",
    name: "Northbridge",
    issuer: "Northbridge",
    title: "Full credit assessment",
    date: "2026-10-31",
    sector: "Industrials",
    period: "FY2026",
    metrics: {},
  };
  const south = {
    ...north,
    id: "southbridge-2026",
    name: "Southbridge",
    sector: "Retail",
  };
  const run = (entry: typeof north, pathway: string) => ({
    folder: entry.id,
    issuer: entry.issuer,
    issuerKey: entry.id,
    title: entry.title,
    period: entry.period,
    asOf: entry.date,
    pathway,
    modules: {},
    changes: { first_run: true },
    evidence: EMPTY_EVIDENCE,
  });
  return {
    catalogue: { real: [north, south] },
    workspace: {
      runs: {
        north: run(north, "credit_snapshot"),
        south: run(south, "lite_credit_assessment"),
      },
      outputs: {},
      handoffs: {},
      models: [],
    },
    chips: {},
  };
}

function useSnapshot(snapshot: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      const data = snapshot as Snapshot;
      if (path === "/connected/library") {
        const runs = Object.fromEntries(
          Object.entries(data.workspace.runs).map(([key, run]) => [
            key,
            {
              folder: run.folder,
              issuerKey: run.issuerKey,
              pathway: run.pathway,
            },
          ]),
        );
        return Promise.resolve(Response.json({ catalogue: data.catalogue, workspace: { runs } }));
      }
      const url = new URL(path, "http://localhost");
      if (url.pathname !== "/connected/snapshot" || !url.searchParams.get("run"))
        throw new Error(`Unexpected request ${path}`);
      return Promise.resolve(Response.json(snapshot));
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("connected library and report design", () => {
  it("filters by sector and pathway and keeps filters available to reset an empty result", async () => {
    const snapshot = librarySnapshot() as unknown as Snapshot;
    const north = snapshot.workspace.runs.north;
    if (!north) throw new Error("Northbridge fixture is missing");
    north.issuerKey = "north-group";
    const northPrior = {
      id: "northbridge-2025",
      name: "Northbridge",
      issuer: "Northbridge",
      title: "Lite credit assessment",
      date: "2025-10-31",
      sector: "Retail",
      period: "FY2025",
      metrics: {},
    };
    snapshot.catalogue.real.push(northPrior);
    snapshot.workspace.runs.prior = {
      ...north,
      folder: northPrior.id,
      asOf: northPrior.date,
      pathway: "lite_credit_assessment",
    };
    useSnapshot(snapshot);
    render(<ConnectedApp path="/" mode="synthetic" />);
    expect(await screen.findByRole("heading", { name: "Northbridge" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Southbridge" })).toBeInTheDocument();

    const chip = (group: string, name: string) =>
      fireEvent.click(
        within(screen.getByRole("group", { name: group })).getByRole("button", { name }),
      );
    chip("Sector", "Retail");
    chip("Pathway", "Lite credit assessment");
    // A pathway filter picks that pathway's run for the issuer: the row opens the Lite run.
    const northRow = screen.getByRole("heading", { name: "Northbridge" }).closest("li");
    if (!northRow) throw new Error("Expected a row for the selected pathway");
    expect(within(northRow).getByRole("link", { name: "Open report" })).toHaveAttribute(
      "href",
      "/report/northbridge-2025",
    );
    chip("Sector", "All");
    chip("Pathway", "All");

    chip("Sector", "Industrials");
    expect(screen.queryByRole("heading", { name: "Southbridge" })).toBeNull();
    chip("Pathway", "Lite credit assessment");
    expect(screen.getByText(/No issuers match these filters/)).toBeInTheDocument();
    chip("Sector", "All");
    expect(screen.getByRole("heading", { name: "Southbridge" })).toBeInTheDocument();

    cleanup();
    window.history.replaceState(null, "", "/report/northbridge-2026");
    render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
    const header = await screen.findByRole("region", { name: "Northbridge" }, { timeout: 5000 });
    expect(within(header).getByText("Synthetic test")).toBeInTheDocument();
    // The header carries no run-state chip; Runs says once that every listed run is finished.
    expect(within(header).queryByText("Finished")).toBeNull();
    cleanup();
    window.history.replaceState(null, "", "/report/northbridge-2026#history");
    render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
    const runs = await screen.findByRole("region", { name: "Runs of Northbridge" });
    expect(within(runs).getAllByText(/Finished runs, newest first\./)).toHaveLength(1);
  });

  it("draws the figures the row does not show as one stats strip with the value in mono", async () => {
    const snapshot = librarySnapshot() as unknown as Snapshot;
    const [north] = snapshot.catalogue.real;
    if (!north) throw new Error("Northbridge fixture is missing");
    north.metrics = { leverage: { value: "965", unit: "US$m", period: "2026-06-30" } };
    useSnapshot(snapshot);
    render(<ConnectedApp path="/" mode="synthetic" />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Show runs and detail for Northbridge/ }),
    );
    const value = await screen.findByText("US$965m", { selector: "span" });
    expect(value).toHaveClass("font-mono", "tabular-nums");
    const strip = value.closest("dl");
    expect(strip).toHaveAccessibleName("More figures, Northbridge");
    expect(within(strip as HTMLElement).getByText("Gross leverage, 2026-06-30")).toBeVisible();
  });

  it("keeps repeated issuer searches usable after other filters change", async () => {
    useSnapshot(librarySnapshot());
    render(<ConnectedApp path="/" mode="synthetic" />);
    await screen.findByRole("heading", { name: "Northbridge" });
    fireEvent.click(
      within(screen.getByRole("group", { name: "Sector" })).getByRole("button", {
        name: "Industrials",
      }),
    );
    const search = screen.getByRole("searchbox", { name: "Search issuers" });
    fireEvent.change(search, { target: { value: "zz" } });
    fireEvent.change(search, { target: { value: "zz no match" } });
    expect(await screen.findByText(/No issuers match these filters/)).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "North" } });
    expect(await screen.findByRole("heading", { name: "Northbridge" })).toBeInTheDocument();
  });

  it("switches Changes between cards and a table using the same published values", () => {
    const change = {
      pack: {
        prior: { run: "previous", as_of: "2025-10-31", pathway: "credit_snapshot" },
        current: { as_of: "2026-10-31", pathway: "credit_snapshot" },
        measures: [
          {
            key: "net_leverage",
            label: "Net leverage",
            prior: { value: "3.2", unit: "x", period: "FY2025" },
            current: { value: "3.8", unit: "x", period: "FY2026" },
            difference: "0.6",
            comparable: "yes",
          },
        ],
      },
      verdicts: {
        measures: { net_leverage: { kind: "comparable", label: "Comparable" } },
      },
    } as unknown as PublishedChanges;
    const run = {
      folder: "current",
      changes: change,
      modules: {},
      evidence: EMPTY_EVIDENCE,
    } as unknown as PublishedRun;
    const snapshot = { workspace: { runs: {} } } as unknown as Snapshot;
    render(<ReportChanges snapshot={snapshot} run={run} entries={[]} change={change} />);
    expect(screen.getByText("Net leverage")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Earlier" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("columnheader", { name: "Earlier" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "3.2x (FY2025)" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "3.8x (FY2026)" })).toBeInTheDocument();
  });

  it("shows published calendar events under Dates to watch and keeps their evidence link", async () => {
    const snapshot = librarySnapshot() as unknown as Snapshot;
    const run = snapshot.workspace.runs.north;
    if (!run) throw new Error("Northbridge fixture is missing");
    const id = "northbridge-2026/outputs/CP-1.md";
    run.modules = { "CP-1": { outputs: [id], default: id } };
    snapshot.workspace.outputs[id] = {
      id,
      run: "north",
      module: "CP-1",
      label: "Financial foundation",
      href: id,
      sha256: "handoff-digest",
      events: [{ lane: "Scheduled", table: 42 }],
      state: { established: true, declared: null },
    };
    snapshot.workspace.handoffs["handoff-digest"] = [
      {
        heading: "Events",
        level: 2,
        line: 40,
        blocks: [
          {
            type: "table",
            line: 42,
            headers: [
              "Event date",
              "Date precision",
              "Published",
              "Event",
              "Status",
              "Source",
              "Credit relevance",
            ],
            rows: [
              {
                line: 44,
                cells: [
                  "2027-03-15",
                  "day",
                  "2026-10-31",
                  "Refinancing maturity",
                  "Scheduled",
                  "Debt schedule, page 4",
                  "Liquidity pressure",
                ],
              },
            ],
          },
        ],
      },
    ];
    useSnapshot(snapshot);
    window.history.replaceState(null, "", "/report/northbridge-2026");
    render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
    expect(await screen.findByRole("heading", { name: "Dates to watch" })).toBeInTheDocument();
    const dates = within(screen.getByRole("region", { name: "Dates to watch" })).getByRole("list");
    expect(within(dates).getByText("Refinancing maturity")).toBeInTheDocument();
    expect(within(dates).getByText("15 March 2027")).toBeInTheDocument();
    expect(within(dates).getByText("Scheduled")).toBeInTheDocument();
    // The shared trace control (PublishedSource): a drawer button where the provider resolves
    // the row, else its Evidence link; one per module record, named by event, date and module.
    expect(
      within(dates).getByLabelText(
        /^(Show sources|Source) for Refinancing maturity on 15 March 2027 from Financial foundation$/,
      ),
    ).toBeInTheDocument();

    window.location.hash = "#modules/CP-1";
    // The module page: its navigator marks the open module, and the event table is in the records.
    const nav = await screen.findByRole("navigation", { name: "Modules in this run" });
    expect(within(nav).getByRole("link", { name: /^Financial foundation, / })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Financial foundation" })).toBeVisible();
    expect(screen.queryByLabelText("Jump to section")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show records" }));
    expect(screen.getByRole("heading", { level: 4, name: "Scheduled" })).toBeInTheDocument();
    expect(screen.getAllByText("Refinancing maturity").length).toBeGreaterThan(0);
  });
});

it("withholds a catalogue-only report and its actions", async () => {
  const snapshot = librarySnapshot() as unknown as Snapshot;
  delete snapshot.workspace.runs.north;
  useSnapshot(snapshot);
  render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
  expect(await screen.findByText("No report was published for this run.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Credit report" })).toBeInTheDocument();
  expect(within(screen.getByRole("main")).queryByRole("link", { name: "Run activity" })).toBeNull();
  expect(screen.queryByRole("switch", { name: "Show sources" })).toBeNull();
  expect(screen.queryByRole("navigation", { name: "Report sections" })).toBeNull();
});

it.each(["Retained-method check withheld admission.", ""])(
  "preserves preview qualification without claiming completion: %j",
  async (reason) => {
    const snapshot = librarySnapshot() as unknown as Snapshot;
    snapshot.preview = { reason };
    useSnapshot(snapshot);
    render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
    expect((await screen.findAllByText("Test preview")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Finished")).toBeNull();
    expect(screen.queryByText("Synthetic test")).toBeNull();
    if (reason) {
      const note = screen.getByRole("note");
      expect(note).toHaveTextContent("Test preview");
      expect(note).toHaveTextContent(reason);
    } else expect(screen.queryByRole("note")).toBeNull();
  },
);

it.each([
  { name: "Catalogue title", issuerHeading: "Handoff title", expected: "Catalogue title" },
  { name: "", issuerHeading: "Handoff title", expected: "Handoff title" },
  { name: "", issuerHeading: "", expected: "Northbridge" },
])("preserves reader title fallbacks: %j", async ({ name, issuerHeading, expected }) => {
  const snapshot = librarySnapshot() as unknown as Snapshot;
  const catalogue = snapshot.catalogue.real[0];
  const run = snapshot.workspace.runs.north;
  if (!catalogue || !run) throw new Error("Missing report fixture");
  catalogue.name = name;
  run.issuerHeading = issuerHeading;
  useSnapshot(snapshot);
  render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
  expect(await screen.findByRole("heading", { name: expected, level: 1 })).toBeInTheDocument();
});

it("C1-032 keeps the report-data loading skeleton static while its request is pending", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>(() => {})),
  );
  render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
  const message = await screen.findByText("Loading report…");
  const status = message.parentElement;
  if (!status) throw new Error("missing report loading status");
  expect(status).toHaveAttribute("role", "status");
  expect(status.querySelectorAll(".bg-surface-subtle").length).toBeGreaterThan(1);
  expect(status.querySelector('[class*="animate-"]')).toBeNull();
});

it("ends the loading state for a resolved null snapshot", async () => {
  useSnapshot(null);
  render(<ConnectedApp path="/report/absent" mode="synthetic" />);
  expect(screen.getByText("Loading report…")).toBeInTheDocument();
  expect(await screen.findByText("No report was published for this run.")).toBeInTheDocument();
  expect(screen.queryByText("Loading report…")).toBeNull();
});

it("shows a snapshot error without admitting a report or remaining in loading", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Snapshot unavailable")));
  render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
  // C3-007 (D-31): the alert names what happened in a fixed sentence, never the raw error text,
  // and offers a way on; no report is admitted (no report sections).
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("The report could not be loaded");
  expect(alert).not.toHaveTextContent("Snapshot unavailable");
  expect(screen.queryByText("Loading report…")).toBeNull();
  expect(screen.queryByRole("navigation", { name: "Report sections" })).toBeNull();
  expect(
    within(screen.getByRole("main")).getByRole("link", { name: "Run progress" }),
  ).toHaveAttribute("href", "/run/northbridge-2026");
});

const CODED_CELL = "Liquidity (CP-2D)";
const CODED_BASIS = "Basis: Financial foundation (CP-1)";

function codedSections() {
  return [
    {
      heading: "Findings",
      level: 2,
      line: 10,
      blocks: [
        {
          type: "table" as const,
          line: 12,
          headers: ["Item", "Owner"],
          rows: [{ line: 14, cells: ["Cash runway", CODED_CELL] }],
        },
        {
          type: "text" as const,
          line: 16,
          end: 17,
          text: `Cash covers the year.\n${CODED_BASIS}`,
        },
      ],
    },
    {
      heading: "Bottom line",
      level: 3,
      line: 20,
      blocks: [
        {
          type: "text" as const,
          line: 21,
          end: 22,
          text: `Credit is stable; ${CODED_CELL} is ample.\n${CODED_BASIS}`,
        },
      ],
    },
  ];
}

const CODED_VIEWS: [string, string][] = [
  ["#overview", "Credit is stable"],
  ["#changes", "Credit is stable"],
  ["#modules", "Cash runway"],
  ["#forecast", "Assumptions by case"],
  ["#evidence/summary", "Fundamental credit"],
];

describe.each(CODED_VIEWS)("module codes in handoff text on %s", (hash, marker) => {
  it("shows a module by its plain name", async () => {
    const snapshot = librarySnapshot() as unknown as Snapshot;
    const run = snapshot.workspace.runs.north;
    if (!run) throw new Error("Northbridge fixture is missing");
    run.changes = { note: "No earlier run matched." };
    run.modules = {};
    for (const module of ["CP-1", "CP-2", "CP-8"]) {
      const id = `northbridge-2026/outputs/${module}.md`;
      run.modules[module] = { outputs: [id], default: id };
      snapshot.workspace.outputs[id] = {
        id,
        run: "north",
        module,
        label: module,
        href: id,
        sha256: `digest-${module}`,
        state: { established: true, declared: null },
      };
      snapshot.workspace.handoffs[`digest-${module}`] = codedSections();
    }
    snapshot.workspace.models = [
      {
        id: "model",
        issuerKey: run.issuerKey ?? "",
        runId: null,
        runFolder: "northbridge-2026",
        sources: [],
        cashflow: null,
        register: {
          heading: "Forecast assumptions",
          intro: null,
          headers: ["Item", "Owner"],
          rows: [["Cash runway", CODED_CELL]],
        },
        href: "",
        download: "",
      },
    ];
    useSnapshot(snapshot);
    window.history.replaceState(null, "", `/report/northbridge-2026${hash}`);
    render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
    await screen.findByRole("heading", { level: 1, name: "Northbridge" });
    // The module page keeps its tables in the records region, closed until it is opened.
    if (hash === "#modules")
      fireEvent.click(await screen.findByRole("button", { name: "Show records" }));
    expect(document.body.textContent).toContain(marker);
    expect(document.body.textContent).not.toMatch(/\(CP-[A-Za-z0-9]+\)/);
  });
});

describe("the overview carries every module's bottom line and the run's limitations", () => {
  const text = (line: number, body: string) => ({
    type: "text" as const,
    line,
    end: line,
    text: body,
  });
  const handoff = (bottom: string | null, limits: string[]) => [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    ...(bottom === null
      ? []
      : [{ heading: "Bottom line", level: 3, line: 10, blocks: [text(11, bottom)] }]),
    {
      heading: "Limitations",
      level: 3,
      line: 20,
      blocks: limits.map((body, index) => text(21 + index, body)),
    },
  ];
  const BARE = "Cash is shown under CP-2D only.";
  function overviewSnapshot(
    modules: [string, string | null, string[]][],
    order = modules.map(([module]) => module),
    verified = true,
  ) {
    const snapshot = librarySnapshot() as unknown as Snapshot;
    const run = snapshot.workspace.runs.north;
    if (!run) throw new Error("Northbridge fixture is missing");
    run.record = { steps: order.map((module) => ({ module })) };
    run.modules = {};
    for (const [index, [module, bottom, limits]] of modules.entries()) {
      const id = `northbridge-2026/outputs/${module}.md`;
      const sha256 = String(index + 1).padStart(64, "0");
      run.modules[module] = { outputs: [id], default: id };
      snapshot.workspace.outputs[id] = {
        id,
        run: "north",
        module,
        label: module,
        href: id,
        sha256,
        state: { established: true, declared: null },
      };
      snapshot.workspace.handoffs[sha256] = handoff(bottom, limits);
      // The fundamental module's bottom line is the run's published credit view.
      if (module === "CP-2" && bottom !== null && verified) {
        run.publicationVerified = true;
        run.lead = { module, output: id, sha256, line: 11, text: bottom };
      }
    }
    return { snapshot, run };
  }
  async function showOverview() {
    window.history.replaceState(null, "", "/report/northbridge-2026#overview");
    render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
    await screen.findByRole("heading", { level: 1, name: "Northbridge" });
  }

  it("lists a bottom line per other module and each limitation once, by plain names", async () => {
    const { snapshot, run } = overviewSnapshot([
      ["CP-1", "Leverage is high; Liquidity (CP-2D) covers two years.", [BARE, "See debt.xlsx."]],
      ["CP-2D", "Not assessable: no liquidity schedule was supplied.", ["Blocked limitation."]],
      ["CP-2A", null, []],
      ["CP-4", "See debt.xlsx for the view.", []],
      ["CP-6", "The committee would watch the secured layer.", []],
      ["CP-2", "Credit is stable.", ["cash is shown under CP-2D only", "Lead limitation."]],
    ]);
    useSnapshot(snapshot);
    await showOverview();
    const lines = await screen.findByRole("region", { name: "Bottom line by module" });
    const bottomLines = within(lines).getByRole("list", { name: "Bottom lines" });
    expect(within(lines).getByRole("link", { name: /^Liquidity/ })).toHaveAttribute(
      "href",
      "#modules/CP-2D",
    );
    expect(
      within(within(lines).getByRole("link", { name: /^Liquidity/ })).getByText("Not assessable"),
    ).toBeVisible();
    expect(within(bottomLines).getByText(/no liquidity schedule was supplied/)).toBeVisible();
    expect(
      within(bottomLines).getByText(/Leverage is high; Liquidity covers two years\./),
    ).toBeVisible();
    // CP-2A wrote no bottom line: a gap. CP-4 wrote one that cites a file: a link, not a gap.
    expect(within(bottomLines).getAllByText(/wrote no bottom line/)).toHaveLength(1);
    // The committee's bottom line stays on its own page: no clearance is recorded for a decision.
    expect(document.body).not.toHaveTextContent(/would watch the secured layer/);
    expect(
      within(bottomLines).getByText(
        /This page does not show its bottom line: no clearance for it is recorded/,
      ),
    ).toBeVisible();
    expect(
      within(bottomLines).getByRole("link", { name: "Open Committee decision" }),
    ).toHaveAttribute("href", "#modules/CP-6");
    expect(
      within(bottomLines).getByRole("link", { name: "Read this bottom line in Evidence" }),
    ).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/report\/northbridge-2026#evidence\/.*-11$/),
    );
    // One line per other module; the lead's own bottom line is the call's, not repeated here.
    expect(within(bottomLines).getAllByRole("listitem")).toHaveLength(5);
    expect(lines.textContent).not.toMatch(/CP-/);
    expect(within(bottomLines).queryByText(/Credit is stable/)).toBeNull();

    const limits = screen.getByRole("region", { name: "What this run could not do" });
    const view = buildReportView(snapshot, "north", run);
    expect(runLimitations(view, run)).toHaveLength(3);
    // One recorded-limitation line per limitation, once; the blocked module is a well, not a line.
    const wells = within(limits).getAllByRole("listitem");
    const lineItems = wells.filter((item) => item.querySelector(":scope > p.reading-copy"));
    expect(lineItems).toHaveLength(runLimitations(view, run).length);
    // A module's first limitation is shown; its others are counted behind one named control.
    const more = [...limits.querySelectorAll("details")];
    expect(more).toHaveLength(1);
    expect(more[0]?.querySelector("summary")).toHaveTextContent(/^1 more from /);
    for (const details of more) details.open = true;
    expect(within(limits).getByText("Cash is shown under Liquidity only.")).toBeVisible();
    expect(within(limits).getByText("Lead limitation.")).toBeVisible();
    expect(
      within(limits).getByRole("link", { name: "Read this limitation in Evidence" }),
    ).toBeVisible();
    for (const line of lineItems)
      expect(
        within(line).getByRole("button", { name: /^Show sources for this limitation/ }),
      ).toBeInTheDocument();
    expect(within(limits).getByText("Not assessable")).toBeVisible();
    expect(within(limits).queryByText(/Blocked limitation/)).toBeNull();
    expect(limits.textContent).not.toMatch(/CP-/);
    expect(screen.getAllByRole("heading", { name: "What this run could not do" })).toHaveLength(1);
  });

  it("says so when no module recorded a limitation, and omits the list of other modules for a lone lead", async () => {
    const { snapshot } = overviewSnapshot([["CP-2", "Credit is stable.", []]]);
    useSnapshot(snapshot);
    await showOverview();
    const limits = await screen.findByRole("region", { name: "What this run could not do" });
    expect(
      within(limits).getByText(
        "No limitation is listed on this page for this run. Each module's page shows what it recorded.",
      ),
    ).toBeVisible();
    expect(within(limits).queryByRole("listitem")).toBeNull();
    // The lone lead is the pipeline's one node and its bottom line is the call's, not a repeat.
    const lines = screen.getByRole("region", { name: "Bottom line by module" });
    expect(within(lines).queryByRole("list", { name: "Bottom lines" })).toBeNull();
    expect(within(lines).queryByText("Credit is stable.")).toBeNull();
    expect(
      within(screen.getByRole("region", { name: "The call" })).getByText("Credit is stable."),
    ).toBeVisible();
  });

  it("draws no credit view for a run whose publication is not verified", async () => {
    const { snapshot } = overviewSnapshot([["CP-2", "Credit is stable.", []]], ["CP-2"], false);
    useSnapshot(snapshot);
    await showOverview();
    const call = await screen.findByRole("region", { name: "The call" });
    expect(
      within(call).getByText(/A verified credit view is unavailable for this run/),
    ).toBeVisible();
    expect(within(call).queryByText("Credit is stable.")).toBeNull();
  });

  it("draws the summary's limitation for an earlier-format run, and not the empty sentence", async () => {
    const { snapshot } = overviewSnapshot([["CP-1", null, []]]);
    const output = snapshot.workspace.outputs["northbridge-2026/outputs/CP-1.md"];
    if (!output) throw new Error("CP-1 output is missing");
    output.summary = {
      bottomLine: "Leverage is high [CP-1 p. 4].",
      confidence: "Medium",
      limitation: "The 2025 accounts are unaudited.",
      line: 6,
    };
    snapshot.workspace.handoffs[output.sha256] = [
      { heading: "Findings", level: 2, line: 1, blocks: [] },
    ];
    useSnapshot(snapshot);
    await showOverview();
    const lines = await screen.findByRole("region", { name: "Bottom line by module" });
    expect(within(lines).getByText("Leverage is high.")).toBeVisible();
    const limits = screen.getByRole("region", { name: "What this run could not do" });
    expect(within(limits).getByRole("link", { name: "Financial foundation" })).toHaveAttribute(
      "href",
      "#modules/CP-1",
    );
    expect(within(limits).getByText("The 2025 accounts are unaudited.")).toBeVisible();
    expect(limits.textContent).not.toMatch(/No limitation is listed/);
  });
});
