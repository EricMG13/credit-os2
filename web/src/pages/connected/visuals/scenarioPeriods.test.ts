import { expect, it } from "vitest";
import {
  analyzeScenarioPeriods,
  scenarioComparisonNotice,
  scenarioGroupLabels,
} from "./scenarioPeriods";

it("retains a unique scenario observation when another scenario duplicates that period", () => {
  const result = analyzeScenarioPeriods([
    { period: "FY2027E", group: "Base case", start: "2026-04-01", end: "2027-03-31" },
    { period: "FY2027E", group: "Downside case", start: "2026-04-01", end: "2027-03-31" },
    { period: "FY2027E", group: "Downside case", start: "2026-10-01", end: "2027-03-31" },
  ]);

  expect(result.periods).toEqual([]);
  expect(result.ambiguousPeriods).toEqual(["FY2027E"]);
  expect(result.uniqueObservations).toMatchObject([{ group: "Base case", period: "FY2027E" }]);
});

const DATES_LEFT_OUT =
  "recorded start and end dates do not match between cases, or are incomplete or invalid";
const NO_COMMON_PERIOD =
  "The cases publish no period in common, so no scenario comparison is drawn.";

it("keeps a period that only one of several cases publishes, and excludes nothing", () => {
  const result = analyzeScenarioPeriods([
    ...["FY2026E", "FY2027E", "FY2028E", "FY2029E", "FY2030E"].map((period) => ({
      period,
      group: "Base case",
    })),
    ...["FY2026E", "FY2027E", "FY2028E"].map((period) => ({ period, group: "Downside case" })),
  ]);

  expect(result.periods.map(({ period }) => period)).toEqual([
    "FY2026E",
    "FY2027E",
    "FY2028E",
    "FY2029E",
    "FY2030E",
  ]);
  expect(result.periods.map(({ groups }) => groups.length)).toEqual([2, 2, 2, 1, 1]);
  expect(result).toMatchObject({
    ambiguousPeriods: [],
    incompatiblePeriods: [],
    noSharedPeriod: false,
  });
  expect(scenarioComparisonNotice(result)).toBeNull();
});

it("excludes a single-case period whose own dates are invalid and names it", () => {
  const result = analyzeScenarioPeriods([
    { period: "FY2026E", group: "Base case", start: "2026-01-01", end: "2026-12-31" },
    { period: "FY2026E", group: "Downside case", start: "2026-01-01", end: "2026-12-31" },
    { period: "FY2027E", group: "Base case", start: "2027-13-01", end: "2027-12-31" },
    { period: "FY2028E", group: "Base case", start: "2028-01-01", end: "2028-12-31" },
  ]);

  expect(result.periods.map(({ period }) => period)).toEqual(["FY2026E", "FY2028E"]);
  expect(result.incompatiblePeriods).toEqual(["FY2027E"]);
  expect(result.noSharedPeriod).toBe(false);
  // A period is left out and another is shared: the notice does not say nothing is compared.
  expect(scenarioComparisonNotice(result)).toBe(
    `Periods left out of the scenario comparison: FY2027E (${DATES_LEFT_OUT}).`,
  );
});

it("reports an excluded period and no shared period as two facts", () => {
  const mismatch = analyzeScenarioPeriods([
    { period: "FY2026E", group: "Base case", start: "2026-01-01", end: "2026-12-31" },
    { period: "FY2026E", group: "Downside case", start: "2026-07-01", end: "2026-12-31" },
  ]);
  expect(mismatch.periods).toEqual([]);
  expect(mismatch.incompatiblePeriods).toEqual(["FY2026E"]);
  expect(mismatch.noSharedPeriod).toBe(true);
  expect(scenarioComparisonNotice(mismatch)).toBe(
    `Periods left out of the scenario comparison: FY2026E (${DATES_LEFT_OUT}). No other period is published by more than one case, so no scenario comparison is drawn.`,
  );

  const disjoint = analyzeScenarioPeriods([
    { period: "FY2026E", group: "Base case" },
    { period: "FY2027E", group: "Downside case" },
  ]);
  expect(disjoint.periods.map(({ period }) => period)).toEqual(["FY2026E", "FY2027E"]);
  expect(disjoint).toMatchObject({
    ambiguousPeriods: [],
    incompatiblePeriods: [],
    noSharedPeriod: true,
  });
  // Nothing was excluded, so the notice does not say a period is left out.
  expect(scenarioComparisonNotice(disjoint)).toBe(NO_COMMON_PERIOD);
});

