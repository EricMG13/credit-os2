SYNTHETIC answer key (invented issuer "Northbridge") for the Credit Snapshot workbook, with one real handoff for the CP-1 blocks: the workings behind `expected_cells*.json`.

Written by hand from the handoff text and `docs/methodology/portfolio-recommendation.md`. Where a figure below is computed, the line shows the hand calculation; the tests then check it against `recommendation.py` and `reference_portfolios.py` (they pass today, before any product code exists). Later tasks do not edit this folder.

## 1. Vocabulary of the expected files

Every entry: `sheet`, `block`, `row`, `column`, `kind`, `value`. A `copied` entry also has `module` and the 1-based physical `line` of that module's handoff; `value` is the exact cell text (a table cell) or the exact line (a prose paragraph). `number: true` means the cell must hold a number (the scorecard Levels: the heat strip needs numbers).

- `row` of a table row is its first column's cell text, and that cell is itself an entry (column = its header). `row` of a prose paragraph is `<section> <n>` (`Bottom line 1`, `Key findings 3`; paragraphs counted from 1 in the section; `Basis:` lines are not paragraphs). `row` of a strengths or weaknesses row is `Strength <rank>` or `Weakness <rank>`. Peers are `Peer 1..n`, CP-1C's rows first, then CP-DR's; names are not merged.
- `column` of a wide table (T4.4, T4.5, T4.6) is the period header (`FY2025`). `column` of a long table (T4.9, Net debt data) is the row's Period cell exactly as written (`FY2025 / 2025-12-31`), and its `row` is the Metric Name (T4.9) or the measure (`Gross debt`, `Cash`, `Net debt`).
- Columns omitted on purpose (they hold source references, which stay on Sources): every `Source` and `Source / Limitation` column, `Basis`, `Basis and limitation`, `Evidence ID`.
- Kinds: `copied` (handoff text), `gap`, `computed` (app arithmetic or classification), `entered at run start` (run context or run record), `analyst` (yellow, blank). The key lists every copied, gap, computed and entered entry; the test fails on any such Sources row, in a block named by `scope_blocks` (all blocks when null), that is not listed. `label` and `formula` rows are free (each non-empty cell still has exactly one Sources row).
- `absent_blocks`: no Sources row may have that block (hidden or merged into a gap line). `absent_values`: no cell on Snapshot, Inputs or Matrix may contain that text.
- `basis_lines`: each `Basis:` line of a prose section is on Sources, never on the three sheets.
- `Handoff text` for `gap` is the gap text shown; for `computed` the value as text; the test compares computed figures as numbers (`3.00` equals `3`).

## 2. Blocks and where they come from (as the PR 4 brief's table, 2026-11-25)

Snapshot: Header (Issuer, Sector, Country from CP-1A `company_description`; Run date and Pathway entered at run start, the pathway as its title: `credit_snapshot` is `Full credit assessment`, `earnings_update` is `Earnings Update`), Business description (that table's Business description cell), Operating model, Shareholders (CP-1A), Corporate ratings (issuer-scope ratings only), Scorecard (17 Levels) and Assessments (4 Views) (CP-2 T2.13 and T2.14), Transaction summary (CP-1A), New issue (deal terms entered at run start), Capital structure (T4.18), Capital structure totals (T4.9 fixed rows and Net debt data, plus six gap rows: Senior debt, Unsecured debt, Senior leverage, Unsecured leverage, Pro forma interest, Pro forma interest cover), EBITDA bridge (the bridge rows, a computed Classification, two gap rows), EBITDA measures (T4.4's `EBITDA (Reported)` and `EBITDA (Adjusted)`), Near-term events (CP-1A) and Monitoring triggers (CP-2 T2.12), Strengths and weaknesses (CP-2), Historical performance (CP-1B), Financials, Peers, and three analyst blocks. Inputs: Credit Score, Instruments (one row per T4.18 row), Quotes as entered, Reference medians (Median only). Matrix: Reference status, Reference medians, Issuer weight, Breached sector limits, Limits not read, Rating limits, Price floors.

