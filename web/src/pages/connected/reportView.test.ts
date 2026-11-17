import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  actionBias,
  foundationMetrics,
  moduleBottomLines,
  moduleOrder,
  runLimitations,
  traceKey,
} from "./reportView";
import type { CatalogueRun, OutputEntry, PublishedRun, Section, Snapshot } from "./publishedReport";
import { buildReportView } from "./reportView";
import { findingBlocks, traceForLine } from "./ReportContent";
import { calculationNodes } from "./report/calculations";
import { MetricGrid } from "./report/MetricGrid";
import { cashProxyCases, type Grid } from "./visuals/LegacyForecast";

function table(heading: string, headers: string[], cells: string[][], line: number): Section {
  return {
    heading,
    level: heading === "Calculations" ? 2 : 3,
    line,
    blocks: [
      {
        type: "table",
        headers,
        line: line + 1,
        rows: cells.map((row, index) => ({
          line: line + index + 2,
          cells: row,
        })),
      },
    ],
  };
}

function foundation(
  sections: Section[],
  options: { run: string; id: string; sha256: string } = {
    run: "first",
    id: "foundation-a",
    sha256: "a".repeat(64),
  },
): OutputEntry {
  return { output: { ...options, module: "CP-1", label: "", href: "" }, selected: true, sections };
}

