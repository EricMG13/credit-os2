import { unitLabel, type OutputEntry, type Row, type Table } from "../../../publishedReport";
import { tone } from "../../../signal";
import { difference, readCell, signOf, sum, type Reading } from "../kit/numbers";
import { changeBetween, type Change } from "../kit/changes";
import { IN_EVIDENCE, reasonText, safeText } from "../kit/reader";
import {
  allTables,
  columnOf,
  comparisonOf,
  isUnordered,
  normalLabel,
  UNORDERED_SENTENCE,
  orderByPeriod,
  periodLabel,
  periodOf,
  periodRows,
  rowStarting,
  statementColumns,
  tableName,
  tableUnder,
  tableWith,
  unionPeriods,
  type Ordered,
  type Period,
} from "../kit/tables";

// The CP-1 data contract. Every reader returns the figures the handoff states, as written: every
// stated period (one, two or more) in year order, gaps in place with their own reasons, and no
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
 * A period as the kit read it. In a set the kit cannot put in time order, a label that names no
 * year is kept as written (its year unknown, `NaN`): it is drawn in the handoff's order, never placed.
 */
const asWritten = (label: string, period: Period | null): Period =>
  period ?? {
    label,
    kind: "other",
    form: label.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    year: Number.NaN,
  };

/**
 * Items in time order (`ordered`), or, when the kit cannot put them in time order, every item in the
 * handoff's order with its period as written (`ordered: false`: drawn with no line, no change and
 * `UNORDERED_SENTENCE`). A string for a stated gap (a period stated twice, no rows).
 */
type InOrder<T> = { items: { period: Period; item: T }[]; ordered: boolean };
function inOrder<T>(read: Ordered<T>): InOrder<T> | string {
  if ("periods" in read) return { items: read.periods, ordered: true };
  if (isUnordered(read))
    return {
      items: read.stated.map(({ label, period, item }) => ({
        period: asWritten(label, period),
        item,
      })),
      ordered: false,
    };
  return read.reason;
}

/**
 * The periods of several lists once each: in time order when every list is in time order and the
 * whole set can be put in time order; otherwise as first stated (`ordered: false`).
 */
function combine(lists: readonly (readonly Period[])[], ordered: boolean) {
  if (ordered) {
    const periods = unionPeriods(lists);
    const check = orderByPeriod(periods.map((period) => ({ cell: period.label, item: period })));
    if ("periods" in check) return { periods, ordered: true };
  }
  const seen = new Map<string, Period>();
  for (const period of lists.flat()) if (!seen.has(period.label)) seen.set(period.label, period);
  return { periods: [...seen.values()], ordered: false };
}

/** A period-rows table read: its rows by period, and its one unit when every row states the same. */
type PeriodTable = {
  table: Table;
  rows: { period: Period; row: Row }[];
  unit: string | null;
  /** False when the rows are in the handoff's order because no time order can be told. */
  ordered: boolean;
};

