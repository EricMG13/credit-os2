// Follows the HyperUI stats examples "Title, value and icon" (without the icon) and the first
// example's "from" value (without the growth badge).
import type { ReactNode } from "react";
import { InfoCircle } from "@untitledui/icons";
import { Missing } from "@/components/gap/Missing";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";

export const METRIC_FIGURE = "font-body text-metric tabular-nums text-text-primary";

interface MetricCardProps {
  label: string;
  /** The display string, formatted by the caller; null when the figure is missing. */
  value: string | null;
  /** The previous value, same form; null when missing; omitted when there is none to show. */
  from?: string | null;
  /** The metric's definition, shown in a tooltip on an info trigger. */
  note?: string;
  /** Same metric card in a list, or as a standalone figure. */
  as?: "article" | "li";
  /** The source control belongs to the figure, without changing its card. */
  actions?: ReactNode;
  definitionControl?: ReactNode;
  /** A supplied missing/withheld/gap form; ordinary strings use `value`. */
  figure?: ReactNode;
  delta?: ReactNode;
  children?: ReactNode;
}

export function MetricCard({
  label,
  value,
  from,
  note,
  as: Component = "article",
  actions,
  definitionControl,
  figure,
  delta,
  children,
}: MetricCardProps) {
  return (
    <Component className="group/trace relative min-w-0 rounded-ds-sm border border-border-subtle bg-surface-card p-6 shadow-xs">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="text-sm text-text-tertiary">{label}</p>
            {definitionControl ??
              (note !== undefined && (
                <Tooltip title={note}>
                  <TooltipTrigger
                    aria-label={`About ${label}`}
                    className="rounded-ds-xs text-text-tertiary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <InfoCircle aria-hidden="true" className="size-4" />
                  </TooltipTrigger>
                </Tooltip>
              ))}
          </div>
          {actions}
        </div>
        <div className="flex min-h-11 flex-wrap items-end justify-between gap-3">
          {figure === undefined ? (
            <p>
              <span
                className={`${METRIC_FIGURE} ${value === null ? "font-normal" : "font-semibold"}`}
              >
                {value === null ? <Missing /> : value}
              </span>
              {from !== undefined && (
                <>
                  {" "}
                  <span className="text-caption tabular-nums text-text-tertiary">
                    from {from === null ? <Missing /> : from}
                  </span>
                </>
              )}
            </p>
          ) : (
            figure
          )}
          {delta}
        </div>
        {children}
      </div>
    </Component>
  );
}
