// Shared set-up for the live Signal tests: a snapshot the service wrote and copies of it, a stand-in
// for the local server that records every request, and the page drawn at a hash. Test-only: no
// test's expected value lives here.
//
// The snapshot is fixtures/signal-live.json: the service's own sample as its snapshot builder wrote
// it when the service held users, sources, stories, topics, follows and saves only (commit 8ea9a5b).
// The tests that name headlines and counts read this fixed copy, so they do not move when the
// service's sample grows; sample.test.ts and screens.test.tsx read the service's current sample.
import { act, render, within } from "@testing-library/react";
import type { SignalScene, SignalSlice, SignalStory } from "../slice";
import sample from "../../../../fixtures/signal-live.json";
import current from "./snapshot.sample.json";
import format2 from "./snapshot.format2.sample.json";
import { SignalLive } from "./SignalLive";

export type Snapshot = SignalScene["snapshot"];

/**
 * A copy of the snapshot, changed by `edit`. It is typed as the slice it is (hold.test.ts reads it
 * with the reader, which refuses anything else), so the copy's types are the reader's own.
 */
export function sampleWith(edit: (snapshot: Snapshot) => void = () => undefined): SignalSlice {
  const copy = structuredClone(sample) as unknown as SignalSlice;
  edit(copy.scenes[0].snapshot);
  return copy;
}

/** A copy of the service's current sample (groups, threads, digests, rules and events), changed by `edit`. */
export function currentWith(edit: (snapshot: Snapshot) => void = () => undefined): SignalSlice {
  const copy = structuredClone(current) as unknown as SignalSlice;
  edit(copy.scenes[0].snapshot);
  return copy;
}

/**
 * A copy of the service's format-2 sample (the current sample's store with three issuers, the
 * filings of one and a market post, as `?format=2` delivers it to the writer), changed by `edit`.
 */
export function format2With(edit: (snapshot: Snapshot) => void = () => undefined): SignalSlice {
  const copy = structuredClone(format2) as unknown as SignalSlice;
  edit(copy.scenes[0].snapshot);
  return copy;
}

/** A story the sample does not hold: the sample's first with another id and headline. */
export function storyLike(id: string, headline: string): SignalStory {
  const first = sampleWith().scenes[0].snapshot.feed.stories[0];
  if (first === undefined) throw new Error("the sample has a first story");
  return { ...first, id, headline };
}

/** The sample with no saved story: the Saved view lists nothing and its count says so. */
export function unsaved(snapshot: Snapshot) {
  snapshot.channels.savedCount = "0";
  snapshot.feed.views.saved = { top: [], latest: [], waiting: null, older: [] };
  for (const story of snapshot.feed.stories) story.saved = false;
}

/** One more story, newest, in the Latest view and in the Telecoms topic (id "2"), whose count follows. */
export function arrival(id: string, headline: string) {
  return (snapshot: Snapshot) => {
    snapshot.feed.stories.unshift(storyLike(id, headline));
    for (const view of [snapshot.feed.views.latest, snapshot.feed.topics["2"]]) {
      view?.top.unshift(id);
      view?.latest.unshift(id);
    }
    const telecoms = snapshot.channels.topics.find((topic) => topic.id === "2");
    if (telecoms !== undefined) telecoms.count = String(snapshot.feed.topics["2"]?.top.length);
  };
}

type Reply = (init: RequestInit | undefined) => Response | Promise<Response>;

/** A reply that never comes; like the browser's, the request fails once it is given up. */
export const never: Reply = (init) =>
  new Promise((_, reject) => {
    init?.signal?.addEventListener("abort", () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    });
  });

export const refusal =
  (status: number, error: string): Reply =>
  () =>
    Response.json({ error }, { status });

/**
 * The local server: `snapshot` is what a read is answered with now; `replies` answers one
 * "METHOD path" another way; any other request is accepted with an empty object. `calls` lists
 * every request made, `writes()` those that are not snapshot reads.
 */
export function serve(first: unknown = sample) {
  const READ = "GET /signal/api/snapshot";
  const service = {
    snapshot: first,
    calls: [] as string[],
    bodies: [] as unknown[],
    replies: new Map<string, Reply>(),
    /** Snapshot reads, whatever each asked to be carried in full. */
    reads: () => service.calls.filter((call) => call.startsWith(READ)).length,
    writes: () => service.calls.filter((call) => !call.startsWith(READ)),
  };
  const fetch = vi.fn((path: string, init?: RequestInit) => {
    const call = `${init?.method ?? "GET"} ${path}`;
    service.calls.push(call);
    if (init?.body !== undefined) service.bodies.push(init.body);
    const reply = service.replies.get(call);
    if (reply !== undefined) return Promise.resolve(reply(init));
    return Promise.resolve(Response.json(call.startsWith(READ) ? service.snapshot : {}));
  });
  vi.stubGlobal("fetch", fetch);
  return service;
}

/** Draws the live page at `hash` ("" is the bare address /signal). */
export function showLive(hash = "") {
  window.location.hash = hash;
  return render(<SignalLive />);
}

/** Moves to another Signal address, as a link in the page does. */
export async function go(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** The tab is looked at again: the page reads the service again when nothing is already asked. */
export async function lookAgain() {
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Queries within the page region, without the channel list beside it. */
export const content = () => within(document.getElementById("signal-content") as HTMLElement);

afterEach(() => {
  window.location.hash = "";
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
