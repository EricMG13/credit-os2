export type Row = Record<string, unknown>;
export type RowKind =
  | "deal_terms"
  | "quotes"
  | "ratings"
  | "research_questions"
  | "peer_names"
  | "peers"
  | "precedents"
  | "scenarios";
/**
 * The row sections the review lists under Context details, in order. The More context step draws
 * research questions under For the research and the other three under Ratings, quotes and
 * facilities.
 */
export const CONTEXT_ROW_KINDS = ["deal_terms", "quotes", "ratings", "research_questions"] as const;
export type RowField = {
  key: string;
  label: string;
  kind: "text" | "number" | "date" | "select";
  hint?: string;
  placeholder?: string;
  options?: readonly (readonly [value: string, label: string])[];
  required?: boolean;
  primaryOnly?: boolean;
  group?: string;
};

type RowSpec = {
  title: string;
  section: string;
  add: string;
  /** What the maximum counts, for the sentence beside a disabled Add button. */
  plural: string;
  max: number;
  fields: readonly RowField[];
  summary: (row: Row) => string;
};

const same = (list: string) => list.split(",").map((name) => [name, name] as const);

const INSTRUMENTS = same(
  "Term loan B,Term loan A,Revolver,Senior secured notes,Senior unsecured notes,Other",
);

const QUOTE_KINDS = Object.entries({ observed: "Observed", indicative_talk: "Indicative talk" });

const SCOPES = Object.entries({ issuer: "Issuer", facility: "Facility" });

const AGENCIES = same("S&P,Moody's,Fitch,Other");

const OUTLOOKS = same("Positive,Stable,Negative,Developing,Watch");

export function text(row: Row, key: string) {
  const value = row[key];
  if (typeof value === "string") return value;
  return typeof value === "number" ? String(value) : "";
}

function joined(parts: readonly string[]) {
  return parts.filter(Boolean).join(" · ");
}

type FieldDef = readonly [
  ...[key: string, label: string, kind: RowField["kind"]],
  ...[
    placeholder?: string,
    hint?: string,
    extra?: Pick<RowField, "options" | "primaryOnly" | "required">,
  ],
];

/** Expands field tuples into fields of one group ("" for none); a placeholder is an example. */
export function group(name: string, ...defs: FieldDef[]): RowField[] {
  return defs.map(([key, label, kind, placeholder, hint, extra]) => {
    const example = placeholder && `e.g. ${placeholder}`;
    return { key, label, kind, placeholder: example, hint, ...extra, group: name || undefined };
  });
}

const NEW_ISSUE = { primaryOnly: true } as const;
// Required in the static form (docs/templates/context-form.html QUOTE_SPEC, RATING_SPEC, rows-q).
const REQUIRED = { required: true } as const;

const PEER_NAME = [
  "name",
  "Name",
  "text",
  "Harbour Industrial",
  "The peer company's name.",
] as const;
const PEER_TICKER = ["ticker", "Ticker", "text", "HBI", "Its exchange ticker."] as const;
export const FIGURES = "Millions of the currency the issuer's statements are printed in";
const peerSummary = (row: Row) => joined([text(row, "name") || "New peer", text(row, "ticker")]);

const VALUATION_SPECS: Pick<Record<RowKind, RowSpec>, "peer_names" | "peers" | "precedents"> = {
  peer_names: {
    title: "Peer",
    section: "Peers",
    add: "Add peer",
    plural: "peers",
    max: 30,
    fields: group("", PEER_NAME, PEER_TICKER),
    summary: peerSummary,
  },
  peers: {
    title: "Peer",
    section: "Peers",
    add: "Add peer",
    plural: "peers",
    max: 30,
    fields: group(
      "",
      PEER_NAME,
      PEER_TICKER,
      ["ev_m", "EV (m)", "number", "4200", `${FIGURES}. Zero or more.`],
      ["ebitda_m", "EBITDA (m)", "number", "520", `${FIGURES}. Above zero.`],
      ["as_of", "As-of", "date", undefined, "Date of the figures; not after the run as-of date."],
      ["source", "Source", "text", "Company filings", "Where the figures came from."],
    ),
    summary: peerSummary,
  },
  precedents: {
    title: "Precedent",
    section: "Precedents",
    add: "Add precedent",
    plural: "precedents",
    max: 30,
    fields: group(
      "",
      ["target", "Target", "text", "Northgate Tools", "The company that was bought."],
      ["acquirer", "Acquirer", "text", "Orion Capital", "Who bought it. Optional."],
      ["date", "Date", "date", undefined, "Date of the deal; not after the run as-of date."],
      ["ev_m", "EV (m)", "number", "2400", `${FIGURES}. Zero or more.`],
      ["ebitda_m", "EBITDA (m)", "number", "300", `${FIGURES}. Above zero.`],
      ["source", "Source", "text", "Press release", "Where the deal figures came from."],
    ),
    summary: (row) => joined([text(row, "target") || "New precedent", text(row, "date")]),
  },
};

