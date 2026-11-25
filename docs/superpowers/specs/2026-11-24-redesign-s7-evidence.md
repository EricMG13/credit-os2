# Redesign S7: Evidence page and trace drawer

2026-11-24. Branch `claude/redesign-s7-evidence`. Package S7 of
`docs/superpowers/plans/2026-11-24-frontend-redesign.md`. Phase 1 (spec); Verification at the
end is filled in during phase 2.

## 1. Screen-map rows covered

"Report · Evidence" (`docs/design/screen-map.md`), reader: Reviewer. Arrives from one figure and
asks "is this supported, and what is missing?". Evidence is the one page where machinery
(file names, hashes, ids, registers, gap ledgers, run codes) belongs.

| Rank | What | Form | Where | Needs |
|---|---|---|---|---|
| P1 | The trace asked for: sentence or figure, its source passage and location | Split view, claim left, source right | Top, when arrived from a trace control | Code |
| P1 | Gaps by severity | Three counts, then the list, most severe first | Summary tab | Code |
| P2 | Sources: used, and supplied but not used | Table: file, type, pages, hash, used by | Sources tab | Code |
| P2 | Script checks: pass, fail, not run | Matrix of check × module | Checks tab | Code |
| P3 | Handoffs, calculation JSON and Model downloads | File list with hashes | Record tab | Code |
| P3 | Run record: calls, cap, spend, models, timings | Key-value table, closed by default | Record tab | Code |

"On every screen", trace control row: "One small icon button, the same everywhere, top right of
its item." The trace drawer is the working-page side of the same data: it holds the claim, its
source passage with location, the basis line and one link into Evidence (Interfaces table: every
other page depends on `evidencePath`, `evidenceHref`, `PublishedSource`, `PublishedTraceProvider`;
signatures and behaviour unchanged).

Rank notes. Pages are not a bento (a reviewer reads down, not across); P1 is first and largest,
P2 follows, P3 is behind a disclosure or a lower tab. "Pages" in the Sources row: the handoff
carries cited pages only on a citation, so the page cell draws them where a citation records them
(see 4).

## 2. Blocks

All blocks are new files beside `Evidence.tsx` unless stated; the kit parts used are `Segmented`,
`StatsStrip`, `BarCell` (components/kit) and `Tile`, `Well`, `GapNote`, `Figure`
(`report/overview/Tile.tsx`). No second copy of a kit part, no hex colour, no inline style.

### 2.1 Frame: `Evidence.tsx` (`ReportEvidence`, props unchanged)

Header row: `h2 Evidence`, the Module `<select>` (kept: it keeps the module in the address) and
the `Segmented` control "Evidence sections" with Summary · Trace · Sources · Gaps · Checks ·
Record. Segments are links to the existing addresses `#evidence/summary|trace|sources|gaps|checks|record[/MODULE]`
(unchanged routing, `evidenceRoute` is kept). Checks keeps its accessible name "Script checks, n of m"
and its segment is absent when the run holds no script checks (as today: the address falls back to
Summary). States: `data`, `empty` (no records: each tab shows its designed empty state with the
reason), `invalid address` (the existing alert). Loading: only the downloads and the run record
load (they load their own resources and say so as a status).

1440 px: single column, `max-w-6xl`; blocks full width. 390 px: single column; the segmented
control wraps (it is `flex-wrap`); tables sit in a labelled, focusable scroll region so the page
itself never scrolls sideways.

### 2.2 Summary tab (P1 gaps, then the run's evidence)

1. `GapCounts` (new file `EvidenceGaps.tsx`): a `StatsStrip` of High · Medium · Low counts, plus one
   more stat "Other or not stated" only when a gap carries another or no severity (the handoff's
   own term is never relabelled). Zero is the number 0 for a module that wrote gaps; with no
   gap records at all, the designed empty state, not three zeros.
2. `GapLedger`: the list, most severe first, grouped as today (`severityGroups`: High, Medium, Low,
   other stated terms, none stated), each row: severity badge, the gap's own words, the module (and
   alternate-handoff label), and "Open handoff line" (the existing link). The Summary draws the
   ledger without the recorded detail; the Gaps tab draws it with it (one component, `detail` prop).
3. "Run evidence" `Tile`: handoffs, source files, recorded gaps, script checks that ran, handoffs with
   an unlocated Basis (the existing sentences, same text).
