import { useState } from "react";
import { ChartWithTable } from "@/components/chart/ChartWithTable";
import { Missing } from "@/components/gap/Missing";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { card, field, label } from "../layout";
import { containsReference, type OutputEntry, type Table } from "../publishedReport";
import { PublishedTable } from "../ReportContent";
import { namedTable } from "../reportView";
import { distinct, sharePosition } from "../visuals/visualData";
import { canReadDownside, scenarioShareLabel } from "./Downside";
import { PublishedSource } from "./PublishedTrace";

const RETAINED = "T2DS.6 Break points";
const RANKINGS = ["T2B.7 First-break ranking", "First-break ranking"];
const FIXED_INTEREST = "EBITDA decline at break (interest held)";
const RATES_COLUMN = /^EBITDA decline at break \(k = (0(?:\.\d+)?|1(?:\.0+)?)\)$/;
const REQUIRED_DECLINE = "Required EBITDA decline";

type Basis = { name: string; column: number };

export function breakPointView(entry: OutputEntry) {
  if (!canReadDownside(entry)) return null;
  const retained = namedTable(entry, RETAINED, [
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
    return { table: retained, bases, test: 1, status: 4 };
  }
  const ranked = RANKINGS.map((title) =>
    namedTable(entry, title, ["Break point", REQUIRED_DECLINE]),
  ).filter(Boolean);
  const ranking = ranked.length === 1 ? ranked[0] : undefined;
  if (!ranking?.rows.length) return null;
  const test = ranking.headers.indexOf("Break point");
  const column = ranking.headers.indexOf(REQUIRED_DECLINE);
  const compatible =
    ranking.headers.join("|") === `Break point|${REQUIRED_DECLINE}` ||
    ranking.headers.join("|") === `Rank|Break point|${REQUIRED_DECLINE}`;
  const bases = compatible ? [{ name: REQUIRED_DECLINE, column }] : [];
  return { table: ranking, bases, test, status: undefined };
}

function threshold(text: string) {
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(text);
  const value = Number(percent?.[1]);
  return percent ? (value <= 100 ? value / 100 : null) : sharePosition(text);
}

function publicText(text: string) {
  return containsReference(text) ? "In Evidence" : text;
}

function trace(href: (line: number) => string, line: number, name: string) {
  return (
    <PublishedSource href={href(line)} name={name}>
      Break point source
    </PublishedSource>
  );
}

function orderedRows(table: Table, basis: Basis, test: number, status?: number) {
  return table.rows
    .map(({ line, cells }) => {
      const text = cells[basis.column] ?? "";
      return {
        line,
        label: publicText(cells[test] ?? ""),
        text: publicText(scenarioShareLabel(text)),
        status: status === undefined ? null : publicText(cells[status] ?? ""),
        value: threshold(text),
      };
    })
    .sort(
      (first, second) =>
        (first.value ?? Infinity) - (second.value ?? Infinity) || first.line - second.line,
    );
}

function RankBars({ rows }: { rows: ReturnType<typeof orderedRows> }) {
  return (
    <ol className="grid gap-3">
      {rows.map(({ label, line, text, status, value }) => (
        <li key={line} className="grid min-w-0 gap-1.5 border-b border-border-hairline pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
            <span className="min-w-0 font-medium wrap-anywhere">{label}</span>
            <span className="tabular-nums">{value === null ? <Missing /> : text}</span>
          </div>
          {value !== null && (
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-ds-full bg-surface-subtle"
            >
              <div
                className="ml-auto h-full min-w-0.5 rounded-ds-full bg-chart-1"
                style={{ width: `${String((1 - value) * 100)}%` }}
                data-decline={value}
              />
            </div>
          )}
          <div className="grid gap-1 text-small text-text-secondary">
            {value === null && text && <span>{text}</span>}
            {status && <span>{status}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function BreakPoints({
  data,
  href,
}: {
  data: NonNullable<ReturnType<typeof breakPointView>>;
  href: (line: number) => string;
}) {
  const [index, setIndex] = useState(0);
  const basis = data.bases[index];
  const rows = basis ? orderedRows(data.table, basis, data.test, data.status) : [];
  const chart = Boolean(
    basis && rows.some(({ value }) => value !== null) && distinct(rows.map(({ label }) => label)),
  );
  const title = "EBITDA break points";
  return (
    <section aria-label={title} className={`${card} ${TRACE_HOST} min-w-0`}>
      {data.bases.length > 1 && (
        <label className={`${label} max-w-xs`}>
          Cash-interest basis
          <select
            className={field}
            value={index}
            onChange={(event) => {
              setIndex(Number(event.target.value));
            }}
          >
            {data.bases.map(({ name }, at) => (
              <option key={name} value={at}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      {chart ? (
        <ChartWithTable
          title={title}
          as="h3"
          subtitle={basis?.name}
          note="Longer bars indicate a smaller EBITDA decline to the break point."
          actions={trace(href, data.table.line, title)}
          chart={<RankBars rows={rows} />}
          table={{
            head:
              data.status === undefined
                ? ["Break point", REQUIRED_DECLINE]
                : ["Break point", REQUIRED_DECLINE, "Qualification"],
            rows: rows.map(({ line, label, status, text }) => ({
              label,
              cells: data.status === undefined ? [text || null] : [text || null, status || null],
              end: trace(href, line, label),
            })),
            endHeading: "Sources",
          }}
        />
      ) : (
        <>
          <h3 className="font-display text-h3">{title}</h3>
          <p role="note">
            The source table does not establish a comparable ranking for this basis.
          </p>
          <PublishedTable
            table={data.table}
            href={href(data.table.line)}
            rowSource={(line, name) => trace(href, line, name)}
          />
        </>
      )}
    </section>
  );
}
