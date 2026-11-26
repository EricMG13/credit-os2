import { Fragment, useId, useLayoutEffect, useRef, useState } from "react";
import type { TableCell } from "@/components/chart/ChartTable";
import { amount, items, record, ticks, word } from "../../visuals/visualData";
import { forecastCaseNames } from "../../visuals/LegacyForecast";
import { scenarioShareLabel } from "../Downside";
import { forecastMeasure } from "../forecastData";
import { forecastInput } from "../ForecastRecord";
import { GapPattern } from "../overview/figureParts";
import {
  forwardPath,
  forwardStatement,
  NET_LEVERAGE,
  pathPeriods,
  unbased,
} from "../overview/stressData";
import { Bento, Figure, Tile } from "../overview/Tile";
import { withDraws } from "./draws";
import { GapCell, KeyValues, LeadFigure, LeadGap, Notes, TableRegion, Trace } from "./parts";
import { unitLabel } from "../../moneyUnits";
import { leadHref, readerCell, drawsNothing } from "./read";
import type { LeadProps } from "./types";

const PATH_LABEL = "Net leverage path";
const PATH_TITLE = "Net leverage by case";
const DRIVERS = "Drivers by case";

type Path = NonNullable<ReturnType<typeof forwardPath>>;
type Point = Path["cases"][number]["points"][number];

const TONES = [
  { stroke: "stroke-chart-1", fill: "fill-chart-1" },
  { stroke: "stroke-chart-2", fill: "fill-chart-2" },
  { stroke: "stroke-chart-3", fill: "fill-chart-3" },
] as const;
const toneOf = (at: number) => TONES[at % TONES.length] ?? TONES[0];

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "a", "a and b", "a, b and c". */
const joined = (words: readonly string[]) =>
  words.length < 2
    ? (words[0] ?? "")
    : `${words.slice(0, -1).join(", ")} and ${words.at(-1) ?? ""}`;

/** The number a displayed figure shows ("7.10x" reads 7.1); null when the display is not one. */
const displayed = (display: string) => amount(display.trim().replace(/x$/i, ""));

/** The highest shown forecast year, with wording tied to whether its figures were published. */
function highestYear(group: string, points: readonly Point[], calculated = false) {
  const available = points.filter((point) => point.value !== null);
  if (available.length < 2) return null;
  const read = available.map((point) => ({ point, shown: displayed(point.display) }));
  const shown = read.flatMap(({ shown: value }) => (value === null ? [] : [value]));
  if (shown.length !== read.length) return null;
  const top = Math.max(...shown);
  const at = read.filter(({ shown: value }) => value === top).map(({ point }) => point);
  const [first] = at;
  if (!first) return null;
  const years = at.map((point) => point.period);
  const when = years.length > 1 ? `${joined(years)}, tied` : first.period;
  const skipped = points.filter((point) => point.value === null).map((point) => point.period);
  const figureType = calculated ? "calculated" : "published";
  const missing = skipped.length ? `; no ${figureType} figure for ${joined(skipped)}` : "";
  const headline = calculated
    ? "Highest calculated forecast year"
    : "Highest published forecast year";
  return `${headline}, ${group}: ${first.display} (${when})${missing}.`;
}

/** A box's width in CSS pixels, so an SVG drawn to it keeps its text at its stated size. */
function useWidth(fallback: number) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { box, width };
}

/** The panel box: the plot runs 160px from its top gridline to its base, labels above and below. */
const P = { height: 232, left: 40, top: 36, base: 196, inset: 30 } as const;

/** One scale for every case: the model's values placed between the axis ticks, nothing joined across a gap. */
function scaleOf(path: Path) {
  const scale = ticks(path.cases.flatMap(({ points }) => points.map((point) => point.value)));
  const lo = scale[0]?.value ?? 0;
  const hi = scale.at(-1)?.value ?? 1;
  const y = (value: number) => P.base - ((value - lo) / (hi - lo || 1)) * (P.base - P.top);
  return { scale, y };
}

