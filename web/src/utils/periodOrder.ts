// The one period-ordering rule: oldest fiscal year to latest, then YTD/PYTD, LTM, PF, forecasts.
// docs/superpowers/specs/2026-11-25-chart-periods.md states it; src/deploy_vii/period_order.py is
// its Python twin and both are tested against tests/fixtures/period-order-cases.json.

type PeriodClass = "actual" | "ytd" | "ltm" | "pf" | "forecast";
type PeriodSpan = "date" | "month" | "quarter" | "half" | "year";
type PeriodEnd = readonly [year: number, month: number, day: number];

/** `end` has a real day only for a label carrying its own date; the others are placed on day 31
 * of their last month. `priorYtd` marks a PYTD label of the ytd class. */
export type ParsedPeriod = {
  periodClass: PeriodClass;
  end: PeriodEnd | null;
  span: PeriodSpan | null;
  priorYtd: boolean;
};

const CLASS_RANK: Record<PeriodClass, number> = { actual: 0, ytd: 1, ltm: 2, pf: 3, forecast: 4 };
const SPAN_RANK: Record<PeriodSpan, number> = { date: 0, month: 0, quarter: 1, half: 2, year: 3 };
// An undated label sorts after every dated one of its class; an undated PYTD before them.
const UNDATED_YEAR = 10000;

