import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { PublishedRun, Section, Snapshot } from "../publishedReport";
import { RunHistory } from "./History";

const decision = (bias: string): Section[] => [
  {
    heading: "Decision",
    level: 3,
    line: 3,
    blocks: [{ type: "text", line: 4, end: 4, text: `Final Action Bias: ${bias}. Reason.` }],
  },
];

function published(folder: string, asOf: string | null, extra = {}): PublishedRun {
  return {
    folder,
    issuer: "Acme",
    issuerKey: "acme",
    asOf,
    period: "FY",
    pathway: "full",
    modules: { "CP-6": { outputs: [`${folder}/cp6`], default: `${folder}/cp6` } },
    changes: null,
    evidence: {},
    ...extra,
  } as unknown as PublishedRun;
}

/** A run the server sends only as a summary (react_frontend/sources.py `scoped`): no modules. */
function summary(folder: string, asOf: string | null, earlierFormat = false): PublishedRun {
  const record = published(folder, asOf, {
    history: { modules: ["CP-6"], earlierFormat, earlierMethods: false },
  }) as unknown as Record<string, unknown>;
  delete record.modules;
  return record as unknown as PublishedRun;
}

/** As the server scopes it: the opened run and its validated prior in full, every other run a summary. */
function setup() {
  const prior = { run: "old", as_of: "2025-03-31", pathway: "full" };
  const runs: Record<string, PublishedRun> = {
    oldKey: published("old", "2025-03-31"),
    midKey: summary("mid", "2025-09-30"),
    earlyKey: summary("early", "2024-03-31", true),
    newKey: published("new", "2026-03-31", {
      changes: { pack: { prior, current: { as_of: "2026-03-31", pathway: "full" } } },
    }),
    otherKey: { ...summary("other", "2026-06-30"), issuerKey: "beta" },
  };
  const output = (folder: string, sha256: string) => ({
    id: `${folder}/cp6`,
    run: `${folder}Key`,
    module: "CP-6",
    sha256,
    label: "CP-6",
    href: "",
  });
  const snapshot = {
    catalogue: { real: [] },
    workspace: {
      runs,
      outputs: {
        "old/cp6": output("old", "o".repeat(64)),
        "new/cp6": output("new", "n".repeat(64)),
      },
      handoffs: {
        ["o".repeat(64)]: decision("Requires More Work"),
        ["n".repeat(64)]: decision("Watchlist"),
      },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
  return { snapshot, runs };
}

function row(items: HTMLElement[], index: number) {
  const item = items[index];
  if (!item) throw new Error(`no row ${String(index)}`);
  return item;
}

function rows() {
  const { snapshot, runs } = setup();
  render(<RunHistory snapshot={snapshot} run={runs.newKey as PublishedRun} issuer="Acme" />);
  return within(screen.getByRole("list", { name: "Runs, newest first" })).getAllByRole("listitem");
}

it("lists this issuer's runs newest first with the as-of date and the heading", () => {
  const items = rows();
  expect(screen.getByRole("heading", { name: "Runs of Acme" })).toBeTruthy();
  expect(items.map((item) => /\d{1,2} \w+ \d{4}/.exec(item.textContent)?.[0])).toEqual([
    "31 March 2026",
    "30 September 2025",
    "31 March 2025",
    "31 March 2024",
  ]);
});

it("shows no run's decision, only that it is not shown, and which runs it has as summaries", () => {
  const items = rows();
  const notShown = "Committee action and size: Not shown";
  expect(within(row(items, 0)).getByText(notShown)).toBeTruthy();
  expect(within(row(items, 1)).getByText("Decision not in the run list")).toBeTruthy();
  expect(within(row(items, 2)).getByText(notShown)).toBeTruthy();
  expect(within(row(items, 3)).getByText("Decision not in the run list")).toBeTruthy();
  // The committees' words stay on their own module pages.
  expect(screen.queryByText(/Watchlist|Requires More Work/)).toBeNull();
});

it("names a decision with a recorded hold as withheld", () => {
  const { snapshot, runs } = setup();
  const hold = {
    output: "new/cp6",
    sha256: "n".repeat(64),
    state: "withheld",
    scope: "committee",
    reason: "Sizing waits for the limit review.",
  };
  const held = { ...runs.newKey, actionTreatment: { "CP-6": hold } } as PublishedRun;
  runs.newKey = held;
  render(<RunHistory snapshot={snapshot} run={held} issuer="Acme" />);
  const items = within(screen.getByRole("list", { name: "Runs, newest first" })).getAllByRole(
    "listitem",
  );
  expect(within(row(items, 0)).getByText("Committee action and size: Withheld")).toBeTruthy();
  expect(within(row(items, 2)).getByText("Committee action and size: Not shown")).toBeTruthy();
});

it("names no decision for a run it holds in full with no committee module", () => {
  const { snapshot, runs } = setup();
  const bare = published("new", "2026-03-31", { modules: {} });
  runs.newKey = bare;
  render(<RunHistory snapshot={snapshot} run={bare} issuer="Acme" />);
  const items = within(screen.getByRole("list", { name: "Runs, newest first" })).getAllByRole(
    "listitem",
  );
  expect(within(row(items, 0)).queryByText(/Committee action and size/)).toBeNull();
  expect(within(row(items, 0)).queryByText("Decision not in the run list")).toBeNull();
});

it("states each run's scope, unverified unless the publication says otherwise", () => {
  const items = rows();
  expect(within(row(items, 0)).getByText("Assessment scope unverified")).toBeTruthy();
});

it("orders same-as-of runs by first model call and labels the deterministic fallback", () => {
  const { snapshot, runs } = setup();
  const mid = summary("mid", "2026-11-26");
  runs.midKey = {
    ...mid,
    history: {
      ...(mid.history as NonNullable<PublishedRun["history"]>),
      firstModelCall: { attempt: 1, started: "2026-11-26T12:06:41.374957Z" },
    },
  };
  const twin = summary("twin", "2026-11-26");
  runs.twinKey = {
    ...twin,
    history: {
      ...(twin.history as NonNullable<PublishedRun["history"]>),
      firstModelCall: { attempt: 1, started: "2026-11-26T11:38:46.314826+00:00" },
    },
  };
  runs.alphaKey = summary("alpha", "2026-11-26");
  runs.zuluKey = summary("zulu", "2026-11-26");
  render(<RunHistory snapshot={snapshot} run={runs.newKey as PublishedRun} issuer="Acme" />);
  const items = within(screen.getByRole("list", { name: "Runs, newest first" })).getAllByRole(
    "listitem",
  );
  const same = items.filter((item) => within(item).queryByText("Same as-of date"));
  expect(same).toHaveLength(4);
  expect(same.every((item) => item.textContent.includes("26 November 2026"))).toBe(true);
  const links = same.map((item) => within(item).getByRole("link", { name: "Open overview" }));
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/report/mid#overview",
    "/report/twin#overview",
    "/report/zulu#overview",
    "/report/alpha#overview",
  ]);
  expect(
    within(same[0] as HTMLElement).getByText(
      "First model call · attempt 1 · 2026-11-26 12:06:41.374957 UTC",
    ),
  ).toBeVisible();
  expect(
    within(same[1] as HTMLElement).getByText(
      "First model call · attempt 1 · 2026-11-26 11:38:46.314826 UTC",
    ),
  ).toBeVisible();
  expect(
    within(same[2] as HTMLElement).getByText("First model-call time unavailable"),
  ).toBeVisible();
});

