import { ChevronRight, Plus } from "@untitledui/icons";
import { readerText, unitLabel } from "../publishedReport";
import { cites } from "./forecastData";
import { changeSign, exactDifference } from "../signal";
import { DIVERGING } from "../visuals/signal/scales";
import { driverTable } from "./forecastDrivers";
import { RecordedForecastAssumptions, type ForecastSource } from "./ForecastRecord";
import { GapChip } from "./ForecastGaps";
import { useOverflows } from "./leads/kit/useWidth";
import { GapNote, Tile } from "./overview/Tile";

const SPAN = "Assumptions by case";
const SHOCKED_CASE = "Downside case";

/** "Not stated": the gap chip. */
function NotStated() {
  return <GapChip>Not stated</GapChip>;
}

const NOTE_IN_EVIDENCE = "The model's note on the downside case is in Evidence.";

/** The model's downside note for the reader: module names, and no reference drawn here. */
function readerNote(note: string) {
  const text = readerText(note);
  return cites(text) ? NOTE_IN_EVIDENCE : text;
}

/** The small accent mark that, with the words, says a recorded value differs from base. */
function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 shrink-0" fill="none">
      <path
        d="M6 1.8 10.6 10.2H1.4Z"
        className="stroke-action"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Direction = "lower" | "higher";
type DriverCell = ReturnType<typeof driverTable>["rows"][number]["cells"][number];

/** The order of two recorded values by exact decimal arithmetic; no difference leaves this. */
function order(a: string, b: string): -1 | 0 | 1 | null {
  const difference = exactDifference(a, b);
  const sign = difference === null ? null : changeSign(difference);
  return sign === null ? null : sign < 0 ? -1 : sign > 0 ? 1 : 0;
}

const EACH_YEAR = / each year$/u;
const PERCENT = /\s*%$/u;

/** A cell's values year by year, as recorded (a collapsed "each year" run repeated to its length). */
function yearly(cell: DriverCell): (string | null)[] {
  const [only] = cell.parts;
  if (cell.parts.length === 1 && only !== null && only !== undefined && EACH_YEAR.test(only))
    return Array.from({ length: cell.title.split(" · ").length }, () =>
      only.replace(EACH_YEAR, ""),
    );
  return cell.parts;
}

/**
 * Whether a differing cell is lower or higher than base, pair by pair (one value stands for every
 * year). Not comparable, null: a year either side does not state, unequal runs, a pair that is not a
 * plain number or a percent on both sides, a mix of lower and higher, or every pair equal.
 */
function directionOf(base: DriverCell | undefined, cell: DriverCell): Direction | null {
  if (!base?.stated || !cell.stated) return null;
  const a = yearly(base);
  const b = yearly(cell);
  const length = a.length === 1 ? b.length : b.length === 1 ? a.length : a.length;
  if (a.length !== 1 && b.length !== 1 && a.length !== b.length) return null;
  const orders: (-1 | 0 | 1 | null)[] = [];
  for (let at = 0; at < length; at += 1) {
    const x = a[a.length === 1 ? 0 : at] ?? null;
    const y = b[b.length === 1 ? 0 : at] ?? null;
    if (x === null || y === null) return null;
    const percents = [PERCENT.test(x), PERCENT.test(y)];
    if (percents[0] !== percents[1]) return null;
    orders.push(percents[0] ? order(y.replace(PERCENT, ""), x.replace(PERCENT, "")) : order(y, x));
  }
  if (orders.includes(null)) return null;
  const lower = orders.includes(-1);
  const higher = orders.includes(1);
  return lower === higher ? null : lower ? "lower" : "higher";
}

/** The small chip that says, with the words, which side of base a differing value is. */
function Chip({ direction }: { direction: Direction }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-4 shrink-0 place-items-center rounded-ds-xs border border-border-hairline bg-surface-card font-sans text-caption leading-none text-text-primary"
    >
      {direction === "lower" ? "−" : "+"}
    </span>
  );
}

