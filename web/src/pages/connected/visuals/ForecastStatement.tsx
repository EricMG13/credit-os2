import { useState } from "react";
import { Segmented } from "@/components/kit/Segmented";
import { readerText } from "../publishedReport";
import type { ForecastSelection, ForecastSource } from "../report/ForecastRecord";
import {
  ForecastGrid,
  GridQualifications,
  type GridColumn,
  type GridRow,
  type KeyRows,
} from "./ForecastGrid";
import { forecastCaseNames, gridOf, type CaseNames, type Grid } from "./LegacyForecast";
import { record, stringsIn, word } from "./visualData";
import { analyzeScenarioPeriods, scenarioComparisonNotice } from "./scenarioPeriods";

const families = {
  accounts: "Accounts",
  ratios: "Ratios",
  growth: "Growth rates",
  other: "Other lines",
} as const;
type Family = keyof typeof families;
type View = "selected" | "all" | "compare" | "history";

function familyOf(row: Grid["rows"][number]): Family {
  const growth = /\b(?:YoY |annual )?growth$/i.test(row.label);
  if (row.kind === "money") return "accounts";
  if (row.kind === "multiple") return "ratios";
  if (row.kind === "percent") return growth ? "growth" : "ratios";
  // Early publications lack kind. Use the historic row definitions and stated cell units.
  if (growth) return "growth";
  if (row.band === "Credit metrics" || / margin$/i.test(row.label)) return "ratios";
  const values = row.cells.filter((cell) => cell.status === "value");
  if (values.length && values.every((cell) => /[%x]$/.test(word(cell.display)))) return "ratios";
  if (!row.kind) return "accounts";
  return "other";
}

function joinCases(main: Grid, other: Grid | null): Grid | null {
  if (!other) return main;
  if (
    main.rows.length !== other.rows.length ||
    main.rows.some((row, index) => {
      const peer = other.rows[index];
      return !peer || row.label !== peer.label || row.band !== peer.band || row.kind !== peer.kind;
    })
  )
    return null;
  return {
    columns: [...main.columns, ...other.columns],
    rows: main.rows.map((row, index) => ({
      ...row,
      cells: [...row.cells, ...(other.rows[index]?.cells ?? [])],
    })),
  };
}

function statementColumns(
  grid: Grid,
  selectedCase: string | undefined,
  selectedRawGroup: string | undefined,
  caseNames: CaseNames,
) {
  return grid.columns.map((column, index) => ({
    ...column,
    index,
    rawGroup: column.group,
    group: caseNames.get(column.group) ?? column.group,
    forecast:
      /^FY\d{4}E\b/u.test(column.label) ||
      /^(?:Base case|Downside\b|Upside\b)/u.test(column.group) ||
      (selectedRawGroup !== undefined
        ? column.group === selectedRawGroup
        : selectedCase !== undefined && column.group === selectedCase),
  }));
}

type StatementColumn = ReturnType<typeof statementColumns>[number];
/** A column the grid draws: one of the grid's own, or a case that publishes no column for the
 * compared year (`source` null). */
type ShownColumn = GridColumn & { source: StatementColumn | null; missing?: string };

const ACTUAL_YEAR = /^FY(\d{4})A?$/u;
const INTEREST_ROW = /^(?:Interest|Interest coverage(?: \(.*\))?)$/i;
const NOT_PUBLISHED = "Not published";
/** The rows a long statement opens on: the rows the model marks `total`, and the exact rows the
 * page's own measure reading charts above (net leverage, interest cover, accessible liquidity),
 * matched by row identity, never by a word in a label. */
function keyRowsOf(charted: readonly string[]): KeyRows {
  return {
    matches: (row) => row.total || charted.includes(row.label),
    description: "Totals and the leverage, cover and liquidity rows read above",
  };
}

function shownOf(column: StatementColumn, band: string, label = column.label): ShownColumn {
  const title = column.start && column.end ? `${column.start} to ${column.end}` : undefined;
  return { label, band, title, source: column };
}

/** The latest actual fiscal year the grid publishes, which leads the selected case's years. */
function latestActual(history: StatementColumn[]) {
  let latest: { column: StatementColumn; year: string } | undefined;
  for (const column of history) {
    const year = ACTUAL_YEAR.exec(column.label)?.[1];
    if (year && (!latest || year >= latest.year)) latest = { column, year };
  }
  return latest ? [latest.column] : [];
}

type Kept = ReturnType<typeof analyzeScenarioPeriods>["periods"];

/**
 * Each shown case's own forecast columns, with a "Not published" column for every year kept for
 * the comparison that another case publishes and this one does not: a year a case does not
 * publish is said, never left to be inferred from a missing column.
 */
