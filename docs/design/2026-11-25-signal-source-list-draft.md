# Signal first source list: draft for the owner

Written 2026-11-25. This is a draft for the owner to read and decide on. Nothing in it has
been approved or proposed in a real store. Sections after the bottom line were written before
the feeds could be fetched; where they say a feed was not verified, the table below is newer.

## Bottom line

Fifteen sources are recommended and each was fetched and accepted by the project's own feed
parser on 2026-11-25: 10 regulator, 1 news, 0 ratings, 4 research. Four addresses from the first
draft failed the check and are dropped from the recommended list. Nothing has been approved or
proposed in a real store.

How they were checked. The owner allowed the 12 feed hosts in this session's network settings.
Each address was fetched with `curl` through the session's proxy (at most three redirects), and
the bytes were given to `deploy_workflow.signal.feeds.parse_feed`, the parser the service uses.
Signal's own fetcher was not used: it refuses to go through a proxy, and this session has no
other route out. So its address check at fetch time (public address, pinned connection) is not
exercised here; `check_form` passed for all 19.

| # | Source | Result | Items | Newest item (UTC) |
|---|---|---|---|---|
| 1 | SEC press releases | Accepted | 25 | 2026-11-20 |
| 2 | SEC litigation releases | **Dropped**: HTTP 403, an HTML page | - | - |
| 3 | Federal Reserve, banking and consumer regulatory policy | Accepted | 15 | 2026-11-13 |
| 4 | Federal Reserve, other announcements | Accepted | 15 | 2026-11-20 |
| 5 | FTC press releases | **Dropped**: HTTP 404 at this address | - | - |
| 6 | Bank of England news | Accepted | 50 | 2026-11-25 |
| 7 | Bank of England publications (includes PRA) | Accepted | 50 | 2026-11-20 |
| 8 | UK CMA on GOV.UK (Atom) | Accepted | 20 | 2026-11-25 |
| 9 | FCA news | Accepted; its items carry no date the parser reads | 20 | not dated |
| 10 | ECB press releases, speeches, interviews | Accepted | 15 | 2026-11-25 |
| 11 | EBA news and press | Accepted | 10 | 2026-11-20 |
| 12 | AMF communiques (France, in French) | Accepted; served as `text/html`, 250 kB | 200 | 2026-11-24 |
| 13 | CNBC finance | **Dropped**: HTTP 403 "Access Denied" to this client | - | - |
| 14 | ICMA news in brief | Accepted; 704 kB of Signal's 2 MB limit | 224 | 2026-11-25 |
| 15 | Federal Reserve FEDS Notes | Accepted | 15 | 2026-11-24 |
| 16 | Bank of England Bank Overground | Accepted, but quiet: nothing since October 2025 | 50 | 2025-10-24 |
| 17 | BIS working papers | **Dropped**: an RSS 1.0 (RDF) document, which the parser refuses | - | - |
| 18 | ECB publications and working papers | Accepted | 15 | 2026-11-24 |
| 19 | ECB blog | Accepted | 15 | 2026-11-24 |

What the owner should weigh before approving:

- **SEC litigation releases and CNBC** refused this session's client. They may answer a
  different client or network; rerun the check in Section 3 from the machine that will run
  Signal before deciding. Until then they are not recommended.
- **BIS** publishes RSS 1.0, which Signal's parser does not read. Adding it means a change to
  the parser, not to the list.
- **FTC**: the address is dead. The FTC's own feed page should be read for the current one.
- **FCA**: stories will arrive without their publication dates; check how they sort in the feed
  after the first fetch.
- **AMF** is in French and large; **ICMA** is large. Both are within the limits today.
- **Bank Overground** has been silent for a year and will show as "quiet" in Settings.
- With CNBC dropped, the list has **one news source and no rating agency**. The candidates that
  could not be reached from here (BBC, Guardian, FT, the rating agencies, ESMA, FSB, OCC, FDIC,
  DOJ, the European Commission) are in Section 2; this session's network list is full at 20
  hosts, so they were not tested.

Findings that change the plan:

- **No rating agency publishes a usable public rating-action feed.** S&P Global Ratings has
  only podcast feeds on its ratings site. Moody's has an investor-relations press-release feed
  about its own corporation, not rating actions. KBRA sells a paid ratings feed. DBRS Morningstar
  and Scope showed no feed. Fitch could not be searched from this session. The `ratings` kind
  therefore has no source in this list.
