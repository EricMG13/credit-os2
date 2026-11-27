import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import type { ScatterShapeProps } from "recharts/types/util/ScatterUtils";
import { comparePeriodKeys, periodKey } from "@/utils/periodOrder";
import { SECTOR } from "../visuals/signal/scales";
import {
  evidenceLink,
  periodsOf,
  periodsOrdered,
  type Coverage,
  type Issuer,
} from "../coverageData";
import { cohort, type Cohort, type Member } from "./cohort";
import { compare, difference, stats, type Dec } from "./coverageMath";
import { DIRECTION } from "./direction";
import { fieldLabel, fraction, written, writtenText } from "./monitorMath";
import { LeftOut } from "./LeftOut";

type Props = {
  data: Coverage;
  issuers: readonly Issuer[];
  selected: string | null;
  onSelect: (issuer: string) => void;
};
type Point = {
  issuer: Issuer;
  member: Member;
  prior: Member;
  x: number;
  y: number;
  xValue: Dec;
  yValue: Dec;
};
type TwoPoint = {
  issuer: Issuer;
  x: number;
  y: number;
  xValue: Dec;
  yValue: Dec;
  xMember: Member;
  yMember: Member;
};
type OutRow = Cohort["out"][number] & { field: string };

function orderedIssuers(data: Coverage, issuers: readonly Issuer[], field: string): Issuer[] {
  return issuers.filter((issuer) => periodsOrdered(data, [issuer], field));
}

function orderedPeriods(data: Coverage, issuers: readonly Issuer[], field: string): string[] {
  const values = periodsOf(data, issuers, field);
  if (!periodsOrdered(data, issuers, field)) return values;
  return [...values].sort((left, right) => {
    const a = periodKey(left);
    const b = periodKey(right);
    return a && b ? comparePeriodKeys(a, b) : 0;
  });
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
  const sign = value.startsWith("-") ? `−${value.slice(1)}` : value === "0" ? value : `+${value}`;
  return writtenText(sign, unit);
}

function sectorMap(issuers: readonly Issuer[]): Map<string, string> {
  const names = [...new Set(issuers.map((issuer) => issuer.sector ?? "Sector not stated"))].sort();
  return new Map(names.map((name, index) => [name, SECTOR[index % SECTOR.length] ?? SECTOR[0]]));
}

function dots(
  selected: string | null,
  colours: ReadonlyMap<string, string>,
): (point: ScatterShapeProps) => ReactElement {
  return (point) => {
    const issuer = (point.payload as { issuer: Issuer }).issuer;
    const active = issuer.key === selected;
    return (
      <circle
        cx={point.cx ?? 0}
        cy={point.cy ?? 0}
        r={active ? 5 : 4}
        fill={colours.get(issuer.sector ?? "Sector not stated")}
        stroke={active ? "var(--color-text-primary)" : "var(--color-surface-card)"}
        strokeWidth={active ? 2.5 : 1}
      />
    );
  };
}

function withField(out: Cohort | null, field: string): OutRow[] {
  return (out?.out ?? []).map((item) => ({ ...item, field }));
}

function tableOut(out: readonly OutRow[], fields: ReadonlyMap<string, string>, title: string) {
  const unique = [...new Map(out.map((item) => [item.issuer.key, item])).values()];
  const details = new Map<string, string[]>();
  for (const item of out) {
    const field = fields.get(item.field) ?? "Figure";
    const reasons = details.get(item.issuer.key) ?? [];
    const text = `${field}: ${item.reason}`;
    if (!reasons.includes(text)) reasons.push(text);
    details.set(item.issuer.key, reasons);
  }
  return <LeftOut out={unique} title={title} details={details} />;
}

