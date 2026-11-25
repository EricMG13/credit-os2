import { TraceControl } from "@/pages/library/parts/TraceControl";
import type { OutputEntry } from "../publishedReport";

/**
 * The module's published confidence score as a meter from 0 to 100 with its band and one trace
 * control; the reason in words, with the same trace, when the score is missing; nothing for a run
 * that predates it.
 */
export function ModuleConfidence({
  confidence,
  trace,
}: {
  confidence: OutputEntry["output"]["confidence"];
  trace?: string | null;
}) {
  if (!confidence) return null;
  const control = <TraceControl trace={trace} label="Show sources for the confidence score" />;
  if ("missing" in confidence)
    return (
      <div
        role="group"
        aria-label="Confidence score"
        className="flex w-full min-w-0 flex-col gap-1 lg:w-60"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-caption text-text-tertiary">Confidence</span>
          {control}
        </div>
        <span className="text-small text-gap-text">Not scored: {confidence.missing}</span>
      </div>
    );
  const { value, band } = confidence;
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      role="group"
      aria-label="Confidence score"
      className="flex w-full min-w-0 flex-col gap-1.5 lg:w-60"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-caption text-text-tertiary">Confidence</span>
        {control}
      </div>
      <p className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-mono text-h3 font-medium text-text-primary tabular-nums">
          {value}
        </span>{" "}
        <span className="font-mono text-caption text-text-tertiary">/ 100</span>
      </p>
      <span aria-hidden="true" className="h-1.5 w-full rounded-ds-full bg-surface-subtle">
        <span
          className="block h-full rounded-ds-full bg-action"
          style={{ width: `${String(width)}%` }}
        />
      </span>
      <span className="text-small font-medium text-text-secondary">{band}</span>
    </div>
  );
}
