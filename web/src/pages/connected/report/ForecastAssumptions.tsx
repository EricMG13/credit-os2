import { ChevronRight, Plus } from "@untitledui/icons";
import { containsReference, readerText } from "../publishedReport";
import { driverTable } from "./forecastDrivers";
import { RecordedForecastAssumptions, type ForecastSource } from "./ForecastRecord";
import { GapChip } from "./ForecastGaps";
import { GapNote, Tile } from "./overview/Tile";

const SPAN = "Assumptions by case";
const SHOCKED_CASE = "Downside case";

/** "Not stated": the gap chip. */
function NotStated() {
  return <GapChip>Not stated</GapChip>;
}

const NOTE_IN_EVIDENCE = "The model's note on the downside case is in Evidence.";

/** A table id such as T2B.1, which `containsReference` does not recognise. */
const TABLE_ID = /\bT\d+[A-Z]*\.\d+\b/u;

/** The model's downside note for the reader: module names, and no reference drawn here. */
function readerNote(note: string) {
  const text = readerText(note);
  return containsReference(text) || TABLE_ID.test(text) ? NOTE_IN_EVIDENCE : text;
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
  return (
    <Tile {...tile}>
      <div className="flex flex-col gap-1 text-small text-text-secondary">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-4 place-items-center rounded-ds-xs border border-action-subtle-hover bg-surface-selected"
            >
              <Mark />
            </span>
            Differs from base
          </span>
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-4 place-items-center rounded-ds-xs border border-border-hairline bg-surface-card"
            >
              <OnlyMark />
            </span>
            <span>Only this case states it: base does not give the driver</span>
          </span>
          <span className="flex items-center gap-2">
            <NotStated />
            the inputs do not give this driver for the case; nothing is assumed
          </span>
        </p>
        <p>Values are the module&apos;s recorded fractions (0.05 is 5%) or amounts, as recorded.</p>
        {years.length > 0 && <p>Planning years: {years.join(" · ")}</p>}
      </div>
      <div
        role="region"
        aria-label="Assumptions by case table"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="relative min-w-0 overflow-x-auto max-[480px]:p-2"
      >
        <table className="w-full min-w-[36rem] border-collapse text-small">
          <caption className="sr-only">Forecast drivers by case</caption>
          <thead>
            <tr className="text-left text-caption text-text-tertiary">
              <th scope="col" className="py-2 pr-3 font-medium">
                Driver
              </th>
              {cases.map(({ key, name }) => (
                <th key={key} scope="col" className="px-3 py-2 font-medium">
                  {name}
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
                        {row.unit}
                      </span>
                    )}
                  </th>
                  {row.cells.map((cell, at) => (
                    <td
                      key={cases[at]?.key}
                      className={`whitespace-nowrap px-3 py-2 font-mono tabular-nums ${
                        cell.differs ? "bg-surface-selected text-text-primary" : "text-text-primary"
                      }`}
                    >
                      {cell.stated ? (
                        <>
                          <span
                            className="inline-flex flex-wrap items-center gap-x-1.5"
                            title={cell.title}
                          >
                            {cell.differs && <Mark />}
                            {cell.parts.map((part, index) => (
                              <span key={index} className="inline-flex items-center gap-1.5">
                                {index > 0 && <span aria-hidden="true"> · </span>}
                                {part === null ? <NotStated /> : part}
                              </span>
                            ))}
                          </span>
                          {cell.differs && <span className="sr-only">, differs from base</span>}
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
                      ) : (
                        <NotStated />
                      )}
                    </td>
                  ))}
                  <td className="py-2 pl-3">
                    {source?.(`${row.name} assumptions`, { case: joined, inputPath: path })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {downsideNote !== undefined && cases.some(({ shock }) => shock) && (
        <p className="text-small text-text-secondary">{readerNote(downsideNote)}</p>
      )}
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
