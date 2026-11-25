import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { measuredAt } from "./resize.fixture";
import { useSvgScale } from "./svgScale";

afterEach(cleanup);

function Figure({ view }: { view: number }) {
  const { ref, font } = useSvgScale(view);
  return (
    <svg ref={ref} viewBox={`0 0 ${String(view)} 40`} width="100%">
      <text fontSize={font(11)}>label</text>
    </svg>
  );
}

it("keeps chart text at least 12 px on screen when its figure is drawn smaller than its viewBox", () => {
  const restore = measuredAt(204);
  const { container } = render(<Figure view={408} />);
  expect(Number(container.querySelector("text")?.getAttribute("font-size"))).toBe(24);
  restore();
});

it("keeps chart text at its size on screen when its figure is drawn larger than its viewBox", () => {
  const restore = measuredAt(816);
  const { container } = render(<Figure view={408} />);
  expect(Number(container.querySelector("text")?.getAttribute("font-size"))).toBe(6);
  restore();
});
