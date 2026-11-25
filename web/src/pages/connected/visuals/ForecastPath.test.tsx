import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { forecastMeasure } from "../report/forecastData";
import { LeveragePath, type PathSchedule } from "./ForecastPath";

afterEach(() => {
  vi.unstubAllGlobals();
});

const NET = "Net leverage (net debt / Adj EBITDA)";
const value = (exact: string, display = `${exact}x`) => ({ status: "value", exact, display });
const notCalculated = (reason: string) => ({ status: "unavailable", display: "n.a.", reason });

type Column = { label: string; group: string; start?: string; end?: string };
function measureOf(columns: Column[], cells: unknown[], extra: Record<string, unknown[]> = {}) {
  return forecastMeasure(
    {
      cashflow: {
        columns,
        rows: [
          { label: NET, band: "Leverage", kind: "multiple", total: false, cells },
          ...Object.entries(extra).map(([label, row]) => ({
            label,
            band: "Leverage",
            kind: "multiple",
            total: false,
            cells: row,
          })),
        ],
      },
    },
    /^Net leverage\b/,
    /net debt \/ Adj EBITDA/,
  );
}
const cols = (group: string, labels: string[]) => labels.map((label) => ({ label, group }));
const noSchedule: PathSchedule = { years: [], offAxis: [] };

function draw(
  measure: ReturnType<typeof measureOf>,
  options: { group?: string; caseName?: string; schedule?: PathSchedule; rows?: string[] } = {},
) {
  return render(
    <LeveragePath
      measure={measure}
      rows={options.rows}
      group={options.group ?? "Base case"}
      caseName={options.caseName ?? "Base case"}
      schedule={options.schedule ?? noSchedule}
    />,
  );
}

it("joins a case only between consecutive published years and hatches the year it does not publish", () => {
  const { container } = draw(
    measureOf(
      [
        ...cols("Base case", ["FY2025E", "FY2027E"]),
        ...cols("Downside case", ["FY2025E", "FY2026E", "FY2027E"]),
      ],
      [value("5.5"), value("3.05"), value("6"), value("6.5"), value("7")],
    ),
  );
  // FY2025E and FY2027E are not consecutive: no segment joins them across FY2026E.
  expect(container.querySelectorAll('[data-segment="Base case"]')).toHaveLength(0);
  expect(container.querySelectorAll('[data-segment="Downside case"]')).toHaveLength(2);
  expect(container.querySelector('[data-gap="FY2026E"]')).not.toBeNull();
  expect(within(screen.getByRole("figure")).getByText("Not published")).toBeInTheDocument();
  expect(screen.getByText("Base case: FY2026E not published.")).toBeInTheDocument();
});

it("tells a figure the model did not calculate apart from a period it does not publish", () => {
  const { container } = draw(
    measureOf(cols("Base case", ["FY2025E", "FY2026E"]), [
      value("5.5"),
      notCalculated("EBITDA is not positive"),
    ]),
  );
  expect(container.querySelector('[data-gap="FY2026E"]')).not.toBeNull();
  expect(screen.getByText("Not calculated")).toBeInTheDocument();
  expect(screen.getByText("Base case, FY2026E: EBITDA is not positive.")).toBeInTheDocument();
  expect(screen.queryByText(/0\.00x/)).toBeNull();
});

it("labels the selected case's highest year with its figure at its own point, never as a peak", () => {
  const { container } = draw(
    measureOf(cols("Base case", ["FY2025E", "FY2026E", "FY2027E"]), [
      value("5.5", "5.50x"),
      value("5.65", "5.65x"),
      value("3.05", "3.05x"),
    ]),
  );
  const figure = within(screen.getByRole("figure"));
  // The figure alone: the point's place on the axis says the year.
  expect(container.querySelector('[data-label="Base case-FY2026E"]')).toHaveTextContent(/^5\.65x$/);
  expect(figure.getByText(/^3\.05x/)).toBeInTheDocument();
  expect(figure.queryByText(/peak/i)).toBeNull();
});

