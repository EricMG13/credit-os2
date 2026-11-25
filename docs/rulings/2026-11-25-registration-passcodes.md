# Registration passcodes are stored as hashes; they are not credential files

by: user
date: 2026-11-25

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line. No provider was called and no sign-in code exists yet; it governs the work listed in
`docs/TODO.md`.

Owner, 2026-11-25, in the session that planned sign-in: "use entra openID"; "used passcodes for
profile type registration (reader, Analyst = writer and Admin)"; "admin = owner, yes write the
ruling". The question put was whether stored passcode hashes need a ruling under AGENTS.md's "No
credential files".

## What is allowed

- Microsoft Entra ID proves who a user is. The application stores no password.
- The owner sets three registration passcodes, one per profile type: Reader, Analyst and Admin.
  Analyst is Signal's writer; Admin is Signal's owner. The passcode a user enters at their first
  sign-in sets their profile type. A wrong or missing passcode creates no account.
- The account store (SQLite, on the managed machine) may hold a salted hash of each passcode. A
  hash of an owner-set registration passcode is not a credential file.

## Limits

- A passcode in plain text is never written to the repository, a file, a log, a page or a run
  folder, and is not passed to launched runs. The owner sets and changes it on the managed machine.
- "No credential files" is otherwise unchanged: provider keys come only from the launching
  environment.
- Sign-in uses the authorization-code flow with PKCE, which needs no client secret, so none is
  stored. The tenant and client ids are not secrets and come from the launching environment.
- Tokens Entra issues are held in memory only and are not written to disk.

The last two limits are the planning session's reading of "No credential files" applied to Entra,
not the owner's words. The owner may overrule them.

## Known, not decided here

- How a passcode is rotated, and whether changing one affects accounts already registered.
- How many wrong attempts are allowed before registration is refused for a time.
