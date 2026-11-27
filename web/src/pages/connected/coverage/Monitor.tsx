import { useMemo, useState } from "react";
import { comparePeriodKeys, periodKey } from "@/utils/periodOrder";
import {
  evidenceLink,
  latestRun,
  periodsOf,
  periodsOrdered,
  type Coverage,
  type Fact,
  type Issuer,
} from "../coverageData";
import { BETTER, NEUTRAL, POSITION, WORSE, step } from "../visuals/signal/scales";
import { band, compare, difference, type Dec } from "./coverageMath";
import { cohort, series, type Cohort, type Member } from "./cohort";
import { verdict } from "./direction";
import { endDirection, fieldLabel as label, fraction, written, writtenText } from "./monitorMath";
import { LeftOut } from "./LeftOut";
import { Sparkline } from "../visuals/signal/Sparkline";
import { MonitorDetails } from "./MonitorDetails";
import { headroom } from "./direction";

export const MONITOR_GROUPS: readonly { name: string; fields: readonly string[] }[] = [
  {
    name: "Leverage",
    fields: ["cp-1/leverage/total-debt-ebitda", "cp-1/leverage/net-debt-ebitda"],
  },
  { name: "Cover", fields: ["cp-1/interest-cover/ebitda-cash-interest"] },
  {
    name: "Liquidity",
    fields: ["cp-1/liquidity/cash", "cp-1/liquidity/undrawn-committed-facilities"],
  },
  {
    name: "Scale",
    fields: ["cp-1/revenue-and-ebitda/revenue", "cp-1/revenue-and-ebitda/adjusted-ebitda"],
  },
  { name: "Refinancing", fields: ["cp-3c/refinancing-need/debt-maturing"] },
  {
    name: "Covenants",
    fields: ["cp-4/covenant-headroom/current", "cp-4/covenant-headroom/threshold"],
  },
];

const MEASURE_FIELDS = MONITOR_GROUPS.slice(0, 5).flatMap((group) => group.fields);
const COVENANT_FIELDS = MONITOR_GROUPS[5]?.fields ?? [];
const BANDS = [
  "bottom quartile",
  "lower middle half",
  "upper middle half",
  "top quartile",
] as const;
type Tint = "difference" | "position";
type Reading = { fact?: Fact; member?: Member; reason?: string };
type Measure = {
  cohort: Cohort;
  ordered: boolean;
  axis: string[];
  byIssuer: Map<string, Member[]>;
  changes: Map<string, Dec | null>;
  maxChange: Dec;
};
type CovenantPair = { fact: Fact; threshold: Fact; room: Dec };
type CovenantReading = { pair?: CovenantPair; ambiguous: boolean };

function readFor(cohortValue: Cohort, issuer: Issuer): Reading | null {
  const member = cohortValue.members.find((item) => item.issuer.key === issuer.key);
  if (member) return { fact: member.fact, member };
  const out = cohortValue.out.find((item) => item.issuer.key === issuer.key);
  return out ? { fact: out.fact, reason: out.reason } : null;
}

function periodsFor(data: Coverage, issuers: readonly Issuer[], field: string): string[] {
  const periods = periodsOf(data, issuers, field);
  if (periodsOrdered(data, issuers, field)) {
    return [...periods].sort((a, b) => {
      const ak = periodKey(a);
      const bk = periodKey(b);
      return ak && bk ? comparePeriodKeys(ak, bk) : 0;
    });
  }
  return [...periods];
}

