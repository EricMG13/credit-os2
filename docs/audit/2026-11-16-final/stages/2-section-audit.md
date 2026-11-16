# Stage 2: Section audit

One agent per row of `output/0-baseline/sections.md`, Sonnet at `xhigh` effort (ruling R1). The
coordinator gives each agent this brief and one section id. Read-only: an agent writes only under
`output/2-sections/<section id>/`. At most four agents drive a browser at once.

## Inputs

| Layer | File | Section | Why |
| :--- | :--- | :--- | :--- |
| L1 | `docs/audit/2026-11-16-final/README.md` | Scope, Rulings, Rules | Scope and rules |
| L1 | `docs/audit/2026-11-16-final/FINDINGS-SCHEMA.md` | all | How to write a finding |
| L4 | `output/0-baseline/sections.md` | your row | Your files and routes |
| L4 | `output/0-baseline/clickables.jsonl` | lines with your section id | The controls to check |
| L4 | `output/0-baseline/screens.md` | your screens | Baseline screenshots |
| L4 | `output/0-baseline/offline.md` | your screens | Requests to other hosts already seen |
| L4 | `output/0-baseline/api-map.md` | calls your section makes | The service behind your screens |
| L4 | `output/1-rubrics/design-rubric.md` | all | The design answer key |
| L4 | `output/1-rubrics/content-matrix.csv`, `control-matrix.csv`, `retired.md` | rows with your section id | The harmony answer key |
| L3 | `docs/react-workflow.md` | Open the interface | How to serve the app |
| L3 | The source files in your row | all | The code behind the screens |

## Process

Start your own service: `PYTHONPATH=src uv run --locked python -m proof.serve --root <your own
new empty folder> --port <a port only you use>`, and complete one synthetic run if your screens
need a report. Static sections open the built `web/dist/index.html`. Stop the service when done.
Section X1 has no screens of its own: it reads the component code and the kit page, and does
checks 2 and 5 only.

1. **Wiring.** For every control in your inventory lines:
   - operate it with the mouse and with the keyboard alone (Tab, Shift+Tab, Enter, Space, Escape,
     arrow keys where the role calls for them);
   - state the effect the code and the screen imply, then check that effect happened: the
     address, the content, the request sent, the state after reload;
   - check its disabled, loading and error states, and that focus goes somewhere sensible
     (back to the opener when a drawer or dialog closes);
   - for a link or address, open it directly in a new page and use Back and Forward;
   - record console errors and failed or unexpected network requests while you do it.
   A control missing from the inventory is itself a finding against stage 0; add it and check it.
2. **Design critique.** If the impeccable skill is available, run its critique on each screen
   with the rubric as the standard. If not, apply the rubric rule by rule to each screenshot and
   to the component code. Cite the rule id (`D-nn`) in each finding. Honour the exceptions in
   `.impeccable/config.json`. Judge at 1440 px and 390 px.
3. **States.** For each screen: loading, empty, error, partial data, a value that is missing as
   distinct from zero, very long text, and a narrow window. Reach each state through the fixture,
   the synthetic service, or a request intercepted in the browser; do not edit application code.
4. **Harmony.** For each content-matrix row with your section id, find it on screen and mark it
   `shown as required`, `shown but wrong place or form`, `missing`, or `correctly not shown`.
   Then the reverse: list anything your screens show that no matrix row accounts for. For each
   control-matrix row, check the user can decide exactly what the row says, and nothing else.
   Check nothing on `retired.md` is still offered. Check a figure's value, period, unit and
   currency on screen against the handoff it came from (`proof/handoffs/` or the fixture) for at
   least five figures per screen that shows figures; a mismatch is High.
5. **Code read.** In your files: handlers that do nothing, state that is set and never read,
   props that are passed and unused, branches no input reaches, duplicated blocks, and any
   catch-all that hides a failure. These are `check: code`; measured costs are `Info` for stage 6.

Run every check with all hosts but loopback blocked in the browser (ruling R8). A request your
screens attempt to another host is a High finding, and so is anything that then fails to draw:
a font, an icon, a chart, a map. Start from the lines of `output/0-baseline/offline.md` that
name your screens.

Do not fix anything. Do not write a finding about Signal.

## Outputs

All under `docs/audit/2026-11-16-final/output/2-sections/<section id>/`.

| File | Contents |
| :--- | :--- |
| `findings.jsonl` | One finding per line, per the schema |
| `harmony.csv` | Every matrix row with your section id and its mark, plus the unaccounted items |
| `probes/` | One script or command file per High or Medium finding |
| `evidence/` | Only the screenshots and captures a finding cites |
| `report.md` | Screens and controls covered (counts against the inventory), what was not reached and why, ending with `Not verified:` |

Return the paths of these files, not their content.
