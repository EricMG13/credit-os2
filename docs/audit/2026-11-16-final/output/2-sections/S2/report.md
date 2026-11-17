# S2 section audit: Library home, history, overview, changes (static app)

Audited commit: `main` 2b881075, on `audit/out-sections-static`. Scope is `web/src/pages/library/{Home,History,Overview,Changes,routes}.tsx`, `read.ts`, `slice.ts` and the 24 parts the S2 row names; routes `#/library/home`, `#/library/:issuer/history`, `#/library/:issuer/:run/overview` and `…/changes`. No service was started (static section), no paid call was made, and nothing outside the S2 folder was written (scratch is in `/tmp/ss-S2/scratch`). Evidence paths in `findings.jsonl` and `harmony.csv` are repository paths. Every probe runs from the repository root, copies `web/dist` into its own temporary folder (removed on exit) and blocks every host but `file:` and loopback.

(Written by the worker; placed in this file by the `sections-static` controller because the Write tool refuses report files from subagents.)

## Result in numbers

| Item | Count |
| :--- | ---: |
| Findings | 35: High 0, Medium 8, Low 17, Info 10 (6 need an owner decision, 2 are `hostile-input`) |
| Inventory lines (`clickables.jsonl`, section S2) | 448 |
| exercised directly | 201 |
| covered by an identical control on a sibling address or state | 219 |
| not reached | 28 (see below) |
| `harmony.csv` rows | 108: content 82 (shown as required 31, correctly not shown 29, shown but wrong place or form 15, missing 7), control 5, retired 11, unaccounted 10 |
| Figures checked against the fixture they come from | 475 value, period, unit and wording checks, 0 mismatches (`probes/figure-fidelity.mjs`) |
| Requests to another host / console or page errors | 0 / 0 across every address and state visited (offline rule R8) |

## What ran, by screen type

Both data variants of the static app, at 1440 x 900 and 390 x 844 (320 for reflow only), Chromium headless shell 1243, all hosts but `file:`/loopback blocked, every timeout capped.

- **Shipped build** (`web/dist/data.js`, `issuers: []`): the four route types. Each shows only "This data file holds no library pages" (S2-002).
- **Fixture build** (`web/fixtures/*.json` written by `fixture-data.mjs` into a copy of `web/dist`): `#/library/home` (Cards, List, filters, bands, sort, no-match, loading card), the history of every issuer (Halden 7 runs, Brevane, the five issuers without a readable report, no such issuer), Overview of Halden 2026-09-30 (full), 2026-03-31 (capped), 2025-09-30, 2026-06-30 (loading), Brevane r-0412, no such run and transdigm, and Changes of the same runs (compared, capped compared, first run `none`, `pending`, loading).
- **Edited copies of the fixture** (never the real files): zero cards, long card, long overview, sparse Overview (no metrics, no For and against, no callout), zero versus missing versus withheld versus gap, long changes, long history, invalid slice, duplicate issuer, dangling run link, and delivered `yearChange` and `tone` (`probes/states.mjs` and the individual probes).

## Check 1, wiring

Operated with the mouse and the keyboard, with Back and Forward, on every distinct control:
- search (type, whitespace, clear);
- the three selects (mouse, Enter, arrows, Escape);
- the Cards/List and Cards/Table groups (mouse, arrows, Space);
- List sort (click, Enter; ascending, descending) and the three range bands;
- "Clear filters" and card links;
- the List grid (single tab stop; ArrowRight into cells; links and figure tooltips on focus);
- run tabs (the disabled Forecast tab is plain text with `aria-disabled`);
- the Show sources switch (Space; persists across run pages in memory, resets on reload);
- every trace control opener type (mouse, Enter, Escape, Close, scrim; focus returns to the opener each time);
- Limitations collapse, "Show all", "See the N gaps in Evidence", the 13 module links and the header links.

Every link resolves, Back and Forward return to the previous address, and no control did nothing, except the non-link module item whose chevron implies it would (S2-023). Unusual addresses (`__proto__`, malformed percent escapes, 3,000-character ids, a trailing slash, a query) give "No such issuer/run" or "Page not found" without a console error (`probes/odd-addresses.mjs`).

Findings: S2-003 (scroll offset and focus after navigation), S2-014 (focus lost after Clear filters), S2-020 (filters and layout lost on Back), S2-024 (every "New run" opens the TransDigm draft). S2-030 to S2-035 record the controls and states that no matrix row covers.

## Check 2, design critique (fallback)

