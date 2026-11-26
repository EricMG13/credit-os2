import { describe, expect, it } from "vitest";
import {
  classifySections,
  outputEntries,
  containsReference,
  comparisonRows,
  comparisonForRun,
  type PublishedRun,
  displayColumns,
  readParagraph,
  plainModuleNames,
  publishedHref,
  runPathway,
  runTiming,
  evidencePath,
  evidenceToken,
  resolveEvidenceLocation,
  type OutputEntry,
  missingPassages,
} from "./publishedReport";

describe("published handoff boundaries", () => {
  it("uses the actual pathway and displays one as-of date", () => {
    expect(runPathway({ pathway: "credit_snapshot" })).toBe("Full credit assessment");
    expect(runTiming({ asOf: "2025-03-31", period: "As of 31 March 2025" })).toBe(
      "As of 31 March 2025",
    );
    expect(runTiming({ asOf: "2025-03-31", period: "FY2024" })).toBe(
      "As of 31 March 2025 · FY2024",
    );
  });

  it("sets earlier citations aside while preserving substantive brackets and punctuation", () => {
    expect(
      readParagraph("Cash fell [p. 12]. Losses were reported [sic]. Debt stayed flat. [CP-1]"),
    ).toEqual({
      body: "Cash fell. Losses were reported [sic]. Debt stayed flat.",
      basis: "[p. 12] [CP-1]",
    });
  });
  it("classifies passages, registrations and inter-module bodies by ancestry", () => {
    const headings: [string, number][] = [
      ["Findings", 2],
      ["Bottom line", 3],
      ["Source register", 3],
      ["Downstream owners", 3],
      ["Hidden descendant", 4],
      ["Credit drivers", 3],
      ["Sources", 2],
      ["Annual filings", 3],
    ];
    const locations = headings.map(([heading, level], line) => ({
      heading,
      level,
      line,
      blocks: [],
    }));
    expect(classifySections(locations).map(({ role }) => role)).toEqual([
      "finding",
      "passage",
      "registers",
      "hidden",
      "hidden",
      "finding",
      "sources",
      "sources",
    ]);
  });

  it("files a Confidence inputs table under Findings as a register", () => {
    const sections = [
      { heading: "Findings", level: 2, line: 0, blocks: [] },
      { heading: "Confidence inputs", level: 3, line: 1, blocks: [] },
    ];
    expect(classifySections(sections).map(({ role }) => role)).toEqual(["finding", "registers"]);
  });

  it("files every sibling after the real appendix heading as registers (CP-2A shape)", () => {
    const headings: [string, number][] = [
      ["Findings", 2],
      ["Catalyst view", 3],
      ["Analytical appendix — complete canonical registers", 3],
      ["T2B.1 Source gate and baseline", 3],
      ["T2B.9 Downside gaps ledger", 3],
      ["T5.7 Event gaps and coverage", 3],
      ["Material claim lineage", 3],
      ["Evidence references", 3],
      ["Calculations", 2],
    ];
    const sections = headings.map(([heading, level], line) => ({
      heading,
      level,
      line,
      blocks: [],
    }));
    expect(classifySections(sections).map(({ role }) => role)).toEqual([
      "finding",
      "finding",
      "registers",
      "registers",
      "registers",
      "registers",
      "registers",
      "registers",
      "calculations",
    ]);
  });

  it("keeps module-written conclusions after the appendix heading on the module page (CP-2, CP-3C, CP-5)", () => {
    const text = (line: number, value: string) => ({
      type: "text" as const,
      line,
      end: line,
      text: value,
    });
    const tab = (line: number) => ({
      type: "table" as const,
      line,
      headers: ["A", "B"],
      rows: [{ line: line + 2, cells: ["1", "2"] }],
    });
    const basis = (line: number) => text(line, "Basis: Financial foundation");
    const make = (
      list: [string, number, ReturnType<typeof tab> | ReturnType<typeof text> | null][],
    ) =>
      classifySections(
        list.map(([heading, level, block], line) => ({
          heading,
          level,
          line: line * 10,
          blocks: block ? [block] : [],
        })),
      ).map(({ section, role }) => `${section.heading}=${role}`);
    const appendix = "Analytical appendix — complete canonical registers";
    expect(
      make([
        ["Findings", 2, null],
        ["Bottom line", 3, text(1, "Strong business.")],
        [appendix, 3, null],
        ["T2.1 Source gate and analytical source register", 3, tab(2)],
        ["Credit-translated strategic synthesis", 3, tab(3)],
        ["Material claim lineage", 3, tab(4)],
        ["Confidence inputs", 3, tab(5)],
        ["Map: credit-risk transmission", 3, tab(6)],
        ["Overall credit conclusion", 3, text(7, "Overall, TransDigm presents a strong profile.")],
        ["Calculations", 2, null],
      ]),
    ).toEqual([
      "Findings=finding",
      "Bottom line=passage",
      `${appendix}=registers`,
      "T2.1 Source gate and analytical source register=registers",
      "Credit-translated strategic synthesis=registers",
      "Material claim lineage=registers",
      "Confidence inputs=registers",
      "Map: credit-risk transmission=drawing",
      "Overall credit conclusion=finding",
      "Calculations=calculations",
    ]);
    expect(
      make([
        ["Findings", 2, null],
        [appendix, 3, null],
        ["T3D.2 Maturity wall and refinancing register", 4, tab(2)],
        ["T3D.10 Scenario map", 4, tab(3)],
        [
          "Overall refinancing and liability-management view",
          3,
          text(4, "Completed with limitations."),
        ],
        ["Calculations", 2, null],
      ]),
    ).toEqual([
      "Findings=finding",
      `${appendix}=registers`,
      "T3D.2 Maturity wall and refinancing register=registers",
      "T3D.10 Scenario map=registers",
      "Overall refinancing and liability-management view=finding",
      "Calculations=calculations",
    ]);
    expect(
      make([
        ["Findings", 2, null],
        [appendix, 3, null],
        ["T5B.1 Source register", 4, tab(2)],
        ["T5.3 Math, logic and definition audit", 4, tab(3)],
        ["Remediation priorities", 3, text(4, "Must-fix before committee: withdraw.")],
        ["Clearance decision", 3, text(5, "CLEARANCE DECISION: Fail.")],
        ["Confidence inputs", 3, tab(6)],
        ["Gaps", 2, null],
      ]),
    ).toEqual([
      "Findings=finding",
      `${appendix}=registers`,
      "T5B.1 Source register=registers",
      "T5.3 Math, logic and definition audit=registers",
      "Remediation priorities=finding",
      "Clearance decision=finding",
      "Confidence inputs=registers",
      "Gaps=gaps",
    ]);
    // A text-only section whose only paragraph is a Basis line is still a register.
    expect(
      make([
        ["Findings", 2, null],
        [appendix, 3, null],
        ["Evidence references", 3, basis(3)],
      ]).at(-1),
    ).toBe("Evidence references=registers");
  });

  it("hides inter-module downstream_use and consumer_module_id columns in both modes (CP-2A)", () => {
    const headers = ["scenario", "limitation", "downstream_use", "Source"];
    expect(displayColumns(headers, false)).toEqual([0, 1]);
    expect(displayColumns(headers, true)).toEqual([0, 1, 3]);
    expect(displayColumns(["a", "consumer_module_id"], false)).toEqual([0]);
    expect(displayColumns(["a", "consumer_module_id"], true)).toEqual([0]);
  });

  // E1: a column the module wrote about its own analysis is drawn; only a hand-over to another
  // module stays hidden. Cells are verbatim from the TDG replay handoffs CP-2A (T2B.7) and CP-2D (T2E.9).
  it("draws the module's own Escalation Consequence column (CP-2A T2B.7)", () => {
    const headers = ["Trigger ID", "Linked Pathway Row", "Escalation Consequence", "Source Trace"];
    const rows = [
      {
        line: 1,
        cells: [
          "MON-01",
          "Operating first break: shipments \u2192 margins \u2192 FCF",
          "Challenge the assumed earnings cases before headline cash erosion",
          "Fundamental credit",
        ],
      },
      {
        line: 2,
        cells: [
          "MON-05",
          "Funding pinch",
          "Nonrenewal makes cash repayment necessary even if EBITDA covers interest",
          "E03",
        ],
      },
    ];
    expect(displayColumns(headers, false, rows)).toContain(2);
    expect(displayColumns(headers, true, rows)).toContain(2);
  });

  it("draws Downstream Module Affected when it states an effect within the module (CP-2D T2E.9)", () => {
    const headers = ["Gap", "Missing Data", "Downstream Module Affected"];
    const within = [
      {
        line: 1,
        cells: [
          "G1",
          "Credit agreement definitions",
          "Within this analysis: revolver access and the risk level",
        ],
      },
      {
        line: 2,
        cells: ["G2", "Securitization agreement", "Within this analysis: debt maturities row"],
      },
    ];
    expect(displayColumns(headers, false, within)).toEqual([0, 1, 2]);
    expect(displayColumns(headers, true, within)).toEqual([0, 1, 2]);
    // Cells that name another module are written for that module: hidden everywhere.
    const handed = [
      {
        line: 1,
        cells: ["G1", "Credit agreement definitions", "Refinancing & LME; Ratings & triggers"],
      },
    ];
    expect(displayColumns(headers, false, handed)).toEqual([0, 1]);
    expect(displayColumns(headers, true, handed)).toEqual([0, 1]);
    expect(displayColumns(headers, false)).toEqual([0, 1]);
  });

  it("keeps real Evidence and Source / Limitation columns that carry qualifications (CP-2)", () => {
    const headers = ["Trigger", "Evidence", "Source / Limitation", "Source"];
    const rows = [
      {
        line: 1,
        cells: [
          "Revenue decline",
          "September recap uses USD 3,000 million new secured financing; October payment USD 4,348 million",
          "Directional observation, not a numerical covenant or default threshold",
          "TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 9-12",
        ],
      },
    ];
    expect(displayColumns(headers, false, rows)).toEqual([0, 1, 2]);
    const refs = [
      { line: 1, cells: ["x", "tdg-20240930.htm.jsonl, pages 9", "report.pdf, page 7", "s"] },
    ];
    expect(displayColumns(headers, false, refs)).toEqual([0]);
  });

  it("treats register, calculation and scenario ids inside real sentences as references", () => {
    expect(containsReference("Counted as fixed in the issuer's 77% share (calculation R9)")).toBe(
      true,
    );
    expect(containsReference("Copied from the Downside scenario S02 (moderate downturn)")).toBe(
      true,
    );
    expect(
      containsReference("FY2024 reported EBITDA; CP-1C T4.10 EV/EBITDA supplies no Low implied EV"),
    ).toBe(true);
    expect(containsReference("Debt of T2.5 billion and a 3.29x cover")).toBe(false);
  });

  it("hides raw snake_case reference columns of real registers", () => {
    const headers = ["question_id", "research_sha256", "evidence_ids", "disposition"];
    expect(displayColumns(headers, false)).toEqual([3]);
  });

  it("keeps the exact basis in trace and preserves identifiers in evidence tables only", () => {
    expect(
      readParagraph("- **Cash was USD 0m.**\nBasis: report.pdf, page 7; report.pdf, page 8."),
    ).toEqual({
      body: "**Cash was USD 0m.**",
      basis: "report.pdf, page 7; report.pdf, page 8.",
    });
    const headers = [
      "Cash",
      "Source",
      "Evidence ID",
      "Next module",
      "Downstream revenue",
      "Source / Limitation",
    ];
    expect(displayColumns(headers, false)).toEqual([0, 4]);
    expect(displayColumns(headers, true)).toEqual([0, 1, 2, 4, 5]);
  });

  it("accepts only served workspace files and rejects path segments that change the target", () => {
    expect(publishedHref("downloads/test-run/CP-2.md", "test-run")).toBe(
      "/library/downloads/test-run/CP-2.md",
    );
    expect(publishedHref("downloads/other/CP-2.md", "test-run")).toBeNull();
    expect(publishedHref("downloads/test-run/%2e%2e/other.md", "test-run")).toBeNull();
    expect(publishedHref("downloads/test-run/a%2Fb.md", "test-run")).toBeNull();
    expect(publishedHref("https://example.com/CP-2.md", "test-run")).toBeNull();
  });
  it("carries authored changes and withholds a claimed delta across conflicting units", () => {
    const measure = {
      key: "cash",
      label: "Cash",
      prior: { value: "0", unit: "US$m", period: "FY2025" },
      current: { value: "20", unit: "GBPm", period: "FY2026" },
      difference: "20",
      unit: "GBPm",
    };
    const rows = comparisonRows({
      pack: { measures: [measure] },
      verdicts: {
        measures: {
          cash: {
            kind: "comparable",
            label: "Comparable",
            analysis_change: "The newer analysis uses a different cash perimeter.",
          },
        },
      },
    });
    expect(rows[0]).toEqual([
      "Cash",
      "$0m (FY2025)",
      "£20m (FY2026)",
      "—",
      "Reporting units differ.",
      "The newer analysis uses a different cash perimeter.",
    ]);
  });

  it("keeps a same-period revision in Evidence without presenting it as issuer movement", () => {
    const change = {
      pack: {
        measures: [
          {
            key: "debt",
            label: "Total debt",
            unit: "US$m",
            same_period: true,
            prior: { value: "110", unit: "US$m", period: "FY2025" },
            current: { value: "100", unit: "US$m", period: "FY2025" },
            difference: "-10",
          },
        ],
      },
      verdicts: {
        measures: {
          debt: {
            kind: "comparable",
            label: "Same definition",
            analysis_change: "The updated filing reclassifies 10 US$m.",
          },
        },
      },
    };
    expect(comparisonRows(change)[0]).toEqual([
      "Total debt",
      "$110m (FY2025)",
      "$100m (FY2025)",
      "-$10m",
      "Same definition · Same-period analysis change",
      "The updated filing reclassifies 10 US$m.",
    ]);
    expect(comparisonRows(change, "reader")[0]?.[3]).toBe("—");
  });

  it("binds a comparison to the exact prior issuer, dates and pathway", () => {
    const earlier = {
      folder: "earlier",
      issuerKey: "issuer:alpha",
      asOf: "2024-12-31",
      pathway: "credit_snapshot",
    } as PublishedRun;
    const change = {
      pack: {
        prior: {
          run: "earlier",
          as_of: "2024-12-31",
          pathway: "credit_snapshot",
          format: "earlier",
        },
        current: { as_of: "2025-03-31", pathway: "credit_snapshot" },
        measures: [],
      },
    };
    const current = { ...earlier, folder: "current", asOf: "2025-03-31", changes: change };
    expect(comparisonForRun(current, { earlier, current })).toBe(change);
    for (const mismatched of [
      { ...earlier, issuerKey: "issuer:beta" },
      { ...earlier, asOf: "2024-12-30" },
      { ...earlier, pathway: "lite_credit_assessment" },
    ]) {
      expect(comparisonForRun(current, { earlier: mismatched, current })).toMatchObject({
        pack: null,
        problem: expect.any(String) as unknown,
      });
    }
  });
});

