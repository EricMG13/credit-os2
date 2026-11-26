/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role -- explicit table roles keep the table semantics when the parts are drawn as stacked blocks on a phone */
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge } from "@/components/base/badges/badges";
import { FileSearch02 } from "@untitledui/icons";
import { useId } from "react";
import { moduleName } from "../api";
import { citedSourcePages } from "../sourceFiles";
import {
  evidencePath,
  readerText,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import { GapText } from "@/pages/library/parts/GapText";
import { STACK } from "./evidenceKit";
import { handoffName } from "./evidenceLabels";
import { Tile } from "./overview/Tile";

export type SourceGroup = { label: string; rows: PublishedRun["evidence"]["sources"] };
type SourceRow = SourceGroup["rows"][number];

/** The id of one file's row: its place across the groups in the order they are given. */
export const sourceRowId = (index: number) => `evidence-source-${String(index)}`;

/** What the page found when a group holds no file: a statement of the check, not a judgement. */
const NO_FILES: Record<string, string> = {
  "Used by a module": "No supplied file is recorded as used by a module.",
  "Supplied, not used": "No supplied file is recorded as unused.",
  "Not recorded as used": "No supplied file lacks a record of its use.",
};

/**
 * A SHA-256 in a 32-character measure: its 64 characters set as two even lines, never one long
 * line with a stray tail. The text is the exact hash, whole, in one node.
 */
function Hash({ value }: { value: string }) {
  return <code className="inline-block w-[32ch] max-w-full break-all">{value}</code>;
}

type Citation = {
  /** For a file-less citation: the supplied file whose name its label starts with (the longest such name). */
  owner?: string;
  sha: string | null;
  label: string;
  reason: string | null;
  entry: OutputEntry;
  line: number;
};

const NO_REASON = "No reason recorded";

/**
 * What the designated handoffs cite, from the given entries only (the snapshot holds other runs'
 * chips, and alternate handoffs are not the delivered ones). A citation that names a supplied file
 * belongs to that file's row; one that names no file but starts its label with a supplied file's
 * name is that file's ambiguous citation. Every other citation is kept apart, grouped by the
 * reason the chip recorded, as written, in the order first met. A page is shown as attested where
 * the bridge attests one and otherwise as the citation's own label.
 */
export function citationsByFile(snapshot: Snapshot, entries: OutputEntry[], names: Set<string>) {
  const byId = new Map(entries.map((entry) => [entry.output.id, entry]));
  const byFile = new Map<string, Citation[]>();
  const fileless: Citation[] = [];
  const unmatched = new Map<string, Citation[]>();
  for (const [key, chips] of Object.entries(snapshot.chips)) {
    const cut = key.lastIndexOf(":");
    const entry = byId.get(key.slice(0, cut));
    const line = Number(key.slice(cut + 1));
    if (!entry || !Number.isSafeInteger(line)) continue;
    const folder = entry.output.id.split("/")[0] ?? "";
    for (const chip of chips) {
      const label = citedSourcePages(folder, chip) ?? chip.label ?? "Cited, no page recorded";
      const cited = { sha: chip.sha256, label, reason: chip.reason, entry, line };
      if (chip.file && names.has(chip.file))
        byFile.set(chip.file, [...(byFile.get(chip.file) ?? []), cited]);
      else {
        const owner =
          chip.file === null
            ? [...names]
                .filter((name) => chip.label?.startsWith(`${name} `))
                .sort((a, b) => b.length - a.length)[0]
            : undefined;
        if (owner) fileless.push({ ...cited, owner, label: chip.label ?? label });
        else {
          const why = chip.reason ?? NO_REASON;
          unmatched.set(why, [...(unmatched.get(why) ?? []), cited]);
        }
      }
    }
  }
  return { byFile, fileless, unmatched };
}

type Cited = ReturnType<typeof citationsByFile>;

/** The citations of one source: same name, and the same hash where both record one; a different hash and an ambiguous name are kept and said. */
function citationsOf(cited: Cited, source: SourceRow) {
  const each = [
    ...(cited.byFile.get(source.name) ?? []).map(({ sha, label }) => ({
      label,
      sha,
      kind: !source.sha256 ? "unhashed" : !sha || sha === source.sha256 ? "same" : "different",
      note: null as string | null,
    })),
    ...cited.fileless
      .filter(({ owner }) => owner === source.name)
      .map(({ label, reason }) => ({
        label,
        sha: null,
        kind: "ambiguous",
        note: `Cited ambiguously: ${reason ?? NO_REASON}`,
      })),
  ]; // A filing is cited on many lines, mostly on the same few pages: one line per distinct citation,
  // in the order first met, with how many citations it stands for. Nothing is merged that differs.
  const distinct = new Map<string, (typeof each)[number] & { count: number }>();
  for (const item of each) {
    const key = JSON.stringify([item.label, item.kind, item.sha, item.note]);
    const held = distinct.get(key);
    if (held) held.count += 1;
    else distinct.set(key, { ...item, count: 1 });
  }
  return [...distinct.values()];
}

function UsedBy({
  source,
  modules,
  group,
  pathway,
}: {
  source: SourceRow;
  modules: string[];
  group: string;
  pathway?: string | null;
}) {
  if (source.readBy.length === 0)
    return (
      <GapText>
        {group === "Supplied, not used" ? "Not read by any module" : "Use not recorded"}
      </GapText>
    );
  const all = modules.length > 0 && modules.every((id) => source.readBy.includes(id));
  return (
    <>
      {all && source.readBy.length === modules.length
        ? `Read by all ${String(modules.length)} modules`
        : `Read by ${source.readBy.map((id) => moduleName(id, pathway)).join(" · ")}`}
    </>
  );
}

function SourceTable({
  group,
  modules,
  cited,
  scope,
  pathway,
  places,
  rowTarget,
}: {
  group: SourceGroup;
  modules: string[];
  cited: Cited;
  scope?: string;
  pathway?: string | null;
  /** Each file's place across all groups, for its row's address. */
  places: Map<SourceRow, number>;
  rowTarget?: number;
}) {
  const headings = [
    "File",
    "Type",
    "Document date",
    scope ? `Cited in ${moduleName(scope, pathway)}` : "Cited as",
    "Used by",
    "SHA-256",
  ];
  return (
    <div className="grid min-w-0 gap-2">
      <h4 className="flex items-center gap-2 text-h4 font-medium text-text-primary">
        {group.label}{" "}
        <Badge size="sm" color="gray">
          {String(group.rows.length)}
        </Badge>
      </h4>
      {group.rows.length === 0 ? (
        <p className="text-small text-text-secondary">
          {NO_FILES[group.label] ?? "No file is listed in this group."}
        </p>
      ) : (
        <div
          role="region"
          aria-label={`${group.label}: files`}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="min-w-0 overflow-x-auto rounded-ds-md border border-border-hairline"
        >
          <table role="table" className={STACK.table}>
            <caption className="sr-only">{group.label}</caption>
            <thead role="rowgroup" className={STACK.head}>
              <tr role="row">
                {headings.map((heading) => (
                  <th
                    key={heading}
                    role="columnheader"
                    scope="col"
                    className="px-4 py-3 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup" className={STACK.body}>
              {group.rows.map((source) => {
                const citations = citationsOf(cited, source);
                const place = places.get(source);
                const landed = place !== undefined && place === rowTarget;
                return (
                  <tr
                    role="row"
                    key={source.name}
                    id={place === undefined ? undefined : sourceRowId(place)}
                    tabIndex={-1}
                    aria-current={landed ? "true" : undefined}
                    className={`${STACK.row} outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus ${landed ? "bg-surface-selected" : ""}`}
                  >
                    <th
                      role="rowheader"
                      scope="row"
                      data-label={headings[0]}
                      className={`${STACK.cell} font-medium wrap-anywhere text-text-primary`}
                    >
                      {source.name}
                      {source.sourceWarning && (
                        <span className="mt-1 block font-normal text-warning-text">
                          {source.sourceWarning}
                        </span>
                      )}
                    </th>
                    <td
                      role="cell"
                      data-label={headings[1]}
                      className={`${STACK.cell} text-text-secondary`}
                    >
                      {source.type || <GapText>Document type n.a.</GapText>}
                    </td>
                    <td
                      role="cell"
                      data-label={headings[2]}
                      className={`${STACK.cell} text-text-secondary tabular-nums`}
                    >
                      {source.documentDate || <GapText>Document date n.a.</GapText>}
                    </td>
                    <td
                      role="cell"
                      data-label={headings[3]}
                      className={`${STACK.cell} text-text-secondary`}
                    >
                      {citations.length > 0 ? (
                        <ul className="grid gap-1.5">
                          {citations.map(({ label, sha, kind, note, count }, index) => (
                            <li key={`${String(index)}-${label}`} className="grid gap-0.5">
                              {count > 1 && (
                                <span className="order-last text-caption text-text-tertiary tabular-nums">
                                  {`${String(count)} citations`}
                                </span>
                              )}
                              {kind === "different" ? (
                                <>
                                  <span>{`Cited as ${label} under a different hash`}</span>
                                  <code className="font-mono text-mono wrap-anywhere text-text-tertiary">
                                    {sha}
                                  </code>
                                </>
                              ) : (
                                <>
                                  <span>{label}</span>
                                  {note !== null && (
                                    <span className="text-caption text-text-tertiary">{note}</span>
                                  )}
                                  {kind === "unhashed" && (
                                    <span className="text-caption text-text-tertiary">
                                      Matched by file name; the source has no hash
                                    </span>
                                  )}
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <GapText>
                          {scope
                            ? `No citation in ${moduleName(scope, pathway)} names this file`
                            : "No citation names this file"}
                        </GapText>
                      )}
                    </td>
                    <td
                      role="cell"
                      data-label={headings[4]}
                      className={`${STACK.cell} text-text-secondary`}
                    >
                      <UsedBy
                        source={source}
                        modules={modules}
                        group={group.label}
                        pathway={pathway}
                      />
                    </td>
                    <td
                      role="cell"
                      data-label={headings[5]}
                      className={`${STACK.cell} font-mono text-mono wrap-anywhere text-text-tertiary`}
                    >
                      {source.sha256 ? (
                        <Hash value={source.sha256} />
                      ) : (
                        <GapText>No hash recorded</GapText>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const UNMATCHED = "Entries on handoff lines not attached to a supplied file";

function UnmatchedCitations({
  cited,
  folder,
  pathway,
}: {
  cited: Cited;
  folder: string;
  pathway?: string | null;
}) {
  const id = useId();
  const rows = [...cited.unmatched];
  if (rows.length === 0) return null;
  return (
    <div className="grid min-w-0 gap-2 rounded-ds-sm bg-surface-subtle p-3">
      <h4 id={id} className="text-small font-medium text-text-primary">
        {UNMATCHED}
      </h4>
      <p className="text-caption text-text-tertiary">Counted by the reason recorded, as written.</p>
      <ul aria-labelledby={id} className="grid gap-1 text-small text-text-secondary">
        {rows.map(([reason, list]) => {
          const first = list[0];
          return (
            <li key={reason} className="flex flex-wrap items-center gap-x-3">
              <span className="wrap-anywhere">{`${String(list.length)} · ${readerText(reason, pathway)}`}</span>
              {first && (
                <a
                  href={evidencePath(folder, first.entry, first.line)}
                  className="inline-flex min-h-8 items-center text-text-link underline max-[480px]:min-h-11"
                >
                  {`First: ${handoffName(first.entry, pathway)}, line ${String(first.line)}`}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** What was supplied: the files modules used, and apart from them those supplied and not used. */
export function EvidenceSources({
  sourceGroups,
  module,
  modules,
  entries,
  snapshot,
  folder,
  pathway,
  rowTarget,
}: {
  sourceGroups: SourceGroup[];
  module?: string;
  modules: string[];
  entries: OutputEntry[];
  snapshot: Snapshot;
  folder: string;
  pathway?: string | null;
  /** The place of the file a search result or a link asked for; its row is marked and focused. */
  rowTarget?: number;
}) {
  const cited = citationsByFile(
    snapshot,
    entries.filter((entry) => entry.selected && (!module || entry.output.module === module)),
    new Set(sourceGroups.flatMap(({ rows }) => rows.map(({ name }) => name))),
  );
  // A row stays when its module read it or when a citation in scope names it.
  const shown = sourceGroups
    .map((group) => ({
      ...group,
      rows: group.rows.filter(
        (source) =>
          !module || source.readBy.includes(module) || citationsOf(cited, source).length > 0,
      ),
    }))
    // With no module chosen an empty group stays and says it is empty: "supplied, not used" has an
    // answer either way. Under a module filter only the groups that hold its files are drawn.
    .filter(({ rows }) => !module || rows.length > 0);
  const places = new Map(
    sourceGroups.flatMap(({ rows }) => rows).map((source, index) => [source, index] as const),
  );
  const none = shown.every(({ rows }) => rows.length === 0);
  return (
    <Tile
      span={12}
      label="Sources"
      title="Sources"
      kicker="The supplied files, and which modules read them."
    >
      <UnmatchedCitations cited={cited} folder={folder} pathway={pathway} />
      {none ? (
        <EmptyState className="py-5">
          <EmptyState.Header>
            <EmptyState.FeaturedIcon icon={FileSearch02} />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title as="h3">No source files recorded</EmptyState.Title>
            <EmptyState.Description>
              {module
                ? `No issuer files are listed for ${moduleName(module, pathway)}.`
                : "No issuer files listed in this run’s published record."}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        shown.map((group) => (
          <SourceTable
            key={group.label}
            group={group}
            modules={modules}
            cited={cited}
            scope={module}
            pathway={pathway}
            places={places}
            rowTarget={rowTarget}
          />
        ))
      )}
    </Tile>
  );
}