it("keeps the highest year's label beside its own point when another case runs above it", () => {
  // A falling path under a higher case: the label is not pushed up between the two lines, where
  // it reads as a point of the other case.
  const { container } = draw(
    measureOf(
      [
        ...cols("Base case", ["FY2025E", "FY2026E", "FY2027E"]),
        ...cols("Downside shock", ["FY2025E", "FY2026E", "FY2027E"]),
      ],
      [
        value("1.23"),
        value("0.75"),
        value("0.29"),
        value("1.8", "1.80x"),
        value("1.45"),
        value("1.1", "1.10x"),
      ],
    ),
  );
  const label = container.querySelector('[data-label="Base case-FY2025E"]');
  const point = container.querySelector('[data-point="Base case FY2025E"]');
  expect(label).toHaveTextContent(/^1\.23x$/);
  const [labelY, pointY] = [Number(label?.getAttribute("y")), Number(point?.getAttribute("cy"))];
  // Level with its point (a baseline 4px under the centre), on the side the path leaves free.
  expect(Math.abs(labelY - pointY)).toBeLessThanOrEqual(10);
  expect(label).toHaveAttribute("text-anchor", "end");
  expect(Number(label?.getAttribute("x"))).toBeLessThan(Number(point?.getAttribute("cx")));
});

it("labels every drawn case's end point and marks another case's missing year", () => {
  const { container } = draw(
    measureOf(
      [
        ...cols("Base case", ["FY2025E", "FY2026E", "FY2027E"]),
        ...cols("Downside case", ["FY2025E", "FY2026E", "FY2027E"]),
        ...cols("Upside with disposals", ["FY2025E", "FY2026E", "FY2027E"]),
      ],
      [
        value("2"),
        value("1.5"),
        value("1"),
        value("3"),
        notCalculated("EBITDA is not positive"),
        value("2.8"),
        value("1.9"),
        value("1.2"),
        value("0.4"),
      ],
    ),
  );
  const labels = [...container.querySelectorAll("[data-label]")].map((label) => label.textContent);
  // In a 600px drawing the longest name does not fit beside its point: each label carries its case's key,
  // and the legend names the case beside the same key.
  expect(labels).toEqual(expect.arrayContaining(["1x A", "2.8x B", "0.4x C"]));
  const legend = screen.getByRole("list", { name: "Chart key" });
  expect(within(legend).getByText("Downside case").previousElementSibling).toHaveTextContent("B");
  expect(container.querySelector('[data-case-gap="Downside case FY2026E"]')).not.toBeNull();
  expect(screen.getByText("Downside case, FY2026E: EBITDA is not positive.")).toBeInTheDocument();
  // The cases are told apart by dash, not by colour alone.
  const dash = (group: string) =>
    container.querySelector(`[data-segment="${group}"]`)?.getAttribute("stroke-dasharray");
  expect(dash("Base case")).toBeNull();
  expect(dash("Upside with disposals")).not.toBeNull();
  expect(dash("Downside case")).not.toBeNull();
  expect(dash("Upside with disposals")).not.toBe(dash("Downside case"));
  // Another case's missing year is a mark of its own kind in the legend, naming the case.
  expect(within(legend).getByText(/no figure for Downside case/)).toBeInTheDocument();
});

it("keeps each case's dash whichever case is selected; the selected case is drawn heavier", () => {
  const measure = measureOf(
    [
      ...cols("Base case", ["FY2025E", "FY2026E"]),
      ...cols("Downside case", ["FY2025E", "FY2026E"]),
    ],
    [value("2"), value("1.5"), value("3"), value("2.5")],
  );
  const segment = (container: HTMLElement, group: string) =>
    container.querySelector(`[data-segment="${group}"]`);
  const base = draw(measure, { group: "Base case" });
  const dashed = segment(base.container, "Downside case")?.getAttribute("stroke-dasharray");
  expect(segment(base.container, "Base case")?.getAttribute("stroke-width")).toBe("2.5");
  base.unmount();
  const downside = draw(measure, { group: "Downside case", caseName: "Downside case" });
  expect(segment(downside.container, "Downside case")?.getAttribute("stroke-dasharray")).toBe(
    dashed,
  );
  expect(segment(downside.container, "Base case")?.getAttribute("stroke-dasharray")).toBeNull();
  expect(segment(downside.container, "Downside case")?.getAttribute("stroke-width")).toBe("2.5");
});

