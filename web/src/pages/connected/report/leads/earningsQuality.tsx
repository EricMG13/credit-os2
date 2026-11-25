import {
  chartTitleOf,
  readBridge,
  readLeverage,
  type Bridge,
  type Side,
} from "./earningsQualityData";
import { FigureTile, GapTile, LeadFrame } from "./kit/LeadFrame";
import {
  Dumbbell,
  Measured,
  Waterfall,
  type DumbbellSide,
  type LegendEntry,
  type WaterfallRow,
} from "./kit/marks";
import { group } from "./kit/numbers";
import { UnreadFigures } from "./kit/UnreadFigures";
import type { Lead, LeadProps } from "./types";

/*
 * CP-1D earnings quality lead. Synthetic contract: built from src/deploy_vii/bindings/cp1d.py and
 * src/deploy_workflow/owners/cp1d.py (the add-back bridge, the assessment T1D.2, the leverage table
 * T1D.6); no real CP-1D handoff has ever been retained, so this lead is unproven on a real run.
 * Support (supported / not supported) is drawn only where the assessment states a word for that
 * step's own name; it is never inferred. No sum, difference or comparison is stated in words:
 * the drawing places stated figures, and the table view lists them. The accepted share of a step is
 * one colour on every row, the not accepted share another. Any further `Chart data:` section of the
 * module is listed as stated by `UnreadFigures`, so no published chart is lost.
 */

/** Steps in the order stated: the opening level, each step with the parts the assessment states, the closing. */
function rowsOf(bridge: Bridge): WaterfallRow[] {
  const steps = bridge.changes.map((step): WaterfallRow => {
    const base = { kind: "step" as const, value: step.value, text: group(step.amount) };
    // "Partly supported" with no amounts has no part to draw: its word is in the label.
    const word = step.support === "Partly supported" && !step.split ? ` (${step.support})` : "";
    const unread = bridge.supportStated && step.support === null ? " (support not read)" : "";
    const label = `${step.label}${word}${unread}`;
    if (step.split)
      return {
        ...base,
        label,
        split: [
          {
            text: `${step.support ?? ""}${step.support ? ", accepted" : "Accepted"} ${group(step.split.accepted)}`,
            value: Number(step.split.accepted),
            tone: "primary",
          },
          {
            text: `Not accepted ${group(step.split.notAccepted)}`,
            value: Number(step.split.notAccepted),
            tone: "worse",
          },
        ],
      };
    if (step.support === "Supported")
      return {
        ...base,
        label,
        split: [{ text: step.support, value: step.value, tone: "primary" }],
      };
    if (step.support === "Not supported" || step.support === "Insufficient evidence")
      return { ...base, label, split: [{ text: step.support, value: step.value, tone: "worse" }] };
    return { ...base, label };
  });
  return [
    {
      kind: "level",
      label: bridge.opening.label,
      value: bridge.opening.value,
      text: group(bridge.opening.amount),
    },
    ...steps,
    {
      kind: "closing",
      label: bridge.closing.label,
      value: bridge.closing.value,
      text: group(bridge.closing.amount),
    },
  ];
}

/** The colours of the split, named: the one legend of the bridge besides the waterfall's own. */
function splitLegend(rows: readonly WaterfallRow[]): LegendEntry[] {
  const tones = new Set(
    rows.flatMap((row) => (row.kind === "step" ? (row.split ?? []).map((part) => part.tone) : [])),
  );
  return [
    ...(tones.has("primary")
      ? [{ kind: "square" as const, tone: "primary" as const, text: "Accepted" }]
      : []),
    ...(tones.has("worse")
      ? [{ kind: "square" as const, tone: "worse" as const, text: "Not accepted" }]
      : []),
  ];
}

