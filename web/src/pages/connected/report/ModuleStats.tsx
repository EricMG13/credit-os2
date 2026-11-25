import { StatsStrip, type Stat } from "@/components/kit/StatsStrip";
import {
  blocked,
  containsReference,
  readerText,
  withUnit,
  type CatalogueRun,
  type OutputEntry,
} from "../publishedReport";
import { headlineSources, stated, type HeadlineSource } from "../reportView";
import { changeText, tone } from "../signal";
import { GapNote } from "./overview/Tile";
import { PublishedSource } from "./PublishedTrace";

/** The headline figures the Overview and Library draw, in their order and names. */
const HEADLINE = [
  ["net_leverage", "Net leverage"],
  ["leverage", "Gross leverage"],
  ["coverage", "Interest coverage"],
  ["revenue", "Revenue"],
  ["adjusted_ebitda", "Adjusted EBITDA"],
  ["cash", "Cash"],
] as const;

type Figure = CatalogueRun["metrics"][string];

/** The coverage figure's name where its basis is reported EBITDA over cash interest on debt. */
function nameOf(key: string, name: string, figure: Figure | undefined) {
  const debtCashInterest =
    key === "coverage" &&
    /^LTM reported EBITDA over LTM cash interest for debt(?: [\d.,]+)?(?:;|$)/iu.test(
      figure?.basis ?? "",
    );
  return debtCashInterest ? "Reported EBITDA / cash interest on debt" : name;
}

/** The period and basis the figure is stated on, as the catalogue states them. */
function basisLine(figure: Figure) {
  const basis = figure.basis?.trim();
  const shown = basis && !containsReference(basis) ? readerText(basis) : "";
  return [figure.period, shown].filter(Boolean).join(" · ");
}

/** The figure's one trace to its handoff row; none where no row is known (no dead stop). */
function trace(name: string, source: HeadlineSource | undefined) {
  return source ? (
    <PublishedSource href={source.href} name={name}>
      Source
    </PublishedSource>
  ) : undefined;
}

/** A figure the strip does not draw: the module's own words only where its row says so. */
function gapWords(source: HeadlineSource | undefined) {
  if (source?.reason === undefined) return "Not shown here";
  return containsReference(source.reason) ? "Not supplied" : readerText(source.reason);
}

const plainNumber = (value: string | number) => {
  const text = String(value).replace(/,/g, "").trim();
  return /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
};

/**
 * The mockup's two-point mark: the prior and current figures as written, from a zero baseline, the
 * current point in the signal colour where the change is worse. Nothing for a figure that is not a
 * plain non-negative number on both sides.
 */
function TwoPoint({
  name,
  prior,
  current,
  worse,
}: {
  name: string;
  prior: { value: string; period: string };
  current: { value: string | number; period?: string | null };
  worse: boolean;
}) {
  const before = plainNumber(prior.value);
  const after = plainNumber(current.value);
  if (before === null || after === null || before < 0 || after < 0) return null;
  const top = Math.max(before, after) || 1;
  const y = (value: number) => 28 - (24 * value) / top;
  return (
    <svg
      viewBox="0 0 56 32"
      width="56"
      height="32"
      role="img"
      aria-label={`${name} ${prior.value} in ${prior.period} and ${String(current.value)}${current.period ? ` in ${current.period}` : ""}`}
      className="flex-none"
    >
      <line x1="2" y1="28" x2="54" y2="28" className="stroke-border-hairline" />
      <line
        x1="6"
        y1={y(before)}
        x2="50"
        y2={y(after)}
        strokeWidth="1.5"
        className="stroke-chart-3"
      />
      <circle
        cx="6"
        cy={y(before)}
        r="2.5"
        strokeWidth="1.5"
        className="fill-surface-card stroke-chart-3"
      />
      <circle
        cx="50"
        cy={y(after)}
        r="3"
        className={worse ? "fill-warning-mark" : "fill-chart-1"}
      />
    </svg>
  );
}

function stat(
  key: string,
  label: string,
  figure: Figure | undefined,
  source?: HeadlineSource,
): Stat {
  const name = nameOf(key, label, figure);
  // A figure is drawn only where the handoff's own row states it: the strip never disagrees with
  // the handoff on the page (headlineSources gives a row only when its cell equals the figure).
  if (!stated(figure) || !source || source.reason !== undefined)
    return { label: name, value: null, gap: gapWords(source), trace: trace(name, source) };
  const direction = figure.change == null ? "none" : tone(key, figure.change);
  const basis = basisLine(figure);
  return {
    label: name,
    value: withUnit(figure.value, figure.unit),
    ...(figure.prior && {
      prior: `${withUnit(figure.prior.value, figure.unit)} in ${figure.prior.period}`,
    }),
    ...(figure.prior && figure.change != null && { delta: changeText(figure.change, figure.unit) }),
    ...((direction === "better" || direction === "worse") && { tone: direction }),
    mark: (
      <span className="flex items-end justify-between gap-2">
        {basis && <span className="text-caption text-text-tertiary">{basis}</span>}
        {figure.prior && (
          <TwoPoint
            name={name}
            prior={figure.prior}
            current={figure}
            worse={direction === "worse"}
          />
        )}
      </span>
    ),
    trace: trace(name, source),
  };
}

/** The CP-1 headline figures from the run's catalogue, each with its period and basis. */
function headlineStats(
  entry: OutputEntry,
  catalogue: CatalogueRun | undefined,
  folder: string,
): Stat[] {
  if (!catalogue || entry.output.module !== "CP-1" || blocked(entry)) return [];
  if (!HEADLINE.some(([key]) => stated(catalogue.metrics[key]))) return [];
  const sources = headlineSources(entry, catalogue, folder);
  return HEADLINE.map(([key, label]) => stat(key, label, catalogue.metrics[key], sources[key]));
}

/** The module's headline figures as one strip, or nothing where the run states none. */
export function ModuleStats({
  entry,
  catalogue,
  folder,
}: {
  entry: OutputEntry;
  catalogue: CatalogueRun | undefined;
  folder: string;
}) {
  const stats = headlineStats(entry, catalogue, folder);
  if (!stats.length) return null;
  // The catalogue's figures are the selected output's: another saved output does not show them.
  if (!entry.selected)
    return (
      <div className="min-w-0 lg:col-span-12">
        <GapNote>Headline figures are shown for the selected output.</GapNote>
      </div>
    );
  return (
    <div className="min-w-0 lg:col-span-12">
      <StatsStrip label="Headline figures" stats={stats} />
    </div>
  );
}
