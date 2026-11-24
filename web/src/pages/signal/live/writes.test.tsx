// Every write the live screens make, over the service's current sample: what is sent, that the
// snapshot is read again once the service accepts, and that a refusal shows the service's own
// sentence and reads nothing. Paths, bodies, names and sentences are written out by hand.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { currentWith, refusal, serve, showLive, type Snapshot } from "./test-helpers";

const READ = "GET /signal/api/snapshot";
const REFUSED = "that is not allowed just now";

const press = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole("button", { name }));
};
const type = (label: string | RegExp, value: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } });
};
const choose = (trigger: string | RegExp, option: string) => {
  press(trigger);
  fireEvent.click(screen.getByRole("option", { name: option }));
};
const flip = (name: string) => {
  fireEvent.click(screen.getByRole("switch", { name }));
};
/** A switch of one group's own block in Thread rules. */
const flipIn = (group: string, name: string) => {
  fireEvent.click(within(screen.getByRole("group", { name: group })).getByRole("switch", { name }));
};
/** The viewer's own comments in the sample (the reply 2 and the comment 4) with what the service says may be done to each. */
const mayChange =
  (flags: Record<string, { canEdit?: boolean; canRemove?: boolean }>) => (snapshot: Snapshot) => {
    for (const thread of snapshot.threads) {
      for (const one of thread.comments.flatMap((comment) => [comment, ...comment.replies])) {
        Object.assign(one, flags[one.id] ?? {});
      }
    }
  };

const TESSALY = "Tessaly Telecom agrees the sale of its towers";

type Case = {
  name: string;
  at: string;
  /** What the reader does, once the screen is drawn. */
  steps: () => void;
  /** The requests it makes, in order, and the JSON body of each that has one. */
  sent: string[];
  bodies: unknown[];
  /** Where the screen must be drawn before the steps: a heading's name. */
  ready: string;
  /** A change to the sample this case needs. */
  given?: (snapshot: Snapshot) => void;
};

