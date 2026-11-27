import { cx } from "@/utils/cx";
import { tone } from "../../../signal";
import { Slope } from "../../overview/marks";
import { Figure, GapNote } from "../../overview/Tile";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import {
  Dumbbell,
  GapSlot,
  LINE,
  Measured,
  SIZE,
  useFigureWidth,
  type LegendEntry,
} from "../kit/marks";
import { Grid, HALO, HALO_CLASS, TickLabels } from "../kit/marks/parts";
import type { LeadProps } from "../types";
import { unplacedNotes } from "../kit/tables";
import { periodsCaption } from "./periodsData";
import {
  barLayout,
  changeText,
  contiguous,
  dumbbellRows,
  earningsReading,
  earningsTable,
  leverageChange,
  leverageGaps,
  leverageMarks,
  leverageReading,
  leverageSlope,
  leverageWord,
  lineLayout,
  pairNamed,
  PERIOD_BASE,
  periodSpan,
} from "./earningsDebtGeometry";
import {
  earningsAgainstDebt,
  figureGap,
  type EarningsAgainstDebt,
  type LeverageSeries,
} from "./foundationData";

const LABEL = "Earnings and debt";
const KICKER = "Earnings against debt and leverage";

const FILL = { primary: "fill-chart-1", secondary: "fill-chart-2" } as const;
const STROKE = { primary: "stroke-chart-1", secondary: "stroke-chart-2" } as const;