describe("reader data fidelity", () => {
  const period = table(
    "Period table",
    ["Period", "Start", "End"],
    [["FY2026", "2026-01-01", "2026-12-31"]],
    5,
  );
  const headers = ["Metric", "FY2026", "Unit"];
  const date = {
    id: "first",
    issuer: "A",
    name: "A",
    title: "",
    date: "2027-01-01",
    period: "",
    sector: "",
    metrics: { cash: { value: 0, unit: "US$m", period: "2026-12-31" } },
  } satisfies CatalogueRun;

  it("binds exact zero and refuses ambiguous metrics and mismatched period or currency", () => {
    const measures = table(
      "Financials and credit metrics",
      headers,
      [
        ["Total liquidity at period end", "0", "US$m"],
        ["Free cash flow (operating cash flow less capex), twelve months", "42", "GBPm"],
      ],
      10,
    );
    const input = foundation([period, measures]);
    expect(foundationMetrics(input, date)).toMatchObject([
      {
        key: "liquidity",
        metric: { label: "Total liquidity at period end", value: { text: "$0m" } },
        line: 12,
      },
    ]);
    expect(foundationMetrics(foundation([period, measures, measures]), date)).toEqual([]);
    expect(
      foundationMetrics(input, { ...date, metrics: { cash: { period: "2025-12-31" } } }),
    ).toEqual([]);
  });

  it("labels each CP-1 tile with the handoff's own words", () => {
    const measures = table(
      "Financials and credit metrics",
      headers,
      [
        ["Total liquidity at period end", "310", "US$m"],
        ["Free cash flow (operating cash flow less capex), twelve months", "42", "US$m"],
        ["(Total debt plus financing obligations) / EBITDA", "5.4", "x"],
        ["EBITDA / (cash interest for debt plus cash rent recorded as interest)", "2.1", "x"],
        ["Net debt at period end", "1200", "US$m"],
      ],
      10,
    );
    const debt = table(
      "Debt principal to carrying value",
      ["Period", "Contractual principal", "Discount", "Carrying value", "Reporting unit"],
      [["2026-12-31", "1500", "20", "1480", "US$m"]],
      20,
    );
    const rows = foundationMetrics(foundation([period, measures, debt]), date);
    expect(rows.map(({ key, metric }) => [key, metric.label, metric.note])).toEqual([
      ["liquidity", "Total liquidity at period end", "2026-12-31"],
      [
        "freeCashFlow",
        "Free cash flow (operating cash flow less capex), twelve months",
        "2026-12-31",
      ],
      ["leverage", "(Total debt plus financing obligations) / EBITDA", "2026-12-31"],
      [
        "interestCover",
        "EBITDA / (cash interest for debt plus cash rent recorded as interest)",
        "2026-12-31",
      ],
      ["netDebt", "Net debt at period end", "2026-12-31"],
      ["principal", "Contractual principal", "2026-12-31"],
    ]);
  });

  it("isolates trace identities for alternate outputs and other runs with the same row number", () => {
    const a = foundation([]);
    const b = foundation([], { run: "first", id: "foundation-b", sha256: "b".repeat(64) });
    const c = foundation([], { run: "second", id: "foundation-a", sha256: "c".repeat(64) });
    expect(new Set([a, b, c].map((entry) => traceKey(entry, 22))).size).toBe(3);
  });

  it("keeps a zero maturity amount only for its stated forward window and currency", () => {
    const schedule = table(
      "Chart data: debt maturities",
      ["Period", "Debt maturing", "Reporting unit"],
      [["2027", "0", "US$m"]],
      30,
    );
    const ledger = table(
      "Calculations",
      ["ID", "Calculation", "Inputs", "Result", "Source"],
      [
        ["C1", "Other calculation", "", "900", ""],
        ["C2", "Maturities from 2026-07-01 to end-2028", "", "800", ""],
        ["C3", "Maturities from 2025-07-01 to end-2027", "", "700", ""],
        ["C4", "Maturities from 2026-01-01 to end-2027", "", "600", ""],
        ["C5", "Maturities from 2026-07-01 to end-2027", "", "0", ""],
      ],
      40,
    );
    const dated = { ...date, metrics: { cash: { period: "2026-06-30" } } };
    expect(foundationMetrics(foundation([schedule, ledger]), dated)).toMatchObject([
      {
        key: "maturities",
        metric: { label: "Maturities from 2026-07-01 to end-2027", value: { text: "$0m" } },
        line: 46,
      },
    ]);
    const foreign = table(
      "Chart data: debt maturities",
      schedule.blocks[0]?.type === "table" ? schedule.blocks[0].headers : [],
      [["2027", "0", "GBPm"]],
      30,
    );
    // docs/rulings/2026-11-16-reporting-currency-from-sources.md: the run's currency is the money
    // unit recorded with its cash figure; a schedule in another currency draws no tile.
    const usd = { ...date, metrics: { cash: { period: "2026-06-30", unit: "US$m" } } };
    expect(foundationMetrics(foundation([foreign, ledger]), usd)).toEqual([]);
  });

  it("does not turn an earnings lead or an unrecognised decision into a committee action", () => {
    const decision: Section = {
      heading: "Decision",
      level: 2,
      line: 1,
      blocks: [{ type: "text", line: 2, end: 2, text: "Final Action Bias: Watchlist." }],
    };
    const earnings = foundation([decision]);
    earnings.output.module = "CP-1B";
    expect(actionBias(earnings)).toBeUndefined();
    const committee = { ...earnings, output: { ...earnings.output, module: "CP-6" } };
    expect(actionBias(committee)).toBe("Watchlist");
    expect(
      actionBias({ ...committee, sections: [{ ...decision, heading: "Limitations" }] }),
    ).toBeUndefined();
    expect(
      actionBias({ ...committee, sections: [table("Decision", ["Action"], [["Avoid"]], 5)] }),
    ).toBeUndefined();
    decision.blocks = [{ type: "text", line: 2, end: 2, text: "Final Action Bias: Unspecified." }];
    expect(actionBias(committee)).toBeUndefined();
  });

  it("derives a figure trace from its own rows and a row trace from only the selected row", () => {
    const section = table(
      "Chart data: debt maturities",
      ["Period", "Debt", "Reporting unit", "Basis and limitation"],
      [
        ["FY2027", "0.00", "US$m", "Filing page 14"],
        ["FY2028", "80", "US$m", "Filing page 20"],
      ],
      20,
    );
    const entry = foundation([section]);
    const chip = { source: "filing.txt", excerpt: "The maturity schedule", sha256: "first-source" };
    const snapshot = {
      chips: {
        "foundation-a:22": [chip],
        "foundation-a:23": [chip],
        "foundation-b:22": [{ source: "wrong.txt" }],
      },
    } as unknown as Snapshot;

    const figure = traceForLine(snapshot, entry, 2, 21);
    expect(figure?.evidenceItem).toBe(`foundation-a~${"a".repeat(64)}-21`);
    expect(figure?.derivation.children).toMatchObject([
      { label: "Basis", value: "Filing page 14\nFiling page 20" },
      { label: "filing.txt" },
    ]);
    const row = traceForLine(snapshot, entry, 2, 22);
    expect(row?.statement).toContain("0.00");
    expect(row?.derivation.children[0]?.value).toBe("Filing page 14");
    expect(row?.evidenceItem).toBe(`foundation-a~${"a".repeat(64)}-22`);
  });

  it.each([
    [
      ["Trigger", "Threshold", "Signal", "Why It Matters", "Credit Impact", "Source"],
      ["Cover", "Below 3.1x", "Cover is 3.1x", "Cash", "Headroom", "Source p. 1"],
    ],
    [
      ["Trigger", "Threshold / Signal", "Why It Matters", "Credit Impact", "Source / Limitation"],
      ["Cover", "Below 3.1x", "Cash", "Headroom", "Source p. 1; limit is indicative"],
    ],
  ])("only promotes a known monitoring register in its owning module (%j)", (headers, row) => {
    const monitoring = {
      ...table("T2.12 Monitoring triggers", headers, [row], 20),
      level: 4,
    };
    const sections = [
      { heading: "Findings", line: 1, level: 2, blocks: [] },
      { heading: "Analytical appendix", line: 10, level: 3, blocks: [] },
      monitoring,
    ];
    const finance = foundation(sections);
    const credit = { ...finance, output: { ...finance.output, module: "CP-2" } };
    expect(findingBlocks(sections, finance)).toEqual([]);
    expect(findingBlocks(sections, credit)).toEqual([monitoring]);
  });

  it("returns CP-8's limitations ledger but not another module's gap ledger", () => {
    const ledger = table(
      "Limitations ledger",
      ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"],
      [["E1", "C1", "Margins are not disclosed", "Remaining", "\u2014"]],
      20,
    );
    const gap = { ...ledger, heading: "Gap ledger" };
    const withFindings = (section: Section) => [
      { heading: "Findings", line: 1, level: 2, blocks: [] },
      { ...section, level: 3 },
    ];
    const entry = (module: string, sections: Section[]) => ({
      ...foundation(sections),
      output: { ...foundation(sections).output, module },
    });
    const cp8 = withFindings(ledger);
    expect(findingBlocks(cp8, entry("CP-8", cp8))).toEqual([cp8[1]]);
    const cp2 = withFindings(gap);
    expect(findingBlocks(cp2, entry("CP-2", cp2))).toEqual([]);
    expect(findingBlocks(cp8, entry("CP-2", cp8))).toEqual([]);
  });

  it("reads calculation links from the ledger and retains stated operands", () => {
    const calculations = table(
      "Calculations",
      ["ID", "Calculation", "Inputs", "Result", "Source"],
      [
        ["C11", "Debt", "2 + 3", "5", "filing.txt, page 1"],
        ["C14", "Net debt", "5 − 2", "3", "calculation C11"],
      ],
      50,
    );
    expect(calculationNodes(foundation([calculations]), "calculation C14")).toMatchObject([
      {
        label: "Net debt",
        value: "3",
        note: "C14 · 5 − 2 · calculation C11",
        children: [{ label: "Debt", value: "5", note: "C11 · 2 + 3 · filing.txt, page 1" }],
      },
    ]);
    expect(calculationNodes(foundation([calculations, calculations]), "calculation C14")).toEqual(
      [],
    );
  });

  it("keeps driver-only downside, missing and zero distinct on forecast paths", () => {
    const grid: Grid = {
      columns: ["FY2027E", "FY2028E"].map((label) => ({
        label,
        group: "Downside case",
        start: "",
        end: "",
      })),
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          total: true,
          band: "",
          cells: [{ exact: "0", status: "value" }, { reason: "No model driver" }],
        },
      ],
    };
    expect(cashProxyCases(grid, null).rows).toEqual([
      { label: "Downside case", cells: ["0.00", "No model driver"] },
    ]);
    expect(
      cashProxyCases(
        grid,
        null,
        "Downside case is the stress case: a shock applied to the base-case drivers.",
      ).rows[0]?.label,
    ).toBe("Downside shock");
  });
});

