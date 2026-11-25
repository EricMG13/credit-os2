import type { TableViewData } from "../kit/LeadFrame";
import {
  waterfallAxis,
  waterfallReading,
  type WaterfallPrior,
  type WaterfallRow,
} from "../kit/marks";
import { group } from "../kit/numbers";
import type { CashLadder, LadderStep, PeriodCell } from "./foundationData";
import { written } from "./periodsData";

// The cash ladder as the kit Waterfall draws it: the handoff's own stated levels and deductions in
// the data's order, each figure as written. No plug, no end level, no sum is made here; the
// Waterfall places a deduction from the bar above it only where both are stated, and draws each
// level from zero at its stated value, so a level the deductions above do not reach shows as written.

/**
 * The ladders drawn: `current` (with `prior` beneath it when exactly two periods are compared) and
 * `others`, each further stated period drawn as a ladder of its own, latest first.
 */
export type LadderPeriods = { current: string; prior: string | null; others: string[] };

/**
 * One period: bars only. Two compared periods: the later as bars, the earlier beneath. Any other
 * set: every stated period is drawn, the latest first, each as its own ladder.
 */
export function ladderPeriods(data: CashLadder): LadderPeriods | null {
  const labels = data.periods.map((period) => period.label);
  const current = data.comparison?.to ?? labels.at(-1);
  if (current === undefined) return null;
  const prior = labels.length === 2 && data.comparison ? data.comparison.from : null;
  const others = labels.filter((label) => label !== current && label !== prior).reverse();
  return { current, prior, others };
}

/** One ladder's periods: a period on its own, nothing beneath it. */
export const alone = (period: string): LadderPeriods => ({
  current: period,
  prior: null,
  others: [],
});

type Side = { value: number; text: string } | { gap: string };

/**
 * One step in one period as the ladder draws it. A deduction the module writes as a positive
 * amount paid (cash interest, cash taxes) falls: its geometry is negative, its text is the figure
 * as written, with no sign the module did not write. Every other figure keeps the sign it is
 * written with. A stated gap or words keep their own text; no cell, "Not read for …".
 */
function sideOf(step: LadderStep, cell: PeriodCell | undefined, period: string): Side {
  const reading = cell?.cell;
  if (!reading) return { gap: `This page could not read ${period} for this row.` };
  if (reading.kind !== "number") return { gap: written(reading.text) };
  if (step.sign !== "paid" || reading.value === 0)
    return { value: reading.value, text: group(reading.text) };
  return { value: -reading.value, text: group(reading.text) };
}

const cellAt = (step: LadderStep, period: string) =>
  step.values.find((value) => value.label === period);

/** A side the drawing places beneath: an earlier gap names its period. */
const priorOf = (side: Side, period: string): WaterfallPrior =>
  "gap" in side ? { gap: `${period}: ${side.gap}` } : side;

/** Each step as a Waterfall row: a level or a deduction as written, or a gap with its reason. */
export function ladderRows(data: CashLadder, periods: LadderPeriods): WaterfallRow[] {
  return data.steps.map((step): WaterfallRow => {
    const label = written(step.label);
    const role = step.kind === "level" ? "level" : "step";
    if (!step.stated)
      return { kind: "gap", label, reason: written(step.absent ?? "Not stated."), of: role };
    const current = sideOf(step, cellAt(step, periods.current), periods.current);
    const prior =
      periods.prior === null ? null : sideOf(step, cellAt(step, periods.prior), periods.prior);
    if ("gap" in current) {
      // The same stated gap in both periods is said once, naming both.
      const same = prior !== null && "gap" in prior && prior.gap === current.gap;
      const reason = same
        ? `${current.gap} (${periods.prior ?? ""} and ${periods.current})`
        : current.gap;
      return {
        kind: "gap",
        label,
        reason,
        of: role,
        ...(prior && !same && periods.prior ? { prior: priorOf(prior, periods.prior) } : {}),
      };
    }
    return {
      kind: role,
      label,
      value: current.value,
      text: current.text,
      // A step's figure prints as the module wrote it; its direction is the bar's.
      ...(role === "step" ? { asWritten: true as const } : {}),
      ...(prior && periods.prior ? { prior: priorOf(prior, periods.prior) } : {}),
    };
  });
}

/** The kicker: what the figure is in and which periods are drawn. */
export function ladderKicker(data: CashLadder, periods: LadderPeriods) {
  if (periods.others.length)
    return `Cash conversion · ${data.unit}, ${[periods.current, ...periods.others].join(", ")}`;
  const beneath = periods.prior ? `; ${periods.prior} beneath` : "";
  return `Cash conversion · ${data.unit}, ${periods.current}${beneath}`;
}

