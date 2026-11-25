// The reader over what format 2 of the snapshot adds: the two new story kinds, a story's issuers
// and a market post's table, the issuer watchlist in the channel list, the feed and Settings, and
// the filings line. Each rule is checked on a copy of the service's own format-2 sample with one
// member changed; the reasons are written out by hand.
import fixture from "../../../fixtures/signal.json";
import { format2With, type Snapshot } from "./live/test-helpers";
import { readSlice, type SignalMarketRow, type SignalStory } from "./slice";

const AT = "scenes[0].snapshot";

function read(source: unknown) {
  const got = readSlice(source);
  if (got.kind !== "ok") throw new Error(got.kind === "invalid" ? got.reason : "no slice");
  return got.data.scenes[0].snapshot;
}
const refusal = (edit: (snapshot: Snapshot) => void) => {
  const got = readSlice(format2With(edit));
  return got.kind === "invalid" ? got.reason : got.kind;
};
/** The sample's stories by what they are: the market post (id 10), a filing (7) and a news story (2). */
const story = (snapshot: Snapshot, id: string): SignalStory => {
  const found = snapshot.feed.stories.find((one) => one.id === id);
  if (found === undefined) throw new Error(`the sample holds no story ${id}`);
  return found;
};
const rows = (snapshot: Snapshot): SignalMarketRow[] => {
  const table = story(snapshot, "10").market;
  if (table === null) throw new Error("the sample's market post has a table");
  return table.rows;
};
/** The table's rows by position: 0 US HY (figures), 1 US BB (a note), 4 SOFR (no earlier observation). */
const row = (snapshot: Snapshot, index: number): SignalMarketRow => {
  const found = rows(snapshot)[index];
  if (found === undefined) throw new Error(`the sample's table has no row ${String(index)}`);
  return found;
};
/** A member the service might leave out, taken off the copy. */
const drop = (holder: object, key: string) => {
  Reflect.deleteProperty(holder, key);
};

describe("format 2 as the service delivers it", () => {
  it("is read whole: both new kinds, the issuers and the market table", () => {
    const snapshot = read(format2With());
    expect(snapshot.feed.stories.map((one) => [one.id, one.kind, one.kindLabel])).toEqual([
      ["10", "market", "Market"],
      ["7", "filing", "Filing"],
      ["2", "news", "News"],
      ["1", "news", "News"],
      ["3", "news", "News"],
      ["5", "ratings", "Rating action"],
      ["4", "regulator", "Regulatory case"],
      ["8", "filing", "Filing"],
      ["6", "news", "News"],
      ["9", "filing", "Filing"],
    ]);
    expect(snapshot.channels.issuers).toEqual([
      { id: "2", name: "Corvane Packaging", count: "1", followed: false },
      { id: "3", name: "Halvorsen Marine", count: "1", followed: false },
      { id: "1", name: "Tessaly Telecom", count: "5", followed: true },
    ]);
    expect(Object.keys(snapshot.feed.issuers ?? {}).sort()).toEqual(["1", "2", "3"]);
    expect(snapshot.feed.issuers?.["1"]?.latest).toEqual(["7", "2", "4", "8", "9"]);
    expect(story(snapshot, "7").issuers).toEqual([{ id: "1", name: "Tessaly Telecom" }]);
    expect(story(snapshot, "7").tags).toEqual(["8-K"]);
    expect(story(snapshot, "10").tags).toEqual(["Market"]);
    expect(story(snapshot, "3").issuers).toEqual([]);
    expect(story(snapshot, "7").market).toBeNull();
    expect(story(snapshot, "10").market?.asOf).toBe("24 November 2026");
    expect(row(snapshot, 0)).toEqual({
      id: "BAMLH0A0HYM2",
      name: "ICE BofA US High Yield Index Option-Adjusted Spread",
      short: "US HY",
      unit: "Percent",
      value: "3.12",
      date: "24 Nov",
      changes: [
        { label: "Previous", since: "20 Nov", value: "+4 bp" },
        { label: "Week", since: "17 Nov", value: "-8 bp" },
        { label: "Month", since: "23 Oct", value: "+12 bp" },
      ],
      source: "ICE Data Indices, LLC, via FRED",
      note: null,
    });
    expect(row(snapshot, 1)).toMatchObject({
      value: null,
      date: null,
      changes: [],
      note: "Could not be read: the CSV's header is not observation_date,BAMLH0A1HYBB",
    });
    expect(row(snapshot, 4).changes).toEqual([
      { label: "Previous", since: null, value: null },
      { label: "Week", since: null, value: null },
      { label: "Month", since: null, value: null },
    ]);
  });

  it("delivers the watchlist to Settings with each filing source's sentence, and the filings line", () => {
    const { settings } = read(format2With());
    expect(settings.issuers).toEqual([
      {
        id: "2",
        name: "Corvane Packaging",
        aliases: ["Corvane"],
        cik: null,
        libraryKey: null,
        source: null,
      },
      {
        id: "3",
        name: "Halvorsen Marine",
        aliases: [],
        cik: "0000000042",
        libraryKey: "name:Halvorsen Marine",
        source: {
          id: "8",
          state: "Proposed",
          note: "Proposed. Nothing is fetched until the owner approves it on the command line.",
        },
      },
      {
        id: "1",
        name: "Tessaly Telecom",
        aliases: ["Tessaly"],
        cik: "0001702780",
        libraryKey: "id:tessaly",
        source: { id: "7", state: "Approved", note: "Approved. Checked just now." },
      },
    ]);
    expect(settings.filings).toEqual({
      contactSet: true,
      note: "Filings are fetched from the SEC at most once a second, saying who is asking with the contact the owner set on the command line.",
    });
    expect(settings.digestForm.coversOptions.filter((one) => one.startsWith("Issuer: "))).toEqual([
      "Issuer: Corvane Packaging",
      "Issuer: Halvorsen Marine",
      "Issuer: Tessaly Telecom",
    ]);
    expect(settings.sources.map((source) => source.kind).slice(-3)).toEqual([
      "Filings",
      "Filings",
      "Market data",
    ]);
    // A topic of no kinds says it takes filings too.
    expect(settings.topics[0]?.kinds).toEqual([
      "News",
      "Regulatory cases",
      "Rating actions",
      "Research",
      "Filings",
    ]);
  });

  it("reads its own answer again as it gave it (a held view is read twice)", () => {
    const once = readSlice(format2With());
    if (once.kind !== "ok") throw new Error("the sample is read");
    expect(readSlice(once.data)).toEqual(once);
  });
});

