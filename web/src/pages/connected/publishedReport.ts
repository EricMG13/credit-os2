import { moduleName, pathwayName, RequestError } from "./api";

export type Row = { line: number; cells: string[] };
export type Table = { type: "table"; line: number; headers: string[]; rows: Row[] };
type Paragraph = { type: "text"; line: number; end: number; text: string };
export type Block = Table | Paragraph | { type: "equity"; line: number; text?: string };
export type Section = { heading: string; level: number; line: number; blocks: Block[] };
const FILE_EXTENSIONS = "jsonl?|x?html?|xml|pdf|docx?|xlsx?|xlsm|csv|tsv|pptx?|txt|md|zip";
// A file name ahead before the next ";", ",", "|" or line end: the code belongs to a stored name.
const FILE_AHEAD = new RegExp(String.raw`^[^;,|\n]*\.(?:${FILE_EXTENSIONS})\b`, "i");
/** Drops the code from "Name (CP-x)" in handoff text; a code inside a stored file name or bare in a sentence stays. */
export function plainModuleNames(text: string) {
  return text.replace(/ \(CP-[A-Za-z0-9]+\)/g, (code, at: number) =>
    FILE_AHEAD.test(text.slice(at + code.length)) ? code : "",
  );
}
// A standalone run of module codes ("CP-1" or "CP-1/CP-2", in either case): nothing path-like or
// word-like touches it.
const STANDALONE_CODES =
  /(?<![\w\-\\/.])CP-[A-Z0-9]+(?:\/CP-[A-Z0-9]+)*(?![\w\-\\/])(?!\.[A-Za-z])/gi;
// A bracketed code after text: " (CP-x)".
const BRACKETED_CODE = / \((CP-[A-Za-z0-9]+)\)/gi;
/** The module's name for a code in either case; a code the page does not know stays as written. */
function nameOfCode(code: string) {
  const name = moduleName(code.toUpperCase());
  return name === code.toUpperCase() ? code : name;
}
/**
 * Findings-page text: a " (CP-x)" right after that module's own name is dropped, after any other
 * words it becomes " (<module name>)" (an unknown code stays), then each standalone known code
 * becomes the module's name. A code inside a stored file name stays. A code in lower case ("cp-2a")
 * reads as the upper-case code does; a gap id or a run code is not a module code (`containsReference`).
 */
