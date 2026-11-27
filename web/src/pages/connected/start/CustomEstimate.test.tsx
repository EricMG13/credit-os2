import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstimateFigures } from "./CustomEstimate";

describe("EstimateFigures meter", () => {
  it("draws sum and hold against the ceiling, named and read in words", () => {
    render(<EstimateFigures sum={12.34} hold={1.5} cap={14} ceiling={50} />);
    const bar = screen.getByRole("progressbar", {
      name: "Estimate against the most a custom run may spend",
    });
    expect(bar).toHaveAttribute(
      "aria-valuetext",
      "USD 13.84 of USD 50.00, the most a custom run may spend",
    );
    expect(screen.getByText("27%")).toBeInTheDocument();
  });

  it.each([null, undefined])("draws no meter when the ceiling is %s", (ceiling) => {
    render(<EstimateFigures sum={12.34} hold={1.5} cap={14} ceiling={ceiling} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
