import { useState, type ReactNode } from "react";
import { ComparisonChart, type ComparisonPanel } from "@/components/chart/ComparisonChart";
import { STATUS_SETS } from "@/components/status/sets";
import { StatusBadge } from "@/components/status/StatusBadge";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { card, field, heading, label } from "../layout";
import { PublishedTable } from "../ReportContent";
import { blocked, containsReference, type OutputEntry, unitLabel } from "../publishedReport";
import { namedTable } from "../reportView";
import { amount, distinct } from "../visuals/visualData";
import { PublishedSource } from "./PublishedTrace";

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
  const matrix = namedTable(entry, "T3.6 — Fundamental value matrix", MATRIX);
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

function reader(text: string) {
  return text && containsReference(text) ? "In Evidence" : text || "Not stated";
}

function Recommendation({ state }: { state: string }) {
  const states = STATUS_SETS["Security recommendation"];
  return Object.hasOwn(states, state) ? (
    <StatusBadge set="Security recommendation" state={state as keyof typeof states} />
  ) : (
    <span className="text-small font-medium">{reader(state)}</span>
  );
}

type Security = ReturnType<typeof securityRow>;
type EvidenceHref = (line: number) => string;

function SecurityCard({ item, date, href }: { item: Security; date?: string; href: EvidenceHref }) {
  return (
    <article
      className={`${TRACE_HOST} min-w-0 rounded-xl border border-border-subtle bg-surface-card p-4`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 font-semibold wrap-anywhere">{reader(item.name)}</h4>
        <Recommendation state={item.recommendation} />
        <PublishedSource href={href(item.line)} name={reader(item.name)}>
          Security source
        </PublishedSource>
      </header>
      <dl className="mt-3 grid gap-2.5 text-sm">
        {[
          ["Rank", item.rank],
          ["Relative value", item.value],
          [date ? `Market level · ${date}` : "Market level", item.market],
        ].map(([term, detail]) => (
          <div
            key={term}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 border-t border-border-hairline pt-2"
          >
            <dt className="font-medium wrap-anywhere">{term}</dt>
            <dd className="wrap-anywhere text-text-secondary">{reader(detail ?? "")}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

type Comparison = NonNullable<ReturnType<typeof securityView>>["chartable"];

function PriceAndYield({
  quotes,
  date,
  action,
}: {
  quotes: Comparison;
  date: string;
  action: ReactNode;
}) {
  const [chosen, choose] = useState(1);
  const first = quotes[0];
  const second = quotes[chosen] ?? quotes[1];
  if (!first || !second) return null;
  const cases: [string, string] = [first.name, second.name];
  const panels: ComparisonPanel[] = [
    {
      measure: "Last-trade price ($)",
      max: Math.max(first.price, second.price, 1),
      values: [first.price, second.price],
      texts: [first.priceText, second.priceText],
    },
    {
      measure: "Last-trade yield (%)",
      max: Math.max(first.yieldValue, second.yieldValue, 1),
      values: [first.yieldValue, second.yieldValue],
      texts: [first.yieldText, second.yieldText],
    },
  ];
  return (
    <div className={`${TRACE_HOST} grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4`}>
      {quotes.length > 2 && (
        <label className={`${label} max-w-sm`}>
          Compare against {first.name}
          <select
            className={field}
            value={chosen}
            onChange={(event) => {
              choose(Number(event.target.value));
            }}
          >
            {quotes.slice(1).map(({ name }, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      <ComparisonChart
        title="Last-trade prices and yields"
        subtitle={date}
        cases={cases}
        panels={panels}
        rowLabels={["First", "Second"]}
        table={{
          head: ["Measure", ...cases],
          rows: panels.map(({ measure, texts }) => ({ label: measure, cells: texts })),
        }}
        actions={action}
      />
    </div>
  );
}

/** `runUnit` is the run's money unit (`runMoneyUnit`); the market levels stay US market quotes. */
export function Securities({
  data,
  href,
  runUnit,
}: {
  data: NonNullable<ReturnType<typeof securityView>>;
  href: EvidenceHref;
  runUnit?: string;
}) {
  const { chartable, date, records, outcomes, summaryLine } = data;
  return (
    <section aria-label="Instrument decisions" className={`${card} min-w-0`}>
      <h3 className={heading}>Instrument decisions</h3>
      {records.length > 0 && runUnit && runUnit !== "US$m" && (
        <p role="note">{`Market levels are US market quotes in US dollars; this run reports in ${unitLabel(runUnit)}.`}</p>
      )}
      {records.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3">
          {records.map((item) => (
            <SecurityCard key={item.line} item={item} date={date} href={href} />
          ))}
        </div>
      )}
      {chartable.length >= 2 && date && summaryLine !== undefined ? (
        <PriceAndYield
          quotes={chartable}
          date={date}
          action={
            <PublishedSource href={href(summaryLine)} name="Last-trade prices and yields">
              Source table
            </PublishedSource>
          }
        />
      ) : records.length ? (
        <p role="note">The handoff does not supply a pair of comparable last trades.</p>
      ) : null}
      {outcomes && (
        <details className="min-w-0">
          <summary className="cursor-pointer font-semibold">Credit and recovery rationale</summary>
          <div className="mt-3">
            <PublishedTable
              table={outcomes}
              href={href(outcomes.line)}
              rowSource={(line, name) => (
                <PublishedSource href={href(line)} name={name}>
                  Rationale source
                </PublishedSource>
              )}
            />
          </div>
        </details>
      )}
    </section>
  );
}
