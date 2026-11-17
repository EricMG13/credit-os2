import { useState, type Dispatch, type SetStateAction } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { PageHeader } from "../../shell/PageHeader";
import { TextLink } from "../run/TextLink";
import { card, ErrorNotice, field, heading, label } from "./layout";
import {
  getLibraryIndex,
  getSnapshot,
  outputEntries,
  evidenceHref,
  resolveEvidenceLocation,
  reportPath,
  runPathway,
  type CatalogueRun,
  type LibraryIndex,
} from "./publishedReport";
import { HeadlineFigures } from "./HeadlineFigures";
import { headlineSources } from "./reportView";
import { traceForLine } from "./ReportContent";
import { useResource } from "./useResource";

type LibraryFilters = { query: string; sector: string; pathway: string };

async function figureSource(catalogue: CatalogueRun, key: string, signal: AbortSignal) {
  const snapshot = await getSnapshot(signal, catalogue.id);
  if (!snapshot) return null;
  const candidates = Object.entries(snapshot.workspace.runs).filter(
    ([, run]) => run.folder === catalogue.id,
  );
  const matching = snapshot.catalogue.real.filter((item) => item.id === catalogue.id);
  const metric = matching.length === 1 ? matching[0]?.metrics[key] : undefined;
  const shown = catalogue.metrics[key];
  if (
    JSON.stringify([metric?.value ?? null, metric?.unit ?? null, metric?.period ?? null]) !==
    JSON.stringify([shown?.value ?? null, shown?.unit ?? null, shown?.period ?? null])
  )
    return null;
  const [found] = candidates;
  if (candidates.length !== 1 || !found) return null;
  const [routeKey, run] = found;
  const entries = outputEntries(snapshot, run, routeKey);
  const foundations = entries.filter((entry) => entry.selected && entry.output.module === "CP-1");
  if (foundations.length !== 1) return null;
  const source = headlineSources(foundations[0], catalogue, run.folder)[key];
  if (!source) return null;
  const prefix = evidenceHref(run.folder, "");
  const location = source.href.startsWith(prefix)
    ? resolveEvidenceLocation(entries, source.href.slice(prefix.length))
    : undefined;
  if (!location || location.line === undefined) return null;
  const trace = traceForLine(snapshot, location.entry, location.index, location.line);
  return trace ? { trace, href: source.href } : null;
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
  const [layout, setLayout] = useState<"cards" | "list">("cards");
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
          <label className="grid gap-1 text-sm text-text-secondary">
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
          <label className="grid gap-1 text-sm text-text-secondary">
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
            if (key === "cards" || key === "list") setLayout(key);
          }}
        >
          <ButtonGroupItem id="cards">Cards</ButtonGroupItem>
          <ButtonGroupItem id="list">List</ButtonGroupItem>
        </ButtonGroup>
      </div>
      {cards.length === 0 ? (
        <p className={card}>
          {filters.query.trim() || filters.sector !== "all" || filters.pathway !== "all"
            ? "No issuers match these filters."
            : "No reports yet"}
        </p>
      ) : layout === "cards" ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cards.map(({ key, entries, newest, linked }) => (
            <li key={key} className={`${card} grid gap-5`}>
              <header className="grid gap-1">
                <h3 className={heading}>{newest.name}</h3>
                <p className="text-sm text-text-secondary">
                  {[newest.issuer !== newest.name ? newest.issuer : "", newest.sector]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </header>
              <p className="text-sm text-text-secondary">
                {runPathway(byFolder.get(newest.id) ?? { pathway: null }, newest)} ·{" "}
                <time dateTime={newest.date}>{newest.date}</time>
              </p>
              <HeadlineFigures
                key={newest.id}
                catalogue={newest}
                requestSource={(key, signal) => figureSource(newest, key, signal)}
              />
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
                  <td className="p-3">{newest.date}</td>
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

export function ReportLibrary() {
  const { value, error } = useResource(getLibraryIndex);
  const [filters, setFilters] = useState<LibraryFilters>({
    query: "",
    sector: "all",
    pathway: "all",
  });
  return (
    <>
      <PageHeader title="Library" actions={<Button href="/start">Start a run</Button>} />
      <section className="mt-6 grid gap-4">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {value === undefined && !error && (
          <p role="status" className="text-text-secondary">
            Loading reports…
          </p>
        )}
        {value === null && <p className={card}>No reports yet</p>}
        {value && (
          <>
            {value.catalogue.real.length > 0 && (
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
            )}
            <MatchRuns snapshot={value} filters={filters} setFilters={setFilters} />
          </>
        )}
      </section>
    </>
  );
}
