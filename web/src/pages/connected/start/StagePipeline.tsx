import { StatusBadge } from "@/components/status/StatusBadge";
import { StatusShape } from "@/components/status/shapes";
import { STATUS_SETS } from "@/components/status/sets";
import { cx } from "@/utils/cx";
import { OUTCOME_STATE } from "./limitWords";
import {
  limitedRows,
  type ModuleMark,
  type ModuleReadiness,
  type ModuleRow,
} from "./moduleReadiness";

// The mark colours of the status badges' four tones (StatusBadge draws its shapes the same way);
// gap and neutral marks keep the text colour.
const TONE_MARK: Readonly<Record<string, string>> = {
  error: "text-error-mark",
  warning: "text-warning-mark",
  info: "text-info-mark",
  success: "text-success-mark",
  gap: "text-gap-text",
};

function markWord(mark: ModuleMark) {
  if (mark === "unchecked") return "not checked yet";
  if (mark === "none") return "no limit in this review";
  return OUTCOME_STATE[mark];
}

/** A mark's shape and colour: the limit's from the "Run limits" set, else a quiet dot or ring. */
function MarkShape({ mark, label }: { mark: ModuleMark; label?: string }) {
  const state =
    mark === "unchecked" || mark === "none"
      ? undefined
      : STATUS_SETS["Run limits"][OUTCOME_STATE[mark]];
  return (
    <span
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cx(
        "flex shrink-0 [&>svg]:size-full",
        state ? cx("size-3.5", TONE_MARK[state.tone]) : "size-2.5",
        mark === "unchecked" && "text-text-disabled",
        mark === "none" && "text-text-tertiary",
      )}
    >
      <StatusShape shape={state?.shape ?? (mark === "none" ? "filled circle" : "ring")} />
    </span>
  );
}

/**
 * One module: its mark, then its name in words. The mark is named "<module>: <state>" for a
 * screen reader, so the name beside it is not read a second time.
 */
function Mark({ row }: { row: ModuleRow }) {
  return (
    <li className="flex min-h-5 max-w-full min-w-0 items-center gap-1.5">
      <span className="flex size-3.5 shrink-0 items-center justify-center">
        <MarkShape mark={row.mark} label={`${row.name}: ${markWord(row.mark)}`} />
      </span>
      <span aria-hidden="true" className="min-w-0 text-caption wrap-anywhere text-text-secondary">
        {row.name}
      </span>
    </li>
  );
}

const MARK_ORDER: readonly ModuleMark[] = [
  "will_refuse",
  "gap",
  "limited",
  "check",
  "none",
  "unchecked",
];

/** A stage's modules counted by mark, in the key's order: the glyph, the figure, the words for a screen reader. */
function StageCounts({ rows }: { rows: readonly ModuleRow[] }) {
  const counts = MARK_ORDER.map((mark) => ({
    mark,
    count: rows.filter((row) => row.mark === mark).length,
  })).filter((entry) => entry.count > 0);
  return (
    <span className="ml-auto flex shrink-0 items-center gap-2">
      {counts.map(({ mark, count }) => {
        const word = markWord(mark);
        return (
          <span key={mark} className="inline-flex items-center gap-1">
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              <MarkShape mark={mark} />
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-caption text-text-secondary tabular-nums"
            >
              {count}
            </span>
            <span className="sr-only">{`${String(count)} ${word.charAt(0).toLowerCase()}${word.slice(1)}`}</span>
          </span>
        );
      })}
    </span>
  );
}

