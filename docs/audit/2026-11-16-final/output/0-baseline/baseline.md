# Stage 0 baseline: versions and gates

Process steps 1 (record) and 2 (gates) of `stages/0-baseline.md`. Nothing was fixed.
Run 2026-11-17 in the cloud session. Raw logs (untracked):
`/tmp/claude-0/-home-user-credit-os2/c30ece96-69a4-5792-9f1a-8275df632b0b/scratchpad/stage0/gates/`.

## Commit under audit

| Item | Value |
| :--- | :--- |
| Commit under audit (`main`) | `2b881075e51459592bb629ed8abe7ee24e4fa1d9` (Merge pull request #54) |
| Branch | `audit/final-coordination` |
| Branch HEAD | `a0d18acb1762ac9f8a4f54f9976c2b48bbc0984f` ("Final audit: restart from main 2b881075 ...") |
| `HEAD~1` | `f8f8b1180c7a684aa987929d7ed6e4355503bc96`, a merge of `origin/main` (2b881075, second parent) into the audit branch (first parent `77816d70`) |

`git diff f8f8b11 HEAD` touches only files under `docs/audit/2026-11-16-final/output/`
(17 files, 8,645 lines removed, 7 added); no Python, TypeScript or config file differs.

## Versions

| Tool | Version |
| :--- | :--- |
| Python | 3.13.18 |
| uv | 0.12.5 |
| Node | v22.23.4 |
| npm | 10.9.9 |
| pytest | 9.1.1 (pytest-timeout not installed) |
| Browser used by the file gate | `/usr/bin/google-chrome` |

## Setup (done by the lead)

- `uv sync --locked`: uv had to be upgraded from 0.11.32 to 0.12.5 to satisfy the repository's
  `required-version` pin. No manifest or lock file was changed.
- `npm --prefix web ci`, `npm --prefix web run build`: exit 0.
- Environment note: uv prints a deprecation warning for `UV_NATIVE_TLS` (use `UV_SYSTEM_CERTS`).

## Gates

All from the repository root.

| # | Command | Exit | Headline |
| :--- | :--- | :--- | :--- |
| 1 | `npm --prefix web run lint` | 0 | 0 errors, 0 warnings (`--max-warnings=0`) |
| 2 | `npm --prefix web run format:check` | 0 | All matched files use Prettier code style |
| 3 | `npm --prefix web run typecheck` | 0 | 0 type errors |
| 4 | `npm --prefix web run test` | 0 | 173 files, 3,950 tests passed, 0 failed. Coverage: statements 94.91%, branches 87.12%, functions 96.82%, lines 96.59% |
| 5 | `npm --prefix web run unused` (knip) | 0 | 0 issues; 1 configuration hint (`.css` compiled extension excluded) |
| 6 | `npm --prefix web run duplication` (jscpd, threshold 3%) | 0 | 160 clones; 1,449 duplicated lines (1.57%), 11,184 tokens (1.68%) over 497 files. tsx 1.88%, ts 0.77% |
| 7 | `npm --prefix web run test:scripts` | 0 | 70 passed, 0 failed |
| 8 | `CREDIT_OS_OUT_DIR=<scratch>/filecheck-out npm --prefix web run test:file:gates` | **1** (5 of 5 tries) | **Fail.** Build and 3 static checks pass; the page check fails because the browser hangs (see below). The cause is the environment: with a browser that responds (diagnostic, gate 8b) every check passes |
| 8b | Diagnostic, not the gate: `CI=true CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell CREDIT_OS_OUT_DIR=<scratch> npm --prefix web run test:file:gates` | 0 | 134 PASS, 0 FAIL (static library, kit page, every static route incl. Signal, the inline-style violation canary) |
| 9 | `npm --prefix web run audit` (`npm audit --omit=dev`) | 0 | 0 vulnerabilities (registry reached) |
| 10 | `uv run python tools/quality_gate.py --base HEAD~1 --json` | 0 | `{"files": [], "owned": 0, "findings": []}`: vacuous, see below |
| 10b | `uv run python tools/quality_gate.py --base 2b881075^1 --json` (base `414ff016`, main's first parent) | 0 | 10 files, 864 owned lines, **0 findings**, no import findings |
| 11 | `timeout 600 uv run pytest -m "not live and not browser" -q -x` | 1 | Stopped at first failure: 1 failed, 246 passed (7,248 selected, 313 deselected) |
| 12 | `timeout 600 uv run pytest -m "not live and not browser" -q -rf` (no `-x`) | **124** | **Killed by the 10-minute cap at 54%**: 3,955 passed, 3 failed, 2 skipped; about 3,288 tests not reached |
| 12b | The same selection in chunks, each under `timeout 600` (see below) | 1 | **All 7,248 selected tests ran: 7,239 passed, 3 failed, 6 skipped.** The 3 failures are all in `tests/known-failures.txt`; none is new |
| 13 | `which fallow` | 1 | No fallow CLI; no fallow skill listed in this session |

### Notes per gate

- **Gate 8 (`test:file:gates`).** `file-check.mjs` rebuilds before it checks. To leave the shared
  `web/dist/` untouched while other workers use it, every try set `CREDIT_OS_OUT_DIR` to a scratch
  folder, the mechanism the script provides for this. Five tries, all exit 1:
  1. While other workers ran browsers: `Error: ENOTEMPTY: directory not empty, rmdir
     '/tmp/credit-os-profile-.../Default'` at `dumpPage` (`web/scripts/open-from-disk.mjs:69`), from
     `checkDefaultAddress` (line 144).
  2. Same conditions: `Error: the browser did not finish within 60000 ms and was killed`.
  3. Same conditions, `CI=true`: same timeout.
  4. and 5. Alone, after the lead confirmed no other Chromium was running (load about 1 on 4 cores):
     same 60 s timeout, at the first page check.

  Browser it used: `findBrowser()` takes `google-chrome` from `PATH`. `/usr/bin/google-chrome` is a
  95-byte wrapper that adds `--no-sandbox` for root and execs `/opt/pw-browsers/chromium`, a link to
  `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` ("Google Chrome for Testing 153.0.8010.12").
  It is the full Chromium, not the headless shell, and Playwright is not involved, so the Playwright
  1234-versus-1243 headless-shell mismatch is not the cause here. That browser hangs on a one-line
  `file://` page with the script's own flags (`--headless=new --dump-dom`, with or without
  `--virtual-time-budget`): killed at 90 s both times (`chrome-trivial.err`: dbus and zygote errors).
  The headless shell `/opt/pw-browsers/chromium_headless_shell-1243/.../chrome-headless-shell` dumps
  the same page in under a second, and with it (row 8b) the full gate passes. So the failure is this
  container's full Chromium in `--headless=new` mode, not the app. Logs: `npm-file-gates.log`,
  `npm-file-gates-rerun.log`, `npm-file-gates-ci.log`, `npm-file-gates-try4.log`,
  `npm-file-gates-try5.log`, `npm-file-gates-diag-headless-shell.log`.
- **Playwright browsers (recorded for the lead).** The Node `playwright-core` is 1.62.1; its
  `browsers.json` expects `chromium-headless-shell` revision 1234 (Chromium 151.0.7922.34), but
  `/opt/pw-browsers` holds only `chromium-1243`, `chromium_headless_shell-1243` and `ffmpeg-1011`.
  Playwright's default launch therefore finds no matching headless shell; the other stage 0 workers
  pointed it at the 1243 build explicitly.
- **Gate 10 (quality gate).** `HEAD~1` is `f8f8b11`, the merge that brought `main` 2b881075 into the
  audit branch. The gate diffs the working tree against it; no `.py` file differs (only audit
  output docs, plus another worker's uncommitted `output/0-baseline/probes/static/crawl.mjs`), so it
  checked zero files. It says nothing about the code of 2b881075 itself. Row 10b is the gate on main's own
  last change: base `2b881075^1` = `414ff016a3dc6a989cf90b9ede1f3cfa1d256a04`. The working tree's
  Python is identical to 2b881075, so this compares exactly what PR #54 changed: 10 Python files
  (`react_frontend/run_activity.py`, `src/deploy_workflow/inbox/{activity,runs,teams}.py`,
  `src/deploy_workflow/owners/cpos.py`, `src/deploy_workflow/run_events.py` and four test files),
  864 owned lines, 0 findings. Log: `quality-gate-main.json`.
- **Gates 11 and 12 (pytest).** pytest-timeout is not installed, so `--timeout=300` was omitted.
  The `-x` run's failure is `tests/model/test_gate.py::test_only_the_model_testing_ruling_lifts_the_pause`
  (`Extra items in the left set: '2026-11-02-model-testing-live.md'`). The three failures seen in
  the capped full run were all in the first 5%; a separate `tests/model` run (`pytest-model.log`:
  3 failed, 834 passed) names them:
  - `tests/model/test_gate.py::test_only_the_model_testing_ruling_lifts_the_pause`
  - `tests/model/test_gate.py::test_good_ruling_construction_touches_nothing_and_complete_reads_the_three_key_variables_once`
  - `tests/model/test_o5_done_when.py::test_the_live_pause_refuses_and_touches_no_environment`

  All three are listed in `tests/known-failures.txt`, so none is new.
- **Gate 12b (chunked full run).** The 7,248 node ids from `--collect-only` (313 deselected by the
  marker) came from 88 files, split in collection order into 11 chunks of about 800 tests, each run
  as `timeout 600 uv run pytest -m "not live and not browser" -q -rfE <files>`:

  | Chunk | Exit | Seconds | Result |
  | :--- | :--- | :--- | :--- |
  | 00 (13 files, incl. `tests/model`) | 1 | 29 | 789 passed, 3 failed |
  | 01 | 0 | 14 | 745 passed |
  | 02 | 0 | 5 | 457 passed |
  | 03 (`test_cpos_launch.py`) | 0 | 74 | 942 passed |
  | 04 | 0 | 8 | 688 passed, 2 skipped |
  | 05 | 124 | 600 | Cap hit in `tests/test_financial_workflow.py`; rerun per file and per test, below |
  | 06 | 0 | 30 | 543 passed |
  | 07 | 0 | 10 | 470 passed |
  | 08 | 0 | 55 | 676 passed |
  | 09 | 0 | 18 | 647 passed, 3 skipped |
  | 10 | 0 | 8 | 539 passed |

  Chunk 05 per file: ten files, 718 passed and 1 skipped, each under 10 s. Its eleventh file,
  `tests/test_financial_workflow.py` (25 tests), cannot finish in 600 s as one run: its tests build
  module-scoped "genuine" cases (`genuine_quality_case`, `genuine_closed_case`,
  `genuine_promoted_case`). It was finished in pieces: 9 passed before the per-file cap; the test
  that was running when the cap hit, `test_quality_read_serves_narrowed_quality_scope_bound_to_full_inputs`,
  passed alone in 75 s; the next run passed 3 more before its cap; the last 12 passed one per run.
  The slowest: `test_publication_bytes_live_head_and_foreign_store_refuse` 531 s and
  `test_invalid_repair_cannot_disappear_from_sealed_audit` 273 s, each alone. All 25 pass, but this
  file alone takes well over 10 minutes. Logs: `chunks-summary.txt`, `chunk05-files-summary.txt`,
  `fw-single-summary.txt` and the `pytest-*.log` files.

  Totals: 7,239 passed, 3 failed, 6 skipped = 7,248. The 3 failures are the ones above, all in
  `tests/known-failures.txt`. Running in chunks splits module-scoped fixtures and test order
  differently from one full run; no order-dependent result was seen.
- **Known-failures file name.** `AGENTS.md` names `tests/nightly-known-failures.txt`, which does not
  exist in this repository. The repository's file is `tests/known-failures.txt`; its header says it
  was carried over from the predecessor repository's `tests/nightly-known-failures.txt`.
- **Gate 13.** No fallow CLI or skill. The knip (`unused`) and jscpd (`duplication`) results stand in.

Not verified: the gate's own browser path (`google-chrome`, the full Chromium 1243) completing a
page check, because it hangs in this container; the page checks passed only through the
headless-shell diagnostic (row 8b). Also not verified: a single uninterrupted run of the fast Python
suite (it was completed in chunks); `tools/quality_gate.py` on any change before main's last merge;
fallow (not available); the slow, live and browser pytest markers (excluded by the brief); Process
steps 3 to 9 (other workers).
