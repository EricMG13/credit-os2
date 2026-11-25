# credit-os (Claude sessions, local and cloud)

Project rules are in `AGENTS.md`; read it first. This file only fixes how sessions are organised.

- Non-trivial work runs as a coordinator: it plans, writes each step's brief as a file, runs `/advisor` on the plan once before the first dispatch, then dispatches `mx-*` agents (`.claude/agents/`). The coordinator writes no code.
- Models and effort: `mx-scaffold` (Sonnet, low) mechanical work with a full spec; `mx-feature` (Sonnet, medium) everything else that writes code; `mx-precise` (Opus, medium) task review; `mx-adversary` (Opus, xhigh) money and ordering code only; `mx-architect` (Fable, high) the whole-branch review; `mx-advisor` (Fable, high) read-only plan critique.
- Fix rounds: at most two Sonnet rounds per task, and only a round fixing a High or Medium finding counts. A third goes to `mx-autonomous` (root cause and smallest fix plan) then a fresh `mx-feature`. No fourth: take the open findings to the owner.
- A plan step is its own sub-session only if it ends in its own PR, shares no file with another step, and neither needs nor supplies another step's result. One roadmap phase at a time; no session sets a `/goal`.
- Finish: quality gate, then the pre-merge review, then tell the user to type `/ship`. Only the user can start `/ship`, and it never merges. Merges happen on the owner's instruction.
- Cloud sessions see only this repo. `.claude/agents/` and `.claude/commands/` are copies of `~/.claude/`; refresh them when the originals change.
- Rulings (2026-11-25): the PR review is the `mx-architect` pre-merge review; `/ship`'s own review adds no round (act only on High or Medium findings; on docs/config PRs it is the whole review). Controllers here run Opus 5.5 `xhigh`. The 2026-11-15 deadline rulings lapsed on 2026-11-16: merges are on the owner's instruction only. Check copy drift with `diff -rq ~/.claude/agents .claude/agents | grep -v impeccable | grep -v opus55`.
- Cloud sessions load `.claude/agents/` (confirmed 2026-11-25, relayed by the owner). Not verified: that they load `.claude/commands/` (`/advisor`) or this file, or that cloud agents run on their configured models.
