// Expected values are written out by hand from the retained TransDigm CP-1 handoffs
// (tests/fixtures/live_2026_11_15/: earnings_update-CP-1-draft3-accepted.md, relative_value-CP-1-draft1.md,
// distressed-CP-1-draft1.md, earnings_update-CP-1-draft1.md), not computed by the code under test.
// The handoffs are outdated evidence (FY2024): shape and scope only. Mutated entries
// (fixtures/mutations.ts) are test inputs, not real handoffs.
import { describe, expect, it } from "vitest";
import type { OutputEntry } from "../../../publishedReport";
import { readCell, type Reading } from "../kit/numbers";
import {
  cp1Entry,
  distressedCp1Entry,
  earningsUpdateCp1Draft1Entry,
  relativeValueCp1Entry,
} from "../fixtures/load";
import {
  addRow,
  dropTable,
  edited,
  ltmCp1,
  mixedPeriodsCp1,
  setCell,
  setLabelled,
  threePeriodCp1,
  withRows,
} from "../fixtures/mutations";
import {
  basisText,
  cellText,
  handoffWords,
  bridgeKind,
  bridgeKinds,
  cashLadder,
  debtStack,
  earningsAgainstDebt,
  ebitdaBridge,
  figureGap,
  interestCover,
  NO_ADJUSTMENT,
  netDebtView,
  segmentView,
  showPeriodsTile,
  statedPeriods,
  type PeriodCell,
} from "./foundationData";

const accepted = cp1Entry();
const relative = relativeValueCp1Entry();
const distressed = distressedCp1Entry();
const draft1 = earningsUpdateCp1Draft1Entry();

/** A reading as a short string: the number text, `gap: <reason>`, `text: <words>`, or null. */
const shown = (cell: Reading | null | undefined) => {
  if (!cell) return null;
  if (cell.kind === "gap") return `gap: ${cell.reason}`;
  return cell.kind === "text" ? `text: ${cell.text}` : cell.text;
};
const cells = (values: readonly PeriodCell[] | undefined) =>
  values?.map((value) => [value.label, shown(value.cell)]);

// ------------------------------------------------------------------------------------------------

