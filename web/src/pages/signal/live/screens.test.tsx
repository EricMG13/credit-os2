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

/** What a reader may press on a service: it is written there, or it changes only what is on screen. */
const PRESSABLE = [
  /^Saved?: /, // written: a story's save
  /^(Follow|Following)$/, // written: the topic's follow, on its page
  /^(Follow|Unfollow) /, // written: a topic's follow, in the channel list and the empty For you
  /^.+\n?(Writer|Reader)$/, // the name chip: opens the name dialog, whose name is written
  /^(Top|Latest)$/, // the order of the list on screen
  /^Show older$/,
  /^Show \d+ new (story|stories)$/,
  /^Show earlier digests$/,
  /^Close thread$/,
  /^(Source|State|Health)$/, // sorts the sources table on screen
];

function enabledControls(): string[] {
  const named = (element: Element) =>
    element.getAttribute("aria-label") ?? element.textContent.trim();
  const buttons = screen
    .queryAllByRole("button", { hidden: true })
    .filter((button) => !(button as HTMLButtonElement).disabled)
    .map(named);
  const others = ["switch", "combobox", "checkbox", "radio"].flatMap((role) =>
    screen
      .queryAllByRole(role, { hidden: true })
      .filter((control) => !(control as HTMLInputElement).disabled)
      .map((control) => `${role}: ${named(control)}`),
  );
  const boxes = screen
    .queryAllByRole("textbox", { hidden: true })
    .map((box) => `textbox: ${box.getAttribute("placeholder") ?? named(box)}`);
  return [...buttons, ...others, ...boxes];
}

const ALLOWED_OTHERS = [/^textbox: Search stories$/, /^radio: (Top|Latest)$/];

describe.each([
  ["the service's current sample", read(current)],
  ["the design fixture's fullest scene", read({ scenes: [fixture.slice.scenes[0]] })],
])("on a service, over %s", (_, slice) => {
  it.each(screensOf(slice))("%s draws, and offers only what is written", async (path) => {
    serve(slice);
    showLive(`#/signal/main/${path}`);
    const title = await screen.findByRole("heading", { level: 1, hidden: true });
    expect(title.textContent).not.toMatch(/^(Signal|Page not found|No such)/);
    await act(() => Promise.resolve());
    expect(document.body).not.toHaveTextContent(/sample/i);
    const unexpected = enabledControls().filter(
      (name) => ![...PRESSABLE, ...ALLOWED_OTHERS].some((allowed) => allowed.test(name)),
    );
    expect(unexpected).toEqual([]);
    cleanup();
  });
});

describe("a thread on a service", () => {
  it("shows comments and reactions as delivered, and says nothing can be added", async () => {
    const slice = read({ scenes: [fixture.slice.scenes[0]] });
    const group = slice.scenes[0].snapshot.groups.find((one) => one.threads.length > 0);
    const thread = slice.scenes[0].snapshot.threads.find(
      (one) => one.groupId === group?.id && !one.archived && one.comments.length > 0,
    );
    if (group === undefined || thread === undefined) throw new Error("the fixture has a thread");
    serve(slice);
    showLive(`#/signal/main/group/${group.id}/thread/${thread.id}`);
    const panel = await screen.findByRole("dialog");
    expect(panel).toHaveTextContent("Comments and reactions cannot be added from this page yet.");
    const reactions = screen.getAllByRole("button", { name: /: comment by / });
    expect(reactions.length).toBeGreaterThan(0);
    for (const reaction of reactions) expect(reaction).toBeDisabled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Reply to / })).toBeNull();
  });
});

describe("settings on a service that delivers rules, events and groups", () => {
  const slice = read({ scenes: [fixture.slice.scenes[0]] });

  it.each([
    ["thread-rules", "Thread rules cannot be changed from this page yet."],
    ["notifications", "Notification choices cannot be changed from this page yet."],
  ])("%s: each switch shows its state, disabled, with the reason", async (section, reason) => {
    serve(slice);
    showLive(`#/signal/main/settings/${section}`);
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    const switches = screen.getAllByRole("switch");
    expect(switches.length).toBeGreaterThan(0);
    for (const one of switches) {
      expect(one).toBeDisabled();
      expect(one).toHaveAccessibleDescription(expect.stringContaining(reason) as string);
    }
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it("groups: who can see a group is shown and cannot be changed", async () => {
    serve(slice);
    showLive("#/signal/main/settings/groups");
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    const choices = screen.getAllByRole("button", { name: /^Visibility: / });
    expect(choices.length).toBeGreaterThan(0);
    for (const choice of choices) expect(choice).toBeDisabled();
    expect(
      screen.getByText("Groups cannot be created or changed from this page yet."),
    ).toBeInTheDocument();
  });

  it("digests: no form, and no claim that there are none", async () => {
    serve(slice);
    showLive("#/signal/main/settings/digests");
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    expect(
      screen.getByText("Digests cannot be set up or changed from this page yet."),
    ).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("No digests yet");
  });
});
