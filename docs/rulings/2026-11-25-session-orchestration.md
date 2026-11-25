# Session orchestration for local and cloud sessions (2026-11-25)

Owner asked the coordinator to rule on the conflicts found while adding the coordinator, `mx-*` agents, `/advisor` and `/ship` setup (PR 88).

1. Subagent model env: `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` does not override `mx-*` models (tested; self-reported by each agent).
2. Controller model: credit-os controllers run Opus 5.5 `xhigh` (project amendment wins); elsewhere a sub-session uses its coordinator's model. (Superseded for this repo by the scope ruling below: the amendment covers `~/Documents/credit-os` only.)
3. Fix rounds: two Sonnet rounds, then `mx-autonomous` plan plus a fresh `mx-feature`, no fourth; only High or Medium fixes count. Unchanged.
4. Review: the `mx-architect` pre-merge review is the PR review; `/ship`'s review adds no round.
5. The 2026-11-15 deadline rulings lapsed on 2026-11-16; merges are on the owner's instruction only.
6. Repo copies of `mx-*` are checked for drift with `diff -rq` (see `CLAUDE.md`).
7. Cloud sessions load `.claude/agents/` (confirmed 2026-11-25; the owner relayed the cloud test session's result). Not verified: cloud loading of `.claude/commands/` and `CLAUDE.md`, and cloud agent models.

## Rulings on the `/advisor` critique (2026-11-25, owner asked the coordinator to rule and fix)

The critique ran after PRs 88 and 89 merged, not before dispatch; this record and its PR are the remedy. Rulings follow the inverse-pyramid principle the owner shared (checks over prose; keep prose to judgment calls).

- High, AGENTS.md may stop auto-loading once CLAUDE.md exists: `CLAUDE.md` now imports it with `@AGENTS.md`.
- High, amendment scope: the credit-os amendment in the global file covers `~/Documents/credit-os` only, not this repo. Its one-phase rule, Opus `xhigh` controllers and deadline rulings are removed from this repo's `CLAUDE.md`; a sub-session here runs on its coordinator's model. `~/Documents/credit-os` gets no copies (the owner asked for this project).
- Medium, `mx-adversary` scope: money, ordering/concurrency and security (the lapsed ruling's narrower scope is dropped).
- Medium, unowned reviews: the coordinator runs `confidence-review` and `rewrite-tournament` on the branch diff before the pre-merge review; fixes go to `mx-feature`.
- Medium, brief files: briefs and critiques live in the gitignored `.superpowers/sdd/<plan>/`, so none are committed; cloud sub-sessions get theirs in the start prompt.
- Medium, drift check: replaced with a command whose exit code is 0 only when in sync and which covers `advisor.md`; whoever edits an original refreshes the copies (global §8).
- Medium, cloud gets a partial setup: `CLAUDE.md` now carries the shared-records rule and defines the pre-merge review with a fallback where `adversarial-reviewer` is absent. Skills are not copied; that falls under the YAGNI rule until a cloud run needs them.
- Low, Deploy VII: excluded from global §8.
- Low, Mac-only agent lines: noted in `CLAUDE.md` as local-only.
- Low, controller model not enforced: no change; the model is chosen at launch.
- Low, old sessions run old rules: no change; restart to pick up.
- Low, `rtk` hook versus auto mode: parked for the owner. It is a global hook that affects every project and needs its own investigation.
- Low, matrix stale: date updated and Fable 5.2 priced at $8/$40 per MTok (claude-api skill, cached 2026-11-03).

## Fixes from the `mx-feature` review of PR 91 (2026-11-25)

- Medium: docs/config PRs take one `mx-feature` review; `/ship`'s review adds no round (global §8(b) aligned).
- Medium: item 2 above marked superseded for this repo.
- Medium: in cloud sessions, a missing skill (`confidence-review`, `rewrite-tournament`, `/sweep`) is skipped and named in the PR's `Not verified:` line.
- Medium: local sub-sessions get the brief's absolute path in the coordinator's worktree.
- Low (batched): the `/sweep` discover step, the fallback review's scope, `mx-invariants` and the refused-audit route, and the §1 brief and report rules were added to `CLAUDE.md`.
