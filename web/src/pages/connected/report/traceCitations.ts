import type { TraceCitation } from "@/pages/library/parts/TraceParts";
import { handoffBlockAt, traceDetails } from "../ReportContent";
import { citedSourcePages, sourceCitationNote } from "../sourceFiles";
import type { OutputEntry, Snapshot } from "../publishedReport";

/**
 * The citations a handoff line carries, one per recorded source chip: file, attested pages, the
 * quoted passage and the chip's own reason. Generated placeholders that cite nothing are left out.
 * Empty when the line carries none; the line must exist in the handoff.
 */
export function citationsAt(snapshot: Snapshot, entry: OutputEntry, line: number): TraceCitation[] {
  const found = handoffBlockAt(entry, line);
  if (!found) return [];
  const folder = entry.output.id.split("/")[0] ?? "";
  return traceDetails(snapshot, entry, found.section, found.block, line)
    .chips.filter(
      (chip) =>
        !(chip.label === "no page" && !chip.file && !chip.sha256 && !chip.quote && !chip.excerpt),
    )
    .map((chip) => ({
      label: chip.label ?? chip.source ?? chip.file ?? "Citation",
      file: chip.file ?? chip.source,
      pages: citedSourcePages(folder, chip),
      quote: chip.excerpt ?? chip.quote,
      reason: sourceCitationNote(chip),
      sha256: chip.sha256,
    }));
}
