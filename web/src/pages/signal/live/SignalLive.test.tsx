// The live Signal page over the service's sample snapshot, on a stand-in for the local server.
// Headlines, names, counts and sentences are the sample's and the service's, written out by hand.
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import {
  arrival,
  content,
  go,
  lookAgain,
  never,
  refusal,
  sampleWith,
  serve,
  showLive,
  unsaved,
  type Snapshot,
} from "./test-helpers";
import { TIMEOUT_MS } from "./service";
import { REREAD_MS } from "./useLiveSignal";

const TESSALY = "Tessaly Telecom agrees the sale of its towers";
const CORVANE = "Corvane Packaging to close two plants as volumes fall";
const BRIGHTWELL = "Brightwell Foods extends its term loan by three years";
const HALVORSEN = "Northgate Ratings downgrades Halvorsen Marine to B+";
const REVIEW = "Authority opens a review of the Tessaly Telecom tower sale";
const LENMARK = "Lenmark Shipping refinances its fleet loan";
const CHIEF = "Tessaly Telecom names a new finance chief";
const READ = "GET /signal/api/snapshot";

const title = (name: string) => screen.findByRole("heading", { level: 1, name });
const headlines = () =>
  content()
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
const channels = () => within(screen.getByRole("navigation", { name: "Signal" }));
const saveButton = (headline: string) =>
  content().getByRole("button", { name: new RegExp(`^Saved?: ${headline}`) });
const star = (topic: string) => channels().getByRole("button", { name: new RegExp(` ${topic}$`) });

/** The sample as a first visit gets it: no name, so no stories, no counts and nothing followed. */
function unnamed(snapshot: Snapshot) {
  snapshot.viewer = { name: null, initials: null, role: "reader", roleLabel: "Reader" };
  snapshot.channels.savedCount = null;
  for (const topic of snapshot.channels.topics)
    Object.assign(topic, { count: null, followed: false });
  const none = () => ({ top: [], latest: [], waiting: null, older: [] });
  snapshot.feed.stories = [];
  snapshot.feed.views = { "for-you": none(), latest: none(), saved: none() };
  for (const id of Object.keys(snapshot.feed.topics)) snapshot.feed.topics[id] = none();
}

