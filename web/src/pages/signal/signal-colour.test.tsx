// The colour-signal-build ruling (PR 7): the kind dot on a story card, the one key above a list, and
// the strength pips. Expected classes and words are written by hand, never read from the code.
import { fireEvent, render, screen, within } from "@testing-library/react";
import fixture from "../../../fixtures/signal.json";
import { KindDot } from "./parts/KindDot";
import { show } from "./test-helpers";

const key = () => screen.queryByRole("group", { name: "Key" });
const swatches = (group: HTMLElement) =>
  within(group)
    .getAllByRole("listitem")
    .map((li) => [li.textContent, li.querySelector("circle")?.getAttribute("class")]);
/** The dot classes of every kind badge on the page, by the badge's word. */
const dotOf = (article: HTMLElement, word: string) =>
  within(article).getByText(word).querySelector("svg circle")?.getAttribute("class") ?? null;
const articleOf = (headline: string) => {
  const found = screen.getByRole("heading", { level: 2, name: headline }).closest("article");
  if (found === null) throw new Error("a headline sits in an article");
  return found;
};
const CORVANE = "Corvane Packaging to close two plants as volumes fall";
const TESSALY = "Competition authority opens in-depth review of Tessaly Telecom's tower sale";
const HALVORSEN = "Northgate Ratings downgrades Halvorsen Marine to B+";

