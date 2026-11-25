import { useCallback, useState, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { ArrowRight, ChevronDown, ChevronUp, Download01 } from "@untitledui/icons";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { useResource } from "../useResource";
import { scopeQualifications } from "../visuals/LegacyForecast";
import { moduleName } from "../api";
import type { ForecastSource } from "./ForecastRecord";
import type { Limitation } from "./forecastData";
import { PublishedSource } from "./PublishedTrace";
import { GapNote, Tile } from "./overview/Tile";

type FileLink = { label: string; href: string };

const TARGET = "min-h-8 max-[480px]:min-h-11";
/** Limits shown before the rest are one press away. */
const MOST_LIMITS = 8;

/** The run's calculation JSON for this model, as the artifacts listing publishes it. */
function CalculationDownload({ folder, model }: { folder: string; model: string }) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const response = await fetch(`/connected/artifacts/${encodeURIComponent(folder)}`, {
        signal,
      });
      if (!response.ok) throw new Error("The calculation file could not be listed.");
      const data = (await response.json()) as { files?: FileLink[] };
      if (!Array.isArray(data.files)) throw new Error("The calculation file could not be listed.");
      return data.files;
    },
    [folder],
  );
  const { value, error } = useResource(load);
  // Whatever the failure, the reader is told the same thing in words; the detail is not drawn.
  if (error)
    return (
      <p className="text-small text-text-secondary">The calculation file could not be listed.</p>
    );
  if (!value)
    return (
      <p role="status" className="text-small text-text-secondary">
        Listing the calculation file…
      </p>
    );
  const file = value.find(
    ({ label, href }) => label === "Calculation JSON" && href.includes(`/${model}/`),
  );
  if (!file)
    return (
      <p className="text-small text-text-secondary">
        No calculation file is listed for this model.
      </p>
    );
  return (
    <Button
      href={file.href}
      download
      color="secondary"
      size="sm"
      iconLeading={Download01}
      className={TARGET}
    >
      Download calculation
    </Button>
  );
}

const ROW = "border-t border-border-hairline pt-3 first:border-t-0 first:pt-0";

type Passage = { text: string | null; recorded: string };
type Shared = { reason: string; lines: (Passage & { name: string })[] };

/** "<line>: <reason>": a limit stated for one named line; anything else is no such limit. */
function namedLine(text: string | null) {
  const at = text?.indexOf(": ") ?? -1;
  if (!text || at < 1 || at > 60 || /[.;:]/u.test(text.slice(0, at))) return null;
  return { name: text.slice(0, at), reason: text.slice(at + 2) };
}

/**
 * The limits as rows, in the model's order. Limits that state one reason, character for character,
 * for different named lines become one row at the first of them: the reason once, as written, then
 * each line's name with its own trace. Nothing else is merged and no limit is dropped.
 */
function scopeRows(limits: readonly Passage[]): (Passage | Shared)[] {
  const shared = new Map<string, Shared>();
  for (const limit of limits) {
    const named = namedLine(limit.text);
    if (!named) continue;
    const group = shared.get(named.reason) ?? { reason: named.reason, lines: [] };
    group.lines.push({ ...limit, name: named.name });
    shared.set(named.reason, group);
  }
  const drawn = new Set<Shared>();
  return limits.flatMap((limit): (Passage | Shared)[] => {
    const named = namedLine(limit.text);
    const group = named && shared.get(named.reason);
    if (!group || group.lines.length < 2) return [limit];
    if (drawn.has(group)) return [];
    drawn.add(group);
    return [group];
  });
}

/** One reason the model records for several lines: the reason once, then each line with its trace. */
function SharedLimit({ row, source }: { row: Shared; source?: ForecastSource }) {
  return (
    <li className={`${ROW} grid min-w-0 gap-2`}>
      <p className="text-small text-text-secondary">
        <span className="text-text-tertiary">
          Recorded for {String(row.lines.length)} lines, in the same words:
        </span>{" "}
        {row.reason}
      </p>
      <ul aria-label="Lines this limit is recorded for" className="flex flex-wrap gap-2">
        {row.lines.map(({ name, recorded }) => (
          <li
            key={recorded}
            className={`${TRACE_HOST} inline-flex items-center gap-1 rounded-ds-xs border border-border-subtle bg-surface-subtle pl-2 text-caption text-text-primary`}
          >
            {name}
            {source?.(`Model scope qualification, ${name}`, { recordedQualification: recorded })}
          </li>
        ))}
      </ul>
    </li>
  );
}

