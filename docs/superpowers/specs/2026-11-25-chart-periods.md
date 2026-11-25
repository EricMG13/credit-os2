# Chart periods: every supplied period, one order, periods on X

Owner's ruling, 2026-11-25: (1) when issuer financials carry several periods, charts display all
of them, ordered oldest fiscal year → latest fiscal year → YTD/PYTD → LTM → PF (pro forma) →
forecast years; (2) every time-series chart has periods on the X axis. Desktop only.

## The rule (one, written twice)

`src/deploy_vii/period_order.py` and `web/src/utils/periodOrder.ts` implement the same rule.
Both test suites read `tests/fixtures/period-order-cases.json`, written by hand from the ruling.
No other code in the repository parses a period label for ordering.

A label is read **strictly**: it is normalised (trimmed, upper-cased; apostrophes, brackets,
commas, full stops and colons to spaces; runs of spaces to one), the tokens below are taken out,
and if any letter or digit is left the label is **unparseable**. `Base case 2026`,
`Net debt 1500`, `Change vs FY2024` and `3M SOFR` are therefore not periods. The tokens give a
**class** and an optional **end**:

| Class (in order) | Marker |
|---|---|
| actual | none of the markers below |
| ytd | `YTD`, `PYTD`, or `3M`/`6M`/`9M` |
| ltm | `LTM`, `TTM` |
| pf | `PF`, `PRO FORMA`, `PRO-FORMA`, `PROFORMA` |
| forecast | `E`, `F`, `B` or `P` after the year (`FY2025E`, `26E`, `FY 2025 E`, `2026 (E)`); `NTM`; or the word `FORECAST`, `PROJECTED`, `PROJECTION`, `PROJ`, `BUDGET`, `GUIDANCE`, `OUTLOOK`, `ESTIMATE`, `ESTIMATED`, `EST`, `PLAN` or `TARGET` |

The highest class present wins (`PF FY2025E` is a forecast, `Pro forma LTM Jun 2025` is PF).

Other tokens: an ISO date (a real calendar date, else unparseable); one year, with an optional
`FY`, `CY` or `FYE` before it and `A` after it; a quarter (`Q3`, `3Q`) or half (`H1`, `1H`),
which may be glued to the year (`2024Q4`); a month name, with an optional day number beside it
(the day is not used); and the qualifier words `ACTUAL`, `REPORTED`, `RESTATED`, `ADJ`,
`ADJUSTED`, `AUDITED`, `UNAUDITED`, `AS`, `AT`, `TO`, `YEAR`, `QUARTER`, `HALF`, `PERIOD`,
`ENDED`, `ENDING`, `END`. A year is four digits from 1900 to 2199; a split year (`FY2024/25`,
`FY2023-24`, `2023/2024`: the second part must be the next year, which is the year read); or,
when the label also has `FY`/`CY`, a part, a month or a class marker, the last two-digit number
(`FY24` → 2024; 70 to 99 → 19yy).

End, first match wins: the ISO date; else, with a year: the month named; the quarter (month
3n); the half (month 6n); the `3M`/`6M`/`9M` count; or the year alone (month 12). Fiscal labels
are placed as if the fiscal year ends in the calendar year it names; a label that carries its
own date (`FY2024 / 2024-09-30`) goes by that date. A label with a class marker and no year is
an undated period of its class (`LTM`, `LTM 30 Jun`, `Dec YTD`). A forecast word
with no year (`Outlook`, `Target`, `Plan`) names no period and is unparseable; `NTM` alone is
an undated forecast.

Sort key: class, then end (year, month, day), then span (date or month, quarter, half, year),
so on one end date the shorter period comes first. Within ytd, ltm and pf an undated label sorts
after the dated ones, except an undated `PYTD`, which sorts first. An actual label with no year
is **unparseable**. Unparseable labels keep their authored relative order after every ordered
label, and the ordering function returns them as gaps; a caller shows them and states the gap,
never drops them. Labels with equal keys keep their authored order.

Structured periods (T4.14 rows: `period_type` and `end_date`) use the same key built from the
type and date, not from a label. `FinancialPeriod.period_type` gains `PF`.

## What each chart does

