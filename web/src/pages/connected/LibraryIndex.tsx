import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowRight, BookOpen01, FileSearch02 } from "@untitledui/icons";
import { Alert } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Skeleton } from "@/components/gap/Skeleton";
import { Callout } from "@/components/alert/Alert";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { PageHeader } from "../../shell/PageHeader";
import { TextLink } from "../run/TextLink";
import { card, field, heading, label } from "./layout";
import {
  getLibraryIndex,
  containsReference,
  readParagraph,
  readerText,
  getSnapshot,
  outputEntries,
  evidenceHref,
  resolveEvidenceLocation,
  reportPath,
  runPathway,
  type CatalogueRun,
  type Snapshot,
  type LibraryIndex,
} from "./publishedReport";
import { HeadlineFigures } from "./HeadlineFigures";
import { isUnreachable } from "./useResource";
import { asOfDate } from "./runFigures";
import { headlineSources } from "./reportView";
import { traceForLine } from "./ReportContent";

type LibraryFilters = { query: string; sector: string; pathway: string; layout: "cards" | "list" };

function filtersFromAddress(): LibraryFilters {
  const query = new URLSearchParams(window.location.search);
  return {
    query: query.get("q") ?? "",
    sector: query.get("sector") ?? "all",
    pathway: query.get("pathway") ?? "all",
    layout: query.get("layout") === "list" ? "list" : "cards",
  };
}

function CreditView({ run }: { run: LibraryIndex["workspace"]["runs"][string] | undefined }) {
  const lead = run?.lead;
  if (!lead)
    return <p className="text-sm text-text-secondary">No credit view is supplied for this run.</p>;
  const href = `${reportPath(run.folder)}#evidence/${encodeURIComponent(lead.output)}~${lead.sha256}-${String(lead.line)}`;
  const { body } = readParagraph(lead.text);
  if (containsReference(body))
    return <TextLink href={href}>Read this credit view in Evidence</TextLink>;
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="reading-copy min-w-0 text-body text-text-secondary">
        {readerText(body.replaceAll("**", "").replaceAll("`", ""))}
      </p>
      <Button
        href={href}
        aria-label="Sources for this credit view"
        color="tertiary"
        size="sm"
        iconLeading={FileSearch02}
      >
        View sources
      </Button>
    </div>
  );
}

function metricIdentity(metric: CatalogueRun["metrics"][string] | undefined) {
  const { value = null, unit = null, period = null } = metric ?? {};
  return JSON.stringify([value, unit, period]);
}

function catalogueMetric(snapshot: Snapshot, id: string, key: string) {
  const matches = snapshot.catalogue.real.filter((item) => item.id === id);
  return matches.length === 1 ? matches[0]?.metrics[key] : undefined;
}

function resolveFigureSource(snapshot: Snapshot, catalogue: CatalogueRun, key: string) {
  const matches = Object.entries(snapshot.workspace.runs).filter(
    ([, run]) => run.folder === catalogue.id,
  );
  const [match] = matches;
  if (!match || matches.length !== 1) return null;
  const [routeKey, run] = match;
  const entries = outputEntries(snapshot, run, routeKey);
  const foundations = entries.filter((entry) => entry.selected && entry.output.module === "CP-1");
  if (foundations.length !== 1) return null;
  const source = headlineSources(foundations[0], catalogue, run.folder)[key];
  return source ? { entries, source, folder: run.folder } : null;
}

