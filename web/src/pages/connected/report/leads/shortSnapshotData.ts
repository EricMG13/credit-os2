import { SCREEN_TITLES, type OutputEntry } from "../../publishedReport";
import { changeBetween, changePeriod, yearApart } from "./kit/changes";
import { group, readCell } from "./kit/numbers";
import { reasonText, safeText } from "./kit/reader";
import { allTables, periodLabel, tableWith } from "./kit/tables";
import { tone } from "../../signal";

/*
 * Reads what the CP-L10 contract names. The current method (src/deploy_vii/methods/cpl10.md, ruling
 * 2026-11-11 M6) writes `### Key figures`: exactly one table `Measure | Value | Period | Source`.
 * The earlier bounded change screen (bindings/cpl10.py: TL10.1 to TL10.5) names no columns and is
 * not part of the current method; a change screen is therefore drawn only from a table carrying
 * `Topic`, `Prior` and `Current` columns, and any other table with a `Topic` column is a gap that says
 * what was expected. Nothing else is read.
 */

const KEY_FIGURE_HEADERS = ["Measure", "Value", "Period", "Source"] as const;

export type Figure =
  | { kind: "value"; text: string; period: string }
  | { kind: "gap"; text: string; reason: string; period: string };

export type KeyFigure = {
  measure: string;
  line: number;
  current: Figure;
  /** The same measure in an earlier period, when the table states both. */
  prior: Figure | null;
  /**
   * The one change the page may print: the exact prior to current difference of one measure, when
   * both periods are of one kind exactly a year apart and the unit text is the same.
   */
  change: {
    text: string;
    /** The size of the change with the figures' own unit text, no sign: "0.40x". */
    size: string;
    sign: -1 | 0 | 1;
    tone: "better" | "worse" | "flat" | "none";
  } | null;
  /** Both figures as numbers for a mark. */
  marks: { prior: number; current: number; suffix: string } | null;
};

const TONE_KEYS: Record<string, string> = {
  "total leverage": "leverage",
  "net leverage": "net_leverage",
  "interest coverage": "coverage",
  "interest cover": "coverage",
  liquidity: "liquidity",
  "net debt": "net_debt",
  "gross debt": "gross_debt",
  "free cash flow": "free_cash_flow",
  revenue: "revenue",
  "undrawn committed facilities": "undrawn",
};

/** A year apart in either order. */
const apart = (a: string, b: string) => yearApart(a, b) || yearApart(b, a);

const norm = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * A value as `prefix number suffix` ("3.10x" is `""`, `3.10`, `x`). An accounting negative, the
 * number in brackets with its unit inside or after them ("(3.3x)", "(3.3)x", "(3.3%)", "(1,158)"),
 * is the negative number: `number` is "-3.3", `suffix` is "x", never a bracket.
 */
