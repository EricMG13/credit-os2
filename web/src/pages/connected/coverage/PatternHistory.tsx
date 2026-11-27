import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { BETTER, NEUTRAL, POSITION, SECTOR, WORSE, step } from "../visuals/signal/scales";
import {
  evidenceLink,
  factsOf,
  latestRun,
  type Coverage,
  type CoverageRun,
  type Fact,
  type Issuer,
} from "../coverageData";
import { cohort, series, type Member } from "./cohort";
import { abs, compare, difference, type Dec } from "./coverageMath";
import { DIRECTION, verdict } from "./direction";
import { fieldLabel, fraction, written, writtenText } from "./monitorMath";
import { reportPath } from "./shared";

type Props = {
  data: Coverage;
  field: string;
  periods: readonly string[];
  issuers: readonly Issuer[];
  orderedIssuers: readonly Issuer[];
  heading: string;
  unit: string;
  selected: string | null;
  onSelect: (issuer: string) => void;
};

function reasonAt(
  data: Coverage,
  issuer: Issuer,
  field: string,
  period: string,
  heading: string,
  unit: string,
): string {
  const run = latestRun(issuer);
  const all = run ? factsOf(data, run.key, field) : [];
  const here = all.filter((fact) => fact.period === period);
  if (here.length === 0) return all.length ? `other period; no figure for ${period}` : "no figure";
  const under = here.filter((fact) => (fact.heading ?? fieldLabel(data, field)) === heading);
  if (under.length === 0) return "other heading";
  if (under.length > 1) return "more than one figure";
  const fact = under[0];
  if (!fact || fact.gap || fact.at === null) return "gap stated; no figure";
  if ((fact.unit ?? "") !== unit) return `other unit (${fact.unit ?? "no unit stated"})`;
  return "no comparable figure";
}

function range(values: readonly Dec[]): [Dec, Dec] {
  const first = values[0] ?? "0";
  return values.reduce<[Dec, Dec]>(
    ([low, high], value) => [
      compare(value, low) < 0 ? value : low,
      compare(value, high) > 0 ? value : high,
    ],
    [first, first],
  );
}

function coordinate(value: Dec, bounds: readonly [Dec, Dec]): number {
  return fraction(value, bounds[0], bounds[1]) * 100;
}

function signed(value: Dec, unit: string): string {
  const text = value.startsWith("-") ? `−${value.slice(1)}` : value === "0" ? value : `+${value}`;
  return writtenText(text, unit);
}

function colours(issuers: readonly Issuer[]): Map<string, string> {
  const sectors = [
    ...new Set(issuers.map((issuer) => issuer.sector ?? "Sector not stated")),
  ].sort();
  return new Map(
    sectors.map((sector, index) => [sector, SECTOR[index % SECTOR.length] ?? SECTOR[0]]),
  );
}

function traceFact(run: CoverageRun, fact: Fact, label: string) {
  return <a href={evidenceLink(run, fact)}>{label}</a>;
}

function openRun(issuer: Issuer, member?: Member) {
  const run = latestRun(issuer);
  if (!run) return null;
  const href =
    member?.run.key === run.key ? evidenceLink(member.run, member.fact) : reportPath(run.folder);
  return <a href={href}>Open run</a>;
}

function basis(member: Member): string {
  return member.fact.basis ?? "Basis not stated";
}

type TraceSource = Pick<Member, "issuer" | "run"> & { fact?: Fact };

function sourceDisclosure(label: string, sources: readonly TraceSource[], showRuns = true) {
  return (
    <details>
      <summary>
        {label} ({sources.length})
      </summary>
      <ul>
        {sources.map((source) => (
          <li
            key={`${source.run.key}-${source.fact?.output ?? "run"}-${String(source.fact?.line)}-${String(source.fact?.period)}-${source.fact?.text ?? "no-fact"}-${String(source.fact?.unit)}-${String(source.fact?.basis)}`}
          >
            {source.issuer.name} {source.fact?.period ?? "Period not stated"}{" "}
            {source.fact
              ? `${written(source.fact)} (${source.fact.basis ?? "Basis not stated"})`
              : "No fact stated"}{" "}
            {source.fact && traceFact(source.run, source.fact, "Evidence")}{" "}
            {showRuns && openRun(source.issuer)}
          </li>
        ))}
      </ul>
    </details>
  );
}

function issuerSources(data: Coverage, issuer: Issuer, field: string): TraceSource[] {
  const run = latestRun(issuer);
  return run ? factsOf(data, run.key, field).map((fact) => ({ issuer, run, fact })) : [];
}

