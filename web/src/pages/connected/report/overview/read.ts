import {
  displayColumns,
  methodNote,
  passages,
  readParagraph,
  type OutputEntry,
  type PublishedRun,
  type Row,
  type Section,
  type Snapshot,
  type Table,
} from "../../publishedReport";
import { withUnit } from "../../moneyUnits";
import {
  latestReported,
  namedTable,
  periodPlace,
  type PeriodPlace,
  type ReportView,
} from "../../reportView";
import { readerCell } from "./notes";
import { readerReason } from "./reason";

/** What every Overview row is given: the published snapshot, this run and its report view. */
export type RowProps = { snapshot: Snapshot; run: PublishedRun; view: ReportView };

/** The module's designated output in this run; none when the module did not run. */
export const entryOf = (view: ReportView, module: string) =>
  view.entries.find((entry) => entry.selected && entry.output.module === module);

export type Passage = { line: number; text: string | null; cited?: true };
/**
 * A table the module wrote in a passage: a cell that cites a source is null; the columns that are
 * held in Evidence (sources, ids, text for another module) are named in `held`, never drawn.
 */
export type PassageTable = {
  line: number;
  table: { headers: string[]; rows: { line: number; cells: (string | null)[] }[] };
  held: string[];
};

const plain = (text: string) => text.replaceAll("**", "").replaceAll("`", "").trim();

/** A paragraph through the reader rule (`readerReason`); "" for one with no words at all. */
function paragraphOf(line: number, text: string): Passage {
  if (!plain(readParagraph(text).body)) return { line, text: "" };
  const words = readerReason(text);
  return words === null ? { line, text: null, cited: true } : { line, text: words };
}

/** A table as the Overview may draw it; a passage link where no column can be drawn here. */
function tableOf(table: Table): PassageTable | Passage {
  const columns = displayColumns(table.headers, false, table.rows);
  if (!columns.length) return { line: table.line, text: null };
  const cell = (text: string) => (text.trim() ? readerCell(text) : "");
  const header = (text: string) => readerCell(text) ?? "A column named in Evidence";
  const held = table.headers.flatMap((name, at) => (columns.includes(at) ? [] : [header(name)]));
  return {
    line: table.line,
    held,
    table: {
      headers: columns.map((at) => header(table.headers[at] ?? "")),
      rows: table.rows.map(({ line, cells }) => ({
        line,
        cells: columns.map((at) => cell(cells[at] ?? "")),
      })),
    },
  };
}

/**
 * What a module wrote under one reader passage, in its words: paragraphs and tables. A paragraph's
 * `text` is null when it cites a source by name: the page links to it in Evidence instead.
 */
export function passageBlocks(entry: OutputEntry, heading: string): (Passage | PassageTable)[] {
  return passages(entry.sections)
    .filter((section) => section.heading === heading)
    .flatMap(sectionBlocks);
}

/** What a module wrote under one section, as `passageBlocks` reads it. */
export function sectionBlocks({ blocks }: Section): (Passage | PassageTable)[] {
  return blocks.flatMap((block) => {
    if (block.type === "table") return [tableOf(block)];
    if (block.type !== "text") return [{ line: block.line, text: null }];
    if (methodNote(block.text)) return [];
    const paragraph = paragraphOf(block.line, block.text);
    return paragraph.text === "" ? [] : [paragraph];
  });
}

/**
 * The paragraphs a module wrote under one reader passage, in its words; its tables left out. `text`
 * is null for a paragraph (or a block the page cannot draw) that is read in Evidence instead.
 */
export function passageParagraphs(entry: OutputEntry, heading: string): Passage[] {
  return passageBlocks(entry, heading).filter((block): block is Passage => !("table" in block));
}