it("places every label inside the plot, clear of the other labels", () => {
  const { container } = draw(
    measureOf(
      [
        ...cols("Base case", ["FY2025E", "FY2026E", "FY2027E"]),
        ...cols("Downside case", ["FY2025E", "FY2026E", "FY2027E"]),
      ],
      // Both cases end on the same figure and the selected case peaks where the other starts.
      [value("2"), value("1.5"), value("1"), value("2"), value("1.6"), value("1")],
    ),
  );
  const labels = [...container.querySelectorAll<SVGTextElement>("[data-label]")].map((label) => ({
    x: Number(label.getAttribute("x")),
    y: Number(label.getAttribute("y")),
    anchor: label.getAttribute("text-anchor"),
    width: label.textContent.length * 8.4,
  }));
  const box = ({ x, y, anchor, width }: (typeof labels)[number]) => {
    const left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
    return { left, right: left + width, top: y - 12, bottom: y + 4 };
  };
  const boxes = labels.map(box);
  for (const one of boxes) {
    expect(one.left).toBeGreaterThanOrEqual(52);
    expect(one.right).toBeLessThanOrEqual(600);
  }
  boxes.forEach((one, at) => {
    for (const other of boxes.slice(at + 1)) {
      const across = Math.min(one.right, other.right) - Math.max(one.left, other.left);
      const down = Math.min(one.bottom, other.bottom) - Math.max(one.top, other.top);
      expect(across > 0 && down > 0).toBe(false);
    }
  });
});

it("draws no covenant level on the model's path", () => {
  const { container } = draw(measureOf(cols("Base case", ["FY2025E"]), [value("4.2")]));
  expect(container.querySelector("[data-limit]")).toBeNull();
  expect(screen.queryByText(/limit/i)).toBeNull();
});

