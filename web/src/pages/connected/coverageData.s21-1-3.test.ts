import { expect, it } from "vitest";
// Probe S21-1-3: `commonPeriod` counts FACTS, not runs. coverageData.ts documents it as "the
// reported [period] most newest runs state a figure for, the later of equals". An issuer whose run
// states one period on two rows (a period the page never ranks) counts twice for it.
// Answer key (by hand): newest runs and the periods they state: A: FY2024 (two rows); B: FY2025;
// C: FY2025; D: FY2024. Runs stating FY2024 = {A, D} = 2; FY2025 = {B, C} = 2; a tie goes to the
// later period, FY2025. (FY2025 is also the period at which 2 issuers can be ranked; FY2024 ranks
// only D, because A states it twice.)
import { commonPeriod, type Coverage } from "./coverageData";

const SHA = "a".repeat(64);
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
let line = 0;
const fact = (key: string, period: string, text: string) => ({
  field: "f",
  issuer: key,
  run: `${key}1`,
  period,
  row: null,
  text,
  at: Number(text),
  unit: "x",
  line: ++line,
  output: `${key}-run/CP-1.md`,
  sha256: SHA,
});
const data: Coverage = {
  columns: [],
  issuers: ["a", "b", "c", "d"].map(issuer),
  fields: [{ id: "f", module: "CP-1", group: "G", label: "L", kind: "number", series: "period" }],
  facts: [
    fact("a", "FY2024", "3.0"),
    fact("a", "FY2024", "3.1"),
    fact("b", "FY2025", "2.0"),
    fact("c", "FY2025", "2.5"),
    fact("d", "FY2024", "4.0"),
  ],
};

it("opens on the period most runs state a figure for, the later of equals", () => {
  expect(commonPeriod(data, data.issuers, "f")).toBe("FY2025");
});
