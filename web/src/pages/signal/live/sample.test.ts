// The contract with the Signal service: `snapshot.sample.json` is written by the service's own
// snapshot builder from a seeded store (tests/test_signal_snapshot.py holds the file to it), and the
// slice reader the screens use must accept it as it is. A failure here names the first member the
// two sides disagree on; the reader is not loosened to pass it.
import feedOnly from "../../../../fixtures/signal-live.json";
import { readSlice, type SignalSlice } from "../slice";
import sample from "./snapshot.sample.json";

function read(source: unknown): SignalSlice {
  const got = readSlice(source);
  if (got.kind !== "ok") throw new Error(got.kind === "invalid" ? got.reason : "no slice");
  return got.data;
}

describe("the service's sample snapshot", () => {
  it("is a slice the reader accepts", () => {
    expect(readSlice(sample)).toEqual({ kind: "ok", data: expect.anything() as unknown });
  });

  it("holds the one scene the live page draws", () => {
    expect(read(sample).scenes.map((scene) => scene.id)).toEqual(["main"]);
  });

  it("is ready, with no error and no pill of its own", () => {
    const { feed } = read(sample).scenes[0].snapshot;
    expect(feed).toMatchObject({ status: "ready", error: null });
    const views = [...Object.values(feed.views), ...Object.values(feed.topics)];
    expect(views.length).toBeGreaterThan(3);
    expect(views.filter((view) => view.waiting !== null)).toEqual([]);
  });

  it("delivers the groups, threads, digests, rules and events the screens write to", () => {
    const { channels, groups, threads, digests, settings, feed } = read(sample).scenes[0].snapshot;
    expect(channels.groups.map((group) => group.name)).toEqual([
      "Leveraged credit",
      "Shipping desk",
    ]);
    expect(groups.map((group) => group.threads.length)).toEqual([3, 0]);
    expect(threads).toHaveLength(3);
    const comments = threads.flatMap((thread) => thread.comments);
    expect(comments.some((comment) => comment.replies.length > 0)).toBe(true);
    expect(comments.some((comment) => comment.removed)).toBe(true);
    expect(comments.some((comment) => comment.reactions.length > 0)).toBe(true);
    expect(digests.map((digest) => digest.name)).toEqual(["Daily shipping", "Weekly packaging"]);
    // What an edit posts back is delivered with each digest.
    expect(digests.map((digest) => digest.form?.["schedule"])).toEqual([
      "Daily, 07:00 UTC",
      "Weekly, Friday 07:00 UTC",
    ]);
    expect(feed.digests.length).toBeGreaterThan(0);
    expect(settings.groups.map((group) => group.name)).toContain("Committee prep");
    expect(settings.rules.map((rule) => rule.id)).toEqual([
      "comments-edited",
      "authors-remove",
      "archive-quiet",
    ]);
    expect(settings.notifications.events.map((event) => event.id)).toEqual([
      "replies",
      "threads",
      "signal",
      "digest",
    ]);
  });

  it("still delivers the AI pass off, and every digest paused with its sentence", () => {
    const { digests, settings, feed } = read(sample).scenes[0].snapshot;
    expect(settings.ai).toMatchObject({ state: "off", spend: null, parts: [] });
    expect(digests.every((digest) => digest.paused !== null)).toBe(true);
    expect(feed.stories.every((story) => story.ai === null && story.strength === null)).toBe(true);
  });
});

describe("what a digest carries for its edit form", () => {
  /** The sample with its first digest's `form` replaced (`undefined` leaves the member out). */
  const withForm = (form: unknown) => {
    const copy = structuredClone(sample) as unknown as {
      scenes: { snapshot: { digests: Record<string, unknown>[] } }[];
    };
    const first = copy.scenes[0]?.snapshot.digests[0];
    if (first === undefined) throw new Error("the sample has a digest");
    if (form === undefined) delete first["form"];
    else first["form"] = form;
    return copy;
  };
  const HELD = {
    name: "Daily shipping",
    covers: ["Topic: Shipping"],
    schedule: "Daily, 07:00 UTC",
    length: "Up to 3 points",
    brief: "",
  };

  it("is kept whole, with members the form does not show", () => {
    const form = { ...HELD, upcoming: "Results dates", lookAhead: 14 };
    expect(read(withForm(form)).scenes[0].snapshot.digests[0]?.form).toEqual(form);
  });

  it("may cover nothing (what it covered was removed), and may be absent", () => {
    const none = read(withForm({ ...HELD, covers: [] })).scenes[0].snapshot.digests[0];
    expect(none?.form?.["covers"]).toEqual([]);
    expect(read(withForm(undefined)).scenes[0].snapshot.digests[0]?.form).toBeNull();
  });

  it.each([
    ["a schedule that is no string", { ...HELD, schedule: 7 }, "form.schedule: expected a string"],
    [
      "covers that is one string",
      { ...HELD, covers: "All stories" },
      "form.covers: expected a list",
    ],
    ["no object", "weekly", "form: expected an object"],
  ])("is refused with %s", (_, form, reason) => {
    expect(readSlice(withForm(form))).toEqual({
      kind: "invalid",
      reason: `scenes[0].snapshot.digests[0].${reason}`,
    });
  });
});

describe("the earlier sample the feed tests read", () => {
  it("is a slice the reader accepts too", () => {
    expect(readSlice(feedOnly)).toEqual({ kind: "ok", data: expect.anything() as unknown });
  });
});