it("uses retained page text rather than a claim-only chip as the trace excerpt", () => {
  const section = table(
    "Chart data: debt",
    ["Period", "Debt", "Source"],
    [["FY2026", "776", "Filing"]],
    20,
  );
  const entry = foundation([section], {
    run: "case",
    id: "case/foundation",
    sha256: "a".repeat(64),
  });
  const sha256 = "b".repeat(64);
  const href = `/connected/sources/case/${sha256}/filing.txt`;
  const missing = {
    source: "missing.txt",
    quote: "776",
    excerpt: null,
    reason: "page not in source text",
  };
  const snapshot = {
    chips: {
      "case/foundation:22": [
        missing,
        {
          file: "filing.txt",
          source: "filing.txt",
          quote: "776",
          excerpt: "Interest expense was 776 in the retained filing.",
          sha256,
          href,
          pageHref: `${href}?page=2`,
        },
      ],
    },
  } as unknown as Snapshot;
  const trace = traceForLine(snapshot, entry, 0, 22);
  expect(trace?.excerpt?.quote).toBe("Interest expense was 776 in the retained filing.");
  expect(trace?.sourceLinks).toEqual([
    { label: "Open cited source page 2: filing.txt", href: `${href}?page=2` },
    { label: "Open source file: filing.txt", href },
  ]);
  snapshot.chips["case/foundation:22"] = [missing as Snapshot["chips"][string][number]];
  expect(traceForLine(snapshot, entry, 0, 22)?.excerpt).toBeNull();
});

