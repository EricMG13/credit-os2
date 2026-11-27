import { TextLink } from "../../run/TextLink";
import { moduleName } from "../api";
import {
  outputEntries,
  publishedRunForFolder,
  reportPath,
  runLabels,
  runPathway,
  type CatalogueRun,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import { buildReportView, moduleOrder } from "../reportView";
import { scopeLabel } from "../issuerEntry";
import { decisionActions, type Action } from "./frontPage";
import { asOfDate } from "../runFigures";
import { Bento, Tile } from "./overview/Tile";

function runDetails(snapshot: Snapshot, key: string, run: PublishedRun) {
  if (run.history)
    return {
      modules: run.history.modules.map((id) => moduleName(id, run.pathway)),
      labels: [
        ...(run.history.earlierFormat ? ["Earlier format"] : []),
        ...(run.history.earlierMethods ? ["Earlier methods"] : []),
      ],
    };
  if (!Object.hasOwn(run, "modules")) return null;
  const modules = moduleOrder(run).filter((id) => run.modules[id]?.outputs.length);
  return {
    modules: modules.map((id) => moduleName(id, run.pathway)),
    labels: runLabels(outputEntries(snapshot, run, key), run),
  };
}

type Details = ReturnType<typeof runDetails>;

/** How many modules ran, as the summary of the disclosure that names them. */
function modulesCount(count: number) {
  return `${String(count)} ${count === 1 ? "module" : "modules"} run`;
}

/** The modules a run ran: a count that opens to their names, so a row stays one glance long. */
function ModulesRun({ details }: { details: Details }) {
  if (!details)
    return <p className="text-small text-gap-text">The module list is unavailable for this run.</p>;
  const count = details.modules.length;
  if (count === 0) return <p className="text-small text-text-secondary">{modulesCount(0)}</p>;
  return (
    <details className="text-small text-text-secondary">
      <summary className="inline-flex min-h-8 cursor-pointer items-center rounded-ds-sm font-medium text-text-link focus-visible:ring-2 focus-visible:ring-focus max-[480px]:min-h-11">
        {modulesCount(count)}
      </summary>
      <p className="wrap-anywhere">{details.modules.join(", ")}</p>
    </details>
  );
}

const chip = "flex min-h-6 items-center rounded-ds-xs border px-2 text-caption font-medium";

const QUIET = `${chip} border-border-container font-normal text-text-secondary`;

/** A statement of what the row does not show: words, not a chip, so it does not read as a fact. */
const NOT_SHOWN = "text-caption text-gap-text";

type ModelCallStart = { started: string; time: number; instant: bigint; attempt: number | null };

const modelCallStart = (started: string | null, attempt: number | null): ModelCallStart | null => {
  if (
    !started ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(started)
  )
    return null;
  const time = Date.parse(started);
  if (!Number.isFinite(time)) return null;
  const fraction = /\.(\d+)/u.exec(started)?.[1] ?? "";
  const subMillisecond = BigInt(fraction.slice(3, 9).padEnd(6, "0"));
  return { started, time, instant: BigInt(time) * 1_000_000n + subMillisecond, attempt };
};

/** The earliest retained model-call receipt, not the run or module start time. */
function firstModelCallStart(record: {
  history?: PublishedRun["history"];
  evidence?: { record?: { calls?: PublishedRun["evidence"]["record"]["calls"] } };
}): ModelCallStart | null {
  const calls = record.evidence?.record?.calls ?? [];
  let earliest: ModelCallStart | null = null;
  for (const { started, attempt } of calls) {
    const candidate = modelCallStart(started, attempt);
    if (candidate && (!earliest || candidate.instant < earliest.instant)) earliest = candidate;
  }
  if (earliest) return earliest;
  const projected = record.history?.firstModelCall;
  return projected ? modelCallStart(projected.started, projected.attempt) : null;
}

function modelCallLabel(start: ModelCallStart) {
  const attempt = start.attempt === null ? "" : ` · attempt ${String(start.attempt)}`;
  const utc = new Date(start.time).toISOString();
  const fraction = /\.(\d+)/u.exec(start.started)?.[1];
  const exact = fraction
    ? utc.replace(/\.\d{3}Z$/u, `.${fraction}Z`)
    : utc.replace(/\.\d{3}Z$/u, "Z");
  const time = exact.replace("T", " ").replace(/Z$/u, " UTC");
  return `First model call${attempt} · ${time}`;
}

/**
 * The page holds a run's handoffs only for the opened run and its compared earlier run; every
 * other run arrives as a summary with no modules, whose stance the page cannot know.
 */
const held = (record: PublishedRun) => !record.history && Object.hasOwn(record, "modules");

/** A run's decisions as a summary page treats them; null when the page has only its summary. */
function runDecisions(snapshot: Snapshot, key: string, record: PublishedRun): Action[] | null {
  return held(record) ? decisionActions(buildReportView(snapshot, key, record), record) : null;
}

/** The scope every verified full run has; a row names its scope only where it is something else. */
const STANDARD_SCOPE = "Standard pathway scope";

const STATUS = { withheld: "Withheld", "not shown": "Not shown", unavailable: "Unavailable" };

/**
 * The run's decisions, never the decision itself: no run records a clearance for it. Each says
 * whether it is withheld or not shown; a run the page has only as a summary says so.
 */
function Decisions({ decisions }: { decisions: Action[] | null }) {
  if (decisions === null) return <span className={NOT_SHOWN}>Decision not in the run list</span>;
  return decisions.map(({ module, label, status }) => (
    <span key={module} className={NOT_SHOWN}>{`${label}: ${STATUS[status]}`}</span>
  ));
}

function Node({ current }: { current: boolean }) {
  const tone = current
    ? "border-action bg-surface-selected"
    : "border-text-disabled bg-surface-card";
  return (
    <span
      aria-hidden="true"
      className={`absolute top-1 -left-[7px] size-3 rounded-ds-full border-2 ${tone}`}
    />
  );
}

function RunRow({
  record,
  decisions,
  current,
  tie,
  callStart,
  catalogue,
  details,
}: {
  record: PublishedRun;
  decisions: Action[] | null;
  current: boolean;
  /** Another run has the same as-of date. */
  tie: boolean;
  callStart: ModelCallStart | null;
  catalogue: CatalogueRun | undefined;
  details: Details;
}) {
  const href = reportPath(record.folder);
  const scope = scopeLabel(record);
  return (
    <li className="relative flex min-w-0 flex-col gap-2 pb-6 pl-6 last:pb-0">
      <Node current={current} />
      <div className="flex flex-wrap items-center gap-2">
        {record.asOf ? (
          <span className="font-mono text-h4 text-text-primary tabular-nums">
            {asOfDate(record.asOf)}
          </span>
        ) : (
          <span className="text-h4 text-gap-text">As-of date not recorded</span>
        )}
        {current && (
          <span className={`${chip} border-action-subtle-hover bg-surface-selected text-text-link`}>
            This run
          </span>
        )}
        <span
          className={`${chip} border-border-hairline bg-surface-card font-normal text-text-secondary wrap-anywhere`}
        >
          {runPathway(record, catalogue) || "Credit report"}
        </span>
        {scope !== STANDARD_SCOPE && <span className={QUIET}>{scope}</span>}
        {tie && <span className={QUIET}>Same as-of date</span>}
        <span className={callStart ? QUIET : NOT_SHOWN}>
          {callStart ? modelCallLabel(callStart) : "First model-call time unavailable"}
        </span>
        {details?.labels.map((label) => (
          <span key={label} className={QUIET}>
            {label}
          </span>
        ))}
      </div>
      {decisions?.length !== 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Decisions decisions={decisions} />
        </div>
      )}
      <ModulesRun details={details} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <TextLink
          className="inline-flex min-h-8 items-center text-small max-[480px]:min-h-11"
          href={`${href}#overview`}
        >
          Open overview
        </TextLink>
        <TextLink
          className="inline-flex min-h-8 items-center text-small max-[480px]:min-h-11"
          href={`${href}#changes`}
        >
          What changed
        </TextLink>
      </div>
    </li>
  );
}

