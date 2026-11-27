import { moduleName } from "../api";
import { forecastCaseNames, gridOf, type Grid } from "../visuals/LegacyForecast";
import { orderPeriods } from "@/utils/periodOrder";
import {
  analyzeScenarioPeriods,
  fiscalYear,
  historyOf,
  isForecastPeriod,
  periodList,
  scenarioComparisonNotice,
} from "../visuals/scenarioPeriods";
import { drawnAmount, drawnReason, EVIDENCE_AMOUNT } from "../visuals/drawnQualifications";
import { amount, record, word } from "../visuals/visualData";
import {
  blocked,
  containsReference,
  methodNote,
  passages,
  readerText,
  unitLabel,
  type OutputEntry,
} from "../publishedReport";
import type { ReportView } from "../reportView";
import { figureSource, moduleSource, unitOf, type Cell } from "./overview/figureData";
import { readerReason } from "./overview/reason";
import { headroomTests, type HeadroomTest } from "./overview/stressData";
import { wallSlots } from "./overview/structureData";

/** One published cell of a forecast measure, as the model wrote it. */
export type MeasureCell = {
  period: string;
  start: string;
  end: string;
  /** The cell's display text, word for word. */
  display: string;
  /** The cell's exact value when its status is a value; null otherwise (never zero). */
  value: number | null;
  reason: string;
};

/**
 * One case of a measure. `cells` are the periods the case keeps in the comparison of cases (what
 * the lead chart draws); `own` are every period the case itself publishes once, compared or not
 * (what the page states about the selected case).
 */
export type MeasureCase = {
  group: string;
  name: string;
  cells: Map<string, MeasureCell>;
  own: Map<string, MeasureCell>;
};

/** A schedule, covenant or stress cell's value as the page draws it: no citation, no file name. */
export const drawnCellText = (text: string) =>
  citationFree(text) ?? (text.trim() ? EVIDENCE_AMOUNT : "");

/**
 * A cell with no value as the page draws it: the module's words without the citation, else the
 * reason rule. It never says an amount is recorded where the module wrote a gap.
 */
export const drawnGapText = (text: string) =>
  citationFree(text) ?? (text.trim() ? drawnReason(text) : "");

const byPeriod = <T extends { period: string }>(cells: readonly T[]) =>
  orderPeriods(cells, ({ period }) => period).ordered;

function measureCell(
  column: Grid["columns"][number],
  raw: Record<string, unknown> | undefined,
): MeasureCell {
  const status = word(raw?.status);
  return {
    period: column.label,
    start: column.start,
    end: column.end,
    display: word(raw?.display),
    value: status === "value" ? amount(word(raw?.exact)) : null,
    reason: word(raw?.reason),
  };
}

function grids(model: unknown) {
  const cashflow = record(record(model).cashflow);
  return [gridOf(cashflow), gridOf(cashflow.other)].flatMap((grid) => (grid ? [grid] : []));
}

/** Every row label of the model matching `pattern`, once each. */
export function measureRows(model: unknown, pattern: RegExp) {
  return [
    ...new Set(
      grids(model).flatMap((grid) =>
        grid.rows.filter((row) => pattern.test(row.label)).map(({ label }) => label),
      ),
    ),
  ];
}

const normalLabel = (label: string) => label.replace(/\s+/gu, " ").trim().toLowerCase();
const sameLabel = (a: string, b: string) => normalLabel(a) === normalLabel(b);

/** The grid's one row for the measure: the only match, or the only match of `prefer`. */
function measureRow(grid: Grid, pattern: RegExp, prefer?: RegExp) {
  const rows = grid.rows.filter((row) => pattern.test(row.label));
  if (rows.length === 1) return rows[0];
  const preferred = prefer ? rows.filter((row) => prefer.test(row.label)) : [];
  return preferred.length === 1 ? preferred[0] : undefined;
}

