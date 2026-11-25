---
issuer_id: harbourline
issuer_name: Harbourline Synthetic Foods plc
module_id: CP-L10
analysis_date: 2025-03-31
reporting_period: FY2024
pathway: credit_screening
fixture: synthetic test data for an invented issuer, not issuer evidence
evidence_class: screening_run
---

## Request
Screen the financial change, credit, liquidity, market and legal position of Harbourline Synthetic Foods plc as of 2025-03-31 and name where a full assessment is needed.

## Findings

### Bottom line
The invented issuer looks adequate on liquidity and weaker on earnings, refinancing and document protection, so a full assessment is needed.
Basis: harbourline_annual_report.txt, page 12

### Key findings
Earnings and margins weakened, leverage rose slightly and the main bond falls due in a tight lending period.
Basis: harbourline_annual_report.txt, page 20

### Contrary evidence and what would change the view
Strong cash and an undrawn facility argue against a weaker view; a failed refinancing or a lost facility would worsen it.
Basis: harbourline_annual_report.txt, page 34

### Limitations
- Invented data only, so no conclusion carries weight.

### Financial change screen

| Topic | Finding | Materiality | Evidence | Next step |
| --- | --- | --- | --- | --- |
| Source basis | The annual report and one interim statement cover the same perimeter. | Medium | Direct | Confirm the perimeter in the next report |
| Earnings and margin change | Operating margin fell by about one point on input costs. | High | Direct | Full assessment of earnings |
| Cash conversion | Cash conversion held broadly steady against the prior year. | Medium | Direct | Watch next half year |
| Leverage and coverage | Leverage rose slightly while interest cover stayed adequate. | High | Direct | Full assessment of leverage |
| Liquidity and maturities | Cash and an undrawn facility cover the next two years of maturities. | Medium | Direct | Check facility terms |
| Comparability of key measures | One reported measure changed definition between years. | Low | Partial | Ask the issuer for restated figures |

### Credit screen

| Topic | Finding | Materiality | Evidence | Next step |
| --- | --- | --- | --- | --- |
| Business durability | Demand is stable and the customer base is broad. | Medium | Direct | No further work now |
| Margin and free cash flow resilience | Free cash flow stays positive under a modest cost shock. | High | Partial | Full assessment of resilience |
| Leverage and refinancing context | Refinancing falls in a period of tighter lending. | High | Direct | Full assessment of refinancing |
| Governance and sponsor behaviour | The owner has paid small dividends and no large distributions. | Low | Direct | No further work now |
| Financial policy and capital allocation | Stated policy favours debt reduction over acquisitions. | Medium | Partial | Test policy against actual spending |
| Environmental and transition exposure | Transition cost is disclosed in general terms only. | Low | Limited | Request transition plan detail |

### Liquidity and forward-risk screen

| Topic | Finding | Materiality | Evidence | Next step |
| --- | --- | --- | --- | --- |
| Accessible liquidity and uses | Accessible cash exceeds planned uses over the next year. | High | Direct | Full assessment of liquidity |
| Working capital, capex and cash burn | Working capital swings are seasonal and capex is flexible. | Medium | Partial | Review seasonal pattern |
| Rates and hedges | Most debt is fixed and a small floating part is hedged. | Medium | Direct | Check hedge expiry dates |
| Currency, commodity and inflation exposure | Input costs are partly passed on to customers. | Medium | Partial | Test pass-through assumptions |
| Base and downside trajectory | A downside case reduces cover but does not breach the covenant. | High | Partial | Full assessment of downside |
| Breakpoints and refinancing | The tightest point is the refinancing of the main bond. | High | Direct | Full assessment of refinancing |

### Security opportunity screen

| Topic | Finding | Materiality | Evidence | Next step |
| --- | --- | --- | --- | --- |
| Dated market snapshot | Prices are dated and taken from one dealer quote. | Medium | Limited | Refresh quotes before use |
| Curve and comparable compensation | The senior bond trades wide of two close comparables. | High | Partial | Full assessment of relative value |
| Trading liquidity and technicals | Issue size is small and trading is thin. | Medium | Direct | Check dealer depth |
| Structural recovery and protection | The senior bond ranks ahead of the junior notes. | High | Direct | Full assessment of recovery |
| Downside and liability-management exposure | Documents allow some debt to move ahead of this bond. | High | Partial | Review the permitted debt baskets |
| Integrated screening posture | Compensation looks fair for the risks found so far. | Medium | Partial | Decide after the full assessment |

