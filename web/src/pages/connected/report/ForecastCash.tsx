import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Segmented } from "@/components/kit/Segmented";
import { historyNotes, periodsInOrder, unplacedNote } from "../visuals/scenarioPeriods";
import {
  cellsOf,
  fiscalYear,
  forecastMeasure,
  type Measure,
  type MeasureCell,
  drawnGapReason,
} from "./forecastData";
import { unitLabel } from "../publishedReport";
import type { ForecastSource } from "./ForecastRecord";
import { GapNote, Tile } from "./overview/Tile";

const VIEWS = [
  { key: "chart", label: "Chart" },
  { key: "table", label: "Table" },
] as const;

const FALLBACK_WIDTH = 524;
const PLOT = 160;
const LEFT = 44;
const RIGHT = 8;
const TOP = 12;
const FOOT = 30;
/** Height of the hatched mark that sits on the baseline for a part with no value. */
const STUB = 8;
const LINE = 14;
/** The widest gap word ("Not published", "Distributions") at 12px mono, plus breathing room. */
const LABEL_ROOM = 100;
const MIN_INSIDE = 16;
/** The box height of one caption-size text line: outside labels of a bar sit this far apart. */
const CAPTION_LINE = 16;

type Part = { name: string; cell: MeasureCell | undefined };
type Slot = { period: string; parts: [Part, Part] };

/** The drawing's own width, so that its text keeps its size at any container width. */
function useMeasuredWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry?.contentRect.width ?? 0);
      if (next > 0) setWidth(next);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, width };
}

