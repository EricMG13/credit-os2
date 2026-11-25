import { useCallback } from "react";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import {
  getRun,
  moduleName,
  serviceText,
  type Mode,
  type ReadinessItem,
  type ConnectedRun as Run,
} from "../api";
import { card, heading } from "../layout";
import { PublishedTable } from "../ReportContent";
import { publishedHref, type OutputEntry, type PublishedRun } from "../publishedReport";
import { elapsedFigure, spendFigure, stamp } from "../runFigures";
import { useResource } from "../useResource";

const EXECUTION: Record<NonNullable<Run["execution"]>, string> = {
  synthetic: "Synthetic test",
  "live-provider": "Live provider",
  "host-session": "Host session",
  "retained-response-replay": "Retained response replay",
};
const SUMMARY_OUTCOME: Record<string, string> = {
  will_refuse: "Will refuse",
  gap: "Gap",
  limited: "Limited",
  check: "Check",
};

type RecordModule = {
  steps: NonNullable<PublishedRun["record"]>["steps"];
  calls: PublishedRun["evidence"]["record"]["calls"];
  instructions: PublishedRun["evidence"]["record"]["instructions"];
  issues: OutputEntry[];
};

function moduleGroups(run: PublishedRun, entries: OutputEntry[]) {
  const groups = new Map<string, RecordModule>();
  const groupFor = (id: string) => {
    const existing = groups.get(id);
    if (existing) return existing;
    const group: RecordModule = { steps: [], calls: [], instructions: [], issues: [] };
    groups.set(id, group);
    return group;
  };
  for (const step of run.record?.steps ?? []) groupFor(step.module).steps.push(step);
  for (const call of run.evidence.record.calls) groupFor(call.module ?? "").calls.push(call);
  for (const item of run.evidence.record.instructions)
    groupFor(item.module).instructions.push(item);
  for (const entry of entries) {
    if (entry.output.parseError || entry.output.issue)
      groupFor(entry.output.module).issues.push(entry);
  }
  return groups;
}

/**
 * The run record's delivery events, in words; the record holds no library-admission state. A log
 * the service could not read (`events: null`) is not a log without a delivery.
 */
function deliveryFigure(run: Run) {
  const events = run.events;
  if (events === null) return "The run's event log could not be read.";
  const delivered = events.find(({ kind }) => kind === "delivered");
  if (delivered) return `Report delivered ${stamp(delivered.at)}`;
  const started = events.find(({ kind }) => kind === "delivery_started");
  if (started) return `Report delivery started ${stamp(started.at)}; not finished`;
  return "No delivery recorded";
}

function ResponseProvenance({ value, pathway }: { value?: Run; pathway?: string | null }) {
  const outputs = value?.module_outputs;
  return (
    <section aria-label="Response provenance" className="grid gap-3">
      <h4 className="font-semibold">Response provenance</h4>
      {outputs == null ? (
        <p className="text-sm text-text-secondary">
          Original execution provenance is not recorded in this run record.
        </p>
      ) : outputs.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No current accepted module responses are recorded.
        </p>
      ) : (
        <ul className="divide-y divide-border-hairline">
          {outputs.map((output) => (
            <li key={output.module} className="grid gap-1 py-3">
              <span className="font-semibold">{moduleName(output.module, pathway)}</span>
              <span>
                {output.provenance === "retained-response"
                  ? "Reused retained response"
                  : output.provenance === "new-response"
                    ? "Response recorded for this run"
                    : "Response provenance unavailable"}
              </span>
              {output.response_sha256 ? (
                <span className="font-mono text-sm wrap-anywhere">{output.response_sha256}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RunTotals({
  value,
  mode,
  cap,
  pending,
}: {
  value?: Run;
  mode: Mode;
  cap: string | number | null;
  pending: boolean;
}) {
  const elapsed = value && elapsedFigure(value);
  const spend = value && spendFigure(value);
  const runType = value?.execution
    ? EXECUTION[value.execution]
    : pending && mode === "synthetic"
      ? EXECUTION.synthetic
      : null;
  const missing = pending ? "Loading…" : "Unavailable";
  return (
    <dl className="grid gap-5 rounded-ds-md bg-surface-subtle p-5 sm:grid-cols-3">
      <RunTypeItem value={runType} missing={missing} />
      <ElapsedItem elapsed={elapsed} missing={missing} />
      <DeliveryItem value={value} missing={missing} />
      <CapUsageItem spend={spend} missing={missing} cap={cap} />
    </dl>
  );
}

function RunTypeItem({ value, missing }: { value: string | null; missing: string }) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-sm text-text-tertiary">Run type</dt>
      <dd className="font-semibold">{value || missing}</dd>
    </div>
  );
}

function ElapsedItem({
  elapsed,
  missing,
}: {
  elapsed: ReturnType<typeof elapsedFigure> | null | undefined;
  missing: string;
}) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-sm text-text-tertiary">Elapsed</dt>
      <dd className="font-semibold tabular-nums">{elapsed?.value ?? missing}</dd>
      {elapsed && <dd className="text-sm text-text-tertiary">{elapsed.note}</dd>}
    </div>
  );
}

function DeliveryItem({ value, missing }: { value?: Run; missing: string }) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-sm text-text-tertiary">Delivery</dt>
      <dd className="font-semibold">{value ? deliveryFigure(value) : missing}</dd>
    </div>
  );
}

function CapUsageItem({
  spend,
  missing,
  cap,
}: {
  spend: ReturnType<typeof spendFigure> | null | undefined;
  missing: string;
  cap: string | number | null;
}) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-sm text-text-tertiary">Cap usage</dt>
      <dd className="font-semibold tabular-nums">{spend?.value ?? missing}</dd>
      <dd>
        {spend?.bar ? (
          <ProgressBar {...spend.bar} labelBelow />
        ) : (
          <span className="text-sm text-text-tertiary">
            {spend?.note ??
              (cap === null ? "Recorded cap unavailable" : `Recorded cap USD ${String(cap)}`)}
          </span>
        )}
      </dd>
    </div>
  );
}

