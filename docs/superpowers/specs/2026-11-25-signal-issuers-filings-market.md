# Signal: issuer watchlist, company filings and the daily market backdrop

Status: design for the owner's instruction of 2026-11-25 ("add all 3 to signal - adapt 3 as a
daily post. make sure posts have the correct tags and categories."). It extends
`2026-11-13-signal-design.md`; that spec's rules hold unless this one says otherwise. It lifts one
of that spec's non-goals ("Linking stories to library issuers") in the narrow form below: Signal
stores a library key as text for the page to link with and never reads the issuer library.

Lines marked **(call)** are the builder's choices, not owner decisions.

## 1. Goals, non-goals

Goals

- An issuer watchlist: writers keep issuers (name, aliases, SEC CIK, library key); every user
  follows the ones they want; stories are tied to issuers; each issuer has a feed view.
- Company filings as a source: an issuer's SEC filings, from the SEC's own per-company Atom feed,
  fetched only from a source the owner approved and only once the owner has set the contact
  string the SEC requires.
- A market backdrop: one deterministic post a day, written by code from FRED's public CSV, with
  exact decimals, missing never read as zero, each series' own date, changes in basis points.
- Categories and tags that follow one written rule for every kind (section 6).

Non-goals

- No AI anywhere in this work. The AI pass never labels, tags or re-kinds filing or market
  stories.
- No filing document is fetched: only the SEC's feed entry (form type, filing date, accession
  number, the feed's own summary), as for any feed.
- No browser control for the owner's powers (approving sources, the contact string, market
  series, the post hour): command line only, as spec 5.2 says.
- No change under `web/`: the React reader is not changed here; the new kinds and keys are
  delivered only when the page asks for them (section 7).
- No reading of the issuer library, no case timelines, no market data other than FRED's CSV.

## 2. Data (migration 7, new; migrations 1 to 6 unchanged)

- `issuers(id, name UNIQUE, aliases JSON, cik UNIQUE NULL, library_key NULL, source_id UNIQUE
  NULL -> sources, created_by, created_at)`; ids by `fresh_id`/`retire_id`, never reused.
- `issuer_stories(issuer_id -> issuers ON DELETE CASCADE, story_id -> stories, UNIQUE)`.
- `issuer_follows(user_name, issuer_id -> issuers ON DELETE CASCADE, UNIQUE)`.
- `digest_issuers(digest_id -> digests, issuer_id -> issuers ON DELETE CASCADE, UNIQUE)`.
- `service_settings(key IN ('filings_contact', 'market_hour'), value, set_at)`.
- `market_series(id PRIMARY KEY (the FRED id), title, short, unit, source, position, added_at)`.
- `market_posts(story_id PRIMARY KEY -> stories, as_of DATE, rows JSON)`: the table of each
  post, exact decimal text and ISO dates; the delivered words are made when the snapshot is read.
- `stories.category` (new column): an Atom entry's first category term as the feed gave it (a
  filing's form type, its first tag); NULL for every other story.