describe("stable evidence addresses", () => {
  const first = {
    output: {
      id: "run/CP-1/first.md",
      sha256: "a".repeat(64),
      module: "CP-1",
      label: "First handoff",
      href: "first.md",
    },
    sections: [
      {
        heading: "Findings",
        level: 2,
        line: 40,
        blocks: [
          {
            type: "table",
            line: 45,
            headers: ["Measure"],
            rows: [{ line: 46, cells: ["Leverage"] }],
          },
        ],
      },
    ],
    selected: true,
  } as OutputEntry;
  const second: OutputEntry = {
    ...first,
    output: { ...first.output, id: "run/CP-1/second.md", sha256: "b".repeat(64) },
  };

  it("keeps an output and row address bound when entries reorder", () => {
    const token = evidenceToken(first, 46);
    expect(evidencePath("issuer run", first, 46)).toBe(`/report/issuer%20run#evidence/${token}`);
    expect(resolveEvidenceLocation([second, first], token)).toMatchObject({
      entry: first,
      index: 1,
      line: 46,
    });
  });

  it("rejects unavailable revisions and old ordinal links", () => {
    expect(resolveEvidenceLocation([second], evidenceToken(first, 46))).toBeNull();
    expect(resolveEvidenceLocation([first], "1-46")).toBeNull();
    const revised: OutputEntry = {
      ...first,
      output: { ...first.output, sha256: "c".repeat(64) },
    };
    expect(resolveEvidenceLocation([revised], evidenceToken(first, 46))).toBeNull();
    expect(resolveEvidenceLocation([first], evidenceToken(first, 47))).toBeNull();
    expect(resolveEvidenceLocation([first, first], evidenceToken(first, 46))).toBeNull();
  });
});

