import { cx } from "@/utils/cx";
import {
  across,
  latestAt,
  around,
  axis,
  clearSpot,
  labelBox,
  meet,
  runs,
  segments,
  stated,
  TEXT,
  textWidth,
  thinned,
  VALUE,
  type Frame,
  type Line,
  type Slot,
  type Spot,
} from "./markLayout";
import { useSvgScale } from "./svgScale";

export type { Slot } from "./markLayout";

/** One stated figure on a mark: where it sits (`value`) and the module's own text for it. */
export type Mark = { label: string; value: number; text: string };
export type MarkTone = "better" | "worse" | "flat" | "none";

const FILL = { worse: "fill-warning-mark", other: "fill-chart-1" } as const;
const STROKE = { worse: "stroke-warning-mark", other: "stroke-chart-1" } as const;
const ink = (tone: MarkTone) => (tone === "worse" ? "worse" : "other");

const TICK = "fill-text-tertiary font-mono";
const GRID = "stroke-border-hairline";
const PRIOR_RING = "fill-surface-card stroke-chart-3";
const GAP_RING = "fill-none stroke-border-gap";

/**
 * A mark drawn at its measured width in screen pixels (its viewBox is as wide as its frame), with
 * a fixed height: text is the asked size on screen at every width, and the mark does not grow tall.
 */
function useFrame(view: number) {
  const { ref, scale } = useSvgScale(view);
  return { ref, width: Math.max(view * scale, 1) };
}

const viewBox = (width: number, height: number) => `0 0 ${String(width)} ${String(height)}`;

/** A placed label: its spot and its text, drawn at `size`. */
type Placed = Spot & { text: string };

function Label({
  label,
  size,
  className,
  tick,
}: {
  label: Placed;
  size: number;
  className: string;
  tick?: boolean;
}) {
  return (
    <text
      data-tick={tick ? "" : undefined}
      x={label.x}
      y={label.y}
      textAnchor={label.anchor}
      fontSize={size}
      className={className}
    >
      {label.text}
    </text>
  );
}

/** A period name centred under its point, kept inside the drawing. */
function under(x: number, y: number, text: string, width: number): Placed {
  const half = textWidth(text, TEXT) / 2;
  if (x - half < 0) return { x: 0, y, anchor: "start", text };
  if (x + half > width) return { x: width, y, anchor: "end", text };
  return { x, y, anchor: "middle", text };
}

const boxOf = (label: Placed, size: number) => labelBox(label, label.text, size);

/** The labels that fit without overprinting (see `thinned`). */
function keep(labels: Placed[], size: number) {
  const shown = thinned(labels.map((label) => boxOf(label, size)));
  return labels.filter((_, at) => shown.has(at));
}

/**
 * Each stated figure's label, latest first so it takes the nearest clear spot, kept clear of the
 * lines and of every label already placed. A figure's own label is always drawn.
 */
function placeValues(
  points: { at: number; x: number; y: number; text: string }[],
  size: number,
  spots: (x: number, y: number) => [Spot, ...Spot[]],
  lines: Line[],
  taken: Frame[],
  frame: Frame,
) {
  const placed = new Map<number, Placed>();
  for (const point of [...points].reverse()) {
    const spot = clearSpot(spots(point.x, point.y), point.text, size, { lines, taken }, frame);
    taken.push(labelBox(spot, point.text, size));
    placed.set(point.at, { ...spot, text: point.text });
  }
  return placed;
}

const SLOPE = { view: 408, height: 180 } as const;

function slopeLayout(marks: Slot[], suffix: string, width: number) {
  const scale = axis(stated(marks), 3, suffix);
  const gridLeft = Math.max(...scale.ticks.map((tick) => textWidth(scale.label(tick), TEXT))) + 8;
  const widest = Math.max(...marks.map((mark) => textWidth(mark.text, VALUE)), 24);
  const half = Math.min(widest / 2 + 4, (width - gridLeft) / 4);
  const x = across(marks, gridLeft + half, width - half);
  const base = SLOPE.height - 4;
  const bottom = base - TEXT - 14;
  const top = VALUE + 12;
  const y = (value: number) => scale.place(value, bottom, top);
  const ticks = keep(
    scale.ticks.map((tick) => ({
      x: 0,
      y: y(tick) + 4,
      anchor: "start" as const,
      text: scale.label(tick),
    })),
    TEXT,
  );
  const periods = keep(
    marks.map((mark, at) => under(x(at), base, mark.label, width)),
    TEXT,
  );
  const steps = segments(marks);
  const lines: Line[] = [
    ...scale.ticks.map((tick): Line => [gridLeft, y(tick), width, y(tick)]),
    ...steps.map((step): Line => [x(step.at), y(step.from), x(step.at + 1), y(step.to)]),
  ];
  const taken = [...ticks, ...periods].map((label) => boxOf(label, TEXT));
  const points = marks.flatMap((mark, at) =>
    mark.value === null ? [] : [{ at, x: x(at), y: y(mark.value), text: mark.text }],
  );
  const frame = { left: gridLeft, right: width, top: 0, bottom: base - TEXT - 2 };
  const values = placeValues(
    points,
    VALUE,
    (px, py) => around(px, py, VALUE, 11),
    lines,
    taken,
    frame,
  );
  return { scale, gridLeft, x, y, ticks, periods, steps, values, middle: (top + bottom) / 2 };
}

