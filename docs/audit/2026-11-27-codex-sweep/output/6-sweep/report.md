# Codex final sweep

Remote `main` was `4f9689bd5e5bf3db3f4606bf83adbe872b361c25` when pinned.
The local branch `codex/final-sweep-2026-11-27` starts there. The previous
worktree had an unborn branch and staged source. A sibling worktree preserves
that state and carries forward the five Stage 6 documentation edits.

## Reviewed changes

| Item | Result |
| --- | --- |
| S01 | Changes uses its existing passage converter. The matched jscpd scan removes its 21-line pair. The pilot ran 62 focused tests and passed independent review before the other Luna work was dispatched. |
| S02 | The shared money-unit cell drawer lives with the underlying formatter. The two reader import cycles are gone. The eight focused test files passed 301 tests. |
| S03 | The unused React `leadModules` export is private. Its functioning local helper and the legacy export are retained. The focused React and legacy Node suites passed 76 and 67 tests. |
| S12 | Delivery and the issuer library share the inline Markdown comment scanner while retaining their existing responses to an unclosed comment. The two Python callers' focused suites passed 360 tests. |

GPT-6 Luna implemented each item in its own detached worktree. Fresh reviewers
accepted all four against the patch and its caller evidence. The reviewed
changes and accepted measurements are recorded in the [register](register.md).

## Confidence review

1. **Source and line fidelity.** The two original scanners and the shared
   implementation agree for 729 combinations of comment markers, code spans,
   whitespace and Unicode. Existing aliases preserve the issuer-library
   export. Only the scanner was shared. The caller-specific policy for an
   unclosed comment stays where it was.
2. **Table and trace output.** The repeated Changes converter and its helper
   apply the same filtering, section order, evidence paths and table identity.
   The default preserves reference columns and the explicit ledger path still
   redacts them. The representation of an absent section stays distinct from
   an empty one.
3. **Currency display and module initialization.** The unit-header regex and
   display callback moved verbatim, with callers checked individually. The
   module-record logic still uses the same header recognition. Fallow confirmed
   2 to 0 cycles and TypeScript verifies all imports.
4. **Export reachability.** Static search, Fallow and TypeScript confirm the
   React export has no outside consumer. The internal and legacy readers are
   covered by the unchanged focused tests.

The post-edit comparisons retained the direct reuse of the Changes converter,
the unchanged money-unit callback, and one scanner shared by the two distinct
higher-level parsers. Alternatives that joined the complete parsers would
couple their intentionally different error contracts. S03 changes an export
modifier only.

## Recorded gates

| Check | Outcome |
| --- | --- |
| Python quality gate and import contracts against `4f9689bd` | Exit 0, three Python files and 28 owned lines, zero findings. |
| Fast Python CI selection | Exit 0 for the selected shards after retrying the long-temp-path shard. All 9,500 identities matched on main and the sweep. Each arm had 9,499 passes and the one existing retained-run skip. Full selection on the sweep used the byte-identical Python patch in the Python worker worktree. The integrated focused run used the combined tree. |
| Integrated Python focused tests | Exit 0, 379 passed across the store, chart delivery and repository rules. |
| Frontend lint, format, typecheck, audit, Knip, jscpd, build and script tests | Each exited 0. The gated script suite passed 78 checks. |
| Frontend tests and coverage | Vitest native merge exited 0. All 9,438 tests in the exact 564-file selection passed at 98.30% global line coverage (80% required). One shard reached the command cap and was rerun as four smaller batches with the same files. Per-shard runs report partial coverage; the unchanged threshold is enforced on the native merge. |
| Issuer-library Node logic | Exit 0, 577 passed. |
| Static file gate | Exit 0 with 148 passes on the integrated build using installed headless Chromium and the unchanged gate. The same browser passed 148 checks on the pinned main build. Native Chrome on main hit its own 60-second route timeout. Native Edge on the sweep reached 92 passing checks and hit the 300-second command cap. |
| Default connected browser proof | Exit 1 on main and the sweep in both Chrome and Edge. Both report two headline cards overflowing at 375px. Current PRODUCT.md sets supported widths at 1024px and wider. |
| Connected proof, existing desktop-only mode | Exit 1 on main and the sweep in both browsers, at the same Downside assertion. The proof expects `US$m` for Stressed FCF. The current reader ruling specifies `$m`, which both builds display with the same figures. The original proof assertions stayed intact. |
| Tracked-file secret scan | Exit 0. |

The baseline and integrated proof logs, test reports, retry evidence, browser
screens and measurements are under `/private/tmp/credit-os-final-sweep.qGoGct/` and
the integration worktree's `proof-artifacts/`.

The [matched measurements](measurements.md) record 24 fewer net source
lines, 21 fewer duplicate lines in each language, and two fewer import
cycles. Seven synthetic report routes yielded identical normalized reader
text in the separate desktop readback. This readback did not replace the
connected proof gate. Stage 6 acceptance remains blocked by the two
connected assertions reproduced on the pinned main revision.

The recorded sweep verification covered the application patch committed at
`ef75dab8`. The SHA-256 of that tracked patch is
`465c655bfd002523f60cef10f9c984862e6babba273f83ae4ba77fa75365bcff`.
The new scanner file's SHA-256 is
`8cd118ad09ac36e5c648ccecd58397223ad2b057804551a3b72801d72e6e3866`.

PR review removed a unit-header comment left above the period-header regex.
The change affects documentation in the code only.

Not verified: the formal connected proof beyond each first failing assertion,
live provider responses and spend, Windows release behavior, and a causal
render speed improvement.
