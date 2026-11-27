import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { StressRow } from "./StressRow";
import { entry, rowProps, section, table } from "./rows.fixture";

afterEach(cleanup);

const stress = (rows: string[][]) =>
  entry(
    "CP-2A",
    [],
    [
      section(
        "T2DS.1 Scenarios",
        95,
        table(
          96,
          ["Scenario ID", "Name", "EBITDA decline s", "Cash-interest increase k"],
          [
            ["s00", "Control", "0", "0"],
            ["s01", "Cost shock", "0.1 (10%)", "0"],
          ],
        ),
      ),
      section(
        "T2DS.4 Stressed flows and metrics",
        105,
        table(106, ["Metric", "s00", "s01", "Source"], rows),
      ),
    ],
  );

it("C4-1 puts a short bare value labelled stated, not drawn in the note beneath", () => {
  render(<StressRow {...rowProps([stress([["FCF / debt", "0.0756", "0.0437", "Filing"]])])} />);
  const tile = screen.getByRole("region", { name: "Downside scenarios" });
  expect(tile).toHaveTextContent("Stated, not drawn");
  expect(within(tile).getByText("Control, FCF / debt: 0.0756.")).toBeVisible();
  expect(within(tile).getByText("Cost shock, FCF / debt: 0.0437.")).toBeVisible();
});

const gap = { exact: null, display: "n.m.", reason: "EBITDA is not positive", status: "na" };
const value = (display: string, exact: string) => ({
  exact,
  display,
  reason: null,
  status: "value",
});
const column = (label: string, group: string) => ({
  label,
  group,
  start: "2025-04-01",
  end: "2026-03-31",
});

it("C4-3 names and marks the periods a later case has no figure for", () => {
  const model = {
    cashflow: {
      columns: [
        column("FY2026E", "Base case"),
        column("FY2027E", "Base case"),
        column("FY2026E", "Downside case"),
        column("FY2027E", "Downside case"),
      ],
      rows: [
        {
          band: "Credit metrics",
          label: "Net leverage (net debt / Adj EBITDA)",
          kind: "multiple",
          total: false,
          cells: [value("2.00x", "2.0"), value("1.00x", "1.0"), value("3.00x", "3.0"), gap],
        },
      ],
      limits: [],
    },
  };
  render(<StressRow {...rowProps([], [model])} />);
  const tile = screen.getByRole("region", { name: "Forward path" });
  expect(within(tile).getByText("Downside case, FY2027E: EBITDA is not positive.")).toBeVisible();
  expect(tile.querySelectorAll('[data-gap="FY2027E"]')).toHaveLength(1);
});
