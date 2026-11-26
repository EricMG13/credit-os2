# CP-2G

## Request
TransDigm Group Incorporated as of 2024-09-30.

## Sources

- TDG market quotes 2024-09-30.md fc1e0d6fe55bf91fa3ac3ef6f7791e5c04f8f9089d5cdf079177b9c7f88f7aea
- TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6
- TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2
- TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6
- TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f
- TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf dc6a8ea6249e4e919d190a4bbb459d9bf4eded005b7d5680ae911b32d44d44af
- d496141dex101.htm.jsonl f3296f34a0a29871c452cfdcdffa444ed3163ba19b7a2091f8da0081f6a659a3
- d739389dex101.htm.jsonl 599f31abf0aa7b187a9bff99122a8cd143af1a7010252ba16ceff665df723547
- d826058dex41.htm.jsonl 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4
- d833756dex101.htm.jsonl 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac
- d887611dex101.htm.jsonl e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8
- d887611dex41.htm.jsonl 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c
- context 62c37d80723b96ed14a1b54402b92ba662c7b4d30976d6266ec0e1857d64d0db
- CP-0 4148ec2ae29d3269cd1912423f3a35e708c7f07cd13c0d726e6d493c49e03d93
- CP-1 e587b905d8d8aba6ac6b40efd45f80d29c378375f6cbe22fe98f221d149b1b1b
- CP-1D 641419f035073a3d1a6b9e5159188231b84f7c993dd0a7cd2fcb3dd53ce6efd0
- CP-2A a94699bc5147d88bc2ad56e711f910fb4a5fcd382ab1a040723174acf9a3fe3f
- CP-2D e39a7a0542d3e08de0f6d3581f510dd4e232e00becda0feca6973c7922a0a9a0

## Findings

### Bottom line

Base-case deleveraging comes from EBITDA growth, not debt reduction: debt only amortises to USD 24,603 million, gross leverage falls from 6.53x to 5.17x by FY2027, and the USD 6,637 million of FY2028 maturities must be refinanced rather than repaid.

Net leverage falls further, from 6.02x pro forma for the 2024-10-18 dividend (4.88x at year end before it) to 3.76x in FY2027, but only because the model keeps all free cash flow; if it is paid out, as in FY2024, FY2027 net leverage is 4.77x. In the downside, with EBITDA 20% below base and cash interest at USD 1,554 million, free cash flow stays positive at USD 614.4 million in FY2025, yet gross leverage is 7.39x and cover 2.16x, only a 7.37% further EBITDA fall from 2.00x. Creditor risk sits in refinancing terms and distribution policy, not near-term liquidity.
Basis: Financial foundation (CP-1); Downside (CP-2A); calculation F15; calculation F20; calculation F21; calculation F22; calculation F25; calculation F27

### Key findings

- Deleveraging is earnings-driven and therefore hostage to growth. Debt falls only by scheduled amortisation of USD 93 million in FY2025 and USD 92 million a year after, so gross leverage moves from 5.91x in FY2025 to 5.50x in FY2026 and 5.17x in FY2027 purely because revenue grows 10%, 7% and 6% at a constant 48.02% reported EBITDA margin, lifting EBITDA to USD 4,756.9 million. The growth path is set below FY2024 organic growth of 16.2%, but it is still the single assumption that decides how much of the leverage built in FY2024 is reversed before the refinancing window.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 45; Financial foundation (CP-1); calculation F1; calculation F3; calculation F15; calculation F20

- FY2025 is the cash low point in every case, and the cause is the dividend, not operations. The USD 4,348 million paid on 2024-10-18 exceeds base free cash flow of USD 1,482.1 million by a wide margin, leaving base closing cash of USD 3,302.1 million and accessible liquidity of USD 4,308.1 million; cash then rebuilds to USD 6,713.1 million by FY2027 if nothing further is distributed. No case exhausts liquidity in the horizon, so the liquidity runway is not reached.
Basis: Financial foundation (CP-1); Liquidity (CP-2D); calculation F13; calculation F16; calculation F24

- Coverage is the tightest metric and moves first. Cash interest steps up to USD 1,525.1 million in FY2025 on the issuer's scheduled run-rate, so base cover falls from 3.29x in FY2024 to 2.75x before recovering to 3.14x by FY2027. In the downside cover is 2.16x in FY2025 and only 2.45x by FY2027, which is the earliest breakpoint in the model.
Basis: Financial foundation (CP-1); calculation F7; calculation F22; calculation F27

- Free cash flow cannot retire the FY2028 wall on its own. Cumulative base free cash flow over FY2025 to FY2027 is USD 5,077.1 million, 76.5% of the USD 6,637 million maturing in FY2028, and USD 2,285.6 million in the downside; even full retention leaves refinancing as the plan, and the issuer ranks debt prepayment last in its use of excess cash. The FY2027 leverage entering that refinancing is 5.17x gross in the base and 6.47x in the downside.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56; Financial foundation (CP-1); calculation F20; calculation F26

