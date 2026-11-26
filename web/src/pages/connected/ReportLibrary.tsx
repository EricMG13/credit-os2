import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { Alert } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { Segmented } from "@/components/kit/Segmented";
import { SourcesSwitch, useSourcesOn } from "@/pages/library/parts/SourcesSwitch";
import { cx } from "@/utils/cx";
import { Callout } from "@/components/alert/Alert";
import { card, heading } from "./layout";
import {
  comparisonForRun,
  comparisonRows,
  getSnapshot,
  outputEntries,
  publishedRunForFolder,
  runLabels,
  runPathway,
  runTiming,
  unitLabel,
  type CatalogueRun,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "./publishedReport";
import { ReportEvidence } from "./report/Evidence";
import { getRun, moduleName, RequestError, type Mode, type ConnectedRun } from "./api";
import { buildReportView, runMoneyUnit, type ReportView } from "./reportView";
import { Calendar, buildCalendar } from "./report/Calendar";
import { ReportChanges, ComparisonTable } from "./report/Changes";
import { Forecast } from "./report/Forecast";
import { RunHistory } from "./report/History";
import { DifferingRating, RatingChip, reportIdentity } from "./report/IdentityBand";
import { ANCHOR } from "./report/ModuleFrame";
import { Modules } from "./report/Modules";
import { PublishedTraceProvider } from "./report/PublishedTrace";
import { PortfolioBasisProvider } from "./report/PortfolioBasis";
import { CallRow } from "./report/overview/CallRow";
import { DatesRow } from "./report/overview/DatesRow";
import { FigureRow } from "./report/overview/FigureRow";
import { JudgementRow } from "./report/overview/JudgementRow";
import { LimitsRow } from "./report/overview/LimitsRow";
import { PipelineRow } from "./report/overview/PipelineRow";
import { StressRow } from "./report/overview/StressRow";
import { StructureRow } from "./report/overview/StructureRow";
import { Bento } from "./report/overview/Tile";
import { overviewView } from "./report/overview/decision";
import { useResource } from "./useResource";
import { ReportExportPreview } from "./export/ReportExportPreview";
import { exportHref, exportRoute, reportExports } from "./export/reportExport";

/**
 * The report's sections in the section control's order. History is reached from the issuer crumb and the
 * header's "Earlier runs" link. */
const tabs = [
  ["overview", "Overview"],
  ["changes", "Changes"],
  ["modules", "Modules"],
  ["forecast", "Forecast"],
  ["evidence", "Evidence"],
  ["deliverables", "Deliverables"],
  ["calendar", "Calendar"],
] as const;
type ReportTab = (typeof tabs)[number][0];
type Tab = ReportTab | "history";

function listenHash(fn: () => void) {
  window.addEventListener("hashchange", fn);
  return () => {
    window.removeEventListener("hashchange", fn);
  };
}

const readHash = () => window.location.hash;
const tabHref = (tab: ReportTab) => `#${tab}`;

function openPurposePrint(id: ReportExports["options"][number]["id"]) {
  const currentState: unknown = window.history.state;
  const state =
    typeof currentState === "object" && currentState !== null && !Array.isArray(currentState)
      ? currentState
      : {};
  window.history.replaceState({ ...state, reportDeliverableFocusId: id }, "", window.location.href);
  const oldURL = window.location.href;
  window.history.pushState(
    { reportExportFrom: "#deliverables", reportPrintOnReady: true },
    "",
    exportHref(id),
  );
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }));
}

function readerPageName(tab: Tab, parts: string[], pathway?: string | null) {
  if (tab === "calendar") return "Issuer calendar";
  if (tab === "history") return "Runs";
  if (tab === "modules" && parts[0] && parts[0] !== "CP-8") return moduleName(parts[0], pathway);
  if (tab === "evidence" && parts[0]) {
    const names: Record<string, string> = {
      summary: "Summary",
      trace: "Trace",
      sources: "Sources",
      gaps: "Gaps",
      checks: "Script checks",
      record: "Record",
    };
    return `Evidence: ${names[parts[0]] ?? "Handoff"}`;
  }
  return tabs.find(([name]) => name === tab)?.[1] ?? "Overview";
}

