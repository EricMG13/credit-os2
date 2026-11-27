// The live page's state: the newest snapshot read, the view held on screen across reads, and why
// the last read failed. Requests go one at a time in the order asked, so a write's own re-read is
// never answered by a snapshot older than the write, and two presses on one control arrive in order.
import { useEffect, useMemo, useReducer, useState, type Dispatch } from "react";
import type { LibraryData } from "../../../data";
import type { SignalActions } from "../actions";
import type { SignalSlice } from "../slice";
import {
  holdAfterRead,
  holdAfterReveal,
  shownSlice,
  withFeedError,
  type Held,
  type ViewAt,
} from "./hold";
import { snapshotQuery, viewNow } from "./place";
import { readSnapshot, sendWrite, type Failure } from "./service";

/** How often the snapshot is read again while the tab is visible. */
export const REREAD_MS = 60_000;

/** `query` is what the snapshot in hand was asked to carry in full (see `snapshotQuery`). */
type State = {
  fresh: SignalSlice | null;
  /** The build time the service gave the snapshot in `fresh`; null when it gave none. */
  asOf: string | null;
  query: string;
  held: Held | null;
  failure: Failure | null;
};
type Event =
  /** `at` is the view on screen when the answer arrived; null holds nothing against it. */
  | { type: "read"; slice: SignalSlice; asOf: string | null; query: string; at: ViewAt | null }
  | { type: "failed"; failure: Failure }
  | { type: "write-unauthorized"; text: string }
  | { type: "retry" }
  | { type: "reveal"; at: ViewAt | null };

function reduce(state: State, event: Event): State {
  switch (event.type) {
    case "read":
      return {
        fresh: event.slice,
        asOf: event.asOf,
        query: event.query,
        // A snapshot asked to carry more (a topic's older stories) is not a later reading of the
        // same lists: what it adds was always there, so nothing is held against it as new. The
        // plain query carries less, so it is held against whatever view the reader is back on.
        held:
          event.query === state.query || event.query === ""
            ? holdAfterRead(state.fresh, state.held, event.slice, event.at)
            : null,
        failure: null,
      };
    case "failed":
      return event.failure.unauthorized
        ? { ...state, fresh: null, asOf: null, held: null, failure: event.failure }
        : { ...state, failure: event.failure };
    case "write-unauthorized":
      return state.fresh?.scenes[0].snapshot.viewer.profileType === undefined
        ? state
        : {
            ...state,
            fresh: null,
            asOf: null,
            held: null,
            failure: { kind: "request", text: event.text, reason: null, unauthorized: true },
          };
    case "retry":
      return { ...state, failure: null };
    case "reveal":
      return { ...state, held: holdAfterReveal(state.fresh, state.held, event.at) };
  }
}

const START: State = { fresh: null, asOf: null, query: "", held: null, failure: null };

/** Requests one at a time, in the order asked. Nothing is asked for a page that has gone. */
class Line {
  private last: Promise<unknown> = Promise.resolve();
  private waiting = 0;
  private stop = new AbortController();
  /** What the next snapshot is asked to carry in full: the page on screen says. */
  query = "";

  want(query: string) {
    this.query = query;
  }

  open() {
    this.stop = new AbortController();
  }

  close() {
    this.stop.abort();
  }

  get idle() {
    return this.waiting === 0;
  }

  add<T>(job: (stop: AbortSignal) => Promise<T>): Promise<T> {
    this.waiting += 1;
    const done = this.last.then(() => job(this.stop.signal));
    const settle = () => {
      this.waiting -= 1;
    };
    this.last = done.then(settle, settle);
    return done;
  }
}

/** Read the snapshot and say what came; `hold` keeps the view on screen as the reader has it. */
async function load(
  line: Line,
  stop: AbortSignal,
  dispatch: Dispatch<Event>,
  hold: boolean,
): Promise<boolean> {
  const { query } = line;
  const got = await readSnapshot(stop, query);
  if (stop.aborted) return false;
  if (got.ok) {
    dispatch({
      type: "read",
      slice: got.slice,
      asOf: got.asOf,
      query,
      at: hold ? viewNow() : null,
    });
    return true;
  }
  dispatch({ type: "failed", failure: got.failure });
  return false;
}

function actionsOn(line: Line, dispatch: Dispatch<Event>): SignalActions {
  return {
    write: (request) =>
      line.add(async (stop) => {
        const answer = await sendWrite(request, stop);
        if (answer.refusal !== null) {
          if (answer.status === 401) {
            dispatch({ type: "write-unauthorized", text: answer.refusal });
          }
          return answer;
        }
        const read = await load(line, stop, dispatch, request.fresh !== true);
        return read ? answer : { ...answer, stale: true };
      }),
    reveal: () => {
      dispatch({ type: "reveal", at: viewNow() });
    },
    refresh: () => {
      dispatch({ type: "retry" });
      void line.add((stop) => load(line, stop, dispatch, true));
    },
  };
}

/** Reads on arrival, then every `REREAD_MS` and on return to the tab, while it is visible and nothing is already asked. */
function useReading(line: Line, dispatch: Dispatch<Event>) {
  useEffect(() => {
    line.open();
    const read = () => {
      void line.add((stop) => load(line, stop, dispatch, true));
    };
    const again = () => {
      if (document.visibilityState === "visible" && line.idle) read();
    };
    read();
    const timer = window.setInterval(again, REREAD_MS);
    document.addEventListener("visibilitychange", again);
    return () => {
      line.close();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", again);
    };
  }, [line, dispatch]);
}

/**
 * Moving to a topic's page or a thread's panel asks for the snapshot that carries it in full. The
 * page keeps what it has until that one arrives. Leaving for a page that needs no more reads
 * nothing: the snapshot in hand already holds it.
 */
function useFullerSnapshot(line: Line, dispatch: Dispatch<Event>, wanted: string, state: State) {
  const behind = state.fresh !== null && wanted !== "" && wanted !== state.query;
  useEffect(() => {
    line.want(wanted);
    if (behind) {
      // An earlier read's failure is not this read's: the page says it only if this one fails too.
      dispatch({ type: "retry" });
      void line.add((stop) => load(line, stop, dispatch, true));
    }
  }, [line, dispatch, wanted, behind]);
}

/**
 * `at` is the feed view the address draws, `route` the address itself. `source` is null until a first snapshot has been read;
 * `failure` then says why none came. With a snapshot in hand a failed re-read keeps the page and
 * sets the feed's own error, which the feed pages draw with Retry.
 */
export function useLiveSignal(
  at: ViewAt | null,
  route: string,
): {
  source: LibraryData | null;
  failure: Failure | null;
  actions: SignalActions;
  asOf: string | null;
} {
  const [state, dispatch] = useReducer(reduce, START);
  const [line] = useState(() => new Line());
  useReading(line, dispatch);
  useFullerSnapshot(line, dispatch, snapshotQuery(route, state.fresh), state);
  const actions = useMemo(() => actionsOn(line, dispatch), [line]);
  const source = useMemo((): LibraryData | null => {
    if (state.fresh === null) return null;
    const shown = shownSlice(state.fresh, state.held, at);
    return {
      schema: "credit-os-data/1",
      issuers: [],
      signal: withFeedError(shown, state.failure?.kind ?? null),
    };
  }, [state, at]);
  return { source, failure: state.failure, actions, asOf: state.asOf };
}
