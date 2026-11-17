# J2 journey record: analyst, things go wrong

Started 2026-11-17 08:01 UTC; the record was last written 08:36 UTC. Service: `proof.serve` on port 8762 (synthetic: canned handoffs, no provider call, no spend, R4). Browser: Chromium headless shell build 1243, 1440 x 900, every host but loopback blocked (R8). Segments were Node scripts that started the service in its own process group, drove the browser and killed the service in a `finally` block; port 8762 answered nothing between segments.

Roots: `proof.serve` refuses a root that already holds a file (J1-019, J3-022), so run state does not persist between service sessions. Every segment used a fresh empty root under `/tmp/jr/j2/<letter>`; where a segment needed a finished run it completed one first (about 4 s). The controller's correction of the brief says the same. Findings that other journeys already hold are cited, not re-registered: J3-002 (a second run on the same issuer started after the first finished fails at the launcher), J1-003 (pathways other than Full fail), J1-015 ("Start from this run" opens with today's date and an empty name), J1-008 (Run activity lists only runs without a report), J1-001 and J1-002.

R8 result for the whole journey: 0 blocked requests, 0 request failures other than the one I caused on purpose (step 9), 0 page errors, and every page drew. The only console errors were the 404 the service gave for the report of a run that was still going (J2-016) and the connection I reset on purpose (J2-013).

The person: an analyst who knows credit, not JSON or launcher flags (PRODUCT.md), who picks wrong files, goes back, leaves, reloads and hurries. The people read the screen; the code was read only afterwards to name a cause.

## Step 1. Find how to start (08:02)

- Wanted: begin a run for an issuer with no earlier runs.
- Screen offered: Library home with "No reports yet" and a blue "Start a run" button; the same link sits in the header of Run activity. One click opened `/start` ("Start a run", a "Synthetic test" chip, four steps: Documents, Purpose, More context, Review and start; a Readiness card with four "Not met" lines and "USD 0.00 of USD 25.00"). Found in under 2 s; the next step was obvious.
- First thing I noticed: before I typed anything, Issuer name already read "Northbridge Group", Issuer ID "northbridge-group" and As-of date today's date (J2-002).

## Step 2. Upload a wrong file type (08:02 to 08:04)

- Wanted: see what the page does when the wrong thing is picked. I picked `setup.exe` (16 bytes) and `photo.png` (2 KB of noise), and later a PDF that is really PNG bytes and a truncated workbook.
- Screen offered: a drop zone "Drop files here / Choose files" with "Add filings and other source documents. Up to 50 MB per file." Nothing says which types are read; the file input has no accept list.
- Did: chose `setup.exe`; the row appeared as "Selected". "Inspect documents". Result: red line "The uploaded documents: no readable issuer file" above the Documents heading; the row still "Selected"; Readiness "Documents inspected" still "Not met". It does not say what was wrong with the file or what to do.
- Did: added `photo.png` and inspected again: the same line.
- Did: put the two beside a good filing and a credit agreement. Now the page said "2 documents inspected, 2 ignored." and marked the rows "Ignored · Will not be read". So the same wrong file is described two ways and neither says why or which types are read (J2-006).
- Did: chose a PDF that is really a PNG, a truncated workbook and the good filing. Inspect gave one red line: "Cannot read fake.pdf: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte". No word about the workbook; every row, the good filing included, still "Selected". Removing the PDF and inspecting again then named the workbook the same way. The browser console logged "Launcher flag not shown to the analyst: --sources: …" four times (J2-003).
- Recovery: "Remove" beside each row worked at once (a DELETE to the service, 200). After the wrong files were removed the page said "3 documents inspected, 0 ignored." and Readiness "Documents inspected" turned "Met". Time to recover: about 20 s once I knew to remove files one by one.

## Step 3. Upload an empty file (08:03)

- Did: chose `empty.txt` (0 bytes) alone and inspected. Result: "Empty.txt has no extractable text (scanned image?)". The name is capitalised although I called it `empty.txt`, and a 0-byte file is not a scanned image (J2-007).
- "Continue to purpose" stayed enabled with only the empty file chosen; pressing it re-ran the inspection and showed the same message. It never advanced. Good: the empty file cannot reach Submit.

## Step 4. Upload a duplicate (08:03 to 08:05)

- Same name twice: choosing `northbridge-filing.txt` twice made two identical rows with two identical "Remove northbridge-filing.txt" buttons. Nothing happened until Inspect, which said "Choose documents with distinct file names." It does not say which file, and no row is marked (J2-004). Removing the last row cleared the message.
- Same bytes, other name (`copy-of-filing.txt`, and `northbridge-filing (1).txt`, the name a browser gives a second download): the page said "3 documents inspected, 0 ignored." / "4 documents inspected, 0 ignored.", listed both as "unrecognised", and the review sheet's "Documents read" listed both (J2-005).
- Then, to see how far the mistake travels: I approved a sheet with the fourth file and submitted. The run ended Failed, "launcher exited 2; see logs/<id>.log". The launcher's own log (my own root) said the synthetic proof accepts exactly one `northbridge-filing.txt` and at most the workbook and the agreement. A non-duplicate extra file (`other-note.txt`) failed the same way. So in the synthetic test any fourth file ends in a Failed run; nothing on the review sheet warned of it (J2-014; the same message family as J3-002).

