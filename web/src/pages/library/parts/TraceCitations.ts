import { createContext, useContext } from "react";
import type { SourcedTrace, TraceCitation } from "./TraceParts";

/**
 * Where a report page can look up the citations of the handoff line a trace points at, so every
 * drawer opened on that page says the same thing as the Evidence page. Absent outside a report:
 * a trace there does not know its citations.
 */
export const TraceCitations = createContext<
  ((evidenceItem: string) => TraceCitation[] | undefined) | null
>(null);

/** The trace with its citations: its own where it carries them, else the page's lookup by address. */
export function useSourcedTrace(trace: SourcedTrace): SourcedTrace {
  const lookup = useContext(TraceCitations);
  if (trace.citations !== undefined || lookup === null) return trace;
  const citations = lookup(trace.evidenceItem);
  return citations === undefined ? trace : { ...trace, citations };
}
