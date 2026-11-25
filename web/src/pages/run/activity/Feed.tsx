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

/** The activity feed, newest first. */
export function Feed({
  lines,
  columns = false,
}: {
  lines: ActivityLine[];
  /** Compact rows in two columns from lg (Run progress), without the connecting rule. */
  columns?: boolean;
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
  return (
    <ul className={columns ? "gap-x-6 lg:columns-2 xl:columns-3" : undefined}>
      {entries.map(({ line, key }, i) => {
        const { shape, tone } = stateOf(line);
        const last = i === lines.length - 1;
        return (
          <li key={key} className={columns ? "break-inside-avoid" : undefined}>
            <article className={cx("flex", columns ? "items-center gap-2 py-1" : "gap-3")}>
              <div className="flex flex-none flex-col items-center">
                <span
                  className={cx(
                    "flex shrink-0 items-center justify-center rounded-ds-full bg-surface-subtle",
                    columns ? "size-6" : "size-7",
                    MARK[tone],
                  )}
                >
                  <StatusShape shape={shape} />
                  <span className="sr-only">{line.state}</span>
                </span>
                {last || columns ? null : (
                  <span
                    aria-hidden="true"
                    className="my-1 min-h-3 flex-1 border-s border-border-container"
                  />
                )}
              </div>
              <div
                className={cx(
                  "flex min-w-0 flex-1",
                  columns ? "flex-row flex-wrap items-baseline gap-x-3" : "flex-col",
                  last || columns ? "pb-0" : "pb-4",
                )}
              >
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
