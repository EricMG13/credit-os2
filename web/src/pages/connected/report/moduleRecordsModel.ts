import { moduleCodeName } from "../api";
import { unitLabel } from "../moneyUnits";
import { plainText } from "../richText";
import {
  classifySections,
  containsReference,
  readerText,
  displayColumns,
  methodNote,
  type Block,
  type OutputEntry,
  type Section,
  type Table,
} from "../publishedReport";
import { drawingLines, drawingTitle, registerBlocks } from "../ReportContent";

/** The tabs of a module's records region, in their order. */
export const RECORD_KINDS = [
  ["statements", "Statements"],
  ["registers", "Registers"],
  ["calculations", "Calculations"],
  ["charts", "Chart tables"],
] as const;
export type RecordKind = (typeof RECORD_KINDS)[number][0];

type TextBlock = Extract<Block, { type: "text" }>;

/** One table of the region: its kind, its title as drawn, and the prose of its section. */
export interface RecordTable {
  kind: RecordKind;
  title: string;
  section: Section;
  table: Table;
  notes: TextBlock[];
}

/** A register the module page lists by name only; its table is held in Evidence. */
export interface HeldRecord {
  title: string;
  line: number;
}

/** Machinery the screen map keeps off the module page (row E), whatever role its section has. */
const EVIDENCE_ONLY =
  /source register|\bentit(?:y|ies)[ -](?:period )?keys?\b|definition conflict/i;
/** A heading that is a module's machine key (cp2.cp_model_strengths_weaknesses, cpdr.adoptions,
 * cp1_references): the module's own register name, never reader prose. */
const MACHINE_KEY = /^(?:cp(?:\d[a-z0-9]*|dr)?[._])+[a-z0-9_.]+$/;
const MACHINE_PREFIX = /^(?:cp(?:\d[a-z0-9]*|dr)?[._])+/;
const NO_QUALIFICATION = "No qualification.";

function descriptorTitles(entry: OutputEntry) {
  const titles = new Map<number, string>();
  const { charts = [], chartGaps = [], events = [], maps = [] } = entry.output;
  for (const item of [...charts, ...chartGaps, ...events, ...maps]) {
    const title = [item.title, item.lane, item.name].find((value) => typeof value === "string");
    if (typeof title === "string" && title.trim() && !titles.has(item.table))
      titles.set(item.table, title.trim());
  }
  return titles;
}

/**
 * Analytical registers the screen map ranks on their module's own page (§ Modules, "Also show"
 * and "On demand"): kept in the records region although their heading says "register" or
 * "ledger". Every other register stays in Evidence.
 */
const PAGE_REGISTERS: Record<string, RegExp> = {
  "CP-0": /source assessment|source timeline/i,
  "CP-1B": /variance/i,
  "CP-1D": /add-?back/i,
  "CP-2E": /hedg/i,
  "CP-2H": /rating register|trigger/i,
  "CP-4": /document register|legal event/i,
};

function onModulePage(module: string, heading: string) {
  return Object.hasOwn(PAGE_REGISTERS, module) && Boolean(PAGE_REGISTERS[module]?.test(heading));
}

function kindOf(
  role: string,
  heading: string,
  drawn: boolean,
  module: string,
): RecordKind | "evidence" | null {
  if (role === "calculations") return "calculations";
  if (role === "drawing") return "charts";
  if (role === "registers")
    return drawn || (onModulePage(module, heading) && !heldInEvidence(heading, role))
      ? "registers"
      : "evidence";
  if (role !== "finding" && role !== "passage") return null;
  return heldInEvidence(heading, role) ? "evidence" : "statements";
}

function sectionNotes(section: Section) {
  return section.blocks.filter(
    (block): block is TextBlock =>
      block.type === "text" &&
      !methodNote(block.text) &&
      block.text.trim() !== NO_QUALIFICATION &&
      !block.text.startsWith("```"),
  );
}

/**
 * The module's tables for its records region, by kind, in handoff order; and the registers held
 * in Evidence. Every table of a reader section lands in exactly one of the two.
 */
