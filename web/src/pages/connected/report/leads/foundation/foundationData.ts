import { unitLabel, type OutputEntry, type Row, type Table } from "../../../publishedReport";
import { tone } from "../../../signal";
import { difference, readCell, signOf, sum, type Reading } from "../kit/numbers";
import { changeBetween, yearApart, type Change } from "../kit/changes";
import { citesSource, clauses, IN_EVIDENCE, reasonText, safeText } from "../kit/reader";
import {
  allTables,
  columnOf,
  comparisonOf,
  isReported,
  latestReported,
  normalLabel,
  orderByPeriod,
  periodRows,
  rowStarting,
  statedPeriod,
  statementColumns,
  tableName,
  tableUnder,
  tableWith,
  unionPeriods,
  type Ordered,
  type Period,
} from "../kit/tables";

// The CP-1 data contract. Every reader returns the figures the handoff states, as written: every
// stated period (one, two or more) in the one period order, gaps in place with their own reasons, and no
// number the module did not write. The one computed figure is `change`: the exact difference of one
// measure between the two periods of `comparison`, on one unit (ruling (i), 2026-11-24).

/** One period's figure as written (a number, a stated gap with its reason, or words), or null where the table states nothing for that period. */
export type PeriodCell = { label: string; cell: Reading | null; line: number | null };
/** The two periods a comparison is drawn between, earlier first; null with fewer than two of one form. */
type Comparison = { from: string; to: string } | null;

/** The one form of a gap: what this page could not read, and the cause it found. */
const inSentence = (what: string) =>
  /^[A-Z][a-z]/.test(what) ? what.charAt(0).toLowerCase() + what.slice(1) : what;
const NOT_IN = (what: string) => `This page could not read ${inSentence(what)}.`;
const BECAUSE = (what: string, cause: string) =>
  `This page could not read ${inSentence(what)} because ${cause.replace(/\.$/, "")}.`;
const periodsGap = (table: string, cause: string) =>
  BECAUSE(`the periods of ${inSentence(table)}`, cause);
const NOT_A_SHAPE = "the table is not in a shape this page reads";

/** The exact `to − from` of one measure on the comparison periods, when both are stated numbers. */
function changeOf(values: readonly PeriodCell[], comparison: Comparison) {
  if (!comparison) return null;
  const at = (label: string) => values.find((value) => value.label === label)?.cell;
  const [from, to] = [at(comparison.from), at(comparison.to)];
  return from?.kind === "number" && to?.kind === "number" ? difference(to.text, from.text) : null;
}

/**
 * How a figure's periods are placed: `unplaced` names the periods the period order could not read
 * (drawn last, as the handoff lists them, never joined by a line and never compared); `ordered`
 * is false when there is one. The placed periods are drawn, joined and compared all the same.
 */
type Placing = { ordered: boolean; unplaced: string[] };
const placing = (unplaced: readonly string[]): Placing => ({
  ordered: unplaced.length === 0,
  unplaced: [...unplaced],
});

/** The periods of several lists once each, in the one period order (kit `unionPeriods`). */
function combine(lists: readonly (readonly Period[])[]) {
  const { periods, unplaced } = unionPeriods(lists);
  return { periods, ...placing(unplaced) };
}

/** A period-rows table read: its rows by period, and its one unit when every row states the same. */
type PeriodTable = {
  table: Table;
  rows: { period: Period; row: Row }[];
  unit: string | null;
} & Placing;

/** Chart and net debt tables: rows by period with a `Reporting unit` column; a reason when unreadable. */
function periodTable(entry: OutputEntry, heading: string, what: string): PeriodTable | string {
  const table = tableUnder(entry, heading);
  if (!table) return NOT_IN(what);
  const read = periodRows(table);
  if ("reason" in read) return periodsGap(tableName(heading), read.reason);
  const unitAt = columnOf(table, "Reporting unit");
  const units = new Set(read.periods.map(({ item }) => item.cells[unitAt] ?? ""));
  const [unit] = [...units];
  return {
    table,
    rows: read.periods.map(({ period, item }) => ({ period, row: item })),
    unit: unitAt >= 0 && units.size === 1 && unit ? unitLabel(unit) : null,
    ...placing(read.unplaced),
  };
}

/** One column of a period table as period cells, in the table's period order. */
function columnCells(read: PeriodTable, column: string): PeriodCell[] | null {
  const at = columnOf(read.table, column);
  if (at < 0) return null;
  return read.rows.map(({ period, row }) => ({
    label: period.label,
    cell: readCell(row.cells[at] ?? ""),
    line: row.line,
  }));
}

/** A statement table (`| Line item | FY2024 | FY2023 | Unit | …`): its period columns, in order. */
type Statement = { table: Table; columns: { period: Period; at: number }[] } & Placing;

/**
 * The statement headings the owner check reads by their first table (`cpos_cp1_statements.STATEMENTS`,
 * read through `_table`): the statement is the first table under the heading, and a module may write
 * further tables under it (the 2026-11-25 replay's segment EBITDA under T4.4, S15-5-1). Those further
 * tables are not read here, as any table no figure reads.
 */
const FIRST_TABLE = ["T4.4 Income statement", "T4.5 Cash flow statement", "T4.6 Balance sheet"];

/**
 * The table a statement heading is read by: for a `FIRST_TABLE` heading the first table of its one
 * section (null when the heading is absent, written twice, or holds no table); for any other
 * heading the kit's `tableUnder`.
 */
function statementTable(entry: OutputEntry, heading: string): Table | null {
  if (!FIRST_TABLE.includes(heading)) return tableUnder(entry, heading);
  const same = entry.sections.filter((section) => section.heading === heading);
  const [only] = same;
  if (same.length !== 1 || !only) return null;
  const first = only.blocks.find((block) => block.type === "table");
  return first?.type === "table" ? first : null;
}

function statement(entry: OutputEntry, heading: string): Statement | string {
  const table = statementTable(entry, heading);
  if (!table) return NOT_IN(`the ${inSentence(tableName(heading))}`);
  const read = statementColumns(table);
  if ("reason" in read) return periodsGap(tableName(heading), read.reason);
  return {
    table,
    columns: read.periods.map(({ period, item }) => ({ period, at: item })),
    ...placing(read.unplaced),
  };
}

/** One row of a statement, every period, with its unit. */
type StatementRow = {
  label: string;
  values: PeriodCell[];
  /** The period of each value, as its table states it. */
  periods: Period[];
  unit: string | null;
  line: number;
  /** Set only when a supplemental financial metric supplied this row, for its trace target. */
  source?: "financial-metrics";
};

function statementRow(read: Statement, row: Row): StatementRow {
  const unitAt = columnOf(read.table, "Unit");
  const unit = unitAt < 0 ? "" : (row.cells[unitAt] ?? "").trim();
  return {
    label: (row.cells[0] ?? "").trim(),
    values: read.columns.map(({ period, at }) => ({
      label: period.label,
      cell: readCell(row.cells[at] ?? ""),
      line: row.line,
    })),
    periods: read.columns.map(({ period }) => period),
    unit: unit ? unitLabel(unit) : null,
    line: row.line,
  };
}

/** The statement row whose label begins with one of these, uniquely; a reason otherwise. */
function findRow(read: Statement, prefixes: readonly string[], what: string) {
  const row = rowStarting(read.table, prefixes);
  if (row === "none") return NOT_IN(what);
  if (row === "several") return BECAUSE(what, "more than one row of the statement matches it");
  return statementRow(read, row);
}

/** Cells re-laid onto a list of periods: a period the source does not state is null. */
const onto = (periods: readonly Period[], values: readonly PeriodCell[]): PeriodCell[] =>
  periods.map(
    (period) =>
      values.find((value) => value.label === period.label) ?? {
        label: period.label,
        cell: null,
        line: null,
      },
  );

// A cell's clauses that name a source, a register or a calculation are left out; the rest are the
// module's own words, in its order. `safeText` screens each clause; a short calculation id ("C3")
// the kit's screen does not catch is caught here too.
const SHORT_ID = /\b[CD]\d{1,3}\b/;

