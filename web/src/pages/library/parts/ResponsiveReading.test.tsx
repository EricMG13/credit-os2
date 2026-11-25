import { render, screen } from "@testing-library/react";
import { RunContext } from "./RunContext";
import { expect, it } from "vitest";
import { BottomLine } from "./BottomLine";
import { TraceButton } from "./TraceControl";

it("gives the bottom-line tile a compact padding for phones", () => {
  render(
    <RunContext.Provider value={{ traces: {}, open: () => {} }}>
      <BottomLine
        level="h2"
        text={{ label: "Bottom line", lead: "Watchlist", rest: "Review liquidity.", trace: null }}
      />
    </RunContext.Provider>,
  );
  const band = screen.getByRole("region", { name: "Bottom line" });
  expect(band.className).toContain("p-5");
  expect(band.className).toContain("sm:p-8");
});

it("keeps source controls 32 px on desktop and 44 px to the touch on narrow screens", () => {
  render(<TraceButton label="Show sources for this chart" open={() => {}} />);
  const button = screen.getByRole("button", { name: "Show sources for this chart" });
  expect(button.className).toContain("size-8");
  expect(button.className).toContain("max-[480px]:after:-inset-[7px]");
  expect(button.className).not.toContain("max-[480px]:size-11");
});
