import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FindingParagraph } from "@/pages/connected/ReportContent";
import type { TreeNode } from "../slice";
import { DerivationTree } from "./DerivationTree";
import { RunContext } from "./RunContext";
import { TraceButton } from "./TraceControl";

const LONG = "0.060079470198675496688741721854304635762";
const leaf = (label: string, value: string | null): TreeNode => ({
  label,
  value,
  note: null,
  children: [],
});

it("draws the trace control visible at rest, without a ring glyph", () => {
  const { container } = render(
    <TraceButton label="Show sources for this passage" open={() => {}} />,
  );
  const button = screen.getByRole("button", { name: "Show sources for this passage" });
  expect(button.className).not.toContain("opacity-0");
  expect(button.className).toContain("size-8");
  expect(button.className).not.toContain("max-[480px]:size-11");
  expect(button.getAttribute("aria-label")).toBe("Show sources for this passage");
  expect(container.querySelectorAll("svg")).toHaveLength(1);
  expect(container.querySelector(".rounded-ds-full")).toBeNull();
});

it("keeps a finding paragraph at a readable measure with its control beside it", () => {
  render(
    <RunContext.Provider value={{ traces: { t: leaf("x", "1") } as never, open: () => {} }}>
      <FindingParagraph
        block={{ type: "text", line: 3, text: "Leverage fell. Basis: x", end: 3 }}
        trace="t"
        href="#e"
      />
    </RunContext.Provider>,
  );
  const p = screen.getByText(/Leverage fell/);
  expect(p).toHaveClass("reading-copy");
  expect(p.parentElement?.className).not.toContain("justify-between");
});

it("wraps a long unbroken value inside the drawer without altering it", () => {
  render(<DerivationTree node={leaf("Ratio", LONG)} />);
  const matches = screen.getAllByText(LONG);
  expect(matches).toHaveLength(1);
  expect(matches[0]?.className).toContain("wrap-anywhere");
});

it("draws a missing basis with the gap treatment and keeps the recorded words", () => {
  render(<DerivationTree node={leaf("Basis was not recorded for this item", null)} />);
  const words = screen.getByText("Basis was not recorded for this item");
  expect(words.className).toContain("gap-hatch");
});

it("says a derivation nobody recorded is not recorded, instead of a bare label", () => {
  render(
    <DerivationTree
      node={{ label: "Evidence retained with this item", value: "", note: null, children: [] }}
    />,
  );
  expect(screen.getByText("No derivation was recorded for this item.")).toBeVisible();
  expect(screen.queryByText("Evidence retained with this item")).toBeNull();
});
