import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { ForecastTable } from "./ForecastTable";
import type { Grid } from "./LegacyForecast";

const grid = (reason: string): Grid => ({
  columns: [{ label: "FY2027E", group: "Base case", start: "", end: "" }],
  rows: [
    {
      label: "Net leverage",
      band: "",
      total: false,
      cells: [{ status: "na", exact: null, display: "n.a.", reason }],
    },
  ],
});

it("keeps a register id out of the cell's title and aria-label", () => {
  const { container } = render(
    <ForecastTable grid={grid("CP-2A has no EBITDA (T2E.3.r03).")} title="Model" limits={[]} />,
  );
  const cell = container.querySelector("td[title]");
  expect(cell?.getAttribute("title")).not.toContain("T2E.3.r03");
  expect(cell?.getAttribute("aria-label")).not.toContain("T2E.3.r03");
  expect(cell?.getAttribute("aria-label")).toContain("Reason recorded in model evidence.");
  expect(container.innerHTML).not.toContain("T2E.3.r03");
});

it("keeps every reason out of the title and aria-label when only evidence may carry them", () => {
  const { container } = render(
    <ForecastTable
      grid={grid("EBITDA is not positive.")}
      title="Model"
      limits={[]}
      evidenceOnlyQualifications
    />,
  );
  const cell = container.querySelector("td[title]");
  expect(cell?.getAttribute("title")).not.toContain("EBITDA is not positive");
  expect(cell?.getAttribute("aria-label")).not.toContain("EBITDA is not positive");
  expect(container.innerHTML).not.toContain("EBITDA is not positive");
});
