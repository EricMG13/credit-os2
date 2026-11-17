import { useState, type ReactNode } from "react";
import { Link } from "react-aria-components";
import { Badge } from "@/components/base/badges/badges";
import { StatusBadge } from "@/components/status/StatusBadge";
import { PageHeader } from "@/shell/PageHeader";
import { cx } from "@/utils/cx";
import type { LoadedRun, Run, RunHead } from "../slice";
import { Button } from "@/components/base/buttons/button";
import { LibraryPage } from "./LibraryPage";
import { NotHeld } from "./NotHeld";
import { PAGE_NAME } from "./PageTitle";
import { RunContext } from "./RunContext";
import { SourcesSwitch, useSourcesOn } from "./SourcesSwitch";
import { TraceDrawer } from "./TraceDrawer";
import { ISSUER_HEADING } from "./heading";
import {
  LIBRARY_HOME,
  RUN_START,
  TEXT_LINK,
  changesHref,
  evidenceHref,
  historyHref,
  modulesHref,
  overviewHref,
  traceItemHref,
} from "./links";

export type RunTab = "overview" | "changes" | "modules" | "forecast" | "evidence";

const TAB =
  "inline-flex items-center gap-1.5 border-b-2 border-transparent whitespace-nowrap font-semibold max-[480px]:min-h-11";
const TAB_SIZE = {
  md: "h-9 px-1.5 pb-2.5 text-md",
  sm: "h-8 px-1 pb-2.5 text-sm",
} as const;

