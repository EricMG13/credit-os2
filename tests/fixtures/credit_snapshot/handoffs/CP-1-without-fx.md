<!-- SYNTHETIC fixture for the Credit Snapshot answer key: invented issuer "Northbridge"; T4.18 written with the shorter header (the two currency-conversion columns left out); not a model output and not issuer data. -->
## Request
Build the financial foundation for Northbridge Holdings plc as of 2026-03-31 under the earnings_update pathway.

## Findings

### T4.4 Income statement

| Line item | FY2025 | FY2024 | Unit | Basis | Source |
|---|---|---|---|---|---|
| Revenue | 1,234.5 | 1,180.0 | GBP millions | Reported | NBG_annual_2025.pdf, page 40 |
| Revenues, net | 1,100.0 | 1,050.0 | GBP millions | Reported net of rebates | NBG_annual_2025.pdf, page 40 |
| Gross profit | 676.0 | – | GBP millions | Reported; FY2024 not restated | NBG_annual_2025.pdf, page 40 |
| Operating margin | 12.5% | 11.9% | GBP millions | Calculated | NBG_annual_2025.pdf, page 40 |
| EBITDA (Reported) | 312.4 | 298.12345678901234567 | GBP millions | Reported | NBG_annual_2025.pdf, page 41 |
| EBITDA (Adjusted) | 351.2 | 330.0 | GBP millions | Issuer adjusted | NBG_annual_2025.pdf, page 41 |

### T4.5 Cash flow statement

| Line item | FY2025 | FY2024 | Unit | Basis | Source |
|---|---|---|---|---|---|
| FFO | 280.0 | 250.5 | GBP millions | Calculated proxy | NBG_annual_2025.pdf, page 55 |
| Net Cash from Operating Activities | 212.0m | 198.4 | GBP millions | Reported | NBG_annual_2025.pdf, page 55 |
| Capital expenditures | -64.0 | -58.1 | GBP millions | Reported | NBG_annual_2025.pdf, page 55 |
| Net Cash from Investing Activities | -85.2 | -70.4 | GBP millions | Reported | NBG_annual_2025.pdf, page 55 |
| Net Cash from Financing Activities | -102.5 | (40.0) | GBP millions | Reported | NBG_annual_2025.pdf, page 55 |
| Net Cash Change | 24.3 | 88.0 | GBP millions | Reported | NBG_annual_2025.pdf, page 55 |
| Opening Cash | 150.0 | 62.0 | GBP millions | Reported | NBG_annual_2025.pdf, page 55 |
| Closing Cash | 174.3 | 150.0 | GBP millions | Reported | NBG_annual_2025.pdf, page 55 |
| Cash Interest Paid | 61.2 | – | GBP millions | Reported; FY2024 not extracted | NBG_annual_2025.pdf, page 55 |

### T4.6 Balance sheet

| Line item | FY2025 | FY2024 | Unit | Basis | Source |
|---|---|---|---|---|---|
| Cash & Equivalents | 174.3 | 150.0 | GBP millions | Reported | NBG_annual_2025.pdf, page 38 |
| Total Assets | 2,980.0 | 2,850.0 | GBP millions | Reported | NBG_annual_2025.pdf, page 38 |
| Total Debt | 1,450.0 | 1,380.0 | GBP millions | Calculated sum of debt lines | NBG_annual_2025.pdf, page 38 |

### T4.18 Debt instruments

All money columns below are in the instrument's own currency.

| Instrument | Type | Carrying Value | Principal | Drawn | Commitment | Security | Ranking | Currency | Coupon or Margin | Rate Type | Reference Rate | Spread (bps) | Floor (bps) | Maturity | Annual Amortisation | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Term Loan B | Term loan | 588.0 | 600.0 | 600.0 | Not applicable: term loan | First lien | Senior secured | USD | SOFR + 3.75% | floating | Term SOFR | 375 | 50 | 2031-03-31 | 6.0 | NBG_annual_2025.pdf, page 80 |
| Revolving Credit Facility | Revolver | Not supplied: no balance printed | Not supplied: no drawn principal printed | Not supplied: no drawn balance printed | 150.0 | First lien | Senior secured | GBP | SONIA + 2.50% | floating | SONIA | 250 | Not supplied: floor not stated | 2029-06-30 | Not supplied: none stated | NBG_annual_2025.pdf, page 81 |
| 4.50% Senior Notes 2030 | Notes | 349.1 | 350.0 | 350.0 | Not applicable: notes | Unsecured | Senior unsecured | GBP | 4.50% | fixed | Not applicable: fixed | Not applicable: fixed | Not applicable: fixed | 2030-06-15 | Not supplied: none stated | NBG_annual_2025.pdf, page 82 |
| 6.25% Senior Notes 2032 | Notes | 495.0 | 500.0 | 500.0 | Not applicable: notes | Unsecured | Senior unsecured | EUR | 6.25% | fixed | Not applicable: fixed | Not applicable: fixed | Not applicable: fixed | 2032-09-01 | Not supplied: none stated | NBG_annual_2025.pdf, page 82 |
| Receivables facility | Receivables facility | 80.0 | 80.0 | 80.0 | 100.0 | Trade receivables | Secured | GBP | SONIA + 1.75% | floating | SONIA | 175 | Not supplied: floor not stated | 2027-12-31 | Not supplied: none stated | NBG_annual_2025.pdf, page 83 |

