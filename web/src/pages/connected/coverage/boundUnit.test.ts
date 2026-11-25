import { expect, it } from "vitest";
import type { Coverage, Fact } from "../coverageData";
import { boundUnit, unitName } from "./boundUnit";

const issuer = (key: string) => ({
  key,
  name: key.toUpperCase(),
  sector: null,
  runs: [
    {
      key: `${key}1`,
      folder: `${key}-run`,
      asOf: "2026-03-31",
      pathway: null,
      pathwayTitle: null,
      cells: {},
      other: [],
    },
  ],
});

const fact = (key: string, unit: string | undefined, at: number | null, period = "FY2025"): Fact => ({
  field: "f",
  issuer: key,
  run: `${key}1`,
  period,
  row: null,
  text: at === null ? "Not supplied: none" : String(at),
  at,
  ...(unit === undefined ? {} : { unit }),
  line: 1,
  output: `${key}-run/CP-1.md`,
  sha256: "a".repeat(64),
});

const data = (facts: Fact[], keys: string[]): Coverage => ({
  columns: [],
  issuers: keys.map(issuer),
  fields: [],
  facts,
});

const read = (facts: Fact[], keys: string[], pick: string | null = null) =>
  boundUnit(data(facts, keys), data(facts, keys).issuers, "f", "FY2025", pick);

it("takes the unit most issuers state at the period", () => {
  const found = read(
    [fact("a", "US$m", 1), fact("b", "US$m", 2), fact("c", "EURm", 9)],
    ["a", "b", "c"],
  );
  expect(found).toEqual({ units: ["EURm", "US$m"], unit: "US$m", tied: [] });
});

it("does not choose between two named units that tie: the bound waits for the reader", () => {
  const found = read([fact("a", "x", 4.6), fact("b", "%", 610)], ["a", "b"]);
  expect(found).toEqual({ units: ["%", "x"], unit: null, tied: ["%", "x"] });
});

it("never lets 'no unit stated' win a tie, but lets it win outright", () => {
  expect(read([fact("a", undefined, 1), fact("b", "x", 2)], ["a", "b"])).toMatchObject({
    unit: "x",
    tied: [],
  });
  expect(
    read([fact("a", undefined, 1), fact("b", undefined, 2), fact("c", "x", 3)], ["a", "b", "c"]),
  ).toMatchObject({ unit: "", tied: [] });
});

it("takes the reader's pick when it is one of the units, and ignores a pick that is not", () => {
  const facts = [fact("a", "x", 4.6), fact("b", "%", 610)];
  expect(read(facts, ["a", "b"], "x")).toMatchObject({ unit: "x", tied: [] });
  expect(read(facts, ["a", "b"], "EURm")).toMatchObject({ unit: null, tied: ["%", "x"] });
});

it("counts an issuer once, ignores a missing figure and a period it states twice", () => {
  const facts = [
    fact("a", "x", null),
    fact("b", "x", 1),
    fact("b", "x", 2),
    fact("c", "%", 3),
  ];
  expect(read(facts, ["a", "b", "c"])).toEqual({ units: ["%"], unit: "%", tied: [] });
});

it("names the empty unit", () => {
  expect(unitName("")).toBe("no unit stated");
  expect(unitName("x")).toBe("x");
});
