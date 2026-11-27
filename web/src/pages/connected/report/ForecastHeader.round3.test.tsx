import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { ReportView } from "../reportView";
import { readMeasure } from "./forecastData";
import { ForecastStats } from "./ForecastHeader";
import { UsesOfCash } from "./ForecastCash";

const view = { catalogue: undefined, lead: undefined, entries: [], modules: [], models: [] };
const columns = ["FY2025E", "FY2026E", "FY2027E"].map((label) => ({ label, group: "Base case" }));
const na = (reason: string) => ({ status: "unavailable", display: "n.a.", reason });
const row = (label: string, cells: unknown[]) => ({
  label,
  band: "",
  kind: "",
  total: false,
  cells,
});

it("S1: a year's reason that cites by note or marker is drawn as the evidence sentence", () => {
  const model = {
    cashflow: {
      columns,
      rows: [
        row(
          "Interest coverage",
          ["Not modelled; see Note 4", "EBITDA negative; E12", "EBITDA negative (E3)"].map(na),
        ),
      ],
    },
  };
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
  const drawn = screen.getByLabelText("Forecast figures").textContent;
  expect(drawn).toContain("FY2025E not calculated: Reason recorded in model evidence");
  expect(drawn).toContain("FY2027E not calculated: EBITDA negative");
  expect(drawn).not.toMatch(/Note 4|E12|\(E3\)/u);
});

it("S1: a uses-of-cash reason that cites by note is drawn as the evidence sentence", () => {
  const cash = { label: "FY2025E", group: "Base case", start: "2025-01-01", end: "2025-12-31" };
  const { container } = render(
    <UsesOfCash
      model={{
        cashflow: {
          units: "USD millions",
          columns: [cash],
          rows: [
            {
              ...row("Distributions", [
                { status: "na", display: "n.a.", reason: "Not modelled; see Note 4" },
              ]),
              band: "Cash",
              kind: "money",
            },
          ],
        },
      }}
      group="Base case"
      caseName="Base case"
    />,
  );
  expect(container.textContent).not.toMatch(/Note 4/u);
  expect(
    screen.getByText("FY2025E Distributions: Reason recorded in model evidence."),
  ).toBeTruthy();
});