let entryCount = 0;
/** The history entry on screen, named in its state so that Back can find where the reader left it. */
function historyEntry() {
  const state: unknown = window.history.state;
  const named = typeof state === "object" && state !== null && "reportEntry" in state;
  if (named && typeof state.reportEntry === "string") return state.reportEntry;
  entryCount += 1;
  const id = `${String(Date.now())}-${String(entryCount)}`;
  window.history.replaceState(
    { ...(typeof state === "object" && state !== null ? state : null), reportEntry: id },
    "",
  );
  return id;
}

/**
 * The shell's `main` scrolls, so the browser restores nothing on its own. A new address opens its
 * page at the top; Back and Forward return to the offset the reader left in that entry.
 */
function useReportPlace(root: RefObject<HTMLElement | null>, hash: string, ready: boolean) {
  const left = useRef(new Map<string, number>());
  const shown = useRef<string | null>(null);
  const offset = useRef(0);
  useEffect(() => {
    const main = root.current?.closest("main");
    if (!main) return;
    const follow = () => {
      offset.current = main.scrollTop;
    };
    main.addEventListener("scroll", follow);
    return () => {
      main.removeEventListener("scroll", follow);
    };
  }, [root]);
  useEffect(() => {
    if (!ready) return;
    const id = historyEntry();
    const previous = shown.current;
    shown.current = id;
    if (previous === id) return;
    if (previous !== null) left.current.set(previous, offset.current);
    const main = root.current?.closest("main");
    const back = left.current.get(id);
    const section =
      {
        "#overview/limitations": "overview-limitations",
        "#overview/dates": "overview-dates",
        "#forecast": "forecast-report-nav",
        "#forecast/run-charts": "forecast-run-charts",
      }[hash] ?? (namesRecords(hash) ? ANCHOR.records : undefined);
    const target = section && document.getElementById(section);
    if (target && back === undefined) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    } else if (main && previous !== null) {
      main.scrollTop = back ?? 0;
      offset.current = main.scrollTop;
    }
  }, [hash, ready, root]);
}

/** The report's sections as one segmented control; the current section carries the accent tint and a dot. */
function ReportNav({ tab, modules }: { tab: Tab; modules: number }) {
  const segments = tabs.map(([key, title]) => ({
    key,
    href: tabHref(key),
    accessibleLabel: key === "modules" ? `Modules ${String(modules)}` : undefined,
    label:
      key === "modules" ? (
        <>
          {title}
          <span className="font-mono text-caption font-normal tabular-nums">{modules}</span>
        </>
      ) : (
        title
      ),
  }));
  return (
    // Opening Forecast moves focus to the section control, so the wrapper takes the target id.
    <div
      id={tab === "forecast" ? "forecast-report-nav" : undefined}
      tabIndex={tab === "forecast" ? -1 : undefined}
      className="max-w-full scroll-mt-3 outline-none"
    >
      <Segmented label="Report sections" segments={segments} current={tab} />
    </div>
  );
}

/**
 * The decision page: the tile rows on one 12-column bento in the mockup's order, rank as area.
 * Row 1 the call; 2 the headline figures; 3 the judgement; 4 structure; 5 stress; 6 what the run
 * could not do; 7 the pipeline and each module's bottom line; 8 dates to watch.
 */
function Overview({
  snapshot,
  run,
  view,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReportView;
}) {
  // The Overview's lead is the run's published credit view, never a decision module's passage.
  const reading = useMemo(() => overviewView(view, run), [view, run]);
  const props = { snapshot, run, view: reading };
  return (
    <section aria-labelledby="overview-title" className="min-w-0">
      <h2 id="overview-title" className="sr-only">
        Overview
      </h2>
      <Bento>
        <CallRow {...props} />
        <FigureRow {...props} />
        <JudgementRow {...props} />
        <StructureRow {...props} />
        <StressRow {...props} />
        <LimitsRow {...props} />
        <PipelineRow {...props} />
        <DatesRow {...props} />
      </Bento>
    </section>
  );
}

