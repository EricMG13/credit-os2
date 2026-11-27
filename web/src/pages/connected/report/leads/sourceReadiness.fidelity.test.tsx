import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { leadProps, tableSection } from "./lead.fixture";
import { SourceReadinessLead } from "./sourceReadiness";

afterEach(cleanup);

it("routes the overall input gate's citations to its table trace", () => {
  const handoff = entry(
    "CP-0",
    [],
    [
      tableSection(
        "T1 Input gate",
        table(
          9,
          ["Gate field", "Resolved input", "Readiness boundary", "Source"],
          [
            [
              "Objective and profile",
              "Assessment based on issuer_profile.pdf",
              "READY per internal_gate.md page 2",
              "issuer_profile.pdf, page 1",
            ],
          ],
        ),
      ),
    ],
  );
  render(<SourceReadinessLead {...leadProps(handoff)} />);
  const tile = within(screen.getByRole("region", { name: "Overall source readiness" }));
  expect(tile.getByText("Ready")).toBeVisible();
  expect(tile.getByRole("link", { name: /Source for/ })).toHaveAttribute(
    "href",
    "/report/run#evidence/run%2FCP-0~hash-CP-0-9",
  );
  fireEvent.click(tile.getByRole("button", { name: "Table view: Overall source readiness" }));
  expect(tile.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
    "Objective and profile",
    "Detail is in Evidence.",
    "Ready — Detail is in Evidence.",
  ]);
  expect(document.body.textContent).not.toMatch(/issuer_profile\.pdf|internal_gate\.md/);
});

it.each([
  ["CONDITIONAL – filings are limited", "Conditional – filings are limited"],
  ["CONDITIONAL - filings are limited", "Conditional - filings are limited"],
  ["CONDITIONAL : filings are limited", "Conditional: filings are limited"],
  ["CONDITIONAL: filings are limited", "Conditional: filings are limited"],
  ["READY — filings can support the decision", "Ready — filings can support the decision"],
  [
    "NOT_READY — filings cannot support the decision",
    "Not ready — filings cannot support the decision",
  ],
])("draws the input boundary %s with one separator", (boundary, expected) => {
  const handoff = entry(
    "CP-0",
    [],
    [
      tableSection(
        "T1 Input gate",
        table(9, ["Gate field", "Readiness boundary"], [["Objective and profile", boundary]]),
      ),
    ],
  );
  render(<SourceReadinessLead {...leadProps(handoff)} />);
  const tile = within(screen.getByRole("region", { name: "Overall source readiness" }));
  fireEvent.click(tile.getByRole("button", { name: "Table view: Overall source readiness" }));
  expect(tile.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
    "Objective and profile",
    expected,
  ]);
});