/** The module's own words of a Basis and limitation cell, without the clauses that cite a source. */
export function basisText(cell: string): string | null {
  const parts = clauses(cell);
  const kept = parts.filter((clause) => {
    const words = clause.replace(/[;.]$/, "");
    return words && !SHORT_ID.test(words) && !citesSource(words) && safeText(words) !== IN_EVIDENCE;
  });
  if (kept.length === 0) return parts.length ? IN_EVIDENCE : null;
  const text = kept.map((clause) => safeText(clause)).join(" ");
  return text.replace(/;$/, ".");
}

// ---------------------------------------------------------------------------------------------
// The periods the figures cover (the periods strip)
// ---------------------------------------------------------------------------------------------

export type StatedPeriods = {
  /** Every period the figure tables state, in the one period order; periods of different kinds are all listed. */
  labels: string[];
  periods: Period[];
  /** "annual" when every period is a fiscal or calendar year; "other" otherwise or when none is stated. */
  kind: "annual" | "other";
  /** The two periods the figures compare, or null (one period is drawn as itself). */
  comparison: Comparison;
  /** Which figure table states which periods, in handoff order. */
  tables: { table: string; labels: string[] }[];
  /** Figure tables whose periods cannot be read, with the reason (a repeated year, no rows). */
  gaps: { table: string; reason: string }[];
} & Placing;

const ROW_TABLES = [
  "Chart data: revenue and EBITDA",
  "Net debt data",
  "Chart data: leverage",
  "Chart data: liquidity",
  "Chart data: interest cover",
] as const;
const STATEMENTS = ["T4.4 Income statement", "T4.5 Cash flow statement"] as const;

const repeated = (heading: string) => periodsGap(tableName(heading), "it appears more than once");

/** The periods the CP-1 figures cover, read from the tables they draw (the maturity buckets are not periods). */
export function statedPeriods(entry: OutputEntry): StatedPeriods {
  const tables: StatedPeriods["tables"] = [];
  const gaps: StatedPeriods["gaps"] = [];
  const lists: Period[][] = [];
  const add = (heading: string, read: Ordered<unknown>) => {
    const table = tableName(heading);
    if ("reason" in read) {
      gaps.push({ table, reason: periodsGap(table, read.reason) });
      return;
    }
    lists.push(read.periods.map(({ period }) => period));
    tables.push({ table, labels: read.periods.map(({ period }) => period.label) });
  };
  const found = allTables(entry);
  for (const heading of ROW_TABLES) {
    const same = found.filter((item) => item.heading === heading);
    const [only] = same;
    if (same.length > 1) gaps.push({ table: tableName(heading), reason: repeated(heading) });
    else if (only)
      add(heading, heading === COVER ? coverPeriodRows(only.table) : periodRows(only.table));
  }
  // A statement is read by its first table (`statementTable`): it is stated twice only when its
  // heading is written twice, never because further tables follow it under the heading.
  for (const heading of STATEMENTS) {
    const table = statementTable(entry, heading);
    if (entry.sections.filter((section) => section.heading === heading).length > 1)
      gaps.push({ table: tableName(heading), reason: repeated(heading) });
    else if (table) add(heading, statementColumns(table));
  }
  const segments = segmentSchedule(entry);
  if (typeof segments !== "string")
    add("Segment schedule", {
      periods: segments.periods.map((period) => ({ period, item: 0 })),
      unplaced: segments.unplaced,
    });
  const all = combine(lists);
  const { periods } = all;
  return {
    labels: periods.map((period) => period.label),
    periods,
    kind: periods.length > 0 && periods.every((p) => p.kind === "annual") ? "annual" : "other",
    comparison: comparisonOf(periods),
    tables,
    gaps,
    ordered: all.ordered,
    unplaced: all.unplaced,
  };
}

// ---------------------------------------------------------------------------------------------
// Tile 1: earnings against debt and leverage
// ---------------------------------------------------------------------------------------------

export type EarningsMeasure = {
  key: "sales" | "reportedEbitda" | "adjustedEbitda" | "grossDebt";
  /** The measure's name: the table's column or row label as written. */
  label: string;
  /** One cell per period of the figure, in order. */
  values: PeriodCell[];
  /** Exact `to − from` on the figure's comparison periods, both stated numbers; else null. */
  change: string | null;
  line: number;
};

export type LeverageSeries = {
  label: string;
  values: PeriodCell[];
  change: string | null;
  tone: ReturnType<typeof tone>;
  /** The table's own Basis and limitation words per period (sources left out), or null. */
  bases: (string | null)[];
  line: number;
};

export type EarningsAgainstDebt = {
  unit: string;
  /** Every stated period, in the one period order; those it cannot place last (`unplaced`). */
  periods: Period[];
  comparison: Comparison;
  measures: EarningsMeasure[];
  /** Measures the handoff does not carry on this unit, with the reason in words. */
  absent: { label: string; reason: string }[];
  leverage: LeverageSeries | null;
  /** The leverage table's Basis and limitation words for its latest reported period; never assumed. */
  leverageBasis: string | null;
  tableLine: number;
} & Placing;

type Read =
  | { label: string; values: PeriodCell[]; periods: Period[]; unit: string | null; line: number }
  | string;

function chartMeasure(entry: OutputEntry, heading: string, column: string, label: string): Read {
  const read = periodTable(entry, heading, label);
  if (typeof read === "string") return read;
  const values = columnCells(read, column);
  if (!values) return NOT_IN(label);
  if (!read.unit) return NOT_IN(`${label} in one unit`);
  return {
    label,
    values,
    periods: read.rows.map(({ period }) => period),
    unit: read.unit,
    line: read.table.line,
  };
}

function reportedEbitda(entry: OutputEntry): Read {
  const read = statement(entry, "T4.4 Income statement");
  if (typeof read === "string") return read;
  const row = findRow(read, ["EBITDA (Reported)"], "EBITDA (Reported)");
  return typeof row === "string" ? row : { ...row, line: read.table.line };
}

/** See the exported reader below; a string is the reason the figure is not drawn. */
function readEarnings(entry: OutputEntry): EarningsAgainstDebt | string {
  const REVENUE = "Chart data: revenue and EBITDA";
  const reads: { key: EarningsMeasure["key"]; label: string; read: Read }[] = [
    { key: "sales", label: "Revenue", read: chartMeasure(entry, REVENUE, "Revenue", "Revenue") },
    { key: "reportedEbitda", label: "EBITDA (Reported)", read: reportedEbitda(entry) },
    {
      key: "adjustedEbitda",
      label: "Adjusted EBITDA",
      read: chartMeasure(entry, REVENUE, "Adjusted EBITDA", "Adjusted EBITDA"),
    },
    {
      key: "grossDebt",
      label: "Gross debt",
      read: chartMeasure(entry, "Net debt data", "Gross debt", "Gross debt"),
    },
  ];
  const anchor = reads.map(({ read }) => read).find((read) => typeof read !== "string");
  if (!anchor)
    return reads.flatMap(({ read }) => (typeof read === "string" ? [read] : [])).join(" ");
  if (!anchor.unit) return NOT_IN(`the unit of ${anchor.label}`);
  const unit = anchor.unit;
  const ready = reads.flatMap(({ key, read }) =>
    typeof read !== "string" && read.unit === unit ? [{ key, read }] : [],
  );
  const absent = reads.flatMap(({ label, read }) => {
    if (typeof read === "string") return [{ label, reason: read }];
    return read.unit === unit
      ? []
      : [{ label, reason: BECAUSE(label, "it is in another unit than the other measures") }];
  });
  const lev = periodTable(entry, "Chart data: leverage", "Leverage");
  const levValues = typeof lev === "string" ? null : columnCells(lev, "Total debt / EBITDA");
  const { periods, ordered, unplaced } = combine([
    ...ready.map(({ read }) => read.periods),
    typeof lev !== "string" && levValues ? lev.rows.map(({ period }) => period) : [],
  ]);
  const comparison = comparisonOf(periods);
  const measures = ready.map(({ key, read }): EarningsMeasure => {
    const values = onto(periods, read.values);
    return {
      key,
      label: read.label,
      values,
      change: changeOf(values, comparison),
      line: read.line,
    };
  });
  let leverage: LeverageSeries | null = null;
  let leverageBasis: string | null = null;
  if (typeof lev !== "string" && levValues) {
    const values = onto(periods, levValues);
    const change = changeOf(values, comparison);
    const basisAt = columnOf(lev.table, "Basis and limitation");
    const basisOf = (label: string) => {
      const row = lev.rows.find(({ period }) => period.label === label)?.row;
      return row && basisAt >= 0 ? basisText(row.cells[basisAt] ?? "") : null;
    };
    leverage = {
      label: "Total debt / EBITDA",
      values,
      change,
      tone: change === null ? "none" : tone("leverage", change),
      bases: periods.map((period) => basisOf(period.label)),
      line: lev.table.line,
    };
    const latest = latestReported(lev.rows, ({ period }) => period.label);
    leverageBasis = latest ? basisOf(latest.period.label) : null;
  }
  return {
    unit,
    periods,
    ordered,
    unplaced,
    comparison,
    measures,
    absent,
    leverage,
    leverageBasis,
    tableLine: anchor.line,
  };
}

