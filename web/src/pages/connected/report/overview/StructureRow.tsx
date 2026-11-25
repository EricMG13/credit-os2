import { evidencePath, unitLabel, type PublishedRun, type Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { figureSource, unitOf, type Cell, type FigureSource } from "./figureData";
import { FigureGap, FigureSourceControl, GapPattern, Key } from "./figureParts";
import {
  NoteText,
  ReasonNotes,
  gapReading,
  gapWord,
  basisNoteList,
  figureText,
  gapText,
  type Note,
  type NoteHref,
} from "./notes";
import {
  STACK,
  STACK_LABEL,
  WALL,
  multiple,
  stackGeometry,
  stackRows,
  wallGeometry,
  wallWidth,
  wallSlots,
  type StackRow,
} from "./structureData";
import { TEXT, wrapText } from "./chartText";
import { FigureTile } from "./figureTile";
import { Figure } from "./Tile";
import { entryLine } from "./traceLine";
import { scrollRegion, useFrameWidth } from "./useFrameWidth";

type RowProps = { snapshot: Snapshot; run: PublishedRun; view: ReportView };
type Ready = Extract<FigureSource, { state: "ready" }>;

const MATURITIES = "Debt maturities";
const DEBT_STACK = "Debt stack";

type WallMark = ReturnType<typeof wallGeometry>["marks"][number];

function WallMarkShape({ mark, bar }: { mark: WallMark; bar: number }) {
  const x = mark.centre - bar / 2;
  if (mark.height === null)
    return (
      <rect
        data-gap={mark.label}
        x={x + 0.5}
        y={WALL.base - WALL.gapMark}
        width={bar - 1}
        height={WALL.gapMark}
        rx="3"
        fill="url(#wall-gap)"
        strokeDasharray="3 3"
        className="stroke-border-gap"
      />
    );
  // A stated zero is a figure: a rule on the axis, never the gap mark.
  if (mark.height === 0)
    return (
      <line
        data-bar={mark.label}
        x1={x}
        y1={WALL.base - 1.5}
        x2={x + bar}
        y2={WALL.base - 1.5}
        strokeWidth="3"
        className="stroke-chart-1"
      />
    );
  return mark.undated ? (
    <rect
      data-bar={mark.label}
      x={x + 0.75}
      y={WALL.base - mark.height + 0.75}
      width={bar - 1.5}
      height={Math.max(0.5, mark.height - 0.75)}
      rx="2.5"
      fill="url(#wall-undated)"
      strokeWidth="1.5"
      className="stroke-chart-1"
    />
  ) : (
    <rect
      data-bar={mark.label}
      x={x}
      y={WALL.base - mark.height}
      width={bar}
      height={mark.height}
      rx={Math.min(3, mark.height / 2)}
      className="fill-chart-1"
    />
  );
}

/** What a mark with no figure says above it: the module's word, or that the year has no row. */
const LINE = 14;

/** Lines of 12 px text centred on `x`, the first baseline at `y`. */
function CentredLines({
  lines,
  x,
  y,
  className,
}: {
  lines: readonly string[];
  x: number;
  y: number;
  className: string;
}) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={TEXT} className={className}>
      {lines.map((line, at) => (
        <tspan key={at} x={x} dy={at === 0 ? 0 : LINE}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** What a mark with no figure says above it, in lines that fit its slot: the module's word, or
 * that the year has no row. */
function GapLabel({ mark, y, room }: { mark: WallMark; y: number; room: number }) {
  const said = mark.cell ? [gapWord(mark.cell.text)] : ["No row", "in the schedule"];
  const lines = said.flatMap((line) => wrapText(line, room));
  return (
    <CentredLines
      lines={lines}
      x={mark.centre}
      y={y - (lines.length - 1) * LINE}
      className="fill-gap-text font-body"
    />
  );
}

function WallLabels({ mark, room }: { mark: WallMark; room: number }) {
  const top = WALL.base - (mark.height ?? WALL.gapMark) - 10;
  return (
    <>
      {mark.height === null ? (
        <GapLabel mark={mark} y={top} room={room} />
      ) : (
        <text
          x={mark.centre}
          y={top}
          textAnchor="middle"
          fontSize="13"
          className="fill-text-primary font-mono"
        >
          {figureText(mark.cell?.text ?? "")}
        </text>
      )}
      <CentredLines
        lines={wrapText(mark.label, room)}
        x={mark.centre}
        y={WALL.base + 24}
        className="fill-text-secondary font-body"
      />
    </>
  );
}

function WallAxis({ breakAt, end }: { breakAt: number | null; end: number }) {
  if (breakAt === null)
    return <line x1="0" y1={WALL.base} x2={end} y2={WALL.base} className="stroke-connector" />;
  return (
    <>
      <line x1="0" y1={WALL.base} x2={breakAt - 6} y2={WALL.base} className="stroke-connector" />
      <line x1={breakAt + 6} y1={WALL.base} x2={end} y2={WALL.base} className="stroke-connector" />
      <path
        data-axis-break
        d={`M${String(breakAt - 9)} ${String(WALL.base + 8)} ${String(breakAt - 1)} ${String(WALL.base - 8)}M${String(breakAt + 1)} ${String(WALL.base + 8)} ${String(breakAt + 9)} ${String(WALL.base - 8)}`}
        strokeWidth="1.25"
        fill="none"
        className="stroke-text-tertiary"
      />
    </>
  );
}

/** A slot as the figure's reading says it: the same words its label draws. */
function slotReading(mark: WallMark) {
  if (mark.height !== null) return figureText(mark.cell?.text ?? "");
  return mark.cell ? gapReading(mark.cell.text) : "no row in the schedule";
}

function wallReading(marks: WallMark[], unit: string) {
  const parts = marks.map((mark) => `${mark.label} ${slotReading(mark)}`);
  return `Debt maturing by period${unit ? `, ${unit}` : ""}: ${parts.join(", ")}.`;
}

/** Why a slot has no figure: the handoff's reason, the cell as written, or that it has no row. */
function wallNote(mark: WallMark): Note {
  const text = mark.cell
    ? (mark.cell.reason ?? mark.cell.text)
    : "no row in the schedule for this year";
  return { lead: `${mark.label}: `, text, line: mark.line, end: "." };
}

/** The room one slot's labels have: the distance between neighbouring marks, less a margin. */
const slotRoom = (marks: WallMark[], width: number) =>
  (marks.length > 1
    ? Math.abs((marks[1]?.centre ?? 0) - (marks[0]?.centre ?? 0))
    : width - 2 * WALL.left) - 2;

function MaturityWall({ source, href }: { source: Ready; href: NoteHref }) {
  const { frame, measured } = useFrameWidth();
  const unit = unitOf(source.descriptor);
  const slots = wallSlots(source.table, source.descriptor, unit);
  if (!slots) return <FigureGap reason="The maturity schedule states no amount for any period." />;
  const width = wallWidth(measured, slots.dated.length + slots.undated.length);
  const scrolls = measured !== null && width > measured + 1;
  const { marks, bar, breakAt } = wallGeometry(slots.dated, slots.undated, width);
  const gaps = marks.filter((mark) => mark.height === null);
  const notes = [...gaps.map(wallNote), ...basisNoteList(source.table)];
  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Key tone="primary">Dated period</Key>
        {slots.undated.length > 0 && <Key tone="undated">After the axis break: no single year</Key>}
        {gaps.length > 0 && <Key tone="gap">No figure</Key>}
      </div>
      {/* When the periods need more room than a phone gives, the wall scrolls sideways in its tile. */}
      <div
        ref={frame}
        className="min-w-0 overflow-x-auto rounded-ds-sm outline-focus-ring focus-visible:outline-2"
        {...scrollRegion(scrolls, "Maturity wall figure, scrolls sideways")}
      >
        <svg
          viewBox={`0 0 ${String(width)} ${String(WALL.height)}`}
          width={scrolls ? width : "100%"}
          role="img"
          aria-label={wallReading(marks, unitLabel(unit))}
        >
          <defs>
            <pattern
              id="wall-undated"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" className="fill-surface-selected" />
              <line x1="0" y1="0" x2="0" y2="6" strokeWidth="2" className="stroke-chart-1" />
            </pattern>
            <GapPattern id="wall-gap" />
          </defs>
          {/* Labels repeat (two rows for one year), so a mark's place is its key. */}
          {marks.map((mark, at) => (
            <WallMarkShape key={at} mark={mark} bar={bar} />
          ))}
          <WallAxis breakAt={breakAt} end={width} />
          {marks.map((mark, at) => (
            <WallLabels key={at} mark={mark} room={slotRoom(marks, width)} />
          ))}
        </svg>
      </div>
      <ReasonNotes notes={notes} href={href} />
    </>
  );
}

const RANK_FILL = new Map<boolean | null, string>([
  [true, "fill-chart-1"],
  [false, "fill-chart-2"],
  [null, "fill-chart-3"],
]);

/** Why a cell has no figure: its gap word, then the module's words, or a link where they cite. */
function gapNote(cell: Cell, lead: string, line: number | undefined): Note {
  const word = gapWord(cell.text);
  const reason = gapText(cell);
  const said = lead ? (word === "No figure" ? lead : `${lead} ${gapReading(cell.text)}`) : word;
  return reason === null ? { text: said, line } : { lead: `${said}: `, text: reason, line };
}

/** What the list says under a facility: its rank and leverage, or why it states no amount. */
function StackDetail({ row, href }: { row: StackRow; href: NoteHref }) {
  const { amount, leverage } = row;
  if (amount.value === null) return <NoteText note={gapNote(amount, "", row.line)} href={href} />;
  const rank = row.secured === null ? null : row.secured ? "Secured" : "Not secured";
  if (leverage && leverage.value === null && leverage.text.trim()) {
    const note = gapNote(leverage, "Cumulative leverage", row.line);
    return (
      <NoteText
        note={{ ...note, lead: rank ? `${rank} · ${note.lead ?? ""}` : note.lead }}
        href={href}
      />
    );
  }
  const parts = [
    rank,
    leverage?.value == null ? null : `${multiple(figureText(leverage.text))} cumulative leverage`,
  ];
  return <>{parts.filter(Boolean).join(" · ")}</>;
}

type Segment = ReturnType<typeof stackGeometry>["segments"][number];

/** The facilities, each label level with its segment and bracketed to it; the list is the order
 * of claim. */
function StackLabels({
  segments,
  height,
  href,
}: {
  segments: Segment[];
  height: number;
  href: NoteHref;
}) {
  return (
    <ol className="relative min-w-0 flex-1" style={{ height }}>
      {segments.map((row, at) => (
        <li
          key={at}
          className="absolute inset-x-0 flex flex-col gap-0.5"
          style={{ top: row.labelTop }}
        >
          <span className="flex items-baseline justify-between gap-3">
            {/* One line: each label has one fixed slot beside its segment, so a wrapped name would
                run into the next. The full name is the title and the stack's reading. */}
            <span className="min-w-0 truncate text-small text-text-primary" title={row.label}>
              {row.label}
            </span>
            {row.amount.value !== null && (
              <Figure className="text-small font-medium">{figureText(row.amount.text)}</Figure>
            )}
          </span>
          <span className="text-caption font-normal text-text-secondary">
            <StackDetail row={row} href={href} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function stackReading(rows: StackRow[], unit: string) {
  const parts = rows.map(
    (row) =>
      `${row.label} ${row.amount.value === null ? gapReading(row.amount.text) : figureText(row.amount.text)}`,
  );
  return `Debt by rank${unit ? `, ${unit}` : ""}, first claim first: ${parts.join(", ")}.`;
}

/** The bracket from a segment's right edge, and its leader to the label's first line. */
function StackBracket({ segment }: { segment: Segment }) {
  const x = STACK.width + 4;
  const top = segment.y + 1;
  const bottom = segment.y + Math.max(2, segment.height - 1);
  const middle = (top + bottom) / 2;
  const label = segment.labelTop + STACK_LABEL.middle - 8;
  return (
    <path
      data-bracket
      d={`M${String(x)} ${String(top)}h4V${String(bottom)}h-4M${String(x + 4)} ${String(middle)}L${String(x + 10)} ${String(middle)}L${String(STACK.width + STACK_LABEL.bracket)} ${String(label)}`}
      fill="none"
      className="stroke-text-tertiary"
    />
  );
}

function StackSegment({ segment }: { segment: Segment }) {
  if (segment.amount.value === null)
    return (
      <rect
        data-gap={segment.label}
        x="0.5"
        y={segment.y + 0.5}
        width={STACK.width - 1}
        height={segment.height - 1}
        rx="2"
        fill="url(#stack-gap)"
        strokeDasharray="3 3"
        className="stroke-border-gap"
      />
    );
  return (
    <rect
      data-segment={segment.label}
      x="0"
      y={segment.y}
      width={STACK.width}
      height={segment.height}
      rx="2"
      className={RANK_FILL.get(segment.secured)}
    />
  );
}

function CapitalStack({ source, href }: { source: Ready; href: NoteHref }) {
  const unit = unitOf(source.descriptor);
  const rows = stackRows(source.table, source.descriptor, unit);
  if (!rows) return <FigureGap reason="The debt stack states no amount for any facility." />;
  const { segments, height } = stackGeometry(rows);
  const width = STACK.width + STACK_LABEL.bracket;
  return (
    <>
      <div className="flex items-start gap-2">
        <svg
          viewBox={`0 0 ${String(width)} ${String(height)}`}
          width={width}
          height={height}
          role="img"
          aria-label={stackReading(rows, unitLabel(unit))}
          className="flex-none"
        >
          <defs>
            <GapPattern id="stack-gap" />
          </defs>
          {segments.map((segment, at) => (
            <StackSegment key={at} segment={segment} />
          ))}
          {segments.map((segment, at) => (
            <StackBracket key={at} segment={segment} />
          ))}
        </svg>
        <StackLabels segments={segments} height={height} href={href} />
      </div>
      <ReasonNotes notes={basisNoteList(source.table)} href={href} />
    </>
  );
}

/** Where a figure's reasons are read in Evidence: the row's handoff line, or the table's own. */
const hrefOf =
  (folder: string, source: Ready): NoteHref =>
  (line) =>
    evidencePath(folder, source.entry, line ?? source.table.line);

/** The line a figure's trace opens: its chart table, or where the module says why it has none. */
const traceAt = (source: FigureSource) =>
  source.state === "ready" ? source.table.line : entryLine(source.entry);

/** Row 4, structure: when the debt falls due, and who is ahead of whom. */
export function StructureRow({ run, view }: RowProps) {
  const wall = figureSource(view, "CP-1", MATURITIES, "Financial foundation");
  const stack = figureSource(view, "CP-1", DEBT_STACK, "Financial foundation");
  const unit = (source: FigureSource) =>
    source.state === "ready" ? unitLabel(unitOf(source.descriptor)) : "";
  return (
    <>
      <FigureTile
        span={8}
        title="Maturity wall"
        basis={["Debt maturing by period", unit(wall)].filter(Boolean).join(", ")}
        trace={
          <FigureSourceControl
            folder={run.folder}
            entry={wall.entry}
            line={traceAt(wall)}
            name="the maturity wall"
          />
        }
      >
        {wall.state === "ready" ? (
          <MaturityWall source={wall} href={hrefOf(run.folder, wall)} />
        ) : (
          <FigureGap reason={wall.reason} />
        )}
      </FigureTile>
      <FigureTile
        span={4}
        title="Capital structure by rank"
        basis={["Amount", unit(stack)].filter(Boolean).join(", ") + "; first claim at the top"}
        trace={
          <FigureSourceControl
            folder={run.folder}
            entry={stack.entry}
            line={traceAt(stack)}
            name="the capital structure"
          />
        }
      >
        {stack.state === "ready" ? (
          <CapitalStack source={stack} href={hrefOf(run.folder, stack)} />
        ) : (
          <FigureGap reason={stack.reason} />
        )}
      </FigureTile>
    </>
  );
}
