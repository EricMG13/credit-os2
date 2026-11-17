# Fidelity capture for stage 5 step 9

Step 9 of `stages/5-repair.md` asks, for every presentation change, for the values, periods, units,
sources and limitations on screen to be compared with the handoff, before and after. This folder holds
the tool that records what is on screen, the "before" record, and the tool that compares a record with
the handoffs. `capture.mjs` records the screen only and reads no handoff; `compare.mjs` reads the handoffs
and the fixtures (see Comparison).

| Path | What it is |
| :--- | :--- |
| `capture.mjs` | One Node script. Captures both surfaces into an output folder. |
| `before/` | The capture of the tree before any stage 5 repair (see `before/index.json`, `tree`). |
| `after/` | Not present. Made by the lead on the merged branch, as below. |
| `compare.mjs` | One Node script. Compares a capture with the handoffs (connected) and the fixtures (static); `--diff` compares two comparisons. |
| `compare-selftest.mjs` | Changes a copy of `before/` in known ways and checks that `compare.mjs` reports each change. |
| `compare-before.json`, `compare-before.md` | The baseline: `compare.mjs` on `before/`. |
| `compare-after.json`, `compare-after.md`, `compare-diff.md` | Not present. Made by the lead, as under Comparison. |

## Run the "after" capture

On `audit/final-repairs` with every repair merged, from the repository root:

```
export PATH=$HOME/.local/bin:$PATH
npm --prefix web run build          # the capture reads web/dist, not web/src
timeout 600 node docs/audit/2026-11-16-final/output/5-repair/fidelity/capture.mjs /tmp/fid-scratch/after
```

Write trial captures outside the repository (as above) and copy `after/` in once the run is clean.

- It needs `web/dist` built from the merged code, `.venv` (`uv sync --locked`), Playwright from
  `web/node_modules` and the chromium headless shell under `/opt/pw-browsers` (`CHROMIUM_PATH` overrides).
  It makes no network call and no paid call: the connected surface runs `proof.serve`, which substitutes
  canned responses.
- Both surfaces take about 2 minutes. `--surface connected` or `--surface static` runs one of them
  (about 1 to 1.5 minutes each); the other surface's files in the same folder are left as they are, and
  `index.json` is rebuilt from what is there.
- Check `after/index.json`: `tree.webDistSha256` must differ from `before/index.json` if the build changed
  (an equal value means `web/dist` was not rebuilt and the "after" shows nothing). `tree.fixtures` must
  equal the "before" unless a fixture was repaired on purpose.
- Exit code 0 means every screen was captured, every screen's digit groups in `innerText` were accounted
  for (`coverageGap` 0 in `counts`), and every "Show sources" control opened a drawer. Exit 1 says which
  not.
- Port 8851 must be free. The service gets its own new root `/tmp/fid-<random>` (15 characters), is stopped
  at the end, and the root is removed, also on SIGINT and SIGTERM.
- Development aids: `ONLY=<text>` captures the screens whose id contains the text;
  `FID_ATTACH=<url> FID_RUN=<run>` uses a service that is already running with a finished run;
  `FID_CONCURRENCY` (default 3) is the number of pages captured at once.

### Compare

```
B=docs/audit/2026-11-16-final/output/5-repair/fidelity/before
A=/tmp/fid-scratch/after
diff -rq $B $A                                   # which files differ (index.json always does)
for f in $(cd $B && ls connected/*.json static/*.json | grep -v _surface); do
  for k in outline figures sources limitations tables chartTableViews sourceDrawers; do
    diff -q <(jq -c ".$k[]?" $B/$f) <(jq -c ".$k[]?" $A/$f) >/dev/null || echo "$f: $k differs"
  done
done
diff <(jq -c '.figures[]' $B/connected/overview.json) <(jq -c '.figures[]' $A/connected/overview.json)
```

A screen file has one key per line and one array item per line, so `diff` shows exactly the lines that
moved. A screen missing from one side is a screen the tree no longer reaches (or a failure; read
`index.json`). Every difference is then read against the handoff: for the connected surface the canned
handoffs are `proof/handoffs/*.md`; for the static surface the source is `web/fixtures/*.json`. `compare.mjs` does that
reading for figures, source lines and limitations (see Comparison).

