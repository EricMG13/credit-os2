import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { evidencePath } from "../publishedReport";
import { ReportEvidence } from "./Evidence";
import type { ForecastModel } from "./ForecastRecord";

const sha = "a".repeat(64);
const entry: OutputEntry = {
  selected: true,
  output: { id: "case/CP-2.md", module: "CP-2", label: "CP-2", href: "CP-2.md", sha256: sha },
  sections: [
    {
      heading: "Key findings",
      level: 2,
      line: 3,
      blocks: [
        { type: "text", line: 4, end: 4, text: "Leverage rose to 5.1x.\nBasis: FY2024 reported" },
      ],
    },
    {
      heading: "Gaps",
      level: 2,
      line: 8,
      blocks: [
        {
          type: "table",
          line: 9,
          headers: ["Gap", "Severity"],
          rows: [
            { line: 10, cells: ["No facility schedule", "High"] },
            { line: 11, cells: ["No peer data", "Low"] },
          ],
        },
      ],
    },
  ],
};
const evidence: PublishedRun["evidence"] = {
  sources: [],
  unused: [
    { name: "spare.txt", type: "txt", documentDate: null, readBy: [], sha256: "f".repeat(64) },
  ],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};
const run = { folder: "case", evidence } as unknown as PublishedRun;
const snapshot = {
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
  chips: {
    "case/CP-2.md:4": [
      {
        label: "annual.pdf p. 84",
        quote: null,
        excerpt: "“Net debt to EBITDA was 5.1x.”",
        file: null,
        source: "annual.pdf p. 84",
        sha256: null,
        reason: null,
      },
    ],
  },
} as unknown as Snapshot;

function show(target: string) {
  return render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={[entry]}
      target={target}
      mode="synthetic"
    />,
  );
}
beforeEach(() => vi.stubGlobal("fetch", () => new Promise(() => {})));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("opens the claim and its source passage side by side, first, for an address from a trace control", () => {
  const address = evidencePath("case", entry, 4).split("#evidence/")[1] ?? "";
  show(address);
  const claim = screen.getByRole("region", { name: "The claim" });
  const source = screen.getByRole("region", { name: "The source" });
  expect(within(claim).getByText("Leverage rose to 5.1x.")).toBeVisible();
  expect(within(source).getByText("“Net debt to EBITDA was 5.1x.”")).toBeVisible();
  // The split comes before the handoff's own sections.
  const handoff = screen.getByRole("region", { name: "Fundamental credit handoff" });
  expect(claim.compareDocumentPosition(handoff) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(source.compareDocumentPosition(handoff) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("leads the Summary with three counts and the gap list, most severe first", () => {
  show("summary");
  const counts = within(screen.getByLabelText("Gaps by severity"));
  expect(counts.getByText("High").closest("div")).toHaveTextContent("1");
  expect(counts.getByText("Medium").closest("div")).toHaveTextContent("0");
  expect(counts.getByText("Low").closest("div")).toHaveTextContent("1");
  const rows = [...document.querySelectorAll('th[scope="row"]')].map((cell) => cell.textContent);
  expect(rows.slice(0, 2)).toEqual(["No facility schedule", "No peer data"]);
});

it("keeps every section address on the segmented control", () => {
  show("summary/CP-2");
  const nav = within(screen.getByRole("navigation", { name: "Evidence sections" }));
  for (const [name, href] of [
    ["Summary", "#evidence/summary/CP-2"],
    ["Trace", "#evidence/trace/CP-2"],
    ["Sources", "#evidence/sources/CP-2"],
    ["Gaps", "#evidence/gaps/CP-2"],
    ["Record", "#evidence/record/CP-2"],
  ])
    expect(nav.getByRole("link", { name })).toHaveAttribute("href", href);
  expect(nav.getByRole("link", { name: "Summary" })).toHaveAttribute("aria-current", "page");
  expect(nav.queryByRole("link", { name: /Script checks/ })).toBeNull();
});

it("keeps the supplied-but-unused file in its own group on the Sources tab", () => {
  show("sources");
  const unused = within(screen.getByRole("table", { name: "Supplied, not used" }));
  expect(unused.getByText("spare.txt")).toBeVisible();
  expect(unused.getByText("f".repeat(64))).toBeVisible();
  expect(screen.queryByRole("table", { name: "Used by a module" })).toBeNull();
});

it("closes the run record by default on the Record tab", () => {
  show("record");
  const summary = screen.getByText("Show the run record", { selector: "summary" });
  expect(summary.closest("details")).not.toHaveAttribute("open");
});

const model = {
  id: "m1",
  cashflow: { notes: ["Base case is a conditional illustration."] },
  sources: [],
  register: null,
} as unknown as ForecastModel;

function showRecord(
  target: string,
  extra: Partial<PublishedRun> = {},
  models: ForecastModel[] = [model],
) {
  return render(
    <ReportEvidence
      snapshot={snapshot}
      run={{ ...run, ...extra }}
      entries={[entry]}
      target={target}
      mode="synthetic"
      models={models}
    />,
  );
}

it.each([
  ["record/run", "evidence-record-run"],
  ["record/comparison", "evidence-record-run"],
  ["record/notes", "evidence-record-notes"],
  ["record/files", "evidence-record-files"],
  ["record/CP-2G/notes", "evidence-record-notes"],
])("brings %s into view and focuses it", async (target, id) => {
  const scroll = vi.fn();
  Element.prototype.scrollIntoView = scroll;
  showRecord(target, {}, [{ ...model, id: "CP-2G" }]);
  const element = document.getElementById(id);
  expect(element).not.toBeNull();
  await vi.waitFor(() => {
    expect(scroll).toHaveBeenCalled();
  });
  expect(document.activeElement).toBe(element);
});

it("opens only the block the Record address names, and keeps #evidence/record working", () => {
  const view = showRecord("record");
  expect(document.getElementById("evidence-record-run")).not.toHaveAttribute("open");
  expect(document.getElementById("evidence-record-notes")).not.toHaveAttribute("open");
  view.unmount();
  showRecord("record/notes");
  expect(document.getElementById("evidence-record-notes")).toHaveAttribute("open");
  expect(document.getElementById("evidence-record-run")).not.toHaveAttribute("open");
});

it("treats a module after record as the module filter, not a target", () => {
  showRecord("record/CP-2");
  expect(screen.getByLabelText("Module")).toHaveValue("CP-2");
});

it("opens the run record on arrival when the run has a comparison note", () => {
  showRecord("record", { changes: { note: "changes: not produced" } });
  expect(document.getElementById("evidence-record-run")).toHaveAttribute("open");
});
