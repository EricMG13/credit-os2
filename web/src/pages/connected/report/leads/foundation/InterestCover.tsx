import { cx } from "@/utils/cx";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import { GapSlot, LINE, Measured, SIZE } from "../kit/marks";
import { Legend } from "../kit/marks/Legend";
import { Grid, HALO, HALO_CLASS, TickLabels } from "../kit/marks/parts";
import type { LeadProps } from "../types";
import {
  coverChange,
  coverLayout,
  coverLegend,
  coverNotes,
  coverReading,
  coverTable,
  type CoverLayout,
} from "./coverGeometry";
import { figureGap, interestCover, type InterestCover } from "./foundationData";

const LABEL = "Interest cover";
/** The figure's width before the first measure (and in jsdom): the span-6 tile at 1128 px. */
const FALLBACK = 508;

function Row({ row, layout }: { row: CoverLayout["rows"][number]; layout: CoverLayout }) {
  const { mark } = row;
  const label = (
    <text
      data-part="label"
      x="0"
      y={row.labelY}
      fontSize={SIZE.label}
      className={cx(
        "font-body",
        row.latest ? "fill-text-primary font-medium" : "fill-text-secondary",
      )}
    >
      {row.label}
    </text>
  );
  if (mark.kind !== "value") {
    const slot = mark.kind === "gap";
    const first = row.y - 8 + (slot ? 16 : 0) + 12;
    return (
      <g data-period={row.label}>
        {label}
        {slot && (
          <GapSlot
            x={layout.plotLeft}
            y={row.y - 6}
            width={layout.plotRight - layout.plotLeft}
            height={12}
            reason={mark.reason}
          />
        )}
        <text
          data-part={slot ? "reason" : "words"}
          x={layout.plotLeft}
          y={first}
          fontSize={SIZE.label}
          className={cx("font-body", slot ? "fill-gap-text" : "fill-text-secondary")}
        >
          {row.lines.map((line, at) => (
            <tspan key={`${String(at)}-${line}`} x={layout.plotLeft} y={first + at * LINE}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  }
  const cx_ = layout.x(mark.value);
  return (
    <g data-period={row.label}>
      {label}
      {row.latest ? (
        <circle
          data-mark="current"
          data-value={mark.value}
          cx={cx_}
          cy={row.y}
          r="6"
          className="fill-chart-1"
        />
      ) : (
        <circle
          data-mark="prior"
          data-value={mark.value}
          cx={cx_}
          cy={row.y}
          r="5"
          strokeWidth="2"
          className="fill-surface-card stroke-chart-3"
        />
      )}
      <text
        data-part="value"
        x={cx_ + 12}
        y={row.y + 4}
        fontSize={SIZE.value}
        {...HALO}
        className={cx(
          "font-mono",
          HALO_CLASS,
          row.latest ? "fill-text-primary font-medium" : "fill-text-secondary",
        )}
      >
        {mark.text}
      </text>
    </g>
  );
}

function CoverStrip({ cover, width }: { cover: InterestCover; width: number }) {
  const layout = coverLayout(cover, width);
  const bands = layout.narrow
    ? layout.rows.map((row) => [row.y - 9, row.y + 9] as const)
    : [[0, layout.plotBottom] as const];
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={coverReading(cover)}
      data-layout={layout.narrow ? "narrow" : "wide"}
      className="block"
    >
      <Grid ticks={layout.ticks} x={layout.x} bands={bands} strong={0} />
      {layout.links.map(({ from, to }) => (
        <line
          key={`${String(from[1])}-${String(to[1])}`}
          data-part="link"
          x1={from[0]}
          y1={from[1]}
          x2={to[0]}
          y2={to[1]}
          strokeWidth="1.5"
          strokeDasharray="3 3"
          className="stroke-chart-3"
        />
      ))}
      {layout.rows.map((row) => (
        <Row key={row.label} row={row} layout={layout} />
      ))}
      <TickLabels ticks={layout.ticks} x={layout.x} y={layout.plotBottom + 16} width={width} />
    </svg>
  );
}

/**
 * Interest cover: EBITDA / cash interest for every period the module states, in the one period
 * order, on one scale from zero (the latest reported period as the dot, the others as rings, a
 * line by period),
 * each figure as written. The one change printed is the kit's rule (`changeBetween`: the latest
 * two periods of one kind exactly a year apart), its better/worse word from signal.ts only.
 */
export function InterestCoverTile({ lead }: { lead: LeadProps }) {
  const cover = interestCover(lead.entry);
  if (!cover)
    return (
      <GapTile span={6} label={LABEL} kicker={LABEL}>
        {figureGap(lead.entry, "cover") ?? "This page could not read interest cover."}
      </GapTile>
    );
  const change = coverChange(cover);
  return (
    <FigureTile
      props={lead}
      span={6}
      label={LABEL}
      kicker={`${cover.label} · ${cover.unit}`}
      title="Interest cover"
      line={cover.tableLine}
      source="interest cover"
      table={coverTable(cover)}
      notes={coverNotes(cover)}
    >
      <Legend items={coverLegend(cover)} />
      {change && (
        <p data-part="change" className="text-caption text-text-secondary">
          {change}
        </p>
      )}
      <Measured fallback={FALLBACK}>
        {(width) => <CoverStrip cover={cover} width={width} />}
      </Measured>
    </FigureTile>
  );
}
