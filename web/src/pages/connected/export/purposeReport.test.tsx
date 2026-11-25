import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { PublishedRun, Section, Snapshot, Table } from "../publishedReport";
import { IssuerFrontPage } from "../report/IssuerFrontPage";
import { buildIssuerFrontPage } from "../report/frontPage";
import { buildReportView } from "../reportView";
import { specialistOverview } from "./purposeReport";
import { exportRoute, reportExports, type ExportId } from "./reportExport";

const folder = "verified-fixture";
const date = "2025-11-30";

function text(heading: string, value: string, line = 10): Section {
  return {
    heading,
    level: 3,
    line: line - 1,
    blocks: [{ type: "text", line, end: line, text: value }],
  };
}

function context(heading: string, line = 3): Section {
  return { level: 2, heading, line, blocks: [] };
}

function table(heading: string, headers: string[], cells: string[][], line = 20): Section {
  const block: Table = {
    type: "table",
    line,
    headers,
    rows: cells.map((values, index) => ({ line: line + index + 2, cells: values })),
  };
  return { heading, level: 3, line: line - 1, blocks: [block] };
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
  function add(module: string, sections: Section[], key = "selected") {
    const id = `${folder}/${module}-${key}.md`;
    const sha256 = (Object.keys(snapshot.workspace.outputs).length + 1)
      .toString(16)
      .padStart(64, "a");
    snapshot.workspace.outputs[id] = { id, run: folder, module, sha256, label: "", href: "" };
    snapshot.workspace.handoffs[sha256] = sections;
    const slot = run.modules[module] ?? { outputs: [], default: id };
    slot.outputs.push(id);
    run.modules[module] = slot;
    return { id, sha256 };
  }
  return { snapshot, run, add };
}

function open(snapshot: Snapshot, id: ExportId) {
  const available = reportExports(snapshot, folder, "live");
  expect(exportRoute(`#export/${id}`)).toBe(id);
  expect(available.options.map((option) => option.id)).toEqual([id]);
  const report = available.resolve(id);
  if (report.state !== "ready") throw new Error(report.reason);
  return render(report.document.content);
}

function unavailable(snapshot: Snapshot, id: ExportId) {
  const available = reportExports(snapshot, folder, "live");
  expect(available.options).toHaveLength(0);
  expect(available.resolve(id)).toEqual({ state: "unavailable", reason: available.reason });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("uses only the designated comparative earnings owner even when the foundation has results", () => {
  const { snapshot, add } = publication("earnings_update");
  add("CP-1", [context("Findings"), text("Bottom line", "Revenue rose in the foundation.")]);
  add("CP-1B", [
    context("Findings"),
    text("Bottom line", "Not assessable: the periods do not match."),
  ]);
  add(
    "CP-1B",
    [context("Findings"), text("Bottom line", "Assessment from a non-designated attempt.")],
    "other",
  );
  unavailable(snapshot, "earnings-update");
});

it("preserves a qualified earnings lead and rejects a mixed private observation with the whole row", () => {
  const { snapshot, add } = publication("earnings_update");
  add("CP-1B", [
    context("Findings"),
    text("Bottom line", "Sales improved, while cash fell.\nBasis: private-evidence.pdf"),
    table(
      "Chart data: prior and current results",
      ["Measure", "Prior", "Current", "Basis and limitation"],
      [
        ["Safe measure", "0", "Not supplied: no current observation", "USD millions"],
        ["Private measure", "5.911", "9.117", "C:\\broker\\evidence"],
      ],
    ),
  ]);
  open(snapshot, "earnings-update");
  expect(screen.getByText("Sales improved, while cash fell.")).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByText("Not supplied: no current observation")).toBeInTheDocument();
  expect(screen.queryByText("9.117")).toBeNull();
  expect(screen.queryByText(/private-evidence/)).toBeNull();
});

it.each(["Sources", "Next module", "Calculations"])(
  "does not draw an archived yield table from %s without the exact designated shape",
  (heading) => {
    const { snapshot, run, add } = publication("relative_value");
    run.assessmentScope = "unverified";
    run.methodChanges = ["Earlier methods"];
    const selection = text(
      "Security-selection view",
      "Both securities: Requires More Work; RV Unclear.",
    );
    selection.blocks.push({
      type: "text",
      line: 12,
      end: 12,
      text: "If both equivalents are dirty, the association remains conditional.",
    });
    const hidden = table(
      "Conditional yield observations",
      ["Instrument", "Maturity", "Price basis", "Yield, %"],
      heading === "Calculations" ? [] : [["March", "2029-03-01", "Assume clean", "6.000123456"]],
    );
    add("CP-3", [context("Findings"), selection, context(heading, 16), hidden]);
    add(
      "CP-3",
      [
        context("Findings"),
        selection,
        context("Calculations", 16),
        table(
          "Conditional yield observations",
          ["Instrument", "Maturity", "Price basis", "Yield, %"],
          [["Other", "2029-03-01", "Assume clean", "9.999999999"]],
        ),
      ],
      "other",
    );
    unavailable(snapshot, "relative-value");
  },
);

it("does not treat a blocked legal or recovery output as a printable finding", () => {
  const covenant = publication("covenant_refinancing");
  covenant.add("CP-4", [
    context("Findings"),
    text("Bottom line", "Not assessable: no test-date covenant inputs."),
  ]);
  unavailable(covenant.snapshot, "covenant-refinancing");
  const distressed = publication("distressed_restructuring");
  distressed.add("CP-4C", [
    context("Findings"),
    text("Bottom line", "Not assessable: the priority package is incomplete."),
  ]);
  unavailable(distressed.snapshot, "distressed-restructuring");
});

const datedExposure =
  "LQD reported 33,773,000 USD par of five ARCC notes at a combined 33,762,233.40 USD value, 0.109532894% of matching fund NAV. This measures the named issuer's held exposure; a small NAV share alone does not prove unused capacity, diversification compliance or easy exit. Two notes maturing in2029 account for 17,698,117.83 USD, 52.419866957% of this issuer holding's value; this is the fund's ARCC maturity grouping, not ARCC's total refinancing wall.";