it("draws the published maturity schedule as written on the axis, naming no single wall", () => {
  const cell = (text: string, amount: number | null, reason: string | null = null) => ({
    text,
    value: amount,
    reason,
  });
  const { container } = draw(
    measureOf(cols("Base case", ["FY2025E", "FY2026E"]), [value("2"), value("1.5")]),
    {
      schedule: {
        years: [
          { year: 2026, label: "FY2026", key: "FY2026", cell: cell("500", 500) },
          {
            year: 2027,
            label: "FY2027",
            key: "FY2027",
            cell: cell("Not supplied: the schedule stops here", null, "the schedule stops here"),
          },
          { year: 2028, label: "FY2028", key: "FY2028", cell: cell("1,250", 1250) },
          { year: 2034, label: "FY2034", key: "FY2034", cell: cell("900", 900) },
        ],
        offAxis: [{ year: 0, label: "Thereafter", key: "Thereafter", cell: cell("4,768", 4768) }],
        unit: "US$m",
      },
    },
  );
  const figure = within(screen.getByRole("figure"));
  expect(figure.getByText("1,250")).toBeInTheDocument();
  expect(figure.getByText("500")).toBeInTheDocument();
  expect(figure.queryByText(/maturity wall/i)).toBeNull();
  expect(container.querySelector('[data-lane-gap="FY2027"]')).not.toBeNull();
  expect(figure.getByText("Not supplied")).toBeInTheDocument();
  expect(
    screen.getByText("Debt maturing, FY2027: Not supplied: the schedule stops here."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Debt maturing in years not on this axis: FY2034 900."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Debt maturing, not by fiscal year: Thereafter 4,768."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("table", { name: /Net leverage by case/ }));
  expect(table.getByRole("columnheader", { name: "Debt maturing, US$m" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "1,250" })).toBeInTheDocument();
});

it("draws only the selected case's own periods when the cases share none, and says so", () => {
  const { container } = draw(
    measureOf(
      [...cols("Base case", ["FY2025E"]), ...cols("Downside case", ["FY2026E"])],
      [value("1"), value("2")],
    ),
  );
  expect(container.querySelector('[data-segment="Downside case"]')).toBeNull();
  expect(container.querySelector("[data-gap]")).toBeNull();
  expect(screen.queryByText(/Not published/)).toBeNull();
  expect(screen.queryByText(/No figure for/)).toBeNull();
  const tile = within(screen.getByRole("region", { name: "Net leverage path" }));
  expect(tile.getByRole("heading", { name: "Net leverage, Base case" })).toBeInTheDocument();
  expect(tile.getByText("FY2025E to FY2025E")).toBeInTheDocument();
  expect(
    screen.getByText("The cases publish no period in common, so no scenario comparison is drawn."),
  ).toBeInTheDocument();
});

it("switches to a table of every drawn case, with a period a case does not publish named", () => {
  draw(
    measureOf(
      [...cols("Base case", ["FY2025E", "FY2026E"]), ...cols("Downside case", ["FY2025E"])],
      [value("1.23"), value("0.75"), value("1.8")],
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("table", { name: /Net leverage by case/ }));
  expect(table.getByRole("columnheader", { name: "Downside case" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "0.75x" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "Not published" })).toBeInTheDocument();
});

it("says what is true when the model publishes two net leverage rows", () => {
  draw(
    measureOf(cols("Base case", ["FY2025E"]), [value("1.2")], {
      "Net leverage (covenant basis)": [value("3.4")],
    }),
  );
  expect(
    screen.getByText(
      `The model also publishes Net leverage (covenant basis); this chart reads ${NET}.`,
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText("3.4x")).toBeNull();
});

it("draws the gap in place: no row, two unmatched rows, a case without the row", () => {
  const { unmount } = draw(null);
  expect(screen.getByText("The model publishes no net leverage figure.")).toBeInTheDocument();
  unmount();
  const second = draw(null, { rows: ["Net leverage (one)", "Net leverage (two)"] });
  expect(
    screen.getByText(
      "The model publishes 2 net leverage rows: Net leverage (one) and Net leverage (two). None is on net debt over Adj EBITDA, so none is drawn.",
    ),
  ).toBeInTheDocument();
  second.unmount();
  draw(measureOf(cols("Base case", ["FY2025E"]), [value("1.5")]), {
    group: "Downside (CP-2G drivers)",
    caseName: "Downside drivers",
  });
  expect(screen.getByText("No net leverage figure for Downside drivers.")).toBeInTheDocument();
  expect(screen.queryByText("1.5x")).toBeNull();
});

it("keeps an actual year and a forecast year of the same fiscal year apart, by their labels", () => {
  draw(
    measureOf(
      [{ label: "FY2025", group: "Fiscal year" }, ...cols("Base case", ["FY2025E", "FY2026E"])],
      [value("2.50"), value("2.20"), value("2.00")],
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("table", { name: /Net leverage by case/ }));
  const row = (label: string) =>
    within(table.getByRole("rowheader", { name: label }).closest("tr") as HTMLElement)
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
  // Columns: Reported, Base case. The reported figure is never put in the case's column.
  expect(row("FY2025")).toEqual(["2.50x", ""]);
  expect(row("FY2025E")).toEqual(["", "2.20x"]);
  expect(row("FY2026E")).toEqual(["", "2.00x"]);
});

it("draws every schedule row of a year that has two, side by side and in the table", () => {
  const cell = (text: string, amount: number) => ({ text, value: amount, reason: null });
  const { container } = draw(
    measureOf(cols("Base case", ["FY2025E", "FY2026E"]), [value("2"), value("1.5")]),
    {
      schedule: {
        years: [
          { year: 2026, label: "FY2026", key: "FY2026-0", cell: cell("300", 300) },
          { year: 2026, label: "FY2026", key: "FY2026-1", cell: cell("200", 200) },
        ],
        offAxis: [],
        unit: "US$m",
      },
    },
  );
  const figure = within(screen.getByRole("figure"));
  expect(figure.getByText("300")).toBeInTheDocument();
  expect(figure.getByText("200")).toBeInTheDocument();
  expect(container.querySelectorAll("rect.fill-chart-2")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("table", { name: /Net leverage by case/ }));
  expect(table.getByText("FY2026: 300")).toBeInTheDocument();
  expect(table.getByText("FY2026: 200")).toBeInTheDocument();
});

it("words a narrow year's missing amount as one label on two lines, never two that touch", () => {
  // Six forecast years in the 600px drawing: each year is narrower than the words on one line.
  const years = ["FY2025E", "FY2026E", "FY2027E", "FY2028E", "FY2029E", "FY2030E"];
  const { container } = draw(
    measureOf(
      cols("Base case", years),
      years.map(() => value("2")),
    ),
    {
      schedule: {
        years: [
          {
            year: 2027,
            label: "FY2027",
            key: "FY2027",
            cell: {
              text: "Not supplied: the schedule stops here",
              value: null,
              reason: "the schedule stops here",
            },
          },
        ],
        offAxis: [],
      },
    },
  );
  const gap = container.querySelector('[data-lane-gap="FY2027"]');
  expect(gap?.querySelectorAll("text")).toHaveLength(1);
  expect(gap?.querySelector("text")).toHaveTextContent("Not supplied");
  expect(gap?.querySelectorAll("tspan")).toHaveLength(2);
});

// Owner's ruling, 2026-11-25: every reported and pro forma column is drawn before the forecast
// years, oldest fiscal year first, then year to date, last twelve months and pro forma. The grid
// below is authored scrambled; every expected order and figure is written by hand from it.
const MIXED: Column[] = [
  { label: "FY2024", group: "Fiscal year" },
  { label: "PF LTM Jun 2025", group: "Pro forma" },
  { label: "FY2022", group: "Fiscal year" },
  { label: "LTM Jun 2025", group: "Last twelve months" },
  { label: "FY2023", group: "Fiscal year" },
  { label: "YTD Jun 2025", group: "Year to date" },
  ...cols("Base case", ["FY2026E", "FY2025E"]),
  ...cols("Downside case", ["FY2025E", "FY2026E"]),
];
const MIXED_CELLS = [
  value("5.50"),
  value("4.90"),
  notCalculated("EBITDA is not positive"),
  value("5.20"),
  value("6.10"),
  value("5.40"),
  value("4.10"),
  value("4.60"),
  value("5.00"),
  value("5.30"),
];

it("puts LTM and PF after the fiscal years and before the forecast years on the X axis", () => {
  const { container } = draw(measureOf(MIXED, MIXED_CELLS));
  const axis = [...container.querySelectorAll("[data-axis-period]")];
  expect(axis.map((label) => label.getAttribute("data-axis-period"))).toEqual([
    "FY2023",
    "FY2024",
    "YTD Jun 2025",
    "LTM Jun 2025",
    "PF LTM Jun 2025",
    "FY2025E",
    "FY2026E",
  ]);
  // The labels run left to right in that order, and each reported point sits over its own label.
  const xs = axis.map((label) => Number(label.getAttribute("x")));
  expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  const pointX = (name: string) =>
    Number(container.querySelector(`[data-point="${name}"]`)?.getAttribute("cx"));
  expect([
    pointX("history FY2023"),
    pointX("history FY2024"),
    pointX("history YTD Jun 2025"),
    pointX("history LTM Jun 2025"),
    pointX("history PF LTM Jun 2025"),
    pointX("Base case FY2025E"),
    pointX("Base case FY2026E"),
  ]).toEqual(xs);
  expect(pointX("Downside case FY2026E")).toBe(xs[6]);
  // Fiscal years are joined to the next fiscal year only; no line runs to YTD, LTM or PF.
  expect(container.querySelectorAll('[data-segment="history"]')).toHaveLength(1);
  expect(
    within(screen.getByRole("region", { name: "Net leverage path" })).getByText(
      "FY2023 to FY2026E",
    ),
  ).toBeVisible();
  expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
    "Net leverage by period. Reported and pro forma: FY2023 6.10x, FY2024 5.50x, YTD Jun 2025 5.40x, LTM Jun 2025 5.20x, PF LTM Jun 2025 4.90x; Base case: FY2025E 4.60x, FY2026E 4.10x; Downside case: FY2025E 5.00x, FY2026E 5.30x.",
  );
  expect(screen.getByText("Before the forecast, FY2022: EBITDA is not positive.")).toBeVisible();
  expect(
    within(screen.getByRole("list", { name: "Chart key" })).getByText(
      "Reported and pro forma, before the forecast",
    ),
  ).toBeVisible();
});

it("draws a figure the period rule cannot place last, after the forecast years, and says so", () => {
  const { container } = draw(
    measureOf(
      [
        { label: "Run rate", group: "Run rate" },
        { label: "FY2024", group: "Fiscal year" },
        ...cols("Base case", ["FY2025E", "FY2026E"]),
      ],
      [value("6.60"), value("5.50"), value("4.60"), value("4.10")],
    ),
  );
  const axis = [...container.querySelectorAll("[data-axis-period]")];
  expect(axis.map((label) => label.getAttribute("data-axis-period"))).toEqual([
    "FY2024",
    "FY2025E",
    "FY2026E",
    "Run rate",
  ]);
  const xs = axis.map((label) => Number(label.getAttribute("x")));
  expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  const point = container.querySelector('[data-point="unplaced Run rate"]');
  expect(Number(point?.getAttribute("cx"))).toBe(xs[3]);
  // Its place in time is not known: no line runs to it, from the reported years or from a case.
  expect(container.querySelectorAll('[data-segment="history"]')).toHaveLength(0);
  expect(container.querySelectorAll('[data-segment="Base case"]')).toHaveLength(1);
  expect(within(screen.getByRole("figure")).getByText("6.60x")).toBeInTheDocument();
  expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
    "Net leverage by period. Reported: FY2024 5.50x; Base case: FY2025E 4.60x, FY2026E 4.10x; Not placed in time order, shown last: Run rate 6.60x.",
  );
  expect(screen.getByText("Not placed in time order, shown last: Run rate.")).toBeVisible();
  expect(
    within(screen.getByRole("list", { name: "Chart key" })).getByText(
      "Not placed in time order, shown last",
    ),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("table", { name: /Net leverage by case/ }));
  expect(table.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "Period",
    "Reported",
    "Not placed in time order",
    "Base case",
  ]);
  expect(
    table
      .getAllByRole("row")
      .slice(1)
      .map((row) => [...row.children].map((cell) => cell.textContent)),
  ).toEqual([
    ["FY2024", "5.50x", "", ""],
    ["FY2025E", "", "", "4.60x"],
    ["FY2026E", "", "", "4.10x"],
    ["Run rate", "", "6.60x", ""],
  ]);
});

it("states every period's figure in its own row of the table, reported apart from each case", () => {
  draw(measureOf(MIXED, MIXED_CELLS));
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("table", { name: /Net leverage by case/ }));
  expect(table.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "Period",
    "Reported and pro forma",
    "Base case",
    "Downside case",
  ]);
  const rows = table
    .getAllByRole("row")
    .slice(1)
    .map((row) => [...row.children].map((cell) => cell.textContent));
  expect(rows).toEqual([
    ["FY2023", "6.10x", "", ""],
    ["FY2024", "5.50x", "", ""],
    ["YTD Jun 2025", "5.40x", "", ""],
    ["LTM Jun 2025", "5.20x", "", ""],
    ["PF LTM Jun 2025", "4.90x", "", ""],
    ["FY2025E", "", "4.60x", "5.00x"],
    ["FY2026E", "", "4.10x", "5.30x"],
  ]);
});

