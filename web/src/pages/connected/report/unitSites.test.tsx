// Owner ruling 2026-11-26 (display only): a structured money unit is drawn as the currency's
// symbol where a reader page draws it. Each case feeds the stored form ("US$m", "USD millions",
// "EURm") and expects the ruled form; the handoff words in the inputs are not changed.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RunContext } from "@/pages/library/parts/RunContext";
import type { OutputEntry, Snapshot, Table } from "../publishedReport";
import { sectionTraces } from "../ReportContent";
import { traceKey } from "../reportView";
import { printableTable } from "../export/printTable";
import { LegacyVisuals } from "../visuals";
import { MaturityPair } from "./changes/MaturityPair";
import { unitCells } from "../moneyUnits";
import { typedModuleTable } from "./ModuleTable";

afterEach(cleanup);

const table = (headers: string[], rows: string[][]): Table => ({
  type: "table",
  line: 10,
  headers,
  rows: rows.map((cells, at) => ({ line: 12 + at, cells })),
});

it("draws a statement row's unit in its label as $m", () => {
  const statement = table(
    ["Line item", "FY2024", "FY2023", "Unit", "Basis"],
    [
      ["Net sales", "7,940", "6,585", "USD millions", "Reported"],
      ["Operating income", "3,463", "2,839", "USD millions", "Reported"],
    ],
  );
  const entry: OutputEntry = {
    selected: true,
    output: { id: "a", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
    sections: [{ heading: "T4.4 Income statement", level: 3, line: 8, blocks: [statement] }],
  };
  const traces = sectionTraces({ chips: {} } as Snapshot, entry, entry.sections);
  render(
    <RunContext.Provider value={{ traces, open: () => undefined }}>
      {typedModuleTable("CP-1", "T4.4 Income statement", statement, (line) =>
        traceKey(entry, line),
      )}
    </RunContext.Provider>,
  );
  expect(screen.getByText("Net sales · $m · Reported")).toBeVisible();
  expect(document.body.textContent).not.toContain("USD millions");
});

it("draws the maturity pair's kicker unit as $m", () => {
  render(
    <MaturityPair
      profile={{ unit: "US$m", rows: [{ period: "FY2026", prior: "100", current: "120" }] }}
    />,
  );
  expect(screen.getByText("Debt maturing by period, $m")).toBeVisible();
  expect(document.body.textContent).not.toContain("US$m");
});

it("draws a limits row's unit beside its threshold as $m", () => {
  render(
    <LegacyVisuals
      output={{
        charts: [
          {
            title: "Liquidity headroom",
            table: 20,
            kind: "bullet",
            label: [0],
            current: 2,
            threshold: 1,
            direction: 3,
          },
        ],
      }}
      sections={[
        {
          blocks: [
            {
              type: "table",
              line: 20,
              headers: [
                "Test",
                "Threshold",
                "Current",
                "Direction",
                "Reporting unit",
                "Basis and limitation",
              ],
              rows: [
                { cells: ["Liquidity", "500", "700", "Minimum", "US$m", "As defined."] },
                { cells: ["Cash", "300", "320", "Minimum", "US$m", "As defined."] },
              ],
            },
          ],
        },
      ]}
      evidenceHref={(line) => `#evidence/${String(line)}`}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "Liquidity headroom" }));
  expect(figure.getByText("Minimum $500m")).toBeVisible();
  expect(document.body.textContent).not.toContain("US$m");
});

it("draws a Unit column's money cells as symbols and leaves every other cell as written", () => {
  const draw = unitCells(
    table(["Line item", "Unit", "Currency"], [["Net sales", "EUR millions", "EUR"]]),
  );
  expect(draw(1, "EUR millions")).toBe("€m");
  expect(draw(1, "x")).toBeUndefined();
  expect(draw(2, "EUR")).toBeUndefined();
  // A column that is not a unit column is never converted, whatever it holds.
  expect(draw(0, "USD millions")).toBeUndefined();
});

it("keeps a print table's unit cells for the cell drawer, which converts them for the reader", () => {
  const printed = printableTable(
    table(["Period", "Reporting unit"], [["FY2024", "GBP millions"]]),
  ).table;
  expect(printed.rows[0]?.cells[1]).toBe("GBP millions");
  expect(unitCells(printed)(1, "GBP millions")).toBe("£m");
});
