import { FIGURES, group, sendableRows, text, type Row, type RowField } from "./rows";

type Choices = readonly (readonly [value: string, label: string])[];

const PEER_SOURCES: Choices = [
  ["cp_dr_public", "Research finds public peers (default)"],
  ["user_list", "I'll name the peers"],
  ["user_comps", "I'll give peer figures"],
  ["none", "No peers"],
];

const BASES: Choices = [
  ["auto", "Automatic"],
  ["public_comps", "Public comps"],
  ["precedents", "Precedents"],
  ["blend", "Blend (peers and precedents)"],
  ["issuer_trading", "Issuer's own trading multiple"],
  ["user_multiple", "My own multiple"],
];

const CP3_MODES: Choices = [
  ["", "Let the module decide (default)"],
  ["clo_screening", "CLO Screening"],
  ["single_name_rv", "Single-Name RV"],
  ["capital_structure_rv", "Capital-Structure RV"],
  ["watchlist_monitoring", "Watchlist Monitoring"],
];

const EBITDA_BASES: Choices = [
  ["LTM", "LTM (last twelve months)"],
  ["NTM", "NTM (next twelve months)"],
];

export const VALUATION_TITLE = "Valuation and peers";
export const MODULE_OPTIONS_TITLE = "Module options";
export const PART_TITLES = {
  issuer_market: "Issuer market values",
  user_multiple: "Your own multiple",
};
export const DEEP_DEBATE = "Deep Debate";

export const PEER_SOURCE_FIELD = group("", [
  "peer_source",
  "Peer source",
  "select",
  undefined,
  "Where the peer multiples come from.",
  { options: PEER_SOURCES },
])[0] as RowField;

export const BASIS_FIELD = group("", [
  "basis",
  "Valuation basis",
  "select",
  undefined,
  "Which multiple the valuation uses. Automatic takes the peer median, else the precedent median.",
  { options: BASES },
])[0] as RowField;

export const CP3_FIELD = group("", [
  "cp3_mode",
  "Relative value mode",
  "select",
  undefined,
  "Used by Security selection. Left to the module unless you choose one.",
  { options: CP3_MODES },
])[0] as RowField;

export const MARKET_FIELDS: RowField[] = group(
  "",
  [
    "market_cap_m",
    "Market cap (m)",
    "number",
    "3100",
    `${FIGURES}. Give this with net debt, or give EV.`,
  ],
  ["net_debt_m", "Net debt (m)", "number", "1900", `${FIGURES}. May be negative.`],
  ["ev_m", "Enterprise value (m)", "number", "5000", `${FIGURES}. Above zero.`],
  [
    "ebitda_basis",
    "EBITDA basis",
    "select",
    undefined,
    "LTM is the last twelve months; NTM the next twelve.",
    { options: EBITDA_BASES },
  ],
  ["as_of", "Market data as-of", "date", undefined, "Date of the market data; not after the run."],
  ["source", "Market data source", "text", "Exchange close", "Where the market data came from."],
);

export const MULTIPLE_FIELDS: RowField[] = group(
  "",
  ["value", "Multiple (x)", "number", "8.5", "Times EBITDA. Above 0 and at most 99.99."],
  [
    "basis",
    "Multiple basis",
    "select",
    undefined,
    "Whether it is applied to LTM or NTM EBITDA.",
    { options: EBITDA_BASES },
  ],
  [
    "rationale",
    "Rationale",
    "text",
    "Sector median less a size discount",
    "Why you chose it. Required.",
  ],
);

type Part = Record<string, string>;
export type ValuationForm = {
  peer_source: string;
  basis: string;
  issuer_market: Part;
  peers: Row[];
  precedents: Row[];
  user_multiple: Part;
};
export type ModuleOptionsForm = { cp3_mode: string; cp6_deep_debate: boolean };

const BLANK_MARKET: Part = {
  market_cap_m: "",
  net_debt_m: "",
  ev_m: "",
  ebitda_basis: "LTM",
  as_of: "",
  source: "",
};
const BLANK_MULTIPLE: Part = { value: "", basis: "LTM", rationale: "" };

function record(raw: unknown): Row {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) ? (raw as Row) : {};
}

function rowsOf(raw: unknown): Row[] {
  return Array.isArray(raw) ? raw.map(record) : [];
}

function part(raw: unknown, blank: Part): Part {
  const given = record(raw);
  return Object.fromEntries(
    Object.entries(blank).map(([key, base]) => [key, text(given, key) || base]),
  );
}

/** The loaded valuation as form values; a missing part reads as the service's default. */
export function readValuation(raw: unknown): ValuationForm {
  const given = record(raw);
  return {
    peer_source: text(given, "peer_source") || "cp_dr_public",
    basis: text(given, "basis") || "auto",
    issuer_market: part(given.issuer_market, BLANK_MARKET),
    peers: rowsOf(given.peers),
    precedents: rowsOf(given.precedents),
    user_multiple: part(given.user_multiple, BLANK_MULTIPLE),
  };
}

export function readModuleOptions(raw: unknown): ModuleOptionsForm {
  const given = record(raw);
  return { cp3_mode: text(given, "cp3_mode"), cp6_deep_debate: given.cp6_deep_debate === true };
}

function trimmed(values: Part): Part {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
}

/** Peers shown for the chosen source: names only for a list, every figure for comps. */
export function peerKind(source: string) {
  return source === "user_list" ? "peer_names" : "peers";
}

export const showsPeers = (source: string) => source === "user_list" || source === "user_comps";
export const showsPrecedents = (basis: string) => basis === "precedents" || basis === "blend";

/** What is sent: every part the chosen options do not use goes blank, as the service requires. */
export function sendableValuation(form: ValuationForm) {
  const { peer_source: source, basis } = form;
  const peers = showsPeers(source)
    ? form.peers.map((row) =>
        source === "user_list" ? { ...row, ev_m: "", ebitda_m: "", as_of: "", source: "" } : row,
      )
    : [];
  return {
    peer_source: source,
    basis,
    issuer_market: basis === "issuer_trading" ? trimmed(form.issuer_market) : BLANK_MARKET,
    peers: sendableRows("peers", peers, true),
    precedents: showsPrecedents(basis) ? sendableRows("precedents", form.precedents, true) : [],
    user_multiple: basis === "user_multiple" ? trimmed(form.user_multiple) : BLANK_MULTIPLE,
  };
}

/** A choice for a module the pathway does not run is not sent. */
export function sendableModuleOptions(
  form: ModuleOptionsForm,
  runs: { cp3: boolean; cp6: boolean },
) {
  return {
    cp3_mode: runs.cp3 ? form.cp3_mode : "",
    cp6_deep_debate: runs.cp6 && form.cp6_deep_debate,
  };
}