const TINT = { lower: DIVERGING[0], higher: DIVERGING[1] } as const;
const WORDS = { lower: "lower than base", higher: "higher than base" } as const;

/** The mark that, with the words, says only this case states a driver; the legend uses it too. */
function OnlyMark() {
  return <Plus aria-hidden="true" className="size-3 shrink-0 text-text-secondary" />;
}

/**
 * The forward model's drivers by case: one row per driver, one column per case, read-only. Values
 * are the module's recorded fractions or amounts. `caseNames` is the model's one case naming and
 * `downsideNote` its note saying which drivers the downside shock is applied to.
 */
export function AssumptionsByCase({
  document,
  source,
  caseNames = new Map<string, string>(),
  downsideNote,
}: {
  document: Record<string, unknown> | null;
  source?: ForecastSource;
  caseNames?: ReadonlyMap<string, string>;
  downsideNote?: string | undefined;
}) {
  const [scroller, overflows] = useOverflows();
  const tile = {
    span: 8,
    label: SPAN,
    kicker: "Drivers as the forward model states them · read-only",
    title: SPAN,
  } as const;
  if (document === null)
    return (
      <Tile {...tile}>
        <GapNote>No recorded inputs to tabulate: the inputs record is not matched.</GapNote>
      </Tile>
    );
  const { years, cases, rows } = driverTable(document, caseNames.get(SHOCKED_CASE) ?? SHOCKED_CASE);
  const joined = cases.map(({ name }) => name).join(" · ");
  if (!rows.length)
    return (
      <Tile {...tile}>
        <GapNote>The forecast inputs state no driver for any case.</GapNote>
      </Tile>
    );
  // The forward model gives an upside or downside-driver case every driver it does not restate
  // from base (the module's contract), so a blank there is "As base", not a driver left out.
  const inherits = (row: (typeof rows)[number], at: number) =>
    at > 0 && !cases[at]?.shock && !row.shock && row.cells[0]?.stated === true;
  const drawn = rows.flatMap((row) =>
    row.cells.filter((cell, at) => !(!cell.stated && inherits(row, at))),
  );
  const directions = rows.flatMap((row) =>
    row.cells.flatMap((cell) =>
      drawn.includes(cell) && cell.stated && cell.differs ? [directionOf(row.cells[0], cell)] : [],
    ),
  );
  const uses = {
    lower: directions.includes("lower"),
    higher: directions.includes("higher"),
    differs: directions.includes(null),
    only: drawn.some((cell) => cell.stated && cell.only),
    notStated: drawn.some((cell) => !cell.stated || cell.parts.includes(null)),
  };
  return (
    <Tile {...tile}>
      {/* The key names only the marks this table draws. */}
      {(uses.lower || uses.higher || uses.differs || uses.only || uses.notStated) && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-secondary">
          {(["lower", "higher"] as const).map(
            (side) =>
              uses[side] && (
                <span key={side} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="grid size-4 place-items-center rounded-ds-xs border border-border-hairline"
                    style={{ backgroundColor: TINT[side] }}
                  >
                    <Chip direction={side} />
                  </span>
                  {side === "lower" ? "Lower than base (−)" : "Higher than base (+)"}
                </span>
              ),
          )}
          {uses.differs && (
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid size-4 place-items-center rounded-ds-xs border border-action-subtle-hover bg-surface-selected"
              >
                <Mark />
              </span>
              Differs from base
            </span>
          )}
          {uses.only && (
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid size-4 place-items-center rounded-ds-xs border border-border-hairline bg-surface-card"
              >
                <OnlyMark />
              </span>
              <span>Only this case states it: base does not give the driver</span>
            </span>
          )}
          {uses.notStated && (
            <span className="flex items-center gap-2">
              <NotStated />
              the inputs do not give this driver for the case; nothing is assumed
            </span>
          )}
        </p>
      )}
      <div
        ref={scroller}
        role="region"
        aria-label="Assumptions by case table"
        // A scrolling box must be reachable by keyboard; one that fits adds no inert stop.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={overflows ? 0 : undefined}
        className="relative min-w-0 overflow-x-auto rounded-ds-sm outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:p-2"
      >
        <table className="w-full min-w-[36rem] border-collapse text-small">
          <caption className="sr-only">Forecast drivers by case</caption>
          <thead>
            <tr className="text-left text-caption text-text-tertiary">
              <th scope="col" className="py-2 pr-3 font-medium">
                Driver
              </th>
              {cases.map(({ key, name, shock }) => (
                <th key={key} scope="col" className="px-3 py-2 align-top font-medium">
                  {name}
                  {/* A case column's values run in the planning years' order, named here. */}
                  {!shock && years.length > 0 && (
                    <span
                      data-part="years"
                      className="block font-mono font-normal whitespace-nowrap tabular-nums"
                    >
                      {years.join(" · ")}
                    </span>
                  )}
                </th>
              ))}
              <th scope="col" className="py-2 pl-3 font-medium">
                Trace
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const stated = row.cells.findIndex((cell) => cell.stated);
              const firstKey = cases[stated]?.key;
              const baseStates = row.cells[0]?.stated === true;
              const path = row.shock
                ? ["downside_shock", row.key]
                : [baseStates || firstKey === undefined ? "base_drivers" : firstKey, row.key];
              return (
                <tr key={row.id} className="border-t border-border-hairline align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-text-primary">
                    {row.name}
                    {row.unit && (
                      <span className="block text-caption font-normal text-text-tertiary">
                        {unitLabel(row.unit)}
                      </span>
                    )}
                  </th>
                  {row.cells.map((cell, at) => {
                    const direction = cell.differs ? directionOf(row.cells[0], cell) : null;
                    return (
                      <td
                        key={cases[at]?.key}
                        data-direction={direction ?? undefined}
                        style={direction ? { backgroundColor: TINT[direction] } : undefined}
                        className={`whitespace-nowrap px-3 py-2 font-mono tabular-nums ${
                          cell.differs && !direction
                            ? "bg-surface-selected text-text-primary"
                            : "text-text-primary"
                        }`}
                      >
                        {cell.stated ? (
                          <>
                            <span
                              className="inline-flex items-center gap-x-1.5 whitespace-nowrap"
                              title={cell.title}
                            >
                              {cell.differs &&
                                (direction ? <Chip direction={direction} /> : <Mark />)}
                              {cell.parts.map((part, index) => (
                                <span key={index} className="inline-flex items-center gap-1.5">
                                  {index > 0 && <span aria-hidden="true"> · </span>}
                                  {part === null ? <NotStated /> : part}
                                </span>
                              ))}
                            </span>
                            {cell.differs && (
                              <span className="sr-only">
                                , differs from base{direction && `, ${WORDS[direction]}`}
                              </span>
                            )}
                            {cell.unlike && (
                              <span className="block font-sans text-caption text-text-secondary">
                                stated differently from base
                              </span>
                            )}
                            {cell.only && (
                              <span className="flex items-center gap-1 font-sans text-caption text-text-secondary">
                                <OnlyMark />
                                only this case states it
                              </span>
                            )}
                          </>
                        ) : inherits(row, at) ? (
                          <span title="The model takes this driver from the base case for this case">
                            As base
                          </span>
                        ) : (
                          <NotStated />
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 pl-3">
                    {source?.(`${row.name} assumptions`, { case: joined, inputPath: path })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-1 text-small text-text-secondary">
        <p>Values are the module&apos;s recorded fractions (0.05 is 5%) or amounts, as recorded.</p>
        {downsideNote !== undefined && cases.some(({ shock }) => shock) && (
          <p>{readerNote(downsideNote)}</p>
        )}
      </div>
      <details className="group">
        <summary className="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-ds-sm text-small font-medium text-text-link outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11">
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform group-open:rotate-90"
          />
          Recorded drivers, rationale and limitations
        </summary>
        <div className="mt-3">
          <RecordedForecastAssumptions document={document} source={source} />
        </div>
      </details>
    </Tile>
  );
}
