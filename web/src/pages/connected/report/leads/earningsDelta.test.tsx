// The retained CP-1B handoff (TransDigm FY2024, outdated evidence) carries the earnings table only and
// no chart tables. The chart-table and bridge cases are synthetic, built from the module contract
// (src/deploy_workflow/owners/cpos_launch_tables.py, apps/issuer-library/credit_os/handoff_fields.py);
// not a real handoff. Every expected value below is written out by hand.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { entry, section, table } from "../overview/rows.fixture";
import { EarningsDeltaLead } from "./earningsDelta";
import {
  bridges,
  earningsDelta,
  hasVarianceRegister,
  FEW_PERIODS,
  MIXED_PERIODS,
  NO_PERCENT,
  NO_UNIT,
  TWICE_EARNINGS,
  TWICE_RESULTS,
} from "./earningsDeltaData";
import { cp1bEntry, leadProps } from "./fixtures/load";

afterEach(cleanup);

const PAIR = [
  "Measure",
  "Prior period",
  "Prior",
  "Current period",
  "Current",
  "Reporting unit",
  "Basis and limitation",
];
const STEPS = ["Step", "Amount", "Reporting unit", "Basis and limitation"];
const RESULTS = "Chart data: prior and current results";
const KPIS = "Chart data: margin and KPI changes";

const results = (rows: string[][]) => section(RESULTS, 1, table(3, PAIR, rows));
const kpis = (rows: string[][]) => section(KPIS, 20, table(22, PAIR, rows));
const steps = (rows: string[][], heading = "Chart data: earnings bridge") =>
  section(heading, 40, table(42, STEPS, rows));
const delta = (...sections: OutputEntry["sections"]) => entry("CP-1B", [], sections);

const MONEY = [
  ["Revenue", "FY2023", "6,585", "FY2024", "7,940", "US$m", "Reported."],
  ["Adjusted EBITDA", "FY2023", "3,395", "FY2024", "4,173", "US$m", "Issuer-adjusted."],
  [
    "Net income",
    "FY2023",
    "1,299",
    "FY2024",
    "Not supplied: not yet reported",
    "US$m",
    "Reported.",
  ],
  ["Flat measure", "FY2023", "100", "FY2024", "100", "US$m", "Reported."],
];

/** The retained handoff with its unit sentence, or a margin cell, changed. */
function withEdit(change: (source: OutputEntry) => void) {
  const copy = structuredClone(cp1bEntry());
  change(copy);
  return copy;
}

const RETAINED_ORDER = [
  "Revenue",
  "COGS",
  "Gross profit",
  "SG&A",
  "Reported EBITDA",
  "Issuer-adjusted EBITDA",
  "Total D&A",
  "Intangible amortization",
  "EBIT",
  "Cash interest paid, net",
  "Cash taxes paid",
  "Total capex, signed outflow",
  "Working-capital cash movement",
  "Operating cash flow",
  "Levered FCF",
  "Discretionary cash flow",
  "Net income",
];

/** The retained table's order with its two split rows (gaps) where the handoff puts them. */
/** The same rows as small multiples: the larger figure in the thousands, then in the hundreds (handoff order inside each). */
const THOUSANDS = [
  "Revenue",
  "COGS",
  "Gross profit",
  "Reported EBITDA",
  "Issuer-adjusted EBITDA",
  "EBIT",
  "Cash interest paid, net",
  "Operating cash flow",
  "Levered FCF",
  "Discretionary cash flow",
  "Net income",
];
const HUNDREDS = [
  "SG&A",
  "Total D&A",
  "Intangible amortization",
  "Cash taxes paid",
  "Total capex, signed outflow",
  "Working-capital cash movement",
];

const WITH_GAPS = [
  ...RETAINED_ORDER.slice(0, 12),
  "Maintenance capex",
  "Growth capex",
  ...RETAINED_ORDER.slice(12),
];

describe("the prior and current results from the retained earnings table", () => {
  const { movers, kpis: margins } = earningsDelta(cp1bEntry());
  it("reads the unit from the sentence under the heading and takes the money rows only", () => {
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(movers.fallback).toBe(true);
    expect(movers.groups.map((one) => one.unit)).toEqual(["$m", "$m"]);
    expect(movers.unstated.map((one) => one.pair.label)).toEqual([
      "Maintenance capex",
      "Growth capex",
    ]);
    expect(movers.unstated[0]?.pair.prior.reason).toBe("no split");
  });
  it("splits rows of very different size into small multiples, each on its own scale", () => {
    if (movers.kind !== "ready") throw new Error("expected movers");
    // Each group's head is the scale actually drawn: -158 to 7,940 on ticks of 2,000, then -431 to 980.
    expect(movers.groups.map((one) => one.axis)).toEqual([
      { from: "\u22122,000", to: "8,000" },
      { from: "\u2212500", to: "1,000" },
    ]);
  });
  it("lists every pair in the handoff's own order, not ranked by the size of its change", () => {
    if (movers.kind !== "ready") throw new Error("expected movers");
    // 17 money rows state both figures; the two margin rows and the two split rows are not among them.
    expect(movers.groups.map((one) => one.rows.map((pair) => pair.label))).toEqual([
      THOUSANDS,
      HUNDREDS,
    ]);
  });
  it("prints the change the handoff states as written, and makes none where it states one", () => {
    if (movers.kind !== "ready") throw new Error("expected movers");
    const pairs = movers.groups.flatMap((one) => one.rows);
    const of = (label: string) => pairs.find((pair) => pair.label === label)?.change;
    expect(of("Revenue")).toMatchObject({ text: "+1,355", basis: "stated", sign: 1 });
    expect(of("Discretionary cash flow")).toMatchObject({
      text: "\u22121,356",
      basis: "stated",
      sign: -1,
    });
    expect(of("Cash interest paid, net")).toMatchObject({ text: "\u22122", basis: "stated" });
    expect(of("Working-capital cash movement")).toMatchObject({ text: "+129", basis: "stated" });
    // "22 reported" is the module's own figure: printed as stated.
    expect(of("Intangible amortization")).toMatchObject({
      text: "+22 reported",
      basis: "stated",
      sign: 1,
    });
    expect(pairs).toHaveLength(17);
    expect(pairs.every((pair) => pair.change?.basis === "stated")).toBe(true);
  });
  it("gives better or worse only for a measure the owner's table knows", () => {
    if (movers.kind !== "ready") throw new Error("expected movers");
    const pairs = movers.groups.flatMap((one) => one.rows);
    const toneOf = (label: string) => pairs.find((pair) => pair.label === label)?.tone;
    expect(toneOf("Revenue")).toBe("better");
    expect(toneOf("Issuer-adjusted EBITDA")).toBe("better");
    expect(toneOf("Gross profit")).toBe("none");
    expect(toneOf("Discretionary cash flow")).toBe("none");
  });
  it("reads margins as percent values on their own, with the stated change in percentage points", () => {
    if (margins.kind !== "ready") throw new Error("expected margins");
    const [only] = margins.groups;
    expect(only?.unit).toBe("%");
    expect(only?.rows.map((pair) => [pair.label, pair.prior.value, pair.current.value])).toEqual([
      ["Gross margin", 58.3, 58.8],
      ["Reported EBITDA margin", 47.81, 48.02],
    ]);
    expect(only?.rows.map((pair) => pair.change?.text)).toEqual([
      "+0.5 percentage points",
      "+0.22 percentage points, rounded",
    ]);
    expect(only?.fromZero).toBe(false);
  });
  it("draws nothing for money when the heading does not state the unit", () => {
    const edited = withEdit((source) => {
      for (const one of source.sections)
        one.blocks = one.blocks.filter((block) => block.type !== "text");
    });
    expect(earningsDelta(edited).movers).toMatchObject({ kind: "gap", reason: NO_UNIT });
    // The margins carry their unit in the cell, so they do not depend on the sentence.
    expect(earningsDelta(edited).kpis.kind).toBe("ready");
  });
  it("draws no margin when one margin cell has no percent sign", () => {
    const edited = withEdit((source) => {
      const t44 = source.sections
        .flatMap((one) => one.blocks)
        .find((block) => block.type === "table");
      const row =
        t44?.type === "table" ? t44.rows.find((one) => one.cells[0] === "Gross margin") : null;
      if (row) row.cells[2] = "58.8";
    });
    expect(earningsDelta(edited).kpis).toMatchObject({ kind: "gap", reason: NO_PERCENT });
  });
  it("is a gap when the handoff has no earnings table at all, and says so", () => {
    const empty = earningsDelta(entry("CP-1B", [], []));
    expect(empty.movers).toMatchObject({
      kind: "gap",
      reason: "This page could not read the prior and current results.",
    });
    expect(empty.kpis).toMatchObject({
      kind: "gap",
      reason: "This page could not read the margin and KPI changes.",
    });
    expect(empty.bridges).toEqual([]);
  });
});

