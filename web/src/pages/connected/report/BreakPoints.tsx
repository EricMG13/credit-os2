import { useState, type ReactNode } from "react";
import { Segmented } from "@/components/kit/Segmented";
import type { OutputEntry, Table } from "../publishedReport";
import { namedTable } from "../reportView";
import { distinct, sharePosition, ticks as niceTicks } from "../visuals/visualData";
import { canReadDownside, registerOrTitled, scenarioShareLabel, share } from "./Downside";
import { sourceOf, writtenTable } from "./leads/written";
import { Bento } from "./overview/Tile";
import { Legend } from "./leads/kit/marks/Legend";
import {
  BAR_TONE,
  BarRow,
  caseStyle,
  CompactGap,
  LeadFigure,
  Trace,
  type BarTone,
  type LeadTable,
} from "./leads/parts";
import { closed, readerCell } from "./leads/read";

const RETAINED = "T2DS.6 Break points";
const RANKINGS = ["T2B.7 First-break ranking", "First-break ranking"];
const FIXED_INTEREST = "EBITDA decline at break (interest held)";
const RATES_COLUMN = /^EBITDA decline at break \(k = (0(?:\.\d+)?|1(?:\.0+)?)\)$/;
const PERCENT_COLUMN = "EBITDA decline, %";
const REQUIRED_DECLINE = "Required EBITDA decline";
const TYPED_BREAK_HEADERS = [
  "Order / ID",
  "Condition at equality",
  "EBITDA at equality (USD million)",
  "EBITDA loss (USD million)",
  "Decline fraction",
  "Category / confidence and anchor",
];

type Basis = { name: string; column: number };

export function breakPointView(entry: OutputEntry) {
  if (!canReadDownside(entry)) return null;
  const retained = registerOrTitled(entry, "T2DS.6", RETAINED, [
    "Break ID",
    "Break",
    FIXED_INTEREST,
    "Status",
    "Source",
  ]);
  if (retained?.rows.length) {
    const [id, test, held, shocked, status, source] = retained.headers;
    const rate = RATES_COLUMN.exec(shocked ?? "")?.[1];
    const bases: Basis[] =
      id === "Break ID" &&
      test === "Break" &&
      held === FIXED_INTEREST &&
      rate !== undefined &&
      status === "Status" &&
      source === "Source" &&
      retained.headers.length === 6
        ? [
            { name: "Interest held", column: 2 },
            { name: `Cash-interest increase ${scenarioShareLabel(rate)}`, column: 3 },
          ]
        : [];
    return { table: retained, bases, test: 1, status: 4, ranked: false };
  }
  const ranked = RANKINGS.map((title) =>
    namedTable(entry, title, ["Break point", REQUIRED_DECLINE]),
  ).filter(Boolean);
  const ranking = ranked.length === 1 ? ranked[0] : undefined;
  if (!ranking?.rows.length) return writtenBreaks(entry);
  const test = ranking.headers.indexOf("Break point");
  const column = ranking.headers.indexOf(REQUIRED_DECLINE);
  const compatible =
    ranking.headers.join("|") === `Break point|${REQUIRED_DECLINE}` ||
    ranking.headers.join("|") === `Rank|Break point|${REQUIRED_DECLINE}`;
  const bases = compatible ? [{ name: REQUIRED_DECLINE, column }] : [];
  return { table: ranking, bases, test, status: undefined, ranked: true };
}

/**
 * The module's own `Break points` table (`Order | Condition | EBITDA decline, % | … | Interpretation`):
 * the conditions in the order written, each decline as the module states it in percent.
 */
function writtenBreaks(entry: OutputEntry) {
  const typed = registerOrTitled(
    entry,
    "T2DS.6",
    "T2DS.6 Break points in order of increasing EBITDA decline",
    TYPED_BREAK_HEADERS,
  );
  if (typed?.rows.length && typed.headers.join("|") === TYPED_BREAK_HEADERS.join("|")) {
    const condition = typed.headers.indexOf("Condition at equality");
    const decline = typed.headers.indexOf("Decline fraction");
    const status = typed.headers.indexOf("Category / confidence and anchor");
    return {
      table: typed,
      bases: [{ name: REQUIRED_DECLINE, column: decline }],
      test: condition,
      status,
      ranked: false,
    };
  }
  const table = namedTable(entry, "Break points", ["Condition", PERCENT_COLUMN]);
  const summary = table ?? namedTable(entry, "Break points", ["Condition", "EBITDA decline"]);
  if (!summary?.rows.length) return null;
  const declineHeader = summary.headers.includes(PERCENT_COLUMN)
    ? PERCENT_COLUMN
    : "EBITDA decline";
  if (
    summary.headers.filter((header) => header === "Condition").length !== 1 ||
    summary.headers.filter((header) => header === declineHeader).length !== 1
  )
    return null;
  const column = summary.headers.indexOf(declineHeader);
  const status =
    summary.headers.filter((header) => header === "Interpretation").length === 1
      ? summary.headers.indexOf("Interpretation")
      : -1;
  return {
    table: summary,
    bases: [{ name: REQUIRED_DECLINE, column }],
    test: summary.headers.indexOf("Condition"),
    status: status < 0 ? undefined : status,
    ranked: false,
  };
}