## What a screen file holds

`connected/<id>.json` and `static/<id>.json`, one per screen, plus `index.json` (the screens with their
counts and file hashes, the tree and runtime versions, the normalisations, per-surface totals).

| Key | Content |
| :--- | :--- |
| `screen`, `page` | Id, address, whether it is an extra, the variant, the page title and every heading. |
| `outline` | Every piece of visible text in reading order, each with the heading path it sits under and a kind (`heading`, `cell`, `item`, `term`, `definition`, `paragraph`, `control`, `link`, `chart-text`, ...). This is the complete baseline: a number on screen is here exactly as drawn (sign, unit, thousands separator, minus glyph). |
| `figures` | Every drawn value with a digit or a missing marker (`n.a.`, a dash, `Not supplied...`, `Not calculated...`, `Withheld`): the text as drawn, its number tokens, the heading path, and the label, period, unit and basis drawn beside it. In a table cell the label is the row header, the period and unit come from the column header or a Period or Unit cell in the row, and the basis and source from the Basis or Source cell. In a card or paragraph the runs drawn in the same card are in `beside`, with label, period, unit and basis picked from them. In a chart the series and group are in `attrs`. |
| `tables` | Each table: label, column headers, rows (row header, every cell, the names of the source controls in the row). |
| `sources` | Source lines on the page: Source columns, a Sources section, text that starts `Basis` or `Source:`, text that names a file or a page. |
| `limitations` | Limitation sentences: everything under a heading that mentions limitations, qualifications or gaps, and text that reads as one (`Not supplied`, `could not`, `unavailable`, `withheld`, ...). |
| `chartTableViews` | For every chart, the same record taken with its Table view chosen (the exact values behind the drawing). |
| `sourceDrawers` | The source drawer behind every "Show sources" control, opened with the keyboard in the Table-view state (a superset of the Chart-view controls): its text, its tables and the "Open in Evidence" address. |
| `marks` | Chart marks: every element with a `data-*` attribute (series, group, missing versus zero, bar or step), rounded to 3 decimals, and a drawn size in whole pixels for bars and steps. |
| `controls`, `links`, `images` | State of switches, radios and selects (with all their options), every link text and address, and the accessible names of text-less marks. |
| `screenReaderOnly`, `coverage` | Screen-reader-only text apart from the drawn text, and the check of digit groups in `innerText` against what was captured. |

`<details>` and closed disclosure buttons are opened before the read. The viewport is 1440 by 900, reduced
motion is on, and a page is read when its markup has stopped changing. Heuristic fields (`label`,
`period`, `unit`, `basis`, `via`) are best effort; `outline` and `tables` are not heuristic.

## What is captured

Counts are from `before/index.json`.

| Surface | Screens | Figures | Detail |
| :--- | ---: | ---: | :--- |
| Connected | 29 (25 asked for) | 2,577 (2,218 in the default views, 359 in chart Table views) | 63 tables, 82 source lines on screen, 3,933 lines in 445 source drawers, 228 limitation sentences |
| Static | 89 (85 asked for) | 1,712 (1,427 in the default views, 285 in chart Table views) | 30 tables, 74 source lines on screen, 633 lines in 105 source drawers, 353 limitation sentences |

