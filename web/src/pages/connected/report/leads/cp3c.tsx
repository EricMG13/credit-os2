import { cx } from "@/utils/cx";
import { unitLabel, type Row } from "../../publishedReport";
import { fiscalYear, yearPrefix } from "../../visuals/scenarioPeriods";
import { ticks, type SourceTable } from "../../visuals/visualData";
import { Key } from "../overview/figureParts";
import { basisNotes, readCell, type Cell } from "../overview/figureData";
import { Bento, Tile } from "../overview/Tile";
import { withDraws } from "./draws";
import {
  Beside,
  CompactGap,
  GapCell,
  KeyValues,
  LaneTile,
  laneHasAxis,
  LeadFigure,
  LeadGap,
  statedGap,
  Trace,
} from "./parts";
import {
  chartOf,
  columnOf,
  eventsOf,
  leadHref,
  readerCell,
  readerCellOf,
  registerTable,
  rowName,
  drawsNothing,
  statedInProse,
} from "./read";
import type { LeadProps } from "./types";
import { ChartGap, writtenTable } from "./written";

const TITLE = "Refinancing need";
const MEASURES = ["Debt maturing", "Committed resources"] as const;
const TONE = ["bg-chart-1", "bg-chart-2"] as const;
/** The most years one axis holds; beyond it the rows are listed as written. */
const MOST_YEARS = 12;

/** A cell for a figure's reading: the figure as written, or "not supplied" with the reason. */
export const spoken = (cell: Cell) =>
  cell.value === null ? `not supplied${cell.reason ? ` (${cell.reason})` : ""}` : cell.text;

function needRows(table: SourceTable) {
  const [debt, resources] = MEASURES.map((name) => columnOf(table, name));
  const period = columnOf(table, "Period");
  if (debt === undefined || resources === undefined || [debt, resources, period].includes(-1))
    return null;
  const scope = table.rows.flatMap((row) => [row[debt] ?? "", row[resources] ?? ""]);
  return table.rows.map((row, at) => {
    const label = readerCell(row[period] ?? "") || "Period not stated";
    // A period the axis places: one whole year as the period rule reads it ("FY2026", "2026").
    const year = fiscalYear(label);
    return {
      period: label,
      prefix: year === null ? "" : yearPrefix(label, year),
      year,
      line: table.rowLines?.[at] ?? table.line,
      cells: [debt, resources].map((column) =>
        readerCellOf(readCell(row[column] ?? "", scope, row.at(-2) ?? "")),
      ),
    };
  });
}

type NeedRow = NonNullable<ReturnType<typeof needRows>>[number];
type Slot = { label: string; year: number; row: NeedRow | null };

/**
 * One slot per year from the first stated year to the last, each with its row or none; rows not
 * labelled by a year, or by a year another row also has, go to `unplaced` as written.
 */
function yearSlots(rows: readonly NeedRow[]) {
  const counts = new Map<number, number>();
  for (const row of rows)
    if (row.year !== null) counts.set(row.year, (counts.get(row.year) ?? 0) + 1);
  const placed = rows.filter((row) => row.year !== null && counts.get(row.year) === 1);
  const years = placed.map((row) => row.year ?? 0);
  const first = Math.min(...years);
  const span = years.length ? Math.max(...years) - first + 1 : 0;
  if (span > MOST_YEARS) return { slots: [], unplaced: [...rows] };
  const prefixes = new Set(placed.map((row) => row.prefix));
  const prefix = prefixes.size === 1 ? ([...prefixes][0] ?? "") : "";
  const slots = Array.from({ length: span }, (_, at): Slot => {
    const row = placed.find((item) => item.year === first + at) ?? null;
    return { label: row?.period ?? `${prefix}${String(first + at)}`, year: first + at, row };
  });
  return { slots, unplaced: rows.filter((row) => !placed.includes(row)) };
}

const placeable = (cell: Cell) => cell.value !== null && cell.value >= 0;
const height = (value: number, top: number) =>
  `${String(Number(((value / (top || 1)) * 100).toFixed(6)))}%`;

/** A stated amount as written, or its stated gap as the word and the reason. */
function Amount({ cell }: { cell: Cell }) {
  const gap = cell.value === null ? statedGap(cell.text) : null;
  if (gap) return <GapCell word={gap.word} reason={gap.reason} />;
  if (!cell.text.trim()) return <GapCell word="Not stated" />;
  return <span className="font-mono text-text-primary tabular-nums">{cell.text}</span>;
}

