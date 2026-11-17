# S3 section audit: Library modules (static app)

Audited commit: `main` 2b881075 (branch `audit/out-sections-static`). Files: `web/src/pages/library/Module.tsx` and the 18 parts
in `sections.md` row S3; routes `#/library/:issuer/:run/modules` and `#/library/:issuer/:run/modules/:module`. No service was
started (a static section opens the built `web/dist/index.html`); no paid call; no application, fixture or `web/dist` file was changed.
Every browser context blocked all hosts but loopback, `file:`, `data:` and `blob:` (ruling R8): **0 requests blocked, 0 console or
page errors on the 98 page loads of the address sweep (49 addresses at 1440 and 390 px) and on every other page opened**. Fonts load from `web/dist/fonts` (Geist, Schibsted Grotesk).

## Result in one line

38 findings: 0 High, 10 Medium, 22 Low, 6 Info (6 need an owner decision, 2 are hostile-input). 242 harmony rows
(216 content, 4 control, 12 retired, 10 unaccounted). 1,616 of 1,616 inventory lines covered. Probes in `probes/`.

## How the screens were reached

| Variant | How | Used for |
| :--- | :--- | :--- |
| Shipped | `web/dist/index.html` as built (`data.js` holds `issuers: []`) | the empty state of both routes |
| Fixture | copy of `web/dist` with `data.js` from `web/fixtures/*.json` through `writeDataFile` | every other state |
| Variants | copies of the fixtures changed in a scratch folder: very long text and an unbroken token, 53 modules, a missing and a zero value side by side, a malformed record, a run with no module | states the fixture lacks |

Addresses opened: all 49 `S3` addresses of `clickables.jsonl`, at 1440 and 390 px (Halden 2026-09-30, 2026-06-30 (loading),
2026-03-31 (capped), 2025-09-30; Brevane r-0412; the missing module `no-such-module`; the missing issuer `transdigm`), plus 320, 480,
768, 1024, 1280x720 and 1366x768 for reflow and navigator checks. Run `2026-06-30` is the only loading run; `transdigm` is not in the
library (S6 owns that link). The impeccable skill is not installed here (ruling R7): check 2 applied `design-rubric.md` rule by
rule to screenshots, computed styles and code.

## Controls covered (check 1)

1,616 inventory lines, 116 distinct role and name pairs. All were exercised by mouse and by keyboard (Tab, Shift+Tab, Enter, Space,
Escape) on at least one address of each screen type; the others are covered by the identical control on a sibling address.

