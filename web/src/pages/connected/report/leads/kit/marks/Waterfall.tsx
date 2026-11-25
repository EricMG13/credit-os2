import { cx } from "@/utils/cx";
import { fittingTicks, niceAxis, type AxisTick, type NiceAxis } from "./axis";
import { GapSlot } from "./GapSlot";
import { group, readCell } from "../numbers";
import { BAR, LINE, NARROW, SIZE, SLIM, gapWords, signedText, textWidth, wrap } from "./text";
import {
  AxisNote,
  Grid,
  HALO,
  HALO_CLASS,
  SvgLegend,
  TickLabels,
  legendHeight,
  type LegendItem,
} from "./parts";

/**
 * The same row in an earlier period, drawn as a thin bar beneath the row's mark with its figure
 * written beside it (a level from the axis start, a step from the earlier period's own running
 * total), or a stated gap with its reason.
 */
export type WaterfallPrior = { value: number; text: string } | { gap: string };

/**
 * One part of a step drawn as consecutive segments (e.g. an add-back's accepted and not accepted
 * amounts), in order from the step's start. `text` carries the words, so colour is never the only
 * carrier; `worse` is the signal colour.
 */
export type WaterfallSplit = {
  text: string;
  value: number;
  tone: "primary" | "secondary" | "worse";
};

/**
 * One row of a waterfall, in the handoff's order. A `level` (an opening or a stated intermediate
 * total) and the `closing` are drawn from the axis start; a `step` floats from the running total;
 * a `gap` is a step or level the module did not state, drawn as the hatched slot with its reason.
 * `text` is the figure as stated; the mark only adds the sign a step lacks. Optional: `prior`, the
 * row in an earlier period; `split`, a step's parts (drawn on a step only); `of`, what a gap row
 * stands for, so its prior can be placed (without it the prior is written, not placed).
 */
export type WaterfallRow =
  | {
      kind: "level" | "closing" | "step";
      label: string;
      value: number;
      text: string;
      prior?: WaterfallPrior;
      split?: readonly WaterfallSplit[];
      /**
       * A step's tone, by default from its sign: `increase` (a blue outline on a blue tint) for a
       * rise, `decrease` (the signal outline on its tint) for a fall; a zero step has none. The
       * sign and the legend's word carry the direction; the tone is secondary.
       */
      tone?: "increase" | "decrease";
      /**
       * On a step: print `text` (and the prior's text) exactly as given, with thousands grouped and
       * a true minus only where the text has one: a cash payment written "1158" prints "1,158",
       * never "−1,158". Without it a step's figure is signed (`+70`, `−10`), except that a text
       * that already carries a sign is always printed as written. The direction is the geometry
       * and the Increase / Decrease word from the sign of `value`.
       */
      asWritten?: boolean;
    }
  | {
      kind: "gap";
      label: string;
      reason: string;
      prior?: WaterfallPrior;
      of?: "level" | "step";
    };

export type WaterfallProps = {
  rows: readonly WaterfallRow[];
  /** What the figures are in, for the reading (`USD m`). */
  unit: string;
  /** The measured width in px (`useFigureWidth`); below 520 the narrow layout is drawn. */
  width: number;
  /**
   * Omitted: the axis runs from zero. `"auto"`: cut where the values sit high (niceAxis). A
   * number: start exactly there when no value lies below it. A cut axis is marked on the totals.
   */
  axisStart?: number | "auto";
  /** The figure's accessible reading; by default every row with its figure, and the axis start. */
  label?: string;
  /**
   * Legend words, drawn above the mark for the kinds given; `prior` names the earlier period. Steps
   * are named by their tone, "Increase" and "Decrease" (where such a step is drawn), whenever a
   * legend is given; `step` is accepted for compatibility and not drawn.
   */
  legend?: { level?: string; step?: string; closing?: string; gap?: string; prior?: string };
};

const GAP = 14;
const SLOT = BAR;
/** The prior line under a row: a slim bar and its figure. */
const PRIOR_LINE = 14;
const PRIOR_BAR = SLIM;
/** Below a prior line the rows sit closer: the line itself already parts them. */
const PRIOR_GAP = 8;

