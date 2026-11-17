# J5: reader, edge cases (stage 3)

Person: a portfolio manager or committee member (the reader), and the analyst who has to get a run in
front of them. Date 2026-11-17, branch `audit/out-journeys`, `proof.serve` (synthetic: canned
handoffs, no provider call, no spend, R4) on port 8765, one fresh empty root per segment under
`/tmp/jr/j5/`, Chromium headless shell build 1243 with every host but loopback blocked (R8). Every
segment started the service, drove the browser and killed the service's process group in a `finally`.
Every completed run used `proof/northbridge-credit-agreement.txt` chosen as the executed agreement.

R8 result: 0 blocked requests, 0 failed requests and 0 page errors in every segment (the probe outputs
in `evidence/` end with `R8 blocked requests: 0`). The only console error was the 404 that the report
address of a run without a report causes (J5-007).

## How each case was produced through the screen

| Case | What the screen let me do | How |
| :--- | :--- | :--- |
| No earlier run | A first run of an issuer | Start a run, Northbridge Synthetic Group, 2025-03-31, Full credit assessment, Submit; open Changes |
| Earlier run listed later | A second run of the same issuer dated a year earlier (the proof refuses a second run when the review sheet names a prior, J3-002) | Same issuer, as-of 2024-03-31, submitted after the 2025 run, so no earlier run existed for it |
| A module failed | A run that stops at Legal & covenants | Filing only, no agreement chosen, the Will refuse limit accepted (J1-002 is the same route) |
| A module returned a gap | The canned handoffs' own 'Not supplied' cells; a run with no workbook and no quotes, whose review sheet lists a Gap and two Checks | Filing and agreement only; read Financial foundation, Committee decision, Evidence Gaps |
| Two issuers | Different names in one session | 'Northbridge Synthetic Group', 'Aldermoor Industries plc', 'Goodco', 'Badco', and two long names |
| Very long issuer name | 184 characters, and two names with the same first 40 characters | Typed in Issuer name |
| 390 px | Every page I could reach, with the 390-wide viewport | `setViewportSize`/launch width 390 |
| Keyboard only | Start page to finished report | `page.keyboard` only (Tab, Enter, Space, typing); the file picker is the OS dialog, answered with `filechooser.setFiles` |

Not produced: a blocked or 'Not assessable' module, a capped run, and a module left out (refused at Submit, J1-001).
The proof's handoffs are canned (`proof/handoffs/`), so report text never depends on the issuer or the inputs (J5-011).

## Segment A: first run, Changes with nothing to compare

| Step | Wanted | Screen offered | Did | Happened | Time to the next step |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A1 | Start a run | Library home with a 'Start a run' button, left rail | Clicked it | /start, four steps (Documents, Purpose, More context, Review and start) | at once |
| A2 | Give the issuer and files | Issuer name, Issuer ID (auto), As-of date, Your name; Choose files | Filled, uploaded the three proof files, Inspect documents | 'northbridge-filing.txt unrecognised', workbook 'unrecognised', agreement 'credit agreement, executed, found on page 1' | 2 s |
| A3 | Choose the purpose | Eight pathways, Full credit assessment selected | Continue to context | The agreement and workbook are chosen on this step, not before; the agreement is detected but not pre-chosen | needed to know to pick them |
| A4 | Review, approve, submit | Limits to decide (accept boxes), approval checkbox, Submit run, dialog 'Start a synthetic test?' ('spends USD 0.00') | Accepted limits, approved, started | /run/<id>, 14 of 14 modules in 3 s | 2.3 s from Documents to a running page |
| A5 | Open the report | 'Open report' on the run page | Clicked | Report in about 6.6 s after Submit | |
| A6 | See what changed | Changes tab | Opened | Designed empty state: 'No earlier run to compare. This is the first listed run for this issuer on this pathway.' and 'Open the Overview'. Works at 390 px. | at once |

## Segment B: two issuers and a run listed later

Runs: Northbridge 2025-03-31, Aldermoor Industries plc 2025-06-30, Northbridge 2024-03-31.

- Library home: two cards (Aldermoor first, Northbridge '2 runs'). Search 'north' kept one, 'zzz' gave the 'No issuers match these filters.' state. The case choice on Forecast and the 'Show sources' switch did not leak from one issuer to the other. 'Carry over from latest run' on the start page took the run of the typed issuer (Northbridge), not the newest run overall.
- The two cards show identical leverage, coverage, revenue and cash (canned handoffs): J5-011.
- Northbridge's 2025 run: Changes says first listed run, while Report history lists a 2024 run (J5-005).
- Run activity (`/runs`) counted 0 ended runs after three finished ones (J1-008, not re-registered).
- Two names with the same first 40 characters: one Issuer ID, one card (J5-004).

## Segment C: a module failed, or returned a gap

