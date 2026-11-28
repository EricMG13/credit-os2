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
const sha = "b".repeat(64);
const cp2g: OutputEntry = {
  selected: true,
  output: { id: "out", sha256: sha, module: "CP-2G", label: "Handoff", href: "out.md" },
  sections: [
    {
      heading: "Forecast inputs (machine-readable)",
      level: 2,
      line: 3,
      blocks: [{ type: "text", line: 4, end: 4, text: "revenue growth 4.0%" }],
    },
  ],
};
const draw = (target: string | undefined) =>
  render(
    <ReportEvidence
      snapshot={
        {
          workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
          chips: {},
        } as unknown as Snapshot
      }
      run={
        { folder: "case", pathway: "full_credit_assessment", evidence } as unknown as PublishedRun
      }
      entries={[cp2g]}
      target={target}
      mode="synthetic"
    />,
  );

it("C7-S1 the whole CP-2G handoff does not draw the forecast inputs", () => {
  draw(`out~${sha}`);
  expect(screen.queryByText("Forecast inputs (machine-readable)")).toBeNull();
  expect(screen.queryByText(/revenue growth 4.0%/)).toBeNull();
});

it("C7-S1 a targeted heading line still draws the forecast inputs", () => {
  draw(`out~${sha}-3`);
  expect(screen.getByText("Forecast inputs (machine-readable)")).toBeInTheDocument();
  expect(screen.getByText(/revenue growth 4.0%/)).toBeInTheDocument();
});
