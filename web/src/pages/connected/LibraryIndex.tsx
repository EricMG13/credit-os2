import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowUp, BookOpen01, SearchLg } from "@untitledui/icons";
import { Alert } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Skeleton } from "@/components/gap/Skeleton";
import { Callout } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { PageHeader } from "../../shell/PageHeader";
import { card } from "./layout";
import { useCanStart } from "./startAction";
import { getLibraryIndex, type LibraryIndex } from "./publishedReport";
import { isUnreachable } from "./useResource";
import { ChipGroup } from "@/components/kit/Chip";
import {
  groupIssuers,
  libraryChoices,
  matchesQuery,
  RUN_STATES,
  sectorSlots,
  type IssuerGroup,
  type SectorSlot,
} from "./libraryRows/group";
import { figureChange, figureName } from "./libraryRows/FigureMark";
import { Legend, type LegendColour, type LegendEntry } from "./report/leads/kit/marks/Legend";
import { BETTER, WORSE } from "./visuals/signal/scales";
import { FIGURE_KEYS, IssuerRow, ROW_COLUMNS } from "./libraryRows/IssuerRow";
import { stated } from "./reportView";

type LibraryFilters = { query: string; sector: string; pathway: string; state: string };

function filtersFromAddress(): LibraryFilters {
  const query = new URLSearchParams(window.location.search);
  return {
    query: query.get("q") ?? "",
    sector: query.get("sector") ?? "all",
    pathway: query.get("pathway") ?? "all",
    state: query.get("state") ?? "all",
  };
}

/** Whether a row draws a tint or an arrow-only cell, which the tint legend explains. */
function drawsChange({ newest }: IssuerGroup) {
  return FIGURE_KEYS.some((key) => {
    const change = figureChange(key, newest.metrics[key]);
    return (
      change !== undefined &&
      (change.kind === "better" ||
        change.kind === "worse" ||
        change.sign === 1 ||
        change.sign === -1)
    );
  });
}

function TintSwatch({ colour }: { colour: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: colour }}
      className="size-3 rounded-ds-xs border border-border-hairline"
    />
  );
}

/** A sector slot as the legend names its colour. */
const CATEGORY = {
  3: "category-3",
  4: "category-4",
  5: "category-5",
  6: "category-6",
  8: "category-8",
} as const satisfies Record<SectorSlot, LegendColour>;

/** What a tinted cell and a grey arrow mean, in words beside each swatch. */
function TintLegend() {
  return (
    <div role="group" aria-label="Tint colours">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-secondary">
        <li className="inline-flex items-center gap-1.5">
          <TintSwatch colour={BETTER[1]} />
          <span>Green: better</span>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <TintSwatch colour={WORSE[1]} />
          <span>Orange: worse</span>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <ArrowUp aria-hidden="true" className="size-3 flex-none text-text-secondary" />
          <span>Grey arrow: no better or worse is drawn</span>
        </li>
      </ul>
    </div>
  );
}