| Group (inventory lines) | Exercised directly | Identical control on a sibling address | Not reached |
| :--- | ---: | ---: | :--- |
| Run frame: Library, Overview, Changes, Modules, Evidence, Report history, New run, Show sources (382; file is S2's) | 87 | 295 | none |
| Navigator module links (552) | 95 | 457 | none |
| Navigator section buttons (131) | 32 | 99 | none |
| Trace controls (73), drawer dialogs (69), drawer Close/Dismiss/Open in Evidence (276) | 418 | 0 | none |
| Limitations: collapse, Show all, gap links (127) | 25 | 102 | none |
| Questions rows (4), empty-state links (2) | 6 | 0 | none |
| **Total 1,616** | **663** | **953** | **0** |

Each control was checked for: the effect the code implies (address, content, request, state after reload), disabled, loading and
error states, focus, and Back and Forward. Results that matter:

- Navigator section buttons (Enter, Space, pointer) scroll to and focus the section's heading, set `aria-current`, leave the address
  unchanged. Their marker never follows scrolling (S3-025).
- Module links change the address and remount the page; focus and scroll are not handled (S3-001).
- 50 trace controls opened by keyboard on Business profile and Capital structure (21 + 29): each opens a modal drawer, moves focus
  into it, closes by Escape, Close, the X, the backdrop and the hidden Dismiss, and returns focus to the opener; Open in Evidence
  goes to the traced row and Back returns without the drawer. Focus ring fails on the Navy band (S3-002); three facts share one trace
  (S3-036).
- Questions accordion (native `details`): pointer, Enter and Space toggle it; state resets on reload (the first row opens).
- Limitations: collapse and expand work by pointer and keyboard; Show all and Show less appear only when the text overflows.
- Show sources switch: Space and pointer; kept in memory across modules, reset on reload (documented in `SourcesSwitch.tsx`).
- Run-frame links, gap links and `Back to the library` go where their `href` says, by pointer and Enter.
- Controls missing from the inventory: the stage 0 list was taken at 1440 px only; the six keyboard-focusable table scrollers that
  exist at 390 px are not in it (S3-038).

## Design critique (check 2)

Rubric rules applied to both widths: D-01 to D-06, D-11, D-12, D-14, D-15, D-16, D-21, D-24 to D-26, D-28, D-30 to D-44 (D-17 and D-45 to
D-48 belong to other screens). Findings cite the rule. Rules with nothing to report on these screens: D-07, D-10 (no host
contacted), D-13 parts 1 and 4 (no code, no table or row id on any module page; the text scan found none on 41 pages), D-18, D-19
(none used), D-20 (icons are the line set), D-22, D-23, D-27, D-29 (shapes differ across the module-state set), D-36 (one `h1`, `h2`
module name, `h3` sections), D-40 (reduce rule in `index.css`, code read only).

## States (check 3)

| Screen | Loading | Empty | Error | Partial | Missing vs zero | Long text | Narrow |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Module page, delivered | skeleton of run 2026-06-30 (S3-019) | shipped data (S3-008) | malformed record variant (S3-009) | Delivered with gaps; data module with only a bottom line (S3-014) | fixture n.a. / 0 / Withheld / gap, plus a variant with both | variant with 200-character leads, long unbroken token (S3-016) | 320, 390, 480, 768, 1024 (S3-003, S3-021, S3-029) |
| Module page, blocked | n/a | n/a | n/a | Not assessable, Not run (S3-012, S3-013) | n/a | n/a | 390 (S3-006) |
| Modules index | skeleton | shipped data | no such issuer, run, module | opens the first module | n/a | 53-module variant (S3-028) | 390 |
| Zero-module run | not rendered (S3-034) | | | | | | |

## Harmony (check 4)

`harmony.csv` holds every content row (216), control row (4) and retired item (12) for S3, and 10 unaccounted items.

- **Content rows.** 13 shown as required, 21 shown but wrong place or form, 20 correctly not shown, 162 missing. Read the 162 with care:
  85 need a component the static module vocabulary has no form for (S3-010, owner decision), 69 are per-module rows for which the
  fixture holds no such module while the component exists (S3-033, Info; H-25 says stage 2 should check what the fixture holds), 7 are
  the data module that shows only a bottom line (S3-014), 1 is the Model entry (S3-030). The renderer defects behind the other
  marks are S3-004, S3-005, S3-006, S3-007, S3-012, S3-013, S3-016, S3-027.
- **Control rows.** CT-041 decidable as required; CT-044 and CT-047 decide less than the row; CT-040 is a system decision the reader
  only sees (not reachable here).
- **Retired.** 12 items checked against 41 rendered module pages: none offered.
- **Figures.** 193 figures and cells (every record block of every fixture module, at 1440 px) were compared with
  `web/fixtures/library.json` by `probes/figure-fidelity.mjs`: value, period label, unit, row, column, n.a. versus zero, Withheld and gap
  forms all match; 0 mismatches. Also checked by hand: Net leverage 4.6x down 0.3x on 2025 (4.9x to 4.6x in the statement),
  Liquidity USD 412m down USD 43m on June (walk 455 to 412), net debt 2,236 = 2,398 - 162, walk 455 + 96 - 140 - 20 + 21 = 412.
  The expected values come from the fixture file, not from production code. `proof/handoffs/` is the connected app's data and was not
  used here.
- **Reader checks.** All 22 fixture bottom lines have a first sentence of at most 45 words and a whole passage of at most 180 words.
  A text scan of 41 module pages for CP codes, hashes, file names, ids, routing words, brackets and Markdown found only the label
  `Basis:` (S3-027).

## Code read (check 5)

Handlers that do nothing: none. State set and never read: none (`active` is read for `aria-current`; it goes stale, S3-025). Props passed
and unused: none in the static path; `hrefFor`, `traceForRow`, `hideEmptyValue` and `WatchRecord.detail` are used only by the connected
report and the static reader drops `detail` (S3-031). Branch no input reaches: the zero-module state needs an unusual slice (S3-034).
Duplicated blocks: `MetricsBlock` and `MeasuresBlock` are near twins, no action. Catch-all that hides a failure: none; `goTo`,
`ChartTableBlock` and `TraceControl` throw. Shadowed index in `StatementBlock` (S3-032). Measured costs for stage 6: none noteworthy.

## Findings

Medium: S3-001 module switch loses focus and keeps scroll; S3-002 focus ring on Navy 2.4:1; S3-003 Limitations header overflow at 480 px
and below; S3-004 charts drawn as tables only; S3-005 Limitations drawn last; S3-006 no search or picker in the navigator; S3-007 null
trace draws nothing; S3-008 empty state on shipped data; S3-009 malformed data shows its path; S3-011 Forecast hint at 2.19:1.
Low and Info are in `findings.jsonl`. Findings on files owned by S2 or S4 (`Limitations.tsx`, `RunFrame.tsx`, `TraceControl.tsx`,
`LibraryPage.tsx`, `Findings.tsx`, `App.tsx`) are registered here because they appear on module pages; stage 4 should merge them with the
owning section's twin.

Not verified: the impeccable critique (skill not installed, R7); how a screen reader announces any of these pages (no assistive technology was run; live regions, names and focus were read from the DOM); Edge and Chrome on Windows, Safari and Firefox (only Playwright's Chromium 1243 here); a touch device (the always-visible trace control on touch is a CSS rule); 200 percent text zoom and Windows high contrast; printing (the Limitations print rule); contrast of chart marks, hatch fills and the withheld stripe (text only, at 1440 px on three modules); reduced-motion behaviour (code read only); the zero-module "No modules in this run" state (S3-034); module-written text that holds a module code, so the display replacer (D-13 part 2) was not exercised; the connected report's use of `ModuleNav`, `MatrixBlock`, `QuestionsBlock`, `StatementBlock`, `StatusBlock` and `WatchBlock` (C3's); the trace drawer's own content (S4's) beyond what opens from these pages; any fixture or handoff other than `web/fixtures/library.json`.