/** Scope and limits as a visible list, each with its trace. */
export function ScopeTile({
  model,
  source,
  note,
  register,
  limitations = [],
  limitationHref,
}: {
  model: { id: string };
  source?: ForecastSource;
  note?: ReactNode;
  register: boolean;
  /** The forward model's own Limitations passage, every item, as written. */
  limitations?: Limitation[];
  limitationHref?: (line: number) => string;
}) {
  const { base, limits, lineLevel } = scopeQualifications(model);
  const [allLimits, setAllLimits] = useState(false);
  // Every limit, in the model's order, a reason several lines share drawn once; beyond eight rows,
  // the rest one press away.
  const rows = scopeRows(limits);
  const shownLimits = allLimits ? rows : rows.slice(0, MOST_LIMITS);
  const passages: (Passage | Shared)[] = [...base, ...shownLimits];
  return (
    <Tile
      span={8}
      label="Scope and limits"
      title="Scope and limits"
      kicker="What this forecast can and cannot show"
      className="lg:self-start"
    >
      {passages.length ? (
        <ul className="grid min-w-0 gap-3 wrap-anywhere">
          {passages.map((row) =>
            "reason" in row ? (
              <SharedLimit key={JSON.stringify(row.lines)} row={row} source={source} />
            ) : (
              <li
                key={JSON.stringify([row.recorded, row.text])}
                className={`${TRACE_HOST} ${ROW} flex items-start justify-between gap-2`}
              >
                <p className="text-small text-text-secondary">
                  {row.text ?? "This limit carries a reference; read it in Evidence."}
                </p>
                {source?.("Model scope qualification", { recordedQualification: row.recorded })}
              </li>
            ),
          )}
        </ul>
      ) : (
        <GapNote>No qualifications are available in this summary.</GapNote>
      )}
      {lineLevel > 0 && (
        <Button
          href="#evidence/record/notes"
          color="link-gray"
          size="sm"
          className={`w-fit ${TARGET}`}
        >
          {lineLevel === 1
            ? "1 line-level entry is in the Evidence record"
            : `${String(lineLevel)} line-level entries are in the Evidence record`}
        </Button>
      )}
      {rows.length > MOST_LIMITS && (
        <Button
          color="link-gray"
          size="sm"
          iconTrailing={allLimits ? ChevronUp : ChevronDown}
          aria-expanded={allLimits}
          onClick={() => {
            setAllLimits(!allLimits);
          }}
          className={`w-fit ${TARGET}`}
        >
          {allLimits ? "Fewer limits" : `All ${String(limits.length)} limits`}
        </Button>
      )}
      {limitations.length > 0 && (
        <section aria-label={`${moduleName("CP-2G")}'s limitations`} className="grid min-w-0 gap-2">
          <h4 className="text-small font-medium text-text-primary">
            {`${moduleName("CP-2G")}'s limitations, as it writes them`}
          </h4>
          <ul className="grid min-w-0 gap-2 wrap-anywhere">
            {limitations.map(({ line, text }) => (
              <li key={line} className={`${TRACE_HOST} flex items-start justify-between gap-2`}>
                <p className="text-small text-text-secondary">
                  {text ?? "This limitation carries a reference; read it in Evidence."}
                </p>
                {limitationHref && (
                  <PublishedSource
                    href={limitationHref(line)}
                    name={`${moduleName("CP-2G")} limitation, line ${String(line)}`}
                    linkLabel={`Source for this ${moduleName("CP-2G")} limitation`}
                  >
                    View source
                  </PublishedSource>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {note}
      <div className="flex flex-wrap gap-x-4">
        <Button
          href="#evidence/record/notes"
          color="link-gray"
          size="sm"
          iconTrailing={ArrowRight}
          className={TARGET}
        >
          Full model notes and limitations
        </Button>
        {register && (
          <Button href="#evidence/record/notes" color="link-gray" size="sm" className={TARGET}>
            View model records in Evidence
          </Button>
        )}
      </div>
    </Tile>
  );
}

/** The published model: which model is shown, and its calculation download, on one row. */
export function PublishedModelTile({
  model,
  folder,
  select,
}: {
  model: { id: string };
  folder: string;
  select?: ReactNode;
}) {
  return (
    <Tile
      span={8}
      label="Published model"
      title="Published model"
      kicker="The model, its charts and the calculation are part of this report"
    >
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {select}
        <CalculationDownload folder={folder} model={model.id} />
        <Button
          href="#evidence/summary"
          color="link-gray"
          size="sm"
          iconTrailing={ArrowRight}
          className={`w-fit ${TARGET}`}
        >
          Forecast evidence and artifacts
        </Button>
      </div>
    </Tile>
  );
}
