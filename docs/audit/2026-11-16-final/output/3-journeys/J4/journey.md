# J4: Credit committee member, challenging a finished synthetic run

Person: a credit committee member who has not read the sources and has been given one finished
run to challenge (`PRODUCT.md`, Users). Method: the person reads the screen, not the code, and
picks three figures and three claims to verify from the screen alone: source, period, unit,
calculation, limitation. Expected values were taken from the files the screen lets the person
open (the uploaded workbook, the agreement, the downloaded handoffs) or recomputed by hand, never
from the code that draws the figure. "Clicks" stand in for time-to-find, because every step was
driven by a script.

Environment: `proof.serve` (synthetic, canned responses, no paid call) on port 8764, one fresh
run root under `/tmp/jr/j4/` per segment, Chromium headless shell build 1243, every host but
loopback blocked in the browser (R8). Across 18 segments and about 40 page loads the browser
blocked 0 requests, had 0 failed requests, 0 console errors or warnings and 0 page errors, and
no request returned a status of 400 or above (checked in segment 1 in full and for blocked,
failed, console and page-error lists in every later segment). Nothing failed to draw.

## Step 0. Produce a finished run (not part of the person's journey)

- Wanted: a finished synthetic run in my own root.
- Did: the sequence in `web/scripts/connected-proof.mjs`, driven by `probes/_lib.mjs`
  (`completeRun`): issuer `Northbridge Synthetic Group`, as-of `2025-03-31`, analyst `Ana L`,
  upload `northbridge-filing.txt`, `northbridge-portfolio.xlsx`, `northbridge-credit-agreement.txt`,
  Continue to purpose (Full credit assessment), portfolio workbook, legal documents `executed`,
  agreement `northbridge-credit-agreement.txt`, one rating (Moody's issuer B1 Negative as of
  `2025-02-28`), Review run, accept every limit, approve, Submit run, Start synthetic run.
- Happened: the run reached `Finished` and `Open report` appeared in about 8 s from service start
  (14 of 14 modules, USD 0.00 of USD 25.00). Segment 1 finished in 8.6 s including service start.

## Step 1. Land on the report and read the Overview for the verdict

