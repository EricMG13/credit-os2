import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { CatalogueRun, OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
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

function page(module: "CP-1" | "CP-2A") {
  const entry: OutputEntry = {
    selected: true,
    output: { id: `r/${module}.md`, module, label: "a", href: "", sha256: "a".repeat(64) },
    sections: SECTIONS,
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
  expect(drawnSignal(container)).toEqual([]);
});
