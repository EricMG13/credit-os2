// Verbatim excerpts of a real CP-2A handoff (offline replay of an issuer run): the Break points
// table, T2DS.1 and T2DS.4. Expected figures are typed from that handoff, not computed.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { DownsideLead } from "./cp2a";
import { bottomLine, leadProps, tableSection } from "./lead.fixture";

afterEach(cleanup);

const BREAKS = table(
  70,
  [
    "Order",
    "Condition",
    "EBITDA decline, fraction",
    "EBITDA decline, %",
    "EBITDA, USD million",
    "Interpretation",
  ],
  [
    [
      "1",
      "Gross leverage reaches analyst 8x watch",
      "0.18436926304746918436926304746918436926",
      "18.44%",
      "3110",
      "Leverage tolerance deteriorates first; not a covenant",
    ],
    [
      "2",
      "Net cash-interest cover reaches analyst 2x watch",
      "0.39260424862313139260424862313139260425",
      "39.26%",
      "2316",
      "Servicing buffer narrows before FCF reaches zero",
    ],
    [
      "3",
      "FCF reaches zero",
      "0.49305009179124049305009179124049305009",
      "49.31%",
      "1933",
      "Loss of internally generated cash after total capex, before discretionary uses",
    ],
    [
      "4",
      "EBITDA equals net cash interest",
      "0.69630212431156569630212431156569630212",
      "69.63%",
      "1158",
      "Earnings no longer exceed net paid interest; not an all-in debt-service test",
    ],
  ],
);
const CASES = table(
  124,
  [
    "Case",
    "EBITDA decline fraction s",
    "Cash-interest increase fraction k",
    "Classification / confidence",
    "Anchor and selection rationale",
    "Exclusions",
  ],
  [
    [
      "s00 control",
      "0",
      "0",
      "Control, not a forecast",
      "Reproduce the annual financial baseline",
      "No event adjustment",
    ],
    [
      "s01 shipment/mix stress",
      "0.2",
      "0.0259",
      "Analyst Interpretation; Medium",
      "A 20% EBITDA decline lies just beyond the calculated 18.44% gross-leverage watch break",
      "No source-implied likelihood",
    ],
    [
      "s02 deep operating stress",
      "0.5",
      "0.0518",
      "Analyst Interpretation; Low",
      "A 50% EBITDA decline deliberately crosses the calculated 49.31% FCF break",
      "Doubling is an analyst assumption",
    ],
  ],
);
const METRICS = table(
  150,
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
);

function real() {
  return entry(
    "CP-2A",
    [],
    [
      ...bottomLine("Stress breaks leverage first."),
      tableSection("Break points", BREAKS),
      tableSection("T2DS.1 Scenario assumptions", CASES),
      tableSection("T2DS.4 Stressed metrics and control comparison", METRICS),
    ],
  );
}

it("draws the break points from the Break points table, each decline as the module wrote it", () => {
  render(<DownsideLead {...leadProps(real())} />);
  const ladder = screen.getByRole("region", { name: "EBITDA break points" });
  expect(ladder).not.toHaveTextContent(/could not read/);
  expect(within(ladder).getByRole("img")).toHaveAccessibleName(
    /Gross leverage reaches analyst 8x watch 18\.44%.*Net cash-interest cover reaches analyst 2x watch 39\.26%.*FCF reaches zero 49\.31%.*EBITDA equals net cash interest 69\.63%/,
  );
});

it("compares the cases on the stressed metrics although the table has a row per case", () => {
  render(<DownsideLead {...leadProps(real())} />);
  const tile = screen.getByRole("region", { name: "Downside scenarios" });
  expect(tile).not.toHaveTextContent(/could not read/);
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(/Total leverage.*8\.16x/);
  expect(figure).toHaveAccessibleName(/Net leverage.*6\.10x/);
  expect(figure).toHaveAccessibleName(/EBITDA \/ net cash interest.*2\.57x/);
});

it("names the control once and says an undrawn measure is not drawn without claiming it was unreadable", () => {
  render(<DownsideLead {...leadProps(real())} />);
  const tile = screen.getByRole("region", { name: "Downside scenarios" });
  expect(tile.textContent).not.toContain("controlcontrol");
  expect(tile.textContent).not.toContain("could not place");
  expect(tile.textContent).toContain(
    "FCF / debt, fraction is not drawn; the table has its cells as written.",
  );
});
