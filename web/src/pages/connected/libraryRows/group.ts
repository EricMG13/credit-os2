import { runPathway, type CatalogueRun, type LibraryIndex } from "../publishedReport";
import {
  isIssuerAssessment,
  issuerGroups,
  relatedIssuerReports,
  scopeLabel,
  selectIssuerEntry,
} from "../issuerEntry";

export type LibraryRun = LibraryIndex["workspace"]["runs"][string];
export type RunState = "Delivered" | "Test preview" | "No report published";

/** Another published report of the issuer the row links to: newer, or of the same as-of date. */
type RelatedReport = { catalogue: CatalogueRun; run: LibraryRun; timing: string };

/** One issuer of the library: its runs newest first, and what its selected run says about itself. */
export type IssuerGroup = {
  key: string;
  /** Newest first. */
  entries: CatalogueRun[];
  /**
   * The run the row draws: the newest verified Full or Deep assessment, else the newest verified
   * Lite, else the newest published run; under a pathway filter, the newest run of that pathway.
   */
  newest: CatalogueRun;
  /** The selected run when it has a published report to open, else the newest that has one. */
  linked: CatalogueRun | undefined;
  /** The ids of the runs that have a published report to open. */
  openable: ReadonlySet<string>;
  /** The selected run's published record, when it has one. */
  published: LibraryRun | undefined;
  pathway: string;
  state: RunState;
  /** The selected run's scope in words, when it is published. */
  scope: string | undefined;
  /** Unfiltered, the issuer has no verified assessment, so the row says so. */
  assessmentUnavailable: boolean;
  related: RelatedReport[];
  /** The runs a search reads: every candidate run, as the selection had them. */
  searched: CatalogueRun[];
};

export const RUN_STATES: readonly RunState[] = ["Delivered", "Test preview", "No report published"];

/** The sectors and pathways of every run in the library, for the filters; a pathway filter does not narrow them. */
export function libraryChoices(index: LibraryIndex): { sectors: string[]; pathways: string[] } {
  const items = [...issuerGroups(index).values()].flat();
  const distinct = (values: string[]) => [...new Set(values)].filter(Boolean).sort();
  return {
    sectors: distinct(items.map(({ catalogue }) => catalogue.sector)),
    pathways: distinct(
      items.map(({ run, catalogue }) => runPathway(run ?? { pathway: null }, catalogue)),
    ),
  };
}

/** The category slots (1 to 8) a sector dot may take: 1, 2 and 7 are left to better, worse and chrome. */
const SECTOR_SLOTS = [3, 4, 5, 6, 8] as const;

/**
 * Each sector's category slot: the distinct, non-empty sectors in the order the service first
 * listed them, unfiltered, so a filter never changes a colour; the first five take slots 3, 4, 5,
 * 6, 8 and every further sector takes slot 8.
 */
export function sectorSlots(index: LibraryIndex): Map<string, number> {
  const sectors = [...issuerGroups(index).values()]
    .flat()
    .map(({ catalogue }) => catalogue.sector)
    .filter(Boolean);
  return new Map(
    [...new Set(sectors)].map((sector, at) => [sector, SECTOR_SLOTS[at] ?? 8] as const),
  );
}

/**
 * One group per issuer, in the order the service first listed the issuer. With `pathway` other
 * than "all", only that pathway's runs are candidates and an issuer with none is left out.
 */
export function groupIssuers(index: LibraryIndex, pathway = "all"): IssuerGroup[] {
  const filtered = pathway !== "all";
  return [...issuerGroups(index)].flatMap(([key, items]) => {
    const candidates = filtered
      ? items.filter(
          ({ run, catalogue }) => runPathway(run ?? { pathway: null }, catalogue) === pathway,
        )
      : items;
    const selected = selectIssuerEntry(candidates, filtered);
    if (!selected) return [];
    const entries = items
      .map(({ catalogue }) => catalogue)
      .sort((a, b) => b.date.localeCompare(a.date));
    const openable = new Set(items.flatMap(({ run, catalogue }) => (run ? [catalogue.id] : [])));
    const published = selected.run;
    const state: RunState = !published
      ? "No report published"
      : index.preview
        ? "Test preview"
        : "Delivered";
    return [
      {
        key,
        entries,
        newest: selected.catalogue,
        linked: published ? selected.catalogue : entries.find((entry) => openable.has(entry.id)),
        openable,
        published,
        pathway: runPathway(published ?? { pathway: null }, selected.catalogue),
        state,
        scope: published ? scopeLabel(published) : undefined,
        assessmentUnavailable: !filtered && !isIssuerAssessment(published),
        related: relatedIssuerReports(items, selected).flatMap(({ catalogue, run, timing }) =>
          run ? [{ catalogue, run, timing }] : [],
        ),
        searched: candidates.map(({ catalogue }) => catalogue),
      },
    ];
  });
}

/** Whether any candidate run's name, sector, period or date holds the typed words. */
export function matchesQuery(group: IssuerGroup, query: string): boolean {
  const wanted = query.trim().toLowerCase();
  return group.searched.some((run) =>
    [run.name, run.issuer, run.title, run.sector, run.period, run.date].some((value) =>
      value.toLowerCase().includes(wanted),
    ),
  );
}
