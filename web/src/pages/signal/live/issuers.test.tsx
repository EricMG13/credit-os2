// Issuers, filings and the market post on the live page, over the service's format-2 sample on a
// stand-in for the local server: what the page asks the snapshot to carry, every issuer write as
// the service takes it, and a refusal as the service's own sentence. Paths, bodies, names and
// sentences are written out by hand.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import {
  content,
  format2With,
  go,
  lookAgain,
  refusal,
  serve,
  showLive,
  type Snapshot,
} from "./test-helpers";

const READ = "GET /signal/api/snapshot?format=2";
const FILING = "Tessaly Telecom: 8-K, current report";
const TOWERS = "Tessaly Telecom agrees the sale of its towers";
const REVIEW = "Authority opens a review of the Tessaly Telecom tower sale";
const QUARTERLY = "Tessaly Telecom: 10-Q, quarterly report [Sections 13 or 15(d)]";
const HOLDINGS =
  "Tessaly Telecom: SC 13G/A, [Amend] Statement of acquisition of beneficial ownership by individuals";
const MARKET = "Market backdrop: 24 November 2026";

const title = (name: string) => screen.findByRole("heading", { level: 1, name });
const headlines = () =>
  content()
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
const channels = () => within(screen.getByRole("navigation", { name: "Signal" }));
const press = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole("button", { name }));
};
const type = (label: string | RegExp, value: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } });
};
const parsed = (bodies: unknown[]) => bodies.map((body) => JSON.parse(body as string) as unknown);
const reader = (snapshot: Snapshot) => {
  snapshot.viewer = { name: "Tobias O", initials: "TO", role: "reader", roleLabel: "Reader" };
};

describe("what the page asks for", () => {
  it("asks for format 2 on arriving, and draws the filings and the market post it then gets", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    expect(service.calls).toEqual([READ]);
    expect(headlines().slice(0, 3)).toEqual([MARKET, FILING, TOWERS]);
    expect(channels().getByRole("heading", { level: 2, name: "Issuers" })).toBeInTheDocument();
  });

  it("asks for an issuer in full on its page, once the snapshot lists it", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/issuer/1");
    await title("Tessaly Telecom");
    await waitFor(() => {
      expect(service.calls).toEqual([READ, `${READ}&issuer=1`]);
    });
    expect(headlines()).toEqual([FILING, TOWERS, REVIEW, QUARTERLY, HOLDINGS]);
    // Later reads on that page ask the same; moving to another issuer asks for that one.
    await lookAgain();
    expect(service.calls.at(-1)).toBe(`${READ}&issuer=1`);
    await go("#/signal/main/issuer/3");
    await title("Halvorsen Marine");
    await waitFor(() => {
      expect(service.calls.at(-1)).toBe(`${READ}&issuer=3`);
    });
    // Leaving for a feed view asks for nothing more; the next read is the plain one.
    const reads = service.reads();
    await go("#/signal/main/feed/saved");
    await title("Saved");
    expect(service.reads()).toBe(reads);
    await lookAgain();
    expect(service.calls.at(-1)).toBe(READ);
  });

  it("asks for a topic, not an issuer of the same id, on the topic's page", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/topic/1");
    await title("Packaging");
    await waitFor(() => {
      expect(service.calls).toEqual([READ, `${READ}&topic=1`]);
    });
  });

  it.each([
    ["an issuer the snapshot does not list", "#/signal/main/issuer/99"],
    ["an id that is no id", "#/signal/main/issuer/1%26topic%3D2"],
    ["an id that is a prototype's name", "#/signal/main/issuer/constructor"],
  ])("sends no id for %s, and says there is no such issuer", async (_, hash) => {
    const service = serve(format2With());
    showLive(hash);
    await title("No such issuer");
    await lookAgain();
    expect(service.calls).toEqual([READ, READ]);
    expect(document.body).not.toHaveTextContent(/sample/i);
  });

  it("shows an issuer's older stories behind Show older, not as new stories", async () => {
    const service = serve(format2With());
    service.replies.set(`${READ}&issuer=2`, () =>
      Response.json(
        format2With((s) => {
          const corvane = s.feed.issuers?.["2"];
          if (corvane !== undefined) corvane.older = ["3"];
        }),
      ),
    );
    showLive("#/signal/main/issuer/2");
    await title("Corvane Packaging");
    fireEvent.click(await content().findByRole("button", { name: "Show older" }));
    expect(headlines()).toEqual([
      "Corvane Packaging to close two plants as volumes fall",
      "Brightwell Foods extends its term loan by three years",
    ]);
    expect(content().queryByText(/new stor/)).toBeNull();
  });

  it("keeps an issuer's list as drawn across a read and puts the story that arrives behind the pill", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/issuer/1");
    await title("Tessaly Telecom");
    await waitFor(() => {
      expect(service.reads()).toBe(2);
    });
    service.snapshot = format2With((s) => {
      const like = s.feed.stories.find((story) => story.id === "2");
      if (like === undefined) throw new Error("the sample holds story 2");
      s.feed.stories.unshift({ ...like, id: "11", headline: "Tessaly Telecom names a chief" });
      for (const view of [s.feed.views.latest, s.feed.issuers?.["1"]]) {
        view?.top.unshift("11");
        view?.latest.unshift("11");
      }
      const channel = s.channels.issuers?.find((issuer) => issuer.id === "1");
      if (channel !== undefined) channel.count = "6";
    });
    await lookAgain();
    expect(await content().findByText("1 new story")).toBeInTheDocument();
    expect(headlines()).toEqual([FILING, TOWERS, REVIEW, QUARTERLY, HOLDINGS]);
    fireEvent.click(content().getByRole("button", { name: /^Show 1 new / }));
    expect(headlines()[0]).toBe("Tessaly Telecom names a chief");
    expect(channels().getByRole("link", { name: /^Tessaly Telecom/ })).toHaveTextContent("6");
  });
});

