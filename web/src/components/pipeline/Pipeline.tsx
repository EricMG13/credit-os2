import type { CSSProperties } from "react";
import { STATUS_SETS, type State, type Tone } from "@/components/status/sets";
import { StatusShape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import "./pipeline.css";

export type PipelineState = "delivered" | "running" | "queued" | "blocked" | "failed";

export interface PipelineNode {
  id: string;
  name: string;
  state: PipelineState;
  /** A link when given; otherwise a static item of the same shape. */
  href?: string;
  /** The state's own word where the default would be wrong: "Interrupted", "Not run", "Finished". */
  word?: string;
  /** One quiet line under the name; on a wide screen it is read aloud, not drawn. */
  detail?: string;
  /** The module a failed run stopped at: its node and word take the failure tone. */
  stopped?: boolean;
}

export interface PipelineStage {
  name: string;
  nodes: readonly PipelineNode[];
}

/** Which edges move: out of delivered nodes (a finished report), into running nodes (a run in flight), none. */
export type PipelineFlow = "delivered" | "running" | "none";

const DEFAULT_WORD: Record<PipelineState, string> = {
  delivered: "Delivered",
  running: "Running",
  queued: "Queued",
  blocked: "Not assessable",
  failed: "Failed",
};
// Words drawn as a quiet mark with the word read aloud and explained in the key; any other word is drawn.
const QUIET_WORDS: ReadonlySet<string> = new Set(["Delivered", "Finished", "Queued", "Not run"]);

const MARK: Record<Tone, string> = {
  success: "text-success-mark",
  warning: "text-warning-mark",
  error: "text-error-mark",
  info: "text-info-mark",
  neutral: "text-text-secondary",
  action: "text-action",
  gap: "text-text-secondary",
};

function stateOf(node: PipelineNode): State & { word: string } {
  const word = node.word ?? DEFAULT_WORD[node.state];
  const set = Object.hasOwn(STATUS_SETS["Module state"], word)
    ? (STATUS_SETS["Module state"] as Record<string, State>)
    : (STATUS_SETS["Run states"] as Record<string, State>);
  return { ...(set[word] ?? STATUS_SETS["Run states"].Queued), word };
}

// Geometry in columns mode, in px. Every stage is one column on one rhythm: a node is 40 tall with
// an 8 gap, and a node whose word is drawn (blocked, delivered with gaps) is 60. One bus runs in
// the gap between two stages; every edge is a straight stub from a node to that bus.
const SHORT = 40;
const TALL = 60;
const GAP = 8;

/** A blocked module, or one delivered with gaps, has its word drawn in its node. */
const showsWord = (node: PipelineNode) =>
  node.state === "blocked" || node.word === "Delivered with gaps";

interface Placed {
  node: PipelineNode;
  top: number;
  /** The node's height, and where its edges meet it. */
  size: number;
}

function place(nodes: readonly PipelineNode[]): { placed: Placed[]; height: number } {
  let top = 0;
  const placed = nodes.map((node): Placed => {
    const size = showsWord(node) ? TALL : SHORT;
    const entry: Placed = { node, top, size };
    top += size + GAP;
    return entry;
  });
  return { placed, height: top - GAP };
}

/** A stage's share of the width: equal columns, and a lone short name takes less. */
function weight(stage: PipelineStage) {
  return stage.nodes.every((node) => node.name.length <= 8) ? "minmax(0,0.7fr)" : "minmax(0,1fr)";
}

const stops = (node: PipelineNode) => node.state === "blocked" || node.state === "failed";

/** A bus from the stage's middle line out to the centres of the nodes it serves (all in px from the top). */
function span(centres: readonly number[], middle: number) {
  const top = Math.min(middle, ...centres);
  return { top, height: Math.max(middle, ...centres) - top };
}

// Written whole, so the class scan finds them. Stages are columns from lg up.
const AT = {
  list: "lg:grid lg:grid-cols-(--cols) lg:gap-x-6 lg:gap-y-0 lg:border-l-0 lg:pl-0",
  head: "lg:h-8",
  body: "lg:flex lg:flex-1 lg:items-center",
  nodes: "lg:relative lg:block lg:h-(--h) lg:w-full",
  item: "lg:absolute lg:top-(--top) lg:left-0 lg:h-(--nh) lg:w-full",
  box: "lg:h-full lg:min-h-0 lg:px-1.5 lg:py-1 lg:text-caption",
  clamp: "lg:line-clamp-2",
  tag: "lg:sr-only",
  mark: "hidden lg:block",
  detail: "lg:sr-only",
  show: "hidden lg:block",
} as const;
type Classes = typeof AT;

const STUB = "pipeline-edge absolute top-1/2";

function Mark({
  shape,
  tone,
  live = false,
}: {
  shape: State["shape"];
  tone: Tone;
  live?: boolean;
}) {
  return (
    <span className={cx("flex flex-none rounded-ds-full", MARK[tone], live && "status-halo")}>
      <StatusShape shape={shape} />
    </span>
  );
}

function NodeBody({ node, at }: { node: PipelineNode; at: Classes }) {
  const { shape, tone, word } = stateOf(node);
  const quiet = QUIET_WORDS.has(word);
  const drawn = showsWord(node);
  const failure = node.stopped === true;
  return (
    <>
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className={cx("min-w-0 wrap-break-word", at.clamp)}>{node.name}</span>
        {/* The mark sits inside the node, beside the name: it never crosses an edge or the well. */}
        {!drawn && (
          <span className={cx("mt-0.5 flex-none", !quiet && at.mark)}>
            <Mark shape={shape} tone={tone} live={node.state === "running"} />
          </span>
        )}
      </span>
      {quiet && <span className="sr-only">{word}</span>}
      {drawn && (
        <span
          className={cx(
            "flex items-center gap-1 text-caption font-medium",
            failure ? MARK.error : MARK[tone === "neutral" ? "warning" : tone],
          )}
        >
          <StatusShape shape={shape} />
          <span className={failure ? "text-error-text" : "text-warning-text"}>{word}</span>
        </span>
      )}
      {!quiet && !drawn && (
        <span
          className={cx(
            "flex w-fit max-w-full items-center gap-1 rounded-ds-xs border border-border-hairline bg-surface-card px-1.5 py-0.5 text-caption font-medium",
            MARK[tone],
            at.tag,
          )}
        >
          <StatusShape shape={shape} />
          <span className="text-text-primary">{word}</span>
        </span>
      )}
      {node.detail !== undefined && (
        <span className={cx("text-caption font-normal text-pretty text-text-tertiary", at.detail)}>
          {node.detail}
        </span>
      )}
    </>
  );
}

const BOX =
  "relative flex min-h-11 min-w-0 flex-col justify-center gap-1 rounded-ds-sm border bg-surface-card px-3 py-2 text-small font-medium text-text-primary";

function boxTone(node: PipelineNode) {
  if (node.stopped) return "border-error-mark bg-error-fill";
  if (node.state === "blocked") return "border-dashed border-warning-mark bg-warning-fill";
  // A second line of the accent around a running node: it reads as live with no motion at all.
  if (node.state === "running") return "border-action bg-surface-selected ring-1 ring-action";
  if (node.state === "failed")
    return stateOf(node).tone === "error" ? "border-error-mark" : "border-warning-mark";
  return "border-border-hairline";
}

interface Flowing {
  /** This node's edge into it moves. */
  into: boolean;
  /** This node's edge out of it moves. */
  out: boolean;
}

function Stubs({
  node,
  fed,
  emits,
  flowing,
  at,
}: {
  node: PipelineNode;
  fed: boolean;
  emits: boolean;
  flowing: Flowing;
  at: Classes;
}) {
  // The path into a running module is the one heavier line of the graph.
  const live = flowing.into && node.state === "running";
  return (
    <>
      {fed && (
        <span
          aria-hidden="true"
          {...(live ? { "data-edge": "running" } : {})}
          className={cx(
            STUB,
            at.show,
            "-left-3 w-3",
            live ? "h-0.5" : "h-px",
            node.stopped
              ? "border-t border-dashed border-error-mark"
              : node.state === "blocked"
                ? "border-t border-dashed border-warning-mark"
                : "bg-connector",
            flowing.into && "pipeline-flow",
          )}
        />
      )}
      {emits && (
        <span
          aria-hidden="true"
          {...(flowing.out ? { "data-edge": "delivered" } : {})}
          className={cx(
            STUB,
            at.show,
            "left-full h-px w-3 bg-connector",
            flowing.out && "pipeline-flow",
          )}
        />
      )}
    </>
  );
}

function Bus({
  side,
  range,
  moving,
  at,
  forId,
}: {
  side: "in" | "out";
  range: { top: number; height: number };
  moving: boolean;
  at: Classes;
  /** A moving segment laid over the bus: the stretch that leads to this module. */
  forId?: string;
}) {
  return (
    <span
      aria-hidden="true"
      {...(forId === undefined ? { "data-bus": side } : { "data-for": forId })}
      style={{ top: range.top, height: range.height }}
      className={cx(
        "pipeline-edge absolute bg-connector",
        forId === undefined ? "w-px" : "w-0.5",
        at.show,
        side === "in" ? "-left-3" : "-right-[13px]",
        moving && "pipeline-flow-y",
      )}
    />
  );
}

function NodeItem({
  entry,
  stub,
  at,
}: {
  entry: Placed;
  stub: Omit<React.ComponentProps<typeof Stubs>, "node" | "at">;
  at: Classes;
}) {
  const { node, top, size } = entry;
  const classes = cx(BOX, boxTone(node), at.box);
  return (
    <li
      aria-current={node.state === "running" ? "step" : undefined}
      style={{ "--top": `${String(top)}px`, "--nh": `${String(size)}px` } as CSSProperties}
      className={cx("relative", at.item)}
    >
      <Stubs node={node} at={at} {...stub} />
      {node.href === undefined ? (
        <div data-node={node.state} className={classes}>
          <NodeBody node={node} at={at} />
        </div>
      ) : (
        <a
          data-node={node.state}
          href={node.href}
          className={cx(
            classes,
            "outline-focus-ring transition-colors duration-100 hover:border-border-control focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <NodeBody node={node} at={at} />
        </a>
      )}
    </li>
  );
}

interface StageContext {
  first: boolean;
  last: boolean;
  /** The stage before it passes something on. */
  fed: boolean;
  /** The graph's flow, and whether this stage's side of the shared bus moves. */
  flow: PipelineFlow;
  busIn: boolean;
  busOut: boolean;
}

function Stage({
  stage,
  context,
  level,
  at,
}: {
  stage: PipelineStage;
  context: StageContext;
  level: 3 | 4;
  at: Classes;
}) {
  const Heading = level === 3 ? "h3" : "h4";
  const { placed, height } = place(stage.nodes);
  const middle = height / 2;
  const centres = (keep: (node: PipelineNode) => boolean) =>
    placed.filter(({ node }) => keep(node)).map(({ top, size }) => top + size / 2);
  const emitters = context.last ? [] : centres((node) => !stops(node));
  return (
    <li className="grid min-w-0 grid-rows-[auto_1fr] gap-1">
      <Heading className={cx("block text-caption text-text-tertiary", at.head)}>
        <span>{stage.name}</span>
        <span className="ml-2 font-mono tabular-nums">{stage.nodes.length}</span>
      </Heading>
      <div className={at.body}>
        <ul
          style={{ "--h": `${String(height)}px` } as CSSProperties}
          className={cx("grid min-w-0 gap-2", at.nodes)}
        >
          {context.fed && (
            <Bus
              side="in"
              range={span(
                placed.map(({ top, size }) => top + size / 2),
                middle,
              )}
              moving={context.busIn}
              at={at}
            />
          )}
          {emitters.length > 0 && (
            <Bus side="out" range={span(emitters, middle)} moving={context.busOut} at={at} />
          )}
          {context.flow === "running" &&
            context.fed &&
            placed
              .filter(({ node }) => node.state === "running")
              .map(({ node, top, size }) => ({
                id: node.id,
                range: span([top + size / 2], middle),
              }))
              .filter(({ range }) => range.height > 0)
              .map(({ id, range }) => (
                <Bus key={`trunk-${id}`} side="in" range={range} moving at={at} forId={id} />
              ))}
          {placed.map((entry) => (
            <NodeItem
              key={`${String(entry.top)}-${entry.node.id}`}
              entry={entry}
              at={at}
              stub={{
                fed: context.fed,
                emits: !context.last && !stops(entry.node),
                flowing: {
                  into:
                    context.flow === "running"
                      ? entry.node.state === "running"
                      : context.flow === "delivered" &&
                        context.busIn &&
                        entry.node.state !== "blocked",
                  out: context.flow === "delivered" && entry.node.state === "delivered",
                },
              }}
            />
          ))}
        </ul>
      </div>
    </li>
  );
}

/** The states in use, each as the mark the nodes carry and its word. */
export function PipelineKey({
  stages,
  className,
}: {
  stages: readonly PipelineStage[];
  className?: string;
}) {
  const words = [
    ...new Map(
      stages.flatMap((stage) => stage.nodes.map(stateOf)).map((state) => [state.word, state]),
    ).values(),
  ];
  if (words.length === 0) return null;
  return (
    <ul
      aria-label="Pipeline key"
      className={cx(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-secondary",
        className,
      )}
    >
      {words.map(({ shape, tone, word }) => (
        <li key={word} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cx("flex", MARK[tone])}>
            <StatusShape shape={shape} />
          </span>
          {word}
        </li>
      ))}
    </ul>
  );
}

/**
 * The staged node graph of a run: stages as columns from lg up, one vertical list below.
 * The same drawing serves the finished run on the Overview and the live run on Run progress.
 * Stage names are headings one level below the caller's tile title: h4 unless told otherwise.
 */
export function Pipeline({
  label,
  stages,
  flow = "none",
  stageLevel = 4,
  legend = true,
}: {
  label: string;
  stages: readonly PipelineStage[];
  flow?: PipelineFlow;
  stageLevel?: 3 | 4;
  legend?: boolean;
}) {
  const at = AT;
  const shown = stages.filter((stage) => stage.nodes.length > 0);
  const passes = shown.map(
    (stage, i) => i < shown.length - 1 && stage.nodes.some((n) => !stops(n)),
  );
  const delivered = shown.map((stage) => stage.nodes.some((n) => n.state === "delivered"));
  return (
    <>
      <ol
        aria-label={label}
        style={{ "--cols": shown.map(weight).join(" ") } as CSSProperties}
        className={cx("grid gap-4 border-l border-connector pl-4", at.list)}
      >
        {shown.map((stage, i) => (
          <Stage
            key={`${String(i)}-${stage.name}`}
            stage={stage}
            level={stageLevel}
            at={at}
            context={{
              first: i === 0,
              last: i === shown.length - 1,
              fed: i > 0 && (passes[i - 1] ?? false),
              flow,
              busIn:
                flow === "delivered" && (delivered[i - 1] ?? false) && (passes[i - 1] ?? false),
              busOut: flow === "delivered" && (delivered[i] ?? false),
            }}
          />
        ))}
      </ol>
      {legend && <PipelineKey stages={shown} className="mt-3" />}
    </>
  );
}
