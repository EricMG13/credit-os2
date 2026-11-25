import { describe, expect, it } from "vitest";
import { blankPin, PINS, readAssumptions } from "./assumptions";
import {
  assumptionsSummary,
  count,
  datesSummary,
  dealSummary,
  fileRoles,
  filesSummary,
  issuerSummary,
  legalSummary,
  modelChoices,
  modelSummary,
  moduleOptionsSummary,
  researchSummary,
  sectionOfField,
  valuationSummary,
} from "./contextSummary";
import type { Context } from "../api";
import { emptyRow, type Row, type RowKind } from "./rows";
import { readValuation } from "./valuation";

const run = (extra: Partial<Context["run"]> = {}): Context["run"] => ({
  as_of: "2025-03-31",
  pathway: "credit_snapshot",
  case_kind: "public",
  run_type: "secondary",
  ...extra,
});

const rowsView = (rows: Partial<Record<RowKind, Row[]>>, extra: Partial<Context["run"]> = {}) => ({
  rowsOf: (kind: RowKind) => rows[kind] ?? [],
  run: run(extra),
});

const identity = (extra: Partial<Context["identity"]> = {}): Context["identity"] => ({
  issuer_name: "Northbridge",
  issuer_id: "northbridge",
  ...extra,
});

describe("the section a problem's field is in", () => {
  it.each([
    ["analyst_note", "research"],
    ["research_questions", "research"],
    ["cutoff", "dates"],
    ["current_period", "dates"],
    ["prior_period", "dates"],
    ["legal_documents", "legal"],
    ["agreement", "legal"],
    ["ratings", "deal"],
    ["quotes", "deal"],
    ["deal_terms", "deal"],
    ["valuation", "valuation"],
    ["module_options", "module_options"],
    ["assumptions", "assumptions"],
    ["turns", "model"],
  ] as const)("%s is in %s", (field, key) => {
    expect(sectionOfField(field)).toBe(key);
  });

  it("names none for a Documents field or no problem", () => {
    expect(sectionOfField("issuer_name")).toBeUndefined();
    expect(sectionOfField("submitted_by")).toBeUndefined();
    expect(sectionOfField(undefined)).toBeUndefined();
  });
});