**Connected.** `proof.serve` on port 8851 with its own root; one synthetic run submitted the way
`web/scripts/connected-proof.mjs` does it (Northbridge Synthetic Group, as of 2025-03-31, Full credit
assessment, the three files under `proof/` uploaded, `northbridge-credit-agreement.txt` chosen as the
executed agreement, one Moody's B1 rating, every limit ticked, one approval, "Start synthetic run"),
then the report:

- Asked for: Overview; Changes; Modules (the tab's landing page and each of the 14 module pages,
  `modules--CP-0` to `modules--CP-DR`); Forecast (Base case, and `forecast--case-downside-shock`); every
  Evidence tab (`evidence--summary`, `trace`, `sources`, `gaps`, `checks`, `record`).
- Extras, so that a later change to them can be compared: `history` (the Report tab), `calendar`
  (Issuer calendar), and `changes--paired-run-fixture` with `--presentation-table`. The real run has no
  earlier run, so its Changes page only shows "No earlier run to compare". The paired-run screens show the
  comparison as drawn, from a snapshot into which an earlier run and a comparison pack were injected in the
  browser (copied from `checkChangesTrace` in `connected-proof.mjs`). They are labelled as a fixture, not a
  run.

**Static.** `web/dist/index.html` from disk, in a temporary copy of `web/dist` whose `data.js` is written by
`web/scripts/fixture-data.mjs` from `web/fixtures/*.json`, the "fixture" variant of stage 0's crawl
(`0-baseline/probes/static/crawl.mjs`); `web/dist` is not touched.

- Asked for: for each library run in the fixture (Halden Aerostructures 2026-09-30, 2026-06-30, 2026-03-31,
  2025-09-30 and Brevane Marine r-0412): Overview, Changes, Modules (`--modules` and one screen per module
  in the Modules navigation), and the Evidence tabs listed in its Evidence navigation (summary, trace,
  sources, gaps, record); for TransDigm 2025-06-30, the six Model pages (front, analysis, statements,
  portfolio-fit, limitations, forecast). Variants: `statements--case-downside-case`, and
  `changes--presentation-table` where the page has a Cards/Table choice (Halden 2026-09-30 and 2026-03-31).
- Extras: `library--home`, the history page of each issuer that has runs, and `model--runs`.
- The fixture is sparse. Only Halden 2026-09-30 Business profile and Capital structure carry tables, charts
  and source drawers. Its other module pages, and the module pages of the older runs, hold a short bottom
  line, key findings and limitations with no source control (Recovery draws "Not assessable"). Halden
  2026-06-30 is `loading: true` in the fixture and draws only the run header and navigation. Each issuer and
  date is a separate screen.

### Determinism

Screen files are the same from one capture to the next on the same tree: two full captures of both surfaces
in a row (`diff -r`) were byte-identical, `index.json` included. What is rewritten, in the page before
anything is derived and again on the finished record (`index.json`, `normalised`): run ids
(`YYYYMMDD-HHMMSS-NN` and the id the service issues) to `<run-id>`, dates with a time of day and times of day
to `<time>`, `/tmp/fid-*` paths to `<root>`, whole-value elapsed durations (`7 s`) to `<duration>`, and
generated `react-aria<digits>` ids to `react-aria`. The `data-collection` attribute is not recorded.
Source hashes and evidence addresses are stable between runs and are kept. In `index.json`,
`tree.commit` and `tree.branch` follow HEAD; `tree.treeIds` (`web`, `src`, `proof`, `prompts`) and
`tree.webDistSha256` follow the code.

## What it leaves out

- Anything not text, state or a `data-*` mark: colours, tone (red or green), fonts, spacing, alignment,
  icons, focus rings, animation, line breaks. Layout shows only as the rounded pixel size of bars and
  steps, at 1440 by 900.
- Other widths (the 390 and 375 pixel layouts), dark mode, print, zoom, other browsers.
- Hover and focus states: chart tooltips, `title` attributes, CSS `content` text.
- Show sources on: the switch only changes the border of the source controls, so it was left off.
- Choices other than those above: the per-module filter on the Evidence tabs
  (`#evidence/<tab>/<module>`), the compare-with and cash-interest selects on the Downside page, the
  Figures or Bars choice on the Model statements page, sorting, search and filters on lists, modules with
  more than one output (`#modules/<module>/<output>`).
- Pages not asked for: Start a run, Run activity and progress, the connected library index, the kit page,
  the page behind an "Open source file" link, evidence deep links (`#evidence/<id>~<hash>-<line>`), the
  static trace and gap item addresses (`.../evidence/trace/T-0001`, `.../evidence/gaps/G-01`; the trace
  table, each derivation, each drawer and each gap row are captured on their tab), the contents of the
  download links. Signal is out of scope.
- The handoff side of the comparison: `capture.mjs` reads neither `proof/handoffs/*.md` nor `web/fixtures/*.json`;
  `compare.mjs` does (see Comparison).

## What nothing captured

- The "after": no capture of the merged branch exists, so no screen has been compared.
- Any real run. The connected data is one synthetic run with canned handoffs (Moody's B1 and every figure
  are synthetic), not a live model run and not a real issuer. A capped, failed or
  interrupted run, a run with an earlier run on the same pathway (apart from the injected fixture), and a
  Lite or Deep pathway report were not captured. The static surface is the design reference fed by
  fixtures (owner decision OQ-01), not a report of a real issuer.
- That the heuristic fields classify correctly on a changed screen: `label`, `period`, `unit`, `basis`,
  `sources` and `limitations` are picked by patterns over the text and the card it sits in; `outline` and
  `tables` are the complete record and the only part the capture claims is complete (and the digit-group
  check in `coverage` covers digits only, not words).
- That a number drawn as a mark with no text (a bar's length, a dot's position) is right: marks carry the
  attributes and a pixel size, not the value the pixel size stands for.
- Reproducibility on another machine, browser version or font set: the check was two runs on this machine
  (Node v22.23.4, chromium headless shell 153.0.8010.12); the pixel sizes of marks depend on rendering.
- The source-drawer text for a control that is hidden or covered at 1440 by 900: every control the page
  had opened (445 and 105); none failed to open.
- Hover-only content, narrow layouts, colour and tone, and every page and choice listed under "What it
  leaves out".

## Comparison

`compare.mjs` compares every figure, source line and limitation sentence a capture recorded with the text the
screen came from, and lists the source items a screen should show and does not. Node only; it reads the
capture folder, `proof/handoffs/*.md`, `web/fixtures/library.json`, `web/fixtures/model.json`, `proof/northbridge-*`
and `web/src/pages/connected/api.ts` (the module names), makes no network or paid call, and gives byte-identical
output for the same inputs (about 3 seconds for both surfaces). `compare-selftest.mjs` changes a copy of
`before/` in 28 known ways (a digit, a sign, a unit, a unit left out, a period, a value drawn as missing, a missing
value drawn as zero, a chart bar for a missing value, a zero bar for a value, a reworded sentence, a drawer's handoff
line and basis, on both surfaces) and fails unless each is reported.

### Run it

```
export PATH=$HOME/.local/bin:$PATH
F=docs/audit/2026-11-16-final/output/5-repair/fidelity
node $F/compare.mjs $F/before                       # the baseline: writes $F/compare-before.json and .md
node $F/compare.mjs /tmp/fid-scratch/after --out $F # the after: writes $F/compare-after.json and .md
node $F/compare.mjs --diff $F/compare-before.json $F/compare-after.json --out $F/compare-diff.md
node $F/compare-selftest.mjs                        # the tool still detects what it should
```

The output name is the capture folder's name (`--name` overrides it); `--out` is the folder written (default: this
folder); `--repo` names the repository root (default: found from this folder). A capture folder with one surface
only (`--surface` was used) is compared for that surface only.