describe("plainModuleNames", () => {
  it("shows a named upstream module without its code", () => {
    expect(plainModuleNames("Liquidity (CP-2D); calculation C-4")).toBe(
      "Liquidity; calculation C-4",
    );
    expect(plainModuleNames("Report (CP-1).pdf, page 3")).toBe("Report (CP-1).pdf, page 3");
    expect(plainModuleNames("The CP-2 view is unchanged")).toBe("The CP-2 view is unchanged");
  });

  it.each([
    ["Deck (CP-1) Q3.pdf, page 3", "Deck (CP-1) Q3.pdf, page 3"],
    ["Model (CP-2)_v2.xlsx", "Model (CP-2)_v2.xlsx"],
    ["Report (CP-1)-final.pdf", "Report (CP-1)-final.pdf"],
    ["Data room (CP-1)/deck.pdf", "Data room (CP-1)/deck.pdf"],
    ["Credit is stable; Liquidity (CP-2D) is ample.", "Credit is stable; Liquidity is ample."],
    ["Basis: Financial foundation (CP-1)", "Basis: Financial foundation"],
    ["Liquidity (CP-2D) shows cover of 2.5x.", "Liquidity shows cover of 2.5x."],
    [
      "Financial foundation (CP-1); TDG_2024-09-30_10-K_tdg-20240930.htm.jsonl, pages 73–73",
      "Financial foundation; TDG_2024-09-30_10-K_tdg-20240930.htm.jsonl, pages 73–73",
    ],
  ])("keeps a stored file name and drops a module code beside it: %j", (input, expected) => {
    expect(plainModuleNames(input)).toBe(expected);
  });
});