const BASE = "Base case";
const byBaseFirst = (a: string, b: string) => Number(b === BASE) - Number(a === BASE);
const toEntry = ({ period, start, end, display, value, reason }: MeasureCell) =>
  [period, { period, start, end, display, value, reason }] as const;

const toPeriod = ({ period }: MeasureCell) => period;

export { fiscalYear, periodList };

/**
 * One measure of the published model, by case: the cells of the grid's row for it in each
 * forecast column of the main grid and the `other` grid, and `history`, the row's reported and pro
 * forma figures before them, `unplaced`, its figures under a label the period rule cannot place
 * (drawn last), and `historyGaps`, what it publishes outside the forecast and is not drawn
 * (`historyOf`). Where a grid has several matching rows,
 * the one `prefer` names is read; none is chosen otherwise. Periods go through the same
 * eligibility as the cash proxy comparison (`analyzeScenarioPeriods`): a period a case does not
 * publish is absent from that case, never filled. Null when no grid has one such row.
 */
export function forecastMeasure(model: unknown, pattern: RegExp, prefer?: RegExp) {
  const names = forecastCaseNames(record(record(model).cashflow));
  const found = grids(model).flatMap((grid) => {
    const row = measureRow(grid, pattern, prefer);
    return row ? [{ grid, row }] : [];
  });
  const [first] = found;
  if (!first) return null;
  // Rows under different labels are different measures: only the first row's own label is merged.
  const read = found.filter(({ row }) => sameLabel(row.label, first.row.label));
  const observations = read.flatMap(({ grid, row }) =>
    grid.columns.flatMap((column, at) =>
      isForecastPeriod(column.label)
        ? [{ ...measureCell(column, row.cells[at]), group: column.group }]
        : [],
    ),
  );
  const analysis = analyzeScenarioPeriods(observations);
  const groups = [...new Set(observations.map(({ group }) => group))].sort(byBaseFirst);
  // With several cases, only a period kept for the comparison is compared, for the cases that
  // keep it: a period left out (dates that do not match, a duplicate) is in no case's `cells`.
  const kept = new Set(
    analysis.periods.flatMap(({ period, groups: keeping }) =>
      keeping.map((group) => `${period}\0${group}`),
    ),
  );
  const several = groups.length > 1;
  const cases: MeasureCase[] = groups.map((group) => {
    const own = analysis.uniqueObservations.filter((item) => item.group === group);
    return {
      group,
      name: names.get(group) ?? group,
      own: new Map(own.map(toEntry)),
      cells: new Map(
        own.filter((item) => !several || kept.has(`${item.period}\0${group}`)).map(toEntry),
      ),
    };
  });
  const single = cases.length === 1 ? cases[0] : undefined;
  const periods = single
    ? byPeriod([...single.cells.values()]).map(toPeriod)
    : analysis.periods.map(({ period }) => period);
  // Reported and pro forma figures: drawn before the forecast, never mixed into a case's cells.
  const {
    history,
    unplaced,
    gaps: historyGaps,
  } = historyOf(first.grid.columns.map((column, at) => measureCell(column, first.row.cells[at])));
  return {
    label: first.row.label,
    /** Other rows the model publishes for this measure, not read here. */
    others: measureRows(model, pattern).filter((label) => !sameLabel(label, first.row.label)),
    cases,
    periods,
    history,
    unplaced,
    historyGaps,
    compared: !analysis.noSharedPeriod,
    notice: scenarioComparisonNotice(analysis),
  };
}

export type Measure = NonNullable<ReturnType<typeof forecastMeasure>>;

/** One reading of which row the page draws for a measure, shared by every tile that uses it. */
export type MeasureRead = {
  measure: Measure | null;
  /** Every row the model publishes for the measure. */
  rows: string[];
  /** The measure in reader words: "net leverage". */
  what: string;
  /** The basis the page names when several rows match: "net debt over EBITDA". */
  basis?: string;
};

