import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowRight, BookOpen01, FileSearch02 } from "@untitledui/icons";
import { Alert } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Skeleton } from "@/components/gap/Skeleton";
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
  reportPath,
  runPathway,
  type CatalogueRun,
  type LibraryIndex,
} from "./publishedReport";
import { HeadlineFigures } from "./HeadlineFigures";
import { isUnreachable } from "./useResource";
import { asOfDate } from "./runFigures";

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
      <p className="text-body text-text-secondary">
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
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <label className={label}>
            Sector
            <select
              aria-label="Sector"
              value={filters.sector}
              onChange={(event) => {
                const sector = event.currentTarget.value;
                setFilters((previous) => ({ ...previous, sector }));
              }}
              className={field}
            >
              <option value="all">All</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Pathway
            <select
              aria-label="Pathway"
              value={filters.pathway}
              onChange={(event) => {
                const pathway = event.currentTarget.value;
                setFilters((previous) => ({ ...previous, pathway }));
              }}
              className={field}
            >
              <option value="all">All</option>
              {pathways.map((pathway) => (
                <option key={pathway} value={pathway}>
                  {pathway}
                </option>
              ))}
            </select>
          </label>
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
        <p className={card}>No issuers match these filters.</p>
      ) : layout === "cards" ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cards.map(({ key, entries, newest, linked }) => (
            <li key={key} className={`${card} grid gap-5`}>
              <header className="grid gap-1">
                <h3 className={heading}>{newest.name}</h3>
                {newest.sector && <p className="text-sm text-text-secondary">{newest.sector}</p>}
                {byFolder.has(newest.id) ? (
                  <StatusBadge set="Module state" state="Delivered" />
                ) : (
                  <Badge color="gray">No report published</Badge>
                )}
              </header>
              <p className="text-sm text-text-secondary">
                {runPathway(byFolder.get(newest.id) ?? { pathway: null }, newest)} ·{" "}
                <time dateTime={newest.date}>{asOfDate(newest.date)}</time>
              </p>
              <CreditView run={byFolder.get(newest.id)} />
              <HeadlineFigures catalogue={newest} />
              {linked ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button href={reportPath(linked.id)} color="secondary" iconTrailing={ArrowRight}>
                    Open report
                  </Button>
                  <TextLink
                    href={`${reportPath(linked.id)}#history`}
                  >{`${String(entries.length)} ${entries.length === 1 ? "run" : "runs"}`}</TextLink>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  No run report was published for this entry.
                </p>
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
                  <th scope="row" className="p-3 font-semibold">
                    {newest.name}
                  </th>
                  <td className="p-3">{newest.sector || "—"}</td>
                  <td className="p-3">
                    {runPathway(byFolder.get(newest.id) ?? { pathway: null }, newest)}
                  </td>
                  <td className="p-3">
                    <time dateTime={newest.date}>{asOfDate(newest.date)}</time>
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
    text: "The library could not be loaded. Try again, or ask whoever runs the service to check it.",
  },
  failed: {
    title: "The library could not be loaded",
    text: "The service could not read the published library. Try again, or ask whoever runs the service to check it.",
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

function EmptyLibrary() {
  return (
    <EmptyState>
      <EmptyState.Header>
        <EmptyState.FeaturedIcon icon={BookOpen01} />
      </EmptyState.Header>
      <EmptyState.Content>
        <EmptyState.Title>No reports yet</EmptyState.Title>
        <EmptyState.Description>
          A report appears here once a run has finished.
        </EmptyState.Description>
      </EmptyState.Content>
      <EmptyState.Footer>
        <Button href="/start" color="secondary">
          Start a run
        </Button>
      </EmptyState.Footer>
    </EmptyState>
  );
}

export function ReportLibrary() {
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
  const empty = value === null || value?.catalogue.real.length === 0;
  return (
    <>
      <PageHeader title="Library" actions={<Button href="/start">Start a run</Button>} />
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
        {empty && <EmptyLibrary />}
        {value && !empty && (
          <>
            <label className={`${label} max-w-md`}>
              Search issuers
              <input
                type="search"
                value={filters.query}
                onChange={(event) => {
                  const query = event.currentTarget.value;
                  setFilters((previous) => ({ ...previous, query }));
                }}
                className={field}
              />
            </label>
            <MatchRuns snapshot={value} filters={filters} setFilters={setFilters} />
          </>
        )}
      </section>
    </>
  );
}