function BridgeTile({ props, bridge }: { props: LeadProps; bridge: Bridge }) {
  const unit = bridge.unit;
  const rows = rowsOf(bridge);
  return (
    <FigureTile
      props={props}
      span={7}
      label="Earnings quality"
      kicker={unit}
      title="Earnings quality"
      line={bridge.line}
      source="the earnings-quality bridge"
      legend={splitLegend(rows)}
      notes={[
        ...(!bridge.supportStated ? ["This page could not read a support word for any step."] : []),
        ...bridge.notes,
      ]}
      table={{
        caption: "Earnings quality bridge",
        headers: ["Step", "Amount", "Unit", "Support stated", "Accepted", "Not accepted"],
        rows: [
          [bridge.opening.label, group(bridge.opening.amount), unit, "Not applicable", "", ""],
          ...bridge.changes.map((step) => [
            step.label,
            group(step.amount),
            unit,
            step.support ?? "Not stated",
            step.accepted ? group(step.accepted) : "Not stated",
            step.notAccepted ? group(step.notAccepted) : "Not stated",
          ]),
          [bridge.closing.label, group(bridge.closing.amount), unit, "Not applicable", "", ""],
        ],
      }}
    >
      <Measured fallback={640}>
        {(width) => (
          <Waterfall
            width={width}
            unit={unit}
            axisStart="auto"
            rows={rows}
            legend={{ level: bridge.opening.label, closing: bridge.closing.label }}
          />
        )}
      </Measured>
    </FigureTile>
  );
}

const sideOf = (side: Side): DumbbellSide =>
  "gap" in side ? { gap: side.gap } : { value: side.value, text: side.text };
const writtenOf = (side: Side) => ("gap" in side ? side.written : side.text);

function LeverageTile({ props }: { props: LeadProps }) {
  const leverage = readLeverage(props.entry);
  if (leverage.state === "gap")
    return (
      <GapTile span={5} label="Restated leverage" kicker="Restated leverage">
        {leverage.reason}
      </GapTile>
    );
  return (
    <FigureTile
      props={props}
      span={5}
      label="Restated leverage"
      kicker="Multiples of EBITDA, from zero"
      title="Restated leverage"
      line={leverage.line}
      source="restated leverage"
      table={{
        caption: "Leverage on the statements and on supported earnings",
        headers: ["Measure", "Statements", "Supported earnings"],
        rows: leverage.measures.map((item) => [
          item.measure,
          writtenOf(item.reported),
          writtenOf(item.restated),
        ]),
      }}
    >
      <Measured fallback={460}>
        {(width) => (
          <Dumbbell
            width={width}
            unit="multiples of EBITDA"
            periods={{ prior: "Statements", current: "Supported earnings" }}
            legend
            rows={leverage.measures.map((item) => ({
              label: item.measure,
              prior: sideOf(item.reported),
              current: sideOf(item.restated),
            }))}
          />
        )}
      </Measured>
    </FigureTile>
  );
}

function Content(props: LeadProps) {
  const bridge = readBridge(props.entry);
  const title = chartTitleOf(bridge.heading);
  return (
    <>
      {bridge.state === "ready" ? (
        <BridgeTile props={props} bridge={bridge} />
      ) : (
        <GapTile span={7} label="Earnings quality" kicker="Earnings quality">
          {bridge.reason}
          {bridge.stated.length > 0 &&
            ` Stated steps: ${bridge.stated.map((step) => `${step.label} ${step.text}`).join("; ")}`.replace(
              /\.*$/,
              ".",
            )}
        </GapTile>
      )}
      <LeverageTile props={props} />
      {/* Every other chart the module publishes is listed as stated. */}
      <UnreadFigures lead={props} drawn={title ? [title] : []} />
    </>
  );
}

/** CP-1D: the earnings-quality bridge from reported to adjusted EBITDA, and leverage restated on supported earnings. */
export const EarningsQualityLead: Lead = function EarningsQualityLead(props) {
  return (
    <LeadFrame props={props}>
      <Content {...props} />
    </LeadFrame>
  );
};
// The lead draws the module's bridge figure itself, with its own gap tile when it is absent.
EarningsQualityLead.draws = ["figures"];
