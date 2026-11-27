import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import type { ReportView } from "../reportView";
import { WhatBreaks } from "./ForecastBreaks";
import { readMeasure } from "./forecastData";

const table = (line: number, headers: string[], rows: string[][]) => ({
  type: "table" as const,
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const entryOf = (module: string, sections: unknown[], charts: unknown[] = []) =>
  ({
    selected: true,
    output: {
      id: module,
      sha256: "e".repeat(64),
      module,
      label: "",
      href: "",
      state: { established: true, declared: null },
      charts,
    },
    sections,
  }) as unknown as OutputEntry;
const bottom = (text: string) => ({
  heading: "Bottom line",
  level: 3,
  line: 18,
  blocks: [{ type: "text", line: 20, end: 20, text }],
});
const view = (entries: OutputEntry[]) =>
  ({ catalogue: undefined, lead: undefined, entries, modules: [], models: [] }) as ReportView;

const model = (reason: string) => ({
  cashflow: {
    units: "USD millions",
    columns: [{ label: "FY2025E", group: "Base case" }],
    rows: [
      {
        label: "Accessible liquidity",
        band: "Cash",
        kind: "money",
        total: false,
        cells: [{ status: "na", display: "n.a.", reason }],
      },
    ],
  },
});
const legal = entryOf(
  "CP-4",
  [
    { heading: "Findings", level: 2, line: 16, blocks: [] },
    bottom("The covenants hold."),
    {
      heading: "Chart data: covenant headroom",
      level: 3,
      line: 41,
      blocks: [
        table(
          43,
          ["Test", "Threshold", "Current", "Headroom", "Direction", "Reporting unit", "Basis"],
          [
            [
              "Net leverage",
              "5.0",
              "Not supplied: see credit_agreement.pdf p.4",
              "0.8x",
              "Passes at or below",
              "x",
              "Synthetic.",
            ],
          ],
        ),
      ],
    },
  ],
  [
    {
      title: "Covenant headroom",
      table: 43,
      kind: "bullet",
      direction: 4,
      label: [0],
      threshold: 1,
      current: 2,
      headroom: 3,
      unit: "",
      columns: [1, 2],
    },
  ],
);
const downside = entryOf("CP-2A", [
  { heading: "Findings", level: 2, line: 16, blocks: [] },
  bottom("The issuer withstands the shock."),
  {
    heading: "T2DS.1 Scenarios",
    level: 4,
    line: 94,
    blocks: [
      table(
        96,
        ["Scenario ID", "Name", "EBITDA decline s", "Anchor"],
        [
          ["s00", "Control (unstressed)", "0", "LTM"],
          ["s01", "Cost shock", "0.1 (10%)", "Held"],
        ],
      ),
    ],
  },
  {
    heading: "T2DS.4 Stressed flows and metrics",
    level: 4,
    line: 104,
    blocks: [
      table(
        106,
        ["Metric", "s00", "s01", "Source"],
        [
          ["All-in cover (x)", "3.10", "2.00", "Filing p.1"],
          ["Net leverage (x)", "1.25", "Not calculated see annual_report.pdf p.9", "Filing p.1"],
        ],
      ),
    ],
  },
]);

function breaks(entries: OutputEntry[], reason = "Not modelled") {
  return render(
    <WhatBreaks
      view={view(entries)}
      folder="current"
      liquidity={readMeasure(model(reason), "accessible liquidity", /^Accessible liquidity\b/)}
      group="Base case"
      caseName="Base case"
      schedule={{ years: [], offAxis: [], unit: "", reason: "No schedule." }}
      source={(name) => <button type="button">{`Show sources for ${name}`}</button>}
    />,
  );
}

it("R1: a covenant cell with no value that cites a source is a reason, not an amount", () => {
  const { container } = breaks([legal, downside]);
  expect(container.textContent).not.toContain("Amount recorded in model evidence");
  expect(container.textContent).toContain("Current Reason recorded in model evidence.");
});

it("R5: the stress note ends in one stop", () => {
  const { container } = breaks([legal, downside]);
  expect(container.textContent).toContain("Reason recorded in model evidence.");
  expect(container.textContent).not.toMatch(/\.\./u);
});

it("R7: a whitespace-only liquidity reason is drawn as no reason", () => {
  breaks([legal, downside], "   ");
  const region = within(screen.getByRole("region", { name: "Accessible liquidity, Base case" }));
  expect(region.getByText("n.a.")).toBeInTheDocument();
});
