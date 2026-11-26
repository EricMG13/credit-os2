import { expect, it } from "vitest";
import { publishedTables, rangeTicks, ticks } from "./visualData";

const values = (series: number[], zero: boolean) => ticks(series, zero).map((t) => t.value);
const labels = (series: number[], zero: boolean) => ticks(series, zero).map((t) => t.label);

it("rounds a positive series to nice ticks from zero, with thousands separators", () => {
  expect(values([2180, 2667.5, 3155], true)).toEqual([0, 1000, 2000, 3000, 4000]);
  expect(labels([2180, 2667.5, 3155], true)).toEqual(["0", "1,000", "2,000", "3,000", "4,000"]);
});

it("starts an all-positive axis at zero whether or not zero is asked for", () => {
  const axis = ticks([11812.24, 12148], false);
  expect(axis[0]?.value).toBe(0);
  expect(axis.at(-1)?.value).toBeGreaterThanOrEqual(12148);
  for (const tick of axis) expect(tick.label).toMatch(/^\d{1,3}(,\d{3})*$/);
});

it("uses only the decimals the step needs", () => {
  expect(values([1.9, 2.095, 2.29], true)).toEqual([0, 0.5, 1, 1.5, 2, 2.5]);
  expect(labels([1.9, 2.095, 2.29], true)).toEqual(["0", "0.5", "1", "1.5", "2", "2.5"]);
});

it("ends an all-negative axis at zero", () => {
  const axis = values([-300, -120], false);
  expect(axis.at(-1)).toBe(0);
  expect(axis[0]).toBeLessThanOrEqual(-300);
});

it("brackets mixed data with nice bounds on both sides and keeps zero as a tick", () => {
  const axis = values([-40, 120], false);
  expect(axis[0]).toBeLessThanOrEqual(-40);
  expect(axis.at(-1)).toBeGreaterThanOrEqual(120);
  expect(axis).toContain(0);
  const steps = axis.slice(1).map((value, at) => value - (axis[at] ?? 0));
  for (const step of steps) expect(step).toBeCloseTo(steps[0] ?? 0, 9);
});

it("covers 500 seeded series with 3 to 6 equal steps", () => {
  let seed = 20261116;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let run = 0; run < 500; run += 1) {
    const scale = 10 ** Math.floor(next() * 9 - 4);
    const shift = next() < 0.4 ? -next() * scale * 5 : 0;
    const series = Array.from({ length: 1 + Math.floor(next() * 5) }, () => shift + next() * scale);
    const axis = values(series, next() < 0.5);
    expect(axis.length).toBeGreaterThanOrEqual(3);
    expect(axis.length).toBeLessThanOrEqual(6);
    expect(Math.min(...series)).toBeGreaterThanOrEqual((axis[0] ?? NaN) - 1e-9);
    expect(Math.max(...series)).toBeLessThanOrEqual((axis.at(-1) ?? NaN) + 1e-9);
    const step = (axis[1] ?? 0) - (axis[0] ?? 0);
    axis.slice(1).forEach((value, at) => {
      expect(Math.abs(value - (axis[at] ?? 0) - step)).toBeLessThan(1e-9);
    });
  }
});

it("treats a series with a non-finite value as empty and terminates", () => {
  const empty = ticks([], false);
  expect(ticks([Number.NaN, 3], false)).toEqual(empty);
  expect(ticks([Infinity], false)).toEqual(empty);
});

it("rejects a duplicate table line when its first occurrence is malformed", () => {
  const malformed = { type: "table", line: 12, headers: ["Label"], rows: [] };
  const valid = {
    type: "table",
    line: 12,
    headers: ["Label", "Value"],
    rows: [{ cells: ["Revenue", "10"] }],
  };
  const tables = publishedTables([{ blocks: [malformed, valid] }]);
  expect(tables.has(12)).toBe(false);
});

it("rejects a duplicate table line when the malformed occurrence follows a valid table", () => {
  const valid = {
    type: "table",
    line: 13,
    headers: ["Label", "Value"],
    rows: [{ cells: ["Revenue", "10"] }],
  };
  const malformed = { type: "table", line: 13, headers: ["Label"], rows: [] };
  expect(publishedTables([{ blocks: [valid, malformed] }]).has(13)).toBe(false);
});

it("labels range ticks without binary float noise and keeps the value", () => {
  const result = rangeTicks([3.07, 4.74]);
  expect(result.map((tick) => tick.label)).toEqual(["3.07", "3.905", "4.74"]);
  expect(result[1]?.value).toBe(3.07 + (4.74 - 3.07) / 2);
});
