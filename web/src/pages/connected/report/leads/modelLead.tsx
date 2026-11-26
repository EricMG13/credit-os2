import { forwardPath, pathGeometry, PATH } from "../overview/stressData";
import { withOtherCases } from "./cp2g";
import { FigureTile, GapTile, LeadFrame, Link } from "./kit/LeadFrame";
import { BAR, GapSlot, Legend, LINE, Measured, NARROW, SIZE, textWidth, wrap } from "./kit/marks";
import { safeText } from "./kit/reader";
import type { Lead, LeadProps } from "./types";

/*
 * CP-MODEL lead. The model is the run's published forecast: the page reads only the net leverage row
 * of its cash-flow grid through `forwardPath` (the Overview's own reader) and draws it on a larger
 * canvas; the forecast itself, all of its rows and its assumptions, are on the Forecast page.
 * Tested on a faked model of the shape `forwardPath` reads (see overview/StressRow.test.tsx);
 * no retained real published model is used. No value is singled out (no high, no peak): every
 * period's figure is the model's own, and the table view lists them all.
 */

type Path = NonNullable<ReturnType<typeof forwardPath>>;

const TOP = 18;
const BASE = 218;
/** One look per case: a colour, a dash and a marker shape, so no two cases share any of them. */
const LOOKS = [
  { stroke: "stroke-chart-1", fill: "fill-chart-1", dash: "", shape: "circle" },
  { stroke: "stroke-chart-2", fill: "fill-chart-2", dash: "6 4", shape: "square" },
  { stroke: "stroke-chart-4", fill: "fill-chart-4", dash: "2 3", shape: "diamond" },
  { stroke: "stroke-chart-5", fill: "fill-chart-5", dash: "8 3 2 3", shape: "triangle" },
] as const;
type Look = (typeof LOOKS)[number];
const lookOf = (at: number): Look => LOOKS[at % LOOKS.length] ?? LOOKS[0];

/** The text closed by one full stop; one the model already wrote is not doubled. */
const end = (text: string) => (text.endsWith(".") ? text : `${text}.`);

const reasonOf = (text: string) =>
  text.trim() ? safeText(text) : "this page could not read a figure";

/** A case's marker at a point: its own shape, in its own colour. */
function Marker({
  look,
  x,
  y,
  size = 5,
  ...rest
}: {
  look: Look;
  x: number;
  y: number;
  size?: number;
  "data-point"?: string;
}) {
  const common = {
    className: `${look.fill} stroke-surface-card`,
    strokeWidth: 1.5,
    "data-cx": x,
    "data-cy": y,
    ...rest,
  };
  if (look.shape === "circle") return <circle cx={x} cy={y} r={size} {...common} />;
  if (look.shape === "square")
    return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} {...common} />;
  const points =
    look.shape === "diamond"
      ? `${String(x)},${String(y - size - 1)} ${String(x + size + 1)},${String(y)} ${String(x)},${String(y + size + 1)} ${String(x - size - 1)},${String(y)}`
      : `${String(x)},${String(y - size - 1)} ${String(x + size + 1)},${String(y + size)} ${String(x - size - 1)},${String(y + size)}`;
  return <polygon points={points} {...common} />;
}

/** End labels in order of height, each at least its own height clear of the one above. */
function spread<T extends { y: number; lines: string[] }>(ends: T[]) {
  const placed: (T & { top: number })[] = [];
  for (const end of ends) {
    const above = placed.at(-1);
    const floor = above ? above.top + above.lines.length * LINE + 6 : -Infinity;
    placed.push({ ...end, top: Math.max(end.y - 6, floor) });
  }
  return placed;
}