describe("a snapshot that says nothing of issuers or markets", () => {
  it("reads as none: the design fixture's first scene has no such key", () => {
    const main = fixture.slice.scenes[0];
    expect(main).toBeDefined();
    expect(Object.keys(main?.snapshot.channels ?? {})).not.toContain("issuers");
    const got = readSlice(fixture.slice);
    if (got.kind !== "ok") throw new Error("the fixture is read");
    const { channels, feed, settings } = got.data.scenes[0].snapshot;
    expect(channels.issuers).toBeNull();
    expect(feed.issuers).toBeNull();
    expect(settings.issuers).toBeNull();
    expect(settings.filings).toBeNull();
    expect(feed.stories.map((one) => one.issuers)).toEqual(feed.stories.map(() => []));
    expect(feed.stories.map((one) => one.market)).toEqual(feed.stories.map(() => null));
    // Read again as given, the nulls stay absent.
    expect(readSlice(got.data).kind).toBe("ok");
  });

  it("accepts a story's issuers where no channel list is delivered to hold them to", () => {
    const snapshot = read(
      format2With((s) => {
        drop(s.channels, "issuers");
        drop(s.feed, "issuers");
      }),
    );
    expect(snapshot.channels.issuers).toBeNull();
    expect(story(snapshot, "2").issuers).toEqual([{ id: "1", name: "Tessaly Telecom" }]);
  });

  it("accepts Settings' issuers with no filings line, and the line with no issuers", () => {
    expect(
      read(
        format2With((s) => {
          drop(s.settings, "filings");
        }),
      ).settings.filings,
    ).toBeNull();
    expect(
      read(
        format2With((s) => {
          drop(s.settings, "issuers");
        }),
      ).settings.issuers,
    ).toBeNull();
  });
});