const CONTRARY = "Contrary evidence and what would change the view";
function entry(module: string, headings: string[], bottom = "Judgement."): OutputEntry {
  return {
    selected: true,
    output: { id: "a", module, label: "a", href: "", sha256: "a" },
    sections: headings.length
      ? [
          { heading: "Findings", level: 2, line: 1, blocks: [] },
          ...headings.map((heading, at) => ({
            heading,
            level: 3,
            line: 2 + at,
            blocks: [
              {
                type: "text" as const,
                line: 20 + at,
                end: 20 + at,
                text: heading === "Bottom line" ? bottom : "Text.",
              },
            ],
          })),
        ]
      : [],
  };
}

describe("missing reader passages", () => {
  it("lists the reader passages a prose module did not write", () => {
    expect(missingPassages(entry("CP-2", ["Bottom line", "Limitations"]))).toEqual([
      "Key findings",
      CONTRARY,
    ]);
  });
  it("asks a data module for its bottom line only", () => {
    expect(missingPassages(entry("CP-1", ["Bottom line"]))).toEqual([]);
    expect(missingPassages(entry("CP-1C", ["Key findings"]))).toEqual(["Bottom line"]);
  });
  it("asks a blocked module for nothing more", () => {
    expect(missingPassages(entry("CP-2", ["Bottom line"], "Not assessable: no accounts."))).toEqual(
      [],
    );
  });
  it("does not judge an earlier-format handoff", () => {
    expect(missingPassages(entry("CP-2", []))).toEqual([]);
  });
});