- The model's free cash flow is deliberately conservative. Rebuilt on the model definition, FY2024 free cash flow would have been USD 1,649 million against USD 1,880 million reported, a USD 231 million shortfall, mainly because reported EBITDA is struck after non-cash stock compensation. All three cases therefore understate cash build by roughly that amount a year, which strengthens rather than weakens the net-leverage path.
Basis: Financial foundation (CP-1); Earnings quality (CP-1D); calculation F14

### Contrary evidence and what would change the view

The strongest evidence for a more constructive path is the upside case and the earnings measure lenders use. If FY2024 organic momentum of 16.2% fades only slowly and margins keep expanding, gross leverage reaches 4.62x and net leverage 3.19x by FY2027, with cover of 3.52x, and on the issuer's EBITDA As Defined every ratio would be lower again. The strongest evidence for a worse path is policy, not trading: the 2024 annual report says the company may borrow for special dividends and repurchases, it paid two special dividends in FY2024, and it bought back USD 316 million of stock in the quarter after the as-of date. If all free cash flow is distributed, FY2027 net leverage is 4.77x in the base and 5.96x in the downside, and any debt-funded distribution would lift gross leverage too, which the model does not include. The view would turn more constructive if FY2025 quarterly EBITDA growth runs well above 10% and cash is retained through the year. It would turn adverse if another special dividend is declared, if revolver usage passes USD 364 million, or if a quarter shows year-on-year EBITDA decline toward the downside path.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 45, 56; Liquidity (CP-2D); calculation F20; calculation F21; calculation F22; calculation F25

### Limitations

- The documents give no FY2025 revenue or EBITDA guidance, so the base growth path of 10%, 7% and 6% is the analyst's judgment; a slower path delays the fall in gross leverage toward 5.17x and raises the leverage carried into the FY2028 refinancing.
- The model includes no acquisitions, special dividends after October 2024 or share repurchases, because none is declared; the base net-leverage decline to 3.76x is therefore an upper bound on deleveraging, and the gross-leverage path holds only if future distributions are not debt-funded.
- Cash interest is a flat 6.13% on opening carrying debt, taken from the issuer's schedule that assumes Term SOFR of 5.6% to 6.5%; lower rates would lift coverage above the 2.75x FY2025 base figure, and refinancing the 2027 and 2028 maturities at higher coupons is not modelled.
- Downside revolver access is limited to the USD 364 million below the springing test threshold because the credit agreement is not supplied; the downside liquidity of USD 2,961.4 million in FY2025 may understate what is drawable if net leverage on the contractual measure is within the springing test level.
- The model is annual, so the intra-year trough after the October 2024 payment and around the July 2025 securitization maturity is not located; the FY2025 low point in cash is a year-end figure, not the minimum.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56; Liquidity (CP-2D); calculation F6; calculation F24

### Forward credit path

The table shows that leverage falls in every case but the downside enters the refinancing window close to where FY2024 ended, while liquidity never becomes the binding constraint.

| Case and period | Gross / net leverage (x) | EBITDA / cash interest (x) | Closing cash (USD m) | Accessible liquidity (USD m) | Creditor consequence |
|---|---|---|---|---|---|
| Actual FY2024 | 6.53x / 4.88x (pro forma net 6.02x after 2024-10-18) | 3.29x | 6,261 | 7,267 | Year-end cash pre-funds the October dividend |
| Base FY2025 | 5.91x / 5.12x | 2.75x | 3,302.1 | 4,308.1 | Cash low point after the dividend |
| Base FY2027 | 5.17x / 3.76x | 3.14x | 6,713.1 | 7,719.1 | Deleveraging if cash is retained |
| Upside FY2027 | 4.62x / 3.19x | 3.52x | 7,624.8 | 8,630.8 | Strong position into FY2028 refinancing |
| Downside FY2025 | 7.39x / 6.66x | 2.16x | 2,434.4 | 2,961.4 | Earliest breakpoint: cover near 2.00x |
| Downside FY2027 | 6.47x / 5.43x | 2.45x | 3,921.6 | 4,448.6 | Refinancing at FY2024-like leverage |

### Analytical appendix — complete canonical registers

#### Definitions

| Definition ID | Metric | Definition | Source |
|---|---|---|---|
| DEF-1 | EBITDA | Issuer-reported EBITDA (net income plus depreciation and amortisation, net interest expense and tax), the primary denominator in Financial foundation | Financial foundation (CP-1) |
| DEF-2 | Debt and net debt | Balance-sheet carrying value, current plus securitization plus long-term, net of issuance costs; net debt is debt less closing cash | Financial foundation (CP-1) |
| DEF-3 | Model free cash flow | EBITDA less cash interest less (cash taxes plus working-capital investment) less capex; model CFO is the same before capex | calculation F12; calculation F13 |
| DEF-4 | Accessible liquidity | Closing cash plus undrawn facilities of 1006 (revolver 843, securitization 163) in base and upside; closing cash plus 527 (revolver up to the 364 springing threshold plus securitization 163) in downside | Financial foundation (CP-1); Liquidity (CP-2D) |