describe("the issuer watchlist's rules", () => {
  it.each<[string, (snapshot: Snapshot) => void, string]>([
    [
      "an issuer listed twice in the channel list",
      (s) => {
        s.channels.issuers?.push({ id: "2", name: "Corvane again", count: "1", followed: false });
      },
      `${AT}.channels.issuers[3].id: expected an id the list does not repeat`,
    ],
    [
      "a channel issuer with no view in the feed",
      (s) => {
        drop(s.feed.issuers ?? {}, "2");
      },
      `${AT}.feed.issuers.2: expected a view for this channel issuer`,
    ],
    [
      "a channel list with no issuer views at all",
      (s) => {
        drop(s.feed, "issuers");
      },
      `${AT}.feed.issuers.2: expected a view for this channel issuer`,
    ],
    [
      "a view for an issuer the channel list does not hold",
      (s) => {
        if (s.feed.issuers !== null) {
          s.feed.issuers["9"] = { top: [], latest: [], waiting: null, older: [] };
        }
      },
      `${AT}.feed.issuers.9: expected the id of a channel issuer`,
    ],
    [
      "issuer views with no channel list",
      (s) => {
        drop(s.channels, "issuers");
      },
      `${AT}.feed.issuers.1: expected the id of a channel issuer`,
    ],
    [
      "an issuer view naming a story the feed lacks",
      (s) => {
        const view = s.feed.issuers?.["2"];
        view?.top.push("404");
        view?.latest.push("404");
      },
      `${AT}.feed.issuers.2.top[1]: expected the id of a story or digest in the feed`,
    ],
    [
      "a story about an issuer the channel list does not hold",
      (s) => {
        story(s, "2").issuers.push({ id: "9", name: "Nobody plc" });
      },
      `${AT}.feed.stories[2].issuers[1].id: expected the id of an issuer in the channel list`,
    ],
    [
      "a story naming an issuer twice",
      (s) => {
        story(s, "2").issuers.push({ id: "1", name: "Tessaly Telecom" });
      },
      `${AT}.feed.stories[2].issuers[1].id: expected an id the story does not repeat`,
    ],
    [
      "a count beside an issuer's empty view",
      (s) => {
        if (s.feed.issuers !== null) {
          s.feed.issuers["2"] = { top: [], latest: [], waiting: null, older: [] };
        }
      },
      `${AT}.channels.issuers[0].count: expected null or "0" while the issuer's view lists no stories`,
    ],
    [
      'a count of "0" beside an issuer\'s stories',
      (s) => {
        const corvane = s.channels.issuers?.[0];
        if (corvane !== undefined) corvane.count = "0";
      },
      `${AT}.channels.issuers[0].count: expected a count other than "0" while the issuer's view lists stories`,
    ],
    [
      "a Settings issuer the channel list does not hold",
      (s) => {
        s.settings.issuers?.push({
          id: "9",
          name: "Nobody plc",
          aliases: [],
          cik: null,
          libraryKey: null,
          source: null,
        });
      },
      `${AT}.settings.issuers[3].id: expected the id of an issuer in the channel list`,
    ],
    [
      "a Settings issuer under another name",
      (s) => {
        const first = s.settings.issuers?.[0];
        if (first !== undefined) first.name = "Corvane";
      },
      `${AT}.settings.issuers[0].name: expected the name the channel list gives this issuer`,
    ],
    [
      "a channel issuer Settings does not list",
      (s) => {
        s.settings.issuers?.pop();
      },
      `${AT}.settings.issuers: expected an issuer for the channel list's "1"`,
    ],
    [
      "a Settings issuer listed twice",
      (s) => {
        const first = s.settings.issuers?.[0];
        if (first !== undefined) s.settings.issuers?.push({ ...first });
      },
      `${AT}.settings.issuers[3].id: expected an id the list does not repeat`,
    ],
    [
      "an issuer with no id",
      (s) => {
        const first = s.channels.issuers?.[0];
        if (first !== undefined) first.id = "";
      },
      `${AT}.channels.issuers[0].id: expected a non-empty id that an address can hold`,
    ],
  ])("refuses %s", (_, edit, reason) => {
    expect(refusal(edit)).toBe(reason);
  });
});

