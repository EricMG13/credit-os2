# R4-014 / C5-013: current design placement wording

Base: `5c39a559a933e8dc81c3038390a942cb8163864f` (`audit/lead-contract-docs`).
Repair branch: `audit/lead-contract-doc-scope`, isolated worktree
`/workspace/audit-contract-doc-scope`. This is the Low CD-1 follow-up from the independent
contract review, registered by the lead as R4-014 and merged into C5-013.

## Primary authority

The answer comes from `docs/rulings/2026-11-11-reader-and-issuer-report.md`, not from the
implementation or the derived matrices:

- Decision 9, lines 66–69, requires the selected run's handoff downloads, download-all and
  calculation/Model downloads in Evidence. It does not prescribe an exclusive Record tab.
- Decision 10, lines 70–71: “Run internals (hashes, instructions sent, retry and cost log) go in
  a fourth Evidence list, ‘Run record’, closed by default.”
- H4, lines 169–176, retains every register outside the named superseded scope. Lines 172–176
  require the same rows, columns, IDs, values and order; raw locators, hashes and reference
  columns stay where the method puts them, and “the app may show them in the inspector or the
  Run record, but never removes them.”

The current design now distinguishes module-written tables/registers, which remain unchanged
and exact and may appear in inspector/Trace or Record, from execution internals in Record.
Handoff downloads remain available in Record. The five tabs, calculation expansion, module
filter, Chart or Table option and component references are retained. No sorting control or
other rule is added.

## Exact before and after

Only three existing design lines changed. These are the exact changed description cells;
their other table cells are unchanged.

`docs/design/component-map.md:243`

Before:

```text
Record: module timings, Chart or Table; hashes and instructions; model calls; registers as written
```

After:

```text
Record: run internals (module timings, Chart or Table; hashes and instructions; model calls). Module-written tables and registers remain unchanged and exact; they may appear in the inspector, Trace or Record
```

`docs/design/component-map.md:400`

Before:

```text
Five: Summary, Trace with calculations, Sources, Gaps, Record with registers; nothing removed
```

After:

```text
Five: Summary, Trace with calculations, Sources, Gaps, Record with run internals; module-written tables and registers in the inspector, Trace or Record, unchanged and exact; nothing removed
```

`docs/design/react-module-coverage.md:37`

Before:

```text
Five tabs from the React design, Summary, Trace, Sources, Gaps, Record. Calculations expand in Trace (R12). Registers, calls, timings, instructions and handoff downloads live under Record (R13/R16/R17). One module filter applies to all five.
```

After:

```text
Five tabs from the React design, Summary, Trace, Sources, Gaps, Record. Calculations expand in Trace (R12). Module-written tables and registers remain unchanged and exact; they may appear in the inspector, Trace or Record. Run internals (calls, timings and instructions) live under Record (R13/R16/R17). Handoff downloads remain available there. One module filter applies to all five.
```

## Test first and checks

Saved probe: `output/5-repair/probes/contract-doc-scope.mjs:8` declares the three rows, exact
forbidden exclusive-placement phrases and required placement/internal distinctions. Lines
42–66 check only those rows in the two current design files. This is a finite textual
consistency probe, independent of production code, generated output and the derived matrices;
no application regression test was added.

Before changing either design file, ran from the isolated repository root:

```sh
node docs/audit/2026-11-16-final/output/5-repair/probes/contract-doc-scope.mjs
```

Observed exit **1**, with all three old exclusive phrases rejected and the missing required
distinctions reported: `Contract documentation scope: 3 rows, 12 failures`. After the wording
repair, the same probe exited **0**: `Contract documentation scope: 3 rows, 0 failures`.
The optional repository-root argument permits the unchanged baseline to be rechecked:

```sh
node docs/audit/2026-11-16-final/output/5-repair/probes/contract-doc-scope.mjs /workspace/audit-contract-docs
```

That final-probe baseline rerun also exited **1**, with the same 12 failures. Actual retained
logs: `/workspace/scratch/contract-doc-scope-red.log` and
`/workspace/scratch/contract-doc-scope-green.log`.

| Check | Result |
| --- | --- |
| `node --check docs/audit/2026-11-16-final/output/5-repair/probes/contract-doc-scope.mjs` | Exit 0 |
| Existing ESLint, `--no-config-lookup --config /workspace/credit-os2/web/eslint.config.mjs`, on the probe | Exit 0, no warnings |
| Existing Prettier, `--config web/.prettierrc.json --check`, on the probe | Initially exit 1; formatting fixed, final exit 0 |
| `git diff --check` | Exit 0 |
| `git diff --exit-code 5c39a559 -- docs/rulings docs/audit/2026-11-16-final/output/1-rubrics docs/design/react-live-handoff-crosswalk.csv` | Exit 0, all unchanged |

Original stage-1 snapshot SHA-256 values remain:

- `content-matrix.csv`: `c50bba4ba27106e86ebccd330ae86898963da38bd6746e457d63a08929a48fad`
- `control-matrix.csv`: `3bef212f8973cbe42c8bc3e322810047fe32bcc447c5c7c1f1e843c041bc8920`

Manual authority/diff review found exactly the three wording changes above, preserving every
existing option and component reference. No product code, ruling, matrix, analytical method,
prompt, calculation, Signal file, module text or proof handoff changed. No Python or TypeScript
changed, so their changed-code gates do not apply. This documentation-only correction changes
no rendered surface and needs no new screenshot/fidelity claim. The probe has no added
dependency or nontrivial function. Fresh independent review is requested before integration;
this branch is not pushed or merged.

Not verified: rendered UI/runtime behavior, analytical or handoff fidelity, paid/provider execution, seat checks, real Submit, Teams, application network activity, Windows/native-browser behavior, broad weekly suite and unrelated concurrent work.
