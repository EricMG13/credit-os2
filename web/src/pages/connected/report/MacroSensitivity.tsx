import { BarCell } from "@/components/kit/BarCell";
import {
  blocked,
  containsReference,
  type OutputEntry,
  type Table,
  unitLabel,
} from "../publishedReport";
import { namedRow, namedTable } from "../reportView";
import { amount, distinct, sharePosition, ticks } from "../visuals/visualData";
import { Ladder } from "./BreakPoints";
import { sourceOf, writtenTable } from "./leads/written";
import { Key } from "./overview/figureParts";
import { Bento, Figure, Tile } from "./overview/Tile";
import {
  CompactGap,
  Disclosure,
  GapCell,
  KeyValues,
  LeadFigure,
  LeadGap,
  statedGap,
  Trace,
  type LeadTable,
} from "./leads/parts";
import { readerCell } from "./leads/read";

const RATE = [
  "Shock",
  "Rate shock",
  "Added annual interest before hedges",
  "Added annual interest after hedges",
  "Cash interest after the shock",
  "Interest coverage after the shock",
  "Change in interest coverage",
  "Free cash flow after the shock",
  "Added interest as share of EBITDA",
];
const FX = [
  "Shock",
  "Currency move",
  "Change in debt",
  "Total debt after the move",
  "Change in EBITDA",
  "Total leverage after the move",
];

function canonicalTable(entry: OutputEntry, id: string, title: string, headers: string[]) {
  const matches = (id ? [title, `${id} ${title}`] : [title]).flatMap(
    (name) => namedTable(entry, name, headers) ?? [],
  );
  const matched = matches.length === 1 ? matches[0] : undefined;
  const signature = matched?.headers.join("|");
  const expected = headers.join("|");
  return signature === expected || signature === `${expected}|Source` ? matched : undefined;
}

function retainedRate(entry: OutputEntry) {
  const ledger = canonicalTable(entry, "", "Calculations", [
    "ID",
    "Calculation",
    "Inputs",
    "Result",
    "Source",
  ]);
  const source = namedTable(entry, "Macro-exposure summary", [
    "Exposure",
    "Measure",
    "Hedge or offset",
    "Cash effect",
    "Creditor consequence",
    "Source",
  ]);
  if (!hasRetainedRateHeaders(source)) return null;
  const floating = namedRow(source, ({ cells }) => cells[0] === "Floating-rate debt (Term SOFR)");
  const impact = namedRow(ledger, ({ cells }) => cells[0] === "R4");
  const cover = namedRow(ledger, ({ cells }) => cells[0] === "R9");
  const parsed = retainedRateInputs(floating, cover);
  if (!impact || !cover || !floating || !parsed) return null;
  if (!retainedRateRowsMatch(floating, impact, cover, parsed)) return null;
  const { currency, money, bp, after, before } = parsed;
  const basis = entry.sections
    .filter(({ heading }) => heading === "Calculations")
    .flatMap(({ blocks }) => blocks)
    .find(
      (block) =>
        block.type === "text" &&
        block.text.startsWith(`All amounts are ${currency} million`) &&
        !containsReference(block.text),
    );
  return {
    currency,
    money,
    bp,
    after,
    before,
    cashLine: impact.line,
    coverLine: cover.line,
    basis: basis?.type === "text" ? basis.text : undefined,
  };
}

function hasRetainedRateHeaders(source: Table | undefined) {
  return (
    source?.headers.join("|") ===
    "Exposure|Measure|Hedge or offset|Cash effect|Creditor consequence|Source"
  );
}

function retainedRateInputs(
  floating: Table["rows"][number] | undefined,
  cover: Table["rows"][number] | undefined,
) {
  const cash = /^([A-Z]{3}) ([\d,.]+) million a year per (\d+) bp$/.exec(floating?.cells[3] ?? "");
  const ratio = /^(\d+(?:\.\d+)?)x; ratio \d+(?:\.\d+)?; (\d+(?:\.\d+)?)x before the shock$/.exec(
    cover?.cells[3] ?? "",
  );
  const [, currency, money, bp] = cash ?? [];
  const [, after, before] = ratio ?? [];
  if (!currency || !money || !bp || !after || !before || amount(money) === null) return null;
  return { currency, money, bp, after, before };
}

