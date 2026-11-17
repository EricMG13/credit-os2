// Follows the HyperUI timeline "Vertical": a rule down the left, a marker and text per item.
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/status/StatusBadge";
import { STATUS_SETS } from "@/components/status/sets";
import { StatusShape } from "@/components/status/shapes";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { cx } from "@/utils/cx";

type DatedState = keyof (typeof STATUS_SETS)["Dated records"];

interface TimelineItem {
  date: string;
  title: string;
  text?: string;
  state: DatedState;
  /**
   * A control that belongs to this entry, drawn at its trailing edge (a trace control). An entry
   * with one hosts the control's hover reveal; an entry without one is drawn as it always was.
   */
  action?: ReactNode;
}

// The marker covers the rule behind a hollow shape, so its fill must be the surface the list sits
// on: the page canvas by default, or "card" inside a Card. (bg-inherit would inherit the list's
// transparent background, so the surface is named by the caller.)
const SURFACE = { canvas: "bg-surface-canvas", card: "bg-surface-card" } as const;

export function Timeline({
  items,
  surface = "canvas",
}: {
  items: readonly TimelineItem[];
  surface?: keyof typeof SURFACE;
}) {
  return (
    <ol className="relative space-y-8 before:absolute before:-ms-px before:h-full before:w-0.5 before:rounded-full before:bg-connector">
      {items.map((item) => {
        const { shape, tone } = STATUS_SETS["Dated records"][item.state];
        return (
          <li
            key={`${item.date}-${item.title}`}
            className={cx(
              "relative -ms-1.5 flex items-start gap-4",
              item.action !== undefined && TRACE_HOST,
            )}
          >
            <span
              className={`flex size-3 shrink-0 items-center justify-center rounded-ds-full ${SURFACE[surface]} ${tone === "action" ? "text-action" : "text-text-tertiary"}`}
            >
              <StatusShape shape={shape} />
            </span>
            <div
              className={cx(
                "-mt-2 flex flex-col gap-1",
                item.action !== undefined && "min-w-0 flex-1",
              )}
            >
              <div className="flex items-center gap-2">
                <time className="text-caption font-medium text-text-secondary">{item.date}</time>
                <StatusBadge set="Dated records" state={item.state} />
              </div>
              <h3 className="font-display text-h4 text-text-primary">{item.title}</h3>
              {item.text !== undefined && (
                <p className="text-sm text-text-secondary">{item.text}</p>
              )}
            </div>
            {item.action !== undefined && <div className="-mt-2 flex-none">{item.action}</div>}
          </li>
        );
      })}
    </ol>
  );
}
