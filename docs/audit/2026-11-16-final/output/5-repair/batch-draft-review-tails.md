# T10 draft-lifecycle review tails

Base: `d4b3db282f646e46c7ea2fb26a4390be50069bc2`. This is a narrow follow-up to
C2-008/T10 and its primary/adversarial review notes, not a new draft-retention policy.
The backend serialization repair is separately backportable as `3479e06a`.

## Repairs and before-state proof

- **Read/idle-eviction race:** the deterministic two-thread regression pauses a document read
  between folder lookup and its age refresh, then requests a new draft at the ceiling. Before
  the repair, eviction deletes the reading draft and reading returns `not a folder`. Lookup and
  refresh now share `_LOCK` with the eviction decision. Conversion and document reading remain
  outside the process-wide lock. If eviction wins first, the existing `unknown submission`
  refusal remains truthful.
- **Suppressed refresh failure:** an injected `OSError` previously returned a successful read
  without refreshing liveness or recording the failure. It now logs a diagnostic and refuses
  with `the submission could not be kept active; try again`. This does not turn a failed refresh
  into a claim that the draft is protected from eviction.
- **Recovery text:** a full active ceiling previously said only `try again later`. It now names
  continuing an existing form or waiting until an unused draft is idle for two hours, with the
  existing 24-hour retention for reviewed drafts. No slot is replaced under a new policy.
  The connected form translates only the exact `404/unknown submission` response into
  `unavailable and may have expired`, explains that current answers and selected documents
  remain, and tells the analyst how to recreate the draft and upload again. It makes no claim
  that every unknown ID expired; unrelated 404 explanations remain intact.

Committed probes are the new tests in `tests/test_run_start_submissions.py` and
`web/src/pages/connected/start/StartRun.finalAudit.test.tsx`. Before-state output is retained in
`T10/review-tails/`: two backend defect regressions failed and two independent policy checks
passed; the capacity-text test failed; the unavailable-draft text test failed while the unrelated
404 check passed. The first new race assertion initially treated `documents` as a string array;
its assertion was corrected to check the endpoint's document-record `source` field, empty error,
and ignored list. No existing test was weakened by that correction.

The fixed-clock policy tests independently pin 7,200 seconds, reject eviction at 7,199 seconds,
allow it at exactly 7,200 seconds, and prove oldest-first removal of exactly one slot when three
idle drafts are eligible. The ceiling remains 50; issued approvals and uploads in flight retain
all existing protections. Approval digests, issuer ownership and `approved_summary_limits` are
untouched.

The sole changed existing test expectation is the `404/unknown submission` case in
`ConnectedApp.test.tsx`, required by T10's actionable recovery wording. Its 400 response and the
existing `Review the run again before submitting` requirement are unchanged. No numeric,
source, module-text, or analytical expectation changed. No test is skipped by this patch.

## Verification and direct review

Used uv 0.12.5 with `--no-sync` and this worktree's explicit `PYTHONPATH`; every command was
bounded by `timeout 300`, and Vitest used `--maxWorkers=1`.

- Narrow backend milestone: submissions + scheduler **257 passed, 1 existing case-sensitive
  disk skip**; default main-based quality gate **0 findings**.
- Final affected Python run (submissions, scheduler, service, React frontend): **437 passed,
  1 existing case-sensitive disk skip**. Shared editable-environment pytest rewrite warning is
  diagnostic only; the worktree's explicit source paths were used.
- Affected frontend run (`ConnectedApp.test.tsx` and `StartRun.finalAudit.test.tsx`):
  **244 passed**. After replacing new-test non-null assertions with explicit test-setup checks,
  the intake file alone was checked again: **25 passed**.
- Frontend lint, format:check and typecheck: **exit 0**. The first lint found two new-test
  non-null assertions; those were removed, without changing any outcome assertion.
- Final default main-based quality gate: **0 findings** in 35 changed Python files, 3,346
  lines in scope. The scope includes the previously integrated audit candidate, not only T10.
- `git diff --check`: **exit 0**. Only connected intake code changed on the frontend; no shared
  component or Signal file changed, so no new Signal run was required by this patch.

Fidelity scope is the draft recovery message and its retained client state: the DOM regression
checks the issuer name, as-of date, analyst name and selected filename after refusal, then proves
that retry creates a new draft and re-uploads the same document. No layout, monetary figure,
source identity, approval payload or module output is changed.

The named confidence-review and rewrite-tournament tools are unavailable (R7). Direct review
traced lock ordering, the losing-lookup path, the exact 404 discriminator, retained local state,
Submit refusal handling, and OSError propagation through the service's existing refusal mapper.
The simplest design is one existing lock around lookup/refresh and one shared wording helper;
no new lease table, TTL, replacement rule, catch-all, schema or endpoint was introduced. The
wall-clock-jump observation remains an unusual-input limitation of the existing retention clock,
not a new repair. No live/paid/Teams request was made. Fresh independent review remains with the
lead.

Not verified: live/provider execution, Teams, work-PC setup, runtime OS-clock changes, multi-process
access to one root (the service is specified as one process), stress/load operation, real Submit,
and an end-to-end browser eviction walk; this patch's recovery fidelity is exercised in the
synthetic component/service tests.
