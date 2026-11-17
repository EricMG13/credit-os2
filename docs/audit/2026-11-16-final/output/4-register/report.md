# Stage 4: report

Run by the lead on `audit/final-coordination` over `main` at `2b881075`. Nothing outside `output/`
and the audit README's rulings table was changed. No paid call was made.

## Merged

- 376 findings from stage 2 (12 sections), 99 from stage 3 (6 journeys) and 7 carried from stage 0
  (`baseline-findings.jsonl`: the failed `test:file:gates` gate, the known-failures file name, the
  incomplete synthetic steps in `docs/react-workflow.md`, the 80-character root, the routes served
  but never called, the legacy pages, the Teams POST). 482 in all.
- The stage 0 carry-overs that a section or journey had already found were merged into that
  finding: the empty shipped `data.js` (S2-002), the TransDigm links (S6-008) and the inventory
  attribution (C5-032).
- 109 findings were merged into 63 others with the same cause, which leaves 373. A journey finding
  and a section finding with one cause are one finding; every original id is kept in `merged_ids`.

## Verified

Twelve fresh verifying agents (Sonnet), each with `verify/BRIEF.md`, ran the probe of every High
and Medium finding and read the code at the cited lines: 153 findings, 145 `confirmed`, 8 `not a
defect`, 0 `not reproduced`. The verdicts are in `verify/A.jsonl` to `verify/L.jsonl`.

- Not a defect: B0-007 (a synthetic service builds its scheduler without Teams settings, so it never
  posts; stage 0's note that `proof.serve` "does not clear" the variables is harmless), J3-002 (the
  proof harness refuses a run with a prior; the product launcher accepts one), J3-004, J3-006,
  J4-002, J4-004, J4-005 and J4-006 (each shows module-written content from the canned handoffs
  unchanged; delivery must not change or add to it).
- Probe signal: 59 probes exit non-zero while the defect is present; 92 print the defect and exit 0
  either way; 2 have no signal (B0-003, followed by hand; C5-011, whose probe failed for a missing
  folder and was checked by a code read). `tasks.md` tells each implementer which.
- Depth varied: batches F and H read the cited code for most but not every finding (F: S1-005,
  S1-006, S1-007, S2-003 and S2-008 rest on the probe output and the finding's cause line). Each
  repair writes a failing test first (stage 5), which checks the cause again.

## Re-graded

| Finding | From | To | Reason |
| :--- | :--- | :--- | :--- |
| C4-028 | Medium | High | A wrong figure: "3,75" is drawn as 375 beside 2.80 (R3: always repaired) |
| C3-020 (with C1-009, J4-007) | Low | Medium | A headline figure not supplied is dropped without a stated gap (D-14; AGENTS.md missing versus zero) |
| C1-027 | Info | Low | A money figure shown one cent low |
| S4-001, S1-007, S2-008, S4-002, S4-003, S5-009, S6-008, J6-007 | High or Medium | Low | Fixture content only (lead ruling L2 below) |
| J1-003, J2-009 | Medium | Low | The synthetic proof's documented limit; only the page's wording remains (J1-003). No resume by ruling OQ-06; only the wording remains (J2-009) |
| J3-004, J4-002, J4-004, J4-006 | Medium | Info or Low | Not a defect (verifier's grade) |

Kinds changed: C4-007, C4-026 and J5-004 to `ordinary` (lost data, hashes and URLs, and two
issuers merged under one ID are ordinary); J2-011 to `hostile-input` (two submissions from two tabs
0.2 s apart).

## Ruled

| Disposition | Findings |
| :--- | ---: |
| repair | 94 (4 High, 90 Medium), in 41 tasks and 3 groups (`tasks.md`, `groups.md`) |
| batch | 187 |
| sweep | 17 |
| parked | 25 (`parked.md`) |
| rejected | 49 |
| owner | 1 (B0-006, the legacy pages, left by the owner's ruling to the work-PC hand-over) |

Rejected: 8 not a defect (above); 28 closed by the owner's ruling R10 where it keeps the build and
amends the matrix or the design system (OQ-01, OQ-05, OQ-07, OQ-10, OQ-11, OQ-13); J6-009 under
OQ-01 (its one code gap is S6-007's repair); C5-032 (stage 0 inventory notes); B0-001 (the cloud
container's browser, baseline row 8b passes); B0-004 (a deliberate guard); J3-021, J4-012 and
J5-011 (limits of the synthetic proof's canned handoffs, not of the application).

## Lead rulings

- **L2. Fixture content.** The release ships `data.js` empty and nothing writes a populated one
  (S5-024). A defect that lives only in the hand-written `web/fixtures/*.json` is seen by no release
  user: it is graded Low and repaired in the fixture in the batch. A defect in page code that would
  misbehave with any data keeps its grade.
- **L3. Owner flags.** Where a finding's author set `owner_decision` but the change only adds or
  corrects and a ruling or matrix row gives the answer, the lead cleared the flag (C4-005, S3-012,
  C3-015, C3-027, C4-036, C4-019, C3-022, C3-020, C1-009, J5-005, J5-010).
- **R10.** The owner accepted the recommendation on each of OQ-01 to OQ-13 (`owner-decisions.md`).
- **R11.** Repairs run as a swarm of Sonnet workers at `xhigh` (the owner's "use repair swarm",
  read with R1).

## Harmony

`harmony.md` merges the 12 sections' `harmony.csv` files (1,283 rows) with each row's findings and
their disposition, and lists the matrix amendments that follow from R10.

Not verified: Changes with a real comparison (the synthetic proof refuses a second run of an issuer;
section and journey agents reached it only by rewriting service JSON in the browser); the regular
`python -m react_frontend` mode, a live run and the Teams path with its variables set (R4); Chrome
and Edge on Windows; the five F-batch findings named above beyond their probes; whether the
canned-handoff inconsistencies (J3-006, J4-002) also occur in real module output; C5-011's probe.
