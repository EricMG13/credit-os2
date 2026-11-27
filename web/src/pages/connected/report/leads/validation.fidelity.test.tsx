import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { leadProps, tableSection } from "./lead.fixture";
import { ClearanceLead } from "./validation";

afterEach(cleanup);

function remediation(action: string, affected = "CP-1") {
  const handoff = entry(
    "CP-5",
    [],
    [
      tableSection(
        "T5B.5 Integrity gaps",
        table(
          20,
          ["Gap", "Why it matters", "Affected modules", "Severity", "Action"],
          [["Debt reconciliation", "Balances disagree", affected, "Minor", action]],
        ),
      ),
    ],
  );
  render(<ClearanceLead {...leadProps(handoff)} />);
  return within(screen.getByRole("region", { name: "Remediation" }));
}

it.each([
  ["Not applicable: issuer.pdf page 2", "Not applicable: Detail is in Evidence."],
  ["Not calculable: 0.0x denominator", "Not calculable: 0.0x denominator"],
  ["Not calculated: no quarters supplied", "Not calculated: no quarters supplied"],
])("keeps %s as a stated remediation status in both views", (action, expected) => {
  const tile = remediation(action);
  expect(within(tile.getByRole("list")).getByText(expected)).toBeVisible();
  fireEvent.click(
    tile.getByRole("button", { name: "Table view: Remediation actions, in the order stated" }),
  );
  expect(tile.getByRole("cell", { name: expected })).toBeVisible();
  expect(document.body.textContent).not.toContain("issuer.pdf");
});

it("screens a grouped citation before parsing the affected-module list", () => {
  const tile = remediation("Reconcile reported balances", "CP-1 [E3, E4]; CP-2");
  expect(tile.getByText("Affects: Financial foundation, Fundamental credit")).toBeVisible();
  expect(tile.getByRole("link", { name: /Source for/ })).toHaveAttribute(
    "href",
    "/report/run#evidence/run%2FCP-5~hash-CP-5-20",
  );
  fireEvent.click(
    tile.getByRole("button", { name: "Table view: Remediation actions, in the order stated" }),
  );
  expect(
    tile.getByRole("cell", { name: "Financial foundation, Fundamental credit" }),
  ).toBeVisible();
  expect(document.body.textContent).not.toMatch(/\bE[34]\b/);
});
