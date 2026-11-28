// Expected values are written by hand from the retained TransDigm FY2024 CP-1 handoff
// (tests/fixtures/live_2026_11_15/earnings_update-CP-1-draft3-accepted.md) and from the inputs
// built here; none is computed by the code under test.
import { describe, expect, it } from "vitest";
import type { Table } from "../../../publishedReport";
import { cp1Entry } from "../fixtures/load";
import {
  comparisonOf,
  isReported,
  latestReportedItem,
  normalLabel,
  orderByPeriod,
  periodColumns,
  periodOf,
  periodRows,
  rowLabelled,
  rowStarting,
  statementColumns,
  tableName,
  tableUnder,
  tableWith,
  unionPeriods,
  unplacedNotes,
} from "./tables";

const entry = cp1Entry();

const rows = (...labels: string[]): Table => ({
  type: "table",
  line: 1,
  headers: ["Period", "Value"],
  rows: labels.map((label, at) => ({ line: 2 + at, cells: [label, String(at)] })),
});
const columns = (...headers: string[]): Table => ({
  type: "table",
  line: 1,
  headers: ["Line item", ...headers, "Unit", "Basis", "Source"],
  rows: [],
});
const labelsOf = (read: ReturnType<typeof periodRows>) =>
  "reason" in read ? read.reason : read.periods.map(({ period }) => period.label);
/** The periods the one period order could not place, or the stated gap's reason. */
const unplacedOf = (read: ReturnType<typeof periodRows>) =>
  "reason" in read ? read.reason : read.unplaced;
/** The periods of a read that has no stated gap. */
const periodsOf = (read: ReturnType<typeof periodRows>) => {
  if ("reason" in read) throw new Error(read.reason);
  return read.periods.map(({ period }) => period);
};

describe("table lookup in the retained CP-1 handoff", () => {
  it("finds a table by its section heading, and by its headers when the heading is not stated", () => {
    expect(tableUnder(entry, "Net debt data")?.headers[0]).toBe("Period");
    expect(tableWith(entry, ["Facility", "Ranking", "Secured"])?.rows).toHaveLength(6);
  });
  it("returns null for an absent heading or for headers more than one table carries", () => {
    expect(tableUnder(entry, "Chart data: nothing")).toBeNull();
    expect(tableWith(entry, ["Reporting unit"])).toBeNull();
  });
  it("reads the two period columns of a statement for the earnings delta, in either order", () => {
    const income = tableUnder(entry, "T4.4 Income statement");
    if (!income) throw new Error("fixture lost T4.4");
    expect(periodColumns(income)?.current.label).toBe("FY2024");
    expect(periodColumns(income)?.prior.label).toBe("FY2023");
    expect(rowLabelled(income, "Nonexistent")).toBeNull();
  });
});

describe("periodOf", () => {
  it("reads the label as written, its year, its form and its kind", () => {
    expect(periodOf("FY2024 / 2024-09-30")).toEqual({
      label: "FY2024",
      year: 2024,
      form: "FY",
      kind: "annual",
      cell: "FY2024 / 2024-09-30",
    });
    expect(periodOf("2024")).toMatchObject({ label: "2024", form: "", kind: "annual" });
    expect(periodOf("CY2023")).toMatchObject({ form: "CY", kind: "annual" });
    expect(periodOf("LTM Dec-2024")).toEqual({
      label: "LTM Dec-2024",
      year: 2024,
      form: "LTMDEC",
      kind: "other",
    });
    expect(periodOf("Q3 2025")).toMatchObject({ year: 2025, form: "Q3", kind: "other" });
    expect(periodOf("2025-06-30")).toMatchObject({ year: 2025, kind: "other" });
  });
  it("names no period for a label with no year", () => {
    expect(periodOf("Thereafter")).toBeNull();
    expect(periodOf("Current")).toBeNull();
    expect(periodOf("")).toBeNull();
  });
});

