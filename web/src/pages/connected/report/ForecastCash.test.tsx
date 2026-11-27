import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UsesOfCash } from "./ForecastCash";

const columnsFor = (labels: string[], group = "Base case") =>
  labels.map((label) => ({
    label,
    group,
    start: `${label.slice(2, 6)}-01-01`,
    end: `${label.slice(2, 6)}-12-31`,
  }));
const columns = columnsFor(["FY2025E", "FY2026E", "FY2027E"]);
const value = (exact: string) => ({ status: "value", exact, display: exact });
const na = (reason: string) => ({ status: "na", display: "n.a.", reason });
const row = (label: string, cells: unknown[]) => ({
  label,
  band: "Cash",
  kind: "money",
  total: false,
  cells,
});
const model = (rows: unknown[], cols = columns, units = "USD millions") => ({
  cashflow: { units, columns: cols, rows },
});

const full = model([
  row("Distributions", [value("20"), value("0"), value("30")]),
  row("Debt repayment", [value("50"), na("Repayment not modelled"), value("40")]),
]);

const view = (rows: unknown = full, extra: { units?: string } = {}) => (
  <UsesOfCash model={rows} group="Base case" caseName="Base case" {...extra} />
);
const part = (chart: Element, name: string) => {
  const found = chart.querySelector(`[data-part="${name}"]`);
  if (!found) throw new Error(`no part ${name}`);
  return found;
};
const num = (node: Element, attr: string) => Number(node.getAttribute(attr));

it("labels segments with their exact displays and prints no total", () => {
  render(view());
  const chart = screen.getByRole("img");
  expect(chart.getAttribute("aria-label")).toContain("Distributions FY2025E 20");
  expect(chart.getAttribute("aria-label")).toContain("Debt repayment FY2025E 50");
  expect(chart.textContent).toContain("20");
  expect(chart.textContent).toContain("50");
  expect(chart.textContent).not.toMatch(/\b70\b/u);
});

it("draws zero as a zero-height segment, not a gap", () => {
  render(view());
  const chart = screen.getByRole("img");
  expect(chart.getAttribute("aria-label")).toContain("Distributions FY2026E 0");
  expect(num(part(chart, "Distributions FY2026E"), "height")).toBe(0);
});

it("draws a missing part as a hatched mark on the baseline, never at a height", () => {
  render(
    view(
      model([
        row("Distributions", [na("Dividends not modelled"), value("20"), value("30")]),
        row("Debt repayment", [value("50"), value("10"), value("40")]),
      ]),
    ),
  );
  const chart = screen.getByRole("img");
  const axis = num(chart.querySelector("[data-axis]") as Element, "y1");
  const repayment = part(chart, "Debt repayment FY2025E");
  expect(num(repayment, "y") + num(repayment, "height")).toBeCloseTo(axis, 5);
  const missing = part(chart, "Distributions FY2025E not published");
  expect(num(missing, "y") + num(missing, "height")).toBeCloseTo(axis, 5);
  expect(num(missing, "height")).toBe(8);
  // Beside the stated bar, not over it.
  expect(num(missing, "x")).toBeGreaterThanOrEqual(num(repayment, "x") + num(repayment, "width"));
  expect(chart.textContent).toContain("Distributions");
  expect(chart.textContent).toContain("Not published");
  expect(screen.getByText(/FY2025E Distributions: Dividends not modelled/u)).toBeTruthy();
  const dist = part(chart, "Distributions FY2026E");
  expect(num(dist, "y") + num(dist, "height")).toBeCloseTo(axis, 5);
});

it("leaves no empty band above the plot and keeps the drawing at its real width", () => {
  render(view());
  const chart = screen.getByRole("img");
  const axis = num(chart.querySelector("[data-axis]") as Element, "y1");
  expect(axis).toBe(172);
  expect(chart.getAttribute("viewBox")).toBe(
    `0 0 ${chart.getAttribute("width") ?? ""} ${chart.getAttribute("height") ?? ""}`,
  );
});

it("gives every label its own line so none overlaps another", () => {
  render(
    view(
      model([
        row("Distributions", [na("a"), value("20"), value("30")]),
        row("Debt repayment", [na("b"), value("10"), value("40")]),
      ]),
    ),
  );
  const chart = screen.getByRole("img");
  const lines = [...chart.querySelectorAll("text")]
    .filter((node) =>
      ["Distributions", "Debt repayment", "Not published"].includes(node.textContent),
    )
    .map((node) => `${node.getAttribute("x") ?? ""},${node.getAttribute("y") ?? ""}`);
  expect(lines.length).toBe(4);
  expect(new Set(lines).size).toBe(4);
  expect(num(chart, "height")).toBeGreaterThan(172 + 30);
});

it("keeps the view switch on its own row under the title", () => {
  render(view());
  const heading = screen.getByRole("heading", { name: /Uses of cash/u });
  const group = screen.getByRole("button", { name: "Chart" }).parentElement as Element;
  expect(heading.parentElement?.parentElement?.contains(group)).toBe(false);
});

