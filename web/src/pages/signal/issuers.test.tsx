// Issuers, filings and the market post in the screens, on the design fixture's "issuers" scene
// (hand-written sample data: scene 11). Names, counts, figures and sentences are the fixture's,
// written out by hand; the market figures there are sample values, not market data.
import { fireEvent, screen, within } from "@testing-library/react";
import fixture from "../../../fixtures/signal.json";
import { change, page, show } from "./test-helpers";

const SCENE = 11;
const MARKET = "Market backdrop: 25 November 2026";
const FILING = "Tessaly Telecom: 8-K, current report";
const TOWERS = "Tessaly Telecom agrees the sale of its towers";
const FREIGHT = "Corvane Packaging signs a five-year freight contract with Halvorsen Marine";
const REVIEW = "Authority opens a review of the Tessaly Telecom tower sale";

const channels = () => within(screen.getByRole("navigation", { name: "Signal" }));
const headlines = () =>
  page()
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
const card = (headline: string) => {
  const heading = page().getByRole("heading", { level: 2, name: headline });
  return within(heading.closest("article") as HTMLElement);
};
const tab = (name: string) => page().getByRole("tab", { name });
const texts = (elements: HTMLElement[]) => elements.map((element) => element.textContent);

/** The scene with a watchlist that is delivered and holds no issuer: no channel, view, Settings row or story issuer. */
function emptied(): unknown {
  const copy = structuredClone(fixture.slice);
  const scene = copy.scenes[SCENE]?.snapshot as unknown as {
    channels: { issuers: unknown[] };
    feed: { issuers: object; stories: { issuers: unknown[] }[] };
    settings: { issuers: unknown[] };
  };
  scene.channels.issuers = [];
  scene.feed.issuers = {};
  scene.settings.issuers = [];
  for (const story of scene.feed.stories) story.issuers = [];
  return copy;
}

it("is the fixture's twelfth scene", () => {
  expect(fixture.slice.scenes[SCENE]?.id).toBe("issuers");
});