#### T2H.3 Assumption register

<!-- table-id: T2H.3 -->
| assumption_id | driver | case | period | value/range | unit | class | Source | rationale |
|---|---|---|---|---|---|---|---|---|
| A01 | Revenue growth | Base | FY2025; FY2026; FY2027 | 0.10; 0.07; 0.06 | ratio | analyst_judgment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 45 | Anchored below FY2024 organic growth of 16.2% (acquisitions added 4.4%); FY2025 includes full-year contribution of the June and July 2024 acquisitions; decay reflects normalising aftermarket recovery |
| A02 | Revenue growth | Upside | FY2025; FY2026; FY2027 | 0.14; 0.10; 0.08 | ratio | analyst_judgment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 45 | Organic momentum closer to FY2024's 16.2% persists longer |
| A03 | Revenue growth | Downside | FY2025; FY2026; FY2027 | 0.10; 0.07; 0.06 (as base) | ratio | analyst_judgment | Downside (CP-2A) | The downside shock is applied to EBITDA, not to revenue, so revenue is held at base |
| A04 | Reported EBITDA margin | Base | FY2025; FY2026; FY2027 | 0.4802 | ratio | calculated | Financial foundation (CP-1) | FY2024 reported margin (3813 / 7940) carried forward |
| A05 | Reported EBITDA margin | Upside | FY2025; FY2026; FY2027 | 0.4850; 0.4900; 0.4950 | ratio | analyst_judgment | Financial foundation (CP-1) | Operating leverage on higher volume; FY2024 reported margin rose from 47.81% to 48.02% |
| A06 | EBITDA decline versus base | Downside | FY2025; FY2026; FY2027 | 0.2000 | ratio | analyst_judgment | Downside (CP-2A) | Copied from the Downside scenario S02 (moderate commercial downturn); resulting margin 0.38416 |
| A07 | Capex / revenue | Base (all cases) | FY2025 | 0.03 | ratio | management_guidance | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 | Midpoint of the FY2025 guide of 2.5% to 3.5% of net sales |
| A08 | Capex / revenue | Base (all cases) | FY2026; FY2027 | 0.03 | ratio | analyst_judgment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 | FY2025 guide midpoint carried; no later guidance |
| A09 | Cash taxes plus working capital / revenue | Base (all cases) | FY2025; FY2026; FY2027 | 0.1059 | ratio | calculated | Financial foundation (CP-1) | FY2024 cash taxes 539 plus working-capital investment 302 over net sales 7940 |
| A10 | Cash interest rate on opening carrying debt | Base (and upside) | FY2025; FY2026; FY2027 | 0.0613 (6.13%) | ratio | calculated | Financial foundation (CP-1) | Issuer scheduled interest due within one year 1524 over debt 24880; schedule assumes Term SOFR 5.6% to 6.5% and includes swaps, caps and collars |
| A11 | Cash interest | Downside | FY2025; FY2026; FY2027 | 1554.036 | USD million | analyst_judgment | Downside (CP-2A) | FY2024 cash interest 1158 × 1.342 (scheduled run-rate plus one percentage point on floating debt), held flat |
| A12 | Dividends paid | Base (all cases) | FY2025 | 4348 | USD million | source_fact | Financial foundation (CP-1) | Special dividend 4216 and dividend equivalents 132 paid 2024-10-18; the quarterly figure of 4396 is not used |
| A13 | Dividends paid | Base (all cases) | FY2026; FY2027 | 0 | USD million | analyst_judgment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 | No dividend declared; no regular dividend policy; special dividends are discretionary and shown as a sensitivity |
| A14 | Acquisitions and share repurchases | Base (all cases) | FY2025; FY2026; FY2027 | 0 | USD million | analyst_judgment | Liquidity (CP-2D) | None committed; FY2024 acquisitions 2347 and Q1 FY2025 repurchases 316 show the policy risk excluded |
| A15 | Debt repayment | Base (all cases) | FY2025; FY2026; FY2027 | 93; 92; 92 | USD million | source_fact | Financial foundation (CP-1) | Issuer maturity ladder; no term loan or note matures before November 2027 |
| A16 | Securitization facility | Base (all cases) | FY2025 | Extended at 2025-07-11; October 2024 draw of 162.5 not modelled | USD million | analyst_judgment | Liquidity (CP-2D) | Annual extension right absent termination events; the draw raises debt and cash equally and is net-debt neutral |
| A17 | Accessible undrawn facilities | Base (and upside) | FY2025; FY2026; FY2027 | 1006 | USD million | source_fact | Financial foundation (CP-1) | Revolver availability 843 plus securitization availability 163 at 2024-09-30, held flat |
| A18 | Accessible undrawn facilities | Downside | FY2025; FY2026; FY2027 | 527 | USD million | analyst_judgment | Liquidity (CP-2D) | Revolver counted only to the 364 springing threshold plus securitization 163, because covenant definitions are not supplied |
| A19 | Minimum operating cash | Base (all cases) | FY2025; FY2026; FY2027 | None modelled | USD million | analyst_judgment | Financial foundation (CP-1) | Issuer states no minimum cash; restricted cash not separately presented |

