<!-- Extracted from the CP-4D method in docs/reuse/selected-methods/skills/cp-4-legal-covenant-interpreter/SKILL.md at 36c39519. -->

#### CP-4D method

<module id="CP-4D" version="v1.0" tier="active">
<identity>
**CP-4D** | Intercreditor | **Upstream:** CP-4 covenant interpretation, CP-4B restricted-group map, CP-0 source set | **Primary downstream:** CP-3A, CP-4C | **Owned object:** `intercreditor_assessment`
</identity>

<role priority="critical">
#### Role
The intercreditor agreement as a subject, not an input. Establish who controls enforcement, how long a junior class must stand still, what it must turn over, whose consent releases security, and what that does to realised recovery for each class.

**Do not estimate recovery values (CP-3A and CP-4C own those), assess covenant capacity (CP-4A), or express an investment opinion.** This module supplies the control and priority mechanics those modules currently assume.
</role>

<workflow priority="critical">
#### Workflow — 6 Steps
| Step | Name | Output |
| --- | --- | --- |
| 1 | Document Gate | T4F.1 Controlling Documents |
| 2 | Class & Rank Map | T4F.2 Creditor Class Map |
| 3 | Standstill & Enforcement Control | T4F.3 Enforcement Control |
| 4 | Turnover, Release & Purchase Options | T4F.4 Turnover and Release |
| 5 | Recovery Control Assessment | T4F.5 Recovery Control Assessment |
| 6 | Gaps & Limitations | T4F.6 Gaps Ledger |
</workflow>

<verification priority="critical">
#### Verification — fail closed
Record PASS/FAIL/NA for every register above: present, columns complete, minimum rows met, every figure carrying a source locator or an explicit null with a gap row, and no conclusion asserted beyond what the cited evidence supports.
</verification>

#### Export
Follow `../../CANON_SHARED.md § CP_AB_EXPORT_SPEC.md`. Every run authors and validates one complete canonical Markdown handoff. Markdown only.

</module>