The diff prints, per surface and class, the count before and after; a verdict; then the items that are new in the
after (`source has it, screen differs`; `not found in source`; source items newly not on screen), the ones gone,
and the screens whose counts moved. Exit code 1 means the after has a new `source has it, screen differs` item
or a new source item not on screen; each is listed. A new `not found in source` item is listed as "review" and
does not change the exit code. Items are the same item in both runs when screen, kind, view, heading path, label,
column and drawn text are equal, so a repair that changes a drawn text shows as one item gone and one new; read
both lists together. If the two comparisons were made from different handoffs or fixtures the diff says so.

Reading the baseline: `compare-before.json` and `.md` are `compare.mjs` on `before/`, the tree before any stage 5 repair
(`capture.tree` in the JSON). The after must not have more `source has it, screen differs` items, more source items not
on screen, or more `not found in source` items than it, unless each new one is explained; the diff lists them.

### What it writes

`compare-<name>.json`: `counts` (per surface, kind and class), `perScreen`, `derivedSummary` (each named computation
with the number of items, whether `compare.mjs` recomputed it and where it is computed), `omissionSummary`,
`differences` (the `source has it, screen differs` items), `omissions` (source items a screen should show and does
not) and `items`, one per line. An item has `surface`, `screen`, `kind`, `view`, `section`, `label`, `column`,
`period`, `unit`, `basis` and `text` as drawn, `class`, `via` (the rule that decided it), `source` (`loc`: file and
line, or fixture path; `text`) and, as they apply, `differs`, `derived` (`name`, `verified`) and `note`.
`compare-<name>.md` is the short report: counts per surface and class, per kind, every difference, the screens with a
difference or omission, the derived computations and the omission matrix.