function split(text: string) {
  const plain = text.trim().replaceAll("−", "-");
  const bracketed = /^([^\d\-(]*?)\(\s*([\d,]+(?:\.\d+)?)\s*([^\d()]*?)\s*\)\s*([^\d()]*)$/.exec(
    plain,
  );
  const match = bracketed ?? /^([^\d\-]*?)(-?[\d,]+(?:\.\d+)?)(\D*)$/.exec(plain);
  if (!match) return null;
  const negative = bracketed !== null;
  const digits = (match[2] ?? "").replaceAll(",", "");
  if (readCell(digits).kind !== "number") return null;
  const number = negative && Number(digits) !== 0 ? `-${digits}` : digits;
  const suffix = negative ? `${match[3] ?? ""}${match[4] ?? ""}` : (match[3] ?? "");
  return { prefix: (match[1] ?? "").trim(), number, suffix: suffix.trim() };
}

function figureOf(value: string, period: string): Figure {
  const reading = readCell(value);
  const when = safeText(period);
  if (reading.kind === "gap")
    return {
      kind: "gap",
      text: safeText(value),
      reason: reasonText(reading.reason),
      period: when,
    };
  return { kind: "value", text: safeText(value), period: when };
}

type Row = { fig: Figure; line: number };

/** Two rows of one measure as prior and current, only when their periods are a year apart. */
function pair(measure: string, a: Row, b: Row) {
  if (!apart(a.fig.period, b.fig.period)) return null;
  const [first, second] = [changePeriod(a.fig.period), changePeriod(b.fig.period)];
  if (!first || !second) return null;
  const [prior, current] = first.year < second.year ? [a, b] : [b, a];
  const p = prior.fig.kind === "value" ? split(prior.fig.text) : null;
  const c = current.fig.kind === "value" ? split(current.fig.text) : null;
  let change: KeyFigure["change"] = null;
  let marks: KeyFigure["marks"] = null;
  if (p && c) {
    marks = { prior: Number(p.number), current: Number(c.number), suffix: c.suffix };
    const unit = (part: NonNullable<typeof p>) => `${part.prefix}|${part.suffix}`;
    const made = changeBetween(
      { period: prior.fig.period, cell: p.number, unit: unit(p) },
      { period: current.fig.period, cell: c.number, unit: unit(c) },
    );
    const key = TONE_KEYS[norm(measure)];
    if (made && made.sign !== null) {
      // A percent measure's change is in percentage points, not a relative %; any other unit is its own.
      const amount = group(made.text.replace(/^-/, ""));
      const size =
        c.suffix === "%" && !c.prefix
          ? `${amount} percentage points`
          : `${c.prefix}${c.prefix ? " " : ""}${amount}${c.suffix}`;
      // The owner's better/worse table is not meaningful for a ratio across a sign change.
      const ratio =
        key === "leverage" ||
        key === "net_leverage" ||
        key === "coverage" ||
        c.suffix.toLowerCase() === "x";
      const crossing = ratio && (marks.prior < 0 || marks.current < 0);
      change = {
        text: made.text,
        size,
        sign: made.sign,
        tone: key && !crossing ? tone(key, made.text) : "none",
      };
    }
  }
  return {
    measure,
    line: current.line,
    current: current.fig,
    prior: prior.fig,
    change,
    marks,
  } satisfies KeyFigure;
}

export type KeyFigures =
  { state: "ready"; line: number; figures: KeyFigure[] } | { state: "gap"; reason: string };

/** The key figures, one per measure, with prior and current where the table states the measure in two periods. */
export function readKeyFigures(entry: OutputEntry): KeyFigures {
  const found = allTables(entry).filter(({ table }) =>
    KEY_FIGURE_HEADERS.every((name) => table.headers.includes(name)),
  );
  if (found.length === 0)
    return { state: "gap", reason: "This page could not read the key figures." };
  if (found.length > 1)
    return {
      state: "gap",
      reason: "This page could not read the key figures: they appear more than once.",
    };
  const [only] = found;
  const table = only?.table;
  if (!table?.rows.length)
    return {
      state: "gap",
      reason: "This page could not read a row of the key figures.",
    };
  const at = (name: string) => table.headers.indexOf(name);
  const rows = table.rows.map((row) => ({
    measure: safeText(row.cells[at("Measure")] ?? ""),
    fig: figureOf(row.cells[at("Value")] ?? "", periodLabel(row.cells[at("Period")] ?? "")),
    line: row.line,
  }));
  const used = new Set<number>();
  const figures: KeyFigure[] = [];
  rows.forEach((row, index) => {
    if (used.has(index)) return;
    // The first later row of the same measure in the period a year apart; any other period is its own figure.
    const matchAt = rows.findIndex(
      (other, otherIndex) =>
        otherIndex > index &&
        !used.has(otherIndex) &&
        norm(other.measure) === norm(row.measure) &&
        apart(row.fig.period, other.fig.period),
    );
    const other = matchAt >= 0 ? rows[matchAt] : undefined;
    const joined = other ? pair(row.measure, row, other) : null;
    if (joined) {
      used.add(matchAt);
      figures.push(joined);
    } else
      figures.push({
        measure: row.measure,
        line: row.line,
        current: row.fig,
        prior: null,
        change: null,
        marks: null,
      });
  });
  return { state: "ready", line: table.line, figures };
}

type ChangeItem = {
  topic: string;
  prior: string;
  current: string;
  /** The module's own reader-text line, where the table has one. */
  text: string | null;
  /** The direction word, only when the table states it. */
  direction: string | null;
  line: number;
};
export type ChangeScreen =
  { state: "ready"; line: number; items: ChangeItem[] } | { state: "gap"; reason: string } | null;

const TEXT_HEADERS = ["Change", "What changed", "Reading"];

/** The change screen, when the handoff carries a table with a Topic column; nothing otherwise. */
export function readChangeScreen(entry: OutputEntry): ChangeScreen {
  const candidates = allTables(entry).filter(
    ({ table }) =>
      table.headers.includes("Topic") &&
      !KEY_FIGURE_HEADERS.every((name) => table.headers.includes(name)),
  );
  if (candidates.length === 0) return null;
  const table = tableWith(entry, ["Topic", "Prior", "Current"]);
  if (candidates.length > 1 || !table)
    return {
      state: "gap",
      reason:
        "This page could not read the change screen: its table is not in a shape this page reads.",
    };
  const at = (name: string) => table.headers.indexOf(name);
  const textAt = TEXT_HEADERS.map(at).find((index) => index >= 0) ?? -1;
  const directionAt = at("Direction");
  const items = table.rows.map((row): ChangeItem => {
    const text = textAt < 0 ? "" : (row.cells[textAt] ?? "").trim();
    const direction = directionAt < 0 ? "" : (row.cells[directionAt] ?? "").trim();
    return {
      topic: safeText(row.cells[at("Topic")] ?? ""),
      prior: safeText(row.cells[at("Prior")] ?? ""),
      current: safeText(row.cells[at("Current")] ?? ""),
      text: text ? safeText(text) : null,
      direction: direction ? safeText(direction) : null,
      line: row.line,
    };
  });
  if (!items.length)
    return {
      state: "gap",
      reason: "This page could not read a row of the change screen.",
    };
  return { state: "ready", line: table.line, items };
}

/**
 * The five screens of a credit screening handoff (ruling C4), in the order the composition lists
 * them: each is one table under a heading of its own title, headed exactly `SCREEN_HEADERS`.
 */
export { SCREEN_TITLES };
export const SCREEN_HEADERS = ["Topic", "Finding", "Materiality", "Evidence", "Next step"] as const;

export type Screen =
  | {
      state: "ready";
      title: string;
      line: number;
      headers: string[];
      /** The cells as the module wrote them, none computed, none reworded. */
      rows: string[][];
      lines: number[];
    }
  | { state: "gap"; title: string; reason: string };

/**
 * The five screens, each read from the one table under its heading. A heading that is absent, a
 * section without exactly one table, or a table whose header is not `SCREEN_HEADERS` is a gap for
 * that screen alone; nothing is guessed from another table.
 */
export function readScreens(entry: OutputEntry, pathway?: string | null): Screen[] {
  return SCREEN_TITLES.map((title): Screen => {
    const found = allTables(entry).filter((item) => item.heading === title);
    const table = found.length === 1 ? found[0]?.table : undefined;
    if (!table)
      return {
        state: "gap",
        title,
        reason:
          "This page could not read this screen: its table is missing or appears more than once.",
      };
    if (
      table.headers.length !== SCREEN_HEADERS.length ||
      !SCREEN_HEADERS.every((name, index) => table.headers[index] === name)
    )
      return {
        state: "gap",
        title,
        reason:
          "This page could not read this screen: its table is not in the shape this page reads.",
      };
    if (!table.rows.length)
      return { state: "gap", title, reason: "This page could not read a row of this screen." };
    return {
      state: "ready",
      title,
      line: table.line,
      headers: [...table.headers],
      rows: table.rows.map((row) => row.cells.map((cell) => safeText(cell, pathway))),
      lines: table.rows.map((row) => row.line),
    };
  });
}
