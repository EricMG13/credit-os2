import { UNNAMED_MODULE } from "../../api";
import {
  classifySections,
  comparisonRows,
  containsReference,
  evidencePath,
  methodNote,
  passages,
  readParagraph,
  readerText,
  type OutputEntry,
  type PublishedChanges,
} from "../../publishedReport";
import { namedTable } from "../../reportView";
import type { Block, Table } from "../../publishedReport";
import { changeSign, tone } from "../../signal";
import { amount } from "../../visuals/visualData";

export type MeasureTone = "better" | "worse" | "flat";

/** What the CP-8 issuer table says about one measure's cause. */
export type Cause =
  | { kind: "written"; text: string }
  /** The cell cites a source: the page links to it in Evidence instead of drawing it. */
  | { kind: "referenced" }
  /** The row was found and its cell is empty. */
  | { kind: "absent" }
  /** The module wrote a dash: it is a dash, not a gap. */
  | { kind: "dash" }
  /** No row of the issuer table carries this measure's name. */
  | { kind: "unmatched" }
  /** The comparison module has no handoff in this run: said once on the page, not per row. */
  | { kind: "noModule" };

export type MeasureChange = {
  /** Where the measure sits in the pack, so a table row finds its own item. */
  index: number;
  key: string;
  label: string;
  /** The earlier and current figures as the pack states them, period included. */
  before: string;
  after: string;
  /** The same figures as numbers for drawing; null where the pack gives none. */
  beforeValue: number | null;
  afterValue: number | null;
  delta: string | null;
  /** The direction of the comparison's difference; null where `delta` is null. */
  sign: -1 | 0 | 1 | null;
  tone: MeasureTone | null;
  /** The comparability sentence of the verdict; a reference is replaced by a pointer to Evidence. */
  reason: string;
  cause: Cause;
  /** The effect on the credit view, in the states a fact's effect has; null where there is no comparison row to read. */
  effect: Cause | null;
  href: string | undefined;
};

type MeasureGroups = {
  moved: MeasureChange[];
  revised: MeasureChange[];
  unmoved: MeasureChange[];
  notAssessable: MeasureChange[];
};

/** The cause the comparison writes when it cannot attribute a difference. */
export const UNRESOLVED = "Unresolved";

/** The module's words: a module named where it is cited, and a bracketed code the reader does not know dropped. */
/** A module code as the methodology names them: CP-2A, CP-L10, CP-DR, CP-MEMO. */
const MODULE_CODE = /\s*\(CP-(?:\d+[A-Z]?|L\d+|DR|MEMO|MODEL|OS|PARSE)\)/gi;

/** The bracket the shared reader leaves where it has no name for a bracketed code. */
const UNNAMED_BRACKET = ` (${UNNAMED_MODULE})`;

export const words = (text: string) =>
  readerText(text).replace(MODULE_CODE, "").replaceAll(UNNAMED_BRACKET, "");

/** A comparison's stated problem for the reader: a problem that cites a file or path is not drawn. */
export const problemSentence = (problem: string) =>
  containsReference(problem) ? "The comparison could not be read." : words(problem);

const plain = (text = "") =>
  text.replaceAll("**", "").replaceAll("`", "").trim().replace(/\s+/g, " ");
const nothing = (text: string) => text === "" || /^[—–-]$/.test(text);

function causeOf(cell: string | undefined): Cause {
  const text = words(plain(cell));
  if (text === "") return { kind: "absent" };
  if (nothing(text)) return { kind: "dash" };
  return containsReference(text) ? { kind: "referenced" } : { kind: "written", text };
}

/** A written cell in the module's words; null for a placeholder or a cell that cites a source. */
function written(cell: string | undefined) {
  const text = words(plain(cell));
  return nothing(text) || containsReference(text) ? null : text;
}

/** A label compared on the whole: module names applied, marks, case and spacing normalised. */
const fullKey = (text = "") => words(plain(text)).toLowerCase().replace(/\s+/g, " ").trim();

