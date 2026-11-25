import { ChevronRight } from "@untitledui/icons";
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChartTable, type TableRowData } from "@/components/chart/ChartTable";
import { Missing } from "@/components/gap/Missing";
import { Segmented } from "@/components/kit/Segmented";
import { cx } from "@/utils/cx";
import { EventAxis } from "../../visuals/EventAxis";
import { PublishedSource } from "../PublishedTrace";
import { GapNote, Tile, Well } from "../overview/Tile";
import { GapWayOn } from "./kit/LeadFrame";
import {
  axisAsOf,
  IN_EVIDENCE,
  type Edge,
  type Lane,
  type LaneEvent,
  type MapGap,
  type MapRead,
  type Paragraph,
  type UnplacedEvent,
} from "./read";

type Span = Parameters<typeof Tile>[0]["span"];

/** The one trace control of a figure, row or paragraph. */
export function Trace({ href, name }: { href: string; name: string }) {
  return (
    <PublishedSource href={href} name={name} linkLabel={`Source for ${name}`}>
      View source
    </PublishedSource>
  );
}

export type LeadTable = { head: string[]; rows: TableRowData[]; endHeading?: string };

const VIEWS = [
  { key: "figure", label: "Figure" },
  { key: "table", label: "Table" },
] as const;

const FOCUS = "outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * A table in a named, focusable region that scrolls sideways inside the tile, never the page; long
 * cells wrap at about 28 characters.
 */
export function TableRegion({ label, table }: { label: string; table: LeadTable }) {
  return (
    <div
      role="region"
      aria-label={`${label} table`}
      // A region that scrolls sideways takes focus so a keyboard can scroll it (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className={cx(
        "relative max-w-full min-w-0 overflow-x-auto rounded-ds-xs [&_td]:max-w-[28ch] [&_td]:whitespace-normal [&_td]:wrap-break-word [&>div]:overflow-visible",
        FOCUS,
      )}
    >
      <ChartTable
        caption={label}
        head={table.head}
        rows={table.rows}
        endHeading={table.endHeading}
      />
    </div>
  );
}

function CardCell({ cell }: { cell: TableRowData["cells"][number] }) {
  if (cell === null) return <Missing />;
  if (typeof cell !== "string")
    return <GapCell word={"withheld" in cell ? "Withheld" : "Not supplied"} />;
  const gap = statedGap(cell);
  return gap ? <GapCell word={gap.word} reason={gap.reason} /> : <>{cell}</>;
}

/**
 * A table in its named region from sm up; below sm, one card per row, its label as the card's
 * heading, every other column as the two-column key-value list, its trace in the card's head.
 */
