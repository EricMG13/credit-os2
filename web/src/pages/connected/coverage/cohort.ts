import {
  factsOf,
  latestRun,
  periodsOf,
  periodsOrdered,
  type Coverage,
  type CoverageRun,
  type Fact,
  type Issuer,
} from "../coverageData";
import { dec, stats, type Dec, type Stats } from "./coverageMath";

type Reason =
  | "no figure"
  | "more than one figure"
  | "other unit"
  | "other heading"
  | "other period"
  | "left out by you";
export type Member = { issuer: Issuer; run: CoverageRun; fact: Fact; value: Dec };
export type Cohort = {
  field: string;
  period: string;
  unit: string;
  /** The fact's heading, or the field's label. */
  heading: string;
  members: Member[];
  out: { issuer: Issuer; reason: Reason; fact?: Fact; stated?: string[] }[];
  stats: Stats | null;
};

type Pick = { unit?: string; heading?: string; excluded?: ReadonlySet<string> };
type Out = Cohort["out"][number];

/** Unit text as written; a fact with none states "". */
const unitOf = (fact: Fact): string => fact.unit ?? "";

/** A figure is a stated number: not a gap, with a plain-amount text. */
function valueOf(fact: Fact): Dec | null {
  return fact.at === null || fact.gap ? null : dec(fact.text);
}

/** Most common key among the entries; a tie takes the first in issuer order. */
function commonest(keys: readonly string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  let best: string | undefined;
  for (const [key, count] of counts) if (best === undefined || count > (counts.get(best) ?? 0)) best = key;
  return best;
}

/** The issuer's newest-run facts for the field, and what they say about the period. */
function readIssuer(
  data: Coverage,
  issuer: Issuer,
  field: string,
  period: string,
): { run: CoverageRun; all: Fact[]; here: Fact[] } | null {
  const run = latestRun(issuer);
  if (!run) return null;
  const all = factsOf(data, run.key, field);
  return { run, all, here: all.filter((fact) => fact.period === period) };
}

/**
 * Who is in a cohort for one field and period, and why each other issuer is not. Each issuer is read
 * at its newest run; a fact's heading is its own or the field's label. The cohort's unit and heading
 * are chosen together as one pair: the most common (heading, unit) among issuers (excluded ones
 * counted, so leaving one out never changes it) that state exactly one fact under that heading at the
 * period and it is a figure. Only pairs consistent with `pick.unit` and `pick.heading` count, a tie
 * takes the first in issuer order, and a picked component is used even if no pair matches. An issuer
 * stating two headings at the period can be in the cohort of each. Reason precedence: left out by you;
 * no figure (no fact for the field, or none states a period); other period; other heading (no fact
 * under the cohort heading); more than one figure (under the cohort heading, any unit); no figure
 * (the one fact is a gap or not a number); other unit.
 */
export function cohort(
  data: Coverage,
  issuers: readonly Issuer[],
  field: string,
  period: string,
  pick: Pick = {},
): Cohort {
  const label = data.fields.find((item) => item.id === field)?.label ?? field;
  const headingOf = (fact: Fact): string => fact.heading ?? label;
  const excluded = pick.excluded ?? new Set<string>();
  const reads = issuers.map((issuer) => ({ issuer, read: readIssuer(data, issuer, field, period) }));

  const pairs: [string, string][] = [];
  for (const { read } of reads) {
    for (const heading of new Set(read?.here.map(headingOf))) {
      const under = read?.here.filter((fact) => headingOf(fact) === heading) ?? [];
      const one = under.length === 1 ? under[0] : undefined;
      if (!one || valueOf(one) === null) continue;
      if (pick.unit !== undefined && unitOf(one) !== pick.unit) continue;
      if (pick.heading !== undefined && heading !== pick.heading) continue;
      pairs.push([heading, unitOf(one)]);
    }
  }
  const best = commonest(pairs.map((pair) => JSON.stringify(pair)));
  const [bestHeading, bestUnit] = best === undefined ? [label, ""] : (JSON.parse(best) as [string, string]);
  const heading = pick.heading ?? bestHeading;
  const unit = pick.unit ?? bestUnit;

  const out: Out[] = [];
  const members: Member[] = [];
  for (const { issuer, read } of reads) {
    const under = read?.here.filter((fact) => headingOf(fact) === heading) ?? [];
    const one = under.length === 1 ? under[0] : undefined;
    if (excluded.has(issuer.key)) {
      out.push({ issuer, reason: "left out by you", ...(one ? { fact: one } : {}) });
    } else if (!read || read.all.length === 0 || read.all.every((fact) => fact.period === null)) {
      out.push({ issuer, reason: "no figure" });
    } else if (read.here.length === 0) {
      const stated = [...new Set(read.all.flatMap((fact) => fact.period ?? []))];
      out.push({ issuer, reason: "other period", stated });
    } else if (under.length === 0) {
      out.push({ issuer, reason: "other heading", fact: read.here[0] });
    } else if (!one) {
      out.push({ issuer, reason: "more than one figure", stated: under.map((fact) => fact.text) });
    } else {
      const value = valueOf(one);
      if (value === null) out.push({ issuer, reason: "no figure", fact: one });
      else if (unitOf(one) !== unit) out.push({ issuer, reason: "other unit", fact: one });
      else members.push({ issuer, run: read.run, fact: one, value });
    }
  }
  return { field, period, unit, heading, members, out, stats: stats(members.map((m) => m.value)) };
}

/**
 * The issuer's own figures for a field, oldest to newest, when the page can order its periods; else
 * null. A period with none, or with more than one fact at that heading (any unit), gives no member.
 */
export function series(
  data: Coverage,
  issuer: Issuer,
  field: string,
  heading: string,
  unit: string,
): Member[] | null {
  if (!periodsOrdered(data, [issuer], field)) return null;
  const run = latestRun(issuer);
  if (!run) return [];
  const label = data.fields.find((item) => item.id === field)?.label ?? field;
  const facts = factsOf(data, run.key, field).filter((fact) => (fact.heading ?? label) === heading);
  return periodsOf(data, [issuer], field).flatMap((period) => {
    const here = facts.filter((fact) => fact.period === period);
    const fact = here.length === 1 ? here[0] : undefined;
    const value = fact && unitOf(fact) === unit ? valueOf(fact) : null;
    return fact && value !== null ? [{ issuer, run, fact, value }] : [];
  });
}
