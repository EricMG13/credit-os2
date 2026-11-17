# J6 report: static library reader (opens `web/dist/index.html` from disk, no service)

Run 2026-11-17 08:04 to about 08:45 UTC by one Sonnet worker. No service was started, no paid call was made (R4), nothing outside this folder and `/tmp/jr/j6-scratch/` was written. Chromium headless shell build 1243, every host but `file:`, `data:`, `blob:` and loopback blocked (R8). Details are in `journey.md`.

## Could the journey be completed?

No on the shipped build, and the reason is already carried by stage 0: `web/dist/data.js` is empty (`issuers: []`), so the static app shows only empty states, and the one fully drawn page is the Kit page. Every address the route table names drew without a blocked request, a console message or a page error (45 typed addresses, each loaded fresh and as a hash change). Back and Forward returned the right screen at every step. Nothing could be read, traced, compared or started, because nothing is in the file.

Yes, with a caveat, on a second pass with the repository's own populated fixture swapped into a copy of `web/dist` (`web/scripts/fixture-data.mjs` from `web/fixtures/*.json`, written to the scratch folder; `web/dist` untouched). On that copy a reader could click from the Library home to 79 screens (every Halden Aerostructures page, four history pages, five Model pages), type 64 addresses, and use Back and Forward. Findings marked "fixture" come from that pass and say so in `screen`; the fixture is synthetic and is not an issuer run.

## R8 result

0 requests to another host and 0 anything-failed-to-draw events on the shipped build and on the fixture copy. The only failed requests were the two `downloads/...zip` files that J6-001 reports (`file:` requests for files that do not exist). No R8 finding.

## Findings

17 findings: 0 High, 10 Medium, 6 Low, 1 Info. Each Medium finding has a runnable probe under `probes/`.

| Id | Severity | One line |
| :--- | :--- | :--- |
| J6-001 | Medium | Download handoffs and Download all link to a `downloads/` folder that does not ship; the click replaces the app with the browser's error page |
| J6-002 | Medium | Scroll offset leaks between pages and Back and Forward do not restore the place left |
| J6-003 | Medium | Activating a run tab with the keyboard drops focus to the body; 7 Tab presses to reach the next tab |
| J6-004 | Medium | Every Model-page link into the library (23 on one page, each trace control) ends on "No such issuer" (extends the stage 0 carry to the Model group) |
| J6-005 | Medium | "Start a run" and "New run" open another issuer's saved running run |
| J6-006 | Medium | Four home cards show a state, verdict and module count; the issuer page says "No report yet" |
| J6-007 | Medium | Forecast tab says "No forecast for this run" beside a delivered Forecast module |
| J6-008 | Medium | The same 4.6x net leverage is "Reported" on one screen and "adj." on another |
| J6-009 | Medium | No link reaches the Model Forecast page, any Run start page, ten of eleven run-activity states, two library issuers or one run; no list of runs |
| J6-010 | Medium | The static Start step lets the reader confirm a paid-run dialog and draws "Run started" with no request made |
| J6-011 to J6-016 | Low | Same page title everywhere; search lost on Back; three empty-state wordings with no next step; Page not found has no link; trace buttons share names; Halden 30 Jun 2026 disagrees with itself |
| J6-017 | Info | A stray measurement span ("FY21") stays in the body after the Kit page |

## Carried from stage 0, not registered again

- The shipped static `data.js` is empty, so the static app shows only empty states on shipped data.
- Static run-activity pages link to `#/library/transdigm/...`, an issuer the fixture library lacks (J6-004 records that the Model group does the same, which that line does not name).

## Comparison with the control matrix

CT-043 to CT-047 hold where the data exists (search and filters, module navigator, Evidence filter and tabs, trace drawer with focus returned to the opener on Esc), except that the choice is lost on Back (J6-012). CT-048 (downloads) fails on populated data (J6-001). CT-029, CT-031 and CT-032 (summary, approval, Submit): the static Start step has no approval step and claims a run started (J6-010). CT-037 and CT-038 (retry, resume): no control anywhere in the static app, as the matrix says. A reader decides nothing the matrix does not allow.

## Checked and found sound

Skip link; Esc closing the trace drawer with focus back on the opener; unknown run, module, trace item and gap item addresses; a data file that is missing or from a newer schema; a folder path with spaces and `#`; hash typed fresh and into an open page agree on every address; the rail names appear as a tooltip on mouse hover and keyboard focus (an early Playwright `hover()` showed none, a real pointer move showed the name at once, so no finding).

Not verified: Chrome and Edge on Windows and any browser but Chromium build 1243; a data file produced by the real library writer (no Python code writes `credit-os-data/1`, so only the fixture and the empty file were available); the shipped build on a populated `data.js` other than the fixture; the 390 px window (J5 owns it; one side observation of a 48 px horizontal overflow of `<main>` on the Overview was not registered); Model pages' charts and the Forecast page's case choice beyond drawing; the `Open` register links (`target=_blank`) beyond their href; keyboard-only use start to finish (J5); screen-reader announcements (no assistive technology was run); Signal (out of scope).
