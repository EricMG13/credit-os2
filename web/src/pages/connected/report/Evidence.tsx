import { Button } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";
import { Segmented } from "@/components/kit/Segmented";
import { StatsStrip } from "@/components/kit/StatsStrip";
import { citedSourcePages, sourceCitationNote } from "../sourceFiles";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { moduleName, type Mode } from "../api";
import { field } from "../layout";
import {
  evidencePath,
  evidenceToken,
  FORECAST_INPUTS,
  readerText,
  resolveEvidenceLocation,
  sectionContainsLine,
  type OutputEntry,
  type PublishedRun,
  type Section,
  type Snapshot,
  type ScriptCheckRecord,
  type Table,
} from "../publishedReport";
import { handoffBlockAt, HandoffDownload, PublishedTable, traceDetails } from "../ReportContent";
import { ArtifactDownloads } from "./ArtifactDownloads";
import { ReportRecord } from "./Record";
import { namedTable } from "../reportView";
import { plainText, richParts } from "../richText";
import { forecastHandoff, RecordedModelQualifications, type ForecastModel } from "./ForecastRecord";
import { ScriptChecks } from "./ScriptChecks";
import { BARE_MODULE_CODE, handoffName } from "./evidenceLabels";
import { collectGaps, EvidenceGaps, GapSummary } from "./EvidenceGaps";
import { EvidenceHandoffs } from "./EvidenceHandoffs";
import { drawnSections, lineIsHidden } from "./evidenceDrawn";
import { Disclosure } from "./evidenceKit";
import { EvidenceSources, sourceRowId, type SourceGroup } from "./EvidenceSources";
import { Bento, Tile } from "./overview/Tile";
import { TraceSplit } from "./TraceSplit";
import { searchEvidence } from "./evidenceSearchModel";
import { EvidenceSearchField, EvidenceSearchResults, EvidenceSearchStatus } from "./EvidenceSearch";

