// Settings on a service, the parts kept by group: a group's name, its removal, the topics that post
// into it, and its own thread rules. Over the service's sample (groups 3 Committee prep, 1 Leveraged
// credit, 2 Shipping desk; topics 1 Packaging, 2 Telecoms, 3 Shipping). Paths, bodies, names and
// sentences are written out by hand.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import fixture from "../../../../fixtures/signal.json";
import { SignalActionsContext, type SignalActions } from "../actions";
import { GroupsSection } from "../settings/GroupsSection";
import type { SignalSettingsRule } from "../slice";
import { page, settled, show, withMain, type Json } from "../test-helpers";
import {
  content,
  currentWith,
  lookAgain,
  refusal,
  serve,
  showLive,
  type Snapshot,
} from "./test-helpers";

const HINT =
  "New stories of the topics switched on are posted into the group as threads from then on. Stories already stored are not posted.";

async function settings(section: string, edit?: (snapshot: Snapshot) => void) {
  const service = serve(currentWith(edit));
  showLive(`#/signal/main/settings/${section}`);
  await screen.findByRole("heading", { level: 1, name: "Settings" });
  return service;
}
const groupOf = (snapshot: Snapshot, id: string) => {
  const group = snapshot.settings.groups.find((one) => one.id === id);
  if (group === undefined) throw new Error(`the sample holds group ${id}`);
  return group;
};
const press = (name: string) => {
  fireEvent.click(screen.getByRole("button", { name }));
};
const flip = (name: string) => {
  fireEvent.click(screen.getByRole("switch", { name }));
};
const row = (name: string) =>
  within(
    content()
      .getAllByRole("listitem")
      .find((item) => item.querySelector("p")?.textContent === name) as HTMLElement,
  );

describe("a group's row on a service", () => {
  it("has Edit members, Topics, Rename and Delete, each named for its group", async () => {
    await settings("groups");
    for (const name of ["Committee prep", "Leveraged credit", "Shipping desk"]) {
      expect(
        row(name)
          .getAllByRole("button")
          .filter((button) => button.getAttribute("aria-haspopup") === null)
          .map((button) => [button.textContent, button.getAttribute("aria-label")]),
      ).toEqual([
        ["Edit members", `Edit members: ${name}`],
        ["Topics", `Topics: ${name}`],
        ["Rename", `Rename: ${name}`],
        ["Delete", `Delete: ${name}`],
      ]);
    }
  });

  it("has no Topics where the service says nothing of a group's topics", async () => {
    await settings("groups", (snapshot) => {
      for (const group of snapshot.settings.groups) Reflect.deleteProperty(group, "topics");
    });
    expect(content().queryByRole("button", { name: /^Topics: / })).toBeNull();
    expect(content().getAllByRole("button", { name: /^Rename: / })).toHaveLength(3);
  });

  it("lists the topics that post into it, by name, and nothing where there are none", async () => {
    await settings("groups", (snapshot) => {
      groupOf(snapshot, "1").topics = ["1", "3"];
    });
    const posted = row("Leveraged credit").getByRole("list", {
      name: "Topics posted into Leveraged credit",
    });
    expect(
      within(posted)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Packaging", "Shipping"]);
    expect(row("Leveraged credit").getByText("Posts from")).toBeInTheDocument();
    expect(row("Shipping desk").queryByText("Posts from")).toBeNull();
    expect(content().getAllByRole("list", { name: /^Topics posted into / })).toHaveLength(1);
  });

  it("is not drawn for a reader, who has no Groups section", async () => {
    serve(
      currentWith((snapshot) => {
        Object.assign(snapshot.viewer, { role: "reader", roleLabel: "Reader" });
      }),
    );
    showLive("#/signal/main/settings/groups");
    expect(await screen.findByText("This section is for writers")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^(Topics|Rename|Delete|Edit members): / }),
    ).toBeNull();
    expect(screen.queryByRole("tab", { name: "Groups" })).toBeNull();
  });
});

