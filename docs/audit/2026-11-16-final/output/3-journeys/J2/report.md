# J2 report: analyst, things go wrong

Run 2026-11-17 08:01 to 08:40 UTC on `proof.serve` (synthetic, port 8762), Chromium headless shell build 1243 at 1440 x 900, every host but loopback blocked (R8). No paid call (R4). Behaviour was judged from what the screen showed; code was read only to name a cause. Journey record: `journey.md`. Findings: `findings.jsonl` (16). Probes: `probes/` (each starts and stops its own service on port 8762 with a fresh root under `/tmp/jr/`).

## Could the journey be completed?

Yes for every step the brief names that has a screen, with two gaps: the analyst finds no way to resume or retry a run that stopped, and leaving the form part-way loses all of it.

| Step | Outcome |
| :--- | :--- |
| Wrong file type | Accepted into the list, then refused or ignored at Inspect. The analyst recovers by removing the file. The messages are raw, one file at a time, or give no reason (J2-003, J2-006). |
| Empty file | Refused at Inspect, cannot reach Submit. The message mangles the file name and guesses a scanned image (J2-007). |
| Duplicate | Same name: refused at Inspect without saying which file (J2-004). Same content under another name: accepted without a flag (J2-005); in the synthetic test any fourth file then fails the run with no reason (J2-014). |
| Change the purpose after approving | Works and keeps the analyst's answers; the approval and decisions are cleared without a word (J2-008). |
| Leave mid-form and return | Not recoverable: Back leaves the form, and every way back in opens a blank form (J2-001). The form also opens with an example issuer in required fields (J2-002). |
| Reload during a run | Works: the run page came back at once and the run finished. The synthetic run lasts about 4 s, so the window was narrow (0.3 s after the click). |
| Second run while one is running | Different issuer: both run side by side. Same issuer: both are accepted and finish as two indistinguishable library rows, each called the first run (J2-011); a fourth run waits with no reason (J2-015). The Start page does not say the issuer already has runs (J2-012). |
| Resume or retry a stopped run | No such control, as control-matrix CT-038 says; the only way on is "Start from this run", which is a new run and is not described as one (J2-009). The feed does not record the stop (J2-010). |
| A failed Submit | Retry is safe and starts one run, but the message is 2,900 px off screen (J2-013). |

## Findings by severity

| Severity | Count | Ids |
| :--- | :--- | :--- |
| High | 0 | none |
| Medium | 7 | J2-001, J2-002, J2-003, J2-009, J2-011, J2-013, J2-014 |
| Low | 9 | J2-004, J2-005, J2-006, J2-007, J2-008, J2-010, J2-012, J2-015, J2-016 |
| Info | 0 | none |

Network: 0 requests left the machine on any screen; every page drew; no page error in any segment. The only request failure was the connection I reset on purpose for J2-013.

## Where this journey meets other journeys' findings

- J3-002 (a second run on the same issuer started after the first finished fails at the launcher): J2-011 adds that two runs started together both succeed, so the result depends on timing; J2-014 adds the same launcher refusal for an extra document.
- J1-003 (pathways other than Full fail): the Lite run is what gave me a stopped run for J2-009 and J2-010.
- J1-015 ("Start from this run" opens with today's date and an empty name): cited in J2-009, not re-registered.
- J1-008 (Run activity lists only runs without a report), J1-005 (the analyst name is required but unmarked) and J1-019 and J3-022 (`proof.serve` refuses a root that holds files): met, not re-registered.

## Comparison with the control matrix

The analyst could decide what the matrix gives the user: the issuer, case date, documents, pathway, limits and approval, and Submit. They could not decide what the matrix reserves (cap, module order, model for Basic, queueing). No finding removes or changes a control; J2-009 and J2-011 name changes to what the analyst may do (a retry or resume control; blocking a second run) and leave them to the owner (R5). The one place the screen disagrees with the matrix is CT-006's "lists documents with those it ignored and why": the reasons are missing or raw (J2-003, J2-006).

Not verified: the regular (non-synthetic) service and any live run (R4); how a real PDF, Word file or large workbook is read or refused; a file over 50 MB or more than 500 files (an operating-system-limit rule forbade making them); a restart of the service during a run, or reopening an earlier run after a restart (`proof.serve` refuses a non-empty root); runs that end Capped, Rejected or Interrupted; the 30-runs-a-day wait and its wording; whether a live run reads a duplicate document twice; the paid Submit dialog; Back, reload and leave behaviour on the static app and on a narrow window; keyboard-only and screen-reader use of the errors found here; Chrome and Edge on Windows.