function retainedRateRowsMatch(
  floating: Table["rows"][number],
  impact: Table["rows"][number],
  cover: Table["rows"][number],
  parsed: NonNullable<ReturnType<typeof retainedRateInputs>>,
) {
  const { money, bp, after, before } = parsed;
  return (
    floating.cells[2] === "None disclosed" &&
    floating.cells[4] === `All-in cover ${before}x to ${after}x` &&
    impact.cells[1] === `${bp} bp cash-interest impact on unhedged floating debt` &&
    impact.cells[3] === money &&
    cover.cells[1] === "All-in cover after the shock (reported EBITDA over debt interest plus rent)"
  );
}

export function macroView(entry: OutputEntry) {
  if (
    entry.output.module !== "CP-2E" ||
    entry.output.parseError ||
    entry.output.state?.established === false ||
    blocked(entry)
  )
    return null;
  const operands = canonicalTable(entry, "T2F.1", "Sourced operands", [
    "Operand",
    "Value",
    "Basis",
  ]);
  const statedCurrency =
    namedRow(operands, ({ cells }) => cells[0] === "Reporting currency")?.cells[1] ?? "";
  const currency = /^[A-Z]{3}$/.test(statedCurrency) ? statedCurrency : "";
  const rate = canonicalTable(entry, "T2F.3", "Interest rate shock", RATE);
  const fx = canonicalTable(entry, "T2F.4", "Currency shock", FX);
  const hedges =
    canonicalTable(entry, "T2F.5", "Hedging", ["Item", "Value", "Convention"]) ??
    namedTable(entry, "T2F.3 — Hedging register", [
      "Hedge Type",
      "Notional",
      "Instrument Covered",
      "Rate / Strike",
      "Maturity",
      "Coverage Status",
      "Limitation",
      "Source",
    ]);
  const fxExposure = namedTable(entry, "T2F.6 — FX exposure and mismatch register", [
    "Exposure Type",
    "Natural Hedge?",
    "Limitation",
    "Source",
  ]);
  const fxGap = foreignGap(entry);
  const retained = rate?.rows.length ? null : retainedRate(entry);
  if (
    !retained &&
    !rate?.rows.length &&
    !fx?.rows.length &&
    !hedges?.rows.length &&
    !fxExposure?.rows.length
  )
    return null;
  return { currency, rate, fx, hedges, fxExposure, fxGap, retained };
}

/** The module's stated limitation on foreign-currency exposure: its words and the row's line. */
type ForeignGap = { line: number; text: string };

const FOREIGN_WORDS = /\b(?:currenc(?:y|ies)|foreign|FX)\b/i;

/**
 * The Gaps register's FX row. The contract's register labels it ("FX register" under Affected
 * analysis, the limitation under Effect); a run's register writes "Gap | Why it matters |
 * Conclusion affected | Severity", where the one gap that names currency or foreign sales is it.
 */
export function foreignGap(entry: OutputEntry): ForeignGap | undefined {
  const labelled = namedTable(entry, "Gaps", [
    "Gap",
    "Severity",
    "Affected analysis",
    "Effect",
    "Remediation",
    "Source",
  ]);
  const row = namedRow(labelled, ({ cells }) => cells[2] === "FX register" && Boolean(cells[3]));
  if (row?.cells[3]) return { line: row.line, text: row.cells[3] };
  const stated = namedTable(entry, "Gaps", ["Gap", "Why it matters", "Conclusion affected"]);
  const gap = stated?.headers.indexOf("Gap") ?? -1;
  const named = namedRow(stated, ({ cells }) => FOREIGN_WORDS.test(cells[gap] ?? ""));
  return named?.cells[gap] ? { line: named.line, text: named.cells[gap] } : undefined;
}