async function figureSource(catalogue: CatalogueRun, key: string, signal: AbortSignal) {
  const snapshot = await getSnapshot(signal, catalogue.id);
  if (!snapshot) return null;
  if (
    metricIdentity(catalogueMetric(snapshot, catalogue.id, key)) !==
    metricIdentity(catalogue.metrics[key])
  )
    return null;
  const result = resolveFigureSource(snapshot, catalogue, key);
  if (!result) return null;
  const { entries, source, folder } = result;
  const prefix = evidenceHref(folder, "");
  if (!source.href.startsWith(prefix)) return null;
  const location = resolveEvidenceLocation(entries, source.href.slice(prefix.length));
  if (!location || location.line === undefined) return null;
  const trace = traceForLine(snapshot, location.entry, location.index, location.line);
  return trace ? { trace, href: source.href } : null;
}
function LibraryFilter({
  name,
  choices,
  value,
  onChange,
}: {
  name: string;
  choices: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  // With nothing recorded to choose between, the control could only offer "All".
  if (choices.length === 0 && value === "all") return null;
  return (
    <label className={`${label} max-w-64`}>
      {name}
      <select
        aria-label={name}
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        className={field}
      >
        <option value="all">All</option>
        {value !== "all" && !choices.includes(value) && (
          <option value={value}>{value} (unavailable)</option>
        )}
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </label>
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
  const { layout } = filters;
  const search = useRef<HTMLInputElement>(null);
  const byFolder = new Map(Object.values(snapshot.workspace.runs).map((run) => [run.folder, run]));
  const groups = new Map<string, CatalogueRun[]>();
  for (const entry of snapshot.catalogue.real) {
    const run = byFolder.get(entry.id);
    const key = run?.issuerKey ?? entry.id;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  const sectors = [
    ...new Set(snapshot.catalogue.real.map((entry) => entry.sector).filter(Boolean)),
  ].sort();
  const pathways = [
    ...new Set(
      snapshot.catalogue.real
        .map((entry) => {
          const run = byFolder.get(entry.id);
          return runPathway(run ?? { pathway: null }, entry);
        })
        .filter(Boolean),
    ),
  ].sort();
  const cards = [...groups]
    .map(([key, entries]) => {
      const ordered = [...entries].sort((a, b) => b.date.localeCompare(a.date));
      const newest = ordered[0];
      if (!newest) return null;
      const linked = ordered.find((entry) => byFolder.has(entry.id));
      const newestRun = byFolder.get(newest.id);
      const pathway = runPathway(newestRun ?? { pathway: null }, newest);
      const matches =
        [newest.name, newest.issuer, newest.title, newest.sector, newest.period, newest.date].some(
          (value) => value.toLowerCase().includes(filters.query.trim().toLowerCase()),
        ) &&
        (filters.sector === "all" || newest.sector === filters.sector) &&
        (filters.pathway === "all" || pathway === filters.pathway);
      if (!matches) return null;
      return { key, entries: ordered, newest, linked };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
          <label className={`${label} w-full max-w-md sm:min-w-40 sm:flex-1`}>
            Search issuers
            <input
              ref={search}
              type="search"
              value={filters.query}
              onChange={(event) => {
                const query = event.currentTarget.value;
                setFilters((previous) => ({ ...previous, query }));
              }}
              className={field}
            />
          </label>
          <LibraryFilter
            name="Sector"
            choices={sectors}
            value={filters.sector}
            onChange={(sector) => {
              setFilters((previous) => ({ ...previous, sector }));
            }}
          />
          <LibraryFilter
            name="Pathway"
            choices={pathways}
            value={filters.pathway}
            onChange={(pathway) => {
              setFilters((previous) => ({ ...previous, pathway }));
            }}
          />
        </div>
        <ButtonGroup
          aria-label="Layout"
          size="sm"
          disallowEmptySelection
          selectedKeys={[layout]}
          onSelectionChange={(keys) => {
            const [key] = keys;
            if (key === "cards" || key === "list")
              setFilters((previous) => ({ ...previous, layout: key }));
          }}
        >
          <ButtonGroupItem id="cards">Cards</ButtonGroupItem>
          <ButtonGroupItem id="list">List</ButtonGroupItem>
        </ButtonGroup>
      </div>
      {cards.length === 0 ? (
        <div className={`${card} items-start`}>
          <p role="status">No issuers match these filters.</p>
          <Button
            color="secondary"
            onPress={() => {
              setFilters((previous) => ({ ...previous, query: "", sector: "all", pathway: "all" }));
              search.current?.focus();
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : layout === "cards" ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cards.map(({ key, entries, newest, linked }) => (
            <li key={key} className={card}>
              <header className="grid min-w-0 gap-1 wrap-anywhere">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <h3 className={heading}>{newest.name}</h3>
                  {snapshot.preview && byFolder.has(newest.id) ? (
                    <Badge color="brand">Test preview</Badge>
                  ) : byFolder.has(newest.id) ? (
                    <StatusBadge set="Module state" state="Delivered" />
                  ) : (
                    <Badge color="gray">No report published</Badge>
                  )}
                </div>
                {newest.sector && <p className="text-sm text-text-secondary">{newest.sector}</p>}
                <p className="text-sm text-text-secondary">
                  {runPathway(byFolder.get(newest.id) ?? { pathway: null }, newest)} ·{" "}
                  <time className="tabular-nums" dateTime={newest.date}>
                    {asOfDate(newest.date)}
                  </time>
                </p>
              </header>
              <CreditView run={byFolder.get(newest.id)} />
              <HeadlineFigures
                key={newest.id}
                catalogue={newest}
                requestSource={(key, signal) => figureSource(newest, key, signal)}
              />
              {linked && (
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <Button href={reportPath(linked.id)} color="secondary" iconTrailing={ArrowRight}>
                    Open report
                  </Button>
                  <TextLink
                    href={`${reportPath(linked.id)}#history`}
                  >{`${String(entries.length)} ${entries.length === 1 ? "run" : "runs"}`}</TextLink>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-ds-md border border-border-hairline bg-surface-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-hairline text-text-secondary">
                <th className="p-3">Issuer</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Pathway</th>
                <th className="p-3">As of</th>
                <th className="p-3">Report</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(({ key, newest, linked }) => (
                <tr key={key} className="border-b border-border-hairline last:border-0">
                  <th scope="row" className="p-3 font-semibold wrap-anywhere">
                    {newest.name}
                  </th>
                  <td className="p-3 wrap-anywhere">{newest.sector || "—"}</td>
                  <td className="p-3 wrap-anywhere">
                    {runPathway(byFolder.get(newest.id) ?? { pathway: null }, newest)}
                  </td>
                  <td className="p-3">
                    <time className="tabular-nums" dateTime={newest.date}>
                      {asOfDate(newest.date)}
                    </time>
                  </td>
                  <td className="p-3">
                    {linked ? (
                      <TextLink href={reportPath(linked.id)}>Open report</TextLink>
                    ) : (
                      "Not published"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        </EmptyState.Description>
      </EmptyState.Content>
      {!readOnly && (
        <EmptyState.Footer>
          <Button href="/start" color="secondary">
            Start a run
          </Button>
        </EmptyState.Footer>
      )}
    </EmptyState>
  );
}

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
      layout: filters.layout,
    };
    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "all" || (key === "layout" && value === "cards"))
        address.searchParams.delete(key);
      else address.searchParams.set(key, value);
    }
    window.history.replaceState(window.history.state, "", address);
  }, [filters]);
  // No index and an index with no report are one state; with nothing to filter, no filter is shown.
  const canStart = !readOnly && !value?.preview;
  const empty = value === null || value?.catalogue.real.length === 0;
  return (
    <>
      <PageHeader
        title="Library"
        actions={canStart && !empty && <Button href="/start">Start a run</Button>}
      />
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
          <div role="status" aria-label="Loading reports" className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((key) => (
              <div className={card} key={key}>
                <Skeleton lines={5} />
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
