// The members a service may leave out of a snapshot, which the sample does: what a comment's author
// may still do to it, which topics post into a group, a group's own thread rules, and how many
// entries of a ranked view are drawn first. Expected reasons are written out by hand.
import fixture from "../../../fixtures/signal.json";
import { readSlice, type SignalComment, type SignalSlice } from "./slice";
import { withMain, type Json, type Scene } from "./test-helpers";

const invalid = (reason: string) => ({ kind: "invalid", reason });
const AT = "scenes[0].snapshot";

function read(source: unknown): SignalSlice {
  const got = readSlice(source);
  if (got.kind !== "ok") throw new Error(got.kind === "invalid" ? got.reason : "no slice");
  return got.data;
}
const main = (source: unknown) => read(source).scenes[0].snapshot;

/** The first thread's comments (Tobias O with a reply by Ines K, Jonas W, the viewer's own). */
const commentsOf = (scene: Scene) => (scene.snapshot.threads[0]?.comments ?? []) as SignalComment[];
/** A settings group of the scene, as plain data a test may add members to. */
const groupAt = (scene: Scene, index: number) =>
  scene.snapshot.settings.groups[index] as unknown as Record<string, Json>;
const forYou = (scene: Scene) => scene.snapshot.feed.views["for-you"] as Record<string, Json>;

describe("what a comment's author may still do", () => {
  it("reads as false where the snapshot says nothing, as the sample does", () => {
    const all = main(fixture.slice).threads.flatMap((thread) =>
      thread.comments.flatMap((comment) => [comment, ...comment.replies]),
    );
    expect(all.length).toBeGreaterThan(0);
    expect(all.map((comment) => [comment.canEdit, comment.canRemove])).toEqual(
      all.map(() => [false, false]),
    );
  });

  it("reads what the service delivers, on a comment and on a reply", () => {
    const got = main(
      withMain((scene) => {
        Object.assign(commentsOf(scene)[2] ?? {}, { canEdit: true, canRemove: false });
        Object.assign(commentsOf(scene)[0]?.replies[0] ?? {}, { canEdit: false, canRemove: true });
      }),
    );
    const [first, , own] = got.threads[0]?.comments ?? [];
    expect([own?.canEdit, own?.canRemove]).toEqual([true, false]);
    expect([first?.replies[0]?.canEdit, first?.replies[0]?.canRemove]).toEqual([false, true]);
  });

  it.each(["canEdit", "canRemove"])("refuses a %s that is not true or false", (flag) => {
    const slice = withMain((scene) => {
      Object.assign(commentsOf(scene)[2] ?? {}, { [flag]: "yes" });
    });
    expect(readSlice(slice)).toEqual(
      invalid(`${AT}.threads[0].comments[2].${flag}: expected true or false`),
    );
  });

  it.each(["canEdit", "canRemove"])("refuses %s on a removed comment", (flag) => {
    const slice = withMain((scene) => {
      const removed = commentsOf(scene).findIndex((comment) => comment.removed);
      expect(removed).toBe(1);
      Object.assign(commentsOf(scene)[removed] ?? {}, { [flag]: true });
    });
    expect(readSlice(slice)).toEqual(
      invalid(`${AT}.threads[0].comments[1].${flag}: expected false on a removed comment`),
    );
  });
});