## Step 5. Go back and change the purpose after approving (08:05 to 08:06)

- Wanted: after approving a Full credit assessment, switch to Lite.
- Did: completed all four steps for Full (three documents read, workbook and agreement chosen, a Moody's B1 rating added, the three "Limits to decide" ticked, "Approve" ticked). Readiness: all four "Met", "Decisions made 3 of 3". Then "Edit purpose and modules" on the review sheet. The Purpose step opened with Full still chosen; Readiness already read "Decisions made Not met", "Summary approved Not met".
- Chose Lite (the purpose cards are clicked on their label; the radio itself is hidden). The Readiness cap moved at once from USD 25.00 to USD 15.00. Continue to context: my note, the Moody's rating and the agreement choice were all kept. Review run: Pathway "Lite credit assessment", Modules (5), "Limits to decide 0 of 2 decided", approval unticked, "Submit run" disabled, "2 decisions left before you can approve."
- Result: correct and safe (CT-031: editing after approval invalidates it), and nothing lost that the analyst typed. But the sheet never says the approval and the three earlier decisions were cleared, or why; the analyst ticks again without knowing it was necessary (J2-008).
- Stepper trips: "Go back to Documents" from step 3 kept the files, the inspected state and the typed note; "Previous" is disabled on step 1.

## Step 6. Leave mid-form and return (08:15, repeated by probe)

- Wanted: leave for the Library and come back to finish.
- State when leaving: Documents step filled (issuer, date, name, three files uploaded and read), Full chosen, step 3 reached, a note typed, the workbook chosen.
- Browser Back: went to the Library home, not to step 2 (the four steps are one address, `/start`).
- What returned: Forward, the rail's Library link then "Start a run", a reload, a closed page reopened as a new tab, and a brand-new browser profile each opened Documents with an empty file list, the default issuer, and nothing saying a draft had existed. No "leave this page?" dialog appeared. Nothing is kept in local or session storage. The three uploaded files stay on the service unreferenced (seen on my own root's disk).
- After Submit, browser Back from the run page also opens a blank Start form (Forward returns to the run).
- Time lost: the whole form again, including choosing the files from disk (J2-001).
- "Carry over from latest run" sits under the form on the first visit. With no run it says "No earlier run was found for this issuer." With a finished run it copies the answers and says "Starting from run <id>. Review the copied answers, add dates, and inspect its available documents."

## Step 7. Reload during a run (08:16)