// ---------------------------------------------------------------------------------------------
// Tile 2: cash conversion ladder
// ---------------------------------------------------------------------------------------------

type LadderKey =
  | "ebitda"
  | "interest"
  | "taxes"
  | "cfo"
  | "capex"
  | "fcf"
  | "dividends"
  | "repurchases"
  | "afterDistributions"
  | "acquisitions";

export type LadderStep = {
  key: LadderKey;
  /** A level is a stated measure; a deduction is a stated outflow between levels. */
  kind: "level" | "deduction";
  /** The handoff's row label as written; the step's plain name when the handoff has no such row. */
  label: string;
  /** False when no row of this kind is usable; `absent` says why. */
  stated: boolean;
  absent: string | null;
  /**
   * How a deduction's figure is written: "paid", a positive amount paid (cash interest, cash taxes);
   * "signed", an outflow negative (capex, acquisitions, distributions). Null for a level.
   */
  sign: "paid" | "signed" | null;
  /** One cell per ladder period, as written; a stated gap keeps its reason. */
  values: PeriodCell[];
  line: number | null;
};

export type CashLadder = {
  unit: string;
  periods: Period[];
  comparison: Comparison;
  steps: LadderStep[];
  line: number;
} & Placing;

type LadderSpec = {
  key: LadderKey;
  kind: "level" | "deduction";
  name: string;
  prefixes: readonly string[];
  sign: "paid" | "signed" | null;
  /** A level's further label forms in the KPI dashboard (`Levered FCF after total capex, US$m`). */
  kpi?: readonly string[];
};

// The contract's fixed rows (`EBITDA (Adjusted)`, `Net Cash from Operating Activities`, `Cash
// Interest Paid`) and the label forms the retained handoffs use for the rest ("Cash taxes paid,
// net of refunds", "Free cash flow, levered after working capital", "Discretionary cash flow after
// dividends and equivalents"). The after-distributions level is the module's own measure: before
// acquisitions, so acquisitions follow it and no level follows them.
const LADDER: readonly LadderSpec[] = [
  {
    key: "ebitda",
    kind: "level",
    name: "EBITDA (Adjusted)",
    prefixes: ["EBITDA Adjusted"],
    sign: null,
  },
  {
    key: "interest",
    kind: "deduction",
    name: "Cash interest paid",
    prefixes: ["Cash interest paid"],
    sign: "paid",
  },
  {
    key: "taxes",
    kind: "deduction",
    name: "Cash taxes paid",
    prefixes: ["Cash taxes paid", "Income taxes paid", "Taxes paid"],
    sign: "paid",
  },
  {
    key: "cfo",
    kind: "level",
    name: "Net cash from operating activities",
    prefixes: ["Net cash from operating activities"],
    sign: null,
  },
  {
    key: "capex",
    kind: "deduction",
    name: "Capital expenditures",
    prefixes: ["Capital expenditures"],
    sign: "signed",
  },
  {
    key: "fcf",
    kind: "level",
    name: "Free cash flow after capex",
    prefixes: ["Levered free cash flow", "Free cash flow levered"],
    sign: null,
    kpi: ["Levered FCF"],
  },
  {
    key: "dividends",
    kind: "deduction",
    name: "Dividends",
    prefixes: ["Dividends"],
    sign: "signed",
  },
  {
    key: "repurchases",
    kind: "deduction",
    name: "Share repurchases",
    prefixes: ["Repurchases of", "Share repurchases"],
    sign: "signed",
  },
  {
    key: "afterDistributions",
    kind: "level",
    name: "Cash flow after distributions",
    prefixes: ["Discretionary cash flow after"],
    sign: null,
    kpi: ["DCF after"],
  },
  {
    key: "acquisitions",
    kind: "deduction",
    name: "Acquisitions",
    prefixes: ["Acquisition of businesses", "Acquisitions"],
    sign: "signed",
  },
];

/** See the exported reader below; a string is the reason the figure is not drawn. */
const KPI_UNIT = /,\s*([^,]+)$/;

/**
 * A ladder level from the KPI dashboard (`| KPI Category | Metric Name | FY2023 | FY2024 | …`), the
 * documented second source for a level the cash flow statement does not state. The row is found by
 * its Metric Name (one match), its unit is the name's trailing ", US$m", and the label drops it.
 */
function kpiLevel(entry: OutputEntry, spec: LadderSpec): StatementRow | string | null {
  const read = statement(entry, "T4.10 KPI dashboard");
  const nameAt = typeof read === "string" ? -1 : columnOf(read.table, "Metric Name");
  if (typeof read === "string" || nameAt < 0) return null;
  const row = rowStarting(read.table, [...spec.prefixes, ...(spec.kpi ?? [])], nameAt);
  if (row === "none") return null;
  if (row === "several")
    return BECAUSE(spec.name, "more than one row of the KPI dashboard matches it");
  const name = (row.cells[nameAt] ?? "").trim();
  const unit = KPI_UNIT.exec(name)?.[1]?.trim();
  return {
    ...statementRow(read, row),
    label: name.replace(KPI_UNIT, "").trim(),
    unit: unit ? unitLabel(unit) : null,
  };
}

const FINANCIAL_METRICS: Partial<Record<LadderKey, string>> = {
  fcf: "Cash flow after capital expenditure",
  afterDistributions: "Discretionary cash flow after dividends and equivalents",
};

/** A stated cash-conversion level in the handoff's Financials and credit metrics table. */
function financialMetricLevel(
  entry: OutputEntry,
  spec: LadderSpec,
): (StatementRow & { source: "financial-metrics" }) | string | null {
  const label = FINANCIAL_METRICS[spec.key];
  if (!label) return null;
  const tables = allTables(entry).filter(
    ({ heading }) => heading === "Financials and credit metrics",
  );
  if (tables.length === 0) return null;
  if (tables.length > 1)
    return BECAUSE(spec.name, "the financials and credit metrics table appears more than once");
  const [found] = tables;
  if (!found) return null;
  const labelColumns = found.table.headers.flatMap((header, at) =>
    ["Measure", "Metric"].includes(header.trim()) ? [at] : [],
  );
  const [labelAt] = labelColumns;
  if (labelColumns.length !== 1 || labelAt !== 0)
    return BECAUSE(
      spec.name,
      "the financials and credit metrics table has no unique Measure or Metric column",
    );
  const matches = found.table.rows.filter(
    (row) => (row.cells[labelAt] ?? "").trim().toLowerCase() === label.toLowerCase(),
  );
  if (matches.length === 0) return null;
  if (matches.length > 1)
    return BECAUSE(spec.name, "more than one row of financials and credit metrics matches it");
  const read = statement(entry, "Financials and credit metrics");
  if (typeof read === "string") return read;
  const [row] = matches;
  return row ? { ...statementRow(read, row), source: "financial-metrics" } : null;
}

/** The cash flow statement, then KPI dashboard, then one exact financial metric if stated. */
function supplementalLevel(entry: OutputEntry, spec: LadderSpec): StatementRow | string {
  const kpi = kpiLevel(entry, spec);
  if (kpi !== null) return kpi;
  const metric = financialMetricLevel(entry, spec);
  if (metric !== null) return metric;
  return NOT_IN(
    `${spec.name} in the cash flow statement, KPI dashboard, or financials and credit metrics`,
  );
}

