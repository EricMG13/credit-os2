# S4 report: static library Evidence and trace

Audited commit `2b881075` (checkout on `audit/out-sections-static`). Section S4: `Evidence.tsx`, `EvidenceSummary/Sources/Trace/Gaps/Record.tsx` and the 14 parts named in `sections.md`, on the routes `#/library/:issuer/:run/evidence` and `…/evidence/{summary,sources,trace,trace/:item,gaps,gaps/:item,record}`. Static surface only. No service was started (the static app opens from disk), no paid call was made and no `#/signal/…` address was opened.

Every browser context blocked all hosts except loopback, `file:`, `data:` and `blob:` (ruling R8). There were zero blocked requests, zero console errors and zero page errors on any S4 address in either variant. Every font and icon drew from `dist/`. No R8 finding.

(Written by the worker; placed in this file by the `sections-static` controller because the Write tool refuses report files from subagents.)

## Output files

All under `docs/audit/2026-11-16-final/output/2-sections/S4/`.
- `findings.jsonl`: 26 findings (High 1, Medium 11, Low 9, Info 5).
- `harmony.csv`: 114 rows (91 content, 6 control, 9 retired, 8 unaccounted).
  - Content: shown as required 12, shown but wrong place or form 26, missing 48, correctly not shown 5.
  - Control: decidable as required 1, decides less than the row 2, not reachable here 3.
  - Retired: not offered 8, still offered 1 (the module-code column on Record, S4-008).
  - Unaccounted: 8, each citing a finding.
- `probes/s4-probe.mjs`: one probe file with a named check per finding. Run it from the repo root with `node docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs all`. It copies `web/dist` to a temporary folder, writes the fixture data into the copy and removes it. It starts no service.
- `evidence/`: 9 screenshots, each cited by a finding.
- `report.md`: this text.

## Screens and controls covered

Data variants: shipped (`web/dist`, no issuers, so every Evidence address shows the empty notice) and fixture (a copy of `web/dist` with `web/fixtures/*.json`). Two further fixture copies (long text, one invalid field) were made in a scratch folder. No application file was changed.

| Screen type | Addresses opened | States reached and how |
| :--- | :--- | :--- |
| Summary (`evidence`, `evidence/summary`) | Halden 2026-09-30, 2026-03-31, 2025-09-30; Brevane r-0412 | full; zero counts on the three runs with no trace (fixture) |
| Sources | same four runs | full; "Show the other 4 files" expanded; module filter with and without a result |
| Trace | same four runs | full; empty (run traces nothing); `trace/T-0014` (open derivation), `trace/T-0042` (no derivation), `trace/T-9999` (error: no item has this address); module filter empty state |
| Gaps | same four runs | full; severity groups including "Not ranked"; `gaps/G-03` (marked row), `gaps/G-99` (error); module filter |
| Record | same four runs | full; disabled "Open" with its reason (Withheld register); timings with a module that never ran (`n.a.`) |
| Loading | Halden 2026-06-30, all five tabs | the run skeleton |
| Not held | `#/library/transdigm/2025-06-30/evidence` | "No such issuer" |
| Shipped empty | all five tabs | "This data file holds no library pages" |
| Trace drawer (S4 part, opened from Overview) | Halden 2026-09-30 | open by keyboard and mouse; Escape, X, footer Close, overlay, "Open in Evidence"; 1440 and 390 px |

Both widths (1440 x 900, 390 x 844) were shot for every fixture address and for the shipped build. Full-height captures stayed in the scratch folder; only the ones a finding cites are in `evidence/`.

Inventory: `clickables.jsonl` holds 4,131 S4 lines on 96 addresses (3,969 full, 106 error, 56 loading), 93 distinct role-and-name controls.

