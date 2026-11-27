import { isReported, unplacedNotes } from "../kit/tables";
import { Sparkline } from "../../../visuals/signal/Sparkline";
import { AMOUNT_BAR, AMOUNT_LEGEND, amountTone } from "./amountTone";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import { GapSlot, Measured, SIZE, textWidth } from "../kit/marks";
import { group } from "../kit/numbers";
import { safeText } from "../kit/reader";
import type { LeadProps } from "../types";
import {
  figureGap,
  handoffWords,
  segmentView,
  type Segment,
  type SegmentView,
} from "./foundationData";
import {
  SEG,
  segmentLayout,
  segmentPeriods,
  segmentValue,
  type MeasureRow,
  type SegmentLayout,
  type SegmentPeriods,
} from "./segmentsGeometry";
import { withUnstated } from "./periodsData";

const LABEL = "Segments";
/** The figure's width before the first measure (and in jsdom): the span-6 tile at 1128 px. */
const FALLBACK = 508;

/** "A", "A and B", "A, B and C". */
const listOf = (labels: readonly string[]) =>
  labels.length > 1
    ? `${labels.slice(0, -1).join(", ")} and ${labels.at(-1) ?? ""}`
    : (labels[0] ?? "");

/** One measure of one segment in words: the drawn figure, then the prior one in brackets. */
function measureWords(
  label: string,
  values: Segment["sales"],
  periods: SegmentPeriods,
): string | null {
  const stated = values.some((value) => value.cell !== null);
  if (!stated) return null;
  const current = segmentValue(values, periods.drawn).text;
  const prior = periods.prior ? segmentValue(values, periods.prior) : null;
  // A prior cell with the same words as the drawn one (the same stated gap) is said once.
  const before =
    prior && periods.prior && prior.text !== current ? ` (${periods.prior} ${prior.text})` : "";
  return `${label} ${current}${before}`;
}

/** A corporate or elimination line, as stated: plain text, never a bar, never ranked. */
function apartLine(view: SegmentView, segment: Segment, periods: SegmentPeriods) {
  const parts = [
    measureWords(view.salesLabel, segment.sales, periods),
    measureWords(view.ebitdaLabel, segment.ebitda, periods),
  ].filter((part): part is string => part !== null);
  return `${safeText(segment.name)}, ${periods.drawn}: ${parts.join("; ")}.`;
}

/** Room for a sparkline at the right of a sales row: its width and the gap before it. */
const SPARK_COLUMN = 68;
const SPARK_WIDTH = 60;

type SalesSeries = {
  /** The stated figure of each period, null for every non-number (the line breaks there). */
  texts: (string | null)[];
  /** Each period with its figure as the reading says it. */
  said: string[];
  first: string;
  last: string;
};

/**
 * A segment's net sales over the annual reported periods of the drawn form, up to the drawn one,
 * oldest first. A period the schedule states as a gap or words is null. Drawn only from three
 * stated figures (ruling C5).
 */
function salesSeries(
  view: SegmentView,
  segment: Segment,
  periods: SegmentPeriods,
): SalesSeries | null {
  const drawnPeriod = view.periods.find((period) => period.label === periods.drawn);
  if (drawnPeriod?.kind !== "annual") return null;
  const upTo = view.periods.filter(
    (period) =>
      period.kind === "annual" &&
      period.form === drawnPeriod.form &&
      isReported(period.label) &&
      !view.unplaced.includes(period.label),
  );
  // A year of the form that the schedule does not state is a slot of its own (the line breaks there).
  const slots = withUnstated(upTo.slice(0, upTo.findIndex((p) => p.label === periods.drawn) + 1));
  const labels = slots.map((period) => period.label);
  const cells = labels.map((label) => segment.sales.find((value) => value.label === label)?.cell);
  // The drawn period's own figure ends the line: a drawn period that is not a number draws none.
  if (cells.at(-1)?.kind !== "number") return null;
  const texts = cells.map((cell) => (cell?.kind === "number" ? cell.text : null));
  // A stated gap is said "Not supplied" (its reason is Evidence-only); stated words as the bar rows
  // and table say them; a period the schedule does not state "not stated".
  const said = labels.map((label, at) => {
    const cell = cells[at];
    return cell === undefined || cell === null
      ? `${label} not stated`
      : `${label} ${
          cell.kind === "number"
            ? group(cell.text)
            : cell.kind === "gap"
              ? "Not supplied"
              : handoffWords(cell.text)
        }`;
  });
  const first = labels[0];
  const last = labels.at(-1);
  if (first === undefined || last === undefined) return null;
  if (texts.filter((text) => text !== null).length < 3) return null;
  return { texts, said, first, last };
}

/** The series in words for the figure's reading: grouped figures, each other cell in its own words. */
function seriesWords(view: SegmentView, segment: Segment, series: SalesSeries) {
  return `${safeText(segment.name)} ${view.salesLabel}: ${series.said.join("; ")}`;
}

