import { GapNote } from "../overview/Tile";
import {
  NO_BRIDGE,
  NO_KPIS,
  NO_RESULTS,
  earningsDelta,
  hasVarianceRegister,
  withMark,
  type Bridge,
  type Pair,
  type PairFigure,
  type PairGroup,
  type Side,
  type Unstated,
} from "./earningsDeltaData";
import { changePeriod } from "./kit/changes";
import { FigureTile, GapTile, LeadFrame, type TableViewData } from "./kit/LeadFrame";
import {
  Dumbbell,
  GapChip,
  Measured,
  Waterfall,
  type DumbbellRow,
  type DumbbellSide,
  type WaterfallRow,
} from "./kit/marks";
import { group } from "./kit/numbers";
import { UnreadFigures } from "./kit/UnreadFigures";
import type { Lead, LeadProps } from "./types";

const RESULTS_NAME = "Prior and current results";
const KPIS_NAME = "Margins and KPIs";
const BRIDGE_NAME = "Variance bridge";
const EMPTY = "This page could not read the earnings figures.";
// The titles of the chart tables this lead draws itself; any other `Chart data:` table is listed as stated.
const DRAWN = ["prior and current results", "margin and KPI changes"];

const word = (sign: number) => (sign > 0 ? "up" : sign < 0 ? "down" : "unchanged");

/** A figure as the module wrote it: an accounting negative `(1,160)` stays in brackets. */
function sideText(one: Side, unit: string) {
  if (one.kind !== "number") return one.text;
  return one.written ?? withMark(one.text, unit);
}

/** A side as the dumbbell takes it: a stated figure, or the module's words where none is. */
function dumbbellSide(one: Side, unit: string): DumbbellSide {
  return one.kind === "number" && one.value !== null
    ? { value: one.value, text: sideText(one, unit) }
    : { gap: one.text };
}

/** The change slot: the change as printed, its direction, and better or worse; none where no change is printed. */
function dumbbellRow(pair: Pair, unit: string, shared: boolean): DumbbellRow {
  const { change } = pair;
  const moved =
    change && change.sign !== null && change.sign !== 0
      ? [
          word(change.sign),
          ...(pair.tone === "better" || pair.tone === "worse" ? [pair.tone] : []),
        ].join(", ")
      : "";
  const periods =
    !shared && pair.priorPeriod && pair.currentPeriod
      ? `${pair.priorPeriod} to ${pair.currentPeriod}`
      : "";
  const note = [moved, periods].filter(Boolean).join(" · ");
  return {
    label: pair.label,
    prior: dumbbellSide(pair.prior, unit),
    current: dumbbellSide(pair.current, unit),
    ...(change ? { change: change.sign === 0 ? "unchanged" : change.text } : {}),
    ...(note ? { note } : {}),
    ...(pair.tone === "worse" ? { tone: "worse" as const } : {}),
  };
}

/** The two period names every pair of the group shares, or null where they differ or are not stated. */
function sharedPeriods(pairs: readonly Pair[]) {
  const [first] = pairs;
  const [prior, current] = [first?.priorPeriod, first?.currentPeriod];
  return prior &&
    current &&
    pairs.every((pair) => pair.priorPeriod === prior && pair.currentPeriod === current)
    ? { prior, current }
    : null;
}

/** The group's head: the scale it is actually drawn on, or that it has no figure above zero. */
function captionOf(one: PairGroup, several: boolean) {
  if (one.noFigure) return "No figure above zero";
  const unit = one.unitNotStated ? "unit not read" : one.unit;
  if (!several || one.axis === null) return undefined;
  return `${unit}, axis ${one.axis.from} to ${one.axis.to}`;
}

