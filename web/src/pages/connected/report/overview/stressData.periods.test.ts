import { expect, it } from "vitest";
import { forwardPath, pathGeometry, pathPeriods } from "./stressData";

// Owner's ruling, 2026-11-25: periods on X in the one period order. The columns are authored
// scrambled; the expected orders are written by hand.
const value = (exact: string) => ({ status: "value", exact, display: `${exact}x` });
const column = (label: string, group: string) => ({
  label,
  group,
  start: "2025-01-01",
  end: "2025-12-31",
});

it("orders each case's forward path and the shared axis by period, not by column position", () => {
  const path = forwardPath({
    cashflow: {
      columns: [
        column("FY2027E", "Base case"),
        column("FY2025E", "Base case"),
        column("FY2026E", "Base case"),
        column("FY2028E", "Downside case"),
        column("FY2026E", "Downside case"),
      ],
      rows: [
        {
          label: "Net leverage (net debt / Adj EBITDA)",
          band: "Leverage",
          kind: "multiple",
          total: false,
          cells: [value("3.0"), value("5.0"), value("4.0"), value("6.5"), value("5.5")],
        },
      ],
    },
  });
  if (!path) throw new Error("no path");
  expect(
    path.cases.map(({ group, points }) => [group, points.map((p) => `${p.period} ${p.display}`)]),
  ).toEqual([
    ["Base case", ["FY2025E 5.0x", "FY2026E 4.0x", "FY2027E 3.0x"]],
    ["Downside case", ["FY2026E 5.5x", "FY2028E 6.5x"]],
  ]);
  expect(pathPeriods(path.cases)).toEqual(["FY2025E", "FY2026E", "FY2027E", "FY2028E"]);
  const geometry = pathGeometry(path.cases);
  expect(geometry.periods.map(({ period }) => period)).toEqual([
    "FY2025E",
    "FY2026E",
    "FY2027E",
    "FY2028E",
  ]);
  const xs = geometry.periods.map(({ x }) => x);
  expect([...xs].sort((a, b) => a - b)).toEqual(xs);
});
