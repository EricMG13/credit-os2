import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import type { Trace } from "@/pages/library/slice";
import type { OutputEntry, Snapshot } from "../publishedReport";
import { evidenceToken } from "../publishedReport";
import { PublishedSource, PublishedTraceProvider } from "./PublishedTrace";

afterEach(cleanup);

const entry: OutputEntry = {
  selected: true,
  output: {
    id: "case/CP-2.md",
    module: "CP-2",
    label: "CP-2",
    href: "CP-2.md",
    sha256: "a".repeat(64),
  },
  sections: [
    {
      heading: "Key findings",
      level: 2,
      line: 3,
      blocks: [
        { type: "text", line: 4, end: 4, text: "Cover is thin." },
        { type: "text", line: 5, end: 5, text: "No chip here." },
      ],
    },
  ],
};
const chip = (label: string, excerpt: string | null) => ({
  label,
  quote: null,
  excerpt,
  file: `${label}.pdf`,
  source: null,
  sha256: "c".repeat(64),
  reason: excerpt === null ? "page not in source text" : null,
});
const snapshot = {
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
  chips: {
    "case/CP-2.md:4": [chip("one", "Quote one"), chip("two", null), chip("three", "Quote three")],
  },
} as unknown as Snapshot;

function drawer(line: number) {
  const trace: Trace = {
    title: "Sources for Findings",
    heading: "Findings",
    subtitle: "x",
    statement: "Cover is thin.",
    derivation: { label: "e", value: "", note: null, children: [] },
    excerpt: { quote: "first only", source: "one.pdf" },
    qualification: null,
    evidenceItem: evidenceToken(entry, line),
  };
  render(
    <PublishedTraceProvider snapshot={snapshot} folder="case" entries={[entry]} route="overview">
      <TraceDrawer trace={trace} evidenceHref="#e" isOpen onClose={() => {}} />
    </PublishedTraceProvider>,
  );
}

it("gives a drawer on any report page every citation of its line", () => {
  drawer(4);
  expect(screen.getByText("Quote one")).toBeVisible();
  expect(screen.getByText("Quote three")).toBeVisible();
  expect(screen.getByText("page not in source text")).toBeVisible();
  expect(screen.queryByText("first only")).toBeNull();
});

it("says no passage was recorded, as Evidence does, for a line with no chip", () => {
  drawer(5);
  expect(screen.getByText("No source passage was recorded for this item.")).toBeVisible();
});

it("draws the source control of an address it cannot resolve as the same trace chip, 32 px and 44 px on a phone", () => {
  render(
    <PublishedTraceProvider snapshot={snapshot} folder="case" entries={[entry]} route="overview">
      <PublishedSource href="/report/case#evidence/missing~1" name="cover">
        Open cover in Evidence
      </PublishedSource>
    </PublishedTraceProvider>,
  );
  const link = screen.getByRole("link", { name: "Open cover in Evidence" });
  expect(link).toHaveAttribute("href", "/report/case#evidence/missing~1");
  expect(link).toHaveClass("size-8", "max-[480px]:size-11");
});
