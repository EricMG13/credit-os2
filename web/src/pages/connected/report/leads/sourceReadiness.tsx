import { moduleName } from "../../api";
import { FigureTile, GapTile, LeadFrame } from "./kit/LeadFrame";
import {
  MARKS,
  sourceReadiness,
  type ReadinessMark,
  type ReadinessRow,
} from "./sourceReadinessData";
import type { Lead, LeadProps } from "./types";

const ABSENT = "No readiness-by-area table is present in this module.";
const NOT_HERE = "This page could not read the key evidence located or the conflicts.";

// The state columns of the matrix, by their grid line at lg and above; the last two lines hold the
// reason, and "other" has a column only when a row states a word the page does not know.
const COLUMN: Record<ReadinessMark, string> = {
  ready: "lg:col-start-2",
  limited: "lg:col-start-3",
  conditional: "lg:col-start-4",
  blocked: "lg:col-start-5",
  other: "lg:col-start-6",
};
const COLUMNS = {
  four: "lg:grid-cols-[minmax(9rem,1.1fr)_repeat(4,minmax(0,1fr))_minmax(12rem,2fr)]",
  five: "lg:grid-cols-[minmax(9rem,1.1fr)_repeat(5,minmax(0,1fr))_minmax(12rem,2fr)]",
} as const;
const REASON_AT = { four: "lg:col-start-6", five: "lg:col-start-7" } as const;
const HEAD: Record<ReadinessMark, string> = {
  ready: "Ready",
  limited: "Ready with limitations",
  conditional: "Conditional",
  blocked: "Blocked or not ready",
  other: "Other",
};

const SHAPE: Record<ReadinessMark, string> = {
  ready: "dot",
  limited: "half-dot",
  conditional: "ring",
  blocked: "slash",
  other: "neutral",
};

/** The state as a shape, so that colour is never what tells ready from not ready. */
function ReadinessMarkShape({ mark }: { mark: ReadinessMark }) {
  const primary = mark === "ready" || mark === "limited";
  const stroke = primary ? "stroke-chart-1" : "stroke-warning-mark";
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      data-shape={SHAPE[mark]}
      className="block flex-none"
    >
      {mark === "ready" && <circle cx="8" cy="8" r="6.5" className="fill-chart-1" />}
      {mark === "limited" && (
        <>
          <circle cx="8" cy="8" r="6" strokeWidth="1.5" fill="none" className={stroke} />
          <path d="M8 1.5 A6.5 6.5 0 0 0 8 14.5 Z" className="fill-chart-1" />
        </>
      )}
      {mark === "conditional" && (
        <circle cx="8" cy="8" r="6" strokeWidth="2" fill="none" className={stroke} />
      )}
      {mark === "blocked" && (
        <>
          <circle cx="8" cy="8" r="6" strokeWidth="2" fill="none" className={stroke} />
          <line x1="3.8" y1="12.2" x2="12.2" y2="3.8" strokeWidth="2" className={stroke} />
        </>
      )}
      {mark === "other" && (
        <rect
          x="2.5"
          y="2.5"
          width="11"
          height="11"
          rx="2"
          strokeWidth="1.5"
          fill="none"
          className="stroke-text-tertiary"
        />
      )}
    </svg>
  );
}

type Layout = keyof typeof COLUMNS;

function MatrixHead({ layout, reasonHeader }: { layout: Layout; reasonHeader: string }) {
  const marks = MARKS.slice(0, layout === "five" ? 5 : 4);
  return (
    <div
      aria-hidden="true"
      className={`hidden gap-x-3 border-b border-border-hairline pb-2 text-caption text-text-tertiary lg:grid ${COLUMNS[layout]}`}
    >
      <span>Area</span>
      {marks.map((mark) => (
        <span key={mark}>{HEAD[mark]}</span>
      ))}
      <span>{reasonHeader}</span>
    </div>
  );
}

