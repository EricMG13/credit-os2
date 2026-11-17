import {
  checkDistinctSeries,
  seriesKey as keyOf,
  checkLabeledSeriesLength,
  periodSeriesData,
} from "./seriesData";
import { Fragment, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  XAxis,
  type TooltipContentProps,
  type XAxisTickContentProps,
} from "recharts";
import { type TableCell, type TableRowData } from "./ChartTable";
import { ChartWithTable } from "./ChartWithTable";
import { SeriesLine } from "./SeriesLine";
import { assignSeries, spread } from "./series";
import { BASELINE, HEIGHT, Legend, TICK, YAxisLabels, type YTick } from "./TrendChart";

interface PathSeries {
  name: string;
  values: (number | null)[];
  /** The exact text drawn at each point; null draws none. */
  labels: (string | null)[];
}

interface PathChartProps {
  title: string;
  as?: "h3" | "h4";
  note?: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Oldest first: the x-axis. */
  periods: string[];
  series: PathSeries[];
  /**
   * A dashed vertical line with its label: "on" draws it at the period's point, "after" at the
   * boundary between that period and the next.
   */
  divider?: { period: string; at: "on" | "after"; label: string };
  yTicks: YTick[];
  /**
   * Draws every series named at its last point, this one in full colour and a heavier line and the
   * rest in the neutral series colour.
   */
  emphasis?: string;
  table: { head: string[]; rows: TableRowData[]; endHeading?: string };
}

const TEXT_FILL = "var(--color-text-secondary)";
const NA_FILL = "var(--color-text-tertiary)";
const NEUTRAL = "var(--color-chart-other)";
const NAME_CHAR = 7;
const NAME_SPACING = 14;
const PLOT_TOP = 24;
const NAME_MARGIN = { min: 24, max: 168, gap: 16 };

function check({
  periods,
  series,
  divider,
  table,
}: Pick<PathChartProps, "periods" | "series" | "divider" | "table">) {
  checkDistinctSeries(series);
  const columns = table.head.slice(1);
  if (columns.length !== periods.length || columns.some((c, i) => c !== periods[i])) {
    throw new Error("the table's columns must be the periods, in the same order");
  }
  checkLabeledSeriesLength(series, periods.length, "period");
  if (divider !== undefined) {
    const at = periods.indexOf(divider.period);
    if (at < 0) throw new Error(`divider period "${divider.period}" is not one of the periods`);
    if (divider.at === "after" && at === periods.length - 1) {
      throw new Error(
        `divider "after" ${divider.period} needs a next period; it is the last period`,
      );
    }
  }
}

/** The category axis: room for three lines of 12px text under the baseline. */
export const WRAPPED_AXIS_HEIGHT = 56;
const TICK_LINE = 14;
/** Room beside the first and last period, so a point label stays off the ticks and in the plot. */
export const PERIOD_INSET = { left: 24, right: 16 };

/** The x-axis band for these periods: a line for each word of the longest name, plus the gap. */
export function axisHeight(periods: string[]): number {
  const words = Math.max(...periods.map((p) => p.split(" ").length));
  return TICK_LINE * words + 18;
}
/** A 12px label's average advance, for choosing where to break a name over its band. */
const CHAR_WIDTH = 6.5;
/** Pixels the chart keeps right of its plot (the chart's right margin). */
const PLOT_RIGHT = 24;
/** Pixels between a value tick and its label. */
const Y_TICK_GAP = 8;
/** Recharts adds its tick size to a y-axis' width even with tick lines off (3.10.1). */
const Y_TICK_SIZE = 6;

/** Greedy line breaks at spaces for lines of at most `limit` characters; a long word stays whole. */
function breakLines(label: string, limit: number): string[] {
  const lines: string[] = [];
  for (const word of label.split(" ")) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= limit) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

/** The characters a label may take on one line, over a category band of this width. */
function bandLimit(plotWidth: number, count: number): number {
  return Math.max(1, Math.floor(plotWidth / count / CHAR_WIDTH));
}

/**
 * The axis band for these labels over a plot of this width: a line for the largest number of lines
 * any label breaks into, plus the gap. The plot is the chart's width less its right margin and the
 * value labels' room.
 */
function wrappedAxisHeight(labels: string[], chartWidth: number, yTicks: YTick[] | undefined) {
  const yRoom = Math.max(
    0,
    ...(yTicks ?? []).map((t) => t.label.length * CHAR_WIDTH + Y_TICK_SIZE + Y_TICK_GAP),
  );
  const limit = bandLimit(chartWidth - PLOT_RIGHT - yRoom, labels.length);
  const lines = Math.max(...labels.map((l) => breakLines(l, limit).length));
  return TICK_LINE * lines + 18;
}