/** One ladder row: the cash flow statement first; a missing level may come from its supplements. */
function ladderRow(entry: OutputEntry, spec: LadderSpec, source: Statement | string) {
  if (typeof source === "string") return source;
  const row = rowStarting(source.table, spec.prefixes);
  if (row === "none" && spec.kind === "level" && spec.key !== "ebitda")
    return supplementalLevel(entry, spec);
  return findRow(source, spec.prefixes, spec.name);
}

function readLadder(entry: OutputEntry): CashLadder | string {
  const cash = statement(entry, "T4.5 Cash flow statement");
  if (typeof cash === "string") return cash;
  const income = statement(entry, "T4.4 Income statement");
  const rows = LADDER.map((spec) => ({
    spec,
    read: ladderRow(entry, spec, spec.key === "ebitda" ? income : cash),
  }));
  const anchor = rows.find(({ spec }) => spec.key === "cfo")?.read;
  const unit =
    anchor && typeof anchor !== "string"
      ? anchor.unit
      : (rows.map(({ read }) => read).find((read) => typeof read !== "string")?.unit ?? null);
  if (!unit) return NOT_IN("a unit for the ladder's rows in the cash flow statement");
  const usable = rows.map(({ spec, read }) => ({
    spec,
    read:
      typeof read !== "string" && read.unit !== unit
        ? BECAUSE(read.label, "it is in another unit than the other rows")
        : read,
  }));
  const { periods, ordered, unplaced } = combine(
    usable.map(({ read }) => (typeof read === "string" ? [] : read.periods)),
  );
  const steps = usable.map(({ spec, read }): LadderStep => {
    const found = typeof read !== "string";
    return {
      key: spec.key,
      kind: spec.kind,
      label: found ? read.label : spec.name,
      stated: found,
      absent: found ? null : read,
      sign: spec.sign,
      values: onto(periods, found ? read.values : []),
      line: found ? read.line : null,
    };
  });
  const comparison = comparisonOf(periods);
  const sourceRow = usable.find(
    ({ read }) => typeof read !== "string" && read.source === "financial-metrics",
  )?.read;
  return {
    unit,
    periods,
    ordered,
    unplaced,
    comparison,
    steps,
    line: sourceRow && typeof sourceRow !== "string" ? sourceRow.line : cash.table.line,
  };
}

// ---------------------------------------------------------------------------------------------
// Tile 3: net debt, the stated adjustments and liquidity
// ---------------------------------------------------------------------------------------------

export type NetDebtPeriod = {
  label: string;
  gross: Reading;
  cash: Reading;
  net: Reading;
  line: number;
  /** Net debt / EBITDA for the period from the leverage table, when it states that period. */
  leverage: Reading | null;
};

/** One post-balance-sheet adjustment row, every cell as written. */
export type ProForma = {
  event: string;
  /** The date as written: `2024-10-18`, or the stated gap with its reason ("the source states … only"). */
  date: Reading;
  amount: Reading;
  netDebt: Reading;
  leverage: Reading;
  unit: string;
  /** The row's Basis and limitation words, sources left out. */
  basis: string | null;
  line: number;
};

export type LiquidityPeriod = {
  label: string;
  cash: Reading;
  undrawn: Reading;
  unit: string;
  line: number;
};

export type NetDebtView = {
  unit: string;
  /** Every period of `Net debt data`, in the one period order. */
  periods: NetDebtPeriod[];
  /**
   * Net debt / EBITDA for every period of `Net debt data` and of the leverage table (a leverage
   * row with no net debt row, such as "FY2024 pro forma", is kept with its period as written).
   */
  leverageStrip: PeriodCell[];
  comparison: Comparison;
  /** The stated adjustments in handoff order; none is chosen or ranked here. */
  adjustments: ProForma[];
  /** True when the table's one row is the contract's "none" row: there is no adjustment. */
  noAdjustments: boolean;
  /** The module's words for that row: its Event cell, and its Basis and limitation words. */
  noAdjustmentsWords: { event: string; basis: string | null } | null;
  /** Cash and undrawn committed facilities per period, as stated; never summed here. */
  liquidity: LiquidityPeriod[];
  /** The handoff's own stated cash-plus-revolver figure, when it writes one. */
  liquidityTotal: {
    label: string;
    values: PeriodCell[];
    line: number;
    reason: string | null;
  } | null;
  tableLine: number;
} & Placing;

/** The words of the one Event cell that states there is no adjustment (the contract's POST_BS_NONE). */
export const NO_ADJUSTMENT = "None found in the sources read";
const ADJUSTMENT_HEADERS = ["Event", "Pro forma net debt", "Pro forma net leverage"];

function adjustmentsOf(entry: OutputEntry) {
  const table = tableWith(entry, ADJUSTMENT_HEADERS);
  if (!table) return { adjustments: [], none: null };
  const at = (name: string) => columnOf(table, name);
  const text = (row: Row, name: string) => (at(name) < 0 ? "" : (row.cells[at(name)] ?? "").trim());
  const basisOf = (row: Row) => {
    const cell = text(row, "Basis and limitation");
    return cell ? basisText(cell) : null;
  };
  const [first] = table.rows;
  if (table.rows.length === 1 && first && text(first, "Event") === NO_ADJUSTMENT)
    return { adjustments: [], none: { event: NO_ADJUSTMENT, basis: basisOf(first) } };
  const adjustments = table.rows.map((row): ProForma => ({
    event: text(row, "Event"),
    date: readCell(text(row, "Date")),
    amount: readCell(text(row, "Amount")),
    netDebt: readCell(text(row, "Pro forma net debt")),
    leverage: readCell(text(row, "Pro forma net leverage")),
    unit: unitLabel(text(row, "Reporting unit")),
    basis: basisOf(row),
    line: row.line,
  }));
  return { adjustments, none: null };
}

function liquidityTotal(entry: OutputEntry, unit: string): NetDebtView["liquidityTotal"] {
  const read = statement(entry, "Financials and credit metrics");
  if (typeof read === "string") return null;
  const row = findRow(read, ["Cash plus available revolver"], "Cash plus available revolver");
  if (typeof row === "string") return null;
  // Never converted, never drawn bare: a total in another unit than the Net debt data is not a figure of this tile.
  if (row.unit !== unit) {
    const named = row.unit ? ` (${row.unit})` : "";
    return {
      label: row.label,
      values: [],
      line: row.line,
      reason: BECAUSE(row.label, `it is in another unit${named} than the net debt data`),
    };
  }
  return { label: row.label, values: row.values, line: row.line, reason: null };
}

/** See the exported reader below; a string is the reason the figure is not drawn. */
function readNetDebt(entry: OutputEntry): NetDebtView | string {
  const read = periodTable(entry, "Net debt data", "Net debt data");
  if (typeof read === "string") return read;
  if (!read.unit) return NOT_IN("Net debt data in one unit");
  const at = (name: string) => columnOf(read.table, name);
  const [g, c, n] = [at("Gross debt"), at("Cash"), at("Net debt")];
  if ([g, c, n].some((index) => index < 0)) return BECAUSE("net debt", NOT_A_SHAPE);
  const lev = periodTable(entry, "Chart data: leverage", "Leverage");
  const levAt = typeof lev === "string" ? -1 : columnOf(lev.table, "Net debt / EBITDA");
  const periods = read.rows.map(({ period, row }): NetDebtPeriod => {
    const match =
      typeof lev === "string" ? undefined : lev.rows.find((r) => r.period.label === period.label);
    return {
      label: period.label,
      gross: readCell(row.cells[g] ?? ""),
      cash: readCell(row.cells[c] ?? ""),
      net: readCell(row.cells[n] ?? ""),
      line: row.line,
      leverage: match && levAt >= 0 ? readCell(match.row.cells[levAt] ?? "") : null,
    };
  });
  const liquid = periodTable(entry, "Chart data: liquidity", "Liquidity");
  const liquidity =
    typeof liquid === "string"
      ? []
      : liquid.rows.flatMap(({ period, row }) => {
          const [cash, undrawn, unit] = [
            columnOf(liquid.table, "Cash"),
            columnOf(liquid.table, "Undrawn committed facilities"),
            columnOf(liquid.table, "Reporting unit"),
          ];
          return cash < 0 || undrawn < 0
            ? []
            : [
                {
                  label: period.label,
                  cash: readCell(row.cells[cash] ?? ""),
                  undrawn: readCell(row.cells[undrawn] ?? ""),
                  unit: (row.cells[unit] ?? "").trim(),
                  line: row.line,
                },
              ];
        });
  const { adjustments, none } = adjustmentsOf(entry);
  const levCells =
    typeof lev === "string" || levAt < 0
      ? []
      : lev.rows.map(({ period, row }): PeriodCell => ({
          label: period.label,
          cell: readCell(row.cells[levAt] ?? ""),
          line: row.line,
        }));
  const strip = combine([
    read.rows.map(({ period }) => period),
    typeof lev === "string" || levAt < 0 ? [] : lev.rows.map(({ period }) => period),
  ]);
  return {
    unit: read.unit,
    periods,
    leverageStrip: onto(strip.periods, levCells),
    ordered: strip.ordered,
    unplaced: strip.unplaced,
    comparison: comparisonOf(read.rows.map(({ period }) => period)),
    adjustments,
    noAdjustments: none !== null,
    noAdjustmentsWords: none,
    liquidity,
    liquidityTotal: liquidityTotal(entry, read.unit),
    tableLine: read.table.line,
  };
}