export function readerText(text: string) {
  const bracketed = text.replace(BRACKETED_CODE, (match, code: string, at: number) => {
    const name = nameOfCode(code);
    if (name === code || FILE_AHEAD.test(text.slice(at + match.length))) return match;
    return text.slice(0, at).toLowerCase().endsWith(name.toLowerCase()) ? "" : ` (${name})`;
  });
  return bracketed.replace(STANDALONE_CODES, (run, at: number, whole: string) => {
    const kept = whole.slice(0, at).endsWith(" (") && whole[at + run.length] === ")";
    if (kept && FILE_AHEAD.test(whole.slice(at + run.length + 1))) return run;
    return run.replace(/CP-[A-Z0-9]+/gi, nameOfCode);
  });
}
export const CONFIDENCE_INPUTS = "Confidence inputs";
export const FORECAST_INPUTS = "Forecast inputs (machine-readable)";
type FigureRef = Record<string, unknown> & { table: number };
type Output = {
  id: string;
  run?: string;
  module: string;
  label: string;
  href: string;
  sha256: string;
  issue?: string | null;
  parseError?: string;
  summary?: { bottomLine: string; confidence: string; limitation: string; line: number } | null;
  state?: { established: boolean | null; declared: string | null };
  charts?: FigureRef[];
  chartGaps?: FigureRef[];
  events?: FigureRef[];
  maps?: FigureRef[];
  confidence?: { value: number; band: string } | { missing: string };
};
export type OutputEntry = { output: Output; sections: Section[]; selected: boolean };
type Link = { href: string; label: string };
type Source = {
  href?: string | null;
  sourceWarning?: string | null;
  name: string;
  type: string | null;
  documentDate: string | null;
  readBy: string[];
  sha256: string | null;
};
type Chip = {
  quote_found?: boolean | null;
  href?: string | null;
  pageHref?: string | null;
  label: string | null;
  quote: string | null;
  excerpt: string | null;
  file: string | null;
  source: string | null;
  sha256: string | null;
  reason: string | null;
};
type Side = { value: string | number | null; unit?: string | null; period?: string | null };
type Measure = {
  key: string;
  label: string;
  prior?: Side | null;
  current?: Side | null;
  difference?: number | string | null;
  same_period?: boolean;
  comparable?: string;
  unit?: string | null;
  reason?: string | null;
};
type ComparisonRun = { as_of: string; pathway: string; format?: string };
export type MaturityProfile = {
  unit: string;
  rows: { period: string; prior: string | null; current: string | null }[];
};
type ModuleComparison = {
  module: string;
  title: string;
  ran_prior: boolean;
  ran_current: boolean;
  prior_bottom_line: string | null;
  current_bottom_line: string | null;
};
export type Changes = {
  first_run?: boolean | null;
  note?: string | null;
  problem?: string | null;
  pack?: {
    measures?: Measure[];
    omitted?: Record<string, string>;
    prior?: ComparisonRun & { run: string };
    current?: ComparisonRun;
    maturity_profile?: MaturityProfile;
    modules?: ModuleComparison[];
  } | null;
  verdicts?: {
    modules?: Record<string, { status: string; cause: string; why: string }>;
    measures?: Record<
      string,
      { kind: string; label: string; reason?: string | null; analysis_change?: string | null }
    >;
  } | null;
};
type Model = {
  id: string;
  issuerKey: string;
  runId: string | null;
  runFolder: string | null;
  sources: { run?: string; output?: string; role: string; sha256?: string | null; path?: string }[];
  cashflow: { limits: string[] } | null;
  register?: { heading: string; intro: string | null; headers: string[]; rows: string[][] } | null;
  mode?: string;
  scope?: string | null;
  href: string;
  download: string;
};
export type ScriptCheckOutcome = {
  figure: string | null;
  register: string | null;
  row: string | null;
  status: string;
  reason: string | null;
  script: string | null;
  stated: string | null;
  recomputed: number | null;
  recomputedLabel: string | null;
  tolerance: number | null;
  unit: string | null;
};
export type ScriptCheckRecord = {
  module: string;
  attempt: number;
  response: string | null;
  counts: { status: string; n: number }[];
  scripts: { name: string; sha256: string | null }[];
  outcomes: ScriptCheckOutcome[];
};

export type PublishedRun = {
  folder: string;
  issuer: string;
  issuerKey?: string | null;
  issuerHeading?: string | null;
  title: string;
  period: string;
  asOf: string | null;
  pathway: string | null;
  modules: Record<string, { outputs: string[]; default: string | null }>;
  record?: {
    steps: { module: string; started?: string | null; accepted?: string | null }[];
  } | null;
  changes?: Changes | null;
  /** The methods that changed since this run ran, one "<module>: <detail>" line each (the store's
   * `method_changes`); none or empty when the run is on today's methods. */
  methodChanges?: string[] | null;
  evidence: {
    scriptChecks?: ScriptCheckRecord[];
    sources: Source[];
    unused: Source[];
    unrecorded: Source[];
    noSourcesModules: string[];
    handoffs: { module: string; name: string; href: string }[];
    zip: string | null;
    downloads: Link[];
    record: {
      hashes: { name: string; sha256: string }[];
      instructions: { module: string; href: string | null; sha256: string | null }[];
      calls: {
        module: string | null;
        attempt: number | null;
        started: string | null;
        http_status: number | null;
        error_class: string | null;
        settled_usd: string | null;
      }[];
      cap: number | string | null;
    };
  };
};
type Metric = {
  value?: number | string | null;
  unit?: string | null;
  period?: string | null;
  /** The same metric one year earlier, and `current - prior` as the back end computed it. */
  prior?: { value: string; period: string };
  change?: string;
};
export type CatalogueRating = {
  label: string;
  agency: string;
  scope: "issuer" | "facility";
  outlook: string;
  date: string;
};
export type CatalogueRun = {
  id: string;
  name: string;
  issuer: string;
  title: string;
  date: string;
  sector: string;
  period: string;
  metrics: Record<string, Metric>;
  /** The ratings the analyst entered at run start; absent means none. */
  ratings?: CatalogueRating[];
};
export type Snapshot = {
  catalogue: { real: CatalogueRun[] };
  workspace: {
    runs: Record<string, PublishedRun>;
    outputs: Record<string, Output>;
    handoffs: Record<string, Section[]>;
    models: Model[];
  };
  chips: Record<string, Chip[]>;
  preview?: { reason: string };
};