export function moduleRecords(entry: OutputEntry) {
  const charted = drawingLines(entry);
  const titles = descriptorTitles(entry);
  const tables: RecordTable[] = [];
  const evidence: HeldRecord[] = [];
  for (const { section, role } of classifySections(entry.sections)) {
    // The credit screening lead draws the five screens with their table view; the region holds no copy.
    if (section.screen) continue;
    const own = section.blocks.filter((block): block is Table => block.type === "table");
    const drawn = registerBlocks(section, entry);
    const title = readableTitle(section.heading);
    for (const table of own) {
      const kind = charted.has(table.line)
        ? "charts"
        : kindOf(role, section.heading, drawn.includes(table), entry.output.module);
      if (kind === null) continue;
      if (kind === "evidence") {
        if (!evidence.some(({ line }) => line === section.line))
          evidence.push({ title, line: section.line });
        continue;
      }
      const named = titles.get(table.line);
      tables.push({
        kind,
        title: named === undefined ? title : readableTitle(named),
        section,
        table,
        notes: sectionNotes(section),
      });
    }
  }
  return { tables: distinctTitles(tables, " · table "), evidence: distinctTitles(evidence, " · ") };
}

/** The handoff's register codes at the start of a heading (T4.18, T2B.7, T2DS.6, TL10.2, P3), with
 * the dash that follows. A heading that only starts with a letter and digits ("Q4 2025") keeps them. */
const REGISTER_CODE =
  /^(?:(?:TL|T|P)[A-Z0-9]{0,5}\.\d+(?:\.\d+)?(?:\s*[-–—:]\s*|\s+)|(?:TL|T|P)[A-Z0-9]{0,5}\s*[-–—:]\s+)/;
const PARENTHESISED = /\s*\([^()]*\)/g;
const CLAUSE = /\s+(?:per|from|in|see)\s|\s+source:\s*|\s+[\u2013\u2014]\s/gi;
const LOOSE_END = /[\s,;:\u2013\u2014-]+$/;

/** A snake_case table id (transaction_summary) as the words it stands for, the first capitalised. */
function wordsOfIds(title: string) {
  const words = title.replace(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g, (id) =>
    id.replaceAll("_", " "),
  );
  return words === title ? title : words.charAt(0).toUpperCase() + words.slice(1);
}

/** A dotted register code inside prose ("drawn from T4.18 rows"): machinery, not a word. */
/** A dotted token before a magnitude word ("P2.5 billion", "T1.5 m") is a number, not a code. */
const DOTTED = String.raw`\b(?:TL|T|P)[A-Z0-9]{0,5}\.\d+(?:\.\d+)?\b(?!\s*(?:(?:billion|million|bn|m|turns|x)\b|%))`;
const CODES = String.raw`${DOTTED}(?:\s*(?:,|and|&|/|or)\s*${DOTTED})*`;
const ANY_CODE = new RegExp(DOTTED);
/** The register heading prefix the launcher accepts: an optional "1." or "1)", then one code or a
 * list of them, with the dash that follows. */
const REGISTER_LEAD = new RegExp(String.raw`^(?:\d+[.)]\s+)?(?:${CODES})\s*(?:[-–—:]\s*)?`);
/** A code that names the rows it qualifies ("drawn from T4.18 rows only") goes alone. */
const LABEL_CODE = new RegExp(
  String.raw`\s?${DOTTED}(?=\s+(?:rows?|lines?|entries|table|register|schedule)\b)`,
  "g",
);
/** A code read as a possessive ("T4.18's annex") leaves no sentence: it marks the cut unclean. */
const POSSESSIVE_CODE = new RegExp(String.raw`${DOTTED}['\u2019]s\b`, "g");
/** A bracket that holds nothing but codes: it goes whole. */
const CODE_BRACKET = new RegExp(String.raw`\s*\(\s*${CODES}\s*\)`, "g");
/** A citation of codes by the word that governs it ("in T4.18", "per T4.18 and TDR.3", ", see
 * T4.18,"), where the codes end the phrase; a code that names the rows after it goes alone. */
