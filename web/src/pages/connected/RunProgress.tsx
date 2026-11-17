import { useEffect, useState } from "react";
import { Alert } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { Card } from "@/components/card/Card";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Skeleton } from "@/components/gap/Skeleton";
import { PageHeader } from "../../shell/PageHeader";
import { ModuleSteps } from "../run/activity/ModuleSteps";
import { Feed } from "../run/activity/Feed";
import { Summary } from "../run/activity/Summary";
import { TextLink } from "../run/TextLink";
import {
  getReport,
  getRun,
  isPendingReport,
  pathwayName,
  RequestError,
  serviceText,
  type Mode,
  type Run,
  type RunStatus,
} from "./api";
import { Breadcrumb } from "./layout";
import {
  asOfDate,
  elapsedFigure,
  feedLines,
  finishedFigure,
  moduleSteps,
  spendFigure,
} from "./runFigures";
import { isUnreachable } from "./useResource";

const WORDS = {
  queued: "Queued",
  running: "Running",
  finished: "Finished",
  failed: "Failed",
  capped: "Capped",
  rejected: "Rejected",
  interrupted: "Interrupted",
} as const satisfies Record<RunStatus, string>;
const RESTARTABLE: readonly RunStatus[] = ["failed", "capped", "rejected", "interrupted"];

const POLL_MS = 2000;
/** How long a finished run's report may be missing before the page says none was published. */
const REPORT_WAIT_MS = 10_000;

/** How a read of the run, or of its report, failed. */
type Problem = "missing" | "unreachable" | "failed";
/** A finished run's report: not there yet, there, not there after the wait, or unreadable. */
type ReportState = "pending" | "ready" | "absent" | "unreachable" | "failed";

function problemOf(failure: unknown): Problem {
  if (failure instanceof RequestError && failure.status === 404) return "missing";
  return isUnreachable(failure) ? "unreachable" : "failed";
}

const UNREACHABLE = "The service cannot be reached";
const RUN_PROBLEMS = {
  missing: {
    tone: "warning",
    title: "This run was not found",
    text: "The service has no run at this address. Check the address, or find the run in Run activity.",
  },
  unreachable: {
    tone: "error",
    title: UNREACHABLE,
    text: "This page keeps trying and updates when the service answers.",
  },
  failed: {
    tone: "error",
    title: "The run could not be loaded",
    text: "The service could not read this run. This page keeps trying.",
  },
} as const;
const REPORT_PROBLEMS = {
  absent: {
    tone: "warning",
    title: "No report was published for this run",
    text: "The run finished, but the service has no published report for it.",
  },
  unreachable: {
    tone: "error",
    title: UNREACHABLE,
    text: "The report could not be checked.",
  },
  failed: {
    tone: "error",
    title: "The report could not be loaded",
    text: "The service could not read this run's report.",
  },
} as const;