function hasPortfolioCharts(entries: OutputEntry[]) {
  return entries.some(
    ({ output }) =>
      output.module === "CP-6" && output.charts?.some(({ kind }) => kind === "limits"),
  );
}

function ComparisonMeasures({ change }: { change: ReturnType<typeof comparisonForRun> }) {
  if (!change?.pack || change.problem) return null;
  return <ComparisonMeasuresTable rows={comparisonRows(change)} />;
}

function ComparisonMeasuresTable({ rows }: { rows: ReturnType<typeof comparisonRows> }) {
  if (!rows.length) return null;
  return (
    <section className={card}>
      <h3 className={heading}>Comparison measures</h3>
      <ComparisonTable rows={rows} />
    </section>
  );
}

/** The open tab. It is drawn again only when the report, the run or the place in it changes. */
const ReportPage = memo(function ReportPage({
  snapshot,
  run,
  routeKey,
  parts,
  tab,
  mode,
  catalogue,
  issuer,
  exports,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  routeKey: string;
  parts: string[];
  catalogue: CatalogueRun | undefined;
  tab: Tab;
  mode: Mode;
  issuer: string;
  exports: ReportExports;
}) {
  const view = useMemo(() => buildReportView(snapshot, routeKey, run), [snapshot, routeKey, run]);
  useEffect(() => {
    if (tab !== "deliverables") return;
    const state: unknown = window.history.state;
    if (
      typeof state !== "object" ||
      state === null ||
      !("reportDeliverableFocusId" in state) ||
      typeof state.reportDeliverableFocusId !== "string"
    )
      return;
    [...document.querySelectorAll<HTMLButtonElement>("button[data-deliverable-id]")]
      .find((button) => button.dataset.deliverableId === state.reportDeliverableFocusId)
      ?.focus();
  }, [tab]);
  const labels = runLabels(outputEntries(snapshot, run, routeKey), run);
  const calendar = tab === "calendar" ? buildCalendar(view.entries, run.folder, run.pathway) : null;
  const change = comparisonForRun(run, snapshot.workspace.runs);
  return (
    <div className="grid min-w-0 gap-6">
      <PortfolioBasisProvider
        folder={run.folder}
        enabled={(tab === "forecast" || tab === "modules") && hasPortfolioCharts(view.entries)}
      >
        <PublishedTraceProvider
          route={JSON.stringify([routeKey, tab, parts])}
          snapshot={snapshot}
          folder={run.folder}
          pathway={run.pathway}
          entries={view.entries}
        >
          <ReportHeader
            issuer={issuer}
            run={run}
            catalogue={catalogue}
            view={view}
            tab={tab}
            facts={{ mode, preview: Boolean(snapshot.preview), labels }}
            utilities={
              <ReportUtilities
                id={run.folder}
                preview={Boolean(snapshot.preview)}
                evidence={tab === "evidence"}
                deliverables={tab === "deliverables"}
                history={tab === "history"}
              />
            }
          />
          {tab === "history" && <RunHistory snapshot={snapshot} run={run} issuer={issuer} />}
          {tab === "overview" && <Overview snapshot={snapshot} run={run} view={view} />}
          {tab === "calendar" && calendar && <Calendar calendar={calendar} asOf={run.asOf} />}
          {tab === "changes" && (
            <ReportChanges snapshot={snapshot} run={run} entries={view.entries} change={change} />
          )}
          {tab === "modules" && (
            <Modules
              snapshot={snapshot}
              run={run}
              view={view}
              module={parts[0]}
              {...moduleAddress(parts.slice(1))}
            />
          )}
          {tab === "forecast" && (
            <Forecast
              run={run}
              view={view}
              section={parts[0]}
              preview={Boolean(snapshot.preview)}
            />
          )}
          {tab === "evidence" && (
            <ReportEvidence
              snapshot={snapshot}
              run={run}
              entries={view.entries}
              models={view.models}
              target={parts.join("/")}
              mode={mode}
              comparison={<ComparisonMeasures change={change} />}
            />
          )}
          {tab === "deliverables" && (
            <Deliverables
              folder={run.folder}
              exports={exports}
              workbookAvailable={
                !snapshot.preview &&
                snapshot.reportFolder === run.folder &&
                run.publicationVerified === true
              }
            />
          )}
        </PublishedTraceProvider>
      </PortfolioBasisProvider>
    </div>
  );
});

