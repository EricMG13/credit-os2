import { orderPeriods } from "@/utils/periodOrder";
import { tone } from "../../signal";
import { readerText, unitLabel, type OutputEntry, type Table } from "../../publishedReport";
import { difference, group, readCell, sum } from "./kit/numbers";
import { changeBetween } from "./kit/changes";
import { IN_EVIDENCE, namesSource, reasonText, safeText } from "./kit/reader";
import { niceAxis } from "./kit/marks";
import { allTables, columnOf } from "./kit/tables";

const RESULTS = "Chart data: prior and current results";
const KPIS = "Chart data: margin and KPI changes";
const STEP_HEADERS = ["Step", "Amount", "Reporting unit", "Basis and limitation"];

export const NO_UNIT = "This page could not read the unit of the earnings table.";
export const NO_RESULTS = "This page could not read the prior and current results.";
export const NO_KPIS = "This page could not read the margin and KPI changes.";
const NO_MARGINS = "This page could not read a margin row in the earnings table.";
const NO_COLUMNS =
  "This page could not read the prior and current results: the table lacks the measure, prior, current or unit column.";
const NO_ROWS = "This page could not read the prior and current results: the table has no rows.";
const NO_PAIRS = "This page could not read a money row in the earnings table.";
export const NO_PERCENT = "This page could not read the margins: a cell has no percent sign.";
export const TWICE_RESULTS =
  "This page could not read the prior and current results: the table is stated more than once.";
const TWICE_KPIS =
  "This page could not read the margin and KPI changes: the table is stated more than once.";
export const TWICE_EARNINGS =
  "This page could not read the earnings table: more than one is stated.";
export const FEW_PERIODS = "This page could not read two annual periods in the earnings table.";
export const MIXED_PERIODS =
  "This page did not compare the earnings table's two latest annual periods: they are different kinds of period.";
const SAME_YEAR =
  "This page did not compare the earnings table's two latest annual periods: they are the same year.";
export const NO_BRIDGE = "No charted variance bridge is included in this module.";

/** Handoff words for the page, or the Evidence pointer where they name a source or are empty. */
const readable = (text: string) => safeText(text) || IN_EVIDENCE;
const reasonOf = (text: string) => reasonText(text) || IN_EVIDENCE;

// ---------------------------------------------------------------------------------------------
// Figures as the module states them

/** One cell of a pair: a figure, a stated gap with its reason, or words where a figure belongs. */
export type Side = {
  kind: "number" | "gap" | "words";
  /** A figure as plain digits (no thousands commas); a gap or words as written. */
  text: string;
  value: number | null;
  /** A figure the cell writes another way than plain digits (an accounting negative, `(1,160)`), as written. */
  written: string | null;
  reason: string | null;
};

type Change = {
  /** The change in the unit's own words with its sign (`+1,355`, `−0.5 percentage points`), or the stated cell as written. */
  text: string;
  /** `stated`: the module wrote the change; `computed`: the exact difference of the same kind of period a year apart. */
  basis: "stated" | "computed";
  /** The change's direction where it is known: words with no sign carry none. */
  sign: -1 | 0 | 1 | null;
  magnitude: number;
};

type Tone = "better" | "worse" | "flat" | "none";

/** A period the handoff states beside the two compared, listed as its own: `LTM Dec-2024`. */
type OtherPeriod = { period: string; text: string };

export type Pair = {
  label: string;
  line: number;
  priorPeriod: string | null;
  currentPeriod: string | null;
  prior: Side;
  current: Side;
  change: Change | null;
  tone: Tone;
  others: OtherPeriod[];
};

/** The two end labels of the scale a group is drawn on (`−2,000`, `8,000`). */
type AxisEnds = { from: string; to: string };

