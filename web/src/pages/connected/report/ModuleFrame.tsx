import { ArrowRight } from "@untitledui/icons";
import { Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/status/StatusBadge";
import { STATUS_SETS } from "@/components/status/sets";
import { StatusShape } from "@/components/status/shapes";
import type { ModuleState } from "@/pages/library/slice";
import { RunContext } from "@/pages/library/parts/RunContext";
import { TRACE_HOST, TraceControl } from "@/pages/library/parts/TraceControl";
import { cx } from "@/utils/cx";
import { FindingParagraph, PublishedTable } from "../ReportContent";
import {
  containsReference,
  evidencePath,
  readParagraph,
  readerText,
  type OutputEntry,
  type Section,
  type Table,
} from "../publishedReport";
import { traceKey } from "../reportView";
import { richParts } from "../richText";
import { GapNote, Tile } from "./overview/Tile";
import { stageOf } from "./stageNumber";
import {
  CONTRARY,
  KEY_FINDINGS,
  readable,
  type Basis,
  type BottomLineSource,
  type TextBlock,
} from "./moduleFrame";
import { holdsCode, proseWithoutMachinery, readableTitle } from "./moduleRecords";

const MISSING_PASSAGE = "Not established for this run. The module wrote no such passage.";

const NO_TEXT = "This passage holds no text.";
const NO_ROWS = "This table has no rows.";

export type FrameModule = { id: string; name: string; state: ModuleState };

/** The page's section anchors, for the navigator's "On this page" entries. */
export const ANCHOR = {
  bottomLine: "module-bottom-line",
  figures: "module-figures",
  findings: "module-key-findings",
  contrary: "module-contrary",
  limitations: "module-limitations",
  records: "module-records",
  section: (line: number) => `module-section-${String(line)}`,
} as const;

/** A heading's text that the navigator can move focus to. */
export function Anchor({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span
      id={id}
      tabIndex={-1}
      className="scroll-mt-4 rounded-ds-xs outline-focus-ring focus-visible:outline-2"
    >
      {children}
    </span>
  );
}

/**
 * The trace control for a key the page may not hold: a line the handoff does not contain has no
 * trace, and draws the missing-trace marker instead of failing the page.
 */
export function HeldTrace({ trace, label }: { trace: string; label: string }) {
  const run = useContext(RunContext);
  const held = run !== null && Object.hasOwn(run.traces, trace);
  return <TraceControl trace={held ? trace : null} label={label} />;
}

function SlashCircle() {
  return (
    <span className="flex flex-none text-warning-mark">
      <StatusShape shape={STATUS_SETS["Module state"]["Not assessable"].shape} />
    </span>
  );
}

/** One paragraph exactly as written, or the way to read it in Evidence when it cites a source. */
function Prose({ text, href, className }: { text: string; href: string; className: string }) {
  const body = readParagraph(text).body;
  if (containsReference(body))
    return (
      <Button href={href} color="link-gray" size="sm" iconTrailing={ArrowRight}>
        Read this passage in Evidence
      </Button>
    );
  return <p className={className}>{richParts(body, readerText)}</p>;
}

function BottomLineText({
  source,
  entry,
  folder,
}: {
  source: NonNullable<BottomLineSource>;
  entry: OutputEntry;
  folder: string;
}) {
  const line = source.kind === "passage" ? source.block.line : source.line;
  const text = source.kind === "passage" ? source.block.text : source.text;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className={cx(TRACE_HOST, "flex items-start gap-3")}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-caption text-text-tertiary">
            <Anchor id={ANCHOR.bottomLine}>Bottom line</Anchor>
          </span>
          <Prose
            text={text.replaceAll("**", "").replaceAll("`", "")}
            href={evidencePath(folder, entry, line)}
            className="max-w-bottom-line text-h3 font-medium text-balance wrap-anywhere text-text-primary lg:text-h2"
          />
        </div>
        <HeldTrace trace={traceKey(entry, line)} label="Show sources for the bottom line" />
      </div>
    </div>
  );
}

