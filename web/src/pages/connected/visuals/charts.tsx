import type { ReactNode } from "react";
import { BulletChart } from "@/components/chart/BulletChart";
import { ColumnsChart } from "@/components/chart/ColumnsChart";
import { DumbbellChart } from "@/components/chart/DumbbellChart";
import { RangeStripChart } from "@/components/chart/RangeStripChart";
import { ScatterPlot } from "@/components/chart/ScatterPlot";
import { StackChart } from "@/components/chart/StackChart";
import { TrendChart } from "@/components/chart/TrendChart";
import { WaterfallChart, type WaterfallStep } from "@/components/chart/WaterfallChart";
import {
  amount,
  bounds,
  cellAmount,
  chartTable,
  distinct,
  items,
  rangeTicks,
  ticks,
  word,
  type SourceTable,
} from "./visualData";

export interface Frame {
  title: string;
  note?: string;
  actions?: ReactNode;
  /** The title's heading level; h4 unless the figure sits directly under an h2. */
  as?: "h3" | "h4";
}

type Descriptor = Record<string, unknown>;

function indices(table: SourceTable, values: unknown[]): number[] | null {
  const result: number[] = [];
  for (const index of values) {
    if (
      typeof index !== "number" ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= table.headers.length - 2
    )
      return null;
    result.push(index);
  }
  return result;
}

/** The numbers of cells that state one measure in one unit, each read with the others. */
function scopeAmounts(cells: string[], unit?: string) {
  return cells.map((cell) => cellAmount(cell, cells, unit));
}

/** One column's numbers: a period series, a bridge, a yield curve or a recovery column. */
function columnAmounts(table: SourceTable, column: number) {
  const cells = table.rows.map((row) => row[column] ?? "");
  return cells.map((cell, index) => cellAmount(cell, cells, table.rows[index]?.at(-2)));
}

/** One row's numbers in `columns`: a bullet, range or paired row has its own measure and unit. */
function rowAmounts(row: string[], columns: number[]) {
  return scopeAmounts(
    columns.map((column) => row[column] ?? ""),
    row.at(-2),
  );
}

function chartCells(table: SourceTable, columns: number[]) {
  return columns.every((index) =>
    table.rows.every((row) => {
      const cell = row[index] ?? "";
      return amount(cell, row.at(-2)) !== null || /^Not supplied:\s*\S/.test(cell);
    }),
  );
}

function unitsMatch(table: SourceTable, unit: string, columns: number[]) {
  return (
    Boolean(unit) &&
    table.rows.every((row) =>
      columns.every(
        (column) => amount(row[column] ?? "", row.at(-2)) === null || row.at(-2) === unit,
      ),
    )
  );
}

function periods(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const columns = indices(table, items(descriptor.columns));
  if (
    table.headers[0] !== "Period" ||
    !columns?.length ||
    columns.includes(0) ||
    !chartCells(table, columns) ||
    !unitsMatch(table, word(descriptor.unit), columns)
  )
    return null;
  const groups = table.rows.map((row) => row[0] ?? "");
  const series = columns.map((column) => {
    const values = columnAmounts(table, column);
    return {
      name: table.headers[column] ?? "",
      values,
      labels: table.rows.map((row, i) => (values[i] === null ? null : (row[column] ?? null))),
    };
  });
  const values = series.flatMap((entry) => entry.values);
  if (
    !distinct(groups) ||
    !distinct(series.map((entry) => entry.name)) ||
    values.every((value) => value === null)
  )
    return null;
  return (
    <TrendChart
      {...frame}
      periods={groups}
      series={series}
      yTicks={ticks(values, true)}
      table={series.map((entry, at) => ({
        name: entry.name,
        cells: table.rows.map((row) => row[columns[at] ?? 0] || null),
      }))}
      detailTable={chartTable(table)}
    />
  );
}