export type LibraryIndex = {
  catalogue: Snapshot["catalogue"];
  workspace: {
    runs: Record<
      string,
      Pick<PublishedRun, "folder" | "issuerKey" | "pathway"> & {
        /** Exact selected credit-view paragraph; its Basis line and original source identity remain intact. */
        lead?: { module: string; output: string; sha256: string; line: number; text: string };
      }
    >;
  };
  preview?: Snapshot["preview"];
};

export async function getLibraryIndex(signal: AbortSignal): Promise<LibraryIndex | null> {
  const response = await fetch("/connected/library", { cache: "no-store", signal });
  if (!response.ok) throw new Error("The published library could not be loaded.");
  return (await response.json()) as LibraryIndex | null;
}

export async function getSnapshot(signal: AbortSignal, folder?: string): Promise<Snapshot | null> {
  const query = folder === undefined ? "" : `?run=${encodeURIComponent(folder)}`;
  const response = await fetch(`/connected/snapshot${query}`, { cache: "no-store", signal });
  if (!response.ok)
    throw new RequestError("The published report could not be loaded.", response.status);
  return (await response.json()) as Snapshot | null;
}

export function outputEntries(
  snapshot: Snapshot,
  run: PublishedRun,
  routeKey: string,
): OutputEntry[] {
  return Object.entries(run.modules).flatMap(([moduleId, module]) =>
    module.outputs.flatMap((id) => {
      const output = snapshot.workspace.outputs[id];
      return output && output.module === moduleId && (!output.run || output.run === routeKey)
        ? [
            {
              output,
              sections: snapshot.workspace.handoffs[output.sha256] ?? [],
              selected: module.default === id,
            },
          ]
        : [];
    }),
  );
}

export function runModels(snapshot: Snapshot, key: string, run: PublishedRun) {
  return snapshot.workspace.models.filter(
    (model) =>
      model.issuerKey === run.issuerKey &&
      (model.runId === run.folder ||
        model.runFolder === run.folder ||
        model.sources.some((source) => source.run === key)),
  );
}

export const reportPath = (folder: string) => `/report/${encodeURIComponent(folder)}`;

export function runPathway(run: Pick<PublishedRun, "pathway">, catalogue?: CatalogueRun) {
  return run.pathway ? pathwayName(run.pathway) : catalogue?.title || "";
}

export function runTiming(run: Pick<PublishedRun, "asOf" | "period">) {
  if (/^As of\s/i.test(run.period)) return run.period;
  const date = run.asOf ? `As of ${run.asOf}` : "";
  return [date, run.period !== run.asOf ? run.period : ""].filter(Boolean).join(" · ");
}

const moneyUnit = /^(USD|US\$|[A-Z]{3})(?: millions|m)$/;
const moneySymbol = (code: string) => (code === "USD" || code === "US$" ? "US$" : `${code} `);

