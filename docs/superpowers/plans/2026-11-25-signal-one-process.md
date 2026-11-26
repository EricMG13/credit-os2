# Plan: Signal runs inside the one application process

Spec: `docs/superpowers/specs/2026-11-25-signal-one-process.md`. Branch:
`claude/lucid-feynman-bvglyi` (PR 83). Method: subagent-driven development: one fresh implementer
subagent per task, then a spec-compliance review and a code-quality review by other subagents
before the next task starts. Each task is test-first, ends green on its own targeted tests
(`timeout 300`), passes `uv run python tools/quality_gate.py`, and is one commit.

Order matters: every task leaves the branch working.

## Task 1: `service.answer`, beside the old server

- Files: `src/deploy_workflow/signal/service.py`, `src/deploy_workflow/signal/routing.py` if the
  request type belongs there, a new `tests/test_signal_answer.py`.
- Add the public `answer(root, loop, request)` of spec 4.1 and make `Handler._dispatch` call it,
  so both paths share one implementation. Nothing is removed yet.
- Tests, hand-written expectations: a known route, 404, 405 with `Allow`, 401 without a name,
  the connection is closed after a handler raises.

## Task 2: `react_frontend/signal_host.py`, hosting in place of forwarding

- Files: new `react_frontend/signal_host.py`, `react_frontend/__init__.py`,
  `react_frontend/__main__.py`, `tests/test_react_frontend_signal.py` (rewritten per spec 5),
  `tests/test_react_frontend.py`.
- `SignalHost`, `divert`, `other_method`, `PAGE_PATHS` per spec 4.2; body rules and the two
  response headers; hosted in live mode only; `make_server` starts no thread; `serve` runs
  `ai_run.recover`, starts and stops the loop; the `credit-os-signal` meta.
- The AI switch of spec 4.4 (`CREDIT_OS_SIGNAL_AI=1`), with both of its tests.
- Delete `react_frontend/signal_forward.py` and the `--signal-url` argument of `react_frontend`.

## Task 3: remove the standalone server

- Files: `src/deploy_workflow/signal/service.py`, `src/deploy_workflow/signal/cli.py`,
  `src/deploy_workflow/run_start/service.py`, the `tests/test_signal_*.py` files that call
  `make_server`, `tests/test_signal_cli.py`, `tests/test_run_start_service.py`.
- First move the dozen `make_server` call sites to one shared test helper (spec 5), assertions
  unchanged, and see them pass. Then remove `Handler`, `_Server`, `make_server`, `serve`, the
  `serve` command, `signal_link` and `--signal-url`, and rewrite the module docstrings.

## Task 4: web and packaging

- Files: `web/src/connected-main.tsx` and its test, `apps/issuer-library/packaging/runtime.py`,
  `tests/test_issuer_library_packaging.py`.
- Read the new meta name. Remove `Start signal.cmd`. Run the web lint, typecheck, tests, knip,
  build and file gates.

## Task 5: documents

- README, `apps/issuer-library/README.md`, the dated note in the 2026-11-13 Signal spec, the two
  design maps, `checks.yml` if it lists a removed test file. No VERIFICATION.md entry yet.

## Task 6: whole-change review

- Run confidence-review over the whole diff: enumerate doubts, trace causes, test adversarial
  cases (a body on DELETE, a 64 KiB + 1 body, a missing `Origin` on a write, a request in preview
  and synthetic mode, a store that cannot be opened at start-up, a loop job that raises while a
  request is served, shutdown while a pass is running). Repair confirmed defects test-first.
- Run rewrite-tournament in post-edit mode on `answer`, `SignalHost` and `divert`; keep the
  simplest correct design.
- Check spec section 7's search finds nothing.

## Task 7: merge main, record, push

- `git fetch origin main && git merge --no-edit origin/main`. The one known conflict is
  VERIFICATION.md: keep both sides' entries, newest first, and trim the oldest so the file stays
  under 1,000 lines.
- Add one VERIFICATION.md entry for this change with its actual scope: synthetic and local only,
  no live feed, SEC, FRED or model request, not driven in a real browser unless it was.
- Run the quality gate, `lint-imports`, mypy, the Signal, server, run-start and packaging tests,
  and the web gates on the merged tree. Push with `git push -u origin claude/lucid-feynman-bvglyi`.
- Update PR 83's description: one process, what was removed, the new `CREDIT_OS_SIGNAL_AI` switch,
  and under "Not yet verified" the open point of spec 4.5. Watch CI to green on the pushed head.

## Stop and report instead of deciding

- Any test that can only pass by weakening an assertion, skipping, or computing its expectation.
- Anything that would make a model call or a live network request.
- A behaviour of the removed server that a reader depends on and that this plan did not list.
