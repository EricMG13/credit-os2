import { periodGapNote } from "@/components/chart/seriesData";
import { orderPeriods, parsePeriod } from "@/utils/periodOrder";

export interface ScenarioPeriodObservation {
  period: string;
  group: string;
  start?: string;
  end?: string;
}

interface ComparableScenarioPeriod {
  period: string;
  groups: string[];
  start?: string;
  end?: string;
}

/** A forecast period, as the one period rule reads the label: `FY2025E`, `26E`, `Budget 2026`. */
export function isForecastPeriod(period: string) {
  return parsePeriod(period)?.periodClass === "forecast";
}

/** The fiscal year of an actual (`FY2024`) or forecast (`FY2025E`) label that the period rule
 * reads as one whole year; null for any other period (a quarter, a last twelve months). */
export function fiscalYear(label: string) {
  const parsed = parsePeriod(label);
  const whole = parsed?.span === "year" && ["actual", "forecast"].includes(parsed.periodClass);
  return whole ? (parsed.end?.[0] ?? null) : null;
}

/** What a label writes before the year it names ("FY", "FY ", nothing), so that a year with no
 * row can be named as its neighbours are; nothing where the label does not write the year out. */
export function yearPrefix(label: string, year: number) {
  const at = label.indexOf(String(year));
  return at < 0 ? "" : label.slice(0, at);
}

/** Period labels in the one period order; a label the rule cannot read stays last, as written. */
export function periodsInOrder(periods: readonly string[]) {
  return orderPeriods(periods, (period) => period).ordered;
}

/** Periods joined in reader words: "FY2025E", "FY2025E and FY2027E", "A, B and C". */
export function periodList(periods: readonly string[]) {
  if (periods.length < 2) return periods.join("");
  return `${periods.slice(0, -1).join(", ")} and ${periods.at(-1) ?? ""}`;
}

/** One published cell of a row, as a chart reads it: its period, its text and its figure. */
type PeriodCell = { period: string; display: string; value: number | null; reason: string };

/** What a row publishes outside the forecast and a chart does not draw. */
export type HistoryGaps<T extends PeriodCell = PeriodCell> = {
  /** Columns that state no figure: those in period order, then those the rule cannot place. */
  blank: T[];
  /** Periods the grid publishes more than once. */
  repeated: string[];
};

/**
 * A row's cells outside the forecast. `history` is every actual, year to date, last twelve months
 * and pro forma column that states a figure, in the one period order, drawn before the forecast.
 * `unplaced` are the figures under a label the period rule cannot read, as authored: a chart draws
 * them last, after the forecast, and says so (`unplacedNote`). `gaps` are what is not drawn: a
 * column with no figure, and a period published twice (which figure is right is not guessed).
 */
export function historyOf<T extends PeriodCell>(cells: readonly T[]) {
  const outside = cells.filter(({ period }) => !isForecastPeriod(period));
  const count = (cell: T) => outside.filter((other) => other.period === cell.period).length;
  const { ordered, gaps: unread } = orderPeriods(
    outside.filter((cell) => count(cell) === 1),
    ({ period }) => period,
  );
  const figures = ordered.filter(({ value }) => value !== null);
  const gaps: HistoryGaps<T> = {
    blank: ordered.filter(({ value }) => value === null),
    repeated: [...new Set(outside.filter((cell) => count(cell) > 1).map(({ period }) => period))],
  };
  return {
    history: figures.filter((cell) => !unread.includes(cell)),
    unplaced: figures.filter((cell) => unread.includes(cell)),
    gaps,
  };
}

/** What a chart says of the figures it draws last because their labels cannot be placed in time
 * (the wording of every period chart: `periodGapNote`). Nothing when there are none. */
export function unplacedNote(unplaced: readonly { period: string }[]) {
  const note = periodGapNote(unplaced.map(({ period }) => period));
  return note ? [note] : [];
}

/**
 * What the reader is told of the periods outside the forecast that a chart does not draw, each
 * fact once: a column with no figure (its reason as written) and a period published twice. A
 * label the rule cannot read is not known to come before the forecast, so it is not said to.
 * `drawn` are blank periods the chart does show and says so itself.
 */