export type PairGroup = {
  /** The unit as the page names it (`US$m`, `%`, `x`); empty when the handoff states none. */
  unit: string;
  percent: boolean;
  /** The row states no unit: it is alone on its own scale, never on one shared with another row. */
  unitNotStated: boolean;
  /** Pairs with a stated figure on at least one side, in the handoff's own order: what the drawing holds. */
  drawn: Pair[];
  /** The drawn pairs with both figures stated. */
  rows: Pair[];
  /** The scale the group is drawn on, from its own axis; null for the group with no figure above zero. */
  axis: AxisEnds | null;
  /** The group of pairs with no non-zero figure: stated figures, drawn without a scale. */
  noFigure: boolean;
  /** Amounts share one scale from zero; levels (margins, KPIs) one scale cut where they sit. */
  fromZero: boolean;
};

/** A pair with no stated figure on either side (gaps, words): listed, not drawn on a scale. */
export type Unstated = { pair: Pair; unit: string };

export type PairFigure =
  | {
      kind: "ready";
      line: number;
      groups: PairGroup[];
      unstated: Unstated[];
      /** The handoff's earnings table was read, since it carries no chart table for this figure. */
      fallback: boolean;
      notes: string[];
      /** Periods stated beside the compared two, as the table states them (their own columns in the table view). */
      otherPeriods: string[];
    }
  | { kind: "gap"; reason: string; line?: number };

const PERCENT_UNIT = /^(?:%|percent|per cent)$/i;
const MINUS = "−";
const signed = (sign: number, text: string) => (sign < 0 ? MINUS : sign > 0 ? "+" : "") + text;
const magnitudeOf = (text: string) => text.replace(/^[-−+]/, "");

function side(cell: string | undefined): Side {
  const reading = readCell(cell ?? "");
  if (reading.kind === "number")
    return {
      kind: "number",
      text: reading.text,
      value: reading.value,
      written: reading.written ?? null,
      reason: null,
    };
  if (reading.kind === "gap") {
    const reason = reasonOf(reading.reason);
    const lead = /^Not \w+/.exec(reading.text)?.[0] ?? "Not supplied";
    return { kind: "gap", text: `${lead}: ${reason}`, value: null, written: null, reason };
  }
  return { kind: "words", text: readable(reading.text), value: null, written: null, reason: null };
}

/** What a unit looks like beside a figure: `58.3%`, `6.27x`, or the number alone for money. */
export function withMark(text: string, unit: string) {
  const grouped = group(text);
  if (PERCENT_UNIT.test(unit)) return `${grouped}%`;
  return unit === "x" ? `${grouped}x` : grouped;
}

function changeText(sign: number, abs: string, unit: string) {
  const grouped = group(abs);
  if (PERCENT_UNIT.test(unit)) return signed(sign, `${grouped} percentage points`);
  return signed(sign, unit === "x" ? `${grouped}x` : grouped);
}

const signOfAbs = (abs: string, negative: boolean): -1 | 0 | 1 =>
  Number(abs) === 0 ? 0 : negative ? -1 : 1;

const AMOUNT = /^([+−-]?)\s*(\d[\d,]*(?:\.\d+)?)(?:\s+([A-Za-z][A-Za-z ,]*))?$/;
const BASIS_POINTS = /^(?:bps?|basis points)$/i;
const POINTS = /^([+−-]?)(\d+(?:\.\d+)?)\s*(?:percentage points?|pp)\b(.*)$/i;

/**
 * The change cell the module wrote, as written: a number grouped and signed in the unit's words
 * (`1355` is `+1,355`), words and a stated gap exactly as they are (`22 reported`, `n.m.`). Words
 * with no sign state no direction.
 */
