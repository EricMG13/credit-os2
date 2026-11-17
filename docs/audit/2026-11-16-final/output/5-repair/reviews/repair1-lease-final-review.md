# Fresh final review: repair-1 T10 liveness lease

Reviewed commit: `f7110d9059fd584e5f7a157665238396a449c876` on `audit/repair-1` in
`/workspace/repair-1`. Narrow range: `301c7ded..f7110d90` (the backport of 3479e06a), two files,
11 production lines changed and 109 additive regression lines. The original group-1 changes were
reviewed separately; this review does not repeat or widen their scope.

Verdict: PASS. High 0, Medium 0, Low 0, Info 0 within this backport.

`reading()` now holds the same `_LOCK` used by `new()`/`_make_room()` during both draft lookup and
mtime refresh. If reading enters first, the refresh completes before the ceiling computes idle
candidates. If eviction enters first, lookup truthfully refuses the already-removed draft. The
lock is released before `_stored()` and `read_documents()`, so file parsing does not hold up other
uploads or draft creation. `_touch` calls only `os.utime`; it acquires no nested lock. A genuine
refresh OSError is logged with its real cause and returned as Refused rather than silently leaving
a live draft eligible for eviction. No submitted file is changed or removed by the new code.

The two-thread regression explicitly observes attempted lock acquisition while touch is paused;
it does not infer ordering from a sleep. Both threads are released/joined in finally. On the old
code the ceiling can acquire the lock and remove the aged draft before the paused touch finishes,
so the final reading/file assertions fail. On the new code it must wait and then truthfully refuse
a new draft because the refreshed one is live. The other regressions pin failed-touch logging and
Refused, an independent literal 7,200-second lease, the exact 7,199/7,200 boundary, oldest-first
selection and removal of only the one slot required. No existing assertion, timeout, expected value
or gate changed; no test is skipped.

The idle policy, open ceiling, pending-upload/approved/sealed exemptions, schema, cap, issuer check,
approval digest and Submit idempotence are unchanged. Broader lead UI recovery wording is separate
work and is not included in this source-branch review. No Signal, analytical calculation/method,
prompt, canned handoff or module-written text changed. No provider, paid/live/seat, real Submit or
Teams call was made.

## Independent verification

Commands used uv 0.12.5, --no-sync, explicit `/workspace/repair-1/src:/workspace/repair-1/apps/issuer-library:/workspace/repair-1`
PYTHONPATH and timeout 300. The parent's full affected pytest run was not duplicated.

| Check | Exit | Result |
| --- | ---: | --- |
| `pytest -q tests/test_run_start_submissions.py -k 'reading_cannot_lose or reading_reports_and_logs or idle_ceiling_stays or idle_eviction_starts'` | 0 | 4 passed, 197 outside this narrow selection, 1.20 s; `/workspace/scratch/repair1-lease-review-pytest.log` |
| `uv run --no-sync python tools/quality_gate.py` | 0 | 0 findings in20 changed files,2,365 lines in scope; `/workspace/scratch/repair1-lease-review-quality.log` |
| `git diff --check 301c7ded..f7110d90` | 0 | No whitespace issue |

Not verified: old-base red run not repeated by this reviewer; the parent's full affected pytest result is separate; high-load stress beyond the deterministic two-thread schedule, wall-clock jumps, browser UI recovery and Windows/work-PC file semantics were not exercised; no real provider/paid execution/seat/Submit or Teams.