const CITATION = new RegExp(
  String.raw`(,\s*)?\s*\b(?:in|per|see|from|cf\.?|according to)\s+${CODES}(\s*,)?` +
    String.raw`(?=\s*(?:[,;:.!?)]|$)|\s+(?:is|are|was|were|has|have|had|but|so|which|that)\b)`,
  "gi",
);
/** What a cut can leave that no sentence has: a dangling preposition or qualifier, a preposition
 * before a conjunction or verb, an empty bracket, a space or a second mark after punctuation, a
 * stray possessive, or a sentence that opens on punctuation. */
const UNCLEAN =
  /\b(?:in|per|see|from|of|by|at|to|and|or|with|on|under|cf|not|no|nor|only|both|than|unlike|excluding|including|because|between)\s*(?=[,;:.!?)]|$)|\b(?:in|per|see|from|of|by|at|to|with|on|under)\s+(?:and|or|but|so|is|are|was|were)\b|\(\s*\)|\s[,;:.!?]|[,;:]\s*[.;:!?]|(?:^|\s)['\u2019]|^[,;:.]/gi;
/** Whether the cut added a mark of a broken sentence the module's own text did not have. */
const brokenBy = (cut: string, text: string) =>
  [...cut.matchAll(UNCLEAN)].length > [...text.matchAll(UNCLEAN)].length;
const IN_OR_FROM = /^[,\s]*(?:in|from)\b/i;

/** Whether a text names a dotted register code. */
export const holdsCode = (text: string) => ANY_CODE.test(text);

/** Prose as the page draws it: without the source it cites and the register codes it names, each
 * with its bracket or the word that cites it. Empty, so the surface links to Evidence, where a
 * code stands in the sentence itself, where more than one in/from citation is cut, or where the
 * cut leaves no clean sentence. */
export function proseWithoutMachinery(text: string) {
  let located = 0;
  const codeless = text
    .replace(POSSESSIVE_CODE, "()")
    .replace(CODE_BRACKET, "")
    .replace(CITATION, (match: string, lead?: string, trail?: string) => {
      if (IN_OR_FROM.test(match)) located += 1;
      return lead || !trail ? "" : ",";
    })
    .replace(LABEL_CODE, "");
  if (located > 1 || holdsCode(codeless)) return "";
  const { masked, unmask } = holdFigures(codeless);
  const bare = withoutReference(masked)
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!bare || containsReference(bare)) return "";
  const cut = unmask(bare);
  return brokenBy(cut, text) ? "" : readerText(cut);
}

/** A figure before a magnitude word ("P2.5 billion") reads to the page-citation test as a page. */
const MAGNITUDE = /\b[A-Z]{1,2}\d+(?:\.\d+)?(?=\s*(?:(?:billion|million|bn|m|turns|x)\b|%))/g;
const HELD = /\uE000(\d+)\uE001/g;

/** The text with each such figure held aside behind a mark no reference test reads, and the way back. */
function holdFigures(text: string) {
  const figures: string[] = [];
  const masked = text.replace(
    MAGNITUDE,
    (figure) => `\uE000${String(figures.push(figure) - 1)}\uE001`,
  );
  const unmask = (held: string) => held.replace(HELD, (_, at: string) => figures[Number(at)] ?? "");
  return { masked, unmask };
}

/** Whether a text cites a source file or page, a figure before a magnitude word not counted. */
export const citesSource = (text: string) => containsReference(holdFigures(text).masked);

/** The title without its cited source: a parenthesised reference, then a trailing clause that
 * cites one, then any word that is one. */
export function withoutReference(title: string) {
  if (!containsReference(title)) return title;
  const bare = title.replace(PARENTHESISED, (group) => (containsReference(group) ? "" : group));
  const cuts = [...bare.matchAll(CLAUSE)].filter(({ index }) =>
    containsReference(bare.slice(index)),
  );
  const cut = cuts.at(-1);
  const head = cut === undefined ? bare : bare.slice(0, cut.index);
  if (!containsReference(head)) return head.replace(LOOSE_END, "");
  const words = head.split(/\s+/).filter((word) => !containsReference(word));
  return words.join(" ").replace(LOOSE_END, "");
}

