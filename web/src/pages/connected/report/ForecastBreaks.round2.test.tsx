import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { covenant, renderBreaks as breaks, standardDownside } from "./ForecastBreaks.fixture";

const legal = covenant("5.0", "Not supplied: see credit_agreement.pdf p.4");
const downside = standardDownside("Not calculated see annual_report.pdf p.9");

it("R1: a covenant cell with no value that cites a source is a reason, not an amount", () => {
  const { container } = breaks([legal, downside]);
  expect(container.textContent).not.toContain("Amount recorded in model evidence");
  expect(container.textContent).toContain("Current Reason recorded in model evidence.");
});

it("R5: the stress note ends in one stop", () => {
  const { container } = breaks([legal, downside]);
  expect(container.textContent).toContain("Reason recorded in model evidence.");
  expect(container.textContent).not.toMatch(/\.\./u);
});

it("R7: a whitespace-only liquidity reason is drawn as no reason", () => {
  breaks([legal, downside], "   ");
  const region = within(screen.getByRole("region", { name: "Accessible liquidity, Base case" }));
  expect(region.getByText("n.a.")).toBeInTheDocument();
});
