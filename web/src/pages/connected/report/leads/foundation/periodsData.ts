import type { OutputEntry } from "../../../publishedReport";
import type { Reading } from "../kit/numbers";
import { safeText } from "../kit/reader";
import type { Period } from "../kit/tables";
import {
  cashLadder,
  earningsAgainstDebt,
  netDebtView,
  segmentView,
  statedPeriods,
  type PeriodCell,
} from "./foundationData";

// What the period strip draws: every period the CP-1 figure tables state, read from the figures'
// own data (`foundationData`), and per figure whether a period carries stated numbers, only stated
// gaps (with their words), only words, or nothing. Nothing is assumed: a period is "stated" only
// where a cell states a number for it.

/** A cell the module writes as "source dash" is drawn as "—"; every other cell as written. */
export const dashed = (text: string) =>
  /^Not (?:supplied|calculated):\s*source dash\.?$/i.test(text.trim()) ? "—" : text;

/** Handoff words for the page: a "source dash" as "—", a cited source left to Evidence. */
export const written = (text: string) => dashed(safeText(text));

/** How one figure (or the lead) states one period. */
export type PeriodState =
  { kind: "figures" } | { kind: "gap"; reasons: string[] } | { kind: "words" } | { kind: "none" };

type FigurePeriods = { figure: string; states: Record<string, PeriodState> };

export type StripPeriod = {
  label: string;
  year: number;
  /** "unstated": a year between two stated years that no table states. */
  state: PeriodState | { kind: "unstated" };
  /** "Partly": numbers in one figure, only gaps in another. */
  partly: boolean;
  compared: "from" | "to" | null;
};

export type PeriodStrip = {
  /** The periods on the time axis: the annual periods (or every period when none is annual). */
  axis: StripPeriod[];
  /** Periods of another kind (LTM, quarters) beside annual ones: listed apart, with their figures. */
  apart: { label: string; figures: string[] }[];
  comparison: { from: string; to: string } | null;
  figures: FigurePeriods[];
  /** The periods some figure states a number for, in axis order then the apart ones. */
  shown: string[];
  /** Figure tables whose periods cannot be read, with the reason. */
  gaps: { table: string; reason: string }[];
  /** False when the periods cannot be put in time order: they are as first stated, none compared. */
  ordered: boolean;
  line: number | null;
};

type Cells = { label: string; cell: Reading | null }[];

const fromValues = (values: readonly PeriodCell[]): Cells =>
  values.map(({ label, cell }) => ({ label, cell }));

/** Each figure's cells by period, from the figure's own reader; a figure that cannot draw is left out. */
function figureCells(entry: OutputEntry): { figure: string; cells: Cells; line: number }[] {
  const out: { figure: string; cells: Cells; line: number }[] = [];
  const earnings = earningsAgainstDebt(entry);
  if (earnings)
    out.push({
      figure: "Earnings against debt",
      cells: [
        ...earnings.measures.flatMap((measure) => fromValues(measure.values)),
        ...(earnings.leverage ? fromValues(earnings.leverage.values) : []),
      ],
      line: earnings.tableLine,
    });
  const ladder = cashLadder(entry);
  if (ladder)
    out.push({
      figure: "Cash conversion",
      cells: ladder.steps.flatMap((step) => (step.stated ? fromValues(step.values) : [])),
      line: ladder.line,
    });
  const net = netDebtView(entry);
  if (net)
    out.push({
      figure: "Net debt",
      cells: [
        ...net.periods.flatMap((period) =>
          [period.gross, period.cash, period.net, period.leverage].map((cell) => ({
            label: period.label,
            cell,
          })),
        ),
        ...net.liquidity.flatMap((period) =>
          [period.cash, period.undrawn].map((cell) => ({ label: period.label, cell })),
        ),
      ],
      line: net.tableLine,
    });
  const segments = segmentView(entry);
  if (segments)
    out.push({
      figure: "Segments",
      cells: [...segments.segments, ...segments.apart].flatMap((segment) => [
        ...fromValues(segment.sales),
        ...fromValues(segment.ebitda),
      ]),
      line: segments.tableLine,
    });
  return out;
}

/** A period's state from its cells: numbers, else only gaps (their words, each once), else words. */
export function stateOf(cells: readonly (Reading | null)[]): PeriodState {
  const stated = cells.filter((cell): cell is Reading => cell !== null);
  if (stated.some((cell) => cell.kind === "number")) return { kind: "figures" };
  const gaps = stated.flatMap((cell) => (cell.kind === "gap" ? [safeText(cell.text)] : []));
  if (gaps.length) return { kind: "gap", reasons: [...new Set(gaps)] };
  return stated.length ? { kind: "words" } : { kind: "none" };
}

