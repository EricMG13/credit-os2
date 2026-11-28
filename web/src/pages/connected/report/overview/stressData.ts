import { orderPeriods } from "@/utils/periodOrder";
import type { OutputEntry } from "../../publishedReport";
import { gridOf } from "../../visuals/LegacyForecast";
import { isForecastPeriod } from "../../visuals/scenarioPeriods";
import {
  amount,
  items,
  record,
  sharePosition,
  stringsIn,
  ticks,
  word,
  type SourceTable,
} from "../../visuals/visualData";
import { namedTable } from "../../reportView";
import { downsideView, scenarioShareLabel } from "../Downside";
import { columnAt, readFigureCell, type Cell } from "./figureData";
import { labelText, readableWords, readerCell } from "./notes";
import { readerReason } from "./reason";

type Descriptor = Record<string, unknown>;

export type HeadroomTest = {
  label: string;
  unit: string;
  threshold: Cell;
  current: Cell;
  /** The published headroom, when the handoff states one. */
  headroom: string | null;
  direction: string;
  line?: number;
};

/** A stated headroom, through the reader rule: a trailing citation set aside. */
const stated = (text: string) =>
  text.trim() && !/^Not (?:supplied|calculated)\b/.test(text) ? readerCell(text) : null;

/** The covenant tests as published: each test's own threshold, current value and unit. */
export function headroomTests(table: SourceTable, descriptor: Descriptor): HeadroomTest[] | null {
  const label = columnAt(table, items(descriptor.label)[0] ?? descriptor.label);
  const threshold = columnAt(table, descriptor.threshold);
  const current = columnAt(table, descriptor.current);
  if (label === null || threshold === null || current === null) return null;
  const headroom = columnAt(table, descriptor.headroom);
  const direction = columnAt(table, descriptor.direction);
  return table.rows.map((row, at) => {
    const unit = row.at(-2) ?? "";
    const scope = [row[threshold] ?? "", row[current] ?? ""];
    return {
      label: labelText(row[label] ?? "", "A test"),
      unit,
      threshold: readFigureCell(scope[0] ?? "", scope, unit),
      current: readFigureCell(scope[1] ?? "", scope, unit),
      headroom: headroom === null ? null : stated(row[headroom] ?? ""),
      direction: direction === null ? "" : (row[direction] ?? ""),
      line: table.rowLines?.[at],
    };
  });
}

export const BULLET = { width: 408, left: 8, right: 400 } as const;

/**
 * A test's value and threshold on one scale that holds zero, of either sign; null when either is
 * not a number. `zero` is where the current value's bar starts.
 */
export function bulletGeometry(test: HeadroomTest) {
  const { value: current } = test.current;
  const { value: threshold } = test.threshold;
  if (current === null || threshold === null) return null;
  const scale = ticks([current, threshold]);
  const low = scale[0]?.value ?? 0;
  const top = scale.at(-1)?.value ?? 1;
  const share = (value: number) => (value - low) / (top - low);
  const at = (value: number) => BULLET.left + share(value) * (BULLET.right - BULLET.left);
  return {
    zero: at(0),
    current: at(current),
    threshold: at(threshold),
    share: { zero: share(0), current: share(current), threshold: share(threshold) },
    ticks: scale.map((tick) => ({ label: tick.label, x: at(tick.value) })),
  };
}

export type DownsidePanel = {
  measure: string;
  cells: Cell[];
  min: number;
  max: number;
  /** The handoff line of the measure's row. */
  line?: number;
};

