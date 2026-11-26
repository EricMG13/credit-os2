import { FigureTile, GapTile, LeadFrame } from "./kit/LeadFrame";
import {
  BAR,
  GapSlot,
  Measured,
  SIZE,
  fittingTicks,
  gapSlotHeight,
  niceAxis,
  textWidth,
  type LegendEntry,
  type NiceAxis,
} from "./kit/marks";
import { UnreadFigures } from "./kit/UnreadFigures";
import { unitLabel } from "../../publishedReport";
import { safeText } from "./kit/reader";
import {
  bandGapText,
  end,
  chartTitleOf,
  readPeerBenchmark,
  shown,
  withUnit,
  type PeerGroup,
  type PeerRow,
  type PeerTable,
} from "./peerBenchmarkData";
import type { Lead, LeadProps } from "./types";

/*
 * CP-1C peer benchmark lead. Synthetic contract: built from the launcher's two range tables
 * (src/deploy_workflow/owners/cpos_launch_tables.py `_peer_range`); no retained real handoff exists
 * (CP-1C is blocked at the peer-data gate in every retained run), so this lead is unproven on a real run.
 */

const LANE = 16;
const PAD = 8;

type Label = { text: string; x: number; anchor: "start" | "middle" | "end"; kind: string };

/** Where a label of `width` px starts when it hangs from `x`, kept inside a figure `total` px wide. */
function startOf(x: number, anchor: Label["anchor"], width: number, total: number) {
  const from = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
  return Math.min(Math.max(from, 0), Math.max(total - width, 0));
}

/** Greedy lanes: a label drops to the next line when it would overlap one already placed on this line. */
function lanes(labels: Label[], total: number) {
  const placed: { from: number; to: number; lane: number }[] = [];
  return [...labels]
    .sort((a, b) => a.x - b.x)
    .map((label) => {
      const width = textWidth(label.text, SIZE.label);
      const from = startOf(label.x, label.anchor, width, total);
      let lane = 0;
      while (placed.some((p) => p.lane === lane && from < p.to + 6 && from + width > p.from - 6))
        lane += 1;
      placed.push({ from, to: from + width, lane });
      return { ...label, from, lane };
    });
}

function peersText(row: PeerRow) {
  if (row.count.kind === "gap") return "Peer count not supplied";
  return `${String(row.count.value)} ${row.count.value === 1 ? "peer" : "peers"}`;
}

function reading(row: PeerRow) {
  const unit = row.unit;
  const { drawing } = row;
  const count = peersText(row);
  if (drawing.kind === "conflict")
    return `${end(`${row.metric}: ${drawing.message}, so no range is drawn`)} ${end(count)}`;
  const stated = (label: string, value: PeerRow["low"]) =>
    `${label} ${value.kind === "number" ? withUnit(shown(value), unit) : shown(value)}`;
  const parts = [
    stated("peer low", row.low),
    stated("median", row.median),
    stated("peer high", row.high),
    stated("issuer", row.issuer),
  ];
  return `${end(`${row.metric}: ${parts.join(", ")}`)} ${end(count)}`;
}

/** The hatched slot with the module's words on its solid chip, as tall as the words need. */
function Slot({ x, y, width, text }: { x: number; y: number; width: number; text: string }) {
  return <GapSlot x={x} y={y} width={width} height={20} reason={text} text={text} />;
}

/** The words a not-numeric issuer is drawn with: the module's own, never a page statement. */
const issuerWords = (row: PeerRow) =>
  row.issuer.kind === "gap" ? `issuer: ${row.issuer.reason}` : `issuer ${shown(row.issuer)}`;