export function unitLabel(unit: string) {
  const code = moneyUnit.exec(unit)?.[1];
  return code ? `${code === "USD" || code === "US$" ? "US$" : code}m` : unit;
}

export function withUnit(value: string | number, unit?: string | null) {
  const code = unit ? moneyUnit.exec(unit)?.[1] : undefined;
  if (code) {
    const text = String(value);
    if (!/^-?(\d+|\d{1,3}(,\d{3})+)(\.\d+)?$/.test(text)) return text;
    const [plain = "", fraction] = text.replace(/^-/, "").split(".");
    const integer = plain.replace(/,/g, "");
    const grouped = integer.replace(/\B(?=(\d{3})+$)/g, ",");
    const sign = text.startsWith("-") ? "-" : "";
    return `${sign}${moneySymbol(code)}${grouped}${fraction === undefined ? "" : `.${fraction}`}m`;
  }
  return unit ? `${String(value)}${/^[x%]$/.test(unit) ? "" : " "}${unit}` : String(value);
}

export function comparisonForRun(run: PublishedRun, runs: Record<string, PublishedRun>) {
  const change = run.changes;
  if (!change?.pack || change.problem) return change;
  const { prior, current } = change.pack;
  const matches = Object.values(runs).filter((candidate) => candidate.folder === prior?.run);
  const [earlier] = matches;
  if (
    prior &&
    current &&
    matches.length === 1 &&
    earlier &&
    run.issuerKey &&
    earlier.issuerKey === run.issuerKey &&
    earlier.folder !== run.folder &&
    earlier.asOf === prior.as_of &&
    earlier.pathway === prior.pathway &&
    run.pathway === prior.pathway &&
    run.pathway === current.pathway &&
    run.asOf === current.as_of
  )
    return change;
  return {
    ...change,
    pack: null,
    problem: "The comparison does not match the listed issuer, dates and pathway.",
  };
}

function comparableMeasure(measure: Measure, kind: string | undefined, unitsMatch: boolean) {
  return (
    kind === "comparable" &&
    unitsMatch &&
    measure.comparable !== "no" &&
    measure.prior?.value != null &&
    measure.current?.value != null
  );
}

function sameMeasurePeriod(measure: Measure) {
  return (
    measure.same_period === true ||
    Boolean(measure.prior?.period && measure.prior.period === measure.current?.period)
  );
}

function comparisonDifference(
  measure: Measure,
  comparable: boolean,
  samePeriod: boolean,
  purpose: "evidence" | "reader",
) {
  const revision =
    comparable && samePeriod && measure.difference != null && Number(measure.difference) !== 0;
  const delta =
    comparable && measure.difference != null && (purpose === "evidence" || !samePeriod)
      ? withUnit(measure.difference, measure.unit)
      : "—";
  return { revision, delta };
}

export function comparisonRows(changes: Changes, purpose: "evidence" | "reader" = "evidence") {
  const side = (item: Side | null | undefined) =>
    item?.value == null
      ? "Not stated"
      : withUnit(item.value, item.unit) + (item.period ? ` (${item.period})` : "");
  return (changes.pack?.measures ?? []).map((measure) => {
    const verdict = changes.verdicts?.measures?.[measure.key];
    const unitsMatch = (measure.prior?.unit ?? null) === (measure.current?.unit ?? null);
    const comparable = comparableMeasure(measure, verdict?.kind, unitsMatch);
    const samePeriod = sameMeasurePeriod(measure);
    const { revision, delta } = comparisonDifference(measure, comparable, samePeriod, purpose);
    const reason = unitsMatch
      ? verdict?.reason || verdict?.label || measure.reason || "Comparability not judged"
      : "Reporting units differ.";
    return [
      measure.label,
      side(measure.prior),
      side(measure.current),
      delta,
      revision ? `${reason} · Same-period analysis change` : reason,
      verdict?.analysis_change ?? "",
    ];
  });
}

