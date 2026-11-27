import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Sparkline } from "./Sparkline";

afterEach(cleanup);

const draw = (values: readonly (string | null)[], end?: string) =>
  render(<Sparkline values={values} label="Net sales, FY2021 to FY2024" end={end} />);

describe("Sparkline", () => {
  it("draws an isolated figure, a gap and the end figure without bridging the null", () => {
    const { container } = draw(["4.8", null, "4.4"]);
    expect(container.querySelectorAll("path")).toHaveLength(0);
    expect(container.querySelectorAll('circle[data-value="4.8"]:not([data-end])')).toHaveLength(1);
    const end = container.querySelectorAll("circle[data-end]");
    expect(end).toHaveLength(1);
    expect(end[0]?.getAttribute("data-value")).toBe("4.4");
    expect(container.querySelectorAll("line[data-gap]")).toHaveLength(1);
  });
  it("draws nothing with fewer than two figures", () => {
    expect(draw(["4.8"]).container).toBeEmptyDOMElement();
    cleanup();
    expect(draw([null, "4.4", null]).container).toBeEmptyDOMElement();
  });
  it("draws one path through consecutive figures, the end circle on the last", () => {
    const { container } = draw(["1", "2", "3"]);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(1);
    expect(paths[0]?.getAttribute("data-values")).toBe("1 2 3");
    expect(container.querySelector("circle[data-end]")?.getAttribute("data-value")).toBe("3");
    expect(container.querySelectorAll("line[data-gap]")).toHaveLength(0);
  });
  it("breaks the line at a null: two paths and one gap mark", () => {
    const { container } = draw(["1", "2", null, "3", "4"]);
    const paths = [...container.querySelectorAll("path")].map((p) => p.getAttribute("data-values"));
    expect(paths).toEqual(["1 2", "3 4"]);
    expect(container.querySelectorAll("line[data-gap]")).toHaveLength(1);
  });
  it("is named by its label", () => {
    draw(["1", "2", "3"]);
    expect(screen.getByRole("img", { name: "Net sales, FY2021 to FY2024" })).toBeInTheDocument();
  });
  it("rejects a string that is not a plain decimal, naming it", () => {
    for (const bad of ["", "1,250", "1e3", " ", "Infinity"])
      expect(() => draw(["1", bad])).toThrow(RangeError);
    expect(() => draw(["1", "1,250"])).toThrow(/1,250/);
  });
  it("colours only the end circle from the end prop", () => {
    const { container } = draw(["1", "2", "3"], "var(--color-better-mark)");
    const end = container.querySelector("circle[data-end]");
    expect(end?.getAttribute("style") ?? "").toContain("var(--color-better-mark)");
    expect(container.querySelector("path")?.getAttribute("style")).toBeNull();
  });
  it("uses the ink fill when no end colour is given", () => {
    const { container } = draw(["1", "2", "3"]);
    expect(container.querySelector("circle[data-end]")).toHaveClass("fill-text-secondary");
  });
  it("draws a flat series as a mid-height line", () => {
    const { container } = draw(["5", "5", "5"]);
    const ys = [...container.querySelectorAll("circle[data-end]")].map((c) => c.getAttribute("cy"));
    expect(ys).toEqual(["8"]);
  });
  it("rejects a decimal string too long to be a finite number, naming it", () => {
    const long = "9".repeat(400);
    expect(() => draw(["1", long])).toThrow(RangeError);
    expect(() => draw(["1", long])).toThrow(long);
  });
  it("takes the extremes of a long series without a spread", () => {
    const values = Array.from({ length: 200000 }, (_, at) => String(at));
    const { container } = draw(values);
    expect(container.querySelector("circle[data-end]")?.getAttribute("data-value")).toBe("199999");
  });
  it("places finite extremes and distinct large integers from exact decimal differences", () => {
    const extremes = draw(["-" + "1" + "0".repeat(308), "0", "1" + "0".repeat(308)]);
    expect(extremes.container.querySelector("path")?.getAttribute("d")).toBe("M2 14 L30 8 L58 2");
    cleanup();
    const precise = draw(["9007199254740992", "9007199254740993", "9007199254740994"]);
    expect(precise.container.querySelector("path")?.getAttribute("d")).toBe("M2 14 L30 8 L58 2");
  });
  it("rejects a width or height that leaves no room inside the inset", () => {
    expect(() => render(<Sparkline values={["1", "2"]} width={4} label="x" />)).toThrow(RangeError);
    expect(() => render(<Sparkline values={["1", "2"]} height={4} label="x" />)).toThrow(
      RangeError,
    );
  });
});
