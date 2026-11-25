import { cx } from "@/utils/cx";
import type { MarkTone } from "../../../overview/marks";
import { fittingTicks, niceAxis, type NiceAxis } from "./axis";
import { GapSlot } from "./GapSlot";
import { AxisNote, Grid, SvgLegend, TickLabels, legendHeight, type LegendItem } from "./parts";
import { LINE, NARROW, SIZE, gapWords, textWidth, wrap } from "./text";

/** One side of a pair: a stated figure, or the module's reason it is not stated. */
export type DumbbellSide = { value: number; text: string } | { gap: string };

export type DumbbellRow = {
  label: string;
  prior: DumbbellSide;
  current: DumbbellSide;
  /** The change as the page may print it (stated, or the exact prior → current difference). */
  change?: string;
  /** A second line under the change: direction and, from `tone()`, better or worse. */
  note?: string;
  /** `worse` draws the current dot in the signal colour; the word must be in `note`. */
  tone?: MarkTone;
  /**
   * Which series the row belongs to: "primary" (the default) draws the current dot teal,
   * "secondary" navy (`fill-chart-2`), so a second kind of measure on the same scale (debt beside
   * earnings) reads apart; the page names it in its own legend. `tone: "worse"` still wins.
   */
  series?: "primary" | "secondary";
};

export type DumbbellProps = {
  rows: readonly DumbbellRow[];
  /** The measured width in px; below 520 the narrow layout is drawn. */
  width: number;
  /** The two periods' names, for the legend and the reading. */
  periods: { prior: string; current: string };
  /** What the figures are in, for the reading. */
  unit: string;
  /** Omitted: the shared scale runs from zero. `"auto"` or a number: a cut axis, stated under it. */
  axisStart?: number | "auto";
  label?: string;
  /** Draw the legend (prior ring, current dot, the gap swatch where a side is not stated). */
  legend?: boolean;
  /**
   * A group caption above the plot (what this group of rows is and the scale it is on), for a
   * lead that draws several dumbbells as small multiples, each on its own scale.
   */
  caption?: string;
};

const known = (side: DumbbellSide): side is { value: number; text: string } => !("gap" in side);

/** A side that is not a finite number is drawn as the gap, with its text as written. */
const finiteSide = (side: DumbbellSide): DumbbellSide =>
  known(side) && !Number.isFinite(side.value) ? { gap: side.text } : side;
const finite = (rows: readonly DumbbellRow[]) =>
  rows.map((row) => ({ ...row, prior: finiteSide(row.prior), current: finiteSide(row.current) }));

const GAP = 12;
const MARK = 24;

function dumbbellAxis(rows: readonly DumbbellRow[], axisStart?: number | "auto") {
  const values = rows.flatMap((row) => [row.prior, row.current].filter(known).map((s) => s.value));
  if (axisStart === undefined) return niceAxis(values, { zero: true });
  return niceAxis(values, { zero: false, start: axisStart === "auto" ? undefined : axisStart });
}

const sideReading = (side: DumbbellSide, period: string) =>
  known(side) ? `${side.text} in ${period}` : `${period} not stated: ${side.gap}`;

function dumbbellReading(
  rows: readonly DumbbellRow[],
  periods: DumbbellProps["periods"],
  unit: string,
  axis: NiceAxis,
) {
  const parts = rows.map((row) => {
    const change = [row.change, row.note].filter(Boolean).join(", ");
    return `${row.label} ${sideReading(row.prior, periods.prior)} and ${sideReading(row.current, periods.current)}${change ? `, ${change}` : ""}`;
  });
  const start = axis.cut ? ` Axis starts at ${axis.ticks[0]?.label ?? ""}.` : "";
  return `${unit}, ${periods.prior} to ${periods.current}: ${parts.join("; ")}.${start}`;
}

type Spot = { text: string; current: boolean } | null;

/**
 * Which stated figure is written on which side, so each goes outward, away from the other mark.
 * Equal figures are written once, on the right, as the current figure.
 */
function sides(row: DumbbellRow): { left: Spot; right: Spot } {
  const [prior, current] = [row.prior, row.current];
  if (known(prior) && known(current)) {
    if (prior.value === current.value)
      return { left: null, right: { text: current.text, current: true } };
    const priorLeft = prior.value < current.value;
    const p = { text: prior.text, current: false };
    const c = { text: current.text, current: true };
    return priorLeft ? { left: p, right: c } : { left: c, right: p };
  }
  if (known(current)) return { left: null, right: { text: current.text, current: true } };
  if (known(prior)) return { left: null, right: { text: prior.text, current: false } };
  return { left: null, right: null };
}

