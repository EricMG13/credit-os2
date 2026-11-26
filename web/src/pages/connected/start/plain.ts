import {
  issuerSlug,
  moduleName,
  serviceText,
  type DocumentRecord,
  type ReferencePortfolio,
} from "../api";
import { ASSUMPTIONS_TITLE, PINS } from "./assumptions";
import { ROW_SPECS, type RowField, type RowKind } from "./rows";
import {
  BASIS_FIELD,
  CP3_FIELD,
  DEEP_DEBATE,
  MARKET_FIELDS,
  MODULE_OPTIONS_TITLE,
  MULTIPLE_FIELDS,
  PART_TITLES,
  PEER_SOURCE_FIELD,
  VALUATION_TITLE,
} from "./valuation";

export const PURPOSES = {
  research: "No market view (research)",
  primary: "New issue (primary)",
  secondary: "Trading (secondary)",
  earnings: "Earnings update",
};
export const LEVELS = { basic: "Basic", advanced: "Advanced" };
/** The Purpose step's title and the labels of its three run boxes. */
export const PURPOSE_STEP = "Purpose";
export const PATHWAY_LABEL = "Pathway";
export const RUN_PURPOSE_LABEL = "Market view";
export const CASE_KIND_LABEL = "Case kind";
export const CASE_KINDS = {
  public: "Public filer",
  private: "Private",
  synthetic: "Synthetic test case",
};
export const MODELS = { gpt: "GPT Sol", claude: "Claude Opus", luna: "GPT-6 Luna" };
export const EFFORTS = { fast: "Fast", balanced: "Balanced", high: "High", xhigh: "Extra high" };
const LEGACY_COPILOT_MODELS = {
  gpt: ["fast", "balanced", "high"],
  claude: ["fast", "balanced", "high"],
} as const;
const COPILOT_MODEL_EFFORTS: Readonly<Record<string, readonly string[]>> = {
  gpt: ["fast", "balanced", "high"],
  claude: ["fast", "balanced", "high"],
  luna: ["xhigh"],
};

/** Missing capability metadata is a legacy service; an explicit empty map stays unverified. */
export function copilotEfforts(
  models: Record<string, string[]> | undefined,
  model: string,
): string[] {
  const available: Readonly<Record<string, readonly string[]>> = models ?? LEGACY_COPILOT_MODELS;
  const supported = COPILOT_MODEL_EFFORTS[model] ?? [];
  return supported.filter((effort) => available[model]?.includes(effort));
}

export function copilotPairVerified(
  models: Record<string, string[]> | undefined,
  model: string,
  effort: string,
): boolean {
  return copilotEfforts(models, model).includes(effort);
}
/** Labels of boxes the screen draws in its own markup, read by the screen and by the review. */
export const ISSUER_ID = "Issuer ID";
export const ISSUE_CLASSIFICATION = "Issue classification";
/** The Issue classification options; the screen adds its own blank "Choose classification". */
export const ISSUE_CLASSES = { investment_grade: "Investment grade", high_yield: "High yield" };
export const LEGAL_DOCUMENTS = "Legal documents";
export const LEGAL_CHOICES = {
  none: "No agreement",
  executed: "Executed agreement",
  draft: "Draft agreement",
};
/** The file boxes beside the agreement, by the key the run's attachments carry. */
export const ATTACHMENTS = {
  management_bridge: "Management EBITDA bridge",
  portfolio_workbook: "Portfolio workbook",
  prior_case: "Prior decision record",
};
/**
 * The comparison portfolio: a reference portfolio the analyst supplies for one run, beside the
 * standing three. Not the Portfolio workbook above, which is a document the run reads.
 */
export const COMPARISON_PORTFOLIO = "Comparison portfolio";
export const COMPARISON_TITLE = "Compare against another portfolio (optional)";
export const COMPARISON_EXPLANATION =
  "The report compares this issuer with three standing portfolios: a CLO portfolio, a loan index and a high yield index. To compare it with a different portfolio as well, add that portfolio's holdings file here and give it a name. Accepted: a holdings file with its limits and mandate files (CSV or Excel), or an index holdings workbook. It is used for this run only.";
