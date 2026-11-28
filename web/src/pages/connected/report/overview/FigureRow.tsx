import { ArrowDown, ArrowUp } from "@untitledui/icons";
import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { parsePeriod } from "@/utils/periodOrder";
import { blocked, evidencePath, type OutputEntry } from "../../publishedReport";
import { BETTER, WORSE } from "../../visuals/signal/scales";
import { changeSign, changeText, exactDifference, tone } from "../../signal";
import { PublishedSource } from "../PublishedTrace";
import { Key } from "./figureParts";
import { DeltaBar, GapBar, MiniSlope, Ruler, Slope, SplitBar } from "./marks";
import { latestAt } from "./markLayout";
import type { Mark, MarkTone, Slot } from "./marks";
import {
  entryOf,
  figureShown,
  readSeries,
  timeline,
  type Point,
  type RowProps,
  type Series,
  type Timeline,
} from "./read";
import { gapReading, gapWord, readerCell } from "./notes";
import { Reason, readerReason } from "./reason";
import { Figure, GapNote, Tile } from "./Tile";

/** The CP-1 chart table and column each headline figure is read from, and its better/worse key. */
const FIGURES = {
  gross: ["Total debt / EBITDA", "leverage", /^Total debt \/ /, "leverage"],
  net: ["Net debt / EBITDA", "leverage", /^Net debt \/ /, "net_leverage"],
  revenue: ["Revenue", "revenue and EBITDA", /^Revenue$/, "revenue"],
  cover: ["Interest cover", "interest cover", / \/ cash interest$/, "coverage"],
  ebitda: ["Adjusted EBITDA", "revenue and EBITDA", /^Adjusted EBITDA$/, "adjusted_ebitda"],
  cash: ["Cash", "liquidity", /^Cash$/, "cash"],
  undrawn: [
    "Undrawn committed facilities",
    "liquidity",
    /^Undrawn committed facilities$/,
    "undrawn",
  ],
} as const;
type FigureKey = keyof typeof FIGURES;

type Ready = {
  state: "ready";
  title: string;
  series: Series;
  timeline: Timeline;
  slots: Slot[];
  /** The exact change from the period a year earlier; null where none may be drawn. */
  change: string | null;
  /** Why no change is drawn although the latest figure is stated. */
  why: string | null;
  tone: MarkTone;
  /** The tone of the series mark's last step: only when that step is the year-on-year one. */
  markTone: MarkTone;
};
type Reading =
  | { state: "absent"; title: string; reason: string; line?: number }
  | { state: "unordered"; title: string; series: Series }
  | Ready;

const sameBasis = (a: Point, b: Point) => (a.basis ?? "").trim() === (b.basis ?? "").trim();

/** The change drawn against the period exactly a year earlier, on the same basis; or why not. */
function compare({ latest, prior, why }: Timeline) {
  const none = (reason: string | null) => ({ change: null, why: reason });
  if (latest.figure === null) return none(null);
  if (!prior) return none(why ?? null);
  if (prior.figure === null) return none(`No figure for ${prior.period} to compare.`);
  if (!sameBasis(latest, prior))
    return none(
      `Not compared with ${prior.period}: the two periods are stated on different bases.`,
    );
  return { change: exactDifference(latest.figure, prior.figure), why: null };
}

/**
 * Where a period sits in time, in years, and the form it is written in: a fiscal year as itself, a
 * date by its day. Nothing for any other period (a quarter, a year to date, a last twelve months,
 * a pro forma, a forecast): such a series is spaced evenly in period order, never by time.
 */
function timeAt(period: string) {
  const parsed = parsePeriod(period);
  if (parsed?.periodClass !== "actual" || !parsed.end) return undefined;
  const [year, month, day] = parsed.end;
  if (parsed.span === "year") return { form: "year", at: year };
  if (parsed.span !== "date") return undefined;
  return { form: "date", at: 1970 + Date.UTC(year, month - 1, day) / (365.25 * 86_400_000) };
}

