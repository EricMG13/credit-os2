# Notes for the `sections-static` stage 2 workers

Written by the `sections-static` controller from the lead's hand-over and
`output/0-baseline/report.md` "Environment notes for later sessions". Your brief is
`docs/audit/2026-11-16-final/stages/2-section-audit.md`; these notes add only the local set-up and
the output conventions this session uses. Where they differ, the brief, `README.md` and `AGENTS.md`
govern.

## Repository and git

- Repository root `/home/user/credit-os2`, branch `audit/out-sections-static`. Main under audit is
  `2b881075`; stage 0 is in `output/0-baseline/`, stage 1 in `output/1-rubrics/`.
- Several workers share this working tree. Run no git command that changes anything (no `checkout`,
  `switch`, `stash`, `reset`, `clean`, `add`, `commit`, `push`). The controller commits your folder.
- Write only under `docs/audit/2026-11-16-final/output/2-sections/<your id>/`. Everything else you
  create (screens, copies of `web/dist`, logs, the service root) goes in your scratch folder below.

## Toolchain (already prepared by the controller; do not repeat)

- `export PATH=$HOME/.local/bin:$PATH` first: uv must be 0.12.5 (`uv --version`).
- `uv sync --locked`, `npm --prefix web ci` and `npm --prefix web run build` were run again after
  the restart, at 2026-11-17 (restart session). Do **not** run `npm ci`, `npm run build` or `uv sync` again: other workers
  are reading `web/dist` and `web/node_modules` while you work. If `web/dist/index.html` is missing,
  stop and say so in your reply.
