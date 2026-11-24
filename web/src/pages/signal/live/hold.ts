// Reading the service again must not move the list under the reader. The feed view on screen keeps
// the stories it holds, in the orders it holds them; a story the service now lists and the view
// does not hold waits behind the new-stories pill; a story the service no longer lists is dropped.
// Every other view, and everything else in the snapshot, is the service's newest answer as delivered.
//
// A ranked view holds its whole window in both orders and says how many the page draws first
// (`shown`); which order is on screen and whether Show older was pressed is the page's own state.
// So both orders are held whole, as first read: whatever part of either the reader has drawn stays
// as it is. A story that rises in rank between reads therefore stays where it was in the held Top
// order (it does not jump into the drawn part, nor wait behind the pill, which says "new"); the
// service's new ranking is drawn when the view is opened again. Dropping a story can only bring the
// next one of that order up at the foot of the drawn part.
// Pure: no request, no clock, no state.
import { readSlice, type SignalFeedView, type SignalScene, type SignalSlice } from "../slice";

/** The live service delivers one scene, and the home route names it. */
export const LIVE_SCENE = "main";

/** A feed view of the live scene: one of the named views, or a topic's. */
export type ViewAt = { list: "views" | "topics"; id: string };
/** A view as the reader has it on screen, kept across reads. */
export type Held = { at: ViewAt; view: SignalFeedView };
type Feed = SignalScene["snapshot"]["feed"];
export type FeedError = NonNullable<Feed["error"]>;

/** The view a matched address of the live scene draws; null on a page that draws no feed view. */
export function viewAtOf(params: Record<string, string>): ViewAt | null {
  if (params["view"] !== undefined) return { list: "views", id: params["view"] };
  if (params["topic"] !== undefined) return { list: "topics", id: params["topic"] };
  return null;
}

function newStories(count: number): string {
  return count === 1 ? "1 new story" : `${String(count)} new stories`;
}

/**
 * The view to draw after a read: `shown` is what the reader has, `fresh` what the service now lists.
 * Where nothing drawn is still listed there is no list to hold, and the view is `fresh` as delivered.
 */
export function holdView(shown: SignalFeedView, fresh: SignalFeedView): SignalFeedView {
  const listed = [...(fresh.waiting?.ids ?? []), ...fresh.latest, ...fresh.older];
  const still = new Set(listed);
  const kept = (ids: string[]) => ids.filter((id) => still.has(id));
  const top = kept(shown.top);
  if (top.length === 0) return fresh;
  const drawn = new Set([...shown.top, ...shown.older]);
  const ids = listed.filter((id) => !drawn.has(id));
  return {
    top,
    latest: kept(shown.latest),
    waiting: ids.length === 0 ? null : { label: newStories(ids.length), ids },
    older: kept(shown.older),
    ...drawnFirst(shown.shown),
  };
}

/** The view's count of entries drawn first, where it holds one. */
function drawnFirst(shown: number | undefined): { shown?: number } {
  return shown === undefined ? {} : { shown };
}

/**
 * The view once Show is pressed on its pill: the waiting stories lead both orders, as the page draws
 * them, and where the view counts what is drawn first they are drawn as well as what was, so
 * nothing the reader had leaves the foot of the list.
 */
function revealView(view: SignalFeedView): SignalFeedView {
  if (view.waiting === null) return view;
  const { ids } = view.waiting;
  return {
    top: [...ids, ...view.top],
    latest: [...ids, ...view.latest],
    waiting: null,
    older: view.older,
    ...drawnFirst(view.shown === undefined ? undefined : view.shown + ids.length),
  };
}

/** The slice with the live scene's feed changed. */
function withFeed(slice: SignalSlice, change: (feed: Feed) => Feed): SignalSlice {
  const edit = (scene: SignalScene): SignalScene =>
    scene.id === LIVE_SCENE
      ? { ...scene, snapshot: { ...scene.snapshot, feed: change(scene.snapshot.feed) } }
      : scene;
  const [first, ...rest] = slice.scenes;
  return { scenes: [edit(first), ...rest.map(edit)] };
}

/** The view the slice holds at `at`; an address may name a view or topic the slice does not hold. */
function viewAt(slice: SignalSlice, at: ViewAt): SignalFeedView | undefined {
  const feed = slice.scenes.find((scene) => scene.id === LIVE_SCENE)?.snapshot.feed;
  if (feed === undefined) return undefined;
  const views: Record<string, SignalFeedView> = feed[at.list];
  return Object.hasOwn(views, at.id) ? views[at.id] : undefined;
}

function withView(slice: SignalSlice, at: ViewAt, view: SignalFeedView): SignalSlice {
  return withFeed(slice, (feed) =>
    at.list === "views"
      ? { ...feed, views: { ...feed.views, [at.id]: view } }
      : { ...feed, topics: { ...feed.topics, [at.id]: view } },
  );
}

/** The slice saying its last read failed: the feed pages draw the alert, with the stories still there. */
export function withFeedError(slice: SignalSlice, error: FeedError | null): SignalSlice {
  return withFeed(slice, (feed) => ({ ...feed, error }));
}

const sameView = (a: ViewAt, b: ViewAt) => a.list === b.list && a.id === b.id;

/** What the page at `at` draws: the newest read, with the view on screen as the reader has it. */
export function shownSlice(fresh: SignalSlice, held: Held | null, at: ViewAt | null): SignalSlice {
  if (held === null || at === null || !sameView(held.at, at)) return fresh;
  return viewAt(fresh, at) === undefined ? fresh : withView(fresh, at, held.view);
}

/**
 * What to hold once `fresh` has been read while the page at `at` drew `before` with `held`. Null
 * holds nothing: no feed view is on screen, or the held view would break one of the reader's rules
 * (a delivered count beside a list it no longer matches), and the page then draws `fresh` as delivered.
 */
export function holdAfterRead(
  before: SignalSlice | null,
  held: Held | null,
  fresh: SignalSlice,
  at: ViewAt | null,
): Held | null {
  if (before === null || at === null) return null;
  const shown = viewAt(shownSlice(before, held, at), at);
  const arrived = viewAt(fresh, at);
  if (shown === undefined || arrived === undefined) return null;
  const next: Held = { at, view: holdView(shown, arrived) };
  return readSlice(shownSlice(fresh, next, at)).kind === "ok" ? next : null;
}

/** What to hold once the reader presses Show on the pill of the view at `at`. */
export function holdAfterReveal(
  fresh: SignalSlice | null,
  held: Held | null,
  at: ViewAt | null,
): Held | null {
  if (fresh === null || at === null) return held;
  const view = viewAt(shownSlice(fresh, held, at), at);
  return view === undefined ? held : { at, view: revealView(view) };
}
