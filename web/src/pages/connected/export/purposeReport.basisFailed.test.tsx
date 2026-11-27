import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { PublishedRun, Section, Snapshot } from "../publishedReport";
import { reportExports } from "./reportExport";

const folder = "verified-fixture";
const date = "2025-11-30";
const safeBasis = `Synthetic Compliance_Monitor snapshot as of ${date}.`;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function portfolioSnapshot() {
  const run: PublishedRun = {
    issuer: "Example Issuer",
    pathway: "portfolio_decision",
    folder,
    asOf: date,
    period: "",
    title: "",
    publicationVerified: true,
    assessmentScope: "partial",
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
  const add = (module: string, sections: Section[], n: string) => {
    const id = `${folder}/${module}-selected.md`;
    const sha256 = n.repeat(64);
    snapshot.workspace.outputs[id] = { id, run: folder, module, sha256, label: "", href: "" };
    snapshot.workspace.handoffs[sha256] = sections;
    run.modules[module] = { outputs: [id], default: id };
    return id;
  };
  const text = (heading: string, value: string, line: number): Section => ({
    heading,
    level: 3,
    line: line - 1,
    blocks: [{ type: "text", line, end: line, text: value }],
  });
  const findings: Section = { level: 2, heading: "Findings", line: 3, blocks: [] };
  add(
    "CP-3",
    [
      findings,
      text(
        "Portfolio view",
        "LQD reported 33,773,000 USD par of five ARCC notes at a combined 33,762,233.40 USD value, 0.109532894% of matching fund NAV. This measures the named issuer's held exposure; a small NAV share alone does not prove unused capacity, diversification compliance or easy exit. Two notes maturing in2029 account for 17,698,117.83 USD, 52.419866957% of this issuer holding's value; this is the fund's ARCC maturity grouping, not ARCC's total refinancing wall.",
        10,
      ),
      {
        heading: "T3C.1 — Portfolio Input Gate",
        level: 3,
        line: 29,
        blocks: [
          {
            type: "table",
            line: 30,
            headers: ["Input", "Available / Missing", "Source", "Limitation", "Portfolio Impact"],
            rows: [
              {
                line: 32,
                cells: [
                  "Holdings and denominator",
                  `Available for${date}`,
                  "Synthetic fixture observations",
                  "Historical fund report, not current trade inventory",
                  "Dated observations only",
                ],
              },
            ],
          },
        ],
      },
    ],
    "b",
  );
  const id = add(
    "CP-6",
    [
      findings,
      text("Bottom line", "Evaluate the portfolio exposure.", 10),
      {
        heading: "Chart data: portfolio limits",
        level: 3,
        line: 19,
        blocks: [
          {
            type: "table",
            line: 20,
            headers: [
              "Limit",
              "Current exposure",
              "Proposed exposure",
              "Limit value",
              "Reporting unit",
              "Basis and limitation",
            ],
            rows: [
              {
                line: 22,
                cells: [
                  "Single issuer",
                  "2.37",
                  "2.40",
                  "2.50",
                  "% NAV",
                  `${safeBasis} Proposal is illustrative.`,
                ],
              },
              {
                line: 23,
                cells: ["Unrated", "0", "Not supplied: no comparison", "5.00", "% NAV", safeBasis],
              },
            ],
          },
        ],
      },
    ],
    "c",
  );
  const output = snapshot.workspace.outputs[id];
  if (!output) throw new Error("Missing fixture");
  output.charts = [{ kind: "limits", title: "Portfolio limits", table: 20 }];
  run.actionTreatment = {
    "CP-6": {
      output: id,
      sha256: output.sha256,
      scope: "committee",
      state: "withheld",
      reason: "Committee action requires more work.",
    },
  };
  return snapshot;
}

it("says the portfolio basis could not be loaded, not that no chart is shown, when its request fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", () => Promise.resolve(new Response("boom", { status: 500 })));
  const report = reportExports(portfolioSnapshot(), folder, "live").resolve("portfolio-decision");
  if (report.state !== "ready") throw new Error(report.reason);
  render(report.document.content);
  expect(await screen.findByText("The portfolio basis could not be loaded.")).toBeVisible();
  expect(
    screen.queryByText("The portfolio exposure and limits chart is not shown in this report."),
  ).toBeNull();
});
