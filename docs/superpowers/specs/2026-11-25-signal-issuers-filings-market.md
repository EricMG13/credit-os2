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
- `service_settings(key IN ('filings_contact', 'market_hour', 'logos'), value, set_at)`.
- `market_series(id PRIMARY KEY (the FRED id), title, short, unit, source, position, added_at,
  posted, problem, failing_since)`: `posted` the newest observation date a post carried for the
  series; `problem` why the last attempt could not read it (NULL when it could) and
  `failing_since` when that run of failures began.
- `source_logos(source_id PRIMARY KEY -> sources, data, media_type, url, fetched_at, note,
  declared, cleared)`: at most one icon per source (section 11).
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
- Matching rule. The name and every alias need a word of at least 3 letters or digits, the words
  being the index's (runs of letters and digits). "GE", "3M", "S & P" and "AT&T" (the words "at"
  and "t", which "at T-Mobile" holds) are refused with a sentence saying so: such an issuer cannot
  be matched by that spelling and needs a longer alias ("AT&T Inc", "3M Company"). "TDG" and
  "S&P 500" are accepted (review 5, finding 4). A story belongs to an
  issuer when its title or stored summary holds the name or an alias as a phrase of whole tokens,
  through the same FTS5 index and phrase quoting as topics: the index's tokens are runs of letters
  and digits, matched without regard to case or accents. So "Next" does not match "Nextdoor" or
  "NextEra", but does match the word "next" in a sentence: a common word is a poor alias, and the
  writer is warned in this rule, not by the service. A name or alias that another issuer already
  has as its name or alias is refused (409), compared as the sequence of words the index makes of
  it (case, accents, punctuation and spacing folded: "Altice-USA", "Altice  USA" and "Álticé USA"
  are "Altice USA") **(call: one phrase, one issuer)**. The words are modelled in code
  (`issuers.tokens`), checked against FTS5 itself by a property test.
