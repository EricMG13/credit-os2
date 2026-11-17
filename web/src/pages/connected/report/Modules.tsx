import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/status/StatusBadge";
import { ModuleNav, type NavSection } from "@/pages/library/parts/ModuleNav";
import { card, field, heading } from "../layout";
import {
  RECORDS_ID,
  ReportFindings,
  drawingTitle,
  findingBlocks,
  recordSections,
} from "../ReportContent";
import {
  evidencePath,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import {
  foundationMetrics,
  moduleState,
  runMoneyUnit,
  type MetricKey,
  type buildReportView,
} from "../reportView";

const TILE_KEYS: readonly MetricKey[] = ["netDebt", "principal", "interestCover"];
import { LegacyVisuals } from "../visuals";
import { ModuleConfidence } from "./Confidence";
import { MetricGrid } from "./MetricGrid";
import { monitoringLabel } from "./ModuleTable";
import { Downside, downsideView } from "./Downside";
import { BreakPoints, breakPointView } from "./BreakPoints";
import { MacroSensitivity, macroView } from "./MacroSensitivity";
import { Securities, securityView } from "./Securities";

function sectionIcon(heading: string): NavSection["icon"] {
  if (heading === "Bottom line") return "bottom-line";
  if (heading === "Key findings") return "findings";
  if (heading.startsWith("Contrary evidence")) return "contrary";
  return heading === "Limitations" ? "limitations" : "records";
}

function Navigator({
  view,
  run,
  current,
  entry,
  hasLocalFigures,
  figureTableLines,
}: {
  view: ReturnType<typeof buildReportView>;
  run: PublishedRun;
  current: string;
  entry?: OutputEntry;
  hasLocalFigures: boolean;
  figureTableLines: readonly number[];
}) {
  const allSections = entry ? findingBlocks(entry.sections, entry, figureTableLines, true) : [];
  const firstFinding =
    allSections.find(({ heading }) => heading === "Key findings") ??
    allSections.find(({ heading }) => sectionIcon(heading) === "records");
  const sections = allSections.flatMap((item) => {
    const { heading, line } = item;
    const icon = sectionIcon(heading);
    const watch = item.blocks.flatMap((block) =>
      block.type === "table" ? (monitoringLabel(current, heading, block) ?? []) : [],
    )[0];
    const extra =
      watch ??
      (current === "CP-0" && heading === "Source-readiness summary" ? "Readiness by area" : null);
    if (icon === "records" && item !== firstFinding && !extra) return [];
    return [
      {
        label: extra ?? (item === firstFinding ? "Key findings" : drawingTitle(heading)),
        key: `finding-${String(line)}`,
        icon: item === firstFinding && !extra ? ("findings" as const) : icon,
      },
    ];
  });
  if (
    entry &&
    (hasLocalFigures ||
      entry.output.charts?.length ||
      entry.output.chartGaps?.length ||
      entry.output.events?.length ||
      entry.output.maps?.length)
  ) {
    const at = sections[0]?.icon === "bottom-line" ? 1 : 0;
    sections.splice(at, 0, {
      label: "Figures and records",
      key: "module-figures",
      icon: "records",
    });
  }
  if (entry && recordSections(entry.sections, entry).length)
    sections.push({ label: "Statements and records", key: RECORDS_ID, icon: "records" });
  const [active, setActive] = useState(sections[0]?.key ?? null);
  const aside = useRef<HTMLElement>(null);
  // A clicked entry stays until the reader's own scroll input, so the scroll it causes cannot undo it.
  const pinned = useRef(false);
  const sectionKeys = sections.map(({ key }) => key).join("\n");
  useEffect(() => {
    // Without IntersectionObserver the entry follows clicks only.
    if (typeof IntersectionObserver === "undefined") return;
    const keys = sectionKeys.split("\n");
    const targets = keys.flatMap((key) => document.getElementById(key) ?? []);
    if (!targets.length) return;
    const inView = new Set<string>();
    const root = aside.current?.closest("main") ?? null;
    // One decision for the scroll listener and the observer, so they cannot disagree. A short last
    // section never reaches the top band, so the bottom of a scrolling page selects it.
    const choose = () => {
      if (pinned.current) return;
      const scrolls = root !== null && root.scrollHeight > root.clientHeight;
      const atBottom = scrolls && root.scrollTop + root.clientHeight >= root.scrollHeight - 2;
      // An entry that holds another entry in view is not the one being read: the deepest wins.
      const live = targets.filter((target) => inView.has(target.id));
      const deepest = live.find((a) => !live.some((b) => b !== a && a.contains(b)));
      const next = atBottom ? keys.at(-1) : deepest?.id;
      if (next) setActive(next);
    };
    // The scrolling region is the shell's `main`, so the top third is measured against it.
    const spy = new IntersectionObserver(
      (changes) => {
        for (const { target, isIntersecting } of changes) {
          if (isIntersecting) inView.add(target.id);
          else inView.delete(target.id);
        }
        choose();
      },
      { root, rootMargin: "0px 0px -66% 0px" },
    );
    for (const target of targets) spy.observe(target);
    const release = (event: Event) => {
      const from = event.target as Node;
      // Enter and Space on the navigator's own buttons press them; every other key may scroll.
      if (event instanceof KeyboardEvent && (event.key === "Enter" || event.key === " ")) {
        if (aside.current?.contains(from)) return;
      }
      // A press on the container itself is its scrollbar; one on a descendant is not.
      if (event.type === "pointerdown" && from !== root) return;
      pinned.current = false;
    };
    const inputs = ["wheel", "touchmove", "keydown", "pointerdown"];
    for (const name of inputs) root?.addEventListener(name, release);
    root?.addEventListener("scroll", choose);
    return () => {
      spy.disconnect();
      for (const name of inputs) root?.removeEventListener(name, release);
      root?.removeEventListener("scroll", choose);
    };
  }, [sectionKeys]);
  const [mobileSection, setMobileSection] = useState("");
  const moduleHref = (id: string) => `#modules/${encodeURIComponent(id)}`;
  const sectionNavigate = (id: string) => {
    const target = document.getElementById(id);
    target?.focus();
    target?.scrollIntoView({ block: "start" });
    pinned.current = true;
    setActive(id);
  };
  return (
    <aside
      ref={aside}
      className="self-start rounded-xl border border-border-hairline bg-surface-card py-2 min-[1001px]:sticky min-[1001px]:top-4"
    >
      <div className="grid gap-2 px-3 pb-2 min-[1001px]:hidden">
        <label className="grid gap-1 text-sm text-text-secondary">
          Module
          <select
            aria-label="Module"
            className={field}
            value={current}
            onChange={(event) => {
              const href = moduleHref(event.currentTarget.value);
              window.location.href = href;
            }}
          >
            {view.modules.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.state}
              </option>
            ))}
          </select>
        </label>
        {sections.length > 0 && (
          <details>
            <summary className="cursor-pointer py-2 text-sm font-medium text-action">
              On this page
            </summary>
            <label className="grid gap-1 pt-1 text-sm text-text-secondary">
              Jump to section
              <select
                aria-label="Jump to section"
                className={field}
                value={mobileSection}
                onChange={(event) => {
                  const id = event.currentTarget.value;
                  setMobileSection("");
                  if (id) sectionNavigate(id);
                }}
              >
                <option value="">Choose a section</option>
                {sections.map((section) => (
                  <option key={section.key} value={section.key}>
                    {section.label}
                  </option>
                ))}
              </select>
            </label>
          </details>
        )}
      </div>
      <ModuleNav
        issuer={run.issuer}
        run={run.folder}
        current={current}
        modules={view.modules}
        sections={sections}
        active={active}
        hrefFor={moduleHref}
        className="max-[1001px]:hidden"
        onSection={sectionNavigate}
      />
    </aside>
  );
}

