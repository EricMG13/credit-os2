import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import {
  factsOf,
  fieldUnits,
  figure,
  latestRun,
  trend,
  type Coverage,
  type CoverageRun,
  type Fact,
  type Field,
  type Issuer,
  type TrendSeries,
} from "../coverageData";
import { Chip } from "@/components/kit/Chip";
import { card } from "../layout";
import { prose } from "./shared";
import { layoutTrend, type Box, type Metrics, type Placed, type Point } from "./trendLayout";

type Stated = Fact & { at: number };
type Dot = { fact: Stated; index: number };
type Scale = { y: (value: number) => number; low: Stated | undefined; high: Stated | undefined };
/** Why a period draws no point, by what the run itself states for it. */
type Missing = { long: string; short: string };

/** The width a panel is laid out at until (or where) its own width can be read. */
const FALLBACK_WIDTH = 320;
const HEIGHT = 170;
const PAD = { left: 22, right: 12, top: 22, bottom: 34 };
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom;
const BOTTOM = PAD.top + PLOT_HEIGHT;
/** From this many points a series is drawn as lines; fewer are dots (two with a connector) and written values. */
const LINE_FROM = 3;
const IN_EVIDENCE = "the module's reason is in Evidence";

const isStated = (fact: Fact | null | undefined): fact is Stated =>
  fact != null && fact.at !== null;

/** The module's own reason for a stated gap, when it can be drawn on a working page. */
const gapReason = (fact: Fact): string => prose(fact.text) ?? IN_EVIDENCE;

const unitsOf = (facts: readonly Fact[]): string =>
  [...new Set(facts.map((fact) => fact.unit || "no unit stated"))].join(", ");

/** What is true of a period the run's panel draws no point for. */
function missingAt(facts: readonly Fact[], period: string, unit: string): Missing {
  const here = facts.filter((fact) => fact.period === period);
  const inUnit = here.filter((fact) => fact.at !== null && (fact.unit ?? "") === unit);
  if (inUnit.length > 1) {
    const texts = inUnit
      .map((fact) => `${figure(fact)}${fact.heading ? `, stated as ${fact.heading}` : ""}`)
      .join("; ");
    return {
      long: `states this period more than once (${texts}), so none is drawn`,
      short: `Stated more than once: ${texts}`,
    };
  }
  const stated = here.find((fact) => fact.at === null);
  if (stated) {
    const reason = gapReason(stated);
    return { long: reason, short: reason === IN_EVIDENCE ? "Reason in Evidence" : reason };
  }
  const other = here.filter((fact) => fact.at !== null);
  if (other.length > 0) {
    const units = unitsOf(other);
    return { long: `stated in another unit (${units}), not drawn here`, short: `In ${units} only` };
  }
  return { long: "no figure stated for this period", short: "No figure" };
}

/** Why an issuer's newest run gives no panel in this unit: another unit first, then its stated gap. */
function absentReason(facts: readonly Fact[], unit: string): string {
  const other = facts.filter((fact) => fact.at !== null && (fact.unit ?? "") !== unit);
  if (other.length > 0) return `stated only in another unit (${unitsOf(other)}), not drawn here`;
  const gaps = facts.filter((fact) => fact.at === null);
  if (gaps.length > 0) return [...new Set(gaps.map(gapReason))].join("; ");
  if (facts.length > 0) return "states figures in this unit without a period, so none is drawn";
  return "no figure stated for this measure in its newest run";
}

/** The unit most issuers' newest runs state a figure in; a tie keeps the sorted order. */
function openingUnit(
  units: readonly string[],
  issuers: readonly Issuer[],
  factsFor: (run: CoverageRun) => Fact[],
): string {
  const count = new Map<string, number>();
  for (const issuer of issuers) {
    const run = latestRun(issuer);
    const stated = run ? factsFor(run).filter((fact) => fact.at !== null) : [];
    for (const item of new Set(stated.map((fact) => fact.unit ?? "")))
      count.set(item, (count.get(item) ?? 0) + 1);
  }
  return units.reduce((best, item) =>
    (count.get(item) ?? 0) > (count.get(best) ?? 0) ? item : best,
  );
}

