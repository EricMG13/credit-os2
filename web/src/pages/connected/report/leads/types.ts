import type { FC } from "react";
import type { OutputEntry, PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";

/** What a module's lead visual is given: the run, and the module's own selected output. */
export interface LeadProps {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReportView;
  entry: OutputEntry;
  entryIndex: number;
}

/** A kind of drawing a module's output publishes: chart figures, event lanes, relationship maps. */
export type LeadKind = "figures" | "events" | "maps";

/**
 * A module's lead visual. `draws` lists the kinds it draws itself: the page frame draws every kind
 * not listed, so each figure is drawn once. A drawing section written as prose is the frame's in
 * every case, so a lead draws no tile for it.
 */
export type Lead = FC<LeadProps> & { draws?: readonly LeadKind[] };

/** A stage's lead visuals, keyed by module code ("CP-1"). A module without one draws none. */
export type Leads = Record<string, Lead>;