/** Whether the viewport is at least `width` wide; wide where the browser cannot say (tests). */
function useWideScreen(width: number) {
  const query = `(min-width: ${String(width)}px)`;
  const read = () =>
    typeof window.matchMedia === "function" ? window.matchMedia(query).matches : true;
  const [wide, setWide] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const sync = () => {
      setWide(list.matches);
    };
    list.addEventListener("change", sync);
    return () => {
      list.removeEventListener("change", sync);
    };
  }, [query]);
  return wide;
}

/**
 * The bottom line's further paragraphs: in full from md; on a phone behind "Read on", so the
 * meter follows the bottom line's first paragraph directly.
 */
function Continuation({
  source,
  entry,
  folder,
}: {
  source: NonNullable<BottomLineSource>;
  entry: OutputEntry;
  folder: string;
}) {
  const wide = useWideScreen(768);
  const paragraphs =
    source.kind === "passage" ? (
      source.rest.map((block) => (
        <FindingParagraph
          key={block.line}
          block={block}
          trace={traceKey(entry, block.line)}
          href={evidencePath(folder, entry, block.line)}
        />
      ))
    ) : source.rest ? (
      <p className="reading-copy text-body text-text-secondary">{readerText(source.rest)}</p>
    ) : null;
  const some = source.kind === "passage" ? source.rest.length > 0 : Boolean(source.rest);
  if (!some) return null;
  const place = "order-4 flex min-w-0 flex-col gap-3 lg:col-span-2 lg:row-start-3";
  if (wide) return <div className={place}>{paragraphs}</div>;
  return (
    <details className={cx(place, "group/readon")}>
      <summary className="flex min-h-11 cursor-pointer items-center gap-1 text-small font-medium text-text-link">
        Read on
      </summary>
      <div className="flex flex-col gap-3 pt-2">{paragraphs}</div>
    </details>
  );
}

function stageLine(module: FrameModule) {
  const stage = stageOf(module.id);
  return stage.number ? `${stage.name} · stage ${String(stage.number)} of ${String(stage.of)}` : "";
}

/** The basis of the figures, as the handoff states it: the entity named, a gap cell drawn as one. */
function BasisLine({
  basis,
  entry,
  folder,
}: {
  basis: NonNullable<Basis>;
  entry: OutputEntry;
  folder: string;
}) {
  if (basis.kind === "periods")
    return <p className="text-small text-text-secondary">Periods {basis.periods.join(", ")}</p>;
  return (
    <p className="text-small text-text-secondary">
      {basis.entity && <span className="font-medium text-text-primary">{basis.entity}: </span>}
      {basis.parts.map((part, at) => (
        <Fragment key={part.name}>
          {at > 0 && " · "}
          {part.gap ? (
            <span className="rounded-ds-xs border border-dashed border-border-gap px-1 text-gap-text">
              {part.name}: {part.text}
            </span>
          ) : part.name === "Fiscal year end" ? (
            `Fiscal year end ${part.text}`
          ) : (
            part.text
          )}
        </Fragment>
      ))}
      {basis.entities > 1 && (
        <span className="text-text-tertiary">
          {` · ${String(basis.entities)} reporting entities; first shown. `}
          <Button href={evidencePath(folder, entry, basis.line)} color="link-gray" size="sm">
            Entity period key in Evidence
          </Button>
        </span>
      )}
    </p>
  );
}

/** Below the title, across the tile, under a hairline. */
function Bottom({ children }: { children: ReactNode }) {
  return (
    <div className="order-2 min-w-0 border-t border-border-hairline pt-5 lg:col-span-2 lg:row-start-2">
      {children}
    </div>
  );
}

