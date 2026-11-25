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
import {
  arrival,
  format2With,
  sampleWith,
  storyLike,
  unsaved,
  type Snapshot,
} from "./test-helpers";

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
  const views: Record<string, SignalFeedView> = feed[at.list] ?? {};
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

/** A ranked view as the service delivers it: its whole window in both orders, and how many are drawn first. */
function ranked(
  top: string[],
  latest: string[],
  shown: number,
  waiting: SignalFeedView["waiting"] = null,
): SignalFeedView {
  return { top, latest, waiting, older: [], shown };
}

describe("a ranked view that holds its whole window", () => {
  it("keeps a story that rose in rank where it was: it does not jump into the drawn part, nor wait as new", () => {
    // The page draws the first two of the order on screen. Story 4 was fifth in Top; the service now ranks it first.
    const held = ranked(["5", "1", "2", "3", "4"], ["5", "4", "3", "2", "1"], 2);
    const fresh = ranked(["4", "5", "1", "2", "3"], ["5", "4", "3", "2", "1"], 2);
    expect(holdView(held, fresh)).toEqual(
      ranked(["5", "1", "2", "3", "4"], ["5", "4", "3", "2", "1"], 2),
    );
  });

  it("keeps a story that fell in rank where it was, too", () => {
    const held = ranked(["5", "1", "2"], ["5", "2", "1"], 2);
    const fresh = ranked(["1", "2", "5"], ["5", "2", "1"], 2);
    expect(holdView(held, fresh)).toEqual(ranked(["5", "1", "2"], ["5", "2", "1"], 2));
  });

  it("puts a story the view did not hold behind the pill, wherever the service ranks it", () => {
    const held = ranked(["5", "1", "2"], ["5", "2", "1"], 2);
    const fresh = ranked(["9", "5", "1", "8", "2"], ["9", "8", "5", "2", "1"], 2);
    expect(holdView(held, fresh)).toEqual(
      ranked(["5", "1", "2"], ["5", "2", "1"], 2, { label: "2 new stories", ids: ["9", "8"] }),
    );
  });

  it("drops a story the service no longer lists from both orders and keeps the count", () => {
    const held = ranked(["5", "1", "2", "3"], ["5", "3", "2", "1"], 2);
    const fresh = ranked(["5", "2", "3"], ["5", "3", "2"], 2);
    expect(holdView(held, fresh)).toEqual(ranked(["5", "2", "3"], ["5", "3", "2"], 2));
  });

  it("holds the count the reader's view has, whatever the service now says", () => {
    const held = ranked(["5", "1"], ["5", "1"], 4);
    expect(holdView(held, ranked(["5", "1"], ["5", "1"], 30)).shown).toBe(4);
    // A view read before the service counted keeps drawing its whole order.
    expect("shown" in holdView(view(["5", "1"]), ranked(["5", "1"], ["5", "1"], 30))).toBe(false);
  });

  /** The sample with its Telecoms topic (stories 2 and 4) ranked: the first one is drawn. */
  const rankedTopic = (edit: (snapshot: Parameters<typeof unsaved>[0]) => void = () => undefined) =>
    sampleWith((snapshot) => {
      edit(snapshot);
      const topic = snapshot.feed.topics["2"];
      if (topic === undefined) throw new Error("the sample has the Telecoms topic");
      topic.shown = 1;
    });

  it("is held across a read with its count, and the reader accepts the result", () => {
    const before = read(rankedTopic());
    const fresh = read(
      rankedTopic((snapshot) => {
        arrival("7", "Tessaly Telecom names a new finance chief")(snapshot);
        // The service also ranks the review above the sale now.
        const topic = snapshot.feed.topics["2"];
        if (topic !== undefined) topic.top = ["4", "7", "2"];
      }),
    );
    expect(mainView(fresh, TELECOMS)).toEqual(ranked(["4", "7", "2"], ["7", "2", "4"], 1));
    const held = holdAfterRead(before, null, fresh, TELECOMS);
    expect(held?.view).toEqual(
      ranked(["2", "4"], ["2", "4"], 1, { label: "1 new story", ids: ["7"] }),
    );
    expect(readSlice(shownSlice(fresh, held, TELECOMS)).kind).toBe("ok");
    // Show draws the new story as well as the one that was drawn: the count grows by it.
    const shown = holdAfterReveal(fresh, held, TELECOMS);
    expect(shown?.view).toEqual(ranked(["7", "2", "4"], ["7", "2", "4"], 2));
    expect(readSlice(shownSlice(fresh, shown, TELECOMS)).kind).toBe("ok");
  });

  it("leaves a view with no count without one when its pill is shown", () => {
    const fresh = read(withArrival());
    const held = holdAfterRead(read(sampleWith()), null, fresh, LATEST);
    const shown = holdAfterReveal(fresh, held, LATEST);
    expect(shown === null || "shown" in shown.view).toBe(false);
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
  it("names the view a feed, topic or issuer address draws, and nothing on any other page", () => {
    expect(viewAtOf({ scene: "main", view: "saved" })).toEqual(SAVED);
    expect(viewAtOf({ scene: "main", topic: "2" })).toEqual(TELECOMS);
    expect(viewAtOf({ scene: "main", issuer: "1" })).toEqual(TESSALY);
    expect(viewAtOf({ scene: "main", section: "topics" })).toBeNull();
  });
});

// The format-2 sample: Tessaly Telecom is issuer 1 (stories 7, 2, 4, 8, 9, newest first, drawn 30
// at a time) and also topic 2's subject; Corvane Packaging is issuer 2 (story 1).
const TESSALY: ViewAt = { list: "issuers", id: "1" };
const CORVANE: ViewAt = { list: "issuers", id: "2" };

/** One more story about Tessaly Telecom, newest: in Latest and in the issuer's view, whose count follows. */
function tessalyArrival(snapshot: Snapshot) {
  const like = snapshot.feed.stories.find((story) => story.id === "2");
  if (like === undefined) throw new Error("the sample holds story 2");
  snapshot.feed.stories.unshift({ ...like, id: "11", headline: "Tessaly Telecom names a chief" });
  for (const held of [snapshot.feed.views.latest, snapshot.feed.issuers?.["1"]]) {
    held?.top.unshift("11");
    held?.latest.unshift("11");
  }
  const channel = snapshot.channels.issuers?.find((issuer) => issuer.id === "1");
  if (channel !== undefined) channel.count = "6";
}

describe("an issuer's view on screen", () => {
  it("is held as a topic's is: the story that arrives waits behind the pill, and the reader accepts it", () => {
    const before = read(format2With());
    const fresh = read(format2With(tessalyArrival));
    expect(mainView(fresh, TESSALY)?.latest).toEqual(["11", "7", "2", "4", "8", "9"]);
    const held = holdAfterRead(before, null, fresh, TESSALY);
    expect(held).toEqual({
      at: TESSALY,
      view: {
        top: ["7", "2", "4", "8", "9"],
        latest: ["7", "2", "4", "8", "9"],
        waiting: { label: "1 new story", ids: ["11"] },
        older: [],
        shown: 30,
      },
    });
    const shown = shownSlice(fresh, held, TESSALY);
    expect(readSlice(shown).kind).toBe("ok");
    expect(mainView(shown, TESSALY)?.top).toEqual(["7", "2", "4", "8", "9"]);
    // Every other view is the service's: Latest lists the new story, and so does the count.
    expect(mainView(shown, LATEST)?.latest[0]).toBe("11");
    expect(shown.scenes[0].snapshot.channels.issuers?.[2]?.count).toBe("6");
    // Topic 2 has the same subject and its own view: nothing of the issuer's is held against it.
    expect(shownSlice(fresh, held, TELECOMS)).toBe(fresh);
    expect(shownSlice(fresh, held, CORVANE)).toBe(fresh);
  });

  it("joins the list once the pill is shown, drawn as well as what was", () => {
    const fresh = read(format2With(tessalyArrival));
    const held = holdAfterRead(read(format2With()), null, fresh, TESSALY);
    const revealed = holdAfterReveal(fresh, held, TESSALY);
    expect(revealed?.view).toEqual({
      top: ["11", "7", "2", "4", "8", "9"],
      latest: ["11", "7", "2", "4", "8", "9"],
      waiting: null,
      older: [],
      shown: 31,
    });
    expect(readSlice(shownSlice(fresh, revealed, TESSALY)).kind).toBe("ok");
  });

  it("drops a story the service no longer lists for the issuer", () => {
    const fresh = read(
      format2With((snapshot) => {
        const view = snapshot.feed.issuers?.["1"];
        if (view === undefined) throw new Error("the sample holds issuer 1's view");
        view.top = view.top.filter((id) => id !== "4");
        view.latest = view.latest.filter((id) => id !== "4");
      }),
    );
    const held = holdAfterRead(read(format2With()), null, fresh, TESSALY);
    expect(held?.view.top).toEqual(["7", "2", "8", "9"]);
    expect(held?.view.waiting).toBeNull();
  });

  it("holds nothing when the held list would sit beside a delivered count it contradicts", () => {
    // The service now lists the issuer's story as an older one only, and counts none.
    const fresh = read(
      format2With((snapshot) => {
        const channel = snapshot.channels.issuers?.find((issuer) => issuer.id === "2");
        if (channel !== undefined) channel.count = "0";
        if (snapshot.feed.issuers !== null) snapshot.feed.issuers["2"] = view([], ["1"]);
      }),
    );
    expect(holdAfterRead(read(format2With()), null, fresh, CORVANE)).toBeNull();
  });

  it("holds nothing at an issuer the service does not list, or where it delivers no issuers", () => {
    const before = read(format2With());
    const gone: ViewAt = { list: "issuers", id: "99" };
    expect(holdAfterRead(before, null, before, gone)).toBeNull();
    expect(shownSlice(before, { at: gone, view: view(["2"]) }, gone)).toBe(before);
    // The earlier sample says nothing of issuers: an issuer's address there draws no view.
    const plain = read(sampleWith());
    expect(holdAfterRead(plain, null, plain, TESSALY)).toBeNull();
    expect(shownSlice(plain, { at: TESSALY, view: view(["2"]) }, TESSALY)).toBe(plain);
    expect(holdAfterReveal(plain, null, TESSALY)).toBeNull();
  });

  it("holds an issuer whose id is a prototype's name as an ordinary entry", () => {
    const named = (snapshot: Snapshot) => {
      const { channels, feed, settings } = snapshot;
      for (const list of [channels.issuers, settings.issuers]) {
        const corvane = list?.find((issuer) => issuer.id === "2");
        if (corvane !== undefined) corvane.id = "constructor";
      }
      if (feed.issuers === null) throw new Error("the sample holds issuer views");
      feed.issuers["constructor"] = feed.issuers["2"] ?? view([]);
      Reflect.deleteProperty(feed.issuers, "2");
      for (const story of feed.stories) {
        for (const issuer of story.issuers) if (issuer.id === "2") issuer.id = "constructor";
      }
    };
    const at: ViewAt = { list: "issuers", id: "constructor" };
    const before = read(format2With(named));
    expect(mainView(before, at)?.top).toEqual(["1"]);
    const held = holdAfterRead(before, null, before, at);
    expect(held?.view.top).toEqual(["1"]);
    expect(readSlice(shownSlice(before, held, at)).kind).toBe("ok");
  });
});