/**
 * The category axis' height and the `onResize` that measures the chart: before a width is known the
 * band holds three lines, after it a line for the most any label breaks into.
 */
export function useWrappedAxis(labels: string[], yTicks: YTick[] | undefined) {
  const [width, setWidth] = useState<number | undefined>(undefined);
  const height =
    width === undefined ? WRAPPED_AXIS_HEIGHT : wrappedAxisHeight(labels, width, yTicks);
  return {
    height,
    onResize: (w: number) => {
      setWidth(w);
    },
  };
}

/**
 * A category label centred under its band, broken over lines where it is wider than the band.
 * Nothing is cut, rotated or dropped; the label is the caller's text. Where the axis it is given
 * holds fewer lines than that, the lines are made wider until it fits: it overhangs its band, it is
 * never clipped.
 */
export function WrappedTick({
  x,
  y,
  width,
  height,
  visibleTicksCount,
  payload,
}: XAxisTickContentProps) {
  const label: unknown = payload.value;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof label !== "string"
  ) {
    throw new Error("a category tick needs a position, a band, a height and a text label");
  }
  // The first baseline is one line below the axis top; the last must clear the axis bottom by 3px.
  const room = Math.max(1, Math.floor((height - 3) / TICK_LINE));
  let limit = bandLimit(width, visibleTicksCount);
  let lines = breakLines(label, limit);
  while (lines.length > room && limit < label.length) {
    limit += 1;
    lines = breakLines(label, limit);
  }
  return (
    <text data-tick={label} x={x} y={y} textAnchor="middle" fontSize={13} fill={TICK.fill}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : TICK_LINE}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function cellText(cell: TableCell | undefined): string {
  if (cell === undefined) throw new Error("the table has no cell for this period");
  if (cell === null) return "n.a.";
  if (typeof cell === "string") return cell;
  return "withheld" in cell ? "Withheld" : "Not established for this run";
}

/** One readout line: a name, then its exact strings, each in tabular figures. */
export function ReadoutRow({ name, values }: { name: string; values: string[] }) {
  return (
    <li className="flex justify-between gap-4">
      <span>{name}</span>
      {values.map((v, i) => (
        <Fragment key={i}>
          {" "}
          <span className="tabular-nums">{v}</span>
        </Fragment>
      ))}
    </li>
  );
}

/** The readout for the active period: the table's exact strings, nothing computed. */
function PathTooltip({
  active,
  label,
  periods,
  rows,
}: TooltipContentProps & { periods: string[]; rows: TableRowData[] }) {
  const index = periods.indexOf(String(label));
  if (!active || index < 0) return null;
  return (
    <div className="rounded-ds-sm bg-surface-inverse px-3 py-2 text-small text-text-on-action shadow-2">
      <p className="font-semibold">{label}</p>
      <ul>
        {rows.map((row, i) => (
          <ReadoutRow key={i} name={row.label} values={[cellText(row.cells[index])]} />
        ))}
      </ul>
    </div>
  );
}

/**
 * The dashed divider, placed from the x scale so it can sit on a point or on a boundary.
 * Recharts' first pass runs before the axes are measured and gives the scale no position for a
 * period name; nothing is drawn for that pass, and the measured pass draws the line.
 */
function Divider({
  divider,
  next,
}: {
  divider: NonNullable<PathChartProps["divider"]>;
  next: string | undefined;
}) {
  const scale = useXAxisScale();
  const area = usePlotArea();
  if (scale === undefined || area === undefined) return null;
  const here = scale(divider.period);
  const there = next === undefined ? undefined : scale(next);
  if (typeof here !== "number") return null;
  if (divider.at === "after" && typeof there !== "number") return null;
  const x = divider.at === "on" || typeof there !== "number" ? here : (here + there) / 2;
  return (
    <g>
      <line
        data-divider=""
        x1={x}
        x2={x}
        y1={area.y}
        y2={area.y + area.height}
        stroke="var(--color-border-control)"
        strokeDasharray="4 4"
      />
      <text x={x} y={area.y - 8} textAnchor="middle" fontSize={13} fill={TEXT_FILL}>
        {divider.label}
      </text>
    </g>
  );
}

/** Room right of the plot for the longest series name, drawn beside each line's last point. */
function nameMargin(series: PathSeries[]) {
  const longest = Math.max(...series.map((s) => s.name.length));
  return Math.min(
    NAME_MARGIN.max,
    Math.max(NAME_MARGIN.min, longest * NAME_CHAR + NAME_MARGIN.gap),
  );
}