/** The label without a trailing "(unit)", only where that bracket is the measure's own unit. */
function withoutUnit(key: string, unit: string | null | undefined) {
  const own = (unit ?? "").trim().toLowerCase();
  return own && key.endsWith(`(${own})`) ? key.slice(0, key.length - own.length - 2).trim() : key;
}

type IssuerRow = { cells: string[]; line: number };

function issuerTable(entry: OutputEntry | undefined) {
  return (
    entry &&
    namedTable(entry, "What changed: the issuer", [
      "Measure or fact",
      "Earlier",
      "Current",
      "Cause",
      "Effect on the credit view",
    ])
  );
}

type PackMeasure = NonNullable<NonNullable<PublishedChanges["pack"]>["measures"]>[number];

/**
 * Each pack measure's own row of the issuer table, matched on the whole label (a trailing bracket is
 * trimmed only where it is the measure's own unit). A measure with two candidate rows, or a row
 * claimed by two measures, matches none: both stay unmatched rather than take a wrong cause.
 */
function matchRows(measures: readonly PackMeasure[], rows: readonly IssuerRow[]) {
  const candidates = measures.map((measure) => {
    const unit = measure.unit ?? measure.current?.unit ?? measure.prior?.unit;
    const wanted = new Set([fullKey(measure.label), withoutUnit(fullKey(measure.label), unit)]);
    return rows.filter(({ cells }) => {
      const key = fullKey(cells[0]);
      return wanted.has(key) || wanted.has(withoutUnit(key, unit));
    });
  });
  const claims = new Map<IssuerRow, number>();
  for (const list of candidates)
    for (const row of list) claims.set(row, (claims.get(row) ?? 0) + 1);
  return candidates.map((list) => {
    const [only] = list;
    return list.length === 1 && only && claims.get(only) === 1 ? only : undefined;
  });
}

/** The pack's own reading of comparability, as `comparisonRows` applies it. */
function comparable(
  change: PublishedChanges,
  measure: NonNullable<NonNullable<PublishedChanges["pack"]>["measures"]>[number],
) {
  return (
    change.verdicts?.measures?.[measure.key]?.kind === "comparable" &&
    (measure.prior?.unit ?? null) === (measure.current?.unit ?? null) &&
    measure.comparable !== "no" &&
    measure.prior?.value != null &&
    measure.current?.value != null
  );
}

export type MeasureMatches = MeasureGroups & { matchedLines: Set<number> };

/** The pack's measures in the pack's order, grouped by what the pack says about each. */
export function classifyMeasures(
  change: PublishedChanges,
  trace: (label: string) => string | undefined,
  entry?: OutputEntry,
  folder = "",
): MeasureMatches {
  const rows = comparisonRows(change, "reader");
  const measures = change.pack?.measures ?? [];
  const matched = matchRows(measures, issuerTable(entry)?.rows ?? []);
  const groups: MeasureMatches = {
    moved: [],
    revised: [],
    unmoved: [],
    notAssessable: [],
    matchedLines: new Set(),
  };
  measures.forEach((measure, index) => {
    const [label = measure.label, before = "", after = "", delta = "—", reason = "", effect = ""] =
      rows[index] ?? [];
    const issuer = matched[index];
    if (issuer) groups.matchedLines.add(issuer.line);
    const sign = measure.difference == null ? null : changeSign(String(measure.difference));
    const shown = delta !== "—";
    const toned = shown && sign !== null ? tone(measure.key, String(measure.difference)) : "none";
    const revision = reason.endsWith("Same-period analysis change");
    const cause: Cause = !entry
      ? { kind: "noModule" }
      : issuer
        ? causeOf(issuer.cells[3])
        : { kind: "unmatched" };
    // The comparison's own "Unresolved" says it cannot tell why the figure differs, so the page
    // does not call the difference better or worse: the direction is not established.
    const unresolved = cause.kind === "written" && cause.text === UNRESOLVED;
    const item: MeasureChange = {
      index,
      key: measure.key,
      label,
      before,
      after,
      beforeValue: amountOf(measure.prior?.value),
      afterValue: amountOf(measure.current?.value),
      delta: shown && sign !== null ? delta : null,
      sign: shown ? sign : null,
      tone: toned === "none" || unresolved ? null : toned,
      reason: stated(reason.replace(/ · Same-period analysis change$/, "")),
      cause,
      effect:
        !entry || (!issuer && !written(effect))
          ? null
          : written(effect)
            ? { kind: "written", text: written(effect) ?? "" }
            : causeOf(issuer?.cells[4]),
      href: !entry
        ? trace(label)
        : issuer
          ? evidencePath(folder, entry, issuer.line)
          : evidencePath(folder, entry, issuerTable(entry)?.line),
    };
    if (!comparable(change, measure) || sign === null) groups.notAssessable.push(item);
    else if (revision && sign !== 0) groups.revised.push(item);
    else if (sign !== 0) groups.moved.push(item);
    else groups.unmoved.push(item);
  });
  return groups;
}