/** Each period's slot; placed by time only where every period is written in one form. */
function slotsFor(points: Point[], latest: Point, unit: string): Slot[] {
  const times = points.map((point) => timeAt(point.period));
  const oneForm = new Set(times.map((time) => time?.form)).size === 1;
  return points.map((point, at) => ({
    label: point.period,
    value: point.value,
    text: figureShown(point, unit) ?? gapWord(point.cell),
    at: oneForm ? times[at]?.at : undefined,
    basis: (point.basis ?? "").trim(),
    ...(point === latest && at < points.length - 1 && { latest: true }),
  }));
}

/** A leverage ratio below zero (EBITDA below zero, or net cash) has no better or worse direction. */
const RATIOS = new Set(["leverage", "net_leverage"]);
const belowZero = (point: Point | undefined) => (point?.value ?? 0) < 0;

function readTone(toneKey: string, change: string | null, { latest, prior }: Timeline): MarkTone {
  if (change === null) return "none";
  if (RATIOS.has(toneKey) && (belowZero(latest) || belowZero(prior))) return "none";
  return tone(toneKey, change);
}

function read(entry: OutputEntry, key: FigureKey): Reading {
  const [fallback, chart, heading, toneKey] = FIGURES[key];
  const found = readSeries(entry, chart, heading, fallback);
  if ("reason" in found) return { state: "absent", title: fallback, ...found };
  const { series } = found;
  const line = timeline(series, entry);
  const title = readerCell(series.name) ?? fallback;
  if (!line) return { state: "unordered", title, series };
  const { change, why } = compare(line);
  const toned = readTone(toneKey, change, line);
  return {
    state: "ready",
    title,
    series,
    timeline: line,
    slots: slotsFor(line.points, line.latest, series.unit),
    change,
    why,
    tone: toned,
    markTone: line.points[line.points.indexOf(line.latest) - 1] === line.prior ? toned : "none",
  };
}

const spoken = (title: string, slots: Slot[]) =>
  `${title}: ${slots.map((slot) => (slot.value === null ? `no figure in ${slot.label}` : `${slot.text} in ${slot.label}`)).join(", ")}.`;

const TONE_LOOK = {
  better: {
    box: "border-better-mark text-text-primary",
    text: "text-better-mark",
    fill: BETTER[1],
  },
  worse: { box: "border-worse-mark text-text-primary", text: "text-worse-mark", fill: WORSE[1] },
} as const;

/** Better or worse, by `tone()` only: a chip on a large tile, an inline word on a small one. */
function ToneChip({ reading, large }: { reading: Ready; large: boolean }) {
  if (reading.change === null || reading.tone === "none" || reading.tone === "flat") return null;
  const Arrow = changeSign(reading.change) === 1 ? ArrowUp : ArrowDown;
  const look = TONE_LOOK[reading.tone];
  return (
    <span
      className={cx(
        "flex flex-none items-center gap-1 text-caption whitespace-nowrap",
        large ? "h-6 rounded-ds-xs border px-2" : look.text,
        large && look.box,
      )}
      {...(large && { style: { backgroundColor: look.fill } })}
    >
      <Arrow aria-hidden="true" className={cx("size-3", look.text)} />
      {reading.tone === "worse" ? "Worse" : "Better"}
    </span>
  );
}

type Href = (line?: number) => string;

const STATED = /^Not (?:supplied|calculated):\s*(\S.*)$/;

/** What a period with no figure is said to be: the module's word, or that its words are not one. */
function gapSaid(cell: string, words: string | null, stated: boolean) {
  if (stated) return words ?? gapReading(cell);
  if (!cell.trim()) return "no value stated";
  return gapWord(cell) === "No figure"
    ? "not shown here, the cell is not one figure"
    : gapReading(cell);
}

