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

/** Most common text among the entries; a tie takes the first in issuer order. */
function commonest(texts: readonly string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const text of texts) counts.set(text, (counts.get(text) ?? 0) + 1);
  let best: string | undefined;
  for (const [text, count] of counts) if (best === undefined || count > (counts.get(best) ?? 0)) best = text;
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
 * at its newest run. Reason precedence: left out by you, no figure, other period, more than one figure, no figure
 * (one row that is a gap or not a figure), other unit, other heading. The default unit and
 * heading are the most common among issuers with exactly one figure at the period, excluded issuers
 * counted, so leaving one out never changes them; `pick` overrides.
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
  const settled = new Map<string, Out>(); // issuers out before unit and heading are weighed
  const single: Member[] = []; // exactly one figure at the period, excluded issuers included

  for (const issuer of issuers) {
    const read = readIssuer(data, issuer, field, period);
    const one = read?.here.length === 1 ? read.here[0] : undefined;
    const value = one ? valueOf(one) : null;
    if (read && one && value !== null) single.push({ issuer, run: read.run, fact: one, value });
    const out = ((): Out | null => {
      if (excluded.has(issuer.key))
        return { issuer, reason: "left out by you", ...(one ? { fact: one } : {}) };
      if (!read || read.all.length === 0) return { issuer, reason: "no figure" };
      if (read.here.length === 0) {
        const stated = [...new Set(read.all.flatMap((fact) => fact.period ?? []))];
        return { issuer, reason: "other period", stated };
      }
      if (read.here.length > 1)
        return { issuer, reason: "more than one figure", stated: read.here.map((fact) => fact.text) };
      return one && value === null ? { issuer, reason: "no figure", fact: one } : null;
    })();
    if (out) settled.set(issuer.key, out);
  }

  const unit = pick.unit ?? commonest(single.map(({ fact }) => unitOf(fact))) ?? "";
  const heading = pick.heading ?? commonest(single.map(({ fact }) => headingOf(fact))) ?? label;
  const out: Out[] = [];
  const members: Member[] = [];
  for (const issuer of issuers) {
    const early = settled.get(issuer.key);
    // Not settled means it has exactly one figure, so `single` holds it.
    const entry = single.find((item) => item.issuer.key === issuer.key);
    if (early) out.push(early);
    else if (!entry) throw new Error(`cohort: ${issuer.key} is neither out nor a single figure`);
    else if (unitOf(entry.fact) !== unit) out.push({ issuer, reason: "other unit", fact: entry.fact });
    else if (headingOf(entry.fact) !== heading)
      out.push({ issuer, reason: "other heading", fact: entry.fact });
    else members.push(entry);
  }
  return { field, period, unit, heading, members, out, stats: stats(members.map((m) => m.value)) };
}

/**
 * The issuer's own figures for a field, oldest to newest, when the page can order its periods; else
 * null. A period with none, or with more than one figure at that heading and unit, gives no member.
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
  const facts = factsOf(data, run.key, field).filter(
    (fact) => (fact.heading ?? label) === heading && unitOf(fact) === unit,
  );
  return periodsOf(data, [issuer], field).flatMap((period) => {
    const here = facts.filter((fact) => fact.period === period);
    const fact = here.length === 1 ? here[0] : undefined;
    const value = fact ? valueOf(fact) : null;
    return fact && value !== null ? [{ issuer, run, fact, value }] : [];
  });
}
