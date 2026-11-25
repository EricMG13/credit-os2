import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { ReportEvidence } from "./Evidence";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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
        { type: "text", line: 4, end: 4, text: "Leverage rose to 5.1x.\nBasis: annual.pdf p.84" },
        { type: "text", line: 5, end: 5, text: "Cover is thin." },
      ],
    },
    {
      heading: "Gaps",
      level: 2,
      line: 10,
      blocks: [
        {
          type: "table",
          line: 11,
          headers: ["Gap", "Severity"],
          rows: [{ line: 12, cells: ["Leverage covenant not supplied", "High"] }],
        },
      ],
    },
  ],
};
const run = {
  folder: "case",
  evidence: {
    sources: [
      { name: "annual.pdf", type: "pdf", documentDate: null, readBy: ["CP-2"], sha256: "c0ffee" },
    ],
    unused: [],
    unrecorded: [],
    noSourcesModules: [],
    handoffs: [],
    zip: null,
    downloads: [],
    record: { hashes: [], instructions: [], calls: [], cap: null },
  },
} as unknown as PublishedRun;
const snapshot = {
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
  chips: {},
} as unknown as Snapshot;

function show(target = "summary") {
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={[entry]}
      target={target}
      mode="synthetic"
    />,
  );
  return screen.getByRole("searchbox", { name: "Search evidence" });
}
const type = (box: HTMLElement, value: string) => fireEvent.change(box, { target: { value } });

it("leads the page with the field, above the tabs, and shows the summary while it is empty", () => {
  const box = show();
  const tabs = screen.getByRole("navigation", { name: "Evidence sections" });
  expect(box.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Run evidence" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: /^Handoff lines/ })).toBeNull();
});

it("lists matches grouped by kind with counts, each opening its trace address or row", () => {
  type(show(), "leverage");
  const lines = within(screen.getByRole("region", { name: "Handoff lines" }));
  const gaps = within(screen.getByRole("region", { name: "Gaps" }));
  expect(screen.getByRole("heading", { name: "Handoff lines (2)" })).toBeVisible();
  expect(lines.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
    `/report/case#evidence/case%2FCP-2.md~${sha}-4`,
    `/report/case#evidence/case%2FCP-2.md~${sha}-12`,
  ]);
  expect(screen.getByRole("heading", { name: "Gaps (1)" })).toBeVisible();
  expect(gaps.getByRole("link", { name: "Leverage covenant not supplied" })).toHaveAttribute(
    "href",
    `/report/case#evidence/case%2FCP-2.md~${sha}-12`,
  );
  expect(screen.queryByRole("heading", { name: /^Sources/ })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Run evidence" })).toBeNull();
});

it("finds a source by hash prefix and opens the Sources tab", () => {
  type(show(), "C0FFEE");
  expect(screen.getByRole("heading", { name: "Sources (1)" })).toBeVisible();
  expect(screen.getByRole("link", { name: "annual.pdf" })).toHaveAttribute(
    "href",
    "#evidence/sources",
  );
});

it("announces the result counts in a status region and says what is not searched", () => {
  type(show(), "leverage");
  expect(screen.getByRole("status")).toHaveTextContent(
    "3 matches: 2 handoff lines, 0 sources, 1 gap",
  );
  expect(
    screen.getByText(
      /Not searched: script check outcomes, the run record, citation labels and cited passages, and the text of the source files\./,
    ),
  ).toBeVisible();
});

it("says so when nothing matches, and restores the summary when the field is cleared", () => {
  const box = show();
  type(box, "zzz");
  expect(screen.getByRole("status")).toHaveTextContent("No match for “zzz”");
  type(box, "");
  expect(screen.getByRole("heading", { name: "Run evidence" })).toBeVisible();
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("caps a long list, says so, and keeps document order", () => {
  const many: OutputEntry = {
    ...entry,
    sections: [
      {
        heading: "Findings",
        level: 2,
        line: 1,
        blocks: Array.from({ length: 60 }, (_, i) => ({
          type: "text" as const,
          line: 100 + i,
          end: 100 + i,
          text: `Item ${String(i)} mentions leverage`,
        })),
      },
    ],
  };
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={[many]}
      target="summary"
      mode="synthetic"
    />,
  );
  type(screen.getByRole("searchbox", { name: "Search evidence" }), "leverage");
  expect(screen.getByRole("heading", { name: "Handoff lines (60)" })).toBeVisible();
  const links = within(screen.getByRole("region", { name: "Handoff lines" })).getAllByRole("link");
  expect(links).toHaveLength(50);
  expect(screen.getByText("Showing the first 50 of 60, in document order.")).toBeVisible();
});

it("echoes at most 80 characters of a long query", () => {
  const box = show();
  type(box, "z".repeat(5000));
  const text = screen.getByRole("status").textContent;
  expect(text.length).toBeLessThan(120);
  expect(text).toContain("…");
});

it("drops the query and shows the address when the address changes, as after a click on a result", () => {
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  const props = { snapshot, run, entries: [entry], mode: "synthetic" as const };
  const view = render(<ReportEvidence {...props} target="gaps" />);
  type(screen.getByRole("searchbox", { name: "Search evidence" }), "leverage");
  expect(screen.getByRole("heading", { name: "Handoff lines (2)" })).toBeVisible();
  view.rerender(<ReportEvidence {...props} target={`case%2FCP-2.md~${sha}-4`} />);
  expect(screen.getByRole("searchbox", { name: "Search evidence" })).toHaveValue("");
  expect(screen.queryByRole("heading", { name: /^Handoff lines/ })).toBeNull();
  expect(screen.getByRole("region", { name: "Fundamental credit handoff" })).toBeVisible();
  type(screen.getByRole("searchbox", { name: "Search evidence" }), "annual");
  view.rerender(<ReportEvidence {...props} target="sources" />);
  expect(screen.getByRole("searchbox", { name: "Search evidence" })).toHaveValue("");
  expect(screen.getByRole("heading", { name: /^Used by a module/ })).toBeVisible();
});
