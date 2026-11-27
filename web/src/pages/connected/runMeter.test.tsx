import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpendBlock } from "./runProgressParts";
import { CapBandKey, CapReading, Meter, capBand } from "./runMeter";

const CASES: [number, number, number, number][] = [
  [0, 30, 0, 1],
  [7.4, 30, 24, 1],
  [14.99, 30, 49, 1],
  [15, 30, 50, 2],
  [20.99, 30, 69, 2],
  [21, 30, 70, 3],
  [17.5, 25, 70, 3],
  [25.49, 30, 84, 3],
  [25.5, 30, 85, 4],
  [29.99, 30, 99, 4],
  [30, 30, 100, 5],
  [31, 30, 103, 5],
  [0.29, 1, 29, 1],
  [0.57, 1, 57, 2],
  [0.7, 1, 70, 3],
  [4.35, 5, 87, 4],
  [-1, 30, 0, 1],
  [14.996, 30, 49, 1],
  [29.9999, 30, 99, 4],
  [0.0049, 1, 0, 1],
  [1e-7, 30, 0, 1],
];

describe("capBand", () => {
  it.each(CASES)("%s of %s is %s percent, band %s", (value, max, percent, band) => {
    expect(capBand(value, max)).toEqual({ percent, band });
  });

  it.each([
    [NaN, 30],
    [5, NaN],
    [5, 0],
    [5, -10],
    [Infinity, 30],
  ])("throws RangeError for (%s, %s)", (value, max) => {
    expect(() => capBand(value, max)).toThrow(RangeError);
  });
});

describe("Meter fill", () => {
  const fill = (value: number, max: number, limit?: boolean) => {
    render(<Meter value={value} max={max} name="m" limit={limit} />);
    return screen.getByRole("progressbar").firstElementChild as HTMLElement;
  };

  it.each([
    [7.4, "bg-cap-band-1"],
    [25.5, "bg-cap-band-4"],
    [30, "bg-cap-band-5"],
  ])("with a limit, %s of 30 takes %s", (value, cls) => {
    expect(fill(value, 30, true)).toHaveClass(cls);
  });

  it("without a limit keeps the chart fill and no band", () => {
    const el = fill(2, 3);
    expect(el).toHaveClass("bg-chart-1");
    expect(el.className).not.toMatch(/bg-cap-band/);
  });
});

describe("CapReading", () => {
  it("reads the whole percent", () => {
    render(<CapReading value={7.4} max={30} />);
    expect(screen.getByText("24%")).toBeInTheDocument();
  });

  it("reads At the cap with no percent at band 5", () => {
    const { container } = render(<CapReading value={30} max={30} />);
    expect(container).toHaveTextContent("At the cap");
    expect(container.textContent).not.toContain("%");
  });
});

describe("CapBandKey", () => {
  it("names the five bands in order, hidden, no list, no amounts", () => {
    const { container } = render(<CapBandKey />);
    const words = [...container.querySelectorAll("p > span")].map((el) => el.textContent);
    expect(words).toEqual([
      "Under 50%",
      "50 to under 70%",
      "70 to under 85%",
      "85 to under 100%",
      "100% or more: at the cap",
    ]);
    expect(screen.getByText("Under 50%").closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector("ul, ol, li")).toBeNull();
    expect(container.textContent).not.toContain("USD");
  });
});

describe("SpendBlock", () => {
  it("fills the meter in its band and reads the percent beside it", () => {
    const spend = {
      value: "USD 7.40",
      bar: { value: 7.4, max: 30, label: "USD 7.40 of USD 30.00 cap usage" },
    };
    render(<SpendBlock spend={spend} parts={{ cap: "USD 30.00", settled: null, held: null }} />);
    expect(screen.getByRole("progressbar").firstElementChild).toHaveClass("bg-cap-band-1");
    expect(screen.getByRole("region", { name: "Spend" })).toHaveTextContent("24%");
  });
});