export function Patterns({ data, issuers, selected, onSelect }: Props) {
  const fields = useMemo(
    () => data.fields.filter((field) => field.kind === "number" && field.series === "period"),
    [data.fields],
  );
  const [fieldPick, setFieldPick] = useState("");
  const [secondPick, setSecondPick] = useState("");
  const [periodPick, setPeriodPick] = useState("");
  const field = fields.find((item) => item.id === fieldPick) ?? fields[0];
  const otherFields = fields.filter((item) => item.id !== field?.id);
  const second = otherFields.find((item) => item.id === secondPick) ?? otherFields[0];
  const secondId = second?.id;
  const indexed = useMemo(
    () =>
      new Map(
        fields.map((item) => [
          item.id,
          { ...data, facts: data.facts.filter((fact) => fact.field === item.id) },
        ]),
      ),
    [data, fields],
  );
  const fieldData = field ? (indexed.get(field.id) ?? data) : data;
  const seriesIssuers = useMemo(
    () => (field ? orderedIssuers(fieldData, issuers, field.id) : []),
    [field, fieldData, issuers],
  );
  const axis = useMemo(
    () => (field ? orderedPeriods(fieldData, seriesIssuers, field.id) : []),
    [field, fieldData, seriesIssuers],
  );
  const sourcePeriods = useMemo(
    () => (field ? periodsOf(fieldData, issuers, field.id) : []),
    [field, fieldData, issuers],
  );
  const initialPeriods = axis.length > 0 ? axis : sourcePeriods;
  const allPeriods = useMemo(() => {
    const union = [
      ...new Set(
        fields.flatMap((item) => periodsOf(indexed.get(item.id) ?? data, issuers, item.id)),
      ),
    ];
    const keys = union.map(periodKey);
    return keys.every(Boolean)
      ? [...union].sort((left, right) => {
          const a = periodKey(left);
          const b = periodKey(right);
          return a && b ? comparePeriodKeys(a, b) : 0;
        })
      : union;
  }, [data, fields, indexed, issuers]);
  const period = allPeriods.includes(periodPick)
    ? periodPick
    : (initialPeriods.at(-1) ?? initialPeriods[0] ?? allPeriods.at(-1) ?? allPeriods[0] ?? "");
  const current = useMemo(
    () => (field ? cohort(fieldData, issuers, field.id, period) : null),
    [field, fieldData, issuers, period],
  );
  const previousPeriod = axis[axis.indexOf(period) - 1];
  const previous = useMemo(
    () =>
      field && current && previousPeriod
        ? cohort(fieldData, seriesIssuers, field.id, previousPeriod, {
            heading: current.heading,
            unit: current.unit,
          })
        : null,
    [current, field, fieldData, previousPeriod, seriesIssuers],
  );
  const secondCurrent = secondId
    ? cohort(indexed.get(secondId) ?? data, issuers, secondId, period)
    : null;
  const colours = useMemo(() => sectorMap(data.issuers), [data.issuers]);
  const fieldLabels = useMemo(
    () => new Map(fields.map((item) => [item.id, fieldLabel(data, item.id)])),
    [data, fields],
  );

  const levelPoints = useMemo(() => {
    if (!field || !current || !previous || !previousPeriod) return [] as Point[];
    const previousMembers = new Map(previous.members.map((member) => [member.issuer.key, member]));
    const issuerByKey = new Map(seriesIssuers.map((issuer) => [issuer.key, issuer]));
    const drawn = current.members.flatMap((member) => {
      const prior = previousMembers.get(member.issuer.key);
      const issuer = issuerByKey.get(member.issuer.key);
      if (!prior || !issuer) return [];
      const change = difference(member.value, prior.value);
      return change === null
        ? []
        : [{ issuer, member, prior, x: 0, y: 0, xValue: member.value, yValue: change }];
    });
    const [xLow, xHigh] = range(drawn.map((item) => item.xValue));
    const [yLow, yHigh] = range(drawn.map((item) => item.yValue));
    return drawn.map((item) => ({
      ...item,
      x: coordinate(item.xValue, [xLow, xHigh]),
      y: coordinate(item.yValue, [yLow, yHigh]),
    }));
  }, [current, field, previous, previousPeriod, seriesIssuers]);
  const levelBounds = range([
    ...levelPoints.map((point) => point.xValue),
    ...(current?.members.map((member) => member.value) ?? []),
  ]);
  const diffBounds = range(levelPoints.map((point) => point.yValue));
  const levelMedian = current?.stats ?? null;
  const differenceMedian = stats(levelPoints.map((point) => point.yValue));
  const levelOut = [
    ...withField(current, field?.id ?? ""),
    ...withField(previous, field?.id ?? ""),
  ];

  const twoPoints = (() => {
    if (!current || !secondCurrent) return [] as TwoPoint[];
    const secondMembers = new Map(
      secondCurrent.members.map((member) => [member.issuer.key, member]),
    );
    const points = current.members.flatMap((member) => {
      const paired = secondMembers.get(member.issuer.key);
      return paired
        ? [
            {
              issuer: member.issuer,
              x: 0,
              y: 0,
              xValue: member.value,
              yValue: paired.value,
              xMember: member,
              yMember: paired,
            },
          ]
        : [];
    });
    const [xLow, xHigh] = range(points.map((point) => point.xValue));
    const [yLow, yHigh] = range(points.map((point) => point.yValue));
    return points.map((point) => ({
      ...point,
      x: coordinate(point.xValue, [xLow, xHigh]),
      y: coordinate(point.yValue, [yLow, yHigh]),
    }));
  })();
  const twoXBounds = range(twoPoints.map((point) => point.xValue));
  const twoYBounds = range(twoPoints.map((point) => point.yValue));
  const twoOut = [
    ...withField(current, field?.id ?? ""),
    ...withField(secondCurrent, second?.id ?? ""),
  ];

  return (
    <section aria-label="Patterns" className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-small text-text-secondary">
          Measure
          <select
            aria-label="Measure"
            value={field?.id ?? ""}
            onChange={(event) => {
              setFieldPick(event.currentTarget.value);
            }}
            className="h-9 rounded-ds-sm border border-border-control bg-surface-card px-2 text-text-primary"
          >
            {fields.map((item) => (
              <option key={item.id} value={item.id}>
                {fieldLabel(data, item.id)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-small text-text-secondary">
          Second measure
          <select
            aria-label="Second measure"
            value={second?.id ?? ""}
            onChange={(event) => {
              setSecondPick(event.currentTarget.value);
            }}
            className="h-9 rounded-ds-sm border border-border-control bg-surface-card px-2 text-text-primary"
          >
            {otherFields.map((item) => (
              <option key={item.id} value={item.id}>
                {fieldLabel(data, item.id)}
              </option>
            ))}
          </select>
        </label>
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
            {allPeriods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <section
          aria-label="Level against difference"
          className="rounded-ds-lg border border-border-subtle bg-surface-card p-3"
        >
          <h3 className="font-medium">
            Level against difference{" "}
            <span className="text-caption text-text-tertiary">computed</span>
          </h3>
          {previousPeriod ? (
            <p className="text-caption text-text-secondary">
              {period} versus {previousPeriod}
            </p>
          ) : (
            <p className="text-caption text-gap-text">No adjacent prior period is available.</p>
          )}
          {axis.length === 0 ? (
            <p className="text-small text-gap-text">
              Periods cannot be put in time order, so no difference plot is drawn.
            </p>
          ) : (
            <div
              role="img"
              aria-label="Level against difference scatter chart"
              className="h-56 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 18, bottom: 16, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, 100]}
                    tick={false}
                    label={{
                      value: `${field ? fieldLabel(data, field.id) : "Level"} (${current?.unit || "unit not stated"})`,
                      position: "insideBottom",
                      offset: -8,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[0, 100]}
                    ticks={[0, 100]}
                    tickFormatter={(value: number) => {
                      const endpoint = value === 0 ? diffBounds[0] : diffBounds[1];
                      const direction = field ? DIRECTION[field.id] : undefined;
                      const word = direction
                        ? value === 0
                          ? direction === "lower"
                            ? "Better"
                            : "Worse"
                          : direction === "lower"
                            ? "Worse"
                            : "Better"
                        : "";
                      return `${word ? `${word} ` : ""}${signed(endpoint, current?.unit ?? "")}`;
                    }}
                    label={{
                      value: `Difference (${current?.unit || "unit not stated"})`,
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  {levelMedian && (
                    <ReferenceLine
                      x={coordinate(levelMedian.median, levelBounds)}
                      stroke="var(--color-text-tertiary)"
                      strokeDasharray="4 3"
                    />
                  )}
                  {differenceMedian && (
                    <ReferenceLine
                      y={coordinate(differenceMedian.median, diffBounds)}
                      stroke="var(--color-text-tertiary)"
                      strokeDasharray="4 3"
                    />
                  )}
                  <Scatter data={levelPoints} dataKey="y" shape={dots(selected, colours)} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
          <table aria-label="Level versus difference data" className="w-full text-small">
            <thead>
              <tr>
                <th>Issuer</th>
                <th>Period</th>
                <th>Level</th>
                <th>Basis</th>
                <th>Difference</th>
                <th>Sector</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {levelPoints.map((point) => (
                <tr key={point.issuer.key} aria-selected={point.issuer.key === selected}>
                  <th>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(point.issuer.key);
                      }}
                    >
                      {point.issuer.name}
                    </button>
                  </th>
                  <td>{point.member.fact.period}</td>
                  <td>{written(point.member.fact)}</td>
                  <td>{point.member.fact.basis ?? "Basis not stated"}</td>
                  <td>{signed(point.yValue, current?.unit ?? "")}</td>
                  <td>{point.issuer.sector ?? "Sector not stated"}</td>
                  <td>
                    <a href={evidenceLink(point.member.run, point.member.fact)}>Current</a>{" "}
                    <a href={evidenceLink(point.prior.run, point.prior.fact)}>Prior</a>
                  </td>
                </tr>
              ))}
              {(levelMedian || differenceMedian) && (
                <tr>
                  <th>Median (computed)</th>
                  <td>{period}</td>
                  <td>{levelMedian ? writtenText(levelMedian.median, current?.unit) : "—"}</td>
                  <td>
                    {current
                      ? `${current.heading}; ${current.unit || "unit not stated"}`
                      : "Basis not stated"}
                  </td>
                  <td>
                    {differenceMedian ? signed(differenceMedian.median, current?.unit ?? "") : "—"}
                  </td>
                  <td>
                    Current {String(levelMedian?.count ?? 0)}; paired{" "}
                    {String(differenceMedian?.count ?? 0)}
                  </td>
                  <td>
                    {[
                      ...(current?.members.map((member) => (
                        <a
                          key={`${member.issuer.key}-level-source`}
                          href={evidenceLink(member.run, member.fact)}
                        >
                          {member.issuer.name} level
                        </a>
                      )) ?? []),
                      " ",
                      ...levelPoints.map((point) => (
                        <a
                          key={`${point.issuer.key}-prior`}
                          href={evidenceLink(point.prior.run, point.prior.fact)}
                        >
                          {point.issuer.name} prior
                        </a>
                      )),
                    ]}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {tableOut(levelOut, fieldLabels, "Issuers not plotted in level versus difference")}
          {!previousPeriod && current && (
            <section aria-label="Issuers without an adjacent prior period">
              <h4>Issuers left out</h4>
              <ul>
                {current.members.map((member) => (
                  <li key={member.issuer.key}>{member.issuer.name}: no adjacent prior period</li>
                ))}
              </ul>
            </section>
          )}
          {axis.length === 0 && (
            <section aria-label="Issuers left out of level versus difference ordering">
              <h4>Issuers left out</h4>
              <ul>
                {issuers.map((issuer) => (
                  <li key={issuer.key}>{issuer.name}: periods cannot be ordered</li>
                ))}
              </ul>
            </section>
          )}
          {axis.length > 0 && (
            <p className="text-caption">
              Level and differences are shown only for issuers with the same heading and unit at
              both adjacent periods.
            </p>
          )}
        </section>

        <section
          aria-label="Two measures"
          className="rounded-ds-lg border border-border-subtle bg-surface-card p-3"
        >
          <h3 className="font-medium">
            Two measures <span className="text-caption text-text-tertiary">computed</span>
          </h3>
          <p className="text-caption text-text-secondary">
            {period}; only issuers qualifying on both measures are plotted.
          </p>
          <div role="img" aria-label="Two measures scatter chart" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 18, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 100]}
                  ticks={[0, 100]}
                  tickFormatter={(value) =>
                    value === 0
                      ? writtenText(twoXBounds[0], current?.unit)
                      : writtenText(twoXBounds[1], current?.unit)
                  }
                  label={{
                    value: `${field ? fieldLabel(data, field.id) : "Measure"} (${current?.unit || "unit not stated"})`,
                    position: "insideBottom",
                    offset: -8,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, 100]}
                  ticks={[0, 100]}
                  tickFormatter={(value) =>
                    value === 0
                      ? writtenText(twoYBounds[0], secondCurrent?.unit)
                      : writtenText(twoYBounds[1], secondCurrent?.unit)
                  }
                  label={{
                    value: `${second ? fieldLabel(data, second.id) : "Second measure"} (${secondCurrent?.unit || "unit not stated"})`,
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Scatter data={twoPoints} dataKey="y" shape={dots(selected, colours)} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <table aria-label="Two measures data" className="w-full text-small">
            <thead>
              <tr>
                <th>Issuer</th>
                <th>{field ? fieldLabel(data, field.id) : "Measure"}</th>
                <th>Basis</th>
                <th>{second ? fieldLabel(data, second.id) : "Second measure"}</th>
                <th>Basis</th>
                <th>Sector</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {twoPoints.map((point) => (
                <tr key={point.issuer.key} aria-selected={point.issuer.key === selected}>
                  <th>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(point.issuer.key);
                      }}
                    >
                      {point.issuer.name}
                    </button>
                  </th>
                  <td>{written(point.xMember.fact)}</td>
                  <td>{point.xMember.fact.basis ?? "Basis not stated"}</td>
                  <td>{written(point.yMember.fact)}</td>
                  <td>{point.yMember.fact.basis ?? "Basis not stated"}</td>
                  <td>{point.issuer.sector ?? "Sector not stated"}</td>
                  <td>
                    <a href={evidenceLink(point.xMember.run, point.xMember.fact)}>X</a>{" "}
                    <a href={evidenceLink(point.yMember.run, point.yMember.fact)}>Y</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tableOut(twoOut, fieldLabels, "Issuers left out of two measures")}
        </section>
      </div>
    </section>
  );
}