type Placed = {
  row: WaterfallRow;
  /** Running total before and after; `null` where an earlier step is not stated. */
  from: number | null;
  to: number | null;
};

const finitePrior = (prior: WaterfallPrior | undefined): WaterfallPrior | undefined =>
  prior && "value" in prior && !Number.isFinite(prior.value) ? { gap: prior.text } : prior;

/** A figure that is not a finite number is drawn as the gap, with its text as written. */
const finite = (rows: readonly WaterfallRow[]): WaterfallRow[] =>
  rows.map((row): WaterfallRow => {
    const prior = finitePrior(row.prior);
    if (row.kind !== "gap" && !Number.isFinite(row.value))
      return {
        kind: "gap",
        label: row.label,
        reason: row.text,
        of: row.kind === "step" ? "step" : "level",
        ...(prior ? { prior } : {}),
      };
    return prior === row.prior ? row : { ...row, prior };
  });

function place(rows: readonly WaterfallRow[]): Placed[] {
  let running: number | null = 0;
  return rows.map((row): Placed => {
    if (row.kind === "gap") {
      running = null;
      return { row, from: null, to: null };
    }
    if (row.kind !== "step") {
      running = row.value;
      return { row, from: null, to: row.value };
    }
    if (running === null) return { row, from: null, to: null };
    const from: number = running;
    running = from + row.value;
    return { row, from, to: running };
  });
}

/** The earlier period's walk: where each row's prior bar runs, or why it is not placed. */
type PriorPlaced =
  | { kind: "gap"; reason: string }
  | { kind: "value"; total: boolean; from: number | null; to: number | null; text: string };

const roleOf = (row: WaterfallRow) =>
  row.kind === "gap" ? row.of : row.kind === "step" ? "step" : "level";

function placePrior(rows: readonly WaterfallRow[]): (PriorPlaced | null)[] {
  let running: number | null = 0;
  return rows.map((row): PriorPlaced | null => {
    const { prior } = row;
    const role = roleOf(row);
    if (!prior || "gap" in prior) {
      running = null;
      return prior ? { kind: "gap", reason: prior.gap } : null;
    }
    if (role === "level") {
      running = prior.value;
      return { kind: "value", total: true, from: null, to: prior.value, text: prior.text };
    }
    if (role === undefined) {
      running = null;
      return { kind: "value", total: false, from: null, to: null, text: prior.text };
    }
    const text = stepText(row, prior.text, prior.value);
    if (running === null) return { kind: "value", total: false, from: null, to: null, text };
    const from: number = running;
    running = from + prior.value;
    return { kind: "value", total: false, from, to: running, text };
  });
}

const priorPositions = (rows: readonly WaterfallRow[]) =>
  placePrior(rows).flatMap((one) =>
    one?.kind === "value"
      ? [one.from, one.to].filter((value): value is number => value !== null)
      : [],
  );

/** A figure as written: grouped, a hyphen minus made a true minus, an accounting negative kept. */
function writtenText(text: string) {
  const reading = readCell(text);
  if (reading.kind !== "number") return text.trim().replace(/^-(?=\d)/, "−");
  return reading.written ?? group(text);
}

/** True for a step printed as written: asked for, or its text already carries a sign. */
const asWritten = (row: WaterfallRow, text: string) =>
  (row.kind === "step" && row.asWritten === true) || /^\s*[+−-]\s?\d/.test(text);

/** A step's figure (its own or its prior's): as written where `asWritten`, else signed. */
const stepText = (row: WaterfallRow, text: string, value: number) =>
  asWritten(row, text) ? writtenText(text) : signedText(text, value);

const valueText = (row: WaterfallRow) =>
  row.kind === "gap" ? "" : row.kind === "step" ? stepText(row, row.text, row.value) : row.text;

const UNPLACED = "not placed: an earlier step is not stated";

export function waterfallAxis(rows: readonly WaterfallRow[], axisStart?: number | "auto") {
  const positions = [
    ...place(rows).flatMap((one) => [
      ...[one.from, one.to].filter((value): value is number => value !== null),
      // Parts that do not add up to their step are drawn as written: the axis holds their ends too.
      ...(one.row.kind === "step" && one.row.split && one.from !== null
        ? splitRuns(one.row.split, one.from).map((run) => run.end)
        : []),
    ]),
    ...priorPositions(rows),
  ];
  if (axisStart === undefined) return niceAxis(positions, { zero: true });
  return niceAxis(positions, {
    zero: false,
    start: axisStart === "auto" ? undefined : axisStart,
  });
}