function statedChange(cell: string, unit: string): Change {
  const written = cell.trim();
  const points = POINTS.exec(written);
  if (points) {
    const [, mark = "", abs = "", rest = ""] = points;
    const sign = signOfAbs(abs, mark === "-" || mark === MINUS);
    const tail = namesSource(rest) ? "" : readerText(rest);
    return {
      text: `${signed(sign, abs)} percentage points${tail}`,
      basis: "stated",
      sign,
      magnitude: Number(abs),
    };
  }
  const reading = readCell(written);
  if (reading.kind === "number" && reading.written !== undefined)
    return {
      text: reading.written,
      basis: "stated",
      sign: signOfAbs(magnitudeOf(reading.text), reading.value < 0),
      magnitude: Math.abs(reading.value),
    };
  const found = AMOUNT.exec(written);
  const digits = found?.[2] ?? "";
  if (found && readCell(digits).kind === "number") {
    const sign = signOfAbs(digits.replaceAll(",", ""), found[1] === "-" || found[1] === MINUS);
    const words = found[3] ?? "";
    const tail = words && !namesSource(words) ? ` ${readerText(words.trim())}` : "";
    // A change stated in basis points is drawn as written: the row's own unit would call it points.
    const stated = BASIS_POINTS.test(words.trim());
    const body = stated
      ? signed(sign, `${group(digits.replaceAll(",", ""))}${tail}`)
      : `${changeText(sign, digits.replaceAll(",", ""), unit)}${tail}`;
    return {
      text: body,
      basis: "stated",
      sign,
      magnitude: Number(digits.replaceAll(",", "")),
    };
  }
  const text = reading.kind === "gap" ? side(written).text : readable(written);
  return { text, basis: "stated", sign: null, magnitude: 0 };
}

/**
 * The one change this page prints (kit `changeBetween`): the cell the module states for the change,
 * as written; else the exact difference of one measure between two periods of the same kind a
 * year apart, on one unit. Anything else is two stated figures and no change.
 */
function changeOf(
  prior: Side,
  current: Side,
  periods: { prior: string | null; current: string | null },
  unit: string,
  statedCell: string | undefined,
): Change | null {
  const figure = (one: Side) => (one.kind === "number" ? one.text : null);
  const made = changeBetween(
    { period: periods.prior ?? "", cell: figure(prior), unit },
    { period: periods.current ?? "", cell: figure(current), unit },
    statedCell,
  );
  if (!made) return null;
  if (made.stated) return statedChange(statedCell ?? "", unit);
  const abs = magnitudeOf(made.text);
  const sign = signOfAbs(abs, made.text.startsWith("-"));
  return { text: changeText(sign, abs, unit), basis: "computed", sign, magnitude: Number(abs) };
}

// Measures the owner's table (signal.ts) knows, by the label as the handoff writes it. Any other label
// gets a direction and no better or worse word. The keys are CP-1's own: a ratio of debt to EBITDA
// rising is worse here exactly as it is there.
const SIGNAL_KEY = new Map([
  ["revenue", "revenue"],
  ["adjusted ebitda", "adjusted_ebitda"],
  ["issuer-adjusted ebitda", "adjusted_ebitda"],
  ["free cash flow", "free_cash_flow"],
  ["levered free cash flow", "free_cash_flow"],
  ["net debt", "net_debt"],
  ["gross debt", "gross_debt"],
  ["total debt", "gross_debt"],
  ["leverage", "leverage"],
  ["total leverage", "leverage"],
  ["gross leverage", "leverage"],
  ["total debt / ebitda", "leverage"],
  ["net leverage", "net_leverage"],
  ["net debt / ebitda", "net_leverage"],
  ["interest coverage", "coverage"],
  ["interest cover", "coverage"],
  ["coverage", "coverage"],
  ["liquidity", "liquidity"],
  ["undrawn committed facilities", "undrawn"],
]);

/** Better or worse only for a change that is printed, has a direction, and a measure the owner's table knows. */
function toneOf(label: string, change: Change | null): Tone {
  const key = SIGNAL_KEY.get(label.trim().replace(/\s+/g, " ").toLowerCase());
  if (!key || !change || change.sign === null) return "none";
  return tone(key, `${change.sign < 0 ? "-" : ""}${String(change.magnitude)}`);
}

type PairInput = Omit<Pair, "change" | "tone" | "others"> & {
  unit: string;
  statedCell?: string | undefined;
  others?: OtherPeriod[];
};

function pairOf({ unit, statedCell, others = [], ...parts }: PairInput): Pair {
  const change = changeOf(
    parts.prior,
    parts.current,
    { prior: parts.priorPeriod, current: parts.currentPeriod },
    unit,
    statedCell,
  );
  return { ...parts, change, tone: toneOf(parts.label, change), others };
}

const stated = (one: Side) => one.kind === "number";
const hasFigure = (pair: Pair) => stated(pair.prior) || stated(pair.current);
const bothFigures = (pair: Pair) => stated(pair.prior) && stated(pair.current);

