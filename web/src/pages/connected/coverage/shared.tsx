import { moduleName } from "../api";
import { type CellState, type CoverageRun } from "../coverageData";
import { containsReference, readerText } from "../publishedReport";
import { asOfDate } from "../runFigures";

export const STATE_WORDS: Record<CellState, string> = {
  assessed: "Delivered",
  "not-assessable": "Not assessable",
  unreadable: "Unreadable",
  "no-handoff": "No output published",
  "not-in-pathway": "Not asked for in this run",
  "plan-unknown": "No output; run plan not recorded",
};

/**
 * Module prose for a working page, by the reader's own rule: Markdown marks dropped and module
 * codes named; nothing when the text carries a source reference, which is read in Evidence.
 */
export function prose(text: string | undefined): string | null {
  const plain = (text ?? "").replaceAll("**", "").replaceAll("`", "");
  return plain === "" || containsReference(plain) ? null : readerText(plain);
}

export const IN_EVIDENCE = "Read this in Evidence.";

export const reportPath = (folder: string) => `/report/${encodeURIComponent(folder)}`;
export const tableBox =
  "overflow-x-auto rounded-ds-lg border border-border-subtle bg-surface-card";
export const th = "p-3 text-left align-bottom font-medium text-text-secondary";

/** The module's name as the rest of the app says it; the service's title where the app has none. */
export function named(column: { code: string; title: string }, pathway?: string | null) {
  const name = moduleName(column.code, pathway);
  return name === column.code ? column.title : name;
}

export function RunLine({ run }: { run: CoverageRun }) {
  return (
    <span className="text-small font-normal text-text-secondary">
      {run.pathwayTitle ?? "Pathway not recorded"}
      {", as of "}
      {run.asOf ? <time dateTime={run.asOf}>{asOfDate(run.asOf)}</time> : "a date not recorded"}
      {run.sharedWith
        ? `; ${String(run.sharedWith)} other ${run.sharedWith === 1 ? "run shares" : "runs share"} this date`
        : ""}
    </span>
  );
}

/** A text link's hit area: 32 px, 44 px on a phone; the text stays small. */
export const HIT = "inline-flex min-h-8 items-center max-[480px]:min-h-11";

/** A run's pathway and as-of date, and how many other runs share the date, as plain text for a tooltip. */
export function runText(run: CoverageRun): string {
  const shared = run.sharedWith
    ? `; ${String(run.sharedWith)} other ${run.sharedWith === 1 ? "run shares" : "runs share"} this date`
    : "";
  return `${run.pathwayTitle ?? "Pathway not recorded"}, as of ${run.asOf ? asOfDate(run.asOf) : "a date not recorded"}${shared}`;
}
