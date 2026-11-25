import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { ForecastGrid, type GridColumn, type GridRow } from "./ForecastGrid";

const value = (display: string) => ({ status: "value", exact: display, display });
const gap = (reason: string, display = "n.a.") => ({ status: "na", exact: null, display, reason });
const NOT_WRITTEN = "the forward model did not write this year";

const years = (band: string, labels = ["FY2026E", "FY2027E", "FY2028E"]): GridColumn[] =>
  labels.map((label) => ({ label, band }));

function row(label: string, cells: Record<string, unknown>[], extra: Partial<GridRow> = {}) {
  return { label, band: "Operating", family: "Accounts", total: false, cells, ...extra };
}

const figures = (label: string, extra: Partial<GridRow> = {}) =>
  row(label, ["1", "2", "3"].map(value), extra);

const KEY_ROWS = {
  matches: (candidate: GridRow) => candidate.total || /leverage/i.test(candidate.label),
  description: "Totals and leverage",
};

function draw(rows: GridRow[], columns = years("Forecast · Base case"), keyRows = KEY_ROWS) {
  render(
    <ForecastGrid
      name="Forecast grid"
      columns={columns}
      rows={rows}
      keyRows={keyRows}
      source={(label) => <button type="button">{`Show sources for ${label}`}</button>}
    />,
  );
  return within(screen.getByRole("table", { name: "Forecast grid" }));
}

it("scrolls both ways in its own named, focusable region, its labels pinned to the edges", () => {
  const table = draw([figures("Revenue", { total: true })]);
  const region = screen.getByRole("region", { name: "Forecast grid table" });
  expect(region).toHaveAttribute("tabindex", "0");
  expect(region.className).toContain("overflow-auto");
  expect(region.className).toContain("max-h-[50vh]");
  // Both header rows stick to the top together, over an opaque ground.
  const head = region.querySelector("thead");
  expect(head?.className).toMatch(/\bsticky\b/);
  expect(head?.className).toContain("top-0");
  // The top-left corner sits above the sticky header row and the sticky first column.
  const corner = table.getByRole("columnheader", { name: "Measure" });
  expect(corner.className).toMatch(/\bsticky\b/);
  expect(corner.className).toContain("left-0");
  expect(corner.className).toContain("bg-surface-subtle");
  const label = table.getByRole("rowheader", { name: "Revenue" });
  expect(label.className).toContain("left-0");
  expect(label.className).toContain("bg-surface-card");
  // The band label, a full-width cell, keeps its words in a sticky, opaque inner element.
  const band = table.getByRole("rowheader", { name: "Operating Accounts" });
  const pinned = band.querySelector(".sticky");
  expect(pinned).not.toBeNull();
  expect(pinned?.className).toContain("left-0");
  expect(pinned?.className).toContain("bg-surface-subtle");
  expect(pinned).toHaveTextContent("Operating Accounts");
});

it("collapses the measures with no figure in any shown column into one disclosed row", () => {
  const table = draw([
    figures("Revenue"),
    row("Capex", [gap(NOT_WRITTEN), gap(NOT_WRITTEN), gap(NOT_WRITTEN)]),
    row("Dividends", [gap(NOT_WRITTEN), gap("another reason"), gap("another reason", "n.m.")]),
    figures("EBITDA"),
  ]);
  expect(table.queryByRole("rowheader", { name: "Capex" })).toBeNull();
  expect(table.queryByRole("rowheader", { name: "Dividends" })).toBeNull();
  const toggle = table.getByRole("button", {
    name: "2 measures with no figure in any column shown",
  });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle.className).toContain("min-h-8");
  expect(toggle.className).toContain("max-[480px]:min-h-11");
  // The rows with figures are unchanged.
  expect(table.getByRole("rowheader", { name: "Revenue" })).toBeInTheDocument();
  expect(table.getByRole("rowheader", { name: "EBITDA" })).toBeInTheDocument();
  // Their gap words are explained in the key, whether or not the list is open.
  expect(screen.getByRole("list", { name: "Gap key" })).toHaveTextContent("n.m.");

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const capex = table.getByRole("rowheader", { name: "Capex" }).closest("tr") as HTMLElement;
  const capexCells = within(capex).getAllByRole("cell");
  expect(capexCells[0]).toHaveAttribute("colspan", "3");
  expect(capexCells[0]).toHaveAccessibleName(`n.a. ${NOT_WRITTEN}`);
  expect(capexCells[0]).toHaveAttribute("title", NOT_WRITTEN);
  expect(within(capex).getByRole("button", { name: "Show sources for Capex" })).toBeVisible();
  const dividends = table.getByRole("rowheader", { name: "Dividends" }).closest("tr");
  expect(
    within(dividends as HTMLElement)
      .getAllByRole("cell")
      .map((cell) => cell.getAttribute("aria-label") ?? cell.textContent),
  ).toEqual([
    `n.a. ${NOT_WRITTEN}`,
    "n.a. another reason",
    "n.m. another reason",
    "Show sources for Dividends",
  ]);
  // A cell's recorded reason stays its title and accessible name, never page text.
  expect(document.body.textContent).not.toContain(NOT_WRITTEN);

  fireEvent.click(toggle);
  expect(table.queryByRole("rowheader", { name: "Capex" })).toBeNull();
});

