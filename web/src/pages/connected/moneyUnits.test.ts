import { expect, it } from "vitest";
import cases from "./moneyUnits.cases.json";
import { unitLabel, withUnit, writtenUnit } from "./publishedReport";

it.each(cases.withUnit as [string, string | null, string][])("withUnit(%s, %s)", (v, u, out) => {
  expect(withUnit(v, u)).toBe(out);
});

it.each(cases.unitLabel as [string, string][])("unitLabel(%s)", (unit, out) => {
  expect(unitLabel(unit)).toBe(out);
});

it.each(cases.writtenUnit as [string, string | null, string][])(
  "writtenUnit(%s, %s)",
  (text, unit, out) => {
    expect(writtenUnit(text, unit)).toBe(out);
  },
);