## 3. Rulings made in this key (the plan did not make them)

- Capital structure shows `Principal` and `Drawn` as two copied columns (controller ruling T1-a, fix round 1), beside Instrument, Type, Ranking, Currency, Coupon or Margin, Spread (bps) and Maturity: 9 cells a row. A `Not supplied: ...` cell is shown as that text, never as a figure from another column.
- A cell the handoff writes as `Not supplied: ...` is a copied text, exactly. `–` (en dash) is copied as `–`. A field with no row at all in the handoff is a `gap` with the text `not in handoff`.
- Financials rows: the fixed labels of the method file (`cpos_cp1_statements.py` STATEMENTS and `REF_CP-1_STEPS.md`; ruling T1-c): T4.4 (`EBITDA (Reported)`, and `EBITDA (Adjusted)` when written), T4.5 (`Net Cash from Operating Activities`, `Net Cash from Investing Activities`, `Net Cash from Financing Activities`, `Net Cash Change`, `Opening Cash`, `Closing Cash`, `Cash Interest Paid`, and `FX Effect on Cash` when the table has it), T4.6 (`Total Assets`, `Total Liabilities`, `Total Equity`, `Total Debt`, `Cash & Equivalents`), (T4.6's optional `Temporary Equity` is not in the ruling and not in the key), T4.9 (`Total debt / EBITDA`, `Net debt / EBITDA`, `EBITDA / cash interest` and the three adjusted twins), and Net debt data; plus a free-label row only when its label equals one of `Revenue`, `Gross profit`, `Margin`, `Growth` (T4.4 or T4.9), `FFO` (T4.5), `Senior debt` (T4.6) or `Senior leverage` (T4.9) once case and surrounding or repeated spaces are ignored (ruling T1-f, the bridge join's rule). So `Revenues, net`, `Operating margin`, `Capital expenditures` and the real file's `NET SALES` and `Revenue growth` are absent, and the real file's `GROSS PROFIT` is shown (as written). This free-label list is the key's reading of the brief's "revenue, gross profit, margins, growth, FFO, senior debt, senior leverage"; the brief does not give the exact words.
- EBITDA bridge Classification: a step is `realised` or `unrealised` only when its label equals a T1D.1 Description once case and runs of spaces are ignored AND that Add-Back ID's T1D.2 Assessment is not `Insufficient Information` AND `Run-Rate Claimed` and `Realized To Date` are plain numbers: `Realized To Date` at least `Run-Rate Claimed` is `realised`, below it is `unrealised`. Anything else, the two end rows included, is `unclassified`. The brief says only "T1D.2 gives a reading"; the Run-Rate against Realized comparison is the spec's wording (section 2, EBITDA bridge row), and its direction is this key's reading.
- A block with several source modules, one absent: Near-term events (CP-1A) and Monitoring triggers (CP-2) are separate blocks; Peers takes whichever of CP-1C and CP-DR ran; a pathway without CP-1C whose CP-DR writes the single `none` peer row (`no CP-1C question in the brief`, per the skill) gets one Peers gap line, `Gap` / `Text` / `no peers named`, and that phrase is an absent value (ruling T1-d); a pathway without CP-2 gets the one Scorecard gap line (it covers the Assessments, so that block is absent) and the Strengths and weaknesses gap line; Monitoring triggers is absent. A gap line is only for a block with no module at all.
- Reader-words gap texts: `The credit scorecard is not in this run.`, `Strengths and weaknesses are not in this run.`, `No Credit Score: the run has no credit scorecard.`, `not in handoff`, `needs add-back ids in the bridge`, `no reference stored`, `not held / not matched`. A block-level gap is `row` `Gap`, `column` `Text`.
- Facility-scope ratings (`Ba3`) are written nowhere (absent value). A run without a context has no New issue and no Quotes as entered block. Quotes as entered lists every `Quote` field as entered (Facility id, Kind, Bid, Ask, Price, Yield (%), Spread (bps), As of, Provider), kind `entered at run start`; a field the analyst left blank is a blank cell (value `` in the key) (ruling T1-e).
- A reference's as-of date is `reference_portfolios.long_date` (`20 March 2026`). A median is printed as stored, in the file's own unit, beside the header the file used for that measure (`File column`). Under five names the row is marked `under five names: no Valuation`.
- A reference unreadable in its store shows `Reference status`, `Status`, kind `gap`, with the store's own sentence (`test_an_unreadable_reference_shows_the_stores_sentence`).
- `Limits not read` counts the constraints rows read as not read with no instrument and no price (the issuer's sector applied), leaving out the rating-limit and price-floor rows, which are listed on their own; `Names` joins their `parameter` cells with `; ` in file order. Rating limits are listed for every bucket of `reference_portfolios.BUCKET_NAMES` (`IG`, `BB`, `B`, `CCC`, `Unrated`), each read with no price (ruling T1-g); a price floor shows its quantity value, and its breach is decided in Excel.

## 4. Computed values by hand

### Credit Score (CP-2 T2.13, full case): 3

Levels in factor order: Scale 2, Market position 2, Regulatory exposure 2, Technology 2, Barriers to entry 3, Leverage 3, Free cash flow 3, Liquidity 2, Rating trend 3, Geographic diversification 2, Product diversification 3, Market share Not scored, Customer concentration 2, Market access 2, Maturity profile 3, Interest cover 3, Financial policy 3. Scored: 16 (fewer than 12 would give none). Sum: 2+2+2+2 = 8; +3+3+3 = 17; +2 = 19; +3 = 22; +2 = 24; +3 = 27; +2+2 = 31; +3+3+3 = 40. Mean 40/16 = 2.5, an exact half, which rounds toward the weaker score: 3. Floor: Liquidity is 2 and Maturity profile is 3, neither is 5, so no floor. Credit Score 3 (Fair). In the pathway without CP-2 there is no scorecard and no Credit Score (gap text above).

### Reference medians (median over positions with a level in the bucket; names are distinct borrowers)

CLO portfolio (levels are discount margins in bp; as of 2026-03-20):
- BB: 250, 275, 300, 325, 350. Five positions, five names. Median is the middle value: 300.
- B: 380, 410, 425, 450, 470, 500 (Northbridge), 520 (Northbridge). Seven positions, six names (Northbridge twice). Middle (4th) of seven: 450.
- CCC: 800, 900, 1000. Three names, under five: median 900, marked, no Valuation.
Loan index fund (LVLN; levels are margins in percent, the file's own unit; as of 2026-03-19):
- BB: 2.50, 2.75, 3.00, 3.25, 3.50. Five names. Median 3.00.
- B: 3.25, 3.50, 3.75, 4.00, 4.25, 4.50. Six names. Even count: (3.75 + 4.00) / 2 = 3.875.
High-yield bond fund (JNK): not stored in the full case: `no reference stored`. With no stores (the other two runs) all three say so.

### Issuer weight (name match on `Northbridge Holdings plc`)

CLO: two matched positions with stated weights 2.25 and 1.00: 3.25 (stated weights add to 100: 5 x 10.0 + 2.25 + 1.00 + 5 x 6.35 + 3 x 5.0 = 50 + 3.25 + 31.75 + 15 = 100). LVLN: no position matched and no weight basis: `not held / not matched`.

### Limits of the CLO portfolio (methodology section 7), issuer sector Industrials (the context's, which wins over CP-1A's `Capital Goods`)

1. `Industrials max` (Sector, headroom 0.0%): applies to the sector, no headroom left: breached. Listed as Breached sector limit 1.
2. `Utilities max` (Sector, headroom 2.0%): names another sector: does not apply.
3. `CCC max` (Rating, headroom -0.4%): covers CCC only. CCC: breached (negative headroom). IG, BB, B, Unrated: does not apply.
4. `B and below max` (Rating, headroom 8.0%): covers B and CCC. B, CCC: within. IG, BB: does not apply. Unrated: worded "and below" without naming Unrated, so not read (owner ruling 2026-11-25, methodology section 7).
5. `Top 10 obligors` (Concentration, no headroom, status TBD): names neither the sector nor a bucket, and nothing can be read on it: not read. Limits not read: count 1, name `Top 10 obligors`.
6. `Minimum price` (Price, `≥ 90`): a price floor of 90; breach is a price strictly below 90, decided in Excel.
LVLN has no limits: Limits not read count 0, no names.

## 5. The real handoff (TransDigm CP-1, as of 2024-09-30)

Scope: CP-1 blocks only (`scope_blocks`). 18 T4.18 rows become 18 Capital structure rows of 9 cells and 18 Inputs instrument rows (the `Financing cost adjustment` row is written as a T4.18 row, so it is one). The header has 17 columns, with no Reporting Currency Amount or FX Rate. Fixed T4.9 rows exist for FY2024 and FY2023. T4.4 (EBITDA rows and `GROSS PROFIT`), T4.5 (including `FX Effect on Cash`) and T4.6 (including Total Assets, Total Liabilities, Total Equity) fixed rows are all present; no other free-label row matches. The bridge has 6 steps; CP-1D is not in the run, so every Classification is `unclassified`, and Structuring EBITDA and House EBITDA are gaps. The values and line numbers are the file's own.

## 6. Awkward cases and where they are

- A period the table has and leaves empty: `Gross profit` FY2024 `–` (CP-1 T4.4), `Cash Interest Paid` FY2024 `–`.
- More than 15 significant digits (text, not a number): `EBITDA (Reported)` FY2024 `298.12345678901234567`.
- A unit inside the cell (text): `Net Cash from Operating Activities` FY2025 `212.0m`; `x` in the cell: `Net debt / adjusted EBITDA` FY2024 `3.73x`.
- A bracketed negative stays text: `Net Cash from Financing Activities` FY2024 `(40.0)`. A signed negative is a number: `-85.2`.
- T4.18 with Reporting Currency Amount and FX Rate (CP-1) and without them (CP-1 of the earnings pathway; the real file).
- Bridge steps: `Restructuring costs` equals T1D.1 `RESTRUCTURING   COSTS` (case and spaces) and AB1 is Supported, 20.0 realised of 20.0: realised. `Run-rate synergies`: AB2 realised 4.0 of 12.5: unrealised. `Pro forma acquisition EBITDA`: AB3's Assessment is Insufficient Information: unclassified. `Other adjustments` matches nothing (AB4 is `Other adjustments, net`): unclassified.
- A scorecard with `Market share` Not scored, and a Basis with emphasis marks (`**Adjusted EBITDA** ... *(FY2025)*`), kept on Sources only.
- Accepted register heading forms in CP-1A: `### company_description`, `### 1. ownership_register`, `### **operating_model**`, ``### `transaction_summary` ``, and a `<!-- table-id: cp1a.events_timeline -->` tag; CP-2 uses `### T2.12`, the exact `### T2.13 - Credit scorecard` and `### T2.14 - Credit assessment` headings and a `cp2.cp_model_strengths_weaknesses` tag; CP-DR uses `### TDR.4`.

## 7. Changes of fix round 1

T1-a two columns; T1-c method-file fixed rows (both synthetic CP-1 files gained `FX Effect on Cash`, `Total Liabilities`, `Total Equity`); T1-d `CP-DR-none.md` for the earnings case; T1-e all quote fields; T1-f free labels ignore case and spaces; T1-g unsecured-leverage gap row. The deal-term talk cells, the numbers and the classification rule are unchanged. Probe 2 on each key now differs from the reviewer's selection only in the cells these rulings changed.