- When. A new story is matched in the same write transaction as its topics (`topics.match_story`),
  against a one-story copy of the index (`temp.issuer_match`, the same columns and tokenizer as
  `stories_fts`): one query over every issuer's phrases, then one per issuer only when it matches,
  so the cost does not grow with the store (review 5, finding 9: about 6 to 12 ms a story with 100
  issuers of 9 phrases, where querying the store's index per issuer took 11 to 117 ms).
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
  unlinks the source: one still proposed that was never fetched and holds no story is deleted,
  any other (approved, paused, or once fetched) is paused, and its stories stay (in Latest, with
  no issuer). Setting a CIK whose source already exists links that same row again, and every link
  sets it to proposed, whatever its state, so a re-link always waits for the owner (review 5,
  findings 5 and 6). Changing the CIK unlinks the old source by the same rule and proposes the
  new one. At most 100 filing sources wait for the owner at once, service-wide; they are not
  counted in a writer's cap of 5 hand proposals. The source's name is cut (with an ellipsis) to the
  source-name limit of 80 characters. Renaming the issuer renames its source; stored filing titles
  keep the name they were filed under **(call)**.
- Contact. The SEC refuses automated clients that do not say who is asking (a probe from this
  session with a generic client got HTTP 403, "Your Request Originates from an Undeclared
  Automated Tool"; the lead made that one probe, with no contact details, before the build; the
  build and its tests made no SEC or FRED request). Filing sources are fetched only once the owner has run `signal filings contact
  "<organisation> <email>"` (printable ASCII, at most 200 characters, holding an email address).
  It is stored in `service_settings` and sent as the User-Agent of requests to the host
  `www.sec.gov` on the default port made for a filing source, and to no other host or port: a
  redirect off `www.sec.gov` gets Signal's ordinary User-Agent, and a filing source row at another
  port (a hand edit) is refused before any request. It is never delivered in a snapshot or a route reply; `signal
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
  part before " - ", each only when usable: at most 20 characters of plain text (no control or
  format character). An entry with no usable form has none: its title is "<Issuer>: <entry
  title>", its summary starts "Filed <date>", and it has no form tag. An Atom category term with a
  control or format character is not kept for any feed. The stored summary starts "Form 8-K, filed 2026-11-24, accession number
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
  meaning 07:00 UTC; a stored value outside 0 to 23 is taken as 7, with a logged warning), the
  background loop's market job fetches every series. One attempt a day; an attempt in which no
  series could be read, or that raised (logged; the check names the error's type only), records a
  failed check and is tried again an hour later the same UTC day **(call)**, never every tick.
  `signal market post` runs today's attempt now, prints one sentence and exits 2 when no series
  could be read. At most one post per UTC day: two processes writing it at once find each
  other's in the write transaction, and the later one writes nothing and says so.
- Arithmetic (all `Decimal` from the CSV text, never float). FRED's CSV has a header line (date
  column `observation_date` or `DATE`, then the series id) and one row a day; a cell that is "."
  or empty is a missing observation, never zero, and is skipped. For each series: the latest
  observation and its own date; the previous observation (the latest one before it); the
  observation about a week earlier (the latest on or before the latest date less 7 days); about a
  month earlier (the latest on or before the same day of the previous month, clamped to that
  month's last day). A change is latest minus earlier; for a series in Percent it is shown in
  basis points (times 100, exact, "+4 bp", "-12.5 bp", "0 bp"); for any other unit as the plain
  difference with the unit. No word judges a move: numbers and signs only.
- A series that cannot be fetched or read, whatever its fetch or its CSV raises (a CSV the csv
  module refuses included), is said so in its row ("Could not be read: <reason>") and the post
  goes out with the others. An observation dated after today (UTC) is left out, with a note in its
  row (the delivered `note`). Each series' last outcome is kept: while some series could not be
  read, Settings shows the market source failing, its reason naming them ("2 of 8 series could
  not be read: US BB (since 23 Nov), ..."). A post is written only when at least one series has an
  observation newer than the newest one posted for that series (kept per series, so a series
  that failed and comes back unchanged writes nothing); otherwise nothing is written ("no new
  observation").
- The story: kind `market`, title "Market backdrop: 25 November 2026" (the UTC day it is
  written; one post a day; review 5, finding 3), stored summary one compact line ("As of 24 Nov,
  change from the previous observation: US HY 3.12% (+4 bp); Euro HY 3.05% (21 Nov, -2 bp); ...
  SOFR 4.57% (0 bp)": an entry carries its own observation date when it differs from the newest
  one, with its year when that differs too; at most 300 characters), link
  `https://fred.stlouisfed.org/`, published at the time it is written. Format 2's `market.asOf`
  stays the newest observation date. It is not folded, not matched to topics or issuers, never
  given to the AI pass, and no digest takes it (section 10). It appears in Latest and in For you
  for every named viewer **(call: the backdrop is everyone's context)**.
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

- Topic names: one per spelling case-folded, the lowest topic id's spelling for every viewer
  (topics "telecoms" and "TELECOMS" show "telecoms" to all); those the viewer follows (a topic of
  either spelling) first, then the others, each by topic id; a tag that repeats an earlier one
  case-folded ("Telecoms" from the AI and a topic "telecoms") is dropped, the earlier kept. Issuer names are not tags: they are delivered in the story's own
  `issuers` key **(call)**. Tags are read from the current topics on every snapshot, so a
  renamed topic's new name and a deleted topic's absence show at once.
- Topic kind filters read the source's kind, the fixed fact the owner approved, never the AI
  pass's kind **(call)**: a news story the pass re-kinds as a rating action stays in a topic of
  kind news, and its card shows "Rating action" under the Ratings tab. Topic membership is
  decided once, as the story arrives, and does not move when the pass is switched on or off. A
  topic of no kinds takes every feed kind and filings (format 2 lists "Filings" among its kinds),
  never market posts. A group following such a topic is never posted a filing or a market post:
  one reaches a group only when a person shares it.
- A folded story keeps the kind of the source that stored it first; a later copy from a source of
  another kind never re-kinds it (stable: a card never changes tab under a reader). A source's
  kind is fixed when it is proposed: no command changes it.
- Source and topic kind labels (Settings): News, Regulatory cases, Rating actions, Research,
  Filings, Market data.

## 7. Delivered formats and keys

`GET /api/snapshot` (no `format`, or `format=1`) is exactly what the current React reader accepts:
no filing or market story, no thread naming one, no issuer data, no filing or market source in
Settings, the freshness line or a story's "Also in" line, and every count (topic counts, the Saved count, "N stories this
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
- `?issuer=<id>` focus (an issuer's older stories), as `?topic=<id>`;
- source logos (section 11; optional keys, added after the React wiring began): a story's
  `source` gains `id` (the source id as text) and `logo` (true when one is stored); `alsoIn`
  gains `sources: [{id, name, logo}]`, the same (at most three) sources as its monograms;
  `settings.sources[]` gains `logo`.

Any other `format` is 400. The snapshot stays one read transaction and within its byte budget;
the issuer parts are counted with the rest of Settings before the stories are paid.

## 8. Routes (forwarder-safe; GET, POST, DELETE only)

- `POST /api/issuers`, `POST /api/issuers/<id>/edit`, `DELETE /api/issuers/<id>`: writers and the
  owner. The role is checked first (403), then the body (400), then the id (404), as the topic
  routes do. Body `{name, aliases?, cik?, libraryKey?}`. On create an absent key, null or "" is
  none. On edit `name` is required; an absent `aliases`, `cik` or `libraryKey` keeps the stored
  value, and an explicit null (or "", or `[]` for aliases) takes it off (review 5, finding 7: a
  page that never sends `cik` can no longer pause an approved filing source by accident).
- `POST /api/issuers/<id>/follow`, `DELETE /api/issuers/<id>/follow`: any named user.
- `GET /api/logos/<source id>`: any named user (401 otherwise); section 11.

## 9. Command line

`signal issuers list|add|edit|remove`, `signal filings contact|status`, `signal market
propose|hour|post|series add|series remove|series list`, `signal logos
status|refresh|clear|off|on`. Plain output; exit 2 with one sentence on an error (`filings contact
"<text>" --clear` and `issuers add --by ""` are errors). `issuers edit` changes only the fields
whose option is given ("" takes one off).

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
- Digests take the four feed kinds only, for every cover ("All stories", topic, group, issuer): no
  filing and no market post is in a digest's scope, its count ("N stories in scope"), its model
  call or an issue's cited stories (review 5, finding 1; this withdraws section 5's earlier "digests
  may include it as an ordinary story"). Whether filings should reach digests is a later decision
  for the owner.
- One fetch stores at most 500 entries (new or folded), the newest first; the rest wait for the
  later passes (the fetch keeps no validators meanwhile, so the next one reads the whole feed), so
  one large feed never holds the loop for minutes (review 5, finding 9: a first 2 MB feed with 100
  issuers took 108 to 680 s in one pass; now one pass takes 5 to 11 s).

## 11. Source logos

Owner's instruction of 2026-11-25 ("add the site logos"): each post shows its source site's logo
instead of the two-letter tile. The page may load images only from its own origin or `data:`
addresses, it reaches the service only through a forwarder that passes JSON, and loading icons
from publishers would tell each publisher who opened Signal; so the service fetches each source's
icon and hands it to the page as JSON.

- Stored in `source_logos`, at most one per source: the bytes as fetched, their media type, the
  address, the last attempt's time and failure note, the image the feed declared, and whether the
  owner cleared it. Removing a source removes its icon.
- When: approved sources only (never a proposed or paused one, never on a page view), in the
  background loop after the ingest job; at most 5 icon fetches a pass; each icon refreshed at most
  every 30 days and retried no sooner than a day after a failure (a failed refresh keeps the icon
  it had).
- Where from: the image the stored feed declared (RSS `<channel><image><url>`, else Atom `<logo>`,
  else `<icon>`, as the last ingest pass read it, resolved against the feed's address; any https
  host under the fetch rules), otherwise `https://<feed host>/favicon.ico`. Filing sources get the
  SEC's host icon and the market source FRED's, by the same rule. No HTML page is fetched or read.
- How: only through `fetch.fetch` and every rule of it (https, plain public host, default port,
  checked redirects, 10 s, no proxy), with a 32 KiB cap (a larger file is refused, never cut), the
  ordinary client (the SEC contact is never sent for an icon), no cookies.
- Accepted: PNG, JPEG, GIF, WebP and ICO only, decided by the file's leading bytes, never by the
  server's content type or the address; SVG and anything else refused (an SVG can carry script);
  a file whose header is cut short, or whose declared size (PNG IHDR, GIF screen, JPEG SOF, every
  ICO directory entry, WebP VP8/VP8L/VP8X) is over 512 by 512, is refused. Standard library only
  (no image library is pinned); the bytes are stored as fetched, never decoded or re-encoded.
- Delivery: `GET /api/logos/<source id>` (any named user) answers `{"type": "image/png", "data":
  "<base64>"}` (at most about 44 KiB); an unknown, unapproved or logo-less source, and any source
  while logos are off, is 404 `{"error": "no logo for this source"}`, the same body each time. The
  snapshot carries no icon bytes; format 2 says which sources have one (section 7); format 1 is
  unchanged.
- Owner, on the command line: `signal logos status`, `signal logos refresh <source id>` (fetch it
  now; also undoes a clear), `signal logos clear <source id>` (removes it; none is fetched for that
  source until refreshed), `signal logos off|on` (service-wide, default on; off fetches none and
  delivers none).
- For the owner: a publisher's icon is its trademark; showing a site's own small icon beside a
  link to its story is common practice, and `signal logos off` removes them all.

## 12. Open points and known limits

- Migration 7 was amended in place on this branch (review 5: the market series' per-series
  columns, the logo table, the `logos` setting). A store opened by an earlier commit of this branch
  is refused by the schema guard ("made by another build ... delete the development store");
  deleting a development store also erases its AI spend record.
- Filings in digests: a later decision for the owner (section 10).
- Not checked offline, until a first live fetch: whether the SEC's general RSS feeds refuse the
  generic client; FRED's live behaviour (content encoding, redirects, the header's spelling and
  missing-cell form, how much history the ICE series serve); whether publishers' icon addresses
  answer the ordinary client.
- A clock stepped backwards can delay one filing fetch once (by up to the five-minute rewind
  bound).
- A market value with more than 28 significant digits is subtracted at `Decimal`'s default
  precision (inexact past that); FRED's magnitudes never reach it.
- The one-phrase-one-issuer rule compares words as `issuers.tokens` models the index; a script
  the model folds differently from SQLite's unicode61 tokenizer could let two spellings through
  (the property test found none over the characters it draws).
