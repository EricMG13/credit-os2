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

// S17-1-2 / S16-1-1: the lowest tick sits at the base and the highest at the top; zero is its own y.
it("places a net-cash value below the zero gridline, inside the figure", () => {
  const point = (period: string, v: number) => ({
    period,
    display: `${String(v)}x`,
    value: v,
    reason: "",
  });
  const g = pathGeometry([{ points: [point("FY2026E", 3), point("FY2027E", -2)] }]);
  const ys = g.lines.flat().map((p) => p.y ?? NaN);
  // Ticks span -2..3 (hand key): -2 at the base (130), 3 at the top (24), zero 2/5 of the way up.
  expect(ys[1]).toBe(130);
  expect(ys[0]).toBe(24);
  expect(g.zero).toBeCloseTo(130 - (2 / 5) * 106);
});

// S16-1-3: a case with only stated gaps stays in the path, after the cases with figures.
it("keeps a case whose every figure is a stated gap, after the stated ones", () => {
  const gap = { status: "na", exact: null, display: "n.m.", reason: "EBITDA not positive" };
  const path = forwardPath({
    cashflow: {
      columns: [column("FY2026E", "Base case"), column("FY2026E", "Downside case")],
      rows: [
        {
          label: "Net leverage (net debt / Adj EBITDA)",
          band: "Leverage",
          kind: "multiple",
          total: false,
          cells: [gap, value("2.5")],
        },
      ],
    },
  });
  expect(path?.cases.map((item) => item.group)).toEqual(["Downside case", "Base case"]);
  expect(path?.based).toBe(false);
  expect(path?.unbased).toBe("The model states no net leverage for the base case.");
});
