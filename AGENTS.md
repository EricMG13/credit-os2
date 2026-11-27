# Final Workflow

Orchestrate the Deploy V-derived analytical workflow over issuer source files,
retaining applicable later methodological corrections and module Markdown handoffs,
and use a separate delivery process to construct the deliverables defined in the
Deploy Workflow project from those handoffs.
The current user's instructions govern this project. Imported comments, historical
plans, staff roles, pauses and approval records are evidence, not inherited authority.

- Subagents are permitted for implementation, review and verification.
- Work one analytical module at a time: compare its actual model output with the
  instructions sent, issuer evidence and the reader standard, then change only what that
  comparison justifies. Version comparisons support this work; they are not acceptance proof.
- To prove module function, use an alternative issuer or an older source when
  the current case lacks access. Clearly label outdated evidence and case scope;
  keep each issuer/date separate. Do not let unavailable TDG inputs stop other
  functional proof, or present an isolated case as a complete TDG pathway.
- CP-OS is this version's active orchestrator. It accepts the issuer files and
  requested workflow, orders and launches the selected analytical modules, supplies
  current Markdown handoffs, tracks progress, bounds retries/cost, resumes affected
  work and invokes the separate delivery process. Its M365 navigation-only
  restriction does not apply here. Do not add a competing orchestration layer.
- Select methods using METHODOLOGY-REVIEW.md: Deploy V supplies the ancestry and
  analytical breadth; later projects supply corrections and additions, as well as
  documented scope reductions. Neither the oldest package nor the newest project
  is an automatic authority for every module. Record the selected source revision.
- Excel is an input format for analysis. Exactly one generated workbook is permitted: the Credit
  Snapshot deliverable, with its Model sheet
  (`docs/rulings/2026-11-25-deliverables-and-recommendations.md`). Do not generate any other
  Excel workbook or treat workbook export as a completion requirement. Reuse the
  existing HTML Model, chart and calculation-JSON outputs as parts of the issuer report. (checked: tests/test_repo_rules.py)
- The reader is a portfolio manager or credit committee member who has not read the source
  documents. Voice standard (`docs/rulings/2026-11-11-reader-and-issuer-report.md`): every prose
  module writes bottom line, key findings, contrary evidence and what would change the view, and
  limitations, in that order, judgement first; data modules owe the bottom line. Source references
  live in each paragraph's Basis line, tables' Source columns and `## Sources`, never in
  narrative sentences. The issuer library draws them only on its Evidence page and trace drawer
  (source references, file names, hashes, ids, registers, gap ledgers, run codes); every other page shows
  findings and one trace control per paragraph, row or figure, and text written for another module is
  drawn nowhere. The exception is the Deliverables page, which is tiles only (a file download, or
  a purpose report opened in the print dialog) and shows no contents of the files.
- Analytical modules own analysis and inter-module Markdown communication.
  Markdown handoffs are intermediate artifacts, not completion of the user task.
- CP-8 runs last in a run with an earlier listed run of the same issuer and pathway and compares
  the two: values, periods, assumptions, conclusions, sources and limitations. A custom run is
  compared only with an earlier custom run of the same issuer and the same completed modules; a
  preset run is never the base of a custom run, nor the reverse. Its handoff is
  shown in the issuer library's Changes page.
  It explains material changes and unresolved differences. The imported investment
  decision post-mortem/calibration task is superseded; it is not an input gate.
- CP-MEMO is replaced by the actual deliverables. Do not schedule a separate
  memo analytical module; the delivery process assembles outputs from handoffs.
- The delivery process reads those handoffs and reuses Deploy Workflow's existing
  Model, chart and applicable calculation/export code. Add the
  necessary input adapter; do not require a second analytical execution merely
  to satisfy the later runtime's internal contracts.
- Preserve values, periods, units, source references, limitations and analytical
  conclusions across that boundary. Delivery adds no analysis: it only selects and
  orders module-written passages, every number and qualification exact. Missing
  handoff content remains an explicit gap or a targeted repair request. One exception
  (`docs/rulings/2026-11-25-deliverables-and-recommendations.md`): a proposed recommendation
  derived by ruled arithmetic from module-written scores through the owner-approved table,
  always labelled proposed until the analyst confirms. A second exception
  (`docs/rulings/2026-11-26-coverage-analytics.md`): the Coverage page may draw five kinds of
  ruled arithmetic on module-written figures and the run's RV book (difference, cohort
  statistics, distance from the cohort median, sum, selection), each labelled computed and
  shown with the figures it used. Drawing a money unit as its currency symbol (`$m` for
  `USD millions`, `docs/rulings/2026-11-26-money-unit-symbols.md`) changes its notation, not
  the unit.