const NUMBER = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
const ACCOUNTING = /^\(((?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?)\)$/;

/**
 * A cell's figure as plain decimal text, exactly as stated: trimmed, a Unicode minus read as "-",
 * and the table's own reporting unit after it (as "4.0x" in an x table) set aside. Null for a gap
 * or any other words.
 */
function figureText(cell: string, unit: string) {
  const text = cell.trim().replace(/^\u2212/, "-");
  const bare = unit && text.endsWith(unit) ? text.slice(0, -unit.length).trim() : text;
  const negative = ACCOUNTING.exec(bare)?.[1];
  if (negative) return { figure: `-${negative}`, accounting: true };
  return NUMBER.test(bare) ? { figure: bare, accounting: false } : null;
}

/**
 * A stated figure with its unit as the module wrote it: an accounting negative in brackets, the
 * unit inside them unless the module wrote it after them ("(12.3)%").
 */
export function figureShown(point: Point, unit: string) {
  if (point.figure === null) return null;
  const written = point.cell.trim();
  if (point.accounting && unit && written.endsWith(unit)) return written;
  return point.accounting
    ? `(${withUnit(point.figure.slice(1), unit)})`
    : withUnit(point.figure, unit);
}

export type Point = {
  period: string;
  /** The cell as the module wrote it: a figure, or its `Not supplied: …` words. */
  cell: string;
  /** The cell's figure as plain decimal text (`figureText`); null when it is not one figure. */
  figure: string | null;
  /** The module wrote the figure as an accounting negative, "(12.3)". */
  accounting: boolean;
  value: number | null;
  /** The row's "Basis and limitation" (or "Basis") cell as written; null without that column. */
  basis: string | null;
  /** `periodPlace` of the period; undefined when it cannot be read or the row is malformed. */
  order: PeriodPlace | undefined;
  line: number;
};
export type Series = {
  name: string;
  unit: string;
  points: Point[];
  /** The chart table's own line, for a trace of the whole table. */
  line?: number;
};
/** A chart column read for a tile, or the true reason it cannot be. */
export type SeriesRead = { series: Series } | { reason: string; line?: number };

const CHART_HEADERS = ["Period", "Reporting unit"];

/** The one `Chart data: <chart>` table of the handoff, or why there is not one. */
function chartTable(entry: OutputEntry, chart: string): Table | string {
  if (entry.output.parseError)
    return "The financial foundation's output could not be read; it is in Evidence.";
  const tables = entry.sections
    .filter((section) => section.heading === `Chart data: ${chart}`)
    .flatMap(({ blocks }) => blocks)
    .filter((block): block is Table => block.type === "table");
  const matches = tables.filter((table) =>
    CHART_HEADERS.every((name) => table.headers.includes(name)),
  );
  const [only] = matches;
  if (matches.length === 1 && only) return only;
  if (matches.length > 1)
    return `The financial foundation has more than one '${chart}' chart table.`;
  return tables.length
    ? `The financial foundation's '${chart}' chart table has no Period or Reporting unit column.`
    : `The financial foundation has no '${chart}' chart table.`;
}

/** The table's one reporting unit, or why it has none. */
function reportingUnit(table: Table, chart: string): { unit: string } | { reason: string } {
  const at = table.headers.indexOf("Reporting unit");
  const units = table.rows.map(({ cells }) => (cells[at] ?? "").trim());
  const [unit] = units;
  if (unit === undefined) return { reason: `The '${chart}' chart table has no rows.` };
  if (units.some((each) => !each))
    return { reason: `The '${chart}' chart table states no reporting unit for a period.` };
  return new Set(units).size === 1
    ? { unit }
    : { reason: `The '${chart}' chart table states more than one reporting unit.` };
}

/** The one column whose heading matches, or why there is not one. */
function figureColumn(
  table: Table,
  chart: string,
  heading: RegExp,
  title: string,
): { column: number } | { reason: string } {
  const columns = table.headers.flatMap((name, at) => (heading.test(name) ? [at] : []));
  const [column] = columns;
  if (columns.length === 1 && column !== undefined) return { column };
  return {
    reason: columns.length
      ? `The '${chart}' chart table has more than one ${title} column.`
      : `The '${chart}' chart table has no ${title} column.`,
  };
}

const BASIS = /^Basis(?: and limitation)?$/i;

function points(table: Table, column: number, unit: string): Point[] {
  const period = table.headers.indexOf("Period");
  const basis = table.headers.findIndex((name) => BASIS.test(name.trim()));
  return table.rows.map(({ cells, line }) => {
    const name = (cells[period] ?? "").trim();
    const read = figureText(cells[column] ?? "", unit);
    const figure = read?.figure ?? null;
    return {
      period: name,
      cell: cells[column] ?? "",
      figure,
      accounting: read?.accounting ?? false,
      value: figure === null ? null : Number(figure.replaceAll(",", "")),
      basis: basis < 0 ? null : (cells[basis] ?? ""),
      order: cells.length === table.headers.length ? periodPlace(name) : undefined,
      line,
    };
  });
}

/**
 * One column of a CP-1 `Chart data:` period table, row by row; or, when the table, the one
 * matching column or the one reporting unit is not there, the true reason: a tile draws it.
 */
export function readSeries(
  entry: OutputEntry,
  chart: string,
  heading: RegExp,
  title: string,
): SeriesRead {
  const table = chartTable(entry, chart);
  if (typeof table === "string") return { reason: table };
  const found = figureColumn(table, chart, heading, title);
  if ("reason" in found) return { reason: found.reason, line: table.line };
  const unit = reportingUnit(table, chart);
  if ("reason" in unit) return { reason: unit.reason, line: table.line };
  const name = table.headers[found.column] ?? title;
  const series = { name, unit: unit.unit, points: points(table, found.column, unit.unit) };
  return { series: { ...series, line: table.line } };
}

/** `readSeries` with its earlier arguments and result: the series, or null for any reason. */
export function periodSeries(
  entry: OutputEntry | undefined,
  chart: string,
  heading: RegExp,
): Series | null {
  const read = entry && readSeries(entry, chart, heading, "");
  return read && "series" in read ? read.series : null;
}

/** `oneYearBefore` of `reportView.ts`, kept identical: the same date a year earlier; none for 29 February. */
function oneYearBefore(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const [, year = "", month = "", day = ""] = match ?? [];
  return match && !(month === "02" && day === "29")
    ? `${String(Number(year) - 1).padStart(4, "0")}-${month}-${day}`
    : undefined;
}

const dateOf = (period: string) => /(\d{4}-\d{2}-\d{2})$/.exec(period)?.[1];
const NO_YEAR = "No period a year earlier to compare.";
const ONE_PERIOD = "One period is stated, so no change is drawn.";
const PERIOD_HEADERS = ["Period", "Start", "End"] as const;

/** The explicit period table, or one canonical table under Limitations in retained handoffs. */
function comparisonPeriods(entry: OutputEntry): Table | undefined {
  const explicit = entry.sections.filter((section) => section.heading === "Period table");
  if (explicit.length) return namedTable(entry, "Period table", PERIOD_HEADERS);
  const limitations = entry.sections.filter((section) => section.heading === "Limitations");
  const [only] = limitations;
  if (limitations.length !== 1 || !only) return undefined;
  const tables = only.blocks.filter((block): block is Table => block.type === "table");
  const canonical = tables.filter(
    (table) =>
      table.headers.length === PERIOD_HEADERS.length &&
      PERIOD_HEADERS.every((header, at) => table.headers[at] === header),
  );
  return canonical.length === 1 ? canonical[0] : undefined;
}

type Earlier = { prior?: Point; why?: string };

/**
 * The period exactly a year before the latest, by the rule of `priorMetricColumn` in
 * `reportView.ts`: when the chart names a fiscal period and end date, the table must match both;
 * exactly one period there must start and end a year earlier, with one matching chart row.
 */
function yearEarlier(entry: OutputEntry, latest: Point, ordered: Point[]): Earlier {
  // One stated period has nothing to move from: say that, not that a period table is wanting.
  if (ordered.length === 1) return { why: ONE_PERIOD };
  const table = comparisonPeriods(entry);
  const [name, start, end] = ["Period", "Start", "End"].map((h) => table?.headers.indexOf(h) ?? -1);
  const cell = (row: Row, at: number | undefined) => (row.cells[at ?? -1] ?? "").trim();
  const date = dateOf(latest.period);
  const periodName = latest.period.split(" / ")[0]?.trim() ?? latest.period;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(periodName);
  const now = table?.rows.filter((row) => {
    const nameMatches = cell(row, name) === latest.period || cell(row, name) === periodName;
    return date === undefined
      ? cell(row, name) === latest.period
      : cell(row, end) === date && (nameMatches || dateOnly);
  });
  const [current] = now ?? [];
  if (!table || now?.length !== 1 || !current)
    return {
      why: `No change is drawn: the period table does not state when ${latest.period} starts and ends.`,
    };
  const from = oneYearBefore(cell(current, start));
  const to = oneYearBefore(cell(current, end));
  const before = table.rows.filter((row) => cell(row, end) === to);
  const [row] = before;
  if (!from || !to || before.length !== 1 || !row || cell(row, start) !== from)
    return { why: NO_YEAR };
  const named = cell(row, name);
  const match = ordered.filter(
    (point) => point !== latest && (point.period === named || dateOf(point.period) === to),
  );
  return match.length === 1 ? { prior: match[0] } : { why: NO_YEAR };
}

/**
 * The latest period, and the one exactly a year before it when the handoff states one; `why`
 * says why there is none. Null when the periods cannot be put in order.
 */
export type Timeline = { points: Point[]; latest: Point; prior: Point | undefined; why?: string };

export function timeline(series: Series, entry: OutputEntry): Timeline | null {
  const placed = latestReported(series.points, ({ order }) => order);
  if (!placed) return null;
  const { ordered, latest } = placed;
  const { prior, why } = yearEarlier(entry, latest, ordered);
  return { points: ordered, latest, prior, ...(why !== undefined && { why }) };
}

/**
 * Without the entry, as it always was: the last row and the one before it, in the table's order.
 * Given the entry, the stricter rule: the latest by period and the row exactly a year before it
 * by the handoff's period table (none where the periods cannot be ordered or no year is stated).
 */
export function lastTwo(series: Series, entry?: OutputEntry) {
  if (!entry) return { latest: series.points.at(-1), prior: series.points.at(-2) };
  const line = timeline(series, entry);
  return { latest: line?.latest, prior: line?.prior };
}

/** A `Not supplied: reason` cell's reason, in the module's words; null for any other cell. */
export const gapReason = (cell: string) => /^Not supplied:\s*(\S.*)$/.exec(cell)?.[1] ?? null;

/**
 * A module's bottom line as written: its paragraphs and tables in order (`passageBlocks`), or the
 * summary paragraph an earlier-format handoff carries when the passage has no blocks.
 */
export function bottomLineBlocks(entry: OutputEntry): (Passage | PassageTable)[] {
  const written = passageBlocks(entry, "Bottom line");
  const summary = entry.output.summary;
  if (written.length || !summary) return written;
  return [paragraphOf(summary.line, summary.bottomLine)];
}

/** A module's bottom line: its passage, or the summary an earlier-format handoff carries instead. */
export function bottomLine(entry: OutputEntry): Passage[] {
  const written = passageParagraphs(entry, "Bottom line");
  const summary = entry.output.summary;
  if (written.length || !summary) return written;
  return [paragraphOf(summary.line, summary.bottomLine)];
}
