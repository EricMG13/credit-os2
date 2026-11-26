/**
 * The web copy of a custom selection's rules and arithmetic. The answer key is
 * .superpowers/sdd/pr-7a-custom-routing/answer-key-caps.md (plain Decimal arithmetic on the layer-1
 * ruling's figures), copied below as literals; `customSelection.cases.json` is the launcher's own
 * completion and estimate for more selections, and `tests/test_custom_selection_web.py` holds both
 * the data and that file to the Python registry and `cpos_custom`.
 */
import { describe, expect, it } from "vitest";
import cases from "./customSelection.cases.json";
import { OFFERED, PRESETS, complete, estimate, usd, type CustomEffort } from "./customSelection";

/** The custom pathway's ceiling in the caps table the page loads (contracts.PATHWAY_CAP_USD). */
const CEILING = 50;

const CHOSEN: Record<string, string[]> = {
  governance: ["CP-1A", "CP-2E"],
  covenant: ["CP-4"],
  portfolio: ["CP-6"],
  full: [
    "CP-0",
    "CP-1",
    "CP-1A",
    "CP-1B",
    "CP-DR",
    "CP-1C",
    "CP-1D",
    "CP-2",
    "CP-4",
    "CP-2A",
    "CP-2E",
    "CP-2D",
    "CP-2G",
    "CP-3C",
    "CP-3",
    "CP-5",
    "CP-6",
  ],
  cpdr: ["CP-DR", "CP-4", "CP-1C"],
}; // fmt: skip

// selection, with CP-8, effort, per-module figures in planned order, sum, hold, cap
const KEY: [string, boolean, CustomEffort, string, string, string, number][] = [
  ["governance", false, "fast", "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2E 0.66", "1.92", "7.17", 10],
  [
    "governance",
    false,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2E 0.66",
    "2.03",
    "7.17",
    10,
  ],
  ["governance", false, "high", "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2E 0.80", "2.52", "7.17", 10],
  [
    "governance",
    true,
    "fast",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2E 0.66 CP-8 0.26",
    "2.18",
    "7.17",
    10,
  ],
  [
    "governance",
    true,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2E 0.66 CP-8 0.26",
    "2.29",
    "7.17",
    10,
  ],
  [
    "governance",
    true,
    "high",
    "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2E 0.80 CP-8 0.36",
    "2.88",
    "7.17",
    11,
  ],
  ["covenant", false, "fast", "CP-0 0.29 CP-1 0.42 CP-4 0.37", "1.08", "7.17", 9],
  ["covenant", false, "balanced", "CP-0 0.29 CP-1 0.42 CP-4 0.37", "1.08", "7.17", 9],
  ["covenant", false, "high", "CP-0 0.43 CP-1 0.63 CP-4 0.37", "1.43", "7.17", 9],
  ["covenant", true, "fast", "CP-0 0.29 CP-1 0.42 CP-4 0.37 CP-8 0.20", "1.28", "7.17", 9],
  ["covenant", true, "balanced", "CP-0 0.29 CP-1 0.42 CP-4 0.37 CP-8 0.20", "1.28", "7.17", 9],
  ["covenant", true, "high", "CP-0 0.43 CP-1 0.63 CP-4 0.37 CP-8 0.27", "1.70", "7.17", 9],
  [
    "portfolio",
    false,
    "fast",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2 0.44 CP-3 0.80 CP-5 1.13 CP-6 0.73",
    "4.36",
    "7.17",
    12,
  ],
  [
    "portfolio",
    false,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.13 CP-6 0.99",
    "5.07",
    "7.17",
    13,
  ],
  [
    "portfolio",
    false,
    "high",
    "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.40 CP-6 0.99",
    "5.69",
    "7.17",
    13,
  ],
  [
    "portfolio",
    true,
    "fast",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2 0.44 CP-3 0.80 CP-5 1.13 CP-6 0.73 CP-8 0.46",
    "4.82",
    "7.17",
    12,
  ],
  [
    "portfolio",
    true,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.13 CP-6 0.99 CP-8 0.46",
    "5.53",
    "7.17",
    13,
  ],
  [
    "portfolio",
    true,
    "high",
    "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.40 CP-6 0.99 CP-8 0.63",
    "6.32",
    "7.17",
    14,
  ],
  [
    "full",
    false,
    "fast",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35 CP-1D 0.53 CP-2 0.44 CP-4 0.37 CP-2A 0.62 CP-2E 0.66 CP-2D 0.51 CP-2G 0.41 CP-3C 0.51 CP-3 0.80 CP-5 3.39 CP-6 0.73",
    "11.38",
    "7.17",
    19,
  ],
  [
    "full",
    false,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35 CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.66 CP-2D 0.51 CP-2G 0.41 CP-3C 0.67 CP-3 0.97 CP-5 3.39 CP-6 0.99",
    "12.84",
    "7.17",
    21,
  ],
  [
    "full",
    false,
    "high",
    "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-1B 0.69 CP-DR 0.44 CP-1C 0.46 CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.80 CP-2D 0.67 CP-2G 0.77 CP-3C 0.67 CP-3 0.97 CP-5 4.20 CP-6 0.99",
    "15.10",
    "7.17",
    23,
  ],
  [
    "full",
    true,
    "fast",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35 CP-1D 0.53 CP-2 0.44 CP-4 0.37 CP-2A 0.62 CP-2E 0.66 CP-2D 0.51 CP-2G 0.41 CP-3C 0.51 CP-3 0.80 CP-5 3.39 CP-6 0.73 CP-8 1.12",
    "12.50",
    "7.17",
    20,
  ],
  [
    "full",
    true,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35 CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.66 CP-2D 0.51 CP-2G 0.41 CP-3C 0.67 CP-3 0.97 CP-5 3.39 CP-6 0.99 CP-8 1.12",
    "13.96",
    "7.17",
    22,
  ],
  [
    "full",
    true,
    "high",
    "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-1B 0.69 CP-DR 0.44 CP-1C 0.46 CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.80 CP-2D 0.67 CP-2G 0.77 CP-3C 0.67 CP-3 0.97 CP-5 4.20 CP-6 0.99 CP-8 1.53",
    "16.63",
    "7.17",
    24,
  ],
  ["cpdr", false, "fast", "CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35", "1.71", "7.17", 9],
  [
    "cpdr",
    false,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35",
    "1.71",
    "7.17",
    9,
  ],
  [
    "cpdr",
    false,
    "high",
    "CP-0 0.43 CP-1 0.63 CP-DR 0.44 CP-4 0.37 CP-1C 0.46",
    "2.33",
    "7.17",
    10,
  ],
  [
    "cpdr",
    true,
    "fast",
    "CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35 CP-8 0.33",
    "2.04",
    "7.17",
    10,
  ],
  [
    "cpdr",
    true,
    "balanced",
    "CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35 CP-8 0.33",
    "2.04",
    "7.17",
    10,
  ],
  [
    "cpdr",
    true,
    "high",
    "CP-0 0.43 CP-1 0.63 CP-DR 0.44 CP-4 0.37 CP-1C 0.46 CP-8 0.45",
    "2.78",
    "7.17",
    10,
  ],
];

