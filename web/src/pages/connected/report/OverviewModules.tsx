import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { GapPanel } from "@/components/gap/GapPanel";
import { StatusBadge } from "@/components/status/StatusBadge";
import { card, heading } from "../layout";
import { containsReference, evidencePath, readerText, type PublishedRun } from "../publishedReport";
import { richParts } from "../ReportContent";
import type { moduleBottomLines, runLimitations } from "../reportView";
import { PublishedSource } from "./PublishedTrace";

export function ModuleBottomLines({
  run,
  rows,
}: {
  run: PublishedRun;
  rows: ReturnType<typeof moduleBottomLines>;
}) {
  if (!rows.length) return null;
  return (
    <section aria-label="Bottom line by module" className={`${card} grid gap-3`}>
      <h2 className={heading}>Bottom line by module</h2>
      <ul className="grid gap-4">
        {rows.map((row) => (
          <li
            key={row.id}
            className="grid gap-2 border-t border-border-hairline pt-3 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button
                color="link-gray"
                size="sm"
                href={`#modules/${row.id}`}
                iconTrailing={ArrowRight}
              >
                {row.name}
              </Button>
              <StatusBadge set="Module state" state={row.state} />
            </div>
            <div className="flex items-start justify-start gap-3">
              {row.text !== null ? (
                <p className="reading-copy text-body text-text-secondary">{row.text}</p>
              ) : row.referenced ? (
                <Button
                  color="link-gray"
                  size="sm"
                  href={evidencePath(run.folder, row.entry, row.line ?? undefined)}
                >
                  Read this bottom line in Evidence
                </Button>
              ) : (
                <GapPanel reason="This module's handoff has no bottom line; its handoff is in Evidence." />
              )}
              <PublishedSource
                href={evidencePath(run.folder, row.entry, row.line ?? undefined)}
                name={row.name}
                linkLabel={`Source for ${row.name}`}
              >
                View source
              </PublishedSource>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RunLimitations({
  run,
  rows,
}: {
  run: PublishedRun;
  rows: ReturnType<typeof runLimitations>;
}) {
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const group = groups.get(row.name);
    if (group) group.push(row);
    else groups.set(row.name, [row]);
  }
  return (
    <section aria-label="Limitations" className={`${card} grid gap-3`}>
      <h2 id="overview-limitations" tabIndex={-1} className={heading}>
        Limitations
      </h2>
      {rows.length === 0 ? (
        <p className="text-body text-text-secondary">
          No limitation is listed on this page for this run. Each module's page shows what it
          recorded.
        </p>
      ) : (
        [...groups].map(([name, limitations]) => (
          <details key={name} className="border-t border-border-hairline pt-3">
            <summary className="cursor-pointer font-semibold">
              {name} ({limitations.length})
            </summary>
            <ul className="mt-3 grid gap-3">
              {limitations.map((row) => {
                const href = evidencePath(run.folder, row.entry, row.line);
                return (
                  <li
                    key={`${row.entry.output.id}:${String(row.line)}`}
                    className="flex items-start justify-start gap-3 border-t border-border-hairline pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="reading-copy text-body text-text-secondary">
                      {containsReference(row.text) ? (
                        <Button color="link-gray" size="sm" href={href}>
                          Read this limitation in Evidence
                        </Button>
                      ) : (
                        richParts(row.text, readerText)
                      )}
                    </p>
                    <PublishedSource
                      href={href}
                      name={`this limitation from ${row.name}`}
                      linkLabel={`Source for this limitation from ${row.name}`}
                    >
                      View source
                    </PublishedSource>
                  </li>
                );
              })}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}
