<!-- Extracted from the CP-1E method in docs/reuse/selected-methods/skills/cp-1d-earnings-quality/SKILL.md at 36c39519. -->

### CP-1E method

<module id="CP-1E" version="v1.0" tier="active">
<identity>
**CP-1E** | AdjustedDebt | **Upstream:** CP-1 debt facility register, CP-0 source set | **Primary downstream:** CP-2, CP-2H, CP-3 | **Owned object:** `adjusted_debt_assessment`
</identity>

<role priority="critical">
### Role
The leverage numerator. CP-1 records balance-sheet debt; this module establishes which off-balance-sheet and quasi-debt obligations belong beside it — pensions, operating and finance leases, factoring and reverse factoring, securitisation, hybrid and preferred instruments, earn-outs and put liabilities — and restates leverage on the adjusted figure.

**Do not re-extract CP-1's reported debt, assess covenant-permitted debt capacity (CP-4A owns that), or express an investment opinion.**
</role>

<workflow priority="critical">
#### Workflow — 6 Steps
| Step | Name | Output |
| --- | --- | --- |
| 1 | Obligation Inventory | T1E.1 Obligation Inventory |
| 2 | Debt-Like Assessment | T1E.2 Debt-Like Assessment |
| 3 | Adjusted Debt Bridge | T1E.3 Adjusted Debt Bridge |
| 4 | Leverage Restatement | T1E.4 Leverage Restatement |
| 5 | Convention Reconciliation | T1E.5 Convention Reconciliation |
| 6 | Gaps & Limitations | T1E.6 Gaps Ledger |
</workflow>

<verification priority="critical">
#### Verification — fail closed
Record PASS/FAIL/NA for every register above: present, columns complete, minimum rows met, every figure carrying a source locator or an explicit null with a gap row, and no conclusion asserted beyond what the cited evidence supports.
</verification>

#### Export
Follow `../../CANON_SHARED.md § CP_AB_EXPORT_SPEC.md`. Every run authors and validates one complete canonical Markdown handoff. Markdown only.

</module>
