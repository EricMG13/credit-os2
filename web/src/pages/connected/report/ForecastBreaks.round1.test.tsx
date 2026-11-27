import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import type { ReportView } from "../reportView";
import { WhatBreaks } from "./ForecastBreaks";
import { readMeasure } from "./forecastData";

const RAW = /credit_agreement|annual_report|\.pdf|\bpages?\s+\d|\[E\d+\]|T2E\.\d/u;

const table = (line: number, headers: string[], rows: string[][]) => ({
  type: "table" as const,
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const entryOf = (module: string, sections: unknown[]) =>
  ({
    selected: true,
    output: {
      id: module,
      sha256: "e".repeat(64),
      module,
      label: "",
      href: "",
      state: { established: true, declared: null },
      charts:
        module === "CP-4"
          ? [
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
            ]
          : [],
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

const REASON = "Liquidity not modelled (T2E.3.r03) see credit_agreement.pdf page 4";
const model = {
  cashflow: {
    units: "USD millions",
    columns: [{ label: "FY2025E", group: "Base case" }],
    rows: [
      {
        label: "Accessible liquidity",
        band: "Cash",
        kind: "money",
        total: false,
        cells: [{ status: "na", display: "n.a.", reason: REASON }],
      },
    ],
  },
};
const schedule = {
  years: [
    {
      year: 2026,
      label: "FY2026",
      key: "FY2026",
      cell: { text: "6637 (annual_report.pdf pages 59, 153)", value: null, reason: null },
    },
  ],
  offAxis: [],
  unit: "US$m",
  reason: null,
};
const legal = entryOf("CP-4", [
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
            "5.0 per credit_agreement.pdf page 4",
            "Not supplied: net debt missing [E14]",
            "0.8x",
            "Passes at or below",
            "x",
            "Synthetic.",
          ],
        ],
      ),
    ],
  },
]);
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
          [
            "All-in cover (x)",
            "3.10 per annual_report.pdf page 9",
            "2.00 (annual_report.pdf page 9)",
            "Filing p.1",
          ],
          ["Net leverage (x)", "1.25", "Not calculated: net debt missing [E14]", "Filing p.1"],
        ],
      ),
    ],
  },
]);

function breaks(entries: OutputEntry[]) {
  return render(
    <WhatBreaks
      view={view(entries)}
      folder="current"
      liquidity={readMeasure(model, "accessible liquidity", /^Accessible liquidity\b/)}
      group="Base case"
      caseName="Base case"
      schedule={schedule}
      source={(name) => <button type="button">{`Show sources for ${name}`}</button>}
    />,
  );
}

it("draws no file name, page, marker or register id in the liquidity gap, schedule, covenant or stress parts", () => {
  const { container } = breaks([legal, downside]);
  const drawn = [
    container.textContent,
    ...[...container.querySelectorAll("[aria-label]")].map((node) =>
      node.getAttribute("aria-label"),
    ),
  ].join("\n");
  expect(drawn).not.toMatch(RAW);
  const liquidity = within(screen.getByRole("region", { name: "Accessible liquidity, Base case" }));
  expect(liquidity.getByText("n.a.: Reason recorded in model evidence.")).toBeInTheDocument();
  const debt = within(screen.getByRole("region", { name: "Debt maturing" }));
  expect(debt.getByText("6637")).toBeInTheDocument();
  const drawing = within(screen.getByRole("group", { name: "Point-in-time stress" })).getByRole(
    "img",
  );
  expect(within(drawing).getByText("2.00")).toBeInTheDocument();
});
