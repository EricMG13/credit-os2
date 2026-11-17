# S1 report: Shell, navigation, addresses, the kit page (static)

(Written by the worker; placed in this file by the `sections-static` controller because the Write tool refuses report files from subagents.)

Output files, all under `docs/audit/2026-11-16-final/output/2-sections/S1/`: `findings.jsonl` (20 findings), `harmony.csv` (18 rows), `probes/` (23 scripts; each runs from the repository root, makes its own temporary copy of `web/dist` and closes its browser; `connected-shell.mjs` starts and stops its own service on port 8761), `evidence/` (probe outputs and 5 small screenshots), `report.md`.

Counts: findings High 1, Medium 6, Low 11, Info 2 (20 total; `owner_decision: true` on S1-004 and S1-017). Inventory: 2,976 static lines, of which 2,412 shell, 336 library home at the bare addresses, 228 kit. Of those, 2,568 lines are exercised directly or covered by an identical control, and 402 (the Signal rail link) were deliberately not operated.

## Method

Audited commit is `main` 2b881075. I ran the shipped variant (`data.js` empty) and the fixture variant, at 1440 and 390 px (the shell also at 320, 480, 481, 600, 767, 768 and 1024). I also ran ten hand-made `data.js` variants, 260 random fixture mutations, and a connected-shell pass on `proof.serve` (`/`, `/runs`, `/start`, a report, a run, an unknown path). The impeccable skill is not installed (R7), so I applied the design rubric rule by rule. Every browser context blocked all hosts but loopback, `file:`, `data:` and `blob:`. Result: 0 blocked requests, 0 CSP violations, 0 console errors, no paid call, no Signal address opened.

## Findings