/**
 * One period whose cell is not a figure: the module's own reason ("Not supplied: …", "Not
 * calculated: …") in the reader's words, its gap word and a link to Evidence when that reason
 * cites a source; its own short word ("n.m.", "—") as written; and for any other words, that they
 * are not one figure, never that the module did not supply it.
 */
function GapLine({ point, href }: { point: Point; href: Href }) {
  const reason = STATED.exec(point.cell.trim())?.[1] ?? null;
  const words = reason === null ? null : readerReason(reason);
  return (
    <div className="flex flex-wrap items-center gap-x-2">
      <p className="text-caption text-gap-text">
        {`${point.period}: ${gapSaid(point.cell, words, reason !== null)}`}
      </p>
      {reason !== null && words === null && <Reason text={reason} href={href(point.line)} />}
    </div>
  );
}

/** How the latest figure moved from the period a year earlier, or why that is not drawn. */
function Movement({ reading }: { reading: Ready }) {
  const { latest, prior } = reading.timeline;
  const { unit } = reading.series;
  const note = "text-caption text-text-tertiary";
  if (reading.why) return <p className={note}>{reading.why}</p>;
  if (prior?.figure == null) return null;
  const earlier = `${figureShown(prior, unit) ?? ""} in ${prior.period}`;
  if (latest.figure === null || reading.change === null) return <p className={note}>{earlier}</p>;
  return (
    <p className={note}>
      {`from ${earlier} `}
      <span className="whitespace-nowrap">{`(${changeText(reading.change, unit)})`}</span>
    </p>
  );
}

const UNORDERED =
  "These periods give no single latest reported period, so no latest figure or change is drawn.";

/** Every period's cell as written, in the table's order, where no latest can be chosen. */
function AsWritten({
  series,
  href,
  title,
  said = true,
}: {
  series: Series;
  href: Href;
  /** The series' own title, where the tile draws more than one list. */
  title?: string;
  /** Whether this list says the unordered sentence (once per tile). */
  said?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {title && <Note>{title}</Note>}
      <ul className="flex flex-col gap-0.5 text-small text-text-primary">
        {series.points.map((point) =>
          point.figure === null ? (
            <li key={point.line}>
              <GapLine point={point} href={href} />
            </li>
          ) : (
            <li key={point.line} className="font-mono tabular-nums">
              {`${figureShown(point, series.unit) ?? ""} in ${point.period}`}
            </li>
          ),
        )}
      </ul>
      {said && <p className="text-caption text-text-tertiary">{UNORDERED}</p>}
    </div>
  );
}

/** Headline figures sit one step under the bottom line (h1 against metric or display). */
const FIGURE = {
  large: "text-h1 font-medium",
  small: "text-h3 font-medium whitespace-nowrap",
} as const;
/** A gap word in a figure's place is words, not a figure: one step smaller, and it may wrap. */
const GAP_FIGURE = {
  large: "text-h2 font-medium text-text-tertiary",
  small: "text-h4 font-medium text-text-tertiary",
} as const;

/** The latest figure, its basis, how it moved and every gap in the series, in the module's words. */
function Level({ reading, large, href }: { reading: Reading; large: boolean; href: Href }) {
  const at = large ? "large" : "small";
  if (reading.state === "absent")
    return (
      <GapNote>
        <Reason text={reading.reason} href={href()} />
      </GapNote>
    );
  if (reading.state === "unordered") return <AsWritten series={reading.series} href={href} />;
  const { latest, points } = reading.timeline;
  const stated = latest.figure !== null;
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cx(
          // The figure never breaks; the better or worse word follows it, and drops under it
          // only where the tile is too narrow for both.
          "flex flex-wrap items-baseline gap-x-3 gap-y-1",
          !large && "min-w-0 gap-x-2",
        )}
      >
        <Figure className={stated ? FIGURE[at] : GAP_FIGURE[at]}>
          {figureShown(latest, reading.series.unit) ?? gapWord(latest.cell)}
        </Figure>
        <ToneChip reading={reading} large={large} />
      </div>
      {!large && <p className="text-caption text-text-tertiary">{latest.period}</p>}
      {latest.basis?.trim() && (
        <p className="text-caption text-text-secondary">
          <Reason text={latest.basis} href={href(latest.line)} />
        </p>
      )}
      <Movement reading={reading} />
      {points
        .filter(({ value }) => value === null)
        .map((point) => (
          <GapLine key={point.line} point={point} href={href} />
        ))}
    </div>
  );
}