function stated(reason: string) {
  return containsReference(reason) ? "See comparison evidence." : words(reason);
}

function amountOf(value: string | number | null | undefined) {
  return value == null ? null : amount(String(value));
}

export type StatusColumn = "unchanged" | "revised" | "new" | "missing";

const COLUMNS: Record<string, StatusColumn> = {
  Unchanged: "unchanged",
  Strengthened: "revised",
  Weakened: "revised",
  Reversed: "revised",
  New: "new",
  "Not run this time": "missing",
};

/** Which column of the module matrix a CP-8 status belongs to; none for a status it does not name. */
export function statusColumn(status: string): StatusColumn | null {
  return Object.hasOwn(COLUMNS, status) ? (COLUMNS[status] ?? null) : null;
}

/** A cell of a CP-8 register in the module's words, or the fact that it cites a source or is empty. */
export type Cell = Cause;

const cellOf = causeOf;

/**
 * The issuer-table rows that are not one of the pack's measures (a new facility, an outlook), and the
 * contract's own "No material change" row, which is the module saying nothing changed, not a fact.
 */
export function issuerFacts(
  entry: OutputEntry | undefined,
  folder: string,
  matchedLines: ReadonlySet<number>,
) {
  const table = issuerTable(entry);
  const facts: {
    line: number;
    href: string;
    label: Cell;
    before: Cell;
    after: Cell;
    cause: Cell;
    effect: Cell;
  }[] = [];
  const noChange: { reason: Cell; href: string }[] = [];
  if (!entry || !table) return { facts, noChange };
  for (const { cells, line } of table.rows) {
    if (matchedLines.has(line)) continue;
    const href = evidencePath(folder, entry, line);
    if (fullKey(cells[0]) === "no material change") {
      const cause = cellOf(cells[3]);
      const effect = cellOf(cells[4]);
      // The module may write its reason in the Cause cell and leave Effect a dash.
      const none = cause.kind === "written" && cause.text.toLowerCase() === "none";
      const reason =
        effect.kind === "written"
          ? effect
          : (cause.kind === "written" && !none) || cause.kind === "referenced"
            ? cause
            : effect;
      noChange.push({ reason, href });
      continue;
    }
    facts.push({
      line,
      href,
      label: cellOf(cells[0]),
      before: cellOf(cells[1]),
      after: cellOf(cells[2]),
      cause: cellOf(cells[3]),
      effect: cellOf(cells[4]),
    });
  }
  return { facts, noChange };
}

