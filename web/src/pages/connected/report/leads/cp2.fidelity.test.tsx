import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { CreditLead } from "./cp2";
import { leadProps, tableSection } from "./lead.fixture";

afterEach(cleanup);

it.each([
  ["Not calculable: issuer.pdf page 2", "Not calculable: In Evidence"],
  ["Not assessable: issuer.pdf page 2", "Not assessable: In Evidence"],
  ["**Not assessable:** issuer.pdf page 2", "Not assessable: In Evidence"],
  ["Not yet calculable: issuer.pdf page 2", "Not yet calculable: In Evidence"],
  ["Not calculable: cash not reported", "Not calculable: cash not reported"],
  ["Not assessable: cash not reported", "Not assessable: cash not reported"],
  ["0.0", "0.0x"],
])("draws adjacent net leverage as %s with the latest row trace", (cell, expected) => {
  const foundation = entry(
    "CP-1",
    [],
    [
      tableSection(
        "Chart data: leverage",
        table(
          60,
          ["Period", "Total debt / EBITDA", "Net debt / EBITDA", "Reporting unit"],
          [["FY2024", "6.1", cell, "x"]],
        ),
      ),
    ],
  );
  render(<CreditLead {...leadProps(entry("CP-2", [], []), [foundation])} />);
  const tile = within(screen.getByRole("region", { name: "Leverage, cover and headroom" }));
  expect(tile.getByText("6.1x")).toBeVisible();
  expect(tile.getByText(`Net debt / EBITDA ${expected}`)).toBeVisible();
  expect(tile.getByRole("link", { name: "Source for Total debt / EBITDA" })).toHaveAttribute(
    "href",
    "/report/run#evidence/run%2FCP-1~hash-CP-1-62",
  );
  expect(document.body.textContent).not.toContain("issuer.pdf");
});
