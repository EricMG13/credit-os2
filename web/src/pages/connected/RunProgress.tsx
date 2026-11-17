import { useEffect, useState } from "react";
import { Alert } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { Card } from "@/components/card/Card";
import { StatusBadge } from "@/components/status/StatusBadge";
import { PageHeader } from "../../shell/PageHeader";
import { ModuleSteps } from "../run/activity/ModuleSteps";
import { Feed } from "../run/activity/Feed";
import { Summary } from "../run/activity/Summary";
import {
  getReport,
  getRun,
  isPendingReport,
  moduleName,
  pathwayName,
  RequestError,
  type Mode,
  type Run,
  type RunStatus,
} from "./api";
import { Breadcrumb, ErrorNotice } from "./layout";
import { elapsedFigure, feedLines, finishedFigure, moduleWord, spendFigure } from "./runFigures";
import { errorText } from "./useResource";

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

export function RunProgress({ id, mode }: { id: string; mode: Mode }) {
  const [run, setRun] = useState<Run>();
  const [error, setError] = useState("");
  const [reportReady, setReportReady] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancelled = () => signal.aborted;
    function schedule() {
      if (!cancelled())
        timer = setTimeout(() => {
          void poll();
        }, 2000);
    }
    async function poll() {
      try {
        const next = await getRun(id, signal);
        if (cancelled()) return;
        setRun(next);
        setError("");
        if (next.status === "queued" || next.status === "running") {
          schedule();
        } else if (next.status === "finished") {
          try {
            await getReport(id, signal);
            if (!cancelled()) setReportReady(true);
          } catch (failure) {
            if (cancelled()) return;
            if (!isPendingReport(failure)) setError(errorText(failure));
            schedule();
          }
        }
      } catch (failure) {
        if (cancelled()) return;
        setError(errorText(failure));
        if (!(failure instanceof RequestError && failure.status === 404)) schedule();
      }
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id]);

  const restartable = run && RESTARTABLE.includes(run.status);
  const live = run?.status === "queued" || run?.status === "running";
  const lines = run ? feedLines(run) : [];
  return (
    <>
      <Breadcrumb href="/runs" root="Run activity">
        {run?.issuer_name || "Run"}
      </Breadcrumb>
      <PageHeader
        title={run?.issuer_name || "Run activity"}
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
                    As of <time dateTime={run.as_of}>{run.as_of}</time>
                  </span>
                </Badge>
              )}
            </>
          )
        }
        actions={
          <>
            {reportReady && <Button href={`/report/${encodeURIComponent(id)}`}>Open report</Button>}
            {(restartable || reportReady) && (
              <Button color="secondary" href={`/start?from=${encodeURIComponent(id)}`}>
                Start from this run
              </Button>
            )}
          </>
        }
      />
      {error && (
        <div className="mt-6">
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}
      {run ? (
        <section aria-label="Run activity" className="mt-6 grid gap-6">
          {run.reason && <ErrorNotice>{run.reason}</ErrorNotice>}
          {live && run.held_reason && (
            <Alert tone="warning" title="Held by the service">
              {run.held_reason}
            </Alert>
          )}
          {run.stalled && (
            <p className="text-sm text-text-secondary">
              No activity has been recorded in the last hour.
            </p>
          )}
          {run.status === "finished" && !reportReady && (
            <p role="status" className="text-sm text-text-secondary">
              Waiting for the report to become available…
            </p>
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
            <Card title="Modules">
              <ModuleSteps
                live={live}
                steps={run.modules.map(([code, state]) => ({
                  kind: "module",
                  name: moduleName(code),
                  state: moduleWord(state, live),
                  detail: null,
                }))}
              />
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
        !error && (
          <p role="status" className="mt-6 text-text-secondary">
            Loading run activity…
          </p>
        )
      )}
    </>
  );
}