function caseColumns(lead: StatementColumn[], kept: Kept) {
  const cases = [...new Map(lead.map((column) => [column.rawGroup, column])).values()];
  return cases.flatMap((member) => {
    const band = `Forecast · ${readerText(member.group)}`;
    const own = lead.filter(({ rawGroup }) => rawGroup === member.rawGroup);
    // A forecast year inside the case's own span that it publishes no column for.
    const years = own.flatMap(({ label }) => {
      const year = /^FY(\d{4})E$/u.exec(label)?.[1];
      return year ? [Number(year)] : [];
    });
    const inSpan = years.length
      ? Array.from(
          { length: Math.max(...years) - Math.min(...years) + 1 },
          (_, at) => `FY${String(Math.min(...years) + at)}E`,
        ).map((period) => ({ period, groups: [] as string[] }))
      : [];
    const absent = [...kept, ...inSpan]
      .filter(
        ({ period, groups }, at, all) =>
          !groups.includes(member.rawGroup) &&
          !own.some(({ label }) => label === period) &&
          all.findIndex((other) => other.period === period) === at,
      )
      .map(({ period }): ShownColumn => ({
        label: period,
        band,
        source: null,
        missing: `This case publishes no ${period} column.`,
      }));
    return [...own.map((column) => shownOf(column, band)), ...absent].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  });
}

function selectedView(
  selected: StatementColumn[],
  projections: StatementColumn[],
  history: StatementColumn[],
) {
  const lead = selected.length ? selected : projections;
  if (!lead.length) return history.map((column) => shownOf(column, readerText(column.group)));
  return [
    ...latestActual(history).map((column) => shownOf(column, "Actual")),
    ...caseColumns(lead, []),
  ];
}

/** One column per case for one year; a case with no column for it reads "Not published". */
function compareView(projections: StatementColumn[], period: string) {
  const band = `Forecast · ${period}`;
  const cases = [...new Map(projections.map((column) => [column.rawGroup, column])).values()];
  return cases.map((member): ShownColumn => {
    const column = projections.find(
      ({ rawGroup, label }) => rawGroup === member.rawGroup && label === period,
    );
    return column
      ? shownOf(column, band, readerText(column.group))
      : { label: readerText(member.group), band, source: null };
  });
}

function displayedColumns(
  grid: Grid,
  selectedCase: string | undefined,
  selectedRawGroup: string | undefined,
  caseNames: CaseNames,
  requestedView: View,
  requestedPeriod: string,
) {
  const columns = statementColumns(grid, selectedCase, selectedRawGroup, caseNames);
  const projections = columns.filter(({ forecast }) => forecast);
  const history = columns.filter(({ forecast }) => !forecast);
  // The raw group, where the caller resolved it, identifies the case; two can share a name.
  const selected = projections.filter(({ group, rawGroup }) =>
    selectedRawGroup !== undefined ? rawGroup === selectedRawGroup : group === selectedCase,
  );
  const comparison = analyzeScenarioPeriods(
    projections.map(({ label, rawGroup, start, end }) => ({
      period: label,
      group: rawGroup,
      start,
      end,
    })),
  );
  // A period only one case publishes is not a comparison.
  const periods = comparison.periods
    .filter(({ groups }) => groups.length > 1)
    .map(({ period }) => period);
  const period = periods.includes(requestedPeriod) ? requestedPeriod : periods.at(-1);
  const views = new Map<View, ShownColumn[]>([
    ["selected", selectedView(selected, projections, history)],
  ]);
  // Every case over the years kept for the comparison, a year a case does not publish said so;
  // with no year in common nothing is compared, so no year is said to be missing either.
  const cases = new Set(projections.map(({ rawGroup }) => rawGroup));
  if (cases.size > 1 && !comparison.noSharedPeriod)
    views.set("all", caseColumns(projections, comparison.periods));
  if (period !== undefined) views.set("compare", compareView(projections, period));
  if (history.length)
    views.set(
      "history",
      history.map((c) => shownOf(c, readerText(c.group))),
    );
  const view = views.has(requestedView) ? requestedView : "selected";
  const shown = views.get(view) ?? [];
  return {
    canShowAll: views.has("all"),
    hasSelected: selected.length > 0,
    hasProjections: projections.length > 0,
    hasHistory: history.length > 0,
    periods,
    period,
    canCompare: period !== undefined,
    comparison,
    notice: scenarioComparisonNotice(comparison),
    view,
    shown,
  };
}

const unique = (values: string[]) => [...new Set(values)];

/** What every trace in the grid covers: exactly the columns shown, by raw group and period, and
 * the compared year's recorded span only when one year is compared. */
function gridSelection({
  view,
  shown,
  period,
  comparison,
}: ReturnType<typeof displayedColumns>): ForecastSelection {
  const visible = shown.flatMap(({ source }) => (source ? [source] : []));
  const groups = unique(visible.map(({ group }) => group));
  const cases = unique(visible.filter(({ forecast }) => forecast).map(({ group }) => group));
  const basis =
    view === "compare"
      ? comparison.periods.find((candidate) => candidate.period === period)
      : undefined;
  return {
    // The band names one case where the forecast columns are one case's, actual year or not.
    case: cases.length === 1 ? cases[0] : groups.length === 1 ? groups[0] : "",
    groups,
    rawGroups: unique(visible.map(({ rawGroup }) => rawGroup)),
    periods: basis ? [basis.period] : unique(visible.map(({ label }) => label)),
    periodStart: basis?.start || undefined,
    periodEnd: basis?.end || undefined,
  };
}

