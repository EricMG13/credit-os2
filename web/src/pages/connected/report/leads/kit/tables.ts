import type { OutputEntry, Row, Table } from "../../../publishedReport";
import { orderPeriods } from "@/utils/periodOrder";
import { periodGapNote } from "@/components/chart/seriesData";
import { latestReported as latestPlaced, periodPlace } from "../../../reportView";
import { changePeriod, yearApart, type ChangePeriod } from "./changes";

/** Every table of the entry, in the order the handoff wrote them, with its section's heading. */
export function allTables(entry: OutputEntry) {
  return entry.sections.flatMap(({ heading, blocks }) =>
    blocks.flatMap((block) => (block.type === "table" ? [{ heading, table: block }] : [])),
  );
}

/** The one table of the section with this heading; null when absent or when the section holds several. */
export function tableUnder(entry: OutputEntry, heading: string): Table | null {
  const found = allTables(entry).filter((item) => item.heading === heading);
  return found.length === 1 ? (found[0]?.table ?? null) : null;
}

/** The one table anywhere in the entry that carries all of these headers; null when none or several. */
export function tableWith(entry: OutputEntry, headers: readonly string[]): Table | null {
  const found = allTables(entry).filter(({ table }) =>
    headers.every((name) => table.headers.includes(name)),
  );
  return found.length === 1 ? (found[0]?.table ?? null) : null;
}

/** The column of a header, or -1. */
export const columnOf = (table: Table, header: string) => table.headers.indexOf(header);

/** The one row whose first cell is this label (case-insensitive); null if absent or repeated. */
export function rowLabelled(table: Table, label: string, column = 0): Row | null {
  const wanted = label.trim().toLowerCase();
  const found = table.rows.filter(
    (row) => (row.cells[column] ?? "").trim().toLowerCase() === wanted,
  );
  return found.length === 1 ? (found[0] ?? null) : null;
}