it.each(["matched", "wrong table", "private basis", "proposal note"])(
  "prints current portfolio limits only with separable basis and matching attestation (%s)",
  async (kind) => {
    const matched = kind === "matched";
    const safeBasis = `Synthetic Compliance_Monitor snapshot as of ${date}.`;
    const { snapshot, run, add } = publication("portfolio_decision");
    add("CP-3", [
      context("Findings"),
      text("Portfolio view", datedExposure),
      table(
        "T3C.1 — Portfolio Input Gate",
        ["Input", "Available / Missing", "Source", "Limitation", "Portfolio Impact"],
        [
          [
            "Holdings and denominator",
            `Available for${date}`,
            "Synthetic fixture observations",
            "Historical fund report, not current trade inventory",
            "Dated observations only",
          ],
        ],
      ),
    ]);
    const selected = add("CP-6", [
      context("Findings"),
      text("Bottom line", "Evaluate the portfolio exposure."),
      table(
        "Chart data: portfolio limits",
        [
          "Limit",
          "Current exposure",
          "Proposed exposure",
          "Limit value",
          "Reporting unit",
          "Basis and limitation",
        ],
        [
          [
            "Single issuer",
            "2.37",
            "2.40",
            "2.50",
            "% NAV",
            kind === "private basis"
              ? "The analysis endorses 2.40% of NAV."
              : `${safeBasis} Proposal is illustrative.`,
          ],
          ["Unrated", "0", "Not supplied: no comparison", "5.00", "% NAV", safeBasis],
        ],
      ),
    ]);
    if (kind === "proposal note") {
      snapshot.workspace.handoffs[selected.sha256]?.at(-1)?.blocks.push({
        type: "text",
        line: 26,
        end: 26,
        text: "The analysis endorses 2.40% of NAV.",
      });
    }
    const committee = snapshot.workspace.outputs[selected.id];
    if (!committee) throw new Error("Missing committee fixture");
    committee.charts = [{ kind: "limits", title: "Portfolio limits", table: 20 }];
    run.actionTreatment = {
      "CP-6": {
        output: selected.id,
        sha256: selected.sha256,
        scope: "committee",
        state: "withheld",
        reason: "Committee action requires more work.",
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          Response.json({
            basis: {
              folder,
              output: selected.id,
              sha256: selected.sha256,
              asOf: date,
              tableLines: [kind === "wrong table" ? 250 : 20],
            },
          }),
        ),
      ),
    );
    const { container } = open(snapshot, "portfolio-decision");
    expect(screen.getByText("Committee action requires more work.")).toBeInTheDocument();
    expect(screen.getByText("Portfolio action and size withheld")).toBeInTheDocument();
    if (matched) {
      expect(
        await screen.findByRole("figure", { name: "Portfolio exposure and limits" }),
      ).toBeInTheDocument();
      expect(screen.getByText("2.37%")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText("limit 2.50%")).toBeInTheDocument();
    } else {
      expect(
        await screen.findByText(
          kind === "wrong table"
            ? "The portfolio exposure and limits chart is not shown in this report."
            : "No portfolio limits chart is shown in this report.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("2.37%")).toBeNull();
    }
    expect(container.textContent).not.toContain("2.40");
    expect(container.querySelectorAll("a[href]")).toHaveLength(0);
    expectNoRetiredSentence(container);
  },
);

it("binds a current grouped earnings figure to the selected output and preserves the paired measure", () => {
  const { snapshot, add } = publication("earnings_update");
  const owner = add("CP-1B", [
    context("Findings"),
    text("Bottom line", "Reported revenue rose on a comparable basis."),
    table(
      "Chart data: prior and current results",
      [
        "Measure",
        "Prior period",
        "Prior",
        "Current period",
        "Current",
        "Reporting unit",
        "Basis and limitation",
      ],
      [
        [
          "Revenue",
          "Q3-2024",
          "1789",
          "Q3-2025",
          "2006",
          "USDm",
          "Reported sales with the same basis",
        ],
      ],
    ),
  ]);
  const output = snapshot.workspace.outputs[owner.id];
  if (!output) throw new Error("Missing earnings fixture");
  output.charts = [
    {
      kind: "grouped",
      table: 20,
      title: "Prior and current results",
      label: 0,
      periods: [1, 3],
      prior: 2,
      current: 4,
      unit: "USDm",
    },
  ];
  open(snapshot, "earnings-update");
  expect(screen.getByRole("figure", { name: "Prior and current results" })).toBeInTheDocument();
  expect(screen.getAllByText("1789").length).toBeGreaterThan(0);
  expect(screen.getByText("Reported sales with the same basis")).toBeInTheDocument();
});

it("keeps supplied synthetic quote scenarios from qualifying a current market report", () => {
  const { snapshot, add } = publication("relative_value");
  add("CP-3", [context("Findings"), text("Bottom line", "The comparison remains limited.")]);
  add("CP-3D", [
    context("Findings"),
    text("Bottom line", "A hypothetical market scenario examines the curve."),
    table(
      "Chart data: yield against maturity",
      [
        "Instrument",
        "Maturity date",
        "Yield",
        "Spread",
        "Quote date",
        "Source class",
        "Reporting unit",
        "Basis and limitation",
      ],
      [
        [
          "Example security",
          "2030-01-01",
          "9.69",
          "Not supplied: no spread",
          date,
          "Synthetic scenario",
          "%",
          "Illustrative data",
        ],
      ],
    ),
  ]);
  unavailable(snapshot, "relative-value");
});

it("withholds a whole chart observation when its attached qualification is private", () => {
  const { snapshot, add } = publication("earnings_update");
  const observations = table(
    "Chart data: prior and current results",
    [
      "Measure",
      "Prior period",
      "Prior",
      "Current period",
      "Current",
      "Reporting unit",
      "Basis and limitation",
    ],
    [
      [
        "Revenue",
        "Q3-2024",
        "123.456",
        "Q3-2025",
        "789.123",
        "USDm",
        "Requires the qualification below",
      ],
    ],
  );
  observations.blocks.push({
    type: "text",
    line: 24,
    end: 24,
    text: "Use the qualification in private-methodology.pdf.",
  });
  const owner = add("CP-1B", [
    context("Findings"),
    text("Bottom line", "Reported revenue changed."),
    observations,
  ]);
  const output = snapshot.workspace.outputs[owner.id];
  if (!output) throw new Error("Missing earnings fixture");
  output.charts = [
    {
      kind: "grouped",
      table: 20,
      title: "Prior and current results",
      label: 0,
      periods: [1, 3],
      prior: 2,
      current: 4,
      unit: "USDm",
    },
  ];
  open(snapshot, "earnings-update");
  expect(screen.getByText(/observation qualifications are only available/)).toBeInTheDocument();
  expect(screen.queryByRole("figure")).toBeNull();
  expect(screen.queryByText("789.123")).toBeNull();
  expect(screen.queryByText("123.456")).toBeNull();
});

it("keeps typed dated yields with the hold and excludes preferred-at-98 lead prose", () => {
  const { snapshot, run, add } = publication("relative_value");
  const decision = add("CP-3", [
    context("Findings"),
    text("Bottom line", "The practical call is held."),
  ]);
  run.actionTreatment = {
    "CP-3": {
      output: decision.id,
      sha256: decision.sha256,
      scope: "instrument",
      state: "withheld",
      reason: "The market depth is unavailable.",
    },
  };
  const market = add("CP-3D", [
    context("Findings"),
    text("Bottom line", "The 2029 note is our preferred instrument at 98."),
    table(
      "Chart data: yield against maturity",
      [
        "Instrument",
        "Maturity date",
        "Yield",
        "Spread",
        "Quote date",
        "Source class",
        "Reporting unit",
        "Basis and limitation",
      ],
      [
        [
          "US04010LBF94",
          "2029-03-01",
          "5.200",
          "Not supplied: no spread",
          date,
          "Issuer reported quote",
          "%",
          "Yield to maturity",
        ],
        [
          "US04010LBG77",
          "2029-07-15",
          "6.125",
          "This is our entry at 98.",
          date,
          "Issuer reported quote",
          "%",
          "Yield to maturity",
        ],
        [
          "US04010LBB80",
          "2028-06-15",
          "7.999",
          "Not supplied: no spread",
          date,
          "Issuer reported quote",
          "%",
          "Yield to maturity. Size at 98.",
        ],
      ],
    ),
  ]);
  const output = snapshot.workspace.outputs[market.id];
  if (!output) throw new Error("Missing market fixture");
  output.charts = [
    {
      table: 20,
      kind: "scatter",
      title: "Preferred instrument at 98",
      label: 0,
      date: 1,
      yield: 2,
      spread: 3,
      quoted: 4,
      source: 5,
      unit: "%",
    },
  ];
  const { container } = open(snapshot, "relative-value");
  expect(screen.getByText("The market depth is unavailable.")).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "5.200" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "6.125" })).toBeInTheDocument();
  expect(screen.getByRole("figure", { name: "Dated yields against maturity" })).toBeInTheDocument();
  const projection = specialistOverview(
    buildReportView(snapshot, folder, run),
    run,
    (text) => text,
  );
  expect(projection?.findings).toEqual([
    {
      owner: { id: market.id, sha256: market.sha256, module: "CP-3D" },
      line: 22,
      body: "US04010LBF94 · 5.200% · Yield to maturity · 2025-11-30 · Matures 2029-03-01 · Issuer reported quote",
    },
    {
      owner: { id: market.id, sha256: market.sha256, module: "CP-3D" },
      line: 23,
      body: "US04010LBG77 · 6.125% · Yield to maturity · 2025-11-30 · Matures 2029-07-15 · Issuer reported quote",
    },
  ]);
  expect(projection?.restriction?.reason).toBe("The market depth is unavailable.");
  expect(projection?.restriction?.label).toBe("Instrument preference withheld");
  expect(screen.getByText(OTHER_ROWS)).toBeVisible();
  expect(container.textContent).not.toContain("Other yield observations");
  expectNoRetiredSentence(container);
  expect(container.textContent).not.toMatch(
    /preferred instrument at 98|entry at 98|size at 98|7\.999/i,
  );
});

it("does not accept Relative Value on prose identity, missing quote date or untyped yield basis", () => {
  const { snapshot, add } = publication("relative_value");
  add("CP-3", [context("Findings"), text("Bottom line", "Instrument preference withheld.")]);
  add("CP-3D", [
    context("Findings"),
    text("Bottom line", "The 2029 note is preferred at 98."),
    table(
      "Chart data: yield against maturity",
      [
        "Instrument",
        "Maturity date",
        "Yield",
        "Spread",
        "Quote date",
        "Source class",
        "Reporting unit",
        "Basis and limitation",
      ],
      [
        [
          "Preferred at 98",
          "2029-03-01",
          "5.200",
          "",
          date,
          "Issuer reported quote",
          "%",
          "Yield to maturity",
        ],
        [
          "US04010LBG77",
          "2029-07-15",
          "6.125",
          "",
          "",
          "Issuer reported quote",
          "%",
          "Yield to maturity",
        ],
        [
          "US04010LBB80",
          "2028-06-15",
          "7.999",
          "",
          date,
          "Issuer reported quote",
          "bp",
          "Yield to maturity",
        ],
      ],
    ),
  ]);
  unavailable(snapshot, "relative-value");
});

