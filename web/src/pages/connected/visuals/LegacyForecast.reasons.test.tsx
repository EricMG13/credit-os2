import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CashProxy, forecastCaseOptions, LegacyForecast } from "./LegacyForecast";

const value = (exact: string) => ({ status: "value", exact, display: exact });
const REASON = "CP-2A has no EBITDA (T2E.3.r03).";
const gap = { status: "na", exact: null, display: "n.a.", reason: REASON };
const row = (label: string) => ({
  label,
  band: "Cash",
  total: true,
  cells: [value("10"), value("12"), gap],
});
const model = {
  cashflow: {
    units: "USD millions",
    columns: ["FY2027E", "FY2028E", "FY2029E"].map((label) => ({ label, group: "Base case" })),
    rows: [row("Revenue"), row("Cash proxy (not issuer free cash flow)")],
  },
};

function openTables() {
  for (const button of screen.getAllByRole("button", { name: "Table" })) fireEvent.click(button);
}

it("draws no register id from a gap cell's reason in the line chart tables", () => {
  const { container } = render(<LegacyForecast model={model} />);
  openTables();
  expect(container.textContent).toContain("n.a.");
  expect(container.innerHTML).not.toContain("T2E.3.r03");
  expect(container.textContent).toContain("n.a. Reason recorded in model evidence.");
});

it("draws no register id from a gap cell's reason in the cash proxy table", () => {
  const { container } = render(<CashProxy model={model} />);
  openTables();
  expect(container.textContent).toContain("Reason recorded in model evidence.");
  expect(container.innerHTML).not.toContain("T2E.3.r03");
});

it("hands the case options a reason with no register id", () => {
  const reasons = forecastCaseOptions(model).map((option) => option.reason);
  expect(reasons).toEqual(["Reason recorded in model evidence."]);
});
