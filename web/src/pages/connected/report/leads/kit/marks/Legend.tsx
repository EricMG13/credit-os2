import { cx } from "@/utils/cx";
import { GapSlot } from "./GapSlot";
import { BAR, SLIM } from "./text";

/** What a legend entry draws: the mark itself, at swatch size. */
export type LegendKind = "ring" | "dot" | "line" | "bar" | "slim" | "square" | "diamond" | "hatch";

/** The eight category colours, `category-1` to `category-8`. */
type CategoryColour = `category-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
/** The five amount steps, `amount-1` (smallest) to `amount-5`. */
type AmountColour = `amount-${1 | 2 | 3 | 4 | 5}`;

/**
 * The colour of a legend entry, as the marks use it: `primary` blue (current), `secondary` plum,
 * `prior` grey, `worse` the older signal orange (shared with the Waterfall "Not accepted" split
 * and the leads kit Dumbbell, which keep it), `increase` a blue outline on a blue tint, `decrease`
 * the signal outline on its tint, `neutral` the tertiary text colour. `better` and `worse-mark`
 * are the better and worse marks (green and burnt orange) that `tone()` readings draw in;
 * `category-1` to `category-8` are the category colours; `amount-1` to `amount-5` are the amount
 * steps, outlined because the pale steps are close to the white ground.
 */
export type LegendColour =
  | "primary"
  | "secondary"
  | "prior"
  | "worse"
  | "increase"
  | "decrease"
  | "neutral"
  | "better"
  | "worse-mark"
  | CategoryColour
  | AmountColour;

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
  better: "fill-better-mark",
  "worse-mark": "fill-worse-mark",
  "category-1": "fill-category-1",
  "category-2": "fill-category-2",
  "category-3": "fill-category-3",
  "category-4": "fill-category-4",
  "category-5": "fill-category-5",
  "category-6": "fill-category-6",
  "category-7": "fill-category-7",
  "category-8": "fill-category-8",
  "amount-1": "fill-scale-amount-1 stroke-scale-amount-edge",
  "amount-2": "fill-scale-amount-2 stroke-scale-amount-edge",
  "amount-3": "fill-scale-amount-3 stroke-scale-amount-edge",
  "amount-4": "fill-scale-amount-4 stroke-scale-amount-edge",
  "amount-5": "fill-scale-amount-5 stroke-scale-amount-edge",
};

const STROKE: Record<LegendColour, string> = {
  primary: "stroke-chart-1",
  secondary: "stroke-chart-2",
  prior: "stroke-chart-3",
  worse: "stroke-warning-mark",
  increase: "stroke-chart-1",
  decrease: "stroke-warning-mark",
  neutral: "stroke-text-tertiary",
  better: "stroke-better-mark",
  "worse-mark": "stroke-worse-mark",
  "category-1": "stroke-category-1",
  "category-2": "stroke-category-2",
  "category-3": "stroke-category-3",
  "category-4": "stroke-category-4",
  "category-5": "stroke-category-5",
  "category-6": "stroke-category-6",
  "category-7": "stroke-category-7",
  "category-8": "stroke-category-8",
  "amount-1": "stroke-scale-amount-edge",
  "amount-2": "stroke-scale-amount-edge",
  "amount-3": "stroke-scale-amount-edge",
  "amount-4": "stroke-scale-amount-edge",
  "amount-5": "stroke-scale-amount-edge",
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
  const outlined = tone === "increase" || tone === "decrease" || tone.startsWith("amount-");
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
    case "diamond":
      return (
        <path
          data-swatch="diamond"
          d={`M${String(x + 6)},${String(y + 0.5)} L${String(x + 11.5)},${String(middle)} L${String(x + 6)},${String(y + 11.5)} L${String(x + 0.5)},${String(middle)} Z`}
          className={FILL[tone]}
        />
      );
    case "hatch":
      return <GapSlot x={x} y={y + 1} width={SWATCH} height={SWATCH - 2} />;
  }
}

/**
 * The one legend of the leads, for a tile head or above a figure: each entry its real mark shape
 * (a ring is a hollow circle, a dot a filled one, a line a short stroke, a bar or square a swatch, a diamond a rotated square,
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