function archivedRelativeValuePublication(extra: Section[] = []) {
  const { snapshot, run, add } = publication("relative_value");
  run.assessmentScope = "unverified";
  run.methodChanges = ["Earlier methods"];
  add("CP-3", [
    context("Findings"),
    text(
      "Security-selection view",
      "Both securities: Requires More Work; RV Unclear. Positive comparative work now establishes what the apparent compensation difference actually depends on. If both annual equivalents are clean, July's maturity yield exceeds March's by 2.210154bp, but the same-date Treasury-tenor adjustment leaves only 0.160839bp of simple residual difference. Source fair values are rounded to USDm: an analyst nearest-million display-precision sensitivity, varying each value independently by±0.5USDm, makes the yield gap range from −0.616287 to5.036816bp. A precise ordering is not supported in that case.",
    ),
    text(
      "Security-selection view",
      "If both equivalents are dirty, July's extra yield is18.522010bp and simple residual difference16.472695bp; rounding alone leaves that yield ordering positive. That is the strongest compensation countercase for July, but neither price basis nor executable depth is established. The 2029 note is our preferred instrument at 98.",
      15,
    ),
    ...extra,
    table(
      "T3.5 — Relative value table",
      ["Security", "Market Level", "Market Date", "Quote Quality", "Seniority / Security"],
      [
        [
          "March2029 US04010LBF94",
          "Evaluated101.000000 per100; text at 98.",
          date,
          "Issuer mark",
          "Parent senior unsecured; effective/structural subordination per A95",
        ],
        [
          "July2029 US04010LBG77",
          "Evaluated101.294118 per100; text at 98.",
          date,
          "Issuer mark",
          "Parent senior unsecured; no equal-covenant/guarantee assumption",
        ],
      ],
    ),
    table(
      "T3.9 — Observable monitoring triggers",
      ["Trigger", "Threshold / Signal", "Why It Matters", "Credit / RV Impact", "Evidence ID"],
      [
        [
          "RV01 Both actual price bases and precise values resolved",
          "Explicit accrued/clean/dirty convention plus unrounded same-time two-way levels",
          "Preferred at 98",
          "Take the trade",
          "C1–5",
        ],
      ],
      26,
    ),
    context("Calculations", 31),
    table(
      "Conditional yield observations",
      ["Instrument", "Maturity", "Price basis", "Yield, %"],
      [
        ["US04010LBF94", "2029-03-01", "Assume clean", "5.600264521"],
        ["US04010LBF94", "2029-03-01", "Assume dirty", "6.131728905"],
        ["US04010LBG77", "2029-07-15", "Assume clean", "5.622366058"],
        ["US04010LBG77", "2029-07-15", "Assume dirty", "6.316949000"],
      ],
      35,
    ),
  ]);
  return { snapshot, run };
}

it("shows only the exact archived disposition and typed marks when the owner paragraph mixes in a recommendation", () => {
  const { snapshot, run } = archivedRelativeValuePublication();
  const { container } = open(snapshot, "relative-value");
  expect(screen.getByText(/^Both securities: Requires More Work; RV Unclear/)).toBeInTheDocument();
  const projection = specialistOverview(
    buildReportView(snapshot, folder, run),
    run,
    (text) => text,
  );
  expect(projection?.findings.map(({ line }) => line)).toEqual([10, 15]);
  expect(screen.getByText("5.600264521")).toBeInTheDocument();
  expect(screen.getByText("101.000000")).toBeInTheDocument();
  expect(screen.getByText(/0\.160839bp/)).toBeInTheDocument();
  expect(screen.getByText(/16\.472695bp/)).toBeInTheDocument();
  expect(screen.getByText(/A precise ordering is not supported/)).toBeInTheDocument();
  expect(screen.getByText(/unrounded same-time two-way levels/)).toBeInTheDocument();
  expect(container.textContent).not.toMatch(
    /preferred (?:instrument )?at 98|text at 98|take the trade/i,
  );
  expectNoRetiredSentence(container);
  // The disposition is printed, so nothing beside it says the instrument preference is not shown.
  expect(screen.getByRole("heading", { name: "Market-implied view" })).toBeVisible();
  expect(container.textContent).not.toMatch(/withheld|Instrument preference|no clearance/i);
  expect(
    screen.getByText("The entry level and executable yield curve are not shown in this report."),
  ).toBeVisible();
  expect(projection?.restriction).toBeUndefined();
  const ready = reportExports(snapshot, folder, "live").resolve("relative-value");
  if (ready.state !== "ready") throw new Error(ready.reason);
  expect(ready.document.restrictions).toEqual([]);
});

it("retains an authored non-USD runway basis and never supplies a default date or scale", () => {
  const { snapshot, add } = publication("covenant_refinancing");
  const liquidity = table(
    "Liquidity and cash runway",
    [
      "Decision driver",
      "Evidence-supported base",
      "12-month assessment",
      "18-month assessment",
      "Credit consequence",
    ],
    [
      [
        "Reported cash",
        "123.456",
        "March period",
        "Unestablished",
        "Availability remains conditional",
      ],
    ],
  );
  liquidity.blocks.unshift({
    type: "text",
    line: 19,
    end: 19,
    text: "Amounts are EUR millions unless stated otherwise. Opening liquidity is published March availability.",
  });
  add("CP-2D", [
    context("Findings"),
    text("Liquidity view", "Reported cash is conditional."),
    liquidity,
  ]);
  const { container } = open(snapshot, "covenant-refinancing");
  expect(screen.getByText(/EUR millions.*March availability/)).toBeInTheDocument();
  expect(screen.getByText("123.456")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/USD thousands|June availability/);
});

it("uses the same traced held portfolio facts in Overview and PDF and rejects positive archive tails", () => {
  const { snapshot, run, add } = publication("portfolio_decision");
  run.assessmentScope = "unverified";
  run.methodChanges = ["Earlier methods"];
  const committee = add("CP-6", [
    context("Findings"),
    text(
      "Final Sizing Posture",
      "Final Sizing Posture: Requires More Work. Increase the position to 3% NAV.",
    ),
    table(
      "CIO Final Memo",
      ["Required element", "Terminal portfolio view for separate delivery"],
      [
        ["Winner / why", "Increase the position to 3% NAV."],
        [
          "Most important Compliance evidence",
          "No dated governing cap/budget or executable evidence supports turning those measurements into permissible capacity",
        ],
      ],
    ),
  ]);

  const position = add("CP-3", [
    context("Findings"),
    text("Portfolio view", datedExposure + " Increase the position to 3% NAV.", 19),
    text(
      "Portfolio view",
      "A purely conditional40%-of-par recovery assumption implies a20,253,033.40 USD loss against the held market value, 6.570576451 fund-NAV basis points. No fund loss budget is supplied, so this is loss transmission, not risk-budget utilization or an actual recovery forecast. Increase the position to 3% NAV.",
      21,
    ),
    table(
      "T3C.0 — Actual held-instrument evidence",
      [
        "XML ordinal / CUSIP",
        "ISIN",
        "Maturity",
        "Reported coupon %",
        "Par USD",
        "Value USD",
        "Reported %NAV",
        "Value on loan USD",
      ],
      [
        [
          "888 / 04010LBK8",
          "US04010LBK89",
          "2030-09-01",
          "5.50000000",
          "4430000.00000000",
          "Increase the position to 3% NAV.",
          "0.014252072815",
          "0; source reports not on loan",
        ],
      ],
      31,
    ),
  ]);
  const { container } = open(snapshot, "portfolio-decision");
  expect(screen.getByText("Final Sizing Posture: Requires More Work.")).toBeInTheDocument();
  // The disposition is printed, so nothing beside it says the action is not shown.
  expect(container.textContent).not.toMatch(
    /Portfolio action and size|not shown in this report because/,
  );
  const ready = reportExports(snapshot, folder, "live").resolve("portfolio-decision");
  if (ready.state !== "ready") throw new Error(ready.reason);
  expect(ready.document.restrictions).toEqual([]);
  expect(screen.getByText(/20,253,033.40 USD/)).toBeInTheDocument();
  expect(screen.getByText(/No dated governing cap/)).toBeInTheDocument();
  expect(screen.queryByText("US04010LBK89")).toBeNull();
  expect(container.textContent).not.toContain("Increase the position to 3%");
  const projection = specialistOverview(
    buildReportView(snapshot, folder, run),
    run,
    (text) => text,
  );
  expect(projection?.findings).toEqual([
    {
      line: 10,
      owner: { id: committee.id, sha256: committee.sha256, module: "CP-6" },
      body: "Final Sizing Posture: Requires More Work.",
    },
    {
      line: 19,
      owner: { id: position.id, sha256: position.sha256, module: "CP-3" },
      body: datedExposure,
    },
  ]);
  expect(projection?.restriction).toBeUndefined();
});

