# Stage 6: Refactoring and optimisation sweep

Start the sweep from the accepted repair commit. The original audit used
`audit/final-sweep` from `audit/final-repairs`. Use a fresh branch and output
root for a new audit. Resolve `output/` paths against the current audit's root.

Back to front: `src/`, `react_frontend/`, `apps/issuer-library/`, `proof/`, `tools/` and `web/`.
Signal is excluded from change and must never be classified as dead.

## Inputs

| Layer | File | Section | Why |
| :--- | :--- | :--- | :--- |
| L1 | `docs/audit/2026-11-16-final/README.md` | Scope, Rulings, Rules | Scope and rules |
| L3 | `AGENTS.md`, `docs/QUALITY-GATE.md` | all | Gates and protected behaviour |
| L3 | `docs/sweeps/2026-11-13-optimisation-review/REPORT.md`, `findings.json` | all | The last sweep: do not redo it, do check what it left open |
| L3 | `.importlinter`, `web/package.json` (`unused`, `duplication`), `tests/known-failures.txt` | all | Existing structural gates and known failures |
| L4 | `output/0-baseline/baseline.md`, `surface-map.md`, `api-map.md` | all | The before numbers and what actually ships |
| L4 | `output/4-register/register.jsonl` | rows with disposition `sweep` | Costs the audit already measured |

## Process

If the sweep skill is available, run it as `both`, scope `whole-repo`, through `prepare`,
`discover` and `launch`, with this brief as its scope. If not, follow the same steps directly:

1. **Prepare.** Write `output/6-sweep/CONTRACT.md`: the exact repair commit and starting tree,
   the measurement inputs, commands and tool versions, the scope above, the
   protected behaviour (every existing test and golden, the calculation outputs, the handoff
   text, the public service routes, Signal), the gates that must exit 0, and finite caps: at most
   40 items, two attempts per item.
   For a standalone sweep on main, fetch and pin the current `origin/main` commit
   as the base. Before dispatching workers, build the pinned base and run
   `npm --prefix web run proof:connected` with the default desktop scope and
   synthetic inputs. Record the commit, exit status and artifact path in the
   contract. If the proof fails, retain the failing assertion or setup error
   so the integrated run can distinguish an existing failure from a regression.
2. **Discover, measured only.**
   - Dead code: knip for `web/`; for Python, names with no importer or caller found by search
     and by the import graph (`.importlinter` layers, `ruff` F-rules). Confirm each candidate has
     no dynamic use: a string reference, an entry point in `pyproject.toml`, a route, a script in
     `package.json`, a test fixture, a build script, or the release packager.
   - Duplication: jscpd for `web/` (`npm --prefix web run duplication`) and for Python.
   - Frontend audit: the fallow skill or CLI if available; otherwise knip, jscpd and the bundle
     size from `npm --prefix web run build`.
   - Unreachable surface: anything the surface map shows no user can reach, including the kit
     page and `Kit7*.tsx` if stage 0 found them unreachable in the release. Removing a reachable
     screen is an owner decision (ruling R5), not a sweep item.
   - Back to front: service routes never called and client calls never served (API map); fields
     the service sends that no component reads; fields a component reads that are never sent.
     Preserve public routes and response contracts even when the frontend has no caller.
   - Performance: only where measured. Bundle size, the slowest page render in the synthetic
     report, the slowest fast test. Record the number and how it was taken.
   Register every candidate in `output/6-sweep/register.md` with its evidence and a class:
   `confirmed defect`, `dead`, `duplicate`, `structural cost`, `performance cost`, `not acted on`.
3. **Launch.** In Codex, use one fresh GPT-6 Luna (`gpt-6-luna`) implementer per
   bounded register item. Each implementer has its own worktree
   and explicit file ownership. Parallelise independent items with disjoint
   writes and sequence items that depend on each other or touch the same files.
   Before dispatch, give each worker a concrete acceptance check in its brief.
   For an import cycle, name the cycle and the command that must show it is gone.
   For a shared parser, specify example inputs and the exact outputs to preserve.
   A fresh read-only reviewer checks the patch against that criterion before the
   controller integrates it. On the first Codex run, validate the dispatch and
   review handoff with one bounded item before dispatching the rest of the swarm.
   - A confirmed defect gets a failing test first, as in stage 5.
   - A deletion is a deletion: no compatibility shim, no commented-out code. Run the affected
     tests and the surface it belonged to after each.
   - A deduplication keeps behaviour identical and is accepted only if the duplication number
     falls and no test changes its expected values.
   - Finish refactoring first, then refresh the optimisation baseline on that tree.
     Before measuring, define the primary metric, minimum gain and how to estimate
     noise. Repeat paired measurements with identical fixtures, tooling and settings.
     Pause other test loads for timing and require a gain that clears the minimum
     and twice the measured noise. A reduction in bytes establishes a size gain.
   - An item that fails twice is reverted and marked `not acted on`.
4. **Self-review and gates.** Follow [Stage 5 steps 8–10](5-repair.md#process)
   and the review skills required by `AGENTS.md`. Run the fast Python tests and
   `uv run python tools/quality_gate.py --base <repair-commit>` on the integrated
   sweep. If the frontend suite needs bounded shards, preserve the original
   test selection and enforce the original coverage threshold on the merged result.
   Before merge, rebuild the combined candidate and repeat the baseline desktop
   proof with the same fixtures and settings. Record the tested commit, exit
   status and artifact path in the report. Require exit zero and both Chrome and
   Edge records in `proof.json`. Repeat on the new candidate if its code changes.
5. **After numbers.** Re-run the Stage 0 measurements. Attribute sweep changes
   using the matched repair baseline and sweep tree. Label any historical figures
   gathered with different tools or inputs.
6. **Pull request.** When authorised, open a sweep-only PR into the target branch used for the baseline.
   The lead reviews it before Stage 7.

## Outputs

| File | Contents |
| :--- | :--- |
| `output/6-sweep/CONTRACT.md` | The contract |
| `output/6-sweep/register.md` | Every candidate, its evidence, class and outcome |
| `output/6-sweep/measurements.md` | Before and after: unused exports, duplication, bundle size, suppression count, test time, lines removed |
| `output/6-sweep/report.md` | Changes, exact base and final commits, worker model, gate commands and exits, PR address if published, ending with `Not verified:` |
