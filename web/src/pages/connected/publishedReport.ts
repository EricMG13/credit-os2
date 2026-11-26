import { LIBRARY_ADDRESS, request, snapshotAddress } from "./ahead";
import { moduleCodeName, pathwayName, RequestError } from "./api";
import { asOfDate } from "./runFigures";
import { changeText } from "./signal";
import { withUnit } from "./moneyUnits";
export { unitLabel, withUnit, writtenUnit } from "./moneyUnits";

export type Row = { line: number; cells: string[] };
export type Table = { type: "table"; line: number; headers: string[]; rows: Row[] };
type Paragraph = { type: "text"; line: number; end: number; text: string };
export type Block = Table | Paragraph | { type: "equity"; line: number; text?: string };
export type Section = {
  heading: string;
  level: number;
  line: number;
  blocks: Block[];
  /** Set by `outputEntries` (ruling M2): a credit screening CP-L10 section that is not a finding. */
  register?: true;
  /** Set by `outputEntries`: one of the five screens, drawn by the credit screening lead. */
  screen?: true;
};
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
function nameOfCode(code: string, pathway?: string | null) {
  return moduleCodeName(code.toUpperCase(), pathway) ?? code;
}
/**
 * Findings-page text: a " (CP-x)" right after that module's own name is dropped, after any other
 * words it becomes " (<module name>)" (an unknown code stays), then each standalone known code
 * becomes the module's name. A code inside a stored file name stays. A code in lower case ("cp-2a")
 * reads as the upper-case code does; a gap id or a run code is not a module code (`containsReference`).
 */
export function readerText(text: string, pathway?: string | null) {
  const bracketed = text.replace(BRACKETED_CODE, (match, code: string, at: number) => {
    const name = nameOfCode(code, pathway);
    if (name === code || FILE_AHEAD.test(text.slice(at + match.length))) return match;
    return text.slice(0, at).toLowerCase().endsWith(name.toLowerCase()) ? "" : ` (${name})`;
  });
  return bracketed.replace(STANDALONE_CODES, (run, at: number, whole: string) => {
    const kept = whole.slice(0, at).endsWith(" (") && whole[at + run.length] === ")";
    if (kept && FILE_AHEAD.test(whole.slice(at + run.length + 1))) return run;
    return run.replace(/CP-[A-Z0-9]+/gi, (code) => nameOfCode(code, pathway));
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
  /** Exact inputs accepted by the scorer and its method, projected from the same handoff bytes. */
  confidenceTrace?: {
    inputs: { label: string; value: string }[];
    method: { label: string; value: string }[];
    /** Exact source prose/locators, selected with the accepted scorer's section rules. */
    section?: Section;
  };
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
export type PublishedChanges = {
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

export type PublishedLead = {
  module: string;
  output: string;
  sha256: string;
  line: number;
  text: string;
};
type AssessmentScope = "standard" | "partial" | "unverified";
type ActionTreatment = {
  output: string;
  sha256: string;
  state: "withheld";
  scope: "committee" | "instrument";
  reason: string;
};

export type PublishedRun = {
  history?: { modules: string[]; earlierFormat: boolean; earlierMethods: boolean };
  publicationVerified?: boolean;
  lead?: PublishedLead | null;
  assessmentScope?: AssessmentScope;
  publishedAt?: string | null;
  actionTreatment?: Partial<Record<"CP-6" | "CP-3", ActionTreatment>>;
  folder: string;
  issuer: string;
  issuerKey?: string | null;
  issuerHeading?: string | null;
  title: string;
  period: string;
  asOf: string | null;
  pathway: string | null;
  /** The modules the run asked for, as its manifest records them (a custom run's completed list,
   * with CP-8 last when it compared); none when the manifest records none. */
  requested?: string[] | null;
  modules: Record<string, { outputs: string[]; default: string | null }>;
  record?: {
    steps: { module: string; started?: string | null; accepted?: string | null }[];
  } | null;
  changes?: PublishedChanges | null;
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
  basis?: string;
  value?: number | string | null;
  unit?: string | null;
  period?: string | null;
  /** The heading the catalogue states the figure under, set when it is not the plain name (the adjusted twin). */
  label?: string;
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
  ticker?: string | null;
  title: string;
  date: string;
  sector: string;
  period: string;
  metrics: Record<string, Metric>;
  /** The ratings the analyst entered at run start; absent means none. */
  ratings?: CatalogueRating[];
};
export type Snapshot = {
  reportFolder?: string;
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
    runs: Record<string, LibraryRun>;
  };
  preview?: Snapshot["preview"];
};

export type LibraryRun = Pick<
  PublishedRun,
  | "folder"
  | "issuerKey"
  | "pathway"
  | "publicationVerified"
  | "lead"
  | "assessmentScope"
  | "publishedAt"
>;

export function publishedRunForFolder<Run extends { folder: string }>(
  runs: Record<string, Run>,
  folder: string,
) {
  const exact = Object.entries(runs).filter(([, run]) => run.folder === folder);
  return exact.length === 1 ? exact[0] : undefined;
}

export async function getLibraryIndex(signal: AbortSignal): Promise<LibraryIndex | null> {
  const response = await request(LIBRARY_ADDRESS, signal);
  if (!response.ok) throw new Error("The published library could not be loaded.");
  return (await response.json()) as LibraryIndex | null;
}

export async function getSnapshot(signal: AbortSignal, folder?: string): Promise<Snapshot | null> {
  const response = await request(snapshotAddress(folder), signal);
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
              sections: screeningSections(
                snapshot.workspace.handoffs[output.sha256] ?? [],
                run.pathway === "credit_screening" && moduleId === "CP-L10",
              ),
              selected: module.default === id,
            },
          ]
        : [];
    }),
  );
}

