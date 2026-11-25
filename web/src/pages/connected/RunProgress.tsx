import { useEffect, useState } from "react";
import { Alert } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { Pipeline, PipelineKey } from "@/components/pipeline";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Skeleton } from "@/components/gap/Skeleton";
import { PageHeader } from "../../shell/PageHeader";
import { Feed } from "../run/activity/Feed";
import { TextLink } from "../run/TextLink";
import {
  getReport,
  getRun,
  isPendingReport,
  moduleName,
  pathwayName,
  RequestError,
  serviceText,
  type Mode,
  type ConnectedRun,
  type RunStatus,
} from "./api";
import { Breadcrumb } from "./layout";
import { Bento, Figure, GapNote, Tile, Well } from "./report/overview/Tile";
import {
  HEADER_BLOCK,
  HEADER_GRID,
  ElapsedLine,
  pipelineStages,
  SPEND_BLOCK,
  SpendBlock,
  stoppedAt,
} from "./runProgressParts";
import { Meter } from "./runMeter";
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
    text: "This page retries automatically. You can also retry now.",
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
    text: "Check that the Credit OS service is running, then check for the report again.",
  },
  failed: {
    tone: "error",
    title: "The report could not be loaded",
    text: "Check for the report again.",
  },
} as const;

export function RunProgress({ id, mode }: { id: string; mode: Mode }) {
  const [run, setRun] = useState<ConnectedRun>();
  useEffect(() => {
    document.title = `${run?.issuer_name || "Run progress"}${run?.issuer_name ? " run" : ""} — Credit OS`;
  }, [run?.issuer_name]);
  // Reading the run and reading its report fail apart, so one poll never clears the other's
  // alert: an alert that is removed and inserted again is announced again.
  const [problem, setProblem] = useState<Problem>();
  const [report, setReport] = useState<ReportState>("pending");
  const [notAssessable, setNotAssessable] = useState<string[]>([]);
  // Counts of presses of "Try again" (the run) and "Check for report" (the report); each restarts the poll.
  const [retries, setRetries] = useState(0);
  const [rechecks, setRechecks] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Pressing "Check for report" asks once and is answered at once; only the first look waits.
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
        if (!cancelled())
          setNotAssessable((current) => [
            ...new Set([...current, ...(publication.not_assessable ?? [])]),
          ]);
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
        setNotAssessable(
          (next.module_outputs ?? [])
            .filter((output) => output.assessment === "not-assessable")
            .map((output) => output.module),
        );
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
  const steps = run ? moduleSteps(run, live, notAssessable) : [];
  const assessmentGaps =
    run?.modules
      .filter(
        ([code, state]) =>
          code !== "Report" &&
          state === "done" &&
          !notAssessable.includes(code) &&
          !(run.module_outputs ?? []).some(
            (output) => output.module === code && output.assessment !== null,
          ),
      )
      .map(([code]) => moduleName(code, run.pathway)) ?? [];
  const runProblem = problem && RUN_PROBLEMS[problem];
  const reportProblem =
    run?.status === "finished" && report !== "pending" && report !== "ready"
      ? REPORT_PROBLEMS[report]
      : undefined;
  const mayRestart = restartable || report === "ready" || report === "absent";
  const restartNote = (
    <span id="run-restart-note">
      Review the inputs in a new draft. The new run has its own spending cap.
    </span>
  );
  const stopped = restartable ? stoppedAt(steps) : undefined;
  const finished = run ? finishedFigure(run) : undefined;
  const stages = run ? pipelineStages(run.modules, steps) : [];
  return (
    <>
      <Breadcrumb href="/runs" root="Run activity">
        {run?.issuer_name || "Run"}
      </Breadcrumb>
      <PageHeader
        title={run?.issuer_name || "Run"}
        badges={
          <>
            {run && (
              <>
                <span role="status">
                  <StatusBadge set="Run states" state={WORDS[run.status]} />
                </span>
                <Badge color="brand">{pathwayName(run.pathway)}</Badge>
              </>
            )}
            {mode === "synthetic" && <Badge color="gray">Synthetic test</Badge>}
            {run?.as_of && (
              <Badge color="gray">
                <span>
                  As of{" "}
                  <time className="tabular-nums" dateTime={run.as_of}>
                    {asOfDate(run.as_of)}
                  </time>
                </span>
              </Badge>
            )}
          </>
        }
        actions={
          <>
            {report === "ready" && (
              <Button href={`/report/${encodeURIComponent(id)}`} className="max-md:min-h-11">
                Open report
              </Button>
            )}
            {mayRestart && !restartable && (
              <Button
                color="secondary"
                href={`/start?from=${encodeURIComponent(id)}`}
                aria-describedby="run-restart-note"
                className="max-md:min-h-11"
              >
                Use this run’s inputs
              </Button>
            )}
          </>
        }
      />
      {mayRestart && !restartable && (
        <p className="reading-copy mt-3 text-body text-text-secondary">{restartNote}</p>
      )}
      {runProblem && (
        <div className="mt-4">
          <Alert
            tone={runProblem.tone}
            title={runProblem.title}
            action={
              problem === "missing" ? (
                <TextLink href="/runs" className="min-h-8 items-center max-[480px]:min-h-11">
                  Back to Run activity
                </TextLink>
              ) : (
                <Button size="sm" color="secondary" onPress={tryAgain} className="max-md:min-h-11">
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
        <section aria-label="Run activity" className="mt-3 grid gap-3">
          {stopped ? (
            <Alert
              tone={run.status === "capped" ? "warning" : "error"}
              title="Why this run ended without a report"
            >
              <p className="wrap-anywhere">
                <span>{`Run ${run.status}.`}</span>{" "}
                <span>
                  {run.reason ? serviceText(run.reason) : "The run record gives no reason."}
                </span>{" "}
                <span>
                  {stopped.names.length > 0
                    ? `Where it stopped: ${stopped.names.join(", ")}.${stopped.detail ? ` ${stopped.detail}` : ""}`
                    : "Where it stopped: the run record does not say."}
                </span>{" "}
                {restartNote}{" "}
                <Button
                  size="sm"
                  color="secondary"
                  href={`/start?from=${encodeURIComponent(id)}`}
                  aria-describedby="run-restart-note"
                  className="ml-1 align-middle max-md:min-h-11"
                >
                  Use this run’s inputs
                </Button>
              </p>
            </Alert>
          ) : (
            run.reason && (
              <Alert tone="error" title="Why this run ended without a report">
                <span className="wrap-anywhere">{serviceText(run.reason)}</span>
              </Alert>
            )
          )}
          {live && run.held_reason && (
            <Alert tone="warning" title="Held by the service">
              <span className="wrap-anywhere">{serviceText(run.held_reason)}</span>
            </Alert>
          )}
          {run.status === "queued" && !run.held_reason && !run.reason && (
            <p className="reading-copy text-body text-text-secondary">
              Waiting for an available run slot.
            </p>
          )}
          {run.stalled && (
            <p className="reading-copy text-body text-text-secondary">
              No activity has been recorded in the last hour.
            </p>
          )}
          {run.status === "finished" && report === "pending" && (
            <p role="status" className="reading-copy text-body text-text-secondary">
              Waiting for the report to become available…
            </p>
          )}
          {reportProblem && (
            <Alert
              tone={reportProblem.tone}
              title={reportProblem.title}
              action={
                <Button
                  size="sm"
                  color="secondary"
                  onPress={checkAgain}
                  className="max-md:min-h-11"
                >
                  Check for report
                </Button>
              }
            >
              {reportProblem.text}
            </Alert>
          )}
          <Bento>
            <Tile span={12} label="Pipeline" className="gap-2 p-3 sm:p-4">
              <div className={HEADER_GRID}>
                <SpendBlock spend={spendFigure(run)} />
                <div className={HEADER_BLOCK}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="text-h4 font-medium text-text-primary">Module pipeline</h2>
                    <PipelineKey stages={stages} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {finished?.bar ? (
                      <div className="flex min-w-[16rem] flex-1 items-center gap-3">
                        <Meter
                          value={finished.bar.value}
                          max={finished.bar.max}
                          name="Modules finished"
                          valueText={finished.bar.label}
                        />
                        <Figure className="flex-none text-small">{finished.bar.label}</Figure>
                      </div>
                    ) : (
                      <p className="text-small text-text-tertiary">{finished?.note}</p>
                    )}
                    <ElapsedLine elapsed={elapsedFigure(run)} />
                  </div>
                  {assessmentGaps.length > 0 && (
                    <p className="text-caption text-text-secondary">
                      No assessment status is recorded for {assessmentGaps.join(", ")}.
                    </p>
                  )}
                </div>
              </div>
              {stages.length > 0 && (
                <Well className="border border-border-hairline p-1.5">
                  <Pipeline
                    label="Modules in this run"
                    stages={stages}
                    flow={live ? "running" : "none"}
                    legend={false}
                  />
                </Well>
              )}
            </Tile>
            <Tile span={12} label="Activity" className="gap-2 p-3 sm:p-4">
              <h2 className="text-h4 font-medium text-text-primary">What just happened</h2>
              {run.events === null && (
                <p className="text-small text-text-secondary">The activity log is unavailable.</p>
              )}
              {lines.length > 0 ? (
                <Feed lines={lines} columns />
              ) : (
                run.events !== null && (
                  <p className="text-small text-text-secondary">No activity recorded yet.</p>
                )
              )}
            </Tile>
          </Bento>
        </section>
      ) : (
        <div
          role="status"
          aria-label={problem ? "Run progress unknown" : "Loading run progress"}
          className="mt-4"
        >
          <Bento>
            <Tile span={12} label="Pipeline, loading" className="gap-2 p-3 sm:p-4">
              <div className={HEADER_GRID}>
                <section aria-label="Spend, loading" className={SPEND_BLOCK}>
                  <Well className="border border-border-hairline p-3">
                    {problem ? <GapNote>Spend is not known.</GapNote> : <Skeleton lines={3} />}
                  </Well>
                </section>
                <div className={HEADER_BLOCK}>
                  <Skeleton lines={2} />
                </div>
              </div>
              <Well className="border border-border-hairline p-3">
                {problem ? (
                  <GapNote>Progress is not known while this run cannot be read.</GapNote>
                ) : (
                  <Skeleton lines={7} />
                )}
              </Well>
            </Tile>
            <Tile span={12} label="Activity, loading" className="gap-2 p-3 sm:p-4">
              {problem ? <GapNote>No activity is known.</GapNote> : <Skeleton lines={3} />}
            </Tile>
          </Bento>
        </div>
      )}
    </>
  );
}