describe("overview year-on-year comparator", () => {
  const catalogue = {
    id: "first",
    issuer: "A",
    name: "A",
    title: "",
    date: "2025-01-01",
    period: "",
    sector: "",
    metrics: { cash: { value: 0, unit: "US$m", period: "2024-12-31" } },
  } satisfies CatalogueRun;
  const base = [
    ["FY2023", "2023-01-01", "2023-12-31"],
    ["FY2024", "2024-01-01", "2024-12-31"],
  ];
  const periods = (extra: string[][] = []) =>
    table("Period table", ["Period", "Start", "End"], [...base, ...extra], 5);
  const measures = (headers: string[], leverage: string[], liquidity: string[]) =>
    table(
      "Financials and credit metrics",
      headers,
      [
        ["Total liquidity at period end", ...liquidity, "US$m"],
        ["(Total debt plus financing obligations) / EBITDA", ...leverage, "x"],
      ],
      10,
    );
  const change = (sections: Section[]) =>
    foundationMetrics(foundation(sections), catalogue).map(({ key, metric }) => [
      key,
      metric.yearChange,
    ]);

  it("compares with the one row exactly a year earlier", () => {
    const m = measures(["Metric", "FY2023", "FY2024", "Unit"], ["4.2", "4.4"], ["300", "275"]);
    expect(change([periods(), m])).toEqual([
      ["liquidity", { change: "-25", unit: "US$m", prior: "FY2023", key: "liquidity" }],
      ["leverage", { change: "0.2", unit: "x", prior: "FY2023", key: "leverage" }],
    ]);
  });

  it("draws no comparator rather than a guess", () => {
    const m = measures(["Metric", "FY2023", "FY2024", "Unit"], ["4.2", "4.4"], ["300", "275"]);
    const none = [
      ["liquidity", undefined],
      ["leverage", undefined],
    ];
    expect(change([periods([["LTM", "2023-10-01", "2023-12-31"]]), m])).toEqual(none);
    expect(
      change([table("Period table", ["Period", "Start", "End"], [base[1] ?? []], 5), m]),
    ).toEqual(none);
    const dup = measures(
      ["Metric", "FY2023", "FY2023", "FY2024", "Unit"],
      ["4.2", "4.2", "4.4"],
      ["300", "300", "275"],
    );
    expect(change([periods(), dup])).toEqual(none);
    const text = measures(["Metric", "FY2023", "FY2024", "Unit"], ["n.a.", "4.4"], ["300", "275"]);
    expect(change([periods(), text])[1]).toEqual(["leverage", undefined]);
  });
});

describe("overview comparator when the run period is a label", () => {
  const withPeriod = (period: string): CatalogueRun => ({
    id: "first",
    issuer: "A",
    name: "A",
    title: "",
    date: "2025-01-01",
    period: "",
    sector: "",
    metrics: { cash: { value: 0, unit: "US$m", period } },
  });
  const rows = [
    ["FY2023", "2023-01-01", "2023-12-31"],
    ["FY2024", "2024-01-01", "2024-12-31"],
  ];
  const periods = (cells: string[][] = rows) =>
    table("Period table", ["Period", "Start", "End"], cells, 5);
  const measures = table(
    "Financials and credit metrics",
    ["Metric", "FY2023", "FY2024", "Unit"],
    [
      ["Total liquidity at period end", "300", "275", "US$m"],
      ["(Total debt plus financing obligations) / EBITDA", "4.2", "4.4", "x"],
    ],
    10,
  );
  const changes = (period: string, sections: Section[]) =>
    foundationMetrics(foundation(sections), withPeriod(period)).map(({ key, metric }) => [
      key,
      metric.yearChange,
    ]);
  const found = [
    ["liquidity", { change: "-25", unit: "US$m", prior: "FY2023", key: "liquidity" }],
    ["leverage", { change: "0.2", unit: "x", prior: "FY2023", key: "leverage" }],
  ];
  const none = [
    ["liquidity", undefined],
    ["leverage", undefined],
  ];

  it("finds the prior year from a period label and from an end date alike", () => {
    expect(changes("FY2024", [periods(), measures])).toEqual(found);
    expect(changes("2024-12-31", [periods(), measures])).toEqual(found);
  });

  it("draws nothing when the label names two rows or there is no Period table", () => {
    const twice = [...rows, ["FY2024", "2024-01-01", "2024-12-31"]];
    expect(changes("FY2024", [periods(twice), measures])).toEqual(none);
    expect(changes("FY2024", [measures])).toEqual(none);
  });
});

