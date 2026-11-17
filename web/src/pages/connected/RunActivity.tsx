import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { StatusBadge } from "@/components/status/StatusBadge";
import { StatusShape } from "@/components/status/shapes";
import { PageHeader } from "../../shell/PageHeader";
import { TextLink } from "../run/TextLink";
import {
  getActivity,
  moduleName,
  pathwayName,
  type Activity,
  type EndedRun,
  type LiveRun,
  type ModuleState,
} from "./api";
import { heading } from "./layout";
import { finishedFigure, stamp } from "./runFigures";

const RELOAD_MS = 5000;
const STEP = {
  done: "Finished",
  running: "Running",
  stopped: "Interrupted",
  waiting: "Queued",
} as const satisfies Record<ModuleState, string>;
const ENDED = {
  failed: "Failed",
  capped: "Capped",
  rejected: "Rejected",
  interrupted: "Interrupted",
} as const satisfies Record<EndedRun["status"], string>;
const panel = "rounded-ds-lg border border-border-subtle bg-surface-card shadow-1";

const runPath = (run: { id: string }) => `/run/${encodeURIComponent(run.id)}`;
const issuer = (run: { issuer_name: string }) => run.issuer_name || "Issuer not named";
const fileCount = (run: LiveRun) =>
  run.files > 0 && `${String(run.files)} source file${run.files === 1 ? "" : "s"}`;
const texts = (...parts: (string | false)[]) =>
  parts.filter((part): part is string => Boolean(part));
/** Why a run is not moving, and the name warning: the card and the waiting row both say them. */
const notes = (run: LiveRun) =>
  texts(run.reason, run.name_differs && "Issuer name differs from earlier runs");

/** The list, re-read while the page is open; a failed read is shown as unreadable, never as empty. */
function useActivity() {
  const [activity, setActivity] = useState<Activity | "unreadable">();
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      const next = await getActivity(controller.signal).catch(() => null);
      if (controller.signal.aborted) return;
      setActivity(next && Array.isArray(next.runs) ? next : "unreadable");
      timer = setTimeout(() => void poll(), RELOAD_MS);
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  return activity;
}

function Tally({ counts }: { counts: [string, number][] }) {
  return (
    <dl className="flex gap-8">
      {counts.map(([term, count]) => (
        <div key={term}>
          <dt className="text-sm text-text-tertiary">{term}</dt>
          <dd className="text-2xl font-medium text-text-primary tabular-nums">{count}</dd>
        </div>
      ))}
    </dl>
  );
}

