import type { OutputEntry, Row, Table } from "../../../publishedReport";
import { periodKey, yearApart, type Period } from "./changes";

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

export type { Period } from "./changes";

/** The period a cell names, or null when it names no year (`Thereafter`, `Current`). See `periodKey`. */
export function periodOf(cell: string): Period | null {
  return periodKey(periodLabel(cell));
}

/** What a page says when a set of periods cannot be put in time order: it draws them as stated. */
export const UNORDERED_SENTENCE =
  "Periods are in the order stated; this page could not put them in time order.";

const MONTH_DAY = /\d{4}-(\d{2})-(\d{2})/;

/** A balance-sheet date written in the cell ("FY2024 / 2024-09-30", "2025-06-30") as month and day, else null. */
const dateOf = (cell: string) => {
  const found = MONTH_DAY.exec(cell);
  return found ? { month: Number(found[1]), day: Number(found[2]) } : null;
};

/**
 * Where a period falls inside its year, on one of two scales that are never compared with each
 * other: the fiscal scale (a year ends at 12; a quarter at 3q; a half at 6h) and the calendar scale
 * (a month and day: an LTM end month, a stated date, CY at December). `null` when the label says
 * nothing about where in its year it falls (`YTD 2025`, `LTM 2024`).
 */
type Place = { scale: "fiscal" | "calendar"; at: number } | null;

function placeOf(period: Period, date: { month: number; day: number } | null): Place {
  if (period.quarter !== undefined) return { scale: "fiscal", at: period.quarter * 3 };
  if (period.half !== undefined) return { scale: "fiscal", at: period.half * 6 };
  if (date) return { scale: "calendar", at: date.month * 100 + date.day };
  if (period.end !== undefined) return { scale: "calendar", at: period.end * 100 };
  if (period.form === "CY") return { scale: "calendar", at: 1231 };
  return period.kind === "annual" ? { scale: "fiscal", at: 12 } : null;
}

type Placed<T> = { period: Period; place: Place; item: T };

/**
 * The items in time order: by year, then inside one year by place on each scale, each scale's
 * members sorted among the positions they hold in the handoff's order (so a fiscal and a calendar
 * period of one year keep the handoff's order between them: `FY2024` beside `LTM Dec-2024`). Null
 * when a year holds a period whose place is unknown beside another period: no order can be told.
 */
function inTime<T>(items: readonly Placed<T>[]): Placed<T>[] | null {
  const years = [...new Set(items.map(({ period }) => period.year))].sort((a, b) => a - b);
  const out: Placed<T>[] = [];
  for (const year of years) {
    const members = items.filter(({ period }) => period.year === year);
    if (members.length > 1 && members.some(({ place }) => place === null)) return null;
    const slots = [...members];
    for (const scale of ["fiscal", "calendar"] as const) {
      const at = members.flatMap((one, index) => (one.place?.scale === scale ? [index] : []));
      const sorted = at
        .map((index) => members[index] as Placed<T>)
        .sort((a, b) => (a.place?.at ?? 0) - (b.place?.at ?? 0));
      at.forEach((index, n) => {
        slots[index] = sorted[n] as Placed<T>;
      });
    }
    out.push(...slots);
  }
  return out;
}

/** Periods a set cannot put in time order, as the handoff lists them (`period` null where no year is named). */
export type Unordered<T> = {
  unordered: true;
  reason: typeof UNORDERED_SENTENCE;
  stated: { label: string; period: Period | null; item: T }[];
};

/**
 * Items in time order; a stated gap (`reason`) when one period is stated twice; or, when they
 * cannot be put in time order, `unordered` with the items in the handoff's order. An unordered
 * result also carries `reason` (`UNORDERED_SENTENCE`), so a reader that only knows the first two
 * shapes draws the gap.
 */
export type Ordered<T> =
  { periods: { period: Period; item: T }[] } | { reason: string } | Unordered<T>;

/** True for a set that could not be put in time order. */
export const isUnordered = <T>(read: Ordered<T>): read is Unordered<T> => "unordered" in read;

/**
 * Items keyed by a period cell, in time order: by year, then by quarter, half, LTM end month or
 * stated date inside the year (see `inTime`); items of one year and one place keep the handoff's
 * order. A stated gap when one period (one form, one year) is stated twice. `unordered`, with the
 * items as listed, when a cell names no year or a year's order cannot be told.
 */
export function orderByPeriod<T>(items: readonly { cell: string; item: T }[]): Ordered<T> {
  const read = items.map(({ cell, item }) => ({ cell, period: periodOf(cell), item }));
  const unordered = (): Unordered<T> => ({
    unordered: true,
    reason: UNORDERED_SENTENCE,
    stated: read.map(({ cell, period, item }) => ({
      label: period?.label ?? periodLabel(cell),
      period,
      item,
    })),
  });
  const placed: Placed<T>[] = [];
  for (const { cell, period, item } of read) {
    if (!period) return unordered();
    const twice = placed.find(
      (other) => other.period.form === period.form && other.period.year === period.year,
    );
    if (twice) return { reason: `${period.label} appears more than once` };
    placed.push({ period, place: placeOf(period, dateOf(cell)), item });
  }
  const ordered = inTime(placed);
  if (!ordered) return unordered();
  return { periods: ordered.map(({ period, item }) => ({ period, item })) };
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

const placedPeriods = (periods: readonly Period[]) =>
  periods.map((period) => ({ period, place: placeOf(period, null), item: period }));

/**
 * Every period of these lists once (by label), in time order as `orderByPeriod` orders them;
 * periods of one year whose order cannot be told keep the order they first appear in. Periods of
 * different kinds are all kept, never collapsed.
 */
export function unionPeriods(lists: readonly (readonly Period[])[]): Period[] {
  const seen = new Map<string, Period>();
  for (const period of lists.flat()) if (!seen.has(period.label)) seen.set(period.label, period);
  const all = [...seen.values()];
  const ordered = inTime(placedPeriods(all));
  return ordered ? ordered.map(({ period }) => period) : all.sort((a, b) => a.year - b.year);
}

/**
 * The two periods a comparison is drawn between, earlier first: the latest two of one form, annual
 * periods first (`FY2023 → FY2024` beside an `LTM Dec-2024`), and only when they are exactly one
 * year apart (`yearApart`). Null with fewer than two of one form, for two periods more than a year
 * apart, and for a set that cannot be put in time order (an `Unordered` read, a period that names
 * no year, or a year whose order cannot be told): one period, or an unordered set, is drawn as
 * stated, never compared.
 */
export function comparisonOf(
  given: readonly (Period | null)[] | Ordered<unknown>,
): { from: string; to: string } | null {
  let periods: readonly (Period | null)[];
  if (Array.isArray(given)) periods = given as readonly (Period | null)[];
  else {
    const read = given as Ordered<unknown>;
    if (!("periods" in read)) return null;
    periods = read.periods.map(({ period }) => period);
  }
  const known = periods.filter((period): period is Period => period !== null);
  if (known.length < periods.length || !inTime(placedPeriods(known))) return null;
  const ordered = unionPeriods([known]);
  const annual = ordered.filter((period) => period.kind === "annual");
  const pool = annual.length > 0 ? annual : ordered;
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