/** The analysis-table rows, drawn where there is no pack to supply the module matrix. */
export function analysisRows(
  entry: OutputEntry | undefined,
  folder: string,
  knownCodes: ReadonlySet<string> = new Set(),
) {
  const table =
    entry && namedTable(entry, "What changed: the analysis", ["Module", "Status", "Cause", "Why"]);
  if (!entry || !table) return [];
  const code = (cell: string | undefined) => /\((CP-[^)]+)\)\s*$/.exec(plain(cell))?.[1] ?? "";
  return table.rows
    .filter(({ cells }) => !knownCodes.has(code(cells[0])))
    .map(({ cells, line }) => ({
      line,
      href: evidencePath(folder, entry, line),
      module: cellOf(cells[0]),
      status: cellOf(cells[1]),
      cause: cellOf(cells[2]),
      why: cellOf(cells[3]),
    }));
}

/** A ledger row: its text in the module's words, or null where it cites a source (then `href` is the link). */
type LedgerItem = {
  text: string | null;
  /** The Limitation cell is empty or a dash, but the row carries a status or a note. */
  missing: boolean;
  /** The ledger's own heading of the note column. */
  noteLabel: string;
  note: string | null;
  /** The status as the row wrote it. */
  status: string;
  line: number;
  href: string;
};
export type LedgerGroup = { status: string; heading: string; items: LedgerItem[] };

const NAMED = ["new", "closed", "remaining", "parked"];
const HEADING: Record<string, string> = { new: "Added", closed: "Removed" };
const statusKey = (text: string) =>
  text
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/**
 * CP-8's limitations ledger grouped by every status it uses, matched without case or marks: what was
 * added and what was removed first, then the rest. A ledger without its Limitation or Status column
 * comes back as the table as written.
 */
export function ledgerOf(
  entry: OutputEntry | undefined,
  folder: string,
): { groups: LedgerGroup[] } | { table: Table } | null {
  if (!entry) return null;
  const table = ledgerTable(entry);
  if (!table) return null;
  const at = (name: string) => table.headers.indexOf(name);
  const [limitation, status, closed] = [at("Limitation"), at("Status"), at("What closed it")];
  if (limitation < 0 || status < 0) return { table };
  const byStatus = new Map<string, { heading: string; items: LedgerItem[] }>();
  for (const { cells, line } of table.rows) {
    const empty = nothing(plain(cells[limitation]));
    const note = closed < 0 ? null : written(cells[closed]);
    if (empty && !note && nothing(plain(cells[status]))) continue;
    const raw = words(plain(cells[status]));
    const asWritten = raw === "" ? "Not stated" : raw;
    const key =
      raw === "" ? "not stated" : nothing(raw) ? "—" : statusKey(raw) || raw.toLowerCase();
    const item: LedgerItem = {
      text: written(cells[limitation]),
      missing: empty,
      note,
      noteLabel: closed < 0 ? "" : (table.headers[closed] ?? ""),
      status: asWritten,
      line,
      href: evidencePath(folder, entry, line),
    };
    const group = byStatus.get(key) ?? { heading: HEADING[key] ?? asWritten, items: [] };
    group.items.push(item);
    byStatus.set(key, group);
  }
  const rest = [...byStatus.keys()]
    .filter((key) => !NAMED.includes(key))
    .sort((a, b) => a.localeCompare(b));
  const groups = [...NAMED.filter((key) => byStatus.has(key)), ...rest].map((key) => ({
    status:
      key === "new" ? "New" : key === "closed" ? "Closed" : (byStatus.get(key)?.heading ?? key),
    heading: byStatus.get(key)?.heading ?? key,
    items: byStatus.get(key)?.items ?? [],
  }));
  return { groups };
}

/** The one ledger table of the handoff; more than one is left to `leftovers`, as written. */
function ledgerTable(entry: OutputEntry) {
  const tables = entry.sections
    .filter((section) => section.heading === "Limitations ledger")
    .flatMap(({ blocks }) => blocks)
    .filter((block): block is Table => block.type === "table");
  return tables.length === 1 ? tables[0] : undefined;
}

type Paragraph = { line: number; text: string | null; href: string };
export type PassageItem =
  | ({ kind: "text" } & Paragraph)
  | { kind: "table"; table: Table }
  | { kind: "link"; label: string; href: string };

