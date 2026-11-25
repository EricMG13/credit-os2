import { readCell } from "../numbers";
import { reasonText, safeText } from "../reader";
import { fittingTicks, niceAxis } from "./axis";
import { GapSlot } from "./GapSlot";
import { SvgLegend, TickLabels, legendHeight, type LegendItem } from "./parts";
import { BAR, LINE, NARROW, SIZE, textWidth, wrap } from "./text";

export type BulletFigure = { value: number; text: string };
/** A figure, or the stated reason it is not given. */
export type BulletSide = BulletFigure | { gap: string };

export type BulletProps = {
  /** The measure's name, drawn above the mark (narrow) or left of it (wide). */
  name: string;
  value: BulletSide;
  limit: BulletFigure;
  proposed?: BulletSide;
  /** The measured width in px; below 520 the narrow layout is drawn. */
  width: number;
  /**
   * The status or compliance cell of the measure's row, printed as written (through `safeText`)
   * in the figures line; nothing is printed without one. The mark itself judges nothing.
   */
  status?: string | null;
  /** Names for the parts, as the handoff's columns call them (default Current, Limit, Proposed). */
  names?: { value?: string; limit?: string; proposed?: string };
  /**
   * Where the track starts (wide), so several bullets of one figure start their bars at one x:
   * `plotLeft` wins over `labelWidth` (the name column's width); by default the name's width,
   * at most 28 % of the figure.
   */
  plotLeft?: number;
  labelWidth?: number;
  /** Draw the legend (current bar, proposed ring, limit rule) above the mark; off by default. */
  legend?: boolean;
  /** What the figures are in, for the reading. */
  unit?: string;
  label?: string;
};

const stated = (side: BulletSide | undefined): side is BulletFigure =>
  side !== undefined && !("gap" in side);

/** A figure that is not a finite number is drawn as the gap, with its text as written. */
const finite = <T extends BulletSide | undefined>(side: T): T | { gap: string } =>
  stated(side) && !Number.isFinite(side.value) ? { gap: side.text } : side;

/** A gap side's reason once: "Not supplied: no proposal" is drawn "no proposal" after its part's name. */
const gapReason = (gap: string) => {
  const reading = readCell(gap);
  return reasonText(reading.kind === "gap" ? reading.reason : gap);
};

type Names = { value: string; limit: string; proposed: string };

/** The figures line: each part's figure or reason, in order, then the status as written. */
function figureLines(
  value: BulletSide,
  proposed: BulletSide | undefined,
  names: Names,
  status: string,
) {
  const part = (name: string, side: BulletSide) =>
    stated(side)
      ? { text: `${name} ${side.text}`, kind: "figure" as const }
      : { text: `${name}: ${gapReason(side.gap)}`, kind: "reason" as const };
  return [
    part(names.value, value),
    ...(proposed ? [part(names.proposed, proposed)] : []),
    ...(status ? [{ text: status, kind: "status" as const }] : []),
  ];
}

/** The default reading: the value, the proposed, the limit and the status, as stated. */
function bulletReading(
  props: BulletProps,
  value: BulletSide,
  proposed: BulletSide | undefined,
  names: Names,
  status: string,
) {
  const { name, limit, unit } = props;
  const parts = [
    ...figureLines(value, proposed, names, "").map((line) => line.text),
    `${names.limit} ${limit.text}`,
    ...(status ? [status] : []),
  ];
  return `${name}${unit ? `, ${unit}` : ""}: ${parts.join("; ")}. Scale from zero.`;
}

type Placed = { text: string; kind: "figure" | "reason" | "status"; x: number; y: number };

/** The figures line flowed from `left`, each part whole where it fits, wrapping inside `right`. */
function flowLines(lines: ReturnType<typeof figureLines>, left: number, right: number, y: number) {
  const placed: Placed[] = [];
  let [x, row] = [left, 0];
  for (const line of lines) {
    for (const text of wrap(line.text, right - left)) {
      const size = textWidth(text);
      if (x > left && x + size > right) [x, row] = [left, row + 1];
      placed.push({ text, kind: line.kind, x, y: y + row * LINE });
      x += size + 18;
    }
  }
  return { placed, rows: placed.length ? row + 1 : 0 };
}

const PART_CLASS = {
  figure: "fill-text-primary font-body",
  reason: "fill-gap-text font-body",
  status: "fill-text-secondary font-body",
} as const;

/**
 * The lead bullet: one measure's current figure as a bar, its limit as a rule and, where stated,
 * the proposed figure as a ring, all on one scale from zero, each with its figure as stated. The
 * figures are written outside the marks, in one line under the scale, the same on every row; the
 * mark draws no comparison and no judgement of its own: a status is the row's own cell, printed
 * as written. A current figure that is not stated is the hatched slot with its reason.
 */