/** One period: one bar per measure from zero, earnings blue, debt plum, gaps hatched with the reason. */
function PeriodBars({ data, width }: { data: EarningsAgainstDebt; width: number }) {
  const layout = barLayout(data, width);
  const period = data.periods[0]?.label ?? "";
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={earningsReading(data, period)}
      data-layout={layout.narrow ? "narrow" : "wide"}
      className="block"
    >
      <Grid
        ticks={layout.ticks}
        x={layout.x}
        strong={0}
        bands={
          layout.narrow
            ? layout.rows.map((row) => [row.barY - 3, row.barY + 19] as const)
            : [[0, layout.plotBottom] as const]
        }
      />
      {layout.rows.map((row) => (
        <g key={row.label} data-row={row.label}>
          <text
            data-part="label"
            x="0"
            y={row.top + 12}
            fontSize={SIZE.label}
            className="fill-text-primary font-body font-medium"
          >
            {row.labelLines.map((line, at) => (
              <tspan key={`${String(at)}-${line}`} x="0" y={row.top + 12 + at * LINE}>
                {line}
              </tspan>
            ))}
          </text>
          {row.value ? (
            <>
              <rect
                data-bar={row.label}
                data-value={row.value.value}
                data-series={row.series}
                x={Math.min(layout.x(0), layout.x(row.value.value))}
                y={row.barY}
                width={Math.max(Math.abs(layout.x(row.value.value) - layout.x(0)), 1)}
                height="16"
                rx="2"
                className={FILL[row.series]}
              />
              <text
                data-part="value"
                x={row.value.value < 0 ? layout.x(0) + 6 : layout.x(row.value.value) + 6}
                y={row.barY + 12}
                textAnchor="start"
                fontSize={SIZE.value}
                className="fill-text-primary font-mono font-medium"
              >
                {row.value.text}
              </text>
            </>
          ) : (
            <>
              <GapSlot
                x={layout.left}
                y={row.barY + 2}
                width={Math.min(120, layout.right - layout.left)}
                height={12}
                reason={row.reason.join(" ")}
              />
              <text
                data-part="reason"
                x={layout.left}
                y={row.barY + 32}
                fontSize={SIZE.label}
                className="fill-gap-text font-body"
              >
                {row.reason.map((line, at) => (
                  <tspan
                    key={`${String(at)}-${line}`}
                    x={layout.left}
                    y={row.barY + 32 + at * LINE}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </>
          )}
        </g>
      ))}
      <TickLabels ticks={layout.ticks} x={layout.x} y={layout.plotBottom + 16} width={width} />
    </svg>
  );
}

/** The module's reasons for the periods a panel does not draw, under it, in the gap ink. */
function Reasons({ lines, x, y }: { lines: readonly string[]; x: number; y: number }) {
  if (!lines.length) return null;
  return (
    <text data-part="reason" x={x} y={y} fontSize={SIZE.label} className="fill-gap-text font-body">
      {lines.map((line, at) => (
        <tspan key={`${String(at)}-${line}`} x={x} y={y + at * LINE}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** Three or more periods: a line per measure across every stated period, one scale from zero. */
function PeriodLines({ data, width }: { data: EarningsAgainstDebt; width: number }) {
  const layout = lineLayout(data, width);
  const labels = data.periods.map((period) => period.label);
  const { top, height, margin } = layout.plot;
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={earningsReading(data, labels.join(", "))}
      className="block"
    >
      {layout.panels.map((panel) => (
        <g key={panel.label} data-panel={panel.label}>
          <text
            data-part="label"
            x={panel.left}
            y={panel.top + 12}
            fontSize={SIZE.label}
            className="fill-text-primary font-body font-medium"
          >
            {panel.label}
          </text>
          {layout.ticks.map((tick) => {
            const y = layout.y(tick.value) + panel.top;
            return (
              <g key={tick.value}>
                <line
                  x1={panel.left + margin}
                  x2={panel.left + panel.width}
                  y1={y}
                  y2={y}
                  className={tick.value === 0 ? "stroke-text-tertiary" : "stroke-border-hairline"}
                />
                {panel.ticks && (
                  <text
                    data-part="tick"
                    x={panel.left + margin - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={SIZE.tick}
                    className="fill-text-tertiary font-mono"
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            );
          })}
          {panel.segments.map((segment) => (
            <line
              key={`${String(segment.x1)}-${String(segment.x2)}`}
              data-segment={panel.label}
              {...segment}
              strokeWidth="2"
              className={STROKE[panel.series]}
            />
          ))}
          {panel.points.map((point, at) => (
            <g key={point.label}>
              {point.value ? (
                <>
                  <circle
                    data-point={`${panel.label} ${point.label}`}
                    data-value={point.value.value}
                    cx={point.x}
                    cy={point.value.y}
                    r={at === panel.points.length - 1 ? 5 : 4}
                    className={FILL[panel.series]}
                  />
                  <text
                    data-part="value"
                    x={point.x}
                    y={point.value.y - 9}
                    textAnchor="middle"
                    fontSize={SIZE.value}
                    className="fill-text-primary font-mono"
                  >
                    {point.value.text}
                  </text>
                </>
              ) : (
                <g data-gap-point={`${panel.label} ${point.label}`}>
                  <GapSlot
                    x={point.x - 7}
                    y={panel.top + top}
                    width={14}
                    height={height}
                    reason={point.reason ?? ""}
                  />
                </g>
              )}
              <text
                data-part="period"
                x={point.x}
                y={panel.top + top + height + PERIOD_BASE}
                textAnchor="middle"
                fontSize={SIZE.tick}
                className="fill-text-secondary font-body"
              >
                {(panel.periodLines[at] ?? []).map((line, n) => (
                  <tspan
                    key={`${String(n)}-${line}`}
                    x={point.x}
                    y={
                      panel.top +
                      top +
                      height +
                      PERIOD_BASE +
                      ((panel.periodShift[at] ?? 0) + n) * 13
                    }
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
          <Reasons
            lines={panel.reasons}
            x={panel.left}
            y={panel.top + top + height + PERIOD_BASE + 6 + panel.periodDepth * 13}
          />
        </g>
      ))}
    </svg>
  );
}

function Money({ data }: { data: EarningsAgainstDebt }) {
  const [ref, width] = useFigureWidth(640);
  const comparison = data.comparison;
  const figure =
    data.periods.length === 1 ? (
      <PeriodBars data={data} width={width} />
    ) : data.periods.length === 2 && comparison ? (
      <Dumbbell
        rows={dumbbellRows(data)}
        width={width}
        periods={{ prior: comparison.from, current: comparison.to }}
        unit={data.unit}
        legend={false}
      />
    ) : (
      <PeriodLines data={data} width={width} />
    );
  return (
    <div ref={ref} className="w-full min-w-0">
      {figure}
    </div>
  );
}

const SLOPE_INK = {
  worse: { stroke: "stroke-worse-mark", fill: "fill-worse-mark" },
  better: { stroke: "stroke-better-mark", fill: "fill-better-mark" },
  none: { stroke: "stroke-chart-1", fill: "fill-chart-1" },
} as const;

/**
 * Total debt / EBITDA over more than two periods: every stated period a dot on one scale, joined
 * in time order; only the compared pair's segment (and its later dot) carries the move's tone.
 */
function LeverageSlope({
  leverage,
  comparison,
  word,
  label,
  width,
}: {
  leverage: LeverageSeries;
  comparison: EarningsAgainstDebt["comparison"];
  word: "worse" | "better" | null;
  label: string;
  width: number;
}) {
  const layout = leverageSlope(leverage, comparison, width);
  const ink = SLOPE_INK[word ?? "none"];
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={label}
      className="block"
    >
      {layout.ticks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={layout.left}
            x2={width}
            y1={tick.y}
            y2={tick.y}
            className="stroke-border-hairline"
          />
          <text
            data-part="tick"
            x={layout.left - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={SIZE.tick}
            className="fill-text-tertiary font-mono"
          >
            {tick.label}
          </text>
        </g>
      ))}
      {layout.segments.map((segment) => (
        <line
          key={segment.label}
          data-segment={segment.label}
          {...(segment.compared && word ? { "data-tone": word } : {})}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
          strokeWidth="2"
          className={segment.compared && word ? ink.stroke : "stroke-chart-3"}
        />
      ))}
      {layout.dots.map((dot) => (
        <g key={dot.label}>
          {dot.y !== null && dot.value !== null ? (
            <>
              <circle
                data-dot={dot.label}
                data-value={dot.value}
                cx={dot.x}
                cy={dot.y}
                r="5"
                className={dot.compared && word ? ink.fill : "fill-chart-3"}
              />
              <text
                data-part="value"
                x={dot.x}
                y={dot.y - 10}
                textAnchor="middle"
                fontSize={SIZE.value}
                className={cx("fill-text-primary font-mono", HALO_CLASS)}
                {...HALO}
              >
                {dot.text}
              </text>
            </>
          ) : (
            <GapSlot
              x={dot.x - 7}
              y={SLOPE_TOP_GAP}
              width={14}
              height={layout.bottom - SLOPE_TOP_GAP}
            />
          )}
          <text
            data-part="period"
            x={dot.x}
            y={layout.bottom + 18}
            textAnchor="middle"
            fontSize={SIZE.tick}
            className="fill-text-secondary font-body"
          >
            {dot.periodLines.map((line, at) => (
              <tspan key={`${String(at)}-${line}`} x={dot.x} y={layout.bottom + 18 + at * 13}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  );
}

const SLOPE_TOP_GAP = 26;

/** Leverage: the overview Slope on its own scale with the stated values, or figures and a MiniSlope. */
function Leverage({
  leverage,
  basis,
  comparison,
  ordered,
  pair,
}: {
  leverage: LeverageSeries;
  basis: string | null;
  comparison: EarningsAgainstDebt["comparison"];
  /** The compared pair, named where more than two periods are drawn. */
  pair: string | null;
  /** False when the period order could not place a period: the figures are written, never a slope. */
  ordered: boolean;
}) {
  const marks = leverageMarks(leverage);
  const moved = leverageChange(leverage, comparison);
  const word = leverageWord(moved);
  const slopeTone = moved === null ? "none" : tone("leverage", moved);
  const gaps = leverageGaps(leverage);
  // One stated figure is written, not drawn: a slope needs two.
  const drawn = ordered && marks.length > 1 && contiguous(leverage.values);
  const reading = leverageReading(leverage, comparison, pair);
  const many = leverage.values.length > 2;
  return (
    <div data-leverage className="flex w-full min-w-0 flex-col gap-2">
      <p className="text-caption font-medium text-text-primary">
        {leverage.label}
        <span className="font-normal text-text-tertiary"> · own scale</span>
      </p>
      {drawn && many && (
        <Measured fallback={408}>
          {(width) => (
            <LeverageSlope
              leverage={leverage}
              comparison={comparison}
              word={word}
              label={reading}
              width={width}
            />
          )}
        </Measured>
      )}
      {drawn && !many && <Slope marks={marks} tone={slopeTone} suffix="x" label={reading} />}
      {!drawn && (
        <ul aria-label={reading} className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          {marks.map((mark) => (
            <li key={mark.label} className="flex items-baseline gap-1.5">
              <span className="text-caption text-text-secondary">{mark.label}</span>
              <Figure>{mark.text}</Figure>
            </li>
          ))}
        </ul>
      )}
      {moved !== null && (
        <p data-change className="text-small text-text-secondary">
          <Figure className="font-medium">{`${changeText(moved)}x`}</Figure>
          {word && (
            <span
              data-tone={word}
              className={cx(
                "font-medium",
                word === "worse" ? "text-worse-mark" : "text-better-mark",
              )}
            >
              {` · ${word}`}
            </span>
          )}
          {pair && <span className="text-text-secondary">{` · ${pair}`}</span>}
        </p>
      )}
      {gaps.map((gap) => (
        <p key={gap} data-gap-reason className="text-caption wrap-anywhere text-gap-text">
          {gap}
        </p>
      ))}
      {basis && (
        <p data-basis className="text-caption wrap-anywhere text-text-tertiary">
          {basis}
        </p>
      )}
    </div>
  );
}

function legendOf(data: EarningsAgainstDebt): LegendEntry[] {
  const labels = data.periods.map((period) => period.label);
  const debt = data.measures.some((measure) => measure.key === "grossDebt");
  const earnings = data.measures.some((measure) => measure.key !== "grossDebt");
  const compared = data.comparison && labels.length === 2 ? data.comparison : null;
  const latest = data.comparison?.to ?? labels[0] ?? "";
  // One period is bars; two compared periods a ring to a dot; any other set a line per measure.
  const kind: LegendEntry["kind"] =
    labels.length === 1 ? "bar" : compared || !data.ordered ? "dot" : "line";
  const named = labels.length === 1 || compared;
  const gap = data.measures.some((measure) =>
    measure.values.some((value) => value.cell?.kind !== "number"),
  );
  const moved = data.leverage ? leverageWord(leverageChange(data.leverage, data.comparison)) : null;
  return [
    ...(compared ? [{ kind: "ring" as const, tone: "prior" as const, text: compared.from }] : []),
    ...(earnings
      ? [
          {
            kind,
            tone: "primary" as const,
            text: named ? `${latest} earnings` : "Earnings",
          },
        ]
      : []),
    ...(debt
      ? [
          {
            kind,
            tone: "secondary" as const,
            text: named ? `${latest} gross debt` : "Gross debt",
          },
        ]
      : []),
    ...(moved === "worse"
      ? [{ kind: "line" as const, tone: "worse-mark" as const, text: "Leverage, worse" }]
      : []),
    ...(moved === "better"
      ? [{ kind: "line" as const, tone: "better" as const, text: "Leverage, better" }]
      : []),
    ...(gap ? [{ kind: "hatch" as const, text: "Not stated" }] : []),
  ];
}

/** The absent measures' sentences in order, an identical sentence once. */
const absentText = (data: { absent: { reason: string }[] }) =>
  [...new Set(data.absent.map((item) => item.reason))].join(" ");

/** Tile 1: earnings and gross debt on one US$ scale from zero, and leverage on its own scale. */
export function EarningsDebtTile({ lead }: { lead: LeadProps }) {
  const data = earningsAgainstDebt(lead.entry);
  if (!data)
    return (
      <GapTile span={12} label={LABEL} kicker={LABEL}>
        {figureGap(lead.entry, "earnings") ?? ""}
      </GapTile>
    );
  const labels = data.periods.map((period) => period.label);
  return (
    <FigureTile
      props={lead}
      span={12}
      label={LABEL}
      kicker={`${KICKER} · ${data.unit}, ${periodSpan(labels, data.ordered)}`}
      title={LABEL}
      line={data.tableLine}
      source="the earnings and debt figures"
      legend={legendOf(data)}
      caption={periodsCaption(lead.entry)}
      notes={unplacedNotes(data.unplaced, data.periods.length)}
      table={earningsTable(data)}
    >
      <div
        className={cx(
          "grid min-w-0 gap-6",
          // Three or more periods are a small multiple, which needs the row to itself until the
          // tile is wide enough for both: leverage then sits under it.
          data.periods.length > 2
            ? "xl:grid-cols-[minmax(0,1fr)_408px]"
            : "lg:grid-cols-[minmax(0,1fr)_408px]",
        )}
      >
        {data.measures.length ? <Money data={data} /> : <GapNote>{absentText(data)}</GapNote>}
        {data.leverage ? (
          <Leverage
            leverage={data.leverage}
            basis={data.leverageBasis}
            comparison={data.comparison}
            ordered={data.ordered}
            pair={pairNamed(data)}
          />
        ) : (
          <p className="text-caption text-gap-text">
            This page could not read total debt / EBITDA.
          </p>
        )}
      </div>
      {data.measures.length > 0 && data.absent.length > 0 && (
        <p data-absent className="text-caption wrap-anywhere text-gap-text">
          {absentText(data)}
        </p>
      )}
    </FigureTile>
  );
}
