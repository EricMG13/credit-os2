import { expect, it } from "vitest";
import {
  analyzeScenarioPeriods,
  historyNotes,
  isForecastPeriod,
  periodsInOrder,
  scenarioComparisonNotice,
  unplacedNote,
} from "../visuals/scenarioPeriods";
import { caseYears, cellsOf, endOf, fiscalYear, forecastMeasure } from "./forecastData";

// Owner's ruling, 2026-11-25: every actual, year to date, last twelve months and pro forma column
// is shown before the forecast years, in the one period order; a forecast period is whatever the
// period rule reads as one. Every expected value below is written by hand from the grid.
const value = (exact: string, display = `${exact}x`) => ({ status: "value", exact, display });
const missing = (reason: string) => ({ status: "unavailable", display: "n.a.", reason });
const NET = "Net leverage (net debt / Adj EBITDA)";

type Column = { label: string; group: string };
const model = (columns: Column[], cells: unknown[]) => ({
  cashflow: {
    units: "USD millions",
    columns,
    rows: [{ label: NET, band: "Leverage", kind: "multiple", total: false, cells }],
  },
});

const MIXED: Column[] = [
  { label: "FY2024", group: "Fiscal year" },
  { label: "LTM Jun 2025", group: "Last twelve months" },
  { label: "FY2022", group: "Fiscal year" },
  { label: "PF LTM Jun 2025", group: "Pro forma" },
  { label: "Quarter", group: "Quarter" },
  { label: "FY2023", group: "Fiscal year" },
  { label: "YTD Jun 2025", group: "Year to date" },
  { label: "FY2026E", group: "Base case" },
  { label: "FY2025E", group: "Base case" },
];
const MIXED_CELLS = [
  value("5.5"),
  value("5.2"),
  missing("EBITDA is not positive"),
  value("4.9"),
  value("6.6"),
  value("6.1"),
  value("5.4"),
  value("4.1"),
  value("4.6"),
];

it("reads a forecast period by the period rule, not by one spelling", () => {
  for (const label of ["FY2025E", "FY2025F", "26E", "2026E", "Budget 2026", "PF FY2025E"])
    expect([label, isForecastPeriod(label)]).toEqual([label, true]);
  for (const label of ["FY2025", "LTM", "PF LTM Jun 2025", "YTD Jun 2025", "Downside", "Quarter"])
    expect([label, isForecastPeriod(label)]).toEqual([label, false]);
});

it("orders periods by the rule, an unreadable label last", () => {
  expect(periodsInOrder(["FY2030E", "Downside", "FY28E", "LTM", "FY2029E", "FY2024"])).toEqual([
    "FY2024",
    "LTM",
    "FY28E",
    "FY2029E",
    "FY2030E",
    "Downside",
  ]);
});

it("keeps the comparison periods and its notice in period order", () => {
  const periods = ["FY2030E", "FY28E", "FY2029E"];
  const result = analyzeScenarioPeriods(
    ["Base case", "Downside case"].flatMap((group) => periods.map((period) => ({ period, group }))),
  );
  expect(result.periods.map(({ period }) => period)).toEqual(["FY28E", "FY2029E", "FY2030E"]);
  expect(
    scenarioComparisonNotice({
      ambiguousPeriods: ["FY2030E", "FY28E", "FY2029E"],
      incompatiblePeriods: [],
      noSharedPeriod: false,
    }),
  ).toBe(
    "Periods left out of the scenario comparison: FY28E, FY2029E, FY2030E (published more than once by a case).",
  );
});

it("gives every reported and pro forma column with a figure, in period order, before the forecast", () => {
  const measure = forecastMeasure(model(MIXED, MIXED_CELLS), /^Net leverage\b/);
  expect(measure?.history.map(({ period, display, value: v }) => [period, display, v])).toEqual([
    ["FY2023", "6.1x", 6.1],
    ["FY2024", "5.5x", 5.5],
    ["YTD Jun 2025", "5.4x", 5.4],
    ["LTM Jun 2025", "5.2x", 5.2],
    ["PF LTM Jun 2025", "4.9x", 4.9],
  ]);
  expect(measure?.periods).toEqual(["FY2025E", "FY2026E"]);
  expect(measure?.cases[0]?.cells.get("FY2025E")?.display).toBe("4.6x");
  expect(measure?.cases[0]?.cells.has("LTM Jun 2025")).toBe(false);
  if (!measure) throw new Error("no measure");
  // A figure under a label the rule cannot place is drawn last, as authored, and the gap stated.
  expect(measure.unplaced.map(({ period, display, value: v }) => [period, display, v])).toEqual([
    ["Quarter", "6.6x", 6.6],
  ]);
  expect(unplacedNote(measure.unplaced)).toEqual([
    "Not placed in time order, shown last: Quarter.",
  ]);
  expect(historyNotes(measure.historyGaps)).toEqual([
    "Before the forecast, FY2022: EBITDA is not positive.",
  ]);
});

