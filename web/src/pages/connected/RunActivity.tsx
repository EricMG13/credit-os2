import { PlayCircle } from "@untitledui/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/gap/Skeleton";
import { StatusShape } from "@/components/status/shapes";
import { PageHeader } from "../../shell/PageHeader";
import { TextLink } from "../run/TextLink";
import { getActivity, serviceText, type Activity, type Mode } from "./api";
import { Figure, GapNote, Tile } from "./report/overview/Tile";
import { EndedRow, RunGroup, RunningRow, runPath, WaitingRow } from "./runActivityParts";
import { stamp } from "./runFigures";

const RELOAD_MS = 5000;
const RUN_LINK = 'a[href^="/run/"]';

/**
 * The list, re-read while the page is open. A read that fails is never shown as an empty list:
 * the last good list stays and `failed` says the latest read did not work.
 */
function useActivity(beforeUpdate: (next: Activity) => void) {
  const [read, setRead] = useState<Activity>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      const next = await getActivity(controller.signal).catch(() => null);
      if (controller.signal.aborted) return;
      if (next && Array.isArray(next.runs) && (next.ended == null || Array.isArray(next.ended))) {
        beforeUpdate(next);
        setRead(next);
        setFailed(false);
      } else {
        setFailed(true);
      }
      timer = setTimeout(() => void poll(), RELOAD_MS);
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [beforeUpdate]);
  return { read, failed };
}

/** Nothing in flight: one sentence and the one action that changes that. */
function Empty({ title, children }: { title: string; children: string }) {
  return (
    <EmptyState>
      <EmptyState.Header>
        <EmptyState.FeaturedIcon icon={PlayCircle} />
      </EmptyState.Header>
      <EmptyState.Content>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{children}</EmptyState.Description>
      </EmptyState.Content>
      <EmptyState.Footer className="flex-wrap items-center justify-center">
        {/* Secondary, and in the top bar's own words: that bar holds the page's one primary action. */}
        <Button href="/start" color="secondary" className="max-md:min-h-11">
          Start run
        </Button>
        <TextLink href="/" className="min-h-8 items-center">
          Open the library
        </TextLink>
      </EmptyState.Footer>
    </EmptyState>
  );
}

const unreadableText = (count: number) =>
  count === 1
    ? "1 run record could not be read and is not listed."
    : `${String(count)} run records could not be read and are not listed.`;

function groupForRunPath(activity: Activity, path: string) {
  const sameRun = (run: { id: string }) => runPath(run) === path;
  return (
    activity.runs.find(sameRun)?.status ?? (activity.ended?.some(sameRun) ? "ended" : undefined)
  );
}