/** What the header draws under its hairline: the bottom line, else what is true of it. */
function HeaderBottom({
  entry,
  bottomLine,
  hollow,
  owed,
  folder,
}: {
  entry?: OutputEntry;
  bottomLine: BottomLineSource;
  hollow?: Section;
  owed: boolean;
  folder: string;
}) {
  if (entry?.output.parseError) {
    const reason = entry.output.parseError;
    return (
      <Bottom>
        <GapNote>
          This module's output could not be read into sections
          {containsReference(reason) ? "." : `: ${readerText(reason)}`}{" "}
          <Button href={evidencePath(folder, entry)} color="link-gray" size="sm">
            Open Evidence
          </Button>
        </GapNote>
      </Bottom>
    );
  }
  if (entry && bottomLine)
    return (
      <Bottom>
        <BottomLineText source={bottomLine} entry={entry} folder={folder} />
      </Bottom>
    );
  if (entry && hollow)
    return (
      <Bottom>
        <span className="text-caption text-text-tertiary">
          <Anchor id={ANCHOR.bottomLine}>Bottom line</Anchor>
        </span>
        <HollowPassage section={hollow} title="Bottom line" entry={entry} folder={folder} />
      </Bottom>
    );
  return owed ? (
    <Bottom>
      <GapNote>{MISSING_PASSAGE}</GapNote>
    </Bottom>
  ) : null;
}

function TitleRow({ module }: { module: FrameModule }) {
  const blocked = module.state === "Not assessable";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <h2 className="min-w-0 font-display text-h4 text-balance wrap-anywhere sm:text-h3">
        {module.name}
      </h2>
      <span className="rounded-ds-xs bg-surface-subtle px-1.5 py-0.5 font-mono text-caption text-text-tertiary">
        {module.id}
      </span>
      {blocked ? (
        <span className="flex items-center gap-1.5 text-small font-medium text-warning-text">
          <SlashCircle />
          Not assessable
        </span>
      ) : (
        <StatusBadge set="Module state" state={module.state} />
      )}
    </div>
  );
}

/**
 * The module's header tile (P1): name, state and basis, then, under a hairline, the bottom line
 * in the largest type on the tile with its one trace control. The confidence meter sits at the
 * right of the title on a wide screen and under the bottom line on a phone. A module that could
 * not run is drawn blocked.
 */
export function ModuleHeader({
  module,
  entry,
  bottomLine,
  owed,
  folder,
  basis,
  about,
  confidence,
  hollow,
}: {
  module: FrameModule;
  entry?: OutputEntry;
  bottomLine: BottomLineSource;
  /** The module owes a bottom line its handoff does not hold. */
  owed: boolean;
  folder: string;
  /** The basis of the module's figures as its handoff states it. */
  basis?: Basis;
  /** The Bottom line passage when it holds no paragraph to read. */
  hollow?: Section;
  /** What the module says the issuer is (Business & governance only). */
  about?: ReactNode;
  confidence?: ReactNode;
}) {
  const blocked = module.state === "Not assessable";
  const stage = stageLine(module);
  return (
    <Tile
      span={12}
      label={module.name}
      className={cx("gap-0 sm:p-7", blocked && "border-dashed border-warning-mark")}
    >
      <div className="grid min-w-0 gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="order-1 flex min-w-0 flex-col gap-1.5 lg:col-start-1 lg:row-start-1">
          <TitleRow module={module} />
          {stage && <p className="text-small text-text-tertiary">{stage}</p>}
          {entry && basis && <BasisLine basis={basis} entry={entry} folder={folder} />}
          {about}
        </div>
        {confidence && (
          <div className="order-3 min-w-0 lg:col-start-2 lg:row-start-1">{confidence}</div>
        )}
        <HeaderBottom
          entry={entry}
          bottomLine={bottomLine}
          hollow={hollow}
          owed={owed || blocked}
          folder={folder}
        />
        {entry && bottomLine && !entry.output.parseError && (
          <Continuation source={bottomLine} entry={entry} folder={folder} />
        )}
      </div>
    </Tile>
  );
}