function waterfall(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const column = indices(table, [descriptor.amount])?.[0];
  if (
    column === undefined ||
    table.headers[0] !== "Step" ||
    table.rows.length < 2 ||
    !unitsMatch(table, word(descriptor.unit), [column])
  )
    return null;
  const labels = table.rows.map((row) => row[0] ?? "");
  if (!distinct(labels)) return null;
  const steps: WaterfallStep[] = [];
  const amounts = columnAmounts(table, column);
  let running = 0;
  for (const [index, row] of table.rows.entries()) {
    const text = row[column] ?? "";
    const value = amounts[index] ?? null;
    const label = labels[index] ?? "";
    if (value === null) return null;
    const last = index === table.rows.length - 1;
    const total = index === 0 || last;
    const from = total ? 0 : running;
    const to = total ? value : running + value;
    if (
      !Number.isFinite(to) ||
      to < 0 ||
      (last &&
        Math.abs(running - value) >
          Number.EPSILON * Math.max(Math.abs(value), Math.abs(running), 1) * table.rows.length)
    )
      return null;
    steps.push({ label, kind: total ? "total" : value < 0 ? "down" : "up", from, to, text });
    running = to;
  }
  return (
    <WaterfallChart
      {...frame}
      steps={steps}
      yTicks={ticks(
        [0, ...steps.flatMap((step) => (step.kind === "missing" ? [] : [step.from, step.to]))],
        true,
      )}
      legend={{ total: "Total", up: "Increase", down: "Decrease" }}
      table={chartTable(table)}
    />
  );
}

function paired(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const slots = indices(table, [
    descriptor.label,
    ...items(descriptor.periods),
    descriptor.prior,
    descriptor.current,
  ]);
  if (slots?.length !== 5) return null;
  const [label = 0, priorPeriod = 1, currentPeriod = 3, prior = 2, current = 4] = slots;
  if (!chartCells(table, [prior, current])) return null;
  const labels = table.rows.map((row) => row[label] ?? "");
  if (!distinct(labels)) return null;
  const earlier = table.rows[0]?.[priorPeriod] ?? "";
  const later = table.rows[0]?.[currentPeriod] ?? "";
  const samePeriods =
    earlier !== later &&
    [earlier, later].every((item) => item && !item.startsWith("Not supplied:")) &&
    table.rows.every((row) => row[priorPeriod] === earlier && row[currentPeriod] === later);
  const names: [string, string] = samePeriods
    ? [earlier, later]
    : [table.headers[prior] ?? "", table.headers[current] ?? ""];
  if (!distinct(names)) return null;
  const pairs = table.rows.map((row) => rowAmounts(row, [prior, current]));
  const values = pairs.flat();
  if (values.every((value) => value === null)) return null;
  const sharedUnit = unitsMatch(table, word(descriptor.unit), [prior, current]);
  if (
    descriptor.kind === "dumbbell" &&
    sharedUnit &&
    table.rows.every(
      (row) => amount(row[prior] ?? "") !== null || amount(row[current] ?? "") !== null,
    )
  ) {
    return (
      <DumbbellChart
        {...frame}
        names={names}
        axis={bounds(values)}
        rows={table.rows.map((row, i) => ({
          label: labels[i] ?? "",
          from: pairs[i]?.[0] ?? null,
          to: pairs[i]?.[1] ?? null,
          text: `${row[priorPeriod] ?? ""} ${row[prior] ?? ""} → ${row[currentPeriod] ?? ""} ${row[current] ?? ""}`,
        }))}
        table={chartTable(table)}
      />
    );
  }
  if (!sharedUnit || !samePeriods || values.some((value) => value !== null && value < 0))
    return null;
  const series = [prior, current].map((column, at) => {
    const cells = table.rows.map((row) => row[column] ?? "");
    const positions = pairs.map((pair) => pair[at] ?? null);
    return {
      name: names[at] ?? "",
      values: positions,
      labels: cells.map((text, index) => (positions[index] === null ? null : text)),
    };
  });
  return (
    <ColumnsChart
      {...frame}
      groups={labels}
      series={series}
      yTicks={ticks(values, true)}
      table={{
        head: [table.headers[label] ?? "", ...names],
        rows: table.rows.map((row, at) => ({
          label: labels[at] ?? "",
          cells: [row[prior] || null, row[current] || null],
        })),
      }}
      detailTable={chartTable(table)}
    />
  );
}

