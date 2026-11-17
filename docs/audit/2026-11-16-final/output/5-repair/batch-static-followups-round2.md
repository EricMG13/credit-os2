# Static follow-ups, round 2

Base: `4c64f33a`. A fresh implementer addressed the independent review's S3-037 test ambiguity
and S3-028 short-page viewport residual. No Signal, analytical method, calculation, prompt,
canned handoff or module-written text changed. No provider, real Submit or Teams call was made.
Historical models and the named review/tournament skills remain unavailable; direct confidence
and simplest-design checks were used under R7.

## Repairs

- **S3-037 affected test.** `Module.test.tsx` now locates the exact visible `Not assessable`
  badge in the kit blocked line containing the existing exact recovery explanation. The reason's
  visibility assertion remains, and badge/reason co-location is now explicit. The new navigator
  labels and compact selector legitimately repeat that state. No expected text, expected value,
  timeout or gate changed; the query no longer mistakes a navigation label for the page's badge.
- **S3-028 viewport.** Scrolling alone cannot expose the current entry when a short page's
  navigator has only 42px of internal scroll and extends below the window. `ModuleNav.tsx` now
  bounds its desktop height using its actual top, viewport height and the existing 24px spacing.
  It then aligns the current entry in that bounded region. Resize and ancestor scrolling refresh
  the measurement. Scrolling inside the navigator is deliberately left alone, so the analyst can
  browse the other module entries with the mouse. Compact layouts clear the desktop height.

The old longer Capital structure page happened to have enough scrollable content to pass the
first browser check; the shorter Credit snapshot page exposed the cause. No outer-page scroll
is used to make the current entry visible.

## Tests first and gates

| Command or scope | Exit and result |
| :--- | :--- |
| Original blocked Recovery case, before query repair | 1; one failing selected case at the original `getByText` ambiguity |
| `Module.test.tsx` plus new short-page regression, before height repair | 1; 107 passed, one failed: actual navigator height 852 versus the independent required 512 |
| `vitest run src/pages/library/Module.test.tsx src/pages/library/parts/ModuleNav.compact.test.tsx src/pages/library/Module.search.test.tsx --maxWorkers 1` | 0; 113 passed |
| `vitest run src/pages/signal --maxWorkers 1` | 0; 34 files, 630 passed |
| `npm --prefix web run lint` | 0 |
| `npm --prefix web run format:check` | 0 |
| `npm --prefix web run typecheck` | 0 |
| `CREDIT_OS_OUT_DIR=/workspace/scratch/static-round2-build npm --prefix web run build` | 0; both bundles built |
| Default `uv run --no-sync python tools/quality_gate.py`, exact uv0.12.5 and this worktree's explicit PYTHONPATH | 0; two inherited changed Python files / 28 lines, zero findings; no Python changed in round 2 |
| Native Chrome file-open viewport checks | 0; both Credit snapshot and Capital structure, fresh 1440px, 768→1440px resize, and 700px-high window |
| Native Edge file-open viewport checks | 0; Credit snapshot, fresh 1440px, 768→1440px resize, and 700px-high window |
| `git diff --check` | 0 |

Every long command used `timeout 300`; the additional Edge check used the stricter `timeout 60`.
The new geometry regression also proves that internal mouse scrolling is retained, ancestor
scrolling realigns the entry, and a shorter window recomputes the height. Its expected geometry
comes from the independent browser reproduction, not a call to production layout code.

## Browser evidence and confidence review

Native Chrome 157.0.8103.78 and Edge 155.0.4283.62 both put Credit snapshot's navigator at
364–876px in a 900px window, with a 512px client height, scrollTop 382 and current entry
838–876px. In a 700px window its height is 312 and current entry 638–676px. The outer page remains
at scroll position zero. Chrome's longer Capital structure page also stays within the window.
All non-local page requests were blocked; none was attempted. Chrome recorded no page error.

`static-followups-evidence/round2-browser-after.json` retains every measurement and the browser
versions. `round2-credit-snapshot-after.png`, inspected visually, shows the current item inside
the 700px window. The review's pre-repair reproduction and image are named in the independent
pair review; the previous round's longer-page screenshot is not proof of this short-page case.

The least certain boundaries were insufficient scroll range, resize after a compact layout,
and accidentally trapping manual navigation with a scroll listener. The new regression and both
browser checks cover those cases. A fixed height or additional scroll delta cannot account for
the reader header. A small measured bound and two existing browser events retain the simplest
correct design, without another component, dependency or layout abstraction.

Not verified: repository-wide frontend gates and the combined handoff fidelity comparison;
real Windows use; paid or real-issuer execution; arbitrary browser zoom and fonts outside the
recorded native Linux browsers. The lead retains combined-tree verification responsibility.