/** A slope across the stated periods on a labelled axis, broken at a gap: the large tile's mark. */
export function Slope({
  marks,
  tone,
  suffix,
  label,
}: {
  marks: Slot[];
  tone: MarkTone;
  suffix: string;
  label: string;
}) {
  const { ref, width } = useFrame(SLOPE.view);
  const layout = slopeLayout(marks, suffix, width);
  const { x, y } = layout;
  const last = latestAt(marks);
  return (
    <svg
      ref={ref}
      viewBox={viewBox(width, SLOPE.height)}
      width="100%"
      role="img"
      aria-label={label}
      className="block"
    >
      {layout.scale.ticks.map((tick) => (
        <line
          key={tick}
          x1={layout.gridLeft}
          x2={width}
          y1={y(tick)}
          y2={y(tick)}
          className={GRID}
        />
      ))}
      {layout.ticks.map((tick) => (
        <Label key={tick.text} label={tick} size={TEXT} className={TICK} tick />
      ))}
      {layout.steps.map((step) => (
        <line
          key={step.label}
          data-segment=""
          x1={x(step.at)}
          y1={y(step.from)}
          x2={x(step.at + 1)}
          y2={y(step.to)}
          strokeWidth="2"
          className={step.at + 1 === last ? STROKE[ink(tone)] : "stroke-chart-3"}
        />
      ))}
      {marks.map((mark, at) => (
        <Dot
          key={mark.label}
          cx={x(at)}
          cy={mark.value === null ? layout.middle : y(mark.value)}
          gap={mark.value === null}
          latest={at === last}
          tone={tone}
        />
      ))}
      {[...layout.values].map(([at, value]) => (
        <Label
          key={value.text + String(at)}
          label={value}
          size={VALUE}
          className={cx(
            "font-mono",
            at === last ? "fill-text-primary font-medium" : "fill-text-secondary",
          )}
        />
      ))}
      {layout.periods.map((period) => (
        <Label key={period.text} label={period} size={TEXT} className="fill-text-tertiary" />
      ))}
    </svg>
  );
}

/** A point on a series mark: the latest filled, an earlier one ringed, a gap a dashed ring. */
function Dot({
  cx: x,
  cy: y,
  gap,
  latest,
  tone,
}: {
  cx: number;
  cy: number;
  gap: boolean;
  latest: boolean;
  tone: MarkTone;
}) {
  if (gap)
    return (
      <circle
        data-gap=""
        cx={x}
        cy={y}
        r={5}
        strokeWidth="1.5"
        strokeDasharray="2 2"
        className={GAP_RING}
      />
    );
  return latest ? (
    <circle cx={x} cy={y} r="6" className={FILL[ink(tone)]} />
  ) : (
    <circle cx={x} cy={y} r="5" strokeWidth="2" className={PRIOR_RING} />
  );
}

const STRIP = { view: 408, top: 36, row: 46 } as const;

/** Beside the point first (the strip reads across), then above or below it. */
const stripSpots = (x: number, y: number): [Spot, ...Spot[]] => [
  { x: x + 12, y: y + TEXT * 0.35, anchor: "start" },
  { x: x - 12, y: y + TEXT * 0.35, anchor: "end" },
  ...around(x, y, TEXT, 10),
];

function stripLayout(marks: Slot[], suffix: string, width: number) {
  const scale = axis(stated(marks), 4, suffix);
  const column = Math.max(...marks.map((mark) => textWidth(mark.label, TEXT))) + 12;
  const x = (value: number) => scale.place(value, column + 8, width - 12);
  const y = (at: number) => STRIP.top + at * STRIP.row;
  const floor = y(marks.length - 1) + 22;
  const height = floor + TEXT + 10;
  const ticks = keep(
    scale.ticks.map((tick) => under(x(tick), floor + TEXT + 4, scale.label(tick), width)),
    TEXT,
  );
  const names = marks.map((mark, at): Placed => ({
    x: 0,
    y: y(at) + 4,
    anchor: "start",
    text: mark.label,
  }));
  const steps = segments(marks);
  const lines = steps.map((step): Line => [x(step.from), y(step.at), x(step.to), y(step.at + 1)]);
  const taken = [...ticks, ...names].map((label) => boxOf(label, TEXT));
  const points = marks.flatMap((mark, at) =>
    mark.value === null ? [] : [{ at, x: x(mark.value), y: y(at), text: mark.text }],
  );
  const frame = { left: column, right: width, top: 0, bottom: floor };
  const values = placeValues(points, TEXT, stripSpots, lines, taken, frame);
  return { scale, column, x, y, floor, height, ticks, names, steps, values };
}

