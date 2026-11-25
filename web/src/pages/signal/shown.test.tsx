// A ranked view that holds its whole window: each order lists every entry and `shown` says how many
// the page draws first. Expected headlines come from the id lists each test writes into the
// fixture's main For you (kinds: corvane news, tessaly regulator, halvorsen ratings, brightwell
// news; older: lenmark news, karsten regulator).
import { fireEvent, screen, within } from "@testing-library/react";
import { show, withMain, type Json } from "./test-helpers";

const CORVANE = "Corvane Packaging to close two plants as volumes fall";
const TESSALY = "Competition authority opens in-depth review of Tessaly Telecom's tower sale";
const HALVORSEN = "Northgate Ratings downgrades Halvorsen Marine to B+";
const BRIGHTWELL = "Brightwell Foods extends its term loan by three years";
const LENMARK = "Lenmark Retail secures a covenant waiver from its banks";
const KARSTEN = "Karsten Power files its annual report with the securities regulator";

/** Main's For you with Top halvorsen, brightwell, corvane, tessaly and Latest corvane, tessaly, brightwell, halvorsen. */
function ranked(shown: number, older: string[] = []): unknown {
  return withMain((scene) => {
    const view = scene.snapshot.feed.views["for-you"] as unknown as Record<string, Json>;
    view["top"] = ["halvorsen", "brightwell", "corvane", "tessaly"];
    view["latest"] = ["corvane", "tessaly", "brightwell", "halvorsen"];
    view["waiting"] = null;
    view["older"] = older;
    view["shown"] = shown;
  });
}

const headlines = () =>
  screen
    .queryAllByRole("article")
    .map((a) => within(a).getByRole("heading", { level: 2 }).textContent);
const older = () => screen.queryByRole("button", { name: "Show older" });
const press = (name: string) => {
  fireEvent.click(screen.getByRole("button", { name }));
};
const order = (name: string) => {
  fireEvent.click(screen.getByRole("radio", { name }));
};
const kind = (name: string) => {
  fireEvent.click(screen.getByRole("tab", { name }));
};
const search = (value: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Search stories" }), { target: { value } });
};