### Creditor-document screen

| Topic | Finding | Materiality | Evidence | Next step |
| --- | --- | --- | --- | --- |
| Controlling document availability | The bond terms are available but the credit agreement is not. | High | Partial | Obtain the credit agreement |
| Protection weakness flags | Two protections look weak in the bond terms. | High | Direct | Full review of protections |
| Entities, guarantees and collateral | Guarantees cover most but not all operating entities. | Medium | Partial | Map guarantors to earnings |
| Leakage and priming flags | Terms permit some value to leave the group. | High | Partial | Review leakage baskets |
| Debt capacity and availability | The remaining debt capacity is limited by the leverage test. | Medium | Direct | Recompute capacity in the full assessment |
| Pressure points and upgrade priority | Document gaps are the first priority for the full assessment. | High | Direct | Start with document review |

### Analytical appendix — complete canonical registers

#### TL10.1 - Source and scope gate

| subject_identity | source_ref | source_owner_module | as_of_or_period | scope_status | topics_supported | limitation |
| --- | --- | --- | --- | --- | --- | --- |
| Harbourline Synthetic Foods plc | harbourline_annual_report.txt | CP-1 | FY2024 | In scope | SOURCE_BASIS; EARNINGS_MARGIN_CHANGE; CASH_CONVERSION; LEVERAGE_COVERAGE; LIQUIDITY_MATURITIES; KPI_COMPARABILITY | Invented data |

#### TL10.2 - Topic allocation

| topic_id | topic_label | source_owner_modules | materiality | evidence_status | disposition | priority_rank | summary | source_refs | upgrade_module_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SOURCE_BASIS | Source basis | CP-1; CP-1B | MEDIUM | DIRECT | SUMMARIZE | 1 | The annual report and one interim statement cover the same perimeter. | harbourline_annual_report.txt | CP-1 |
| EARNINGS_MARGIN_CHANGE | Earnings and margin change | CP-1; CP-1B | HIGH | DIRECT | DEEPEN | 2 | Operating margin fell by about one point on input costs. | harbourline_annual_report.txt | CP-1 |
| CASH_CONVERSION | Cash conversion | CP-1; CP-1B | MEDIUM | DIRECT | SUMMARIZE | 3 | Cash conversion held broadly steady against the prior year. | harbourline_annual_report.txt | CP-1 |
| LEVERAGE_COVERAGE | Leverage and coverage | CP-1; CP-1B | HIGH | DIRECT | DEEPEN | 4 | Leverage rose slightly while interest cover stayed adequate. | harbourline_annual_report.txt | CP-1 |
| LIQUIDITY_MATURITIES | Liquidity and maturities | CP-1; CP-1B | MEDIUM | DIRECT | SUMMARIZE | 5 | Cash and an undrawn facility cover the next two years of maturities. | harbourline_annual_report.txt | CP-1 |
| KPI_COMPARABILITY | Comparability of key measures | CP-1; CP-1B | LOW | PARTIAL | SUMMARIZE | 6 | One reported measure changed definition between years. | harbourline_annual_report.txt | CP-1 |

#### TL10.3 - Decision screen

| screen_item | assessment | evidence | credit_transmission | screening_implication | confidence | source_refs |
| --- | --- | --- | --- | --- | --- | --- |
| OVERALL | Financial change screen points to a full assessment | Invented annual report | Weaker earnings and tighter refinancing reduce headroom | Full assessment recommended | Provisional | harbourline_annual_report.txt |

#### TL10.4 - Gaps and upgrades

| topic_id | trigger | missing_inputs | decision_impact | required_source | target_full_module_id | expected_owned_object | blocking_for_full_decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EARNINGS_MARGIN_CHANGE | High materiality | Detailed forecast | Changes the credit view | Management accounts | CP-1 | Full module output | No |

#### TL20.1 - Source and scope gate

