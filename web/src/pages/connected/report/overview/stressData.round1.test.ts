import { expect, it } from "vitest";
import { downsidePanels } from "./stressData";
import { entry, section, table } from "./rows.fixture";

// C4-2: a leading number is taken only when its bracket restates it in the measure's own unit, or
// is a pure citation. Cells are written by hand; expected values are literal.
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

it("C4-2 takes no value from a bracket in another currency or quantity", () => {
  expect(
    valuesOf([
      ["Stressed FCF (USD millions)", "100", "1,250 (EUR 1,100 million)", "F"],
      ["Net leverage (x)", "4.0", "5.0 (down from 6.1)", "F"],
    ]),
  ).toEqual([
    [100, null],
    [4, null],
  ]);
});

it("C4-2 keeps a same-unit restatement and a pure citation", () => {
  expect(
    valuesOf([
      [
        "Stressed FCF (USD millions)",
        "-5.1250 (−USD 5.13 million)",
        "1,250 (USD 1,250 million)",
        "F",
      ],
      ["Net leverage (x)", "5.0 (5.0x)", "6637 (annual_report.pdf pages 59, 153)", "F"],
    ]),
  ).toEqual([
    [-5.125, 1250],
    [5, 6637],
  ]);
});

// C4 round 2: pure citations keep the lead; signs agree; trailing marks; precision; short forms.
it("C4-R2 keeps the lead of a bracket that is only a citation", () => {
  expect(
    valuesOf([
      ["Net leverage (x)", "5.0 (CP-2A-CALC-02)", "5.0 (T4.18)", "F"],
      ["Cover (x)", "5.0 (see Note 4)", "5.0 (CP-2A)", "F"],
      ["Stressed FCF (USD millions)", "5.13 (CP-4-CALC-02)", "5.13 (RCF2025.pdf page 3)", "F"],
    ]),
  ).toEqual([
    [5, 5],
    [5, 5],
    [5.13, 5.13],
  ]);
});

it("C4-R3 takes no value where the bracket's sign disagrees", () => {
  expect(
    valuesOf([
      ["Stressed FCF (USD millions)", "5.0 (-USD 5.0 million)", "-5.0 (USD 5.0 million)", "F"],
    ]),
  ).toEqual([[null, null]]);
});

it("C4-R4 keeps the lead past a trailing full stop or marker", () => {
  expect(
    valuesOf([["Net leverage (x)", "5.0 (annual_report.pdf p. 3).", "5.0 (p. 3) [E3]", "F"]]),
  ).toEqual([[5, 5]]);
});

it("C4-R5 compares to the bracket's own precision", () => {
  expect(valuesOf([["Net leverage (x)", "6.02 (6.0x)", "6.2 (6.0x)", "F"]])).toEqual([
    [6.02, null],
  ]);
});

it("C4-R6 reads the short forms of the row's currency and scale", () => {
  expect(
    valuesOf([
      ["Stressed FCF (USD m)", "5.13 (USD 5.13m)", "5.13 (EUR 5.13m)", "F"],
      ["Debt (EUR bn)", "2.5 (EUR 2.5bn)", "2.5 (EUR 2.5m)", "F"],
    ]),
  ).toEqual([
    [5.13, null],
    [2.5, null],
  ]);
});