// ---------------------------------------------------------------------------------------------
// Tile 4: EBITDA bridge
// ---------------------------------------------------------------------------------------------

export type BridgeStep = {
  /** The step's label as written. */
  label: string;
  cell: Reading;
  line: number;
  /** A subtotal is a stated intermediate level ("Subtotal before other items"): drawn as a level. */
  kind: "opening" | "change" | "subtotal" | "closing";
};

export type EbitdaBridge = {
  unit: string;
  steps: BridgeStep[];
  /**
   * True when every amount is a stated number and each level (a subtotal, the closing) equals the
   * level before it plus the changes between them, exactly. An internal check for whether the
   * bridge can be drawn; no sum is ever returned or printed.
   */
  reconciles: boolean;
  /** True when a run of stated numbers between two levels does not add up to the later level. */
  breaks: boolean;
  tableLine: number;
};

/**
 * How a step reads in the legend: the opening and closing amounts, a stated subtotal, a stated
 * change that raises or lowers the amount ("decrease" for `Disposal −10`, never an add-back), a
 * stated zero, or a gap.
 */
export type BridgeKind =
  "opening" | "subtotal" | "increase" | "decrease" | "no change" | "gap" | "closing";

export function bridgeKind(step: BridgeStep): BridgeKind {
  if (step.kind !== "change") return step.kind;
  if (step.cell.kind !== "number") return "gap";
  const sign = signOf(step.cell.text);
  return sign === 0 ? "no change" : sign === 1 ? "increase" : "decrease";
}

/** The kinds a bridge's steps take, each once, in step order: what its legend names. */
export function bridgeKinds(bridge: EbitdaBridge): BridgeKind[] {
  return [...new Set(bridge.steps.map(bridgeKind))];
}

/** A row whose whole label is a subtotal or total ("Subtotal before other items", "Total add-backs"). */
const SUBTOTAL = /^(?:sub-?\s?total|total)\b/i;

/**
 * Each run from one level (the opening, a subtotal) to the next (a subtotal, the closing): does
 * the level plus the run's changes equal the next level, exactly? Null for a run with a gap.
 */
function bridgeRuns(steps: readonly BridgeStep[]): (boolean | null)[] {
  const runs: (boolean | null)[] = [];
  let running: string | null = null;
  for (const step of steps) {
    const text = step.cell.kind === "number" ? step.cell.text : null;
    if (step.kind === "change") {
      running = running === null || text === null ? null : sum([running, text]);
      continue;
    }
    if (step.kind !== "opening")
      runs.push(running === null || text === null ? null : signOf(difference(running, text)) === 0);
    running = text;
  }
  return runs;
}

/**
 * Handoff words a foundation figure draws: "Detail is in Evidence." when they cite a source, a
 * named filing included ("see the annual report", "Form 10-K"; S15-4-2), else `safeText`.
 */
export const handoffWords = (text: string) => (citesSource(text) ? IN_EVIDENCE : safeText(text));

/**
 * A cell as drawn: a stated gap keeps its words with its reason through `reasonText` (a source
 * dash is "—"), a reason that cites a source left to Evidence; a number or words through
 * `handoffWords`.
 */
export function cellText(cell: Reading): string {
  if (cell.kind !== "gap") return handoffWords(cell.text);
  const reason = citesSource(cell.reason) ? IN_EVIDENCE : reasonText(cell.reason);
  return `${cell.text.slice(0, cell.text.length - cell.reason.length)}${reason}`;
}

/**
 * The cells of an all-gap figure in the module's own words: the stated gap once when every cell
 * states the same, else each row's label with its own.
 */
function gapWords(cells: readonly { label: string; text: string }[]) {
  const words = (text: string) => cellText(readCell(text));
  const texts = [...new Set(cells.map((cell) => words(cell.text)))];
  if (texts.length === 1) return texts[0] ?? "";
  return cells.map((cell) => `${safeText(cell.label)}: ${words(cell.text)}`).join("; ");
}

/** See the exported reader below; a string is the reason the figure is not drawn. */
function readBridge(entry: OutputEntry): EbitdaBridge | string {
  const table = tableUnder(entry, "Chart data: EBITDA bridge");
  if (!table) return NOT_IN("the EBITDA bridge");
  if (table.rows.length < 3) return BECAUSE("the EBITDA bridge", "it has fewer than three steps");
  const amount = columnOf(table, "Amount");
  const unitAt = columnOf(table, "Reporting unit");
  if (amount < 0 || unitAt < 0) return BECAUSE("the EBITDA bridge", NOT_A_SHAPE);
  const last = table.rows.length - 1;
  const steps = table.rows.map((row, at): BridgeStep => {
    const label = (row.cells[0] ?? "").trim();
    const middle = SUBTOTAL.test(label) ? "subtotal" : "change";
    return {
      label,
      cell: readCell(row.cells[amount] ?? ""),
      line: row.line,
      kind: at === 0 ? "opening" : at === last ? "closing" : middle,
    };
  });
  if (steps.every((step) => step.cell.kind !== "number"))
    return gapWords(steps.map((step) => ({ label: step.label, text: step.cell.text })));
  const units = new Set(
    table.rows.flatMap((row, at) =>
      steps[at]?.cell.kind === "gap" ? [] : [(row.cells[unitAt] ?? "").trim()],
    ),
  );
  const [unit] = [...units];
  if (units.size !== 1 || !unit) return NOT_IN("the EBITDA bridge in one unit");
  const runs = bridgeRuns(steps);
  return {
    unit: unitLabel(unit),
    steps,
    reconciles: runs.every((run) => run === true),
    breaks: runs.includes(false),
    tableLine: table.line,
  };
}

// ---------------------------------------------------------------------------------------------
// Tile 5: segments
// ---------------------------------------------------------------------------------------------

export type Segment = {
  /** The business unit as the handoff names it. */
  name: string;
  /** Net sales per period of the view (null: no row states it). */
  sales: PeriodCell[];
  ebitda: PeriodCell[];
};

export type SegmentView = {
  unit: string;
  periods: Period[];
  comparison: Comparison;
  /** The measures' names as the handoff writes them ("Net sales", "EBITDA As Defined"). */
  salesLabel: string;
  ebitdaLabel: string;
  /** EBITDA rows kept apart when the schedule states more than one definition. */
  mixedEbitda: { name: string; definition: string; values: PeriodCell[] }[];
  segments: Segment[];
  /** Corporate and elimination lines: stated apart, never ranked. */
  apart: Segment[];
  tableLine: number;
} & Placing;

type SegmentCell = {
  name: string;
  measure: "sales" | "ebitda";
  definition: string;
  label: string;
  cell: Reading;
  line: number;
};
type SegmentRead = {
  table: Table;
  cells: SegmentCell[];
  periods: Period[];
  unit: string;
  salesLabel: string;
  ebitdaLabel: string;
} & Placing;

const EBITDA_WORDS =
  /\b(?:(?:Adjusted|Reported|Unadjusted) EBITDA\b|EBITDA\b(?: As Defined\b| \((?:Adjusted|Reported|Unadjusted)\))?)/i;
const SALES_WORDS = /\b(?:net sales|revenue|sales)\b/i;
const SEPARATOR = /[\s,—–-]+/;

