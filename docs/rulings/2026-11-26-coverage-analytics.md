# Coverage analytics: a closed list of ruled arithmetic over module-written figures

by: user
date: 2026-11-26 (amended 2026-11-27)

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or
`configs:` line. No provider was called in writing it. Shown the draft of the sections from
"What it amends" to "The `AGENTS.md` change this needs", the owner answered "Approve ruling"
(2026-11-26). The wording of every rule is the drafting session's; the approval is the owner's. It
approves the rules, not a build: the spec and mockup are separate. The sections added after it,
and the exception in rule 3, each carry their own dated owner answer; that approval does not
reach them.

## What the owner said

From the owner's Codex thread of 2026-11-26 (read from the share link the owner gave; quoted as
written there): "My concern is repeating work and features already within library. Coverage should
be more data, analytics and visually rich." and "Coverage should include several types of
analysis, such as RV analysis." Asked in the reviewing session whether Coverage may compute
differences and aggregates, the owner chose "Draft the amendment", and then approved the draft as stated above.

## What it amends

One sentence of `2026-11-24-coverage-page.md`: "It computes no average, difference, score or
composite." It is replaced by the closed list below. Everything else in that ruling stands:
handoffs only, a figure drawn as written with its period, unit, Basis and limitation, missing
listed apart and never zero, one reporting unit at a time, periods matched as written, the newest
run per issuer, the working-page rule, and nothing written to the service.

## The five computations Coverage may make

Each is exact decimal arithmetic on figures a module wrote, shown beside the figures it used.

1. **Difference.** The difference between two figures one module wrote for one issuer in one
   unit: one field and heading at two periods the page can put in order, or a level and its limit
   in one row of a covenant or trigger table (headroom). Drawn as a signed amount in the figure's
   unit. No percentage change of a ratio. Change between
   two runs of an issuer stays on the Changes page.
