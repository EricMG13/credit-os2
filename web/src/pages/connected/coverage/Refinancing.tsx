import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  evidenceLink,
  factsOf,
  latestRun,
  type Coverage,
  type Fact,
  type Issuer,
} from "../coverageData";
import { AMOUNT, SECTOR, step } from "../visuals/signal/scales";
import { abs, sum, compare, type Dec } from "./coverageMath";
import { fraction } from "./monitorMath";
import { MiniColumns } from "../visuals/signal/Sparkline";
import { unitLabel, writtenUnit } from "../moneyUnits";
import { orderPeriods } from "@/utils/periodOrder";

const REFI = "cp-3c/refinancing-need/debt-maturing";
const FOUNDATION = "cp-1/debt-maturities/debt-maturing";
const RESOURCES = "cp-3c/refinancing-need/committed-resources";
type Props = {
  data: Coverage;
  issuers: readonly Issuer[];
  selected: string | null;
  onSelect: (issuer: string) => void;
};
/** A common signed chart scale with zero fixed at the centre; output is only for drawing pixels. */
function wallCoordinate(value: Dec | null, extent: Dec): number | null {
  if (value === null) return null;
  if (value === "0" || extent === "0") return 0;
  return fraction(value, `-${extent}`, extent) * 2 - 1;
}

function entries(data: Coverage, issuers: readonly Issuer[]) {
  return issuers.map((issuer) => {
    const run = latestRun(issuer);
    const newer = run ? factsOf(data, run.key, REFI) : [];
    const source = newer.length > 0 ? REFI : FOUNDATION;
    const facts = run ? factsOf(data, run.key, source) : [];
    const resources = run ? factsOf(data, run.key, RESOURCES) : [];
    return { issuer, source, facts, resources };
  });
}

function stated(fact: Fact): Dec | null {
  if (fact.at === null || fact.gap) return null;
  return sum([fact.text]);
}

function sourceName(source: string): string {
  return source === REFI ? "Refinancing & LME" : "Financial foundation";
}

function amountText(fact: Fact): string {
  return writtenUnit(fact.text, fact.unit);
}

function amountReading(label: string, facts: readonly Fact[], value: Dec | null): string {
  if (facts.length > 1)
    return `${label}: multiple amounts left out (${facts.map(amountText).join("; ")})`;
  const [fact] = facts;
  if (!fact) return `${label}: not stated`;
  if (value !== null) return `${label}: ${amountText(fact)}`;
  if (fact.gap || fact.at === null) return `${label}: amount not stated`;
  return `${label}: ${fact.text} (not a readable amount)`;
}

function basisText(facts: readonly Fact[]): string {
  return facts.map((fact) => fact.basis ?? "Not stated").join("; ") || "Not stated";
}

function openRunHref(issuer: Issuer, fact: Fact): string {
  const run = latestRun(issuer);
  if (!run) throw new Error(`Cannot open ${issuer.name}'s source fact: the issuer has no run`);
  return evidenceLink(run, fact);
}

function OpenRun({ issuer, fact, label }: { issuer: Issuer; fact: Fact; label: string }) {
  return (
    <a href={openRunHref(issuer, fact)} aria-label={label}>
      {label}
    </a>
  );
}

function currentFacts(data: Coverage, issuer: Issuer, field: string, period: string, unit: string) {
  const run = latestRun(issuer);
  return run
    ? factsOf(data, run.key, field).filter(
        (fact) => fact.period === period && (fact.unit ?? "") === unit,
      )
    : [];
}

function neutralMarks(maturity: Dec | null, resources: Dec | null, label: string) {
  const values = [maturity, resources].flatMap((value) => (value === null ? [] : [value]));
  if (values.length === 0)
    return <span aria-label={`${label}: no comparable amounts`}>Not stated</span>;
  const low = values.reduce((a, b) => (compare(a, b) < 0 ? a : b));
  const high = values.reduce((a, b) => (compare(a, b) > 0 ? a : b));
  const x = (value: Dec | null) => (value === null ? null : 8 + fraction(value, low, high) * 84);
  const resourceX = x(resources) ?? 8;
  return (
    <svg role="img" aria-label={label} width="100" height="24" viewBox="0 0 100 24">
      <line x1="8" x2="92" y1="12" y2="12" stroke="currentColor" strokeOpacity=".25" />
      {maturity !== null && (
        <circle
          data-mark="debt maturing"
          cx={x(maturity) ?? 8}
          cy="8"
          r="4"
          fill="var(--color-text-secondary)"
        />
      )}
      {resources !== null && (
        <path
          data-mark="committed resources"
          d={`M${String(resourceX)} 13 L${String(resourceX - 5)} 22 L${String(resourceX + 5)} 22 Z`}
          fill="var(--color-text-secondary)"
        />
      )}
    </svg>
  );
}