export const SCREEN_TITLES = [
  "Financial change screen",
  "Credit screen",
  "Liquidity and forward-risk screen",
  "Security opportunity screen",
  "Creditor-document screen",
] as const;

/** Ruling M2: in a credit screening CP-L10 handoff, a finding other than the five screens is a register. */
function screeningSections(sections: Section[], screening: boolean) {
  if (!screening) return sections;
  return classifySections(sections).map(({ section, role }) =>
    role !== "finding" || section.level <= 2
      ? section
      : SCREEN_TITLES.some((t) => t === section.heading)
        ? { ...section, screen: true as const }
        : { ...section, register: true as const },
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
  if (/^As of\s/i.test(run.period))
    return run.period.replace(
      /^(As of\s+)(\d{4}-\d{2}-\d{2})\b/i,
      (_, prefix: string, date: string) => `${prefix}${asOfDate(date)}`,
    );
  const date = run.asOf ? `As of ${asOfDate(run.asOf)}` : "";
  return [date, run.period !== run.asOf ? run.period : ""].filter(Boolean).join(" · ");
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
      ? changeText(String(measure.difference), measure.unit)
      : "—";
  return { revision, delta };
}

export function comparisonRows(
  changes: PublishedChanges,
  purpose: "evidence" | "reader" = "evidence",
) {
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

function sectionRole(chain: string[], afterAppendix = false) {
  const first = chain[0] ?? "";
  const own = chain.at(-1) ?? "";
  if (chain.some((heading) => HIDDEN.test(heading))) return "hidden";
  if (isTopRole(first)) return TOP_ROLE[first];
  if (first !== "Findings") return "registers";
  if (chain.length === 2 && PASSAGES.includes(own)) return "passage";
  if (DRAWING.test(own)) return "drawing";
  if (
    own === "Reader summary" ||
    afterAppendix ||
    chain.some((heading) => /^Analytical appendix/.test(heading)) ||
    REGISTERS.test(own)
  )
    return "registers";
  return "finding";
}

// Match RBOT's heading-chain routing, including hidden descendants.
export function classifySections(sections: Section[]) {
  const stack: Section[] = [];
  // Real handoffs write each appendix register as a sibling heading after the appendix heading
  // (synthetic ones nest them); every table section after it at that level, until the next
  // top-level section, is part of the registers.
  let appendixLevel = 0;
  // A section after the appendix heading that holds module prose and no table is a reader
  // conclusion (an overall view, a decision), not a register; it stays a finding.
  const readerProse = ({ blocks }: Section) =>
    blocks.some((block) => block.type === "text" && !/^Basis:/.test(block.text.trim())) &&
    !blocks.some((block) => block.type === "table");
  return sections.map((section) => {
    while ((stack.at(-1)?.level ?? 0) >= section.level) stack.pop();
    stack.push(section);
    if (section.level <= 2 || section.level < appendixLevel) appendixLevel = 0;
    if (/^Analytical appendix/.test(section.heading)) appendixLevel = section.level;
    return {
      section,
      role: section.register
        ? "registers"
        : sectionRole(
            stack.filter((item) => item.level >= 2).map((item) => item.heading),
            appendixLevel > 0 && !readerProse(section),
          ),
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
// A drive, `file:` or other scheme written with one slash (`C:/x`, `file:/x`) is an address: a
// letter, a colon and a slash with no space. A share written with forward slashes is `//host/path`.
const ADDRESS_REFERENCE =
  /(?:\b[a-z][a-z0-9+.-]*:\/\/|[a-z]:\/\S|\bwww\.|(?:^|[\s(`"':])(?:(?:~|\.{1,2})\/\S|\/{1,2}[^\s/]+\/\S|[a-z]:\\\S|\\\\\S))/i;
const REGISTER_ID = /\bCP-[A-Z0-9]+-(?:GAP|MON|FACT|CALC|EVID|SRC|ASSUMPTION)-[A-Z0-9-]+\b/i;

// A gap id as the modules spell a gap, the report-wide id after the empty-set mark ("∅ G12",
// "∅ G12 n.m.", "∅ [G12]"), and a run code. A parenthesized id is an annotation unless its
// adjacent text names a group, instrument or mathematical quantity. An earlier "gap" in the
// clause cannot turn that label into a citation. A module code is not a reference here: a
// findings page draws it as the module's
// name (`readerText`, D-13 part 2), so it is not held back.
const GAP_ID = /∅\s*\[?G\d+\b/;
const RUN_CODE = /\b\d{8}-\d{6}-\d{2}\b/;
// A register, calculation or scenario id written inside a sentence ("CP-1C T4.10 EV/EBITDA",
// "(calculation R9)", "the Downside scenario S02"): machinery, drawn only in Evidence.
const REGISTER_CODE_IN_TEXT =
  /\bCP-[A-Z0-9]+ T[A-Z0-9]{0,4}\.\d+(?:\.\d+)?\b|\bcalculations? R\d+\b|\bscenario S\d{2}\b/;

function contextualMatch(
  text: string,
  pattern: RegExp,
  classify: (match: RegExpMatchArray, before: string, after: string) => boolean,
) {
  return [...text.matchAll(pattern)].some((match) => {
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    return classify(match, before, after);
  });
}

function parenthesizedGap(text: string) {
  return contextualMatch(text, /\(G\d+\)/gi, (_match, before, after) => {
    const namedLabel =
      /(?:\bgroup of \p{L}+(?:-\p{L}+)?|\b(?:economies|currencies)|\b(?:series|class|gen|tranche)\s+[\w-]+(?:\s+[\w-]+)?)\s*$/iu.test(
        before,
      );
    const definedQuantity =
      /^\s*(?:=|equals?\b)/i.test(after) ||
      /(?:^|[,;:=]|\b(?:is|equals?))\s*\d+(?:\.\d+)?x\s*$/i.test(before);
    return !namedLabel && !definedQuantity;
  });
}

// Page locators have no page-number length limit. A word before "pp" and an uninterrupted
// count/duration phrase after it can continue a percentage-point quantity. Duration modifiers
// have no word-count limit, but punctuation ends that phrase; bare/parenthesized locators
// have no preceding quantity. Explicit locator cues take precedence. Word fragments, S&P and
// p.p. are excluded at the token boundary; "front page 2025" is a headline, not a locator.
function pageCitation(text: string) {
  return contextualMatch(
    text,
    /(?<![\w&.-])(p|pg|pp|pages?)\.?\s*(:\s*)?(\d+)\b/gi,
    (match, before, after) => {
      const marker = match[1]?.toLowerCase();
      if (match[2] || /\b(?:see|at|on|as)\s*$/i.test(before)) return true;
      if (marker === "pp") {
        if (/\d\s*$/.test(before)) return false;
        if (
          /\p{L}\s*$/u.test(before) &&
          /^\s+(?:\p{L}+(?:-\p{L}+)*\s+)*(?:days?|weeks?|months?|quarters?|years?)\b/iu.test(after)
        )
          return false;
      }
      return !(marker === "page" && /\bfront\s+$/i.test(before));
    },
  );
}

/**
 * What a cell says besides its sources: its sentences that cite none, in order. A cell that holds a
 * limitation and then a file reference keeps the limitation; the reference alone goes to Evidence.
 * Empty when every sentence cites.
 */
export function withoutReferences(text: string) {
  return text
    .split(/(?<=[.!?])(?<!\bpp?\.)\s+(?=[A-Z])/u)
    .filter((sentence) => !containsReference(sentence))
    .join(" ")
    .trim();
}

/**
 * A gap reason the store joined from several cells ("a; b; a; c"): each clause once, in the order
 * written, compared without regard to case. Nothing else is changed.
 */
export function eachClauseOnce(reason: string) {
  const seen = new Set<string>();
  return reason
    .split(/;\s+/u)
    .filter((clause) => {
      const key = clause.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("; ");
}

export function containsReference(text: string) {
  return (
    FILE_REFERENCE.test(text) ||
    ADDRESS_REFERENCE.test(text) ||
    LONG_HASH.test(text) ||
    REGISTER_ID.test(text) ||
    GAP_ID.test(text) ||
    parenthesizedGap(text) ||
    REGISTER_CODE_IN_TEXT.test(text) ||
    pageCitation(text) ||
    RUN_CODE.test(text)
  );
}

// A column is hidden only when written for another module (a consumer, a next or downstream module,
// downstream use); a module's own analysis, such as its escalation consequence, is drawn. "Downstream
// module affected" is the module's own when every cell states an effect "Within this analysis".
const INTERMODULE =
  /^(?:supplied handoff|use in this module|effect on this module|consumer|downstream module|receiving module|responsible module|command|required consumer action|next commands?|next modules?|downstream consumers?|downstream handoff impact|downstream owners|affected consumers|affected modules|downstream use|consumer module id)$|^consequence for cp-/;
// "Evidence" and "Source / Limitation" columns carry either source references or the module's
// own qualification; with rows to judge, they are hidden only when the cells are references.
const MIXED_COLUMN = /^(?:evidence|sources?\s*\/\s*limitation)$/;
const SOURCE_COLUMN =
  /\bids?$|^linked pathway row$|^(?:(?:sources?|evidence)(?:\s*\/\s*(?:clause|limitation)|\s+(?:trace|locator|register|document|file|sha|hash|page|reference|ref|link)s?)?|sha256|source document name|source and basis|basis and source|source\(s\)|source row\/section\/quote|sha256 hash|where found)$|\b(?:hash(?:es)?|sha|sha256|locators?|citations?|file ?names?)\b/;

export function displayColumns(headers: string[], evidence: boolean, rows: Row[] = []) {
  return headers.flatMap((text, index) => {
    const header = text.trim().toLowerCase().replaceAll(/[-_]/g, " ").replace(/\s+/g, " ");
    if (INTERMODULE.test(header)) return [];
    const populated = rows.map((row) => row.cells[index]?.trim() ?? "").filter(Boolean);
    if (
      /^downstream modules? affected$/.test(header) &&
      !(populated.length && populated.every((cell) => /^within this analysis\b/i.test(cell)))
    )
      return [];
    const ambiguousId =
      /^(?:references?|ref\.?|code)$/.test(header) &&
      populated.length > 0 &&
      populated.filter(containsReference).length * 2 >= populated.length;
    // "Evidence" is the module's own text only beside a separate Source column; alone it names
    // the source.
    const separateSource = headers.some((other) => /^sources?$/i.test(other.trim()));
    const mixed =
      MIXED_COLUMN.test(header) &&
      (header !== "evidence" || separateSource) &&
      populated.length > 0 &&
      populated.filter(containsReference).length * 2 < populated.length;
    if (evidence || mixed) return [index];
    return !SOURCE_COLUMN.test(header) && !ambiguousId ? [index] : [];
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

export function evidenceToken(entry: { output: Pick<Output, "id" | "sha256"> }, line?: number) {
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
