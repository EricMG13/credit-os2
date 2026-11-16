# Stage 7: Send-off

Runs on the tip of `audit/final-sweep`. Proves the final tree, finishes the work-PC
initialisation prompt and writes the audit summary. Changes documentation only.

## Inputs

| Layer | File | Section | Why |
| :--- | :--- | :--- | :--- |
| L1 | `docs/audit/2026-11-16-final/README.md` | all | Scope and rulings |
| L3 | `docs/audit/2026-11-16-final/work-pc-init-prompt.draft.md` | all | The draft to finish |
| L3 | `docs/work-pc/README.md`, `WORK-PC-PROMPT.md` | all | The existing sync procedure the new prompt must agree with |
| L3 | `docs/COPILOT.md` | Not verified | Carried into the prompt |
| L3 | `pyproject.toml`, `uv.lock`, `.python-version`, `web/package.json`, `web/package-lock.json` | all | The requirements table |
| L3 | `docs/react-workflow.md`, `Run-React-Proof.cmd`, `tools/package_react_windows.py` | all | The Windows proof and the release package |
| L4 | `output/0-baseline/` … `output/6-sweep/` | each `report.md` | The summary and every `Not verified:` line |

## Process

1. **Final gates on the final tree.** `uv sync --locked`; the fast Python tests; `uv run python
   tools/quality_gate.py`; `npm --prefix web ci`; `npm --prefix web run gates`;
   `npm --prefix web run proof:connected`. Record each exit code. The weekly full suite and the
   Windows job run in GitHub Actions; record their latest result for this branch or say they
   have not run.
2. **Secrets and paths.** Run gitleaks if it is installed; otherwise search tracked files and
   `web/dist` for key and token patterns, and for absolute paths of the build machine
   (`/Users/`, `/home/`, `C:\Users\`). Any hit is High and goes back to stage 5.
3. **Offline.** Repeat stage 0's offline check on the final build and on the contents of the
   release ZIP: no request to another host is attempted on any screen, and `proof:connected`
   passes with other hosts blocked. Any hit is High and goes back to stage 5.
4. **Screens.** Re-take the stage 0 screenshots and list every screen that changed, with the
   finding or sweep item that explains it. An unexplained change goes back to stage 5.
5. **Release candidate.** `uv run --locked python tools/package_react_windows.py --revision HEAD`.
   Record the ZIP's checksum and confirm the surface map still describes what is inside.
6. **Finish the initialisation prompt.** Copy the draft to
   `docs/work-pc/WORK-PC-INIT-PROMPT.md` and fill in:
   - `{{HEAD}}`: the final commit;
   - `{{REQUIREMENTS TABLE}}`: Python, uv and Node versions, every direct Python and npm
     dependency with its pinned version and what uses it, and Playwright with the two browsers;
   - `{{KNOWN-UNVERIFIED LIST}}`: the `Not verified` section of `docs/COPILOT.md`, every
     `Not verified:` line from this audit that concerns Windows, a real seat, a real browser
     build or the release package, and every open finding.
   Add a line to the table in `docs/work-pc/README.md` for the new file.
7. **Dry run the prompt.** A fresh agent with no other context follows the finished prompt on a
   clean copy of the repository in which one pinned Python package and one pinned npm package
   have been made unavailable (point the install at an index that lacks them; do not edit the
   prompt). It must produce the gap table and stop for approval. If it improvises, tighten the
   prompt and repeat once. The work PC itself is not reachable from here; say so.
8. **Summary.** Write `output/SUMMARY.md`: findings by severity and disposition, what was
   repaired, what the sweep removed with before and after numbers, what waits for the owner
   (`owner-decisions.md`), what is parked, the two pull requests, and one consolidated
   `Not verified:` list.
9. **Verification record.** Draft the `VERIFICATION.md` entry for the audit with its scope; keep
   the file under 1,000 lines.
10. Commit the documentation to `audit/final-sweep`. Do not merge either pull request.

## Outputs

| File | Contents |
| :--- | :--- |
| `docs/work-pc/WORK-PC-INIT-PROMPT.md` | The finished prompt |
| `output/7-send-off/gates.md` | Each final gate's command and exit code, the secrets search, the offline check, the ZIP checksum |
| `output/7-send-off/screens-diff.md` | Changed screens and their explanations |
| `output/7-send-off/prompt-dry-run.md` | What the dry-run agent did |
| `output/SUMMARY.md` | The audit summary |
