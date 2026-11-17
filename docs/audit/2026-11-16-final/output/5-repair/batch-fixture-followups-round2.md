# Fixture follow-ups: review round 2

Base: `ad5d55ac`. Scope: the Low review finding that S4-003's missing-sample-download repair
replaced an already-unavailable register's confidentiality qualification. No production code,
financial value, source identity, period, Signal, method, prompt, calculation or handoff changed.
No paid, real Submit, Teams or external application call was made.

## Repair

`web/fixtures/library.json` changes exactly one string: Halden Aerostructures, run 2026-09-30,
Record's Withheld register once again says:

> The withheld register lists figures the sources marked confidential, so it is not published.

That is the exact reason retained before `94472`. Its `href` was already null and stays null.
The other unavailable sample downloads keep their sample-bytes explanation. No extra sentence
was needed for this register: its original qualification already explains its unavailable state.

## Test first and expected-value changes

A new independent regression in `fixtureFinalAudit.test.tsx` pins the original reason and null
address, then renders the Record route and checks that the qualification is visible, Open is
disabled and no Open link exists. Before the fixture repair it failed on the exact reason
(1 failed, 10 passed; exit 1). It passes after the repair.

Two existing assertions change only to the qualification this review requires:

- `EvidenceRecord.test.tsx`'s disabled Withheld-register Open test changes its exact expected
  reason from `These sample bytes are not included in this saved example.` to the quoted original
  confidentiality sentence. Its disabled-button, accessible-description, visible-text and
  absent-link checks are retained.
- `fixtureFinalAudit.test.tsx`'s S4-003 loop now pins that exact sentence for this one original
  register; its generic sample-bytes assertion remains unchanged for every other download offer.

No test was skipped, no numeric expected value changed and no gate was loosened.

## Checks

All long commands used `timeout 300`; vitest used `--maxWorkers=1`.

| Check | Exit / result |
| :--- | :--- |
| New regression before repair | 1; 1 failed, 10 passed |
| `vitest run` fixtureFinalAudit, EvidenceRecord, readRecord | 0; 3 files, 45 tests passed |
| `npm --prefix web run lint` | 0 |
| `npm --prefix web run format:check` | 0 |
| `npm --prefix web run typecheck` | 0 |
| Default `uv run --no-sync python tools/quality_gate.py`, uv0.12.5, own worktree PYTHONPATH | 0; two inherited changed Python files, 28 lines, zero findings; this round changes no Python |

Direct confidence review checked that the original confidentiality statement and null address
survive both fixture reading and Record rendering, without changing any other offer. The
simplest correct repair is the one-string restoration; no production abstraction was added.

Not verified: final combined repository gates, handoff fidelity capture, Windows/real-browser
rendering, or a real provider run. This fixture-only round exercises the qualification through
the reader and rendered Record route in jsdom.