describe("the one-line summaries", () => {
  it("counts in words", () => {
    expect(count(0, "quote", "quotes")).toBe("no quotes");
    expect(count(1, "quote", "quotes")).toBe("1 quote");
    expect(count(12, "quote", "quotes")).toBe("12 quotes");
  });

  it("says the note and the questions typed, and a row left blank as not filled", () => {
    const note = (analystNote: string, rows: Row[]) => ({
      analystNote,
      ...rowsView({ research_questions: rows }),
    });
    expect(researchSummary(note("", []))).toBe("Not given");
    expect(researchSummary(note("  \n ", [emptyRow("research_questions")]))).toBe(
      "No note · 1 question row, not filled",
    );
    expect(researchSummary(note("Check 2028.", []))).toBe("Note given · no questions");
    expect(
      researchSummary(
        note("", [{ text: "Run-rate savings?", focus_module: "" }, emptyRow("research_questions")]),
      ),
    ).toBe("No note · 1 question · 1 question row, not filled");
    expect(
      researchSummary(
        note("x", [
          { text: "One?", focus_module: "" },
          { text: "", focus_module: "CP-2" },
        ]),
      ),
    ).toBe("Note given · 2 questions");
  });

  it("says the cutoff, falling back to the as-of date the box shows, and the periods", () => {
    const dates = (extra: Partial<Context["run"]>, newest = "", earnings = false) =>
      datesSummary({ run: run(extra), newest, earnings });
    expect(dates({})).toBe("Cutoff 2025-03-31 · periods not given");
    expect(dates({ as_of: "" })).toBe("Cutoff not given · periods not given");
    expect(dates({ cutoff: "2025-02-28" }, "2024-12-31")).toBe(
      "Cutoff 2025-02-28 · periods not given · newest file 2024-12-31",
    );
    expect(dates({ current_period: "q1-2025", prior_period: "q4-2024" })).toBe(
      "Cutoff 2025-03-31 · current q1-2025, prior q4-2024",
    );
    expect(dates({ prior_period: "q4-2024" })).toBe(
      "Cutoff 2025-03-31 · current not given, prior q4-2024",
    );
  });

  it("puts the periods first and says they are required for an Earnings Update", () => {
    const earnings = (extra: Partial<Context["run"]>) =>
      datesSummary({ run: run(extra), newest: "", earnings: true });
    expect(earnings({})).toBe("Periods required, not given · cutoff 2025-03-31");
    expect(earnings({ current_period: "q1-2025" })).toBe(
      "Periods required: current q1-2025, prior not given · cutoff 2025-03-31",
    );
    expect(earnings({ current_period: "q1-2025", prior_period: "q4-2024" })).toBe(
      "Periods required: current q1-2025, prior q4-2024 · cutoff 2025-03-31",
    );
  });

  const fileChoices = { "": "None", "agreement.txt": "agreement.txt", "book.xlsx": "book.xlsx" };

  it("says the agreement choice and its file, only a file the box offers", () => {
    const legal = (choice: string, agreement?: string) =>
      legalSummary({ legal: choice, attachments: agreement ? { agreement } : {}, fileChoices });
    expect(legal("none", "agreement.txt")).toBe("No agreement");
    expect(legal("executed", "agreement.txt")).toBe("Executed agreement · agreement.txt");
    expect(legal("draft")).toBe("Draft agreement · agreement file not chosen");
    expect(legal("draft", "removed.txt")).toBe("Draft agreement · agreement file not chosen");
    expect(legal("unknown")).toBe("Not given");
  });

  it.each([
    ["credit_snapshot", "basic", false, ["portfolio_workbook"]],
    ["deep_credit_assessment", "basic", false, ["portfolio_workbook"]],
    ["lite_credit_assessment", "basic", false, []],
    ["relative_value", "basic", false, []],
    ["earnings_update", "basic", true, ["management_bridge"]],
    ["portfolio_decision", "basic", false, ["portfolio_workbook", "prior_case"]],
    [
      "relative_value",
      "advanced",
      false,
      ["management_bridge", "portfolio_workbook", "prior_case"],
    ],
  ] as const)("draws the file boxes for %s at %s", (pathway, level, earnings, expected) => {
    expect(fileRoles({ run: run({ pathway }), level, earnings })).toEqual(expected);
  });

  it("names each chosen file by its box", () => {
    const files = (attachments: Record<string, string>) =>
      filesSummary({ attachments, fileChoices }, [
        "management_bridge",
        "portfolio_workbook",
        "prior_case",
      ]);
    expect(files({})).toBe("None chosen");
    expect(files({ portfolio_workbook: "book.xlsx" })).toBe("Portfolio workbook: book.xlsx");
    expect(files({ portfolio_workbook: "gone.xlsx", management_bridge: "agreement.txt" })).toBe(
      "Management EBITDA bridge: agreement.txt",
    );
    expect(
      filesSummary({ attachments: { prior_case: "book.xlsx" }, fileChoices }, [
        "portfolio_workbook",
      ]),
    ).toBe("None chosen");
  });

  it("counts the ratings, quotes and facilities that would be sent, and says rows not filled", () => {
    expect(dealSummary(rowsView({}))).toBe("Not given");
    expect(
      dealSummary(
        rowsView({ ratings: [{ agency: "Moody's", scope: "issuer" }, emptyRow("ratings")] }),
      ),
    ).toBe("1 rating · 1 rating row, not filled · no quotes · no facilities");
    expect(dealSummary(rowsView({ deal_terms: [emptyRow("deal_terms")] }))).toBe(
      "No ratings · no quotes · 1 facility row, not filled",
    );
    expect(
      dealSummary(
        rowsView({
          quotes: [
            { facility_id: "tlb", kind: "observed" },
            { bid: "98", kind: "observed" },
          ],
          deal_terms: [{ facility_id: "tlb" }],
        }),
      ),
    ).toBe("No ratings · 2 quotes · 1 facility");
  });

  it("says a facility holding only new-issue terms on a secondary run is not sent", () => {
    const facility = { ...emptyRow("deal_terms"), tenor_years: "7" };
    expect(dealSummary(rowsView({ deal_terms: [facility] }))).toBe(
      "No ratings · no quotes · 1 facility row with new-issue terms only, not sent",
    );
    expect(dealSummary(rowsView({ deal_terms: [facility] }, { run_type: "primary" }))).toBe(
      "No ratings · no quotes · 1 facility",
    );
  });

  it("says a new issue needs a facility", () => {
    expect(dealSummary(rowsView({}, { run_type: "primary" }))).toBe(
      "No ratings · no quotes · no facilities, at least one required",
    );
  });

  it("names the issuer details given and counts the lists", () => {
    expect(issuerSummary({ identity: identity() })).toBe("Not given");
    expect(issuerSummary({ identity: identity({ sector: "  ", ticker: "NBG" }) })).toBe(
      "Not given",
    );
    expect(issuerSummary({ identity: identity({ sponsor: "Harbour Peak" }) })).toBe(
      "Sponsor given",
    );
    expect(
      issuerSummary({
        identity: identity({
          borrower_name: "Northbridge Holdings LLC",
          sector: "Industrials",
          country: "United States",
          aliases: ["NB"],
          guarantors: ["A", "B"],
          listed_equity: true,
        }),
      }),
    ).toBe(
      "Borrower, sector and country given · 1 other name · 2 guarantors · listed equity, no ticker",
    );
    expect(issuerSummary({ identity: identity({ listed_equity: true, ticker: " NBG " }) })).toBe(
      "Listed equity, ticker NBG",
    );
  });

  it("says the peer source and valuation basis, with the rows each adds", () => {
    const blank = readValuation({});
    expect(valuationSummary(blank)).toBe(
      "Peer source: Research finds public peers (default) · valuation basis: Automatic",
    );
    expect(
      valuationSummary({
        ...blank,
        peer_source: "user_list",
        basis: "blend",
        peers: [{ name: "Acme" }, { name: "Beta" }, emptyRow("peer_names")],
        precedents: [],
      }),
    ).toBe(
      "Peer source: I'll name the peers, 2 peers · valuation basis: Blend (peers and precedents), no precedents",
    );
    expect(valuationSummary({ ...blank, peer_source: "none", basis: "legacy" })).toBe(
      "Peer source: No peers · valuation basis: legacy",
    );
  });

  it("says only the options of the modules the run includes", () => {
    const form = { cp3_mode: "clo_screening", cp6_deep_debate: true };
    expect(moduleOptionsSummary(form, { cp3: true, cp6: true })).toBe(
      "Relative value mode: CLO Screening · Deep Debate on",
    );
    expect(
      moduleOptionsSummary({ ...form, cp6_deep_debate: false }, { cp3: false, cp6: true }),
    ).toBe("Deep Debate off");
    expect(moduleOptionsSummary({ ...form, cp3_mode: "" }, { cp3: true, cp6: false })).toBe(
      "Relative value mode: Let the module decide (default)",
    );
  });

  it("names the pinned modules among those the run includes", () => {
    const form = readAssumptions({});
    expect(assumptionsSummary(form, ["CP-1", "CP-6"])).toBe(
      "No module in this run takes a pinned value",
    );
    expect(assumptionsSummary(form, ["CP-2A", "CP-2D"])).toBe("None pinned");
    const [downside, liquidity, rates] = PINS;
    if (!downside || !liquidity || !rates) throw new Error("PINS changed");
    const pinned = {
      ...form,
      cp2a: blankPin(downside),
      cp2d: blankPin(liquidity),
      cp2e: blankPin(rates),
    };
    expect(assumptionsSummary(pinned, ["CP-2A", "CP-2D"])).toBe("2 pinned: Downside, Liquidity");
  });
});