const CASES: Case[] = [
  {
    name: "Share to group, with a note",
    at: "feed/latest",
    ready: "Latest",
    steps: () => {
      press(`Share to group: ${TESSALY}`);
      choose(/Group/, "Leveraged credit");
      type(/Note \(optional\)/, "  For Thursday.  ");
      press("Share");
    },
    sent: ["POST /signal/api/groups/1/threads"],
    bodies: [{ story: "2", note: "For Thursday." }],
  },
  {
    name: "Comment on a story with no thread: the share form, with no note",
    at: "feed/latest",
    ready: "Latest",
    steps: () => {
      press(`Comment: ${TESSALY}`);
      choose(/Group/, "Shipping desk");
      press("Share");
    },
    sent: ["POST /signal/api/groups/2/threads"],
    bodies: [{ story: "2" }],
  },
  {
    name: "New thread on a group page",
    at: "group/1",
    ready: "Leveraged credit",
    steps: () => {
      press("New thread");
      type(/^Note/, "Who is covering the call?");
      press("Start thread");
    },
    sent: ["POST /signal/api/groups/1/threads"],
    bodies: [{ note: "Who is covering the call?" }],
  },
  {
    name: "Attach story on a group page",
    at: "group/2",
    ready: "Shipping desk",
    steps: () => {
      press("Attach story");
      choose(/Story/, "Lenmark Shipping refinances its fleet loan");
      press("Attach story");
    },
    sent: ["POST /signal/api/groups/2/threads"],
    bodies: [{ story: "6" }],
  },
  {
    name: "a comment in a thread",
    at: "group/1/thread/1",
    ready: "Thread",
    steps: () => {
      type("Write a comment", "Agreed, with one caveat.");
      press("Send");
    },
    sent: ["POST /signal/api/threads/1/comments"],
    bodies: [{ text: "Agreed, with one caveat." }],
  },
  {
    name: "a reply to a comment",
    at: "group/1/thread/1",
    ready: "Thread",
    steps: () => {
      press("Reply to Ines K");
      type(/Write a/, "Which date?");
      press("Send");
    },
    sent: ["POST /signal/api/comments/1/replies"],
    bodies: [{ text: "Which date?" }],
  },
  {
    name: "a reaction given",
    at: "group/1/thread/1",
    ready: "Thread",
    steps: () => {
      press("Disagree: comment by Ines K");
    },
    sent: ["POST /signal/api/comments/1/reactions/disagree"],
    bodies: [],
  },
  {
    name: "a reaction taken back",
    at: "group/1/thread/1",
    ready: "Thread",
    steps: () => {
      press("Agree, 2: comment by Ines K");
    },
    sent: ["DELETE /signal/api/comments/1/reactions/agree"],
    bodies: [],
  },
  {
    name: "a comment edited by its author",
    at: "group/1/thread/1",
    ready: "Thread",
    given: mayChange({ "2": { canEdit: true }, "4": { canEdit: false } }),
    steps: () => {
      press("Edit your comment");
      type("Edit your comment", "  Agreed. Check the covenant test date.  ");
      press("Save");
    },
    sent: ["POST /signal/api/comments/2/edit"],
    bodies: [{ text: "Agreed. Check the covenant test date." }],
  },
  {
    name: "a comment removed by its author, once the question is answered",
    at: "group/1/thread/1",
    ready: "Thread",
    given: mayChange({ "2": { canRemove: false }, "4": { canRemove: true } }),
    steps: () => {
      press("Remove your comment");
      press("Remove");
    },
    sent: ["DELETE /signal/api/comments/4"],
    bodies: [],
  },
  {
    name: "a thread rule, to its own group",
    at: "settings/thread-rules",
    ready: "Settings",
    steps: () => {
      flipIn("Leveraged credit", "Archive a thread after 90 days without a comment");
    },
    sent: ["POST /signal/api/groups/1/rules"],
    bodies: [{ rule: "archive-quiet", on: true }],
  },
  {
    name: "a group renamed",
    at: "settings/groups",
    ready: "Settings",
    steps: () => {
      press("Rename: Shipping desk");
      type(/^Name/, "  Shipping and ports ");
      press("Rename group");
    },
    sent: ["POST /signal/api/groups/2/rename"],
    bodies: [{ name: "Shipping and ports" }],
  },
  {
    name: "a group deleted, once the question is answered",
    at: "settings/groups",
    ready: "Settings",
    steps: () => {
      press("Delete: Shipping desk");
      press("Delete group");
    },
    sent: ["DELETE /signal/api/groups/2"],
    bodies: [],
  },
  {
    name: "the topics that post into a group: the whole set",
    at: "settings/groups",
    ready: "Settings",
    given: (snapshot) => {
      const group = snapshot.settings.groups.find((one) => one.id === "1");
      if (group !== undefined) group.topics = ["2"];
    },
    steps: () => {
      press("Topics: Leveraged credit");
      flip("Packaging");
      flip("Telecoms");
      flip("Shipping");
      press("Save");
    },
    sent: ["POST /signal/api/groups/1/topics"],
    bodies: [{ topics: ["1", "3"] }],
  },
  {
    name: "a notification choice",
    at: "settings/notifications",
    ready: "Settings",
    steps: () => {
      flip("A reply to one of my comments, In Signal");
    },
    sent: ["POST /signal/api/notifications"],
    bodies: [{ event: "replies", channel: "inSignal", on: false }],
  },
  {
    name: "who can see a group",
    at: "settings/groups",
    ready: "Settings",
    steps: () => {
      choose(/Visibility: Committee prep/, "Visible to everyone");
    },
    sent: ["POST /signal/api/groups/3/visibility"],
    bodies: [{ visibility: "everyone" }],
  },
  {
    name: "New group",
    at: "settings/groups",
    ready: "Settings",
    steps: () => {
      press("New group");
      type(/^Name/, " Rates desk ");
      choose(/Who can see it/, "Members only");
      press("Add group");
    },
    sent: ["POST /signal/api/groups"],
    bodies: [{ name: "Rates desk", visibility: "invited" }],
  },
  {
    name: "a member added",
    at: "settings/groups",
    ready: "Settings",
    steps: () => {
      press("Edit members: Shipping desk");
      type(/^Add a member/, "Ines K");
      press("Save members");
    },
    sent: ["POST /signal/api/groups/2/members"],
    bodies: [{ name: "Ines K" }],
  },
  {
    name: "a member removed",
    at: "settings/groups",
    ready: "Settings",
    steps: () => {
      press("Edit members: Shipping desk");
      type(/^Remove a member/, "Amir S");
      press("Save members");
    },
    sent: ["POST /signal/api/groups/2/members/remove"],
    bodies: [{ name: "Amir S" }],
  },
  {
    name: "New topic",
    at: "settings/topics",
    ready: "Settings",
    steps: () => {
      press("New topic");
      type(/^Name/, "Retail");
      type(/^Keywords/, "stores, footfall ,");
      flip("News");
      flip("Rating actions");
      press("Add topic");
    },
    sent: ["POST /signal/api/topics"],
    bodies: [{ name: "Retail", keywords: ["stores", "footfall"], kinds: ["news", "ratings"] }],
  },
  {
    name: "a topic changed, from what it holds",
    at: "settings/topics",
    ready: "Settings",
    steps: () => {
      press("Edit: Telecoms");
      type(/^Name/, "Telecoms and towers");
      press("Save topic");
    },
    sent: ["POST /signal/api/topics/2/edit"],
    bodies: [
      {
        name: "Telecoms and towers",
        keywords: ["Tessaly", "towers"],
        kinds: ["news", "regulator"],
      },
    ],
  },
  {
    name: "a topic deleted",
    at: "settings/topics",
    ready: "Settings",
    steps: () => {
      press("Edit: Shipping");
      press("Delete topic");
    },
    sent: ["DELETE /signal/api/topics/3"],
    bodies: [],
  },
  {
    name: "a source proposed",
    at: "settings/sources",
    ready: "Settings",
    steps: () => {
      press("Propose a source");
      type(/^Name/, "Port Bulletin");
      choose(/Kind/, "Research");
      type(/^Feed address/, "https://port-bulletin.example/feed");
      press("Propose");
    },
    sent: ["POST /signal/api/sources"],
    bodies: [
      { name: "Port Bulletin", kind: "research", url: "https://port-bulletin.example/feed" },
    ],
  },
  {
    name: "a new digest, with the strings the service delivered",
    at: "settings/digests",
    ready: "Settings",
    steps: () => {
      type(/^Name/, "Weekly credit");
      choose(/Covers/, "Group: Leveraged credit");
      press("Save digest");
    },
    sent: ["POST /signal/api/digests"],
    bodies: [
      {
        name: "Weekly credit",
        covers: "Group: Leveraged credit",
        schedule: "Weekly, Friday 07:00 UTC",
        length: "Up to 5 points",
        brief: "",
      },
    ],
  },
  {
    name: "a digest changed, posting back what the service holds for it",
    at: "settings/digests",
    ready: "Settings",
    steps: () => {
      press("Edit: Weekly packaging");
      type(/^Brief/, "Lead with plant closures.");
      press("Save digest");
    },
    sent: ["POST /signal/api/digests/2/edit"],
    bodies: [
      {
        name: "Weekly packaging",
        covers: "Topic: Packaging",
        schedule: "Weekly, Friday 07:00 UTC",
        length: "Up to 5 points",
        brief: "Lead with plant closures.",
        upcoming: "",
        lookAhead: 7,
      },
    ],
  },
  {
    name: "a digest deleted",
    at: "settings/digests",
    ready: "Settings",
    steps: () => {
      press("Delete: Daily shipping");
    },
    sent: ["DELETE /signal/api/digests/1"],
    bodies: [],
  },
  {
    name: "a digest run once now",
    at: "settings/digests",
    ready: "Settings",
    steps: () => {
      press("Run once now: Daily shipping");
    },
    sent: ["POST /signal/api/digests/1/run"],
    bodies: [],
  },
];

