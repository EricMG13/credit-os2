import { unitLabel } from "../../publishedReport";
import { ticks, type SourceTable } from "../../visuals/visualData";
import { readCell, type Cell } from "../overview/figureData";
import { gapReason } from "../overview/read";
import { BarRow, Trace, type LeadTable } from "./parts";
import { readerCell, readerCellOf, WITHHELD, type Chart } from "./read";

export type Step = { label: string; cell: Cell; line: number };

/**
 * A published step table (`Step | Amount | Reporting unit | …`): the opening, the signed changes and
 * the closing, as written. `drawable` only when every amount is a number, the rows share one unit and
 * the opening plus the changes equal the closing; otherwise `why` says what stops the figure.
 */
function bridgeSteps(table: SourceTable, amountColumn = 1) {
  const texts = table.rows.map((row) => row[amountColumn] ?? "");
  const units = new Set(table.rows.map((row) => row.at(-2) ?? ""));
  const unit = units.size === 1 ? ([...units][0] ?? "") : "";
  const steps: Step[] = table.rows.map((row, at) => ({
    label: readerCell(row[0] ?? "") || "Not stated",
    cell: readerCellOf(readCell(texts[at] ?? "", texts, unit)),
    line: table.rowLines?.[at] ?? table.line,
  }));
  const stated = steps.find((step) => step.cell.value === null);
  const why = (() => {
    if (steps.length < 3) return "The bridge states fewer than an opening, a change and a closing.";
    if (!unit) return "The bridge's rows are in more than one unit.";
    if (stated) {
      const reason = gapReason(stated.cell.text) ?? stated.cell.reason;
      if (reason === "In Evidence")
        return `${stated.label} is not supplied; the reason is recorded in Evidence.`;
      return reason
        ? `${stated.label} is not supplied: ${reason}`
        : `${stated.label} has no amount the figure can place.`;
    }
    const values = steps.map((step) => step.cell.value ?? 0);
    const sum = values.slice(0, -1).reduce((total, value) => total + value, 0);
    const closing = values.at(-1) ?? 0;
    const tolerance = 1e-9 * Math.max(1, Math.abs(closing));
    return Math.abs(sum - closing) > tolerance
      ? "The bridge does not reconcile from opening to closing, so it is shown as a table."
      : null;
  })();
  return { steps, unit, why };
}

/**
 * A step chart as the page can draw it: the steps and unit, and `why` no figure is drawn. A table
 * the store withheld is read from the handoff as written, so its own reason (it does not reconcile,
 * a step is not supplied) is the one given; any other withheld table says only that the page could
 * not draw it. Null for a stated gap or no table.
 */
export function bridgeOf(chart: Chart) {
  if (chart.state !== "ready" && chart.state !== "withheld") return null;
  const read = bridgeSteps(chart.table);
  const why = read.why ?? (chart.state === "withheld" ? WITHHELD : null);
  return { ...read, why, table: chart.table };
}

/** A bridge's table view: each step's amount as written, one trace per row. */
export function stepTable(
  steps: readonly Step[],
  href: (line?: number) => string,
): LeadTable | undefined {
  if (!steps.length) return undefined;
  return {
    head: ["Step", "Amount"],
    rows: steps.map((step) => ({
      label: step.label,
      cells: [step.cell.text || null],
      end: <Trace href={href(step.line)} name={step.label} />,
    })),
    endHeading: "Source",
  };
}

const share = (value: number) => `${String(value * 100)}%`;

/** A bar's half-height (h-3), and the room between two rows (gap-y-2), for the step connectors. */
const HALF_BAR = "6px";
const ROW_GAP = "0.5rem";

/** The bridge's legend tones: levels, rises and falls (a zero step is a plain mark, unnamed). */
const SWATCH = {
  level: "bg-waterfall-total",
  adds: "bg-waterfall-up",
  uses: "bg-waterfall-down",
} as const;

/** Whether a step between the opening and the closing rises. */
export const rises = (steps: readonly Step[]) =>
  steps.slice(1, -1).some((step) => (step.cell.value ?? 0) > 0);

/**
 * The bridge's legend: each tone with its word, so direction is never by colour alone. `fall` names
 * the falls ("Uses" for liquidity, "Allocated" for a value allocation); "Adds" only with `rises`.
 */
