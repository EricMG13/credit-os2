import { STATUS_SETS, type Tone } from "@/components/status/sets";
import { StatusShape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import type { ActivityLine } from "../slice-activity";

const MARK: Record<Tone, string> = {
  success: "text-success-mark",
  warning: "text-warning-mark",
  error: "text-error-mark",
  info: "text-info-mark",
  neutral: "text-text-tertiary",
  action: "text-action",
  gap: "text-text-tertiary",
};

function stateOf(line: ActivityLine) {
  return line.state === "Not assessable"
    ? STATUS_SETS["Module state"]["Not assessable"]
    : STATUS_SETS["Run states"][line.state];
}

/** How many of the newest events the compact feed shows before the rest are behind a disclosure. */
const NEWEST = 8;

type Entry = { line: ActivityLine; key: string };

/** One event as a row of a table without rules to read across: who, what happened, when. */
function CompactRow({ line }: { line: ActivityLine }) {
  const { shape, tone } = stateOf(line);
  return (
    <article className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5 py-1.5 lg:grid-cols-[1.5rem_minmax(0,16rem)_minmax(0,1fr)_auto]">
      <span
        className={cx(
          "flex size-6 shrink-0 items-center justify-center self-center rounded-ds-full bg-surface-subtle",
          MARK[tone],
        )}
      >
        <StatusShape shape={shape} />
        <span className="sr-only">{line.state}</span>
      </span>
      <span className="min-w-0 text-small font-medium wrap-anywhere text-text-primary">
        {line.who}
      </span>
      <p className="col-start-2 min-w-0 text-small text-pretty wrap-anywhere text-text-secondary lg:col-start-3">
        {line.text}
      </p>
      {/* The page says once that times are UTC; the row keeps the clock time alone. */}
      <time className="col-start-2 font-mono text-caption text-text-tertiary tabular-nums lg:col-start-4">
        {line.time.replace(/ UTC$/u, "")}
      </time>
    </article>
  );
}

function CompactFeed({ entries }: { entries: Entry[] }) {
  const newest = entries.slice(0, NEWEST);
  const earlier = entries.slice(NEWEST);
  const rows = (shown: Entry[]) =>
    shown.map(({ line, key }) => (
      <li key={key} className="border-t border-border-hairline first:border-t-0">
        <CompactRow line={line} />
      </li>
    ));
  return (
    <>
      <ul>{rows(newest)}</ul>
      {earlier.length > 0 && (
        // The summary keeps its native triangle (no display override): it reads as a control that opens.
        <details className="border-t border-border-hairline">
          <summary className="w-fit cursor-pointer rounded-ds-xs py-1.5 text-small font-medium text-text-link outline-focus-ring marker:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2">
            {`Earlier events (${String(earlier.length)})`}
          </summary>
          <ul>{rows(earlier)}</ul>
        </details>
      )}
    </>
  );
}

/** The activity feed, newest first. */
export function Feed({
  lines,
  compact = false,
}: {
  lines: ActivityLine[];
  /** One row per event, read across, with the newest few shown and the rest disclosed (Run progress). */
  compact?: boolean;
}) {
  // Count identical records oldest first so a new entry does not remount older rows.
  const occurrences = new Map<string, number>();
  const entries = [...lines]
    .reverse()
    .map((line) => {
      const identity = JSON.stringify([line.time, line.who, line.state, line.text]);
      const occurrence = (occurrences.get(identity) ?? 0) + 1;
      occurrences.set(identity, occurrence);
      return { line, key: `${identity}:${String(occurrence)}` };
    })
    .reverse();
  if (compact) return <CompactFeed entries={entries} />;
  return (
    <ul>
      {entries.map(({ line, key }, i) => {
        const { shape, tone } = stateOf(line);
        const last = i === lines.length - 1;
        return (
          <li key={key}>
            <article className="flex gap-3">
              <div className="flex flex-none flex-col items-center">
                <span
                  className={cx(
                    "flex size-7 shrink-0 items-center justify-center rounded-ds-full bg-surface-subtle",
                    MARK[tone],
                  )}
                >
                  <StatusShape shape={shape} />
                  <span className="sr-only">{line.state}</span>
                </span>
                {last ? null : (
                  <span
                    aria-hidden="true"
                    className="my-1 min-h-3 flex-1 border-s border-border-container"
                  />
                )}
              </div>
              <div className={cx("flex min-w-0 flex-1 flex-col", last ? "pb-0" : "pb-4")}>
                <div className="flex flex-none flex-wrap items-center gap-2">
                  <span className="min-w-0 text-small font-medium wrap-anywhere text-text-secondary">
                    {line.who}
                  </span>
                  <time className="font-mono text-caption text-text-tertiary tabular-nums">
                    {line.time}
                  </time>
                </div>
                <p className="text-small text-pretty wrap-anywhere text-text-secondary">
                  {line.text}
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
