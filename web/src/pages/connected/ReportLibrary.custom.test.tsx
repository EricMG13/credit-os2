// PR 7a (owner, 2026-11-26): the library pages of a custom run. SYNTHETIC: a hand-built snapshot of
// a custom run as the launcher records it (pathway `custom`, `requested` the completed list with
// CP-8 last, selection `explicit`) compared with an earlier custom run of the same modules. No
// model ran. Overview, Changes, Modules, Forecast and Evidence render from its handoffs; the lead
// is the module ruling C16 names.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportReader } from "./ReportLibrary";
import type { Block, Section, Snapshot } from "./publishedReport";

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
const handoff = (bottom: string, limit: string): Section[] => [
  h("Findings", 2, 1),
  h("Bottom line", 3, 3, [text(4, bottom)]),
  h("Limitations", 3, 6, [text(7, limit)]),
];
const ledger: Section[] = [
  h("Findings", 2, 1),
  h("Bottom line", 3, 3, [text(4, "Covenant headroom narrowed since the earlier run.")]),
  h("Limitations ledger", 3, 10, [
    {
      type: "table",
      line: 11,
      headers: ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"],
      rows: [
        {
          line: 12,
          cells: ["E1", "C1", "No compliance certificate supplied", "Remaining", "—"],
        },
      ],
    },
  ]),
];

const COMPLETED = ["CP-0", "CP-1", "CP-4"];
const BOTTOM: Record<string, string> = {
  "CP-0": "The sources cover three financial years.",
  "CP-1": "Leverage is moderate and liquidity is adequate.",
  "CP-4": "Covenant headroom is thin on the leverage test.",
};
const sha = (name: string) => Buffer.from(name).toString("hex").padEnd(64, "0").slice(0, 64);

function snapshot(pathway = "custom") {
  const output = (folder: string, module: string, key: string) => ({
    id: `${folder}/${module}`,
    run: key,
    module,
    sha256: sha(`${folder}${module}`),
    label: module,
    href: "",
  });
  const folder = "acme-custom";
  const modules = [...COMPLETED, "CP-8"];
  const run = {
    folder,
    issuer: "Acme",
    issuerKey: "acme",
    asOf: "2026-03-31",
    period: "FY2025",
    pathway,
    requested: modules,
    publicationVerified: true,
    assessmentScope: "standard",
    // What the library index publishes as this run's lead (`react_frontend.library_cards`): CP-4.
    lead: {
      module: "CP-4",
      output: `${folder}/CP-4`,
      sha256: sha(`${folder}CP-4`),
      line: 4,
      text: BOTTOM["CP-4"],
    },
    modules: Object.fromEntries(
      modules.map((m) => [m, { outputs: [`${folder}/${m}`], default: `${folder}/${m}` }]),
    ),
    record: { steps: modules.map((module) => ({ module })) },
    changes: {
      pack: {
        prior: { run: "acme-custom-0", as_of: "2025-03-31", pathway, selection: "explicit" },
        current: { as_of: "2026-03-31", pathway, selection: "explicit" },
        modules: COMPLETED.map((module) => ({ module, ran_prior: true, ran_current: true })),
      },
    },
    evidence: { sources: [], unused: [], unrecorded: [], handoffs: [], downloads: [], zip: null },
  };
  const earlier = {
    folder: "acme-custom-0",
    issuer: "Acme",
    issuerKey: "acme",
    asOf: "2025-03-31",
    period: "FY2024",
    pathway,
    history: { modules: [...COMPLETED, "CP-8"], earlierFormat: false, earlierMethods: false },
  };
  const outputs = Object.fromEntries(
    modules.map((m) => [`${folder}/${m}`, output(folder, m, "acmeKey")]),
  );
  const handoffs = Object.fromEntries(
    modules.map((m) => [
      sha(`${folder}${m}`),
      m === "CP-8" ? ledger : handoff(BOTTOM[m] ?? "", `${m} is limited to the supplied sources.`),
    ]),
  );
  const model = {
    id: "acme-model",
    issuerKey: "acme",
    runId: folder,
    runFolder: folder,
    href: "",
    download: "",
    sources: [],
    cashflow: {
      units: "USD millions",
      limits: ["Cash proxy is not issuer free cash flow."],
      columns: [{ label: "FY2026", group: "Base" }],
      rows: [
        {
          label: "Cash proxy",
          band: "Cash",
          kind: "money",
          total: false,
          cells: [{ status: "value", exact: "120", display: "120" }],
        },
      ],
    },
  };
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
      runs: { acmeKey: run, earlierKey: earlier },
      outputs,
      handoffs,
      models: [model],
    },
    chips: {},
  } as unknown as Snapshot;
}

const SNAPSHOT = "/connected/snapshot?run=acme-custom";

function open(hash: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === SNAPSHOT
          ? Response.json(snapshot())
          : Response.json({ error: "not found" }, { status: 404 }),
      ),
    ),
  );
  window.history.replaceState(null, "", `/${hash}`);
  render(<ReportReader id="acme-custom" mode="synthetic" />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

it("Overview leads with Legal & covenants, the module ruling C16 names for Covenant Capacity", async () => {
  open("#overview");
  const page = await screen.findByRole("region", { name: "Overview" });
  // The call is the published lead (`lead`, as `react_frontend.library_cards` picks it for a
  // custom run: tests/test_react_library_cards.py); the Overview draws it under its module's name.
  expect(page).toHaveTextContent("The call · Legal & covenants");
  expect(page).toHaveTextContent(BOTTOM["CP-4"] ?? "");
  // The lead is not repeated as another module's line, and CP-8's findings stay on Changes.
  expect(page).not.toHaveTextContent("Covenant headroom narrowed since the earlier run.");
  expect(page).not.toHaveTextContent(/CP-\d/);
});

it("Changes shows the comparison with the earlier custom run from CP-8's handoff", async () => {
  open("#changes");
  expect(await screen.findByText("No compliance certificate supplied")).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("first run");
});

it("Modules opens a chosen module from its handoff", async () => {
  open("#modules/CP-4");
  expect(await screen.findByText(BOTTOM["CP-4"] ?? "")).toBeInTheDocument();
});

it("Forecast is published for a custom run, as in Deep", async () => {
  open("#forecast");
  expect(await screen.findByText("Cash proxy")).toBeInTheDocument();
  expect(screen.queryByText(/No forecast model was published/)).toBeNull();
});

it("Evidence renders for a custom run", async () => {
  open("#evidence");
  expect(await screen.findByRole("heading", { name: "Evidence" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Run evidence" })).toBeInTheDocument();
  expect(within(document.body).queryByText(/could not be loaded/)).toBeNull();
});