export const COMPARISON_NAME = "Portfolio name";
export const COMPARISON_HOLDS = "What it holds";
export const COMPARISON_HOLDS_CHOICES = { "": "Not stated", loans: "Loans", bonds: "Bonds" };
export const COMPARISON_NEEDS_NAME = "Give the comparison portfolio a name.";

const counted = (count: number, one: string, many: string) =>
  `${String(count)} ${count === 1 ? one : many}`;

const comparisonDate = (portfolio: ReferencePortfolio) =>
  portfolio.as_of ? `As of ${portfolio.as_of}.` : "The file does not state an as-of date.";

/** What the service read from a comparison portfolio's files, one sentence per line. */
export function comparisonFacts(portfolio: ReferencePortfolio): string[] {
  const priced = ["Bid", "Ask", "Mid price", "Market value"].some((name) =>
    portfolio.found.includes(name),
  );
  return [
    comparisonDate(portfolio),
    `${counted(portfolio.positions, "position", "positions")}.`,
    portfolio.unpriced > 0
      ? `${counted(portfolio.unpriced, "position has", "positions have")} no price.`
      : priced
        ? "Every position has a price."
        : "The file has no price or market value column.",
    portfolio.limits > 0
      ? `${counted(portfolio.limits, "limit", "limits")} read.`
      : "No limits were read.",
    ...(portfolio.not_found.length
      ? [`Not found in the file: ${portfolio.not_found.join(", ")}.`]
      : []),
  ];
}

/** The comparison portfolio on the review, in one line: its name, its date and its size. */
export function comparisonLine(portfolio: ReferencePortfolio) {
  const dated = portfolio.as_of ? `as of ${portfolio.as_of}` : "no as-of date stated";
  return `${portfolio.name} · ${dated} · ${counted(portfolio.positions, "position", "positions")}`;
}

export const LISTED_EQUITY = "Listed equity";
export const TICKER = "Ticker";
export const CONTEXT_DETAILS = "Context details";
/** The Focus module choice that names no module. */
export const ANY_FOCUS = "Any";

/** An option's label for a stored value; a value the screen does not offer has none, so the fact that would show it is left out. */
export function choiceLabel(choices: Readonly<Record<string, string>>, value: string) {
  return Object.hasOwn(choices, value) ? choices[value] : undefined;
}

/** The stored file name: the reader's own name for it, without the ingest suffix. */
export function storedName({ source }: DocumentRecord) {
  // Source of truth: `cpos_launch.CONVERTED_SUFFIXES`; change the two together.
  return source.replace(/(\.(?:html?|docx))\.jsonl$/i, "$1");
}

/**
 * One key for a file name, folding Unicode form and case as the service does.
 * Source of truth: `submissions._folded` (NFC, then Python `str.casefold`); JS has no casefold, so
 * upper then lower case gives its full folds for these names ("ß" and "ss" share a key).
 */
export function nameKey(name: string) {
  // Lower first (capital "ẞ" folds to "ss" only through "ß"), and leave "ı" alone: upper case would merge it with "i".
  return name
    .normalize("NFC")
    .replace(/[^ı]+/gu, (part) => part.toLowerCase().toUpperCase().toLowerCase());
}

export function documentDescription(doc: DocumentRecord) {
  return [
    doc.kind.replaceAll("_", " "),
    doc.period_end && `period ends ${doc.period_end}`,
    doc.executed === true ? "executed" : doc.executed === false ? "draft" : "",
    doc.signal,
  ]
    .filter(Boolean)
    .join(" · ");
}

const LOOKUP_LABEL = /^\s*(?:Web lookup|Lookup|SEC):\s+/;
const ON_OFF = (word: string) => (word === "on" ? "On" : "Off");

/**
 * A lookup line the launcher writes (`_lookup_lines`) as a sentence: no label, `on:`/`off:` word,
 * `(default)` or `--web-lookup` flag. A line it does not recognise is returned without its label.
 */