/** Years between the first and the last stated annual year that no table states, for a true axis. */
function withUnstated(periods: readonly Period[]): (Period & { unstated?: true })[] {
  const first = periods[0];
  const last = periods.at(-1);
  const prefix = first ? /^(\D*)\d{4}$/.exec(first.label)?.[1] : undefined;
  if (!first || !last || prefix === undefined || last.year - first.year > 12) return [...periods];
  const years = Array.from({ length: last.year - first.year + 1 }, (_, at) => first.year + at);
  return years.flatMap((year) => {
    const found = periods.filter((period) => period.year === year);
    return found.length
      ? found
      : [
          {
            label: `${prefix}${String(year)}`,
            year,
            form: first.form,
            kind: first.kind,
            unstated: true as const,
          },
        ];
  });
}

/** The strip: the stated periods on a time axis, each figure's state per period, and what is apart. */
export function periodStrip(entry: OutputEntry): PeriodStrip {
  const stated = statedPeriods(entry);
  const found = figureCells(entry);
  const figures: FigurePeriods[] = found.map(({ figure, cells }) => ({
    figure,
    states: Object.fromEntries(
      stated.labels.map((label) => [
        label,
        stateOf(cells.filter((cell) => cell.label === label).map((cell) => cell.cell)),
      ]),
    ),
  }));
  /** The lead's state for a period: numbers in any figure, else every figure's gaps, else words. */
  const overall = (label: string): PeriodState => {
    const states = figures.map((figure) => figure.states[label]);
    if (states.some((state) => state?.kind === "figures")) return { kind: "figures" };
    const reasons = states.flatMap((state) => (state?.kind === "gap" ? state.reasons : []));
    if (reasons.length) return { kind: "gap", reasons: [...new Set(reasons)] };
    return states.some((state) => state?.kind === "words") ? { kind: "words" } : { kind: "none" };
  };
  const partly = (label: string) =>
    figures.some((figure) => figure.states[label]?.kind === "figures") &&
    figures.some((figure) => figure.states[label]?.kind === "gap");
  const annual = stated.periods.filter((period) => period.kind === "annual");
  const onAxis = annual.length ? annual : stated.periods;
  const apartPeriods = annual.length
    ? stated.periods.filter((period) => period.kind !== "annual")
    : [];
  const compared = (label: string) =>
    stated.comparison?.from === label ? "from" : stated.comparison?.to === label ? "to" : null;
  const axis = (stated.ordered ? withUnstated(onAxis) : onAxis).map((period): StripPeriod => ({
    label: period.label,
    year: period.year,
    state: "unstated" in period ? { kind: "unstated" } : overall(period.label),
    partly: "unstated" in period ? false : partly(period.label),
    compared: compared(period.label),
  }));
  const apart = apartPeriods.map((period) => ({
    label: period.label,
    figures: figures
      .filter((figure) => figure.states[period.label]?.kind === "figures")
      .map((figure) => figure.figure),
  }));
  const shown = [
    ...axis.filter((period) => period.state.kind === "figures").map((period) => period.label),
    ...apart.filter((period) => period.figures.length).map((period) => period.label),
  ];
  return {
    axis,
    apart,
    comparison: stated.comparison,
    figures,
    shown,
    gaps: stated.gaps,
    ordered: stated.ordered,
    line: found[0]?.line ?? null,
  };
}

/**
 * The caption line that stands in for the Periods tile when the figures state at most two periods,
 * each of the annual kind with numbers in every figure and no stated gap: "Each figure in its
 * stated period: FY2023, FY2024". Null when the full strip is needed (three or more periods, a
 * period of another kind, a period stated only or partly as gaps, or a table whose periods cannot
 * be read).
 */
export function periodsCaption(entry: OutputEntry): string | null {
  const strip = periodStrip(entry);
  const plain =
    strip.axis.length > 0 &&
    strip.axis.length <= 2 &&
    strip.apart.length === 0 &&
    strip.gaps.length === 0 &&
    strip.ordered &&
    strip.axis.every((period) => period.state.kind === "figures" && !period.partly);
  return plain
    ? `Each figure in its stated period: ${strip.axis.map((p) => p.label).join(", ")}`
    : null;
}