export function Refinancing({ data, issuers, selected, onSelect }: Props) {
  const input = useMemo(() => entries(data, issuers), [data, issuers]);
  const units = [
    ...new Set(
      input.flatMap(({ facts, resources }) =>
        [...facts, ...resources].map((fact) => fact.unit ?? ""),
      ),
    ),
  ];
  const [unitPick, setUnitPick] = useState("");
  const unit = units.includes(unitPick) ? unitPick : (units[0] ?? "");
  const statedPeriods = [
    ...new Set(
      input.flatMap(({ facts, resources }) =>
        [...facts, ...resources].flatMap((fact) => fact.period ?? []),
      ),
    ),
  ];
  const { ordered: periods, gaps: unplacedPeriods } = orderPeriods(statedPeriods, (label) => label);
  const [periodPick, setPeriodPick] = useState("");
  const period = periods.includes(periodPick) ? periodPick : (periods[0] ?? "");
  const wall = input.map(({ issuer, source, facts }) => ({
    issuer,
    source,
    values: periods.map((label) => {
      const found = facts.filter((fact) => fact.period === label && (fact.unit ?? "") === unit);
      const fact = found.length === 1 ? found[0] : undefined;
      return { facts: found, fact, value: fact ? stated(fact) : null };
    }),
  }));
  const drawnByPeriod = periods.map((_, index) =>
    wall.flatMap(({ issuer, values }) => {
      const item = values[index];
      return item?.fact && item.value !== null ? [{ issuer, fact: item.fact }] : [];
    }),
  );
  const byPeriod = periods.map((label, index) => {
    const drawn = drawnByPeriod[index] ?? [];
    return {
      period: label,
      total: sum(drawn.map(({ fact }) => fact.text)),
      count: drawn.length,
      drawn,
    };
  });
  const amounts = wall.flatMap(({ values }) =>
    values.flatMap(({ value }) => (value === null ? [] : [value])),
  );
  const minimum = amounts.reduce<Dec | null>(
    (best, value) => (best === null || compare(value, best) < 0 ? value : best),
    null,
  );
  const maximum = amounts.reduce<Dec | null>(
    (best, value) => (best === null || compare(value, best) > 0 ? value : best),
    null,
  );
  const calendar = periods.length > 0 && periods.every((label) => /^(FY)?20\d\d$/.test(label));
  const unitRows = input.flatMap(({ issuer, source, facts, resources }) => [
    ...facts
      .filter((fact) => (fact.unit ?? "") !== unit && stated(fact) !== null)
      .map((fact) => ({ issuer, source, fact, measure: "Debt maturing" })),
    ...resources
      .filter((fact) => (fact.unit ?? "") !== unit && stated(fact) !== null)
      .map((fact) => ({ issuer, source: REFI, fact, measure: "Committed resources" })),
  ]);
  const unmatched = input.filter(({ facts }) => facts.length === 0);
  const colours = new Map(
    [...new Set(issuers.map((issuer) => issuer.sector ?? "Sector not stated"))]
      .sort()
      .map((sector, index) => [sector, SECTOR[index % SECTOR.length] ?? SECTOR[0]]),
  );
  const chartExtent = amounts.reduce<Dec>(
    (largest, value) => (compare(abs(value), largest) > 0 ? abs(value) : largest),
    "0",
  );
  const chartData = periods.map((label, index) => ({
    period: label,
    values: wall.map(({ values }) => {
      const value = values[index]?.value;
      return wallCoordinate(value ?? null, chartExtent);
    }),
  }));

  return (
    <section
      aria-label="Refinancing"
      className="grid min-w-0 gap-3 rounded-ds-lg border border-border-subtle bg-surface-card p-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-small text-text-secondary">
          Currency / written unit
          <select
            aria-label="Currency or written unit"
            value={unit}
            onChange={(event) => {
              setUnitPick(event.currentTarget.value);
            }}
            className="ml-2 rounded border border-border-subtle bg-surface-card px-2 py-1"
          >
            {units.map((option) => (
              <option key={option} value={option}>
                {unitLabel(option) || "No unit stated"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-small text-text-secondary">
          Period
          <select
            aria-label="Period"
            value={period}
            onChange={(event) => {
              setPeriodPick(event.currentTarget.value);
            }}
            className="ml-2 rounded border border-border-subtle bg-surface-card px-2 py-1"
          >
            {periods.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <span className="text-caption text-text-secondary">
          {calendar ? "Calendar-year axis" : "Columns are in period order"}
        </span>
        {unplacedPeriods.length > 0 && (
          <span className="text-caption text-text-secondary">
            Periods that could not be placed are shown last in written order.
          </span>
        )}
      </div>
      <h3 className="text-small font-semibold text-text-primary">
        Debt maturing by period ({unitLabel(unit) || "no unit stated"})
      </h3>
      <div role="img" aria-label="Maturity wall, stacked by issuer" className="h-56 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            stackOffset="sign"
            margin={{ top: 8, right: 12, bottom: 8, left: 8 }}
          >
            <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
            <XAxis dataKey="period" />
            <YAxis hide />
            {wall.map(({ issuer }, index) => (
              <Bar
                key={issuer.key}
                dataKey={(row: { values: readonly (number | null)[] }) => row.values[index] ?? null}
                stackId="maturity"
                fill={
                  issuer.key === selected
                    ? "var(--color-text-primary)"
                    : colours.get(issuer.sector ?? "Sector not stated")
                }
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table aria-label="Maturity wall totals" className="w-full text-left text-caption">
        <thead>
          <tr>
            <th>Period</th>
            <th>Total debt maturing (computed)</th>
            <th>Figures drawn</th>
            <th>Sources</th>
          </tr>
        </thead>
        <tbody>
          {byPeriod.map((item, index) => (
            <tr key={item.period} className="h-7 border-t border-border-subtle">
              <th>{item.period}</th>
              <td>
                {item.total === null ? (
                  <span className="gap-hatch">
                    {wall.some(({ values }) => (values[index]?.facts.length ?? 0) > 1)
                      ? "Multiple amounts left out"
                      : "No amount stated"}
                  </span>
                ) : (
                  <span
                    title={`Total of drawn amounts: ${item.drawn.map(({ fact }) => amountText(fact)).join(" + ")}`}
                  >
                    {writtenUnit(item.total, unit)}
                  </span>
                )}
              </td>
              <td>{item.count}</td>
              <td>
                <details>
                  <summary>Open inputs ({item.drawn.length})</summary>
                  <ul>
                    {item.drawn.map(({ issuer, fact }) => (
                      <li key={issuer.key}>
                        <OpenRun issuer={issuer} fact={fact} label={`Open run: ${issuer.name}`} />
                      </li>
                    ))}
                  </ul>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <table
        aria-label="Debt maturing and committed resources by issuer"
        className="w-full text-left text-caption"
      >
        <thead>
          <tr>
            <th>Issuer</th>
            <th>Amount marks</th>
            <th>Debt maturing / committed resources</th>
            <th>Source</th>
            <th>Basis and limitation</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {wall.map(({ issuer, source, values }) => {
            const maturityFacts = values[periods.indexOf(period)]?.facts ?? [];
            const resourceFacts = currentFacts(data, issuer, RESOURCES, period, unit);
            const maturity = maturityFacts.length === 1 ? maturityFacts[0] : undefined;
            const resource = resourceFacts.length === 1 ? resourceFacts[0] : undefined;
            const debtValue = maturity ? stated(maturity) : null;
            const resourceValue = resource ? stated(resource) : null;
            const sourceFacts = [
              ...maturityFacts.map((fact) => ({ fact, label: "Debt maturing" })),
              ...resourceFacts.map((fact) => ({ fact, label: "Committed resources" })),
            ];
            return (
              <tr key={issuer.key} className="h-7 border-t border-border-subtle">
                <th>
                  <button
                    type="button"
                    aria-pressed={issuer.key === selected}
                    onClick={() => {
                      onSelect(issuer.key);
                    }}
                  >
                    {issuer.name}
                  </button>
                </th>
                <td>
                  {neutralMarks(
                    debtValue,
                    resourceValue,
                    `${issuer.name}, ${period}: debt maturing and committed resources`,
                  )}
                </td>
                <td>
                  {amountReading("Debt", maturityFacts, debtValue)};{" "}
                  {amountReading("Resources", resourceFacts, resourceValue)}
                </td>
                <td>Debt: {sourceName(source)}; resources: Refinancing &amp; LME</td>
                <td>
                  Debt: {basisText(maturityFacts)}; resources: {basisText(resourceFacts)}
                </td>
                <td>
                  {sourceFacts.length > 0 && (
                    <details>
                      <summary>Open source runs ({sourceFacts.length})</summary>
                      <ul>
                        {sourceFacts.map(({ fact, label }, index) => (
                          <li key={`${fact.run}-${String(fact.line)}-${String(index)}`}>
                            <OpenRun
                              issuer={issuer}
                              fact={fact}
                              label={`Open run: ${label}, ${fact.period ?? "period not stated"}`}
                            />
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="min-w-0 overflow-x-auto">
        <table aria-label="Debt maturity heat grid" className="min-w-max text-left text-caption">
          <thead>
            <tr>
              <th>Issuer</th>
              {periods.map((label) => (
                <th key={label}>{label}</th>
              ))}
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {wall.map(({ issuer, source, values }) => {
              const rowFacts = values.flatMap(({ facts }, index) =>
                facts.map((fact) => ({ fact, index })),
              );
              return (
                <tr key={issuer.key} className="h-7 border-t border-border-subtle">
                  <th>{issuer.name}</th>
                  {values.map(({ facts, fact, value }, index) => {
                    const periodLabel = periods[index] ?? "period not stated";
                    const shade =
                      value === null || minimum === null || maximum === null
                        ? undefined
                        : step(fraction(value, minimum, maximum), AMOUNT);
                    return (
                      <td key={`${issuer.key}-${periodLabel}`}>
                        {facts.length > 1 ? (
                          <span
                            className="gap-hatch"
                            aria-label={`${issuer.name}, ${periodLabel}: multiple amounts stated, left out`}
                          >
                            Multiple amounts left out: {facts.map(amountText).join("; ")}
                          </span>
                        ) : value === null ? (
                          <span
                            className="gap-hatch"
                            aria-label={`${issuer.name}, ${periodLabel}: ${fact ? (fact.gap || fact.at === null ? "no amount stated" : `not a readable amount: ${fact.text}`) : "no figure stated"}`}
                          >
                            {fact && !fact.gap && fact.at !== null ? amountText(fact) : "—"}
                          </span>
                        ) : fact ? (
                          <span
                            style={{ backgroundColor: shade }}
                            title={`${amountText(fact)}; ${sourceName(source)}`}
                          >
                            {amountText(fact)}
                          </span>
                        ) : (
                          <span
                            className="gap-hatch"
                            aria-label={`${issuer.name}, ${periodLabel}: amount not readable`}
                          >
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    {rowFacts.length > 0 && (
                      <details>
                        <summary>Open source runs ({rowFacts.length})</summary>
                        <ul>
                          {rowFacts.map(({ fact, index }, at) => (
                            <li key={`${fact.run}-${String(fact.line)}-${String(at)}`}>
                              <OpenRun
                                issuer={issuer}
                                fact={fact}
                                label={`Open run: ${periods[index] ?? "period not stated"}`}
                              />
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-1">
        {wall.map(({ issuer, source, values }) => (
          <div key={issuer.key} className="flex items-center gap-2 text-caption">
            <span className="w-32 truncate">{issuer.name}</span>
            <MiniColumns
              values={values.map(({ value }) => value)}
              colour={colours.get(issuer.sector ?? "Sector not stated") ?? SECTOR[0]}
              label={`${issuer.name} debt maturing by period`}
            />
            <span>{sourceName(source)}</span>
          </div>
        ))}
      </div>
      <p className="text-caption text-text-secondary">
        Circle: debt maturing. Triangle: committed resources. Both marks use the written amounts and
        a neutral scale; no share is calculated.
      </p>
      {unitRows.length > 0 && (
        <section aria-label="Other units left out">
          <h3>Other units left out</h3>
          <ul>
            {unitRows.map(({ issuer, source, fact, measure }, index) => (
              <li key={`${issuer.key}-${String(index)}`}>
                {issuer.name}: {measure} {amountText(fact)} in {fact.period ?? "period not stated"}{" "}
                (other unit); {sourceName(source)};{" "}
                <OpenRun
                  issuer={issuer}
                  fact={fact}
                  label={`Open run for ${issuer.name}, ${fact.period ?? "period not stated"}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {unmatched.length > 0 && (
        <section aria-label="No maturity source">
          <h3>No maturity source</h3>
          <ul>
            {unmatched.map(({ issuer }) => (
              <li key={issuer.key}>{issuer.name}: no maturity figures stated.</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