function rowReading(row: WaterfallRow) {
  if (row.kind === "gap") return `${row.label} not stated: ${gapWords(row.reason)}`;
  // A sign the text does not carry is never read into it: "1158" paid reads "1,158, decrease".
  if (row.kind === "step" && row.asWritten === true)
    return `${row.label} ${writtenText(row.text)}${row.value > 0 ? ", increase" : row.value < 0 ? ", decrease" : ""}`;
  if (row.kind === "step")
    return row.value < 0
      ? `less ${row.label} ${signedText(row.text, row.value).slice(1)}`
      : `plus ${row.label} ${signedText(row.text, row.value).replace(/^\+/, "")}`;
  return row.kind === "closing" ? `equals ${row.label} ${row.text}` : `${row.label} ${row.text}`;
}

/** A row's split parts and its earlier period, in brackets after its own reading. */
function extrasReading(row: WaterfallRow, prior: string) {
  const split = row.kind === "step" && row.split?.length ? row.split.map((part) => part.text) : [];
  const earlier = row.prior
    ? ["gap" in row.prior ? `${prior}: ${row.prior.gap}` : `${prior} ${row.prior.text}`]
    : [];
  const extras = [...split, ...earlier];
  return extras.length ? ` (${extras.join("; ")})` : "";
}

/**
 * The default reading: every row in order, with its figure, gaps with their reasons, each row's
 * split parts and earlier figure (named `prior`) where given.
 */
export function waterfallReading(
  rows: readonly WaterfallRow[],
  unit: string,
  axis: NiceAxis,
  prior = "prior",
) {
  const parts = rows.map((row) => `${rowReading(row)}${extrasReading(row, prior)}`);
  const start = axis.ticks[0]?.label ?? "0";
  return `Waterfall, ${unit}: ${parts.join(", ")}. Axis starts at ${start}${axis.cut ? ", cut" : ""}.`;
}

type Frame = {
  narrow: boolean;
  plotLeft: number;
  plotRight: number;
  labelWidth: number;
  x: (value: number) => number;
};

function frame(
  placed: Placed[],
  priors: readonly (PriorPlaced | null)[],
  axis: NiceAxis,
  width: number,
): Frame {
  const narrow = width < NARROW;
  const values = [
    ...placed.map((one) => (one.to === null ? 0 : textWidth(valueText(one.row), SIZE.value))),
    ...priors.map((one) =>
      one?.kind === "value" && one.to !== null ? textWidth(one.text, SIZE.tick) : 0,
    ),
  ];
  const room = Math.max(24, ...values) + 10;
  const longest = Math.max(0, ...placed.map((one) => textWidth(one.row.label)));
  const labelWidth = narrow ? width : Math.min(longest + 16, Math.round(width * 0.34));
  const plotLeft = narrow ? 1 : labelWidth;
  const plotRight = Math.max(plotLeft + 60, width - room - 2);
  return {
    narrow,
    plotLeft,
    plotRight,
    labelWidth,
    x: (value) => axis.place(value, plotLeft, plotRight),
  };
}

/** One part of a split's key line: its swatch at `x` and its words. */
type SplitKey = { part: WaterfallSplit; x: number };

const SPLIT_SWATCH = 10;

/** A split's words flowed into lines from `left`, each part with its swatch, none past `right`. */
function splitLines(split: readonly WaterfallSplit[], left: number, right: number) {
  const lines: SplitKey[][] = [];
  let x = left;
  for (const part of split) {
    const size = SPLIT_SWATCH + 5 + textWidth(part.text) + 14;
    const line = lines.at(-1);
    if (!line || (x > left && x + size - 14 > right)) {
      lines.push([{ part, x: left }]);
      x = left + size;
    } else {
      line.push({ part, x });
      x += size;
    }
  }
  return lines;
}

