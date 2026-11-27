import { ArrowRight, ClockRewind } from "@untitledui/icons";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { Segmented } from "@/components/kit/Segmented";
import { changesSentence } from "../api";
import {
  comparisonRows,
  containsReference,
  type MaturityProfile,
  type OutputEntry,
  type PublishedChanges,
  type PublishedRun,
  type Snapshot,
  withoutReferences,
} from "../publishedReport";
import { withoutReference } from "./moduleRecordsModel";
import { PublishedTable } from "../ReportContent";
import { MaturityPair, usableProfile } from "./changes/MaturityPair";
import { MeasureList } from "./changes/MeasureList";
import { ModuleMatrix } from "./changes/ModuleMatrix";
import {
  analysisRows,
  classifyMeasures,
  issuerFacts,
  ledgerOf,
  leftovers,
  passageItems,
  problemSentence,
  stated,
  verdictOf,
  words,
  type PassageItem,
} from "./changes/model";

const ISSUER_REGISTER = "What changed: the issuer";
const ANALYSIS_REGISTER = "What changed: the analysis";
const LEDGER_REGISTER = "Limitations ledger";
import { LINK, PassageBody, PassageTile } from "./changes/PassageTile";
import { AnalysisTile, FactsTile, LeftoverTile, LedgerTile } from "./changes/Registers";
import { comparisonTrace, maturityTraces } from "./comparisonTrace";
import { asOfDate } from "../runFigures";
import { Bento, GapNote, GapSentence, Tile } from "./overview/Tile";
import { PublishedSource } from "./PublishedTrace";

const BUTTON = "min-h-8 max-[480px]:min-h-11";

const SAME_PERIOD = " · Same-period analysis change";
/** Measure, Earlier, Current and Difference: figures and labels, drawn without a citation token. */
const FIGURE_COLUMNS = 4;
function readerCell(cell: string, column: number) {
  if (!containsReference(cell)) return cell;
  // Removes only a gap id after the empty-set mark, so a missing value stays distinct from zero.
  if (column < FIGURE_COLUMNS) return withoutReference(cell.replace(/(∅)\s*\[?G\d+\]?/gu, "$1"));
  const revision = cell.endsWith(SAME_PERIOD);
  const reason = revision ? cell.slice(0, -SAME_PERIOD.length) : cell;
  return (withoutReferences(reason) || stated(reason)) + (revision ? SAME_PERIOD : "");
}

export function ComparisonTable({
  rows,
  source,
  evidence = true,
}: {
  rows: string[][];
  source?: (label: string, index: number) => string | undefined;
  /** True (the Evidence page) draws a cell's references; false keeps only its own words. */
  evidence?: boolean;
}) {
  // PublishedTable's reader mode would add its own link or "unavailable" note to a citing cell;
  // the row already has its one trace control, so each cell is drawn without its references.
  const drawn = evidence ? rows : rows.map((cells) => cells.map(readerCell));
  return (
    <PublishedTable
      evidence
      rowSource={
        source &&
        ((line, label) => {
          const href = source(label, line);
          return (
            href && (
              <PublishedSource href={href} name={label}>
                Comparison row
              </PublishedSource>
            )
          );
        })
      }
      table={{
        type: "table",
        line: 0,
        headers: [
          "Measure",
          "Earlier",
          "Current",
          "Difference",
          "Comparability",
          "Analysis change",
        ],
        rows: drawn.map((cells, line) => ({ cells, line })),
      }}
    />
  );
}

/** The fixed sentence for a run with no comparison pack; the service's own reason is drawn only with the evidence. */
function noComparisonSentence(raw: string | null | undefined) {
  const text = (raw ?? "").replace(/^\s*changes:\s*/i, "").trim();
  const form = text.toLowerCase();
  if (form.startsWith("not produced"))
    return "The comparison was planned but not produced for this run.";
  if (form.startsWith("not compared")) return "This run was not compared with an earlier run.";
  if (form.startsWith("first run of this pathway")) {
    const sentence = changesSentence(text);
    if (!containsReference(sentence))
      return sentence.replace(/^./, (c) => c.toUpperCase()).replace(/\.?$/, ".");
  }
  return "No comparison was recorded for this run.";
}

