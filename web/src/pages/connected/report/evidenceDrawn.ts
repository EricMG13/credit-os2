import {
  classifySections,
  FORECAST_INPUTS,
  sectionContainsLine,
  type OutputEntry,
  type Section,
} from "../publishedReport";

/**
 * The sections of a handoff Evidence may search and draw. A section written for another module
 * (Next module, Request, Consumer readiness, downstream owners) is drawn nowhere; the one
 * exception is CP-2G's forecast inputs, which Evidence draws as the model's recorded inputs.
 */
export function drawnSections(entry: OutputEntry): Section[] {
  return classifySections(entry.sections)
    .filter(
      ({ role, section }) =>
        role !== "hidden" ||
        (entry.output.module === "CP-2G" && section.heading === FORECAST_INPUTS),
    )
    .map(({ section }) => section);
}

/** True when the line sits in a section of the handoff that Evidence never draws. */
export function lineIsHidden(entry: OutputEntry, line: number) {
  const drawn = new Set(drawnSections(entry));
  return entry.sections.some(
    (section) => sectionContainsLine(section, line) && !drawn.has(section),
  );
}
