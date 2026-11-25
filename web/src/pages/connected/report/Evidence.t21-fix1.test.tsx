import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { Trace } from "@/pages/library/slice";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { ReportEvidence } from "./Evidence";

afterEach(cleanup);

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

// T21 review 1, issue 3: removing a list marker keeps a nested item's indentation.
it("keeps a nested handoff list's indentation while removing only the marker", () => {
  const entry: OutputEntry = {
    output: { id: "out", sha256: "a".repeat(64), module: "CP-6", label: "Handoff", href: "out.md" },
    selected: true,
    sections: [
      {
        heading: "Limitations",
        level: 2,
        line: 4,
        blocks: [
          {
            type: "text",
            line: 5,
            end: 7,
            text: "- Parent point\n  - Nested point\n    - Deeper point",
          },
        ],
      },
    ],
  };
  const run = { folder: "case", evidence: emptyEvidence } as unknown as PublishedRun;
  const snapshot = {
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips: {},
  } as unknown as Snapshot;
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={[entry]}
      target={`out~${"a".repeat(64)}`}
      mode="synthetic"
    />,
  );
  const texts = [
    ...within(screen.getByRole("region", { name: "Committee decision handoff" })).getAllByText(
      /./,
      { selector: "p" },
    ),
  ].map((node) => node.textContent);
  expect(texts).toContain("Parent point\n  Nested point\n    Deeper point");
});

function traceWith(sourceLinks: Trace["sourceLinks"]): Trace {
  return {
    title: "Sources for Findings",
    heading: "Findings",
    subtitle: "Liquidity · Handoff line 5",
    statement: "Cover is thin.",
    derivation: { label: "Evidence", value: "", note: null, children: [] },
    excerpt: null,
    qualification: null,
    evidenceItem: "out-5",
    sourceLinks,
  };
}

const base = `/connected/sources/out/${"e".repeat(64)}/filing%20(1).txt`;

// T21 review 1, issue 2: the drawer keeps the source name and its cited pages, as text only.
it("shows a cited source's name and pages in the trace drawer as plain text", () => {
  const trace = traceWith([
    { label: "Open cited source pages 2–3: filing (1).txt", href: `${base}?page=2&end=3` },
    { label: "Open source file: filing (1).txt", href: base },
    {
      label: "Open source file: other.txt",
      href: `/connected/sources/out/${"f".repeat(64)}/other.txt`,
    },
  ]);
  render(<TraceDrawer trace={trace} evidenceHref="#evidence" isOpen onClose={() => {}} />);
  expect(screen.getByText("filing (1).txt, cited pages 2–3")).toBeVisible();
  expect(screen.getByText("other.txt")).toBeVisible();
  expect(screen.queryByText("filing (1).txt")).toBeNull();
  expect(screen.getByText(/may differ from the filing’s printed pages/)).toBeVisible();
  expect(document.querySelector('a[href*="/connected/sources/"]')).toBeNull();
  expect(screen.queryByText(/^Open (cited source|source file)/)).toBeNull();
});

it("draws no cited source block in the trace drawer when there is no source", () => {
  render(<TraceDrawer trace={traceWith([])} evidenceHref="#evidence" isOpen onClose={() => {}} />);
  expect(screen.queryByText("Cited sources")).toBeNull();
  expect(screen.queryByText(/printed pages/)).toBeNull();
});

it("keeps every distinct cited range for one file without merging source identities", () => {
  const otherDigest = base.replace("e".repeat(64), "a".repeat(64));
  const trace = traceWith([
    { label: "filing", href: base },
    { label: "pages 2–3", href: `${base}?page=2&end=3` },
    { label: "page 7", href: `${base}?page=7` },
    { label: "repeat pages 2–3", href: `${base}?page=2&end=3` },
    { label: "repeat filing", href: base },
    { label: "same name, different source", href: `${otherDigest}?page=11` },
  ]);
  render(<TraceDrawer trace={trace} evidenceHref="#evidence" isOpen onClose={() => {}} />);
  expect(screen.getByText("filing (1).txt, cited pages 2–3; page 7")).toBeVisible();
  expect(screen.getByText("filing (1).txt, cited page 11")).toBeVisible();
  expect(screen.queryByText("filing (1).txt")).toBeNull();
  expect(document.querySelector('a[href*="/connected/sources/"]')).toBeNull();
});
