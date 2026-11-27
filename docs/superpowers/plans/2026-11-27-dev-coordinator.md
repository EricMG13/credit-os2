# Rollout plan for the Credit OS2 development coordinator
Revised proposal · 27 November 2026 · implementation authorized. The [operating specification](../specs/2026-11-27-dev-coordinator.md) defines behavior. The [review candidate](2026-11-27-dev-coordinator-candidate.md) is retained for comparison. Each milestone below has an observable exit. A local pass qualifies that capability on that client only.

## First pilot

Use a disposable checkout pinned to the SHA returned by GitHub for main. The audited workstation checkout was 921 commits behind the audited remote revision, 41b4db37. Capture the actual base again at kickoff. Default to one builder, one coordinator and one fresh reviewer at the applicable review stage. Existing sensitive-code and frontend obligations still apply. Prefer sequential delivery until a slice meets the project’s existing independence rule. [Project instructions at audit](https://github.com/EricMG13/credit-os2/blob/41b4db37/CLAUDE.md) · [Project orchestration ruling](https://github.com/EricMG13/credit-os2/blob/41b4db37/docs/rulings/2026-11-25-session-orchestration.md)

| Milestone | Change | Acceptance test and evidence |
|---|---|---|
| 1. Prove the entry point and authority | Bind the native client’s supported entry mechanism to one project instruction. Show the repo, baseline, spec, plan, limits and merge authority. Keep a plain-language alias. | In fresh local Claude and Codex sessions try literal /dev, research-only, an ambiguous follow-up and approval of an obsolete draft. Only approval of the current pair starts a writer. A sibling fixture receives zero Credit OS2 rules. In each native editing tool, deliberately introduce and correct a lint error. Record the event and actual rejection. Repeat in each cloud client before enabling it there. Restore prior settings in the disposable copy. |
| 2. Complete one vertical slice | Use a synthetic Coverage Monitor case with independently specified deteriorating, unchanged, missing-prior and true-zero results. Drive the existing server and web application from the approved examples. Reuse existing CI, reviewer and browser proof. | Change only a backend formatter so a missing prior appears as zero. Component tests alone cannot finish the task. Observe the wrong value in a running browser, repair, rerun the live journey and critique the repaired rendered state. Verify that the zero row remains correct. Record base/head, the full candidate tree, browser and expected/actual results. Owner sees one ranked summary. |
| 3. Verify merge independently | On an explicitly authorized disposable protected pilot target, require current CI and a trusted evidence check. Use the existing four CI jobs, adding only the missing proof binding. Bind owner merge authorization to candidate and target. | Attempt a merge with stale review, same-name check from a different producer, missing required browser evidence, changed integration base and unauthorized actor. Each fails for its intended reason. A valid owner-authorized merge succeeds and the merged tree contains the verified repair. Keep repository-wide rollout pending until the solo-maintainer positive case works. |
| 4. Prove steering and recovery | Reuse the coordinator’s run ledger. Persist decision IDs, approved revisions, attempt state and a recovery checkpoint. Workers return to the same coordinator. | Replay an explanation twice, override a decision during a build, interrupt the worker, then deliver its old result after resumption. Expect one applied override, no stale merge evidence and one accepted writer result. Continue an independent slice during a material question. Prove cancellation/limits while two features compete. Cross-provider dispatch earns its own test including correction and return without human relay. |
| 5. Turn on measurement in observation mode | Derive the measures in the spec from existing workflow events. Link detection, reproducer, repair, verification and merge. Backfill a small known sample. | Use #136/#139 to distinguish detection from delivery, #144 for two distinct findings, and a tournament/sweep pair for one shared refactor. Inject a duplicate event, missing effort, an abandoned task and a stronger reviewer. Verify totals and missing-coverage warnings by hand. Publish sample denominators with every recommendation. |
| 6. Allow bounded automatic route changes | Pilot only on an approved role and task family with a known-good fallback. One candidate change at a time. Test eligibility, canary and rollback in a disposable registry before live use. | Run the two worked telemetry cases in the spec. Demonstrate a route switch, a context repair with the route retained, a rollback and an owner override through a decision ID. Verify next dispatch resolves to the selected route and the owner receives the reason. After a synthetic pass, complete a real low-risk slice per promoted client/environment. |

## Which skills earn a place

The selection below is for development of Credit OS2. Local presence is inventory evidence. The actual client must demonstrate loading and producing the expected outcome. Use pinned existing copies first. Check upstream license and revision before incorporating external code.

| Need | Choice and boundary | Why |
|---|---|---|
| One coordinator and spec-driven implementation | Adapt installed Superpowers subagent-driven development and writing-plans. Keep Credit OS2’s task split, reviewer and fix limits. | Already installed on both client surfaces. Another spec-to-PR framework would add a second plan and dispatch path. Borrow Spec Kit’s requirements-to-task coverage question as a preflight check. [Superpowers](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md) · [Spec Kit](https://github.com/github/spec-kit) |
| Correct context with fewer interviews | Adapt the local grill-with-docs question pattern. Read the ruling, inspect the real output, ask only when two answers change the outcome. Put the answer in the existing spec or ruling. | Better suited to unresolved intent than a general planning pass on every prompt. Omit its automatic ADR/glossary creation. [Upstream skill collection](https://github.com/mattpocock/skills) |
| Browser verification and critique | Use Credit OS2’s proof:connected script and installed Playwright Pro for gaps in journey coverage. Use Impeccable on the same live state. Borrow the journey-test structure from caos-v2 where needed. | The project already launches a real browser. Add targeted assertions and proof binding before adding a harness. For design work compare the same asset class across the approved design register, recording inaccessible catalogues and the selected reference. [Project entry](https://github.com/EricMG13/credit-os2/blob/41b4db37/web/package.json) · [Historical journey](https://github.com/EricMG13/caos-v2/blob/70e191ac/frontend/tests/journey/journey.spec.ts) |
| Code and design review | Keep confidence review, post-edit tournament and independent review under the existing project policy. Use each pass’s first unique finding. | #144 had two distinct fixes. A local tournament and sweep identified the same catalogue lookup. Count that once. An adversarial prompt requiring one finding per persona must not set severity by vote; independently confirm effect and scope. [Two repairs](https://github.com/EricMG13/credit-os2/pull/144) |
| PR status and learning | Reuse native check events or bounded polling. Adapt the existing babysit skill only for an active PR needing reconciliation. Use the benchmark-agents skill’s separation of cases and scoring as a reference. | The local benchmark harness targets Vercel skill injection; it measures a different outcome from accepted Credit OS2 changes. Prefer a deterministic summary and blind outcome scoring. Use OpenTelemetry naming where provider events already expose suitable fields. [OpenTelemetry GenAI conventions](https://github.com/open-telemetry/semantic-conventions/tree/main/docs/gen-ai) |

## Operational cost and ownership

Reuse the current project handoff and PR evidence. The spec/plan pair owns intent; the existing private run ledger owns live state; the PR binds final proof to the candidate. Text, optional UI and metrics are projections of those records. The pilot adds one logical route policy scoped to Credit OS2. Only the coordinator applies approved routing decisions. An independent reviewer cannot promote its own route. Begin with no monitoring daemon, no standing PR agent and no separate telemetry service.

Measure complexity alongside quality. Per accepted task, report owner interruptions after approval, worker dispatches, duplicate reviews, authoring time spent on evidence, rework minutes and total elapsed time. Record budget and number of independent slices before estimating savings. Compare like-for-like pilot slices with their baseline. Treat more than one routine interruption or duplicate review on an unchanged revision as a workflow defect. Build an optional read-only monitoring view only if users reconstruct state manually twice in the first ten sessions. Desktop and mobile show the same ranked decisions and proof links.

A one-slice clean path needs one paired approval, one builder, the existing review obligations, one applicable live proof and one owner merge decision. A second UI, polling agent or extra evidence document would add work to every slice without changing any of those acceptance conditions. Instrument actual operations before claiming a speed or cost improvement.

## Adversarial review and resulting changes

A fresh Astra reviewer received the candidate documents without the drafting conversation. Its verdict was **revise before implementation**. The cases below are adversarial walkthroughs of the written rules. The operational pilot must still execute them.

| Candidate failure or excess | Decision incorporated into the spec | Negative control for the implementer |
|---|---|---|
| One reply could approve a changed financial definition twice or authorize an unseen delta. | Present the revised example and exact spec/plan pair once. Use a conditional transition and reject superseded affected attempts. | Reply twice, redirect during review, and let the old worker finish last. Only the accepted revision advances. |
| Two workers can spend the same headroom. A retry could spend it a third time. | Reserve a conservative bound atomically before launch and reconcile once across runs. | With $3 free, submit two $2 launches simultaneously. At most one starts. Duplicate completion restores capacity once. |
| A cohort of five failed or Medium-rated canaries could qualify under v1. Queue and owner time could be misattributed to Luna. | Require five completed, independently graded passes against explicit thresholds. Track causal attribution and critical-path time separately. Limit initial automatic switching to builders. | Two clean replay outputs plus four timeouts fail the six-pair trial. Five canary Mediums, four passes plus timeout, unknown effort, a stronger reviewer or a missed proof must not promote. Parallel four-minute calls report eight worker-minutes and about four elapsed minutes. |
| Screenshots could come from a stale build. A self-declared Perfect could survive base drift. | Verify candidate build identity and independently expected visible result, grade only a complete scope and bind merge to the tested tree. | Serve yesterday’s build, then move the target base after valid proof. Both prevent completion until fresh proof. |
| A universal browser check, new dashboard and duplicated ledgers would increase operating cost. | Require real browser proof for every visible consequence. Use contract tests for a demonstrated contract-only change. Project one decision record into chat, metrics and any future UI. | A backend numeric display change must trigger live proof; an isolated internal event rename with verified unchanged consumers follows the contract path. |
| One successful environment could be reported as universal availability. | Maintain separate rows for Claude local, Codex local, Claude cloud and Codex cloud. Track literal /dev, routing, recovery, browser, independent review and merge evidence per row. | A green Codex-local run leaves every untested cell pending. |

At the end of each pilot, publish the measured operation counts, incomplete checks, surprises and whether the simpler workflow met the approved outcome. Roll back a failing capability to its prior version and retain its evidence. Broader deployment was authorized on 27 November. Each capability still earns its stated acceptance evidence.

## When the learning loop is worth its cost

One paired trial over six tasks costs twelve builder attempts plus blind scoring; the five-task canary uses the next five eligible real tasks. Reserve that budget explicitly and compare it with avoidable rework before starting the replay. For example, saving ten worker-minutes on each of twenty expected similar tasks returns 200 worker-minutes. If trial overhead is 240 worker-minutes, retain the incumbent and accumulate evidence unless the approved objective puts avoided material defects ahead of time savings. This arithmetic is a planning example. Publish actual minutes, spend or unknown spend at trial completion.

Use event-based progression on task completion, a newly linked escape, deadline, or owner instruction. During a long task, a deterministic timer may report a missed checkpoint and remaining allowance. Re-read an unchanged PR only on a bounded polling interval when its client lacks check events. The first pilot measures whether these signals are sufficient before adding monitoring infrastructure.

## Initial pilot evidence

The implementation worktree started at GitHub main `0563bccc`. The local project entry points share
one policy in `AGENTS.md`. Claude's local initialization lists `/dev`. Codex's local prompt
inspection lists `$credit-os2-dev` and the shared rules. Use the skill or plain-language entry on
Codex until the literal slash binding is proven. Two ongoing Codex chats acknowledged the
coordinator rules and applied decision IDs to their existing work.

The initial pilot used the run ledger for state and `python tools/dev_route.py <trial.json>` to evaluate
independently scored evidence. An eligible result is the evidence for a routing decision. A
client needs a verified dispatch binding and authorized route limits before applying a decision
to an actual worker. Use the running application and record browser and critique proof in the
existing PR evidence.

| Capability | Local Claude | Local Codex | Cloud |
|---|---|---|---|
| Entry discovery | Native command listed in initialization | Project skill and instructions in prompt input | Pending |
| Active chat adoption | No running Credit OS2 Claude background agent listed | Two active chats acknowledged adoption | Pending |
| Live dispatch and recovery | Pending | Pending | Pending |
| Existing connected desktop browser proof | Chrome and Edge pass against the local build | Same local harness and evidence | Pending |
| Trusted evidence check and protected-branch rejection | Pending | Pending | Pending |
| Qualified automatic route changes | Pending | Pending | Pending |

The offline ledger takes an already approved pair and integer amounts in a single unit, such
as cents. Point coordinators sharing a limit at the same database path. For a local disposable
fixture, use:

```sh
uv run python tools/dev_ledger.py --db /tmp/dev-pilot.sqlite start pilot spec-v1 plan-v1 300 2
uv run python tools/dev_ledger.py --db /tmp/dev-pilot.sqlite launch pilot a1 1 200 spec-v1 plan-v1
uv run python tools/dev_ledger.py --db /tmp/dev-pilot.sqlite settle pilot a1 150
uv run python tools/dev_ledger.py --db /tmp/dev-pilot.sqlite accept pilot a1 1
uv run python tools/dev_ledger.py --db /tmp/dev-pilot.sqlite status pilot
```

In actual use, store the approved content digests in place of the example IDs. The client owns
owner identity, authoritative approval and candidate evidence. The ledger serializes budget
and revision decisions on a single host. An overrun freezes launches for that database while
the coordinator reconciles spend. Old worker results can settle costs while integration
refuses superseded output. The current pilot conservatively invalidates all older results
from that run when a decision advances. Selective reuse needs verified dependency tracking.

## Operating the local release after the initial pilot

The coordinator owns these calls. The owner approves the card in chat and can steer by
decision ID. Use the absolute database path returned by the card for every local command,
including the route registry. Keep it outside every builder's writable worktree.

| Milestone | Coordinator operation | Result to show |
|---|---|---|
| Discover | Run `dev_ledger.py card SPEC PLAN` from the intended checkout. Compare the cached target with GitHub and check the relevant rulings and working-tree changes. | Outcome, checkout, candidate, target, acceptance examples and document digests. |
| Approve | Record the displayed digests, deadline, capacity and approved dispatch-policy digest with `dev_ledger.py approve`. Use the complete command in AGENTS.md. | One acknowledgement for the approved pair. Repeating it leaves the run at its current revision. |
| Work | Resolve the approved cohort in that database and dispatch into a separate Credit OS2 worktree. Retain the effective model and effort and the worker output. Verify the result before accepting the attempt. | Plain-English milestone. Escalate a blocked permission, changed product meaning or exhausted limit. |
| Steer | Use `status`, `explain` and `decision` for run choices. A pause or redirect invalidates earlier writer results. Use the route registry for a route reversal and identify the specific decision. | Owner decisions first, reversible choices already applied second, verified work third. |
| Learn | Record the independently verified first review, resolved worker route, accepted elapsed time, rework, costs and evidence digest. Assess the same client, task family, risk and scoring protocol. | Report the sample size, missing observations and probable cause. Apply a qualifying route within the approved allowlist. Show the decision ID and fallback. |
| Deliver | For a visible change, drive the running app in a real browser using independent expected values, inspect the rendered state and link the proof to the PR candidate. Check GitHub CI and the tested integration tree. | Report verified coverage and any untested surface. Request the owner's merge decision for the specific SHA and target. |

A confirmed cost overrun stops dispatch across the shared ledger. The coordinator reports the
attempt, reserved amount, actual charge and remaining headroom. After the owner reconciles that
charge, `dev_ledger.py reconcile RUN ATTEMPT ACTUAL REASON` releases the freeze and preserves
the actual spend against the existing cap. A new route or wider ceiling requires its own authority.

## Server-side enforcement pilot result

The disposable target required an up-to-date browser check from GitHub Actions (app 15368)
and applied that rule to administrators. A real Chrome run displayed 0 for a missing prior and
failed its base-revision oracle. A same-name success status posted by the owner could not
satisfy the required check. GitHub returned HTTP 405 for pending or failed proof, HTTP 409
for a superseded approved SHA, and HTTP 405 after the previously green candidate's base moved.
The updated candidate passed real Chrome and merged with the same Git tree,
`ec2570b1fb3c801ec2e5cfbf7bc355618d675a3d`. Main has no equivalent effective rules.
This pilot used one repository administrator and a workflow that the test candidate did not
modify. Independent actor permissions and protection against a change to the proof workflow
itself remain separate controls. [Negative and repaired fixture](https://github.com/EricMG13/credit-os2/pull/179)
· [Base movement](https://github.com/EricMG13/credit-os2/pull/180)

## Client availability

The private `credit-os2` Codex Cloud environment was published on 27 November with only the
Credit OS2 repository. Its setup checkout matched GitHub main and passed the recommendation
table smoke test after installing locked Python and Node dependencies. Qualify coordinator
dispatch separately on the rollout candidate. Local Claude authentication is unavailable, so
a live Fable test is pending.

Credit OS2 uses subscription access for development work. The plan and pre-merge review roles
select Astra medium on Codex and Fable medium on Claude. Automatic route changes also honor
the effort limit. A quota or identity failure pauses the affected work and produces a status
update for the owner.