function moneyPosition(text: string, currency: string) {
  if (!currency) return null;
  const normalized = text.replaceAll("−", "-");
  const standard = amount(normalized);
  if (standard !== null) return standard;
  const stated = /^(-?)([A-Z]{3})\s*(-?[\d,]+(?:\.\d+)?)\s*(?:million|m)$/.exec(normalized);
  return stated?.[2] === currency ? amount(`${stated[1] ?? ""}${stated[3] ?? ""}`) : null;
}

function missingCell(text: string) {
  return (
    !text ||
    /^(?:—|n\.a\.|Not (?:stated|supplied|calculated|calculable|applicable)\b.*|∅ G\d+(?: n\.m\.)?)$/i.test(
      text,
    )
  );
}

type Href = (line: number) => string;
type Span = 4 | 6 | 8 | 12;
export type MacroData = NonNullable<ReturnType<typeof macroView>>;

/** A rate-shock row the figure can place: a positive bp step, before hedges and after on one basis. */
function rateRow(cells: readonly string[], currency: string) {
  const step = /^(\d+)(?:\s*bp)?$/.exec(cells[1] ?? "")?.[1];
  const gross = cells[2] ?? "";
  const net = cells[3] ?? "";
  const before = moneyPosition(gross, currency);
  const after = moneyPosition(net, currency);
  if (
    !step ||
    !Number.isSafeInteger(Number(step)) ||
    Number(step) <= 0 ||
    before === null ||
    before < 0 ||
    (after === null && !missingCell(net)) ||
    (after !== null && (after < 0 || after > before))
  )
    return null;
  return { step: `+${step} bp`, gross, net, before, after };
}

const AFTER = "After hedges";

/** A row's after-hedges figure as written, or its stated gap as the one gap chip. */
function AfterValue({ net, placed }: { net: string; placed: boolean }) {
  const text = readerCell(net);
  const gap = placed ? null : statedGap(text);
  return placed ? (
    <span>{text}</span>
  ) : gap ? (
    <GapCell word={gap.word} reason={gap.reason} className="font-body" />
  ) : (
    <GapCell word={text || "Not stated"} className="font-body" />
  );
}

/** "after" and its figure, or "after" and its gap chip, as one group that never breaks; a gap's reason follows. */
function AfterHedges({ net, placed }: { net: string; placed: boolean }) {
  const gap = placed ? null : statedGap(readerCell(net));
  return (
    <span className="flex flex-wrap items-baseline justify-end gap-x-1.5 text-caption text-text-secondary">
      <span data-after="" className="inline-flex items-baseline gap-x-1.5 whitespace-nowrap">
        <span className="font-body">after</span>
        {gap ? (
          <GapCell word={gap.word} className="font-body" />
        ) : (
          <AfterValue net={net} placed={placed} />
        )}
      </span>
      {gap && <span className="min-w-0 font-body wrap-anywhere text-gap-text">{gap.reason}</span>}
    </span>
  );
}

const MILLIONS = /\b(?:million|m)$/;

/**
 * The unit of a grid's money cells as the table states it: the currency and its millions when every
 * stated cell writes them ("USD 8.00m"), else the reporting currency alone; the page adds no magnitude.
 */
function statedMoneyUnit(texts: readonly string[], currency: string) {
  const stated = texts.map((text) => text.trim()).filter((text) => text && !missingCell(text));
  return stated.length && stated.every((text) => MILLIONS.test(text))
    ? unitLabel(`${currency} millions`)
    : currency;
}

/** Fewer than three steps: each step's stated figures in words, with its trace; no chart. */
function StatedSteps({ rows, href }: { rows: readonly RateRow[]; href: Href }) {
  return (
    <ul aria-label="Added annual interest by rate shock" className="flex flex-col">
      {rows.map((row) => (
        <li
          key={row.line}
          className="flex items-start justify-between gap-3 border-t border-border-hairline py-2.5 first:border-t-0 first:pt-0"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-small font-medium text-text-primary">{row.step}</span>
            <KeyValues
              items={[
                {
                  key: "Before hedges",
                  value: <Figure className="text-small">{readerCell(row.gross)}</Figure>,
                },
                {
                  key: AFTER,
                  value: (
                    <Figure className="text-small">
                      <AfterValue net={row.net} placed={row.after !== null} />
                    </Figure>
                  ),
                },
              ]}
            />
          </span>
          <Trace href={href(row.line)} name={row.step} />
        </li>
      ))}
    </ul>
  );
}