export function ReportChanges({
  snapshot,
  run,
  entries,
  change,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entries: OutputEntry[];
  change: PublishedChanges | null | undefined;
}) {
  const entry = change?.problem
    ? undefined
    : entries.find((item) => item.output.module === "CP-8" && item.selected);
  const trace = comparisonTrace(run.folder, change?.problem ? [] : entries);
  if (change?.first_run === true && !change.pack && !change.problem && !change.note)
    return <FirstRun />;
  if (change?.problem || !change?.pack)
    return (
      <>
        <h2 className="font-display text-h3 text-text-primary">Changes since the last run</h2>
        <NoComparison change={change} pathway={run.pathway} />
        {entry && (
          <Bento>
            <Passages entry={entry} folder={run.folder} pathway={run.pathway} withBottomLine />
            <FactsTile result={issuerFacts(entry, run.folder, new Set(), run.pathway)} />
            <AnalysisTile rows={analysisRows(entry, run.folder, undefined, run.pathway)} />
            <LedgerTile
              ledger={ledgerOf(entry, run.folder, run.pathway)}
              entry={entry}
              folder={run.folder}
            />
            <LeftoverTile
              sections={leftovers(entry, run.folder, run.pathway)}
              entry={entry}
              folder={run.folder}
            />
          </Bento>
        )}
      </>
    );
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-h3 text-text-primary">Changes since the last run</h2>
        <Button
          href={trace.handoff ?? "#evidence/trace/CP-8"}
          color="link-gray"
          size="sm"
          iconTrailing={ArrowRight}
          className={BUTTON}
        >
          Review comparison evidence
        </Button>
      </div>
      <Comparison
        snapshot={snapshot}
        run={run}
        entries={entries}
        change={change}
        entry={entry}
        trace={trace}
      />
    </>
  );
}

type Trace = ReturnType<typeof comparisonTrace>;

function ComparedDates({ change }: { change: PublishedChanges }) {
  const { prior, current } = change.pack ?? {};
  if (!prior?.as_of || !current?.as_of) return null;
  return (
    <p className="flex flex-wrap items-center gap-2 text-small text-text-secondary">
      <span className="rounded-ds-xs bg-surface-subtle px-2 py-1">
        Earlier run, as of {asOfDate(prior.as_of)}
      </span>
      <ArrowRight aria-hidden="true" className="size-4 text-text-tertiary" />
      <span className="rounded-ds-xs bg-surface-selected px-2 py-1 text-text-link">
        This run, as of {asOfDate(current.as_of)}
      </span>
    </p>
  );
}

/** Row 1: the first paragraph of the Bottom line, whole, is the verdict; the rest of the passage is its body. */
function Verdict({
  change,
  entry,
  folder,
  pathway,
}: {
  change: PublishedChanges;
  entry: OutputEntry | undefined;
  folder: string;
  pathway?: string | null;
}) {
  const verdict = verdictOf(entry, folder, pathway);
  return (
    <Tile
      span={12}
      label="Verdict"
      trace={
        verdict?.first.text ? (
          <PublishedSource
            href={verdict.first.href}
            name="The verdict"
            linkLabel="Source for the verdict"
          >
            Source
          </PublishedSource>
        ) : undefined
      }
    >
      <h3 className="sr-only">Verdict</h3>
      <div className="grid content-start gap-3">
        {verdict?.first.text ? (
          <p
            className={cx(
              "reading-copy max-w-[52ch] font-display text-balance text-text-primary",
              verdict.first.text.length > 240 ? "text-h4 sm:text-h3" : "text-h3 sm:text-h2",
            )}
          >
            {verdict.first.text}
          </p>
        ) : verdict ? (
          <a className={LINK} href={verdict.first.href}>
            Read the verdict in Evidence
          </a>
        ) : (
          <GapNote>The comparison does not state a verdict in a sentence.</GapNote>
        )}
        {verdict && entry && verdict.body.length > 0 && (
          <PassageBody items={verdict.body} noun="passage" entry={entry} folder={folder} />
        )}
        <ComparedDates change={change} />
        <GapSentence>Stance, earlier → current: the comparison does not state it</GapSentence>
      </div>
    </Tile>
  );
}

function noMovement(groups: ReturnType<typeof classifyMeasures>) {
  if (groups.revised.length > 0) return null;
  if (groups.unmoved.length > 0) return "No comparable measure moved between the two runs.";
  return "No measure could be assessed between the two runs.";
}