export function TableOrCards({ label, table }: { label: string; table: LeadTable }) {
  return (
    <>
      <div className="hidden min-w-0 sm:block">
        <TableRegion label={label} table={table} />
      </div>
      <ul aria-label={label} className="flex min-w-0 flex-col gap-3 sm:hidden">
        {table.rows.map((row, at) => (
          <li
            key={`${String(at)}-${row.label}`}
            className="flex min-w-0 flex-col gap-2 rounded-ds-sm border border-border-hairline p-3"
          >
            <span className="flex items-start justify-between gap-2">
              <h4 className="min-w-0 text-small font-medium wrap-anywhere text-text-primary">
                {row.label}
              </h4>
              {row.end}
            </span>
            <KeyValues
              items={row.cells.map((cell, column) => ({
                key: table.head[column + 1] ?? "",
                value: <CardCell cell={cell} />,
              }))}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

/** A table a reader opens when they want it: closed until asked, in the same scroll region. */
export function Disclosure({
  label,
  summary,
  table,
}: {
  label: string;
  summary?: ReactNode;
  table: LeadTable;
}) {
  return (
    <details className="group min-w-0 rounded-ds-sm border border-border-hairline">
      <summary
        className={cx(
          "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-ds-sm px-3 text-small font-medium text-text-primary",
          FOCUS,
        )}
      >
        <span className="min-w-0 wrap-anywhere">{summary ?? label}</span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 flex-none text-text-tertiary transition-transform group-open:rotate-90 motion-reduce:transition-none"
        />
      </summary>
      <div className="border-t border-border-hairline p-3">
        <TableRegion label={label} table={table} />
      </div>
    </details>
  );
}

/** The one notes list under a figure: the module's own words on its basis or its gaps. */
export function Notes({ notes }: { notes: readonly ReactNode[] }) {
  if (!notes.length) return null;
  return (
    <ul className="flex flex-col gap-1.5 border-t border-border-hairline pt-3 text-caption text-text-secondary">
      {notes.map((note, at) => (
        <li key={at} className="wrap-anywhere">
          {note}
        </li>
      ))}
    </ul>
  );
}

/**
 * Named values as a two-column list, caption-sized labels; `stacked` puts each key above its value,
 * for keys long enough to squeeze their values.
 */
export function KeyValues({
  items,
  stacked = false,
  className,
}: {
  items: readonly { key: string; value: ReactNode }[];
  stacked?: boolean;
  className?: string;
}) {
  return (
    <dl
      className={cx(
        "grid gap-x-3 text-small",
        // The label column takes its words up to 55% of the list, then wraps: the value always
        // keeps the rest, so a long label in a narrow tile never leaves it a letter a line.
        stacked ? "grid-cols-1 gap-y-0" : "grid-cols-[fit-content(55%)_minmax(0,1fr)] gap-y-0.5",
        className,
      )}
    >
      {items.map(({ key, value }) => (
        <div key={key} className="contents">
          <dt className="wrap-anywhere text-text-tertiary">{key}</dt>
          <dd className={cx("wrap-anywhere text-text-secondary", stacked && "mb-1.5 last:mb-0")}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const STATED_GAP = /^(Not [a-z]+):\s*(\S.*)$/i;

/** A cell that states a gap ("Not supplied: no current"), as its word and its reason; else null. */
export function statedGap(text: string) {
  const match = STATED_GAP.exec(text.trim());
  if (!match) return null;
  const reason = match[2] ?? "";
  return { word: match[1] ?? "", reason: reason.charAt(0).toUpperCase() + reason.slice(1) };
}

/**
 * A missing value inside a figure: a dashed chip with the module's word ("Not supplied") and the
 * reason in words beside it. Never a zero, never a double colon. Hatch is for areas on a plot only.
 */
export function GapCell({
  reason,
  word = "Not supplied",
  className,
}: {
  reason?: string | null;
  word?: string;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className="rounded-ds-xs border border-dashed border-border-gap px-1.5 text-caption whitespace-nowrap text-gap-text">
        {word}
      </span>
      {reason && <span className="min-w-0 text-caption wrap-anywhere text-gap-text">{reason}</span>}
    </span>
  );
}

const BAR_TONE = {
  primary: "bg-chart-1",
  secondary: "bg-chart-2",
  prior: "bg-chart-3",
  /** A waterfall's opening and closing levels, its rises and its falls. */
  level: "bg-waterfall-total",
  adds: "bg-waterfall-up",
  uses: "bg-waterfall-down",
  /** A waterfall step of zero: a mark at its place, neither a rise nor a fall. */
  flat: "bg-connector",
} as const;

export type BarTone = keyof typeof BAR_TONE;

/** The one bar track of the leads: its height and radius. */
const BAR = { track: "relative block h-3 min-w-0", bar: "rounded-ds-xs" } as const;

const pct = (share: number) => `${String(Number((share * 100).toFixed(6)))}%`;

/**
 * One horizontal bar on its track, from `start` to `end` as shares of the track (0 to 1); `ticks`
 * are hairlines at shares, `zero` the darker one. Extra marks (a threshold) go in `children`.
 */
export function BarRow({
  start = 0,
  end,
  tone = "primary",
  ticks = [],
  zero,
  bar,
  className,
  children,
}: {
  start?: number;
  end: number;
  tone?: BarTone;
  ticks?: readonly number[];
  zero?: number;
  /** Data attributes for the bar itself. */
  bar?: Record<`data-${string}`, string>;
  className?: string;
  children?: ReactNode;
}) {
  const left = Math.min(start, end);
  return (
    <span aria-hidden="true" className={cx(BAR.track, className)}>
      {ticks.map((at) => (
        <span
          key={at}
          className="absolute inset-y-0 w-px bg-border-hairline"
          style={{ left: pct(at) }}
        />
      ))}
      {zero !== undefined && (
        <span className="absolute -inset-y-0.5 w-px bg-connector" style={{ left: pct(zero) }} />
      )}
      <span
        {...bar}
        className={cx("absolute inset-y-0 min-w-0.5", BAR.bar, BAR_TONE[tone])}
        style={{ left: pct(left), width: pct(Math.abs(end - start)) }}
      />
      {children}
    </span>
  );
}

/** A gap in place of a figure, sized to its words: no stretch, no hatch. */
export function CompactGap({ children }: { children: ReactNode }) {
  return (
    <p className="w-fit max-w-full rounded-ds-sm border border-dashed border-border-gap px-3 py-2 text-small wrap-anywhere text-gap-text">
      {children}
    </p>
  );
}

/**
 * A lead tile: a subject name as its title, the Figure / Table switch and the one trace control in
 * its head, the basis and legend under the title, and the figure or its table.
 */
export function LeadFigure({
  span,
  label,
  kicker,
  title,
  basis,
  legend,
  trace,
  controls,
  figure,
  table,
  notes,
  className,
}: {
  span: Span;
  label: string;
  kicker?: ReactNode;
  /** The figure's subject ("Liquidity bridge"), not a reading. */
  title: ReactNode;
  basis?: string;
  legend?: ReactNode;
  trace?: ReactNode;
  /** The module's own choice (a case, a basis), in the head's control row before the Figure / Table switch. */
  controls?: ReactNode;
  figure: ReactNode;
  table?: LeadTable;
  /** The module's own words on the figure's basis or its gaps, under the figure. */
  notes?: readonly ReactNode[];
  className?: string;
}) {
  const [view, setView] = useState<string>("figure");
  const showing = table && view === "table" ? "table" : "figure";
  const head =
    table || trace || controls ? (
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        {controls}
        {table && (
          <Segmented
            label={`${label}: figure or table`}
            segments={VIEWS}
            current={showing}
            onSelect={setView}
          />
        )}
        {trace}
      </div>
    ) : null;
  return (
    <Tile span={span} label={label} className={cx("w-full self-start", className)}>
      {/* The tile's own head, wrapping: the subject keeps its width, the controls go under it. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          {kicker != null && <p className="text-caption text-text-tertiary">{kicker}</p>}
          <h3 className="text-h4 font-medium text-balance text-text-primary">{title}</h3>
        </div>
        {head}
      </div>
      {(basis || legend) && (
        <div className="-mt-2 flex min-w-0 flex-col gap-2">
          {basis && <p className="text-caption text-text-tertiary">{basis}</p>}
          {legend && <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">{legend}</div>}
        </div>
      )}
      {showing === "table" && table ? <TableRegion label={label} table={table} /> : figure}
      {notes && <Notes notes={notes} />}
    </Tile>
  );
}

const COLUMN_SPANS = { 4: "lg:col-span-4", 6: "lg:col-span-6" } as const;

/**
 * A column of shorter tiles stacked beside a P1, each as tall as its content, so the two columns
 * end near each other. Its tiles take span 12 (their full column).
 */
export function Beside({
  span = 4,
  children,
}: {
  span?: keyof typeof COLUMN_SPANS;
  children: ReactNode;
}) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-4 self-start", COLUMN_SPANS[span])}>
      {children}
    </div>
  );
}

/**
 * A lead tile whose figure the run does not carry: the tile's title, the gap note with the reason
 * in words in the figure's place, and the way on: the tile's own trace where the handoff has a
 * table for it, else the module's output in Evidence. The same pattern as the kit's `GapTile`.
 */
export function LeadGap({
  span,
  label,
  kicker,
  title,
  reason,
  trace,
  children,
}: {
  span: Span;
  label: string;
  kicker?: ReactNode;
  title: ReactNode;
  reason: string;
  trace?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Tile
      span={span}
      label={label}
      kicker={kicker}
      title={title}
      trace={trace}
      className="w-full self-start"
    >
      <GapNote>{reason}</GapNote>
      {children}
      {!trace && <GapWayOn />}
    </Tile>
  );
}

/** A source node's identity: its words on the page, or as written when it reads In Evidence. */
const nodeOf = (edge: Edge) => (edge.from === IN_EVIDENCE ? (edge.key ?? edge.from) : edge.from);

type Placed = { id: string; name: string; depth: number };

/** Each node's column: its longest chain of edges from a node with none in; a loop edge does not move it. */
export function mapLayout(edges: readonly Edge[]) {
  const names = new Map<string, string>();
  for (const edge of edges) {
    if (!names.has(nodeOf(edge))) names.set(nodeOf(edge), edge.from);
    if (!names.has(edge.to)) names.set(edge.to, edge.to);
  }
  const out = new Map<string, string[]>();
  const reaches = (from: string, to: string) => {
    const pending = [from];
    const seen = new Set<string>();
    for (const name of pending) {
      if (name === to) return true;
      if (seen.has(name)) continue;
      seen.add(name);
      pending.push(...(out.get(name) ?? []));
    }
    return false;
  };
  for (const edge of edges) {
    const from = nodeOf(edge);
    if (from !== edge.to && !reaches(edge.to, from))
      out.set(from, [...(out.get(from) ?? []), edge.to]);
  }
  const depth = new Map([...names.keys()].map((id) => [id, 0]));
  for (let pass = 0; pass < names.size; pass += 1) {
    let changed = false;
    for (const [from, targets] of out)
      for (const to of targets) {
        const next = (depth.get(from) ?? 0) + 1;
        if ((depth.get(to) ?? 0) < next) {
          depth.set(to, next);
          changed = true;
        }
      }
    if (!changed) break;
  }
  const nodes: Placed[] = [...names].map(([id, name]) => ({ id, name, depth: depth.get(id) ?? 0 }));
  const columns = Math.max(0, ...nodes.map((node) => node.depth)) + 1;
  return Array.from({ length: columns }, (_, at) => nodes.filter((node) => node.depth === at));
}

const NODE =
  "w-fit max-w-full rounded-ds-sm border border-border-hairline bg-surface-card px-3 py-2 text-small font-medium wrap-anywhere text-text-primary";
const EDGE_TYPE =
  "rounded-ds-xs border border-border-hairline px-1.5 text-caption text-text-tertiary";

/**
 * An element's measured content width, from the browser's ResizeObserver; null until measured, so
 * a layout that needs room is never drawn before the room is known.
 */
function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? node.clientWidth;
      if (measured > 0) setWidth(measured);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, width };
}

/** A map's column (8rem) and the room between two columns (gap-x-36), which holds an edge's words. */
const COLUMN_PX = 128;
const BETWEEN_PX = 144;

/** Whether a map of `columns` depth columns fits a tile `width` pixels wide. */
const fits = (columns: number, width: number | null) =>
  width !== null && columns * COLUMN_PX + (columns - 1) * BETWEEN_PX <= width;

/**
 * Whether an edge's relationship fits one line on a connector (w-32 at caption size). A clause
 * wraps to several lines there and runs over the next connector's words, so a map that carries
 * one is drawn as the flow, where every relationship has its own line.
 */
const shortWords = (edge: Edge) => edge.relationship.length <= 20;

/** An edge's words: its relationship as written and its edge type, both at every width. */
function EdgeWords({ edge }: { edge: Edge }) {
  return (
    <>
      {edge.relationship && <span className="wrap-anywhere">{edge.relationship}</span>}
      {edge.type && <span className={EDGE_TYPE}>{edge.type}</span>}
    </>
  );
}

type Route = { key: number; path: string; x: number; y: number; edge: Edge };

/** Connectors between the measured nodes, the edge's words at each one's middle. */
function useRoutes(edges: readonly Edge[]) {
  const box = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState<{ width: number; height: number; routes: Route[] }>({
    width: 0,
    height: 0,
    routes: [],
  });
  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () => {
      const frame = node.getBoundingClientRect();
      const rect = (id: string) =>
        [...node.querySelectorAll<HTMLElement>("[data-node]")]
          .find((item) => item.dataset.node === id)
          ?.getBoundingClientRect();
      const routes = edges.flatMap((edge, key): Route[] => {
        const from = rect(nodeOf(edge));
        const to = rect(edge.to);
        if (!from || !to) return [];
        const x1 = from.right - frame.left;
        const y1 = from.top + from.height / 2 - frame.top;
        const x2 = to.left - frame.left;
        const y2 = to.top + to.height / 2 - frame.top;
        const mid = (x1 + x2) / 2;
        const path = `M${String(x1)},${String(y1)} C${String(mid)},${String(y1)} ${String(mid)},${String(y2)} ${String(x2)},${String(y2)}`;
        return [{ key, path, x: mid, y: (y1 + y2) / 2, edge }];
      });
      setDrawn({ width: frame.width, height: frame.height, routes });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [edges]);
  return { box, drawn };
}

/**
 * The map in columns by depth, a connector and its words per edge; drawn only where the columns
 * fit the tile, so it is never wider than the tile.
 */
function MapDrawing({ edges }: { edges: readonly Edge[] }) {
  const columns = mapLayout(edges);
  const arrow = useId();
  const { box, drawn } = useRoutes(edges);
  return (
    <div
      ref={box}
      aria-hidden="true"
      data-map-columns={columns.length}
      className="relative grid w-full auto-cols-[minmax(8rem,1fr)] grid-flow-col gap-x-36 gap-y-12 py-4"
    >
      {columns.map((nodes, at) => (
        <div key={at} className="flex min-w-0 flex-col justify-center gap-3">
          {nodes.map((node) => (
            <span key={node.id} data-node={node.id} className={NODE}>
              {node.name}
            </span>
          ))}
        </div>
      ))}
      {drawn.width > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 overflow-visible"
          width={drawn.width}
          height={drawn.height}
          viewBox={`0 0 ${String(drawn.width)} ${String(drawn.height)}`}
        >
          <defs>
            <marker
              id={arrow}
              viewBox="0 0 8 8"
              refX="8"
              refY="4"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" className="fill-connector" />
            </marker>
          </defs>
          {drawn.routes.map((route) => (
            <path
              key={route.key}
              d={route.path}
              fill="none"
              className="stroke-connector"
              markerEnd={`url(#${arrow})`}
            />
          ))}
        </svg>
      )}
      {drawn.width > 0 &&
        drawn.routes.map((route) => (
          <span
            key={route.key}
            data-route
            className="absolute flex w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 bg-surface-card px-1 text-center text-caption leading-tight text-text-secondary"
            style={{ left: route.x, top: route.y }}
          >
            <EdgeWords edge={route.edge} />
          </span>
        ))}
    </div>
  );
}

/**
 * A node map, laid out by the tile's measured width. One edge: a compact inline figure. More: nodes
 * in columns by depth with a connector and its words per edge, where the columns fit the tile;
 * otherwise, and for assistive technology always, the same map as a vertical flow, each source node
 * once in the order the module wrote it, its edges under it. Rows the page does not draw as edges
 * are listed after, each with its reason.
 */
export function NodeList({
  label,
  edges,
  gaps = [],
  href,
}: {
  label: string;
  edges: readonly Edge[];
  gaps?: readonly MapGap[];
  href?: (line: number) => string;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const nodes = [...new Map(edges.map((edge) => [nodeOf(edge), edge.from])).entries()];
  const [only] = edges;
  const layout =
    only && edges.length === 1
      ? "inline"
      : edges.length && edges.every(shortWords) && fits(mapLayout(edges).length, width)
        ? "columns"
        : "flow";
  const inline = layout === "inline";
  return (
    <div ref={ref} className="flex min-w-0 flex-col gap-3">
      {layout === "columns" && <MapDrawing edges={edges} />}
      {/* One edge reads in a line at its content's width: node → relationship · type → node. */}
      <ul
        aria-label={label}
        data-map={inline ? "inline" : undefined}
        className={cx("flex min-w-0 flex-col gap-3", layout === "columns" && "sr-only")}
      >
        {nodes.map(([node, name]) => (
          <li
            key={node}
            className={cx(
              "flex min-w-0",
              inline
                ? "w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1.5"
                : "flex-col gap-1.5",
            )}
          >
            <h4 className={NODE}>{name}</h4>
            <ul className={cx("flex min-w-0", inline ? "flex-wrap" : "flex-col gap-1.5")}>
              {edges
                .filter((edge) => nodeOf(edge) === node)
                .map((edge) =>
                  inline ? (
                    <li
                      key={edge.line}
                      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5"
                    >
                      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-small text-text-secondary">
                        <span aria-hidden="true">→</span>
                        {edge.relationship && (
                          <span className="wrap-anywhere">{edge.relationship}</span>
                        )}
                        {edge.relationship && edge.type && <span aria-hidden="true">·</span>}
                        {edge.type && <span className={EDGE_TYPE}>{edge.type}</span>}
                        <span aria-hidden="true">→</span>
                      </span>
                      <span className={NODE}>{edge.to}</span>
                    </li>
                  ) : (
                    <li key={edge.line} className="flex min-w-0 flex-col gap-1.5 pl-3">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-l border-connector pl-3 text-small text-text-secondary">
                        <span aria-hidden="true">↓</span>
                        <EdgeWords edge={edge} />
                      </span>
                      <span className={NODE}>{edge.to}</span>
                    </li>
                  ),
                )}
            </ul>
          </li>
        ))}
      </ul>
      {gaps.length > 0 && (
        <ul aria-label={`${label}: rows not drawn`} className="flex flex-col gap-1.5">
          {gaps.map((gap) => (
            <li key={gap.line} className="flex items-start justify-between gap-2">
              <span className="text-caption wrap-anywhere text-gap-text">{`Row not drawn: ${gap.reason}`}</span>
              {href && <Trace href={href(gap.line)} name={`${label}, row not drawn`} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The table form of a node map. */
export function edgeTable(edges: readonly Edge[], href?: (line: number) => string): LeadTable {
  return {
    head: ["From", "Relationship", "Edge type", "To"],
    rows: edges.map((edge) => ({
      label: edge.from || "Not stated",
      cells: [edge.relationship || null, edge.type || null, edge.to || null],
      end: href ? <Trace href={href(edge.line)} name={`${edge.from} to ${edge.to}`} /> : undefined,
    })),
    endHeading: href ? "Source" : undefined,
  };
}

export type DatedItem = Pick<LaneEvent, "date" | "precision" | "event" | "status" | "line"> &
  Partial<Pick<LaneEvent, "published" | "relevance">>;

const DAY_TEXT = /^\d{4}-\d{2}-\d{2}$/;

/** A publication date as the row states it: a date, a stated gap, or nothing for a dash. */
function Published({ text = "" }: { text?: string }) {
  const gap = statedGap(text);
  if (gap) return <>{` · Publication date not supplied — ${gap.reason}`}</>;
  const shown = text.trim();
  if (!shown || /^[—–-]$/.test(shown)) return null;
  return (
    <>
      {" · "}
      <span className={DAY_TEXT.test(shown) ? "whitespace-nowrap" : undefined}>
        {`Published ${shown}`}
      </span>
    </>
  );
}

/** How many dated rows a lane shows before the rest go behind a disclosure. */
const FOLD_AFTER = 3;

/** The row grid: its number, its date (never broken), its text. */
// In a narrow column the text goes under the date, so a long caption never pushes past the tile.
const DATED_ROW =
  "grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 gap-y-1 @[24rem]:grid-cols-[1.25rem_6.5rem_minmax(0,1fr)]";

/**
 * Dated events, earliest first and numbered, each date at the precision the module states, with
 * its status, publication date and credit relevance; `unplaced`, the rows of the table the page
 * could not place by date, listed as written with their traces. `rowId(index)` names the row of
 * `events[index]`, so an axis mark can point at it.
 */
export function DatedList({
  label,
  events,
  unplaced = [],
  href,
  rowId,
}: {
  label: string;
  events: readonly DatedItem[];
  unplaced?: readonly UnplacedEvent[];
  href?: (line: number) => string;
  rowId?: (index: number) => string;
}) {
  const total = events.length + unplaced.length;
  // A long lane shows its first dated rows and keeps the rest one click away, so a P3 list does
  // not outgrow the figures above it.
  const folded = events.length > FOLD_AFTER + 1;
  const first = folded ? events.slice(0, FOLD_AFTER) : events;
  const rest = folded ? events.slice(FOLD_AFTER) : [];
  const row = (item: DatedItem, index: number) => {
    const cut = item.status.indexOf(" — ");
    const kind = cut < 0 ? item.status : item.status.slice(0, cut);
    const detail = cut < 0 ? "" : item.status.slice(cut + 3);
    return (
      <li
        key={item.line}
        id={rowId?.(index)}
        tabIndex={rowId ? -1 : undefined}
        className={cx(
          DATED_ROW,
          "rounded-ds-xs border-t border-border-hairline py-2.5 first:border-t-0",
          FOCUS,
        )}
      >
        <span data-number className="font-mono text-small text-text-tertiary tabular-nums">
          {index + 1}
        </span>
        <span className="font-mono text-small whitespace-nowrap text-text-primary tabular-nums">
          {item.date}
        </span>
        <span className="col-start-2 flex min-w-0 flex-col gap-0.5 @[24rem]:col-start-3">
          <span className="flex items-start justify-between gap-2 text-small wrap-anywhere text-text-primary">
            {item.event}
            {href && <Trace href={href(item.line)} name={item.event} />}
          </span>
          <span className="text-caption text-text-tertiary">
            <span>{kind}</span>
            {detail ? ` · ${detail}` : ""}
            <Published text={item.published} />
          </span>
          {item.relevance && (
            <span className="text-caption wrap-anywhere text-text-secondary">{item.relevance}</span>
          )}
        </span>
      </li>
    );
  };
  return (
    <div className="@container flex max-w-3xl min-w-0 flex-col gap-2">
      {first.length > 0 && (
        <ol aria-label={label} className="flex flex-col">
          {first.map((item, at) => row(item, at))}
        </ol>
      )}
      {rest.length > 0 && (
        <details className="group min-w-0 border-t border-border-hairline">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-ds-xs text-small font-medium text-text-link outline-focus-ring focus-visible:outline-2 sm:min-h-8">
            {`Show the other ${String(rest.length)} dated rows`}
          </summary>
          <ol aria-label={`${label}, the other dated rows`} className="flex flex-col">
            {rest.map((item, at) => row(item, at + FOLD_AFTER))}
          </ol>
        </details>
      )}
      {unplaced.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1 border-t border-border-hairline pt-2">
          <p className="text-caption text-text-secondary">
            {`This page could not place ${String(unplaced.length)} of the ${String(total)} dated rows:`}
          </p>
          <ul aria-label={`${label}, rows not placed by date`} className="flex flex-col">
            {unplaced.map((item) => (
              <li
                key={item.line}
                className="grid grid-cols-1 gap-1 py-1.5 @[24rem]:grid-cols-[6.5rem_minmax(0,1fr)] @[24rem]:gap-3"
              >
                <span className="font-mono text-small break-words text-gap-text">{item.date}</span>
                <span className="flex items-start justify-between gap-2 text-small wrap-anywhere text-text-primary">
                  {item.event}
                  {href && <Trace href={href(item.line)} name={item.event} />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** A module-written passage, paragraph by paragraph, each with its trace. */
export function Prose({
  label,
  paragraphs,
  href,
  className,
}: {
  label: string;
  paragraphs: readonly Paragraph[];
  href?: (line: number) => string;
  className?: string;
}) {
  return (
    <Well className={cx("flex flex-col gap-3", className)}>
      {paragraphs.map((paragraph, at) => (
        <div key={paragraph.line} className="flex items-start justify-between gap-3">
          <p
            className={cx(
              "min-w-0 text-small wrap-anywhere",
              paragraph.text === null ? "text-gap-text" : "text-text-primary",
            )}
          >
            {paragraph.text ?? "This paragraph cites its sources by name; it is in Evidence."}
          </p>
          {href && (
            <Trace href={href(paragraph.line)} name={`${label}, paragraph ${String(at + 1)}`} />
          )}
        </div>
      ))}
    </Well>
  );
}

/** The fewest placed events drawn on a time axis, and the least tile width the axis is drawn in. */
const AXIS_FROM = 3;
const AXIS_MIN_PX = 720;

/** Focus a row an axis mark names, opening the folded rows when it is among them. */
function focusRow(id: string) {
  const row = document.getElementById(id);
  const fold = row?.closest("details");
  if (fold && !fold.open) fold.open = true;
  row?.focus();
}

/**
 * A ready lane: from three placed events, in a tile wide enough for it, the Calendar's event axis
 * above the numbered list, each mark pointing at its row; otherwise the list only (a narrower axis
 * would repeat the list down the page).
 */
function LaneFigure({
  label,
  lane,
  href,
  asOf,
}: {
  label: string;
  lane: Extract<Lane, { state: "ready" }>;
  href: (line?: number) => string;
  asOf: string | null;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const prefix = useId();
  const rowId = (index: number) => `${prefix}-row-${String(index)}`;
  const axis = lane.events.length >= AXIS_FROM && width !== null && width >= AXIS_MIN_PX;
  return (
    <div ref={ref} className="flex min-w-0 flex-col gap-4">
      {axis && (
        <EventAxis
          events={lane.events.map((event, index) => ({ ...event, index, source: "" }))}
          asOf={axisAsOf(asOf)}
          rowId={rowId}
          onSelect={(index) => {
            focusRow(rowId(index));
          }}
        />
      )}
      <DatedList
        label={label}
        events={lane.events}
        unplaced={lane.unplaced}
        href={href}
        rowId={rowId}
      />
    </div>
  );
}

/**
 * One of the module's dated lanes as a tile: its events, the lane's stated gap, or, when the
 * handoff has no such lane, `absent` in words (nothing when no words are given). `asOf` is the
 * run's as-of date, drawn on the event axis.
 */
export function LaneTile({
  lane,
  span,
  label,
  title,
  href,
  absent,
  asOf = null,
}: {
  lane: Lane | null;
  span: Span;
  label: string;
  title: ReactNode;
  href: (line?: number) => string;
  absent?: string;
  asOf?: string | null;
}) {
  if (!lane)
    return absent ? <LeadGap span={span} label={label} title={title} reason={absent} /> : null;
  const trace = <Trace href={href(lane.line)} name={label} />;
  if (lane.state === "gap")
    return <LeadGap span={span} label={label} title={title} reason={lane.reason} trace={trace} />;
  return (
    <LeadFigure
      span={span}
      label={label}
      title={title}
      trace={trace}
      figure={<LaneFigure label={label} lane={lane} href={href} asOf={asOf} />}
    />
  );
}

/** Whether a lane holds enough placed events for its event axis. */
export const laneHasAxis = (lane: Lane | null) =>
  lane?.state === "ready" && lane.events.length >= AXIS_FROM;

/**
 * One of the module's node maps as a tile: its stated edges with any gap rows marked, the map's
 * stated gap, or, when the handoff has no such map, `absent` in words.
 */
export function MapTile({
  map,
  span,
  label,
  kicker,
  title,
  href,
  absent,
}: {
  map: MapRead;
  span: Span;
  label: string;
  kicker?: ReactNode;
  title: ReactNode;
  href: (line?: number) => string;
  absent: string;
}) {
  if (map.state === "absent")
    return <LeadGap span={span} label={label} kicker={kicker} title={title} reason={absent} />;
  if (map.state === "gap")
    return (
      <LeadGap
        span={span}
        label={label}
        kicker={kicker}
        title={title}
        reason={map.reason}
        trace={map.line === undefined ? undefined : <Trace href={href(map.line)} name={label} />}
      />
    );
  return (
    <LeadFigure
      span={span}
      label={label}
      kicker={kicker}
      title={title}
      trace={<Trace href={href(map.line)} name={label} />}
      figure={<NodeList label={label} edges={map.edges} gaps={map.gaps} href={href} />}
      table={edgeTable(map.edges, href)}
    />
  );
}