- Wanted: the verdict, and which numbers it rests on.
- Screen offered: header (issuer, `As of 31 March 2025`, `Full credit assessment`, `Finished`,
  `Synthetic test`, `Show sources` switch, rating card `Moody's B1 Negative Entered at run start`);
  tabs Report, Overview, Changes, Modules 14, Forecast, Evidence; then Overview: `Bottom line`
  ("The synthetic issuer shows one observed item."), five figure tiles (Net leverage 2.25x, Gross
  leverage 2.80x, Interest coverage 4.00x, Revenue $2,250m, Cash $275m, each with a change against
  FY2023 and `FY2024`), `Key findings` ("The synthetic issuer's cover is thin at 3.1x."),
  `Contrary evidence and what would change the view` ("Nothing supplied contradicts the view; a
  USD 1,250 million refinancing would."), `Bottom line by module` (13 modules), `Limitations`,
  `Dates to watch`.
- Did: read it top to bottom; picked the figures and claims below.
- Happened: found at once (0 clicks). The bottom line states no verdict ("one observed item"); the
  Committee decision module's own posture line ("Final Sizing Posture: Requires More Work") is
  not on the Overview (J3 territory; noted, not registered here).

Picks:

| # | Item | Where it sits |
| --- | --- | --- |
| F1 | Net leverage 2.25x, FY2024 | Overview tile |
| F2 | Max single issuer exposure 2.37% NAV against a 2.50% limit | Committee decision module, Portfolio limits |
| F3 | Base-case cash proxy FY2027E 172.46 (and Downside 97.47) | Forecast |
| C1 | "The synthetic issuer's cover is thin at 3.1x." | Overview, Key findings |
| C2 | "Nothing supplied contradicts the view; a USD 1,250 million refinancing would." | Overview, Contrary evidence |
| C3 | Covenant headroom: net leverage 4.2x against 5.0x, interest cover 2.6x against 2.0x | Legal & covenants module |

Extra checks that came up: the Confidence score (89, High) and the rating card.

## Step 2. F1, Net leverage 2.25x: find source, period, unit, calculation, limitation

- Wanted: where 2.25x comes from.
- Screen offered: the tile shows `2.25x`, `-0.75x vs FY2023`, `better`, `FY2024`. No trace control,
  no source, no calculation. Clicking the tile opens nothing, and switching `Show sources` on draws a
  trace control by the bottom line and the two passages but none on any of the five tiles
  (finding J4-001; probe `probes/j4-001-overview-tiles-no-trace.mjs`).
- Did: went to Modules > Financial foundation (2 clicks), pressed `Show sources for Leverage`.
- Happened: drawer "Chart data: leverage · Financial foundation · Handoff line 22", Basis
  `Synthetic.`, then two lines `no page / the row cites no page or register`. The `Table` view shows
  FY2024 `2.80` (total debt / EBITDA) and `2.25` (net debt / EBITDA), unit `x`. `Net debt data`
  shows FY2024 gross debt 1400, cash 275, net debt 1125, `US$m`, "Synthetic; gross debt includes
  finance leases." (unformatted numbers beside the charts' `1,250`; Low, not registered).
- Did next: `Open in Evidence`, which lands on one passage only; then the Evidence `Trace` tab,
  module `Financial foundation`, the handoff link (5 to 6 clicks from the tile). That view shows
  the whole handoff, including the `T4.9 Calculation register`: `Net debt / EBITDA | n / d | 1125 |
  annual.txt | 500 | annual.txt | FY2024 | USD | US$m | 2.25 | Stated | Tier 3 | Synthetic.` and the
  `Period table` (FY2024 = 2023-10-01 to 2024-09-30). Recomputed by hand: 1125 / 500 = 2.25. Right.
- Result for F1: value right; period found only by the long path (FY2024 ends six months before the
  `As of 31 March 2025` the page header shows, and no tile or chart says so); unit found; calculation
  found only in the full handoff view; limitation is the one word `Synthetic.`; source is
  `annual.txt`, which the run does not hold (J4-004).

## Step 3. C1, "cover is thin at 3.1x"

- Wanted: which cover, over which period, from which source.
- Did: `Show sources for this passage` beside Key findings.
- Happened: drawer "Key findings · Committee decision · Handoff line 32", Basis `annual.txt, page
  2`, `annual.txt p.2 · not in inventory: the Basis file is not in the CP-0 inventory`. The screen is
  honest that the source is missing. But the Overview tile says interest coverage is `4.00x`; the
  Legal & covenants module says current interest cover `2.6` against `2.0`; the Downside module's
  control case says all-in cover `3.10`. Four values for cover, no definition beside any, no flag
  (J4-002; probe `probes/j4-002-screens-disagree.mjs`). The 3.1x claim matches only the Downside
  control, a different module, and nothing links them.

## Step 4. C2, "Nothing supplied contradicts the view; a USD 1,250 million refinancing would"

- Wanted: where the USD 1,250 million sits and when.
- Did: the passage's drawer: `Basis was not recorded for this item`. Then Modules > Financial
  foundation > Debt maturities, `Table`: FY2026 500, FY2027 `Not supplied: the schedule stops here`,
  FY2028 1,250 (US$m). Then Modules > Refinancing & LME > Refinancing need: FY2026 500, FY2027
  **1,250**, committed resources 300 and `Not supplied: no commitment is stated`.
- Happened: the refinancing the claim rests on falls in FY2028 on one page and FY2027 on another
  (the analyst's own note at run start said "Check the 2028 maturities"). Unflagged (J4-002).
  Missing is shown as `n.a.` on the chart and as the reason in the table: that part is right.

## Step 5. C3, covenant headroom

- Wanted: tests, thresholds, current values, headroom, source.
- Did: Modules > Legal & covenants (chart and `Table`), then opened the agreement from Evidence >
  Sources (`Open source file: northbridge-credit-agreement.txt`, 422 bytes) to check the thresholds.
- Happened: the page shows Net leverage `Passes at or below 5.0 x` current `4.2`; Interest cover
  `Passes at or above 2.0 x` current `2.6`; Minimum liquidity `Passes at or above 100 US$m` current
  `n.a.`. The agreement holds Section 1 (net leverage at or below 5.0x) and Section 2 (interest cover
  at or above 2.0x) and nothing on minimum liquidity: the third test has no source. The screen's
  basis for all three is `Synthetic.` The `Table` view adds headroom `0.8x` and `0.6x` (5.0 - 4.2 and
  2.6 - 2.0, right). The `4.2x` current net leverage disagrees with the Overview's 2.25x (J4-002).

## Step 6. F2, Max single issuer exposure 2.37% NAV against a 2.50% limit

- Wanted: the exposure, its limit, the date and the source.
- Did: Modules > Committee decision > Portfolio limits (chart, then the collapsed `Published
  exposures and proposals` table, then `Show sources for Portfolio limits`); then Evidence > Sources >
  `Open source file: northbridge-portfolio.xlsx` and read its `Compliance_Monitor` sheet.
- Happened: chart `2.37%` against `limit 2.50%` and `3.73%` against `limit 5.00%`; caption `Current
  exposure and limits in % NAV · 2025-03-31`; the table adds proposed `2.40` and `Not supplied: no
  proposal`; the drawer's Basis is `Synthetic Compliance_Monitor snapshot as of 2025-03-31. Proposal is
  illustrative.` The workbook: C-01 `Max single issuer exposure`, limit 2.5 `% NAV`, current 2.37,
  `last_checked` 2025-03-31; C-05 `Max unrated exposure`, limit 5, current 3.73.
- Result for F2: value, limit, unit and date right and checkable from the screen plus the source file.
  This is the best-traced figure in the run. Two small points: the drawer joins both rows' Basis texts
  into one run-on line, and the file name is not on the page (only the sheet name).

## Step 7. F3, Forecast: Base case cash proxy FY2027E 172.46, Downside shock 97.47

- Wanted: how the forecast was built and what the downside assumes.
- Did: Forecast tab; read `Forecast cases`, `Cash flow model`, `Model limitations`; opened `Forecast
  assumptions`; pressed `Show sources for Base case` and `Open in Evidence`; downloaded `Exact
  forecast JSON`.
- Happened: the cash flow model table gives every line for FY2025E to FY2027E (revenue 1,050 /
  1,092 / 1,125, Adj EBITDA 315 / 339 / 360, interest 36 / 33 / 30, taxes and working capital 105 /
  109 / 112, capex 42 / 44 / 45, cash proxy 132 / 153 / 172). `Units not recorded` is stated beside it.
  `Forecast assumptions` opens to a one-row table `Observed | Not supplied: nothing to report`. The
  trace opens `Forward credit model · Handoff line 93`, whose Evidence view is a raw JSON block: base
  drivers (growth 5% / 4% / 3%, EBITDA margin 30% / 31% / 32%, capex 4% of revenue, tax and working
  capital 10% of revenue, interest 6% of debt, distributions 20, repayments 50) and `downside_shock`
  `ebitda_decline 0.20`, `rate_increase 0.10`. The Forecast page never states the shock size
  (J4-003; `probes/j4-003-forecast-assumptions.mjs`).
- Recomputed by hand from the JSON: FY2025E EBITDA 30% x 1,050 = 315; CFO 315 - 36 - 105 = 174; capex
  4% x 1,050 = 42; cash proxy 132. FY2026E 152.64, FY2027E 172.4568 (shown 172.46). Downside:
  EBITDA x 0.8 and interest at 6.6%: FY2025E 65.4, FY2026E 81.636, FY2027E 97.47216 (shown 65.40 /
  81.64 / 97.47). `forecast_exact.json` carries 172.4568 and 97.47216. Right.
- Result for F3: the arithmetic is right; the unit is `not recorded`; the assumptions are on no page
  except as raw JSON; the base year (revenue 1,000, debt 600, cash 100) is not the reported FY2024
  (revenue 2,250, debt 1,400, cash 275) and `Model limitations` says so only as "the forecast inputs do
  not name the row and period of this line" (ten times). The Downside module's own scenarios shock
  EBITDA by 10% or 20% with interest unchanged or +5% (`k = 0.05`), so the run has two different
  downsides (J4-002, J4-003). The page also names `CP-1`, `CP-2G` and `Python` in its prose (J4-009).

## Step 8. Download the original handoff through the screen and compare

- Did: Evidence > Summary: `Download all handoffs` (zip), `Download Financial foundation`, `Download
  Committee decision`, `Download Source readiness`, `Download Research questions`, and the three
  model files. Compared them with `proof/handoffs/` and with the screen.
- Happened:
  - All 14 files in `handoffs.zip` are byte-identical to the 14 single downloads.
  - Each download is the canned handoff with a 12-to-24-line header added by the run (`# CP-1`,
    `## Request`, `## Sources` listing the three uploaded files, `context`, and the earlier modules by
    hash). Everything from `## Findings` on is byte-identical to `proof/handoffs/<module>.md` for all 14.
  - The sha-256 in each handoff link on the screen equals the hash of the file downloaded
    (CP-1 `d501fa95...`, CP-0 `713833b3...`).
  - Every trace drawer's `Handoff line N` was checked against the downloaded file: 92 drawers on the
    Overview, Financial foundation, Legal & covenants, Committee decision, Downside and Refinancing
    pages, 0 mismatches (the line is the heading's first row or the paragraph itself).
  - The three source hashes on Evidence > Sources equal the sha-256 of the files in `proof/`.
  - Numbers: for each of the 14 module pages, every numeric cell of the handoff's chart and table
    sections was found on the page (charts turned to `Table`): 1 miss, the proposed exposure `2.40`,
    which is in the collapsed `Published exposures and proposals` table, so 0 real misses.
  - `Annual model handoff` is `annual.md`, byte-identical to the Financial foundation handoff;
    `Calculation JSON` has `annual_periods: []`, `values: {}` and a history whose every amount is
    null; `The original HTML Model is unavailable for this run.` (J4-012).
- Result: screen and handoff agree. What the screen shows is what the handoff says; the defects
  are in what the handoffs say (J4-002) and in what the screen leaves out.

## Step 9. Look for contrary evidence and for what would change the view

- Did: Overview card; each module page's section of the same name (13 pages); Evidence > Gaps.
- Happened: the Overview card shows one passage (from Committee decision). Every module page repeats
  the identical sentence "Nothing supplied contradicts the view; a USD 1,250 million refinancing
  would." with the same `Basis was not recorded for this item`. The Evidence validation module's
  map holds one `Supports` edge. Gaps: `0 / This run lists no gaps.` while the pages carry `Not
  supplied` cells (Financial foundation: cash flow statement lines, balance sheet totals, debt
  principal; Refinancing: committed resources; Legal: minimum liquidity), a missing FY2027 maturity,
  and the Forecast's ten "do not name the row and period" lines. And the screens contradict each
  other on cover, leverage and the timing of the USD 1,250m (J4-002). Nothing flags any of it.
- Result: contrary evidence is present as a sentence and is not corroborated or challenged anywhere
  the person can see; what would change the view is "a USD 1,250 million refinancing", which the
  person cannot place in time.

## Step 10. Evidence > Sources, Gaps, Script checks, Record

- Sources: three files, each `Named in a handoff` against all 14 modules, each with its hash and an
  `Open source file` link that works (the two text files and the workbook download; 422, 52 and
  11,137 bytes). The handoff bodies cite `annual.txt` 38 times (25 in Financial foundation), and name
  `northbridge-filing.txt` once (Rates, FX & hedging), the agreement never and the workbook never. `annual.txt` is on no Sources list and no Gaps list; only the drawer says `not in inventory`
  (J4-004).
- Script checks: tab badge 215; per module 205 `not checked`, 9 `agreed`, 1 `noted` (J4-011).
- Confidence score 89 High: recomputed from the inputs table (8 / 2 / 2 lineage, 95 of 100 fields,
  gate pass, one minor finding): evidence 90, coverage 95, (0.6 x 90 + 0.4 x 95) - 3 = 89. Right; the
  method is on no page (J4-005).
- Calendar: `Historical 9 / Scheduled 18 / Scenario 9` for four distinct events repeated by nine
  modules; the Overview's `Dates to watch` lists one event five times (J4-006).
- Overview shows five of six headline tiles; Adjusted EBITDA is dropped without a word (J4-007).

## Step 11. What the person could decide, against the control matrix

| Matrix row | What the person could do here | Match |
| --- | --- | --- |
| CT-047 trace drawer: "any paragraph, row or figure's single trace control" | Every passage, chart, table row and confidence tile has one; the five Overview tiles have none | No (J4-001) |
| CT-048 download handoffs, calculation JSON, the Model | Handoffs and zip: yes and exact. Calculation JSON: yes, no historical values. Model: unavailable | Partly (J4-012) |
| CT-046 Evidence module filter and tab | Module filter and six tabs work; Gaps and Sources leave out unmatched citations | Partly (J4-004) |
| CT-041 delivery and library admission: not a user control | The person cannot repair or flag a conflict; there is no "challenge" control | As designed |
| CT-045 forecast case | Cases card, charts and tables follow the case; the assumptions are not readable | Partly (J4-003) |
| CT-049 method and revision: fixed by ruling | The Confidence method is not shown on the page, so the person cannot see which method gave 89 | Partly (J4-005) |

## Step 12. Smaller things the person met on the way

- Rating card: `Moody's B1 Negative / Entered at run start`; the date entered (2025-02-28) is only a hover title (J4-008).
- Names: Gross leverage / Total debt / EBITDA / Total leverage for one measure; Interest coverage / Interest cover / All-in cover (J4-013).
- Module order differs between the Overview, the Modules navigator and the Evidence filter; the Overview lists 13 of 14 (J4-014).
- The Forecast page says "Python's arithmetic" and names `CP-1` and `CP-2G` (J4-009).
- Two "Show sources for FY2024" controls on one page, three "Cash proxy by scenario" (J4-010).
- Keyboard: `Show sources` opens with Enter, focus moves into the dialog, Escape returns focus to the control. Good.
- Back after `Open in Evidence` returns to the screen the person came from. Good.
- No absolute file path appeared in any captured screen or downloaded file; the Script checks tab prints repository-relative script paths only.

## Findings, in order

| Id | Severity | One line |
| --- | --- | --- |
| J4-001 | Medium | Five headline tiles have no trace control |
| J4-002 | Medium | Screens disagree on cover, leverage, the 1,250 maturity, source readiness; unflagged (canned handoffs) |
| J4-003 | Medium | Forecast assumptions section empty; downside shock and drivers not stated |
| J4-004 | Medium | Sources and Gaps hide citations that match no file; Sources claims all 14 modules name every file |
| J4-005 | Medium | Confidence score method shown nowhere |
| J4-006 | Medium | Calendar counts one event once per module (36 for 4) |
| J4-007 | Medium | Adjusted EBITDA tile dropped silently |
| J4-008 | Low | Rating date in a hover title only |
| J4-009 | Low | Module codes and "Python" in Forecast prose |
| J4-010 | Low | Duplicate accessible names on trace controls |
| J4-011 | Low | Script checks badge 215, 205 not run |
| J4-012 | Info | Model and calculation downloads hold nothing to recompute history |
| J4-013 | Low | Same measure, different names across screens |
| J4-014 | Low | Module order differs across screens; Overview lists 13 |

## Step 13. Is the Evidence "Handoff evidence" view the whole handoff? (fidelity check)

- Did: for each of the 14 modules, opened Evidence > Trace > module > handoff link and looked for
  every paragraph line and every table cell of the downloaded handoff in the view (2,487 lines and
  cells in all, whitespace folded).
- Happened: every line and cell is present except four things. (1) `## Request` and its line
  (issuer and as-of) in all 14. (2) `## Next module` in all 14. (3) The `Escalation Consequence`
  column of the Downside handoff's `T2B.7 Monitoring sensitivity flags` (`Review falling cash
  cover`, `Review cash deficit`): dropped on every screen, the module page, the drawer and the view,
  because the page treats that header as text written for another module (the rule in AGENTS.md:
  "text written for another module is drawn nowhere"), so by ruling, not registered. The person who
  is looking for "what would change the view" does not see that the handoff named an action for each
  trigger. (4) The Forward credit model's `Forecast inputs (machine-readable)` JSON block is not in
  the full view; it is only in the single-passage view opened from the Forecast page's drawers
  (added to J4-003).
- Result: the view is a faithful render apart from these; nothing in it is altered.
