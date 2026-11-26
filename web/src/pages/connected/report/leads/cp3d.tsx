import { cx } from "@/utils/cx";
import { ticks, type SourceTable } from "../../visuals/visualData";
import { basisNotes, blockedReason, readCell } from "../overview/figureData";
import { Key } from "../overview/figureParts";
import { Bento, Tile } from "../overview/Tile";
import { withDraws } from "./draws";
import { CompactGap, GapCell, KeyValues, LeadFigure, LeadGap, statedGap, Trace } from "./parts";
import {
  chartOf,
  columnOf,
  leadHref,
  readerCell,
  readerCellOf,
  registerTable,
  rowName,
  drawsNothing,
  withStatedUnit,
  statedInProse,
} from "./read";
import type { LeadProps } from "./types";
import { ChartGap, writtenTable } from "./written";

type Href = (line?: number) => string;

const TITLE = "Yield against maturity";
const COLUMNS = [
  "Instrument",
  "Maturity date",
  "Yield",
  "Spread",
  "Quote date",
  "Source class",
] as const;
const DAY = 86_400_000;
/** The fewest points a date axis is drawn for; fewer are a list of figures. */
const AXIS_FROM = 3;
const CURVE_GAP = "This page could not read the issuer curve.";
const NO_YIELDS = "This page could not read the yields by maturity.";
/** A key longer than this goes above its value, so the value keeps its measure. */
const LONG_KEY = 16;

/** A stated calendar date as a time, or null for any other text. */
function dayOf(text: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const time = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === text ? time : null;
}

function quotes(table: SourceTable) {
  const at = COLUMNS.map((name) => columnOf(table, name));
  if (at.some((column) => column < 0)) return null;
  const [name = 0, maturity = 1, yieldAt = 2] = at;
  const scope = table.rows.map((row) => row[yieldAt] ?? "");
  return table.rows.map((row, index) => {
    const unit = row.at(-2) ?? "";
    const cell = readerCellOf(readCell(row[yieldAt] ?? "", scope, unit));
    return {
      name: readerCell(row[name] ?? "") || "Instrument not stated",
      maturity: readerCell(row[maturity] ?? ""),
      day: dayOf(row[maturity] ?? ""),
      cell,
      unit,
      line: table.rowLines?.[index] ?? table.line,
      index,
    };
  });
}

type Quote = NonNullable<ReturnType<typeof quotes>>[number];
type Placed = Quote & { day: number; value: number };

/** Why a quote is not placed, in the figure's place: its stated gap, or what the page could not read. */
function Unplaced({ row }: { row: Quote }) {
  const gap = row.cell.value === null ? statedGap(row.cell.text) : null;
  if (gap) return <GapCell word={gap.word} reason={gap.reason} />;
  const maturityGap = row.day === null ? statedGap(row.maturity) : null;
  if (maturityGap) return <GapCell word={maturityGap.word} reason={maturityGap.reason} />;
  const reason =
    row.cell.value === null
      ? `This page could not read the yield “${row.cell.text}” as a number.`
      : row.cell.value < 0
        ? "Stated yield below zero; not placed."
        : `This page could not read the maturity date “${row.maturity}” as a date.`;
  return <span className="text-caption wrap-anywhere text-gap-text">{reason}</span>;
}

/**
 * The date axis: 1 January of each year inside the domain, at most five labels; within one year,
 * the earliest and latest stated maturity dates (points are sorted by date).
 */
function dateTicks(low: number, high: number, points: readonly Placed[]) {
  const first = new Date(low).getUTCFullYear() + 1;
  const last = new Date(high).getUTCFullYear();
  const years = Array.from({ length: Math.max(0, last - first + 1) }, (_, at) => first + at);
  const step = Math.ceil(years.length / 5) || 1;
  if (years.length)
    return years
      .filter((_, at) => at % step === 0)
      .map((year) => ({ label: String(year), time: Date.UTC(year, 0, 1) }));
  const ends = [points[0], points.at(-1)].flatMap((point) => (point ? [point] : []));
  return [...new Map(ends.map((point) => [point.maturity, point.day])).entries()].map(
    ([label, time]) => ({ label, time }),
  );
}

const pct = (share: number) => `${String(Number((share * 100).toFixed(6)))}%`;