/** An earnings table with the headers and rows given, under the unit sentence. */
const earningsTable = (headers: string[], rows: string[][]) => ({
  heading: "T4.4 Earnings",
  level: 3,
  line: 1,
  blocks: [
    { type: "text" as const, line: 2, end: 2, text: "All money amounts are USD millions." },
    table(4, headers, rows),
  ],
});

describe("periods of the earnings table", () => {
  it("reads the two annual periods when an LTM column stands beside them, and lists the LTM as its own", () => {
    const { movers, kpis: margins } = earningsDelta(
      delta(
        earningsTable(
          ["Line Item", "FY2023", "FY2024", "LTM Dec-2024", "YoY Change (Abs)"],
          [
            ["Revenue", "6585", "7940", "8100", "1355"],
            ["Gross margin", "58.3%", "58.8%", "59.0%", "+0.5 percentage points"],
          ],
        ),
      ),
    );
    if (movers.kind !== "ready" || margins.kind !== "ready") throw new Error("expected figures");
    const [revenue] = movers.groups[0]?.rows ?? [];
    expect(revenue).toMatchObject({ priorPeriod: "FY2023", currentPeriod: "FY2024" });
    expect(revenue?.change).toMatchObject({ text: "+1,355", basis: "stated" });
    expect(revenue?.others).toEqual([{ period: "LTM Dec-2024", text: "8100" }]);
    expect(movers.otherPeriods).toEqual(["LTM Dec-2024"]);
    expect(margins.groups[0]?.rows[0]?.others).toEqual([{ period: "LTM Dec-2024", text: "59.0%" }]);
  });
  it("compares the latest two of three annual periods, makes the change itself, and lists the earlier one", () => {
    const { movers } = earningsDelta(
      delta(
        earningsTable(
          ["Line Item", "FY2022", "FY2023", "FY2024", "YoY Change (Abs)"],
          [["Revenue", "6000", "6585", "7940", "999"]],
        ),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    const [revenue] = movers.groups[0]?.rows ?? [];
    expect(revenue).toMatchObject({ priorPeriod: "FY2023", currentPeriod: "FY2024" });
    // The stated column cannot be tied to one pair of three periods: the exact difference 7940 - 6585.
    expect(revenue?.change).toMatchObject({ text: "+1,355", basis: "computed" });
    expect(revenue?.others).toEqual([{ period: "FY2022", text: "6000" }]);
  });
  it("orders by year, not by column position", () => {
    const { movers } = earningsDelta(
      delta(earningsTable(["Line Item", "FY2024", "FY2023"], [["Revenue", "7940", "6585"]])),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(movers.groups[0]?.rows[0]).toMatchObject({
      priorPeriod: "FY2023",
      currentPeriod: "FY2024",
    });
    expect(movers.groups[0]?.rows[0]?.prior.value).toBe(6585);
  });
  it("says the true condition when there are fewer than two annual periods", () => {
    const { movers } = earningsDelta(
      delta(earningsTable(["Line Item", "FY2024", "LTM Dec-2024"], [["Revenue", "7940", "8100"]])),
    );
    expect(movers).toMatchObject({ kind: "gap", reason: FEW_PERIODS });
  });
  it("does not compare an FY period with a CY period", () => {
    const { movers } = earningsDelta(
      delta(earningsTable(["Line Item", "FY2023", "CY2024"], [["Revenue", "6585", "7940"]])),
    );
    expect(movers).toMatchObject({ kind: "gap", reason: MIXED_PERIODS });
  });
  it("says there is more than one earnings table, not that there is none", () => {
    const one = earningsTable(["Line Item", "FY2023", "FY2024"], [["Revenue", "6585", "7940"]]);
    const { movers, kpis: margins } = earningsDelta(delta(one, structuredClone(one)));
    expect(movers).toMatchObject({ kind: "gap", reason: TWICE_EARNINGS });
    expect(margins).toMatchObject({ kind: "gap", reason: TWICE_EARNINGS });
  });
});

describe("pairs from the chart tables", () => {
  it("gives each unit its own group and scale, rows in the handoff's order", () => {
    const { movers } = earningsDelta(
      delta(
        results([
          ...MONEY,
          ["Interest coverage", "FY2023", "2.71", "FY2024", "3.29", "x", "Cash."],
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(movers.fallback).toBe(false);
    // $m in two small multiples (the larger figure in the thousands, then in the hundreds), then x.
    expect(movers.groups.map((one) => one.unit)).toEqual(["$m", "$m", "x"]);
    const [money, small, times] = movers.groups;
    expect(money?.drawn.map((pair) => pair.label)).toEqual([
      "Revenue",
      "Adjusted EBITDA",
      "Net income",
    ]);
    expect(money?.rows.map((pair) => pair.label)).toEqual(["Revenue", "Adjusted EBITDA"]);
    expect(small?.rows.map((pair) => pair.label)).toEqual(["Flat measure"]);
    expect(money?.fromZero).toBe(true);
    expect(times?.axis).toEqual({ from: "0", to: "4" });
    expect(times?.rows[0]?.change).toMatchObject({ text: "+0.58x", basis: "computed", sign: 1 });
    expect(times?.rows[0]?.tone).toBe("better");
  });
  it("keeps the handoff's order even when a later row moves more", () => {
    const { movers } = earningsDelta(
      delta(
        results([
          ["Small", "FY2023", "10", "FY2024", "11", "US$m", "x"],
          ["Big", "FY2023", "10", "FY2024", "90", "US$m", "x"],
          ["Middle", "FY2023", "10", "FY2024", "50", "US$m", "x"],
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(movers.groups[0]?.rows.map((pair) => pair.label)).toEqual(["Small", "Big", "Middle"]);
  });
  it("judges a move in leverage, net leverage or coverage as CP-1 does, and an unknown measure not at all", () => {
    const judged = (label: string, prior: string, current: string) => {
      const { movers } = earningsDelta(
        delta(results([[label, "FY2023", prior, "FY2024", current, "x", "x"]])),
      );
      if (movers.kind !== "ready") throw new Error("expected movers");
      const [pair] = movers.groups[0]?.rows ?? [];
      return [pair?.change?.text, pair?.tone];
    };
    expect(judged("Total debt / EBITDA", "6.27", "6.53")).toEqual(["+0.26x", "worse"]);
    expect(judged("Total debt / EBITDA", "6.53", "6.27")).toEqual(["\u22120.26x", "better"]);
    expect(judged("Net debt / EBITDA", "5.1", "5.4")).toEqual(["+0.3x", "worse"]);
    expect(judged("Interest coverage", "2.71", "3.29")).toEqual(["+0.58x", "better"]);
    expect(judged("Interest coverage", "3.29", "2.71")).toEqual(["\u22120.58x", "worse"]);
    expect(judged("Customer count", "3", "4")).toEqual(["+1x", "none"]);
  });
  it("makes no change figure between two different kinds of period, and draws the two figures", () => {
    const { movers } = earningsDelta(
      delta(
        results([
          ["Revenue", "FY2024", "7940", "LTM Dec-2024", "8100", "US$m", "x"],
          ["Costs", "FY2023", "1000", "FY2024", "1200", "US$m", "x"],
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    const [mixed, plain] = movers.groups[0]?.rows ?? [];
    expect(mixed).toMatchObject({ change: null, tone: "none" });
    expect(mixed?.prior.value).toBe(7940);
    expect(mixed?.current.value).toBe(8100);
    expect(plain?.change).toMatchObject({ text: "+200", basis: "computed" });
    // A row without a change simply shows none: no method note says why.
    expect(movers.notes).toEqual(["x"]);
  });
  it("says a repeated chart table is repeated, not absent", () => {
    expect(earningsDelta(delta(results(MONEY), results(MONEY))).movers).toMatchObject({
      kind: "gap",
      reason: TWICE_RESULTS,
    });
  });
  it("keeps a pair with a missing side as a gap with the handoff's reason, never as zero", () => {
    const { movers } = earningsDelta(delta(results(MONEY)));
    if (movers.kind !== "ready") throw new Error("expected movers");
    const [money] = movers.groups;
    // Drawn with its stated side; the missing side is the gap with the module's reason, never zero.
    const income = money?.drawn.find((pair) => pair.label === "Net income");
    expect(income?.prior).toMatchObject({ kind: "number", value: 1299 });
    expect(income?.current).toMatchObject({ kind: "gap", value: null, reason: "not yet reported" });
    expect(income?.change).toBeNull();
    expect(money?.rows.map((pair) => pair.label)).not.toContain("Net income");
  });
  it("calls a pair whose prior equals its current flat, with no direction", () => {
    const { movers } = earningsDelta(delta(results(MONEY)));
    if (movers.kind !== "ready") throw new Error("expected movers");
    const flat = movers.groups
      .flatMap((one) => one.rows)
      .find((pair) => pair.label === "Flat measure");
    expect(flat?.change).toMatchObject({ sign: 0, magnitude: 0, basis: "computed" });
    expect(flat?.tone).toBe("none");
  });
  it("keeps a stated zero as a value, and a negative value on the axis", () => {
    const { movers } = earningsDelta(
      delta(
        results([
          ["Revenue", "FY2023", "0", "FY2024", "90", "US$m", "x"],
          ["Cash flow", "FY2023", "-50", "FY2024", "30", "US$m", "x"],
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    const [one] = movers.groups;
    expect(one?.rows.map((pair) => [pair.label, pair.prior.value, pair.current.value])).toEqual([
      ["Revenue", 0, 90],
      ["Cash flow", -50, 30],
    ]);
    expect(one?.rows[1]?.change?.text).toBe("+80");
  });
  it("prints the change the module states as written, even where it disagrees with the two figures", () => {
    const earnings = earningsTable(
      ["Line Item", "FY2023", "FY2024", "YoY Change (Abs)"],
      [
        ["Revenue", "100", "80", "20"],
        ["Costs", "50", "70", "n.m."],
      ],
    );
    const { movers } = earningsDelta(delta(earnings));
    if (movers.kind !== "ready") throw new Error("expected movers");
    const pairs = movers.groups.flatMap((one) => one.rows);
    expect(pairs.find((pair) => pair.label === "Revenue")?.change).toMatchObject({
      text: "+20",
      basis: "stated",
    });
    // Words in the change cell are the module's: printed as written, with no direction and no better or worse.
    expect(pairs.find((pair) => pair.label === "Costs")?.change).toMatchObject({
      text: "n.m.",
      basis: "stated",
      sign: null,
    });
    lead(delta(earnings));
    expect(screen.queryByText(/disagreed|derived/)).toBeNull();
  });
  it("draws a pair that states (1,160) or n.m. in place as written, with no method note", () => {
    const { movers } = earningsDelta(
      delta(
        results([
          ["Cash interest", "FY2023", "(1,160)", "FY2024", "n.m.", "US$m", "x"],
          ["Cash taxes", "FY2023", "n.m.", "FY2024", "n.m.", "US$m", "x"],
          ["Revenue", "FY2023", "1,000", "FY2024", "1,100", "US$m", "x"],
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    const [interest] = movers.groups[0]?.drawn ?? [];
    expect(interest?.prior).toMatchObject({ kind: "number", value: -1160, written: "(1,160)" });
    expect(interest?.current).toMatchObject({ kind: "words", text: "n.m." });
    expect(interest?.change).toBeNull();
    expect(movers.groups[0]?.drawn.map((pair) => pair.label)).toEqual(["Cash interest", "Revenue"]);
    // A pair stating no figure on either side is listed in its place with its words, not left out.
    expect(movers.unstated.map((one) => one.pair.label)).toEqual(["Cash taxes"]);
    expect(movers.notes).toEqual(["x"]);
  });
  it("sets no change between two years apart, nor across kinds of period (the L2 inputs)", () => {
    const change = (
      label: string,
      prior: [string, string],
      current: [string, string],
      unit: string,
    ) => {
      const { kpis: figure } = earningsDelta(
        delta(kpis([[label, prior[0], prior[1], current[0], current[1], unit, "x"]])),
      );
      if (figure.kind !== "ready") throw new Error("expected kpis");
      const [pair] = figure.groups[0]?.drawn ?? [];
      return [pair?.change?.text ?? null, pair?.tone];
    };
    expect(change("Gross margin", ["FY2022", "58.3"], ["FY2024", "61.32"], "%")).toEqual([
      null,
      "none",
    ]);
    expect(change("Gross margin", ["FY2023", "58.3"], ["FY2024", "58.8"], "%")).toEqual([
      "+0.5 percentage points",
      "none",
    ]);
    expect(change("Total debt / EBITDA", ["FY2022", "6.1"], ["FY2024", "6.53"], "x")).toEqual([
      null,
      "none",
    ]);
    expect(change("Total debt / EBITDA", ["FY2024", "4.88"], ["LTM Mar-2025", "5.1"], "x")).toEqual(
      [null, "none"],
    );
    expect(change("Revenue", ["Q1 2024", "1920"], ["FY2025", "7940"], "US$m")).toEqual([
      null,
      "none",
    ]);
    expect(change("Revenue", ["LTM Mar-2024", "7000"], ["LTM Mar-2025", "7500"], "US$m")).toEqual([
      "+500",
      "better",
    ]);
  });
  it("splits a unit into at most four small multiples incl. the one with no figure above zero, each headed by its axis", () => {
    const row = (label: string, value: string) => [
      label,
      "FY2023",
      value,
      "FY2024",
      value,
      "US$m",
      "x",
    ];
    const { movers } = earningsDelta(
      delta(
        results([
          row("a", "5"),
          row("b", "50"),
          row("c", "500"),
          row("d", "5000"),
          row("e", "50000"),
          row("f", "7"),
          row("g", "0"),
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(
      movers.groups.map((one) => [one.axis, one.noFigure, one.drawn.map((pair) => pair.label)]),
    ).toEqual([
      [{ from: "0", to: "500" }, false, ["a", "b", "c", "f"]],
      [{ from: "0", to: "5,000" }, false, ["d"]],
      [{ from: "0", to: "50,000" }, false, ["e"]],
      [null, true, ["g"]],
    ]);
  });
  it("puts a pair with no non-zero figure in its own group, whatever else it states", () => {
    const { movers } = earningsDelta(
      delta(
        results([
          ["Both zero", "FY2023", "0", "FY2024", "0", "US$m", "x"],
          ["Zero and a gap", "FY2023", "0", "FY2024", "Not supplied: not split", "US$m", "x"],
          ["Loss", "FY2023", "-400", "FY2024", "-100", "US$m", "x"],
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(
      movers.groups.map((one) => [one.axis, one.noFigure, one.drawn.map((pair) => pair.label)]),
    ).toEqual([
      [{ from: "\u2212400", to: "0" }, false, ["Loss"]],
      [null, true, ["Both zero", "Zero and a gap"]],
    ]);
  });
  it("keeps a unit whose rows are all one size as one group, and units apart", () => {
    const { movers } = earningsDelta(
      delta(
        results([
          ["a", "FY2023", "10", "FY2024", "20", "US$m", "x"],
          ["b", "FY2023", "11", "FY2024", "90", "US$m", "x"],
          ["c", "FY2023", "1000", "FY2024", "2000", "EURm", "x"],
        ]),
      ),
    );
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(movers.groups.map((one) => [one.unit, one.axis !== null, one.drawn.length])).toEqual([
      ["$m", true, 2],
      ["€m", true, 1],
    ]);
  });
  it("is a gap when a required column is missing, and when the table is empty", () => {
    const missing = section(
      RESULTS,
      1,
      table(3, ["Measure", "Prior", "Current"], [["a", "1", "2"]]),
    );
    expect(earningsDelta(delta(missing)).movers.kind).toBe("gap");
    expect(earningsDelta(delta(results([]))).movers).toMatchObject({ kind: "gap" });
  });
  it("keeps the handoff's order for margins and KPIs", () => {
    const { kpis: figure } = earningsDelta(
      delta(
        kpis([
          ["Small", "FY2023", "10", "FY2024", "10.1", "%", "x"],
          ["Large", "FY2023", "10", "FY2024", "20", "%", "x"],
        ]),
      ),
    );
    if (figure.kind !== "ready") throw new Error("expected kpis");
    expect(figure.groups[0]?.rows.map((pair) => pair.label)).toEqual(["Small", "Large"]);
    expect(figure.groups[0]?.rows[0]?.change?.text).toBe("+0.1 percentage points");
  });
});

describe("the variance bridge", () => {
  const GOOD = [
    ["Revenue FY2023", "100", "US$m", "Reported."],
    ["Organic growth", "20", "US$m", "Reported."],
    ["Disposals", "-5", "US$m", "Reported."],
    ["Revenue FY2024", "115", "US$m", "Reported."],
  ];
  it("is drawn when the opening and its changes add up to the closing", () => {
    const [result] = bridges(delta(steps(GOOD)));
    if (result?.kind !== "bridge") throw new Error("expected a bridge");
    expect(result.title).toBe("Earnings bridge");
    expect(result.unit).toBe("$m");
    expect(result.steps.map((step) => [step.role, step.label, step.value])).toEqual([
      ["opening", "Revenue FY2023", 100],
      ["change", "Organic growth", 20],
      ["change", "Disposals", -5],
      ["closing", "Revenue FY2024", 115],
    ]);
  });
  it("is not drawn as a bridge when the steps do not add up, and says why", () => {
    const [result] = bridges(
      delta(steps([...GOOD.slice(0, 3), ["Revenue FY2024", "116", "US$m", "x"]])),
    );
    expect(result).toMatchObject({
      kind: "unreconciled",
      message:
        "This page did not draw the variance bridge because its steps do not add up to its closing figure.",
    });
  });
  it("says a gap step is not supplied, with its stated reason, and does not call that a failure to add up", () => {
    const [result] = bridges(
      delta(
        steps([
          GOOD[0] ?? [],
          ["Disposals", "Not supplied: not split", "US$m", "x"],
          GOOD[3] ?? [],
        ]),
      ),
    );
    expect(result).toMatchObject({
      kind: "unreconciled",
      message:
        "This page could not draw the variance bridge because Disposals is not supplied (not split).",
    });
  });
  it("screens a gap reason that names a register", () => {
    const [result] = bridges(
      delta(
        steps([
          GOOD[0] ?? [],
          ["Disposals", "Not supplied: see register T4.4 row D14", "US$m", "x"],
          GOOD[3] ?? [],
        ]),
      ),
    );
    expect(result).toMatchObject({
      message:
        "This page could not draw the variance bridge because Disposals is not supplied (Detail is in Evidence.).",
    });
  });
  it("reads only CP-1B's own four-column step header: CP-1's Add-Back ID bridge is not one of its tables", () => {
    const withId = section(
      "Chart data: EBITDA bridge",
      40,
      table(
        42,
        ["Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"],
        GOOD.map((row) => [...row.slice(0, 2), "Not applicable", ...row.slice(2)]),
      ),
    );
    expect(bridges(delta(withId))).toEqual([]);
  });
  it("is not a bridge with a gap amount, with two units or with no changes", () => {
    const only = (rows: string[][]) => bridges(delta(steps(rows)))[0];
    const gap = [GOOD[0] ?? [], ["Organic", "Not supplied: x", "US$m", "x"], GOOD[3] ?? []];
    expect(only(gap)).toMatchObject({ kind: "unreconciled" });
    const units = GOOD.map((row, at) => (at === 1 ? [row[0] ?? "", "20", "EURm", "x"] : row));
    expect(only(units)).toMatchObject({ kind: "unreconciled" });
    expect(only([GOOD[0] ?? [], GOOD[3] ?? []])).toMatchObject({ kind: "unreconciled" });
  });
  it("is one bridge per step table, each under its own title, each with its own verdict", () => {
    const [ebitda, revenue] = bridges(
      delta(
        steps(GOOD, "Chart data: EBITDA variance"),
        steps(
          [GOOD[0] ?? [], ["Disposals", "Not supplied: not split", "US$m", "x"], GOOD[3] ?? []],
          "Chart data: revenue variance",
        ),
      ),
    );
    expect(ebitda).toMatchObject({ kind: "bridge", title: "EBITDA variance" });
    expect(revenue).toMatchObject({ kind: "unreconciled", title: "Revenue variance" });
  });
  it("is none without a step table", () => {
    expect(bridges(delta(results(MONEY)))).toEqual([]);
  });
});

const lead = (source: OutputEntry) => render(<EarningsDeltaLead {...leadProps(source)} />);

const RESULTS_NAME = "Prior and current results";

/** The dumbbell row of one measure (the mark draws one SVG per unit; each row is a `g[data-row]`). */
const rowMark = (container: HTMLElement, label: string) =>
  container.querySelector(`g[data-row="${label}"]`)?.parentElement as unknown as SVGGElement;
const cx = (element: Element | null) => Number(element?.getAttribute("cx"));
const spanOf = (row: Element) =>
  cx(row.querySelector("[data-current]")) - cx(row.querySelector("[data-prior]"));
const textOf = (row: Element, part: string) =>
  [...row.querySelectorAll(`[data-part="${part}"]`)].map((one) => one.textContent);

/** Opens the tile's table view (a button in the tile head) and returns its rows. */
function rowsOf(tile: HTMLElement) {
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  return [...tile.querySelectorAll("table tbody tr")].map((row) =>
    [...row.querySelectorAll("td")].map((cell) => cell.textContent),
  );
}

/** Every SVG text at its real size: the viewBox is the measured width, so font-size is pixels. */
const smallest = (container: HTMLElement) =>
  Math.min(
    ...[...container.querySelectorAll("svg text")].map((text) =>
      Number(text.getAttribute("font-size") ?? "12"),
    ),
  );

/** A measured width for every figure: what `useFigureWidth` reads where there is a layout. */
function measuredAt(width: number) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width,
  } as DOMRect);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("EarningsDeltaLead on the retained handoff", () => {
  it("titles each tile plainly, with no count, ranking or computed reading", () => {
    lead(cp1bEntry());
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    expect(within(tile).getByRole("heading", { name: RESULTS_NAME })).toBeVisible();
    expect(
      within(screen.getByRole("region", { name: "Margins and KPIs" })).getByRole("heading", {
        name: "Margins and KPIs",
      }),
    ).toBeVisible();
    for (const heading of screen.getAllByRole("heading"))
      expect(heading.textContent).not.toMatch(/moved most|derived|rose|fell|\d/);
    // The kicker names what is compared, from the handoff's own period labels.
    expect(within(tile).getByText("FY2023 to FY2024, $m")).toBeVisible();
  });
  it("draws the bridge's absence as the one gap tile, not a caption", () => {
    const { container } = lead(cp1bEntry());
    const gap = screen.getByRole("region", { name: "Variance bridge" });
    expect(hasVarianceRegister(cp1bEntry())).toBe(true);
    expect(
      within(gap).getByText(
        "The variance register is available in Statements and records; this module does not state a charted step bridge.",
      ),
    ).toBeVisible();
    expect(within(gap).queryByText(/could not read/)).toBeNull();
    expect(within(gap).queryByRole("img")).toBeNull();
    expect(container.querySelector("section.gap-hatch")).toBeNull();
    expect(
      within(screen.getByRole("region", { name: RESULTS_NAME })).queryByText(/No variance bridge/),
    ).toBeNull();
  });
  it("stacks the margins under the results when they are much shorter: no hole beside the results", () => {
    lead(cp1bEntry());
    const results = screen.getByRole("region", { name: RESULTS_NAME });
    const margins = screen.getByRole("region", { name: "Margins and KPIs" });
    expect(results.className).toContain("lg:col-span-12");
    expect(margins.className).toContain("lg:col-span-12");
    expect(margins.parentElement?.className).not.toContain("self-start");
  });
  it("draws the results and the margins side by side, 8 and 4, when they are about as tall", () => {
    lead(
      delta(
        results([
          ["Revenue", "FY2023", "6,585", "FY2024", "7,940", "US$m", "x"],
          ["Costs", "FY2023", "5,000", "FY2024", "6,000", "US$m", "x"],
          ["Net income", "FY2023", "1,299", "FY2024", "1,715", "US$m", "x"],
        ]),
        kpis([
          ["Gross margin", "FY2023", "58.3", "FY2024", "58.8", "%", "x"],
          ["EBITDA margin", "FY2023", "47.8", "FY2024", "48.0", "%", "x"],
          ["Net margin", "FY2023", "19.7", "FY2024", "21.6", "%", "x"],
        ]),
      ),
    );
    // Side by side only from xl (1280): at 1024 the 4-column margins tile is 177 px wide, too
    // narrow for a pair's two figures, so there each tile takes the full row.
    const resultsColumn = screen.getByRole("region", { name: RESULTS_NAME }).parentElement;
    const marginsColumn = screen.getByRole("region", { name: "Margins and KPIs" }).parentElement;
    expect(resultsColumn?.className).toContain("lg:col-span-12");
    expect(resultsColumn?.className).toContain("xl:col-span-8");
    expect(marginsColumn?.className).toContain("lg:col-span-12");
    expect(marginsColumn?.className).toContain("xl:col-span-4");
    expect(marginsColumn?.className).not.toContain("lg:col-span-4");
  });
  it("gives the results the full width when the margins are a gap, and the margins when the results are", () => {
    lead(entry("CP-1B", [], [results(MONEY)]));
    expect(screen.getByRole("region", { name: RESULTS_NAME }).className).toContain(
      "lg:col-span-12",
    );
    cleanup();
    lead(
      entry("CP-1B", [], [kpis([["Gross margin", "FY2023", "58.3", "FY2024", "58.8", "%", "x"]])]),
    );
    expect(screen.getByRole("region", { name: "Margins and KPIs" }).className).toContain(
      "lg:col-span-12",
    );
  });
  it("draws the 17 pairs as two small multiples, each on its own scale, in the handoff's order", () => {
    const { container } = lead(cp1bEntry());
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    const drawings = within(tile).getAllByRole("img");
    expect(drawings).toHaveLength(2);
    // Each group states its own scale in its head.
    expect(drawings.map((one) => textOf(one as unknown as Element, "caption").join(""))).toEqual([
      "$m, axis \u22122,000 to 8,000",
      "$m, axis \u2212500 to 1,000",
    ]);
    expect(
      drawings.map((one) =>
        [...one.querySelectorAll("g[data-row]")].map((row) => row.getAttribute("data-row")),
      ),
    ).toEqual([THOUSANDS, HUNDREDS]);
    // Within a group equal changes are equal widths: 1355 up, 1356 down, 665 up.
    const revenue = spanOf(rowMark(container, "Revenue"));
    const cash = spanOf(rowMark(container, "Discretionary cash flow"));
    const ebitda = spanOf(rowMark(container, "Reported EBITDA"));
    expect(revenue / ebitda).toBeCloseTo(1355 / 665, 2);
    expect(cash / revenue).toBeCloseTo(-1356 / 1355, 2);
    // The plot has at least half the drawing's width.
    for (const drawing of drawings) {
      const plot = [...drawing.querySelectorAll("[data-prior],[data-current]")].map((one) =>
        cx(one),
      );
      const width = Number(drawing.getAttribute("viewBox")?.split(" ")[2]);
      expect(Math.max(...plot) - Math.min(...plot)).toBeGreaterThan(0);
      expect(Math.max(...plot)).toBeLessThanOrEqual(width);
    }
  });
  it("sets a ring and a dot that coincide apart, so both are seen", () => {
    const { container } = lead(cp1bEntry());
    // 139 to 161 on a scale to 1,000 is closer than the marks are wide.
    expect(
      rowMark(container, "Intangible amortization").querySelector("[data-offset]"),
    ).not.toBeNull();
  });
  it("writes the two split rows as one compact line, the module's reason once on a chip", () => {
    const { container } = lead(cp1bEntry());
    const line = container.querySelector('[data-gap-line="Maintenance capex; Growth capex"]');
    expect(line).not.toBeNull();
    expect(line?.textContent).toBe("Maintenance capex; Growth capexNot supplied: no split");
    expect(line?.querySelectorAll("[data-gap]")).toHaveLength(1);
    // Not drawn in the dumbbell, not drawn twice.
    expect(container.querySelector('g[data-row="Maintenance capex"]')).toBeNull();
    expect(
      screen.getByRole("list", { name: "Not stated" }).textContent.match(/Not supplied: no split/g),
    ).toHaveLength(1);
  });
  it("sets prior as a ring and current as a dot at their values", () => {
    const { container } = lead(cp1bEntry());
    const revenue = rowMark(container, "Revenue");
    expect(revenue.querySelector("[data-prior]")?.getAttribute("data-prior")).toBe("6585");
    expect(revenue.querySelector("[data-current]")?.getAttribute("data-current")).toBe("7940");
    // Linear in the amount: the same scale puts 0 left of both.
    const zero = cx(rowMark(container, "Net income").querySelector("[data-prior]"));
    const [a, b, c] = [
      cx(revenue.querySelector("[data-prior]")),
      cx(revenue.querySelector("[data-current]")),
      zero,
    ];
    expect((b - a) / 1355).toBeCloseTo((a - c) / (6585 - 1299), 4);
  });
  it("writes each change as the handoff states it beside its mark, with direction, and better or worse only where known", () => {
    const { container } = lead(cp1bEntry());
    const revenue = rowMark(container, "Revenue");
    expect(textOf(revenue, "change")[0]).toContain("+1,355");
    expect(revenue.textContent).toMatch(/up, better/);
    // The change slot sits right of the marks, in the same row.
    const change = revenue.querySelector('[data-part="change"]');
    expect(Number(change?.getAttribute("x"))).toBeGreaterThan(
      cx(revenue.querySelector("[data-current]")),
    );
    const cash = rowMark(container, "Discretionary cash flow");
    expect(cash.textContent).toContain("−1,356");
    expect(cash.textContent).toMatch(/down/);
    expect(cash.textContent).not.toMatch(/better|worse/);
    expect(rowMark(container, "Gross profit").textContent).not.toMatch(/better|worse/);
    // A figure the module states as reported is printed as stated.
    expect(rowMark(container, "Intangible amortization").textContent).toContain("+22 reported");
    expect(container.textContent).not.toMatch(/derived/);
  });
  it("describes the drawing with every figure in its aria-label", () => {
    lead(cp1bEntry());
    const label = within(screen.getByRole("region", { name: RESULTS_NAME }))
      .getAllByRole("img")
      .map((one) => one.getAttribute("aria-label"))
      .join(" | ");
    expect(label).toContain("$m, FY2023 to FY2024:");
    expect(label).toContain("Revenue 6,585 in FY2023 and 7,940 in FY2024, +1,355, up, better");
    expect(label).toContain(
      "Discretionary cash flow 1,198 in FY2023 and −158 in FY2024, −1,356, down",
    );
  });
  it("carries every pair in the table view, in the handoff's order", () => {
    lead(cp1bEntry());
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    const rows = rowsOf(tile);
    expect(rows).toHaveLength(19);
    expect(rows.map((row) => row[0])).toEqual(WITH_GAPS);
    expect(rows.find((row) => row[0] === "Intangible amortization")).toEqual([
      "Intangible amortization",
      "$m",
      "FY2023",
      "139",
      "FY2024",
      "161",
      "+22 reported",
    ]);
    expect(rows.find((row) => row[0] === "Maintenance capex")?.[3]).toBe("Not supplied: no split");
  });
  it("draws the margins on a percent scale of their own, cut where they sit and said so, with the stated change", () => {
    const { container } = lead(cp1bEntry());
    const tile = screen.getByRole("region", { name: "Margins and KPIs" });
    const gross = rowMark(container, "Gross margin");
    expect(gross.textContent).toContain("58.3%");
    expect(gross.textContent).toContain("58.8%");
    expect(gross.textContent.replace(/\s/g, "")).toContain("+0.5percentagepoints");
    expect(tile.textContent).toMatch(/Axis starts at 40, not at zero/);
    expect(within(tile).getByRole("img").getAttribute("aria-label")).toContain(
      "Gross margin 58.3% in FY2023 and 58.8% in FY2024, +0.5 percentage points, up",
    );
    expect(tile.textContent).not.toMatch(/derived/);
  });
  it("has one trace control per figure and no source reference on the page", () => {
    const { container } = lead(cp1bEntry());
    expect(screen.getAllByRole("link", { name: /Source for/ })).toHaveLength(2);
    expect(container.textContent).not.toMatch(/TDG_|jsonl|T4\.\d|page 4|D01|D14|CP-/);
  });
  it("says the unit is not stated, in the gap tile, and still draws the margins", () => {
    lead(
      withEdit((source) => {
        for (const one of source.sections)
          one.blocks = one.blocks.filter((block) => block.type !== "text");
      }),
    );
    const gap = screen.getByRole("region", { name: RESULTS_NAME });
    expect(
      within(gap).getByText(/This page could not read the unit of the earnings table\./),
    ).toBeVisible();
    expect(within(gap).queryByRole("img")).toBeNull();
    expect(
      within(screen.getByRole("region", { name: "Margins and KPIs" })).getByRole("img"),
    ).toBeInTheDocument();
  });
  it("draws nothing for a blocked or unreadable module: the frame states it", () => {
    const source = cp1bEntry();
    const props = leadProps({ ...source, output: { ...source.output, parseError: "unreadable" } });
    const { container } = render(<EarningsDeltaLead {...props} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("lists the figures it draws itself, so the frame does not draw them again", () => {
    expect(EarningsDeltaLead.draws).toEqual(["figures"]);
  });
});

describe("EarningsDeltaLead at the measured width", () => {
  it("draws at 1128 px with every SVG text at least 11 px, and no fixed-width box", () => {
    measuredAt(1128);
    const { container } = lead(cp1bEntry());
    const svgs = [...container.querySelectorAll("svg[role='img']")];
    expect(svgs.length).toBe(3);
    for (const svg of svgs) {
      expect(svg.getAttribute("viewBox")?.split(" ")[2]).toBe("1128");
      expect(svg.getAttribute("data-layout")).toBe("wide");
    }
    expect(smallest(container)).toBeGreaterThanOrEqual(11);
    // No figure sits in a scrolling or fixed-width box.
    for (const svg of svgs) expect(svg.closest(".overflow-x-auto, [class*='min-w-[']")).toBeNull();
  });
  it("draws at 390 px in the narrow layout: one measure per row, text at least 11 px", () => {
    measuredAt(390);
    const { container } = lead(cp1bEntry());
    const svgs = [...container.querySelectorAll("svg[role='img']")];
    for (const svg of svgs) {
      expect(svg.getAttribute("viewBox")?.split(" ")[2]).toBe("390");
      expect(svg.getAttribute("data-layout")).toBe("narrow");
    }
    expect(smallest(container)).toBeGreaterThanOrEqual(11);
    // The change figure is still drawn, in the row.
    expect(textOf(rowMark(container, "Revenue"), "change").join(" ")).toContain("+1,355");
    expect(container.innerHTML).not.toMatch(/Scroll sideways/);
  });
  it("draws the bridge at 390 px too", () => {
    measuredAt(390);
    const { container } = lead(delta(steps(BRIDGE_ROWS)));
    const svg = container.querySelector("svg[role='img']");
    expect(svg?.getAttribute("data-layout")).toBe("narrow");
    expect(smallest(container)).toBeGreaterThanOrEqual(11);
  });
});

describe("EarningsDeltaLead with an LTM period beside the two annual periods", () => {
  const ltm = earningsTable(
    ["Line Item", "FY2023", "FY2024", "LTM Dec-2024", "YoY Change (Abs)"],
    [
      ["Revenue", "6585", "7940", "8100", "1355"],
      ["Gross margin", "58.3%", "58.8%", "59.0%", "+0.5 percentage points"],
    ],
  );
  it("still draws the two annual periods, names the LTM as its own period, and keeps it in the table view", () => {
    const { container } = lead(delta(ltm));
    expect(rowMark(container, "Revenue").textContent).toContain("6,585");
    expect(rowMark(container, "Revenue").textContent).toContain("7,940");
    expect(rowMark(container, "Revenue").textContent).toContain("+1,355");
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    expect(
      within(tile).getByText(
        "Compared: FY2023 to FY2024. Also stated, in the table view only: LTM Dec-2024.",
      ),
    ).toBeVisible();
    const rows = rowsOf(tile);
    const head = [...tile.querySelectorAll("table thead th")].map((cell) => cell.textContent);
    expect(head.at(-1)).toBe("LTM Dec-2024");
    expect(rows[0]?.at(-1)).toBe("8100");
    expect(container.textContent).not.toMatch(/states no .* chart data for two periods/);
  });
});

describe("EarningsDeltaLead on chart tables", () => {
  it("draws each unit as its own drawing on its own scale and labels a change the page made", () => {
    const { container } = lead(
      delta(
        results([
          ...MONEY,
          ["Interest coverage", "FY2023", "2.71", "FY2024", "3.29", "x", "Cash."],
        ]),
      ),
    );
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    expect(within(tile).getAllByRole("img")).toHaveLength(3);
    const coverage = rowMark(container, "Interest coverage");
    expect(coverage.textContent).toContain("2.71x");
    expect(coverage.textContent).toContain("+0.58x");
    expect(coverage.textContent).toMatch(/up, better/);
    // The 3.29x current is not on the money scale: it would sit at the very start of a scale to 8000.
    const money = rowMark(container, "Revenue");
    expect(cx(coverage.querySelector("[data-current]"))).toBeGreaterThan(
      cx(money.querySelector("[data-prior]")) / 2,
    );
    expect(screen.getAllByText("x").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: RESULTS_NAME })).toBeVisible();
  });
  it("says worse for a rise in leverage, as CP-1 does", () => {
    const { container } = lead(
      delta(results([["Total debt / EBITDA", "FY2023", "6.27", "FY2024", "6.53", "x", "x"]])),
    );
    const row = rowMark(container, "Total debt / EBITDA");
    expect(row.textContent).toContain("+0.26x");
    expect(row.textContent).toMatch(/up, worse/);
    // The current dot is in the signal colour, with the word beside it.
    expect(row.querySelector("[data-current]")?.getAttribute("class")).toContain("warning-mark");
  });
  it("shows a flat pair as unchanged, with no direction word", () => {
    const { container } = lead(delta(results(MONEY)));
    const row = rowMark(container, "Flat measure");
    expect(row.textContent).toContain("unchanged");
    expect(row.textContent).not.toMatch(/up|down|better|worse/);
  });
  it("draws the pair with a missing side as the hatched gap with the handoff's reason, never a number", () => {
    const { container } = lead(delta(results(MONEY)));
    const row = rowMark(container, "Net income");
    expect(row.textContent).toContain("1,299");
    expect(textOf(row, "reason").join(" ")).toContain("FY2024: Not supplied: not yet reported");
    expect(row.querySelector("[data-current]")).toBeNull();
    expect(
      screen.getByText(/No charted variance bridge is included in this module\./),
    ).toBeVisible();
  });
  it("puts a stated zero at the axis start, not off the chart", () => {
    const { container } = lead(
      delta(results([["Revenue", "FY2023", "0", "FY2024", "250", "US$m", "x"]])),
    );
    const row = rowMark(container, "Revenue");
    expect(row.querySelector("[data-prior]")?.getAttribute("data-prior")).toBe("0");
    expect(row.textContent).toContain("0");
    expect(cx(row.querySelector("[data-prior]"))).toBeLessThan(
      cx(row.querySelector("[data-current]")),
    );
  });
  it("reads the states of the margin table: absent, with a gap, all gaps", () => {
    lead(delta(results(MONEY)));
    expect(screen.getByText(/This page could not read the margin and KPI changes\./)).toBeVisible();
    cleanup();
    lead(
      delta(
        kpis([
          [
            "Segment margin",
            "FY2023",
            "Not supplied: no split",
            "FY2024",
            "Not supplied: no split",
            "%",
            "x",
          ],
        ]),
      ),
    );
    const tile = screen.getByRole("region", { name: "Margins and KPIs" });
    expect(within(tile).getByText("This page could not read a figure for any pair.")).toBeVisible();
    expect(
      within(within(tile).getByRole("list", { name: "Not stated" })).getByText(
        "Not supplied: no split",
      ),
    ).toBeVisible();
    expect(within(tile).queryByRole("img")).toBeNull();
  });
  it("says a repeated table is repeated, in the gap tile", () => {
    lead(delta(results(MONEY), results(MONEY)));
    expect(
      within(screen.getByRole("region", { name: RESULTS_NAME })).getByText(
        new RegExp(TWICE_RESULTS.slice(0, 40)),
      ),
    ).toBeVisible();
  });
  it("shows the module's own basis notes, and drops one that names a source", () => {
    lead(
      delta(
        results([
          ["Revenue", "FY2023", "100", "FY2024", "120", "US$m", "Reported, unaudited."],
          ["Debt", "FY2023", "50", "FY2024", "60", "US$m", "From tdg-20240930.htm.jsonl, page 45."],
        ]),
      ),
    );
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    expect(within(tile).getByText("Reported, unaudited.")).toBeVisible();
    expect(within(tile).queryByText(/jsonl/)).toBeNull();
  });
  it("draws two figures of different kinds of period without a change, and says so", () => {
    const { container } = lead(
      delta(results([["Revenue", "FY2024", "7940", "LTM Dec-2024", "8100", "US$m", "x"]])),
    );
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    const row = rowMark(container, "Revenue");
    expect(row.textContent).toContain("7,940");
    expect(row.textContent).toContain("8,100");
    expect(textOf(row, "change")).toEqual([]);
    expect(within(tile).queryByText(/derived/)).toBeNull();
  });
});

const BRIDGE_ROWS = [
  ["Revenue FY2023", "100", "US$m", "Reported."],
  ["Organic growth", "20", "US$m", "Reported."],
  ["Disposal", "-10", "US$m", "Reported."],
  ["Revenue FY2024", "110", "US$m", "Reported."],
];

describe("EarningsDeltaLead with a variance bridge", () => {
  const GOOD = BRIDGE_ROWS;
  it("draws the waterfall first, plainly titled, each step a bar from the running total", () => {
    const { container } = lead(delta(steps(GOOD), results(MONEY)));
    const tile = screen.getByRole("region", { name: "Earnings bridge" });
    expect(within(tile).getByRole("heading", { name: "Earnings bridge" })).toBeVisible();
    expect(within(tile).getByText("Prior to current, $m")).toBeVisible();
    const bar = (label: string) =>
      container.querySelector(`rect[data-label="${label}"]`) as SVGRectElement;
    expect(bar("Organic growth").getAttribute("data-from")).toBe("100");
    expect(bar("Organic growth").getAttribute("data-to")).toBe("120");
    expect(bar("Disposal").getAttribute("data-from")).toBe("120");
    expect(bar("Disposal").getAttribute("data-to")).toBe("110");
    const span = Number(bar("Organic growth").getAttribute("width"));
    expect(Number(bar("Disposal").getAttribute("width")) / span).toBeCloseTo(10 / 20, 6);
    // The totals are drawn from a cut axis, which the figure says.
    expect(tile.querySelector("[data-axis-break]")).not.toBeNull();
    expect(within(tile).getByText(/Axis starts at 90, marked on the total bars/)).toBeVisible();
    expect(screen.queryByText(/No variance bridge/)).toBeNull();
  });
  it("names a negative step by its label as written, never as an add-back, and makes no running total", () => {
    const { container } = lead(delta(steps(GOOD)));
    const tile = screen.getByRole("region", { name: "Earnings bridge" });
    expect(textOf(tile, "label")).toContain("Disposal");
    expect(tile.textContent).toContain("−10");
    expect(tile).not.toHaveTextContent(/add-back|running total/i);
    expect(container.querySelector("svg[role='img']")?.getAttribute("aria-label")).not.toMatch(
      /add-back/i,
    );
  });
  it("carries the steps as the handoff states them in the table view, with no total made here", () => {
    lead(delta(steps(GOOD)));
    const tile = screen.getByRole("region", { name: "Earnings bridge" });
    const rows = rowsOf(tile);
    const head = [...tile.querySelectorAll("table thead th")].map((cell) => cell.textContent);
    expect(head).toEqual(["Step", "Role", "Amount ($m)"]);
    expect(rows[2]).toEqual(["Disposal", "Change", "−10"]);
  });
  it("does not draw a bridge that does not add up, and says so in the gap tile", () => {
    lead(
      delta(steps([...GOOD.slice(0, 3), ["Revenue FY2024", "116", "US$m", "x"]]), results(MONEY)),
    );
    const own = screen.getByRole("region", { name: "Earnings bridge, not drawn" });
    expect(
      within(own).getByText(
        /did not draw the variance bridge because its steps do not add up to its closing figure\./,
      ),
    ).toBeVisible();
    expect(within(own).queryByRole("img")).toBeNull();
    const movers = screen.getByRole("region", { name: RESULTS_NAME });
    expect(within(movers).queryByText(/add up/)).toBeNull();
    expect(within(movers).getAllByRole("img").length).toBeGreaterThan(0);
  });
  it("says a missing step is not supplied, never that the steps do not add up", () => {
    lead(
      delta(
        steps([
          GOOD[0] ?? [],
          ["Disposals", "Not supplied: not split", "US$m", "x"],
          GOOD[3] ?? [],
        ]),
        results(MONEY),
      ),
    );
    const own = screen.getByRole("region", { name: "Earnings bridge, not drawn" });
    expect(
      within(own).getByText(
        /This page could not draw the variance bridge because Disposals is not supplied \(not split\)\./,
      ),
    ).toBeVisible();
    expect(screen.queryByText(/add up/)).toBeNull();
  });
  it("draws each of two step tables as its own bridge, under its own title, with the exact stated steps", () => {
    lead(
      delta(
        steps(GOOD, "Chart data: EBITDA variance"),
        steps(
          [
            ["Sales 2023", "1000", "US$m", "Reported."],
            ["Price", "50", "US$m", "Reported."],
            ["Sales 2024", "1050", "US$m", "Reported."],
          ],
          "Chart data: revenue variance",
        ),
        results(MONEY),
      ),
    );
    const names = screen.getAllByRole("region").map((one) => one.getAttribute("aria-label"));
    expect(names.slice(0, 2)).toEqual(["EBITDA variance", "Revenue variance"]);
    for (const [name, labels] of [
      ["EBITDA variance", ["Revenue FY2023", "Organic growth", "Disposal", "Revenue FY2024"]],
      ["Revenue variance", ["Sales 2023", "Price", "Sales 2024"]],
    ] as const) {
      const tile = screen.getByRole("region", { name });
      expect(
        [...tile.querySelectorAll("rect[data-label]")].map((one) => one.getAttribute("data-label")),
      ).toEqual(labels);
    }
    expect(screen.queryByText(/more than one/)).toBeNull();
  });
  it("draws the readable bridge and still lists the rows of the one it could not draw", () => {
    lead(
      delta(
        steps(GOOD, "Chart data: EBITDA variance"),
        steps(
          [GOOD[0] ?? [], ["Disposals", "Not supplied: not split", "US$m", "x"], GOOD[3] ?? []],
          "Chart data: revenue variance",
        ),
        results(MONEY),
      ),
    );
    // One bridge, the gap saying why the other was not drawn, and the other's rows as stated.
    expect(
      screen.getByRole("region", { name: "EBITDA variance" }).querySelectorAll("rect[data-label]"),
    ).toHaveLength(4);
    expect(
      within(screen.getByRole("region", { name: "Revenue variance, not drawn" })).getByText(
        /Disposals is not supplied \(not split\)/,
      ),
    ).toBeVisible();
    const listed = screen.getByRole("region", { name: "Revenue variance" });
    expect(within(listed).getAllByText("Revenue FY2023").length).toBeGreaterThan(0);
    expect(within(listed).getAllByText("Disposals").length).toBeGreaterThan(0);
    // The rows reach the reader with the module\u2019s reason on the gap chip.
    expect(within(listed).getByText("not split")).toBeVisible();
  });
  // Every chart title an entry's `Chart data:` headings state, and the region that carries it: the lead
  // draws it under that plain title (or, for the two pair tables, under the name the lead gives
  // them), or UnreadFigures lists its rows under the exact title. Titles and names are hand-typed.
  const unreadable = (heading: string) =>
    steps(
      [GOOD[0] ?? [], ["Disposals", "Not supplied: not split", "US$m", "x"], GOOD[3] ?? []],
      heading,
    );
  const TWO_BRIDGES = () =>
    delta(
      steps(GOOD, "Chart data: EBITDA variance"),
      unreadable("Chart data: revenue variance"),
      results(MONEY),
      kpis([["Gross margin", "FY2023", "58.3", "FY2024", "58.8", "%", "x"]]),
    );
  const ADD_BACK = () =>
    delta(
      results(MONEY),
      section(
        "Chart data: add-back share",
        60,
        table(
          62,
          ["Add-back", "Share", "Reporting unit", "Basis and limitation"],
          [["Stock compensation", "5.1", "%", "x"]],
        ),
      ),
    );
  it.each([
    // Headings: "Chart data: EBITDA variance", "...revenue variance", "...prior and current results",
    // "...margin and KPI changes".
    ["two step tables", TWO_BRIDGES, "EBITDA variance", "EBITDA variance"],
    ["two step tables", TWO_BRIDGES, "Revenue variance", "Revenue variance"],
    ["two step tables", TWO_BRIDGES, "Prior and current results", "Prior and current results"],
    ["two step tables", TWO_BRIDGES, "Margin and KPI changes", "Margins and KPIs"],
    // Headings: "Chart data: prior and current results", "Chart data: add-back share".
    ["add-back share", ADD_BACK, "Prior and current results", "Prior and current results"],
    ["add-back share", ADD_BACK, "Add-back share", "Add-back share"],
  ])("%s: the chart titled %s is a region named %s", (_name, build, title, region) => {
    lead(build());
    const tile = screen.getByRole("region", { name: region });
    expect(tile, title).toBeInTheDocument();
  });
  it("the retained CP-1B handoff states no chart table; its regions are the three the lead names", () => {
    // The retained sections are Findings, T4.4 Financial performance, T4.6 Variance register, Gaps.
    expect(cp1bEntry().sections.map((one) => one.heading)).toEqual([
      "Findings",
      "T4.4 Financial performance",
      "T4.6 Variance register",
      "Gaps",
    ]);
    lead(cp1bEntry());
    expect(screen.getAllByRole("region").map((one) => one.getAttribute("aria-label"))).toEqual([
      "Variance bridge",
      "Prior and current results",
      "Margins and KPIs",
    ]);
  });
});

describe("rows with no stated unit and screened text", () => {
  const NO_UNIT_ROWS = [
    ["Revenue", "FY2023", "100", "FY2024", "150", "", "x"],
    ["Customers", "FY2023", "100000", "FY2024", "100050", "", "x"],
  ];
  it("never puts two rows with no stated unit on one scale", () => {
    const { movers } = earningsDelta(delta(results(NO_UNIT_ROWS)));
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(movers.groups).toHaveLength(2);
    expect(movers.groups.map((one) => one.unitNotStated)).toEqual([true, true]);
    expect(movers.groups.map((one) => one.rows.map((pair) => pair.label))).toEqual([
      ["Revenue"],
      ["Customers"],
    ]);
  });
  it("keeps a stated unit's rows together beside rows with none", () => {
    const { movers } = earningsDelta(delta(results([...MONEY.slice(0, 2), ...NO_UNIT_ROWS])));
    if (movers.kind !== "ready") throw new Error("expected movers");
    expect(movers.groups.map((one) => [one.unit, one.rows.length])).toEqual([
      ["$m", 2],
      ["", 1],
      ["", 1],
    ]);
  });
  it("draws each such row in its own drawing, captioned", () => {
    lead(delta(results(NO_UNIT_ROWS)));
    expect(screen.getAllByText(/^unit not read, axis /)).toHaveLength(2);
    expect(
      within(screen.getByRole("region", { name: RESULTS_NAME })).getAllByRole("img"),
    ).toHaveLength(2);
  });
  it("screens words in a pair cell and drops a basis note that names a register", () => {
    const { container } = lead(
      delta(
        results([
          [
            "Revenue",
            "FY2023",
            "see register T4.4",
            "FY2024",
            "10",
            "US$m",
            "Calculation C07; register T4.4 row D14.",
          ],
          [
            "Debt",
            "FY2023",
            "50",
            "FY2024",
            "60",
            "US$m",
            "Calculation C07; register T4.4 row D14.",
          ],
        ]),
      ),
    );
    expect(container.textContent).not.toMatch(/T4\.4|C07|D14/);
    const tile = screen.getByRole("region", { name: RESULTS_NAME });
    expect(rowsOf(tile).find((row) => row[0] === "Revenue")?.[3]).toBe("Detail is in Evidence.");
    // The note is not drawn at all, not repeated as a sentence of its own.
    const notes = [...tile.querySelectorAll("ul li")].map((item) => item.textContent);
    expect(notes).toEqual([]);
  });
  it("titles every tile plainly, however the two largest moves compare", () => {
    lead(
      delta(
        results([
          ["Revenue", "FY2023", "100", "FY2024", "150", "US$m", "x"],
          ["Net debt", "FY2023", "200", "FY2024", "250", "US$m", "x"],
        ]),
      ),
    );
    expect(screen.getByRole("heading", { name: RESULTS_NAME })).toBeVisible();
    expect(screen.queryByText(/tied|moved most/)).toBeNull();
  });
});

describe("merged gap lines", () => {
  const same = "Not supplied: not split";
  const gapRows = (rows: string[][]) =>
    // Measure | Prior period | Prior | Current period | Current | Reporting unit | Basis
    rows.map(([label, priorPeriod, prior, currentPeriod, current, unit, basis]) => [
      label ?? "",
      priorPeriod ?? "",
      prior ?? "",
      currentPeriod ?? "",
      current ?? "",
      unit ?? "",
      basis ?? "",
    ]);
  it("joins the labels of one line with '; ' and shows the shared reason on one chip", () => {
    const { container } = lead(
      delta(
        results(
          gapRows([
            ["Cash interest paid, net", "FY2023", same, "FY2024", same, "US$m", "x"],
            ["Capex", "FY2023", same, "FY2024", same, "US$m", "x"],
            ["Leases", "FY2023", same, "FY2024", same, "US$m", "x"],
          ]),
        ),
      ),
    );
    const line = container.querySelector(
      '[data-gap-line="Cash interest paid, net; Capex; Leases"]',
    );
    expect(line).not.toBeNull();
    expect(line?.querySelectorAll("[data-gap]")).toHaveLength(1);
    expect(line?.textContent).toBe("Cash interest paid, net; Capex; LeasesNot supplied: not split");
  });
  it("keeps a row of another unit or another kind of period on its own line", () => {
    const { container } = lead(
      delta(
        results(
          gapRows([
            ["Capex", "FY2023", same, "FY2024", same, "US$m", "x"],
            ["Leases", "Q1 2024", same, "Q1 2025", same, "EURm", "x"],
            ["Tax", "FY2023", same, "FY2024", same, "US$m", "x"],
          ]),
        ),
      ),
    );
    expect(
      [...container.querySelectorAll("[data-gap-line]")].map((one) =>
        one.getAttribute("data-gap-line"),
      ),
    ).toEqual(["Capex; Tax", "Leases"]);
    // The same unit but another kind of period is not merged either.
    cleanup();
    const other = lead(
      delta(
        results(
          gapRows([
            ["Capex", "FY2023", same, "FY2024", same, "US$m", "x"],
            ["Leases", "Q1 2024", same, "Q1 2025", same, "US$m", "x"],
          ]),
        ),
      ),
    );
    expect(other.container.querySelectorAll("[data-gap-line]")).toHaveLength(2);
  });
});

describe("EarningsDeltaLead gaps", () => {
  it("draws ONE gap tile for a handoff with no table at all", () => {
    const { container } = lead(entry("CP-1B", [], []));
    expect(screen.getByText(/This page could not read the earnings figures\./)).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("section.gap-hatch")).toBeNull();
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(container.textContent).not.toMatch(/handoff|the module/i);
  });
  it("puts the bridge's gap tile before the results, and says no gap sentence 'from the handoff'", () => {
    const { container } = lead(cp1bEntry());
    const names = screen.getAllByRole("region").map((one) => one.getAttribute("aria-label"));
    expect(names).toEqual(["Variance bridge", RESULTS_NAME, "Margins and KPIs"]);
    expect(container.textContent).not.toMatch(/from the handoff|in this handoff/i);
  });
  it("draws a chart table it does not draw itself as stated, so no published figure is lost", () => {
    lead(
      delta(
        results(MONEY),
        section(
          "Chart data: add-back share",
          60,
          table(
            62,
            ["Add-back", "Share", "Reporting unit", "Basis and limitation"],
            [["Stock compensation", "5.1", "%", "x"]],
          ),
        ),
      ),
    );
    const tile = screen.getByRole("region", { name: "Add-back share" });
    expect(within(tile).getAllByText("Stock compensation").length).toBeGreaterThan(0);
  });
  it("says fewer than two annual periods in words, not that the table is missing", () => {
    lead(delta(earningsTable(["Line Item", "FY2024"], [["Revenue", "7940"]])));
    expect(screen.getAllByText(new RegExp(FEW_PERIODS.slice(0, 40)))).toHaveLength(2);
    expect(
      screen.queryByText(/This page could not read the table of prior and current results/),
    ).toBeNull();
  });
  it("says more than one earnings table in words", () => {
    const one = earningsTable(["Line Item", "FY2023", "FY2024"], [["Revenue", "6585", "7940"]]);
    lead(delta(one, structuredClone(one)));
    expect(screen.getAllByText(new RegExp(TWICE_EARNINGS.slice(0, 40)))).toHaveLength(2);
  });
});

describe("a stated change written in basis points", () => {
  // Synthetic handoff (the S9a probe's shape): the module states +50 bps and 100 basis points.
  const bps = earningsTable(
    ["Line Item", "FY2023", "FY2024", "YoY Change (Abs)"],
    [
      ["Gross margin", "58.3%", "58.8%", "+50 bps"],
      ["EBITDA margin", "51.6%", "52.6%", "100 basis points"],
      ["Net margin", "19.7%", "20.2%", "+0.5 percentage points"],
    ],
  );
  it("draws the change as the module wrote it, without the row's percentage-point unit", () => {
    const { kpis: figure } = earningsDelta(delta(bps));
    expect(figure.kind).toBe("ready");
    if (figure.kind !== "ready") throw new Error("expected kpis");
    const pairs = figure.groups.flatMap((one) => one.drawn);
    expect(pairs.map((pair) => [pair.label, pair.change?.text, pair.change?.basis])).toEqual([
      ["Gross margin", "+50 bps", "stated"],
      ["EBITDA margin", "+100 basis points", "stated"],
      ["Net margin", "+0.5 percentage points", "stated"],
    ]);
  });
  it("renders each stated change as the handoff cell reads (fidelity check)", () => {
    const { container } = lead(delta(bps));
    const drawn = (label: string) =>
      textOf(rowMark(container, label), "change").join(" ").replace(/\s+/g, " ").trim();
    expect(drawn("Gross margin")).toContain("+50 bps");
    expect(drawn("EBITDA margin")).toContain("+100 basis points");
    expect(drawn("Net margin")).toContain("+0.5 percentage points");
    expect(container.textContent).not.toMatch(/percentage points\s+(?:bps|basis points)/);
  });
});
