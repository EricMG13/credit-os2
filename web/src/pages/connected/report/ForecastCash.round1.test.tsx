import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UsesOfCash } from "./ForecastCash";

const columns = ["FY2025E", "FY2026E"].map((label) => ({
  label,
  group: "Base case",
  start: `${label.slice(2, 6)}-01-01`,
  end: `${label.slice(2, 6)}-12-31`,
}));
const value = (exact: string) => ({ status: "value", exact, display: exact });
const row = (label: string, cells: unknown[]) => ({
  label,
  band: "Cash",
  kind: "money",
  total: false,
  cells,
});

it("draws a cell's reason through the reader rule, never its file, page or register id", () => {
  const raw = {
    status: "na",
    display: "n.a.",
    reason: "Dividends not modelled (T2E.3.r03) see credit_agreement.pdf page 4",
  };
  const { container } = render(
    <UsesOfCash
      model={{
        cashflow: {
          units: "USD millions",
          columns,
          rows: [
            row("Distributions", [raw, value("30")]),
            row("Debt repayment", [value("50"), { status: "na", display: "n.a." }]),
          ],
        },
      }}
      group="Base case"
      caseName="Base case"
    />,
  );
  expect(container.textContent).not.toMatch(/credit_agreement|\.pdf|page 4|T2E\.3/u);
  expect(
    screen.getByText("FY2025E Distributions: Reason recorded in model evidence."),
  ).toBeTruthy();
  // An empty reason keeps today's fallback, with no suffix.
  expect(screen.getByText("FY2026E Debt repayment: No value published")).toBeTruthy();
});
