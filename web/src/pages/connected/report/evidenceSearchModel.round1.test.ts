import { expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import { searchEvidence } from "./evidenceSearchModel";

const entry = (module: string, sections: OutputEntry["sections"]): OutputEntry => ({
  selected: true,
  output: {
    id: `case/${module}.md`,
    module,
    label: module,
    href: `${module}.md`,
    sha256: "a".repeat(64),
  },
  sections,
});
const run = (pathway: string) =>
  ({
    folder: "case",
    pathway,
    evidence: { sources: [], unused: [], unrecorded: [] },
  }) as unknown as PublishedRun;

it("never searches a section the handoff wrote for another module", () => {
  const cp1 = entry("CP-1", [
    { heading: "Bottom line", level: 2, line: 1, blocks: [] },
    {
      heading: "Next module",
      level: 2,
      line: 3,
      blocks: [
        { type: "text", line: 4, end: 4, text: "Hand to Liquidity: covenant headroom unresolved" },
      ],
    },
    {
      heading: "Request",
      level: 2,
      line: 6,
      blocks: [{ type: "text", line: 7, end: 7, text: "covenant request text" }],
    },
  ]);
  const found = searchEvidence("covenant", [cp1], run("full_credit_assessment"));
  expect(found.lines).toEqual([]);
});

it("still searches the CP-2G forecast inputs, the one hidden section Evidence draws", () => {
  const cp2g = entry("CP-2G", [
    {
      heading: "Forecast inputs (machine-readable)",
      level: 2,
      line: 3,
      blocks: [{ type: "text", line: 4, end: 4, text: "covenant step-down assumption" }],
    },
  ]);
  const found = searchEvidence("covenant", [cp2g], run("full_credit_assessment"));
  expect(found.lines.map(({ key }) => key)).toEqual(["case/CP-2G.md:4"]);
});

it("names a gap hit's module for the run's pathway", () => {
  const cpl10 = entry("CP-L10", [
    {
      heading: "Gaps",
      level: 2,
      line: 3,
      blocks: [
        {
          type: "table",
          line: 4,
          headers: ["Gap", "Severity"],
          rows: [{ line: 5, cells: ["No facility schedule", "High"] }],
        },
      ],
    },
  ]);
  const found = searchEvidence("facility", [cpl10], run("credit_screening"));
  expect(found.gaps.map(({ detail }) => detail)).toEqual(["Credit screening · High"]);
});