/** A thread's panel asks for its thread in full, which may still be on its way when the steps begin. */
const READ_AGAIN = /^GET \/signal\/api\/snapshot(\?thread=\d+)?$/;
const sinceFirstWrite = (calls: string[]) =>
  calls.slice(
    Math.max(
      0,
      calls.findIndex((call) => !call.startsWith(READ)),
    ),
  );

const drawn = (name: string) => screen.findByRole("heading", { name, hidden: true });
const parsed = (bodies: unknown[]) => bodies.map((body) => JSON.parse(body as string) as unknown);

describe.each(CASES)("$name", ({ at, ready, steps, sent, bodies, given }) => {
  it("is sent as the service takes it, and the snapshot is read again", async () => {
    const service = serve(currentWith(given));
    showLive(`#/signal/main/${at}`);
    await drawn(ready);
    const before = service.calls.length;
    steps();
    await waitFor(() => {
      expect(sinceFirstWrite(service.calls.slice(before))).toEqual([
        ...sent,
        expect.stringMatching(READ_AGAIN),
      ]);
    });
    expect(parsed(service.bodies)).toEqual(bodies);
    expect(screen.queryByText(REFUSED)).toBeNull();
    expect(document.body).not.toHaveTextContent(/sample/i);
  });

  it("refused, shows the service's sentence and reads nothing again", async () => {
    const service = serve(currentWith(given));
    for (const call of sent) service.replies.set(call, refusal(409, REFUSED));
    showLive(`#/signal/main/${at}`);
    await drawn(ready);
    const before = service.calls.length;
    steps();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(`Error: ${REFUSED}`);
    expect(sinceFirstWrite(service.calls.slice(before))).toEqual(sent.slice(0, 1));
  });
});

