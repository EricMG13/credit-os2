import { describe, expect, it } from "vitest";
import type { Coverage, CoverageRun, Fact, Issuer } from "../coverageData";
import { cohort, series } from "./cohort";
import { DIRECTION } from "./direction";

const FIELD = "cp-1/leverage/net-debt-ebitda";

function run(key: string): CoverageRun {
  return { key, folder: key, asOf: null, pathway: null, pathwayTitle: null, cells: {}, other: [] };
}
function issuer(key: string): Issuer {
  return { key, name: key.toUpperCase(), sector: null, runs: [run(`${key}-run`)] };
}
function fact(who: string, period: string | null, text: string, more: Partial<Fact> = {}): Fact {
  return {
    field: FIELD,
    issuer: who,
    run: `${who}-run`,
    period,
    row: null,
    text,
    at: Number(text.replaceAll(",", "")) || null,
    unit: "x",
    line: 1,
    output: "o",
    sha256: "s",
    ...more,
  };
}
function data(facts: Fact[], keys: string[]): Coverage {
  return {
    columns: [],
    issuers: keys.map(issuer),
    fields: [
      { id: FIELD, module: "CP-1", group: "Leverage", label: "Net debt / EBITDA", kind: "number", series: "period" },
    ],
    facts,
  };
}
const KEYS = ["a", "b", "c", "d", "e"];

describe("DIRECTION ids", () => {
  it("has seven keys, each shaped like a field id", () => {
    const keys = Object.keys(DIRECTION);
    expect(keys).toHaveLength(7);
    for (const key of keys) expect(key).toMatch(/^cp-(1|3c)\/[a-z-]+\/[a-z-]+$/);
  });
});

describe("cohort on synthetic data (five invented issuers)", () => {
  const base = [
    fact("a", "FY2025", "4.8"),
    fact("b", "FY2025", "6.0"),
    fact("c", "FY2025", "4.0"),
    fact("d", "FY2025", "3.0"),
    fact("d", "FY2025", "3.1"),
    fact("e", "FY2024", "2.0"),
  ];
  const all = data(base, KEYS);

  it("keeps three, and says why the other two are out", () => {
    const result = cohort(all, all.issuers, FIELD, "FY2025");
    expect(result.members.map((m) => m.value)).toEqual(["4.8", "6", "4"]);
    expect(result.out.map((o) => [o.issuer.key, o.reason])).toEqual([
      ["d", "more than one figure"],
      ["e", "other period"],
    ]);
    expect(result.out[0]?.stated).toEqual(["3.0", "3.1"]);
    expect(result.out[1]?.stated).toEqual(["FY2024"]);
    expect(result.stats?.median).toBe("4.8");
    expect(result.unit).toBe("x");
    expect(result.heading).toBe("Net debt / EBITDA");
  });

  it("separates an other heading, and the pick brings that issuer alone", () => {
    const adjusted = "Net debt / adjusted EBITDA";
    const d = data(
      [...base.slice(0, 3), fact("d", "FY2025", "3.0", { heading: adjusted })],
      ["a", "b", "c", "d"],
    );
    const plain = cohort(d, d.issuers, FIELD, "FY2025");
    expect(plain.out.map((o) => [o.issuer.key, o.reason])).toEqual([["d", "other heading"]]);
    const picked = cohort(d, d.issuers, FIELD, "FY2025", { heading: adjusted });
    expect(picked.members.map((m) => m.issuer.key)).toEqual(["d"]);
    expect(picked.stats).toBeNull();
  });

  it("leaves out an issuer in another unit", () => {
    const d = data(
      [
        fact("a", "FY2025", "10", { unit: "USD millions" }),
        fact("b", "FY2025", "20", { unit: "USD millions" }),
        fact("c", "FY2025", "30", { unit: "USD thousands" }),
      ],
      ["a", "b", "c"],
    );
    const result = cohort(d, d.issuers, FIELD, "FY2025");
    expect(result.unit).toBe("USD millions");
    expect(result.out.map((o) => [o.issuer.key, o.reason])).toEqual([["c", "other unit"]]);
    expect(result.members.map((m) => m.value)).toEqual(["10", "20"]);
  });

  it("leaves out what you excluded and does not change the unit by doing so", () => {
    const d = data(
      [
        fact("a", "FY2025", "1", { unit: "USD millions" }),
        fact("b", "FY2025", "2", { unit: "USD millions" }),
        fact("c", "FY2025", "3", { unit: "USD thousands" }),
      ],
      ["a", "b", "c"],
    );
    const result = cohort(d, d.issuers, FIELD, "FY2025", { excluded: new Set(["a", "b"]) });
    expect(result.unit).toBe("USD millions");
    expect(result.members).toEqual([]);
    expect(result.out.map((o) => [o.issuer.key, o.reason])).toEqual([
      ["a", "left out by you"],
      ["b", "left out by you"],
      ["c", "other unit"],
    ]);
    expect(result.out[0]?.fact?.text).toBe("1");
    expect(result.stats).toBeNull();
  });

  it("exclusion of two of three members leaves one and no statistics", () => {
    const d = data(
      [fact("a", "FY2025", "1"), fact("b", "FY2025", "2"), fact("c", "FY2025", "3")],
      ["a", "b", "c"],
    );
    const result = cohort(d, d.issuers, FIELD, "FY2025", { excluded: new Set(["a", "b"]) });
    expect(result.members).toHaveLength(1);
    expect(result.stats).toBeNull();
    expect(result.out.map((o) => o.reason)).toEqual(["left out by you", "left out by you"]);
  });

  it("says no figure for a missing field, a stated gap and a non-number", () => {
    const d = data(
      [
        fact("a", "FY2025", "Not supplied: cash", { at: null, gap: true }),
        fact("b", "FY2025", "n/a", { at: null }),
        fact("c", "FY2025", "5"),
      ],
      ["a", "b", "c", "d"],
    );
    const result = cohort(d, d.issuers, FIELD, "FY2025");
    expect(result.out.map((o) => [o.issuer.key, o.reason, o.fact?.text])).toEqual([
      ["a", "no figure", "Not supplied: cash"],
      ["b", "no figure", "n/a"],
      ["d", "no figure", undefined],
    ]);
  });
});

describe("series on synthetic data", () => {
  it("is null when the periods cannot be ordered", () => {
    const d = data([fact("a", "Spring", "1"), fact("a", "Autumn", "2")], ["a"]);
    expect(series(d, d.issuers[0] as Issuer, FIELD, "Net debt / EBITDA", "x")).toBeNull();
  });

  it("gives one member per period with exactly one matching figure, oldest first", () => {
    const d = data(
      [
        fact("a", "FY2025", "4.4"),
        fact("a", "FY2023", "5.0"),
        fact("a", "FY2024", "4.8"),
        fact("a", "FY2024", "4.9"),
        fact("a", "FY2022", "9", { unit: "USD millions" }),
      ],
      ["a"],
    );
    const result = series(d, d.issuers[0] as Issuer, FIELD, "Net debt / EBITDA", "x");
    expect(result?.map((m) => [m.fact.period, m.value])).toEqual([
      ["FY2023", "5"],
      ["FY2025", "4.4"],
    ]);
  });
});
