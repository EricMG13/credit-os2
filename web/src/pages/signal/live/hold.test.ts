// The merge of a re-read into what the reader has on screen. Expected lists and labels are written
// out by hand; none is taken from the functions under test.
import { readSlice, type SignalFeedView, type SignalSlice } from "../slice";
import {
  holdAfterRead,
  holdAfterReveal,
  holdView,
  shownSlice,
  viewAtOf,
  withFeedError,
  type ViewAt,
} from "./hold";
import { arrival, sampleWith, storyLike, unsaved } from "./test-helpers";

function view(
  top: string[],
  older: string[] = [],
  waiting: SignalFeedView["waiting"] = null,
): SignalFeedView {
  return { top, latest: top, waiting, older };
}

/** The slice as the reader accepts it; a slice it refuses fails the test with the reader's reason. */
function read(source: unknown): SignalSlice {
  const got = readSlice(source);
  if (got.kind !== "ok") throw new Error(got.kind === "invalid" ? got.reason : "no slice");
  return got.data;
}

function mainView(slice: SignalSlice, at: ViewAt): SignalFeedView | undefined {
  const feed = slice.scenes[0].snapshot.feed;
  const views: Record<string, SignalFeedView> = feed[at.list];
  return views[at.id];
}

const LATEST: ViewAt = { list: "views", id: "latest" };
const SAVED: ViewAt = { list: "views", id: "saved" };
const TELECOMS: ViewAt = { list: "topics", id: "2" };

/** The sample with one more story, newest, in Latest and in the Telecoms topic. */
const withArrival = () => sampleWith(arrival("7", "Tessaly Telecom names a new finance chief"));

describe("holdView", () => {
  it("changes nothing when the service lists what is drawn", () => {
    expect(holdView(view(["2", "1"], ["3"]), view(["2", "1"], ["3"]))).toEqual(
      view(["2", "1"], ["3"]),
    );
  });

  it("puts stories not yet drawn behind the pill, newest first, and counts them in its label", () => {
    expect(holdView(view(["2", "1", "3"]), view(["9", "8", "2", "1", "3"]))).toEqual(
      view(["2", "1", "3"], [], { label: "2 new stories", ids: ["9", "8"] }),
    );
    expect(holdView(view(["2", "1"]), view(["9", "2", "1"])).waiting).toEqual({
      label: "1 new story",
      ids: ["9"],
    });
  });

  it("keeps each order as drawn, whatever order the service now gives", () => {
    const shown = { top: ["1", "2", "3"], latest: ["3", "2", "1"], waiting: null, older: [] };
    const fresh = {
      top: ["2", "7", "3", "1"],
      latest: ["7", "1", "2", "3"],
      waiting: null,
      older: [],
    };
    expect(holdView(shown, fresh)).toEqual({
      top: ["1", "2", "3"],
      latest: ["3", "2", "1"],
      waiting: { label: "1 new story", ids: ["7"] },
      older: [],
    });
  });

  it("keeps a drawn story in its list when the service has moved it to the older ones", () => {
    expect(holdView(view(["a", "b"], ["c"]), view(["n", "a"], ["b", "c"]))).toEqual(
      view(["a", "b"], ["c"], { label: "1 new story", ids: ["n"] }),
    );
  });

  it("drops a story the service no longer lists", () => {
    expect(holdView(view(["a", "b", "c"], ["d", "e"]), view(["a", "c"], ["e"]))).toEqual(
      view(["a", "c"], ["e"]),
    );
  });

  it("keeps stories still waiting behind the pill and adds the later ones ahead of them", () => {
    const shown = view(["a"], [], { label: "1 new story", ids: ["n1"] });
    expect(holdView(shown, view(["n2", "n1", "a"]))).toEqual(
      view(["a"], [], { label: "2 new stories", ids: ["n2", "n1"] }),
    );
  });

  it("puts a story that arrives among the older ones behind the pill too", () => {
    expect(holdView(view(["a"], ["c"]), view(["a"], ["b", "c"]))).toEqual(
      view(["a"], ["c"], { label: "1 new story", ids: ["b"] }),
    );
  });

  it("keeps the ids a delivered pill already holds", () => {
    const fresh = view(["a"], [], { label: "3 new stories", ids: ["x", "y", "z"] });
    expect(holdView(view(["a"]), fresh)).toEqual(
      view(["a"], [], { label: "3 new stories", ids: ["x", "y", "z"] }),
    );
  });

  it("is the service's view as delivered when nothing drawn is still listed", () => {
    const fresh = view(["n1", "n2"], ["n3"]);
    expect(holdView(view([]), fresh)).toBe(fresh);
    expect(holdView(view(["a", "b"]), fresh)).toBe(fresh);
  });

  it("never repeats an id across the lists it returns", () => {
    const held = holdView(
      view(["a", "b"], ["c"], { label: "1 new story", ids: ["w"] }),
      view(["n", "w", "b"], ["a", "c", "o"]),
    );
    const ids = [...held.top, ...held.older, ...(held.waiting?.ids ?? [])];
    expect(ids).toEqual(["a", "b", "c", "n", "w", "o"]);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...held.latest].sort()).toEqual([...held.top].sort());
  });
});