type Frame = {
  narrow: boolean;
  labelWidth: number;
  changeX: number;
  changeWidth: number;
  /** The inner range the scale runs over, inside room for the outward figures. */
  inner: readonly [number, number];
  x: (value: number) => number;
};

const spotWidth = (spot: Spot) => (spot ? textWidth(spot.text, SIZE.value) : 0);

function frame(rows: readonly DumbbellRow[], axis: NiceAxis, width: number): Frame {
  const narrow = width < NARROW;
  const placed = rows.map(sides);
  const padLeft = Math.max(0, ...placed.map((one) => spotWidth(one.left))) + 16;
  const padRight = Math.max(0, ...placed.map((one) => spotWidth(one.right))) + 16;
  const longest = Math.max(0, ...rows.map((row) => textWidth(row.label)));
  const changes = rows.map((row) =>
    Math.max(textWidth(row.change ?? ""), textWidth(row.note ?? "")),
  );
  const gaps = rows.some((row) => !known(row.prior) || !known(row.current));
  const wanted = Math.max(0, ...changes) + 16;
  const changeWidth = narrow
    ? width
    : Math.min(Math.max(wanted, gaps ? 170 : 0), Math.round(width * 0.22));
  const labelWidth = narrow ? width : Math.min(longest + 16, Math.round(width * 0.28));
  const plotLeft = narrow ? 0 : labelWidth;
  const plotRight = narrow ? width : width - changeWidth;
  const inner = [
    plotLeft + padLeft,
    Math.max(plotLeft + padLeft + 40, plotRight - padRight),
  ] as const;
  return {
    narrow,
    labelWidth,
    changeX: narrow ? 0 : plotRight + 12,
    changeWidth: narrow ? width : changeWidth - 12,
    inner,
    x: (value) => axis.place(value, inner[0], inner[1]),
  };
}

type SideLine = { kind: "change" | "note" | "reason"; text: string; note?: string };

type Laid = {
  row: DumbbellRow;
  top: number;
  height: number;
  cy: number;
  labelLines: string[];
  /** Change, note and gap reasons, each line with its kind. */
  side: SideLine[];
  /** The narrow layout puts the change on the label's line, right-aligned, where it fits. */
  inline: SideLine | null;
};

function reasons(row: DumbbellRow, periods: DumbbellProps["periods"]) {
  return [
    known(row.prior) ? null : `${periods.prior}: ${gapWords(row.prior.gap)}`,
    known(row.current) ? null : `${periods.current}: ${gapWords(row.current.gap)}`,
  ].filter((text): text is string => text !== null);
}

/** The change slot: wide, the change and its note on two lines; narrow, one line. */
function changeLines(row: DumbbellRow, narrow: boolean, room: number): SideLine[] {
  if (!row.change && !row.note) return [];
  const one: SideLine = { kind: "change", text: row.change ?? "", note: row.note };
  if (narrow && lineWidth(one) <= room) return [one];
  // A change or note longer than its slot wraps inside it: the slot never spills past the figure.
  const wrapped = (kind: "change" | "note", text: string): SideLine[] =>
    wrap(text, room).map((line) => ({ kind, text: line }));
  return [
    ...(row.change ? wrapped("change", row.change) : []),
    ...(row.note ? wrapped("note", row.note) : []),
  ];
}

const lineWidth = (line: SideLine) =>
  textWidth(line.text) + (line.note ? textWidth(` ${line.note}`) : 0);

