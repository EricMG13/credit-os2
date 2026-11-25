// A verbatim excerpt of a real CP-2A handoff (T2DS.1 and T2DS.4, one row per case).
import { expect, it } from "vitest";
import { downsidePanels } from "./stressData";
import { entry, section, table } from "./rows.fixture";

const real = () =>
  entry(
    "CP-2A",
    [],
    [
      section(
        "T2DS.1 Scenario assumptions",
        124,
        table(
          126,
          [
            "Case",
            "EBITDA decline fraction s",
            "Cash-interest increase fraction k",
            "Classification / confidence",
            "Anchor and selection rationale",
            "Exclusions",
          ],
          [
            ["s00 control", "0", "0", "Control, not a forecast", "Baseline", "None"],
            [
              "s01 shipment/mix stress",
              "0.2",
              "0.0259",
              "Analyst Interpretation; Medium",
              "A",
              "B",
            ],
            ["s02 deep operating stress", "0.5", "0.0518", "Analyst Interpretation; Low", "A", "B"],
          ],
        ),
      ),
      section(
        "T2DS.4 Stressed metrics and control comparison",
        150,
        table(
          152,
          [
            "Case",
            "Total leverage",
            "Net leverage",
            "EBITDA / net cash interest",
            "FCF / debt, fraction",
            "Source",
          ],
          [
            [
              "s00",
              "6.53x",
              "4.88x; separate 2024-10-18 dividend-only pro forma 6.02x",
              "3.29x",
              "0.075562700964630225080385852090032154341",
              "Financial foundation (CP-1); calculation M00",
            ],
            [
              "s01",
              "8.16x",
              "6.10x",
              "2.57x",
              "0.043706101286173633440514469453376205788",
              "calculation M01; calculation R01",
            ],
            [
              "s02",
              "13.05x",
              "9.77x",
              "1.57x",
              "-0.0034760610932475884244372990353697749196",
              "calculation M02; calculation R02",
            ],
          ],
        ),
      ),
    ],
  );

it("draws no value for a measure with no stated unit and a bare fraction, keeping its text as written", () => {
  const panel = downsidePanels(real())?.panels.find((item) => item.measure.startsWith("FCF"));
  expect(panel?.cells.map((cell) => cell.value)).toEqual([null, null, null]);
  expect(panel?.cells.map((cell) => cell.text)).toEqual([
    "0.075562700964630225080385852090032154341",
    "0.043706101286173633440514469453376205788",
    "-0.0034760610932475884244372990353697749196",
  ]);
});

it("still draws the multiples the module states", () => {
  const panel = downsidePanels(real())?.panels.find((item) => item.measure === "Total leverage");
  expect(panel?.cells.map((cell) => cell.value)).toEqual([6.53, 8.16, 13.05]);
});
