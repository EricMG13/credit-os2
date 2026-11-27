import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { ReportView } from "../reportView";
import { readMeasure } from "./forecastData";
import { ForecastStats } from "./ForecastHeader";

const view = { catalogue: undefined, lead: undefined, entries: [], modules: [], models: [] };
const columns = ["FY2025E", "FY2026E", "FY2027E"].map((label) => ({ label, group: "Base case" }));
const REASON = "EBITDA not positive (T2E.3.r03) see credit_agreement.pdf page 4";
const row = (label: string, reasons: string[]) => ({
  label,
  band: "",
  kind: "",
  total: false,
  cells: reasons.map((reason) => ({ status: "unavailable", display: "n.a.", reason })),
});
const strip = (reasons: string[]) => {
  const model = { cashflow: { columns, rows: [row("Interest coverage", reasons)] } };
  render(
    <ForecastStats
      view={view as unknown as ReportView}
      folder="current"
      leverage={readMeasure(model, "net leverage", /^Net leverage\b/)}
      cover={readMeasure(model, "interest cover", /^Interest coverage\b/)}
      group="Base case"
      caseName="Base case"
      basis="Base case"
    />,
  );
  return screen.getByLabelText("Forecast figures").textContent;
};

it("R5: a drawn reason is not followed by a second stop, joined or not", () => {
  const drawn = strip([REASON, REASON, REASON]);
  expect(drawn).toContain("FY2026E not calculated: Reason recorded in model evidence");
  expect(drawn).not.toMatch(/\.\.|\.;/u);
});

it("R7: a whitespace-only reason is drawn as no reason", () => {
  const drawn = strip(["   ", "   ", "   "]);
  expect(drawn).toContain("FY2026E not calculated");
  expect(drawn).not.toMatch(/not calculated:/u);
});
