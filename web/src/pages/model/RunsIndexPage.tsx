import { EmptyState } from "@/components/application/empty-state/empty-state";
import { DesignReferenceNote } from "@/shell/DesignReferenceNote";
import { PageHeader } from "@/shell/PageHeader";
import { useSource } from "../source";
import { runAddress } from "./runAddress";
import { readSlice } from "./slice/read";

/** The group's home: every run the slice holds, each a link to that run's front page. */
export function RunsIndexPage() {
  const source = useSource();
  const slice = readSlice(source.model);
  /** An unreadable run has no header, so the library's own name for its issuer stands in. */
  const names = new Map(source.issuers.map((issuer) => [issuer.id, issuer.name]));
  // App refuses an invalid slice before a page is drawn; one that arrives anyway is a fault, not
  // an empty library.
  if (slice.kind === "invalid") throw new Error(slice.reason);
  const runs = slice.kind === "ok" ? slice.data.runs : [];
  const unreadable = slice.kind === "ok" ? slice.data.unreadable : [];
  const named = unreadable.filter((u) => u.issuer !== null);
  const unnamed = unreadable.length - named.length;
  return (
    <div className="flex flex-col gap-8 p-8">
      {slice.kind === "ok" ? <DesignReferenceNote /> : null}
      <PageHeader as="h1" title="Financial models" />
      {runs.length === 0 && unreadable.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.FeaturedIcon />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title>No model has been delivered yet</EmptyState.Title>
            <EmptyState.Description>
              This library holds no financial models to read.
            </EmptyState.Description>
          </EmptyState.Content>
          <EmptyState.Footer>
            <a href="#/" className="text-small text-text-link">
              Back to the Library
            </a>
          </EmptyState.Footer>
        </EmptyState>
      ) : runs.length + named.length === 0 ? null : (
        <ul className="flex flex-col gap-3">
          {runs.map((run, index) => (
            <li key={index}>
              <a
                href={`${runAddress(run.issuer, run.run)}/front`}
                className="flex flex-col gap-1 rounded-lg border border-border-hairline bg-surface-card p-4 outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="font-display text-h3 text-text-primary">
                  {run.header.issuerName}
                </span>
                <span className="text-small text-text-secondary">{run.header.asOf}</span>
              </a>
            </li>
          ))}
          {named.map((run, index) => (
            <li key={`unreadable-${String(index)}`}>
              <a
                href={`${runAddress(run.issuer, run.run)}/front`}
                className="flex flex-col gap-1 rounded-lg border border-border-hairline bg-surface-card p-4 outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="font-display text-h3 text-text-primary">
                  {names.get(run.issuer) ?? "A financial model"}
                </span>
                <span className="text-small text-text-secondary">Could not be read</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {unnamed > 0 && (
        <p className="text-small text-text-secondary">
          {unnamed === 1 ? "1 run" : `${String(unnamed)} runs`} could not be read and cannot be
          listed
        </p>
      )}
    </div>
  );
}
