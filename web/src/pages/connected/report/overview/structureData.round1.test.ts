import { expect, it } from "vitest";
import { stackRows } from "./structureData";

// C4-5: an empty or non-numeric ranking cell is unranked, never rank zero.
const rows = (ranks: string[]) => ({
  line: 1,
  headers: ["Facility", "Amount", "Ranking"],
  rows: ranks.map((rank, at) => [
    ["Senior secured", "Mezz", "Notes", "Term loan"][at] ?? "",
    "100",
    rank,
  ]),
});
const order = (ranks: string[]) =>
  stackRows(rows(ranks), { label: 0, amount: 1, rank: 2 }, "US$m")?.map((row) => row.label);

it("C4-5 sorts an empty ranking after every ranked facility", () => {
  expect(order(["1", "", "2"])).toEqual(["Senior secured", "Notes", "Mezz"]);
});

it("C4-5 keeps the stated order among the unranked, blank or not a number", () => {
  expect(order(["", "n/a", "2", " "])).toEqual(["Notes", "Senior secured", "Mezz", "Term loan"]);
});
