import { useMemo } from "react";
import {
  evidenceLink,
  latestRun,
  type Coverage,
  type CoverageRun,
  type Fact,
  type Issuer,
} from "../coverageData";
import { NEUTRAL } from "../visuals/signal/scales";
import { compare, dec, type Dec } from "./coverageMath";
import { headroom as covenantHeadroom } from "./direction";
import { fraction, written, writtenText } from "./monitorMath";
import { named } from "./shared";

const CURRENT = "cp-4/covenant-headroom/current";
const LIMIT = "cp-4/covenant-headroom/threshold";
const TRIGGER_PREFIX = "cp-2h/rating-triggers/";
const TRIGGER_CURRENT = `${TRIGGER_PREFIX}current`;
const TRIGGER_LIMIT = `${TRIGGER_PREFIX}threshold`;

type Pair = { current: Fact; limit: Fact; room: Dec };
type Row = {
  issuer: Issuer;
  run: CoverageRun;
  current?: Fact;
  limit?: Fact;
  pair?: Pair;
  source: Fact;
  state: string;
};
type Props = {
  data: Coverage;
  issuers: readonly Issuer[];
  selected: string | null;
  onSelect: (key: string) => void;
};

function rowKey(fact: Fact): string {
  return JSON.stringify([fact.run, fact.line, fact.output, fact.row, fact.period]);
}

function hasTriggerFacts(data: Coverage): boolean {
  return data.facts.some((fact) => fact.field.startsWith(TRIGGER_PREFIX));
}

function calculate(current: Fact, limit: Fact): Dec | null {
  if (!current.unit?.trim() || !limit.unit?.trim()) return null;
  return current.gap || limit.gap ? null : covenantHeadroom(limit, current);
}

function rowsFor(
  data: Coverage,
  issuer: Issuer,
  currentField: string | undefined,
  limitField: string | undefined,
): Row[] {
  const run = latestRun(issuer);
  if (!run || (!currentField && !limitField)) return [];
  const facts = data.facts.filter(
    (fact) =>
      fact.issuer === issuer.key &&
      fact.run === run.key &&
      (fact.field === currentField || fact.field === limitField),
  );
  const groups = new Map<string, Fact[]>();
  for (const fact of facts) groups.set(rowKey(fact), [...(groups.get(rowKey(fact)) ?? []), fact]);

  return [...groups.values()].map((group) => {
    const currents = group.filter((fact) => fact.field === currentField);
    const limits = group.filter((fact) => fact.field === limitField);
    const current = currents[0];
    const limit = limits[0];
    const source = current ?? limit;
    if (!source) throw new Error("Headroom row lost its source fact");
    if (!current || !limit) {
      return {
        issuer,
        run,
        current,
        limit,
        source,
        state: "missing current level or limit",
      };
    }
    if (currents.length !== 1 || limits.length !== 1) {
      return {
        issuer,
        run,
        current,
        limit,
        source,
        state: "ambiguous duplicate row",
      };
    }
    const room = calculate(current, limit);
    return room === null
      ? {
          issuer,
          run,
          current,
          limit,
          source,
          state: "not computed: incompatible or missing figure",
        }
      : { issuer, run, current, limit, source, pair: { current, limit, room }, state: "computed" };
  });
}

function commonUnit(rows: readonly Row[]): string | undefined {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.pair && row.current?.unit !== undefined) {
      const unit = row.current.unit;
      counts.set(unit, (counts.get(unit) ?? 0) + 1);
    }
  }
  let best: string | undefined;
  for (const [unit, count] of counts)
    if (best === undefined || count > (counts.get(best) ?? 0)) best = unit;
  return best;
}

function tightestFirst(rows: Row[]): Row[] {
  const unit = commonUnit(rows);
  if (unit === undefined) return rows;
  let tightest = -1;
  for (const [index, row] of rows.entries()) {
    if (row.pair?.current.unit !== unit) continue;
    if (tightest < 0 || compare(row.pair.room, rows[tightest]?.pair?.room ?? row.pair.room) < 0)
      tightest = index;
  }
  if (tightest <= 0) return rows;
  const ordered = [...rows];
  const [first] = ordered.splice(tightest, 1);
  if (first) ordered.unshift(first);
  return ordered;
}

function markPosition(current: Fact, limit: Fact): { current: number; limit: number } | null {
  const a = dec(current.text);
  const b = dec(limit.text);
  if (
    a === null ||
    b === null ||
    !current.unit?.trim() ||
    !limit.unit?.trim() ||
    current.unit !== limit.unit
  )
    return null;
  const low = compare(a, b) <= 0 ? a : b;
  const high = compare(a, b) <= 0 ? b : a;
  return {
    current: Math.round(fraction(a, low, high) * 100),
    limit: Math.round(fraction(b, low, high) * 100),
  };
}

