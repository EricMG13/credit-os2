import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, Snapshot } from "../publishedReport";
import { evidenceHref, evidenceToken } from "../publishedReport";
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
      blocks: [{ type: "text", line: 4, end: 4, text: "Cover is thin." }],
    },
    {
      heading: "Next module",
      level: 2,
      line: 7,
      blocks: [{ type: "text", line: 8, end: 8, text: "Hand this to the next module." }],
    },
  ],
};
const snapshot = {
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
  chips: {},
} as unknown as Snapshot;

const source = (line: number) => (
  <PublishedTraceProvider snapshot={snapshot} folder="case" entries={[entry]} route="overview">
    <PublishedSource href={evidenceHref("case", evidenceToken(entry, line))} name="the line">
      Open line
    </PublishedSource>
  </PublishedTraceProvider>
);

it("opens no drawer for a line inside a section the report does not draw", () => {
  render(source(8));
  expect(screen.queryByRole("button", { name: "Show sources for the line" })).toBeNull();
  expect(screen.getByRole("link", { name: "Open line" })).toBeVisible();
});

it("still opens a drawer for a line in a drawn section", () => {
  render(source(4));
  expect(screen.getByRole("button", { name: "Show sources for the line" })).toBeVisible();
});
