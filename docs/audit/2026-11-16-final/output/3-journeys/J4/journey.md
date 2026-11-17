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
  basis for all three is `Synthetic.` The `4.2x` current net leverage disagrees with the Overview's
  2.25x (J4-002). The `Headroom` column (0.8x, 0.6x) is in the handoff and not drawn.
