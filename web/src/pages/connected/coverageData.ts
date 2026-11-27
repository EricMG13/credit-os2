import { request } from "./ahead";
import { comparePeriodKeys, periodKey } from "@/utils/periodOrder";
import { writtenUnit } from "./moneyUnits";
import { DECISION_MODULES, periodPlace } from "./reportView";

/**
 * Coverage's reply (`react_frontend/coverage.py`). Every `text` is the module's own; `at` only
 * sorts and screens. Nothing here averages, differences or scores a delivered value.
 */
export type CellState =
  "assessed" | "not-assessable" | "unreadable" | "no-handoff" | "not-in-pathway" | "plan-unknown";
/** `gaps` counts what the handoff states as missing; `issue` is a fixed table not in its shape. */
export type Cell = { state: CellState; gaps?: number; issue?: boolean };
export type CoverageRun = {
  key: string;
  folder: string;
  asOf: string | null;
  pathway: string | null;
  pathwayTitle: string | null;
  /** How many other runs of the issuer share this run's as-of date. */
  sharedWith?: number;
  cells: Record<string, Cell>;
  other: readonly ({ code: string; title: string } & Cell)[];
};
export type Issuer = {
  key: string;
  name: string;
  sector: string | null;
  /** Newest first. */
  runs: readonly CoverageRun[];
};
export type Field = {
  id: string;
  module: string;
  group: string;
  label: string;
  kind: "number" | "text" | "choice";
  /** A number field read down periods can be ranked; one read down the issuer's own rows cannot. */
  series?: "period" | "row";
};
export type Fact = {
  field: string;
  issuer: string;
  run: string;
  period: string | null;
  row: string | null;
  text: string;
  at: number | null;
  gap?: boolean;
  /** The column heading as the module wrote it, where it is the adjusted twin of the field's. */
  heading?: string;
  /** A row table's Direction cell as the module wrote it ("Passes below"); period tables carry none. */
  direction?: string;
  unit?: string;
  basis?: string;
  /** The table's typed Quote date cell, kept distinct from the run's as-of date. */
  quoteDate?: string;
  impact?: string;
  confidence?: string;
  line: number;
  output: string;
  sha256: string;
};
export type Coverage = {
  columns: readonly { code: string; title: string }[];
  issuers: readonly Issuer[];
  fields: readonly Field[];
  facts: readonly Fact[];
  /** Set when the publication is a retained test preview; the page says so, as the Library does. */
  preview?: { reason: string } | null;
};

export const COVERAGE_ADDRESS = "/connected/coverage";

export async function getCoverage(signal: AbortSignal): Promise<Coverage | null> {
  const response = await request(COVERAGE_ADDRESS, signal);
  if (!response.ok) throw new Error("Coverage could not be loaded.");
  return (await response.json()) as Coverage | null;
}

export type Filters = {
  query: string;
  sector: string;
  pathway: string;
  /** A fixed column's code, or "all". */
  module: string;
  state: CellState | "all";
  /** A choice field's id and one of its delivered words, or "all". */
  choice: string;
  word: string;
  /** Bounds on the chosen number field, as typed; empty is open. */
  min: string;
  max: string;
};

export const NO_FILTERS: Filters = {
  query: "",
  sector: "all",
  pathway: "all",
  module: "all",
  state: "all",
  choice: "all",
  word: "all",
  min: "",
  max: "",
};

/** The run every view reads for an issuer: its newest. The reply carries facts for that run only. */
export function latestRun(issuer: Issuer): CoverageRun | undefined {
  return issuer.runs[0];
}

export function factsOf(data: Coverage, run: string, field?: string): Fact[] {
  return data.facts.filter((fact) => fact.run === run && (!field || fact.field === field));
}

/** Every row the run states for one period of a field, as the module wrote them. */
function factsAt(data: Coverage, run: string, field: string, period: string): Fact[] {
  return factsOf(data, run, field).filter((fact) => fact.period === period);
}