#### T2H.4 Operating forecast

<!-- table-id: T2H.4 -->
| period | case | Revenue (USD m) | EBITDA (USD m) | margin | CFO (USD m) | Capex (USD m) | FCF (USD m) | evidence/assumption IDs |
|---|---|---|---|---|---|---|---|---|
| FY2024 | Actual | 7,940 | 3,813 | 48.02% | 2,045 | 165 | 1,880 | Financial foundation reported; model-basis FCF 1,649 (F14) |
| FY2025 | Base | 8,734.0 | 4,194.1 | 48.02% | 1,744.1 | 262.0 | 1,482.1 | A01; A04; A07; A09; A10; F1; F3; F12; F13 |
| FY2026 | Base | 9,345.4 | 4,487.7 | 48.02% | 1,978.6 | 280.4 | 1,698.2 | A01; A04; A08; A09; A10; F1; F3; F12; F13 |
| FY2027 | Base | 9,906.1 | 4,756.9 | 48.02% | 2,194.0 | 297.2 | 1,896.8 | A01; A04; A08; A09; A10; F1; F3; F12; F13 |
| FY2025 | Upside | 9,051.6 | 4,390.0 | 48.50% | 1,906.3 | 271.5 | 1,634.8 | A02; A05; A07; A09; A10; F2; F4; F12; F13 |
| FY2026 | Upside | 9,956.8 | 4,878.8 | 49.00% | 2,305.0 | 298.7 | 2,006.3 | A02; A05; A08; A09; A10; F2; F4; F12; F13 |
| FY2027 | Upside | 10,753.3 | 5,322.9 | 49.50% | 2,670.3 | 322.6 | 2,347.7 | A02; A05; A08; A09; A10; F2; F4; F12; F13 |
| FY2025 | Downside | 8,734.0 | 3,355.3 | 38.42% | 876.4 | 262.0 | 614.4 | A03; A06; A07; A09; A11; F5; F12; F13 |
| FY2026 | Downside | 9,345.4 | 3,590.1 | 38.42% | 1,046.4 | 280.4 | 766.0 | A03; A06; A08; A09; A11; F5; F12; F13 |
| FY2027 | Downside | 9,906.1 | 3,805.5 | 38.42% | 1,202.4 | 297.2 | 905.2 | A03; A06; A08; A09; A11; F5; F12; F13 |

#### T2H.5 Debt, cash and liquidity roll-forward

<!-- table-id: T2H.5 -->
| period | case | Opening debt / cash (USD m) | Issuance (USD m) | Repayment (USD m) | Interest (USD m) | Closing debt / cash (USD m) | Accessible liquidity (USD m) |
|---|---|---|---|---|---|---|---|
| FY2025 | Base | 24,880 / 6,261 | 0 | 93 | 1,525.1 | 24,787 / 3,302.1 | 4,308.1 |
| FY2026 | Base | 24,787 / 3,302.1 | 0 | 92 | 1,519.4 | 24,695 / 4,908.3 | 5,914.3 |
| FY2027 | Base | 24,695 / 4,908.3 | 0 | 92 | 1,513.8 | 24,603 / 6,713.1 | 7,719.1 |
| FY2025 | Upside | 24,880 / 6,261 | 0 | 93 | 1,525.1 | 24,787 / 3,454.8 | 4,460.8 |
| FY2026 | Upside | 24,787 / 3,454.8 | 0 | 92 | 1,519.4 | 24,695 / 5,369.1 | 6,375.1 |
| FY2027 | Upside | 24,695 / 5,369.1 | 0 | 92 | 1,513.8 | 24,603 / 7,624.8 | 8,630.8 |
| FY2025 | Downside | 24,880 / 6,261 | 0 | 93 | 1,554.0 | 24,787 / 2,434.4 | 2,961.4 |
| FY2026 | Downside | 24,787 / 2,434.4 | 0 | 92 | 1,554.0 | 24,695 / 3,108.4 | 3,635.4 |
| FY2027 | Downside | 24,695 / 3,108.4 | 0 | 92 | 1,554.0 | 24,603 / 3,921.6 | 4,448.6 |

Closing cash equals opening cash plus free cash flow, less dividends of 4,348 in FY2025 only, less repayment; interest is already deducted inside free cash flow and is not deducted again. Every roll-forward reconciles with no residual. Carrying-value accretion of issuance costs (about 40 a year in FY2024) is not modelled, so closing debt is slightly understated against the balance-sheet basis.

#### T2H.6 Credit metrics

