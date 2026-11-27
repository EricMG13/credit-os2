import { fiscalYear } from "../../../visuals/scenarioPeriods";
import { items } from "../../../visuals/visualData";
import {
  basisNotes,
  columnAt,
  figureSource,
  readCell,
  unitOf,
  type FigureSource,
} from "../../overview/figureData";
import { wallSlots } from "../../overview/structureData";
import { FigureTile, GapTile, Link } from "../kit/LeadFrame";
import { GapSlot, LINE, Measured, SIZE } from "../kit/marks";
import { citesSource, clauses, IN_EVIDENCE, safeText } from "../kit/reader";
import { unitLabel } from "../../../publishedReport";
import type { LeadProps } from "../types";
import { AMOUNT_BAR, AMOUNT_LEGEND, amountTone } from "./amountTone";
import { dashed } from "./periodsData";
import {
  GAP_WORDS,
  wallLayout,
  type WallLayout,
  type WallMark,
  type WallSlot,
} from "./maturityGeometry";

const LABEL = "Debt maturities";
/** The figure's width before the first measure (and in jsdom): the span-5 tile at 1128 px. */
const FALLBACK = 412;

type Ready = Extract<FigureSource, { state: "ready" }>;

/** True when any sentence or clause of the text cites a source (each tested as the net debt tile does). */
const citesAny = (text: string) =>
  clauses(text).some((clause) => citesSource(clause.replace(/[;.]$/, "")));

/** Handoff words for the page, or "Detail is in Evidence." when they cite a source. */
const words = (text: string) => dashed(citesAny(text) ? IN_EVIDENCE : safeText(text));

/** A sentence ends with one full stop, even when the handoff's words already carry it. */
const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

/** A sentence ends with one full stop, unless it is the dash. */
const closed = (text: string) => (text === "—" ? text : sentence(text));

/**
 * The amount column's own words when every period states a gap with a reason and none states an
 * amount: each distinct reason once, with its periods where they differ. Null when any cell
 * states no reason (or an amount): the page's own wording is used then.
 */
function everyReason(source: Ready, unit: string) {
  const column = columnAt(source.table, items(source.descriptor.columns)[0]);
  if (column === null || column === 0 || !source.table.rows.length) return null;
  const texts = source.table.rows.map((row) => row[column] ?? "");
  const groups = new Map<string, string[]>();
  for (const [at, row] of source.table.rows.entries()) {
    const text = texts[at] ?? "";
    const cell = readCell(text, texts, unit);
    if (cell.value !== null || cell.reason === null || !/^Not (?:supplied|calculated):/.test(text))
      return null;
    const reason = words(text.trim());
    groups.set(reason, [...(groups.get(reason) ?? []), words(row[0] ?? "")]);
  }
  if (groups.size === 1) return closed([...groups.keys()].join(""));
  return [...groups].map(([reason, labels]) => `${labels.join(", ")}: ${closed(reason)}`).join(" ");
}

/** A repeated lead-in of a note is said once: later notes keep only what they add. */
function furtherNotes(notes: readonly string[]) {
  const said = new Set<string>();
  const out: string[] = [];
  for (const note of notes) {
    const [head = "", ...rest] = note.split("; ");
    const repeated = said.has(head.replace(/\.$/, ""));
    const kept = repeated && rest.length ? rest.join("; ") : note;
    if (!out.includes(kept)) out.push(kept);
    said.add(note.replace(/\.$/, ""));
  }
  return out;
}

/**
 * The cell's own reason, in its words: "—" for a cell the source left as a dash (`dashed`, which
 * reads the whole cell; S15-5-3); null when it states none.
 */
const reasonOf = (mark: WallMark) => {
  if (!mark.cell?.reason) return null;
  return dashed(mark.cell.text) === "—" ? "—" : words(mark.cell.reason);
};

const amountText = (mark: WallMark) => {
  if (mark.kind === "none") return "No row read";
  if (mark.kind !== "gap") return mark.text ?? "";
  const reason = reasonOf(mark);
  if (reason === "—") return reason;
  return reason ? `Not supplied: ${reason}` : "Not supplied";
};