function range(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const slots = indices(table, [
    descriptor.label,
    descriptor.issuer,
    descriptor.low,
    descriptor.median,
    descriptor.high,
  ]);
  if (slots === null) return null;
  const [label = 0, issuer = 1, low = 2, median = 3, high = 4] = slots;
  const amounts = table.rows.map((row) => rowAmounts(row, [issuer, low, median, high]));
  if (
    !chartCells(table, [issuer, low, median, high]) ||
    amounts.flat().every((value) => value === null) ||
    !distinct(table.rows.map((row) => row[label] ?? ""))
  )
    return null;
  return (
    <RangeStripChart
      {...frame}
      rangeLabel={`${table.headers[low] ?? ""} to ${table.headers[high] ?? ""}`}
      emphasised={0}
      rows={table.rows.map((row, at) => {
        const [issuerValue = null, lower = null, medianValue = null, upper = null] =
          amounts[at] ?? [];
        const marker = (i: number, value: number | null) => ({
          name: table.headers[i] ?? "",
          value,
          text: value === null ? null : (row[i] ?? null),
        });
        const markers = [marker(issuer, issuerValue), marker(median, medianValue)];
        return {
          label: row[label] ?? "",
          rangeText: `${row[low] ?? ""} to ${row[high] ?? ""} · ${row.at(-2) ?? ""}`,
          range:
            lower === null || upper === null || lower > upper ? null : { low: lower, high: upper },
          markers,
          axis: bounds([lower, upper, issuerValue, medianValue]),
        };
      })}
      table={chartTable(table)}
    />
  );
}

function maturityDate(text: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = Date.parse(text);
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === text ? date : null;
}

function scatter(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const slots = indices(table, [descriptor.label, descriptor.date, descriptor.yield]);
  if (slots === null) return null;
  const [label = 0, date = 1, yieldAt = 2] = slots;
  if (!chartCells(table, [yieldAt]) || !unitsMatch(table, word(descriptor.unit), [yieldAt]))
    return null;
  const yields = columnAmounts(table, yieldAt);
  const points = table.rows.map((row, at) => {
    const x = maturityDate(row[date] ?? "");
    const y = yields[at] ?? null;
    return {
      name: row[label] ?? "",
      x,
      y,
      xText: x === null ? null : (row[date] ?? null),
      yText: y === null ? null : (row[yieldAt] ?? null),
    };
  });
  if (
    !distinct(points.map((point) => point.name)) ||
    !points.some((point) => point.x !== null && point.y !== null)
  )
    return null;
  const xTitle = table.headers[date] ?? "";
  const yTitle = table.headers[yieldAt] ?? "";
  const allDates = points.map((point) => point.x);
  const dateTicks =
    new Set(allDates).size === 1 && allDates[0] != null
      ? [allDates[0] - 86_400_000, allDates[0], allDates[0] + 86_400_000]
      : rangeTicks(allDates).map((tick) => tick.value);
  return (
    <ScatterPlot
      {...frame}
      points={points}
      othersName={table.headers[label] ?? ""}
      x={{
        title: xTitle,
        short: xTitle,
        ticks: dateTicks.map((value) => ({
          value,
          label: new Date(value).toISOString().slice(0, 10),
        })),
      }}
      y={{ title: yTitle, short: yTitle, ticks: rangeTicks(points.map((point) => point.y)) }}
      table={{
        head: [table.headers[label] ?? "", xTitle, yTitle],
        rows: points.map(({ name, xText, yText }) => ({ label: name, cells: [xText, yText] })),
      }}
      detailTable={chartTable(table)}
    />
  );
}

function stack(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const slots = indices(table, [descriptor.label, descriptor.amount]);
  if (slots === null) return null;
  const [label = 0, column = 3] = slots;
  if (!chartCells(table, [column]) || !unitsMatch(table, word(descriptor.unit), [column]))
    return null;
  // Every facility is a part, in rank order. One without a balance above zero is a legend row and
  // draws no segment, so the key names each colour and every facility left out of the plot.
  const values = columnAmounts(table, column);
  const parts = table.rows.map((row, i) => ({
    name: row[label] ?? "",
    value: values[i] ?? null,
    text: row[column] ?? "",
  }));
  if (
    !distinct(parts.map((part) => part.name)) ||
    parts.some((part) => (part.value ?? 0) < 0) ||
    !parts.some((part) => (part.value ?? 0) > 0)
  )
    return null;
  return (
    <StackChart
      {...frame}
      parts={parts}
      table={chartTable(table, [label, column])}
      detailTable={chartTable(table)}
    />
  );
}

