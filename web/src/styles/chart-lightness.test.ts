import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
const css = readFileSync(path.join(import.meta.dirname, "theme.css"), "utf8");
function luminance(hex: string) {
  const c = hex
    .match(/../g)
    ?.map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  if (!c) throw new Error("NoRGB");
  return (c[0] ?? 0) * 0.2126 + (c[1] ?? 0) * 0.7152 + (c[2] ?? 0) * 0.0722;
}
it("separates the first three chart series in grayscale while keeping every one visible on white", () => {
  const light = [1, 2, 3].map((n) => {
    const hex = new RegExp(`--color-chart-${String(n)}: #([0-9a-f]{6})`).exec(css)?.[1];
    if (!hex) throw new Error("Missingchartcolor");
    return luminance(hex);
  });
  for (let a = 0; a < 3; a++) {
    expect(1.05 / ((light[a] ?? 0) + 0.05)).toBeGreaterThanOrEqual(3);
    for (let b = a + 1; b < 3; b++)
      expect(
        (Math.max(light[a] ?? 0, light[b] ?? 0) + 0.05) /
          (Math.min(light[a] ?? 0, light[b] ?? 0) + 0.05),
      ).toBeGreaterThanOrEqual(2);
  }
});