function wallReading(marks: readonly WallMark[], unit: string) {
  const parts = marks.map(
    (mark) =>
      `${mark.label} ${mark.kind === "none" ? "no row" : mark.kind === "gap" ? "not supplied" : (mark.text ?? "")}`,
  );
  return `Debt maturities${unit ? `, ${unit}` : ""}: ${parts.join(", ")}.`;
}

function Bar({ mark, layout, largest }: { mark: WallMark; layout: WallLayout; largest: number }) {
  if (mark.kind !== "bar") {
    const columns = layout.layout === "columns";
    const box = columns
      ? { x: mark.x, y: layout.base - mark.height, width: mark.width, height: mark.height }
      : { x: layout.base, y: mark.y, width: 40, height: mark.height };
    return (
      <GapSlot
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        reason={`${mark.label}: ${amountText(mark)}`}
      />
    );
  }
  return (
    <rect
      data-bar={mark.label}
      data-value={mark.cell?.value ?? undefined}
      x={mark.undated ? mark.x + 0.75 : mark.x}
      y={mark.undated ? mark.y + 0.75 : mark.y}
      width={Math.max(0, mark.undated ? mark.width - 1.5 : mark.width)}
      height={Math.max(0, mark.undated ? mark.height - 1.5 : mark.height)}
      rx={Math.min(2, mark.height / 2, mark.width / 2)}
      strokeWidth={mark.undated ? 1.5 : 1}
      className={AMOUNT_BAR[amountTone(mark.cell?.value ?? 0, largest)]}
    />
  );
}

/** The figure above a column, or the gap's words above its slot. */
function ColumnLabels({ mark, layout }: { mark: WallMark; layout: WallLayout }) {
  const top = mark.cell?.value != null && mark.cell.value < 0 ? layout.base : mark.y;
  return (
    <>
      {mark.kind === "bar" ? (
        <text
          data-part="value"
          x={mark.centre}
          y={top - 5}
          textAnchor="middle"
          fontSize={SIZE.value}
          className="fill-text-primary font-mono"
        >
          {mark.text}
        </text>
      ) : (
        <text
          data-part="reason"
          textAnchor="middle"
          fontSize={SIZE.tick}
          className="fill-gap-text font-body"
        >
          {GAP_WORDS[mark.kind].map((word, at, all) => (
            <tspan key={word} x={mark.centre} y={top - 5 - (all.length - 1 - at) * 13}>
              {word}
            </tspan>
          ))}
        </text>
      )}
      <text
        data-part="label"
        x={mark.centre}
        y={layout.height - 8}
        textAnchor="middle"
        fontSize={SIZE.tick}
        className="fill-text-secondary font-body"
      >
        {mark.label}
      </text>
    </>
  );
}

/** A row's period at the left and its figure (or the gap's words) beside the bar. */
function RowLabels({ mark, layout }: { mark: WallMark; layout: WallLayout }) {
  const y = mark.centre + 4;
  const negative = mark.cell?.value != null && mark.cell.value < 0;
  return (
    <>
      <text
        data-part="label"
        x="0"
        y={y}
        fontSize={SIZE.label}
        className="fill-text-secondary font-body"
      >
        {mark.labelLines
          ? mark.labelLines.map((line, at) => (
              <tspan key={`${String(at)}-${line}`} x="0" y={(mark.labelTop ?? 0) + 11 + at * LINE}>
                {line}
              </tspan>
            ))
          : mark.label}
      </text>
      {mark.kind === "bar" ? (
        <text
          data-part="value"
          x={negative ? layout.base + 6 : mark.x + mark.width + 6}
          y={y}
          fontSize={SIZE.value}
          className="fill-text-primary font-mono"
        >
          {mark.text}
        </text>
      ) : (
        <text
          data-part="reason"
          x={layout.base + 46}
          y={y}
          fontSize={SIZE.tick}
          className="fill-gap-text font-body"
        >
          {mark.kind === "gap" ? "Not supplied" : "No row"}
        </text>
      )}
    </>
  );
}

