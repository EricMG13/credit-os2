import { type ReactNode } from "react";
import { ForecastTable } from "./ForecastTable";
import { PathChart } from "@/components/chart/PathChart";
import { ChartTable } from "@/components/chart/ChartTable";
import { TrendChart } from "@/components/chart/TrendChart";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { containsReference, readerText, unitLabel } from "../publishedReport";
import { amount, items, record, stringsIn, ticks, word } from "./visualData";

interface GridColumn {
  label: string;
  group: string;
  start: string;
  end: string;
}

interface GridRow {
  label: string;
  band: string;
  total: boolean;
  cells: Record<string, unknown>[];
}

export interface Grid {
  columns: GridColumn[];
  rows: GridRow[];
}

export function gridOf(raw: unknown): Grid | null {
  const data = record(raw);
  const columns = items(data.columns).map((rawColumn) => {
    const column = record(rawColumn);
    return {
      label: word(column.label),
      group: word(column.group),
      start: word(column.start),
      end: word(column.end),
    };
  });
  if (!columns.length || columns.some((column) => !column.label || !column.group)) return null;
  const rows = items(data.rows).map((rawRow) => {
    const row = record(rawRow);
    return {
      label: word(row.label),
      band: word(row.band),
      total: row.total === true,
      cells: items(row.cells).map(record),
    };
  });
  if (
    !rows.length ||
    rows.some(
      (row) =>
        !row.label ||
        row.cells.length !== columns.length ||
        row.cells.some((cell) => !word(cell.display)),
    )
  )
    return null;
  return { columns, rows };
}

function SelectedForecastTable({
  grid: inputGrid,
  title,
  selectedCase,
  downsideNote,
  limits,
  source,
}: {
  grid: Grid;
  title: string;
  selectedCase?: string;
  downsideNote?: string;
  limits: string[];
  source?: (label: string) => ReactNode;
}) {
  const selectedIndexes = inputGrid.columns.flatMap((column, index) => {
    const caseLabel = forecastCaseLabel(column.group, downsideNote);
    const isScenario = Object.hasOwn(caseLabels, column.group) || caseLabel === selectedCase;
    return !isScenario || selectedCase === undefined || caseLabel === selectedCase ? [index] : [];
  });
  const grid =
    selectedCase === undefined || selectedIndexes.length === 0
      ? inputGrid
      : {
          columns: selectedIndexes
            .map((index) => inputGrid.columns[index])
            .filter((column) => column !== undefined),
          rows: inputGrid.rows.map((row) => ({
            ...row,
            cells: selectedIndexes
              .map((index) => row.cells[index])
              .filter((cell) => cell !== undefined),
          })),
        };
  return <ForecastTable grid={grid} title={title} limits={limits} source={source} />;
}

const FORECAST_LINES = ["Revenue", "Adj EBITDA", "Closing cash", "Closing debt"];

const axisNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });
const smallAxisNumber = new Intl.NumberFormat("en-US", {
  notation: "scientific",
  maximumFractionDigits: 6,
});

/** Plain decimals while the step needs at most 6 decimals; otherwise scientific for all but zero. */
function forecastTicks(values: (number | null)[], zero = false) {
  const plainTicks = ticks(values, zero, (value) => axisNumber.format(value));
  const exact = plainTicks.every(({ value }) => Number(value.toFixed(6)) === value);
  const formatted = exact
    ? plainTicks
    : ticks(values, zero, (value) => (value === 0 ? "0" : smallAxisNumber.format(value)));
  // Close but distinct values must not acquire identical labels through rounding.
  return new Set(formatted.map(({ label }) => label)).size === formatted.length
    ? formatted
    : ticks(values, zero);
}

const caseLabels: Record<string, string> = {
  "Base case": "Base case",
  "Downside case": "Downside case",
  Upside: "Upside case",
  "Downside (CP-2G drivers)": "Downside drivers",
};

function forecastCaseLabel(group: string, downsideNote = "") {
  if (
    group === "Downside case" &&
    downsideNote.startsWith("Downside case is the stress case: a shock applied")
  )
    return "Downside shock";
  return Object.hasOwn(caseLabels, group) ? (caseLabels[group] ?? group) : group;
}

function displayForecastCell(cell: Record<string, unknown> | undefined) {
  if (!cell) return null;
  const display = word(cell.display);
  const reason = word(cell.reason);
  return reason ? `${display} ${reason}` : display || null;
}

function singleForecastRow(grid: Grid, label: string) {
  const matches = grid.rows.filter((entry) => entry.label === label);
  return matches.length === 1 ? matches[0] : undefined;
}

