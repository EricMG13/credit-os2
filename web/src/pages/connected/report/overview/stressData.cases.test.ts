import { expect, it } from "vitest";
import { forwardPath } from "./stressData";

// The real model's grid (TDG replay run) sets `start` on reported columns too; only forecast
// periods are cases. Labels and figures are written by hand from that run's published grid.
const column = (label: string, group: string) => ({
  label,
  group,
  start: "2025-01-01",
  end: "2025-12-31",
});
const value = (exact: string) => ({ status: "value", exact, display: `${exact}x` });

it("takes cases only from forecast-period columns, not from reported ones", () => {
  const path = forwardPath({
    cashflow: {
      columns: [
        column("FY2023", "Fiscal year"),
        column("FY2024", "Fiscal year"),
        column("LTM FY2024", "Last twelve months"),
        column("Prior LTM", "Last twelve months"),
        column("FY2025E", "Base case"),
        column("FY2026E", "Base case"),
        column("FY2027E", "Base case"),
      ],
      rows: [
        {
          label: "Net leverage (net debt / Adj EBITDA)",
          band: "Leverage",
          kind: "multiple",
          total: false,
          cells: [
            value("6.0"),
            value("5.9"),
            value("5.8"),
            value("5.7"),
            value("5.12"),
            value("4.41"),
            value("3.76"),
          ],
        },
      ],
    },
  });
  if (!path) throw new Error("no path");
  expect(
    path.cases.map(({ group, points }) => [group, points.map((p) => `${p.period} ${p.display}`)]),
  ).toEqual([["Base case", ["FY2025E 5.12x", "FY2026E 4.41x", "FY2027E 3.76x"]]]);
});
