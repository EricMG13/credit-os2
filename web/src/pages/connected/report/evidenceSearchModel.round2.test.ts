import { expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import { drawnSections, lineIsHidden } from "./evidenceDrawn";
import { searchEvidence } from "./evidenceSearchModel";

const cp2g: OutputEntry = {
  selected: true,
  output: {
    id: "case/CP-2G.md",
    module: "CP-2G",
    label: "CP-2G",
    href: "x",
    sha256: "a".repeat(64),
  },
  sections: [
    {
      heading: "Forecast inputs (machine-readable)",
      level: 2,
      line: 3,
      blocks: [{ type: "text", line: 4, end: 4, text: "revenue growth 4.0%" }],
    },
  ],
};
const run = {
  folder: "case",
  pathway: "full_credit_assessment",
  evidence: { sources: [], unused: [], unrecorded: [] },
} as unknown as PublishedRun;

it("a search hit on the forecast-inputs heading lands on a line the one predicate draws", () => {
  const found = searchEvidence("forecast inputs", [cp2g], run);
  expect(found.lines.map(({ key }) => key)).toEqual(["case/CP-2G.md:3"]);
  expect(lineIsHidden(cp2g, 3)).toBe(false);
  expect(drawnSections(cp2g).map(({ line }) => line)).toEqual([3]);
});