/** The need on a year axis: two columns per year from one zero, the scale on the left. */
function YearAxis({
  slots,
  top,
  scale,
}: {
  slots: Slot[];
  top: number;
  scale: { value: number; label: string }[];
}) {
  const columns = { gridTemplateColumns: `repeat(${String(slots.length)}, minmax(0, 1fr))` };
  return (
    <div aria-hidden="true" className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
      <div className="relative h-40 min-w-8">
        {scale.map((tick) => (
          <span
            key={tick.value}
            className="absolute right-0 translate-y-1/2 font-mono text-caption text-text-tertiary tabular-nums"
            style={{ bottom: height(tick.value, top) }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      <div className="relative h-40 border-b border-connector">
        {scale.map((tick) => (
          <span
            key={tick.value}
            className="absolute inset-x-0 h-px bg-border-hairline"
            style={{ bottom: height(tick.value, top) }}
          />
        ))}
        <div className="absolute inset-0 grid" style={columns}>
          {slots.map((slot) => (
            <div
              key={slot.year}
              data-slot={slot.label}
              className="flex items-end justify-center gap-1"
            >
              {slot.row?.cells.map((cell, at) =>
                placeable(cell) ? (
                  <span
                    key={MEASURES[at]}
                    data-bar={cell.text}
                    className={cx("w-3 min-h-0.5 rounded-t-ds-xs sm:w-5", TONE[at])}
                    style={{ height: height(cell.value ?? 0, top) }}
                  />
                ) : (
                  cell.value === null &&
                  statedGap(cell.text) && (
                    <span
                      key={MEASURES[at]}
                      data-gap
                      className="h-3 w-3 rounded-t-ds-xs border border-b-0 border-dashed border-border-gap sm:w-5"
                    />
                  )
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <span />
      <div className="grid pt-1.5" style={columns}>
        {slots.map((slot) => (
          <div key={slot.year} className="flex min-w-0 flex-col items-center gap-0.5 text-center">
            <span
              className={cx(
                "font-mono text-caption tabular-nums",
                slot.row ? "font-medium text-text-primary" : "text-text-tertiary",
              )}
            >
              {slot.label}
            </span>
            {!slot.row && <span className="text-caption text-text-tertiary">No row stated</span>}
            {slot.row?.cells.map((cell, at) =>
              placeable(cell) ? (
                <span
                  key={MEASURES[at]}
                  data-figure
                  className="flex items-center gap-1 font-mono text-caption text-text-secondary tabular-nums"
                >
                  <span className={cx("size-1.5 flex-none rounded-ds-xs", TONE[at])} />
                  {cell.text}
                </span>
              ) : null,
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The figure's own list of what it does not place: stated gaps by year, and rows not by year. */
function Unplaced({ slots, unplaced }: { slots: Slot[]; unplaced: NeedRow[] }) {
  const gaps = slots.flatMap(({ row }) =>
    row
      ? row.cells.flatMap((cell, at) =>
          placeable(cell)
            ? []
            : [
                {
                  key: `${row.period}-${String(at)}`,
                  name: `${MEASURES[at] ?? ""}, ${row.period}`,
                  cell,
                },
              ],
        )
      : [],
  );
  return (
    <>
      {gaps.length > 0 && (
        <ul aria-label="Amounts not supplied" className="flex flex-col gap-1.5">
          {gaps.map((gap) => (
            <li
              key={gap.key}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-caption"
            >
              <span className="text-text-secondary">{gap.name}</span>
              <Amount cell={gap.cell} />
            </li>
          ))}
        </ul>
      )}
      {unplaced.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-caption text-text-tertiary">Not placed by year</p>
          <ul aria-label="Rows not placed by year" className="flex flex-col gap-2">
            {unplaced.map((row) => (
              <li key={row.line} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-small font-medium wrap-anywhere text-text-primary">
                  {row.period}
                </span>
                <KeyValues
                  items={MEASURES.map((name, at) => ({
                    key: name,
                    value: row.cells[at] ? (
                      <Amount cell={row.cells[at]} />
                    ) : (
                      <GapCell word="Not stated" />
                    ),
                  }))}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** The need as the figure reads it: its table and rows, or null when the figure is a gap. */
function needOf(entry: LeadProps["entry"]) {
  const chart = chartOf(entry, TITLE);
  const rows = chart.state === "ready" ? needRows(chart.table) : null;
  return { chart, rows };
}

const NO_NEED = "This page could not read the refinancing need.";

function NeedFigure({
  entry,
  href,
}: {
  entry: LeadProps["entry"];
  href: (line?: number) => string;
}) {
  // A chart the module wrote as prose only is the frame's, in the module's words.
  if (statedInProse(entry, `Chart data: ${TITLE}`)) return null;
  const { chart, rows } = needOf(entry);
  if (chart.state !== "ready" || !rows)
    return (
      <ChartGap
        chart={chart}
        span={12}
        label={TITLE}
        title={TITLE}
        href={href}
        unread={NO_NEED}
        absent={NO_NEED}
      />
    );
  const units = new Set(chart.table.rows.map((row) => row.at(-2) ?? ""));
  const oneUnit = units.size === 1;
  const unit = oneUnit ? ([...units][0] ?? "") : "";
  const { slots, unplaced } = yearSlots(rows);
  const scale = ticks(
    slots.flatMap(
      ({ row }) => row?.cells.flatMap((cell) => (placeable(cell) ? [cell.value] : [])) ?? [],
    ),
  );
  const top = scale.at(-1)?.value ?? 0;
  const reading = `Debt maturing against committed resources${unit ? ` in ${unitLabel(unit)}` : ""}. ${rows
    .map(
      ({ period, cells: [debt, resources] }) =>
        `${period}: debt maturing ${debt ? spoken(debt) : "not supplied"}, committed resources ${resources ? spoken(resources) : "not supplied"}.`,
    )
    .join(" ")}`;
  return (
    <LeadFigure
      span={8}
      label={TITLE}
      title={TITLE}
      basis={unit ? unitLabel(unit) : undefined}
      legend={
        oneUnit && (
          <>
            <Key tone="primary">Debt maturing</Key>
            <Key tone="secondary">Committed resources</Key>
          </>
        )
      }
      trace={<Trace href={href(chart.table.line)} name={TITLE} />}
      figure={
        // One scale only for one unit: amounts in two units are not drawn against each other.
        !oneUnit ? (
          <CompactGap>The amounts are stated in more than one unit.</CompactGap>
        ) : (
          <div role="img" aria-label={reading} className="flex min-w-0 flex-col gap-3">
            {slots.length > 0 && <YearAxis slots={slots} top={top} scale={scale} />}
            <Unplaced slots={slots} unplaced={unplaced} />
          </div>
        )
      }
      table={writtenTable(chart.table, href)}
      notes={basisNotes(chart.table)}
    />
  );
}

const PATH_FIELDS = ["Feasibility", "Likelihood Direction"] as const;

function PathItem({ row, columns, index }: { row: Row; columns: number[]; index: number }) {
  return (
    <>
      <span className="text-small font-medium wrap-anywhere text-text-primary">
        {rowName(readerCell(row.cells[columns[0] ?? -1] ?? ""), index)}
      </span>
      <KeyValues
        items={PATH_FIELDS.flatMap((name, at) => {
          const cell = row.cells[columns[at + 1] ?? -1];
          return cell === undefined
            ? []
            : [{ key: name === "Feasibility" ? name : "Likelihood", value: readerCell(cell) }];
        })}
      />
    </>
  );
}

function Paths({
  entry,
  href,
  span,
}: {
  entry: LeadProps["entry"];
  href: (line?: number) => string;
  span: 6 | 12;
}) {
  const label = "Liability-management paths";
  const table = registerTable(entry, "T3D.6", ["Path Type", "Feasibility"]);
  if (!table?.rows.length)
    return (
      <LeadGap
        span={span}
        label={label}
        title={label}
        reason="This page could not read the liability-management paths."
      />
    );
  const columns = ["Path Type", ...PATH_FIELDS].map((name) => columnOf(table, name));
  return (
    <Tile span={span} label={label} title={label} className="w-full self-start">
      <ul aria-label={label} className="flex flex-col">
        {table.rows.map((row, index) => (
          <li
            key={row.line}
            className="flex items-start justify-between gap-3 border-t border-border-hairline py-2.5 first:border-t-0 first:pt-0"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <PathItem row={row} columns={columns} index={index} />
            </span>
            <Trace
              href={href(row.line)}
              name={rowName(readerCell(row.cells[columns[0] ?? -1] ?? ""), index)}
            />
          </li>
        ))}
      </ul>
    </Tile>
  );
}

/**
 * CP-3C: what falls due, against what is committed to meet it. The paths and a short lane stack
 * beside the need; a lane with an axis takes the full row; a need that is only a gap is one full
 * row, the paths and the dates side by side under it.
 */
export const RefinancingLead = withDraws(
  function RefinancingLead(props: LeadProps) {
    const { entry, run } = props;
    if (drawsNothing(entry)) return null;
    const href = leadHref(props);
    const { chart, rows } = needOf(entry);
    const drawn = chart.state === "ready" && rows !== null;
    const lane = eventsOf(entry, "Refinancing");
    const axis = laneHasAxis(lane);
    // A lane the module wrote as prose only is the frame's, in the module's words.
    const dates = (span: 6 | 12) =>
      !statedInProse(entry, "Events: Refinancing") && (
        <LaneTile
          lane={lane}
          span={span}
          label="Refinancing dates"
          title="Refinancing dates"
          href={href}
          asOf={run.asOf}
        />
      );
    if (!drawn)
      return (
        <Bento>
          <NeedFigure entry={entry} href={href} />
          <Paths entry={entry} href={href} span={axis || !lane ? 12 : 6} />
          {dates(axis ? 12 : 6)}
        </Bento>
      );
    return (
      <Bento>
        <NeedFigure entry={entry} href={href} />
        <Beside>
          <Paths entry={entry} href={href} span={12} />
          {!axis && dates(12)}
        </Beside>
        {axis && dates(12)}
      </Bento>
    );
  },
  ["figures", "events"],
);