describe("what the overview carries for every module", () => {
  type Spec = {
    bottom?: string;
    limits?: string[];
    summary?: string;
    summaryLimit?: string;
    retained?: { bottom: string; limits: string[] };
  };
  const passage = (heading: string, line: number, texts: string[]): Section => ({
    heading,
    level: 3,
    line,
    blocks: texts.map((text, index) => ({
      type: "text" as const,
      line: line + index + 1,
      end: line + index + 1,
      text,
    })),
  });
  const sectionsOf = ({ bottom, limits }: { bottom?: string; limits?: string[] }): Section[] => [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    ...(bottom === undefined ? [] : [passage("Bottom line", 10, [bottom])]),
    ...(limits ? [passage("Limitations", 20, limits)] : []),
  ];
  function overviewFixture(specs: Record<string, Spec>, steps: string[] | null) {
    const outputs: Record<string, unknown> = {};
    const handoffs: Record<string, Section[]> = {};
    const modules: PublishedRun["modules"] = {};
    for (const [module, spec] of Object.entries(specs)) {
      const id = `f/outputs/${module}.md`;
      const ids = [id];
      outputs[id] = {
        id,
        run: "key",
        module,
        label: module,
        href: id,
        sha256: `sha-${module}`,
        summary: spec.summary
          ? {
              bottomLine: spec.summary,
              confidence: "",
              limitation: spec.summaryLimit ?? "",
              line: 7,
            }
          : null,
      };
      handoffs[`sha-${module}`] = sectionsOf(spec);
      if (spec.retained) {
        const old = `f/outputs/${module}-old.md`;
        ids.push(old);
        outputs[old] = {
          id: old,
          run: "key",
          module,
          label: module,
          href: old,
          sha256: `old-${module}`,
        };
        handoffs[`old-${module}`] = sectionsOf({
          bottom: spec.retained.bottom,
          limits: spec.retained.limits,
        });
      }
      modules[module] = { outputs: ids, default: id };
    }
    const run = {
      folder: "f",
      pathway: "credit_snapshot",
      modules,
      record: steps && { steps: steps.map((module) => ({ module })) },
    } as unknown as PublishedRun;
    const snapshot = {
      catalogue: { real: [] },
      workspace: { runs: { key: run }, outputs, handoffs, models: [] },
      chips: {},
    } as unknown as Snapshot;
    return { run, view: buildReportView(snapshot, "key", run) };
  }
  const A = "Segment margins are not disclosed, so margin trends are group-level only.";
  const full = (): Record<string, Spec> => ({
    "CP-0": {
      bottom: "The documents cover the last three financial years.",
      limits: ["Source files were read as supplied."],
    },
    "CP-1": {
      bottom: "Leverage is high but **liquidity** covers the next two years.",
      limits: [A, "The 2026 audit is not yet signed."],
      retained: { bottom: "An earlier draft.", limits: ["Only in the retained output."] },
    },
    "CP-2D": {
      bottom: "Not assessable: no liquidity schedule was supplied.",
      limits: ["Written by a module that could not assess."],
    },
    "CP-2": {
      bottom: "Credit is stable.",
      limits: [
        "- segment margins are NOT disclosed; so margin trends are group-level only!\nBasis: Financial foundation (CP-1)",
        "No covenant compliance certificate was supplied.",
      ],
    },
  });
  const steps = ["CP-0", "CP-1", "CP-2D", "CP-2"];

  it("orders modules as the run ran them, then any the record does not name", () => {
    const named = (record: PublishedRun["record"], modules: string[]) =>
      ({
        modules: Object.fromEntries(modules.map((id) => [id, { outputs: [], default: null }])),
        record,
      }) as unknown as PublishedRun;
    const ran = (...ids: string[]) => ({ steps: ids.map((module) => ({ module })) });
    expect(moduleOrder(named(ran("CP-1", "CP-0", "CP-1"), ["CP-0", "CP-1", "CP-2"]))).toEqual([
      "CP-1",
      "CP-0",
      "CP-2",
    ]);
    expect(moduleOrder(named(null, ["CP-0", "CP-2"]))).toEqual(["CP-0", "CP-2"]);
    expect(moduleOrder(named(ran("CP-9"), ["CP-0"]))).toEqual(["CP-9", "CP-0"]);
  });

  it("gives one bottom line per module that ran, other than the lead", () => {
    const { run, view } = overviewFixture(full(), steps);
    expect(view.lead?.output.module).toBe("CP-2");
    const rows = moduleBottomLines(view, run);
    expect(rows.map((row) => [row.id, row.state, row.text])).toEqual([
      ["CP-0", "Delivered", "The documents cover the last three financial years."],
      ["CP-1", "Delivered", "Leverage is high but liquidity covers the next two years."],
      ["CP-2D", "Not assessable", "Not assessable: no liquidity schedule was supplied."],
    ]);
    expect(rows.map((row) => [row.name, row.line, row.entry.selected])).toEqual([
      ["Source readiness", 11, true],
      ["Financial foundation", 11, true],
      ["Liquidity", 11, true],
    ]);
  });

  it("falls back to the output summary, and shows no text for a reference or a missing line", () => {
    const { run, view } = overviewFixture(
      {
        "CP-0": { summary: "Summary bottom line." },
        "CP-1": { bottom: "See debt-schedule.xlsx for the figure." },
        "CP-3": { limits: ["Only a limitation."] },
        "CP-2": { bottom: "Credit is stable." },
      },
      null,
    );
    expect(moduleBottomLines(view, run).map((row) => [row.id, row.text, row.line])).toEqual([
      ["CP-0", "Summary bottom line.", 7],
      ["CP-1", null, 11],
      ["CP-3", null, null],
    ]);
  });

  it("tells a bottom line that cites a source from one the module never wrote", () => {
    const { run, view } = overviewFixture(
      {
        "CP-0": { bottom: "Plain." },
        "CP-1": { bottom: "See debt-schedule.xlsx for the figure." },
        "CP-3": { limits: ["Only a limitation."] },
        "CP-2": { bottom: "Credit is stable." },
      },
      null,
    );
    expect(moduleBottomLines(view, run).map((row) => [row.id, row.text, row.referenced])).toEqual([
      ["CP-0", "Plain.", false],
      ["CP-1", null, true],
      ["CP-3", null, false],
    ]);
  });

  it("skips a recorded step that has no designated output", () => {
    const { run, view } = overviewFixture(
      { "CP-1": { bottom: "One.", limits: ["A."] }, "CP-2": { bottom: "Lead." } },
      ["CP-9", "CP-1", "CP-2"],
    );
    expect(moduleBottomLines(view, run).map((row) => row.id)).toEqual(["CP-1"]);
    expect(runLimitations(view, run).map((row) => row.id)).toEqual(["CP-1"]);
  });

  it("removes backticks and names a backticked code in a bottom line", () => {
    const { run, view } = overviewFixture(
      { "CP-1": { bottom: "`CP-2D` view `x`." }, "CP-2": { bottom: "Lead." } },
      null,
    );
    expect(moduleBottomLines(view, run)[0]?.text).toBe("Liquidity view x.");
  });

  it("keeps limitations that differ only in a period or a multiple", () => {
    const { run, view } = overviewFixture(
      {
        "CP-1": {
          limits: ["The FY2025 audit is not yet signed.", "Leverage above 4.5x is not tested."],
        },
        "CP-3": {
          limits: [
            "The FY2024 audit is not yet signed.",
            "Leverage above 5.5x is not tested.",
            "the fy2025 audit is NOT yet signed",
          ],
        },
      },
      ["CP-1", "CP-3"],
    );
    expect(runLimitations(view, run).map((row) => [row.id, row.text])).toEqual([
      ["CP-1", "The FY2025 audit is not yet signed."],
      ["CP-1", "Leverage above 4.5x is not tested."],
      ["CP-3", "The FY2024 audit is not yet signed."],
      ["CP-3", "Leverage above 5.5x is not tested."],
    ]);
  });

  it("skips a method note that opens the Bottom line passage", () => {
    const { run, view } = overviewFixture(
      {
        "CP-1": { bottom: "Module status: complete." },
        "CP-2": { bottom: "Credit is stable." },
      },
      null,
    );
    expect(view.lead?.output.module).toBe("CP-2");
    const [row] = moduleBottomLines(view, run);
    expect(row?.text).toBeNull();
    expect(row?.referenced).toBe(false);
  });

  it("reads a summary through readParagraph, so a trailing citation is not drawn", () => {
    const { run, view } = overviewFixture(
      {
        "CP-1": {
          summary: "Leverage is high [CP-1 p. 4].",
          summaryLimit: "Unaudited. 【12†L5-L9】",
        },
        "CP-3": { summary: "Bonds are cheap 【12†L5-L9】." },
      },
      null,
    );
    expect(moduleBottomLines(view, run).map((row) => row.text)).toEqual([
      "Leverage is high.",
      "Bonds are cheap.",
    ]);
    expect(runLimitations(view, run).map((row) => row.text)).toEqual(["Unaudited."]);
  });

  it("takes the summary's limitation only from a module with no Limitations passage, once, and not from a blocked one", () => {
    const { run, view } = overviewFixture(
      {
        "CP-1": { summary: "One.", summaryLimit: "The 2025 accounts are unaudited." },
        "CP-3": { summary: "Three.", summaryLimit: "the 2025 accounts are UNAUDITED" },
        "CP-4": {
          bottom: "Four.",
          limits: ["Written limitation."],
          summary: "Four.",
          summaryLimit: "Ignored: a passage exists.",
        },
        "CP-5": {
          bottom: "Not assessable: nothing supplied.",
          summary: "Five.",
          summaryLimit: "Ignored: blocked.",
        },
        "CP-6": { summary: "Six.", summaryLimit: "" },
      },
      null,
    );
    expect(runLimitations(view, run).map((row) => [row.id, row.text, row.line])).toEqual([
      ["CP-1", "The 2025 accounts are unaudited.", 7],
      ["CP-4", "Written limitation.", 21],
    ]);
  });

  it("lists each limitation of the run once, in module order", () => {
    const { run, view } = overviewFixture(full(), steps);
    expect(runLimitations(view, run).map((row) => [row.id, row.text])).toEqual([
      ["CP-0", "Source files were read as supplied."],
      ["CP-1", A],
      ["CP-1", "The 2026 audit is not yet signed."],
      ["CP-2", "No covenant compliance certificate was supplied."],
    ]);
  });

  it("keeps a limitation's line, drops method notes and empty items, and names a bare code", () => {
    const { run, view } = overviewFixture(
      {
        "CP-1": {
          limits: [
            "Module status: complete.",
            "Basis: only a basis",
            "Cash is shown by Liquidity (CP-2D) and CP-2D alike.",
          ],
        },
      },
      null,
    );
    expect(runLimitations(view, run).map((row) => [row.text, row.line, row.name])).toEqual([
      ["Cash is shown by Liquidity and Liquidity alike.", 23, "Financial foundation"],
    ]);
  });
});