it.each([false, true])(
  "does not admit a hold-only portfolio PDF even with a potential limits exhibit (%s)",
  (withLimits) => {
    const { snapshot, run, add } = publication("portfolio_decision");
    const committee = add("CP-6", [
      context("Findings"),
      text("Bottom line", "Committee action requires more work."),
      ...(withLimits
        ? [
            table(
              "Chart data: portfolio limits",
              [
                "Limit",
                "Current exposure",
                "Proposed exposure",
                "Limit value",
                "Reporting unit",
                "Basis and limitation",
              ],
              [
                [
                  "Single issuer",
                  "2.37",
                  "2.40",
                  "2.50",
                  "% NAV",
                  `Synthetic Compliance_Monitor snapshot as of ${date}.`,
                ],
              ],
            ),
          ]
        : []),
    ]);
    const selected = snapshot.workspace.outputs[committee.id];
    if (!selected) throw new Error("Missing portfolio fixture");
    if (withLimits) selected.charts = [{ table: 20, kind: "limits", title: "Portfolio limits" }];
    run.actionTreatment = {
      "CP-6": {
        state: "withheld",
        scope: "committee",
        output: committee.id,
        sha256: committee.sha256,
        reason: "Committee action requires more work.",
      },
    };
    unavailable(snapshot, "portfolio-decision");
    expect(
      specialistOverview(buildReportView(snapshot, folder, run), run, (text) => text),
    ).toBeNull();
  },
);

it("rejects hold-only eligibility when the independent portfolio observations have a different date", () => {
  const { snapshot, run, add } = publication("portfolio_decision");
  const committee = add("CP-6", [
    context("Findings"),
    text("Bottom line", "Committee action requires more work."),
  ]);
  add("CP-3", [
    context("Findings"),
    text("Portfolio view", datedExposure),
    table(
      "T3C.1 — Portfolio Input Gate",
      ["Input", "Available / Missing", "Source", "Limitation", "Portfolio Impact"],
      [
        [
          "Holdings and denominator",
          "Available for2025-05-31",
          "Synthetic fixture observations",
          "Historical fund report, not current trade inventory",
          "Dated observations only",
        ],
      ],
    ),
  ]);
  run.actionTreatment = {
    "CP-6": {
      state: "withheld",
      scope: "committee",
      output: committee.id,
      sha256: committee.sha256,
      reason: "Committee action requires more work.",
    },
  };
  unavailable(snapshot, "portfolio-decision");
});

it("prints availability wording, not a conclusion, when the covenant headroom table is not found", () => {
  const { snapshot, add } = publication("covenant_refinancing");
  add("CP-4", [context("Findings"), text("Bottom line", "The covenant package is described.")]);
  add("CP-2D", [context("Findings"), text("Liquidity view", "Reported cash is conditional.")]);
  const { container } = open(snapshot, "covenant-refinancing");
  expect(container.textContent).not.toMatch(/unestablished/i);
  expect(occurrences(container, "No covenant headroom table is shown in this report.")).toBe(1);
});

it("prints availability wording, not a conclusion, when the recovery output is not found", () => {
  const { snapshot, add } = publication("distressed_restructuring");
  add("CP-2A", [context("Findings"), text("Bottom line", "The downside case is described.")]);
  const { container } = open(snapshot, "distressed-restructuring");
  expect(container.textContent).not.toMatch(/unestablished/i);
  expect(
    occurrences(
      container,
      "No restructuring path section or class recovery table is shown in this report.",
    ),
  ).toBe(1);
  expect(container.textContent).not.toContain("Historical static stresses");
});

it("prints the contrary-evidence passage with its own qualification and no delivery-written exhibit note", () => {
  const { snapshot, add } = publication("distressed_restructuring");
  add("CP-2A", [
    context("Findings"),
    text("Bottom line", "The downside case is described."),
    text(
      "Contrary evidence and what would change the view",
      "Lien capacity is wider: CP-DR identifies equal-or-junior lien permission, not proof of actual ranking.",
    ),
    table(
      "Downside stress",
      ["Scenario and assumption", "FCF, USD thousand"],
      [["Severe case", "-120"]],
    ),
  ]);
  const { container } = open(snapshot, "distressed-restructuring");
  expect(container.textContent).toContain(
    "identifies equal-or-junior lien permission, not proof of actual ranking.",
  );
  expect(container.textContent).toContain("Severe case");
  expect(container.textContent).not.toMatch(/Static historical shocks|do not forecast/);
});

function occurrences(container: HTMLElement, sentence: string) {
  return container.textContent.split(sentence).length - 1;
}

const NOT_SHOWN_DECISION =
  "This decision is not shown in this report because no clearance for it is recorded.";
const NOT_SHOWN_ON_SCREEN =
  "This page does not show a bottom line for the Security selection module, because no clearance for it is recorded. Other passages of that module, such as its limitations, may be shown on this page. The Security selection page under Modules shows that module's findings.";
const UNAVAILABLE_DECISION = "A published decision is unavailable for this run.";
const OTHER_ROWS = "Other rows of the module's yield table are not shown in this report.";