/** One tab: a link between routes, or plain disabled text when the run has nowhere to send it. */
export function RunTabLink({
  href,
  current,
  label,
  count,
  accessibleLabel,
  hint,
  small = false,
}: {
  href: string | null;
  current: boolean;
  label: string;
  count?: string;
  accessibleLabel?: string;
  hint?: string;
  /** The smaller tab of a page's own section tabs (the mock's `u-tab-sm`). */
  small?: boolean;
}) {
  const size = TAB_SIZE[small ? "sm" : "md"];
  const badge =
    count === undefined ? null : (
      <Badge size="sm" color={current ? "brand" : "gray"}>
        {count}
      </Badge>
    );
  if (href === null) {
    // Only the label is disabled: the reason it gives carries information, so it is read text.
    return (
      <span className={cx(TAB, size)}>
        <span
          aria-disabled="true"
          className="inline-flex cursor-not-allowed items-center gap-1.5 text-text-disabled"
        >
          {label}
          {badge}
        </span>
        {hint === undefined ? null : (
          <span className="text-small font-normal text-text-tertiary">{hint}</span>
        )}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={accessibleLabel}
      aria-current={current ? "page" : undefined}
      className={cx(
        TAB,
        size,
        TEXT_LINK,
        "text-text-tertiary hover:border-action hover:text-action",
        current && "border-action text-action",
      )}
    >
      {label}
      {badge}
    </Link>
  );
}

function RunTabs({ issuer, run, tab }: { issuer: string; run: Run; tab: RunTab }) {
  const { head } = run;
  const here = (name: RunTab) => tab === name;
  return (
    <nav aria-label="Run pages" className="flex flex-wrap gap-3 border-b border-border-hairline">
      <RunTabLink href={overviewHref(issuer, run.id)} current={here("overview")} label="Overview" />
      <RunTabLink href={changesHref(issuer, run.id)} current={here("changes")} label="Changes" />
      <RunTabLink
        href={
          head.firstModule === null
            ? run.loading
              ? modulesHref(issuer, run.id)
              : null
            : modulesHref(issuer, run.id, head.firstModule)
        }
        current={here("modules")}
        label="Modules"
        count={head.tabs.modulesCount}
      />
      <RunTabLink
        href={head.forecastHref}
        current={here("forecast")}
        label="Forecast"
        hint="No forecast for this run"
      />
      <RunTabLink
        href={evidenceHref(issuer, run.id, "summary")}
        current={here("evidence")}
        label="Evidence"
      />
    </nav>
  );
}

function RunHeader({
  issuer,
  head,
  sources,
}: {
  issuer: string;
  head: RunHead;
  sources: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <Link
        href={LIBRARY_HOME}
        className={`${TEXT_LINK} w-fit text-small text-text-tertiary underline`}
      >
        Library
      </Link>
      <PageHeader
        as={ISSUER_HEADING}
        title={head.issuerName}
        badges={
          <>
            <Badge>{head.asOf}</Badge>
            <Badge>{head.pathway}</Badge>
            <StatusBadge set="Run states" state={head.state} />
          </>
        }
        actions={
          <>
            {sources}
            <Button href={historyHref(issuer)} color="secondary">
              Report history
            </Button>
            <Button href={RUN_START}>New run</Button>
          </>
        }
      />
    </div>
  );
}

const BAR = "rounded-ds-xs bg-surface-subtle";

/** The static skeleton of a run still loading (States mock, "Any run page"): nothing moves. */
function RunSkeleton({ tab }: { tab: RunTab }) {
  if (tab === "modules")
    return (
      <div
        aria-busy="true"
        data-loading-page="modules"
        className="grid items-start gap-10 min-[1001px]:grid-cols-[240px_minmax(0,1fr)]"
      >
        <div className="flex flex-col gap-4">
          {["w-full h-10", "w-3/4 h-4", "w-4/5 h-4", "w-2/3 h-4"].map((size) => (
            <div key={size} className={cx(BAR, size)} />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div className={cx(BAR, "h-8 w-1/2")} />
          <div className={cx(BAR, "h-32 w-full rounded-xl")} />
          <div className={cx(BAR, "h-4 w-4/5")} />
          <div className={cx(BAR, "h-4 w-3/4")} />
        </div>
      </div>
    );
  if (tab === "evidence")
    return (
      <div aria-busy="true" data-loading-page="evidence" className="flex flex-col gap-6">
        <div className={cx(BAR, "h-8 w-1/3")} />
        <div className="flex gap-4 border-b border-border-hairline pb-4">
          {["w-20", "w-24", "w-16", "w-12"].map((width) => (
            <div key={width} className={cx(BAR, "h-6", width)} />
          ))}
        </div>
        <div className="flex flex-col divide-y divide-border-hairline rounded-xl border border-border-hairline bg-surface-card px-4">
          {["w-3/4", "w-4/5", "w-2/3"].map((width) => (
            <div key={width} className="py-4">
              <div className={cx(BAR, "h-4", width)} />
            </div>
          ))}
        </div>
      </div>
    );
  const metric = (title: string, value: string, note: string) => (
    <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-card p-5 shadow-xs">
      <div className={cx(BAR, "h-3.5", title)} />
      <div className={cx(BAR, "h-9.5", value)} />
      <div className={cx(BAR, "h-3.5", note)} />
    </div>
  );
  const item = (title: string, text: string) => (
    <div className="flex items-start gap-4 rounded-lg border border-border-hairline bg-surface-card p-4">
      <div className={cx(BAR, "h-3.5 w-5 flex-none")} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className={cx(BAR, "h-3.5", title)} />
        <div className={cx(BAR, "h-3.5", text)} />
      </div>
    </div>
  );
  return (
    <div aria-busy="true" data-loading-page="overview" className="flex flex-col gap-6">
      <div className={cx(BAR, "h-33 rounded-[10px]")} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {metric("w-1/2", "w-[70%]", "w-4/5")}
        {metric("w-1/2", "w-3/5", "w-[70%]")}
        {metric("w-1/2", "w-[70%]", "w-3/5")}
      </div>
      <div className="flex flex-col gap-2.5">
        {item("w-[30%]", "w-[85%]")}
        {item("w-[36%]", "w-[70%]")}
      </div>
    </div>
  );
}

/**
 * Wraps every run page: the run header, the Show sources switch, the run tabs, and the trace
 * drawer that a page's trace controls open. `children` is the page body, or a function of the run
 * when the body reads the run's own record; a run still loading draws the skeleton in its place
 * and the function is not called.
 */
export function RunFrame({
  issuer: issuerId,
  run: runId,
  tab,
  children,
}: {
  issuer: string | undefined;
  run: string | undefined;
  tab: RunTab;
  children: ReactNode | ((run: LoadedRun, issuer: string) => ReactNode);
}) {
  const [sources, setSources] = useSourcesOn();
  return (
    <LibraryPage title={PAGE_NAME[tab]}>
      {({ issuers }) => {
        const issuer = issuers.find((item) => item.id === issuerId);
        if (issuer === undefined) {
          return (
            <NotHeld
              page={PAGE_NAME[tab]}
              title="No such issuer"
              description="The library holds no issuer at this address."
            />
          );
        }
        const run = issuer.runs.find((item) => item.id === runId);
        if (run === undefined) {
          return (
            <NotHeld
              page={PAGE_NAME[tab]}
              title="No such run"
              description="This issuer has no run at this address."
            />
          );
        }
        return (
          <RunScope
            key={`${issuer.id}/${run.id}`}
            issuerId={issuer.id}
            run={run}
            tab={tab}
            sources={sources}
            setSources={setSources}
          >
            {children}
          </RunScope>
        );
      }}
    </LibraryPage>
  );
}

/**
 * One run's page. The app draws a route at one place, so a page's own state (a filter, a view, a
 * collapse, the open trace drawer) would survive a hash change to another run: the caller keys
 * this component by its run, and all of that state starts again with each run.
 */
function RunScope({
  issuerId,
  run,
  tab,
  sources,
  setSources,
  children,
}: {
  issuerId: string;
  run: Run;
  tab: RunTab;
  sources: boolean;
  setSources: (on: boolean) => void;
  children: ReactNode | ((run: LoadedRun, issuer: string) => ReactNode);
}) {
  const [drawer, setDrawer] = useState<{ key: string | null; open: boolean }>({
    key: null,
    open: false,
  });
  const trace =
    drawer.key !== null && Object.hasOwn(run.traces, drawer.key)
      ? run.traces[drawer.key]
      : undefined;
  return (
    <RunContext.Provider
      value={{
        traces: run.traces,
        open: (key) => {
          setDrawer({ key, open: true });
        },
      }}
    >
      <div data-sources={sources ? "on" : "off"} className="flex flex-col gap-8">
        <div className="flex flex-col gap-5">
          <RunHeader
            issuer={issuerId}
            head={run.head}
            sources={
              // Evidence draws no trace control, so the switch would have nothing to show there.
              tab === "evidence" ? null : (
                <SourcesSwitch isSelected={sources} onChange={setSources} />
              )
            }
          />
          <RunTabs issuer={issuerId} run={run} tab={tab} />
        </div>
        {run.loading ? (
          <RunSkeleton tab={tab} />
        ) : typeof children === "function" ? (
          children(run, issuerId)
        ) : (
          children
        )}
      </div>
      {trace === undefined ? null : (
        <TraceDrawer
          trace={trace}
          evidenceHref={traceItemHref(issuerId, run.id, trace.evidenceItem)}
          isOpen={drawer.open}
          onClose={() => {
            setDrawer({ key: drawer.key, open: false });
          }}
        />
      )}
    </RunContext.Provider>
  );
}
