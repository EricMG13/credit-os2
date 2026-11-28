import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";

type View = ReturnType<typeof buildReportView>;

// AGENTS.md: every number exact; docs/rulings/2026-11-26-money-unit-symbols.md: a figure the
// page keeps as written keeps its digits. The bridge draws recorded strings, never rounded ones.
function bridgeView(original: string, difference: string, value: string): View {
  const hash = "a".repeat(64);
  const handoff: OutputEntry = {
    output: { id: "forward", sha256: hash, module: "CP-2G", label: "Forward model", href: "" },
    selected: true,
    sections: [
      {
        heading: "Calculations",
        level: 2,
        line: 60,
        blocks: [
          {
            type: "table",
            line: 62,
            headers: ["ID", "Calculation", "Inputs", "Result", "Source"],
            rows: [
              {
                line: 65,
                cells: ["FCF", "Base FCF FY2025", "Retained inputs", original, "Filing"],
              },
              {
                line: 66,
                cells: [
                  "Inflow",
                  "Base taxes and working-capital inflow FY2025",
                  "Retained inputs",
                  difference,
                  "Filing",
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const model = {
    id: "model",
    issuerKey: "issuer",
    runId: "current",
    runFolder: "current",
    href: "",
    download: "",
    sources: [{ output: "forward", sha256: hash, role: "forecast" }],
    cashflow: {
      units: "USD millions",
      limits: ["A machine input is set to zero; the retained handoff records the inflow."],
      columns: [{ label: "FY2025E", group: "Base case" }],
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          band: "Cash",
          total: true,
          cells: [{ status: "value", exact: value, display: value }],
        },
      ],
    },
  };
  return {
    catalogue: undefined,
    lead: undefined,
    entries: [handoff],
    modules: [],
    models: [model],
  };
}

it("draws a recorded 15.124 free cash flow with its digits, no rounding", () => {
  render(
    <Forecast
      view={bridgeView("15.124", "5.124", "10")}
      run={{ folder: "current" } as PublishedRun}
    />,
  );
  expect(screen.getByText(/The calculation gives/)).toHaveTextContent(
    "The calculation gives $10m cash proxy. The Forward credit model gives $15.124m free cash flow. The displayed difference is $5.124m.",
  );
});