/** A heading as the reader sees it: no drawing prefix or register code, module names for codes,
 * and the title's own words without the source it cites, which belongs in Evidence. */
export function readableTitle(heading: string, untitled = "Untitled table") {
  const plain = plainText(heading);
  const bare = MACHINE_KEY.test(heading.trim())
    ? heading.trim().replace(MACHINE_PREFIX, "").replace(/[_.]+/g, " ")
    : null;
  // The key's module prefix names where the table came from: "cp1_references" is that module's references.
  const from = /^cp(\d[a-z0-9]*|dr)?(?=[._])/.exec(heading.trim().toLowerCase());
  const owner = from ? moduleCodeName(`CP-${(from[1] ?? "").toUpperCase()}`) : null;
  const key =
    bare === null
      ? null
      : owner
        ? `${owner} ${bare}`
        : bare.charAt(0).toUpperCase() + bare.slice(1);
  const lead = key === null && REGISTER_LEAD.test(plain);
  const stripped =
    key ??
    (lead
      ? plain.replace(REGISTER_LEAD, "").replace(REGISTER_CODE, "") // a range "T4.4-T4.6" has two
      : plainText(drawingTitle(heading)).replace(REGISTER_CODE, ""));
  // A title left after its code begins with a capital ("TDR.3 limitations" → "Limitations") where
  // its first word is all lower-case ("iPhone revenue" stays);
  // drawingTitle takes the code too, so the test reads the heading without its drawing prefix.
  const coded = wordsOfIds(
    (lead || REGISTER_CODE.test(plainText(heading).replace(DRAWING_PREFIX, ""))) &&
      /^[a-z]+(?=\s|$)/.test(stripped)
      ? stripped.charAt(0).toUpperCase() + stripped.slice(1)
      : stripped,
  );
  // A leading name such as "P3 programme" reads to the page-citation test as "p 3": a name, not
  // a source, when the rest of the title cites none.
  const name = LEADING_NAME.exec(coded)?.[0] ?? "";
  const rest = coded.slice(name.length);
  const title = readerText(name + withoutReference(rest)).trim();
  return title && !containsReference(title.slice(name.length)) ? title : untitled;
}

/** The drawing prefix ReportContent's drawingTitle removes. */
const DRAWING_PREFIX = /^(?:Chart data|Map|Events): /;
const LEADING_NAME = /^[A-Z]{1,3}\d+[A-Z]?\s+(?=\S)/;

/** Whether a section of this heading and role is listed under "Held in Evidence" by its heading:
 * a source register, entity keys or definition conflicts never reach the module page. */
export function heldInEvidence(heading: string, role: string) {
  return (
    ["finding", "passage", "registers"].includes(role) &&
    (EVIDENCE_ONLY.test(heading) || MACHINE_KEY.test(heading.trim()))
  );
}

/** Tables that share a title, anywhere in the handoff, are told apart by their place among them. */
function distinctTitles<Item extends { title: string }>(items: Item[], joiner: string) {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const count = (seen.get(item.title) ?? 0) + 1;
    seen.set(item.title, count);
    return count > 1 ? { ...item, title: `${item.title}${joiner}${String(count)}` } : item;
  });
}

const GAP_CELL = /^(?:not\b|n\/?a\b|withheld\b|none\b|—$|-$)/i;
const NUMBER = /^(\()?(-)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(\))?$/;
const AMOUNT_HEADER =
  /principal|amount|debt|cash|balance|commitment|drawn|maturing|liquidity|outstanding|(?:carrying|market|face|fair|book) value|revenue|sales|ebitda|flow|capex|proceeds/i;
const NOT_AMOUNT =
  /\/|ratio|bps|%|rate|spread|margin|coupon|floor|multiple|cover|leverage|date|year|period|unit|basis|source|tier|status|growth|cagr|change|conversion|days|yield|\(x\)|\bto (?:ebitda|revenue|sales|equity|capital)\b/i;
