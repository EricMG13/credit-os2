# Findings schema

Every stage 2 and 3 agent writes its findings as JSON Lines, one finding per line, to the file
its brief names. Stage 4 merges them. Use exactly these fields.

| Field | Type | Meaning |
| :--- | :--- | :--- |
| `id` | string | `<section id>-<three digits>`, for example `C2-004`. Journeys use `J<n>-<digits>`. |
| `section` | string | A section id from `README.md`, or the journey id. |
| `surface` | string | `connected`, `static` or `both`. |
| `screen` | string | The address or screen name, and the state it was in (`loading`, `empty`, `error`, `partial`, `full`). |
| `check` | string | `wiring`, `design`, `state`, `harmony`, `journey`, `accessibility` or `code`. |
| `severity` | string | `High`, `Medium`, `Low` or `Info`. See below. |
| `kind` | string | `ordinary` or `hostile-input` (a hostile or unusual input no roadmap line names). |
| `title` | string | One sentence stating the defect. |
| `expected` | string | What should happen, and the source of that expectation (file and line, rubric rule id, or matrix row). |
| `actual` | string | What happened. |
| `evidence` | array of strings | Repository paths: screenshots, `file:line`, console or network captures. |
| `probe` | string | Path to the script or the exact command that reproduces it. Required for High and Medium. |
| `suggested_change` | string | The smallest change that would resolve it, or `none` when the right answer is the owner's. |
| `owner_decision` | boolean | `true` when resolving it would remove something the reader sees or change what the user controls. |

## Severity

| Severity | Use when |
| :--- | :--- |
| High | A wrong figure, period, unit or source; lost or corrupted data; a leaked secret or path; a request to any host but the local machine at run time (ruling R8); a control that does nothing or does the wrong thing on an ordinary path; a journey that cannot be completed. |
| Medium | The reader is misled or blocked but can recover; a missing state (loading, empty, error); a keyboard or focus failure; content that should be shown and is not, or shown and should not be. |
| Low | A polish defect that does not mislead: spacing, wording, inconsistency between two screens. |
| Info | An observation, a fragile assumption, or a measured cost for the sweep. |

## Rules

- One finding per defect. The same defect on several screens is one finding listing every screen.
- A finding without evidence is not written. A suspicion goes in the report's `Not verified:` line.
- Do not write a finding about Signal. If shared code misbehaves only in Signal, write it as
  `Info` with `section` set to `X1`.
- The probe is saved under `output/<stage>/probes/` and must run from the repository root.
- A probe that needs the service starts it on its own port and stops it when done.
