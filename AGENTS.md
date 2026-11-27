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
  ruled arithmetic on module-written figures (difference, cohort statistics, distance from the
  cohort median, sum, selection), each labelled computed and shown with the figures it used.
  Drawing a money unit as its currency
  symbol (`$m` for `USD millions`, `docs/rulings/2026-11-26-money-unit-symbols.md`) changes its
  notation, not the unit.
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