| subject_identity | source_ref | source_owner_module | as_of_or_period | scope_status | topics_supported | limitation |
| --- | --- | --- | --- | --- | --- | --- |
| Harbourline Synthetic Foods plc | harbourline_annual_report.txt | CP-2 | FY2024 | In scope | BUSINESS_DURABILITY; MARGIN_FCF_RESILIENCE; LEVERAGE_REFINANCING_CONTEXT; GOVERNANCE_SPONSOR_BEHAVIOR; FINANCIAL_POLICY_CAPITAL_ALLOCATION; ESG_TRANSITION | Invented data |

#### TL20.2 - Topic allocation

| topic_id | topic_label | source_owner_modules | materiality | evidence_status | disposition | priority_rank | summary | source_refs | upgrade_module_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUSINESS_DURABILITY | Business durability | CP-2; CP-2C; CP-2F | MEDIUM | DIRECT | SUMMARIZE | 1 | Demand is stable and the customer base is broad. | harbourline_annual_report.txt | CP-2 |
| MARGIN_FCF_RESILIENCE | Margin and free cash flow resilience | CP-2; CP-2C; CP-2F | HIGH | PARTIAL | DEEPEN | 2 | Free cash flow stays positive under a modest cost shock. | harbourline_annual_report.txt | CP-2 |
| LEVERAGE_REFINANCING_CONTEXT | Leverage and refinancing context | CP-2; CP-2C; CP-2F | HIGH | DIRECT | DEEPEN | 3 | Refinancing falls in a period of tighter lending. | harbourline_annual_report.txt | CP-2 |
| GOVERNANCE_SPONSOR_BEHAVIOR | Governance and sponsor behaviour | CP-2; CP-2C; CP-2F | LOW | DIRECT | SUMMARIZE | 4 | The owner has paid small dividends and no large distributions. | harbourline_annual_report.txt | CP-2 |
| FINANCIAL_POLICY_CAPITAL_ALLOCATION | Financial policy and capital allocation | CP-2; CP-2C; CP-2F | MEDIUM | PARTIAL | SUMMARIZE | 5 | Stated policy favours debt reduction over acquisitions. | harbourline_annual_report.txt | CP-2 |
| ESG_TRANSITION | Environmental and transition exposure | CP-2; CP-2C; CP-2F | LOW | LIMITED | SUMMARIZE | 6 | Transition cost is disclosed in general terms only. | harbourline_annual_report.txt | CP-2 |

#### TL20.3 - Decision screen

| screen_item | assessment | evidence | credit_transmission | screening_implication | confidence | source_refs |
| --- | --- | --- | --- | --- | --- | --- |
| OVERALL | Credit screen points to a full assessment | Invented annual report | Weaker earnings and tighter refinancing reduce headroom | Full assessment recommended | Provisional | harbourline_annual_report.txt |

#### TL20.4 - Gaps and upgrades

| topic_id | trigger | missing_inputs | decision_impact | required_source | target_full_module_id | expected_owned_object | blocking_for_full_decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MARGIN_FCF_RESILIENCE | High materiality | Detailed forecast | Changes the credit view | Management accounts | CP-2 | Full module output | No |

#### TL23.1 - Source and scope gate

| subject_identity | source_ref | source_owner_module | as_of_or_period | scope_status | topics_supported | limitation |
| --- | --- | --- | --- | --- | --- | --- |
| Harbourline Synthetic Foods plc | harbourline_annual_report.txt | CP-2D | FY2024 | In scope | ACCESSIBLE_LIQUIDITY_USES; WORKING_CAPITAL_CAPEX_CASH_BURN; RATES_HEDGES; FX_COMMODITY_INFLATION; BASE_DOWNSIDE_TRAJECTORY; BREAKPOINTS_REFINANCING | Invented data |

#### TL23.2 - Topic allocation