describe("period rows: every stated period, ordered by year, never by position", () => {
  it("keeps a single period: one is a valid shape", () => {
    expect(labelsOf(periodRows(rows("FY2024 / 2024-09-30")))).toEqual(["FY2024"]);
  });
  it("orders two or three periods by year whatever the handoff's row order", () => {
    expect(labelsOf(periodRows(rows("FY2024 / 2024-09-30", "FY2023 / 2023-09-30")))).toEqual([
      "FY2023",
      "FY2024",
    ]);
    expect(labelsOf(periodRows(rows("FY2024", "FY2022", "FY2023")))).toEqual([
      "FY2022",
      "FY2023",
      "FY2024",
    ]);
  });
  // Rewritten to the ruling of 2026-11-25: an LTM period sits after every fiscal year (it was kept
  // between them, in the handoff's order).
  it("lists an LTM period after the annual ones as its own kind, never collapsed", () => {
    const read = periodRows(rows("FY2023", "LTM Dec-2024", "FY2024"));
    expect(labelsOf(read)).toEqual(["FY2023", "FY2024", "LTM Dec-2024"]);
    if ("reason" in read) throw new Error("unreadable");
    expect(read.periods.map(({ period }) => period.kind)).toEqual(["annual", "annual", "other"]);
  });
  it("orders interim dates of one year by the date", () => {
    expect(labelsOf(periodRows(rows("2025-06-30", "2025-03-31", "FY2024 / 2024-09-30")))).toEqual([
      "FY2024",
      "2025-03-31",
      "2025-06-30",
    ]);
  });
  // Rewritten to the ruling: an undated label is drawn last and named, no longer a refusal.
  it("makes a repeated period or an empty table a stated gap; an undated label is drawn last", () => {
    expect(labelsOf(periodRows(rows("FY2024", "FY2024 / 2024-09-30")))).toBe(
      "FY2024 appears more than once",
    );
    expect(labelsOf(periodRows(rows("Current", "FY2024", "Current")))).toBe(
      "Current appears more than once",
    );
    const undated = periodRows(rows("Current", "FY2024"));
    expect(labelsOf(undated)).toEqual(["FY2024", "Current"]);
    expect(unplacedOf(undated)).toEqual(["Current"]);
    expect(labelsOf(periodRows(rows()))).toBe("it has no rows");
  });
  it("does not call two different kinds in one year a repeat", () => {
    expect(labelsOf(periodRows(rows("FY2024", "LTM Dec-2024")))).toEqual([
      "FY2024",
      "LTM Dec-2024",
    ]);
  });
});

