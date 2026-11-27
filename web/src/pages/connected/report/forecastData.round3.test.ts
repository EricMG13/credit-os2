import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { drawnGapText, fundingGap, gapContext, NOT_STATED_IN_ROW } from "./forecastData";

const handoff = (headers: string[], rows: string[][]) =>
  ({
    selected: true,
    output: {
      id: "CP-2D",
      sha256: "c".repeat(64),
      module: "CP-2D",
      label: "",
      href: "",
      state: { established: true, declared: null },
    },
    sections: [
      {
        heading: "T2E.5 Funding gap",
        level: 3,
        line: 40,
        blocks: [
          {
            type: "table",
            line: 42,
            headers,
            rows: rows.map((cells, at) => ({ line: 44 + at, cells })),
          },
        ],
      },
    ],
  }) as unknown as OutputEntry;
const gapOf = (cell: string) =>
  fundingGap({
    catalogue: undefined,
    lead: undefined,
    entries: [handoff(["Line", "Value"], [["Funding gap", cell]])],
    modules: [],
    models: [],
  }).gaps[0];
const EVIDENCE_REASON = "Reason recorded in model evidence.";

it("S1: a gap cell that cites by marker, note or cue draws no citation", () => {
  expect(drawnGapText("Not supplied; E12")).toBe(EVIDENCE_REASON);
  expect(drawnGapText("Not supplied, see Note 4")).toBe(EVIDENCE_REASON);
  expect(drawnGapText("6.0x (E3 and note 4)")).toBe(EVIDENCE_REASON);
  expect(drawnGapText("120 (cf. note 3)")).toBe(EVIDENCE_REASON);
  expect(drawnGapText("Not supplied")).toBe("Not supplied");
  const long = `Not modelled: ${"the forecast stops before the refinancing date and ".repeat(4)}see Note 4`;
  expect(drawnGapText(long)).toBe(EVIDENCE_REASON);
  const plainLong = `Not modelled: ${"the forecast stops before the refinancing date and ".repeat(4)}ends.`;
  expect(drawnGapText(plainLong)).toBe(plainLong);
});

it("S1: a funding-gap figure that cites by note or marker is not drawn as written", () => {
  for (const cell of ["120 (cf. note 3)", "6.0x (E3 and note 4)"])
    expect(gapOf(cell)?.figures).toEqual([
      { header: "Value", text: NOT_STATED_IN_ROW, value: null },
    ]);
});

it("S3: a unit written in the figure's bracket is the figure's unit", () => {
  const gap = gapOf("120 (USD millions)");
  expect(gap?.figures).toEqual([{ header: "Value", text: "120 (USD millions)", value: null }]);
  expect(gap?.unitInFigure).toBe(true);
  expect(gap && gapContext(gap)).not.toContain("unit not stated");
});
