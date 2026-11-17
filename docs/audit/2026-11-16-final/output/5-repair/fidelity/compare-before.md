# Handoff comparison: before

Capture tree 1a68d2d4 (audit/final-coordination), web/dist 31eeb9c32aa8; rules version 1; made by `compare.mjs`. Sources: connected screens against `proof/handoffs/*.md` and the run request; static screens against `web/fixtures/library.json` and `model.json`. Rules: README.md, "Comparison".

## Counts per surface and class

| Surface | Screens | Items | matches source | derived | not found in source | source has it, screen differs | Source items not on screen |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| connected | 29 | 3444 | 1724 | 1720 | 0 | 0 | 391 |
| static | 89 | 2374 | 2349 | 25 | 0 | 0 | 5 |
| **Total** | 118 | 5818 | 4073 | 1745 | 0 | 0 | 396 |

## Counts per surface, kind and class

| Surface | Kind | Items | matches source | derived | not found in source | source has it, screen differs |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| connected | drawer | 445 | 421 | 24 | 0 | 0 |
| connected | figure | 2689 | 1213 | 1476 | 0 | 0 |
| connected | limitation | 228 | 68 | 160 | 0 | 0 |
| connected | source | 82 | 22 | 60 | 0 | 0 |
| static | drawer | 235 | 235 | 0 | 0 | 0 |
| static | figure | 1712 | 1691 | 21 | 0 | 0 |
| static | limitation | 353 | 349 | 4 | 0 | 0 |
| static | source | 74 | 74 | 0 | 0 | 0 |