<!-- table-id: T2H.6 -->
| period | case | Gross / net leverage (x) | Coverage (EBITDA / cash interest, x) | FCF / debt | Liquidity runway | definition IDs |
|---|---|---|---|---|---|---|
| FY2024 | Actual | 6.53x / 4.88x | 3.29x | 7.56% | Not reached: free cash flow positive; pro forma net leverage 6.02x after 2024-10-18 | DEF-1; DEF-2; Financial foundation |
| FY2025 | Base | 5.91x / 5.12x | 2.75x | 5.98% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2026 | Base | 5.50x / 4.41x | 2.95x | 6.88% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2027 | Base | 5.17x / 3.76x | 3.14x | 7.71% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2025 | Upside | 5.65x / 4.86x | 2.88x | 6.60% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2026 | Upside | 5.06x / 3.96x | 3.21x | 8.12% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2027 | Upside | 4.62x / 3.19x | 3.52x | 9.54% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2025 | Downside | 7.39x / 6.66x | 2.16x | 2.48% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2026 | Downside | 6.88x / 6.01x | 2.31x | 3.10% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |
| FY2027 | Downside | 6.47x / 5.43x | 2.45x | 3.68% | Not reached: free cash flow positive in every year | DEF-1; DEF-2; DEF-3; DEF-4 |

#### T2H.7 Breakpoints

<!-- table-id: T2H.7 -->
| driver shock | first break | period | liquidity/covenant/refinancing consequence | recovery action |
|---|---|---|---|---|
| EBITDA 20% below base with cash interest at 1,554.0 (downside) | Cover 2.16x; a further 7.37% EBITDA fall reaches 2.00x (EBITDA 3,108.0) | FY2025 | Gross leverage 7.39x on reported EBITDA; net 6.66x stays below the 7.25x incurrence level on this basis, but secured incurrence and distribution capacity narrow; free cash flow 614.4 stays positive | Suspend special dividends, repurchases and acquisitions; retain cash |
| All free cash flow distributed (policy sensitivity, not modelled in cases) | Net leverage stops falling: FY2027 net 4.77x base and 5.96x downside with cash held at 1,913 | FY2027 | Deleveraging limited to EBITDA growth; refinancing of FY2028 maturities at higher net leverage | Board retention of cash; none contractual established |
| Securitization not extended at 2025-07-11 | Repayment of 650 from cash | FY2025 | Base FY2025 cash of 3,302.1 absorbs it; downside cash of 2,434.4 also absorbs it but accessible liquidity falls toward the revolver threshold | Draw revolver below 364; renew or replace facility |
| FY2028 maturities of 6,637 | Cumulative base FCF 5,077.1 covers 76.50%; downside 2,285.6 | FY2027 | Refinancing required in every case; downside enters it at 6.47x gross | Refinance in FY2027 while leverage is falling; extend maturities |
| Term SOFR one percentage point higher | Cash interest up about 30 a year | FY2025 | About 77% of gross debt fixed; second-order to EBITDA risk | Hedging under the 75% fixed-rate objective |

#### T2H.8 Trajectory and triggers

<!-- table-id: T2H.8 -->
| case | trajectory | target/date | dependency | trigger | Downstream module |
|---|---|---|---|---|---|
| Base | Gross 5.91x to 5.17x; net 5.12x to 3.76x; cover 2.75x to 3.14x | Gross 5.50x by FY2026; 5.17x at FY2027 before the November 2027 first maturity | Revenue growth 10%, 7%, 6%; margin 48.02%; no distributions after October 2024 | Any special dividend or debt-funded acquisition; quarterly EBITDA growth below 10% | Refinancing & LME; Ratings & triggers; Fundamental credit |
| Upside | Gross 5.65x to 4.62x; net 4.86x to 3.19x; cover 2.88x to 3.52x | Gross below 5.00x by FY2027 | Revenue growth 14%, 10%, 8%; margin to 49.50% | Organic growth sustained near FY2024's 16.2% | Ratings & triggers; Security selection |
| Downside | Gross 7.39x to 6.47x; net 6.66x to 5.43x; cover 2.16x to 2.45x | Cover within 7.37% EBITDA of 2.00x in FY2025 | EBITDA 20% below base; cash interest 1,554.0 | Revolver usage above 364; cover below 2.00x; year-on-year EBITDA decline | Liquidity; Covenant capacity; Recovery & fulcrum |

### Forecast inputs (machine-readable)