type RateRow = NonNullable<ReturnType<typeof rateRow>> & { line: number };

/** Fewest steps the ladder draws as a chart; fewer is a figure in words. */
const LADDER_STEPS = 3;

/** Deploy VII's rate-shock grid: added annual interest per step, before hedges, with the after mark. */
export function RateLadderTile({
  table,
  currency,
  href,
  span,
}: {
  table: Table;
  currency: string;
  href: Href;
  span: Span;
}) {
  const read = table.rows.map(({ cells, line }) => ({
    line,
    row: rateRow(cells, currency),
    cells,
  }));
  const drawn = read.flatMap(({ line, row }) => (row ? [{ line, ...row }] : []));
  const placed = drawn.length > 0 && distinct(drawn.map(({ step }) => step));
  const ladder = placed && drawn.length >= LADDER_STEPS;
  const scale = ticks([0, ...drawn.map(({ before }) => before)]);
  const top = scale.at(-1)?.value || 1;
  const unit = statedMoneyUnit(
    drawn.flatMap(({ gross, net }) => [gross, net]),
    currency,
  );
  const reading = drawn
    .map(
      ({ step, gross, net }) =>
        `${step}: before hedges ${gross}, after hedges ${net || "not stated"}`,
    )
    .join("; ");
  const left = read
    .filter(({ row }) => !row)
    .map(
      ({ cells }) =>
        `This page could not place ${readerCell(cells[0] ?? "")}; the table has it as written.`,
    );
  return (
    <LeadFigure
      span={span}
      label="Added annual interest"
      title="Added annual interest"
      basis={placed ? unit : undefined}
      legend={
        ladder && (
          <>
            <Key tone="primary">Before hedges (bar)</Key>
            <span className="flex items-center gap-1.5 text-caption font-normal text-text-secondary">
              <span aria-hidden="true" className="h-2.5 w-0.5 bg-text-primary" />
              After hedges (tick)
            </span>
          </>
        )
      }
      trace={<Trace href={href(table.line)} name="Added annual interest" />}
      figure={
        placed && !ladder ? (
          <StatedSteps rows={drawn} href={href} />
        ) : ladder ? (
          <Ladder
            label={`Added annual interest by rate shock, in ${unit}: ${reading}.`}
            ticks={scale.map((tick) => ({ at: tick.value / top, label: tick.label }))}
            rungs={drawn.map((row) => ({
              key: row.line,
              label: row.step,
              at: row.before / top,
              figure: (
                <span className="flex flex-col items-end gap-0.5">
                  <span>{readerCell(row.gross)}</span>
                  <AfterHedges net={row.net} placed={row.after !== null} />
                </span>
              ),
              bar: { "data-case": "Before hedges" },
              mark:
                row.after === null
                  ? null
                  : {
                      at: row.after / top,
                      data: { "data-case": AFTER, ...(row.after === 0 ? { "data-zero": "" } : {}) },
                    },
            }))}
          />
        ) : (
          <CompactGap>
            This page could not read comparable added annual interest for each rate shock.
          </CompactGap>
        )
      }
      table={writtenTable(sourceOf(table), href)}
      notes={placed ? left : []}
    />
  );
}

/** A currency-shock move the figure can place: the stated strengthening share. */
function fxMove(cells: readonly string[]) {
  const text = cells[1] ?? "";
  const pct = /^(\d+(?:\.\d+)?)%$/.exec(text);
  const position = pct ? Number(pct[1]) / 100 : sharePosition(text);
  const direction = /^Foreign currency strengthens, (?:first|second|third) move$/.test(
    cells[0] ?? "",
  );
  return direction && position !== null && position > 0 && position <= 1
    ? { position, text }
    : null;
}

