import { Button } from "@/components/base/buttons/button";
import { Segmented } from "@/components/kit/Segmented";
import { StatsStrip, type Stat } from "@/components/kit/StatsStrip";
import { ArrowRight } from "@untitledui/icons";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { moduleName } from "../api";
import {
  blocked,
  evidencePath,
  readerText,
  unitLabel,
  type OutputEntry,
  type PublishedRun,
} from "../publishedReport";
import type { ReportView } from "../reportView";
import type { forecastCaseOptions } from "../visuals/LegacyForecast";
import {
  absentText,
  cellsOf,
  endOf,
  extremeOf,
  fundingGap,
  gapContext,
  NOT_STATED_IN_ROW,
  periodList,
  type MeasureCell,
  type MeasureRead,
} from "./forecastData";
import { ModuleGap } from "./ForecastGaps";
import { moduleSource } from "./overview/figureData";
import { bottomLine } from "./overview/read";
import { Tile } from "./overview/Tile";
import { PublishedSource } from "./PublishedTrace";
import type { ForecastSource } from "./ForecastRecord";

/** A case the switch offers; `absent` is the lead's words for why a hatched case draws no path. */
export type CaseChoice = { name: string; rawGroup: string; hatched: boolean; absent?: string };
type CaseOption = ReturnType<typeof forecastCaseOptions>[number];

const TARGET = "min-h-8 max-[480px]:min-h-11";

/** Stacked: one case per row, names wrapping, for when a case name does not fit on one line. */
const STACKED =
  "w-full flex-col [&>button]:min-w-0 [&>button]:py-1.5 [&>button]:text-left [&>button]:whitespace-normal";

/**
 * True while the widest case name, drawn on one line, is wider than the room the switch has. The
 * names' own width is measured while they sit on one line, so the switch unstacks when room returns.
 */
