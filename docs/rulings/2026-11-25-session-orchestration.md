# Session orchestration for local and cloud sessions (2026-11-25)

Owner asked the coordinator to rule on the conflicts found while adding the coordinator, `mx-*` agents, `/advisor` and `/ship` setup (PR 88).

1. Subagent model env: `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` does not override `mx-*` models (tested; self-reported by each agent).
2. Controller model: credit-os controllers run Opus 5.5 `xhigh` (project amendment wins); elsewhere a sub-session uses its coordinator's model.
3. Fix rounds: two Sonnet rounds, then `mx-autonomous` plan plus a fresh `mx-feature`, no fourth; only High or Medium fixes count. Unchanged.
4. Review: the `mx-architect` pre-merge review is the PR review; `/ship`'s review adds no round.
5. The 2026-11-15 deadline rulings lapsed on 2026-11-16; merges are on the owner's instruction only.
6. Repo copies of `mx-*` are checked for drift with `diff -rq` (see `CLAUDE.md`).
7. Cloud loading of `.claude/agents/` is unverified.
