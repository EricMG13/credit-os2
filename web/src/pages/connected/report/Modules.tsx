import { createElement, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { StageNav } from "@/pages/library/parts/ModuleNav";
import { RunContext } from "@/pages/library/parts/RunContext";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import type { Trace } from "@/pages/library/slice";
import { sectionTraces, traceForConfidence, traceForLine } from "../ReportContent";
import {
  evidenceHref,
  evidencePath,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import { moduleState, traceKey, type ReportView } from "../reportView";
import { CompanyProfile } from "./CompanyProfile";
import { ModuleConfidence } from "./Confidence";
import { leadFor } from "./leads";
import { LeadEvidence } from "./leads/kit/LeadFrame";
import { framed, ModuleFigures, moduleFigures } from "./ModuleFigures";
import { CONTRARY, KEY_FINDINGS, moduleFrame } from "./moduleFrameModel";
import {
  ANCHOR,
  ModuleFindings,
  ModuleHeader,
  ModuleLimitations,
  NextModule,
  chartGaps,
  type FrameModule,
} from "./ModuleFrame";
import { ProseTiles } from "./ModuleProse";
import { ModuleRecords } from "./ModuleRecords";
import { ModuleStats } from "./ModuleStats";
import { moduleRecords } from "./moduleRecordsModel";
import { Bento, GapNote, Tile } from "./overview/Tile";
import { byStage } from "./stages";

type ModuleItem = ReportView["modules"][number];

const CONFIDENCE_TRACE = "module-confidence";
const moduleHref = (id: string) => `#modules/${encodeURIComponent(id)}`;

function defaultOutput(outputs: OutputEntry[]) {
  return (
    outputs.find(({ selected }) => selected) ?? (outputs.length === 1 ? outputs[0] : undefined)
  );
}

function moduleOutput(current: ModuleItem, output: string | undefined) {
  if (output === undefined) return defaultOutput(current.outputs);
  return /^(?:0|[1-9]\d*)$/.test(output) ? current.outputs[Number(output)] : undefined;
}

function pageTraces(snapshot: Snapshot, entry: OutputEntry, index: number, pathway: string | null) {
  const traces: Record<string, Trace> = sectionTraces(snapshot, entry, entry.sections, pathway);
  const extra = [entry.output.summary?.line, ...chartGaps(entry).map(({ line }) => line)];
  for (const line of extra) {
    if (line === undefined) continue;
    const trace = traceForLine(snapshot, entry, index, line, pathway);
    if (trace) traces[traceKey(entry, line)] = trace;
  }
  const confidence = traceForConfidence(snapshot, entry, pathway);
  if (confidence) traces[CONFIDENCE_TRACE] = confidence;
  return traces;
}

function nextModule(view: ReportView, id: string): FrameModule | undefined {
  const order = byStage(view.modules).flatMap(({ rows }) => rows);
  return order[order.findIndex((item) => item.id === id) + 1];
}

/** Everything the page draws for one module output, read once per render. */
function pageOf(run: PublishedRun, entry: OutputEntry) {
  const pathway = run.pathway;
  const figures = moduleFigures(entry, run);
  const Lead = leadFor(entry.output.module);
  const kinds = framed(Lead);
  const frame = moduleFrame(entry, {
    figureTableLines: figures.tableLines,
    typedTables: kinds.has("figures"),
    pathway,
  });
  const gaps = chartGaps(entry);
  const limitations = Boolean(
    frame.limitations ||
    frame.hollow.Limitations ||
    frame.missing.includes("Limitations") ||
    frame.summaryLimitation ||
    gaps.length,
  );
  const records = moduleRecords(entry, pathway);
  const hasRecords = records.tables.length > 0 || records.evidence.length > 0;
  return { figures, Lead, kinds, frame, gaps, limitations, hasRecords };
}

type Page = ReturnType<typeof pageOf>;

/** The page's sections the navigator lists under this module, in page order. */
function pageSections({ frame, limitations, hasRecords }: Page) {
  const has = (passage: string, section: unknown) =>
    Boolean(section) || frame.missing.includes(passage);
  return [
    ...(frame.bottomLine || frame.hollow["Bottom line"]
      ? [{ id: ANCHOR.bottomLine, label: "Bottom line" }]
      : []),
    ...(has(KEY_FINDINGS, frame.keyFindings ?? frame.hollow[KEY_FINDINGS])
      ? [{ id: ANCHOR.findings, label: KEY_FINDINGS }]
      : []),
    ...(has(CONTRARY, frame.contrary ?? frame.hollow[CONTRARY])
      ? [{ id: ANCHOR.contrary, label: "Contrary evidence" }]
      : []),
    ...(limitations ? [{ id: ANCHOR.limitations, label: "Limitations" }] : []),
    ...frame.prose.map(({ section, title }) => ({
      id: ANCHOR.section(section.line),
      label: title,
    })),
    ...(hasRecords ? [{ id: ANCHOR.records, label: "Statements and records" }] : []),
  ];
}

function EmptyHandoff({ run, entry }: { run: PublishedRun; entry: OutputEntry }) {
  return (
    <Tile span={12} label="Module output">
      <p className="text-text-secondary">
        This module wrote no findings in this report format.{" "}
        <Button href={evidencePath(run.folder, entry)} color="link-gray" size="sm">
          Open Evidence
        </Button>
      </p>
    </Tile>
  );
}

function isEmpty({ frame }: Page) {
  return (
    !frame.parseError &&
    !Object.keys(frame.hollow).length &&
    !frame.bottomLine &&
    !frame.keyFindings &&
    !frame.contrary &&
    !frame.limitations &&
    !frame.prose.length &&
    !frame.missing.length
  );
}

function ModulePage({
  snapshot,
  run,
  view,
  current,
  entry,
  page,
  records,
  table,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReportView;
  current: ModuleItem;
  entry: OutputEntry;
  page: Page;
  records: boolean;
  table?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const { figures, Lead, kinds, frame, gaps } = page;
  const index = view.entries.indexOf(entry);
  const traces = pageTraces(snapshot, entry, index, run.pathway);
  const module = { ...current, state: moduleState(entry) };
  const next = nextModule(view, current.id);
  const active = open === null ? undefined : traces[open];
  return (
    <RunContext.Provider value={{ traces, open: setOpen }}>
      <Bento>
        <ModuleHeader
          module={module}
          entry={entry}
          bottomLine={frame.bottomLine}
          owed={frame.missing.includes("Bottom line")}
          hollow={frame.hollow["Bottom line"]}
          folder={run.folder}
          pathway={run.pathway}
          basis={frame.basis}
          about={
            current.id === "CP-1A" ? (
              <CompanyProfile entry={entry} folder={run.folder} pathway={run.pathway} />
            ) : undefined
          }
          confidence={
            // A module that is not assessable or unreadable made no assessment to be confident
            // in: its stored score stays in Evidence and is not drawn as a meter here.
            module.state === "Not assessable" ? undefined : (
              <ModuleConfidence
                confidence={entry.output.confidence}
                trace={traces[CONFIDENCE_TRACE] ? CONFIDENCE_TRACE : null}
              />
            )
          }
        />
        {isEmpty(page) && <EmptyHandoff run={run} entry={entry} />}
        <ModuleStats entry={entry} catalogue={view.catalogue} folder={run.folder} />
        {Lead && (
          // A lead that draws nothing (a blocked or unreadable module) leaves no empty row behind.
          <div className="min-w-0 empty:hidden lg:col-span-12">
            <LeadEvidence.Provider value={evidencePath(run.folder, entry)}>
              {/* leadFor returns a component defined once at module scope, never one made here. */}
              {createElement(Lead, { snapshot, run, view, entry, entryIndex: index })}
            </LeadEvidence.Provider>
          </div>
        )}
        {/* Screen map: the findings follow the lead (P2), the limitations follow the contrary evidence, then the module's
            own other sections;
            the module's other drawings (dates, maps, limits: P3) and its records come after. */}
        <ModuleFindings
          keyFindings={frame.keyFindings}
          contrary={frame.contrary}
          hollow={{ findings: frame.hollow["Key findings"], contrary: frame.hollow[CONTRARY] }}
          missing={frame.missing}
          entry={entry}
          folder={run.folder}
          pathway={run.pathway}
        />
        <ModuleLimitations
          section={frame.limitations}
          hollow={frame.hollow.Limitations}
          owed={frame.missing.includes("Limitations")}
          gaps={gaps}
          entry={entry}
          folder={run.folder}
          span={12}
          pathway={run.pathway}
          summaryLimitation={frame.summaryLimitation}
        />
        <ProseTiles prose={frame.prose} entry={entry} folder={run.folder} pathway={run.pathway} />
        <ModuleFigures
          entry={entry}
          run={run}
          view={view}
          figures={figures}
          kinds={kinds}
          gaps={frame.drawingGaps}
        />
        <ModuleRecords
          // A new address that names the records opens them on its table, as a first draw does.
          key={records ? `records:${table ?? ""}` : "page"}
          run={run}
          entry={entry}
          anchorId={ANCHOR.records}
          initiallyOpen={records}
          initialTable={table}
        />
        <NextModule next={next} href={moduleHref} wide />
      </Bento>
      {active && (
        <TraceDrawer
          trace={active}
          evidenceHref={evidenceHref(run.folder, active.evidenceItem)}
          isOpen
          onClose={() => {
            setOpen(null);
          }}
        />
      )}
    </RunContext.Provider>
  );
}

function SavedOutputs({ current, entry }: { current: ModuleItem; entry?: OutputEntry }) {
  return (
    current.outputs.length > 1 && (
      <nav aria-label="Saved outputs" className="flex flex-wrap gap-2">
        {current.outputs.map((item, at) => (
          <Button
            key={item.output.id}
            color="secondary"
            size="sm"
            href={`#modules/${encodeURIComponent(current.id)}/${String(at)}`}
            aria-current={item === entry ? "page" : undefined}
          >
            {item.selected ? "Output used in report" : `Saved output ${String(at + 1)}`}
          </Button>
        ))}
      </nav>
    )
  );
}

function UnavailableHandoff({ current, next }: { current: ModuleItem; next?: FrameModule }) {
  const count = current.outputs.length;
  return (
    <Bento>
      <ModuleHeader module={current} bottomLine={null} owed={false} folder="" />
      <Tile
        span={next ? 8 : 12}
        label="Module output unavailable"
        title="Module output unavailable"
      >
        <GapNote>
          {count > 1
            ? "Choose a saved output above."
            : count === 1
              ? "Choose this module again under Modules in this run."
              : "No output was saved for this module."}
        </GapNote>
      </Tile>
      <NextModule next={next} href={moduleHref} wide={false} />
    </Bento>
  );
}

export function Modules({
  snapshot,
  run,
  view,
  module,
  output,
  records = false,
  table,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReportView;
  module?: string;
  output?: string;
  /** The address asks for the module's records open (`#modules/<module>/records`). */
  records?: boolean;
  /** The records table the address names (`#modules/<module>/records/<table>`). */
  table?: string;
}) {
  const current =
    module === undefined
      ? (view.modules.find(({ id }) => id === "CP-1") ?? view.modules[0])
      : view.modules.find(({ id }) => id === module);
  if (!current)
    return (
      <Bento>
        <Tile span={12} label="Module unavailable">
          <GapNote>This module is unavailable in the published run.</GapNote>
        </Tile>
      </Bento>
    );
  const entry = moduleOutput(current, output);
  const page = entry && pageOf(run, entry);
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[232px_minmax(0,1fr)]">
      <StageNav
        key={current.id}
        modules={view.modules}
        current={current.id}
        hrefFor={moduleHref}
        sections={page ? pageSections(page) : []}
        className="self-start"
      />
      <div className="flex min-w-0 flex-col gap-4">
        <SavedOutputs current={current} entry={entry} />
        {entry && page ? (
          <ModulePage
            key={entry.output.id}
            snapshot={snapshot}
            run={run}
            view={view}
            current={current}
            entry={entry}
            page={page}
            records={records}
            table={table}
          />
        ) : (
          <UnavailableHandoff current={current} next={nextModule(view, current.id)} />
        )}
      </div>
    </div>
  );
}