export function lookupSentence(line: string) {
  const text = line.replace(LOOKUP_LABEL, "");
  const [body = "", hosts] = text.split("; case hosts: ");
  const rest = hosts ? ` Case hosts: ${hosts}.` : "";
  const recorded = /^(on|off) \(as recorded when this run folder was started\)$/.exec(body);
  if (recorded)
    return `${ON_OFF(recorded[1] ?? "")}, as recorded when this run folder was started.${rest}`;
  const forced = /^(on|off) \(forced by --web-lookup (?:on|off)\)$/.exec(body);
  if (forced) return `${ON_OFF(forced[1] ?? "")}, because it was set that way for this run.${rest}`;
  const allowed =
    /^on: (\S+) may fetch allowlisted public pages and SEC EDGAR \((\S+) case default\)$/.exec(
      body,
    );
  if (allowed) {
    const [, module = "", kind = ""] = allowed;
    return serviceText(
      `On, because this is a ${kind} case: ${moduleName(module)} may fetch allowlisted public pages and SEC EDGAR.${rest}`,
    );
  }
  const off = /^off: (\S+) case \(default\)(?:; --web-lookup on forces it)?$/.exec(body);
  if (off) return `Off, because this is a ${off[1] ?? ""} case.${rest}`;
  const refused = /^sec\.gov lookups will be refused: \S+ is not set$/.exec(body);
  if (refused) return "SEC lookups will be refused because the contact string for them is not set.";
  const unlabelled = line.replace(/^\s*[A-Za-z]+:\s+/, "");
  return serviceText(unlabelled.replace(/;\s*--web-lookup on forces it\s*$/, ""));
}

/** The comparison caveat the service writes in the compared run's own bracket: ` (earlier format, earlier methods)`, or "". */
export function comparisonCaveat(changes: string) {
  const flags = /^[^(]*\([^;)]*; ([^)]*)\)/.exec(changes)?.[1];
  return flags ? ` (${flags})` : "";
}

const ISSUER_CASE = "Issuer and case date";
export const ISSUER_DETAILS = "Issuer details";

/** The Issuer details boxes: key, label, example. The screen draws them and `refusalLines` names them. */
export const ISSUER_TEXT_BOXES = [
  ["borrower_name", "Borrower (legal entity)", "Northbridge Holdings LLC"],
  ["parent_name", "Parent", "Northbridge Group plc"],
  ["sector", "Sector", "Industrials"],
  ["country", "Country", "United States"],
  ["sponsor", "Sponsor", "Harbour Peak Capital"],
] as const;
export const ISSUER_LIST_BOXES = [
  ["aliases", "Other names in the filings"],
  ["guarantors", "Guarantors"],
] as const;

/** Boxes that live in the screen's markup, not in a field definition: path, section, label. */
const PLAIN_BOXES: Readonly<Record<string, readonly [section: string, label: string]>> = {
  "run.as_of": [ISSUER_CASE, "As-of date"],
  "run.reporting_currency": [ISSUER_CASE, "Reporting currency"],
  "run.run_type": [PURPOSE_STEP, RUN_PURPOSE_LABEL],
  "run.case_kind": [PURPOSE_STEP, CASE_KIND_LABEL],
  "run.pathway": [PURPOSE_STEP, PATHWAY_LABEL],
  "run.cutoff": ["", "Research cutoff"],
  "run.current_period": ["", "Current period"],
  "run.prior_period": ["", "Prior period"],
  "identity.issuer_name": [ISSUER_CASE, "Issuer name"],
  "identity.issuer_id": [ISSUER_CASE, ISSUER_ID],
  "identity.issue_classification": [ISSUER_CASE, ISSUE_CLASSIFICATION],
  ...Object.fromEntries(
    [...ISSUER_TEXT_BOXES, ...ISSUER_LIST_BOXES].map(([key, title]) => [
      `identity.${key}`,
      [ISSUER_DETAILS, title],
    ]),
  ),
  "identity.ticker": [ISSUER_DETAILS, TICKER],
  "attachments.legal_documents": ["", LEGAL_DOCUMENTS],
  "module_options.cp6_deep_debate": [MODULE_OPTIONS_TITLE, DEEP_DEBATE],
};

/** The path's parts, and the box's definition when it has one (its options name raw values). */
type Resolved = { parts: string[]; field?: RowField };

const fieldOf = (fields: readonly RowField[], key: string | undefined) =>
  fields.find((item) => item.key === key);