function CasePanel({
  group,
  points,
  periods,
  tone,
  y,
  scale,
}: {
  group: string;
  points: readonly Point[];
  periods: readonly string[];
  tone: (typeof TONES)[number];
  y: (value: number) => number;
  scale: ReturnType<typeof ticks>;
}) {
  const { box, width } = useWidth(240);
  const right = width - 8;
  const step = periods.length > 1 ? (right - P.left - 2 * P.inset) / (periods.length - 1) : 0;
  const x = (period: string) =>
    periods.length > 1 ? P.left + P.inset + periods.indexOf(period) * step : (P.left + right) / 2;
  const placed = points.map((point) => ({
    ...point,
    x: x(point.period),
    y: point.value === null ? null : y(point.value),
  }));
  const gapId = useId();
  return (
    <div data-case={group} className="flex min-w-0 flex-col gap-1">
      <h4 className="text-caption font-medium text-text-secondary">{group}</h4>
      <div ref={box} className="w-full max-w-sm min-w-0">
        {/* The view box is the drawn box in CSS pixels: every label is 12px at every width. */}
        <svg
          width={width}
          height={P.height}
          viewBox={`0 0 ${String(width)} ${String(P.height)}`}
          className="block"
        >
          <defs>
            <GapPattern id={gapId} />
          </defs>
          {scale.map((tick) => (
            <Fragment key={tick.value}>
              <line
                x1={P.left}
                y1={y(tick.value)}
                x2={right}
                y2={y(tick.value)}
                className="stroke-border-hairline"
              />
              <text
                x="0"
                y={y(tick.value) + 4}
                fontSize="12"
                className="fill-text-tertiary font-mono"
              >
                {tick.label}x
              </text>
            </Fragment>
          ))}
          {placed.map((point) =>
            point.y === null ? (
              // A period with no figure is an area on the plot: hatched, never a zero.
              <rect
                key={point.period}
                data-gap={point.period}
                x={point.x - 16}
                y={P.top - 8}
                width="32"
                height={P.base - P.top + 16}
                rx="4"
                fill={`url(#${gapId})`}
                strokeDasharray="3 3"
                className="stroke-border-gap"
              />
            ) : null,
          )}
          {placed.map((point, at) => {
            const next = placed[at + 1];
            return point.y !== null && next?.y != null ? (
              <line
                key={`segment-${point.period}`}
                x1={point.x}
                y1={point.y}
                x2={next.x}
                y2={next.y}
                strokeWidth="2"
                className={tone.stroke}
              />
            ) : null;
          })}
          {placed.map((point) =>
            point.y === null ? null : (
              <Fragment key={point.period}>
                <circle cx={point.x} cy={point.y} r="4" className={tone.fill} />
                <text
                  x={point.x}
                  y={point.y - 9}
                  textAnchor="middle"
                  fontSize="12"
                  className="fill-text-primary font-mono"
                >
                  {point.display}
                </text>
              </Fragment>
            ),
          )}
          {periods.map((period) => (
            <text
              key={period}
              x={x(period)}
              y={P.height - 8}
              textAnchor="middle"
              fontSize="12"
              className="fill-text-tertiary font-body"
            >
              {period}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

const COLUMNS = ["", "@xl:grid-cols-2", "@xl:grid-cols-2 @4xl:grid-cols-3"] as const;

/** Net leverage by case as small multiples on one shared scale: each case's points as the model displays them. */
function PathPanels({ path }: { path: Path }) {
  const periods = pathPeriods(path.cases);
  const { scale, y } = scaleOf(path);
  const reading = path.cases
    .map(
      ({ group, points }) =>
        `${group}: ${points.map((point) => `${point.period} ${point.value === null ? "no figure" : point.display}`).join(", ")}`,
    )
    .join(". ");
  const columns = COLUMNS[Math.min(path.cases.length, 3) - 1] ?? "";
  return (
    <div
      role="img"
      aria-label={`${path.measure}, one scale for every case. ${reading}.`}
      className="@container min-w-0"
    >
      <div
        aria-hidden="true"
        data-columns={Math.min(path.cases.length, 3)}
        className={`grid grid-cols-1 gap-x-6 gap-y-4 ${columns}`}
      >
        {path.cases.map(({ group, points }, at) => (
          <CasePanel
            key={group}
            group={group}
            points={points}
            periods={periods}
            tone={toneOf(at)}
            y={y}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
}

const FOCUS = "outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * The path with every case the model publishes: `forwardPath` reads only the main grid (base and
 * one downside), and the model holds its other cases (the upside) in the `other` grid, which
 * `forecastMeasure` reads. A case the path already draws is kept as it is; the others follow it.
 */
function withOtherCases(path: Path, model: unknown): Path {
  const drawn = new Set(path.cases.map(({ group }) => group));
  const extra = (forecastMeasure(model, NET_LEVERAGE)?.cases ?? [])
    .filter(({ group }) => !drawn.has(group))
    .map(({ group, cells }) => ({
      group,
      points: [...cells.values()].map(({ period, display, value, reason }) => ({
        period,
        display,
        value,
        reason,
      })),
    }))
    .filter(({ points }) => points.length > 0);
  return extra.length ? { ...path, cases: [...path.cases, ...extra] } : path;
}

/**
 * The path a lead draws: the main grid's, with the model's other cases after it; when the main grid
 * states no figure but another case does (an upside beside a base and downside that are n.m.), the
 * cases the model publishes alone. Null when no published case states a figure.
 */
export function leadPath(model: unknown): Path | null {
  const base = forwardPath(model);
  if (base) return withOtherCases(base, model);
  const measure = forecastMeasure(model, NET_LEVERAGE);
  if (!measure) return null;
  const grouped = withOtherCases(
    { measure: measure.label, cases: [], based: false, unbased: null, limits: [] },
    model,
  );
  const cases = [...grouped.cases].sort(
    (a, b) => Number(hasFigure(b.points)) - Number(hasFigure(a.points)),
  );
  if (!cases.some(({ points }) => hasFigure(points))) return null;
  const groups = cases.map(({ group }) => group);
  const based = cases[0]?.group === "Base case";
  return { ...grouped, cases, based, unbased: based ? null : unbased(groups) };
}

const hasFigure = (points: readonly { value: number | null }[]) =>
  points.some(({ value }) => value !== null);

function ForwardPathTile({
  view,
  entry,
  href,
}: {
  view: LeadProps["view"];
  entry: LeadProps["entry"];
  href: ReturnType<typeof leadHref>;
}) {
  const model = view.models[0];
  const replay =
    !model && view.previewForecast?.handoff.output.id === entry.output.id
      ? view.previewForecast
      : undefined;
  const calculation = model ?? (replay && { cashflow: replay.cashflow });
  const recorded = calculation ? leadPath(calculation) : null;
  if (!recorded)
    return (
      <LeadGap
        span={12}
        label={PATH_LABEL}
        title={PATH_TITLE}
        reason={
          model
            ? (forwardStatement(model) ??
              "This page could not read a net leverage path from the published model.")
            : replay
              ? "The retained inputs have a calculation replay in Forecast."
              : "No forecast model was published for this run."
        }
      >
        {replay && (
          <a className="text-small font-semibold text-action underline" href="#forecast">
            Open the forecast calculation replay
          </a>
        )}
      </LeadGap>
    );
  const names = replay && forecastCaseNames(replay.cashflow);
  const path = names
    ? {
        ...recorded,
        cases: recorded.cases.map((item) => ({
          ...item,
          group: names.get(item.group) ?? item.group,
        })),
      }
    : recorded;
  const periods = pathPeriods(path.cases);
  const highest = path.cases.flatMap(
    ({ group, points }) => highestYear(group, points, Boolean(replay)) ?? [],
  );
  const gaps = path.cases.flatMap(({ group, points }) =>
    points
      .filter((point) => point.value === null)
      .map((point) => (
        <span
          key={`${group}-${point.period}`}
          className="inline-flex flex-wrap items-baseline gap-x-2"
        >
          <span>{`${group}, ${point.period}`}</span>
          <GapCell
            word={readerCell(point.display) || "No figure"}
            reason={capital(readerCell(point.reason)) || "No figure in the model"}
          />
        </span>
      )),
  );
  return (
    <LeadFigure
      span={12}
      label={PATH_LABEL}
      title={PATH_TITLE}
      kicker={replay && "Test preview calculation"}
      basis={`${path.measure}; every case on one scale`}
      legend={
        <a
          href="#forecast"
          className={`inline-flex min-h-11 items-center rounded-ds-xs text-small font-medium text-text-link underline ${FOCUS}`}
        >
          {replay ? "Open the forecast calculation replay" : "Open the forecast"}
        </a>
      }
      trace={<Trace href={href(replay?.calculationLine)} name="the forward credit model" />}
      figure={<PathPanels path={path} />}
      table={{
        head: ["Case", ...periods],
        rows: path.cases.map(({ group, points }) => ({
          label: group,
          cells: periods.map((period): TableCell => {
            const point = points.find((item) => item.period === period);
            return point && point.value !== null && point.display ? point.display : { gap: true };
          }),
        })),
      }}
      notes={[replay?.reconciliation, path.unbased, ...highest, ...gaps]}
    />
  );
}

const DRIVER_NAMES: Record<string, string> = {
  revenue_growth: "Revenue growth",
  ebitda_margin: "EBITDA margin",
  capex_pct_revenue: "Capital expenditure as a share of revenue",
  tax_wc_pct_revenue: "Tax and working capital as a share of revenue",
  interest_rate: "Interest rate",
  dividends: "Dividends",
  debt_repayment: "Debt repayment",
};
const SHARES = new Set([
  "revenue_growth",
  "ebitda_margin",
  "capex_pct_revenue",
  "tax_wc_pct_revenue",
  "interest_rate",
]);
const CASES = [
  ["base_drivers", "Base case"],
  ["upside_drivers", "Upside case"],
  ["downside_drivers", "Downside drivers"],
] as const;

const driverName = (key: string) => DRIVER_NAMES[key] ?? key.replaceAll("_", " ");

/**
 * A number as a decimal, never in exponent form ("1e-7" is 0.0000001): its digits as JSON records
 * them, the decimal point moved by the exponent.
 */
function plainNumber(value: number) {
  const text = String(value);
  const exponent = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
  if (!exponent) return text;
  const [, sign = "", lead = "", rest = "", power = "0"] = exponent;
  const digits = `${lead}${rest}`;
  const point = 1 + Number(power);
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  return `${sign}${digits.padEnd(point, "0")}${digits.length > point ? `.${digits.slice(point)}` : ""}`;
}

/** A recorded share in percent, its digits unrounded; a leading minus kept in front ("-0.025" → "-2.5%"). */
function shareText(text: string) {
  const minus = /^[-−](?=\d)/.exec(text)?.[0];
  if (!minus) return scenarioShareLabel(text);
  const magnitude = text.slice(minus.length);
  const shown = scenarioShareLabel(magnitude);
  return shown === magnitude ? text : `${minus}${shown}`;
}

function stated(key: string, value: unknown): TableCell {
  if (typeof value === "number")
    return SHARES.has(key) ? shareText(plainNumber(value)) : plainNumber(value);
  if (typeof value !== "string" || !value.trim()) return { gap: true };
  return SHARES.has(key) ? shareText(value.trim()) : readerCell(value) || { gap: true };
}

/** The block's amount units in words: scale 1 is millions and 1000 thousands (cpos_forecast). */
function amountUnits(document: Record<string, unknown>) {
  const currency = word(document.currency) || "currency not recorded";
  const magnitude =
    document.scale === 1000 ? "thousands" : document.scale === 1 ? "millions" : null;
  return magnitude
    ? `Amounts: ${unitLabel(`${currency} ${magnitude}`)}, as recorded. Shares are shown as percentages.`
    : `Amounts as recorded; ${currency}. Shares are shown as percentages.`;
}

function shockLine(document: Record<string, unknown>) {
  const shock = document.downside_shock;
  if (shock === null || typeof shock !== "object") return "No downside shock is stated.";
  const { ebitda_decline: decline, rate_increase: rate } = record(shock);
  const recorded = (value: unknown) =>
    typeof value === "number"
      ? plainNumber(value)
      : typeof value === "string" && value.trim()
        ? readerCell(value)
        : null;
  const share = (value: unknown) => {
    const text = recorded(value);
    return text === null ? "not stated" : shareText(text);
  };
  return `Downside shock: EBITDA decline ${share(decline)}, cash-interest increase ${share(rate)}.`;
}

/** The forecast block's drivers by case and year, as stated; a case's inherited driver in words. */
function DriversTile({
  entry,
  href,
}: {
  entry: LeadProps["entry"];
  href: (line?: number) => string;
}) {
  const input = forecastInput(entry);
  if (!input)
    return (
      <LeadGap
        span={12}
        label={DRIVERS}
        title={DRIVERS}
        reason="This page could not read forecast inputs."
      />
    );
  const document = input.value;
  const years = items(document.years).map((year) => {
    const stated = record(year).year;
    return typeof stated === "number" ? String(stated) : word(stated) || "Year not stated";
  });
  const cases = CASES.filter(([key]) => {
    const value = document[key];
    return value !== null && typeof value === "object";
  });
  const base = record(document.base_drivers);
  const keys = [...new Set(cases.flatMap(([key]) => Object.keys(record(document[key]))))];
  const values = (group: string, key: string) => items(record(record(document[group])[key]).values);
  const anyValue = cases.some(([group]) =>
    keys.some((key) => values(group, key).some((value) => value !== null && value !== "")),
  );
  if (!anyValue) {
    const reasons = keys.flatMap((key) => {
      const rationale = word(record(base[key]).rationale).trim();
      return rationale ? [`${driverName(key)}: ${readerCell(rationale)}`] : [];
    });
    return (
      <LeadGap
        span={12}
        label={DRIVERS}
        title={DRIVERS}
        reason="The forecast block states no driver values."
        trace={<Trace href={href(input.line)} name="the forecast inputs" />}
      >
        {reasons.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-small text-text-secondary">
            {reasons.map((text) => (
              <li key={text} className="wrap-anywhere">
                {text}
              </li>
            ))}
          </ul>
        )}
      </LeadGap>
    );
  }
  const rows = keys.map((key) => ({
    label: driverName(key),
    cells: cases.flatMap(([group]) => {
      const inherited = group !== "base_drivers" && record(document[group])[key] === undefined;
      const list = values(group, key);
      return years.map((_, at): TableCell => (inherited ? "As base" : stated(key, list[at])));
    }),
  }));
  // Values the block states beyond its years are counted, never silently dropped.
  const beyond = cases.flatMap(([group, name]) =>
    keys.flatMap((key) => {
      const extra = values(group, key).length - years.length;
      return extra > 0
        ? [
            `${driverName(key)}, ${name}: ${String(extra)} ${extra === 1 ? "value" : "values"} not drawn (beyond the stated years).`,
          ]
        : [];
    }),
  );
  const head = ["Driver", ...cases.flatMap(([, name]) => years.map((year) => `${name}, ${year}`))];
  return (
    <Tile
      span={12}
      label={DRIVERS}
      title={DRIVERS}
      trace={<Trace href={href(input.line)} name="the forecast inputs" />}
      className="w-full self-start"
    >
      <p className="-mt-2 text-caption text-text-tertiary">
        {amountUnits(document)} A case shows “As base” where it keeps the base driver.
      </p>
      {/* Row labels keep a reading width; the table scrolls inside its own named region. */}
      <div className="hidden min-w-0 sm:block [&_tbody_th]:min-w-[16ch] [&_tbody_th]:whitespace-normal sm:[&_tbody_th]:min-w-[22ch]">
        <TableRegion label={DRIVERS} table={{ head, rows }} />
      </div>
      {/* Below sm, one card per driver: its case and year values as a list, never a one-column scroll. */}
      <ul aria-label={`${DRIVERS}, by driver`} className="flex flex-col sm:hidden">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex flex-col gap-2 border-t border-border-hairline py-3 first:border-t-0 first:pt-0"
          >
            <h4 className="text-small font-medium text-text-primary">{row.label}</h4>
            <KeyValues
              items={row.cells.map((value, at) => ({
                key: head[at + 1] ?? "",
                value:
                  typeof value === "string" ? (
                    <Figure className="text-caption">{value}</Figure>
                  ) : (
                    <GapCell word="Not stated" />
                  ),
              }))}
            />
          </li>
        ))}
      </ul>
      <Notes notes={[shockLine(document), ...beyond]} />
    </Tile>
  );
}

/** CP-2G: where net leverage goes in each case of the published model, and the drivers behind it. */
export const ForwardLead = withDraws(function ForwardLead(props: LeadProps) {
  const { entry, view } = props;
  if (drawsNothing(entry)) return null;
  const href = leadHref(props);
  return (
    <Bento>
      <ForwardPathTile view={view} entry={entry} href={href} />
      <DriversTile entry={entry} href={href} />
    </Bento>
  );
}, []);