function PathFigure({ path, width }: { path: Path; width: number }) {
  const narrow = width < NARROW;
  const geometry = pathGeometry(path.cases);
  // End labels sit in a right margin: names wrapped to fit it, then the model's own text for the end.
  const margin = narrow
    ? 84
    : Math.min(170, Math.max(96, ...path.cases.map(({ group }) => textWidth(group) + 22)));
  const left = 46;
  const right = Math.max(left + 60, width - margin);
  const xs = geometry.periods.map(({ x }) => x);
  const [from = 0] = xs;
  const to = xs.at(-1) ?? from;
  const x = (value: number) =>
    to === from ? (left + right) / 2 : left + ((value - from) / (to - from)) * (right - left);
  const y = (value: number) => TOP + ((value - PATH.top) / (PATH.base - PATH.top)) * (BASE - TOP);
  const slots = path.cases.map((item, at) => {
    const line = geometry.lines[at] ?? [];
    const cells = geometry.periods.map(({ period, x: px }) => {
      const point = line.find((candidate) => candidate.period === period);
      return {
        period,
        x: x(px),
        display: point?.display ?? "",
        reason: reasonOf(point?.reason ?? ""),
        figure: point?.y == null ? null : { x: x(point.x), y: y(point.y) },
      };
    });
    return { group: item.group, look: lookOf(at), cells };
  });
  const labelWidth = width - right - 14;
  const ends = slots
    .map(({ group, cells }, at) => {
      const last = cells.filter((cell) => cell.figure).at(-1);
      return last?.figure
        ? {
            at,
            lines: [...wrap(group, labelWidth), last.display],
            x: last.figure.x,
            y: last.figure.y,
          }
        : null;
    })
    .filter((end) => end !== null)
    .sort((a, b) => a.y - b.y);
  const endLabels = spread(ends);
  // Period labels, every second or third one when they would touch.
  const widest = Math.max(...geometry.periods.map(({ period }) => textWidth(period, SIZE.tick)));
  const pitch =
    geometry.periods.length > 1 ? (right - left) / (geometry.periods.length - 1) : right;
  const every = Math.max(1, Math.ceil((widest + 10) / pitch));
  const reading = path.cases
    .map(
      ({ group, points }) =>
        `${group}: ${points.map((point) => `${point.period} ${point.value === null ? "no figure" : point.display}`).join(", ")}`,
    )
    .join(". ");
  const height = BASE + 36;
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width="100%"
      role="img"
      aria-label={`${path.measure}, from zero. ${reading}.`}
      data-layout={narrow ? "narrow" : "wide"}
      data-zero={BASE}
      className="block"
    >
      {geometry.ticks.map((tick) => (
        <g key={tick.label}>
          <line
            x1={left}
            x2={right + 6}
            y1={y(tick.y)}
            y2={y(tick.y)}
            className="stroke-border-hairline"
          />
          <text
            x={left - 8}
            y={y(tick.y) + 4}
            textAnchor="end"
            fontSize={SIZE.tick}
            className="fill-text-tertiary font-mono"
          >
            {tick.label}x
          </text>
        </g>
      ))}
      {slots.map(({ group, look, cells }) =>
        cells.flatMap((cell, index) => {
          const next = cells[index + 1];
          // Only neighbouring periods that both have a figure are joined: nothing is drawn across a gap.
          return cell.figure && next?.figure
            ? [
                <line
                  key={`${group}-${cell.period}`}
                  data-line={group}
                  x1={cell.figure.x}
                  y1={cell.figure.y}
                  x2={next.figure.x}
                  y2={next.figure.y}
                  strokeWidth="2.5"
                  strokeDasharray={look.dash || undefined}
                  className={look.stroke}
                />,
              ]
            : [];
        }),
      )}
      {slots.map(({ group, look, cells }) =>
        cells.flatMap((cell, index) => {
          if (cell.figure)
            return [
              <Marker
                key={`${group}-${cell.period}`}
                data-point={`${group} ${cell.period}`}
                look={look}
                x={cell.figure.x}
                y={cell.figure.y}
              />,
            ];
          // No figure for this case in this period: a hatched slot on the case's own line, at the
          // height of its nearest stated neighbour (a place for the mark, not a value).
          const near =
            cells
              .slice(0, index)
              .reverse()
              .find((other) => other.figure) ??
            cells.slice(index + 1).find((other) => other.figure);
          return near?.figure
            ? [
                <g key={`${group}-${cell.period}-gap`} data-gap-mark={`${group} ${cell.period}`}>
                  <GapSlot
                    x={cell.x - 13}
                    y={near.figure.y - BAR / 2}
                    width={26}
                    height={BAR}
                    reason={cell.reason}
                  />
                </g>,
              ]
            : [];
        }),
      )}
      {endLabels.map((end) => (
        <text
          key={end.at}
          data-case-label={slots[end.at]?.group}
          x={end.x + 14}
          y={end.top + 10}
          fontSize={SIZE.label}
          className="fill-text-secondary font-body"
        >
          {end.lines.map((line, index) => (
            <tspan
              key={line}
              x={end.x + 14}
              dy={index === 0 ? 0 : LINE}
              className={index === end.lines.length - 1 ? "fill-text-primary font-mono" : undefined}
            >
              {line}
            </tspan>
          ))}
        </text>
      ))}
      {geometry.periods.map(({ period, x: px }, index) =>
        index % every === 0 || index === geometry.periods.length - 1 ? (
          <text
            key={period}
            x={x(px)}
            y={BASE + 24}
            textAnchor="middle"
            fontSize={SIZE.tick}
            className="fill-text-tertiary font-body"
          >
            {period}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/** The legend: each case's own line, dash and marker, then the hatched slot when a period has no figure. */
function CaseLegend({ path, gaps }: { path: Path; gaps: boolean }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-secondary">
      {path.cases.map(({ group }, at) => {
        const look = lookOf(at);
        return (
          <li key={group} className="flex items-center gap-1.5">
            <svg viewBox="0 0 28 14" width="28" height="14" aria-hidden="true" focusable="false">
              <line
                x1="0"
                x2="28"
                y1="7"
                y2="7"
                strokeWidth="2.5"
                strokeDasharray={look.dash || undefined}
                className={look.stroke}
              />
              <Marker look={look} x={14} y={7} size={4} />
            </svg>
            {group}
          </li>
        );
      })}
      {gaps && (
        <li>
          <Legend items={[{ kind: "hatch", text: "No figure read" }]} />
        </li>
      )}
    </ul>
  );
}

function ForwardTile({ props, path }: { props: LeadProps; path: Path }) {
  const gaps = path.cases.flatMap(({ group, points }) =>
    points
      .filter((point) => point.value === null)
      .map((point) => end(`${group}, ${point.period}: ${reasonOf(point.reason)}`)),
  );
  return (
    <FigureTile
      props={props}
      span={12}
      label="Forward net leverage"
      kicker={`${path.measure}, from zero`}
      caption={<Link href="#forecast">Open the forecast</Link>}
      title="Net leverage by case"
      source="the forward path"
      notes={[...gaps, ...path.limits]}
      table={{
        caption: path.measure,
        headers: ["Case", "Period", "As the model states it"],
        rows: path.cases.flatMap(({ group, points }) =>
          points.map((point) => [
            group,
            point.period,
            point.value === null ? "No figure" : point.display,
          ]),
        ),
      }}
    >
      <CaseLegend path={path} gaps={gaps.length > 0} />
      <Measured fallback={640}>{(width) => <PathFigure path={path} width={width} />}</Measured>
    </FigureTile>
  );
}

function Content(props: LeadProps) {
  const [model] = props.view.models;
  const base = model ? forwardPath(model) : null;
  const path = base && model ? withOtherCases(base, model) : null;
  return (
    <>
      {path ? (
        <ForwardTile props={props} path={path} />
      ) : (
        <GapTile span={12} label="Forward net leverage" kicker="Net leverage by case">
          {model
            ? "This page could not read a net leverage path from the published model."
            : "This page could not read a published model for this run."}{" "}
          <Link href="#forecast">Open the forecast</Link>
        </GapTile>
      )}
    </>
  );
}

/** CP-MODEL: net leverage by case from the published model, and the way to the Forecast page. */
export const ModelLead: Lead = function ModelLead(props) {
  return (
    <LeadFrame props={props}>
      <Content {...props} />
    </LeadFrame>
  );
};
// This lead draws no typed figure, event lane or map of the module's own.
ModelLead.draws = [];
