import { useState } from "react";
import { Segmented } from "@/components/kit/Segmented";
import { cx } from "@/utils/cx";
import { unitLabel, type MaturityProfile } from "../../publishedReport";
import { AMOUNT, step } from "../../visuals/signal/scales";
import { amount, distinct } from "../../visuals/visualData";
import { PublishedSource } from "../PublishedTrace";
import type { maturityTraces } from "../comparisonTrace";
import { Figure, Tile } from "../overview/Tile";

type Traces = ReturnType<typeof maturityTraces>;
type Row = MaturityProfile["rows"][number];

const HEIGHT = 128;
/**
 * One side of a period is 54px wide (wider from 1440px), so seven or eight periods share a 1024px
 * page with no sideways scroll; a label wraps inside its own side.
 */
const SIDE = "w-[3.375rem] min-[1440px]:w-[4.75rem]";
const BAR = "block w-10 min-[1440px]:w-14";
/** The fewest characters a label line holds, at the narrow side width. */
const CHARS_PER_LINE = 7;
const LINE = 14;

/** Room above a bar for its label and a hatched stub: enough for the longest cell text in the profile. */
function labelRoom(rows: readonly Row[]) {
  const longest = Math.max(
    ...rows.flatMap((row) => [row.prior, row.current]).map((cell) => (cell ?? "Not stated").length),
    1,
  );
  return Math.max(56, Math.ceil(longest / CHARS_PER_LINE) * LINE + 32);
}
const MIN_BAR = 6;

/** Whether the profile can be drawn: a unit, distinct periods and at least one stated figure. */
export function usableProfile(profile: MaturityProfile) {
  const periods = profile.rows.map((row) => row.period);
  const values = profile.rows.flatMap((row) => [
    amount(row.prior ?? ""),
    amount(row.current ?? ""),
  ]);
  return (
    Boolean(profile.unit) &&
    periods.length > 0 &&
    distinct(periods) &&
    values.some((v) => v !== null)
  );
}

type Axis = { low: number; high: number; room: number };

/**
 * The earlier run is a grey outline; this run is an amber fill whose step is the figure's share of the
 * largest stated figure in the chart (colour-signal-build ruling C4). The edge holds the pale steps
 * against the white card. The bar length is unchanged and no figure is printed from the tint.
 */
const FILL = {
  current: "border border-scale-amount-edge",
  earlier: "border-2 border-chart-3 bg-surface-card",
} as const;

/**
 * One side of one period, drawn in two slots that share one baseline across every column: the part
 * above the baseline (label directly over its bar) and the part below (bar, then label). A stated
 * zero is a tick on the baseline with its "0"; a cell that is not a number keeps its own words over a
 * hatched stub; an absent cell says so.
 */
function Side({
  cell,
  axis,
  current,
  zone,
  largest,
}: {
  cell: string | null;
  axis: Axis;
  /** The largest absolute stated figure in the chart, for this run's amount step. */
  largest: number;
  current: boolean;
  zone: "above" | "below";
}) {
  const value = cell === null ? null : amount(cell);
  const span = axis.high - axis.low || 1;
  const px = (v: number) => (Math.abs(v) / span) * HEIGHT;
  const above = (axis.high / span) * HEIGHT;
  const below = (-axis.low / span) * HEIGHT;
  const side = current ? "current" : "earlier";
  const label = (
    <Figure className={cx(SIDE, "text-center text-caption leading-tight wrap-anywhere")}>
      {cell ?? "Not stated"}
    </Figure>
  );
  const bar = (height: number, zone: "above" | "below", amountValue: number) => (
    <span
      data-bar={side}
      data-zone={zone}
      className={cx(BAR, FILL[side], zone === "above" ? "rounded-t-ds-xs" : "rounded-b-ds-xs")}
      style={{
        height: `${String(Math.max(height, MIN_BAR))}px`,
        ...(current && { backgroundColor: step(Math.abs(amountValue) / largest, AMOUNT) }),
      }}
    />
  );
  const tick = (
    <span data-bar={side} data-zone="zero" className={cx(BAR, "h-0.5 bg-text-tertiary")} />
  );
  if (zone === "above")
    return (
      <div
        className={cx(SIDE, "flex flex-col items-center justify-end gap-0.5")}
        style={{ height: `${String(axis.room + above)}px` }}
      >
        {value === null ? (
          <>
            {label}
            <span
              data-gap
              className={cx(
                BAR,
                "gap-hatch h-6 rounded-t-ds-xs border border-dashed border-border-gap",
              )}
            />
          </>
        ) : value >= 0 ? (
          <>
            {label}
            {value === 0 ? tick : bar(px(value), "above", value)}
          </>
        ) : null}
      </div>
    );
  return (
    <div
      className={cx(SIDE, "flex flex-col items-center justify-start gap-0.5")}
      style={{ height: `${String(below + axis.room)}px` }}
    >
      {value !== null && value < 0 ? (
        <>
          {bar(px(value), "below", value)}
          {label}
        </>
      ) : null}
    </div>
  );
}