function lay(
  rows: readonly DumbbellRow[],
  f: Frame,
  periods: DumbbellProps["periods"],
  top: number,
) {
  let y = top;
  return rows.map((row): Laid => {
    const labelLines = wrap(row.label, f.labelWidth - (f.narrow ? 0 : 12));
    const changes = changeLines(row, f.narrow, f.changeWidth);
    const [first] = changes;
    const inline =
      f.narrow &&
      first &&
      labelLines.length === 1 &&
      textWidth(row.label) + lineWidth(first) + 16 <= f.changeWidth
        ? first
        : null;
    const side = [
      ...(inline ? [] : changes),
      ...reasons(row, periods).flatMap((text) =>
        wrap(text, f.changeWidth).map((line) => ({ text: line, kind: "reason" as const })),
      ),
    ];
    const labelHeight = labelLines.length * LINE;
    const gapStrip = !known(row.prior) || !known(row.current) ? 6 : 0;
    const height = f.narrow
      ? labelHeight + side.length * LINE + MARK + gapStrip + GAP
      : Math.max(labelHeight, side.length * LINE, MARK + gapStrip) + GAP;
    const cy = f.narrow ? y + labelHeight + side.length * LINE + 12 : y + 8;
    const laid = { row, top: y, height, cy, labelLines, side, inline };
    y += height;
    return laid;
  });
}

function Figure({
  spot,
  x,
  anchor,
  cy,
}: {
  spot: Spot;
  x: number;
  anchor: "start" | "end";
  cy: number;
}) {
  if (!spot) return null;
  const size = textWidth(spot.text, SIZE.value);
  // A card-coloured plate under the figure: a grid line near zero never runs through its digits.
  return (
    <g>
      <rect
        x={(anchor === "end" ? x - size : x) - 2}
        y={cy - 10}
        width={size + 4}
        height={20}
        className="fill-surface-card"
      />
      <text
        data-part="value"
        data-side={spot.current ? "current" : "prior"}
        x={x}
        y={cy + 4}
        textAnchor={anchor}
        fontSize={SIZE.value}
        className={cx(
          "font-mono",
          spot.current ? "fill-text-primary font-medium" : "fill-text-secondary",
        )}
      >
        {spot.text}
      </text>
    </g>
  );
}

function Pair({ one, f, reason }: { one: Laid; f: Frame; reason: string }) {
  const { row, cy } = one;
  const [prior, current] = [row.prior, row.current];
  const both = known(prior) && known(current);
  const flat = both && prior.value === current.value;
  const { left, right } = sides(row);
  const points = [prior, current].filter(known).map((side) => f.x(side.value));
  const [low, high] = [Math.min(...points), Math.max(...points)];
  const reach = flat ? 14 : 12;
  // Two figures closer than a mark's diameter: the ring is drawn above the row line and the dot
  // below it, so both are seen.
  const close = both && !flat && high - low < 12;
  const ring = known(prior) ? (
    <circle
      data-prior={prior.value}
      {...(close ? { "data-offset": "above" } : {})}
      cx={f.x(prior.value)}
      cy={close ? cy - 5 : cy}
      r={flat ? 8 : 5}
      strokeWidth="2"
      className="fill-surface-card stroke-chart-3"
    />
  ) : null;
  return (
    <g data-row={row.label}>
      {!both && (
        <GapSlot
          x={f.inner[0]}
          y={points.length ? cy + 9 : cy - 7}
          width={f.inner[1] - f.inner[0]}
          height={points.length ? 8 : 14}
          reason={reason}
        />
      )}
      {both && !flat && !close && (
        <line x1={low} x2={high} y1={cy} y2={cy} strokeWidth="2" className="stroke-chart-3" />
      )}
      {known(prior) && ring}
      {known(current) && (
        <circle
          data-current={current.value}
          {...(row.series ? { "data-series": row.series } : {})}
          {...(close ? { "data-offset": "below" } : {})}
          cx={f.x(current.value)}
          cy={close ? cy + 5 : cy}
          r={flat ? 4 : 6}
          className={
            row.tone === "worse"
              ? "fill-warning-mark"
              : row.series === "secondary"
                ? "fill-chart-2"
                : "fill-chart-1"
          }
        />
      )}
      <Figure spot={left} x={low - reach} anchor="end" cy={cy} />
      <Figure spot={right} x={high + reach} anchor="start" cy={cy} />
    </g>
  );
}

function SideText({
  line,
  x,
  y,
  anchor,
}: {
  line: SideLine;
  x: number;
  y: number;
  anchor?: "end";
}) {
  return (
    <text
      data-part={line.kind}
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={SIZE.value}
      className={cx(
        line.kind === "change" && "fill-text-primary font-mono font-medium",
        line.kind === "note" && "fill-text-secondary font-body",
        line.kind === "reason" && "fill-gap-text font-body",
      )}
    >
      {line.text}
      {line.note && (
        <tspan data-part="note" className="fill-text-secondary font-body font-normal">
          {line.text ? ` ${line.note}` : line.note}
        </tspan>
      )}
    </text>
  );
}