describe("what a form does with the answer", () => {
  it("closes once the service accepts, and stays open on what was typed when it refuses", async () => {
    const service = serve(currentWith());
    service.replies.set("POST /signal/api/topics", refusal(409, "a topic has that name already"));
    showLive("#/signal/main/settings/topics");
    await drawn("Settings");
    press("New topic");
    type(/^Name/, "Shipping");
    press("Add topic");
    const dialog = within(await screen.findByRole("dialog", { name: "New topic" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent("a topic has that name already");
    expect(dialog.getByRole("textbox", { name: /^Name/ })).toHaveValue("Shipping");
    service.replies.delete("POST /signal/api/topics");
    type(/^Name/, "Ports");
    press("Add topic");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("asks for what a form needs before anything is sent", async () => {
    const service = serve(currentWith());
    showLive("#/signal/main/settings/sources");
    await drawn("Settings");
    press("Propose a source");
    press("Propose");
    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveAccessibleDescription(
      "Error: Enter the source's name.",
    );
    press("Cancel");
    expect(service.writes()).toEqual([]);
  });

  it("sends a member added before a member removed, and stops at a refusal", async () => {
    const service = serve(currentWith());
    service.replies.set("POST /signal/api/groups/2/members", refusal(404, "no user Ines Q"));
    showLive("#/signal/main/settings/groups");
    await drawn("Settings");
    press("Edit members: Shipping desk");
    type(/^Add a member/, "Ines Q");
    type(/^Remove a member/, "Amir S");
    press("Save members");
    expect(await screen.findByRole("alert")).toHaveTextContent("no user Ines Q");
    expect(service.writes()).toEqual(["POST /signal/api/groups/2/members"]);
    service.replies.delete("POST /signal/api/groups/2/members");
    press("Save members");
    await waitFor(() => {
      expect(service.writes()).toEqual([
        "POST /signal/api/groups/2/members",
        "POST /signal/api/groups/2/members",
        "POST /signal/api/groups/2/members/remove",
      ]);
    });
  });
});

describe("what the service says about a write it accepted", () => {
  it("shows a run's own message: a paused digest writes no issue, and says so", async () => {
    const message = "2 stories are in scope, but the AI pass is off, so no issue was written.";
    const service = serve(currentWith());
    service.replies.set("POST /signal/api/digests/1/run", () =>
      Response.json({ outcome: "skipped", issueId: null, stories: 2, message }),
    );
    showLive("#/signal/main/settings/digests");
    await drawn("Settings");
    const row = within(screen.getByRole("list", { name: "Your digests" }));
    expect(
      row.getAllByText(
        "No new digest is written while AI is off or at its cap. Earlier digests stay readable.",
      ),
    ).toHaveLength(2);
    press("Run once now: Daily shipping");
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("says a story was shared, and the dialog goes", async () => {
    serve(currentWith());
    showLive("#/signal/main/feed/latest");
    await drawn("Latest");
    press(`Share to group: ${TESSALY}`);
    choose(/Group/, "Leveraged credit");
    press("Share");
    expect(await screen.findByText("The story was shared.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the share dialog open, note and all, when the service refuses", async () => {
    const service = serve(currentWith());
    service.replies.set("POST /signal/api/groups/1/threads", refusal(403, "writers only"));
    showLive("#/signal/main/feed/latest");
    await drawn("Latest");
    press(`Share to group: ${TESSALY}`);
    choose(/Group/, "Leveraged credit");
    type(/Note \(optional\)/, "For Thursday.");
    press("Share");
    const dialog = within(await screen.findByRole("dialog"));
    expect(await dialog.findByRole("alert")).toHaveTextContent("writers only");
    expect(dialog.getByRole("textbox", { name: /Note/ })).toHaveValue("For Thursday.");
  });
});

describe("a thread's panel", () => {
  it("asks for the snapshot that carries that thread's comments, and again for another thread", async () => {
    const service = serve(currentWith());
    showLive("#/signal/main/group/1/thread/1");
    await drawn("Thread");
    await waitFor(() => {
      expect(service.calls).toEqual([READ, `${READ}?thread=1`]);
    });
    window.location.hash = "#/signal/main/group/1/thread/3";
    await waitFor(() => {
      expect(service.calls.filter((call) => call.startsWith(READ)).at(-1)).toBe(`${READ}?thread=3`);
    });
    // Back on the group's page nothing more is asked: the snapshot in hand holds it.
    const reads = service.reads();
    window.location.hash = "#/signal/main/group/1";
    await screen.findByRole("heading", { level: 1, name: "Leveraged credit" });
    expect(service.reads()).toBe(reads);
  });

  it("draws a thread delivered without its comments, then the comments once they arrive", async () => {
    const service = serve(
      currentWith((s) => {
        const first = s.threads.find((thread) => thread.id === "1");
        if (first !== undefined) first.comments = [];
      }),
    );
    service.replies.set(`${READ}?thread=1`, () => Response.json(currentWith()));
    showLive("#/signal/main/group/1/thread/1");
    const panel = within(await screen.findByRole("dialog"));
    // The comment itself, and the reply that quotes it.
    expect(await panel.findAllByText("Sharing for Thursday.")).toHaveLength(2);
    expect(service.calls).toEqual([READ, `${READ}?thread=1`]);
  });
});

describe("marks sent for the reader", () => {
  it("tells the service a thread was read when it opens with something unread", async () => {
    const service = serve(currentWith());
    showLive("#/signal/main/group/1/thread/2");
    await drawn("Thread");
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/threads/2/read"]);
    });
  });

  it("sends no mark for a thread already read, and says nothing when a mark is refused", async () => {
    const service = serve(currentWith());
    service.replies.set("POST /signal/api/threads/2/read", refusal(404, "no thread 2"));
    showLive("#/signal/main/group/1/thread/1");
    await drawn("Thread");
    expect(service.writes()).toEqual([]);
    window.location.hash = "#/signal/main/group/1/thread/2";
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/threads/2/read"]);
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("tells the service a digest was read when its page opens with an unread issue", async () => {
    const service = serve(currentWith());
    showLive("#/signal/main/digest/1");
    await drawn("Daily shipping");
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/digests/1/read"]);
    });
    service.calls.length = 0;
    window.location.hash = "#/signal/main/digest/2";
    await drawn("Weekly packaging");
    expect(service.writes()).toEqual([]);
  });
});

describe("a reader on a service", () => {
  const reader = (snapshot: Snapshot) => {
    snapshot.viewer = { name: "Tobias O", initials: "TO", role: "reader", roleLabel: "Reader" };
  };

  it("is shown a thread's reactions as counts, with no button and no reply box", async () => {
    serve(currentWith(reader));
    showLive("#/signal/main/group/1/thread/1");
    const panel = within(await screen.findByRole("dialog"));
    const reactions = within(
      panel.getByRole("list", { name: "Reactions to the comment by Ines K" }),
    );
    expect(reactions.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Agree 2",
      "Seen 1",
    ]);
    expect(panel.queryByRole("button", { name: /: comment by|^Reply to/ })).toBeNull();
    expect(panel.queryByRole("textbox")).toBeNull();
    expect(panel.getByText("Readers see this thread but not the reply box.")).toBeInTheDocument();
  });

  it("is offered no writer's control on the feed, a group or Settings", async () => {
    serve(currentWith(reader));
    showLive("#/signal/main/feed/latest");
    await drawn("Latest");
    expect(screen.queryByRole("button", { name: /^(Comment|Share to group)/ })).toBeNull();
    window.location.hash = "#/signal/main/group/1";
    await drawn("Leveraged credit");
    expect(screen.queryByRole("button", { name: /^(New thread|Attach story)$/ })).toBeNull();
    window.location.hash = "#/signal/main/settings/topics";
    await drawn("Settings");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Topics",
      "Digests",
      "Notifications",
    ]);
    expect(screen.queryByRole("button", { name: /^(New topic|Edit: )/ })).toBeNull();
    window.location.hash = "#/signal/main/settings/groups";
    expect(await screen.findByText("This section is for writers")).toBeInTheDocument();
  });

  it("builds a digest of their own from Settings", async () => {
    const service = serve(currentWith(reader));
    showLive("#/signal/main/settings/digests");
    await drawn("Settings");
    type(/^Name/, "Weekly credit");
    press("Save digest");
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/digests"]);
    });
    expect(parsed(service.bodies)[0]).toMatchObject({ name: "Weekly credit" });
  });

  it("opens a digest from the channel list", async () => {
    serve(currentWith(reader));
    showLive("#/signal/main/digest/2");
    await drawn("Weekly packaging");
  });

  it("is offered one switch per notification event, never the desktop", async () => {
    const service = serve(currentWith(reader));
    showLive("#/signal/main/settings/notifications");
    await drawn("Settings");
    const names = screen.getAllByRole("switch").map((s) => s.getAttribute("aria-label"));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name?.endsWith(", In Signal"))).toBe(true);
    expect(screen.queryByText("On the desktop")).toBeNull();
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Event",
      "In Signal",
    ]);
    expect(service.writes()).toEqual([]);
  });

  it("can still choose their own notifications", async () => {
    const service = serve(currentWith(reader));
    showLive("#/signal/main/settings/notifications");
    await drawn("Settings");
    flip("A new thread in one of my groups, In Signal");
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/notifications"]);
    });
    expect(parsed(service.bodies)).toEqual([{ event: "threads", channel: "inSignal", on: false }]);
  });
});
