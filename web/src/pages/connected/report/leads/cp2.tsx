import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { moduleName } from "../../api";
import { evidencePath, type OutputEntry } from "../../publishedReport";
import { namedTable } from "../../reportView";
import { figureSource, moduleSource } from "../overview/figureData";
import { DeltaBar } from "../overview/marks";
import { figureShown, lastTwo, periodSeries, type Point, type Series } from "../overview/read";
import { Bento, Figure, Tile } from "../overview/Tile";
import { Bullets, leadTests } from "./bullet";
import { withDraws } from "./draws";
import { GapCell, LeadGap, MapTile, Notes, statedGap, Trace, Beside } from "./parts";
import {
  CELL_IN_EVIDENCE,
  columnOf,
  leadHref,
  mapOf,
  readerCell,
  registerTable,
  drawsNothing,
  sectionParagraphs,
  statedInProse,
} from "./read";
import type { LeadProps } from "./types";

const LEDGER_HEADER = [
  "direction",
  "rank",
  "label",
  "mechanism",
  "evidence_ids",
  "status",
  "source_id",
  "source_locator",
  "as_of",
].join("|");

type Item = { rank: number; label: string; mechanism: string; line: number };
/**
 * `unplaced`: rows whose direction is neither side, as "<label> (<direction as written>)"; `words`:
 * each side's heading in the module's own word for it, as first written.
 */
type Ledger = {
  strengths: Item[];
  weaknesses: Item[];
  unplaced: string[];
  words: { strengths: string; weaknesses: string };
};

const byRank = (a: Item, b: Item) => a.rank - b.rank;
const rankOf = (text: string) =>
  /^\d+$/.test(text.trim()) ? Number(text) : Number.POSITIVE_INFINITY;
/** A ledger cell as written; one whose every word names a source reads "In Evidence" (the row's trace). */
const written = (text: string) => {
  const cell = readerCell(text);
  return cell === "" || cell === "—" || cell === "-" ? "" : cell;
};
/** A ledger label as written; one naming a source is in Evidence, a missing one not stated. */
const labelOf = (text: string) => {
  const cell = readerCell(text);
  return cell === "" || cell === "—" || cell === "-" ? "Not stated" : cell;
};

type Sides = Readonly<Record<string, "strengths" | "weaknesses">>;

/** Files an item by the side its direction names, or as not placed with the direction as written. */
function place(ledger: Ledger, sides: Sides, direction: string, item: Item) {
  const key = direction.trim();
  const side = Object.hasOwn(sides, key.toLowerCase()) ? sides[key.toLowerCase()] : undefined;
  if (side && !ledger[side].length) ledger.words[side] = readerCell(key);
  if (side) ledger[side].push(item);
  else ledger.unplaced.push(`${item.label} (${readerCell(key) || "no direction stated"})`);
}

/** The typed strengths and weaknesses table, wherever the module put it. */
function typedLedger(entry: LeadProps["entry"]): Ledger | null {
  const found = entry.sections
    .flatMap(({ blocks }) => blocks)
    .find(
      (block) =>
        block.type === "table" &&
        block.headers.map((name) => name.trim().toLowerCase()).join("|") === LEDGER_HEADER,
    );
  if (found?.type !== "table") return null;
  const ledger: Ledger = {
    strengths: [],
    weaknesses: [],
    unplaced: [],
    words: { strengths: "STRENGTH", weaknesses: "WEAKNESS" },
  };
  const sides = { strength: "strengths", weakness: "weaknesses" } as const;
  for (const { cells, line } of found.rows) {
    const item = {
      rank: rankOf(cells[1] ?? ""),
      label: labelOf(cells[2] ?? ""),
      mechanism: written(cells[3] ?? ""),
      line,
    };
    place(ledger, sides, cells[0] ?? "", item);
  }
  return ledger;
}

