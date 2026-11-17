# Independent review: scroll restoration and draft-recovery UI

Verdict: **PASS** for both assigned changes. Findings: **High 0, Medium 0, Low 0**.
No production edits, push, merge, provider, paid run, real Submit or application-service call.
My own UI-tail changes were excluded from this review.

## Exact pins and scope

- Scroll: `/workspace/audit-review-small-fixes`, HEAD and reviewed commit
  `f187e3be6992aff3fae579311f1661700e1725e3`; compared only that commit against
  `1c06c00c`. The decimal-zero and static-loading changes were already independently reviewed
  and were not reviewed again here.
- Draft UI: `/workspace/audit-draft-tail`, UI commit
  `8300688ee83ae7e44c8d2a6c48b9006726c289b6`; worktree HEAD
  `b8b5de1234df1550893b18de987a212ce4b64e04` adds its report/evidence and has no later
  StartRun production difference. Read the capacity-message-only Python diff in the UI commit;
  backend lifecycle logic in `3479e06a` was independently passed elsewhere and not re-audited.

Read AGENTS, the applicable audit rulings, both implementation reports, retained test-first
evidence, the exact diffs and the affected callers. R14/R16 exclusions were maintained; no
narrow-width, keyboard-only or screen-reader findings were introduced.

## S1-010 / App scroll restoration

The two-line production change disables native overflow anchoring on the actual `main` scroller
inside the existing restoration layout effect, before assigning its saved `scrollTop`. It
does not change the history-entry identity, offset storage, route matching, scroll listener,
page title or route's own item-positioning behavior. ConnectedApp has its own entry point and
does not run this hook. The existing unbounded offsets map remains the explicitly assigned
Stage 6 question, rather than a new defect caused by this patch.

Test-first evidence is valid: `small-review-evidence/history-red.json` records Chrome's four
returns from independent 700px at 732/764/796/828px, with each Kit arrival zero. The diagnostic
control records exact restoration with only anchoring disabled. The finite probe's original
four-loop expectations were retained; manual-position guards were added afterward. No gate or
timeout was changed to make it pass.

I rebuilt the pinned worktree and independently ran the retained finite native probe, without
its diagnostic override. Results in `/workspace/scratch/review-small-history.json`:

| Browser | Four Kit arrivals | Four Model returns | Additional Back / Forward |
| :--- | :--- | :--- | :--- |
| Chrome 157.0.8103.78 | 0, 0, 0, 0 | 700, 700, 700, 700 | 910 / 310 |
| Edge 155.0.4283.62 | 0, 0, 0, 0 | 700, 700, 700, 700 | 910 / 310 |

Both have zero external requests and zero page errors. Probe exit 0. Independent App and
route-change tests: **73 passed**, exit 0. Evidence:
`/workspace/scratch/review-small-app-tests.log` and `review-small-history.log`.

## T10 / unavailable draft and capacity recovery

`draftErrorText` translates only `RequestError` with status 404 and exact message
`unknown submission`. Other failures retain their original error text. Both relevant callers
use it: the general draft-operation catch and the refused Submit catch. The latter still
clears review acceptance/approval and requires review again; uncertain network Submit handling
is unchanged.

The recovery paths clear obsolete draft/upload/reading bookkeeping, while the selected `File[]`,
issuer/date/analyst answers, and available prior-copy state stay local. A retry therefore creates
a new draft, uploads those same selected file bytes and reads again. No approval digest, cap,
source identity or Submit endpoint changed. The capacity refusal now truthfully names the
existing two-hour/24-hour policy; it introduces no replacement policy.

The retained UI red evidence shows the exact unavailable-draft message test failing on raw
`unknown submission`, while the unrelated 404 control already passed. The retained capacity
red evidence shows its exact actionable text failing on the old `try again later` sentence.
The sole existing frontend expectation changed is the exact 404/unknown-submission wording,
which is required by the finding. No numeric or analytical expected value changed.

Independent focused checks:

- Full `StartRun.finalAudit.test.tsx`: **25 passed**, exit 0, including unavailable-draft retry
  and the unrelated-404 control (`/workspace/scratch/review-draft-ui-tests.log`).
- Existing mocked refused-Submit cases in `ConnectedApp.test.tsx`: **2 passed**, exit 0
  (`/workspace/scratch/review-draft-submit-refusal-tests.log`). Other tests were unselected by
  the focused name filter; no test was edited or disabled.

I also authored and ran a separate finite native probe at
`/workspace/scratch/review-draft-native.mjs`, using the rebuilt connected bundle. It serves
static files from temporary loopback, sets synthetic mode and intercepts every context/API
response before it reaches an application server. Native Chrome and Edge each exercise:

1. A first document-reading request refused with exact 404/unknown submission.
2. A first draft-creation request refused with the exact reviewed capacity text.

In all four browser/scenario combinations the exact recovery sentence is visible; issuer
Northbridge, as-of 2026-10-31, analyst Ana L and annual.txt remain; retry creates a second draft
and reaches Purpose. The unknown-submission case uploads the exact bytes `filing` as annual.txt
twice; capacity uploads those exact bytes once after recovery. There are zero unexpected API
paths, external requests or page errors. No `/submit` request is made, and zero API/context
requests reach the static HTTP server. Probe exit 0; observations in
`/workspace/scratch/review-draft-native.json` and `.log`.

Probe correction disclosed: the first native attempt incorrectly asserted that the raw HTML
file input retained its FileList. The shared FileUpload intentionally resets the raw input
after selection so the same file can be selected again. That is not loss of the application's
selected File objects. I removed that unrelated harness assertion and retained the stronger
behavior check: the visible selected filename plus exact filename/bytes re-uploaded on retry.
No application source or expected financial value was edited.

## Independent quality and limits

Both exact worktrees rebuilt successfully with `npm run build`, including TypeScript checking,
exit 0. Existing chunk-size warnings remain. Scoped ESLint (`--max-warnings=0`) and Prettier
checks pass, exit 0, on App/route tests and StartRun plus its changed intake/ConnectedApp tests.
All checks were bounded by `timeout 300`; Vitest used `--maxWorkers=1`, with normal test timeouts.

An execution-environment disconnect occurred mid-review. On reconnection I retrieved completed
test/build logs and continued native checks successfully. It did not require any source edit.
Both worktrees still have only their pre-existing untracked tooling symlinks.

The small change designs are appropriate: the existing restoration owner controls anchoring;
one exact error discriminator shares recovery wording across existing draft catches. No extra
restoration layer, source slot, retention table, dependency or abstraction is needed. Named
confidence-review/rewrite-tournament tools are not available; this independent read and the
adversarial native retry checks are the direct fallback, with no claim of a named-model review.

Not verified: fresh independent full Signal or full frontend/Python suites; backend lifecycle
logic already independently reviewed; Windows/work-PC behavior; all application routes; live
provider behavior, paid execution, real Submit and Teams. Native draft responses are explicitly
mocked and prove UI recovery/state preservation, not a real service's eviction timing.
