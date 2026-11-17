# J3 journey record: portfolio manager, reading a finished run

Started 2026-11-17 07:24 UTC. Service: `proof.serve` on port 8763, run root `/tmp/jr/j3`. Browser: Chromium headless shell build 1243, every host but loopback blocked (R8).

## Setup: produce a finished synthetic run (not part of the reader's journey)

- 07:25 Segment 1 (`/tmp/jr/j3-scratch/seg1.cjs`, helper `probes/_j3lib.cjs`): drove the analyst steps from `web/scripts/connected-proof.mjs` (Northbridge Synthetic Group, as of 2025-03-31, Full credit assessment, filing + portfolio workbook + credit agreement uploaded, agreement chosen as executed, Moody's B1 Negative rating entered, limits accepted, summary approved, Submit run, Start synthetic run). Run `20261117-072501-01` was published in about 3 s. Blocked requests 0, console errors 0, HTTP errors 0. The service was stopped and port 8763 answers nothing.
- 07:26 Note for the brief: `proof.serve` refuses a root that already holds files ("the synthetic proof requires an empty, separate run root", `proof/serve.py:17-18`), so a finished run cannot be reopened after the service stops. Every segment therefore empties `/tmp/jr/j3` (my own folder), starts the service and completes the analyst run again first (about 3 s) before the reader steps. The journey record below is of the reader steps; each segment's run id is named where it matters.

## The reader's steps (portfolio manager, has not read the sources)

All steps below were driven in the browser by Playwright on run `<id>` of a fresh service each time (the id changes per segment because the root is emptied; the content is the same canned handoffs). Screens quoted are what the person saw at 1440 x 900. Times are wall-clock from the script (page ready to next step).

### Step 1. Open the library and find the finished run (07:27)
- Wanted: find the issuer's latest report.
- Screen offered: Library home. One issuer card, "Northbridge Synthetic Group", "Full credit assessment · 2025-03-31", five headline figures, button "Open report", link "1 run", a prominent "Start a run" button. Left rail: two icon-only links (book, play-in-circle) with no visible words (their accessible names are "Library" and "Run").
- Did: clicked "Open report". Took under 2 s. The next step was obvious.
- Guess points: the left rail icons have no visible label (a book and a play button); "Cash $275m -$25m vs FY2023" carries no better/worse word while every other card does; "1 run" reads as a link but is not obviously "history".

### Step 2. Read Overview for the verdict (07:28)
- Screen offered: header with issuer, "As of 31 March 2025", "Full credit assessment", "Finished", "Synthetic test", a switch "Show sources", button "Run activity", "Business description not in this run", a Moody's B1 Negative box labelled "Entered at run start", then tabs Report / Overview / Changes / Modules 14 / Forecast / Evidence. Overview: dark "Bottom line" band, five figure cards, "Key findings", "Contrary evidence and what would change the view", "Bottom line by module" (13 modules, each "Delivered"), "Limitations" (one sentence per module, module name under it), "Dates to watch".
- Read: the bottom line is "The synthetic issuer shows one observed item." The key finding is "The synthetic issuer's cover is thin at 3.1x." The figure card beside it says "Interest coverage 4.00x +0.80x vs FY2023 better". Contrary evidence: "Nothing supplied contradicts the view; a USD 1,250 million refinancing would."
- Guess points (see findings): which "cover" is 3.1x when the card says interest coverage 4.00x and "better"; "Bottom line by module" lists 13 modules while the Modules tab counts 14 (Committee decision is absent from the list but present in Limitations); the limitations read "in the cp one a case" (module codes spelled out as words); "Dates to watch" rows are all "Synthetic note", with "Wall" and "· day" unexplained; the verdict a manager wants ("Final Sizing Posture: Requires More Work") is only on the Committee decision module page.
- "Show sources" switch: turning it on only draws a ring around each existing trace icon. It did not reveal any source text. The five figure cards have no trace icon with it on or off (clicking a card does nothing).

### Step 3. Follow one finding to its module (07:29)
- Wanted: see which module wrote "cover is thin at 3.1x" and read the context.
- Did: opened the trace drawer on the key finding. It reads "Key findings · Committee decision · Handoff line 32", "The statement", "How it was derived", "Basis annual.txt, page 2", "annual.txt p.2 · not in inventory", "the Basis file is not in the CP-0 inventory", buttons Close (twice) and "Open in Evidence". There is no link to the Committee decision module from the drawer or from the key-findings card; the person has to know to go to Modules and pick "Committee decision".
- Did instead: used "Bottom line by module", clicked "Financial foundation" (arrow link), landed on `#modules/CP-1`. Charts, a "Confidence score 89 High" with no scale, tables.

### Step 4. Trace one figure to Evidence and return (07:29)
- Did: scrolled to the "Leverage" chart (scroll position 854 px inside the main region), opened its trace icon. Drawer: "Chart data: leverage / Financial foundation · Handoff line 22 / The statement: Chart data: leverage / Basis Synthetic. / no page, the row cites no page or register" (twice). Clicked "Open in Evidence": Evidence opened on the Trace tab filtered to Financial foundation line 22, showing the table (FY2023 3.75 / 3.00, FY2024 2.80 / 2.25, unit x). 1.6 s.
- Returned with the browser's Back button (the Evidence page offers no "back to Financial foundation"). The module page came back at the top (scroll 0, the Leverage chart 1,122 px below the fold of a 900 px window), focus on the page body. The person has to scroll down and find the chart again.