- **Reuters has no official feed**, and no AP, Bloomberg, FT or BBC address could be taken from
  the publisher's own page, so only one general business outlet (CNBC) is recommended.
- **Twelve authorities (or sets of feeds) are said by their own pages to publish feeds, but the
  exact address was not obtained** (Section 2). They are the best next step once the owner's
  sectors are named.

## 1. Recommended first list

Legend for the verification column:

- **Form pass**: `check_form` accepted the address.
- **Indexed**: the exact address came back as a result on the publisher's own host, with a copy of
  the feed's contents described. Not fetched by this session. Status, content type, DOCTYPE
  presence and item count are **not verified**.
- Volumes are not measured. "Expected" is a judgement from what the feed carries.

### Regulator

| Name | Feed URL | Carries | Expected volume | Verification | Notes |
|---|---|---|---|---|---|
| SEC press releases | `https://www.sec.gov/news/pressreleases.rss` | SEC press releases | Low (a few a day) | Form pass; indexed. The search copy listed items out of date order, with a 22 September item first. | Signal stores each item's own time, so order does not matter. Terms not checked. |
| SEC litigation releases | `https://www.sec.gov/enforcement-litigation/litigation-releases/rss` | One release per federal court enforcement action (LR numbers) | High | Form pass; indexed. | Mostly individual fraud cases, rarely a leveraged issuer. Approve only if the desk wants enforcement news; otherwise skip. Use the topic in Section 4 to narrow it. |
| Federal Reserve Board: banking and consumer regulatory policy | `https://www.federalreserve.gov/feeds/press_bcreg.xml` | Supervision and regulation press releases | Low | Form pass; indexed. | Chosen because the "All Press Releases" feed on the Board's feeds page could not be matched to a file name here. |
| Federal Reserve Board: other announcements | `https://www.federalreserve.gov/feeds/press_other.xml` | Press releases outside monetary policy, enforcement and banking applications | Low (newest item in the search copy: 1 July 2026) | Form pass; indexed. | Low value on its own; check item dates in the Section 3 command before approving. |
| FTC press releases | `https://www.ftc.gov/feeds/press-release.xml` | All FTC press releases, competition and consumer protection | Medium | Form pass; indexed. The search copy ran only to early September 2026. | The FTC also serves `https://www.ftc.gov/news-events/news/press-releases/rss`. Approve one of the two, not both. Check which is current. |
| Bank of England: news | `https://www.bankofengland.co.uk/rss/news` | Bank and PRA news and notices | Medium | Form pass; indexed. | Overlaps the publications feed. Folding joins items with the same link. |
| Bank of England: publications | `https://www.bankofengland.co.uk/rss/publications` | Publications, including PRA documents and the weekly balance-sheet report | Medium | Form pass; indexed. | The weekly balance-sheet report is noise for a credit desk. |
| UK CMA activity | `https://www.gov.uk/government/organisations/competition-and-markets-authority.atom` | Atom feed of everything the CMA publishes on GOV.UK: press releases, merger case pages, market studies | Medium | Form pass; indexed (titled "Activity on GOV.UK"). | The right place to catch UK telecom and other merger reviews. The case finder itself has no feed address that could be confirmed. |
| FCA news | `https://www.fca.org.uk/news/rss.xml` | FCA press releases, statements and warnings | Medium | Form pass. Indexed only with a cache-busting suffix (`?_fcb=...`); the plain address is the one the FCA's "What we publish" page is reported to give. | Confirm the plain address returns XML. |
| ECB: press releases, speeches, interviews | `https://www.ecb.europa.eu/rss/press.xml` | ECB press releases, speeches, interviews and press-conference items | Medium | Form pass; indexed. | The publisher's index of all its feeds is `https://www.ecb.europa.eu/home/html/rss.en.html`. |
| EBA news and press | `https://www.eba.europa.eu/rss.xml` | EBA news and press releases | Low (newest item in the search copy: 5 November 2026) | Form pass; indexed. The EBA home page links it as "News & press RSS feed". | |
| AMF (France): press releases and sanctions | `https://www.amf-france.org/fr/flux-rss/display/23` | AMF press releases and Sanctions Committee decisions | Low to medium | Form pass. Indexed under the French label "Communiqués de presse (AMF, sanctions)"; **whether it serves XML rather than an HTML page was not seen**. | French language. Useful for French issuers. The broader `.../display/21` ("all news and publications") is higher volume and was not recommended. |