| Coverage | Lines | What |
| :--- | ---: | :--- |
| Exercised directly (mouse and keyboard, request and address checked) | 471 | every control of the ten Halden 2026-09-30 addresses: tabs; module filter (open, arrows, Enter, Escape, option click, clear); Jump to an item (click, Enter, Ctrl+K, typing, arrows, Escape, overlay, pick a figure and a gap); sort buttons; derivation chevron and `<summary>` toggles (Enter, Space); "Shown on / under …" links; copy buttons (refusal toast); downloads; "Show the other 4 files"; the drawer controls |
| Covered by an identical control on a sibling address | 3,068 | 58 `trace/<drawer key>` addresses (3,016 lines) that all draw the same warning and table (S4-024); the same controls on the other runs' tabs; the run frame's Library, Show sources, Report history, New run, Overview, Changes and Modules controls (S2's `RunFrame`, exercised once on Evidence) |
| Not reached | 592 | other-run lines, counted as sibling coverage where the control is identical (tabs, filter, Jump, sort). Genuinely unreached: the 237 visually hidden "Dismiss" buttons react-aria adds inside the open Jump and Module dialogs (not tab stops, never operated), and `SourceFileLinks` in the drawer (no fixture trace has `sourceLinks`, so its links and the "Pages follow the source supplied" note never draw) |

## Checks run

1. **Wiring.** Failures are S4-003, 004, 005, 006, 018, 019 and 021.
2. **Design critique.**
   - The impeccable skill is not installed here (ruling R7), so the rubric was applied by hand to the screenshots and components at 1440 and 390 px (D-05, D-06, D-13, D-21, D-24, D-26, D-30, D-31, D-32, D-34 to D-44).
   - Findings: S4-007, 008, 015, 016, 017.
   - Passes: long text wraps in full with no ellipsis (a 600-character sentence, a 180-character unbroken id and a 140-character file name, both widths). A missing value in a derivation draws the hatched `n.a.` form and a real zero draws `0`. Table-head contrast is 5.17:1 and cell contrast 5.68:1. There is one h1 and no skipped heading on any tab. Focus rings are present on tabs, sort buttons, chevrons and the filter.
3. **States.** Reached: loading, empty (shipped; run with no trace), error (unknown item, unknown gap, invalid data), partial (Sources with a held-back file; a module with no rows), missing versus zero, long text and narrow width.
4. **Harmony** (`harmony.csv`).
   - Figures against the fixture: all strings of the five tabs (run code, both hashes, nine file names with sizes and hashes, 59 trace rows, 7 gaps, the Record tables) were compared with `web/fixtures/library.json`. None was missing or altered on screen.
   - Arithmetic checked: net leverage 2,398 − 162 = 2,236 and 2,236 ÷ 486 = 4.6x; timings (accepted minus started) for six modules; gap counts 2 / 3 / 2; file states 7 / 1 / 1; reader avatars plus "+N" equal "Read by N modules".
   - The mismatches found are between figures inside the delivered data, not between screen and data (S4-001, S4-002, S4-009).
   - CT-036, CT-041 and CT-049 are "not reachable here" (S4-025). The four unaccounted controls and badges are S4-026.
5. **Code read.** S4-022 and S4-023 (Info).
   - No handler that does nothing, no unused prop and no failure-hiding catch-all was found in the 14 parts; the `catch` in `CopyToast.tsx` shows its failure.
   - `read.ts` refuses several malformed inputs (unique file names, counts equal to rows, items held), so several hostile-input cases cannot reach the pages.

## Findings by severity

- **High:** S4-001. The Summary tile "Calculations 59 – Each one traceable to its inputs" is false: 58 of the 59 Trace rows open no derivation, and Record's calculation register says 148.
- **Medium:**
  - S4-002: 57 of 58 trace drawers list no source.
  - S4-003: dead downloads in the fixture.
  - S4-004 and S4-005: focus lost to the body.
  - S4-006: module filter scope.
  - S4-007: narrow tables.
  - S4-008: module-code column on Record.
  - S4-009: partial Record tables.
  - S4-010: no document date on Sources.
  - S4-011: no registers or confidence inputs on Record.
  - S4-012: no comparison content on Evidence.
- **Low:** S4-013 to S4-021 (states, small text, toast, Jump search, inert switch, document title, duplicate "Close").
- **Info:** S4-022 and S4-023 (code), S4-024 (inventory seeded from drawer keys), S4-025 and S4-026 (matrix does not account for them).
- **`owner_decision: true`:** S4-006, 008, 011, 019, 025.

## Not reached, and why

- The connected report's Evidence is C5's. The synthetic service was not started, so the S4 parts it draws (`TraceDrawer`, `DerivationTree`, `DownloadButton`, `SourceFileLinks`, `TraceControl`) were audited on the static pages only.
- `SourceFileLinks` and the `?page=` note never draw (no fixture trace has `sourceLinks`).
- Only one run (T-0014) has a derivation in the fixture, so Evidence with every row carrying a derivation was not seen.
- Real clipboard success: a page opened from disk in headless Chromium refuses `navigator.clipboard`, so only the "Could not copy" toast was reached.
- Only headless Chromium (build 1243) ran. Touch behaviour of the trace control was judged at 390 px width, not on a touch device.

Counts: 26 findings (High 1, Medium 11, Low 9, Info 5); 114 harmony rows; inventory lines 4,131 (471 exercised directly, 3,068 by identical sibling control, 592 other-run lines treated as sibling or not reached as above).

Not verified: the impeccable critique (skill not installed here, rubric applied by hand); the "Copied" success toast and real clipboard writes; browsers other than headless Chromium and touch behaviour; Evidence with real delivered data, since the shipped build holds none and no fixture trace carries `sourceLinks`; the connected report's use of S4 parts (C5); CM-324 (portfolio-workbook failure wording), which no fixture run exercises; CT-036, CT-041 and CT-049, which no static screen can show; the 237 hidden react-aria "Dismiss" buttons; whether the static Record should draw per-module registers and confidence inputs (owner decision, S4-011).