export function BridgeLegend({ fall, rises: rise }: { fall: string; rises: boolean }) {
  const tones = [
    { swatch: SWATCH.level, word: "Opening and closing" },
    ...(rise ? [{ swatch: SWATCH.adds, word: "Adds" }] : []),
    { swatch: SWATCH.uses, word: fall },
  ];
  return (
    <>
      {tones.map(({ swatch, word }) => (
        <span key={word} className="flex items-center gap-1.5 text-caption text-text-secondary">
          <span aria-hidden="true" className={`size-2.5 flex-none rounded-[2px] ${swatch}`} />
          {word}
        </span>
      ))}
    </>
  );
}

/** A step's tone: the opening and closing are levels, a zero change neither adds nor uses. */
function toneOf(value: number, total: boolean) {
  if (total) return "level";
  return value < 0 ? "uses" : value > 0 ? "adds" : "flat";
}

/** One half of a step connector: out of a bar's row down to the gap, or into the next bar's row. */
function Connector({ at, name, into }: { at: number; name: string; into: boolean }) {
  return (
    <span
      data-connector={name}
      // Inset at either end of the track, so a connector never overhangs it.
      className={`absolute w-px bg-connector ${at >= 1 ? "-translate-x-full" : at <= 0 ? "" : "-translate-x-1/2"}`}
      style={
        into
          ? { left: share(at), top: 0, bottom: `calc(50% + ${HALF_BAR})` }
          : { left: share(at), top: `calc(50% + ${HALF_BAR})`, bottom: `-${ROW_GAP}` }
      }
    />
  );
}

/**
 * A horizontal waterfall: the opening and closing as full levels from zero, each change floating
 * from where the one before ended, rises and falls in their own tones (named in `BridgeLegend`), a
 * step connector from each bar's end to the next bar's start. Every figure is the module's, as
 * written and with its sign, under its step's name; the running positions place bars only.
 */
export function Bridge({ steps, unit, label }: { steps: Step[]; unit: string; label: string }) {
  const values = steps.map((step) => step.cell.value ?? 0);
  const last = steps.length - 1;
  const ends: number[] = [];
  values.forEach((value, at) => {
    ends.push(at === 0 || at === last ? value : (ends[at - 1] ?? 0) + value);
  });
  const scale = ticks([0, ...ends]);
  const lo = scale[0]?.value ?? 0;
  const hi = scale.at(-1)?.value ?? 1;
  const at = (value: number) => (value - lo) / (hi - lo || 1);
  const marks = scale.map((tick) => at(tick.value)).filter((mark) => mark !== at(0));
  const columns =
    "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 sm:grid-cols-[12rem_minmax(0,1fr)]";
  return (
    <div role="img" aria-label={label} className="flex min-w-0 flex-col gap-1">
      <ol aria-hidden="true" className={`${columns} gap-y-2`}>
        {steps.map((step, index) => {
          const total = index === 0 || index === last;
          const from = total ? 0 : (ends[index - 1] ?? 0);
          const tone = toneOf(values[index] ?? 0, total);
          return (
            <li key={step.line} className="contents">
              <span className="flex min-w-0 flex-col gap-0.5 self-center">
                <span
                  className={`text-small wrap-anywhere ${total ? "font-medium text-text-primary" : "text-text-secondary"}`}
                >
                  {step.label}
                </span>
                <span data-figure className="font-mono text-small text-text-primary tabular-nums">
                  {step.cell.text}
                </span>
              </span>
              <span className="relative flex min-w-0 items-center self-stretch">
                {index > 0 && (
                  <Connector at={at(ends[index - 1] ?? 0)} name={`${String(index - 1)}-in`} into />
                )}
                <BarRow
                  start={at(from)}
                  end={at(ends[index] ?? 0)}
                  tone={tone}
                  ticks={marks}
                  zero={at(0)}
                  bar={{ "data-bar": step.cell.text, "data-tone": tone }}
                  className="w-full"
                />
                {index < last && (
                  <Connector at={at(ends[index] ?? 0)} name={`${String(index)}-out`} into={false} />
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <div aria-hidden="true" className={columns}>
        <span />
        <span className="relative h-4">
          {scale.map((tick, index) => (
            <span
              key={tick.value}
              className={`absolute font-mono text-caption text-text-tertiary tabular-nums ${
                index === 0
                  ? ""
                  : index === scale.length - 1
                    ? "-translate-x-full"
                    : "-translate-x-1/2"
              }`}
              style={{ left: share(at(tick.value)) }}
            >
              {tick.label}
            </span>
          ))}
        </span>
      </div>
      <p className="sr-only">{`Amounts in ${unitLabel(unit)}.`}</p>
    </div>
  );
}
