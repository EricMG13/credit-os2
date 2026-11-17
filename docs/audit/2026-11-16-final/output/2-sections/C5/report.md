# C5 section audit: report Evidence, trace drawer, Record, downloads

Main `2b881075`. Read-only; no application file was changed.

## How it was run
- `proof.serve --root /tmp/cs-C5/root --port 8735` (synthetic; no paid call, no `--live`). One finished run, `20261117-072535-01`, with 14 modules, 3 source files and the executed agreement chosen.
- `proof/launcher.py:101` refuses a second run ("synthetic proof requires a first Credit Snapshot run"). So the service cannot produce a CP-8 comparison, gap rows or a drawer source link. Those states were reached by rewriting the loopback service's JSON in the browser (Playwright `route.fulfill`), never by editing application code.
- Playwright 1.62.1, Chromium headless shell 1243, at 1440 and 390 px. Every non-loopback host was aborted. Across all probes there were 0 blocked requests, 0 page errors, and no console error except the 500 replies the state probes injected (R8 met).

## Coverage against the inventory (1,772 lines)

| Group | Inventory | Exercised |
| :--- | ---: | :--- |
| Trace drawers (Overview 28, Modules 24, 14 module pages, Forecast 23, Calendar 36) | 250 | 250, plus 15 in closed disclosures (265); 78 of 78 again at 390 px. Mouse open, focus in, Escape, X, footer Close, Enter and Space reopen, "Open in Evidence", Back. 0 failures except the keyboard focus after "Open in Evidence" (C5-034). |
| Drawer Close buttons / "Open in Evidence" links | 500 / 250 | all, plus the extra 15 drawers |
| Drawer disclosure (details + summary) | 500 | present in all; toggled by mouse, Enter and Space on 3 representatives |
| Evidence tab links, Module select, Show sources switch | 48, 8, 8 | all; select by every option on every tab and by ArrowDown |
| Handoff names, downloads (14 + zip + 3), source links | 14, 18, 3 | all; bytes equal the delivered files; source links clicked |
| Script checks / Record disclosures, instruction links | 14 + 15, 14 | all, by mouse, Enter and Space; the 14 instruction files match their recorded hashes |
| Shared header and report-nav links | 64 | not followed one by one (C1/C3) |

States covered: full, empty, error, loading (6 s delay), partial, missing versus zero, very long text, 390 px. Rubric applied rule by rule. axe-core ran on 9 Evidence screens at both widths and on an open drawer; contrast, name and role rules pass.

## What passed
- All 265 drawers wire correctly.
- Tab, module and address agree on every combination; a bad evidence token shows the "Evidence link unavailable" alert.
- All 14 handoffs, the zip and 3 artifacts equal the delivered bytes.
- 585 of 585 handoff-view table rows equal the Markdown. The one dropped column, CP-2A "Escalation Consequence", is the intended removal of text for another module.
- Source hashes equal `sha256sum`; Record elapsed (3 s), cap (USD 25) and spend agree with `identity.json`.
- No `report.html`, workbook export or routing text on Evidence.

## Harmony
90 content rows: 14 shown as required, 57 shown but in the wrong place or form (registers, confidence inputs and downloads that the matrix puts on Record are drawn on Trace and Summary), 5 correctly not shown, 2 missing (CM-092, CM-209), 12 not verified. Control rows: 4 of 6 shown as required, 1 shown but wrong place, 1 correctly not shown.

## Findings (39): 1 High, 12 Medium, 20 Low, 6 Info
See `findings.jsonl`. C5-032 is the finding against stage 0 (the inventory misses 15 hidden trace controls, the 14 whole-handoff views, line-level views and two link types).

## Not reached
CP-8 comparison and regression ledger (only an injected earlier run), a drawer source link or excerpt, real gap and calculation registers, CP-1B/1C/1D/3D, live mode, preview, Edge, screen readers, reduced motion, print.

Not verified: behaviour with live provider data (real handoffs, real gap and calculation registers, page excerpts and source page links, a CP-8 comparison and regression ledger, modules CP-1B/1C/1D/3D, web-research sources); the right severity of C5-001 and C5-005 under the owner's reading of the schema; whether the one missed `download` event per rapid-click pass was Playwright timing (isolated re-clicks all worked, curl is clean); screen-reader announcements; Edge on Windows (the ArrowDown behaviour of C5-006 was seen in headless Chromium only); the shared header and tab links beyond the Report-to-Evidence path (C1/C3); the CM-051 comparison-note reason with real data.