it("gives each exclusion its own reason, and one case nothing to compare", () => {
  const both = analyzeScenarioPeriods([
    { period: "FY2026E", group: "Base case" },
    { period: "FY2026E", group: "Downside case" },
    { period: "FY2028E", group: "Base case", start: "2028-01-01", end: "2028-12-31" },
    { period: "FY2028E", group: "Downside case" },
    { period: "FY2027E", group: "Base case" },
    { period: "FY2027E", group: "Downside case" },
    { period: "FY2027E", group: "Downside case" },
  ]);
  expect(both.periods.map(({ period }) => period)).toEqual(["FY2026E"]);
  expect(scenarioComparisonNotice(both)).toBe(
    `Periods left out of the scenario comparison: FY2027E (published more than once by a case); FY2028E (${DATES_LEFT_OUT}).`,
  );

  const single = analyzeScenarioPeriods([
    { period: "FY2026E", group: "Base case" },
    { period: "FY2027E", group: "Base case" },
  ]);
  expect(single.periods).toEqual([]);
  expect(single.noSharedPeriod).toBe(false);
  expect(scenarioComparisonNotice(single)).toBeNull();
});

it("shows a group whose label is unique as that label, whatever it starts with", () => {
  // "CP" is also commercial paper: a label is never rewritten for starting that way.
  const groups = ["CP-backstop downside", "Downside (CP-funded)", "CP-10", "CP-4 Upside"];
  expect([...scenarioGroupLabels(groups, (group) => group)]).toEqual(
    groups.map((group) => [group, group]),
  );
});

it("tells colliding labels apart with the supplied reader suffix, never the raw group", () => {
  const names = scenarioGroupLabels(
    ["Base", "raw-1", "raw-2"],
    (group) => (group === "Base" ? "Base case" : "Stress"),
    (group) => (group === "raw-1" ? "first" : "second"),
  );
  expect([...names]).toEqual([
    ["Base", "Base case"],
    ["raw-1", "Stress · first"],
    ["raw-2", "Stress · second"],
  ]);
});

it("uses a worded ordinal, by raw-group order, where the suffix cannot tell a group apart", () => {
  const suffixes: Record<string, string> = {
    a: "", // empty
    b: "Stress", // only repeats the label
    c: "CP-9 drivers", // still holds a module code
    d: "drivers", // shared with e
    e: "drivers",
    f: "severe",
  };
  const name = (groups: string[]) =>
    Object.fromEntries(
      scenarioGroupLabels(
        groups,
        () => "Stress",
        (group) => suffixes[group] ?? "",
      ),
    );
  const expected = {
    a: "Stress · first case",
    b: "Stress · second case",
    c: "Stress · third case",
    d: "Stress · fourth case",
    e: "Stress · fifth case",
    f: "Stress · severe",
  };
  expect(name(["a", "b", "c", "d", "e", "f"])).toEqual(expected);
  // The place is the group's order among the raw groups, not the order they were given in.
  expect(name(["f", "d", "b", "e", "c", "a"])).toEqual(expected);
  for (const generated of Object.values(expected)) expect(generated).not.toMatch(/\d|CP-/);
});

it("adds no digit or module code for module-coded raw groups that share a label", () => {
  const names = scenarioGroupLabels(["CP-4 Upside", "CP-3 Upside"], () => "Upside case");
  expect(Object.fromEntries(names)).toEqual({
    "CP-3 Upside": "Upside case · first case",
    "CP-4 Upside": "Upside case · second case",
  });
});

it("never reuses a name another group already has", () => {
  const names = scenarioGroupLabels(
    ["x", "y", "Stress · second case", "Stress · tidy"],
    (group) => (group.length === 1 ? "Stress" : group),
    (group) => (group === "x" ? "tidy" : ""),
  );
  expect(Object.fromEntries(names)).toEqual({
    "Stress · second case": "Stress · second case",
    "Stress · tidy": "Stress · tidy",
    x: "Stress · first case",
    y: "Stress · third case",
  });
});

it("words every place, however many groups share a label", () => {
  const groups = Array.from(
    { length: 121 },
    (_, index) => `g${String(index + 1).padStart(3, "0")}`,
  );
  const names = scenarioGroupLabels(
    groups,
    () => "Stress",
    () => "",
  );
  expect(new Set(names.values()).size).toBe(121);
  for (const name of names.values()) expect(name).not.toMatch(/\d/);
  for (const [group, place] of [
    ["g012", "twelfth"],
    ["g020", "twentieth"],
    ["g021", "twenty-first"],
    ["g040", "fortieth"],
    ["g099", "ninety-ninth"],
    ["g100", "one hundredth"],
    ["g101", "one hundred and first"],
    ["g120", "one hundred and twentieth"],
  ] as const)
    expect(names.get(group)).toBe(`Stress · ${place} case`);
});