/** A round tick step so that about four steps cover `max`. */
function stepFor(max: number) {
  const raw = max / 4;
  if (!(raw > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((m) => m * power >= raw) ?? 10) * power;
}

function reasonOf(cell: MeasureCell | undefined) {
  return cell ? drawnGapReason(cell.reason) || "No value published" : "Not published";
}

const isNegative = (cell: MeasureCell | undefined) => (cell?.value ?? 0) < 0;
const isMissing = (cell: MeasureCell | undefined) => cell?.value == null;

// PR 5: uses of cash take the first two Forecast category slots, 3 and 4.
function Chart({ slots }: { slots: Slot[] }) {
  const { ref, width } = useMeasuredWidth(FALLBACK_WIDTH);
  const stacked = (slot: Slot) =>
    slot.parts.reduce((sum, { cell }) => sum + Math.max(cell?.value ?? 0, 0), 0);
  const max = Math.max(0, ...slots.map(stacked));
  const step = stepFor(max);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, at) =>
    Number((at * step).toPrecision(12)),
  );
  const missing = Math.max(
    0,
    ...slots.map(({ parts }) => parts.filter(({ cell }) => isMissing(cell)).length),
  );
  const baseline = TOP + PLOT;
  const scale = PLOT / top;
  const slotWidth = (width - LEFT - RIGHT) / slots.length;
  // Gap words go under the year, each on its own line; a slot too narrow for them keeps the
  // hatched mark and the legend's "Not published" key instead of overlapping its neighbours.
  const words = slotWidth >= LABEL_ROOM;
  const height = baseline + FOOT + (words ? missing * 2 * LINE : 0);
  const barWidth = Math.min(56, slotWidth * 0.45);
  const markWidth = Math.min(20, slotWidth * 0.15);
  const description = slots
    .flatMap(({ period, parts }) =>
      parts.map(
        ({ name, cell }) =>
          `${name} ${period} ${cell?.value == null ? "not published" : cell.display}`,
      ),
    )
    .join(", ");
  return (
    <div ref={ref} className="min-w-0">
      <svg
        role="img"
        aria-label={description}
        width={width}
        height={height}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="block max-w-full"
      >
        <defs>
          <pattern id="uses-of-cash-stub" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 6 L6 0" className="stroke-border-container" strokeWidth="1" />
          </pattern>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={LEFT}
              x2={width - RIGHT}
              y1={baseline - tick * scale}
              y2={baseline - tick * scale}
              className="stroke-border-hairline"
            />
            <text
              x={LEFT - 6}
              y={baseline - tick * scale + 4}
              textAnchor="end"
              className="fill-text-tertiary font-mono text-caption"
            >
              {tick}
            </text>
          </g>
        ))}
        {slots.map((slot, at) => {
          const middle = LEFT + slotWidth * at + slotWidth / 2;
          const hasBar = slot.parts.some(({ cell }) => cell?.value != null && !isNegative(cell));
          const gapParts = slot.parts.filter(({ cell }) => isMissing(cell));
          // Bar and gap marks sit side by side on the baseline, centred in the slot.
          const used =
            (hasBar ? barWidth : 0) +
            gapParts.length * markWidth +
            (Number(hasBar) + gapParts.length - 1) * 4;
          const x = middle - used / 2;
          let level = 0;
          // Outside labels of one bar rise with its stack; each sits a text line above the last.
          let lastOutside = Infinity;
          const stated = slot.parts.flatMap(({ name, cell }, index) => {
            if (cell?.value == null || isNegative(cell)) return [];
            const barHeight = cell.value * scale;
            const y = baseline - level * scale - barHeight;
            level += cell.value;
            const inside = barHeight >= MIN_INSIDE;
            const barMiddle = x + barWidth / 2;
            const natural = y + barHeight / 2 + 4;
            const textY = inside ? natural : Math.min(natural, lastOutside - CAPTION_LINE);
            if (!inside) lastOutside = textY;
            return [
              <g key={name}>
                <rect
                  data-part={`${name} ${slot.period}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  className={index === 0 ? "fill-category-3" : "fill-category-4"}
                />
                <text
                  x={inside ? barMiddle : x + barWidth + 4}
                  y={textY}
                  textAnchor={inside ? "middle" : "start"}
                  className={`font-mono text-caption ${inside ? "fill-surface-card" : "fill-text-secondary"}`}
                >
                  {cell.display}
                </text>
              </g>,
            ];
          });
          // A part with no value is a hatched mark on the baseline, never a height.
          const gaps = gapParts.map(({ name }, index) => (
            <g key={name}>
              <rect
                data-part={`${name} ${slot.period} not published`}
                x={x + (hasBar ? barWidth + 4 : 0) + index * (markWidth + 4)}
                y={baseline - STUB}
                width={markWidth}
                height={STUB}
                fill="url(#uses-of-cash-stub)"
                className="stroke-border-gap"
                strokeDasharray="3 3"
              />
              {words && (
                <>
                  <text
                    x={middle}
                    y={baseline + 34 + index * 2 * LINE}
                    textAnchor="middle"
                    className="fill-text-secondary text-caption"
                  >
                    {name}
                  </text>
                  <text
                    x={middle}
                    y={baseline + 34 + (index * 2 + 1) * LINE}
                    textAnchor="middle"
                    className="fill-text-secondary font-mono text-caption"
                  >
                    Not published
                  </text>
                </>
              )}
            </g>
          ));
          return (
            <g key={slot.period}>
              {stated}
              {gaps}
              <text
                x={middle}
                y={baseline + 20}
                textAnchor="middle"
                className="fill-text-tertiary font-mono text-caption"
              >
                {slot.period}
              </text>
            </g>
          );
        })}
        <line
          data-axis=""
          x1={LEFT}
          x2={width - RIGHT}
          y1={baseline}
          y2={baseline}
          className="stroke-border-container"
        />
      </svg>
    </div>
  );
}

function Legend({ debtTrace, gaps }: { debtTrace: ReactNode; gaps: boolean }) {
  const swatch = (color: string) => (
    <span aria-hidden="true" className={`inline-block size-3 rounded-ds-xs ${color}`} />
  );
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-secondary">
      <li className="flex items-center gap-2">
        {swatch("bg-category-3")}
        Distributions
      </li>
      <li className="flex items-center gap-2">
        {swatch("bg-category-4")}
        Debt repayment
        {debtTrace}
      </li>
      {gaps && (
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="gap-hatch inline-block size-3 rounded-ds-xs border border-dashed border-border-gap"
          />
          Not published
        </li>
      )}
    </ul>
  );
}

/** One slot per fiscal year from the case's first to its last year; a year with no column keeps
 * its slot. A forecast period that is not a fiscal year sits among them, in period order. */
function yearSlots(periods: string[]) {
  const years = periods.flatMap((period) => fiscalYear(period) ?? []);
  const first = Math.min(...years);
  const last = Math.max(...years);
  const axis = years.length
    ? Array.from({ length: last - first + 1 }, (_, at) => {
        const year = first + at;
        return periods.find((period) => fiscalYear(period) === year) ?? `FY${String(year)}E`;
      })
    : [];
  return periodsInOrder([...axis, ...periods.filter((period) => fiscalYear(period) === null)]);
}

type Read = { name: string; measure: Measure | null; cells: Map<string, MeasureCell> };

/** A row's cell in each period outside the forecast: its figure, or its published cell with no
 * figure and the reason it gives. */
const cellsOutside = (measure: Measure | null) =>
  new Map(
    [
      ...(measure?.history ?? []),
      ...(measure?.unplaced ?? []),
      ...(measure?.historyGaps.blank ?? []),
    ].map((cell) => [cell.period, cell]),
  );

/**
 * The periods outside the forecast that either row states a figure for, each part with its own
 * cell (a part with no figure there keeps its published cell and reason): `before`, the reported
 * and pro forma periods in period order, and `last`, the periods the rule cannot place, as written.
 */
function historySlots(read: Read[]) {
  const byRow = read.map(({ name, measure }) => ({ name, cells: cellsOutside(measure) }));
  const slot = (period: string): Slot => ({
    period,
    parts: byRow.map(({ name, cells }) => ({ name, cell: cells.get(period) })) as [Part, Part],
  });
  const periods = (cells: (measure: Measure) => MeasureCell[]) => [
    ...new Set(
      read.flatMap(({ measure }) => (measure ? cells(measure) : []).map(({ period }) => period)),
    ),
  ];
  return {
    before: periodsInOrder(periods(({ history }) => history)).map(slot),
    last: periods(({ unplaced }) => unplaced).map(slot),
  };
}

/** Distributions and debt repayments by year, stacked from zero on one scale; never summed. */
export function UsesOfCash({
  model,
  group,
  caseName,
  units,
  source,
}: {
  model: unknown;
  group: string | undefined;
  caseName: string | undefined;
  units?: string;
  source?: ForecastSource;
}) {
  const [view, setView] = useState("chart");
  const measures: [string, Measure | null][] = [
    ["Distributions", forecastMeasure(model, /^Distributions$/u)],
    ["Debt repayment", forecastMeasure(model, /^Debt repayment$/u)],
  ];
  const trace = (row: string) => source?.(row, { case: caseName, rawGroup: group, row });
  const tile = {
    span: 5,
    label: "Uses of cash",
    title: `Uses of cash, ${caseName ?? "selected case"}`,
    kicker: `Distributions and debt repayments by year as the model publishes them · ${unitLabel(units ?? "") || "Units not recorded"}`,
    trace: trace("Distributions"),
  } as const;
  if (measures.every(([, measure]) => measure === null))
    return (
      <Tile {...tile}>
        <GapNote>The model publishes no distributions or debt repayment rows.</GapNote>
      </Tile>
    );
  const byName: Read[] = measures.map(([name, measure]) => ({
    name,
    measure,
    cells: new Map((measure ? cellsOf(measure, group) : []).map((cell) => [cell.period, cell])),
  }));
  const periods = [...new Set(byName.flatMap(({ cells }) => [...cells.keys()]))];
  if (!periods.length)
    return (
      <Tile {...tile}>
        <GapNote>
          The model publishes no distributions or debt repayment for{" "}
          {caseName ?? "the selected case"}.
        </GapNote>
      </Tile>
    );
  const { before, last } = historySlots(byName);
  const slots: Slot[] = [
    ...before,
    ...yearSlots(periods).map((period) => ({
      period,
      parts: byName.map(({ name, cells }) => ({ name, cell: cells.get(period) })) as [Part, Part],
    })),
    ...last,
  ];
  // A period outside the forecast that is drawn says its own gap; the others are named per row.
  const drawnOutside = new Set([...before, ...last].map(({ period }) => period));
  const undrawn = byName.flatMap(({ name, measure }) =>
    measure
      ? historyNotes(measure.historyGaps, drawnOutside).map((note) => `${name}: ${note}`)
      : [],
  );
  const gapNotes = slots.flatMap(({ period, parts }) =>
    parts.every(({ cell }) => cell === undefined)
      ? [`${period}: not published for this case.`]
      : parts.flatMap(({ name, cell }) =>
          isNegative(cell)
            ? [`${period} ${name}: ${cell?.display ?? ""} (negative, not stacked)`]
            : isMissing(cell)
              ? [
                  cell === undefined
                    ? `${period} ${name}: not published for this case.`
                    : `${period} ${name}: ${reasonOf(cell)}`,
                ]
              : [],
        ),
  );
  const notes = [...gapNotes, ...undrawn, ...unplacedNote(last)];
  return (
    <Tile {...tile}>
      <div className="flex">
        <Segmented label="Uses of cash view" segments={VIEWS} current={view} onSelect={setView} />
      </div>
      <Legend
        debtTrace={trace("Debt repayment")}
        gaps={slots.some(({ parts }) => parts.some(({ cell }) => isMissing(cell)))}
      />
      {view === "chart" ? (
        <>
          <Chart slots={slots} />
          {notes.length > 0 && (
            <ul className="list-disc pl-5 text-small text-text-secondary">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div
          role="region"
          aria-label="Uses of cash table"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="relative min-w-0 overflow-x-auto rounded-ds-sm outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:p-2"
        >
          <table className="w-full border-collapse text-small">
            <caption className="sr-only">Distributions and debt repayment by period</caption>
            <thead>
              <tr className="text-left text-caption text-text-tertiary">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Period
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Distributions
                </th>
                <th scope="col" className="py-2 pl-3 font-medium">
                  Debt repayment
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map(({ period, parts }) => (
                <tr key={period} className="border-t border-border-hairline">
                  <th scope="row" className="py-2 pr-3 text-left font-mono font-medium">
                    {period}
                  </th>
                  {parts.map(({ name, cell }) => (
                    <td
                      key={name}
                      className={`px-3 py-2 font-mono tabular-nums ${cell?.value == null ? "text-gap-text" : "text-text-primary"}`}
                    >
                      {cell?.value == null ? reasonOf(cell) : cell.display}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Tile>
  );
}