export function historyNotes(
  { blank, repeated }: HistoryGaps,
  drawn: ReadonlySet<string> = new Set(),
) {
  const notes = (read: boolean, where: string, twice: string) => {
    const mine = (period: string) => (parsePeriod(period) !== null) === read;
    const undrawn = blank.filter(({ period }) => mine(period) && !drawn.has(period));
    const unexplained = undrawn.filter(({ reason }) => !reason).map(({ period }) => period);
    const again = repeated.filter(mine);
    return [
      ...undrawn.flatMap(({ period, reason }) =>
        reason ? [`${where}, ${period}: ${reason}.`] : [],
      ),
      ...(unexplained.length ? [`${where}, no figure for ${periodList(unexplained)}.`] : []),
      ...(again.length ? [`${twice}, so not drawn: ${periodList(again)}.`] : []),
    ];
  };
  return [
    ...notes(true, "Before the forecast", "Published more than once before the forecast"),
    ...notes(false, "Not placed in time order", "Published more than once"),
  ];
}

const MODULE_CODE = /\bCP-[A-Z0-9]+/iu;
const ORDINALS = [
  "",
  ...["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"],
  ...["tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth"],
  ...["seventeenth", "eighteenth", "nineteenth"],
];
const CARDINALS = [
  "",
  ...["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"],
  ...["twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"],
];
const TENS = ["", "", "twent", "thirt", "fort", "fift", "sixt", "sevent", "eight", "ninet"];

/** A whole number from 1 in words, as a count ("twenty-one") or a position ("twenty-first"). */
function numberWord(value: number, position: boolean): string {
  const [units, hundreds] = [value % 100, Math.floor(value / 100)];
  if (hundreds > 0) {
    const rest = units ? ` and ${numberWord(units, position)}` : position ? "th" : "";
    return `${numberWord(hundreds, false)} hundred${rest}`;
  }
  const words = position ? ORDINALS : CARDINALS;
  if (units < 20) return words[units] ?? "";
  const stem = TENS[Math.floor(units / 10)] ?? "";
  if (units % 10 === 0) return position ? `${stem}ieth` : `${stem}y`;
  return `${stem}y-${words[units % 10] ?? ""}`;
}

const byText = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);

/** One distinct reader name per group. A group whose label no other group shares is shown as
 * that label, unchanged. Groups that share a label are told apart by `suffix(group)` (reader text
 * the caller supplies; the raw group when none is given). Where that suffix is empty, repeats the
 * label, holds a module code or is another group's suffix too, the group takes a worded ordinal
 * instead ("second case"): its place among the groups sharing the label, ordered by raw group.
 * Nothing else is added to a name, so no digit or module code is. The names depend on the whole
 * set of groups: name a model's groups once, together. */
export function scenarioGroupLabels(
  groups: string[],
  label: (group: string) => string,
  suffix: (group: string) => string = (group) => group,
) {
  const names = new Map(groups.map((group) => [group, label(group)]));
  const sharing = new Map<string, string[]>();
  for (const [group, shared] of names) sharing.set(shared, [...(sharing.get(shared) ?? []), group]);
  const taken = new Set(
    [...sharing].flatMap(([shared, members]) => (members.length === 1 ? [shared] : [])),
  );
  for (const [shared, members] of [...sharing].sort(([left], [right]) => byText(left, right))) {
    if (members.length === 1) continue;
    members.sort(byText);
    const suffixes = members.map((group) => suffix(group).trim());
    const ordinal = (place: number) => `${shared} · ${numberWord(place, true)} case`;
    members.forEach((group, index) => {
      const detail = suffixes[index] ?? "";
      const suffixed = `${shared} · ${detail}`;
      const distinct =
        detail !== "" &&
        detail !== shared &&
        !MODULE_CODE.test(detail) &&
        suffixes.indexOf(detail) === suffixes.lastIndexOf(detail) &&
        !taken.has(suffixed);
      let name = distinct ? suffixed : ordinal(index + 1);
      // A name another group already has is never reused: the next free place is taken instead.
      for (let place = members.length + 1; taken.has(name); place += 1) name = ordinal(place);
      taken.add(name);
      names.set(group, name);
    });
  }
  return names;
}

function byForecastPeriod<T extends ScenarioPeriodObservation>(observations: T[]) {
  const byPeriod = new Map<string, T[]>();
  for (const observation of observations) {
    if (!isForecastPeriod(observation.period)) continue;
    const list = byPeriod.get(observation.period) ?? [];
    list.push(observation);
    byPeriod.set(observation.period, list);
  }
  return byPeriod;
}

