# Group 1 independent preliminary review

Reviewed tip: `301c7ded8e891f4fb935e197b52c0a093b1a3c34` (`origin/audit/repair-1`).
Merge base: `ca0db16ae5bdbd744dcb0f9b10a5f3096a72073b` with `origin/audit/final-repairs`.
Detached review worktree: `/workspace/review-group1`. No production/test file changed, no commit,
no push, no PR, no merge and no takeover of the recently active branch.

Preliminary verdict: no High or Medium defect found in the final production diff. The branch still
has state running and has no group-1 PR in the parent snapshot; this review does not authorize an
unconditional merge or replace final CI. Existing task reviews all reach PASS in their final round.

## Scope checked

AGENTS.md; README R1-R17; lead RESUME/STATUS; group-1 STATUS/WORKER-NOTES; task records and current
implementation reports for T01/T01b/T02-T05/T07-T12; final reviews and historical send-back findings;
all changed production files (Python service, catalogue, scheduler/intake; synthetic proof launcher;
connected library/activity/progress/start/plain/review components); changed-test deletion/assertion
hunks, and new test scope. No changed gate, skip or protected Signal/method/prompt/calculation/handoff
file was found. Existing expected-value changes match the finding-required behaviour and are named
in implementation reports: catalogue.workspace removal, mapped reader reasons, rebuild error kinds,
empty case dates, new period labels, changed Submit retry sentence and new holder-lookup request.
The removed 'Set to today...' test is superseded by L15a blank dates and its new tests, not silently
skipped. T02's Teams production change dates to 10:08:43Z, before R15; no further Teams repair is asked.

Money/order/security read: CP-MODEL is accepted only by the shared exact-name predicate, unknown argv
names stay refused; normal issuer-ID conflicts are checked both at summary and at approval digest
inside scheduler.submit's lock; draft eviction excludes sealed, pending-upload and approved drafts;
submit replay still returns its existing record before draft access; library export filtering retains
containment/CSP and escapes '<' in emitted JSON; proof gate replies remain synthetic, no model call.

## Independent verification

Own `uv sync --locked`: exit 0; uv 0.12.5, Python 3.13.15. Commands use explicit own-tree PYTHONPATH,
not a shared editable installation. Every command bounded by timeout 300.

- `uv run --no-sync pytest -q tests/test_run_start_submissions.py tests/test_run_start_scheduler.py tests/test_react_frontend.py tests/test_react_run_activity.py tests/test_react_sources.py proof`: exit 0,
  415 passed, 1 existing case-sensitive-disk skip, 46.30 s. Log `/workspace/scratch/group1-pytest.log`.
- `uv run --no-sync python tools/quality_gate.py --base ca0db16ae5bdbd744dcb0f9b10a5f3096a72073b`: exit 0,
  0 findings in 20 changed files, 2,253 lines in scope. Log `/workspace/scratch/group1-quality.log`.
- Affected Vitest (ConnectedApp, start/plain, start/ReviewSheet, runStates, runActivity.states,
  libraryStates, runReasons, runFigures, useResource): first run exit 1, 451 passed, 1 failed in9 files,
  123.96s. `runReasons.test.tsx:61` synchronously asks for a row after finding its region while
  react-aria's async table collection is still empty (DOM shows `<table>` but no rows). Log
  `/workspace/scratch/group1-vitest.log`.
- Allowed one isolated rerun, unchanged timeout/expected values: `vitest run src/pages/connected/runReasons.test.tsx --maxWorkers=1`: exit0, 3 passed, 2.58s. Log
  `/workspace/scratch/group1-runReasons-repeat.log`. All452 targeted tests have passed across those
  runs, but the9-file command itself did not pass. This is a reproducible timing risk in a new test:
  await the same exact row text with `findByText` if it fails again on the combined gate, rather than
  changing expectations or increasing timeouts.

## Residuals for the lead's Low/Info batch

Ordinary-input follow-ups, none a group merge blocker:

1. T10: make the ceiling refusal and evicted-draft message state recovery. Current 'too many unfinished
   submissions; try again later' and 'Unknown submission' are still vague. The browser retains chosen
   files and the next Continue/Review creates a new draft and uploads again, but says none of that.
2. T10: `reading` (`submissions.py:618-627`) touches outside `_LOCK` and suppresses OSError without a
   log. Serialize the draft lookup/touch against eviction; preserve a truthful unknown-draft answer
   when the folder was evicted; log a real failed touch. Eviction itself remains intentionally2h.
3. T04: `stopped_by` is sent by Python but missing from `Run` in api.ts; local `StoppedRun` intersection
   masks the public contract. Declare the optional field once and tie the contract test to it.
4. T03: joined held notices can say '...service's log. daily limit...'; capitalize the next sentence
   without changing the held notices' facts or losing later notices.
5. T07: `holdsWork` (`StartRun.tsx:2278-2284`) misses a case date, manual Issuer ID or classification
   typed alone before documents/name/purpose. Existing review calls date-only a Low nicety; code still
   does not warn on Reload/Library in those cases. Do not claim it guards every answer.