| topic_id | topic_label | source_owner_modules | materiality | evidence_status | disposition | priority_rank | summary | source_refs | upgrade_module_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACCESSIBLE_LIQUIDITY_USES | Accessible liquidity and uses | CP-2D; CP-2E; CP-2G | HIGH | DIRECT | DEEPEN | 1 | Accessible cash exceeds planned uses over the next year. | harbourline_annual_report.txt | CP-2D |
| WORKING_CAPITAL_CAPEX_CASH_BURN | Working capital, capex and cash burn | CP-2D; CP-2E; CP-2G | MEDIUM | PARTIAL | SUMMARIZE | 2 | Working capital swings are seasonal and capex is flexible. | harbourline_annual_report.txt | CP-2D |
| RATES_HEDGES | Rates and hedges | CP-2D; CP-2E; CP-2G | MEDIUM | DIRECT | SUMMARIZE | 3 | Most debt is fixed and a small floating part is hedged. | harbourline_annual_report.txt | CP-2D |
| FX_COMMODITY_INFLATION | Currency, commodity and inflation exposure | CP-2D; CP-2E; CP-2G | MEDIUM | PARTIAL | SUMMARIZE | 4 | Input costs are partly passed on to customers. | harbourline_annual_report.txt | CP-2D |
| BASE_DOWNSIDE_TRAJECTORY | Base and downside trajectory | CP-2D; CP-2E; CP-2G | HIGH | PARTIAL | DEEPEN | 5 | A downside case reduces cover but does not breach the covenant. | harbourline_annual_report.txt | CP-2D |
| BREAKPOINTS_REFINANCING | Breakpoints and refinancing | CP-2D; CP-2E; CP-2G | HIGH | DIRECT | DEEPEN | 6 | The tightest point is the refinancing of the main bond. | harbourline_annual_report.txt | CP-2D |

#### TL23.3 - Decision screen

| screen_item | assessment | evidence | credit_transmission | screening_implication | confidence | source_refs |
| --- | --- | --- | --- | --- | --- | --- |
| OVERALL | Liquidity and forward-risk screen points to a full assessment | Invented annual report | Weaker earnings and tighter refinancing reduce headroom | Full assessment recommended | Provisional | harbourline_annual_report.txt |

#### TL23.4 - Gaps and upgrades

| topic_id | trigger | missing_inputs | decision_impact | required_source | target_full_module_id | expected_owned_object | blocking_for_full_decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WORKING_CAPITAL_CAPEX_CASH_BURN | High materiality | Detailed forecast | Changes the credit view | Management accounts | CP-2D | Full module output | No |

#### TL30.1 - Source and scope gate

| subject_identity | source_ref | source_owner_module | as_of_or_period | scope_status | topics_supported | limitation |
| --- | --- | --- | --- | --- | --- | --- |
| Harbourline Synthetic Foods plc | harbourline_annual_report.txt | CP-3D | FY2024 | In scope | DATED_MARKET_SNAPSHOT; CURVE_COMPARABLE_COMPENSATION; LIQUIDITY_TECHNICALS; STRUCTURAL_RECOVERY_PROTECTION; DOWNSIDE_LME_EXPOSURE; INTEGRATED_SCREENING_POSTURE | Invented data |

#### TL30.2 - Topic allocation

| topic_id | topic_label | source_owner_modules | materiality | evidence_status | disposition | priority_rank | summary | source_refs | upgrade_module_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DATED_MARKET_SNAPSHOT | Dated market snapshot | CP-3D; CP-3A; CP-3 | MEDIUM | LIMITED | SUMMARIZE | 1 | Prices are dated and taken from one dealer quote. | harbourline_annual_report.txt | CP-3D |
| CURVE_COMPARABLE_COMPENSATION | Curve and comparable compensation | CP-3D; CP-3A; CP-3 | HIGH | PARTIAL | DEEPEN | 2 | The senior bond trades wide of two close comparables. | harbourline_annual_report.txt | CP-3D |
| LIQUIDITY_TECHNICALS | Trading liquidity and technicals | CP-3D; CP-3A; CP-3 | MEDIUM | DIRECT | SUMMARIZE | 3 | Issue size is small and trading is thin. | harbourline_annual_report.txt | CP-3D |
| STRUCTURAL_RECOVERY_PROTECTION | Structural recovery and protection | CP-3D; CP-3A; CP-3 | HIGH | DIRECT | DEEPEN | 4 | The senior bond ranks ahead of the junior notes. | harbourline_annual_report.txt | CP-3D |
| DOWNSIDE_LME_EXPOSURE | Downside and liability-management exposure | CP-3D; CP-3A; CP-3 | HIGH | PARTIAL | DEEPEN | 5 | Documents allow some debt to move ahead of this bond. | harbourline_annual_report.txt | CP-3D |
| INTEGRATED_SCREENING_POSTURE | Integrated screening posture | CP-3D; CP-3A; CP-3 | MEDIUM | PARTIAL | SUMMARIZE | 6 | Compensation looks fair for the risks found so far. | harbourline_annual_report.txt | CP-3D |