/**
 * A wide schedule row label read as segment and measure: "Airframe revenue", "Corporate and
 * eliminations, EBITDA As Defined", "Total Power & Control" (sales), "Unallocated corporate EBITDA
 * As Defined — deduction". Null for a row that is not one segment's figure: a sub-line ("Power &
 * Control — Defense", "Power & Control — Commercial OEM sales") or a group total ("Total segment
 * revenue", "Total revenue"). The handoff contract fixes no label form here; these are the forms
 * the retained handoffs write.
 */
function wideLabel(label: string): Pick<SegmentCell, "name" | "measure" | "definition"> | null {
  const ebitda = EBITDA_WORDS.exec(label);
  const total = /^Total\s+/i.exec(label);
  const sales = SALES_WORDS.exec(label);
  const measure = ebitda ? "ebitda" : total || sales ? "sales" : null;
  if (!measure) return null;
  const cut = ebitda?.index ?? sales?.index ?? label.length;
  const name = label
    .slice(total ? total[0].length : 0, cut)
    .replace(new RegExp(`${SEPARATOR.source}$`), "")
    .trim();
  const groupTotal = total && (sales || /\b(?:segments?|consolidated|group)\b/i.test(name));
  if (!name || groupTotal || /\s[—–]\s/.test(name)) return null;
  return { name, measure, definition: ebitda?.[0] ?? "" };
}

function longSchedule(table: Table, at: (name: string) => number): SegmentRead | string {
  const [nameAt, periodAt, salesAt, ebitdaAt, unitAt] = [
    at("Business unit"),
    at("Period"),
    at("Net sales"),
    at("EBITDA As Defined"),
    at("Unit"),
  ];
  if ([nameAt, periodAt, salesAt, ebitdaAt, unitAt].some((index) => index < 0))
    return BECAUSE("the segment schedule", NOT_A_SHAPE);
  const labels = [...new Set(table.rows.map((row) => (row.cells[periodAt] ?? "").trim()))];
  const ordered = orderByPeriod(labels.map((cell) => ({ cell, item: cell })));
  const units = new Set(table.rows.map((row) => row.cells[unitAt] ?? ""));
  const [unit] = [...units];
  if ("reason" in ordered) return periodsGap("the segment schedule", ordered.reason);
  if (units.size !== 1 || !unit) return SEGMENT_UNITS;
  const ebitdaLabel = table.headers[ebitdaAt] ?? "EBITDA";
  const cells = table.rows.flatMap((row): SegmentCell[] => {
    const name = (row.cells[nameAt] ?? "").trim();
    const { label } = statedPeriod(row.cells[periodAt] ?? "");
    return [
      {
        name,
        measure: "sales",
        definition: "",
        label,
        cell: readCell(row.cells[salesAt] ?? ""),
        line: row.line,
      },
      {
        name,
        measure: "ebitda",
        definition: ebitdaLabel,
        label,
        cell: readCell(row.cells[ebitdaAt] ?? ""),
        line: row.line,
      },
    ];
  });
  return {
    table,
    cells,
    periods: ordered.periods.map(({ period }) => period),
    ...placing(ordered.unplaced),
    unit: unitLabel(unit),
    salesLabel: table.headers[salesAt] ?? "Net sales",
    ebitdaLabel,
  };
}

function wideSchedule(table: Table): SegmentRead | string {
  const columns = statementColumns(table);
  const unitAt = columnOf(table, "Unit");
  if ("reason" in columns) return periodsGap("the segment schedule", columns.reason);
  if (unitAt < 0) return SEGMENT_UNITS;
  const read = table.rows.flatMap((row) => {
    const parsed = wideLabel((row.cells[0] ?? "").trim());
    return parsed ? [{ row, ...parsed }] : [];
  });
  const units = new Set(read.map(({ row }) => row.cells[unitAt] ?? ""));
  const [unit] = [...units];
  if (read.length === 0) return NOT_IN("a net sales or EBITDA row of the segment schedule");
  if (units.size !== 1 || !unit) return SEGMENT_UNITS;
  const cells = read.flatMap(({ row, ...measure }) =>
    columns.periods.map(({ period, item }): SegmentCell => ({
      ...measure,
      label: period.label,
      cell: readCell(row.cells[item] ?? ""),
      line: row.line,
    })),
  );
  const ebitdaLabel = read.find(({ measure }) => measure === "ebitda")?.definition;
  const salesWord = read.flatMap(({ row }) => SALES_WORDS.exec(row.cells[0] ?? "")?.[0] ?? [])[0];
  return {
    table,
    cells,
    periods: columns.periods.map(({ period }) => period),
    ...placing(columns.unplaced),
    unit: unitLabel(unit),
    salesLabel: salesWord ? salesWord.charAt(0).toUpperCase() + salesWord.slice(1) : "Sales",
    ebitdaLabel: ebitdaLabel ?? "EBITDA",
  };
}

/** The schedule in either shape the handoffs write: a Period column, or one column per period. */
function segmentSchedule(entry: OutputEntry): SegmentRead | string {
  const table = tableUnder(entry, "Segment schedule");
  if (!table) return NOT_IN("the segment schedule");
  const at = (name: string) => columnOf(table, name);
  return at("Period") >= 0 ? longSchedule(table, at) : wideSchedule(table);
}

const SEGMENT_UNITS = NOT_IN("the segment schedule in one unit");
const isApart = (name: string) => /^unallocated|\bcorporate\b|\beliminations?\b/i.test(name);

/** See the exported reader below; a string is the reason the figure is not drawn. */
function readSegments(entry: OutputEntry): SegmentView | string {
  const read = segmentSchedule(entry);
  if (typeof read === "string") return read;
  const key = (cell: SegmentCell) =>
    `${normalLabel(cell.name)}|${cell.measure}|${cell.definition.toLowerCase()}|${cell.label}`;
  const twice = read.cells.find(
    (cell, at) => read.cells.findIndex((other) => key(other) === key(cell)) !== at,
  );
  if (twice) {
    const label = twice.measure === "sales" ? read.salesLabel : twice.definition;
    const measure = /^[A-Z][a-z]/.test(label)
      ? label.charAt(0).toLowerCase() + label.slice(1)
      : label;
    return BECAUSE(
      "the segment schedule",
      `${twice.name} ${measure} appears more than once for ${twice.label}`,
    );
  }
  const ebitdaDefinitions = (cells: SegmentCell[]) => [
    ...new Set(cells.map(({ definition }) => definition).filter(Boolean)),
  ];
  const mixed = new Set(ebitdaDefinitions(read.cells).map((label) => label.toLowerCase())).size > 1;
  const series = (cells: SegmentCell[]) =>
    onto(
      read.periods,
      cells.map(({ label, cell, line }) => ({ label, cell, line })),
    );
  const names = [...new Set(read.cells.map((cell) => cell.name))];
  const mixedEbitda: SegmentView["mixedEbitda"] = [];
  const all = names.map((name): Segment => {
    const cells = read.cells.filter((cell) => cell.name === name);
    const ebitda = cells.filter((cell) => cell.measure === "ebitda");
    if (mixed) {
      for (const definition of ebitdaDefinitions(ebitda)) {
        const values = series(ebitda.filter((cell) => cell.definition === definition));
        mixedEbitda.push({ name, definition, values });
      }
    }
    return {
      name,
      sales: series(cells.filter((cell) => cell.measure === "sales")),
      ebitda: mixed ? [] : series(ebitda),
    };
  });
  return {
    unit: read.unit,
    periods: read.periods,
    ordered: read.ordered,
    unplaced: read.unplaced,
    comparison: mixed ? null : comparisonOf(read.periods),
    salesLabel: read.salesLabel,
    ebitdaLabel: mixed ? "EBITDA" : read.ebitdaLabel,
    mixedEbitda,
    segments: all.filter((segment) => !isApart(segment.name)),
    apart: all.filter((segment) => isApart(segment.name)),
    tableLine: read.table.line,
  };
}

// ---------------------------------------------------------------------------------------------
// Tiles 8 and 9: interest cover and the debt stack
// ---------------------------------------------------------------------------------------------

/**
 * The module's own notes under a chart table: each line of the section's text, sources left out
 * (`basisText`); a `Basis:` line is the source reference and stays in Evidence.
 */