type ReportView = ReturnType<typeof buildReportView>;
type ModuleItem = ReportView["modules"][number];

function defaultOutput(outputs: OutputEntry[]) {
  return (
    outputs.find(({ selected }) => selected) ?? (outputs.length === 1 ? outputs[0] : undefined)
  );
}

function moduleOutput(current: ModuleItem, output: string | undefined) {
  if (output === undefined) return defaultOutput(current.outputs);
  return /^(?:0|[1-9]\d*)$/.test(output) ? current.outputs[Number(output)] : undefined;
}

function moduleFigures(entry: OutputEntry, run: PublishedRun) {
  const downside = downsideView(entry);
  const breaks = breakPointView(entry);
  const macro = macroView(entry);
  const securities = securityView(entry, run.asOf);
  const figureTableLines = [securities?.summaryLine, securities?.outcomes?.line].filter(
    (line) => line !== undefined,
  );
  return {
    downside,
    breaks,
    macro,
    securities,
    tableLines: figureTableLines,
    hasLocalFigures: Boolean(downside || breaks || macro || securities),
  };
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
            {item.selected ? "Designated handoff" : `Retained output ${String(at + 1)}`}
          </Button>
        ))}
      </nav>
    )
  );
}

function ModuleFindings({
  snapshot,
  run,
  view,
  entry,
  figures,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReportView;
  entry: OutputEntry;
  figures: ReturnType<typeof moduleFigures>;
}) {
  const index = view.entries.indexOf(entry);
  const { downside, breaks, macro, securities, tableLines: figureTableLines } = figures;
  const evidenceHref = (line: number) => evidencePath(run.folder, entry, line);
  const allMetrics = foundationMetrics(entry, view.catalogue);
  const metrics = allMetrics.filter(({ key }) => TILE_KEYS.includes(key));
  return (
    <ReportFindings
      key={entry.output.id}
      snapshot={snapshot}
      run={run}
      entry={entry}
      entryIndex={index}
      figureTableLines={figureTableLines}
      chartsDrawn
      afterBottomLine={
        <>
          <ModuleConfidence snapshot={snapshot} run={run} entry={entry} entryIndex={index} />
          <MetricGrid
            records={metrics}
            entry={entry}
            entryIndex={index}
            snapshot={snapshot}
            folder={run.folder}
          />
          <div id="module-figures" tabIndex={-1} className="grid min-w-0 gap-4">
            {downside && <Downside data={downside} href={evidenceHref} />}
            {breaks && <BreakPoints data={breaks} href={evidenceHref} />}
            {macro && <MacroSensitivity data={macro} href={evidenceHref} />}
            {securities && (
              <Securities
                data={securities}
                href={evidenceHref}
                runUnit={runMoneyUnit(view.catalogue)}
              />
            )}
            <LegacyVisuals
              output={entry.output}
              sections={entry.sections}
              primary={entry.output.module === "CP-1" ? "Debt maturities" : undefined}
              cards
              headingLevel="h3"
              evidenceHref={evidenceHref}
            />
          </div>
        </>
      }
    />
  );
}

