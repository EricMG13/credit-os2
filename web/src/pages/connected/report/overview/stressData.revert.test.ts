import { expect, it } from "vitest";
import { downsidePanels } from "./stressData";
import { entry, section, table } from "./rows.fixture";

// Round-3 regression revert: a bracket that holds only a citation draws the lead number, as at the
// base revision. Cells written by hand; expected values literal.
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
const valueOf = (cell: string) =>
  downsidePanels(stress([["Net leverage (x)", cell, "9.9x", "F"]]))?.panels[0]?.cells[0]?.value;

it.each([
  ["6.53 (calculation R01)", 6.53],
  ["5.0 (scenario S02)", 5],
  ["5.0 (pg 3)", 5],
  ["5.0 (p 3)", 5],
  ["5.0 (page 3 of 10)", 5],
  ["6.53 (Q3 2025 Results Presentation.pdf, p. 3)", 6.53],
  ["5.0 (p. 3) [S12]", 5],
  ["5.0 (p. 3) [G3]", 5],
  ["5.0 (p. 3) [R9]", 5],
  ["5.0 (p. 3) [E3.2]", 5],
  ["5.0 (p. 3) [1]", 5],
  ["5.0 (annual_report.pdf (p. 3))", 5],
  ["5.1 (covenant breached)", 5.1],
])("draws the lead of %s", (cell, expected) => {
  expect(valueOf(cell)).toBe(expected);
});

it.each([
  "1,250 (EUR 1,100 million)",
  "5.0 (down from 6.1)",
  "5.0 (p. 3) [restated 4.0x]",
  "5.0 (section 4 and 6.2)",
  "5,4 (USD 5,13 million)",
  "5.0 (S12 4.0x)",
])("draws nothing for %s", (cell) => {
  expect(valueOf(cell)).toBeNull();
});
