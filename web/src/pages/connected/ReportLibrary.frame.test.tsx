// T17: the report frame's error states (C3-007), its Earlier format and Earlier methods labels
// (C3-008), key charts retired from Overview (C3-024), Run history rows (C1-007) and CP-8 kept off Overview
// (C3-026).
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportReader } from "./ReportLibrary";
import type { Block, PublishedRun, Section, Snapshot } from "./publishedReport";

const MAP = ["From", "Relationship", "Edge type", "To", "Evidence"];
const text = (line: number, value: string): Block => ({
  type: "text",
  line,
  end: line,
  text: value,
});
const h = (heading: string, level: number, line: number, blocks: Block[] = []): Section => ({
  heading,
  level,
  line,
  blocks,
});

const cp2 = (lead = "Bottom line"): Section[] => [
  h("Findings", 2, 1),
  h(lead, 3, 3, [text(4, "Leverage is high but liquidity covers the next two years.")]),
  h("Limitations", 3, 6, [text(7, "The forecast rests on one year of audited figures.")]),
  h("Map: credit-risk transmission", 3, 10, [
    {
      type: "table",
      line: 12,
      headers: MAP,
      rows: [
        { line: 14, cells: ["Rates", "raise", "Analyst Interpretation", "Interest", "Note 4"] },
      ],
    },
  ]),
];
const cp8: Section[] = [
  h("Findings", 2, 1),
  h("Bottom line", 3, 3, [text(4, "Leverage fell, and the credit view improved.")]),
  h("Limitations", 3, 6, [text(7, "The earlier run did not state gross debt.")]),
];

const SHA2 = "b".repeat(64);
const SHA8 = "c".repeat(64);

