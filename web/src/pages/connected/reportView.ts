import type { Metric, ModuleState } from "../library/slice";
import { moduleName } from "./api";
import { exactDifference } from "./signal";
import {
  blocked,
  containsReference,
  methodNote,
  outputEntries,
  passages,
  readParagraph,
  readerText,
  runModels,
  withUnit,
} from "./publishedReport";
import type {
  CatalogueRun,
  OutputEntry,
  PublishedRun,
  Row,
  Snapshot,
  Table,
} from "./publishedReport";

export function moduleState(entry: OutputEntry | undefined): ModuleState {
  if (!entry) return "Not run";
  if (entry.output.parseError || blocked(entry)) return "Not assessable";
  if (
    entry.output.chartGaps?.length ||
    /^(?:Restricted|Draft Only)$/i.test(entry.output.state?.declared ?? "")
  )
    return "Delivered with gaps";
  return "Delivered";
}

export function namedTable(entry: OutputEntry, heading: string, headers: readonly string[]) {
  const tables = entry.sections
    .filter((section) => section.heading === heading)
    .flatMap(({ blocks }) => blocks)
    .filter((table): table is Table => table.type === "table");
  const matches = tables.filter((table) => headers.every((name) => table.headers.includes(name)));
  return matches.length === 1 ? matches[0] : undefined;
}

export function namedRow(table: Table | undefined, predicate: (row: Row) => boolean) {
  const matches = table?.rows.filter(predicate);
  return matches?.length === 1 ? matches[0] : undefined;
}

function isLead(entry: OutputEntry, module: string) {
  return (
    entry.selected &&
    entry.output.module === module &&
    !blocked(entry) &&
    passages(entry.sections).some((section) => section.heading === "Bottom line")
  );
}

export function buildReportView(snapshot: Snapshot, routeKey: string, run: PublishedRun) {
  const entries = outputEntries(snapshot, run, routeKey);
  const modules = Object.keys(run.modules).map((id) => {
    const outputs = entries.filter((entry) => entry.output.module === id);
    const selected = outputs.find((entry) => entry.selected);
    return { id, name: moduleName(id), state: moduleState(selected ?? outputs[0]), outputs };
  });
  return {
    entries,
    modules,
    lead: ["CP-6", "CP-2", "CP-L10", ...(run.pathway === "earnings_update" ? ["CP-1B"] : [])]
      .map((id) => entries.find((entry) => isLead(entry, id)))
      .find((entry) => entry !== undefined),
    models: runModels(snapshot, routeKey, run),
    catalogue: snapshot.catalogue.real.find((entry) => entry.id === run.folder),
  };
}

export type ReportView = ReturnType<typeof buildReportView>;

/** Module ids in the order the run ran them, then any the record does not name. */
export function moduleOrder(run: PublishedRun) {
  return [
    ...new Set([
      ...(run.record?.steps ?? []).map((step) => step.module),
      ...Object.keys(run.modules),
    ]),
  ];
}

const designated = (view: ReportView, id: string) =>
  view.entries.find((entry) => entry.selected && entry.output.module === id);

function passageTexts(entry: OutputEntry, heading: string) {
  return passages(entry.sections)
    .filter((section) => section.heading === heading)
    .flatMap(({ blocks }) => blocks)
    .filter((block) => block.type === "text");
}

/** One bottom line per module that ran, other than the lead; text is null where there is none to show; `referenced` marks one written but citing a source. */
export function moduleBottomLines(view: ReportView, run: PublishedRun) {
  return moduleOrder(run).flatMap((id) => {
    const entry = designated(view, id);
    if (!entry || entry === view.lead) return [];
    const block = passageTexts(entry, "Bottom line").find((item) => !methodNote(item.text));
    const written = block
      ? { line: block.line, body: readParagraph(block.text).body }
      : entry.output.summary
        ? {
            line: entry.output.summary.line,
            body: readParagraph(entry.output.summary.bottomLine).body,
          }
        : null;
    const body = written?.body.replaceAll("**", "").replaceAll("`", "");
    const referenced = body !== undefined && containsReference(body);
    return [
      {
        id,
        name: moduleName(id),
        state: moduleState(entry),
        entry,
        text: body && !referenced ? readerText(body) : null,
        referenced,
        line: written?.line ?? null,
      },
    ];
  });
}

