import type { WaterfallRow } from "../kit/marks";
import { unplacedNotes } from "../kit/tables";
import { FigureTile, GapTile } from "../kit/LeadFrame";
import { GapChip, Measured, Waterfall } from "../kit/marks";
import type { LeadProps } from "../types";
import { cashLadder, figureGap, type CashLadder } from "./foundationData";
import {
  alone,
  allGaps,
  gapReasons,
  LEVELS_AS_STATED,
  ladderKicker,
  ladderPeriods,
  ladderReading,
  ladderRows,
  ladderTable,
  levelsBreak,
  unplacedItems,
  noBar,
  type LadderPeriods,
} from "./ladderGeometry";

const LABEL = "Cash conversion";
const NO_PERIOD = "This page could not read a period for the ladder's rows.";

/** One ladder: a Waterfall of one period's stated rows, the earlier period beneath where given. */
function Ladder({
  data,
  periods,
  rows,
}: {
  data: CashLadder;
  periods: LadderPeriods;
  rows: readonly WaterfallRow[];
}) {
  return (
    <Measured fallback={640}>
      {(width) => (
        <Waterfall
          rows={rows}
          unit={data.unit}
          width={width}
          label={ladderReading(rows, data, periods)}
          legend={{
            level: `${periods.current} level`,
            gap: "Not stated",
            ...(periods.prior ? { prior: periods.prior } : {}),
          }}
        />
      )}
    </Measured>
  );
}

/**
 * Tile 2: the handoff's own cash ladder, from EBITDA (Adjusted) through cash interest and taxes,
 * cash from operations, capex, free cash flow after capex, distributions and the module's own
 * after-distributions level to acquisitions: each as written, the later of two compared periods
 * as bars, the earlier beneath, stated gaps hatched with their reasons. Any other set of periods
 * is a ladder per stated period, in the one period order; a period stated only as gaps is its
 * reason in words.
 */
export function CashLadderTile({ lead }: { lead: LeadProps }) {
  const data = cashLadder(lead.entry);
  const periods = data && ladderPeriods(data);
  if (!data || !periods)
    return (
      <GapTile span={7} label={LABEL} kicker={LABEL}>
        {figureGap(lead.entry, "ladder") ?? NO_PERIOD}
      </GapTile>
    );
  const drawn = [periods, ...periods.others.map(alone)].map((each) => ({
    each,
    rows: ladderRows(data, each),
  }));
  if (noBar(drawn.map(({ rows }) => rows)))
    // No bar can be placed: no axis, no zero rule, no plot; every row as text and the table view.
    return (
      <FigureTile
        props={lead}
        span={7}
        label={LABEL}
        kicker={ladderKicker(data, periods)}
        title={LABEL}
        line={data.line}
        source="cash conversion"
        table={ladderTable(data)}
      >
        <ul data-gap-lines="" className="flex flex-col gap-2">
          {unplacedItems(drawn.map(({ each, rows }) => ({ periods: each, rows }))).map((item) =>
            item.kind === "figure" ? (
              <li
                key={item.text}
                data-unplaced=""
                className="text-small wrap-anywhere text-text-primary"
              >
                {item.text}
              </li>
            ) : (
              <li
                key={item.reason}
                data-gap-line={item.labels.join("; ")}
                className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
              >
                <span className="text-small font-medium wrap-anywhere text-text-primary">
                  {item.labels.join("; ")}
                </span>
                <GapChip reason={item.reason} />
              </li>
            ),
          )}
        </ul>
      </FigureTile>
    );
  const breaks = drawn.some(({ rows }) => !allGaps(rows) && levelsBreak(rows));
  return (
    <FigureTile
      props={lead}
      span={7}
      label={LABEL}
      kicker={ladderKicker(data, periods)}
      title={LABEL}
      line={data.line}
      source="cash conversion"
      notes={[
        ...(breaks ? [LEVELS_AS_STATED] : []),
        ...unplacedNotes(data.unplaced, data.periods.length),
      ]}
      table={ladderTable(data)}
    >
      {drawn.map(({ each, rows }) =>
        allGaps(rows) ? (
          <p
            key={each.current}
            data-ladder-gap={each.current}
            className="text-caption wrap-anywhere text-gap-text"
          >
            {`${each.current}: ${gapReasons(rows).join(" ")}`}
          </p>
        ) : (
          <div key={each.current} data-ladder={each.current} className="flex flex-col gap-1">
            {drawn.length > 1 && (
              <h4 className="text-caption font-medium text-text-primary">{each.current}</h4>
            )}
            <Ladder data={data} periods={each} rows={rows} />
          </div>
        ),
      )}
    </FigureTile>
  );
}