describe("the sample's groups, with no service", () => {
  it("draw no Topics, Rename or Delete, whatever the groups carry", () => {
    const slice = withMain((scene) => {
      for (const group of scene.snapshot.settings.groups) {
        (group as unknown as Record<string, Json>)["topics"] = ["shipping"];
      }
    });
    show("/signal/main/settings/groups", slice);
    expect(page().getAllByRole("button", { name: /^Edit members: / })).toHaveLength(3);
    expect(page().queryByRole("button", { name: /^(Topics|Rename|Delete): / })).toBeNull();
    expect(page().queryByText("Posts from")).toBeNull();
  });
});

describe("Rename", () => {
  it("opens on the group's name and sends nothing for an empty one", async () => {
    const service = await settings("groups");
    press("Rename: Shipping desk");
    const dialog = within(screen.getByRole("dialog", { name: "Rename Shipping desk" }));
    const name = dialog.getByRole("textbox", { name: /^Name/ });
    expect(name).toHaveValue("Shipping desk");
    fireEvent.change(name, { target: { value: "  " } });
    fireEvent.click(dialog.getByRole("button", { name: "Rename group" }));
    expect(name).toHaveAccessibleDescription("Error: Enter the group's name.");
    expect(service.writes()).toEqual([]);
  });

  it("refused, shows the service's sentence in the form and keeps what was typed", async () => {
    const service = await settings("groups");
    service.replies.set(
      "POST /signal/api/groups/2/rename",
      refusal(409, "a group named 'Leveraged credit' already exists"),
    );
    press("Rename: Shipping desk");
    const dialog = within(screen.getByRole("dialog", { name: "Rename Shipping desk" }));
    fireEvent.change(dialog.getByRole("textbox", { name: /^Name/ }), {
      target: { value: "Leveraged credit" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Rename group" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "a group named 'Leveraged credit' already exists",
    );
    expect(dialog.getByRole("textbox", { name: /^Name/ })).toHaveValue("Leveraged credit");
  });
});

describe("Delete", () => {
  const question = () => screen.getByRole("dialog", { name: "Delete Shipping desk?" });

  it("asks first, naming the group; Cancel sends nothing", async () => {
    const service = await settings("groups");
    press("Delete: Shipping desk");
    expect(question()).toHaveTextContent(
      "The group is deleted for everyone. This cannot be undone.",
    );
    expect(
      within(question())
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Cancel", "Delete group"]);
    fireEvent.click(within(question()).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(service.writes()).toEqual([]);
  });

  it("refused while the group holds threads, shows the service's sentence as given", async () => {
    const service = await settings("groups");
    service.replies.set(
      "DELETE /signal/api/groups/1",
      refusal(409, "a group that holds threads cannot be deleted"),
    );
    press("Delete: Leveraged credit");
    const dialog = within(screen.getByRole("dialog", { name: "Delete Leveraged credit?" }));
    fireEvent.click(dialog.getByRole("button", { name: "Delete group" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "Error: a group that holds threads cannot be deleted",
    );
    expect(
      content().getByRole("button", { name: "Delete: Leveraged credit", hidden: true }),
    ).toBeTruthy();
  });

  it("accepted, takes the row away and gives focus to New group", async () => {
    const service = await settings("groups");
    service.snapshot = currentWith((snapshot) => {
      const without = <T extends { id: string }>(list: T[]) => list.filter((one) => one.id !== "2");
      snapshot.groups = without(snapshot.groups);
      snapshot.channels.groups = without(snapshot.channels.groups);
      snapshot.settings.groups = without(snapshot.settings.groups);
    });
    // A reader's press leaves focus on the button pressed.
    screen.getByRole("button", { name: "Delete: Shipping desk" }).focus();
    press("Delete: Shipping desk");
    fireEvent.click(within(question()).getByRole("button", { name: "Delete group" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(service.writes()).toEqual(["DELETE /signal/api/groups/2"]);
    expect(content().queryByRole("button", { name: "Delete: Shipping desk" })).toBeNull();
    await settled();
    expect(content().getByRole("button", { name: "New group" })).toHaveFocus();
  });

  it("leaves its page saying the group is gone, once the service no longer lists it", async () => {
    const service = serve(currentWith());
    showLive("#/signal/main/group/2");
    await screen.findByRole("heading", { level: 1, name: "Shipping desk" });
    service.snapshot = currentWith((snapshot) => {
      const without = <T extends { id: string }>(list: T[]) => list.filter((one) => one.id !== "2");
      snapshot.groups = without(snapshot.groups);
      snapshot.channels.groups = without(snapshot.channels.groups);
      snapshot.settings.groups = without(snapshot.settings.groups);
    });
    await lookAgain();
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "This group does not exist or is not open to you.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to For you" })).toBeInTheDocument();
  });
});

describe("Topics", () => {
  const dialog = () => within(screen.getByRole("dialog", { name: "Topics for Leveraged credit" }));
  /** Each topic's switch, found by its name, with whether it is on; there are no other switches. */
  const states = () => {
    expect(dialog().getAllByRole("switch")).toHaveLength(3);
    return ["Packaging", "Telecoms", "Shipping"].map((name) => [
      name,
      dialog().getByRole<HTMLInputElement>("switch", { name }).checked,
    ]);
  };

  it("lists every topic by name, the group's own switched on, with the sentence under them", async () => {
    await settings("groups", (snapshot) => {
      groupOf(snapshot, "1").topics = ["2"];
    });
    press("Topics: Leveraged credit");
    expect(dialog().getByRole("group", { name: "Topics" })).toBeInTheDocument();
    expect(states()).toEqual([
      ["Packaging", false],
      ["Telecoms", true],
      ["Shipping", false],
    ]);
    expect(dialog().getByText(HINT)).toBeInTheDocument();
    expect(
      dialog()
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Cancel", "Save"]);
  });

  it("sends an empty set when every topic is switched off", async () => {
    const service = await settings("groups", (snapshot) => {
      groupOf(snapshot, "1").topics = ["2"];
    });
    press("Topics: Leveraged credit");
    flip("Telecoms");
    fireEvent.click(dialog().getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/groups/1/topics"]);
    });
    expect(service.bodies.map((body) => JSON.parse(body as string) as unknown)).toEqual([
      { topics: [] },
    ]);
  });

  it("refused, shows the service's sentence in the form and keeps the switches as set", async () => {
    const service = await settings("groups");
    service.replies.set(
      "POST /signal/api/groups/1/topics",
      refusal(409, "a group follows at most 20 topics"),
    );
    press("Topics: Leveraged credit");
    flip("Packaging");
    flip("Shipping");
    fireEvent.click(dialog().getByRole("button", { name: "Save" }));
    expect(await dialog().findByRole("alert")).toHaveTextContent(
      "Error: a group follows at most 20 topics",
    );
    expect(states()).toEqual([
      ["Packaging", true],
      ["Telecoms", false],
      ["Shipping", true],
    ]);
  });

  it("says there are no topics yet, with the way to Settings, Topics, and nothing to save", () => {
    const group = fixture.slice.scenes[0]?.snapshot.settings.groups[0];
    if (group === undefined) throw new Error("the fixture has a first group");
    const actions: SignalActions = {
      write: vi.fn(() => Promise.resolve({ refusal: null, reply: {} })),
      reveal: () => undefined,
      refresh: () => undefined,
    };
    render(
      <SignalActionsContext value={actions}>
        <GroupsSection
          groups={[{ ...group, topics: [], rules: null }]}
          topics={[]}
          topicsHref="#/signal/main/settings/topics"
          visibility={(one) => one.visibility}
          onVisibility={() => undefined}
        />
      </SignalActionsContext>,
    );
    press(`Topics: ${group.name}`);
    const empty = within(screen.getByRole("dialog", { name: `Topics for ${group.name}` }));
    expect(empty.getByText(/^No topics yet\. A topic is made in Settings, Topics\./)).toBeTruthy();
    expect(empty.getByRole("link", { name: "Open Topics" })).toHaveAttribute(
      "href",
      "#/signal/main/settings/topics",
    );
    expect(empty.queryByRole("switch")).toBeNull();
    expect(empty.getAllByRole("button").map((button) => button.textContent)).toEqual(["Cancel"]);
    expect(actions.write).not.toHaveBeenCalled();
  });
});

describe("Thread rules on a service", () => {
  const RULES = [
    "Comments can be edited for 15 minutes",
    "Authors can remove their own comments",
    "Archive a thread after 90 days without a comment",
  ];
  const block = (name: string) => within(content().getByRole("group", { name }));

  it("draws one block per group under the group's name, with that group's three switches", async () => {
    await settings("thread-rules");
    expect(
      content()
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Committee prep", "Leveraged credit", "Shipping desk"]);
    for (const name of ["Committee prep", "Leveraged credit", "Shipping desk"]) {
      expect(block(name).getAllByRole("switch")).toHaveLength(3);
      const on = RULES.map(
        (rule) => block(name).getByRole<HTMLInputElement>("switch", { name: rule }).checked,
      );
      expect(on).toEqual([true, true, false]);
    }
    expect(
      block("Leveraged credit").getByText('An edited comment is marked "edited".'),
    ).toBeTruthy();
    // The sentence of the one list for every group is not said here.
    expect(screen.queryByText("These apply to every group.")).toBeNull();
    expect(content().getByRole("heading", { level: 2, name: "Thread rules" })).toBeInTheDocument();
  });

  it("draws a group's own state, not another's", async () => {
    await settings("thread-rules", (snapshot) => {
      const rules = groupOf(snapshot, "2").rules as SignalSettingsRule[];
      for (const rule of rules) rule.on = rule.id === "archive-quiet";
    });
    const checked = (name: string) =>
      block(name)
        .getAllByRole("switch")
        .map((one) => (one as HTMLInputElement).checked);
    expect(checked("Shipping desk")).toEqual([false, false, true]);
    expect(checked("Leveraged credit")).toEqual([true, true, false]);
  });

  it("puts a switch back when the service refuses it, and says the sentence above the page", async () => {
    const service = await settings("thread-rules");
    service.replies.set("POST /signal/api/groups/2/rules", refusal(403, "writers only"));
    const quiet = () => block("Shipping desk").getByRole("switch", { name: RULES[2] });
    fireEvent.click(quiet());
    expect(quiet()).toBeChecked();
    expect(await screen.findByRole("alert")).toHaveTextContent("Error: writers only");
    await waitFor(() => {
      expect(quiet()).not.toBeChecked();
    });
    expect(service.writes()).toEqual(["POST /signal/api/groups/2/rules"]);
    // The same rule of another group was not touched.
    expect(block("Leveraged credit").getByRole("switch", { name: RULES[2] })).not.toBeChecked();
  });

  it("says there are no rules yet where no group carries any", async () => {
    await settings("thread-rules", (snapshot) => {
      for (const group of snapshot.settings.groups) Reflect.deleteProperty(group, "rules");
    });
    expect(content().getByText("No thread rules yet.")).toBeInTheDocument();
    expect(content().queryByRole("switch")).toBeNull();
    expect(content().queryByText("These apply to every group.")).toBeNull();
  });
});

describe("Thread rules in the sample", () => {
  it("stay one list for every group, with its sentence, and change in memory", () => {
    show("/signal/main/settings/thread-rules");
    expect(page().getByText("These apply to every group.")).toBeInTheDocument();
    expect(page().queryByRole("heading", { level: 3 })).toBeNull();
    expect(page().getAllByRole("switch")).toHaveLength(4);
  });

  it("are drawn by group where the sample's groups carry their own, and change in memory", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const slice = withMain((scene) => {
      const [first, second] = scene.snapshot.settings.groups;
      const rule = { id: "archive-quiet", label: "Archive a quiet thread", hint: null, on: false };
      (first as unknown as Record<string, Json>)["rules"] = [rule];
      (second as unknown as Record<string, Json>)["rules"] = [{ ...rule, on: true }];
    });
    show("/signal/main/settings/thread-rules", slice);
    const block = (name: string) => within(page().getByRole("group", { name }));
    const own = block("Leveraged credit").getByRole("switch", { name: "Archive a quiet thread" });
    expect(own).not.toBeChecked();
    expect(block("Shipping desk").getByRole("switch")).toBeChecked();
    // The third group carries none, so it has no block.
    expect(page().getAllByRole("heading", { level: 3 })).toHaveLength(2);
    fireEvent.click(own);
    expect(own).toBeChecked();
    expect(block("Shipping desk").getByRole("switch")).toBeChecked();
    expect(fetch).not.toHaveBeenCalled();
    expect(page().queryByText("These apply to every group.")).toBeNull();
  });
});