| Id | Sev | Finding |
| :-- | :-- | :-- |
| S1-001 | High | "Start a run" on the library home (bare addresses) goes to `#/run` (Run activity, saved example), not the start page `#/run/start/<draft>`. |
| S1-002 | Medium | Title is "Credit OS" on every page; route changes move no focus and announce nothing (both surfaces). |
| S1-003 | Medium | Mobile rail: the visible label is outside the link, so tapping it does nothing, and it is read twice (both). |
| S1-004 | Medium (owner) | The kit page is a reader rail item. It has unlabelled sample figures, 16 dead buttons, a "Start a paid run / USD 20" dialog, a "Reporting currency" field (retired R-09, R-18) and 4 looping animations. |
| S1-005 | Medium | A tooltip opened by keyboard focus is closed by the scroll that same focus causes (X1's Tooltip, seen on the kit). |
| S1-006 | Medium | "Clear filters" drops focus to `<body>`, and the control is missing from `clickables.jsonl`. |
| S1-007 | Medium | All 9 fixture runs show a USD 20.00 cap on a "Full credit review" (tier cap 25; retired R-09). This is S6's fixture. |
| S1-008 | Low | `#/kit/` shows "Page not found"; other addresses ignore one trailing slash. |
| S1-009 | Low | Below 480 px the rail content overflows its box by 1 px and the document scrolls (both). |
| S1-010 | Low | Back and Forward do not restore the scroll of `main`. |
| S1-011 | Low | Library is marked current for non-library addresses; with data missing, `#/model/…` shows the h1 "Library". |
| S1-012 | Low | Data and not-found states are one bare sentence; unlike causes read alike; the reader's raw reason is drawn. |
| S1-013 | Low | Any schema other than `credit-os-data/1` is called "newer"; the schema string is never read. |
| S1-014 | Low | Text under 13 px: rail labels 12, Timeline, MetricCard, step numerals 10 (D-30). |
| S1-015 | Low | The kit's Chart/Table group can be emptied; the chart frames' group cannot. |
| S1-016 | Low | The top-level `issuers` list is read only by an unreachable branch of `App.tsx`, yet one bad entry blanks every page. |
| S1-017 | Info (owner) | Both rails differ from decision 12's four items (harmony H-08). |
| S1-018 | Info | No matrix row accounts for the shell chrome, not-found page, data notices, Model rail item or kit. |
| S1-019 | Low | The rail's current item is a 1.21:1 tint and a 1.43:1 icon change, with no line (both). |
| S1-020 | Low | The skip link's `href="#main"` draws "Page not found" when opened outside its click handler. |

S1-001 and S1-006 are S2's controls, S1-007 is S6's fixture and S1-005 is in X1's file. Stage 4 should merge them with the same findings from those sections.

## Screens and states reached

- **`#`, `#/`, `#/library`.** Shipped (empty), fixture (Cards and List), no-match, filtered, and missing, newer, invalid, null, syntax-error and 404 data. Partial data: 260 random key deletions or nulls on 3 addresses gave no blank page.
- **`#/model`, `#/run` (bare).** The shell and address resolution only. Page content belongs to S5 and S6.
- **`#/kit`.** The interactive pass ran on the fixture variant. The shipped variant was opened, scanned by axe and reached through the rail.
- **Not-found and hostile addresses.** `#/no-such-page`, `#/kit/`, `#main`, `#/Kit`, `#//`, malformed escape, 2,000 segments, `<img onerror>`, `%00`, `__proto__`, `?x=1`, `#frag`. No crash, no echo of the address.
- **Loading** is not a state of the static app: `data.js` is read synchronously before first render.

## Controls against the 2,976 inventory lines

- **Shell rail** (Skip to content, Library, Model, Run, Signal, Kit; 2,412 lines, 402 per link).
  - Exercised directly: the five non-Signal links, with mouse and keyboard, on `#/`, `#/model`, `#/run`, `#/kit` and `#/no-such-page` (60 lines on S1's own addresses). Checks covered Tab order, Enter, `aria-current`, tooltips, focus ring, Back/Forward and a 390 px tap.
  - Covered by the identical control: about 1,950 lines on S2 to S6 addresses, spot-checked on a library history and overview and a model front page.
  - Not reached: Signal, 402 lines (R2).
- **Library home at `#`, `#/`, `#/library`** (336 lines, 91 distinct role+name).
  - Exercised directly at `#/`: search, 3 filters with options, Cards/List, List-only filters, issuer links (one followed with Back), metric buttons, Start a run and Clear filters.
  - Start a run and Clear filters also run at `#` and `#/library`. Control counts at all three addresses are identical.
  - Not reached: the Pathway and State option lists beyond opening them (S2 owns them).
- **`#/kit`** (228 lines, 93 distinct role+name).
  - Exercised directly: all 55 operable controls with mouse, Enter and Space, one fresh load each, plus tab arrows, 3 selects, both table sorts, drawer, 2 modals, file upload (chooser, delete, retry), tooltips, Chart/Table groups and link buttons. Drawer and modals close on Escape and return focus to the opener.
  - Not reached: the hidden React Aria "Dismiss" buttons (they exist only inside an open Select popover). Structure lines (rows, cells, panels, options) were read, not operated.
- **`#/no-such-page`.** 12 lines, shell only.
- **Connected shell** (the 129 lines the lead assigned to S1).
  - Operated: Skip, Library and Run on `/`, `/runs`, `/start`, a report and a run address at 1440 and 390 px.
  - Covered by the identical control: the other connected addresses.
  - Inventory gap: only "Clear filters" is missing from `clickables.jsonl`.

## Harmony

- **Matrix rows.** CM-035 (the only S1 content row) is `correctly not shown`. `control-matrix.csv` has no S1 row.
- **`retired.md`.** 12 items checked: 10 `not offered`, 2 `still offered` (R-09, R-18; S1-004, S1-007). R-21 not offered.
- **Unaccounted.** 5 rows, covered by S1-018, S1-004 and S1-017.
- **Figures.** 38 values on `#/` and `#/run` equal the fixture they come from, including adjusted-EBITDA labels and missing values drawn as `n.a.`, not 0. The 8 kit sample values equal their literals in `Kit.tsx` and `Kit7d.tsx`.
- **H-08.** My reading is that `docs/react-workflow.md` and both rails agree and decision 12 predates them; this is the owner's call.

## Design critique

- **No finding on these rules.**
  - D-10 offline and fonts pass.
  - D-33: 0 failing text pairs, and axe reports 0 violations on 14 screens.
  - D-34/D-38: focus rings on all 50 kit tab stops, and drawer and modal focus returns.
  - D-36: one h1 per screen, 52 kit headings with no skipped level.
  - D-40: 0 running animations under reduced motion.
- **Sub-24 px kit buttons** have clear space around them, so the spacing exception applies and nothing was written.
- **At 320 px** the kit has no page overflow.

## Code read

- **Dead or unread state.** In `App.tsx`, `LibraryBody`'s ok case and the `route === "" || "/"` test are reachable by no input. `LoadResult.newer.schema` is set and never read.
- **No defect found.** `route-table.ts`, `route.ts` and `source.ts`.
- **No error boundary in the static app.** No crashing input was found, so it is only an unexercised suspicion.

Not verified: Chrome and Edge on Windows (only Playwright's Chromium 1243); touch input and mobile browser chrome (`h-screen` against a dynamic address bar is untested); a screen reader (names and roles read from the accessibility tree and axe only); 200 % text size and text-spacing overrides (D-42 was checked by narrow widths only); the impeccable critique (skill not installed, rubric applied by hand); the drag-and-drop path of the kit's file drop zone; the kit's chart keyboard behaviour and the charts' text alternatives (X1's files); hover-only reveals other than the rail and kit tooltips; very long text in `PageHeader` (no S1 screen takes dynamic text); whether the static app can fail with no error boundary (no crashing input found); the `#/signal` address and the Signal rail link (out of scope); connected pages other than the shell frame; the shipped variant's kit by the full interactive sweep (the fixture variant ran it).
