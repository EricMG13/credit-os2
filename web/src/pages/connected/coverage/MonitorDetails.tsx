import { useMemo } from "react";
import { evidenceLink, type Coverage, type Issuer } from "../coverageData";
import { cohort, type Cohort } from "./cohort";
import { band, compare, difference, type Dec, type Stats } from "./coverageMath";
import { fieldLabel, fraction, written, writtenText } from "./monitorMath";

type History = { period: string; stats: Stats | null }[];
const BANDS = [
  "bottom quartile",
  "lower middle half",
  "upper middle half",
  "top quartile",
] as const;

function segments(history: History): { low: string; high: string; median: string }[] {
  const drawable = history.flatMap(({ stats }, index) => (stats ? [{ index, stats }] : []));
  if (drawable.length < 2) return [];
  const values = drawable.flatMap(({ stats }) => [stats.q1, stats.q3]);
  const low = values.reduce((a, b) => (compare(a, b) < 0 ? a : b));
  const high = values.reduce((a, b) => (compare(a, b) > 0 ? a : b));
  const y = (v: Dec) => 30 - fraction(v, low, high) * 26;
  const x = (i: number) => 3 + (i * 94) / Math.max(1, history.length - 1);
  const chunks: (typeof drawable)[] = [];
  for (const item of drawable) {
    const chunk = chunks[chunks.length - 1];
    if (chunk && item.index === (chunk[chunk.length - 1]?.index ?? -2) + 1) chunk.push(item);
    else chunks.push([item]);
  }
  return chunks
    .filter((chunk) => chunk.length > 1)
    .map((chunk) => ({
      low: chunk.map(({ index, stats }) => `${String(x(index))},${String(y(stats.q1))}`).join(" "),
      high: [...chunk]
        .reverse()
        .map(({ index, stats }) => `${String(x(index))},${String(y(stats.q3))}`)
        .join(" "),
      median: chunk
        .map(({ index, stats }) => `${String(x(index))},${String(y(stats.median))}`)
        .join(" "),
    }));
}

export function MonitorDetails({
  data,
  issuers,
  fields,
  cohorts,
  axes,
  indexedData,
  selected,
  period,
}: {
  data: Coverage;
  issuers: readonly Issuer[];
  fields: readonly string[];
  cohorts: ReadonlyMap<string, Cohort>;
  axes: ReadonlyMap<string, readonly string[]>;
  indexedData: ReadonlyMap<string, Coverage>;
  selected: string | null;
  period: string;
}) {
  const histories = useMemo(
    () =>
      new Map(
        fields.map((field) => {
          const current = cohorts.get(field);
          const axis = axes.get(field) ?? [];
          const fieldData = indexedData.get(field) ?? data;
          return [
            field,
            axis.map((period) => {
              const c =
                current &&
                cohort(fieldData, issuers, field, period, {
                  heading: current.heading,
                  unit: current.unit,
                });
              return { period, stats: c?.stats ?? null };
            }),
          ] as const;
        }),
      ),
    [data, issuers, fields, cohorts, axes, indexedData],
  );
  return (
    <>
      <div
        role="region"
        aria-label="Monitor cohort summary"
        className="grid grid-cols-2 gap-2 md:grid-cols-5"
      >
        {fields.map((field) => {
          const c = cohorts.get(field);
          const history = histories.get(field) ?? [];
          const paths = segments(history);
          return (
            <section key={field} className="border-l border-border-hairline px-3 py-2">
              <h3 className="text-caption">{fieldLabel(data, field)}</h3>
              <p className="font-mono text-small">
                Median (computed): {c?.stats ? writtenText(c.stats.median, c.unit) : "—"}
              </p>
              <p className="text-caption text-text-secondary">
                {c?.members.length ?? 0} of {issuers.length} issuers qualify
              </p>
              {c?.members[0] && (
                <a
                  className="text-caption underline"
                  href={evidenceLink(c.members[0].run, c.members[0].fact)}
                >
                  Trace
                </a>
              )}
              <svg
                viewBox="0 0 100 32"
                role="img"
                aria-label={`${fieldLabel(data, field)} cohort median over time`}
                className="h-8 w-full"
              >
                {paths.map((path, index) => (
                  <g key={index}>
                    <polygon points={`${path.low} ${path.high}`} className="fill-action/10" />
                    <polyline points={path.median} fill="none" className="stroke-text-secondary" />
                  </g>
                ))}
              </svg>
            </section>
          );
        })}
      </div>
      {selected && (
        <section
          aria-label="Selected issuer details"
          className="grid grid-cols-2 gap-2 md:grid-cols-5"
        >
          {fields.map((field) => {
            const c = cohorts.get(field);
            const member = c?.members.find((item) => item.issuer.key === selected);
            const axis = axes.get(field) ?? [];
            const currentIndex = axis.indexOf(period);
            const prior = currentIndex > 0 ? axis[currentIndex - 1] : undefined;
            const earlier =
              prior && member
                ? cohort(indexedData.get(field) ?? data, [member.issuer], field, prior, {
                    heading: c?.heading,
                    unit: c?.unit,
                  }).members[0]
                : undefined;
            const change = member && earlier ? difference(member.value, earlier.value) : null;
            const rank = member && c?.stats ? band(member.value, c.stats) : null;
            return (
              <div key={field} className="px-3 py-2 text-small">
                <h3>{fieldLabel(data, field)}</h3>
                <p className="font-mono">{member ? written(member.fact) : "No qualified figure"}</p>
                <p>Period {period}</p>
                <p>
                  {change === null
                    ? "No prior difference"
                    : `Difference from ${prior ?? "the prior period"}: ${writtenText(change, c?.unit)}`}
                </p>
                <p>{rank === null ? "No cohort band" : BANDS[rank]}</p>
                <p>
                  {c?.stats
                    ? `Cohort median ${writtenText(c.stats.median, c.unit)}`
                    : "No cohort median"}
                </p>
                {member && (
                  <a className="underline" href={evidenceLink(member.run, member.fact)}>
                    Trace
                  </a>
                )}
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