/** The materiality filter split by its Direction column. */
function filterLedger(entry: LeadProps["entry"]): Ledger | null {
  const found = registerTable(entry, "T2.10", ["Rank", "Driver", "Direction"]);
  if (!found) return null;
  const at = {
    rank: columnOf(found, "Rank"),
    driver: columnOf(found, "Driver"),
    direction: columnOf(found, "Direction"),
    mechanic: columnOf(found, "Risk Mechanic"),
    implication: columnOf(found, "Credit Implication"),
  };
  if (at.rank < 0 || at.driver < 0 || at.direction < 0) return null;
  const ledger: Ledger = {
    strengths: [],
    weaknesses: [],
    unplaced: [],
    words: { strengths: "Positive", weaknesses: "Negative" },
  };
  const sides = { positive: "strengths", negative: "weaknesses" } as const;
  for (const { cells, line } of found.rows) {
    const item = {
      rank: rankOf(cells[at.rank] ?? ""),
      label: labelOf(cells[at.driver] ?? ""),
      mechanism: [at.mechanic, at.implication]
        .map((column) => (column < 0 ? "" : written(cells[column] ?? "")))
        .filter(Boolean)
        .join(" "),
      line,
    };
    place(ledger, sides, cells[at.direction] ?? "", item);
  }
  return ledger;
}

