// The Signal frame in a window with no room for the channel list as a column: the list opens from
// the Channels button. The width is asked of matchMedia, which the test's document lacks (every other
// test therefore draws the wide layout); here it is stood in for.
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import fixture from "../../../fixtures/signal.json";
import { page, settled, show, withMain } from "./test-helpers";
import { refusal, serve, showLive } from "./live/test-helpers";

const WIDE_QUERY = "(min-width: 960px)";

/** A window whose width answers the frame's question with `wide`; `set` changes it, as a resize does. */
function windowIs(wide: boolean) {
  const listeners = new Set<() => void>();
  const asked: string[] = [];
  const list = {
    matches: wide,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", (query: string) => {
    asked.push(query);
    return list;
  });
  return {
    asked,
    set: (next: boolean) => {
      act(() => {
        list.matches = next;
        for (const listener of listeners) listener();
      });
    },
  };
}

/** The open panel hides the page behind it from the accessibility tree, the button with it. */
const button = () => screen.getByRole("button", { name: /^Channels/, hidden: true });
const panel = () => screen.getByRole("dialog", { name: "Channels" });
const list = () => within(panel()).getByRole("navigation", { name: "Signal" });

function open() {
  fireEvent.click(button());
  return panel();
}

async function gone() {
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { hidden: true })).toBeNull();
  });
}