```json
{
  "schema_version": "cpos-forecast-inputs/1",
  "currency": "USD",
  "scale": 1,
  "base": {
    "revenue": {"amount": "7940", "reason": null, "row": "Net sales", "period": "FY2024"},
    "ebitda": {"amount": "3813", "reason": null, "row": "EBITDA (Reported)", "period": "FY2024"},
    "interest": {"amount": "1158", "reason": null, "row": "Cash Interest Paid", "period": "FY2024"},
    "taxes": {"amount": "539", "reason": null, "row": "Cash taxes paid, net of refunds", "period": "FY2024"},
    "wc": {"amount": "302", "reason": null, "row": "Working capital change", "period": "FY2024"},
    "capex": {"amount": "165", "reason": null, "row": "Capital expenditures", "period": "FY2024"},
    "fcf": {"amount": "1880", "reason": null, "row": "Free cash flow", "period": "FY2024"},
    "debt": {"amount": "24880", "reason": null, "row": "Total Debt", "period": "FY2024"},
    "cash": {"amount": "6261", "reason": null, "row": "Cash & Equivalents", "period": "FY2024"},
    "undrawn": {"amount": "1006", "reason": null, "row": "Undrawn committed facilities at period end", "period": "FY2024"}
  },
  "base_drivers": {
    "revenue_growth": {"values": ["0.10", "0.07", "0.06"], "category": "Analyst Interpretation", "rationale": "Anchored below FY2024 organic sales growth of 16.2% stated in the 2024 annual report, decaying as aftermarket recovery normalises; FY2025 includes full-year acquisition contribution", "limitation": "No FY2025 revenue guidance in the documents; acquisitions after FY2024 are excluded"},
    "ebitda_margin": {"values": ["0.4802", "0.4802", "0.4802"], "category": "Analyst Interpretation", "rationale": "FY2024 reported EBITDA margin 3813 / 7940 carried forward", "limitation": "Ignores operating leverage and mix shifts from acquired businesses"},
    "capex_pct_revenue": {"values": ["0.03", "0.03", "0.03"], "category": "Management Language", "rationale": "Midpoint of the FY2025 guide of 2.5% to 3.5% of net sales, carried into FY2026 and FY2027", "limitation": "No guidance beyond FY2025; no maintenance and growth split"},
    "tax_wc_pct_revenue": {"values": ["0.1059", "0.1059", "0.1059"], "category": "Analyst Interpretation", "rationale": "FY2024 cash taxes 539 plus working-capital investment 302 over net sales 7940", "limitation": "Tax and working capital held proportional to revenue; no release in the downside"},
    "interest_rate": {"values": ["0.0613", "0.0613", "0.0613"], "category": "Analyst Interpretation", "rationale": "Issuer scheduled interest due within one year of 1524 over carrying debt of 24880, applied to opening debt", "limitation": "Schedule assumes Term SOFR 5.6% to 6.5%; refinancing at new coupons not modelled"},
    "dividends": {"values": ["4348", "0", "0"], "category": "Documentary Fact", "rationale": "Special dividend and equivalents of 4348 paid 2024-10-18 per the 2024 annual report; nothing further declared", "limitation": "Special dividends are discretionary and recurrent in policy; the quarterly figure of 4396 is not used"},
    "debt_repayment": {"values": ["93", "92", "92"], "category": "Documentary Fact", "rationale": "Issuer maturity ladder of long-term debt principal for FY2025 to FY2027", "limitation": "Excludes the securitization maturity at 2025-07-11, assumed extended, and finance-lease repayments"}
  },
  "downside_shock": {"ebitda_decline": "0.2000", "rate_increase": "0.3420"},
  "upside_drivers": {
    "revenue_growth": {"values": ["0.14", "0.10", "0.08"], "category": "Analyst Interpretation", "rationale": "Organic momentum closer to FY2024's 16.2% persists longer", "limitation": "No guidance; acquisitions excluded"},
    "ebitda_margin": {"values": ["0.4850", "0.4900", "0.4950"], "category": "Analyst Interpretation", "rationale": "Operating leverage on higher volume, anchored to the FY2024 margin of 0.4802", "limitation": "Incremental margins by channel are not disclosed"}
  },
  "downside_drivers": null,
  "facilities": null,
  "years": [
    {"year": 2025, "start": "2024-10-01", "end": "2025-09-30"},
    {"year": 2026, "start": "2025-10-01", "end": "2026-09-30"},
    {"year": 2027, "start": "2026-10-01", "end": "2027-09-30"}
  ],
  "scope_limits": [
    "The downside shock is copied from the Downside scenario S02; its rate increase of 0.3420 is measured against FY2024 cash interest of 1158 and already contains the scheduled step-up, so this module's own downside tables hold cash interest at 1554.036 rather than applying the increase to the forecast interest rate.",
    "Interest is applied to opening carrying debt at a flat rate derived from the issuer's next-year schedule.",
    "No acquisitions, share repurchases or special dividends after October 2024 are modelled.",
    "The October 2024 securitization draw of 162.5 is net-debt neutral and not modelled; the facility is assumed extended at 2025-07-11.",
    "Model free cash flow is 231 below reported free cash flow on the FY2024 back-test because reported EBITDA is after non-cash stock compensation."
  ]
}
```

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 6 |
| Calculated | 14 |
| Assumption-Based | 6 |
| Analyst Inference | 4 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 3 |
| Fields present | 7 |
| Fields total | 7 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 4 |

