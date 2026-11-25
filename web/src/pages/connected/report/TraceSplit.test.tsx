import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { TraceSplit } from "./TraceSplit";

afterEach(cleanup);

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
        {
          type: "text",
          line: 4,
          end: 4,
          text: "Leverage rose to 5.1x.\nBasis: FY2024 reported, USD m.",
        },
      ],
    },
  ],
};
const run = {
  folder: "case",
  evidence: {
    sources: [
      {
        name: "annual.pdf",
        type: "pdf",
        documentDate: null,
        readBy: ["CP-2"],
        sha256: "c".repeat(64),
      },
    ],
    unused: [],
    unrecorded: [],
  },
} as unknown as PublishedRun;
const snapshot = (chips: Snapshot["chips"]) =>
  ({
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips,
  }) as unknown as Snapshot;

function show(chips: Snapshot["chips"] = {}) {
  return render(
    <TraceSplit snapshot={snapshot(chips)} run={run} entry={entry} line={4} index={0} />,
  );
}

it("sets the claim on the left and its source passage on the right", () => {
  show({
    "case/CP-2.md:4": [
      {
        label: "annual.pdf p. 84",
        quote: null,
        excerpt: "“Net debt to EBITDA was 5.1x.”",
        file: "annual.pdf",
        source: "annual.pdf p. 84",
        sha256: "c".repeat(64),
        reason: null,
      },
    ],
  });
  const claim = within(screen.getByRole("region", { name: "The claim" }));
  const source = within(screen.getByRole("region", { name: "The source" }));
  expect(claim.getByText("Leverage rose to 5.1x.")).toBeVisible();
  expect(claim.getByText("FY2024 reported, USD m.")).toBeVisible();
  expect(source.getByText("“Net debt to EBITDA was 5.1x.”")).toBeVisible();
  expect(source.getByText("annual.pdf p. 84")).toBeVisible();
  expect(claim.queryByText("“Net debt to EBITDA was 5.1x.”")).toBeNull();
});

it("draws the gap state on the source side when no passage was recorded", () => {
  show();
  const source = within(screen.getByRole("region", { name: "The source" }));
  expect(source.getByText("No source passage was recorded for this item.")).toBeVisible();
});

it("names the module and the handoff line the claim sits on", () => {
  show();
  expect(screen.getByText("Fundamental credit · Handoff line 4")).toBeVisible();
});

it("draws nothing for a line the handoff does not hold", () => {
  const { container } = render(
    <TraceSplit snapshot={snapshot({})} run={run} entry={entry} line={99} index={0} />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("shows a citation whose page text could not be read, with its file and the chip's own reason", () => {
  show({
    "case/CP-2.md:4": [
      {
        label: "annual.pdf p. 84",
        quote: null,
        excerpt: null,
        file: "annual.pdf",
        source: null,
        sha256: "c".repeat(64),
        reason: "page not in source text",
      },
    ],
  });
  const source = within(screen.getByRole("region", { name: "The source" }));
  expect(source.getByText("annual.pdf p. 84")).toBeVisible();
  expect(source.getByText("annual.pdf")).toBeVisible();
  expect(source.getByText("page not in source text")).toBeVisible();
  expect(source.getByText("c".repeat(64))).toBeVisible();
  expect(source.queryByText("No source passage was recorded for this item.")).toBeNull();
});

it("draws the basis once on the page: in the claim tile and not in the derivation", () => {
  show();
  expect(screen.getAllByText("FY2024 reported, USD m.")).toHaveLength(1);
});

it("names a module in the claim as the drawer does, never by its code", () => {
  const coded: OutputEntry = {
    ...entry,
    sections: [
      {
        heading: "Key findings",
        level: 2,
        line: 3,
        blocks: [{ type: "text", line: 4, end: 4, text: "CP-1 holds the leverage figure." }],
      },
    ],
  };
  const { container } = render(
    <TraceSplit snapshot={snapshot({})} run={run} entry={coded} line={4} index={0} />,
  );
  const claim = within(screen.getByRole("region", { name: "The claim" }));
  expect(claim.getByText("Financial foundation holds the leverage figure.")).toBeVisible();
  expect(container.textContent).not.toMatch(/CP-\d/);
});
