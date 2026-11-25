import { unplacedNotes } from "../kit/tables";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import { GapSlot, Measured, NARROW, SIZE, textWidth, wrap } from "../kit/marks";
import { safeText } from "../kit/reader";
import type { LeadProps } from "../types";
import { periodStrip, type PeriodState, type PeriodStrip, type StripPeriod } from "./periodsData";

const LABEL = "Periods";
/** The figure's width before the first measure (and in jsdom): the span-7 tile at 1128 px. */
const FALLBACK = 603;
const SLOT_MOST = 168;
const MATRIX_ROW = 34;

/** "A", "A and B", "A, B and C". */
const listOf = (labels: readonly string[]) =>
  labels.length > 1
    ? `${labels.slice(0, -1).join(", ")} and ${labels.at(-1) ?? ""}`
    : (labels[0] ?? "");

/** The words under a period's mark. */
function stateWords(period: StripPeriod): string {
  if (period.state.kind === "gap") return period.state.reasons.join(" ");
  if (period.compared === "to") return period.latest ? "Latest, compared" : "Compared";
  if (period.compared === "from") return "Compared";
  switch (period.state.kind) {
    case "figures":
      return period.partly ? "Partly stated" : "Stated";
    case "words":
      return "Stated in words";
    case "none":
      return "No figure";
    case "unstated":
      return "Not shown";
  }
}

/** A figure's state for one period, in the table view. */
function cellWords(state: PeriodState | undefined) {
  switch (state?.kind) {
    case "figures":
      return "Stated";
    case "gap":
      return state.reasons.join(" ");
    case "words":
      return "Stated in words";
    default:
      return "Not in this figure";
  }
}

/** The matrix of each figure by period is drawn when it says more than the strip alone. */
const showsMatrix = (strip: PeriodStrip) =>
  strip.figures.length > 0 &&
  (strip.axis.filter((period) => period.state.kind !== "unstated").length >= 3 ||
    strip.axis.some((period) => period.partly));

function layoutOf(strip: PeriodStrip, width: number) {
  const matrix = showsMatrix(strip);
  const wide = width >= NARROW;
  const labelWidth =
    matrix && wide
      ? Math.max(...strip.figures.map((figure) => textWidth(figure.figure, SIZE.label))) + 16
      : 0;
  const room = width - labelWidth;
  const slot = Math.min(SLOT_MOST, room / Math.max(1, strip.axis.length));
  const centre = (at: number) => labelWidth + slot * (at + 0.5);
  const lines = strip.axis.map((period) =>
    wrap(stateWords(period), slot - 10, SIZE.tick).slice(0, period.state.kind === "gap" ? 5 : 2),
  );
  const stripBottom = 52 + (Math.max(1, ...lines.map((line) => line.length)) - 1) * 13 + 8;
  const rowsTop = stripBottom + 18;
  const rowHeight = wide ? MATRIX_ROW - 10 : MATRIX_ROW;
  const height = matrix
    ? rowsTop + (strip.figures.length - 1) * rowHeight + (wide ? 10 : 22)
    : stripBottom;
  return { matrix, wide, labelWidth, slot, centre, lines, stripBottom, rowsTop, rowHeight, height };
}

function Mark({ period, x }: { period: StripPeriod; x: number }) {
  const state = period.state.kind;
  if (state === "gap")
    return (
      <GapSlot
        x={x - 24}
        y={23}
        width={48}
        height={14}
        reason={`${period.label}: ${stateWords(period)}`}
      />
    );
  if (state === "unstated")
    return <line x1={x} x2={x} y1={25} y2={35} strokeWidth="1.5" className="stroke-border-gap" />;
  if (period.compared)
    return <circle data-mark="compared" cx={x} cy={30} r={6} className="fill-chart-1" />;
  // Stated in full: a solid dot; partly stated: a ring; words only or no figure: a dashed ring.
  if (state === "figures" && !period.partly)
    return <circle data-mark="stated" cx={x} cy={30} r={5} className="fill-chart-3" />;
  return (
    <circle
      data-mark={state === "figures" ? "partly" : state}
      cx={x}
      cy={30}
      r={5}
      strokeWidth="2"
      strokeDasharray={state === "figures" ? undefined : "2 2"}
      className="fill-surface-card stroke-chart-3"
    />
  );
}

function MatrixCell({
  state,
  x,
  y,
  name,
}: {
  state: PeriodState | undefined;
  x: number;
  y: number;
  name: string;
}) {
  const kind = state?.kind ?? "none";
  if (kind === "figures")
    return (
      <circle data-cell={name} data-state={kind} cx={x} cy={y} r={4} className="fill-chart-1" />
    );
  if (kind === "gap")
    return (
      <g data-cell={name} data-state={kind}>
        <GapSlot x={x - 14} y={y - 5} width={28} height={10} />
      </g>
    );
  return (
    <text
      data-cell={name}
      data-state={kind}
      x={x}
      y={y + 4}
      textAnchor="middle"
      fontSize={SIZE.tick}
      className="fill-text-tertiary font-body"
    >
      {kind === "words" ? "words" : "–"}
    </text>
  );
}