function Deliverables({
  folder,
  exports,
  workbookAvailable,
}: {
  folder: string;
  exports: ReportExports;
  workbookAvailable: boolean;
}) {
  const printOptions = exports.options;
  return (
    <section aria-labelledby="deliverables-title" className="grid min-w-0 gap-4">
      <h2 id="deliverables-title" className="font-display text-h2 font-semibold text-text-primary">
        Deliverables
      </h2>
      <ul className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
        {workbookAvailable && (
          <li className="min-w-0">
            <a
              className="group grid min-h-32 w-full content-between gap-3 rounded-ds-lg border border-border-subtle bg-surface-card p-5 shadow-1 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4"
              href={`/connected/deliverables/${encodeURIComponent(folder)}/credit-snapshot.xlsx`}
            >
              <span className="font-display text-h4 font-semibold text-text-primary group-hover:text-text-link">
                Credit Snapshot
              </span>
              <span className="text-small font-semibold text-action">
                Download Excel workbook · XLSX
              </span>
            </a>
          </li>
        )}
        {printOptions.map(({ id, name }) => (
          <li key={id} className="min-w-0">
            <button
              type="button"
              data-deliverable-id={id}
              onClick={() => {
                openPurposePrint(id);
              }}
              className="group grid min-h-32 w-full content-between gap-3 rounded-ds-lg border border-border-subtle bg-surface-card p-5 text-left shadow-1 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <span className="font-display text-h4 font-semibold text-text-primary group-hover:text-text-link">
                {name}
              </span>
              <span className="text-small font-semibold text-action">Open print dialog</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A quiet fact chip; a long fact wraps inside it rather than widening the page. */
const CHIP =
  "flex min-h-6 max-w-full flex-wrap items-center gap-x-1 rounded-ds-full border px-2.5 py-0.5 text-caption wrap-anywhere";
const QUIET = "border-border-hairline bg-surface-card text-text-secondary";
const TEST = "border-action-subtle-hover bg-surface-selected font-medium text-text-link";
const CRUMB =
  "inline-flex min-h-8 items-center rounded-ds-xs outline-focus-ring hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11";

/** Library / issuer (its runs) / the page; the last crumb is the page itself. */
function Crumbs({ issuer, current }: { issuer: string | null; current: string }) {
  const after = "before:mr-2 before:text-text-disabled before:content-['/']";
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 text-small text-text-tertiary">
        <li>
          <a href="/" className={CRUMB}>
            Library
          </a>
        </li>
        {issuer && (
          <li className={cx("flex min-w-0 items-center", after)}>
            <a href="#history" className={cx(CRUMB, "min-w-0 wrap-anywhere")}>
              {issuer}
            </a>
          </li>
        )}
        <li
          aria-current="page"
          className={cx("flex min-w-0 items-center text-text-primary", after)}
        >
          {current}
        </li>
      </ol>
    </nav>
  );
}

/**
 * Quiet links beside the breadcrumb: the issuer's earlier runs, this run's progress record and the
 * source-icon highlight. The
 * highlight is the page's shared state, so switching it redraws this part only, not the open tab.
 */
function ReportUtilities({
  id,
  preview,
  evidence,
  deliverables,
  history,
}: {
  id: string;
  preview: boolean;
  evidence: boolean;
  deliverables: boolean;
  /** The Runs page is open: its own link is not offered on it. */
  history: boolean;
}) {
  const [sources, setSources] = useSourcesOn();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {!evidence && !deliverables && (
        <SourcesSwitch isSelected={sources} onChange={setSources} label="Highlight source icons" />
      )}
      {!history && (
        <Button
          className="min-h-8 max-[480px]:min-h-11"
          color="link-gray"
          size="sm"
          href="#history"
        >
          Earlier runs
        </Button>
      )}
      {!preview && (
        <Button
          className="min-h-8 max-[480px]:min-h-11"
          color="link-gray"
          size="sm"
          href={`/run/${encodeURIComponent(id)}`}
        >
          Run progress
        </Button>
      )}
    </div>
  );
}

/** The run's facts as quiet chips: pathway, as-of date and period, unit, ratings, test state, labels. */
function FactChips({
  run,
  catalogue,
  ratings,
  facts,
}: {
  run: PublishedRun;
  catalogue: CatalogueRun | undefined;
  ratings: ReturnType<typeof reportIdentity>["ratings"];
  facts: { mode: Mode; preview: boolean; labels: string[] };
}) {
  const unit = runMoneyUnit(catalogue);
  // A verified publication also names the ticker, and the financial period where it is not the
  // run's own period or as-of date.
  const verified = run.publicationVerified === true;
  const period = catalogue?.period;
  const plain = [
    runPathway(run, catalogue),
    runTiming(run),
    verified && catalogue?.ticker ? catalogue.ticker : "",
    verified && period && period !== run.period && period !== run.asOf
      ? `Financial period ${period}`
      : "",
    unit ? unitLabel(unit) : "",
  ];
  const test = facts.preview ? "Test preview" : facts.mode === "synthetic" ? "Synthetic test" : "";
  // A run of a chosen list of modules is not the pathway's whole assessment: the header says so,
  // in the words the run history uses.
  const partial = verified && run.assessmentScope === "partial" ? "Partial assessment" : "";
  return (
    <ul aria-label="Run facts" className="flex flex-wrap items-center gap-2">
      {/* A test run says so first, on the same line as the facts it qualifies. */}
      {test && <li className={cx(CHIP, TEST)}>{test}</li>}
      {[...plain.slice(0, 1), partial, ...plain.slice(1)].filter(Boolean).map((fact, index) => (
        <li key={`fact-${String(index)}`} className={cx(CHIP, QUIET)}>
          {fact}
        </li>
      ))}
      {ratings.map((rating, index) => (
        <RatingChip key={`rating-${String(index)}`} rating={rating} className={cx(CHIP, QUIET)} />
      ))}
      {facts.labels.map((label, index) => (
        <li key={`label-${String(index)}`} className={cx(CHIP, QUIET)}>
          {label}
        </li>
      ))}
      {ratings.length > 0 ? (
        // The note follows the chips on their line; it is their source, not a row of its own.
        <li className="text-caption text-text-tertiary">Ratings entered at run start</li>
      ) : (
        <li className={cx(CHIP, QUIET)}>Ratings not entered</li>
      )}
    </ul>
  );
}

/**
 * The report header on every report page: breadcrumb, the issuer's name large with its sector
 * line, the run's facts as quiet chips, and the section control to the right.
 */
function ReportHeader({
  issuer,
  run,
  catalogue,
  view,
  tab,
  facts,
  utilities,
}: {
  issuer: string;
  run: PublishedRun;
  catalogue: CatalogueRun | undefined;
  view: ReportView;
  tab: Tab;
  facts: { mode: Mode; preview: boolean; labels: string[] };
  utilities: ReactNode;
}) {
  const { sector, ratings, differing } = reportIdentity(catalogue, view.entries);
  return (
    // Reading order is breadcrumb, name, facts, sections, then the quiet utilities; at desktop
    // the grid lifts the utilities to the breadcrumb's row and the sections beside the name.
    <section
      aria-labelledby="report-title"
      className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-2.5 lg:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        {/* The last crumb names the open section; the pathway is the first fact chip. */}
        <Crumbs issuer={issuer} current={tabs.find(([name]) => name === tab)?.[1] ?? "Runs"} />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h1
            id="report-title"
            className="font-display text-h1 font-semibold tracking-tight text-balance wrap-anywhere text-text-primary"
          >
            {issuer}
          </h1>
          {sector && <p className="text-small text-text-secondary">{sector}</p>}
        </div>
      </div>
      {/* The facts take the header's full width under the name and the sections, so they hold
          one line at 1024 px instead of wrapping in the column the section control leaves. */}
      <div className="flex min-w-0 flex-col gap-2.5 lg:col-span-2 lg:row-start-3">
        <FactChips run={run} catalogue={catalogue} ratings={ratings} facts={facts} />
        <DifferingRating differing={differing} />
      </div>
      <div className="mt-2.5 min-w-0 lg:col-start-2 lg:row-start-2 lg:mt-0 lg:self-end">
        <ReportNav tab={tab} modules={view.modules.length} />
      </div>
      <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:justify-self-end">{utilities}</div>
    </section>
  );
}

/** The header of an address with no published run: the way back and what was asked for. */
function PlainHeader({ issuer }: { issuer: string | null }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Crumbs issuer={null} current={issuer || "Report"} />
      <h1 className="font-display text-h1 font-semibold tracking-tight text-balance wrap-anywhere text-text-primary">
        {issuer ? `${issuer} report` : "Credit report"}
      </h1>
    </div>
  );
}

/** The report's snapshot, or why there is none: the service could not be reached, it answered
 * with an error, or it publishes no report for this address (with the run's record, if any). */
type Loaded =
  | { snapshot: Snapshot | null }
  | { failure: "unreachable" | "failed" }
  | { failure: "unpublished"; run: ConnectedRun | null };

async function loadReport(signal: AbortSignal, id: string): Promise<Loaded> {
  try {
    return { snapshot: await getSnapshot(signal, id) };
  } catch (failure) {
    if (signal.aborted) throw failure;
    if (failure instanceof TypeError) return { failure: "unreachable" };
    if (!(failure instanceof RequestError) || failure.status !== 404) return { failure: "failed" };
    const run = await getRun(id, signal).catch((reason: unknown) => {
      if (signal.aborted) throw reason;
      return null;
    });
    return { failure: "unpublished", run };
  }
}

type Notice = {
  tone: "info" | "warning" | "error";
  title: string;
  text: string;
  actions: ("retry" | "run" | "library")[];
};

function unpublishedNotice(run: ConnectedRun | null): Notice {
  if (!run)
    return {
      tone: "warning",
      title: "No report at this address",
      text: "No published report or run record was found for this address.",
      actions: ["library"],
    };
  if (run.status === "queued" || run.status === "running")
    return {
      tone: "info",
      title: "This run is in progress",
      text: "The report will appear here once it’s published.",
      actions: ["run"],
    };
  if (run.status === "finished")
    return {
      tone: "warning",
      title: "No report is listed for this run",
      text: "The run finished. Check Run progress for the delivery record.",
      actions: ["run", "library"],
    };
  return {
    tone: "warning",
    title: "This run ended without a report",
    text: "Check Run progress to see where the run stopped.",
    actions: ["run", "library"],
  };
}

function failureNotice(loaded: Exclude<Loaded, { snapshot: Snapshot | null }>): Notice {
  if (loaded.failure === "unpublished") return unpublishedNotice(loaded.run);
  if (loaded.failure === "unreachable")
    return {
      tone: "error",
      title: "The report service could not be reached",
      text: "Check that Credit OS is still running on this computer, then try again.",
      actions: ["retry"],
    };
  return {
    tone: "error",
    title: "The report could not be loaded",
    text: "Try again or open Run progress to see the run’s record.",
    actions: ["retry", "run"],
  };
}

function ReportUnavailable({
  loaded,
  id,
  retry,
}: {
  loaded: Exclude<Loaded, { snapshot: Snapshot | null }>;
  id: string;
  retry: () => void;
}) {
  const { tone, title, text, actions } = failureNotice(loaded);
  const action = {
    retry: (
      <Button key="retry" color="secondary" size="sm" onPress={retry}>
        Try again
      </Button>
    ),
    run: (
      <Button key="run" color="secondary" size="sm" href={`/run/${encodeURIComponent(id)}`}>
        Run progress
      </Button>
    ),
    library: (
      <Button key="library" color="link-gray" size="sm" href="/">
        Back to the library
      </Button>
    ),
  };
  return (
    <div className="mt-6">
      <Alert
        tone={tone}
        title={title}
        action={<div className="flex flex-wrap gap-3">{actions.map((name) => action[name])}</div>}
      >
        {text}
      </Alert>
    </div>
  );
}

function ReaderStatus({
  loaded,
  found,
  id,
  retry,
  hidePreviewReason = false,
}: {
  loaded: Loaded | undefined;
  found: boolean;
  id: string;
  retry: () => void;
  hidePreviewReason?: boolean;
}) {
  if (loaded === undefined)
    return (
      <div role="status" className="mt-6 grid gap-5 text-text-secondary">
        <p>Loading report…</p>
        {/* The page's own shape: the name and facts, then the first row's 8 + 4 tiles. */}
        <div aria-hidden="true" className="grid gap-4">
          <div className="h-10 w-1/2 rounded-ds-md bg-surface-subtle" />
          <div className="h-6 w-1/3 rounded-ds-sm bg-surface-subtle" />
          <div className="mt-2 grid grid-cols-12 gap-4">
            <div className="col-span-8 h-72 rounded-ds-lg bg-surface-subtle" />
            <div className="col-span-4 grid gap-4">
              <div className="rounded-ds-lg bg-surface-subtle" />
              <div className="rounded-ds-lg bg-surface-subtle" />
            </div>
          </div>
        </div>
      </div>
    );
  if (!("snapshot" in loaded)) return <ReportUnavailable loaded={loaded} id={id} retry={retry} />;
  return (
    <>
      {!hidePreviewReason && loaded.snapshot?.preview?.reason && (
        <div className="mt-4">
          <Callout title="Test preview">{loaded.snapshot.preview.reason}</Callout>
        </div>
      )}
      {!found && <p className={`mt-6 ${card}`}>No report was published for this run.</p>}
    </>
  );
}

/** A report; Try again on a failed load reads it afresh. */
export function ReportReader({ id, mode }: { id: string; mode: Mode }) {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setAttempt((count) => count + 1);
  }, []);
  return <ReportReaderPage key={attempt} id={id} mode={mode} retry={retry} />;
}