/** A column of places, tests or tallies: its figures are no amounts ("Debt maturing" is one). */
const NOT_AMOUNT_WORD = /\b(?:rank|test|maturity|order|number|count|score)|#/i;
/** A column that states each row's currency or unit: figures in two of them share no scale. */
const UNIT_HEADER = /^(?:currency|unit|reporting unit|units?|ccy)$/i;
const PERIOD_HEADER = /^(?:FY|H[12] |Q[1-4] |LTM |20\d\d)/;
/** Rows that are different measures, a bridge, or totals: their figures are not peers. */
const MEASURES_HEADER = /^(?:item|items|metric|metrics|measure|line item|kpi|indicator)s?$/i;
const BRIDGE = /bridge|waterfall|walk|reconciliation/i;
const BRIDGE_ROW = /^(?:opening|closing|starting|ending)\b/i;
/** A row's own label, whole, that names a total; never a word inside another name ("Power &
 * Control"), nor "Net …" or "Less …", which begin names ("Net sales Americas", "Less than one year"). */
const TOTAL_LABEL =
  /^(?:(?:sub-?)?totals?|sum|group|consolidated|aggregate|combined)$|^(?:sub-?)?totals?\s|\s(?:sub-?)?totals?$/i;
/** The handoff's own mark that a row is no peer of the others. */
const MARKED = /not additive|\baggregate control\b/i;

/** A cell's number exactly as written, or null for text that is not one plain number. */
function amount(cell: string) {
  const match = NUMBER.exec(cell.trim());
  if (!match) return null;
  const [, open, minus, whole = "", fraction = "", close] = match;
  if (Boolean(open) !== Boolean(close) || (open && minus)) return null;
  const value = Number(whole.replaceAll(",", "") + fraction);
  return open || minus ? -value : value;
}

const isGap = (cell: string) => cell.trim() === "" || GAP_CELL.test(cell.trim());
const isYear = (value: number) => Number.isInteger(value) && value >= 1900 && value <= 2100;

/** How long a cell's bar is against its column: null for a gap or a row that is no peer (a
 * total, subtotal, aggregate or control), which draws no bar. */
export interface AmountColumn {
  share: (cell: string, line?: number) => number | null;
  negative: (cell: string) => boolean;
}

/** The column's one scale, its largest peer figure; null where it draws no bar. */
function largestOf(cells: string[], peers: string[]) {
  const values = peers.flatMap((cell) => {
    const value = amount(cell);
    return value === null ? [] : [value];
  });
  // One figure has nothing to be compared with: it draws no bar; nor do years that look like amounts.
  if (values.length < 2 || cells.some((cell) => amount(cell) === null && !isGap(cell))) return null;
  if (values.every(isYear) || holdsUnlabelledTotal(values)) return null;
  const largest = Math.max(...values.map(Math.abs));
  return largest === 0 ? null : largest;
}

const label = (cell: string) =>
  cell
    .trim()
    .replace(/^\*\*(.*)\*\*$/, "$1")
    // A footnote mark is the handoff's note on the row, not part of its name ("Total¹").
    .replace(/[\u00b9\u00b2\u00b3\u2074-\u2079*\u2020\u2021]+$/u, "")
    .replace(/[:.]$/, "")
    .trim();
const bold = (cell: string) => /^\*\*.+\*\*$/.test(cell.trim());

/** A row's name: its first shown cell that holds text, not a number or a gap mark (a rank, or
 * the "—" a rank column holds on a total, comes before it). */
const rowName = (cells: string[], columns: number[]) =>
  columns
    .map((column) => cells[column] ?? "")
    .find((cell) => !isGap(cell) && amount(cell) === null) ?? "";

type Excluded = { name: string; reason: "total" | "marked" };

/** The rows that are no peers of the others: a row whose name is, whole, a total word, or a bold
 * row, and every row after the last of those, below the line; and a row the module marks as not
 * additive or an aggregate control, which leaves out only itself. Rows between subtotals stay
 * peers. Never guessed from a word inside a name. */