/** The order of magnitude of a pair's larger figure (`1,198` is 3, `58.3` is 1); null where both are zero. */
function magnitudeBand(pair: Pair) {
  const larger = Math.max(Math.abs(pair.prior.value ?? 0), Math.abs(pair.current.value ?? 0));
  return larger > 0 ? Math.floor(Math.log10(larger)) : null;
}

const MOST_GROUPS = 4;

/**
 * A unit's drawn pairs as small multiples: one group per order of magnitude of the pair's larger
 * figure (bands of x10), each its own scale; groups in the order a pair of each first appears,
 * pairs in the handoff's order inside a group. Pairs with no non-zero figure are one last group of
 * their own. At most four groups, that one included: beyond, the smallest bands are one.
 */
function bandGroups(pairs: readonly Pair[]): { pairs: Pair[]; noFigure: boolean }[] {
  const zero = pairs.filter((pair) => magnitudeBand(pair) === null);
  const sized = pairs.filter((pair) => magnitudeBand(pair) !== null);
  const bands = sized.map((pair) => magnitudeBand(pair) ?? 0);
  const present = [...new Set(bands)].sort((a, b) => b - a);
  const room = MOST_GROUPS - (zero.length > 0 ? 1 : 0);
  const own = present.length > room ? present.slice(0, room - 1) : present;
  const merged = present.filter((one) => !own.includes(one));
  const slot = (band: number) => (own.includes(band) ? band : (merged[0] ?? band));
  const keys = [...new Set(bands.map(slot))];
  return [
    ...keys.map((key) => ({
      pairs: sized.filter((_, at) => slot(bands[at] ?? 0) === key),
      noFigure: false,
    })),
    ...(zero.length > 0 ? [{ pairs: zero, noFigure: true }] : []),
  ];
}

/** The ends of the axis a group's figures are drawn on (the kit's own: from zero for amounts, cut for levels). */
function axisOf(pairs: readonly Pair[], amounts: boolean): AxisEnds {
  const values = pairs.flatMap((pair) =>
    [pair.prior.value, pair.current.value].filter((value): value is number => value !== null),
  );
  const { ticks } = niceAxis(values, { zero: amounts });
  return { from: ticks[0]?.label ?? "", to: ticks.at(-1)?.label ?? "" };
}

function groupOf(unit: string, pairs: Pair[], amounts: boolean): PairGroup[] {
  return bandGroups(pairs).map(({ pairs: members, noFigure }) => ({
    unit,
    percent: PERCENT_UNIT.test(unit),
    unitNotStated: unit === "",
    drawn: members,
    rows: members.filter(bothFigures),
    axis: noFigure ? null : axisOf(members, amounts),
    noFigure,
    fromZero: amounts,
  }));
}

/**
 * The pairs of a figure by the unit each states, in the order the handoff first uses them. A row
 * with no stated unit is a group of its own: nothing says it shares a scale with any other row.
 * A pair with no stated figure on either side is not drawn on a scale: it goes to `unstated`.
 */
function byUnit(pairs: { unit: string; pair: Pair }[], amounts: boolean) {
  const keys = pairs.map((item, at) =>
    item.unit === "" ? `unit-not-stated-${String(at)}` : item.unit,
  );
  const groups = [...new Set(keys)].flatMap((key) => {
    const members = pairs.filter((_, at) => keys[at] === key);
    const drawn = members.filter((item) => hasFigure(item.pair)).map((item) => item.pair);
    return drawn.length > 0 ? groupOf(members[0]?.unit ?? "", drawn, amounts) : [];
  });
  const unstated = pairs.filter((item) => !hasFigure(item.pair));
  return { groups, unstated };
}

const period = (cell: string | undefined) => {
  const reading = readCell(cell ?? "");
  const text = reading.kind === "text" ? safeText(reading.text) : "";
  return text && text !== IN_EVIDENCE ? text : null;
};

/** The table's own notes on its basis; a note that names a source is not drawn, not repeated as a pointer. */
const basisNotes = (table: Table) => {
  const at = columnOf(table, "Basis and limitation");
  const notes = table.rows
    .map((row) => safeText(at < 0 ? "" : (row.cells[at] ?? "")))
    .filter((note) => note && note !== IN_EVIDENCE);
  return [...new Set(notes)];
};