/** How far each series' name label moves down so the labels stand `NAME_SPACING` apart. */
function nameShifts(series: PathSeries[], yTicks: YTick[], axis: number, named: boolean) {
  const first = yTicks[0]?.value ?? 0;
  const span = (yTicks[yTicks.length - 1]?.value ?? 0) - first;
  const height = HEIGHT - PLOT_TOP - axis;
  const ends = series.map(
    (s) => s.values[s.values.map((v) => v !== null).lastIndexOf(true)] ?? null,
  );
  const at = ends.flatMap((v, i) =>
    v === null || span <= 0 ? [] : [{ i, y: PLOT_TOP + (1 - (v - first) / span) * height }],
  );
  const moved = named
    ? spread(
        at.map((a) => a.y),
        NAME_SPACING,
      )
    : [];
  return new Map(at.map((a, k) => [a.i, (moved[k] ?? a.y) - a.y]));
}

function Chart({
  title,
  periods,
  series,
  divider,
  yTicks,
  emphasis,
  rows,
}: Pick<PathChartProps, "title" | "periods" | "series" | "divider" | "yTicks" | "emphasis"> & {
  rows: TableRowData[];
}) {
  const named = emphasis !== undefined;
  const assigned = assignSeries(series.map((s) => s.name));
  const styles = named
    ? new Map(
        [...assigned].map(([name, style]) => [
          name,
          name === emphasis ? style : { ...style, color: NEUTRAL },
        ]),
      )
    : assigned;
  // The emphasised line is drawn last, on top.
  const drawn = series
    .map((item, index) => ({ item, index }))
    .sort((a, b) => Number(a.item.name === emphasis) - Number(b.item.name === emphasis));
  const data = periodSeriesData(periods, series);
  const allMissing = periods.filter((_, p) => series.every((s) => s.values[p] === null));
  const nameDy = nameShifts(series, yTicks, axisHeight(periods), named);
  return (
    // Period labels may need horizontal room on narrow screens; make that region keyboard-scrollable.
    <div
      role="region"
      aria-label={`${title} chart; scroll horizontally to read each period`}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-focus"
    >
      <div className="min-w-[340px] min-[480px]:min-w-0">
        <div className="flex flex-col gap-3 [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-solid [&_.recharts-surface:focus-visible]:outline-offset-2 [&_.recharts-surface:focus-visible]:outline-focus">
          <ResponsiveContainer width="100%" height={HEIGHT}>
            <LineChart
              title={title}
              data={data}
              margin={{ top: PLOT_TOP, right: named ? nameMargin(series) : 24, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--color-border-hairline)" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={BASELINE}
                tick={WrappedTick}
                interval={0}
                height={axisHeight(periods)}
                padding={PERIOD_INSET}
                tickMargin={8}
              />
              <YAxisLabels yTicks={yTicks} />
              <Tooltip
                isAnimationActive={false}
                cursor={false}
                content={(props) => <PathTooltip {...props} periods={periods} rows={rows} />}
              />
              {divider === undefined ? null : (
                <Divider divider={divider} next={periods[periods.indexOf(divider.period) + 1]} />
              )}
              {allMissing.map((period) => (
                <ReferenceLine
                  key={period}
                  x={period}
                  stroke="none"
                  label={{ value: "n.a.", position: "insideBottom", fill: NA_FILL, fontSize: 13 }}
                />
              ))}
              {drawn.map(({ item, index }) => {
                const style = styles.get(item.name);
                if (style === undefined) throw new Error(`no style for series "${item.name}"`);
                return (
                  <SeriesLine
                    key={item.name}
                    name={item.name}
                    dataKey={keyOf(index)}
                    style={style}
                    labels={named && item.name !== emphasis ? undefined : item.labels}
                    labelOffset={index === 0 ? -10 : 18}
                    nameDy={nameDy.get(index)}
                    nameAt={
                      named ? item.values.map((v) => v !== null).lastIndexOf(true) : undefined
                    }
                    emphasised={named && item.name === emphasis}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
          {series.length >= 2 ? <Legend names={series.map((s) => s.name)} styles={styles} /> : null}
        </div>
      </div>
    </div>
  );
}

/** Lines over periods, several series, one period marked, chosen points labelled directly. */
export function PathChart({
  title,
  as,
  note,
  subtitle,
  actions,
  periods,
  series,
  divider,
  yTicks,
  emphasis,
  table,
}: PathChartProps) {
  check({ periods, series, divider, table });
  return (
    <ChartWithTable
      title={title}
      as={as}
      note={note}
      subtitle={subtitle}
      actions={actions}
      table={table}
      chart={
        <Chart
          title={title}
          periods={periods}
          series={series}
          divider={divider}
          yTicks={yTicks}
          emphasis={emphasis}
          rows={table.rows}
        />
      }
    />
  );
}
