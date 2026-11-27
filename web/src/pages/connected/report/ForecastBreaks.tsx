import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BarCell } from "@/components/kit/BarCell";
import { cx } from "@/utils/cx";
import { moduleName } from "../api";
import { evidencePath, unitLabel, type OutputEntry } from "../publishedReport";
import type { ReportView } from "../reportView";
import {
  cellsOf,
  absentText,
  covenantTests,
  fundingGap,
  NOT_STATED_IN_ROW,
  type MeasureRead,
  type MeasureCell,
  type ScheduleYear,
} from "./forecastData";
import { gapLine } from "./gapLine";
import { GapChip, ModuleGap } from "./ForecastGaps";
import { moduleSource } from "./overview/figureData";
import { cellWord, gapReading, gapText } from "./overview/notes";
import { downsidePanels, stressLabel, type DownsidePanel } from "./overview/stressData";
import { Figure, Tile } from "./overview/Tile";
import { PublishedSource } from "./PublishedTrace";
import type { ForecastSource } from "./ForecastRecord";

/** The maturity schedule as the page reads it, with the reason when there is none. */
export type BreaksSchedule = {
  years: ScheduleYear[];
  offAxis: ScheduleYear[];
  unit?: string;
  reason: string | null;
  entry?: OutputEntry;
  trace?: ReactNode;
};

function Part({
  title,
  detail,
  trace,
  children,
}: {
  title: string;
  detail?: string;
  trace?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="grid min-w-0 gap-2 border-t border-border-hairline pt-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
          <h4 className="text-small font-medium text-text-primary">{title}</h4>
          {detail && <p className="text-caption text-text-secondary">{detail}</p>}
        </div>
        {trace}
      </div>
      {children}
    </section>
  );
}

function rowTrace(
  folder: string,
  entry: OutputEntry | undefined,
  line: number | undefined,
  name: string,
  linkLabel = `Source for ${name}`,
) {
  if (!entry) return undefined;
  return (
    <PublishedSource href={evidencePath(folder, entry, line)} name={name} linkLabel={linkLabel}>
      View source
    </PublishedSource>
  );
}

