import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegacyForecast } from "./LegacyForecast";

// Owner's ruling, 2026-11-25: a forecast line chart shows every reported and pro forma column
// before the forecast years, in the one period order. The grid is authored scrambled; every
// expected order and figure is written by hand from it.
const value = (exact: string, display: string) => ({ status: "value", exact, display });
const columns = [
  { label: "LTM Jun 2025", group: "Last twelve months" },
  { label: "FY2026E", group: "Base case" },
  { label: "FY2024", group: "Fiscal year" },
  { label: "PF LTM Jun 2025", group: "Pro forma" },
  { label: "FY2025E", group: "Base case" },
  { label: "FY2022", group: "Fiscal year" },
  { label: "FY2023", group: "Fiscal year" },
  { label: "FY2025E", group: "Downside case" },
  { label: "FY2026E", group: "Downside case" },
];
const revenue = [
  value("1250", "1,250"),
  value("1400", "1,400"),
  value("1200", "1,200"),
  value("1310", "1,310"),
  value("1300", "1,300"),
  { status: "unavailable", display: "n.a.", reason: "Not reported on this basis" },
  value("1100", "1,100"),
  value("1150", "1,150"),
  value("1050", "1,050"),
];

function draw(
  extra: { columns: typeof columns; cells: typeof revenue } = { columns: [], cells: [] },
) {
  render(
    <LegacyForecast
      model={{
        cashflow: {
          units: "USD millions",
          columns: [...extra.columns, ...columns],
          rows: [
            {
              label: "Revenue",
              band: "Revenue",
              total: false,
              cells: [...extra.cells, ...revenue],
            },
          ],
        },
      }}
    />,
  );
  return screen.getByRole("figure", { name: "Revenue" });
}

it("draws LTM and PF after the fiscal years and before the forecast years of each case", () => {
  const figure = draw();
  const ticks = [
    ...figure.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value"),
  ].map((tick) => tick.textContent);
  expect(ticks).toEqual([
    "FY2023",
    "FY2024",
    "LTM Jun 2025",
    "PF LTM Jun 2025",
    "FY2025E",
    "FY2026E",
  ]);
  const caption = figure.querySelector("figcaption")?.textContent ?? "";
  expect(caption).toContain(
    "Periods before the forecast are reported or pro forma figures, the same in every case.",
  );
  expect(caption).toContain("Before the forecast, FY2022: Not reported on this basis.");
});

it("keeps every figure with its own period in the Table form", () => {
  const figure = within(draw());
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  const table = within(figure.getByRole("table", { name: "Revenue" }));
  expect(table.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "Revenue",
    "FY2023",
    "FY2024",
    "LTM Jun 2025",
    "PF LTM Jun 2025",
    "FY2025E",
    "FY2026E",
  ]);
  const rows = table
    .getAllByRole("row")
    .slice(1)
    .map((row) => [...row.children].map((cell) => cell.textContent));
  expect(rows).toEqual([
    ["Base case", "1,100", "1,200", "1,250", "1,310", "1,300", "1,400"],
    ["Downside case", "1,100", "1,200", "1,250", "1,310", "1,150", "1,050"],
  ]);
});

it("draws a figure the period rule cannot place last, after the forecast years, and says so", () => {
  const figure = draw({
    columns: [{ label: "Run rate", group: "Run rate" }],
    cells: [value("1275", "1,275")],
  });
  const ticks = [
    ...figure.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value"),
  ].map((tick) => tick.textContent);
  expect(ticks).toEqual([
    "FY2023",
    "FY2024",
    "LTM Jun 2025",
    "PF LTM Jun 2025",
    "FY2025E",
    "FY2026E",
    "Run rate",
  ]);
  const caption = figure.querySelector("figcaption")?.textContent ?? "";
  expect(caption).toContain("Not placed in time order, shown last: Run rate.");
  expect(caption).not.toContain("not drawn");
  fireEvent.click(within(figure).getByRole("radio", { name: "Table" }));
  const rows = within(within(figure).getByRole("table", { name: "Revenue" }))
    .getAllByRole("row")
    .map((row) => [...row.children].map((cell) => cell.textContent));
  expect(rows).toEqual([
    [
      "Revenue",
      "FY2023",
      "FY2024",
      "LTM Jun 2025",
      "PF LTM Jun 2025",
      "FY2025E",
      "FY2026E",
      "Run rate",
    ],
    ["Base case", "1,100", "1,200", "1,250", "1,310", "1,300", "1,400", "1,275"],
    ["Downside case", "1,100", "1,200", "1,250", "1,310", "1,150", "1,050", "1,275"],
  ]);
});
