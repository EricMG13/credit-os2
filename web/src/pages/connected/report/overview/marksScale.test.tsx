import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DeltaBar, Ruler, Slope, SplitBar, type Mark, type Slot } from "./marks";
import { measuredAt } from "./resize.fixture";
import { outside, overprinted, struck, tooSmall } from "./svgText.fixture";

let restore = () => {};
afterEach(() => {
  restore();
  cleanup();
});

const at = (width: number) => {
  restore = measuredAt(width);
};

const slots = (unit: string, ...rows: [string, number][]): Slot[] =>
  rows.map(([label, value]) => ({ label, value, text: `${value.toFixed(2)}${unit}` }));
const mark = (label: string, value: number, text: string): Mark => ({ label, value, text });

/** Every text of the one figure on screen: big enough, inside, clear of lines and of each other. */
function readable(width: number, lines = "[data-segment]") {
  const figure = screen.getByRole("img");
  expect(figure.querySelectorAll("text").length).toBeGreaterThan(0);
  expect(tooSmall(figure, width)).toEqual([]);
  expect(outside(figure)).toEqual([]);
  expect(struck(figure, lines)).toEqual([]);
  expect(overprinted(figure)).toEqual([]);
  return figure;
}

/** Each figure's own value label is drawn, whatever had to be thinned. */
const values = (figure: Element, texts: string[]) => {
  const drawn = [...figure.querySelectorAll("text")].map((text) => text.textContent);
  for (const text of texts) expect(drawn).toContain(text);
};

describe("large marks drawn smaller than their viewBox", () => {
  it.each([300, 345])("keep the slope's text at least 12 px at %i px", (width) => {
    at(width);
    const marks = slots("x", ["FY2021", 3.1], ["FY2022", 3.75], ["FY2023", 3.0], ["FY2024", 2.8]);
    render(<Slope marks={marks} tone="better" suffix="x" label="Slope" />);
    values(readable(width, "line"), ["3.10x", "3.75x", "3.00x", "2.80x"]);
  });
});

describe("small marks drawn smaller than their viewBox", () => {
  it.each([120, 141])("keep the ruler's text at least 12 px at %i px", (width) => {
    at(width);
    render(
      <Ruler
        from={mark("FY2023", 3.2, "3.20x")}
        to={mark("FY2024", 4, "4.00x")}
        tone="better"
        suffix="x"
        label="Ruler"
      />,
    );
    readable(width);
  });

  it.each([120, 141])("keep the delta bar's figures whole and at least 12 px at %i px", (width) => {
    at(width);
    render(
      <DeltaBar
        from={mark("FY2023", 2100, "US$2,100m")}
        to={mark("FY2024", 2250, "US$2,250m")}
        tone="better"
        label="Delta"
      />,
    );
    values(readable(width), ["US$2,100m", "US$2,250m"]);
  });

  it.each([120, 141])("keep the split bar's figures whole and at least 12 px at %i px", (width) => {
    at(width);
    render(
      <SplitBar
        first={mark("FY2024", 275, "US$275m")}
        second={mark("FY2024", 400, "US$400m")}
        label="Split"
      />,
    );
    values(readable(width), ["US$275m", "US$400m"]);
  });
});

describe("the delta bar's changed part takes a direction's ink only when one is stated", () => {
  const changed = () => screen.getByRole("img").querySelectorAll("rect")[1];
  const draw = (from: number, to: number, tone: "better" | "worse" | "flat" | "none") => {
    at(200);
    render(
      <DeltaBar
        from={mark("FY2023", from, String(from))}
        to={mark("FY2024", to, String(to))}
        tone={tone}
        label="Delta"
      />,
    );
    return changed();
  };

  it.each(["none", "flat"] as const)("draws a fall with tone %s in neutral ink", (tone) => {
    const part = draw(300, 275, tone);
    expect(part).toHaveClass("fill-surface-subtle", "stroke-border-gap");
    expect(part?.getAttribute("class")).not.toMatch(
      /warning|better-mark|worse-mark|scale-better|scale-worse/,
    );
  });

  it("draws a fall the caller states as worse in the worse mark", () => {
    expect(draw(300, 275, "worse")).toHaveClass("fill-scale-worse-2", "stroke-worse-mark");
  });

  it("draws a fall the caller states as better in the better mark, never in the worse mark", () => {
    const part = draw(300, 275, "better");
    expect(part).toHaveClass("fill-scale-better-2", "stroke-better-mark");
    expect(part?.getAttribute("class")).not.toMatch(/warning|worse/);
  });

  it("draws a rise the caller states as worse in the worse mark", () => {
    expect(draw(275, 300, "worse")).toHaveClass("fill-worse-mark", "stroke-worse-mark");
  });

  it("draws a rise the caller states as better in the better mark", () => {
    expect(draw(275, 300, "better")).toHaveClass("fill-better-mark", "stroke-better-mark");
  });
});
