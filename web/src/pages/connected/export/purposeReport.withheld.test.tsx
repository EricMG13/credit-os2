import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { PublishedRun, Section, Snapshot } from "../publishedReport";
import { reportExports, type ExportId } from "./reportExport";

const folder = "verified-fixture";
const date = "2025-11-30";
const NOT_SHOWN = "1 passage in this section is not shown in this report.";

function text(heading: string, value: string, line: number): Section {
  return {
    heading,
    level: 3,
    line: line - 1,
    blocks: [{ type: "text", line, end: line, text: value }],
  };
}

function context(heading: string): Section {
  return { level: 2, heading, line: 3, blocks: [] };
}

function memo(rows: string[][]): Section {
  return {
    heading: "CIO Final Memo",
    level: 3,
    line: 40,
    blocks: [
      {
        type: "table",
        line: 41,
        headers: ["Required element", "Terminal portfolio view for separate delivery"],
        rows: rows.map((cells, index) => ({ line: 43 + index, cells })),
      },
    ],
  };
}

function publication(pathway: string) {
  const run: PublishedRun = {
    issuer: "Example Issuer",
    pathway,
    folder,
    asOf: date,
    period: "",
    title: "",
    publicationVerified: true,
    assessmentScope: "unverified",
    methodChanges: ["Earlier methods"],
    modules: {},
    evidence: {
      sources: [],
      unused: [],
      unrecorded: [],
      noSourcesModules: [],
      handoffs: [],
      zip: null,
      downloads: [],
      record: { hashes: [], instructions: [], calls: [], cap: null },
    },
  };
  const snapshot: Snapshot = {
    reportFolder: folder,
    catalogue: { real: [] },
    workspace: { runs: { [folder]: run }, outputs: {}, handoffs: {}, models: [] },
    chips: {},
  };
  function add(module: string, sections: Section[]) {
    const id = `${folder}/${module}-selected.md`;
    const sha256 = (Object.keys(snapshot.workspace.outputs).length + 1)
      .toString(16)
      .padStart(64, "a");
    snapshot.workspace.outputs[id] = { id, run: folder, module, sha256, label: "", href: "" };
    snapshot.workspace.handoffs[sha256] = sections;
    run.modules[module] = { outputs: [id], default: id };
  }
  return { snapshot, add };
}

function open(snapshot: Snapshot, id: ExportId) {
  const report = reportExports(snapshot, folder, "live").resolve(id);
  if (report.state !== "ready") throw new Error(report.reason);
  return render(report.document.content);
}

afterEach(cleanup);

const EXTRA = " A further limitation on loan-on-value remains.";

const CLEAN =
  "Both securities: Requires More Work; RV Unclear. Positive comparative work now establishes what the apparent compensation difference actually depends on. If both annual equivalents are clean, July's maturity yield exceeds March's by 2.210154bp, but the same-date Treasury-tenor adjustment leaves only 0.160839bp of simple residual difference. Source fair values are rounded to USDm: an analyst nearest-million display-precision sensitivity, varying each value independently by±0.5USDm, makes the yield gap range from −0.616287 to5.036816bp. A precise ordering is not supported in that case.";
const DIRTY =
  "If both equivalents are dirty, July's extra yield is18.522010bp and simple residual difference16.472695bp; rounding alone leaves that yield ordering positive. That is the strongest compensation countercase for July, but neither price basis nor executable depth is established.";

function relativeValue(clean: string, dirty: string) {
  const { snapshot, add } = publication("relative_value");
  add("CP-3", [
    context("Findings"),
    text("Security-selection view", clean, 10),
    text("Security-selection view", dirty, 15),
    {
      heading: "T3.5 — Relative value table",
      level: 3,
      line: 19,
      blocks: [
        {
          type: "table",
          line: 20,
          headers: [
            "Security",
            "Market Level",
            "Market Date",
            "Quote Quality",
            "Seniority / Security",
          ],
          rows: [
            [
              "March2029 US04010LBF94",
              "Evaluated101.000000 per100; quoted.",
              "effective/structural subordination",
            ],
            [
              "July2029 US04010LBG77",
              "Evaluated101.294118 per100; quoted.",
              "no equal-covenant/guarantee assumption",
            ],
          ].map(([security = "", level = "", rank = ""], index) => ({
            line: 22 + index,
            cells: [security, level, date, "Issuer mark", `Parent senior unsecured; ${rank}`],
          })),
        },
      ],
    },
    {
      heading: "Conditional yield observations",
      level: 3,
      line: 34,
      blocks: [
        {
          type: "table",
          line: 35,
          headers: ["Instrument", "Maturity", "Price basis", "Yield, %"],
          rows: [
            ["US04010LBF94", "2029-03-01", "Assume clean", "5.600264521"],
            ["US04010LBF94", "2029-03-01", "Assume dirty", "6.131728905"],
            ["US04010LBG77", "2029-07-15", "Assume clean", "5.622366058"],
            ["US04010LBG77", "2029-07-15", "Assume dirty", "6.316949000"],
          ].map((cells, index) => ({ line: 37 + index, cells })),
        },
      ],
    },
  ]);
  return snapshot;
}

