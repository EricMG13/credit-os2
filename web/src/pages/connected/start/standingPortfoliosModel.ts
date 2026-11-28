import { useEffect, useRef, useState } from "react";
import {
  clearStandingFiles,
  ensureStandingPortfolios,
  getStandingPortfolios,
  refreshStandingPortfolio,
  storeStandingFiles,
  uploadStandingFile,
  type StandingFetch,
  type StandingListing,
  type StandingPortfolio,
} from "../api";
import { asSentence, errorText } from "../useResource";
import { comparisonFacts } from "./plain";
import { FILE_COUNT_LIMIT, FILE_TYPES, PORTFOLIO_FILE_SIZE_LIMIT } from "./referencePortfolio";

export const STANDING_TITLE = "Standing portfolios";
export const STANDING_EXPLANATION =
  "The report compares the issuer with these portfolios. The two index holdings are fetched from the fund manager's daily files when you ask, or the first time they are needed; you can also supply a file yourself.";
const NOTHING_REPLACED = "Nothing was replaced.";

/** An action's result on one portfolio's line; `alert` when the action did not succeed. */
type StandingNote = { text: string; alert: boolean };
type Work = "fetch" | "replace";

/**
 * The standing reference portfolios as the Documents step draws them: the CLO portfolio and the
 * two index funds every report is read against. They are kept by the service, not by a run: what
 * is done here is sent on their own routes, never in a run's answers or documents.
 */
export type StandingView = {
  /** The service's listing; undefined until it has answered. */
  listing?: readonly StandingPortfolio[];
  /** Why the listing could not be loaded, as a sentence; "" otherwise. */
  problem: string;
  /** The portfolios being fetched or replaced, by key. */
  working: Readonly<Partial<Record<string, Work>>>;
  /** The latest action's result on each portfolio, by key. */
  notes: Readonly<Partial<Record<string, StandingNote>>>;
  fetchLatest: (key: string) => void;
  replace: (key: string, selected: Iterable<File> | null) => void;
};

/** An index fund never fetched: no stored set, no failed fetch, no file the service cannot read. */
const neverFetched = (entry: StandingPortfolio) =>
  entry.fetchable && entry.stored_at === null && entry.failure === null && entry.error === null;

/** What a line says of the stored set: its date and its size, or that there is none yet. */
export function standingFacts(entry: StandingPortfolio) {
  if (entry.stored_at === null) return "Not yet available";
  const count = entry.positions ?? 0;
  const dated = entry.as_of ? `As of ${entry.as_of}` : "No as-of date stated";
  return `${dated} · ${String(count)} ${count === 1 ? "position" : "positions"}`;
}

/** The failed fetch beside the set it left in place; "" when the last fetch did not fail. */
export function failureLine(entry: StandingPortfolio) {
  if (!entry.failure) return "";
  const failed = `The last fetch failed: ${asSentence(entry.failure.message)}`;
  if (entry.stored_at === null) return failed;
  return `${failed} Showing the holdings as of ${entry.as_of ?? "an unstated date"}.`;
}

/** What one "fetch latest" did, in a sentence or two; why a fetch failed is on the line itself. */
function fetchedNote(done: StandingFetch): StandingNote {
  if (done.outcome === "failed")
    return { text: `The fetch failed. ${NOTHING_REPLACED}`, alert: true };
  if (done.outcome === "kept") return { text: asSentence(done.message ?? ""), alert: false };
  const changed = [
    done.columns_gained.length > 0 ? `New in the file: ${done.columns_gained.join(", ")}.` : "",
    done.columns_lost.length > 0 ? `No longer in the file: ${done.columns_lost.join(", ")}.` : "",
  ].filter(Boolean);
  const text = [
    `Fetched: the holdings as of ${done.as_of ?? "an unstated date"} are stored.`,
    // A stored file's own sentence: that it is stale, when it is.
    ...(done.message ? [asSentence(done.message)] : []),
    ...(changed.length > 0 ? ["The file's columns changed.", ...changed] : []),
  ];
  return { text: text.join(" "), alert: false };
}