function useStacked() {
  const ref = useRef<HTMLDivElement>(null);
  const widest = useRef(0);
  const [stacked, setStacked] = useState(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      // Stacked names wrap, so their one-line width is read only while they are on one line.
      if (!stacked)
        widest.current = Math.max(
          0,
          ...[...node.querySelectorAll<HTMLElement>("[role=group] > button")].map(
            ({ scrollWidth }) => scrollWidth,
          ),
        );
      // The frame's padding and border sit around the widest segment.
      // A switch with no room measured yet (not laid out) is drawn on one row.
      setStacked(node.clientWidth > 0 && widest.current + 10 > node.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [stacked]);
  return { ref, stacked };
}

function CaseSwitch({
  cases,
  current,
  onSelect,
}: {
  cases: CaseChoice[];
  current: string | undefined;
  onSelect: (name: string) => void;
}) {
  const { ref, stacked } = useStacked();
  if (cases.length < 2 || current === undefined) return null;
  const hatchedNote = cases.find(({ hatched }) => hatched)?.absent;
  return (
    <div ref={ref} className="flex w-full min-w-0 flex-col items-start gap-1.5 lg:items-end">
      <Segmented
        label="Case"
        current={current}
        onSelect={onSelect}
        className={stacked ? STACKED : undefined}
        segments={cases.map(({ name, hatched, absent }) => ({
          key: name,
          accessibleLabel: hatched ? `${name}: ${absent ?? ""}` : undefined,
          label: (
            <>
              <span className="min-w-0">{name}</span>
              {hatched && (
                <span
                  aria-hidden="true"
                  className="gap-hatch size-2.5 flex-none rounded-ds-xs border border-dashed border-border-gap"
                />
              )}
            </>
          ),
        }))}
      />
      {hatchedNote && (
        <span className="text-caption text-text-tertiary">{`Hatched: ${hatchedNote}`}</span>
      )}
    </div>
  );
}

/**
 * The selected case's latest cash proxy as the model publishes it, with its period and dates, its
 * description where no qualification already says it, its reason, and its trace.
 */
export function CaseFigure({
  option,
  display,
  notice,
  shownQualifications,
  source,
}: {
  option: CaseOption | undefined;
  /** The cell's display as the model publishes it; the page never rounds it. */
  display: string | undefined;
  notice: string | undefined;
  shownQualifications: string[];
  source?: ForecastSource;
}) {
  if (!option) return null;
  const { name, rawGroup, period, periodStart, periodEnd, description, reason, units } = option;
  return (
    <div
      id="forecast-cases"
      tabIndex={-1}
      className="grid min-w-0 scroll-mt-4 gap-1 wrap-anywhere focus:outline-2 focus:outline-offset-2 focus:outline-focus"
    >
      <dl
        aria-label="Selected case cash proxy"
        aria-describedby="forecast-case-measure"
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
      >
        <dt id="forecast-case-measure" className="text-caption text-text-tertiary">
          {`Cash proxy, ${name} · ${unitLabel(units)}`}
        </dt>
        <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-mono text-small font-medium text-text-primary tabular-nums">
            {display || "n.a."}
          </span>
          {period && (
            <span className="text-caption text-text-secondary">
              {period}
              {periodStart && periodEnd ? ` · ${periodStart} to ${periodEnd}` : ""}
            </span>
          )}
          {source?.(name, {
            case: name,
            rawGroup,
            rawGroups: [rawGroup],
            period,
            row: "Cash proxy (not issuer free cash flow)",
            periodStart,
            periodEnd,
          })}
        </dd>
      </dl>
      {(!description || !shownQualifications.includes(description)) && (
        <p className="text-caption text-text-secondary">
          {description || "Case description not recorded."}
        </p>
      )}
      {reason && <p className="text-caption text-text-secondary">{readerText(reason)}</p>}
      {notice && (
        <p role="status" className="text-caption text-text-secondary">
          {notice}
        </p>
      )}
    </div>
  );
}

function BottomLine({
  view,
  handoff,
  folder,
}: {
  view: ReportView;
  handoff: OutputEntry | undefined;
  folder: string;
}) {
  const name = moduleName("CP-2G");
  // The page's matched handoff, read the same way every tile reads a module: unreadable and
  // blocked handoffs say so.
  const source = moduleSource(view, "CP-2G", name);
  const found = handoff
    ? handoff.output.parseError
      ? { entry: handoff, reason: `${name}'s output could not be read; it is in Evidence.` }
      : { entry: handoff, reason: blocked(handoff) ? source.reason : undefined }
    : source;
  if (!found.entry || found.reason)
    return (
      <ModuleGap entry={found.entry}>
        {found.reason ?? `${name} did not run in this run.`}
      </ModuleGap>
    );
  const [first] = bottomLine(found.entry);
  if (!first) return <ModuleGap>{`${name} wrote no bottom line.`}</ModuleGap>;
  return (
    // The sentence is the largest text in the tile and needs no label over it.
    <div className="flex items-start justify-between gap-3">
      <p className="max-w-[68rem] text-h3 font-medium text-pretty text-text-primary lg:text-h1">
        {first.text ?? "The forward view cites its sources by name; read it in Evidence."}
      </p>
      <PublishedSource
        href={evidencePath(folder, found.entry, first.line)}
        name="the forward view"
        linkLabel="Source for the forward view"
      >
        View source
      </PublishedSource>
    </div>
  );
}

/** The page's tiles by their region name, in page order, with the short word the index shows. */
const PARTS = [
  ["Net leverage path", "Path"],
  ["What breaks, and when", "What breaks"],
  ["Assumptions by case", "Assumptions"],
  ["Scope and limits", "Scope"],
  ["Forecast grid", "Grid"],
] as const;

const PART_LINK =
  "min-h-8 cursor-pointer rounded-ds-sm px-2 text-small font-medium text-text-secondary outline-focus-ring transition-colors duration-100 ease-linear hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2";

/** Brings a tile to the top and puts the keyboard inside it: its first control takes focus. */
function showPart(region: string) {
  const part = [...document.querySelectorAll<HTMLElement>("section[aria-label]")].find(
    (section) => section.getAttribute("aria-label") === region,
  );
  if (!part) return;
  part.scrollIntoView({ block: "start" });
  part
    .querySelector<HTMLElement>("button, a[href], summary, [tabindex='0']")
    ?.focus({ preventScroll: true });
}

/**
 * The page is several screens long: its parts are named once, under the title, so the grid is
 * one press from the top by mouse or keyboard. Buttons, not links: the address names the report
 * section and stays as it is.
 */
function PageIndex() {
  return (
    <ul aria-label="Parts of this page" className="-ml-2 flex flex-wrap gap-x-1 gap-y-0.5">
      {PARTS.map(([region, word]) => (
        <li key={region}>
          <button
            type="button"
            className={PART_LINK}
            onClick={() => {
              showPart(region);
            }}
          >
            {word}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The header tile: the forward view in one sentence, the case switch and the basis once. */
export function ForecastHeader({
  run,
  view,
  preview,
  handoff,
  cases,
  current,
  onSelect,
  basis,
  hasModel,
  caseFigure,
  children,
}: {
  run: PublishedRun;
  view: ReportView;
  preview: boolean;
  handoff: OutputEntry | undefined;
  cases: CaseChoice[];
  current: string | undefined;
  onSelect: (name: string) => void;
  basis: { label: string; value: string }[];
  hasModel: boolean;
  /** The selected case's cash proxy figure, drawn under the switch. */
  caseFigure?: ReactNode;
  children?: ReactNode;
}) {
  const state = view.modules.find(({ id }) => id === "CP-2G")?.state;
  const module = moduleName("CP-2G");
  return (
    <Tile span={12} label="Forecast" className="gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-col gap-1">
          {/* One step above the tile titles under it, so the page title reads as the page's. */}
          <h2 className="text-h3 font-medium text-balance text-text-primary">Forecast</h2>
          <p className="text-small text-text-secondary">
            {run.issuerHeading || run.issuer}
            {preview && " · Test preview"}
            {hasModel ? ` · ${module}, the cases it publishes` : " · No forward model in this run"}
          </p>
          {hasModel && <PageIndex />}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-3 lg:max-w-[60%] lg:items-end">
          {/* New case names are measured afresh, on one line. */}
          <CaseSwitch
            key={cases.map(({ name }) => name).join("\n")}
            cases={cases}
            current={current}
            onSelect={onSelect}
          />
          {caseFigure}
        </div>
      </div>
      <BottomLine view={view} handoff={handoff} folder={run.folder} />
      {children}
      {/* The basis, stated once: each fact on the line with its label, so the row is one line
          where the facts fit and the lead chart sits higher on the first screen. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <dl className="flex min-w-0 flex-[999_1_40rem] flex-wrap gap-x-6 gap-y-1">
          {[
            ...basis,
            ...(state ? [{ label: "Module", value: `${module}, ${state.toLowerCase()}` }] : []),
          ].map((item) => (
            <div key={item.label} className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <dt className="text-caption text-text-tertiary">{item.label}</dt>
              <dd className="text-small wrap-anywhere text-text-primary">{item.value}</dd>
            </div>
          ))}
        </dl>
        {state !== undefined && (
          <Button
            href="#modules/CP-2G"
            color="secondary"
            size="sm"
            iconTrailing={ArrowRight}
            className={TARGET}
          >
            Open module
          </Button>
        )}
      </div>
    </Tile>
  );
}

/** Each year of a case with no figure, named with the model's reason. */
function noFigure(cells: MeasureCell[]) {
  return cells
    .filter((cell) => cell.value === null)
    .map((cell) => `${cell.period} not calculated${cell.reason ? `: ${cell.reason}` : ""}`);
}

/** Why a stat has no figure, in the words the lead uses; a case's years counted and named. */
function absence(read: MeasureRead, cells: MeasureCell[], caseName: string) {
  if (!read.measure || !cells.length) return absentText(read, caseName);
  const valued = cells.filter((cell) => cell.value !== null);
  if (valued.length === 1)
    return [`Only ${valued[0]?.period ?? ""} has a figure`, ...noFigure(cells)].join("; ");
  return noFigure(cells).join("; ") || `No ${read.what} figure for ${caseName}.`;
}

function selection(
  label: string,
  read: MeasureRead,
  cells: MeasureCell[],
  kind: "highest" | "lowest",
  caseName: string,
  trace: (cell: MeasureCell | null) => ReactNode,
): Stat {
  const picked = extremeOf(cells, kind);
  const [first] = picked?.cells ?? [];
  if (!picked || !first)
    return { label, value: null, gap: absence(read, cells, caseName), trace: trace(null) };
  const missing = [
    ...noFigure(cells),
    ...(picked.notPublished.length ? [`${periodList(picked.notPublished)} not published`] : []),
  ];
  return {
    label,
    value: first.display,
    trace: trace(first),
    mark: (
      <span className="grid gap-0.5 text-caption text-text-secondary">
        <span>{periodList(picked.cells.map(({ period }) => period))}</span>
        {missing.map((words) => (
          <span key={words}>{words}</span>
        ))}
      </span>
    ),
  };
}

function fundingStat(view: ReportView, folder: string): Stat {
  const { gaps } = fundingGap(view);
  const label = "Funding gap";
  // The strip says only that no figure was read; What breaks, under it, gives each module's
  // reason whole.
  if (!gaps.length)
    return {
      label,
      value: null,
      gap: "No figure read: the reasons are in What breaks, and when",
    };
  const figures = gaps.flatMap((gap) => gap.figures.map((figure) => ({ gap, figure })));
  const [only] = figures;
  if (figures.length !== 1 || !only)
    return {
      label,
      value: null,
      gap: `${String(figures.length)} figures, stated by ${periodList(gaps.map(({ name }) => name))}: see What breaks, and when`,
    };
  const { gap, figure } = only;
  return {
    label,
    // A figure as written, plain or not; only a row that states none is the gap state.
    value: figure.text === NOT_STATED_IN_ROW ? null : figure.text,
    gap: figure.text,
    trace: (
      <PublishedSource
        href={evidencePath(folder, gap.entry, gap.line)}
        name="the funding gap figure"
        linkLabel="Source for the funding gap figure"
      >
        View source
      </PublishedSource>
    ),
    mark: (
      <span className="text-caption text-text-secondary">
        {[gapContext(gap), figure.header].filter(Boolean).join(" · ")}
      </span>
    ),
  };
}

/**
 * The selected case's figures as selections the page makes and labels as such: its highest and
 * lowest published forecast years (ties on the figures as shown, and missing years named), its last
 * year, and the funding gap as the liquidity and refinancing modules state it. A case's own years,
 * compared with other cases or not.
 */
export function ForecastStats({
  view,
  folder,
  leverage,
  cover,
  group,
  caseName,
  source,
  basis,
}: {
  view: ReportView;
  folder: string;
  leverage: MeasureRead;
  cover: MeasureRead;
  group: string | undefined;
  caseName: string;
  source?: ForecastSource;
  basis: string;
}) {
  const path = leverage.measure ? cellsOf(leverage.measure, group) : [];
  const covers = cover.measure ? cellsOf(cover.measure, group) : [];
  const end = endOf(path);
  const start = path[0];
  const trace = (name: string, row: string | undefined) => (cell: MeasureCell | null) =>
    row
      ? source?.(name, {
          case: caseName,
          rawGroup: group,
          row,
          ...(cell ? { period: cell.period } : {}),
        })
      : undefined;
  const leverageRow = leverage.measure?.label;
  const stats: Stat[] = [
    selection(
      `Net leverage: highest published forecast year, ${caseName}`,
      leverage,
      path,
      "highest",
      caseName,
      trace("Highest published net leverage", leverageRow),
    ),
    end && end.value !== null
      ? {
          label: `Net leverage, ${end.period}`,
          value: end.display,
          trace: trace("Net leverage", leverageRow)(end),
          ...(start && start !== end && start.value !== null
            ? { prior: `${start.display} in ${start.period}` }
            : {}),
        }
      : {
          label: end ? `Net leverage, ${end.period}` : "Net leverage, last forecast year",
          value: null,
          gap: end
            ? `${end.period} not calculated${end.reason ? `: ${end.reason}` : ""}`
            : absentText(leverage, caseName),
          trace: trace("Net leverage", leverageRow)(end),
        },
    selection(
      `Interest cover: lowest published forecast year, ${caseName}`,
      cover,
      covers,
      "lowest",
      caseName,
      trace("Lowest published interest cover", cover.measure?.label),
    ),
    fundingStat(view, folder),
  ];
  return (
    // The basis line sits inside the strip's tile: the strip's own frame is the tile's.
    <div className="flex min-w-0 flex-col overflow-hidden rounded-ds-lg border border-border-subtle bg-surface-card lg:col-span-12 [&>dl]:rounded-none [&>dl]:border-0">
      <StatsStrip label="Forecast figures" stats={stats} />
      <p className="border-t border-border-hairline px-4 py-2 text-caption text-text-secondary sm:px-5">
        {basis}
      </p>
    </div>
  );
}