it("shows a missing value as Not published with its reason in the notes", () => {
  render(view());
  expect(screen.getByRole("img").textContent).toContain("Not published");
  expect(screen.getByText(/FY2026E Debt repayment: Repayment not modelled/u)).toBeTruthy();
});

it("keeps a slot for a fiscal year the case has no column for, drawn as the labelled gap", () => {
  const gapped = model(
    [
      row("Distributions", [value("20"), value("30")]),
      row("Debt repayment", [value("50"), value("40")]),
    ],
    columnsFor(["FY2025E", "FY2027E"]),
  );
  render(view(gapped));
  const chart = screen.getByRole("img");
  expect(chart.textContent).toContain("FY2026E");
  expect(chart.textContent.match(/Not published/gu)?.length).toBe(2);
  expect(screen.getByText("FY2026E: not published for this case.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(screen.getAllByRole("row").map((item) => item.textContent)).toContain(
    "FY2026ENot publishedNot published",
  );
});

it("draws the gap state, not empty axes, for a case with no dated cells", () => {
  render(
    <UsesOfCash model={full} group="Downside case" caseName="Downside case" units="USD millions" />,
  );
  expect(
    screen.getByText("The model publishes no distributions or debt repayment for Downside case."),
  ).toBeTruthy();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("table")).toBeNull();
});

it("lists a negative value in the notes instead of stacking it", () => {
  render(
    view(
      model([
        row("Distributions", [value("-5"), value("1"), value("2")]),
        row("Debt repayment", [value("5"), value("1"), value("2")]),
      ]),
    ),
  );
  expect(screen.getByText(/FY2025E Distributions: -5 \(negative, not stacked\)/u)).toBeTruthy();
});

it("switches to the table view with the cells", () => {
  render(view());
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(screen.queryByRole("img")).toBeNull();
  const cells = screen.getAllByRole("row").map((item) => item.textContent);
  expect(cells).toContain("FY2025E2050");
  expect(cells).toContain("FY2026E0Repayment not modelled");
});

it("states a gap when neither row exists", () => {
  render(view(model([row("Revenue", [value("1"), value("2"), value("3")])])));
  expect(
    screen.getByText("The model publishes no distributions or debt repayment rows."),
  ).toBeTruthy();
});

it("traces each row with its own row name and the case", () => {
  const seen: unknown[] = [];
  render(
    <UsesOfCash
      model={full}
      group="Base case"
      caseName="Base"
      source={(name, selection) => {
        seen.push([name, selection]);
        return <button type="button">trace {selection?.row}</button>;
      }}
    />,
  );
  expect(seen).toEqual([
    ["Distributions", { case: "Base", rawGroup: "Base case", row: "Distributions" }],
    ["Debt repayment", { case: "Base", rawGroup: "Base case", row: "Debt repayment" }],
  ]);
  expect(screen.getByRole("button", { name: "trace Debt repayment" })).toBeTruthy();
});

