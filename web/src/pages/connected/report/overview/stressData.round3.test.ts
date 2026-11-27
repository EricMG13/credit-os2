import { expect, it } from "vitest";
import { downsidePanels } from "./stressData";
import { entry, section, table } from "./rows.fixture";

// C4 round 3: a bracket after a lead number is read with its citations set aside; whatever figure
// is left must restate the lead in the row's own unit. Cells written by hand; expected values literal.
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
const valuesOf = (rows: string[][]) =>
  downsidePanels(stress(rows))?.panels.map((panel) => panel.cells.map((cell) => cell.value));

it("C4-S1 takes no value where a trailing square bracket states another figure", () => {
  expect(
    valuesOf([["Net leverage (x)", "5.0 (p. 3) [restated 4.0x]", "5.0 (p. 3) [E3]", "F"]]),
  ).toEqual([[null, 5]]);
});

it("C4-S2 reads a decimal comma's own precision", () => {
  expect(
    valuesOf([
      ["Stressed FCF (USD millions)", "5,4 (USD 5,13 million)", "5,13 (USD 5,13 million)", "F"],
      ["Net leverage (x)", "5.4 (5,0x)", "5.04 (5,0x)", "F"],
    ]),
  ).toEqual([
    [null, 5.13],
    [null, 5.04],
  ]);
});

it("C4-S3 lets no locator swallow a figure after it", () => {
  expect(
    valuesOf([
      ["Net leverage (x)", "5.0 (section 4 and 6.2)", "5.0 (Note 4, covenant 6.0 times)", "F"],
      ["Cover (x)", "5.0 (section 4.2)", "6637 (pages 59, 153)", "F"],
    ]),
  ).toEqual([
    [null, null],
    [5, 6637],
  ]);
});

it("C4-S4 takes no value from a figure after a cited file", () => {
  expect(
    valuesOf([
      ["Stressed FCF (USD millions)", "5.13 (RCF.pdf, -USD 9.9)", "5.13 (RCF.pdf, USD 5.13m)", "F"],
    ]),
  ).toEqual([[null, 5.13]]);
});