/** Chart and net debt tables: rows by period with a `Reporting unit` column; a reason when unreadable. */
function periodTable(entry: OutputEntry, heading: string, what: string): PeriodTable | string {
  const table = tableUnder(entry, heading);
  if (!table) return NOT_IN(what);
  const read = inOrder(periodRows(table));
  if (typeof read === "string") return periodsGap(tableName(heading), read);
  const unitAt = columnOf(table, "Reporting unit");
  const units = new Set(read.items.map(({ item }) => item.cells[unitAt] ?? ""));
  const [unit] = [...units];
  return {
    table,
    rows: read.items.map(({ period, item }) => ({ period, row: item })),
    unit: unitAt >= 0 && units.size === 1 && unit ? unitLabel(unit) : null,
    ordered: read.ordered,
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
type Statement = { table: Table; columns: { period: Period; at: number }[]; ordered: boolean };

function statement(entry: OutputEntry, heading: string): Statement | string {
  const table = tableUnder(entry, heading);
  if (!table) return NOT_IN(`the ${inSentence(tableName(heading))}`);
  const read = inOrder(statementColumns(table));
  if (typeof read === "string") return periodsGap(tableName(heading), read);
  return {
    table,
    columns: read.items.map(({ period, item }) => ({ period, at: item })),
    ordered: read.ordered,
  };
}

/** One row of a statement, every period, with its unit. */
type StatementRow = {
  label: string;
  values: PeriodCell[];
  unit: string | null;
  line: number;
  ordered: boolean;
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
    unit: unit ? unitLabel(unit) : null,
    line: row.line,
    ordered: read.ordered,
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

const periodsOf = (values: readonly PeriodCell[]): Period[] =>
  values.map((value) => asWritten(value.label, periodOf(value.label)));

// A cell's clauses that name a source, a register or a calculation are left out; the rest are the
// module's own words, in its order. `safeText` screens each clause; a short calculation id ("C3")
// the kit's screen does not catch is caught here too.
const SHORT_ID = /\b[CD]\d{1,3}\b/;

/** The module's own words of a Basis and limitation cell, without the clauses that cite a source. */
export function basisText(cell: string): string | null {
  const clauses = cell
    .trim()
    .split(/(?<=[;.])\s+/)
    .filter(Boolean);
  const kept = clauses.filter((clause) => {
    const words = clause.replace(/[;.]$/, "");
    return words && !SHORT_ID.test(words) && safeText(words) !== IN_EVIDENCE;
  });
  if (kept.length === 0) return clauses.length ? IN_EVIDENCE : null;
  const text = kept.map((clause) => safeText(clause)).join(" ");
  return text.replace(/;$/, ".");
}

// ---------------------------------------------------------------------------------------------
// The periods the figures cover (the periods strip)
// ---------------------------------------------------------------------------------------------

export type StatedPeriods = {
  /** Every period the figure tables state, by year; periods of different kinds are all listed. */
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
  /** False when the periods cannot be put in time order: they are listed as first stated. */
  ordered: boolean;
};

const ROW_TABLES = [
  "Chart data: revenue and EBITDA",
  "Net debt data",
  "Chart data: leverage",
  "Chart data: liquidity",
  "Chart data: interest cover",
] as const;
const STATEMENTS = ["T4.4 Income statement", "T4.5 Cash flow statement"] as const;

/** The periods the CP-1 figures cover, read from the tables they draw (the maturity buckets are not periods). */
export function statedPeriods(entry: OutputEntry): StatedPeriods {
  const tables: StatedPeriods["tables"] = [];
  const gaps: StatedPeriods["gaps"] = [];
  const lists: Period[][] = [];
  let ordered = true;
  const add = (heading: string, given: Ordered<unknown>) => {
    const table = tableName(heading);
    const read = inOrder(given);
    if (typeof read === "string") {
      gaps.push({ table, reason: periodsGap(table, read) });
      return;
    }
    ordered &&= read.ordered;
    lists.push(read.items.map(({ period }) => period));
    tables.push({ table, labels: read.items.map(({ period }) => period.label) });
  };
  const found = allTables(entry);
  for (const heading of [...ROW_TABLES, ...STATEMENTS]) {
    const same = found.filter((item) => item.heading === heading);
    const [only] = same;
    if (same.length > 1)
      gaps.push({
        table: tableName(heading),
        reason: periodsGap(tableName(heading), "it appears more than once"),
      });
    else if (only)
      add(
        heading,
        (STATEMENTS as readonly string[]).includes(heading)
          ? statementColumns(only.table)
          : periodRows(only.table),
      );
  }
  const segments = segmentSchedule(entry);
  if (typeof segments !== "string") {
    const items = segments.periods.map((period) => ({ period, item: 0 }));
    add(
      "Segment schedule",
      segments.ordered
        ? { periods: items }
        : {
            unordered: true,
            reason: UNORDERED_SENTENCE,
            stated: items.map(({ period, item }) => ({ label: period.label, period, item })),
          },
    );
  }
  const all = combine(lists, ordered);
  const { periods } = all;
  return {
    labels: periods.map((period) => period.label),
    periods,
    kind: periods.length > 0 && periods.every((p) => p.kind === "annual") ? "annual" : "other",
    comparison: all.ordered ? comparisonOf(periods) : null,
    tables,
    gaps,
    ordered: all.ordered,
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
  /** Every stated period: in time order, or as first stated when `ordered` is false. */
  periods: Period[];
  /** False when the periods cannot be put in time order: no line, no change, the sentence once. */
  ordered: boolean;
  comparison: Comparison;
  measures: EarningsMeasure[];
  /** Measures the handoff does not carry on this unit, with the reason in words. */
  absent: { label: string; reason: string }[];
  leverage: LeverageSeries | null;
  /** The leverage table's Basis and limitation words for its latest period; never assumed. */
  leverageBasis: string | null;
  tableLine: number;
};

type Read =
  | { label: string; values: PeriodCell[]; unit: string | null; line: number; ordered: boolean }
  | string;

function chartMeasure(entry: OutputEntry, heading: string, column: string, label: string): Read {
  const read = periodTable(entry, heading, label);
  if (typeof read === "string") return read;
  const values = columnCells(read, column);
  if (!values) return NOT_IN(label);
  if (!read.unit) return NOT_IN(`${label} in one unit`);
  return { label, values, unit: read.unit, line: read.table.line, ordered: read.ordered };
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
  const { periods, ordered } = combine(
    [...ready.map(({ read }) => periodsOf(read.values)), levValues ? periodsOf(levValues) : []],
    ready.every(({ read }) => read.ordered) && (typeof lev === "string" || lev.ordered),
  );
  const comparison = ordered ? comparisonOf(periods) : null;
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
    const latest = lev.rows.at(-1)?.period.label;
    leverageBasis = latest ? basisOf(latest) : null;
  }
  return {
    unit,
    periods,
    ordered,
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
  /** False when the periods cannot be put in time order: each is drawn as stated, none compared. */
  ordered: boolean;
  comparison: Comparison;
  steps: LadderStep[];
  line: number;
};

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
function kpiLevel(entry: OutputEntry, spec: LadderSpec): StatementRow | string {
  const NONE = NOT_IN(`${spec.name} in the cash flow statement or the KPI dashboard`);
  const read = statement(entry, "T4.10 KPI dashboard");
  const nameAt = typeof read === "string" ? -1 : columnOf(read.table, "Metric Name");
  if (typeof read === "string" || nameAt < 0) return NONE;
  const row = rowStarting(read.table, [...spec.prefixes, ...(spec.kpi ?? [])], nameAt);
  if (row === "none") return NONE;
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

/** One ladder row: the cash flow statement first; a level it lacks may come from the KPI dashboard. */
function ladderRow(entry: OutputEntry, spec: LadderSpec, source: Statement | string) {
  if (typeof source === "string") return source;
  const row = rowStarting(source.table, spec.prefixes);
  if (row === "none" && spec.kind === "level" && spec.key !== "ebitda")
    return kpiLevel(entry, spec);
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
  const { periods, ordered } = combine(
    usable.map(({ read }) => (typeof read === "string" ? [] : periodsOf(read.values))),
    usable.every(({ read }) => typeof read === "string" || read.ordered),
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
  const comparison = ordered ? comparisonOf(periods) : null;
  return { unit, periods, ordered, comparison, steps, line: cash.table.line };
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

export type LiquidityPeriod = { label: string; cash: Reading; undrawn: Reading; line: number };

export type NetDebtView = {
  unit: string;
  /** Every period of `Net debt data`: by year, or as stated when `ordered` is false. */
  periods: NetDebtPeriod[];
  /**
   * Net debt / EBITDA for every period of `Net debt data` and of the leverage table (a leverage
   * row with no net debt row, such as "FY2024 pro forma", is kept with its period as written).
   */
  leverageStrip: PeriodCell[];
  /** False when the periods cannot be put in time order: nothing joined, nothing compared. */
  ordered: boolean;
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
  liquidityTotal: { label: string; values: PeriodCell[]; line: number } | null;
  tableLine: number;
};

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

function liquidityTotal(entry: OutputEntry): NetDebtView["liquidityTotal"] {
  const read = statement(entry, "Financials and credit metrics");
  if (typeof read === "string") return null;
  const row = findRow(read, ["Cash plus available revolver"], "Cash plus available revolver");
  return typeof row === "string" ? null : { label: row.label, values: row.values, line: row.line };
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
          const [cash, undrawn] = [
            columnOf(liquid.table, "Cash"),
            columnOf(liquid.table, "Undrawn committed facilities"),
          ];
          return cash < 0 || undrawn < 0
            ? []
            : [
                {
                  label: period.label,
                  cash: readCell(row.cells[cash] ?? ""),
                  undrawn: readCell(row.cells[undrawn] ?? ""),
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
  const strip = combine(
    [
      read.rows.map(({ period }) => period),
      levCells.map(({ label }) => asWritten(label, periodOf(label))),
    ],
    read.ordered && (typeof lev === "string" || lev.ordered),
  );
  return {
    unit: read.unit,
    periods,
    leverageStrip: onto(strip.periods, levCells),
    ordered: strip.ordered,
    comparison: strip.ordered ? comparisonOf(read.rows.map(({ period }) => period)) : null,
    adjustments,
    noAdjustments: none !== null,
    noAdjustmentsWords: none,
    liquidity,
    liquidityTotal: liquidityTotal(entry),
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
 * A cell as drawn: a stated gap keeps its words with its reason through `reasonText` (a source
 * dash is "—"); a number or words through `safeText`.
 */
export function cellText(cell: Reading): string {
  if (cell.kind !== "gap") return safeText(cell.text);
  return `${cell.text.slice(0, cell.text.length - cell.reason.length)}${reasonText(cell.reason)}`;
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
  /** False when the periods cannot be put in time order: none is compared. */
  ordered: boolean;
  comparison: Comparison;
  /** The measures' names as the handoff writes them ("Net sales", "EBITDA As Defined"). */
  salesLabel: string;
  ebitdaLabel: string;
  segments: Segment[];
  /** Corporate and elimination lines: stated apart, never ranked. */
  apart: Segment[];
  tableLine: number;
};

type SegmentCell = {
  name: string;
  measure: "sales" | "ebitda";
  label: string;
  cell: Reading;
  line: number;
};
type SegmentRead = {
  table: Table;
  cells: SegmentCell[];
  periods: Period[];
  ordered: boolean;
  unit: string;
  salesLabel: string;
  ebitdaLabel: string;
};

const EBITDA_WORDS = /EBITDA(?: As Defined| \((?:Adjusted|Reported)\))?/i;
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
function wideLabel(label: string): { name: string; measure: "sales" | "ebitda" } | null {
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
  return { name, measure };
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
  const ordered = inOrder(orderByPeriod(labels.map((cell) => ({ cell, item: cell }))));
  const units = new Set(table.rows.map((row) => row.cells[unitAt] ?? ""));
  const [unit] = [...units];
  if (typeof ordered === "string") return periodsGap("the segment schedule", ordered);
  if (units.size !== 1 || !unit) return SEGMENT_UNITS;
  const cells = table.rows.flatMap((row): SegmentCell[] => {
    const name = (row.cells[nameAt] ?? "").trim();
    const written = row.cells[periodAt] ?? "";
    const label = periodOf(written)?.label ?? periodLabel(written);
    return [
      { name, measure: "sales", label, cell: readCell(row.cells[salesAt] ?? ""), line: row.line },
      { name, measure: "ebitda", label, cell: readCell(row.cells[ebitdaAt] ?? ""), line: row.line },
    ];
  });
  return {
    table,
    cells,
    periods: ordered.items.map(({ period }) => period),
    ordered: ordered.ordered,
    unit: unitLabel(unit),
    salesLabel: table.headers[salesAt] ?? "Net sales",
    ebitdaLabel: table.headers[ebitdaAt] ?? "EBITDA",
  };
}

function wideSchedule(table: Table): SegmentRead | string {
  const columns = inOrder(statementColumns(table));
  const unitAt = columnOf(table, "Unit");
  if (typeof columns === "string") return periodsGap("the segment schedule", columns);
  if (unitAt < 0) return SEGMENT_UNITS;
  const read = table.rows.flatMap((row) => {
    const parsed = wideLabel((row.cells[0] ?? "").trim());
    return parsed ? [{ row, ...parsed }] : [];
  });
  const units = new Set(read.map(({ row }) => row.cells[unitAt] ?? ""));
  const [unit] = [...units];
  if (read.length === 0) return NOT_IN("a net sales or EBITDA row of the segment schedule");
  if (units.size !== 1 || !unit) return SEGMENT_UNITS;
  const cells = read.flatMap(({ row, name, measure }) =>
    columns.items.map(({ period, item }): SegmentCell => ({
      name,
      measure,
      label: period.label,
      cell: readCell(row.cells[item] ?? ""),
      line: row.line,
    })),
  );
  const ebitdaLabel = read.flatMap(
    ({ row }) => EBITDA_WORDS.exec(row.cells[0] ?? "")?.[0] ?? [],
  )[0];
  const salesWord = read.flatMap(({ row }) => SALES_WORDS.exec(row.cells[0] ?? "")?.[0] ?? [])[0];
  return {
    table,
    cells,
    periods: columns.items.map(({ period }) => period),
    ordered: columns.ordered,
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
  const key = (cell: SegmentCell) => `${normalLabel(cell.name)}|${cell.measure}|${cell.label}`;
  const twice = read.cells.find(
    (cell, at) => read.cells.findIndex((other) => key(other) === key(cell)) !== at,
  );
  if (twice) {
    const label = twice.measure === "sales" ? read.salesLabel : read.ebitdaLabel;
    const measure = /^[A-Z][a-z]/.test(label)
      ? label.charAt(0).toLowerCase() + label.slice(1)
      : label;
    return BECAUSE(
      "the segment schedule",
      `${twice.name} ${measure} appears more than once for ${twice.label}`,
    );
  }
  const names = [...new Set(read.cells.map((cell) => cell.name))];
  const series = (name: string, measure: SegmentCell["measure"]) =>
    onto(
      read.periods,
      read.cells
        .filter((cell) => cell.name === name && cell.measure === measure)
        .map((cell) => ({ label: cell.label, cell: cell.cell, line: cell.line })),
    );
  const all = names.map((name): Segment => ({
    name,
    sales: series(name, "sales"),
    ebitda: series(name, "ebitda"),
  }));
  return {
    unit: read.unit,
    periods: read.periods,
    ordered: read.ordered,
    comparison: read.ordered ? comparisonOf(read.periods) : null,
    salesLabel: read.salesLabel,
    ebitdaLabel: read.ebitdaLabel,
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
  /** False when the periods cannot be put in time order: they are then in the order stated. */
  ordered: boolean;
  /** Every stated period's figure: in time order, or as stated when `ordered` is false. */
  values: PeriodCell[];
  /** The Basis and limitation words per period, sources left out. */
  bases: (string | null)[];
  /**
   * The change from the period before the latest to the latest (kit `changeBetween`: the same kind
   * exactly one year apart, both stated numbers), with its better/worse from `tone("coverage")`.
   */
  change: Change | null;
  tone: ReturnType<typeof tone>;
  notes: string[];
  tableLine: number;
};

const COVER = "Chart data: interest cover";
const COVER_COLUMN = "EBITDA / cash interest";

/** See the exported reader below; a string is the reason the figure is not drawn. */
function readCover(entry: OutputEntry): InterestCover | string {
  const table = tableUnder(entry, COVER);
  if (!table) return NOT_IN("interest cover");
  const given = inOrder(periodRows(table));
  if (typeof given === "string") return periodsGap("interest cover", given);
  const read = {
    rows: given.items.map(({ period, item }) => ({
      label: period.label,
      period: Number.isNaN(period.year) ? null : period,
      row: item,
    })),
    ordered: given.ordered,
  };
  const [at, unitAt, basisAt] = [COVER_COLUMN, "Reporting unit", "Basis and limitation"].map(
    (header) => columnOf(table, header),
  );
  if (at === undefined || at < 0 || unitAt === undefined || unitAt < 0)
    return BECAUSE("interest cover", NOT_A_SHAPE);
  const values = read.rows.map(({ label, row }): PeriodCell => ({
    label,
    cell: readCell(row.cells[at] ?? ""),
    line: row.line,
  }));
  if (values.every((value) => value.cell?.kind !== "number"))
    return gapWords(values.map((value) => ({ label: value.label, text: value.cell?.text ?? "" })));
  const units = new Set(read.rows.map(({ row }) => (row.cells[unitAt] ?? "").trim()));
  const [unit] = [...units];
  if (units.size !== 1 || !unit) return NOT_IN("interest cover in one unit");
  const [prior, latest] = read.ordered ? read.rows.slice(-2) : [];
  const [from, to] = values.slice(-2);
  const change =
    prior?.period && latest?.period && from && to && read.rows.length >= 2
      ? changeBetween(
          { period: prior.period, cell: from.cell, unit },
          { period: latest.period, cell: to.cell, unit },
        )
      : null;
  return {
    label: table.headers[at] ?? COVER_COLUMN,
    unit: unitLabel(unit),
    ordered: read.ordered,
    values,
    bases: read.rows.map(({ row }) =>
      basisAt === undefined || basisAt < 0 ? null : basisText(row.cells[basisAt] ?? ""),
    ),
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
/** EBITDA / cash interest for every stated period, in time order, each cell as written. */
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
