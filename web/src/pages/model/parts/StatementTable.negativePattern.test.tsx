import { fireEvent, render, screen } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../../source";
import { StatementsPage } from "../StatementsPage";
import { fixtureSlice } from "../slice/test-fixture";

it("S5-019 gives negative statement bars a pattern while keeping their sign and value", () => {
  const data: LibraryData = { schema: "credit-os-data/1", issuers: [], model: fixtureSlice() };
  render(
    <SourceContext.Provider value={data}>
      <StatementsPage params={{ issuer: "transdigm", run: "2025-06-30" }} />
    </SourceContext.Provider>,
  );
  fireEvent.click(screen.getByRole("radio", { name: "Bars" }));
  const negative = screen.getByRole("table").querySelectorAll('[data-sign="negative"]');
  expect(negative.length).toBeGreaterThan(0);
  for (const bar of negative) expect(bar).toHaveClass("withheld-stripes");
  const positive = screen.getByRole("table").querySelectorAll('[data-sign="positive"]');
  for (const bar of positive) expect(bar).not.toHaveClass("withheld-stripes");
});