/** A module address after its code: an output index, then `records` and a table title, each optional. */
function moduleAddress(rest: string[]) {
  const at = rest.indexOf("records");
  const output = at === 0 ? undefined : rest[0];
  if (at === -1) return { output, records: false };
  return { output, records: true, table: tableTitle(rest[at + 1]) };
}

/** True when the address is a module's and names its records. */
function namesRecords(hash: string) {
  const { tab, parts } = reportRoute(hash);
  return tab === "modules" && moduleAddress(parts.slice(1)).records;
}

/** A table title from the address; an escape that is not UTF-8 names no table. */
function tableTitle(named: string | undefined) {
  if (!named) return undefined;
  try {
    return decodeURIComponent(named);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
    return undefined;
  }
}

function reportRoute(hash: string): { tab: Tab; parts: string[] } {
  const [route, ...parts] = hash.slice(1).split("/");
  if (route === "history") return { tab: route, parts };
  if (route === "modules" && parts[0] === "CP-8") return { tab: "changes", parts };
  return { tab: tabs.find(([name]) => name === route)?.[0] ?? "overview", parts };
}

function reportPublication(loaded: Loaded | undefined, id: string) {
  const value = loaded && "snapshot" in loaded ? loaded.snapshot : undefined;
  const found = value && publishedRunForFolder(value.workspace.runs, id);
  const matches = value?.catalogue.real.filter((entry) => entry.id === id);
  const catalogue = matches?.length === 1 ? matches[0] : undefined;
  const run = found?.[1] ?? null;
  return { value, found, run, catalogue, issuer: reportIssuer(run, catalogue, loaded) };
}

