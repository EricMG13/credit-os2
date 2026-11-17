# Stage 0: baseline screenshots

Main under audit: `2b881075`. Taken by the stage 0 probes in `probes/connected/connected-inventory.cjs` and `probes/static/crawl.mjs`, Playwright's Chromium headless shell build 1243, deviceScaleFactor 1, at 1440 and 390 px wide.

Scratch folder (untracked, in the lead's container only; it does not survive the container): `/tmp/claude-0/-home-user-credit-os2/c30ece96-69a4-5792-9f1a-8275df632b0b/scratchpad/stage0/screens/` — 379 connected PNGs in `connected/`, 1,218 static PNGs in `static/`. A later stage that needs a baseline image re-runs the probe; a screenshot is committed only when a finding cites it (README, Outputs).

Static data: the shipped `web/dist/data.js` holds `issuers: []`, so on it every static route shows its empty state. Real screens were taken on a scratch copy of `web/dist` whose `data.js` was written by `web/scripts/fixture-data.mjs` from `web/fixtures/*.json`; file names are prefixed with the data used.

## Connected surface

Folder: `/tmp/claude-0/-home-user-credit-os2/c30ece96-69a4-5792-9f1a-8275df632b0b/scratchpad/stage0/screens/connected/`.
deviceScaleFactor 1. Page shots grow the viewport to the content height (the shell scrolls inside `<main>`, so
`fullPage` alone captured only the viewport); capped at 16,000 px. `--visual-NN-*` files are element shots of each
`<figure>` (and its alternative view after switching its radio). `--trace-drawer` is the first trace drawer opened on
that screen; `--details-open` the first disclosure opened. Running-state shots: run 1 progress page at both widths
and Run activity at 1440 only (the run outran the second width); run 2 both widths (Run activity caught it as Waiting).

States reached: empty (library, run activity, start), error (unknown run id, unknown report, name missing, failed run),
partial (start steps, running/waiting), full (finished run, report pages). Not reached: a loading state screenshot
(the "Loading this page…" / "Loading report…" text is transient), the React "Page not found" page (the service
answers any unknown address with JSON `{"error": "not found"}`; `c1-page-not-found--error` shows Chromium's JSON
viewer for `/report/a%2Fb`, not the app).

| File | Screen | State | Width |
| :--- | :--- | :--- | ---: |
| c1-library--empty--1440.png | `/` | empty | 1440 |
| c1-library--empty--390.png | `/` | empty | 390 |
| c1-library-list-layout--empty--1440.png | `/` | empty | 1440 |
| c1-library-list-layout--empty--390.png | `/` | empty | 390 |
| c1-run-activity--empty--1440.png | `/runs` | empty | 1440 |
| c1-run-activity--empty--390.png | `/runs` | empty | 390 |
| c1-run-progress-unknown-id--error--1440.png | `/run/20000101-000000-01` | error | 1440 |
| c1-run-progress-unknown-id--error--390.png | `/run/20000101-000000-01` | error | 390 |
| c3-report-unknown-folder--error--1440.png | `/report/no-such-run` | error | 1440 |
| c3-report-unknown-folder--error--390.png | `/report/no-such-run` | error | 390 |
| c1-page-not-found--error--1440.png | `/report/a%2Fb` | error | 1440 |
| c1-page-not-found--error--390.png | `/report/a%2Fb` | error | 390 |
| c2-start-1-documents--empty--1440.png | `/start` | empty | 1440 |
| c2-start-1-documents--empty--390.png | `/start` | empty | 390 |
| c2-start-1-documents-added--partial--1440.png | `/start` | partial | 1440 |
| c2-start-1-documents-added--partial--390.png | `/start` | partial | 390 |
| c2-start-1-documents-name-missing--error--1440.png | `/start` | error | 1440 |
| c2-start-1-documents-name-missing--error--390.png | `/start` | error | 390 |
| c2-start-1-documents-inspected--partial--1440.png | `/start` | partial | 1440 |
| c2-start-1-documents-inspected--partial--390.png | `/start` | partial | 390 |
| c2-start-2-purpose--partial--1440.png | `/start` | partial | 1440 |
| c2-start-2-purpose--partial--390.png | `/start` | partial | 390 |
| c2-start-2-purpose-standard--partial--1440.png | `/start` | partial | 1440 |
| c2-start-2-purpose-standard--partial--390.png | `/start` | partial | 390 |
| c2-start-2-purpose-advanced--partial--1440.png | `/start` | partial | 1440 |
| c2-start-2-purpose-advanced--partial--390.png | `/start` | partial | 390 |
| c2-start-3-context-advanced--partial--1440.png | `/start` | partial | 1440 |
| c2-start-3-context-advanced--partial--390.png | `/start` | partial | 390 |
| c2-start-3-context-advanced--partial--details-open--1440.png | `/start` | partial | 1440 |
| c2-start-3-context-advanced--partial--details-open--390.png | `/start` | partial | 390 |
| c2-start-3-context-rows-added--partial--1440.png | `/start` | partial | 1440 |
| c2-start-3-context-rows-added--partial--390.png | `/start` | partial | 390 |
| c2-start-4-review-undecided--partial--1440.png | `/start` | partial | 1440 |
| c2-start-4-review-undecided--partial--390.png | `/start` | partial | 390 |
| c2-start-4-review-undecided--partial--details-open--1440.png | `/start` | partial | 1440 |
| c2-start-4-review-undecided--partial--details-open--390.png | `/start` | partial | 390 |
| c2-start-4-review-approved--full--1440.png | `/start` | full | 1440 |
| c2-start-4-review-approved--full--390.png | `/start` | full | 390 |
| c2-start-5-submit-dialog--full--1440.png | `/start` | full | 1440 |
| c2-start-5-submit-dialog--full--390.png | `/start` | full | 390 |
| c1-run-progress--running--1440.png | `/run/20261117-041141-01` | partial (running) | 1440 |
| c1-run-activity--running--1440.png | `/runs` | partial (running) | 1440 |
| c1-run-progress--running--390.png | `/run/20261117-041141-01` | partial (running) | 390 |
| c1-run-progress-failed--error--1440.png | `/run/20261117-041141-01` | error | 1440 |
| c1-run-progress-failed--error--390.png | `/run/20261117-041141-01` | error | 390 |
| c3-report-unpublished-run--empty--1440.png | `/report/20261117-041141-01` | empty | 1440 |
| c3-report-unpublished-run--empty--390.png | `/report/20261117-041141-01` | empty | 390 |
| c2-start-4-review-with-agreement--partial--1440.png | `/start` | partial | 1440 |
| c2-start-4-review-with-agreement--partial--390.png | `/start` | partial | 390 |
| c1-run-progress-run2--running--1440.png | `/run/20261117-041223-01` | partial (running) | 1440 |
| c1-run-progress-run2--running--390.png | `/run/20261117-041223-01` | partial (running) | 390 |
| c1-run-activity-run2--running--1440.png | `/runs` | partial (running) | 1440 |
| c1-run-activity-run2--running--390.png | `/runs` | partial (running) | 390 |
| c1-library--full--1440.png | `/` | full | 1440 |
| c1-library--full--390.png | `/` | full | 390 |
| c1-library-list-layout--full--1440.png | `/` | full | 1440 |
| c1-library-list-layout--full--390.png | `/` | full | 390 |
| c1-run-activity--full--1440.png | `/runs` | full | 1440 |
| c1-run-activity--full--390.png | `/runs` | full | 390 |
| c1-run-progress-finished--full--1440.png | `/run/20261117-041223-01` | full | 1440 |
| c1-run-progress-finished--full--390.png | `/run/20261117-041223-01` | full | 390 |
| c2-start-from-run--full--1440.png | `/start?from=20261117-041223-01` | full | 1440 |
| c2-start-from-run--full--390.png | `/start?from=20261117-041223-01` | full | 390 |
| c3-report-overview--full--1440.png | `/report/20261117-041223-01#overview` | full | 1440 |
| c3-report-overview--full--390.png | `/report/20261117-041223-01#overview` | full | 390 |
| c3-report-overview--full--trace-drawer--1440.png | `/report/20261117-041223-01#overview` | full | 1440 |
| c3-report-overview--full--trace-drawer--390.png | `/report/20261117-041223-01#overview` | full | 390 |
| c3-report-overview-sources-on--full--1440.png | `/report/20261117-041223-01#overview` | full | 1440 |
| c3-report-overview-sources-on--full--390.png | `/report/20261117-041223-01#overview` | full | 390 |
| c3-report-changes--full--1440.png | `/report/20261117-041223-01#changes` | full | 1440 |
| c3-report-changes--full--390.png | `/report/20261117-041223-01#changes` | full | 390 |
| c3-report-modules--full--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--trace-drawer--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-00-us-m--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-00-us-m--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-00--view--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-01-x--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-01-x--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-01--view--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-02-x--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-02-x--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-02--view--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-02--view--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-03-us-m--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-03-us-m--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-03--view--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-03--view--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-04-us-m--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-04-us-m--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-04--view--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-04--view--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-05-us-m--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-05-us-m--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-05--view--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-05--view--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-06-us-m--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-06-us-m--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-modules--full--visual-06--view--1440.png | `/report/20261117-041223-01#modules` | full | 1440 |
| c3-report-modules--full--visual-06--view--390.png | `/report/20261117-041223-01#modules` | full | 390 |
| c3-report-module-CP-0--full--1440.png | `/report/20261117-041223-01#modules/CP-0` | full | 1440 |
| c3-report-module-CP-0--full--390.png | `/report/20261117-041223-01#modules/CP-0` | full | 390 |
| c3-report-module-CP-0--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-0` | full | 1440 |
| c3-report-module-CP-0--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-0` | full | 390 |
| c3-report-module-CP-0--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-0` | full | 1440 |
| c3-report-module-CP-0--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-0` | full | 390 |
| c3-report-module-CP-0--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-0` | full | 1440 |
| c3-report-module-CP-0--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-0` | full | 390 |
| c3-report-module-CP-1--full--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-00-us-m--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-00-us-m--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-01-x--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-01-x--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-02-x--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-02-x--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-02--view--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-02--view--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-03-us-m--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-03-us-m--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-03--view--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-03--view--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-04-us-m--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-04-us-m--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-04--view--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-04--view--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-05-us-m--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-05-us-m--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-05--view--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-05--view--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-06-us-m--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-06-us-m--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1--full--visual-06--view--1440.png | `/report/20261117-041223-01#modules/CP-1` | full | 1440 |
| c3-report-module-CP-1--full--visual-06--view--390.png | `/report/20261117-041223-01#modules/CP-1` | full | 390 |
| c3-report-module-CP-1A--full--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-1A--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-1A--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-1A--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-1A--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-1A--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-1A--full--visual-02-figure-2--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--visual-02-figure-2--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-1A--full--visual-02--view--1440.png | `/report/20261117-041223-01#modules/CP-1A` | full | 1440 |
| c3-report-module-CP-1A--full--visual-02--view--390.png | `/report/20261117-041223-01#modules/CP-1A` | full | 390 |
| c3-report-module-CP-2--full--1440.png | `/report/20261117-041223-01#modules/CP-2` | full | 1440 |
| c3-report-module-CP-2--full--390.png | `/report/20261117-041223-01#modules/CP-2` | full | 390 |
| c3-report-module-CP-2--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-2` | full | 1440 |
| c3-report-module-CP-2--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-2` | full | 390 |
| c3-report-module-CP-2--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-2` | full | 1440 |
| c3-report-module-CP-2--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-2` | full | 390 |
| c3-report-module-CP-2--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-2` | full | 1440 |
| c3-report-module-CP-2--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-2` | full | 390 |
| c3-report-module-CP-2A--full--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2A--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2A--full--visual-00-each-measure-uses-its-own-scale--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--visual-00-each-measure-uses-its-own-scale--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2A--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2A--full--visual-01-longer-bars-indicate-a-smaller-ebitda-decline-to-t--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--visual-01-longer-bars-indicate-a-smaller-ebitda-decline-to-t--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2A--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2A--full--visual-02-figure-2--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--visual-02-figure-2--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2A--full--visual-02--view--1440.png | `/report/20261117-041223-01#modules/CP-2A` | full | 1440 |
| c3-report-module-CP-2A--full--visual-02--view--390.png | `/report/20261117-041223-01#modules/CP-2A` | full | 390 |
| c3-report-module-CP-2D--full--1440.png | `/report/20261117-041223-01#modules/CP-2D` | full | 1440 |
| c3-report-module-CP-2D--full--390.png | `/report/20261117-041223-01#modules/CP-2D` | full | 390 |
| c3-report-module-CP-2D--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-2D` | full | 1440 |
| c3-report-module-CP-2D--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-2D` | full | 390 |
| c3-report-module-CP-2D--full--visual-00-us-m--1440.png | `/report/20261117-041223-01#modules/CP-2D` | full | 1440 |
| c3-report-module-CP-2D--full--visual-00-us-m--390.png | `/report/20261117-041223-01#modules/CP-2D` | full | 390 |
| c3-report-module-CP-2D--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-2D` | full | 1440 |
| c3-report-module-CP-2D--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-2D` | full | 390 |
| c3-report-module-CP-2D--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#modules/CP-2D` | full | 1440 |
| c3-report-module-CP-2D--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#modules/CP-2D` | full | 390 |
| c3-report-module-CP-2D--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-2D` | full | 1440 |
| c3-report-module-CP-2D--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-2D` | full | 390 |
| c3-report-module-CP-2E--full--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2E--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2E--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2E--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2E--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2E--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2E--full--visual-02-figure-2--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--visual-02-figure-2--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2E--full--visual-02--view--1440.png | `/report/20261117-041223-01#modules/CP-2E` | full | 1440 |
| c3-report-module-CP-2E--full--visual-02--view--390.png | `/report/20261117-041223-01#modules/CP-2E` | full | 390 |
| c3-report-module-CP-2G--full--1440.png | `/report/20261117-041223-01#modules/CP-2G` | full | 1440 |
| c3-report-module-CP-2G--full--390.png | `/report/20261117-041223-01#modules/CP-2G` | full | 390 |
| c3-report-module-CP-2G--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-2G` | full | 1440 |
| c3-report-module-CP-2G--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-2G` | full | 390 |
| c3-report-module-CP-3--full--1440.png | `/report/20261117-041223-01#modules/CP-3` | full | 1440 |
| c3-report-module-CP-3--full--390.png | `/report/20261117-041223-01#modules/CP-3` | full | 390 |
| c3-report-module-CP-3--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-3` | full | 1440 |
| c3-report-module-CP-3--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-3` | full | 390 |
| c3-report-module-CP-3--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-3` | full | 1440 |
| c3-report-module-CP-3--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-3` | full | 390 |
| c3-report-module-CP-3--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-3` | full | 1440 |
| c3-report-module-CP-3--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-3` | full | 390 |
| c3-report-module-CP-3--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#modules/CP-3` | full | 1440 |
| c3-report-module-CP-3--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#modules/CP-3` | full | 390 |
| c3-report-module-CP-3--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-3` | full | 1440 |
| c3-report-module-CP-3--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-3` | full | 390 |
| c3-report-module-CP-3C--full--1440.png | `/report/20261117-041223-01#modules/CP-3C` | full | 1440 |
| c3-report-module-CP-3C--full--390.png | `/report/20261117-041223-01#modules/CP-3C` | full | 390 |
| c3-report-module-CP-3C--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-3C` | full | 1440 |
| c3-report-module-CP-3C--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-3C` | full | 390 |
| c3-report-module-CP-3C--full--visual-00-us-m--1440.png | `/report/20261117-041223-01#modules/CP-3C` | full | 1440 |
| c3-report-module-CP-3C--full--visual-00-us-m--390.png | `/report/20261117-041223-01#modules/CP-3C` | full | 390 |
| c3-report-module-CP-3C--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-3C` | full | 1440 |
| c3-report-module-CP-3C--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-3C` | full | 390 |
| c3-report-module-CP-3C--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#modules/CP-3C` | full | 1440 |
| c3-report-module-CP-3C--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#modules/CP-3C` | full | 390 |
| c3-report-module-CP-3C--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-3C` | full | 1440 |
| c3-report-module-CP-3C--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-3C` | full | 390 |
| c3-report-module-CP-4--full--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-02-figure-2--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-02-figure-2--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-02--view--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-02--view--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-03-figure-3--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-03-figure-3--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-4--full--visual-03--view--1440.png | `/report/20261117-041223-01#modules/CP-4` | full | 1440 |
| c3-report-module-CP-4--full--visual-03--view--390.png | `/report/20261117-041223-01#modules/CP-4` | full | 390 |
| c3-report-module-CP-5--full--1440.png | `/report/20261117-041223-01#modules/CP-5` | full | 1440 |
| c3-report-module-CP-5--full--390.png | `/report/20261117-041223-01#modules/CP-5` | full | 390 |
| c3-report-module-CP-5--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-5` | full | 1440 |
| c3-report-module-CP-5--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-5` | full | 390 |
| c3-report-module-CP-5--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-5` | full | 1440 |
| c3-report-module-CP-5--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-5` | full | 390 |
| c3-report-module-CP-5--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-5` | full | 1440 |
| c3-report-module-CP-5--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-5` | full | 390 |
| c3-report-module-CP-6--full--1440.png | `/report/20261117-041223-01#modules/CP-6` | full | 1440 |
| c3-report-module-CP-6--full--390.png | `/report/20261117-041223-01#modules/CP-6` | full | 390 |
| c3-report-module-CP-6--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-6` | full | 1440 |
| c3-report-module-CP-6--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-6` | full | 390 |
| c3-report-module-CP-6--full--visual-00-current-exposure-and-limits-in-nav-2025-03-31--1440.png | `/report/20261117-041223-01#modules/CP-6` | full | 1440 |
| c3-report-module-CP-6--full--visual-00-current-exposure-and-limits-in-nav-2025-03-31--390.png | `/report/20261117-041223-01#modules/CP-6` | full | 390 |
| c3-report-module-CP-6--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-6` | full | 1440 |
| c3-report-module-CP-6--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-6` | full | 390 |
| c3-report-module-CP-6--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#modules/CP-6` | full | 1440 |
| c3-report-module-CP-6--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#modules/CP-6` | full | 390 |
| c3-report-module-CP-6--full--visual-01--view--1440.png | `/report/20261117-041223-01#modules/CP-6` | full | 1440 |
| c3-report-module-CP-6--full--visual-01--view--390.png | `/report/20261117-041223-01#modules/CP-6` | full | 390 |
| c3-report-module-CP-DR--full--1440.png | `/report/20261117-041223-01#modules/CP-DR` | full | 1440 |
| c3-report-module-CP-DR--full--390.png | `/report/20261117-041223-01#modules/CP-DR` | full | 390 |
| c3-report-module-CP-DR--full--trace-drawer--1440.png | `/report/20261117-041223-01#modules/CP-DR` | full | 1440 |
| c3-report-module-CP-DR--full--trace-drawer--390.png | `/report/20261117-041223-01#modules/CP-DR` | full | 390 |
| c3-report-module-CP-DR--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#modules/CP-DR` | full | 1440 |
| c3-report-module-CP-DR--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#modules/CP-DR` | full | 390 |
| c3-report-module-CP-DR--full--visual-00--view--1440.png | `/report/20261117-041223-01#modules/CP-DR` | full | 1440 |
| c3-report-module-CP-DR--full--visual-00--view--390.png | `/report/20261117-041223-01#modules/CP-DR` | full | 390 |
| c4-report-forecast--full--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--trace-drawer--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--trace-drawer--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-00--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-00--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-01-figure-1--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-01-figure-1--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-01--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-01--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-02-figure-2--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-02-figure-2--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-02--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-02--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-03-figure-3--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-03-figure-3--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-03--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-03--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-04-x--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-04-x--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-04--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-04--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-05-x--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-05-x--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-05--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-05--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-06-us-m--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-06-us-m--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-06--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-06--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-07-us-m--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-07-us-m--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-07--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-07--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-08-us-m--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-08-us-m--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-08--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-08--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-09-us-m--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-09-us-m--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-09--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-09--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-10-us-m--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-10-us-m--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-10--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-10--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-11-us-m--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-11-us-m--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-11--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-11--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-12-us-m--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-12-us-m--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-12--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-12--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-13-figure-13--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-13-figure-13--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-13--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-13--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-14-current-exposure-and-limits-in-nav-2025-03-31--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-14-current-exposure-and-limits-in-nav-2025-03-31--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-forecast--full--visual-14--view--1440.png | `/report/20261117-041223-01#forecast` | full | 1440 |
| c4-report-forecast--full--visual-14--view--390.png | `/report/20261117-041223-01#forecast` | full | 390 |
| c4-report-calendar--full--1440.png | `/report/20261117-041223-01#calendar` | full | 1440 |
| c4-report-calendar--full--390.png | `/report/20261117-041223-01#calendar` | full | 390 |
| c4-report-calendar--full--trace-drawer--1440.png | `/report/20261117-041223-01#calendar` | full | 1440 |
| c4-report-calendar--full--trace-drawer--390.png | `/report/20261117-041223-01#calendar` | full | 390 |
| c4-report-calendar--full--visual-00-figure-0--1440.png | `/report/20261117-041223-01#calendar` | full | 1440 |
| c4-report-calendar--full--visual-00-figure-0--390.png | `/report/20261117-041223-01#calendar` | full | 390 |
| c4-report-calendar--full--visual-00--view--1440.png | `/report/20261117-041223-01#calendar` | full | 1440 |
| c4-report-calendar--full--visual-00--view--390.png | `/report/20261117-041223-01#calendar` | full | 390 |
| c5-report-evidence-summary--full--1440.png | `/report/20261117-041223-01#evidence/summary` | full | 1440 |
| c5-report-evidence-summary--full--390.png | `/report/20261117-041223-01#evidence/summary` | full | 390 |
| c5-report-evidence-trace--full--1440.png | `/report/20261117-041223-01#evidence/trace` | full | 1440 |
| c5-report-evidence-trace--full--390.png | `/report/20261117-041223-01#evidence/trace` | full | 390 |
| c5-report-evidence-sources--full--1440.png | `/report/20261117-041223-01#evidence/sources` | full | 1440 |
| c5-report-evidence-sources--full--390.png | `/report/20261117-041223-01#evidence/sources` | full | 390 |
| c5-report-evidence-gaps--full--1440.png | `/report/20261117-041223-01#evidence/gaps` | full | 1440 |
| c5-report-evidence-gaps--full--390.png | `/report/20261117-041223-01#evidence/gaps` | full | 390 |
| c5-report-evidence-checks--full--1440.png | `/report/20261117-041223-01#evidence/checks` | full | 1440 |
| c5-report-evidence-checks--full--390.png | `/report/20261117-041223-01#evidence/checks` | full | 390 |
| c5-report-evidence-record--full--1440.png | `/report/20261117-041223-01#evidence/record` | full | 1440 |
| c5-report-evidence-record--full--390.png | `/report/20261117-041223-01#evidence/record` | full | 390 |
| c5-report-evidence-record--full--details-open--1440.png | `/report/20261117-041223-01#evidence/record` | full | 1440 |
| c5-report-evidence-record--full--details-open--390.png | `/report/20261117-041223-01#evidence/record` | full | 390 |
| c5-report-evidence-record-cp-1--full--1440.png | `/report/20261117-041223-01#evidence/record/CP-1` | full | 1440 |
| c5-report-evidence-record-cp-1--full--390.png | `/report/20261117-041223-01#evidence/record/CP-1` | full | 390 |
| c5-report-evidence-record-cp-1--full--details-open--1440.png | `/report/20261117-041223-01#evidence/record/CP-1` | full | 1440 |
| c5-report-evidence-record-cp-1--full--details-open--390.png | `/report/20261117-041223-01#evidence/record/CP-1` | full | 390 |
| c5-report-evidence-trace-line--full--1440.png | `/report/20261117-041223-01#evidence/20261117-041223-01%2Fdeliveries%2F6db777d690651e26d1fa6a9706bd571fa0f4fba9` | full | 1440 |
| c5-report-evidence-trace-line--full--390.png | `/report/20261117-041223-01#evidence/20261117-041223-01%2Fdeliveries%2F6db777d690651e26d1fa6a9706bd571fa0f4fba9` | full | 390 |



## Static surface

Folder: /tmp/claude-0/-home-user-credit-os2/c30ece96-69a4-5792-9f1a-8275df632b0b/scratchpad/stage0/screens/static/ (1218 PNG files; deviceScaleFactor 1; full page; viewport 1440x900 and 390x844). File name = <variant>__<address>__<state>__[open-<control>-<n>__ | sources-on__]<width>.png. Every visited screen has a 1440 and a 390 shot; every control that revealed something (or opened a dialog) has a 1440 shot of the opened state; the Show sources switch has 1440 and 390 shots on three screens.

| file | variant | screen | state | width | revealed_by |
| :--- | :--- | :--- | :--- | :--- | :--- |
| shipped__root__empty__1440.png | shipped | #/ | empty | 1440 |  |
| shipped__root__empty__390.png | shipped | #/ | empty | 390 |  |
| shipped__library__empty__1440.png | shipped | #/library | empty | 1440 |  |
| shipped__library__empty__390.png | shipped | #/library | empty | 390 |  |
| shipped__model__empty__1440.png | shipped | #/model | empty | 1440 |  |
| shipped__model__empty__390.png | shipped | #/model | empty | 390 |  |
| shipped__run__empty__1440.png | shipped | #/run | empty | 1440 |  |
| shipped__run__empty__390.png | shipped | #/run | empty | 390 |  |
| shipped__kit__empty__1440.png | shipped | #/kit | empty | 1440 |  |
| shipped__kit__empty__390.png | shipped | #/kit | empty | 390 |  |
| shipped__kit__empty__open-Changes_12-23__1440.png | shipped | #/kit | empty | 1440 | getByRole("tab", { name: "Changes 12", exact: true }) |
| shipped__kit__empty__open-Evidence-24__1440.png | shipped | #/kit | empty | 1440 | getByRole("tab", { name: "Evidence", exact: true }) |
| shipped__kit__empty__open-Modules-27__1440.png | shipped | #/kit | empty | 1440 | getByRole("tab", { name: "Modules", exact: true }) |
| shipped__kit__empty__open-Forecast-28__1440.png | shipped | #/kit | empty | 1440 | getByRole("tab", { name: "Forecast", exact: true }) |
| shipped__kit__empty__open-Select_Update_schedule-38__1440.png | shipped | #/kit | empty | 1440 | getByRole("button", { name: "Select Update schedule", exact: true }) |
| shipped__kit__empty__open-Select_Review_cycle-42__1440.png | shipped | #/kit | empty | 1440 | getByRole("button", { name: "Select Review cycle", exact: true }) |
| shipped__kit__empty__open-Open_drawer-69__1440.png | shipped | #/kit | empty | 1440 | getByRole("button", { name: "Open drawer", exact: true }) |
| shipped__kit__empty__open-Start_run-70__1440.png | shipped | #/kit | empty | 1440 | getByRole("button", { name: "Start run", exact: true }) |
| shipped__kit__empty__open-Rename_issuer-71__1440.png | shipped | #/kit | empty | 1440 | getByRole("button", { name: "Rename issuer", exact: true }) |
| shipped__no-such-page__error__1440.png | shipped | #/no-such-page | error | 1440 |  |
| shipped__no-such-page__error__390.png | shipped | #/no-such-page | error | 390 |  |
| shipped__library_no-such-issuer_history__empty__1440.png | shipped | #/library/no-such-issuer/history | empty | 1440 |  |
| shipped__library_no-such-issuer_history__empty__390.png | shipped | #/library/no-such-issuer/history | empty | 390 |  |
| shipped__library_no-such-issuer_no-run_overview__empty__1440.png | shipped | #/library/no-such-issuer/no-run/overview | empty | 1440 |  |
| shipped__library_no-such-issuer_no-run_overview__empty__390.png | shipped | #/library/no-such-issuer/no-run/overview | empty | 390 |  |
| shipped__model_no-such-issuer_no-run_front__empty__1440.png | shipped | #/model/no-such-issuer/no-run/front | empty | 1440 |  |
| shipped__model_no-such-issuer_no-run_front__empty__390.png | shipped | #/model/no-such-issuer/no-run/front | empty | 390 |  |
| shipped__run_activity_no-such-run__empty__1440.png | shipped | #/run/activity/no-such-run | empty | 1440 |  |
| shipped__run_activity_no-such-run__empty__390.png | shipped | #/run/activity/no-such-run | empty | 390 |  |
| shipped__run_start_no-such-draft__empty__1440.png | shipped | #/run/start/no-such-draft | empty | 1440 |  |
| shipped__run_start_no-such-draft__empty__390.png | shipped | #/run/start/no-such-draft | empty | 390 |  |
| shipped__library_home__empty__1440.png | shipped | #/library/home | empty | 1440 |  |
| shipped__library_home__empty__390.png | shipped | #/library/home | empty | 390 |  |
| shipped__library_halden-aerostructures_history__empty__1440.png | shipped | #/library/halden-aerostructures/history | empty | 1440 |  |
| shipped__library_halden-aerostructures_history__empty__390.png | shipped | #/library/halden-aerostructures/history | empty | 390 |  |
| shipped__library_corvane-packaging_history__empty__1440.png | shipped | #/library/corvane-packaging/history | empty | 1440 |  |
| shipped__library_corvane-packaging_history__empty__390.png | shipped | #/library/corvane-packaging/history | empty | 390 |  |
| shipped__library_tessaly-foods_history__empty__1440.png | shipped | #/library/tessaly-foods/history | empty | 1440 |  |
| shipped__library_tessaly-foods_history__empty__390.png | shipped | #/library/tessaly-foods/history | empty | 390 |  |
| shipped__library_ardenne-cable_history__empty__1440.png | shipped | #/library/ardenne-cable/history | empty | 1440 |  |
| shipped__library_ardenne-cable_history__empty__390.png | shipped | #/library/ardenne-cable/history | empty | 390 |  |
| shipped__library_lumora-health_history__empty__1440.png | shipped | #/library/lumora-health/history | empty | 1440 |  |
| shipped__library_lumora-health_history__empty__390.png | shipped | #/library/lumora-health/history | empty | 390 |  |
| shipped__library_corvane-fasteners_history__empty__1440.png | shipped | #/library/corvane-fasteners/history | empty | 1440 |  |
| shipped__library_corvane-fasteners_history__empty__390.png | shipped | #/library/corvane-fasteners/history | empty | 390 |  |
| shipped__library_brevane-marine_history__empty__1440.png | shipped | #/library/brevane-marine/history | empty | 1440 |  |
| shipped__library_brevane-marine_history__empty__390.png | shipped | #/library/brevane-marine/history | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_overview__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/overview | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_overview__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/overview | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_changes__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/changes | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_changes__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/changes | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_summary__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/summary | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_summary__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/summary | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_sources__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/sources | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_sources__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/sources | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_record__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/record | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_record__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/record | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_gaps__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/gaps | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_gaps__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/gaps | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_overview__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/overview | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_overview__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/overview | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_changes__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/changes | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_changes__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/changes | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_modules__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/modules | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_modules__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/modules | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_summary__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/summary | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_summary__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/summary | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_sources__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/sources | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_sources__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/sources | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_trace__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/trace | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_trace__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/trace | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_record__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/record | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_record__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/record | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_gaps__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/gaps | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_gaps__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/gaps | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_overview__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/overview | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_overview__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/overview | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_changes__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/changes | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_changes__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/changes | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_summary__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/summary | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_summary__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/summary | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_sources__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/sources | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_sources__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/sources | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_trace__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/trace | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_trace__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/trace | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_record__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/record | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_record__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/record | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_gaps__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/gaps | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_evidence_gaps__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/evidence/gaps | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_overview__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/overview | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_overview__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/overview | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_changes__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/changes | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_changes__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/changes | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_summary__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/summary | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_summary__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/summary | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_sources__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/sources | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_sources__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/sources | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_trace__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/trace | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_trace__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/trace | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_record__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/record | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_record__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/record | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_gaps__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/gaps | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_evidence_gaps__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/evidence/gaps | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_overview__empty__1440.png | shipped | #/library/brevane-marine/r-0412/overview | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_overview__empty__390.png | shipped | #/library/brevane-marine/r-0412/overview | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_changes__empty__1440.png | shipped | #/library/brevane-marine/r-0412/changes | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_changes__empty__390.png | shipped | #/library/brevane-marine/r-0412/changes | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_modules__empty__1440.png | shipped | #/library/brevane-marine/r-0412/modules | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_modules__empty__390.png | shipped | #/library/brevane-marine/r-0412/modules | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_evidence__empty__1440.png | shipped | #/library/brevane-marine/r-0412/evidence | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_evidence__empty__390.png | shipped | #/library/brevane-marine/r-0412/evidence | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_evidence_summary__empty__1440.png | shipped | #/library/brevane-marine/r-0412/evidence/summary | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_evidence_summary__empty__390.png | shipped | #/library/brevane-marine/r-0412/evidence/summary | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_evidence_sources__empty__1440.png | shipped | #/library/brevane-marine/r-0412/evidence/sources | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_evidence_sources__empty__390.png | shipped | #/library/brevane-marine/r-0412/evidence/sources | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_evidence_trace__empty__1440.png | shipped | #/library/brevane-marine/r-0412/evidence/trace | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_evidence_trace__empty__390.png | shipped | #/library/brevane-marine/r-0412/evidence/trace | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_evidence_record__empty__1440.png | shipped | #/library/brevane-marine/r-0412/evidence/record | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_evidence_record__empty__390.png | shipped | #/library/brevane-marine/r-0412/evidence/record | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_evidence_gaps__empty__1440.png | shipped | #/library/brevane-marine/r-0412/evidence/gaps | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_evidence_gaps__empty__390.png | shipped | #/library/brevane-marine/r-0412/evidence/gaps | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_business-profile__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/business-profile | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_business-profile__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/business-profile | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_industry-and-competition__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/industry-and-competition | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_industry-and-competition__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/industry-and-competition | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_financial-performance__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/financial-performance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_financial-performance__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/financial-performance | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_cash-flow-and-liquidity__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/cash-flow-and-liquidity | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_cash-flow-and-liquidity__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/cash-flow-and-liquidity | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_capital-structure__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_capital-structure__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_covenants-and-documentation__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/covenants-and-documentation | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_covenants-and-documentation__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/covenants-and-documentation | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_management-and-governance__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/management-and-governance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_management-and-governance__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/management-and-governance | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_peer-comparison__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/peer-comparison | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_peer-comparison__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/peer-comparison | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_recovery__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/recovery | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_recovery__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/recovery | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_rating-outlook__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/rating-outlook | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_rating-outlook__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/rating-outlook | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_environmental-social-and-governance__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/environmental-social-and-governance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_environmental-social-and-governance__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/environmental-social-and-governance | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_forecast__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/forecast | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_forecast__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/forecast | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_credit-snapshot__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/credit-snapshot | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_credit-snapshot__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/credit-snapshot | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_business-profile__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/business-profile | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_business-profile__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/business-profile | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_industry-and-competition__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/industry-and-competition | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_industry-and-competition__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/industry-and-competition | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_financial-performance__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/financial-performance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_financial-performance__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/financial-performance | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_cash-flow-and-liquidity__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/cash-flow-and-liquidity | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_cash-flow-and-liquidity__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/cash-flow-and-liquidity | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_capital-structure__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/capital-structure | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_capital-structure__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/capital-structure | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_covenants-and-documentation__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/covenants-and-documentation | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_covenants-and-documentation__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/covenants-and-documentation | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_management-and-governance__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/management-and-governance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_management-and-governance__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/management-and-governance | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_peer-comparison__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/peer-comparison | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_peer-comparison__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/peer-comparison | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_recovery__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/recovery | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_recovery__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/recovery | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_rating-outlook__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/rating-outlook | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_rating-outlook__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/rating-outlook | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_environmental-social-and-governance__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/environmental-social-and-governance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_environmental-social-and-governance__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/environmental-social-and-governance | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_forecast__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/forecast | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_forecast__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/forecast | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_credit-snapshot__empty__1440.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/credit-snapshot | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-03-31_modules_credit-snapshot__empty__390.png | shipped | #/library/halden-aerostructures/2026-03-31/modules/credit-snapshot | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_business-profile__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/business-profile | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_business-profile__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/business-profile | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_industry-and-competition__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/industry-and-competition | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_industry-and-competition__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/industry-and-competition | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_financial-performance__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/financial-performance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_financial-performance__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/financial-performance | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_cash-flow-and-liquidity__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/cash-flow-and-liquidity | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_cash-flow-and-liquidity__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/cash-flow-and-liquidity | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_capital-structure__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/capital-structure | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_capital-structure__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/capital-structure | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_covenants-and-documentation__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/covenants-and-documentation | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_covenants-and-documentation__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/covenants-and-documentation | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_management-and-governance__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/management-and-governance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_management-and-governance__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/management-and-governance | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_peer-comparison__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/peer-comparison | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_peer-comparison__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/peer-comparison | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_recovery__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/recovery | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_recovery__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/recovery | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_rating-outlook__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/rating-outlook | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_rating-outlook__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/rating-outlook | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_environmental-social-and-governance__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/environmental-social-and-governance | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_environmental-social-and-governance__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/environmental-social-and-governance | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_forecast__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/forecast | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_forecast__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/forecast | empty | 390 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_credit-snapshot__empty__1440.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/credit-snapshot | empty | 1440 |  |
| shipped__library_halden-aerostructures_2025-09-30_modules_credit-snapshot__empty__390.png | shipped | #/library/halden-aerostructures/2025-09-30/modules/credit-snapshot | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_modules_business-profile__empty__1440.png | shipped | #/library/brevane-marine/r-0412/modules/business-profile | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_modules_business-profile__empty__390.png | shipped | #/library/brevane-marine/r-0412/modules/business-profile | empty | 390 |  |
| shipped__library_brevane-marine_r-0412_modules_source-readiness__empty__1440.png | shipped | #/library/brevane-marine/r-0412/modules/source-readiness | empty | 1440 |  |
| shipped__library_brevane-marine_r-0412_modules_source-readiness__empty__390.png | shipped | #/library/brevane-marine/r-0412/modules/source-readiness | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cash-conversion__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cash-conversion | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cash-conversion__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cash-conversion | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_documentation__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/documentation | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_documentation__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/documentation | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_triggers__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/triggers | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_triggers__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/triggers | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_limit-recovery__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-recovery | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_limit-recovery__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-recovery | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_limit-peers__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-peers | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_limit-peers__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-peers | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bottom-line__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bottom-line | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bottom-line__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bottom-line | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_revenue__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/revenue | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_revenue__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/revenue | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_ebitda-margin__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/ebitda-margin | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_ebitda-margin__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/ebitda-margin | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_interest-cover__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/interest-cover | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_interest-cover__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/interest-cover | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_liquidity__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/liquidity | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_liquidity__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/liquidity | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_aftermarket-share__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/aftermarket-share | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_aftermarket-share__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/aftermarket-share | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_runway__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/runway | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_runway__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/runway | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_notes-2028__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/notes-2028 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_notes-2028__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/notes-2028 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_engine-programme__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/engine-programme | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_engine-programme__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/engine-programme | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-bottom-line__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-bottom-line | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-bottom-line__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-bottom-line | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-1__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-1 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-1__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-1 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-2__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-2 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-2__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-2 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-3__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-3 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-3__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-3 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-4__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-4 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-4__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-4 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-contrary__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-contrary | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-contrary__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-contrary | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-trigger__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-trigger | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-trigger__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-trigger | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-1__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-1 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-1__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-1 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-2__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-2 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-2__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-2 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-matrix__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-matrix | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-matrix__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-matrix | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-1__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-1 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-1__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-1 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-2__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-2 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-2__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-2 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-3__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-3 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-3__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-3 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-4__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-4 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-4__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-4 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-5__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-5 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-5__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-5 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-1__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-1 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-1__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-1 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-2__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-2 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-2__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-2 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-3__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-3 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-3__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-3 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-4__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-4 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-4__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-4 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-1__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-1 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-1__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-1 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-2__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-2 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-2__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-2 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-gross-debt__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-gross-debt | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-gross-debt__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-gross-debt | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-debt__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-debt | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-debt__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-debt | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-leverage__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-leverage | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-leverage__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-leverage | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-secured-leverage__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-secured-leverage | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-secured-leverage__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-secured-leverage | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-cost-of-debt__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-cost-of-debt | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-cost-of-debt__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-cost-of-debt | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-next-maturity__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-next-maturity | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-next-maturity__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-next-maturity | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-interest-cover__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-interest-cover | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-interest-cover__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-interest-cover | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-debt-stack__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-debt-stack | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-debt-stack__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-debt-stack | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-maturities__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-maturities | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-maturities__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-maturities | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-headroom__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-headroom | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-headroom__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-headroom | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity-walk__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity-walk | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity-walk__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity-walk | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-scatter__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-scatter | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-scatter__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-scatter | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-range__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-range | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-range__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-range | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-term-loan__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-term-loan | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-term-loan__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-term-loan | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-revolver__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-revolver | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-revolver__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-revolver | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-receivables__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-receivables | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-receivables__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-receivables | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-bottom-line__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-bottom-line | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-bottom-line__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-bottom-line | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-finding-3__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-finding-3 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-finding-3__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-finding-3 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-hedges__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-hedges | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-hedges__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-hedges | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-cost__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-cost | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-cost__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-cost | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-leases__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-leases | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-leases__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-leases | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_modules_capital-structure__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/modules/capital-structure | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_modules_capital-structure__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/modules/capital-structure | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_no-such-module__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/no-such-module | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_modules_no-such-module__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/modules/no-such-module | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_T-0042__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0042 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_T-0042__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0042 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_T-9999__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-9999 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_trace_T-9999__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-9999 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_trace_T-0014__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/trace/T-0014 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_trace_T-0014__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/trace/T-0014 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_gaps_G-03__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-03 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_gaps_G-03__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-03 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_gaps_G-99__empty__1440.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-99 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-09-30_evidence_gaps_G-99__empty__390.png | shipped | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-99 | empty | 390 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_gaps_G-03__empty__1440.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/gaps/G-03 | empty | 1440 |  |
| shipped__library_halden-aerostructures_2026-06-30_evidence_gaps_G-03__empty__390.png | shipped | #/library/halden-aerostructures/2026-06-30/evidence/gaps/G-03 | empty | 390 |  |
| shipped__model_runs__empty__1440.png | shipped | #/model/runs | empty | 1440 |  |
| shipped__model_runs__empty__390.png | shipped | #/model/runs | empty | 390 |  |
| shipped__model_transdigm_2025-06-30_portfolio-fit__empty__1440.png | shipped | #/model/transdigm/2025-06-30/portfolio-fit | empty | 1440 |  |
| shipped__model_transdigm_2025-06-30_portfolio-fit__empty__390.png | shipped | #/model/transdigm/2025-06-30/portfolio-fit | empty | 390 |  |
| shipped__model_transdigm_2025-06-30_limitations__empty__1440.png | shipped | #/model/transdigm/2025-06-30/limitations | empty | 1440 |  |
| shipped__model_transdigm_2025-06-30_limitations__empty__390.png | shipped | #/model/transdigm/2025-06-30/limitations | empty | 390 |  |
| shipped__model_transdigm_2025-06-30_front__empty__1440.png | shipped | #/model/transdigm/2025-06-30/front | empty | 1440 |  |
| shipped__model_transdigm_2025-06-30_front__empty__390.png | shipped | #/model/transdigm/2025-06-30/front | empty | 390 |  |
| shipped__model_transdigm_2025-06-30_analysis__empty__1440.png | shipped | #/model/transdigm/2025-06-30/analysis | empty | 1440 |  |
| shipped__model_transdigm_2025-06-30_analysis__empty__390.png | shipped | #/model/transdigm/2025-06-30/analysis | empty | 390 |  |
| shipped__model_transdigm_2025-06-30_forecast__empty__1440.png | shipped | #/model/transdigm/2025-06-30/forecast | empty | 1440 |  |
| shipped__model_transdigm_2025-06-30_forecast__empty__390.png | shipped | #/model/transdigm/2025-06-30/forecast | empty | 390 |  |
| shipped__model_transdigm_2025-06-30_statements__empty__1440.png | shipped | #/model/transdigm/2025-06-30/statements | empty | 1440 |  |
| shipped__model_transdigm_2025-06-30_statements__empty__390.png | shipped | #/model/transdigm/2025-06-30/statements | empty | 390 |  |
| shipped__run_activity__empty__1440.png | shipped | #/run/activity | empty | 1440 |  |
| shipped__run_activity__empty__390.png | shipped | #/run/activity | empty | 390 |  |
| shipped__run_start_no-documents__empty__1440.png | shipped | #/run/start/no-documents | empty | 1440 |  |
| shipped__run_start_no-documents__empty__390.png | shipped | #/run/start/no-documents | empty | 390 |  |
| shipped__run_start_documents__empty__1440.png | shipped | #/run/start/documents | empty | 1440 |  |
| shipped__run_start_documents__empty__390.png | shipped | #/run/start/documents | empty | 390 |  |
| shipped__run_start_purpose__empty__1440.png | shipped | #/run/start/purpose | empty | 1440 |  |
| shipped__run_start_purpose__empty__390.png | shipped | #/run/start/purpose | empty | 390 |  |
| shipped__run_start_confirm__empty__1440.png | shipped | #/run/start/confirm | empty | 1440 |  |
| shipped__run_start_confirm__empty__390.png | shipped | #/run/start/confirm | empty | 390 |  |
| shipped__run_start_context__empty__1440.png | shipped | #/run/start/context | empty | 1440 |  |
| shipped__run_start_context__empty__390.png | shipped | #/run/start/context | empty | 390 |  |
| shipped__run_start_start__empty__1440.png | shipped | #/run/start/start | empty | 1440 |  |
| shipped__run_start_start__empty__390.png | shipped | #/run/start/start | empty | 390 |  |
| shipped__run_start_started__empty__1440.png | shipped | #/run/start/started | empty | 1440 |  |
| shipped__run_start_started__empty__390.png | shipped | #/run/start/started | empty | 390 |  |
| shipped__run_activity_running__empty__1440.png | shipped | #/run/activity/running | empty | 1440 |  |
| shipped__run_activity_running__empty__390.png | shipped | #/run/activity/running | empty | 390 |  |
| shipped__run_activity_queued__empty__1440.png | shipped | #/run/activity/queued | empty | 1440 |  |
| shipped__run_activity_queued__empty__390.png | shipped | #/run/activity/queued | empty | 390 |  |
| shipped__run_activity_starting__empty__1440.png | shipped | #/run/activity/starting | empty | 1440 |  |
| shipped__run_activity_starting__empty__390.png | shipped | #/run/activity/starting | empty | 390 |  |
| shipped__run_activity_finished__empty__1440.png | shipped | #/run/activity/finished | empty | 1440 |  |
| shipped__run_activity_finished__empty__390.png | shipped | #/run/activity/finished | empty | 390 |  |
| shipped__run_activity_failed__empty__1440.png | shipped | #/run/activity/failed | empty | 1440 |  |
| shipped__run_activity_failed__empty__390.png | shipped | #/run/activity/failed | empty | 390 |  |
| shipped__run_activity_capped__empty__1440.png | shipped | #/run/activity/capped | empty | 1440 |  |
| shipped__run_activity_capped__empty__390.png | shipped | #/run/activity/capped | empty | 390 |  |
| shipped__run_activity_rejected__empty__1440.png | shipped | #/run/activity/rejected | empty | 1440 |  |
| shipped__run_activity_rejected__empty__390.png | shipped | #/run/activity/rejected | empty | 390 |  |
| shipped__run_activity_interrupted__empty__1440.png | shipped | #/run/activity/interrupted | empty | 1440 |  |
| shipped__run_activity_interrupted__empty__390.png | shipped | #/run/activity/interrupted | empty | 390 |  |
| shipped__run_activity_many-modules__empty__1440.png | shipped | #/run/activity/many-modules | empty | 1440 |  |
| shipped__run_activity_many-modules__empty__390.png | shipped | #/run/activity/many-modules | empty | 390 |  |
| shipped__run_activity_none__empty__1440.png | shipped | #/run/activity/none | empty | 1440 |  |
| shipped__run_activity_none__empty__390.png | shipped | #/run/activity/none | empty | 390 |  |
| shipped__run_activity_unreadable__empty__1440.png | shipped | #/run/activity/unreadable | empty | 1440 |  |
| shipped__run_activity_unreadable__empty__390.png | shipped | #/run/activity/unreadable | empty | 390 |  |
| fixture__root__full__1440.png | fixture | #/ | full | 1440 |  |
| fixture__root__full__390.png | fixture | #/ | full | 390 |  |
| fixture__root__full__open-Sector_All_Sector-8__1440.png | fixture | #/ | full | 1440 | getByRole("button", { name: "Sector: All Sector", exact: true }) |
| fixture__root__full__open-Pathway_All_Pathway-10__1440.png | fixture | #/ | full | 1440 | getByRole("button", { name: "Pathway: All Pathway", exact: true }) |
| fixture__root__full__open-State_All_State-12__1440.png | fixture | #/ | full | 1440 | getByRole("button", { name: "State: All State", exact: true }) |
| fixture__root__full__open-List-15__1440.png | fixture | #/ | full | 1440 | getByRole("radio", { name: "List", exact: true }) |
| fixture__library__full__1440.png | fixture | #/library | full | 1440 |  |
| fixture__library__full__390.png | fixture | #/library | full | 390 |  |
| fixture__library__full__open-Sector_All_Sector-8__1440.png | fixture | #/library | full | 1440 | getByRole("button", { name: "Sector: All Sector", exact: true }) |
| fixture__library__full__open-Pathway_All_Pathway-10__1440.png | fixture | #/library | full | 1440 | getByRole("button", { name: "Pathway: All Pathway", exact: true }) |
| fixture__library__full__open-State_All_State-12__1440.png | fixture | #/library | full | 1440 | getByRole("button", { name: "State: All State", exact: true }) |
| fixture__library__full__open-List-15__1440.png | fixture | #/library | full | 1440 | getByRole("radio", { name: "List", exact: true }) |
| fixture__model__full__1440.png | fixture | #/model | full | 1440 |  |
| fixture__model__full__390.png | fixture | #/model | full | 390 |  |
| fixture__run__full__1440.png | fixture | #/run | full | 1440 |  |
| fixture__run__full__390.png | fixture | #/run | full | 390 |  |
| fixture__kit__full__1440.png | fixture | #/kit | full | 1440 |  |
| fixture__kit__full__390.png | fixture | #/kit | full | 390 |  |
| fixture__kit__full__open-Changes_12-23__1440.png | fixture | #/kit | full | 1440 | getByRole("tab", { name: "Changes 12", exact: true }) |
| fixture__kit__full__open-Evidence-24__1440.png | fixture | #/kit | full | 1440 | getByRole("tab", { name: "Evidence", exact: true }) |
| fixture__kit__full__open-Modules-27__1440.png | fixture | #/kit | full | 1440 | getByRole("tab", { name: "Modules", exact: true }) |
| fixture__kit__full__open-Forecast-28__1440.png | fixture | #/kit | full | 1440 | getByRole("tab", { name: "Forecast", exact: true }) |
| fixture__kit__full__open-Select_Update_schedule-38__1440.png | fixture | #/kit | full | 1440 | getByRole("button", { name: "Select Update schedule", exact: true }) |
| fixture__kit__full__open-Select_Review_cycle-42__1440.png | fixture | #/kit | full | 1440 | getByRole("button", { name: "Select Review cycle", exact: true }) |
| fixture__kit__full__open-Open_drawer-69__1440.png | fixture | #/kit | full | 1440 | getByRole("button", { name: "Open drawer", exact: true }) |
| fixture__kit__full__open-Start_run-70__1440.png | fixture | #/kit | full | 1440 | getByRole("button", { name: "Start run", exact: true }) |
| fixture__kit__full__open-Rename_issuer-71__1440.png | fixture | #/kit | full | 1440 | getByRole("button", { name: "Rename issuer", exact: true }) |
| fixture__no-such-page__error__1440.png | fixture | #/no-such-page | error | 1440 |  |
| fixture__no-such-page__error__390.png | fixture | #/no-such-page | error | 390 |  |
| fixture__library_no-such-issuer_history__error__1440.png | fixture | #/library/no-such-issuer/history | error | 1440 |  |
| fixture__library_no-such-issuer_history__error__390.png | fixture | #/library/no-such-issuer/history | error | 390 |  |
| fixture__library_no-such-issuer_no-run_overview__error__1440.png | fixture | #/library/no-such-issuer/no-run/overview | error | 1440 |  |
| fixture__library_no-such-issuer_no-run_overview__error__390.png | fixture | #/library/no-such-issuer/no-run/overview | error | 390 |  |
| fixture__model_no-such-issuer_no-run_front__error__1440.png | fixture | #/model/no-such-issuer/no-run/front | error | 1440 |  |
| fixture__model_no-such-issuer_no-run_front__error__390.png | fixture | #/model/no-such-issuer/no-run/front | error | 390 |  |
| fixture__run_activity_no-such-run__error__1440.png | fixture | #/run/activity/no-such-run | error | 1440 |  |
| fixture__run_activity_no-such-run__error__390.png | fixture | #/run/activity/no-such-run | error | 390 |  |
| fixture__run_start_no-such-draft__error__1440.png | fixture | #/run/start/no-such-draft | error | 1440 |  |
| fixture__run_start_no-such-draft__error__390.png | fixture | #/run/start/no-such-draft | error | 390 |  |
| fixture__library_home__full__1440.png | fixture | #/library/home | full | 1440 |  |
| fixture__library_home__full__390.png | fixture | #/library/home | full | 390 |  |
| fixture__library_home__full__open-Sector_All_Sector-8__1440.png | fixture | #/library/home | full | 1440 | getByRole("button", { name: "Sector: All Sector", exact: true }) |
| fixture__library_home__full__open-Pathway_All_Pathway-10__1440.png | fixture | #/library/home | full | 1440 | getByRole("button", { name: "Pathway: All Pathway", exact: true }) |
| fixture__library_home__full__open-State_All_State-12__1440.png | fixture | #/library/home | full | 1440 | getByRole("button", { name: "State: All State", exact: true }) |
| fixture__library_home__full__open-List-15__1440.png | fixture | #/library/home | full | 1440 | getByRole("radio", { name: "List", exact: true }) |
| fixture__library_halden-aerostructures_history__full__1440.png | fixture | #/library/halden-aerostructures/history | full | 1440 |  |
| fixture__library_halden-aerostructures_history__full__390.png | fixture | #/library/halden-aerostructures/history | full | 390 |  |
| fixture__library_corvane-packaging_history__empty__1440.png | fixture | #/library/corvane-packaging/history | empty | 1440 |  |
| fixture__library_corvane-packaging_history__empty__390.png | fixture | #/library/corvane-packaging/history | empty | 390 |  |
| fixture__library_tessaly-foods_history__empty__1440.png | fixture | #/library/tessaly-foods/history | empty | 1440 |  |
| fixture__library_tessaly-foods_history__empty__390.png | fixture | #/library/tessaly-foods/history | empty | 390 |  |
| fixture__library_ardenne-cable_history__empty__1440.png | fixture | #/library/ardenne-cable/history | empty | 1440 |  |
| fixture__library_ardenne-cable_history__empty__390.png | fixture | #/library/ardenne-cable/history | empty | 390 |  |
| fixture__library_lumora-health_history__empty__1440.png | fixture | #/library/lumora-health/history | empty | 1440 |  |
| fixture__library_lumora-health_history__empty__390.png | fixture | #/library/lumora-health/history | empty | 390 |  |
| fixture__library_corvane-fasteners_history__empty__1440.png | fixture | #/library/corvane-fasteners/history | empty | 1440 |  |
| fixture__library_corvane-fasteners_history__empty__390.png | fixture | #/library/corvane-fasteners/history | empty | 390 |  |
| fixture__library_brevane-marine_history__full__1440.png | fixture | #/library/brevane-marine/history | full | 1440 |  |
| fixture__library_brevane-marine_history__full__390.png | fixture | #/library/brevane-marine/history | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_the_bottom_line-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for the bottom line", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_figure-15__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_figure-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_figure-17__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_figure-18__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_figure-19__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_point-20__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this point", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_point-21__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this point", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_point-22__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this point", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_point-23__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this point", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_point-24__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this point", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_point-25__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this point", exact: true }).nth(5) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_finding-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_finding-27__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_finding-28__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_finding-29__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_finding-30__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_the_triggers-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for the triggers", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Collapse_limitations-46__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_limitation-47__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_limitation-48__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_limitation-49__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__open-Show_sources_for_this_limitation-50__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__open-Show_sources_for_this_change-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 1440 | getByRole("button", { name: "Show sources for this change", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__open-Show_sources_for_this_change-17__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 1440 | getByRole("button", { name: "Show sources for this change", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__open-Show_sources_for_this_change-18__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 1440 | getByRole("button", { name: "Show sources for this change", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__open-Show_sources_for_this_change-19__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 1440 | getByRole("button", { name: "Show sources for this change", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__open-Show_sources_for_this_change-20__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 1440 | getByRole("button", { name: "Show sources for this change", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_changes__full__open-Show_sources_for_this_change-21__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/changes | full | 1440 | getByRole("button", { name: "Show sources for this change", exact: true }).nth(5) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_the_bottom_line-33__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for the bottom line", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_finding-34__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_finding-35__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_finding-36__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_finding-37__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_the_contrary_evidence-38__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for the contrary evidence", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_the_trigger-39__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for the trigger", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_the_risk_matrix-40__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for the risk matrix", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_risk-41__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_risk-42__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_risk-43__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_risk-44__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_risk-45__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_indicator-46__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_indicator-47__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_indicator-48__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_indicator-49__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_answer-51__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this answer", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-How_much_of_the_order_book_is_firm_Answe-52__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | locator("#main > div > div > div:nth-of-type(2) > div > div:nth-of-type(6) > div:nth-of-type(2) > section:nth-of-type(2) > ul > li:nth-of-type(4) > details > summary") |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Collapse_limitations-54__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_limitation-55__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_all-56__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show all", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules__full__open-Show_sources_for_this_limitation-57__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_evidence__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_summary__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/summary | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_summary__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/summary | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_summary__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/summary | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_sources__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/sources | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_sources__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/sources | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_sources__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/sources | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_sources__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/sources | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_sources__full__open-Show_the_other_4_files-27__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/sources | full | 1440 | getByRole("button", { name: "Show the other 4 files", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_record__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/record | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_record__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/record | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_record__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/record | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-06-30_overview__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/overview | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_overview__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/overview | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_changes__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/changes | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_changes__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/changes | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_modules__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/modules | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_modules__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/modules | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_summary__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/summary | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_summary__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/summary | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_sources__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/sources | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_sources__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/sources | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_trace__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/trace | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_trace__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/trace | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_record__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/record | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_record__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/record | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_gaps__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/gaps | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_gaps__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/gaps | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_overview__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/overview | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_overview__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/overview | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_overview__full__open-Collapse_limitations-21__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/overview | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_changes__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/changes | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_changes__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/changes | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_summary__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/summary | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_summary__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/summary | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_summary__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/summary | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_sources__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/sources | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_sources__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/sources | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_sources__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/sources | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_sources__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/sources | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_trace__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/trace | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_trace__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/trace | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_trace__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/trace | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_trace__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/trace | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_record__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/record | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_record__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/record | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_record__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/record | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_gaps__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/gaps | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_gaps__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/gaps | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_evidence_gaps__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/gaps | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_evidence_gaps__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/evidence/gaps | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_overview__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/overview | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_overview__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/overview | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_overview__full__open-Collapse_limitations-17__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/overview | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_changes__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/changes | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_changes__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/changes | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_summary__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/summary | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_summary__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/summary | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_summary__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/summary | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_sources__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/sources | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_sources__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/sources | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_sources__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/sources | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_sources__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/sources | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_trace__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/trace | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_trace__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/trace | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_trace__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/trace | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_trace__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/trace | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_record__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/record | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_record__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/record | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_record__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/record | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_gaps__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/gaps | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_gaps__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/gaps | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_evidence_gaps__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/gaps | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_evidence_gaps__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/evidence/gaps | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_brevane-marine_r-0412_overview__full__1440.png | fixture | #/library/brevane-marine/r-0412/overview | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_overview__full__390.png | fixture | #/library/brevane-marine/r-0412/overview | full | 390 |  |
| fixture__library_brevane-marine_r-0412_overview__full__open-Collapse_limitations-17__1440.png | fixture | #/library/brevane-marine/r-0412/overview | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_brevane-marine_r-0412_changes__full__1440.png | fixture | #/library/brevane-marine/r-0412/changes | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_changes__full__390.png | fixture | #/library/brevane-marine/r-0412/changes | full | 390 |  |
| fixture__library_brevane-marine_r-0412_modules__full__1440.png | fixture | #/library/brevane-marine/r-0412/modules | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_modules__full__390.png | fixture | #/library/brevane-marine/r-0412/modules | full | 390 |  |
| fixture__library_brevane-marine_r-0412_modules__full__open-Collapse_limitations-20__1440.png | fixture | #/library/brevane-marine/r-0412/modules | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence__full__1440.png | fixture | #/library/brevane-marine/r-0412/evidence | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_evidence__full__390.png | fixture | #/library/brevane-marine/r-0412/evidence | full | 390 |  |
| fixture__library_brevane-marine_r-0412_evidence__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/brevane-marine/r-0412/evidence | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_summary__full__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/summary | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_evidence_summary__full__390.png | fixture | #/library/brevane-marine/r-0412/evidence/summary | full | 390 |  |
| fixture__library_brevane-marine_r-0412_evidence_summary__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/summary | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_sources__full__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/sources | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_evidence_sources__full__390.png | fixture | #/library/brevane-marine/r-0412/evidence/sources | full | 390 |  |
| fixture__library_brevane-marine_r-0412_evidence_sources__full__open-Module_All_Module-14__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/sources | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_sources__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/sources | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_trace__full__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/trace | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_evidence_trace__full__390.png | fixture | #/library/brevane-marine/r-0412/evidence/trace | full | 390 |  |
| fixture__library_brevane-marine_r-0412_evidence_trace__full__open-Module_All_Module-14__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/trace | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_trace__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/trace | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_record__full__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/record | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_evidence_record__full__390.png | fixture | #/library/brevane-marine/r-0412/evidence/record | full | 390 |  |
| fixture__library_brevane-marine_r-0412_evidence_record__full__open-Jump_to_an_item_Ctrl_K-14__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/record | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_gaps__full__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/gaps | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_evidence_gaps__full__390.png | fixture | #/library/brevane-marine/r-0412/evidence/gaps | full | 390 |  |
| fixture__library_brevane-marine_r-0412_evidence_gaps__full__open-Module_All_Module-14__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/gaps | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_brevane-marine_r-0412_evidence_gaps__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/brevane-marine/r-0412/evidence/gaps | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_the_bottom_line-33__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for the bottom line", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_finding-34__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_finding-35__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_finding-36__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_finding-37__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_the_contrary_evidence-38__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for the contrary evidence", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_the_trigger-39__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for the trigger", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_the_risk_matrix-40__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for the risk matrix", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_risk-41__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_risk-42__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_risk-43__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_risk-44__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_risk-45__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this risk", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_indicator-46__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_indicator-47__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_indicator-48__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_indicator-49__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this indicator", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_answer-51__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this answer", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-How_much_of_the_order_book_is_firm_Answe-52__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | locator("#main > div > div > div:nth-of-type(2) > div > div:nth-of-type(6) > div:nth-of-type(2) > section:nth-of-type(2) > ul > li:nth-of-type(4) > details > summary") |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Collapse_limitations-54__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_limitation-55__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_all-56__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show all", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_business-profile__full__open-Show_sources_for_this_limitation-57__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_industry-and-competition__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/industry-and-competition | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_industry-and-competition__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/industry-and-competition | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_industry-and-competition__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/industry-and-competition | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_financial-performance__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/financial-performance | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_financial-performance__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/financial-performance | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_financial-performance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/financial-performance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_cash-flow-and-liquidity__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/cash-flow-and-liquidity | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_cash-flow-and-liquidity__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/cash-flow-and-liquidity | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_cash-flow-and-liquidity__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/cash-flow-and-liquidity | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_the_bottom_line-37__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for the bottom line", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_finding-38__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_finding-39__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_finding-40__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this finding", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_figure-41__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_figure-42__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_figure-43__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_figure-44__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_figure-45__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_figure-46__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this figure", exact: true }).nth(5) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_measure-47__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this measure", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_measure-48__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this measure", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_measure-49__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this measure", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_the_debt_stack-50__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for the debt stack", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_maturities-51__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for maturities", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_headroom-52__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for headroom", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_the_liquidity_walk-53__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for the liquidity walk", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_the_peer_scatter-54__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for the peer scatter", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_the_peer_range-55__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for the peer range", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_fact-56__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this fact", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_fact-57__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this fact", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_fact-58__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this fact", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_fact-59__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this fact", exact: true }).nth(3) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_fact-60__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this fact", exact: true }).nth(4) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_fact-61__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this fact", exact: true }).nth(5) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_fact-62__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this fact", exact: true }).nth(6) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Collapse_limitations-64__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_limitation-65__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(0) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_limitation-66__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(1) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__open-Show_sources_for_this_limitation-67__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Show sources for this limitation", exact: true }).nth(2) |
| fixture__library_halden-aerostructures_2026-09-30_modules_covenants-and-documentation__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/covenants-and-documentation | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_covenants-and-documentation__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/covenants-and-documentation | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_covenants-and-documentation__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/covenants-and-documentation | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_management-and-governance__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/management-and-governance | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_management-and-governance__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/management-and-governance | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_management-and-governance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/management-and-governance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_peer-comparison__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/peer-comparison | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_peer-comparison__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/peer-comparison | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_peer-comparison__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/peer-comparison | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_recovery__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/recovery | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_recovery__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/recovery | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_rating-outlook__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/rating-outlook | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_rating-outlook__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/rating-outlook | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_rating-outlook__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/rating-outlook | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_environmental-social-and-governance__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/environmental-social-and-governance | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_environmental-social-and-governance__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/environmental-social-and-governance | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_environmental-social-and-governance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/environmental-social-and-governance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_forecast__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/forecast | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_forecast__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/forecast | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_forecast__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/forecast | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_credit-snapshot__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/credit-snapshot | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_credit-snapshot__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/credit-snapshot | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_credit-snapshot__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/credit-snapshot | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_business-profile__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/business-profile | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_business-profile__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/business-profile | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_business-profile__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/business-profile | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_industry-and-competition__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/industry-and-competition | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_industry-and-competition__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/industry-and-competition | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_industry-and-competition__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/industry-and-competition | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_financial-performance__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/financial-performance | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_financial-performance__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/financial-performance | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_cash-flow-and-liquidity__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/cash-flow-and-liquidity | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_cash-flow-and-liquidity__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/cash-flow-and-liquidity | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_capital-structure__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/capital-structure | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_capital-structure__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/capital-structure | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_capital-structure__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/capital-structure | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_covenants-and-documentation__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/covenants-and-documentation | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_covenants-and-documentation__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/covenants-and-documentation | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_covenants-and-documentation__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/covenants-and-documentation | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_management-and-governance__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/management-and-governance | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_management-and-governance__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/management-and-governance | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_management-and-governance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/management-and-governance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_peer-comparison__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/peer-comparison | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_peer-comparison__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/peer-comparison | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_peer-comparison__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/peer-comparison | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_recovery__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/recovery | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_recovery__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/recovery | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_rating-outlook__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/rating-outlook | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_rating-outlook__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/rating-outlook | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_rating-outlook__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/rating-outlook | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_environmental-social-and-governance__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/environmental-social-and-governance | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_environmental-social-and-governance__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/environmental-social-and-governance | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_environmental-social-and-governance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/environmental-social-and-governance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2026-03-31_modules_forecast__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/forecast | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_forecast__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/forecast | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_credit-snapshot__full__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/credit-snapshot | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_credit-snapshot__full__390.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/credit-snapshot | full | 390 |  |
| fixture__library_halden-aerostructures_2026-03-31_modules_credit-snapshot__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2026-03-31/modules/credit-snapshot | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_business-profile__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/business-profile | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_business-profile__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/business-profile | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_business-profile__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/business-profile | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_industry-and-competition__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/industry-and-competition | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_industry-and-competition__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/industry-and-competition | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_industry-and-competition__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/industry-and-competition | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_financial-performance__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/financial-performance | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_financial-performance__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/financial-performance | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_financial-performance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/financial-performance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_cash-flow-and-liquidity__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/cash-flow-and-liquidity | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_cash-flow-and-liquidity__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/cash-flow-and-liquidity | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_cash-flow-and-liquidity__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/cash-flow-and-liquidity | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_capital-structure__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/capital-structure | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_capital-structure__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/capital-structure | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_capital-structure__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/capital-structure | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_covenants-and-documentation__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/covenants-and-documentation | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_covenants-and-documentation__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/covenants-and-documentation | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_covenants-and-documentation__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/covenants-and-documentation | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_management-and-governance__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/management-and-governance | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_management-and-governance__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/management-and-governance | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_management-and-governance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/management-and-governance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_peer-comparison__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/peer-comparison | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_peer-comparison__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/peer-comparison | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_peer-comparison__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/peer-comparison | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_recovery__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/recovery | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_recovery__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/recovery | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_recovery__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/recovery | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_rating-outlook__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/rating-outlook | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_rating-outlook__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/rating-outlook | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_rating-outlook__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/rating-outlook | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_environmental-social-and-governance__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/environmental-social-and-governance | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_environmental-social-and-governance__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/environmental-social-and-governance | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_environmental-social-and-governance__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/environmental-social-and-governance | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_forecast__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/forecast | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_forecast__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/forecast | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_forecast__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/forecast | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_halden-aerostructures_2025-09-30_modules_credit-snapshot__full__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/credit-snapshot | full | 1440 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_credit-snapshot__full__390.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/credit-snapshot | full | 390 |  |
| fixture__library_halden-aerostructures_2025-09-30_modules_credit-snapshot__full__open-Collapse_limitations-31__1440.png | fixture | #/library/halden-aerostructures/2025-09-30/modules/credit-snapshot | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_brevane-marine_r-0412_modules_business-profile__full__1440.png | fixture | #/library/brevane-marine/r-0412/modules/business-profile | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_modules_business-profile__full__390.png | fixture | #/library/brevane-marine/r-0412/modules/business-profile | full | 390 |  |
| fixture__library_brevane-marine_r-0412_modules_business-profile__full__open-Collapse_limitations-20__1440.png | fixture | #/library/brevane-marine/r-0412/modules/business-profile | full | 1440 | getByRole("button", { name: "Collapse limitations", exact: true }) |
| fixture__library_brevane-marine_r-0412_modules_source-readiness__full__1440.png | fixture | #/library/brevane-marine/r-0412/modules/source-readiness | full | 1440 |  |
| fixture__library_brevane-marine_r-0412_modules_source-readiness__full__390.png | fixture | #/library/brevane-marine/r-0412/modules/source-readiness | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cash-conversion__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cash-conversion | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cash-conversion__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cash-conversion | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cash-conversion__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cash-conversion | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cash-conversion__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cash-conversion | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cash-conversion__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cash-conversion | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_documentation__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/documentation | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_documentation__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/documentation | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_documentation__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/documentation | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_documentation__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/documentation | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_documentation__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/documentation | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_triggers__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/triggers | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_triggers__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/triggers | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_triggers__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/triggers | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_triggers__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/triggers | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_triggers__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/triggers | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-recovery__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-recovery | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-recovery__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-recovery | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-recovery__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-recovery | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-recovery__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-recovery | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-recovery__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-recovery | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-peers__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-peers | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-peers__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-peers | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-peers__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-peers | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-peers__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-peers | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_limit-peers__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/limit-peers | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bottom-line__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bottom-line | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bottom-line__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bottom-line | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bottom-line__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bottom-line | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bottom-line__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bottom-line | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bottom-line__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bottom-line | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_revenue__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/revenue | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_revenue__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/revenue | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_revenue__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/revenue | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_revenue__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/revenue | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_revenue__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/revenue | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_ebitda-margin__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/ebitda-margin | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_ebitda-margin__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/ebitda-margin | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_ebitda-margin__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/ebitda-margin | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_ebitda-margin__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/ebitda-margin | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_ebitda-margin__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/ebitda-margin | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_interest-cover__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/interest-cover | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_interest-cover__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/interest-cover | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_interest-cover__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/interest-cover | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_interest-cover__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/interest-cover | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_interest-cover__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/interest-cover | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_liquidity__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/liquidity | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_liquidity__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/liquidity | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_liquidity__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/liquidity | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_liquidity__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/liquidity | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_liquidity__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/liquidity | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_aftermarket-share__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/aftermarket-share | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_aftermarket-share__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/aftermarket-share | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_aftermarket-share__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/aftermarket-share | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_aftermarket-share__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/aftermarket-share | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_aftermarket-share__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/aftermarket-share | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_runway__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/runway | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_runway__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/runway | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_runway__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/runway | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_runway__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/runway | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_runway__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/runway | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_notes-2028__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/notes-2028 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_notes-2028__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/notes-2028 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_notes-2028__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/notes-2028 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_notes-2028__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/notes-2028 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_notes-2028__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/notes-2028 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_engine-programme__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/engine-programme | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_engine-programme__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/engine-programme | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_engine-programme__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/engine-programme | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_engine-programme__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/engine-programme | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_engine-programme__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/engine-programme | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-bottom-line__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-bottom-line | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-bottom-line__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-bottom-line | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-bottom-line__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-bottom-line | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-bottom-line__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-bottom-line | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-bottom-line__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-bottom-line | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-1__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-1 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-1__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-1 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-1__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-1 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-1__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-1 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-1__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-1 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-2__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-2 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-2__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-2 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-2__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-2 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-2__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-2 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-2__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-2 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-3__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-3 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-3__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-3 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-3__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-3 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-3__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-3 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-3__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-3 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-4__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-4 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-4__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-4 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-4__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-4 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-4__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-4 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-finding-4__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-finding-4 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-contrary__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-contrary | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-contrary__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-contrary | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-contrary__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-contrary | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-contrary__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-contrary | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-contrary__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-contrary | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-trigger__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-trigger | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-trigger__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-trigger | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-trigger__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-trigger | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-trigger__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-trigger | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-trigger__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-trigger | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-1__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-1 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-1__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-1 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-1__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-1 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-1__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-1 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-1__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-1 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-2__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-2 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-2__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-2 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-2__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-2 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-2__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-2 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-limit-2__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-limit-2 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-matrix__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-matrix | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-matrix__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-matrix | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-matrix__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-matrix | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-matrix__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-matrix | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-matrix__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-matrix | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-1__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-1 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-1__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-1 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-1__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-1 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-1__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-1 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-1__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-1 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-2__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-2 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-2__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-2 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-2__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-2 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-2__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-2 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-2__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-2 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-3__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-3 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-3__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-3 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-3__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-3 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-3__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-3 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-3__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-3 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-4__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-4 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-4__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-4 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-4__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-4 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-4__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-4 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-4__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-4 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-5__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-5 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-5__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-5 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-5__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-5 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-5__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-5 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-risk-5__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-risk-5 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-1__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-1 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-1__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-1 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-1__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-1 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-1__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-1 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-1__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-1 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-2__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-2 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-2__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-2 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-2__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-2 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-2__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-2 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-2__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-2 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-3__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-3 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-3__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-3 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-3__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-3 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-3__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-3 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-3__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-3 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-4__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-4 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-4__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-4 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-4__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-4 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-4__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-4 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-watch-4__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-watch-4 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-1__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-1 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-1__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-1 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-1__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-1 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-1__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-1 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-1__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-1 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-2__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-2 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-2__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-2 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-2__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-2 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-2__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-2 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_bp-answer-2__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/bp-answer-2 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-gross-debt__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-gross-debt | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-gross-debt__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-gross-debt | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-gross-debt__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-gross-debt | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-gross-debt__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-gross-debt | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-gross-debt__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-gross-debt | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-debt__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-debt | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-debt__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-debt | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-debt__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-debt | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-debt__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-debt | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-debt__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-debt | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-leverage__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-leverage | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-leverage__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-leverage | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-leverage__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-leverage | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-leverage__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-leverage | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-net-leverage__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-net-leverage | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-secured-leverage__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-secured-leverage | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-secured-leverage__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-secured-leverage | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-secured-leverage__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-secured-leverage | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-secured-leverage__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-secured-leverage | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-secured-leverage__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-secured-leverage | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-cost-of-debt__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-cost-of-debt | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-cost-of-debt__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-cost-of-debt | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-cost-of-debt__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-cost-of-debt | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-cost-of-debt__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-cost-of-debt | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-cost-of-debt__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-cost-of-debt | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-next-maturity__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-next-maturity | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-next-maturity__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-next-maturity | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-next-maturity__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-next-maturity | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-next-maturity__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-next-maturity | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-next-maturity__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-next-maturity | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-interest-cover__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-interest-cover | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-interest-cover__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-interest-cover | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-interest-cover__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-interest-cover | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-interest-cover__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-interest-cover | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-interest-cover__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-interest-cover | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-debt-stack__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-debt-stack | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-debt-stack__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-debt-stack | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-debt-stack__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-debt-stack | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-debt-stack__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-debt-stack | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-debt-stack__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-debt-stack | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-maturities__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-maturities | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-maturities__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-maturities | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-maturities__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-maturities | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-maturities__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-maturities | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-maturities__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-maturities | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-headroom__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-headroom | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-headroom__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-headroom | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-headroom__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-headroom | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-headroom__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-headroom | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-headroom__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-headroom | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity-walk__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity-walk | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity-walk__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity-walk | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity-walk__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity-walk | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity-walk__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity-walk | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-liquidity-walk__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-liquidity-walk | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-scatter__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-scatter | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-scatter__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-scatter | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-scatter__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-scatter | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-scatter__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-scatter | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-scatter__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-scatter | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-range__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-range | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-range__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-range | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-range__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-range | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-range__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-range | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-peer-range__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-peer-range | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-term-loan__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-term-loan | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-term-loan__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-term-loan | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-term-loan__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-term-loan | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-term-loan__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-term-loan | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-term-loan__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-term-loan | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-revolver__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-revolver | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-revolver__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-revolver | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-revolver__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-revolver | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-revolver__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-revolver | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-revolver__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-revolver | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-receivables__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-receivables | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-receivables__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-receivables | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-receivables__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-receivables | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-receivables__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-receivables | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-receivables__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-receivables | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-bottom-line__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-bottom-line | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-bottom-line__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-bottom-line | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-bottom-line__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-bottom-line | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-bottom-line__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-bottom-line | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-bottom-line__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-bottom-line | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-finding-3__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-finding-3 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-finding-3__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-finding-3 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-finding-3__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-finding-3 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-finding-3__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-finding-3 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-finding-3__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-finding-3 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-hedges__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-hedges | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-hedges__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-hedges | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-hedges__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-hedges | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-hedges__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-hedges | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-hedges__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-hedges | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-cost__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-cost | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-cost__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-cost | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-cost__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-cost | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-cost__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-cost | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-cost__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-cost | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-leases__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-leases | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-leases__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-leases | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-leases__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-leases | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-leases__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-leases | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-06-30_modules_capital-structure__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/modules/capital-structure | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_modules_capital-structure__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/modules/capital-structure | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_no-such-module__error__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/no-such-module | error | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_modules_no-such-module__error__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/no-such-module | error | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0042__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0042 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0042__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0042 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-9999__error__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-9999 | error | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-9999__error__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-9999 | error | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_trace_T-0014__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/trace/T-0014 | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_trace_T-0014__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/trace/T-0014 | loading | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-03__full__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-03 | full | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-03__full__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-03 | full | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-99__error__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-99 | error | 1440 |  |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-99__error__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-99 | error | 390 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_gaps_G-03__loading__1440.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/gaps/G-03 | loading | 1440 |  |
| fixture__library_halden-aerostructures_2026-06-30_evidence_gaps_G-03__loading__390.png | fixture | #/library/halden-aerostructures/2026-06-30/evidence/gaps/G-03 | loading | 390 |  |
| fixture__model_runs__full__1440.png | fixture | #/model/runs | full | 1440 |  |
| fixture__model_runs__full__390.png | fixture | #/model/runs | full | 390 |  |
| fixture__model_transdigm_2025-06-30_portfolio-fit__full__1440.png | fixture | #/model/transdigm/2025-06-30/portfolio-fit | full | 1440 |  |
| fixture__model_transdigm_2025-06-30_portfolio-fit__full__390.png | fixture | #/model/transdigm/2025-06-30/portfolio-fit | full | 390 |  |
| fixture__model_transdigm_2025-06-30_limitations__full__1440.png | fixture | #/model/transdigm/2025-06-30/limitations | full | 1440 |  |
| fixture__model_transdigm_2025-06-30_limitations__full__390.png | fixture | #/model/transdigm/2025-06-30/limitations | full | 390 |  |
| fixture__model_transdigm_2025-06-30_front__full__1440.png | fixture | #/model/transdigm/2025-06-30/front | full | 1440 |  |
| fixture__model_transdigm_2025-06-30_front__full__390.png | fixture | #/model/transdigm/2025-06-30/front | full | 390 |  |
| fixture__model_transdigm_2025-06-30_analysis__full__1440.png | fixture | #/model/transdigm/2025-06-30/analysis | full | 1440 |  |
| fixture__model_transdigm_2025-06-30_analysis__full__390.png | fixture | #/model/transdigm/2025-06-30/analysis | full | 390 |  |
| fixture__model_transdigm_2025-06-30_forecast__full__1440.png | fixture | #/model/transdigm/2025-06-30/forecast | full | 1440 |  |
| fixture__model_transdigm_2025-06-30_forecast__full__390.png | fixture | #/model/transdigm/2025-06-30/forecast | full | 390 |  |
| fixture__model_transdigm_2025-06-30_statements__full__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 |  |
| fixture__model_transdigm_2025-06-30_statements__full__390.png | fixture | #/model/transdigm/2025-06-30/statements | full | 390 |  |
| fixture__run_activity__full__1440.png | fixture | #/run/activity | full | 1440 |  |
| fixture__run_activity__full__390.png | fixture | #/run/activity | full | 390 |  |
| fixture__run_start_no-documents__empty__1440.png | fixture | #/run/start/no-documents | empty | 1440 |  |
| fixture__run_start_no-documents__empty__390.png | fixture | #/run/start/no-documents | empty | 390 |  |
| fixture__run_start_documents__full__1440.png | fixture | #/run/start/documents | full | 1440 |  |
| fixture__run_start_documents__full__390.png | fixture | #/run/start/documents | full | 390 |  |
| fixture__run_start_purpose__full__1440.png | fixture | #/run/start/purpose | full | 1440 |  |
| fixture__run_start_purpose__full__390.png | fixture | #/run/start/purpose | full | 390 |  |
| fixture__run_start_confirm__full__1440.png | fixture | #/run/start/confirm | full | 1440 |  |
| fixture__run_start_confirm__full__390.png | fixture | #/run/start/confirm | full | 390 |  |
| fixture__run_start_context__full__1440.png | fixture | #/run/start/context | full | 1440 |  |
| fixture__run_start_context__full__390.png | fixture | #/run/start/context | full | 390 |  |
| fixture__run_start_start__full__1440.png | fixture | #/run/start/start | full | 1440 |  |
| fixture__run_start_start__full__390.png | fixture | #/run/start/start | full | 390 |  |
| fixture__run_start_started__full__1440.png | fixture | #/run/start/started | full | 1440 |  |
| fixture__run_start_started__full__390.png | fixture | #/run/start/started | full | 390 |  |
| fixture__run_activity_running__full__1440.png | fixture | #/run/activity/running | full | 1440 |  |
| fixture__run_activity_running__full__390.png | fixture | #/run/activity/running | full | 390 |  |
| fixture__run_activity_queued__full__1440.png | fixture | #/run/activity/queued | full | 1440 |  |
| fixture__run_activity_queued__full__390.png | fixture | #/run/activity/queued | full | 390 |  |
| fixture__run_activity_starting__full__1440.png | fixture | #/run/activity/starting | full | 1440 |  |
| fixture__run_activity_starting__full__390.png | fixture | #/run/activity/starting | full | 390 |  |
| fixture__run_activity_finished__full__1440.png | fixture | #/run/activity/finished | full | 1440 |  |
| fixture__run_activity_finished__full__390.png | fixture | #/run/activity/finished | full | 390 |  |
| fixture__run_activity_failed__error__1440.png | fixture | #/run/activity/failed | error | 1440 |  |
| fixture__run_activity_failed__error__390.png | fixture | #/run/activity/failed | error | 390 |  |
| fixture__run_activity_capped__partial__1440.png | fixture | #/run/activity/capped | partial | 1440 |  |
| fixture__run_activity_capped__partial__390.png | fixture | #/run/activity/capped | partial | 390 |  |
| fixture__run_activity_rejected__partial__1440.png | fixture | #/run/activity/rejected | partial | 1440 |  |
| fixture__run_activity_rejected__partial__390.png | fixture | #/run/activity/rejected | partial | 390 |  |
| fixture__run_activity_interrupted__partial__1440.png | fixture | #/run/activity/interrupted | partial | 1440 |  |
| fixture__run_activity_interrupted__partial__390.png | fixture | #/run/activity/interrupted | partial | 390 |  |
| fixture__run_activity_many-modules__full__1440.png | fixture | #/run/activity/many-modules | full | 1440 |  |
| fixture__run_activity_many-modules__full__390.png | fixture | #/run/activity/many-modules | full | 390 |  |
| fixture__run_activity_none__empty__1440.png | fixture | #/run/activity/none | empty | 1440 |  |
| fixture__run_activity_none__empty__390.png | fixture | #/run/activity/none | empty | 390 |  |
| fixture__run_activity_unreadable__error__1440.png | fixture | #/run/activity/unreadable | error | 1440 |  |
| fixture__run_activity_unreadable__error__390.png | fixture | #/run/activity/unreadable | error | 390 |  |
| fixture__library_transdigm_2025-06-30_overview__error__1440.png | fixture | #/library/transdigm/2025-06-30/overview | error | 1440 |  |
| fixture__library_transdigm_2025-06-30_overview__error__390.png | fixture | #/library/transdigm/2025-06-30/overview | error | 390 |  |
| fixture__library_transdigm_2025-06-30_evidence__error__1440.png | fixture | #/library/transdigm/2025-06-30/evidence | error | 1440 |  |
| fixture__library_transdigm_2025-06-30_evidence__error__390.png | fixture | #/library/transdigm/2025-06-30/evidence | error | 390 |  |
| fixture__library_transdigm_2025-06-30_changes__error__1440.png | fixture | #/library/transdigm/2025-06-30/changes | error | 1440 |  |
| fixture__library_transdigm_2025-06-30_changes__error__390.png | fixture | #/library/transdigm/2025-06-30/changes | error | 390 |  |
| fixture__library_transdigm_2025-06-30_modules__error__1440.png | fixture | #/library/transdigm/2025-06-30/modules | error | 1440 |  |
| fixture__library_transdigm_2025-06-30_modules__error__390.png | fixture | #/library/transdigm/2025-06-30/modules | error | 390 |  |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__sources-on__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 1440 | getByRole("switch", { name: "Show sources", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_overview__full__sources-on__390.png | fixture | #/library/halden-aerostructures/2026-09-30/overview | full | 390 | getByRole("switch", { name: "Show sources", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__sources-on__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 1440 | getByRole("switch", { name: "Show sources", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_modules_capital-structure__full__sources-on__390.png | fixture | #/library/halden-aerostructures/2026-09-30/modules/capital-structure | full | 390 | getByRole("switch", { name: "Show sources", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__full__sources-on__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | full | 1440 | getByRole("switch", { name: "Show sources", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_net-leverage__full__sources-on__390.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/net-leverage | full | 390 | getByRole("switch", { name: "Show sources", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_cs-limit-leases__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/cs-limit-leases | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__open-Item-22__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 1440 | getByRole("columnheader", { name: "Item", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__open-Item-23__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 1440 | getByRole("button", { name: "Item", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__open-Module-24__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 1440 | getByRole("columnheader", { name: "Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0014__full__open-Module-25__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014 | full | 1440 | getByRole("button", { name: "Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0042__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0042 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0042__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0042 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-0042__full__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-0042 | full | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-9999__error__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-9999 | error | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-9999__error__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-9999 | error | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_trace_T-9999__error__open-Show_how_Net_leverage_4.6x_was_derived-26__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/trace/T-9999 | error | 1440 | getByRole("button", { name: "Show how Net leverage 4.6x was derived", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-03__full__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-03 | full | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-03__full__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-03 | full | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-99__error__open-Module_All_Module-14__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-99 | error | 1440 | getByRole("button", { name: "Module: All Module", exact: true }) |
| fixture__library_halden-aerostructures_2026-09-30_evidence_gaps_G-99__error__open-Jump_to_an_item_Ctrl_K-16__1440.png | fixture | #/library/halden-aerostructures/2026-09-30/evidence/gaps/G-99 | error | 1440 | getByRole("button", { name: "Jump to an item Ctrl K", exact: true }) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Cash_flow-23__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("tab", { name: "Cash flow", exact: true }) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Balance_sheet-24__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("tab", { name: "Balance sheet", exact: true }) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Key_measures-25__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("tab", { name: "Key measures", exact: true }) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Table-36__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("radio", { name: "Table", exact: true }).nth(0) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Table-40__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("radio", { name: "Table", exact: true }).nth(1) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Table-44__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("radio", { name: "Table", exact: true }).nth(2) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Table-47__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("radio", { name: "Table", exact: true }).nth(3) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Table-51__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("radio", { name: "Table", exact: true }).nth(4) |
| fixture__model_transdigm_2025-06-30_statements__full__open-Table-55__1440.png | fixture | #/model/transdigm/2025-06-30/statements | full | 1440 | getByRole("radio", { name: "Table", exact: true }).nth(5) |
| fixture__run_start_start__full__open-Submit_spend_up_to_USD_20.00-8__1440.png | fixture | #/run/start/start | full | 1440 | getByRole("button", { name: "Submit, spend up to USD 20.00", exact: true }) |