/** One scale for every panel, always holding zero: from the lowest figure (or zero) to the highest (or zero). */
function scaleOf(series: readonly TrendSeries[]): Scale {
  const stated = series.flatMap((item) => item.points.filter(isStated));
  const pick = (better: (a: number, b: number) => boolean) =>
    stated.reduce<Stated | undefined>(
      (found, fact) => (!found || better(fact.at, found.at) ? fact : found),
      undefined,
    );
  const low = pick((a, b) => a < b);
  const high = pick((a, b) => a > b);
  const bottom = Math.min(0, low?.at ?? 0);
  const top = Math.max(0, high?.at ?? 0);
  const span = top > bottom ? top - bottom : 1;
  return { y: (value) => PAD.top + ((top - value) / span) * PLOT_HEIGHT, low, high };
}

const x = (index: number, count: number, width: number): number =>
  PAD.left + ((index + 0.5) / count) * (width - PAD.left - PAD.right);

/** Stated points cut into runs of consecutive periods; a line never crosses a missing period. */
function segmentsOf(dots: readonly Dot[]): Dot[][] {
  const runs: Dot[][] = [];
  for (const dot of dots) {
    const open = runs.at(-1);
    const prev = open?.at(-1);
    if (open && prev && prev.index === dot.index - 1) open.push(dot);
    else runs.push([dot]);
  }
  return runs.filter((run) => run.length > 1);
}

