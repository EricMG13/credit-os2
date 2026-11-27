import type { OutputEntry } from "../../publishedReport";
import { drawnSections } from "../evidenceDrawn";

/**
 * A handoff line the trace drawer resolves for a tile with no figure table of its own: the first
 * block of the named section, else of the Bottom line (where a blocked module states why), else
 * of the first section that has one. Sections Evidence never draws are skipped throughout.
 */
export function entryLine(entry: OutputEntry | undefined, heading = "Bottom line") {
  if (!entry) return undefined;
  const drawn = drawnSections(entry);
  const named = (name: string) => drawn.find((section) => section.heading === name);
  const sections = [named(heading), named("Bottom line"), ...drawn];
  return sections.find((section) => section?.blocks.length)?.blocks[0]?.line;
}