/** The prior line's text: its figure where placed, its reason or "not placed" otherwise. */
function priorLines(prior: PriorPlaced | null, width: number) {
  if (!prior) return [];
  if (prior.kind === "gap") return wrap(gapWords(prior.reason), width - 22, SIZE.tick);
  return prior.to === null ? wrap(`${prior.text} · ${UNPLACED}`, width, SIZE.tick) : [prior.text];
}

type Laid = Placed & {
  top: number;
  height: number;
  barY: number;
  labelLines: string[];
  noteLines: string[];
  split: SplitKey[][];
  /** The space under the row (smaller under a prior line). */
  gap: number;
  /** The top of the prior line, under the mark and its split key. */
  priorY: number;
  prior: PriorPlaced | null;
  priorText: string[];
};

function lay(
  placed: Placed[],
  priors: readonly (PriorPlaced | null)[],
  f: Frame,
  top: number,
): Laid[] {
  let y = top;
  return placed.map((one, at) => {
    const labelLines = wrap(one.row.label, f.labelWidth - (f.narrow ? 0 : 12));
    const labelHeight = labelLines.length * LINE;
    const barY = f.narrow ? y + labelHeight + 2 : y;
    const noteWidth = f.plotRight - f.plotLeft + (f.narrow ? 0 : 40);
    const noteLines =
      one.row.kind === "gap"
        ? wrap(gapWords(one.row.reason), noteWidth)
        : one.to === null
          ? wrap(`${valueText(one.row)} · ${UNPLACED}`, noteWidth)
          : [];
    const slot = one.row.kind === "gap" ? SLOT + 4 : 0;
    const markHeight = noteLines.length ? slot + noteLines.length * LINE : BAR;
    const split =
      one.row.kind === "step" && one.row.split?.length
        ? splitLines(one.row.split, f.plotLeft, f.plotLeft + noteWidth)
        : [];
    const prior = priors[at] ?? null;
    const priorText = priorLines(prior, noteWidth);
    const priorY = barY + markHeight + split.length * LINE;
    const block = markHeight + split.length * LINE + priorText.length * PRIOR_LINE;
    const gap = priorText.length ? PRIOR_GAP : GAP;
    const height = f.narrow ? labelHeight + 2 + block + gap : Math.max(labelHeight, block) + gap;
    const laid = {
      ...one,
      top: y,
      height,
      gap,
      barY,
      labelLines,
      noteLines,
      split,
      priorY,
      prior,
      priorText,
    };
    y += height;
    return laid;
  });
}

/** Where a bar's figure goes: beyond its far end, leftward for a fall when it fits there. */
function valueSpot(
  left: number,
  right: number,
  falls: boolean,
  text: string,
  f: Frame,
  font: number = SIZE.value,
) {
  const size = textWidth(text, font);
  if (falls && left - f.plotLeft >= size + 6) return { x: left - 6, anchor: "end" as const };
  return { x: right + 6, anchor: "start" as const };
}

function BreakMark({ x, y }: { x: number; y: number }) {
  const at = (offset: number) => String(x + offset);
  const [top, bottom] = [String(y), String(y + BAR)];
  return (
    <path
      data-axis-break=""
      d={`M${at(6)} ${bottom} ${at(10)} ${top}M${at(11)} ${bottom} ${at(15)} ${top}`}
      strokeWidth="1.5"
      fill="none"
      className="stroke-surface-card"
    />
  );
}

