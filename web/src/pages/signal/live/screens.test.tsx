// Every screen of the live page, over the service's current sample and over the design fixture's
// fullest scene (groups, threads, comments, digests, rules, notification events): on a service the
// page writes saves, follows and the name, so nothing else may look as if it saves. The control
// names allowed below are written out by hand; a control this file does not name fails the walk.
import { act, cleanup, screen } from "@testing-library/react";
import fixture from "../../../../fixtures/signal.json";
import { readSlice, type SignalSlice } from "../slice";
import current from "./snapshot.sample.json";
import { serve, showLive } from "./test-helpers";

function read(source: unknown): SignalSlice {
  const got = readSlice(source);
  if (got.kind !== "ok") throw new Error(got.kind === "invalid" ? got.reason : "no slice");
  return got.data;
}

const SECTIONS = ["groups", "thread-rules", "sources", "topics", "digests", "notifications", "ai"];

/** The address of every screen the snapshot's channel list, groups and settings lead to. */
function screensOf(slice: SignalSlice): string[] {
  const { channels, groups } = slice.scenes[0].snapshot;
  const part = encodeURIComponent;
  return [
    ...["for-you", "latest", "saved"].map((view) => `feed/${view}`),
    ...channels.topics.map((topic) => `topic/${part(topic.id)}`),
    ...groups.flatMap((group) => [
      `group/${part(group.id)}`,
      ...group.threads.map((thread) => `group/${part(group.id)}/thread/${part(thread.id)}`),
    ]),
    ...channels.digests.map((digest) => `digest/${part(digest.id)}`),
    ...SECTIONS.map((section) => `settings/${section}`),
  ];
}

/**
 * What a reader may press on a service. Each is written there (writes.test.tsx holds each to its
 * route), or changes only what is on screen and says nothing was saved.
 */
const PRESSABLE = [
  /^Saved?: /, // a story's save
  /^(Follow|Following)$/, // the topic's follow, on its page
  /^(Follow|Unfollow) /, // a topic's follow, in the channel list and the empty For you
  /(Writer|Reader)$/, // the name chip: opens the name dialog, whose name is written
  /^Comment( \d+)?: /, // opens the share form (a link where the story has a thread)
  /^Share to group: /,
  /^(New thread|Attach story)$/, // the group's thread forms
  /^Reply to /, // puts the reply box on a comment
  /^(Edit|Remove) your comment$/, // the author's own, where the service says they still may
  /^(Agree|Disagree|Seen)(, \d+)?: comment by /, // a reaction
  /^Send$/, // a comment or a reply
  /^(New group|New topic|Propose a source|Save digest)$/,
  /^(Edit members|Edit|Delete|Run once now): /, // a group's members, a topic, a digest, a group
  /^(Topics|Rename): /, // a group's topics and its name
  /^(Top|Latest)$/, // the order of the list on screen
  /^Show older$/,
  /^Show \d+ new (story|stories)$/,
  /^Earlier digests/,
  /^(Close thread|Dismiss)$/, // closes the thread panel
  /^(Source|State|Health)$/, // sorts the sources table on screen
];
const OTHERS = [
  /^textbox: (Search stories|Write a comment)$/,
  /^textbox: (Name|Brief)/, // the digest form's fields
  /^radio: (Top|Latest)$/,
  /^switch: /, // a thread rule or a notification choice
];

function enabledControls(): string[] {
  const named = (element: Element) =>
    element.getAttribute("aria-label") ?? element.textContent.trim();
  const of = (role: string) =>
    screen
      .queryAllByRole(role, { hidden: true })
      .filter((control) => !(control as HTMLInputElement).disabled);
  return [
    // A select's trigger is left out: its choice is written (a group's visibility) or sent with its form.
    ...of("button")
      .filter((button) => button.getAttribute("aria-haspopup") === null)
      .map(named),
    ...["switch", "radio", "checkbox"].flatMap((role) =>
      of(role).map((control) => `${role}: ${named(control)}`),
    ),
    ...of("textbox").map((box) => {
      const label = (box as HTMLInputElement).labels?.[0]?.textContent;
      return `textbox: ${box.getAttribute("placeholder") ?? label ?? named(box)}`;
    }),
  ];
}

describe.each([
  ["the service's current sample", read(current)],
  ["the design fixture's fullest scene", read({ scenes: [fixture.slice.scenes[0]] })],
])("on a service, over %s", (_, slice) => {
  it.each(screensOf(slice))(
    "%s draws, with no sample wording and no control unaccounted for",
    async (path) => {
      serve(slice);
      showLive(`#/signal/main/${path}`);
      // The frame is drawn once the snapshot is read; until then the page's own title stands.
      await screen.findByRole("navigation", { name: "Signal", hidden: true });
      const title = screen.getByRole("heading", { level: 1, hidden: true });
      expect(title.textContent).not.toMatch(/^(Page not found|No such)/);
      await act(() => Promise.resolve());
      expect(document.body).not.toHaveTextContent(/sample/i);
      const unexpected = enabledControls().filter(
        (name) => ![...PRESSABLE, ...OTHERS].some((allowed) => allowed.test(name)),
      );
      expect(unexpected).toEqual([]);
      cleanup();
    },
  );
});

describe("what stays read-only on a service", () => {
  it("AI and cost: every part's switch is disabled, with its reason", async () => {
    serve(read({ scenes: [fixture.slice.scenes[0]] }));
    showLive("#/signal/main/settings/ai");
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    const parts = screen.getAllByRole("switch");
    expect(parts).toHaveLength(3);
    for (const part of parts) expect(part).toBeDisabled();
    expect(screen.queryByRole("button", { name: /cap|approve|pause/i })).toBeNull();
  });

  it("Sources: a source is proposed here; approving and pausing have no control", async () => {
    serve(read(current));
    showLive("#/signal/main/settings/sources");
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    expect(screen.queryByRole("button", { name: /approve|pause/i })).toBeNull();
  });
});
