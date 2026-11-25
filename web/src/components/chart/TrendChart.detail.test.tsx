import { fireEvent, render, screen, within } from "@testing-library/react";
import { TrendChart } from "./TrendChart";

const PERIODS = ["FY23", "FY24"];
const SERIES = [
  { name: "Net debt / EBITDA", values: [-0.5, 1.2] },
  { name: "Total debt / EBITDA", values: [3.75, 2.8] },
];
const TABLE = [
  { name: "Net debt / EBITDA", cells: ["-0.50", "1.20"] },
  { name: "Total debt / EBITDA", cells: ["3.75", "2.80"] },
];
const DETAIL = {
  head: [
    "Period",
    "Net debt / EBITDA",
    "Total debt / EBITDA",
    "Reporting unit",
    "Basis and limitation",
  ],
  rows: [
    {
      label: "FY23",
      cells: ["-0.50", "3.75", "x", "Net cash; gross debt includes finance leases."],
    },
    { label: "FY24", cells: ["1.20", "2.80", "x", null] },
  ],
};

function tableForm(detail?: typeof DETAIL) {
  render(
    <TrendChart
      title="Leverage"
      periods={PERIODS}
      series={SERIES}
      table={TABLE}
      detailTable={detail}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  return within(screen.getByRole("table", { name: "Leverage" }));
}

describe("TrendChart detail table", () => {
  it("shows the published table in the Table form when one is given", () => {
    const grid = tableForm(DETAIL);
    expect(grid.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(DETAIL.head);
    expect(
      grid.getByRole("cell", { name: "Net cash; gross debt includes finance leases." }),
    ).toBeVisible();
    expect(grid.getAllByRole("cell", { name: "x" })).toHaveLength(2);
    expect(grid.getByRole("rowheader", { name: "FY24" })).toBeVisible();
  });

  it("keeps the chart and its tooltip on the series figures", () => {
    render(
      <TrendChart
        title="Leverage"
        periods={PERIODS}
        series={SERIES}
        table={TABLE}
        detailTable={DETAIL}
      />,
    );
    expect(screen.getByRole("application", { name: "Leverage" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("draws the series table, one row per series and one column per period, without one", () => {
    const grid = tableForm();
    expect(grid.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Leverage",
      ...PERIODS,
    ]);
    expect(grid.getAllByRole("rowheader").map((h) => h.textContent)).toEqual([
      "Net debt / EBITDA",
      "Total debt / EBITDA",
    ]);
    expect(grid.queryByRole("columnheader", { name: "Basis and limitation" })).toBeNull();
  });
});