it("lays the chart out at the measured width with token styling and no scroll wrapper", () => {
  const { container } = render(view());
  const chart = screen.getByRole("img");
  expect(chart.getAttribute("width")).toBe("600");
  expect(chart.getAttribute("viewBox")).toBe(`0 0 600 ${chart.getAttribute("height") ?? ""}`);
  expect(screen.queryByRole("region", { name: "Uses of cash chart" })).toBeNull();
  const html = container.innerHTML;
  expect(html).not.toContain("min-w-[30rem]");
  expect(html).not.toContain("fill-white");
  expect(html).not.toContain("text-[11px]");
  expect(html).not.toMatch(/style=|#[0-9a-f]{3,8}\b/iu);
});

it("shows units once in the kicker, and nothing when none are recorded", () => {
  const { unmount } = render(view(full, { units: "USD millions" }));
  expect(screen.getAllByText(/\$m/u)).toHaveLength(1);
  expect(document.body.textContent).not.toContain("USD millions");
  unmount();
  render(view(full, { units: "" }));
  expect(screen.getAllByText(/Units not recorded/u)).toHaveLength(1);
});

// Owner's ruling, 2026-11-25: every reported and pro forma column that states a figure is drawn
// before the forecast years, in the one period order. Expected values are written by hand.
it("draws the reported, LTM and pro forma columns before the forecast years, in period order", () => {
  const mixed = model(
    [
      row("Distributions", [
        value("12"),
        value("9"),
        na("Not reported"),
        value("11"),
        value("20"),
        value("30"),
      ]),
      row("Debt repayment", [
        value("45"),
        value("60"),
        na("Not reported"),
        na("No pro forma repayment"),
        value("50"),
        value("40"),
      ]),
    ],
    [
      { label: "LTM Jun 2025", group: "Last twelve months", start: "", end: "" },
      { label: "FY2024", group: "Fiscal year", start: "", end: "" },
      { label: "FY2023", group: "Fiscal year", start: "", end: "" },
      { label: "PF LTM Jun 2025", group: "Pro forma", start: "", end: "" },
      { label: "FY2026E", group: "Base case", start: "", end: "" },
      { label: "FY2025E", group: "Base case", start: "", end: "" },
    ],
  );
  render(view(mixed));
  expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
    [
      "Distributions FY2024 9",
      "Debt repayment FY2024 60",
      "Distributions LTM Jun 2025 12",
      "Debt repayment LTM Jun 2025 45",
      "Distributions PF LTM Jun 2025 11",
      "Debt repayment PF LTM Jun 2025 not published",
      "Distributions FY2025E 30",
      "Debt repayment FY2025E 40",
      "Distributions FY2026E 20",
      "Debt repayment FY2026E 50",
    ].join(", "),
  );
  expect(screen.getByText("PF LTM Jun 2025 Debt repayment: No pro forma repayment")).toBeVisible();
  expect(
    screen.getByText("Distributions: Before the forecast, FY2023: Not reported."),
  ).toBeVisible();
  expect(
    screen.getByText("Debt repayment: Before the forecast, FY2023: Not reported."),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(
    screen
      .getAllByRole("row")
      .slice(1)
      .map((item) => [...item.children].map((cell) => cell.textContent)),
  ).toEqual([
    ["FY2024", "9", "60"],
    ["LTM Jun 2025", "12", "45"],
    ["PF LTM Jun 2025", "11", "No pro forma repayment"],
    ["FY2025E", "30", "40"],
    ["FY2026E", "20", "50"],
  ]);
});

it("draws a figure the period rule cannot place last, after the forecast years, and says so", () => {
  const mixed = model(
    [
      row("Distributions", [value("7"), value("9"), value("20"), value("30")]),
      row("Debt repayment", [na("No run-rate repayment"), value("60"), value("50"), value("40")]),
    ],
    [
      { label: "Run rate", group: "Run rate", start: "", end: "" },
      { label: "FY2024", group: "Fiscal year", start: "", end: "" },
      { label: "FY2026E", group: "Base case", start: "", end: "" },
      { label: "FY2025E", group: "Base case", start: "", end: "" },
    ],
  );
  const { container } = render(view(mixed));
  expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
    [
      "Distributions FY2024 9",
      "Debt repayment FY2024 60",
      "Distributions FY2025E 30",
      "Debt repayment FY2025E 40",
      "Distributions FY2026E 20",
      "Debt repayment FY2026E 50",
      "Distributions Run rate 7",
      "Debt repayment Run rate not published",
    ].join(", "),
  );
  expect(container.querySelector('[data-part="Distributions Run rate"]')).not.toBeNull();
  expect(screen.getByText("Not placed in time order, shown last: Run rate.")).toBeVisible();
  expect(screen.getByText("Run rate Debt repayment: No run-rate repayment")).toBeVisible();
  expect(container.textContent).not.toContain("not drawn");
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(
    screen
      .getAllByRole("row")
      .slice(1)
      .map((item) => [...item.children].map((cell) => cell.textContent)),
  ).toEqual([
    ["FY2024", "9", "60"],
    ["FY2025E", "30", "40"],
    ["FY2026E", "20", "50"],
    ["Run rate", "7", "No run-rate repayment"],
  ]);
});

it("stacks the outside labels of one bar a text line apart so 0 and 92 do not overprint", () => {
  // FY2025E is large, so FY2026E's Distributions 0 and Debt repayment 92 are both too thin to
  // hold a label inside; both are written beside the bar.
  render(
    view(
      model([
        row("Distributions", [value("600"), value("0"), value("30")]),
        row("Debt repayment", [value("400"), value("92"), value("40")]),
      ]),
    ),
  );
  const chart = screen.getByRole("img");
  const beside = (text: string) => {
    const found = [...chart.querySelectorAll("text")].find(
      (node) => node.textContent === text && node.getAttribute("text-anchor") === "start",
    );
    if (!found) throw new Error(`no outside label ${text}`);
    return num(found, "y");
  };
  expect(Math.abs(beside("92") - beside("0"))).toBeGreaterThanOrEqual(16);
  expect(chart.getAttribute("aria-label")).toContain("Distributions FY2026E 0");
  expect(chart.getAttribute("aria-label")).toContain("Debt repayment FY2026E 92");
});

it("draws distributions in category slot 3 and debt repayment in slot 4 (ruling C6)", () => {
  render(view());
  const chart = screen.getByRole("img");
  expect(part(chart, "Distributions FY2025E")).toHaveClass("fill-category-3");
  expect(part(chart, "Debt repayment FY2025E")).toHaveClass("fill-category-4");
  expect(chart.querySelector(".fill-chart-1, .fill-chart-2")).toBeNull();
});