describe("the model and modules", () => {
  const view = {
    copilotModels: undefined,
    model: "gpt",
    effort: "balanced",
    turns: "32",
    requested: ["CP-0", "CP-1", "CP-MODEL", "CP-2"],
    modules: [] as string[],
  };

  it("offers the seat's models and efforts, and the effort the picker shows", () => {
    expect(modelChoices(view)).toEqual({
      efforts: ["fast", "balanced", "high"],
      models: { gpt: "GPT Sol", claude: "Claude Opus" },
      effortChoices: { fast: "Fast", balanced: "Balanced", high: "High" },
      effort: "balanced",
    });
    const luna = modelChoices({ ...view, copilotModels: { luna: ["xhigh"] }, model: "luna" });
    expect(luna.models).toEqual({ gpt: "GPT Sol", claude: "Claude Opus", luna: "GPT-6 Luna" });
    expect(luna.effort).toBe("xhigh");
    const none = modelChoices({ ...view, copilotModels: {} });
    expect(none.efforts).toEqual([]);
    expect(none.effortChoices).toEqual({ none: "No verified effort available" });
    expect(none.effort).toBe("none");
  });

  it("says the model, effort, turns and how many drawn modules are requested", () => {
    expect(modelSummary(view)).toBe("GPT Sol · Balanced · 32 turns per module · all 3 modules");
    expect(modelSummary({ ...view, modules: ["CP-0", "CP-2", "CP-MODEL"] })).toBe(
      "GPT Sol · Balanced · 32 turns per module · 2 of 3 modules",
    );
    expect(
      modelSummary({ ...view, model: "claude", effort: "xhigh", turns: " ", copilotModels: {} }),
    ).toBe("Claude Opus · No verified effort available · turns not given · all 3 modules");
  });
});
