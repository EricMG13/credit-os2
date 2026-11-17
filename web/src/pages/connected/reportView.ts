import type { Metric, ModuleState } from "../library/slice";
import { moduleName } from "./api";
import { exactDifference } from "./signal";
import {
  blocked,
  containsReference,
  evidencePath,
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
  const order = moduleOrder(run).filter((id) => Object.hasOwn(run.modules, id));
  const published = outputEntries(snapshot, run, routeKey);
  const entries = order.flatMap((id) => published.filter((entry) => entry.output.module === id));
  const modules = order
    .filter((id) => id !== "CP-8")
    .map((id) => {
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

/** The modules Overview draws from, in run order: CP-8's findings belong on Changes only (CM-062). */
const overviewModules = (run: PublishedRun) => moduleOrder(run).filter((id) => id !== "CP-8");

const designated = (view: ReportView, id: string) =>
  view.entries.find((entry) => entry.selected && entry.output.module === id);

/**
 * The key charts (ruling H5.4): the rows of `docs/visualisations/catalogue.csv` whose placement
 * names Overview and that are drawn as a chart, each by the module that owns it and the heading
 * it publishes the drawing under (`owners/cpos_launch_tables.py`). The catalogue's other Overview
 * rows are not drawings here: "Table/content only" rows (CP-2-V03, CP-2D-V02, CP-5-V01) and
 * CP-0-V02 are tables on their module pages, the chart index (CP-MODEL-V02) is a link to Forecast
 * and the cross-module calendar (DELIVERY-V02) is Dates to watch.
 */
const OVERVIEW_DRAWINGS = [
  ["CP-1A", "events", "Events: Issuer history"], // CP-1A-V01
  ["CP-DR", "events", "Events: Research catalysts"], // CP-DR-V03
  ["CP-2", "maps", "Map: credit-risk transmission"], // CP-2-V02
] as const;

/** The key charts the run has data for, in run order: each module's published drawings, gaps left out. */
export function overviewCharts(view: ReportView, run: PublishedRun) {
  return overviewModules(run).flatMap((id) => {
    const entry = designated(view, id);
    const wanted = OVERVIEW_DRAWINGS.filter(([module]) => module === id);
    if (!entry || !wanted.length || entry.output.parseError || blocked(entry)) return [];
    const headingOf = (line: unknown) =>
      entry.sections.find(({ blocks }) =>
        blocks.some((block) => block.type === "table" && block.line === line),
      )?.heading;
    const pick = (kind: "events" | "maps") =>
      (entry.output[kind] ?? []).filter(
        (figure) =>
          typeof figure.gap !== "string" &&
          wanted.some(([, of, heading]) => of === kind && headingOf(figure.table) === heading),
      );
    const events = pick("events");
    const maps = pick("maps");
    if (!events.length && !maps.length) return [];
    const { id: output, sha256 } = entry.output;
    return [{ id, name: moduleName(id), entry, output: { id: output, sha256, events, maps } }];
  });
}

function passageTexts(entry: OutputEntry, heading: string) {
  return passages(entry.sections)
    .filter((section) => section.heading === heading)
    .flatMap(({ blocks }) => blocks)
    .filter((block) => block.type === "text");
}

/** One bottom line per module that ran, other than the lead; text is null where there is none to show; `referenced` marks one written but citing a source. */
export function moduleBottomLines(view: ReportView, run: PublishedRun) {
  return overviewModules(run).flatMap((id) => {
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
  return overviewModules(run).flatMap((id) => {
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

/** Where a headline figure sits in the Financial foundation handoff: the Evidence address of its
 * row and the period the row states. `reason` is the module's own cell, set only where the row
 * says `Not supplied`; a source without it is a row the tile was looked up in, and says no such thing. */
export type HeadlineSource = { href: string; period: string; reason?: string };

/** The CP-1 chart table and column heading each headline figure is quoted from: `_METRICS` of
 * `credit_os_catalogue.py`, where an adjusted heading stands in for the reported one. */
const HEADLINE_CELLS = {
  net_leverage: ["leverage", /^Net debt \/ /],
  leverage: ["leverage", /^Total debt \/ /],
  coverage: ["interest cover", / \/ cash interest$/],
  revenue: ["revenue and EBITDA", /^Revenue$/],
  adjusted_ebitda: ["revenue and EBITDA", /^Adjusted EBITDA$/],
  cash: ["liquidity", /^Cash$/],
} as const;

type Figure = CatalogueRun["metrics"][string];

/** A headline figure the catalogue gives a value: a zero is a figure, an empty string is none. */
export const stated = (figure: Figure | undefined): figure is Figure & { value: string | number } =>
  figure?.value != null && figure.value !== "";

/** The sort key of a Period cell, as `period_order` of `credit_os_catalogue.py`: `FY2024`,
 * `2024-09-30` or `FY2024 / 2024-09-30` (ordered by its date). The keys of one form compare as
 * text in date order; nothing for any other text, an impossible date, or a year that disagrees
 * with its date. */
function periodOrder(cell: string) {
  const year = /^FY(\d{4})$/.exec(cell);
  if (year) return `1-${year[0].slice(2)}`;
  const dated = /^FY(\d{4}) \/ (\d{4}-\d{2}-\d{2})$/.exec(cell);
  const date = dated?.[2] ?? cell;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (dated && dated[1] !== date.slice(0, 4)))
    return undefined;
  const [y = 0, m = 0, d = 0] = date.split("-").map(Number);
  const day = new Date(0);
  day.setUTCFullYear(y, m - 1, d);
  return y > 0 && day.toISOString().startsWith(date) ? `2-${date}` : undefined;
}

/** The row of a chart table with the latest Period, chosen as `chart_rows` of
 * `credit_os_catalogue.py` chooses it (by the period, whatever the order of the rows); nothing
 * where the builder chooses none: a row whose cells do not match the headings or whose period
 * cannot be ordered, periods of mixed forms, or a period that repeats. */
function latestRow(table: Table, at: number) {
  const ranked: { row: Row; key: string }[] = [];
  for (const row of table.rows) {
    const same = row.cells.length === table.headers.length;
    const key = same ? periodOrder(row.cells[at] ?? "") : undefined;
    if (key === undefined) return undefined;
    ranked.push({ row, key });
  }
  const keys = ranked.map(({ key }) => key);
  if (new Set(keys.map((key) => key[0])).size !== 1 || new Set(keys).size !== keys.length)
    return undefined;
  return ranked.reduce((latest, item) => (item.key > latest.key ? item : latest)).row;
}

/** The row of a headline figure's chart table, and that row's cell in the figure's column: the row
 * that states `period`, or, with none, the chart's latest row. Nothing when the table, the one
 * column or the one row is not there. */
function headlineRow(
  entry: OutputEntry,
  [chart, heading]: readonly [string, RegExp],
  period: string | undefined,
) {
  const table = namedTable(entry, `Chart data: ${chart}`, ["Period"]);
  if (!table) return undefined;
  const at = table.headers.indexOf("Period");
  const columns = table.headers.flatMap((name, i) => (heading.test(name) ? [i] : []));
  const row =
    period === undefined
      ? latestRow(table, at)
      : namedRow(table, ({ cells }) => cells[at] === period);
  const [column] = columns;
  const cell = columns.length === 1 && column !== undefined ? row?.cells[column] : undefined;
  return row && cell !== undefined
    ? { line: row.line, cell, period: row.cells[at] ?? "" }
    : undefined;
}

/**
 * The handoff row each headline figure is read from, by metric key, so its tile can open the
 * trace. For a figure the catalogue lacks it is the latest row of the figure's own chart, the row
 * the catalogue builder passed over, with the module's words only where that row says `Not
 * supplied`. No entry where a row is not found or states another value: a tile keeps no trace
 * rather than one that disagrees with it.
 */
export function headlineSources(
  entry: OutputEntry | undefined,
  catalogue: CatalogueRun | undefined,
  folder: string,
) {
  const sources: Record<string, HeadlineSource> = {};
  if (!entry || !catalogue || entry.output.module !== "CP-1" || blocked(entry)) return sources;
  for (const [key, where] of Object.entries(HEADLINE_CELLS)) {
    const figure = catalogue.metrics[key];
    const period = stated(figure) ? figure.period : undefined;
    if (stated(figure) && !period) continue;
    const found = headlineRow(entry, where, period ?? undefined);
    if (!found) continue;
    const href = evidencePath(folder, entry, found.line);
    if (!stated(figure)) {
      const said = found.cell.startsWith("Not supplied") ? { reason: found.cell } : {};
      sources[key] = { href, period: found.period, ...said };
    } else if (found.cell === String(figure.value)) sources[key] = { href, period: found.period };
  }
  return sources;
}

export function traceKey(entry: OutputEntry, line: number) {
  return JSON.stringify([entry.output.run ?? "", entry.output.id, entry.output.sha256, line]);
}