function gridRows(grid: Grid, shown: ShownColumn[], period: string | undefined): GridRow[] {
  const unpublished = {
    status: "absent",
    display: NOT_PUBLISHED,
    reason: `This case publishes no ${period ?? ""} column.`,
  };
  return grid.rows.map((row) => ({
    label: row.label,
    band: row.band,
    total: row.total,
    family: families[familyOf(row)],
    cells: shown.map(({ source, missing }) =>
      source
        ? (row.cells[source.index] ?? {})
        : missing
          ? { ...unpublished, reason: missing }
          : unpublished,
    ),
  }));
}

function ColumnControls({
  facts,
  setView,
  setPeriod,
}: {
  facts: ReturnType<typeof displayedColumns>;
  setView: (view: View) => void;
  setPeriod: (period: string) => void;
}) {
  const { view, period, periods, hasSelected, hasProjections, hasHistory, canCompare, canShowAll } =
    facts;
  const segments = [
    {
      key: "selected",
      label: hasSelected
        ? "Selected case"
        : hasProjections
          ? "Forecast periods"
          : "Recorded periods",
    },
    ...(canShowAll ? [{ key: "all", label: "All cases" }] : []),
    ...(canCompare ? [{ key: "compare", label: "Compare one year" }] : []),
    ...(hasHistory && hasProjections ? [{ key: "history", label: "History" }] : []),
  ];
  return (
    <>
      {segments.length > 1 && (
        <Segmented
          label="Grid columns"
          segments={segments}
          current={view}
          onSelect={(key) => {
            setView(key as View);
          }}
        />
      )}
      {view === "compare" && period !== undefined && (
        <Segmented
          label="Year"
          segments={periods.map((key) => ({ key, label: key }))}
          current={period}
          onSelect={setPeriod}
        />
      )}
    </>
  );
}

function StatementView({
  grid,
  name,
  heading,
  selectedCase,
  selectedRawGroup,
  caseNames,
  limits,
  source,
  keyRows,
}: {
  keyRows: KeyRows;
  grid: Grid;
  name: string;
  /** A visible heading, only where the grid is not the tile's own. */
  heading?: string;
  selectedCase?: string;
  selectedRawGroup?: string;
  caseNames: CaseNames;
  limits: string[];
  source?: ForecastSource;
}) {
  const [requestedView, setView] = useState<View>("selected");
  const [requestedPeriod, setPeriod] = useState("");
  const facts = displayedColumns(
    grid,
    selectedCase,
    selectedRawGroup,
    caseNames,
    requestedView,
    requestedPeriod,
  );
  const selection = gridSelection(facts);
  const trace =
    source &&
    ((label: string, extra: ForecastSelection) => source(label, { ...selection, ...extra }));
  // The recorded interest basis qualifies the interest rows; it is drawn once, under the grid.
  const interest = grid.rows.some(({ label }) => INTEREST_ROW.test(label))
    ? unique(limits.filter((text) => /^Base interest\b/i.test(text)))
    : [];
  const qualification = "Interest basis qualification";
  return (
    <div className="grid min-w-0 content-start gap-3">
      {heading && <h3 className="text-small font-semibold">{heading}</h3>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ColumnControls facts={facts} setView={setView} setPeriod={setPeriod} />
      </div>
      {facts.notice && (
        <p role="status" className="text-small text-text-secondary">
          {facts.notice}
        </p>
      )}
      <ForecastGrid
        name={name}
        columns={facts.shown}
        rows={gridRows(grid, facts.shown, facts.period)}
        gapNotes={{ [NOT_PUBLISHED]: "the case publishes no column for this year." }}
        keyRows={keyRows}
        source={trace && ((row) => trace(row, { row }))}
      />
      <GridQualifications
        items={interest.map((text) => ({
          label: qualification,
          text,
          trace: trace?.(qualification, { recordedQualification: text }),
        }))}
      />
    </div>
  );
}

export function ForecastStatement({
  model,
  selectedCase,
  selectedRawGroup,
  source,
  chartedRows = [],
}: {
  model: unknown;
  /** The exact rows the page charts above the grid, by their labels as the model writes them. */
  chartedRows?: readonly string[];
  selectedCase?: string;
  /** The selected case's raw group, where the caller knows it: it decides the match. */
  selectedRawGroup?: string;
  source?: ForecastSource;
}) {
  const cashflow = record(record(model).cashflow);
  const main = gridOf(cashflow);
  const other = gridOf(cashflow.other);
  if (!main) return <p>This model has no readable calculation record.</p>;
  const grid = joinCases(main, other);
  const props = {
    selectedCase,
    selectedRawGroup,
    // The model's one case naming, whether its grids are drawn joined or as two statements.
    caseNames: forecastCaseNames(cashflow),
    limits: stringsIn(cashflow.limits),
    source,
    keyRows: keyRowsOf(chartedRows),
  };
  return (
    <div className="grid min-w-0 gap-5">
      <StatementView grid={grid ?? main} name="Forecast grid" {...props} />
      {!grid && other && (
        <StatementView
          grid={other}
          name="Other forecast cases"
          heading="Other forecast cases"
          {...props}
        />
      )}
    </div>
  );
}