describe("a read while a feed view is on screen", () => {
  it("holds that view only, and the reader accepts the result", () => {
    const before = read(sampleWith());
    const fresh = read(withArrival());
    const held = holdAfterRead(before, null, fresh, LATEST);
    expect(held).toEqual({
      at: LATEST,
      view: view(["2", "1", "3", "5", "4", "6"], [], { label: "1 new story", ids: ["7"] }),
    });
    const shown = shownSlice(fresh, held, LATEST);
    expect(readSlice(shown).kind).toBe("ok");
    expect(mainView(shown, LATEST)?.top).toEqual(["2", "1", "3", "5", "4", "6"]);
    // The topic's view is not on screen: it is the service's, with the new story in its list.
    expect(mainView(shown, TELECOMS)).toEqual(view(["7", "2", "4"]));
    expect(shown.scenes[0].snapshot.feed.stories.map((story) => story.id)).toContain("7");
  });

  it("holds nothing on a page that draws no feed view, or before a first read", () => {
    const fresh = read(withArrival());
    expect(holdAfterRead(read(sampleWith()), null, fresh, null)).toBeNull();
    expect(holdAfterRead(null, null, fresh, LATEST)).toBeNull();
  });

  it("holds nothing at an address whose view the service does not list", () => {
    const before = read(sampleWith());
    const gone: ViewAt = { list: "topics", id: "99" };
    expect(holdAfterRead(before, null, read(withArrival()), gone)).toBeNull();
    expect(shownSlice(before, { at: gone, view: view(["2"]) }, gone)).toBe(before);
  });

  it("draws another view as the service delivers it, whatever is held", () => {
    const fresh = read(withArrival());
    const held = { at: LATEST, view: view(["2", "1"]) };
    expect(shownSlice(fresh, held, TELECOMS)).toBe(fresh);
    expect(shownSlice(fresh, held, null)).toBe(fresh);
  });

  it("fills a view that drew nothing: the Saved view after a first save elsewhere", () => {
    const before = read(sampleWith(unsaved));
    const fresh = read(sampleWith());
    const held = holdAfterRead(before, null, fresh, SAVED);
    expect(held?.view).toEqual(view(["5"]));
    expect(readSlice(shownSlice(fresh, held, SAVED)).kind).toBe("ok");
  });

  it("drops an unsaved story from the Saved view on screen, as the reader's rules require", () => {
    const before = read(sampleWith());
    const fresh = read(sampleWith(unsaved));
    const held = holdAfterRead(before, null, fresh, SAVED);
    expect(held?.view).toEqual(view([]));
    expect(readSlice(shownSlice(fresh, held, SAVED)).kind).toBe("ok");
  });

  it("holds nothing when the held list would sit beside a delivered count it contradicts", () => {
    const before = read(sampleWith());
    // The service now lists the topic's stories as older ones only, and counts none.
    const fresh = read(
      sampleWith((s) => {
        s.feed.topics["2"] = { top: [], latest: [], waiting: null, older: ["2", "4"] };
        const telecoms = s.channels.topics[1];
        if (telecoms !== undefined) telecoms.count = "0";
      }),
    );
    expect(holdAfterRead(before, null, fresh, TELECOMS)).toBeNull();
  });

  it("keeps a held view across reads until its pill is shown, then starts a new pill", () => {
    const first = read(sampleWith());
    const second = read(withArrival());
    const held = holdAfterRead(first, null, second, LATEST);
    const shown = holdAfterReveal(second, held, LATEST);
    expect(shown?.view).toEqual(view(["7", "2", "1", "3", "5", "4", "6"]));
    expect(readSlice(shownSlice(second, shown, LATEST)).kind).toBe("ok");
    const third = read(
      sampleWith((s) => {
        arrival("7", "Tessaly Telecom names a new finance chief")(s);
        s.feed.stories.unshift(storyLike("8", "Halvorsen Marine sells two vessels"));
        s.feed.views.latest.top.unshift("8");
        s.feed.views.latest.latest.unshift("8");
      }),
    );
    expect(holdAfterRead(second, shown, third, LATEST)?.view).toEqual(
      view(["7", "2", "1", "3", "5", "4", "6"], [], { label: "1 new story", ids: ["8"] }),
    );
  });

  it("reveals nothing where there is no slice, no view or no pill", () => {
    const fresh = read(sampleWith());
    expect(holdAfterReveal(null, null, LATEST)).toBeNull();
    expect(holdAfterReveal(fresh, null, null)).toBeNull();
    expect(holdAfterReveal(fresh, null, LATEST)?.view).toEqual(
      view(["2", "1", "3", "5", "4", "6"]),
    );
  });

  it("holds a topic whose id is a prototype's name as an ordinary entry", () => {
    const named = (text: string) => JSON.parse(text.replaceAll('"2"', '"__proto__"')) as unknown;
    // Story ids are renamed with the topic's; the two stay consistent.
    const before = read(named(JSON.stringify(sampleWith())));
    const fresh = read(named(JSON.stringify(withArrival())));
    const at: ViewAt = { list: "topics", id: "__proto__" };
    const held = holdAfterRead(before, null, fresh, at);
    expect(held?.view).toEqual(view(["__proto__", "4"], [], { label: "1 new story", ids: ["7"] }));
    const shown = shownSlice(fresh, held, at);
    expect(readSlice(shown).kind).toBe("ok");
    expect(Object.hasOwn(shown.scenes[0].snapshot.feed.topics, "__proto__")).toBe(true);
    expect(({} as Record<string, unknown>)["top"]).toBeUndefined();
  });
});

describe("the feed's own error", () => {
  it("is set and cleared on the live scene, and the reader accepts both", () => {
    const fresh = read(sampleWith());
    const failed = withFeedError(fresh, "unreachable");
    expect(failed.scenes[0].snapshot.feed.error).toBe("unreachable");
    expect(failed.scenes[0].snapshot.feed.stories).toBe(fresh.scenes[0].snapshot.feed.stories);
    expect(readSlice(failed).kind).toBe("ok");
    expect(withFeedError(failed, null).scenes[0].snapshot.feed.error).toBeNull();
  });
});

describe("viewAtOf", () => {
  it("names the view a feed or topic address draws, and nothing on any other page", () => {
    expect(viewAtOf({ scene: "main", view: "saved" })).toEqual(SAVED);
    expect(viewAtOf({ scene: "main", topic: "2" })).toEqual(TELECOMS);
    expect(viewAtOf({ scene: "main", section: "topics" })).toBeNull();
  });
});