function notPeers(table: Table, columns: number[]) {
  const named = ({ cells }: Table["rows"][number]) => {
    const name = rowName(cells, columns);
    return TOTAL_LABEL.test(label(name)) || bold(name);
  };
  const marked = ({ cells }: Table["rows"][number]) =>
    columns.some((column) => {
      const cell = cells[column] ?? "";
      return !isGap(cell) && MARKED.test(cell);
    });
  const last = table.rows.map(named).lastIndexOf(true);
  return new Map(
    table.rows.flatMap((row, at): [number, Excluded][] => {
      const name = label(rowName(row.cells, columns));
      if (named(row) || (last !== -1 && at > last)) return [[row.line, { name, reason: "total" }]];
      return marked(row) ? [[row.line, { name, reason: "marked" }]] : [];
    }),
  );
}

/** Whether one row of the column is the sum of the others: an unlabelled total, so no bars. */
function holdsUnlabelledTotal(values: number[]) {
  if (values.length < 3) return false;
  const sum = values.reduce((total, value) => total + value, 0);
  return values.some(
    (value) => Math.abs(value - (sum - value)) <= Math.max(1, Math.abs(value) / 1000),
  );
}

/** A bridge or a list of different measures: its figures share no scale, whatever the header. */
function unlikeRows(table: Table, columns: number[], title: string) {
  const first = columns[0] ?? 0;
  const labels = table.rows.map(({ cells }) => cells[first] ?? "");
  const header = (table.headers[first] ?? "").trim();
  return (
    MEASURES_HEADER.test(header) ||
    BRIDGE.test(title) ||
    [header, ...labels].some((label) => BRIDGE.test(label)) ||
    labels.some((label) => BRIDGE_ROW.test(label.trim()))
  );
}

const amountHeader = (header: string) =>
  AMOUNT_HEADER.test(header) &&
  !NOT_AMOUNT.test(header) &&
  !NOT_AMOUNT_WORD.test(header) &&
  !PERIOD_HEADER.test(header);

/** The table's amount columns by index: a header that names an amount, every cell a number or a
 * gap, in a table whose rows are like items; totals and aggregate rows set no scale and draw no bar. */
export function amountColumns(table: Table, title = "") {
  const columns = new Map<number, AmountColumn>();
  const shown = displayColumns(table.headers, false, table.rows);
  if (mixedUnits(table) || unlikeRows(table, shown, title)) return columns;
  const skipped = notPeers(table, shown);
  const peers = table.rows.filter(({ line }) => !skipped.has(line));
  for (const index of shown) {
    if (!amountHeader(table.headers[index] ?? "")) continue;
    const cellsOf = (rows: Table["rows"]) => rows.map(({ cells }) => cells[index] ?? "");
    const largest = largestOf(cellsOf(table.rows), cellsOf(peers));
    if (largest === null) continue;
    columns.set(index, {
      share: (cell, line) => {
        const value = line !== undefined && skipped.has(line) ? null : amount(cell);
        return value === null ? null : Math.abs(value) / largest;
      },
      negative: (cell) => (amount(cell) ?? 0) < 0,
    });
  }
  return columns;
}

const SCALES: [RegExp, string][] = [
  [/\b(?:thousands?|k)\b/i, "thousand"],
  [/\b(?:millions?|mn|mm|m)\b/i, "million"],
  [/\b(?:billions?|bn|b)\b/i, "billion"],
];

/** A unit cell by its currency where it names one (US$ and $ are USD), else its words. */
function unitKey(cell: string) {
  const code = /\b[A-Z]{3}\b/.exec(cell)?.[0] ?? (/US\$|\$/.test(cell) ? "USD" : null);
  return code ?? cell.trim().toLowerCase();
}

const scaleOf = (cell: string) => SCALES.find(([pattern]) => pattern.test(cell))?.[1];

function mixedUnits(table: Table) {
  return table.headers.some((header, index) => {
    if (!UNIT_HEADER.test(header.trim())) return false;
    const cells = table.rows.map(({ cells: row }) => (row[index] ?? "").trim()).filter(Boolean);
    const scales = new Set(cells.flatMap((cell) => scaleOf(cell) ?? []));
    return new Set(cells.map(unitKey)).size > 1 || scales.size > 1;
  });
}