function ModuleRecord({
  group,
  folder,
  name,
  synthetic,
}: {
  group: RecordModule;
  folder: string;
  name: string;
  synthetic: boolean | null;
}) {
  const callsTitle =
    synthetic === null
      ? "Recorded responses"
      : synthetic
        ? "Synthetic adapter responses"
        : "Model calls";
  const statusTitle =
    synthetic === null ? "Recorded status" : synthetic ? "Adapter status" : "HTTP status";
  return (
    <div className="mt-3 grid min-w-0 gap-4">
      {group.steps.length > 0 && (
        <section className="grid gap-2">
          <h4 className="font-semibold">Started and accepted</h4>
          <PublishedTable
            evidence
            emptyLabel="Not recorded for this module"
            table={{
              type: "table",
              line: 0,
              headers: ["Started (UTC)", "Accepted (UTC)"],
              rows: group.steps.map((step, line) => ({
                line,
                cells: [step.started || "", step.accepted || ""],
              })),
            }}
          />
        </section>
      )}
      {group.calls.length > 0 && (
        <section className="grid gap-2">
          <h4 className="font-semibold">{callsTitle}</h4>
          <PublishedTable
            evidence
            heading={`${name}: ${callsTitle}`}
            emptyLabel="Not recorded for this call"
            table={{
              type: "table",
              line: 0,
              headers: ["Attempt", "Started (UTC)", statusTitle, "Error class", "Settled USD"],
              rows: group.calls.map((call, line) => ({
                line,
                cells: [
                  call.attempt?.toString() ?? "",
                  call.started ?? "",
                  call.http_status?.toString() ?? "",
                  call.error_class ?? "",
                  call.settled_usd ?? "",
                ],
              })),
            }}
          />
        </section>
      )}
      {group.instructions.map((item) => {
        const href = publishedHref(item.href, folder);
        return (
          href && (
            <Button key={href} href={href} download size="sm" color="secondary" className="w-fit">
              Download instructions
            </Button>
          )
        );
      })}
      {group.issues.map(({ output }) => (
        <div key={output.id} className="grid gap-1 text-sm text-text-secondary wrap-anywhere">
          <h4 className="font-semibold">{name} · Handoff issues</h4>
          {output.parseError && <p>{output.parseError}</p>}
          {output.issue?.split("; ").map((issue, i) => (
            <p key={i}>{issue}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ReportRecord({
  run,
  entries,
  module,
  mode,
}: {
  run: PublishedRun;
  entries: OutputEntry[];
  module?: string;
  mode: Mode;
}) {
  const load = useCallback((signal: AbortSignal) => getRun(run.folder, signal), [run.folder]);
  const { value, error } = useResource(load);
  const groups = [...moduleGroups(run, entries)].filter(([id]) => !module || id === module);
  const synthetic = value?.execution
    ? value.execution === "synthetic"
    : value || error
      ? null
      : mode === "synthetic";
  const recorded: (Run & { approved_summary_limits?: ReadinessItem[] | null }) | undefined = value;
  const approvedLimits = recorded?.approved_summary_limits;
  return (
    <div className="grid min-w-0 gap-5">
      <RunRecordSummary run={run} value={value} error={error} mode={mode} />
      <ApprovedSummaryLimits value={value} error={error} limits={approvedLimits} />
      <ModuleRecords groups={groups} run={run} synthetic={synthetic} module={module} />
      <RecordedHashes run={run} />
    </div>
  );
}

function RunRecordSummary({
  run,
  value,
  error,
  mode,
}: {
  run: PublishedRun;
  value?: Run;
  error?: string;
  mode: Mode;
}) {
  const admission =
    value?.library_admission === "listed"
      ? "This run is listed in the current library."
      : value?.library_admission === "not-listed"
        ? "This run is not listed in the current library."
        : "Library admission is not recorded in this run record.";
  return (
    <section className={card}>
      <h3 className={heading}>Run record</h3>
      <p className="font-mono text-sm wrap-anywhere">{run.folder}</p>
      {run.changes?.note && (
        <p className="text-sm wrap-anywhere">
          <span className="text-text-tertiary">Comparison note: </span>
          {run.changes.note}
        </p>
      )}
      {run.changes?.problem && (
        <p className="text-sm wrap-anywhere">
          <span className="text-text-tertiary">Comparison problem: </span>
          {run.changes.problem}
        </p>
      )}
      <RunTotals
        value={value}
        mode={mode}
        cap={run.evidence.record.cap}
        pending={!value && !error}
      />
      {error && (
        <p role="alert" className="text-sm text-text-secondary">
          {error}
        </p>
      )}
      <p className="text-sm text-text-secondary">{admission}</p>
      <ResponseProvenance value={value} pathway={run.pathway} />
    </section>
  );
}

function ApprovedSummaryLimits({
  value,
  error,
  limits,
}: {
  value?: Run;
  error?: string;
  limits?: ReadinessItem[] | null;
}) {
  return (
    <section className={card}>
      <h3 className={heading}>Approved summary limits</h3>
      {!value && !error ? (
        <p className="text-text-secondary">Loading the approved summary limits…</p>
      ) : limits == null ? (
        <p className="text-text-secondary">
          Approved summary limits were not recorded for this run.
        </p>
      ) : limits.length === 0 ? (
        <p className="text-text-secondary">
          The approved summary recorded no limits requiring a decision.
        </p>
      ) : (
        <ul className="divide-y divide-border-hairline">
          {limits.map((item, index) => (
            <li key={`${item.id}-${String(index)}`} className="grid gap-2 py-3">
              <h4 className="font-semibold">
                {item.scope === "run" ? "Run" : serviceText(item.scope)}
              </h4>
              <Badge>{SUMMARY_OUTCOME[item.outcome] ?? item.outcome}</Badge>
              <p className="text-text-secondary">{serviceText(item.reason)}</p>
              {item.fix && <p className="text-sm text-text-secondary">{serviceText(item.fix)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ModuleRecords({
  groups,
  run,
  synthetic,
  module,
}: {
  groups: Array<[string, RecordModule]>;
  run: PublishedRun;
  synthetic: boolean | null;
  module?: string;
}) {
  return (
    <section className={card}>
      <h3 className={heading}>Module records</h3>
      {synthetic && (
        <p className="text-sm text-text-secondary">
          The synthetic adapter returned these responses without contacting a provider.
        </p>
      )}
      {groups.length === 0 && (
        <p className="text-sm text-text-secondary">
          No module record is available for this selection.
        </p>
      )}
      {groups.map(([id, group]) => (
        <details
          key={id}
          open={module ? true : undefined}
          className="min-w-0 border-t border-border-hairline py-4"
        >
          <summary className="cursor-pointer font-semibold">
            {id ? moduleName(id, run.pathway) : "Unassigned calls"}
            {group.calls.length > 0 && (
              <span className="ml-2 text-sm font-normal text-text-tertiary">
                {group.calls.length} {group.calls.length === 1 ? "response" : "responses"}
              </span>
            )}
          </summary>
          <ModuleRecord
            group={group}
            folder={run.folder}
            name={id ? moduleName(id, run.pathway) : "Unassigned calls"}
            synthetic={synthetic}
          />
        </details>
      ))}
    </section>
  );
}

function RecordedHashes({ run }: { run: PublishedRun }) {
  return (
    <section className={card}>
      <details>
        <summary className="cursor-pointer font-semibold">Recorded file hashes</summary>
        {run.evidence.record.hashes.length === 0 && (
          <p className="mt-2">No file hashes were recorded.</p>
        )}
        {run.evidence.record.hashes.map((item) => (
          <p key={item.name} className="mt-2 grid gap-1 text-sm wrap-anywhere">
            {item.name}
            <code className="text-text-tertiary">{item.sha256}</code>
          </p>
        ))}
      </details>
    </section>
  );
}