// docs/rulings/2026-11-16-reporting-currency-from-sources.md: the run's currency is CP-1's money
// unit (`US$m` for USD, otherwise the code and `m`). Every expected string here is written by hand.
describe("overview tiles in the run's own reporting currency", () => {
  const halfYears = table(
    "Period table",
    ["Period", "Start", "End"],
    [
      ["H1 2025", "2025-01-01", "2025-06-30"],
      ["H1 2026", "2026-01-01", "2026-06-30"],
    ],
    5,
  );
  const catalogueIn = (unit?: string): CatalogueRun => ({
    id: "first",
    issuer: "A",
    name: "A",
    title: "",
    date: "2026-08-01",
    period: "",
    sector: "",
    metrics: { cash: { value: "1250", ...(unit && { unit }), period: "2026-06-30" } },
  });
  type Units = { liquidity: string; fcf: string; netDebt: string };
  const sections = (money: Units, principal: string, schedule: [string, string]): Section[] => [
    halfYears,
    table(
      "Financials and credit metrics",
      ["Metric", "H1 2025", "H1 2026", "Unit"],
      [
        ["Total liquidity at period end", "1100", "1250", money.liquidity],
        ["Free cash flow (operating cash flow less capex), twelve months", "80", "95.5", money.fcf],
        ["(Total debt plus financing obligations) / EBITDA", "4.0", "3.8", "x"],
        [
          "EBITDA / (cash interest for debt plus cash rent recorded as interest)",
          "2.5",
          "2.7",
          "x",
        ],
        ["Net debt at period end", "3000", "2875", money.netDebt],
      ],
      10,
    ),
    table(
      "Debt principal to carrying value",
      ["Period", "Contractual principal", "Discount", "Carrying value", "Reporting unit"],
      [["2026-06-30", "3400", "25", "3375", principal]],
      20,
    ),
    table(
      "Chart data: debt maturities",
      ["Period", "Debt maturing", "Reporting unit"],
      [
        ["2027", "640", schedule[0]],
        ["2028", "900", schedule[1]],
      ],
      30,
    ),
    table(
      "Calculations",
      ["ID", "Calculation", "Inputs", "Result", "Source"],
      [["C1", "Maturities from 2026-07-01 to end-2027", "", "640", ""]],
      40,
    ),
  ];
  const oneUnit = (unit: string) =>
    sections({ liquidity: unit, fcf: unit, netDebt: unit }, unit, [unit, unit]);
  const tiles = (input: Section[], unit?: string) =>
    foundationMetrics(foundation(input), catalogueIn(unit)).map(({ key, metric }) => [
      key,
      metric.value?.kind === "value" ? metric.value.text : null,
    ]);

  it("shows a GBP run's tiles in pounds and carries GBPm into the year change", () => {
    expect(tiles(oneUnit("GBPm"), "GBPm")).toEqual([
      ["liquidity", "£1,250m"],
      ["freeCashFlow", "£95.5m"],
      ["leverage", "3.8x"],
      ["interestCover", "2.7x"],
      ["netDebt", "£2,875m"],
      ["principal", "£3,400m"],
      ["maturities", "£640m"],
    ]);
    const [liquidity] = foundationMetrics(foundation(oneUnit("GBPm")), catalogueIn("GBPm"));
    expect(liquidity?.metric.yearChange).toEqual({
      key: "liquidity",
      change: "150",
      unit: "GBPm",
      prior: "H1 2025",
    });
  });

  it("shows a CHF run's tiles with the CHF code", () => {
    expect(tiles(oneUnit("CHFm"), "CHFm")).toEqual([
      ["liquidity", "CHF 1,250m"],
      ["freeCashFlow", "CHF 95.5m"],
      ["leverage", "3.8x"],
      ["interestCover", "2.7x"],
      ["netDebt", "CHF 2,875m"],
      ["principal", "CHF 3,400m"],
      ["maturities", "CHF 640m"],
    ]);
  });

  it("draws a GBP run's tiles and year change on the page", () => {
    const records = foundationMetrics(foundation(oneUnit("GBPm")), catalogueIn("GBPm"));
    const snapshot: Snapshot = {
      catalogue: { real: [] },
      workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
      chips: {},
    };
    render(createElement(MetricGrid, { records, entryIndex: -1, snapshot, folder: "first" }));
    expect(screen.getByText("£1,250m")).toBeInTheDocument();
    expect(screen.getByText("+£150m vs H1 2025")).toBeInTheDocument();
    expect(screen.getByText("£3,400m")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it("leaves out a tile whose table mixes two money units", () => {
    const mixed = sections({ liquidity: "GBPm", fcf: "US$m", netDebt: "GBPm" }, "GBPm", [
      "GBPm",
      "US$m",
    ]);
    expect(tiles(mixed, "GBPm")).toEqual([
      ["liquidity", "£1,250m"],
      ["leverage", "3.8x"],
      ["interestCover", "2.7x"],
      ["netDebt", "£2,875m"],
      ["principal", "£3,400m"],
    ]);
    const unstated = sections({ liquidity: "GBPm", fcf: "EURm", netDebt: "GBPm" }, "GBPm", [
      "GBPm",
      "GBPm",
    ]);
    expect(tiles(unstated)).toEqual([
      ["leverage", "3.8x"],
      ["interestCover", "2.7x"],
      ["principal", "£3,400m"],
      ["maturities", "£640m"],
    ]);
  });

  it("draws no money tile from tables in another currency than the run's", () => {
    expect(tiles(oneUnit("US$m"), "GBPm")).toEqual([
      ["leverage", "3.8x"],
      ["interestCover", "2.7x"],
    ]);
  });

  it("reads each table's own unit when the cash figure records no money unit", () => {
    expect(tiles(oneUnit("US$m"), "USD millions")).toEqual([
      ["liquidity", "$1,250m"],
      ["freeCashFlow", "$95.5m"],
      ["leverage", "3.8x"],
      ["interestCover", "2.7x"],
      ["netDebt", "$2,875m"],
      ["principal", "$3,400m"],
      ["maturities", "$640m"],
    ]);
  });

  it("keeps a USD run's tiles exactly as before", () => {
    expect(tiles(oneUnit("US$m"), "US$m")).toEqual([
      ["liquidity", "$1,250m"],
      ["freeCashFlow", "$95.5m"],
      ["leverage", "3.8x"],
      ["interestCover", "2.7x"],
      ["netDebt", "$2,875m"],
      ["principal", "$3,400m"],
      ["maturities", "$640m"],
    ]);
    const [liquidity] = foundationMetrics(foundation(oneUnit("US$m")), catalogueIn("US$m"));
    expect(liquidity?.metric).toEqual({
      label: "Total liquidity at period end",
      value: { kind: "value", at: null, text: "$1,250m" },
      note: "2026-06-30",
      trace: null,
      yearChange: { key: "liquidity", change: "150", unit: "US$m", prior: "H1 2025" },
    });
    expect(liquidity?.line).toBe(12);
  });
});