describe("a view that says how many entries are drawn first", () => {
  it("draws that many of the Top order, and Show older draws the rest of it", () => {
    show("/signal/main/feed/for-you", ranked(2));
    expect(headlines()).toEqual([HALVORSEN, BRIGHTWELL]);
    const button = older();
    button?.focus();
    press("Show older");
    expect(headlines()).toEqual([HALVORSEN, BRIGHTWELL, CORVANE, TESSALY]);
    expect(older()).toBeNull();
    // Focus goes to the first entry the button added.
    expect(screen.getByRole("heading", { level: 2, name: CORVANE })).toHaveFocus();
  });

  it("draws the rest of the order ahead of the view's older entries", () => {
    show("/signal/main/feed/for-you", ranked(3, ["lenmark", "karsten"]));
    expect(headlines()).toEqual([HALVORSEN, BRIGHTWELL, CORVANE]);
    press("Show older");
    expect(headlines()).toEqual([HALVORSEN, BRIGHTWELL, CORVANE, TESSALY, LENMARK, KARSTEN]);
  });

  it("draws that many of the Latest order once the order is switched, which may be other stories", () => {
    show("/signal/main/feed/for-you", ranked(2));
    order("Latest");
    expect(headlines()).toEqual([CORVANE, TESSALY]);
    expect(older()).not.toBeNull();
    order("Top");
    expect(headlines()).toEqual([HALVORSEN, BRIGHTWELL]);
  });

  it("draws the whole of either order after Show older", () => {
    show("/signal/main/feed/for-you", ranked(2));
    press("Show older");
    order("Latest");
    expect(headlines()).toEqual([CORVANE, TESSALY, BRIGHTWELL, HALVORSEN]);
  });

  it("offers no Show older when the count covers the order and nothing is older", () => {
    show("/signal/main/feed/for-you", ranked(4));
    expect(headlines()).toEqual([HALVORSEN, BRIGHTWELL, CORVANE, TESSALY]);
    expect(older()).toBeNull();
    show("/signal/main/feed/for-you", ranked(30));
    expect(older()).toBeNull();
  });

  it("filters the whole order by kind, then draws the first that many of what passes", () => {
    show("/signal/main/feed/for-you", ranked(1));
    kind("News");
    // Brightwell is second in Top and Corvane third: the filter reaches past the first one drawn.
    expect(headlines()).toEqual([BRIGHTWELL]);
    expect(older()).not.toBeNull();
    press("Show older");
    expect(headlines()).toEqual([BRIGHTWELL, CORVANE]);
    expect(older()).toBeNull();
  });

  it("offers Show older only while more of the chosen kind waits", () => {
    show("/signal/main/feed/for-you", ranked(2));
    expect(older()).not.toBeNull();
    kind("News");
    expect(headlines()).toEqual([BRIGHTWELL, CORVANE]);
    expect(older()).toBeNull();
    kind("Regulators");
    expect(headlines()).toEqual([TESSALY]);
    expect(older()).toBeNull();
    kind("All");
    expect(headlines()).toEqual([HALVORSEN, BRIGHTWELL]);
    expect(older()).not.toBeNull();
  });

  it("counts an older entry of the chosen kind as waiting", () => {
    show("/signal/main/feed/for-you", ranked(4, ["lenmark", "karsten"]));
    kind("Ratings");
    expect(headlines()).toEqual([HALVORSEN]);
    expect(older()).toBeNull();
    kind("News");
    expect(headlines()).toEqual([BRIGHTWELL, CORVANE]);
    press("Show older");
    expect(headlines()).toEqual([BRIGHTWELL, CORVANE, LENMARK]);
  });

  it("searches the whole order, not only what is drawn", () => {
    show("/signal/main/feed/for-you", ranked(1));
    expect(headlines()).toEqual([HALVORSEN]);
    search("Tessaly");
    expect(headlines()).toEqual([TESSALY]);
    expect(older()).toBeNull();
  });

  it("says why nothing is drawn, with no Show older, when no entry passes", () => {
    show("/signal/main/feed/for-you", ranked(1));
    kind("Research");
    expect(headlines()).toEqual([]);
    expect(screen.getByText("No stories of this kind here")).toBeInTheDocument();
    expect(older()).toBeNull();
    kind("All");
    search("zzzz");
    expect(screen.getByText("No story matches zzzz")).toBeInTheDocument();
    expect(older()).toBeNull();
  });

  it("draws stories shown from the pill as well as what was drawn, not in its place", () => {
    const slice = withMain((scene) => {
      const view = scene.snapshot.feed.views["for-you"] as unknown as Record<string, Json>;
      view["older"] = [];
      view["shown"] = 2;
    });
    show("/signal/main/feed/for-you", slice);
    // Top is corvane, tessaly, halvorsen, brightwell; four stories wait behind the pill.
    expect(headlines()).toEqual([CORVANE, TESSALY]);
    press("Show 4 new stories");
    expect(headlines()).toHaveLength(6);
    expect(headlines().slice(4)).toEqual([CORVANE, TESSALY]);
    press("Show older");
    expect(headlines()).toHaveLength(8);
    expect(headlines().slice(6)).toEqual([HALVORSEN, BRIGHTWELL]);
  });
});

describe("a view that says nothing of it", () => {
  it("draws its whole order and keeps Show older for the older entries, whatever the filter", () => {
    show("/signal/main/feed/for-you");
    expect(headlines()).toEqual([CORVANE, TESSALY, HALVORSEN, BRIGHTWELL]);
    kind("Ratings");
    expect(headlines()).toEqual([HALVORSEN]);
    // As before: the button stands for the older entries, of any kind.
    expect(older()).not.toBeNull();
  });
});