/** The figure's reading: every row of the drawn period with its figure, the earlier in brackets. */
export function ladderReading(
  rows: readonly WaterfallRow[],
  data: CashLadder,
  periods: LadderPeriods,
) {
  const reading = waterfallReading(
    rows,
    data.unit,
    waterfallAxis(rows),
    periods.prior ?? undefined,
  );
  const head = `Waterfall, ${data.unit}: `;
  const beneath = periods.prior ? `, ${periods.prior} in brackets` : "";
  return `Cash conversion, ${data.unit}, ${periods.current}${beneath}: ${reading.slice(head.length)}`;
}

/** The words at a break: a stated level the steps above it do not reach. */
export const LEVELS_AS_STATED = "Levels as stated; the steps between them are not all stated.";

/**
 * True when some stated level is not where the stated steps above it end (or the steps between
 * two levels are not all stated). Nothing is printed from the comparison: only the words above.
 */
export function levelsBreak(rows: readonly WaterfallRow[]) {
  let running: number | null = null;
  let stepped = false;
  for (const row of rows) {
    if (row.kind === "gap") {
      running = null;
      stepped = false;
    } else if (row.kind === "step") {
      if (running !== null) running += row.value;
      stepped = true;
    } else {
      if (stepped && running !== null && Math.abs(running - row.value) > 1e-9) return true;
      running = row.value;
      stepped = false;
    }
  }
  return false;
}

/** True when every row of a period is a stated gap: it is written as its reason, not drawn. */
export const allGaps = (rows: readonly WaterfallRow[]) =>
  rows.length > 0 && rows.every((row) => row.kind === "gap");

/**
 * True when the Waterfall would place at least one bar for these rows: a stated level, or a step
 * that follows a stated level or step (a gap row, or a step with nothing stated above it, breaks
 * the walk), in the drawn period or in the earlier one beneath it.
 */
function placesBar(rows: readonly WaterfallRow[]) {
  let running: boolean = true;
  let earlier: boolean = true;
  for (const row of rows) {
    if (row.kind === "gap") running = false;
    else if (row.kind !== "step") return true;
    else if (running) return true;
    const prior = row.prior;
    const role = row.kind === "gap" ? row.of : row.kind;
    if (!prior || "gap" in prior || role === undefined) earlier = false;
    else if (role !== "step" || earlier) return true;
  }
  return false;
}

/** True when no drawn ladder places a bar: there is nothing to put on an axis. */
export const noBar = (ladders: readonly (readonly WaterfallRow[])[]) => !ladders.some(placesBar);

const NOT_PLACED = "not placed, an earlier step is not stated";

export type UnplacedItem =
  { kind: "figure"; text: string } | { kind: "gap"; reason: string; labels: string[] };

/**
 * Every row in handoff order where no bar can be placed: a stated figure as written with its
 * period and why it is not placed, once per period; the stated gaps as lines, the rows that share
 * one reason merged (labels joined by "; ") into the line of the first.
 */
export function unplacedItems(
  ladders: readonly { periods: LadderPeriods; rows: readonly WaterfallRow[] }[],
): UnplacedItem[] {
  const items: UnplacedItem[] = [];
  const figure = (label: string, text: string, period: string) => {
    const line = `${label} ${text}, ${period}: ${NOT_PLACED}`;
    if (!items.some((item) => item.kind === "figure" && item.text === line))
      items.push({ kind: "figure", text: line });
  };
  const gap = (label: string, reason: string) => {
    const same = items.find((item) => item.kind === "gap" && item.reason === reason);
    if (!same) items.push({ kind: "gap", reason, labels: [label] });
    else if (same.kind === "gap" && !same.labels.includes(label)) same.labels.push(label);
  };
  for (const { periods, rows } of ladders)
    for (const row of rows) {
      if (row.kind === "gap") gap(row.label, row.reason);
      else figure(row.label, row.text, periods.current);
      if (row.prior && "gap" in row.prior) gap(row.label, row.prior.gap);
      else if (row.prior && periods.prior) figure(row.label, row.prior.text, periods.prior);
    }
  return items;
}

/** The distinct reasons of an all-gap period, in order, as written. */
export const gapReasons = (rows: readonly WaterfallRow[]) => [
  ...new Set(rows.flatMap((row) => (row.kind === "gap" ? [row.reason] : []))),
];

const KIND = {
  level: "Level",
  paid: "Deduction, as paid",
  signed: "Deduction, signed",
} as const;

function cellText(step: LadderStep, cell: PeriodCell | undefined) {
  if (!step.stated) return written(step.absent ?? "Not stated.");
  const reading = cell?.cell;
  if (!reading) return "Not stated";
  return reading.kind === "number" ? group(reading.text) : written(reading.text);
}

/** The table view: every step and every stated period, as the module wrote them. */
export function ladderTable(data: CashLadder): TableViewData {
  return {
    caption: `Cash conversion, ${data.unit}`,
    headers: ["Step", ...data.periods.map((period) => period.label), "Kind"],
    rows: data.steps.map((step) => [
      written(step.label),
      ...data.periods.map((period) => cellText(step, cellAt(step, period.label))),
      step.kind === "level" ? KIND.level : KIND[step.sign ?? "signed"],
    ]),
  };
}
