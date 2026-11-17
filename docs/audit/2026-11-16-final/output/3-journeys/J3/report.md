# J3 report: portfolio manager, reading a finished run

Run 2026-11-17 07:24 to about 08:10 UTC by one stage 3 worker against proof.serve on port 8763, Chromium headless shell build 1243, every host but loopback blocked (R8). No paid call (R4).

## Could the journey be completed?
Yes, except Changes could be read only in its empty state. A portfolio manager can open the library, open the finished synthetic run, read Overview, follow a finding to its module, trace a figure to Evidence and return, read Forecast with both cases and the Downside module, and read Changes. Each step is one click and under 2 s. Changes says "No earlier run to compare. This is the first listed run for this issuer on this pathway." A second run for the same issuer, which would fill Changes, fails at the launcher in the proof ("launcher exited 2; see logs/<id>.log", J3-002), so a real comparison could not be read. Layout only was seen through a browser-rewritten fixture (shape copied from web/scripts/connected-proof.mjs), labelled as such and used for no finding. R8 held on every screen: 0 blocked requests, 0 failed requests, 0 console errors, 0 HTTP errors.

## Findings
22: High 0, Medium 7, Low 13, Info 2.
J3-001 Medium  Back from Evidence does not return the reader to the traced figure
J3-002 Medium  Second run fails with an exit code and an unserved log path; Changes cannot be filled in the proof
J3-003 Medium  Overview headline figure cards have no trace control
J3-004 Medium  Evidence > Gaps says no gaps while pages state what was not supplied
J3-005 Medium  Forecast notes show module codes, "Python" and shorthand outside Evidence
J3-006 Medium  Forecast and Downside starting values do not tie to Overview and Financial foundation
J3-007 Medium  Evidence > Trace with no item chosen shows the download list and no guidance
J3-008 to J3-020 Low  Overview counts and attribution, unlabelled rail icons, unnamed "cover" measure, calendar vocabulary, Script checks unexplained, raw json fence, naming drift (Downside shock/case, Report/history), confidence score without scale, number formats, page titles, "Show sources" wording, inconsistent handoff row link
J3-021, J3-022 Info  Proof traces never reach an uploaded file; proof.serve refuses a non-empty root

## Control matrix comparison
What the reader could decide matched the matrix: issuer and run (CT-043), module (CT-044), forecast case (CT-045, cards, charts and tables followed together), Evidence filter and tab (CT-046), trace drawer (CT-047, focus returns to the opener on Escape and Close; the Overview figure cards are the exception, J3-003), downloads (CT-048, all answered 200). The reader cannot see which earlier run Changes compares with; CT-028 is decided at run start.

## Deviations from the brief
- proof.serve refuses a root that holds files (proof/serve.py:17-18), so run state did not persist; each segment emptied /tmp/jr/j3 and re-ran the 14-module synthetic run first.
- A first Back measurement was disturbed by enlarging the window for a full-page screenshot; it was discarded and repeated at 1440 x 900.
- Nothing of mine listens on port 8763.

Not verified: Changes with a real comparison (CP-8 handoff, Cards and Table views, verdicts on a run from the real launcher) because the proof cannot produce a second run; the journey on a live run (all prose is canned proof text); a trace that reaches an uploaded source file (the proof's handoffs cite annual.txt, J3-021); the original HTML Model download (unavailable for the proof run); 390 px windows, keyboard-only use and a screen reader (J5 and stage 2); a failed or gap-bearing module, two issuers and a very long issuer name (J5); the static app and the work-PC journey (stage 7); Chrome and Edge on Windows; Back and Forward on every route (measured only from Forecast, Financial foundation and Overview).