function RunningCard({ run }: { run: LiveRun }) {
  const { bar } = finishedFigure(run);
  const line = texts(
    run.submitted_by && `submitted by ${run.submitted_by}`,
    run.started_at && `started ${stamp(run.started_at)}`,
  ).join(" · ");
  const foot = texts(fileCount(run), ...notes(run));
  return (
    <li className={`${panel} flex flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">
            <TextLink href={runPath(run)}>{issuer(run)}</TextLink>
          </h3>
          {line && <p className="mt-0.5 text-sm text-text-tertiary">{line}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge color="gray">{pathwayName(run.pathway)}</Badge>
          <StatusBadge set="Run states" state="Running" live={!run.stalled} />
          {run.stalled && (
            <Badge color="warning" className="gap-1.5 pl-2" icon={<StatusShape shape="triangle" />}>
              No activity in the last hour
            </Badge>
          )}
        </div>
      </div>
      {run.modules.length > 0 && (
        <>
          {bar && <ProgressBar value={bar.value} max={bar.max} label={bar.label} />}
          <ul aria-label="Modules" className="flex flex-wrap gap-1.5">
            {run.modules.map(([code, state]) => (
              <li key={code}>
                <StatusBadge
                  set="Run states"
                  state={STEP[state]}
                  label={moduleName(code)}
                  live={!run.stalled}
                />
                <span className="sr-only">{STEP[state]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {foot.length > 0 && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border-subtle pt-3 text-sm text-text-secondary">
          {foot.map((text) => (
            <span key={text}>{text}</span>
          ))}
        </p>
      )}
    </li>
  );
}

function WaitingTable({ runs }: { runs: LiveRun[] }) {
  return (
    <div className={`${panel} overflow-hidden`}>
      <Table aria-label="Waiting runs" size="sm">
        <Table.Header>
          <Table.Head id="issuer" isRowHeader label="Issuer" />
          <Table.Head id="pathway" label="Pathway" />
        </Table.Header>
        <Table.Body items={runs}>
          {(run) => (
            <Table.Row id={run.id}>
              <Table.Cell>
                <TextLink href={runPath(run)}>{issuer(run)}</TextLink>
                {texts(
                  texts(
                    run.submitted_by && `submitted by ${run.submitted_by}`,
                    fileCount(run),
                  ).join(" · "),
                  ...notes(run),
                ).map((text) => (
                  <span key={text} className="block text-xs">
                    {text}
                  </span>
                ))}
              </Table.Cell>
              <Table.Cell>{pathwayName(run.pathway)}</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}

function EndedTable({ runs }: { runs: EndedRun[] }) {
  return (
    <div className={`${panel} overflow-hidden`}>
      <Table aria-label="Runs that ended without a report" size="sm">
        <Table.Header>
          <Table.Head id="issuer" isRowHeader label="Issuer" />
          <Table.Head id="pathway" label="Pathway" />
          <Table.Head id="state" label="State" />
          <Table.Head id="ended" label="Ended" />
          <Table.Head id="reason" label="Reason" />
        </Table.Header>
        <Table.Body items={runs}>
          {(run) => (
            <Table.Row id={run.id}>
              <Table.Cell>
                <TextLink href={runPath(run)}>{issuer(run)}</TextLink>
              </Table.Cell>
              <Table.Cell>{pathwayName(run.pathway)}</Table.Cell>
              <Table.Cell>
                <StatusBadge set="Run states" state={ENDED[run.status]} />
              </Table.Cell>
              <Table.Cell>{run.ended_at ? stamp(run.ended_at) : "Not recorded"}</Table.Cell>
              <Table.Cell>{run.reason}</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="grid min-w-0 content-start gap-3">
      <h2 className={heading}>{title}</h2>
      {children}
    </section>
  );
}

function Empty({ title, children }: { title: string; children: string }) {
  return (
    <EmptyState>
      <EmptyState.Header>
        <EmptyState.FeaturedIcon />
      </EmptyState.Header>
      <EmptyState.Content>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{children}</EmptyState.Description>
      </EmptyState.Content>
      <EmptyState.Footer>
        <Button href="/" color="secondary">
          Open the library
        </Button>
      </EmptyState.Footer>
    </EmptyState>
  );
}

/** What is running, waiting and ended without a report. A run's own page has its spend, modules and activity. */
export function RunActivity() {
  const activity = useActivity();
  const read = typeof activity === "object" ? activity : undefined;
  const running = read?.runs.filter((run) => run.status === "running") ?? [];
  const waiting = read?.runs.filter((run) => run.status === "queued") ?? [];
  const ended = read?.ended ?? [];
  const endedTotal = Math.max(read?.ended_total ?? 0, ended.length);
  return (
    <>
      <PageHeader
        title="Run activity"
        badges={
          read && (
            <span className="text-sm text-text-secondary">{`Updated ${stamp(read.updated)}`}</span>
          )
        }
        actions={
          <div className="flex items-center gap-8">
            {read && (
              <Tally
                counts={[
                  ["Running", running.length],
                  ["Waiting", waiting.length],
                  ["Ended", endedTotal],
                ]}
              />
            )}
            <Button href="/start">Start a run</Button>
          </div>
        }
      />
      <div className="mt-6 grid gap-6">
        {activity === undefined && (
          <p role="status" className="text-text-secondary">
            Loading run activity…
          </p>
        )}
        {activity === "unreadable" && (
          <Empty title="Run activity could not be read">
            Nothing is claimed about runs in progress, waiting or ended without a report. This page
            reads it again every few seconds. Finished runs are in the library.
          </Empty>
        )}
        {read?.held && (
          <Alert tone="warning" title="Held by the service">
            {read.held}
          </Alert>
        )}
        {read?.unreadable ? (
          <Alert tone="warning" title="Some run records could not be read">
            {read.unreadable === 1
              ? "1 run record could not be read and is not listed."
              : `${String(read.unreadable)} run records could not be read and are not listed.`}
          </Alert>
        ) : null}
        {read && running.length + waiting.length + ended.length === 0 && (
          <Empty
            title={read.unreadable ? "No readable run record is in progress" : "No run in progress"}
          >
            {read.unreadable
              ? "No readable run record is running or waiting. Finished runs are in the library."
              : "No run is running or waiting. Finished runs are in the library."}
          </Empty>
        )}
        {running.length + waiting.length > 0 && (
          <div
            className={
              running.length && waiting.length
                ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]"
                : undefined
            }
          >
            {running.length > 0 && (
              <Group title="Running">
                <ul className="grid gap-4">
                  {running.map((run) => (
                    <RunningCard key={run.id} run={run} />
                  ))}
                </ul>
              </Group>
            )}
            {waiting.length > 0 && (
              <Group title="Waiting">
                <WaitingTable runs={waiting} />
              </Group>
            )}
          </div>
        )}
        {ended.length > 0 && (
          <Group title="Ended without a report">
            {endedTotal > ended.length && (
              <p className="text-sm text-text-secondary">
                {`Showing the latest ${String(ended.length)} of ${String(endedTotal)}.`}
              </p>
            )}
            <EndedTable runs={ended} />
          </Group>
        )}
      </div>
    </>
  );
}