function Paragraph({
  block,
  entry,
  folder,
}: {
  block: TextBlock;
  entry: OutputEntry;
  folder: string;
}) {
  return (
    <FindingParagraph
      block={block}
      trace={traceKey(entry, block.line)}
      href={evidencePath(folder, entry, block.line)}
    />
  );
}

/** A table written inside a passage, drawn where the passage draws it. */
function PassageTable({
  table,
  title,
  entry,
  folder,
}: {
  table: Table;
  title: string;
  entry: OutputEntry;
  folder: string;
}) {
  if (!table.rows.length) return <GapNote>{NO_ROWS}</GapNote>;
  return (
    <PublishedTable
      table={table}
      heading={title}
      traceAt={(line) => traceKey(entry, line)}
      rowHref={(line) => evidencePath(folder, entry, line)}
    />
  );
}

/**
 * A passage the module wrote with no paragraph to read: it says so, keeps the trace of the Basis
 * it holds, and draws the tables it holds.
 */
function HollowPassage({
  section,
  title,
  entry,
  folder,
}: {
  section: Section;
  title: string;
  entry: OutputEntry;
  folder: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <GapNote>{NO_TEXT}</GapNote>
      {section.blocks.map((block) =>
        block.type === "text" ? (
          <p
            key={block.line}
            className={cx(TRACE_HOST, "flex items-center gap-2 text-small text-text-secondary")}
          >
            Its basis is with the sources.
            <HeldTrace trace={traceKey(entry, block.line)} label={`Show sources for ${title}`} />
          </p>
        ) : block.type === "table" ? (
          <PassageTable
            key={block.line}
            table={block}
            title={title}
            entry={entry}
            folder={folder}
          />
        ) : null,
      )}
    </div>
  );
}

/** The passage's blocks: readable paragraphs with their traces, and its tables inline. */
function PassageBlocks({
  section,
  entry,
  folder,
}: {
  section: Section;
  entry: OutputEntry;
  folder: string;
}) {
  return section.blocks.map((block) =>
    block.type === "text" ? (
      readable(block) && <Paragraph key={block.line} block={block} entry={entry} folder={folder} />
    ) : block.type === "table" ? (
      <PassageTable
        key={block.line}
        table={block}
        title={readableTitle(section.heading)}
        entry={entry}
        folder={folder}
      />
    ) : null,
  );
}

function KeyFindings({
  section,
  entry,
  folder,
}: {
  section: Section;
  entry: OutputEntry;
  folder: string;
}) {
  const paragraphs = section.blocks.filter(
    (block): block is TextBlock => block.type === "text" && readable(block),
  );
  const tables = section.blocks.filter((block): block is Table => block.type === "table");
  return (
    <>
      <ol className="flex flex-col">
        {paragraphs.map((block, at) => (
          <li
            key={block.line}
            className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-border-hairline py-3 first:border-t-0 first:pt-0"
          >
            <span
              aria-hidden="true"
              className="pt-0.5 font-mono text-small font-medium text-text-link tabular-nums"
            >
              {String(at + 1).padStart(2, "0")}
            </span>
            <Paragraph block={block} entry={entry} folder={folder} />
          </li>
        ))}
      </ol>
      {tables.map((block) => (
        <PassageTable
          key={block.line}
          table={block}
          title={KEY_FINDINGS}
          entry={entry}
          folder={folder}
        />
      ))}
    </>
  );
}

/**
 * Key findings as numbered claims beside contrary evidence on the counter surface; an owed passage
 * the handoff lacks is drawn as its gap in place.
 */