function Bar({ one, f, base, cut }: { one: Laid; f: Frame; base: number; cut: boolean }) {
  const { row } = one;
  if (row.kind === "gap" || one.to === null) return null;
  const start = row.kind === "step" ? (one.from ?? base) : base;
  const [left, right] = [f.x(Math.min(start, one.to)), f.x(Math.max(start, one.to))];
  const total = row.kind !== "step";
  const text = valueText(row);
  const spot = valueSpot(left, right, one.to < start, text, f);
  return (
    <g>
      <rect
        data-bar={row.kind}
        data-label={row.label}
        data-from={start}
        data-to={one.to}
        {...(row.kind === "step" ? { "data-step": row.label } : {})}
        x={left}
        y={total ? one.barY : one.barY + 0.75}
        width={Math.max(right - left, 1)}
        height={total ? BAR : BAR - 1.5}
        rx="2"
        strokeWidth={total ? undefined : 1.5}
        {...(row.kind === "step" ? { "data-tone": stepTone(row) ?? "none" } : {})}
        className={cx(
          row.kind === "level" && "fill-chart-1",
          row.kind === "closing" && "fill-chart-2",
          row.kind === "step" && STEP_TONE[stepTone(row) ?? "none"],
        )}
      />
      {row.kind === "step" && one.from !== null && row.split && (
        <SplitSegments split={row.split} from={one.from} y={one.barY} f={f} />
      )}
      {total && cut && <BreakMark x={f.x(base)} y={one.barY} />}
      <text
        data-part="value"
        x={spot.x}
        y={one.barY + 12}
        textAnchor={spot.anchor}
        fontSize={SIZE.value}
        {...HALO}
        className={cx("fill-text-primary font-mono", HALO_CLASS, total && "font-medium")}
      >
        {text}
      </text>
    </g>
  );
}

/** A step's tone: as given, else from its sign; a zero step has none. */
const stepTone = (row: { value: number; tone?: "increase" | "decrease" }) =>
  row.tone ?? (row.value > 0 ? "increase" : row.value < 0 ? "decrease" : undefined);

const STEP_TONE = {
  increase: "fill-surface-selected stroke-chart-1",
  decrease: "fill-warning-fill stroke-warning-mark",
  none: "fill-surface-card stroke-chart-2",
} as const;

const SPLIT_TONE = {
  primary: "fill-chart-1",
  secondary: "fill-chart-2",
  worse: "fill-warning-mark",
} as const;

/** Each part's run, consecutive from the step's start, in the parts' order. */
function splitRuns(split: readonly WaterfallSplit[], from: number) {
  return split.reduce<{ part: WaterfallSplit; start: number; end: number }[]>((runs, part) => {
    const start = runs.at(-1)?.end ?? from;
    return [...runs, { part, start, end: start + part.value }];
  }, []);
}

/** A step's parts as consecutive segments inside its outline, from the step's start. */
function SplitSegments({
  split,
  from,
  y,
  f,
}: {
  split: readonly WaterfallSplit[];
  from: number;
  y: number;
  f: Frame;
}) {
  return (
    <g>
      {splitRuns(split, from).map(({ part, start, end }, at) => {
        const [left, right] = [f.x(Math.min(start, end)), f.x(Math.max(start, end))];
        return (
          <rect
            key={`${String(at)}-${part.text}`}
            data-split={part.text}
            data-from={start}
            data-to={end}
            x={left}
            y={y}
            width={Math.max(right - left, 1)}
            height={BAR}
            rx="2"
            className={SPLIT_TONE[part.tone]}
          />
        );
      })}
    </g>
  );
}

/** The split's words under the step, each with the swatch of its segment. */
function SplitKeys({ one }: { one: Laid }) {
  if (!one.split.length) return null;
  const first = one.priorY - one.split.length * LINE;
  return (
    <g data-part="split-key">
      {one.split.flatMap((line, row) =>
        line.map(({ part, x }) => {
          const y = first + row * LINE;
          return (
            <g key={`${String(row)}-${part.text}`}>
              <rect
                x={x}
                y={y + 4}
                width={SPLIT_SWATCH}
                height={SPLIT_SWATCH}
                rx="2"
                className={SPLIT_TONE[part.tone]}
              />
              <text
                data-part="split"
                x={x + SPLIT_SWATCH + 5}
                y={y + 13}
                fontSize={SIZE.label}
                {...HALO}
                className={cx("fill-text-secondary font-body", HALO_CLASS)}
              >
                {part.text}
              </text>
            </g>
          );
        }),
      )}
    </g>
  );
}