/** A `Chart data: …` pair table (`Measure | Prior period | Prior | Current period | Current | Reporting unit`); null when the handoff has none. */
function chartPairs(
  entry: OutputEntry,
  heading: string,
  amounts: boolean,
  twice: string,
): PairFigure | null {
  const found = allTables(entry).filter((item) => item.heading === heading);
  const [only] = found;
  if (!only) return null;
  if (found.length > 1) return { kind: "gap", reason: twice };
  const { table } = only;
  const at = (name: string) => columnOf(table, name);
  const [measure, priorPeriod, prior, currentPeriod, current, unit] = [
    "Measure",
    "Prior period",
    "Prior",
    "Current period",
    "Current",
    "Reporting unit",
  ].map(at);
  if ([measure, prior, current, unit].some((column) => column === undefined || column < 0))
    return { kind: "gap", reason: NO_COLUMNS, line: table.line };
  const cell = (cells: string[], column: number | undefined) => cells[column ?? -1];
  const pairs = table.rows.map((row) => {
    const unitText = (cell(row.cells, unit) ?? "").trim();
    const unitName = unitLabel(unitText);
    return {
      unit: unitName,
      pair: pairOf({
        label: readable(cell(row.cells, measure) ?? ""),
        line: row.line,
        priorPeriod: period(cell(row.cells, priorPeriod)),
        currentPeriod: period(cell(row.cells, currentPeriod)),
        prior: side(cell(row.cells, prior)),
        current: side(cell(row.cells, current)),
        unit: unitName,
      }),
    };
  });
  if (pairs.length === 0) return { kind: "gap", reason: NO_ROWS, line: table.line };
  const { groups, unstated } = byUnit(pairs, amounts);
  return {
    kind: "ready",
    line: table.line,
    groups,
    unstated,
    fallback: false,
    notes: basisNotes(table),
    otherPeriods: [],
  };
}

// ---------------------------------------------------------------------------------------------
// The handoff's own earnings table (T4.4), when it carries no chart table

type Column = { at: number; label: string; year: number; kind: string };

type Statement =
  | {
      kind: "table";
      table: Table;
      unit: string | null;
      prior: Column;
      current: Column;
      /** The stated change column describes these two periods: they are the table's only annual periods. */
      statedAgrees: boolean;
      others: Column[];
    }
  | { kind: "gap"; reason: string; line?: number };

const UNIT_SENTENCE = /All money amounts are ([^.;]+?)\s*(?:[.;]|$)/i;
const ANNUAL = /^(FY|CY)?\s?(\d{4})$/i;

/** The periods a statement table's headers state, annual ones apart from any other (`LTM Dec-2024`). */
function periodsOf(table: Table) {
  const annual: Column[] = [];
  const other: Column[] = [];
  table.headers.forEach((header, at) => {
    const label = header.trim();
    if (at === 0 || /^yoy\b/i.test(label)) return;
    const year = /(\d{4})/.exec(label)?.[1];
    if (year === undefined) return;
    const dated = ANNUAL.exec(label);
    const column = { at, label, year: Number(year), kind: (dated?.[1] ?? "").toUpperCase() };
    (dated ? annual : other).push(column);
  });
  return { annual, other };
}