function reading(
  view: SegmentView,
  periods: SegmentPeriods,
  series: readonly (SalesSeries | null)[],
) {
  const lead = periods.prior
    ? `Segments, ${view.unit}, ${periods.drawn} with ${periods.prior} beneath`
    : `Segments, ${view.unit}, ${periods.drawn}`;
  const parts = view.segments.map((segment) => {
    const words = [
      measureWords(view.salesLabel, segment.sales, periods),
      measureWords(view.ebitdaLabel, segment.ebitda, periods),
    ].filter(Boolean);
    return `${safeText(segment.name)}: ${words.join(", ")}`;
  });
  const apart = view.apart.map((segment) => apartLine(view, segment, periods).replace(/\.$/, ""));
  const lines = view.segments.flatMap((segment, at) => {
    const drawn = series[at];
    return drawn ? [seriesWords(view, segment, drawn)] : [];
  });
  const over = lines.length ? ` ${lines.join("; ")}.` : "";
  return `${lead}. ${[...parts, ...apart].join("; ")}.${over}`;
}

/** A tick label is centred on its tick unless that would run past the figure's edge. */
function tickAnchor(tick: { x: number; label: string }, width: number) {
  const half = textWidth(tick.label, SIZE.tick) / 2;
  return tick.x - half < 0 ? "start" : tick.x + half > width ? "end" : "middle";
}

function Row({
  row,
  layout,
  name,
  largest,
  spark,
}: {
  row: MeasureRow;
  layout: SegmentLayout;
  name: string;
  largest: number;
  spark: { label: string; texts: (string | null)[] } | null;
}) {
  const textY = row.y + 10;
  return (
    <g data-measure={`${name} ${row.measure}`}>
      {row.current.kind === "number" && row.bar && (
        <>
          <rect
            data-bar={`${name} ${row.measure}`}
            data-value={row.current.value}
            x={row.bar.x}
            y={row.y}
            width={row.bar.width}
            height={SEG.bar}
            rx={Math.min(2, row.bar.width / 2)}
            className={AMOUNT_BAR[amountTone(row.current.value, largest)]}
          />
          <text
            data-part="value"
            x={row.labelX}
            y={textY}
            fontSize={SIZE.value}
            className="fill-text-primary font-mono"
          >
            {row.current.text}
          </text>
        </>
      )}
      {row.current.kind === "gap" && (
        <GapSlot
          x={layout.zero}
          y={row.y}
          width={SEG.gapSlot}
          height={SEG.bar}
          reason={`${name} ${row.measure}: ${row.current.text}`}
        />
      )}
      {spark && (
        <g transform={`translate(${String(layout.width - SPARK_WIDTH)},${String(row.y - 2)})`}>
          <Sparkline values={spark.texts} label={spark.label} />
        </g>
      )}
      {row.lines.length > 0 && (
        <text
          data-part="reason"
          fontSize="12"
          className={
            row.current.kind === "gap" ? "fill-gap-text font-body" : "fill-text-secondary font-body"
          }
        >
          {row.lines.map((line, at) => (
            <tspan key={`${line}-${String(at)}`} x={row.labelX} y={textY + at * 13}>
              {line}
            </tspan>
          ))}
        </text>
      )}
      {row.prior && (
        <g data-prior={`${name} ${row.measure}`}>
          {row.prior.x !== null && (
            <line
              x1={row.prior.x}
              x2={row.prior.x}
              y1={row.y + SEG.bar + 1}
              y2={row.y + SEG.bar + 8}
              strokeWidth="2"
              className="stroke-chart-3"
            />
          )}
          <text
            data-part="prior"
            x={(row.prior.x ?? layout.zero) + 5}
            y={row.y + row.height - 2}
            fontSize="12"
            className="fill-text-tertiary font-mono"
          >
            {row.prior.text}
          </text>
        </g>
      )}
    </g>
  );
}

