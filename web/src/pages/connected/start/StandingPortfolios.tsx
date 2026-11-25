import { useId, useRef } from "react";
import { Button } from "@/components/base/buttons/button";
import type { StandingPortfolio } from "../api";
import {
  STANDING_EXPLANATION,
  STANDING_TITLE,
  failureLine,
  standingFacts,
  type StandingView,
} from "./standingPortfolios";

/** At least 32 px tall everywhere, 44 px at phone width. */
const TARGET = "min-h-8 max-[480px]:min-h-11";
const WORKING = { fetch: "Fetching the latest holdings…", replace: "Reading the files…" };

function StandingLine({ entry, view }: { entry: StandingPortfolio; view: StandingView }) {
  const input = useRef<HTMLInputElement>(null);
  const work = view.working[entry.key];
  const note = view.notes[entry.key];
  const failure = failureLine(entry);
  return (
    <li className="grid gap-1 py-3 text-small">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="font-medium wrap-anywhere text-text-primary">{entry.name}</p>
          <p className="text-text-secondary">{standingFacts(entry)}</p>
        </div>
        {entry.fetchable && (
          <Button
            size="sm"
            color="secondary"
            className={TARGET}
            aria-label={`Fetch latest holdings: ${entry.name}`}
            isDisabled={work !== undefined}
            onPress={() => {
              view.fetchLatest(entry.key);
            }}
          >
            Fetch latest holdings
          </Button>
        )}
        <Button
          size="sm"
          color="secondary"
          className={TARGET}
          aria-label={`Replace with a file: ${entry.name}`}
          isDisabled={work !== undefined}
          onPress={() => input.current?.click()}
        >
          Replace with a file
        </Button>
        <input
          ref={input}
          className="sr-only"
          aria-label={`Files for ${entry.name}`}
          tabIndex={-1}
          type="file"
          multiple
          accept=".csv,.xlsx"
          onChange={(event) => {
            view.replace(entry.key, event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {failure && <p className="wrap-anywhere text-warning-text">{failure}</p>}
      {entry.error && <p className="wrap-anywhere text-warning-text">{entry.error}</p>}
      <p role="status" className="wrap-anywhere text-text-secondary empty:hidden">
        {work ? WORKING[work] : note && !note.alert ? note.text : null}
      </p>
      {!work && note?.alert && (
        <p
          role="alert"
          className="rounded-ds-sm border border-error-edge bg-error-fill px-3 py-2 wrap-anywhere text-error-text"
        >
          {note.text}
        </p>
      )}
    </li>
  );
}

/**
 * The Documents step's standing portfolios: the three reference portfolios every report is read
 * against, each with the date of the holdings the service keeps, a fetch of an index fund's latest
 * holdings and a replacement from the analyst's own file. They are not documents of the run.
 */
export function StandingPortfolios({ view }: { view: StandingView }) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="grid gap-2 sm:col-span-2">
      <div className="grid gap-1">
        <h3 id={titleId} className="text-h4 font-medium">
          {STANDING_TITLE}
        </h3>
        <p className="reading-copy text-small text-text-secondary">{STANDING_EXPLANATION}</p>
      </div>
      {view.listing ? (
        <ul aria-labelledby={titleId} className="divide-y divide-border-hairline">
          {view.listing.map((entry) => (
            <StandingLine key={entry.key} entry={entry} view={view} />
          ))}
        </ul>
      ) : (
        !view.problem && (
          <p className="text-small text-text-secondary">Loading the standing portfolios…</p>
        )
      )}
      {view.problem && (
        <p className="text-small wrap-anywhere text-text-secondary">
          {`The standing portfolios could not be listed. ${view.problem}`}
        </p>
      )}
    </section>
  );
}
