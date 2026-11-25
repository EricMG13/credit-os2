import { TextLink } from "../../run/TextLink";
import {
  evidenceLink,
  figure,
  groupKey,
  rank,
  type Coverage as Data,
  type Field,
  type Issuer,
} from "../coverageData";
import { card } from "../layout";
import { unitName } from "./boundUnit";
import { prose, RunLine } from "./shared";
import { ZeroAxisBar } from "./ZeroAxisBar";

function grouped(data: Data, issuers: readonly Issuer[], by: string) {
  const groups = new Map<string, Issuer[]>();
  for (const issuer of issuers) {
    const key = groupKey(data, issuer, by);
    groups.set(key, [...(groups.get(key) ?? []), issuer]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b));
}

/** Every row's figure column is this wide, so the bars share one left edge. */
const FIGURE_WIDTH = "w-28";

/**
 * One figure across issuers at the chosen period, as bars: per row the issuer, the bar and the
 * figure as written. One list per reporting unit (units are never ranked together); equal figures
 * share a rank. A bar is drawn from zero: the figure over the list's largest where every figure is
 * zero or above; where any is below zero, bars run either side of a marked zero line on one scale
 * (an all-negative list runs wholly to its left). Issuers with no figure for the
 * period are listed apart with the module's reason: never ranked and never zero.
 */
export function RankView({
  data,
  issuers,
  field,
  period,
  order,
  by,
  boundUnit,
}: {
  data: Data;
  issuers: Issuer[];
  field: Field | undefined;
  period: string | null;
  order: "high" | "low";
  by: string;
  /** The unit a numeric bound compares, when one is applied; lists in another unit are not compared. */
  boundUnit: string | null;
}) {
  if (!field || period === null)
    return (
      <p role="status" className={card}>
        No module of a published run states a figure in a chart table yet, so there is nothing to
        rank.
      </p>
    );
  return (
    <div className="grid gap-6">
      {grouped(data, issuers, by).map(([group, members]) => {
        const ranking = rank(data, members, field.id, period, order);
        return (
          <section key={group} className="grid gap-3" aria-label={group || "Ranking"}>
            {group && <h3 className="font-display text-h4 text-text-primary">{group}</h3>}
            {ranking.units.map(({ unit, rows }) => {
              const values = rows.map(({ fact }) => fact.at ?? 0);
              const signed = values.some((value) => value < 0);
              const largest = Math.max(...values);
              const lowest = Math.min(...values);
              const name = `${field.label}, ${period}, ${unit === "" ? unitName(unit) : `reporting unit ${unit}`}${order === "high" ? ", highest first" : ", lowest first"}`;
              return (
                <div key={unit} className="grid gap-2">
                  <p className="text-small text-text-secondary">{name}</p>
                  {boundUnit !== null && unit !== boundUnit && (
                    <p className="text-caption text-gap-text">
                      Bound not applied: this list is in {unitName(unit)}, and the bound compares{" "}
                      {unitName(boundUnit)}.
                    </p>
                  )}
                  {signed && (
                    <p className="text-caption text-text-secondary">
                      Bars run from the zero line: figures below zero to its left, above zero to its
                      right, on one scale.
                    </p>
                  )}
                  <ol
                    aria-label={name}
                    className="grid divide-y divide-border-hairline rounded-ds-lg border border-border-subtle bg-surface-card"
                  >
                    {rows.map(({ issuer, run, fact }) => (
                      <li
                        key={issuer.key}
                        className="grid gap-x-4 gap-y-2 p-4 sm:grid-cols-[2rem_minmax(12rem,20rem)_minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="flex items-baseline gap-3 sm:contents">
                          <span className="font-mono text-small text-text-tertiary tabular-nums">
                            {rows.findIndex((other) => other.fact.at === fact.at) + 1}
                          </span>
                          <div className="grid min-w-0 gap-0.5 wrap-anywhere">
                            <span className="font-semibold text-text-primary">{issuer.name}</span>
                            <RunLine run={run} />
                          </div>
                        </div>
                        <ZeroAxisBar
                          text={figure(fact)}
                          value={fact.at ?? 0}
                          low={lowest}
                          high={largest}
                          valueWidth={FIGURE_WIDTH}
                        />
                        <TextLink
                          href={evidenceLink(run, fact)}
                          grey
                          className="inline-flex min-h-8 items-center text-small font-normal max-[480px]:min-h-11"
                        >
                          View sources
                        </TextLink>
                        <p className="text-caption text-text-secondary wrap-anywhere sm:col-span-4 sm:col-start-2">
                          {fact.period ?? fact.row ?? "Period not stated"}
                          {fact.heading ? ` · Stated as ${fact.heading}` : ""}
                          {" · "}
                          {prose(fact.basis) ?? "Qualification recorded in Evidence."}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
            {ranking.missing.length > 0 && (
              <div className="gap-hatch grid gap-2 rounded-ds-lg border border-dashed border-border-gap p-4">
                <div className="grid gap-2 rounded-ds-sm bg-surface-card p-3">
                  <h4 className="font-semibold text-text-primary">
                    Not ranked: no figure for {period} in the newest run
                  </h4>
                  <ul className="grid gap-1 text-small text-gap-text">
                    {ranking.missing.map(({ issuer, fact, stated, repeated }) => (
                      <li key={issuer.key}>
                        <span className="font-medium text-text-primary">{issuer.name}</span>
                        {": "}
                        {repeated.length > 0
                          ? `its run states this period more than once (${repeated.map((row) => `${figure(row)}${row.heading ? `, stated as ${row.heading}` : ""}`).join("; ")}), so none is ranked`
                          : fact
                            ? (prose(fact.text) ?? "the module's reason is in Evidence")
                            : stated.length > 0
                              ? `no figure could be read for this period; its run states ${stated.join(", ")}`
                              : "no figure could be read for this measure"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
