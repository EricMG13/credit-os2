import type { OutputEntry } from "../../publishedReport";

/**
 * A handoff line the trace drawer resolves for a tile with no figure table of its own: the first
 * block of the named section, else of the Bottom line (where a blocked module states why), else
 * of the first section that has one.
 */
export function entryLine(entry: OutputEntry | undefined, heading = "Bottom line") {
  if (!entry) return undefined;
  const named = (name: string) => entry.sections.find((section) => section.heading === name);
  const sections = [named(heading), named("Bottom line"), ...entry.sections];
  return sections.find((section) => section?.blocks.length)?.blocks[0]?.line;
}
