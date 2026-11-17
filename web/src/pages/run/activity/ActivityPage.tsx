import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Card } from "@/components/card/Card";
import { Skeleton } from "@/components/gap/Skeleton";
import { StatusBadge } from "@/components/status/StatusBadge";
import { PageHeader } from "@/shell/PageHeader";
import { useSource } from "../../source";
import { TextLink } from "../TextLink";
import { readSlice } from "../slice";
import type { StartDraft } from "../slice-start";
import type { ActivityRecord, RunRecord } from "../slice-activity";
import { Feed } from "./Feed";
import { RunAlert } from "./RunAlert";
import { ModuleSteps } from "./ModuleSteps";
import { Summary } from "./Summary";

// The page draws its own padding (the shell gives a bleed page none) and its own h1.
function Frame({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6 p-8">{children}</div>;
}

function Empty({
  title,
  trail = false,
  action,
  children,
}: {
  title: string;
  trail?: boolean;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Frame>
      {trail ? <span className="text-sm text-text-tertiary">Runs</span> : null}
      <PageHeader title="Run activity" />
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.FeaturedIcon />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>{title}</EmptyState.Title>
          {children}
        </EmptyState.Content>
        {action === undefined ? null : <EmptyState.Footer>{action}</EmptyState.Footer>}
      </EmptyState>
    </Frame>
  );
}

const NOTHING_STARTED =
  "Nothing is running and no run has been started here yet. A run appears on this page as soon as you submit it.";

function NoRun({ draft }: { draft: StartDraft | undefined }) {
  return (
    <Empty
      title="No run to watch"
      trail
      action={
        draft === undefined ? undefined : (
          <Button href={`#/run/start/${draft.id}`} size="lg" color="primary">
            Start a run
          </Button>
        )
      }
    >
      <EmptyState.Description>{NOTHING_STARTED}</EmptyState.Description>
    </Empty>
  );
}

/** A run's own labels are free text, so unlike the shared Badge's one-line chips they wrap inside
 *  the row and break an unbroken word; a long label stays whole and in view. */
function Labels({ labels }: { labels: readonly string[] }) {
  return labels.map((label, i) => (
    <Badge
      key={`${label}-${String(i)}`}
      className="size-auto max-w-full rounded-2xl whitespace-normal wrap-anywhere"
    >
      {label}
    </Badge>
  ));
}

function Trail({ issuer }: { issuer: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-tertiary">
      <TextLink href="#/run/runs">Runs</TextLink>
      {` / ${issuer}`}
    </nav>
  );
}

// The summary and the two panels, as static blocks: no figure is known.
function Unreadable({ run }: { run: Extract<ActivityRecord, { kind: "unreadable" }> }) {
  return (
    <Frame>
      <Trail issuer={run.issuer} />
      <PageHeader
        title={run.issuer}
        badges={
          <>
            <StatusBadge set="Activity that cannot be read" state="State not known" />
            <Labels labels={run.labels} />
          </>
        }
      />
      <RunAlert state="unreadable" alert={run.alert} />
      <Card>
        <Skeleton lines={3} />
      </Card>
      <div className="grid items-start gap-6 min-[1101px]:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <Skeleton lines={5} />
        </Card>
        <Card>
          <Skeleton lines={4} />
        </Card>
      </div>
    </Frame>
  );
}

function Modules({ run, live }: { run: RunRecord; live: boolean }) {
  const { modules } = run;
  return (
    <section aria-labelledby="run-modules" className="min-w-0">
      <Card>
        <h2 id="run-modules" className="mb-6 font-display text-h3 text-text-primary">
          Modules
        </h2>
        {modules.kind === "steps" ? <ModuleSteps steps={modules.steps} live={live} /> : null}
        {modules.kind === "starting" ? (
          <div className="py-12">
            <LoadingIndicator label={modules.label} />
          </div>
        ) : null}
        {modules.kind === "none" ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.FeaturedIcon />
            </EmptyState.Header>
            <EmptyState.Content>
              <EmptyState.Title as="h3">{modules.title}</EmptyState.Title>
              <EmptyState.Description>{modules.text}</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState>
        ) : null}
      </Card>
    </section>
  );
}

function Run({ run }: { run: RunRecord }) {
  const live = run.state === "Queued" || run.state === "Running";
  return (
    <Frame>
      <Trail issuer={run.issuer} />
      <PageHeader
        title={run.issuer}
        badges={
          <>
            <StatusBadge set="Run states" state={run.state} live={live} />
            <Labels labels={run.labels} />
          </>
        }
        actions={
          run.open !== null ? (
            <Button href={run.open.href} size="lg" color="primary">
              {run.open.label}
            </Button>
          ) : null
        }
      />
      {run.line === null ? null : (
        <p className="max-w-2xl text-body text-text-secondary">{run.line}</p>
      )}
      {run.alert === null ? null : <RunAlert state={run.state} alert={run.alert} />}
      <Summary run={run} />
      <div className="grid items-start gap-6 min-[1101px]:grid-cols-[minmax(0,1fr)_400px]">
        <Modules run={run} live={live} />
        <section aria-labelledby="run-feed" className="min-w-0">
          <Card>
            <h2 id="run-feed" className="mb-6 font-display text-h3 text-text-primary">
              Activity
            </h2>
            <Feed lines={run.feed} live={live} />
          </Card>
        </section>
      </div>
    </Frame>
  );
}