function MatrixRow({ row, layout }: { row: ReadinessRow; layout: Layout }) {
  return (
    <li
      className={`grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-border-hairline py-2.5 last:border-b-0 lg:min-h-10 lg:gap-y-0 ${COLUMNS[layout]}`}
    >
      <span className="min-w-0 text-small font-medium wrap-anywhere text-text-primary lg:row-span-2 lg:row-start-1">
        {row.area}
      </span>
      <span
        data-state={row.mark}
        className={`flex items-center gap-2 text-small text-text-primary lg:row-start-1 ${COLUMN[row.mark]}`}
      >
        <ReadinessMarkShape mark={row.mark} />
        {row.word}
      </span>
      {row.hold && (
        <span
          data-hold
          className={`col-span-2 min-w-0 text-caption wrap-anywhere text-text-secondary lg:col-span-1 lg:row-start-2 lg:mt-0.5 ${COLUMN[row.mark]}`}
        >
          {row.hold}
        </span>
      )}
      <span
        className={`col-span-2 min-w-0 text-small wrap-anywhere text-text-secondary lg:col-span-1 lg:row-span-2 lg:row-start-1 ${REASON_AT[layout]}`}
      >
        {row.reason}
      </span>
    </li>
  );
}

function Readiness(props: LeadProps) {
  const result = sourceReadiness(props.entry);
  const kicker = moduleName(props.entry.output.module);
  return (
    <LeadFrame props={props}>
      {result.kind === "absent" && (
        <GapTile span={12} label="Readiness by area" kicker="Readiness by area">
          {ABSENT}
        </GapTile>
      )}
      {result.kind === "overall" && (
        <FigureTile
          props={props}
          span={12}
          label="Overall source readiness"
          kicker={kicker}
          title="Overall source readiness"
          line={result.line}
          source="the objective and profile row"
          table={{
            caption: "Overall source readiness",
            headers: result.headers,
            rows: [result.cells],
          }}
        >
          <div className="flex items-center gap-2 text-small text-text-primary">
            <ReadinessMarkShape mark={result.mark} />
            <span>{result.word}</span>
          </div>
          {result.context && (
            <p className="mt-2 text-small text-text-secondary">{result.context}</p>
          )}
        </FigureTile>
      )}
      {result.kind === "ready" && (
        <>
          <FigureTile
            props={props}
            span={12}
            label="Readiness by area"
            kicker={kicker}
            title="Readiness by area"
            line={result.line}
            source="the readiness table"
            table={{
              caption: "Readiness by area",
              headers: [
                "Area",
                "Readiness",
                result.reasonHeader,
                ...(result.rows.some((row) => row.hold) ? ["On hold"] : []),
              ],
              rows: result.rows.map((row) => [
                row.area,
                row.word,
                row.reason,
                ...(result.rows.some((one) => one.hold) ? [row.hold ?? ""] : []),
              ]),
            }}
          >
            <div>
              <MatrixHead
                layout={result.rows.some((row) => row.mark === "other") ? "five" : "four"}
                reasonHeader={result.reasonHeader}
              />
              <ul aria-label="Readiness by area" className="flex flex-col">
                {result.rows.map((row) => (
                  <MatrixRow
                    key={row.line}
                    row={row}
                    layout={result.rows.some((one) => one.mark === "other") ? "five" : "four"}
                  />
                ))}
              </ul>
            </div>
          </FigureTile>
          {!result.hasEvidenceTable && (
            <GapTile
              span={12}
              label="Key evidence located and conflicts"
              kicker="Key evidence located and conflicts"
            >
              {NOT_HERE}
            </GapTile>
          )}
        </>
      )}
    </LeadFrame>
  );
}

/** Source readiness: which areas the evidence supports, in the states the handoff states. */
export const SourceReadinessLead: Lead = Readiness;
// The frame keeps drawing the module's own event lanes, maps and figures: this lead draws none.
SourceReadinessLead.draws = [];
