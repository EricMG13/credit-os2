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
| 8 | `CREDIT_OS_OUT_DIR=<scratch>/filecheck-out npm --prefix web run test:file:gates` | **1** | **Fail.** Build passed; 3 static checks PASS; the headless-browser page check failed (see below) |
| 9 | `npm --prefix web run audit` (`npm audit --omit=dev`) | 0 | 0 vulnerabilities (registry reached) |
| 10 | `uv run python tools/quality_gate.py --base HEAD~1 --json` | 0 | `{"files": [], "owned": 0, "findings": []}`: vacuous, see below |
| 11 | `timeout 600 uv run pytest -m "not live and not browser" -q -x` | 1 | Stopped at first failure: 1 failed, 246 passed (7,248 selected, 313 deselected) |
| 12 | `timeout 600 uv run pytest -m "not live and not browser" -q -rf` (no `-x`) | **124** | **Killed by the 10-minute cap at 54%**: 3,955 passed, 3 failed, 2 skipped; about 3,288 tests not reached |
| 13 | `which fallow` | 1 | No fallow CLI; no fallow skill listed in this session |

### Notes per gate

- **Gate 8 (`test:file:gates`).** `file-check.mjs` rebuilds before it checks. To leave the shared
  `web/dist/` untouched while other workers use it, it was run with `CREDIT_OS_OUT_DIR` set to a
  scratch folder, the mechanism the script provides for this. Three attempts:
  1. Exit 1: `Error: ENOTEMPTY: directory not empty, rmdir '/tmp/credit-os-profile-.../Default'`
     at `dumpPage` (`web/scripts/open-from-disk.mjs:69`), reached from `checkDefaultAddress`
     (line 144). The browser profile could not be removed after Chrome exited.
  2. Exit 1: `Error: the browser did not finish within 60000 ms and was killed`.
  3. Diagnostic, `CI=true` (adds `--no-sandbox`; the session runs as root): exit 1, same timeout.
  Passing in all three: "referenced assets are sound: 3 found", "every url() in the stylesheet is
  relative and exists", "every colour, shadow, radius and size class has a rule". Load average was
  about 1.5 to 3 on 4 cores, with other workers running browsers concurrently. Whether this is the
  environment or the code was not determined. Logs: `npm-file-gates.log`, `npm-file-gates-rerun.log`,
  `npm-file-gates-ci.log`.
- **Gate 10 (quality gate).** `HEAD~1` is `f8f8b11`, the merge that brought `main` 2b881075 into the
  audit branch. The gate diffs the working tree against it; no `.py` file differs (only audit
  output docs, plus another worker's uncommitted `output/0-baseline/probes/static/crawl.mjs`), so it
  checked zero files. It says nothing about the code of 2b881075 itself.
- **Gates 11 and 12 (pytest).** pytest-timeout is not installed, so `--timeout=300` was omitted.
  The `-x` run's failure is `tests/model/test_gate.py::test_only_the_model_testing_ruling_lifts_the_pause`
  (`Extra items in the left set: '2026-11-02-model-testing-live.md'`). The three failures seen in
  the capped full run were all in the first 5%; a separate `tests/model` run (`pytest-model.log`:
  3 failed, 834 passed) names them:
  - `tests/model/test_gate.py::test_only_the_model_testing_ruling_lifts_the_pause`
  - `tests/model/test_gate.py::test_good_ruling_construction_touches_nothing_and_complete_reads_the_three_key_variables_once`
  - `tests/model/test_o5_done_when.py::test_the_live_pause_refuses_and_touches_no_environment`

  All three are listed in `tests/known-failures.txt`, so none is new. That file is the one in this
  repository; `AGENTS.md` and its header comment name `tests/nightly-known-failures.txt`, which does
  not exist here (it is the predecessor repository's name).
- **Gate 13.** No fallow CLI or skill. The knip (`unused`) and jscpd (`duplication`) results stand in.

Not verified: the remaining ~46% of the fast Python suite (about 3,288 tests after the 54% mark),
which the 10-minute cap stopped; the browser page checks of `test:file:gates` (the cause of the
failure, environment or code, is not determined); `tools/quality_gate.py` against the code of
2b881075 (the `HEAD~1` base made it check zero files); fallow (not available); the slow, live and
browser pytest markers (excluded by the brief); Process steps 3 to 9 (other workers).