describe("the Signal frame in a narrow window", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks whether the window is 960px wide and draws the column where it is", () => {
    const width = windowIs(true);
    show("/signal/main/feed/for-you");
    expect(new Set(width.asked)).toEqual(new Set([WIDE_QUERY]));
    expect(screen.getByRole("navigation", { name: "Signal" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Channels/ })).toBeNull();
  });

  it("draws no Channels button where the width cannot be asked", () => {
    show("/signal/main/feed/for-you");
    expect(screen.getByRole("navigation", { name: "Signal" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Channels/ })).toBeNull();
  });

  it("draws the Channels button ahead of the page, closed, and no channel list", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    expect(screen.queryByRole("navigation", { name: "Signal" })).toBeNull();
    expect(button().tagName).toBe("BUTTON");
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(button()).not.toHaveAttribute("aria-controls");
    // It is the first thing in the page region, ahead of the page's title.
    const content = document.getElementById("signal-content") as HTMLElement;
    expect(content.contains(button())).toBe(true);
    const h1 = screen.getByRole("heading", { level: 1, name: "For you" });
    expect(button().compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("keeps the button on a sticky strip at the top of the page region, which scrolls clear of it", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    const content = document.getElementById("signal-content") as HTMLElement;
    const strip = button().closest(".sticky") as HTMLElement;
    expect(strip.parentElement).toBe(content);
    expect(content.firstElementChild).toBe(strip);
    expect(strip.className).toContain("bg-surface-canvas");
    expect(strip.className).toContain("z-30");
    // The region names the strip's height once: 52px, and 60px on a phone, where the button is
    // a 44px target. The strip takes it at the region's top edge, and the region's scroll
    // padding is the same length. No offset is written as a number of its own.
    const classes = content.className.split(" ");
    expect(classes).toEqual(
      expect.arrayContaining([
        "[--strip:3.25rem]",
        "max-[480px]:[--strip:3.75rem]",
        "scroll-pt-(--strip)",
      ]),
    );
    expect(strip.className.split(" ")).toEqual(
      expect.arrayContaining(["top-0", "h-(--strip)", "px-4", "sm:px-8"]),
    );
    expect(`${strip.className} ${content.className}`).not.toMatch(
      /(^| )-(top|mx|mt)-|scroll-pt-\d/,
    );
  });

  it("draws no sticky strip and no scroll padding where the list is a column", () => {
    windowIs(true);
    show("/signal/main/feed/for-you");
    expect(document.querySelector("#signal-content .sticky")).toBeNull();
    const content = document.getElementById("signal-content") as HTMLElement;
    expect(content.className.split(" ")).toContain("[--strip:0px]");
    expect(content.className).not.toContain("3.25rem");
  });

  it("keeps a refusal in view 8px under the strip, by the strip's own height", async () => {
    windowIs(false);
    const service = serve();
    service.replies.set(
      "POST /signal/api/stories/1/save",
      refusal(401, "set a display name before saving"),
    );
    showLive("#/signal/main/feed/for-you");
    await screen.findByRole("heading", { level: 1, name: "For you" });
    fireEvent.click(
      page().getByRole("button", {
        name: "Save: Corvane Packaging to close two plants as volumes fall",
      }),
    );
    const holder = (await page().findByRole("alert")).closest(".sticky") as HTMLElement;
    expect(holder.className.split(" ")).toEqual(
      expect.arrayContaining(["sticky", "top-[calc(var(--strip,0px)+0.5rem)]", "z-10"]),
    );
    // It is inside the region that sets `--strip`, after the strip.
    const content = document.getElementById("signal-content") as HTMLElement;
    expect(content.contains(holder)).toBe(true);
    expect(holder.className).not.toMatch(/top-\d|min-\[/);
  });

  it("draws the Channels button at the kit's small size, not a bar of its own height", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    // The kit's small button: 8px above and below a 20px line, 36px tall.
    expect(button().className.split(" ")).toEqual(expect.arrayContaining(["py-2", "text-sm"]));
    expect(button().className).not.toContain("py-2.5");
  });

  it("opens the channel panel from the left edge", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    open();
    const modal = panel().closest("[class*='left-0']");
    expect(modal).not.toBeNull();
    expect(modal?.className).not.toContain("right-0");
  });

  it.each([
    ["/signal/main/feed/for-you", "For you"],
    ["/signal/main/feed/latest", "Latest"],
    ["/signal/main/feed/saved", "Saved"],
    ["/signal/main/topic/telecoms", "Telecoms"],
    ["/signal/main/group/leveraged-credit", "Leveraged credit"],
    ["/signal/main/digest/weekly-brief", "Weekly brief"],
    ["/signal/main/settings/sources", "Settings"],
  ])("shows the current place on the closed button at %s", (hash, place) => {
    windowIs(false);
    show(hash);
    expect(within(button()).getByText(place)).toBeInTheDocument();
    expect(button().getAttribute("aria-label")).toMatch(new RegExp(`^Channels: ${place}`));
  });

  it("shows no place where the address names no channel item", () => {
    windowIs(false);
    show("/signal/main/topic/nowhere");
    // No group in this copy is unread, so the name is the word alone.
    expect(button()).toHaveAccessibleName("Channels. Unread");
    expect(button().textContent).toBe("ChannelsUnread");
  });

  it("says Unread on the closed button while a group's unread badge is in the list", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    expect(button()).toHaveAccessibleName("Channels: For you. Unread");
    expect(within(button()).getByText("Unread")).toBeInTheDocument();
  });

  it("says Unread on the closed button while a digest's unread dot is in the list", () => {
    windowIs(false);
    const scenes = fixture.slice.scenes;
    const index = scenes.findIndex((scene) => scene.id === "ai-on");
    const copy = structuredClone(fixture.slice);
    const snapshot = copy.scenes[index]?.snapshot;
    if (snapshot === undefined) throw new Error("the fixture has an ai-on scene");
    for (const group of snapshot.channels.groups) Object.assign(group, { unread: null });
    expect(snapshot.channels.digests.some((digest) => digest.unread)).toBe(true);
    show("/signal/ai-on/feed/for-you", copy);
    expect(button()).toHaveAccessibleName("Channels: For you. Unread");
  });

  it.each([null, "0"])(
    "says nothing of unread when no item is marked (group badges %s)",
    (unread) => {
      windowIs(false);
      const copy = withMain((scene) => {
        for (const group of scene.snapshot.channels.groups) Object.assign(group, { unread });
        // The main scene's digests are paused: they carry the Paused badge, not an unread dot.
        expect(scene.snapshot.channels.digests.every((digest) => digest.paused)).toBe(true);
      });
      show("/signal/main/feed/for-you", copy);
      expect(button()).toHaveAccessibleName("Channels: For you");
      expect(within(button()).queryByText("Unread")).toBeNull();
    },
  );

  it("opens the list in a panel the button names, with every item and badge of the column", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    const opened = open();
    expect(button()).toHaveAttribute("aria-expanded", "true");
    expect(button().getAttribute("aria-controls")).toBe(opened.id);
    // A modal panel: the page behind it leaves the accessibility tree while it is open.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 1, hidden: true })).toBeInTheDocument();
    const nav = within(list());
    expect(nav.getByRole("link", { name: "For you" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Saved 6" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Shipping 12" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Leveraged credit 3" })).toBeInTheDocument();
    expect(nav.getAllByText("Paused")).toHaveLength(2);
    expect(nav.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(nav.getByText("Mara L")).toBeInTheDocument();
    expect(within(opened).getByRole("button", { name: "Close channels" })).toBeInTheDocument();
  });

  it("closes on Escape and gives focus back to the button", async () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    button().focus();
    fireEvent.keyDown(open(), { key: "Escape" });
    await gone();
    await settled();
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(button()).toHaveFocus();
    expect(window.location.hash).toBe("#/signal/main/feed/for-you");
  });

  it("closes from its Close button and gives focus back to the button", async () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    button().focus();
    fireEvent.click(within(open()).getByRole("button", { name: "Close channels" }));
    await gone();
    await settled();
    expect(button()).toHaveFocus();
  });

  it("closes when a destination is chosen, draws it, and names it on the button", async () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    button().focus();
    open();
    const latest = within(list()).getByRole("link", { name: "Latest" });
    expect(latest).toHaveAttribute("href", "#/signal/main/feed/latest");
    fireEvent.click(latest);
    // jsdom does not follow a link: the address moves as the browser would move it.
    act(() => {
      window.location.hash = "#/signal/main/feed/latest";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await gone();
    await settled();
    expect(await screen.findByRole("heading", { level: 1, name: "Latest" })).toBeInTheDocument();
    expect(button()).toHaveAccessibleName("Channels: Latest. Unread");
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(button()).toHaveFocus();
  });

  it("closes when the current destination is chosen again", async () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    open();
    fireEvent.click(within(list()).getByRole("link", { name: "For you" }));
    await gone();
  });

  it("stays open when a follow star is pressed in it", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    open();
    fireEvent.click(within(list()).getByRole("button", { name: "Follow Telecoms" }));
    expect(within(list()).getByRole("button", { name: "Unfollow Telecoms" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(button()).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the non-interactive account badge inside the channel panel", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    open();
    expect(within(list()).getByText("Mara L")).toBeInTheDocument();
    expect(within(list()).queryByRole("button", { name: /Mara L/ })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Your name" })).toBeNull();
  });

  it("keeps an older no-name account readable without a name prompt", () => {
    windowIs(false);
    show("/signal/no-name/feed/for-you");
    open();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Your name" })).toBeNull();
    expect(within(list()).queryByRole("textbox", { name: /Display name/ })).toBeNull();
  });

  it("keeps the skip link first and sends focus to the page region", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    const skip = screen.getByRole("link", { name: "Skip to the feed" });
    expect(skip.compareDocumentPosition(button()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(skip);
    expect(document.getElementById("signal-content")).toHaveFocus();
  });

  it("puts the list back as a column, with no panel, once the window is wide", async () => {
    const width = windowIs(false);
    show("/signal/main/feed/for-you");
    open();
    width.set(true);
    await gone();
    expect(screen.getByRole("navigation", { name: "Signal" }).className).toContain("w-64");
    expect(screen.queryByRole("button", { name: /^Channels/ })).toBeNull();
    width.set(false);
    // The panel does not open by itself when the window narrows again.
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Signal" })).toBeNull();
  });

  it("pads the page 16px, and 32px from 640px, as the shell pads every page", () => {
    windowIs(false);
    show("/signal/main/feed/for-you");
    const content = document.getElementById("signal-content") as HTMLElement;
    const padded = content.lastElementChild as HTMLElement;
    expect(padded.className.split(" ")).toEqual(["p-4", "sm:p-8"]);
    expect(padded.contains(screen.getByRole("heading", { level: 1 }))).toBe(true);
    expect(content.className).not.toMatch(/(^| )(sm:|min-\[768px\]:)?p-\d/);
    expect(page().getByRole("heading", { level: 1, name: "For you" })).toBeInTheDocument();
  });

  it("draws the same button on the live page", async () => {
    windowIs(false);
    serve();
    showLive("#/signal/main/feed/latest");
    expect(await screen.findByRole("heading", { level: 1, name: "Latest" })).toBeInTheDocument();
    expect(button().getAttribute("aria-label")).toMatch(/^Channels: Latest/);
    open();
    expect(within(list()).getByRole("link", { name: /^Latest/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