6. Documentation: T04's historical 'no Python changed' lines need explicit round1 markers; describe
   J5-001 as repaired presentation plus deferred R1-012 cause. T09's 'about37 recent characters'
   comment is stale (review measured9,065 Unicode category differences). T12 overclaims that missing
   Capital structure propagates as main exit2; inside the synthetic adapter it becomes provider failure.
7. Test evidence only: new `runReasons.test.tsx:61` races async table population (above). T10 tests do not pin2h literal, oldest-first/multiple-candidate eviction bound;
   T05's layout class test would pass with the old440px column (browser evidence closes it); T01b lacks
   exact non-OSError refusal warnings. These are coverage gaps, not demonstrated production defects.

Already decided or unusual; do not reopen or repair in cloud:

- R13: all remaining path-only/hardening observations (T01/T01b raw reasons/error usefulness).
- R15: Teams CP-8 total before its first event, posted cards and work-PC setup only.
- R14/R16: 390px-only Edit wrapping, screen-reader/focus items.
- R3 parked: extreme names overlapping activity columns; native-script combining-mark and Unicode
  version/variant identity cases; hand-edited event logs or corrupt proof handoff topology.
- R1-012/OQ15: engine checker rejection cause, deferred after audit; T04's presentation does not fix it.

## Final review findings as recorded on repair-1

The excerpts below preserve exact task-local IDs for register reconciliation. Old path severities
must be interpreted under R13, Teams under R15, narrow-only under R14. They are evidence, not new rulings.

### T01-review-4.md

None at High, Medium or Low.

Info only (no change asked): `library_index.py:85` echoes a run-recorded `relative` with `!r`; a
record holding an absolute string would show that string. It is the run's own recorded text, not a
server path the code computes, and the line is unchanged from base.

Not verified: the C5 probe (not asked this round); R1-004 end to end through `update_library` to
`/connected/snapshot` (`describe` checked by direct call and by reading every caller); a real locked
file at `credit_os_catalogue.py:417` (the suite patches `Path.read_bytes`); the static library page in a
browser; the parked R1-005, R1-006, F2, F3, R2-2 and L-2 / R2-3; a live run.

### T01-review-4-adversarial.md

| # | Severity | Where | Reason | Scope |
| :-- | :--- | :--- | :--- | :--- |
| R4A-1 | Low | `apps/issuer-library/credit_os/source.py:271-272` | `describe` gives every OSError that has no subclass of its own the same word, `OSError`. Real cases: ELOOP (a link swapped in after `is_symlink`, opened with `O_NOFOLLOW`), ENXIO (a Unix socket where a run file should be), EIO, ENAMETOOLONG, EMFILE. The errno name (`errno.errorcode[error.errno]`, e.g. `OSError (ELOOP)`) contains no path and would keep the kind useful. | Within T01 (usefulness, not a leak) |
| R4A-2 | Low | `apps/issuer-library/credit_os/source.py:271` | Keeping `UnreadableFile`'s text is safe only by convention. Every current raise (`source.py:233,237,241,243,253`, `store.py:621`) passes one literal, path-free argument, and there is no subclass. A future `UnreadableFile(errno, strerror, path)` or `UnreadableFile(f"... {path}")` would put the path in the issue (shown: `describe(UnreadableFile(13, "Permission denied", "/abs/u"))` gives `UnreadableFile: [Errno 13] Permission denied: '/abs/u'`). A guard such as `error.filename is None` would make it structural. | Within T01 (hardening; no current leak) |
| R4A-3 | Low | `docs/audit/2026-11-16-final/output/5-repair/T01.md:250-251` | The round-3 sentence that an OSError escaping `pinned_context` "is old behaviour and not a leak" is still there. The round-4 section routes it to the lead (F3, now T01b / R1-008) but does not correct the sentence. Carried from review 3 (F3 wording). | Within T01 (report wording) |
| R4A-4 | Info | `src/deploy_workflow/credit_os_catalogue.py:210-221` | `pinned_context` does not catch OSError. A context input or `workflow.json` that is chmod 000 or deleted mid-read makes `catalogue()` raise: 1 to 2 of 98 files per mode below. The same happens from `update_library.handoff_zip` for the 14 `instructions/*.md` files. The exception text holds the absolute path, and it reaches the browser only through the scheduler's rebuild note. | T01b (R1-008); not counted against T01 |
| R4A-5 | Info | `react_frontend/sources.py:232,247,256` | Reproduced. `workflow.json` was made chmod 000 after start. Then `/connected/snapshot` and `?run=` both carry `[Errno 13] Permission denied: '/tmp/r4s/.../workflow.json'` in `workspace.runs.<run>.evidence.sources[0].sourceWarning`. | T01b (R1-007); not counted against T01 |

### T01b-review.md

