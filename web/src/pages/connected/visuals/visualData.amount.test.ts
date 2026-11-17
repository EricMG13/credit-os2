import { expect, it } from "vitest";
import { amount, cellAmount } from "./visualData";

/** A cell read with the other cells of its measure: here `3,75` proves the decimal comma. */
const inDecimalColumn = (cell: string) => cellAmount(cell, ["3,75", cell]);
const inPlainColumn = (cell: string) => cellAmount(cell, ["2.80", cell]);

it.each([
  ["2.80", 2.8],
  ["1250", 1250],
  ["-0.5", -0.5],
  ["1,250", 1250],
  ["-1,250", -1250],
  ["12,345,678", 12345678],
  ["1,250.5", 1250.5],
])("reads %s as %d, a comma-grouped or plain number", (cell, value) => {
  expect(amount(cell)).toBe(value);
});

it.each([
  ["3,75", 3.75],
  ["-3,75", -3.75],
  ["12,5", 12.5],
  ["0,375", 0.375],
  ["1234,5", 1234.5],
  ["1,2345", 1.2345],
])("reads %s as the decimal comma it is, %d", (cell, value) => {
  expect(amount(cell)).toBe(value);
});

it.each([
  "1,2,3",
  "1,23,4567",
  "123,45,678",
  "1.234,56",
  "1,250,5",
  "12,34,5",
  "1,,000",
  "1,",
  ",5",
  "3,",
  "3,75x",
  "3,7 5",
  "3,75%",
  "-",
  "",
  "n/a",
  "9".repeat(400),
])("does not place %s on an axis", (cell) => {
  expect(amount(cell)).toBeNull();
});

it.each([
  ["21,00,000", 2100000],
  ["1,23,456", 123456],
  ["-1,23,456", -123456],
  ["12,34,567.5", 1234567.5],
  ["1,23,45,678", 12345678],
])("reads the Indian lakh and crore grouping %s as %d", (cell, value) => {
  expect(amount(cell)).toBe(value);
  expect(inDecimalColumn(cell)).toBe(value);
});

it.each([
  ["2,800", 2.8],
  ["1,250", 1.25],
  ["3,75", 3.75],
  ["0,375", 0.375],
  ["-2,800", -2.8],
])(
  "reads %s as a decimal comma when its column is written with decimal commas, %d",
  (cell, value) => {
    expect(inDecimalColumn(cell)).toBe(value);
  },
);

it.each([
  ["1,250,000", 1250000],
  ["2,800.5", 2800.5],
  ["12,345,678", 12345678],
  ["2.80", 2.8],
  ["2800", 2800],
])("reads %s as written even in a column of decimal commas, %d", (cell, value) => {
  expect(inDecimalColumn(cell)).toBe(value);
});

it.each(["1.234,56", "1,2,3", "3,", ",5", "3,75x", "n/a", ""])(
  "still does not place %s on an axis in a column of decimal commas",
  (cell) => {
    expect(inDecimalColumn(cell)).toBeNull();
  },
);

it("reads a cell with no evidence in its scope as it always did, three digits after the comma as thousands", () => {
  expect(amount("2,800")).toBe(2800);
  expect(inPlainColumn("2,800")).toBe(2800);
  expect(cellAmount("2,800", ["2,800", "3,750"])).toBe(2800);
});

it("is not taken for a scope when mapped over cells, which passes the index second", () => {
  expect(["2,800", "3,75", "1,250"].map(amount)).toEqual([2800, 3.75, 1250]);
});

it.each([
  [["3,75", "2,800"], true],
  [["2,800", "0,375"], true],
  [["12,5", "1,250"], true],
  [["3,750", "2,800"], false],
  [["1,250", "12,345"], false],
  [["1,250,000", "3.75"], false],
  [["21,00,000", "1,23,456"], false],
  [["3.75", "2.80"], false],
] as const)("reads 2,800 as a decimal comma in the scope %j: %s", (scope, decimal) => {
  expect(cellAmount("2,800", scope)).toBe(decimal ? 2.8 : 2800);
});

// Review 4 issue 2: English grouping in the same scope contradicts the decimal comma, so nothing flips.
it.each([
  [
    ["1,250,000", "1,250", "3,75", "2,800.5"],
    [1250000, 1250, 3.75, 2800.5],
  ],
  [
    ["3,75", "1,250", "21,00,000"],
    [3.75, 1250, 2100000],
  ],
  [
    ["2,800", "3,75", "1,250.5"],
    [2800, 3.75, 1250.5],
  ],
] as const)("does not flip the scope %j, which also holds English grouping", (scope, values) => {
  expect(scope.map((cell) => cellAmount(cell, scope))).toEqual(values);
});

// L16: an ambiguous written zero does not establish a column's decimal convention.
it.each([
  [
    ["0,000", "2,800"],
    [0, 2800],
  ],
  [
    ["-0,000", "2,800"],
    [-0, 2800],
  ],
] as const)("does not use %j as decimal-comma evidence", (scope, values) => {
  expect(scope.map((cell) => cellAmount(cell, scope))).toEqual(values);
});

it("still uses a nonzero fraction as decimal-comma evidence beside a written zero", () => {
  const scope = ["0,000", "3,75", "2,800"];
  expect(scope.map((cell) => cellAmount(cell, scope))).toEqual([0, 3.75, 2.8]);
  expect(cellAmount("2,800", ["0,375", "2,800"])).toBe(2.8);
});

it("does not use a unit-confirmed written zero as decimal-comma evidence", () => {
  const scope = ["0,000m", "2,800m"];
  expect(scope.map((cell) => cellAmount(cell, scope, "US$m"))).toEqual([0, 2800]);
});
