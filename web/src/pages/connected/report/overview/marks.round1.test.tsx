import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SplitBar } from "./marks";
import { measuredAt } from "./resize.fixture";

let restore = () => {};
afterEach(() => {
  restore();
  cleanup();
});

const mark = (value: number, text: string) => ({ label: "FY2024", value, text });

it("C5-2 keeps a small stated part visible and every width inside the frame", () => {
  restore = measuredAt(184);
  render(<SplitBar first={mark(1, "$1m")} second={mark(400, "$400m")} label="Split" />);
  const [first, second] = [...screen.getByRole("img").querySelectorAll("rect")];
  const box = (rect: SVGRectElement | undefined) => ({
    x: Number(rect?.getAttribute("x")),
    width: Number(rect?.getAttribute("width")),
  });
  expect(box(first).width).toBe(2);
  expect(box(second).width).toBeGreaterThanOrEqual(2);
  expect(box(second).x + box(second).width).toBeLessThanOrEqual(184);
  expect(box(second).x).toBeGreaterThanOrEqual(box(first).x + box(first).width);
});

it("C5-2 keeps the large part's end inside the frame when the other part is tiny", () => {
  restore = measuredAt(184);
  render(<SplitBar first={mark(400, "$400m")} second={mark(1, "$1m")} label="Split" />);
  const [first, second] = [...screen.getByRole("img").querySelectorAll("rect")];
  expect(Number(second?.getAttribute("width"))).toBe(2);
  expect(Number(second?.getAttribute("x")) + 2).toBeLessThanOrEqual(184);
  expect(Number(first?.getAttribute("x")) + Number(first?.getAttribute("width"))).toBeLessThan(
    Number(second?.getAttribute("x")),
  );
});