/** `<Section> · <row or group> · <box>` parts for a context path, or null when the page has no such box. */
function pathParts(path: string): Resolved | null {
  if (!/^[A-Za-z_]\w*(?:\.\w+|\[\d+\])*$/.test(path)) return null;
  const [root = "", ...rest] = path.match(/\w+|\[\d+\]/g) ?? [];
  const index = (token: string | undefined) =>
    token?.startsWith("[") ? Number(token.slice(1, -1)) : undefined;
  const plain = PLAIN_BOXES[path];
  if (plain) return { parts: plain[0] ? [plain[0], plain[1]] : [plain[1]] };
  const item = /^identity\.(aliases|guarantors)\[(\d+)\]$/.exec(path);
  const list = ISSUER_LIST_BOXES.find(([key]) => key === item?.[1]);
  if (list && item?.[2])
    return { parts: [ISSUER_DETAILS, list[1], `entry ${String(Number(item[2]) + 1)}`] };
  if (root in ROW_SPECS && root !== "scenarios") return rowParts(root as RowKind, rest);
  if (root === "valuation") return valuationParts(rest, index);
  if (root === "assumptions") return assumptionParts(rest);
  if (root === "module_options" && rest[0] === "cp3_mode" && rest.length === 1)
    return { parts: [MODULE_OPTIONS_TITLE, CP3_FIELD.label], field: CP3_FIELD };
  return null;
}

/** Section, numbered row and box of a rows kind; `[]` rest names the whole section. */
function rowParts(
  kind: RowKind,
  rest: string[],
  section = ROW_SPECS[kind].section,
): Resolved | null {
  const spec = ROW_SPECS[kind];
  const [first, second, ...more] = rest;
  if (first === undefined) return { parts: [section] };
  if (!first.startsWith("[") || more.length) return null;
  const row = `${spec.title} ${String(Number(first.slice(1, -1)) + 1)}`;
  if (second === undefined) return { parts: [section, row] };
  const field = fieldOf(spec.fields, second);
  return field ? { parts: [section, row, field.label], field } : null;
}

function valuationParts(
  rest: string[],
  index: (token?: string) => number | undefined,
): Resolved | null {
  const [first, ...more] = rest;
  if (first === undefined) return { parts: [VALUATION_TITLE] };
  const top = [PEER_SOURCE_FIELD, BASIS_FIELD].find((item) => item.key === first);
  if (top) return more.length ? null : { parts: [VALUATION_TITLE, top.label], field: top };
  return valuationDetailParts(first, more, index);
}

function valuationDetailParts(
  first: string,
  more: string[],
  index: (token?: string) => number | undefined,
): Resolved | null {
  if (first === "peers" || first === "precedents") {
    const found = rowParts(first, more, ROW_SPECS[first].section);
    return found && { ...found, parts: [VALUATION_TITLE, ...found.parts] };
  }
  if (first === "issuer_market" || first === "user_multiple") {
    if (more.length > 1 || index(more[0]) !== undefined) return null;
    const field = fieldOf(first === "issuer_market" ? MARKET_FIELDS : MULTIPLE_FIELDS, more[0]);
    if (more.length && !field) return null;
    return {
      parts: [VALUATION_TITLE, PART_TITLES[first], ...(field ? [field.label] : [])],
      field,
    };
  }
  return null;
}

function assumptionParts(rest: string[]): Resolved | null {
  const [group, key, ...more] = rest;
  if (group === undefined) return { parts: [ASSUMPTIONS_TITLE] };
  const pin = PINS.find((item) => item.key === group);
  if (!pin) return null;
  const head = [ASSUMPTIONS_TITLE, moduleName(pin.module)];
  if (key === undefined) return { parts: head };
  if (key === "scenarios" && pin.key === "cp2a") {
    const found = rowParts("scenarios", more, ROW_SPECS.scenarios.section);
    return found && { ...found, parts: [...head, ...found.parts.slice(1)] };
  }
  const field = fieldOf(pin.fields, key);
  return field && !more.length ? { parts: [...head, field.label], field } : null;
}