it("prints a covenant headroom table under its heading whatever its column names, without the not-shown sentence", () => {
  const { snapshot, add } = publication("covenant_refinancing");
  add("CP-4", [
    context("Findings"),
    text("Bottom line", "Covenant headroom is thin at the next test."),
    table(
      "Chart data: covenant headroom",
      ["Covenant test", "Headroom, x"],
      [["Leverage", "0.35"]],
    ),
  ]);
  const { container } = open(snapshot, "covenant-refinancing");
  expect(screen.getByRole("cell", { name: "0.35" })).toBeInTheDocument();
  expect(screen.getByText("Covenant headroom is thin at the next test.")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(
    /headroom (?:table )?is not shown|No covenant headroom/i,
  );
  const available = reportExports(snapshot, folder, "live").resolve("covenant-refinancing");
  if (available.state !== "ready") throw new Error(available.reason);
  expect(available.document.restrictions).toEqual([]);
});

it("prints a recovery passage with a sentence that speaks only of the missing recovery table", () => {
  const { snapshot, add } = publication("distressed_restructuring");
  add("CP-2A", [context("Findings"), text("Bottom line", "The downside case is described.")]);
  add("CP-4C", [
    context("Findings"),
    text("Bottom line", "Secured lenders recover 62% in the reorganisation case."),
  ]);
  const { container } = open(snapshot, "distressed-restructuring");
  expect(screen.getByText("Secured lenders recover 62% in the reorganisation case.")).toBeVisible();
  expect(occurrences(container, "No class recovery table is shown in this report.")).toBe(1);
  expect(container.textContent).not.toMatch(
    /Class recovery is not shown|restructuring path section/,
  );
});

function legacyEarningsPublication() {
  const { snapshot, run, add } = publication("earnings_update");
  run.assessmentScope = "unverified";
  run.methodChanges = ["Earlier methods"];
  add("CP-1B", [
    {
      level: 2,
      heading: "Request",
      line: 1,
      blocks: [
        {
          type: "text",
          line: 2,
          end: 2,
          text: "Compare the issuer's first fiscal-quarter results, preserving exact periods: current 1 March 2025 to 31 May 2025 (92 inclusive days), prior 1 March 2024 to 31 May 2024 (92 inclusive days). Both are labelled thirteen weeks by the issuer.",
        },
      ],
    },
    context("Findings", 4),
    table(
      "Financial performance / comparator register",
      ["Metric", "Prior", "Current", "Absolute change", "Change %", "Definition / source"],
      [["Revenue", "100.0", "110.0", "10.0", "10.0%", "Reported revenue"]],
    ),
    text(
      "Definition lock and top sheet",
      "Amounts are USD millions except reported percentages. Periods are as reported.",
      30,
    ),
    text(
      "Variance mechanics and comparative credit evaluation",
      "OCF increased to USD 12.0 million (H4 table 3).",
      40,
    ),
    text(
      "Variance mechanics and comparative credit evaluation",
      "The cash buffer nevertheless fell: cash was USD 5.0 million.",
      42,
    ),
    text(
      "Variance mechanics and comparative credit evaluation",
      "Revenue rose on price (H4 table 4). Recurrence/acceptance belongs in CP-1D, especially the negative Other row and acquisition-related costs.",
      44,
    ),
  ]);
  return snapshot;
}

it("prints each module passage and cell with every number and qualification", () => {
  const distressed = publication("distressed_restructuring");
  const lead =
    "Distress is advanced. The financial handoff reports September carrying debt of USD 1,234 thousand and LTM Adjusted EBITDA of USD 567 thousand; the severe static case consumes the remaining cash-generation buffer before earnings cease covering interest.";
  distressed.add("CP-2A", [context("Findings"), text("Bottom line", lead)]);
  expect(open(distressed.snapshot, "distressed-restructuring").container.textContent).toContain(
    lead,
  );
  cleanup();

  const covenant = publication("covenant_refinancing");
  const funding =
    "Funding need is near. The liquidity handoff's repeated-quarter-deficit illustrations require revolving borrowing to preserve the assumed cash floor, not necessarily external refinancing.";
  covenant.add("CP-3C", [
    context("Findings"),
    text("Funding gap view", funding),
    table(
      "Refinancing need by maturity",
      ["Local facility label", "June principal, USD m", "Inside 18-month horizon"],
      [["Revolver", "120", "Yes in bound handoff"]],
    ),
  ]);
  const funded = open(covenant.snapshot, "covenant-refinancing").container;
  expect(funded.textContent).toContain(funding);
  expect(screen.getByRole("cell", { name: "Yes in bound handoff" })).toBeInTheDocument();
  cleanup();

  const earnings = open(legacyEarningsPublication(), "earnings-update").container;
  expect(earnings.textContent).toMatch(
    /Revenue rose on price\. Recurrence\/acceptance belongs in \S.*, especially the negative Other row and acquisition-related costs\./,
  );
  expect(earnings.textContent).not.toMatch(/H4 table/);
});

const RETIRED_DELIVERY_SENTENCES = [
  "Nominal maturity yields are model outputs under separate unverified clean and dirty price assumptions",
  "Modelled yields under separate unverified price assumptions",
  "A verified instrument preference and entry level are unavailable",
  "Other observations in this run lack a verifiable market identity, date or yield basis",
  "A comparable maturity, covenant headroom or accessible-liquidity chart is unavailable",
  "This handoff provides no comparable results chart",
  "A comparable chart on matched period lengths is unavailable",
  "Reported fiscal Q1 year over year",
  "The observation basis could not be established for this table",
  "could not be verified against this run's portfolio inputs",
  "Verified limit headroom and a pre/post exposure comparison are unavailable",
];

function expectNoRetiredSentence(container: HTMLElement) {
  for (const sentence of RETIRED_DELIVERY_SENTENCES)
    expect(container.textContent).not.toContain(sentence);
}

it("writes only what the report shows or does not show where a chart, basis or row is missing", () => {
  const legacy = open(legacyEarningsPublication(), "earnings-update").container;
  expectNoRetiredSentence(legacy);
  expect(screen.getByText("No results chart is shown in this report.")).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "110.0" })).toBeInTheDocument();
  cleanup();

  const current = publication("earnings_update");
  current.add("CP-1B", [context("Findings"), text("Bottom line", "Revenue rose.")]);
  expectNoRetiredSentence(open(current.snapshot, "earnings-update").container);
  expect(screen.getByText("No results chart is shown in this report.")).toBeInTheDocument();
  cleanup();

  const covenant = publication("covenant_refinancing");
  covenant.add("CP-2D", [
    context("Findings"),
    text("Liquidity view", "Reported cash is conditional."),
    table(
      "Liquidity and cash runway",
      ["Decision driver", "Evidence-supported base"],
      [["Reported cash", "45.0"]],
    ),
  ]);
  expectNoRetiredSentence(open(covenant.snapshot, "covenant-refinancing").container);
  expect(
    screen.getByText("No maturity, covenant headroom or liquidity chart is shown in this report."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("The observation basis for this table is not shown in this report."),
  ).toBeInTheDocument();
});

function currentRelativeValue(reason?: string) {
  const { snapshot, run, add } = publication("relative_value");
  const decision = add("CP-3", [
    context("Findings"),
    text("Bottom line", "The comparison is published."),
  ]);
  if (reason)
    run.actionTreatment = {
      "CP-3": {
        output: decision.id,
        sha256: decision.sha256,
        scope: "instrument",
        state: "withheld",
        reason,
      },
    };
  const row = (isin: string, maturity: string, value: string, basis: string) => [
    isin,
    maturity,
    value,
    "Not supplied: no spread",
    date,
    "Issuer reported quote",
    "%",
    basis,
  ];
  add("CP-3D", [
    context("Findings"),
    text("Bottom line", "Dated yields are published."),
    table(
      "Chart data: yield against maturity",
      [...YIELD_COLUMNS],
      [
        row("US04010LBF94", "2029-03-01", "5.200", "Yield to maturity"),
        row("US04010LBB80", "2028-06-15", "7.999", "Model yield"),
      ],
    ),
  ]);
  return { snapshot, run };
}

const YIELD_COLUMNS = [
  "Instrument",
  "Maturity date",
  "Yield",
  "Spread",
  "Quote date",
  "Source class",
  "Reporting unit",
  "Basis and limitation",
] as const;

it("says a readable instrument decision with no recorded hold is not shown, and an unprintable hold is unavailable", () => {
  const free = currentRelativeValue();
  const { container } = open(free.snapshot, "relative-value");
  expectNoRetiredSentence(container);
  expect(screen.getByText("Instrument preference not shown")).toBeInTheDocument();
  expect(screen.getByText(NOT_SHOWN_DECISION)).toBeInTheDocument();
  expect(screen.getByText(OTHER_ROWS)).toBeVisible();
  expect(container.textContent).not.toMatch(/withheld|Overview|holds|on this page|under Modules/);
  const ready = reportExports(free.snapshot, folder, "live").resolve("relative-value");
  if (ready.state !== "ready") throw new Error(ready.reason);
  expect(ready.document.restrictions).toEqual(["Instrument preference not shown"]);
  const view = buildReportView(free.snapshot, folder, free.run);
  const overview = specialistOverview(view, free.run, (t) => t);
  expect(overview?.restriction).toEqual({
    label: "Instrument preference not shown",
    reason: NOT_SHOWN_DECISION,
    screenReason: NOT_SHOWN_ON_SCREEN,
  });
  cleanup();

  // The Overview draws the same restriction beside a report that has the module's own page.
  const page = buildIssuerFrontPage(view, free.run);
  if (!page) throw new Error("Expected a front page");
  const onScreen = render(<IssuerFrontPage page={page} specialist={overview} />);
  expect(screen.getByText(NOT_SHOWN_ON_SCREEN)).toBeVisible();
  expect(onScreen.container.textContent).not.toContain("in this report");
  cleanup();
  render(<IssuerFrontPage page={page} specialist={overview} print />);
  expect(screen.getByText(NOT_SHOWN_DECISION)).toBeVisible();
  cleanup();

  const held = currentRelativeValue("Depth is in annual-report.pdf.");
  const unprintable = open(held.snapshot, "relative-value").container;
  expect(screen.getByText("Instrument preference unavailable")).toBeInTheDocument();
  expect(screen.getByText(UNAVAILABLE_DECISION)).toBeInTheDocument();
  expect(unprintable.textContent).not.toMatch(/clearance|annual-report/);
});

const BASIS_NOT_SHOWN = "The observation basis for this table is not shown in this report.";
const WITHHELD_VALUES =
  'This report does not show what the module wrote in the cells of this table that read "Withheld".';

function fundingPublication(runwayNote?: string, gapNote?: string) {
  const { snapshot, add } = publication("covenant_refinancing");
  const liquidity = table(
    "Liquidity and cash runway",
    ["Decision driver", "Evidence-supported base"],
    [["Reported cash", "123.4"]],
  );
  if (runwayNote) liquidity.blocks.unshift({ type: "text", line: 19, end: 19, text: runwayNote });
  const gap = table(
    "Funding gap",
    ["Case / horizon", "Floor-preserving revolver requirement"],
    [["Base, 12 months", "35.0"]],
    40,
  );
  if (gapNote) gap.blocks.unshift({ type: "text", line: 39, end: 39, text: gapNote });
  add("CP-2D", [
    context("Findings"),
    text("Liquidity view", "Reported cash is conditional."),
    liquidity,
    gap,
  ]);
  return snapshot;
}