/** The earlier period under the row: a thin bar and its figure, or the stated gap and its reason. */
function PriorMark({ one, f, base }: { one: Laid; f: Frame; base: number }) {
  const { prior, priorY } = one;
  if (!prior) return null;
  const baseline = priorY + 11;
  if (prior.kind === "gap")
    return (
      <g>
        <GapSlot
          x={f.plotLeft}
          y={priorY + 3}
          width={16}
          height={PRIOR_BAR}
          reason={prior.reason}
        />
        <PriorText lines={one.priorText} x={f.plotLeft + 22} y={baseline} part="prior-reason" />
      </g>
    );
  if (prior.to === null)
    return <PriorText lines={one.priorText} x={f.plotLeft} y={baseline} part="prior-unplaced" />;
  const start = prior.from ?? base;
  const [left, right] = [f.x(Math.min(start, prior.to)), f.x(Math.max(start, prior.to))];
  const spot = valueSpot(left, right, prior.to < start, prior.text, f, SIZE.tick);
  return (
    <g>
      <rect
        data-prior={one.row.label}
        data-from={start}
        data-to={prior.to}
        x={left}
        y={priorY + 3}
        width={Math.max(right - left, 1)}
        height={PRIOR_BAR}
        rx="1"
        className="fill-chart-3"
      />
      <text
        data-part="prior-value"
        x={spot.x}
        y={baseline}
        textAnchor={spot.anchor}
        fontSize={SIZE.tick}
        {...HALO}
        className={cx("fill-text-secondary font-mono", HALO_CLASS)}
      >
        {prior.text}
      </text>
    </g>
  );
}