function ForecastTrends({
  grid,
  units,
  source,
  selectedCase,
  downsideNote,
}: {
  grid: Grid;
  units: string;
  source?: (label: string) => ReactNode;
  selectedCase?: string;
  downsideNote?: string;
}) {
  const note = unitLabel(units) || undefined;
  const forecastColumns = grid.columns.flatMap((column, index) =>
    /^FY\d+E$/.test(column.label) ? [{ ...column, index }] : [],
  );
  const periods = [...new Set(forecastColumns.map((column) => column.label))].sort();
  const groups = [...new Set(forecastColumns.map((column) => column.group))].filter(
    (group) =>
      selectedCase === undefined || forecastCaseLabel(group, downsideNote) === selectedCase,
  );
  if (periods.length < 2 || groups.length === 0 || groups.length > 6) return null;
  return (
    <div className="grid gap-8">
      {FORECAST_LINES.map((label) => {
        const row = singleForecastRow(grid, label);
        if (!row) return null;
        const perCase = groups.map((name) => {
          const cells = periods.map((period) => {
            const matches = forecastColumns.filter(
              (column) => column.label === period && column.group === name,
            );
            const index = matches.length === 1 ? matches[0]?.index : undefined;
            return index === undefined ? undefined : row.cells[index];
          });
          return { name, cells };
        });
        const series = perCase.map(({ name, cells }) => ({
          name,
          values: cells.map((cell) => (cell?.status === "value" ? amount(word(cell.exact)) : null)),
        }));
        const values = series.flatMap((entry) => entry.values);
        if (values.filter((value) => value !== null).length < 2) return null;
        return (
          <TrendChart
            title={label}
            actions={source?.(label)}
            key={label}
            periods={periods}
            series={series}
            yTicks={forecastTicks(values)}
            note={note}
            table={perCase.map(({ name, cells }) => ({
              name,
              cells: cells.map(displayForecastCell),
            }))}
          />
        );
      })}
    </div>
  );
}

const CASH_PROXY = "Cash proxy (not issuer free cash flow)";
const twoPlaces = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function cashProxyCases(grid: Grid, other: Grid | null, downsideNote = "") {
  const groups = [grid, other].flatMap((source) => {
    if (!source) return [];
    const rows = source.rows.filter((row) => row.label === CASH_PROXY);
    const row = rows.length === 1 ? rows[0] : undefined;
    if (!row) return [];
    const groups = new Map<string, { period: string; cell?: Record<string, unknown> }[]>();
    source.columns.forEach((column, index) => {
      if (!/^FY\d{4}E$/.test(column.label)) return;
      const cells = groups.get(column.group) ?? [];
      cells.push({ period: column.label, cell: row.cells[index] });
      groups.set(column.group, cells);
    });
    return [...groups];
  });
  const periods = [
    ...new Set(groups.flatMap(([, cells]) => cells.map(({ period }) => period))),
  ].sort();
  const order = Object.keys(caseLabels);
  groups.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
  const byName = new Set(groups.map(([group]) => forecastCaseLabel(group, downsideNote)));
  if (byName.size !== groups.length || groups.length > 6) return { periods, series: [], rows: [] };
  const series = groups.map(([group, cells]) => {
    const matching = periods.map((period) => {
      const selected = cells.filter((cell) => cell.period === period);
      return selected.length === 1 ? selected[0]?.cell : undefined;
    });
    const values = matching.map((cell) =>
      cell?.status === "value" ? amount(word(cell.exact)) : null,
    );
    return {
      name: forecastCaseLabel(group, downsideNote),
      values,
      labels: values.map((value, index) =>
        index === values.length - 1 && value !== null ? twoPlaces.format(value) : null,
      ),
      cells: matching.map((cell, index) => {
        const value = values[index];
        return typeof value === "number" ? twoPlaces.format(value) : word(cell?.reason) || null;
      }),
    };
  });
  return { periods, series, rows: series.map(({ name, cells }) => ({ label: name, cells })) };
}

export function forecastCaseOptions(model: unknown) {
  const cashflow = record(record(model).cashflow);
  const grid = gridOf(cashflow);
  if (!grid) return [];
  const { periods, series } = cashProxyCases(
    grid,
    gridOf(cashflow.other),
    stringsIn(cashflow.notes).find((note) => note.startsWith("Downside case is")),
  );
  const latestPeriod = periods.at(-1);
  return series.map(({ name, values }) => ({
    name,
    period: latestPeriod,
    value: values.at(-1),
    units: word(cashflow.units) || "Units not recorded",
    description: caseDescription(name, stringsIn(cashflow.notes)),
  }));
}

function caseDescription(name: string, notes: string[]) {
  const prefix = name === "Downside shock" ? "Downside case is" : `${name} is`;
  const found = notes.find((note) => note.startsWith(prefix) && !containsReference(note));
  return found && readerText(found);
}

function scopePassages(cashflow: Record<string, unknown>) {
  const notes = stringsIn(cashflow.notes).filter((note) => note.startsWith("Base case is"));
  const limits = stringsIn(cashflow.limits).filter((limit) =>
    /unreviewed|not analytical review|base period|base interest|not comparable|not modelled|standalone|perimeter|machine input.*zero/i.test(
      limit,
    ),
  );
  return [...new Set([...notes, ...limits])].flatMap((passage) =>
    // Keep complete recorded sentences; source-bearing sentences remain in the full record.
    passage
      .split(/(?<=[.!?])\s+(?=[A-Z])/u)
      .filter((sentence) => !containsReference(sentence) && !/\bCP-[A-Z0-9]+\b/u.test(sentence)),
  );
}

