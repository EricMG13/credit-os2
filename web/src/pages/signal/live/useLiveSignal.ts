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
import { viewNow } from "./place";
import { readSnapshot, sendWrite, type Failure, type Write } from "./service";

/** How often the snapshot is read again while the tab is visible. */
export const REREAD_MS = 60_000;

type State = { fresh: SignalSlice | null; held: Held | null; failure: Failure | null };
type Event =
  /** `at` is the view on screen when the answer arrived; null holds nothing against it. */
  | { type: "read"; slice: SignalSlice; at: ViewAt | null }
  | { type: "failed"; failure: Failure }
  | { type: "retry" }
  | { type: "reveal"; at: ViewAt | null };

function reduce(state: State, event: Event): State {
  switch (event.type) {
    case "read":
      return {
        fresh: event.slice,
        held: holdAfterRead(state.fresh, state.held, event.slice, event.at),
        failure: null,
      };
    case "failed":
      return { ...state, failure: event.failure };
    case "retry":
      return { ...state, failure: null };
    case "reveal":
      return { ...state, held: holdAfterReveal(state.fresh, state.held, event.at) };
  }
}

/** Requests one at a time, in the order asked. Nothing is asked for a page that has gone. */
class Line {
  private last: Promise<unknown> = Promise.resolve();
  private waiting = 0;
  private stop = new AbortController();

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
async function load(stop: AbortSignal, dispatch: Dispatch<Event>, hold: boolean) {
  const got = await readSnapshot(stop);
  if (stop.aborted) return;
  if (got.ok) dispatch({ type: "read", slice: got.slice, at: hold ? viewNow() : null });
  else dispatch({ type: "failed", failure: got.failure });
}

function actionsOn(line: Line, dispatch: Dispatch<Event>): SignalActions {
  // A new name is a new reader (another role, other follows and saves), so nothing drawn is held.
  const write = (sent: Write) =>
    line.add(async (stop) => {
      const refusal = await sendWrite(sent, stop);
      if (refusal === null) await load(stop, dispatch, sent.kind !== "rename");
      return refusal;
    });
  return {
    save: (id, on) => write({ kind: "save", id, on }),
    follow: (id, on) => write({ kind: "follow", id, on }),
    rename: (name) => write({ kind: "rename", name }),
    reveal: () => {
      dispatch({ type: "reveal", at: viewNow() });
    },
    refresh: () => {
      dispatch({ type: "retry" });
      void line.add((stop) => load(stop, dispatch, true));
    },
  };
}

/** Reads on arrival, then every `REREAD_MS` and on return to the tab, while it is visible and nothing is already asked. */
function useReading(line: Line, dispatch: Dispatch<Event>) {
  useEffect(() => {
    line.open();
    const read = () => {
      void line.add((stop) => load(stop, dispatch, true));
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
 * `at` is the feed view the address draws. `source` is null until a first snapshot has been read;
 * `failure` then says why none came. With a snapshot in hand a failed re-read keeps the page and
 * sets the feed's own error, which the feed pages draw with Retry.
 */
export function useLiveSignal(at: ViewAt | null): {
  source: LibraryData | null;
  failure: Failure | null;
  actions: SignalActions;
} {
  const [state, dispatch] = useReducer(reduce, { fresh: null, held: null, failure: null });
  const [line] = useState(() => new Line());
  useReading(line, dispatch);
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
  return { source, failure: state.failure, actions };
}
