import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { ReportEvidence } from "./Evidence";
import { citationsByFile } from "./EvidenceSources";
import { entryLine } from "./overview/traceLine";

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
const sha = "a".repeat(64);
const cp1: OutputEntry = {
  selected: true,
  output: { id: "out", sha256: sha, module: "CP-1", label: "Handoff", href: "out.md" },
  sections: [
    { heading: "Bottom line", level: 2, line: 1, blocks: [] },
    {
      heading: "Next module",
      level: 2,
      line: 3,
      blocks: [{ type: "text", line: 4, end: 4, text: "Hand to Liquidity: covenant open" }],
    },
  ],
};
const cp2g: OutputEntry = {
  ...cp1,
  output: { ...cp1.output, module: "CP-2G" },
  sections: [
    {
      heading: "Forecast inputs (machine-readable)",
      level: 2,
      line: 3,
      blocks: [{ type: "text", line: 4, end: 4, text: "revenue growth 4.0%" }],
    },
  ],
};
const hiddenChip = {
  label: "p. 2",
  quote: null,
  excerpt: null,
  file: "Issuer.txt",
  source: null,
  sha256: "d".repeat(64),
  reason: "Quote not found on the cited page",
  quote_found: false,
  href: "x",
  pageHref: "x",
};
const snap = (chips: Snapshot["chips"] = {}) =>
  ({
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips,
  }) as unknown as Snapshot;
const draw = (entry: OutputEntry, target: string | undefined, snapshot = snap()) =>
  render(
    <ReportEvidence
      snapshot={snapshot}
      run={
        { folder: "case", pathway: "full_credit_assessment", evidence } as unknown as PublishedRun
      }
      entries={[entry]}
      target={target}
      mode="synthetic"
    />,
  );

it("C7-R1 focus lands on the trace heading when the line is in a hidden section", async () => {
  draw(cp1, `out~${sha}-4`);
  expect(
    screen.getByText("This location is unavailable in the published handoff."),
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(document.activeElement?.id).toBe("evidence-trace");
  });
});

it("C7-R2 a chip on a hidden paragraph is not counted as an unlocated Basis", () => {
  draw(cp1, undefined, snap({ "out:4": [hiddenChip] }));
  expect(screen.getByText("handoffs with an unlocated Basis")).toBeInTheDocument();
});

it("C7-R2 citationsByFile skips a citation on a hidden line", () => {
  const cited = citationsByFile(snap({ "out:4": [hiddenChip] }), [cp1], new Set(["Issuer.txt"]));
  expect(cited.byFile.size).toBe(0);
  expect(cited.unmatched.size).toBe(0);
  expect(cited.fileless).toEqual([]);
});

it("C7-R2 entryLine never returns a block of a hidden section", () => {
  const hiddenOnly: OutputEntry = {
    ...cp1,
    sections: [
      { heading: "Bottom line", level: 2, line: 1, blocks: [] },
      cp1.sections[1] as OutputEntry["sections"][number],
    ],
  };
  expect(entryLine(hiddenOnly)).toBeUndefined();
  expect(entryLine(hiddenOnly, "Next module")).toBeUndefined();
});

it("C7-R3/R8 a CP-2G forecast-inputs heading line is drawn, with its inputs, through the trace", () => {
  draw(cp2g, `out~${sha}-3`);
  expect(screen.queryByText("This location is unavailable in the published handoff.")).toBeNull();
  expect(screen.getByText(/revenue growth 4.0%/)).toBeInTheDocument();
});

it("C7-R8 a CP-2G forecast-inputs block line goes through TraceSplit", () => {
  draw(cp2g, `out~${sha}-4`);
  expect(screen.getByText("The claim")).toBeInTheDocument();
  expect(screen.getByText(/revenue growth 4.0%/)).toBeInTheDocument();
});