## Calculations

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| F1 | Base revenue path | 7940 × 1.10; × 1.07; × 1.06 | 8734.00; 9345.38; 9906.1028 | FY2025–FY2027, USD million | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 45 |
| F2 | Upside revenue path | 7940 × 1.14; × 1.10; × 1.08 | 9051.6; 9956.76; 10753.3008 | FY2025–FY2027, USD million | Financial foundation (CP-1) |
| F3 | Base EBITDA (revenue × 0.4802) | 8734 × 0.4802; 9345.38 × 0.4802; 9906.1028 × 0.4802 | 4194.0668; 4487.651476; 4756.91056456 (shown 4194.1; 4487.7; 4756.9) | FY2025–FY2027, USD million | calculation F1 |
| F4 | Upside EBITDA | 9051.6 × 0.4850; 9956.76 × 0.4900; 10753.3008 × 0.4950 | 4390.026; 4878.8124; 5322.883896 | FY2025–FY2027, USD million | calculation F2 |
| F5 | Downside EBITDA (base × 0.8) and margin | 4194.0668 × 0.8; 4487.651476 × 0.8; 4756.91056456 × 0.8; 0.4802 × 0.8 | 3355.25344; 3590.1211808; 3805.528451648; margin 0.38416 (38.42%) | FY2025–FY2027, USD million | Downside (CP-2A); calculation F3 |
| F6 | Interest rate anchor | 1524 / 24880 | 0.06125 (used 0.0613, 6.13%) | FY2025 schedule, ratio | Financial foundation (CP-1) |
| F7 | Base and upside cash interest on opening debt | 24880 × 0.0613; 24787 × 0.0613; 24695 × 0.0613 | 1525.144; 1519.4431; 1513.8035 | FY2025–FY2027, USD million | calculation F6; calculation F15 |
| F8 | Downside cash interest | 1158 × 1.342 | 1554.036 (shown 1554.0) each year | FY2025–FY2027, USD million | Downside (CP-2A) |
| F9 | Cash taxes plus working capital ratio | (539 + 302) / 7940 | 841; 0.1059 | FY2024, ratio | Financial foundation (CP-1) |
| F10 | Cash taxes plus working capital | Base: 8734, 9345.38, 9906.1028 × 0.1059; upside: 9051.6, 9956.76, 10753.3008 × 0.1059 | Base 924.9306; 989.675742; 1049.05628652. Upside 958.56444; 1054.420884; 1138.77455472. Downside as base | FY2025–FY2027, USD million | calculation F9 |
| F11 | Capex at 3% of revenue | Base and upside revenue × 0.03 | Base 262.02; 280.3614; 297.183084. Upside 271.548; 298.7028; 322.599024. Downside as base | FY2025–FY2027, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |
| F12 | Model CFO = EBITDA − interest − taxes and working capital | Base 4194.1 − 1525.1 − 924.9; 4487.7 − 1519.4 − 989.7; 4756.9 − 1513.8 − 1049.1. Upside 4390.0 − 1525.1 − 958.6; 4878.8 − 1519.4 − 1054.4; 5322.9 − 1513.8 − 1138.8. Downside 3355.3 − 1554.0 − 924.9; 3590.1 − 1554.0 − 989.7; 3805.5 − 1554.0 − 1049.1 | Base 1744.1; 1978.6; 2194.0. Upside 1906.3; 2305.0; 2670.3. Downside 876.4; 1046.4; 1202.4 | FY2025–FY2027, USD million | calculation F3; calculation F7; calculation F10 |
| F13 | Model FCF = CFO − capex | Base 1744.1 − 262.0; 1978.6 − 280.4; 2194.0 − 297.2. Upside 1906.3 − 271.5; 2305.0 − 298.7; 2670.3 − 322.6. Downside 876.4 − 262.0; 1046.4 − 280.4; 1202.4 − 297.2 | Base 1482.1; 1698.2; 1896.8. Upside 1634.8; 2006.3; 2347.7. Downside 614.4; 766.0; 905.2 | FY2025–FY2027, USD million | calculation F11; calculation F12 |
| F14 | FY2024 back-test of the model definition | 3813 − 1158 − 841 − 165; 1880 − 1649 | 1649; residual 231 below reported FCF | FY2024, USD million | Financial foundation (CP-1) |
| F15 | Debt path (all cases) | 24880 − 93; 24787 − 92; 24695 − 92 | 24787; 24695; 24603 | FY2025–FY2027, USD million | Financial foundation (CP-1) |
| F16 | Base cash roll-forward | 6261 + 1482.1 − 4348 − 93; 3302.1 + 1698.2 − 92; 4908.3 + 1896.8 − 92 | 3302.1; 4908.3; 6713.1 | FY2025–FY2027, USD million | calculation F13; calculation F15 |
| F17 | Upside cash roll-forward | 6261 + 1634.8 − 4348 − 93; 3454.8 + 2006.3 − 92; 5369.1 + 2347.7 − 92 | 3454.8; 5369.1; 7624.8 | FY2025–FY2027, USD million | calculation F13 |
| F18 | Downside cash roll-forward | 6261 + 614.4 − 4348 − 93; 2434.4 + 766.0 − 92; 3108.4 + 905.2 − 92 | 2434.4; 3108.4; 3921.6 | FY2025–FY2027, USD million | calculation F13 |
| F19 | Net debt | Closing debt less closing cash | Base 21484.9; 19786.7; 17889.9. Upside 21332.2; 19325.9; 16978.2. Downside 22352.6; 21586.6; 20681.4 | FY2025–FY2027, USD million | calculation F15; calculation F16; calculation F17; calculation F18 |
| F20 | Gross leverage = closing debt / EBITDA | 24787 / 4194.1; 24695 / 4487.7; 24603 / 4756.9; upside over 4390.0, 4878.8, 5322.9; downside over 3355.3, 3590.1, 3805.5 | Base 5.9100; 5.5028; 5.1721. Upside 5.6462; 5.0617; 4.6221. Downside 7.3874; 6.8786; 6.4651 | FY2025–FY2027, x | calculation F15 |
| F21 | Net leverage = net debt / EBITDA | Net debt from F19 over EBITDA of each case | Base 5.1226; 4.4091; 3.7608. Upside 4.8593; 3.9612; 3.1897. Downside 6.6619; 6.0128; 5.4346 | FY2025–FY2027, x | calculation F19 |
| F22 | Coverage = EBITDA / cash interest | Base 4194.1 / 1525.1; 4487.7 / 1519.4; 4756.9 / 1513.8. Upside 4390.0 / 1525.1; 4878.8 / 1519.4; 5322.9 / 1513.8. Downside over 1554.0 | Base 2.7500; 2.9536; 3.1424. Upside 2.8785; 3.2110; 3.5163. Downside 2.1591; 2.3102; 2.4488 | FY2025–FY2027, x | calculation F7; calculation F8 |
| F23 | FCF / closing debt | FCF from F13 over 24787; 24695; 24603 | Base 0.0598; 0.0688; 0.0771. Upside 0.0660; 0.0812; 0.0954. Downside 0.0248; 0.0310; 0.0368 | FY2025–FY2027, ratio | calculation F13 |
| F24 | Accessible liquidity | Base and upside: closing cash + 1006. Downside: 364 + 163 = 527; closing cash + 527 | Base 4308.1; 5914.3; 7719.1. Upside 4460.8; 6375.1; 8630.8. Downside 2961.4; 3635.4; 4448.6 | FY2025–FY2027, USD million | Financial foundation (CP-1); Liquidity (CP-2D) |
| F25 | Distribution-neutral net leverage (cash held at the post-dividend 1913) | 24603 − 1913; 22690 / 4756.9; 22690 / 3805.5 | 22690; 4.7699 (base); 5.9624 (downside) | FY2027, x | Financial foundation (CP-1); calculation F15 |
| F26 | Cumulative FCF against FY2028 maturities | 1482.1 + 1698.2 + 1896.8; 614.4 + 766.0 + 905.2; 5077.1 / 6637 | 5077.1; 2285.6; 0.7650 (76.50%) | FY2025–FY2027, USD million and ratio | Financial foundation (CP-1); calculation F13 |
| F27 | Downside FY2025 distance to 2.00x cover | 2 × 1554.0; 1 − 3108.0 / 3355.3 | 3108.0; 0.0737 (7.37%) | FY2025, USD million and ratio | calculation F5; calculation F8 |