describe("the topics that post into a group", () => {
  it("reads as null where the snapshot says nothing, as the sample does", () => {
    expect(main(fixture.slice).settings.groups.map((group) => group.topics)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("reads the delivered ids, an empty set included", () => {
    const got = main(
      withMain((scene) => {
        groupAt(scene, 0)["topics"] = ["shipping", "telecoms"];
        groupAt(scene, 1)["topics"] = [];
      }),
    );
    expect(got.settings.groups.map((group) => group.topics)).toEqual([
      ["shipping", "telecoms"],
      [],
      null,
    ]);
  });

  it("refuses an id that names no topic in settings.topics", () => {
    const slice = withMain((scene) => {
      groupAt(scene, 1)["topics"] = ["shipping", "ports"];
    });
    expect(readSlice(slice)).toEqual(
      invalid(`${AT}.settings.groups[1].topics[1]: expected the id of a topic in settings.topics`),
    );
  });

  it("refuses a topic named twice, and a set that is not a list", () => {
    const twice = withMain((scene) => {
      groupAt(scene, 0)["topics"] = ["shipping", "shipping"];
    });
    expect(readSlice(twice)).toEqual(
      invalid(`${AT}.settings.groups[0].topics[1]: expected an id the list does not repeat`),
    );
    const word = withMain((scene) => {
      groupAt(scene, 0)["topics"] = "shipping";
    });
    expect(readSlice(word)).toEqual(invalid(`${AT}.settings.groups[0].topics: expected a list`));
  });
});

describe("a group's own thread rules", () => {
  const RULE = { id: "archive-quiet", label: "Archive a quiet thread", hint: null, on: false };

  it("reads as null where the snapshot says nothing, as the sample does", () => {
    const { settings } = main(fixture.slice);
    expect(settings.groups.map((group) => group.rules)).toEqual([null, null, null]);
    expect(settings.rules.length).toBeGreaterThan(0);
  });

  it("reads the delivered rules of each group", () => {
    const got = main(
      withMain((scene) => {
        groupAt(scene, 0)["rules"] = [RULE, { ...RULE, id: "authors-remove", on: true }];
        groupAt(scene, 2)["rules"] = [];
      }),
    );
    expect(
      got.settings.groups.map((group) => group.rules?.map((rule) => [rule.id, rule.on])),
    ).toEqual([
      [
        ["archive-quiet", false],
        ["authors-remove", true],
      ],
      undefined,
      [],
    ]);
  });

  it("refuses a rule with no switch state, and a rule id used twice in a group", () => {
    const bare = withMain((scene) => {
      groupAt(scene, 0)["rules"] = [{ id: "archive-quiet", label: "Archive", hint: null }];
    });
    expect(readSlice(bare)).toEqual(
      invalid(`${AT}.settings.groups[0].rules[0].on: expected true or false`),
    );
    const twice = withMain((scene) => {
      groupAt(scene, 0)["rules"] = [RULE, RULE];
    });
    expect(readSlice(twice)).toEqual(
      invalid(`${AT}.settings.groups[0].rules[1].id: expected an id the list does not repeat`),
    );
  });
});

describe("how many entries of a view are drawn first", () => {
  it("is not there where the snapshot says nothing, as the sample does", () => {
    const { views, topics } = main(fixture.slice).feed;
    for (const view of [...Object.values(views), ...Object.values(topics)]) {
      expect("shown" in view).toBe(false);
    }
  });

  it("reads a positive whole number on a named view and on a topic's", () => {
    const got = main(
      withMain((scene) => {
        forYou(scene)["shown"] = 30;
        (scene.snapshot.feed.topics.shipping as Record<string, Json>)["shown"] = 1;
      }),
    );
    expect(got.feed.views["for-you"].shown).toBe(30);
    expect(got.feed.topics["shipping"]?.shown).toBe(1);
    expect(got.feed.views.latest.shown).toBeUndefined();
  });

  it.each([0, -3, 2.5, "30", null, true])("refuses %j", (shown) => {
    const slice = withMain((scene) => {
      forYou(scene)["shown"] = shown;
    });
    expect(readSlice(slice)).toEqual(
      invalid(`${AT}.feed.views.for-you.shown: expected a positive whole number`),
    );
  });
});

describe("what the reader gives, read again", () => {
  it("is accepted as it is, the members the snapshot left out included", () => {
    const once = read(fixture.slice);
    expect(read(once)).toEqual(once);
    const full = read(
      withMain((scene) => {
        forYou(scene)["shown"] = 2;
        groupAt(scene, 0)["topics"] = ["shipping"];
        groupAt(scene, 0)["rules"] = [];
      }),
    );
    expect(read(full)).toEqual(full);
  });
});