function Column({
  title,
  items,
  href,
}: {
  title: string;
  items: Item[];
  href: (line?: number) => string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h4 className="text-small font-medium text-text-primary">{title}</h4>
      {items.length ? (
        <ol aria-label={title} className="flex flex-col">
          {[...items].sort(byRank).map((item) => (
            <li
              key={item.line}
              className="flex items-start justify-between gap-3 border-t border-border-hairline py-2.5 first:border-t-0"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-small font-medium wrap-anywhere text-text-primary">
                  {item.label}
                </span>
                {item.mechanism && (
                  <span
                    className={cx(
                      "text-small wrap-anywhere",
                      item.mechanism === CELL_IN_EVIDENCE ? "text-gap-text" : "text-text-secondary",
                    )}
                  >
                    {item.mechanism}
                  </span>
                )}
              </span>
              <Trace href={href(item.line)} name={item.label} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-small text-gap-text">None listed.</p>
      )}
    </div>
  );
}

const LEDGER = "Strengths and weaknesses";

/** The ledger the page draws: the typed table, or the materiality filter, or none. */
function ledgerOf(entry: LeadProps["entry"]) {
  return typedLedger(entry) ?? filterLedger(entry) ?? null;
}

/** The ranked ledger's title when the module also wrote a passage under the plain one. */
const RANKED = "Ranked strengths and weaknesses";

function LedgerTile({
  ledger,
  href,
  alongside,
}: {
  ledger: ReturnType<typeof ledgerOf>;
  href: (line?: number) => string;
  /** The module wrote its own "Strengths and weaknesses" passage, which the frame draws under that title. */
  alongside: boolean;
}) {
  if (!ledger)
    return (
      <LeadGap
        span={12}
        label={LEDGER}
        title={LEDGER}
        reason="This page could not read a ranked list of strengths and weaknesses."
      />
    );
  return (
    <Tile
      span={8}
      label={alongside ? RANKED : LEDGER}
      title={alongside ? RANKED : LEDGER}
      className="w-full self-start"
    >
      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
        <Column title={ledger.words.strengths} items={ledger.strengths} href={href} />
        <Column title={ledger.words.weaknesses} items={ledger.weaknesses} href={href} />
      </div>
      <Notes notes={ledger.unplaced.map((text) => `Not placed: ${text}`)} />
    </Tile>
  );
}

function Stat({ name, trace, children }: { name: string; trace?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-t border-border-hairline pt-3 first:border-t-0 first:pt-0">
      <dt className="flex items-start justify-between gap-2 text-caption text-text-tertiary">
        {name}
        {trace}
      </dt>
      <dd className="flex min-w-0 flex-col gap-1">{children}</dd>
    </div>
  );
}

/** The three measures side by side from lg, divided by hairlines; one under another below it. */
const STRIP =
  "grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-3 lg:[&>div]:border-t-0 lg:[&>div]:pt-0 lg:[&>div:not(:first-child)]:border-l lg:[&>div:not(:first-child)]:pl-6";

const Reason = ({ children }: { children: ReactNode }) => (
  <span className="text-small text-gap-text">{children}</span>
);

const Caption = ({ children }: { children: ReactNode }) => (
  <span className="text-caption wrap-anywhere text-text-secondary">{children}</span>
);

/** A row's own "Basis and limitation" cell in a chart table, as a working page shows it. */
function basisAt(entry: OutputEntry, chart: string, line: number | undefined) {
  const table = namedTable(entry, `Chart data: ${chart}`, ["Period", "Reporting unit"]);
  const column = table ? columnOf(table, "Basis and limitation") : -1;
  const row = table?.rows.find((item) => item.line === line);
  return column < 0 || !row ? "" : readerCell(row.cells[column] ?? "");
}

const FINANCIALS = moduleName("CP-1");
const COVENANTS = moduleName("CP-4");

/**
 * The module entry a stat reads, or why there is none: as the Overview reads it, but an unreadable
 * handoff in the page's own words (the frame and Evidence hold the store's reason).
 */
function sourceEntry(view: LeadProps["view"], module: string, name: string, owner: string) {
  const read = moduleSource(view, module, name);
  return read.entry?.output.parseError
    ? { entry: read.entry, reason: `${owner}'s output could not be read; it is in Evidence.` }
    : read;
}

/** Each stated figure of a series with its period, when no period can be called the latest. */
function ByPeriod({ name, series }: { name: string; series: Series }) {
  return (
    <ul aria-label={`${name} by period`} className="flex flex-col gap-1">
      {series.points.map((point) => {
        const figure = figureShown(point, series.unit);
        const gap = figure === null ? statedGap(readerCell(point.cell)) : null;
        return (
          <li key={point.line} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-caption text-text-tertiary">
              {point.period || "Period not stated"}
            </span>
            {figure !== null ? (
              <Figure className="text-small">{figure}</Figure>
            ) : gap ? (
              <GapCell word={gap.word} reason={gap.reason} />
            ) : (
              <GapCell word={readerCell(point.cell) || "Not stated"} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One measure of the Financial foundation: its latest figure by period with its period, basis cell
 * and owner in words. "from <prior>" and the before-to-after mark only for the period a year earlier
 * by the handoff's period table, on the same basis; otherwise no comparison. When the periods cannot
 * be ordered, each stated figure with its period and no latest.
 */
function SeriesStat({
  props,
  name,
  chart,
  heading,
  alongside,
}: {
  props: LeadProps;
  name: string;
  chart: string;
  heading: RegExp;
  /** A second column of the same row, drawn beside the figure: the row's note may speak of it. */
  alongside?: { name: string; heading: RegExp };
}) {
  const { entry, reason } = sourceEntry(props.view, "CP-1", "The financial foundation", FINANCIALS);
  const series = entry && !reason ? periodSeries(entry, chart, heading) : null;
  if (!entry || reason || !series)
    return (
      <Stat name={name}>
        <Reason>{reason ?? `This page could not read ${name} from ${FINANCIALS}.`}</Reason>
      </Stat>
    );
  const { latest, prior } = lastTwo(series, entry);
  if (!latest)
    return series.points.length ? (
      <Stat
        name={name}
        trace={<Trace href={evidencePath(props.run.folder, entry, series.line)} name={name} />}
      >
        <Caption>{FINANCIALS}</Caption>
        <ByPeriod name={name} series={series} />
      </Stat>
    ) : (
      <Stat name={name}>
        <Reason>{`This page could not read ${name} from ${FINANCIALS}.`}</Reason>
      </Stat>
    );
  const shown = (point: Point) => figureShown(point, series.unit) ?? point.cell;
  const basis = basisAt(entry, chart, latest.line);
  const other = alongside ? periodSeries(entry, chart, alongside.heading) : null;
  const beside = other?.points.find((point) => point.line === latest.line);
  const gap = latest.value === null ? statedGap(readerCell(latest.cell)) : null;
  const before =
    prior &&
    prior.value !== null &&
    latest.value !== null &&
    basisAt(entry, chart, prior.line) === basis
      ? { prior, from: prior.value, to: latest.value }
      : null;
  return (
    <Stat
      name={name}
      trace={<Trace href={evidencePath(props.run.folder, entry, latest.line)} name={name} />}
    >
      <Caption>{`${latest.period}, ${FINANCIALS}`}</Caption>
      {latest.value !== null ? (
        <Figure className="text-h3 font-medium">{shown(latest)}</Figure>
      ) : gap ? (
        <GapCell word={gap.word} reason={gap.reason} />
      ) : (
        <GapCell word={readerCell(latest.cell) || "Not stated"} />
      )}
      {alongside && beside && (
        <Caption>{`${alongside.name} ${figureShown(beside, other?.unit ?? "") ?? beside.cell}`}</Caption>
      )}
      {basis && <Caption>{basis}</Caption>}
      {before && (
        <>
          <Caption>{`from ${shown(before.prior)} in ${before.prior.period}`}</Caption>
          <div className="w-52 max-w-full">
            <DeltaBar
              from={{
                label: before.prior.period,
                value: before.from,
                text: shown(before.prior),
              }}
              to={{ label: latest.period, value: before.to, text: shown(latest) }}
              tone="none"
              label={`${name}: ${shown(before.prior)} in ${before.prior.period}, ${shown(latest)} in ${latest.period}.`}
            />
          </div>
        </>
      )}
    </Stat>
  );
}

/**
 * The covenant module's own first test: its current and threshold labelled on the shared bullet, its
 * stated gap when it is one, with the owner and the row's basis in words. No other module's measure.
 */
function HeadroomStat({ props }: { props: LeadProps }) {
  const name = "Covenant headroom";
  const source = figureSource(props.view, "CP-4", name, COVENANTS);
  const { reason } = sourceEntry(props.view, "CP-4", COVENANTS, COVENANTS);
  if (source.state === "gap")
    return (
      <Stat name={name}>
        <Reason>{reason ?? `This page could not read covenant headroom from ${COVENANTS}.`}</Reason>
      </Stat>
    );
  const first = leadTests(source.table, source.descriptor)?.[0];
  if (!first)
    return (
      <Stat name={name}>
        <Reason>{`This page could not read a covenant test from ${COVENANTS}.`}</Reason>
      </Stat>
    );
  const column = source.table.headers.findIndex((header) => /^Basis and limitation$/i.test(header));
  const basis = column < 0 ? "" : readerCell(source.table.rows[0]?.[column] ?? "");
  const line = source.table.rowLines?.[0] ?? source.table.line;
  return (
    <Stat
      name={name}
      trace={<Trace href={evidencePath(props.run.folder, source.entry, line)} name={name} />}
    >
      <Caption>{COVENANTS}</Caption>
      <Bullets label={name} tests={[first]} tone="neutral" />
      {/* The bullet already prints the first test's own condition; the caption is for a shared basis. */}
      {basis && basis !== first.condition && <Caption>{basis}</Caption>}
    </Stat>
  );
}

/** CP-2: the credit view in one place: what supports it, what weakens it, and how risk travels. */
export const CreditLead = withDraws(
  function CreditLead(props: LeadProps) {
    const { entry } = props;
    if (drawsNothing(entry)) return null;
    const href = leadHref(props);
    const read = ledgerOf(entry);
    // A written ledger passage is the frame's; the lead adds no gap of the same title above it.
    const written = !read && sectionParagraphs(entry, LEDGER).length > 0;
    const measures = (strip: boolean) => (
      <Tile
        span={strip ? 12 : 4}
        label="Leverage, cover and headroom"
        title="Leverage, cover and headroom"
        className="w-full self-start"
      >
        <dl className={strip ? STRIP : "flex flex-col gap-3"}>
          <SeriesStat
            props={props}
            name="Total debt / EBITDA"
            chart="leverage"
            heading={/^Total debt \/ EBITDA$/}
            alongside={{ name: "Net debt / EBITDA", heading: /^Net debt \/ EBITDA$/ }}
          />
          <SeriesStat
            props={props}
            name="EBITDA / cash interest"
            chart="interest cover"
            heading={/^EBITDA \/ cash interest$/}
          />
          <HeadroomStat props={props} />
        </dl>
      </Tile>
    );
    const transmission = mapOf(entry, "credit-risk transmission");
    const longMap = "edges" in transmission && transmission.edges.length > 3;
    const map = (span: 4 | 12) =>
      !statedInProse(entry, "Map: credit-risk transmission") && (
        <MapTile
          map={mapOf(entry, "credit-risk transmission")}
          href={href}
          span={span}
          label="Credit-risk transmission"
          title="Credit-risk transmission"
          absent="This page could not read the credit-risk transmission."
        />
      );
    // The ledger heads the page with the measures and the map stacked beside it. With no ledger
    // the measures are one strip across the row and the map takes the next: three stacked figures
    // in a third of the row stood far taller than the map beside them.
    return (
      <Bento>
        {!written && (
          <LedgerTile
            ledger={read}
            href={href}
            alongside={sectionParagraphs(entry, LEDGER).length > 0}
          />
        )}
        {read && longMap ? (
          // A map of several edges is a long flow: beside the ledger it ran far below it and left
          // the ledger's side of the row empty. It takes its own row.
          <>
            <Beside>{measures(false)}</Beside>
            {map(12)}
          </>
        ) : read ? (
          <Beside>
            {measures(false)}
            {map(4)}
          </Beside>
        ) : (
          <>
            {measures(true)}
            {map(12)}
          </>
        )}
      </Bento>
    );
  },
  ["maps"],
);
