import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { CatalogueRun, OutputEntry, PublishedRun, Snapshot, Table } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Modules } from "./Modules";

afterEach(cleanup);

type View = ReturnType<typeof buildReportView>;

/** The CP-1 chart-data table the catalogue's headline figures are read against (ModuleStats.test). */
const SECTIONS: OutputEntry["sections"] = [
  {
    heading: "Chart data: leverage",
    level: 3,
    line: 40,
    blocks: [
      {
        type: "table",
        line: 41,
        headers: ["Period", "Total debt / EBITDA", "Net debt / EBITDA"],
        rows: [{ line: 43, cells: ["FY2024", "6.53", "4.88"] }],
      },
    ],
  },
];

// Stated figures with a prior and a change, so a better or a worse reading can arise.
const catalogue = {
  id: "r",
  metrics: {
    leverage: {
      value: "6.53",
      unit: "x",
      period: "FY2024",
      prior: { value: "6.27", period: "FY2023" },
      change: "0.26",
    },
    net_leverage: {
      value: "4.88",
      unit: "x",
      period: "FY2024",
      prior: { value: "5.38", period: "FY2023" },
      change: "-0.50",
    },
  },
} as unknown as CatalogueRun;

function table(line: number, headers: string[], rows: string[][]): Table {
  return {
    type: "table",
    line,
    headers,
    rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
  };
}

/** The Downside tables whose tiles draw bars: scenarios, stressed results and break points. */
const DOWNSIDE: OutputEntry["sections"] = [
  {
    heading: "T2DS.1 Scenarios",
    level: 3,
    line: 60,
    blocks: [
      table(
        61,
        [
          "Scenario ID",
          "Name",
          "EBITDA decline s",
          "Cash-interest increase k",
          "Anchor",
          "What the assumption leaves out",
          "Category",
          "Confidence",
        ],
        [
          ["c", "Observed period", "0", "0", "LTM to 2025-03-31", "", "", ""],
          [
            "a",
            "Lower margin",
            "0.10 (10%)",
            "0",
            "Stress assumption",
            "Funding unchanged",
            "Analyst Interpretation",
            "Medium",
          ],
        ],
      ),
    ],
  },
  {
    heading: "T2DS.4 Stressed flows and metrics",
    level: 3,
    line: 70,
    blocks: [
      table(
        71,
        ["Metric", "a", "c", "Source"],
        [
          ["Free cash flow (USD millions)", "50.00", "62.00", "Filing p.1"],
          ["Interest cover (x)", "1.00", "1.70", "Filing p.2"],
        ],
      ),
    ],
  },
  {
    heading: "T2DS.6 Break points",
    level: 3,
    line: 80,
    blocks: [
      table(
        81,
        [
          "Break ID",
          "Break",
          "EBITDA decline at break (interest held)",
          "EBITDA decline at break (k = 0.05)",
          "Status",
          "Source",
        ],
        [
          ["B1", "FCF reaches zero", "0.10 (10%)", "0.20 (20%)", "Calculated", "Filing p.2"],
          ["B2", "Cover reaches watch", "0.15 (15%)", "0.12 (12%)", "Watch level", "Filing p.1"],
        ],
      ),
    ],
  },
];

function page(module: "CP-1" | "CP-2A") {
  const entry: OutputEntry = {
    selected: true,
    output: { id: `r/${module}.md`, module, label: "a", href: "", sha256: "a".repeat(64) },
    sections: module === "CP-2A" ? [...SECTIONS, ...DOWNSIDE] : SECTIONS,
  };
  const view: View = {
    entries: [entry],
    modules: [
      {
        id: module,
        name: module === "CP-1" ? "Financial foundation" : "Downside scenarios",
        state: "Delivered",
        outputs: [entry],
      },
    ],
    catalogue,
    lead: undefined,
    models: [],
  };
  const run = { folder: "r", issuer: "Issuer", asOf: "2026-10-31" } as PublishedRun;
  return render(
    <Modules view={view} run={run} snapshot={{ chips: {} } as Snapshot} module={module} />,
  );
}

const SIGNAL = /better-mark|worse-mark|scale-better|scale-worse/;
const drawnSignal = (root: HTMLElement) =>
  [...root.querySelectorAll("*")].filter((node) => SIGNAL.test(node.getAttribute("class") ?? ""));

// Colour-signal-build ruling R2: better and worse marks belong to a stated reading, never to Downside.
it("draws better and worse marks on the CP-1 page from the same catalogue (positive control)", () => {
  const { container } = page("CP-1");
  expect(drawnSignal(container).length).toBeGreaterThan(0);
});

it("draws no better or worse mark on the CP-2A Downside page", () => {
  const { container } = page("CP-2A");
  // Non-vacuous: the Downside and break-point tiles do draw their bars, and none carries a mark.
  expect(container.querySelectorAll("[data-bar]").length).toBeGreaterThan(0);
  expect(container.querySelectorAll("[data-decline]").length).toBeGreaterThan(0);
  expect(drawnSignal(container)).toEqual([]);
});