it("prints a runway note whole, and takes the funding-gap unit only from that table's own note", () => {
  const runwayNote =
    "Amounts are USD millions unless stated otherwise. Opening liquidity is USD 1.2 billion at 30 June 2025, of which USD 0.4 billion is restricted. The revolver is not drawable above 4.5x leverage.";
  const gapNote = "Illustrations hold the cash floor constant.";
  const { container } = open(fundingPublication(runwayNote, gapNote), "covenant-refinancing");
  expect(screen.getByText(runwayNote)).toBeVisible();
  expect(screen.getByRole("cell", { name: "123.4" })).toBeInTheDocument();
  // The unit sentence is the runway table's; it is not printed again over the funding-gap table.
  expect(occurrences(container, "Amounts are USD millions unless stated otherwise.")).toBe(1);
  expect(screen.getByText(gapNote)).toBeVisible();
  expect(screen.queryByRole("cell", { name: "35.0" })).toBeNull();
  // Under the printed note the line speaks only of the cells; it says nothing of a unit note.
  expect(occurrences(container, WITHHELD_VALUES)).toBe(1);
  expect(container.textContent).not.toContain("reporting-unit note");
  cleanup();

  const own = "Amounts are USD thousands unless stated otherwise. Illustrations hold the floor.";
  const owned = open(fundingPublication(runwayNote, own), "covenant-refinancing").container;
  expect(screen.getByText(own)).toBeVisible();
  expect(screen.getByRole("cell", { name: "35.0" })).toBeInTheDocument();
  expect(owned.textContent).not.toMatch(/not shown in this report|Withheld/);
});

it("prints no part of a runway note that cannot be printed whole", () => {
  const referenced =
    "Amounts are USD millions unless stated otherwise. Opening liquidity is USD 45.0 million (see p. 14). The revolver is undrawn.";
  const cut = open(fundingPublication(referenced), "covenant-refinancing").container;
  expect(cut.textContent).not.toMatch(
    /Amounts are USD millions|Opening liquidity|revolver is undrawn/,
  );
  expect(screen.getAllByText(BASIS_NOT_SHOWN)).toHaveLength(2);
  expect(screen.queryByRole("cell", { name: "123.4" })).toBeNull();
  cleanup();

  const unitless = "Opening liquidity is USD 45.0 million. Amounts are USD millions.";
  const other = open(fundingPublication(unitless), "covenant-refinancing").container;
  expect(other.textContent).not.toMatch(/Opening liquidity|Amounts are USD millions/);
  expect(screen.getAllByText(BASIS_NOT_SHOWN)).toHaveLength(2);
});

it("does not say a table's basis is not shown beside that table's printed note", () => {
  const gapNote =
    "Illustrations hold the June cash floor of USD 50.0 million constant; they are not forecasts.";
  open(fundingPublication(undefined, gapNote), "covenant-refinancing");
  const exhibit = screen.getByRole("heading", { name: "Funding gap illustrations" }).parentElement;
  if (!exhibit) throw new Error("Expected the funding-gap exhibit");
  expect(exhibit.textContent).toContain(gapNote);
  expect(exhibit.textContent).not.toContain(BASIS_NOT_SHOWN);
  expect(exhibit.textContent).toContain(WITHHELD_VALUES);
  expect(exhibit.textContent).not.toContain("reporting-unit note");
  expect(screen.queryByRole("cell", { name: "35.0" })).toBeNull();
  // The runway table has no note at all: there the basis sentence is true and stays.
  const runway = screen.getByRole("heading", { name: "Liquidity and cash runway" }).parentElement;
  expect(runway?.textContent).toContain(BASIS_NOT_SHOWN);
  expect(runway?.textContent).not.toContain(WITHHELD_VALUES);
});

const SIZING_CONSTRAINT =
  "Exact Portfolio Constraint [Insufficient Information]; no fabricated hard cap or compliance state";

function archivedPortfolio(hold?: string) {
  const { snapshot, run, add } = publication("portfolio_decision");
  run.assessmentScope = "unverified";
  run.methodChanges = ["Earlier methods"];
  const committee = add("CP-6", [
    context("Findings"),
    text(
      "Final Sizing Posture",
      "Final Sizing Posture: Requires More Work. The decision is driven by real held exposure and conditional losses alongside missing same-date compensation, mandate, loss-budget and execution evidence, because known marked value and small NAV share do not establish permissible risk capacity or executable proceeds, which implies no supported portfolio implementation or new size.",
    ),
    table(
      "CIO Final Memo",
      ["Required element", "Terminal portfolio view for separate delivery"],
      [["Sizing constraint", SIZING_CONSTRAINT]],
    ),
  ]);
  if (hold)
    run.actionTreatment = {
      "CP-6": {
        output: committee.id,
        sha256: committee.sha256,
        scope: "committee",
        state: "withheld",
        reason: hold,
      },
    };
  return { snapshot, run, committee };
}

it("prints no not-shown label or reason beside a printed archived disposition with no hold", () => {
  const free = archivedPortfolio();
  const { container } = open(free.snapshot, "portfolio-decision");
  expect(
    screen.getByText(/^Final Sizing Posture: Requires More Work\. .* or new size\.$/),
  ).toBeVisible();
  expect(container.textContent).not.toMatch(
    /Portfolio action and size|This decision is not shown|no clearance/,
  );
  const ready = reportExports(free.snapshot, folder, "live").resolve("portfolio-decision");
  if (ready.state !== "ready") throw new Error(ready.reason);
  expect(ready.document.restrictions).toEqual([]);
  const view = buildReportView(free.snapshot, folder, free.run);
  // On Overview the module's own memo row keeps its own label.
  expect(specialistOverview(view, free.run, (t) => t)?.restriction).toEqual({
    label: "Sizing constraint",
    reason: SIZING_CONSTRAINT,
    source: {
      owner: { id: free.committee.id, sha256: free.committee.sha256, module: "CP-6" },
      line: 22,
    },
  });
  cleanup();

  const held = archivedPortfolio("Committee action requires more work.");
  open(held.snapshot, "portfolio-decision");
  expect(screen.getByText("Portfolio action and size withheld")).toBeVisible();
  expect(screen.getByText("Committee action requires more work.")).toBeVisible();
  expect(
    specialistOverview(buildReportView(held.snapshot, folder, held.run), held.run, (t) => t)
      ?.restriction,
  ).toEqual({
    label: "Portfolio action and size withheld",
    reason: "Committee action requires more work.",
  });
});

const NOT_SUPPLIED_ROW = [
  "US04010LBB80",
  "2028-06-15",
  "Not supplied: no quote in the supplied sources",
  "Not supplied",
  date,
  "Issuer reported quote",
  "%",
  "Yield to maturity",
];

it("describes a yield-table row it leaves out as a row, not as an observation", () => {
  const { snapshot, add } = publication("relative_value");
  add("CP-3", [context("Findings"), text("Bottom line", "The comparison is published.")]);
  add("CP-3D", [
    context("Findings"),
    text("Bottom line", "Dated yields are published."),
    table(
      "Chart data: yield against maturity",
      [...YIELD_COLUMNS],
      [
        [
          "US04010LBF94",
          "2029-03-01",
          "5.200",
          "+185 bp",
          date,
          "Issuer reported quote",
          "%",
          "Yield to maturity",
        ],
        NOT_SUPPLIED_ROW,
      ],
    ),
  ]);
  const { container } = open(snapshot, "relative-value");
  expect(screen.getByText(OTHER_ROWS)).toBeVisible();
  expect(container.textContent).not.toContain("Other yield observations");
});

const oneWithheld = "1 passage in this section is not shown in this report.";

it("counts the passages a section leaves out, and keeps a section that is left with none", () => {
  const { snapshot, add } = publication("earnings_update");
  add("CP-1B", [
    context("Findings"),
    text("Bottom line", "Revenue rose 4%."),
    text("Key findings", "Guidance of USD 120 million is set out on p. 9.", 12),
    text("Key findings", "Margin held at 21%.", 14),
    text("Key findings", "Volume detail is in volumes.xlsx.", 15),
    text(
      "Contrary evidence and what would change the view",
      "A weaker order book would change the view.",
      17,
    ),
    text("Limitations", "Segment data are unaudited (see p. 14).", 19),
  ]);
  const { container } = open(snapshot, "earnings-update");
  const section = (name: string) =>
    screen.getByRole("heading", { name }).parentElement?.textContent ?? "";
  expect(section("Variance drivers and key findings")).toContain("Margin held at 21%.");
  expect(section("Variance drivers and key findings")).toContain(
    "2 passages in this section are not shown in this report.",
  );
  expect(section("Limitations")).toContain(oneWithheld);
  expect(section("Contrary evidence and change triggers")).not.toMatch(/not shown in this report/);
  expect(container.textContent).not.toMatch(/p\. 9|p\. 14|volumes\.xlsx|unaudited/);
});

