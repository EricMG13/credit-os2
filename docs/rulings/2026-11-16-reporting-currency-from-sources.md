# The run's currency is the currency the source files report in

by: user
date: 2026-11-16

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line; paid execution still needs its own explicit action. No run has been made with this change.

Owner's words, 2026-11-16, in the session that built the start page's Leave out:
- "cp-2d should work with what ever currency the issuer reports in. given the user has stated the
  currency in the launcher."
- On two limits put to them: "1. issuer can have a facility in different currency, but still report
  in one currency 2. that is an error on the user not the app". Asked which amount a facility in
  another currency counts at, the owner chose "Issuer's reported amount".
- "it has to run run on any reported currency provided by the source files and stated currency or it
  is useless."
- "modules should be currency agnostic, the source files dictate reporting currency. would be easier
  to just remove currency selection from the launcher."
- Asked about the start page's currency field: "Keep it, unasked". Asked whether a facility the
  filings give no reporting-currency amount for stays in the totals: "keep it, it does matter it will
  be reported in the same currency as reporting."
- Asked what the totals do if the filings give no reporting-currency amount for a facility: "that
  never happens, but if it did. the sources materials will contain a selected FX rate for the
  reporting. and that can be used to calculate it."

Order relayed by the PR manager session (owner, 2026-11-16): this change is its own pull request,
reviewed as a method change, after the start page's (#42) and Earnings Update's (#43).

Scope: offline only. No provider was called. Proof is synthetic until the owner runs a paid
non-USD run.

## What is decided

- The run's currency is the currency of Financial foundation's (CP-1's) statements: its money unit
  (`US$m` for USD, otherwise the currency code and `m`, as ruling C1 set for CP-1). Every money
  table of every module, every check and every label of the report and library reads it from CP-1's
  handoff. No module, check, page or label takes it from `run.reporting_currency`.
- `run.reporting_currency` stays in the context schema, optional; neither start page asks for it
  or defaults it. A value an older context holds is not read for the run's currency.
- The retired owner path still reads `run.reporting_currency` and is not changed here:
  `src/deploy_workflow/owners/period_basis.py`, `cp1d.py`, `cp2e.py`, `cp3c.py`, `cpl10.py` and
  `cp2a.py` (through `period_basis`). Only `src/deploy_workflow/owner_workflow.py` calls them; CP-OS
  and delivery never do. A context without the value would be refused on that path alone.
- A facility in another currency than the statements counts in every total at the amount the
  filings state for it in the reporting currency. Where the filings give none, it is converted at
  the FX rate the source materials state for the reporting, with the rate and its source recorded
  beside the figure. No rate is looked up, derived or invented. If the sources give neither (the
  owner expects this never to happen), the total is not calculable and says why; it is never a
  partial total.
- CP-1's T4.18 keeps each instrument's own amounts and gives its `Currency` as an ISO 4217 code.
  Each row also has a `Reporting Currency Amount` and an `FX Rate`. The `FX Rate` cell holds the
  rate only; the rate's locator goes in the row's `Source` cell. (Decided in this pull request's
  review, PR 46: a wrong forecast figure, and source references belong only on Evidence.)
- The forecast leaves out of its `facilities` any instrument whose T4.18 `Currency` is not the
  run's currency; that debt stays in the remainder at the interest-rate driver. When T4.18 holds
  such a row, a facility must match an `Instrument` on a row in the run's currency exactly, or it
  is refused (`cpos_forecast._check_facility_currencies`). The cost: such a facility's interest
  is forecast at the driver rate, not its coupon.
- Provider spend and caps stay in USD: they are the cost of the run, not the issuer's currency.
- The `cp2d-non-usd` forecast rule ("CP-2D builds its bridge in USD millions") is removed from every
  copy, and so are the start forms' warnings that money tables stay in US$ millions and that a
  facility in another currency is not calculable.
- The blank-period refusal considered on 2026-11-16 is not built: nothing in a CP-OS run reads the
  period for the currency, and the refusal would stop non-USD runs that work.

## What this supersedes

- `docs/rulings/2026-11-13-cp1-deploy-v-method-and-acceptance-check.md:81-83`: "The money tables of
  other modules (CP-2D, CP-3C, CP-4C) stay `US$m`, so a non-USD issuer's cells there read
  `Not supplied:`; the run-start form says so." They take the money unit.
- The same file, `:87-89`: "a reporting currency entered at run start that differs from the
  statements is not flagged" (moot: the entered value is no longer read). Its own-currency rule for
  CP-1 (`:28-34`) stands and now applies to every module.
- `docs/rulings/2026-11-11-module-presets-and-changes.md:329-331`: `### Net debt data` "US$m"; it is
  in the money unit (C1 already did this for CP-1).
- No ruling pinned `US$m` for CP-2D's liquidity bridge, CP-3C's refinancing need or CP-4C's value
  allocation charts: the catalogue plan names them without a unit
  (`docs/visualisations/2026-11-10-catalogue-plan.md:27, :30`). The pin was the code's fixed
  `"US$m"` (`src/deploy_workflow/owners/cpos_launch_tables.py`) and the library's `US$m`-only step
  tables (`apps/issuer-library/credit_os/handoff_fields.py`); both change here.
- The frozen keys and tests that pinned those: the non-CP-1 selector digest and "the money unit not in
  non-CP-1 selectors", the CP-2D/CP-3C/CP-4C money tables refused in another currency, the library's
  `US$m`-only step tables, and the start form's `US$m` warning test. Each changes in this pull request
  citing this record. The old ruling files are not edited.

Read by: the launcher's tables, selectors and checks; the issuer library's table rules; both start
pages; the catalogue; the report pages; CP-1's and CP-2D's method text.