/** The tile's one trace control: the latest row, or the table itself; none without a table. */
function Source({ reading, href }: { reading: Reading; href: Href }) {
  const line =
    reading.state === "ready"
      ? reading.timeline.latest.line
      : reading.state === "unordered"
        ? reading.series.line
        : reading.line;
  if (line === undefined) return null;
  return (
    <PublishedSource
      href={href(line)}
      name={reading.title}
      linkLabel={`Source for ${reading.title}`}
    >
      View source
    </PublishedSource>
  );
}

/**
 * A series mark needs the latest figure and one more stated period. A figure whose only period is
 * stated has nothing missing, so it draws no mark and no gap; a gap bar stands only where a
 * period the module lists has no figure.
 */
function Drawn({ reading, children }: { reading: Reading; children: ReactNode }) {
  if (reading.state !== "ready") return null;
  const stated = reading.slots.filter(({ value }) => value !== null).length;
  if (reading.timeline.latest.value !== null && stated >= 2) return children;
  return stated === reading.slots.length ? null : <GapBar />;
}

type TileProps = { reading: Reading; href: Href; children: ReactNode };

/** A small tile inside the 2x2 grid: one column of it, with the Overview's small head. */
/**
 * A small tile's head: the 13 px title, which wraps, and the trace, which never leaves the row
 * (Tile's own small head lets the trace wrap below a long title in a narrow tile).
 */
function SmallTile({ reading, href, whole = false, children }: TileProps & { whole?: boolean }) {
  return (
    <Tile
      span={12}
      head="small"
      label={reading.title}
      title={reading.title}
      trace={<Source reading={reading} href={href} />}
      className="gap-2 p-4 sm:p-4 lg:col-span-1"
    >
      <Level reading={reading} large={false} href={href} />
      {/* Figures start on one line across the four tiles; each mark sits at its tile's foot. */}
      <div className="mt-auto pt-1">
        {/* `whole`: the mark compares parts of one period, so it needs no second period. */}
        {whole ? children : <Drawn reading={reading}>{children}</Drawn>}
      </div>
    </Tile>
  );
}

function LargeTile({ reading, href, children }: TileProps) {
  return (
    <Tile
      span={6}
      head="small"
      label={reading.title}
      title={reading.title}
      kicker={reading.state === "ready" ? reading.timeline.latest.period : undefined}
      trace={<Source reading={reading} href={href} />}
    >
      <Level reading={reading} large href={href} />
      <Drawn reading={reading}>{children}</Drawn>
    </Tile>
  );
}

const markOf = (slot: Slot): Mark | null =>
  slot.value === null ? null : { label: slot.label, value: slot.value, text: slot.text };

/** The latest stated figure as a mark; none when the latest period is a gap. */
function latestMark(reading: Reading) {
  if (reading.state !== "ready") return null;
  const slot = reading.slots[latestAt(reading.slots)];
  return slot ? markOf(slot) : null;
}

/** The year-earlier and latest figures, only where their change is drawn. */
function ends(reading: Reading) {
  if (reading.state !== "ready" || reading.change === null || !reading.timeline.prior) return null;
  const { points, prior } = reading.timeline;
  const earlier = reading.slots[points.indexOf(prior)];
  const from = earlier ? markOf(earlier) : null;
  const to = latestMark(reading);
  return from && to ? { from, to } : null;
}

