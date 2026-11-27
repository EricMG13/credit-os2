import { Fragment } from "react";
import { Missing } from "@/components/gap/Missing";
import type { PipelineNode, PipelineStage, PipelineState } from "@/components/pipeline";
import type { Figure as RunFigure, ModuleStep, ModuleWord } from "../run/slice-activity";
import { Figure, GapNote, Well } from "./report/overview/Tile";
import { byStage } from "./report/stages";
import { CapBandKey, CapReading, Meter } from "./runMeter";

const REPORT = "Report";

const STATE: Record<ModuleWord, PipelineState> = {
  Finished: "delivered",
  Running: "running",
  Queued: "queued",
  "Not run": "queued",
  "Not assessable": "blocked",
  Interrupted: "failed",
};

/**
 * The run's modules as the five stages the report uses, then the report's own delivery as a last
 * stage. `modules` and `steps` are the same list (the run's own order), one row each.
 */
export function pipelineStages(
  modules: readonly (readonly [string, string])[],
  steps: readonly ModuleStep[],
): PipelineStage[] {
  const nodes: (PipelineNode & { report: boolean })[] = steps.flatMap((step, index) => {
    const code = modules[index]?.[0];
    if (step.kind !== "module" || code === undefined) return [];
    return [
      {
        id: code,
        name: step.name,
        state: STATE[step.state],
        word: step.state,
        ...(step.detail === null ? {} : { detail: step.detail }),
        report: code === REPORT,
      },
    ];
  });
  const analytical = nodes.filter((node) => !node.report);
  const stages = byStage(analytical).map(({ name, rows }) => ({ name, nodes: rows }));
  const delivery = nodes.filter((node) => node.report);
  return delivery.length > 0 ? [...stages, { name: "Report delivery", nodes: delivery }] : stages;
}

/** Where the run stopped, as the record marks it: the module the checks stopped it at (alone, the
 * others in flight being bystanders) or, for a run that was lost, the modules it was running. */
export function stoppedAt(steps: readonly ModuleStep[]): {
  names: string[];
  detail: string | null;
} {
  const modules = steps.filter((step) => step.kind === "module");
  const refused = modules.find((step) => step.detail !== null);
  if (refused) return { names: [refused.name], detail: refused.detail };
  return {
    names: modules.filter((step) => step.state === "Interrupted").map((step) => step.name),
    detail: null,
  };
}

/** The header band of the pipeline tile: spend first in reading order, beside the title from lg up. */
export const HEADER_GRID = "grid gap-2 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start";
export const HEADER_BLOCK = "grid min-w-0 gap-2 lg:col-start-1 lg:row-start-1";
export const SPEND_BLOCK = "min-w-0 lg:col-start-2 lg:row-start-1";

type SpendParts = { cap: string | null; settled: string | null; held: string | null };

/**
 * Spend against the cap: the amount "of" the cap, one meter, then settled and reserved as two
 * items. The full sentence is the meter's text for assistive technology only.
 */
export function SpendBlock({
  spend,
  parts,
  label = "Spend",
}: {
  spend: RunFigure;
  parts: SpendParts;
  label?: string;
}) {
  const metered = spend.value !== null && spend.bar !== null;
  return (
    <section aria-label={label} className={SPEND_BLOCK}>
      <Well className="flex flex-col gap-2 border border-border-hairline p-3">
        <p className="text-caption text-text-tertiary">Spend against the cap</p>
        {spend.value !== null && (
          <p className="flex flex-wrap items-baseline gap-x-2 text-small text-text-secondary">
            <Figure className="text-h3 font-medium">{spend.value}</Figure>
            {metered && parts.cap !== null && (
              <span>
                of <Figure className="text-text-secondary">{parts.cap}</Figure>
              </span>
            )}
          </p>
        )}
        {spend.value === null ? (
          <GapNote>{spend.bar === null ? spend.note : "Spend is not known"}</GapNote>
        ) : spend.bar === null ? (
          <span className="text-small text-text-tertiary">{spend.note}</span>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Meter
                value={spend.bar.value}
                max={spend.bar.max}
                name="Spend against cap"
                valueText={spend.bar.label}
                limit
              />
              <CapReading value={spend.bar.value} max={spend.bar.max} />
            </div>
            <CapBandKey />
            {parts.settled !== null && parts.held !== null && (
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-secondary">
                {[
                  ["Settled", parts.settled],
                  ["Reserved or unknown", parts.held],
                ].map(([term, value]) => (
                  <div key={term} className="flex items-baseline gap-1.5">
                    <dt>{term}</dt>
                    <dd>
                      <Figure className="text-caption">{value}</Figure>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
      </Well>
    </section>
  );
}

/** How long the run has been going, as its record states it: numerals in mono, units in text. */
export function ElapsedLine({ elapsed }: { elapsed: { value: string | null; note: string } }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 text-small text-text-secondary">
      <span>Elapsed</span>
      <span className="font-medium text-text-primary">
        {elapsed.value === null ? (
          <Missing />
        ) : (
          elapsed.value.split(" ").map((token, index) => (
            <Fragment key={index}>
              {index > 0 && " "}
              {/^\d+$/.test(token) ? <Figure>{token}</Figure> : token}
            </Fragment>
          ))
        )}
      </span>
      <span className="text-text-tertiary">{elapsed.note}</span>
    </p>
  );
}