Kinds: `figure` is a drawn value (an item of `figures`, in the page view and in each chart's Table view; and, with `view`
`chart mark`, one item for each bar, zero bar and "n.a." mark of a chart drawn from a handoff table);
`source` and `limitation` are the capture's `sources` and `limitations` entries; `drawer` is what a source drawer
states (its statement with the handoff line it names, and its Basis line).

### Classes

| Class | Meaning |
| :--- | :--- |
| `matches source` | The same digits, sign, unit and period are in the source item the screen attributes it to, or in the same module's handoff (for a page that is not one module's, any handoff). `via` says which. |
| `derived` | A value the page computes. `derived.name` says what; where it is computed is in `derivedSummary`. `verified` is true only where `compare.mjs` recomputed or checked it from the source: the Overview year-on-year changes, the module confidence score, the event counts, years and status words, and that a chart's value-axis ticks are evenly spaced at a round step. All other derived items are named only. |
| `not found in source` | The screen shows something no source item of its scope has, and no rule names a computation for it. |
| `source has it, screen differs` | The source item the screen attributes it to is identified and a digit, sign, unit, period, or the missing-versus-zero reading, differs. `differs` lists which: `digits`, `sign`, `precision` (the same number with other decimal places: 3.20 drawn as 3.2), `unit`, `unit missing`, `period`, `text`, `value drawn as missing`, `missing drawn as zero`, `zero drawn as missing`, `missing drawn as a value`, `value drawn as zero`, `zero drawn as a bar` (chart marks), `source line`, `basis`, `basis not in source`. |

### The matching rules

All comparisons first normalise: NFKC; U+2212 becomes `-`; `**` and backticks are dropped; whitespace is collapsed;
words compare without case; a CP code in a source text becomes the module name, as the page draws it. A sentence
compares without case and punctuation, except the point and comma inside a number. A number is its sign, digits and
decimals: thousands commas are removed (1,250 = 1250), `(10)` is -10, a leading `+` is ignored, trailing zeros are
kept. A date or period phrase is taken out of the text before its numbers are read and is compared as a period:
ISO dates, `30 Sep 2026`, `September 2027`, `2025-Q3`, `Q3 2025`, `FY2024`, `FY2025E`, `2025-06`. Units: `US$m`,
`USD millions`, `$...m` are one unit; `x`; `%` and `% NAV` are one unit. A missing value is `Not supplied...`,
`Not calculated...`, `Not assessable`, `Not established...`, `Not ranked`, `n.a.`, `Withheld` or a dash.
A period or unit conflicts only when both the screen and the source state one and they differ.

**Connected: a figure.** The first rule that applies decides.

1. Page wording with a digit (`SHA-256`, "Compare with the 5% move", the `n.a. means the figure is missing` legend): `derived`.
2. Event cards: `Historical 9`, `Scheduled 18` (rows of the `### Events:` tables by Status, in the module's tables, or all
   modules on the calendar), a year (some Event date starts with it) and a status word: `derived`, recomputed; a count that differs: `differs`.
3. `N designated handoffs, M source files`: equal to the run request's counts (14 handoff files, 3 uploaded files): `matches`.
4. A 64-hex digest: equal to the SHA-256 of a file `proof/northbridge-*`: `matches`; any other: `derived` (the delivered handoff, which has a
   request-and-sources preamble, is not in the repository).
5. The run's own record (`evidence--checks`, `--record`, `--summary`, `--gaps`, `--sources`, `--trace`): `derived`, named, unless the text equals a handoff sentence: `matches`.
6. A chart's value-axis tick (chart text with no series, step or tick attribute): `derived`; verified when the chart's ticks are evenly spaced
   at a step of 1, 2, 2.5 or 5 times a power of ten (that they cover the data is not checked). Other chart text without an attribute (the node counts of an edge map): `derived`, named only.