export function Monitor({
  data,
  issuers,
  selected,
  onSelect,
}: {
  data: Coverage;
  issuers: readonly Issuer[];
  selected: string | null;
  onSelect: (issuer: string) => void;
}) {
  const firstField = MEASURE_FIELDS[0] as string;
  const dataByField = useMemo(
    () =>
      new Map(
        [...MEASURE_FIELDS, ...COVENANT_FIELDS].map((field) => [
          field,
          { ...data, facts: data.facts.filter((fact) => fact.field === field) },
        ]),
      ),
    [data],
  );
  const periodData = useMemo(() => {
    const indexedData = dataByField.get(firstField);
    return {
      periods: periodsFor(indexedData ?? data, issuers, firstField),
      ordered: periodsOrdered(indexedData ?? data, issuers, firstField),
    };
  }, [data, dataByField, issuers, firstField]);
  const periods = periodData.periods;
  const [periodPick, setPeriodPick] = useState("");
  const [tint, setTint] = useState<Tint>("difference");
  const [sort, setSort] = useState<{ field: string; descending: boolean } | null>(null);
  const defaultPeriod = periodData.ordered ? periods.at(-1) : periods.at(0);
  const period = periods.includes(periodPick) ? periodPick : (defaultPeriod ?? "");
  const measures = useMemo(
    () =>
      new Map(
        MEASURE_FIELDS.map((field): [string, Measure] => {
          const indexedData = dataByField.get(field) ?? data;
          const current = cohort(indexedData, issuers, field, period);
          const ordered = periodsOrdered(indexedData, issuers, field);
          const axis = ordered ? periodsFor(indexedData, issuers, field) : [];
          const currentIndex = axis.indexOf(period);
          const byIssuer = new Map(
            current.members.map((member) => [
              member.issuer.key,
              series(indexedData, member.issuer, field, current.heading, current.unit) ?? [],
            ]),
          );
          const changes = new Map(
            current.members.map((member) => {
              const previousPeriod = currentIndex > 0 ? axis[currentIndex - 1] : undefined;
              const previous = previousPeriod
                ? byIssuer
                    .get(member.issuer.key)
                    ?.find((item) => item.fact.period === previousPeriod)
                : undefined;
              return [
                member.issuer.key,
                previous ? difference(member.value, previous.value) : null,
              ];
            }),
          );
          const maxChange = [...changes.values()]
            .flatMap((change) =>
              change === null ? [] : [change.startsWith("-") ? change.slice(1) : change],
            )
            .reduce<Dec>(
              (largest, change) => (compare(change, largest) > 0 ? change : largest),
              "0",
            );
          return [field, { cohort: current, ordered, axis, byIssuer, changes, maxChange }];
        }),
      ),
    [data, dataByField, issuers, period],
  );
  const cohorts = useMemo(
    () => new Map([...measures].map(([field, measure]) => [field, measure.cohort])),
    [measures],
  );
  const fieldsByGroup = MEASURE_FIELDS;
  const axes = useMemo(
    () => new Map([...measures].map(([field, measure]) => [field, measure.axis])),
    [measures],
  );
  const covenantData = useMemo(() => {
    const level = COVENANT_FIELDS[0];
    const limit = COVENANT_FIELDS[1];
    return new Map<string, CovenantReading>(
      issuers.map((issuer): [string, CovenantReading] => {
        const run = latestRun(issuer);
        const current =
          dataByField
            .get(level ?? "")
            ?.facts.filter((fact) => fact.issuer === issuer.key && fact.run === run?.key) ?? [];
        const thresholds =
          dataByField
            .get(limit ?? "")
            ?.facts.filter((fact) => fact.issuer === issuer.key && fact.run === run?.key) ?? [];
        const signature = (fact: Fact) =>
          JSON.stringify([fact.run, fact.line, fact.output, fact.unit, fact.period]);
        const currentByRow = new Map<string, Fact[]>();
        const thresholdByRow = new Map<string, Fact[]>();
        for (const fact of current) {
          const key = signature(fact);
          currentByRow.set(key, [...(currentByRow.get(key) ?? []), fact]);
        }
        for (const fact of thresholds) {
          const key = signature(fact);
          thresholdByRow.set(key, [...(thresholdByRow.get(key) ?? []), fact]);
        }
        let ambiguous = false;
        const pairs: CovenantPair[] = [];
        for (const fact of current) {
          const key = signature(fact);
          const matches = thresholdByRow.get(key) ?? [];
          if ((currentByRow.get(key)?.length ?? 0) !== 1 || matches.length > 1) {
            ambiguous = true;
            continue;
          }
          const threshold = matches[0];
          if (!threshold || fact.gap || threshold.gap) continue;
          const room = headroom(threshold, fact);
          if (room !== null) pairs.push({ fact, threshold, room });
        }
        const units = new Map<string, number>();
        for (const pair of pairs) {
          const unit = pair.fact.unit;
          if (unit !== undefined) units.set(unit, (units.get(unit) ?? 0) + 1);
        }
        let commonUnit: string | undefined;
        let commonCount = 0;
        for (const [unit, count] of units) {
          if (count > commonCount) {
            commonUnit = unit;
            commonCount = count;
          }
        }
        const comparable = pairs.filter((pair) => pair.fact.unit === commonUnit);
        let tightest: CovenantPair | undefined;
        for (const pair of comparable) {
          if (!tightest || compare(pair.room, tightest.room) < 0) tightest = pair;
        }
        return [issuer.key, { pair: tightest, ambiguous }];
      }),
    );
  }, [dataByField, issuers]);
  const sortedIssuers = useMemo(() => {
    if (!sort) return [...issuers];
    const target = measures.get(sort.field)?.cohort;
    if (!target) return [...issuers];
    const original = new Map(issuers.map((issuer, index) => [issuer.key, index]));
    return [...issuers].sort((a, b) => {
      const af =
        target.members.find((member) => member.issuer.key === a.key)?.fact ??
        target.out.find((item) => item.issuer.key === a.key)?.fact;
      const bf =
        target.members.find((member) => member.issuer.key === b.key)?.fact ??
        target.out.find((item) => item.issuer.key === b.key)?.fact;
      const av = af?.at;
      const bv = bf?.at;
      if (av === null || av === undefined || bv === null || bv === undefined) {
        return av !== null && av !== undefined
          ? -1
          : bv !== null && bv !== undefined
            ? 1
            : (original.get(a.key) ?? 0) - (original.get(b.key) ?? 0);
      }
      const order = av - bv;
      return (
        (sort.descending ? -order : order) ||
        (original.get(a.key) ?? 0) - (original.get(b.key) ?? 0)
      );
    });
  }, [measures, issuers, sort]);
  const traceFor = (issuer: Issuer): { href: string } | null => {
    const run = latestRun(issuer);
    if (!run) return null;
    const displayedMeasureFact =
      fieldsByGroup.flatMap((field) => {
        const current = cohorts.get(field);
        const member = current?.members.find((item) => item.issuer.key === issuer.key);
        const out = current?.out.find((item) => item.issuer.key === issuer.key);
        return member ? [member.fact] : out?.fact ? [out.fact] : [];
      })[0] ?? covenantData.get(issuer.key)?.pair?.fact;
    return {
      href: displayedMeasureFact
        ? evidenceLink(run, displayedMeasureFact)
        : `/report/${encodeURIComponent(run.folder)}`,
    };
  };

  const cellFor = (issuer: Issuer, field: string) => {
    const measure = measures.get(field);
    const c = measure?.cohort;
    const reading = c ? readFor(c, issuer) : null;
    if (!c || !reading)
      return (
        <td key={field} className="gap-hatch" title="No figure stated">
          {" "}
        </td>
      );
    const { fact, member, reason } = reading;
    if (!member || !fact) {
      if (!fact || fact.gap || fact.at === null) {
        return <td key={field} className="gap-hatch" title={reason ?? "No figure stated"} />;
      }
      return (
        <td key={field} className="bg-surface-card px-2 py-1 text-small" title={reason}>
          {written(fact)} <span className="text-text-tertiary">n/c</span>
        </td>
      );
    }
    const ordered = measure.ordered;
    const axis = measure.axis;
    const own = measure.byIssuer.get(issuer.key) ?? [];
    const byPeriod = new Map(own.map((item) => [item.fact.period ?? "", item]));
    const values = axis.map((slot) => byPeriod.get(slot)?.value ?? null);
    const stated = values.filter((value): value is Dec => value !== null);
    const low = stated.reduce(
      (minimum, value) => (compare(value, minimum) < 0 ? value : minimum),
      stated[0] ?? "0",
    );
    const high = stated.reduce(
      (maximum, value) => (compare(value, maximum) > 0 ? value : maximum),
      stated[0] ?? "0",
    );
    const pixelValues = values.map((value) =>
      value === null ? null : String(fraction(value, low, high)),
    );
    const index = axis.indexOf(period);
    const prior = index > 0 ? byPeriod.get(axis[index - 1] as string) : undefined;
    const change = measure.changes.get(issuer.key) ?? null;
    const position = c.stats ? band(member.value, c.stats) : null;
    const direction = change === null ? null : verdict(field, member.value, change);
    const finalDirection = endDirection(field, values);
    const endColour =
      finalDirection === "better" ? BETTER[1] : finalDirection === "worse" ? WORSE[1] : undefined;
    const changeTint = direction === "better" ? BETTER : direction === "worse" ? WORSE : NEUTRAL;
    const magnitude =
      change === null || measure.maxChange === "0"
        ? 0
        : fraction(change.startsWith("-") ? change.slice(1) : change, "0", measure.maxChange);
    const colour =
      c.stats === null
        ? undefined
        : tint === "position" && position !== null
          ? POSITION[position]
          : change === null
            ? undefined
            : step(magnitude, changeTint);
    const bandWord = position === null ? "no cohort band" : BANDS[position];
    const signed =
      change === null
        ? "no difference"
        : `difference from ${prior?.fact.period ?? "the prior period"} ${change.startsWith("-") ? "−" : "+"}${change.replace(/^-/, "")}`;
    const directional = direction === null || direction === "none" ? "" : `; ${direction}`;
    const neutralDirection =
      (direction === null || direction === "none") && change !== null && change !== "0"
        ? `; ${compare(change, "0") > 0 ? "up" : "down"}`
        : "";
    const title = `${label(data, field)}, ${period}: ${written(fact)}; ${signed}; ${bandWord}${directional}${neutralDirection}`;
    return (
      <td
        key={field}
        aria-label={`${issuer.name}, ${label(data, field)}: ${written(fact)}`}
        title={title}
        style={colour ? { backgroundColor: colour } : undefined}
        className="px-2 py-1 text-small"
      >
        <span className="flex min-w-24 items-center justify-between gap-1 font-mono">
          <span>{written(fact)}</span>
          {ordered && (
            <Sparkline
              values={pixelValues}
              width={42}
              height={14}
              end={endColour}
              label={`${issuer.name}, ${label(data, field)}, ${axis.join(" to ")}`}
            />
          )}
        </span>
      </td>
    );
  };

  const allOut = fieldsByGroup.flatMap((field) =>
    (cohorts.get(field)?.out ?? []).map((item) => ({ field, ...item })),
  );
  const uniqueOut = [...new Map(allOut.map((item) => [item.issuer.key, item])).values()];
  const details = new Map<string, string[]>();
  for (const item of allOut) {
    const text = `${label(data, item.field)}: ${item.reason}`;
    const list = details.get(item.issuer.key) ?? [];
    if (!list.includes(text)) list.push(text);
    details.set(item.issuer.key, list);
  }
  return (
    <section aria-label="Monitor" className="grid gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid gap-1 text-small text-text-secondary">
          Period
          <select
            aria-label="Period"
            value={period}
            onChange={(event) => {
              setPeriodPick(event.currentTarget.value);
            }}
            className="h-9 rounded-ds-sm border border-border-control bg-surface-card px-2 text-text-primary"
          >
            {periods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <fieldset className="flex items-center gap-3 text-small text-text-secondary">
          <legend className="sr-only">Cell tint</legend>
          {(["difference", "position"] as const).map((item) => (
            <label key={item} className="flex items-center gap-1">
              <input
                type="radio"
                name="monitor-tint"
                value={item}
                checked={tint === item}
                onChange={() => {
                  setTint(item);
                }}
              />
              {item === "difference" ? "Difference" : "Position"}
            </label>
          ))}
        </fieldset>
      </div>
      <MonitorDetails
        data={data}
        issuers={issuers}
        fields={fieldsByGroup}
        cohorts={cohorts}
        axes={axes}
        indexedData={dataByField}
        selected={selected}
        period={period}
      />
      <div className="overflow-x-auto rounded-ds-lg border border-border-subtle bg-surface-card">
        <table aria-label="Monitor" className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" rowSpan={2} className="sticky left-0 bg-surface-card px-2 py-2">
                Issuer
              </th>
              {MONITOR_GROUPS.map((group) => (
                <th
                  key={group.name}
                  scope="colgroup"
                  colSpan={group.name === "Covenants" ? 1 : group.fields.length}
                  className="border-l border-border-hairline px-2 py-2 text-caption font-medium"
                >
                  {group.name}
                  <span className="ml-1 rounded bg-surface-subtle px-1">computed</span>
                </th>
              ))}
            </tr>
            <tr>
              {fieldsByGroup.map((field) => (
                <th
                  key={field}
                  scope="col"
                  className="border-b border-border-hairline px-2 py-1 text-caption font-medium"
                >
                  <button
                    type="button"
                    aria-label={`Sort by ${label(data, field)}`}
                    onClick={() => {
                      setSort((current) =>
                        current?.field === field
                          ? { field, descending: !current.descending }
                          : { field, descending: false },
                      );
                    }}
                  >
                    {label(data, field)}
                  </button>
                </th>
              ))}
              <th
                scope="col"
                className="border-b border-border-hairline px-2 py-1 text-caption font-medium"
              >
                <button
                  type="button"
                  disabled
                  title="Issuer-specific covenant tests are not comparable across issuers."
                >
                  Tightest covenant test · not ranked
                </button>
              </th>
              <th
                scope="col"
                className="border-b border-border-hairline px-2 py-1 text-caption font-medium"
              >
                Trace
              </th>
            </tr>
          </thead>
          {/* Rows are focusable and selectable; this handler moves selection with the table's arrow keys. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <tbody
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              const index = sortedIssuers.findIndex((issuer) => issuer.key === selected);
              const next = Math.max(
                0,
                Math.min(sortedIssuers.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)),
              );
              const issuer = sortedIssuers[next];
              if (issuer) onSelect(issuer.key);
              event.preventDefault();
            }}
          >
            {sortedIssuers.map((issuer) => {
              const trace = traceFor(issuer);
              return (
                <tr
                  key={issuer.key}
                  aria-selected={issuer.key === selected}
                  tabIndex={0}
                  onClick={() => {
                    onSelect(issuer.key);
                  }}
                  className={
                    issuer.key === selected
                      ? "bg-surface-subtle"
                      : "border-t border-border-hairline"
                  }
                >
                  <th
                    scope="row"
                    className="sticky left-0 bg-inherit px-2 py-1 text-small font-medium"
                  >
                    {issuer.name}
                  </th>
                  {fieldsByGroup.map((field) => cellFor(issuer, field))}
                  <td
                    className="px-2 py-1 text-small"
                    aria-label={`${issuer.name}, tightest covenant test`}
                  >
                    {(() => {
                      const reading = covenantData.get(issuer.key);
                      const pair = reading?.pair;
                      return pair ? (
                        `${pair.fact.heading ?? pair.fact.row ?? "Covenant"}: ${written(pair.fact)} / ${written(pair.threshold)}; ${compare(pair.room, "0") < 0 ? "beyond the limit" : "headroom"} ${writtenText(pair.room, pair.threshold.unit)}`
                      ) : (
                        <span
                          title={
                            reading?.ambiguous
                              ? "Ambiguous duplicate covenant row; unavailable"
                              : "No comparable current and threshold pair"
                          }
                        >
                          Unavailable
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-2 py-1">
                    {trace && (
                      <a
                        href={trace.href}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        className="text-small underline"
                      >
                        Open run
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <LeftOut out={uniqueOut} title="Issuers left out of one or more measures" details={details} />
    </section>
  );
}