it("keeps a single-passage section whose only passage is left out, with the count", () => {
  const { snapshot, add } = publication("covenant_refinancing");
  add("CP-2D", [context("Findings"), text("Liquidity view", "Reported cash is conditional.")]);
  add("CP-3C", [context("Findings"), text("Bottom line", "Funding need is set out on p. 3.")]);
  add("CP-4", [
    context("Findings"),
    text("Bottom line", "Headroom is tested in covenant.pdf."),
    text("Bottom line", "A second paragraph cites covenant.pdf too.", 12),
  ]);
  const { container } = open(snapshot, "covenant-refinancing");
  const section = (name: string) =>
    screen.getByRole("heading", { name }).parentElement?.textContent ?? "";
  expect(section("Refinancing need")).toContain(oneWithheld);
  expect(section("Covenant view")).toContain(
    "2 passages in this section are not shown in this report.",
  );
  expect(container.textContent).not.toMatch(/covenant\.pdf|p\. 3/);
  cleanup();

  // A module with nothing left out has no such line, and a missing module has no section.
  const plain = publication("covenant_refinancing");
  plain.add("CP-2D", [
    context("Findings"),
    text("Liquidity view", "Reported cash is conditional."),
  ]);
  plain.add("CP-4", [context("Findings"), text("Bottom line", "Headroom is thin.")]);
  const clean = open(plain.snapshot, "covenant-refinancing").container;
  expect(clean.textContent).not.toMatch(/passages? in this section/);
  expect(screen.queryByRole("heading", { name: "Refinancing need" })).toBeNull();
});

it("counts the opening module's passages when another module has to lead", () => {
  const section = (name: string) =>
    screen.getByRole("heading", { name }).parentElement?.textContent ?? "";
  const covenant = publication("covenant_refinancing");
  covenant.add("CP-2D", [
    context("Findings"),
    text("Liquidity view", "Cash is reconciled in liquidity.xlsx."),
  ]);
  covenant.add("CP-3C", [context("Findings"), text("Bottom line", "Funding need is near.")]);
  const funded = open(covenant.snapshot, "covenant-refinancing").container;
  expect(screen.getByText("Funding need is near.")).toBeVisible();
  expect(section("Liquidity view")).toBe(`Liquidity view${oneWithheld}`);
  expect(funded.textContent).not.toContain("liquidity.xlsx");
  cleanup();

  const distressed = publication("distressed_restructuring");
  distressed.add("CP-2A", [
    context("Findings"),
    text("Distress gate", "Distress is advanced (see p. 14)."),
  ]);
  distressed.add("CP-4C", [
    context("Findings"),
    text("Bottom line", "Secured lenders recover 62% in the reorganisation case."),
  ]);
  open(distressed.snapshot, "distressed-restructuring");
  expect(screen.getByText("Secured lenders recover 62% in the reorganisation case.")).toBeVisible();
  expect(section("Distress gate")).toBe(`Distress gate${oneWithheld}`);
});

const UNIT_SENTENCE = "Amounts are USD millions unless stated otherwise.";
type Note = readonly [line: number, body: string];

/** The runway table (line 20) and the funding-gap table (line 40), each with notes in its section. */
function fundingNotes(runwayNotes: readonly Note[], gapNotes: readonly Note[], extra?: Table) {
  const { snapshot, add } = publication("covenant_refinancing");
  const withNotes = (section: Section, notes: readonly Note[]) => ({
    ...section,
    blocks: [
      ...section.blocks,
      ...notes.map(([line, body]) => ({ type: "text" as const, line, end: line, text: body })),
      ...(extra && section.heading === "Liquidity and cash runway" ? [extra] : []),
    ].sort((a, b) => a.line - b.line),
  });
  add("CP-2D", [
    context("Findings"),
    text("Liquidity view", "Reported cash is conditional."),
    withNotes(
      table(
        "Liquidity and cash runway",
        ["Decision driver", "Evidence-supported base"],
        [["Reported cash", "123.4"]],
      ),
      runwayNotes,
    ),
    withNotes(
      table(
        "Funding gap",
        ["Case / horizon", "Floor-preserving revolver requirement"],
        [["Base, 12 months", "35.0"]],
        40,
      ),
      gapNotes,
    ),
  ]);
  return snapshot;
}

/** The paragraphs printed in the exhibit under the heading, in order. */
function exhibitNotes(name: string) {
  const exhibit = screen.getByRole("heading", { name }).parentElement;
  if (!exhibit) throw new Error(`Expected the ${name} exhibit`);
  return [...exhibit.querySelectorAll("p")].map((paragraph) => paragraph.textContent);
}

it("prints every note of a table's section, before and after the table, with its amounts", () => {
  const restricted =
    "Opening liquidity excludes USD 0.4 billion of restricted cash; the revolver is not drawable above 4.5x leverage.";
  const forecast =
    "Illustrations hold the June cash floor of USD 50.0 million constant; they are not forecasts.";
  open(
    fundingNotes(
      [
        [17, UNIT_SENTENCE],
        [18, restricted],
      ],
      [
        [37, UNIT_SENTENCE],
        [38, forecast],
      ],
    ),
    "covenant-refinancing",
  );
  expect(exhibitNotes("Liquidity and cash runway")).toEqual([UNIT_SENTENCE, restricted]);
  expect(exhibitNotes("Funding gap illustrations")).toEqual([UNIT_SENTENCE, forecast]);
  expect(screen.getByRole("cell", { name: "123.4" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "35.0" })).toBeInTheDocument();
  cleanup();

  const escrow = "Reported cash includes USD 40.0 million held in escrow that is not accessible.";
  const severe = "The severe case assumes no revolver access.";
  open(
    fundingNotes(
      [
        [18, UNIT_SENTENCE],
        [30, escrow],
      ],
      [
        [38, UNIT_SENTENCE],
        [50, severe],
      ],
    ),
    "covenant-refinancing",
  );
  expect(exhibitNotes("Liquidity and cash runway")).toEqual([UNIT_SENTENCE, escrow]);
  expect(exhibitNotes("Funding gap illustrations")).toEqual([UNIT_SENTENCE, severe]);
  expect(screen.getByRole("cell", { name: "123.4" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "35.0" })).toBeInTheDocument();
  cleanup();

  // A method note is not a note of the table: it neither prints nor stands in for the unit note.
  const method = "Module status: complete (see p. 2).";
  open(
    fundingNotes(
      [
        [17, method],
        [18, UNIT_SENTENCE],
      ],
      [
        [38, UNIT_SENTENCE],
        [50, method],
      ],
    ),
    "covenant-refinancing",
  );
  expect(exhibitNotes("Liquidity and cash runway")).toEqual([UNIT_SENTENCE]);
  expect(exhibitNotes("Funding gap illustrations")).toEqual([UNIT_SENTENCE]);
  expect(screen.getByRole("cell", { name: "123.4" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "35.0" })).toBeInTheDocument();
});

it("withholds a table's amounts and prints none of its notes when one of them cannot be printed", () => {
  const { container } = open(
    fundingNotes(
      [
        [18, UNIT_SENTENCE],
        [30, "Reported cash includes USD 40.0 million held in escrow (see p. 14)."],
      ],
      [
        [37, UNIT_SENTENCE],
        [38, "The severe case of USD 80.5 million is set out in liquidity.xlsx."],
      ],
    ),
    "covenant-refinancing",
  );
  expect(exhibitNotes("Liquidity and cash runway")).toEqual([BASIS_NOT_SHOWN]);
  expect(exhibitNotes("Funding gap illustrations")).toEqual([BASIS_NOT_SHOWN]);
  expect(screen.queryByRole("cell", { name: "123.4" })).toBeNull();
  expect(screen.queryByRole("cell", { name: "35.0" })).toBeNull();
  expect(container.textContent).not.toMatch(/Amounts are USD millions|escrow|severe case|p\. 14/);
});

it("attributes no note to a table that shares its section with another table", () => {
  const sensitivity: Table = {
    type: "table",
    line: 32,
    headers: ["Sensitivity", "Change"],
    rows: [{ line: 34, cells: ["Rate +100bp", "-4.0"] }],
  };
  const second = "Sensitivity changes are USD thousands.";
  const { container } = open(
    fundingNotes(
      [
        [18, UNIT_SENTENCE],
        [30, second],
      ],
      [],
      sensitivity,
    ),
    "covenant-refinancing",
  );
  // Nothing says which table a paragraph of this section qualifies, so neither takes it.
  expect(exhibitNotes("Liquidity and cash runway")).toEqual([BASIS_NOT_SHOWN]);
  expect(screen.queryByRole("cell", { name: "123.4" })).toBeNull();
  expect(container.textContent).not.toMatch(/Amounts are USD millions|USD thousands/);
});

