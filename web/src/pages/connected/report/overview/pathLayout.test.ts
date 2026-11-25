import { expect, it } from "vitest";
import { pathLayout } from "./pathLayout";
import { PATH } from "./stressData";

it("leaves out a period label that would print over a neighbour, keeping the first and the latest", () => {
  const periods = ["FY2025E", "FY2026E", "FY2027E"].map((period, at) => ({
    period,
    x: PATH.left + ((PATH.right - PATH.left) * at) / 2,
  }));
  const layout = pathLayout({ ticks: [], periods, lines: [] }, 150);
  const shown = layout.periods.filter((period) => period.label !== null);
  expect(shown.map(({ period }) => period)).toContain("FY2025E");
  expect(shown.map(({ period }) => period)).toContain("FY2027E");
  for (const [a, b] of shown.slice(1).map((item, at) => [shown[at], item] as const)) {
    const gap = (b.label ?? 0) - (a?.label ?? 0);
    // "FY2026E" at 12 px is about 42 px wide (7 characters at 6 px), written by hand.
    expect(gap).toBeGreaterThanOrEqual(42);
  }
  const wide = pathLayout({ ticks: [], periods, lines: [] }, 600);
  expect(wide.periods.every((period) => period.label !== null)).toBe(true);
});

it("leaves out a base-case value that would print over a neighbour's, keeping the latest", () => {
  const display = ["5.12x", "4.41x", "3.76x", "3.30x", "2.95x", "2.60x"];
  const points = display.map((text, at) => ({
    period: `FY${String(2025 + at)}E`,
    display: text,
    value: 5 - at,
    reason: "",
    x: PATH.left + 28 + ((PATH.right - PATH.left - 28) * at) / 5,
    y: 40 + at * 10,
  }));
  const narrow = pathLayout({ ticks: [], periods: [], lines: [points] }, 242);
  const shown = (narrow.lines[0] ?? []).filter((point) => point.label !== null);
  expect(shown.length).toBeLessThan(6);
  expect(shown.map(({ display }) => display)).toContain("2.60x");
  expect(shown.map(({ display }) => display)).toContain("5.12x");
  // "5.12x" is 5 characters at 7.4 px = 37 px wide: neighbours' centres sit at least 40 px apart.
  for (const [a, b] of shown.slice(1).map((item, at) => [shown[at], item] as const)) {
    expect((b.label ?? 0) - (a?.label ?? 0)).toBeGreaterThanOrEqual(40);
  }
  expect(narrow.lines[0]?.length).toBe(6);
  const wide = pathLayout({ ticks: [], periods: [], lines: [points] }, 900);
  expect((wide.lines[0] ?? []).every((point) => point.label !== null)).toBe(true);
});
