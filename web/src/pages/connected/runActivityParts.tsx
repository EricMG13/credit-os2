import type { ReactNode } from "react";
import { Badge } from "@/components/base/badges/badges";
import { StatusBadge } from "@/components/status/StatusBadge";
import { StatusShape } from "@/components/status/shapes";
import { TextLink } from "../run/TextLink";
import {
  moduleName,
  pathwayName,
  serviceText,
  type ConnectedModuleState,
  type EndedRun,
  type LiveRun,
} from "./api";
import { Figure, Tile } from "./report/overview/Tile";
import { finishedFigure, stamp } from "./runFigures";
import { Meter } from "./runMeter";

const ENDED = {
  failed: "Failed",
  capped: "Capped",
  rejected: "Rejected",
  interrupted: "Interrupted",
} as const satisfies Record<EndedRun["status"], string>;

const ROW =
  "grid min-w-0 gap-x-4 gap-y-2 border-t border-border-hairline py-3 first:border-t-0 first:pt-0 last:pb-0";

export const runPath = (run: { id: string }) => `/run/${encodeURIComponent(run.id)}`;
const fileCount = (run: LiveRun) =>
  run.files > 0 && `${String(run.files)} source file${run.files === 1 ? "" : "s"}`;
const texts = (...parts: (string | false)[]) =>
  parts.filter((part): part is string => Boolean(part));
/** Why a run is not moving, and the name warning: the row and the waiting row both say them. */
const notes = (run: LiveRun) =>
  texts(serviceText(run.reason), run.name_differs && "Issuer name differs from earlier runs");

/** The only way into a run: 32px tall, 44px on a phone, and a name that breaks only between words. */
function RunIssuerLink({ run }: { run: Pick<LiveRun, "id" | "issuer_name"> }) {
  return (
    <TextLink
      href={runPath(run)}
      className="min-h-8 items-center whitespace-normal wrap-break-word max-[480px]:min-h-11"
    >
      {run.issuer_name || "Issuer not named"}
    </TextLink>
  );
}

/** A group of runs: one tile with its count in the heading and the rows as a list. */
export function RunGroup({
  title,
  group,
  count,
  intro,
  children,
}: {
  title: string;
  group: LiveRun["status"] | "ended";
  count: number;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-run-group={group} className="min-w-0">
      <Tile span={12} label={title}>
        <h2 className="flex items-baseline gap-2 text-h4 font-medium text-text-primary">
          {title}
          <Figure className="text-small text-text-tertiary">{String(count)}</Figure>
        </h2>
        {intro}
        <ul>{children}</ul>
      </Tile>
    </div>
  );
}

/** Every module the run is on now, as its record states it; the report's own row is its delivery. */
function nowRunning(run: LiveRun) {
  const names = run.modules
    .filter(([, state]: [string, ConnectedModuleState]) => state === "running")
    .map(([code]) => (code === "Report" ? "Report delivery" : moduleName(code)));
  return names.length === 0 ? null : names.join(", ");
}

/** A run in flight as one compact row: who, what state, how far, and where it is now. */
export function RunningRow({ run }: { run: LiveRun }) {
  const { bar } = finishedFigure(run);
  const now = nowRunning(run);
  const line = texts(
    run.submitted_by && `submitted by ${run.submitted_by}`,
    run.started_at && `started ${stamp(run.started_at)}`,
  ).join(" · ");
  const foot = texts(fileCount(run), ...notes(run));
  return (
    <li
      className={`${ROW} md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.3fr)] md:items-center`}
    >
      <div className="min-w-0">
        <h3 className="text-body font-medium text-balance">
          <RunIssuerLink run={run} />
        </h3>
        {line && <p className="text-caption text-text-tertiary tabular-nums">{line}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="gray">{pathwayName(run.pathway)}</Badge>
        <StatusBadge set="Run states" state="Running" live />
        {run.stalled && (
          <Badge color="warning" className="gap-1.5 pl-2" icon={<StatusShape shape="triangle" />}>
            No activity in the last hour
          </Badge>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        {bar ? (
          <div className="flex items-center gap-3">
            <span className="flex-none whitespace-nowrap">
              <Figure className="text-body font-medium">{`${String(bar.value)} of ${String(bar.max)}`}</Figure>
              <span className="text-small text-text-tertiary"> modules</span>
            </span>
            <Meter value={bar.value} max={bar.max} name={bar.label} className="flex-1" />
          </div>
        ) : (
          <span className="gap-hatch w-fit rounded-ds-sm border border-dashed border-border-gap px-2 py-1 text-small text-gap-text">
            No analytical modules listed
          </span>
        )}
        {now && <p className="text-small text-text-secondary">{`Now: ${now}`}</p>}
      </div>
      {foot.length > 0 && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-small text-text-secondary md:col-span-3">
          {foot.map((text) => (
            <span key={text} className="min-w-0 wrap-anywhere">
              {text}
            </span>
          ))}
        </p>
      )}
    </li>
  );
}

/** A run waiting for a slot: who, what pathway, and why it waits. */
export function WaitingRow({ run, held }: { run: LiveRun; held: string }) {
  const lines = texts(
    texts(run.submitted_by && `submitted by ${run.submitted_by}`, fileCount(run)).join(" · "),
    // The list states the service's held reason once, above its rows: a row repeats only its own.
    ...notes(run).filter((note) => !held || note !== serviceText(held)),
    !run.reason && !held && "Waiting for an available run slot.",
  );
  return (
    <li className={`${ROW} md:grid-cols-[minmax(0,1.5fr)_minmax(0,2.3fr)] md:items-center`}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <RunIssuerLink run={run} />
        <Badge color="gray">{pathwayName(run.pathway)}</Badge>
      </div>
      <div className="grid gap-0.5">
        {lines.map((text) => (
          <span key={text} className="text-small text-text-secondary wrap-anywhere">
            {text}
          </span>
        ))}
      </div>
    </li>
  );
}

/** A run that stopped without a report: its state, when, and the reason in words on the row. */
export function EndedRow({ run }: { run: EndedRun }) {
  return (
    <li className={`${ROW} md:grid-cols-[minmax(0,1.5fr)_minmax(0,3fr)] md:items-start`}>
      <div className="flex min-w-0 flex-col gap-1">
        <RunIssuerLink run={run} />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge set="Run states" state={ENDED[run.status]} />
          <Badge color="gray">{pathwayName(run.pathway)}</Badge>
          <span className="text-caption text-text-tertiary">
            {run.ended_at ? (
              <>
                Ended <time className="tabular-nums">{stamp(run.ended_at)}</time>
              </>
            ) : (
              "Ended: not recorded"
            )}
          </span>
        </div>
      </div>
      <p className="reading-copy text-small text-text-secondary wrap-anywhere">
        {serviceText(run.reason) || "The run record gives no reason."}
      </p>
    </li>
  );
}
