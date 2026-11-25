/**
 * The synthetic service's answers the request goldens drive the Start run page with: its run
 * options, its reading of the Northbridge files and a summary with every kind of limit. Shared by
 * `requests.golden.test.tsx` and `requests.golden.paths.test.tsx`; changing a value here changes
 * what the page is asked to send, so the golden files would no longer match.
 */
/** The synthetic service's own run options (proof.serve, 2026-11-24). */
export const TEMPLATE = {
  copilot_models: {
    gpt: ["fast", "balanced", "high"],
    claude: ["fast", "balanced", "high"],
    luna: ["xhigh"],
  },
  schema: "context/1",
  run: {
    run_type: "research",
    pathway: "credit_snapshot",
    case_kind: "synthetic",
    as_of: "2026-10-31",
    current_period: "",
    prior_period: "",
    reporting_currency: "USD",
  },
  identity: {
    issuer_name: "",
    issuer_id: "",
    borrower_name: "",
    parent_name: "",
    guarantors: [],
    aliases: [],
    listed_equity: false,
    ticker: "",
    sector: "",
    country: "",
    sponsor: "",
  },
  deal_terms: [],
  quotes: [],
  ratings: [],
  valuation: {
    peer_source: "cp_dr_public",
    basis: "auto",
    issuer_market: {
      market_cap_m: "",
      net_debt_m: "",
      ev_m: "",
      ebitda_basis: "LTM",
      as_of: "",
      source: "",
    },
    peers: [],
    precedents: [],
    user_multiple: { value: "", basis: "LTM", rationale: "" },
  },
  assumptions: { cp2a: null, cp2d: null, cp2e: null, cp3c: null, cp3d: null, cp4c: null },
  attachments: {
    portfolio_workbook: false,
    prior_case: false,
    management_bridge: false,
    legal_documents: "executed",
  },
  research_questions: [],
  submission_caps_usd: {
    lite_credit_assessment: "20",
    credit_snapshot: "30",
    deep_credit_assessment: "50",
    earnings_update: "20",
    relative_value: "20",
    covenant_refinancing: "20",
    distressed_restructuring: "20",
    portfolio_decision: "20",
    short_snapshot: "20",
  },
};

export const FILING = new File(["Northbridge annual filing"], "northbridge-filing.txt", {
  type: "text/plain",
});
export const WORKBOOK = new File(["workbook bytes"], "northbridge-portfolio.xlsx", {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});
export const AGREEMENT = new File(["Credit Agreement"], "northbridge-credit-agreement.txt", {
  type: "text/plain",
});
export const EXTRA = new File(["a note"], "analyst-note.md", { type: "text/markdown" });
export const FILES = [FILING, WORKBOOK, AGREEMENT, EXTRA];

/** The synthetic service's reading of the three Northbridge files (proof.serve, 2026-11-24). */
export const DOCUMENTS = [
  {
    source: "northbridge-credit-agreement.txt",
    kind: "credit_agreement",
    signal: "found 'Credit Agreement' on page 1",
    executed: true,
    period_end: null,
  },
  {
    source: "northbridge-filing.txt",
    kind: "unrecognised",
    signal: "",
    executed: null,
    period_end: null,
  },
  {
    source: "northbridge-portfolio.xlsx",
    kind: "unrecognised",
    signal: "",
    executed: null,
    period_end: null,
  },
];

/** Its readiness items for that run, plus a refusal with a consequence, so every kind is decided. */
export const ITEMS = [
  {
    id: "run:run-financials-management-claims",
    scope: "run",
    outcome: "check",
    reason:
      "No filed financial report is recognised among the files, so financials are management claims, not filed statements.",
    fix: "Add the filed annual or quarterly report.",
    counted: true,
    inherited_from: [],
  },
  {
    id: "CP-3:cp3-no-quotes-no-talk",
    scope: "CP-3",
    outcome: "gap",
    reason: "No quotes and no price talk were entered, and no quotes file is recognised.",
    fix: "Add observed quotes under Observed quotes, or a quotes file.",
    counted: true,
    inherited_from: [],
  },
  {
    id: "CP-4:cp4-no-agreement",
    scope: "CP-4",
    outcome: "will_refuse",
    reason: "No executed agreement is among the files.",
    fix: "Add the executed credit agreement.",
    counted: true,
    inherited_from: [],
  },
  {
    id: "CP-4C:cp4c-blocked",
    scope: "CP-4C",
    outcome: "will_refuse",
    reason: "Legal & covenants will refuse, so this module has no legal input.",
    counted: true,
    inherited_from: ["CP-4"],
  },
  {
    id: "run:changes-first",
    scope: "run",
    outcome: "information",
    reason: "This is the first run of this pathway, so nothing is compared.",
    counted: false,
    inherited_from: [],
  },
];

export function summaryFor(cap: string, modules: readonly string[]) {
  return {
    digest: `digest-${cap}`,
    cap,
    error: "",
    documents: DOCUMENTS,
    ignored: [],
    modules,
    items: ITEMS,
    omitted: [],
    omitted_titles: [],
    changes: "first run",
    lookup: ["Lookup:   off: synthetic case (default)"],
    web_lookup: false,
    web_search: false,
    model: "gpt",
    effort: "balanced",
    copilot_verified: true,
    prior: null,
  };
}
