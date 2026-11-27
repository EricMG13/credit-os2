import type { ReactNode } from "react";
import { BarCell } from "@/components/kit/BarCell";
import { STATUS_SETS } from "@/components/status/sets";
import { StatusBadge } from "@/components/status/StatusBadge";
import { cx } from "@/utils/cx";
import {
  blocked,
  containsReference,
  type OutputEntry,
  type Table,
  unitLabel,
} from "../publishedReport";
import { namedTable } from "../reportView";
import { amount, distinct } from "../visuals/visualData";
import {
  GapCell,
  KeyValues,
  LeadFigure,
  Notes,
  statedGap,
  TableOrCards,
  Trace,
} from "./leads/parts";
import { readerCell, registerTable, rowName, sectionParagraphs } from "./leads/read";
import { sourceOf, writtenTable } from "./leads/written";
import { Key } from "./overview/figureParts";
import { Bento, Tile } from "./overview/Tile";

const TITLE = "Security decision summary";
const MATRIX = [
  "Security / Issuer",
  "Fundamental View",
  "Relative-Value View",
  "Structural / Recovery View",
  "Final Matrix Bucket",
  "Rationale",
  "Evidence ID",
  "Source",
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isoDate(text: string) {
  const shown = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/.exec(text);
  const month = MONTHS.indexOf(shown?.[2] ?? "") + 1;
  const iso =
    shown && month > 0
      ? `${shown[3] ?? ""}-${String(month).padStart(2, "0")}-${(shown[1] ?? "").padStart(2, "0")}`
      : text;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

function securityQuote(market: string) {
  const quoted = /^(\$\d[\d,]*\.\d{2}); yield (\d+(?:\.\d+)?%)(?:, \d+(?:\.\d+)?% rounded)?$/.exec(
    market,
  );
  const priceText = quoted?.[1];
  const yieldText = quoted?.[2];
  if (!priceText || !yieldText) return null;
  const price = amount(priceText.slice(1));
  const yieldValue = amount(yieldText.slice(0, -1));
  return price !== null && yieldValue !== null ? { price, priceText, yieldValue, yieldText } : null;
}

/** CP-3's one dated last-trade basis line; its amounts are in the run's currency
 * (docs/rulings/2026-11-16-reporting-currency-from-sources.md), its trades US market quotes. */
function hasMarketBasis(entry: OutputEntry, date: string, asOf: string | null) {
  const stamp = isoDate(date);
  const cutoff = isoDate(asOf ?? "");
  if (!stamp || !cutoff || stamp > cutoff) return false;
  const observations = entry.sections
    .filter(({ heading }) => heading === "Calculations")
    .flatMap(({ blocks }) =>
      blocks.flatMap((block) => {
        if (block.type !== "text") return [];
        return (
          /^All amounts [A-Z]{3} millions unless stated; yields are percentages from (?:FINRA )?last trades on (\d{4}-\d{2}-\d{2}); differences in yield are percentage points, shown in bp\.$/.exec(
            block.text,
          )?.[1] ?? []
        );
      }),
    );
  return observations.length === 1 && observations[0] === stamp;
}

function securityRow(line: number, cells: string[]) {
  const [name = "", market = "", rank = "", value = "", recommendation = "", source = ""] = cells;
  const located =
    source.trim() !== "" && !/^(?:Not (?:supplied|stated|available)|n\.a\.|—)/i.test(source);
  return {
    line,
    name,
    market,
    rank,
    value,
    recommendation,
    quote: located ? securityQuote(market) : null,
    /** The yield the market level states in the quote form, located or not; text only. */
    yieldText: securityQuote(market)?.yieldText ?? null,
  };
}

export function securityView(entry: OutputEntry, asOf: string | null) {
  if (
    entry.output.module !== "CP-3" ||
    entry.output.parseError ||
    entry.output.state?.established === false ||
    blocked(entry)
  )
    return null;
  const summary = namedTable(entry, TITLE, [
    "Instrument",
    "Rank",
    "Relative value",
    "Recommendation",
    "Source",
  ]);
  // The register id heads the section; the module writes its dash or none ("T3.6 Fundamental value matrix").
  const matrix = registerTable(entry, "T3.6", MATRIX);
  const outcomes =
    matrix?.headers.join("|") === MATRIX.join("|") && matrix.rows.length ? matrix : null;
  const date = /^Market level \(([^)]+)\)$/.exec(summary?.headers[1] ?? "")?.[1];
  const matches =
    date &&
    summary?.headers.join("|") ===
      `Instrument|Market level (${date})|Rank|Relative value|Recommendation|Source`;
  const records = matches ? summary.rows.map(({ line, cells }) => securityRow(line, cells)) : [];
  if (!records.length && !outcomes) return null;
  const chartable =
    date && hasMarketBasis(entry, date, asOf) && distinct(records.map(({ name }) => name))
      ? records.flatMap(({ name, quote }) =>
          quote && !containsReference(name) ? [{ name, ...quote }] : [],
        )
      : [];
  return {
    date,
    records,
    chartable,
    outcomes,
    summaryLine: records.length ? summary?.line : undefined,
  };
}

/** A cell as written for the reader; one naming a source stays in Evidence. */
function reader(text: string) {
  return text.trim() ? readerCell(text) : "Not stated";
}

/** "Relative value" → "the relative value"; a heading that opens on an acronym keeps it. */
const theColumn = (name: string) =>
  `the ${/^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name}`;

/** A cell as written, or its stated gap as the word and the module's reason; `column` its heading. */
function Written({ text, column }: { text: string; column: string }) {
  const gap = statedGap(text);
  if (gap) return <GapCell word={gap.word} reason={gap.reason} />;
  if (!text.trim())
    return (
      <GapCell
        word="Not stated"
        reason={`This page could not read ${theColumn(reader(column))}.`}
      />
    );
  return <>{reader(text)}</>;
}

function Recommendation({ state }: { state: string }) {
  const states = STATUS_SETS["Security recommendation"];
  return Object.hasOwn(states, state) ? (
    <span className="inline-flex whitespace-nowrap">
      <StatusBadge set="Security recommendation" state={state as keyof typeof states} />
    </span>
  ) : (
    <span className="text-small font-medium">{reader(state)}</span>
  );
}

type EvidenceHref = (line: number) => string;
type SecurityData = NonNullable<ReturnType<typeof securityView>>;

/** One instrument as the module wrote it; the shares place its bars where a comparable trade reads. */
type Instrument = {
  line: number;
  name: string;
  /** The module's cells for the table's `columns`, as written. */
  cells: string[];
  recommendation: string;
  /** The stated last-trade yield, where the market level states one in the quote form. */
  yieldText: string | null;
  /** The yield over the largest comparable stated yield; null where no bar is drawn. */
  share: number | null;
  /** The stated last-trade price and its share of the largest comparable price, where drawn. */
  price: { text: string; share: number } | null;
};

export type Instruments = {
  /** The heading of the column that names the instrument, as written. */
  name: string;
  /** Every other column the module wrote, in its order, except the recommendation and sources. */
  columns: string[];
  /** The column after which the last-trade column goes (the market level); -1 for none. */
  market: number;
  /** The recommendation column's heading as written. */
  recommendation: string;
  /** Whether a market level states a last-trade yield, so the last-trade column is drawn. */
  yields: boolean;
  /** Whether the module's table has a spread column. */
  spread: boolean;
  rows: Instrument[];
  line: number;
  notes: ReactNode[];
};

const NO_PAIR = "No pair of comparable last trades is supplied for this run.";
const NO_SPREAD = "This page could not read a spread.";
const NO_TRADE = "This page could not read a last trade.";

/**
 * The decision summary's instruments: a yield bar and a price bar only where the trade is
 * comparable (`chartable`, two or more), each against the largest of them; other yields as text.
 */
export function quotedInstruments(data: SecurityData, runUnit?: string): Instruments | null {
  const { records, chartable, date, summaryLine } = data;
  if (!records.length || summaryLine === undefined) return null;
  const drawn = chartable.length >= 2 ? chartable : [];
  const top = Math.max(0, ...drawn.map(({ yieldValue }) => yieldValue));
  const highest = Math.max(0, ...drawn.map(({ price }) => price));
  const rows = records.map((item): Instrument => {
    const quote = drawn.find(({ name }) => name === item.name);
    return {
      line: item.line,
      name: item.name,
      cells: [item.market, item.rank, item.value],
      recommendation: item.recommendation,
      yieldText: item.yieldText,
      share: quote && top > 0 ? quote.yieldValue / top : null,
      price: quote && highest > 0 ? { text: quote.priceText, share: quote.price / highest } : null,
    };
  });
  const notes = [
    runUnit && runUnit !== "US$m" && (
      <p key="unit" role="note">
        {`Market levels are US market quotes in US dollars; this run reports in ${unitLabel(runUnit)}.`}
      </p>
    ),
    !drawn.length && (
      <p key="pair" role="note">
        {NO_PAIR}
      </p>
    ),
  ].filter(Boolean);
  return {
    name: "Instrument",
    columns: [date ? `Market level (${date})` : "Market level", "Rank", "Relative value"],
    market: 0,
    recommendation: "Recommendation",
    yields: rows.some((row) => row.yieldText !== null),
    spread: false,
    rows,
    line: summaryLine,
    notes,
  };
}

const INSTRUMENT = /\b(?:instrument|security|securities|tranche|group)\b/i;
const SOURCE_COLUMN = /^(?:sources?|evidence|evidence id|source trace)$/i;

/**
 * The real run's recommendation table: under "Recommendation", the first column names the
 * instrument and the last is "Recommendation"; every other column is drawn as written. Its market
 * levels are prices or ranges, so no bar.
 */
export function recommendationInstruments(entry: OutputEntry): Instruments | null {
  const table = entry.sections
    .filter((section) => section.heading === "Recommendation")
    .flatMap(({ blocks }) => blocks)
    .find(
      (block) =>
        block.type === "table" &&
        block.rows.length > 0 &&
        block.headers.at(-1)?.trim() === "Recommendation" &&
        INSTRUMENT.test(block.headers[0] ?? ""),
    );
  if (table?.type !== "table") return null;
  const last = table.headers.length - 1;
  const shown = table.headers.flatMap((header, at) =>
    at === 0 || at === last || SOURCE_COLUMN.test(header.trim()) ? [] : [at],
  );
  const columns = shown.map((at) => table.headers[at] ?? "");
  return {
    name: table.headers[0] ?? "Instrument",
    columns,
    market: columns.findIndex((header) => /^Market level\b/i.test(header.trim())),
    recommendation: table.headers[last] ?? "Recommendation",
    yields: false,
    spread: columns.some((header) => /\bspread\b/i.test(header)),
    rows: table.rows.map(({ line, cells }) => ({
      line,
      name: cells[0] ?? "",
      cells: shown.map((at) => cells[at] ?? ""),
      recommendation: cells[last] ?? "",
      yieldText: null,
      share: null,
      price: null,
    })),
    line: table.line,
    notes: [],
  };
}

/**
 * The last trade: price and yield bars where the trade is comparable, the stated yield as text
 * otherwise, or the gap. `marks` tags the bars for the table's checks.
 */
function LastTrade({
  item,
  market,
  marks = false,
}: {
  item: Instrument;
  /** The market level's place in the row's cells. */
  market: number;
  marks?: boolean;
}) {
  if (item.yieldText !== null && item.share !== null)
    return (
      <span className="flex min-w-0 flex-col gap-1.5">
        {item.price && (
          <span {...(marks && { "data-price": item.price.text })} className="block min-w-0">
            <BarCell text={item.price.text} share={item.price.share} tone="secondary" />
          </span>
        )}
        <span {...(marks && { "data-bar": "" })} className="block min-w-0">
          <BarCell text={item.yieldText} share={item.share} />
        </span>
      </span>
    );
  if (item.yieldText !== null)
    return <span className="font-mono text-text-primary tabular-nums">{item.yieldText}</span>;
  const stated = statedGap(item.cells[market] ?? "");
  return (
    <GapCell word={stated ? "Not supplied" : "Not stated"} reason={stated?.reason || NO_TRADE} />
  );
}

/** How the page draws the T3.6 matrix's headings; a heading it does not know is drawn as written. */
const MATRIX_HEADINGS: Readonly<Record<string, string>> = {
  "Security / Issuer": "Security / issuer",
  "Fundamental View": "Fundamental view",
  "Relative-Value View": "Relative-value view",
  "Structural / Recovery View": "Structural / recovery view",
  "Final Matrix Bucket": "Final matrix bucket",
};

const tradeHeading = (data: Instruments) =>
  data.rows.some((row) => row.price) ? "Last-trade price and yield" : "Yield";

// The shared table look (ChartTable): hairline rules, tertiary headings, medium row headings.
const HEAD = "px-3 py-2 text-left align-bottom font-medium text-text-tertiary";
const BODY = "px-3 py-2 align-top wrap-anywhere";

/** The instrument table from 1280 px, where its fixed columns fit the tile; below it the cards. */
function InstrumentGrid({ data, href }: { data: Instruments; href: EvidenceHref }) {
  const trade = data.yields ? tradeHeading(data) : null;
  const before = data.columns.slice(0, data.market + 1);
  const after = data.columns.slice(data.market + 1);
  const columns = [...before, ...(trade ? [trade] : []), ...after];
  return (
    <div className="relative hidden min-w-0 xl:block">
      <table className="w-full table-fixed border-collapse text-body">
        <caption className="sr-only">Instrument decisions</caption>
        <colgroup>
          <col />
          {columns.map((name, at) => (
            <col key={at} className={name === trade ? "w-44" : undefined} />
          ))}
          <col className="w-48" />
          <col className="w-11" />
        </colgroup>
        <thead>
          <tr className="border-b-2 border-border-hairline">
            {[data.name, ...columns, data.recommendation].map((name, at) => (
              <th key={at} scope="col" className={HEAD}>
                {reader(name)}
                {/* Two bars a row: each is named by its colour's key, never by position alone. */}
                {name === trade && data.rows.some((row) => row.price) && (
                  <span data-bar-key className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <Key tone="secondary">Price</Key>
                    <Key tone="primary">Yield</Key>
                  </span>
                )}
              </th>
            ))}
            <th scope="col" className={HEAD}>
              <span className="sr-only">Source</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((item, index) => {
            const name = rowName(reader(item.name), index);
            const cell = (text: string, at: number) => (
              <td key={at} className={BODY}>
                <Written text={text} column={data.columns[at] ?? ""} />
              </td>
            );
            return (
              <tr key={item.line} className="border-b border-border-hairline last:border-b-0">
                <th scope="row" className={cx(BODY, "text-left font-medium text-text-primary")}>
                  {name}
                </th>
                {item.cells.slice(0, data.market + 1).map(cell)}
                {trade && (
                  <td className={BODY}>
                    <LastTrade item={item} market={Math.max(0, data.market)} marks />
                  </td>
                )}
                {item.cells
                  .slice(data.market + 1)
                  .map((text, at) => cell(text, at + data.market + 1))}
                <td className={BODY}>
                  <Recommendation state={item.recommendation} />
                </td>
                <td className="py-2 pl-2 align-top">
                  <Trace href={href(item.line)} name={name} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The instruments on a phone or tablet: one card each, every column the module wrote. */
function InstrumentCards({ data, href }: { data: Instruments; href: EvidenceHref }) {
  return (
    <ul aria-label="Instruments" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:hidden">
      {data.rows.map((item, index) => {
        const name = rowName(reader(item.name), index);
        return (
          <li
            key={item.line}
            className="flex min-w-0 flex-col gap-2.5 rounded-ds-sm border border-border-hairline p-3"
          >
            <span className="flex items-start justify-between gap-2">
              <h4 className="min-w-0 text-small font-medium wrap-anywhere text-text-primary">
                {name}
              </h4>
              <Trace href={href(item.line)} name={name} />
            </span>
            <Recommendation state={item.recommendation} />
            {data.yields && <LastTrade item={item} market={Math.max(0, data.market)} />}
            <KeyValues
              items={data.columns.map((column, at) => ({
                key: reader(column),
                value: <Written text={item.cells[at] ?? ""} column={column} />,
              }))}
            />
          </li>
        );
      })}
    </ul>
  );
}

/** CP-3's instruments: every column the module wrote, the last trade drawn where comparable. */
export function InstrumentTable({ data, href }: { data: Instruments; href: EvidenceHref }) {
  return (
    <LeadFigure
      span={12}
      label="Instrument decisions"
      title="Recommendation by instrument"
      trace={<Trace href={href(data.line)} name="Instrument decisions" />}
      figure={
        <div className="flex min-w-0 flex-col gap-4">
          {data.notes.length > 0 && (
            <div className="flex flex-col gap-1.5 text-small text-text-secondary">{data.notes}</div>
          )}
          <InstrumentGrid data={data} href={href} />
          <InstrumentCards data={data} href={href} />
        </div>
      }
      notes={data.spread ? undefined : [NO_SPREAD]}
    />
  );
}

/** The T3.6 fundamental value matrix, as written in the shared table, one trace per row. */
export function ValueMatrix({ table, href }: { table: Table; href: EvidenceHref }) {
  const label = "Credit and recovery rationale";
  const read = writtenTable(sourceOf(table), href);
  // The matrix's own column headings in sentence case, as every other heading on the page; the
  // cells stay as written.
  const written = read && {
    ...read,
    head: read.head.map((name) =>
      Object.hasOwn(MATRIX_HEADINGS, name) ? (MATRIX_HEADINGS[name] ?? name) : name,
    ),
  };
  return (
    <Tile
      span={12}
      label={label}
      title={label}
      trace={<Trace href={href(table.line)} name={label} />}
      className="w-full self-start"
    >
      {written && <TableOrCards label={label} table={written} />}
    </Tile>
  );
}

/** `runUnit` is the run's money unit (`runMoneyUnit`); the market levels stay US market quotes. */
export function Securities({
  data,
  href,
  runUnit,
}: {
  data: SecurityData;
  href: EvidenceHref;
  runUnit?: string;
}) {
  const instruments = quotedInstruments(data, runUnit);
  return (
    <Bento>
      {instruments && <InstrumentTable data={instruments} href={href} />}
      {data.outcomes && <ValueMatrix table={data.outcomes} href={href} />}
    </Bento>
  );
}

const PEERS = "Descriptive peer and benchmark evidence";

/** The module's own peer and benchmark levels, as it wrote them; null when it wrote no such table. */
export function peerLevels(entry: OutputEntry) {
  const table = entry.sections
    .filter((section) => section.heading.trim() === PEERS)
    .flatMap(({ blocks }) => blocks)
    .find((block): block is Table => block.type === "table" && block.rows.length > 0);
  return table ? { table, notes: sectionParagraphs(entry, PEERS) } : null;
}

/** Relative-value prose is separate evidence when the module supplies no peer-level table. */
export function hasRelativeValueNarrative(entry: OutputEntry) {
  return sectionParagraphs(entry, "Relative value").some(({ text }) => Boolean(text));
}

/** Peer and benchmark levels against the instrument, the module's passage and table as written. */
export function PeerLevels({
  peers,
  href,
}: {
  peers: NonNullable<ReturnType<typeof peerLevels>>;
  href: EvidenceHref;
}) {
  const label = "Relative value against peers";
  const written = writtenTable(sourceOf(peers.table), href);
  return (
    <Tile
      span={12}
      label={label}
      title={label}
      trace={<Trace href={href(peers.table.line)} name={label} />}
      className="w-full self-start"
    >
      {written && <TableOrCards label={label} table={written} />}
      <Notes notes={peers.notes.flatMap(({ text }) => (text ? [<p key={text}>{text}</p>] : []))} />
    </Tile>
  );
}