it("draws a maturity under its reported fiscal year, and under the forecast year where both exist", () => {
  const cell = (text: string, amount: number) => ({ text, value: amount, reason: null });
  draw(
    measureOf(
      [{ label: "FY2024", group: "Fiscal year" }, ...cols("Base case", ["FY2025E", "FY2026E"])],
      [value("2.50"), value("2.20"), value("2.00")],
    ),
    {
      schedule: {
        years: [
          { year: 2024, label: "FY2024", key: "FY2024", cell: cell("120", 120) },
          { year: 2026, label: "FY2026", key: "FY2026", cell: cell("500", 500) },
          { year: 2023, label: "FY2023", key: "FY2023", cell: cell("75", 75) },
        ],
        offAxis: [],
        unit: "US$m",
      },
    },
  );
  expect(screen.getByText("Debt maturing in years not on this axis: FY2023 75.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const table = within(screen.getByRole("table", { name: /Net leverage by case/ }));
  const rows = table
    .getAllByRole("row")
    .slice(1)
    .map((row) => [...row.children].map((cell) => cell.textContent));
  expect(rows).toEqual([
    ["FY2024", "2.50x", "", "120"],
    ["FY2025E", "", "2.20x", ""],
    ["FY2026E", "", "2.00x", "500"],
  ]);
});

it("draws a forecast-only grid as before, and a single period as one point", () => {
  const { container } = draw(measureOf(cols("Base case", ["FY2025E"]), [value("4.20")]));
  expect(
    [...container.querySelectorAll("[data-axis-period]")].map((label) => label.textContent),
  ).toEqual(["FY2025E"]);
  expect(container.querySelectorAll("[data-point]")).toHaveLength(1);
  expect(screen.getByRole("list", { name: "Chart key" })).not.toHaveTextContent("Reported");
});

it("says a row with reported figures and no forecast period has no forecast period", () => {
  draw(measureOf([{ label: "FY2024", group: "Fiscal year" }], [value("2.50")]));
  expect(screen.getByText("The model's net leverage row has no forecast period.")).toBeVisible();
});

it("leaves out an axis period label that would print over a neighbour, keeping the first and the latest", () => {
  // The real replay run's axis: reported years, two last-twelve-months periods, then the forecast.
  const labels = [
    "FY2023",
    "FY2024",
    "LTM FY2024",
    "Prior LTM",
    "FY2025E",
    "FY2026E",
    "FY2027E",
    "FY2028E",
    "FY2029E",
  ];
  // The chart's frame is narrow: nine periods sit under 40 px apart, as on the replay run at 1024 px.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: (entries: unknown[]) => void) {}
      observe() {
        this.callback([{ contentRect: { width: 480 } }]);
      }
      disconnect() {}
    },
  );
  const { container } = draw(
    measureOf(
      [
        ...cols("Fiscal year", ["FY2023", "FY2024"]),
        ...cols("Last twelve months", ["LTM FY2024", "Prior LTM"]),
        ...cols("Base case", ["FY2025E", "FY2026E", "FY2027E", "FY2028E", "FY2029E"]),
      ],
      ["6.1", "5.9", "5.8", "5.7", "5.12", "4.41", "3.76", "3.2", "2.9"].map((n) => value(n)),
    ),
  );
  const shown = [...container.querySelectorAll("[data-axis-period]")].filter(
    (node) => node.textContent !== "",
  );
  const names = shown.map((node) => node.getAttribute("data-axis-period"));
  // The axis ends on the unplaced "Prior LTM"; the first period and that last one are kept.
  expect(names).toContain("FY2023");
  expect(names).toContain("Prior LTM");
  expect(names.length).toBeLessThan(labels.length);
  shown.slice(1).forEach((b, at) => {
    const a = shown[at];
    if (!a) throw new Error("no neighbour");
    const half = (a.textContent.length + b.textContent.length) / 2;
    // 12 px mono text advances 7 px a character (hand-written, below the real 7.2).
    expect(Number(b.getAttribute("x")) - Number(a.getAttribute("x"))).toBeGreaterThanOrEqual(
      half * 7,
    );
  });
});