describe("statedPeriods: the periods the figures cover", () => {
  it("lists FY2023 and FY2024 for the accepted handoff, annual, compared", () => {
    const periods = statedPeriods(accepted);
    expect(periods.labels).toEqual(["FY2023", "FY2024"]);
    expect(periods.kind).toBe("annual");
    expect(periods.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect(periods.gaps).toEqual([]);
    expect(periods.tables.map((t) => t.table)).toEqual([
      "Revenue and EBITDA",
      "Net debt data",
      "Leverage",
      "Liquidity",
      "Interest cover",
      "Income statement",
      "Cash flow statement",
      "Segment schedule",
    ]);
  });
  it("lists the one period of the relative value handoff and draws no comparison", () => {
    const periods = statedPeriods(relative);
    expect(periods.labels).toEqual(["FY2024"]);
    expect(periods.kind).toBe("annual");
    expect(periods.comparison).toBeNull();
  });
  it("lists all three periods of the three-period mutation, FY2022 first", () => {
    const periods = statedPeriods(threePeriodCp1());
    expect(periods.labels).toEqual(["FY2022", "FY2023", "FY2024"]);
    expect(periods.comparison).toEqual({ from: "FY2023", to: "FY2024" });
  });
  it("lists an LTM period as its own kind beside the annual periods", () => {
    const periods = statedPeriods(ltmCp1());
    expect(periods.labels).toEqual(["FY2023", "FY2024", "LTM Dec-2024"]);
    expect(periods.periods.map((p) => p.kind)).toEqual(["annual", "annual", "other"]);
    expect(periods.kind).toBe("other");
    expect(periods.comparison).toEqual({ from: "FY2023", to: "FY2024" });
  });
  it("states a repeated year as a gap for that table, with the reason", () => {
    const twice = addRow(accepted, "Net debt data", [
      "FY2024 / 2024-09-30",
      "1",
      "1",
      "0",
      "US$m",
      "Mutation.",
    ]);
    expect(statedPeriods(twice).gaps).toEqual([
      {
        table: "Net debt data",
        reason:
          "This page could not read the periods of net debt data because FY2024 appears more than once.",
      },
    ]);
    expect(statedPeriods(twice).labels).toEqual(["FY2023", "FY2024"]);
  });
});

// ------------------------------------------------------------------------------------------------

describe("earningsAgainstDebt", () => {
  it("reads the four measures of both accepted periods on US$m, with each exact change", () => {
    const data = earningsAgainstDebt(accepted);
    expect(data?.unit).toBe("US$m");
    expect(data?.periods.map((p) => p.label)).toEqual(["FY2023", "FY2024"]);
    expect(data?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect(
      data?.measures.map((m) => [m.key, m.label, ...(cells(m.values) ?? []), m.change]),
    ).toEqual([
      ["sales", "Revenue", ["FY2023", "6585"], ["FY2024", "7940"], "1355"],
      ["reportedEbitda", "EBITDA (Reported)", ["FY2023", "3148"], ["FY2024", "3813"], "665"],
      ["adjustedEbitda", "Adjusted EBITDA", ["FY2023", "3395"], ["FY2024", "4173"], "778"],
      ["grossDebt", "Gross debt", ["FY2023", "19750"], ["FY2024", "24880"], "5130"],
    ]);
    expect(data?.absent).toEqual([]);
  });
  it("returns no growth rate: the module writes none (ruling i)", () => {
    const measure = earningsAgainstDebt(accepted)?.measures[0];
    expect(measure && "growth" in measure).toBe(false);
  });
  it("reads total debt / EBITDA with the owner's tone: a rise of 0.26 is worse", () => {
    const leverage = earningsAgainstDebt(accepted)?.leverage;
    expect(cells(leverage?.values)).toEqual([
      ["FY2023", "6.27"],
      ["FY2024", "6.53"],
    ]);
    expect(leverage?.change).toBe("0.26");
    expect(leverage?.tone).toBe("worse");
  });
  it("reads the leverage basis from the table's own cell, leaving out the clause that cites pages", () => {
    const data = earningsAgainstDebt(accepted);
    expect(data?.leverageBasis).toBe(
      "Carrying debt; reported EBITDA; dividend-only pro forma 6.02x after 2024-10-18.",
    );
    expect(data?.leverage?.bases).toEqual([
      "Carrying debt; reported EBITDA; before subsequent events.",
      "Carrying debt; reported EBITDA; dividend-only pro forma 6.02x after 2024-10-18.",
    ]);
  });
  it("gives figures for the single-period relative value handoff, and no comparison", () => {
    const data = earningsAgainstDebt(relative);
    expect(data?.periods.map((p) => p.label)).toEqual(["FY2024"]);
    expect(data?.comparison).toBeNull();
    expect(data?.measures.map((m) => [m.key, ...(cells(m.values) ?? []), m.change])).toEqual([
      ["sales", ["FY2024", "7940"], null],
      ["reportedEbitda", ["FY2024", "3813"], null],
      ["adjustedEbitda", ["FY2024", "4173"], null],
      ["grossDebt", ["FY2024", "24880"], null],
    ]);
    expect(cells(data?.leverage?.values)).toEqual([["FY2024", "6.53"]]);
    expect(data?.leverage?.change).toBeNull();
    expect(data?.leverage?.tone).toBe("none");
    expect(data?.leverageBasis).toBe(
      "Carrying debt and reported EBITDA, not EBITDA As Defined; Before October payments and draw; subsequent-event table keeps adjustments separate.",
    );
  });
  it("reads the distressed handoff's basis without its calculation id or page citation", () => {
    const data = earningsAgainstDebt(distressed);
    expect(data?.measures.map((m) => m.change)).toEqual(["1355", "665", "778", "5130"]);
    expect(data?.leverageBasis).toBe(
      "Carrying-value debt divided by issuer unadjusted EBITDA 3813 US$m; October distribution excluded.",
    );
  });
  it("reads the draft 1 handoff the same as the accepted one", () => {
    const data = earningsAgainstDebt(draft1);
    expect(data?.measures.map((m) => m.change)).toEqual(["1355", "665", "778", "5130"]);
    expect(data?.tableLine).toBe(392);
  });
  it("draws every period of the three-period mutation, gaps in place with their reason", () => {
    const data = earningsAgainstDebt(threePeriodCp1());
    expect(data?.periods.map((p) => p.label)).toEqual(["FY2022", "FY2023", "FY2024"]);
    expect(data?.measures.map((m) => cells(m.values))).toEqual([
      [
        ["FY2022", "gap: outside the comparison scope"],
        ["FY2023", "6585"],
        ["FY2024", "7940"],
      ],
      [
        ["FY2022", "2646"],
        ["FY2023", "3148"],
        ["FY2024", "3813"],
      ],
      [
        ["FY2022", "2646"],
        ["FY2023", "3395"],
        ["FY2024", "4173"],
      ],
      [
        ["FY2022", "gap: outside the comparison scope"],
        ["FY2023", "19750"],
        ["FY2024", "24880"],
      ],
    ]);
    expect(data?.measures.map((m) => m.change)).toEqual(["1355", "665", "778", "5130"]);
    expect(cells(data?.leverage?.values)?.[0]).toEqual([
      "FY2022",
      "gap: outside the comparison scope",
    ]);
  });
  it("still reads the annual periods beside an LTM row, and lists the LTM period", () => {
    const data = earningsAgainstDebt(ltmCp1());
    expect(data?.periods.map((p) => p.label)).toEqual(["FY2023", "FY2024", "LTM Dec-2024"]);
    expect(data?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    const sales = data?.measures.find((m) => m.key === "sales");
    expect(cells(sales?.values)).toEqual([
      ["FY2023", "6585"],
      ["FY2024", "7940"],
      ["LTM Dec-2024", "8000"],
    ]);
    expect(sales?.change).toBe("1355");
    const reported = data?.measures.find((m) => m.key === "reportedEbitda");
    expect(reported?.values[2]).toEqual({ label: "LTM Dec-2024", cell: null, line: null });
  });
  it("names a measure the handoff does not carry instead of drawing it", () => {
    const gone = earningsAgainstDebt(dropTable(accepted, "Net debt data"));
    expect(gone?.measures.map((m) => m.key)).toEqual(["sales", "reportedEbitda", "adjustedEbitda"]);
    expect(gone?.absent).toEqual([
      { label: "Gross debt", reason: "This page could not read gross debt." },
    ]);
  });
  it("keeps a stated gap as a gap: no change, never zero", () => {
    const gap = earningsAgainstDebt(
      setCell(accepted, "Net debt data", 1, "Gross debt", "Not supplied: not extracted"),
    );
    const debt = gap?.measures.find((m) => m.key === "grossDebt");
    expect(shown(debt?.values[1]?.cell)).toBe("gap: not extracted");
    expect(debt?.change).toBeNull();
  });
  it("keeps words where a number is expected as words, with no change", () => {
    const words = earningsAgainstDebt(
      setCell(accepted, "Chart data: revenue and EBITDA", 1, "Revenue", "about 7,900"),
    );
    const sales = words?.measures.find((m) => m.key === "sales");
    expect(shown(sales?.values[1]?.cell)).toBe("text: about 7,900");
    expect(sales?.change).toBeNull();
  });
  it("keeps a stated zero as a value and a negative change as negative", () => {
    const zero = earningsAgainstDebt(
      setCell(accepted, "Chart data: revenue and EBITDA", 1, "Revenue", "0"),
    );
    const sales = zero?.measures.find((m) => m.key === "sales");
    expect(shown(sales?.values[1]?.cell)).toBe("0");
    expect(sales?.change).toBe("-6585");
  });
  it("refuses a measure in another unit, or in more than one unit", () => {
    const allGbp = edited(accepted, (table, at) =>
      at === "Net debt data"
        ? {
            ...table,
            rows: table.rows.map((r) => ({
              ...r,
              cells: r.cells.map((c) => (c === "US$m" ? "GBPm" : c)),
            })),
          }
        : table,
    );
    expect(earningsAgainstDebt(allGbp)?.absent).toEqual([
      {
        label: "Gross debt",
        reason:
          "This page could not read gross debt because it is in another unit than the other measures.",
      },
    ]);
    const mixed = setCell(accepted, "Net debt data", 0, "Reporting unit", "GBPm");
    expect(earningsAgainstDebt(mixed)?.absent).toEqual([
      {
        label: "Gross debt",
        reason: "This page could not read gross debt in one unit.",
      },
    ]);
  });
  it("names a repeated year as the reason a measure is not drawn", () => {
    const twice = addRow(accepted, "Net debt data", [
      "FY2024 / 2024-09-30",
      "1",
      "1",
      "0",
      "US$m",
      "Mutation.",
    ]);
    expect(earningsAgainstDebt(twice)?.absent).toEqual([
      {
        label: "Gross debt",
        reason:
          "This page could not read the periods of net debt data because FY2024 appears more than once.",
      },
    ]);
  });
  it("draws an empty or gap-only table as stated: empty is a reason, gaps stay gaps", () => {
    const empty = earningsAgainstDebt(withRows(accepted, "Net debt data", []));
    expect(empty?.absent).toEqual([
      {
        label: "Gross debt",
        reason: "This page could not read the periods of net debt data because it has no rows.",
      },
    ]);
    const gapsOnly = earningsAgainstDebt(
      withRows(accepted, "Net debt data", [
        [
          "FY2024 / 2024-09-30",
          "Not supplied: x",
          "Not supplied: x",
          "Not supplied: x",
          "US$m",
          "-",
        ],
      ]),
    );
    const debt = gapsOnly?.measures.find((m) => m.key === "grossDebt");
    expect(cells(debt?.values)).toEqual([
      ["FY2023", null],
      ["FY2024", "gap: x"],
    ]);
  });
  it("asserts no leverage basis the table does not state", () => {
    const noBasis = earningsAgainstDebt(
      setCell(accepted, "Chart data: leverage", 1, "Basis and limitation", ""),
    );
    expect(noBasis?.leverageBasis).toBeNull();
    const cited = earningsAgainstDebt(
      setCell(accepted, "Chart data: leverage", 1, "Basis and limitation", "Annual p120."),
    );
    expect(cited?.leverageBasis).toBe("Detail is in Evidence.");
  });
  it("returns nothing when no measure table is readable", () => {
    let none: OutputEntry = accepted;
    for (const heading of [
      "Chart data: revenue and EBITDA",
      "Net debt data",
      "T4.4 Income statement",
    ])
      none = dropTable(none, heading);
    expect(earningsAgainstDebt(none)).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------

describe("handoffWords and cellText (S15-4-2)", () => {
  it.each([
    "Not supplied: see the annual report",
    "Form 10-K",
    "per the 10-Q",
    "Source: the lender's note.",
  ])("leave words that name a filing to Evidence: %s", (text) => {
    expect(handoffWords(text)).toBe("Detail is in Evidence.");
    expect(cellText(readCell(text))).not.toMatch(/annual report|10-[KQ]|lender/);
  });
  it("keep a stated gap's own words before a reason that names a filing", () => {
    expect(cellText(readCell("Not supplied: see the annual report"))).toBe(
      "Not supplied: Detail is in Evidence.",
    );
  });
  it("still draw reader wording and a source dash", () => {
    expect(handoffWords("Not supplied: the source states no split")).toBe(
      "Not supplied: the source states no split",
    );
    expect(cellText(readCell("Not supplied: the source states no split"))).toBe(
      "Not supplied: the source states no split",
    );
    expect(cellText(readCell("Not supplied: source dash"))).toBe("Not supplied: —");
  });
});

describe("basisText", () => {
  it("keeps the module's clauses and leaves out those that cite a source or calculation", () => {
    expect(basisText("Reported cash; annual p120, p152; excludes receivables.")).toBe(
      "Reported cash; excludes receivables.",
    );
    expect(basisText("Calculated C3; annual filing pages 71 and 120.")).toBe(
      "Detail is in Evidence.",
    );
    expect(basisText("")).toBeNull();
  });
  it("does not cut a page locator written with an abbreviation's full stop (S15-4-1)", () => {
    expect(
      basisText(
        "Carrying debt; reported EBITDA; annual p. 120, p. 71; dividend-only pro forma 6.02x after 2024-10-18.",
      ),
    ).toBe("Carrying debt; reported EBITDA; dividend-only pro forma 6.02x after 2024-10-18.");
    expect(basisText("Reported cash; annual PP. 63-64; excludes receivables.")).toBe(
      "Reported cash; excludes receivables.",
    );
    expect(basisText("Annual report pg. 63: debt and cash rise.")).toBe("Detail is in Evidence.");
  });
});

// ------------------------------------------------------------------------------------------------

type Ladder = NonNullable<ReturnType<typeof cashLadder>>;
const ladderRows = (ladder: Ladder | null) =>
  ladder?.steps.map((s) => [s.key, s.kind, s.label, ...s.values.map((v) => shown(v.cell))]);

describe("cashLadder: the handoff's own levels and deductions, as written", () => {
  it("walks the accepted handoff's stated rows for FY2023 and FY2024, no plug and no end level", () => {
    const ladder = cashLadder(accepted);
    expect(ladder?.unit).toBe("US$m");
    expect(ladder?.periods.map((p) => p.label)).toEqual(["FY2023", "FY2024"]);
    expect(ladder?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect(ladderRows(ladder)).toEqual([
      ["ebitda", "level", "EBITDA (Adjusted)", "3395", "4173"],
      ["interest", "deduction", "Cash Interest Paid", "1160", "1158"],
      ["taxes", "deduction", "Cash taxes paid", "260", "539"],
      ["cfo", "level", "Net Cash from Operating Activities", "1375", "2045"],
      ["capex", "deduction", "Capital expenditures", "-139", "-165"],
      ["fcf", "level", "Levered free cash flow", "1236", "1880"],
      ["dividends", "deduction", "Dividends and dividend equivalent payments", "-38", "-2038"],
      [
        "repurchases",
        "deduction",
        "Repurchases of common stock",
        "gap: source dash",
        "gap: source dash",
      ],
      [
        "afterDistributions",
        "level",
        "Discretionary cash flow after distributions",
        "1198",
        "-158",
      ],
      [
        "acquisitions",
        "deduction",
        "Acquisition of businesses, net of cash acquired",
        "-762",
        "-2347",
      ],
    ]);
  });
  it("says how each deduction is written: paid amounts positive, other outflows signed", () => {
    expect(cashLadder(accepted)?.steps.map((s) => s.sign)).toEqual([
      null,
      "paid",
      "paid",
      null,
      "signed",
      null,
      "signed",
      "signed",
      null,
      "signed",
    ]);
  });
  it("matches an income-taxes-paid label form too", () => {
    const other = setLabelled(
      accepted,
      "T4.5 Cash flow statement",
      "Cash taxes paid",
      "Line item",
      "Income taxes paid, net",
    );
    const taxes = cashLadder(other)?.steps.find((s) => s.key === "taxes");
    expect([taxes?.label, ...(cells(taxes?.values) ?? [])]).toEqual([
      "Income taxes paid, net",
      ["FY2023", "260"],
      ["FY2024", "539"],
    ]);
  });
  it('matches the distressed handoff\'s "Cash taxes paid, net of refunds" and keeps the stated repurchase gap', () => {
    const ladder = cashLadder(distressed);
    expect(ladderRows(ladder)).toEqual([
      ["ebitda", "level", "EBITDA (Adjusted)", "3395", "4173"],
      ["interest", "deduction", "Cash Interest Paid", "1160", "1158"],
      ["taxes", "deduction", "Cash taxes paid, net of refunds", "260", "539"],
      ["cfo", "level", "Net Cash from Operating Activities", "1375", "2045"],
      ["capex", "deduction", "Capital expenditures", "-139", "-165"],
      ["fcf", "level", "Levered free cash flow", "1236", "1880"],
      ["dividends", "deduction", "Dividends and dividend equivalent payments", "-38", "-2038"],
      [
        "repurchases",
        "deduction",
        "Repurchases of common stock",
        "gap: source dash",
        "gap: source dash",
      ],
      // Not in the cash flow statement: read from the KPI dashboard's Metric Name row.
      ["afterDistributions", "level", "DCF after cash dividends and equivalents", "1198", "-158"],
      [
        "acquisitions",
        "deduction",
        "Acquisition of businesses, net of cash acquired",
        "-762",
        "-2347",
      ],
    ]);
    const after = ladder?.steps.find((s) => s.key === "afterDistributions");
    expect([after?.stated, after?.absent, after?.line]).toEqual([true, null, 387]);
  });
  it("says what was checked when neither the cash flow statement nor the KPI dashboard states the level", () => {
    const after = cashLadder(dropTable(distressed, "T4.10 KPI dashboard"))?.steps.find(
      (s) => s.key === "afterDistributions",
    );
    expect(after?.stated).toBe(false);
    expect(after?.absent).toBe(
      "This page could not read cash flow after distributions in the cash flow statement or the KPI dashboard.",
    );
    expect(after?.values.map((v) => v.cell)).toEqual([null, null]);
  });
  it("refuses a KPI dashboard level in another unit, and one that matches twice", () => {
    const euro = setLabelled(
      distressed,
      "T4.10 KPI dashboard",
      "Distribution retention",
      "Metric Name",
      "DCF after cash dividends and equivalents, EURm",
    );
    const after = (entry: OutputEntry) =>
      cashLadder(entry)?.steps.find((s) => s.key === "afterDistributions");
    expect(after(euro)?.absent).toBe(
      "This page could not read DCF after cash dividends and equivalents because it is in another unit than the other rows.",
    );
    const twice = addRow(distressed, "T4.10 KPI dashboard", [
      "Other",
      "DCF after all distributions, US$m",
      "1",
      "1",
      "-",
      "-",
    ]);
    expect(after(twice)?.absent).toBe(
      "This page could not read cash flow after distributions because more than one row of the KPI dashboard matches it.",
    );
  });
  it("reads the single-period relative value ladder with its own label forms", () => {
    expect(ladderRows(cashLadder(relative))).toEqual([
      ["ebitda", "level", "EBITDA (Adjusted)", "4173"],
      ["interest", "deduction", "Cash Interest Paid", "1158"],
      ["taxes", "deduction", "Cash Taxes Paid", "539"],
      ["cfo", "level", "Net Cash from Operating Activities", "2045"],
      ["capex", "deduction", "Capital expenditures", "-165"],
      ["fcf", "level", "Free cash flow, levered after working capital", "1880"],
      ["dividends", "deduction", "Dividends and dividend equivalent payments", "-2038"],
      ["repurchases", "deduction", "Repurchases of common stock", "gap: source dash"],
      [
        "afterDistributions",
        "level",
        "Discretionary cash flow after dividends and equivalents",
        "-158",
      ],
      ["acquisitions", "deduction", "Acquisition of businesses, net of cash acquired", "-2347"],
    ]);
    expect(cashLadder(relative)?.comparison).toBeNull();
  });
  it("carries every period of the three-period mutation: FY2022 all stated gaps", () => {
    const ladder = cashLadder(threePeriodCp1());
    expect(ladder?.periods.map((p) => p.label)).toEqual(["FY2022", "FY2023", "FY2024"]);
    expect(ladder?.steps.map((s) => shown(s.values[0]?.cell))).toEqual(
      Array(10).fill("gap: outside the comparison scope"),
    );
    expect(shown(ladder?.steps[0]?.values[2]?.cell)).toBe("4173");
  });
  it("shows a stated tax gap in place with its reason", () => {
    const gap = cashLadder(
      setLabelled(
        accepted,
        "T4.5 Cash flow statement",
        "Cash taxes paid",
        "FY2024",
        "Not supplied: refund netting unclear",
      ),
    );
    const taxes = gap?.steps.find((s) => s.key === "taxes");
    expect(cells(taxes?.values)).toEqual([
      ["FY2023", "260"],
      ["FY2024", "gap: refund netting unclear"],
    ]);
  });
  it("requires one match: two tax rows make the step absent with the reason", () => {
    const twice = addRow(accepted, "T4.5 Cash flow statement", [
      "Cash taxes paid, foreign",
      "1",
      "1",
      "USD millions",
      "Mutation",
      "-",
    ]);
    const taxes = cashLadder(twice)?.steps.find((s) => s.key === "taxes");
    expect(taxes?.stated).toBe(false);
    expect(taxes?.absent).toBe(
      "This page could not read cash taxes paid because more than one row of the statement matches it.",
    );
    expect(taxes?.values.map((v) => v.cell)).toEqual([null, null]);
  });
  it("refuses a step in another unit", () => {
    const other = setLabelled(
      accepted,
      "T4.5 Cash flow statement",
      "Capital expenditures",
      "Unit",
      "EUR millions",
    );
    const capex = cashLadder(other)?.steps.find((s) => s.key === "capex");
    expect(capex?.stated).toBe(false);
    expect(capex?.absent).toBe(
      "This page could not read capital expenditures because it is in another unit than the other rows.",
    );
  });
  it("keeps the ladder when the income statement is missing, with the EBITDA step absent", () => {
    const ladder = cashLadder(dropTable(accepted, "T4.4 Income statement"));
    expect(ladder?.steps[0]).toMatchObject({
      key: "ebitda",
      stated: false,
      absent: "This page could not read the income statement.",
    });
  });
  it("is absent when the cash flow statement is", () => {
    expect(cashLadder(dropTable(accepted, "T4.5 Cash flow statement"))).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------

describe("netDebtView", () => {
  it("reads gross debt, cash, net debt and net leverage for every accepted period", () => {
    const view = netDebtView(accepted);
    expect(view?.unit).toBe("US$m");
    expect(
      view?.periods.map((p) => [p.label, p.gross.text, p.cash.text, p.net.text, p.leverage?.text]),
    ).toEqual([
      ["FY2023", "19750", "3472", "16278", "5.17"],
      ["FY2024", "24880", "6261", "18619", "4.88"],
    ]);
    expect(view?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
  });
  it("lists every stated adjustment in handoff order, dates as written with a gap's reason", () => {
    const view = netDebtView(accepted);
    expect(
      view?.adjustments.map((a) => [
        a.event,
        shown(a.date),
        a.amount.text,
        a.netDebt.text,
        a.leverage.text,
        a.unit,
      ]),
    ).toEqual([
      ["Remaining securitization draw", "text: 2024-10-16", "0", "18619", "4.88", "US$m"],
      [
        "Special dividend and dividend equivalent settlement",
        "text: 2024-10-18",
        "4348",
        "22967",
        "6.02",
        "US$m",
      ],
      [
        "Common-stock repurchases",
        "gap: the source states first quarter FY2025 only",
        "316",
        "18935",
        "4.97",
        "US$m",
      ],
      [
        "Raptor acquisition working-capital settlement received",
        "gap: the source states first quarter FY2025 only",
        "-1",
        "18618",
        "4.88",
        "US$m",
      ],
      [
        "CPI acquisition working-capital settlement paid",
        "gap: the source states first quarter FY2025 only",
        "1",
        "18620",
        "4.88",
        "US$m",
      ],
    ]);
    expect(view?.adjustments[0]?.amount).toEqual({ kind: "number", text: "0", value: 0 });
    expect(view?.noAdjustments).toBe(false);
    expect(view?.noAdjustmentsWords).toBeNull();
  });
  it("states liquidity per period and the handoff's own cash plus available revolver figure", () => {
    const view = netDebtView(accepted);
    expect(view?.liquidity.map((l) => [l.label, l.cash.text, l.undrawn.text])).toEqual([
      ["FY2023", "3472", "755"],
      ["FY2024", "6261", "843"],
    ]);
    expect(view?.liquidityTotal?.label).toBe("Cash plus available revolver");
    expect(cells(view?.liquidityTotal?.values)).toEqual([
      ["FY2023", "4227"],
      ["FY2024", "7104"],
    ]);
  });
  it("gives the relative value handoff's one period, its two stated adjustments and no liquidity total", () => {
    const view = netDebtView(relative);
    expect(
      view?.periods.map((p) => [p.label, p.gross.text, p.cash.text, p.net.text, p.leverage?.text]),
    ).toEqual([["FY2024", "24880", "6261", "18619", "4.88"]]);
    expect(view?.comparison).toBeNull();
    expect(
      view?.adjustments.map((a) => [
        a.event,
        shown(a.date),
        a.amount.text,
        a.netDebt.text,
        a.leverage.text,
      ]),
    ).toEqual([
      [
        "Special dividend and vested dividend equivalents paid",
        "gap: the source states October 2024 only for the combined payment",
        "4348",
        "22967",
        "6.02",
      ],
      [
        "Remaining securitization availability drawn",
        "gap: the source states October 2024 only",
        "0",
        "22967",
        "6.02",
      ],
    ]);
    expect(view?.liquidity.map((l) => [l.label, l.cash.text, l.undrawn.text])).toEqual([
      ["FY2024", "6261", "1006"],
    ]);
    expect(view?.liquidityTotal).toBeNull();
  });
  it("reads the distressed handoff's adjustments in its own order", () => {
    expect(netDebtView(distressed)?.adjustments.map((a) => [a.event, shown(a.date)])).toEqual([
      ["Remaining securitization availability drawn", "text: 2024-10-16"],
      ["Special dividend and vested dividend equivalents paid", "text: 2024-10-18"],
    ]);
  });
  it("returns no adjustment, and the module's words, for the contract's none row", () => {
    const none = netDebtView(
      withRows(accepted, "Post-balance-sheet adjustments", [
        [
          NO_ADJUSTMENT,
          "—",
          "—",
          "—",
          "—",
          "US$m",
          "Synthetic; the annual report and its notes were read.",
        ],
      ]),
    );
    expect(none?.adjustments).toEqual([]);
    expect(none?.noAdjustments).toBe(true);
    expect(none?.noAdjustmentsWords).toEqual({
      event: "None found in the sources read",
      basis: "Synthetic.",
    });
  });
  it("returns no adjustment and no none row when the table is absent", () => {
    const gone = netDebtView(dropTable(accepted, "Post-balance-sheet adjustments"));
    expect(gone?.adjustments).toEqual([]);
    expect(gone?.noAdjustments).toBe(false);
  });
  it("keeps an adjustment whose pro forma is a stated gap, with its reason", () => {
    const gap = netDebtView(
      setCell(
        accepted,
        "Post-balance-sheet adjustments",
        1,
        "Pro forma net debt",
        "Not supplied: pricing pending",
      ),
    );
    expect(shown(gap?.adjustments[1]?.netDebt)).toBe("gap: pricing pending");
  });
  it("reads every period of the three-period mutation, FY2022's gaps in place", () => {
    const view = netDebtView(threePeriodCp1());
    expect(view?.periods.map((p) => [p.label, shown(p.net), shown(p.leverage)])).toEqual([
      ["FY2022", "gap: outside the comparison scope", "gap: outside the comparison scope"],
      ["FY2023", "16278", "5.17"],
      ["FY2024", "18619", "4.88"],
    ]);
  });
  it("orders by year when the table lists the later year first", () => {
    const flipped = edited(accepted, (table, at) =>
      at === "Net debt data" ? { ...table, rows: [...table.rows].reverse() } : table,
    );
    expect(netDebtView(flipped)?.periods.map((p) => [p.label, p.net.text])).toEqual([
      ["FY2023", "16278"],
      ["FY2024", "18619"],
    ]);
  });
  it("is a gap for a repeated year or an empty table", () => {
    const twice = addRow(accepted, "Net debt data", [
      "FY2024 / 2024-09-30",
      "1",
      "1",
      "0",
      "US$m",
      "-",
    ]);
    expect(netDebtView(twice)).toBeNull();
    expect(netDebtView(withRows(accepted, "Net debt data", []))).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------

describe("ebitdaBridge", () => {
  it("reads the accepted steps as written, reconciles exactly, and returns no add-back total", () => {
    const bridge = ebitdaBridge(accepted);
    expect(bridge?.steps.map((s) => [s.kind, s.label, s.cell.text])).toEqual([
      ["opening", "EBITDA (Reported)", "3813"],
      ["change", "Acquisition transaction and integration-related expenses", "70"],
      ["change", "Non-cash stock and deferred compensation expense", "217"],
      ["change", "Refinancing costs", "58"],
      ["change", "Other, net", "15"],
      ["closing", "EBITDA (Adjusted)", "4173"],
    ]);
    expect(bridge?.reconciles).toBe(true);
    expect(bridge && "addBacks" in bridge).toBe(false);
    expect(bridge && bridgeKinds(bridge)).toEqual(["opening", "increase", "closing"]);
  });
  it("reads the distressed and relative value bridges with their own step labels", () => {
    expect(ebitdaBridge(distressed)?.steps.map((s) => s.label)).toEqual([
      "FY2024 reported EBITDA",
      "Acquisition transaction and integration-related expenses",
      "Non-cash stock and deferred compensation expense",
      "Refinancing costs",
      "Other, net",
      "FY2024 EBITDA As Defined",
    ]);
    expect(ebitdaBridge(distressed)?.reconciles).toBe(true);
    expect(ebitdaBridge(relative)?.reconciles).toBe(true);
  });
  it("calls a negative step a decrease and a stated zero no change, never an add-back", () => {
    const bridge = ebitdaBridge(
      withRows(accepted, "Chart data: EBITDA bridge", [
        ["EBITDA (Reported)", "100", "US$m", "-"],
        ["Disposal", "-10", "US$m", "-"],
        ["Other", "0", "US$m", "-"],
        ["EBITDA (Adjusted)", "90", "US$m", "-"],
      ]),
    );
    expect(bridge?.steps.map((s) => bridgeKind(s))).toEqual([
      "opening",
      "decrease",
      "no change",
      "closing",
    ]);
    expect(bridge?.reconciles).toBe(true);
  });
  it("does not reconcile a bridge whose step is altered or a gap; the gap is its own kind", () => {
    expect(
      ebitdaBridge(setCell(accepted, "Chart data: EBITDA bridge", 2, "Amount", "218"))?.reconciles,
    ).toBe(false);
    const gap = ebitdaBridge(
      setCell(accepted, "Chart data: EBITDA bridge", 2, "Amount", "Not supplied: not stated"),
    );
    expect(gap?.reconciles).toBe(false);
    expect(gap && bridgeKinds(gap)).toEqual(["opening", "increase", "gap", "closing"]);
  });
  it("reconciles numerically equal decimals (3148.0 + 1025 = 4173)", () => {
    const decimals = withRows(accepted, "Chart data: EBITDA bridge", [
      ["EBITDA (Reported)", "3148.0", "US$m", "x"],
      ["Add-backs", "1025", "US$m", "x"],
      ["EBITDA (Adjusted)", "4173", "US$m", "x"],
    ]);
    expect(ebitdaBridge(decimals)?.reconciles).toBe(true);
  });
});

// ------------------------------------------------------------------------------------------------

const BRIDGE = "Chart data: EBITDA bridge";

describe("ebitdaBridge: subtotals and an all-gap bridge", () => {
  // Coordinator input L12: 3,813 + 70 + 217 + 58 = 4,158 (the subtotal); 4,158 + 15 = 4,173.
  const withSubtotal = withRows(accepted, BRIDGE, [
    ["EBITDA (Reported)", "3813", "US$m", "x"],
    ["Acquisition transaction and integration-related expenses", "70", "US$m", "x"],
    ["Stock comp", "217", "US$m", "x"],
    ["Refinancing", "58", "US$m", "x"],
    ["Subtotal before other items", "4158", "US$m", "x"],
    ["Other, net", "15", "US$m", "x"],
    ["EBITDA (Adjusted)", "4173", "US$m", "x"],
  ]);
  it("reads a subtotal row as a level, not a step, and reconciles each run exactly", () => {
    const bridge = ebitdaBridge(withSubtotal);
    expect(bridge?.steps.map((s) => [s.kind, s.label])).toEqual([
      ["opening", "EBITDA (Reported)"],
      ["change", "Acquisition transaction and integration-related expenses"],
      ["change", "Stock comp"],
      ["change", "Refinancing"],
      ["subtotal", "Subtotal before other items"],
      ["change", "Other, net"],
      ["closing", "EBITDA (Adjusted)"],
    ]);
    expect(bridge && bridgeKinds(bridge)).toEqual(["opening", "increase", "subtotal", "closing"]);
    expect(bridge?.reconciles).toBe(true);
    expect(bridge?.breaks).toBe(false);
  });
  it("knows the subtotal words whole and in any case, and nothing else", () => {
    for (const label of ["Subtotal", "SUBTOTAL", "Sub-total", "Total", "Total add-backs"]) {
      const entry = withRows(accepted, BRIDGE, [
        ["EBITDA (Reported)", "100", "US$m", "x"],
        ["A", "10", "US$m", "x"],
        [label, "110", "US$m", "x"],
        ["EBITDA (Adjusted)", "110", "US$m", "x"],
      ]);
      expect(ebitdaBridge(entry)?.steps[2]?.kind, label).toBe("subtotal");
    }
    for (const label of ["Totally different", "Other total", "Subtotaling"]) {
      const entry = withRows(accepted, BRIDGE, [
        ["EBITDA (Reported)", "100", "US$m", "x"],
        [label, "10", "US$m", "x"],
        ["EBITDA (Adjusted)", "110", "US$m", "x"],
      ]);
      expect(ebitdaBridge(entry)?.steps[1]?.kind, label).toBe("change");
    }
  });
  it("breaks when the run before the subtotal or after it does not add up", () => {
    const before = setCell(withSubtotal, BRIDGE, 4, "Amount", "4159");
    expect(ebitdaBridge(before)?.breaks).toBe(true);
    expect(ebitdaBridge(before)?.reconciles).toBe(false);
    const after = setCell(withSubtotal, BRIDGE, 6, "Amount", "4174");
    expect(ebitdaBridge(after)?.breaks).toBe(true);
  });
  it("adds decimals exactly (0.1 + 0.2 = 0.3, not 0.30000000000000004)", () => {
    const entry = withRows(accepted, BRIDGE, [
      ["EBITDA (Reported)", "0.1", "US$m", "x"],
      ["A", "0.2", "US$m", "x"],
      ["Subtotal", "0.3", "US$m", "x"],
      ["B", "-0.3", "US$m", "x"],
      ["EBITDA (Adjusted)", "0", "US$m", "x"],
    ]);
    expect(ebitdaBridge(entry)?.reconciles).toBe(true);
  });
  it("cannot check a run with a gap and does not call it broken; other runs are still checked", () => {
    const gap = setCell(withSubtotal, BRIDGE, 2, "Amount", "Not supplied: not itemised");
    expect(ebitdaBridge(gap)?.reconciles).toBe(false);
    expect(ebitdaBridge(gap)?.breaks).toBe(false);
    expect(ebitdaBridge(setCell(gap, BRIDGE, 6, "Amount", "4999"))?.breaks).toBe(true);
  });
  it("an all-gap bridge is not drawn: its gap is the module's own reason, once", () => {
    const REASON = "Not supplied: no reconciliation in the filing read";
    const allGap = withRows(accepted, BRIDGE, [
      ["EBITDA (Reported)", REASON, "US$m", "x"],
      ["Add-backs", REASON, "US$m", "x"],
      ["EBITDA (Adjusted)", REASON, "US$m", "x"],
    ]);
    expect(ebitdaBridge(allGap)).toBeNull();
    expect(figureGap(allGap, "bridge")).toBe(REASON);
    const mixed = setCell(allGap, BRIDGE, 2, "Amount", "Not calculable: no adjusted figure");
    expect(figureGap(mixed, "bridge")).toBe(
      "EBITDA (Reported): Not supplied: no reconciliation in the filing read; Add-backs: Not supplied: no reconciliation in the filing read; EBITDA (Adjusted): Not calculable: no adjusted figure",
    );
  });
});

// ------------------------------------------------------------------------------------------------

const COVER = "Chart data: interest cover";
const RATIO = "EBITDA / cash interest";

describe("interestCover: EBITDA / cash interest for every stated period", () => {
  it("reads the accepted FY2023 2.71 and FY2024 3.29 in year order, x, with the module's words", () => {
    const cover = interestCover(accepted);
    expect(cover?.label).toBe("EBITDA / cash interest");
    expect(cover?.unit).toBe("x");
    expect(cells(cover?.values)).toEqual([
      ["FY2023", "2.71"],
      ["FY2024", "3.29"],
    ]);
    expect(cover?.bases).toEqual([
      "Reported EBITDA / net cash interest paid.",
      "Same identity and annual duration; cash paid is not accrued interest expense.",
    ]);
    expect(cover?.notes).toEqual([
      "Coverage is historical and uses net cash interest paid rather than a forward coupon run rate.",
    ]);
    expect(cover?.tableLine).toBe(329);
    // The one change, by the kit rule (FY2023 → FY2024, a year apart): 3.29 − 2.71 = 0.58.
    expect([cover?.change?.text, cover?.change?.stated, cover?.tone]).toEqual([
      "0.58",
      false,
      "better",
    ]);
    expect(cover?.ordered).toBe(true);
  });
  it("reads the one period of the relative value handoff; a calculation id is left out", () => {
    const cover = interestCover(relative);
    expect(cells(cover?.values)).toEqual([["FY2024", "3.29"]]);
    expect(cover?.bases).toEqual([
      "Reported EBITDA divided by cash interest paid, net; Net cash interest is not gross contractual coupon cost.",
    ]);
    expect(cover?.notes).toEqual([
      "The denominator is the issuer’s net cash payment, not accrued net interest expense.",
    ]);
  });
  it("reads the distressed and draft handoffs: the same two stated figures", () => {
    for (const entry of [distressed, draft1])
      expect(cells(interestCover(entry)?.values)).toEqual([
        ["FY2023", "2.71"],
        ["FY2024", "3.29"],
      ]);
  });
  it("reads three periods by year whatever the row order, a stated gap in place, zero a value", () => {
    let entry = addRow(accepted, COVER, ["FY2022 / 2022-09-30", "0", "x", "Test row."]);
    expect(cells(interestCover(entry)?.values)).toEqual([
      ["FY2022", "0"],
      ["FY2023", "2.71"],
      ["FY2024", "3.29"],
    ]);
    entry = setCell(entry, COVER, 0, RATIO, "Not supplied: cash interest not split");
    expect(cells(interestCover(entry)?.values)).toEqual([
      ["FY2022", "0"],
      ["FY2023", "gap: cash interest not split"],
      ["FY2024", "3.29"],
    ]);
    // FY2023 is a gap: no change to the latest period, no better/worse.
    expect([interestCover(entry)?.change, interestCover(entry)?.tone]).toEqual([null, "none"]);
  });
  it("reads a negative ratio and words as written, never as a gap", () => {
    const entry = setCell(setCell(accepted, COVER, 0, RATIO, "-0.4"), COVER, 1, RATIO, "n.m.");
    expect(cells(interestCover(entry)?.values)).toEqual([
      ["FY2023", "-0.4"],
      ["FY2024", "text: n.m."],
    ]);
  });
  it("is a gap with the page's reason: no table, a repeated year, another unit, no column", () => {
    expect(figureGap(dropTable(accepted, COVER), "cover")).toBe(
      "This page could not read interest cover.",
    );
    const twice = addRow(accepted, COVER, ["FY2024", "3.3", "x", "-"]);
    expect(figureGap(twice, "cover")).toBe(
      "This page could not read the periods of interest cover because FY2024 appears more than once.",
    );
    expect(figureGap(setCell(accepted, COVER, 0, "Reporting unit", "%"), "cover")).toBe(
      "This page could not read interest cover in one unit.",
    );
    const renamed = edited(accepted, (table, heading) =>
      heading === COVER
        ? { ...table, headers: ["Period", "Cover", "Reporting unit", "Basis and limitation"] }
        : table,
    );
    expect(figureGap(renamed, "cover")).toBe(
      "This page could not read interest cover because the table is not in a shape this page reads.",
    );
    expect(figureGap(withRows(accepted, COVER, []), "cover")).toBe(
      "This page could not read the periods of interest cover because it has no rows.",
    );
  });
  it("a cover or bridge with no stated number is its words as written, never an empty axis", () => {
    const words = withRows(accepted, COVER, [
      ["FY2023", "n.m.", "x", "-"],
      ["FY2024", "n.m.", "x", "-"],
    ]);
    expect(interestCover(words)).toBeNull();
    expect(figureGap(words, "cover")).toBe("n.m.");
    const bridge = withRows(accepted, BRIDGE, [
      ["EBITDA (Reported)", "n.m.", "US$m", "x"],
      ["Add-backs", "Not supplied: not itemised", "US$m", "x"],
      ["EBITDA (Adjusted)", "n.m.", "US$m", "x"],
    ]);
    expect(figureGap(bridge, "bridge")).toBe(
      "EBITDA (Reported): n.m.; Add-backs: Not supplied: not itemised; EBITDA (Adjusted): n.m.",
    );
  });
  it("an all-gap cover is the module's own reason, not a drawing", () => {
    const allGap = withRows(accepted, COVER, [
      ["FY2023", "Not supplied: cash interest not stated", "x", "-"],
      ["FY2024", "Not supplied: cash interest not stated", "x", "-"],
    ]);
    expect(interestCover(allGap)).toBeNull();
    expect(figureGap(allGap, "cover")).toBe("Not supplied: cash interest not stated");
  });
});

// ------------------------------------------------------------------------------------------------

const STACK = "Chart data: debt stack";
const facilities = (entry: OutputEntry) =>
  debtStack(entry)?.facilities.map((f) => [
    f.facility,
    f.ranking,
    f.secured,
    shown(f.amount),
    shown(f.leverage),
  ]);

describe("debtStack: the facilities in the module's ranking order, as written", () => {
  it("reads the six secured notes of the accepted handoff with cumulative leverage as written", () => {
    expect(debtStack(accepted)?.unit).toBe("US$m");
    expect(facilities(accepted)).toEqual([
      ["2028 secured notes", 1, "Yes", "2100", "0.55"],
      ["2029 secured notes", 1, "Yes", "2750", "1.27"],
      ["2030 secured notes", 1, "Yes", "1450", "1.65"],
      ["2031 secured notes", 1, "Yes", "1000", "1.91"],
      ["2032 secured notes", 1, "Yes", "2200", "2.49"],
      ["2033 secured notes", 1, "Yes", "1500", "2.88"],
    ]);
    expect(debtStack(accepted)?.notes).toEqual([
      "Only notes with both affirmative security descriptions and relative payment rank established are included; omitted instruments prevent this from representing a complete capital structure or recovery waterfall.",
    ]);
    expect(debtStack(accepted)?.tableLine).toBe(408);
  });
  it("reads the relative value stack: ten facilities, two rankings, the module's order kept", () => {
    expect(facilities(relative)).toEqual([
      ["Senior secured term loans, all outstanding tranches", 1, "Yes", "8702", "5.17"],
      ["2028 secured notes", 1, "Yes", "2100", "5.17"],
      ["2029 secured notes", 1, "Yes", "2750", "5.17"],
      ["2030 secured notes", 1, "Yes", "1450", "5.17"],
      ["2031 secured notes", 1, "Yes", "1000", "5.17"],
      ["2032 secured notes", 1, "Yes", "2200", "5.17"],
      ["2033 secured notes", 1, "Yes", "1500", "5.17"],
      ["2027 senior subordinated notes", 2, "No", "2650", "6.37"],
      ["Lower-coupon 2029 senior subordinated notes", 2, "No", "1200", "6.37"],
      ["Higher-coupon 2029 senior subordinated notes", 2, "No", "750", "6.37"],
    ]);
  });
  it("reads the distressed stack's own carrying amounts", () => {
    expect(facilities(distressed)?.map((row) => row[3])).toEqual([
      "8642",
      "2077",
      "2727",
      "1438",
      "984",
      "2180",
      "1486",
      "2641",
      "1194",
      "746",
    ]);
  });
  it("keeps a stated gap amount in place with its reason, and a stated zero as a value", () => {
    let entry = setCell(
      accepted,
      STACK,
      2,
      "Amount",
      "Not supplied: principal not in the note read",
    );
    entry = setCell(entry, STACK, 3, "Amount", "0");
    expect(facilities(entry)?.slice(1, 4)).toEqual([
      ["2029 secured notes", 1, "Yes", "2750", "1.27"],
      ["2030 secured notes", 1, "Yes", "gap: principal not in the note read", "1.65"],
      ["2031 secured notes", 1, "Yes", "0", "1.91"],
    ]);
  });
  it("is a gap when a ranking falls down the rows or is not a whole number from 1", () => {
    const REASON =
      "This page could not read the debt stack because a ranking is not a whole number from 1 that never falls down the rows.";
    expect(figureGap(setCell(relative, STACK, 9, "Ranking", "1"), "stack")).toBe(REASON);
    expect(figureGap(setCell(accepted, STACK, 0, "Ranking", "0"), "stack")).toBe(REASON);
    expect(figureGap(setCell(accepted, STACK, 0, "Ranking", "1.5"), "stack")).toBe(REASON);
    expect(figureGap(setCell(accepted, STACK, 0, "Ranking", "first"), "stack")).toBe(REASON);
  });
  it("is a gap with the page's reason: no table, no rows, another unit, a missing column", () => {
    expect(figureGap(dropTable(accepted, STACK), "stack")).toBe(
      "This page could not read the debt stack.",
    );
    expect(figureGap(withRows(accepted, STACK, []), "stack")).toBe(
      "This page could not read the debt stack because it has no rows.",
    );
    expect(figureGap(setCell(accepted, STACK, 0, "Reporting unit", "EURm"), "stack")).toBe(
      "This page could not read the debt stack in one unit.",
    );
    const noSecured = edited(accepted, (table, heading) =>
      heading === STACK
        ? { ...table, headers: table.headers.map((h) => (h === "Secured" ? "Security" : h)) }
        : table,
    );
    expect(figureGap(noSecured, "stack")).toBe(
      "This page could not read the debt stack because the table is not in a shape this page reads.",
    );
  });
  it("an all-gap stack is the module's own reason", () => {
    const gap = "Not supplied: debt note not in the filing read";
    const allGap = withRows(accepted, STACK, [[gap, gap, gap, gap, gap, "US$m", "x"]]);
    expect(debtStack(allGap)).toBeNull();
    expect(figureGap(allGap, "stack")).toBe(gap);
  });
});

describe("showPeriodsTile", () => {
  it("is false for two annual periods or one, true for three, another kind or a period gap", () => {
    expect(showPeriodsTile(accepted)).toBe(false);
    expect(showPeriodsTile(relative)).toBe(false);
    expect(showPeriodsTile(distressed)).toBe(false);
    expect(showPeriodsTile(threePeriodCp1())).toBe(true);
    expect(showPeriodsTile(ltmCp1())).toBe(true);
    expect(showPeriodsTile(addRow(accepted, COVER, ["FY2024", "3.3", "x", "-"]))).toBe(true);
  });
});

// ------------------------------------------------------------------------------------------------

type View = NonNullable<ReturnType<typeof segmentView>>;
const segmentRows = (view: View | null, part: "segments" | "apart" = "segments") =>
  view?.[part].map((s) => [
    s.name,
    ...s.sales.map((v) => shown(v.cell)),
    ...s.ebitda.map((v) => shown(v.cell)),
  ]);

describe("segmentView: net sales and EBITDA per segment as written, no sum, no ratio", () => {
  it("reads the accepted schedule's two periods by year, corporate apart", () => {
    const view = segmentView(accepted);
    expect(view?.unit).toBe("US$m");
    expect(view?.periods.map((p) => p.label)).toEqual(["FY2023", "FY2024"]);
    expect([view?.salesLabel, view?.ebitdaLabel]).toEqual(["Net sales", "EBITDA As Defined"]);
    expect(segmentRows(view)).toEqual([
      ["Power & Control", "3316", "3941", "1866", "2236"],
      ["Airframe", "3094", "3809", "1547", "1962"],
      ["Non-aviation", "175", "190", "71", "81"],
    ]);
    expect(segmentRows(view, "apart")).toEqual([
      [
        "Unallocated corporate",
        "gap: no separate revenue line",
        "gap: no separate revenue line",
        "-89",
        "-106",
      ],
    ]);
    expect(view && ("salesTotal" in view || "ebitdaTotal" in view)).toBe(false);
  });
  it("reads the distressed schedule written one row per segment and measure", () => {
    const view = segmentView(distressed);
    expect([view?.salesLabel, view?.ebitdaLabel]).toEqual(["Revenue", "EBITDA As Defined"]);
    expect(segmentRows(view)).toEqual([
      ["Power & Control", "3316", "3941", "1866", "2236"],
      ["Airframe", "3094", "3809", "1547", "1962"],
      ["Non-aviation", "175", "190", "71", "81"],
    ]);
    expect(segmentRows(view, "apart")).toEqual([
      [
        "Corporate and eliminations",
        "gap: no separate revenue row",
        "gap: no separate revenue row",
        "-89",
        "-106",
      ],
    ]);
  });
  it("reads the relative value schedule's one period: segment totals, never the sub-lines summed", () => {
    const view = segmentView(relative);
    expect(view?.periods.map((p) => p.label)).toEqual(["FY2024"]);
    expect(view?.comparison).toBeNull();
    expect(segmentRows(view)).toEqual([
      ["Power & Control", "3941", "2236"],
      ["Airframe", "3809", "1962"],
      ["Non-aviation", "190", "81"],
    ]);
    expect(segmentRows(view, "apart")).toEqual([
      ["Corporate and eliminations", "gap: no monetary corporate revenue line", null],
      ["Unallocated corporate", null, "-106"],
    ]);
  });
  it("reads a wide schedule's segment rows and leaves out sub-lines and group totals", () => {
    const wide = withRows(distressed, "Segment schedule", [
      ["Alpha revenue", "10", "12", "USD millions", "-", "-"],
      ["Alpha — Defense sales", "4", "5", "USD millions", "-", "-"],
      ["Alpha — Commercial", "6", "7", "USD millions", "-", "-"],
      ["Total Beta", "20", "0", "USD millions", "-", "-"],
      ["Total segment revenue", "30", "12", "USD millions", "-", "-"],
      ["Alpha EBITDA As Defined", "-1", "2", "USD millions", "-", "-"],
      ["Total EBITDA As Defined", "9", "9", "USD millions", "-", "-"],
    ]);
    const view = segmentView(wide);
    expect(segmentRows(view)).toEqual([
      ["Alpha", "10", "12", "-1", "2"],
      ["Beta", "20", "0", null, null],
    ]);
    expect(view?.apart).toEqual([]);
  });
  it("keeps a business unit whose sales are a gap as a unit with the gap", () => {
    const gap = segmentView(
      setCell(accepted, "Segment schedule", 1, "Net sales", "Not supplied: no line"),
    );
    expect(gap?.segments.map((s) => s.name)).toEqual([
      "Power & Control",
      "Airframe",
      "Non-aviation",
    ]);
    expect(shown(gap?.segments[1]?.sales[1]?.cell)).toBe("gap: no line");
  });
  it("is a gap when one figure is stated twice", () => {
    const twice = addRow(accepted, "Segment schedule", [
      "Airframe",
      "FY2024",
      "1",
      "1",
      "USD millions",
      "-",
      "-",
    ]);
    expect(segmentView(twice)).toBeNull();
  });
  it("is a gap when the schedule is in more than one unit", () => {
    expect(
      segmentView(setCell(accepted, "Segment schedule", 0, "Unit", "EUR millions")),
    ).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------

describe("figureGap: why a figure is not drawn, true of this handoff", () => {
  it("is null for every figure of the three real handoffs", () => {
    for (const entry of [accepted, relative, distressed])
      for (const figure of [
        "earnings",
        "ladder",
        "netDebt",
        "bridge",
        "segments",
        "cover",
        "stack",
      ] as const)
        expect(figureGap(entry, figure), figure).toBeNull();
  });
  it("names an absent table, a repeated year, a twice-stated figure and units", () => {
    expect(figureGap(dropTable(accepted, "Segment schedule"), "segments")).toBe(
      "This page could not read the segment schedule.",
    );
    expect(figureGap(dropTable(accepted, "T4.5 Cash flow statement"), "ladder")).toBe(
      "This page could not read the cash flow statement.",
    );
    const twice = addRow(accepted, "Net debt data", [
      "FY2024 / 2024-09-30",
      "1",
      "1",
      "0",
      "US$m",
      "-",
    ]);
    expect(figureGap(twice, "netDebt")).toBe(
      "This page could not read the periods of net debt data because FY2024 appears more than once.",
    );
    const segmentTwice = addRow(accepted, "Segment schedule", [
      "Airframe",
      "FY2024",
      "1",
      "1",
      "USD millions",
      "-",
      "-",
    ]);
    expect(figureGap(segmentTwice, "segments")).toBe(
      "This page could not read the segment schedule because Airframe net sales appears more than once for FY2024.",
    );
    expect(
      figureGap(
        setCell(accepted, "Chart data: EBITDA bridge", 0, "Reporting unit", "EURm"),
        "bridge",
      ),
    ).toBe("This page could not read the EBITDA bridge in one unit.");
    expect(figureGap(withRows(accepted, "Chart data: EBITDA bridge", []), "bridge")).toBe(
      "This page could not read the EBITDA bridge because it has fewer than three steps.",
    );
  });
  it("gives every measure's reason when no earnings measure is readable", () => {
    let none: OutputEntry = accepted;
    for (const heading of [
      "Chart data: revenue and EBITDA",
      "Net debt data",
      "T4.4 Income statement",
    ])
      none = dropTable(none, heading);
    expect(figureGap(none, "earnings")).toBe(
      "This page could not read revenue. This page could not read the income statement. " +
        "This page could not read adjusted EBITDA. This page could not read gross debt.",
    );
  });
});

// ------------------------------------------------------------------------------------------------

// Coordinator input T3 (mutations): a "FY2024 pro forma" period beside FY2024. Rewritten to the
// ruling of 2026-11-25 (these cases asserted the old refusal: such a set was "unordered", drawn in
// the handoff's order with nothing compared). The period order places a pro forma after the
// reported periods; the comparison stays between the two reported years.
describe("a pro forma period beside the reported ones: placed after them, never a gap", () => {
  const leverage = addRow(accepted, "Chart data: leverage", [
    "FY2024 pro forma",
    "7.10",
    "6.02",
    "x",
    "Test row.",
  ]);
  const netDebt = addRow(accepted, "Net debt data", [
    "FY2024 pro forma",
    "24880",
    "1913",
    "22967",
    "US$m",
    "Test row.",
  ]);
  it("earnings: leverage 6.27, 6.53, 7.10 in period order; FY2023 → FY2024 compared, +0.26", () => {
    const view = earningsAgainstDebt(leverage);
    expect([view?.ordered, view?.unplaced]).toEqual([true, []]);
    expect(view?.periods.map((p) => p.label)).toEqual(["FY2023", "FY2024", "FY2024 pro forma"]);
    expect(view?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect(cells(view?.leverage?.values)).toEqual([
      ["FY2023", "6.27"],
      ["FY2024", "6.53"],
      ["FY2024 pro forma", "7.10"],
    ]);
    expect([view?.leverage?.change, view?.leverage?.tone]).toEqual(["0.26", "worse"]);
    // The latest reported period's basis words (FY2024), never the pro forma row's ("Test row.").
    expect(view?.leverageBasis).toBe(
      "Carrying debt; reported EBITDA; dividend-only pro forma 6.02x after 2024-10-18.",
    );
    expect(figureGap(leverage, "earnings")).toBeNull();
  });
  it("net debt: the strip keeps 5.17, 4.88 and the pro forma 6.02; the net debt rows in order", () => {
    const view = netDebtView(leverage);
    expect(cells(view?.leverageStrip)).toEqual([
      ["FY2023", "5.17"],
      ["FY2024", "4.88"],
      ["FY2024 pro forma", "6.02"],
    ]);
    expect([view?.ordered, view?.comparison]).toEqual([true, { from: "FY2023", to: "FY2024" }]);
    const rows = netDebtView(netDebt);
    expect(rows?.periods.map((p) => [p.label, shown(p.net)])).toEqual([
      ["FY2023", "16278"],
      ["FY2024", "18619"],
      ["FY2024 pro forma", "22967"],
    ]);
    expect([rows?.ordered, rows?.comparison]).toEqual([true, { from: "FY2023", to: "FY2024" }]);
    expect(figureGap(netDebt, "netDebt")).toBeNull();
  });
  it("cash ladder and segments: a pro forma column and a year to date are placed", () => {
    const edit = edited(accepted, (table, heading) =>
      heading === "T4.5 Cash flow statement"
        ? {
            ...table,
            headers: table.headers.map((h) => (h === "FY2023" ? "FY2024 pro forma" : h)),
          }
        : table,
    );
    const ladder = cashLadder(edit);
    expect(ladder?.periods.map((p) => p.label)).toEqual(["FY2023", "FY2024", "FY2024 pro forma"]);
    expect([ladder?.ordered, ladder?.unplaced]).toEqual([true, []]);
    expect(ladder?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    const segments = segmentView(setCell(accepted, "Segment schedule", 0, "Period", "YTD 2024"));
    expect([segments?.ordered, segments?.unplaced]).toEqual([true, []]);
    expect(segments?.periods.map((p) => p.label)).toEqual(["FY2023", "FY2024", "YTD 2024"]);
    expect(segments?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
  });
  it("the stated periods: every label in period order, no gap, FY2023 → FY2024 compared", () => {
    const periods = statedPeriods(leverage);
    expect(periods.labels).toEqual(["FY2023", "FY2024", "FY2024 pro forma"]);
    expect([periods.ordered, periods.unplaced, periods.comparison, periods.gaps]).toEqual([
      true,
      [],
      { from: "FY2023", to: "FY2024" },
      [],
    ]);
    expect(showPeriodsTile(leverage)).toBe(true);
  });
  it("a gap reason ends with one full stop", () => {
    expect(figureGap(withRows(accepted, "Chart data: leverage", []), "earnings")).toBeNull();
    const twice = addRow(accepted, "Net debt data", ["FY2024", "1", "1", "0", "US$m", "-"]);
    expect(figureGap(twice, "netDebt")).not.toMatch(/\.\.$/);
  });
});

// ------------------------------------------------------------------------------------------------

// The ruling of 2026-11-25: every supplied period, ordered oldest fiscal year → latest fiscal year
// → YTD → LTM → PF → forecast years. Inputs are mutations of the accepted handoff written here in
// a scrambled order; every expected order and figure is written out by hand.
describe("every foundation figure draws its periods in the one period order", () => {
  const RULE = ["FY2023", "FY2024", "LTM Jun-2025", "PF FY2024", "FY2025E"];
  const mixed = mixedPeriodsCp1();

  it("interest cover: LTM and PF after the fiscal years, before the forecast; each figure its own", () => {
    const cover = interestCover(mixed);
    expect(cells(cover?.values)).toEqual([
      ["FY2023", "2.71"],
      ["FY2024", "3.29"],
      ["LTM Jun-2025", "3.40"],
      ["PF FY2024", "3.05"],
      ["FY2025E", "3.90"],
    ]);
    expect(cover?.bases).toEqual([
      "Earlier row.",
      "Reported row.",
      "Twelve-month row.",
      "Pro forma row.",
      "Forecast row.",
    ]);
    expect([cover?.ordered, cover?.unplaced]).toEqual([true, []]);
    // The latest reported period is LTM Jun-2025, never the forecast: the pair is FY2024 → LTM,
    // not a year apart of one kind, so no change is printed.
    expect(cover?.comparison).toEqual({ from: "FY2024", to: "LTM Jun-2025" });
    expect(cover?.change).toBeNull();
  });
  it("interest cover: the change is between reported years, never to a forecast year", () => {
    const cover = interestCover(
      withRows(accepted, COVER, [
        ["FY2025E", "3.90", "x", "-"],
        ["FY2024", "3.29", "x", "-"],
        ["FY2023", "2.71", "x", "-"],
      ]),
    );
    expect(cells(cover?.values)?.map(([label]) => label)).toEqual(["FY2023", "FY2024", "FY2025E"]);
    expect(cover?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect([cover?.change?.text, cover?.tone]).toEqual(["0.58", "better"]);
  });
  it("net debt: the rows and the leverage strip in rule order, each figure its own", () => {
    const view = netDebtView(mixed);
    expect(view?.periods.map((p) => [p.label, shown(p.net), shown(p.leverage)])).toEqual([
      ["FY2023", "16278", "5.17"],
      ["FY2024", "18619", "4.88"],
      ["LTM Jun-2025", "22850", "4.80"],
      ["PF FY2024", "22967", "6.02"],
      ["FY2025E", "23100", "4.60"],
    ]);
    expect(view?.leverageStrip.map((cell) => cell.label)).toEqual(RULE);
    expect([view?.ordered, view?.unplaced]).toEqual([true, []]);
    expect(view?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
  });
  it("earnings against debt: every measure on the rule-ordered periods; FY2023 → FY2024 compared", () => {
    const view = earningsAgainstDebt(mixed);
    // The income statement states FY2023 and FY2024 only; the union keeps the rule order.
    expect(view?.periods.map((p) => p.label)).toEqual(RULE);
    const sales = view?.measures.find((measure) => measure.key === "sales");
    expect(cells(sales?.values)).toEqual([
      ["FY2023", "6585"],
      ["FY2024", "7940"],
      ["LTM Jun-2025", "8500"],
      ["PF FY2024", "8100"],
      ["FY2025E", "8800"],
    ]);
    expect(cells(view?.leverage?.values)).toEqual([
      ["FY2023", "6.27"],
      ["FY2024", "6.53"],
      ["LTM Jun-2025", "6.40"],
      ["PF FY2024", "7.10"],
      ["FY2025E", "5.90"],
    ]);
    expect(view?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect([sales?.change, view?.leverage?.change]).toEqual(["1355", "0.26"]);
    // The basis words under the ratio are the latest reported period's, not the forecast row's.
    expect(view?.leverageBasis).toBe("Twelve-month row.");
  });
  it("cash ladder and segments: statement columns and schedule periods in rule order", () => {
    const rename = (from: string, to: string) => (entry: OutputEntry, heading: string) =>
      edited(entry, (table, name) =>
        name === heading
          ? { ...table, headers: table.headers.map((h) => (h === from ? to : h)) }
          : table,
      );
    // The cash flow statement's two columns become a forecast (was FY2024) and an LTM (was FY2023).
    const cash = "T4.5 Cash flow statement";
    const ladder = cashLadder(
      rename("FY2023", "LTM Jun-2025")(rename("FY2024", "FY2025E")(accepted, cash), cash),
    );
    expect(ladder?.periods.map((p) => p.label)).toEqual([
      "FY2023",
      "FY2024",
      "LTM Jun-2025",
      "FY2025E",
    ]);
    const cfo = ladder?.steps.find((step) => step.key === "cfo");
    expect(cells(cfo?.values)).toEqual([
      ["FY2023", null],
      ["FY2024", null],
      ["LTM Jun-2025", "1375"],
      ["FY2025E", "2045"],
    ]);
    expect(ladder?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    let schedule = accepted;
    for (const row of [0, 1, 2, 3])
      schedule = setCell(schedule, "Segment schedule", row, "Period", "FY2025E");
    for (const row of [4, 5, 6, 7])
      schedule = setCell(schedule, "Segment schedule", row, "Period", "PF FY2024");
    const segments = segmentView(schedule);
    expect(segments?.periods.map((p) => p.label)).toEqual(["PF FY2024", "FY2025E"]);
    expect(cells(segments?.segments[0]?.sales)).toEqual([
      ["PF FY2024", "3316"],
      ["FY2025E", "3941"],
    ]);
    // Neither period is reported: nothing is compared.
    expect(segments?.comparison).toBeNull();
  });
  it("the stated periods: the union of every table, in rule order", () => {
    const periods = statedPeriods(mixed);
    expect(periods.labels).toEqual(RULE);
    expect(periods.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect([periods.ordered, periods.unplaced, periods.gaps]).toEqual([true, [], []]);
  });
  it("a period the order cannot read is drawn last, named, and the figure is still read", () => {
    const entry = withRows(accepted, COVER, [
      ["Current", "3.10", "x", "-"],
      ["FY2024", "3.29", "x", "-"],
      ["FY2023", "2.71", "x", "-"],
    ]);
    const cover = interestCover(entry);
    expect(cells(cover?.values)).toEqual([
      ["FY2023", "2.71"],
      ["FY2024", "3.29"],
      ["Current", "3.10"],
    ]);
    expect([cover?.ordered, cover?.unplaced]).toEqual([false, ["Current"]]);
    expect(figureGap(entry, "cover")).toBeNull();
    // The placed periods are compared all the same: 3.29 − 2.71 = 0.58, never to "Current".
    expect(cover?.comparison).toEqual({ from: "FY2023", to: "FY2024" });
    expect([cover?.change?.text, cover?.tone]).toEqual(["0.58", "better"]);
  });
  it("only pro forma rows, and a single period: drawn, nothing compared", () => {
    const onlyPf = interestCover(
      withRows(accepted, COVER, [
        ["PF FY2024", "3.05", "x", "-"],
        ["PF FY2023", "2.60", "x", "-"],
      ]),
    );
    expect(cells(onlyPf?.values)).toEqual([
      ["PF FY2023", "2.60"],
      ["PF FY2024", "3.05"],
    ]);
    expect([onlyPf?.comparison, onlyPf?.change, onlyPf?.ordered]).toEqual([null, null, true]);
    const single = interestCover(withRows(accepted, COVER, [["LTM Jun-2025", "3.40", "x", "-"]]));
    expect(cells(single?.values)).toEqual([["LTM Jun-2025", "3.40"]]);
    expect([single?.comparison, single?.ordered]).toEqual([null, true]);
  });
});