/** One run's activity: the run the address names, or (no id) the one the slice names as current. */
export function ActivityPage({ run: id }: { run: string | null }) {
  const slice = readSlice(useSource().run);
  if (slice.kind !== "ok")
    return (
      <Empty
        title="No run data in this library"
        action={
          <Button href="#/" color="secondary">
            Back to the library
          </Button>
        }
      >
        <EmptyState.Description>This library holds no run records.</EmptyState.Description>
      </Empty>
    );
  const wanted = id ?? slice.data.current;
  const record = slice.data.runs.find((r) => r.id === wanted);
  if (wanted === null) return <NoRun draft={slice.data.drafts[0]} />;
  if (record === undefined) {
    return (
      <Empty title="No run has this address">
        <TextLink href="#/run">Go to Run</TextLink>
      </Empty>
    );
  }
  if (record.kind === "none") return <NoRun draft={slice.data.drafts[0]} />;
  if (record.kind === "unreadable") return <Unreadable key={record.id} run={record} />;
  // The key keeps one run's opened groups from carrying over to another run's page.
  return <Run key={record.id} run={record} />;
}

type Listed = Exclude<ActivityRecord, { kind: "none" }>;

// CM-090's three groups, then the runs whose record cannot be read: their state is not known, so
// they are neither in progress nor ended. A group whose heading names the state draws no state
// badge on its rows; the ended group's rows do, as the states differ within it.
const GROUPS: readonly { id: string; title: string; has: (run: Listed) => boolean }[] = [
  {
    id: "runs-in-progress",
    title: "In progress",
    has: (run) => run.kind === "run" && run.state === "Running",
  },
  {
    id: "runs-queue",
    title: "Queue",
    has: (run) => run.kind === "run" && run.state === "Queued",
  },
  {
    id: "runs-ended",
    title: "Ended",
    has: (run) => run.kind === "run" && run.state !== "Running" && run.state !== "Queued",
  },
  { id: "runs-unreadable", title: "State not known", has: (run) => run.kind === "unreadable" },
];

function RunRow({ run, ended }: { run: Listed; ended: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
      <TextLink href={`#/run/activity/${run.id}`}>{run.issuer}</TextLink>
      {ended && run.kind === "run" ? <StatusBadge set="Run states" state={run.state} /> : null}
      <Labels labels={run.labels} />
      {run.kind === "run" ? (
        <span className="text-sm text-text-tertiary">{run.elapsed.note}</span>
      ) : null}
    </li>
  );
}

function NoRuns({ title, draft }: { title: string; draft?: StartDraft | undefined }) {
  return (
    <EmptyState>
      <EmptyState.Header>
        <EmptyState.FeaturedIcon />
      </EmptyState.Header>
      <EmptyState.Content>
        <EmptyState.Title>{title}</EmptyState.Title>
        {draft === undefined ? null : (
          <EmptyState.Description>{NOTHING_STARTED}</EmptyState.Description>
        )}
      </EmptyState.Content>
      {draft === undefined ? null : (
        <EmptyState.Footer>
          <Button href={`#/run/start/${draft.id}`} size="lg" color="primary">
            Start a run
          </Button>
        </EmptyState.Footer>
      )}
    </EmptyState>
  );
}

/** Every run the slice lists, each linking to its activity page: the page the Runs breadcrumb
 *  opens. It draws the slice's own fields only (issuer, state, labels and time line). */
export function RunsIndex() {
  const slice = readSlice(useSource().run);
  if (slice.kind !== "ok") return <NoRuns title="No run data in this library" />;
  const runs = slice.data.runs.filter((r): r is Listed => r.kind !== "none");
  if (runs.length === 0) return <NoRuns title="No runs yet" draft={slice.data.drafts[0]} />;
  return (
    <div className="flex flex-col gap-8">
      {GROUPS.map(({ id, title, has }) => {
        const members = runs.filter(has);
        if (members.length === 0) return null;
        return (
          <section key={id} aria-labelledby={id}>
            <h2 id={id} className="mb-4 font-display text-h3 text-text-primary">
              {title}
            </h2>
            <Card>
              <ul>
                {members.map((run) => (
                  <RunRow key={run.id} run={run} ended={id === "runs-ended"} />
                ))}
              </ul>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