function FundingGapPart({ view, folder }: { view: ReportView; folder: string }) {
  const { gaps, looked } = fundingGap(view);
  if (!gaps.length)
    return (
      <Part title="Funding gap">
        <ModuleGap>{looked.join(" ")}</ModuleGap>
      </Part>
    );
  return (
    <Part title="Funding gap">
      <ul className="grid gap-3">
        {gaps.map((gap) => (
          <li key={gap.module} className="grid gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-caption text-text-secondary">{gapLine(gap)}</span>
              {rowTrace(folder, gap.entry, gap.line, `${gap.name}'s ${gap.label}`)}
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-1">
              {gap.figures.map((figure) => (
                <div key={figure.header || figure.text} className="grid gap-0.5">
                  {figure.header && (
                    <dt className="text-caption text-text-tertiary">{figure.header}</dt>
                  )}
                  <dd>
                    {/* A figure is drawn as written; only a row that states none is a gap. */}
                    {figure.text === NOT_STATED_IN_ROW ? (
                      <GapChip>{figure.text}</GapChip>
                    ) : (
                      <Figure className="text-h4">{figure.text}</Figure>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {gap.notes.map((note) => (
              <p key={note} className="text-caption text-text-secondary">
                {note}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </Part>
  );
}

type ListItem = {
  key: string;
  label: string;
  text: string;
  value: number | null;
  reason?: string;
  trace?: ReactNode;
};

/** A list of published figures, each on one scale from zero shared by the list only, each with
 * its own trace. A figure the module does not give keeps the module's words. */
function FigureList({ items, tone }: { items: ListItem[]; tone: "primary" | "secondary" }) {
  const most = Math.max(0, ...items.map((item) => item.value ?? 0));
  return (
    <ul className="grid gap-1.5">
      {items.map((item) => (
        <li
          key={item.key}
          className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_auto] items-center gap-2"
        >
          <span className="font-mono text-caption text-text-secondary">{item.label}</span>
          {item.value === null ? (
            <GapChip>{item.reason ? `${item.text}: ${item.reason}` : item.text}</GapChip>
          ) : item.value >= 0 && most > 0 ? (
            <BarCell text={item.text} share={item.value / most} tone={tone} />
          ) : (
            <Figure className="text-small">{item.text}</Figure>
          )}
          <span className="flex min-w-8 justify-end">{item.trace}</span>
        </li>
      ))}
    </ul>
  );
}

function LiquidityPart({
  liquidity,
  group,
  caseName,
  source,
}: {
  liquidity: MeasureRead;
  group: string | undefined;
  caseName: string;
  source?: ForecastSource;
}) {
  const { measure } = liquidity;
  const cells: MeasureCell[] = measure ? cellsOf(measure, group) : [];
  const title = `Accessible liquidity, ${caseName}`;
  if (!measure || !cells.length)
    return (
      <Part title={title}>
        <ModuleGap>{absentText(liquidity, caseName)}</ModuleGap>
      </Part>
    );
  return (
    <Part title={title} detail={`By forecast year, as the model publishes it · ${measure.label}`}>
      <FigureList
        tone="secondary"
        items={cells.map((cell) => ({
          key: cell.period,
          label: cell.period,
          text: cell.value === null ? cell.display || "n.a." : cell.display,
          value: cell.value,
          reason: cell.reason,
          trace: source?.(`${measure.label}, ${cell.period}`, {
            case: caseName,
            rawGroup: group,
            row: measure.label,
            period: cell.period,
          }),
        }))}
      />
    </Part>
  );
}

function SchedulePart({ schedule, folder }: { schedule: BreaksSchedule; folder: string }) {
  const items = [...schedule.years, ...schedule.offAxis];
  if (!items.length)
    return (
      <Part title="Debt maturing">
        <ModuleGap entry={schedule.entry}>
          {schedule.reason ?? "The maturity schedule states no amount."}
        </ModuleGap>
      </Part>
    );
  return (
    <Part
      title="Debt maturing"
      detail={`${moduleName("CP-1")}'s schedule, as written${schedule.unit ? ` · ${unitLabel(schedule.unit)}` : ""}`}
      trace={schedule.trace}
    >
      <FigureList
        tone="secondary"
        items={items.map((item) => ({
          key: item.key,
          label: item.label,
          text: item.cell?.text ?? "",
          value: item.cell?.value ?? null,
          trace: rowTrace(folder, schedule.entry, item.line, `debt maturing, ${item.label}`),
        }))}
      />
    </Part>
  );
}

/**
 * A covenant test drawn as value against limit: the current figure as a solid mark and the
 * level as a dashed mark (ruling R1: two marks on one scale, no fill from
 * zero), on the test's own scale. Position only: the figures are the words under it, as the module
 * writes them. A current figure the module does not give draws the level alone.
 */
function LimitBar({ current, level }: { current: number | null; level: number }) {
  // Room past the larger of the two, so the level's mark never sits on the track's end.
  const most = Math.max(level, current ?? 0) * 1.15;
  const at = (value: number) => `${String(Math.round((value / most) * 1000) / 10)}%`;
  return (
    <span
      aria-hidden="true"
      data-limit-bar=""
      className="relative my-1 block h-2 rounded-ds-full bg-surface-subtle"
    >
      {current !== null && (
        <span
          data-current={at(current)}
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-ds-full border-2 border-surface-card bg-text-primary"
          style={{ left: at(current) }}
        />
      )}
      <span
        data-level={at(level)}
        className="absolute -inset-y-1 border-l-2 border-dashed border-text-primary"
        style={{ left: at(level) }}
      />
    </span>
  );
}

function CovenantPart({ view, folder }: { view: ReportView; folder: string }) {
  const { tests, reason, source } = covenantTests(view);
  const name = moduleName("CP-4");
  if (!tests.length)
    return (
      <Part title="Covenant tests">
        <ModuleGap entry={source.entry}>{reason ?? `${name} states no covenant test.`}</ModuleGap>
      </Part>
    );
  const table = source.state === "ready" ? source.table : undefined;
  return (
    <Part title="Covenant tests" detail={`As ${name} writes them`}>
      <ul className="grid gap-3">
        {tests.map((test, at) => (
          <li key={`${test.label}-${String(at)}`} className="grid gap-0.5">
            <span className="flex items-start justify-between gap-2">
              <span className="text-small font-medium text-text-primary">{test.label}</span>
              {rowTrace(
                folder,
                source.entry,
                table?.rowLines?.[at] ?? (table ? table.line : undefined),
                `the ${test.label} test`,
              )}
            </span>
            {/* Drawn only where both sit on a scale from zero; else the words alone. */}
            {test.threshold.value !== null &&
              test.threshold.value > 0 &&
              (test.current.value === null || test.current.value >= 0) && (
                <LimitBar current={test.current.value} level={test.threshold.value} />
              )}
            {/* Each cell as the module writes it; its unit column once, joined to no figure. */}
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <span>
                Level{" "}
                {test.threshold.value === null ? (
                  <GapChip>{test.threshold.text}</GapChip>
                ) : (
                  <Figure className="text-mono">{test.threshold.text}</Figure>
                )}
              </span>
              <span>
                Current{" "}
                {test.current.value === null ? (
                  <GapChip>{test.current.text}</GapChip>
                ) : (
                  <Figure className="text-mono">{test.current.text}</Figure>
                )}
              </span>
              {test.headroom && (
                <span>
                  Headroom <Figure className="text-mono">{test.headroom}</Figure>
                </span>
              )}
              {test.unit && <span>{`Unit ${unitLabel(test.unit)}`}</span>}
              {test.direction && <span>{test.direction}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-caption text-text-secondary">
        Each scale has two marks: the solid dot is where the test stands now, the dashed line is its
        level; the words under it carry the figures and the module&apos;s headroom.
      </p>
      <p className="text-caption text-text-secondary">
        This forecast&apos;s figures are not set against the covenant tests above.
      </p>
    </Part>
  );
}

/** The drawing's width in CSS pixels. */
function useMeasuredWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry?.contentRect.width ?? 0);
      if (next > 0) setWidth(Math.max(260, next));
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, width };
}

const ROW = 27;
/** A panel's title row: tall enough for the measure's trace control at its right. */
const HEAD = 34;
const NAMES = 104;
const LABEL = 56;
const GUTTER = 12;
const LINE = 14;
const lead = (text: string) => stressLabel(text).split(" (")[0] ?? text;

/** A cell as the reading says it: its own words, a stated gap as its gap word. */
function cellReading(cell: DownsidePanel["cells"][number] | undefined) {
  if (!cell) return "";
  return cell.value === null && (cell.reason !== null || !cell.text.trim())
    ? gapReading(cell.text)
    : cell.text;
}

/** A name broken into lines of at most `chars` characters, at spaces; a longer word is broken. */
function wrapName(text: string, chars: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/u).filter(Boolean)) {
    const last = lines.at(-1);
    if (last !== undefined && last.length + 1 + word.length <= chars) {
      lines[lines.length - 1] = `${last} ${word}`;
      continue;
    }
    for (let at = 0; at < word.length; at += chars) lines.push(word.slice(at, at + chars));
  }
  return lines.length ? lines : [""];
}

/** The stress scenarios as one small multiple: a row per scenario, a panel per measure, each
 * panel one scale from zero shared by every scenario. Panels sit side by side where they fit and
 * stack where the tile is narrow. */
function StressMultiple({
  cases,
  panels,
  traces,
}: {
  cases: { id: string; name: string; control: boolean }[];
  panels: DownsidePanel[];
  /** Each panel's source control, in panel order. */
  traces: ReactNode[];
}) {
  const { ref, width } = useMeasuredWidth(400);
  const across = (width - NAMES) / panels.length >= 150 ? panels.length : 1;
  // Stacked panels leave room for whole scenario names.
  const names = across === 1 ? Math.min(168, Math.round(width * 0.4)) : NAMES;
  const room = (width - names - GUTTER * across) / across;
  // Whole names, wrapped: a row grows to hold its name's lines.
  const lines = cases.map((item) => wrapName(item.name, Math.max(4, Math.floor(names / 6.5))));
  const heights = lines.map((name) => Math.max(ROW, name.length * LINE + 14));
  const offsets = heights.map((_, row) => heights.slice(0, row).reduce((sum, h) => sum + h, 0));
  const block = HEAD + heights.reduce((sum, h) => sum + h, 0) + 8;
  const height = Math.ceil(panels.length / across) * block;
  const reading = cases
    .map(
      (item, at) =>
        `${item.name}: ${panels.map((panel) => `${panel.measure} ${cellReading(panel.cells[at])}`).join(", ")}`,
    )
    .join(". ");
  return (
    <div ref={ref} className="relative min-w-0">
      <svg
        role="img"
        aria-label={`Point-in-time stress. ${reading}.`}
        width={width}
        height={height}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="block max-w-full"
      >
        {panels.map((panel, index) => {
          const top = Math.floor(index / across) * block;
          const left = names + GUTTER + (index % across) * (room + GUTTER);
          // The bars leave room for their figures, so no figure runs past its panel.
          const bars = Math.max(40, room - LABEL);
          const span = panel.max - panel.min || 1;
          const at = (value: number) => left + ((value - panel.min) / span) * bars;
          return (
            <g key={panel.measure}>
              {/* Stacked panels have the full width for their title, above the names. */}
              <text
                x={across === 1 ? 0 : left}
                y={top + 21}
                className="fill-text-secondary text-caption"
              >
                {panel.measure}
              </text>
              {(across === 1 || index % across === 0) &&
                cases.map((item, row) => (
                  <text
                    key={item.id}
                    y={
                      top +
                      HEAD +
                      (offsets[row] ?? 0) +
                      ((heights[row] ?? ROW) - (lines[row]?.length ?? 1) * LINE) / 2 +
                      11
                    }
                    className={cx(
                      "text-caption",
                      item.control ? "fill-text-secondary" : "fill-text-primary",
                    )}
                  >
                    {(lines[row] ?? []).map((line, at) => (
                      <tspan key={at} x="0" dy={at ? LINE : 0}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                ))}
              <line
                x1={at(0)}
                x2={at(0)}
                y1={top + HEAD}
                y2={top + block - 6}
                className="stroke-border-container"
              />
              {panel.cells.map((cell, row) => {
                const y = top + HEAD + (offsets[row] ?? 0) + ((heights[row] ?? ROW) - 16) / 2;
                if (cell.value === null)
                  return (
                    <text key={row} x={left} y={y + 13} className="fill-gap-text text-caption">
                      {cellWord(cell)}
                    </text>
                  );
                // Zero is a tick on the zero line; any other figure is a bar of at least 3px on its
                // own side of the line, so a small figure never reads as zero.
                const zero = cell.value === 0;
                const size = zero ? 0 : Math.max(3, Math.abs(at(cell.value) - at(0)));
                const from = cell.value < 0 ? at(0) - size : at(0);
                const end = cell.value < 0 ? at(0) : at(0) + size;
                return (
                  <g key={row}>
                    {zero ? (
                      <rect
                        data-zero={`${panel.measure} ${cell.text}`}
                        x={at(0) - 1}
                        y={y - 2}
                        width="2"
                        height="20"
                        className="fill-text-secondary"
                      />
                    ) : (
                      <rect
                        data-bar={`${panel.measure} ${cell.text}`}
                        x={from}
                        y={y}
                        width={size}
                        height="16"
                        rx="2"
                        // No signal colour: the figure's sign and its side of zero say it.
                        className={cases[row]?.control ? "fill-chart-3" : "fill-chart-1"}
                      />
                    )}
                    <text
                      x={end + 4}
                      y={y + 12}
                      className="fill-text-primary font-mono text-caption"
                    >
                      {lead(cell.text)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      {/* Stacked panels: each measure's trace at the right of its own title. */}
      {across === 1 &&
        panels.map((panel, index) => (
          <span
            key={panel.measure}
            className="absolute right-0 flex"
            style={{ top: `${String(index * block + 1)}px` }}
          >
            {traces[index]}
          </span>
        ))}
      {/* Side by side, a title has no room beside it: the traces are listed under the drawing. */}
      {across > 1 && (
        <ul aria-label="Stressed measures" className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {panels.map((panel, index) => (
            <li
              key={panel.measure}
              className="flex items-center gap-1 text-caption text-text-secondary"
            >
              {panel.measure}
              {traces[index]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StressPart({ view, folder }: { view: ReportView; folder: string }) {
  const name = moduleName("CP-2A");
  const { entry, reason } = moduleSource(view, "CP-2A", name);
  if (!entry || reason)
    return (
      <Part title="Point-in-time stress">
        <ModuleGap entry={entry}>{reason ?? `${name} did not run in this run.`}</ModuleGap>
      </Part>
    );
  const data = downsidePanels(entry);
  if (!data)
    return (
      <Part title="Point-in-time stress">
        <ModuleGap
          entry={entry}
        >{`${name} states no stressed metric that can be drawn.`}</ModuleGap>
      </Part>
    );
  const notes = [
    ...data.assumptions,
    ...data.panels.flatMap((panel) =>
      panel.cells.flatMap((cell, at) => {
        const scenario = data.cases[at]?.name ?? "";
        if (cell.value === null) {
          // The cell's own words: the module's stated reason, or the text it wrote in full.
          const words = gapText(cell);
          return words === null ? [] : [`${scenario}, ${panel.measure}: ${words}.`];
        }
        return lead(cell.text) !== cell.text
          ? [`${scenario}, ${panel.measure}: ${cell.text}.`]
          : [];
      }),
    ),
  ];
  return (
    <Part
      title="Point-in-time stress"
      detail={`${name}: one-period stresses, not forecast years; each column one scale from zero`}
      trace={
        <PublishedSource
          href={evidencePath(folder, entry, data.line)}
          name="Point-in-time stress"
          linkLabel="Source for point-in-time stress"
        >
          View source
        </PublishedSource>
      }
    >
      <div role="group" aria-label="Point-in-time stress" className="grid gap-2">
        <StressMultiple
          cases={data.cases}
          panels={data.panels}
          traces={data.panels.map((panel) =>
            // The measure's own matrix row; where the table records none, the table, named so.
            panel.line === undefined
              ? rowTrace(
                  folder,
                  entry,
                  data.line,
                  `stress, ${panel.measure}`,
                  `Source table for stress, ${panel.measure}`,
                )
              : rowTrace(folder, entry, panel.line, `stress, ${panel.measure}`),
          )}
        />
        <ul className="grid gap-1 text-caption text-text-secondary">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </Part>
  );
}

/**
 * What breaks, and when: the funding gap as the liquidity and refinancing modules state it; the
 * model's liquidity path and the maturity schedule, each as its own figure and never set against
 * each other; the covenant tests as the legal module writes them; then the point-in-time stress.
 * No module sentence is picked out to stand between them: the page says what it does, and links to
 * the forward model's own limitations.
 */
export function WhatBreaks({
  view,
  folder,
  liquidity,
  group,
  caseName,
  schedule,
  source,
  trace,
}: {
  view: ReportView;
  folder: string;
  liquidity: MeasureRead;
  group: string | undefined;
  caseName: string;
  schedule: BreaksSchedule;
  source?: ForecastSource;
  trace?: ReactNode;
}) {
  return (
    <Tile span={4} label="What breaks, and when" title="What breaks, and when" trace={trace}>
      <FundingGapPart view={view} folder={folder} />
      <LiquidityPart liquidity={liquidity} group={group} caseName={caseName} source={source} />
      <p className="grid gap-1 rounded-ds-sm border border-info-edge bg-info-fill p-3 text-caption text-info-text">
        <span>
          This page shows the model&apos;s liquidity and the maturity schedule apart; it does not
          set one against the other.
        </span>
        <a
          href="#modules/CP-2G"
          className="inline-flex min-h-8 w-fit items-center rounded-ds-xs font-medium underline underline-offset-2 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11"
        >
          {`${moduleName("CP-2G")}'s limitations`}
        </a>
      </p>
      <SchedulePart schedule={schedule} folder={folder} />
      <CovenantPart view={view} folder={folder} />
      <StressPart view={view} folder={folder} />
    </Tile>
  );
}
