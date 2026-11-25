import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegacyVisuals } from ".";

// Owner's ruling, 2026-11-25: fiscal years oldest first, then YTD, LTM, PF, forecast years.
// The rows are authored scrambled; every expected order and cell is written by hand.
const ROWS = [
  ["FY2026E", "8.00", "x", "Forecast."],
  ["PF LTM Jun 2025", "5.00", "x", "Pro forma for the disposal."],
  ["FY2023", "1.00", "x", "Reported."],
  ["Run-rate", "9.00", "x", "Management figure."],
  ["LTM Jun 2025", "4.00", "x", "Last twelve months."],
  ["YTD Jun 2025", "3.00", "x", "Six months."],
  ["FY2024", "2.00", "x", "Restated."],
];

function drawn() {
  const sections = [
    {
      blocks: [
        {
          type: "table",
          line: 20,
          headers: ["Period", "Net leverage", "Reporting unit", "Basis and limitation"],
          rows: ROWS.map((cells, at) => ({ cells, line: 22 + at })),
        },
      ],
    },
  ];
  const view = render(
    <LegacyVisuals
      output={{ charts: [{ title: "Leverage", table: 20, unit: "x", columns: [1] }] }}
      sections={sections}
      evidenceHref={(line) => `#line-${String(line)}`}
    />,
  );
  return { ...view, figure: within(screen.getByRole("figure", { name: "Leverage" })) };
}

it("draws a period chart's rows in period order with LTM and PF between actuals and forecasts", () => {
  const { container } = drawn();
  const ticks = [
    ...container.querySelectorAll(
      ".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value",
    ),
  ].map((tick) => tick.textContent);
  expect(ticks).toEqual([
    "FY2023",
    "FY2024",
    "YTD Jun 2025",
    "LTM Jun 2025",
    "PF LTM Jun 2025",
    "FY2026E",
    "Run-rate",
  ]);
  expect(
    screen.getByRole("figure", { name: "Leverage" }).querySelector("figcaption"),
  ).toHaveTextContent("x (times) · Not placed in time order, shown last: Run-rate.");
});

it("keeps each row's figure, unit, basis and source with its own period in the Table form", () => {
  const { figure } = drawn();
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  const rows = within(figure.getByRole("table", { name: "Leverage" })).getAllByRole("row");
  const text = rows.slice(1).map((row) => [
    within(row).getByRole("rowheader").textContent,
    ...within(row)
      .getAllByRole("cell")
      .slice(0, 3)
      .map((cell) => cell.textContent),
    within(row).queryByRole("link")?.getAttribute("href") ?? null,
  ]);
  expect(text).toEqual([
    ["FY2023", "1.00", "x", "Reported.", "#line-24"],
    ["FY2024", "2.00", "x", "Restated.", "#line-28"],
    ["YTD Jun 2025", "3.00", "x", "Six months.", "#line-27"],
    ["LTM Jun 2025", "4.00", "x", "Last twelve months.", "#line-26"],
    ["PF LTM Jun 2025", "5.00", "x", "Pro forma for the disposal.", "#line-23"],
    ["FY2026E", "8.00", "x", "Forecast.", "#line-22"],
    ["Run-rate", "9.00", "x", "Management figure.", "#line-25"],
  ]);
});