/** The blocks of one reader passage in order; `text` is null where a paragraph cites a source. */
export function passageItems(
  entry: OutputEntry | undefined,
  heading: string,
  folder: string,
): PassageItem[] | null {
  if (!entry) return null;
  const sections = passages(entry.sections).filter((section) => section.heading === heading);
  if (sections.length === 0) return null;
  return blockItems(
    sections.flatMap(({ blocks }) => blocks),
    entry,
    folder,
  );
}

/**
 * The verdict is the first paragraph of the Bottom line, whole: splitting the module's prose would
 * be parsing its judgement. Every other block of the passage follows as body. A first paragraph
 * that cites a source is a link to Evidence, not a missing verdict.
 */
export function verdictOf(entry: OutputEntry | undefined, folder: string) {
  const items = passageItems(entry, "Bottom line", folder) ?? [];
  const first = items.find((item) => item.kind === "text");
  if (first?.kind !== "text") return null;
  return { first, body: items.filter((item) => item !== first) };
}

const REGISTER_HEADINGS = new Set([
  "What changed: the issuer",
  "What changed: the analysis",
  "Limitations ledger",
]);

/** A ledger table as written, without its reference columns: they are for Evidence. */
export function withoutReferenceColumns(table: Table): Table {
  const keep = table.headers.flatMap((header, at) =>
    /\bref(?:erence)?\b/i.test(header) ? [] : [at],
  );
  return {
    ...table,
    headers: keep.map((at) => table.headers[at] ?? ""),
    rows: table.rows.map((row) => ({ ...row, cells: keep.map((at) => row.cells[at] ?? "") })),
  };
}

function blockItems(
  blocks: Block[],
  entry: OutputEntry,
  folder: string,
  ledger = false,
): PassageItem[] {
  return blocks.flatMap((block): PassageItem[] => {
    if (block.type === "table")
      return [{ kind: "table", table: ledger ? withoutReferenceColumns(block) : block }];
    if (block.type !== "text" || methodNote(block.text)) return [];
    const body = plain(readParagraph(block.text).body);
    if (!body) return [];
    return [
      {
        kind: "text",
        line: block.line,
        text: containsReference(body) ? null : words(body),
        href: evidencePath(folder, entry, block.line),
      },
    ];
  });
}

/**
 * Whatever the comparison module wrote that no tile draws: prose under a register, an extra section,
 * a table that does not follow the contract. Drawn as written, so nothing a handoff carries is dropped.
 * A register-like section under Findings (a period table, a source context) is a link to Evidence.
 */
export function leftovers(entry: OutputEntry | undefined, folder: string) {
  if (!entry) return [];
  const used = new Set<Block>(
    [
      issuerTable(entry),
      namedTable(entry, "What changed: the analysis", ["Module", "Status", "Cause", "Why"]),
      ledgerTable(entry),
    ].filter((block): block is Table => block !== undefined),
  );
  const out: { heading: string; items: PassageItem[] }[] = [];
  let parent = "";
  for (const { section, role } of classifySections(entry.sections)) {
    if (section.level === 2) parent = section.heading;
    const register = REGISTER_HEADINGS.has(section.heading);
    let items: PassageItem[] = [];
    if (section.level >= 3 && (role === "finding" || register)) {
      items = blockItems(
        section.blocks.filter((block) => !used.has(block)),
        entry,
        folder,
        section.heading === "Limitations ledger",
      );
    } else if (
      role === "registers" &&
      !register &&
      !/^(Reader summary|Confidence inputs)$/.test(section.heading)
    ) {
      items =
        parent === "Findings"
          ? [
              {
                kind: "link",
                label: section.heading,
                href: evidencePath(folder, entry, section.line),
              },
            ]
          : blockItems(section.blocks, entry, folder);
    }
    if (items.length > 0) out.push({ heading: section.heading, items });
  }
  return out;
}
