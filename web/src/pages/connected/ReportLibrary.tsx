import { ArrowRight } from "@untitledui/icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { Alert } from "@/components/alert/Alert";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/status/StatusBadge";
import { RunTabLink } from "@/pages/library/parts/RunFrame";
import { SourcesSwitch, useSourcesOn } from "@/pages/library/parts/SourcesSwitch";
import { PageHeader } from "../../shell/PageHeader";
import { TextLink } from "../run/TextLink";
import { Callout } from "@/components/alert/Alert";
import { Breadcrumb, card, heading } from "./layout";
import {
  comparisonForRun,
  comparisonRows,
  evidencePath,
  getSnapshot,
  outputEntries,
  reportPath,
  runLabels,
  runPathway,
  runTiming,
  type CatalogueRun,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "./publishedReport";
import { ReportFindings } from "./ReportContent";
import { ReportEvidence } from "./report/Evidence";
import { getRun, moduleName, RequestError, type Mode, type Run } from "./api";
import { LegacyVisuals } from "./visuals";
import {
  actionBias,
  buildReportView,
  foundationMetrics,
  headlineSources,
  moduleBottomLines,
  moduleOrder,
  overviewCharts,
  runLimitations,
  type MetricKey,
  type ReportView,
} from "./reportView";

const TILE_KEYS: readonly MetricKey[] = ["liquidity", "freeCashFlow", "leverage", "maturities"];
import { Calendar, buildCalendar, upcomingCalendarRows } from "./report/Calendar";
import { Changes, ComparisonTable } from "./report/Changes";
import { Forecast } from "./report/Forecast";
import { IdentityBand } from "./report/IdentityBand";
import { MetricGrid } from "./report/MetricGrid";
import { Modules } from "./report/Modules";
import { ModuleBottomLines, RunLimitations } from "./report/OverviewModules";
import { PublishedTraceProvider } from "./report/PublishedTrace";
import { PortfolioBasisProvider } from "./report/PortfolioBasis";
import { useResource } from "./useResource";
import { HeadlineFigures } from "./HeadlineFigures";

const tabs = [
  ["history", "History"],
  ["overview", "Overview"],
  ["changes", "Changes"],
  ["modules", "Modules"],
  ["forecast", "Forecast"],
  ["evidence", "Evidence"],
] as const;
type ReportTab = (typeof tabs)[number][0];
type Tab = ReportTab | "calendar";

function listenHash(fn: () => void) {
  window.addEventListener("hashchange", fn);
  return () => {
    window.removeEventListener("hashchange", fn);
  };
}

const readHash = () => window.location.hash;
const tabHref = (tab: ReportTab) => `#${tab}`;

function readerPageName(tab: Tab, parts: string[]) {
  if (tab === "calendar") return "Issuer calendar";
  if (tab === "modules" && parts[0] && parts[0] !== "CP-8") return moduleName(parts[0]);
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
  window.history.replaceState({ ...(named ? state : null), reportEntry: id }, "");
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
    if (previous === null || previous === id) return;
    left.current.set(previous, offset.current);
    const main = root.current?.closest("main");
    const back = left.current.get(id);
    if (main) {
      main.scrollTop = back ?? 0;
      offset.current = main.scrollTop;
    }
  }, [hash, ready, root]);
}

function ReportNav({ tab, modules }: { tab: Tab; modules: number }) {
  return (
    <nav
      aria-label="Report sections"
      className="flex flex-wrap gap-3 border-b border-border-hairline"
    >
      {tabs.map(([key, title]) => (
        <RunTabLink
          key={key}
          href={tabHref(key)}
          label={title}
          current={tab === key || (tab === "calendar" && key === "overview")}
          count={key === "modules" ? String(modules) : undefined}
          accessibleLabel={key === "modules" ? `Modules ${String(modules)}` : undefined}
        />
      ))}
    </nav>
  );
}

/** The modules a run ran, by plain name in run order, and its labels; read from the run's own
 * published snapshot (another run's record in this one carries only its date and pathway). */
