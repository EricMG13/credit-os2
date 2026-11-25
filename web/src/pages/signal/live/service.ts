// The Signal service as the connected app reaches it: same-origin paths under /signal/api, which
// the local server forwards. The browser never calls the Signal service itself.
import { postJson, request, RequestError } from "../../connected/api";
import { errorText, isUnreachable } from "../../connected/useResource";
import type { SignalAnswer, SignalWrite } from "../actions";
import { readSlice, type SignalSlice } from "../slice";
import type { FeedError } from "./hold";

const API = "/signal/api";
/** The local server gives Signal ten seconds; an answer later than this is not coming. */
export const TIMEOUT_MS = 20_000;

class TimedOut extends Error {}

/** One request, given up when the page goes (`stop`) or when no answer comes in time. */
async function ask(path: string, init: RequestInit, stop: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const cancel = () => {
    controller.abort();
  };
  if (stop.aborted) cancel();
  stop.addEventListener("abort", cancel);
  const timer = setTimeout(cancel, TIMEOUT_MS);
  try {
    return await request<unknown>(`${API}${path}`, { ...init, signal: controller.signal });
  } catch (failure) {
    throw controller.signal.aborted && !stop.aborted ? new TimedOut() : failure;
  } finally {
    clearTimeout(timer);
    stop.removeEventListener("abort", cancel);
  }
}

/** The service's own sentence where it sent one, as given. */
function sentence(failure: unknown): string {
  return failure instanceof TimedOut
    ? "Signal did not answer in time. Try again."
    : errorText(failure);
}

/** 502 is the local server saying Signal did not answer it; a reply that is not an error yet holds no slice is unreadable. */
function kindOf(failure: unknown): FeedError {
  if (failure instanceof TimedOut || isUnreachable(failure)) return "unreachable";
  if (!(failure instanceof RequestError)) return "request";
  if (failure.status === 502) return "unreachable";
  return failure.status < 400 ? "unreadable" : "request";
}

/** Why a read gave no slice: the sentence to show and, for a slice the reader refused, its reason. */
export type Failure = { kind: FeedError; text: string; reason: string | null };
type Read = { ok: true; slice: SignalSlice; asOf: string | null } | { ok: false; failure: Failure };

const UNREADABLE = "Signal sent an answer this page could not read.";

/** The service's build time, beside the snapshot in the reply; a missing or non-string value is absent. */
function asOfOf(reply: unknown): string | null {
  const value = (reply as { asOf?: unknown } | null)?.asOf;
  return typeof value === "string" ? value : null;
}

/**
 * The snapshot format this page reads: the service then delivers filings, market posts and the
 * issuer watchlist, which it keeps from a page that does not ask (an older reader refuses them).
 */
const FORMAT = "format=2";

/**
 * `query` is what the address on screen asks the snapshot to carry in full (`topic=<id>` or
 * `issuer=<id>`: its older stories; `thread=<id>`: that thread's comments), or "" for the plain
 * snapshot.
 */
export async function readSnapshot(stop: AbortSignal, query: string): Promise<Read> {
  try {
    const focus = query === "" ? "" : `&${query}`;
    const reply = await ask(`/snapshot?${FORMAT}${focus}`, {}, stop);
    const got = readSlice(reply);
    if (got.kind === "ok") return { ok: true, slice: got.data, asOf: asOfOf(reply) };
    const reason = got.kind === "invalid" ? got.reason : null;
    return { ok: false, failure: { kind: "unreadable", text: UNREADABLE, reason } };
  } catch (failure) {
    return { ok: false, failure: { kind: kindOf(failure), text: sentence(failure), reason: null } };
  }
}

/** The write's answer: the service's reply, or the sentence saying why it was not accepted. */
export async function sendWrite(request: SignalWrite, stop: AbortSignal): Promise<SignalAnswer> {
  const init = request.body === undefined ? { method: request.method } : postJson(request.body);
  try {
    return { refusal: null, reply: await ask(request.path, init, stop) };
  } catch (failure) {
    return { refusal: sentence(failure), reply: null };
  }
}