function sectionNotes(entry: OutputEntry, heading: string): string[] {
  const sections = entry.sections.filter((section) => section.heading === heading);
  const [only] = sections;
  if (sections.length !== 1 || !only) return [];
  const lines = only.blocks.flatMap((block) =>
    block.type === "text" ? block.text.split("\n") : [],
  );
  const notes = lines.flatMap((line) => {
    if (!line.trim() || /^\s*Basis:/i.test(line)) return [];
    const words = basisText(line);
    return words && words !== IN_EVIDENCE ? [words] : [];
  });
  return [...new Set(notes)];
}

export type InterestCover = {
  /** The measure as the table's column names it ("EBITDA / cash interest"). */
  label: string;
  unit: string;
  /** Every stated period's figure, in the one period order; those it cannot place last. */
  values: PeriodCell[];
  /** The Basis and limitation words per period, sources left out. */
  bases: (string | null)[];
  /** The reader's period words for every value, including any explicit date and qualification. */
  periodDetails: { text: string; qualified: boolean }[];
  /** Consecutive figures the handoff places on different dates or qualifications, or cover bases. */
  separations: { from: string; to: string }[];
  /**
   * The two periods `change` is between: the latest reported period and the reported one before
   * it, never a pro forma, a forecast or an unplaced period. Null with fewer than two.
   */
  comparison: Comparison;
  /**
   * The change between the `comparison` periods (kit `changeBetween`: the same kind exactly one
   * year apart, both stated numbers), with its better/worse from `tone("coverage")`.
   */
  change: Change | null;
  tone: ReturnType<typeof tone>;
  notes: string[];
  tableLine: number;
} & Placing;

const COVER = "Chart data: interest cover";
const COVER_COLUMN = "EBITDA / cash interest";

/** A ratio may repeat its column's stated unit (e.g. "3.1x" in a column measured in x). */
function coverCell(text: string, unit: string): Reading {
  if (/^x$/i.test(unit)) {
    const ratio = readCell(text.trim().replace(/\s*x$/i, ""));
    if (ratio.kind === "number") return ratio;
  }
  return readCell(text);
}

const isoEnd = (period: Period) => / \/ (\d{4})-(\d{2}-\d{2})$/.exec(period.cell ?? "");

const COVER_EBITDA_WORDS = new RegExp(EBITDA_WORDS.source, `${EBITDA_WORDS.flags}g`);
const CASH_INTEREST_BASIS =
  /\b(?:(net|gross) cash interest\b|cash interest(?: paid)?,? (net|gross)\b)/gi;

/** Undefined means no explicit definition; null means conflicting definitions. */
function oneBasis(definitions: string[]): string | null | undefined {
  const unique = new Set(definitions.filter(Boolean));
  return unique.size > 1 ? null : unique.values().next().value;
}

function coverBasis(basis: string) {
  const numerator = [...basis.matchAll(COVER_EBITDA_WORDS)].map(([words]) =>
    words
      .toLowerCase()
      .replace(/ebitda|[()]/g, "")
      .trim(),
  );
  const denominator = [...basis.matchAll(CASH_INTEREST_BASIS)].map(([, prefix, suffix]) =>
    (prefix ?? suffix ?? "").toLowerCase(),
  );
  return { numerator: oneBasis(numerator), denominator: oneBasis(denominator) };
}

const COVER_PERIOD_SOURCE =
  /^(?:(?:annual|quarterly|interim)(?: report)?|(?:Form )?10-?[KQ]|prospectus|[\w.-]+\.[a-z]{2,5})? *(?:\(?p(?:p|g|ages?)?\.? *\d+(?:[-–]\d+)?\)?)?\.?$/i;
const COVER_PERIOD_SOURCE_LABEL = /^(?:per\s+)?(?:Source \d+|(?:the )?SEC filing)\.?$/i;
const COVER_PERIOD_ATTRIBUTION = /^(.*?)(?:\s+(?:per|from|according to)\s+|:\s+)(.+)$/i;

