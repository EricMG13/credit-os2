# UI review tails — independent review

Verdict: PASS for `fbf1bedf4da190693188bd07e4929d3617c90f85`, compared with `d4b3db28`. No High or Medium finding and no requested product change. Read AGENTS.md, all seven commits/diff, the original group-3 review notes for T27/T35/T38/T39/T40, the final batch report and retained native probe, and each actual caller.

The five small families meet their assigned scope:

- Static ChangeCard now supplies the existing missing-source marker when its source property is omitted, including null trace data. Object.hasOwn correctly preserves explicit false/null/undefined source slots used by connected Changes outside a static RunFrame. The static Changes caller omits source; the connected caller always supplies it. The gutter follows the rendered control. Amounts, directions and authored cause/effect remain unchanged.
- Evidence's untraced Calculations metric is selected by its semantic label, preserving its exact delivered zero and qualification after tile reordering. Traced runs retain their prior filtered Traced items behavior. Timing rows remain unchanged; the delivered full-record note is verbatim after a scope prefix and the separate footnote accurately counts displayed versus recorded timing rows. Call-row coverage is explicitly distinct from the delivered timing sample and delivered total.
- The source switch is withheld only on the sentence-only Forecast page with null forecast; other Model pages retain it. Unreadable-model copy directs readers to available records without falsely promising other models are unaffected. Diagnostic handling and model index behavior are unchanged.
- Static route subjects now use the saved draft's actual existing Stepper label (or delivered started title), issuer, and selected Trace item's own item label. Unknown drafts/items retain the old area fallback. App, scroll behavior and route rendering are unchanged.
- Existing expectation changes match the requested copy/title changes. The Module S3-017 integration assertion now checks zero observe targets in the Limitations card or descendants rather than forbidding unrelated chart observers globally. This is meaningful scope for the original limitation rule, preserves the before/after toggle check, and is explicitly authorized in the lead task/report. No production observer, timeout or gate was changed.

Independent verification on the pinned candidate:

| Check | Result |
| --- | --- |
| Narrow changed/caller files | Saved complete Vitest log reports 10 files / 133 tests passed in 38.46s. `/workspace/scratch/ui-tail-review-tests.log`. The environment disconnected before the original session's exit status could be resumed; the result is stated as observed log output, not an observed process exit. Files: Evidence tails/Record filter, ChangeCard, static/connected Changes, no-Forecast, unreadable notice and App title/route tests. |
| Follow-up exact source/count/filter/observer scope | Observed exit 0, 4 files / 15 selected tests passed; 120 tests were unselected by the explicit name filter, not changed or disabled. Includes S3-017 and explicit empty source slots. `/workspace/scratch/ui-tail-review-targeted-final.log`. |
| Typecheck and changed-file ESLint | Observed exit 0 for both. `ui-tail-review-typecheck.log`, `ui-tail-review-lint.log`. |
| Build | Observed exit 0. Existing chunk-size advisory remains. `ui-tail-review-build.log`. |
| Diff whitespace | Exit 0 for d4b3db2..fbf1bedf. |
| Native retained probe and awaited replacement | Original exit 1 at line187: it counts unreadable rows immediately after a hash-navigation click and saw zero before React updated. A scratch copy adds only `await page.getByText("Could not be read", {exact:true}).first().waitFor()` before the unchanged exact count. Replacement exit 0, all seven groups, no page errors or external requests, on independently rebuilt candidate/native Chrome157. `ui-tail-review-native.log`, `ui-tail-review-native-awaited.log`, `ui-tail-review-awaited.mjs`. This is a reproduced probe timing race, not an observed product failure; the original probe was not edited. |

Implementation gate evidence reviewed separately in the committed batch report: 164 affected tests, 103 Module tests, 630 Signal tests, lint/format/typecheck/build, Python changed-code gate with zero findings, and native seven-group proof all pass. The author's broad directory run timed out at 300s and is explicitly not treated as a pass. This reviewer did not rerun unrelated broad suites. Signal code is untouched. No paid/provider/service/real Submit/Teams call, package install, production/test edit, push or merge was performed.

Not verified: final combined-branch fidelity/gates, Windows/Edge behavior, live/provider/Submit/Teams behavior, broad directory/full suites, independent Signal/full format/Python reruns, and the interrupted narrow test process exit status beyond its retained all-passed log. The unchanged native probe's post-navigation timing race is explicitly retained above; only its scratch awaited replacement passes.
