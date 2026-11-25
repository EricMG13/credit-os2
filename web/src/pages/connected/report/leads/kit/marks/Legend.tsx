import { cx } from "@/utils/cx";
import { GapSlot } from "./GapSlot";
import { BAR, SLIM } from "./text";

/** What a legend entry draws: the mark itself, at swatch size. */
export type LegendKind = "ring" | "dot" | "line" | "bar" | "slim" | "square" | "hatch";

/**
 * The colour of a legend entry, as the marks use it: `primary` teal (current), `secondary` navy,
 * `prior` grey, `worse` the signal colour, `increase` a teal outline on a teal tint, `decrease`
 * the signal outline on its tint, `neutral` the tertiary text colour.
 */
export type LegendColour =
  "primary" | "secondary" | "prior" | "worse" | "increase" | "decrease" | "neutral";

export type LegendEntry = {
  kind: LegendKind;
  /** Omitted: `primary` (`hatch` has its own texture and ignores it). */
  tone?: LegendColour;
  text: string;
  /** A dashed `line` (a projected or pro forma path). */
  dashed?: boolean;
};

const FILL: Record<LegendColour, string> = {
  primary: "fill-chart-1",
  secondary: "fill-chart-2",
  prior: "fill-chart-3",
  worse: "fill-warning-mark",
  increase: "fill-surface-selected stroke-chart-1",
  decrease: "fill-warning-fill stroke-warning-mark",
  neutral: "fill-text-tertiary",
};

const STROKE: Record<LegendColour, string> = {
  primary: "stroke-chart-1",
  secondary: "stroke-chart-2",
  prior: "stroke-chart-3",
  worse: "stroke-warning-mark",
  increase: "stroke-chart-1",
  decrease: "stroke-warning-mark",
  neutral: "stroke-text-tertiary",
};

/** A swatch's box: 12 px wide, 12 px tall. */
export const SWATCH = 12;

/** One legend mark inside an SVG, in the 12 × 12 box at (x, y): drawn as the mark itself is. */
export function MarkSwatch({
  kind,
  tone = "primary",
  dashed = false,
  x,
  y,
}: {
  kind: LegendKind;
  tone?: LegendColour;
  dashed?: boolean;
  x: number;
  y: number;
}) {
  const middle = y + SWATCH / 2;
  const outlined = tone === "increase" || tone === "decrease";
  switch (kind) {
    case "ring":
      return (
        <circle
          data-swatch="ring"
          cx={x + 6}
          cy={middle}
          r="4"
          strokeWidth="2"
          className={cx("fill-surface-card", STROKE[tone])}
        />
      );
    case "dot":
      return <circle data-swatch="dot" cx={x + 6} cy={middle} r="5" className={FILL[tone]} />;
    case "line":
      return (
        <line
          data-swatch="line"
          x1={x}
          x2={x + SWATCH}
          y1={middle}
          y2={middle}
          strokeWidth="2"
          strokeDasharray={dashed ? "3 2" : undefined}
          className={STROKE[tone]}
        />
      );
    case "bar":
    case "slim": {
      const height = kind === "bar" ? Math.min(BAR, 10) : SLIM;
      return (
        <rect
          data-swatch={kind}
          x={x + (outlined ? 0.75 : 0)}
          y={middle - height / 2}
          width={SWATCH - (outlined ? 1.5 : 0)}
          height={height}
          rx={kind === "bar" ? 2 : 1}
          strokeWidth={outlined ? 1.5 : undefined}
          className={FILL[tone]}
        />
      );
    }
    case "square":
      return (
        <rect
          data-swatch="square"
          x={x + 1}
          y={y + 1}
          width={SWATCH - 2}
          height={SWATCH - 2}
          rx="2"
          strokeWidth={outlined ? 1.5 : undefined}
          className={FILL[tone]}
        />
      );
    case "hatch":
      return <GapSlot x={x} y={y + 1} width={SWATCH} height={SWATCH - 2} />;
  }
}

/**
 * The one legend of the leads, for a tile head or above a figure: each entry its real mark shape
 * (a ring is a hollow circle, a dot a filled one, a line a short stroke, a bar or square a swatch,
 * a hatch the gap texture) and its words at 12 px, wrapping. Colour is never the only carrier:
 * every entry has its words.
 */
export function Legend({
  items,
  className,
}: {
  items: readonly LegendEntry[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <ul
      data-part="legend"
      className={cx("flex flex-wrap items-center gap-x-4 gap-y-1 text-caption", className)}
    >
      {items.map((item) => (
        <li
          key={`${item.kind}-${item.tone ?? ""}-${item.text}`}
          data-legend={item.kind}
          className="inline-flex items-center gap-1.5 font-normal text-text-secondary"
        >
          <svg
            viewBox={`0 0 ${String(SWATCH)} ${String(SWATCH)}`}
            width={SWATCH}
            height={SWATCH}
            aria-hidden="true"
            className="flex-none overflow-visible"
          >
            <MarkSwatch
              kind={item.kind}
              x={0}
              y={0}
              {...(item.tone ? { tone: item.tone } : {})}
              {...(item.dashed ? { dashed: true } : {})}
            />
          </svg>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
