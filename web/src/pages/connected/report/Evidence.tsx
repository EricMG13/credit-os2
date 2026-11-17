import { Button } from "@/components/base/buttons/button";
import { ArrowRight, FileSearch02 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { citedSourcePages, sourceCitationNote } from "../sourceFiles";
import type { ReactNode } from "react";
import { DownloadButton } from "@/pages/library/parts/DownloadButton";
import { DerivationTree } from "@/pages/library/parts/DerivationTree";
import { RunTabLink } from "@/pages/library/parts/RunFrame";
import type { TreeNode } from "@/pages/library/slice";
import { Badge } from "@/components/base/badges/badges";
import { StatusBadge } from "@/components/status/StatusBadge";
import { moduleName, type Mode } from "../api";
import { card, field, heading } from "../layout";
import {
  classifySections,
  evidencePath,
  evidenceToken,
  FORECAST_INPUTS,
  plainModuleNames,
  publishedHref,
  resolveEvidenceLocation,
  sectionContainsLine,
  type OutputEntry,
  type PublishedRun,
  type Section,
  type Snapshot,
  type ScriptCheckRecord,
  type Table,
} from "../publishedReport";
import {
  HandoffDownload,
  PublishedTable,
  plainText,
  richParts,
  traceDetails,
  traceForLine,
} from "../ReportContent";
import { ArtifactDownloads } from "./ArtifactDownloads";
import { ReportRecord } from "./Record";
import { ScriptChecks } from "./ScriptChecks";

const BARE_MODULE_CODE = /^CP-[A-Z0-9]+$/;

/** The line of a handoff's own title: the first level-1 section headed by nothing but a module code. */
function titleLine(sections: Section[]) {
  return sections.find(({ level, heading }) => level === 1 && BARE_MODULE_CODE.test(heading.trim()))
    ?.line;
}

const LIST_MARKER = /^([ \t]*)- +/;
// \x60 is a backtick: a literal one would mislead the class scanner of the static gate.
const FENCE_LINE = /^[ \t]*\x60{3}[^\n]*$/;
const NAMED_HASH = /^(\S.*?) ([a-f0-9]{64})$/;

/** A handoff line as written, without its Markdown: list markers (indentation kept) and code fences. */
function withoutMarkdown(text: string) {
  return text
    .split("\n")
    .filter((item) => !FENCE_LINE.test(item))
    .map((item) => item.replace(LIST_MARKER, "$1"))
    .join("\n");
}

/** One text block of a handoff: a "name hash" source line as a name with its hash in mono. */
function HandoffText({ text }: { text: string }) {
  const plain = withoutMarkdown(text);
  const named = LIST_MARKER.test(text) ? NAMED_HASH.exec(plain) : null;
  if (named)
    return (
      <div className="grid gap-0.5 text-sm">
        <p className="font-medium wrap-anywhere text-text-primary">{named[1]}</p>
        <code className="wrap-anywhere text-text-tertiary">{named[2]}</code>
      </div>
    );
  return (
    <p className="whitespace-pre-wrap wrap-anywhere text-text-secondary">{richParts(plain)}</p>
  );
}

function rowView(table: Table, line: number | undefined) {
  const row = table.rows.find((item) => item.line === line);
  return row ? { ...table, rows: [row] } : table;
}

function EvidenceLocation({
  snapshot,
  entry,
  line,
}: {
  snapshot: Snapshot;
  entry: OutputEntry;
  line?: number;
}) {
  if (entry.output.parseError)
    return <p className="text-text-secondary">This handoff could not be read into sections.</p>;
  const title = titleLine(entry.sections);
  const sections = classifySections(entry.sections)
    .filter(
      ({ role, section }) =>
        role !== "hidden" ||
        (entry.output.module === "CP-2G" &&
          line !== undefined &&
          section.heading === FORECAST_INPUTS &&
          section.blocks.some((block) => block.line === line)),
    )
    .map(({ section }) => section)
    // The title of a handoff is the module's code: with nothing under it, it heads nothing in the
    // whole view and the card names the module. A location that points at it still draws it.
    .filter((section) => section.line !== title || section.blocks.length > 0 || line !== undefined);
  const visible =
    line === undefined
      ? sections
      : sections.filter((section) => sectionContainsLine(section, line));
  return visible.length ? (
    visible.map((section) => (
      <section key={section.line} className="grid gap-3 border-t border-border-hairline pt-3">
        <h3 className="font-semibold text-text-primary">
          {section.line === title ? moduleName(entry.output.module) : richParts(section.heading)}
        </h3>
        {section.blocks.map((block) => {
          if (block.type === "equity")
            return block.text ? (
              <pre key={block.line} className="whitespace-pre-wrap">
                {block.text}
              </pre>
            ) : null;
          if (
            line !== undefined &&
            section.line !== line &&
            block.line !== line &&
            !(block.type === "table" && block.rows.some((row) => row.line === line))
          )
            return null;
          const { basis, chips } = traceDetails(
            snapshot,
            entry,
            section,
            block,
            line ?? block.line,
          );
          const rowCitations =
            block.type === "table"
              ? [
                  { line: block.line, cells: ["Table"] },
                  ...block.rows.filter(
                    (row) =>
                      line === undefined ||
                      line === section.line ||
                      line === block.line ||
                      row.line === line,
                  ),
                ]
                  .map((row) => ({
                    line: row.line,
                    label: row.cells[0] || `Handoff line ${String(row.line)}`,
                    chips: (snapshot.chips[`${entry.output.id}:${String(row.line)}`] ?? []).filter(
                      (chip) =>
                        block.headers.some((header) =>
                          /source|basis|reference|citation/i.test(header),
                        ) ||
                        chip.file ||
                        chip.source ||
                        chip.quote ||
                        chip.excerpt ||
                        !/cites no page|no page or register/i.test(chip.reason ?? chip.label ?? ""),
                    ),
                  }))
                  .filter((row) => row.chips.length > 0)
              : [];
          return (
            <div
              className="grid gap-2"
              key={block.line}
              id={`evidence-${evidenceToken(entry, block.line)}`}
            >
              {block.type === "table" ? (
                <PublishedTable
                  table={rowView(block, line)}
                  heading={plainText(section.heading)}
                  evidence
                />
              ) : section.heading === FORECAST_INPUTS ? (
                <pre className="max-h-100 overflow-auto rounded-ds-sm bg-surface-subtle p-3 text-xs whitespace-pre-wrap wrap-anywhere">
                  {withoutMarkdown(block.text).trim()}
                </pre>
              ) : (
                <HandoffText text={block.text} />
              )}
              {block.type === "table" && basis && (
                <p className="text-sm text-text-secondary">{plainModuleNames(basis)}</p>
              )}
              {block.type === "table" && rowCitations.length > 0 && (
                <ul className="grid gap-3">
                  {rowCitations.map((row) => (
                    <li key={row.line}>
                      <h4 className="font-medium text-text-primary">{richParts(row.label)}</h4>
                      <ul className="grid gap-2">
                        {row.chips.map((chip, chipIndex) => (
                          <EvidenceCitation
                            key={chipIndex}
                            chip={chip}
                            outputId={entry.output.id}
                          />
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
              {block.type !== "table" && chips.length > 0 && (
                <ul className="grid gap-2">
                  {chips.map((chip, chipIndex) => (
                    <EvidenceCitation key={chipIndex} chip={chip} outputId={entry.output.id} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    ))
  ) : (
    <p className="text-text-secondary">This location is unavailable in the published handoff.</p>
  );
}

function EvidenceCitation({
  chip,
  outputId,
}: {
  chip: Snapshot["chips"][string][number];
  outputId: string;
}) {
  const note = sourceCitationNote(chip);
  const pages = citedSourcePages(outputId.split("/")[0] ?? "", chip);
  return (
    <li className="border-t border-border-hairline py-3 text-sm text-text-secondary">
      <p className="font-medium text-text-primary">{chip.label}</p>
      {(chip.file || chip.source) && <p className="wrap-anywhere">{chip.file ?? chip.source}</p>}
      {note && <p>{note}</p>}
      {chip.excerpt && (
        <blockquote className="mt-1 border-l-2 border-border-hairline pl-3">
          {chip.excerpt}
        </blockquote>
      )}
      {pages && (
        <>
          <p>{pages}</p>
          <p className="text-xs text-text-tertiary">
            Pages follow the source supplied to this run and may differ from the filing’s printed
            pages.
          </p>
        </>
      )}
      {chip.sha256 && <code className="mt-1 block wrap-anywhere">{chip.sha256}</code>}
    </li>
  );
}

function referencedText(node: TreeNode): string {
  return [node.label, node.value, node.note, ...node.children.map(referencedText)]
    .filter(Boolean)
    .join("\n");
}

function namesSource(references: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    Boolean(name) &&
    new RegExp(`(?:^|[^\\p{L}\\p{N}._/-])${escaped}(?![\\p{L}\\p{N}._/-])`, "u").test(references)
  );
}

function TraceDetailsView({
  snapshot,
  run,
  entry,
  index,
  line,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entry: OutputEntry;
  index: number;
  line: number;
}) {
  const trace = traceForLine(snapshot, entry, index, line);
  if (!trace) return null;
  const references = referencedText(trace.derivation);
  const sources = [
    ...run.evidence.sources,
    ...run.evidence.unused,
    ...run.evidence.unrecorded,
  ].filter((source) => namesSource(references, source.name));
  return (
    <div className={`grid min-w-0 gap-4 ${sources.length ? "lg:grid-cols-[3fr_2fr]" : ""}`}>
      <section className="grid min-w-0 content-start gap-3 border-t border-border-hairline pt-5">
        <h3 className={heading}>Derivation</h3>
        <DerivationTree node={trace.derivation} />
      </section>
      {sources.length > 0 && (
        <section className="grid min-w-0 content-start gap-3 border-t border-border-hairline pt-5">
          <h3 className={heading}>Source records</h3>
          <ul className="divide-y divide-border-hairline">
            {sources.map(({ name, documentDate, type, sha256 }) => (
              <li key={name} className="grid gap-1 py-2">
                <strong className="text-sm wrap-anywhere">{name}</strong>
                <p className="text-sm text-text-secondary">{type || "Document type n.a."}</p>
                <p className="text-sm text-text-secondary">
                  {documentDate || "Document date n.a."}
                </p>
                {sha256 && <code className="text-xs break-all text-text-tertiary">{sha256}</code>}
              </li>
            ))}
          </ul>
          <Button
            className="w-fit"
            href={`#evidence/sources/${encodeURIComponent(entry.output.module)}`}
            color="link-gray"
            size="sm"
            iconTrailing={ArrowRight}
          >
            Open Sources
          </Button>
        </section>
      )}
    </div>
  );
}

const RANKED = ["High", "Medium", "Low"] as const;

/** Gaps in groups of stated severity: High, Medium, Low, any other stated term, then none stated. */
function severityGroups<T extends { gap: GapRecord }>(items: T[]) {
  const order = (severity: string | null) => {
    const ranked = RANKED.indexOf(severity as (typeof RANKED)[number]);
    return ranked >= 0 ? ranked : severity === null ? RANKED.length + 1 : RANKED.length;
  };
  const groups = new Map<string | null, T[]>();
  for (const item of items)
    groups.set(item.gap.severity, [...(groups.get(item.gap.severity) ?? []), item]);
  return [...groups].sort(([a], [b]) => order(a) - order(b));
}

function GapSeverity({ severity }: { severity: string | null }) {
  if (severity === "High" || severity === "Medium" || severity === "Low")
    return <StatusBadge set="Gap severity" state={severity} />;
  return severity ? severity : <span className="text-text-tertiary">Not recorded</span>;
}

function EvidenceGaps({
  run,
  entries,
  module,
}: {
  run: PublishedRun;
  entries: OutputEntry[];
  module?: string;
}) {
  const items = entries.flatMap((entry) => {
    if (module && entry.output.module !== module) return [];
    return classifySections(entry.sections)
      .filter(({ role }) => role === "gaps")
      .flatMap(({ section }) => gapRecords(section.blocks).map((gap) => ({ entry, section, gap })));
  });
  return (
    <section className={card}>
      <div className="grid gap-1">
        <h3 className={heading}>
          Gaps <span className="ml-1 text-sm font-normal text-text-secondary">{items.length}</span>
        </h3>
        <p className="text-sm text-text-secondary">
          What this run could not establish, with the detail each handoff records.
        </p>
      </div>
      {items.length ? (
        <div className="mt-4 overflow-x-auto rounded-ds-md border border-border-hairline">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-subtle text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Gap</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Recorded detail</th>
                <th className="px-4 py-3 font-medium">Trace</th>
              </tr>
            </thead>
            {severityGroups(items).map(([severity, rows]) => (
              <tbody key={severity ?? ""}>
                <tr className="border-t border-border-hairline bg-surface-subtle">
                  <th scope="rowgroup" colSpan={5} className="px-4 py-2 text-left font-semibold">
                    <span className="flex items-center gap-2">
                      <GapSeverity severity={severity} />
                      <Badge size="sm" color="gray">
                        {String(rows.length)}
                      </Badge>
                    </span>
                  </th>
                </tr>
                {rows.map(({ entry, section, gap }) => (
                  <tr
                    key={`${entry.output.id}-${String(gap.line)}`}
                    className="border-t border-border-hairline align-top"
                  >
                    <th scope="row" className="px-4 py-3 font-medium text-text-primary">
                      {plainModuleNames(gap.title || section.heading)}
                    </th>
                    <td className="px-4 py-3">
                      {moduleName(entry.output.module)}
                      {!entry.selected &&
                        ` · ${BARE_MODULE_CODE.test(entry.output.label.trim()) ? "Alternate handoff" : entry.output.label}`}
                    </td>
                    <td className="px-4 py-3">
                      <GapSeverity severity={gap.severity} />
                    </td>
                    <td className="max-w-xl whitespace-pre-wrap px-4 py-3 text-text-secondary">
                      {richParts(gap.details || "No additional detail recorded.")}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        href={evidencePath(run.folder, entry, gap.line)}
                        color="link-gray"
                        size="sm"
                      >
                        Open handoff line
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      ) : (
        <EmptyState className="py-5">
          <EmptyState.Header>
            <EmptyState.FeaturedIcon icon={FileSearch02} />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title as="h3">No gaps recorded</EmptyState.Title>
            <EmptyState.Description>
              {module ? `No recorded gaps for ${moduleName(module)}.` : "This run lists no gaps."}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState>
      )}
    </section>
  );
}

type GapRecord = { line: number; title: string; severity: string | null; details: string };

function noGap(value: string | undefined) {
  return /^(?:none|no|nil|n\/a|n\.a\.)\.?$/i.test((value ?? "").trim());
}

function gapTitleIndex(headers: string[]) {
  const titleHeader = (header: string) =>
    !/severity/i.test(header) && !/^(?:id|gap id|reference|ref)$/i.test(header.trim());
  const titled = headers.findIndex(
    (header) => titleHeader(header) && /gap|missing|issue|item|shortfall|risk/i.test(header),
  );
  return titled >= 0 ? titled : Math.max(0, headers.findIndex(titleHeader));
}

function tableGapRecords(block: Table): GapRecord[] {
  const severityIndex = block.headers.findIndex((header) => /severity/i.test(header));
  const titleIndex = gapTitleIndex(block.headers);
  return block.rows.flatMap((row) => {
    const title = row.cells[titleIndex]?.trim() ?? "";
    if (!title || noGap(title)) return [];
    return [
      {
        line: row.line,
        title,
        severity: severityIndex < 0 ? null : row.cells[severityIndex]?.trim() || null,
        details: block.headers
          .map((header, index) => ({ header, value: row.cells[index]?.trim() ?? "" }))
          .filter(({ value }, index) => value && index !== titleIndex && index !== severityIndex)
          .map(({ header, value }) => `${header}: ${value}`)
          .join("\n"),
      },
    ];
  });
}

function gapRecords(blocks: Section["blocks"]): GapRecord[] {
  const records: GapRecord[] = [];
  for (const block of blocks) {
    if (block.type === "text") {
      const text = block.text.trim();
      if (text && !noGap(text))
        records.push({
          line: block.line,
          title: "Gap recorded as text",
          severity: null,
          details: text,
        });
      continue;
    }
    if (
      block.type !== "table" ||
      (block.headers.includes("Earlier ref") && block.headers.includes("Current ref"))
    )
      continue;
    for (const record of tableGapRecords(block)) records.push(record);
  }
  return records;
}

export function hasRecordedGap(blocks: Section["blocks"]) {
  return gapRecords(blocks).length > 0;
}

type SourceGroup = { label: string; rows: PublishedRun["evidence"]["sources"] };

function EvidenceSummary({
  entries,
  module,
  sourceGroups,
  checks,
  snapshot,
}: {
  entries: OutputEntry[];
  module?: string;
  sourceGroups: SourceGroup[];
  checks: ScriptCheckRecord[];
  snapshot: Snapshot;
}) {
  const selected = entries.filter((item) => !module || item.output.module === module);
  const handoffs = selected.filter((item) => item.selected).length;
  const sources = sourceGroups.reduce(
    (total, { rows }) =>
      total + rows.filter((source) => !module || source.readBy.includes(module)).length,
    0,
  );
  const gaps = selected.flatMap((entry) =>
    classifySections(entry.sections)
      .filter(({ role }) => role === "gaps")
      .flatMap(({ section }) => gapRecords(section.blocks)),
  ).length;
  const outcomes = checks
    .filter((record) => !module || record.module === module)
    .flatMap((record) => record.outcomes);
  const ran = outcomes.filter((outcome) => outcome.status !== "not checked").length;
  const unlocated = selected.filter((entry) =>
    Object.entries(snapshot.chips).some(
      ([key, chips]) =>
        key.startsWith(`${entry.output.id}:`) &&
        chips.some(
          (chip) =>
            chip.quote_found === false ||
            /not located|not found|could not be located/i.test(chip.reason ?? ""),
        ),
    ),
  ).length;
  return (
    <section className={card}>
      <h3 className={heading}>Run evidence</h3>
      <p>
        {handoffs} designated {handoffs === 1 ? "handoff" : "handoffs"} · {sources} source{" "}
        {sources === 1 ? "file" : "files"}
      </p>
      <ul className="grid gap-1 text-sm text-text-secondary">
        <li>
          {gaps} recorded {gaps === 1 ? "gap" : "gaps"}
        </li>
        <li>
          {ran} of {outcomes.length} script checks ran
        </li>
        <li>
          {unlocated} {unlocated === 1 ? "handoff" : "handoffs"} with an unlocated Basis
        </li>
      </ul>
    </section>
  );
}

function EvidenceSources({
  sourceGroups,
  module,
  modules,
}: {
  sourceGroups: SourceGroup[];
  module?: string;
  modules: string[];
}) {
  return (
    <section className={card}>
      <h3 className={heading}>Sources</h3>
      {sourceGroups.every(
        ({ rows }) => !rows.some((source) => !module || source.readBy.includes(module)),
      ) && (
        <EmptyState className="py-5">
          <EmptyState.Header>
            <EmptyState.FeaturedIcon icon={FileSearch02} />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title as="h3">No source files recorded</EmptyState.Title>
            <EmptyState.Description>
              {module
                ? `No issuer files are listed for ${moduleName(module)}.`
                : "No issuer files listed in this run’s published record."}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState>
      )}
      {sourceGroups
        .map((group) => ({
          ...group,
          rows: group.rows.filter((source) => !module || source.readBy.includes(module)),
        }))
        .filter(({ rows }) => rows.length > 0)
        .map(({ label, rows }) => (
          <div className="grid gap-2" key={label}>
            <h3 className="font-medium">{label}</h3>
            <ul className="divide-y divide-border-hairline rounded-ds-md border border-border-hairline">
              {rows.map((source) => (
                <li key={source.name} className="grid gap-1 px-4 py-3 text-sm">
                  <p className="font-semibold wrap-anywhere">{source.name}</p>
                  <p className="text-text-secondary">{source.type || "Document type n.a."}</p>
                  <p className="text-text-secondary">
                    {source.documentDate || "Document date n.a."}
                  </p>
                  {source.readBy.length > 0 && (
                    <p className="text-text-secondary">
                      {modules.length > 0 &&
                      modules.every((id) => source.readBy.includes(id)) &&
                      source.readBy.length === modules.length
                        ? `Read by all ${String(modules.length)} modules`
                        : `Read by ${source.readBy.map(moduleName).join(" · ")}`}
                    </p>
                  )}
                  {source.sourceWarning && <p>{source.sourceWarning}</p>}
                  {source.sha256 && (
                    <code className="wrap-anywhere text-text-tertiary">{source.sha256}</code>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}

function EvidenceHandoffs({
  entries,
  module,
  run,
}: {
  entries: OutputEntry[];
  module?: string;
  run: PublishedRun;
}) {
  const zip = publishedHref(run.evidence.zip, run.folder);
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={heading}>Handoffs</h3>
        {zip && (
          <DownloadButton download={{ label: "Download all handoffs", href: zip, reason: null }} />
        )}
      </div>
      {!zip && (
        <p className="text-sm text-text-secondary">No handoff ZIP was delivered for this run.</p>
      )}
      {run.evidence.handoffs.filter((handoff) => !module || handoff.module === module).length ===
        0 && (
        <p className="text-sm text-text-secondary">No handoff files were delivered for this run.</p>
      )}
      <ul className="grid gap-2">
        {entries.map(
          (item) =>
            (!module || item.output.module === module) && (
              <li
                key={item.output.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-border-hairline pt-2"
              >
                <Button
                  href={evidencePath(run.folder, item)}
                  color="link-gray"
                  size="sm"
                  className="underline"
                  iconTrailing={ArrowRight}
                >
                  {moduleName(item.output.module)}
                  {item.selected
                    ? ""
                    : ` · ${BARE_MODULE_CODE.test(item.output.label.trim()) ? "Alternate handoff" : item.output.label}`}
                </Button>
                <HandoffDownload run={run} entry={item} />
              </li>
            ),
        )}
      </ul>
    </section>
  );
}

const tabs = ["Summary", "Trace", "Sources", "Gaps", "Script checks", "Record"] as const;
type EvidenceTab = (typeof tabs)[number];

const tabRoute = (tab: EvidenceTab) => (tab === "Script checks" ? "checks" : tab.toLowerCase());

function evidenceRoute(entries: OutputEntry[], target: string | undefined, hasChecks: boolean) {
  const [section, module] = (target ?? "").split("/");
  const location = section ? resolveEvidenceLocation(entries, section) : null;
  const namedTab =
    section === "checks" && !hasChecks
      ? "Summary"
      : tabs.find((label) => tabRoute(label) === section);
  const invalidTraceAddress = Boolean(section && !namedTab && !location);
  const tab = location ? "Trace" : (namedTab ?? (invalidTraceAddress ? "Trace" : "Summary"));
  const selectedIndex = location?.index ?? -1;
  const entry = location?.entry;
  const selectedModule = entry?.output.module ?? module;
  const line = location?.line;
  return { module, location, invalidTraceAddress, tab, selectedIndex, entry, selectedModule, line };
}

function EvidenceNavigation({
  entries,
  tab,
  selectedModule,
  checks,
}: {
  entries: OutputEntry[];
  tab: EvidenceTab;
  selectedModule?: string;
  checks: ScriptCheckRecord[];
}) {
  const outcomes = checks
    .filter((record) => !selectedModule || record.module === selectedModule)
    .flatMap((record) => record.outcomes);
  const ran = outcomes.filter((outcome) => outcome.status !== "not checked").length;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-h2">Evidence</h2>
        <label className="grid gap-1 text-sm">
          Module
          <select
            className={field}
            value={selectedModule ?? ""}
            onChange={(event) => {
              window.location.assign(
                `#evidence/${tabRoute(tab)}${event.target.value ? `/${event.target.value}` : ""}`,
              );
            }}
          >
            <option value="">All modules</option>
            {[
              ...new Set([
                ...entries.map((item) => item.output.module),
                ...checks.map((record) => record.module),
              ]),
            ].map((id) => (
              <option value={id} key={id}>
                {moduleName(id)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav
        aria-label="Evidence sections"
        className="flex flex-wrap gap-3 border-b border-border-hairline"
      >
        {tabs
          .filter((item) => item !== "Script checks" || checks.length > 0)
          .map((item) => (
            <RunTabLink
              key={item}
              label={item}
              count={
                item === "Script checks"
                  ? `${String(ran)} of ${String(outcomes.length)}`
                  : undefined
              }
              current={tab === item}
              href={`#evidence/${tabRoute(item)}${selectedModule ? `/${selectedModule}` : ""}`}
              small
            />
          ))}
      </nav>
    </>
  );
}

function EvidenceHandoff({
  snapshot,
  run,
  entry,
  line,
  selectedIndex,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entry: OutputEntry;
  line?: number;
  selectedIndex: number;
}) {
  return (
    <article className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={heading}>
          {moduleName(entry.output.module)} ·{" "}
          {line === undefined ? "Handoff evidence" : `Line ${String(line)}`}
        </h2>
        <HandoffDownload run={run} entry={entry} />
      </div>
      {line !== undefined && (
        <TraceDetailsView
          snapshot={snapshot}
          run={run}
          entry={entry}
          line={line}
          index={selectedIndex}
        />
      )}
      <EvidenceLocation snapshot={snapshot} entry={entry} line={line} />
    </article>
  );
}

function showHandoffs(tab: EvidenceTab, entry: OutputEntry | undefined, invalid: boolean) {
  return tab === "Summary" || tab === "Record" || (tab === "Trace" && !entry && !invalid);
}

export function ReportEvidence({
  snapshot,
  run,
  entries,
  target,
  comparison,
  mode,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entries: OutputEntry[];
  target?: string;
  comparison?: ReactNode;
  mode: Mode;
}) {
  const checks = run.evidence.scriptChecks ?? [];
  const { module, invalidTraceAddress, tab, selectedIndex, entry, selectedModule, line } =
    evidenceRoute(entries, target, checks.length > 0);
  const { evidence } = run;
  const sourceGroups = [
    { label: "Used by a module", rows: evidence.sources },
    { label: "Supplied, not used", rows: evidence.unused },
    { label: "Not recorded as used", rows: evidence.unrecorded },
  ];
  return (
    <div className="grid min-w-0 gap-5">
      <EvidenceNavigation
        entries={entries}
        tab={tab}
        selectedModule={selectedModule}
        checks={checks}
      />
      {tab === "Summary" && (
        <EvidenceSummary
          entries={entries}
          module={module}
          sourceGroups={sourceGroups}
          checks={checks}
          snapshot={snapshot}
        />
      )}
      {entry && (
        <EvidenceHandoff
          snapshot={snapshot}
          run={run}
          entry={entry}
          line={line}
          selectedIndex={selectedIndex}
        />
      )}
      {tab === "Trace" && invalidTraceAddress && (
        <section role="alert" className={card}>
          <h3 className={heading}>Evidence link unavailable</h3>
          <p className="text-text-secondary">
            This link does not identify a saved handoff revision in this report. Open a handoff from
            the list to create a current evidence link.
          </p>
        </section>
      )}
      {tab === "Sources" && (
        <EvidenceSources
          sourceGroups={sourceGroups}
          module={module}
          modules={[...new Set(entries.map((item) => item.output.module))]}
        />
      )}
      {tab === "Trace" && !entry && !invalidTraceAddress && (
        <p className="text-text-secondary">
          Choose Show sources beside a paragraph, row or figure on another page to see here how it
          was derived, or open a handoff below.
        </p>
      )}
      {tab === "Record" && <ReportRecord run={run} entries={entries} module={module} mode={mode} />}
      {showHandoffs(tab, entry, invalidTraceAddress) && (
        <EvidenceHandoffs entries={entries} module={module} run={run} />
      )}
      {(tab === "Summary" || tab === "Record") && evidence.downloads.length > 0 && (
        <ArtifactDownloads folder={run.folder} />
      )}
      {(tab === "Summary" || tab === "Record") && evidence.downloads.length === 0 && (
        <section className={card}>
          <h3 className={heading}>Model and calculation files</h3>
          <p className="text-text-secondary">
            No model or calculation downloads are listed for this run.
          </p>
        </section>
      )}
      {tab === "Trace" && !entry && (!module || module === "CP-8") && comparison}
      {tab === "Gaps" && <EvidenceGaps run={run} entries={entries} module={module} />}
      {tab === "Script checks" && <ScriptChecks records={checks} module={module} />}
    </div>
  );
}