it("marks only the current run", () => {
  const items = rows();
  expect(screen.getAllByText("This run")).toHaveLength(1);
  expect(within(row(items, 0)).getByText("This run")).toBeTruthy();
});

it("shows pathway, finished state, labels, modules run and the two links", () => {
  const items = rows();
  expect(within(row(items, 0)).getByText("full")).toBeTruthy();
  // Every listed run is finished: the tile explains the timeline once, and no row repeats it.
  expect(screen.getAllByText(/As-of dates descend\./)).toHaveLength(1);
  expect(within(row(items, 0)).queryByText(/Finished/)).toBeNull();
  for (const at of [0, 1]) {
    const modules = within(row(items, at)).getByText("1 module run").closest("details");
    expect(modules).not.toHaveAttribute("open");
    expect(modules).toHaveTextContent(/1 module run\S/);
  }
  expect(within(row(items, 3)).getByText("Earlier format")).toBeTruthy();
  const overview = within(row(items, 2)).getByRole("link", { name: "Open overview" });
  const changes = within(row(items, 2)).getByRole("link", { name: "What changed" });
  expect(overview.getAttribute("href")).toMatch(/old.*#overview$/);
  expect(changes.getAttribute("href")).toMatch(/old.*#changes$/);
});

it("says who started each run is not published", () => {
  rows();
  expect(screen.getByText("Who started each run is not published with the report.")).toBeTruthy();
});

it("explains the run ordering basis and labels missing call times", () => {
  rows();
  expect(
    screen.getByText(/As-of dates descend.*first model-call start.*follow deterministically/u),
  ).toBeVisible();
  expect(screen.getAllByText("First model-call time unavailable")).toHaveLength(4);
});

it("uses the exact earliest receipt start for a full run", () => {
  const { snapshot, runs } = setup();
  const current = runs.newKey as PublishedRun;
  const receipt = (attempt: number, started: string) => ({
    module: "CP-0",
    attempt,
    started,
    http_status: 200,
    error_class: null,
    settled_usd: null,
  });
  const complete: PublishedRun = {
    ...current,
    evidence: {
      ...current.evidence,
      record: {
        ...current.evidence.record,
        calls: [receipt(2, "2026-03-31T12:06:41.374957Z"), receipt(1, "2026-03-31T11:38:42Z")],
      },
    },
  };
  runs.newKey = complete;
  render(<RunHistory snapshot={snapshot} run={complete} issuer="Acme" />);
  const items = within(screen.getByRole("list", { name: "Runs, newest first" })).getAllByRole(
    "listitem",
  );
  expect(
    within(row(items, 0)).getByText("First model call · attempt 1 · 2026-03-31 11:38:42 UTC"),
  ).toBeVisible();
});

it("leaves out runs of another issuer and says when the date is missing", () => {
  const { snapshot, runs } = setup();
  runs.midKey = summary("mid", null);
  snapshot.workspace.runs = runs;
  render(<RunHistory snapshot={snapshot} run={runs.newKey as PublishedRun} issuer="Acme" />);
  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  expect(screen.getByText("As-of date not recorded")).toBeTruthy();
  expect(screen.queryByText("2026-06-30")).toBeNull();
});

it("lays the runs tile on the report's 12-column grid", () => {
  rows();
  const tile = screen.getByRole("region", { name: "Runs of Acme" });
  expect(tile.parentElement).toHaveClass("lg:grid-cols-12");
});