/** The run's one row for a period; nothing when it states none, or states the period twice. */
export function factAt(
  data: Coverage,
  run: string,
  field: string,
  period: string,
): Fact | undefined {
  const found = factsAt(data, run, field, period);
  return found.length === 1 ? found[0] : undefined;
}

/**
 * Period labels in the one period order (`periodKey`): fiscal years oldest first, then year to
 * date, last twelve months, pro forma and forecast periods. `ordered` is true only when the rule
 * reads every distinct label (or there is one label); then the labels are sorted. Otherwise the
 * order is the modules' own, as first written, and `ordered` is false: nothing may be drawn that
 * depends on the order. Labels are compared as written; two periods match only when equal.
 */
function inOrder(periods: readonly string[]): { periods: string[]; ordered: boolean } {
  const distinct = [...new Set(periods)];
  const keyed = distinct.flatMap((period) => {
    const key = periodKey(period);
    return key ? [{ period, key }] : [];
  });
  if (keyed.length !== distinct.length) return { periods: distinct, ordered: distinct.length <= 1 };
  keyed.sort((a, b) => comparePeriodKeys(a.key, b.key));
  return { periods: keyed.map(({ period }) => period), ordered: true };
}

function newestFacts(data: Coverage, issuers: readonly Issuer[], field: string): Fact[] {
  return issuers.flatMap((issuer) => {
    const run = latestRun(issuer);
    return run ? factsOf(data, run.key, field) : [];
  });
}

/** The periods the issuers' newest runs state for a field, in reading order. */
export function periodsOf(data: Coverage, issuers: readonly Issuer[], field: string): string[] {
  return inOrder(newestFacts(data, issuers, field).flatMap((fact) => fact.period ?? [])).periods;
}

/** Whether the periods the newest runs state could be put in time order (see `inOrder`). */
export function periodsOrdered(data: Coverage, issuers: readonly Issuer[], field: string): boolean {
  return inOrder(newestFacts(data, issuers, field).flatMap((fact) => fact.period ?? [])).ordered;
}

/** The reported periods among these (an actual, a year to date or a last twelve months), as
 * `periodPlace` reads them; every period where none is reported. */
function reportedFirst(periods: readonly string[]) {
  const reported = periods.filter((period) => periodPlace(period)?.reported);
  return reported.length ? reported : periods;
}

/**
 * The period a view opens on: the reported one most newest runs state a figure for, the later of
 * equals; a pro forma or forecast period only where they state no reported one. Where the periods
 * cannot be put in time order there is no "later": it opens on the first reported one as written.
 * The reader sees it in the Period control and can change it.
 */
export function commonPeriod(
  data: Coverage,
  issuers: readonly Issuer[],
  field: string,
): string | null {
  const periods = periodsOf(data, issuers, field);
  if (!periodsOrdered(data, issuers, field)) return reportedFirst(periods)[0] ?? null;
  // Each run counts once for a period, however many rows it states it on.
  const runs = new Map<string, Set<string>>();
  for (const fact of newestFacts(data, issuers, field)) {
    if (fact.period !== null && fact.at !== null)
      runs.set(fact.period, (runs.get(fact.period) ?? new Set()).add(fact.run));
  }
  const counts = (period: string | null) => runs.get(period ?? "")?.size ?? 0;
  let best: string | null = null;
  for (const period of reportedFirst(periods.filter((stated) => runs.has(stated)))) {
    if (counts(period) >= counts(best)) best = period;
  }
  return best ?? reportedFirst(periods).at(-1) ?? null;
}

/**
 * A typed bound: empty is open; a number written with its decimal point, and optionally with
 * comma thousands groups of three ("1,000"), is read as written; any other text, a comma used as a
 * decimal point ("1,0") included, is invalid.
 */
export function readBound(text: string): { value: number | null; invalid: boolean } {
  const typed = text.trim();
  if (typed === "") return { value: null, invalid: false };
  const plain = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(typed);
  return plain
    ? { value: Number(typed.replaceAll(",", "")), invalid: false }
    : { value: null, invalid: true };
}

