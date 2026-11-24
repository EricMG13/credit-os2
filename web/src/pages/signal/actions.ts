// What a Signal page asks of the service it is drawn on. The design-reference app provides none, so
// every control there stays in memory; the connected app's live page provides these.
import { createContext, useContext } from "react";

export type SignalActions = {
  /** Each write resolves to null once the service has accepted it and the snapshot has been read
   * again, else to the sentence to show: the service's own where it gave one. */
  save: (storyId: string, on: boolean) => Promise<string | null>;
  follow: (topicId: string, on: boolean) => Promise<string | null>;
  rename: (name: string) => Promise<string | null>;
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