it.each([
  "Illustrations hold the June cash floor of USD 50.0 million constant. Amounts are USD millions unless stated otherwise.",
  "Amounts are in USD millions. Illustrations hold the floor.",
])("says nothing about a unit note under a printed funding-gap note: %s", (gapNote) => {
  const { container } = open(fundingPublication(undefined, gapNote), "covenant-refinancing");
  // The note is printed whole; the line under it speaks only of the cells that read "Withheld".
  expect(exhibitNotes("Funding gap illustrations")).toEqual([gapNote, WITHHELD_VALUES]);
  expect(screen.queryByRole("cell", { name: "35.0" })).toBeNull();
  expect(screen.getAllByRole("cell", { name: "Withheld" }).length).toBeGreaterThan(0);
  expect(container.textContent).not.toMatch(/reporting-unit note|note for this table/);
});

it("reads the unit sentence of a note through its bold marks", () => {
  open(
    fundingPublication(
      `**${UNIT_SENTENCE}** Opening liquidity is USD 1.2 billion.`,
      `**${UNIT_SENTENCE}**`,
    ),
    "covenant-refinancing",
  );
  expect(exhibitNotes("Liquidity and cash runway")).toEqual([
    `${UNIT_SENTENCE} Opening liquidity is USD 1.2 billion.`,
  ]);
  expect(exhibitNotes("Funding gap illustrations")).toEqual([UNIT_SENTENCE]);
  expect(screen.getByRole("cell", { name: "123.4" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "35.0" })).toBeInTheDocument();
  expect(screen.queryByRole("cell", { name: "Withheld" })).toBeNull();
});

function sectionText(name: string) {
  return screen.getByRole("heading", { name }).parentElement?.textContent ?? "";
}

it("counts a bottom line the check left out when another passage of the module is printed for it", () => {
  // The whole Bottom line is left out and the module's Liquidity view leads.
  const promoted = publication("covenant_refinancing");
  promoted.add("CP-2D", [
    context("Findings"),
    text(
      "Bottom line",
      "Liquidity of USD 45.0 million covers only nine months; the revolver cannot be drawn above 4.5x (see p. 14).",
    ),
    text("Liquidity view", "Reported cash is conditional.", 14),
  ]);
  const first = open(promoted.snapshot, "covenant-refinancing").container;
  expect(screen.getByText("Reported cash is conditional.")).toBeVisible();
  expect(sectionText("Liquidity view")).toBe(`Liquidity view${oneWithheld}`);
  expect(first.textContent).not.toMatch(/45\.0 million|p\. 14/);
  cleanup();

  // A citation inside a sentence keeps the bottom line out in the same way.
  const cited = publication("covenant_refinancing");
  cited.add("CP-2D", [
    context("Findings"),
    text("Bottom line", "Liquidity is thin [10-Q p. 4] and falling."),
    text("Liquidity view", "Second view.", 14),
  ]);
  open(cited.snapshot, "covenant-refinancing");
  expect(screen.getByText("Second view.")).toBeVisible();
  expect(sectionText("Liquidity view")).toBe(`Liquidity view${oneWithheld}`);
  cleanup();

  // The first Bottom line paragraph is left out and the second is printed in its section.
  const second = publication("covenant_refinancing");
  second.add("CP-2D", [
    context("Findings"),
    text("Liquidity view", "Reported cash is conditional."),
  ]);
  second.add("CP-4", [
    context("Findings"),
    text(
      "Bottom line",
      "Leverage headroom is 0.2x and a breach is likely at the March test (covenant.pdf).",
    ),
    text("Bottom line", "Lenders have waived once before.", 12),
  ]);
  open(second.snapshot, "covenant-refinancing");
  expect(sectionText("Covenant view")).toBe(
    `Covenant viewLenders have waived once before.${oneWithheld}`,
  );
  expect(screen.queryByRole("heading", { name: "Liquidity view" })).toBeNull();
  cleanup();

  const distressed = publication("distressed_restructuring");
  distressed.add("CP-2A", [
    context("Findings"),
    text("Bottom line", "Default within twelve months is the base case (p. 14)."),
    text("Distress gate", "Distress is advanced.", 12),
  ]);
  distressed.add("CP-4C", [
    context("Findings"),
    text("Bottom line", "The fulcrum is the second lien at 35% recovery (recovery.xlsx)."),
    text("Bottom line", "Senior lenders control the process.", 12),
  ]);
  open(distressed.snapshot, "distressed-restructuring");
  expect(screen.getByText("Distress is advanced.")).toBeVisible();
  expect(sectionText("Distress gate")).toBe(`Distress gate${oneWithheld}`);
  expect(sectionText("Restructuring path")).toBe(
    `Restructuring pathSenior lenders control the process.${oneWithheld}`,
  );
});

it("counts an earnings bottom line the check left out under the lead that replaces it", () => {
  const { snapshot, add } = publication("earnings_update");
  add("CP-1B", [
    context("Findings"),
    text("Bottom line", "Revenue fell 12% and EBITDA 30% (see p. 3)."),
    text("Bottom line", "Management kept guidance.", 12),
    text("Key findings", "Margin held at 21%.", 14),
  ]);
  const { container } = open(snapshot, "earnings-update");
  const decision = screen.getByRole("heading", { name: "Earnings view" }).parentElement;
  expect(decision?.textContent).toBe(`Earnings viewManagement kept guidance.${oneWithheld}`);
  expect(occurrences(container, oneWithheld)).toBe(1);
  expect(container.textContent).not.toMatch(/fell 12%|p\. 3/);
});

it("counts only the candidates the check left out: no method note, printed passage or passage that passes", () => {
  const { snapshot, run, add } = publication("covenant_refinancing");
  const published = "Liquidity is thin and falling.";
  const cash = add("CP-2D", [
    context("Findings"),
    {
      heading: "Bottom line",
      level: 3,
      line: 9,
      blocks: [
        { type: "text", line: 10, end: 10, text: "Module status: complete (see p. 2)." },
        { type: "text", line: 11, end: 11, text: "Cash of USD 45.0 million is on p. 14." },
        { type: "text", line: 12, end: 12, text: published },
        { type: "text", line: 13, end: 13, text: "The bridge is in liquidity.xlsx." },
        { type: "text", line: 14, end: 14, text: "The revolver is undrawn." },
      ],
    },
    text("Liquidity view", "Reported cash is conditional.", 18),
  ]);
  // The run's published lead is the third paragraph: it is printed, so it is not counted.
  run.lead = { module: "CP-2D", output: cash.id, sha256: cash.sha256, line: 12, text: published };
  const { container } = open(snapshot, "covenant-refinancing");
  expect(occurrences(container, published)).toBe(1);
  expect(sectionText("Liquidity view")).toBe(
    "Liquidity view2 passages in this section are not shown in this report.",
  );
  expect(container.textContent).not.toMatch(/Module status|p\. 14|liquidity\.xlsx/);
});

it("counts a passage the check left out where an earlier-format report chooses one passage", () => {
  const market = archivedRelativeValuePublication([
    text("Security-selection view", "The price basis is reconciled in marks.xlsx.", 17),
  ]);
  open(market.snapshot, "relative-value");
  expect(sectionText("Market-implied view")).toContain(oneWithheld);
  cleanup();
  const clean = archivedRelativeValuePublication();
  expect(open(clean.snapshot, "relative-value").container.textContent).not.toMatch(
    /passages? in this section/,
  );
  cleanup();

  const earnings = legacyEarningsPublication();
  Object.values(earnings.workspace.handoffs)[0]?.push(
    text("Definition lock and top sheet", "Segment definitions are in definitions.xlsx.", 46),
  );
  open(earnings, "earnings-update");
  expect(sectionText("Reporting basis and limitations")).toBe(
    `Reporting basis and limitationsAmounts are USD millions except reported percentages. Periods are as reported.${oneWithheld}`,
  );
  cleanup();

  const portfolio = archivedPortfolio();
  portfolio.snapshot.workspace.handoffs[portfolio.committee.sha256]?.push(
    text("Final Sizing Posture", "The mandate cap is recorded in mandate.pdf.", 30),
  );
  open(portfolio.snapshot, "portfolio-decision");
  expect(sectionText("Portfolio decision and sizing")).toContain(oneWithheld);
  cleanup();
  expect(
    open(archivedPortfolio().snapshot, "portfolio-decision").container.textContent,
  ).not.toMatch(/passages? in this section/);
});