describe("time order inside a year (review L8)", () => {
  it("puts Q1 before Q2 when the handoff lists Q2 first", () => {
    expect(labelsOf(periodRows(rows("FY2023", "FY2024", "Q2 2025", "Q1 2025")))).toEqual([
      "FY2023",
      "FY2024",
      "Q1 2025",
      "Q2 2025",
    ]);
    expect(labelsOf(periodRows(rows("Q4 2024", "Q3 2024", "Q2 2024", "Q1 2024")))).toEqual([
      "Q1 2024",
      "Q2 2024",
      "Q3 2024",
      "Q4 2024",
    ]);
    expect(labelsOf(periodRows(rows("H2 2024", "H1 2024")))).toEqual(["H1 2024", "H2 2024"]);
  });
  it("orders LTM ends of one year by the end month", () => {
    expect(labelsOf(periodRows(rows("LTM Sep-2024", "LTM Mar-2024", "LTM Jun-2024")))).toEqual([
      "LTM Mar-2024",
      "LTM Jun-2024",
      "LTM Sep-2024",
    ]);
  });
  it("reads two-digit years: FY24 and FY23, Q1 25 and Q1-25", () => {
    expect(labelsOf(periodRows(rows("FY24", "FY23")))).toEqual(["FY23", "FY24"]);
    expect(periodOf("FY24")).toEqual({ label: "FY24", year: 2024, form: "FY", kind: "annual" });
    expect(periodOf("Q1 25")).toEqual({
      label: "Q1 25",
      year: 2025,
      form: "Q1",
      kind: "other",
    });
    expect(periodOf("Q1-25")).toMatchObject({ year: 2025, form: "Q1" });
    expect(periodOf("1Q25")).toMatchObject({ year: 2025, form: "Q1" });
    expect(periodOf("LTM Mar-25")).toMatchObject({ year: 2025, form: "LTMMAR" });
    expect(periodOf("FY99")).toMatchObject({ year: 1999 });
    expect(periodOf("H2 2024")).toMatchObject({ form: "H2", year: 2024 });
    // A two-digit number is a year only in a label that names a period by its words.
    expect(periodOf("Top 10")).toBeNull();
    expect(periodOf("Last 12 months")).toBeNull();
  });
  it("keeps an LTM period after the annual ones and still compares FY", () => {
    const read = periodRows(rows("FY2023", "FY2024", "LTM Dec-2024"));
    expect(labelsOf(read)).toEqual(["FY2023", "FY2024", "LTM Dec-2024"]);
    expect(comparisonOf(periodsOf(read))).toEqual({ from: "FY2023", to: "FY2024" });
    expect(
      labelsOf(periodRows(rows("LTM Dec-2024", "FY2024 / 2024-09-30", "FY2023 / 2023-09-30"))),
    ).toEqual(["FY2023", "FY2024", "LTM Dec-2024"]);
  });
  // Rewritten to the ruling (was "cannot order a set with an undated label or a year whose order
  // is unknown": such a set was refused whole and drawn in the handoff's order).
  it("draws a label it cannot place last, named; a year to date beside a quarter is placed", () => {
    for (const [labels, drawn, unplaced] of [
      [["Current", "FY2024"], ["FY2024", "Current"], ["Current"]],
      [["Thereafter", "FY2025"], ["FY2025", "Thereafter"], ["Thereafter"]],
      [["YTD 2025", "Q1 2025"], ["Q1 2025", "YTD 2025"], []],
      [
        ["Top 10", "Current"],
        ["Top 10", "Current"],
        ["Top 10", "Current"],
      ],
    ] as const) {
      const read = periodRows(rows(...labels));
      expect(labelsOf(read), labels.join()).toEqual(drawn);
      expect(unplacedOf(read), labels.join()).toEqual(unplaced);
    }
    expect(labelsOf(periodRows(rows("YTD 2025", "FY2024")))).toEqual(["FY2024", "YTD 2025"]);
  });
});

