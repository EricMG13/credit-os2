# Resume the sign-in build on the work PC (2026-11-26)

Paste the block below into a new Claude Code session on the work PC, in a fresh clone of
`EricMG13/credit-os2`. The coordinator's local notes (`.superpowers/sdd/sign-in/`, gitignored) did
not move with the project. Everything needed is in this prompt, the PR bodies, `VERIFICATION.md` and
`docs/TODO.md`.

```text
You are the coordinator for the sign-in build in EricMG13/credit-os2. Plan:
docs/superpowers/plans/2026-11-26-sign-in-and-accounts.md. Spec:
docs/superpowers/specs/2026-11-26-sign-in-and-accounts.md. Follow CLAUDE.md and AGENTS.md: you
plan, write briefs in .superpowers/sdd/sign-in/ (gitignored), dispatch mx-* agents and write no
code. No PR is merged unless I say so.

Where it stands:
- Slice 1 (account store, passcodes, lockout, accounts command line) is PR #108, branch
  claude/sign-in-accounts-slice-1-2e1016, head e028c1b3. Its reviews passed. It conflicts with main
  in VERIFICATION.md only.
- Slice 2 (sessions, the one sign-in check, the sign_in/accounts_dir switch on make_server,
  GET /auth/me, folder rules in store.open_db, display names) is draft PR #119, branch
  claude/sign-in-slice-2, head 593d850e. It is stacked on #108. Its security review and its
  pre-merge review passed. It conflicts with main in VERIFICATION.md. CI has not been confirmed
  green on its head.
- The flaky Coverage test fix, PR #113, is merged.

Do first, in this order:
1. On #108: fetch origin main and merge FETCH_HEAD; never rebase or force. Resolve VERIFICATION.md
   by keeping both sides (the slice entry first), then remove the oldest whole entries until the
   file is under 1,000 lines (tests/test_repo_rules.py checks this). Run
   `uv run pytest -q tests/test_repo_rules.py tests/test_accounts_*.py`, then commit and push.
2. On #119: merge the new #108 head, then origin/main, the same way. react_frontend/__init__.py
   has conflicted before: keep both sides, and keep every sign-in refusal before the Scheduler is
   built. Run `uv run pytest -q tests/test_auth_*.py tests/test_accounts_*.py
   tests/test_react_frontend.py tests/test_react_frontend_signal.py tests/test_repo_rules.py`,
   `uv run python tools/quality_gate.py` and `uv run lint-imports`, then push.
3. This is Windows, the target machine. Run the slice tests here and report anything that fails.
   The %LOCALAPPDATA% folder rule (store._inside_local_appdata, _check_windows_folder) was only
   simulated on macOS. This closes docs/TODO.md item 15's "run the Windows rule on the work PC".
   Also confirm that tests/test_react_runtime_identity.py passes here; it failed on macOS only
   because of a 125-character temp path.
4. Tell me the PRs' states, and that I can type /ship. Do not merge.

Then slice 3 (the sign-in page and Entra), only when I say so. Before it ships:
- docs/TODO.md item 22: http_base logs every request line with its query string at INFO, so
  /auth/callback?code=... would log the Entra code. Fix this first, test first.
- Item 25: no other cookie name may contain "credit_os_session". The session cookie's attributes
  must settle cookie tossing from another localhost port.
- Add /auth/start and /auth/callback to react_frontend/auth_gate.py's open set by exact name,
  never by prefix.
- Notes from #108 and #119 ("Notes for slice 3"): check `disabled` on accounts; never lower an
  Admin; compare try_passcode answers with `in ("analyst", "admin")`; pass the raw oid claim.

Rulings from slice 2 to keep (the full list is in #119's body):
- The open set is exact on method and path.
- Any second occurrence of "credit_os_session" in the Cookie headers means no session.
- A store error is a 500, never "no session".
- A session lookup writes nothing (last_used_at holds the sign-in time; item 24).
- The store folder must be absolute, private, outside --root by path and by file identity, and
  --root must exist when sign-in is on.
- Display names: the first free of name, "name (local part)", "name (whole email)", each at most 60
  characters; "before accounts" is reserved.

Owner items, not to act on without me: TODO 23 (the run-start server has no sign-in on --host);
the store does not check its folder's ancestors.

Fable usage was exhausted until 2 Dec 07:00 Europe/London. Before then, dispatch mx-architect and
mx-advisor with model opus, effort xhigh, and say so in each report.
```
