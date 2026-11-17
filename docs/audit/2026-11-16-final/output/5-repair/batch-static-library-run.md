# Stage 5: static library, shell and run batch

Base: `152fdeef` (group 3 and reviewed batches a/b/c integrated).
Worktree: `/workspace/audit-static-library-run`, branch `audit/lead-static-library-run`.
No push or merge. No paid, provider, Teams or real Submit call.

Own implementation commits, in order:

| Commit | Scope |
| :--- | :--- |
| `9112aa0d` | App routes: S1-008, S1-011, J6-014 |
| `f6c00ee6` | Type/format correction to the new App regression fixture |
| `2805660b` | Library state/order, blocked Bottom line, complete limitations, statement surface, scroll marker, loading shapes |
| `6b85260c` | Run spacing/icons, absent-data recovery, started intro, unsupported Stop removal |

Two foreign dependency commits are present only for local verification: `662909ad`
is the shell worker's `61b78d89` (nullable current area, rail label/marker), and
`adb4b6f3` is its Shell-only formatting commit `215ab2d0`. Do not cherry-pick those
again when integrating this worker's own commits.

## Outcomes

Fifteen repaired; one already repaired; two repaired in part with their remaining
pieces assigned elsewhere; two transferred to the ModuleNav owner.

| Finding | Outcome and evidence |
| :--- | :--- |
| S1-008 | Repaired. App and its document title ignore one trailing slash on `/kit`. |
| S1-011 | Repaired. Matched missing/newer-data routes keep their own title and area; unknown addresses pass `current={null}` to Shell. |
| J6-014 | Repaired. Unknown page has a visible Back to the library link in main. |
| S2-020, J6-012 merged | Repaired. Search, sector/pathway/state filters, Cards/List and range bands are stored in the current browser history entry and restored on remount. Other history state, including App's scroll-entry key, is retained. |
| S2-025 | Repaired under OQ-02. Key findings and its existing adjacent change-of-view/dates precede headline figures and For and against. Passage text and amounts are unchanged. |
| S3-012 | Repaired. Blocked and not-run modules have a Bottom line band with the exact reason and note, their state shape/word and existing gap link; the outline names Bottom line. A missing trace is stated by the existing marker. |
| S3-017 | Repaired under OQ-09. Individual limitations wrap in full; only the whole limitations card collapses. No per-item clipping/Show all control or resize observer remains. |
| S3-018 | Repaired with S3-017: the undersized individual Show all/Show less controls no longer exist. The existing whole-card control remains 32px. |
| S3-020 | Repaired. The statement table's scroll surface is one white bordered card, so header, sticky labels and figure cells share a surface. |
| S3-025 | Repaired. The section marker follows the actual enclosing main scroller and section positions, including scrolling back after a click. It no longer remembers only the last clicked section. |
| S3-032 | Repaired. The cell index is `cellIndex`; the row index still supplies row trace identity. This style-only rename changes no runtime behaviour. |
| S2-015, S3-019/S4-015 merged | Repaired in retained visual scope. Modules has a navigator/body-shaped placeholder; Evidence has section tabs/rows. The current loading Modules tab stays a current link to its index. R16's announcement-only part is not reintroduced. |
| S6-022 | Repaired. Documents pictogram uses existing size/spacing/radius/type tokens; Context uses gap-2 and Submit heading/text gap-1. Other cited spacing was already repaired in batch b. |
| S6-023 | Already repaired by batch b: Readiness has hairline-divided plain rows, no nested bordered item surfaces. Existing StartPage test confirms this. No speculative shared abstraction was added. |
| S6-024, C2-017 merged | Repaired once in shared PurposeCards: repeated decorative file-check icons are removed; the chosen radio retains its tick. Both surfaces use this component. |
| S6-026 | Repaired in owned StartPage and ActivityPage absent-data states: sentence "This library holds no run records." and Back to the library link. The bare `/run/start` route guard is assigned to the static model/follow-up worker. |
| S6-031 | Repaired intro portion: Run started no longer says nothing is spent before the last step. Recap/library fixture consistency belongs to the fixture worker. |
| S6-033 | Repaired under OQ-06. Removed the unsupported disabled Stop run action and its reason; existing Open actions remain. |
| S3-028, S3-037 | Transferred: both are wholly in ModuleNav.tsx, owned by the static follow-up worker (current-module scrolling and visible state words). No overlapping edit here. |

## Test first

New persistent surface regressions:

- `web/src/App.auditRoutes.test.tsx`: four failures before the App repair; kit
  slash, unknown-page recovery/current area, Model and Run missing-data identity.
- `web/src/pages/library/FinalAudit.test.tsx`: six failures before the first
  library repairs (the corrected scroll test mocks actual layout and scrolling),
  then two additional loading-shape failures before the skeleton repair. Eight
  tests pass. The home case restores search, selection, List and a range band.