describe("arriving", () => {
  it("draws a skeleton, reads the snapshot once and draws For you at the bare address", async () => {
    const service = serve();
    showLive();
    expect(screen.getByRole("heading", { level: 1, name: "Signal" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Stories" })).toHaveAttribute("aria-busy", "true");
    await title("For you");
    expect(headlines()).toEqual([CORVANE]);
    expect(service.calls).toEqual([READ]);
    const [path, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(path).toBe("/signal/api/snapshot");
    expect(init).toMatchObject({ cache: "no-store" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each(["#/", "#/signal", "#/signal/"])("draws For you at %s too", async (hash) => {
    serve();
    showLive(hash);
    await title("For you");
  });

  it("draws Latest in the service's order, with the viewer and the delivered counts", async () => {
    serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    expect(headlines()).toEqual([TESSALY, CORVANE, BRIGHTWELL, HALVORSEN, REVIEW, LENMARK]);
    expect(channels().getByRole("button", { name: /Mara L/ })).toHaveTextContent("Writer");
    expect(channels().getByRole("link", { name: /^Saved/ })).toHaveTextContent("Saved 1");
    expect(channels().getByRole("link", { name: /^Telecoms/ })).toHaveTextContent("Telecoms 2");
    expect(content().getByText("Sources checked 6 min ago · 1 source failing")).toBeInTheDocument();
  });

  it("draws a topic with its keywords and follow state", async () => {
    serve();
    showLive("#/signal/main/topic/2");
    await title("Telecoms");
    expect(headlines()).toEqual([TESSALY, REVIEW]);
    expect(content().getByRole("button", { name: "Follow" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    const keywords = within(content().getByRole("list", { name: "Topic keywords" }));
    expect(keywords.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Tessaly",
      "towers",
    ]);
  });

  it("draws Saved with the saved story pressed", async () => {
    serve();
    showLive("#/signal/main/feed/saved");
    await title("Saved");
    expect(headlines()).toEqual([HALVORSEN]);
    expect(saveButton(HALVORSEN)).toHaveAttribute("aria-pressed", "true");
  });

  it("moves between screens on the hash without reading again", async () => {
    const service = serve();
    showLive();
    await title("For you");
    expect(channels().getByRole("link", { name: /^Latest/ })).toHaveAttribute(
      "href",
      "#/signal/main/feed/latest",
    );
    await go("#/signal/main/feed/latest");
    await title("Latest");
    await go("#/signal/main/settings/topics");
    await title("Settings");
    expect(service.calls).toEqual([READ]);
  });
});

describe("moving to another screen", () => {
  it("starts it at the top, and a later read leaves the place alone", async () => {
    const service = serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    const region = document.getElementById("signal-content") as HTMLElement;
    const offsets: number[] = [];
    Object.defineProperty(region, "scrollTop", {
      configurable: true,
      get: () => offsets.at(-1) ?? 0,
      set: (offset: number) => offsets.push(offset),
    });
    region.scrollTop = 480;
    service.snapshot = sampleWith(arrival("7", CHIEF));
    await lookAgain();
    expect(offsets).toEqual([480]);
    await go("#/signal/main/topic/2");
    await title("Telecoms");
    expect(offsets).toEqual([480, 0]);
  });
});

describe("addresses that name nothing", () => {
  it.each([
    "#/library/acme/2026/overview",
    "#/signal/other/feed/for-you",
    "#/signal/main/topic/%E0%A4%A",
    "#/signal/main/feed",
    "#//",
  ])("says so at %s, with the way back and no sample wording", async (hash) => {
    serve();
    showLive(hash);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to For you" })).toHaveAttribute(
      "href",
      "#/signal/main/feed/for-you",
    );
    await act(() => Promise.resolve());
    expect(document.body).not.toHaveTextContent(/sample/i);
  });

  it.each([
    ["#/signal/main/feed/top", "No such view"],
    ["#/signal/main/topic/99", "No such topic"],
    ["#/signal/main/topic/__proto__", "No such topic"],
    ["#/signal/main/topic/%3Cscript%3E", "No such topic"],
    ["#/signal/main/digest/weekly-brief", "No such digest"],
    ["#/signal/main/group/desk", "This group does not exist or is not open to you."],
    ["#/signal/main/group/desk/thread/1", "This group does not exist or is not open to you."],
    ["#/signal/main/settings/billing", "Settings"],
  ])("draws the frame's own state at %s", async (hash, name) => {
    serve();
    showLive(hash);
    await title(name);
    expect(document.body).not.toHaveTextContent(/sample/i);
  });
});

describe("no control pretends to save", () => {
  it("draws a writer's story with Save and Open source only", async () => {
    serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    const card = within(content().getAllByRole("article")[0] as HTMLElement);
    expect(card.getAllByRole("button").map((button) => button.textContent)).toEqual(["Save"]);
    expect(card.getByRole("link", { name: /Open source/ })).toHaveAttribute(
      "href",
      "https://harbour-wire.example/tessaly",
    );
    expect(content().queryByRole("button", { name: /Comment|Share to group/ })).toBeNull();
  });

  it("offers no source proposal from an empty feed", async () => {
    serve(
      sampleWith((s) => {
        unnamed(s);
        s.viewer = { name: "Mara L", initials: "ML", role: "writer", roleLabel: "Writer" };
        s.feed.sources.approved = false;
        s.feed.freshness = { state: "not-checked", checked: null, failing: null, error: null };
        s.settings.sources = [];
      }),
    );
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    expect(content().getByRole("heading", { level: 2 })).toHaveTextContent(
      "No approved sources yet",
    );
    expect(content().queryByRole("link", { name: "Propose a source" })).toBeNull();
  });

  it("lists the empty channel sections as empty", async () => {
    serve();
    showLive();
    await title("For you");
    expect(channels().getByText("No groups yet")).toBeInTheDocument();
    expect(channels().getByText("No digests yet")).toBeInTheDocument();
    // No list is drawn with nothing in it.
    for (const list of channels().getAllByRole("list")) {
      expect(within(list).getAllByRole("listitem").length).toBeGreaterThan(0);
    }
  });

  const section = async (id: string, name: string) => {
    serve();
    showLive(`#/signal/main/settings/${id}`);
    await title("Settings");
    return within(content().getByRole("region", { name }));
  };

  it("Groups: none yet, and New group is unavailable with the reason", async () => {
    const groups = await section("groups", "Groups");
    expect(groups.getByText("No groups yet.")).toBeInTheDocument();
    const add = groups.getByRole("button", { name: "New group" });
    expect(add).toBeDisabled();
    expect(add).toHaveAccessibleDescription(
      "Groups cannot be created or changed from this page yet.",
    );
  });

  it("Thread rules and Notifications: none yet, and no switch", async () => {
    const rules = await section("thread-rules", "Thread rules");
    expect(rules.getByText("No thread rules yet.")).toBeInTheDocument();
    await go("#/signal/main/settings/notifications");
    const events = within(content().getByRole("region", { name: "Notifications" }));
    expect(events.getByText("No notification events yet.")).toBeInTheDocument();
    expect(content().queryByRole("switch")).toBeNull();
  });

  it("Sources: the service's sources, and proposing is unavailable with the reason", async () => {
    const sources = await section("sources", "Sources");
    const names = sources.getAllByRole("rowheader").map((cell) => cell.querySelector("b"));
    expect(names.map((name) => name?.textContent)).toContain("Harbour Wire");
    const propose = sources.getByRole("button", { name: "Propose a source" });
    expect(propose).toBeDisabled();
    expect(propose).toHaveAccessibleDescription("Sources cannot be proposed from this page yet.");
  });

  it("Topics: the service's topics, and editing is unavailable with the reason", async () => {
    const topics = await section("topics", "Topics");
    expect(topics.getByText("Telecoms")).toBeInTheDocument();
    for (const name of ["New topic", "Edit: Telecoms"]) {
      const button = topics.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription(
        "Topics cannot be created or changed from this page yet.",
      );
    }
  });

  it("Digests: none yet and no form to fill in", async () => {
    const digests = await section("digests", "Digests");
    expect(
      digests.getByText("No digests yet. Digests cannot be set up from this page yet."),
    ).toBeInTheDocument();
    expect(content().queryByRole("textbox")).toBeNull();
    expect(content().queryByRole("button", { name: /Save digest|Run once now/ })).toBeNull();
  });

  it("AI and cost: off with the service's notice, no spend and no switch", async () => {
    const ai = await section("ai", "AI and cost");
    expect(ai.getByText("AI is off")).toBeInTheDocument();
    expect(ai.getByText(/The AI pass is not set up on this Signal service\./)).toBeInTheDocument();
    expect(ai.getByText("n.a.")).toBeInTheDocument();
    expect(content().queryByRole("switch")).toBeNull();
  });

  it.each(["groups", "thread-rules", "sources", "topics", "digests", "notifications", "ai"])(
    "says nothing of sample data in %s",
    async (id) => {
      serve();
      showLive(`#/signal/main/settings/${id}`);
      await title("Settings");
      expect(document.body).not.toHaveTextContent(/sample/i);
    },
  );
});

describe("a viewer with no name", () => {
  const typeName = (name: string) => {
    const box = within(screen.getByRole("dialog", { name: "Your name" }));
    fireEvent.change(box.getByRole("textbox", { name: /Display name/ }), {
      target: { value: name },
    });
    fireEvent.click(box.getByRole("button", { name: "Continue" }));
  };

  it("is asked for one; the name goes to the service and the snapshot is read again", async () => {
    const service = serve(sampleWith(unnamed));
    service.replies.set("POST /signal/api/me", () => {
      service.snapshot = sampleWith();
      return Response.json({ name: "Mara L", role: "writer" });
    });
    showLive();
    const box = await screen.findByRole("dialog", { name: "Your name" });
    expect(within(box).queryByRole("button", { name: "Cancel" })).toBeNull();
    typeName("  mara l ");
    await waitFor(() => {
      expect(service.calls).toEqual([READ, "POST /signal/api/me", READ]);
    });
    expect(service.bodies).toEqual(['{"name":"mara l"}']);
    // The name and role are the service's, and the feed is the named viewer's.
    expect(await channels().findByRole("button", { name: /Mara L/ })).toHaveTextContent("Writer");
    expect(headlines()).toEqual([CORVANE]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("gets the service's sentence in the dialog, on the name it refused", async () => {
    const service = serve(sampleWith(unnamed));
    service.replies.set("POST /signal/api/me", refusal(400, "display name is empty"));
    showLive();
    await screen.findByRole("dialog", { name: "Your name" });
    typeName("​");
    const box = within(await screen.findByRole("dialog", { name: "Your name" }));
    const field = await box.findByRole("textbox", { name: /Display name/ });
    await waitFor(() => {
      expect(field).toHaveAccessibleDescription("Error: display name is empty");
    });
    expect(field).toHaveValue("​");
    expect(field).toBeInvalid();
    expect(box.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(service.calls).toEqual([READ, "POST /signal/api/me"]);
    expect(screen.getByRole("button", { name: /Set your name/, hidden: true })).toBeInTheDocument();
  });
});

describe("saving and following", () => {
  it("saves at once, tells the service and reads the snapshot again", async () => {
    const service = serve();
    service.replies.set("POST /signal/api/stories/1/save", () => {
      service.snapshot = sampleWith((s) => {
        s.channels.savedCount = "2";
        s.feed.views.saved.top.unshift("1");
        s.feed.views.saved.latest.unshift("1");
        for (const story of s.feed.stories) if (story.id === "1") story.saved = true;
      });
      return Response.json({ saved: true });
    });
    showLive();
    await title("For you");
    fireEvent.click(saveButton(CORVANE));
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(channels().getByRole("link", { name: /^Saved/ })).toHaveTextContent("Saved 2");
    });
    expect(service.calls).toEqual([READ, "POST /signal/api/stories/1/save", READ]);
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("unsaves with DELETE, and the Saved view on screen lets the story go", async () => {
    const service = serve();
    service.replies.set("DELETE /signal/api/stories/5/save", () => {
      service.snapshot = sampleWith(unsaved);
      return Response.json({ saved: false });
    });
    showLive("#/signal/main/feed/saved");
    await title("Saved");
    fireEvent.click(saveButton(HALVORSEN));
    expect(saveButton(HALVORSEN)).toHaveAttribute("aria-pressed", "false");
    expect(await content().findByText("Stories you save appear here")).toBeInTheDocument();
    expect(service.writes()).toEqual(["DELETE /signal/api/stories/5/save"]);
  });

  it("puts a refused save back and shows the service's sentence as given", async () => {
    const service = serve();
    service.replies.set(
      "POST /signal/api/stories/1/save",
      refusal(401, "set a display name before saving"),
    );
    showLive();
    await title("For you");
    fireEvent.click(saveButton(CORVANE));
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "true");
    expect(await content().findByRole("alert")).toHaveTextContent(
      "Error: set a display name before saving",
    );
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "false");
    // Nothing was written, so nothing is read again.
    expect(service.calls).toEqual([READ, "POST /signal/api/stories/1/save"]);
  });

  it("takes the refusal away on the next press and on another page", async () => {
    const service = serve();
    service.replies.set("POST /signal/api/stories/1/save", refusal(500, "the service failed"));
    showLive();
    await title("For you");
    fireEvent.click(saveButton(CORVANE));
    await content().findByRole("alert");
    await go("#/signal/main/feed/latest");
    await title("Latest");
    expect(content().queryByRole("alert")).toBeNull();
    fireEvent.click(saveButton(CORVANE));
    await content().findByRole("alert");
    service.replies.delete("POST /signal/api/stories/1/save");
    fireEvent.click(saveButton(CORVANE));
    expect(content().queryByRole("alert")).toBeNull();
  });

  it("follows from the channel list, tells the service and reads again", async () => {
    const service = serve();
    service.replies.set("POST /signal/api/topics/2/follow", () => {
      service.snapshot = sampleWith((s) => {
        for (const topic of s.channels.topics) if (topic.id === "2") topic.followed = true;
      });
      return Response.json({ following: true });
    });
    showLive("#/signal/main/topic/2");
    await title("Telecoms");
    fireEvent.click(star("Telecoms"));
    expect(star("Telecoms")).toHaveAttribute("aria-pressed", "true");
    expect(content().getByRole("button", { name: "Following" })).toBeInTheDocument();
    await waitFor(() => {
      expect(service.calls).toEqual([READ, "POST /signal/api/topics/2/follow", READ]);
    });
    expect(star("Telecoms")).toHaveAttribute("aria-pressed", "true");
  });

  it("unfollows with DELETE; refused, the star goes back and the sentence is shown", async () => {
    const service = serve();
    service.replies.set("DELETE /signal/api/topics/1/follow", refusal(404, "no topic 1"));
    showLive();
    await title("For you");
    fireEvent.click(star("Packaging"));
    expect(star("Packaging")).toHaveAttribute("aria-pressed", "false");
    expect(await content().findByRole("alert")).toHaveTextContent("Error: no topic 1");
    expect(star("Packaging")).toHaveAttribute("aria-pressed", "true");
  });

  it("says the service cannot be reached when a write never leaves", async () => {
    const service = serve();
    service.replies.set("POST /signal/api/stories/1/save", () =>
      Promise.reject(new TypeError("Failed to fetch")),
    );
    showLive();
    await title("For you");
    fireEvent.click(saveButton(CORVANE));
    expect(await content().findByRole("alert")).toHaveTextContent(
      "The service cannot be reached. Try again, or ask whoever runs the service to check it.",
    );
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "false");
  });

  it("sends two quick presses in order and ends on the second", async () => {
    const service = serve();
    showLive();
    await title("For you");
    fireEvent.click(saveButton(CORVANE));
    fireEvent.click(saveButton(CORVANE));
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => {
      expect(service.calls).toEqual([
        READ,
        "POST /signal/api/stories/1/save",
        READ,
        "DELETE /signal/api/stories/1/save",
        READ,
      ]);
    });
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the second press when the first is refused while it is out", async () => {
    const service = serve();
    service.replies.set("POST /signal/api/stories/1/save", refusal(500, "the service failed"));
    showLive();
    await title("For you");
    fireEvent.click(saveButton(CORVANE));
    fireEvent.click(saveButton(CORVANE));
    await waitFor(() => {
      expect(service.writes()).toEqual([
        "POST /signal/api/stories/1/save",
        "DELETE /signal/api/stories/1/save",
      ]);
    });
    await content().findByRole("alert");
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "false");
  });
});

describe("a write that never answers", () => {
  it("is given up, put back and said so, and the next write still goes", async () => {
    vi.useFakeTimers();
    const service = serve();
    service.replies.set("POST /signal/api/stories/1/save", never);
    showLive();
    await act(() => vi.advanceTimersByTimeAsync(0));
    fireEvent.click(saveButton(CORVANE));
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "true");
    await act(() => vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1));
    expect(content().queryByRole("alert")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(content().getByRole("alert")).toHaveTextContent(
      "Signal did not answer in time. Try again.",
    );
    expect(saveButton(CORVANE)).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(star("Telecoms"));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(service.writes()).toEqual([
      "POST /signal/api/stories/1/save",
      "POST /signal/api/topics/2/follow",
    ]);
  });
});

describe("reading again", () => {
  it("keeps the list as drawn and puts a new story behind the pill, then Show", async () => {
    const service = serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    service.snapshot = sampleWith(arrival("7", CHIEF));
    await lookAgain();
    expect(service.calls).toEqual([READ, READ]);
    expect(headlines()).toEqual([TESSALY, CORVANE, BRIGHTWELL, HALVORSEN, REVIEW, LENMARK]);
    // The pill arrives in a live region that was on the page before it, so it is announced.
    expect(content().getByText("1 new story").closest("[aria-live]")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    // What is not the list on screen is the service's newest.
    expect(channels().getByRole("link", { name: /^Telecoms/ })).toHaveTextContent("Telecoms 3");
    fireEvent.click(content().getByRole("button", { name: "Show 1 new story" }));
    expect(headlines()).toEqual([CHIEF, TESSALY, CORVANE, BRIGHTWELL, HALVORSEN, REVIEW, LENMARK]);
    expect(content().queryByText("1 new story")).toBeNull();
    expect(document.activeElement).toHaveTextContent(CHIEF);
  });

  it("starts a pill of its own for what arrives after Show", async () => {
    const service = serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    service.snapshot = sampleWith(arrival("7", CHIEF));
    await lookAgain();
    fireEvent.click(content().getByRole("button", { name: "Show 1 new story" }));
    service.snapshot = sampleWith((s) => {
      arrival("7", CHIEF)(s);
      arrival("8", "Tessaly Telecom prices a new bond")(s);
      arrival("9", "Tessaly Telecom completes the tower sale")(s);
    });
    await lookAgain();
    expect(headlines()).toEqual([CHIEF, TESSALY, CORVANE, BRIGHTWELL, HALVORSEN, REVIEW, LENMARK]);
    expect(content().getByText("2 new stories")).toBeInTheDocument();
  });

  it("draws another view as the service now lists it, with no pill", async () => {
    const service = serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    service.snapshot = sampleWith(arrival("7", CHIEF));
    await lookAgain();
    await go("#/signal/main/topic/2");
    await title("Telecoms");
    expect(headlines()).toEqual([CHIEF, TESSALY, REVIEW]);
    expect(content().queryByText("1 new story")).toBeNull();
  });

  it("reads every minute while the tab is visible, and not while it is hidden", async () => {
    vi.useFakeTimers();
    const service = serve();
    showLive();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(service.reads()).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(REREAD_MS - 1));
    expect(service.reads()).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(service.reads()).toBe(2);
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await act(() => vi.advanceTimersByTimeAsync(3 * REREAD_MS));
    expect(service.reads()).toBe(2);
    visibility.mockRestore();
    await act(() => vi.advanceTimersByTimeAsync(REREAD_MS));
    expect(service.reads()).toBe(3);
  });

  it("stops reading once the page has gone", async () => {
    vi.useFakeTimers();
    const service = serve();
    const page = showLive();
    await act(() => vi.advanceTimersByTimeAsync(0));
    page.unmount();
    await vi.advanceTimersByTimeAsync(3 * REREAD_MS);
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(service.reads()).toBe(1);
  });

  it("keeps the page when a later read fails, says so, and Retry reads again", async () => {
    const service = serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    service.replies.set(READ, () => Promise.reject(new TypeError("Failed to fetch")));
    await lookAgain();
    const alert = within(content().getByRole("alert"));
    expect(
      alert.getByText("Signal could not be reached. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(headlines()).toHaveLength(6);
    expect(document.body).not.toHaveTextContent(/sample/i);
    service.replies.delete(READ);
    service.snapshot = sampleWith(arrival("7", CHIEF));
    fireEvent.click(alert.getByRole("button", { name: "Retry" }));
    expect(await content().findByText("1 new story")).toBeInTheDocument();
    expect(content().queryByRole("alert")).toBeNull();
  });

  it.each([
    ["a snapshot of another shape", () => Response.json({ scenes: [{ id: "main" }] })],
    ["an answer that is not JSON", () => new Response("<html>", { status: 200 })],
  ])("keeps the page and says the answer was unreadable after %s", async (_, reply) => {
    const service = serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    service.replies.set(READ, reply);
    await lookAgain();
    expect(content().getByRole("alert")).toHaveTextContent(
      "The service sent an unreadable answer.",
    );
    expect(headlines()).toHaveLength(6);
  });

  it("says a later request was refused", async () => {
    const service = serve();
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    service.replies.set(READ, refusal(500, "the service failed; see its log"));
    await lookAgain();
    expect(content().getByRole("alert")).toHaveTextContent(
      "Signal could not complete that request.",
    );
  });
});

describe("no first snapshot", () => {
  it("says the service cannot be reached, and Retry draws the page", async () => {
    const service = serve();
    service.replies.set(READ, () => Promise.reject(new TypeError("Failed to fetch")));
    showLive();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The service cannot be reached. Try again, or ask whoever runs the service to check it.",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Signal" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Signal" })).toBeNull();
    service.replies.delete(READ);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByRole("region", { name: "Stories" })).toHaveAttribute("aria-busy", "true");
    await title("For you");
    expect(service.calls).toEqual([READ, READ]);
  });

  it("shows the local server's sentence when Signal did not answer it", async () => {
    const service = serve();
    service.replies.set(READ, refusal(502, "Signal is not reachable"));
    showLive();
    expect(await screen.findByRole("alert")).toHaveTextContent("Signal is not reachable");
  });

  it("shows the reader's reason for a slice it refuses", async () => {
    serve(
      sampleWith((s) => {
        s.channels.savedCount = "0";
      }),
    );
    showLive();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Signal sent an answer this page could not read.",
    );
    expect(
      screen.getByText(
        "scenes[0].snapshot.channels.savedCount: expected the delivered count while the Saved view lists stories",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("says so when the answer is not JSON", async () => {
    const service = serve();
    service.replies.set(READ, () => new Response("<html>", { status: 200 }));
    showLive();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The service could not complete this request (200).",
    );
  });

  it("gives up a first read that never answers, and says so", async () => {
    vi.useFakeTimers();
    const service = serve();
    service.replies.set(READ, never);
    showLive();
    await act(() => vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1));
    expect(screen.getByRole("region", { name: "Stories" })).toHaveAttribute("aria-busy", "true");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Signal did not answer in time. Try again.",
    );
  });

  it("draws the page by itself once a later read succeeds", async () => {
    const service = serve();
    service.replies.set(READ, refusal(502, "Signal is not reachable"));
    showLive();
    await screen.findByRole("alert");
    service.replies.delete(READ);
    await lookAgain();
    await title("For you");
  });
});

describe("hostile text in a snapshot", () => {
  it("is drawn as text, and only a web address becomes a link", async () => {
    const MARKUP = '<img src=x onerror="window.pwned=1"><script>window.pwned=1</script>';
    serve(
      sampleWith((s) => {
        const [first, second] = s.feed.stories;
        if (first === undefined || second === undefined) throw new Error("two stories");
        Object.assign(first, { headline: MARKUP, summary: MARKUP, url: "javascript:alert(1)" });
        first.source = { name: MARKUP, monogram: "<b>" };
        second.url = "data:text/html,<script>alert(1)</script>";
        s.viewer.name = MARKUP;
      }),
    );
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    expect(headlines()[0]).toBe(MARKUP);
    expect(document.querySelector("img, script")).toBeNull();
    expect((window as { pwned?: number }).pwned).toBeUndefined();
    const links = content()
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");
    expect(links.filter((href) => !/^https:\/\/|^#\/signal\//.test(href))).toEqual([]);
    expect(links.some((href) => /^(javascript|data):/i.test(href))).toBe(false);
  });
});