function within(fact: Fact | undefined, filters: Filters, unit: string | null): boolean {
  const [min, max] = [readBound(filters.min).value, readBound(filters.max).value];
  if (min === null && max === null) return true;
  // A bound removes an issuer only after comparing its figure. A missing figure (never zero), a
  // stated gap and a period stated twice were not compared, so they stay: the page lists them.
  if (fact?.at === null || fact?.at === undefined) return true;
  // A bound compares figures in one reporting unit; a figure in another unit was not compared.
  if (unit !== null && (fact.unit ?? "") !== unit) return true;
  return (min === null || fact.at >= min) && (max === null || fact.at <= max);
}

function says(data: Coverage, issuer: Issuer, run: CoverageRun, query: string): boolean {
  const wanted = query.trim().toLowerCase();
  if (!wanted) return true;
  const texts = [issuer.name, issuer.sector ?? "", run.pathwayTitle ?? ""];
  const withheld = new Set(
    data.fields.filter((item) => DECISION_MODULES.includes(item.module)).map((item) => item.id),
  );
  for (const fact of factsOf(data, run.key)) {
    if (fact.at === null && !withheld.has(fact.field)) texts.push(fact.text, fact.impact ?? "");
  }
  return texts.some((text) => text.toLowerCase().includes(wanted));
}

/** The issuers whose newest run passes every filter; the bounds read `field` at `period`. */
export function matchIssuers(
  data: Coverage,
  filters: Filters,
  field: string | null,
  period: string | null = null,
  unit: string | null = null,
): Issuer[] {
  return data.issuers.filter((issuer) => {
    const run = latestRun(issuer);
    if (!run) return false;
    if (filters.sector !== "all" && issuer.sector !== filters.sector) return false;
    if (filters.pathway !== "all" && run.pathwayTitle !== filters.pathway) return false;
    if (filters.module !== "all" && filters.state !== "all") {
      if (run.cells[filters.module]?.state !== filters.state) return false;
    }
    if (filters.choice !== "all" && filters.word !== "all") {
      const said = factsOf(data, run.key, filters.choice).map((fact) => fact.text);
      if (!said.includes(filters.word)) return false;
    }
    if (field && period !== null && !within(factAt(data, run.key, field, period), filters, unit))
      return false;
    return says(data, issuer, run, filters.query);
  });
}

type RankRow = { issuer: Issuer; run: CoverageRun; fact: Fact };
export type Ranking = {
  /** One list per reporting unit: figures in different units are never ranked together. */
  units: { unit: string; rows: RankRow[] }[];
  /**
   * Issuers whose newest run states no figure for the period: `fact` is the module's stated gap
   * when it wrote one, and `stated` the periods that run does state a figure for.
   */
  missing: {
    issuer: Issuer;
    run: CoverageRun;
    fact: Fact | undefined;
    stated: string[];
    /** The rows of a period the run states more than once: none of them is ranked. */
    repeated: Fact[];
  }[];
};

/** Sort the delivered figures of one field at one period, newest run per issuer. */
export function rank(
  data: Coverage,
  issuers: readonly Issuer[],
  field: string,
  period: string,
  order: "high" | "low",
): Ranking {
  const units = new Map<string, RankRow[]>();
  const missing: Ranking["missing"] = [];
  for (const issuer of issuers) {
    const run = latestRun(issuer);
    if (!run) continue;
    const rows = factsAt(data, run.key, field, period);
    const fact = rows.length === 1 ? rows[0] : undefined;
    if (fact?.at === null || fact?.at === undefined) {
      const stated = factsOf(data, run.key, field)
        .filter((other) => other.at !== null)
        .flatMap((other) => other.period ?? []);
      missing.push({ issuer, run, fact, stated, repeated: rows.length > 1 ? rows : [] });
      continue;
    }
    const unit = fact.unit ?? "";
    units.set(unit, [...(units.get(unit) ?? []), { issuer, run, fact }]);
  }
  const sign = order === "high" ? -1 : 1;
  return {
    units: [...units].map(([unit, rows]) => ({
      unit,
      rows: rows.sort((a, b) => sign * ((a.fact.at ?? 0) - (b.fact.at ?? 0))),
    })),
    missing,
  };
}

