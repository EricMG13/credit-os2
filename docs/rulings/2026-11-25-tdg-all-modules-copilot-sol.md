# TDG all-module screen test through GitHub Copilot on GPT Sol

lifts: live-provider-pause
by: user
date: 2026-11-25
configs: copilot-sol-medium test-assume-distress

Owner, 2026-11-25: "run live test on Sol via CLI to validate with real output. all modules must
produce an output, so consider adaptations to the engine for testing purposes only." Asked for the
spend, the owner chose "All three, cap USD 70"; asked what to send SEC EDGAR as the contact, "My
name and account email"; asked which test-only adaptations to allow, both: "Treat re-dated quotes
as current" and "Assume distress for restructuring".

Scope: three CP-OS launches on `copilot-sol-medium` in `~/cos-live/tdg-all-sol-20261125/_engine/runs`,
outside the repository: the Deep preset (20 modules); the Lite preset; and Lite plus CP-L10 compared
with that Lite run, so CP-8 has an earlier run. gh CLI login (`COPILOT_USE_GH_LOGIN=1`); that
account pays. Prompts carry the public TDG FY2024 filings, six executed agreements and the
transcribed quote sheet to GitHub and the model vendor; CP-DR and CP-1C may fetch sec.gov, with the
owner's name and account email as the SEC contact, set in the launching environment only.

Cap: USD 40 for the Deep folder, USD 15 for each Lite folder; USD 70 in all, re-runs included.

Test input, not evidence: the market figures are Bloomberg levels of 2026-06-27 carrying the date
2024-09-30, and for this test the copies do not say so. CP-4C is told to assume a distress trigger
(`--test-assume-distress`, off by default, refused without this ruling's `test-assume-distress`
grant and never reachable from the run start service); its claims, waterfall, fulcrum and
recoveries describe a restructuring nothing evidences, and CP-3, CP-5 and CP-6 read them. The runs
test the screens on real module output only; they are not a delivery and their folders are named
`test-…`.
