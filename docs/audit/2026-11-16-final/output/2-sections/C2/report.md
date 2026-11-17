# Stage 2 section audit: C2, Start a run

Files: `StartRun.tsx`, `web/src/pages/connected/start/`, and the shared `run/start/{Purpose,Start,Stepper}.tsx`. Routes: `/start` and `/start?from=<run>`. Service: `proof.serve --root /tmp/cs-C2/root --port 8732` (synthetic, USD 0.00). Browser: Playwright 1.62.1, headless-shell Chromium, every non-loopback host aborted (0 blocked, 0 failed requests, 0 page errors). The only Submit confirmed was the synthetic one (a finished run). Live wording was seen by rewriting the mode meta and cancelling.

The impeccable skill was not available; the rubric was applied rule by rule (ruling R7).

## Result

28 findings: 0 High, 8 Medium, 16 Low, 4 Info. No wrong figure, period, unit or source: the 8 caps, the module counts and the dates match the matrices and `/connected/context`. No request left loopback.

- C2-001 to C2-008 (Medium):
  - C2-001: at 390 px a space-free file or issuer name widens the review sheet and clips every Edit button and Submit.
  - C2-002: steps add no history entry, so Back, Reload or the Library link silently discard the draft.
  - C2-003: `?from=<run>` drops the agreement and workbook choices, and the review opens "Will refuse: Legal & covenants".
  - C2-004: when run options fail to load, the page shows raw service text with no action.
  - C2-005: "Carry over from latest run" leaves focus on the page body and announces nothing.
  - C2-006: failed Submit and refused requests show "Failed to fetch" or run-on lowercase fragments.
  - C2-007: the decisions that block Submit sit last, about 2,700 px down at 1440 px.
  - C2-008: abandoned drafts pile up in the service, and at 50 every new form is refused for up to 24 hours.
- C2-009 to C2-024 (Low): Standard run form level behaves like Basic; Leave out and Put back leave the sheet silently; document-refusal wording and capitalised file names; 50 MB hint not enforced at selection; duplicate files; Issuer ID rule unstated and Ø or non-Latin names mangled; Your name unmarked and checked late; 12 px text; the same icon on all 8 pathway cards; "I accept these 6 limits"; Add buttons disabled with no reason; "No documents yet." on from-run; raw "unknown run" for a bad from=; pathway change silently resets module choice; a garbled service sentence; a Submit reply without a run id goes to `/run/undefined`.
- C2-025 to C2-028 (Info): Teams help text, two unused `IntakeView` members, two misleading fail-open notes, stage 0 inventory gaps.

Checked and correct: focus return after the dialog (Escape, Cancel, Dismiss, outside click, via mouse, Enter and Space); Tab trap in the dialog; double Enter sends one request; arrow keys on the pathway radios; contrast at or above 4.5:1 on every text element; every input named; one `h1`.

## Coverage

213 inventory lines; every group operated for effect:

| Group | Lines |
| :--- | ---: |
| Text, date and number boxes (all filled; every value found in the request body, P16) | 51 |
| Selects | 23 |
| Details/summary | 20 |
| Step navigation | 16 |
| Checkboxes | 16 |
| File inputs and drop zone | 12 |
| Document buttons | 12 |
| Review Edit/Leave out | 12 |
| Limit and approval checkboxes | 10 |
| Pathway radios | 9 |
| Submit and dialog (15 open/close combinations; focus returned correctly in all) | 6 |
| Library link | 5 |
| Carry-over | 4 |
| Document Remove | 4 |
| Add row | 4 |
| Row Remove | 4 |
| Pin checkboxes | 4 |
| Problem button | 1 |

About 45 controls missing from the stage 0 inventory (valuation, peer, scenario fields, Ticker, Previous on steps 2 and 3, Put back) were added and checked (C2-028). State split of the inventory lines: partial 143, full 37, error 18, empty 15.

Screens and states reached:
- Every step at 1440 and 390 px, plus 600, 820 and 1100 px for the review sheet.
- Basic for all 8 pathways, Standard, Advanced with every details section open.
- Review undecided, approved, left out and passive item; the dialog (synthetic, and live wording in the browser only).
- `?from=` for a finished run and for unknown and malformed ids.
- Loading, error (4 shapes), partial (no caps), refused upload, 10 summary refusals and 5 Submit failures, reached by intercepting requests. No application code was edited.
- Long text: 200-character file name, 150-character issuer name, 400-character note.

## Harmony

48 matrix rows with section C2 (11 content, 37 control): 34 shown as required, 11 correctly not shown, 3 in the wrong place or form (CM-086, CT-002, CT-005), 0 missing; 10 unaccounted items. Figures cross-checked: 8 caps, 8 module counts, dates, turns, the "Compared with" row. Nothing on `retired.md` is offered; a scan of 28 screens found no module code.

## Design

Rules applied: D-01, 03, 17, 20, 22, 30 to 38, 41 to 43. D-33, 34, 36, 37 and 38 passed. D-41 passes on the spacing exception.

## Not reached

Live mode and any real Submit (R4); a `?from=` run of a retired pathway; Claude Opus (the proof service says it is unavailable); native validation bubbles (read from `validationMessage`); Chrome and Edge on the work PC.

Not verified: behaviour against a live service (including the SEC contact-string sentence, which appeared only because the variable is unset here, and the live default `case_kind`); Safari, Firefox, Edge and headed Chrome; screen-reader output (live regions were read from the DOM, not heard); real pointer drag-and-drop (the drop was a synthetic DataTransfer event); 50 or more documents and a file exactly at 50 MB; the Teams card path; the short-snapshot fallback of `?from=`; a second analyst using the same service at once (C2-008 was shown for one).
