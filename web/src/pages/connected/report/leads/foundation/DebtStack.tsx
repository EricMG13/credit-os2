import { cx } from "@/utils/cx";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import { GapSlot, LINE, Measured, SIZE } from "../kit/marks";
import { Legend, type LegendEntry } from "../kit/marks/Legend";
import type { LeadProps } from "../types";
import {
  stackLayout,
  stackReading,
  stackTable,
  type StackLayout,
  type StackSegment,
} from "./debtStackGeometry";
import { debtStack, figureGap, type DebtStack } from "./foundationData";

const LABEL = "Debt stack";
/** The figure's width before the first measure (and in jsdom): the span-6 tile at 1128 px. */
const FALLBACK = 508;

/** C6: the segment's fill slot by its stated ranking; 5 and above share the last slot. */
const RANK_SLOT = [3, 4, 5, 6] as const;
const slotOf = (ranking: number) => RANK_SLOT[ranking - 1] ?? 8;

/** Literal class names, so Tailwind sees them. */
const FILL: Record<number, string> = {
  3: "fill-category-3",
  4: "fill-category-4",
  5: "fill-category-5",
  6: "fill-category-6",
  8: "fill-category-8",
};
const TONE = {
  3: "category-3",
  4: "category-4",
  5: "category-5",
  6: "category-6",
  8: "category-8",
} as const;

/** One legend entry per ranking present, ascending, then the hatch for a stated gap. */
function legendOf(stack: DebtStack): LegendEntry[] {
  const ranks = [...new Set(stack.facilities.map((f) => f.ranking))].sort((a, b) => a - b);
  return [
    ...ranks.map((ranking) => ({
      kind: "square" as const,
      tone: TONE[slotOf(ranking)],
      text: `Ranking ${String(ranking)}`,
    })),
    ...(stack.facilities.some((f) => f.amount.kind === "gap")
      ? [{ kind: "hatch" as const, text: "Not stated" }]
      : []),
  ];
}

function Segment({ segment, layout }: { segment: StackSegment; layout: StackLayout }) {
  const { facility } = segment;
  if (segment.kind === "gap" || segment.kind === "words")
    return segment.kind === "gap" ? (
      <GapSlot
        x={0.5}
        y={segment.y + 1}
        width={layout.column - 1}
        height={segment.height - 2}
        reason={facility.amount.text}
      />
    ) : (
      <rect
        data-words={facility.facility}
        x={0.75}
        y={segment.y + 1}
        width={layout.column - 1.5}
        height={segment.height - 2}
        rx="2"
        strokeWidth="1"
        strokeDasharray="2 2"
        className="fill-surface-card stroke-border-hairline"
      />
    );
  if (segment.kind === "zero")
    return (
      <line
        data-segment={facility.facility}
        data-amount={facility.amount.text}
        x1={0}
        x2={layout.column}
        y1={segment.y}
        y2={segment.y}
        strokeWidth="1.5"
        className="stroke-text-tertiary"
      />
    );
  return (
    <rect
      data-segment={facility.facility}
      data-amount={facility.amount.text}
      x={0}
      y={segment.y}
      width={layout.column}
      height={Math.max(0.5, segment.height - 1)}
      rx="1.5"
      className={FILL[slotOf(facility.ranking)]}
    />
  );
}

function Words({ segment, layout }: { segment: StackSegment; layout: StackLayout }) {
  const { textX } = layout;
  const first = segment.textTop + 12;
  const detailTop = first + segment.name.length * LINE;
  const reasonTop = detailTop + segment.detail.length * LINE;
  const stated = segment.kind === "amount" || segment.kind === "zero";
  return (
    <g data-facility={segment.facility.facility}>
      <text
        data-part="label"
        fontSize={SIZE.label}
        className="fill-text-primary font-body font-medium"
      >
        {segment.name.map((line, at) => (
          <tspan key={`${String(at)}-${line}`} x={textX} y={first + at * LINE}>
            {line}
          </tspan>
        ))}
      </text>
      {stated && !layout.narrow && (
        <text
          data-part="value"
          x={layout.width}
          y={first}
          textAnchor="end"
          fontSize={SIZE.value}
          className="fill-text-primary font-mono font-medium"
        >
          {segment.amountText}
        </text>
      )}
      <text data-part="detail" fontSize={SIZE.label} className="fill-text-secondary font-body">
        {segment.detail.map((line, at) => (
          <tspan key={`${String(at)}-${line}`} x={textX} y={detailTop + at * LINE}>
            {line}
          </tspan>
        ))}
      </text>
      {segment.reason.length > 0 && (
        <text
          data-part={segment.kind === "gap" ? "reason" : "words"}
          fontSize={SIZE.label}
          className={cx(
            "font-body",
            segment.kind === "gap" ? "fill-gap-text" : "fill-text-secondary",
          )}
        >
          {segment.reason.map((line, at) => (
            <tspan key={`${String(at)}-${line}`} x={textX} y={reasonTop + at * LINE}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

function StackFigure({ stack, width }: { stack: DebtStack; width: number }) {
  const layout = stackLayout(stack, width);
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={stackReading(stack)}
      data-layout={layout.narrow ? "narrow" : "wide"}
      className="block"
    >
      <g>
        {layout.segments.map((segment) => (
          <g key={`${String(segment.facility.line)}-${segment.facility.facility}`}>
            <Segment segment={segment} layout={layout} />
            <path
              data-part="leader"
              d={`M${String(layout.column + 2)} ${String(segment.y + segment.height / 2)}L${String(layout.textX - 6)} ${String(segment.textMiddle)}`}
              fill="none"
              strokeWidth="1"
              className="stroke-border-hairline"
            />
            <Words segment={segment} layout={layout} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * The debt stack: every facility in the module's ranking order, first claim at the top, each
 * segment as tall as its stated amount on one scale, with its name, amount, ranking, secured flag
 * and cumulative leverage as written beside it. Nothing is said about priority beyond the stated
 * ranking and secured flag; the module's own note on the stack is printed under it.
 */
export function DebtStackTile({ lead }: { lead: LeadProps }) {
  const stack = debtStack(lead.entry);
  if (!stack)
    return (
      <GapTile span={6} label={LABEL} kicker={LABEL}>
        {figureGap(lead.entry, "stack") ?? "This page could not read the debt stack."}
      </GapTile>
    );
  return (
    <FigureTile
      props={lead}
      span={6}
      label={LABEL}
      kicker={`Debt stack · ${stack.unit}`}
      title="Debt by ranking"
      line={stack.tableLine}
      source="the debt stack"
      table={stackTable(stack)}
      notes={stack.notes}
    >
      <Legend items={legendOf(stack)} />
      <Measured fallback={FALLBACK}>
        {(width) => <StackFigure stack={stack} width={width} />}
      </Measured>
    </FigureTile>
  );
}