| # | Severity | Where | Reason |
| :-- | :--- | :--- | :--- |
| F1 | Info | `react_frontend/sources.py:240` | The chip `reason` for the same source changes with the warning because both read one `Checked.cache` entry. Justified (above); the task text says "sourceWarning only", so the lead should note that the chip reason is repaired by the same line. No action. |
| F2 | Low | `tests/test_react_sources.py:287-318` | The new test proves the `OSError` path and the absence of any root path, but no test pins the `Refused` / `SourceMismatch` warning text (`test_failed_original_keeps_pinned_identity_and_specific_problem` checks chip-reason substrings `sha256` / `missing`; `test_legacy_chips_survive_missing_workflow_authority` checks only that `sourceWarning` exists). A later change that put the kind on every error would keep those green. I checked the exact texts in scratch and they hold. A one-line exact assertion for the missing and tampered cases would pin it. |
| F3 | Info | `react_frontend/sources.py:240, :255` | The task note's `<run>/inputs/<sha>` is relative to the runs folder (it starts with the run id), the same form as `read_inside`'s own refusals (`<run>/inputs/<sha> is missing`). The lead's words were "run-relative name"; relative to the run folder would be `inputs/<sha>`. The implementer flagged the choice. The run-id form keeps the unreadable and missing sentences in one shape and the Evidence page may show ids, so I would keep it. The lead decides. |
| F4 | Info | `react_frontend/run_activity.py:278-279` | Stale comment: "with the library's error in parentheses" now holds the error's kind. The file is outside T01b and the regex is correct; fix only if a later task touches the file. The static issuer library (`apps/issuer-library/credit_os/web/views.js:1851`) draws the note as written, so its reader now sees `(PermissionError)`; that is what L10 asked for. |
| F5 | Medium (outside T01b; for the lead to route) | `src/deploy_workflow/inbox/scheduler.py:545, :639, :660, :675` | The same class remains one function away. Run reasons `could not be filed: {error}`, `could not be started: {error}` and `stopped by the scheduler: its record could not be saved ({error})` are stored with the OS text and `/activity.js` serves `asdict(record)` raw. Reproduced in scratch: `runs.start` raising `FileNotFoundError(2, "No such file or directory", "/abs/launcher/run.py")` leaves `could not be started: [Errno 2] No such file or directory: '/abs/launcher/run.py'` in `activity.js`. T03 maps these only for `/connected/activity`; the raw route was not covered. L10 limited T01b to the rebuild note, so this is not a T01b defect. R3 says a leaked path is always repaired: a task should take it (and `test_a_start_that_raises_oserror_fails_the_run...` at `tests/test_inbox_scheduler.py:852` asserts the stored reason text, which such a task would change). |
| F6 | Info | `react_frontend/sources.py:264` | A `workflow.json` that is not UTF-8 gives the warning `'utf-16-le' codec can't decode byte 0x7b ...` (`UnicodeDecodeError` is a `ValueError`). Path-free, so not a leak; unreadable to the reader, unchanged by this task and a hostile-input case (R3: register and park). |
| F7 | Info | `docs/audit/2026-11-16-final/` stage 5 step 9 | The Evidence warning and the held note are text a reader sees. The branch-level fidelity check (`VERIFICATION.md`, scope: the Evidence warning and the run-activity held note) should list them. Not per task. |

### T01b-review-adversarial.md