function MatchRuns({
  snapshot,
  filters,
  setFilters,
}: {
  snapshot: LibraryIndex;
  filters: LibraryFilters;
  setFilters: Dispatch<SetStateAction<LibraryFilters>>;
}) {
  const search = useRef<HTMLInputElement>(null);
  // A pathway filter changes which run stands for each issuer, so the groups follow it.
  const groups = groupIssuers(snapshot, filters.pathway);
  const { sectors, pathways } = libraryChoices(snapshot);
  const states = RUN_STATES.filter((state) => groups.some((group) => group.state === state));
  const rows = groups.filter(
    (group) =>
      matchesQuery(group, filters.query) &&
      (filters.sector === "all" || group.newest.sector === filters.sector) &&
      (filters.state === "all" || group.state === filters.state),
  );
  // The column header carries the qualified label when every row that states the figure shares it.
  const stating = rows.filter((group) => stated(group.newest.metrics.coverage));
  const coverageName = figureName(
    "coverage",
    "Interest cover",
    stating[0]?.newest.metrics.coverage,
  );
  const coverageInHeader =
    coverageName !== "Interest cover" &&
    stating.every(
      (group) =>
        figureName("coverage", "Interest cover", group.newest.metrics.coverage) === coverageName,
    );
  const slots = sectorSlots(snapshot);
  const shownSectors = new Set(rows.map((group) => group.newest.sector).filter(Boolean));
  const sectorLegend: LegendEntry[] = [...slots]
    .filter(([sector]) => shownSectors.has(sector))
    .map(([sector, slot]) => ({
      kind: "dot",
      tone: CATEGORY[slot],
      text: sector,
    }));
  const tinted = rows.some(drawsChange);
  const choose = (change: Partial<LibraryFilters>) => {
    setFilters((previous) => ({ ...previous, ...change }));
  };
  return (
    <div className="grid min-w-0 gap-4">
      <label className="relative block max-w-2xl">
        <span className="sr-only">Search issuers</span>
        <SearchLg
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary"
        />
        <input
          ref={search}
          type="search"
          aria-label="Search issuers"
          placeholder="Search issuers, sectors, dates"
          value={filters.query}
          onChange={(event) => {
            choose({ query: event.currentTarget.value });
          }}
          className="h-10 w-full rounded-ds-md border border-border-control bg-surface-canvas pr-3 pl-9 text-body text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus max-[480px]:min-h-11"
        />
      </label>
      {/* A group with nothing to choose filters nothing, so it is not drawn. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {(sectors.length > 0 || filters.sector !== "all") && (
          <ChipGroup
            label="Sector"
            choices={sectors}
            value={filters.sector}
            onChange={(sector) => {
              choose({ sector });
            }}
          />
        )}
        {(pathways.length > 0 || filters.pathway !== "all") && (
          <ChipGroup
            label="Pathway"
            choices={pathways}
            value={filters.pathway}
            onChange={(pathway) => {
              choose({ pathway });
            }}
          />
        )}
        {(states.length > 0 || filters.state !== "all") && (
          <ChipGroup
            label="State"
            choices={states}
            value={filters.state}
            onChange={(state) => {
              choose({ state });
            }}
          />
        )}
      </div>
      {(sectorLegend.length > 0 || tinted) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {sectorLegend.length > 0 && (
            <div role="group" aria-label="Sector colours">
              <Legend items={sectorLegend} />
            </div>
          )}
          {tinted && <TintLegend />}
        </div>
      )}
      {rows.length === 0 ? (
        <div className={`${card} items-start`}>
          <p role="status">No issuers match these filters.</p>
          <Button
            color="secondary"
            onPress={() => {
              choose({ query: "", sector: "all", pathway: "all", state: "all" });
              search.current?.focus();
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          <div
            aria-hidden="true"
            className={`hidden gap-x-4 px-5 text-caption text-text-tertiary xl:grid ${ROW_COLUMNS}`}
          >
            <span className="pl-9">Issuer</span>
            <span>Decision</span>
            <span className="px-2">Net leverage</span>
            <span className="px-2">{coverageInHeader ? coverageName : "Interest cover"}</span>
            <span className="px-2">Liquidity (cash)</span>
            <span>Run</span>
            <span>Next event</span>
          </div>
          <h2 className="sr-only">Issuers</h2>
          <ul aria-label="Issuers" className="grid gap-2">
            {rows.map((group) => (
              <IssuerRow
                key={group.key}
                group={group}
                coverageInHeader={coverageInHeader}
                sectorSlot={slots.get(group.newest.sector)}
              />
            ))}
          </ul>
          <p className="reading-copy max-w-3xl text-caption text-text-tertiary">
            Decision: the Library shows a committee decision only with a recorded clearance. A
            report’s Committee decision page shows what the module wrote.
          </p>
        </div>
      )}
    </div>
  );
}

/** How reading the library failed: the request never arrived, or the service could not give it. */
type Problem = "unreachable" | "failed";
const PROBLEMS = {
  unreachable: {
    title: "The service cannot be reached",
    text: "Check that the Credit OS service is running, then try again.",
  },
  failed: {
    title: "The library could not be loaded",
    text: "Try again. If the library still won’t open, ask the person running Credit OS to check it.",
  },
} as const;

/** The library index, asked for again by `retry`; a failure stays on screen until the next answer. */
function useLibrary() {
  const [value, setValue] = useState<LibraryIndex | null>();
  const [problem, setProblem] = useState<Problem>();
  const [attempts, setAttempts] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getLibraryIndex(controller.signal).then(
      (index) => {
        if (controller.signal.aborted) return;
        setValue(index);
        setProblem(undefined);
      },
      (failure: unknown) => {
        if (!controller.signal.aborted)
          setProblem(isUnreachable(failure) ? "unreachable" : "failed");
      },
    );
    return () => {
      controller.abort();
    };
  }, [attempts]);
  const retry = () => {
    setAttempts((count) => count + 1);
  };
  return { value, problem, retry };
}

function EmptyLibrary({ readOnly }: { readOnly: boolean }) {
  return (
    <EmptyState>
      <EmptyState.Header>
        <EmptyState.FeaturedIcon icon={BookOpen01} />
      </EmptyState.Header>
      <EmptyState.Content>
        <EmptyState.Title>No reports yet</EmptyState.Title>
        <EmptyState.Description>
          Reports appear here after they’re published.
          {readOnly ? "" : " Start a run to publish the first."}
        </EmptyState.Description>
      </EmptyState.Content>
      {!readOnly && (
        <EmptyState.Footer>
          <Button href="/start">Start a run</Button>
        </EmptyState.Footer>
      )}
    </EmptyState>
  );
}

export { resetCardFindings } from "./libraryRows/CreditView";

export function ReportLibrary({ readOnly = false }: { readOnly?: boolean }) {
  const { value, problem, retry } = useLibrary();
  const [filters, setFilters] = useState<LibraryFilters>(filtersFromAddress);
  useEffect(() => {
    document.title = "Library — Credit OS";
  }, []);
  useEffect(() => {
    const address = new URL(window.location.href);
    const values = {
      q: filters.query,
      sector: filters.sector,
      pathway: filters.pathway,
      state: filters.state,
    };
    address.searchParams.delete("layout");
    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "all") address.searchParams.delete(key);
      else address.searchParams.set(key, value);
    }
    window.history.replaceState(window.history.state, "", address);
  }, [filters]);
  // No index and an index with no report are one state; with nothing to filter, no filter is shown.
  const canStart = useCanStart(readOnly, Boolean(value?.preview));
  const empty = value === null || value?.catalogue.real.length === 0;
  return (
    <>
      <PageHeader title="Library" />
      <section className="mt-6 grid gap-4">
        {problem && (
          <Alert
            tone="error"
            title={PROBLEMS[problem].title}
            action={
              <Button size="sm" color="secondary" onPress={retry}>
                Try again
              </Button>
            }
          >
            {PROBLEMS[problem].text}
          </Alert>
        )}
        {value === undefined && !problem && (
          <div role="status" aria-label="Loading reports" className="grid gap-2">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className={`grid gap-4 rounded-ds-lg border border-border-subtle bg-surface-card p-4 sm:p-5 ${ROW_COLUMNS}`}
              >
                <Skeleton lines={3} />
                <div className="h-6 rounded-ds-xs bg-surface-subtle" />
                {[0, 1, 2].map((cell) => (
                  <div key={cell} className="h-16 rounded-ds-sm bg-surface-subtle" />
                ))}
                <div className="h-6 rounded-ds-xs bg-surface-subtle" />
                <div className="h-6 rounded-ds-xs bg-surface-subtle" />
              </div>
            ))}
          </div>
        )}
        {value?.preview && <Callout title="Test preview">{value.preview.reason}</Callout>}
        {empty && <EmptyLibrary readOnly={!canStart} />}
        {value && !empty && (
          <MatchRuns snapshot={value} filters={filters} setFilters={setFilters} />
        )}
      </section>
    </>
  );
}