it("counts a clean relative-value passage whose tail is not printed", () => {
  const { container } = open(relativeValue(CLEAN + EXTRA, DIRTY), "relative-value");
  expect(screen.getByText(/A precise ordering is not supported in that case\.$/)).toBeVisible();
  expect(container.textContent).not.toContain("loan-on-value");
  expect(screen.getAllByText(NOT_SHOWN)).toHaveLength(1);
});

it("counts a dirty relative-value passage whose tail is not printed", () => {
  const { container } = open(relativeValue(CLEAN, DIRTY + EXTRA), "relative-value");
  expect(container.textContent).not.toContain("loan-on-value");
  expect(screen.getAllByText(NOT_SHOWN)).toHaveLength(1);
});

it("counts a disposition passage that falls back to the bare disposition", () => {
  const { container } = open(
    relativeValue("Both securities: Requires More Work; RV Unclear. Something else.", DIRTY),
    "relative-value",
  );
  expect(screen.getByText("Both securities: Requires More Work; RV Unclear.")).toBeVisible();
  expect(container.textContent).not.toContain("Something else");
  expect(screen.getAllByText(NOT_SHOWN)).toHaveLength(1);
});

it("prints no not-shown line for relative-value passages with nothing after the verified text", () => {
  const { container } = open(relativeValue(CLEAN, DIRTY), "relative-value");
  expect(container.textContent).not.toMatch(/passages? in this section/);
});

const EXPOSURE =
  "LQD reported 33,773,000 USD par of five ARCC notes at a combined 33,762,233.40 USD value, 0.109532894% of matching fund NAV. This measures the named issuer's held exposure; a small NAV share alone does not prove unused capacity, diversification compliance or easy exit. Two notes maturing in2029 account for 17,698,117.83 USD, 52.419866957% of this issuer holding's value; this is the fund's ARCC maturity grouping, not ARCC's total refinancing wall.";
const STRESS =
  "A purely conditional40%-of-par recovery assumption implies a20,253,033.40 USD loss against the held market value, 6.570576451 fund-NAV basis points. No fund loss budget is supplied, so this is loss transmission, not risk-budget utilization or an actual recovery forecast.";
const POSTURE =
  "Final Sizing Posture: Requires More Work. The decision is driven by real held exposure and conditional losses alongside missing same-date compensation, mandate, loss-budget and execution evidence, because known marked value and small NAV share do not establish permissible risk capacity or executable proceeds, which implies no supported portfolio implementation or new size.";
const WINNER =
  "Neither wins: measured footprint/loss supports analysis, but no supported RV inclusion case or proved binding breach";

function portfolio(parts: {
  posture?: string;
  exposure?: string;
  stress?: string;
  winner?: string;
}) {
  const { snapshot, add } = publication("portfolio_decision");
  add("CP-6", [
    context("Findings"),
    text("Final Sizing Posture", parts.posture ?? POSTURE, 10),
    memo([["Winner / why", parts.winner ?? WINNER]]),
  ]);
  add("CP-3", [
    context("Findings"),
    text("Portfolio view", parts.exposure ?? EXPOSURE, 19),
    text("Portfolio view", parts.stress ?? STRESS, 21),
  ]);
  return snapshot;
}

it("prints no not-shown line when portfolio passages end where the verified text ends", () => {
  const { container } = open(portfolio({}), "portfolio-decision");
  expect(screen.getByText(/20,253,033\.40 USD/)).toBeVisible();
  expect(container.textContent).not.toMatch(
    /not shown in this report\.$|passages? in this section/,
  );
});

it.each([
  ["exposure", { exposure: EXPOSURE + EXTRA }],
  ["stress", { stress: STRESS + EXTRA }],
  ["posture", { posture: POSTURE + EXTRA }],
  ["committee challenge", { winner: WINNER + ". The cap is unknown." }],
])("counts a %s passage whose tail is not printed", (_name, parts) => {
  const { container } = open(portfolio(parts), "portfolio-decision");
  expect(container.textContent).not.toContain("loan-on-value");
  expect(container.textContent).not.toContain("cap is unknown");
  expect(screen.getAllByText(NOT_SHOWN)).toHaveLength(1);
});
