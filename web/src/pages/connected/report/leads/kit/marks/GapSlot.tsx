import { useId, type ReactNode } from "react";
import { cx } from "@/utils/cx";
import { GapPattern } from "../../../overview/figureParts";
import { useFigureWidth } from "../useWidth";
import { LINE, SIZE, svgId, textWidth, wrap } from "./text";

/** The chip's padding around its text, and its line pitch. */
const CHIP_PAD = 4;

/** The lines a slot's `text` is written in at `width`, on its solid chip. */
const chipLines = (text: string, width: number) => wrap(text, Math.max(40, width - 4 * CHIP_PAD));

/**
 * The height a `GapSlot` takes: its own `height`, or more when its `text` needs room for the
 * chip (the chip's lines plus padding, inside the hatch).
 */
export function gapSlotHeight(width: number, height: number, text?: string) {
  if (!text) return height;
  return Math.max(height, chipLines(text, width).length * LINE + 4 * CHIP_PAD);
}

/**
 * The hatched not-known slot inside an SVG: where a figure would be drawn, for one that is not
 * stated. It carries its own hatch, so it can sit in any mark. Never zero, never blank: `reason`
 * is on `data-gap` for tests; `text`, when given, is drawn on a SOLID chip (card fill, 12 px,
 * padded) inside the slot, so no text ever sits on the hatch. Without `text` the mark writes the
 * reason beside the slot. This is the one hatched gap style of the leads (`GapChip` is its HTML
 * form).
 */
export function GapSlot({
  x,
  y,
  width,
  height,
  reason,
  text,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The stated reason, on `data-gap` for tests; omitted for a legend swatch. */
  reason?: string;
  /** Words to draw on the slot's solid chip (`reasonText(reason)` as a rule). */
  text?: string;
}) {
  const id = svgId(useId(), "gap");
  const wide = Math.max(width, 8);
  const lines = text ? chipLines(text, wide) : [];
  const tall = gapSlotHeight(wide, height, text);
  const chipWidth = Math.min(
    wide - 2 * CHIP_PAD,
    Math.max(...lines.map((line) => textWidth(line))) + 2 * CHIP_PAD,
  );
  return (
    <g {...(reason === undefined ? {} : { "data-gap": reason })}>
      <defs>
        <GapPattern id={id} />
      </defs>
      <rect
        x={x}
        y={y}
        width={wide}
        height={tall}
        rx="2"
        fill={`url(#${id})`}
        strokeWidth="1"
        strokeDasharray="3 2"
        className="stroke-border-gap"
      />
      {lines.length > 0 && (
        <g data-part="gap-chip">
          <rect
            x={x + CHIP_PAD}
            y={y + CHIP_PAD}
            width={chipWidth}
            height={tall - 2 * CHIP_PAD}
            rx="2"
            className="fill-surface-card"
          />
          <text
            data-part="reason"
            x={x + 2 * CHIP_PAD}
            y={y + 2 * CHIP_PAD + 10}
            fontSize={SIZE.label}
            className="fill-gap-text font-body"
          >
            {lines.map((line, at) => (
              <tspan
                key={`${String(at)}-${line}`}
                x={x + 2 * CHIP_PAD}
                y={y + 2 * CHIP_PAD + 10 + at * LINE}
              >
                {line}
              </tspan>
            ))}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * The hatched gap slot in HTML, for a list or a stat: the hatch with the reason on a solid chip
 * (card fill, 12 px, padded), so the words never sit on the texture. The same style as `GapSlot`.
 */
export function GapChip({ reason, className }: { reason: string; className?: string }) {
  return (
    <span
      data-gap={reason}
      className={cx(
        "gap-hatch inline-flex min-h-8 max-w-full items-center rounded-ds-xs border border-dashed border-border-gap p-1",
        className,
      )}
    >
      <span className="rounded-ds-xs bg-surface-card px-1.5 py-0.5 text-caption font-normal text-pretty text-gap-text wrap-anywhere">
        {reason}
      </span>
    </span>
  );
}

/**
 * A measured box for one mark: `children` gets the box's pixel width (the fallback before the
 * first measure and in jsdom) and draws at it.
 */
export function Measured({
  fallback,
  children,
}: {
  fallback: number;
  children: (width: number) => ReactNode;
}) {
  const [ref, width] = useFigureWidth(fallback);
  return (
    <div ref={ref} className="w-full min-w-0">
      {children(width)}
    </div>
  );
}
