# Stage 3: User journeys

One agent per journey, Sonnet at `xhigh` effort (ruling R1), after stage 2 has finished.
Journeys cross sections, so they find what a section agent cannot: conflicts between screens.
Read-only: an agent writes only under `output/3-journeys/<journey id>/`.

## Inputs

| Layer | File | Section | Why |
| :--- | :--- | :--- | :--- |
| L1 | `docs/audit/2026-11-16-final/README.md` | Scope, Rulings, Rules | Scope and rules |
| L1 | `docs/audit/2026-11-16-final/FINDINGS-SCHEMA.md` | all | How to write a finding |
| L3 | `PRODUCT.md` | all | The two people the journeys stand for |
| L3 | `docs/react-workflow.md` | Open the interface | The synthetic run, step by step |
| L3 | `apps/issuer-library/README.md` | the run start page | What the analyst is meant to be able to do |
| L4 | `output/1-rubrics/control-matrix.csv` | all | What the user may and may not decide |
| L4 | `output/2-sections/*/report.md` | `Not verified:` lines only | Gaps a journey can close |

## Journeys

Each agent uses its own service (`proof.serve` on its own port and folder) and behaves as the
named person would: it reads the screen, not the code, to decide what to do next. No paid run.
Every journey runs with all hosts but loopback blocked in the browser (ruling R8); a request to
another host, or anything that fails to draw without one, is a High finding.

| Id | Person | Journey |
| :--- | :--- | :--- |
| J1 | Analyst, first visit | Opens the app with no runs. Finds how to start. Uploads the synthetic filing and workbook, answers each step, reviews and approves the summary, cancels at the paid confirmation, then completes the synthetic confirmation. Watches progress to the end and opens the report. |
| J2 | Analyst, things go wrong | Uploads a wrong file type, an empty file and a duplicate. Goes back and changes the purpose after approving. Leaves mid-form and returns. Reloads during a run. Starts a second run while one is running. Looks for how to resume or retry a run that stopped. |
| J3 | Portfolio manager, reading | Opens a finished run without having seen the sources. Reads Overview for the verdict, follows one finding to its module, traces one figure to Evidence and returns to where they were, reads Forecast and the downside cases, then Changes. Notes every place they had to guess what something meant. |
| J4 | Credit committee member, challenging | Picks three figures and three claims and tries to verify each from the screen alone: source, period, unit, calculation, limitation. Downloads the original handoff and compares. Looks for contrary evidence and for what would change the view. |
| J5 | Reader, edge cases | A run with no earlier run (Changes has nothing to compare). A run where a module failed or returned a gap. Two issuers. A very long issuer name. A 390 px window. Keyboard only, start to finish. |
| J6 | Static library reader | Opens `web/dist/index.html` from disk with no service. Visits every library and model route from the home page by clicking only, then by typing addresses, then with Back and Forward. |

## Process

1. Follow the journey. At each step record: what the person wanted, what the screen offered,
   what they did, what happened, and how long it took to find the next step.
2. Write a finding wherever the person is blocked, misled, loses work, sees two screens disagree
   (a name, a figure, a status, a count), meets a dead end, or has to know something the screen
   never said.
3. Compare what the person was able to decide with the control matrix.
4. Save a probe (a Playwright script) for each High or Medium finding.

## Outputs

All under `docs/audit/2026-11-16-final/output/3-journeys/<journey id>/`.

| File | Contents |
| :--- | :--- |
| `journey.md` | The step-by-step record |
| `findings.jsonl` | One finding per line, per the schema |
| `probes/`, `evidence/` | As in stage 2 |
| `report.md` | Whether the journey could be completed, ending with `Not verified:` |

The work-PC journey (a clean Windows machine) cannot run in the cloud. It is covered by
`Run-React-Proof.cmd` on the work PC and by stage 7's prompt; write it under `Not verified:`.