function BreakGlyph({ layout }: { layout: WallLayout }) {
  if (layout.breakAt === null) return null;
  const b = layout.breakAt;
  const path =
    layout.layout === "columns"
      ? `M${String(b - 8)} ${String(layout.base + 7)} ${String(b - 1)} ${String(layout.base - 7)}M${String(b + 1)} ${String(layout.base + 7)} ${String(b + 8)} ${String(layout.base - 7)}`
      : `M${String(layout.base - 7)} ${String(b + 2)} ${String(layout.base + 7)} ${String(b - 4)}M${String(layout.base - 7)} ${String(b + 6)} ${String(layout.base + 7)} ${String(b)}`;
  return (
    <path
      data-axis-break
      d={path}
      strokeWidth="1.25"
      fill="none"
      className="stroke-text-tertiary"
    />
  );
}

function Axis({ layout }: { layout: WallLayout }) {
  const b = layout.breakAt;
  if (layout.layout === "columns") {
    const y = layout.base;
    return b === null ? (
      <line x1={layout.from} y1={y} x2={layout.to} y2={y} className="stroke-connector" />
    ) : (
      <>
        <line x1={layout.from} y1={y} x2={b - 9} y2={y} className="stroke-connector" />
        <line x1={b + 9} y1={y} x2={layout.to} y2={y} className="stroke-connector" />
      </>
    );
  }
  const x = layout.base;
  return b === null ? (
    <line x1={x} y1={layout.from} x2={x} y2={layout.to} className="stroke-connector" />
  ) : (
    <>
      <line x1={x} y1={layout.from} x2={x} y2={b - 6} className="stroke-connector" />
      <line x1={x} y1={b + 8} x2={x} y2={layout.to} className="stroke-connector" />
    </>
  );
}

function Grid({ layout }: { layout: WallLayout }) {
  const columns = layout.layout === "columns";
  return (
    <>
      {layout.ticks.map((tick) =>
        columns ? (
          <g key={tick.label}>
            <line
              x1={layout.from}
              x2={layout.to}
              y1={tick.at}
              y2={tick.at}
              className="stroke-border-hairline"
            />
            <text
              data-part="tick"
              x={layout.from - 8}
              y={tick.at + 4}
              textAnchor="end"
              fontSize={SIZE.tick}
              className="fill-text-tertiary font-mono"
            >
              {tick.label}
            </text>
          </g>
        ) : (
          <g key={tick.label}>
            <line
              x1={tick.at}
              x2={tick.at}
              y1={layout.from}
              y2={layout.to}
              className="stroke-border-hairline"
            />
            <text
              data-part="tick"
              x={tick.at}
              y={layout.height - 5}
              textAnchor="middle"
              fontSize={SIZE.tick}
              className="fill-text-tertiary font-mono"
            >
              {tick.label}
            </text>
          </g>
        ),
      )}
    </>
  );
}

function Wall({
  slots,
  unit,
  width,
}: {
  slots: { dated: WallSlot[]; undated: WallSlot[] };
  unit: string;
  width: number;
}) {
  const layout = wallLayout(slots.dated, slots.undated, width);
  const Labels = layout.layout === "columns" ? ColumnLabels : RowLabels;
  // C4: the largest |amount| over every bar on this wall; gap slots carry no amount.
  const largest = Math.max(
    0,
    ...layout.marks.flatMap((mark) => (mark.kind === "bar" ? Math.abs(mark.cell?.value ?? 0) : [])),
  );
  return (
    <>
      <svg
        viewBox={`0 0 ${String(width)} ${String(layout.height)}`}
        width="100%"
        role="img"
        aria-label={wallReading(layout.marks, unit)}
        data-layout={layout.layout}
      >
        <Grid layout={layout} />
        {layout.marks.map((mark) => (
          <Bar key={mark.label} mark={mark} layout={layout} largest={largest} />
        ))}
        <Axis layout={layout} />
        <BreakGlyph layout={layout} />
        {layout.marks.map((mark) => (
          <Labels key={mark.label} mark={mark} layout={layout} />
        ))}
      </svg>
    </>
  );
}

