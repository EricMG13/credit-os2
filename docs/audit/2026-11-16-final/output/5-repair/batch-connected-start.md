# Stage 5 step 7: connected run-start batch

Branch `audit/lead-connected-start`; base `301c7ded8e891f4fb935e197b52c0a093b1a3c34`
(the current repair-1 snapshot). This branch adds lead batch work only; it neither takes over nor
changes the active repair-1 branch. Integrate its new commits after repair-1 and reviewed batches
A/B/C. No paid, provider, Teams or real Submit call was made. All HTTP in these tests is mocked.

## Outcomes

All 19 assigned canonical findings are repaired. C1-014's Start page title and T07's remaining
unsaved-answer guard are additional lead follow-ups. The repeated pathway icon is repaired by the
worker owning the shared `run/start/Purpose.tsx`, rather than by duplicating that component here.

| Finding | Repair and regression |
| :--- | :--- |
| C2-009 (OQ-08) | The form offers Basic and Advanced. A prior Standard level opens as Basic; the service's other contract values are unchanged. |
| C2-010, merged J2-008 | Leave out/Put back explicitly say they return to More context, require review again and clear approval. Changing a pathway or market view after review explains the cleared decisions; a changed pathway also clears the retained review snapshot. |
| C2-012 | Central selection validation refuses files above 50 MiB and names each file before any upload; both picker/drop and folder input use it. The 50 MB hint remains unchanged. |
| C2-013, merged J2-004 | Repeated names are refused immediately, naming the duplicate; NFC/case-insensitive name checks also cover a folder chosen twice. The first selected row remains. |
| C2-015, merged J1-005 | Your name has a visible required mark and native `required`. Nonblank format is checked before leaving Documents or creating a submission. The same check protects browser Forward after a name was edited. |
| C2-018 | Checkbox wording distinguishes the number of causes from inherited consequences: e.g. one limit and its two consequences, with the same decision IDs and acceptance semantics. |
| C2-020 | Earlier files appear as Will be copied before inspection. They can be removed before copying; removing all disables Continue. A file already copied is labelled Copied when another file invalidates its inspection, rather than falsely saying it will be copied again. |
| C2-022 | Changing the pathway after a custom module choice visibly says the choice was reset. |
| C2-023 | Passive omitted-section text is a plain quoted section name; Changes uses the same reader name. A first-run Changes omission is stated as not compared on the first run of this pathway. Raw service output and module text are unchanged. |
| C2-027 | The warning says the launcher prefix was removed and its explanation remains visible. Native inputs own empty/format validation; the existing custom whitespace/cross-field defensive check remains. No claim is made that native-invalid fields reach Review. |
| J1-003, merged J3-002/J2-014 | Purpose and review explain that synthetic proof completes only a first Full credit assessment, cannot compare an earlier run and accepts the three named proof files only (filing mandatory, workbook/agreement optional to the proof adapter). The pathway cards remain available. T12 already supplies the readable launcher reason on the run page. |
| J1-006 | The review shows the actual chosen Portfolio workbook name while the submitted attachment remains its existing boolean. Unrecognised document kinds remain honest; the synthetic review explains that these can still be supplied sample files. |
| J1-007 | A portfolio fix has a Choose the Portfolio workbook button opening More context. Batch A supplies the shared service wording that names the control without a wrong step. |
| J1-016 | The run-type select and review fact both read Market view; Purpose remains the pathway step. |
| J1-017 | The basic-level help states that model and effort are set at the Advanced form level; a first-run comparison omission is explained, rather than presented as an unexplained dropped section. |
| J1-018 | Each pathway card shows its own cap from the existing service-provided caps; missing caps say unavailable. No local cap or money calculation was substituted. |
| J2-005 | Equal-size selected files are read sequentially and compared by SHA-256 before upload. A same-content row names its first copy, inspection stops until one is removed, and a different MIME type does not disguise identical bytes. Distinct content of the same size remains selectable. |
| J2-006 | The hint names exactly the suffixes the existing launcher reads (PDF, HTML, DOCX, TXT, Markdown, XLSX, CSV, JSON, JSONL). A refused selection names the file and the reason. Legacy ignored rows with a readable suffix say that the reason was not recorded, rather than inventing a type refusal. |
| J2-012 | A debounced local issuer lookup shows existing-run count/latest as-of date and a differing filed name automatically. It does not carry answers or read prior inputs. Stale replies are ignored. |

Additional follow-ups:

- C1-014: the browser tab title is `Start a run — Credit OS`.
- T07/C2-002: a case date, manual Issuer ID or classification entered alone now activates the existing
  leave warning. Pending copies reconstructed from the route do not themselves count as unsaved work;
  removing a pending file does. The existing warning still stops after successful Submit.

## Test-first evidence and test changes

New tests: `start/StartRun.finalAudit.test.tsx`, `ReviewSheet.finalAudit.test.tsx`, and
`plain.finalAudit.test.ts`. The first pair initially failed all 18 cases before the first repair;
subsequent feature groups also ran red before their repairs. The positive control for different
content with equal size already passed. No test is marked skip,
no timeout is raised, and no gate is changed. Logs live under `/workspace/scratch/connected-start-*`.

Additional red/green checks retained:

- `connected-start-extra-red.log`: missing duplicate-content marker, module-reset/approval notice,
  chosen workbook name, title, and pre-copy removal behaviour.
- `connected-start-module-reset-red.log`: the actual Requested modules control was unchecked before
  changing pathway; the required reset sentence was absent.