/** Files refused before anything is sent: their type, their size or their number. */
function chosenProblems(files: readonly File[]) {
  const problems = files.flatMap((file) =>
    !FILE_TYPES.test(file.name)
      ? [`${file.name} is not a CSV or Excel file.`]
      : file.size > PORTFOLIO_FILE_SIZE_LIMIT
        ? [`${file.name} exceeds the 20 MB limit.`]
        : [],
  );
  if (files.length > FILE_COUNT_LIMIT) problems.push("Choose at most 4 files.");
  return problems.join(" ");
}

/** The listing an answer carries; a service that sent none is a failure, said in words. */
function listed(answer: StandingListing) {
  if (!Array.isArray(answer.portfolios))
    throw new Error("The service did not list the standing portfolios.");
  return answer.portfolios;
}

const refused = (failure: unknown): StandingNote => ({
  text: `${asSentence(errorText(failure))} ${NOTHING_REPLACED}`,
  alert: true,
});

function without(working: Partial<Record<string, Work>>, keys: readonly string[]) {
  return Object.fromEntries(Object.entries(working).filter(([key]) => !keys.includes(key)));
}

/**
 * The standing portfolios: listed once the page has loaded, and the index funds never fetched
 * fetched once, the first time the page finds them missing. After a failed fetch only the
 * analyst's "Fetch latest holdings" fetches again, so loading the page never refetches.
 */
export function useStandingPortfolios(): StandingView {
  const [listing, setListing] = useState<StandingPortfolio[]>();
  const [problem, setProblem] = useState("");
  const [working, setWorking] = useState<Partial<Record<string, Work>>>({});
  const [notes, setNotes] = useState<Partial<Record<string, StandingNote>>>({});
  // The first fetch, asked for once per page: a second run of the effect (a development build
  // runs each twice) waits for the same answer instead of asking again.
  const ensuring = useRef<Promise<StandingListing>>(undefined);

  useEffect(() => {
    const control = new AbortController();
    const { signal } = control;
    // Asked after each wait: the page may have left meanwhile.
    const left = () => signal.aborted;
    let absent: string[] = [];
    const load = async () => {
      const first = listed(await getStandingPortfolios(signal));
      if (left()) return;
      setListing(first);
      absent = first.filter(neverFetched).map(({ key }) => key);
      if (absent.length === 0) return;
      ensuring.current ??= ensureStandingPortfolios();
      setWorking((now) => ({ ...now, ...Object.fromEntries(absent.map((key) => [key, "fetch"])) }));
      const after = listed(await ensuring.current);
      if (!left()) setListing(after);
    };
    load()
      .catch((failure: unknown) => {
        if (!left()) setProblem(asSentence(errorText(failure)));
      })
      .finally(() => {
        if (!left()) setWorking((now) => without(now, absent));
      });
    return () => {
      control.abort();
    };
  }, []);

  function begin(key: string, work: Work) {
    setWorking((now) => ({ ...now, [key]: work }));
  }

  function finish(key: string, note: StandingNote) {
    setNotes((now) => ({ ...now, [key]: note }));
    setWorking((now) => without(now, [key]));
  }

  async function fetchLatest(key: string) {
    begin(key, "fetch");
    try {
      const done = await refreshStandingPortfolio(key);
      setListing(listed(done));
      finish(key, fetchedNote(done));
    } catch (failure) {
      finish(key, refused(failure));
    }
  }

  async function replace(key: string, selected: Iterable<File> | null) {
    const files = Array.from(selected ?? []);
    if (files.length === 0) return;
    const problems = chosenProblems(files);
    if (problems) {
      setNotes((now) => ({
        ...now,
        [key]: { text: `${problems} ${NOTHING_REPLACED}`, alert: true },
      }));
      return;
    }
    begin(key, "replace");
    try {
      await clearStandingFiles(key);
      for (const file of files) await uploadStandingFile(key, file);
      const read = await storeStandingFiles(key);
      setListing(listed(read));
      finish(key, { text: `Stored. ${comparisonFacts(read.portfolio).join(" ")}`, alert: false });
    } catch (failure) {
      finish(key, refused(failure));
    }
  }

  return {
    listing,
    problem,
    working,
    notes,
    fetchLatest: (key) => void fetchLatest(key),
    replace: (key, selected) => void replace(key, selected),
  };
}
