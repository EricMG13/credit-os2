import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { ReportEvidence } from "./Evidence";
import { ArtifactDownloads } from "./ArtifactDownloads";
import { ScriptChecks } from "./ScriptChecks";

const emptyEvidence: PublishedRun["evidence"] = {
  sources: [],
  unused: [],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};
function output(sections: OutputEntry["sections"] = []): OutputEntry {
  return {
    selected: true,
    output: {
      id: "case/CP-1.md",
      module: "CP-1",
      label: "CP-1",
      href: "CP-1.md",
      sha256: "a".repeat(64),
    },
    sections,
  };
}
function show(
  target: string,
  entries: OutputEntry[] = [],
  extra: Partial<PublishedRun["evidence"]> = {},
  chips: Snapshot["chips"] = {},
) {
  const run = { folder: "case", evidence: { ...emptyEvidence, ...extra } } as PublishedRun;
  const snapshot = {
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips,
  } as unknown as Snapshot;
  return render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={entries}
      target={target}
      mode="synthetic"
    />,
  );
}
beforeEach(() =>
  vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({ files: [] })))),
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("states singular handoff counts, recorded gaps, performed checks and unlocated Basis", () => {
  const entry = output([
    {
      heading: "Gaps",
      level: 2,
      line: 4,
      blocks: [{ type: "text", line: 5, end: 5, text: "No dated maturity was supplied." }],
    },
  ]);
  show(
    "summary",
    [entry],
    {
      scriptChecks: [
        {
          module: "CP-1",
          attempt: 1,
          response: null,
          scripts: [],
          counts: [],
          outcomes: [
            {
              figure: null,
              register: null,
              row: null,
              status: "not checked",
              reason: null,
              script: null,
              stated: null,
              recomputed: null,
              recomputedLabel: null,
              tolerance: null,
              unit: null,
            },
            {
              figure: null,
              register: null,
              row: null,
              status: "agreed",
              reason: null,
              script: "check.py",
              stated: "1",
              recomputed: 1,
              recomputedLabel: null,
              tolerance: 0,
              unit: null,
            },
          ],
        },
      ],
    },
    {
      "case/CP-1.md:5": [
        {
          label: "Basis not found",
          quote: null,
          excerpt: null,
          file: "filing.txt",
          source: null,
          sha256: null,
          reason: "The Basis was not located.",
          quote_found: false,
        },
      ],
    },
  );
  expect(screen.getByText("1 designated handoff · 0 source files")).toBeVisible();
  expect(screen.getByText("1 recorded gap")).toBeVisible();
  expect(screen.getByText("1 of 2 script checks ran")).toBeVisible();
  expect(screen.getByRole("link", { name: /Script checks.*1 of 2/ })).toBeVisible();
  expect(screen.getByText("1 handoff with an unlocated Basis")).toBeVisible();
});

it("marks every handoff evidence link with an underline and a chevron", () => {
  show("summary", [output()]);
  const link = screen.getByRole("link", { name: "Financial foundation" });
  expect(link).toHaveClass("underline");
  expect(link.querySelector("svg")).not.toBeNull();
});

it("renders recorded gap Markdown and names the destination handoff line", () => {
  show("gaps", [
    output([
      {
        heading: "Gaps",
        level: 2,
        line: 4,
        blocks: [{ type: "text", line: 5, end: 5, text: "Missing **dated** `schedule`." }],
      },
    ]),
  ]);
  const row = screen.getByRole("row", { name: /Gap recorded as text/ });
  expect(row.querySelector("strong")?.textContent).toBe("dated");
  expect(row.querySelector("code")?.textContent).toBe("schedule");
  expect(within(row).getByRole("link", { name: "Open handoff line" })).toHaveAttribute(
    "href",
    `/report/case#evidence/case%2FCP-1.md~${"a".repeat(64)}-5`,
  );
  expect(row.textContent).not.toContain("**");
});

it("explains every absent download group rather than dropping it", () => {
  show("summary", [output()]);
  expect(screen.getByText("No handoff ZIP was delivered for this run.")).toBeVisible();
  expect(screen.getByText("No handoff files were delivered for this run.")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Model and calculation files" })).toBeVisible();
  expect(
    screen.getByText("No model or calculation downloads are listed for this run."),
  ).toBeVisible();
});

it("gives empty Sources and Gaps an icon, a title and an explanation", () => {
  const sources = show("sources");
  const sourceTitle = screen.getByRole("heading", { name: "No source files recorded" });
  expect(sourceTitle.closest("section")?.querySelector("svg")).not.toBeNull();
  expect(screen.getByText("No issuer files listed in this run’s published record.")).toBeVisible();
  sources.unmount();
  show("gaps");
  const gapTitle = screen.getByRole("heading", { name: "No gaps recorded" });
  expect(gapTitle.closest("section")?.querySelector("svg")).not.toBeNull();
  expect(screen.getByText("This run lists no gaps.")).toBeVisible();
});

it("uses the ruled source groups and states missing dates, types and all-module readership", () => {
  const source = {
    name: "filing.txt",
    type: null,
    documentDate: null,
    readBy: ["CP-1", "CP-2"],
    sha256: null,
  };
  const second = {
    ...output(),
    output: { ...output().output, id: "case/CP-2.md", module: "CP-2" },
  };
  show("sources", [output(), second], {
    sources: [source],
    unused: [{ ...source, name: "unused.txt", readBy: [] }],
    unrecorded: [{ ...source, name: "unrecorded.txt", readBy: [] }],
  });
  for (const name of ["Used by a module", "Supplied, not used", "Not recorded as used"])
    expect(screen.getByRole("heading", { name })).toBeVisible();
  expect(screen.getAllByText("Document date n.a.")).toHaveLength(3);
  expect(screen.getAllByText("Document type n.a.")).toHaveLength(3);
  expect(screen.getByText("Read by all 2 modules")).toBeVisible();
});

it("keeps download buttons at content width in a wrapping row", async () => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          files: [
            { label: "HTML Model", href: "/model.html" },
            { label: "Calculation JSON", href: "/calculation.json" },
          ],
        }),
      ),
    ),
  );
  render(<ArtifactDownloads folder="case" />);
  const link = await screen.findByRole("link", { name: "Calculation JSON" });
  expect(link.parentElement).toHaveClass("flex", "flex-wrap", "gap-3");
});