function runDetails(snapshot: Snapshot, folder: string) {
  const found = Object.entries(snapshot.workspace.runs).find(
    ([, record]) => record.folder === folder && Object.hasOwn(record, "modules"),
  );
  if (!found) return null;
  const [key, run] = found;
  const modules = moduleOrder(run).filter((id) => run.modules[id]?.outputs.length);
  return {
    modules: modules.map(moduleName),
    labels: runLabels(outputEntries(snapshot, run, key), run),
  };
}

function modulesRun(details: ReturnType<typeof runDetails> | undefined, error: string) {
  if (details) {
    const count = details.modules.length;
    return `${String(count)} ${count === 1 ? "module" : "modules"} run: ${details.modules.join(", ")}`;
  }
  if (details === null || error) return "The modules this run ran could not be read.";
  return "Reading the modules this run ran…";
}

function HistoryRow({
  record,
  catalogue,
  held,
}: {
  record: PublishedRun;
  catalogue: CatalogueRun | undefined;
  /** This page's snapshot when the row is the run on screen; another run's is fetched. */
  held: Snapshot | null;
}) {
  const load = useCallback(
    (signal: AbortSignal) => (held ? Promise.resolve(held) : getSnapshot(signal, record.folder)),
    [held, record.folder],
  );
  const { value, error } = useResource(load);
  const details = value ? runDetails(value, record.folder) : value === null ? null : undefined;
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-t border-border-hairline pt-3">
      <div className="grid gap-1">
        <p className="font-semibold">{runPathway(record, catalogue) || "Credit report"}</p>
        <p className="text-sm text-text-secondary">{runTiming(record)}</p>
        <p className="text-sm text-text-secondary">{modulesRun(details, error)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge set="Run states" state="Finished" />
        {details?.labels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        <TextLink href={`${reportPath(record.folder)}#overview`}>Open overview</TextLink>
        <TextLink href={`${reportPath(record.folder)}#changes`}>What changed</TextLink>
      </div>
    </li>
  );
}

/** One row per published run of the issuer, newest first; every run listed here is finished. */
function RunHistory({ snapshot, run }: { snapshot: Snapshot; run: PublishedRun }) {
  const records = Object.values(snapshot.workspace.runs).filter(
    (record) => record === run || Boolean(run.issuerKey && record.issuerKey === run.issuerKey),
  );
  const byFolder = new Map(snapshot.catalogue.real.map((item) => [item.id, item]));
  return (
    <section className={card}>
      <h2 className={heading}>Report history</h2>
      <ul className="grid gap-3">
        {records
          .sort((a, b) => (b.asOf ?? "").localeCompare(a.asOf ?? ""))
          .map((record) => (
            <HistoryRow
              key={record.folder}
              record={record}
              catalogue={byFolder.get(record.folder)}
              held={record === run ? snapshot : null}
            />
          ))}
      </ul>
    </section>
  );
}

/** The key charts, repeated from the modules that own them, and the way to every chart of the run. */
function KeyCharts({
  run,
  charts,
}: {
  run: PublishedRun;
  charts: ReturnType<typeof overviewCharts>;
}) {
  return (
    <section className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={heading}>Key charts</h2>
        <Button href="#forecast" color="link-gray" size="sm" iconTrailing={ArrowRight}>
          Chart index
        </Button>
      </div>
      {charts.length ? (
        charts.map(({ id, name, entry, output }) => (
          <div key={id} className="grid min-w-0 gap-2">
            <Button
              className="w-fit"
              href={`#modules/${encodeURIComponent(id)}`}
              color="link-gray"
              size="sm"
              iconTrailing={ArrowRight}
            >
              {name}
            </Button>
            <LegacyVisuals
              output={output}
              sections={entry.sections}
              evidenceHref={(line) => evidencePath(run.folder, entry, line)}
              cards
              headingLevel="h3"
            />
          </div>
        ))
      ) : (
        <p className={card}>No key chart has data in this run.</p>
      )}
    </section>
  );
}

function Overview({
  snapshot,
  run,
  view,
  hasCalendar,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReportView;
  hasCalendar: boolean;
}) {
  const calendar = buildCalendar(view.entries, run.folder);
  const watchRows = upcomingCalendarRows(calendar.rows, run.asOf);
  const foundation = view.entries.find((entry) => entry.selected && entry.output.module === "CP-1");
  const metrics = foundation
    ? foundationMetrics(foundation, view.catalogue).filter(({ key }) => TILE_KEYS.includes(key))
    : [];
  const figures = metrics.length ? (
    <MetricGrid
      records={metrics}
      snapshot={snapshot}
      folder={run.folder}
      entry={foundation}
      entryIndex={foundation ? view.entries.indexOf(foundation) : -1}
    />
  ) : (
    <HeadlineFigures
      catalogue={view.catalogue}
      sources={headlineSources(foundation, view.catalogue, run.folder)}
    />
  );
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-h2">Overview</h2>
        {hasCalendar && (
          <Button color="secondary" size="sm" href="#calendar">
            Issuer calendar
          </Button>
        )}
      </div>
      {view.lead ? (
        <>
          <p className="text-sm text-text-secondary">
            <Button href={`#modules/${view.lead.output.module}`} color="link-gray" size="sm">
              {view.lead.output.module === "CP-1B" ? "Earnings view" : "Credit view"} from{" "}
              {moduleName(view.lead.output.module)}
            </Button>
          </p>
          <ReportFindings
            key={view.lead.output.id}
            snapshot={snapshot}
            run={run}
            entry={view.lead}
            entryIndex={view.entries.indexOf(view.lead)}
            overview
            overviewLabel={view.lead.output.module === "CP-1B" ? "Earnings view" : "Credit view"}
            judgement={actionBias(view.lead)}
            afterBottomLine={figures}
          />
        </>
      ) : (
        <>
          {figures}
          <p className={card}>
            No credit view is available in the published handoffs for this run.
          </p>
        </>
      )}
      <ModuleBottomLines run={run} rows={moduleBottomLines(view, run)} />
      <RunLimitations run={run} rows={runLimitations(view, run)} />
      <KeyCharts run={run} charts={overviewCharts(view, run)} />
      {calendar.rows.length > 0 && (
        <section className={`${card} grid gap-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={heading}>Dates to watch</h2>
            <Button href="#calendar" color="link-gray" size="sm" iconTrailing={ArrowRight}>
              Open issuer calendar
            </Button>
          </div>
          {watchRows === null ? (
            <p className="text-sm text-text-secondary" role="status">
              Upcoming dates cannot be determined because this run has no valid as-of date.
            </p>
          ) : watchRows.length === 0 ? (
            <p className="text-sm text-text-secondary" role="status">
              No recorded event dates fall on or after this run’s as-of date.
            </p>
          ) : (
            <ul className="grid gap-2">
              {watchRows.slice(0, 5).map((event, index) => (
                <li
                  key={`${event.href}-${String(index)}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border-hairline pt-2"
                >
                  <div>
                    <p className="font-semibold">{event.cells[3] || "Dated event"}</p>
                    <p className="text-sm text-text-secondary">
                      {event.owner}
                      {event.cells[6] ? ` · ${event.cells[6]}` : ""}
                    </p>
                    {event.cells[4] && (
                      <p className="text-sm text-text-secondary">{event.cells[4]}</p>
                    )}
                    {event.timingWithinRecordedPeriod && (
                      <p className="text-sm text-text-secondary">
                        Timing falls within the recorded period; the exact date is unresolved.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span>{event.cells[0]}</span>
                    <Button href={event.href} color="link-gray" size="sm">
                      Evidence
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
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

function ReportPage({
  snapshot,
  run,
  routeKey,
  parts,
  tab,
  mode,
  catalogue,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  routeKey: string;
  parts: string[];
  catalogue: CatalogueRun | undefined;
  tab: Tab;
  mode: Mode;
}) {
  const view = buildReportView(snapshot, routeKey, run);
  const calendar =
    tab === "overview" || tab === "calendar" ? buildCalendar(view.entries, run.folder) : null;
  const change = comparisonForRun(run, snapshot.workspace.runs);
  return (
    <div className="mt-4 grid min-w-0 gap-5">
      <PortfolioBasisProvider
        folder={run.folder}
        enabled={(tab === "forecast" || tab === "modules") && hasPortfolioCharts(view.entries)}
      >
        <PublishedTraceProvider
          route={JSON.stringify([routeKey, tab, parts])}
          snapshot={snapshot}
          folder={run.folder}
          entries={view.entries}
        >
          <IdentityBand catalogue={catalogue} entries={view.entries} folder={run.folder} />
          <ReportNav tab={tab} modules={view.modules.length} />
          {tab === "history" && <RunHistory snapshot={snapshot} run={run} />}
          {tab === "overview" && (
            <Overview
              snapshot={snapshot}
              run={run}
              view={view}
              hasCalendar={Boolean(calendar?.rows.length || calendar?.gaps.length)}
            />
          )}
          {tab === "calendar" && calendar && <Calendar calendar={calendar} />}
          {tab === "changes" && (
            <Changes snapshot={snapshot} run={run} entries={view.entries} change={change} />
          )}
          {tab === "modules" && (
            <Modules
              snapshot={snapshot}
              run={run}
              view={view}
              module={parts[0]}
              output={parts[1]}
            />
          )}
          {tab === "forecast" && <Forecast run={run} view={view} />}
          {tab === "evidence" && (
            <ReportEvidence
              snapshot={snapshot}
              run={run}
              entries={view.entries}
              target={parts.join("/")}
              mode={mode}
              comparison={<ComparisonMeasures change={change} />}
            />
          )}
        </PublishedTraceProvider>
      </PortfolioBasisProvider>
    </div>
  );
}

function ReaderBadges({
  run,
  catalogue,
  preview,
  mode,
  labels,
}: {
  run: PublishedRun;
  catalogue?: CatalogueRun;
  preview?: Snapshot["preview"];
  mode: Mode;
  labels: string[];
}) {
  return (
    <>
      <Badge>{runTiming(run)}</Badge>
      <Badge>{runPathway(run, catalogue)}</Badge>
      {preview ? (
        <Badge color="brand">Test preview</Badge>
      ) : (
        <>
          <StatusBadge set="Run states" state="Finished" />
          {mode === "synthetic" && <Badge color="brand">Synthetic test</Badge>}
        </>
      )}
      {labels.map((label) => (
        <Badge key={label}>{label}</Badge>
      ))}
    </>
  );
}

function ReaderHeader({
  run,
  catalogue,
  preview,
  mode,
  id,
  labels,
  sources,
  setSources,
  evidence,
  issuer,
}: {
  run: PublishedRun | null;
  catalogue?: CatalogueRun;
  preview?: Snapshot["preview"];
  mode: Mode;
  id: string;
  labels: string[];
  sources: boolean;
  setSources: (selected: boolean) => void;
  evidence: boolean;
  issuer: string | null;
}) {
  if (!run) return <PageHeader title={issuer ? `${issuer} report` : "Credit report"} />;
  return (
    <PageHeader
      title={catalogue?.name || run.issuerHeading || run.issuer}
      badges={
        <ReaderBadges
          run={run}
          catalogue={catalogue}
          preview={preview}
          mode={mode}
          labels={labels}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {!evidence && (
            <SourcesSwitch
              isSelected={sources}
              onChange={setSources}
              label="Highlight source icons"
            />
          )}
          <Button color="secondary" href={`/run/${encodeURIComponent(id)}`}>
            Run progress
          </Button>
        </div>
      }
    />
  );
}

/** The report's snapshot, or why there is none: the service could not be reached, it answered
 * with an error, or it publishes no report for this address (with the run's record, if any). */
type Loaded =
  | { snapshot: Snapshot | null }
  | { failure: "unreachable" | "failed" }
  | { failure: "unpublished"; run: Run | null };

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

function unpublishedNotice(run: Run | null): Notice {
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
      title: "This run is still going",
      text: "Its report appears here when the run finishes. Run activity shows its progress.",
      actions: ["run"],
    };
  if (run.status === "finished")
    return {
      tone: "warning",
      title: "No report is listed for this run",
      text: "The run finished, but the library does not list its report. Run activity shows the run’s record.",
      actions: ["run", "library"],
    };
  return {
    tone: "warning",
    title: "This run ended without a report",
    text: "The run stopped before its report was published. Run activity shows where it stopped.",
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
    text: "The service could not return this report. Try again; Run activity shows the run’s record.",
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
        Run activity
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
}: {
  loaded: Loaded | undefined;
  found: boolean;
  id: string;
  retry: () => void;
}) {
  if (loaded === undefined)
    return (
      <div role="status" className="mt-6 grid gap-5 text-text-secondary">
        <p>Loading report…</p>
        <div aria-hidden="true" className="grid gap-5">
          <div className="h-10 w-3/4 rounded-ds-md bg-surface-subtle" />
          <div className="h-40 rounded-ds-lg bg-surface-subtle" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((at) => (
              <div key={at} className="h-24 rounded-ds-md bg-surface-subtle" />
            ))}
          </div>
        </div>
      </div>
    );
  if (!("snapshot" in loaded)) return <ReportUnavailable loaded={loaded} id={id} retry={retry} />;
  return (
    <>
      {loaded.snapshot?.preview?.reason && (
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

function ReportReaderPage({ id, mode, retry }: { id: string; mode: Mode; retry: () => void }) {
  const load = useCallback((signal: AbortSignal) => loadReport(signal, id), [id]);
  const resource = useResource(load);
  const loaded: Loaded | undefined =
    resource.value ?? (resource.error ? { failure: "failed" } : undefined);
  const value = loaded && "snapshot" in loaded ? loaded.snapshot : undefined;
  const [sources, setSources] = useSourcesOn();
  const hash = useSyncExternalStore(listenHash, readHash);
  const [route, ...parts] = hash.slice(1).split("/");
  const tab =
    route === "calendar"
      ? route
      : route === "modules" && parts[0] === "CP-8"
        ? "changes"
        : (tabs.find(([name]) => name === route)?.[0] ?? "overview");
  const found = value && Object.entries(value.workspace.runs).find(([, run]) => run.folder === id);
  const catalogue = value?.catalogue.real.find((entry) => entry.id === id);
  const run = found ? found[1] : null;
  const issuer = run
    ? catalogue?.name || run.issuerHeading || run.issuer
    : loaded && "failure" in loaded && loaded.failure === "unpublished"
      ? (loaded.run?.issuer_name ?? null)
      : null;
  const root = useRef<HTMLDivElement>(null);
  useReportPlace(root, hash, Boolean(run));
  const page = run ? readerPageName(tab, parts) : "Credit report";
  useEffect(() => {
    if (!issuer || !page) return;
    document.title = `${page} — ${issuer} — Credit OS`;
    return () => {
      document.title = "Credit OS";
    };
  }, [issuer, page]);
  return (
    <div ref={root} className="mx-auto w-full max-w-[96rem]" data-sources={sources ? "on" : "off"}>
      <Breadcrumb>{issuer || "Report"}</Breadcrumb>
      <ReaderHeader
        run={run}
        catalogue={catalogue}
        preview={value?.preview}
        mode={mode}
        id={id}
        labels={value && found ? runLabels(outputEntries(value, found[1], found[0]), found[1]) : []}
        sources={sources}
        setSources={setSources}
        evidence={tab === "evidence"}
        issuer={issuer}
      />
      <ReaderStatus loaded={loaded} found={Boolean(found)} id={id} retry={retry} />
      {value && found && (
        <ReportPage
          snapshot={value}
          run={found[1]}
          routeKey={found[0]}
          parts={parts}
          tab={tab}
          mode={mode}
          catalogue={catalogue}
        />
      )}
    </div>
  );
}