function threshold(text: string) {
  // A stated share above 100% is kept as written; the axis scales to it.
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(text);
  return percent ? Number(percent[1]) / 100 : sharePosition(text);
}

/** A cell as a working page draws it (`readerCell`): a cited clause to the trace, its words kept. */
const publicText = (text: string) => readerCell(text);

/** The table's rows as written; only a module-written first-break ranking is ordered by decline. */
function breakRows(table: Table, basis: Basis, test: number, ranked: boolean, status?: number) {
  const rows = table.rows.map(({ line, cells }) => {
    const text = cells[basis.column] ?? "";
    return {
      line,
      label: publicText(cells[test] ?? ""),
      text: publicText(scenarioShareLabel(text)),
      status: status === undefined ? null : publicText(cells[status] ?? ""),
      value: threshold(text),
    };
  });
  return ranked
    ? rows.sort(
        (first, second) =>
          (first.value ?? Infinity) - (second.value ?? Infinity) || first.line - second.line,
      )
    : rows;
}

export type Rung = {
  key: number;
  label: string;
  /** A caption under the label: the row's status as written. */
  detail?: string | null;
  /** Where the bar ends, as a share of the axis; null draws `words` in its place, never a bar. */
  at: number | null;
  words?: string;
  /** The value column: the figure as written. */
  figure: ReactNode;
  bar?: Record<`data-${string}`, string>;
  /** A second stated value on the same row, drawn as a tick (after hedges). */
  mark?: { at: number; data: Record<`data-${string}`, string> } | null;
};

const ROW =
  "grid grid-cols-[minmax(5rem,1fr)_minmax(0,auto)] items-center gap-x-3 gap-y-1 @md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_9.5rem]";

function Track({
  rung,
  ticks,
  tone,
}: {
  rung: Rung;
  ticks: readonly { at: number }[];
  tone: BarTone;
}) {
  const at = rung.at ?? 0;
  return (
    <BarRow
      end={at}
      ticks={ticks.map((tick) => tick.at).filter((tick) => tick !== 0)}
      zero={0}
      tone={tone}
      bar={rung.bar}
      className="col-span-2 @md:order-2 @md:col-span-1"
    >
      {at === 0 && (
        // A stated zero keeps a mark at the origin: never read as a missing value.
        <span
          data-origin
          className={`absolute -inset-y-1 left-0 w-1 rounded-ds-xs ${BAR_TONE[tone]}`}
        />
      )}
      {rung.mark && (
        <span
          {...rung.mark.data}
          className="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 bg-text-primary"
          style={{ left: share(rung.mark.at) }}
        />
      )}
    </BarRow>
  );
}

/**
 * Rows on one axis from zero: each row's label, a bar to its stated value and the value as written.
 * A row whose value is not a number keeps its words and draws no bar. `ticks` are axis shares.
 */
export function Ladder({
  label,
  rungs,
  ticks,
  axis,
  ordered = false,
  tone = "primary",
}: {
  label: string;
  rungs: readonly Rung[];
  ticks: readonly { at: number; label: string }[];
  /** What the axis measures, under the tick labels ("Fall in EBITDA"). */
  axis?: string;
  ordered?: boolean;
  /** The bars' and origin marks' colour; the primary blue unless a caller names a case's. */
  tone?: BarTone;
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <div role="img" aria-label={label} className="@container flex min-w-0 flex-col gap-1">
      <List aria-hidden="true" className="flex flex-col">
        {rungs.map((rung) => (
          <li
            key={rung.key}
            className={`${ROW} border-t border-border-hairline py-2 first:border-t-0`}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-small wrap-anywhere text-text-primary">{rung.label}</span>
              {rung.detail && (
                <span className="text-caption wrap-anywhere text-text-tertiary">{rung.detail}</span>
              )}
            </span>
            <span className="text-right font-mono text-small wrap-anywhere text-text-primary tabular-nums @md:order-3">
              {rung.figure}
            </span>
            {rung.at === null ? (
              <span className="col-span-2 text-small wrap-anywhere text-gap-text @md:order-2 @md:col-span-1">
                {rung.words}
              </span>
            ) : (
              <Track rung={rung} ticks={ticks} tone={tone} />
            )}
          </li>
        ))}
      </List>
      <div aria-hidden="true" className={ROW}>
        <span className="hidden @md:block" />
        <span className="relative col-span-2 h-4 @md:col-span-1">
          {ticks.map((tick, index) => (
            <span
              key={tick.at}
              className={`absolute font-mono text-caption text-text-tertiary tabular-nums ${
                index === 0
                  ? ""
                  : index === ticks.length - 1
                    ? "-translate-x-full"
                    : "-translate-x-1/2"
              }`}
              style={{ left: share(tick.at) }}
            >
              {tick.label}
            </span>
          ))}
        </span>
      </div>
      {axis && (
        <p aria-hidden="true" className={ROW}>
          <span className="hidden @md:block" />
          <span className="col-span-2 text-caption text-text-tertiary @md:col-span-1">{axis}</span>
        </p>
      )}
    </div>
  );
}