/** Every box the screen draws, by its key: the label a message may name it by. */
const ALL_FIELDS: readonly RowField[] = [
  ...Object.values(ROW_SPECS).flatMap((spec) => spec.fields),
  ...PINS.flatMap((pin) => pin.fields),
  ...MARKET_FIELDS,
  ...MULTIPLE_FIELDS,
  PEER_SOURCE_FIELD,
  BASIS_FIELD,
  CP3_FIELD,
];
const KEY_LABELS = new Map<string, string>([
  ...Object.entries(PLAIN_BOXES).map(
    ([path, [, title]]) => [path.split(".").pop() ?? "", title] as const,
  ),
  ...[...ALL_FIELDS].reverse().map((item) => [item.key, item.label] as const),
]);
/** An option value with one label across every box that offers it; ambiguous values are left out. */
const OPTION_LABELS = (() => {
  const seen = new Map<string, string | null>();
  for (const item of ALL_FIELDS)
    for (const [value, title] of item.options ?? []) {
      if (!value) continue;
      seen.set(value, seen.has(value) && seen.get(value) !== title ? null : title);
    }
  return seen;
})();

const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The service's type messages in plain words; any other message is returned as it is. */
function typeMessage(message: string) {
  if (/^Field required\.?$/.test(message)) return "required.";
  if (/^Extra inputs are not permitted\.?$/.test(message))
    return "is not a value this form sends. Reload the page and try again.";
  if (/^Input should be '[^']*'(?:, '[^']*')*(?: or '[^']*')?\.?$/.test(message))
    return "choose one of the listed options.";
  if (message.startsWith("Input should be ")) return "is not in the expected form.";
  return message;
}

/**
 * A message's identifiers (`like_this`, `'like_this'`) and the problem box's own option values, as
 * whole words, in one pass: each becomes the label of the box or option it names, or `this value`
 * when the screen has none (`unknown` is set so the caller logs the raw problem).
 */
function plainTokens(message: string, field: RowField | undefined, unknown: { found: boolean }) {
  const own = new Map((field?.options ?? []).filter(([value]) => value));
  const words = [...own.keys()].map(escaped).join("|");
  const pattern = new RegExp(
    String.raw`"[^"]*"|'[a-z][a-z0-9_]*'|\b[a-z]+_[a-z0-9_]+\b` +
      (words ? `|(?<!\\w)(?:${words})(?!\\w)` : ""),
    "g",
  );
  return message.replace(pattern, (found) => {
    if (found.startsWith('"')) return found; // the analyst's own typed value
    const bare = found.replaceAll("'", "");
    const label = own.get(bare) ?? OPTION_LABELS.get(bare) ?? KEY_LABELS.get(bare);
    if (label) return label;
    unknown.found = true;
    return "this value";
  });
}

/** `peer_source is none` in a message becomes `Peer source is No peers`; other keys and values stay. */
function plainMessage(message: string) {
  return message.replace(
    /\b(peer_source|basis) is ([A-Za-z_]+)/g,
    (whole, key: string, value: string) => {
      const field = key === "basis" ? BASIS_FIELD : PEER_SOURCE_FIELD;
      const choice = field.options?.find(([option]) => option === value);
      return choice ? `${field.label} is ${choice[1]}` : whole;
    },
  );
}

const ROOTS =
  "run|identity|deal_terms|quotes|ratings|valuation|assumptions|attachments|research_questions|module_options|schema";
const PATH = String.raw`(?:\$|(?:${ROOTS})(?![\w]))(?:\.\w+|\[\d+\])*`;
const PROBLEM = new RegExp(`^(${PATH}): ([\\s\\S]*)$`);
const FORM_SENTENCE = "The form could not be read by the service. Reload the page and try again.";

