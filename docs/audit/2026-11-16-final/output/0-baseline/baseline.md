# Stage 0: baseline

Run on 2026-11-16 (UTC) in the cloud container. Nothing outside `output/0-baseline/` was changed;
`.venv/`, `web/node_modules/` and `web/dist/` were created by setup and are git-ignored.
Gate runner: `bash docs/audit/2026-11-16-final/output/0-baseline/probes/run-gates.sh <log-dir>`
(Node 24 and uv 0.12.5 first on `PATH`). Raw logs stayed in the scratch folder.

## Versions and commit

| Item | Value |
| :--- | :--- |
| Commit under audit | `960f35641edde8bb9cf79bfb9c6c7308fe430c05` (branch `audit/final-coordination`, "Final audit: lead status, wave 1 starting", 2026-11-16 17:06 UTC) |
| Python | 3.13.15 in `.venv` (pinned by `.python-version`; the container's own `python3` is 3.13.18) |
| uv | 0.12.5, the pinned `required-version`. The container ships uv 0.11.32, which `uv sync --locked` refuses (exit 2: "Required uv version `==0.12.5` does not match"). The 0.12.5 binary was taken from the PyPI wheel into the scratch folder and put first on `PATH`; nothing was installed system-wide |
| Node | 24.22.1 (`/opt/node24`). The container's default `node` is 22.23.4, below `web/package.json` `engines.node >=24`, so every web command was run with Node 24 |
| npm | 11.19.1 |
| Playwright | 1.62.1 (web dev dependency). Its own Chromium build (1234) is not installed; the probes launch the pre-installed Chrome for Testing 153.0.8010.12 (`/opt/pw-browsers/chromium`, build 1243) with `executablePath` |

## Setup

| Command | Exit | Note |
| :--- | :--- | :--- |
| `uv sync --locked` (uv 0.11.32) | 2 | required-version mismatch |
| `uv sync --locked` (uv 0.12.5) | 0 | |
| `npm --prefix web ci` (Node 24, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) | 0 | 471 packages; npm reported 7 moderate vulnerabilities across all dependencies; `esbuild@0.25.12` install script "not yet covered by allowScripts" (not run) |
| `npm --prefix web run build` | 0 | both bundles built; Vite warns `ReportLibrary-*.js` (658.6 kB) and the static `index-*.js` (1,464.8 kB) exceed 500 kB |

## Gates as they stand

| Gate | Command | Exit | Headline |
| :--- | :--- | :--- | :--- |
| lint | `npm --prefix web run lint` | 0 | eslint `--max-warnings=0`: no problems |
| format | `npm --prefix web run format:check` | 0 | "All matched files use Prettier code style!" |
| typecheck | `npm --prefix web run typecheck` | 0 | `tsc --noEmit` clean |
| test | `npm --prefix web run test` | **1** | Vitest: 170 files, 3,615 tests: **1 failed**, 3,614 passed (267 s). Failing: `src/pages/connected/ConnectedApp.test.tsx` › connected activity and reports › "lists the runs in progress and waiting, with module progress and no run code" (no link named "Harbour Packaging"). Re-run alone (`vitest run … -t "lists the runs in progress and waiting"`) it **passed** (exit 0), so the failure depends on the full run. The coverage table was not printed because the run failed |
| unused | `npm --prefix web run unused` | 0 | knip: no unused files, exports or dependencies; 1 configuration hint (`.css` compiled extension excluded) |
| duplication | `npm --prefix web run duplication` | 0 | jscpd over `web/src` (threshold 3%): 140 clones, 1,279 duplicated lines of 87,138 (1.47%), 9,822 tokens (1.56%) |
| test:scripts | `npm --prefix web run test:scripts` | 0 | node:test: 70 tests, 70 pass, 0 fail (79 s) |
| test:file:gates | `npm --prefix web run test:file:gates` | **1** | Rebuilt `web/dist` (exit 0), then `open-from-disk.mjs` found `/usr/bin/google-chrome` (a wrapper script that runs the Playwright Chrome for Testing with `--no-sandbox`), passed 3 checks (assets, `url()`s, classes), then threw "the browser did not finish within 60000 ms and was killed" on the first `--dump-dom`. A hand-run of the same `--headless=new --dump-dom --virtual-time-budget=5000` command on the built page also produced no output in 150 s. The browser checks on `file://` therefore did not run here |
| audit | `npm --prefix web run audit` | 0 | `npm audit --omit=dev`: found 0 vulnerabilities |
| Python quality gate | `uv run python tools/quality_gate.py --base HEAD~1 --json` | 0 | `{"files": [], "owned": 0, "findings": [], "imports": ""}`: the last commit changed no Python, so no changed code was in scope; the whole-tree import-direction step reported no broken contract |
| Fast Python tests | `uv run pytest -m "not live and not browser" -q -x` (`pytest-timeout` is not installed, so no `--timeout`) | **1** | 6,923 selected (304 deselected). Stopped by `-x` after 246 passed, **1 failed**: `tests/model/test_gate.py::test_only_the_model_testing_ruling_lifts_the_pause` (pinned ruling `2026-11-02-model-testing-live.md` missing). This test is listed in `tests/known-failures.txt`, which CI deselects |
| Fast Python tests, no `-x` (extra, for a count) | same without `-x`, `-p no:cacheprovider` | **124** (stopped at 600 s) | 3,877 tests ran (about 55%), 3 failed, then no progress for the rest of the 600 s. A verbose re-run (`-v`, also stopped at 600 s, exit 124) names the three failures, which are exactly the three in `tests/known-failures.txt` (`test_gate.py::test_only_the_model_testing_ruling_lifts_the_pause`, `test_gate.py::test_good_ruling_construction_touches_nothing_and_complete_reads_the_three_key_variables_once`, `test_o5_done_when.py::test_the_live_pause_refuses_and_touches_no_environment`), and stalls at `tests/test_financial_workflow.py::test_full_component_promotes_and_publishes_actual_model` (started, no result). That file is not in the CI fast list (`.github/workflows/checks.yml`); the remaining ~45% did not run |
| fallow | — | — | Neither the fallow CLI nor a fallow skill is available; knip (`unused`) and jscpd (`duplication`) stand in |

## Synthetic service

`PYTHONPATH=src uv run --locked python -m proof.serve --root <new empty folder> --port <port>
--web <copy of web/dist>`. A root under the scratch folder was refused ("root … is 99 characters;
use a shorter path (at most 80)", `deploy_workflow/inbox/layout.py`), so the roots were new empty
folders `/tmp/s0p-*` (the connected proof uses `/tmp/coc-*` the same way). `--web` pointed at a copy
of `web/dist` so that `test:file:gates`, which rebuilds `web/dist`, could not change files the
service was serving; the copy was byte-identical to `web/dist` (`diff -rq`).

The inventory was run three times against three fresh roots (ports 8791, 8792, 8793), each with
one synthetic run of Northbridge Synthetic Group, 2025-03-31, Full credit assessment, filing and
workbook uploaded, workbook selected, one Moody's B1 rating added, limits acknowledged, summary
approved, Submit run, Start synthetic run. Each submit returned 200 and each run ended `finished`;
in the third (`20261116-174130-01`) `/connected/activity/<run>` lists the 14 Full-pathway modules
and the Report step, all `done`. The first two passes were discarded for probe defects (an
over-counted reveal diff; then focus-only `tabindex="-1"` elements counted as controls); the files
in this folder come from the third. The paid dialog was opened in a separate page in which only the
browser's copy of the HTML was switched to live mode; every submit request in that page was routed
to abort, none was sent (`paidSubmitRequestsAborted: 0`), and Cancel was pressed.
