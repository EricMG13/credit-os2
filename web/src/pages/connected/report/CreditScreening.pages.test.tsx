// A credit screening run, built from the published form of the Task 1 fixture
// (tests/fixtures/credit-screening/CP-L10.md): Modules, Evidence and Forecast pages.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { PublishedRun, Snapshot } from "../publishedReport";
import type { ReportView } from "../reportView";
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
const entry = { ...fixture, output: { ...fixture.output, id: "out", sha256: "a".repeat(64) } };
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
const run = { folder: "case", pathway: "credit_screening", evidence } as unknown as PublishedRun;
const view = {
  entries: [entry],
  modules: [{ id: "CP-L10", name: "Credit screening", state: "Delivered", outputs: [entry] }],
  catalogue: undefined,
  lead: entry,
  models: [],
} as unknown as ReportView;
const snapshot = {
  chips: {},
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
} as unknown as Snapshot;

it("Modules: the five reader tables, no module code, no source or register column", () => {
  const { container } = render(
    <Modules view={view} run={run} snapshot={snapshot} module="CP-L10" />,
  );
  expect(screen.getByRole("heading", { name: "Credit screening" })).toBeInTheDocument();
  for (const title of SCREENS)
    expect(screen.getByRole("table", { name: title, hidden: true })).toBeInTheDocument();
  // The navigator prints a module's code beside its name for every module of every run (library/
  // parts/ModuleNav.tsx, not this PR's); nothing else on the page may.
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("span.font-mono").forEach((code) => {
    code.remove();
  });
  const text = clone.textContent;
  expect(text).not.toMatch(/CP-/);
  expect(text).not.toMatch(/Short credit snapshot/);
  expect(text).not.toMatch(/source_ref|_module_id|_module_ids|source_owner_module/);
  expect(text).not.toMatch(/TL\d\d?\.\d/);
});

it("Evidence: every one of the 20 register ids is reachable", () => {
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={[entry]}
      target={`${entry.output.id}~${entry.output.sha256}`}
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
