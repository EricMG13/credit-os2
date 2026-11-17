import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Calendar } from "./Calendar";

function gapCalendar(reason: string) {
  return {
    rows: [],
    gaps: [{ owner: "Liquidity", href: "#evidence/x-4", title: "Dates", reason }],
  };
}

it("says a date gap is recorded in Evidence without naming the hand-over between modules", () => {
  render(<Calendar calendar={gapCalendar("Dates are in annual_report.pdf p.12")} />);
  expect(screen.getByRole("note")).toHaveTextContent("An event gap is recorded in Evidence.");
  expect(document.body.textContent).not.toMatch(/handoff/i);
});

it("draws a gap reason that names a module by the module's name", () => {
  render(<Calendar calendar={gapCalendar("No maturity dates were supplied (CP-2D).")} />);
  expect(screen.getByRole("note")).toHaveTextContent(
    "No maturity dates were supplied (Liquidity).",
  );
  expect(document.body.textContent).not.toMatch(/\bCP-/);
});