const figures = (rows: readonly { module: string; cents: number }[]) =>
  rows.map((row) => `${row.module} ${(row.cents / 100).toFixed(2)}`).join(" ");

describe("the answer key's estimates and caps", () => {
  it.each(KEY)("%s, CP-8 %s, %s", (selection, compared, effort, per, total, hold, cap) => {
    const result = estimate(complete(CHOSEN[selection] ?? []), {
      compared,
      effort,
      ceiling: CEILING,
    });
    expect(figures(result.rows)).toBe(per);
    expect((result.sumCents / 100).toFixed(2)).toBe(total);
    expect((result.holdCents / 100).toFixed(2)).toBe(hold);
    expect(result.cap).toBe(cap);
  });
});

describe("the launcher's own completion and estimate", () => {
  it.each(cases)("", (item) => {
    const done = complete(item.chosen);
    expect(done.modules).toEqual(item.completed);
    expect(done.reasons).toEqual(item.reasons);
    expect([...done.modulesPageOnly].sort()).toEqual(item.page_only);
    for (const [at, expected] of Object.entries(item.estimates)) {
      const [effort = "", withEight = ""] = at.split("/");
      const result = estimate(done, {
        compared: withEight === "cp8",
        effort: effort as CustomEffort,
        ceiling: CEILING,
      });
      expect(figures(result.rows)).toBe(expected.per);
      expect((result.sumCents / 100).toFixed(2)).toBe(expected.total);
      expect(result.cap).toBe(expected.cap);
    }
  });
});

describe("the rules", () => {
  it("add CP-0 and CP-1 with the source reason, and a producer with the module it serves", () => {
    const done = complete(["CP-6"]);
    expect(done.modules).toEqual(["CP-0", "CP-1", "CP-1A", "CP-2", "CP-3", "CP-5", "CP-6"]);
    expect(done.reasons["CP-0"]).toBe(
      "Every run needs the source register and the financial base.",
    );
    expect(done.reasons["CP-5"]).toBe("Needed by Committee decision.");
    expect(done.reasons["CP-2"]).toBe("Needed by Security selection and Committee decision.");
    expect(done.reasons["CP-6"]).toBeUndefined();
  });

  it("never name a module that is not offered, and drop CP-MODEL and repeats", () => {
    const done = complete(["CP-MODEL", "CP-8", "CP-4", "CP-4", "CP-OS", "nonsense"]);
    expect(done.modules).toEqual(["CP-0", "CP-1", "CP-4"]);
  });

  it("flag the modules that own no report block as modules-page-only", () => {
    expect([...complete(["CP-5", "CP-DR"]).modulesPageOnly].sort()).toEqual([
      "CP-0",
      "CP-5",
      "CP-DR",
    ]);
  });

  it("offer the registry's modules less the five that cannot be chosen, and three presets", () => {
    expect(OFFERED).toHaveLength(20);
    expect(OFFERED.map(({ id }) => id)).not.toContain("CP-8");
    expect(PRESETS.map(({ name }) => name)).toEqual([
      "Governance and ESG",
      "Covenant Capacity",
      "Portfolio Fit",
    ]);
  });

  it("cap at the table's ceiling", () => {
    const result = estimate(complete(CHOSEN.full ?? []), {
      compared: true,
      effort: "high",
      ceiling: 20,
    });
    expect(result.cap).toBe(20);
  });

  it("write money as USD to the cent", () => {
    expect(usd(717)).toBe("USD 7.17");
    expect(usd(5)).toBe("USD 0.05");
  });
});
