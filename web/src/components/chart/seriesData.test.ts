import { describe, expect, it } from "vitest";
import { checkDistinctSeries, checkLabeledSeriesLength, periodSeriesData } from "./seriesData";

describe("shared series data", () => {
  it("keeps the order it is given, zeros and missing values without using names as keys", () => {
    const periods = ["FY2026", "FY2025", "FY2026"];
    const series = [
      { name: "__proto__", values: [0, null, -12.25] },
      { name: "period", values: [7] },
    ];
    expect(periodSeriesData(periods, series)).toEqual([
      { period: "FY2026", index: 0, s0: 0, s1: 7 },
      { period: "FY2025", index: 1, s0: null, s1: null },
      { period: "FY2026", index: 2, s0: -12.25, s1: null },
    ]);
    expect(periods).toEqual(["FY2026", "FY2025", "FY2026"]);
    expect(series[0]?.values).toEqual([0, null, -12.25]);
    expect(periodSeriesData([], series)).toEqual([]);
  });

  it("reports the first repeated name exactly without normalising distinct names", () => {
    expect(() => {
      checkDistinctSeries([{ name: "A" }, { name: "a" }, { name: " A" }]);
    }).not.toThrow();
    expect(() => {
      checkDistinctSeries([{ name: "B" }, { name: "A" }, { name: "A" }, { name: "B" }]);
    }).toThrow('series names must be distinct: "A" repeats');
  });

  it.each(["group", "period"] as const)("retains the exact %s shape error", (unit) => {
    const series = [{ name: "Debt", values: [0, null], labels: ["0"] }];
    expect(() => {
      checkLabeledSeriesLength(series, 2, unit);
    }).toThrow(`series "Debt" must have one value and one label per ${unit} (2 ${unit}s)`);
    expect(() => {
      checkLabeledSeriesLength([], 0, unit);
    }).not.toThrow();
  });
});
