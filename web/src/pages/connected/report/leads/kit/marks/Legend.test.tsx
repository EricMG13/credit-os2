import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Legend, type LegendColour } from "./Legend";

afterEach(cleanup);

const swatch = (tone: LegendColour, kind: "dot" | "line" | "square" = "dot") => {
  const { container } = render(<Legend items={[{ kind, tone, text: "Entry" }]} />);
  return container.querySelector(`[data-swatch="${kind}"]`);
};

it("draws better and worse-mark in the better and worse marks", () => {
  expect(swatch("better")).toHaveClass("fill-better-mark");
  cleanup();
  expect(swatch("worse-mark")).toHaveClass("fill-worse-mark");
  cleanup();
  expect(swatch("better", "line")).toHaveClass("stroke-better-mark");
  cleanup();
  expect(swatch("worse-mark", "line")).toHaveClass("stroke-worse-mark");
});

it("keeps worse as the older signal orange", () => {
  expect(swatch("worse")).toHaveClass("fill-warning-mark");
});

it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)("draws category-%i in its category colour", (n) => {
  expect(swatch(`category-${String(n) as "1"}`)).toHaveClass(`fill-category-${String(n)}`);
});

it.each([1, 2, 3, 4, 5] as const)("draws amount-%i outlined, in its amount step", (n) => {
  const tone = `amount-${String(n) as "1"}` as const;
  expect(swatch(tone, "square")).toHaveClass(
    `fill-scale-amount-${String(n)}`,
    "stroke-scale-amount-edge",
  );
  expect(swatch(tone, "square")).toHaveAttribute("stroke-width", "1.5");
});