/** A row label compared without case, punctuation or spacing ("Cash taxes paid, net of refunds" → "cash taxes paid net of refunds"). */
export const normalLabel = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * The one row whose label begins with one of these words, compared as `normalLabel` on whole words
 * ("cash taxes paid" matches "Cash taxes paid, net of refunds" and "Cash Taxes Paid", not "Cash
 * taxes paidout"). "none" when no row does, "several" when more than one does: never a guess.
 */
export function rowStarting(
  table: Table,
  prefixes: readonly string[],
  column = 0,
): Row | "none" | "several" {
  const wanted = prefixes.map(normalLabel);
  const found = table.rows.filter((row) => {
    const label = normalLabel(row.cells[column] ?? "");
    return wanted.some((prefix) => label === prefix || label.startsWith(`${prefix} `));
  });
  if (found.length === 0) return "none";
  return found.length === 1 && found[0] ? found[0] : "several";
}

/** A period label as the handoff writes it ("FY2024 / 2024-09-30" → "FY2024"). */
export const periodLabel = (cell: string) => (cell.split(" / ")[0] ?? "").trim();

/**
 * A period as the change rule reads its label (`changePeriod`), with the whole `cell` where the
 * handoff writes more than the label (a stated date, "FY2024 / 2024-09-30"): the period order
 * reads the cell, so a period that states its date goes by that date.
 */
export type Period = ChangePeriod & { cell?: string };

/** The period a cell names, or null when it names no year (`Thereafter`, `Current`). See `changePeriod`. */
export function periodOf(cell: string): Period | null {
  const period = changePeriod(periodLabel(cell));
  const written = cell.trim();
  return period && (written === period.label ? period : { ...period, cell: written });
}

/**
 * The period of a cell, read (`periodOf`) or, for a label that names no year, kept as written (its
 * year unknown, `NaN`): such a period is still drawn, and the period order places it where it can
 * (an undated `LTM` after the dated ones) or leaves it last.
 */
export function statedPeriod(cell: string): Period {
  const label = periodLabel(cell);
  return (
    periodOf(cell) ?? {
      label,
      kind: "other",
      form: label.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      year: Number.NaN,
    }
  );
}

/** What the one period order reads for a period: its cell where the handoff wrote a date, else its label. */
const written = (period: Period) => period.cell ?? period.label;

/**
 * True for a reported period: an actual, a year to date or a last twelve months (`periodPlace`).
 * A pro forma, a forecast and a label the period order cannot read are not.
 */
export const isReported = (label: string) => periodPlace(label)?.reported === true;

/**
 * The latest reported one of these items, as `latestReported` of reportView chooses it among the
 * ones the period order can place: the last of the reported classes, never a pro forma or
 * forecast one. Undefined where it chooses none (no reported period, two periods on one place).
 */
export function latestReportedItem<T>(items: readonly T[], label: (item: T) => string) {
  const place = (item: T) => periodPlace(label(item));
  return latestPlaced(items.filter(place), place)?.latest;
}

/**
 * What a figure says of the periods the period order could not place: they are drawn last, as the
 * handoff lists them, and named here (the wording of `periodGapNote`). Nothing when all are placed.
 */
export function unplacedNotes(unplaced: readonly string[], stated: number): string[] {
  const note = periodGapNote(unplaced, undefined, unplaced.length === stated);
  return note ? [note] : [];
}

/**
 * Items in the one period order (`orderPeriods`: fiscal years oldest first, then year to date,
 * last twelve months, pro forma, forecasts), every one kept; `unplaced` names the periods that
 * order cannot read, which come last in the handoff's order. Or a stated gap (`reason`) when one
 * period is stated twice.
 */
export type Ordered<T> =
  { periods: { period: Period; item: T }[]; unplaced: string[] } | { reason: string };

/** Two readings of one period: one form and one year (an unread label: the same letters). */
const samePeriod = (a: Period, b: Period) => a.form === b.form && Object.is(a.year, b.year);

/**
 * Items keyed by a period cell, in the one period order; see `Ordered`. A stated gap when one
 * period (one form, one year) is stated twice.
 */
export function orderByPeriod<T>(items: readonly { cell: string; item: T }[]): Ordered<T> {
  const read = items.map(({ cell, item }) => ({ period: statedPeriod(cell), item }));
  const twice = read.find(
    ({ period }, at) => read.findIndex((other) => samePeriod(other.period, period)) !== at,
  );
  if (twice) return { reason: `${twice.period.label} appears more than once` };
  const { ordered, gaps } = orderPeriods(read, ({ period }) => written(period));
  return { periods: ordered, unplaced: gaps.map(({ period }) => period.label) };
}

/** The rows of a period-rows table (`Chart data: …`, `Net debt data`), ordered by period; see `orderByPeriod`. */
export function periodRows(table: Table, column = 0): Ordered<Row> {
  if (table.rows.length === 0) return { reason: "it has no rows" };
  return orderByPeriod(table.rows.map((row) => ({ cell: row.cells[column] ?? "", item: row })));
}

/** The period columns of a statement table (`| Line item | FY2024 | FY2023 | Unit | …`): every header after the first that names a year. */
export function statementColumns(table: Table): Ordered<number> {
  const columns = table.headers.flatMap((header, at) =>
    at > 0 && periodOf(header) ? [{ cell: header.trim(), item: at }] : [],
  );
  if (columns.length === 0) return { reason: "it has no column named for a period" };
  return orderByPeriod(columns);
}

/**
 * Every period of these lists once (by label; the reading that states a date is kept), in the one
 * period order, with the labels that order cannot place last and named. Periods of different
 * kinds are all kept, never collapsed.
 */
export function unionPeriods(lists: readonly (readonly Period[])[]) {
  const seen = new Map<string, Period>();
  for (const period of lists.flat()) {
    const known = seen.get(period.label);
    if (!known || (known.cell === undefined && period.cell !== undefined))
      seen.set(period.label, period);
  }
  const { ordered, gaps } = orderPeriods([...seen.values()], written);
  return { periods: ordered, unplaced: gaps.map((period) => period.label) };
}

/**
 * The two periods a comparison is drawn between, earlier first: the latest two reported periods
 * of one form (never a pro forma or a forecast: `isReported`), annual periods first (`FY2023 →
 * FY2024` beside an `LTM Dec-2024`), and only when they are exactly one year apart (`yearApart`).
 * Null with fewer than two of one form and for two periods more than a year apart: one period is
 * drawn as stated, never compared.
 */
export function comparisonOf(periods: readonly Period[]): { from: string; to: string } | null {
  const reported = unionPeriods([periods]).periods.filter((period) => isReported(period.label));
  const annual = reported.filter((period) => period.kind === "annual");
  const pool = annual.length > 0 ? annual : reported;
  const form = pool.at(-1)?.form;
  const same = pool.filter((period) => period.form === form);
  const [from, to] = same.slice(-2);
  return from && to && yearApart(from, to) ? { from: from.label, to: to.label } : null;
}

/** For a statement table with one column per period (`FY2024`, `FY2023`): the earlier and later column. */
export function periodColumns(table: Table) {
  const year = (header: string) => /(?:^|\D)(\d{4})$/.exec(header.trim())?.[1];
  const dated = table.headers.flatMap((header, at) => {
    const found = year(header);
    return found && /^(?:FY|CY)?\s?\d{4}$/.test(header.trim())
      ? [{ at, year: Number(found), label: header.trim() }]
      : [];
  });
  if (dated.length !== 2) return null;
  const [a, b] = dated;
  if (!a || !b || a.year === b.year) return null;
  return a.year < b.year ? { prior: a, current: b } : { prior: b, current: a };
}

/** A table's heading as a reader's name: no register id, no "Chart data:" ("T4.5 Cash flow statement" → "Cash flow statement"). */
export function tableName(heading: string) {
  const name = heading.replace(/^T[A-Z]*\d+[A-Z]?\.\d+\s+/, "").replace(/^Chart data:\s*/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}