### News

| Name | Feed URL | Carries | Expected volume | Verification | Notes |
|---|---|---|---|---|---|
| CNBC finance | `https://www.cnbc.com/id/10000664/device/rss/rss.html` | CNBC's finance section headlines | High, mostly not credit | Form pass; indexed (search copy items dated October 2026). | Headlines only are stored. Reuse terms for feeds were not found; CNBC's site now belongs to Versant, so the terms may have changed. The index of CNBC feeds is `https://www.cnbc.com/rss-feeds/`. |
| ICMA news in brief | `https://www.icmagroup.org/News/news-in-brief/rss` | International Capital Market Association news (bond-market standards, sustainable finance) | Very low (newest item in the search copy: June 2026) | Form pass; indexed. | A trade body, so it fits `news` better than `research`. It may be too quiet to be worth a slot. |

### Ratings

No source is recommended. See Section 2.

### Research

| Name | Feed URL | Carries | Expected volume | Verification | Notes |
|---|---|---|---|---|---|
| Federal Reserve Board: FEDS Notes | `https://www.federalreserve.gov/feeds/feds_notes.xml` | Short staff research notes | Low (newest item in the search copy: March 2026) | Form pass; indexed. | The search copy looks old; check it is still updated. |
| Bank of England: Bank Overground | `https://www.bankofengland.co.uk/rss/bank-overground` | Short staff analysis of financial and economic developments | Low | Form pass; indexed. | This is Bank Overground, not the Bank Underground blog (see Section 2). |
| BIS working papers | `https://www.bis.org/doclist/wppubls.rss` | BIS working papers, in English | Low | Form pass; indexed (titled "BIS working papers - english"). | The publisher's index of all its feeds is `https://www.bis.org/rss/index.htm`. |
| ECB: publications and working papers | `https://www.ecb.europa.eu/rss/pub.html` | ECB publications; items link to PDFs of the Working Paper Series | Medium | Form pass; indexed. | The `.html` ending is the ECB's own; check the content type is XML. |
| ECB blog | `https://www.ecb.europa.eu/rss/blog.html` | ECB blog posts | Low | Form pass; indexed. | |

### Duplicates, language, links

- **Overlap**: Bank of England news and publications; the ECB press and publications feeds
  differ by content. Signal folds a story whose link matches an existing one, so overlap costs
  clutter, not wrong counts.
- **Language**: only AMF is not in English.
- **Paywalls**: none of the 19 is a paywalled outlet. Every link goes to the publisher's own
  free page, except CNBC, which is free to read for most items.

## 2. Considered and not recommended

### Ratings (none recommended)

| Agency | What was found | Why not |
|---|---|---|
| S&P Global Ratings | `https://www.spglobal.com/ratings/en/feeds/infoble` and `https://www.spglobal.com/ratings/feeds/itunes` are podcast feeds. The S&P Global investor-relations feeds (`https://investor.spglobal.com/contact-investor-relations/rss-feeds/`) are about the company. | No research or rating-action feed was found. Ratings research pages are not syndicated by feed in the search results. |
| Moody's | An investor-relations press-release feed at `https://ir.moodys.com/rss/pressrelease.aspx` was reported only by a third-party directory, not seen on Moody's own page. | It would carry Moody's Corporation's own corporate news, not rating actions. Under one release a week. |
| Fitch Ratings | Not checked: the search tool is refused access to `fitchratings.com`. A third-party result pointed to `https://www.fitch.group/media-relations`. | No evidence either way. Worth a manual check by the owner. |
| DBRS Morningstar | No feed found; releases are web pages at `dbrs.morningstar.com`. | No feed. |
| KBRA | A paid "Ratings Feed" delivered by email, FTP or SFTP (`https://www.kbra.com/analytics/products/feeds`). Press releases are web pages. | Subscription product; no public feed. |
| Scope Ratings | A media centre and a rating-announcements listing; no feed found. | No feed. |

If the desk wants rating actions in Signal, the practical route is the news kind: the topic
"Rating actions" in Section 4 matches downgrade and upgrade headlines from the news feeds.

### Regulators and authorities: a feed exists, address not obtained

For each, the publisher's page says a feed exists, but the search tool did not return the feed
address, so it cannot be listed. The owner or a writer with ordinary internet access can read it
off the publisher's page.

