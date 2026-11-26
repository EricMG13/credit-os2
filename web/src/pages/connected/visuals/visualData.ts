import { containsReference, readerText } from "../publishedReport";
import { unitCells } from "../report/moduleRecordsModel";

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function items(value: unknown): unknown[] {
  return Array.isArray(value) ? (value as unknown[]) : [];
}

export function word(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((cell: unknown) => typeof cell === "string");
}

export function stringsIn(value: unknown): string[] {
  return strings(value) ? value : [];
}

export interface SourceTable {
  line: number;
  headers: string[];
  rows: string[][];
  rowLines?: (number | undefined)[];
  rowSource?: (line: number, label: string) => ReactNode;
  evidenceInDrawer?: boolean;
}

function sourceRows(rows: unknown, width: number) {
  const sourceRows = items(rows).map(record);
  const cells = sourceRows.map((row) => row.cells);
  if (
    cells.length === 0 ||
    !cells.every((row): row is string[] => strings(row) && row.length === width)
  )
    return null;
  return {
    cells,
    rowLines: sourceRows.map(({ line: at }) =>
      typeof at === "number" && Number.isSafeInteger(at) && at > 0 ? at : undefined,
    ),
  };
}

function sourceTable(raw: unknown): SourceTable | null {
  const { type, line, headers, rows } = record(raw);
  if (type !== "table" || typeof line !== "number" || !Number.isSafeInteger(line)) return null;
  if (!strings(headers) || headers.length < 2) return null;
  const content = sourceRows(rows, headers.length);
  return content ? { line, headers, rows: content.cells, rowLines: content.rowLines } : null;
}

export function publishedTables(sections: unknown) {
  const tables = new Map<number, SourceTable>();
  const seen = new Set<number>();
  for (const section of items(sections)) {
    for (const raw of items(record(section).blocks)) {
      const { type, line } = record(raw);
      if (type !== "table" || typeof line !== "number" || !Number.isSafeInteger(line)) continue;
      if (seen.has(line)) {
        tables.delete(line);
        continue;
      }
      seen.add(line);
      const table = sourceTable(raw);
      if (table) tables.set(line, table);
    }
  }
  return tables;
}

// A comma groups digits only in threes ("1,250") or, in the Indian lakh and crore grouping, in a
// last three and pairs before it ("21,00,000"); one other comma between digits is a decimal comma
// ("3,75"); any other placement is not a number.
const COMMA_GROUPS = /^-?(?:[1-9]\d{0,2}(?:,\d{3})+|[1-9]\d?(?:,\d{2})+,\d{3})(?:\.\d+)?$/;
const DECIMAL_COMMA = /^-?\d+,\d+$/;
const PLAIN_NUMBER = /^-?\d+(?:\.\d+)?$/;

function numberText(cell: string, unit?: unknown): string | null {
  let text = cell.trim().replaceAll("−", "-");
  if (/^\([^()]+\)$/.test(text)) {
    const inner = text.slice(1, -1);
    if (/^[+-]/.test(inner)) return null;
    text = `-${inner}`;
  }
  const suffix = /\s*(%|x|m|bn|millions?|billions?)$/i.exec(text);
  if (suffix) {
    if (typeof unit !== "string") return null;
    const family = (value: string) => {
      if (value === "%" || value === "x") return value;
      if (/(?:bn|billions?)$/i.test(value)) return "bn";
      return /(?:m|millions?)$/i.test(value) ? "m" : null;
    };
    if (family(suffix[1] ?? "") !== family(unit.trim())) return null;
    text = text.slice(0, suffix.index);
  }
  if (/^-?\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?$/.test(text))
    text = text.replace(/[ \u00a0\u202f]/g, "");
  return text;
}

function readAmount(cell: string, decimalComma: boolean, unit?: unknown): number | null {
  let text = numberText(cell, unit);
  if (text === null) return null;
  if (DECIMAL_COMMA.test(text) && (decimalComma || !COMMA_GROUPS.test(text)))
    text = text.replace(",", ".");
  else if (COMMA_GROUPS.test(text)) text = text.replaceAll(",", "");
  if (!PLAIN_NUMBER.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** A cell's number with no column to ask: one comma and three digits ("2,800") is a thousands group. */
export function amount(cell: string, unit?: unknown): number | null {
  return readAmount(cell, false, unit);
}

// Only a decimal comma reads "3,75"; only English grouping reads "1,250,000" or "2,800.5".
const onlyDecimalComma = (cell: string) =>
  DECIMAL_COMMA.test(cell) && !COMMA_GROUPS.test(cell) && !/^-?0,000$/.test(cell);
const onlyGrouping = (cell: string) => COMMA_GROUPS.test(cell) && !DECIMAL_COMMA.test(cell);

/**
 * A cell's number read with `scope`, the cells that state the same measure in the same unit. When a
 * cell of the scope can only be a decimal comma ("3,75") and none can only be English grouping, one
 * comma and three digits ("2,800") is a decimal comma too, 2.8. Otherwise, a scope written only in
 * three-decimal commas included, the cell is read as `amount` reads it.
 */
export function cellAmount(cell: string, scope: readonly string[], unit?: unknown): number | null {
  const texts = scope.map((value) => numberText(value, unit) ?? "");
  return readAmount(cell, texts.some(onlyDecimalComma) && !texts.some(onlyGrouping), unit);
}

export function sharePosition(cell: string) {
  const match = /^(0(?:\.\d+)?|1(?:\.0+)?)(?: \((\d+(?:\.\d+)?)%\))?$/.exec(cell);
  if (!match) return null;
  const value = Number(match[1]);
  return match[2] === undefined || Math.abs(Number(match[2]) - value * 100) < 1e-10 ? value : null;
}

export function distinct(labels: string[]) {
  return labels.length === new Set(labels).size && labels.every(Boolean);
}

export function bounds(values: (number | null)[], zero = false) {
  const present = values.filter((value): value is number => value !== null);
  if (zero || present.length === 0) present.push(0);
  const min = Math.min(...present);
  const max = Math.max(...present);
  if (min !== max) return { min, max };
  const margin = Math.abs(min) / 10 || 1;
  return { min: zero && min === 0 ? 0 : min - margin, max: max + margin };
}

// Six decimals drop the float noise of min + (max - min) / 2 and keep every figure a table states.
const TICK_LABEL = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6, useGrouping: false });