export function ForecastScope({
  model,
  source,
}: {
  model: unknown;
  source?: (label: string) => ReactNode;
}) {
  const passages = scopePassages(record(record(model).cashflow));
  return (
    <section
      className="grid gap-3 rounded-ds-md border border-border-hairline bg-surface-subtle p-5"
      aria-label="Model scope and basis"
    >
      <h3 className="font-display text-h3">Model scope and basis</h3>
      <p className="text-small text-text-tertiary">
        Selected qualifications from the recorded model. Full notes and limitations follow the model
        tables.
      </p>
      {passages.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {passages.map((passage, index) => (
            <div key={index} className={TRACE_HOST}>
              <p className="max-w-prose pr-12 text-small text-text-secondary sm:pr-8">{passage}</p>
              <div className="absolute right-0 top-0">
                {source?.(`Model scope qualification ${String(index + 1)}`)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-small text-text-secondary">
          No qualifications are available in this summary. Review the full model notes and
          assumptions before interpreting the cases.
        </p>
      )}
    </section>
  );
}

export function CashProxy({
  model,
  note,
  source,
  selectedCase,
}: {
  model: unknown;
  note?: ReactNode;
  source?: ReactNode;
  selectedCase?: string;
}) {
  const raw = record(record(model).cashflow);
  const grid = gridOf(raw);
  if (!grid) return null;
  const { periods, series } = cashProxyCases(
    grid,
    gridOf(raw.other),
    stringsIn(raw.notes).find((note) => note.startsWith("Downside case is")),
  );
  const rows = series.map(({ name, cells }) => ({ label: name, cells }));
  const values = series.flatMap((item) => item.values);
  if (periods.length < 2 || series.length === 0) return null;
  const table = { head: ["Case", ...periods], rows };
  const unit = word(raw.units);
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[1.65fr_1fr]">
      <div className="min-w-0 rounded-xl border border-border-hairline bg-surface-card p-5">
        <PathChart
          title="Cash proxy by scenario"
          actions={source}
          subtitle={unit}
          periods={periods}
          series={series}
          emphasis={series.some((item) => item.name === selectedCase) ? selectedCase : undefined}
          yTicks={forecastTicks(values, true)}
          table={table}
        />
      </div>
      <div className="grid min-w-0 content-start gap-4">
        <section className="grid min-w-0 gap-3 rounded-xl border border-border-hairline bg-surface-card p-5">
          <h3 className="font-display text-h4">Scenario comparison</h3>
          <ChartTable
            caption="Scenario comparison"
            head={table.head}
            rows={series.map(({ name, cells }) => ({
              label: name,
              cells,
              current: name === selectedCase,
              end: source,
            }))}
            endHeading={source ? "Source" : undefined}
          />
        </section>
        {note}
      </div>
    </div>
  );
}

export function LegacyForecast({
  model,
  summary,
  source,
  selectedCase,
}: {
  model?: unknown;
  summary?: ReactNode;
  source?: (label: string) => ReactNode;
  selectedCase?: string;
}) {
  const published = record(model);
  const cashflow = record(published.cashflow);
  const grid = gridOf(cashflow);
  const other = gridOf(cashflow.other);
  const notes = stringsIn(cashflow.notes);
  const limits = stringsIn(cashflow.limits);
  const units = word(cashflow.units);
  if (model === null || model === undefined) return null;
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-h3">Cash flow model</h3>
        {source?.("Cash flow model")}
      </div>
      {grid === null ? (
        <p>This model has no readable calculation record.</p>
      ) : (
        <>
          <p className="text-text-secondary">{unitLabel(units) || "Units not recorded"}</p>
          {summary}
          <ForecastTrends
            grid={grid}
            units={units}
            source={source}
            selectedCase={selectedCase}
            downsideNote={notes.find((note) => note.startsWith("Downside case is"))}
          />
          <SelectedForecastTable
            limits={limits}
            source={source}
            grid={grid}
            title="Cash flow model"
            selectedCase={selectedCase}
            downsideNote={notes.find((note) => note.startsWith("Downside case is"))}
          />
          {other && (
            <SelectedForecastTable
              limits={limits}
              source={source}
              grid={other}
              title="Other forecast cases"
              selectedCase={selectedCase}
              downsideNote={notes.find((note) => note.startsWith("Downside case is"))}
            />
          )}
          {notes.length > 0 && (
            <ul className="list-disc pl-5">
              {notes.map((note, index) => (
                <li key={index}>{readerText(note)}</li>
              ))}
            </ul>
          )}
          {limits.length > 0 && (
            <section className="grid gap-2">
              <h4 className="font-display text-h4">Model limitations</h4>
              <ul className="list-disc pl-5">
                {limits.map((limit, index) => (
                  <li key={index}>{readerText(limit)}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  );
}