Kinds: figure = a drawn value (page view or a chart's Table view); source = a source line on screen; limitation = a limitation sentence; drawer = what a source drawer states (statement, handoff line, basis).

Source drawers name a "Handoff line N" of the delivered handoff, which has a request-and-sources preamble; the offset from the canned file's line, per module: CP-0 +12, CP-1A +13, CP-2D +15, CP-2E +16, CP-3 +20, CP-3C +18, CP-4 +15, CP-6 +23, CP-DR +14, CP-1 +13, CP-2G +16, CP-2 +16, CP-2A +15, CP-5 +24.

## source has it, screen differs (0)

None.

## Per screen (screens with a difference, a not-found item or an omitted source item)

| Surface | Screen | Items | matches source | derived | not found in source | source has it, screen differs | Omitted |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| connected | modules--CP-0 | 88 | 44 | 44 | 0 | 0 | 25 |
| connected | modules--CP-1 | 196 | 161 | 35 | 0 | 0 | 35 |
| connected | modules--CP-1A | 47 | 37 | 10 | 0 | 0 | 36 |
| connected | modules--CP-2 | 21 | 19 | 2 | 0 | 0 | 21 |
| connected | modules--CP-2A | 71 | 69 | 2 | 0 | 0 | 37 |
| connected | modules--CP-2D | 59 | 45 | 14 | 0 | 0 | 24 |
| connected | modules--CP-2E | 130 | 121 | 9 | 0 | 0 | 39 |
| connected | modules--CP-2G | 12 | 11 | 1 | 0 | 0 | 24 |
| connected | modules--CP-3 | 70 | 62 | 8 | 0 | 0 | 36 |
| connected | modules--CP-3C | 59 | 45 | 14 | 0 | 0 | 22 |
| connected | modules--CP-4 | 64 | 54 | 10 | 0 | 0 | 25 |
| connected | modules--CP-5 | 15 | 13 | 2 | 0 | 0 | 21 |
| connected | modules--CP-6 | 68 | 60 | 8 | 0 | 0 | 22 |
| connected | modules--CP-DR | 36 | 28 | 8 | 0 | 0 | 24 |
| static | library--brevane-marine--r-0412--overview | 9 | 9 | 0 | 0 | 0 | 1 |
| static | library--halden-aerostructures--2025-09-30--overview | 28 | 28 | 0 | 0 | 0 | 1 |
| static | library--halden-aerostructures--2026-03-31--overview | 31 | 31 | 0 | 0 | 0 | 1 |
| static | library--halden-aerostructures--2026-09-30--modules--capital-structure | 180 | 180 | 0 | 0 | 0 | 1 |
| static | library--halden-aerostructures--2026-09-30--overview | 111 | 111 | 0 | 0 | 0 | 1 |

99 further screens have only "matches source" and "derived" items and no omitted source item.

## Derived items, by computation

| Surface | Computation | Items | Recomputed here | Where it is computed |
| --- | --- | ---: | --- | --- |
| connected | forecast model output | 738 | no (named only) | src/deploy_workflow/owners/cpos_forecast.py and the model files the service publishes (forecast_exact.json, calculation.json); not in a handoff and not recomputed here |
| connected | script checks | 468 | no (named only) | the service's checks over the module handoffs (src/deploy_workflow/owners/cpos_*check*); not a handoff value and not recomputed here |
| connected | chart value-axis ticks, checked here: evenly spaced at a round step (1, 2, 2.5 or 5 times a power of ten) | 217 | yes | web/src/pages/connected/visuals/visualData.ts ticks (value-axis ticks at round numbers) |
| connected | run record | 66 | no (named only) | the service's record of requests, files and spend for the run; not a handoff value |
| connected | digest of a delivered handoff or record | 53 | no (named only) | the service's record; the delivered handoff text (with its request and sources preamble) is not kept in this repository, so the digest is not recomputed |
| connected | event year group, checked here against the Events tables' dates | 53 | yes | web/src/pages/connected/visuals/EventLane.tsx and report/Calendar.tsx (events grouped by status and by year of the event date) |
| connected | page wording | 40 | no (named only) | label drawn by the page (heading, control, state word, module name); not a source sentence |
| connected | event counts by status, recounted here from the Events tables | 33 | yes | web/src/pages/connected/visuals/EventLane.tsx and report/Calendar.tsx (events grouped by status and by year of the event date) |
| connected | run counts and file identities | 20 | no (named only) | web/src/pages/connected/report/Evidence.tsx over the run's own record (counts of modules, script checks, source files) |
| connected | confidence score | 15 | yes | src/deploy_workflow/confidence.py score (weights, gate and penalties as documented there), recomputed here from the handoff's Confidence inputs table |
| connected | chart text with no data attribute: an axis tick that is not evenly spaced, or a node count (named only) | 7 | no (named only) | web/src/pages/connected/visuals/visualData.ts ticks (value-axis ticks at round numbers) |
| connected | year-on-year change = latest period - period a year earlier, exact decimal, recomputed here from the CP-1 chart table | 5 | yes | src/deploy_workflow/credit_os_catalogue.py handoff_metrics, prior_metric, _exact_change (latest row of the CP-1 chart table, change against the row a year earlier); web/src/pages/connected/report/YearChange.tsx, HeadlineFigures.tsx |
| connected | event status word, checked here against the Events tables' Status column | 4 | yes | web/src/pages/connected/visuals/EventLane.tsx and report/Calendar.tsx (events grouped by status and by year of the event date) |
| connected | page wording with a digit | 1 | no (named only) | a label or legend drawn by the page; not a source value |
| static | page wording with a digit | 23 | no (named only) | a label or legend drawn by the page; not a source value |
| static | page wording | 2 | no (named only) | label drawn by the page (heading, control, state word, module name); not a source sentence |

## Source items a screen should show and does not

Bottom line, Key findings, Contrary evidence and Limitations lines of a handoff not drawn on its module's screen: 0. Chart-data rows not fully shown: 11. Basis lines under a paragraph neither drawn nor in a source drawer: 0. The chart-data rows and any such lines are listed below.

| Surface | Module or screen | chart data rows | confidence inputs rows | events rows | map rows | module body | other prose lines | overview | register rows | table rows |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| connected | CP-0 |  | 14 | 4 |  |  |  |  | 5 | 2 |
| connected | CP-1 |  | 14 |  |  |  |  |  | 6 | 15 |
| connected | CP-1A |  | 14 | 4 | 2 |  |  |  | 14 | 2 |
| connected | CP-2 |  | 14 |  | 1 |  |  |  | 2 | 4 |
| connected | CP-2A |  | 14 |  | 1 |  | 3 |  | 7 | 12 |
| connected | CP-2D | 4 | 14 | 4 |  |  |  |  |  | 2 |
| connected | CP-2E |  | 14 | 3 |  |  |  |  | 10 | 12 |
| connected | CP-2G |  | 14 |  |  |  | 2 |  | 6 | 2 |
| connected | CP-3 |  | 14 | 4 |  |  |  |  | 11 | 7 |
| connected | CP-3C | 2 | 14 | 4 |  |  |  |  |  | 2 |
| connected | CP-4 | 3 | 14 | 4 | 2 |  |  |  |  | 2 |
| connected | CP-5 |  | 14 |  | 1 |  |  |  | 4 | 2 |
| connected | CP-6 | 2 | 14 | 4 |  |  |  |  |  | 2 |
| connected | CP-DR |  | 14 | 4 |  |  |  |  | 4 | 2 |
| static | library--halden-aerostructures--2026-09-30--overview |  |  |  |  |  |  | 1 |  |  |
| static | library--halden-aerostructures--2026-09-30--modules--capital-structure |  |  |  |  | 1 |  |  |  |  |
| static | library--halden-aerostructures--2026-03-31--overview |  |  |  |  |  |  | 1 |  |  |
| static | library--halden-aerostructures--2025-09-30--overview |  |  |  |  |  |  | 1 |  |  |
| static | library--brevane-marine--r-0412--overview |  |  |  |  |  |  | 1 |  |  |

By verdict: some cells not drawn 38; basis not shown 64; row not drawn 284; not drawn 10. A "table row" is a handoff table row; "row not drawn" means its first cell is on no part of the module's screen, "basis not shown" means the row is drawn but its Basis or Source cell is neither drawn nor in a source drawer.

- CP-2D, table row (chart data), proof/handoffs/CP-2D.md:24: Opening accessible liquidity | 900 | US$m | Synthetic. (basis not shown)
- CP-2D, table row (chart data), proof/handoffs/CP-2D.md:25: Free cash flow | 120 | US$m | Synthetic. (basis not shown)
- CP-2D, table row (chart data), proof/handoffs/CP-2D.md:26: Debt repayment | -450 | US$m | Synthetic. (basis not shown)
- CP-2D, table row (chart data), proof/handoffs/CP-2D.md:27: Closing accessible liquidity | 570 | US$m | Synthetic. (basis not shown)
- CP-3C, table row (chart data), proof/handoffs/CP-3C.md:24: FY2026 | 500 | 300 | US$m | Synthetic. (basis not shown)
- CP-3C, table row (chart data), proof/handoffs/CP-3C.md:25: FY2027 | 1,250 | Not supplied: no commitment is stated | US$m | Synthetic. (basis not shown)
- CP-4, table row (chart data), proof/handoffs/CP-4.md:30: Net leverage | 5.0 | 4.2 | 0.8x | Passes at or below | x | Synthetic. (basis not shown)
- CP-4, table row (chart data), proof/handoffs/CP-4.md:31: Interest cover | 2.0 | 2.6 | 0.6x | Passes at or above | x | Synthetic. (basis not shown)
- CP-4, table row (chart data), proof/handoffs/CP-4.md:32: Minimum liquidity | 100 | Not supplied: not stated | Not supplied: no current | Passes at or above | US$m | Synthetic. (basis not shown)
- CP-6, table row (chart data), proof/handoffs/CP-6.md:28: Max single issuer exposure | 2.37 | 2.40 | 2.50 | % NAV | Synthetic Compliance_Monitor snapshot as of 2025-03-31. Proposal is illustrative. (basis not shown)
- CP-6, table row (chart data), proof/handoffs/CP-6.md:29: Max unrated exposure | 3.73 | Not supplied: no proposal | 5.00 | % NAV | Synthetic Compliance_Monitor snapshot as of 2025-03-31. (basis not shown)

The full list, with source location, the cells not drawn and where else the text is drawn, is `omissions` in the JSON file.

Not verified: see README.md, "Comparison", end of section.