Every roll-forward of opening to closing debt and cash reconciles exactly at the precision shown. Ratios are computed on figures rounded to one decimal place as shown in the tables, so they can differ in the fourth decimal from full-precision results.

## Gaps

| Gap | Why it matters | Affected case and period | Severity |
|---|---|---|---|
| No FY2025 revenue or EBITDA guidance in the documents | Growth and margin paths are the analyst's judgment and set the pace of deleveraging | All cases, FY2025–FY2027 | Material |
| Credit agreement and indentures not supplied | Covenant EBITDA, springing-test usage and incurrence capacity are not established; leverage is shown on reported EBITDA and downside revolver access is capped at USD 364 million | All cases, especially downside | Material |
| Future distributions, acquisitions and repurchases not declared | Base net-leverage path is an upper bound on deleveraging; distribution-neutral sensitivity shown separately | Base and upside, FY2026–FY2027 | Minor |
| October 2024 payment shown as USD 4,348 million in the annual report and USD 4,396 million in the next quarterly cash-flow statement | FY2025 closing cash could be up to USD 48 million lower | All cases, FY2025 | Minor |
| Refinancing terms for FY2028 maturities and securitization renewal terms not available | New coupons and renewal cost are not modelled | All cases, FY2027 onward | Minor |
| Quarterly granularity not supported by guidance | Intra-year trough after October 2024 not located | All cases, FY2025 | Minor |
| Use restriction | These cases are mechanical projections on stated assumptions; they are not a rating, covenant test, recovery estimate or investment recommendation | All cases | Minor |

## Next module

The orchestrator selects the next module.