function stripReading(strip: PeriodStrip) {
  const parts = strip.axis.map((period) => `${period.label} ${stateWords(period).toLowerCase()}`);
  const rows = showsMatrix(strip)
    ? strip.figures.map(
        (figure) =>
          `${figure.figure}: ${strip.axis
            .filter((period) => period.state.kind !== "unstated")
            .map(
              (period) => `${period.label} ${cellWords(figure.states[period.label]).toLowerCase()}`,
            )
            .join(", ")}`,
      )
    : [];
  return `Periods the figures cover: ${parts.join("; ")}.${rows.length ? ` ${rows.join(". ")}.` : ""}`;
}

/** True when every period label fits its slot on the time axis; otherwise the periods are rows. */
function fitsAxis(strip: PeriodStrip, width: number) {
  const { slot } = layoutOf(strip, width);
  return strip.axis.every((period) => textWidth(period.label, SIZE.label) + 6 <= slot);
}

const ROW = 22;

/**
 * The narrow fallback for a long list of periods: one period per row on a vertical time axis, its
 * label at the left, its mark on the axis, its state beside; the per-figure matrix is in the table.
 */
function StripRows({ strip, width }: { strip: PeriodStrip; width: number }) {
  const labelWidth = Math.max(...strip.axis.map((p) => textWidth(p.label, SIZE.label))) + 10;
  const axisX = labelWidth + 8;
  const textX = axisX + 16;
  const lines = strip.axis.map((period) =>
    wrap(stateWords(period), Math.max(60, width - textX), SIZE.tick).slice(0, 4),
  );
  const tops = lines.reduce<number[]>(
    (all, line, at) => [...all, (all[at] ?? 4) + Math.max(ROW, line.length * 13 + 8)],
    [4],
  );
  const centre = (at: number) => (tops[at] ?? 0) + 10;
  const from = strip.axis.findIndex((period) => period.compared === "from");
  const to = strip.axis.findIndex((period) => period.compared === "to");
  const height = tops.at(-1) ?? ROW;
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width="100%"
      role="img"
      aria-label={stripReading(strip)}
      data-layout="rows"
    >
      <line
        x1={axisX}
        x2={axisX}
        y1={centre(0)}
        y2={centre(strip.axis.length - 1)}
        className="stroke-border-hairline"
      />
      {from >= 0 && to >= 0 && (
        <line
          data-comparison
          x1={axisX}
          x2={axisX}
          y1={centre(from)}
          y2={centre(to)}
          strokeWidth="2.5"
          className="stroke-chart-1"
        />
      )}
      {strip.axis.map((period, at) => (
        <g key={period.label} data-period={period.label} data-state={period.state.kind}>
          <text
            data-part="label"
            x={0}
            y={centre(at) + 4}
            fontSize={SIZE.label}
            fontWeight={period.compared ? 600 : 400}
            className="fill-text-primary font-mono"
          >
            {period.label}
          </text>
          <g transform={`translate(${String(axisX)} ${String(centre(at) - 30)})`}>
            <Mark period={period} x={0} />
          </g>
          <text
            data-part="state"
            fontSize={SIZE.tick}
            className={
              period.state.kind === "gap"
                ? "fill-gap-text font-body"
                : "fill-text-secondary font-body"
            }
          >
            {(lines[at] ?? []).map((line, n) => (
              <tspan key={`${line}-${String(n)}`} x={textX} y={centre(at) + 4 + n * 13}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Strip({ strip, width }: { strip: PeriodStrip; width: number }) {
  if (!fitsAxis(strip, width)) return <StripRows strip={strip} width={width} />;
  return (
    <>
      <StripAxis strip={strip} width={width} />
      {showsMatrix(strip) && (
        <p className="mt-2 text-small text-text-secondary">
          A dash: the figure shows no value for the period.
        </p>
      )}
    </>
  );
}

function StripAxis({ strip, width }: { strip: PeriodStrip; width: number }) {
  const l = layoutOf(strip, width);
  const from = strip.axis.findIndex((period) => period.compared === "from");
  const to = strip.axis.findIndex((period) => period.compared === "to");
  const first = l.centre(0);
  const last = l.centre(strip.axis.length - 1);
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(l.height)}`}
      width="100%"
      role="img"
      aria-label={stripReading(strip)}
      data-layout={l.wide ? "wide" : "narrow"}
    >
      {strip.axis.length > 1 && (
        <line x1={first} x2={last} y1={30} y2={30} className="stroke-border-hairline" />
      )}
      {from >= 0 && to >= 0 && (
        <line
          data-comparison
          x1={l.centre(from)}
          x2={l.centre(to)}
          y1={30}
          y2={30}
          strokeWidth="2.5"
          className="stroke-chart-1"
        />
      )}
      {strip.axis.map((period, at) => (
        <g key={period.label} data-period={period.label} data-state={period.state.kind}>
          <text
            data-part="label"
            x={l.centre(at)}
            y={14}
            textAnchor="middle"
            fontSize={SIZE.label}
            fontWeight={period.compared ? 600 : 400}
            className={
              period.state.kind === "unstated"
                ? "fill-text-tertiary font-mono"
                : "fill-text-primary font-mono"
            }
          >
            {period.label}
          </text>
          <Mark period={period} x={l.centre(at)} />
          <text
            data-part="state"
            textAnchor="middle"
            fontSize={SIZE.tick}
            className={
              period.state.kind === "gap"
                ? "fill-gap-text font-body"
                : "fill-text-secondary font-body"
            }
          >
            {(l.lines[at] ?? []).map((line, n) => (
              <tspan key={`${line}-${String(n)}`} x={l.centre(at)} y={52 + n * 13}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      {l.matrix && (
        <>
          <line
            x1={0}
            x2={width}
            y1={l.stripBottom + 4}
            y2={l.stripBottom + 4}
            className="stroke-border-hairline"
          />
          {strip.figures.map((figure, row) => {
            const top = l.rowsTop + row * l.rowHeight;
            const markY = l.wide ? top : top + 14;
            return (
              <g key={figure.figure} data-figure={figure.figure}>
                <text
                  data-part="figure"
                  x={0}
                  y={l.wide ? top + 4 : top}
                  fontSize={SIZE.label}
                  className="fill-text-secondary font-body"
                >
                  {figure.figure}
                </text>
                {strip.axis.map((period, at) =>
                  period.state.kind === "unstated" ? null : (
                    <MatrixCell
                      key={period.label}
                      name={`${figure.figure}|${period.label}`}
                      state={figure.states[period.label]}
                      x={l.centre(at)}
                      y={markY}
                    />
                  ),
                )}
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}

function tableOf(strip: PeriodStrip) {
  const labels = [
    ...strip.axis
      .filter((period) => period.state.kind !== "unstated")
      .map((period) => period.label),
    ...strip.apart.map((period) => period.label),
  ];
  return {
    caption: "Periods each figure's table states",
    headers: ["Figure", ...labels],
    rows: strip.figures.map((figure) => [
      figure.figure,
      ...labels.map((label) => cellWords(figure.states[label])),
    ]),
  };
}

/** The stated gaps the matrix hatches, with their words: "Cash conversion and Net debt, FY2022: …". */
function matrixGaps(strip: PeriodStrip) {
  if (!showsMatrix(strip)) return [];
  return strip.axis.flatMap((period) => {
    const byReason = new Map<string, string[]>();
    for (const figure of strip.figures) {
      const state = figure.states[period.label];
      if (state?.kind !== "gap") continue;
      const reason = state.reasons.join(" ");
      byReason.set(reason, [...(byReason.get(reason) ?? []), figure.figure]);
    }
    return [...byReason].map(
      ([reason, figures]) => `${listOf(figures)}, ${period.label}: ${reason}`,
    );
  });
}

function apartLine(strip: PeriodStrip) {
  if (!strip.apart.length) return null;
  const parts = strip.apart.map((period) =>
    period.figures.length
      ? `${period.label} (${listOf(period.figures)})`
      : `${period.label} (no figure shows a number for it)`,
  );
  return `Other kinds of period: ${listOf(parts)}.`;
}

/** Tile 7 of the financial foundation: the periods the handoff states, and which the figures show. */
export function PeriodsTile({ lead }: { lead: LeadProps }) {
  const strip = periodStrip(lead.entry);
  const gaps = strip.gaps.map((gap) => safeText(gap.reason));
  if (strip.axis.length === 0)
    return (
      <GapTile span={6} label={LABEL} kicker={LABEL}>
        {["This page could not read a period.", ...gaps].join(" ")}
      </GapTile>
    );
  const shown = strip.shown.length
    ? `Figures show ${listOf(strip.shown)}.`
    : "No figure states a number for any period.";
  const apart = apartLine(strip);
  const hatched = matrixGaps(strip);
  return (
    <FigureTile
      props={lead}
      span={6}
      label={LABEL}
      kicker="Periods the figures cover"
      title={LABEL}
      line={strip.line ?? undefined}
      source="the period tables"
      legend={
        showsMatrix(strip)
          ? [
              { tone: "primary", text: "Numbers stated" },
              ...(hatched.length ? [{ tone: "gap" as const, text: "Stated gap" }] : []),
            ]
          : []
      }
      notes={[...gaps, ...unplacedNotes(strip.unplaced, strip.axis.length + strip.apart.length)]}
      table={strip.figures.length ? tableOf(strip) : undefined}
    >
      <Measured fallback={FALLBACK}>{(width) => <Strip strip={strip} width={width} />}</Measured>
      <div className="flex flex-col gap-1 text-small text-text-secondary">
        <p>{shown}</p>
        {hatched.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {apart && <p>{apart}</p>}
      </div>
    </FigureTile>
  );
}