it("leaves a single measure with no figure in place", () => {
  const table = draw([
    figures("Revenue"),
    row("Capex", [gap(NOT_WRITTEN), gap(NOT_WRITTEN), gap(NOT_WRITTEN)]),
  ]);
  expect(table.getByRole("rowheader", { name: "Capex" })).toBeInTheDocument();
  expect(table.queryByRole("button", { name: /no figure/ })).toBeNull();
});

it("draws every row in place where no row has a figure, the gaps being the statement", () => {
  const blankRow = (label: string) => row(label, [gap(NOT_WRITTEN), gap(NOT_WRITTEN)]);
  const table = draw(
    [blankRow("Revenue"), blankRow("Capex")],
    years("Forecast · Downside", ["FY2026E", "FY2027E"]),
  );
  for (const label of ["Revenue", "Capex"])
    expect(table.getByRole("rowheader", { name: label })).toBeInTheDocument();
  expect(table.queryByRole("button", { name: /no figure/ })).toBeNull();
});

it("opens a long statement on its key rows, every row one press away", () => {
  const plain = Array.from({ length: 12 }, (_, index) =>
    figures(`Line ${String(index + 1)}`, { band: index < 6 ? "Operating" : "Working capital" }),
  );
  const table = draw([
    figures("Revenue", { total: true }),
    ...plain,
    figures("Net leverage", { band: "Credit metrics", family: "Ratios" }),
  ]);
  const rows = screen.getByRole("group", { name: "Grid rows" });
  const keyButton = within(rows).getByRole("button", { name: "Key rows" });
  const allButton = within(rows).getByRole("button", { name: "All rows" });
  expect(keyButton).toHaveAttribute("aria-pressed", "true");
  expect(allButton).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByText("Totals and leverage: 2 of 14 rows.")).toBeInTheDocument();
  expect(table.getByRole("rowheader", { name: "Revenue" })).toBeInTheDocument();
  expect(table.getByRole("rowheader", { name: "Net leverage" })).toBeInTheDocument();
  expect(table.queryByRole("rowheader", { name: "Line 1" })).toBeNull();
  // The shown rows keep their band headings; a band with no shown row draws none.
  expect(table.getByRole("rowheader", { name: "Operating Accounts" })).toBeInTheDocument();
  expect(table.getByRole("rowheader", { name: "Credit metrics Ratios" })).toBeInTheDocument();
  expect(table.queryByRole("rowheader", { name: /^Working capital/ })).toBeNull();

  fireEvent.click(allButton);
  expect(allButton).toHaveAttribute("aria-pressed", "true");
  for (const { label } of plain)
    expect(table.getByRole("rowheader", { name: label })).toBeVisible();
  expect(table.getByRole("rowheader", { name: /^Working capital/ })).toBeInTheDocument();
  expect(screen.getByText("All 14 rows.")).toBeInTheDocument();
});

it("shows every row of a short statement, with no row switch", () => {
  const table = draw([figures("Revenue", { total: true }), figures("Capex")]);
  expect(screen.queryByRole("group", { name: "Grid rows" })).toBeNull();
  expect(table.getByRole("rowheader", { name: "Capex" })).toBeInTheDocument();
});

it("wraps a long case band so the columns under it stay even", () => {
  const long = "Forecast · Downside with covenant reset and delayed asset disposal";
  const table = draw([figures("Revenue")], years(long, ["FY2027E"]));
  const header = table.getByRole("columnheader", { name: long });
  expect(header.className).toContain("whitespace-normal");
  const words = header.querySelector(".max-w-\\[9rem\\]");
  expect(words).not.toBeNull();
  expect(words?.className).toContain("text-balance");
});

it("draws a band once where its only column carries the band's own name", () => {
  const table = draw(
    [row("Revenue", [gap(NOT_WRITTEN), value("10")])],
    [
      { label: "Quarter", band: "Quarter", title: "2025-01-01 to 2025-03-31" },
      { label: "FY2025", band: "Fiscal year" },
    ],
  );
  const quarter = table.getAllByRole("columnheader", { name: "Quarter" });
  expect(quarter).toHaveLength(1);
  expect(quarter[0]).toHaveAttribute("rowspan", "2");
  expect(quarter[0]).toHaveAttribute("title", "2025-01-01 to 2025-03-31");
  expect(table.getByRole("columnheader", { name: "Fiscal year" })).toBeInTheDocument();
  expect(table.getByRole("columnheader", { name: "FY2025" })).toBeInTheDocument();
  // The row's cells still line up under the columns.
  const cells = within(
    table.getByRole("rowheader", { name: "Revenue" }).closest("tr") as HTMLElement,
  )
    .getAllByRole("cell")
    .map((cell) => cell.getAttribute("aria-label") ?? cell.textContent);
  expect(cells).toEqual([`n.a. ${NOT_WRITTEN}`, "10", "Show sources for Revenue"]);
});
