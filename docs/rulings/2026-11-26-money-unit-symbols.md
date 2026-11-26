# Money units are drawn as currency symbols

by: user
date: 2026-11-26

A decision record for the reader pages. It changes presentation only: no handoff, prompt, method,
check, stored value or Python output changes, and no provider is called.

Owner's words, 2026-11-26: "module output reports "USD millions", when it should be using $m or £m
or whatever reporting currency. how to change this?"; on the proposed display-only change: "Yes,
display-only". Asked which pages: "All reader pages" (Modules, Overview, Forecast, Changes,
Coverage and the printed purpose reports). Asked about the Python-built Model page: "Leave it as
US$m".

## What is decided

- A money unit (`USD millions`, `US$m`, `GBP millions`, `GBPm`, any `<ISO code> millions` or
  `<code>m`) is drawn as the currency's symbol from `Intl.NumberFormat("en-US")` followed by `m`:
  `$m`, `£m`, `€m`, `CA$m`, `A$m`, `¥m`; a currency with no symbol keeps its code (`CHFm`, `SEKm`).
- A figure with a money unit reads sign, symbol, figure, `m`: `$2,222m`, `-$150m`, `£1,250m`; a
  space follows a letter symbol (`CHF 300m`). A figure the page keeps as written keeps its digits
  (`$1250m` stays ungrouped); text that is not a bare number takes the unit after it (`n.m. $m`).
- The conversion happens only where text is drawn (`web/src/pages/connected/moneyUnits.ts`:
  `unitLabel`, `withUnit`, `writtenUnit`; table Unit columns through `unitCells`). Stored and
  matching values keep the written form, so traces and row matches are unchanged.
- Drawn as written: module prose (for example "All amounts USD millions unless stated") and row
  labels, the Evidence page's Unit cells and source text, and the trace drawer. The Model page keeps
  `US$m` until a later change. (The Downside panels already drew a row label's "(USD millions)" as
  "($m)" before this record; that is left as it was.)
- Figures the Evidence page computes and formats itself (its comparison measures) follow the drawn
  form (`$25m`); its Unit cells and source text do not.
- Singular `<code> million` is a money unit too; `thousand(s)` is drawn as written.
- `docs/rulings/2026-11-16-reporting-currency-from-sources.md` still sets the run's currency and its
  stored money unit (`US$m` for USD, otherwise the code and `m`); this record changes only how that
  unit is drawn.

Answer keys: `web/src/pages/connected/moneyUnits.cases.json`, `web/src/pages/connected/signal.cases.json`.