function bullet(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const labels = indices(table, items(descriptor.label));
  const slots = indices(table, [descriptor.current, descriptor.threshold, descriptor.direction]);
  if (!labels?.length || slots === null) return null;
  const [current = 2, threshold = 1, direction = 4] = slots;
  if (!chartCells(table, [current, threshold])) return null;
  const rows = table.rows.map((row) => {
    const [value = null, target = null] = rowAmounts(row, [current, threshold]);
    const unit = row.at(-2) ?? "";
    const label = labels.map((index) => row[index] ?? "").join(" · ");
    return {
      label,
      value,
      target,
      axisMin: Math.min(0, value ?? 0, target ?? 0),
      axisMax: Math.max(0, value ?? 0, target ?? 0) || 1,
      sub: `${row[direction] ?? ""} ${row[threshold] ?? ""} ${unit}`,
      text: value === null ? null : (row[current] ?? null),
    };
  });
  if (rows.every((row) => row.target === null) || !distinct(rows.map((row) => row.label)))
    return null;
  const source = chartTable(table);
  return (
    <BulletChart
      {...frame}
      rows={rows}
      table={{
        ...source,
        rows: source.rows.map((row, index) => ({ ...row, label: rows[index]?.label ?? row.label })),
      }}
    />
  );
}

function recovery(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  const slots = indices(table, [descriptor.label, descriptor.scenario, descriptor.recovery]);
  if (slots === null) return null;
  const [label = 0, scenario = 1, column = 3] = slots;
  if (!chartCells(table, [column]) || !unitsMatch(table, word(descriptor.unit), [column]))
    return null;
  const groups = [...new Set(table.rows.map((row) => row[label] ?? ""))];
  const names = [...new Set(table.rows.map((row) => row[scenario] ?? ""))];
  const sourceRows = new Map(groups.map((group) => [group, new Map<string, string[]>()]));
  for (const row of table.rows) {
    const byScenario = sourceRows.get(row[label] ?? "");
    const name = row[scenario] ?? "";
    if (byScenario?.has(name)) return null;
    byScenario?.set(name, row);
  }
  const scope = table.rows.map((row) => row[column] ?? "");
  const series = names.map((name) => {
    const found = groups.map((group) => sourceRows.get(group)?.get(name));
    const texts = found.map((row) => row?.[column] ?? "");
    const values = found.map((row) =>
      row === undefined ? null : cellAmount(row[column] ?? "", scope),
    );
    return { name, values, labels: texts.map((value, i) => (values[i] === null ? null : value)) };
  });
  const values = series.flatMap((entry) => entry.values);
  if (
    !distinct(groups) ||
    !distinct(names) ||
    values.every((value) => value === null) ||
    values.some((value) => value !== null && value < 0)
  )
    return null;
  return (
    <ColumnsChart
      {...frame}
      groups={groups}
      series={series}
      yTicks={ticks(values, true)}
      table={{
        head: [table.headers[label] ?? "", ...names],
        rows: groups.map((group) => ({
          label: group,
          cells: names.map((name) => sourceRows.get(group)?.get(name)?.[column] || null),
        })),
      }}
      detailTable={chartTable(table)}
    />
  );
}

export function publishedChart(table: SourceTable, descriptor: Descriptor, frame: Frame) {
  if (table.headers.at(-2) !== "Reporting unit" || table.headers.at(-1) !== "Basis and limitation")
    return null;
  switch (descriptor.kind) {
    case undefined:
      return periods(table, descriptor, frame);
    case "waterfall":
      return waterfall(table, descriptor, frame);
    case "grouped":
    case "dumbbell":
      return paired(table, descriptor, frame);
    case "limits":
      // Numeric roles alone do not attest the mandate, exposure date or NAV basis.
      return null;
    case "range":
      return range(table, descriptor, frame);
    case "scatter":
      return scatter(table, descriptor, frame);
    case "stack":
      return stack(table, descriptor, frame);
    case "bullet":
      return bullet(table, descriptor, frame);
    case "recovery":
      return recovery(table, descriptor, frame);
    default:
      return null;
  }
}
