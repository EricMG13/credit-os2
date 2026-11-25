import { useEffect, useId, useRef, useState } from "react";
import { StatusShape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import { Figure, Tile } from "../report/overview/Tile";
import type { ReadinessRow } from "./intake";
import type { ModuleReadiness } from "./moduleReadiness";
import { StagePipeline } from "./StagePipeline";

/** Where the module marks come from: none yet, the review on screen, or the last one left. */
export type ReadinessSource = "unchecked" | "review" | "last";

const SOURCE_NOTE: Record<ReadinessSource, string> = {
  unchecked: "Each module is checked against your documents when you review the run.",
  review: "As the service checked them for this review.",
  last: "From your last review. Review the run again to check changes.",
};

/**
 * Met or not met, in words with a mark. Not the "Met or not met" set's triangle: in this rail the
 * orange triangle is a module's "Limited", so a step still to do is a neutral hollow square.
 */
function MetMark({ met }: { met: boolean }) {
  return (
    <span className="inline-flex min-w-19 items-center gap-1.5 text-small font-medium text-text-secondary">
      <span
        aria-hidden="true"
        className={cx(
          "flex size-2.5 [&>svg]:size-full",
          met ? "text-success-mark" : "text-text-tertiary",
        )}
      >
        <StatusShape shape={met ? "filled circle" : "hollow square"} />
      </span>
      {met ? "Met" : "Not met"}
    </span>
  );
}

/** Whether the element is taller than the room it has, so it scrolls and needs a tab stop. */
function useScrolls<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const check = () => {
      setScrolls(node.scrollHeight > node.clientHeight);
    };
    const observer = new ResizeObserver(check);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    check();
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, scrolls };
}

/**
 * The persistent readiness rail: the spending cap as its largest figure (nothing is spent before
 * Submit, so no meter), what Submit still needs, and the run's stages with a mark per module.
 */
export function ReadinessRail({
  rows,
  cap,
  capTitle,
  pathway,
  modules,
  source,
  stagesInReview = false,
}: {
  rows: readonly ReadinessRow[];
  /** The selected pathway's cap as the page shows it, "USD 30.00"; null when unavailable. */
  cap: string | null;
  capTitle: string;
  /** The pathway's name, as the cards show it. */
  pathway: string;
  modules: ModuleReadiness;
  source: ReadinessSource;
  /**
   * Whether the review tile draws the stages itself (below xl, where the rail sits under the
   * form): the rail's own Modules tile then shows only from xl, so the stages are drawn once.
   */
  stagesInReview?: boolean;
}) {
  const needsId = useId();
  const { ref, scrolls } = useScrolls<HTMLElement>();
  return (
    <aside
      ref={ref}
      aria-label="Readiness"
      className="flex min-w-0 flex-col gap-4 lg:col-span-12 xl:sticky xl:top-6 xl:col-span-4 xl:max-h-[calc(100dvh-6rem)] xl:self-start xl:overflow-y-auto"
      // When the rail is taller than the window it scrolls on its own; then the keyboard can reach it.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={scrolls ? 0 : undefined}
    >
      <Tile span={12} label="Spending cap and what Submit needs">
        <h2 className="text-h4 font-medium text-text-primary">Readiness</h2>
        <div className="flex flex-col gap-1">
          <p className="text-caption text-text-tertiary">{capTitle}</p>
          {cap ? (
            <>
              {/* On the review the sheet's own cost figure is the page's one metric. */}
              <Figure className={cx(stagesInReview ? "text-h4" : "text-metric", "font-medium")}>
                {cap}
              </Figure>
              <p className="text-small text-text-secondary">{`Cap · ${pathway}`}</p>
            </>
          ) : (
            <p className="text-small text-text-secondary">Unavailable</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p id={needsId} className="text-caption text-text-tertiary">
            Before Submit
          </p>
          <ul aria-labelledby={needsId} className="flex flex-col divide-y divide-border-hairline">
            {rows.map((row) => (
              <li key={row.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <MetMark met={row.met} />
                <span className="text-small font-medium text-text-primary">{row.label}</span>
                {row.detail ? (
                  <span className="ml-auto font-mono text-small text-text-secondary tabular-nums">
                    {row.detail}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </Tile>
      <Tile
        span={12}
        label="Modules by stage"
        kicker={`${String(modules.count)} ${modules.count === 1 ? "module" : "modules"} · ${pathway}`}
        title="Modules"
        {...(stagesInReview ? { className: "max-xl:hidden" } : {})}
      >
        <p className="text-caption text-text-secondary">{SOURCE_NOTE[source]}</p>
        <StagePipeline readiness={modules} label="Stages" />
      </Tile>
    </aside>
  );
}
