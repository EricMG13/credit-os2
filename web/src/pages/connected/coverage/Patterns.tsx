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

type Props = {
  data: Coverage;
  issuers: readonly Issuer[];
  selected: string | null;
  onSelect: (issuer: string) => void;
};
type LevelPoint = {
  issuer: Issuer;
  member: Member;
  prior: Member;
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
type OutRow = { issuer: Issuer; reason: string; field: string };

function orderedIssuers(data: Coverage, issuers: readonly Issuer[], field: string): Issuer[] {
  return issuers.filter((issuer) => periodsOrdered(data, [issuer], field));
}

function orderedPeriods(data: Coverage, issuers: readonly Issuer[], field: string): string[] {
  return periodsOf(data, issuers, field);
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

export function scaleWithReference(values: readonly Dec[], reference?: Dec) {
  const bounds = range([...values, ...(reference === undefined ? [] : [reference])]);
  return {
    bounds,
    points: values.map((value) => coordinate(value, bounds)),
    reference: reference === undefined ? null : coordinate(reference, bounds),
  };
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
  return (out?.out ?? []).map(({ issuer, reason }) => ({ issuer, reason, field }));
}

function operand(label: string, member: Member): string {
  return `${label} ${member.fact.period ?? "period not stated"}: ${written(member.fact)}; basis ${member.fact.basis ?? "not stated"}`;
}

function issuerButton(issuer: Issuer, selected: string | null, onSelect: Props["onSelect"]) {
  return <button type="button" aria-pressed={issuer.key === selected} onClick={onSelect.bind(null, issuer.key)}>{issuer.name}</button>;
}

function openRun(issuer: Issuer, member: Member, details: string) {
  const label = `Open run for ${issuer.name}; ${details}`;
  return <a href={evidenceLink(member.run, member.fact)} title={label} aria-label={label}>Open run</a>;
}

function tableOut(out: readonly OutRow[], fields: ReadonlyMap<string, string>, title: string) {
  const rows = new Map<string, { issuer: Issuer; details: string[] }>();
  for (const item of out) {
    const field = fields.get(item.field) ?? "Figure";
    const row = rows.get(item.issuer.key) ?? { issuer: item.issuer, details: [] };
    const text = `${field}: ${item.reason}`;
    if (!row.details.includes(text)) row.details.push(text);
    rows.set(item.issuer.key, row);
  }
  return rows.size > 0 && (
    <section aria-label={title}>
      <h3>{title}</h3>
      <ul>{[...rows.values()].map(({ issuer, details }) => <li key={issuer.key}>{issuer.name}: {details.join("; ")}</li>)}</ul>
    </section>
  );
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

  const levelPoints = useMemo((): LevelPoint[] => {
    if (!field || !current || !previous || !previousPeriod) return [];
    const previousMembers = new Map(previous.members.map((member) => [member.issuer.key, member]));
    const issuerByKey = new Map(seriesIssuers.map((issuer) => [issuer.key, issuer]));
    const drawn = current.members.flatMap((member) => {
      const prior = previousMembers.get(member.issuer.key);
      const issuer = issuerByKey.get(member.issuer.key);
      if (!prior || !issuer) return [];
      const change = difference(member.value, prior.value);
      return change === null
        ? []
        : [{ issuer, member, prior, xValue: member.value, yValue: change }];
    });
    return drawn;
  }, [current, field, previous, previousPeriod, seriesIssuers]);
  const levelScale = scaleWithReference(
    levelPoints.map((point) => point.xValue),
    current?.stats?.median,
  );
  const diffBounds = range(levelPoints.map((point) => point.yValue));
  const plotPoints = levelPoints.map((point) => ({
    ...point,
    x: coordinate(point.xValue, levelScale.bounds),
    y: coordinate(point.yValue, diffBounds),
  }));
  const levelMedian = current?.stats ?? null;
  const differenceMedian = stats(levelPoints.map((point) => point.yValue));
  const levelOut = [
    ...withField(current, field?.id ?? ""),
    ...withField(previous, field?.id ?? ""),
    ...issuers
      .filter((issuer) => field && !periodsOrdered(fieldData, [issuer], field.id))
      .map((issuer) => ({ issuer, field: field?.id ?? "", reason: "periods cannot be ordered" })),
  ];

  const twoPoints = (() => {
    if (!current || !secondCurrent) return [] as TwoPoint[];
    const secondMembers = new Map(
      secondCurrent.members.map((member) => [member.issuer.key, member]),
    );
    const points = current.members.flatMap((member) => {
      const paired = secondMembers.get(member.issuer.key);
      return paired
        ? [{ issuer: member.issuer, xValue: member.value, yValue: paired.value, xMember: member, yMember: paired }]
        : [];
    });
    const [xLow, xHigh] = range(points.map((point) => point.xValue));
    const [yLow, yHigh] = range(points.map((point) => point.yValue));
    return points.map((point) => ({ ...point, x: coordinate(point.xValue, [xLow, xHigh]), y: coordinate(point.yValue, [yLow, yHigh]) }));
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
          {!issuers.length ? (
            <p role="status" className="text-small text-gap-text">
              No qualifying figures; exact tables are empty, and the scatter and statistics are unavailable.
            </p>
          ) : axis.length === 0 ? (
            <p className="text-small text-gap-text">
              {seriesIssuers.length === 0
                ? "Periods cannot be put in time order, so no difference plot is drawn."
                : "No qualifying figures; the difference view is unavailable."}
            </p>
          ) : levelPoints.length < 3 ? (
            <p role="status" className="text-small text-gap-text">
              {current?.members.length
                ? "Fewer than three qualifying issuers have both current and prior facts; exact facts are listed below, and the scatter and difference median are unavailable."
                : "No qualifying figures; exact facts are listed below, and the scatter and statistics are unavailable."}
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
                      value: `${current?.heading || "Level"} (${current?.unit || "unit not stated"})`,
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
                      value: `Difference from prior (${current?.unit || "unit not stated"})`,
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  {levelScale.reference !== null && (
                    <ReferenceLine
                      x={levelScale.reference}
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
                  <Scatter data={plotPoints} dataKey="y" shape={dots(selected, colours)} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
          <table aria-label="Level versus difference data" className="w-full text-small">
            <thead>
              <tr>
                <th>Issuer</th>
                <th>Period</th>
                <th>{current?.heading ?? "Level"} ({current?.unit || "unit not stated"})</th>
                <th>Basis</th>
                <th>Difference from prior ({current?.unit || "unit not stated"})</th>
                <th>Sector</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {levelPoints.map((point) => (
                <tr key={point.issuer.key} aria-selected={point.issuer.key === selected}>
                  <th>{issuerButton(point.issuer, selected, onSelect)}</th>
                  <td>{point.member.fact.period}</td>
                  <td>{written(point.member.fact)}</td>
                  <td>{point.member.fact.basis ?? "Basis not stated"}</td>
                  <td>{signed(point.yValue, current?.unit ?? "")}</td>
                  <td>{point.issuer.sector ?? "Sector not stated"}</td>
                  <td>{openRun(point.issuer, point.member, `${operand("current", point.member)}; ${operand("prior", point.prior)}`)}</td>
                </tr>
              ))}
              {!previousPeriod && current?.members.map((member) => (
                <tr key={member.issuer.key} aria-selected={member.issuer.key === selected}>
                  <th>{issuerButton(member.issuer, selected, onSelect)}</th><td>{member.fact.period}</td>
                  <td>{written(member.fact)}</td><td>{member.fact.basis ?? "Basis not stated"}</td>
                  <td>No adjacent prior period</td><td>{member.issuer.sector ?? "Sector not stated"}</td>
                  <td>{openRun(member.issuer, member, operand("current", member))}</td>
                </tr>
              ))}
              {levelPoints.length >= 3 && (levelMedian || differenceMedian) && (
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
                    {differenceMedian
                      ? signed(differenceMedian.median, current?.unit ?? "")
                      : "No median (fewer than three paired issuers)"}
                  </td>
                  <td>
                    Current cohort: {current?.members.length || "none"}; paired: {levelPoints.length || "none"}
                  </td>
                  <td>Current and paired figures are listed in their issuer rows.</td>
                </tr>
              )}
            </tbody>
          </table>
          {tableOut(levelOut, fieldLabels, "Issuers not plotted in level versus difference")}
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
          {twoPoints.length < 3 ? (
            <p role="status" className="text-small text-gap-text">
              {twoPoints.length
                ? "Fewer than three qualifying issuers; exact facts are listed below, and the scatter is unavailable."
                : "No issuers qualify on both measures; exact facts are listed below, and the scatter is unavailable."}
            </p>
          ) : <div role="img" aria-label="Two measures scatter chart" className="h-56 w-full">
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
                    value: `${current?.heading || "Measure"} (${current?.unit || "unit not stated"})`,
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
                    value: `${secondCurrent?.heading || "Second measure"} (${secondCurrent?.unit || "unit not stated"})`,
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Scatter data={twoPoints} dataKey="y" shape={dots(selected, colours)} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>}
          <table aria-label="Two measures data" className="w-full text-small">
            <thead>
              <tr>
                <th>Issuer</th>
                <th>{current?.heading ?? "Measure"} ({current?.unit || "unit not stated"})</th>
                <th>Basis</th>
                <th>{secondCurrent?.heading ?? "Second measure"} ({secondCurrent?.unit || "unit not stated"})</th>
                <th>Basis</th>
                <th>Sector</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {twoPoints.map((point) => (
                <tr key={point.issuer.key} aria-selected={point.issuer.key === selected}>
                  <th>{issuerButton(point.issuer, selected, onSelect)}</th>
                  <td>{written(point.xMember.fact)}</td>
                  <td>{point.xMember.fact.basis ?? "Basis not stated"}</td>
                  <td>{written(point.yMember.fact)}</td>
                  <td>{point.yMember.fact.basis ?? "Basis not stated"}</td>
                  <td>{point.issuer.sector ?? "Sector not stated"}</td>
                  <td>{openRun(point.issuer, point.xMember, `${operand("X", point.xMember)}; ${operand("Y", point.yMember)}`)}</td>
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
