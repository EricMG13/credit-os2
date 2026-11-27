import { render } from "@testing-library/react";
import type { OutputEntry, Section, Table } from "../publishedReport";
import type { ReportView } from "../reportView";
import { WhatBreaks, type BreaksSchedule } from "./ForecastBreaks";
import { readMeasure } from "./forecastData";

export function table(line: number, headers: string[], rows: string[][]): Table {
  return {
    type: "table",
    line,
    headers,
    rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
  };
}

export function entryOf(
  module: string,
  sections: Section[],
  charts: NonNullable<OutputEntry["output"]["charts"]> = [],
): OutputEntry {
  return {
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
  };
}

function findings(text: string): Section[] {
  return [
    { heading: "Findings", level: 2, line: 16, blocks: [] },
    {
      heading: "Bottom line",
      level: 3,
      line: 18,
      blocks: [{ type: "text", line: 20, end: 20, text }],
    },
  ];
}

export function covenant(threshold: string, current: string): OutputEntry {
  const tableLine = 43;
  return entryOf(
    "CP-4",
    [
      ...findings("The covenants hold."),
      {
        heading: "Chart data: covenant headroom",
        level: 3,
        line: 41,
        blocks: [
          table(
            tableLine,
            ["Test", "Threshold", "Current", "Headroom", "Direction", "Reporting unit", "Basis"],
            [["Net leverage", threshold, current, "0.8x", "Passes at or below", "x", "Synthetic."]],
          ),
        ],
      },
    ],
    [
      {
        title: "Covenant headroom",
        table: tableLine,
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
}

export function stressedMetrics(rows: string[][]): Section {
  return {
    heading: "T2DS.4 Stressed flows and metrics",
    level: 4,
    line: 104,
    blocks: [table(106, ["Metric", "s00", "s01", "Source"], rows)],
  };
}

export function standardDownside(
  stressedLeverage: string,
  controlCover = "3.10",
  stressedCover = "2.00",
): OutputEntry {
  return entryOf("CP-2A", [
    ...findings("The issuer withstands the shock."),
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
    stressedMetrics([
      ["All-in cover (x)", controlCover, stressedCover, "Filing p.1"],
      ["Net leverage (x)", "1.25", stressedLeverage, "Filing p.1"],
    ]),
  ]);
}

export function renderBreaks(
  entries: OutputEntry[],
  reason = "Not modelled",
  schedule: BreaksSchedule = { years: [], offAxis: [], unit: "", reason: "No schedule." },
) {
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
          cells: [{ status: "na", display: "n.a.", reason }],
        },
      ],
    },
  };
  const view: ReportView = {
    catalogue: undefined,
    lead: undefined,
    entries,
    modules: [],
    models: [],
  };
  return render(
    <WhatBreaks
      view={view}
      folder="current"
      liquidity={readMeasure(model, "accessible liquidity", /^Accessible liquidity\b/)}
      group="Base case"
      caseName="Base case"
      schedule={schedule}
      source={(name) => <button type="button">{`Show sources for ${name}`}</button>}
    />,
  );
}
