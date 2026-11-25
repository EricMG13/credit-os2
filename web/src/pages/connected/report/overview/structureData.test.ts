import { expect, it } from "vitest";
import { wallSlots } from "./structureData";

// Review of 2026-11-25: the maturity wall reads a row's year by the one period rule, not by a
// pattern of its own. Rows are synthetic; every expected value is written by hand.
const schedule = (labels: string[]) => ({
  line: 1,
  headers: ["Period", "Debt maturing"],
  rows: labels.map((label, at) => [label, String(100 + at)]),
});
const read = (labels: string[]) => {
  const slots = wallSlots(schedule(labels), { columns: [1] }, "US$m");
  if (!slots) throw new Error("no slots");
  const shown = ({ label, cell }: (typeof slots.dated)[number]) => [label, cell?.text ?? null];
  return { dated: slots.dated.map(shown), undated: slots.undated.map(shown) };
};

it("places a row by the whole year the period rule reads, in year order", () => {
  expect(read(["FY27", "Thereafter", "FY2024/25", "2029+", "FY2026E", "2030 and after"])).toEqual({
    dated: [
      ["FY2024/25", "102"],
      ["FY2026E", "104"],
      ["FY27", "100"],
    ],
    undated: [
      ["Thereafter", "101"],
      ["2029+", "103"],
      ["2030 and after", "105"],
    ],
  });
});

it("keeps a row that is not one plain year off the year axis, as written", () => {
  expect(read(["FY2026", "LTM2025", "PF2027", "Q4 2026", "Dec 2026", "Budget"])).toEqual({
    dated: [["FY2026", "100"]],
    undated: [
      ["LTM2025", "101"],
      ["PF2027", "102"],
      ["Q4 2026", "103"],
      ["Dec 2026", "104"],
      ["Budget", "105"],
    ],
  });
});

it("gives a year between two stated years a slot with no row, named as the first is written", () => {
  expect(read(["FY 2028", "FY 2026"])).toEqual({
    dated: [
      ["FY 2026", "101"],
      ["FY 2027", null],
      ["FY 2028", "100"],
    ],
    undated: [],
  });
  expect(read(["2028", "2026", "2026"]).dated).toEqual([
    ["2026", "101"],
    ["2026", "102"],
    ["2027", null],
    ["2028", "100"],
  ]);
});
