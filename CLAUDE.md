# credit-os-connected (Claude sessions, local and cloud)

@AGENTS.md

`AGENTS.md` (imported above) holds the project rules. This file only fixes how sessions are organised.

- Non-trivial work runs as a coordinator: it plans, writes each step's brief, runs `/advisor` on the plan once before the first dispatch, then dispatches `mx-*` agents (`.claude/agents/`). The coordinator writes no code.
- Briefs and `/advisor` critiques live in `.superpowers/sdd/<plan>/` (gitignored, never committed, so they add nothing to the repo). A cloud sub-session gets its brief in its start prompt.
- Models and effort: `mx-scaffold` (Sonnet, low) mechanical work with a full spec; `mx-feature` (Sonnet, medium) everything else that writes code; `mx-precise` (Opus, medium) task review; `mx-adversary` (Opus, xhigh) money, ordering/concurrency and security code; `mx-architect` (Fable, high) the pre-merge review; `mx-advisor` (Fable, high) read-only plan critique. A sub-session runs on its coordinator's model.
- Fix rounds: at most two Sonnet rounds per task, and only a round fixing a High or Medium finding counts. A third goes to `mx-autonomous` (root cause and smallest fix plan) then a fresh `mx-feature`. No fourth: take the open findings to the owner.
- A plan step is its own sub-session only if it ends in its own PR, shares no file with another step, and neither needs nor supplies another step's result. Only the coordinator writes shared records (`VERIFICATION.md`, rulings, the ledger), at merge; a sub-session returns its lines in its report.
- Finish, in order: quality gate; the coordinator runs `confidence-review` and `rewrite-tournament` on the branch diff, with fixes going to `mx-feature`; the pre-merge review (`mx-architect` on the PR diff, running `adversarial-reviewer` where the skill exists, else the same review with the CRITICAL/WARNING/NOTE to High/Medium/Low map); then tell the user to type `/ship`. `/ship`'s own review adds no round: act only on a High or Medium finding it raises. Merges happen on the owner's instruction.
- Docs/config-only PRs skip the confidence-review, tournament and pre-merge steps; one `mx-feature` review covers them.
- `.claude/agents/` and `.claude/commands/advisor.md` are copies of `~/.claude/`. Whoever edits an original refreshes the copy. Check (exit 0 means in sync): `diff -rq -x 'impeccable-*' -x 'opus55-*' ~/.claude/agents .claude/agents && diff -q ~/.claude/commands/advisor.md .claude/commands/advisor.md`
- Agent files mention this Mac's harness (Monitor, rtk, no `timeout` binary). In cloud sessions those lines do not apply and `timeout 300` works as `AGENTS.md` says.
- Cloud sessions load `.claude/agents/` (confirmed 2026-11-25). Not verified: cloud loading of `.claude/commands/` and of this file.