/** A number as a table writes one: commas, a sign, parentheses, and a trailing %, x or bps. */
const NUMERAL = /^[+\-−]?\(?[+\-−]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\)?\s?(?:%|x|bps)?$/i;

/** Columns whose every cell that is not blank or a stated gap is a number: drawn as numerals. */
export function numericColumns(table: Table) {
  const columns = new Set<number>();
  table.headers.forEach((_, index) => {
    const cells = table.rows.map(({ cells: row }) => (row[index] ?? "").trim());
    const figures = cells.filter((cell) => !isGap(cell));
    if (figures.length && figures.every((cell) => NUMERAL.test(cell))) columns.add(index);
  });
  return columns;
}

/** A table's cell drawer for its unit columns: a money unit as the currency's symbol ("$m"); any
 * other cell undefined, so the cell is drawn as written. */
export function unitCells(table: { headers: readonly string[] }) {
  const columns = new Set(
    table.headers.flatMap((header, column) => (UNIT_HEADER.test(header.trim()) ? [column] : [])),
  );
  return (column: number, cell: string) => {
    const written = cell.trim();
    const drawn = columns.has(column) ? unitLabel(written) : written;
    return drawn === written ? undefined : drawn;
  };
}

/** A unit column that states one value in every row: the page states it once, above the table. */
export function unitColumn(table: Table) {
  for (const [column, text] of table.headers.entries()) {
    const header = text.trim();
    if (!UNIT_HEADER.test(header) || !table.rows.length) continue;
    const values = new Set(table.rows.map(({ cells }) => (cells[column] ?? "").trim()));
    const [value = ""] = values;
    if (values.size === 1 && value) return { column, header, value };
  }
  return null;
}

/** The columns a wide register shows first: rank, principal, coupon, maturity, in that order. */
const COMPACT = [
  [/rank/i, /security/i],
  [/principal/i, /amount/i, /carrying value/i],
  [/coupon/i, /margin/i, /rate(?!\s*type)/i],
  [/maturity/i],
];
const COMPACT_ABOVE = 7;

/** A register wider than seven columns opens on its first column and the mockup's few, or else its
 * first six; null when every column fits. */
export function compactColumns(table: Table, shown: readonly number[]) {
  if (shown.length <= COMPACT_ABOVE) return null;
  const [first, ...rest] = shown;
  if (first === undefined) return null;
  const chosen: number[] = [];
  for (const group of COMPACT) {
    const pick = group
      .map((pattern) => rest.find((column) => pattern.test(table.headers[column] ?? "")))
      .find((column) => column !== undefined && !chosen.includes(column));
    if (pick !== undefined) chosen.push(pick);
  }
  return chosen.length >= 2 ? [first, ...chosen] : shown.slice(0, 6);
}

const STATED_GAP =
  /^(not (?:supplied|stated|calculable|modell?ed|applicable|established|available|disclosed|extracted|provided|reported)|withheld)(?=$|[\s:;,.])/i;

/** The leading words of a stated gap ("Not supplied: …" → "Not supplied"), or null. */
export function statedGap(cell: string) {
  return STATED_GAP.exec(cell.trim())?.[1] ?? null;
}

/** The labels of the rows a table's bars leave out, for the note under it; none without bars. */
function excluded(table: Table, title: string) {
  if (!amountColumns(table, title).size) return [];
  return [...notPeers(table, displayColumns(table.headers, false, table.rows)).values()];
}

export function barExclusions(table: Table, title = "") {
  return excluded(table, title).map(({ name }) => name);
}

const WHY = { total: "totals and rows below them", marked: "not additive" } as const;

/** The line under a barred table: one scale per column, and the rows without a bar by reason. */
export function scaleNote(table: Table, title = "") {
  const left = excluded(table, title);
  const parts = (["total", "marked"] as const).flatMap((reason) => {
    const names = left
      .filter((item) => item.reason === reason && item.name)
      .map(({ name }) => readerText(name));
    return names.length ? [` No bar (${WHY[reason]}): ${names.join(", ")}.`] : [];
  });
  return `Bars: one scale per column.${parts.join("")}`;
}