export function ModuleFindings({
  keyFindings,
  contrary,
  hollow,
  missing,
  entry,
  folder,
}: {
  keyFindings?: Section;
  contrary?: Section;
  hollow: { findings?: Section; contrary?: Section };
  missing: readonly string[];
  entry: OutputEntry;
  folder: string;
}) {
  const left = keyFindings ?? hollow.findings ?? missing.includes(KEY_FINDINGS);
  const right = contrary ?? hollow.contrary ?? missing.includes(CONTRARY);
  if (!left && !right) return null;
  const [leftSpan, rightSpan] = left && right ? ([7, 5] as const) : ([12, 12] as const);
  const hollowOf = (section: Section | undefined, name: string) =>
    section && <HollowPassage section={section} title={name} entry={entry} folder={folder} />;
  return (
    <>
      {left && (
        <Tile
          span={leftSpan}
          className="self-start"
          label={KEY_FINDINGS}
          title={<Anchor id={ANCHOR.findings}>{KEY_FINDINGS}</Anchor>}
        >
          {keyFindings ? (
            <KeyFindings section={keyFindings} entry={entry} folder={folder} />
          ) : (
            (hollowOf(hollow.findings, KEY_FINDINGS) ?? <GapNote>{MISSING_PASSAGE}</GapNote>)
          )}
        </Tile>
      )}
      {right && (
        <Tile
          span={rightSpan}
          className="self-start"
          label={CONTRARY}
          title={<Anchor id={ANCHOR.contrary}>{CONTRARY}</Anchor>}
          tone={contrary ? "counter" : "plain"}
        >
          {contrary ? (
            <PassageBlocks section={contrary} entry={entry} folder={folder} />
          ) : (
            (hollowOf(hollow.contrary, CONTRARY) ?? <GapNote>{MISSING_PASSAGE}</GapNote>)
          )}
        </Tile>
      )}
    </>
  );
}

/** A figure the module declared it could not draw: its title, its reason and its source table. */
export type ChartGap = { title: string; reason: string; line: number };

/** The charts, event lanes and maps the module declared it could not draw, with its reason. */
export function chartGaps(entry: OutputEntry): ChartGap[] {
  const { chartGaps: charts = [], events = [], maps = [] } = entry.output;
  return [...charts, ...events, ...maps].flatMap((item) => {
    const named = [item.title, item.lane, item.name].find((value) => typeof value === "string");
    const title = typeof named === "string" ? named.trim() : "";
    const reason = typeof item.gap === "string" ? item.gap.trim() : "";
    return title && reason ? [{ title, reason, line: item.table }] : [];
  });
}

const GAP_WORD = /^(Not supplied|Not calculated|Not assessable|Not established|Withheld)\b/i;

/** The module's reason as written; one that cites a source or a register code keeps its word and
 * leaves the rest to Evidence. */
function gapReason(reason: string) {
  if (!containsReference(reason) && !holdsCode(reason)) return readerText(reason);
  // The module's own words without the clause that cites the source; the source is in Evidence.
  const kept = proseWithoutMachinery(reason).replace(/[\s,;:\u2013\u2014-]+$/, "");
  if (kept) return `${kept}.`.replace(/\.\.$/, ".");
  return `${GAP_WORD.exec(reason)?.[1] ?? "Not established"}. The reason cites a source, shown in Evidence.`;
}

function GapWell({
  trace,
  label,
  children,
}: {
  trace: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <li
      className={cx(
        TRACE_HOST,
        "grid grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-start gap-3 border-t border-border-hairline py-3.5",
      )}
    >
      <span
        aria-hidden="true"
        className="gap-hatch size-7 rounded-ds-sm border border-dashed border-border-gap"
      />
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
      <HeldTrace trace={trace} label={label} />
    </li>
  );
}

function ChartGapWell({
  gap,
  entry,
  folder,
}: {
  gap: ChartGap;
  entry: OutputEntry;
  folder: string;
}) {
  const title = readerText(gap.title);
  return (
    <GapWell trace={traceKey(entry, gap.line)} label={`Show sources for ${title}`}>
      <p className="text-small font-medium text-text-primary first-letter:uppercase">
        {title}: not drawn
      </p>
      <p className="text-caption text-text-secondary">{gapReason(gap.reason)}</p>
      <span className="flex min-h-8 items-center max-[480px]:min-h-11">
        <Button href={evidencePath(folder, entry, gap.line)} color="link-gray" size="sm">
          Source table in Evidence
        </Button>
      </span>
    </GapWell>
  );
}