export function readMeasure(
  model: unknown,
  what: string,
  pattern: RegExp,
  prefer?: { pattern: RegExp; basis: string },
): MeasureRead {
  return {
    measure: forecastMeasure(model, pattern, prefer?.pattern),
    rows: measureRows(model, pattern),
    what,
    basis: prefer?.basis,
  };
}

/** Why a measure has no figure for a case, in the same words in every tile. */
export function absentText({ measure, rows, what, basis }: MeasureRead, caseName?: string) {
  if (!measure && rows.length > 1)
    return basis
      ? `The model publishes ${String(rows.length)} ${what} rows: ${periodList(rows)}. None is on ${basis}, so none is drawn.`
      : // The page names no basis for this measure, so it does not choose a row.
        `The model publishes ${String(rows.length)} ${what} rows; this page does not choose between them: ${periodList(rows)}.`;
  if (!measure) return `The model publishes no ${what} figure.`;
  if (measure.cases.length === 0) return `The model's ${what} row has no forecast period.`;
  return `No ${what} figure for ${caseName ?? "the selected case"}.`;
}

/** The forecast years a case's columns cover, whatever rows the model publishes. */
export function caseYears(model: unknown, group: string | undefined) {
  const columns = grids(model).flatMap((grid) =>
    grid.columns.filter(
      (column) => isForecastPeriod(column.label) && (group === undefined || column.group === group),
    ),
  );
  const sorted = orderPeriods(
    [...new Map(columns.map((column) => [column.label, column])).values()],
    ({ label }) => label,
  ).ordered;
  return { first: sorted[0], last: sorted.at(-1) };
}

/** The model's cases from its forecast columns, named once, base first. */
export function modelCases(model: unknown) {
  const names = forecastCaseNames(record(record(model).cashflow));
  const groups = [
    ...new Set(
      grids(model).flatMap((grid) =>
        grid.columns.filter((column) => isForecastPeriod(column.label)).map(({ group }) => group),
      ),
    ),
  ].sort(byBaseFirst);
  return groups.map((group) => ({ group, name: names.get(group) ?? group }));
}

/**
 * The case's own published cells in period order, compared or not; none for a case the measure
 * has no row for. Without a selected case, the measure's first case.
 */
export function cellsOf(measure: Measure, group: string | undefined) {
  const found =
    group === undefined ? measure.cases[0] : measure.cases.find((item) => item.group === group);
  return found ? byPeriod([...found.own.values()]) : [];
}

/** Forecast years inside a case's span that it publishes no column for. */
function unpublishedYears(cells: MeasureCell[]) {
  const years = cells.flatMap((cell) => fiscalYear(cell.period) ?? []);
  if (!years.length) return [];
  const first = Math.min(...years);
  const last = Math.max(...years);
  return Array.from({ length: last - first + 1 }, (_, at) => first + at)
    .filter((year) => !years.includes(year))
    .map((year) => `FY${String(year)}E`);
}

/**
 * The highest or lowest value among a case's published forecast years, as a selection the page
 * makes and says it makes: every year tied at that value, and every year of the case with no
 * figure. Null for fewer than two published values: one figure is not a highest year.
 */
export function extremeOf(cells: MeasureCell[], kind: "highest" | "lowest") {
  const values = cells.filter((cell) => cell.value !== null);
  if (values.length < 2) return null;
  const pick = kind === "highest" ? Math.max : Math.min;
  const extreme = pick(...values.map((cell) => cell.value ?? 0));
  // A tie is a tie as the reader sees it: every year whose published figure reads the same.
  const shown = values.find((cell) => cell.value === extreme)?.display;
  return {
    kind,
    cells: values.filter((cell) => cell.display === shown),
    notCalculated: cells.filter((cell) => cell.value === null).map((cell) => cell.period),
    notPublished: unpublishedYears(cells),
  };
}

/** The last period's cell, whatever its state. */
export const endOf = (cells: MeasureCell[]) => byPeriod(cells).at(-1) ?? null;