const slotsOf = (reading: Reading) => (reading.state === "ready" ? reading.slots : []);
const statedOf = (reading: Reading) =>
  slotsOf(reading).flatMap(({ value }) => (value === null ? [] : [value]));
const sameUnit = (a: Reading, b: Reading) =>
  a.state === "ready" && b.state === "ready" && a.series.unit === b.series.unit;
const markToneOf = (reading: Reading) => (reading.state === "ready" ? reading.markTone : "none");
const toneOf = (reading: Reading) => (reading.state === "ready" ? reading.tone : "none");

/** The caption line a figure's note takes, in the tile's small print. */
const Note = ({ children }: { children: ReactNode }) => (
  <p className="text-caption text-text-secondary">{children}</p>
);

/** A stated figure a mark cannot draw (zero or below): said in words, as written. */
const notDrawn = (mark: Mark, title = "") =>
  `Stated, not drawn: ${title && `${title} `}${mark.text} in ${mark.label}`;

/** One part of a bar that is not drawn, as written; its words say when it is the part not drawn. */
const partSaid = (title: string, mark: Mark) =>
  mark.value > 0 ? `${title} ${mark.text} in ${mark.label}` : notDrawn(mark, title);

/**
 * Undrawn facilities as the module states them where the split bar does not draw them: the latest
 * figure as written with its period, or the latest period's gap in the module's words.
 */
function UndrawnNote({ undrawn, cash, href }: { undrawn: Reading; cash: Reading; href: Href }) {
  if (undrawn.state === "absent") {
    // Cash's own gap box already says a shared reason once.
    if (cash.state === "absent" && cash.reason === undrawn.reason) return null;
    return (
      <GapNote>
        <Reason text={undrawn.reason} href={href(undrawn.line)} />
      </GapNote>
    );
  }
  if (undrawn.state === "unordered")
    return (
      <AsWritten
        series={undrawn.series}
        href={href}
        title={undrawn.title}
        said={cash.state !== "unordered"}
      />
    );
  const mark = latestMark(undrawn);
  if (mark) return <Note>{`${undrawn.title} ${mark.text} in ${mark.label}`}</Note>;
  return (
    <div className="flex flex-col gap-0.5">
      <Note>{undrawn.title}</Note>
      <GapLine point={undrawn.timeline.latest} href={href} />
    </div>
  );
}

/**
 * Cash against the undrawn facilities of the same latest period: one bar, two parts, where both
 * are positive. Where the bar cannot be drawn, each part says so in words; undrawn facilities
 * are always either in the bar or stated beneath it.
 */
function CashMark({ cash, undrawn, href }: { cash: Reading; undrawn: Reading; href: Href }) {
  const first = latestMark(cash);
  const second = latestMark(undrawn);
  if (first && second && first.label === second.label) {
    if (first.value > 0 && second.value > 0)
      return (
        <div className="flex flex-col gap-1.5">
          <SplitBar
            first={first}
            second={second}
            label={`${cash.title} ${first.text} beside ${undrawn.title} ${second.text} in ${first.label}.`}
          />
          <ul aria-label="Parts of the bar" className="flex flex-col gap-0.5">
            <li>
              <Key tone="primary">{`${cash.title} ${first.text}`}</Key>
            </li>
            <li>
              <Key tone="secondary">{`${undrawn.title} ${second.text}`}</Key>
            </li>
          </ul>
        </div>
      );
    return (
      <div className="flex flex-col gap-1">
        <Note>{partSaid(cash.title, first)}</Note>
        <Note>{partSaid(undrawn.title, second)}</Note>
      </div>
    );
  }
  const pair = ends(cash);
  return (
    <div className="flex flex-col gap-1.5">
      <Drawn reading={cash}>
        {pair && <Change pair={pair} tone={toneOf(cash)} reading={cash} />}
      </Drawn>
      <UndrawnNote undrawn={undrawn} cash={cash} href={href} />
    </div>
  );
}

