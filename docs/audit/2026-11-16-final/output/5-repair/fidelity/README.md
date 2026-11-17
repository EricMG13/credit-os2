# Fidelity capture for stage 5 step 9

Step 9 of `stages/5-repair.md` asks, for every presentation change, for the values, periods, units,
sources and limitations on screen to be compared with the handoff, before and after. This folder holds
the tool that records what is on screen and the "before" record. It records the screen only. It does not
read a handoff.

| Path | What it is |
| :--- | :--- |
| `capture.mjs` | One Node script. Captures both surfaces into an output folder. |
| `before/` | The capture of the tree before any stage 5 repair (see `before/index.json`, `tree`). |
| `after/` | Not present. Made by the lead on the merged branch, as below. |

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
handoffs are `proof/handoffs/*.md`; for the static surface the source is `web/fixtures/*.json`.

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
- The handoff side of the comparison: nothing here reads `proof/handoffs/*.md` or `web/fixtures/*.json`.

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

Not verified: the "after" capture and any before-and-after comparison; any real (non-synthetic) run, any
other issuer or pathway, and the connected Changes page of a real two-run history (only the injected
fixture); the handoff side of step 9; colour, tone, layout, mobile widths, dark mode, hover and tooltip
content; the choices and pages listed under "What it leaves out"; correctness of the heuristic `label`,
`period`, `unit`, `basis`, `sources` and `limitations` fields on a changed screen; what a mark's pixel size
stands for; determinism on another machine, browser version or font set.
