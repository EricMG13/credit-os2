// What a Signal page asks of the service it is drawn on. The design-reference app provides none, so
// every control there stays in memory; the connected app's live page provides these.
import { createContext, useContext } from "react";

/** One write, as a path under the service's API (writes.ts names them all). */
export type SignalWrite = {
  method: "POST" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  /** The write changes who is reading, so nothing drawn before it is held across the re-read. */
  fresh?: true;
};

/**
 * `refusal` is null once the service has accepted the write and the snapshot has been read again,
 * else the sentence to show: the service's own where it gave one. `reply` is what the service said.
 */
export type SignalAnswer = { refusal: string | null; reply: unknown };

export type SignalActions = {
  write: (request: SignalWrite) => Promise<SignalAnswer>;
  /** The reader pressed Show on the new-stories pill: its stories join the list drawn. */
  reveal: () => void;
  /** Read the service again now (the feed alert's Retry). */
  refresh: () => void;
};

export const SignalActionsContext = createContext<SignalActions | null>(null);

/** Null in the design-reference app: there is no service, and nothing is written. */
export function useSignalActions(): SignalActions | null {
  return useContext(SignalActionsContext);
}

/**
 * Writing from inside the frame, where a refusal is said in the alert above the page: `send` says
 * it and still gives the answer; `note` says a sentence of the service's that is not a refusal.
 */
export type SignalPageWrite = {
  send: (request: SignalWrite) => Promise<SignalAnswer>;
  note: (sentence: string) => void;
};

export const SignalPageWriteContext = createContext<SignalPageWrite | null>(null);

/** Null in the design-reference app, as `useSignalActions` is. */
export function usePageWrite(): SignalPageWrite | null {
  return useContext(SignalPageWriteContext);
}