const LEAD_NUMBER = /^(-?\d[\d,]*(?:\.\d+)?) \(/;
const STATED_GAP = /^Not (?:supplied|calculated):\s*(\S.*)$/;

/** A stressed cell read in its measure's unit ("7.5x" in an "(x)" row is 7.5). A gap keeps the
 * module's reason; a cell with words of its own is never called empty. */
function stressCell(text: string, unit: string): Cell {
  const plain = text.replaceAll("−", "-").trim();
  // A measure that states no unit is drawn only for a cell that states its own: a multiple
  // ("6.53x", "4.88x; pro forma 6.02x"). A bare number there has no scale and is not drawn.
  const multiple = /^(-?\d+(?:\.\d+)?)x(?:;|$)/.exec(plain)?.[1];
  const value = unit
    ? (amount(plain, unit) ?? amount(LEAD_NUMBER.exec(plain)?.[1] ?? ""))
    : multiple === undefined
      ? null
      : Number(multiple);
  const reason = STATED_GAP.exec(text.trim())?.[1] ?? (plain ? null : "No value stated");
  return { text, value, reason: value === null ? reason : null };
}

/** A multiple the module qualifies in the same cell ("4.88x; separate … pro forma 6.02x"): "4.88x". */
const QUALIFIED_MULTIPLE = /^(-?\d+(?:\.\d+)?x);/;

/** The figure a chart labels for a cell: its leading multiple when the cell goes on in words, else the cell. */
export const stressLabel = (text: string) => QUALIFIED_MULTIPLE.exec(text.trim())?.[1] ?? text;

const SCENARIOS = "T2DS.1 Scenarios";
const SHOCKS = ["EBITDA decline s", "Cash-interest increase k"] as const;

/**
 * The column of the case names: one headed "Name", "Scenario name" or "Case name", else the first
 * whose header holds "name" but not "file" or "source"; -1 when there is none.
 */
function nameColumn(headers: readonly string[]) {
  const exact = headers.findIndex((header) => /^(?:scenario |case )?name$/i.test(header.trim()));
  if (exact >= 0) return exact;
  return headers.findIndex((header) => /name/i.test(header) && !/file|source/i.test(header));
}

/** The module's scenario register by id: each case's name (from `nameColumn`, its readable words
 * only) and its two shocks, as written. */
function register(entry: OutputEntry) {
  const table = namedTable(entry, SCENARIOS, ["Scenario ID"]);
  const headers = table?.headers ?? [];
  const id = headers.indexOf("Scenario ID");
  const name = nameColumn(headers);
  const [decline, interest] = SHOCKS.map((header) => headers.indexOf(header));
  return new Map(
    (table?.rows ?? []).map(({ cells }) => [
      cells[id] ?? "",
      {
        name: name < 0 ? null : readableWords(cells[name] ?? ""),
        decline: cells[decline ?? -1] ?? "",
        interest: cells[interest ?? -1] ?? "",
      },
    ]),
  );
}

type Scenario = ReturnType<typeof register> extends Map<string, infer V> ? V : never;

type WrittenCase = {
  id: string;
  name: string;
  decline: string;
  interest: string;
  category: string;
  confidence: string;
};

/** The module's own classification of a case ("Control, not a forecast", "Analyst Interpretation; Medium"). */
const classification = (item: WrittenCase) =>
  [item.category, item.confidence]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("; ");

/** The cases as `downsideView` read them from the module's own register, when the module wrote the
 * "Case | ..." shape rather than a "Scenario ID" table. */
const fromView = (written: readonly WrittenCase[]) =>
  new Map<string, Scenario>(
    written.map((item) => [
      item.id,
      { name: readableWords(item.name), decline: item.decline, interest: item.interest },
    ]),
  );

const unshocked = (item: Scenario | undefined) =>
  item !== undefined && sharePosition(item.decline) === 0 && sharePosition(item.interest) === 0;

/** The cases in the matrix's order: the module's names, numbered where it gives none, and the
 * one case with no shock applied, only when exactly one states zero shocks. */
function downsideCaseList(entry: OutputEntry, ids: string[], written: readonly WrittenCase[]) {
  const table = register(entry);
  const scenarios = table.size ? table : fromView(written);
  const kinds = new Map(written.map((item) => [item.id, classification(item)]));
  const quiet = ids.filter((id) => unshocked(scenarios.get(id)));
  const cases = ids.map((id, at) => ({
    id,
    name: scenarios.get(id)?.name || `Case ${String(at + 1)}`,
    control: quiet.length === 1 && quiet[0] === id,
  }));
  const named = ids.filter((id) => scenarios.get(id)?.name).length;
  const numbering =
    named === 0
      ? ["This page could not read case names; cases are numbered in the order stated."]
      : named < ids.length
        ? [
            "This page could not read some case names; those cases are numbered in the order stated.",
          ]
        : [];
  const assumptions = cases.flatMap(({ id, name, control }) => {
    const item = scenarios.get(id);
    // The module's own classification of the case, so a control is never read as a stress.
    const kind = kinds.get(id) ? [`${name}: ${kinds.get(id) ?? ""}.`] : [];
    if (control) return kind.length ? kind : [`${name}: the case with no shock applied.`];
    if (!item) return kind;
    return [
      ...kind,
      `${name}: EBITDA decline ${scenarioShareLabel(item.decline)}, cash interest increase ${scenarioShareLabel(item.interest)}.`,
    ];
  });
  return { cases, assumptions: [...numbering, ...assumptions] };
}

/** A measure's unit from its label's last bracket: "(x)", "(%)", "(USD millions)". */
const unitOfMeasure = (measure: string) => /\(([^()]+)\)$/.exec(measure.trim())?.[1] ?? "";

/**
 * The stress results as small multiples: one panel a measure the handoff states, in its order and
 * as written, one bar a case, each panel on its own scale from zero.
 */
export function downsidePanels(entry: OutputEntry) {
  const view = downsideView(entry);
  if (!view) return null;
  const ids = view.matrix.headers.slice(1, -1);
  const { cases, assumptions } = downsideCaseList(entry, ids, view.cases);
  const panels = view.matrix.rows.map(({ cells, line }): DownsidePanel => {
    const label = cells[0] ?? "";
    const read = ids.map((_, at) => stressCell(cells[at + 1] ?? "", unitOfMeasure(label)));
    const values = read.flatMap((cell) => (cell.value === null ? [] : [cell.value]));
    return {
      measure: labelText(label, "A measure"),
      cells: read,
      min: Math.min(0, ...values),
      max: Math.max(0, ...values),
      line,
    };
  });
  if (!panels.length) return null;
  return { cases, panels, assumptions, line: view.matrix.line };
}

/**
 * For other pages that read one leverage and one cover measure (kept for their imports; the
 * Overview draws every measure through `downsidePanels`): the first measure named "Net leverage
 * … (x)" and the first naming cover in x that state a figure for some case, with the cases and
 * assumptions. Null when neither is stated.
 */
export function downsideCases(entry: OutputEntry) {
  const data = downsidePanels(entry);
  if (!data) return null;
  const stated = (pattern: RegExp) =>
    data.panels.find(
      (panel) => pattern.test(panel.measure) && panel.cells.some((cell) => cell.value !== null),
    ) ?? null;
  const leverage = stated(/^Net leverage\b.*\(x\)$/i);
  const cover = stated(/\bcover\b.*\(x\)$/i);
  if (!leverage && !cover) return null;
  return { cases: data.cases, leverage, cover, assumptions: data.assumptions, line: data.line };
}

/** Where a panel's zero and a value sit across `room` pixels. */
export function panelScale(panel: DownsidePanel, room: number) {
  const span = panel.max - panel.min || 1;
  const at = (value: number) => ((value - panel.min) / span) * room;
  return { zero: at(0), at };
}

type PathPoint = { period: string; display: string; value: number | null; reason: string };

export const NET_LEVERAGE = /^Net leverage\b/i;
/** The model marks its base case by this group name; no other group is taken for it. */
const BASE = "Base case";
const MOST_LIMITS = 2;

/** Why the path has no base case to headline: the model marks none, or states it no figure. */
export const unbased = (groups: string[]) =>
  groups.includes(BASE)
    ? "The model states no net leverage for the base case."
    : "The model marks no case as the base case.";

const hasFigure = (item: { points: readonly { value: number | null }[] }) =>
  item.points.some((point) => point.value !== null);

/** Net leverage by forecast period for each case of the published model, as the model computed it. */
export function forwardPath(model: unknown) {
  const raw = record(record(model).cashflow);
  const grid = gridOf(raw);
  const row = grid?.rows.find((item) => NET_LEVERAGE.test(item.label));
  if (!grid || !row) return null;
  // A case is a group of forecast periods; the reported columns (a fiscal year, a last twelve
  // months) carry dates too but are no case, and the Forecast page draws them.
  const forecast = (column: { label: string; start: string }) =>
    Boolean(column.start) && isForecastPeriod(column.label);
  const groups = [...new Set(grid.columns.filter(forecast).map((c) => c.group))];
  const cases = groups
    .sort((a, b) => Number(b === BASE) - Number(a === BASE))
    .map((group) => ({
      group,
      points: orderPeriods(
        grid.columns.flatMap((column, at): PathPoint[] => {
          if (column.group !== group || !forecast(column)) return [];
          const cell = row.cells[at] ?? {};
          const value = cell.status === "value" ? amount(word(cell.exact)) : null;
          return [
            { period: column.label, display: word(cell.display), value, reason: word(cell.reason) },
          ];
        }),
        ({ period }) => period,
      ).ordered,
    }))
    // A case with a stated figure leads (the base case first); one whose every figure is a stated
    // gap follows, kept for the notes and the table, never plotted.
    .sort((a, b) => Number(hasFigure(b)) - Number(hasFigure(a)));
  if (!cases.some(hasFigure)) return null;
  // The model's own first statements of what it is, in reader words (codes named, Basis lines and
  // markers set aside); those that cite a source, and the full list, are on the Forecast page.
  const limits = stringsIn(raw.limits)
    .flatMap((line) => readerReason(line) ?? [])
    .slice(0, MOST_LIMITS);
  const based = cases[0]?.group === BASE;
  return { measure: row.label, cases, based, unbased: based ? null : unbased(groups), limits };
}

/**
 * For a model whose net leverage row exists but states no figure in any case: what the model says
 * (its first stated reason, in reader words, else that it states no net leverage by period). Null
 * when the model has no net leverage row, or a path can be drawn: `forwardPath` is null for both of
 * the first two, and this tells them apart.
 */
export function forwardStatement(model: unknown) {
  const grid = gridOf(record(record(model).cashflow));
  const row = grid?.rows.find((item) => NET_LEVERAGE.test(item.label));
  if (!grid || !row || forwardPath(model)) return null;
  // Only a forecast column's reason speaks for the forward path: a history column's is about its own period.
  const stated = grid.columns.flatMap((column, at) => {
    const reason =
      Boolean(column.start) && isForecastPeriod(column.label)
        ? readerReason(word(row.cells[at]?.reason))
        : null;
    return reason ? [`${column.group}, ${column.label}: ${reason}`] : [];
  })[0];
  return stated ?? "The published model states no net leverage by period.";
}

export const PATH = { width: 292, height: 170, left: 28, right: 268, top: 24, base: 130 } as const;

/** Every period the cases publish, once, in the one period order: the path's X axis. */
export function pathPeriods(cases: readonly { points: readonly { period: string }[] }[]) {
  const periods = [...new Set(cases.flatMap(({ points }) => points.map(({ period }) => period)))];
  return orderPeriods(periods, (period) => period).ordered;
}

/**
 * The path's points on one scale: the lowest tick sits at the figure's base and the highest at its
 * top, so a value below zero (net cash) lies below the zero gridline, inside the figure. A period
 * the model has no figure for has no y.
 */
export function pathGeometry(cases: { points: PathPoint[] }[]) {
  const periods = pathPeriods(cases);
  const scale = ticks(cases.flatMap(({ points }) => points.map((point) => point.value)));
  const low = scale[0]?.value ?? 0;
  const top = scale.at(-1)?.value ?? 1;
  const step = periods.length > 1 ? (PATH.right - PATH.left - 28) / (periods.length - 1) : 0;
  const x = (period: string) => PATH.left + 28 + periods.indexOf(period) * step;
  const y = (value: number) =>
    PATH.base - ((value - low) / (top - low || 1)) * (PATH.base - PATH.top);
  return {
    zero: y(0),
    periods: periods.map((period) => ({ period, x: x(period) })),
    ticks: scale.map((tick) => ({ label: tick.label, y: y(tick.value) })),
    lines: cases.map(({ points }) =>
      points.map((point) => ({
        ...point,
        x: x(point.period),
        y: point.value === null ? null : y(point.value),
      })),
    ),
  };
}