| # | Severity | Where | Reason | Scope |
| :-- | :--- | :--- | :--- | :--- |
| A1 | Low | `react_frontend/sources.py:229-230` | `_problem` returns `str(error)` for a non-OSError refusal, and two of those name no file: a `workflow.json` that is not valid JSON gives `Expecting property name enclosed in double quotes: line 1 column 2 (char 1)` and a source whose bytes differ gives `source bytes do not match recorded sha256` (both seen in the truncation probes). No path, but the reader is not told which file. Pre-existing; L10 names the OSError cases and those are done. Optional: append the run-relative name. | Within T01b (usefulness only, not a leak) |
| A2 | Low | `src/deploy_workflow/inbox/scheduler.py:419`, `react_frontend/sources.py:229` | Kind only is by ruling, and it is coarse: 84 of the 146 held notes the battery produced read `(Refused)` (each a different cause), and a plain `OSError` (EIO, ELOOP, ENXIO) says nothing. `errno.errorcode[error.errno]` would add a path-free word. Detail stays in `watcher.log`; `/connected/activity` maps the note to a plain sentence anyway. Same point as T01 review 4 R4A-1. | Within T01b (optional hardening) |
| N1 | High | `src/deploy_workflow/inbox/scheduler.py:639-641` and `:659-662` | `reason = f"could not be started: {error}"` stores an OSError's text, with the absolute path, in the run record, and `/activity.js` serves it as written (and `/api/runs/<id>`: `_RUN_FIELDS` holds `reason`, `run_start/service.py:153-156,353`). Reproduced with real errors: a missing launcher gives `could not be started: [Errno 2] No such file or directory: '/tmp/ibyid8m7i7/nowhere/launcher'`; a launcher without the execute bit gives `[Errno 13] Permission denied: '/tmp/ibbegxaxm6/launcher.py'`; a run log that is a directory gives `[Errno 21] Is a directory: '/tmp/ibx2pfz_4w/_engine/logs/20261117-102743-01.log'`. Same class and same raw route as R1-008, not covered by L10. `/connected/activity` is safe (T03's `_NOT_STARTED` sentence). R3: a leaked path is always repaired. | New observation (not T01b; for the lead to schedule) |
| N2 | Low | `src/deploy_workflow/inbox/scheduler.py:545`, `src/deploy_workflow/inbox/filing.py:46` | `could not be filed: {error}` where `filing._load` raises `ValueError(f"{path} is not a map ...")`. Reproduced: `could not be filed: /tmp/ibq57m1tn4/_engine/state/issuers.json is not a map of issuer ID to folder name` in `activity.js`. Needs an earlier-format delivery with `report.html` and an issuer registry that is valid JSON but not a map (a hand edit); R3 parks hostile or unusual input. `/connected/activity` maps it to `_NOT_FILED`. | New observation (not T01b) |
| N3 | Info | `src/deploy_workflow/credit_os_chips.py:548` | Not reachable from the snapshot on these inputs (answer below). | New observation (no action) |
| N4 | Info | whole base | This worktree lacks T01. With `live/` made unreadable (chmod 000 on the directory) its `workspace.issues[0]` still holds `live/calls.jsonl could not be read (PermissionError: [Errno 13] Permission denied: '<root>/_engine/runs/<run>/l...` on `/connected/snapshot`, `?run=` and `/library/data.js` (2 probes). That is T01's R1-004 (`describe()`, `apps/issuer-library/credit_os/source.py:264-268`), fixed on `audit/repair-1` (`describe` there names an OSError by its kind). Against a tree of `audit/repair-1` plus the T01b production diff the same probes are clean (582 probes, 0 hits). Re-run after merge. | Not a T01b finding |

### T02-review-4.md

1. **Low, `src/deploy_workflow/inbox/teams.py:460-468` (report `T02.md`, round 4).** For a list run with an
   earlier run listed, the total is 13 until CP-8's `module_started`, while the run page (from
   `workflow.json`) shows 14 from the start; it agrees only once CP-8 starts. This is what the preset path
   does too and the asked cases (running, done, dropped) match, but the report says the CP-8 finding is
   "repaired" without stating this window; one sentence should record it.