function sourcesForOut(
  data: Coverage,
  field: string,
  out: readonly { issuer: Issuer; fact?: Fact }[],
): TraceSource[] {
  return out.flatMap((item) => issuerSources(data, item.issuer, field));
}

const issuerKey = (issuer: Issuer) => `issuer:${issuer.key}`;

export function PatternHistory({
  data,
  field,
  periods,
  issuers,
  orderedIssuers,
  heading,
  unit,
  selected,
  onSelect,
}: Props) {
  const cohorts = useMemo(
    () => periods.map((item) => cohort(data, orderedIssuers, field, item, { heading, unit })),
    [data, field, heading, orderedIssuers, periods, unit],
  );
  const computed = cohorts.flatMap((item) => (item.stats ? [{ item, stats: item.stats }] : []));
  const valuesByIssuer = useMemo(
    () =>
      new Map(
        orderedIssuers.map((issuer) => [
          issuer.key,
          series(data, issuer, field, heading, unit) ?? [],
        ]),
      ),
    [data, field, heading, orderedIssuers, unit],
  );
  const marks = useMemo(() => {
    const members = cohorts.flatMap((item) => (item.stats ? item.members : []));
    const bounds = range([
      ...cohorts.flatMap((item) => (item.stats ? [item.stats.min, item.stats.max] : [])),
      ...members.map((member) => member.value),
    ]);
    return cohorts.map((item) => {
      const stats = item.stats;
      const row: Record<string, string | number | null> = {
        period: item.period,
        q1: stats ? coordinate(stats.q1, bounds) : null,
        spread: stats ? coordinate(stats.q3, bounds) - coordinate(stats.q1, bounds) : null,
        median: stats ? coordinate(stats.median, bounds) : null,
      };
      for (const issuer of orderedIssuers) {
        const member = stats
          ? valuesByIssuer.get(issuer.key)?.find((value) => value.fact.period === item.period)
          : undefined;
        row[issuerKey(issuer)] = member ? coordinate(member.value, bounds) : null;
      }
      return row;
    });
  }, [cohorts, orderedIssuers, valuesByIssuer]);
  const chartIssuers = orderedIssuers.filter((issuer) =>
    marks.some((row) => row[issuerKey(issuer)] !== null),
  );
  const heat = useMemo(
    () =>
      orderedIssuers.map((issuer) => {
        const values = valuesByIssuer.get(issuer.key) ?? [];
        return {
          issuer,
          cells: periods.slice(1).map((to, index) => {
            const from = periods[index];
            if (from === undefined)
              throw new RangeError("adjacent period is missing its prior axis value");
            const before = values.find((member) => member.fact.period === from);
            const after = values.find((member) => member.fact.period === to);
            const change = before && after ? difference(after.value, before.value) : null;
            const reason = [
              !before ? `${from}: ${reasonAt(data, issuer, field, from, heading, unit)}` : null,
              !after ? `${to}: ${reasonAt(data, issuer, field, to, heading, unit)}` : null,
            ]
              .filter((item) => item !== null)
              .join("; ");
            return { from, to, before, after, change, reason };
          }),
        };
      }),
    [data, field, heading, orderedIssuers, periods, unit, valuesByIssuer],
  );
  const maxChange = heat
    .flatMap((row) => row.cells.flatMap((cell) => (cell.change ? [abs(cell.change)] : [])))
    .reduce<Dec>((max, value) => (compare(value, max) > 0 ? value : max), "0");
  const palette = useMemo(() => colours(issuers), [issuers]);
  const outOfOrder = issuers.filter(
    (issuer) => !orderedIssuers.some((item) => item.key === issuer.key),
  );
  const sourceCount = issuers.length;

  return (
    <>
      <section
        aria-label="Cohort band over time"
        className="rounded-ds-lg border border-border-subtle bg-surface-card p-3"
      >
        <h3 className="font-medium">
          Cohort band over time <span className="text-caption text-text-tertiary">computed</span>
        </h3>
        <p className="text-caption text-text-secondary">
          {heading}; {unit || "unit not stated"}. Cohort statistics require at least three issuers.
        </p>
        {periods.length > 0 ? (
          <div role="img" aria-label="Cohort band over time chart" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={marks} margin={{ top: 12, right: 18, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} tick={false} />
                <Area
                  type="linear"
                  dataKey="q1"
                  stackId="quartile"
                  stroke="none"
                  fill="transparent"
                  connectNulls={false}
                />
                <Area
                  type="linear"
                  dataKey="spread"
                  stackId="quartile"
                  stroke="none"
                  fill={POSITION[2]}
                  fillOpacity={0.45}
                  connectNulls={false}
                />
                <Line
                  type="linear"
                  dataKey="median"
                  stroke="var(--color-text-primary)"
                  dot={false}
                  connectNulls={false}
                />
                {chartIssuers.map((issuer) => (
                  <Line
                    key={issuer.key}
                    type="linear"
                    dataKey={issuerKey(issuer)}
                    name={issuer.name}
                    stroke={
                      issuer.key === selected
                        ? "var(--color-text-primary)"
                        : palette.get(issuer.sector ?? "Sector not stated")
                    }
                    strokeOpacity={issuer.key === selected ? 1 : 0.28}
                    strokeWidth={issuer.key === selected ? 2 : 1}
                    dot={false}
                    connectNulls={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-small text-gap-text">
            Periods cannot be put in time order, so no cohort time series is drawn.
          </p>
        )}
        <div className="max-w-full overflow-x-auto">
          <table aria-label="Cohort band data" className="min-w-max text-small">
            <thead>
              <tr>
                <th>Period</th>
                <th>Qualified of cohort</th>
                <th>Heading / unit</th>
                <th>Basis as written</th>
                <th>Q1</th>
                <th>Median (computed)</th>
                <th>Q3</th>
                {chartIssuers.map((issuer) => (
                  <th key={issuer.key}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(issuer.key);
                      }}
                    >
                      {issuer.name}
                    </button>
                  </th>
                ))}
                <th>Trace</th>
                <th>Left out and reason</th>
              </tr>
            </thead>
            <tbody>
              {computed.map(({ item, stats }) => (
                <tr key={item.period}>
                  <th>{item.period}</th>
                  <td>
                    {item.members.length} of {sourceCount}
                  </td>
                  <td>
                    {item.heading}; {item.unit || "unit not stated"}
                  </td>
                  <td>{[...new Set(item.members.map(basis))].join("; ")}</td>
                  <td>{writtenText(stats.q1, item.unit)}</td>
                  <td>{writtenText(stats.median, item.unit)}</td>
                  <td>{writtenText(stats.q3, item.unit)}</td>
                  {chartIssuers.map((issuer) => {
                    const member = valuesByIssuer
                      .get(issuer.key)
                      ?.find((value) => value.fact.period === item.period);
                    return (
                      <td key={issuer.key}>
                        {member ? (
                          <>
                            {written(member.fact)} <span>({basis(member)})</span>
                          </>
                        ) : (
                          <span
                            aria-label={`No figure: ${reasonAt(data, issuer, field, item.period, heading, unit)}`}
                          >
                            — ({reasonAt(data, issuer, field, item.period, heading, unit)})
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    {sourceDisclosure("Sources", [
                      ...item.members,
                      ...sourcesForOut(data, field, item.out),
                    ])}
                  </td>
                  <td>
                    <ul>
                      {item.out.map((out) => (
                        <li key={out.issuer.key}>
                          {out.issuer.name}: {out.reason}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cohorts.some((item) => item.stats === null) && (
          <section aria-label="Periods left out of cohort band">
            <h4>Periods left out</h4>
            <ul>
              {cohorts
                .filter((item) => item.stats === null)
                .map((item) => (
                  <li key={item.period}>
                    {item.period}: {item.members.length} of {sourceCount} qualify; fewer than three.
                    <ul>
                      {item.out.map((out) => (
                        <li key={out.issuer.key}>
                          {out.issuer.name}: {out.reason}
                        </li>
                      ))}
                    </ul>
                    {sourceDisclosure("Period sources", [
                      ...item.members,
                      ...sourcesForOut(data, field, item.out),
                    ])}
                  </li>
                ))}
            </ul>
          </section>
        )}
        {outOfOrder.length > 0 && (
          <section aria-label="Issuers left out of cohort band ordering">
            <h4>Issuers left out: periods cannot be ordered</h4>
            <ul>
              {outOfOrder.map((issuer) => (
                <li key={issuer.key}>
                  {issuer.name}: periods cannot be ordered for this issuer {openRun(issuer)}{" "}
                  {sourceDisclosure("Period evidence", issuerSources(data, issuer, field), false)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      <section
        aria-label="Difference heat grid"
        className="rounded-ds-lg border border-border-subtle bg-surface-card p-3"
      >
        <h3 className="font-medium">
          Difference heat grid <span className="text-caption text-text-tertiary">computed</span>
        </h3>
        <p className="text-caption text-text-secondary">
          Adjacent periods; same heading {heading} and unit {unit || "not stated"}.
        </p>
        <div
          aria-label="Difference heat grid color legend"
          className="flex flex-wrap gap-3 text-caption"
        >
          {DIRECTION[field] && (
            <>
              <span>
                <i
                  aria-hidden="true"
                  className="mr-1 inline-block size-3"
                  style={{ backgroundColor: BETTER[0] }}
                />
                Better
              </span>
              <span>
                <i
                  aria-hidden="true"
                  className="mr-1 inline-block size-3"
                  style={{ backgroundColor: WORSE[0] }}
                />
                Worse
              </span>
            </>
          )}
          <span>
            <i
              aria-hidden="true"
              className="mr-1 inline-block size-3"
              style={{ backgroundColor: NEUTRAL[1] }}
            />
            {DIRECTION[field]
              ? "No ruled direction"
              : "Neutral: no ruled Better or Worse direction"}
          </span>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table aria-label="Difference heat grid" className="min-w-max text-small">
            <thead>
              <tr>
                <th>Issuer</th>
                {periods.slice(1).map((to, index) => (
                  <th key={to}>
                    {periods[index]} to {to}
                  </th>
                ))}
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {heat.map((row) => (
                <tr key={row.issuer.key} aria-selected={row.issuer.key === selected}>
                  <th>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(row.issuer.key);
                      }}
                    >
                      {row.issuer.name}
                    </button>
                  </th>
                  {row.cells.map((cell) => {
                    const direction =
                      cell.change !== null && cell.after
                        ? verdict(field, cell.after.value, cell.change)
                        : null;
                    const magnitude =
                      cell.change && maxChange !== "0"
                        ? fraction(abs(cell.change), "0", maxChange)
                        : 0;
                    const background =
                      direction === "better"
                        ? step(magnitude, BETTER)
                        : direction === "worse"
                          ? step(magnitude, WORSE)
                          : NEUTRAL[1];
                    const sourceText = [
                      cell.before
                        ? `Prior ${written(cell.before.fact)} (${basis(cell.before)})`
                        : `${cell.from}: ${reasonAt(data, row.issuer, field, cell.from, heading, unit)}`,
                      cell.after
                        ? `Current ${written(cell.after.fact)} (${basis(cell.after)})`
                        : `${cell.to}: ${reasonAt(data, row.issuer, field, cell.to, heading, unit)}`,
                    ].join("; ");
                    const title = `${cell.reason || direction || "no ruled direction"}; ${sourceText}`;
                    return (
                      <td
                        key={`${cell.from}-${cell.to}`}
                        title={title}
                        aria-label={
                          cell.change === null
                            ? `No difference: ${title}`
                            : `${signed(cell.change, unit)}: ${sourceText}`
                        }
                        className={cell.change === null ? "gap-hatch" : "px-2 py-1"}
                        style={cell.change === null ? undefined : { backgroundColor: background }}
                      >
                        {cell.change === null ? (
                          <span aria-label={`No difference: ${title}`}>— ({title})</span>
                        ) : (
                          <>
                            {signed(cell.change, unit)}{" "}
                            {cell.change === "0" ? "→" : cell.change.startsWith("-") ? "↓" : "↑"}{" "}
                            {cell.before && (
                              <>
                                Prior {written(cell.before.fact)} ({basis(cell.before)})
                              </>
                            )}{" "}
                            {cell.after && (
                              <>
                                Current {written(cell.after.fact)} ({basis(cell.after)})
                              </>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    {openRun(
                      row.issuer,
                      row.cells
                        .flatMap((cell) => [cell.before, cell.after])
                        .find((member) => member !== undefined),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {periods.length < 2 && (
          <p className="text-small text-gap-text">No adjacent period pair is available.</p>
        )}
        {outOfOrder.length > 0 && (
          <section aria-label="Issuers left out of difference heat grid">
            <h4>Issuers left out: periods cannot be ordered</h4>
            <ul>
              {outOfOrder.map((issuer) => (
                <li key={issuer.key}>
                  {issuer.name}: periods cannot be ordered {openRun(issuer)}{" "}
                  {sourceDisclosure("Period evidence", issuerSources(data, issuer, field), false)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </>
  );
}
