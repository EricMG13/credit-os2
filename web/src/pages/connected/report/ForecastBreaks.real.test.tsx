// Verbatim excerpts of a real CP-2A handoff (offline replay of an issuer run): T2DS.1 and T2DS.4.
// Expected strings are typed from that handoff, not computed.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { ReportView } from "../reportView";
import { WhatBreaks } from "./ForecastBreaks";
import { readMeasure } from "./forecastData";
import { bottomLine, tableSection } from "./leads/lead.fixture";
import { entry, table } from "./overview/rows.fixture";

afterEach(cleanup);

const FRACTIONS = [
  "0.075562700964630225080385852090032154341",
  "0.043706101286173633440514469453376205788",
  "-0.0034760610932475884244372990353697749196",
];

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
    ["s00 control", "0", "0", "Control, not a forecast", "Reproduce the annual baseline", "None"],
    [
      "s01 shipment/mix stress",
      "0.2",
      "0.0259",
      "Analyst Interpretation; Medium",
      "A 20% EBITDA decline",
      "No source-implied likelihood",
    ],
    [
      "s02 deep operating stress",
      "0.5",
      "0.0518",
      "Analyst Interpretation; Low",
      "A 50% EBITDA decline",
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
      FRACTIONS[0] ?? "",
      "Financial foundation (CP-1); calculation M00",
    ],
    ["s01", "8.16x", "6.10x", "2.57x", FRACTIONS[1] ?? "", "calculation M01; calculation R01"],
    ["s02", "13.05x", "9.77x", "1.57x", FRACTIONS[2] ?? "", "calculation M02; calculation R02"],
  ],
);

function renderReal() {
  const cp2a = entry(
    "CP-2A",
    [],
    [
      ...bottomLine("Stress breaks leverage first."),
      tableSection("T2DS.1 Scenario assumptions", CASES),
      tableSection("T2DS.4 Stressed metrics and control comparison", METRICS),
    ],
  );
  const model = {
    cashflow: {
      units: "USD millions",
      columns: [{ label: "FY2025E", group: "Base case" }],
      rows: [],
    },
  };
  return render(
    <WhatBreaks
      view={{ entries: [cp2a], modules: [], models: [] } as unknown as ReportView}
      folder="current"
      liquidity={readMeasure(model, "accessible liquidity", /^Accessible liquidity\b/)}
      group="Base case"
      caseName="Base case"
      schedule={{ years: [], offAxis: [], unit: "US$m", reason: null }}
      source={(name) => <button type="button">{`Show sources for ${name}`}</button>}
    />,
  );
}

const stress = () => within(screen.getByRole("group", { name: "Point-in-time stress" }));

it("states a bare fraction in a measure with no unit as written, never as not calculated", () => {
  renderReal();
  const part = stress();
  for (const text of FRACTIONS) {
    expect(part.getByText(new RegExp(text.replace(/[.-]/g, "\\$&")))).toBeInTheDocument();
  }
  expect(part.queryByText(/not stated/i)).toBeNull();
  expect(part.queryByText(/not calculated/i)).toBeNull();
  const reading = part.getByRole("img").getAttribute("aria-label") ?? "";
  expect(reading).not.toMatch(/not calculated/i);
  expect(reading).toContain(`FCF / debt, fraction ${FRACTIONS[0] ?? ""}`);
});

it("names each case by the module's own words and classification, so the control is not a stress", () => {
  renderReal();
  const part = stress();
  const reading = part.getByRole("img").getAttribute("aria-label") ?? "";
  expect(reading).not.toMatch(/Case \d/);
  expect(reading).toContain("shipment/mix stress");
  expect(part.getByText(/control: Control, not a forecast\./i)).toBeInTheDocument();
  expect(
    part.getByText(/shipment\/mix stress: .*Analyst Interpretation; Medium/),
  ).toBeInTheDocument();
});