/** Each measure of the grid: its cells by move, a bar only for a number on the measure's own unit. */
function fxRows(table: Table, currency: string) {
  return FX.slice(2).map((measure, index) => {
    const column = index + 2;
    const leverage = index === 3;
    const unit = leverage ? "x" : currency;
    const read = (text: string) =>
      leverage ? amount(text.replace(/x$/, "")) : moneyPosition(text, currency);
    const shown = leverage
      ? unit
      : statedMoneyUnit(
          table.rows.map(({ cells: row }) => row[column] ?? ""),
          currency,
        );
    const cells = table.rows.map(({ cells: row }) => {
      const text = row[column] ?? "";
      return { text: readerCell(text), value: unit ? read(text) : null };
    });
    const placed = cells.flatMap(({ value }) => (value !== null && value >= 0 ? [value] : []));
    const top = Math.max(0, ...placed);
    // Bars only where they tell the moves apart: a range under a tenth of the scale is figures only.
    const bars = top > 0 && Math.max(...placed) - Math.min(...placed) >= top / 10;
    return {
      measure: shown ? `${measure} (${shown})` : measure,
      bars,
      cells: cells.map(({ text, value }) => ({
        text,
        share: value === null || value < 0 ? null : top > 0 ? value / top : 0,
      })),
    };
  });
}

const FX_TITLE = "Foreign-currency strengthening";

/** Deploy VII's currency-shock grid: every measure against every stated move, in one compact table. */
export function FxShocksTile({
  table,
  currency,
  href,
  span,
}: {
  table: Table;
  currency: string;
  href: Href;
  span: Span;
}) {
  const moves = table.rows.map(({ cells }) => fxMove(cells));
  const readable =
    moves.length > 1 &&
    moves.every(Boolean) &&
    new Set(moves.map((item) => item?.position)).size === moves.length;
  const rows = readable ? fxRows(table, currency) : [];
  return (
    <LeadFigure
      span={span}
      label={FX_TITLE}
      title={FX_TITLE}
      trace={<Trace href={href(table.line)} name={FX_TITLE} />}
      figure={
        readable ? (
          <table className="w-full max-w-3xl border-collapse text-small">
            <caption className="sr-only">{`${FX_TITLE}, by currency move`}</caption>
            <thead>
              <tr className="border-b border-border-hairline">
                {moves.map((move, at) => (
                  <th
                    key={at}
                    scope="col"
                    className="px-2 pb-2 text-left text-caption font-medium text-text-tertiary"
                  >
                    {move?.text}
                  </th>
                ))}
              </tr>
            </thead>
            {rows.map((row) => (
              <tbody key={row.measure} className="border-b border-border-hairline">
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={moves.length}
                    className="pt-2.5 text-left text-small font-medium wrap-anywhere text-text-secondary"
                  >
                    {row.measure}
                  </th>
                </tr>
                <tr>
                  {row.cells.map((cell, at) =>
                    row.bars ? (
                      <td key={at} data-bar-cell="" className="px-2 pt-1 pb-2.5">
                        <BarCell text={cell.text} share={cell.share} />
                      </td>
                    ) : (
                      <td key={at} className="px-2 pt-1 pb-2.5">
                        <Figure className="text-small">{cell.text}</Figure>
                      </td>
                    ),
                  )}
                </tr>
              </tbody>
            ))}
          </table>
        ) : (
          <CompactGap>This page could not read two or more distinct currency moves.</CompactGap>
        )
      }
      table={writtenTable(sourceOf(table), href)}
    />
  );
}