function reportIssuer(
  run: PublishedRun | null,
  catalogue: CatalogueRun | undefined,
  loaded: Loaded | undefined,
) {
  if (run) return catalogue?.name || run.issuerHeading || run.issuer;
  return unpublishedIssuer(loaded);
}

function unpublishedIssuer(loaded: Loaded | undefined) {
  if (loaded && "failure" in loaded && loaded.failure === "unpublished")
    return loaded.run?.issuer_name ?? null;
  return null;
}

function useReportTitle(issuer: string | null, page: string) {
  useEffect(() => {
    document.title = [page, issuer, "Credit OS"].filter(Boolean).join(" — ");
    return () => {
      document.title = "Credit OS";
    };
  }, [issuer, page]);
}

type ReportExports = ReturnType<typeof reportExports>;

function useReportExport(value: Snapshot | null | undefined, id: string, mode: Mode, hash: string) {
  const exportId = exportRoute(hash);
  const exports = useMemo(() => reportExports(value, id, mode), [value, id, mode]);
  const preview =
    exportId === null
      ? ({ state: "unavailable", reason: "This PDF format is unavailable." } as const)
      : exportId && value !== undefined
        ? exports.resolve(exportId)
        : undefined;
  return { exportId, exports, preview };
}

function ReportReaderPage({ id, mode, retry }: { id: string; mode: Mode; retry: () => void }) {
  const load = useCallback((signal: AbortSignal) => loadReport(signal, id), [id]);
  const resource = useResource(load);
  const loaded: Loaded | undefined =
    resource.value ?? (resource.error ? { failure: "failed" } : undefined);
  const [sources] = useSourcesOn();
  const hash = useSyncExternalStore(listenHash, readHash);
  const { tab, parts } = useMemo(() => reportRoute(hash), [hash]);
  const { value, found, run, catalogue, issuer } = reportPublication(loaded, id);
  const root = useRef<HTMLDivElement>(null);
  useReportPlace(root, hash, Boolean(run));
  const { exportId, exports, preview } = useReportExport(value, id, mode, hash);
  const readyPreview = preview?.state === "ready" ? preview : null;
  const historyState: unknown = window.history.state;
  const autoPrint =
    exportId !== undefined &&
    typeof historyState === "object" &&
    historyState !== null &&
    "reportPrintOnReady" in historyState &&
    historyState.reportPrintOnReady === true;
  const reportPage = run ? readerPageName(tab, parts, run.pathway) : "Credit report";
  const page = exportId === undefined ? reportPage : (readyPreview?.name ?? "PDF preview");
  useReportTitle(exportId === undefined ? issuer : (readyPreview?.document.issuer ?? null), page);
  if (exportId !== undefined)
    return (
      <div ref={root}>
        <ReportExportPreview key={exportId ?? "unsupported"} report={preview} autoPrint={autoPrint}>
          <ReaderStatus
            loaded={loaded}
            found={Boolean(found)}
            id={id}
            retry={retry}
            hidePreviewReason
          />
        </ReportExportPreview>
      </div>
    );
  return (
    <div
      ref={root}
      className="mx-auto grid w-full max-w-[96rem] min-w-0 gap-6"
      data-sources={sources ? "on" : "off"}
    >
      {!run && <PlainHeader issuer={issuer} />}
      <ReaderStatus
        loaded={loaded}
        found={Boolean(found)}
        id={id}
        retry={retry}
        hidePreviewReason={tab === "deliverables"}
      />
      {value && found && (
        <ReportPage
          snapshot={value}
          run={found[1]}
          routeKey={found[0]}
          parts={parts}
          tab={tab}
          mode={mode}
          catalogue={catalogue}
          issuer={issuer ?? found[1].issuer}
          exports={exports}
        />
      )}
    </div>
  );
}