/** What each mark drawn here means, in the words the marks are named with. */
function MarkKey({ readiness }: { readiness: ModuleReadiness }) {
  const drawn = new Set(
    [...readiness.groups.flatMap((group) => group.rows), ...readiness.other].map((row) => row.mark),
  );
  const marks = MARK_ORDER.filter((mark) => drawn.has(mark));
  if (marks.length === 0) return null;
  return (
    <ul
      aria-label="What the marks mean"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-hairline pt-2"
    >
      {marks.map((mark) => {
        const word = markWord(mark);
        return (
          <li key={mark} className="flex items-center gap-1.5 text-caption text-text-tertiary">
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              <MarkShape mark={mark} />
            </span>
            {word.charAt(0).toUpperCase() + word.slice(1)}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The run's five stages, each with its module count and its modules by name with a mark each,
 * the key to those marks, then, once a summary exists, a limit on the whole run with its word. The reasons are
 * the limits block's to give; this is the overview.
 */
export function StagePipeline({
  readiness,
  label,
  named = true,
  layout = "list",
}: {
  readiness: ModuleReadiness;
  label: string;
  /** Whether to name the modules carrying a limit under the stages (not where the limits are). */
  named?: boolean;
  /** One stage a row (a rail), or the stages side by side from md (a wide tile). */
  layout?: "list" | "matrix";
}) {
  const limited = limitedRows(readiness);
  const matrix = layout === "matrix";
  const cell = cx(
    "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1",
    matrix
      ? "py-1.5 md:flex-col md:items-start md:border-l md:border-border-hairline md:py-0 md:pl-3 md:first:border-l-0 md:first:pl-0"
      : "py-1.5",
  );
  // A stage's modules: wrapped under the stage's name in a rail; in a matrix, one a line in the
  // stage's own column, so a long name wraps inside the column and never runs into the next.
  const modules = cx(
    "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-0.5",
    matrix ? "max-md:basis-full md:w-full md:flex-col md:flex-nowrap md:items-start" : "basis-full",
  );
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ol
        aria-label={label}
        className={cx(
          "flex flex-col divide-y divide-border-hairline",
          matrix &&
            "md:grid md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] md:gap-3 md:divide-y-0",
        )}
      >
        {readiness.groups.map((group) => (
          <li key={group.name} className={cell}>
            <span
              className={cx(
                "flex min-w-0 flex-1 items-baseline gap-2 text-small text-text-primary",
                matrix && "md:w-full md:flex-none",
              )}
            >
              {group.number && (
                <span className="font-mono text-caption text-text-tertiary tabular-nums">
                  {group.number}
                </span>
              )}
              <span className="min-w-0 wrap-anywhere">{group.name}</span>
              <span className="font-mono text-caption text-text-secondary tabular-nums">
                {group.rows.length}
              </span>
              {readiness.checked && <StageCounts rows={group.rows} />}
            </span>
            <ul aria-label={`${group.name} modules`} className={modules}>
              {group.rows.map((row) => (
                <Mark key={row.id} row={row} />
              ))}
            </ul>
          </li>
        ))}
        {readiness.other.length > 0 && (
          <li className={cell}>
            <span className="flex-1 text-small text-text-primary">Other limits</span>
            <ul aria-label="Other limits" className={modules}>
              {readiness.other.map((row) => (
                <Mark key={row.id} row={row} />
              ))}
            </ul>
          </li>
        )}
      </ol>
      <MarkKey readiness={readiness} />
      {/* The modules carrying a limit are named above, by their marks; only a limit on the whole
          run, which no stage holds, is named here. */}
      {named &&
        readiness.checked &&
        (readiness.run ? (
          <ul aria-label="Carrying a limit" className="flex flex-col gap-1">
            <li className="flex min-w-0 flex-wrap items-center justify-between gap-x-3">
              <span className="min-w-0 text-small wrap-anywhere text-text-primary">
                {readiness.run.name}
              </span>
              {readiness.run.mark !== "none" && readiness.run.mark !== "unchecked" && (
                <StatusBadge
                  set="Run limits"
                  state={OUTCOME_STATE[readiness.run.mark]}
                  className="bg-transparent px-0 text-small ring-0"
                />
              )}
            </li>
          </ul>
        ) : (
          limited.length === 0 && (
            <p className="text-caption text-text-secondary">The review names no limit.</p>
          )
        ))}
    </div>
  );
}