| Publisher | Where to read the feed address | Notes |
|---|---|---|
| OCC | `https://www.occ.gov/rss/index-rss.html` | Separate feeds for news releases, bulletins, speeches, alerts. Enforcement actions come as monthly news releases, not a feed of their own. |
| FDIC | "Subscribe via RSS" on `https://www.fdic.gov/news/press-releases` | Address not seen. |
| US DOJ Antitrust Division | `https://www.justice.gov/atr/news-feeds` | Civil case filings, criminal case filings, press releases. |
| Federal Reserve Board, remaining feeds | `https://www.federalreserve.gov/feeds/feeds.htm` | Lists an "All Press Releases" feed plus monetary policy, enforcement and banking applications. Seen as indexed documents: `https://www.federalreserve.gov/feeds/press_orders.xml` (banking applications, low relevance), `https://www.federalreserve.gov/feeds/speeches.xml`, `https://www.federalreserve.gov/feeds/working_papers.xml`, `https://www.federalreserve.gov/feeds/feds.xml`. The monetary-policy and enforcement file names were not found. |
| CFTC | `https://www.cftc.gov/RSS/index.htm` | Indexed as feeds: `https://www.cftc.gov/RSS/RSSGP/rssgp.xml` (general press releases) and `https://www.cftc.gov/RSS/RSSENF/rssenf.xml` (enforcement). Left out as low relevance to a leveraged-credit desk; add if the desk covers derivatives. |
| EU Commission competition | RSS link on `https://competition-policy.ec.europa.eu/news` | Mergers and antitrust decisions. Worth adding once sectors are named. |
| SRB (Single Resolution Board) | "RSS feed" link on `https://www.srb.europa.eu/en/news-category/news` | Address not seen. |
| BaFin | `https://www.bafin.de/EN/service/rss/rss_node_en.html` | Several feeds, including measures against firms. German-language items. |
| Bundeskartellamt | `https://www.bundeskartellamt.de/DE/Service/RSS/rss_node.html` | Press releases and notices. German-language. |
| Ofcom | RSS link in the footer of `https://www.ofcom.org.uk/news-and-updates` | Telecom regulator; relevant to a UK telecom issuer. Address not seen. |
| FSB | `https://www.fsb.org/rss-feeds/` | Publications, consultations and press, in subcategories. |
| IOSCO | None found. The only mention was a 2009 note about `iosco.org/rss.xml`. | No current evidence of a feed. |
| The Pensions Regulator | None official found. | Only a third-party mail relay. Relevant if a pension deficit matters to an issuer. |
| BIS, remaining feeds | `https://www.bis.org/rss/index.htm` | Lists media releases, speeches and committee feeds. Only the working-paper feed address was seen. `https://data.bis.org/feed.xml` (statistics release updates) was also seen; low relevance. |

### News and trade press

| Outlet | Finding | Why not |
|---|---|---|
| BBC News (business) | The search tool is refused access to the BBC. A third-party directory gives `https://feeds.bbci.co.uk/news/business/rss.xml`; it was not seen on a BBC page. | Address not confirmed from the publisher. The BBC's own feed page was reported as last updated in 2011. Terms not confirmed. |
| The Guardian (business) | The Guardian's help page is reported to say a feed is available by adding `/rss` to a section address. The search tool is refused access, so this rests on third-party summaries. | Address not confirmed from the publisher. Reported as personal, non-commercial use only. |
| Financial Times | Third-party directories list `ft.com/rss/home`; some report the regional variants as not responding. The search tool is refused access to `ft.com`. | Not confirmed from the publisher. Headline and link would be fine, since articles are paywalled but only those are stored. Worth a manual check. |
| Reuters | No official feed. Third-party reports say `feeds.reuters.com` stopped updating in June 2020. | None exists. |
| Associated Press | Third-party reports say the `apnews.com` feeds stopped working in 2024. | No official feed found. |
| Bloomberg | Third-party directories list site-wide and markets feeds; one reports dead sections. | Not confirmed from the publisher. Terms unknown. |
| WSJ, MarketWatch | The search tool is refused access to both. | Not checked. |
| Nikkei Asia | Publisher page `https://info.asia.nikkei.com/rss` exists; its terms are reported to limit feeds to personal, non-commercial reading. No feed address was taken from it. | Terms. |
| Handelsblatt | A third-party directory lists `contentexport/feed/finanzen` and `.../wirtschaft` paths; nothing from Handelsblatt itself. | Not confirmed from the publisher. German-language. |
| Les Echos | A third-party directory lists a `services.lesechos.fr/rss/` pattern. | Not confirmed from the publisher. French-language. |
| PitchBook | Indexed as feeds: `https://pitchbook.com/tag/restructuring.rss` (last build seen March 2026) and `https://pitchbook.com/tag/leveraged-finance.rss` (last build seen August 2025). | The most relevant trade-press feeds found, but both look stale; check them live and read the terms before adding. |
| Octus, Debtwire, 9fin, LCD | No public feed found. | Paywalled services. |