/** A date label's anchor near an edge of the plot, so it stays inside the tile. */
const anchor = (share: number) =>
  share < 0.08 ? "" : share > 0.92 ? "-translate-x-full" : "-translate-x-1/2";

/** The points on a true date axis, yield from zero; every label is page text over the plot. */
function Scatter({ points, label }: { points: Placed[]; label: string }) {
  const days = points.map((point) => point.day);
  const pad = Math.max(120 * DAY, (Math.max(...days) - Math.min(...days)) * 0.06);
  const low = Math.min(...days) - pad;
  const high = Math.max(...days) + pad;
  const scale = ticks(points.map((point) => point.value));
  const top = scale.at(-1)?.value || 1;
  const x = (time: number) => (time - low) / (high - low);
  const y = (value: number) => value / top;
  return (
    <div
      role="img"
      aria-label={label}
      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2"
    >
      <div aria-hidden="true" className="relative h-52 min-w-8">
        {scale.map((tick) => (
          <span
            key={tick.value}
            className="absolute right-0 translate-y-1/2 font-mono text-caption text-text-tertiary tabular-nums"
            style={{ bottom: pct(y(tick.value)) }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      <div className="relative h-52 border-b border-connector">
        {scale.map((tick) => (
          <span
            key={tick.value}
            aria-hidden="true"
            className="absolute inset-x-0 h-px bg-border-hairline"
            style={{ bottom: pct(y(tick.value)) }}
          />
        ))}
        {points.map((point, at) => (
          <span
            key={point.index}
            data-point={point.name}
            aria-hidden="true"
            className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center"
            style={{ left: pct(x(point.day)), bottom: pct(y(point.value)) }}
          >
            <span className="absolute bottom-full mb-0.5 font-mono text-caption font-medium text-text-primary">
              {at + 1}
            </span>
            <span className="size-2.5 rounded-ds-full bg-chart-1" />
          </span>
        ))}
      </div>
      <span />
      <div aria-hidden="true" className="relative h-6">
        {dateTicks(low, high, points).map(({ label: date, time }) => (
          <span
            key={date}
            className={cx(
              "absolute top-1 font-mono text-caption whitespace-nowrap text-text-tertiary",
              anchor(x(time)),
            )}
            style={{ left: pct(x(time)) }}
          >
            {date}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The placed instruments, numbered as on the plot, each with its maturity and stated yield. */
function Points({ points }: { points: readonly Placed[] }) {
  return (
    <ol aria-label="Instruments by maturity" className="flex min-w-0 flex-col">
      {points.map((point, at) => (
        <li
          key={point.index}
          className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-2 border-t border-border-hairline py-2 first:border-t-0 first:pt-0"
        >
          <span className="font-mono text-small text-text-tertiary">{at + 1}</span>
          <span className="flex min-w-0 flex-col">
            <span className="text-small wrap-anywhere text-text-primary">{point.name}</span>
            <span className="font-mono text-caption text-text-tertiary">{point.maturity}</span>
          </span>
          <span className="font-mono text-small font-medium text-text-primary tabular-nums">
            {withStatedUnit(point.cell.text, point.unit)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function YieldFigure({ entry, href }: { entry: LeadProps["entry"]; href: Href }) {
  // A chart the module wrote as prose only is the frame's, in the module's words.
  if (statedInProse(entry, `Chart data: ${TITLE}`)) return null;
  const chart = chartOf(entry, TITLE);
  const rows = chart.state === "ready" ? quotes(chart.table) : null;
  if (chart.state !== "ready" || !rows)
    return (
      <ChartGap
        chart={chart}
        span={12}
        label={TITLE}
        title={TITLE}
        href={href}
        unread={NO_YIELDS}
        absent={NO_YIELDS}
      />
    );
  const candidates = rows
    .flatMap((row): Placed[] =>
      row.day !== null && row.cell.value !== null && row.cell.value >= 0
        ? [{ ...row, day: row.day, value: row.cell.value }]
        : [],
    )
    .sort((a, b) => a.day - b.day);
  // One axis only for one unit: yields in two units are not placed against each other.
  const units = new Set(candidates.map((row) => row.unit));
  const placed = units.size === 1 ? candidates : [];
  const unit = placed[0]?.unit ?? "";
  const unplaced = rows.filter((row) => !candidates.some((point) => point.index === row.index));
  const reading = `Yield against maturity date${unit ? `, in ${unit}` : ""}. ${placed
    .map(
      (point) =>
        `${point.name} matures ${point.maturity} at ${withStatedUnit(point.cell.text, point.unit)}.`,
    )
    .join(" ")}`;
  const axis = placed.length >= AXIS_FROM;
  return (
    <LeadFigure
      span={12}
      label={TITLE}
      title={TITLE}
      basis={
        unit
          ? axis
            ? `Yield in ${unit}, from zero; maturity on a date axis`
            : `Yield in ${unit}, by maturity date`
          : undefined
      }
      legend={axis && <Key tone="primary">Observed yield</Key>}
      trace={<Trace href={href(chart.table.line)} name={TITLE} />}
      figure={
        <div className="flex min-w-0 flex-col gap-3">
          {!placed.length ? (
            <CompactGap>
              {units.size > 1
                ? "The yields are stated in more than one unit."
                : "No instrument has both a stated yield and a maturity date."}
            </CompactGap>
          ) : axis ? (
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Scatter points={placed} label={reading} />
              <Points points={placed} />
            </div>
          ) : (
            <Points points={placed} />
          )}
          {placed.length > 0 && <CompactGap>{CURVE_GAP}</CompactGap>}
          {unplaced.length > 0 && (
            <ul aria-label="Instruments not placed" className="flex flex-col gap-1.5">
              {unplaced.map((row) => (
                <li key={row.index} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-caption wrap-anywhere text-text-secondary">{row.name}</span>
                  <Unplaced row={row} />
                </li>
              ))}
            </ul>
          )}
        </div>
      }
      table={writtenTable(chart.table, href)}
      notes={basisNotes(chart.table)}
    />
  );
}

const IMPLIED_FIELDS = [
  { name: "Model", test: /^model$/i },
  { name: "Horizon", test: /^horizon$/i },
  { name: "Recovery", test: /^recovery$/i },
  { name: "Implied", test: /^implied\b/i },
] as const;

function Implied({ entry, href }: { entry: LeadProps["entry"]; href: Href }) {
  const label = "Market-implied default";
  const table = registerTable(entry, "T3E.5", ["model", "horizon"]);
  if (!table?.rows.length)
    return (
      <LeadGap
        span={12}
        label={label}
        title={label}
        reason="This page could not read the market-implied default."
      />
    );
  const security = table.headers.findIndex((header) => /^security/i.test(header.trim()));
  const fields = IMPLIED_FIELDS.flatMap(({ name, test }) => {
    const at = table.headers.findIndex((header) => test.test(header.trim()));
    return at < 0 ? [] : [{ name: name === "Implied" ? (table.headers[at] ?? name) : name, at }];
  });
  const stacked = fields.some((field) => field.name.length > LONG_KEY);
  return (
    <Tile span={12} label={label} title={label} className="w-full self-start">
      <ul aria-label={label} className="grid min-w-0 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {table.rows.map(({ line, cells }, index) => {
          const name = rowName(security < 0 ? "" : readerCell(cells[security] ?? ""), index);
          return (
            <li
              key={line}
              className="flex min-w-0 items-start justify-between gap-3 border-t border-border-hairline pt-2.5"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-small font-medium wrap-anywhere text-text-primary">
                  {name}
                </span>
                <KeyValues
                  stacked={stacked}
                  items={fields.map((field) => ({
                    key: field.name,
                    value: readerCell(cells[field.at] ?? ""),
                  }))}
                />
              </span>
              <Trace href={href(line)} name={name} />
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}

/** The module's first whole sentence: its reason for not being assessable, in its own words. */
const firstSentence = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-Z])/u)[0] ?? text;

/** CP-3D: where the market prices the issuer's debt, and what that implies. */
export const MarketLead = withDraws(
  function MarketLead(props: LeadProps) {
    const { entry } = props;
    if (drawsNothing(entry))
      return entry.output.parseError || chartOf(entry, TITLE).state === "absent" ? null : (
        <Bento>
          <LeadGap
            span={12}
            label={TITLE}
            title={TITLE}
            reason={`Not drawn. ${firstSentence(blockedReason(entry))}`}
          />
        </Bento>
      );
    const href = leadHref(props);
    return (
      <Bento>
        <YieldFigure entry={entry} href={href} />
        <Implied entry={entry} href={href} />
      </Bento>
    );
  },
  ["figures"],
);