const PUNCTUATION = /['’(),.:]/g;
const SEPARATORS = /[ /\-–—_·|]+/g;

const NEXT_TWELVE = /(?<![A-Z])NTM(?![A-Z])/;
const PRIOR_YTD = /(?<![A-Z])PYTD(?![A-Z])/;
// Highest class first. A word may touch digits (`LTM2025`), never another letter.
const CLASS_WORDS: readonly (readonly [PeriodClass, RegExp])[] = [
  [
    "forecast",
    /(?<![A-Z])(?:NTM|FORECAST|PROJECTED|PROJECTION|PROJ|BUDGET|GUIDANCE|OUTLOOK|ESTIMATED|ESTIMATE|EST|PLAN|TARGET)(?![A-Z])/g,
  ],
  ["pf", /(?<![A-Z])(?:PF|PRO[ -]?FORMA)(?![A-Z])/g],
  ["ltm", /(?<![A-Z])(?:LTM|TTM)(?![A-Z])/g],
  ["ytd", /(?<![A-Z])(?:PYTD|YTD)(?![A-Z])/g],
];
const COUNT = /(?<![0-9A-Z])([369])M(?![A-Z])/;

const ISO_DATE = /(?<![0-9])([0-9]{4})-([0-9]{2})-([0-9]{2})(?![0-9])/;
// A day number beside the month is taken out with it and not used.
const MONTH =
  /(?:(?<![0-9])(?:0?[1-9]|[12][0-9]|3[01])[ -])?(?<![A-Z])(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUNE?|JULY?|AUG(?:UST)?|SEP(?:T|TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)(?![A-Z])(?:[ -](?:0?[1-9]|[12][0-9]|3[01])(?=[ -][0-9]{4}(?![0-9])))?/;
const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
// Year expressions: group 1 the fiscal prefix, 2 the digits, 3 the second year or the suffix.
const SPLIT_YEAR =
  /(?:(?<![A-Z])(FYE|FY|CY) ?)?(?<![0-9])(19[0-9]{2}|2[01][0-9]{2})[/-]([0-9]{4}|[0-9]{2})(?![0-9])/;
const FOUR_DIGITS =
  /(?:(?<![A-Z])(FYE|FY|CY) ?)?(?<![0-9])(19[0-9]{2}|2[01][0-9]{2})(?![0-9])(?: ?([AEFBP])(?![0-9A-Z]))?/;
const TWO_DIGITS =
  /(?:(?<![A-Z])(FYE|FY|CY) ?)?(?<![0-9])([0-9]{2})(?![0-9])(?: ?([AEFBP])(?![0-9A-Z]))?/g;
const LONE_PREFIX = /(?<![A-Z])(?:FYE|FY|CY)(?![0-9A-Z])/;
const FORECAST_SUFFIXES = "EFBP";
const TWO_DIGIT_PIVOT = 70;
// Groups 1 and 2 a quarter, 3 and 4 a half.
const PART = /(?<![0-9A-Z])(?:Q([1-4])|([1-4])Q|H([12])|([12])H)(?![0-9A-Z])/;
const QUALIFIERS =
  /(?<![A-Z])(?:ACTUAL|REPORTED|RESTATED|ADJUSTED|ADJ|AUDITED|UNAUDITED|AS|AT|TO|YEAR|QUARTER|HALF|PERIOD|ENDED|ENDING|END)(?![A-Z])/g;

type Found = RegExpExecArray | null;
/** A year expression taken out of a label; `rest` is the label without it. */
type Year = { value: number; forecast: boolean; prefixed: boolean; rest: string };

const normalise = (label: string) =>
  label.toUpperCase().replace(PUNCTUATION, " ").replace(/\s+/g, " ").replace(/^ | $/g, "");

const cut = (text: string, match: RegExpExecArray) =>
  `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`;

/** The first match of a token and the text without it: a label has at most one of each. */
function take(pattern: RegExp, text: string): [Found, string] {
  const match = pattern.exec(text);
  return match ? [match, cut(text, match)] : [null, text];
}

const leap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const daysIn = (year: number, month: number) =>
  month === 2 ? (leap(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;

function calendarDate(year: number, month: number, day: number): PeriodEnd | null {
  const real = year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysIn(year, month);
  return real ? [year, month, day] : null;
}

function classWords(text: string): [PeriodClass, string] {
  let found: PeriodClass = "actual";
  let rest = text;
  for (const [periodClass, words] of CLASS_WORDS) {
    const without = rest.replace(words, " ");
    if (without !== rest && CLASS_RANK[periodClass] > CLASS_RANK[found]) found = periodClass;
    rest = without;
  }
  return [found, rest];
}

/** Take the year out with its prefix, or with one standing elsewhere (`FY ended Dec 2024`). */
function yearTaken(text: string, match: RegExpExecArray, value: number): Year {
  const rest = cut(text, match);
  const lone = match[1] ? null : LONE_PREFIX.exec(rest);
  const forecast = match[3] !== undefined && FORECAST_SUFFIXES.includes(match[3]);
  const prefixed = Boolean(match[1] || lone);
  return { value, forecast, prefixed, rest: lone ? cut(rest, lone) : rest };
}

/** The one year a label names, null when it names none, "invalid" for a broken split year.
 * `named` says a class marker or a month was found: one of the things, with a fiscal prefix,
 * a forecast suffix or a quarter or half, that let a two-digit number be read as a year. */
function yearOf(text: string, named: boolean): Year | "invalid" | null {
  const split = SPLIT_YEAR.exec(text);
  if (split) {
    const year = Number(split[2]) + 1;
    const expected = split[3]?.length === 4 ? year : year % 100;
    return Number(split[3]) === expected ? yearTaken(text, split, year) : "invalid";
  }
  const fourDigits = FOUR_DIGITS.exec(text);
  if (fourDigits) return yearTaken(text, fourDigits, Number(fourDigits[2]));
  const last = [...text.matchAll(TWO_DIGITS)].at(-1);
  if (!last) return null;
  const number = Number(last[2]);
  const found = yearTaken(text, last, (number >= TWO_DIGIT_PIVOT ? 1900 : 2000) + number);
  const anchored = named || found.forecast || found.prefixed || PART.test(found.rest);
  return anchored ? found : null;
}

function endInYear(year: number, month: Found, part: Found, count: Found): [PeriodEnd, PeriodSpan] {
  const name = month?.[1];
  if (name) return [[year, MONTH_NAMES.indexOf(name.slice(0, 3)) + 1, 31], "month"];
  const quarter = part?.[1] ?? part?.[2];
  if (quarter) return [[year, 3 * Number(quarter), 31], "quarter"];
  if (part) return [[year, 6 * Number(part[3] ?? part[4]), 31], "half"];
  if (count) return [[year, Number(count[1]), 31], "month"];
  return [[year, 12, 31], "year"];
}

function classOf(words: PeriodClass, count: Found, year: Year | null): PeriodClass {
  if (year?.forecast) return "forecast";
  return count && words === "actual" ? "ytd" : words;
}

/** Read a period label as its class and end; null when the label is unparseable.
 * The label is read strictly: every token of the rule is taken out of it, at most one date,
 * year, month and part, and anything left over makes it unparseable. */
export function parsePeriod(label: string): ParsedPeriod | null {
  const normal = normalise(label);
  const [iso, afterDate] = take(ISO_DATE, normal);
  const day = iso && calendarDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const [words, afterWords] = classWords(afterDate);
  const [count, afterCount] = take(COUNT, afterWords);
  const [month, afterMonth] = take(MONTH, afterCount);
  const year = yearOf(afterMonth, Boolean(words !== "actual" || count || month));
  if (year === "invalid" || (iso && !day)) return null;
  const [part, afterPart] = take(PART, year ? year.rest : afterMonth);
  if (afterPart.replace(QUALIFIERS, " ").replace(SEPARATORS, "") !== "") return null;
  const periodClass = classOf(words, count, year);
  const priorYtd = periodClass === "ytd" && PRIOR_YTD.test(normal);
  if (day) return { periodClass, end: day, span: "date", priorYtd };
  if (year) {
    const [end, span] = endInYear(year.value, month, part, count);
    return { periodClass, end, span, priorYtd };
  }
  // A forecast word alone (`Outlook`, `Target`, `Plan`) names no period; `NTM` is one of its own.
  if (periodClass === "actual" || (periodClass === "forecast" && !NEXT_TWELVE.test(normal)))
    return null;
  return { periodClass, end: null, span: null, priorYtd };
}

/** (class, year, month, day, span, PYTD-first) of a label; null when it is unparseable. */
export function periodKey(label: string): readonly number[] | null {
  const parsed = parsePeriod(label);
  if (!parsed) return null;
  const afterPrior = parsed.priorYtd ? 0 : 1;
  const rank = CLASS_RANK[parsed.periodClass];
  if (!parsed.end || !parsed.span) return [rank, UNDATED_YEAR * afterPrior, 0, 0, 0, afterPrior];
  return [rank, ...parsed.end, SPAN_RANK[parsed.span], afterPrior];
}

/** Negative, zero or positive as key `a` sorts before, with or after key `b`. */
export function comparePeriodKeys(a: readonly number[], b: readonly number[]): number {
  for (const [index, part] of a.entries()) {
    const difference = part - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** Items in rule order, then the unparseable ones as authored; `gaps` are those. Items with
 * equal keys keep their authored order. */
export function orderPeriods<T>(
  items: readonly T[],
  label: (item: T) => string,
): { ordered: T[]; gaps: T[] } {
  const keyed = items.map((item) => ({ item, key: periodKey(label(item)) }));
  const dated = keyed.flatMap(({ item, key }) => (key ? [{ item, key }] : []));
  const gaps = keyed.filter(({ key }) => key === null).map(({ item }) => item);
  dated.sort((a, b) => comparePeriodKeys(a.key, b.key));
  return { ordered: [...dated.map(({ item }) => item), ...gaps], gaps };
}