### Research

| Source | Finding | Why not |
|---|---|---|
| Bank Underground (BoE staff blog) | The blog is at `https://bankunderground.co.uk/`. A feed at `/feed` is a guess by the search tool, not seen. | Address not confirmed. |
| Bank of England Knowledge Bank | `https://www.bankofengland.co.uk/rss/knowledgebank` is indexed; it appears to be the education and explainer section. | Low relevance. |
| NY Fed Liberty Street Economics | No first-party feed found. `https://fedinprint.org/rss/newyork.rss` carries NY Fed publications but is an aggregator whose search copy was last updated in July 2026. | Not the publisher's own feed; apparently stale. |
| St. Louis Fed | Feed list at `https://www.stlouisfed.org/rss` includes the On the Economy blog; address not seen. | Address not obtained. |
| NBER | Working-paper feeds are reported to be per programme; no address found. Terms not checked. | Address and terms. |
| OFR | No feed found for the blog or publications. | No feed. |
| IMF | Publications feed `https://www.imf.org/en/publications/rss?language=eng` is indexed, with items in the search copy dated 2023. | Looks stale; the IMF media centre has its own feeds at `https://mediacenter.imf.org/Rss`. |
| AFME | No official feed found. | No feed. |
| LSTA | No feed found. | No feed. |

## 3. How the owner adds them

The commands are read from `src/deploy_workflow/signal/cli.py`. Nothing is fetched until the
owner approves a source; approving is a command-line act on the server, because the browser
approve control is not part of this build.

- `sources propose` stores a source as `proposed`. It runs the address check (`check_address`),
  which looks the host name up in DNS and refuses an address that is not https, not a plain
  host name, or resolves to a non-public address. It does not request the feed.
- `sources list` prints `id  state  health  last item  name`.
- `sources approve <id>` moves a source to `approved`. The ingest loop (`serve` or `ingest`) then
  fetches it, at most every 10 minutes.
- `--by` is free text recorded as the proposer. `--root` is the folder holding `signal/`.
- A writer can also propose in Settings, Sources. That stores a proposal and fetches nothing.

All 19 propose commands below, and the 7 topics commands in Section 4, were run against a
throw-away store (the `propose` address check replaced by a no-op, because DNS is refused here).
All were accepted and listed. No source was approved in any store, and the throw-away store was
deleted.

### Check the feeds before approving

