// Pre-merge review probe: a chart's Table side (the Figure | Table switch every reader-page figure
// carries), the Forecast page's RunCharts "Table" row, the non-comparable-scale fallback table
// (visuals/index.tsx:213) and the CP-2D/CP-2H lead table views (leads/written.tsx rowBasis) draw a
// chart table's "Reporting unit" column. Input: the limits chart unitSites.test.tsx uses (stored
// unit "US$m"). The ruled form on a reader page is "$m". Exit 1 = a raw "US$m" is drawn.
// Run from web/: npx vitest run --config ../.superpowers/sdd/module-currency-symbols/probes/arch.vitest.config.mts
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { LegacyVisuals } from "@/pages/connected/visuals";
import { chartTable } from "@/pages/connected/visuals/visualData";
import { rowBasis } from "@/pages/connected/report/leads/written";

afterEach(cleanup);

const limitsTable = {
  type: "table",
  line: 20,
  headers: ["Test", "Threshold", "Current", "Direction", "Reporting unit", "Basis and limitation"],
  rows: [
    { cells: ["Liquidity", "500", "700", "Minimum", "US$m", "As defined."] },
    { cells: ["Cash", "300", "320", "Minimum", "US$m", "As defined."] },
  ],
};
const sections = [{ blocks: [limitsTable] }];

it("the Table side of a limits figure draws its Reporting unit cells as $m", () => {
  render(
    <LegacyVisuals
      output={{
        charts: [
          {
            title: "Liquidity headroom",
            table: 20,
            kind: "bullet",
            label: [0],
            current: 2,
            threshold: 1,
            direction: 3,
          },
        ],
      }}
      sections={sections as never}
      evidenceHref={(line) => `#evidence/${String(line)}`}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "Liquidity headroom" }));
  expect(figure.getByText("Minimum $500m")).toBeVisible();
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  const cells = figure.getAllByRole("cell").map((cell) => cell.textContent);
  expect(cells).not.toContain("US$m");
});

it("chartTable (every figure's Table side, RunCharts, the fallback table) draws the unit as $m", () => {
  const source = {
    line: 20,
    headers: limitsTable.headers,
    rows: limitsTable.rows.map((r) => r.cells),
  };
  const cells = chartTable(source).rows.flatMap((row) => row.cells);
  expect(cells).not.toContain("US$m");
});

it("rowBasis (CP-2D liquidity bridge and CP-2H trigger table views) draws the unit as $m", () => {
  const source = {
    line: 20,
    headers: ["Step", "Amount", "Reporting unit", "Basis and limitation"],
    rows: [["Opening cash", "900", "US$m", "Synthetic."]],
  };
  const cells = rowBasis(source).cells(0);
  expect(cells).not.toContain("US$m");
});