function SelectedModule({
  snapshot,
  run,
  view,
  current,
  entry,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReturnType<typeof buildReportView>;
  current: ReportView["modules"][number];
  entry?: OutputEntry;
}) {
  const figures = entry ? moduleFigures(entry, run) : null;
  const figureTableLines = figures?.tableLines ?? [];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-h2">{current.name}</h2>
        <StatusBadge set="Module state" state={entry ? moduleState(entry) : current.state} />
      </div>
      <div className="grid min-w-0 gap-5 min-[1001px]:grid-cols-[16rem_minmax(0,1fr)]">
        <Navigator
          key={entry?.output.id ?? current.id}
          view={view}
          run={run}
          current={current.id}
          entry={entry}
          hasLocalFigures={Boolean(figures?.hasLocalFigures)}
          figureTableLines={figureTableLines}
        />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <SavedOutputs current={current} entry={entry} />
          {entry && figures ? (
            <ModuleFindings
              key={entry.output.id}
              snapshot={snapshot}
              run={run}
              view={view}
              entry={entry}
              figures={figures}
            />
          ) : (
            <section className={card}>
              <h3 className={heading}>Handoff unavailable</h3>
              <p>Choose a retained output where available.</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

export function Modules({
  snapshot,
  run,
  view,
  module,
  output,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  view: ReportView;
  module?: string;
  output?: string;
}) {
  const current =
    module === undefined
      ? (view.modules.find(({ id }) => id === "CP-1") ?? view.modules[0])
      : view.modules.find(({ id }) => id === module);
  if (!current) return <p className={card}>This module is unavailable in the published run.</p>;
  return (
    <SelectedModule
      snapshot={snapshot}
      run={run}
      view={view}
      current={current}
      entry={moduleOutput(current, output)}
    />
  );
}