function Words({ one, f, width }: { one: Laid; f: Frame; width: number }) {
  const first = f.narrow ? one.top + 12 + one.labelLines.length * LINE : one.top + 12;
  return (
    <g>
      <text
        data-part="label"
        x="0"
        y={one.top + 12}
        fontSize={SIZE.label}
        className="fill-text-primary font-body font-medium"
      >
        {one.labelLines.map((line, at) => (
          <tspan key={`${String(at)}-${line}`} x="0" y={one.top + 12 + at * LINE}>
            {line}
          </tspan>
        ))}
      </text>
      {one.inline && <SideText line={one.inline} x={width} y={one.top + 12} anchor="end" />}
      {one.side.map((line, at) => (
        <SideText
          key={`${String(at)}-${line.text}`}
          line={line}
          x={f.changeX}
          y={first + at * LINE}
        />
      ))}
    </g>
  );
}

/**
 * The lead dumbbell: per row the prior figure as a ring and the current as a dot on one shared
 * scale (from zero unless the axis is cut, which is then stated), each figure written outward
 * so it never sits on a mark, the change the page may print beside it, and a side the module did
 * not state as the hatched strip with its reason.
 */
export function Dumbbell({
  rows: given,
  width,
  periods,
  unit,
  axisStart,
  label,
  legend = true,
  caption,
}: DumbbellProps) {
  const rows = finite(given);
  const axis = dumbbellAxis(rows, axisStart);
  const f = frame(rows, axis, width);
  const items: LegendItem[] = legend
    ? [
        { tone: "prior", text: periods.prior },
        { tone: "current", text: periods.current },
        ...(rows.some((row) => row.tone === "worse")
          ? [{ tone: "worse" as const, text: `${periods.current}, worse` }]
          : []),
        ...(rows.some((row) => !known(row.prior) || !known(row.current))
          ? [{ tone: "gap" as const, text: "Not stated" }]
          : []),
      ]
    : [];
  const captionLines = caption ? wrap(caption, width) : [];
  const head = legendHeight(items, width) + captionLines.length * LINE;
  const captionY = legendHeight(items, width) + 12;
  const laid = lay(rows, f, periods, head + (head ? 10 : 2));
  const plotTop = head + 2;
  const plotBottom = (laid.at(-1)?.top ?? plotTop) + (laid.at(-1)?.height ?? 0) - GAP + 4;
  const [inLeft, inRight] = [f.x(axis.start), f.x(axis.end)];
  const kept = fittingTicks(axis, inLeft, inRight, (text) => textWidth(text, SIZE.tick));
  const note = axis.cut
    ? wrap(`Axis starts at ${axis.ticks[0]?.label ?? ""}, not at zero.`, width, SIZE.tick)
    : [];
  const height = plotBottom + 22 + note.length * 14 + 4;
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width="100%"
      role="img"
      aria-label={label ?? dumbbellReading(rows, periods, unit, axis)}
      data-layout={f.narrow ? "narrow" : "wide"}
      className="block"
    >
      <SvgLegend items={items} width={width} />
      {captionLines.length > 0 && (
        <text
          data-part="caption"
          x="0"
          y={captionY}
          fontSize={SIZE.label}
          className="fill-text-secondary font-body font-medium"
        >
          {captionLines.map((line, at) => (
            <tspan key={`${String(at)}-${line}`} x="0" y={captionY + at * LINE}>
              {line}
            </tspan>
          ))}
        </text>
      )}
      <Grid
        ticks={kept}
        x={f.x}
        strong={axis.cut ? null : 0}
        bands={
          f.narrow
            ? laid.map((one) => [one.cy - 9, one.cy + 9] as const)
            : [[plotTop, plotBottom] as const]
        }
      />
      {laid.map((one, at) => (
        <g key={`${String(at)}-${one.row.label}`}>
          <Words one={one} f={f} width={width} />
          <Pair one={one} f={f} reason={reasons(one.row, periods).join(" · ")} />
        </g>
      ))}
      <TickLabels ticks={kept} x={f.x} y={plotBottom + 16} width={width} />
      <AxisNote lines={note} y={plotBottom + 34} />
    </svg>
  );
}
