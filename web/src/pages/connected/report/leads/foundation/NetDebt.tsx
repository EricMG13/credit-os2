import { useId, useState } from "react";
import { cx } from "@/utils/cx";
import { Figure, Well } from "../../overview/Tile";
import { latestReported, unplacedNotes } from "../kit/tables";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import { GapSlot, LINE, SIZE, useFigureWidth } from "../kit/marks";
import { Grid, HALO, HALO_CLASS, TickLabels } from "../kit/marks/parts";
import { safeText } from "../kit/reader";
import type { LeadProps } from "../types";
import { figureGap, netDebtView, type NetDebtView, type ProForma } from "./foundationData";
import {
  adjustmentsTable,
  barsLayout,
  barsReading,
  liquidityLines,
  netDebtTable,
  proFormaBars,
  stripDrawn,
  stripEntries,
  stripGaps,
  stripLayout,
  stripList,
  stripReading,
  type LiquidityLine,
  type NetBar,
  type Stated,
  type StripEntry,
  type StripRow,
} from "./netDebtGeometry";

const LABEL = "Net debt";

const MARK_FILL = {
  prior: "fill-chart-3",
  current: "fill-chart-1",
  proForma: "fill-warning-mark",
} as const;

const NET_FILL = {
  prior: "fill-chart-3",
  current: "fill-chart-1",
  proForma: "fill-warning-mark",
} as const;
const CASH = {
  prior: "fill-surface-card stroke-chart-3",
  current: "fill-surface-selected stroke-chart-1",
  proForma: "",
} as const;

