import { render } from "@testing-library/react";
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
      charts: [],
    },
    sections,
  }) as unknown as OutputEntry;
const view = (entries: OutputEntry[]) =>
  ({ catalogue: undefined, lead: undefined, entries, modules: [], models: [] }) as ReportView;
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
        cells: [{ status: "na", display: "n.a.", reason: "Not modelled" }],
      },
    ],
  },
};

const downside = (rows: string[][], kind = "Analyst Interpretation; Medium") =>
  entryOf("CP-2A", [
    {
      heading: "T2DS.1 Scenario assumptions",
      level: 4,
      line: 94,
      blocks: [
        table(
          96,
          [
            "Case",
            "EBITDA decline fraction s",
            "Cash-interest increase fraction k",
            "Classification / confidence",
            "Anchor and selection rationale",
            "Exclusions",
          ],
          [
            ["s00 control", "0", "0", "Control, not a forecast", "Base", "None"],
            ["s01 cost shock", "0.1 (10%)", "0", kind, "Held", "None"],
          ],
        ),
      ],
    },
    {
      heading: "T2DS.4 Stressed flows and metrics",
      level: 4,
      line: 104,
      blocks: [table(106, ["Metric", "s00", "s01", "Source"], rows)],
    },
  ]);

function breaks(entry: OutputEntry) {
  return render(
    <WhatBreaks
      view={view([entry])}
      folder="current"
      liquidity={readMeasure(model, "accessible liquidity", /^Accessible liquidity\b/)}
      group="Base case"
      caseName="Base case"
      schedule={{ years: [], offAxis: [], unit: "", reason: "No schedule." }}
      source={(name) => <button type="button">{`Show sources for ${name}`}</button>}
    />,
  );
}

it("C4-4 draws no file, page or note from a case's classification", () => {
  const { container } = breaks(
    downside(
      [["All-in cover (x)", "3.10", "2.00", "F"]],
      "Analyst Interpretation; Medium (see Note 4, credit_agreement.pdf p.12)",
    ),
  );
  const text = container.textContent;
  expect(text).not.toMatch(/credit_agreement|p\.12|Note 4/u);
  expect(text).toContain("Reason recorded in model evidence.");
  expect(text).toContain("control: Control, not a forecast.");
});

it("C4-4 sets aside a citing bracket and keeps the module's words", () => {
  const { container } = breaks(
    downside(
      [["All-in cover (x)", "3.10", "2.00", "F"]],
      "Analyst Interpretation; Medium (see p.12)",
    ),
  );
  expect(container.textContent).toContain("cost shock: Analyst Interpretation; Medium.");
  expect(container.textContent).not.toMatch(/p\.12/u);
});

it("C4-1 states a short bare value labelled stated, not drawn, in the notes", () => {
  const { container } = breaks(downside([["FCF / debt", "0.0756", "0.0437", "F"]]));
  const text = container.textContent;
  expect(text).toContain("Stated, not drawn");
  expect(text).toContain("control, FCF / debt: 0.0756.");
  expect(text).toContain("cost shock, FCF / debt: 0.0437.");
});

it("C4-R1 keeps a citing case's name before the reader sentence", () => {
  const { container } = breaks(
    downside(
      [["All-in cover (x)", "3.10", "2.00", "F"]],
      "Analyst Interpretation per credit_agreement.pdf p.12 basis",
    ),
  );
  const text = container.textContent;
  expect(text).toContain("cost shock: Reason recorded in model evidence.");
  expect(text).not.toMatch(/credit_agreement|p\.12/u);
});
