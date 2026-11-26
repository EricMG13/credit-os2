# Colour-as-signal mockups (every screen except Coverage)

Static illustrations for the owner to approve the look before any build. Each file is
self-contained (inline CSS and SVG, no network request, no library), 1440 px wide, light theme,
with invented issuers and figures. Open a file directly in a browser.

They apply the proposal recorded as `DESIGN.md` § "Colour as signal in charts, tables and visuals"
(owner, 2026-11-26). That section is not on `main` yet; it was read from the recording session's
worktree, with `docs/design/mockups/coverage-analytics.html` there as the worked reference. No
product code, token table or design document was changed.

## The scales (the same in every file)

| Meaning | Scale | Always with |
|---|---|---|
| Position in a stated order | sequential blue | the figure |
| Better / worse, only for measures in the direction table | green `#15803D` / red-orange `#C2410C`, one tint level each | ▲/▼ and the word |
| No ruled direction | grey | ▲/▼ only |
| Amount | sequential amber | the figure; a 1 px outline on white |
| Share of a limit used | green → amber → red bar fill (under 50, 50-70, 70-85, 85-100, 100% or more) | the percentage beside the bar; ✕ and "breaches" at 100% |
| Category | blue, orange, teal, purple, amber, rose, green, slate | a dot or segment and the word |
| Status | ink ✓ done · blue pulse running · orange dashed limited or blocked · red ✕ failed · grey hatch not run or missing | glyph and word, word in ink |

Interface chrome (top bar, tabs, controls, links, focus) stays blue on zinc. Missing is a hatched
gap with its reason, never zero. Text on a tint is ink only.

## Screens

| File | Screen | What changed | Rule applied | Left uncoloured, and why |
|---|---|---|---|---|
| `library.html` | Library | Leverage, cover and liquidity cells tinted better/worse against the prior period, each with a sparkline; sector dots; run-state glyphs | Better/worse; sparkline per cell with a period series; category; status | Decision column (the Library shows no stance, and stance has no ruled direction); next-event date; no rank or cohort tint, because the Library states no order |
| `overview.html` | Report · Overview | Leverage slopes and the four figure tiles marked better/worse with sparklines; maturity wall in amber by amount; capital structure by seniority; covenant room and the downside grid as share of limit used; pipeline and "could not do" as status; dates by event kind | Better/worse; amount; share of a limit; category; status; heat grid (case × test) | Bottom line, findings, contrary evidence, what would change the view (prose); confidence meter (not a limit, no ruled direction); the leverage path (grey: a forecast point has no prior) |
| `changes.html` | Report · Changes | Moved measures as rows tinted better/worse with dumbbells and sparklines; three measures with no ruled direction left white and grey; maturities then (grey outline) and now (amber); module matrix as ink status glyphs | Better/worse and "no direction: never coloured"; amount; status | Verdict sentence; causes (words; "Unresolved" is a hatched gap); measures that did not move |
| `module-financial-foundation.html` | Module · Financial foundation | Stats strip with sparklines and better/worse marks; segments as an amber heat grid with row sparklines; cash conversion and maturities by amount; bridge and debt stack by category; cover as share of limit used; statement rows with sparklines | Heat grid (segment × year); sparkline per row; amount; category; share of a limit | Statements table (mixed measures, so no heat); findings and limitations; Calculations and Definitions tabs |
| `module-downside.html` | Module · Downside | Break-point ladder and scenario table as share of limit used, with case markers by category and ✕ "breaches"; headline figures marked worse against the earlier run | Share of a limit; category; better/worse | Free cash flow and committed resources by case (no limit); stress design; no sparklines (two periods only); no year-by-year paths (the page draws none) |
| `module-legal-covenants.html` | Module · Legal & covenants | Headroom bullets and basket bars as share of limit used; headroom change marked worse with a sparkline over six test dates; entity and ranking maps by category; an uncomputed test as a hatched bullet | Share of a limit; better/worse (covenant headroom); category; missing as a gap | Document register and legal events; no test-history grid (the page draws none) |
| `forecast.html` | Report · Forecast | Case paths by category with direct labels; maturity ticks in amber; resources used against the wall as share of a limit; assumptions tinted lower or higher than base; uses of cash by category; grid rows with sparklines and hatched "not stated" cells | Category; amount; share of a limit; signed difference (blue lower, orange higher); sparkline per row | Stats strip and all forecast figures (no better/worse: a forecast has no prior); the yearly grid (mixed measures, no heat) |
| `evidence.html` | Report · Evidence | Check matrix as a status grid with totals; sources by type, with the used-by count in amber; spend against the cap as share of a limit; stage timings in amber | Status; category; amount; share of a limit | Trace split and derivation; gaps by severity (ink glyph and word: severity is not better/worse and takes no colour of its own); hashes and downloads |
| `calendar.html` | Report · Calendar | Lanes and list by event kind (colour and shape); maturity bars sized and tinted by amount; an undated event as a hatched gap | Category; amount; missing as a gap | Days from today (time to an event has no ruled direction); covenant test marks carry no headroom (none is stated on this page) |
| `deliverables.html` | Report · Deliverables | Tile status only: ready, or not available with the reason | Status | Everything else. Tiles only by ruling: no file contents, so no chart, sparkline or tint |
| `run-start.html` | Run start (Purpose; Review and start) | Pathway caps as amber bars on one scale; readiness rail as status with per-stage counts; estimate against the cap as share of a limit; document types by category | Amount; status; share of a limit; category | The form: fields, options, checkboxes, the statement of what leaves the building, Submit. A form has nothing a colour should signal |
| `run-activity.html` | Run activity and run progress | Run state and per-module segments as status; spend against the cap as share of a limit; cumulative spend as a step line; time per module tinted by amount; live pipeline | Status (animated for live state); share of a limit; period series; amount | Waiting rows (nothing has happened); spend per module (plain figures beside the tinted time) |
| `signal.html` | Signal feed | Story kind as a category dot; signal strength as amber pips; a sparkline per market series; source check as status | Category; amount; sparkline per row; status | Rating moves and market moves: sign or glyph in grey only, because ratings, yields and spreads have no ruled direction; unread counts |

## For the owner to rule on

- The share-of-limit bar reuses the better-green, amber and failed-red hexes, as the recorded
  proposal has it. They are told apart by form (a bar in a track with its percentage) and never
  appear as a tint or glyph. A separate hue family would remove the overlap.
- Status never uses green, so that green only ever means "better". This is the coordinating
  session's ruling, not the owner's.
- On Forecast, "higher than base" uses the pale orange of the signed-difference scale, which is
  the same hex as the palest "worse" tint. Forecast draws no better/worse tint, so the two never
  meet on one page.
- Better/worse tints use one level per direction. Steps by size of change would need thresholds
  nobody has ruled.
- Run start and Run activity each stack two frames of one flow in a single file.
- Deliverables is not built yet; its mockup follows
  `docs/rulings/2026-11-25-deliverables-and-recommendations.md`, and the tile titles are illustrative.