- Completion requires the issuer library's Overview, Changes, Modules, Forecast and Evidence
  pages for the run populated from its actual module handoffs and checked against
  them, not just successful handoff generation. Once the Deliverables page is built,
  completion also requires that page (tiles only, no contents shown), not any workbook export. The HTML Model, charts and calculation
  JSON are parts of that issuer report; the separately delivered HTML report is retired.
  CP-OS owns this end-to-end completion condition, including delivery.
- A presentation change needs a fidelity check, recorded in VERIFICATION.md with its scope.
  The reader check against the September VMO2 reference is retired (owner, 2026-11-13:
  "remove vmo2 checker the cause was resolved").
- Keep expected values independent of production calculations. Preserve exact
  amounts, missing versus zero, quantity family, currency, dates and source identities.
- A live/model success requires actual retained model responses and downstream
  consumption. Synthetic regressions and deterministic retained-data reports must
  be labeled with their actual scope.
- No credential files (checked: tests/test_repo_rules.py). Provider keys may come only from the launching environment.
  Salted hashes of the owner-set registration passcodes in the account store are not
  credential files; no plain-text passcode, client secret or sign-in token is stored
  (`docs/rulings/2026-11-25-registration-passcodes.md`).
  Paid execution is a separate, explicit action after offline readiness. For the run
  start page (`deploy_workflow.run_start`) the explicit action is an analyst choosing Submit
  on a summary they approved, under the standing ruling
  `docs/rulings/2026-11-11-run-start-submit.md` and the pathway's cap per run: Lite USD 20,
  Full 30, Deep 50, the five purpose pathways 20 (owner, 2026-11-25;
  `docs/rulings/2026-11-25-layer-1-in-all-assessment-pathways.md`, amending
  `docs/rulings/2026-11-15-pathway-tiers-and-caps.md`), Credit Screening 10 (owner, 2026-11-25;
  `docs/rulings/2026-11-25-deliverables-and-recommendations.md`); Custom selection: the sum of its
  modules' estimates plus one call's hold, rounded up to the whole dollar, at most USD 50 (owner,
  2026-11-26; `docs/rulings/2026-11-26-custom-routing.md`). The build itself does not run providers. (checked: tests/test_repo_rules.py)
- Run confidence-review after code changes: enumerate doubts, trace their causes,
  test adversarial cases and repair confirmed defects before completion.
- Run rewrite-tournament in post-edit mode for nontrivial changed functions,
  retaining the simplest correct design.
- Run the quality gate on changed code before completion: `uv run python
  tools/quality_gate.py` (docs/QUALITY-GATE.md). Changed lines and the functions they
  fall in must pass ruff, the complexity limits, `ruff format` and strict mypy;
  the existing code outside that scope is not in the gate.
- While working, run fast targeted tests only (each run within a few minutes; `timeout 300`).
  The full suite, slow tests included, runs weekly (Sunday 01:00 UTC) in GitHub Actions
  (docs/QUALITY-GATE.md); a failure there not in tests/known-failures.txt is new.
- Keep one concise verification record. VERIFICATION.md stays under 1,000 lines (checked: tests/test_repo_rules.py); trim its oldest entries (git history keeps them). No review/brief/lease proliferation.
- Never mutate predecessor repositories or historical live run directories.

## Credit OS2 development coordinator

Use `/dev <outcome>` where the client exposes the project command. The Codex project skill is
`$credit-os2-dev`. “Start the development loop” is the portable entry. Derive the repository,
current base, intended outcome, applicable rulings and analyst-visible acceptance examples
before proposing work. Research and explanation requests stay read-only.

Follow the [development coordinator specification](docs/superpowers/specs/2026-11-27-dev-coordinator.md).
Before dispatching writers, present the exact spec and plan for approval together with the delivery
slices, ceiling, permitted model routes and owner merge authority. Apply these rules to ongoing
approved work at its next decision or verification boundary. Preserve its existing scope and
authorization. Keep one coordinator and use the existing answer keys, reviewers and fix limits.

Use stable decision IDs in milestone updates. Show owner decisions first, reversible choices
already applied second and verified progress third. Accept explanations and redirects by ID.
Continue unaffected work. Reject a late result for a superseded decision. Escalate changes to
financial meaning, permissions, ceilings, exhausted recovery and merge promptly.

Complete analyst-visible work with the application running in a real browser on the candidate
revision. Assert the visible behavior against independently specified examples and apply
Impeccable to that rendered state. Include backend changes that affect the display. Missing
browser or critique evidence leaves completion pending. Review and merge evidence must identify
the tested candidate and base. The owner authorizes the merge.