describe("the one period order (ruling of 2026-11-25)", () => {
  const SCRAMBLED = [
    "FY2026E",
    "PF FY2024",
    "LTM Jun-2025",
    "FY2024 / 2024-09-30",
    "YTD 2025",
    "FY2025E",
    "FY2023 / 2023-09-30",
  ];
  const RULE = ["FY2023", "FY2024", "YTD 2025", "LTM Jun-2025", "PF FY2024", "FY2025E", "FY2026E"];
  it("puts LTM and PF after the fiscal years and before the forecast years, oldest first", () => {
    const read = periodRows(rows(...SCRAMBLED));
    expect(labelsOf(read)).toEqual(RULE);
    expect(unplacedOf(read)).toEqual([]);
    // Each row moves whole: the value cell written beside FY2023 (row 6) stays with it.
    if ("reason" in read) throw new Error(read.reason);
    expect(read.periods.map(({ item }) => item.cells[1])).toEqual([
      "6",
      "3",
      "4",
      "2",
      "1",
      "5",
      "0",
    ]);
  });
  it("orders statement columns and a union of lists the same way", () => {
    const read = statementColumns(columns("FY2025E", "LTM Jun-2025", "FY2024", "PF FY2024"));
    expect("reason" in read ? read.reason : read.periods.map(({ period }) => period.label)).toEqual(
      ["FY2024", "LTM Jun-2025", "PF FY2024", "FY2025E"],
    );
    const union = unionPeriods([
      periodsOf(periodRows(rows("FY2025E", "FY2024"))),
      periodsOf(periodRows(rows("PF FY2024", "Run rate", "FY2024", "LTM Jun-2025"))),
    ]);
    expect(union.periods.map((period) => period.label)).toEqual([
      "FY2024",
      "LTM Jun-2025",
      "PF FY2024",
      "FY2025E",
      "Run rate",
    ]);
    expect(union.unplaced).toEqual(["Run rate"]);
  });
  it("a period that states its date goes by that date", () => {
    expect(
      labelsOf(periodRows(rows("2024-12-31", "FY2024 / 2024-09-30", "FY2023 / 2023-09-30"))),
    ).toEqual(["FY2023", "FY2024", "2024-12-31"]);
  });
  it("the latest reported period is never a pro forma or a forecast", () => {
    expect(latestReportedItem(RULE, (label) => label)).toBe("LTM Jun-2025");
    expect(latestReportedItem(["FY2023", "FY2024", "FY2024 pro forma"], (label) => label)).toBe(
      "FY2024",
    );
    expect(latestReportedItem(["PF FY2024", "FY2025E"], (label) => label)).toBeUndefined();
    expect(latestReportedItem(["FY2024", "Current"], (label) => label)).toBe("FY2024");
    expect(
      ["FY2024", "YTD 2025", "LTM", "PF FY2024", "FY2025E", "Current"].map(isReported),
    ).toEqual([true, true, true, false, false, false]);
  });
  it("chooses no latest reported period where dated and fiscal-labelled actuals are mixed", () => {
    expect(latestReportedItem(["FY2025", "2025-06-30"], (label) => label)).toBeUndefined();
    expect(
      latestReportedItem(["FY2023", "FY2024 / 2024-09-30", "LTM Jun 2025"], (label) => label),
    ).toBeUndefined();
    expect(
      latestReportedItem(["Q4 2024", "2025-03-31", "Current"], (label) => label),
    ).toBeUndefined();
    // One form only, or a date outside the actual class: the latest is chosen as before.
    expect(latestReportedItem(["2024-12-31", "2025-06-30"], (label) => label)).toBe("2025-06-30");
    expect(latestReportedItem(["FY2024", "LTM 2025-06-30"], (label) => label)).toBe(
      "LTM 2025-06-30",
    );
    expect(latestReportedItem(["FY2024", "Q1 2025", "PF 2025-06-30"], (label) => label)).toBe(
      "Q1 2025",
    );
  });
  it("names the periods it could not place, in the reader's words", () => {
    expect(unplacedNotes([], 3)).toEqual([]);
    expect(unplacedNotes(["Current", "Thereafter"], 4)).toEqual([
      "Not placed in time order, shown last: Current, Thereafter.",
    ]);
    expect(unplacedNotes(["Current"], 1)).toEqual([
      "Shown in the order written: the periods could not be placed in time order.",
    ]);
  });
});

describe("statement columns", () => {
  it("reads one, two or three period columns in year order", () => {
    const labels = (table: Table) => {
      const read = statementColumns(table);
      return "reason" in read
        ? read.reason
        : read.periods.map(({ period, item }) => [period.label, item]);
    };
    expect(labels(columns("FY2024"))).toEqual([["FY2024", 1]]);
    expect(labels(columns("FY2024", "FY2023"))).toEqual([
      ["FY2023", 2],
      ["FY2024", 1],
    ]);
    expect(labels(columns("FY2024", "FY2023", "FY2022"))).toEqual([
      ["FY2022", 3],
      ["FY2023", 2],
      ["FY2024", 1],
    ]);
    expect(labels(columns())).toBe("it has no column named for a period");
    expect(labels(columns("FY2024", "FY2024"))).toBe("FY2024 appears more than once");
  });
});

