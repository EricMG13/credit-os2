import { edited, fixtureSlice, must, readRuns } from "./test-fixture";
import type { ModelRun } from "./types";

const FORECAST = ["runs", 0, "forecast"] as const;

function fixtureRun(source: unknown): ModelRun {
  return must((source as { runs: ModelRun[] }).runs[0]);
}

function readRun(source: unknown): ModelRun {
  const result = readRuns(source);
  if (result.kind !== "ok")
    throw new Error(result.kind === "invalid" ? result.reason : result.kind);
  return must(result.data.runs[0]);
}

it("refuses swapped EBITDA legend names on the original case data", () => {
  const source = fixtureSlice();
  const { series } = must(fixtureRun(source).forecast).ebitda;
  const base = must(series[0]);
  const downside = must(series[1]);
  expect([base.values[6], downside.values[6]]).toEqual([5460, 4350]);
  [base.name, downside.name] = [downside.name, base.name];

  expect(readRuns(source)).toEqual({
    kind: "invalid",
    reason: 'runs[0].forecast.ebitda.series[0].name: expected a legend name for "Base case"',
  });
});

it("keeps the authored capitalization of the composite EBITDA legend", () => {
  const source = edited([...FORECAST, "ebitda", "series", 0, "name"], "Actual, then Base case");
  const { series } = must(readRun(source).forecast).ebitda;

  expect(series.map((line) => [line.name, line.values[6]])).toEqual([
    ["Actual, then Base case", 5460],
    ["Downside case", 4350],
  ]);
});

it("keeps an Analysis finding with a repeated title when it has no trace control", () => {
  const source = edited(["runs", 0, "analysis", "findings", 1, "trace"], null);
  const { findings } = fixtureRun(source).analysis;
  must(findings[1]).title = "Deleveraging depends on keeping the cash";

  expect(readRun(source).analysis.findings[1]).toMatchObject({
    number: "02",
    title: "Deleveraging depends on keeping the cash",
    trace: null,
  });
});

it("keeps a Portfolio Fit chart without a trace when it shares the ratings title", () => {
  const source = edited(["runs", 0, "portfolioFit", "strips", "trace"], null);
  fixtureRun(source).portfolioFit.strips.title = "Agency ratings";

  expect(readRun(source).portfolioFit.strips).toMatchObject({
    title: "Agency ratings",
    trace: null,
  });
});

it.each(["41", "5,080.0001", "5,080 estimated"])(
  "refuses a cash-flow table amount that disagrees with the chart step: %s",
  (amount) => {
    const source = edited([...FORECAST, "walk", "rows", 0, "cells", 0], amount);
    expect(must(fixtureRun(source).forecast).walk.caseSteps[0]?.[0]).toMatchObject({
      to: 5080,
      text: "5,080",
    });

    expect(readRuns(source)).toEqual({
      kind: "invalid",
      reason:
        "runs[0].forecast.walk.rows[0].cells[0]: expected the text of the corresponding chart step",
    });
  },
);

it("refuses a cash-flow decrease when its table cell omits the minus sign", () => {
  const source = edited([...FORECAST, "walk", "rows", 1, "cells", 0], "1,560");
  expect(readRuns(source)).toEqual({
    kind: "invalid",
    reason:
      "runs[0].forecast.walk.rows[1].cells[0]: expected the text of the corresponding chart step",
  });
});

function cashFlowIncrease(chart: string, table: string): unknown {
  const source = edited([...FORECAST, "walk", "rows", 3, "cells", 1], table);
  const { walk } = must(fixtureRun(source).forecast);
  const step = must(walk.caseSteps[1]?.[3]);
  if (step.kind !== "up") throw new Error("expected a cash-flow increase");
  step.text = chart;
  return source;
}

it.each(["$60", "CA$60.00", "CHF 60m", "60\u00a0EUR", "CHF\u00a060"])(
  "keeps a signed chart increase and its exact unsigned table amount (%s)",
  (amount) => {
    const { walk } = must(readRun(cashFlowIncrease(`+${amount}`, amount)).forecast);
    expect(walk.caseSteps[1]?.[3]).toMatchObject({ from: 1900, to: 1960, text: `+${amount}` });
    expect(walk.rows[3]?.cells[1]).toBe(amount);
  },
);

it.each([
  ["+$60", "€60"],
  ["+$60", "$60.01"],
  ["+$60", "$60 estimated"],
  ["++$60", "+$60"],
  ["+-$60", "-$60"],
  ["+$-60", "$-60"],
  ["+60−\u00a0EUR", "60−\u00a0EUR"],
  ["+($60)", "($60)"],
  ["+CHF\u00a0(60)", "CHF\u00a0(60)"],
  ["+CHF\u00a060", "CHF 60"],
])("refuses the chart increase %s paired with the table cell %s", (chart, table) => {
  expect(readRuns(cashFlowIncrease(chart, table))).toEqual({
    kind: "invalid",
    reason:
      "runs[0].forecast.walk.rows[3].cells[1]: expected the text of the corresponding chart step",
  });
});

it("preserves exact forecast amounts, authored labels, signed increases, and missing cells", () => {
  const { ebitda, walk } = must(readRun(fixtureSlice()).forecast);
  expect(ebitda.series.map((line) => [line.name, line.values[6]])).toEqual([
    ["Actual, then base case", 5460],
    ["Downside case", 4350],
  ]);
  expect(walk.caseSteps[0]?.[0]).toMatchObject({ label: "EBITDA", to: 5080, text: "5,080" });
  expect(walk.rows[0]).toMatchObject({ label: "EBITDA as defined", cells: ["5,080", "4,120"] });
  expect(walk.caseSteps[1]?.[3]).toMatchObject({ label: "Working capital", text: "+60" });
  expect(walk.rows[3]).toMatchObject({ label: "Change in working capital", cells: ["-170", "60"] });
  expect(walk.rows[5]?.cells).toEqual([null, null]);
});
