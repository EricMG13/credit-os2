import { difference, readCell, type Reading } from "./numbers";

// The one change a lead may print (ruling i and review L2, 2026-11-25): the exact difference of one
// stated measure between two periods of the same kind exactly one year apart, on one unit; or the
// change the handoff itself states, as written. Every other pair of figures is drawn as two stated
// figures with their periods and no change.

type PeriodKind = "annual" | "other";

/**
 * One period a label names. `label` is as written; `year` is its four-digit year (a two-digit
 * year `yy` is 20yy below 70, 19yy otherwise); `form` is the label without its year, letters and
 * digits only, upper case, with `1Q`/`2H` written `Q1`/`H2` and months cut to three letters ("FY",
 * "Q1", "LTMMAR", "" for a bare year): two periods are of one kind only within one form. `kind` is
 * "annual" for a fiscal or calendar year (`FY2024`, `CY24`, `2024`), "other" for anything else.
 * `quarter`, `half` and `end` (the month a label names, 1–12: `LTM Mar-2025`, `2025-06-30`) are
 * set only where the label states them.
 */
export type Period = {
  label: string;
  kind: PeriodKind;
  form: string;
  year: number;
  quarter?: number;
  half?: number;
  end?: number;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH = /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\b/i;
const YEAR4 = /(?<!\d)(\d{4})(?!\d)/;
/** A two-digit year closes the label, after FY/CY or a separator: `FY24`, `Q1 25`, `Q1-25`, `Mar-25`. */
const YEAR2 = /(?<=\b(?:FY|CY|[1-4]Q|[12]H)|[\s'\-/–]|^)(\d{2})(?=[A-Z]?$)/i;
/** A two-digit year is read only in a label that names a period by its words. */
const PERIOD_WORD =
  /\b(?:FY|CY|LTM|TTM|NTM|Q[1-4]|[1-4]Q|H[12]|[12]H)|\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i;
const ANNUAL_FORMS = new Set(["FY", "CY", ""]);
const DATE = /\d{4}-(\d{2})-\d{2}/;

function yearIn(label: string): { year: number; rest: string } | null {
  const four = YEAR4.exec(label);
  if (four?.[1] !== undefined)
    return {
      year: Number(four[1]),
      rest: label.slice(0, four.index) + " " + label.slice(four.index + 4),
    };
  if (!PERIOD_WORD.test(label)) return null;
  const two = YEAR2.exec(label);
  if (two?.[1] === undefined) return null;
  const yy = Number(two[1]);
  return {
    year: yy < 70 ? 2000 + yy : 1900 + yy,
    rest: label.slice(0, two.index) + " " + label.slice(two.index + 2),
  };
}

const formOf = (rest: string) =>
  rest
    .toUpperCase()
    .replace(/\b([1-4])Q\b/g, "Q$1")
    .replace(/\b([12])H\b/g, "H$1")
    .replace(MONTH, (_, month: string) => month.toUpperCase())
    .replace(/[^A-Z0-9]/g, "");

/** The period a label names (no " / date" part: `periodLabel` cuts it), or null when it names no year. */
export function periodKey(written: string): Period | null {
  const label = written.trim();
  const found = label ? yearIn(label) : null;
  if (!found) return null;
  const form = formOf(found.rest);
  const quarter = /Q([1-4])/.exec(form)?.[1];
  const half = /H([12])/.exec(form)?.[1];
  const month = MONTH.exec(found.rest)?.[1] ?? null;
  const dated = DATE.exec(label)?.[1];
  const end = month ? MONTHS.indexOf(month.toUpperCase()) + 1 : dated ? Number(dated) : null;
  return {
    label,
    year: found.year,
    form,
    kind: ANNUAL_FORMS.has(form) ? "annual" : "other",
    ...(quarter ? { quarter: Number(quarter) } : {}),
    ...(half ? { half: Number(half) } : {}),
    ...(end ? { end } : {}),
  };
}

const asPeriod = (period: Period | string) =>
  typeof period === "string" ? periodKey(period) : period;

/**
 * True when `current` is the period of the same kind exactly one year after `prior`: FY2024 →
 * FY2025, Q1 2024 → Q1 2025, LTM Mar-2024 → LTM Mar-2025, H1 2024 → H1 2025.
 */
export function yearApart(prior: Period | string, current: Period | string) {
  const [a, b] = [asPeriod(prior), asPeriod(current)];
  return a !== null && b !== null && a.form === b.form && b.year - a.year === 1;
}

/** One side of a change: its period, the cell as written (or read), and its unit where stated. */
export type ChangeSide = {
  period: Period | string;
  cell: string | Reading | null;
  unit?: string | null;
};

/**
 * A change the page may print. `stated`: the handoff's own change cell, `text` exactly as written
 * (`reading` tells a number, words or a stated gap apart); otherwise the exact `current − prior`
 * as plain text (`"-0.22"`, `"5130"`). `sign` is the change's direction where it is known.
 */
export type Change = { text: string; stated: boolean; sign: -1 | 0 | 1 | null; reading: Reading };

const sideText = (cell: ChangeSide["cell"]) =>
  cell === null
    ? null
    : typeof cell === "string"
      ? cell
      : cell.kind === "number"
        ? cell.text
        : null;

const unitKey = (unit: string | null | undefined) => (unit ?? "").trim().toLowerCase();

/** The sign a stated change is written with (`+665`, `−0.22x`, `(10)`), or null. */
function statedSign(reading: Reading): Change["sign"] {
  if (reading.kind === "number") return Math.sign(reading.value) as -1 | 0 | 1;
  if (reading.kind === "gap") return null;
  if (/^\+\s?\d/.test(reading.text)) return 1;
  if (/^[−-]\s?\d|^\(\d/.test(reading.text)) return -1;
  return null;
}

/**
 * The change between two stated figures, or null. A change the handoff states (`stated`, a
 * non-empty cell) is returned as written whatever the periods. Otherwise the exact difference,
 * only when both cells are plain numbers on one unit and the periods are of one kind exactly one
 * year apart (`yearApart`): never across kinds (Q1 2024 → FY2025, FY2024 → LTM Mar-2025), never
 * over two years (FY2022 → FY2024), never between units.
 */
export function changeBetween(
  prior: ChangeSide,
  current: ChangeSide,
  stated?: string | null,
): Change | null {
  const written = (stated ?? "").trim();
  if (written) {
    const reading = readCell(written);
    return { text: written, stated: true, sign: statedSign(reading), reading };
  }
  if (!yearApart(prior.period, current.period)) return null;
  if (unitKey(prior.unit) !== unitKey(current.unit)) return null;
  const [from, to] = [sideText(prior.cell), sideText(current.cell)];
  const exact = from === null || to === null ? null : difference(to, from);
  if (exact === null) return null;
  const reading = readCell(exact);
  return {
    text: exact,
    stated: false,
    sign: reading.kind === "number" ? (Math.sign(reading.value) as -1 | 0 | 1) : null,
    reading,
  };
}