const sameLimitation = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/** Each limitation of the run once, in module order; a module that could not assess writes none. */
export function runLimitations(view: ReportView, run: PublishedRun) {
  const seen = new Set<string>();
  return moduleOrder(run).flatMap((id) => {
    const entry = designated(view, id);
    if (!entry || blocked(entry)) return [];
    const written = passageTexts(entry, "Limitations");
    // An earlier-format handoff has no Limitations passage; its summary carries the limitation.
    const items = passages(entry.sections).some((section) => section.heading === "Limitations")
      ? written.map((block) => ({ text: block.text, line: block.line }))
      : entry.output.summary
        ? [{ text: entry.output.summary.limitation, line: entry.output.summary.line }]
        : [];
    return items.flatMap(({ text, line }) => {
      const { body } = readParagraph(text);
      const key = sameLimitation(body);
      if (!body || methodNote(text) || seen.has(key)) return [];
      seen.add(key);
      return [{ id, name: moduleName(id), entry, text: readerText(body), line }];
    });
  });
}

export type MetricKey =
  | "liquidity"
  | "freeCashFlow"
  | "leverage"
  | "interestCover"
  | "netDebt"
  | "principal"
  | "maturities";
type MetricBinding = { key: MetricKey; metric: Metric; line?: number };
const creditMetrics = [
  ["liquidity", "Total liquidity at period end", "money"],
  ["freeCashFlow", "Free cash flow (operating cash flow less capex), twelve months", "money"],
  ["leverage", "(Total debt plus financing obligations) / EBITDA", "x"],
  ["interestCover", "EBITDA / (cash interest for debt plus cash rent recorded as interest)", "x"],
  ["netDebt", "Net debt at period end", "money"],
] as const;

/** `US$m` for USD, otherwise the currency code and `m`: `MONEY_UNIT` of the issuer library's
 * `handoff_fields.py`. */
const MONEY_UNIT = /^(?:US\$m|[A-Z]{3}m)$/;

/** The run's money unit: CP-1's, as the catalogue records it with the run's cash figure
 * (docs/rulings/2026-11-16-reporting-currency-from-sources.md); none when it records no money unit. */
export function runMoneyUnit(catalogue: CatalogueRun | undefined) {
  const unit = catalogue?.metrics.cash?.unit;
  return unit && MONEY_UNIT.test(unit) ? unit : undefined;
}

/** The money unit a table's tiles take: the run's, else the one money unit the table's `column`
 * states; none when it states two. */
function tileUnit(run: string | undefined, table: Table | undefined, column: number) {
  if (run || !table) return run;
  const units = new Set(
    table.rows.map(({ cells }) => cells[column] ?? "").filter((unit) => MONEY_UNIT.test(unit)),
  );
  return units.size === 1 ? [...units][0] : undefined;
}

const numeric = /^-?\d+(?:\.\d+)?$/;
const exactComma = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d|\.))/g, ",");
function financialValue(value: string, unit: string) {
  const [integer, fraction] = value.split(".");
  const display =
    fraction === undefined ? exactComma(integer ?? "") : `${exactComma(integer ?? "")}.${fraction}`;
  return withUnit(display, unit);
}

function creditMetricColumn(entry: OutputEntry, table: Table, date: string) {
  const periods = namedTable(entry, "Period table", ["Period", "Start", "End"]);
  const names = periods?.rows.filter((row) => row.cells[2] === date).map((row) => row.cells[0]);
  const named = table.headers.flatMap((header, i) =>
    header === date || names?.includes(header) ? [i] : [],
  );
  return named.length === 1 ? named[0] : undefined;
}

const oneYearBefore = (date: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const [, year = "", month = "", day = ""] = match ?? [];
  return match && !(month === "02" && day === "29")
    ? `${String(Number(year) - 1).padStart(4, "0")}-${month}-${day}`
    : undefined;
};

/** The column of the one period exactly a year before the current one, by its Start and End. */
function priorMetricColumn(entry: OutputEntry, table: Table, date: string, column: number) {
  const periods = namedTable(entry, "Period table", ["Period", "Start", "End"]);
  const current = periods?.rows.filter((row) => row.cells[2] === date || row.cells[0] === date);
  const [now] = current ?? [];
  if (current?.length !== 1 || !now) return undefined;
  const header = table.headers[column];
  if (header !== now.cells[0] && header !== date) return undefined;
  const start = oneYearBefore(now.cells[1] ?? "");
  const end = oneYearBefore(now.cells[2] ?? "");
  const prior = periods?.rows.filter((row) => row.cells[2] === end);
  const [before] = prior ?? [];
  if (!start || !end || prior?.length !== 1 || !before || before.cells[1] !== start)
    return undefined;
  const name = before.cells[0];
  const columns = table.headers.flatMap((header, i) => (header === name ? [i] : []));
  return columns.length === 1 && name ? { column: columns[0] as number, period: name } : undefined;
}

