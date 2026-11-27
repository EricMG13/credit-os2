// Synthetic mark inputs. Labels and values are asserted as written in the test.
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { niceAxis } from "./axis";
import { Dumbbell } from "./Dumbbell";

describe("axis and dumbbell fidelity", () => {
  it("keeps distinct sub-micro tick labels and positions", () => {
    const axis = niceAxis([0.0000002, 0.0000007], { zero: true });
    expect(axis.ticks).toEqual([
      { value: 0, label: "0.0000000" },
      { value: 0.0000002, label: "0.0000002" },
      { value: 0.0000004, label: "0.0000004" },
      { value: 0.0000006, label: "0.0000006" },
      { value: 0.0000008, label: "0.0000008" },
    ]);
    expect(axis.place(axis.ticks.at(-1)?.value ?? 0, 0, 100)).toBe(100);
  });

  it("retains the extra decimal places of an explicit cut", () => {
    const axis = niceAxis([4, 13], { zero: false, start: 2.25, suffix: "x" });
    expect(axis.ticks).toEqual([
      { value: 2.25, label: "2.25x" },
      { value: 4.75, label: "4.75x" },
      { value: 7.25, label: "7.25x" },
      { value: 9.75, label: "9.75x" },
      { value: 12.25, label: "12.25x" },
      { value: 14.75, label: "14.75x" },
    ]);
    expect(axis.place(2.25, 0, 100)).toBe(0);
    expect(axis.place(14.75, 0, 100)).toBe(100);
  });

  it("aligns a fractional cut endpoint with the final tick", () => {
    const axis = niceAxis([0.27, 0.95], { zero: false, start: 0.17 });
    expect(axis.ticks.at(-1)).toEqual({ value: 0.97, label: "0.97" });
    expect(axis.end).toBe(0.97);
    expect(axis.place(0.97, 0, 100)).toBe(100);
  });

  it("keeps the wrapped qualification below a change placed on the label line", () => {
    const note = "The earlier period was recalculated to account for the amended perimeter.";
    const { container } = render(
      <Dumbbell
        width={270}
        periods={{ prior: "2023", current: "2024" }}
        unit="x"
        rows={[
          {
            label: "Coverage",
            prior: { value: 2, text: "2" },
            current: { value: 4, text: "4" },
            change: "+2",
            note,
          },
        ]}
      />,
    );
    const lines = [...container.querySelectorAll('[data-part="note"]')].map(
      (line) => line.textContent,
    );
    expect(lines.join(" ")).toBe(note);
    expect(lines.length).toBeGreaterThan(1);
    expect(container.querySelector('[data-part="change"]')?.textContent).toBe("+2");
  });
});