/**
 * The fall-in-EBITDA axis: from zero to a round maximum at or above the largest stated break (32%
 * runs to 40%), its ticks as shares of that maximum.
 */
function declineAxis(values: readonly (number | null)[]) {
  const scale = niceTicks(values.map((value) => (value === null ? null : value * 100)));
  const top = scale.at(-1)?.value || 1;
  // The ticks show the range; the caption names only what the axis measures.
  return {
    top: top / 100,
    ticks: scale.map((tick) => ({ at: tick.value / top, label: `${tick.label}%` })),
    words: "Fall in EBITDA",
  };
}
const TITLE = "EBITDA break points";

type Data = NonNullable<ReturnType<typeof breakPointView>>;

/** CP-2A's break-point ladder: the fall in EBITDA that reaches each break, as the module states it. */
export function BreakPointsTile({
  data,
  href,
  span,
}: {
  data: Data;
  href: (line: number) => string;
  span: 4 | 6 | 8 | 12;
}) {
  const [index, setIndex] = useState(0);
  const basis = data.bases[index];
  const style = caseStyle(index);
  const rows = basis ? breakRows(data.table, basis, data.test, data.ranked, data.status) : [];
  const chart = Boolean(
    basis && rows.some(({ value }) => value !== null) && distinct(rows.map(({ label }) => label)),
  );
  const choice =
    data.bases.length > 1 ? (
      <Segmented
        label="Cash-interest basis"
        segments={data.bases.map(({ name }, at) => ({ key: String(at), label: name }))}
        current={String(index)}
        onSelect={(key) => {
          setIndex(Number(key));
        }}
      />
    ) : null;
  const reading = rows
    .map(({ label, text, value }) => `${label} ${value === null ? text || "not stated" : text}`)
    .join(", ");
  const table: LeadTable | undefined = chart
    ? {
        head:
          data.status === undefined
            ? ["Break point", REQUIRED_DECLINE]
            : ["Break point", REQUIRED_DECLINE, "Qualification"],
        rows: rows.map(({ line, label, status, text }) => ({
          label,
          cells: data.status === undefined ? [text || null] : [text || null, status || null],
          end: <Trace href={href(line)} name={label} />,
        })),
        endHeading: "Source",
      }
    : writtenTable(sourceOf(data.table), href);
  const legendText = `Fall in EBITDA at the break${
    data.bases.length > 1 && basis ? `, ${basis.name.toLowerCase()}` : ""
  }`;
  const scale = declineAxis(rows.map(({ value }) => value));
  const figure = chart ? (
    <Ladder
      label={closed(`${TITLE}${basis ? `, ${basis.name.toLowerCase()}` : ""}: ${reading}`)}
      ordered={data.ranked}
      tone={style.tone}
      ticks={scale.ticks}
      axis={scale.words}
      rungs={rows.map((row) => ({
        key: row.line,
        label: row.label,
        detail: row.status,
        at: row.value === null ? null : row.value / scale.top,
        words: row.text || "Not stated",
        figure: row.value === null ? "" : row.text,
        bar: row.value === null ? undefined : { "data-decline": String(row.value) },
      }))}
    />
  ) : (
    <CompactGap>This page could not read a fall in EBITDA for each break point.</CompactGap>
  );
  const trace = <Trace href={href(data.table.line)} name={TITLE} />;
  return (
    <LeadFigure
      span={span}
      label={TITLE}
      title={TITLE}
      basis={choice ? undefined : basis?.name}
      legend={chart && <Legend items={[{ kind: "bar", tone: style.tone, text: legendText }]} />}
      trace={trace}
      controls={choice}
      figure={figure}
      table={table}
    />
  );
}

export function BreakPoints({ data, href }: { data: Data; href: (line: number) => string }) {
  return (
    <Bento>
      <BreakPointsTile data={data} href={href} span={12} />
    </Bento>
  );
}