const SCENARIO_SPEC: RowSpec = {
  title: "Scenario",
  section: "Downside scenarios",
  add: "Add scenario",
  plural: "scenarios",
  max: 4,
  fields: group(
    "",
    [
      "ebitda_decline_pct",
      "EBITDA decline (%)",
      "number",
      "20",
      "Percent, 0 to 100, at most 2 decimal places.",
    ],
    [
      "interest_increase_pct",
      "Interest increase (%)",
      "number",
      "15",
      "Percent, 0 to 100, at most 2 decimal places.",
    ],
  ),
  summary: (row) =>
    joined([
      text(row, "ebitda_decline_pct") && `EBITDA down ${text(row, "ebitda_decline_pct")}%`,
      text(row, "interest_increase_pct") && `interest up ${text(row, "interest_increase_pct")}%`,
    ]) || "New scenario",
};

export const ROW_SPECS: Record<RowKind, RowSpec> = {
  deal_terms: {
    title: "Facility",
    section: "Facilities and deal terms",
    add: "Add facility",
    plural: "facilities",
    max: 20,
    fields: [
      ...group(
        "Identity",
        [
          "facility_id",
          "Facility ID",
          "text",
          "tlb-2031",
          "Your short label. Quotes must use the same ID, and relative value matches it to the facility schedule in the filings.",
        ],
        ["instrument", "Instrument", "select", undefined, undefined, { options: INSTRUMENTS }],
        ["currency", "Currency", "text", "USD", "Three uppercase letters."],
        ["size_m", "Size (m)", "number", "1250", "Millions of the stated currency."],
        ["tenor_years", "Tenor (years)", "number", "7", "Years.", NEW_ISSUE],
        ["maturity", "Maturity", "date", undefined, "Optional."],
      ),
      ...group(
        "Pricing talk",
        [
          "talk_spread_bps_low",
          "Talk spread low (bps)",
          "number",
          "325",
          "Basis points over the reference rate.",
          NEW_ISSUE,
        ],
        [
          "talk_spread_bps_high",
          "Talk spread high (bps)",
          "number",
          "350",
          "Give both ends: a one-sided range is not used.",
          NEW_ISSUE,
        ],
        ["talk_oid_low", "Talk OID low", "number", "99.0", "Price per 100.", NEW_ISSUE],
        ["talk_oid_high", "Talk OID high", "number", "99.5", "Price per 100.", NEW_ISSUE],
        ["floor_pct", "Floor (%)", "number", "0.50", "Percent."],
        ["coupon_pct", "Coupon (%)", "number", "8.25", "Percent. Optional."],
        ["margin_bps", "Margin (bps)", "number", "350", "Basis points. Optional."],
      ),
      ...group(
        "Terms",
        ["call_protection", "Call protection", "text", "101 soft call, 6 months", "Plain text."],
        ["use_of_proceeds", "Use of proceeds", "text", "Refinance 2027 term loan", "Plain text."],
      ),
      ...group(
        "Source",
        ["as_of", "As-of", "date", undefined, "Date of the terms; not after the run as-of date."],
        ["provider", "Provider", "text", "Lead arranger", "Who gave the terms."],
      ),
    ],
    summary: (row) =>
      joined([
        text(row, "facility_id") || "New facility",
        text(row, "instrument"),
        text(row, "currency") && text(row, "size_m")
          ? `${text(row, "currency")} ${text(row, "size_m")}m`
          : "",
      ]),
  },
  quotes: {
    title: "Quote",
    section: "Observed quotes",
    add: "Add quote",
    plural: "quotes",
    max: 40,
    fields: group(
      "",
      ["facility_id", "Facility ID", "text", "tlb-2031", "The same ID as the facility."],
      [
        "kind",
        "Kind",
        "select",
        undefined,
        "Observed is a price seen in the market. Indicative talk is price talk, not a trade; it caps confidence below High.",
        { options: QUOTE_KINDS },
      ],
      ["bid", "Bid", "number", "98.50", "Price per 100."],
      [
        "ask",
        "Ask",
        "number",
        "99.00",
        "Price per 100; not below the bid. Give bid and ask in the same row.",
      ],
      ["price", "Price", "number", "98.75", "Price per 100."],
      ["yield_pct", "Yield (%)", "number", "8.25", "Percent."],
      ["spread_bps", "Spread (bps)", "number", "340", "Basis points."],
      [
        "as_of",
        "As-of",
        "date",
        undefined,
        "Within 30 days of the run as-of date, or it is stale and caps confidence.",
        REQUIRED,
      ],
      ["provider", "Provider", "text", "Dealer run", "Who gave the quote.", REQUIRED],
    ),
    summary: (row) =>
      joined([
        text(row, "facility_id") || "New quote",
        QUOTE_KINDS.find(([value]) => value === text(row, "kind"))?.[1] ?? text(row, "kind"),
        text(row, "as_of"),
      ]),
  },
  ratings: {
    title: "Rating",
    section: "Ratings",
    add: "Add rating",
    plural: "ratings",
    max: 20,
    fields: group(
      "",
      [
        "agency",
        "Agency",
        "select",
        undefined,
        "Ratings & triggers reads S&P, Moody's and Fitch, one row per agency.",
        { options: AGENCIES, required: true },
      ],
      [
        "scope",
        "Scope",
        "select",
        undefined,
        "Issuer applies to the issuer. Facility applies to one facility.",
        { options: SCOPES },
      ],
      [
        "rating",
        "Rating",
        "text",
        "B+ or B1",
        "As the agency writes it, on its own scale (B+ for S&P and Fitch, B1 for Moody's), or Withdrawn or Not rated.",
        REQUIRED,
      ],
      ["outlook", "Outlook", "select", undefined, undefined, { options: OUTLOOKS }],
      ["as_of", "As-of", "date", undefined, "Date of the rating."],
    ),
    summary: (row) =>
      joined([text(row, "agency") || "New rating", text(row, "rating"), text(row, "outlook")]),
  },
  research_questions: {
    title: "Question",
    section: "Research questions",
    add: "Add research question",
    plural: "research questions",
    max: 10,
    fields: group(
      "",
      [
        "text",
        "Question",
        "text",
        "How much of 2025 adjusted EBITDA is run-rate cost savings?",
        "One question, plain text, no | character.",
        REQUIRED,
      ],
      [
        "focus_module",
        "Focus module",
        "select",
        undefined,
        "Peer benchmark or Fundamental credit receive the answer; any other choice, or none, sends it to both.",
      ],
    ),
    summary: (row) => text(row, "text") || "New question",
  },
  ...VALUATION_SPECS,
  scenarios: SCENARIO_SPEC,
};

const DEFAULTS: Partial<Record<RowKind, Row>> = {
  quotes: { kind: "observed" },
  ratings: { scope: "issuer" },
};

export function emptyRow(kind: RowKind): Row {
  return {
    ...Object.fromEntries(ROW_SPECS[kind].fields.map(({ key }) => [key, ""])),
    ...DEFAULTS[kind],
  };
}

/**
 * The edited rows as the service reads them: every key of the kind's model as a trimmed string
 * ("" when blank, and for new-issue-only fields unless the run is a new issue), keys the page
 * does not know kept, and a row nothing was typed into left out.
 */
export function sendableRows(kind: RowKind, rows: readonly Row[], primary: boolean): Row[] {
  const untouched = emptyRow(kind);
  return rows
    .map((row) => {
      const sent = { ...row };
      for (const { key, primaryOnly } of ROW_SPECS[kind].fields)
        sent[key] = primaryOnly && !primary ? "" : text(row, key).trim();
      return sent;
    })
    .filter((row) => Object.entries(row).some(([key, value]) => value !== untouched[key]));
}
