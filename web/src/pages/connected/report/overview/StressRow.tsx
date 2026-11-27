import { Fragment } from "react";
import {
  FORECAST_INPUTS,
  evidencePath,
  withUnit,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { figureSource, moduleSource, type FigureSource } from "./figureData";
import { FigureGap, FigureSourceControl, GapPattern, Key } from "./figureParts";
import { FigureTile } from "./figureTile";
import {
  NoteText,
  ReasonNotes,
  basisNoteList,
  figureText,
  cellReading as stressReading,
  cellWord,
  gapText,
  gapWord,
  labelText,
  plainNotes,
  readerCell,
  type Note,
  type NoteHref,
} from "./notes";
import {
  BULLET,
  PATH,
  bulletGeometry,
  downsidePanels,
  stressLabel,
  forwardPath,
  headroomTests,
  pathGeometry,
  type DownsidePanel,
  type HeadroomTest,
} from "./stressData";
import { categoryAt } from "./category";
import {
  DOWNSIDE,
  NAME_INDENT,
  gapPlace,
  perRow,
  rowLayout,
  type PanelLayout,
} from "./downsideLayout";
import { TEXT, inside, thinTicks } from "./chartText";
import { pathLayout } from "./pathLayout";
import { Figure } from "./Tile";
import { entryLine } from "./traceLine";
import { useFrameWidth } from "./useFrameWidth";

type RowProps = { snapshot: Snapshot; run: PublishedRun; view: ReportView };
type Ready = Extract<FigureSource, { state: "ready" }>;

const shown = (test: HeadroomTest, cell: HeadroomTest["current"]) =>
  cell.value === null ? gapWord(cell.text) : withUnit(figureText(cell.text), test.unit);

/** The bullet's marks across `width` pixels, from the test's shares of its scale. */
function bulletMarks(test: HeadroomTest, width: number) {
  const geometry = bulletGeometry(test);
  if (!geometry) return null;
  const x = (share: number) => BULLET.left + share * (width - 2 * BULLET.left);
  const { share } = geometry;
  const ticks = geometry.ticks.map((tick) => {
    const value = Number(tick.label.replaceAll(",", ""));
    return {
      label: withUnit(tick.label, test.unit),
      x: x((tick.x - BULLET.left) / (BULLET.right - BULLET.left)),
      value,
    };
  });
  return {
    current: x(share.current),
    threshold: x(share.threshold),
    ticks: thinTicks(ticks, width),
  };
}

function BulletChart({ test }: { test: HeadroomTest }) {
  const { frame, measured } = useFrameWidth();
  const width = measured === null || measured <= 0 ? BULLET.width : Math.round(measured);
  const marks = bulletMarks(test, width);
  if (!marks) return null;
  const { current, threshold } = marks;
  const low = Math.min(current, threshold);
  const high = Math.max(current, threshold);
  const value = shown(test, test.current);
  const headroom = test.headroom ? `${test.headroom} headroom` : null;
  const limit = shown(test, test.threshold);
  return (
    <div ref={frame} className="min-w-0">
      <svg
        viewBox={`0 0 ${String(width)} 100`}
        width="100%"
        role="img"
        aria-label={`${test.label}: ${value} against a threshold of ${limit}${test.headroom ? `, headroom ${test.headroom}` : ""}.`}
      >
        {headroom && (
          <>
            <text
              x={inside((low + high) / 2, headroom, width, "body")}
              y="16"
              textAnchor="middle"
              fontSize={TEXT}
              className="fill-text-secondary font-body"
            >
              {headroom}
            </text>
            <path
              d={`M${String(low)} 30V23H${String(high)}V30`}
              fill="none"
              className="stroke-text-tertiary"
            />
          </>
        )}
        <rect
          x={BULLET.left}
          y="34"
          width={width - 2 * BULLET.left}
          height="20"
          rx="4"
          className="fill-border-hairline"
        />
        <line
          data-threshold
          x1={threshold}
          y1="34"
          x2={threshold}
          y2="54"
          strokeWidth="2"
          className="stroke-text-tertiary"
        />
        <circle
          data-current
          cx={current}
          cy="44"
          r="5"
          className="fill-surface-subtle stroke-text-primary"
          strokeWidth="2"
        />
        <text
          x={inside(current, value, width)}
          y="69"
          textAnchor="middle"
          fontSize={TEXT}
          className="fill-text-primary font-mono font-medium"
        >
          {value}
        </text>
        <text
          x={inside(threshold, limit, width)}
          y="84"
          textAnchor="middle"
          fontSize={TEXT}
          className="fill-text-primary font-mono font-medium"
        >
          {limit}
        </text>
        <g data-axis>
          {marks.ticks.map((tick, at) => (
            <text
              key={at}
              x={tick.x}
              y="95"
              textAnchor="middle"
              fontSize={TEXT}
              className="fill-text-tertiary font-mono"
            >
              {tick.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

/** The cell a test has no figure for, the current value first. */
const gapCell = (test: HeadroomTest) =>
  test.current.value === null ? test.current : test.threshold;

/** Why a test has no marks: the handoff's reason, or its cell as written when that is all it says. */
function TestGap({ test, href }: { test: HeadroomTest; href: NoteHref }) {
  const cell = gapCell(test);
  const text = gapText(cell);
  if (text === null) return null;
  return (
    <span className="text-caption font-normal text-text-secondary">
      <NoteText note={{ text, line: test.line }} href={href} />
    </span>
  );
}

/** A further test in one line: its current and threshold marks, or the gap the handoff states. */
function TestRow({ test, href }: { test: HeadroomTest; href: NoteHref }) {
  const geometry = bulletGeometry(test);
  return (
    <li className="flex flex-col gap-1.5 border-t border-border-hairline pt-3">
      <span className="flex items-baseline justify-between gap-3 text-small">
        <span className="text-text-primary">{test.label}</span>
        {geometry ? (
          <Figure className="text-small">
            {shown(test, test.current)}
            <span className="text-text-tertiary"> / {shown(test, test.threshold)}</span>
          </Figure>
        ) : (
          <span className="rounded-ds-xs border border-dashed border-border-gap px-1.5 text-caption font-normal text-gap-text">
            {gapWord(gapCell(test).text)}
          </span>
        )}
      </span>
      {geometry ? (
        <span aria-hidden="true" className="relative block h-2 rounded-ds-full bg-surface-subtle">
          <span
            data-threshold
            className="absolute -inset-y-1 w-0.5 bg-text-primary"
            style={{ left: `${String(geometry.share.threshold * 100)}%` }}
          />
          <span
            data-current
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-text-primary bg-surface-subtle"
            style={{ left: `${String(geometry.share.current * 100)}%` }}
          />
        </span>
      ) : (
        <TestGap test={test} href={href} />
      )}
      {test.direction.trim() && (
        <span className="text-caption font-normal text-text-tertiary">
          <NoteText note={{ text: test.direction, line: test.line }} href={href} />
        </span>
      )}
    </li>
  );
}

/** The lead test in words: its value against its threshold, then its direction as the module
 * wrote it, or a link to it where it cites a source. */
function LeadSentence({ test, href }: { test: HeadroomTest; href: NoteHref }) {
  const direction = test.direction.trim();
  const words = direction ? readerCell(direction) : "";
  const figures = `${shown(test, test.current)} against a threshold of ${shown(test, test.threshold)}`;
  return (
    <span className="text-small text-text-secondary">
      {words === null ? (
        <>
          {`${figures}. `}
          <NoteText note={{ text: direction, line: test.line }} href={href} />
        </>
      ) : (
        `${figures}${words ? `. ${words}${/[.!?]$/.test(words) ? "" : "."}` : "."}`
      )}
    </span>
  );
}

function Headroom({ source, href }: { source: Ready; href: NoteHref }) {
  const tests = headroomTests(source.table, source.descriptor);
  const lead = tests?.find((test) => bulletGeometry(test) !== null);
  if (!tests || !lead)
    return <FigureGap reason="The covenant table states no test with both a level and a value." />;
  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Figure className="text-h1">{lead.headroom ?? shown(lead, lead.current)}</Figure>
          <span className="text-small text-text-secondary">
            {lead.headroom ? `headroom, ${lead.label}` : lead.label}
          </span>
        </div>
        <LeadSentence test={lead} href={href} />
      </div>
      <BulletChart test={lead} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Key tone="primary">Current</Key>
        <span className="flex items-center gap-1.5 text-caption font-normal text-text-secondary">
          <span aria-hidden="true" className="h-2.5 w-0.5 bg-text-primary" />
          Threshold
        </span>
      </div>
      {tests.length > 1 && (
        <ul className="flex flex-col gap-3">
          {/* Labels can repeat, so a test's place is its key. */}
          {tests.map((test, at) =>
            test === lead ? null : <TestRow key={at} test={test} href={href} />,
          )}
        </ul>
      )}
      <ReasonNotes notes={basisNoteList(source.table)} href={href} />
    </>
  );
}

type Downside = NonNullable<ReturnType<typeof downsidePanels>>;

const cellReading = (cell: DownsidePanel["cells"][number] | undefined) =>
  !cell ? "" : cell.value === null ? stressReading(cell) : figureText(cell.text);

function downsideReading(cases: Downside["cases"], panels: DownsidePanel[]) {
  return cases
    .map(
      (item, at) =>
        `${item.name}: ${panels.map((panel) => `${panel.measure} ${cellReading(panel.cells[at])}`).join(", ")}`,
    )
    .join(". ");
}

/** The notes under the downside figure: the cases' assumptions, then why a case has no figure. */
function downsideNotes(data: Downside): Note[] {
  const gaps = data.panels.flatMap((panel) =>
    panel.cells.flatMap((cell, at) => {
      const text = cell.value === null ? gapText(cell) : null;
      return text === null
        ? []
        : [
            {
              lead: `${data.cases[at]?.name ?? ""}, ${panel.measure}: `,
              text,
              line: panel.line,
              end: ".",
            },
          ];
    }),
  );
  // A cell the module qualifies in words is labelled with its multiple; the whole cell is the note.
  const qualified = data.panels.flatMap((panel) =>
    panel.cells.flatMap((cell, at) =>
      cell.value !== null && stressLabel(cell.text) !== cell.text
        ? [
            {
              lead: `${data.cases[at]?.name ?? ""}, ${panel.measure}: `,
              text: cell.text,
              line: panel.line,
              end: ".",
            },
          ]
        : [],
    ),
  );
  return [...plainNotes(data.assumptions), ...gaps, ...qualified];
}

/** Lines of 12 px text from a first baseline, one line apart, each at `x`. */
function Lines({
  lines,
  x,
  y,
  className,
  anchor,
}: {
  lines: readonly string[];
  x: number;
  y: number;
  className: string;
  anchor?: "start" | "end";
}) {
  return (
    <text x={x} y={y} fontSize={TEXT} textAnchor={anchor} className={className}>
      {lines.map((line, at) => (
        <tspan key={at} x={x} dy={at === 0 ? 0 : DOWNSIDE.line}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** The first baseline that centres `count` lines on `middle`. */
const firstBaseline = (middle: number, count: number) =>
  middle + 4 - ((count - 1) * DOWNSIDE.line) / 2;

function PanelGap({
  x,
  y,
  word,
  layout,
}: {
  x: number;
  y: number;
  word: string;
  layout: PanelLayout;
}) {
  const place = gapPlace(word, layout.zero, layout.room);
  return (
    <>
      <rect
        data-gap
        x={x + place.mark + 0.5}
        y={y - 5.5}
        width="27"
        height="11"
        rx="2"
        fill="url(#downside-gap)"
        strokeDasharray="3 3"
        className="stroke-border-gap"
      />
      <Lines
        lines={place.lines}
        x={x + place.x}
        y={firstBaseline(y, place.lines.length)}
        anchor={place.side === "left" ? "end" : undefined}
        className="fill-gap-text font-body"
      />
    </>
  );
}

function PanelAxis({ layout, bottom }: { layout: PanelLayout & { x: number }; bottom: number }) {
  const { x } = layout;
  return (
    <g data-axis>
      <line x1={x} y1={bottom} x2={x + layout.bars} y2={bottom} className="stroke-connector" />
      {layout.axis.map((tick, at) => (
        <text
          key={at}
          x={x + tick.x}
          y={bottom + 16}
          textAnchor="middle"
          fontSize={TEXT}
          className="fill-text-tertiary font-mono"
        >
          {tick.label}
        </text>
      ))}
    </g>
  );
}

function PanelBars({
  layout,
  head,
  row: height,
  colours,
}: {
  layout: PanelLayout & { x: number };
  head: number;
  row: number;
  colours: readonly string[];
}) {
  const { x, panel, zero, at } = layout;
  const bottom = head + panel.cells.length * height;
  return (
    <g data-panel={panel.measure}>
      <Lines lines={layout.head} x={x} y={14} className="fill-text-tertiary font-body" />
      <PanelAxis layout={layout} bottom={bottom} />
      <line x1={x + zero} y1={head} x2={x + zero} y2={bottom} className="stroke-connector" />
      {panel.cells.map((cell, row) => {
        const middle = head + row * height + height / 2;
        if (cell.value === null)
          return <PanelGap key={row} x={x} y={middle} word={cellWord(cell)} layout={layout} />;
        const end = at(cell.value);
        const lines = layout.values[row] ?? [];
        return (
          <Fragment key={row}>
            <rect
              data-bar={cell.text}
              x={x + Math.min(zero, end)}
              y={middle - DOWNSIDE.bar / 2}
              width={Math.max(1, Math.abs(end - zero))}
              height={DOWNSIDE.bar}
              rx="2"
              style={{ fill: colours[row] }}
            />
            <Lines
              lines={lines}
              x={x + Math.max(zero, end) + 6}
              y={firstBaseline(middle, lines.length)}
              className="fill-text-primary font-mono"
            />
          </Fragment>
        );
      })}
    </g>
  );
}

/** One row of panels, drawn at the frame's own width so it fits and never scrolls. */
function PanelRow({
  cases,
  panels,
  width,
}: {
  cases: Downside["cases"];
  panels: DownsidePanel[];
  width: number;
}) {
  const layout = rowLayout(
    cases.map((item) => item.name),
    panels,
    width,
  );
  // One colour a case, in the stated case order, the same in every panel (ruling R2).
  const colours = cases.map((_, at) => categoryAt(at));
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
      width="100%"
      role="img"
      aria-label={`Downside scenarios. ${downsideReading(cases, panels)}.`}
    >
      <defs>
        <GapPattern id="downside-gap" />
      </defs>
      {cases.map((item, row) => {
        const lines = layout.nameLines[row] ?? [];
        const middle = layout.head + row * layout.row + layout.row / 2;
        return (
          <Fragment key={item.id}>
            <rect
              data-swatch={item.name}
              x="0"
              y={middle - DOWNSIDE.swatch / 2}
              width={DOWNSIDE.swatch}
              height={DOWNSIDE.swatch}
              rx="2"
              style={{ fill: colours[row] }}
            />
            <Lines
              lines={lines}
              x={NAME_INDENT}
              y={firstBaseline(middle, lines.length)}
              className={
                item.control ? "fill-text-secondary font-body" : "fill-text-primary font-body"
              }
            />
          </Fragment>
        );
      })}
      {layout.panels.map((panel, at) => (
        <PanelBars key={at} layout={panel} head={layout.head} row={layout.row} colours={colours} />
      ))}
    </svg>
  );
}

function Downside({ data, href }: { data: Downside | null; href: NoteHref }) {
  const { frame, measured } = useFrameWidth();
  if (!data)
    return <FigureGap reason="The downside module states no stressed metric that can be drawn." />;
  const width = measured === null || measured <= 0 ? DOWNSIDE.width : Math.round(measured);
  const step = perRow(width);
  const rows = Array.from({ length: Math.ceil(data.panels.length / step) }, (_, at) =>
    data.panels.slice(at * step, at * step + step),
  );
  return (
    <>
      <div ref={frame} className="flex min-w-0 flex-col gap-4">
        {rows.map((panels, at) => (
          <PanelRow key={at} cases={data.cases} panels={panels} width={width} />
        ))}
      </div>
      <ReasonNotes notes={downsideNotes(data)} href={href} />
    </>
  );
}

type Path = NonNullable<ReturnType<typeof forwardPath>>;

function PathChart({ path }: { path: Path }) {
  const { frame, measured } = useFrameWidth();
  const width = measured === null || measured <= 0 ? PATH.width : Math.round(measured);
  const geometry = pathLayout(pathGeometry(path.cases), width);
  const [base = [], ...others] = geometry.lines;
  const missing = geometry.periods.filter(({ period }) =>
    base.some((point) => point.period === period && point.y === null),
  );
  const segments = (line: typeof base) =>
    line.flatMap((point, at) => {
      const next = line[at + 1];
      return point.y !== null && next?.y != null
        ? [{ x1: point.x, y1: point.y, x2: next.x, y2: next.y, key: point.period }]
        : [];
    });
  const reading = path.cases
    .map(
      ({ group, points }) =>
        `${group}: ${points.map((point) => `${point.period} ${point.value === null ? "no figure" : point.display}`).join(", ")}`,
    )
    .join(". ");
  return (
    <div ref={frame} className="min-w-0">
      <svg
        viewBox={`0 0 ${String(width)} ${String(PATH.height)}`}
        width="100%"
        role="img"
        aria-label={`${path.measure}. ${reading}.`}
      >
        <defs>
          <GapPattern id="path-gap" />
        </defs>
        <g data-axis-y>
          {geometry.ticks.map((tick) => (
            <Fragment key={tick.label}>
              <line
                x1={geometry.left}
                y1={tick.y}
                x2={width}
                y2={tick.y}
                className="stroke-border-hairline"
              />
              <text x="0" y={tick.y + 4} fontSize={TEXT} className="fill-text-tertiary font-mono">
                {tick.label}x
              </text>
            </Fragment>
          ))}
        </g>
        {missing.map(({ period, x }) => (
          <rect
            key={period}
            data-gap={period}
            x={x - 17.5}
            y={PATH.top - 6}
            width="35"
            height={PATH.base - PATH.top + 12}
            rx="4"
            fill="url(#path-gap)"
            strokeDasharray="3 3"
            className="stroke-border-gap"
          />
        ))}
        {others.flatMap((line, at) =>
          segments(line).map((segment) => (
            <line
              key={`${String(at)}-${segment.key}`}
              data-case-line
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              strokeWidth="2"
              strokeDasharray="4 3"
              className="stroke-chart-2"
            />
          )),
        )}
        {others.flatMap((line, at) =>
          line.flatMap((point) =>
            point.y === null
              ? []
              : [
                  <circle
                    key={`${String(at)}-${point.period}`}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    strokeWidth="2"
                    className="fill-surface-card stroke-chart-2"
                  />,
                ],
          ),
        )}
        {segments(base).map((segment) => (
          <line
            key={segment.key}
            data-base-line
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            strokeWidth="2"
            className="stroke-chart-1"
          />
        ))}
        {base.flatMap((point) =>
          point.y === null
            ? []
            : [
                <Fragment key={point.period}>
                  <circle
                    data-point={point.period}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    className="fill-chart-1"
                  />
                  {point.label === null ? null : (
                    <text
                      x={point.label}
                      y={point.y + 20}
                      textAnchor="middle"
                      fontSize={TEXT}
                      className="fill-text-primary font-mono"
                    >
                      {point.display}
                    </text>
                  )}
                </Fragment>,
              ],
        )}
        {geometry.periods.map(({ period, label }) =>
          label === null ? null : (
            <text
              key={period}
              x={label}
              y={PATH.height - 10}
              textAnchor="middle"
              fontSize={TEXT}
              className="fill-text-tertiary font-body"
            >
              {period}
            </text>
          ),
        )}
      </svg>
    </div>
  );
}

/** The headline: the base case's last figure, named by its case; or why there is none. */
function PathHeadline({ path }: { path: Path }) {
  const base = path.based ? path.cases[0] : undefined;
  const last = [...(base?.points ?? [])].reverse().find((point) => point.value !== null);
  if (!base || !last)
    return path.unbased ? (
      <span className="text-small text-text-secondary">{path.unbased}</span>
    ) : null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      {/* A supporting figure: two steps under the headline figures, three under the call. */}
      <Figure className="text-h2">{last.display}</Figure>
      <span className="text-small text-text-secondary">
        {base.group}, by {last.period}
      </span>
    </div>
  );
}

function ForwardPath({ path, href }: { path: Path; href: NoteHref }) {
  const [first, ...others] = path.cases;
  const gaps = (first?.points ?? [])
    .filter((point) => point.value === null)
    .map((point) => ({
      lead: `${point.period}: `,
      text: point.reason || "no figure in the model",
      end: ".",
    }));
  // A later case with no figure at all draws nothing: its key is named, so its reasons are said here.
  const unplotted = others.flatMap(({ group, points }) =>
    points.some((point) => point.value !== null)
      ? []
      : [...new Set(points.map((point) => point.reason || "no figure in the model"))].map(
          (reason) => ({ lead: `${group}: no figure, `, text: reason, end: "." }),
        ),
  );
  return (
    <>
      <PathHeadline path={path} />
      <PathChart path={path} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {first && <Key tone="primary">{first.group}</Key>}
        {others.map(({ group }) => (
          <Key key={group} tone="secondaryOpen">
            {group}
          </Key>
        ))}
      </div>
      <ReasonNotes notes={[...gaps, ...unplotted, ...plainNotes(path.limits)]} href={href} />
    </>
  );
}

/** The path as the tile draws it: the measure and each case's name through the reader rule. */
const readerPath = (path: Path): Path => ({
  ...path,
  measure: labelText(path.measure, "A measure"),
  cases: path.cases.map((item) => ({ ...item, group: labelText(item.group, "A case") })),
});

function forwardSource(view: ReportView) {
  const model = view.models[0];
  if (!model) return { reason: "No forecast model was published for this run." };
  const path = forwardPath(model);
  return path
    ? { path: readerPath(path) }
    : { reason: "The published model states no net leverage by period." };
}

/** Where a tile's reasons are read in Evidence: the handoff line, or the tile's own; none when
 * the module did not run. */
const hrefOf =
  (folder: string, entry: OutputEntry | undefined, fallback?: number): NoteHref =>
  (line) =>
    entry && evidencePath(folder, entry, line ?? fallback);

/** The downside tile's data. The tile draws no covenant limit and says nothing about one. */
function downsideSource(view: ReportView) {
  const source = moduleSource(view, "CP-2A", "Downside");
  const data = source.entry && !source.reason ? downsidePanels(source.entry) : null;
  return { ...source, data, line: data?.line ?? entryLine(source.entry) };
}

/** Row 5, stress: room to the covenant levels, the downside cases, and where leverage goes. */
export function StressRow({ run, view }: RowProps) {
  const headroom = figureSource(view, "CP-4", "Covenant headroom", "Legal & covenants");
  const downside = downsideSource(view);
  const forward = forwardSource(view);
  const model = moduleSource(view, "CP-2G", "Forward credit model");
  const headroomLine = headroom.state === "ready" ? headroom.table.line : entryLine(headroom.entry);
  return (
    <>
      <FigureTile
        fit
        span={4}
        title="Covenant headroom"
        basis="Each test against its threshold"
        trace={
          <FigureSourceControl
            folder={run.folder}
            entry={headroom.entry}
            line={headroomLine}
            name="covenant headroom"
          />
        }
      >
        {headroom.state === "ready" ? (
          <Headroom source={headroom} href={hrefOf(run.folder, headroom.entry, headroomLine)} />
        ) : (
          <FigureGap reason={headroom.reason} />
        )}
      </FigureTile>
      <FigureTile
        fit
        span={5}
        title="Downside scenarios"
        basis="Each stressed metric by case, from zero"
        trace={
          <FigureSourceControl
            folder={run.folder}
            entry={downside.entry}
            line={downside.line}
            name="the downside scenarios"
          />
        }
      >
        {downside.entry && !downside.reason ? (
          <Downside data={downside.data} href={hrefOf(run.folder, downside.entry, downside.line)} />
        ) : (
          <FigureGap reason={downside.reason ?? ""} />
        )}
      </FigureTile>
      <FigureTile
        fit
        span={3}
        title="Forward path"
        basis={forward.path?.measure ?? "Net leverage by forecast period"}
        trace={
          <FigureSourceControl
            folder={run.folder}
            entry={model.entry}
            line={entryLine(model.entry, FORECAST_INPUTS)}
            name="the forward path"
          />
        }
      >
        {forward.path ? (
          <ForwardPath path={forward.path} href={hrefOf(run.folder, model.entry)} />
        ) : (
          <FigureGap reason={forward.reason} />
        )}
      </FigureTile>
    </>
  );
}