/** What a list is grouped by: nothing, sector, pathway, or a choice field's delivered word. */
export function groupKey(data: Coverage, issuer: Issuer, by: string): string {
  const run = latestRun(issuer);
  if (by === "sector") return issuer.sector ?? "Sector not recorded";
  if (by === "pathway") return run?.pathwayTitle ?? "Pathway not recorded";
  if (by === "none" || !run) return "";
  return factsOf(data, run.key, by)[0]?.text ?? "Not stated";
}

export type TrendSeries = {
  /** The issuer's name; two issuers of one name are numbered. */
  name: string;
  run: CoverageRun;
  /** One per period in `periods`; null where the run states no figure for it. */
  points: (Fact | null)[];
};

/** The reporting units the issuers' newest runs state a field's figures in. */
export function fieldUnits(data: Coverage, issuers: readonly Issuer[], field: string): string[] {
  const units = newestFacts(data, issuers, field)
    .filter((fact) => fact.at !== null)
    .map((fact) => fact.unit ?? "");
  return [...new Set(units)].sort();
}

/**
 * A field down the module's own periods, one line per issuer from its newest run, in one
 * reporting unit. How a figure moved between two runs is the Changes page's, not this one's.
 */
export function trend(
  data: Coverage,
  issuers: readonly Issuer[],
  field: string,
  unit: string,
): { periods: string[]; ordered: boolean; series: TrendSeries[] } {
  const found = issuers.flatMap((issuer) => {
    const run = latestRun(issuer);
    if (!run) return [];
    const facts = factsOf(data, run.key, field).filter(
      (fact) => fact.at !== null && fact.period !== null && (fact.unit ?? "") === unit,
    );
    return facts.length > 0 ? [{ issuer, run, facts }] : [];
  });
  const { periods, ordered } = inOrder(
    found.flatMap(({ facts }) => facts.flatMap((fact) => fact.period ?? [])),
  );
  const seen = new Map<string, number>();
  return {
    periods,
    ordered,
    series: found.map(({ issuer, run, facts }) => {
      const count = (seen.get(issuer.name) ?? 0) + 1;
      seen.set(issuer.name, count);
      return {
        name: count === 1 ? issuer.name : `${issuer.name} (${String(count)})`,
        run,
        // A period the run states twice has no one figure, so it draws no point.
        points: periods.map((period) => {
          const rows = facts.filter((fact) => fact.period === period);
          return rows.length === 1 ? (rows[0] ?? null) : null;
        }),
      };
    }),
  };
}

/** A figure as written, with its unit when the unit is not already part of the text. */
export function figure(fact: Fact): string {
  if (fact.at === null || !fact.unit) return fact.text;
  return writtenUnit(fact.text, fact.unit);
}

/** Where a fact is read: its run's Evidence page, at the module's own line. */
export function evidenceLink(run: CoverageRun, fact: Fact): string {
  return `/report/${encodeURIComponent(run.folder)}#evidence/${encodeURIComponent(fact.output)}~${fact.sha256}-${String(fact.line)}`;
}

const GROUPS_KEY = "credit-os-coverage-groups";
export type SavedGroup = { name: string; issuers: string[] };

/** Saved groups live in this browser only; unreadable storage is no groups. */
export function readGroups(): SavedGroup[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(GROUPS_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (item): item is SavedGroup =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SavedGroup).name === "string" &&
        Array.isArray((item as SavedGroup).issuers) &&
        (item as SavedGroup).issuers.every((key) => typeof key === "string"),
    );
  } catch {
    return [];
  }
}

export function writeGroups(groups: readonly SavedGroup[]): void {
  try {
    window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    // The groups stay for this visit only.
  }
}