/**
 * The module's limitations as gap wells, as the module reports them, with any table the passage
 * holds drawn in place; then the figures it declared it could not draw.
 */
export function ModuleLimitations({
  section,
  owed,
  gaps,
  entry,
  folder,
  span,
  hollow,
}: {
  section?: Section;
  /** The Limitations passage when it holds no paragraph to read. */
  hollow?: Section;
  owed: boolean;
  gaps: readonly ChartGap[];
  entry: OutputEntry;
  folder: string;
  span: 8 | 12;
}) {
  const paragraphs = (section?.blocks ?? []).filter(
    (block): block is TextBlock => block.type === "text" && readable(block),
  );
  const tables = (section?.blocks ?? []).filter((block): block is Table => block.type === "table");
  if (!paragraphs.length && !tables.length && !owed && !gaps.length && !hollow) return null;
  const title = "Limitations of this module";
  return (
    <Tile
      span={span}
      className="self-start"
      label={title}
      title={<Anchor id={ANCHOR.limitations}>{title}</Anchor>}
    >
      <p className="-mt-2 text-caption text-text-tertiary">As the module reports them</p>
      {hollow ? (
        <HollowPassage section={hollow} title={title} entry={entry} folder={folder} />
      ) : (
        owed && !paragraphs.length && !tables.length && <GapNote>{MISSING_PASSAGE}</GapNote>
      )}
      <ul className="flex flex-col">
        {paragraphs.map((block) => (
          <GapWell
            key={block.line}
            trace={traceKey(entry, block.line)}
            label="Show sources for this limitation"
          >
            <Prose
              text={block.text}
              href={evidencePath(folder, entry, block.line)}
              className="text-small text-text-primary"
            />
          </GapWell>
        ))}
        {gaps.map((gap, at) => (
          <ChartGapWell
            key={`gap-${String(at)}-${String(gap.line)}`}
            gap={gap}
            entry={entry}
            folder={folder}
          />
        ))}
      </ul>
      {tables.map((table) => (
        <PassageTable key={table.line} table={table} title={title} entry={entry} folder={folder} />
      ))}
    </Tile>
  );
}

/**
 * One forward link to the module after this one in stage order; nothing after the last. Beside
 * the limitations it is the last row's right third; without them it closes the page full width.
 */
export function NextModule({
  next,
  href,
  wide,
}: {
  next?: FrameModule;
  href: (id: string) => string;
  wide: boolean;
}) {
  if (!next) return null;
  const stage = stageOf(next.id);
  const place = stage.number
    ? `${stage.name} · stage ${String(stage.number)} of ${String(stage.of)}`
    : stage.name;
  // A compact tile that takes its content's height: beside the limitations it is the last
  // row's right third, aligned to its top; without them it closes the page across the row.
  return (
    <a
      href={href(next.id)}
      aria-label={`Next module: ${next.name}`}
      className={cx(
        "group flex min-w-0 items-center justify-between gap-4 self-start rounded-ds-lg border border-border-subtle bg-surface-card p-5 outline-focus-ring hover:border-border-container focus-visible:outline-2 focus-visible:outline-offset-2",
        wide ? "lg:col-span-12" : "lg:col-span-4",
      )}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-caption font-medium text-text-secondary">Next module</span>
        <span className="font-display text-h4 font-medium text-text-primary">
          {next.name}{" "}
          <span className="font-mono text-caption font-normal text-text-tertiary">{next.id}</span>
        </span>
        <span className="text-caption text-text-secondary">
          {place} · {next.state}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="grid size-10 flex-none place-items-center rounded-ds-sm border border-action-subtle-hover bg-surface-selected text-action"
      >
        <ArrowRight className="size-4" />
      </span>
    </a>
  );
}
