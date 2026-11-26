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
import { unitLabel, writtenUnit } from "../../publishedReport";
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
    const unread =
      bridge.supportStated && step.support === null && !step.stance ? " (support not read)" : "";
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
    // The bridge's own support cell, in the module's words: a rejected step is the signal colour,
    // a challenged one the second colour, so an unresolved step is not drawn as a rejection.
    const tone = /^reject/i.test(step.stance)
      ? "worse"
      : /^challeng/i.test(step.stance)
        ? "secondary"
        : /^support/i.test(step.stance)
          ? "primary"
          : null;
    if (tone) return { ...base, label, split: [{ text: step.stance, value: step.value, tone }] };
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
function splitLegend(bridge: Bridge): LegendEntry[] {
  // Only the accepted / not accepted parts are named here; a step's own support words are on the bar.
  const tones = new Set(bridge.changes.flatMap((step) => (step.split ? ["primary", "worse"] : [])));
  return [
    ...(tones.has("primary")
      ? [{ kind: "square" as const, tone: "primary" as const, text: "Accepted" }]
      : []),
    ...(tones.has("worse")
      ? [{ kind: "square" as const, tone: "worse" as const, text: "Not accepted" }]
      : []),
  ];
}

/** A stated step's amount with the money unit it ends in drawn as the currency's symbol ("$200m"). */
const statedUnit = (text: string) =>
  text.replace(/^(.+) ((?:USD|US\$|[A-Z]{3})(?: millions|m))$/, (_, amount: string, unit: string) =>
    writtenUnit(amount, unit),
  );

function BridgeTile({ props, bridge }: { props: LeadProps; bridge: Bridge }) {
  const unit = unitLabel(bridge.unit);
  const rows = rowsOf(bridge);
  const withBasis = bridge.changes.some((step) => step.basis !== "");
  return (
    <FigureTile
      props={props}
      span={7}
      label="Earnings quality"
      kicker={unit}
      title="Earnings quality"
      line={bridge.line}
      source="the earnings-quality bridge"
      legend={splitLegend(bridge)}
      notes={[
        ...(!bridge.supportStated ? ["This page could not read a support word for any step."] : []),
        ...bridge.notes,
      ]}
      table={{
        caption: "Earnings quality bridge",
        headers: [
          "Step",
          "Amount",
          "Unit",
          "Support stated",
          "Accepted",
          "Not accepted",
          ...(withBasis ? ["Basis"] : []),
        ],
        rows: [
          [
            bridge.opening.label,
            group(bridge.opening.amount),
            unit,
            "Not applicable",
            "",
            "",
            ...(withBasis ? [""] : []),
          ],
          ...bridge.changes.map((step) => [
            step.label,
            group(step.amount),
            unit,
            step.support ?? (step.stance || "Not stated"),
            step.accepted ? group(step.accepted) : "Not stated",
            step.notAccepted ? group(step.notAccepted) : "Not stated",
            ...(withBasis ? [step.basis] : []),
          ]),
          [
            bridge.closing.label,
            group(bridge.closing.amount),
            unit,
            "Not applicable",
            "",
            "",
            ...(withBasis ? [""] : []),
          ],
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
const writtenOf = (side: Side) => ("gap" in side ? side.written : (side.written ?? side.text));

function LeverageTile({ props }: { props: LeadProps }) {
  const leverage = readLeverage(props.entry);
  if (leverage.state === "gap")
    return (
      <GapTile span={5} label="Restated leverage" kicker="Restated leverage">
        {leverage.reason}
      </GapTile>
    );
  const others = leverage.others ?? [];
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
        caption: `Leverage on ${leverage.labels.reported} and on ${leverage.labels.restated}`,
        headers: [
          "Measure",
          leverage.labels.reported,
          ...others.map((basis) => basis.label),
          leverage.labels.restated,
          ...(leverage.deltaLabel ? [leverage.deltaLabel] : []),
        ],
        rows: leverage.measures.map((item) => [
          item.measure,
          writtenOf(item.reported),
          ...(item.others ?? []).map(writtenOf),
          writtenOf(item.restated),
          ...(leverage.deltaLabel ? [item.delta ?? ""] : []),
        ]),
      }}
    >
      <Measured fallback={460}>
        {(width) => (
          <>
            <Dumbbell
              width={width}
              unit="multiples of EBITDA"
              periods={{ prior: leverage.labels.reported, current: leverage.labels.restated }}
              legend
              {...(others.length > 0
                ? { caption: `${leverage.labels.reported} against ${leverage.labels.restated}` }
                : {})}
              rows={leverage.measures.map((item) => ({
                label: item.measure,
                prior: sideOf(item.reported),
                current: sideOf(item.restated),
              }))}
            />
            {others.map((basis, at) => (
              <Dumbbell
                key={basis.label}
                width={width}
                unit="multiples of EBITDA"
                periods={{ prior: basis.label, current: leverage.labels.restated }}
                legend
                caption={`${basis.label} against ${leverage.labels.restated}`}
                rows={leverage.measures.flatMap((item) => {
                  const other = item.others?.[at];
                  // With one further basis the table's delta is that comparison, as written.
                  const delta = others.length === 1 && item.delta ? { change: item.delta } : {};
                  return other
                    ? [
                        {
                          label: item.measure,
                          prior: sideOf(other),
                          current: sideOf(item.restated),
                          ...delta,
                        },
                      ]
                    : [];
                })}
              />
            ))}
          </>
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
            ` Stated steps: ${bridge.stated.map((step) => `${step.label} ${statedUnit(step.text)}`).join("; ")}`.replace(
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