describe("the new kinds' rules", () => {
  it.each<[string, (snapshot: Snapshot) => void, string]>([
    [
      "a market table on a story that is no market post",
      (s) => {
        story(s, "2").market = story(s, "10").market;
      },
      `${AT}.feed.stories[2].market: expected null on a story that is no market post`,
    ],
    [
      "a market post with no table",
      (s) => {
        story(s, "10").market = null;
      },
      `${AT}.feed.stories[0].market: expected the table of a market post`,
    ],
    [
      "a market post whose table is left out",
      (s) => {
        drop(story(s, "10"), "market");
      },
      `${AT}.feed.stories[0].market: expected the table of a market post`,
    ],
    [
      "an AI line on a filing",
      (s) => {
        story(s, "7").ai = { line: "A model wrote this.", kind: false, tags: [] };
      },
      `${AT}.feed.stories[1].ai: expected null on a filing story`,
    ],
    [
      "a signal strength on a market post",
      (s) => {
        story(s, "10").strength = { marks: 3, word: "Strong" };
      },
      `${AT}.feed.stories[0].strength: expected null on a market story`,
    ],
    [
      "a series with two changes",
      (s) => {
        row(s, 0).changes.pop();
      },
      `${AT}.feed.stories[0].market.rows[0].changes: expected exactly three changes`,
    ],
    [
      "a series with four changes",
      (s) => {
        row(s, 0).changes.push({ label: "Year", since: "24 Nov", value: "+1 bp" });
      },
      `${AT}.feed.stories[0].market.rows[0].changes: expected exactly three changes`,
    ],
    [
      "a series with a value and no changes",
      (s) => {
        row(s, 0).changes = [];
      },
      `${AT}.feed.stories[0].market.rows[0].changes: expected exactly three changes`,
    ],
    [
      "a series with a note and one change",
      (s) => {
        row(s, 1).changes = [{ label: "Previous", since: null, value: null }];
      },
      `${AT}.feed.stories[0].market.rows[1].changes: expected three changes or none on a series with a note`,
    ],
    [
      "a value with no date of its own",
      (s) => {
        row(s, 0).date = null;
      },
      `${AT}.feed.stories[0].market.rows[0].date: expected both a value and its date, or neither`,
    ],
    [
      "a date with no value",
      (s) => {
        row(s, 1).date = "24 Nov";
      },
      `${AT}.feed.stories[0].market.rows[1].value: expected both a value and its date, or neither`,
    ],
    [
      "a series with neither a value nor a note",
      (s) => {
        row(s, 1).note = null;
      },
      `${AT}.feed.stories[0].market.rows[1].note: expected the note saying why the series has no value`,
    ],
    [
      "a change with no date to be since",
      (s) => {
        const week = row(s, 0).changes[1];
        if (week !== undefined) week.since = null;
      },
      `${AT}.feed.stories[0].market.rows[0].changes[1].since: expected both a change and the date it is since, or neither`,
    ],
    [
      "a date with no change",
      (s) => {
        const month = row(s, 0).changes[2];
        if (month !== undefined) month.value = null;
      },
      `${AT}.feed.stories[0].market.rows[0].changes[2].value: expected both a change and the date it is since, or neither`,
    ],
    [
      "a series that names its changes another way",
      (s) => {
        const first = row(s, 3).changes[0];
        if (first !== undefined) first.label = "Day";
      },
      `${AT}.feed.stories[0].market.rows[3].changes: expected the labels the table's first series gives its changes`,
    ],
    [
      "a series listed twice",
      (s) => {
        row(s, 4).id = "DGS10";
      },
      `${AT}.feed.stories[0].market.rows[4].id: expected an id the table does not repeat`,
    ],
    [
      "a value that is a number",
      (s) => {
        Object.assign(row(s, 0), { value: 3.12 });
      },
      `${AT}.feed.stories[0].market.rows[0].value: expected a string or null`,
    ],
  ])("refuses %s", (_, edit, reason) => {
    expect(refusal(edit)).toBe(reason);
  });

  it("accepts a series whose note comes with its three changes, and a table of notes only", () => {
    const noted = read(
      format2With((s) => {
        row(s, 0).note = "Held over from the last reading";
      }),
    );
    expect(story(noted, "10").market?.rows[0]?.changes).toHaveLength(3);
    const none = read(
      format2With((s) => {
        const table = story(s, "10").market;
        if (table !== null) table.rows = [row(s, 1), row(s, 2)];
      }),
    );
    expect(story(none, "10").market?.rows.map((one) => one.short)).toEqual(["US BB", "UST 2y"]);
  });
});
