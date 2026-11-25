import { ArrowRight, ClockRewind } from "@untitledui/icons";
import type { ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/status/StatusBadge";
import { cx } from "@/utils/cx";
import { moduleName } from "../../api";
import {
  CONFIDENCE_INPUTS,
  comparisonForRun,
  evidenceHref,
  evidencePath,
  evidenceToken,
  publishedRunForFolder,
  readerText,
  runPathway,
  runTiming,
  unitLabel,
  type OutputEntry,
} from "../../publishedReport";
import { moduleBottomLines, moduleState, runMoneyUnit, type ReportView } from "../../reportView";
import { TextLink } from "../../../run/TextLink";
import { PublishedSource } from "../PublishedTrace";
import { decisionActions, type Action, type SpecialistOverview } from "../frontPage";
import { reportSpecialistOverview } from "../../export/reportExport";
import { plainText, richParts } from "../../richText";
import { callBlocks } from "./decision";
import { readerReason } from "./reason";
import { useSvgScale } from "./svgScale";
import { entryOf, type Passage, type PassageTable, type RowProps } from "./read";
import { Figure, GapNote, Tile } from "./Tile";

function Source({
  run,
  entry,
  line,
  name,
}: Pick<RowProps, "run"> & { entry: OutputEntry; line?: number; name: string }) {
  return (
    <PublishedSource
      href={evidencePath(run.folder, entry, line)}
      name={name}
      linkLabel={`Source for ${name}`}
    >
      View source
    </PublishedSource>
  );
}

/** One block of a module's bottom line: a paragraph, or a table the module wrote there. */
type Said = Passage | PassageTable;

function EvidenceLink({ href, children }: { href: string; children: string }) {
  return (
    <Button className={LINK} href={href} color="link-gray" size="sm" iconTrailing={ArrowRight}>
      {children}
    </Button>
  );
}

/**
 * One block of a bottom line in the module's words: a paragraph through the reader rule (inline
 * source markers removed), a link where it cites a source or carries an id the page cannot name,
 * the table it is said in, or the gap when there is none.
 */
function Sentence({
  run,
  entry,
  passage,
  className,
  of = "bottom line",
}: Pick<RowProps, "run"> & {
  entry: OutputEntry;
  passage: Said | undefined;
  className: string;
  /** The passage the block is from, in lower case. */
  of?: string;
}) {
  if (!passage)
    return <GapNote>Not established for this run. The module wrote no bottom line.</GapNote>;
  const href = evidencePath(run.folder, entry, passage.line);
  if ("table" in passage)
    return (
      <div className="flex flex-col items-start gap-1">
        <p className="text-small text-text-secondary">{`The ${of} is a table.`}</p>
        <EvidenceLink href={href}>Read this table in Evidence</EvidenceLink>
      </div>
    );
  const words = passage.text === null ? null : readerReason(passage.text);
  if (words === null)
    return (
      <div className="flex flex-col items-start gap-1">
        {passage.cited && (
          <p className="text-small text-text-secondary">
            {`The ${of} cites a source reference; read it in Evidence.`}
          </p>
        )}
        <EvidenceLink href={href}>Read this passage in Evidence</EvidenceLink>
      </div>
    );
  return <p className={className}>{words}</p>;
}

/** The modules of the run as the pipeline draws them: the lead, then every other but the changes module. */
function pipelineModules(run: RowProps["run"], view: ReportView) {
  const lead = view.lead ? [{ name: moduleName(view.lead.output.module), entry: view.lead }] : [];
  return [...lead, ...moduleBottomLines(view, run).map(({ name, entry }) => ({ name, entry }))];
}

/** A module's state in words; a handoff that could not be read says so, not "not assessable". */
const stateWord = (entry: OutputEntry) =>
  entry.output.parseError ? "could not be read" : moduleState(entry).toLowerCase();

/** How many modules ran, by the pipeline's count, and by name each one that was not delivered. */
function moduleCount(run: RowProps["run"], view: ReportView) {
  const all = pipelineModules(run, view);
  if (all.length === 0) return "No module ran";
  const groups = new Map<string, string[]>();
  for (const { name, entry } of all) {
    const word = stateWord(entry);
    groups.set(word, [...(groups.get(word) ?? []), name]);
  }
  const delivered = groups.get("delivered")?.length ?? 0;
  const total = String(all.length);
  if (delivered === all.length) return `${total} · all delivered`;
  const others = [...groups]
    .filter(([word]) => word !== "delivered")
    .map(([word, names]) => `${word}: ${names.join(", ")}`);
  return `${total} · ${[`${String(delivered)} delivered`, ...others].join("; ")}`;
}

const LINK_CLASS = "inline-flex min-h-8 items-center max-[480px]:min-h-11";

function RunFacts({ run, view }: Pick<RowProps, "run" | "view">) {
  const unit = runMoneyUnit(view.catalogue);
  const facts = [
    ["Pathway", runPathway(run, view.catalogue)],
    ["Timing", runTiming(run)],
    ["Currency", unit ? unitLabel(unit) : ""],
    ["Modules", moduleCount(run, view)],
  ].filter(([, value]) => value);
  return (
    <div className="flex flex-col gap-3 border-t border-border-hairline pt-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {facts.map(([term, value]) => (
          <div key={term} className="flex min-w-0 flex-col gap-1">
            <dt className="text-caption text-text-tertiary">{term}</dt>
            <dd className="text-small wrap-anywhere text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      <nav aria-label="On this page" className="flex flex-wrap gap-x-5 text-small">
        <TextLink className={LINK_CLASS} href="#overview/limitations">
          What this run could not do
        </TextLink>
        <TextLink className={LINK_CLASS} href="#overview/dates">
          Dates to watch
        </TextLink>
      </nav>
    </div>
  );
}

/** A target-sized link inside a tile: 32 px, 44 px on a phone. */
const LINK = "min-h-8 max-[480px]:min-h-11";

/** A small tile's heading and its one trace control, as the mockup's 13 px tile head. */
function Head({ children, trace }: { children: ReactNode; trace?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-small font-medium text-text-secondary">
        {children}
      </h3>
      {trace}
    </div>
  );
}

/**
 * The run's decisions as a summary page may show them: never the decision itself, which no run
 * records a clearance for; a recorded hold with its reason and its source, or why it is not shown.
 */
function Decisions({ run, decisions }: { run: RowProps["run"]; decisions: Action[] }) {
  if (!decisions.length) return null;
  return (
    <dl aria-label="Decisions" className="flex flex-col gap-2">
      {decisions.map(({ module, label, status, reason, screenReason, owner }) => (
        <div key={module} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <dt className="text-small font-medium text-text-primary">{label}</dt>
          <dd className="min-w-0 flex-1 text-small text-text-secondary">
            {status === "withheld" ? `Withheld: ${reason}` : (screenReason ?? reason)}
          </dd>
          {owner && (
            <dd>
              <PublishedSource
                href={evidenceHref(run.folder, evidenceToken({ output: owner }))}
                name={label.toLowerCase()}
                linkLabel={`Source for the ${label.toLowerCase()} hold`}
              >
                View source
              </PublishedSource>
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

/**
 * A relative value or portfolio run publishes no credit view: it leads with its purpose findings,
 * each as written with its own trace, and the restriction on its decision where one applies.
 */
function SpecialistCall({
  run,
  specialist,
}: Pick<RowProps, "run"> & { specialist: SpecialistOverview }) {
  const { title, findings, restriction } = specialist;
  const trace = (owner: { id: string; sha256: string }, line: number) =>
    evidenceHref(run.folder, evidenceToken({ output: owner }, line));
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-small font-medium text-text-secondary">The call · {title}</h3>
      {findings.map((finding, index) => {
        const name =
          index === 0
            ? title.toLowerCase()
            : `${title.toLowerCase()}, finding ${String(index + 1)}`;
        return (
          <div
            key={`${finding.owner.id}:${String(finding.line)}`}
            className="flex items-start justify-between gap-3"
          >
            <p
              className={cx(
                "max-w-[840px] text-pretty text-text-primary",
                index === 0
                  ? cx(
                      "font-medium",
                      bottomLineSize({ line: finding.line, text: plainText(finding.body) }),
                    )
                  : "text-body",
              )}
            >
              {richParts(finding.body, readerText)}
            </p>
            <PublishedSource
              href={trace(finding.owner, finding.line)}
              name={`the ${name}`}
              linkLabel={`Source for the ${name}`}
            >
              View source
            </PublishedSource>
          </div>
        );
      })}
      {restriction && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-small font-medium text-text-primary">{restriction.label}</p>
          <p className="min-w-0 flex-1 text-small text-text-secondary">
            {richParts(restriction.screenReason ?? restriction.reason, readerText)}
          </p>
          {restriction.source && (
            <PublishedSource
              href={trace(restriction.source.owner, restriction.source.line)}
              name={restriction.label.toLowerCase()}
              linkLabel={`Source for the ${restriction.label.toLowerCase()}`}
            >
              View source
            </PublishedSource>
          )}
        </div>
      )}
    </div>
  );
}

function CallTile({ snapshot, run, view }: RowProps) {
  const lead = view.lead;
  const decisions = decisionActions(view, run);
  const { heading, blocks } = callBlocks(view, run);
  const [first, ...rest] = blocks;
  const key = publishedRunForFolder(snapshot.workspace.runs, run.folder)?.[0];
  const specialist = key === undefined ? null : reportSpecialistOverview(view, run, key);
  if (specialist)
    return (
      <Tile span={8} label="The call" className="gap-7 self-start">
        <SpecialistCall run={run} specialist={specialist} />
        <RunFacts run={run} view={view} />
      </Tile>
    );
  if (!lead || !first)
    return (
      <Tile span={8} label="The call" className="gap-6 self-start">
        <Head>The call</Head>
        <GapNote>
          A verified credit view is unavailable for this run. Each module's findings are under
          Modules.
        </GapNote>
        <Decisions run={run} decisions={decisions} />
        <RunFacts run={run} view={view} />
      </Tile>
    );
  const name = moduleName(lead.output.module);
  return (
    <Tile span={8} label="The call" className="gap-7 self-start">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h3 className="text-small font-medium text-text-secondary">The call · {name}</h3>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-caption text-text-secondary">{heading}</span>
            <Source
              run={run}
              entry={lead}
              line={first.line}
              name={`the ${heading.toLowerCase()}`}
            />
          </div>
          <Sentence
            run={run}
            entry={lead}
            passage={first}
            className={cx(
              "max-w-[840px] font-medium text-pretty text-text-primary",
              bottomLineSize(first),
            )}
            of={heading.toLowerCase()}
          />
          <Continuation run={run} entry={lead} rest={rest} of={heading.toLowerCase()} />
        </div>
        <Decisions run={run} decisions={decisions} />
      </div>
      <RunFacts run={run} view={view} />
    </Tile>
  );
}

/** The bottom line's further paragraphs, each shown or linked with its own trace. */
function Paragraphs({
  run,
  entry,
  rest,
  className,
  of,
}: Pick<RowProps, "run"> & { entry: OutputEntry; rest: Said[]; className: string; of: string }) {
  return (
    <div className={className}>
      {rest.map((passage, at) => (
        <div key={passage.line} className="flex items-start justify-between gap-3">
          <Sentence
            run={run}
            entry={entry}
            passage={passage}
            className="reading-copy text-body text-text-secondary"
            of={of}
          />
          <Source
            run={run}
            entry={entry}
            line={passage.line}
            name={`paragraph ${String(at + 2)} of the call, from the ${of}`}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The continuation: in full from md, where the decider reads it with the call; on a phone behind
 * "Read on", so the trust tiles stay within the first screens. CSS alone chooses: the hidden copy
 * is out of the accessibility tree.
 */
function Continuation({
  run,
  entry,
  rest,
  of,
}: Pick<RowProps, "run"> & { entry: OutputEntry; rest: Said[]; of: string }) {
  if (rest.length === 0) return null;
  return (
    <>
      <Paragraphs
        run={run}
        entry={entry}
        rest={rest}
        className="hidden md:flex md:flex-col md:gap-3"
        of={of}
      />
      <details className="md:hidden">
        <summary className="flex min-h-11 w-fit cursor-pointer items-center rounded-ds-xs text-small font-medium text-text-link outline-focus-ring focus-visible:outline-2">
          Read on
        </summary>
        <Paragraphs
          run={run}
          entry={entry}
          rest={rest}
          className="mt-2 flex flex-col gap-3"
          of={of}
        />
      </details>
    </>
  );
}

/**
 * A bottom line up to this many characters is one short line at desktop and takes the display
 * size; a longer one steps down the ramp so the headline figures stay on the first screen. No
 * figure on the page is larger than either step (headline figures are metric, 36 px).
 */
const SHORT_BOTTOM_LINE = 90;

const bottomLineSize = (passage: Said | undefined) =>
  (passage && "text" in passage ? (passage.text ?? "") : "").length <= SHORT_BOTTOM_LINE
    ? "text-h2 sm:text-h1 lg:text-display"
    : "text-h3 sm:text-h2 lg:text-metric";

type Score = { value: number; band: string };
type Scored = { name: string; score: Score };
/** The second module marked on the meter: its score, or its name when it recorded none. */
type Second = Scored | { name: string; score: null } | null;

/** The meter's reading in words: the score, its band, and the second module's score where marked. */
const meterReading = (first: Scored, second: Scored | null) =>
  `Confidence ${String(first.score.value)} of 100, band ${first.score.band}.` +
  (second
    ? ` ${second.name} scored ${String(second.score.value)}, band ${second.score.band}.`
    : "");

/**
 * A 0 to 100 meter: the score as the filled length, a second module's score as a tick. The two
 * scores are named on a line under the bar, so their labels never collide or leave the scale.
 */
function Meter({ first, second }: { first: Scored; second: Second }) {
  const { ref, font } = useSvgScale(408);
  const x = (score: number) => (Math.min(Math.max(score, 0), 100) / 100) * 408;
  const scored = second?.score ? second : null;
  const tick = scored?.score.value ?? null;
  return (
    <div className="flex flex-col gap-1.5">
      <svg
        ref={ref}
        viewBox="0 0 408 40"
        width="100%"
        role="img"
        aria-label={meterReading(first, scored)}
        className="block overflow-visible"
      >
        <rect x="0" y="6" width="408" height="6" rx="3" className="fill-border-hairline" />
        <rect x="0" y="6" width={x(first.score.value)} height="6" rx="3" className="fill-chart-1" />
        {tick !== null && (
          <line
            x1={x(tick)}
            x2={x(tick)}
            y1="2"
            y2="16"
            strokeWidth="1.5"
            className="stroke-text-primary"
          />
        )}
        <text x="0" y="38" fontSize={font()} className="fill-text-tertiary font-mono">
          0
        </text>
        <text
          x="408"
          y="38"
          textAnchor="end"
          fontSize={font()}
          className="fill-text-tertiary font-mono"
        >
          100
        </text>
      </svg>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1.5 w-3 rounded-ds-full bg-chart-1" />
          <span>{`${first.name} ${String(first.score.value)}`}</span>
        </span>
        {second && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 border-l-[1.5px] border-text-primary" />
            <span>
              {scored
                ? `${scored.name} ${String(scored.score.value)} · ${scored.score.band}`
                : `${second.name}: no score recorded`}
            </span>
          </span>
        )}
      </p>
    </div>
  );
}

/** The first block of the score's inputs, which the trace drawer opens; the section heading does not. */
const confidenceLine = (entry: OutputEntry) =>
  (
    entry.sections.find((section) => section.heading === CONFIDENCE_INPUTS) ??
    entry.output.confidenceTrace?.section
  )?.blocks[0]?.line;

const scoreOf = (entry: OutputEntry | undefined) => {
  const score = entry?.output.confidence;
  return score && "value" in score ? score : null;
};

function ConfidenceTile({ run, view }: Pick<RowProps, "run" | "view">) {
  const lead = view.lead;
  const score = scoreOf(lead);
  if (!lead || !score)
    return (
      <Tile span={12} label="Confidence">
        <Head>Confidence</Head>
        <GapNote>No confidence score was recorded for this credit view.</GapNote>
      </Tile>
    );
  const selection = lead.output.module === "CP-3" ? undefined : entryOf(view, "CP-3");
  const second = scoreOf(selection);

  return (
    <Tile span={12} label="Confidence" className="gap-2">
      <Head
        trace={
          <Source run={run} entry={lead} line={confidenceLine(lead)} name="the confidence score" />
        }
      >
        Confidence
      </Head>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Figure className="text-metric font-medium">{score.value}</Figure>
        <span className="text-body font-medium text-text-primary">{score.band}</span>
        <span className="text-caption text-text-tertiary">{moduleName(lead.output.module)}</span>
      </p>
      <Meter
        first={{ name: moduleName(lead.output.module), score }}
        second={selection ? { name: moduleName(selection.output.module), score: second } : null}
      />
    </Tile>
  );
}

/**
 * Evidence validation's bottom line can restate the decision, which no run records a clearance
 * for, so the Overview names the module and links its page; the page shows what it found.
 */
function ClearanceTile({ view }: Pick<RowProps, "view">) {
  const entry = entryOf(view, "CP-5");
  const name = moduleName("CP-5");
  if (!entry)
    return (
      <Tile span={12} label="Evidence clearance">
        <Head>Evidence clearance</Head>
        <GapNote>{name} is not part of this run.</GapNote>
      </Tile>
    );
  return (
    <Tile span={12} label="Evidence clearance" className="gap-3">
      <Head>Evidence clearance</Head>
      {moduleState(entry) !== "Delivered" && (
        <StatusBadge set="Module state" state={moduleState(entry)} />
      )}
      <p className="text-small text-pretty text-text-secondary">
        {`This page does not show ${name}'s bottom line: no clearance for it is recorded.`}
      </p>
      <div>
        <Button
          className={LINK}
          color="link-gray"
          size="sm"
          href="#modules/CP-5"
          iconTrailing={ArrowRight}
        >
          {`Open ${name}`}
        </Button>
      </div>
    </Tile>
  );
}

function ChangesBody({ snapshot, run, view }: RowProps): ReactNode {
  const change = comparisonForRun(run, snapshot.workspace.runs);
  const entry = entryOf(view, "CP-8");
  if (change?.problem) return <GapNote>{change.problem}</GapNote>;
  if (change?.pack && !entry) return <GapNote>The changes module is not part of this run.</GapNote>;
  if (!change?.pack || !entry)
    return (
      <p className="text-small text-text-secondary">
        {change?.first_run
          ? "No earlier run to compare."
          : "No comparison with an earlier run is shown for this run."}
      </p>
    );
  // The changes module's bottom line can restate a decision no clearance is recorded for, so it
  // stays on the Changes page, as the other decision passages stay on theirs.
  return (
    <p className="text-small text-text-secondary">
      A comparison with the earlier run is on the Changes page.
    </p>
  );
}

function ChangesTile(props: RowProps) {
  return (
    <Tile span={12} label="Since the earlier run" className="gap-3">
      <Head>
        <ClockRewind aria-hidden="true" className="size-4" />
        Since the earlier run
      </Head>
      <ChangesBody {...props} />
      <div>
        <Button
          className={LINK}
          color="link-gray"
          size="sm"
          href="#changes"
          iconTrailing={ArrowRight}
        >
          Open Changes
        </Button>
      </div>
    </Tile>
  );
}

/**
 * Row 1: the call. The stance and bottom line take the widest tile; beside them, how far to trust
 * it (confidence, evidence clearance) and whether it moved since the earlier run.
 */
export function CallRow(props: RowProps) {
  return (
    <>
      <CallTile {...props} />
      <div className="flex min-w-0 flex-col gap-4 self-start lg:col-span-4">
        <ConfidenceTile run={props.run} view={props.view} />
        <ClearanceTile view={props.view} />
        <ChangesTile {...props} />
      </div>
    </>
  );
}