- Every foreign key's child column leads an index. `remove_source --with-stories` also deletes a
  story's issuer links and market table. A filing source an issuer still uses cannot be removed
  (Conflict: take the issuer's CIK off first).

Source kinds: the four feed kinds (`regulator`, `news`, `ratings`, `research`) that writers propose
and topics filter on, plus `filing` and `market`, which are never proposed by hand: a filing
source comes from an issuer's CIK, the market source from `signal market propose` **(call)**.

## 3. Issuer watchlist

- Name: 1 to 80 characters of plain text. Aliases: up to 8, each 1 to 60 characters of plain
  text. Library key: up to 120 characters of plain text, stored as given. CIK: exactly 10 ASCII
  digits, or none. At most 100 issuers **(call: 100 keeps the snapshot's issuer parts under about
  350 KB in the worst case)**.
- Matching rule. The name and every alias need at least 3 letters or digits (spaces and
  punctuation do not count; "GE" is refused, "TDG" and "AT&T" are accepted). A story belongs to an
  issuer when its title or stored summary holds the name or an alias as a phrase of whole tokens,
  through the same FTS5 index and phrase quoting as topics: the index's tokens are runs of letters
  and digits, matched without regard to case or accents. So "Next" does not match "Nextdoor" or
  "NextEra", but does match the word "next" in a sentence: a common word is a poor alias, and the
  writer is warned in this rule, not by the service. A name or alias that another issuer already
  has as its name or alias (compared case-folded) is refused (409) **(call: one phrase, one
  issuer)**.
- When. A new story is matched in the same write transaction as its topics (`topics.match_story`).
  Creating an issuer, or editing its name or aliases, re-matches every stored story in that
  write transaction: one index query per phrase, at most 9, whatever the store holds (the bound),
  as a topic edit does. Editing only the CIK or library key keeps the matches.
- Filing stories belong to their issuer through their source, not through text, and are not
  text-matched to any other issuer **(call: a filing title carries its own issuer's name, so text
  matching would only add parents and namesakes)**. Market posts belong to no issuer and no topic.
- Follow and unfollow: any named user, as with topics. Deleting an issuer removes its matches,
  follows and digest covers, and pauses its filing source.

## 4. Company filings

- Setting a CIK proposes one source: kind `filing`, state proposed, named "<issuer> filings
  (SEC)", address `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=<cik>&type=&dateb=&owner=include&count=40&output=atom`.
  The owner approves it with `signal sources approve <id>`. Removing the CIK, or the issuer,
  pauses the source and unlinks it; its stories stay (in Latest, with no issuer). Setting a CIK
  whose source already exists (paused, unlinked) links that source again and sets it to proposed
  **(call: it then waits for the owner, which is the truth)**. Changing the CIK pauses the old
  source and proposes the new one. Renaming the issuer renames its source; stored filing titles
  keep the name they were filed under **(call)**.
- Contact. The SEC refuses automated clients that do not say who is asking (a probe from this
  session with a generic client got HTTP 403, "Your Request Originates from an Undeclared
  Automated Tool"). Filing sources are fetched only once the owner has run `signal filings contact
  "<organisation> <email>"` (printable ASCII, at most 200 characters, holding an email address).
  It is stored in `service_settings` and sent as the User-Agent of requests to the host
  `www.sec.gov` made for a filing source, and to no other host: a redirect off `www.sec.gov` gets
  Signal's ordinary User-Agent. It is never delivered in a snapshot or a route reply; `signal
  filings status` shows it. With no contact, filing sources are skipped by the ingest pass (no
  check is recorded) and Settings says why in one sentence.
- Rate. At most one filing fetch a second across every process on the store (each fetch claims
  a slot one second after the last claimed one, in a write transaction, then waits for it), and
  each filing source at most every 10 minutes like any source. At most 30 filing fetches a pass
  **(call)**; the rest are due at the next pass. The SEC publishes 10 requests a second as its
  ceiling; Signal stays far under it.
- Fetching goes through `fetch.fetch` with every rule unchanged (https, plain public host, default
  port, pinned address, 10 s, 2 MB, no proxy, at most 3 redirects); the one addition is the
  per-request User-Agent above.
- Parsing. `feeds.parse_feed` reads EDGAR's Atom as any Atom feed; the one extension is narrow:
  an Atom entry's first `<category term>` is kept (`Entry.category`). A filing story's title is
  "<Issuer>: <form>, <form name>", the form name's first letter lowered when its first word is an
  ordinary capitalised word ("Altice USA: 8-K, current report"; "Altice USA: 10-Q, quarterly
  report [Sections 13 or 15(d)]"; "Altice USA: SC 13G/A, [Amend] Statement of acquisition of
  beneficial ownership by individuals"). The form is the category term, else the entry title's
  part before " - ". The stored summary starts "Form 8-K, filed 2026-11-24, accession number
  0001193125-26-123456." (the filing date and accession number read from the feed's summary;
  the filing date from the entry's own time when the summary has none) followed by the rest of
  the feed's summary, 300 characters at most as for any story.

## 5. Market backdrop

- Source: kind `market`, proposed by `signal market propose` (named "Market backdrop (FRED)",
  address `https://fred.stlouisfed.org/graph/fredgraph.csv`), approved by the owner like any
  source. Each series is fetched from `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>`
  through `fetch.fetch`, one request per series, no key.
- Default series **(call)**, each stored with its exact FRED id, title, unit and source:

  | FRED id | Short | Title | Unit | Source |
  |---|---|---|---|---|
  | BAMLH0A0HYM2 | US HY | ICE BofA US High Yield Index Option-Adjusted Spread | Percent | ICE Data Indices, LLC, via FRED |
  | BAMLH0A1HYBB | US BB | ICE BofA BB US High Yield Index Option-Adjusted Spread | Percent | ICE Data Indices, LLC, via FRED |
  | BAMLH0A2HYB | US B | ICE BofA Single-B US High Yield Index Option-Adjusted Spread | Percent | ICE Data Indices, LLC, via FRED |
  | BAMLH0A3HYC | US CCC | ICE BofA CCC & Lower US High Yield Index Option-Adjusted Spread | Percent | ICE Data Indices, LLC, via FRED |
  | BAMLHE00EHYIOAS | Euro HY | ICE BofA Euro High Yield Index Option-Adjusted Spread | Percent | ICE Data Indices, LLC, via FRED |
  | DGS2 | UST 2y | Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity, Quoted on an Investment Basis | Percent | Board of Governors of the Federal Reserve System (US), via FRED |
  | DGS10 | UST 10y | Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis | Percent | Board of Governors of the Federal Reserve System (US), via FRED |
  | SOFR | SOFR | Secured Overnight Financing Rate | Percent | Federal Reserve Bank of New York, via FRED |

  The owner adds (`signal market series add <ID> --title ... --unit ... [--short ...] [--source
  ...]`) or removes (`... series remove <ID>`) series; at most 20 **(call)**.
- When. Once a UTC day, at or after the stored hour (`signal market hour <0-23>`, default 7,
  meaning 07:00 UTC), the background loop's market job fetches every series. One attempt a day;
  an attempt in which no series could be read is tried again an hour later the same UTC day
  **(call)**. `signal market post` runs today's attempt now. At most one post per UTC day.
- Arithmetic (all `Decimal` from the CSV text, never float). FRED's CSV has a header line (date
  column `observation_date` or `DATE`, then the series id) and one row a day; a cell that is "."
  or empty is a missing observation, never zero, and is skipped. For each series: the latest
  observation and its own date; the previous observation (the latest one before it); the
  observation about a week earlier (the latest on or before the latest date less 7 days); about a
  month earlier (the latest on or before the same day of the previous month, clamped to that
  month's last day). A change is latest minus earlier; for a series in Percent it is shown in
  basis points (times 100, exact, "+4 bp", "-12.5 bp", "0 bp"); for any other unit as the plain
  difference with the unit. No word judges a move: numbers and signs only.
- A series that cannot be fetched or read is said so in its row ("Could not be read: <reason>")
  and the post goes out with the others. A post is written only when at least one series has an
  observation newer than in the last post; otherwise nothing is written ("no new observation").
- The story: kind `market`, title "Market backdrop: 24 November 2026" (the newest observation
  date among the rows), stored summary one compact line ("US HY 3.12% (+4 bp); US BB 2.01% (+3
  bp); ... SOFR 4.57% (0 bp)", the change from the previous observation, at most 300 characters),
  link `https://fred.stlouisfed.org/`, published at the time it is written. It is not folded,
  not matched to topics or issuers, and never given to the AI pass; digests may include it as an
  ordinary story. It appears in Latest and in For you for every named viewer **(call: the
  backdrop is everyone's context)**.
- Licensing (open point for the owner): the ICE BofA series are published on FRED under ICE's
  terms; the owner should confirm that internal display is within them. The Treasury and SOFR
  series are public.

## 6. Categories and tags: the rule

"Category" is a story's kind (`kind`, `kindLabel`); "tags" are the labels on its card.

| Source kind | Story kind | `kindLabel` | React tab today | Tags, in order (6 at most) | Who may change the kind |
|---|---|---|---|---|---|
| regulator | regulator | Regulatory case | Regulators | AI tags (pass on, up to 3), then topic names | AI pass: to news or ratings ("other" keeps it) |
| news | news | News | News | as above | AI pass: to regulator or ratings |
| ratings | ratings | Rating action | Ratings | as above | AI pass: to news or regulator |
| research | research | Research | Research | as above | AI pass: to news, regulator or ratings |
| filing | filing (format 2) | Filing | All only, until the page adds a tab | the form type ("8-K"), then topic names | nobody |
| market | market (format 2) | Market | All only, until the page adds a tab | "Market" only | nobody |

- Topic names: the topics the viewer follows first, then the others, each by topic id; a tag
  that repeats an earlier one case-folded ("Telecoms" from the AI and a topic "telecoms") is
  dropped, the earlier kept. Issuer names are not tags: they are delivered in the story's own
  `issuers` key **(call)**. Tags are read from the current topics on every snapshot, so a
  renamed topic's new name and a deleted topic's absence show at once.
- Topic kind filters read the source's kind, the fixed fact the owner approved, never the AI
  pass's kind **(call)**: a news story the pass re-kinds as a rating action stays in a topic of
  kind news, and its card shows "Rating action" under the Ratings tab. Topic membership is
  decided once, as the story arrives, and does not move when the pass is switched on or off. A
  topic of no kinds takes every feed kind and filings (format 2 lists "Filings" among its kinds),
  never market posts.
- A folded story keeps the kind of the source that stored it first; a later copy from a source of
  another kind never re-kinds it (stable: a card never changes tab under a reader). A source's
  kind is fixed when it is proposed: no command changes it.
- Source and topic kind labels (Settings): News, Regulatory cases, Rating actions, Research,
  Filings, Market data.

## 7. Delivered formats and keys

`GET /api/snapshot` (no `format`, or `format=1`) is exactly what the current React reader accepts:
no filing or market story, no thread naming one, no issuer data, no filing or market source in
Settings or the freshness line, and every count (topic counts, the Saved count, "N stories this
week") counted over the delivered kinds only. A digest's own saved covers keep an issuer cover in
both formats, so an edit posted back from the current page never drops it. `format=2` adds:

- kinds `filing` ("Filing") and `market` ("Market");
- story `issuers: [{id, name}]` (every story; empty when none; at most 6, by name **(call)**) and
  `market: {asOf, rows: [{id, name, short, unit, value, date, changes: [{label, since, value}],
  source, note}]} | null` (null on every story but a market post; `changes` holds "Previous",
  "Week" and "Month" in that order, each with its comparison date, or is empty for a series that
  could not be read);
- `channels.issuers: [{id, name, count, followed}]`, `feed.issuers: {<id>: view}`;
- `settings.issuers: [{id, name, aliases, cik, libraryKey, source: {id, state, note} | null}]`,
  `settings.filings: {contactSet, note}`;
- "Issuer: <name>" among `settings.digestForm.coversOptions`;
- `?issuer=<id>` focus (an issuer's older stories), as `?topic=<id>`.

Any other `format` is 400. The snapshot stays one read transaction and within its byte budget;
the issuer parts are counted with the rest of Settings before the stories are paid.

## 8. Routes (forwarder-safe; GET, POST, DELETE only)

- `POST /api/issuers`, `POST /api/issuers/<id>/edit`, `DELETE /api/issuers/<id>`: writers and the
  owner. The role is checked first (403), then the id (404), as the topic routes do.
- `POST /api/issuers/<id>/follow`, `DELETE /api/issuers/<id>/follow`: any named user.

## 9. Command line

`signal issuers list|add|edit|remove`, `signal filings contact|status`, `signal market
propose|hour|post|series add|series remove|series list`. Plain output; exit 2 with one sentence on
an error.

## 10. Decisions added while building

- A filing story folds with another story by its link only, never by its title (two filing
  sources of one issuer, after a CIK is corrected, share generic titles) **(call)**.
- A story carries at most 6 issuers (by name) so a card's size stays bounded **(call)**.
- The issuer views' id lists are reserved out of the snapshot's byte budget before the stories
  are paid (`snapshot.view_reserve`).
- The one-second filing slot is wall time shared through the store; a stored slot more than five
  minutes ahead (a clock set back) is passed over, so no fetch waits past its spacing.
- An attempt with no series configured says so ("the market post reads no series; ...") and
  counts as a failed check.
- `signal market hour <0-23>` sets the post's UTC hour (the spec's stored hour needed a command).
- A market post appears in For you for every named viewer in format 2 (section 5).
- `GET /api/feed` (the JSON page route, not read by the React page) delivers every kind, takes
  `kind=filing|market` and `view=issuer:<id>`, and each card gains `category` (the feed's own
  category term: a filing's form type, else null).
- Format 1's group pages leave out a thread whose story is a filing or a market post, with its
  counts ("Showing the latest N of M threads" counts the delivered threads only).
