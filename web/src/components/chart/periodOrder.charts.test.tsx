import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { PathChart } from "./PathChart";
import { TrendChart } from "./TrendChart";
import { atPositions, periodGapNote, periodPositions } from "./seriesData";

// Owner's ruling, 2026-11-25: oldest fiscal year to latest, then YTD, LTM, PF, forecast years.
// Every expected order and cell below is written by hand from the scrambled input.
const SCRAMBLED = [
  "FY2026E",
  "PF LTM Jun 2025",
  "FY2023",
  "Run-rate",
  "LTM Jun 2025",
  "FY2025E",
  "YTD Jun 2025",
  "FY2024",
];
const VALUES = [8, 5, 1, 9, 4, 7, 3, 2];
const CELLS = ["8.0x", "5.0x", "1.0x", "9.0x", "4.0x", "7.0x", "3.0x", "2.0x"];
const ORDERED = [
  "FY2023",
  "FY2024",
  "YTD Jun 2025",
  "LTM Jun 2025",
  "PF LTM Jun 2025",
  "FY2025E",
  "FY2026E",
  "Run-rate",
];
const ORDERED_CELLS = ["1.0x", "2.0x", "3.0x", "4.0x", "5.0x", "7.0x", "8.0x", "9.0x"];
const GAP = "Not placed in time order, shown last: Run-rate.";

const xTicks = (container: HTMLElement) =>
  [
    ...container.querySelectorAll(
      ".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value",
    ),
  ].map((tick) => tick.textContent);

it("gives the positions of the rule order and names the labels it cannot place", () => {
  expect(periodPositions(SCRAMBLED)).toEqual({
    order: [2, 7, 6, 4, 1, 5, 0, 3],
    gaps: ["Run-rate"],
  });
  expect(atPositions(VALUES, [2, 7, 6, 4, 1, 5, 0, 3])).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
  expect(periodGapNote([], "USD millions")).toBe("USD millions");
  expect(periodGapNote([])).toBeUndefined();
  expect(periodGapNote(["Run-rate"], "USD millions")).toBe(`USD millions · ${GAP}`);
  expect(periodGapNote(["A", "B"], undefined, true)).toBe(
    "Shown in the order written: the periods could not be placed in time order.",
  );
});

it("draws a trend chart's LTM and PF after the fiscal years and before the forecast years", () => {
  const { container } = render(
    <TrendChart
      title="Net leverage"
      periods={SCRAMBLED}
      series={[{ name: "Net leverage", values: VALUES }]}
      table={[{ name: "Net leverage", cells: CELLS }]}
    />,
  );
  expect(xTicks(container)).toEqual(ORDERED);
  const figure = within(screen.getByRole("figure", { name: "Net leverage" }));
  expect(figure.getByText(GAP)).toBeVisible();
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  const grid = within(figure.getByRole("table", { name: "Net leverage" }));
  expect(grid.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "Net leverage",
    ...ORDERED,
  ]);
  expect(grid.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(ORDERED_CELLS);
});

it("says so once when none of a chart's labels is a period, and draws them as written", () => {
  const { container } = render(
    <TrendChart
      title="Steps"
      periods={["Second", "First"]}
      series={[{ name: "Steps", values: [2, 1] }]}
      table={[{ name: "Steps", cells: ["2", "1"] }]}
    />,
  );
  expect(xTicks(container)).toEqual(["Second", "First"]);
  expect(
    screen.getByRole("figure", { name: "Steps" }).querySelector("figcaption"),
  ).toHaveTextContent("Shown in the order written: the periods could not be placed in time order.");
});

it("states no gap for a trend chart whose periods are all placed, and keeps one period", () => {
  render(
    <TrendChart
      title="One"
      note="x"
      periods={["LTM"]}
      series={[{ name: "One", values: [3] }]}
      table={[{ name: "One", cells: ["3.0x"] }]}
    />,
  );
  const figure = screen.getByRole("figure", { name: "One" });
  expect(figure.querySelector("figcaption")?.textContent).toBe("x");
});

it("draws a path chart in the same order, each label, value and table cell with its period", () => {
  const { container } = render(
    <PathChart
      title="EBITDA"
      periods={SCRAMBLED}
      series={[{ name: "EBITDA", values: VALUES, labels: CELLS }]}
      divider={{ period: "PF LTM Jun 2025", at: "after", label: "Forecast" }}
      yTicks={[
        { value: 0, label: "0" },
        { value: 10, label: "10" },
      ]}
      table={{ head: ["EBITDA", ...SCRAMBLED], rows: [{ label: "EBITDA", cells: CELLS }] }}
    />,
  );
  expect(
    [...container.querySelectorAll("[data-tick]")].map((tick) => tick.getAttribute("data-tick")),
  ).toEqual(ORDERED);
  const figure = within(screen.getByRole("figure", { name: "EBITDA" }));
  expect(figure.getByText(GAP)).toBeVisible();
  // Each point's own label is drawn: the label text travels with its value.
  expect(
    [...container.querySelectorAll(".recharts-wrapper [data-label]")].map(
      (label) => label.textContent,
    ),
  ).toEqual(ORDERED_CELLS);
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  const grid = within(figure.getByRole("table"));
  expect(grid.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "EBITDA",
    ...ORDERED,
  ]);
  expect(grid.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(ORDERED_CELLS);
});
