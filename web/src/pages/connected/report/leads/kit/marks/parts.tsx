import type { AxisTick } from "./axis";
import { MarkSwatch, SWATCH, type LegendColour, type LegendKind } from "./Legend";
import { SIZE, textWidth } from "./text";

/** The swatch kinds a mark's in-figure legend can show; each is drawn as the mark itself is (`MarkSwatch`). */
type LegendTone =
  | "level"
  | "step"
  | "closing"
  | "gap"
  | "prior"
  | "current"
  | "worse-mark"
  | "limit"
  | "proposed"
  | "increase"
  | "decrease"
  | "slim";

export type LegendItem = { tone: LegendTone; text: string };

const ROW = 18;

/** Each in-figure legend tone as the one legend's kind and colour. */
const SWATCHES: Record<LegendTone, { kind: LegendKind; tone?: LegendColour }> = {
  level: { kind: "bar", tone: "primary" },
  closing: { kind: "bar", tone: "secondary" },
  step: { kind: "bar", tone: "increase" },
  increase: { kind: "bar", tone: "increase" },
  decrease: { kind: "bar", tone: "decrease" },
  gap: { kind: "hatch" },
  prior: { kind: "ring", tone: "prior" },
  current: { kind: "dot", tone: "primary" },
  "worse-mark": { kind: "dot", tone: "worse-mark" },
  limit: { kind: "line", tone: "neutral" },
  proposed: { kind: "ring", tone: "secondary" },
  slim: { kind: "slim", tone: "prior" },
};

function flow(items: readonly LegendItem[], width: number) {
  let x = 0;
  let y = 0;
  return items.map((item) => {
    const size = SWATCH + 6 + textWidth(item.text) + 16;
    if (x > 0 && x + size > width) {
      x = 0;
      y += ROW;
    }
    const spot = { item, x, y };
    x += size;
    return spot;
  });
}

/** The height a legend of `items` takes at `width` (0 for none). */
export function legendHeight(items: readonly LegendItem[], width: number) {
  if (!items.length) return 0;
  return (flow(items, width).at(-1)?.y ?? 0) + ROW;
}

function Swatch({ tone, x, y }: { tone: LegendTone; x: number; y: number }) {
  if (tone === "limit")
    return (
      <line
        data-swatch="limit"
        x1={x + 6}
        x2={x + 6}
        y1={y - 1}
        y2={y + 11}
        strokeWidth="2"
        className="stroke-text-primary"
      />
    );
  const { kind, tone: colour } = SWATCHES[tone];
  return <MarkSwatch kind={kind} x={x} y={y - 1} {...(colour ? { tone: colour } : {})} />;
}

/** A mark's legend at the top of its SVG, wrapping at `width`; the same swatches as `Legend`. */
export function SvgLegend({ items, width }: { items: readonly LegendItem[]; width: number }) {
  if (!items.length) return null;
  return (
    <g data-part="legend">
      {flow(items, width).map(({ item, x, y }) => (
        <g key={`${item.tone}-${item.text}`}>
          <Swatch tone={item.tone} x={x} y={y + 2} />
          <text
            data-part="legend-text"
            x={x + SWATCH + 6}
            y={y + 11}
            fontSize={SIZE.label}
            className="fill-text-secondary font-body"
          >
            {item.text}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Tick labels under an axis; the end labels are kept inside the figure. */
export function TickLabels({
  ticks,
  x,
  y,
  width,
}: {
  ticks: readonly AxisTick[];
  x: (value: number) => number;
  y: number;
  width: number;
}) {
  return (
    <g data-part="ticks">
      {ticks.map((tick) => {
        const at = x(tick.value);
        const half = textWidth(tick.label, SIZE.tick) / 2;
        const anchor = at - half < 0 ? "start" : at + half > width ? "end" : "middle";
        return (
          <text
            key={tick.value}
            data-part="tick"
            x={anchor === "start" ? Math.max(at, 0) : anchor === "end" ? Math.min(at, width) : at}
            y={y}
            textAnchor={anchor}
            fontSize={SIZE.tick}
            className="fill-text-tertiary font-mono"
          >
            {tick.label}
          </text>
        );
      })}
    </g>
  );
}

/** A line under the axis that states where a cut axis starts. */
export function AxisNote({ lines, y }: { lines: readonly string[]; y: number }) {
  if (!lines.length) return null;
  return (
    <text data-part="axis-note" x="0" y={y} fontSize={SIZE.tick} className="fill-text-tertiary">
      {lines.map((line, at) => (
        <tspan key={`${String(at)}-${line}`} x="0" y={y + at * 14}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * Grid lines at the kept ticks, drawn only over `bands` (the whole plot when wide; each row's mark
 * band when narrow, so no line runs through a label above its mark). `strong` is the base line.
 */
export function Grid({
  ticks,
  x,
  bands,
  strong,
}: {
  ticks: readonly AxisTick[];
  x: (value: number) => number;
  bands: readonly (readonly [number, number])[];
  strong: number | null;
}) {
  return (
    <g data-part="grid">
      {ticks.flatMap((tick) =>
        bands.map(([top, bottom]) => (
          <line
            key={`${String(tick.value)}-${String(top)}`}
            x1={x(tick.value)}
            x2={x(tick.value)}
            y1={top}
            y2={bottom}
            className={tick.value === strong ? "stroke-text-tertiary" : "stroke-border-hairline"}
          />
        )),
      )}
    </g>
  );
}

/** A card-coloured outline behind text, so a connector crossing a label never cuts its words. */
export const HALO = {
  strokeWidth: 5,
  strokeLinejoin: "round",
  paintOrder: "stroke",
} as const;
/** The class that colours `HALO`. */
export const HALO_CLASS = "stroke-surface-card";