/** The one line-item table, its two latest annual periods, and the unit its heading's text states. */
function statement(entry: OutputEntry): Statement {
  const found = allTables(entry).filter(({ table }) => table.headers[0]?.trim() === "Line Item");
  const [only] = found;
  if (!only) return { kind: "gap", reason: NO_RESULTS };
  if (found.length > 1) return { kind: "gap", reason: TWICE_EARNINGS };
  const { table } = only;
  const { annual, other } = periodsOf(table);
  // Annual headers only (`FY2024`, `CY2023`, `2024`): never a pro forma or forecast column.
  const { ordered } = orderPeriods(annual, (column) => column.label);
  const current = ordered.at(-1);
  const prior = ordered.at(-2);
  if (!current || !prior) return { kind: "gap", reason: FEW_PERIODS, line: table.line };
  if (prior.year === current.year) return { kind: "gap", reason: SAME_YEAR, line: table.line };
  if (prior.kind !== current.kind) return { kind: "gap", reason: MIXED_PERIODS, line: table.line };
  const section = entry.sections.find((one) => one.blocks.includes(table));
  const sentence = (section?.blocks ?? []).flatMap((block) =>
    block.type === "text" ? [UNIT_SENTENCE.exec(block.text)?.[1]?.trim()] : [],
  );
  const stated = sentence.find((text) => text);
  return {
    kind: "table",
    table,
    unit: stated ? unitLabel(stated) : null,
    prior,
    current,
    statedAgrees: annual.length === 2,
    others: [...ordered.slice(0, -2), ...other],
  };
}

const PERCENT_CELL = /^(-?\d+(?:\.\d+)?)\s*%$/;
const isMargin = (label: string) => /margin/i.test(label);

function percentSide(cell: string | undefined): Side {
  const text = (cell ?? "").trim().replaceAll("−", "-");
  const found = PERCENT_CELL.exec(text);
  const number = found?.[1];
  if (number !== undefined)
    return { kind: "number", text: number, value: Number(number), written: null, reason: null };
  return side(cell);
}

/** Money rows (both periods plain numbers) or margin rows (a percent sign in every stated cell). */
function statementPairs(entry: OutputEntry, margins: boolean): PairFigure {
  const read = statement(entry);
  if (read.kind === "gap")
    return {
      kind: "gap",
      reason: read.reason === NO_RESULTS && margins ? NO_KPIS : read.reason,
      ...(read.line === undefined ? {} : { line: read.line }),
    };
  const { table, unit, prior, current, others } = read;
  const rows = table.rows.filter((row) => isMargin(row.cells[0] ?? "") === margins);
  const change = columnOf(table, "YoY Change (Abs)");
  const cells = rows.map((row) => [row.cells[prior.at], row.cells[current.at]]);
  if (margins) {
    // A cell that is a figure must carry its percent sign; words and stated gaps are drawn as written.
    const figures = cells.flat().filter((cell) => readCell(cell ?? "").kind === "number");
    const percents = cells
      .flat()
      .filter((cell) => PERCENT_CELL.test((cell ?? "").trim().replaceAll("−", "-")));
    if (figures.some((cell) => !percents.includes(cell)))
      return { kind: "gap", reason: NO_PERCENT, line: table.line };
  } else if (unit === null) return { kind: "gap", reason: NO_UNIT, line: table.line };
  const unitName = margins ? "%" : (unit ?? "");
  const pairs = rows.map((row, at) => {
    const [priorCell, currentCell] = cells[at] ?? [];
    const stateds = change < 0 || !read.statedAgrees ? undefined : row.cells[change];
    return {
      unit: unitName,
      pair: pairOf({
        label: readable(row.cells[0] ?? ""),
        line: row.line,
        priorPeriod: prior.label,
        currentPeriod: current.label,
        prior: margins ? percentSide(priorCell) : side(priorCell),
        current: margins ? percentSide(currentCell) : side(currentCell),
        unit: unitName,
        statedCell: stateds,
        others: others.map((column) => ({
          period: column.label,
          text: readable(row.cells[column.at] ?? ""),
        })),
      }),
    };
  });
  if (pairs.length === 0)
    return { kind: "gap", reason: margins ? NO_MARGINS : NO_PAIRS, line: table.line };
  const { groups, unstated } = byUnit(pairs, !margins);
  const names = others.map((column) => column.label);
  const notes =
    names.length > 0
      ? [
          `Compared: ${prior.label} to ${current.label}. Also stated, in the table view only: ${names.join(", ")}.`,
        ]
      : [];
  return {
    kind: "ready",
    line: table.line,
    groups,
    unstated,
    fallback: true,
    notes,
    otherPeriods: names,
  };
}

// ---------------------------------------------------------------------------------------------
// The variance bridge

type Step = {
  /** The step's name as the handoff writes it. */
  label: string;
  role: "opening" | "change" | "closing";
  text: string;
  value: number;
  line: number;
};