describe("the kind dot", () => {
  it("draws one dot per story in the kind's slot, and keeps the word", () => {
    show("/signal/main/feed/for-you");
    expect(dotOf(articleOf(CORVANE), "News")).toBe("fill-category-4");
    expect(dotOf(articleOf(TESSALY), "Regulatory case")).toBe("fill-category-3");
    expect(dotOf(articleOf(HALVORSEN), "Rating action")).toBe("fill-category-5");
  });

  it.each([
    "/signal/main/feed/for-you",
    "/signal/ai-on/feed/for-you",
    "/signal/issuers/feed/latest",
  ])(
    "draws one kind dot per story, none on a market post or digest, and no slot 1, 2 or 7 at %s",
    (hash) => {
      show(hash);
      for (const article of screen.getAllByRole("article")) {
        // A market post and a digest card carry no kind dot.
        const none =
          within(article).queryByRole("heading", { name: /^Market backdrop/ }) !== null ||
          within(article).queryByText("Digest") !== null;
        const dots = article.querySelectorAll("circle[class^='fill-category-']");
        expect(dots).toHaveLength(none ? 0 : 1);
        expect(article.innerHTML).not.toMatch(/category-(1|2|7)\b/);
      }
    },
  );

  it("draws a filing in slot 8 and no dot on the market post", () => {
    show("/signal/issuers/feed/latest");
    const filing = screen.getAllByRole("article").find((a) => within(a).queryByText("Filing"));
    expect(filing?.querySelector("svg circle")?.getAttribute("class")).toBe("fill-category-8");
    const market = screen
      .getAllByRole("article")
      .find((a) => within(a).queryByRole("heading", { name: /^Market backdrop/ }));
    if (market === undefined) throw new Error("the issuers feed has a market post");
    expect(within(market).getAllByText("Market").length).toBeGreaterThan(0);
    expect(market.querySelectorAll("svg circle")).toHaveLength(0);
  });

  it("draws research in slot 6", () => {
    const { container } = render(<KindDot kind="research" />);
    expect(container.querySelector("svg[aria-hidden='true'] circle")?.getAttribute("class")).toBe(
      "fill-category-6",
    );
  });

  it("throws for a kind that has no slot, and draws no fallback dot", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<KindDot kind={"opinion" as never} />)).toThrow(/opinion/);
    quiet.mockRestore();
  });

  it("draws nothing for a market post", () => {
    const { container } = render(<KindDot kind="market" />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("keeps the AI-chosen badge name and gives it a dot outside the named span", () => {
    const slice = structuredClone(fixture.slice);
    const first = slice.scenes.find((s) => s.id === "ai-on")?.snapshot.feed.stories[0];
    if (first === undefined) throw new Error("the ai-on scene has a first story");
    Object.assign(first, { ai: { line: "x", kind: true, tags: [] } });
    show("/signal/ai-on/feed/for-you", slice);
    const article = articleOf(CORVANE);
    const named = within(article).getByRole("img", { name: "Kind chosen by AI: News" });
    expect(named.querySelector("svg")).toBeNull();
    const badge = named.parentElement;
    expect(badge?.querySelector("svg circle")?.getAttribute("class")).toBe("fill-category-4");
  });
});

describe("the key above a list", () => {
  it("draws one key above the tile with the kinds drawn, in tab order", () => {
    show("/signal/main/feed/for-you");
    const group = key();
    expect(group).not.toBeNull();
    expect(screen.getAllByRole("group", { name: "Key" })).toHaveLength(1);
    expect(swatches(group as HTMLElement)).toEqual([
      ["Regulators", "fill-category-3"],
      ["News", "fill-category-4"],
      ["Ratings", "fill-category-5"],
    ]);
    const tile = screen.getAllByRole("article")[0]?.parentElement;
    expect(tile?.contains(group)).toBe(false);
    expect(
      (group as HTMLElement).compareDocumentPosition(tile as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("has no strength entry without a strength and one with it", () => {
    const { unmount } = show("/signal/main/feed/for-you");
    expect(within(key() as HTMLElement).queryByText(/Signal strength/)).toBeNull();
    unmount();
    show("/signal/ai-on/feed/for-you");
    const groups = screen.getAllByRole("group", { name: "Key" });
    const last = within(groups[groups.length - 1] as HTMLElement).getAllByRole("listitem");
    expect(last[last.length - 1]?.textContent).toBe("Signal strength: darker is stronger");
    expect(last[last.length - 1]?.querySelector("circle")?.getAttribute("class")).toBe(
      "fill-scale-amount-5 stroke-scale-amount-edge",
    );
  });

  it("leaves one entry when a kind tab is chosen", () => {
    show("/signal/main/feed/for-you");
    fireEvent.click(screen.getByRole("tab", { name: "News" }));
    expect(swatches(key() as HTMLElement)).toEqual([["News", "fill-category-4"]]);
  });

  it("draws no key when only a market post passes", () => {
    show("/signal/issuers/feed/latest");
    expect(key()).not.toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Search stories" }), {
      target: { value: "Market backdrop" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(key()).toBeNull();
  });

  it("draws the group's key from the stories its threads carry", () => {
    show("/signal/main/group/leveraged-credit");
    expect(swatches(key() as HTMLElement)).toEqual([
      ["Regulators", "fill-category-3"],
      ["News", "fill-category-4"],
      ["Ratings", "fill-category-5"],
    ]);
  });

  it("draws no key in a group whose threads are all notes", () => {
    const slice = structuredClone(fixture.slice);
    const snapshot = slice.scenes[0]?.snapshot;
    const group = snapshot?.groups[0];
    if (snapshot === undefined || group === undefined) throw new Error("a first group");
    const gone = new Set(group.threads.filter((t) => t.storyId !== null).map((t) => t.id));
    group.threads = group.threads.filter((t) => !gone.has(t.id));
    snapshot.threads = snapshot.threads.filter((t) => !gone.has(t.id));
    for (const story of snapshot.feed.stories) {
      if (story.threadRef !== null && gone.has(story.threadRef.threadId)) {
        story.threadRef = null as never;
        story.commentCount = null as never;
      }
    }
    expect(group.threads.length).toBeGreaterThan(0);
    show("/signal/main/group/leveraged-credit", slice);
    expect(screen.getByRole("list", { name: "Shared in this group" })).toBeInTheDocument();
    expect(key()).toBeNull();
  });
});