function Measures({
  change,
  entry,
  trace,
  folder,
  lead,
  pathway,
}: {
  change: PublishedChanges;
  entry: OutputEntry | undefined;
  trace: Trace;
  folder: string;
  /** What the module wrote above its table of measures: it qualifies every figure drawn here. */
  lead: PassageItem[];
  pathway?: string | null;
}) {
  const [view, setView] = useState<"list" | "table">("list");
  const groups = classifyMeasures(change, trace.measure, entry, folder, pathway);
  const rows = comparisonRows(change, "reader");
  if (!rows.length)
    return (
      <Tile span={7} label="Measures that moved" title="Measures that moved">
        <GapNote>The comparison carries no measures for these two runs.</GapNote>
      </Tile>
    );
  const hrefs = new Map(
    [...groups.moved, ...groups.revised, ...groups.unmoved, ...groups.notAssessable].map((item) => [
      item.index,
      item.href,
    ]),
  );
  const { moved, revised, notAssessable } = groups;
  const none = noMovement(groups);
  return (
    <Tile
      span={7}
      label="Measures that moved"
      title={view === "table" ? "All compared measures" : "Measures that moved"}
      trace={
        <Segmented
          label="Presentation"
          current={view}
          onSelect={(key) => {
            setView(key === "table" ? "table" : "list");
          }}
          segments={[
            { key: "list", label: "List" },
            { key: "table", label: "Table" },
          ]}
        />
      }
    >
      {entry && lead.length > 0 && (
        <PassageBody items={lead} noun="passage" entry={entry} folder={folder} />
      )}
      {view === "table" ? (
        <section aria-label="Earlier against current">
          <ComparisonTable
            rows={rows}
            evidence={false}
            source={(_label, index) => hrefs.get(index)}
          />
        </section>
      ) : (
        <>
          <p className="text-caption text-text-tertiary">
            Earlier → current, in the comparison’s order
          </p>
          {!entry && (
            <p className="text-small text-gap-text">
              The comparison module did not run for this report, so no cause is stated.
            </p>
          )}
          {moved.length > 0 ? (
            <MeasureList label="Measures that moved" items={moved} evidence={trace.handoff} />
          ) : (
            none && <GapNote>{none}</GapNote>
          )}
          <MeasureGroup
            title="Revised for the same period"
            items={revised}
            evidence={trace.handoff}
          />
          <MeasureGroup
            title="Not assessable"
            items={notAssessable}
            ranked={false}
            evidence={trace.handoff}
          />
        </>
      )}
    </Tile>
  );
}

function MeasureGroup({
  title,
  items,
  ranked = true,
  evidence,
}: {
  title: string;
  items: Parameters<typeof MeasureList>[0]["items"];
  ranked?: boolean;
  evidence?: string;
}) {
  if (!items.length) return null;
  return (
    <div className="grid gap-3 border-t border-border-hairline pt-4">
      <h4 className="text-small font-medium text-text-secondary">{title}</h4>
      <MeasureList label={title} items={items} ranked={ranked} level="h5" evidence={evidence} />
    </div>
  );
}

function Comparison({
  snapshot,
  run,
  entries,
  change,
  entry,
  trace,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entries: OutputEntry[];
  change: PublishedChanges;
  entry: OutputEntry | undefined;
  trace: Trace;
}) {
  const pack = change.pack;
  const { unmoved, matchedLines } = classifyMeasures(
    change,
    trace.measure,
    entry,
    run.folder,
    run.pathway,
  );
  const folder = run.folder;
  const ledger = entry ? ledgerOf(entry, folder, run.pathway) : null;
  // A register's lead paragraph is drawn with the register it qualifies; the rest stays last.
  const placed = new Set([
    ...(comparisonRows(change, "reader").length > 0 ? [ISSUER_REGISTER] : []),
    ...(pack?.modules?.length ? [ANALYSIS_REGISTER] : []),
    ...(ledger ? [LEDGER_REGISTER] : []),
  ]);
  const written = entry ? leftovers(entry, folder, run.pathway) : [];
  const lead = (heading: string) =>
    placed.has(heading)
      ? written.filter((section) => section.heading === heading).flatMap(({ items }) => items)
      : [];
  const rest = written.filter((section) => !placed.has(section.heading));
  const analysisLead = lead(ANALYSIS_REGISTER);
  return (
    <Bento>
      <Verdict change={change} entry={entry} folder={folder} pathway={run.pathway} />
      <Measures
        change={change}
        entry={entry}
        trace={trace}
        folder={folder}
        lead={lead(ISSUER_REGISTER)}
        pathway={run.pathway}
      />
      {Boolean(pack?.modules?.length) && (
        <Tile span={5} label="Modules" title="What changed in the analysis" className="self-start">
          {pack?.prior?.format === "earlier" && (
            <p className="text-small text-text-secondary">
              The earlier run used an earlier report format.
            </p>
          )}
          {entry && analysisLead.length > 0 && (
            <PassageBody items={analysisLead} noun="passage" entry={entry} folder={folder} />
          )}
          <ModuleMatrix change={change} source={trace.module} pathway={run.pathway} />
        </Tile>
      )}
      <Maturities
        profile={pack?.maturity_profile}
        omitted={pack?.omitted?.maturity_profile}
        pathway={run.pathway}
        traces={pack?.maturity_profile ? maturityTraces(snapshot, run, entries, change) : undefined}
      />
      {entry && <Passages entry={entry} folder={folder} pathway={run.pathway} />}
      {entry && (
        <LedgerTile ledger={ledger} entry={entry} folder={folder} lead={lead(LEDGER_REGISTER)} />
      )}
      <FactsTile result={issuerFacts(entry, folder, matchedLines, run.pathway)} />
      {entry && (
        <AnalysisTile
          rows={analysisRows(
            entry,
            folder,
            new Set((pack?.modules ?? []).map((item) => item.module)),
            run.pathway,
          )}
          title="Also compared in the analysis"
        />
      )}
      {entry && <LeftoverTile sections={rest} entry={entry} folder={folder} />}
      {unmoved.length > 0 && (
        <Tile span={12} label="Measures that did not move" title="Measures that did not move">
          <details>
            <summary className="flex min-h-8 cursor-pointer items-center text-small font-medium text-text-link max-[480px]:min-h-11">
              Show the {unmoved.length} {unmoved.length === 1 ? "measure" : "measures"}
            </summary>
            <div className="mt-4">
              <MeasureList
                label="Measures that did not move"
                items={unmoved}
                ranked={false}
                evidence={trace.handoff}
                quiet
              />
            </div>
          </details>
        </Tile>
      )}
    </Bento>
  );
}