export type Bridge =
  | {
      kind: "bridge";
      line: number;
      /** The `Chart data: …` heading the steps are under, and its plain title (`EBITDA variance`). */
      heading: string;
      title: string;
      unit: string;
      steps: Step[];
      notes: string[];
    }
  | { kind: "unreconciled"; line: number; heading: string; title: string; message: string };

const NOT_DRAWN = "This page could not draw the variance bridge";
const NOT_A_BRIDGE =
  "This page did not draw the variance bridge because its steps do not add up to its closing figure.";

const isZero = (exact: string | null) => exact !== null && /^-?0(?:\.0+)?$/.test(exact);

/** A chart heading's subject as a plain title: `Chart data: EBITDA variance` is `EBITDA variance`. */
const titleOf = (heading: string) => {
  const name = heading.replace(/^Chart data:\s*/, "").trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Every `Chart data: …` step table, each its own bridge under its own title, drawn only when its
 * opening plus its changes is exactly its closing; otherwise the reason it is not.
 */
export function bridges(entry: OutputEntry): Bridge[] {
  return allTables(entry)
    .filter(
      ({ heading, table }) =>
        heading.startsWith("Chart data: ") &&
        table.headers.length === STEP_HEADERS.length &&
        table.headers.every((header, at) => header === STEP_HEADERS[at]),
    )
    .map(({ heading, table }) => bridgeOf(heading, table));
}

/** The module's variance register is context for the chart gap, never a step bridge itself. */
export function hasVarianceRegister(entry: OutputEntry) {
  return allTables(entry).some(({ heading }) => /\bvariance register\b/i.test(heading));
}

function bridgeOf(heading: string, table: Table): Bridge {
  const title = titleOf(heading);
  const refuse = (message: string): Bridge => ({
    kind: "unreconciled",
    line: table.line,
    heading,
    title,
    message,
  });
  const amounts = table.rows.map((row) => row.cells[1] ?? "");
  if (table.rows.length < 3)
    return refuse(
      `${NOT_DRAWN} because it has no change steps between its opening and its closing.`,
    );
  const readings = amounts.map(readCell);
  const missing = readings.findIndex((reading) => reading.kind !== "number");
  const absent = readings[missing];
  if (absent) {
    const label = readable(table.rows[missing]?.cells[0] ?? "");
    return refuse(
      absent.kind === "gap"
        ? `${NOT_DRAWN} because ${label} is not supplied (${reasonOf(absent.reason)}).`
        : `${NOT_DRAWN} because ${label} has no figure this page reads.`,
    );
  }
  const units = new Set(table.rows.map((row) => (row.cells[2] ?? "").trim()));
  if (units.size !== 1) return refuse(`${NOT_DRAWN} because its steps are in different units.`);
  const closing = amounts.at(-1) ?? "";
  const total = sum(amounts.slice(0, -1));
  if (!isZero(total === null ? null : difference(closing, total))) return refuse(NOT_A_BRIDGE);
  const unit = unitLabel([...units][0] ?? "");
  const steps = table.rows.map((row, at): Step => {
    const reading = readCell(amounts[at] ?? "");
    return {
      label: readable(row.cells[0] ?? ""),
      role: at === 0 ? "opening" : at === table.rows.length - 1 ? "closing" : "change",
      text: reading.text,
      value: reading.kind === "number" ? reading.value : 0,
      line: row.line,
    };
  });
  return {
    kind: "bridge",
    line: table.line,
    heading,
    title,
    unit,
    steps,
    notes: basisNotes(table),
  };
}

// ---------------------------------------------------------------------------------------------
// The lead

export type EarningsDelta = {
  bridges: Bridge[];
  movers: PairFigure;
  kpis: PairFigure;
};

export function earningsDelta(entry: OutputEntry): EarningsDelta {
  return {
    bridges: bridges(entry),
    movers: chartPairs(entry, RESULTS, true, TWICE_RESULTS) ?? statementPairs(entry, false),
    kpis: chartPairs(entry, KPIS, false, TWICE_KPIS) ?? statementPairs(entry, true),
  };
}
