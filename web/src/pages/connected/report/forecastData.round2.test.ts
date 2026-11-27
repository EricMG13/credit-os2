import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { drawnCellText, drawnGapText, fundingGap } from "./forecastData";

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
const gapOf = (cell: string, label = "Funding gap") =>
  fundingGap({
    catalogue: undefined,
    lead: undefined,
    entries: [handoff(["Line", "Value"], [[label, cell]])],
    modules: [],
    models: [],
  }).gaps[0];

it("R1: a value-null cell that cites a source is a reason, never an amount sentence", () => {
  expect(drawnGapText("Not supplied: see credit_agreement.pdf p.4")).toBe(
    "Reason recorded in model evidence.",
  );
  expect(drawnGapText("Not supplied")).toBe("Not supplied");
  expect(drawnGapText("   ")).toBe("");
  expect(drawnCellText("see credit_agreement.pdf p.4")).toBe("Amount recorded in model evidence.");
});

it("R2: a cited figure with its own unit is drawn as written, without the citation", () => {
  const gap = gapOf("USD 120m (credit_agreement.pdf p. 4)");
  expect(gap?.figures).toEqual([{ header: "Value", text: "USD 120m", value: null }]);
  expect(gap?.unitInFigure).toBe(true);
});

it("R3: undotted markers are removed, period tags and labels are kept", () => {
  const figure = (cell: string) => gapOf(cell)?.figures[0];
  expect(figure("250 (E3; E4)")).toEqual({ header: "Value", text: "250", value: 250 });
  expect(figure("120 [E3]")).toEqual({ header: "Value", text: "120", value: 120 });
  expect(figure("120 (C05)")).toEqual({ header: "Value", text: "120", value: 120 });
  expect(figure("120 (T4.18; T4.19)")).toEqual({ header: "Value", text: "120", value: 120 });
  expect(figure("6 months (Q3)")?.text).toBe("6 months (Q3)");
  expect(figure("10 (P50)")?.text).toBe("10 (P50)");
  expect(gapOf("5", "Funding gap (H2)")?.label).toBe("Funding gap (H2)");
  expect(gapOf("250 (E3)")?.unitInFigure).toBe(false);
});

it("R4: a qualification inside a citation bracket is kept, only the citation goes", () => {
  const text = "120 (excludes the undrawn RCF; credit_agreement.pdf)";
  expect(gapOf(text)?.figures[0]?.text).toBe("120 (excludes the undrawn RCF)");
  expect(drawnCellText(text)).toBe("120 (excludes the undrawn RCF)");
  expect(drawnCellText("120 (excludes the RCF per credit_agreement.pdf)")).toBe(
    "Amount recorded in model evidence.",
  );
  expect(drawnCellText("120 (credit_agreement.pdf p. 4)")).toBe("120");
});