- `web/src/pages/run/FinalAudit.test.tsx`: eight failures before the run repair;
  eight pass after it, including both running/queued Stop states, both absent
  page types, started intro and spacing.

S3-032's local-variable rename has no changed behaviour to expose with a failing
runtime test; the existing StatementBlock trace tests independently pin row
identity. This exception is recorded rather than adding an implementation-mirror
assertion about a variable name.

## Named changes to existing test expectations

No test or gate was skipped or loosened. Each changed expectation follows an
accepted finding or resolves an already-approved fixture integration consequence:

- `Module.test.tsx`: the blocked module now expects the Bottom line band, an
  On this page entry, and H1/H2/H3 instead of H1/H2. Exact reason/note/gap assertions
  remain. The individual clamp test now requires complete text, no individual
  disclosure, and the card collapse; the resize-observer count is exactly zero
  instead of two because clipping was removed (S3-017/018).
- `Overview.test.tsx`: its exact 14-heading level sequence is reordered to match
  the OQ-02 presentation order; no level/count is removed or made optional.
- `Module.limitationsOrder.test.tsx`: the old single Records outline entry is
  replaced by the exact four record headings already required by batch b's S3-026.
  Limitations stays before all four. This failed on the integrated base too.
- `Steps.test.tsx`: Purpose's featured icon is absent; SVG counts are one for
  the chosen tick and zero for other cards, and move to the newly chosen card
  (S6-024). The radio selection assertions remain.
- `ActivityPage.test.tsx` and `ActivityMore.test.tsx`: Stop is absent, as OQ-06
  requires; real Open actions and run-state assertions remain.
- `Home.test.tsx`, `Home.clearFocus.test.tsx`, `Home.startRun.test.tsx`: independent
  cases start with a fresh history state, because S2-020 deliberately preserves
  choices within one history entry. No expected filter value changed.
- `Home.startRun.test.tsx`'s no-report issuer case now explicitly clones a
  no-report state (no runs/latest/report/changes) for the same Corvane issuer.
  Batch b now supplies that report in the shipped fixture. The same exact
  No report yet and Start a run/navigation assertions remain.

## Checks

All long commands use `timeout 300`; Vitest uses `--maxWorkers=1`.
Node 24.22.1; uv exactly 0.12.5. npm dependencies are the existing symlink;
no manifest, lockfile or installed dependency was changed.

| Command/check | Exit | Result |
| :--- | ---: | :--- |
| `npm --prefix web run lint` | 0 | Full frontend lint, after correcting own initial lint findings |
| `npm --prefix web run format:check` | 0 | Full frontend format; inherited Shell formatting dependency included |
| `npm --prefix web run typecheck` | 0 | Full frontend types |
| App routes + existing App/route-change tests | 0 | 3 files, 77 tests |
| Initial affected library/run selection | 1 | 21 files: 423 passed, four expected-integration failures; not claimed as acceptance |
| Repaired four files + two new audit files | 0 | 6 files, 183 tests; all four initial failures resolved |
| Seven additional library caller files | 1 then 0 collectively | Six files/18 tests passed unchanged; Module.limitationsOrder had the inherited Records expectation, then all three tests passed with its exact heading correction |
| Last Module.limitationsOrder + App audit regressions | 0 | 2 files, 7 tests |
| `vitest run src/pages/signal --maxWorkers=1` | 0 | 34 files, 630 tests |
| `uv run --no-sync python tools/quality_gate.py` with own explicit `PYTHONPATH` | 0 | 0 findings, 2 inherited Python files/28 scoped lines; this worker changes no Python |
| `git diff --check` | 0 | No whitespace errors |

The union of the first affected selection and its corrected files covers all
427 original affected tests; the two new library/run files add 16. No failure is
hidden by the combined counts. Every changed production caller family was checked.

## Confidence review and simplification

The main uncertainty was history ownership. Entry-local storage retains App's
other state and avoids applying one home's filters to another history entry; the
regression restores all four choice families. A redundant state hook holding the
saved initial snapshot was removed in post-edit simplification. The scroll marker
uses the actual main element and a finite set of section targets, with listener
cleanup and memoized section descriptors. A zero-height/hidden main does not
pretend to identify a visible section. The limitation repair deletes state,
measurement and per-item disclosure rather than preserving an unnecessary second
collapse mechanism. Blocked reason/note and all table amounts remain exact.

Not verified: real browser Back/Forward and pixel layout; before/after handoff fidelity capture, final combined frontend gates and connected proof (lead stages 5/7); the bare `/run/start` guard and fixture portions owned by other workers; Windows and weekly CI; live models and Teams (out of scope). Historical named models and confidence-review/rewrite-tournament skills are unavailable; direct doubt tracing and simplification above were used.
