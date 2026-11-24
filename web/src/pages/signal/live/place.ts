// Where the live page is: the connected app draws it at the path /signal and it routes on the URL
// hash with the Signal routes, so every address the screens write (`#/signal/main/…`) works there.
import { matchRoute } from "../../route-match";
import { signalRoutes } from "../routes";
import type { SignalSlice } from "../slice";
import { LIVE_SCENE, viewAtOf, type ViewAt } from "./hold";

const HOME = signalRoutes.find((route) => route.home !== undefined)?.home ?? "";
export const HOME_HREF = `#${HOME}`;

type Place = { matched: ReturnType<typeof matchRoute>; at: ViewAt | null };

/**
 * The route a hash names and the feed view it draws. No hash, or the group's bare address, is the
 * group's home. The service delivers the one scene, so an address in any other matches nothing.
 */
export function placeOf(hash: string): Place {
  const bare = ["", "/signal"].includes(hash.endsWith("/") ? hash.slice(0, -1) : hash);
  const matched = matchRoute(bare ? HOME : hash, signalRoutes);
  if (matched === null || matched.params["scene"] !== LIVE_SCENE)
    return { matched: null, at: null };
  return { matched, at: viewAtOf(matched.params) };
}

/** The feed view on screen now, read from the address as the page reads it. */
export function viewNow(): ViewAt | null {
  return placeOf(window.location.hash.slice(1)).at;
}

/**
 * What the snapshot for this address must carry in full, as the query of its request: on a topic's
 * page that topic's older stories, in a thread's panel that thread's comments (the service leaves
 * both out of the plain snapshot to keep it small). Never both, and "" on any other page. The id is
 * sent only when the snapshot in hand lists it, so nothing typed into an address reaches the query.
 */
export function snapshotQuery(hash: string, slice: SignalSlice | null): string {
  const params = placeOf(hash).matched?.params;
  const snapshot = slice?.scenes.find((scene) => scene.id === LIVE_SCENE)?.snapshot;
  const search = new URLSearchParams();
  if (params === undefined || snapshot === undefined) return "";
  const { thread, topic, group } = params;
  if (thread !== undefined) {
    if (snapshot.threads.some((one) => one.id === thread && one.groupId === group)) {
      search.set("thread", thread);
    }
  } else if (topic !== undefined && snapshot.channels.topics.some((one) => one.id === topic)) {
    search.set("topic", topic);
  }
  return search.toString();
}