function Marks({ row }: { row: Row }) {
  if (!row.current || !row.limit) return <span>Marks unavailable</span>;
  const positions = markPosition(row.current, row.limit);
  if (!positions) return <span>Marks unavailable</span>;
  const color = NEUTRAL[1];
  return (
    <div className="grid min-w-48 grid-cols-1 gap-1" aria-label="Level and limit marks">
      {(["current", "limit"] as const).map((name) => {
        const value = positions[name];
        const label = name === "current" ? "Level" : "Limit";
        return (
          <div key={name} className="flex items-center gap-2">
            <span className="w-10 text-caption text-text-secondary">{label}</span>
            <span className="relative h-3 flex-1 border-b border-border-subtle">
              <span
                aria-label={`${label} mark at ${String(value)}%`}
                data-mark={name}
                className={`absolute bottom-0 size-2 -translate-x-1/2 ${name === "current" ? "rounded-full" : "rotate-45"}`}
                style={{ left: `${String(value)}%`, backgroundColor: color }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Table({
  data,
  issuers,
  currentField,
  limitField,
  title,
  selected,
  onSelect,
}: Props & {
  currentField: string | undefined;
  limitField: string | undefined;
  title: string;
}) {
  const rows = useMemo(
    () =>
      issuers.flatMap((issuer) => tightestFirst(rowsFor(data, issuer, currentField, limitField))),
    [currentField, data, issuers, limitField],
  );
  const fieldsById = new Map(data.fields.map((field) => [field.id, field]));
  const sourceModule = (row: Row) => {
    const field = fieldsById.get(row.source.field);
    const column = data.columns.find((item) => item.code === field?.module);
    return named(column ?? { code: field?.module ?? "" }, latestRun(row.issuer)?.pathway);
  };

  return (
    <section className="rounded-ds-lg border border-border-subtle bg-surface-card p-3">
      <h2 className="mb-2 font-display text-h3 text-text-primary">{title}</h2>
      <p className="mb-2 text-small text-text-secondary">
        Issuer-specific tests are shown in the order written, with each issuer’s tightest qualifying
        test first. They are not ranked across issuers.
      </p>
      <div className="overflow-x-auto">
        <table aria-label={title} className="w-full border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-border-hairline text-caption text-text-secondary">
              <th className="p-2">Issuer</th>
              <th className="p-2">Test</th>
              <th className="p-2">Current level</th>
              <th className="p-2">Threshold</th>
              <th className="p-2">Headroom</th>
              <th className="p-2">Level and limit marks</th>
              <th className="p-2">Source module</th>
              <th className="p-2">Basis</th>
              <th className="p-2">Trace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const room = row.pair?.room;
              const rowName =
                row.source.row ?? row.current?.row ?? row.limit?.row ?? "Test name not stated";
              const sourceLink = evidenceLink(row.run, row.source);
              return (
                <tr
                  key={`${row.issuer.key}-${rowKey(row.source)}-${String(index)}`}
                  className="border-t border-border-hairline align-top"
                >
                  <th scope="row" className="p-2 font-medium">
                    <button
                      type="button"
                      aria-pressed={row.issuer.key === selected}
                      onClick={() => {
                        onSelect(row.issuer.key);
                      }}
                    >
                      {row.issuer.name}
                    </button>
                  </th>
                  <td className="p-2">
                    {rowName}
                    {row.state !== "computed" && (
                      <span className="ml-1 text-gap-text">({row.state})</span>
                    )}
                  </td>
                  <td className="p-2 tabular-nums">
                    {row.current ? written(row.current) : "Not supplied"}
                  </td>
                  <td className="p-2 tabular-nums">
                    {row.limit ? written(row.limit) : "Not supplied"}
                  </td>
                  <td className="p-2 tabular-nums">
                    {room === undefined ? (
                      "not computed"
                    ) : (
                      <>
                        {writtenText(
                          room.startsWith("-")
                            ? `−${room.slice(1)}`
                            : room === "0"
                              ? room
                              : `+${room}`,
                          row.pair?.current.unit,
                        )}
                        {compare(room, "0") < 0 && <span className="ml-1">beyond the limit</span>}{" "}
                        <span className="text-caption text-text-secondary">computed</span>
                      </>
                    )}
                  </td>
                  <td className="p-2">
                    <Marks row={row} />
                  </td>
                  <td className="p-2">{sourceModule(row)}</td>
                  <td className="p-2">{row.source.basis ?? "Basis not stated"}</td>
                  <td className="p-2">
                    <a href={sourceLink} aria-label="Open run">
                      Open run
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Headroom(props: Props) {
  return (
    <section className="space-y-4" aria-label="Headroom">
      <Table {...props} currentField={CURRENT} limitField={LIMIT} title="Covenant headroom" />
      {hasTriggerFacts(props.data) && (
        <Table
          {...props}
          currentField={TRIGGER_CURRENT}
          limitField={TRIGGER_LIMIT}
          title="Rating triggers"
        />
      )}
      <section
        className="rounded-ds-lg border border-border-subtle bg-surface-card p-3"
        aria-label="Base and downside cases"
      >
        <h2 className="font-display text-h3 text-text-primary">Base and downside</h2>
        <p className="mt-2 text-small text-gap-text">
          This page could not read base and downside cases.
        </p>
      </section>
    </section>
  );
}