- Playwright 1.62.1 from `web/node_modules` (load it with `createRequire(<repo>/web/package.json)`,
  as `output/0-baseline/probes/static/crawl.mjs:17-18` does). It looks for headless shell build
  1234, but only build 1243 is installed: launch with
  `executablePath: "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"`
  (full Chromium, if you need it: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`).
- Block every host but loopback in every browser context (ruling R8). Reuse the route guard in
  `output/0-baseline/probes/static/crawl.mjs:116-133` (allow `file:`, `data:`, `blob:`,
  `127.0.0.1`, `localhost`, `[::1]`; abort and record everything else).
- Screenshots: 1440 x 900 and 390 x 844, `deviceScaleFactor: 1`. Commit only the ones a finding
  cites, under your `evidence/`; keep each under about 300 KB (clip to the defect when you can).
- Commands: wrap each in `timeout 300` (or less). Cap every loop at 1,000. Exhaust no operating
  system limit. Close every browser and stop every service you start.

## Hard limits (restart, 2026-11-17)

The first session froze after dispatching its workers; nothing they did survived. To prevent a repeat:

- Wrap every shell command in `timeout` (at most 600 seconds; 300 is the norm). A service you
  start in the background is started under `timeout` too, and killed when you finish.
- Cap every browser action: after `newContext`/`newPage` call `context.setDefaultTimeout(15000)` and
  `context.setDefaultNavigationTimeout(20000)`; pass `timeout` to `chromium.launch` (30000). Never
  wait on a selector or event without a timeout. Close the browser in a `finally`.
- Write your outputs as you go, not at the end: create `report.md` (with a provisional
  `Not verified:` last line) and `findings.jsonl` early, and append to them after each screen.
  If you are stopped, what is on disk is what the controller can keep.
- The controller stops a worker that has not returned in 90 minutes. Budget about 75 minutes of
  work; if you are running out, finish the outputs with what you have and list the rest under
  `Not verified:` rather than going over.

## Data variants of the static app

- **Shipped:** `web/dist/index.html` opened from disk. Its `data.js` holds `issuers: []`, so every
  static route shows only its empty state. Audit that empty state.
- **Fixture:** copy `web/dist` to `<your scratch>/dist-fixture` and write its `data.js` with
  `writeDataFile(<your scratch>/dist-fixture, <fixtures dir>)` from `web/scripts/fixture-data.mjs`
  (see `crawl.mjs:33-40`). Audit full, partial, error and loading states here.
- For partial data, missing-versus-zero, very long text and error states: copy `web/fixtures/*.json`
  into your scratch folder, change the copies, and pass that folder as the fixtures dir; or edit the
  `data.js` of your scratch copy; or intercept the request in the browser. Never change `web/dist`,
  `web/fixtures`, `web/public` or any application file.
- Never open a `#/signal/…` address (ruling R2).

## The synthetic service (only if you need the connected surface)

- `PYTHONPATH=src uv run --locked python -m proof.serve --root <service root> --port <your port>`.
  The root must be at most 80 characters and empty at start.
- A completed synthetic run needs `proof/northbridge-credit-agreement.txt` uploaded and chosen as
  the executed agreement, as `web/scripts/connected-proof.mjs` does; without it the run fails at
  Legal & covenants. No `--live`, no seat check, no real Submit: `proof.serve` substitutes canned
  responses and its Submit dialog reads "spends USD 0.00" (ruling R4).

## Ports and folders

| Id | Port | Service root | Scratch folder |
| :--- | :--- | :--- | :--- |
| S1 | 8761 | `/tmp/ss-S1/root` | `/tmp/ss-S1/scratch` |
| S2 | 8762 | `/tmp/ss-S2/root` | `/tmp/ss-S2/scratch` |
| S3 | 8763 | `/tmp/ss-S3/root` | `/tmp/ss-S3/scratch` |
| S4 | 8764 | `/tmp/ss-S4/root` | `/tmp/ss-S4/scratch` |
| S5 | 8765 | `/tmp/ss-S5/root` | `/tmp/ss-S5/scratch` |
| S6 | 8766 | `/tmp/ss-S6/root` | `/tmp/ss-S6/scratch` |
| X1 | 8767 | `/tmp/ss-X1/root` | `/tmp/ss-X1/scratch` |

A probe you save must run from the repository root, create its own temporary folder, use your port,
and stop what it starts.

## Section notes from the lead and stage 0

- `#/kit` is reachable from the static rail (`output/0-baseline/surface-map.md`) and belongs to S1.
- In `clickables.jsonl` the shell rail is tagged S1 on the static surface and X1 on the connected one
  (129 lines: Skip to content, Library, Run on 36 connected addresses). `sections.md` governs: S1 owns
  `web/src/shell/`, so **S1** checks those 129 lines as the owner of `Shell.tsx`/`PageHeader.tsx`
  (C1 audits only how the connected pages use them). X1 does not check them.
- Shared files drawn in the connected report are listed in `sections.md` "Cross-surface ownership":
  the owning section audits the file; the other section audits how it is used. You may start the
  synthetic service to see your file drawn there, but connected page layout belongs to C1–C5.
- Stage 0 noted that static run-activity pages link to `#/library/transdigm/…`, an issuer the
  fixture library lacks (S6 confirms and registers it if it reproduces).
- The open harmony questions H-01 to H-26 in `output/1-rubrics/harmony-report.md` are inputs. Where
  a finding needs a decision only the owner can make, write it with `owner_decision: true` and carry
  on; do not stop to ask.
- The impeccable skill is not installed in this cloud session. Fallback (brief, check 2): apply
  `output/1-rubrics/design-rubric.md` rule by rule to each screenshot and to the component code,
  honouring `.impeccable/config.json`, and record the absence under `Not verified:` (ruling R7).
- Inventory lines repeat the same control on many addresses. Group them by screen type, role and
  name; exercise every distinct control on at least one address of every screen type where it
  appears, in both data variants where it appears in both. In `report.md`, count coverage against
  your inventory lines: exercised directly, covered by an identical control on a sibling address,
  and not reached (with why).

## Output conventions for this session

- `findings.jsonl`: exactly the 14 fields of `FINDINGS-SCHEMA.md` (`id`, `section`, `surface`,
  `screen`, `check`, `severity`, `kind`, `title`, `expected`, `actual`, `evidence`, `probe`,
  `suggested_change`, `owner_decision`), ids `<id>-001` upward, `evidence` an array of repository
  paths or `file:line`. `probe` is required for High and Medium (a path under your `probes/` or an
  exact command); for Low and Info write the command or path too when you have one, else `""`.
  Validate every line with `python3 -c` before you return.
- `harmony.csv`: header `matrix,row_id,mark,screen,evidence,note`.
  - `matrix=content`: every `content-matrix.csv` row whose `section_id` contains your id; `mark` is
    one of `shown as required`, `shown but wrong place or form`, `missing`, `correctly not shown`.
  - `matrix=control`: every `control-matrix.csv` row whose `section_id` contains your id; `mark` is
    `decidable as required`, `decides more than the row`, `decides less than the row` or
    `not reachable here`.
  - `matrix=retired`: every item of `retired.md` your screens could offer; `mark` is `not offered`
    or `still offered`.
  - `matrix=unaccounted`: one row per thing your screens show that no row accounts for; `row_id`
    empty; `mark` `unaccounted`.
  - A row whose mark is anything but `shown as required`, `correctly not shown`,
    `decidable as required` or `not offered` has a finding; put its id in `note`.
- `report.md`: screens and controls covered with counts against the inventory, the states reached
  per screen and how, what was not reached and why; the last line starts `Not verified:`.
- Reply to the controller with the paths of your output files and one line of counts (findings by
  severity, inventory lines covered), not their content.