/** One row per period on a shared axis, so each level reads against the same scale. */
export function DotStrip({
  marks,
  tone,
  suffix,
  label,
}: {
  marks: Slot[];
  tone: MarkTone;
  suffix: string;
  label: string;
}) {
  const { ref, width } = useFrame(STRIP.view);
  const layout = stripLayout(marks, suffix, width);
  const { x, y } = layout;
  const last = latestAt(marks);
  return (
    <svg
      ref={ref}
      viewBox={viewBox(width, layout.height)}
      width="100%"
      role="img"
      aria-label={label}
      className="block"
    >
      {layout.scale.ticks.map((tick) => (
        <line key={tick} x1={x(tick)} x2={x(tick)} y1="14" y2={layout.floor} className={GRID} />
      ))}
      {layout.ticks.map((tick) => (
        <Label key={tick.text} label={tick} size={TEXT} className={TICK} tick />
      ))}
      {layout.steps.map((step) => (
        <line
          key={step.label}
          data-segment=""
          x1={x(step.from)}
          y1={y(step.at)}
          x2={x(step.to)}
          y2={y(step.at + 1)}
          strokeWidth="1.5"
          strokeDasharray="3 3"
          className="stroke-chart-3"
        />
      ))}
      {marks.map((mark, at) => (
        <g key={mark.label}>
          <Label
            label={layout.names[at] as Placed}
            size={TEXT}
            className={at === last ? "fill-text-primary font-medium" : "fill-text-secondary"}
          />
          <Dot
            cx={mark.value === null ? layout.column + 14 : x(mark.value)}
            cy={y(at)}
            gap={mark.value === null}
            latest={at === last}
            tone={tone}
          />
        </g>
      ))}
      {[...layout.values].map(([at, value]) => (
        <Label
          key={value.text + String(at)}
          label={value}
          size={TEXT}
          className={cx(
            "font-mono",
            at === last ? "fill-text-primary font-medium" : "fill-text-secondary",
          )}
        />
      ))}
    </svg>
  );
}

const SMALL = { view: 184, height: 40 } as const;

/** A small unlabelled slope, broken at a gap: direction and steepness only; the figures sit above. */
export function MiniSlope({
  marks,
  tone,
  label,
}: {
  marks: Slot[];
  tone: MarkTone;
  label: string;
}) {
  const { ref, width } = useFrame(SMALL.view);
  const values = stated(marks);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = across(marks, 8, width - 8);
  const y = (value: number) => (max === min ? 20 : 34 - ((value - min) / (max - min)) * 28);
  const last = latestAt(marks);
  return (
    <svg
      ref={ref}
      viewBox={viewBox(width, SMALL.height)}
      width="100%"
      role="img"
      aria-label={label}
      className="block"
    >
      <line x1="0" x2={width} y1="38" y2="38" className={GRID} />
      {runs(marks).map((run) => (
        <polyline
          key={run[0]?.at}
          data-segment=""
          fill="none"
          strokeWidth="2"
          points={run.map(({ at, value }) => `${String(x(at))},${String(y(value))}`).join(" ")}
          className={STROKE[ink(tone)]}
        />
      ))}
      {marks.map((mark, at) =>
        mark.value === null ? (
          <circle
            key={mark.label}
            data-gap=""
            cx={x(at)}
            cy={20}
            r={3.5}
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className={GAP_RING}
          />
        ) : (
          <circle
            key={mark.label}
            cx={x(at)}
            cy={y(mark.value)}
            r={at === last ? 4 : 3.5}
            strokeWidth={at === last ? undefined : 2}
            className={at === last ? FILL[ink(tone)] : PRIOR_RING}
          />
        ),
      )}
    </svg>
  );
}

/**
 * Two labels under a bar, one at each end; where they would overprint, the second takes its own
 * line, so neither figure is cut. Returns the labels and the drawing's height.
 */
function endLabels(first: string, second: string, width: number) {
  const base = 36;
  const left: Placed = { x: 0, y: base, anchor: "start", text: first };
  const right: Placed = { x: width, y: base, anchor: "end", text: second };
  if (!meet(boxOf(left, TEXT), boxOf(right, TEXT), 6)) return { left, right, height: SMALL.height };
  const below = base + TEXT + 4;
  return { left, right: { ...right, y: below }, height: below + 4 };
}