const plainWords = (key: string) => {
  const spaced = key.replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** The leading parts the labels know for a path, then its unknown tail in plain words. */
function fallbackParts(path: string): Resolved {
  const tokens = [...path.matchAll(/\w+|\[\d+\]/g)];
  for (let known = tokens.length - 1; known >= 1; known--) {
    const last = tokens[known - 1];
    const found = last && pathParts(path.slice(0, last.index + last[0].length));
    if (found)
      return { parts: [...found.parts, ...tokens.slice(known).map(([token]) => tailWords(token))] };
  }
  return { parts: tokens.map(([token]) => tailWords(token)) };
}

const tailWords = (token: string) =>
  token.startsWith("[") ? `entry ${String(Number(token.slice(1, -1)) + 1)}` : plainWords(token);

const CODES = String.raw`(?:CP-[A-Z0-9]+(?: |(?=:)))+`;
const FLAGGED = new RegExp(`^--([a-z][a-z-]*)(?: (${CODES}|[^\\s:]+))?: ([\\s\\S]*)$`);
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** A refusal of a module flag (`--modules`, `--high-modules`): every code in it is a module id. */
const MODULE_FLAG = /^--(?:[a-z]+-)*modules(?![\w-])/;
/** Text of a module flag's refusal with each module id as its name, an unnamed one included. */
const moduleText = (text: string, pathway?: string | null) =>
  text.replace(/(?<![\w-])CP-[A-Z0-9]+(?![\w-])/g, (code) => moduleName(code, pathway));

/**
 * A launcher refusal (`--flag <arguments>: <message>`) without its command-line prefix, module codes
 * as names; "" when the text does not start with `--`. A prefix other than `--modules` is removed,
 * its explanation remains visible, and its raw text is retained in `console.warn`. Only a module
 * flag's refusal has its unnamed codes replaced; any other flag's values stay as written.
 */
function launcherLine(error: string, pathway?: string | null): string {
  if (!error.startsWith("--")) return "";
  const [, flag = "", args = "", message = ""] = FLAGGED.exec(error) ?? [];
  if (flag === "modules") {
    const codes = args
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((code) => moduleName(code, pathway));
    const body = moduleText(message, pathway);
    return codes.length
      ? `The modules chosen (${codes.join(", ")}): ${body}`
      : `Requested modules: ${body}`;
  }
  console.warn(`Launcher flag prefix removed; its explanation is shown to the analyst: ${error}`);
  const body = flag ? message : error.replace(/^--[a-z][a-z-]*\s*/, "");
  return capital(MODULE_FLAG.test(error) ? moduleText(body, pathway) : serviceText(body, pathway));
}

/**
 * A service refusal (`<path>: <message>` problems joined by "; ") as one line per problem in the
 * screen's own section and box labels, with no path, key or option value in it. Text that is not
 * in the service's refusal form is returned unchanged. A problem the labels cannot fully name is
 * still shown in plain words (a documented fail-open), and its raw text goes to `console.warn`.
 */
export function refusalLines(error: string, pathway?: string | null): string[] {
  return splitRefusal(error, pathway).map(({ line }) => withoutFlags(line));
}

/** The screen controls a refusal can be shown on: each carries `data-field` with this key. */
type ControlKey =
  | "issuer_name"
  | "cutoff"
  | "current_period"
  | "prior_period"
  | "legal_documents"
  | "deal_terms"
  | "quotes"
  | "ratings"
  | "research_questions"
  | "analyst_note"
  | "valuation"
  | "assumptions"
  | "module_options";

/** The control that sets a path: only these paths, and only where one control carries them. */
const CONTROL_ROOTS =
  /^(deal_terms|quotes|ratings|research_questions|valuation|assumptions|module_options)(?![\w])/;
const CONTROL_PATHS: Readonly<Record<string, ControlKey>> = {
  "identity.issuer_name": "issuer_name",
  "run.cutoff": "cutoff",
  "run.current_period": "current_period",
  "run.prior_period": "prior_period",
  "attachments.legal_documents": "legal_documents",
};

/** Whether the control that sets a path is drawn for a pathway that runs `requested`. */
function isDrawn(path: string, requested: readonly string[]) {
  const [root = "", part = ""] = path.split(".");
  if (root === "module_options") {
    const wanted = part.startsWith("cp3")
      ? ["CP-3"]
      : part.startsWith("cp6")
        ? ["CP-6"]
        : ["CP-3", "CP-6"];
    return wanted.some((code) => requested.includes(code));
  }
  if (root === "assumptions") {
    const pin = PINS.find((item) => item.key === part);
    return pin
      ? requested.includes(pin.module)
      : PINS.some((item) => requested.includes(item.module));
  }
  return true;
}

function controlOf(
  path: string,
  requested?: readonly string[],
  noteAt?: number,
): ControlKey | undefined {
  const row = /^research_questions\[(\d+)\]/.exec(path)?.[1];
  if (noteAt !== undefined && row !== undefined && Number(row) >= noteAt) return "analyst_note";
  const field = CONTROL_PATHS[path] ?? (CONTROL_ROOTS.exec(path)?.[1] as ControlKey | undefined);
  return field && (!requested || isDrawn(path, requested)) ? field : undefined;
}

/** One refusal problem: its line as `refusalLines` words it, and the control that sets its path. */
export type RefusalProblem = { line: string; field?: ControlKey };

/**
 * `refusalLines`, with the control (if the screen has one) that each problem is about. Given the
 * modules the pathway runs, a problem whose control is not drawn for them has no control. Given
 * `noteAt` (how many question rows were sent before the analyst's note, which is sent as the next
 * research question), a problem on a question from that index on is the note's: its control is
 * the note box and its line names the note, not a question row.
 */
export function refusalProblems(
  error: string,
  requested?: readonly string[],
  noteAt?: number,
): RefusalProblem[] {
  return splitRefusal(error).map(({ path, line, text }) => {
    const field = controlOf(path, requested, noteAt);
    const shown = field === "analyst_note" ? `${NOTE_LABEL}: ${text}` : line;
    return { line: withoutFlags(shown), ...(field ? { field } : {}) };
  });
}

/** The label of the analyst note box, which names its problems. */
const NOTE_LABEL = "Anything the analysis should know";

/** A command-line flag left in a line, outside double quotes, becomes `this setting` (logged raw). */
function withoutFlags(line: string) {
  const text = line
    .split(/("[^"]*")/)
    .map((part) =>
      part.startsWith('"') ? part : part.replace(/(?<![\w-])--[a-z][a-z-]*/g, "this setting"),
    )
    .join("");
  if (text !== line) console.warn(`Flag not shown to the analyst: ${line}`);
  return text;
}

/** The problems of a refusal, each with its path ("" when the problem has none). */
function splitRefusal(
  error: string,
  pathway?: string | null,
): { path: string; line: string; text: string }[] {
  const launcher = launcherLine(error, pathway);
  if (launcher) return [{ path: "", line: launcher, text: launcher }];
  if (!PROBLEM.test(error)) return [{ path: "", line: error, text: error }];
  return error.split(new RegExp(`; (?=${PATH}: )`)).map((problem) => {
    const [, path = "", message = ""] = PROBLEM.exec(problem) ?? [];
    if (path === "$" || path === "schema") {
      console.warn(`Refusal not shown to the analyst: ${problem}`);
      return { path: "", line: FORM_SENTENCE, text: FORM_SENTENCE };
    }
    const unknown = { found: false };
    const known = pathParts(path);
    unknown.found = !known;
    const found = known ?? fallbackParts(path);
    const text = plainTokens(plainMessage(typeMessage(message)), found.field, unknown);
    if (unknown.found) console.warn(`Refusal shown in plain words: ${problem}`);
    return { path, line: `${found.parts.join(" · ")}: ${text}`, text };
  });
}

/**
 * An issuer name reduced to the letters and digits that tell two issuers apart. The service
 * reduces a name the same way (`issuer_key` in `run_start/submissions.py`); the two are pinned by
 * the same literal cases: NFKD, lower case, then only Unicode letters and digits kept (marks go,
 * so "é" is "e"; "ø" and "ß" stay). Node and Python carry different Unicode versions, so about 37
 * recent characters are letters in one and not the other; no table hides that, and the service's
 * answer is the one that counts.
 */
export const issuerKey = (name: string) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

/** A short stable code from the whole name (FNV-1a), so a long name's cut ID can be told apart. */
function nameCode(name: string) {
  let hash = 0x811c9dc5;
  for (const char of issuerKey(name))
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * The Issuer ID for a typed name. `ownerName` is the issuer name of the existing run that already
 * holds the name's usual ID (undefined when none does). The usual ID stays for its own issuer, so a
 * repeated run keeps its ID; a different issuer whose long name is cut to the same ID gets the
 * first 31 characters plus a code from its whole name, so two issuers never share one ID. A name
 * with no Latin letters or digits has no usual ID (empty): none is made up for it.
 */
export function issuerIdFor(name: string, ownerName: string | undefined) {
  const usual = issuerSlug(name);
  if (!usual || !ownerName || issuerKey(ownerName) === issuerKey(name)) return usual;
  return `${usual.slice(0, 31).replace(/-+$/, "")}-${nameCode(name)}`;
}

const FILED_ELSEWHERE =
  /^Issuer ID "([^"]+)" is filed under the name "(.*)", not "(.*)"\. If that is this issuer under another name, type that name; otherwise use another Issuer ID\.$/s;

/** The service's refusal of an Issuer ID that another issuer holds, taken apart; else undefined. */
export function filedElsewhere(message: string) {
  const [, id = "", holder = "", name = ""] = FILED_ELSEWHERE.exec(message) ?? [];
  return id ? { id, holder, name } : undefined;
}

/**
 * That refusal in reader words, with the ID the page can offer instead; undefined for any other
 * message. `usualHolder` is the name the usual ID of the typed name is filed under (undefined when
 * free; it is the refused holder when the refused ID is the usual one). The usual ID is offered
 * when it is free or this issuer's own; the suffixed ID only when another issuer holds the usual
 * one; nothing when it is the ID just refused, and for a name with no usual ID the analyst is asked
 * to type one.
 */
export function issuerIdRefusal(
  message: string,
  usualHolder?: string,
): { sentence: string; offer?: string } | undefined {
  const found = filedElsewhere(message);
  if (!found) return undefined;
  const usual = issuerSlug(found.name);
  const offered = issuerIdFor(found.name, found.id === usual ? found.holder : usualHolder);
  const offer = offered && offered !== found.id ? offered : undefined;
  const head = `Issuer ID ${found.id} is filed under the name "${found.holder}". If that is this issuer under another name, type that name.`;
  const tail = offer
    ? ` Otherwise use ${offer} for ${found.name}, or type another Issuer ID.`
    : usual
      ? " Otherwise type another Issuer ID."
      : ` Otherwise type an Issuer ID of your own for ${found.name}.`;
  return { sentence: head + tail, ...(offer ? { offer } : {}) };
}

const REFUSED_FILE = /^(?:--sources:\s*)?cannot read (.+?): [\s\S]*$/i;
const NO_TEXT = /^(?:--sources:\s*)?(.+?) has no extractable text \(scanned image\?\)$/i;
const NO_FILE = /no readable issuer file\s*$/i;

const TEXT_FILE = /\.(txt|text|md|csv|tsv|json|jsonl|html?|xml|log)$/i;
const WORKBOOK_FILE = /\.(xlsx|xlsm|xls)$/i;

/**
 * The kind of problem, only where the service's message states it and it is true of the file type:
 * a decode failure is about the text of a text file (any other file the service reads as text when
 * it is not a PDF or workbook, so a damaged workbook or PDF reports one too, and says only that it
 * could not be read); else a full stop.
 */
function unreadableBecause(message: string, file: string) {
  if (/codec can't decode|UnicodeDecodeError/i.test(message))
    return TEXT_FILE.test(file) ? ": its text could not be decoded." : ".";
  if (/not a zip file/i.test(message) && !WORKBOOK_FILE.test(file))
    return ": its contents are not a valid zip archive.";
  return ".";
}

/**
 * A document refusal from the service in reader words: the file it names (as the analyst's own file
 * is called, so its row can be marked) and one sentence with no parser text. Text that is not a
 * document refusal comes back unchanged with no file.
 */
export function documentRefusal(
  message: string,
  files: readonly { name: string; size?: number }[],
): { file?: string; sentence: string } {
  const named = (found: string) =>
    files.find((file) => file.name.toLowerCase() === found.toLowerCase());
  const cannot = REFUSED_FILE.exec(message);
  if (cannot) {
    const file = named(cannot[1] ?? "")?.name ?? cannot[1] ?? "";
    return { file, sentence: `${file} could not be read${unreadableBecause(cannot[0], file)}` };
  }
  const empty = NO_TEXT.exec(message);
  if (empty) {
    const match = named(empty[1] ?? "");
    const file = match?.name ?? empty[1] ?? "";
    return {
      file,
      sentence:
        match?.size === 0
          ? `${file} is empty (0 bytes).`
          : `${file} has no text that can be read; it may be a scanned image.`,
    };
  }
  if (NO_FILE.test(message))
    return {
      sentence:
        "None of the selected documents could be read as an issuer filing. Choose a filing in a supported format.",
    };
  return { sentence: message };
}
