// The contract with the Signal service: `snapshot.sample.json` is written by the service's own
// snapshot builder from a seeded store (tests/test_signal_snapshot.py holds the file to it), and the
// slice reader the screens use must accept it as it is. A failure here names the first member the
// two sides disagree on; the reader is not loosened to pass it.
import { readSlice } from "../slice";
import sample from "./snapshot.sample.json";

describe("the service's sample snapshot", () => {
  it("is a slice the reader accepts", () => {
    expect(readSlice(sample)).toMatchObject({ kind: "ok" });
  });

  it("holds the one scene the live page draws", () => {
    expect(sample.scenes.map((scene) => scene.id)).toEqual(["main"]);
  });

  it("delivers empty what the service does not have yet", () => {
    const [main] = sample.scenes;
    if (main === undefined) throw new Error("the sample has a scene");
    const { channels, feed, groups, threads, digests, settings } = main.snapshot;
    expect([channels.groups, channels.digests, feed.digests, groups, threads, digests]).toEqual([
      [],
      [],
      [],
      [],
      [],
      [],
    ]);
    expect([settings.groups, settings.rules, settings.notifications.events]).toEqual([[], [], []]);
    expect(settings.ai).toMatchObject({ state: "off", spend: null, parts: [] });
    for (const story of feed.stories) {
      expect(story).toMatchObject({
        ai: null,
        strength: null,
        sharedBy: null,
        commentCount: null,
        threadRef: null,
        stage: null,
        ratingMoves: [],
      });
    }
  });

  it("is ready, with no error and no pill of its own", () => {
    const feed = sample.scenes[0]?.snapshot.feed;
    expect(feed).toMatchObject({ status: "ready", error: null });
    const views = [...Object.values(feed?.views ?? {}), ...Object.values(feed?.topics ?? {})];
    expect(views.map((view) => view.waiting)).toEqual([null, null, null, null, null, null]);
  });
});