function SegmentFigure({
  view,
  periods,
  width,
}: {
  view: SegmentView;
  periods: SegmentPeriods;
  width: number;
}) {
  const series = view.segments.map((segment) => salesSeries(view, segment, periods));
  const layout = segmentLayout(
    view,
    periods,
    width,
    series.some((one) => one !== null) ? SPARK_COLUMN : 0,
  );
  // C4: every bar is tinted against the largest drawn bar of this figure (the apart lines draw none).
  const largest = Math.max(
    0,
    ...layout.blocks
      .flatMap((block) => block.rows)
      .flatMap((row) => (row.current.kind === "number" ? [Math.abs(row.current.value)] : [])),
  );
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={reading(view, periods, series)}
      data-layout={layout.layout}
    >
      {layout.ticks.map((tick) => (
        <line
          key={tick.value}
          x1={tick.x}
          x2={tick.x}
          y1={layout.top}
          y2={layout.bottom}
          className="stroke-border-hairline"
        />
      ))}
      <line
        x1={layout.zero}
        x2={layout.zero}
        y1={layout.top}
        y2={layout.bottom}
        className="stroke-connector"
      />
      {layout.blocks.map((block) => (
        <g key={`${block.name}-${String(block.segment.sales[0]?.line)}`} data-segment={block.name}>
          <text fontSize="13" fontWeight="500" className="fill-text-primary font-body">
            {block.nameLines.map((line, at) => (
              <tspan key={`${line}-${String(at)}`} x="0" y={block.nameY[at]}>
                {line}
              </tspan>
            ))}
          </text>
          {block.rows.map((row) => {
            const one = row.measure === "sales" ? series[layout.blocks.indexOf(block)] : null;
            return (
              <Row
                key={row.measure}
                row={row}
                layout={layout}
                name={block.name}
                largest={largest}
                spark={
                  one
                    ? {
                        texts: one.texts,
                        label: `${block.name} ${view.salesLabel}, ${one.first} to ${one.last}`,
                      }
                    : null
                }
              />
            );
          })}
        </g>
      ))}
      {layout.ticks.map((tick) => (
        <text
          key={tick.value}
          data-part="tick"
          x={tick.x}
          y={layout.height - 6}
          textAnchor={tickAnchor(tick, layout.width)}
          fontSize={SIZE.tick}
          className="fill-text-tertiary font-mono"
        >
          {tick.label}
        </text>
      ))}
    </svg>
  );
}

function tableOf(view: SegmentView) {
  const labels = view.periods.map((period) => period.label);
  const cellsOf = (values: Segment["sales"]) =>
    labels.map((label) => segmentValue(values, label).text);
  const rows = [...view.segments, ...view.apart].map((segment) => [
    safeText(segment.name),
    ...cellsOf(segment.sales),
    ...cellsOf(segment.ebitda),
  ]);
  return {
    caption: `Segments, ${view.unit}: ${view.salesLabel} and ${view.ebitdaLabel} by period`,
    headers: [
      "Segment",
      ...labels.map((label) => `${view.salesLabel}, ${label}`),
      ...labels.map((label) => `${view.ebitdaLabel}, ${label}`),
    ],
    rows,
  };
}

/** The note that names the drawn periods when the schedule states more than the figure draws. */
function periodNote(periods: SegmentPeriods) {
  if (!periods.notDrawn.length) return [];
  const drawn = periods.prior
    ? `Bars show ${periods.drawn}; ticks show ${periods.prior}.`
    : `Bars show ${periods.drawn}.`;
  return [
    `${drawn} The schedule also states ${listOf(periods.notDrawn)}; it is in the table view.`,
  ];
}

/** Tile 5 of the financial foundation: net sales and EBITDA per segment, as the module states them. */
export function SegmentsTile({ lead }: { lead: LeadProps }) {
  const view = segmentView(lead.entry);
  const periods = view ? segmentPeriods(view) : null;
  if (!view || !periods)
    return (
      <GapTile span={6} label={LABEL} kicker={LABEL}>
        {figureGap(lead.entry, "segments") ??
          "This page could not read a period of the segment schedule."}
      </GapTile>
    );
  const kicker = `${LABEL} · ${view.unit}, ${periods.drawn}`;
  const drawn = view.segments.flatMap((segment) => [
    segmentValue(segment.sales, periods.drawn),
    segmentValue(segment.ebitda, periods.drawn),
  ]);
  if (!drawn.some((value) => value.kind === "number"))
    return (
      <GapTile span={6} label={LABEL} kicker={kicker}>
        {view.segments.length
          ? `This page could not read an amount for any business unit in ${periods.drawn}.`
          : "This page could not read a business unit of the segment schedule."}
      </GapTile>
    );
  const apart = view.apart.map((segment) => apartLine(view, segment, periods));
  return (
    <FigureTile
      props={lead}
      span={6}
      label={LABEL}
      kicker={kicker}
      title={LABEL}
      line={view.tableLine}
      source="the segment figures"
      caption={
        <>
          In each business unit the upper bar is{" "}
          <span>
            {view.salesLabel}, {periods.drawn}
          </span>{" "}
          and the lower bar{" "}
          <span>
            {view.ebitdaLabel}, {periods.drawn}
          </span>
          .
        </>
      }
      legend={[
        ...AMOUNT_LEGEND,
        ...(periods.prior ? [{ tone: "prior" as const, text: `Tick: ${periods.prior}` }] : []),
        ...(drawn.some((value) => value.kind === "gap")
          ? [{ tone: "gap" as const, text: "Not supplied" }]
          : []),
      ]}
      notes={[...periodNote(periods), ...unplacedNotes(view.unplaced, view.periods.length)]}
      table={tableOf(view)}
    >
      <Measured fallback={FALLBACK}>
        {(width) => <SegmentFigure view={view} periods={periods} width={width} />}
      </Measured>
      {apart.length > 0 && (
        <div className="flex flex-col gap-1 text-small text-text-secondary">
          {apart.map((line) => (
            <p key={line} className="wrap-anywhere">
              {line}
            </p>
          ))}
        </div>
      )}
    </FigureTile>
  );
}