function snapshot({
  folder = "acme",
  lead,
  methodChanges,
  others = [],
}: {
  folder?: string;
  lead?: string;
  methodChanges?: string[];
  others?: Pick<PublishedRun, "folder" | "issuerKey" | "pathway" | "asOf" | "period" | "history">[];
} = {}) {
  const run = {
    folder,
    issuer: "Acme",
    issuerKey: "acme",
    asOf: "2026-03-31",
    period: "FY2025",
    pathway: "credit_snapshot",
    modules: {
      "CP-2": { outputs: [`${folder}/cp2`], default: `${folder}/cp2` },
      "CP-8": { outputs: [`${folder}/cp8`], default: `${folder}/cp8` },
    },
    record: { steps: [{ module: "CP-2" }, { module: "CP-8" }] },
    methodChanges,
    evidence: { sources: [], unused: [], unrecorded: [], handoffs: [], downloads: [], zip: null },
  };
  const output = (module: string, sha256: string, extra = {}) => ({
    id: `${folder}/${module.toLowerCase().replace("-", "")}`,
    run: `${folder}Key`,
    module,
    sha256,
    label: module,
    href: "",
    ...extra,
  });
  return {
    catalogue: {
      real: [
        {
          id: folder,
          name: "Acme",
          issuer: "Acme",
          title: "",
          date: "",
          period: "FY2025",
          sector: "",
          metrics: {},
        },
      ],
    },
    workspace: {
      runs: {
        [`${folder}Key`]: run,
        ...Object.fromEntries(others.map((other) => [`${other.folder}Key`, other])),
      },
      outputs: {
        [`${folder}/cp2`]: output("CP-2", SHA2, {
          maps: [{ title: "credit-risk transmission", table: 12 }],
        }),
        [`${folder}/cp8`]: output("CP-8", SHA8),
      },
      handoffs: { [SHA2]: cp2(lead), [SHA8]: cp8 },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

function serve(routes: Record<string, () => Response | Promise<Response>>) {
  const fetch = vi.fn((url: string) => {
    const reply = routes[url];
    return reply ? Promise.resolve(reply()) : Promise.resolve(json({ error: "not found" }, 404));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function open(hash = "#overview") {
  window.history.replaceState(null, "", `/${hash}`);
  render(<ReportReader id="acme" mode="synthetic" />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

const SNAPSHOT = "/connected/snapshot?run=acme";
const ACTIVITY = "/connected/activity/acme";
const unknownReport = () => json({ error: "unknown report" }, 404);

it("says a run that is still going is still going, with its Run activity", async () => {
  serve({ [SNAPSHOT]: unknownReport, [ACTIVITY]: () => json({ id: "acme", status: "running" }) });
  open();
  const alert = await screen.findByText("This run is in progress");
  const box = alert.closest("[role]") as HTMLElement;
  expect(box).toHaveTextContent("The report will appear here once it’s published.");
  expect(within(box).getByRole("link", { name: "Run progress" })).toHaveAttribute(
    "href",
    "/run/acme",
  );
  expect(screen.queryByText(/could not be loaded/)).toBeNull();
});

it("says a run that failed ended without a report, with its Run activity and the library", async () => {
  serve({ [SNAPSHOT]: unknownReport, [ACTIVITY]: () => json({ id: "acme", status: "failed" }) });
  open();
  const box = (await screen.findByText("This run ended without a report")).closest(
    "[role]",
  ) as HTMLElement;
  expect(within(box).getByRole("link", { name: "Run progress" })).toHaveAttribute(
    "href",
    "/run/acme",
  );
  expect(within(box).getByRole("link", { name: "Back to the library" })).toHaveAttribute(
    "href",
    "/",
  );
});

it("says an address with no report and no run has none, with the way back to the library", async () => {
  serve({ [SNAPSHOT]: unknownReport, [ACTIVITY]: () => json({ error: "unknown run" }, 404) });
  open();
  const box = (await screen.findByText("No report at this address")).closest(
    "[role]",
  ) as HTMLElement;
  expect(within(box).getByRole("link", { name: "Back to the library" })).toHaveAttribute(
    "href",
    "/",
  );
});

it("states a network failure in a fixed sentence, never the browser's, and Try again reads afresh", async () => {
  let calls = 0;
  serve({
    [SNAPSHOT]: () => {
      calls += 1;
      if (calls === 1) throw new TypeError("Failed to fetch");
      return json(snapshot());
    },
  });
  open();
  await screen.findByText("The report service could not be reached");
  expect(screen.queryByText(/Failed to fetch/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("region", { name: "Overview" })).toBeInTheDocument();
});

it("keeps CP-8's bottom line and limitations off Overview, and points to Changes", async () => {
  const snap = snapshot({
    others: [
      {
        folder: "acme-0",
        issuerKey: "acme",
        pathway: "credit_snapshot",
        asOf: "2025-03-31",
        period: "FY2024",
      },
    ],
  });
  const current = snap.workspace.runs.acmeKey as PublishedRun;
  current.changes = {
    pack: {
      prior: { run: "acme-0", as_of: "2025-03-31", pathway: "credit_snapshot" },
      current: { as_of: "2026-03-31", pathway: "credit_snapshot" },
    },
  };
  serve({ [SNAPSHOT]: () => json(snap) });
  open();
  const since = await screen.findByRole("region", { name: "Since the earlier run" });
  expect(
    within(since).getByText("A comparison with the earlier run is on the Changes page."),
  ).toBeVisible();
  expect(within(since).getByRole("link", { name: "Open Changes" })).toHaveAttribute(
    "href",
    "#changes",
  );
  expect(screen.queryByText("Leverage fell, and the credit view improved.")).toBeNull();
  const page = screen.getByRole("region", { name: "Overview" });
  expect(page).toHaveTextContent("The forecast rests on one year of audited figures.");
  expect(page).not.toHaveTextContent("The earlier run did not state gross debt.");
});

it("draws no module chart repeat on Overview, and the transmission map once on its own module page", async () => {
  serve({ [SNAPSHOT]: () => json(snapshot()) });
  open();
  await screen.findByRole("region", { name: "Overview" });
  expect(screen.queryByRole("heading", { name: "Key charts" })).toBeNull();
  expect(screen.queryByRole("heading", { name: /credit-risk transmission/ })).toBeNull();
  expect(screen.queryByRole("figure", { name: "credit-risk transmission" })).toBeNull();
  cleanup();
  open("#modules/CP-2");
  // Fundamental credit's lead draws its maps; the frame draws no second copy.
  expect(
    await screen.findByRole("region", { name: "Credit-risk transmission" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("figure", { name: "credit-risk transmission" })).toBeNull();
});

it("labels an earlier-format run with changed methods on Overview and Changes", async () => {
  serve({
    [SNAPSHOT]: () =>
      json(snapshot({ lead: "Reader summary", methodChanges: ["CP-2: methods/cp2.md changed"] })),
  });
  open();
  await screen.findByRole("region", { name: "Overview" });
  expect(screen.getByText("Earlier format")).toBeInTheDocument();
  expect(screen.getByText("Earlier methods")).toBeInTheDocument();
  cleanup();
  open("#changes");
  await screen.findByText("Earlier methods");
  expect(screen.getByText("Earlier format")).toBeInTheDocument();
});

it("gives a run in the current format on today's methods neither label", async () => {
  serve({ [SNAPSHOT]: () => json(snapshot({ methodChanges: [] })) });
  open();
  await screen.findByRole("region", { name: "Overview" });
  expect(screen.queryByText("Earlier format")).toBeNull();
  expect(screen.queryByText("Earlier methods")).toBeNull();
});

it("gives every Report history row its modules run, its status and its labels", async () => {
  const older = {
    folder: "acme-2025",
    issuerKey: "acme",
    pathway: "credit_snapshot",
    asOf: "2025-03-31",
    period: "FY2024",
    history: { modules: ["CP-2", "CP-8"], earlierFormat: true, earlierMethods: true },
  };
  const fetch = serve({
    [SNAPSHOT]: () => json(snapshot({ others: [older] })),
  });
  open("#history");
  const section = await screen.findByRole("region", { name: "Runs of Acme" });
  const rows = within(
    within(section).getByRole("list", { name: "Runs, newest first" }),
  ).getAllByRole("listitem");
  expect(rows).toHaveLength(2);
  const [current, earlier] = rows as [HTMLElement, HTMLElement];
  const modulesRun = "2 modules runFundamental credit, Changes since the last run";
  expect((await within(current).findByText("2 modules run")).closest("details")).toHaveTextContent(
    modulesRun,
  );
  expect(within(section).getAllByText(/Finished runs, newest first\./)).toHaveLength(1);
  expect(current).not.toHaveTextContent("Earlier");
  expect(await within(earlier).findByText("Earlier format")).toBeInTheDocument();
  expect(earlier).toHaveTextContent(modulesRun);
  expect(within(earlier).getByText("Earlier methods")).toBeInTheDocument();
  expect(within(current).getByRole("link", { name: "Open overview" })).toHaveAttribute(
    "href",
    "/report/acme#overview",
  );
  expect(within(earlier).getByRole("link", { name: "What changed" })).toHaveAttribute(
    "href",
    "/report/acme-2025#changes",
  );
  expect(
    fetch.mock.calls.map(([url]) => url).filter((url) => url.startsWith("/connected/snapshot")),
  ).toEqual([SNAPSHOT]);
});

it.each([false, undefined])(
  "keeps an unverified committee attempt in Modules (%s)",
  async (verified) => {
    const fixture = snapshot();
    const run = fixture.workspace.runs.acmeKey;
    if (!run) throw new Error("Expected the selected fixture run");
    run.publicationVerified = verified;
    const earlier = "acme/committee-first";
    const latest = "acme/committee-retry";
    const earlierSha = "a".repeat(64);
    const latestSha = "d".repeat(64);
    const positive = "Final Action Bias: Add exposure by 2% of NAV.";
    run.modules["CP-6"] = { outputs: [earlier, latest], default: latest };
    run.lead = { module: "CP-6", line: 4, output: latest, sha256: latestSha, text: positive };
    fixture.workspace.outputs[earlier] = {
      id: earlier,
      module: "CP-6",
      sha256: earlierSha,
      href: "",
      label: "First attempt",
    };
    fixture.workspace.outputs[latest] = {
      id: latest,
      module: "CP-6",
      sha256: latestSha,
      href: "",
      label: "Retry",
    };
    fixture.workspace.handoffs[earlierSha] = [
      h("Findings", 2, 1),
      h("Bottom line", 3, 3, [text(4, "Limited assessment.")]),
    ];
    fixture.workspace.handoffs[latestSha] = [
      h("Findings", 2, 1),
      h("Bottom line", 3, 3, [text(4, positive)]),
      h("Decision", 3, 7, [text(8, positive)]),
    ];
    serve({ [SNAPSHOT]: () => json(fixture) });
    open();
    expect(
      await screen.findByText(/A verified credit view is unavailable for this run/),
    ).toBeVisible();
    expect(document.body).not.toHaveTextContent("Add exposure");

    window.location.hash = "#modules/CP-6";
    expect((await screen.findAllByText(positive)).length).toBeGreaterThan(0);
  },
);