The impeccable skill is not installed in this cloud session (R7). I applied `output/1-rubrics/design-rubric.md` rule by rule to the screenshots at both widths and to the component code, honouring `.impeccable/config.json`. Its two ignores concern one mockup file and do not apply. Rules checked with a measurement:
- D-30 (computed font sizes on every address);
- D-41 (target sizes: only the hidden switch input and short text links are under 24 px, and the spacing exception holds);
- D-36 (one h1; headings in order on all four types);
- D-10 (fonts: 7 faces loaded, Schibsted Grotesk and Geist in use);
- D-31, D-32 and D-42 (states and reflow).

I did not raise the mock-derived radii (10 and 14 px) or the 30 and 40 px figure sizes, because `docs/design/mocks/library.md` names them. Findings: S2-004, S2-005, S2-012, S2-019, S2-021, S2-023, S2-025.

## Check 3, states

| State | How reached | Result |
| :--- | :--- | :--- |
| loading | the fixture's loading card (home) and run 2026-06-30 | designed skeleton, no accessible text (S2-015) |
| empty | zero-card copy; five issuers without a report; first run; shipped build | S2-001 and S2-002; the first-run and `pending` pages read well |
| error | no such issuer or run, invalid slice, odd addresses | "No such issuer/run" is fine; an invalid slice shows the reader's path text under the h1 (App.tsx, S1) |
| partial | no metrics, no For and against, no callout | draws without a gap in the layout |
| zero versus missing | edited copy and the capped run | 0, n.a., withheld and gap each have their own form (D-14 pass) |
| very long text | edited copies | wraps at 1440; narrow-width overflow is S2-005 and S2-029 |
| narrow window | 390 and 320 px | S2-004, S2-005, S2-021 |

## Check 4, harmony

`harmony.csv` holds every content row whose section is S2 (82), the five control rows, the 11 retired items an S2 page could offer and 10 things S2 shows that no row covers.

- Where the fixture holds no case (no Earnings Update or short-snapshot run, no net debt block, no ratings), the row is marked `correctly not shown` with "not applicable" in its note, following H-25.
- Rows the static reader has no field for are marked `missing` (S2-009, S2-010).
- CT-028 is marked `not reachable here` (S2-030). The decision is made on the run start page; S2 only draws its result.
- Every unaccounted item cites a finding (S2-001, S2-004, S2-015, S2-018, S2-023, S2-031 to S2-035).
- Nothing on `retired.md` is offered. A scan of 16 addresses found no module code, source reference, register id, pipeline word, report.html, memo, Excel, post-mortem or better/worse mark.
- Figures: 475 checks of every card, list cell, history entry, metric, point, finding, date, limitation, module item and change against `web/fixtures/library.json`. The screen is exact, but the fixture contradicts itself on basis, period and pathway (S2-008).

## Check 5, code read

Read in full: Home, History, Overview, Changes, routes, the 24 parts, and `read.ts` lines 160-760 and 2018-2165.
- No handler does nothing, and no catch-all hides a failure (`readSlice` rethrows anything but a `SliceError`).
- Unreachable on the static data path: `yearChange`, `tone` and ChangeCard's `source` prop. They are drawn only for the connected report, and the static reader drops the fields (S2-010).
- Duplicated blocks: four empty states (S2-027).
- Import placed after use: S2-022.
- Static-to-connected imports: S2-026.
- The reader checks trace keys and module links against the run, but not a card's `href` or a history `report` (S2-028).

## Not reached

28 inventory lines:
- 12 on the home are unnamed popover scaffolding and the visually hidden "Dismiss" buttons of the select popovers.
- 16 are derivation-tree rows (Result, Formula, Input, Source) inside the trace drawer, which S4 owns. The drawer itself was opened and closed by every route above.

The drawer contents, the Evidence pages that "Open in Evidence", "See the N gaps" and the module links lead to, and module page content were left to S3 and S4. For those I only checked that the links resolve and where scroll and focus land. `#/signal/…` was never opened (R2).

Not verified: the impeccable critique (skill not installed; rubric applied by hand); Chrome, Edge and Firefox (only Playwright Chromium headless shell 1243); a real touch device (the "always shown on touch" trace rule was not seen); screen readers (names and states were read from the accessibility tree only); pinch zoom and 200 percent text size; print layout; contrast ratios (rubric table values assumed, none sampled); reduced motion and the Running badge halo; the real data path (no Python writes `credit-os-data/1`, so only the fixture and edited copies were drawn); the connected report's use of these parts (C3 to C5).
