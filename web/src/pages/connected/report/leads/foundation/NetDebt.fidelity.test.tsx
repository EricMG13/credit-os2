// Synthetic CP-1 tables. Expected words and amounts come directly from these rows.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, section, table } from "../../overview/rows.fixture";
import { leadProps } from "../fixtures/load";
import { netDebtView } from "./foundationData";
import { NetDebtTile } from "./NetDebt";

afterEach(cleanup);

const handoff = entry(
  "CP-1",
  [],
  [
    section(
      "Net debt data",
      10,
      table(
        11,
        ["Period", "Gross debt", "Cash", "Net debt", "Reporting unit"],
        [
          ["FY2024", "100", "20", "80", "USD millions"],
          ["FY2025", "110", "20", "90", "USD millions"],
        ],
      ),
    ),
    section(
      "Post-balance-sheet adjustments",
      20,
      table(
        21,
        [
          "Event",
          "Date",
          "Amount",
          "Pro forma net debt",
          "Pro forma net leverage",
          "Reporting unit",
        ],
        [["Capital expenditure", "2026-01-31", "300", "380", "4", "EUR millions"]],
      ),
    ),
    section(
      "Chart data: liquidity",
      30,
      table(
        31,
        ["Period", "Cash", "Undrawn committed facilities", "Reporting unit"],
        [
          ["FY2024", "12", "31", "EUR millions"],
          ["FY2025", "0", "5", "USD thousands"],
        ],
      ),
    ),
  ],
);

it("keeps EUR pro forma amounts off the USD net debt scale and labels them in both tables", () => {
  render(<NetDebtTile lead={leadProps(handoff)} />);
  const tile = screen.getByRole("region", { name: "Net debt" });
  expect(tile.querySelector('[data-bar="Pro forma"]')).toBeNull();
  expect(within(tile).getByRole("img", { name: /Net debt, \$m,/ })).toHaveAccessibleName(
    /FY2024 Net 80.*FY2025 Net 90/,
  );

  fireEvent.click(within(tile).getByRole("button", { name: /^Adjustments/ }));
  const adjustments = within(tile).getByRole("table", { name: "Stated adjustments" });
  expect(within(adjustments).getByRole("cell", { name: "€300m" })).toBeVisible();
  expect(within(adjustments).getByRole("cell", { name: "€380m" })).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  const debt = within(tile).getByRole("table", { name: "Net debt, $m" });
  expect(within(debt).getByRole("cell", { name: "€300m" })).toBeVisible();
  expect(within(debt).getByRole("cell", { name: "€380m" })).toBeVisible();
});

it("preserves each liquidity row's reporting unit and literal amounts", () => {
  render(<NetDebtTile lead={leadProps(handoff)} />);
  const liquidity = screen.getByRole("group", { name: "Liquidity" });
  expect(liquidity.querySelector('[data-liquidity="FY2024"]')).toHaveTextContent(
    "FY2024cash €12m · undrawn committed facilities €31m",
  );
  expect(liquidity.querySelector('[data-liquidity="FY2025"]')).toHaveTextContent(
    "FY2025cash 0 USD thousands · undrawn committed facilities 5 USD thousands",
  );
  expect(netDebtView(handoff)?.liquidity.map(({ unit }) => unit)).toEqual([
    "EUR millions",
    "USD thousands",
  ]);
});