/** Net leverage on net debt over EBITDA, as published models name it ("Adj EBITDA" or "EBITDA"). */
export const ON_EBITDA = /net debt \/ (?:Adj )?EBITDA/u;
/** Interest cover on EBITDA, under either label. */
export const COVER_ON_EBITDA = /(?:Adj )?EBITDA \/ (?:cash )?interest/u;
/** The earnings row: "Adj EBITDA ..." or "EBITDA ...", not the "EBITDA (EBIT + D&A)" build-up row. */
const EARNINGS_ROW = /^(?:Adj )?EBITDA\b(?! \(EBIT )/u;

/** The model's earnings basis as its grid names it: the earnings row label, as published. */
export function earningsBasis(model: unknown) {
  return grids(model)[0]?.rows.find((row) => EARNINGS_ROW.test(row.label))?.label ?? null;
}

export type Limitation = { line: number; text: string | null };

/**
 * The forward model's Limitations passage, every item once, as written: one item per bullet of
 * each paragraph, in the module's order. An item that cites a source by name has no text: the page
 * links to it in Evidence instead of drawing it. Nothing is selected from it.
 */
export function modelLimitations(entry: OutputEntry | undefined): Limitation[] {
  if (!entry) return [];
  return passages(entry.sections)
    .filter((section) => section.heading === "Limitations")
    .flatMap(({ blocks }) => blocks)
    .flatMap((block) => {
      if (block.type !== "text" || methodNote(block.text)) return [];
      const lines = block.text.split("\n");
      const items: { line: number; parts: string[] }[] = [];
      lines.forEach((line, at) => {
        // A paragraph's Basis line belongs to its trace, never to its words.
        if (/^\s*Basis:/u.test(line)) return;
        const bullet = /^\s*[-*]\s+(.*)$/u.exec(line);
        const last = items.at(-1);
        if (bullet || !last) items.push({ line: block.line + at, parts: [bullet?.[1] ?? line] });
        else last.parts.push(line.trim());
      });
      // The words through the reader rule the Overview uses: null where they carry a reference.
      return items.map(({ line, parts }) => ({ line, text: readerReason(parts.join(" ")) }));
    })
    .filter(({ text }) => text !== "");
}

/** The covenant tests as Legal & covenants writes them: level, current figure, direction. */
export function covenantTests(view: ReportView) {
  const name = moduleName("CP-4");
  const source = figureSource(view, "CP-4", "Covenant headroom", name);
  if (source.state === "gap") return { tests: [] as HeadroomTest[], reason: source.reason, source };
  const tests = headroomTests(source.table, source.descriptor) ?? [];
  return {
    tests,
    reason: tests.length ? null : `${name} states no covenant test.`,
    source,
  };
}

export type ScheduleYear = {
  year: number;
  label: string;
  cell: Cell | null;
  /** The row's handoff line, for its own trace. */
  line?: number;
  /** A key unique within the schedule: a year can have more than one row. */
  key: string;
};

/** The handoff line of a table row by its first cell, where the table records row lines. */
function rowLine(table: { rows: string[][]; rowLines?: (number | undefined)[] }, label: string) {
  const at = table.rows.findIndex((row) => readerText(row[0] ?? "") === readerText(label));
  return at >= 0 ? table.rowLines?.[at] : undefined;
}

/**
 * The maturity schedule as Financial foundation publishes it, every row as written, by fiscal year
 * where its label is one. A year the schedule has no row for is not a row: it is neither drawn nor
 * listed. A year may have more than one row; each is kept.
 */
export function maturitySchedule(view: ReportView) {
  const name = moduleName("CP-1");
  const source = figureSource(view, "CP-1", "Debt maturities", name);
  if (source.state === "gap")
    return {
      years: [] as ScheduleYear[],
      offAxis: [] as ScheduleYear[],
      reason: source.reason,
      source,
    };
  const unit = unitOf(source.descriptor);
  const slots = wallSlots(source.table, source.descriptor, unit);
  if (!slots)
    return {
      years: [] as ScheduleYear[],
      offAxis: [] as ScheduleYear[],
      unit,
      reason: "The maturity schedule states no amount for any period.",
      source,
    };
  const table = source.table;
  // Not a period order: whether the row is written as a fiscal year, the model's own axis. The
  // period rule reads `2026` and `FY2026` as one year; a schedule by calendar year is not the
  // model's fiscal year, so only the `FY` form is placed and any other stays beside the axis.
  const dated = (label: string) => (/^FY\d{4}$/u.test(label) ? fiscalYear(label) : null);
  const rows = [...slots.dated, ...slots.undated].filter(
    (slot): slot is typeof slot & { cell: Cell } => slot.cell != null,
  );
  const read = rows.map((slot, at) => ({
    year: dated(slot.label) ?? 0,
    label: slot.label,
    cell: slot.cell,
    line: slot.line ?? rowLine(table, slot.label),
    key: `${slot.label}-${String(at)}`,
  }));
  const years = read.filter((row) => row.year !== 0);
  // Rows not labelled by fiscal year are kept as written, beside the axis.
  const offAxis = read.filter((row) => row.year === 0);
  return {
    years,
    offAxis,
    unit,
    reason: years.length || offAxis.length ? null : "The maturity schedule is not by fiscal year.",
    source,
  };
}

/** One stated figure of a funding-gap row: its column's header and its cell as written; `value`
 * is null where the cell is not one plain figure (it is then drawn as written, never as a gap). */
type GapFigure = { header: string; text: string; value: number | null };

export type FundingGap = {
  module: string;
  name: string;
  entry: OutputEntry;
  line: number;
  /** The row's own label, in reader words. */
  label: string;
  figures: GapFigure[];
  /** The unit as the value header or a unit column states it; null when neither does. */
  unit: string | null;
  /** True where a figure states its own unit ("USD 120m"), so no unit is missing. */
  unitInFigure: boolean;
  /** The row's notes, limitations and status cells, through the reader rule. */
  notes: string[];
  horizon: string | null;
};

const FUNDING_GAP = /^(?:CP-2D\s+)?funding gap\b/iu;
const HORIZON = /^(?:CP-2D\s+)?horizon\b/iu;
/** A cell that is only a dash: the module wrote no value in it. */
const BARE_DASH = /^[—–-]$/u;
/** A column header that names a span of time. */
const SPAN_COLUMN = /^(?:years?|months?|quarters?|periods?)$/iu;
const UNIT_COLUMN = /^(?:Reporting unit|Units?)$/iu;
const CURRENCY_COLUMN = /^Currency$/iu;
const SCALE_COLUMN = /^Scale$/iu;
/** Columns that hold the row's source: they go to its trace, never to the page. */
const SOURCE_COLUMN = /^(?:Source|Evidence|References?|Ref|Register|Id)$/iu;
/** Columns that hold words about the row: drawn as its notes, under the figures. */
const NOTE_COLUMN = /^(?:Basis|Basis and limitation|Notes?|Limitations?|Status|Category)$/iu;
/** A register id in brackets, such as "(T2E.3.r03)": machinery, never page text. */
const REGISTER_ID = /\s*\((?:[A-Z]\d\w*(?:\.\w+)+)\)/gu;
/** A cell that states a unit of its own: letters or a currency sign beside its figure. */
const OWN_UNIT = /[A-Za-z$€£¥]/u;

const plain = (text: string) => readerText(text.replace(REGISTER_ID, "").trim());

function gapUnit(headers: string[], cells: string[], values: number[]) {
  for (const at of values) {
    const header = /\(([^()]+)\)\s*$/u.exec(headers[at] ?? "")?.[1];
    if (header) return header;
  }
  const at = (pattern: RegExp) => headers.findIndex((name) => pattern.test(name.trim()));
  const unit = cells[at(UNIT_COLUMN)]?.trim();
  if (unit) return unit;
  const currency = cells[at(CURRENCY_COLUMN)]?.trim() ?? "";
  const scale = cells[at(SCALE_COLUMN)]?.trim() ?? "";
  return [currency, scale].filter(Boolean).join(" ") || null;
}

/** The table's value columns: every column but the label, unit, source and note columns. */
function valueColumns(headers: string[]) {
  return headers.flatMap((header, at) => {
    const name = header.trim();
    return at === 0 ||
      [UNIT_COLUMN, CURRENCY_COLUMN, SCALE_COLUMN, SOURCE_COLUMN, NOTE_COLUMN].some((pattern) =>
        pattern.test(name),
      )
      ? []
      : [at];
  });
}

/** What a row with no stated figure says in place of one. */
export const NOT_STATED_IN_ROW = "Not stated in the row";

/** The funding gap's line of context, as every tile draws it: module and row, horizon, unit. */
export function gapContext(gap: FundingGap) {
  return [
    `${gap.name}: ${gap.label}`,
    gap.horizon ?? "horizon not stated",
    gap.unit === null ? (gap.unitInFigure ? null : "unit not stated") : unitLabel(gap.unit),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** A closing bracket, with the space before it: where a cell writes its citation. */
const CLOSING_BRACKET = /\s*(?:\(([^()[\]]*)\)|\[([^()[\]]*)\])$/u;
const FILE_NAME = /[\w\-./]+\.(?:pdf|xlsx?|xlsm|docx?|csv|html?|md|txt|json)\b/giu;
const CUE = /^(?:see|per|cf\.|sources?:?)\s*[,;:]?\s*/iu;
/** A gap or register marker the cited cells write undotted: "C05". Period tags ("H2") are not. */
const GAP_MARKER = /^C\d{2,3}(?:\.\w+)*$/u;
/** A word a citation bracket completes: with the bracket gone it would say nothing. */
const OPENS_CITATION = /\b(?:per|see|from|in|at|on|by|of|to|cf\.|according to|sources?:?)\s*$/iu;

/** Whether one part of a closing bracket is nothing but a citation. */
function pureCitation(part: string) {
  const rest = part
    .replace(FILE_NAME, " ")
    .trim()
    .replace(/^[\s,;:&]+|[\s,;:&]+$/gu, "")
    .replace(CUE, "")
    .trim();
  return rest === "" || GAP_MARKER.test(rest) || drawnAmount(`1 (${rest})`) === "1";
}

/**
 * The cell's text without its closing citation: a bracket that is only citation goes whole; one
 * that mixes words with a citation keeps the words when every `;`-part is either one or the
 * other. Null when a citation remains that cannot be set aside exactly.
 */
function citationFree(text: string) {
  const whole = text.trim();
  const match = CLOSING_BRACKET.exec(whole);
  const inner = match?.[1] ?? match?.[2];
  const head = match ? whole.slice(0, whole.length - match[0].length) : whole;
  if (!match || inner === undefined || OPENS_CITATION.test(head)) return drawnAmount(whole);
  const parts = inner.split(";").map((part) => part.trim());
  const kept = parts.filter((part) => !pureCitation(part));
  if (kept.length === parts.length) return drawnAmount(whole);
  const bracket = kept.length ? ` (${kept.join("; ")})` : "";
  return head.trim() ? drawnAmount(`${head.trim()}${bracket}`) : null;
}

/** One gap cell as drawn: its figure as written without any citation, else a gap. */
function gapFigure(header: string, cell: string): GapFigure {
  const text = cell.trim();
  const drawn = citationFree(text);
  if (drawn === null) {
    return containsReference(text)
      ? { header, text: NOT_STATED_IN_ROW, value: null }
      : { header, text: plain(text), value: amount(text.replaceAll("−", "-")) };
  }
  return { header, text: plain(drawn), value: amount(drawn.replaceAll("−", "-")) };
}

function gapIn(entry: OutputEntry, module: string): FundingGap | null {
  const tables = entry.sections.flatMap(({ blocks }) =>
    blocks.flatMap((block) => (block.type === "table" ? [block] : [])),
  );
  for (const table of tables) {
    const row = table.rows.find(({ cells }) => FUNDING_GAP.test(cells[0] ?? ""));
    if (!row) continue;
    const values = valueColumns(table.headers);
    // Beside a stated value a bare dash is a column the row does not use, not a figure; a row
    // that writes only dashes is drawn as written. An empty cell states nothing.
    // A span column ("Years") states the horizon, read below, not a second funding gap.
    const amounts = values.filter((at) => !SPAN_COLUMN.test((table.headers[at] ?? "").trim()));
    const written = amounts.filter((at) => (row.cells[at] ?? "").trim() !== "");
    const valued = written.filter((at) => !BARE_DASH.test((row.cells[at] ?? "").trim()));
    const stated = valued.length ? valued : written;
    const figures = stated.map((at) =>
      gapFigure(plain(table.headers[at] ?? ""), row.cells[at] ?? ""),
    );
    const notes = table.headers.flatMap((header, at) => {
      if (!NOTE_COLUMN.test(header.trim())) return [];
      const words = readerReason(row.cells[at] ?? "");
      return words ? [words] : [];
    });
    // The horizon is the Horizon row's first value that is not empty or a bare dash, with its
    // column's header when that names a span ("Years: 1").
    const horizon = table.rows.find(({ cells }) => HORIZON.test(cells[0] ?? ""));
    const horizonAt = values.find((at) => {
      const cell = (horizon?.cells[at] ?? "").trim();
      return cell !== "" && !BARE_DASH.test(cell);
    });
    const horizonCell = horizonAt === undefined ? "" : (horizon?.cells[horizonAt] ?? "").trim();
    const horizonText =
      horizonAt !== undefined && SPAN_COLUMN.test((table.headers[horizonAt] ?? "").trim())
        ? `${(table.headers[horizonAt] ?? "").trim()}: ${horizonCell}`
        : horizonCell;
    return {
      module,
      name: moduleName(module),
      entry,
      line: row.line,
      label: plain(row.cells[0] ?? ""),
      figures: figures.length ? figures : [{ header: "", text: NOT_STATED_IN_ROW, value: null }],
      unit: gapUnit(table.headers, row.cells, values),
      unitInFigure: figures.some(
        ({ text, value }) =>
          value === null &&
          text !== NOT_STATED_IN_ROW &&
          OWN_UNIT.test(text.replace(/\([^()]*\)|\[[^[\]]*\]/gu, "")),
      ),
      notes,
      horizon: horizonText && !containsReference(horizonText) ? plain(horizonText) : null,
    };
  }
  return null;
}

/**
 * The funding gap as the liquidity module states it and as the refinancing module repeats it:
 * each module's row, owned by that module, every stated column with its header. With neither, why
 * each module gave none: it did not run, it is not assessable, or the page found no row named
 * Funding gap in its handoff.
 */
export function fundingGap(view: ReportView) {
  const gaps: FundingGap[] = [];
  const looked: string[] = [];
  for (const module of ["CP-2D", "CP-3C"]) {
    const name = moduleName(module);
    const { entry, reason } = moduleSource(view, module, name);
    if (!entry || reason) {
      looked.push(
        // The module's own sentence, once: "Not assessable: …" is not said twice.
        entry && blocked(entry)
          ? `${name} is not assessable: ${(reason ?? "").replace(/^not assessable:\s*/iu, "")}`
          : (reason ?? ""),
      );
      continue;
    }
    const found = gapIn(entry, module);
    if (found) gaps.push(found);
    else looked.push(`This page found no row named Funding gap in ${name}'s output.`);
  }
  return { gaps, looked };
}