describe("following an issuer", () => {
  it("follows from the channel list, tells the service and reads again", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    fireEvent.click(channels().getByRole("button", { name: "Follow Corvane Packaging" }));
    expect(channels().getByRole("button", { name: "Unfollow Corvane Packaging" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await waitFor(() => {
      expect(service.calls).toEqual([READ, "POST /signal/api/issuers/2/follow", READ]);
    });
    expect(service.bodies).toEqual([]);
  });

  it("unfollows from the issuer's page with DELETE, and the topic of the same id keeps its star", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/issuer/1");
    await title("Tessaly Telecom");
    await waitFor(() => {
      expect(service.reads()).toBe(2);
    });
    // Issuer 1 (Tessaly Telecom) and topic 1 (Packaging) are both followed in the sample.
    fireEvent.click(content().getByRole("button", { name: "Following" }));
    expect(content().getByRole("button", { name: "Follow" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(channels().getByRole("button", { name: "Follow Tessaly Telecom" })).toBeInTheDocument();
    expect(channels().getByRole("button", { name: "Unfollow Packaging" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await waitFor(() => {
      expect(service.writes()).toEqual(["DELETE /signal/api/issuers/1/follow"]);
    });
    expect(service.calls.at(-1)).toBe(`${READ}&issuer=1`);
  });

  it("puts a refused follow back and shows the service's sentence", async () => {
    const service = serve(format2With());
    service.replies.set("POST /signal/api/issuers/2/follow", refusal(404, "no issuer with id 2"));
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    fireEvent.click(channels().getByRole("button", { name: "Follow Corvane Packaging" }));
    expect(await content().findByText("no issuer with id 2")).toBeInTheDocument();
    expect(channels().getByRole("button", { name: "Follow Corvane Packaging" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(service.reads()).toBe(1);
  });

  it("is a reader's too", async () => {
    const service = serve(format2With(reader));
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    fireEvent.click(channels().getByRole("button", { name: "Follow Halvorsen Marine" }));
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/issuers/3/follow"]);
    });
  });
});

describe("the way to the Library", () => {
  const links = () =>
    screen.getAllByRole("link", { hidden: true }).map((link) => link.getAttribute("href") ?? "");

  it("is the connected app's Library, for an issuer a writer gave a library key", async () => {
    serve(format2With());
    showLive("#/signal/main/issuer/1");
    await title("Tessaly Telecom");
    expect(content().getByRole("link", { name: "Open in Library" })).toHaveAttribute("href", "/");
  });

  it("is not drawn for an issuer with no library key", async () => {
    serve(format2With());
    showLive("#/signal/main/issuer/2");
    await title("Corvane Packaging");
    expect(content().queryByRole("link", { name: "Open in Library" })).toBeNull();
  });

  it.each(["javascript:alert(1)", "https://evil.example/", "//evil.example", "data:text/html,x"])(
    "never puts the stored key %s in an address",
    async (key) => {
      serve(
        format2With((s) => {
          const tessaly = s.settings.issuers?.find((issuer) => issuer.id === "1");
          if (tessaly !== undefined) tessaly.libraryKey = key;
        }),
      );
      showLive("#/signal/main/issuer/1");
      await title("Tessaly Telecom");
      expect(content().getByRole("link", { name: "Open in Library" })).toHaveAttribute("href", "/");
      expect(links().filter((href) => /javascript|evil|data:/i.test(href))).toEqual([]);
      // Settings shows the key as text, for a writer to correct.
      await go("#/signal/main/settings/issuers");
      await title("Settings");
      expect(content().getByText(key)).toBeInTheDocument();
      expect(links().filter((href) => /javascript|evil|data:/i.test(href))).toEqual([]);
    },
  );
});

describe("Settings, Issuers, on the service", () => {
  const open = async (given?: (snapshot: Snapshot) => void) => {
    const service = serve(format2With(given));
    showLive("#/signal/main/settings/issuers");
    await title("Settings");
    return service;
  };

  it("adds an issuer: every field sent, an empty one as none", async () => {
    const service = await open();
    press("New issuer");
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByRole("heading", { name: "New issuer" })).toBeInTheDocument();
    expect(dialog.getByText(/^10 digits\./)).toBeInTheDocument();
    type(/^Name/, "  Brightwell Foods ");
    type(/^Aliases/, " Brightwell , BWF,, ");
    type(/^SEC number/, "0000000099");
    press("Add issuer");
    await waitFor(() => {
      expect(service.calls).toEqual([READ, "POST /signal/api/issuers", READ]);
    });
    expect(parsed(service.bodies)).toEqual([
      {
        name: "Brightwell Foods",
        aliases: ["Brightwell", "BWF"],
        cik: "0000000099",
        libraryKey: null,
      },
    ]);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("asks for a name before it sends anything", async () => {
    const service = await open();
    press("New issuer");
    await screen.findByRole("dialog");
    press("Add issuer");
    expect(screen.getByText("Enter the issuer's name.")).toBeInTheDocument();
    expect(service.writes()).toEqual([]);
  });

  it("edits an issuer from what it holds, replacing all four", async () => {
    const service = await open();
    press("Edit: Tessaly Telecom");
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByRole("heading", { name: "Edit Tessaly Telecom" })).toBeInTheDocument();
    expect(dialog.getByRole("textbox", { name: /^Name/ })).toHaveValue("Tessaly Telecom");
    expect(dialog.getByRole("textbox", { name: /^Aliases/ })).toHaveValue("Tessaly");
    expect(dialog.getByRole("textbox", { name: /^SEC number/ })).toHaveValue("0001702780");
    expect(dialog.getByRole("textbox", { name: /^Library key/ })).toHaveValue("id:tessaly");
    type(/^Aliases/, "Tessaly, TSLY");
    type(/^SEC number/, "");
    press("Save issuer");
    await waitFor(() => {
      expect(service.calls).toEqual([READ, "POST /signal/api/issuers/1/edit", READ]);
    });
    expect(parsed(service.bodies)).toEqual([
      {
        name: "Tessaly Telecom",
        aliases: ["Tessaly", "TSLY"],
        cik: null,
        libraryKey: "id:tessaly",
      },
    ]);
  });

  it("sends an issuer of no aliases, SEC number or key as an empty list and nulls", async () => {
    const service = await open();
    press("Edit: Corvane Packaging");
    await screen.findByRole("dialog");
    type(/^Aliases/, "");
    press("Save issuer");
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/issuers/2/edit"]);
    });
    expect(parsed(service.bodies)).toEqual([
      { name: "Corvane Packaging", aliases: [], cik: null, libraryKey: null },
    ]);
  });

  it.each([
    ["a CIK is 10 digits, such as 0000320193", 400],
    ["the CIK 0001702780 is already that of the issuer 'Tessaly Telecom'", 409],
    ["'GE' needs at least 3 letters or digits to be matched", 400],
  ])(
    "shows the refusal %j in the dialog, keeps what was typed and reads nothing",
    async (sentence, status) => {
      const service = await open();
      service.replies.set("POST /signal/api/issuers", refusal(status, sentence));
      press("New issuer");
      await screen.findByRole("dialog");
      type(/^Name/, "Lenmark Shipping");
      type(/^SEC number/, "12345");
      press("Add issuer");
      const dialog = within(await screen.findByRole("dialog"));
      expect(await dialog.findByText(sentence)).toBeInTheDocument();
      expect(dialog.getByRole("textbox", { name: /^Name/ })).toHaveValue("Lenmark Shipping");
      expect(dialog.getByRole("textbox", { name: /^SEC number/ })).toHaveValue("12345");
      expect(service.reads()).toBe(1);
      // The sentence is the dialog's, not the page's alert behind it.
      expect(content().queryByText(sentence)).toBeNull();
    },
  );

  it("asks before it deletes, then sends DELETE and reads again", async () => {
    const service = await open();
    press("Delete: Halvorsen Marine");
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByRole("heading", { name: "Delete Halvorsen Marine?" })).toBeInTheDocument();
    expect(
      dialog.getByText(
        "The issuer leaves the watchlist for everyone: its page, its follows and its place in digests go, and its filings are no longer fetched. Stories already in the feed stay. This cannot be undone.",
      ),
    ).toBeInTheDocument();
    expect(service.writes()).toEqual([]);
    press("Delete issuer");
    await waitFor(() => {
      expect(service.calls).toEqual([READ, "DELETE /signal/api/issuers/3", READ]);
    });
    expect(service.bodies).toEqual([]);
  });

  it("deletes nothing when the question is cancelled", async () => {
    const service = await open();
    press("Delete: Halvorsen Marine");
    await screen.findByRole("dialog");
    press("Cancel");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(service.writes()).toEqual([]);
  });

  it("shows the service's sentence where filings are not fetched, and each source's own", async () => {
    await open((s) => {
      s.settings.filings = {
        contactSet: false,
        note: "Filings are not fetched: the SEC asks every automated client to say who is asking, and the owner has not set that contact on the command line.",
      };
      const tessaly = s.settings.issuers?.find((issuer) => issuer.id === "1");
      if (tessaly?.source != null) {
        tessaly.source.note =
          "Approved, but not fetched: the owner has not set the contact the SEC asks for.";
      }
    });
    expect(
      content().getByText(
        "Filings are not fetched: the SEC asks every automated client to say who is asking, and the owner has not set that contact on the command line.",
      ),
    ).toBeInTheDocument();
    expect(
      content().getByText(
        "Filings: Approved, but not fetched: the owner has not set the contact the SEC asks for.",
      ),
    ).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/sample/i);
  });

  it("is not a reader's: no tab, no list and no control at its address", async () => {
    const service = await open(reader);
    expect(
      content()
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["Topics", "Digests", "Notifications"]);
    expect(content().getByText("This section is for writers")).toBeInTheDocument();
    expect(content().queryByRole("button", { name: "New issuer" })).toBeNull();
    expect(content().queryByText("0001702780")).toBeNull();
    expect(service.writes()).toEqual([]);
  });
});

describe("what a digest covers", () => {
  it("can be an issuer: the chosen words go to the service as delivered", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/settings/digests");
    await title("Settings");
    type(/^Name/, "Tessaly watch");
    press(/Covers/);
    fireEvent.click(screen.getByRole("option", { name: "Issuer: Tessaly Telecom" }));
    press("Save digest");
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/digests"]);
    });
    expect(parsed(service.bodies)).toMatchObject([
      { name: "Tessaly watch", covers: "Issuer: Tessaly Telecom" },
    ]);
  });
});

describe("a topic that takes every kind", () => {
  it("keeps taking every kind, filings included, when only its name is changed", async () => {
    const service = serve(format2With());
    showLive("#/signal/main/settings/topics");
    await title("Settings");
    // Packaging (topic 1) has no kind rule: format 2 lists Filings among its kinds.
    press("Edit: Packaging");
    const dialog = within(await screen.findByRole("dialog"));
    for (const kind of ["News", "Regulatory cases", "Rating actions", "Research"]) {
      expect(dialog.getByRole("switch", { name: kind })).not.toBeChecked();
    }
    expect(dialog.queryByRole("switch", { name: "Filings" })).toBeNull();
    expect(
      dialog.getByText("With none switched on, the topic takes every kind, filings included."),
    ).toBeInTheDocument();
    type(/^Name/, "Packaging and paper");
    press("Save topic");
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/topics/1/edit"]);
    });
    expect(parsed(service.bodies)).toEqual([
      { name: "Packaging and paper", keywords: ["packaging", "plant closure"], kinds: [] },
    ]);
  });

  it("starts a topic of chosen kinds with those switched on", async () => {
    serve(format2With());
    showLive("#/signal/main/settings/topics");
    await title("Settings");
    press("Edit: Telecoms");
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByRole("switch", { name: "News" })).toBeChecked();
    expect(dialog.getByRole("switch", { name: "Regulatory cases" })).toBeChecked();
    expect(dialog.getByRole("switch", { name: "Research" })).not.toBeChecked();
  });
});