/** A delta bar, or in words the stated ends it cannot draw (zero or below). */
function Change({
  pair,
  tone: ink,
  reading,
}: {
  pair: { from: Mark; to: Mark };
  tone: MarkTone;
  reading: Reading;
}) {
  const hidden = [pair.from, pair.to].filter(({ value }) => value <= 0);
  if (hidden.length === 0)
    return <DeltaBar {...pair} tone={ink} label={spoken(reading.title, slotsOf(reading))} />;
  return (
    <div className="flex flex-col gap-1">
      {hidden.map((mark) => (
        <Note key={mark.label}>{notDrawn(mark)}</Note>
      ))}
    </div>
  );
}

function SeriesMark({
  reading,
  kind,
  span,
}: {
  reading: Reading;
  kind: "slope" | "mini";
  span?: readonly number[];
}) {
  const props = {
    marks: slotsOf(reading),
    tone: markToneOf(reading),
    label: spoken(reading.title, slotsOf(reading)),
  };
  const suffix = reading.state === "ready" && reading.series.unit === "x" ? "x" : "";
  return kind === "mini" ? (
    <MiniSlope {...props} />
  ) : (
    <Slope {...props} suffix={suffix} span={span} />
  );
}

/**
 * Row 2: the headline figures, period against period. Two large tiles carry leverage, each half
 * the row and on the same mark so gross reads against net; four small ones support them in one
 * line beneath, each with its own mark. A figure the module did not supply is a gap.
 */
export function FigureRow({ run, view }: RowProps) {
  const entry = entryOf(view, "CP-1");
  if (!entry || blocked(entry))
    return (
      <Tile span={12} head="small" label="Headline figures" title="Headline figures">
        <GapNote>
          Not established for this run: the financial foundation has no figures to draw.
        </GapNote>
      </Tile>
    );
  const href: Href = (line) => evidencePath(run.folder, entry, line);
  const of = (key: FigureKey) => read(entry, key);
  const [gross, net, revenue, cover, ebitda, cash] = [
    of("gross"),
    of("net"),
    of("revenue"),
    of("cover"),
    of("ebitda"),
    of("cash"),
  ];
  // Gross and net leverage are one unit side by side: both slopes take one axis, so the gap
  // between them reads across the two tiles. Only stated values set it; nothing is derived.
  const leverage = sameUnit(gross, net) ? [...statedOf(gross), ...statedOf(net)] : undefined;
  const coverEnds = ends(cover);
  const ebitdaEnds = ends(ebitda);
  return (
    <>
      <LargeTile reading={gross} href={href}>
        <SeriesMark reading={gross} kind="slope" span={leverage} />
      </LargeTile>
      <LargeTile reading={net} href={href}>
        <SeriesMark reading={net} kind="slope" span={leverage} />
      </LargeTile>
      <div className="grid min-w-0 auto-rows-fr grid-cols-2 gap-3 sm:gap-4 lg:col-span-12 lg:grid-cols-4">
        <SmallTile reading={revenue} href={href}>
          <SeriesMark reading={revenue} kind="mini" />
        </SmallTile>
        <SmallTile reading={cover} href={href}>
          {coverEnds && (
            <Ruler
              {...coverEnds}
              tone={toneOf(cover)}
              suffix={cover.state === "ready" && cover.series.unit === "x" ? "x" : ""}
              label={spoken(cover.title, slotsOf(cover))}
            />
          )}
        </SmallTile>
        <SmallTile reading={ebitda} href={href}>
          {ebitdaEnds && <Change pair={ebitdaEnds} tone={toneOf(ebitda)} reading={ebitda} />}
        </SmallTile>
        <SmallTile reading={cash} href={href} whole>
          <CashMark cash={cash} undrawn={of("undrawn")} href={href} />
        </SmallTile>
      </div>
    </>
  );
}
