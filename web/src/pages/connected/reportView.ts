import type { Metric, ModuleState } from "../library/slice";
import { moduleName } from "./api";
import { comparePeriodKeys, parsePeriod, periodKey } from "@/utils/periodOrder";
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

const NO_CUSTOM_LEAD = ["CP-0", "CP-DR", "CP-5", "CP-8", "CP-MODEL"];

/**
 * The modules that may lead the Overview, first choice first. A custom run (PR 7a, ruling C16)
 * leads with CP-2, else the last module it planned that has a usable entry; the sources, the
 * research questions, the evidence check, the comparison and the forecast lead nothing. Its plan is
 * the manifest's request, or the order it ran when none is recorded.
 */
export function leadModules(run: PublishedRun, order: readonly string[]) {
  if (run.pathway === "custom") {
    const planned = Array.isArray(run.requested) ? run.requested : order;
    return [
      "CP-2",
      ...[...planned].reverse().filter((id) => id !== "CP-2" && !NO_CUSTOM_LEAD.includes(id)),
    ];
  }
  return ["CP-6", "CP-2", "CP-L10", ...(run.pathway === "earnings_update" ? ["CP-1B"] : [])];
}

function catalogueFor(snapshot: Snapshot, folder: string) {
  const matches = snapshot.catalogue.real.filter((entry) => entry.id === folder);
  return matches.length === 1 ? matches[0] : undefined;
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
      return {
        id,
        name: moduleName(id, run.pathway),
        state: moduleState(selected ?? outputs[0]),
        outputs,
      };
    });
  const scope: { folder?: string } = { folder: run.folder };
  return {
    ...scope,
    entries,
    modules,
    lead: leadModules(run, order)
      .map((id) => entries.find((entry) => isLead(entry, id)))
      .find((entry) => entry !== undefined),
    models: runModels(snapshot, routeKey, run),
    catalogue: catalogueFor(snapshot, run.folder),
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

function passageTexts(entry: OutputEntry, heading: string) {
  return passages(entry.sections)
    .filter((section) => section.heading === heading)
    .flatMap(({ blocks }) => blocks)
    .filter((block) => block.type === "text");
}

/**
 * The modules whose bottom line can state or restate the decision: security selection,
 * market-implied risk, evidence validation and the committee. No run records a clearance for that
 * decision, so a summary page shows none of their bottom lines; their own pages do.
 */
const DECISION_MODULES: readonly string[] = ["CP-3", "CP-3D", "CP-5", "CP-6"];

/**
 * One bottom line per module that ran, other than the lead; text is null where there is none to
 * show; `referenced` marks one written but citing a source; `withheld` marks a decision module's,
 * which a summary page does not show.
 */
export function moduleBottomLines(view: ReportView, run: PublishedRun) {
  return overviewModules(run).flatMap((id) => {
    const entry = designated(view, id);
    if (!entry || entry === view.lead) return [];
    if (DECISION_MODULES.includes(id))
      return [
        {
          id,
          name: moduleName(id, run.pathway),
          state: moduleState(entry),
          entry,
          text: null,
          referenced: false,
          withheld: true,
          line: null,
        },
      ];
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
        name: moduleName(id, run.pathway),
        state: moduleState(entry),
        entry,
        text: body && !referenced ? readerText(body, run.pathway) : null,
        referenced,
        withheld: false,
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

/**
 * Each limitation of the run once, in module order; a module that could not assess writes none.
 * A module in `omit` is not read, so a limitation it shares with another module stays with that one.
 */
export function runLimitations(view: ReportView, run: PublishedRun, omit: readonly string[] = []) {
  const seen = new Set<string>();
  return overviewModules(run).flatMap((id) => {
    const entry = designated(view, id);
    if (!entry || blocked(entry) || omit.includes(id)) return [];
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
      return [
        { id, name: moduleName(id, run.pathway), entry, text: readerText(body, run.pathway), line },
      ];
    });
  });
}

type MetricKey =
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

/** Where a Period cell sits in the one period order (`periodKey`, the twin of `period_order` of
 * `credit_os_catalogue.py`), and whether it is a reported period: an actual, a year to date or a
 * last twelve months. A pro forma or a forecast is placed too, and is never a latest reported one. */
export type PeriodPlace = {
  key: readonly number[];
  reported: boolean;
  /** For an actual period, whether the label carries its own date (`2025-06-30`, `FY2024 /
   * 2024-09-30`) or is fiscal-labelled (`FY2025`, `Q3 2025`, `Jun 2025`); null for another class. */
  dated: boolean | null;
};

const REPORTED: ReadonlySet<string> = new Set(["actual", "ytd", "ltm"]);

/** The place of a Period cell; nothing for a label the period rule cannot read. */
export function periodPlace(cell: string): PeriodPlace | undefined {
  const parsed = parsePeriod(cell);
  const key = periodKey(cell);
  if (!parsed || !key) return undefined;
  const dated = parsed.periodClass === "actual" ? parsed.span === "date" : null;
  return { key, reported: REPORTED.has(parsed.periodClass), dated };
}

/** Whether the actual periods among these mix dated and fiscal-labelled ones (`FY2025` beside
 * `2025-06-30`): which is later depends on the year end, so no latest is chosen from them. */
function mixesDatedAndFiscal(places: readonly PeriodPlace[]) {
  const forms = new Set(places.map(({ dated }) => dated));
  return forms.has(true) && forms.has(false);
}

/**
 * The items in period order and the latest reported one among them, chosen as `chart_row` of
 * `credit_os_catalogue.py` chooses it: the last in that order among the actual, year to date and
 * last twelve months periods, whatever order the items are in, never a pro forma or forecast one.
 * Nothing where the builder chooses none: an item with no place (a period that cannot be read, a
 * malformed row), two items with one place, no reported period, or actual periods that mix dated
 * and fiscal-labelled ones (`mixes_dated_and_fiscal` there). A chart still draws those in order.
 */
export function latestReported<T>(
  items: readonly T[],
  place: (item: T) => PeriodPlace | undefined,
): { ordered: T[]; latest: T } | undefined {
  const placed: { item: T; at: PeriodPlace }[] = [];
  for (const item of items) {
    const at = place(item);
    if (!at) return undefined;
    placed.push({ item, at });
  }
  placed.sort((a, b) => comparePeriodKeys(a.at.key, b.at.key));
  const repeats = placed.some(
    ({ at }, index) =>
      index > 0 && comparePeriodKeys(placed[index - 1]?.at.key ?? [], at.key) === 0,
  );
  const latest = placed.filter(({ at }) => at.reported).at(-1);
  if (repeats || !latest || mixesDatedAndFiscal(placed.map(({ at }) => at))) return undefined;
  return { ordered: placed.map(({ item }) => item), latest: latest.item };
}

/** The row of a chart table with the latest reported Period (`latestReported`); a row whose cells
 * do not match the headings has no place. */
function latestRow(table: Table, at: number) {
  return latestReported(table.rows, (row) =>
    row.cells.length === table.headers.length ? periodPlace(row.cells[at] ?? "") : undefined,
  )?.latest;
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
    const source = headlineSource(entry, catalogue, folder, key, where);
    if (source) sources[key] = source;
  }
  return sources;
}

function headlineSource(
  entry: OutputEntry,
  catalogue: CatalogueRun,
  folder: string,
  key: string,
  where: readonly [string, RegExp],
): HeadlineSource | undefined {
  const figure = catalogue.metrics[key];
  const period = stated(figure) ? figure.period : undefined;
  if (stated(figure) && !period) return undefined;
  const found = headlineRow(entry, where, period ?? undefined);
  if (!found) return undefined;
  const href = evidencePath(folder, entry, found.line);
  if (!stated(figure))
    return {
      href,
      period: found.period,
      ...(found.cell.startsWith("Not supplied") ? { reason: found.cell } : {}),
    };
  return found.cell === String(figure.value) ? { href, period: found.period } : undefined;
}

export function traceKey(entry: OutputEntry, line: number) {
  return JSON.stringify([entry.output.run ?? "", entry.output.id, entry.output.sha256, line]);
}
