# Redesign follow-on: what the frontend cannot do alone

Written 2026-11-25 when the ten redesign branches had merged into
`claude/exciting-albattani-v1zoug`. The redesigned pages draw a designed gap wherever a handoff,
the service or the run record does not carry what the screen map asks for. Each item below closes
one of those gaps. Delivery adds no analysis, so none of them can be closed in the frontend.

Each Method item is selected per `METHODOLOGY-REVIEW.md` and proven on a real run before the
frontend draws it. Nothing here is started by this plan; each is a separate piece of work.

## 1. Module handoffs (Method)

From `docs/design/screen-map.md` § What must change outside the frontend, ranked there, plus what
the sessions found while building.

| # | Change | Unlocks | Found by |
|---|---|---|---|
| 1 | Committee decision writes stance and action as typed fields, Security selection its recommendation the same way, and the publication records a clearance for each (the `actionTreatment` of `docs/superpowers/specs/2026-11-24-issuer-front-page-and-report-exports.md`, which today records holds only) | The call chip on Overview, the stance on History and Library, was → now on Changes. Since the merge with main (2026-11-25) no summary page shows a decision: none has a recorded clearance, so each says it is not shown and the module's own page shows it | Screen map; S1; PR #73 |
| 2 | Evidence validation writes clearance status and committee use as fields | The clearance tile without reading the bottom line | Screen map; S3 |
| 3 | Financial foundation writes pro forma states as typed rows, a full debt stack, and more than two periods where supplied; period labels the page can order (FY, LTM end, quarter) | Pro forma marks, the capital structure, trend lines. Today a row like "FY2024 pro forma" makes a period set unorderable and the page draws no line | Screen map; S3 |
| 4 | Forward credit model writes a per-year path per case | The Forecast lead and grid without gaps | Screen map |
| 5 | Downside writes break points as a table with fixed headings (`T2DS.4`, `T2DS.6`) | The break-point ladder without reading id-prefixed headings | Screen map; S4 |
| 6 | Rates, FX & hedging writes `T2F.3`–`T2F.6` with fixed headings and states the unit (currency and scale) of every money column | The rate and FX grids; today they print the currency alone unless every cell states "m" | S4 |
| 7 | Changes attributes a cause to each changed measure, and names measures exactly as the pack does | Changes that explain; today a cause is matched only on the whole label | Screen map; S6 |
| 8 | Events carry a typed kind, amount and date precision; Research questions writes a question table; Committee decision splits "what would change the view" into outcomes | Calendar lanes, research coverage, outcome wells | Screen map |
| 9 | The model's `cashflow.limits` entries carry the row they qualify (a row id), instead of a "Row: …" prefix | Forecast keeps line-level ledger entries in Evidence by that id; today it matches the text before the first colon against row labels | S5 |
| 10 | Liquidity and Refinancing write the funding gap in one table shape (value column with unit, horizon column) | The funding-gap stat without reading several shapes | S5 |

The derived figures the redesign removed from module pages (margins, growth, sums, plugs,
positions) are listed with the handoff field that would let each be drawn honestly in
`docs/superpowers/specs/2026-11-24-s3-removed-derived.md`.

## 2. Service and run record

| # | Change | Unlocks | Found by |
|---|---|---|---|
| 11 | Each run summary carries its stance and who started it | History shows the stance of every run, not only the open one | S1 |
| 12 | The reading step reports which modules each file unlocks | Documents shows "what this file unlocks" per row instead of one note | S9 |
| 13 | The summary states what leaves the building for every run, including "nothing" when that is true | The Start run decision tile never shows "The service does not say what leaves" | S9 |
| 14 | `draft_rejected` events name only modules in the run's plan | Run progress's stop notice never falls back to listing every interrupted module | S10 |

## 3. Inputs at run start (Input)

| # | Change | Unlocks |
|---|---|---|
| 15 | Executed legal documents | Covenant headroom on Legal & covenants |
| 16 | Market quotes and peer data | Security selection relative value, Market-implied risk, Peer benchmark |

## 4. Proof on a real run (Proof)

| # | Change | Unlocks |
|---|---|---|
| 17 | A real run of Earnings quality, Liquidity, Ratings migration, Refinancing, Restructuring and Short snapshot | Their pages proven on retained output. Earnings delta, Ratings migration, Market-implied risk and Restructuring are not in the synthetic run, so their leads have been seen only in test renders |

## 5. Carried over from the merge with main (2026-11-25)

| # | Change | Why |
|---|---|---|
| 20 | The on-screen issuer front page of PR #73 (profile, credit view, debt stack, metrics grid, one decision chart first in Overview) | The owner chose the redesigned Overview on screen; the front page composes the Credit Snapshot PDF only. Its spec's "compact brief first in Overview" is not met on screen |
| 21 | Done 2026-11-25: the Export PDF control and the preview toolbar are restyled to the redesign | The paper itself keeps main's print layout |
| 22 | Evidence validation's clearance on the Overview | Its bottom line is withheld with the other decision modules; the tile only links its page until item 2 gives typed fields that state no decision |

## 6. Shared reader rules (Code, small)

| # | Change | Why |
|---|---|---|
| 18 | Widen `containsReference` (`web/src/pages/connected/publishedReport.ts`) to the forms the leads now strip themselves ("[E3]", "T4.18", "EV-012") and route every page through one reader rule | Today the Overview, the frame and the leads each keep their own copy of the cited-id rule |
| 19 | The `actionBias` reading in `web/src/pages/connected/reportView.ts` reads the bold-label form | Retire the Overview's local fallback |