2. **Cohort statistics.** Count, minimum, maximum, median and quartiles of one field over the
   issuers whose newest run states exactly one figure for the same field, the same column heading
   as written (a reported and an adjusted measure are separate cohorts, which is stricter than
   today's rank), the same unit and the same period. The count of qualifying issuers and the list
   of those left out, each with its reason, are always drawn. Fewer than three qualifying figures
   gives no statistic. No mean. Median: the middle figure, or half the sum of the two middle
   figures. Quartiles: the medians of the lower and upper halves, the middle figure left out of
   both when the count is odd. All on the written decimal text, not on floats. Where Peer benchmark
   wrote its own peer low, median, high and count, those are drawn as written beside the computed
   ones and never mixed with them.
3. **Distance from the cohort median.** A figure minus the median of rule 2, in the figure's unit
   ("0.4x above the cohort median"). Period series only. It is not offered for a bond yield or
   spread: the Valuation score of `2026-11-25-deliverables-and-recommendations.md` has its own
   rating bucket, reference holdings and bands, and Coverage draws no second median for a bond.
   One exception (owner, 2026-11-27, asked "May a margin be compared with its ranking's cohort
   median?": "Yes, allow it"): on Relative value, an RV book instrument's margin (or its Mid 3Y
   DM) may be compared with the median of the cohort's instruments of the same ranking. Here the
   qualification is per instrument, not rule 2's one figure per issuer: each row of the newest
   run's RV book with that ranking, a figure and the same unit counts once, an issuer may
   contribute several, and fewer than three instruments gives no median. It is labelled "cohort median by ranking,
   computed", never "peer median" or a valuation, and it is not the Valuation score's bucket
   median, which stays on Deliverables.
4. **Sum.** The total of written amounts in one currency (maturities by year). Amounts written in
   different scales of one currency are rescaled by an exact power of ten and the chart says so.
   No currency conversion: each currency is its own chart.
5. **Selection.** The smallest or largest of one issuer's own rows by a written figure or a rule 1
   difference (its test with the least headroom). Rows are never ranked across issuers: the
   2026-11-24 rule on row tables stands.

## What stays out

- No score, composite, weight, index or grade. No fitted curve, regression, forecast or imputed
  value. No ratio built from figures of two modules.
- No judgement word the module did not write: Coverage never says cheap, rich, attractive,
  improving or deteriorating, and makes no recommendation. The calls of Security selection,
  Market-implied risk, Evidence validation and Committee decision stay withheld from Coverage, as
  they are today.
- No data from outside the handoffs and the run's RV book (section "A second source"): no live
  price, benchmark, curve or holdings file. Market figures are the RV book's as entered, or those
  Security selection and Market-implied risk wrote, each with its date.
- No comparability decision. Coverage does not decide that two differently worded bases mean the
  same thing. Each row shows its Basis; the reader may leave an issuer out of the cohort (page
  state, drawn as "left out by you").

## The `AGENTS.md` change this needs

The 2026-11-24 rule rests on `AGENTS.md` ("Analytical modules own analysis"; "Delivery adds no
analysis"), so the ruling alone cannot be amended. Sentence added to the delivery bullet, after
the recommendation exception: "A second exception (`docs/rulings/2026-11-26-coverage-analytics.md`):
the Coverage page may draw five kinds of ruled arithmetic on module-written figures and the run's
RV book (difference, cohort statistics, distance from the cohort median, sum, selection), each labelled computed and
shown with the figures it used."

## Better and worse (added 2026-11-26)

Owner, asked "May colour say better or worse where a measure's direction is clear?": "Yes, allow
it". A difference, a position in the cohort or a headroom may be coloured better or worse, with
those two words in the legend, only for a measure whose direction the table in `DESIGN.md`
("Colour as signal") gives. The owner approved the table on 2026-11-26; cash was moved to no
direction on 2026-11-27 (owner, 2026-11-27, answering the colour session's question card: "Keep cash neutral", holding the 2026-11-16 rule that cash carries no judgement). Every other measure is
drawn without them. The words cheap, rich, attractive, improving and deteriorating, and any
recommendation, stay out: better and worse describe the direction of one figure, not the credit.

## A second source: the RV book (added 2026-11-26)

Owner, 2026-11-26, verbatim: "2. use the RV book market data for data. 3. there also qualitative measures such as sponsors deal count 3. should have good sorting and filtering 4. agent or code/scripts?"

- **Source.** "Handoffs only" is widened by one source: the RV book (the Sector RV workbook)
  supplied to a run, read through the reader `deploy_workflow.credit_snapshot` already has, with
  no fuzzy match. Its figures are drawn as entered, attributed to "RV book" with the run's date,
  never mixed in one column with a module's figure, and never overwrite one. No live feed.
- **Qualitative measures.** Words a module or the RV book wrote (sponsor, ranking, loan type,
  rating, a scorecard level) are columns like any other: drawn as written, filterable, groupable.
  A **count of rows by a written word** (deals per sponsor, instruments per ranking) is rule 2's
  count and is labelled computed. No word is scored or ordered unless its writer ordered it.
- **Scripts, not an agent.** Everything Coverage draws is worked out by code with a hand-written
  answer key. No model call reads, ranks, summarises or explains on this page. (The drafting
  session's answer to the owner's question 4, under AGENTS.md "Delivery adds no analysis" and
  "Keep expected values independent of production calculations".)

Owner, 2026-11-27, asked where the sponsor deal count comes from: "Module shareholder table".
Sponsors are the holders Business & governance's ownership register marks as sponsors, matched as
written.

The wording above is the drafting session's reading of the owner's points; the owner has not yet
read it back.

## Labelling

Every computed figure is drawn with the word "computed", names its rule in plain words (change,
median, distance from median, total, tightest), and opens the written figures it used. The
expected values in its tests are written by hand, not by the production arithmetic.

## Left open for the owner

1. Whether modules should write a typed basis code in their chart tables, so that figures on
   different bases are left out automatically rather than by the reader. This changes prompts and
   needs new runs.
2. A holdings-weighted exposure view. It needs a holdings file, which "handoffs only" excludes.
   Not proposed here.
3. Market figures from modules: the only typed one today is Market-implied risk's yield
   against maturity, and that module is held; spread, price and duration in module text are free
   text. Relative value now reads the RV book instead (section "A second source"); a module-written
   spread and duration view would still need a typed table from that module.
4. Downside has no typed table, so base against downside cannot be drawn until it has one.

## Evidence scope

No retained multi-issuer publication is in the repository, so no cross-issuer case has been
replayed for this ruling. The mockup figures are illustrations of form.