function Walls({ rows }: { rows: readonly Row[] }) {
  const values = rows
    .flatMap((row) => [amount(row.prior ?? ""), amount(row.current ?? "")])
    .filter((value): value is number => value !== null);
  const largest = Math.max(...values.map(Math.abs));
  const axis = { low: Math.min(0, ...values), high: Math.max(0, ...values), room: labelRoom(rows) };
  return (
    <div className="grid gap-3">
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cx("size-3 rounded-ds-xs", FILL.earlier)} />
          Earlier run: grey outlined bar, left
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="flex">
            {[AMOUNT[1], AMOUNT[4]].map((colour) => (
              <span
                key={colour}
                className={cx("size-3 first:rounded-l-ds-xs last:rounded-r-ds-xs", FILL.current)}
                style={{ backgroundColor: colour }}
              />
            ))}
          </span>
          This run: amber bar, right, deeper for a larger amount
        </span>
      </p>
      {rows.length > 2 && (
        <p className="text-caption text-text-tertiary min-[721px]:hidden">
          Scroll the chart sideways to see every period.
        </p>
      )}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Maturity walls"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <div className="flex min-w-max gap-3 pb-1">
          {rows.map((row) => (
            <div key={row.period} className="flex min-w-28 flex-1 flex-col items-stretch">
              <div className="flex items-end justify-center gap-1">
                <Side cell={row.prior} axis={axis} largest={largest} current={false} zone="above" />
                <Side cell={row.current} axis={axis} largest={largest} current zone="above" />
              </div>
              <span aria-hidden="true" className="block h-px w-full bg-border-container" />
              {axis.low < 0 && (
                <div className="flex items-start justify-center gap-1">
                  <Side
                    cell={row.prior}
                    axis={axis}
                    largest={largest}
                    current={false}
                    zone="below"
                  />
                  <Side cell={row.current} axis={axis} largest={largest} current zone="below" />
                </div>
              )}
              <span className="mt-1 text-center font-mono text-caption text-text-secondary wrap-anywhere">
                {row.period}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sources({ name, prior, current }: { name: string; prior?: string; current?: string }) {
  if (!prior && !current) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {prior && (
        <PublishedSource
          href={prior}
          name={`${name}, earlier run`}
          linkLabel={`Earlier run source for ${name}`}
        >
          Earlier source
        </PublishedSource>
      )}
      {current && (
        <PublishedSource href={current} name={`${name}, current run`}>
          Current source
        </PublishedSource>
      )}
    </div>
  );
}

/** The two debt maturity schedules per stated period, in the pack's order, on one scale. */
export function MaturityPair({ profile, traces }: { profile: MaturityProfile; traces?: Traces }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Tile
      span={12}
      label="Maturities then and now"
      kicker={`Debt maturing by period, ${unitLabel(profile.unit)}`}
      title="Debt maturities, earlier run against this run"
      trace={
        <div className="flex items-center gap-3">
          <Sources
            name="Debt maturity schedules"
            prior={traces?.prior?.table}
            current={traces?.current.table}
          />
          <Segmented
            label="Maturities view"
            current={view}
            onSelect={(key) => {
              setView(key === "table" ? "table" : "chart");
            }}
            segments={[
              { key: "chart", label: "Chart" },
              { key: "table", label: "Table" },
            ]}
          />
        </div>
      }
    >
      {view === "chart" ? (
        <Walls rows={profile.rows} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-small">
            <caption className="sr-only">Debt maturity schedules</caption>
            <thead>
              <tr className="text-left text-caption text-text-tertiary">
                <th scope="col" className="pb-2 font-normal">
                  Period
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Earlier run
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Current run
                </th>
                <th scope="col" className="pb-2 font-normal">
                  <span className="sr-only">Sources</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.rows.map((row) => {
                const prior = traces?.prior?.row(row.period, row.prior, profile.unit);
                const current = traces?.current.row(row.period, row.current, profile.unit);
                return (
                  <tr key={row.period} className="border-t border-border-hairline">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      {row.period}
                    </th>
                    {[row.prior, row.current].map((cell, at) => (
                      <td key={at} className="py-2 text-right font-mono tabular-nums">
                        {cell ?? <span className="text-gap-text">Not stated</span>}
                      </td>
                    ))}
                    <td className="py-2 pl-3">
                      {(prior || current) && (
                        <Sources name={row.period} prior={prior} current={current} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Tile>
  );
}