7. Overview headline cards (Net leverage, Gross leverage, Interest coverage, Revenue, Adjusted EBITDA, Cash): the value must equal the
   latest-period cell of the CP-1 `Chart data:` table for that measure (column and unit from the table), the period must be that
   row's, and a unit the source has must be drawn; the change (`-0.75x vs FY2023`) must equal the latest minus the prior period,
   recomputed here in exact decimals, with the prior period named: `matches` / `derived` (verified) / `differs`.
8. A module's `Confidence score`: recomputed from the module's own `Confidence inputs` table with the weights, gate and penalties
   documented in `src/deploy_workflow/confidence.py` (half to even): `derived` (verified) or `differs`.
9. The run header (the issuer heading, no deeper section): the as-of date, pathway, issuer, Moody's B1 Negative and the module and source-file counts
   equal the run request (constants in `compare.mjs`, from `web/scripts/connected-proof.mjs`): `matches`.
10. Keyed cell: a table cell, a chart's Table-view cell or a chart value label is compared with the cell of the handoff table of the same name (a
    `Chart data: ` prefix is dropped), the same first-column cell and the same column header (a chart label: the series column, with its group if known).
    Equal: `matches`. Not equal: `differs`, with the reason from the list above.
10b. Chart marks (the capture's `marks`: a bar, a zero bar, an "n.a." text, with series and group or step), for a chart whose title is a handoff table's:
    the cell of that table at the group (or step) and series must be missing for an "n.a." mark, zero for a zero bar and neither for a bar; else `differs`
    (`missing drawn as a value`, `value drawn as zero`, `zero drawn as a bar`, `value drawn as missing`, `zero drawn as missing`, `missing drawn as zero`).
    This is a separate item, not part of the figure rules.
11. Period-only text (`FY2024`, `2025-03-31 · day`, `Published 2024-11-07`): every period must occur in some source item of the scope.
12. A missing marker: equal to a source missing cell; else, on the forecast and calendar pages, `derived`; else, for a card named after a handoff row, that row must
    hold a missing cell (`matches`; none: `differs`, `value drawn as missing`); else a missing cell must exist somewhere in the scope (`matches` by existence, cell not identified).
13. Text: exact (or inside a longer source item, or a source item that is at least 80% of it); words of one cell plus numbers of the same row
    ("Passes at or below 5.0 x"); for a sentence of five words or more, the nearest source sentence (word overlap 0.7 or more) with the digits compared
    (`differs` if they differ, `matches` if only the wording does); for a shorter text, each number token (same sign and digits) found in a source item without a
    period or unit conflict (a bare number of one or two digits needs the figure's label beside it in the source).
14. The pages the handoffs do not carry (`forecast`, `forecast--case-downside-shock`, `calendar`): `derived`, named only. (The Forecast page also draws
    handoff chart data; those items match by rule 10 or 13 first.)
15. A card whose label or heading is the first cell of a handoff row: its numbers must be among that row's: else `differs`.
16. Otherwise `not found in source`.

**Connected: limitation sentences and source lines.** On the run's own record pages: as rule 5. Otherwise: page wording (state
words, module names, and short headings, controls, links, captions and terms) is `derived`; an event card or status word as rule 2;
the sentence equal to, inside, or around a source item, with a column name before it ("Limitation Illustrative rate shock"): `matches`; a period-only text
whose periods occur: `matches`; an uploaded file name (`proof/northbridge-*` or a file named in a handoff), also as `Open source file: <name>`: `matches`;
the nearest source sentence with other words: `differs` (`text`); else the forecast page's `derived`, else `not found`.

**Connected: source drawers.** Each drawer yields one item. It names `<module> · Handoff line N`, states a statement and may carry a Basis line. The candidate
handoff lines are those whose statement the drawer states: a paragraph or bullet (its text), a table row (its cells as `Header — cell` pairs, in order, a
column the page leaves out may be skipped), a table's first line (its heading). The delivered handoff has a preamble, so N is the file line plus an offset
that is the same for a module; the module's offset is the most common one over its drawers, and a drawer at another offset is `differs` (`source line`).
Expected basis: the `Basis:` line under a paragraph, or the cells of the row's columns named basis, source or evidence (all rows for a table's first line). The drawer's
Basis must contain every expected value and otherwise only other cells of that row, or, if it has no Basis line, the statement must contain them. A drawer that
says "Basis was not recorded" where the source has one is `differs` (`basis`); a basis where the source has none is `differs` (`basis not in source`). A statement
on no handoff line is `not found` (on the forecast page the drawer's own sentence for the model inputs is `derived`).

**Static.** The source is the fixture: the page's own subtree (the run's `head` and its overview, changes, one module, one evidence tab with the run's
`traces`, a model page with its header), then the rest of the same run. Another run or issuer is never a source. Every string, number and null of
the subtree is a source item, with the labels above it (`label`, `title`, `name`, `item`, `id`, ... of its object, or of the object around a `{ text }` value), the
row label and column of a table row (`columns` and `rows[].cells`, or `periods` and `rows[].cells[]`), and composites (every pair of an object's short
strings; a derivation tree flattened). Order: page wording with a digit; a missing marker must exist in the run as a null, a gap, a withheld value or a
missing-looking string (cell not identified); period-only text must occur in the fixture; the text equal to a source item of the page (`matches`) or, a
weaker `via`, of the run; for a short value, the source items of the page under the figure's label (and column): equal to one is `matches`, none is `differs`;
for a sentence, the nearest sentence with the digits compared; otherwise the numbers found in an item without a conflict, else `not found`.
Limitations and source lines and drawer lines: the text, or the nearest sentence (`differs`), or `derived` for page wording, else `not found`.