function PriorText({
  lines,
  x,
  y,
  part,
}: {
  lines: readonly string[];
  x: number;
  y: number;
  part: string;
}) {
  return (
    <text
      data-part={part}
      x={x}
      y={y}
      fontSize={SIZE.tick}
      {...HALO}
      className={cx("fill-gap-text font-body", HALO_CLASS)}
    >
      {lines.map((line, at) => (
        <tspan key={`${String(at)}-${line}`} x={x} y={y + at * PRIOR_LINE}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function RowLabel({ one }: { one: Laid }) {
  const total = one.row.kind === "level" || one.row.kind === "closing";
  return (
    <text
      data-part="label"
      x="0"
      y={one.top + 12}
      fontSize={SIZE.label}
      {...HALO}
      className={cx(
        "font-body",
        HALO_CLASS,
        total ? "fill-text-primary font-medium" : "fill-text-secondary",
      )}
    >
      {one.labelLines.map((line, at) => (
        <tspan key={`${String(at)}-${line}`} x="0" y={one.top + 12 + at * LINE}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Note({ one, f }: { one: Laid; f: Frame }) {
  if (!one.noteLines.length) return null;
  const first = one.barY + (one.row.kind === "gap" ? SLOT + 4 : 0) + 12;
  return (
    <text
      data-part={one.row.kind === "gap" ? "reason" : "unplaced"}
      x={f.plotLeft}
      y={first}
      fontSize={SIZE.label}
      {...HALO}
      className={cx("fill-gap-text font-body", HALO_CLASS)}
    >
      {one.noteLines.map((line, at) => (
        <tspan key={`${String(at)}-${line}`} x={f.plotLeft} y={first + at * LINE}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** Dashed links from each bar's end to the next bar where the walk continues there. */
function connectors(laid: Laid[], f: Frame) {
  return laid
    .slice(0, -1)
    .map((one, at) => {
      const next = laid[at + 1];
      if (!next || one.to === null || next.to === null) return "";
      const meets = next.row.kind === "step" ? next.from : next.to;
      if (meets === null || Math.abs(meets - one.to) > 1e-9 * Math.max(1, Math.abs(one.to)))
        return "";
      return `M${String(f.x(one.to))} ${String(one.barY + BAR)}V${String(next.barY)}`;
    })
    .join("");
}

/** A tick label's box as `TickLabels` draws it: centred, or held inside the figure at an end. */
function tickBox(tick: AxisTick, x: (value: number) => number, width: number) {
  const at = x(tick.value);
  const size = textWidth(tick.label, SIZE.tick);
  const left = Math.min(Math.max(at - size / 2, 0), width - size);
  return [left, left + size] as const;
}

/**
 * The kept ticks thinned (every second, third, …) until no two labels touch once the end labels
 * are held inside the figure; `fittingTicks` measures them centred, which an end label is not.
 */
function clearTicks(kept: readonly AxisTick[], x: (value: number) => number, width: number) {
  for (let every = 1; every <= kept.length; every += 1) {
    const some = kept.filter((_, at) => at % every === 0);
    const boxes = some.map((tick) => tickBox(tick, x, width));
    if (boxes.every((box, at) => at === 0 || box[0] > (boxes[at - 1]?.[1] ?? 0) + 6)) return some;
  }
  return kept.slice(0, 1);
}

function legendItems(
  legend: WaterfallProps["legend"],
  rows: readonly WaterfallRow[],
): LegendItem[] {
  if (!legend) return [];
  const tones = new Set(rows.flatMap((row) => (row.kind === "step" ? [stepTone(row)] : [])));
  const named: [LegendItem["tone"], string | undefined][] = [
    ["level", legend.level],
    ["increase", tones.has("increase") ? "Increase" : undefined],
    ["decrease", tones.has("decrease") ? "Decrease" : undefined],
    ["closing", legend.closing],
    ["gap", rows.some((row) => row.kind === "gap") ? (legend.gap ?? "Not stated") : undefined],
    ["slim", rows.some((row) => row.prior) ? legend.prior : undefined],
  ];
  return named.flatMap(([tone, text]) => (text ? [{ tone, text }] : []));
}

/**
 * The lead waterfall: rows of stated levels and steps on one scale, each figure beside its bar,
 * a fall drawn leftward with its minus sign, a step the module did not state as the hatched slot
 * with its reason. A cut axis is marked with the break on the totals and stated under the axis.
 */
export function Waterfall({ rows: given, unit, width, axisStart, label, legend }: WaterfallProps) {
  const rows = finite(given);
  const axis = waterfallAxis(rows, axisStart);
  const placed = place(rows);
  const priors = placePrior(rows);
  const f = frame(placed, priors, axis, width);
  const items = legendItems(legend, rows);
  const legendBlock = legendHeight(items, width);
  const laid = lay(placed, priors, f, legendBlock + 8);
  const plotTop = legendBlock + 4;
  const last = laid.at(-1);
  const plotBottom = last ? last.top + last.height - last.gap + 6 : plotTop + 6 - GAP;
  const base = axis.cut ? axis.start : 0;
  const kept = clearTicks(
    fittingTicks(axis, f.plotLeft, f.plotRight, (text) => textWidth(text, SIZE.tick)),
    f.x,
    width,
  );
  const note = axis.cut
    ? `Axis starts at ${axis.ticks[0]?.label ?? ""}, marked on the total bars.`
    : null;
  const noteLines = note ? wrap(note, width, SIZE.tick) : [];
  const height = plotBottom + 22 + noteLines.length * 14 + 4;
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width="100%"
      role="img"
      aria-label={label ?? waterfallReading(rows, unit, axis, legend?.prior)}
      data-layout={f.narrow ? "narrow" : "wide"}
      className="block"
    >
      <SvgLegend items={items} width={width} />
      <Grid
        ticks={kept}
        x={f.x}
        strong={base}
        bands={
          f.narrow
            ? laid.flatMap((one) =>
                one.row.kind === "gap"
                  ? [[one.barY, one.barY + SLOT + 4] as const]
                  : one.to === null
                    ? []
                    : [[one.barY - 3, one.barY + BAR + 3] as const],
              )
            : [[plotTop, plotBottom] as const]
        }
      />
      <path
        d={connectors(laid, f)}
        fill="none"
        strokeWidth="1"
        strokeDasharray="2 2"
        className="stroke-connector"
      />
      {laid.map((one, at) => (
        <g key={`${String(at)}-${one.row.label}`}>
          <RowLabel one={one} />
          {one.row.kind === "gap" && (
            <GapSlot
              x={f.plotLeft}
              y={one.barY + 2}
              width={f.plotRight - f.plotLeft}
              height={SLOT}
              reason={one.row.reason}
            />
          )}
          <Bar one={one} f={f} base={base} cut={axis.cut} />
          <Note one={one} f={f} />
          <SplitKeys one={one} />
          <PriorMark one={one} f={f} base={base} />
        </g>
      ))}
      <TickLabels ticks={kept} x={f.x} y={plotBottom + 16} width={width} />
      <AxisNote lines={noteLines} y={plotBottom + 34} />
    </svg>
  );
}
