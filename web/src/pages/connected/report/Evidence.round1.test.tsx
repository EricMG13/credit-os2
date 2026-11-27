import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { ReportEvidence } from "./Evidence";

afterEach(cleanup);

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
const entry: OutputEntry = {
  selected: true,
  output: { id: "out", sha256: "a".repeat(64), module: "CP-1", label: "Handoff", href: "out.md" },
  sections: [
    { heading: "Bottom line", level: 2, line: 1, blocks: [] },
    {
      heading: "Next module",
      level: 2,
      line: 3,
      blocks: [
        { type: "text", line: 4, end: 4, text: "Hand to Liquidity: covenant headroom unresolved" },
      ],
    },
  ],
};
const snapshot = {
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
  chips: {},
} as unknown as Snapshot;
const draw = (target: string | undefined, pathway = "full_credit_assessment", module = "CP-1") =>
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={{ folder: "case", pathway, evidence } as unknown as PublishedRun}
      entries={[{ ...entry, output: { ...entry.output, module } }]}
      target={target}
      mode="synthetic"
    />,
  );

it("refuses a line inside a section written for another module", () => {
  draw(`out~${"a".repeat(64)}-4`);
  expect(
    screen.getByText("This location is unavailable in the published handoff."),
  ).toBeInTheDocument();
  expect(screen.queryByText(/covenant headroom unresolved/)).toBeNull();
  expect(screen.queryByText("The claim")).toBeNull();
});

it("names the handoff index entry for the run's pathway", () => {
  draw(undefined, "credit_screening", "CP-L10");
  expect(screen.getByRole("link", { name: "Credit screening" })).toBeInTheDocument();
  expect(screen.queryByText("Short credit snapshot")).toBeNull();
});