export function Bullet(props: BulletProps) {
  const { name, limit, width } = props;
  const value = finite(props.value);
  const proposed = finite(props.proposed);
  const names: Names = { value: "Current", limit: "Limit", proposed: "Proposed", ...props.names };
  const status = props.status ? safeText(props.status) : "";
  const narrow = width < NARROW;
  const figures = [value, limit, proposed].filter(stated).map((one) => one.value);
  const axis = niceAxis(figures, { zero: true });
  const nameWidth = narrow
    ? width
    : (props.labelWidth ?? Math.min(textWidth(name) + 16, Math.round(width * 0.28)));
  const plotLeft = narrow ? 1 : Math.max(0, Math.min(props.plotLeft ?? nameWidth, width - 80));
  const nameLines = wrap(name, (narrow ? width : plotLeft) - (narrow ? 0 : 12));
  // The track runs to the figure's edge; the ring's radius is all it keeps back.
  const plotRight = width - 7;
  const x = (figure: number) => axis.place(figure, plotLeft, plotRight);
  const items: LegendItem[] = props.legend
    ? [
        { tone: "level", text: names.value },
        ...(proposed ? [{ tone: "proposed" as const, text: names.proposed }] : []),
        { tone: "limit", text: names.limit },
      ]
    : [];
  const legendBlock = legendHeight(items, width) + (items.length ? 6 : 0);
  const top = legendBlock + (narrow ? nameLines.length * LINE + 4 : 0);
  const bandY = top + 20;
  const mid = bandY + BAR / 2;
  const zero = x(0);
  const limitX = x(limit.value);
  const proposedX = stated(proposed) ? x(proposed.value) : null;
  const end = stated(value) ? x(value.value) : zero;
  const ticksY = bandY + BAR + 4;
  const flowed = flowLines(
    figureLines(value, proposed, names, status),
    plotLeft,
    width,
    ticksY + 36,
  );
  const height = ticksY + 36 + Math.max(0, flowed.rows - 1) * LINE + (flowed.rows ? 6 : -10);
  const limitText = `${names.limit} ${limit.text}`;
  const half = textWidth(limitText) / 2;
  const limitAnchor = limitX - half < plotLeft ? "start" : limitX + half > width ? "end" : "middle";
  const kept = fittingTicks(axis, plotLeft, plotRight, (text) => textWidth(text, SIZE.tick));
  const nameY = narrow ? legendBlock + 12 : mid + 4;
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width="100%"
      role="img"
      aria-label={props.label ?? bulletReading(props, value, proposed, names, status)}
      data-layout={narrow ? "narrow" : "wide"}
      data-plot-left={plotLeft}
      className="block"
    >
      <SvgLegend items={items} width={width} />
      <text
        data-part="label"
        x="0"
        y={nameY}
        fontSize={SIZE.label}
        className="fill-text-primary font-body font-medium"
      >
        {nameLines.map((line, at) => (
          <tspan key={`${String(at)}-${line}`} x="0" y={nameY + at * LINE}>
            {line}
          </tspan>
        ))}
      </text>
      <rect
        data-part="track"
        x={plotLeft}
        y={bandY}
        width={plotRight - plotLeft}
        height={BAR}
        rx="2"
        className="fill-surface-subtle"
      />
      {stated(value) ? (
        <rect
          data-bar="value"
          data-value={value.value}
          x={Math.min(zero, end)}
          y={bandY}
          width={Math.max(Math.abs(end - zero), 1)}
          height={BAR}
          rx="2"
          className="fill-chart-1"
        />
      ) : (
        <GapSlot
          x={plotLeft}
          y={bandY}
          width={plotRight - plotLeft}
          height={BAR}
          reason={value.gap}
        />
      )}
      <line
        data-mark="limit"
        data-value={limit.value}
        x1={limitX}
        x2={limitX}
        y1={bandY - 3}
        y2={bandY + BAR + 3}
        strokeWidth="2"
        className="stroke-text-primary"
      />
      <text
        data-part="limit"
        x={limitAnchor === "start" ? Math.max(limitX, plotLeft) : limitX}
        y={top + 12}
        textAnchor={limitAnchor}
        fontSize={SIZE.label}
        className="fill-text-secondary font-body"
      >
        {limitText}
      </text>
      {proposedX !== null && (
        <circle
          data-mark="proposed"
          data-value={stated(proposed) ? proposed.value : undefined}
          cx={proposedX}
          cy={mid}
          r="5"
          strokeWidth="2"
          className="fill-surface-card stroke-chart-2"
        />
      )}
      <g data-part="scale">
        {kept.map((tick) => (
          <line
            key={tick.value}
            x1={x(tick.value)}
            x2={x(tick.value)}
            y1={ticksY}
            y2={ticksY + 4}
            className="stroke-border-container"
          />
        ))}
        <TickLabels ticks={kept} x={x} y={ticksY + 16} width={width} />
      </g>
      {flowed.placed.map((line, at) => (
        <text
          key={`${String(at)}-${line.text}`}
          data-part={line.kind === "figure" ? "value" : line.kind}
          x={line.x}
          y={line.y}
          fontSize={SIZE.label}
          className={PART_CLASS[line.kind]}
        >
          {line.text}
        </text>
      ))}
    </svg>
  );
}