/** What is running, waiting and ended without a report. A run's own page has its spend, modules and activity. */
export function RunActivity({ mode }: { mode?: Mode }) {
  useEffect(() => {
    document.title = "Run activity — Credit OS";
  }, []);
  const content = useRef<HTMLDivElement>(null);
  const focusedRun = useRef<{ node: Element; href: string } | null>(null);
  const rememberRunFocus = useCallback((next: Activity) => {
    focusedRun.current = null;
    const node = document.activeElement;
    const region = content.current;
    if (!node || !region?.contains(node)) return;
    const link = node.closest<HTMLAnchorElement>(RUN_LINK);
    const group = link?.closest<HTMLElement>("[data-run-group]")?.dataset.runGroup;
    if (!link || !group) return;
    if (groupForRunPath(next, link.pathname) !== group) {
      focusedRun.current = { node, href: link.href };
      // Leave the departing row before the list moves its run to another group.
      region.focus({ preventScroll: true });
    }
  }, []);
  const { read, failed } = useActivity(rememberRunFocus);
  useEffect(() => {
    const previous = focusedRun.current;
    focusedRun.current = null;
    const region = content.current;
    if (!previous || !region) return;
    const restoreFocus = () => {
      if (document.activeElement !== region) return;
      const link = [...region.querySelectorAll<HTMLAnchorElement>(RUN_LINK)].find(
        (entry) => entry.href === previous.href,
      );
      link?.focus();
    };
    let frame: number | undefined;
    // The old row can be removed in a separate commit from the poll.
    const restoreAfterRemoval = () => {
      if (previous.node.isConnected) return;
      observer.disconnect();
      frame = requestAnimationFrame(restoreFocus);
    };
    const observer = new MutationObserver(restoreAfterRemoval);
    if (previous.node.isConnected) observer.observe(region, { childList: true, subtree: true });
    else restoreAfterRemoval();
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [read]);
  const running = read?.runs.filter((run) => run.status === "running") ?? [];
  const waiting = read?.runs.filter((run) => run.status === "queued") ?? [];
  const ended = read?.ended ?? [];
  const endedTotal = Math.max(read?.ended_total ?? 0, ended.length);
  const none = running.length + waiting.length + ended.length === 0;
  return (
    <>
      <PageHeader
        title="Run activity"
        badges={
          <>
            {mode === "synthetic" && <Badge color="gray">Synthetic test</Badge>}
            {read && (
              <span className="text-caption text-text-tertiary tabular-nums">{`Updated ${stamp(read.updated)}`}</span>
            )}
          </>
        }
      />
      <div
        ref={content}
        role="region"
        aria-label="Runs"
        tabIndex={-1}
        className="mt-6 grid min-w-0 gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {read && !none && (
          <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {(
              [
                ["Running", running.length],
                ["Waiting", waiting.length],
                ["Ended without a report", endedTotal],
              ] as const
            ).map(([term, count]) => (
              <div key={term} className="flex items-baseline gap-2">
                <dt className="text-small text-text-tertiary">{term}</dt>
                <dd>
                  <Figure className="text-h4 font-medium">{String(count)}</Figure>
                </dd>
              </div>
            ))}
          </dl>
        )}
        {read === undefined && !failed && (
          <div role="status" aria-label="Loading run activity" className="grid gap-4">
            {["Running", "Ended without a report"].map((title) => (
              <Tile key={title} span={12} label={`${title}, loading`}>
                <Skeleton lines={4} />
              </Tile>
            ))}
          </div>
        )}
        {failed && (
          <Alert
            tone={read ? "warning" : "error"}
            title={read ? "Run activity could not be refreshed" : "Run activity could not be read"}
            action={
              <Button href="/" size="sm" color="secondary" className="max-md:min-h-11">
                Open the library
              </Button>
            }
          >
            {read
              ? `Showing the list from ${stamp(read.updated)}. This page retries every few seconds.`
              : "Run status is unknown. This page retries every few seconds. Finished reports are in the library."}
          </Alert>
        )}
        {failed && read === undefined && (
          <Tile span={12} label="Runs unknown">
            <GapNote>Which runs are in flight, waiting or stopped is not known.</GapNote>
          </Tile>
        )}
        {/* Why waiting runs wait is said with them; it is a notice only when none is listed. */}
        {read?.held && waiting.length === 0 && (
          <Alert tone="warning" title="Held by the service">
            <span className="wrap-anywhere">{serviceText(read.held)}</span>
          </Alert>
        )}
        {read?.unreadable ? (
          none ? (
            <Alert tone="warning" title="Some run records could not be read">
              {unreadableText(read.unreadable)}
            </Alert>
          ) : (
            <p role="status" className="flex items-center gap-2 text-small text-warning-text">
              <span className="flex text-warning-mark">
                <StatusShape shape="triangle" />
              </span>
              {unreadableText(read.unreadable)}
            </p>
          )
        ) : null}
        {read && none && (
          <Empty title={read.unreadable ? "No active runs listed" : "No run in progress"}>
            {read.unreadable
              ? "Other runs may be in progress if their records could not be read."
              : "No run is running or waiting. Finished runs are in the library."}
          </Empty>
        )}
        {running.length > 0 && (
          <RunGroup title="Running" group="running" count={running.length}>
            {running.map((run) => (
              <RunningRow key={run.id} run={run} />
            ))}
          </RunGroup>
        )}
        {ended.length > 0 && (
          <RunGroup
            title="Ended without a report"
            group="ended"
            count={endedTotal}
            intro={
              endedTotal > ended.length && (
                <p className="text-small text-text-secondary">
                  {`Showing the latest ${String(ended.length)} of ${String(endedTotal)}.`}{" "}
                  <span>Earlier ones are not listed on this page.</span>
                </p>
              )
            }
          >
            {ended.map((run) => (
              <EndedRow key={run.id} run={run} />
            ))}
          </RunGroup>
        )}
        {waiting.length > 0 && (
          <RunGroup
            title="Waiting"
            group="queued"
            count={waiting.length}
            intro={
              read?.held && (
                <p className="text-small text-text-secondary wrap-anywhere">
                  <span className="font-medium text-text-primary">Held by the service.</span>{" "}
                  {serviceText(read.held)}
                </p>
              )
            }
          >
            {waiting.map((run) => (
              <WaitingRow key={run.id} run={run} held={read?.held ?? ""} />
            ))}
          </RunGroup>
        )}
        {read && !none && (
          <TextLink href="/" className="min-h-8 items-center max-[480px]:min-h-11">
            Finished runs are in the library
          </TextLink>
        )}
      </div>
    </>
  );
}