2. **Low, `docs/audit/2026-11-16-final/output/5-repair/T02.md` (round 4, Not verified).** It says a
   hand-built list holding CP-8 counts and that what runs is "not examined"; the launcher refuses a listed
   CP-8 outright (`cpos_launch.py:1044-1048`) after Submit accepts it (CP-8 is in `METHODS`), so such a run
   never starts while its card total counts CP-8. Pre-existing (Submit's check was `METHODS` before T02) and
   display only; the report should say so instead of "not examined".

Not verified: a real launcher run with an earlier run listed (CP-8 states are `teams.progress` on
constructed event logs, the run-page figures read from round-3's measurement and `cpos_launch.prepare`, not
from a run); a posted Teams card; `tests/test_run_start_page.py`; the live service path and providers; the
`web/` gates (no `web/` change); whether the lead separately authorised round 4's change to the L6a formula
(the report records no new ruling; the task brief for this review asks for the CP-8 fix).

### T02-review-4-adversarial.md

1. Low, `src/deploy_workflow/inbox/teams.py:460-468` (within T02 for explicit lists; the same gap predates T02 on
   the preset path, where `len(states)` also lacks CP-8 until it starts). With an earlier run listed, CP-8 is in
   `workflow.json` from launch, but the card counts it only from its first event. So the started card
   (`teams.py:739-740`, posted before CP-8 can start) says "13 modules" where the run page shows 14 rows, a run
   stopped before CP-8 reads e.g. 5 of 13 against the page's 14, and the day summary's total for a running run
   moves from 13 to 14 mid-run. The round-4 report says "the record cannot tell which happened"; the record
   cannot, but the run folder's `workflow.json` can, and the run page already reads it. Display only; reading the
   manifest would exceed the L6/L6a scope, so it is for the lead to rule on or list.
2. Low, `src/deploy_workflow/inbox/teams.py:468` (within T02, hand-edit only). A module the plan does not hold but
   the preset lists (a left-out module) counts toward the total once a hand-edited log shows it started; the run
   page, reading the manifest, does not show it. The launcher never writes such an event, so no change is needed.

No High or Medium finding.

### T03-review-2.md

| # | Severity | Where | Reason |
| :--- | :--- | :--- | :--- |
| N1 | Low | `react_frontend/run_activity.py:280-293` (`_REBUILD_NOTE`, `_in_readers_words`) | A held note that joins the rebuild note and the daily-limit note reads "...check the service's log. daily limit of 30 runs reached; waiting until tomorrow": a lower-case fragment after a full stop. Cosmetic; optional one-line fix. |
| N2 | Low | `tests/test_react_run_activity.py:142` | R6 residual: the no-context stored text is still typed by hand although `scheduler._NO_CONTEXT` is an importable constant (the other writers are inline f-strings with no constant). |
| N3 | Info | `docs/audit/2026-11-16-final/output/5-repair/T03.md` (R4 paragraph), `run_activity.py:252` | The report says a `stopped: ruling` at run time means the ruling file changed after start-up. In the current launcher that case ends as `launcher exited 2` (or a traceback), not as a `stopped` event, so `ruling` is a dormant mapping. The reader sentence is true; the report's account of when it occurs is not. |
| N4 | Info | `tests/test_react_frontend.py:366-372` | After rounds 1 and 2 no test sends an unmapped ended-run reason with the service root through `listing` or `reply`; the one that did now asserts a mapped sentence. Root removal is still covered for the running run's reason, for `held`, and by the `_plain_reason` table. |
| N5 | Info | `run_activity.py:205` (`_TRY_AGAIN`) | "choose Start from this run on the run's page" is also drawn on the run's own page (the RunProgress alert), where it reads slightly oddly. True and actionable; not worth a change. |
| N6 | Info | `RunProgress.tsx:123-127` | The page's `error` line draws service error text. Checked: an unreadable run record is a `ValueError` that `http_base` turns into a fixed 500 text (`http_base.py:228-234`); no code, exit code or path reaches it. Out of T03 (T04 covers error states). |

### N1 detail (joined held note)

The scheduler joins its held notes with `"; "` in this order: rebuild, daily limit, unreadable
(`scheduler.py:471`). `_REBUILD_NOTE.sub` consumes the first `"; "` and puts one space after the
mapped sentence. Through `_shown`:

```
rebuild + limit:      "...ask whoever runs the service to check the service's log. daily limit of 30 runs reached; waiting until tomorrow"
rebuild + unreadable: "...check the service's log. 1 run record could not be read. Its run is not started, ..."   (reads correctly: a digit)
rebuild + limit + unreadable: "...service's log. daily limit of 30 runs reached; waiting until tomorrow; 1 run record could not be read. ..."
rebuild alone:        "...check the service's log."   (reads correctly)
```

A reader takes the lower-case tail as a second notice with no end stop; it is understandable, and
the daily-limit note already starts in lower case when it stands alone in the same alert, so this
is the existing style meeting a new capital. Rated Low, not Medium: it needs a persistent rebuild
failure and a day at the 30-run limit (`Settings.max_per_day`), nothing is wrong or misleading, and
the unreadable-record note, the more likely partner, reads correctly. The fix, if wanted:
`(?P<more>; (?P<head>.))?` and `+ (" " + note["head"].upper() if note["more"] else "")`. The
implementer's alternative (a trailing `;`) is rightly rejected: it would leave the usual
single-note case with no full stop.

### T04-review-2.md

| # | Severity | File:line | Reason |
| :--- | :--- | :--- | :--- |
| 1 | Low | `docs/audit/2026-11-16-final/output/5-repair/T04.md:24` and `:57` | Two round-1 sentences are now false: "No Python changed, so `react_frontend/run_activity.py` is untouched" and "`layout.tsx` and `react_frontend/run_activity.py`: not changed". Round 2 changed `run_activity.py` and `tests/test_react_run_activity.py` (its own "Files changed in round 2" list says so). Other superseded round-1 lines carry a "(Round 1; superseded ...)" mark; these two do not. Mark them or edit them to say "round 1 only". |
| 2 | Low | `docs/audit/2026-11-16-final/output/5-repair/T04.md:257` and `:276` | The heading says "J5-001 closes as partly repaired"; the last sentence of that section says "J5-001 is therefore not closed by this task". Both can be read two ways. Say once: J5-001's label, row sentence, alert title and Start-again action are repaired; its cause half (why the checker refused, what to change) is R1-012 and stays open there. |
| 3 | Low | `web/src/pages/connected/runFigures.test.ts:22` and `:27` | Two `moduleWord` test names still describe the old third parameter: "reads the module a failed run stopped at as Not assessable" and "keeps Interrupted for a stop the run itself did not fail on". In round 2 the parameter is `refused` (the checks stopped the run there), and no `failed` run is passed in. The assertions are right (`moduleWord("stopped", false, true)` is `Not assessable`); only the names mislead the next reader. This file was not changed in round 2. |
| 4 | Low | `web/src/pages/connected/runFigures.ts:140-142` (declared locally), `react_frontend/run_activity.py:420` (sent) | `stopped_by` is sent by the service and read by the page, but `Run` in `api.ts` does not declare it; `runFigures.ts` declares `type StoppedRun = Run & { stopped_by?: string }` instead, and no test ties the Python field to the TypeScript type (the existing contract test holds only `RunStatus`, `EndedRun` and `ModuleState`). Disclosed in the report and correct under the file rule. It needs one line in `api.ts` by whoever owns it (`api.ts` is named by T02, merged, and T08, not by T04; the lead can place it), after which `StoppedRun` can go. If a later change renames the field in Python, the page quietly falls back to `Interrupted` and the Python test still passes. |

Not findings, recorded so they are not re-raised: the "rejected N times" count spans every launch of the
run folder (disclosed in the report's Not verified); review findings 5, 6 and 8 of round 1 stay open as the
lead has ruled, and 7 goes to T05.

### T05-review.md

1. **Low** `web/src/pages/connected/RunActivity.tsx:317`: `xl:grid-cols-2` narrows the Running column (from about 684
   to 562 px at 1280, 842 to 642 at 1440), and the Running card's nowrap issuer link then leaves its column from
   about 70 characters at 1280 (75 characters: 46 px past and under the Waiting panel; 80: 84 px, and in the
   screenshot "1 of 3 modules" and a module badge are cut off by the Waiting panel). At BASE that case did not
   overflow. The report does not
   name it. A name that long is an unusual input, so under R3 it is parked rather than repaired; the net effect on
   ordinary names is a clear improvement (the Waiting table fits up to about 60 characters at 1280 where it
   scrolled from 45).
2. **Low** `docs/audit/2026-11-16-final/output/5-repair/T05.md:201`: the report says a name "wider than about 400 px"
   still scrolls at 1280. Measured, the Waiting table scrolls from a 64-character issuer name at 1280 (about 520 px)
   and from 75 at 1440. State that threshold when the closure is recorded.
3. **Low** `web/src/pages/connected/runActivity.states.test.tsx:132-145`: the "not cut off" test walks only the
   ancestors between the table and its `section`, so it guards the panel class (`overflow-hidden`), which the report
   itself shows is not what cut the column. The grid width (`xl:grid-cols-2`, the actual repair) is outside that
   walk, and putting `xl:grid-cols-[minmax(0,1fr)_440px]` back would pass every test. jsdom has no layout, so a
   class assertion on the Running/Waiting wrapper is the most a test can do here; the browser measurement above
   stands in for it.
4. **Info** `c1-003-run-activity-table-clipping.cjs`: it exits 0 vacuously (`null` at every width). Close C1-003 on
   the measured table in (2), not on that exit code. The probe is the audit's answer key and was not edited.

Not verified:
- Widths between 1024 and 1279 px (there the two groups stack at full width) and any width under 1024 px: R14 puts
  narrower than desktop out of scope; the 768 and 390 px behaviour was not looked at.
- Real scrollbars: the headless browser hides them, so whether the 745 px Waiting table's inner scrollbar is easy to
  see on the work PC's browser was not seen.
- A request that hangs with no answer: `getActivity` has no timeout, so a hung poll shows the old list with no
  warning and schedules no further poll; this is as before the change and was not exercised.
- The wording of the new alerts and of "A report appears here once a run has finished." was judged for truth, not
  read by an analyst; no screen reader or keyboard was used (R14, R16).
- `npm --prefix web run gates` in full, Signal's tests and `proof:connected` were not run (the change touches no
  Signal file and no shared module).
- A malformed library answer such as `{}` (no `catalogue`) still throws in `ReportLibrary`, as before; not
  exercised against a live service.

### T07-review-2.md

| # | Severity | Where | Reason |
| :-- | :-- | :-- | :-- |
| 1 | Low | `web/src/pages/connected/ConnectedApp.test.tsx:4121-4130`, `:4200`, `:4211` | The prior-run fixtures now carry `as_of: ""` (what the service sends), so the two new from-run tests would also pass if `startingContext` carried the earlier run's date; the page's own blanking on those paths is shown only by the new-form test (same line, `StartRun.tsx:2546`), the service's by `test_run_start_prior.py`, and the real-app walk. Not a defect. |
| 2 | Low | `web/src/pages/connected/StartRun.tsx:2102-2110` (`holdsWork`) | A case date typed on its own does not count as work, so Reload with only a date typed raises no confirmation. A date alone is little to lose; noted, not a defect. |

### T08-review.md

- **Low** `web/src/pages/connected/StartRun.tsx:1349-1358`: when the service answered, the alert's title and body open
  with the same sentence ("The run options could not be loaded" / "The run options could not be loaded. Try again, ..."),
  and the body says "Try again" beside a "Try again" button; the body could carry only the "ask whoever runs the
  service" sentence. Wording only, not a defect against C2-004.
- **Low** `docs/audit/2026-11-16-final/output/5-repair/T08/walk-t08.cjs:57`: at base the walk stops at the first missing
  Try again button, so its Submit (C2-006, J2-013) and Earnings Update (J1-004) sections are never seen failing on base;
  their "before" rests on the original probes' base output in the report (`T08/probe-output.txt`), which is consistent.

Not verified: no screenshot compared by eye; no real two-Submit run against the service with a dropped reply (the
one-run claim is from reading `scheduler.submit` and re-running `tests/test_run_start_scheduler.py -k submit_twice`, 1 passed); `p12-states.cjs`
not re-run (judged from its source); the live (non-synthetic) Submit dialog only through the unit tests.

### T09-review-3.md

1. Low (unusual input, R3), `src/deploy_workflow/run_start/submissions.py:632` (`issuer_key`) and
   `web/src/pages/connected/start/plain.ts:494` (`issuerKey`). The key still drops combining marks after NFKD.
   In scripts where a mark is part of the letter, that merges different names. Checked on both sides, with the
   same result: "टाटा" and "टीटी" both give `टट` (Devanagari vowel signs), "ガス" and "カス" both give `カス`
   (dakuten), and "Йога" and "Иога" both give `иога`. With a Latin legal-form word ("ガス Ltd" / "カス Ltd")
   both names have the usual ID `ltd`, so the page keeps it and the service accepts, and the two issuers are
   merged on the default route. This is the round-2 adversarial finding 1 with a smaller reach: CJK, plain
   Cyrillic and Greek names are now told apart (pinned by the new cases). Suggested repair: drop marks only
   where they follow a Latin base letter, or compare on NFKC plus case folding without dropping marks. Either
   way, keep the same rule on both sides.

Observation, not a finding: Greek final sigma means "ΟΣ-ΑΕ" and "ΟΣΑΕ" give different keys (`οςαε` / `οσαε`) on
both sides. This errs on the safe side: the same issuer is refused, not merged.

### T09-review-3-adversarial.md

1. **Low, within T09.** `src/deploy_workflow/run_start/submissions.py:621` (`issuer_key` docstring) and
   `web/src/pages/connected/start/plain.ts:486` (`issuerKey` comment).
   - Both say that "about 37 recent characters" differ between Python and Node. With the Unicode-aware key, 9,065
     differ. 37 was round 2's count for the ASCII-only key.
   - The consequence is that the service, which drops these characters, treats two names that differ only in a
     Unicode 16/17 character as the same issuer. That is a merge, though not on ordinary names.
   - Correct the count. The design can stay.
2. **Low, within T09 (an L18 design limit, wider in round 3).** `submissions.py:621-631`.
   - The same issuer written with a variant in its native script gets a different key. Live examples: a tatweel, a
     native-script gloss after the Latin name, and ㈱ for 株式会社 (also Persian ی against Arabic ي).
   - It is then refused under its own ID (tatweel, live), or given a suffixed ID on the default route (Toyota gloss,
     live), which splits the issuer.
   - The refusal and the review note name the holder and say to type that name, so the analyst can recover. Round 2
     accepted these because their Latin letters were equal.
   - This is the price of finding 1 of round 2. It is the same class as Ltd/Limited, which is already accepted.
3. **Low, new observation (pre-existing; outside T09's files).** `web/src/pages/connected/api.ts:259` (`issuerSlug`).
   - Case alone splits a Turkish issuer. "Bankası" drops the ı, while "BANKASI" lower-cases to "bankasi". The two
     names get two usual IDs (`turkiye-is-bankas-a-s` and `turkiye-is-bankasi-a-s`) with no note, and carry over finds
     only one of them.
   - The report records the decision not to transliterate (C2-014: "it would change existing issuers' IDs").
   - This case shows the cost is more than a missing Ø: typing in capitals splits the issuer silently. Recorded for the
     lead.

### T10-review.md

1. Low, `web/src/pages/connected/StartRun.tsx:1609-1613` (unchanged): after an idle draft is
   released at the ceiling, the next step shows only "Unknown submission."; it does not say the
   uploads were released after 2 hours idle or that Continue uploads them again (D-31). The
   unchanged refusal "too many unfinished submissions; try again later" (`submissions.py:205`)
   likewise does not state the recovery the finding's expected result asks for.
2. Low, `src/deploy_workflow/run_start/submissions.py:621`: `contextlib.suppress(OSError)` on the
   touch drops a failure without a log line, unlike `add_file` and `remove_file`; a failed touch
   silently leaves a live draft eligible for eviction.
3. Low, `tests/test_run_start_submissions.py:1866-1917`: no test pins oldest-first order or the
   "only as many as needed" bound with two or more idle drafts, and the 2-hour value is read from
   the production constant rather than stated. Behaviour verified by my scratch probe.

### T10-review-adversarial.md

1. Low, `src/deploy_workflow/run_start/submissions.py:622-625`, within T10. `reading()` touches the
   draft outside `_LOCK`. A `new()` that had already chosen this draft can still `rmtree` it
   mid-read. Simulated: `reading` then returns `error: "--sources the uploaded documents: not a
   folder"`. That is not a 500, but it is not the truthful "unknown submission" either. The window
   is the `rmtree` time, and the next request gets the 404.
2. Low, `src/deploy_workflow/run_start/submissions.py:205` (and the page's 404 text), within T10's
   finding. The reader message after eviction is a bare lower-case "unknown submission". It does
   not say the draft was released after 2 hours idle, or that pressing the button again re-sends the
   documents. The refusal at a full ceiling still says only "try again later". C2-008's expected
   result asks that "a refusal states how to recover".
3. Low, `src/deploy_workflow/run_start/submissions.py:185`, within T10. Idleness compares wall-clock
   `time.time()` with folder mtime. A forward clock step of 2 h or more makes every live draft look
   idle at the ceiling. The 24-hour sweep has the same dependency, so the eviction does not add a
   new kind of risk. `summary()` does not touch the draft, but the page calls `reading` (which
   touches) before each summary, so this does not matter in practice.

Residual already stated in T10.md, and confirmed: a form idle for more than 2 h before its review,
when the ceiling is reached, loses its server draft. The page recovers by re-uploading from the
browser.

### T11-review-2.md

### F1 (Low) `ReviewSheet.tsx:86-96` (Edit `Button` is still `whitespace-nowrap`): at 150 and 200 percent text the sheet still widens at 390 px

Not caused by this change, not part of C2-001 (a long name at 390 px), R1 or R2, and the implementer disclosed it. Measured (Deep, no agreement, default names, root font enlarged in the built page, base `e574f0d7` built from `git archive` against head `c24ca2d`):

| Root font (text size) | Review column scrollWidth / clientWidth, base | head |
| :--- | :--- | :--- |
| 20 px (125 percent) | 510 / 298 (7 buttons cut off) | 298 / 298 |
| 24 px (150 percent) | 612 / 280 (7 buttons cut off) | 332 / 280, no button past the viewport, 2-line titles, no word split |
| 32 px (200 percent) | 815 / 244 (7 cut off) | 442 / 244 (4 buttons cut off) |

So the head is better than base at every size, and clean at 125 percent, but D-42 ("nothing is cut off at 200 percent text") is not met by the nowrap Edit buttons. The same one-line class set as the Leave out button would likely close it. Suggested: leave it for the Low and Info batch or the owner list; no change needed to pass T11.

### F2 (Low) `ReviewSheet.test.tsx:145-171`: the two new tests pin class names, not layout

Carries over R3 of round 1. The tests are not vacuous: I ran the round-2 test file against round 1's `ReviewSheet.tsx` (`git show bc1b19b:...` in a scratch copy of `c24ca2d`): 2 failed, 3 passed (`toHaveClass("flex","flex-wrap")` received `flex items-center justify-between gap-3`; `toHaveClass("max-w-full","text-left","whitespace-normal")` received the base nowrap class list). On `c24ca2d` all 5 pass. The layout evidence is the browser measurement below, not committed. No change needed.

### T12-review-2.md

| # | Severity | Where | Finding |
| :--- | :--- | :--- | :--- |
| F1 | Low | `docs/audit/2026-11-16-final/output/5-repair/T12.md:174`; `proof/launcher.py:72-80`, `:128`, `:176` | The report says a missing section "raises `ValueError`, which `main` reports as exit 2". Driven through the scheduler it is not: `capital_structure()` runs inside the patched `LiveAdapter.complete`, so the engine reports a provider failure (`stopped: provider`, log `sent_unknown`) and the real cause is only in the retained `live/calls.jsonl`. Needs a corrupted `proof/handoffs/CP-4.md` (barred to edit; the L2 and scheduler `[none]` tests fail on it). Either correct the report's sentence, or read the section in `run_engine` beside `gated` (before the engine starts) so `main` prints it and exits 2. |
| F2 | Low | `proof/launcher.py:77` | The lookahead `(?=^#{2,3} )` has no end-of-file alternative, so a `### Capital structure` that is the last section of CP-4.md is reported "has no Capital structure section" although the docstring says the section runs "up to the next heading". CP-4.md has a following heading today, so no reply is affected; `(?=^#{2,3} |\Z)` removes it. |

Not findings: CP-3's insertion mirrors the production `replace` anchor (`\n## Calculations`) in the test, but is compared to a literal
section, so a wrong anchor or a double newline fails (M4, M5, M7); `README.md:168` ("five steps") is the same stale count in a file outside T12.
L4 of the first review (`inbox/runs.py` reason text) stays with the lead as the report says.

Not verified: a live model's CP-4 at the gate (R4, no paid call); `proof:connected` on branded Chrome and Edge (none here), so the doc's description of the proof was read against the script text, not run; Windows and the packaged proof (not built); the L2 test's `draft` case end to end through the scheduler (only `canned_handoff` is driven); a `--modules` subset with CP-4 but not CP-3 under no legal documents; the first review's J1 journey exit-1 explanation was not re-run.

Not verified: clean all9-file Vitest run under concurrent load; final combined-tree CI/full frontend gates/fidelity; browser probes in this fresh review; branded-browser connected proof; Windows/work PC; real provider/paid Submit/Teams; future pushes after reviewed tip.