describe("unionPeriods and comparisonOf", () => {
  const p = (label: string) => {
    const period = periodOf(label);
    if (!period) throw new Error(label);
    return period;
  };
  it("lists each period once, by year", () => {
    expect(
      unionPeriods([[p("FY2024")], [p("FY2023"), p("FY2024")]]).periods.map((x) => x.label),
    ).toEqual(["FY2023", "FY2024"]);
  });
  it("compares the latest two annual periods, beside an LTM period", () => {
    expect(comparisonOf([p("FY2023"), p("FY2024"), p("LTM Dec-2024")])).toEqual({
      from: "FY2023",
      to: "FY2024",
    });
    expect(comparisonOf([p("FY2022"), p("FY2023"), p("FY2024")])).toEqual({
      from: "FY2023",
      to: "FY2024",
    });
  });
  it("compares only periods exactly one year apart", () => {
    expect(comparisonOf([p("FY2022"), p("FY2024")])).toBeNull();
    expect(comparisonOf([p("FY23"), p("FY24")])).toEqual({ from: "FY23", to: "FY24" });
    expect(comparisonOf([p("Q1 2024"), p("Q2 2025"), p("Q1 2025")])).toBeNull();
  });
  it("compares reported periods only: never to or from a pro forma or a forecast", () => {
    expect(comparisonOf([p("Q1 2026E"), p("Q1 2025"), p("Q1 2024")])).toEqual({
      from: "Q1 2024",
      to: "Q1 2025",
    });
    expect(comparisonOf([p("FY2023"), p("FY2024"), p("FY2024 pro forma"), p("FY2025E")])).toEqual({
      from: "FY2023",
      to: "FY2024",
    });
    expect(comparisonOf([p("PF FY2023"), p("PF FY2024")])).toBeNull();
    expect(comparisonOf([p("FY2025E"), p("FY2026E")])).toBeNull();
  });
  it("draws no comparison with one period or with two of different kinds", () => {
    expect(comparisonOf([p("FY2024")])).toBeNull();
    expect(comparisonOf([])).toBeNull();
    expect(comparisonOf([p("FY2024"), p("LTM Dec-2024")])).toBeNull();
    expect(comparisonOf([p("Q3 2024"), p("Q3 2025")])).toEqual({ from: "Q3 2024", to: "Q3 2025" });
  });
});

describe("rowStarting: the contract's label forms, one match required", () => {
  const statement: Table = {
    type: "table",
    line: 1,
    headers: ["Line item", "FY2024"],
    rows: [
      "Cash taxes paid, net of refunds",
      "Cash taxes paidout",
      "Free cash flow, levered after working capital",
      "Unlevered free cash flow",
      "Dividends and dividend equivalent payments",
      "Dividends received",
    ].map((label, at) => ({ line: 2 + at, cells: [label, "1"] })),
  };
  it("matches a label that begins with the words, case and punctuation aside", () => {
    expect(normalLabel("Cash taxes paid, net of refunds")).toBe("cash taxes paid net of refunds");
    const taxes = rowStarting(statement, ["Cash Taxes Paid"]);
    expect(typeof taxes === "string" ? taxes : taxes.cells[0]).toBe(
      "Cash taxes paid, net of refunds",
    );
    const fcf = rowStarting(statement, ["Levered free cash flow", "Free cash flow levered"]);
    expect(typeof fcf === "string" ? fcf : fcf.cells[0]).toBe(
      "Free cash flow, levered after working capital",
    );
  });
  it("refuses no match and several matches", () => {
    expect(rowStarting(statement, ["Capital expenditures"])).toBe("none");
    expect(rowStarting(statement, ["Dividends"])).toBe("several");
  });
});

describe("tableName", () => {
  it("drops the register id and the chart prefix", () => {
    expect(tableName("T4.5 Cash flow statement")).toBe("Cash flow statement");
    expect(tableName("Chart data: revenue and EBITDA")).toBe("Revenue and EBITDA");
    expect(tableName("Net debt data")).toBe("Net debt data");
  });
});

describe("orderByPeriod keeps the item with its period", () => {
  it("carries any item", () => {
    const read = orderByPeriod([
      { cell: "FY2024", item: "b" },
      { cell: "FY2023", item: "a" },
    ]);
    expect("reason" in read ? read.reason : read.periods.map(({ item }) => item)).toEqual([
      "a",
      "b",
    ]);
  });
});
