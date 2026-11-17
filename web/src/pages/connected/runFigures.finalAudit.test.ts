import { describe, expect, it } from "vitest";
import { feedLines, spendFigure } from "./runFigures";
import type { Run } from "./api";

const run: Run = {
  id: "run-1",
  status: "running",
  reason: "",
  issuer_name: "Example",
  as_of: "2026-11-16",
  pathway: "credit_snapshot",
  modules: [],
  observed_at: "2026-11-16T12:00:00Z",
  cap: "20.005",
  spent: "3.105",
  settled_spent: "2.675",
  held: "0.435",
  events: [],
};

describe("C1-027 exact decimal cap usage", () => {
  it("rounds the original service decimals, including each breakdown and the cap", () => {
    expect(spendFigure(run)).toEqual({
      value: "USD 3.11",
      bar: {
        value: 3.105,
        max: 20.005,
        label: "USD 3.11 of USD 20.01 cap usage; USD 2.68 settled, USD 0.44 reserved or unknown",
      },
    });
  });

  it.each([
    ["0.005", "USD 0.01"],
    ["9.995", "USD 10.00"],
    ["1.0049999", "USD 1.00"],
    ["0", "USD 0.00"],
    ["3.105e0", "USD 3.11"],
    ["3105e-3", "USD 3.11"],
  ])("preserves exact cent rounding for %s", (spent, value) => {
    expect(spendFigure({ ...run, spent }).value).toBe(value);
  });
});

describe("J2-010 terminal run activity", () => {
  it("puts the run's recorded failure and reason before its earlier Running entry", () => {
    expect(
      feedLines({
        ...run,
        status: "failed",
        reason: "The financial source could not be read.",
        started_at: "2026-11-16T11:00:00Z",
        ended_at: "2026-11-16T11:01:00Z",
      }),
    ).toEqual([
      {
        who: "Run",
        state: "Failed",
        time: "11:01:00 UTC",
        text: "Run failed. The financial source could not be read.",
      },
      { who: "Run", state: "Running", time: "11:00:00 UTC", text: "Run started." },
    ]);
  });

  it("does not claim a terminal event or invent a time for a live run", () => {
    expect(feedLines(run)).toEqual([]);
  });
});

it("keeps the service's stop cause on the public Run contract", () => {
  const stopped: Run = { ...run, status: "failed", stopped_by: "checker" };
  expect(stopped.stopped_by).toBe("checker");
});
