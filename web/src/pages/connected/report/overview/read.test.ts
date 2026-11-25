import { expect, it } from "vitest";
import type { OutputEntry, Section } from "../../publishedReport";
import { bottomLineBlocks, figureShown, type Point } from "./read";

const findings = (blocks: Section["blocks"]): Section[] => [
  { heading: "Findings", level: 2, line: 1, blocks: [] },
  { heading: "Bottom line", level: 3, line: 2, blocks },
];

const entry = (sections: Section[], summary?: { bottomLine: string; line: number }) =>
  ({
    output: { id: "CP-6-1", module: "CP-6", label: "CP-6", href: "CP-6.md", sha256: "c", summary },
    sections,
    selected: true,
  }) as unknown as OutputEntry;

it("gives the bottom line's paragraphs and tables in the order written", () => {
  const blocks = bottomLineBlocks(
    entry(
      findings([
        { type: "text", line: 3, end: 3, text: "Credit is stable." },
        {
          type: "table",
          line: 5,
          headers: ["Measure", "FY2024"],
          rows: [{ line: 7, cells: ["Gross leverage", "6.53x"] }],
        },
        { type: "text", line: 9, end: 9, text: "Liquidity is ample." },
      ]),
    ),
  );
  expect(blocks).toEqual([
    { line: 3, text: "Credit is stable." },
    {
      line: 5,
      table: {
        headers: ["Measure", "FY2024"],
        rows: [{ line: 7, cells: ["Gross leverage", "6.53x"] }],
      },
      held: [],
    },
    { line: 9, text: "Liquidity is ample." },
  ]);
});

it("falls back to the earlier format's summary when the passage has no blocks", () => {
  expect(
    bottomLineBlocks(entry([], { bottomLine: "Credit is stable.\nBasis: notes", line: 12 })),
  ).toEqual([{ line: 12, text: "Credit is stable." }]);
  expect(bottomLineBlocks(entry([]))).toEqual([]);
});

it("draws an accounting negative as written when the module put the unit outside the brackets", () => {
  const point = (cell: string, figure: string): Point => ({
    period: "FY2024",
    cell,
    figure,
    accounting: true,
    value: Number(figure),
    basis: null,
    order: "1-2024",
    line: 1,
  });
  expect(figureShown(point("(12.3)%", "-12.3"), "%")).toBe("(12.3)%");
  expect(figureShown(point(" (12.3)% ", "-12.3"), "%")).toBe("(12.3)%");
  expect(figureShown(point("(1.50)", "-1.50"), "x")).toBe("(1.50x)");
});
