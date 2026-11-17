# J5: reader, edge cases: report

Could the journey be completed: yes, to the extent the synthetic proof allows. Each of the six cases was
reached through the screen in `proof.serve` (port 8765, a fresh empty root per segment, Chromium headless
shell with every host but loopback blocked, no paid call). The record is `journey.md`; how each case was
produced is its first table.

| Case | Reached | Result |
| :--- | :--- | :--- |
| No earlier run | Yes | Designed empty state on Changes, works at 1440 px and 390 px. A later-listed earlier run makes its sentence contradict Report history (J5-005) |
| A module failed | Yes (Legal & covenants, by accepting the Will refuse limit) | The page gives no reason and calls the module Interrupted (J5-001) |
| A module returned a gap | Partly: canned 'Not supplied' cells and a run with no workbook or quotes | Missing is drawn 'n.a.', never zero (D-14); the limits the analyst accepted are not in the report (J5-010) |
| Two issuers | Yes, in one session | Cards, search, history and state behave per issuer; the proof's content is identical for both (J5-011); two long names collide on one ID (J5-004) |
| Very long issuer name | Yes (184 characters) | Wraps in full everywhere; ID cut mid-word (J5-004); first screen at 390 px (J5-006) |
| 390 px window | Yes, every page I could reach | No page scrolls sideways; six tables are cut off with no cue (J5-002); one page 6 px wide (J5-008); 14 px targets (J5-009) |
| Keyboard only | Yes, from the empty library to a finished report and its trace drawer | Completable; focus drops to the body at every route change (J5-003) |

Findings: 11 (High 0, Medium 4, Low 4, Info 3). R8: no blocked request, no failed request and no page
error in any segment. Medium findings carry a probe in `probes/` (`j5-001`, `j5-002`/`j5-002b`, `j5-003`,
`j5-004`); the Low and Info ones share `j5-low-checks.cjs` and `j5-010-accepted-limits.cjs`. Every probe
starts and stops its own service on port 8765 with an empty root under `/tmp/jr/j5/` and runs as
`timeout 600 node <path>` from the repository root.

Already registered and not repeated: J1-001, J1-002, J1-003, J1-008, J1-015, J3-002, J3-004, J1-019, J3-022
(each is cited in `journey.md` where this journey met it).

Not verified: a blocked or 'Not assessable' module, a capped run, an interrupted run and a module left out (refused at Submit, J1-001), none of which the proof can produce; any real module output, since the canned handoffs ignore the issuer and the inputs; a second run of one issuer that names a prior (fails at the launcher, J3-002) and any pathway but Full (J1-003); two runs in progress at once; touch gestures on a real 390 px device and horizontal swipe on the cut-off tables; a screen reader (the focus finding rests on `document.activeElement`); the operating system's file picker (answered with `filechooser.setFiles`); the date input's native picker focus ring; 200 percent text size and 400 percent zoom; Chrome and Edge on Windows and the work PC; the static app (J6).
