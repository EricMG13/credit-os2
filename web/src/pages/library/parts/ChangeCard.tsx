import type { ReactNode } from "react";
import { Badge } from "@/components/base/badges/badges";
import type { Change } from "../slice";
import { CellValue } from "./CellValue";
import { DirectionMark } from "./DirectionMark";
import { InlineCell } from "./InlineCell";
import { ToneMark } from "@/pages/connected/report/ToneMark";
import { TRACE_HOST, TraceControl } from "./TraceControl";

const TONE_CLASS = {
  better: "text-success-text",
  worse: "text-error-text",
  flat: "text-text-secondary",
} as const;

const VALUE = "text-2xl/8 tabular-nums text-text-primary";

/** The delivered direction: its words and, for up, down or flat, the mock's mark; "none" has no mark. */
function Direction({ change }: { change: Change }) {
  if (change.change === null) return null;
  return (
    <span
      className={`inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 self-end rounded-ds-xs bg-surface-subtle px-1.5 py-1 text-caption font-medium ${TONE_CLASS[change.tone ?? "flat"]}`}
    >
      {change.direction === "none" ? null : <DirectionMark direction={change.direction} />}
      {change.change}
      {change.tone && <ToneMark tone={change.tone} />}
    </span>
  );
}

/**
 * One change as a card (F3, the stat with its "from" value): the kind and direction on top, the
 * measure, its value with the earlier value beside it, then cause and effect. The mark is the
 * delivered one, never worked out from the figures.
 */
export function ChangeCard({ change, source }: { change: Change; source?: ReactNode }) {
  return (
    <li
      className={`${TRACE_HOST} flex min-w-0 flex-col gap-4 rounded-lg border border-border-hairline bg-surface-card p-6`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className={(source ?? true) ? "ml-9" : undefined}>
          <Badge size="sm">{change.kind}</Badge>
        </span>
        <Direction change={change} />
      </div>
      <div className="flex flex-col gap-1">
        <strong className="text-small font-medium text-text-tertiary">{change.measure}</strong>
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <CellValue cell={change.current} figureClass={VALUE} weight="font-medium" />
          <span className="flex items-baseline gap-1 text-caption text-text-tertiary">
            from <InlineCell cell={change.from} />
          </span>
        </div>
      </div>
      <p className="border-t border-border-hairline pt-3 text-small text-text-secondary">
        <span className="font-semibold text-text-primary">{change.cause}</span> {change.effect}
      </p>
      <span className="absolute top-5 left-5">
        {source ?? <TraceControl trace={change.trace} label="Show sources for this change" />}
      </span>
    </li>
  );
}