export const PASSAGES = [
  "Bottom line",
  "Key findings",
  "Contrary evidence and what would change the view",
  "Limitations",
];
const HIDDEN =
  /^(Request|Next module|Front matter)$|downstream owners|Consumer readiness|command sheet|Readiness for downstream use|Upstream re-anchor|method trace|Module status|QA validation|machine-readable|research brief|Workstream plan|Cross-Module Handoff/i;
const REGISTERS =
  /source assessment|confidence inputs|source context|period table|key located evidence|conflicts and duplicates|register|ledger/i;
const TOP_ROLE = { Sources: "sources", Calculations: "calculations", Gaps: "gaps" } as const;
const isTopRole = (heading: string): heading is keyof typeof TOP_ROLE =>
  Object.hasOwn(TOP_ROLE, heading);
const DRAWING = /^(Chart data|Map|Events): /;

function sectionRole(chain: string[]) {
  const first = chain[0] ?? "";
  const own = chain.at(-1) ?? "";
  if (chain.some((heading) => HIDDEN.test(heading))) return "hidden";
  if (isTopRole(first)) return TOP_ROLE[first];
  if (first !== "Findings") return "registers";
  if (chain.length === 2 && PASSAGES.includes(own)) return "passage";
  if (DRAWING.test(own)) return "drawing";
  if (
    own === "Reader summary" ||
    chain.some((heading) => /^Analytical appendix/.test(heading)) ||
    REGISTERS.test(own)
  )
    return "registers";
  return "finding";
}

// Match RBOT's heading-chain routing, including hidden descendants.
export function classifySections(sections: Section[]) {
  const stack: Section[] = [];
  return sections.map((section) => {
    while ((stack.at(-1)?.level ?? 0) >= section.level) stack.pop();
    stack.push(section);
    return {
      section,
      role: sectionRole(stack.filter((item) => item.level >= 2).map((item) => item.heading)),
    };
  });
}

export function passages(sections: Section[]) {
  return classifySections(sections)
    .filter(({ role }) => role === "passage")
    .map(({ section }) => section);
}

/** The heading of the first H3 under a handoff's `## Findings`; none without one. */
function firstFinding(sections: Section[]) {
  const start = sections.findIndex(({ level, heading }) => level === 2 && heading === "Findings");
  if (start < 0) return undefined;
  for (const section of sections.slice(start + 1)) {
    if (section.level <= 2) return undefined;
    if (section.level === 3) return section.heading;
  }
  return undefined;
}

/** A handoff the build could not read (`Shapes.isUnstructured` of the issuer library). */
const unstructured = (sections: Section[]) =>
  sections.length === 1 &&
  sections[0]?.level === 1 &&
  sections[0].heading === "Unstructured handoff";

/**
 * The labels Report history and the run frame give a run. "Earlier format" (ruling H7): any of its
 * handoffs, every saved output of every module, has a `## Findings` whose first H3 is not
 * `### Bottom line`; a handoff the page does not hold or the build could not read says nothing.
 * "Earlier methods" (Amendment 2026-11-11): the store lists methods changed since the run ran.
 */
export function runLabels(entries: OutputEntry[], run: Pick<PublishedRun, "methodChanges">) {
  const earlierFormat = entries.some(
    ({ sections }) =>
      sections.length > 0 && !unstructured(sections) && firstFinding(sections) !== "Bottom line",
  );
  return [
    ...(earlierFormat ? ["Earlier format"] : []),
    ...(run.methodChanges?.length ? ["Earlier methods"] : []),
  ];
}

export function blocked(entry: OutputEntry) {
  const first = classifySections(entry.sections).find(
    ({ section }) => section.level === 3 && section.blocks.length > 0,
  );
  return first?.role === "passage" && first.section.heading === "Bottom line"
    ? first.section.blocks
        .find((block) => block.type === "text")
        ?.text.startsWith("Not assessable:") === true
    : entry.output.state?.established === false;
}