export { hasRecordedGap } from "./EvidenceGaps";

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
function HandoffText({ text, pathway }: { text: string; pathway?: string | null }) {
  const plain = withoutMarkdown(text);
  const named = LIST_MARKER.test(text) ? NAMED_HASH.exec(plain) : null;
  if (named)
    return (
      <div className="grid gap-0.5 text-small">
        <p className="font-medium wrap-anywhere text-text-primary">{named[1]}</p>
        <code className="wrap-anywhere text-text-tertiary">{named[2]}</code>
      </div>
    );
  return (
    <p className="whitespace-pre-wrap wrap-anywhere text-text-secondary">
      {richParts(readerText(plain, pathway))}
    </p>
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
  pathway,
}: {
  snapshot: Snapshot;
  entry: OutputEntry;
  line?: number;
  pathway?: string | null;
}) {
  if (entry.output.parseError)
    return (
      <p className="text-text-secondary">This module's output could not be read into sections.</p>
    );
  const title = titleLine(entry.sections);
  const sections = drawnSections(entry)
    // CP-2G's forecast inputs are the model's raw JSON: drawn only when the address targets them.
    .filter(
      (section) =>
        line !== undefined ||
        entry.output.module !== "CP-2G" ||
        section.heading !== FORECAST_INPUTS,
    )
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
          {section.line === title
            ? moduleName(entry.output.module, pathway)
            : richParts(readerText(section.heading, pathway))}
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
                    label:
                      readerText(row.cells[0] ?? "", pathway) || `Handoff line ${String(row.line)}`,
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
                  pathway={pathway}
                />
              ) : section.heading === FORECAST_INPUTS ? (
                <pre className="max-h-100 overflow-auto rounded-ds-sm bg-surface-subtle p-3 text-caption whitespace-pre-wrap wrap-anywhere">
                  {withoutMarkdown(block.text).trim()}
                </pre>
              ) : (
                <HandoffText text={block.text} pathway={pathway} />
              )}
              {block.type === "table" && basis && (
                <p className="text-small text-text-secondary">{readerText(basis, pathway)}</p>
              )}
              {block.type === "table" && rowCitations.length > 0 && (
                <ul className="grid gap-3">
                  {rowCitations.map((row) => (
                    <li key={row.line}>
                      <h4 className="font-medium text-text-primary">
                        {richParts(row.label, (text) => readerText(text, pathway))}
                      </h4>
                      <ul className="grid gap-2">
                        {row.chips.map((chip, chipIndex) => (
                          <EvidenceCitation
                            key={chipIndex}
                            chip={chip}
                            outputId={entry.output.id}
                            pathway={pathway}
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
                    <EvidenceCitation
                      key={chipIndex}
                      chip={chip}
                      outputId={entry.output.id}
                      pathway={pathway}
                    />
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
  pathway,
}: {
  chip: Snapshot["chips"][string][number];
  outputId: string;
  pathway?: string | null;
}) {
  const note = sourceCitationNote(chip);
  const pages = citedSourcePages(outputId.split("/")[0] ?? "", chip);
  return (
    <li className="border-t border-border-hairline py-3 text-small text-text-secondary">
      <p className="font-medium wrap-anywhere text-text-primary">
        {chip.label && readerText(chip.label, pathway)}
      </p>
      {(chip.file || chip.source) && <p className="wrap-anywhere">{chip.file ?? chip.source}</p>}
      {note && <p>{note}</p>}
      {chip.excerpt && (
        <blockquote
          role="region"
          aria-label={`Passage from ${chip.label ? readerText(chip.label, pathway) : "the cited source"}`}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="mt-1 max-h-60 overflow-y-auto border-l-2 border-border-hairline pl-3 wrap-anywhere"
        >
          {chip.excerpt}
        </blockquote>
      )}
      {pages && (
        <>
          <p>{pages}</p>
          <p className="text-caption text-text-tertiary">
            Pages follow the source supplied to this run and may differ from the filing’s printed
            pages.
          </p>
        </>
      )}
      {chip.sha256 && <code className="mt-1 block wrap-anywhere">{chip.sha256}</code>}
    </li>
  );
}

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
  const gaps = collectGaps(entries, module).length;
  const outcomes = checks
    .filter((record) => !module || record.module === module)
    .flatMap((record) => record.outcomes);
  const ran = outcomes.filter((outcome) => outcome.status !== "not checked").length;
  const unlocated = selected.filter((entry) =>
    Object.entries(snapshot.chips).some(
      ([key, chips]) =>
        key.startsWith(`${entry.output.id}:`) &&
        !lineIsHidden(entry, Number(key.slice(key.lastIndexOf(":") + 1))) &&
        chips.some(
          (chip) =>
            chip.quote_found === false ||
            /not located|not found|could not be located/i.test(chip.reason ?? ""),
        ),
    ),
  ).length;
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const open = (tab: string, label: string) => (
    <a
      href={`#evidence/${tab}${module ? `/${module}` : ""}`}
      className="inline-flex min-h-8 w-fit items-center rounded-ds-xs text-caption text-text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {label}
    </a>
  );
  return (
    <section aria-label="Run evidence" className="grid min-w-0 gap-2 lg:col-span-12">
      <h3 className="text-h4 font-medium text-text-primary">Run evidence</h3>
      <StatsStrip
        label="What this run holds"
        stats={[
          {
            label: plural(gaps, "recorded gap", "recorded gaps"),
            value: String(gaps),
            mark: open("gaps", "Open Gaps"),
          },
          {
            label: plural(handoffs, "designated handoff", "designated handoffs"),
            value: String(handoffs),
            mark: open("record", "Open Record"),
          },
          {
            label: plural(sources, "source file", "source files"),
            value: String(sources),
            mark: open("sources", "Open Sources"),
          },
          {
            label: "script checks ran",
            value: `${String(ran)} of ${String(outcomes.length)}`,
            mark: checks.length > 0 ? open("checks", "Open Checks") : undefined,
          },
          {
            label: plural(
              unlocated,
              "handoff with an unlocated Basis",
              "handoffs with an unlocated Basis",
            ),
            value: String(unlocated),
          },
        ]}
      />
    </section>
  );
}

const tabs = ["Summary", "Trace", "Sources", "Gaps", "Script checks", "Record"] as const;
type EvidenceTab = (typeof tabs)[number];

const tabRoute = (tab: EvidenceTab) => (tab === "Script checks" ? "checks" : tab.toLowerCase());

/** Places on the Record tab a link can land on: the notes, the run record (and the comparison note in it), the files. */
const RECORD_TARGETS = ["notes", "run", "comparison", "files"] as const;
type RecordTarget = (typeof RECORD_TARGETS)[number];
const asRecordTarget = (word: string | undefined) => RECORD_TARGETS.find((item) => item === word);

function evidenceRoute(entries: OutputEntry[], target: string | undefined, hasChecks: boolean) {
  const [section, second, third] = (target ?? "").split("/");
  const recordTarget =
    section === "record" ? (asRecordTarget(second) ?? asRecordTarget(third)) : undefined;
  // "-" stands for no module where a later part follows: the Sources address of one file's row.
  const module =
    (asRecordTarget(second) && section === "record") || second === "-" ? undefined : second;
  const sourceRow = section === "sources" ? /^file-(\d+)$/.exec(third ?? "")?.[1] : undefined;
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
  return {
    module,
    location,
    invalidTraceAddress,
    tab,
    selectedIndex,
    entry,
    selectedModule,
    line,
    recordTarget,
    sourceRow: sourceRow === undefined ? undefined : Number(sourceRow),
  };
}

function EvidenceNavigation({
  entries,
  tab,
  selectedModule,
  checks,
  search,
  pathway,
  searching,
}: {
  entries: OutputEntry[];
  tab: EvidenceTab;
  selectedModule?: string;
  checks: ScriptCheckRecord[];
  search: ReactNode;
  pathway?: string | null;
  /** While a query is typed the matches replace the page, so the tabs and the module filter step aside. */
  searching: boolean;
}) {
  const outcomes = checks
    .filter((record) => !selectedModule || record.module === selectedModule)
    .flatMap((record) => record.outcomes);
  const ran = outcomes.filter((outcome) => outcome.status !== "not checked").length;
  const segments = tabs
    .filter((item) => item !== "Script checks" || checks.length > 0)
    .map((item) =>
      item === "Script checks"
        ? {
            key: tabRoute(item),
            label: (
              <>
                Checks
                <span className="font-mono text-caption tabular-nums">
                  {String(ran)} of {String(outcomes.length)}
                </span>
              </>
            ),
            accessibleLabel: `Script checks, ${String(ran)} of ${String(outcomes.length)}`,
            href: `#evidence/checks${selectedModule ? `/${selectedModule}` : ""}`,
          }
        : {
            key: tabRoute(item),
            label: item,
            href: `#evidence/${tabRoute(item)}${selectedModule ? `/${selectedModule}` : ""}`,
          },
    );
  return (
    <>
      <h2 className="font-display text-h2">Evidence</h2>
      {search}
      <div className="flex flex-wrap items-end justify-between gap-3" hidden={searching}>
        <Segmented label="Evidence sections" current={tabRoute(tab)} segments={segments} />
        <label className="grid gap-1 text-small">
          Module
          <select
            className={`${field} min-h-8 max-[480px]:min-h-11`}
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
                {moduleName(id, pathway)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

function EvidenceHandoff({
  run,
  entry,
  line,
  snapshot,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entry: OutputEntry;
  line?: number;
}) {
  return (
    <Tile
      span={12}
      label={`${moduleName(entry.output.module, run.pathway)} handoff`}
      title={`${moduleName(entry.output.module, run.pathway)} · ${
        line === undefined ? "Handoff evidence" : `Line ${String(line)}`
      }`}
      kicker={line === undefined ? undefined : "Where the line sits in its handoff."}
      trace={<HandoffDownload run={run} entry={entry} />}
    >
      <EvidenceLocation snapshot={snapshot} entry={entry} line={line} pathway={run.pathway} />
    </Tile>
  );
}

/**
 * Brings an address's target into view and puts focus on it, once the target is drawn: the page
 * may draw it after the address arrives. A new address lands again; the same one does not.
 */
function useLandOn(address: string | undefined, id: string | undefined) {
  const landed = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!address || !id) {
      landed.current = undefined;
      return;
    }
    if (landed.current === address) return;
    // After the frame's own "a new address opens at the top" reset, which runs in the same commit.
    const timer = window.setTimeout(() => {
      const element = document.getElementById(id);
      if (!element) return;
      landed.current = address;
      element.scrollIntoView({ block: "start" });
      element.focus({ preventScroll: true });
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  });
}

const CLAIM_ID = "evidence-claim";

/** Where an Evidence address lands: a place on Record, one file's row on Sources, or the trace asked for. */
function landingId(
  tab: EvidenceTab,
  recordTarget: RecordTarget | undefined,
  sourceRow: number | undefined,
  traced: boolean,
  claim: boolean,
) {
  if (tab === "Record" && recordTarget)
    return `evidence-record-${recordTarget === "comparison" ? "run" : recordTarget}`;
  if (tab === "Sources" && sourceRow !== undefined) return sourceRowId(sourceRow);
  if (!traced) return undefined;
  // A traced line lands on its claim tile; a whole handoff, or a line it does not hold, on the heading.
  return claim ? CLAIM_ID : "evidence-trace";
}

/**
 * The run's handoffs as a short list of links, each opening that handoff line by line. The hashes
 * and the files are machinery of the Record tab, and stay there.
 */
function HandoffIndex({
  entries,
  module,
  run,
}: {
  entries: OutputEntry[];
  module?: string;
  run: PublishedRun;
}) {
  const shown = entries.filter((item) => !module || item.output.module === module);
  return (
    <Tile
      span={12}
      label="Handoffs"
      title="Handoffs"
      kicker={
        <>
          Open a handoff to read it line by line.{" "}
          <a
            href={`#evidence/record${module ? `/${module}` : ""}/files`}
            className="rounded-ds-xs text-text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Hashes and downloads are on Record
          </a>
          .
        </>
      }
    >
      {shown.length === 0 ? (
        <p className="text-small text-text-secondary">
          No handoff files were delivered for this run.
        </p>
      ) : (
        <ul className="grid min-w-0 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <li key={item.output.id} className="min-w-0 border-t border-border-hairline">
              <Button
                href={evidencePath(run.folder, item)}
                color="link-gray"
                size="sm"
                className="min-h-8 underline max-[480px]:min-h-11"
                iconTrailing={ArrowRight}
              >
                {handoffName(item, run.pathway)}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

/** The short list of handoffs: on Summary, and on Trace while nothing is chosen. */
function showHandoffIndex(tab: EvidenceTab, entry: OutputEntry | undefined, invalid: boolean) {
  return tab === "Summary" || (tab === "Trace" && !entry && !invalid);
}

function assumptionSourceLines(
  handoff: OutputEntry | undefined,
  register: NonNullable<ForecastModel["register"]>,
) {
  const lines = new Map<string, number | null>();
  const table = handoff && namedTable(handoff, register.heading, register.headers);
  if (
    !table ||
    table.headers.length !== register.headers.length ||
    !table.headers.every((header, index) => header === register.headers[index])
  )
    return lines;
  for (const row of table.rows) {
    if (row.cells.length !== register.headers.length) continue;
    const key = JSON.stringify(row.cells);
    lines.set(key, lines.has(key) ? null : row.line);
  }
  return lines;
}

function AssumptionRegister({
  model,
  entries,
  folder,
  pathway,
}: {
  model: ForecastModel;
  entries: OutputEntry[];
  folder: string;
  pathway?: string | null;
}) {
  const register = model.register;
  if (!register) return null;
  const handoff = forecastHandoff(model, entries, folder);
  const lines = assumptionSourceLines(handoff, register);
  return (
    <section
      aria-label={`Assumption register: ${model.id}`}
      className="grid min-w-0 grid-cols-1 gap-3 rounded-ds-md border border-border-hairline p-4"
    >
      <h4 className="text-h4 font-medium text-text-primary">{register.heading}</h4>
      <p className="wrap-anywhere">Model {model.id}</p>
      {register.intro && <p>{register.intro}</p>}
      {/* A recorded register can be wider than the viewport. */}
      <div
        role="region"
        aria-label={register.heading}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="min-w-0 overflow-x-auto"
      >
        <table className="w-full border-collapse text-small">
          <caption className="sr-only">{register.heading}</caption>
          <thead>
            <tr>
              {register.headers.map((header, index) => (
                <th key={index} scope="col" className="px-3 py-2 text-left">
                  {header}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-left">
                Evidence
              </th>
            </tr>
          </thead>
          <tbody>
            {register.rows.map((cells, index) => {
              const line = lines.get(JSON.stringify(cells));
              return (
                <tr key={index} className="border-t border-border-hairline align-top">
                  {cells.map((cell, i) => (
                    <td key={i} className="px-3 py-2">
                      {readerText(cell, pathway)}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {handoff && line != null ? (
                      <Button
                        href={evidencePath(folder, handoff, line)}
                        color="link-gray"
                        size="sm"
                        className="min-h-8 max-[480px]:min-h-11"
                      >
                        Source row
                      </Button>
                    ) : (
                      "Source row not matched"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReportEvidence({
  snapshot,
  run,
  entries,
  target,
  comparison,
  mode,
  models = [],
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entries: OutputEntry[];
  target?: string;
  comparison?: ReactNode;
  mode: Mode;
  models?: ForecastModel[];
}) {
  const checks = run.evidence.scriptChecks ?? [];
  const {
    module,
    invalidTraceAddress,
    tab,
    selectedIndex,
    entry,
    selectedModule,
    line,
    recordTarget,
    sourceRow,
  } = evidenceRoute(entries, target, checks.length > 0);
  const claim = Boolean(
    entry && line !== undefined && !lineIsHidden(entry, line) && handoffBlockAt(entry, line),
  );
  const landing = landingId(tab, recordTarget, sourceRow, Boolean(entry), claim);
  useLandOn(landing && target, landing);
  // A query belongs to the address it was typed at: following a result (a new address) clears it.
  const [typed, setTyped] = useState({ text: "", target });
  const query = typed.target === target ? typed.text : "";
  const setQuery = (text: string) => {
    setTyped({ text, target });
  };
  const found = searchEvidence(query, entries, run);
  const { evidence } = run;
  const sourceGroups: SourceGroup[] = [
    { label: "Used by a module", rows: evidence.sources },
    { label: "Supplied, not used", rows: evidence.unused },
    { label: "Not recorded as used", rows: evidence.unrecorded },
  ];
  const downloads =
    evidence.downloads.length > 0 ? (
      <ArtifactDownloads folder={run.folder} />
    ) : (
      <Tile span={12} label="Model and calculation files" title="Model and calculation files">
        <p className="text-small text-text-secondary">
          No model or calculation downloads are listed for this run.
        </p>
      </Tile>
    );
  return (
    <div className="grid min-w-0 gap-5">
      <EvidenceNavigation
        entries={entries}
        tab={tab}
        selectedModule={selectedModule}
        checks={checks}
        pathway={run.pathway}
        searching={Boolean(query.trim())}
        search={
          <div className="grid min-w-0 gap-2">
            <EvidenceSearchField value={query} onChange={setQuery} />
            <EvidenceSearchStatus query={query} found={found} />
          </div>
        }
      />
      {query.trim() ? (
        <EvidenceSearchResults found={found} />
      ) : (
        <Bento>
          {tab === "Summary" && (
            <>
              <EvidenceSummary
                entries={entries}
                module={module}
                sourceGroups={sourceGroups}
                checks={checks}
                snapshot={snapshot}
              />
              <GapSummary run={run} entries={entries} module={module} />
            </>
          )}
          {entry && (
            <h3 id="evidence-trace" tabIndex={-1} className="sr-only">
              {`Trace: ${moduleName(entry.output.module, run.pathway)}${
                line === undefined ? ", whole handoff" : `, handoff line ${String(line)}`
              }`}
            </h3>
          )}
          {entry && line !== undefined && (
            <TraceSplit
              snapshot={snapshot}
              run={run}
              entry={entry}
              line={line}
              index={selectedIndex}
              claimId={CLAIM_ID}
            />
          )}
          {entry && <EvidenceHandoff snapshot={snapshot} run={run} entry={entry} line={line} />}
          {tab === "Trace" && invalidTraceAddress && (
            <section
              role="alert"
              className="grid min-w-0 gap-2 rounded-ds-lg border border-warning-edge bg-warning-fill p-5 sm:p-6 lg:col-span-12"
            >
              <h3 className="text-h4 font-medium text-warning-text">Evidence link unavailable</h3>
              <p className="text-text-secondary">
                This link does not match a saved handoff in this report. Go to Summary and choose a
                handoff from the list.
              </p>
            </section>
          )}
          {tab === "Sources" && (
            <EvidenceSources
              sourceGroups={sourceGroups}
              module={module}
              modules={[...new Set(entries.map((item) => item.output.module))]}
              entries={entries}
              snapshot={snapshot}
              folder={run.folder}
              pathway={run.pathway}
              rowTarget={sourceRow}
            />
          )}
          {tab === "Trace" && !entry && !invalidTraceAddress && (
            <Tile span={12} label="Choose something to trace">
              <p className="text-text-secondary">
                Open a handoff below, or select the source icon beside a finding, row or figure and
                choose Open in Evidence.
              </p>
            </Tile>
          )}
          {tab === "Record" && (
            <Disclosure
              id="evidence-record-run"
              title="Show the run record"
              hint="calls, cap, spend and models; the comparison note when the run has one"
              open={
                recordTarget === "run" ||
                recordTarget === "comparison" ||
                Boolean(run.changes?.note || run.changes?.problem)
              }
            >
              <ReportRecord run={run} entries={entries} module={module} mode={mode} />
            </Disclosure>
          )}
          {showHandoffIndex(tab, entry, invalidTraceAddress) && (
            <HandoffIndex entries={entries} module={module} run={run} />
          )}
          {tab === "Record" && (
            <>
              <EvidenceHandoffs entries={entries} module={module} run={run} />
              <div
                id="evidence-record-files"
                tabIndex={-1}
                className="min-w-0 outline-none lg:col-span-12"
              >
                {downloads}
              </div>
            </>
          )}
          {tab === "Record" && (!module || module === "CP-2G") && models.length > 0 && (
            <Disclosure
              id="evidence-record-notes"
              title="Show model notes, limitations and assumption registers"
              hint={`${String(models.length)} ${models.length === 1 ? "model" : "models"}, as recorded for the forecast`}
              open={recordTarget === "notes"}
            >
              <RecordedModelQualifications models={models} />
              {models.map((model) => (
                <AssumptionRegister
                  key={model.id}
                  model={model}
                  entries={entries}
                  folder={run.folder}
                  pathway={run.pathway}
                />
              ))}
            </Disclosure>
          )}
          {tab === "Trace" && !entry && (!module || module === "CP-8") && comparison && (
            <div className="min-w-0 lg:col-span-12">{comparison}</div>
          )}
          {tab === "Gaps" && <EvidenceGaps run={run} entries={entries} module={module} />}
          {tab === "Script checks" && (
            <ScriptChecks records={checks} module={module} pathway={run.pathway} />
          )}
        </Bento>
      )}
    </div>
  );
}