function Strip({ row, axis, width }: { row: PeerRow; axis: NiceAxis; width: number }) {
  const { drawing, unit } = row;
  if (drawing.kind !== "strip") {
    const text = drawing.kind === "conflict" ? drawing.message : bandGapText(row);
    const room = width - 2 * PAD;
    return (
      <svg
        viewBox={`0 0 ${String(width)} ${String(gapSlotHeight(room, 20, text) + 8)}`}
        width="100%"
        role="img"
        aria-label={reading(row)}
        data-row={row.metric}
        className="block"
      >
        <Slot x={PAD} y={4} width={room} text={text} />
      </svg>
    );
  }
  const x = (value: number) => axis.place(value, PAD, width - PAD);
  const top: Label[] = [
    {
      text: `low ${withUnit(shown(row.low), unit)}`,
      x: x(drawing.low),
      anchor: "end",
      kind: "low",
    },
    {
      text: `high ${withUnit(shown(row.high), unit)}`,
      x: x(drawing.high),
      anchor: "start",
      kind: "high",
    },
    ...(drawing.median === null
      ? []
      : [
          {
            text: `median ${withUnit(shown(row.median), unit)}`,
            x: x(drawing.median),
            anchor: "middle" as const,
            kind: "median",
          },
        ]),
  ];
  const placed = lanes(top, width);
  const laneCount = Math.max(...placed.map((label) => label.lane)) + 1;
  const bandY = laneCount * LANE + 8;
  const centre = bandY + 8;
  const issuerSlot = issuerWords(row);
  const slotWidth = Math.min(
    width - 2 * PAD,
    Math.max(150, textWidth(issuerSlot, SIZE.label) + 24),
  );
  const height =
    bandY +
    BAR +
    (drawing.issuer === null ? 12 + gapSlotHeight(slotWidth, 20, issuerSlot) + 6 : 34);
  const bandFrom = x(drawing.low);
  const bandTo = x(drawing.high);
  const issuerX = drawing.issuer === null ? null : x(drawing.issuer);
  const issuerText = `issuer ${withUnit(shown(row.issuer), unit)}`;
  const kept = fittingTicks(axis, PAD, width - PAD, (text) => textWidth(text, SIZE.tick));
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width="100%"
      role="img"
      aria-label={reading(row)}
      data-row={row.metric}
      className="block"
    >
      {kept.map((tick) => (
        <line
          key={tick.label}
          x1={x(tick.value)}
          x2={x(tick.value)}
          y1="2"
          y2={height - 2}
          className="stroke-border-hairline"
        />
      ))}
      <rect
        data-band
        data-low={row.low.kind === "number" ? row.low.text : ""}
        data-high={row.high.kind === "number" ? row.high.text : ""}
        x={bandFrom}
        y={bandY}
        width={Math.max(3, bandTo - bandFrom)}
        height={BAR}
        rx="3"
        className="fill-chart-3"
      />
      {drawing.median !== null && (
        <line
          data-median={row.median.kind === "number" ? row.median.text : ""}
          x1={x(drawing.median)}
          x2={x(drawing.median)}
          y1={bandY - 4}
          y2={bandY + 20}
          strokeWidth="2.5"
          className="stroke-text-tertiary"
        />
      )}
      {placed.map((label) => (
        <text
          key={label.kind}
          data-label={label.kind}
          x={label.from}
          y={(label.lane + 1) * LANE}
          fontSize={SIZE.label}
          className="fill-text-secondary font-mono"
        >
          {label.text}
        </text>
      ))}
      {issuerX !== null && (
        <>
          <circle
            data-issuer={row.issuer.kind === "number" ? row.issuer.text : ""}
            cx={issuerX}
            cy={centre}
            r="7"
            strokeWidth="2"
            className="fill-chart-1 stroke-surface-card"
          />
          <text
            x={startOf(issuerX, "middle", textWidth(issuerText, SIZE.label), width)}
            y={centre + 28}
            fontSize={SIZE.label}
            className="fill-text-primary font-mono"
          >
            {issuerText}
          </text>
        </>
      )}
      {issuerX === null && <Slot x={PAD} y={centre + 12} width={slotWidth} text={issuerSlot} />}
    </svg>
  );
}

function Axis({ axis, width }: { axis: NiceAxis; width: number }) {
  const kept = fittingTicks(axis, PAD, width - PAD, (text) => textWidth(text, SIZE.tick));
  return (
    <svg
      viewBox={`0 0 ${String(width)} 22`}
      width="100%"
      aria-hidden="true"
      focusable="false"
      data-axis
      className="block"
    >
      {kept.map((tick) => {
        const at = axis.place(tick.value, PAD, width - PAD);
        const half = textWidth(tick.label, SIZE.tick) / 2;
        return (
          <text
            key={tick.label}
            x={Math.min(Math.max(at, half), width - half)}
            y="14"
            textAnchor="middle"
            fontSize={SIZE.tick}
            className="fill-text-tertiary font-mono"
          >
            {tick.label}
          </text>
        );
      })}
    </svg>
  );
}

function Group({ group, showUnit }: { group: PeerGroup; showUnit: boolean }) {
  const values = group.rows.flatMap(({ drawing }) =>
    drawing.kind === "strip" ? [drawing.low, drawing.high, drawing.median, drawing.issuer] : [],
  );
  const suffix = /^[%x]$/i.test(group.unit) ? group.unit : "";
  const axis = niceAxis(
    values.filter((value) => value !== null),
    { zero: true, suffix },
  );
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {showUnit && group.unit && (
        <p className="text-caption text-text-tertiary">
          Reporting unit: {unitLabel(safeText(group.unit))}
        </p>
      )}
      <Measured fallback={640}>
        {(width) => (
          <>
            <ol className="flex min-w-0 flex-col gap-4">
              {group.rows.map((row) => (
                <li
                  key={`${row.metric}-${String(row.line)}`}
                  className="flex min-w-0 flex-col gap-1"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <h4 className="text-small font-medium text-text-primary">{row.metric}</h4>
                    <span className="font-mono text-caption text-text-secondary">
                      {peersText(row)}
                    </span>
                  </div>
                  {row.drawing.kind === "conflict" && (
                    <p className="text-caption text-gap-text">
                      The stated values conflict, so no range is drawn.
                    </p>
                  )}
                  <Strip row={row} axis={axis} width={width} />
                </li>
              ))}
            </ol>
            {group.rows.some(({ drawing }) => drawing.kind === "strip") && (
              <Axis axis={axis} width={width} />
            )}
          </>
        )}
      </Measured>
    </div>
  );
}