/** This issuer's published runs as a timeline, newest first; every run listed is finished. */
export function RunHistory({
  snapshot,
  run,
  issuer,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  issuer: string;
}) {
  const records = Object.entries(snapshot.workspace.runs).filter(
    ([key, record]) =>
      publishedRunForFolder(snapshot.workspace.runs, record.folder)?.[0] === key &&
      (record === run || Boolean(run.issuerKey && record.issuerKey === run.issuerKey)),
  );
  const callStarts = new Map(records.map(([key, record]) => [key, firstModelCallStart(record)]));
  records.sort(([aKey, a], [bKey, b]) => {
    const date = (b.asOf ?? "").localeCompare(a.asOf ?? "");
    if (date) return date;
    const aStart = callStarts.get(aKey);
    const bStart = callStarts.get(bKey);
    if (aStart && bStart) {
      const time = aStart.instant === bStart.instant ? 0 : aStart.instant > bStart.instant ? -1 : 1;
      return time || b.folder.localeCompare(a.folder);
    }
    if (aStart) return -1;
    if (bStart) return 1;
    return b.folder.localeCompare(a.folder);
  });
  const byFolder = new Map(snapshot.catalogue.real.map((item) => [item.id, item]));
  const dates = new Map<string, number>();
  for (const [, record] of records)
    if (record.asOf) dates.set(record.asOf, (dates.get(record.asOf) ?? 0) + 1);
  return (
    <Bento>
      <Tile span={12} as="h2" label={`Runs of ${issuer}`} title={`Runs of ${issuer}`}>
        <p className="text-caption text-text-tertiary">
          Finished runs, newest first. As-of dates descend. Runs with the same as-of date use the
          first model-call start when recorded; rows without one follow deterministically. A run’s
          scope is the standard pathway scope unless its row says otherwise.
        </p>
        <p className="text-caption text-gap-text">
          Who started each run is not published with the report.
        </p>
        <ol
          aria-label="Runs, newest first"
          className="ml-1.5 flex min-w-0 flex-col border-l border-connector"
        >
          {records.map(([key, record]) => (
            <RunRow
              key={key}
              record={record}
              decisions={runDecisions(snapshot, key, record)}
              current={record === run}
              tie={Boolean(record.asOf) && (dates.get(record.asOf ?? "") ?? 0) > 1}
              callStart={callStarts.get(key) ?? null}
              catalogue={byFolder.get(record.folder)}
              details={runDetails(snapshot, key, record)}
            />
          ))}
        </ol>
      </Tile>
    </Bento>
  );
}