### T4.9 Calculation register

| Metric Name | Formula | Numerator Value | Numerator Source | Denominator Value | Denominator Source | Period | Currency | Unit | Calculated Value | Calculation Status | Evidence Quality Tier | Limitations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Total debt / EBITDA | Carrying debt / reported EBITDA | 1450.0 | p38 | 312.4 | p41 | FY2025 / 2025-12-31 | GBP | GBP m | 4.64 | Calculated | 1 | Rounded to two decimals. |
| Net debt / EBITDA | Carrying debt less cash / reported EBITDA | 1275.7 | p38 | 312.4 | p41 | FY2025 / 2025-12-31 | GBP | GBP m | 4.08 | Calculated | 1 | Rounded to two decimals. |
| EBITDA / cash interest | Reported EBITDA / cash interest paid | 312.4 | p41 | 61.2 | p55 | FY2025 / 2025-12-31 | GBP | GBP m | 5.10 | Calculated | 1 | Cash paid, not expense. |
| Total debt / adjusted EBITDA | Carrying debt / adjusted EBITDA | 1450.0 | p38 | 351.2 | p41 | FY2025 / 2025-12-31 | GBP | GBP m | 4.13 | Calculated | 1 | Issuer add-backs. |
| Net debt / adjusted EBITDA | Net debt / adjusted EBITDA | 1275.7 | p38 | 351.2 | p41 | FY2025 / 2025-12-31 | GBP | GBP m | 3.63 | Calculated | 1 | Issuer add-backs. |
| Adjusted EBITDA / cash interest | Adjusted EBITDA / cash interest paid | 351.2 | p41 | 61.2 | p55 | FY2025 / 2025-12-31 | GBP | GBP m | 5.74 | Calculated | 1 | Issuer add-backs. |
| Total debt / EBITDA | Carrying debt / reported EBITDA | 1380.0 | p38 | 298.1 | p41 | FY2024 / 2024-12-31 | GBP | GBP m | 4.63 | Calculated | 1 | Rounded to two decimals. |
| Net debt / EBITDA | Carrying debt less cash / reported EBITDA | 1230.0 | p38 | 298.1 | p41 | FY2024 / 2024-12-31 | GBP | GBP m | 4.13 | Calculated | 1 | Rounded to two decimals. |
| EBITDA / cash interest | Reported EBITDA / cash interest paid | 298.1 | p41 | – | p55 | FY2024 / 2024-12-31 | GBP | GBP m | Not calculable: no FY2024 cash interest | Not Calculable | Insufficient | Cash interest not extracted. |
| Total debt / adjusted EBITDA | Carrying debt / adjusted EBITDA | 1380.0 | p38 | 330.0 | p41 | FY2024 / 2024-12-31 | GBP | GBP m | 4.18 | Calculated | 1 | Issuer add-backs. |
| Net debt / adjusted EBITDA | Net debt / adjusted EBITDA | 1230.0 | p38 | 330.0 | p41 | FY2024 / 2024-12-31 | GBP | GBP m | 3.73x | Calculated | 1 | Issuer add-backs. |
| Adjusted EBITDA / cash interest | Adjusted EBITDA / cash interest paid | 330.0 | p41 | – | p55 | FY2024 / 2024-12-31 | GBP | GBP m | Not calculable: no FY2024 cash interest | Not Calculable | Insufficient | Cash interest not extracted. |
| FFO / debt | FFO / carrying debt | 280.0 | p55 | 1450.0 | p38 | FY2025 / 2025-12-31 | GBP | GBP m | 0.19 | Proxy | 1 | Not an agency measure. |

### Net debt data

| Period | Gross debt | Cash | Net debt | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|
| FY2025 / 2025-12-31 | 1,450.0 | 174.3 | 1,275.7 | GBP millions | Carrying value of all debt lines; net debt is gross debt less cash. |
| FY2024 / 2024-12-31 | 1,380.0 | 150.0 | 1,230.0 | GBP millions | Carrying value of all debt lines; net debt is gross debt less cash. |

### Chart data: EBITDA bridge

| Step | Amount | Reporting unit | Basis and limitation |
|---|---|---|---|
| Reported EBITDA | 312.4 | GBP millions | FY2025 reported EBITDA; opening amount. |
| Restructuring costs | 20.0 | GBP millions | Issuer add-back; plant closure costs. |
| Run-rate synergies | 12.5 | GBP millions | Issuer add-back; procurement savings not yet fully realised. |
| Pro forma acquisition EBITDA | 8.3 | GBP millions | Issuer add-back; acquisition not yet closed. |
| Other adjustments | -2.0 | GBP millions | Issuer adjustment; net of small items. |
| Adjusted EBITDA | 351.2 | GBP millions | Issuer adjusted EBITDA; closing amount. |
