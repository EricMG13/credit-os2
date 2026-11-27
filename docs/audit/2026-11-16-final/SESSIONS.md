# Sessions: one lead, six kinds of sub-session

The audit runs as one lead coordinator session and several sub-sessions. The owner starts the
lead on Fable with [`CLOUD-PROMPT.md`](CLOUD-PROMPT.md). The lead starts each sub-session with
the prompt file named below. If the lead cannot start a session itself, it tells the owner which
prompt file to paste into a new session, and on which branch.

## Who does what

| Session | Model | Stages | Prompt | Works on branch | Writes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Lead | Fable 5.2 (set by the owner) | 0, 4, 7; repair steps 7–11; all collection and merging | [`CLOUD-PROMPT.md`](CLOUD-PROMPT.md) | `audit/final-coordination`, then `audit/final-repairs` | `output/0-baseline/`, `output/4-register/`, `output/7-send-off/`, `output/SUMMARY.md` |
| `rubrics` | Opus 5.5, `xhigh` | 1 | [`sessions/rubrics.md`](sessions/rubrics.md) | `audit/out-rubrics` | `output/1-rubrics/` |
| `sections-connected` | Opus 5.5, `xhigh`; workers Sonnet, `xhigh` | 2: C1–C5 | [`sessions/sections-connected.md`](sessions/sections-connected.md) | `audit/out-sections-connected` | `output/2-sections/C*/` |
| `sections-static` | Opus 5.5, `xhigh`; workers Sonnet, `xhigh` | 2: S1–S6, X1 | [`sessions/sections-static.md`](sessions/sections-static.md) | `audit/out-sections-static` | `output/2-sections/S*/`, `output/2-sections/X1/` |
| `journeys` | Opus 5.5, `xhigh`; workers Sonnet, `xhigh` | 3: J1–J6 | [`sessions/journeys.md`](sessions/journeys.md) | `audit/out-journeys` | `output/3-journeys/` |
| `repair-<n>` (one to three) | Opus 5.5, `xhigh`; workers Sonnet | 5, steps 1–6, for its task group | [`sessions/repair.md`](sessions/repair.md) | `audit/repair-<n>` | code in its group's files; `output/5-repair/<task id>.md` |
| `sweep` | Codex controller on its launch model; implementation swarm on GPT-6 Luna | 6 | [`sessions/sweep.md`](sessions/sweep.md) | `audit/final-sweep` for the original audit; run-specific branch for a new sweep | code; Stage 6 output |

A sub-session's controller dispatches workers and writes no application code. Section and journey
workers run on Sonnet at `xhigh` (R1). For stages 1–5, a session that cannot choose its model uses
the available model and records it in its status. In Codex Stage 6, explicitly select
`gpt-6-luna` for each implementer. Record model availability in the sweep status and
continue discovery if Luna is unavailable.

## Waves

| Wave | Runs | Starts when |
| :--- | :--- | :--- |
| 1 | Lead: stage 0 | The owner starts the lead |
| 2 | `rubrics` | Stage 0's outputs are pushed to `audit/final-coordination` |
| 3 | `sections-connected`, `sections-static`, `journeys`, in parallel | Stage 1's outputs are collected onto `audit/final-coordination` |
| 4 | Lead: stage 4 | All three wave 3 sessions report `done` and are collected |
| 5 | `repair-1` … `repair-<n>`, in parallel | `tasks.md` is pushed; the lead has split the tasks into groups that share no file |
| 6 | Lead: repair steps 7–11 | Every repair pull request is merged into `audit/final-repairs` |
| 7 | `sweep` | Wave 6 is finished |
| 8 | Lead: stage 7 | The lead has merged the sweep's pull request into `audit/final-repairs` |

`journeys` runs alongside the section sessions: it does not need their outputs (see stage 3).

## Branches and hand-off

- At the start the lead cuts `audit/final-coordination` and `audit/final-repairs` from `main` and
  pushes both.
- **Waves 2 and 3 (read-only sessions).** Each session starts from the tip of
  `audit/final-coordination`, works on its own `audit/out-<session>` branch, commits only inside
  the folders it writes, and pushes. The lead collects with
  `git checkout origin/audit/out-<session> -- docs/audit/2026-11-16-final/output/<folder>` on
  `audit/final-coordination`, commits and pushes. No merge is needed and no two sessions write
  the same folder.
- **Wave 5 (repairs).** Each session starts from the tip of `audit/final-repairs`, works on
  `audit/repair-<n>`, and opens a pull request into `audit/final-repairs`. The lead reads the diff
  and the session's reports, then merges it (ruling R9). The lead first copies
  `output/4-register/` onto `audit/final-repairs` so repair sessions can read it.
- **Wave 7 (sweep).** Starts from the accepted repair commit. The Codex controller dispatches
  Luna implementers, integrates reviewed changes, and hands the lead a sweep diff against that
  repair base. See the [sweep prompt](sessions/sweep.md) for resuming and publishing.
- **Wave 8.** The lead merges the sweep's pull request, runs stage 7 on `audit/final-repairs`, and
  opens the final pull request into `main`. Nothing is merged into `main` (ruling R6).

## Status

Every sub-session keeps `output/sessions/<session>/STATUS.md` current at each milestone.
The Codex sweep shares its status path and branch with the lead. In the cloud workflow,
the other sub-sessions push status on their branches.

```
state: running | done | blocked
updated: <UTC time>
done: <what is finished>
next: <what it is doing>
blocked: <what, and what would unblock it, or none>
reports: <paths>
```

For published status, the lead reads the session's actual branch and status path.
Before collecting, the lead checks that the listed outputs exist and are well formed
(every `findings.jsonl` line parses and has the schema's fields).

A `blocked` session waits for the lead's answer. The lead answers through the session if it can
message it, otherwise by committing `output/sessions/<session>/ANSWER.md` to that session's branch
and telling the owner. If a session stops without finishing, the lead starts a new one with the
same prompt; it resumes from the branch.
