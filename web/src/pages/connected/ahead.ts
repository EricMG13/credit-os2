const asked = new Map<string, Promise<Response>>();

export const LIBRARY_ADDRESS = "/connected/library";

export function snapshotAddress(folder?: string) {
  return `/connected/snapshot${folder === undefined ? "" : `?run=${encodeURIComponent(folder)}`}`;
}

/** Asks for what a page reads first while that page's code is still loading. */
export function askAhead(address: string) {
  const answer = fetch(address, { cache: "no-store" });
  // A failure is reported to the page that takes this answer, not as an unhandled rejection.
  answer.catch(() => undefined);
  asked.set(address, answer);
}

/** The answer asked for ahead, taken once; any later request is made afresh. */
export function requestAhead(address: string, signal: AbortSignal) {
  const ahead = asked.get(address);
  asked.delete(address);
  return ahead ?? fetch(address, { cache: "no-store", signal });
}