**Source items a screen should show and does not.** Connected: for each handoff, each Bottom line, Key findings, Contrary evidence and Limitations line
(and every line of any other `###` section) and each table row. A line is shown when its text (numbers without thousands commas, module names as drawn) is
on the module's screen. A row is shown when its first cell is on the module's screen (or the module's chart Table views) and every other cell not named basis, source
or evidence is too; a basis, source or evidence cell is shown when it is drawn or is in one of the module's source drawers. `verdict`: `not drawn`, `row not drawn`,
`some cells not drawn`, `basis not shown`, `in the source drawer only`, `screen not captured`; `shownOn` lists other screens that draw the first cell's text.
Static: each string of the Overview and of each module's body, except ids, kinds, states, hrefs and trace names, is shown when its text is in the page's text or its source drawers.

Limits that follow from these rules, kept in the report: items whose source cannot be named are `not found`, not `matches`; a weak `via` (`values in the scope (not one item)`, `the source has a missing value in this run (cell not identified)`,
`period appears in the source`, `... elsewhere in this run`) is a match by existence, not by position.

Not verified: whether a drawn value is right where it is `derived` and not recomputed (the forecast model output, the script checks, the run record, axis ticks, the calendar,
the evidence counts, whether a chart's ticks cover its data, and everything named only in `derivedSummary`); the height of a bar against its value (only
whether the mark is a bar, a zero bar or missing is checked); any item whose source cannot be identified and matched by existence only (the `via` values that say so), so a wrong
number on a screen that happens to be in the same module's handoff, or the same run's fixture, under another label is not reported; the label, period, unit and basis fields
of the capture, which the rules use where they are present (they are heuristics, see above), and a unit, period or label the screen leaves out altogether (except the Overview unit check);
colour, tone, ordering, layout and everything under "What it leaves out"; that the page's drawn text is what a reader understands; the wording of a drawer other than its statement, handoff line and basis;
the connected Changes page of a real two-run history (the paired-run screens are checked against the values `web/scripts/connected-proof.mjs` injects, not against a run); any real run, issuer or pathway (the
handoffs are the canned synthetic ones, the fixtures are design fixtures); the delivered handoff's own preamble and line numbering beyond the one offset the drawers imply; the markdown the handoff is
rendered from beyond what the rules read (headings, tables, bullets, `Basis:` lines); the "after" capture and any before-and-after comparison, which do not exist yet; determinism on another machine or
Node version (two runs here gave identical files, Node v22.23.4); and, from the capture, that the heuristic fields classify correctly on a changed screen, what a mark's pixel size stands for, hover and tooltip
content, narrow layouts, dark mode and the choices and pages listed under "What it leaves out".
