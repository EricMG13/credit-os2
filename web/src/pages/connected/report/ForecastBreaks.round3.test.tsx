import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { covenant, renderBreaks as breaks, standardDownside } from "./ForecastBreaks.fixture";

const legal = covenant("6.0x per credit_agreement.pdf", "Not supplied; E12");
const downside = standardDownside("6.0x per credit_agreement.pdf");

it("S2: a stated level the page cannot read is an amount; a written gap is a reason", () => {
  const { container } = breaks([legal, downside], "Not modelled; see Note 4");
  const text = container.textContent;
  expect(text).toContain("Level Amount recorded in model evidence.");
  expect(text).toContain("Current Reason recorded in model evidence.");
  expect(text).toContain("Cost shock, Net leverage (x): Amount recorded in model evidence.");
  expect(text).not.toMatch(/E12|Note 4|credit_agreement/u);
  expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
    "Net leverage (x) Amount recorded in model evidence.",
  );
  const region = within(screen.getByRole("region", { name: "Accessible liquidity, Base case" }));
  expect(region.getByText("n.a.: Reason recorded in model evidence.")).toBeInTheDocument();
});