/** The spread of the data in three ticks. For axes that are not value axes (dates, scatter). */
export function rangeTicks(values: (number | null)[], zero = false) {
  const { min, max } = bounds(values, zero);
  return [...new Set([min, min + (max - min) / 2, max])].map((value) => ({
    value,
    label: TICK_LABEL.format(value),
  }));
}

const NICE_MANTISSAS = [1, 2, 2.5, 5];
const MAX_TICKS = 6;
const EDGE = 1e-9;
const MAX_EXPONENTS = 100;

/** The smallest of 1, 2, 2.5 or 5 times a power of ten whose bracket has at most six ticks. */
function niceStep(low: number, high: number) {
  const span = high - low;
  const start = Math.floor(Math.log10(span)) - 2;
  for (let exponent = start; exponent < start + MAX_EXPONENTS; exponent += 1) {
    for (const mantissa of NICE_MANTISSAS) {
      const step = mantissa * 10 ** exponent;
      const count = Math.ceil(high / step - EDGE) - Math.floor(low / step + EDGE) + 1;
      if (count <= MAX_TICKS) {
        return { step, decimals: Math.max(0, -exponent + (mantissa === 2.5 ? 1 : 0)) };
      }
    }
  }
  throw new Error("no nice tick step fits the range");
}

/**
 * Value-axis ticks at round numbers. Data that are all zero or more start at zero; data that are all
 * zero or less end at zero; mixed data are bracketed on both sides. The labels are axis furniture:
 * data labels, tooltips and tables keep the published strings. `zero` is kept for callers; the
 * baseline rule makes it redundant.
 */
export function ticks(
  values: (number | null)[],
  // The baseline rule already includes zero; the flag stays so existing callers compile.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _zero = false,
  format?: (value: number) => string,
) {
  const given = values.filter((value): value is number => value !== null);
  // A value that is not a number cannot be placed on an axis: draw the axis of an empty series.
  const present = given.every((value) => Number.isFinite(value)) ? given : [];
  const low = Math.min(0, ...present);
  const peak = Math.max(0, ...present);
  const high = peak === low ? low + 1 : peak;
  const { step, decimals } = niceStep(low, high);
  const first = Math.floor(low / step + EDGE);
  const last = Math.ceil(high / step - EDGE);
  const grouped = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  const label = format ?? ((value: number) => grouped.format(value));
  return Array.from({ length: last - first + 1 }, (_, at) => {
    const value = Number(((first + at) * step).toFixed(decimals)) + 0;
    return { value, label: label(value) };
  });
}

const BASIS_COLUMN = /^Basis and limitation$/i;
// The columns the library keeps out of every page but Evidence and the trace drawer: source
// references, and CP-1's EBITDA bridge Add-Back ID (an id column).
const DRAWER_COLUMN = /^(?:Source|Evidence|Add-Back ID)$/i;

/**
 * The Table form of a published chart table. The limitation text stays beside the figures, its module
 * codes drawn as module names; only the columns of source references go to the row's trace drawer,
 * and a limitation that itself names a source, a gap id or a run code is left to the drawer too (as
 * `chartDrawsVerbatim` does for the prose).
 */
export function chartTable(table: SourceTable, columns = table.headers.map((_, index) => index)) {
  const inDrawer = table.evidenceInDrawer === true;
  const visible = inDrawer
    ? columns.filter((index) => !DRAWER_COLUMN.test(table.headers[index] ?? ""))
    : columns;
  const drawUnit = unitCells(table);
  const cell = (row: string[], column: number) => {
    const text = row[column] ?? "";
    const unit = drawUnit(column, text);
    if (unit !== undefined) return unit;
    if (!inDrawer || !BASIS_COLUMN.test(table.headers[column] ?? "")) return text || null;
    return containsReference(text)
      ? "Qualification recorded in Evidence."
      : readerText(text) || null;
  };
  return {
    head: visible.map((index) => table.headers[index] ?? ""),
    endHeading: "Source",
    rows: table.rows.map((row, index) => {
      const label = row[visible[0] ?? 0] ?? "";
      const line = table.rowLines?.[index];
      return {
        label,
        cells: visible.slice(1).map((column) => cell(row, column)),
        end: line === undefined ? undefined : table.rowSource?.(line, label),
      };
    }),
  };
}
import type { ReactNode } from "react";
