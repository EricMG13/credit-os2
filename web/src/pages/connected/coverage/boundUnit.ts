import { factAt, latestRun, type Coverage, type Issuer } from "../coverageData";

/** A reporting unit as the page names it: the empty unit is "no unit stated". */
export function unitName(unit: string): string {
  return unit === "" ? "no unit stated" : unit;
}

/**
 * The reporting unit a numeric bound compares at a period. Each issuer's newest run counts once,
 * under the unit of its one figure for the period (none when it states no figure, a gap or the
 * period twice). The unit most issuers state is taken; the empty unit never wins a tie. Two or
 * more named units that tie leave `unit` null and list them in `tied`: the page does not choose,
 * it asks. A pick that is one of the units is taken.
 */
export function boundUnit(
  data: Coverage,
  issuers: readonly Issuer[],
  field: string,
  period: string,
  pick: string | null,
): { units: string[]; unit: string | null; tied: string[] } {
  const counts = new Map<string, number>();
  for (const issuer of issuers) {
    const run = latestRun(issuer);
    const fact = run ? factAt(data, run.key, field, period) : undefined;
    if (fact && fact.at !== null) {
      const unit = fact.unit ?? "";
      counts.set(unit, (counts.get(unit) ?? 0) + 1);
    }
  }
  const units = [...counts.keys()].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
  if (pick !== null && counts.has(pick)) return { units, unit: pick, tied: [] };
  const top = Math.max(0, ...counts.values());
  let leaders = units.filter((unit) => counts.get(unit) === top);
  if (leaders.length > 1 && leaders.some((unit) => unit !== "")) leaders = leaders.filter((u) => u !== "");
  const [only] = leaders;
  return leaders.length === 1 && only !== undefined
    ? { units, unit: only, tied: [] }
    : { units, unit: null, tied: leaders };
}
