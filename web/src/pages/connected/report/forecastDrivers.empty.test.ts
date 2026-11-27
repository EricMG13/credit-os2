import { expect, it } from "vitest";
import { driverTable } from "./forecastDrivers";

const cells = (table: ReturnType<typeof driverTable>, id: string) =>
  table.rows
    .find((row) => row.id === id)
    ?.cells.map(({ text, stated, differs, only }) => ({ text, stated, differs, only }));
const NOT = { text: "Not stated", stated: false, differs: false, only: false };

it.each([[[]], [["", "  "]]])(
  "C1b-4 reads values %j as not stated, never as differing",
  (values) => {
    const table = driverTable({
      base_drivers: { interest_rate: { values: ["0.04", "0.04"] } },
      upside_drivers: { interest_rate: { values }, revenue_growth: { values: ["0.07"] } },
    });
    expect(cells(table, "base_drivers.interest_rate")).toEqual([
      { text: "0.04 each year", stated: true, differs: false, only: false },
      NOT,
    ]);
  },
);

it("C1b-4 keeps a blank item inside a stated list as a per-year gap", () => {
  const table = driverTable({
    base_drivers: { interest_rate: { values: ["0.04", "0.04"] } },
    upside_drivers: { interest_rate: { values: ["0.04", ""] } },
  });
  expect(cells(table, "base_drivers.interest_rate")?.[1]).toEqual({
    text: "0.04 · Not stated",
    stated: true,
    differs: true,
    only: false,
  });
});

it.each([[""], ["  "]])("C1b-R3 reads the blank scalar %j as not stated", (scalar) => {
  const table = driverTable({
    base_drivers: { interest_rate: { values: ["0.04", "0.04"] } },
    upside_drivers: { interest_rate: scalar, revenue_growth: { values: ["0.07"] } },
  });
  expect(cells(table, "base_drivers.interest_rate")).toEqual([
    { text: "0.04 each year", stated: true, differs: false, only: false },
    NOT,
  ]);
});
