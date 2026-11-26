import type { PublishedRun } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { moduleState } from "../../reportView";
import { decisionActions, scopedLead } from "../frontPage";
import { passageBlocks, sectionBlocks, type Passage, type PassageTable } from "./read";

/**
 * The run as the Overview reads it. The lead is the run's published credit view, matched exactly
 * by output, hash and line, and only for a verified publication: never a committee or relative
 * value passage, which can state a decision no run records a clearance for.
 */
export function overviewView(view: ReportView, run: PublishedRun): ReportView {
  const lead = run.publicationVerified === true ? scopedLead(view, run)?.entry : undefined;
  return { ...view, lead };
}

/**
 * A test preview may show a retained CP-2 passage with its own trace when it is readable and
 * selected. It never changes the verified-publication lead above, or any of the other Overview rows.
 */
export function retainedPreviewLead(view: ReportView, run: PublishedRun, preview: boolean) {
  if (!preview || run.publicationVerified === true || view.folder !== run.folder) return undefined;
  return view.entries.find(
    (entry) =>
      entry.selected &&
      entry.output.module === "CP-2" &&
      entry.output.id.trim() !== "" &&
      entry.output.sha256.trim() !== "" &&
      !entry.output.parseError &&
      moduleState(entry) !== "Not assessable" &&
      passageBlocks(entry, "Bottom line").length > 0,
  );
}

/** The decision modules with a recorded hold: their limitations can restate the held decision. */
export function heldModules(view: ReportView, run: PublishedRun): string[] {
  return decisionActions(view, run).flatMap(({ held, module }) => (held ? [module] : []));
}

const LEDGER_POINTER = /; the specific evidence restrictions are recorded in the gaps ledger\./gi;

/**
 * The call's paragraphs and the passage they come from: the published lead paragraph first, then
 * the rest of its passage in the module's order. Empty when the lead paragraph is not found where
 * it was published.
 */
export function callBlocks(
  view: ReportView,
  run: PublishedRun,
  retainedPreview = false,
): { heading: string; blocks: (Passage | PassageTable)[] } {
  const lead = view.lead;
  const verifiedLine =
    run.publicationVerified === true && lead ? scopedLead(view, run)?.passage.line : undefined;
  const retainedLine =
    retainedPreview && run.publicationVerified !== true && lead?.output.module === "CP-2"
      ? passageBlocks(lead, "Bottom line")[0]?.line
      : undefined;
  const line = verifiedLine ?? retainedLine;
  const section =
    lead && line !== undefined
      ? lead.sections.find(({ blocks }) => blocks.some((block) => block.line === line))
      : undefined;
  if (!lead || !section) return { heading: "", blocks: [] };
  // The lead's own section: a reader passage or a finding, as the publication named it.
  const blocks = sectionBlocks(section);
  const at = blocks.findIndex((block) => block.line === line);
  if (at < 0) return { heading: section.heading, blocks: [] };
  // The lead in the same words as the PDF and the Library draw it: no pointer to the gaps ledger.
  const [first, ...rest] = blocks.slice(at);
  const opening =
    first && "text" in first && first.text !== null
      ? { ...first, text: first.text.replaceAll(LEDGER_POINTER, ".") }
      : first;
  return { heading: section.heading, blocks: opening ? [opening, ...rest] : [] };
}