- **Strip charts S.1, S.2, S.3, S.5** (`financial_series.py`): every T4.14 period that carries a
  fact for the metric is plotted (FY, QUARTER, YTD, LTM, PF), in rule order; no four-quarter
  requirement. A PF period plots only where a fact carries its column; the model host
  builds no reported-history column for a PF period today, so a PF row is stated as a gap. A period without a fact for a metric is a gap for that point, not a reason to
  drop the chart.
- **S.4 maturity wall**: X categories in maturity-date order.
- **Markdown chart routes** (`markdown_delivery._chronological`), **issuer-library reader
  charts** (`handoff_fields._chart_table` supplies row order; the browser code draws rows in the
  order supplied), **connected report charts** (`charts.tsx`, `seriesData.ts`): rows ordered by
  the rule; unparseable periods drawn last with a stated gap.
- **`period_order` / `periodOrder`** (catalogue, reader): delegate to the rule, so LTM, PF,
  quarters and forecasts order instead of being rejected. `chart_rows` still raises on an
  unparseable Period or two rows with one key. "Latest period" (`chart_row` and its TypeScript
  twin) is the last row in rule order among the actual, ytd and ltm classes: a pro forma or
  forecast row is never reported as the latest reported figure. It is refused, as before
  this change, when the actual rows mix ISO-dated and fiscal-labelled periods (`FY2025` beside
  `2025-06-30`): which is later depends on the year end, and the rule does not guess for a
  figure presented as the latest. Charts still draw both, by the rule.
- **Forecast charts** (`forecastData.ts`, `scenarioPeriods.ts`): every actual, YTD, LTM and PF
  column of the grid is shown before the forecast years, not one latest actual; forecast
  periods are recognised by the rule, not by `FY\d{4}E` alone. Scenario comparison across cases
  still applies only to forecast periods.
- **HTML Model charts M1–M3** (`model_handoff_delivery.py`): the model layout is annual by
  contract and cannot carry an LTM or PF column at all (`ModelPeriod` has no class; each label
  must be `FY` and a year of type `Historical duration`; windows may not overlap; a fact id may
  hold no space). So these charts show every annual period the layout selects, in rule order,
  and say under the chart that the Model carries annual periods only. The figure builder places
  LTM and PF columns after the fiscal years if a later layout supplies them. This is the one
  chart family that cannot mix granularities.
- **Legacy issuer-library charts**: `screen.js` trend chart and `views.js` path chart read their
  periods from the table (all columns, rule order supplied by Python or by column order after
  ordering), no fixed `[3,2,1]` or FY2025–FY2027 axis. `comparisonChart`, where its categories
  are periods, puts periods on X with series in the legend.

## Excluded: X is rightly not time

Paired prior/current comparisons across several measures (X is the measure; the
two periods are the legend), cash bridge and EBITDA bridge steps (waterfalls), recovery waterfalls, peer ranges and peer
comparison bars, covenant bullets and limits, stack/row charts keyed by instrument or segment,
the hedge timeline and calendar (continuous dates, already ordered), and the maturity wall's
facility legend (its X is fixed by this work).

## Not yet compliant: periods ordered but not on X (owner decision)

These Financial foundation lead figures now order their periods by the rule and never take a
pro forma or forecast period as the latest, but do not put periods on the X axis. Each is a
redesign of its figure, left out of this change:

- **Interest cover** (`leads/foundation/InterestCover.tsx`): one row per period, the cover value
  along a horizontal scale. A time series of one measure, so ruling (2) applies.
- **Net debt / EBITDA strip** (`NetDebt.tsx`, `Strip`): one row per reported period and per
  stated pro forma adjustment, on a horizontal value scale. Partly a time series, partly a bridge
  of adjustments.
- **Net debt bars** (`NetDebt.tsx`): the latest reported period and its stated adjustments as bars;
  earlier periods are not drawn as a series.
- **Periods** (`Periods.tsx`): a time axis of which periods each figure states; it falls back to one
  period per row when the labels do not fit. A coverage figure, not a measure.

Rightly not time on X: **Segments** (X is the segment; one compared period) and **Cash ladder**
(X is the ladder step; one ladder per period, in rule order).

## Tests

Each defect has a test that fails on `main` at `4aaec9d1` and passes after. The shared table has
an explicit case that LTM and PF sit after every fiscal year and before forecasts, oldest first.
Expected values are literals in tests or the shared table, never computed by production code.