describe("the new kinds on the live page", () => {
  it("draws the filings under their tab, each with its form type first and no AI mark", async () => {
    serve(format2With());
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    fireEvent.click(content().getByRole("tab", { name: "Filings" }));
    expect(headlines()).toEqual([FILING, QUARTERLY, HOLDINGS]);
    const first = within(
      content().getByRole("heading", { level: 2, name: FILING }).closest("article") as HTMLElement,
    );
    expect(first.getByText("Filing")).toBeInTheDocument();
    const tags = first.getAllByRole("list").find((list) => !list.hasAttribute("aria-label"));
    expect(tags?.textContent).toBe("8-K");
    expect(
      within(first.getByRole("list", { name: "About" })).getByRole("link", {
        name: "Tessaly Telecom",
      }),
    ).toHaveAttribute("href", "#/signal/main/issuer/1");
    expect(first.getByRole("link", { name: /^Open source: / })).toHaveAttribute(
      "href",
      "https://www.sec.gov/Archives/edgar/data/1702780/000119312526123456/0001193125-26-123456-index.htm",
    );
    expect(content().queryByRole("group", { name: "Written by AI" })).toBeNull();
  });

  it("draws the market post's table from what the service delivered, each value with its own date", async () => {
    serve(format2With());
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    const post = within(
      content().getByRole("heading", { level: 2, name: MARKET }).closest("article") as HTMLElement,
    );
    const table = within(post.getByRole("table"));
    const cells = (name: RegExp) =>
      within(table.getByRole("button", { name }).closest("tr") as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent);
    expect(cells(/^US HY:/)).toEqual(["3.12%24 Nov", "+4 bp20 Nov", "-8 bp17 Nov", "+12 bp23 Oct"]);
    expect(cells(/^US BB:/)).toEqual([
      "Could not be read: the CSV's header is not observation_date,BAMLH0A1HYBB",
    ]);
    expect(cells(/^UST 2y:/)).toEqual(["Could not be read: server answered HTTP 500"]);
    // The 10-year's own date is a day earlier than the post's, and its "week" is since 23 October.
    expect(cells(/^UST 10y:/)).toEqual([
      "4.30%23 Nov",
      "-3.5 bp20 Nov",
      "-10 bp23 Oct",
      "-10 bp23 Oct",
    ]);
    expect(cells(/^SOFR:/)).toEqual([
      "4.57%24 Nov",
      "—no earlier observation",
      "—no earlier observation",
      "—no earlier observation",
    ]);
    expect(
      table.getByRole("button", {
        name: "UST 10y: Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis. Source: Board of Governors of the Federal Reserve System (US), via FRED",
      }),
    ).toBeInTheDocument();
    expect(post.getByRole("link", { name: /^Open source: / })).toHaveAttribute(
      "href",
      "https://fred.stlouisfed.org/",
    );
    expect(post.getByRole("button", { name: `Save: ${MARKET}` })).toBeInTheDocument();
  });
});