- Filing only, no agreement, limits accepted: the run ends Failed, 4 of 14 modules, reason 'stopped: checker' (J1-002). New here: the refused module reads 'Interrupted', three 'Module draft rejected.' events carry no reason, and no sentence on the page says why or what to change (J5-001). 'Start from this run' leads to a form with today's date and no name (J1-015). The library lists no card for the issuer (the failed run is on Run activity only, J1-008), and its report address says 'The published report could not be loaded.' (J5-007).
- No workbook, no quotes: the run finishes 14 of 14 and the review sheet's Gap and Checks (all accepted) are not recorded in the report; Evidence > Gaps says 'This run lists no gaps.' (J5-010; the Gaps tab itself is J3-004).
- A missing value in a finished run: the Financial foundation chart draws FY2027 as 'n.a.' with no bar and the table view reads 'Not supplied: the schedule stops here'. That follows rubric D-14. No finding.

## Segment D: very long issuer name (184 characters)

The field accepts it; the Issuer ID is auto-cut to 40 characters 'northbridge-synthetic-group-internationa' (mid-word). The name wraps in full on the review sheet, run page, Library card and List row, report header and Run activity, at 1440 px and at 390 px, with no clipping. At 390 px the header takes 504 of 844 px (J5-006). The cut ID is what makes two names collide (J5-004). The browser title is 207 characters.

## Segment E: 390 px window

| Page | Result |
| :--- | :--- |
| Library (cards, empty, list), start page all four steps incl. Advanced rows, Submit dialog, run page, Run activity, report Overview, Changes, Modules, Forecast, Evidence tabs, calendar, trace drawer | No page scrolls sideways (scrollWidth 390 everywhere); bottom bar 'Library / Run' replaces the rail; drawer fits and Escape returns focus to the trace control; Submit and dialog reachable |
| Library List, Run activity table, CP-6 and Forecast tables, CP-2A 'Metric' | Cut off without a cue; four wrappers not focusable (J5-002). Other 29 wide tables/graphs are labelled focusable regions |
| Report history | Card, band and tab bar 6 px past the window (J5-008) |
| Calendar and Decision and watch | 14 px markers, 2 px apart (J5-009) |

## Segment F: keyboard only, start to finish

Tab stops counted from a fresh load. Focus was read at every step (tag, name, ring).

| Step | Tab stops | Focus afterwards |
| :--- | :--- | :--- |
| Library to 'Start a run', Enter | 4 (Skip, Library, Run, Start a run) | body; next Tab 'Skip to content' (J5-003) |
| to 'Choose files', Enter (file chooser) | 5 | 'Choose files' |
| to 'Inspect documents', Enter | 2 | 'Inspect documents' |
| Issuer name (typed), Issuer ID, As-of (typed 03312025), Your name (typed) | 4, 2, 3 | fields keep a ring; the date's picker button shows none (native control, not registered) |
| 'Continue to purpose', Enter | 2 | heading 'Purpose' (focus moved by the page) |
| Purpose: Full selected; Continue to context | 6 | heading 'More context' |
| Legal documents (typed 'Executed'), The agreement, Portfolio workbook; Review run | 12, 1, 1, 7 | heading 'Review and start' |
| Limit boxes (Space), approval (Space), Submit run, Enter | 6, then 1 each; 2; 1 | dialog; Tab cycles Cancel, Start synthetic run; Escape returns to 'Submit run' |
| Start synthetic run | 2 | body on /run/<id> |
| 'Open report', Enter | 5 | body on /report/<id> |
| Report: skip link, Enter | 1 | main (works) |
| to first trace control | 14 | drawer: focus enters the dialog, Tab stays inside, Escape returns to the trace control |
| 'Open in Evidence' then Back | | body both times |

The journey is completable by keyboard. One failure: focus is dropped to the body on each route change (J5-003). No keyboard trap was found; the radio group (forecast case) moves with arrow keys.

## What the reader could decide, against the control matrix

| Row | Decision | What the screen let me do |
| :--- | :--- | :--- |
| CT-001, CT-002 | Issuer name and ID | Both editable; the ID was cut silently and collided (J5-004) |
| CT-007 | Which file is the agreement | Required for the run to succeed, not pre-chosen though detected; failing it gives J5-001 |
| CT-028 | Earlier run for Changes | Review sheet says 'first run of this pathway' correctly; Changes says first listed run although a later-listed earlier run exists (J5-005) |
| CT-030, CT-031 | Accept limits, approve | Worked by mouse and keyboard; accepted limits then vanish from the report (J5-010) |
| CT-035, CT-036, CT-038 | States, retry, resume | 'Interrupted' reused for a refused module; no reason, no resume control (J5-001; resume is J2) |
| CT-043, CT-044 | Choose issuer and module | Cards, list, search, module picker worked at 1440 px and 390 px |
| CT-047 | Trace drawer focus | Opens, traps, returns focus on Escape; not restored after 'Open in Evidence' and Back (J5-003) |

## Harness note

A first exploration piped the Node script through `head`; the pipe closed, the script died before its `finally`, and the service stayed up long enough to refill the next root, so the next start was refused (J1-019, J3-022). The helper `probes/_j5lib.cjs` now stops any leftover service of this port before it empties its root. After every segment `pgrep -af "port 8765"` showed nothing.
