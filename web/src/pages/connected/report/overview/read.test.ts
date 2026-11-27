import { expect, it } from "vitest";
import type { OutputEntry, Section, Table } from "../../publishedReport";
import { bottomLineBlocks, figureShown, readSeries, timeline, type Point } from "./read";

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

const annualCashChart: Section = {
  heading: "Chart data: liquidity",
  level: 3,
  line: 30,
  blocks: [
    {
      type: "table",
      line: 31,
      headers: ["Period", "Cash", "Reporting unit"],
      rows: [
        { line: 32, cells: ["FY2023 / 2023-09-30", "3472", "USD millions"] },
        { line: 33, cells: ["FY2024 / 2024-09-30", "6261", "USD millions"] },
      ],
    },
  ],
};

const periodTable = (line: number, rows: string[][]): Table => ({
  type: "table",
  line,
  headers: ["Period", "Start", "End"],
  rows: rows.map((cells, at) => ({ line: line + at + 1, cells })),
});

const limitations = (...tables: Table[]): Section => ({
  heading: "Limitations",
  level: 3,
  line: 40,
  blocks: tables,
});

const cashSeries = (source: OutputEntry) => {
  const read = readSeries(source, "liquidity", /^Cash$/, "cash");
  if (!("series" in read)) throw new Error(read.reason);
  return read.series;
};

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
    order: { key: [0, 2024, 12, 31, 3, 1], reported: true, dated: false },
    line: 1,
  });
  expect(figureShown(point("(12.3)%", "-12.3"), "%")).toBe("(12.3)%");
  expect(figureShown(point(" (12.3)% ", "-12.3"), "%")).toBe("(12.3)%");
  expect(figureShown(point("(1.50)", "-1.50"), "x")).toBe("(1.50x)");
});

it("compares annual rows using the unique canonical period table under Limitations", () => {
  const source = entry([
    annualCashChart,
    limitations(
      periodTable(53, [
        ["FY2022", "2021-10-01", "2022-09-30"],
        ["FY2023", "2022-10-01", "2023-09-30"],
        ["FY2024", "2023-10-01", "2024-09-30"],
      ]),
    ),
  ]);
  const result = timeline(cashSeries(source), source);
  expect(result?.latest.period).toBe("FY2024 / 2024-09-30");
  expect(result?.prior?.period).toBe("FY2023 / 2023-09-30");
  expect(result?.why).toBeUndefined();
});

it("does not use another section or ambiguous tables as the period lookup", () => {
  const table = periodTable(53, [
    ["FY2023", "2022-10-01", "2023-09-30"],
    ["FY2024", "2023-10-01", "2024-09-30"],
  ]);
  const outsideLimitations = entry([
    annualCashChart,
    { ...limitations(table), heading: "Sources" },
  ]);
  expect(timeline(cashSeries(outsideLimitations), outsideLimitations)?.prior).toBeUndefined();

  const duplicate = entry([
    annualCashChart,
    limitations(
      table,
      periodTable(
        60,
        table.rows.map((row) => row.cells),
      ),
    ),
  ]);
  expect(timeline(cashSeries(duplicate), duplicate)?.prior).toBeUndefined();

  const duplicateYear = entry([
    annualCashChart,
    limitations(
      periodTable(70, [
        ["FY2023", "2022-10-01", "2023-09-30"],
        ["FY2024", "2023-10-01", "2024-09-30"],
        ["FY2024", "2023-10-01", "2024-09-30"],
      ]),
    ),
  ]);
  expect(timeline(cashSeries(duplicateYear), duplicateYear)?.prior).toBeUndefined();
});

it("does not match a fiscal year by name when its end date conflicts with the chart", () => {
  const source = entry([
    annualCashChart,
    limitations(
      periodTable(53, [
        ["FY2023", "2021-10-01", "2022-09-30"],
        ["FY2024", "2022-10-01", "2023-09-30"],
      ]),
    ),
  ]);
  const result = timeline(cashSeries(source), source);
  expect(result?.prior).toBeUndefined();
  expect(result?.why).toBe(
    "No change is drawn: the period table does not state when FY2024 / 2024-09-30 starts and ends.",
  );
});