/** Pairs with no non-zero figure: the stated figures as written, with no scale. */
function NoFigureGroup({ group: one, caption }: { group: PairGroup; caption: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-caption text-text-tertiary">{caption}</p>
      <ul aria-label={caption} className="flex flex-col divide-y divide-border-hairline">
        {one.drawn.map((pair) => (
          <li
            key={pair.line}
            data-no-figure={pair.label}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0"
          >
            <span className="text-small font-medium wrap-anywhere text-text-primary">
              {pair.label}
            </span>
            <span className="font-mono text-small text-text-secondary tabular-nums">
              {`${sideText(pair.prior, one.unit)} \u2192 ${sideText(pair.current, one.unit)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupRows({
  group: one,
  several,
  legend,
}: {
  group: PairGroup;
  several: boolean;
  legend: boolean;
}) {
  const caption = captionOf(one, several);
  if (one.noFigure) return <NoFigureGroup group={one} caption={caption ?? ""} />;
  const shared = sharedPeriods(one.drawn);
  const rows = one.drawn.map((pair) => dumbbellRow(pair, one.unit, shared !== null));
  return (
    <Measured fallback={640}>
      {(width) => (
        <Dumbbell
          rows={rows}
          width={width}
          periods={shared ?? { prior: "Prior period", current: "Current period" }}
          unit={one.unitNotStated ? "unit not read" : one.unit}
          legend={legend}
          {...(caption ? { caption } : {})}
          {...(one.fromZero ? {} : { axisStart: "auto" as const })}
        />
      )}
    </Measured>
  );
}

type Ready = Extract<PairFigure, { kind: "ready" }>;

/** Every pair the table states, in its order: figures as written, the change as printed. */
function pairTable(figure: Ready, caption: string): TableViewData {
  const pairs = [
    ...figure.groups.flatMap((one) => one.drawn.map((pair) => ({ pair, unit: one.unit }))),
    ...figure.unstated,
  ].sort((a, b) => a.pair.line - b.pair.line);
  return {
    caption,
    headers: [
      "Measure",
      "Unit",
      "Prior period",
      "Prior",
      "Current period",
      "Current",
      "Change",
      ...figure.otherPeriods,
    ],
    rows: pairs.map(({ pair, unit }) => [
      pair.label,
      unit,
      pair.priorPeriod ?? "",
      sideText(pair.prior, unit),
      pair.currentPeriod ?? "",
      sideText(pair.current, unit),
      pair.change ? (pair.change.sign === 0 ? "unchanged" : pair.change.text) : "",
      ...figure.otherPeriods.map(
        (name) => pair.others.find((other) => other.period === name)?.text ?? "",
      ),
    ]),
  };
}

/** The unit and, where every pair shares them, the two periods: what the figure is measured in. */
function kickerOf(figure: Ready) {
  const pairs = [
    ...figure.groups.flatMap((one) => one.drawn),
    ...figure.unstated.map((u) => u.pair),
  ];
  const [first] = pairs;
  const shared =
    first?.priorPeriod &&
    first.currentPeriod &&
    pairs.every(
      (pair) =>
        pair.priorPeriod === first.priorPeriod && pair.currentPeriod === first.currentPeriod,
    )
      ? `${first.priorPeriod} to ${first.currentPeriod}`
      : "Prior to current";
  const units = new Set(figure.groups.map((one) => one.unit));
  const [only] = [...units];
  return units.size === 1 && only ? `${shared}, ${only}` : shared;
}

/** One reason for a pair with no figure on either side: once where both sides say the same, else each with its period. */
function reasonOfPair({ pair }: Unstated) {
  if (pair.prior.text === pair.current.text) return pair.prior.text;
  return `${pair.priorPeriod ?? "Prior"}: ${pair.prior.text} \u00b7 ${pair.currentPeriod ?? "Current"}: ${pair.current.text}`;
}

/** The kind of the two periods a pair compares (`FY`, `Q1`): rows of another kind are never one line. */
const periodKind = (pair: Pair) =>
  [pair.priorPeriod, pair.currentPeriod]
    .map((label) => (label ? (changePeriod(label)?.form ?? label) : ""))
    .join(">");

/**
 * Pairs with no stated figure, one line each; pairs with the same unit, the same kind of period and
 * the same reason are one line, their labels joined with "; ", the reason once on the gap chip.
 */
function UnstatedList({ unstated }: { unstated: readonly Unstated[] }) {
  const lines = unstated.reduce<{ key: string; labels: string[]; reason: string }[]>(
    (found, item) => {
      const reason = reasonOfPair(item);
      const key = [item.unit, periodKind(item.pair), reason].join("|");
      const same = found.find((line) => line.key === key);
      if (same) same.labels.push(item.pair.label);
      else found.push({ key, labels: [item.pair.label], reason });
      return found;
    },
    [],
  );
  return (
    <ul aria-label="Not stated" className="flex flex-col divide-y divide-border-hairline">
      {lines.map((line) => (
        <li
          key={line.key + line.labels.join()}
          data-gap-line={line.labels.join("; ")}
          className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0"
        >
          <span className="text-small font-medium wrap-anywhere text-text-primary">
            {line.labels.join("; ")}
          </span>
          <GapChip reason={line.reason} />
        </li>
      ))}
    </ul>
  );
}

/** How tall a figure draws, in rows: a drawn pair is a row, the unstated pairs one line each. */
const sizeOf = (figure: Ready) =>
  figure.groups.reduce((sum, one) => sum + one.drawn.length, 0) +
  (figure.unstated.length > 0 ? 1 : 0);

function PairTile({
  props,
  figure,
  name,
  span,
  source,
}: {
  props: LeadProps;
  figure: Ready;
  name: string;
  span: 4 | 8 | 12;
  source: string;
}) {
  const several = figure.groups.length > 1;
  return (
    <FigureTile
      props={props}
      span={span}
      label={name}
      kicker={kickerOf(figure)}
      title={name}
      line={figure.line}
      source={source}
      notes={figure.notes}
      table={pairTable(figure, `${name}, every pair`)}
    >
      {figure.groups.map((one, at) => (
        <GroupRows
          key={`${one.unit}-${one.axis?.from ?? "none"}-${String(one.drawn[0]?.line ?? at)}`}
          group={one}
          several={several}
          legend={at === 0}
        />
      ))}
      {figure.groups.length === 0 && (
        <GapNote>This page could not read a figure for any pair.</GapNote>
      )}
      {figure.unstated.length > 0 && <UnstatedList unstated={figure.unstated} />}
    </FigureTile>
  );
}

// ---------------------------------------------------------------------------------------------

type Shown = Extract<Bridge, { kind: "bridge" }>;

/** Every step as the handoff states it, in its order; the module's own opening and closing are the totals. */
function waterfallRows(bridge: Shown): WaterfallRow[] {
  return bridge.steps.map((step) => ({
    kind: step.role === "opening" ? "level" : step.role === "closing" ? "closing" : "step",
    label: step.label,
    value: step.value,
    text: group(step.text),
  }));
}

/** Every step as the handoff states it: the amounts, no totals made here. */
function bridgeTable(bridge: Shown): TableViewData {
  return {
    caption: `${bridge.title}, every step`,
    headers: ["Step", "Role", `Amount${bridge.unit ? ` (${bridge.unit})` : ""}`],
    rows: bridge.steps.map((step) => [
      step.label,
      step.role === "change" ? "Change" : step.role === "opening" ? "Opening" : "Closing",
      group(step.text),
    ]),
  };
}

function BridgeTile({ props, bridge }: { props: LeadProps; bridge: Shown }) {
  return (
    <FigureTile
      props={props}
      span={12}
      label={bridge.title}
      kicker={`Prior to current${bridge.unit ? `, ${bridge.unit}` : ""}`}
      title={bridge.title}
      line={bridge.line}
      source={bridge.title}
      notes={bridge.notes}
      table={bridgeTable(bridge)}
    >
      <Measured fallback={640}>
        {(width) => (
          <Waterfall
            width={width}
            unit={bridge.unit || "unit not read"}
            axisStart="auto"
            rows={waterfallRows(bridge)}
            legend={{ level: "Opening", closing: "Closing" }}
          />
        )}
      </Measured>
    </FigureTile>
  );
}

/** A figure that cannot be drawn: the one gap pattern, with the true condition in words. */
function Gap({ name, children }: { name: string; children: string }) {
  return (
    <GapTile span={12} label={name} kicker={name}>
      {children}
    </GapTile>
  );
}

/**
 * Earnings delta: the variance bridge where the handoff has one that adds up, the prior and current
 * results in the handoff's own order as small multiples, and the margins and KPIs.
 */
export const EarningsDeltaLead: Lead = (props) => {
  const { bridges, movers, kpis } = earningsDelta(props.entry);
  const varianceRegister = hasVarianceRegister(props.entry);
  const nothing =
    bridges.length === 0 &&
    movers.kind === "gap" &&
    movers.reason === NO_RESULTS &&
    kpis.kind === "gap" &&
    kpis.reason === NO_KPIS;
  // Results and margins side by side (8 and 4) only when the margins are tall enough to leave no hole.
  const beside =
    movers.kind === "ready" && kpis.kind === "ready" && sizeOf(kpis) * 5 >= sizeOf(movers) * 3;
  // Only a step table drawn as a bridge is ours; one this page could not draw is listed as stated.
  const drawn = [
    ...DRAWN,
    ...bridges.flatMap((one) =>
      one.kind === "bridge" ? [one.heading.replace(/^Chart data:\s*/, "")] : [],
    ),
  ];
  return (
    <LeadFrame props={props}>
      {nothing ? (
        <Gap name="Earnings figures">{EMPTY}</Gap>
      ) : (
        <>
          {bridges.map((one) =>
            one.kind === "bridge" ? (
              <BridgeTile key={one.line} props={props} bridge={one} />
            ) : (
              <Gap key={one.line} name={`${one.title}, not drawn`}>
                {one.message}
              </Gap>
            ),
          )}
          {bridges.length === 0 && (
            <Gap name={BRIDGE_NAME}>
              {varianceRegister
                ? "The variance register is available in Statements and records; this module does not state a charted step bridge."
                : NO_BRIDGE}
            </Gap>
          )}
          {movers.kind === "ready" ? (
            <div className={beside ? "min-w-0 lg:col-span-12 xl:col-span-8" : "contents"}>
              <PairTile
                props={props}
                figure={movers}
                name={RESULTS_NAME}
                span={12}
                source="the prior and current results"
              />
            </div>
          ) : (
            <Gap name={RESULTS_NAME}>{movers.reason}</Gap>
          )}
          {kpis.kind === "ready" ? (
            // Beside the results only when about as tall and only from xl (1280 px): at lg the
            // 4-column tile is too narrow for a pair's two figures. Else under them, full width.
            <div
              className={
                beside
                  ? "min-w-0 self-start lg:col-span-12 xl:col-span-4"
                  : "min-w-0 lg:col-span-12"
              }
            >
              <PairTile
                props={props}
                figure={kpis}
                name={KPIS_NAME}
                span={12}
                source="the margin and KPI changes"
              />
            </div>
          ) : (
            <Gap name={KPIS_NAME}>{kpis.reason}</Gap>
          )}
        </>
      )}
      <UnreadFigures lead={props} drawn={drawn} />
    </LeadFrame>
  );
};

// The lead draws the variance bridge and both pair figures itself; any other chart table is listed as stated.
EarningsDeltaLead.draws = ["figures"] as const;