it("explains not-checked outcomes and gives an empty checks selection the designed state", () => {
  render(<ScriptChecks records={[]} />);
  const title = screen.getByRole("heading", { name: "No script checks recorded" });
  expect(title.closest("section")?.querySelector("svg")).not.toBeNull();
  expect(screen.getByText(/A script check compares a recorded figure/)).toBeVisible();
  expect(
    screen.getByText(
      "“Not checked” means no completed script check is recorded for that item; its reason states whether a script was unavailable or was not run.",
    ),
  ).toBeVisible();
});

it("labels table citations by their row and drops unlocated boilerplate only without a source column", () => {
  const entry = output([
    {
      heading: "Findings",
      level: 2,
      line: 4,
      blocks: [
        {
          type: "table",
          line: 5,
          headers: ["Measure", "Amount"],
          rows: [
            { line: 6, cells: ["Liquidity", "20"] },
            { line: 7, cells: ["Debt", "30"] },
          ],
        },
      ],
    },
  ]);
  const unlocated = {
    label: "no page",
    quote: null,
    excerpt: null,
    file: null,
    source: null,
    sha256: null,
    reason: "the row cites no page or register",
  };
  show(
    `case%2FCP-1.md~${"a".repeat(64)}`,
    [entry],
    {},
    {
      "case/CP-1.md:6": [unlocated],
      "case/CP-1.md:7": [
        { ...unlocated, label: "Filing page 2", file: "filing.txt", reason: null },
      ],
    },
  );
  expect(screen.queryByText("the row cites no page or register")).toBeNull();
  const citation = screen.getByText("filing.txt").closest("li");
  expect(citation?.parentElement?.parentElement).toHaveTextContent("Debt");
  for (const node of screen.getAllByText("Filing page 2")) expect(node).toBeVisible();
});

it("separates a handoff's citation details with hairlines rather than nested bordered cards", () => {
  const entry = output([
    {
      heading: "Findings",
      level: 2,
      line: 4,
      blocks: [
        {
          type: "text",
          line: 5,
          end: 5,
          text: "Liquidity covers the year.\nBasis: filing.txt page 2",
        },
      ],
    },
  ]);
  show(
    `case%2FCP-1.md~${"a".repeat(64)}-5`,
    [entry],
    {
      sources: [
        { name: "filing.txt", type: "txt", documentDate: null, readBy: ["CP-1"], sha256: null },
      ],
    },
    {
      "case/CP-1.md:5": [
        {
          label: "Filing page 2",
          quote: null,
          excerpt: null,
          file: "filing.txt",
          source: null,
          sha256: null,
          reason: null,
        },
      ],
    },
  );
  const article = document.querySelector("article");
  expect(article?.querySelector("section.rounded-ds-md.border")).toBeNull();
  expect(article?.querySelector("li.rounded-ds-sm.border")).toBeNull();
  const sourceRecords = screen.getByRole("heading", { name: "Source records" }).closest("section");
  if (!sourceRecords) throw new Error("Missing source records");
  expect(within(sourceRecords).getByText("Document date n.a.")).toBeVisible();
  for (const node of screen.getAllByText("Filing page 2")) expect(node).toBeVisible();
});

it("uses a plain alternate format label instead of a module code on Evidence rows", () => {
  const entry = output([
    {
      heading: "Gaps",
      level: 2,
      line: 4,
      blocks: [{ type: "text", line: 5, end: 5, text: "No dated schedule." }],
    },
  ]);
  entry.selected = false;
  show("gaps", [entry]);
  expect(screen.getByText("Financial foundation · Alternate handoff")).toBeVisible();
  expect(document.body.textContent).not.toContain("CP-1");
});

it("preserves a source recorded for the whole table while labeling row-specific citations", () => {
  const entry = output([
    {
      heading: "Findings",
      level: 2,
      line: 4,
      blocks: [
        {
          type: "table",
          line: 5,
          headers: ["Measure", "Amount"],
          rows: [{ line: 6, cells: ["Liquidity", "20"] }],
        },
      ],
    },
  ]);
  show(
    `case%2FCP-1.md~${"a".repeat(64)}`,
    [entry],
    {},
    {
      "case/CP-1.md:5": [
        {
          label: "Whole-table source",
          quote: null,
          excerpt: null,
          file: "whole-table.txt",
          source: null,
          sha256: null,
          reason: null,
        },
      ],
    },
  );
  expect(screen.getByText("whole-table.txt")).toBeVisible();
});
