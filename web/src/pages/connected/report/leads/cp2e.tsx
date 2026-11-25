import type { OutputEntry, Table } from "../../publishedReport";
import { unitLabel } from "../../publishedReport";
import { ticks } from "../../visuals/visualData";
import { Ladder } from "../BreakPoints";
import { share } from "../Downside";
import {
  ForeignShareTile,
  FxShocksTile,
  HedgeTermsTile,
  macroView,
  RateLadderTile,
  RetainedCoverTile,
} from "../MacroSensitivity";
import { Key } from "../overview/figureParts";
import { Bento, Figure } from "../overview/Tile";
import { withDraws } from "./draws";
import { onlyGaps, OtherCharts, sourceOf, writtenTable } from "./written";
import { GapCell, LaneTile, LeadFigure, LeadGap, statedGap, Trace, Beside } from "./parts";
import {
  columnOf,
  eventsOf,
  leadHref,
  leadingMillions,
  readerCell,
  registerTable,
  drawsNothing,
  statedInProse,
} from "./read";
import type { LeadProps } from "./types";

type Href = (line: number) => string;

const LADDER = "Rate sensitivity";
const STEP = /(?:^|[\s(])\+\s?(\d+(?:\.\d+)?)\s?bp\b/;

const SECOND_AMOUNT = /\b[A-Z]{3} ?[+−-]?\d|\d(?:[\d,]*\d)?(?:\.\d+)? ?(?:million|billion|bn)\b/;
const RANGE_ON = /^\s*(?:to|or|and|[–—-])\s*[+−-]?\d/i;
const QUALIFIED =
  /\b(?:approximately|approx\.?|about|around|roughly|circa|up to|at least|at most)\b/i;

/**
 * The amount a cell opens with when it states exactly one: no second amount, no range ("to", a dash)
 * and no qualifier ("approximately", "about") anywhere; words after the amount are kept as written.
 */
function singleAmount(text: string) {
  const amount = leadingMillions(text);
  if (!amount) return null;
  const rest = text.trim().slice(amount.written.length);
  return SECOND_AMOUNT.test(rest) || RANGE_ON.test(rest) || QUALIFIED.test(text) ? null : amount;
}

/** A cell that is exactly one stated amount ("USD 3,400 million"), nothing after it. */
function soleAmount(text: string) {
  const amount = leadingMillions(text);
  return amount && amount.written === text.trim() ? amount : null;
}

/** A cash-impact cell that states a result: neither empty, a dash nor a stated gap. */
const stated = (text: string) => Boolean(text) && !/^[—–-]$/.test(text) && !statedGap(text);

/**
 * The skill's T2F.5 rows, each as written: its step, its cash impact and its own qualifier (the
 * "FCF / Liquidity Implication" cell, e.g. "Included in, not additional to, …"); `single` is the
 * amount of a "+N bp" step whose impact states exactly one. The headline is the first row that
 * states a result, whatever its cell parses to.
 */
function sensitivityRows(table: Table) {
  const label = columnOf(table, "Sensitivity");
  const impact = columnOf(table, "Estimated Cash Impact");
  const qualifier = columnOf(table, "FCF / Liquidity Implication");
  const rows = table.rows.map(({ line, cells }) => {
    const text = readerCell(cells[impact] ?? "");
    return {
      line,
      name: readerCell(cells[label] ?? ""),
      text,
      qualifier: qualifier < 0 ? "" : readerCell(cells[qualifier] ?? ""),
      step: STEP.test(cells[label] ?? ""),
      single: singleAmount(text),
    };
  });
  const head = rows.find((row) => stated(row.text));
  const steps = rows.filter((row) => row.step);
  const currencies = new Set(steps.map(({ single }) => single?.currency));
  // A ladder only when every "+N bp" step states one amount, in one currency, none below zero.
  const ladder =
    steps.length >= 3 &&
    currencies.size === 1 &&
    steps.every(({ single }) => single && single.value >= 0)
      ? steps.flatMap(({ single, ...row }) => (single ? [{ ...row, money: single }] : []))
      : null;
  const ordered = head ? [head, ...rows.filter((row) => row !== head)] : rows;
  return { rows: ordered, head, ladder, currency: [...currencies][0] ?? "" };
}

type Read = ReturnType<typeof sensitivityRows>;
type Row = Read["rows"][number];

/** A row's cash impact as written: the gap chip with its reason, or the cell in full. */
function Impact({ row, headline }: { row: Row; headline: boolean }) {
  const gap = statedGap(row.text);
  if (gap) return <GapCell word={gap.word} reason={gap.reason} />;
  if (!row.text) return <GapCell word="Not stated" />;
  if (!headline) return <Figure className="text-small wrap-anywhere">{row.text}</Figure>;
  // The headline's one stated amount in large type and its words after it; a cell stating two
  // amounts, a range or a qualifier is the headline whole.
  const rest = row.single ? row.text.slice(row.single.written.length).trim() : "";
  return row.single ? (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <Figure className="text-h3 font-medium">{row.single.written}</Figure>
      {rest && <span className="text-small wrap-anywhere text-text-secondary">{rest}</span>}
    </span>
  ) : (
    <Figure className="text-h4 font-medium wrap-anywhere">{row.text}</Figure>
  );
}

/** Every row of the sensitivity table as written, the first stated one first: impact and qualifier together. */
function StatedSteps({ read }: { read: Read }) {
  return (
    <ul aria-label={LADDER} className="flex flex-col">
      {read.rows.map((row) => {
        const headline = row === read.head;
        return (
          <li
            key={row.line}
            data-headline={headline ? "" : undefined}
            className="flex min-w-0 flex-col gap-1 border-t border-border-hairline py-3 first:border-t-0 first:pt-0"
          >
            <span className="text-small wrap-anywhere text-text-secondary">{row.name}</span>
            <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Impact row={row} headline={headline} />
              {row.qualifier && (
                <span className="min-w-0 text-small wrap-anywhere text-text-secondary">
                  {row.qualifier}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** CP-2E's own sensitivity table: the cash cost of each stated shock step, as written. */
function SensitivityTile({ table, href }: { table: Table; href: Href }) {
  const read = sensitivityRows(table);
  const trace = <Trace href={href(table.line)} name={LADDER} />;
  const { ladder } = read;
  const scale = ticks([0, ...(ladder ?? []).map(({ money }) => money.value)]);
  const top = scale.at(-1)?.value || 1;
  const words = ladder ? read.rows.filter((row) => !row.step) : [];
  return (
    <LeadFigure
      span={8}
      label={LADDER}
      title={LADDER}
      basis={
        ladder ? `Estimated cash impact, in ${unitLabel(`${read.currency} millions`)}` : undefined
      }
      legend={ladder && <Key tone="primary">Estimated cash impact</Key>}
      trace={trace}
      figure={
        ladder ? (
          <Ladder
            label={`${LADDER}: ${ladder.map((row) => `${row.name}: ${row.money.written}`).join("; ")}.`}
            ticks={scale.map((tick) => ({ at: tick.value / top, label: tick.label }))}
            rungs={ladder.map((row) => ({
              key: row.line,
              label: row.name,
              at: row.money.value / top,
              figure: row.money.written,
              bar: { "data-bar": row.money.written },
            }))}
          />
        ) : (
          <StatedSteps read={read} />
        )
      }
      table={writtenTable(sourceOf(table), href)}
      notes={words.map((row) => [row.name, row.text, row.qualifier].filter(Boolean).join(": "))}
    />
  );
}

/** The sensitivity table, or why there is none. */
function sensitivityTable(entry: OutputEntry) {
  const table = registerTable(entry, "T2F.5", ["Sensitivity", "Estimated Cash Impact"]);
  return table?.rows.length ? table : undefined;
}

const HEDGED = "Hedged against unhedged";
const HEDGED_TITLE = "Hedged and unhedged floating-rate debt";

/** T2F.4's hedged and unhedged floating-rate debt: one bar of the two stated amounts. */
function HedgedTile({ entry, href, span }: { entry: OutputEntry; href: Href; span: 8 | 12 }) {
  const table = registerTable(entry, "T2F.4", ["Metric", "Amount"]);
  const metric = table ? columnOf(table, "Metric") : -1;
  const amount = table ? columnOf(table, "Amount") : -1;
  const row = (name: string) =>
    table?.rows.find(({ cells }) => cells[metric]?.trim().toLowerCase() === name.toLowerCase());
  const parts = [
    ["hedged", "Hedged floating-rate debt"],
    ["unhedged", "Unhedged floating-rate debt"],
  ].map(([key = "", name = ""]) => {
    const found = row(name);
    const text = found?.cells[amount] ?? "";
    return { key, name, line: found?.line, text, value: soleAmount(text) };
  });
  const [hedged, unhedged] = parts;
  const gross = row("Gross floating-rate debt");
  const grossText = gross?.cells[amount] ?? "";
  const drawable =
    hedged?.value &&
    unhedged?.value &&
    hedged.value.currency === unhedged.value.currency &&
    hedged.value.value >= 0 &&
    unhedged.value.value >= 0 &&
    hedged.value.value + unhedged.value.value > 0;
  if (!table || !drawable || !hedged.value || !unhedged.value)
    return (
      <LeadGap
        span={span}
        label={HEDGED}
        title={HEDGED_TITLE}
        reason={
          table
            ? "This page could not read hedged and unhedged floating-rate debt as two amounts in one currency."
            : "This page could not read the floating-rate debt."
        }
        trace={table && <Trace href={href(table.line)} name={HEDGED} />}
      />
    );
  const total = hedged.value.value + unhedged.value.value;
  const rows = [
    hedged,
    unhedged,
    ...(gross ? [{ name: "Gross floating-rate debt", line: gross.line, text: grossText }] : []),
  ];
  return (
    <LeadFigure
      span={span}
      label={HEDGED}
      title={HEDGED_TITLE}
      legend={
        <>
          <Key tone="primary">Hedged</Key>
          <Key tone="secondary">Unhedged</Key>
        </>
      }
      trace={<Trace href={href(table.line)} name={HEDGED} />}
      figure={
        <div
          role="img"
          aria-label={`Floating-rate debt: Hedged floating-rate debt ${hedged.text}; Unhedged floating-rate debt ${unhedged.text}.`}
          className="flex min-w-0 flex-col gap-2"
        >
          <div aria-hidden="true" className="flex h-4 w-full gap-0.5 overflow-hidden rounded-ds-xs">
            <span
              data-segment="hedged"
              className="h-full bg-chart-1"
              style={{ width: share(hedged.value.value / total) }}
            />
            <span
              data-segment="unhedged"
              className="h-full bg-chart-2"
              style={{ width: share(unhedged.value.value / total) }}
            />
          </div>
          <div aria-hidden="true" className="flex flex-wrap justify-between gap-x-4 gap-y-1">
            <span className="flex flex-col">
              <span className="text-small text-text-secondary">Hedged</span>
              <span className="font-mono text-small text-text-primary tabular-nums">
                {hedged.text}
              </span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-small text-text-secondary">Unhedged</span>
              <span className="font-mono text-small text-text-primary tabular-nums">
                {unhedged.text}
              </span>
            </span>
          </div>
        </div>
      }
      table={{
        head: ["Metric", "Amount"],
        rows: rows.map((item) => ({
          label: item.name,
          cells: [readerCell(item.text) || null],
          end:
            item.line === undefined ? undefined : <Trace href={href(item.line)} name={item.name} />,
        })),
        endHeading: "Source",
      }}
      notes={soleAmount(grossText) ? [`Gross floating-rate debt: ${grossText.trim()}`] : []}
    />
  );
}

/** CP-2E: what a rate shock costs, how much of the floating debt is hedged, and the hedge terms. */
export const MacroLead = withDraws(
  function MacroLead(props: LeadProps) {
    const { entry, run } = props;
    if (drawsNothing(entry)) return null;
    const evidence = leadHref(props);
    const href: Href = (line) => evidence(line);
    const data = macroView(entry);
    const hedges = data?.hedges ?? registerTable(entry, "T2F.3", ["Hedge Type", "Notional"]);
    const sensitivity = sensitivityTable(entry);
    const first = data?.rate?.rows.length ? (
      <RateLadderTile table={data.rate} currency={data.currency} href={href} span={8} />
    ) : sensitivity ? (
      <SensitivityTile table={sensitivity} href={href} />
    ) : null;
    // A lane the module wrote as prose only is the frame's, in the module's words.
    const dates = !statedInProse(entry, "Events: Hedges") && (
      <LaneTile
        lane={eventsOf(entry, "Hedges")}
        span={12}
        label="Hedge dates"
        title="Hedge dates"
        href={evidence}
        asOf={run.asOf}
      />
    );
    // The foreign share comes from a currency register or the module's FX limitation; with
    // neither written there is no tile, and a gap only where one is written and not read.
    const currency = entry.sections.some(({ heading }) => /\bFX\b.*\bregister\b/i.test(heading));
    const foreign = (data?.fxGap || currency) && (
      <ForeignShareTile fxGap={data?.fxGap} href={href} span={12} />
    );
    const terms = <HedgeTermsTile hedges={hedges} exposures={data?.fxExposure} href={href} />;
    const others = <OtherCharts entry={entry} module="CP-2E" href={evidence} drawn={[]} />;
    const short = onlyGaps(entry, []);
    return (
      <Bento>
        {first ? (
          <>
            {first}
            <Beside>
              <HedgedTile entry={entry} href={href} span={12} />
              {foreign}
            </Beside>
          </>
        ) : (
          <>
            {/* A first tile that is only a gap is one compact row; the hedged split takes its place. */}
            <LeadGap
              span={12}
              label={LADDER}
              title={LADDER}
              reason="This page could not read the cash cost of each rate shock."
            />
            <HedgedTile entry={entry} href={href} span={foreign ? 8 : 12} />
            {foreign && <Beside>{foreign}</Beside>}
          </>
        )}
        {data?.retained && <RetainedCoverTile retained={data.retained} href={href} span={12} />}
        {data?.fx?.rows.length && (hedges || data.fxExposure) ? (
          <>
            <FxShocksTile table={data.fx} currency={data.currency} href={href} span={8} />
            <Beside>
              {terms}
              {short && others}
            </Beside>
            {!short && others}
          </>
        ) : (
          <>
            {data?.fx?.rows.length ? (
              <FxShocksTile table={data.fx} currency={data.currency} href={href} span={12} />
            ) : null}
            {terms}
            {others}
          </>
        )}
        {/* The hedge dates take the last row whole: a dated list beside a two-step table leaves a hole. */}
        {dates}
      </Bento>
    );
  },
  ["figures", "events"],
);
