import type { OutputEntry } from "../../publishedReport";
import { PublishedSource } from "../PublishedTrace";
import { Tile } from "../overview/Tile";
import { EmptyLedger, LedgerList } from "./LedgerLists";
import { LINK } from "./PassageTile";
import {
  withoutReferenceColumns,
  type Cell,
  type PassageItem,
  type issuerFacts,
  type analysisRows,
  type leftovers,
  type ledgerOf,
} from "./model";
import { PassageBody } from "./PassageTile";
import { PublishedTable } from "../../ReportContent";
import { evidencePath } from "../../publishedReport";

function CellText({ cell, href }: { cell: Cell; href: string }) {
  switch (cell.kind) {
    case "written":
      return <>{cell.text}</>;
    case "referenced":
      return (
        <a className={LINK} href={href}>
          Read in Evidence
        </a>
      );
    case "dash":
      return <span className="text-text-tertiary">—</span>;
    default:
      return <span className="text-gap-text">Not stated</span>;
  }
}

/**
 * Facts the comparison states that are not one of the pack's measures (a new facility, an outlook).
 * A run with no changed fact carries the contract's "No material change" row: the module's own
 * statement and its reason, on one line, under a heading that does not say "changed".
 */
export function FactsTile({ result }: { result: ReturnType<typeof issuerFacts> }) {
  const { facts, noChange } = result;
  if (facts.length === 0 && noChange.length === 0) return null;
  const statement = noChange.map(({ reason, href }) => (
    <div key={href} className="flex items-start justify-between gap-3">
      <p className="reading-copy text-body text-text-primary">
        No material change at the issuer. <CellText cell={reason} href={href} />
      </p>
      <PublishedSource href={href} name="This statement" linkLabel="Source for this statement">
        Source
      </PublishedSource>
    </div>
  ));
  if (facts.length === 0)
    return (
      <Tile span={12} label="At the issuer" title="At the issuer">
        {statement}
      </Tile>
    );
  return (
    <Tile span={12} label="Also changed at the issuer" title="Also changed at the issuer">
      {statement}
      <ul className="grid">
        {facts.map(({ line, href, label, before, after, cause, effect }) => (
          <li
            key={line}
            className="grid gap-1 border-t border-border-hairline py-3 first:border-t-0 first:pt-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="min-w-0 text-body font-medium wrap-anywhere">
                <CellText cell={label} href={href} />
              </h4>
              <PublishedSource href={href} name="This fact" linkLabel="Source for this fact">
                Source
              </PublishedSource>
            </div>
            <p className="font-mono text-small text-text-secondary">
              <CellText cell={before} href={href} /> → <CellText cell={after} href={href} />
            </p>
            <p className="reading-copy text-small text-text-secondary">
              <Said cell={cause} href={href} name="Cause" />
            </p>
            <p className="reading-copy text-small text-text-secondary">
              <Said cell={effect} href={href} name="Effect on the credit view" />
            </p>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

/** "Cause: …" where the cell says something; "Cause not stated" where it is a dash or empty. */
function Said({ cell, href, name }: { cell: Cell; href: string; name: string }) {
  if (cell.kind === "dash" || cell.kind === "absent")
    return (
      <span className="text-gap-text">{name === "Cause" ? "Cause" : "Effect"} not stated</span>
    );
  return (
    <>
      {name}: <CellText cell={cell} href={href} />
    </>
  );
}

/** The analysis comparison's rows, where there is no pack to draw the module matrix from. */
export function AnalysisTile({
  rows,
  title = "What changed in the analysis",
}: {
  rows: ReturnType<typeof analysisRows>;
  title?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <Tile span={12} label={title} title={title}>
      <ul className="grid">
        {rows.map(({ line, href, module, status, cause, why }) => (
          <li
            key={line}
            className="grid gap-1 border-t border-border-hairline py-3 first:border-t-0 first:pt-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-body font-medium">
                <CellText cell={module} href={href} />
              </h4>
              <PublishedSource href={href} name="This module" linkLabel="Source for this module">
                Source
              </PublishedSource>
            </div>
            <p className="text-small text-text-secondary">
              <CellText cell={status} href={href} />
            </p>
            <p className="reading-copy text-small text-text-secondary">
              Cause: <CellText cell={cause} href={href} /> · Why:{" "}
              <CellText cell={why} href={href} />
            </p>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

/** The limitations ledger by status, added and removed first; a ledger missing a column is its table. */
export function LedgerTile({
  ledger,
  entry,
  folder,
  pathway,
  lead = [],
}: {
  ledger: ReturnType<typeof ledgerOf>;
  entry: OutputEntry;
  folder: string;
  pathway?: string | null;
  /** What the module wrote above the ledger: it says how to read it, so it is drawn with it. */
  lead?: PassageItem[];
}) {
  if (!ledger) return null;
  const intro = lead.length > 0 && (
    <PassageBody items={lead} noun="passage" entry={entry} folder={folder} pathway={pathway} />
  );
  if ("table" in ledger)
    return (
      <Tile span={12} label="Limitations ledger" title="Limitations ledger">
        {intro}
        <PublishedTable
          table={withoutReferenceColumns(ledger.table)}
          pathway={pathway}
          rowSource={(line, label) => (
            <PublishedSource
              href={evidencePath(folder, entry, line)}
              name={label}
              linkLabel={`Source for ${label}`}
            >
              Source
            </PublishedSource>
          )}
        />
      </Tile>
    );
  const [added, removed, ...rest] = [
    ...["New", "Closed"].map((status) => ledger.groups.find((group) => group.status === status)),
    ...ledger.groups.filter((group) => group.status !== "New" && group.status !== "Closed"),
  ];
  return (
    <Tile span={12} label="Limitations ledger" title="Limitations ledger">
      {intro}
      <div className="grid gap-6 md:grid-cols-2">
        {added ? <LedgerList group={added} /> : <Empty heading="Added" />}
        {removed ? <LedgerList group={removed} /> : <Empty heading="Removed" />}
      </div>
      {rest.length > 0 && (
        <div className="grid gap-6 border-t border-border-hairline pt-4 md:grid-cols-2">
          {rest.map((group) => (group ? <LedgerList key={group.status} group={group} /> : null))}
        </div>
      )}
    </Tile>
  );
}

function Empty({ heading }: { heading: string }) {
  return (
    <section className="grid content-start gap-3" aria-label={heading}>
      <h4 className="text-caption text-text-tertiary">{heading} (none)</h4>
      <EmptyLedger />
    </section>
  );
}

/** What the comparison wrote that no other tile draws, as written, so nothing it carries is dropped. */
export function LeftoverTile({
  sections,
  entry,
  folder,
  pathway,
}: {
  sections: ReturnType<typeof leftovers>;
  entry: OutputEntry;
  folder: string;
  pathway?: string | null;
}) {
  if (sections.length === 0) return null;
  return (
    <Tile span={12} label="More from the comparison" title="More from the comparison">
      {sections.map(({ heading, items }, index) => (
        <section key={`${String(index)}-${heading}`} className="grid gap-3" aria-label={heading}>
          <h4 className="text-caption text-text-tertiary">{heading}</h4>
          <PassageBody
            items={items}
            noun="passage"
            entry={entry}
            folder={folder}
            pathway={pathway}
          />
        </section>
      ))}
    </Tile>
  );
}
