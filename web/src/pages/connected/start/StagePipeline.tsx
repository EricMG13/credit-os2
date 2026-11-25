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

/** One module as a mark: its limit's shape from the "Run limits" set, else a quiet dot or ring. */
function Mark({ row }: { row: ModuleRow }) {
  const label = `${row.name}: ${markWord(row.mark)}`;
  const state =
    row.mark === "unchecked" || row.mark === "none"
      ? undefined
      : STATUS_SETS["Run limits"][OUTCOME_STATE[row.mark]];
  return (
    <li className="flex size-5 items-center justify-center">
      <span
        role="img"
        aria-label={label}
        title={label}
        className={cx(
          "flex [&>svg]:size-full",
          state ? cx("size-3.5", TONE_MARK[state.tone]) : "size-2.5",
          row.mark === "unchecked" && "text-text-disabled",
          row.mark === "none" && "text-text-tertiary",
        )}
      >
        <StatusShape shape={state?.shape ?? (row.mark === "none" ? "filled circle" : "ring")} />
      </span>
    </li>
  );
}

/**
 * The run's five stages, each with its module count and one mark per module, then, once a
 * summary exists, the modules that carry a limit by name with the limit's word. The reasons are
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
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ol
        aria-label={label}
        className={cx(
          "flex flex-col divide-y divide-border-hairline",
          matrix &&
            "md:grid md:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] md:gap-3 md:divide-y-0",
        )}
      >
        {readiness.groups.map((group) => (
          <li key={group.name} className={cell}>
            <span className="flex min-w-0 flex-1 items-baseline gap-2 text-small text-text-primary">
              {group.number && (
                <span className="font-mono text-caption text-text-tertiary tabular-nums">
                  {group.number}
                </span>
              )}
              <span className="min-w-0 wrap-anywhere">{group.name}</span>
              <span className="font-mono text-caption text-text-secondary tabular-nums">
                {group.rows.length}
              </span>
            </span>
            <ul
              aria-label={`${group.name} modules`}
              className="flex flex-wrap items-center gap-0.5"
            >
              {group.rows.map((row) => (
                <Mark key={row.id} row={row} />
              ))}
            </ul>
          </li>
        ))}
        {readiness.other.length > 0 && (
          <li className={cell}>
            <span className="flex-1 text-small text-text-primary">Other limits</span>
            <ul aria-label="Other limits" className="flex flex-wrap items-center gap-0.5">
              {readiness.other.map((row) => (
                <Mark key={row.id} row={row} />
              ))}
            </ul>
          </li>
        )}
      </ol>
      {named &&
        readiness.checked &&
        (limited.length > 0 ? (
          <ul aria-label="Carrying a limit" className="flex flex-col gap-1">
            {limited.map((row) => (
              <li
                key={row.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-x-3"
              >
                <span className="min-w-0 text-small wrap-anywhere text-text-primary">
                  {row.name}
                </span>
                {row.mark !== "none" && row.mark !== "unchecked" && (
                  <StatusBadge
                    set="Run limits"
                    state={OUTCOME_STATE[row.mark]}
                    className="bg-transparent px-0 text-small ring-0"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-caption text-text-secondary">The review names no limit.</p>
        ))}
    </div>
  );
}