describe("credit screening CP-L10 sections", () => {
  const section = (heading: string, level: number, line: number) => ({
    heading,
    level,
    line,
    blocks: [],
  });
  const sections = [
    section("Findings", 2, 1),
    section("Bottom line", 3, 2),
    section("Credit screen", 3, 3),
    section("Source and scope gate", 3, 4),
    section("Sources", 2, 5),
  ];
  const entriesFor = (pathway: string) => {
    const snapshot = {
      workspace: {
        outputs: { o: { id: "o", module: "CP-L10", sha256: "s", run: "case" } },
        handoffs: { s: sections },
      },
    } as unknown as Parameters<typeof outputEntries>[0];
    const run = {
      pathway,
      modules: { "CP-L10": { outputs: ["o"], default: "o" } },
    } as unknown as PublishedRun;
    const [entry] = outputEntries(snapshot, run, "case");
    return classifySections(entry?.sections ?? []).map(({ role }) => role);
  };

  it("turns a finding other than the five screens into a register, and nothing else", () => {
    expect(entriesFor("credit_screening")).toEqual([
      "finding",
      "passage",
      "finding",
      "registers",
      "sources",
    ]);
  });

  it("keeps the base roles in another pathway", () => {
    expect(entriesFor("short_snapshot")).toEqual([
      "finding",
      "passage",
      "finding",
      "finding",
      "sources",
    ]);
  });
});
