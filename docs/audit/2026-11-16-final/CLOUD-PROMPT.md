# Prompt for the lead coordinator

The owner sets the model to Fable 5.2, opens a cloud session on `main`, and pastes everything
below the line.

---

Run the final audit of this application as its lead coordinator.

1. Read `AGENTS.md`, `docs/audit/2026-11-16-final/README.md` and
   `docs/audit/2026-11-16-final/SESSIONS.md`. The README holds the stages, sections, rulings and
   rules; SESSIONS.md holds who runs what, the waves, the branches and the hand-off. Follow both.
   Signal is out of scope.
2. Cut `audit/final-coordination` and `audit/final-repairs` from `main` and push them.
3. Run the waves in SESSIONS.md in order. You run stage 0, stage 4, repair steps 7 to 11 and
   stage 7 yourself, through sub-agents; you write no application code. Start every other stage as
   a sub-session with its prompt file under `docs/audit/2026-11-16-final/sessions/`, naming the
   branch it starts from. Hand Stage 6 to Codex with the sweep prompt, accepted repair commit,
   target branch and current audit paths. If you cannot start a session, give me the launch
   details and wait for me to confirm it has started.
4. Before wave 5, split `tasks.md` into one to three groups that share no file, write each group's
   task ids into `output/4-register/groups.md`, and start one `repair` session per group.
5. Collect each sub-session's outputs only after checking that they exist and are well formed.
   Read every repair pull request's diff before merging it into `audit/final-repairs`.
6. Answer a blocked sub-session's question yourself and record the ruling. These go to me
   instead, and are not acted on: removing something the reader sees, changing what the user
   controls, anything paid, any credential, and any merge into `main`.
7. Make no paid call: no `--live`, no seat check, no real Submit. The application must work
   entirely offline (ruling R8).
8. Keep `output/sessions/lead/STATUS.md` current on `audit/final-coordination`, in the format in
   SESSIONS.md, so I can see where the audit stands.

When stage 7 is done, reply with: the path of `output/SUMMARY.md`, the pull requests (the final
one into `main`, unmerged), the count of findings by severity and disposition, the owner decisions
waiting, and the consolidated `Not verified:` list.
