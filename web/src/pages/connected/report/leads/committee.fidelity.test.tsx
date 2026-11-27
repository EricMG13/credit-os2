import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { CommitteeLead } from "./committee";
import { leadProps, tableSection } from "./lead.fixture";

afterEach(cleanup);

it("draws the bear cross-examination and the stance gap when no stance is stated", () => {
  const handoff = entry(
    "CP-6",
    [],
    [
      tableSection(
        "T6A.4 Bear cross-examination",
        table(
          40,
          ["Bull Claim Attacked", "Bear Counter-Evidence", "Source"],
          [["Cash conversion", "Cash interest was 1.50x cash flow [E3, E4].", "issuer.pdf page 2"]],
        ),
      ),
    ],
  );
  render(<CommitteeLead {...leadProps(handoff)} />);
  const tile = within(screen.getByRole("region", { name: "Challenged points" }));
  const claims = within(tile.getByRole("table"));
  expect(claims.getByRole("cell", { name: "Cash interest was 1.50x cash flow." })).toBeVisible();
  expect(claims.getByRole("link", { name: "Source for Cash conversion" })).toHaveAttribute(
    "href",
    "/report/run#evidence/run%2FCP-6~hash-CP-6-42",
  );
  expect(screen.getByRole("region", { name: "Committee stance" })).toHaveTextContent(
    "This page could not read an action bias.",
  );
  expect(document.body.textContent).not.toMatch(/issuer\.pdf|\bE[34]\b/);
});