- The synthetic run is short: from the confirmation click to "Finished" took 4.6 s (the run page's own "Elapsed" said 4 s). A reload had to be pressed about 0.3 s after the click.
- Did: confirmed "Start synthetic run" (POST submit 200, `queued`), the page moved to `/run/<id>` and I reloaded at once. Screen: "Loading Credit OS…", then "Loading run activity…" (about 0.5 s), then the run page again at "Running", "0 of 14 modules", "Elapsed 1 s". It continued by itself to "14 of 14", "Finished", "Open report". Nothing was lost, no second run was started. Works as the analyst would hope.
- One odd moment: for about 2 s the header read "Running" with "14 of 14 modules" finished while the report was being delivered; the "Report" row then finished.

## Step 8. Start a second run while one is running (08:16 to 08:34)

- Different issuer, together: two tabs prepared to the "Start a synthetic test?" dialog (Northbridge Synthetic Group and Southbridge Synthetic Group), confirmed 0.2 s apart. Both run pages showed "Running" at the same time (0 of 14, then 14 of 14) and both finished with "Open report". Fine.
- Same issuer, together: two tabs prepared for Northbridge Synthetic Group, 2025-03-31, Full; both sheets were approved before either run existed, so neither could warn. Confirmed 0.2 s apart. Both started, both finished in about 4 s. Library home: one card "2 runs". Report history: two rows, both "Full credit assessment / As of 31 March 2025", no run id or time, only one with a "Finished" chip. Each run's Changes: "No earlier run to compare. This is the first listed run for this issuer on this pathway." The analyst has paid twice for the same slot and cannot tell the two apart (J2-011). Run started later, after the first finished, fails instead (J3-002), so the outcome depends on timing.
- While a run was running, the Start page (new tab, issuer typed) said nothing about it; only Run activity ("Running 1" and the run's row) did. After a run finished, typing the same issuer produced no notice either; the page asks the service about earlier runs only when "Carry over from latest run" is pressed (J2-012).
- Four runs together: four tabs confirmed within 0.6 s. Run activity read "Running 3, Waiting 1"; the fourth sat under "Waiting" (Issuer and Pathway only) and its own page said "Queued", "Elapsed n.a. not available", "No start time recorded"; it started when one of the three ended (about 5 s) and finished. Nothing says why it waits (J2-015).

## Step 9. A failed Submit (08:24)

- Did: dropped the connection to the service once during the Submit request, as a flaky network would. The confirmation dialog closed; focus went back to "Submit run"; nothing on the visible screen changed. The message "Failed to fetch Retrying Submit run is safe." is drawn at the top of the form, 2,912 px above the viewport. Pressing "Submit run" again worked and started exactly one run (J2-013).

## Step 10. Find how to resume or retry a run that stopped (08:18 to 08:32)

- Wanted: get a stopped run going again. The stopped runs I met: a Lite credit assessment (J1-003) and a second same-issuer run (J3-002).
- Screen offered: the run page shows a red "Failed" chip, the issuer, "Full/Lite credit assessment", "As of 2025-03-31", one header button "Start from this run", the line "launcher exited 2; see logs/<id>.log", "USD 0.00 of USD 15.00 cap usage", "0 of 5 modules", every module "Not run", and an Activity feed whose newest entry is "Running / Run / Run started." followed by "Queued / Ana L / Run registered." No word "retry", "resume", "try again" or "restart" anywhere. Run activity lists the run under "Ended without a report" with the same reason and a link back to the run.
- The log named on screen cannot be opened (`/logs/<id>.log` answers 404).
- Did: "Start from this run" opened `/start?from=<id>` with "Starting from run <id>. Review the copied answers, add dates, and inspect its available documents."; the issuer was filled, the date was today's, "Your name" empty and the file list empty until "Inspect documents" (J1-015). So the only way on is a new run; the stopped run stays Failed. The screen does not say whether anything done is reused, or that this begins a new run with its own cap (J2-009), and the Activity feed does not record that the run stopped (J2-010).
- Control matrix: CT-038 itself says there is no page control for resume; this journey confirms it. Not a defect to repair without the owner (R5).

## Step 11. Other things noticed

- Opening `/report/<id>` while the run is still going shows "Credit report / The published report could not be loaded." with no word that the run is still going (J2-016). The "Open report" link appears only once the report is published, so a person reaches this by a copied or bookmarked address.
- `proof.serve` cannot be restarted on a root that holds runs (J1-019). I could not test a service restart mid-run.
- A 50 MB file was not tried (limit 7 of the brief).

## Step 12. Two more impatient actions (08:38)

- Double-clicking "Start synthetic run" sent one submit request and started one run.
- After approval, "Edit issuer and documents" then removing the portfolio workbook: the approval was cleared, the Portfolio workbook choice on More context fell back to "None", and the review sheet read "Portfolio workbook: Not given" and listed two documents. The three limit decisions stayed ticked because the same three limits remained. Readiness on the Documents step read "Purpose chosen: Not met" although a purpose had been chosen; it turned "Met" again on walking forward. No finding: the data stayed consistent.

## Comparison with the control matrix (what the analyst could and could not decide)

| Row | What the analyst did | Result |
| :--- | :--- | :--- |
| CT-001, CT-002, CT-003 | Issuer name, ID and as-of date | The fields open pre-filled with an example issuer and today's date (J2-002). Typing a name changes the ID to its slug correctly. |
| CT-006 | Add, remove and carry documents | Add and remove work. The reading of wrong, empty and duplicate files is thin or raw (J2-003 to J2-007). Carry over works from the Documents step and "Start from this run". |
| CT-009 | Analyst name | Not asked to be typed first; Review run returns to step 1 when empty (J1-005). |
| CT-013, CT-012 | Switch Full to Lite after approving | Works; cap shown 15 after the switch. |
| CT-021 | Cap per run | Shown in Readiness and moves with the pathway. Not chosen by the user. Correct. |
| CT-030, CT-031 | Limits and approval | Cleared on edit as required; silently (J2-008). |
| CT-033 | Submit in a synthetic run | Works for the canned three files; any extra file fails the run (J2-014). |
| CT-035 | Queueing | Running 3 and Waiting 1 shown; no reason on the waiting row (J2-015). |
| CT-037 | Retry of a failed Submit request | Safe retry works, one run only; the message is off screen (J2-013). |
| CT-038 | Resume | No control, as the matrix says; "Start from this run" is a new run (J2-009). |

## What worked (no finding)

- Each wrong file could be removed one by one; the form recovered once they were gone.
- Changing the purpose after approval kept the analyst's typed answers and invalidated the approval.
- A reload during a run picked the run up again; nothing was duplicated.
- Runs for different issuers ran side by side; the three-at-once limit queued the fourth run and started it later.
- Retrying a failed Submit started exactly one run.
- Zero requests left the machine; zero fonts or icons failed.