function Lines({ dots, at }: { dots: readonly Dot[]; at: (dot: Dot) => string }) {
  const segments = segmentsOf(dots);
  if (dots.length >= LINE_FROM)
    return segments.map((run) => (
      <polyline
        key={run[0]?.index}
        data-segment=""
        points={run.map(at).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    ));
  return segments.map((run) => {
    const [from, to] = at(run[0] as Dot).split(",");
    const [x2, y2] = at(run[1] as Dot).split(",");
    return (
      <line
        key={run[0]?.index}
        data-segment=""
        x1={from}
        y1={to}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={1}
      />
    );
  });
}

/** Every SVG text is drawn at this size; 1 SVG unit is 1px, so this is its rendered size. */
const FONT = 12;
const DOT_R = 4;
const GAP_RISE = 14;
const TEXT_CLASS = "font-mono";
/** Where text cannot be measured (jsdom), a character is taken as 0.6em wide. */
const estimate = (text: string): number => text.length * FONT * 0.6;
const FALLBACK: Metrics = { width: estimate, ascent: FONT * 0.92, descent: FONT * 0.24 };

/** The panel's width in px, read after mount and on every resize; a fixed width where none can be read. */
function usePanelWidth(ref: RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => {
      const px = Math.floor(el.getBoundingClientRect().width);
      setWidth(px > 0 ? px : FALLBACK_WIDTH);
    };
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return width;
}

/** A count that rises once web fonts have loaded, so text is measured again in its real face. */
function useFontsLoaded(): number {
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    const fonts = (document as { fonts?: FontFaceSet }).fonts;
    if (!fonts) return undefined;
    let live = true;
    void fonts.ready.then(() => {
      if (live) setLoaded((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, []);
  return loaded;
}

/** Widths of the hidden measuring texts in the SVG, and the font's box from one of them. */
function measure(svg: SVGSVGElement): Metrics {
  const widths = new Map<string, number>();
  let ascent = 0;
  let descent = 0;
  for (const el of svg.querySelectorAll<SVGTextElement>("text[data-measure]")) {
    const text = el.textContent;
    const width = typeof el.getComputedTextLength === "function" ? el.getComputedTextLength() : 0;
    if (width > 0) widths.set(text, width);
    if (typeof el.getBBox === "function" && ascent === 0) {
      const box = el.getBBox();
      // Measured at baseline 0: the box starts ascent above it.
      if (box.height > 0) {
        ascent = -box.y;
        descent = box.y + box.height;
      }
    }
  }
  if (widths.size === 0 || ascent <= 0) return FALLBACK;
  return { width: (text) => widths.get(text) ?? estimate(text), ascent, descent };
}

function useMetrics(ref: RefObject<SVGSVGElement | null>, key: string, width: number): Metrics {
  const [metrics, setMetrics] = useState<Metrics>(FALLBACK);
  const fonts = useFontsLoaded();
  useLayoutEffect(() => {
    if (ref.current) setMetrics(measure(ref.current));
  }, [ref, key, width, fonts]);
  return metrics;
}

/** The figures written under a panel: every one of a short series; of a line, the last and any end not labelled on it. */
function writtenDots(dots: readonly Dot[], fallback: readonly number[]): Dot[] {
  if (dots.length < LINE_FROM) return [...dots];
  return dots.filter((_, i) => i === dots.length - 1 || fallback.includes(i));
}

const plotOf = (width: number): Box => ({
  left: PAD.left,
  right: width - PAD.right,
  top: PAD.top,
  bottom: BOTTOM,
});

function Panel({
  series,
  periods,
  scale,
  facts,
  unit,
  ordered,
}: {
  series: TrendSeries;
  periods: readonly string[];
  scale: Scale;
  facts: readonly Fact[];
  unit: string;
  /** Whether the periods are in time order; when they are not, no line joins them. */
  ordered: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const width = usePanelWidth(holder);
  const { y } = scale;
  const plot = plotOf(width);
  const px = (index: number) => x(index, periods.length, width);
  const dots: Dot[] = series.points.flatMap((fact, index) =>
    isStated(fact) ? [{ fact, index }] : [],
  );
  const headings = [
    ...new Set(dots.flatMap((dot) => (dot.fact.heading ? [dot.fact.heading] : []))),
  ];
  const missing = periods.flatMap((period, index) =>
    isStated(series.points[index]) ? [] : [{ period, index, ...missingAt(facts, period, unit) }],
  );
  const points = dots.map((dot) => ({
    x: px(dot.index),
    y: y(dot.fact.at),
    text: figure(dot.fact),
    period: dot.fact.period ?? "",
  }));
  const segments = dots.flatMap((dot, i): [Point, Point][] => {
    const prev = dots[i - 1];
    const from = points[i - 1];
    const to = points[i];
    return ordered && prev && from && to && prev.index === dot.index - 1 ? [[from, to]] : [];
  });
  const labelled = dots.length === 0 ? [] : [...new Set([0, dots.length - 1])];
  const texts = [
    "0",
    ...periods,
    ...points.flatMap((point) => [point.text, `${point.text} · ${point.period}`]),
  ];
  const metrics = useMetrics(svg, texts.join("\n"), width);
  const layout = layoutTrend({
    metrics,
    geometry: { width, height: HEIGHT, plot: plot, zero: y(0), axis: BOTTOM },
    points,
    segments,
    ticks: periods.map((period, index) => ({ x: px(index), text: period })),
    gaps: missing.map(({ index }) => ({ x: px(index), top: BOTTOM - GAP_RISE, bottom: BOTTOM })),
    dotRadius: DOT_R,
    labelled,
  });
  // Unordered periods draw no line, so every figure is written with its period, as stated.
  const written = ordered ? writtenDots(dots, layout.fallback) : [...dots];
  const at = (dot: Dot) => `${px(dot.index).toFixed(2)},${y(dot.fact.at).toFixed(2)}`;
  const zero = y(0).toFixed(2);
  const label = `${series.name}: ${dots.map((dot) => figure(dot.fact)).join(", ")} across ${dots
    .map((dot) => dot.fact.period)
    .join(", ")}`;
  return (
    <article
      aria-label={series.name}
      className="flex min-w-0 flex-col gap-3 rounded-ds-lg border border-border-subtle bg-surface-card p-4"
    >
      <h3 className="text-small font-semibold wrap-anywhere">{series.name}</h3>
      {headings.length > 0 && (
        <p className="m-0 text-caption text-text-secondary">
          {`Stated as ${headings.join("; ")}`}
        </p>
      )}
      <div ref={holder} className="w-full min-w-0">
        <svg
          ref={svg}
          role="img"
          aria-label={label}
          viewBox={`0 0 ${String(width)} ${String(HEIGHT)}`}
          className="block h-auto w-full text-chart-1"
        >
          <g data-measuring="" aria-hidden="true" visibility="hidden">
            {[...new Set(texts)].map((text) => (
              <text key={text} data-measure="" x={0} y={0} fontSize={FONT} className={TEXT_CLASS}>
                {text}
              </text>
            ))}
          </g>
          <line
            data-bottom=""
            x1={plot.left}
            x2={plot.right}
            y1={BOTTOM}
            y2={BOTTOM}
            stroke="var(--color-border-subtle)"
          />
          <line
            data-zero=""
            x1={plot.left}
            x2={plot.right}
            y1={zero}
            y2={zero}
            stroke="var(--color-text-tertiary)"
            strokeWidth={1}
          />
          <PlacedText item={layout.zeroLabel} data="data-zero-label" tone="fill-text-tertiary" />
          {layout.ticks.map((tick) => (
            <PlacedText
              key={tick.index}
              item={tick}
              data="data-period-label"
              tone="fill-text-tertiary"
            />
          ))}
          {missing.map(({ period, index }) => (
            <line
              key={period}
              data-gap={period}
              x1={px(index)}
              x2={px(index)}
              y1={BOTTOM}
              y2={BOTTOM - GAP_RISE}
              stroke="var(--color-text-tertiary)"
              strokeWidth={2}
              strokeDasharray="2 2"
            />
          ))}
          {ordered && <Lines dots={dots} at={at} />}
          {dots.map((dot) => (
            <circle
              key={dot.index}
              data-value={dot.fact.text}
              data-period={dot.fact.period ?? ""}
              cx={px(dot.index).toFixed(2)}
              cy={y(dot.fact.at).toFixed(2)}
              r={DOT_R}
              fill="currentColor"
            />
          ))}
          {layout.labels.map((item) => (
            <PlacedText
              key={item.index}
              item={item}
              data="data-label"
              value={item.index === 0 ? "first" : "last"}
              tone="fill-text-primary"
            />
          ))}
        </svg>
      </div>
      <Written dots={written} list={!ordered || dots.length < LINE_FROM} />
      {missing.length > 0 && (
        <ul
          aria-label="Periods not drawn"
          className="m-0 grid list-none gap-1 p-0 text-caption text-text-tertiary"
        >
          {missing.map((item) => (
            <li key={item.period}>{`${item.period}: ${item.long}`}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

/** One text placed by the layout: left-aligned at its box, in the measured font. */
function PlacedText({
  item,
  data,
  value = "",
  tone,
}: {
  item: Placed;
  data: string;
  value?: string;
  tone: string;
}) {
  return (
    <text
      {...{ [data]: value }}
      x={item.x.toFixed(2)}
      y={item.y.toFixed(2)}
      textAnchor="start"
      fontSize={FONT}
      className={cx(tone, TEXT_CLASS)}
    >
      {item.text}
    </text>
  );
}

/** The figures written under the panel, each with its period. */
function Written({ dots, list }: { dots: readonly Dot[]; list: boolean }) {
  const entry = (dot: Dot) => (
    <>
      <span className="text-text-tertiary">{dot.fact.period}</span> <span>{figure(dot.fact)}</span>
    </>
  );
  const row = "m-0 flex flex-wrap gap-x-4 gap-y-1 font-mono text-small tabular-nums";
  if (list)
    return (
      <ul aria-label="Figures as written" data-written="" className={cx(row, "list-none p-0")}>
        {dots.map((dot) => (
          <li key={dot.index}>{entry(dot)}</li>
        ))}
      </ul>
    );
  return (
    <p data-written="" className={row}>
      {dots.map((dot) => (
        <span key={dot.index}>{entry(dot)}</span>
      ))}
    </p>
  );
}

function TableView({
  field,
  unit,
  periods,
  series,
  factsFor,
}: {
  field: Field;
  unit: string;
  periods: readonly string[];
  series: readonly TrendSeries[];
  factsFor: (run: CoverageRun) => Fact[];
}) {
  return (
    <details className="group min-w-0 rounded-ds-lg border border-border-subtle bg-surface-card p-4">
      <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-ds-sm text-small font-medium outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11">
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-text-tertiary group-open:rotate-90"
        />
        Table view
      </summary>
      <div
        role="region"
        aria-label={`${field.label} by period, table`}
        // A scrolling region must take focus, or a keyboard reader cannot reach what it hides.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="mt-3 min-w-0 overflow-x-auto outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <table className="w-full border-collapse text-small tabular-nums">
          <caption className="pb-2 text-left text-text-secondary">
            {`${field.label} by period, ${unit || "no unit stated"}`}
          </caption>
          <thead>
            <tr className="border-b border-border-subtle text-left">
              <th scope="col" className="p-2 font-semibold">
                Issuer
              </th>
              {periods.map((period) => (
                <th key={period} scope="col" className="p-2 font-semibold whitespace-nowrap">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((item) => {
              const headings = [
                ...new Set(
                  item.points.flatMap((fact) => (fact?.heading ? [fact.heading] : [])),
                ),
              ];
              return (
              <tr key={item.name} className="border-b border-border-subtle last:border-b-0">
                <th scope="row" className="min-w-36 p-2 text-left font-semibold">
                  {item.name}
                  {headings.length > 0 && (
                    <span className="block text-caption font-normal text-text-secondary">
                      {`Stated as ${headings.join("; ")}`}
                    </span>
                  )}
                </th>
                {periods.map((period, index) => {
                  const fact = item.points[index];
                  return (
                    <td
                      key={period}
                      className={cx("p-2", fact ? "font-mono" : "text-caption text-text-tertiary")}
                    >
                      {fact ? figure(fact) : missingAt(factsFor(item.run), period, unit).short}
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Issuers whose newest run gives no figure in this unit: listed apart, with the truthful reason. */
function Absent({ rows, unit }: { rows: readonly { issuer: Issuer; reason: string }[]; unit: string }) {
  if (rows.length === 0) return null;
  return (
    <div className="gap-hatch grid gap-2 rounded-ds-lg border border-dashed border-border-gap p-4">
      <div className="grid gap-2 rounded-ds-sm bg-surface-card p-3">
        <h3 className="font-semibold text-text-primary">
          {`No figure to draw: the newest run states none in ${unit || "no unit stated"}`}
        </h3>
        <ul className="m-0 grid list-none gap-1 p-0 text-small text-gap-text">
          {rows.map(({ issuer, reason }) => (
            <li key={issuer.key}>
              <span className="font-medium text-text-primary">{issuer.name}</span>
              {`: ${reason}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * A figure down the module's own periods as small multiples: one panel per issuer's newest run,
 * all on one scale and one period axis, in one reporting unit. Nothing is averaged or scored.
 */
export function TrendView({
  data,
  issuers,
  field,
}: {
  data: Coverage;
  issuers: Issuer[];
  field: Field | undefined;
}) {
  const units = field ? fieldUnits(data, issuers, field.id) : [];
  const [picked, setPicked] = useState<string | null>(null);
  if (!field || units.length === 0)
    return (
      <p role="status" className={card}>
        No newest run of these issuers states this figure, so there is no trend to draw.
      </p>
    );
  const factsFor = (run: CoverageRun) => factsOf(data, run.key, field.id);
  const unit =
    picked !== null && units.includes(picked) ? picked : openingUnit(units, issuers, factsFor);
  const { periods, ordered, series } = trend(data, issuers, field.id, unit);
  const scale = scaleOf(series);
  const drawn = new Set(series.map((item) => item.run.key));
  const absent = issuers.flatMap((issuer) => {
    const run = latestRun(issuer);
    if (run && drawn.has(run.key)) return [];
    return [{ issuer, reason: absentReason(run ? factsFor(run) : [], unit) }];
  });
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      {units.length > 1 && (
        <div role="group" aria-label="Reporting unit" className="flex flex-wrap gap-2">
          {units.map((item) => (
            <Chip
              key={item}
              pressed={item === unit}
              onPress={() => {
                setPicked(item);
              }}
            >
              {item || "No unit stated"}
            </Chip>
          ))}
        </div>
      )}
      <p className="reading-copy m-0 max-w-3xl text-small text-text-secondary">
        One panel per issuer, from its newest run, on one scale. Periods are matched as written, so
        issuers with different year ends sit at different points. Each figure is as its module
        wrote it; bases can differ between issuers.
      </p>
      {!ordered && (
        <p className="reading-copy m-0 max-w-3xl text-small text-gap-text">
          Periods are in the order the modules state them; this page could not put them in time
          order, so no line joins them.
        </p>
      )}
      {scale.low && scale.high && (
        <p className="reading-copy m-0 max-w-3xl text-small text-text-secondary">
          {`Same scale in every panel: lowest stated figure ${figure(scale.low)}, highest ${figure(scale.high)}`}
        </p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {series.map((item) => (
          <Panel
            key={item.name}
            series={item}
            periods={periods}
            scale={scale}
            facts={factsFor(item.run)}
            unit={unit}
            ordered={ordered}
          />
        ))}
      </div>
      <Absent rows={absent} unit={unit} />
      <TableView
        field={field}
        unit={unit}
        periods={periods}
        series={series}
        factsFor={factsFor}
      />
    </div>
  );
}
