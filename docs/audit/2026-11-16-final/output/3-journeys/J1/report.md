# J1 report: analyst, first visit

Date 2026-11-17. Service: `proof.serve` on port 8761, synthetic only (R4), Chromium headless shell 1243, every host but loopback blocked (R8). Record: `journey.md`. Findings: `findings.jsonl` (19: 1 High, 3 Medium, 14 Low, 1 Info).

## Could the journey be completed?

Yes, but not by the documented steps. Following `docs/react-workflow.md` exactly (filing and workbook, no agreement), the analyst reaches the review sheet, which says Legal & covenants "will refuse" and names the fix (add the executed agreement and choose it under Legal documents, or leave the module out). Accepting the limits and confirming gives a Failed run ("stopped: checker", 4 of 14 modules, no report; J1-002). The analyst then used "Start from this run", added `proof/northbridge-credit-agreement.txt`, chose it as the executed agreement, approved, cancelled once at the confirmation (it closed cleanly and started nothing), confirmed, watched the run finish (3 s, 14 of 14) and opened the report, which drew in full. Stage 0's finding that the documented route fails without the agreement is confirmed and not registered again; the screen did tell the analyst what to do, so no finding says it did not.

The screen's other route fails: "Leave out Legal & covenants" (and Advanced > Requested modules) can be approved and confirmed, then Submit is refused with "unknown module CP-MODEL" and no run starts (J1-001, High; the refusal is in the shared scheduler, so the regular mode is probably affected, not run under R4). Seven of eight pathways can be chosen, reviewed and submitted in the synthetic test and all fail with "launcher exited 2; see logs/<id>.log" (J1-003).

## Findings by severity

| Severity | Count | Ids |
| :--- | ---: | :--- |
| High | 1 | J1-001 |
| Medium | 3 | J1-002, J1-003, J1-004 |
| Low | 14 | J1-005 to J1-018 |
| Info | 1 | J1-019 |

R8: 0 blocked requests and nothing failed to draw on any screen in any segment.

Worked well: the first screen's single primary button; the stepper and Readiness card; field-level errors; limits that must be decided before approval; Cancel and Escape at the confirmation with focus returned; Back and "Start a run" again give a clean form; optional answers (facility, quote, rating, question, note) flow to the review sheet and the report with missing shown as "Not given"; ratings entered show "Entered at run start".

## Not verified

Not verified: the paid confirmation dialog ("Start a paid run?") and any paid run (R4; `proof.serve` shows only "Start a synthetic test?"); the regular `react_frontend` mode, including whether J1-001's refusal also stops a real submission; the native file chooser, folder upload and drag-and-drop (files were set on the input); progress over a run longer than 3 s, the 30 s refresh and any queue or cap state; report contents against their handoffs (J3 and J4), the Forecast and Evidence pages beyond that they draw, and whether "cover is thin at 3.1x" agrees with the 4.00x interest-coverage tile; Changes with an earlier run (the synthetic launcher refuses a second Full run on the same issuer); a 390 px window, keyboard-only use and long issuer names (J5); wrong file types, empty and duplicate files, reload during a run, leaving and returning mid-form (J2); Chrome and Edge on Windows and the work-PC journey (stage 7).
