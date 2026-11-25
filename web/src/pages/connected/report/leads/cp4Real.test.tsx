// Verbatim excerpts of a real CP-4 handoff (offline replay of an issuer run): the covenant headroom
// chart table with its closing note, and the capacity register. Expected text is typed from it.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { LegalLead } from "./cp4";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

const REAL = `## Findings

### Bottom line

Covenant headroom is not established.

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Ordinary springing maintenance | 7.50 | Not supplied: certified maintenance ratio | Not calculable: current tested ratio missing | Passes at or below | x | d887611dex101.htm.jsonl, page 188; exposure must exceed 40%; acquisition alternative not assumed |
| Acquisition-quarter maintenance alternative | 8.00 | Not supplied: acquisition qualification and tested ratio | Not calculable: current tested ratio missing | Passes at or below | x | d887611dex101.htm.jsonl, page 188; first four fiscal quarters after Material Acquisition only |
| Credit-agreement ratio distributions | 6.75 | Not supplied: payment pro forma ratio | Not calculable: current tested ratio missing | Passes at or below | x | d887611dex101.htm.jsonl, page 181; no-default condition and financing effect apply |

Thresholds describe different legal quantities and conditional tests; absent current values mean the chart does not establish compliance or proximity to breach.

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Debt incurrence capacity | Credit additional debt, clause 13 | Grower: greater of USD 250 million and 10% general EBITDA | Borrower/guarantors; aggregate at any time outstanding; lien permission separately needed | Not supplied: legal EBITDA | Not supplied: allocation ledger | Not calculable: legal base missing | Not calculable: usage missing | Formula Extracted Only | Moderate | Fixed floor is not remaining capacity; debt permission is not lien permission. | No monetary headroom. | L2 | d887611dex101.htm.jsonl, page 59 |
`;

function real(): OutputEntry {
  const sections = sectionsOf(REAL);
  const chart = sections.find((item) => item.heading === "Chart data: covenant headroom");
  const table = chart?.blocks.find((item) => item.type === "table");
  if (!table) throw new Error("no chart table");
  return {
    output: {
      module: "CP-4",
      id: "run/CP-4",
      label: "CP-4",
      sha256: "h",
      href: "CP-4.md",
      charts: [
        {
          title: "Covenant headroom",
          table: table.line,
          label: 0,
          threshold: 1,
          current: 2,
          headroom: 3,
          direction: 4,
          unit: "x",
        },
      ],
    },
    sections,
    selected: true,
  };
}

it("shows each test's condition and the chart's closing note under the figure, not only in the table", () => {
  render(<LegalLead {...leadProps(real())} />);
  const tile = screen.getByRole("region", { name: "Covenant headroom" });
  const rows = within(tile).getAllByRole("listitem");
  expect(rows[0]).toHaveTextContent(
    "exposure must exceed 40%; acquisition alternative not assumed",
  );
  expect(rows[1]).toHaveTextContent("first four fiscal quarters after Material Acquisition only");
  expect(
    within(tile).getByText(
      "Thresholds describe different legal quantities and conditional tests; absent current values mean the chart does not establish compliance or proximity to breach.",
    ),
  ).toBeVisible();
  // The figure has a reading of its own for a reader who cannot see the bars.
  const list = within(tile).getByRole("list", { name: "Covenant tests" });
  expect(list).toHaveAccessibleDescription(
    /Ordinary springing maintenance.*exposure must exceed 40%/,
  );
});

it("shows each basket's formula as the module wrote it", () => {
  render(<LegalLead {...leadProps(real())} />);
  const tile = screen.getByRole("region", { name: "Baskets and capacity" });
  expect(
    within(tile).getByText("Grower: greater of USD 250 million and 10% general EBITDA"),
  ).toBeVisible();
});