it("keeps figures the rule cannot place in the order written, and names one with no figure or published twice", () => {
  const measure = forecastMeasure(
    model(
      [
        { label: "Run rate", group: "Run rate" },
        { label: "FY2025E", group: "Base case" },
        { label: "Stub period", group: "Other" },
        { label: "FY2024", group: "Fiscal year" },
        { label: "Opening", group: "Other" },
        { label: "Covenant basis", group: "Other" },
        { label: "Closing", group: "Other" },
        { label: "Covenant basis", group: "Restated" },
        { label: "Interim", group: "Other" },
      ],
      [
        value("6.6"),
        value("4.6"),
        missing("EBITDA is not positive"),
        value("5.5"),
        value("6.9"),
        value("5.1"),
        value("6.2"),
        value("5.3"),
        { status: "unavailable", display: "n.a." },
      ],
    ),
    /^Net leverage\b/,
  );
  if (!measure) throw new Error("no measure");
  expect(measure.history.map(({ period }) => period)).toEqual(["FY2024"]);
  expect(measure.unplaced.map(({ period, display }) => [period, display])).toEqual([
    ["Run rate", "6.6x"],
    ["Opening", "6.9x"],
    ["Closing", "6.2x"],
  ]);
  expect(unplacedNote(measure.unplaced)).toEqual([
    "Not placed in time order, shown last: Run rate, Opening, Closing.",
  ]);
  expect(historyNotes(measure.historyGaps)).toEqual([
    "Not placed in time order, Stub period: EBITDA is not positive.",
    "Not placed in time order, no figure for Interim.",
    "Published more than once, so not drawn: Covenant basis.",
  ]);
  expect(unplacedNote([])).toEqual([]);
});

it("names a period before the forecast that is published twice, and draws neither", () => {
  const measure = forecastMeasure(
    model(
      [
        { label: "FY2024", group: "Fiscal year" },
        { label: "LTM", group: "Last twelve months" },
        { label: "LTM", group: "Prior basis" },
        { label: "FY2025E", group: "Base case" },
      ],
      [value("5.5"), value("5.2"), value("5.0"), value("4.6")],
    ),
    /^Net leverage\b/,
  );
  expect(measure?.history.map(({ period }) => period)).toEqual(["FY2024"]);
  if (!measure) throw new Error("no measure");
  expect(historyNotes(measure.historyGaps)).toEqual([
    "Published more than once before the forecast, so not drawn: LTM.",
  ]);
});

it("has no history for a grid with forecast columns only, and no forecast for one with none", () => {
  const forecastOnly = forecastMeasure(
    model([{ label: "FY2025E", group: "Base case" }], [value("4.6")]),
    /^Net leverage\b/,
  );
  expect(forecastOnly?.history).toEqual([]);
  expect(forecastOnly?.unplaced).toEqual([]);
  expect(forecastOnly?.historyGaps).toEqual({ blank: [], repeated: [] });
  const historyOnly = forecastMeasure(
    model([{ label: "FY2024", group: "Fiscal year" }], [value("5.5")]),
    /^Net leverage\b/,
  );
  expect(historyOnly?.cases).toEqual([]);
  expect(historyOnly?.history.map(({ period }) => period)).toEqual(["FY2024"]);
});

it("reads forecast periods the rule recognises and orders a case's cells by it", () => {
  const measure = forecastMeasure(
    model(
      [
        { label: "FY2030E", group: "Base case" },
        { label: "FY28E", group: "Base case" },
        { label: "2029F", group: "Base case" },
      ],
      [value("3"), value("1"), value("2")],
    ),
    /^Net leverage\b/,
  );
  if (!measure) throw new Error("no measure");
  expect(measure.periods).toEqual(["FY28E", "2029F", "FY2030E"]);
  expect(cellsOf(measure, "Base case").map(({ period, value: v }) => [period, v])).toEqual([
    ["FY28E", 1],
    ["2029F", 2],
    ["FY2030E", 3],
  ]);
  expect(endOf(cellsOf(measure, "Base case"))?.period).toBe("FY2030E");
  const years = caseYears(
    model(
      [
        { label: "FY2030E", group: "Base case" },
        { label: "FY28E", group: "Base case" },
      ],
      [value("3"), value("1")],
    ),
    "Base case",
  );
  expect([years.first?.label, years.last?.label]).toEqual(["FY28E", "FY2030E"]);
});

it("reads a fiscal year from the labels the rule reads as a whole year, actual or forecast", () => {
  expect(fiscalYear("FY2024")).toBe(2024);
  expect(fiscalYear("FY2027E")).toBe(2027);
  expect(fiscalYear("2029F")).toBe(2029);
  expect(fiscalYear("FY28E")).toBe(2028);
  expect(fiscalYear("2026")).toBe(2026);
  expect(fiscalYear("LTM")).toBeNull();
  expect(fiscalYear("LTM Jun 2025")).toBeNull();
  expect(fiscalYear("PF FY2024")).toBeNull();
  expect(fiscalYear("Q1 2025")).toBeNull();
  expect(fiscalYear("H1 2026E")).toBeNull();
});