/** What the comparison module wrote, one tile per reader passage; absent is the designed gap. */
function Passages({
  entry,
  folder,
  pathway,
  withBottomLine = false,
}: {
  entry: OutputEntry;
  folder: string;
  pathway?: string | null;
  withBottomLine?: boolean;
}) {
  const tile = (
    span: 5 | 7 | 12,
    title: string,
    noun: string,
    extra: { numbered?: boolean; tone?: "counter" } = {},
  ) => (
    <PassageTile
      span={span}
      title={title}
      noun={noun}
      items={passageItems(entry, title, folder, pathway)}
      entry={entry}
      folder={folder}
      {...extra}
    />
  );
  return (
    <>
      {withBottomLine && tile(12, "Bottom line", "passage")}
      {tile(7, "Key findings", "finding", { numbered: true })}
      {tile(5, "Contrary evidence and what would change the view", "passage", { tone: "counter" })}
      {tile(12, "Limitations", "limitation")}
    </>
  );
}

function Maturities({
  profile,
  omitted,
  pathway,
  traces,
}: {
  profile?: MaturityProfile;
  omitted?: string;
  pathway?: string | null;
  traces?: ReturnType<typeof maturityTraces>;
}) {
  const gap = (reason: string) => (
    <Tile
      span={12}
      label="Maturities then and now"
      title="Debt maturities, earlier run against this run"
    >
      <GapNote>{reason}</GapNote>
    </Tile>
  );
  if (!profile)
    return omitted
      ? gap(containsReference(omitted) ? "See the comparison evidence." : words(omitted, pathway))
      : null;
  if (!usableProfile(profile))
    return gap("The published comparison does not contain a usable maturity schedule.");
  return <MaturityPair profile={profile} traces={traces} />;
}

/** The designed empty state: one fixed sentence on a solid chip and the one action that fixes it. */
function NoComparison({
  change,
  pathway,
}: {
  change: PublishedChanges | null | undefined;
  pathway?: string | null;
}) {
  const sentence = change?.problem
    ? problemSentence(change.problem, pathway)
    : noComparisonSentence(change?.note);
  return (
    <Bento>
      <Tile span={12} label="No comparison" className="items-center py-10 text-center">
        <ClockRewind aria-hidden="true" className="size-8 text-text-tertiary" />
        <div className="w-full max-w-xl">
          <GapNote>{sentence}</GapNote>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="#overview" color="secondary" size="sm" className={BUTTON}>
            Open the Overview
          </Button>
          <Button
            href="#evidence/record"
            color="link-gray"
            size="sm"
            iconTrailing={ArrowRight}
            className={BUTTON}
          >
            Review comparison evidence
          </Button>
          <RunsLink />
        </div>
      </Tile>
    </Bento>
  );
}

/** The way from a page with nothing to compare to the list of this issuer's runs. */
function RunsLink() {
  return (
    <Button
      href="#history"
      color="link-gray"
      size="sm"
      iconTrailing={ArrowRight}
      className={BUTTON}
    >
      All runs of this issuer
    </Button>
  );
}

function FirstRun() {
  return (
    <Bento>
      <Tile span={12} label="No earlier run" className="items-center py-12 text-center">
        <ClockRewind aria-hidden="true" className="size-8 text-text-tertiary" />
        <h2 className="font-display text-h2 text-text-primary">No earlier run to compare.</h2>
        <div className="w-full max-w-xl">
          <GapNote>This is the first listed run for this issuer on this pathway.</GapNote>
        </div>
        <p className="reading-copy text-body text-text-secondary">
          Only reports already listed when this run was made can be used for comparison.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="#overview" color="secondary" className={BUTTON}>
            Open the Overview
          </Button>
          <RunsLink />
        </div>
      </Tile>
    </Bento>
  );
}
