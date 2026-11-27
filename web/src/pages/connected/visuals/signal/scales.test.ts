import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMOUNT, BETTER, DIVERGING, NEUTRAL, POSITION, SECTOR, WORSE, step } from "./scales";

const theme = readFileSync(
  path.resolve(import.meta.dirname, "..", "..", "..", "..", "styles", "theme.css"),
  "utf8",
);

const exports = { POSITION, BETTER, WORSE, NEUTRAL, AMOUNT, DIVERGING, SECTOR };
const lengths = {
  POSITION: 4,
  BETTER: 3,
  WORSE: 3,
  NEUTRAL: 3,
  AMOUNT: 5,
  DIVERGING: 2,
  SECTOR: 8,
};

describe("scales", () => {
  for (const [name, scale] of Object.entries(exports)) {
    it(`${name} holds only var(--color-*) references of the expected length`, () => {
      expect(scale).toHaveLength(lengths[name as keyof typeof lengths]);
      for (const entry of scale) expect(entry).toMatch(/^var\(--color-[a-z0-9-]+\)$/);
    });

    it(`${name} names only variables theme.css declares`, () => {
      for (const entry of scale) {
        const variable = /^var\((--[a-z0-9-]+)\)$/.exec(entry)?.[1];
        expect(variable, entry).toBeDefined();
        expect(theme, entry).toMatch(new RegExp(`${variable ?? ""}:\\s*[^;]+;`));
      }
    });
  }

  it("bins a share on a 4-step scale into equal widths, clamping outside 0..1", () => {
    const cases: [number, number][] = [
      [0, 0],
      [0.24, 0],
      [0.25, 1],
      [0.5, 2],
      [0.99, 3],
      [1, 3],
      [-1, 0],
      [2, 3],
    ];
    for (const [share, index] of cases)
      expect(step(share, POSITION), String(share)).toBe(POSITION[index]);
  });

  it("bins a share on a 3-step scale", () => {
    expect(step(0.33, BETTER)).toBe(BETTER[0]);
    expect(step(0.34, BETTER)).toBe(BETTER[1]);
    expect(step(0.67, BETTER)).toBe(BETTER[2]);
  });

  it("throws a RangeError for a NaN share and for an empty scale", () => {
    expect(() => step(Number.NaN, POSITION)).toThrow(new RangeError("step: share is NaN"));
    expect(() => step(0.5, [])).toThrow(new RangeError("step: scale is empty"));
  });
});