/** The retained one-step rate test: all-in cover before and after, and the added cash interest. */
export function RetainedCoverTile({
  retained,
  href,
  span,
}: {
  retained: NonNullable<MacroData["retained"]>;
  href: Href;
  span: Span;
}) {
  const { before, after, bp, currency, money } = retained;
  const shock = `+${bp} bp`;
  const measure = "Reported EBITDA over debt interest plus rent";
  const figures = [
    { name: "Before the shock", text: `${before}x` },
    { name: shock, text: `${after}x` },
  ];
  return (
    <LeadFigure
      span={span}
      label="All-in cover"
      title="All-in cover"
      basis={measure}
      trace={<Trace href={href(retained.coverLine)} name="All-in cover" />}
      figure={
        <div
          role="img"
          aria-label={`All-in cover: ${figures.map(({ name, text }) => `${name} ${text}`).join(", ")}.`}
          className="flex flex-wrap items-end gap-x-6 gap-y-2"
        >
          {figures.map(({ name, text }, at) => (
            <span key={name} className="flex items-end gap-6">
              {at > 0 && (
                <span aria-hidden="true" className="pb-1 text-text-tertiary">
                  →
                </span>
              )}
              <span aria-hidden="true" className="flex flex-col gap-0.5">
                <span className="text-caption text-text-tertiary">{name}</span>
                <Figure className="text-h3 font-medium">{text}</Figure>
              </span>
            </span>
          ))}
        </div>
      }
      table={{
        head: ["Measure", "Before the shock", shock],
        rows: [{ label: measure, cells: [`${before}x`, `${after}x`] }],
      }}
      notes={[
        <span key="cash" className="flex flex-wrap items-center gap-2">
          <span>
            Annual cash interest increases by{" "}
            <strong className="font-mono font-medium text-text-primary">
              {currency} {money} million
            </strong>{" "}
            under the recorded shock.
          </span>
          <Trace href={href(retained.cashLine)} name="Added annual cash interest" />
        </span>,
        <span key="after" role="note">
          No separate after-hedges result was established.
        </span>,
        ...(retained.basis ? [retained.basis] : []),
      ]}
    />
  );
}

/** What share of the business is in foreign currency: the module's own limitation, or the gap. */
export function ForeignShareTile({
  fxGap,
  href,
  span,
}: {
  fxGap: MacroData["fxGap"];
  href: Href;
  span: Span;
}) {
  const reason = fxGap?.text
    ? readerCell(fxGap.text)
    : "This page could not read a foreign-currency share.";
  return (
    <LeadGap
      span={span}
      label="Foreign share"
      title="Foreign-currency share"
      reason={reason}
      trace={fxGap && <Trace href={href(fxGap.line)} name="Currency exposure limitation" />}
    />
  );
}

/** The hedge register and any currency exposure register, as written, each behind a closed disclosure. */
export function HedgeTermsTile({
  hedges,
  exposures,
  href,
}: {
  hedges: Table | undefined;
  exposures?: Table | undefined;
  href: Href;
}) {
  const terms: LeadTable | undefined = hedges ? writtenTable(sourceOf(hedges), href) : undefined;
  const currency = exposures ? writtenTable(sourceOf(exposures), href) : undefined;
  if (!terms && !currency) return null;
  return (
    <Tile
      span={12}
      label="Hedge terms"
      title="Hedge terms"
      trace={hedges && <Trace href={href(hedges.line)} name="Hedge terms" />}
      className="w-full self-start"
    >
      {terms && <Disclosure label="Hedge terms" summary="Show the hedge terms" table={terms} />}
      {currency && (
        <Disclosure
          label="Published currency exposures"
          summary="Show the published currency exposures"
          table={currency}
        />
      )}
    </Tile>
  );
}

/** CP-2E's figures that the Deploy VII tables carry: rate grid, currency grid, retained test, terms. */
export function MacroSensitivity({ data, href }: { data: MacroData; href: Href }) {
  const { retained, rate, fx, fxExposure, fxGap, hedges, currency } = data;
  return (
    <Bento>
      {rate?.rows.length ? (
        <RateLadderTile table={rate} currency={currency} href={href} span={12} />
      ) : null}
      {retained && <RetainedCoverTile retained={retained} href={href} span={12} />}
      {fx?.rows.length ? (
        <FxShocksTile table={fx} currency={currency} href={href} span={12} />
      ) : null}
      {fxGap && <ForeignShareTile fxGap={fxGap} href={href} span={12} />}
      <HedgeTermsTile hedges={hedges} exposures={fxExposure} href={href} />
    </Bento>
  );
}
