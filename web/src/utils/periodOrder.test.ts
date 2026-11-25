import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { comparePeriodKeys, orderPeriods, parsePeriod, periodKey } from "./periodOrder";

// The hand-written table shared with tests/test_period_order.py. Expected values come from it
// or from literals here, never from periodOrder.ts.
type LabelCase = {
  label: string;
  class: string;
  end: [number, number, number] | null;
  span: string | null;
};
type OrderCase = { name: string; input: string[]; ordered: string[]; gaps: string[] };

const cases = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "../../../tests/fixtures/period-order-cases.json"),
    "utf8",
  ),
) as { labels: LabelCase[]; unparseable: string[]; orders: OrderCase[] };

const self = (label: string) => label;

it("reads every kind of case from the shared table", () => {
  expect(cases.labels).toHaveLength(82);
  expect(cases.unparseable).toHaveLength(52);
  expect(cases.orders).toHaveLength(12);
});

describe("parsePeriod", () => {
  it.each(cases.labels)("reads $label as its class, end and span", (c) => {
    const parsed = parsePeriod(c.label);
    expect(parsed).not.toBeNull();
    expect(parsed?.periodClass).toBe(c.class);
    expect(parsed?.end).toEqual(c.end);
    expect(parsed?.span).toBe(c.span);
    expect(periodKey(c.label)).not.toBeNull();
  });

  it.each(cases.unparseable.map((label) => ({ label })))(
    "finds no period in '$label'",
    ({ label }) => {
      expect(parsePeriod(label)).toBeNull();
      expect(periodKey(label)).toBeNull();
    },
  );

  const read = (label: string) => {
    const parsed = parsePeriod(label);
    return parsed && [parsed.periodClass, parsed.end, parsed.span];
  };

  it("reads at most one year in a label", () => {
    expect(read("FY2024 FY2025")).toBeNull();
    expect(read("FY24 FY25")).toBeNull();
    expect(read("2024 2025E")).toBeNull();
  });

  it("reads a four-digit year between 1900 and 2199 only", () => {
    expect(read("1899")).toBeNull();
    expect(read("FY2200")).toBeNull();
    expect(read("1900")).toEqual(["actual", [1900, 12, 31], "year"]);
    expect(read("FY2199")).toEqual(["actual", [2199, 12, 31], "year"]);
  });

  it("turns the century of a two-digit year at seventy", () => {
    expect(read("FY69")).toEqual(["actual", [2069, 12, 31], "year"]);
    expect(read("FY70")).toEqual(["actual", [1970, 12, 31], "year"]);
    expect(read("FY00")).toEqual(["actual", [2000, 12, 31], "year"]);
  });

  it("reads a letter after the year as a suffix only when it stands alone", () => {
    expect(read("2024 EBITDA")).toBeNull();
    expect(read("2024 Flow")).toBeNull();
    expect(read("2024EA")).toBeNull();
    expect(read("2024 A")).toEqual(["actual", [2024, 12, 31], "year"]);
    expect(read("2024 F")).toEqual(["forecast", [2024, 12, 31], "year"]);
    expect(read("26E")).toEqual(["forecast", [2026, 12, 31], "year"]);
    expect(read("26A")).toBeNull();
  });

  it("reads a fiscal prefix standing apart from its year with it", () => {
    expect(read("FY ended 31 Dec 2024")).toEqual(["actual", [2024, 12, 31], "month"]);
    expect(read("FY Q3 24")).toEqual(["actual", [2024, 9, 31], "quarter"]);
    expect(read("FY")).toBeNull();
    expect(read("LTM FY")).toBeNull();
  });

  it("finds a label with a character the rule does not know unparseable", () => {
    expect(read("FY2024*")).toBeNull();
    expect(read("FY2024 %")).toBeNull();
    expect(read("FY2024 | Q4 — reported")).toEqual(["actual", [2024, 12, 31], "quarter"]);
  });

  it("remembers a prior year-to-date label", () => {
    expect(parsePeriod("PYTD")).toEqual({
      periodClass: "ytd",
      end: null,
      span: null,
      priorYtd: true,
    });
    expect(parsePeriod("FY2024")).toEqual({
      periodClass: "actual",
      end: [2024, 12, 31],
      span: "year",
      priorYtd: false,
    });
  });
});

describe("orderPeriods", () => {
  it.each(cases.orders)("$name", (c) => {
    const { ordered, gaps } = orderPeriods(c.input, self);
    expect(ordered).toEqual(c.ordered);
    expect(gaps).toEqual(c.gaps);
  });

  it("puts LTM and PF after fiscal years, oldest first", () => {
    const labels = [
      "PF FY2023",
      "LTM Jun 2024",
      "FY2025",
      "PF",
      "LTM Dec 2023",
      "FY2023",
      "FY2024",
    ];
    expect(orderPeriods(labels, self)).toEqual({
      ordered: ["FY2023", "FY2024", "FY2025", "LTM Dec 2023", "LTM Jun 2024", "PF FY2023", "PF"],
      gaps: [],
    });
  });

  it("puts a dated PYTD before a dated YTD on the same end", () => {
    expect(orderPeriods(["YTD Sep 2025", "PYTD Sep 2025"], self).ordered).toEqual([
      "PYTD Sep 2025",
      "YTD Sep 2025",
    ]);
  });

  it("orders items by the label the caller reads from them", () => {
    const rows = [
      { period: "LTM", v: 1 },
      { period: "?", v: 2 },
      { period: "FY2024", v: 3 },
    ];
    const { ordered, gaps } = orderPeriods(rows, (row) => row.period);
    expect(ordered.map((row) => row.v)).toEqual([3, 1, 2]);
    expect(gaps.map((row) => row.v)).toEqual([2]);
  });
});

describe("comparePeriodKeys", () => {
  const key = (label: string) => {
    const found = periodKey(label);
    if (found === null) throw new Error(`no key for ${label}`);
    return found;
  };

  it("is negative, zero or positive as the first key sorts before, with or after the second", () => {
    expect(comparePeriodKeys(key("FY2023"), key("FY2024"))).toBeLessThan(0);
    expect(comparePeriodKeys(key("FY2025E"), key("LTM"))).toBeGreaterThan(0);
    expect(comparePeriodKeys(key("FY 2024"), key("FY2024"))).toBe(0);
    expect(comparePeriodKeys(key("Q4 2024"), key("FY2024"))).toBeLessThan(0);
  });
});
