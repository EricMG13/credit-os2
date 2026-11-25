// A credit screening run, built from the published form of the Task 1 fixture
// (tests/fixtures/credit-screening/CP-L10.md): Modules, Evidence and Forecast pages.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { PublishedRun, Snapshot } from "../publishedReport";
import { buildReportView } from "../reportView";
import { CallRow } from "./overview/CallRow";
import { LimitsRow } from "./overview/LimitsRow";
import { PipelineRow } from "./overview/PipelineRow";
import { overviewView } from "./overview/decision";
import { Modules } from "./Modules";
import { ReportEvidence } from "./Evidence";
import { Forecast } from "./Forecast";
import { creditScreeningEntry } from "./leads/fixtures/load";

afterEach(cleanup);

const REGISTERS = ["TL10", "TL20", "TL23", "TL30", "TL40"].flatMap((screen) =>
  [1, 2, 3, 4].map((n) => `${screen}.${String(n)}`),
);
const SCREENS = [
  "Financial change screen",
  "Credit screen",
  "Liquidity and forward-risk screen",
  "Security opportunity screen",
  "Creditor-document screen",
];

const fixture = creditScreeningEntry();
const ID = "case/CP-L10.md";
const SHA = "a".repeat(64);
const evidence = {
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
  folder: "case",
  issuer: "Harbourline Synthetic Foods plc",
  issuerKey: "harbourline",
  title: "Credit screening",
  period: "FY2024",
  asOf: "2025-03-31",
  pathway: "credit_screening",
  modules: { "CP-L10": { outputs: [ID], default: ID } },
  record: { steps: [{ module: "CP-L10" }] },
  evidence,
} as unknown as PublishedRun;
const snapshot = {
  catalogue: { real: [] },
  chips: {},
  workspace: {
    runs: { case: run },
    outputs: { [ID]: { ...fixture.output, id: ID, sha256: SHA } },
    handoffs: { [SHA]: fixture.sections },
    models: [],
  },
} as unknown as Snapshot;
const view = buildReportView(snapshot, "case", run);
const [entry] = view.entries;
if (!entry) throw new Error("the published run holds no CP-L10 output");

/**
 * The module ids the page already prints for every module of every run: the navigator caption and
 * the title chip are mono spans holding exactly a module id (library/parts/ModuleNav.tsx, not this
 * PR's). Only those nodes are stripped; the stripped texts are returned so a test can assert they
 * are the run's own module ids and nothing else.
 */
const KNOWN_ID_NODES = "span.font-mono";

function withoutKnownIds(container: HTMLElement) {
  const clone = container.cloneNode(true) as HTMLElement;
  const stripped: string[] = [];
  clone.querySelectorAll(KNOWN_ID_NODES).forEach((node) => {
    if (!/^CP-[A-Z0-9]+$/.test(node.textContent)) return;
    stripped.push(node.textContent);
    node.remove();
  });
  return { text: clone.textContent, stripped };
}

it("builds the run's view with the pathway's name for CP-L10", () => {
  expect(view.modules.map(({ id, name }) => [id, name])).toEqual([["CP-L10", "Credit screening"]]);
});

it("Modules: the five reader tables, no module code, no source or register column", () => {
  const { container } = render(
    <Modules view={view} run={run} snapshot={snapshot} module="CP-L10" />,
  );
  expect(screen.getByRole("heading", { name: "Credit screening" })).toBeInTheDocument();
  for (const title of SCREENS)
    expect(screen.getByRole("table", { name: title, hidden: true })).toBeInTheDocument();
  // The navigator prints a module's id beside its name for every module of every run
  // (library/parts/ModuleNav.tsx, not this PR's); nothing else on the page may print a code.
  const { text, stripped } = withoutKnownIds(container);
  expect(stripped.length).toBeGreaterThan(0);
  expect(new Set(stripped)).toEqual(new Set(Object.keys(run.modules)));
  expect(text).not.toMatch(/CP-/);
  expect(text).not.toMatch(/Short credit snapshot/);
  expect(text).not.toMatch(/source_ref|_module_id|_module_ids|source_owner_module/);
  expect(text).not.toMatch(/TL\d\d?\.\d/);
});

it("Overview: no module code and no source or register column", () => {
  const props = { snapshot, run, view: overviewView(view, run) };
  const { container } = render(
    <>
      <CallRow {...props} />
      <LimitsRow {...props} />
      <PipelineRow {...props} />
    </>,
  );
  const { text, stripped } = withoutKnownIds(container);
  // Overview prints no module id at all.
  expect(stripped).toEqual([]);
  expect(text).not.toMatch(/CP-/);
  expect(text).not.toMatch(/Short credit snapshot/);
  expect(text).not.toMatch(/source_ref|_module_id|_module_ids|source_owner_module/);
  expect(text).toContain("Credit screening");
});

it("Evidence: every one of the 20 register ids is reachable", () => {
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={view.entries}
      target={`${encodeURIComponent(ID)}~${SHA}`}
      mode="synthetic"
    />,
  );
  const headings = screen.getAllByRole("heading").map((item) => item.textContent);
  for (const id of REGISTERS) expect(headings.some((text) => text.startsWith(`${id} `))).toBe(true);
  expect(within(document.body).queryByText(/Short credit snapshot/)).toBeNull();
});

it("Forecast: no forecast model was published", () => {
  render(<Forecast view={view} run={run} />);
  expect(screen.getByText("No forecast model was published for this run.")).toBeInTheDocument();
});

/** The fixture with its 20 register headings at `###`, siblings of the appendix heading (the launcher accepts either level). */
const flatEntry = {
  ...fixture,
  sections: fixture.sections.map((item) =>
    /^TL\d+\.\d+\b/.test(item.heading) ? { ...item, level: 3 } : item,
  ),
};

function modulesPage(records: boolean, table?: string) {
  const ids = { ...flatEntry.output, id: ID, sha256: SHA };
  const flatSnapshot = {
    ...snapshot,
    workspace: {
      ...snapshot.workspace,
      outputs: { [ID]: ids },
      handoffs: { [SHA]: flatEntry.sections },
    },
  } as unknown as Snapshot;
  const flatView = buildReportView(flatSnapshot, "case", run);
  const { container } = render(
    <Modules
      view={flatView}
      run={run}
      snapshot={flatSnapshot}
      module="CP-L10"
      records={records}
      table={table}
    />,
  );
  return withoutKnownIds(container).text;
}

it.each([
  ["closed", false, undefined],
  ["opened", true, undefined],
  ["opened on a register", true, "Topic allocation"],
  ["opened on another", true, "Source and scope gate"],
] as const)(
  "Modules, registers written as ### siblings, records %s: no register or source column",
  (_, records, table) => {
    expect(
      flatEntry.sections.filter((item) => item.level === 3 && /^TL/.test(item.heading)),
    ).toHaveLength(20);
    const text = modulesPage(records, table);
    expect(text).not.toMatch(
      /source_ref|source_owner_module|_module_id|_module_ids|upgrade_module_ids|TL\d\d?\.\d|CP-/,
    );
  },
);

it("Evidence still reaches the 20 register ids when they are ### siblings", () => {
  const sections = flatEntry.sections;
  const flatEntries = view.entries.map((item) => ({ ...item, sections }));
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={flatEntries}
      target={`${encodeURIComponent(ID)}~${SHA}`}
      mode="synthetic"
    />,
  );
  const headings = screen.getAllByRole("heading").map((item) => item.textContent);
  for (const id of REGISTERS) expect(headings.some((text) => text.startsWith(`${id} `))).toBe(true);
});