export function RunProgress({ id, mode }: { id: string; mode: Mode }) {
  const [run, setRun] = useState<Run>();
  useEffect(() => {
    document.title = `${run?.issuer_name || "Run progress"}${run?.issuer_name ? " run" : ""} — Credit OS`;
  }, [run?.issuer_name]);
  // Reading the run and reading its report fail apart, so one poll never clears the other's
  // alert: an alert that is removed and inserted again is announced again.
  const [problem, setProblem] = useState<Problem>();
  const [report, setReport] = useState<ReportState>("pending");
  const [notAssessable, setNotAssessable] = useState<string[]>([]);
  // Counts of presses of "Try again" (the run) and "Check again" (the report); each restarts the poll.
  const [retries, setRetries] = useState(0);
  const [rechecks, setRechecks] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Pressing "Check again" asks once and is answered at once; only the first look waits.
    let finishedAt: number | undefined = rechecks > 0 ? 0 : undefined;
    const cancelled = () => signal.aborted;
    const waitOver = () => Date.now() - (finishedAt ?? Date.now()) >= REPORT_WAIT_MS;
    function schedule() {
      if (!cancelled())
        timer = setTimeout(() => {
          void poll();
        }, POLL_MS);
    }
    async function reportState(giveUp: boolean): Promise<ReportState> {
      try {
        const publication = await getReport(id, signal);
        if (!cancelled()) setNotAssessable(publication.not_assessable ?? []);
        return "ready";
      } catch (failure) {
        if (isPendingReport(failure)) return giveUp ? "absent" : "pending";
        return isUnreachable(failure) ? "unreachable" : "failed";
      }
    }
    async function poll() {
      try {
        const next = await getRun(id, signal);
        if (cancelled()) return;
        setRun(next);
        setProblem(undefined);
        if (next.status === "queued" || next.status === "running") {
          schedule();
        } else if (next.status === "finished") {
          finishedAt ??= Date.now();
          // Decided once per look: the same answer chooses the state and whether to look again.
          const giveUp = waitOver();
          const state = await reportState(giveUp);
          if (cancelled()) return;
          setReport(state);
          if (state !== "ready" && state !== "absent" && !giveUp) schedule();
        }
      } catch (failure) {
        if (cancelled()) return;
        const found = problemOf(failure);
        setProblem(found);
        if (found !== "missing") schedule();
      }
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id, retries, rechecks]);

  // The alert stays until the new answer arrives, so the button that was pressed keeps its place.
  const tryAgain = () => {
    setRetries((count) => count + 1);
  };
  const checkAgain = () => {
    setRechecks((count) => count + 1);
  };
  const restartable = run && RESTARTABLE.includes(run.status);
  const live = run?.status === "queued" || run?.status === "running";
  const lines = run ? feedLines(run) : [];
  const runProblem = problem && RUN_PROBLEMS[problem];
  const reportProblem =
    run?.status === "finished" && report !== "pending" && report !== "ready"
      ? REPORT_PROBLEMS[report]
      : undefined;
  return (
    <>
      <Breadcrumb href="/runs" root="Run activity">
        {run?.issuer_name || "Run"}
      </Breadcrumb>
      <PageHeader
        title={run?.issuer_name || "Run"}
        badges={
          run && (
            <>
              <span role="status">
                <StatusBadge set="Run states" state={WORDS[run.status]} live={live} />
              </span>
              <Badge color="brand">{pathwayName(run.pathway)}</Badge>
              {mode === "synthetic" && <Badge color="gray">Synthetic test</Badge>}
              {run.as_of && (
                <Badge color="gray">
                  <span>
                    As of <time dateTime={run.as_of}>{asOfDate(run.as_of)}</time>
                  </span>
                </Badge>
              )}
            </>
          )
        }
        actions={
          <>
            {report === "ready" && (
              <Button href={`/report/${encodeURIComponent(id)}`}>Open report</Button>
            )}
            {(restartable || report === "ready" || report === "absent") && (
              <Button color="secondary" href={`/start?from=${encodeURIComponent(id)}`}>
                Start from this run
              </Button>
            )}
          </>
        }
      />
      {(restartable || report === "ready" || report === "absent") && (
        <p className="mt-3 text-sm text-text-secondary">
          Start from this run opens a new run with its own cap. The earlier run stays as it is.
        </p>
      )}
      {runProblem && (
        <div className="mt-6">
          <Alert
            tone={runProblem.tone}
            title={runProblem.title}
            action={
              problem === "missing" ? (
                <TextLink href="/runs">Back to Run activity</TextLink>
              ) : (
                <Button size="sm" color="secondary" onPress={tryAgain}>
                  Try again
                </Button>
              )
            }
          >
            {runProblem.text}
          </Alert>
        </div>
      )}
      {run ? (
        <section aria-label="Run activity" className="mt-6 grid gap-6">
          {run.reason && (
            <Alert
              tone={run.status === "capped" ? "warning" : "error"}
              title="Why this run ended without a report"
            >
              {serviceText(run.reason)}
            </Alert>
          )}
          {live && run.held_reason && (
            <Alert tone="warning" title="Held by the service">
              {serviceText(run.held_reason)}
            </Alert>
          )}
          {run.status === "queued" && !run.held_reason && !run.reason && (
            <p className="text-sm text-text-secondary">
              Waiting for an available run slot. It starts when the service can accept it.
            </p>
          )}
          {run.stalled && (
            <p className="text-sm text-text-secondary">
              No activity has been recorded in the last hour.
            </p>
          )}
          {run.status === "finished" && report === "pending" && (
            <p role="status" className="text-sm text-text-secondary">
              Waiting for the report to become available…
            </p>
          )}
          {reportProblem && (
            <Alert
              tone={reportProblem.tone}
              title={reportProblem.title}
              action={
                <Button size="sm" color="secondary" onPress={checkAgain}>
                  Check again
                </Button>
              }
            >
              {reportProblem.text}
            </Alert>
          )}
          <Summary
            spendCaption="Cap usage"
            run={{
              spend: spendFigure(run),
              finished: finishedFigure(run),
              elapsed: elapsedFigure(run),
            }}
          />
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
            <Card title="Modules and report delivery">
              <ModuleSteps live={live} steps={moduleSteps(run, live, notAssessable)} />
            </Card>
            <Card title="Activity">
              {run.events === null && (
                <p className="pb-3 text-sm text-text-secondary">The activity log is unavailable.</p>
              )}
              {lines.length > 0 ? (
                <Feed lines={lines} live={live} />
              ) : (
                run.events !== null && (
                  <p className="text-sm text-text-secondary">No activity recorded yet.</p>
                )
              )}
            </Card>
          </div>
        </section>
      ) : (
        !problem && (
          <div role="status" aria-label="Loading run progress" className="mt-6 grid gap-6">
            <Skeleton lines={2} />
            <div className="grid gap-6 xl:grid-cols-2">
              {[0, 1].map((key) => (
                <Card key={key}>
                  <Skeleton lines={7} />
                </Card>
              ))}
            </div>
          </div>
        )
      )}
    </>
  );
}