/** One period's (or the pro forma's) row; `left` is where the plot, and its reading, start. */
function BarRow({ bar, left }: { bar: NetBar; left: number }) {
  const pro = bar.kind === "proForma";
  return (
    <g data-row={bar.label}>
      <text
        data-part="label"
        x="0"
        y={bar.top + 12}
        fontSize={SIZE.label}
        className={cx("font-body font-medium", pro ? "fill-warning-text" : "fill-text-primary")}
      >
        {bar.label}
      </text>
      {bar.net && (
        <rect
          data-bar={bar.label}
          data-value={bar.net.value}
          {...(pro ? { "data-pro-forma": "" } : {})}
          x={bar.net.x}
          y={bar.barY}
          width={Math.max(bar.net.width, 1.5)}
          height="16"
          rx={Math.min(2, bar.net.width / 2)}
          className={NET_FILL[bar.kind]}
        />
      )}
      {bar.seam !== null && (
        <line
          data-seam={bar.seam}
          x1={bar.seam}
          x2={bar.seam}
          y1={bar.barY}
          y2={bar.barY + 16}
          strokeWidth="2"
          className="stroke-surface-card"
        />
      )}
      {bar.cash && (
        <rect
          data-cash={bar.label}
          x={bar.cash.x + 0.5}
          y={bar.barY + 0.5}
          width={Math.max(bar.cash.width - 1, 1)}
          height="15"
          rx="2"
          className={CASH[bar.kind]}
        />
      )}
      {bar.netGap && (
        <GapSlot
          x={bar.netGap.x}
          y={bar.barY + 1}
          width={bar.netGap.width}
          height={14}
          reason={bar.netGap.reason}
        />
      )}
      {bar.cashGap && (
        <GapSlot
          x={bar.cashGap.x}
          y={bar.barY + 1}
          width={bar.cashGap.width}
          height={14}
          reason={bar.cashGap.reason}
        />
      )}
      {bar.gross !== null && (
        <line
          data-gross={bar.label}
          x1={bar.gross}
          x2={bar.gross}
          y1={bar.barY - 3}
          y2={bar.barY + 19}
          strokeWidth="1.5"
          className="stroke-text-primary"
        />
      )}
      <text
        data-part="reading"
        x={left}
        y={bar.barY + 16 + 15}
        fontSize={SIZE.label}
        className={cx("font-body", bar.netGap ? "fill-gap-text" : "fill-text-secondary")}
      >
        {bar.reading.map((line, at) => (
          <tspan key={`${String(at)}-${line}`} x={left} y={bar.barY + 31 + at * LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function Bars({ view, proForma }: { view: NetDebtView; proForma: readonly ProForma[] }) {
  const [ref, width] = useFigureWidth(412);
  const layout = barsLayout(view, proForma, width);
  return (
    <div ref={ref} className="w-full min-w-0">
      <svg
        viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
        width="100%"
        role="img"
        aria-label={barsReading(view, proForma)}
        data-layout={layout.beside ? "wide" : "narrow"}
        className="block"
      >
        <Grid
          ticks={layout.ticks}
          x={layout.x}
          strong={0}
          bands={layout.bars.map((bar) => [bar.barY - 3, bar.barY + 19] as const)}
        />
        {layout.bars.map((bar, at) => (
          <BarRow key={`${bar.label}-${String(at)}`} bar={bar} left={layout.left} />
        ))}
        <TickLabels ticks={layout.ticks} x={layout.x} y={layout.plotBottom + 16} width={width} />
      </svg>
    </div>
  );
}

/** One strip row: its label, its mark (or the hatched slot and the reason on a plate), its figure. */
function StripRowMark({ row }: { row: StripRow }) {
  const { entry } = row;
  return (
    <g data-row={entry.label}>
      <text
        data-part="label"
        x="0"
        y={row.labelY}
        fontSize={SIZE.label}
        className={cx(
          "font-body",
          HALO_CLASS,
          entry.proForma ? "fill-warning-text font-medium" : "fill-text-primary",
        )}
        {...HALO}
      >
        {row.label.map((line, at) => (
          <tspan key={`${String(at)}-${line}`} x="0" y={row.labelY + at * LINE}>
            {line}
          </tspan>
        ))}
      </text>
      {row.x !== null && row.value !== null && (
        <>
          <circle
            data-mark={entry.label}
            data-value={row.value}
            cx={row.x}
            cy={row.centre}
            r="5"
            className={MARK_FILL[row.tone]}
          />
          <text
            data-part="value"
            x={row.x + 11}
            y={row.centre + 4}
            fontSize={SIZE.value}
            className={cx("fill-text-primary font-mono", HALO_CLASS)}
            {...HALO}
          >
            {row.valueText}
          </text>
        </>
      )}
      {row.gap && (
        <GapSlot
          x={row.gap.x}
          y={row.gap.y}
          width={row.gap.width}
          height={row.gap.height}
          reason={row.gap.reason}
          text={row.gap.reason}
        />
      )}
    </g>
  );
}

/** The rows of net debt / EBITDA on one axis: the periods joined, then a labelled mark per adjustment. */
function StripFigure({
  entries,
  width,
  unplaced,
}: {
  entries: readonly StripEntry[];
  width: number;
  unplaced: readonly string[];
}) {
  const layout = stripLayout(entries, width, unplaced);
  return (
    <svg
      data-strip=""
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={stripReading(entries)}
      className="block"
    >
      <Grid
        ticks={layout.ticks}
        x={layout.x}
        strong={null}
        bands={[[layout.plotTop, layout.plotBottom]]}
      />
      {layout.reference && (
        <line
          data-reference=""
          x1={layout.reference.x}
          x2={layout.reference.x}
          y1={layout.reference.top}
          y2={layout.plotBottom}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="stroke-text-tertiary"
        />
      )}
      {layout.joins.map(({ from, to }) => {
        const [a, b] = [layout.rows[from], layout.rows[to]];
        return a?.x != null && b?.x != null ? (
          <line
            key={`${String(from)}-${String(to)}`}
            data-join=""
            x1={a.x}
            y1={a.centre}
            x2={b.x}
            y2={b.centre}
            strokeWidth="2"
            className="stroke-chart-3"
          />
        ) : null;
      })}
      {layout.rows.map((row) => (
        <StripRowMark key={row.entry.label} row={row} />
      ))}
      <TickLabels ticks={layout.ticks} x={layout.x} y={layout.plotBottom + 16} width={width} />
    </svg>
  );
}

/**
 * Net debt / EBITDA on its own scale: each reported period and each stated adjustment's pro forma
 * as a labelled mark in handoff order; the stated figures as a list where fewer than two can be
 * set against each other.
 */
function Strip({ view }: { view: NetDebtView }) {
  const [ref, width] = useFigureWidth(412);
  const entries = stripEntries(view);
  const list = stripList(entries);
  if (!list.length && entries.every((entry) => entry.cell === null)) return null;
  return (
    <div ref={ref} className="flex w-full min-w-0 flex-col gap-1.5">
      <h4 className="text-caption font-medium text-text-primary">
        Net debt / EBITDA
        <span className="font-normal text-text-tertiary"> · own scale</span>
      </h4>
      {stripDrawn(entries) ? (
        <StripFigure entries={entries} width={width} unplaced={view.unplaced} />
      ) : (
        <>
          <ul
            aria-label={stripReading(entries)}
            className="flex flex-wrap gap-x-4 gap-y-1 text-small"
          >
            {list.map((mark) => (
              <li key={mark.label} className="flex items-baseline gap-1.5">
                <span className="text-caption text-text-secondary">{mark.label}</span>
                <Figure>{mark.text}</Figure>
              </li>
            ))}
          </ul>
          {stripGaps(entries).map((gap) => (
            <p key={gap} className="text-caption wrap-anywhere text-gap-text">
              {gap}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

/** A table cell: a stated figure in mono; a gap or words in a small chip holding the module's words. */
function AdjustmentCell({ text, gap }: { text: string; gap: boolean }) {
  return gap && text !== "—" ? (
    <span
      data-gap-chip=""
      className="inline-block rounded-ds-xs border border-border-gap bg-surface-card px-1.5 py-0.5 text-caption wrap-anywhere text-gap-text"
    >
      {text}
    </span>
  ) : (
    <span>{text}</span>
  );
}

/**
 * The stated adjustments, every one in handoff order, as a compact headed table behind an
 * "Adjustments" button (32 px, 44 px at 480 px and below; the token focus ring): none is chosen.
 */
function Adjustments({ view }: { view: NetDebtView }) {
  const [open, setOpen] = useState(false);
  const id = `adjustments-${useId().replace(/[^\w-]/g, "")}`;
  const table = adjustmentsTable(view);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((was) => !was);
        }}
        className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 self-start rounded-ds-sm border border-border-subtle bg-surface-card px-2.5 text-caption font-medium whitespace-nowrap text-text-secondary outline-focus-ring transition duration-100 ease-linear hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11"
      >
        Adjustments
        <span aria-hidden="true" className={cx("text-text-tertiary", open && "rotate-180")}>
          ▾
        </span>
      </button>
      <div id={id} data-adjustments="" hidden={!open} className="w-full min-w-0 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-caption">
          <caption className="sr-only">{table.caption}</caption>
          <thead>
            <tr>
              {table.headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="border-b border-border-hairline px-2 py-1.5 text-left font-medium text-text-tertiary"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, at) => (
              <tr key={`${row[0]?.text ?? ""}-${String(at)}`}>
                {row.map((cell, column) => (
                  <td
                    key={table.headers[column] ?? String(column)}
                    className={cx(
                      "border-b border-border-hairline px-2 py-1.5 align-top",
                      column >= 2 && !cell.gap ? "text-right font-mono tabular-nums" : "text-left",
                    )}
                  >
                    <AdjustmentCell {...cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A stated figure in mono; a gap or words as written, in the gap ink. */
function Value({ value, strong = false }: { value: Stated; strong?: boolean }) {
  return value.number ? (
    <Figure className={cx(strong && "font-medium")}>{value.text}</Figure>
  ) : (
    <span className="text-gap-text">{value.text}</span>
  );
}

/** Cash and undrawn facilities as stated; one line when both are the same stated gap. */
function Parts({ line }: { line: LiquidityLine }) {
  const { cash, undrawn } = line;
  if (!cash && !undrawn) return null;
  if (cash && undrawn && !cash.number && !undrawn.number && cash.text === undrawn.text)
    return <span className="text-gap-text">{cash.text}</span>;
  const missing = { text: "not stated", number: false };
  return (
    <span>
      {"cash "}
      <Value value={cash ?? missing} />
      {" · undrawn committed facilities "}
      <Value value={undrawn ?? missing} />
    </span>
  );
}

/** The stated liquidity per period: the handoff's own total where it writes one, and its parts. */
function Liquidity({ view }: { view: NetDebtView }) {
  const lines = liquidityLines(view);
  if (!lines.length) return null;
  const total = view.liquidityTotal?.label;
  return (
    <Well>
      <div role="group" aria-label="Liquidity" className="flex flex-col gap-1.5 text-caption">
        <p className="font-medium text-text-primary">
          Liquidity
          {total && <span className="font-normal text-text-tertiary">{` · ${total}`}</span>}
        </p>
        <ul className="flex flex-col gap-1">
          {lines.map((line) => (
            <li
              key={line.label}
              data-liquidity={line.label}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-text-secondary"
            >
              <span className="w-16 flex-none text-text-primary">{line.label}</span>
              {line.total && <Value value={line.total} strong />}
              <Parts line={line} />
            </li>
          ))}
        </ul>
      </div>
    </Well>
  );
}

function legendOf(view: NetDebtView, proForma: readonly ProForma[]) {
  const labels = view.periods.map((p) => p.label);
  // The latest reported period is the primary bar; a pro forma or forecast period never is.
  const latest = latestReported(labels, (label) => label);
  const earlier = labels.filter((label) => label !== latest);
  const gap = view.periods.some((p) => [p.net, p.cash, p.gross].some((c) => c.kind !== "number"));
  return [
    ...(earlier.length ? [{ tone: "prior" as const, text: `${earlier.join(", ")} net debt` }] : []),
    ...(latest ? [{ tone: "primary" as const, text: `${latest} net debt` }] : []),
    { tone: "undated" as const, text: "Cash, to gross debt" },
    ...(proForma.length ? [{ tone: "signal" as const, text: "Pro forma net debt" }] : []),
    ...(gap ? [{ tone: "gap" as const, text: "Not stated" }] : []),
  ];
}

/** Tile 3: net debt per stated period with cash to gross debt, the stated adjustments, liquidity. */
export function NetDebtTile({ lead }: { lead: LeadProps }) {
  const view = netDebtView(lead.entry);
  if (!view)
    return (
      <GapTile span={5} label={LABEL} kicker={LABEL}>
        {figureGap(lead.entry, "netDebt") ?? ""}
      </GapTile>
    );
  const proForma = proFormaBars(view);
  const none = view.noAdjustmentsWords;
  return (
    <FigureTile
      props={lead}
      span={5}
      label={LABEL}
      kicker={`Net debt, ${view.unit} · ${view.periods.map((p) => p.label).join(view.ordered ? " → " : ", ")}`}
      title={LABEL}
      line={view.tableLine}
      source="net debt"
      legend={legendOf(view, proForma)}
      table={netDebtTable(view)}
      notes={unplacedNotes(view.unplaced, view.leverageStrip.length)}
    >
      <Bars view={view} proForma={proForma} />
      <Strip view={view} />
      {view.adjustments.length > 0 && <Adjustments view={view} />}
      {view.noAdjustments && none && (
        <p data-no-adjustments className="text-caption wrap-anywhere text-text-secondary">
          {[`${safeText(none.event)}.`, none.basis ?? ""].join(" ").trim()}
        </p>
      )}
      <Liquidity view={view} />
    </FigureTile>
  );
}