/** A ruler with an arrow from the earlier level to the latest. */
export function Ruler({
  from,
  to,
  tone,
  suffix,
  label,
}: {
  from: Mark;
  to: Mark;
  tone: MarkTone;
  suffix: string;
  label: string;
}) {
  const { ref, width } = useFrame(SMALL.view);
  const scale = axis([from.value, to.value], 2, suffix);
  const x = (value: number) => scale.place(value, 8, width - 8);
  const head = to.value >= from.value ? -6 : 6;
  const ends = keep(
    [
      { x: 8, y: 36, anchor: "start", text: scale.label(scale.ticks[0] ?? from.value) },
      { x: width - 8, y: 36, anchor: "end", text: scale.label(scale.ticks.at(-1) ?? to.value) },
    ],
    TEXT,
  );
  return (
    <svg
      ref={ref}
      viewBox={viewBox(width, SMALL.height)}
      width="100%"
      role="img"
      aria-label={label}
      className="block"
    >
      <line x1="8" x2={width - 8} y1="14" y2="14" strokeWidth="2" className={GRID} />
      {scale.ticks.map((tick) => (
        <line key={tick} x1={x(tick)} x2={x(tick)} y1="9" y2="19" className="stroke-chart-3" />
      ))}
      <line
        x1={x(from.value)}
        x2={x(to.value) + head}
        y1="14"
        y2="14"
        strokeWidth="2"
        className={STROKE[ink(tone)]}
      />
      <polygon
        points={`${String(x(to.value))},14 ${String(x(to.value) + head)},10.5 ${String(x(to.value) + head)},17.5`}
        className={FILL[ink(tone)]}
      />
      <circle cx={x(from.value)} cy="14" r="4" strokeWidth="2" className={PRIOR_RING} />
      {ends.map((end) => (
        <Label key={end.anchor} label={end} size={TEXT} className={TICK} tick />
      ))}
    </svg>
  );
}

/** A bar to the earlier level with the change drawn as its highlighted end. Positive levels only. */
export function DeltaBar({
  from,
  to,
  tone,
  label,
}: {
  from: Mark;
  to: Mark;
  tone: MarkTone;
  label: string;
}) {
  const { ref, width } = useFrame(SMALL.view);
  if (from.value <= 0 || to.value <= 0) return null;
  const x = (value: number) => (value / Math.max(from.value, to.value)) * width;
  const low = Math.min(from.value, to.value);
  const rose = to.value >= from.value;
  const ends = endLabels(rose ? from.text : to.text, rose ? to.text : from.text, width);
  return (
    <svg
      ref={ref}
      viewBox={viewBox(width, ends.height)}
      width="100%"
      role="img"
      aria-label={label}
      className="block"
    >
      <rect x="0" y="6" width={x(low)} height="14" rx="2" className="fill-chart-3" />
      <rect
        x={x(low)}
        y="6.5"
        width={width - x(low)}
        height="13"
        rx="2"
        strokeWidth="1"
        className={
          rose ? cx(FILL[ink(tone)], STROKE[ink(tone)]) : "fill-warning-fill stroke-warning-mark"
        }
      />
      <line x1={x(low)} x2={x(low)} y1="2" y2="24" className="stroke-text-primary" />
      <Label label={ends.left} size={TEXT} className={cx(TICK, !rose && "fill-text-primary")} />
      <Label label={ends.right} size={TEXT} className={cx(TICK, rose && "fill-text-primary")} />
    </svg>
  );
}

/** Two stated parts side by side, each drawn to its size. Positive parts only. */
export function SplitBar({ first, second, label }: { first: Mark; second: Mark; label: string }) {
  const { ref, width } = useFrame(SMALL.view);
  if (first.value <= 0 || second.value <= 0) return null;
  const cut = (first.value / (first.value + second.value)) * width;
  const ends = endLabels(first.text, second.text, width);
  return (
    <svg
      ref={ref}
      viewBox={viewBox(width, ends.height)}
      width="100%"
      role="img"
      aria-label={label}
      className="block"
    >
      <rect x="0" y="6" width={cut - 1} height="14" rx="2" className="fill-chart-1" />
      <rect x={cut + 1} y="6" width={width - 1 - cut} height="14" rx="2" className="fill-chart-2" />
      <Label label={ends.left} size={TEXT} className={cx(TICK, "fill-text-primary")} />
      <Label label={ends.right} size={TEXT} className={TICK} />
    </svg>
  );
}

/** Where a mark would be, for a figure the module did not supply. */
export function GapBar() {
  return (
    <div
      aria-hidden="true"
      className="gap-hatch h-3.5 rounded-ds-xs border border-dashed border-border-gap"
    />
  );
}