This runs Signal's own fetcher and parser on each address and prints what the owner needs to
know first: accepted or rejected with the parser's reason, item count, newest date. It stores
nothing and uses no database. Run it from a machine with ordinary internet access, from the
repository root. Its error and parse paths were exercised here on synthetic bytes (accepted,
`<!DOCTYPE` refused with "feed declares a DTD or entities", HTML refused with "document is
neither an RSS 2.0 nor an Atom feed"); no real feed was fetched.

```bash
PYTHONPATH=src:apps/issuer-library:. uv run python - <<'PY' \
  https://www.sec.gov/news/pressreleases.rss https://www.bis.org/doclist/wppubls.rss
import sys
from deploy_workflow.signal.feeds import FeedError, parse_feed
from deploy_workflow.signal.fetch import FetchRefused, fetch

for url in sys.argv[1:]:
    try:
        body = fetch(url, None, None).body or b""
        items = parse_feed(body)
    except (FetchRefused, FeedError) as error:
        print(f"REJECTED {url}: {error}")
        continue
    dated = [item.published for item in items if item.published]
    newest = max(dated).date() if dated else "no dates"
    print(f"OK {url}: {len(items)} items, newest {newest}, {len(body)} bytes")
PY
```

Replace the two example addresses with the ones to test (or all 19). A feed that prints
`REJECTED` should not be approved.

### One worked example

```bash
uv run python -m deploy_workflow.signal --root /path/to/workflow-folder sources propose "SEC press releases" --kind regulator --url https://www.sec.gov/news/pressreleases.rss --by "A. Kovac"
uv run python -m deploy_workflow.signal --root /path/to/workflow-folder sources list
uv run python -m deploy_workflow.signal --root /path/to/workflow-folder sources approve 1
```

The id in `approve` comes from `sources list`; on an empty store the first proposal is 1.

### One line per recommended source

Propose all of them first, read the ids from `sources list`, and approve only the ones the
owner wants. Replace `--by` with the proposer's name.

```bash
R="--root /path/to/workflow-folder"
S="uv run python -m deploy_workflow.signal $R sources propose"
$S "SEC press releases" --kind regulator --url https://www.sec.gov/news/pressreleases.rss --by owner
$S "Federal Reserve Board banking and consumer regulatory policy" --kind regulator --url https://www.federalreserve.gov/feeds/press_bcreg.xml --by owner
$S "Federal Reserve Board other announcements" --kind regulator --url https://www.federalreserve.gov/feeds/press_other.xml --by owner
$S "Bank of England news" --kind regulator --url https://www.bankofengland.co.uk/rss/news --by owner
$S "Bank of England publications (includes PRA)" --kind regulator --url https://www.bankofengland.co.uk/rss/publications --by owner
$S "UK CMA activity on GOV.UK" --kind regulator --url https://www.gov.uk/government/organisations/competition-and-markets-authority.atom --by owner
$S "FCA news" --kind regulator --url https://www.fca.org.uk/news/rss.xml --by owner
$S "ECB press releases, speeches and interviews" --kind regulator --url https://www.ecb.europa.eu/rss/press.xml --by owner
$S "EBA news and press" --kind regulator --url https://www.eba.europa.eu/rss.xml --by owner
$S "AMF communiques (France)" --kind regulator --url https://www.amf-france.org/fr/flux-rss/display/23 --by owner
$S "ICMA news in brief" --kind news --url https://www.icmagroup.org/News/news-in-brief/rss --by owner
$S "Federal Reserve Board FEDS Notes" --kind research --url https://www.federalreserve.gov/feeds/feds_notes.xml --by owner
$S "Bank of England Bank Overground" --kind research --url https://www.bankofengland.co.uk/rss/bank-overground --by owner
$S "ECB publications and working papers" --kind research --url https://www.ecb.europa.eu/rss/pub.html --by owner
$S "ECB blog" --kind research --url https://www.ecb.europa.eu/rss/blog.html --by owner
```

The approve step is deliberately not scripted: the owner reads `sources list`, then runs
`sources approve <id>` once per chosen source.

## 4. Suggested starter topics

Topics match a keyword phrase in a story's title or the feed's own summary (an exact-phrase
full-text match, case-insensitive), restricted to the listed kinds. A topic has at most 12
keywords. The last topic is a placeholder for the desk's example sectors and should be replaced
once the owner names them. The "Rating actions" topic includes `ratings`, which has no source
yet, so today it matches news headlines only.

| Topic | Keywords | Kinds | Matched to |
|---|---|---|---|
| Merger control and antitrust | merger control, phase 2, in-depth investigation, statement of objections, antitrust, cartel, remedies | regulator | CMA, FTC |
| Enforcement and disclosure failures | accounting fraud, misleading investors, disclosure, restatement, auditor, settles charges, penalty | regulator | SEC litigation and press, FCA, FTC |
| Rates and monetary policy | interest rates, rate decision, monetary policy, FOMC, Monetary Policy Committee, inflation, deposit facility | regulator, news, research | Fed, BoE, ECB, CNBC |
| Leveraged lending and private credit | leveraged lending, leveraged loan, private credit, nonbank, non-bank, CLO, default rate, credit spreads | regulator, research, news | Fed, BoE, BIS, ECB, ICMA |
| Defaults and restructuring | default, restructuring, chapter 11, bankruptcy, distressed, liability management, insolvency, administration | news | CNBC, ICMA |
| Rating actions | downgrade, upgrade, rating action, outlook, creditwatch, placed on review | news, ratings | CNBC today; a ratings source later |
| Example sectors: telecom, gaming, aerospace | telecom, broadband, spectrum, casino, gaming, gambling, aerospace, Boeing, Airbus | every kind | CMA, FTC, CNBC |

```bash
R="--root /path/to/workflow-folder"
T="uv run python -m deploy_workflow.signal $R topics add"
$T "Merger control and antitrust" --keywords "merger control,phase 2,in-depth investigation,statement of objections,antitrust,cartel,remedies" --kinds regulator --by owner
$T "Enforcement and disclosure failures" --keywords "accounting fraud,misleading investors,disclosure,restatement,auditor,settles charges,penalty" --kinds regulator --by owner
$T "Rates and monetary policy" --keywords "interest rates,rate decision,monetary policy,FOMC,Monetary Policy Committee,inflation,deposit facility" --kinds regulator,news,research --by owner
$T "Leveraged lending and private credit" --keywords "leveraged lending,leveraged loan,private credit,nonbank,non-bank,CLO,default rate,credit spreads" --kinds regulator,research,news --by owner
$T "Defaults and restructuring" --keywords "default,restructuring,chapter 11,bankruptcy,distressed,liability management,insolvency,administration" --kinds news --by owner
$T "Rating actions" --keywords "downgrade,upgrade,rating action,outlook,creditwatch,placed on review" --kinds news,ratings --by owner
$T "Example sectors: telecom, gaming, aerospace" --keywords "telecom,broadband,spectrum,casino,gaming,gambling,aerospace,Boeing,Airbus" --by owner
```

Single words such as `default`, `outlook`, `disclosure` and `administration` are broad and will
match unrelated headlines (a software "default", a "disclosure" in any context). Expect to tighten
them after a week of real stories.

## 5. Open points for the owner

1. **Terms of use.** No publisher's feed terms were read in full. Reported or likely
   restrictions: Nikkei Asia (personal, non-commercial), The Guardian (personal,
   non-commercial), CNBC (feed terms not found; site now under Versant), BBC (not
   confirmed). The recommended list is mostly central banks and regulators, whose terms were
   not checked either. Signal stores only title, link, time and a 300-character summary, and
   shows the link back to the publisher; the owner should still confirm each publisher allows
   that for a shared internal tool before approving.
2. **Check every feed live before approving**, with the Section 3 command. This session could
   not read a DOCTYPE, status, content type or item count from any feed. A feed Signal rejects
   shows as failing, never silently, but it is cleaner to find out before approval.
3. **Freshness.** Search copies of several feeds looked old (FTC to early September, FEDS Notes
   to March, ICMA to June, Fed other announcements to July). They may be stale caches or
   quiet feeds.
4. **Ratings.** Decide whether the desk accepts news-headline matching for rating actions, or
   will license a ratings data product outside Signal.
5. **Sector-specific regulators** to add once the desk names its sectors, using the
   addresses in the Section 2 table: Ofcom (telecoms), EU Commission competition, and
   Bundeskartellamt (mergers), BaFin and the SRB (European banks), OCC and FDIC (US
   banks), DOJ Antitrust, and the gaming and aviation regulators for the casino and
   aerospace examples, none of which was searched.
6. **Fitch, WSJ, MarketWatch, FT, BBC, The Guardian** could not be searched from this session.
   They may have usable feeds.
7. **Language**: AMF is French; BaFin, the Bundeskartellamt, Handelsblatt and Les Echos would be
   German or French. Signal's topic keywords are matched as written, so English keywords will
   not match them.

## How this draft was made

- Sources of evidence: web searches returning publisher pages and indexed feed documents, and the
  project's own `check_form`. The container's proxy refused direct requests; the fetch tool refused
  or could not resolve the hosts tried. Refused by the proxy (HTTP 403 on CONNECT): `www.sec.gov`,
  `www.federalreserve.gov`, `www.bankofengland.co.uk`, `www.gov.uk`, `www.ecb.europa.eu`,
  `feeds.bbci.co.uk`, `www.theguardian.com`, `www.bis.org`, `www.fca.org.uk`. Not resolvable by the
  fetch tool: `www.sec.gov`, `www.federalreserve.gov`, `www.gov.uk`; refused by it:
  `www.bbc.co.uk`, `www.theguardian.com`. The search tool refused to crawl `fitchratings.com`,
  `bbc.co.uk`, `theguardian.com`, `ft.com`, `wsj.com`, `dowjones.com`, `marketwatch.com`.
- No feed address was invented. Where the publisher's address was not seen, the source is in
  Section 2 and not in the commands.
- No quality gate or prose check applies to this file. `tools/quality_gate.py` checks changed
  Python only; `.github/workflows/checks.yml` has no Markdown or docs lint; the prose checks in
  `src/deploy_workflow/prose_checks.py` apply to module handoffs.