const coverPeriodCitesSource = (text: string) =>
  COVER_PERIOD_SOURCE_LABEL.test(text.trim()) ||
  citesSource(text.trimStart().replace(/^["“'‘]?\d+[KMB]\b/i, ""));

function isCoverPeriodSource(text: string) {
  const candidate = text.trim().replace(/,\s*(?=\(?p(?:p|g|ages?)?\.? *\d)/i, " ");
  return COVER_PERIOD_SOURCE_LABEL.test(candidate) || COVER_PERIOD_SOURCE.test(candidate);
}

/** Retain separated qualifications. An inseparable mix of source and meaning stays in Evidence. */
function coverPeriodQualifier(text: string) {
  const attribution = COVER_PERIOD_ATTRIBUTION.exec(text);
  if (attribution?.[2] && coverPeriodCitesSource(attribution[2])) {
    if (!isCoverPeriodSource(attribution[2])) return null;
    const qualifier = safeText(attribution[1] ?? "");
    return qualifier !== IN_EVIDENCE && !coverPeriodCitesSource(qualifier) ? qualifier : null;
  }
  const visible = safeText(text);
  if (visible !== IN_EVIDENCE && !coverPeriodCitesSource(visible)) return visible;
  return isCoverPeriodSource(text) ? "" : null;
}

/** Keep standalone calculation IDs in Evidence and flag an inseparable mixed clause. */
function coverPeriodClause(clause: string) {
  const raw = clause.replace(/;$/, "");
  if (/^(?:(?:see|per)\s+)?[CD]\d{1,3}\.?$/i.test(raw)) return "";
  const kept = coverPeriodQualifier(raw);
  if (kept === null || SHORT_ID.test(kept)) return null;
  return kept && clause.endsWith(";") ? `${kept};` : kept;
}

/** A dated period has a sortable identifier and a separate, readable qualification. */
function coverPeriod(written: string) {
  const stated = /^(.*? \/ \d{4}-\d{2}-\d{2})\b(.*)$/.exec(written.trim());
  if (!stated?.[1]) {
    const text = handoffWords(written);
    return { key: text, text, qualifier: "" };
  }
  const key = handoffWords(stated[1]);
  const tail = (stated[2] ?? "").trim();
  const wrapped = tail.startsWith("(") && tail.endsWith(")");
  const qualification = wrapped ? tail.slice(1, -1) : tail;
  const parts = clauses(qualification).map(coverPeriodClause);
  const qualifier = parts.filter(Boolean).join(" ").replace(/;$/, "");
  const ambiguous = parts.includes(null);
  const visible = qualifier ? `${key} ${wrapped ? `(${qualifier})` : qualifier}` : key;
  return {
    key,
    text: ambiguous ? `${visible} · ${IN_EVIDENCE}` : visible,
    qualifier: ambiguous ? null : qualifier,
  };
}

function coverPeriodRows(table: Table) {
  if (!table.rows.length) return { reason: "it has no rows" };
  return orderByPeriod(
    table.rows.map((row) => {
      const detail = coverPeriod(row.cells[0] ?? "");
      return { cell: detail.key, item: { row, ...detail } };
    }),
  );
}

type CoverBasis = {
  period: Period;
  definition: ReturnType<typeof coverBasis>;
  qualifier: string | null;
  unplaced: boolean;
};

function coverPeriodsDiffer(prior: CoverBasis, latest: CoverBasis) {
  if (
    prior.unplaced ||
    latest.unplaced ||
    prior.qualifier === null ||
    latest.qualifier === null ||
    prior.qualifier.toLowerCase() !== latest.qualifier.toLowerCase()
  )
    return true;
  const differs = (from: string | null | undefined, to: string | null | undefined) =>
    from === null || to === null || Boolean(from && to && from !== to);
  if (
    differs(prior.definition.numerator, latest.definition.numerator) ||
    differs(prior.definition.denominator, latest.definition.denominator)
  )
    return true;
  if (!yearApart(prior.period, latest.period)) return false;
  const [earlierEnd, laterEnd] = [isoEnd(prior.period), isoEnd(latest.period)];
  return Boolean(
    earlierEnd &&
    laterEnd &&
    (earlierEnd[2] !== laterEnd[2] || Number(laterEnd[1]) - Number(earlierEnd[1]) !== 1),
  );
}

/** See the exported reader below; a string is the reason the figure is not drawn. */
function readCover(entry: OutputEntry): InterestCover | string {
  const table = tableUnder(entry, COVER);
  if (!table) return NOT_IN("interest cover");
  const read = coverPeriodRows(table);
  if ("reason" in read) return periodsGap("interest cover", read.reason);
  const at = columnOf(table, COVER_COLUMN);
  const unitAt = columnOf(table, "Reporting unit");
  const basisAt = columnOf(table, "Basis and limitation");
  if (at < 0 || unitAt < 0) return BECAUSE("interest cover", NOT_A_SHAPE);
  const rows = read.periods.map(({ period, item: { row, text, qualifier } }) => {
    const unit = (row.cells[unitAt] ?? "").trim();
    const statedBasis = row.cells[basisAt] ?? "";
    return {
      period,
      definition: coverBasis(statedBasis),
      basis: basisText(statedBasis),
      text,
      qualifier,
      unplaced: read.unplaced.includes(period.label),
      unit,
      cell: coverCell(row.cells[at] ?? "", unit),
      line: row.line,
    };
  });
  const values = rows.map(({ period, cell, line }): PeriodCell => ({
    label: period.label,
    cell,
    line,
  }));
  if (values.every((value) => value.cell?.kind !== "number"))
    return gapWords(values.map((value) => ({ label: value.label, text: value.cell?.text ?? "" })));
  const units = new Set(rows.map(({ unit }) => unit));
  const [unit] = [...units];
  if (units.size !== 1 || !unit) return NOT_IN("interest cover in one unit");
  const [prior, latest] = rows.filter(({ period }) => isReported(period.label)).slice(-2);
  const comparable = prior && latest && !coverPeriodsDiffer(prior, latest);
  const change = comparable ? changeBetween(prior, latest) : null;
  const separations = rows.slice(1).flatMap((row, at) => {
    const previous = rows[at];
    return previous && coverPeriodsDiffer(previous, row)
      ? [{ from: previous.period.label, to: row.period.label }]
      : [];
  });
  return {
    label: table.headers[at] ?? COVER_COLUMN,
    unit: unitLabel(unit),
    ...placing(read.unplaced),
    values,
    bases: rows.map(({ basis }) => basis),
    periodDetails: rows.map(({ text, qualifier }) => ({ text, qualified: qualifier !== "" })),
    separations,
    comparison: comparable ? { from: prior.period.label, to: latest.period.label } : null,
    change,
    tone: change ? tone("coverage", change.text) : "none",
    notes: sectionNotes(entry, COVER),
    tableLine: table.line,
  };
}

/** One facility of the debt stack, every cell as written. */
export type StackFacility = {
  facility: string;
  /** The stated ranking: a whole number from 1, never falling down the rows. */
  ranking: number;
  /** The Secured cell as written ("Yes", "No"). */
  secured: string;
  amount: Reading;
  /** The Cumulative leverage cell as written. */
  leverage: Reading;
  basis: string | null;
  line: number;
};

export type DebtStack = {
  unit: string;
  /** The facilities in the module's order (its ranking order); same-rank order is as written. */
  facilities: StackFacility[];
  notes: string[];
  tableLine: number;
};

const STACK_TABLE = "Chart data: debt stack";
const STACK_HEADERS = [
  "Facility",
  "Ranking",
  "Secured",
  "Amount",
  "Cumulative leverage",
  "Reporting unit",
] as const;
const RANKING = /^[1-9]\d*$/;

/** See the exported reader below; a string is the reason the figure is not drawn. */
function readStack(entry: OutputEntry): DebtStack | string {
  const table = tableUnder(entry, STACK_TABLE);
  if (!table) return NOT_IN("the debt stack");
  const [name, rank, secured, amount, leverage, unitAt] = STACK_HEADERS.map((header) =>
    columnOf(table, header),
  );
  if ([name, rank, secured, amount, leverage, unitAt].some((at) => at === undefined || at < 0))
    return BECAUSE("the debt stack", NOT_A_SHAPE);
  const cell = (row: Row, at: number | undefined) => (row.cells[at ?? -1] ?? "").trim();
  if (table.rows.length === 0) return BECAUSE("the debt stack", "it has no rows");
  const amounts = table.rows.map((row) => readCell(cell(row, amount)));
  if (amounts.every((reading) => reading.kind !== "number"))
    return gapWords(
      table.rows.map((row, at) => ({ label: cell(row, name), text: amounts[at]?.text ?? "" })),
    );
  const ranks = table.rows.map((row) => cell(row, rank));
  const inOrder = ranks.every(
    (text, at) => RANKING.test(text) && (at === 0 || Number(ranks[at - 1]) <= Number(text)),
  );
  if (!inOrder)
    return BECAUSE(
      "the debt stack",
      "a ranking is not a whole number from 1 that never falls down the rows",
    );
  const units = new Set(
    table.rows.flatMap((row, at) => (amounts[at]?.kind === "gap" ? [] : [cell(row, unitAt)])),
  );
  const [unit] = [...units];
  if (units.size !== 1 || !unit) return NOT_IN("the debt stack in one unit");
  const basisAt = columnOf(table, "Basis and limitation");
  return {
    unit: unitLabel(unit),
    facilities: table.rows.map((row, at): StackFacility => ({
      facility: cell(row, name),
      ranking: Number(ranks[at]),
      secured: cell(row, secured),
      amount: amounts[at] ?? readCell(""),
      leverage: readCell(cell(row, leverage)),
      basis: basisAt < 0 ? null : basisText(cell(row, basisAt)),
      line: row.line,
    })),
    notes: sectionNotes(entry, STACK_TABLE),
    tableLine: table.line,
  };
}

/**
 * Whether the periods tile is drawn: when the figures state three or more periods, a period that
 * is not a fiscal or calendar year, or a table whose periods cannot be read. Two annual periods
 * (or one) are named in the first tile's head instead.
 */
export function showPeriodsTile(entry: OutputEntry): boolean {
  const periods = statedPeriods(entry);
  return (
    periods.labels.length >= 3 ||
    periods.gaps.length > 0 ||
    periods.kind === "other" ||
    !periods.ordered
  );
}

// ---------------------------------------------------------------------------------------------
// The readers, and why a figure is not drawn
// ---------------------------------------------------------------------------------------------

const ready = <T>(read: T | string): T | null => (typeof read === "string" ? null : read);

/** The composed figure's data: money measures on one unit and the leverage ratio, every stated period. */
export const earningsAgainstDebt = (entry: OutputEntry) => ready(readEarnings(entry));
/** The ladder from the handoff's own stated levels and deductions, every period; no plug, no end level. */
export const cashLadder = (entry: OutputEntry) => ready(readLadder(entry));
/** Net debt for every stated period, the stated adjustments as written, and stated liquidity. */
export const netDebtView = (entry: OutputEntry) => ready(readNetDebt(entry));
/** The steps of `Chart data: EBITDA bridge`; the first is the opening, the last the closing. */
export const ebitdaBridge = (entry: OutputEntry) => ready(readBridge(entry));
/** Net sales and EBITDA per segment as written, every stated period; corporate lines apart; no sum, no ratio. */
export const segmentView = (entry: OutputEntry) => ready(readSegments(entry));
/** EBITDA / cash interest for every stated period, in the one period order, each cell as written. */
export const interestCover = (entry: OutputEntry) => ready(readCover(entry));
/** The debt stack in the module's ranking order: amounts and cumulative leverage as written. */
export const debtStack = (entry: OutputEntry) => ready(readStack(entry));

export type Figure = "earnings" | "ladder" | "netDebt" | "bridge" | "segments" | "cover" | "stack";
const READERS: Record<Figure, (entry: OutputEntry) => unknown> = {
  earnings: readEarnings,
  ladder: readLadder,
  netDebt: readNetDebt,
  bridge: readBridge,
  segments: readSegments,
  cover: readCover,
  stack: readStack,
};

/**
 * Why a figure's reader returns null, in the one gap form ("This page could not read the periods
 * of net debt data because FY2024 appears more than once."), or the module's own reason for an
 * all-gap figure; null when it draws.
 */
export function figureGap(entry: OutputEntry, figure: Figure): string | null {
  const read = READERS[figure](entry);
  return typeof read === "string" ? read : null;
}