function validDate(value: string) {
  const timestamp = Date.parse(value);
  return (
    /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function validSpan(start: string, end: string) {
  return validDate(start) && validDate(end) && Date.parse(start) <= Date.parse(end);
}

function comparablePeriod(
  period: string,
  candidates: ScenarioPeriodObservation[],
  groups: Set<string>,
): ComparableScenarioPeriod | null {
  const legacyBasis = candidates.every(({ start, end }) => !start && !end);
  const datedBasis = candidates.every(({ start, end }) =>
    Boolean(start && end && validSpan(start, end)),
  );
  const sameBasis =
    new Set(candidates.map(({ start, end }) => `${start ?? ""}\0${end ?? ""}`)).size === 1;
  if (!legacyBasis && !(datedBasis && sameBasis)) return null;
  const first = candidates[0];
  return {
    period,
    groups: [...groups],
    ...(first?.start && first.end ? { start: first.start, end: first.end } : {}),
  };
}

/** Shared source identity and eligibility for columns used as scenario observations. With more
 * than one scenario, a period only one of them publishes is kept when its own basis is valid (its
 * `groups` names that one scenario); with a single scenario there is no comparison period.
 * Two separate facts are reported for notices: which periods were excluded and why
 * (`ambiguousPeriods`: a scenario publishes the period more than once; `incompatiblePeriods`: its
 * recorded dates do not match between scenarios, or are incomplete or invalid), and `noSharedPeriod`:
 * several scenarios publish periods and no kept period belongs to two of them. */
export function analyzeScenarioPeriods<T extends ScenarioPeriodObservation>(observations: T[]) {
  const byPeriod = byForecastPeriod(observations);
  const severalScenarios = scenarioCount(byPeriod) > 1;
  const periods: ComparableScenarioPeriod[] = [];
  const uniqueObservations: T[] = [];
  const ambiguousPeriods: string[] = [];
  const incompatiblePeriods: string[] = [];
  for (const [period, candidates] of byPeriod) {
    const groups = new Set(candidates.map(({ group }) => group));
    if (groups.size !== candidates.length) {
      ambiguousPeriods.push(period);
      const counts = new Map<string, number>();
      for (const { group } of candidates) counts.set(group, (counts.get(group) ?? 0) + 1);
      uniqueObservations.push(...candidates.filter(({ group }) => counts.get(group) === 1));
      continue;
    }
    uniqueObservations.push(...candidates);
    if (!severalScenarios) continue;
    const comparison = comparablePeriod(period, candidates, groups);
    if (comparison) periods.push(comparison);
    else incompatiblePeriods.push(period);
  }
  const inOrder = orderPeriods(periods, ({ period }) => period).ordered;
  const noSharedPeriod = severalScenarios && !inOrder.some(({ groups }) => groups.length > 1);
  return {
    periods: inOrder,
    uniqueObservations,
    ambiguousPeriods,
    incompatiblePeriods,
    noSharedPeriod,
  };
}

type ScenarioPeriodFacts = Pick<
  ReturnType<typeof analyzeScenarioPeriods>,
  "ambiguousPeriods" | "incompatiblePeriods" | "noSharedPeriod"
>;

/** What the reader is told about a scenario comparison of these observations, each sentence from
 * its own fact: the periods left out and why, then that no period is shared. Null when every
 * period is compared. */
export function scenarioComparisonNotice(facts: ScenarioPeriodFacts) {
  const leftOut: string[] = [];
  const leaveOut = (periods: string[], reason: string) => {
    if (periods.length) leftOut.push(`${periodsInOrder(periods).join(", ")} (${reason})`);
  };
  leaveOut(facts.ambiguousPeriods, "published more than once by a case");
  leaveOut(
    facts.incompatiblePeriods,
    "recorded start and end dates do not match between cases, or are incomplete or invalid",
  );
  const sentences = leftOut.length
    ? [`Periods left out of the scenario comparison: ${leftOut.join("; ")}.`]
    : [];
  if (facts.noSharedPeriod)
    sentences.push(
      leftOut.length
        ? "No other period is published by more than one case, so no scenario comparison is drawn."
        : "The cases publish no period in common, so no scenario comparison is drawn.",
    );
  return sentences.length ? sentences.join(" ") : null;
}

function scenarioCount(byPeriod: Map<string, ScenarioPeriodObservation[]>) {
  return new Set(
    [...byPeriod.values()].flatMap((candidates) => candidates.map(({ group }) => group)),
  ).size;
}