const KIND_NAME = { percent: "percent metrics", multiples: "multiples" } as const;

/** A stated cell as the table shows it: a number as written, a gap, words or a count as written. */
const cellOf = (value: PeerRow["issuer"] | PeerRow["count"]) =>
  "written" in value && value.written ? value.written : safeText(value.text);

function PeerTile({
  props,
  table,
  span,
}: {
  props: LeadProps;
  table: PeerTable;
  span: 6 | 8 | 12;
}) {
  const basis = [...new Set(table.rows.flatMap(({ basis: note }) => (note ? [note] : [])))];
  const notes = [...new Set([...table.rows.flatMap((row) => row.notes), ...basis])];
  const name = `Peer range, ${KIND_NAME[table.kind]}`;
  const legend: LegendEntry[] = [
    { kind: "bar", tone: "prior", text: "Peer low to peer high" },
    { kind: "dot", text: "Issuer" },
    ...(table.rows.some(
      (row) =>
        row.drawing.kind !== "strip" ||
        row.issuer.kind !== "number" ||
        row.median.kind !== "number",
    )
      ? [{ kind: "hatch" as const, text: "Not stated" }]
      : []),
  ];
  return (
    <FigureTile
      props={props}
      span={span}
      label={name}
      kicker="One scale per unit"
      title={name}
      line={table.line}
      source={name.toLowerCase()}
      legend={legend}
      notes={notes}
      table={{
        caption: name,
        headers: ["Metric", "Issuer", "Peer low", "Peer median", "Peer high", "Peer count", "Unit"],
        rows: table.rows.map((row) => [
          row.metric,
          cellOf(row.issuer),
          cellOf(row.low),
          cellOf(row.median),
          cellOf(row.high),
          cellOf(row.count),
          unitLabel(safeText(row.unit)),
        ]),
      }}
    >
      <div className="flex min-w-0 flex-col gap-6">
        {table.groups.map((group) => (
          <Group
            key={group.unit || group.rows[0]?.metric}
            group={group}
            showUnit={table.groups.length > 1}
          />
        ))}
      </div>
    </FigureTile>
  );
}

function Content(props: LeadProps) {
  const read = readPeerBenchmark(props.entry);
  const drawn = read.tables.flatMap((table) => chartTitleOf(table.heading) ?? []);
  if (!read.tables.length)
    return (
      <>
        <GapTile span={12} label="Peer range" kicker="Peer range">
          {read.gaps.join(" ")}
        </GapTile>
        <UnreadFigures lead={props} drawn={drawn} />
      </>
    );
  const both = read.tables.length > 1;
  const aside = (
    <div className="flex min-w-0 flex-col gap-4 lg:col-span-4">
      {read.gaps.map((gap) => (
        <GapTile key={gap} span={12} label="Peer range not drawn" kicker="Peer range">
          {gap}
        </GapTile>
      ))}
      {!read.outliers && (
        <GapTile span={12} label="Outliers and the peer table" kicker="Outliers and the peer table">
          This page could not read the outliers or the peer table.
        </GapTile>
      )}
    </div>
  );
  return (
    <>
      {read.tables.map((table) => (
        <PeerTile key={table.kind} props={props} table={table} span={both ? 6 : 8} />
      ))}
      {/* One chart drawn: the tiles that say what is not drawn stand beside it, not under a half-empty row. */}
      {!both && (read.gaps.length > 0 || !read.outliers) && aside}
      {both && !read.outliers && (
        <GapTile span={12} label="Outliers and the peer table" kicker="Outliers and the peer table">
          This page could not read the outliers or the peer table.
        </GapTile>
      )}
      <UnreadFigures lead={props} drawn={drawn} />
    </>
  );
}

/** CP-1C: a range strip per metric, the issuer marked; percent metrics and multiples on separate axes. */
export const PeerBenchmarkLead: Lead = function PeerBenchmarkLead(props) {
  return (
    <LeadFrame props={props}>
      <Content {...props} />
    </LeadFrame>
  );
};
// The peer range strips are the module's typed range figures, drawn by this lead.
PeerBenchmarkLead.draws = ["figures"];