#### TL30.3 - Decision screen

| screen_item | assessment | evidence | credit_transmission | screening_implication | confidence | source_refs |
| --- | --- | --- | --- | --- | --- | --- |
| OVERALL | Security opportunity screen points to a full assessment | Invented annual report | Weaker earnings and tighter refinancing reduce headroom | Full assessment recommended | Provisional | harbourline_annual_report.txt |

#### TL30.4 - Gaps and upgrades

| topic_id | trigger | missing_inputs | decision_impact | required_source | target_full_module_id | expected_owned_object | blocking_for_full_decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CURVE_COMPARABLE_COMPENSATION | High materiality | Detailed forecast | Changes the credit view | Management accounts | CP-3D | Full module output | No |

#### TL40.1 - Source and scope gate

| subject_identity | source_ref | source_owner_module | as_of_or_period | scope_status | topics_supported | limitation |
| --- | --- | --- | --- | --- | --- | --- |
| Harbourline Synthetic Foods plc | harbourline_annual_report.txt | CP-4 | FY2024 | In scope | CONTROLLING_DOCUMENT_AVAILABILITY; PROTECTION_WEAKNESS_FLAGS; ENTITY_GUARANTEE_COLLATERAL; LEAKAGE_PRIMING_FLAGS; CAPACITY_AVAILABILITY; PRESSURE_POINT_UPGRADE_PRIORITY | Invented data |

#### TL40.2 - Topic allocation

| topic_id | topic_label | source_owner_modules | materiality | evidence_status | disposition | priority_rank | summary | source_refs | upgrade_module_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTROLLING_DOCUMENT_AVAILABILITY | Controlling document availability | CP-4; CP-4B; CP-4A | HIGH | PARTIAL | DEEPEN | 1 | The bond terms are available but the credit agreement is not. | harbourline_annual_report.txt | CP-4 |
| PROTECTION_WEAKNESS_FLAGS | Protection weakness flags | CP-4; CP-4B; CP-4A | HIGH | DIRECT | DEEPEN | 2 | Two protections look weak in the bond terms. | harbourline_annual_report.txt | CP-4 |
| ENTITY_GUARANTEE_COLLATERAL | Entities, guarantees and collateral | CP-4; CP-4B; CP-4A | MEDIUM | PARTIAL | SUMMARIZE | 3 | Guarantees cover most but not all operating entities. | harbourline_annual_report.txt | CP-4 |
| LEAKAGE_PRIMING_FLAGS | Leakage and priming flags | CP-4; CP-4B; CP-4A | HIGH | PARTIAL | DEEPEN | 4 | Terms permit some value to leave the group. | harbourline_annual_report.txt | CP-4 |
| CAPACITY_AVAILABILITY | Debt capacity and availability | CP-4; CP-4B; CP-4A | MEDIUM | DIRECT | SUMMARIZE | 5 | The remaining debt capacity is limited by the leverage test. | harbourline_annual_report.txt | CP-4 |
| PRESSURE_POINT_UPGRADE_PRIORITY | Pressure points and upgrade priority | CP-4; CP-4B; CP-4A | HIGH | DIRECT | DEEPEN | 6 | Document gaps are the first priority for the full assessment. | harbourline_annual_report.txt | CP-4 |

#### TL40.3 - Decision screen

| screen_item | assessment | evidence | credit_transmission | screening_implication | confidence | source_refs |
| --- | --- | --- | --- | --- | --- | --- |
| OVERALL | Creditor-document screen points to a full assessment | Invented annual report | Weaker earnings and tighter refinancing reduce headroom | Full assessment recommended | Provisional | harbourline_annual_report.txt |

#### TL40.4 - Gaps and upgrades

| topic_id | trigger | missing_inputs | decision_impact | required_source | target_full_module_id | expected_owned_object | blocking_for_full_decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PROTECTION_WEAKNESS_FLAGS | High materiality | Detailed forecast | Changes the credit view | Management accounts | CP-4 | Full module output | No |

## Sources

| Source | Document | Use |
| --- | --- | --- |
| harbourline_annual_report.txt | Invented annual report for FY2024 | All screens |