function metricBinding(
  key: MetricKey,
  label: string,
  value: string,
  unit: string,
  note: string,
  line?: number,
  yearChange?: Metric["yearChange"],
): MetricBinding {
  return {
    key,
    metric: {
      label,
      value: { kind: "value", at: null, text: financialValue(value, unit) },
      note,
      trace: null,
      ...(yearChange && { yearChange }),
    },
    line,
  };
}

function principal(entry: OutputEntry, date: string, run?: string): MetricBinding[] {
  const table = namedTable(entry, "Debt principal to carrying value", [
    "Period",
    "Contractual principal",
    "Reporting unit",
  ]);
  const unit = tileUnit(run, table, 4);
  if (unit === undefined) return [];
  const row = namedRow(table, ({ cells }) => cells[0] === date && cells[4] === unit);
  const value = row?.cells[1];
  return value && numeric.test(value)
    ? [metricBinding("principal", "Contractual principal", value, unit, date, row.line)]
    : [];
}

function maturityTotal(entry: OutputEntry, date: string, run?: string): MetricBinding[] {
  const schedule = namedTable(entry, "Chart data: debt maturities", [
    "Period",
    "Debt maturing",
    "Reporting unit",
  ]);
  const column = schedule?.headers.indexOf("Reporting unit") ?? -1;
  const unit = tileUnit(run, schedule, column);
  if (unit === undefined || !schedule?.rows.every(({ cells }) => cells[column] === unit)) return [];
  const table = namedTable(entry, "Calculations", [
    "ID",
    "Calculation",
    "Inputs",
    "Result",
    "Source",
  ]);
  const dateYear = Number(date.slice(0, 4));
  const through = dateYear + 1;
  const row = namedRow(table, ({ cells }) => {
    const match = /^Maturities from (\d{4}-\d{2}-\d{2}) to end-(\d{4})$/.exec(cells[1] ?? "");
    return (
      !!match &&
      Number(match[2]) === through &&
      match[1]?.slice(0, 4) === date.slice(0, 4) &&
      match[1] > date
    );
  });
  const value = row?.cells[3];
  return value && numeric.test(value)
    ? [metricBinding("maturities", row.cells[1] ?? "", value, unit, date, row.line)]
    : [];
}

export function actionBias(entry: OutputEntry) {
  if (entry.output.module !== "CP-6") return undefined;
  for (const section of entry.sections) {
    if (section.heading !== "Decision") continue;
    for (const block of section.blocks) {
      if (block.type !== "text") continue;
      const match =
        /^Final Action Bias: (Watchlist|Avoid|Starter Position|Requires More Work|Add Exposure)\./i.exec(
          readParagraph(block.text).body,
        );
      if (match) return match[1];
    }
  }
  return undefined;
}

function creditMeasures(entry: OutputEntry, date: string, run?: string): MetricBinding[] {
  const table = namedTable(entry, "Financials and credit metrics", ["Metric", "Unit"]);
  const column = table && creditMetricColumn(entry, table, date);
  if (!table || column === undefined) return [];
  const prior = priorMetricColumn(entry, table, date, column);
  const units = table.headers.indexOf("Unit");
  const money = tileUnit(run, table, units);
  return creditMetrics.flatMap(([key, label, kind]) => {
    const unit = kind === "money" ? money : kind;
    if (unit === undefined) return [];
    const row = namedRow(table, ({ cells }) => cells[0] === label && cells[units] === unit);
    const value = row?.cells[column];
    const before = prior && row?.cells[prior.column];
    const change = value && before ? exactDifference(value, before) : null;
    return value && numeric.test(value)
      ? [
          metricBinding(
            key,
            label,
            value,
            unit,
            date,
            row.line,
            change !== null && prior ? { key, change, unit, prior: prior.period } : undefined,
          ),
        ]
      : [];
  });
}

export function foundationMetrics(entry: OutputEntry, catalogue: CatalogueRun | undefined) {
  const date = catalogue?.metrics.cash?.period;
  if (!date || entry.output.module !== "CP-1" || blocked(entry)) return [];
  const run = runMoneyUnit(catalogue);
  return [
    ...creditMeasures(entry, date, run),
    ...principal(entry, date, run),
    ...maturityTotal(entry, date, run),
  ];
}

export function traceKey(entry: OutputEntry, line: number) {
  return JSON.stringify([entry.output.run ?? "", entry.output.id, entry.output.sha256, line]);
}