/** The marks the wall draws, whose kinds do not depend on width: for the notes, legend and table. */
function marksOf(slots: { dated: WallSlot[]; undated: WallSlot[] }) {
  return wallLayout(slots.dated, slots.undated, FALLBACK).marks;
}

function MaturityFigure({ lead, source, span }: { lead: LeadProps; source: Ready; span: 6 | 12 }) {
  const unit = unitLabel(unitOf(source.descriptor));
  const kicker = unit ? `${LABEL} · ${unit}` : LABEL;
  const labels = source.table.rows.map((row) => row[0] ?? "");
  // The wall places a dated row by its year, so "FY2026" and "2026" are the same period.
  const periods = labels.map((label) => String(fiscalYear(label) ?? label));
  const twice = labels.find((_, at) => periods.indexOf(periods[at] ?? "") !== at);
  const raw = wallSlots(source.table, source.descriptor, unitOf(source.descriptor));
  const common = {
    props: lead,
    span,
    label: LABEL,
    kicker,
    title: LABEL,
    line: source.table.line,
    source: "the maturity wall",
  };
  // The wall keeps one row per period; a period stated twice would silently lose a row.
  if (twice !== undefined)
    return (
      <GapTile span={span} label={LABEL} kicker={kicker}>
        This page could not read the maturity wall because {words(twice)} appears more than once.
      </GapTile>
    );
  if (!raw)
    return (
      <GapTile span={span} label={LABEL} kicker={kicker}>
        {everyReason(source, unitOf(source.descriptor)) ??
          "This page could not read an amount for any period of the maturity wall."}
      </GapTile>
    );
  const label = (slot: WallSlot): WallSlot => ({ ...slot, label: words(slot.label) });
  const slots = { dated: raw.dated.map(label), undated: raw.undated.map(label) };
  const marks = marksOf(slots);
  const notes = [
    ...marks
      .filter((mark) => mark.kind !== "bar")
      .map((mark) =>
        mark.kind === "none"
          ? `${mark.label}: this page could not read a row for this year.`
          : sentence(`${mark.label}: ${reasonOf(mark) ?? "this page could not read an amount"}`),
      ),
    ...furtherNotes(basisNotes(source.table).filter((note) => !citesAny(note))),
  ];
  const legend = [
    ...AMOUNT_LEGEND,
    ...(marks.some((mark) => mark.kind !== "bar")
      ? [{ tone: "gap" as const, text: "Not supplied" }]
      : []),
  ];
  return (
    <FigureTile
      {...common}
      legend={legend}
      notes={notes}
      table={{
        caption: `Debt maturities${unit ? `, ${unit}` : ""}`,
        headers: ["Period", "Amount"],
        rows: marks.map((mark) => [mark.label, amountText(mark)]),
      }}
    >
      <Measured fallback={FALLBACK}>
        {(width) => <Wall slots={slots} unit={unit} width={width} />}
      </Measured>
      <Link href="#overview">Full wall on Overview</Link>
    </FigureTile>
  );
}

/**
 * Tile 6 of the financial foundation: the compact maturity wall; the full one is on Overview. It
 * shares its row with the periods tile, and takes the whole row (`span` 12) when it is the last,
 * unpaired figure.
 */
export function MaturityTile({ lead, span = 6 }: { lead: LeadProps; span?: 6 | 12 }) {
  const source = figureSource(lead.view, "CP-1", "Debt maturities", "Financial foundation");
  if (source.state === "gap")
    return (
      <GapTile span={span} label={LABEL} kicker={LABEL}>
        This page could not read the debt maturities.
      </GapTile>
    );
  return <MaturityFigure lead={lead} source={source} span={span} />;
}
