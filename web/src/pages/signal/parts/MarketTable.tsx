// A market post's table, under the date its figures are as of: one row per series with its short name, its value and the value's own
// date, then each change with the date it is measured from. Every text is delivered; the page adds
// the unit to a value and nothing else. A series that could not be read shows its note in place of
// figures, and a change with no earlier observation shows a dash. A move is a sign and a number:
// no colour or arrow says whether it is good or bad, which this page does not know.
//
// The series' short name is a control: it shows the full name and where the series comes from on
// a row beneath, and names both for a screen reader. In a card narrower than the table (a phone)
// the table scrolls sideways inside a named region the keyboard can reach, as the Sources table
// does, with the series names kept in view. On a phone the table takes the card's whole width.
import { useId, useState } from "react";
import { ChevronDown } from "@untitledui/icons";
import { Button as AriaButton } from "react-aria-components";
import { cx } from "@/utils/cx";
import type { SignalMarket, SignalMarketChange, SignalMarketRow } from "../slice";
import { FIGURE, FOCUS, TARGET } from "./classes";

/** The date under a figure: mono with tabular numerals, as the figure is, at the caption size. */
const DATE = "block font-mono text-caption text-text-tertiary tabular-nums";
const CELL = "px-2 py-1.5 align-top";
const HEAD = `${CELL} text-caption font-medium whitespace-nowrap text-text-tertiary`;
/** The series column stays in view while the rest scrolls under it. */
const SERIES = "sticky left-0 bg-surface-card text-left";

/** A value with its unit, as the post's own summary line writes it: "3.12%", or "101.2 Index". */
function valueText(row: SignalMarketRow): string | null {
  if (row.value === null) return null;
  return row.unit === "Percent" ? `${row.value}%` : `${row.value} ${row.unit}`;
}

/** A figure with the date it belongs to beneath it. */
function Dated({ figure, date }: { figure: string; date: string | null }) {
  return (
    <>
      <span className={`block text-text-primary ${FIGURE}`}>{figure}</span>
      {date === null ? null : <span className={DATE}>{date}</span>}
    </>
  );
}

function ChangeCell({ change }: { change: SignalMarketChange }) {
  return (
    <td className={`${CELL} text-right whitespace-nowrap`}>
      {change.value === null ? (
        <>
          <span aria-hidden="true" className="text-text-tertiary">
            —
          </span>
          <span className="sr-only">no earlier observation</span>
        </>
      ) : (
        <Dated figure={change.value} date={change.since} />
      )}
    </td>
  );
}

function SeriesRow({
  row,
  columns,
  open,
  detailId,
  onToggle,
}: {
  row: SignalMarketRow;
  /** How many columns follow the series' name. */
  columns: number;
  open: boolean;
  detailId: string;
  onToggle: () => void;
}) {
  const value = valueText(row);
  // A series with a note shows the note in place of its figures, whatever else it holds.
  const figures = row.note === null && value !== null;
  return (
    <>
      <tr className="border-t border-border-hairline">
        <th scope="row" className={`${CELL} ${SERIES} font-medium whitespace-nowrap`}>
          <AriaButton
            aria-expanded={open}
            aria-controls={open ? detailId : undefined}
            aria-label={`${row.short}: ${row.name}. Source: ${row.source}`}
            onPress={onToggle}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-ds-xs text-small text-text-primary hover:underline ${TARGET} ${FOCUS}`}
          >
            {row.short}
            <ChevronDown
              aria-hidden="true"
              className={cx(
                "size-3.5 shrink-0 text-text-tertiary motion-safe:transition-transform",
                open && "rotate-180",
              )}
            />
          </AriaButton>
        </th>
        {figures ? (
          <>
            <td className={`${CELL} text-right whitespace-nowrap`}>
              <Dated figure={value} date={row.date} />
            </td>
            {row.changes.map((change, index) => (
              <ChangeCell key={index} change={change} />
            ))}
          </>
        ) : (
          <td colSpan={columns} className={`${CELL} text-small text-text-secondary`}>
            {row.note}
          </td>
        )}
      </tr>
      {open ? (
        <tr id={detailId}>
          <td colSpan={columns + 1} className="px-2 pb-2 text-small text-text-secondary">
            {row.name}. Source: {row.source}
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function MarketTable({ market, headline }: { market: SignalMarket; headline: string }) {
  const id = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  // Every series names its changes alike (the reader checks), so the first that has any heads the table.
  const labels =
    market.rows.find((row) => row.changes.length > 0)?.changes.map((change) => change.label) ?? [];
  const toggle = (series: string) => {
    const next = new Set(open);
    if (!next.delete(series)) next.add(series);
    setOpen(next);
  };
  return (
    // No wider than its figures read well at; below 768px it takes the card's full width, under
    // the source's 48px tile and the 12px beside it, so a phone shows as many columns as it can.
    <div className="@container mt-3 max-w-160 max-md:-ml-15">
      {/* The post is dated the day it was written; its figures are as of the newest observation. */}
      <p className="mb-2 text-small text-text-secondary">
        As of <span className={FIGURE}>{market.asOf}</span>
      </p>
      <p className="mb-2 text-small text-text-tertiary @min-[352px]:hidden">
        Scroll horizontally to see every column.
      </p>
      <div
        role="region"
        aria-label={`Table: ${headline}`}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={`overflow-x-auto rounded-ds-sm border border-border-hairline ${FOCUS}`}
      >
        <table className="w-full min-w-88 border-collapse text-small">
          <caption className="sr-only">
            Market series: each value with its own date, each change with the date it is measured
            from.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={`${HEAD} ${SERIES}`}>
                Series
              </th>
              <th scope="col" className={`${HEAD} text-right`}>
                Value
              </th>
              {labels.map((label, index) => (
                <th key={index} scope="col" className={`${HEAD} text-right`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {market.rows.map((row, index) => (
              <SeriesRow
                key={row.id}
                row={row}
                columns={labels.length + 1}
                open={open.has(row.id)}
                detailId={`${id}-${String(index)}`}
                onToggle={() => {
                  toggle(row.id);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-caption text-text-tertiary">
        The date under a value is that series&apos; own; the date under a change is the earlier
        observation it is measured from.
      </p>
    </div>
  );
}