const DATA_MODULES = ["CP-0", "CP-PARSE", "CP-1", "CP-1C"];

// The reader passages a module's handoff lacks. An earlier-format handoff,
// with none of them, is not judged. `drawn` names the passages the page
// actually draws; without it a passage counts as present when its heading is.
export function missingPassages(entry: OutputEntry, drawn?: readonly string[]) {
  const written = passages(entry.sections).map((section) => section.heading);
  if (!written.length) return [];
  const present = drawn ?? written;
  const owed =
    blocked(entry) || DATA_MODULES.includes(entry.output.module) ? ["Bottom line"] : PASSAGES;
  return owed.filter((name) => !present.includes(name));
}

export function methodNote(text: string) {
  return (
    /^(?:Module status|Two method texts)\b|^Confidence is \d|qa_status|committee_status/i.test(
      text.trim(),
    ) || /\bSKILL\b/.test(text)
  );
}

export function readParagraph(text: string) {
  const lines = text.split("\n");
  const last = lines.at(-1) ?? "";
  const basis = last.startsWith("Basis: ") ? last.slice(7) : null;
  if (basis !== null) lines.pop();
  const body = lines
    .join(" ")
    .replace(/^[-*] /, "")
    .trim();
  if (basis !== null) return { body, basis };
  const citations: string[] = [];
  const read = body.replace(
    /(?: ?(?:\[[^\]]*\]|【[^】]*】))+/g,
    (cluster: string, offset: number) => {
      const before = body.slice(0, offset);
      const after = body.slice(offset + cluster.length);
      const endsSentence =
        /^(?:\s*$|[.!?]+["')”’]*(?:\s|$))/.test(after) ||
        (/[.!?]["')”’]*\s?$/.test(before) && /^(?:\s|$)/.test(after));
      if (!endsSentence) return cluster;
      return cluster.replace(/ ?(\[[^\]]*\]|【[^】]*】)/g, (item: string, citation: string) => {
        if (
          !/CP-[A-Z0-9]+|\bpp?\.|\bpages?\b|\b[A-Z]\d{1,3}\b|†|^【/.test(citation) &&
          !containsReference(citation)
        )
          return item;
        citations.push(citation);
        return "";
      });
    },
  );
  return { body: read, basis: citations.length ? citations.join(" ") : null };
}

const FILE_REFERENCE = new RegExp(
  String.raw`(?<![\w.-])[\w-]+(?:\.[\w-]+)*\.(?:${FILE_EXTENSIONS})\b`,
  "i",
);
const LONG_HASH = /\b(?=[0-9a-f]*[a-f])[0-9a-f]{32,}\b/i;
const REGISTER_ID = /\bCP-[A-Z0-9]+-(?:GAP|MON|FACT|CALC|EVID|SRC|ASSUMPTION)-[A-Z0-9-]+\b/i;

// A gap id as the modules spell a gap, the report-wide id after the empty-set mark ("∅ G12",
// "∅ G12 n.m.", "∅ [G12]"), a parenthesized gap id, and a run code. Bare "G20" in a
// sentence is not a gap id. Page locators also stay in Evidence. A module code is not a reference here: a findings page draws it as the module's
// name (`readerText`, D-13 part 2), so it is not held back.
const GAP_ID = /∅\s*\[?G\d+\b/;
const RUN_CODE = /\b\d{8}-\d{6}-\d{2}\b/;

export function containsReference(text: string) {
  return (
    FILE_REFERENCE.test(text) ||
    LONG_HASH.test(text) ||
    REGISTER_ID.test(text) ||
    GAP_ID.test(text) ||
    /\(G\d+\)/.test(text) ||
    /\b(?:pp?\.|pages?)\s*\d+(?:\s*[-–]\s*\d+)?\b/i.test(text) ||
    RUN_CODE.test(text)
  );
}

const INTERMODULE =
  /^(?:supplied handoff|use in this module|effect on this module|consumer|downstream module|receiving module|responsible module|command|required consumer action|escalation consequence|next commands?|next modules?|downstream consumers?|downstream modules? affected|downstream handoff impact|downstream owners|affected consumers|affected modules|downstream_use|consumer_module_id)$|^consequence for cp-/;
const SOURCE_COLUMN =
  /\bid$|^linked pathway row$|^(?:(?:sources?|evidence)(?:\s*\/\s*(?:clause|limitation)|\s+(?:trace|locator|register|document|file|sha|hash|page|reference|ref|link)s?)?|sha256|source document name|source and basis|source\(s\)|source row\/section\/quote|sha256 hash|where found)$|\b(?:hash(?:es)?|sha|sha256|locators?|citations?|file ?names?)\b/;

export function displayColumns(headers: string[], evidence: boolean, rows: Row[] = []) {
  return headers.flatMap((text, index) => {
    const header = text.trim().toLowerCase().replaceAll("-", " ").replace(/\s+/g, " ");
    if (INTERMODULE.test(header)) return [];
    const populated = rows.map((row) => row.cells[index]?.trim() ?? "").filter(Boolean);
    const ambiguousId =
      /^(?:references?|ref\.?|code)$/.test(header) &&
      populated.length > 0 &&
      populated.filter(containsReference).length * 2 >= populated.length;
    return evidence || (!SOURCE_COLUMN.test(header) && !ambiguousId) ? [index] : [];
  });
}

export function publishedHref(href: string | null | undefined, folder: string) {
  if (!href?.startsWith("downloads/")) return null;
  const parts = href.split("/");
  try {
    const decoded = parts.map((part) => decodeURIComponent(part));
    if (
      decoded[1] !== folder ||
      decoded.length < 3 ||
      decoded.some(
        (part) => !part || part === "." || part === ".." || /[/\\?#\u0000-\u001f]/.test(part),
      )
    )
      return null;
    return `/library/${decoded.map(encodeURIComponent).join("/")}`;
  } catch {
    return null;
  }
}

export function evidenceToken(entry: OutputEntry, line?: number) {
  const { id, sha256 } = entry.output;
  return `${encodeURIComponent(id)}~${sha256}${line === undefined ? "" : `-${String(line)}`}`;
}

export function sectionContainsLine(section: Section, line: number) {
  return (
    section.line === line ||
    section.blocks.some(
      (block) =>
        block.line === line ||
        (block.type === "table" && block.rows.some((row) => row.line === line)),
    )
  );
}

export function resolveEvidenceLocation(entries: OutputEntry[], token: string) {
  const delimiter = token.lastIndexOf("~");
  if (delimiter <= 0) return null;
  let id: string;
  try {
    id = decodeURIComponent(token.slice(0, delimiter));
  } catch {
    return null;
  }
  const match = /^([a-f\d]{64})(?:-(\d+))?$/i.exec(token.slice(delimiter + 1));
  if (!match) return null;
  const matches: { entry: OutputEntry; index: number }[] = [];
  entries.forEach((entry, index) => {
    if (entry.output.id === id && entry.output.sha256.toLowerCase() === match[1]?.toLowerCase())
      matches.push({ entry, index });
  });
  if (matches.length !== 1) return null;
  const matchEntry = matches[0];
  if (!matchEntry) return null;
  const { entry, index } = matchEntry;
  const line = match[2] === undefined ? undefined : Number(match[2]);
  if (line !== undefined && (!Number.isSafeInteger(line) || line <= 0)) return null;
  if (line !== undefined && !entry.sections.some((section) => sectionContainsLine(section, line)))
    return null;
  return { entry, index, line };
}

export const evidencePath = (id: string, entry: OutputEntry, line?: number) =>
  `/report/${encodeURIComponent(id)}#evidence/${evidenceToken(entry, line)}`;

export const evidenceHref = (id: string, token: string) =>
  `/report/${encodeURIComponent(id)}#evidence/${token}`;
