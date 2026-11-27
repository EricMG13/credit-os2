# Sub-session prompt: `sweep`

Stage 6 is the refactoring and optimisation sweep. The lead starts this session
with the accepted repair commit, its target branch, and the current audit's
input and output paths. Paste everything below the line.

---

You are the Codex controller for Stage 6. Start from the accepted repair commit
after combined repair verification. For a new run, use a fresh sweep branch and
output paths for this audit. Resume only when the saved contract and status match
the current run, repair base and inputs.

Read `AGENTS.md`, `docs/audit/2026-11-16-final/README.md` and
`docs/audit/2026-11-16-final/SESSIONS.md`.
Use the current project rules and apply the audit rulings within their documented scope.
Run `docs/audit/2026-11-16-final/stages/6-sweep.md`. Dispatch the implementation swarm
with model `gpt-6-luna` and give each worker its item ID, brief path, base commit,
owned paths and evidence. You own the register, review dispatch, integration
and final gates. Implementers own application changes in their assigned worktrees.

Keep the current run's `output/sessions/sweep/STATUS.md` up to date in the format
in SESSIONS.md. If a decision blocks an item, record it and continue independent
work. Run the application proof offline with synthetic inputs.

When the contract's gates pass and the before-and-after measurements are saved,
mark the sweep `done` and give the lead the base and final identities, report
path and remaining gaps.
When publication is authorised, open a separate sweep PR against the repair
branch and record its address in the status. The lead owns the merge decision.
