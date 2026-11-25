# Standing ruling: Signal's AI pass on GPT-6 Luna through the Copilot CLI

lifts: live-provider-pause
by: user
date: 2026-11-25
configs: copilot-luna-xhigh
cap_usd: 25

The owner was asked: "Signal's AI pass (spec 5.5, 5.8, 5.10) makes one small-model call per batch
of up to 20 new stories and one per digest issue. Allow it on copilot-luna-xhigh under a monthly
cap?", and said: "approve AI pass", and to the question of the monthly cap: "USD 25".

Scope: model calls made by the Signal service (`python -m deploy_workflow.signal`): its background
loop's AI pass over new stories, its digest writer, and the owner's `signal ai pass` command. No
call is made on a page view or in a request handler. Each call sends only stories' stored titles
and feed summaries (at most 300 characters) and, for a digest, the AI lines, sources, dates and
links of the stories in scope and the digest's own brief; no article text, no run file, no
issuer-library content.

Configuration: `copilot-luna-xhigh` only (GPT-6 Luna at extra-high effort through the GitHub
Copilot CLI, which every live call uses since the 2026-11-18 amendment of
`2026-11-11-run-start-submit.md`). That ruling also lists this configuration; it does not switch
Signal on, and this ruling does not widen the run start page.

Cap: USD 25 a month (UTC calendar month) per Signal store, the figure on the `cap_usd:` line above.
Each Signal store (the `signal/signal.db` under one `--root`) keeps its own ledger and its own
cap: a second root, or a store deleted and made again, starts the month at zero, so the figure
bounds each store's spend, not the sum over stores. The owner
sets the cap in force on the command line with `python -m deploy_workflow.signal --root <root> ai
cap <amount>`, at most that figure: the command refuses a higher amount, and a cap stored before
the figure was lowered counts as no cap, so the pass is off until the owner sets one within it. Before every call Signal reserves
the call's worst case from `deploy_workflow.model.pricing` (for this configuration USD 0.3585: the
whole 1,050,000-token context at USD 0.25 per million plus 128,000 output tokens at USD 0.75 per
million) and makes the call only if the month's settled spend, the open reservations and this
reservation together stay within the cap. A call whose cost the runtime does not report is
counted at its full reservation and switches the pass off until the owner runs
`... ai clear`; so does a reservation left open for more than an hour.

Digest limits: besides the monthly cap, Signal bounds what typed names can spend through
digests. Any named visitor may build up to five digests, and a name is typed, not authenticated,
so these limits are what hold, each checked in the same database transaction as the reservation:

- per name: the digests of one name make at most 5 paid model calls a UTC day (the owner sets the
  figure with `... ai digests-per-name <n>`, 0 to 1,000): at most USD 1.7925 reserved a name a day
  (5 x 0.3585). Deleting and re-creating a digest, or editing its schedule, does not reset it;
- per service: all digests together make at most 50 paid model calls a UTC day by default (the
  owner sets the figure with `... ai digests-per-day <n>`, up to 1,000): at most USD 17.925
  reserved a UTC day by default (50 x 0.3585), and up to twice that, USD 35.85, within minutes
  across 00:00 UTC, when one day's calls are followed by the next day's; at 1,000, USD 358.50 a
  day;
- per pass: one pass of the background loop makes at most 10 digest calls (USD 3.585 reserved);
- the monthly cap bounds all of these together with the story calls.

A call the adapter established was not sent costs nothing and counts toward no limit. Two further
rules are courtesy limits only, not guarantees: "Run once now" waits 30 minutes after a digest's
last run, and after a paid call that wrote no issue the digest waits for its next scheduled time
(a digest deleted and made again, or given a new schedule, is not held by either).

Key: the provider credentials come from the service's launching environment only
(`COPILOT_GITHUB_TOKEN`, or `COPILOT_USE_GH_LOGIN=1` with the gh CLI signed in, and
`COPILOT_CLI_PATH` naming the runtime); no credential file is read.

Estimate for the owner (not a limit): at the table's rates a batch of 20 stories costs about
USD 0.005 and a digest issue about USD 0.006, so 100 new stories and 10 digest runs a day come to
about USD 2.50 a month. These are estimates from list rates; the runtime's reported cost is what
is counted.

## Amendment, 2026-11-25: Signal is hosted by the application

Since ericmg13/credit-os2#83 there is no separate Signal service: the application's process
(`python -m react_frontend`) runs Signal's background loop. Where this ruling says "the Signal
service" or "the service's launching environment", read the application's process and its
launching environment. The scope, configuration, cap and limits above are unchanged.

One precondition is added. The application's environment already holds the provider key for
analysis runs, so the hosted loop is given that environment only when it also sets
`CREDIT_OS_SIGNAL_AI=1`; without it the loop makes no model call, whatever the cap. The owner's
`signal ai pass` command is unchanged. The switch is the builder's design, recorded here at the
owner's word: "your recommendation on 2", where item 2 of the list put to the owner included
that this ruling's wording was out of date. It narrows what may spend and widens nothing. Lines
written by `signal ai pass` are shown on the page only while the application was started with
the switch.
