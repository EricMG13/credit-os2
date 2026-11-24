// The contract with the Signal service: `snapshot.sample.json` is written by the service's own
// snapshot builder from a seeded store (tests/test_signal_snapshot.py holds the file to it), and the
// slice reader the screens use must accept it as it is. A failure here names the first member the
// two sides disagree on; the reader is not loosened to pass it.
import feedOnly from "../../../../fixtures/signal-live.json";
import { readSlice } from "../slice";
import sample from "./snapshot.sample.json";

describe("the service's sample snapshot", () => {
  it("is a slice the reader accepts", () => {
    expect(readSlice(sample)).toEqual({ kind: "ok", data: expect.anything() as unknown });
  });

  it("holds the one scene the live page draws", () => {
    expect(sample.scenes.map((scene) => scene.id)).toEqual(["main"]);
  });

  it("is ready, with no error and no pill of its own", () => {
    const feed = sample.scenes[0]?.snapshot.feed;
    expect(feed).toMatchObject({ status: "ready", error: null });
    const views = [...Object.values(feed?.views ?? {}), ...Object.values(feed?.topics ?? {})];
    expect(views.length).toBeGreaterThan(3);
    expect(views.filter((view) => view.waiting !== null)).toEqual([]);
  });
});

describe("the earlier sample the detailed tests read", () => {
  it("is a slice the reader accepts too", () => {
    expect(readSlice(feedOnly)).toEqual({ kind: "ok", data: expect.anything() as unknown });
  });
});