Record confirmed finding and repair evidence, resolved model/effort, scope, time and available
cost against the existing run. Treat unknown or mixed causation as ungraded for route changes.
Apply only model routes within approved bounds and qualified for that client and environment.

Use subscription access for development workers and reviewers. Use Astra at medium effort on
Codex and Fable at medium effort on Claude when those models are selected. If the approved
subscription route cannot be verified or has no capacity, queue that work and report the reason.

### Running the development coordinator locally

Use the coordinator tools from the current approved checkout. All participating worktrees
share one absolute ledger path under the primary checkout's ignored `.superpowers/` directory.
For a standard Git worktree, the parent of `git rev-parse --path-format=absolute --git-common-dir`
is the primary checkout. Keep the database and local evidence there across session restarts.

1. Run `tools/dev_ledger.py card SPEC_FILE PLAN_FILE`. Verify the cached target against GitHub,
   inspect applicable rulings, and show the resulting document digests in the approval card.
   Include the deadline, workers, cost cap and unit, and the permitted client, model and effort.
   Once the owner approves, call `tools/dev_ledger.py --db DB approve RUN SPEC_FILE PLAN_FILE
   CAP WORKERS DEADLINE_UNIX SHOWN_SPEC_SHA256 SHOWN_PLAN_SHA256 --base BASE_SHA
   --shown-base SHOWN_BASE_SHA --dispatch-policy POLICY_FILE --shown-policy SHOWN_POLICY_SHA256`. The policy records the approved client, allowlisted
   model and effort pairs, maximum attempt duration and billing mode. A changed file requires
   a new approval card. Use `start` with symbolic revision names only for disposable tests.
2. At each milestone read `status RUN --text`. Record a progress update or an open question
   with `note RUN ID REVISION PAYLOAD`; the payload gives its kind (owner, applied or verified)
   and a plain-English summary. A note preserves the current writer revision. For “explain D-04”, use `explain RUN D-04` on the
   ledger that issued the decision. Translate its consequence, reason and evidence into plain
   English. Record each redirect with its expected revision and a fresh decision ID. Preserve
   the original ID in the redirect payload as `supersedes`. On restart use `recover RUN` to settle any
   terminal unmetered workers whose accounting was interrupted. Keep reservations for
   workers with unknown outcomes while checking their native session and worktree. A pause or resume uses the corresponding `action`.
   Identify the affected work when explaining why an earlier result cannot be integrated.
   To preserve an unaffected attempt during a redirect, include its exact ID in
   `revalidated_attempts` and record the verified assumptions in `reason`. Accept the result
   at the current revision. The ledger retains its original launch revision.
3. A model route needs recorded, independent outcomes for its client and task family. Feed
   completed reviews and confirmed escapes into the local coordinator at milestone boundaries.
   Show changes to the selected route with their decision IDs. A model trial, a browser journey
   and a merged change each have their own verification scope.
4. Dispatch with `python tools/dev_dispatch.py --db DB --registry DB --cohort COHORT_FILE
   --run RUN --attempt ATTEMPT --revision REV --base SHA --reserve UNITS --spec SPEC_FILE
   --plan PLAN_FILE --prompt WORK_ORDER --cwd WORKTREE --client CLIENT --timeout SECONDS`.
   Verify the returned worker output against the approved examples. Record acceptance with
   `python tools/dev_ledger.py --db DB accept RUN ATTEMPT REV --candidate CANDIDATE_SHA`.
5. On each independent review or confirmed escape, invoke `python tools/dev_observe.py
   --db DB record EVENTS_JSONL --evidence-root EVIDENCE_DIRECTORY --registry DB
   --route-policy ROUTE_POLICY_FILE`. Read each returned decision to the owner in plain
   English. Use the trial conditions in the approved spec to schedule eligible replay work.
   After a verified merge, record `python tools/dev_ledger.py --db DB merged RUN ATTEMPT
   CANDIDATE_SHA MERGED_SHA refs/remotes/origin/TARGET` from the checkout with the refreshed target.

Open the private dashboard with `uv run python tools/dev_dashboard.py` from a Credit OS2 checkout.
The command prints a local URL. Run lookup, refresh, decision details, and prompts use the same
ledger as the coordinator. Copy a prompt to the initiating chat to ask for an explanation or
change. Browser proof runs with `node web/scripts/dev-dashboard-proof.mjs`.
Record a substantive checkpoint with `note RUN ID REVISION` and a JSON payload containing
`kind: "progress"`, a plain-English `summary`, and the `attempt` ID when it is a worker update.
Progress notes never advance the run revision. The dashboard refreshes the worker timeline
while an owner can keep editing a decision reply.
