import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { BarCell } from "./BarCell";

afterEach(cleanup);

const fill = (container: HTMLElement) => container.querySelector('[style*="width"]');

it.each([
  [1, "bg-scale-amount-5"],
  [0.5, "bg-scale-amount-3"],
  [0.19, "bg-scale-amount-1"],
  [0.2, "bg-scale-amount-2"],
  [0.8, "bg-scale-amount-5"],
])("draws share %s in %s with an inset edge when the tone is amount", (share, expected) => {
  const { container } = render(<BarCell text="1" share={share} tone="amount" />);
  expect(fill(container)).toHaveClass(expected, "ring-1", "ring-inset", "ring-scale-amount-edge");
});

it("draws no fill for a missing share and a tick for zero under the amount tone", () => {
  const { container, rerender } = render(<BarCell text="n/a" share={null} tone="amount" />);
  expect(fill(container)).toBeNull();
  expect(container.querySelector("[class*=scale-amount]")).toBeNull();
  rerender(<BarCell text="0" share={0} tone="amount" />);
  expect(fill(container)).toBeNull();
  expect(container.querySelector(".w-px")).not.toBeNull();
  expect(container.querySelector("[class*=scale-amount]")).toBeNull();
});

it("keeps the 2 px floor under the amount tone", () => {
  const { container } = render(<BarCell text="1" share={0.001} tone="amount" minimum={3} />);
  expect(fill(container)).toHaveStyle({ minWidth: "3px" });
  expect(fill(container)).toHaveClass("bg-scale-amount-1");
});

it("treats a NaN share as the other tones do, a tick and no amount colour", () => {
  const { container } = render(<BarCell text="x" share={Number.NaN} tone="amount" />);
  expect(fill(container)).toBeNull();
  expect(container.querySelector("[class*=scale-amount]")).toBeNull();
});

it("leaves the default tone on bg-chart-1 with no edge", () => {
  const { container } = render(<BarCell text="1" share={0.5} />);
  expect(fill(container)).toHaveClass("bg-chart-1");
  expect(fill(container)?.className).not.toContain("ring");
});
