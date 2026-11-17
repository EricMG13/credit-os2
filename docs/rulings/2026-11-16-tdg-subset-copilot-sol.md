# TDG Deep module test: the seven market-data modules through GitHub Copilot on GPT Sol

lifts: live-provider-pause
by: user
date: 2026-11-16
configs: copilot-sol-medium

The Deep run on Claude Opus medium (`/Users/ericguei/cos-live/tdg-deep-20261116b`, run
`20261116-185348-01`) stopped at its USD 40 cap with 18 of 20 modules accepted, and GPT Sol on
OpenAI was refused for want of credits. The user then said "every module must to be run. turn
market screenshots in data for testing the module requiring it.", "use github sol", "finish the
remaining module and re-run just the modules that needed market data", chose "Subset, reuse 13
Opus answers", and said "just create a temp structure, different worktre and complete those
modules. we are testing module output, not the system. the system is doing it job."

Scope: one CP-OS run on `copilot-sol-medium` (gh CLI login, `COPILOT_USE_GH_LOGIN=1`; the gh
CLI's active account pays), in a temporary folder `/Users/ericguei/cos-live/tdg-subset-sol`
outside the repository. CP-2H, CP-3D, CP-3C, CP-4C, CP-3, CP-5 and CP-6 are called; the other
13 Deep modules reuse the Opus run's accepted answers, read only. The sources are the Opus run's
five TDG files, its context with the TDG term-loan quotes and Moody's and S&P facility ratings
typed in, and the market quotes file transcribed from the user's Bloomberg screenshots.

Test input, not evidence: the market figures carry the date 2024-09-30 for this test only (the
user: "This is a test just updated the figures to make it run"). The 13 reused answers were written
without them, and their source pins are restated for this run, so the run tests module output
only; it is not a delivery and is not listed in the library.

Cap: USD 15 for the run folder.