- `connected-start-synthetic-doc-red.log`: no synthetic explanation for unrecognised sample files.
- `connected-start-wording-extra-red.log`: no differing filed name and inconsistent passive Changes name.
- `connected-start-memory-red.log`: the initial comparison retained data URLs rather than compact digests.
  The instrumented replacement test uses three-byte files whose declared sizes are 50 MiB; it proves
  maximum one active buffer across overlapping selections plus immediate Inspect, real SHA-256 calls
  over three bytes, and no data-URL read. It allocates no limit-sized payload.
- `connected-start-confidence-red.log`: browser Forward bypassed early name validation; an already
  copied file was incorrectly relabelled Will be copied after another selection.

Changes to existing tests, required by the findings:

- `ConnectedApp.test.tsx`: Run purpose labels/facts become Market view (J1-016); the cascade checkbox
  becomes `I accept this limit and its 2 consequences` (C2-018); Basic/Advanced help expectations use
  the new explicit sentence (J1-017). Their underlying values, IDs and checkbox assertions remain exact.
- Its invalid-name parameter cases now exercise Continue on Documents (C2-015); blank names assert
  native invalidity, nonblank bad names retain the exact field error/focus/correction assertions.
  Unrelated drop, prior-peer, prior-pin and as-of-date cases supply the now-required valid analyst name.
- Its exact request/payload test independently asserts two issuer reads (automatic notice plus ownership
  check), permits their asynchronous ordering, and keeps the exact remaining request sequence. It finds
  summary/Submit by their endpoints; cap headers, raw File body, answers and approval digest stay exact.
- Its carried-file warning cases wait for the actual inspected-count sentence, since C2-020 makes the
  list present before copying. Their before/after leave-warning expected values remain unchanged.
- Its purpose-only dirty-state case clears the new dirty case date before checking only purpose state.
- `start/plain.test.ts`: the run-type refusal names the visible Market view control (J1-016).
- Node WebCrypto is supplied to jsdom in the affected test files, matching the browser API; production
  imports no Node module or new dependency.

The final confidence check also tried carrying a historical Standard run through the actual review
payload. It passed from the start: the existing callback already checks `Object.hasOwn(LEVELS,
prior.level)`, so removing Standard from LEVELS also normalized that entry path. No second production
fix was needed. The retained control and the explicit chosen-workbook boolean assertion bring the
three new test files to 32 tests; `connected-start-standard-carry-red.log` contains the passing
investigation, despite its provisional filename.

## Confidence review and simplest design

Doubts traced: stale issuer replies, name changes through browser history, pending/copy labels after a
new selection or an expired draft, exact attachment payload, duplicate MIME prefixes, same-size but
different content, removed originals, large-file memory and overlapping selection/inspection checks.
The surface regressions cover the confirmed defects and the important controls. Copy-state rendering
uses React state and resets with every existing draft-reset path; it never reads a ref during render.

The initial byte-string comparison was rejected in self-review: keeping all base64 content could grow
with every selected equal-size document. The final design holds only compact digests/names and one
file buffer at a time; a shared promise queue serializes checks and stops obsolete selections. A failed
read is still shown to its caller, while its rejected promise cannot poison later checks. No worker
pool, content cache, compatibility layer, provider call or dependency was introduced.

No Signal, prompts, analytical methods, calculations, canned handoff, actual module prose, Teams
implementation or Teams help text changed. No fixture amount or period changed.

## Gates

Every long command used `timeout 300`, Vitest at `--maxWorkers=2` (focused red cases used one).
uv was 0.12.5 from `/workspace/audit-tooling/bin/uv`; shared-venv Python commands set this worktree's
explicit PYTHONPATH and used `--no-sync`.

| Command | Exit | Evidence |
| :--- | :---: | :--- |
| `vitest run src/pages/connected/start src/pages/connected/ConnectedApp.test.tsx --maxWorkers=2` | 0 | 11 files, 490 tests, 87.77 s; includes 31 new regressions/controls |
| Same full affected Vitest command, committed code `592981af` | 0 | Independent repeat: 11 files, 490 tests, 77.61 s |
| `vitest run` on the three `*.finalAudit` files after the final added control | 0 | 3 files, 32 tests, 8.47 s |
| `npm --prefix web run lint` | 0 | Zero errors/warnings, repeated after the final control |
| `npm --prefix web run typecheck` | 0 | Zero type errors, repeated after the final control |
| `npm --prefix web run format:check` | 0 | All matched files formatted, repeated after the final control |
| `uv run --no-sync python tools/quality_gate.py --base 301c7ded` | 0 | 0 changed Python files/0 lines; import check included |
| `uv run --no-sync python tools/quality_gate.py` | 0 | 0 findings in the inherited 20 Python files/2,253 lines versus main |

Earlier broad tests exposed required behaviour consequences and an existing activity-table async
collection race; the exact findings above were fixed or the tests were brought to their required
behaviour without relaxing assertions. Final command results replace those intermediate attempts.

Not verified: no original browser probe or screenshot was rerun for this chunk; no combined fidelity
capture, full frontend gates or connected browser proof was run here (lead owns those); clipboard/folder
picker behaviour and pixel layout were not measured; duplicate bytes of carried-only files cannot be
compared from filename-only prior metadata and were not claimed; real issuer data, model responses,
provider/paid execution, Teams, Windows and a real work-PC browser were not exercised; named
confidence-review/rewrite-tournament skills and requested historical model variants were unavailable,
so their direct review/simplification fallback was used.