4. Handoffs: the handoff list with its ZIP (existing `EvidenceHandoffs`, restyled as a table
   with the module, the handoff's SHA-256 from `output.sha256`, its download). Present on Summary,
   Trace (nothing chosen) and Record, as before (a behaviour test pins that).

### 2.3 Trace tab

When arrived from a trace control (`#evidence/<id>~<sha>-<line>`): `TraceSplit` (new file
`TraceSplit.tsx`) at the top. Left, "The claim": module · section heading, the statement, the basis
line, the qualification. Right, "The source": the source passage (quoted excerpt) with its
location (file, pages as `citedSourcePages`, the cited source's hash where the chip carries one)
for every chip the line cites; when none: the gap state "No source passage recorded for this
item" with the Basis line's own words. 7/5 split at 1440 (`lg:grid-cols-[7fr_5fr]`), claim above
source at 390. Under the split, the existing derivation tree and source records
(`TraceDetailsView`) and the handoff's own section(s) (`EvidenceLocation`), unchanged in content.
The claim and the source are drawn from the same `Trace` the drawer draws (`traceForLine`), so
drawer and page cannot disagree.

Arrived at a handoff without a line: its heading, download and sections as today. No handoff
chosen: the instruction sentence (kept word for word) and the handoff list; for CP-8 the
comparison measures block passed in as `comparison` (kept).

### 2.4 Sources tab (P2)

One table per group, in the ruled order: "Used by a module", "Supplied, not used", "Not recorded as
used". Columns File (name; the module-written warning under it), Type, Document date, Cited
pages (where a citation in this module's handoffs names the file: from `snapshot.chips` through
`citedSourcePages`; otherwise the cell states "Not cited"), Used by ("Read by all N modules" or
the module names), SHA-256 (mono). The groups are kept apart by their headings and a count
badge; "supplied, not used" is never merged with the used rows. Missing type, date, hash keep
their words ("Document type n.a." etc.); no cell is blank. Module filter as today.

### 2.5 Gaps tab

`GapCounts` + `GapLedger detail`, as 2.2, with the recorded detail column and the module filter.

### 2.6 Checks tab (P2) — `ScriptChecks.tsx`

`ScriptCheckMatrix` (new file): rows are the checks (the title the check card already uses:
register · figure), columns are the modules that hold a record; each cell is the status word in a
badge with an icon (agreed teal; disagreed, contradicted, missing orange; not checked gray; any
other status literal), with the number when a cell holds several outcomes; an empty cell is "—"
with the screen-reader text "no check recorded". The column header links to
`#evidence/checks/MODULE`. A `StatsStrip` above counts outcomes by the recorded status word.
Under the matrix the existing per-module disclosures (accepted attempt, response hash, scripts
and their hashes, each outcome's stated and recomputed figures) are kept unchanged in content;
they are the matrix's drill-down. The two explanatory sentences are kept word for word.

### 2.7 Record tab (P3)

Order: the handoff list and ZIP (2.2 item 4); model and calculation downloads
(`ArtifactDownloads`, same fetch, same statuses, same two notes; the buttons stay in a wrapping row);
`RecordedModelQualifications` and assumption registers for CP-2G (unchanged); then "Run record" as
a heading over one `<details>` that is closed by default and holds `ReportRecord` (S2's file,
unchanged: calls, cap, spend, models). Its summary line says what is inside. Existing test order
"Run record before Handoffs" in a heading list is a layout pin and is rewritten (see 3).

### 2.8 Trace drawer — `TraceDrawer.tsx` and `TraceParts.tsx`

Same props, same `SlideoutMenu`, same Close and "Open in Evidence" controls (one link into Evidence,
`onPress={onClose}`). Content, in the reviewer's order: header (heading, subtitle, module · line);
"The claim" (statement; the qualification as its own captioned line); "Source passage" (quote,
with its location: source name and pages; sources are plain text, never a link); "Basis" (the
basis line from the derivation tree's Basis node, or the gap state "Basis was not recorded for
this item"); "How it was derived" (the existing `DerivationTree`, open); cited sources. The drawer
and `TraceSplit` share `TraceParts.tsx` (`TraceClaim`, `TraceSourcePassage`, `TraceBasis`,
`CitedSources`) so there is one drawing of each.

Caption texts "Source excerpt" and "Qualification" are kept (tests for the library drawer pin
them).

## 3. Files and tests

Add: `report/EvidenceGaps.tsx`, `report/EvidenceSources.tsx`, `report/EvidenceHandoffs.tsx`,
`report/TraceSplit.tsx`, `report/ScriptCheckMatrix.tsx`, `library/parts/TraceParts.tsx`, with a
test file each (written before the block). Change: `report/Evidence.tsx` (frame; moves blocks
out), `report/ScriptChecks.tsx`, `report/ArtifactDownloads.tsx` (tile in the new look, same
behaviour), `report/PublishedTrace.tsx` (only if the context shape needs a field; signatures
unchanged), `library/parts/TraceDrawer.tsx`. Delete: nothing.

Tests kept as they are: `Evidence.test` (gap counting, linking, filters, stale address, retained
files, citation identity), `Evidence.contracts`, `Evidence.t21`, `Evidence.t21-fix1`,
`Evidence.finalAudit`, `Evidence.handoff-title`, `ScriptChecks`, `ArtifactDownloads.states`,
`TraceControl.missing`, `TraceReadable`, the drawer assertions in `RunFrame.test`,
`ConnectedApp.test`, `LibraryIndex.metricTrace`, `Confidence.recovery`, `Forecast.recovery`.
Rewritten (they pin layout, class names or the old nesting) and recorded in the report: the
download row class test if the row moves, "Run record before Handoffs" heading order, any
`closest("section")` icon test for the empty states if the container changes, and tests that read
a Run record value without opening the closed disclosure (they open it first; the assertion is
unchanged). Each rewrite keeps its assertion about values, links or states.

New tests: split view shows claim and source side by side and a gap when no passage;
gap counts exact and "Other or not stated" only when present; ledger order; used and not-used
sources stay in separate groups with exact hash; Checks matrix cell for each status incl. empty,
exact counts, header link; Record disclosure closed by default and opens; drawer shows the five
sections in order, basis gap, one Evidence link; every address and download still resolves
(`evidencePath` round trip into the new Trace tab).

## 4. What is drawn as a gap today, and why

| Gap state | Why |
|---|---|
| "Cited pages" cell for a file no citation names | The handoff names pages only on a citation; the page is never inferred. "Not cited" in the gap treatment |
| A source passage for a line whose chips carry no excerpt | The handoff records no passage; the Basis line's words are drawn beside the gap state |
| Run-record timings for a run whose log could not be read | `ReportRecord` already states it; unchanged |
| Typed severity counts for CP-5's own clearance | Method change (screen-map: CP-5 typed counts); this page counts the gap rows modules wrote |

No new figure is computed: counts are of rows the handoffs wrote, matrix cells are the recorded
status words.

## 5. Sub-agent plan

- Spec and data-reading blocks (`GapLedger`/`GapCounts`, `TraceSplit`, drawer, matrix): this
  session on Sonnet, high effort, tests first.
- Presentational restyle of `ArtifactDownloads` and `EvidenceHandoffs` and the sources table,
  and rewrite of tests that pin layout: Sonnet sub-agent, medium.
- One independent review of the session's diff (given the code, not this conclusion) on Opus,
  high, before reporting: numbers not in a handoff, missing shown as zero, a source reference
  on a working page, a weakened behaviour test, 390 px overflow, keyboard.

## 6. Requests to the coordinator

None blocking. Noted: `report/Record.tsx` (S2) is wrapped, not edited; if S2 renames
`ReportRecord`'s props the wrapper changes.

## 7. Verification

Run on the synthetic Northbridge run (`20261124-222235-01`, Full pathway), built with `npm run build`,
viewed through `react_frontend`. Screenshots at 1440 and 390 px of Summary, Sources, Gaps, Checks, Record
and the Trace tab arrived at from the drawer's "Open in Evidence", and of the open drawer, were looked at.

What I saw:
- Summary: segmented control with the current section tinted and dotted, "Checks 10 of 215" as a mono count; a
  Gaps tile (this run records no gaps: the compact "No gaps recorded" state, no zeros drawn), a Run evidence
  tile, the Handoffs table (name, SHA-256, download) and the model and calculation files tile.
- Sources: one table per group; file, type with date, cited pages ("Not cited" in the gap colour, as the
  synthetic handoffs cite no page), used by, full SHA-256. At 390 px the table scrolls inside its own labelled
  region; the page does not scroll sideways.
- Checks: outcome counts strip (9 agreed, 205 not checked, 1 noted), then the check × module matrix in a region
  capped at 32 rem with a sticky header and first column; per-module disclosures closed below.
- Record: Handoffs, model files, then two closed disclosures (model notes and assumption registers; run record).
  The record page fell from 7,500 px to 1,780 px at 1440.
- Trace: arrived from the drawer at line 48 of Fundamental credit: claim tile left (7/12), source tile right (5/12)
  with the gap state, derivation below; stacked at 390 px.
- Drawer, 1440 and 390 px: subtitle line, heading, the claim, the source gap state, derivation, Close and
  "Open in Evidence".

Not seen on a screen: the synthetic run records no gaps and no source passages, so the populated gap ledger,
the populated source passage beside the claim, and a "disagreed" matrix cell are proved by tests
(`EvidenceGaps.test`, `TraceSplit.test`, `TraceParts.test`, `ScriptCheckMatrix.test`, `Evidence.redesign.test`),
not by screenshot. Not run: the retained TransDigm fixtures through the new page; `npm run build` ran, but not
`npm run gates`, the file-open gate or Python tests that read the build; the Python quality gate (no Python
changed).

Checks run: `npx tsc --noEmit`; `npx eslint --max-warnings=0` on every changed file; `npx prettier --check`;
`npm run unused` (the one remaining item, `LeadProps` in the frozen leads types, is not mine); `npm run build`;
`npx vitest run src/pages/connected src/pages/library src/pages/model`: 211 files, 3,790 tests, all passing.

Tests rewritten because they pinned layout (assertion kept, container or order changed): `Record.test`
(opens the closed run record first; scopes region names to it), `Evidence.contracts` (run record is last and
closed), `Evidence.finalAudit` (group headings carry a count; handoff container is a labelled region, not an
`article`), `Evidence.t21` and `Evidence.t21-fix1` (same container change; hash drawn in mono rather than a
`code` element), `Evidence.test` (opens the closed run record), `ScriptChecks.test` (a status word now shows in
the strip, the matrix and the card). No test was deleted or skipped.

### Independent review (Opus, given the diff only) and what changed

Confirmed and fixed: cited pages on Sources were read from every run's chips and matched by file name
only (now only this run's handoffs for the chosen module, matched on name and hash, with a test for another
run's and another module's citations); the drawer said "No source passage was recorded" for traces that carry
no passage by design (Model items, confidence fallback), so that sentence now shows only on the Evidence
Trace tab, where the handoff line is known; a second `Bento` nested in the Record disclosure; the hash is
a `<code>` element again (the old assertion is restored); the Sources group headings are h4. Left as
designed: the drawer shows the Basis line and the derivation tree also holds it; matrix rows without a
register or figure merge under "Check". `eslint` reports one pre-existing error in `report/stages.ts` (S2/S1
territory), not changed.

## Coordinator review 673ce7c: second pass

Numbers are the coordinator's. Rendered on the synthetic run at 1440 and 390 with a Playwright route that
adds fixture data to the snapshot (gaps worded "HIGH", "High (blocking)", "Critical", "Low" and unstated; a
citation with a quote and a long passage; a citation whose page text could not be read; a source with no
hash; an unused and an unrecorded-use file). No tab or the drawer scrolls the page sideways at either width.

- 1 Sources "Cited as" shows the citation as written (attested pages where attested, else the chip's label);
  "Not cited by a handoff" or, with a module selected, "Not cited in <module>"; sources with no hash match by
  file name; the column says its scope.
- 2 "Use not recorded" for the unrecorded group; "Not read by any module" for supplied-not-used.
- 3 The source tile shows each citation (label, file, attested pages, quote, chip reason, hash); "No passage
  text was recorded for this citation" plus the reason when a quote could not be read; the none-recorded gap only
  when the line has no chip. The drawer from a handoff line carries the same; a drawer whose trace does not know
  its citations says where to look instead of claiming none exist.
- 4 Model notes and assumption registers are open on Record. The run record opens by default when the run
  has a comparison note or problem, so "Review comparison evidence" lands on it.
- 5 Severity read by leading word without case or space; other words kept as written and grouped; the three
  counts are left out when no gap states a rank; the order is stated in the tile and the table caption.
- 6 The matrix is gone (see 8). 7 The register wrapper is `grid-cols-1 min-w-0`.
- 8 Checks rebuilt by the Opus sub-agent: outcome counts, module × outcome table, checks grouped by outcome
  (disagreed first; "not checked" closed), never merged across modules, checking record table.
- 9 Model and calculation files are a list; the artifact listing publishes no hash, so each row says "No hash
  published" (stated gap). The run record sits in a `Disclosure` tile; `Record.tsx` (S2) is wrapped with
  descendant overrides (no card in a card, its own "Run record" heading hidden to the eye, not the tree). What
  I needed from S2: a `flat` prop on `ReportRecord` and a key-value rendering of the totals; not done here.
- 10 The Trace tab: one claim tile (claim, qualification, basis), the source tile (passages capped at 15 rem,
  scrolling), "How it was derived" without the Basis row, source records, then the handoff location.
- 11 Summary leads with the Run evidence figures (a strip) and a one-line "No gaps recorded".
- 12 Module select sits in the control row beside the tabs (32 px, 44 px at 480 px and below).
- 13 `text-sm` removed from my files. 14 `GapNote` is used for the none-recorded state; inline stated gaps use a
  new `GapText` (hatched frame, plain chip); `Disclosure` replaces the hand-copied tile classes.
- 15 Drawer is full width at 390 (`max-[480px]:pl-0`), footer buttons 44 px. The header close button is the
  slideout component's and stays 36 px (request: a larger close target in `components/application`).
- 16 Gap table: column heads with scope, a caption, severity once (the group heading; the written wording only
  where it differs), stacked blocks under 768 px. 17 Targets 32 px, 44 px at 480 px and below.
- 18 Sources: own Document date column, hash on one line when it fits, stacked rows on a phone.
- 19 Test loosening reverted: the group heading is asserted as name plus count; the forecast-inputs `pre` is
  looked up inside the handoff region; the hash is a `<code>` again.

Test edits this pass that pin layout: the summary figures are asserted on the strip (label and value), the
Gaps tests read the group heading instead of a severity cell, the file-list row replaces the button row, and
the derivation heading is "How it was derived".

## Coordinator review cd9e936: third pass (T1–T8)

- T1 The register section is `grid-cols-1 min-w-0`, the model id wraps. `document` and `main` scrollWidth were
  measured on every Evidence tab and each Record address at 1440 and 390 on the synthetic run, plain and with the
  fixture: all equal the viewport width.
- T2 Every drawer on a report page now carries the page's citations: `PublishedTraceProvider` supplies a lookup
  (`TraceCitations` context) that resolves the trace's own `evidenceItem` address to its handoff line, so callers in
  other sessions' files change nothing. Opened from Overview, Modules and Forecast on the fixture: a line with no chip
  says "No source passage was recorded for this item" (as Evidence does); a line with three chips lists all three
  (label, file, pages, quote, reason, hash), each passage capped at 15 rem and scrolling. A trace outside a report
  (library fixtures, the Model) draws its own excerpt, capped, or nothing.
- T3 A citation under a different hash reads "Cited as <label> under a different hash" with the cited hash.
- T4 Per-row "No citation names this file"; above the tables, plain counts of the recorded reasons "page cited without
  a source key" and "the Basis file is not in the Source readiness inventory", each with a link to the first line.
  On the synthetic run: 54 and 13.
- T5 Record addresses: `#evidence/record/run`, `/comparison` (same block), `/notes`, `/files`, also after a module
  (`record/CP-2G/notes`); `#evidence/record` still works. The target is scrolled into view and focused after the frame's
  own scroll reset (verified: the block lands at the top of `main`). The run record is first on the tab again, as in
  the base, and opens by itself when the run has a comparison note or problem; the notes block is closed unless it is
  the target. The contracts test title and assertion agree again ("after the run record").
- T6 A word counts as High, Medium or Low only when the severity is that word (case and surrounding space ignored, an
  optional parenthetical allowed). "Medium-High", "High/Medium", "Critical", "critical" and "Not recorded" are their
  own groups and counts; words the page does not rank come first, in the order written; "Not recorded" as written is
  apart from "No severity stated" (distinct keys).
- T7 A source without a hash says "Matched by file name; the source has no hash". Only the designated handoffs'
  citations are read.
- T8 No selectors reach into `Record.tsx`. The run record sits in a plain disclosure (a boxed summary row; its own
  "Run record" heading shows inside). "Source row" links are 32 px, 44 px at 480 px and below.
- S1's request: `PublishedSource`'s fallback is the same trace chip (32 px, 44 px at 480 px and below), same name.

Hrefs for the integration pass (the frame's `useReportPlace` resets `main` to the top on a new address; Evidence
re-lands after it, so the old hrefs also work, but they open the Record tab at its top):
- Forecast.tsx:249 "View model records in Evidence", Forecast.tsx:431 "Model notes and limitations",
  Forecast.tsx:548 the qualification trace control, LegacyForecast.tsx:571 and :1020: `#evidence/record/notes`.
- Changes.tsx:414 "Review comparison evidence": `#evidence/record/comparison`.

## Coordinator review 3e69902: fourth pass (Y1, Y2, wrapping)

- Y1 Sources no longer matches reasons by pattern. Every chip of a designated handoff that is not attached to a
  supplied file (no file, or a file the run does not hold) is listed under "Citations not matched to a supplied
  file", one line per recorded reason as written (`54 · page cited without a source key`), with an exact count and a
  link to the first line; a chip with no reason is counted under "No reason recorded". A chip that names no file but
  whose label starts with a supplied file's name (the Basis route writes `<file> p.N · ambiguous`) is shown on that
  file's row as "Cited ambiguously: <reason>" and so does not read "No citation names this file". Ambiguity found by
  a key word rather than a file name (`key.word`) names no candidate file and stays in the list. Tested with every
  reason the backend writes. Chips for rows that cite no page ("the row cites no page or register", "the cell says Not
  supplied") are chips too, so they are counted as recorded (270 and 103 on the synthetic run).
- Y2 "Search evidence" leads Evidence, above the tabs. A typed query replaces the page with matches grouped as Handoff
  lines, Sources and Gaps, each with a count, in document order, capped at 50 per group with the cap stated; a status
  region announces the counts or "No match for …"; clearing returns the current tab. Plain case-insensitive substring
  of every word; no ranking or fuzzy matching. Handoff lines: designated handoffs' headings, paragraphs and table
  rows (a row matches on its cells together). Sources: file name, type, date, hash and group label. Gaps: title and
  module, as on the Gaps tab (alternate handoffs' gaps included and named). Not searched, and said on the page:
  script check outcomes, the run record and the text of the source files (the report holds only the passages the
  handoffs cite).
- Wrapping: `wrap-anywhere` on the shared stacked-table cell class and on the Trace tab's citation label and passage.
- `check-render.cjs` (copied from the coordinator branch) on summary, sources, gaps, checks, record and one trace
  address at 1440 and 390, plain, `--stress`, a fixture (200-character file name, 400-character unbroken excerpt, an
  ambiguous citation, gaps worded "HIGH", "Critical" and others, an unused file) and both together. Nothing in
  Evidence's own files fails. What it still reports is not mine: the shell nav (`ul`, not focusable at 390),
  `Record.tsx` (summary rows 24 px, "Download instructions" 36 px, "Return to Forecast" 20 px), and the derivation
  tree's `summary` rows (34 px at 390) in `library/parts/DerivationTree.tsx`, whose `ROW` class needs
  `min-h-8 max-[480px]:min-h-11`.

## Final review 4333756: B1–B4 and the small ones

- B1 A search query belongs to the address it was typed at; a new address (following a result) clears it.
- B2 The list under Sources is headed, visibly, "Entries on handoff lines not attached to a supplied file", with the
  caption "Counted by the reason recorded, as written." (it counts chips, most of which record that nothing is cited).
- B3 A file's row stays under a module filter when a citation in scope names it; the list is drawn outside the
  empty-state conditional. Test: rows and list hold every designated entry in scope, with and without a module.
- B4 A file-less label attaches to the longest supplied name it starts with, once; rows compare by that owner.
- Search: the not-searched sentence names citation labels and cited passages; rows join cells with a space; the
  "No match" echo is capped at 80 characters. Evidence.test ties "Critical" to the row's group again.