describe("the channel list's issuers", () => {
  it("sit between Topics and Groups, each with its count and a follow star", () => {
    show("/signal/issuers/feed/latest");
    expect(texts(channels().getAllByRole("heading", { level: 2 }))).toEqual([
      "Signal",
      "Topics",
      "Issuers",
      "Groups",
      "Digests",
    ]);
    const links = channels()
      .getAllByRole("link")
      .map((link) => [link.textContent.trim(), link.getAttribute("href")]);
    expect(links.slice(6, 10)).toEqual([
      ["Brightwell Foods 0", "#/signal/issuers/issuer/brightwell-foods"],
      ["Corvane Packaging 1", "#/signal/issuers/issuer/corvane-packaging"],
      ["Halvorsen Marine 1", "#/signal/issuers/issuer/halvorsen-marine"],
      ["Tessaly Telecom 3", "#/signal/issuers/issuer/tessaly-telecom"],
    ]);
    expect(channels().getByRole("button", { name: "Unfollow Tessaly Telecom" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(channels().getByRole("button", { name: "Follow Corvane Packaging" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("are not drawn, heading and all, where the snapshot lists none", () => {
    show("/signal/main/feed/latest");
    expect(channels().queryByRole("heading", { name: "Issuers" })).toBeNull();
  });

  it("draw no heading for an empty watchlist", () => {
    show("/signal/issuers/feed/latest", emptied());
    expect(headlines()).toContain(TOWERS);
    expect(channels().queryByRole("heading", { name: "Issuers" })).toBeNull();
    expect(channels().getByRole("heading", { name: "Topics" })).toBeInTheDocument();
  });

  it("mark the issuer whose page is open, and follow in step with the page's button", () => {
    show("/signal/issuers/issuer/corvane-packaging");
    expect(channels().getByRole("link", { name: /^Corvane Packaging/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(channels().getByRole("link", { name: /^Tessaly Telecom/ })).not.toHaveAttribute(
      "aria-current",
    );
    fireEvent.click(channels().getByRole("button", { name: "Follow Corvane Packaging" }));
    expect(page().getByRole("button", { name: "Following" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(page().getByRole("button", { name: "Following" }));
    expect(channels().getByRole("button", { name: "Follow Corvane Packaging" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keep an issuer's follow apart from a topic of the same id", () => {
    const copy = structuredClone(fixture.slice);
    const scene = copy.scenes[SCENE]?.snapshot as unknown as {
      channels: { issuers: { id: string }[] };
      feed: { issuers: Record<string, unknown>; stories: { issuers: { id: string }[] }[] };
      settings: { issuers: { id: string }[] };
    };
    // Corvane Packaging takes the id the Telecoms topic has.
    for (const list of [scene.channels.issuers, scene.settings.issuers]) {
      const corvane = list.find((issuer) => issuer.id === "corvane-packaging");
      if (corvane !== undefined) corvane.id = "telecoms";
    }
    scene.feed.issuers["telecoms"] = scene.feed.issuers["corvane-packaging"];
    Reflect.deleteProperty(scene.feed.issuers, "corvane-packaging");
    for (const story of scene.feed.stories) {
      for (const issuer of story.issuers) {
        if (issuer.id === "corvane-packaging") issuer.id = "telecoms";
      }
    }
    show("/signal/issuers/feed/latest", copy);
    fireEvent.click(channels().getByRole("button", { name: "Follow Corvane Packaging" }));
    expect(channels().getByRole("button", { name: "Unfollow Corvane Packaging" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(channels().getByRole("button", { name: "Follow Telecoms" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("an issuer's page", () => {
  it("is the feed page over the issuer's stories, with Follow and the kind tabs", () => {
    show("/signal/issuers/issuer/tessaly-telecom");
    expect(page().getByRole("heading", { level: 1 })).toHaveTextContent("Tessaly Telecom");
    expect(headlines()).toEqual([FILING, TOWERS, REVIEW]);
    expect(page().getByRole("button", { name: "Following" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(page().getByRole("radiogroup", { name: "Order of stories" })).toBeInTheDocument();
    fireEvent.click(tab("Filings"));
    expect(headlines()).toEqual([FILING]);
  });

  it("links to the Library where the issuer has a library key, and never with the key as the address", () => {
    show("/signal/issuers/issuer/tessaly-telecom");
    expect(page().getByRole("link", { name: "Open in Library" })).toHaveAttribute("href", "#/");
    const keyed = change(
      SCENE,
      ["snapshot", "settings", "issuers", 3, "libraryKey"],
      "javascript:alert(1)",
    );
    show("/signal/issuers/issuer/tessaly-telecom", keyed);
    const links = screen.getAllByRole("link", { hidden: true });
    expect(links.filter((link) => /javascript/i.test(link.getAttribute("href") ?? ""))).toEqual([]);
    expect(
      screen
        .getAllByRole("link", { name: "Open in Library" })
        .map((link) => link.getAttribute("href")),
    ).toEqual(["#/", "#/"]);
  });

  it("draws no Library link for an issuer with no library key", () => {
    show("/signal/issuers/issuer/corvane-packaging");
    expect(headlines()).toEqual([FREIGHT]);
    expect(page().queryByRole("link", { name: "Open in Library" })).toBeNull();
  });

  it("says an issuer with no story has none yet", () => {
    show("/signal/issuers/issuer/brightwell-foods");
    expect(page().getByRole("heading", { level: 1 })).toHaveTextContent("Brightwell Foods");
    expect(page().getByText("No stories about this issuer yet")).toBeInTheDocument();
    expect(
      page().getByText("A story appears here when its headline or summary names the issuer."),
    ).toBeInTheDocument();
  });

  it.each(["nobody", "__proto__", "telecoms"])("says there is no such issuer at %s", (id) => {
    show(`/signal/issuers/issuer/${id}`);
    expect(page().getByRole("heading", { level: 1 })).toHaveTextContent("No such issuer");
    expect(page().getByRole("link", { name: "Back to For you" })).toHaveAttribute(
      "href",
      "#/signal/issuers/feed/for-you",
    );
  });

  it("is no page of a scene that lists no issuers", () => {
    show("/signal/main/issuer/tessaly-telecom");
    expect(page().getByRole("heading", { level: 1 })).toHaveTextContent("No such issuer");
  });
});

describe("a story's issuers", () => {
  it("are a row of their own: links to the issuers' pages, apart from the tags", () => {
    show("/signal/issuers/feed/latest");
    const about = card(FREIGHT).getByRole("list", { name: "About" });
    expect(
      within(about)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Corvane Packaging", "#/signal/issuers/issuer/corvane-packaging"],
      ["Halvorsen Marine", "#/signal/issuers/issuer/halvorsen-marine"],
    ]);
    expect(about.parentElement).toHaveTextContent("About:Corvane Packaging,Halvorsen Marine");
    const lists = card(FREIGHT).getAllByRole("list");
    const tags = lists.find((list) => list !== about);
    expect(texts(within(tags as HTMLElement).getAllByRole("listitem"))).toEqual([
      "Packaging",
      "Shipping",
    ]);
  });

  it("are left out, row and all, on a story that belongs to none", () => {
    show("/signal/issuers/feed/latest");
    expect(card(MARKET).queryByRole("list", { name: "About" })).toBeNull();
    expect(card(MARKET).queryByText("About:")).toBeNull();
  });

  it("are found by the search, by name", () => {
    const renamed = change(
      SCENE,
      ["snapshot", "feed", "stories", 2, "issuers"],
      [{ id: "tessaly-telecom", name: "Zeta Holdings" }],
    );
    show("/signal/issuers/feed/latest", renamed);
    fireEvent.change(page().getByPlaceholderText("Search stories"), { target: { value: "zeta" } });
    expect(headlines()).toEqual([TOWERS]);
  });
});

describe("a filing", () => {
  it("has its own tab, its kind badge and its form type as the first tag, and no AI mark", () => {
    show("/signal/issuers/feed/latest");
    fireEvent.click(tab("Filings"));
    expect(tab("Filings")).toHaveAttribute("aria-selected", "true");
    expect(headlines()).toEqual([FILING]);
    const filing = card(FILING);
    expect(filing.getByText("Filing")).toBeInTheDocument();
    expect(filing.getByText("Tessaly Telecom filings (SEC)")).toBeInTheDocument();
    const tags = filing.getAllByRole("list").find((list) => !list.hasAttribute("aria-label"));
    expect(texts(within(tags as HTMLElement).getAllByRole("listitem"))).toEqual([
      "8-K",
      "Telecoms",
    ]);
    expect(filing.queryByRole("group", { name: "Written by AI" })).toBeNull();
    expect(filing.queryByRole("img", { name: /AI/ })).toBeNull();
    expect(filing.queryByText("AI")).toBeNull();
    expect(filing.getByRole("link", { name: /^Open source: / })).toHaveAttribute(
      "href",
      "https://example.com/tessaly-8k",
    );
  });

  it("says so when a view holds no filing", () => {
    show("/signal/issuers/issuer/corvane-packaging");
    fireEvent.click(tab("Filings"));
    expect(page().getByText("No stories of this kind here")).toBeInTheDocument();
  });
});

describe("the market post", () => {
  const table = () => card(MARKET).getByRole("table");
  const cells = (name: RegExp) =>
    texts(
      within(
        within(table()).getByRole("button", { name }).closest("tr") as HTMLElement,
      ).getAllByRole("cell"),
    );

  it("is under All only: no other tab shows it", () => {
    show("/signal/issuers/feed/latest");
    expect(headlines()[0]).toBe(MARKET);
    for (const name of ["Regulators", "News", "Ratings", "Research", "Filings"]) {
      fireEvent.click(tab(name));
      expect(page().queryByRole("heading", { level: 2, name: MARKET })).toBeNull();
    }
  });

  it("is a story like any other: kind badge, Save, the writer's Comment and Share, Open source", () => {
    show("/signal/issuers/feed/latest");
    const post = card(MARKET);
    expect(post.getAllByText("Market")).toHaveLength(2);
    expect(post.getByRole("button", { name: `Save: ${MARKET}` })).toBeInTheDocument();
    expect(post.getByRole("button", { name: `Comment: ${MARKET}` })).toBeInTheDocument();
    expect(post.getByRole("button", { name: `Share to group: ${MARKET}` })).toBeInTheDocument();
    expect(post.getByRole("link", { name: /^Open source: / })).toHaveAttribute(
      "href",
      "https://example.com/market-25-nov",
    );
  });

  it("draws its table in a named region the keyboard can reach, in place of the one-line summary", () => {
    show("/signal/issuers/feed/latest");
    const region = card(MARKET).getByRole("region", { name: `Table: ${MARKET}` });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region.className).toContain("overflow-x-auto");
    expect(within(region).getByRole("table")).toBe(table());
    expect(card(MARKET).queryByText(/Sample HY 1\.11% \(\+1 bp\); Sample BB/)).toBeNull();
    // The post is titled the day it was written; the table says what day its figures are as of.
    expect(region.previousElementSibling?.previousElementSibling).toHaveTextContent(
      "As of 24 November 2026",
    );
    expect(table().querySelector("caption")).toHaveTextContent(
      "Market series: each value with its own date, each change with the date it is measured from.",
    );
  });

  it("heads its columns with the delivered labels and gives each series a row", () => {
    show("/signal/issuers/feed/latest");
    expect(texts(within(table()).getAllByRole("columnheader"))).toEqual([
      "Series",
      "Value",
      "Previous",
      "Week",
      "Month",
    ]);
    expect(texts(within(table()).getAllByRole("rowheader"))).toEqual([
      "Sample HY",
      "Sample BB",
      "Sample 10y",
      "Sample index",
      "Sample rate",
    ]);
  });

  it("shows a value with its unit and its own date, and each change with the date it is since", () => {
    show("/signal/issuers/feed/latest");
    expect(cells(/^Sample HY:/)).toEqual([
      "1.11%24 Nov",
      "+1 bp21 Nov",
      "-2 bp17 Nov",
      "+3 bp23 Oct",
    ]);
    expect(cells(/^Sample BB:/)).toEqual([
      "2.22%24 Nov",
      "0 bp21 Nov",
      "-4.5 bp17 Nov",
      "+12 bp23 Oct",
    ]);
    // A unit other than percent follows the value as written; the series' own date is another day.
    expect(cells(/^Sample index:/)).toEqual([
      "100.00 Index21 Nov",
      "+1.5 Index20 Nov",
      "-0.25 Index14 Nov",
      "+2 Index21 Oct",
    ]);
  });

  it("shows a series' note in place of its figures", () => {
    show("/signal/issuers/feed/latest");
    expect(cells(/^Sample 10y:/)).toEqual([
      "Could not be read: a sample of a series with no reading",
    ]);
    const note = within(table()).getByText(
      "Could not be read: a sample of a series with no reading",
    );
    expect(note.closest("td")).toHaveAttribute("colspan", "4");
  });

  it("shows a series' figures and its note together where it has both, the note beneath", () => {
    show("/signal/issuers/feed/latest");
    const figures = within(table())
      .getByRole("button", { name: /^Sample BB:/ })
      .closest("tr");
    const note = within(table()).getByText(
      "An observation dated 26 Nov, after today (UTC), was left out",
    );
    expect(note.closest("tr")?.previousElementSibling).toBe(figures);
    expect(note.closest("td")).toHaveAttribute("colspan", "5");
    expect(within(figures as HTMLElement).getAllByRole("cell")).toHaveLength(4);
  });

  it("leaves the change columns empty for a series with a value, a note and no changes", () => {
    show(
      "/signal/issuers/feed/latest",
      change(SCENE, ["snapshot", "feed", "stories", 0, "market", "rows", 1, "changes"], []),
    );
    expect(cells(/^Sample BB:/)).toEqual(["2.22%24 Nov", ""]);
    expect(
      within(table()).getByText("An observation dated 26 Nov, after today (UTC), was left out"),
    ).toBeInTheDocument();
  });

  it("shows a dash, named, where a change has no earlier observation", () => {
    show("/signal/issuers/feed/latest");
    expect(cells(/^Sample rate:/)).toEqual([
      "3.33%24 Nov",
      "—no earlier observation",
      "—no earlier observation",
      "—no earlier observation",
    ]);
    const row = within(table())
      .getByRole("button", { name: /^Sample rate:/ })
      .closest("tr");
    const dashes = Array.from(row?.querySelectorAll("[aria-hidden='true']") ?? []).filter(
      (mark) => mark.textContent === "—",
    );
    expect(dashes).toHaveLength(3);
    expect(within(row as HTMLElement).getAllByText("no earlier observation")).toHaveLength(3);
  });

  it("names each series in full, with its source, and shows both on a row beneath when asked", () => {
    show("/signal/issuers/feed/latest");
    const control = within(table()).getByRole("button", {
      name: "Sample HY: Sample high-yield spread (a made-up series). Source: Sample figures, not market data",
    });
    expect(control).toHaveAttribute("aria-expanded", "false");
    expect(within(table()).getAllByRole("row")).toHaveLength(7);
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-expanded", "true");
    const detail = document.getElementById(control.getAttribute("aria-controls") ?? "");
    expect(detail?.tagName).toBe("TR");
    expect(detail).toHaveTextContent(
      "Sample high-yield spread (a made-up series). Source: Sample figures, not market data",
    );
    expect(detail?.previousElementSibling).toBe(control.closest("tr"));
    expect(within(table()).getAllByRole("row")).toHaveLength(8);
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-expanded", "false");
    expect(within(table()).getAllByRole("row")).toHaveLength(7);
  });

  it("sets figures and dates in mono with tabular numerals, right-aligned, the series' name kept in view", () => {
    show("/signal/issuers/feed/latest");
    const figure = within(table()).getByText("1.11%");
    expect(figure.className.split(" ")).toEqual(
      expect.arrayContaining(["font-mono", "text-mono", "tabular-nums"]),
    );
    expect(within(table()).getAllByText("24 Nov")[0]?.className.split(" ")).toEqual(
      expect.arrayContaining(["font-mono", "text-caption", "tabular-nums"]),
    );
    expect(figure.closest("td")?.className.split(" ")).toEqual(
      expect.arrayContaining(["text-right", "whitespace-nowrap"]),
    );
    const header = within(table())
      .getByRole("button", { name: /^Sample HY:/ })
      .closest("th");
    expect(header?.getAttribute("scope")).toBe("row");
    expect(header?.className.split(" ")).toEqual(
      expect.arrayContaining(["sticky", "left-0", "bg-surface-card", "text-left"]),
    );
    expect(table().className.split(" ")).toContain("min-w-88");
  });

  it("uses a sign and a number for a move: no colour, arrow or word that judges it", () => {
    show("/signal/issuers/feed/latest");
    const region = card(MARKET).getByRole("region", { name: `Table: ${MARKET}` });
    expect(region.innerHTML).not.toMatch(/success|warning|error|danger|positive|negative/);
    expect(region.innerHTML).not.toMatch(/text-(green|red|orange|teal)|bg-(green|red|orange)/);
    expect(region.textContent).not.toMatch(/[▲▼↑↓↗↘]/);
    expect(region.textContent).not.toMatch(/\b(better|worse|wider|tighter|up|down|good|bad)\b/i);
  });

  it("says under the table what the two kinds of date are", () => {
    show("/signal/issuers/feed/latest");
    expect(
      card(MARKET).getByText(
        "The date under a value is that series' own; the date under a change is the earlier observation it is measured from.",
      ),
    ).toBeInTheDocument();
  });
});

describe("Settings, Issuers", () => {
  const rows = () => within(page().getByRole("tabpanel")).getAllByRole("listitem");
  const row = (name: string) => {
    const found = page().getByText(name, { selector: "b" }).closest("li");
    return within(found as HTMLElement);
  };

  it("is a writer's section, listed after Topics", () => {
    show("/signal/issuers/settings/issuers");
    expect(texts(page().getAllByRole("tab"))).toEqual([
      "Groups",
      "Thread rules",
      "Sources",
      "Topics",
      "Issuers",
      "Digests",
      "Notifications",
      "AI and cost",
    ]);
    expect(page().getByRole("tab", { name: "Issuers" })).toHaveAttribute("aria-selected", "true");
    expect(page().getByRole("heading", { level: 2, name: "Issuers" })).toBeInTheDocument();
  });

  it("lists each issuer with its aliases, SEC number, library key and its filing source's sentence", () => {
    show("/signal/issuers/settings/issuers");
    expect(texts(page().getAllByText(/./, { selector: "li > div > b" }))).toEqual([
      "Brightwell Foods",
      "Corvane Packaging",
      "Halvorsen Marine",
      "Tessaly Telecom",
    ]);
    const tessaly = row("Tessaly Telecom");
    expect(
      texts(
        within(tessaly.getByRole("list", { name: "Aliases: Tessaly Telecom" })).getAllByRole(
          "listitem",
        ),
      ),
    ).toEqual(["Tessaly", "TSLY"]);
    expect(tessaly.getByText("0000000017").parentElement).toHaveTextContent(
      "SEC number 0000000017",
    );
    expect(tessaly.getByText("id:tessaly").parentElement).toHaveTextContent(
      "Library key id:tessaly",
    );
    expect(tessaly.getByText("Filings: Approved. Checked 6 min ago.")).toBeInTheDocument();
    const halvorsen = row("Halvorsen Marine");
    expect(halvorsen.getByText("No aliases")).toBeInTheDocument();
    expect(halvorsen.getByText("No library key")).toBeInTheDocument();
    expect(
      halvorsen.getByText(
        "Filings: Proposed. Nothing is fetched until the owner approves it on the command line.",
      ),
    ).toBeInTheDocument();
    const corvane = row("Corvane Packaging");
    expect(corvane.getByText("No SEC number")).toBeInTheDocument();
    expect(corvane.queryByText(/^Filings:/)).toBeNull();
    expect(rows().length).toBeGreaterThanOrEqual(4);
  });

  it("says once, above the list, whether filings are fetched: the service's sentence", () => {
    show("/signal/issuers/settings/issuers");
    const note = page().getAllByText(
      "Filings are fetched from the SEC at most once a second, saying who is asking with the contact the owner set on the command line.",
    );
    expect(note).toHaveLength(1);
    const list = page().getByText("Brightwell Foods", { selector: "b" }).closest("ul");
    expect(
      (note[0] as HTMLElement).compareDocumentPosition(list as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("draws New issuer, Edit and Delete disabled in the sample, with the reason in view", () => {
    show("/signal/issuers/settings/issuers");
    const reason = page().getByText("Sample data: issuers cannot be changed here.");
    const controls = [
      page().getByRole("button", { name: "New issuer" }),
      page().getByRole("button", { name: "Edit: Tessaly Telecom" }),
      page().getByRole("button", { name: "Delete: Tessaly Telecom" }),
    ];
    for (const control of controls) {
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute("aria-describedby", reason.id);
    }
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is not listed for a reader, who is told the section is for writers at its address", () => {
    const reader = change(SCENE, ["snapshot", "viewer"], {
      name: "Tobias O",
      initials: "TO",
      role: "reader",
      roleLabel: "Reader",
    });
    show("/signal/issuers/settings/issuers", reader);
    expect(texts(page().getAllByRole("tab"))).toEqual(["Topics", "Notifications"]);
    expect(page().getByText("This section is for writers")).toBeInTheDocument();
    expect(page().queryByText("Tessaly Telecom")).toBeNull();
    expect(page().queryByRole("button", { name: "New issuer" })).toBeNull();
    // The watchlist itself is a reader's too: the channel list and its stars.
    expect(channels().getByRole("button", { name: "Unfollow Tessaly Telecom" })).toBeEnabled();
  });

  it("does not exist where the snapshot says nothing of issuers", () => {
    show("/signal/main/settings/issuers");
    expect(page().queryByRole("tab", { name: "Issuers" })).toBeNull();
    expect(page().getByText("No such settings section")).toBeInTheDocument();
  });

  it("says there are none yet for an empty watchlist, with New issuer still there", () => {
    show("/signal/issuers/settings/issuers", emptied());
    expect(page().getByText("No issuers yet")).toBeInTheDocument();
    expect(page().getByRole("button", { name: "New issuer" })).toBeInTheDocument();
  });
});

describe("what else Settings shows of issuers and the new kinds", () => {
  it("offers each issuer among what a digest covers", () => {
    show("/signal/issuers/settings/digests");
    fireEvent.click(page().getByRole("button", { name: /Covers/ }));
    expect(texts(screen.getAllByRole("option"))).toEqual([
      "All stories",
      "Topic: Telecoms",
      "Topic: Packaging",
      "Topic: Shipping",
      "Issuer: Brightwell Foods",
      "Issuer: Corvane Packaging",
      "Issuer: Halvorsen Marine",
      "Issuer: Tessaly Telecom",
    ]);
    fireEvent.click(screen.getByRole("option", { name: "Issuer: Tessaly Telecom" }));
    expect(page().getByRole("button", { name: /Covers/ })).toHaveTextContent(
      "Issuer: Tessaly Telecom",
    );
  });

  it("names a filing or market source's kind as delivered", () => {
    show("/signal/issuers/settings/sources");
    const table = within(page().getByRole("region", { name: "Sources table" }));
    const kind = (name: string) =>
      table.getByText(name, { selector: "b" }).closest("tr")?.querySelector("small")?.textContent;
    expect(kind("Tessaly Telecom filings (SEC)")).toBe("Filings");
    expect(kind("Market backdrop (sample)")).toBe("Market data");
    expect(kind("Harbour Wire")).toBe("News");
  });

  it("lists Filings among the kinds of a topic that takes every kind", () => {
    show("/signal/issuers/settings/topics");
    expect(
      texts(
        within(page().getByRole("list", { name: "Kinds: Packaging" })).getAllByRole("listitem"),
      ),
    ).toEqual(["News", "Regulatory cases", "Rating actions", "Research", "Filings"]);
  });
});

describe("For you with only an issuer followed", () => {
  it("does not ask the reader to follow a topic", () => {
    const copy = structuredClone(fixture.slice);
    const scene = copy.scenes[SCENE]?.snapshot as unknown as {
      feed: { views: Record<string, unknown> };
    };
    scene.feed.views["for-you"] = { top: [], latest: [], waiting: null, older: [] };
    show("/signal/issuers/feed/for-you", copy);
    expect(page().queryByText("Follow a topic to fill this view")).toBeNull();
    expect(page().getByText("No stories yet")).toBeInTheDocument();
  });
});
