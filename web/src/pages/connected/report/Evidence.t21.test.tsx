import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { Trace } from "@/pages/library/slice";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import {
  FORECAST_INPUTS,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import { ReportEvidence } from "./Evidence";

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

function renderEvidence(
  entries: OutputEntry[],
  target: string,
  evidence: PublishedRun["evidence"] = emptyEvidence,
  chips: Snapshot["chips"] = {},
) {
  const run = { folder: "case", evidence } as unknown as PublishedRun;
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

function entryWith(module: string, sections: OutputEntry["sections"]): OutputEntry {
  return {
    output: { id: "out", sha256: "a".repeat(64), module, label: "Handoff", href: "out.md" },
    selected: true,
    sections,
  };
}

afterEach(cleanup);

const fileHash = "e".repeat(64);

// C5-011 (OQ-04): supplied source files are listed only, never offered to open or download.
it("lists supplied source files with no link to open them", () => {
  const href = `/connected/sources/case/${fileHash}/portfolio.xlsx`;
  renderEvidence([], "sources", {
    ...emptyEvidence,
    sources: [
      {
        name: "portfolio.xlsx",
        type: "xlsx",
        documentDate: null,
        readBy: [],
        sha256: fileHash,
        href,
      },
    ],
  });
  expect(screen.getByText("portfolio.xlsx")).toBeVisible();
  expect(screen.getByText(fileHash).tagName).toBe("CODE");
  expect(document.querySelector('a[href*="/connected/sources/"]')).toBeNull();
});

it("keeps a citation's cited pages as text with no link to the source file", () => {
  // The run folder is the first segment of the handoff id ("out").
  const href = `/connected/sources/out/${fileHash}/filing.txt`;
  const entry = entryWith("CP-1", [
    {
      heading: "Gaps",
      level: 2,
      line: 4,
      blocks: [{ type: "text", line: 5, end: 5, text: "A confirmation was not supplied." }],
    },
  ]);
  renderEvidence([entry], `out~${"a".repeat(64)}`, emptyEvidence, {
    "out:5": [
      {
        label: "Filing citation",
        quote: null,
        excerpt: null,
        file: "filing.txt",
        source: null,
        sha256: fileHash,
        reason: null,
        href,
        pageHref: `${href}?page=2&end=3`,
      },
    ],
  });
  const li = screen.getByText("Filing citation").closest("li");
  if (!li) throw new Error("citation missing");
  expect(within(li).queryAllByRole("link")).toEqual([]);
  expect(within(li).getByText("Cited pages 2–3")).toBeVisible();
  expect(document.querySelector('a[href*="/connected/sources/"]')).toBeNull();
});

it("draws no source file link in the trace drawer", () => {
  const trace: Trace = {
    title: "Sources for Findings",
    heading: "Findings",
    subtitle: "Liquidity · Handoff line 5",
    statement: "Cover is thin.",
    derivation: { label: "Evidence", value: "", note: null, children: [] },
    excerpt: null,
    qualification: null,
    evidenceItem: "out-5",
    sourceLinks: [{ label: "Open source file: filing.txt", href: "/connected/sources/x/y/f.txt" }],
  };
  render(<TraceDrawer trace={trace} evidenceHref="#evidence" isOpen onClose={() => {}} />);
  expect(screen.queryByText("Open source file: filing.txt")).toBeNull();
  expect(document.querySelector('a[href*="/connected/sources/"]')).toBeNull();
});

// C5-009 (with J3-013): the handoff view does not look like rendered Markdown.
it("draws a handoff's list lines without Markdown markers and hashes in mono", () => {
  const entry = entryWith("CP-6", [
    {
      heading: "Sources",
      level: 2,
      line: 7,
      blocks: [
        { type: "text", line: 8, end: 8, text: `- northbridge-filing.txt ${fileHash}` },
        { type: "text", line: 9, end: 9, text: `- CP-0 ${"f".repeat(64)}` },
      ],
    },
    {
      heading: "Limitations",
      level: 3,
      line: 30,
      blocks: [{ type: "text", line: 31, end: 31, text: "- Synthetic data only, so no weight." }],
    },
  ]);
  const { container } = renderEvidence([entry], `out~${"a".repeat(64)}`);
  const texts = [...container.querySelectorAll("article p, article pre, article li")].map(
    (node) => node.textContent,
  );
  expect(texts.filter((text) => /^\s*- /.test(text))).toEqual([]);
  expect(screen.getByText("northbridge-filing.txt")).toBeVisible();
  expect(screen.getByText(fileHash).tagName).toBe("CODE");
  expect(screen.getByText("f".repeat(64)).tagName).toBe("CODE");
  expect(screen.getByText("CP-0")).toBeVisible();
  expect(screen.getByText("Synthetic data only, so no weight.")).toBeVisible();
});

it("draws recorded forecast inputs without the Markdown code fence, values exact", () => {
  const json =
    '{"schema_version": "cpos-forecast-inputs/1", "base": {"revenue": {"amount": "1000.0"}}}';
  const entry = entryWith("CP-2G", [
    {
      heading: FORECAST_INPUTS,
      level: 2,
      line: 92,
      blocks: [{ type: "text", line: 93, end: 95, text: "```json\n" + json + "\n```" }],
    },
  ]);
  const { container } = renderEvidence([entry], `out~${"a".repeat(64)}-93`);
  const pre = within(screen.getByRole("region", { name: /handoff$/ })).getByText(json, {
    selector: "pre",
  });
  expect(pre.textContent).toBe(json);
  expect(container.textContent).not.toContain("```");
});

// C5-010: the Gaps ledger is grouped by stated severity, High first, with a count per group.
it("groups gaps by severity, High then Medium then Low then unstated, with counts", () => {
  const entry = entryWith("CP-2D", [
    {
      heading: "Gaps",
      level: 2,
      line: 900,
      blocks: [
        {
          type: "table",
          line: 900,
          headers: ["Gap", "Severity", "Detail"],
          rows: [
            { line: 902, cells: ["Low one", "Low", "a"] },
            { line: 903, cells: ["High one", "High", "b"] },
            { line: 904, cells: ["Unranked one", "", "x"] },
            { line: 905, cells: ["Medium one", "Medium", "c"] },
            { line: 906, cells: ["Low two", "Low", "d"] },
            { line: 907, cells: ["High two", "High", "e"] },
          ],
        },
      ],
    },
  ]);
  renderEvidence([entry], "gaps");
  const table = screen.getByRole("table");
  const order = [...table.querySelectorAll('th[scope="row"]')].map((cell) => cell.textContent);
  expect(order).toEqual([
    "High one",
    "High two",
    "Medium one",
    "Low one",
    "Low two",
    "Unranked one",
  ]);
  const groups = [...table.querySelectorAll('th[scope="rowgroup"]')].map(
    (cell) => cell.textContent,
  );
  expect(groups).toEqual(["High2", "Medium1", "Low2", "No severity stated1"]);
});

// J3-007 (with C5-036): Trace with nothing chosen says how to choose something to trace.
it("tells the reader how to choose something to trace when nothing is chosen", () => {
  renderEvidence([entryWith("CP-1", [])], "trace");
  expect(
    screen.getByText(
      "Open a handoff below, or select the source icon beside a finding, row or figure and choose Open in Evidence.",
    ),
  ).toBeVisible();
});

it("keeps module-written text that only resembles a list marker exactly as written", () => {
  const entry = entryWith("CP-1", [
    {
      heading: "Findings",
      level: 3,
      line: 10,
      blocks: [
        { type: "text", line: 11, end: 11, text: "-5% decline in revenue." },
        { type: "text", line: 12, end: 12, text: "* Pro forma for the disposal." },
      ],
    },
  ]);
  renderEvidence([entry], `out~${"a".repeat(64)}`);
  expect(screen.getByText("-5% decline in revenue.")).toBeVisible();
  expect(screen.getByText("* Pro forma for the disposal.")).toBeVisible();
});
