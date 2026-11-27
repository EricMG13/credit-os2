import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import type { ReportView } from "../reportView";
import { forecastMeasure, fundingGap, NOT_STATED_IN_ROW } from "./forecastData";

const handoff = (module: string, headers: string[], rows: string[][]) =>
  ({
    selected: true,
    output: {
      id: module,
      sha256: "c".repeat(64),
      module,
      label: "",
      href: "",
      state: { established: true, declared: null },
    },
    sections: [
      {
        heading: "T2E.5 Funding gap",
        level: 3,
        line: 40,
        blocks: [
          {
            type: "table",
            line: 42,
            headers,
            rows: rows.map((cells, at) => ({ line: 44 + at, cells })),
          },
        ],
      },
    ],
  }) as unknown as OutputEntry;
const view = (entries: OutputEntry[]) =>
  ({
    catalogue: undefined,
    lead: undefined,
    entries,
    modules: [],
    models: [],
  }) as unknown as ReportView;
const gapOf = (headers: string[], rows: string[][]) =>
  fundingGap(view([handoff("CP-2D", headers, rows)])).gaps[0];

it("keeps a period tag in a label and a stated figure; strips only a register id", () => {
  expect(gapOf(["Line", "Value"], [["Funding gap (H2)", "6 months (Q2)"]])).toMatchObject({
    label: "Funding gap (H2)",
    figures: [{ text: "6 months (Q2)" }],
  });
  expect(gapOf(["Line", "Value"], [["Funding gap (P50)", "10 (T2E.3.r03)"]])).toMatchObject({
    label: "Funding gap (P50)",
    figures: [{ text: "10" }],
  });
  expect(gapOf(["Line", "Value"], [["Funding gap (C05.r2)", "7"]])?.label).toBe("Funding gap");
});

it("draws a referenced gap cell as its amount with the reference removed", () => {
  const gap = gapOf(["Line", "Value"], [["Funding gap", "120 (credit_agreement.pdf page 4)"]]);
  expect(gap?.figures).toEqual([{ header: "Value", text: "120", value: 120 }]);
});

it("draws a referenced gap cell with no drawable amount as a gap, never as a sentence", () => {
  const gap = gapOf(["Line", "Value"], [["Funding gap", "about 120 per credit_agreement.pdf"]]);
  expect(gap?.figures).toEqual([{ header: "Value", text: NOT_STATED_IN_ROW, value: null }]);
  expect(gap?.unitInFigure).toBe(false);
});

const NET_A = "Net leverage (net debt / Adj EBITDA)";
const NET_B = "Net leverage (total debt / Adj EBITDA)";
const ok = (exact: string) => ({ status: "value", exact, display: exact });
const grid = (label: string, group: string, cell: unknown) => ({
  units: "USD millions",
  columns: [{ label: "FY2025E", group }],
  rows: [{ label, band: "Leverage", kind: "multiple", total: false, cells: [cell] }],
});

it("merges rows of two grids only when their labels match", () => {
  const model = (otherLabel: string) => ({
    cashflow: {
      ...grid(NET_A, "Base case", ok("1")),
      other: grid(otherLabel, "Downside", ok("2")),
    },
  });
  const different = forecastMeasure(model(NET_B), /^Net leverage\b/);
  expect(different?.label).toBe(NET_A);
  expect(different?.cases.map((item) => item.group)).toEqual(["Base case"]);
  expect(different?.others).toEqual([NET_B]);
  const same = forecastMeasure(model(`Net leverage (net debt /  Adj EBITDA) `), /^Net leverage\b/);
  expect(same?.cases.map((item) => item.group)).toEqual(["Base case", "Downside"]);
});
