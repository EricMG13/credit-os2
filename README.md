# Credit OS 2

Credit OS 2 runs CP-OS with a connected React application for run intake, activity, the issuer library and reports. The browser application uses the local workflow workspace and serves its pages over localhost.

## Set up

Install Python 3.13, uv 0.12.5 and Node.js 24. From a checkout:

```sh
uv sync --locked
npm --prefix web ci
npm --prefix web run build
```

A release ZIP includes the compiled React assets. Setup, live and synthetic workflows, and the Windows browser proof are documented in [`docs/react-workflow.md`](docs/react-workflow.md).

## Start the connected application

```sh
uv run --locked python -m react_frontend --root /path/to/workflow-folder
```

Open the loopback address printed by the command. The application can read issuer files, prepare a run and review its summary offline. `--copilot-preflight` checks the launching seat and makes paid Submit available only for the model and effort choices that the seat advertises. The analyst reviews and explicitly approves the summary before submitting a paid run. Provider keys and runtime settings come from the launching environment.

CP-OS publishes completed runs to `_engine/library/data.js` and checked handoff downloads. The publisher verifies the recorded SHA-256 values, stages a new publication beside the current one, and swaps it into place only after it builds successfully. It writes no HTML page or separate report and does not change run folders. The React application serves the connected publication. More detail is in [`apps/issuer-library/README.md`](apps/issuer-library/README.md).

Excel workbooks are analysis inputs only; they are not deliverables.

## Signal

Signal is a shared feed of external research: stories, groups and topics, an issuer watchlist and digests. It starts with the application: the one command above serves the Signal screens, which appear in the application's navigation, and fetches the sources the owner approved in the background. There is no second command and no second port. Signal is available in live mode only; the read-only preview and synthetic mode show no Signal screen.

Signal's AI lines and digests are off unless the application is started with `CREDIT_OS_SIGNAL_AI=1` in its environment, for example `CREDIT_OS_SIGNAL_AI=1 uv run --locked python -m react_frontend --root /path/to/workflow-folder`. Only the value `1` turns them on. They also need a standing owner ruling (`docs/rulings/`), a monthly cap (`signal ai cap`) and the provider key and runtime settings that analysis runs already use. The variable exists because those are already in the application's environment for analysis runs: without it, Signal would start spending as soon as the ruling and the cap were in place. With it set, Signal writes an AI line for new stories and writes digests in the background. Without it, the feed, groups and topics still work, no story shows an AI line and digests are paused. Opening a page never calls the model. The owner's `signal ai pass` command runs one pass over the new stories by hand and does not need the variable, but the lines it writes are shown only while the application was started with it.

Signal also keeps an issuer watchlist (issuers tied to stories by name, alias and SEC filings) and writes one deterministic market backdrop post a day from FRED's public CSV. Both new sources are owner-approved on the command line, and filings are fetched only after the owner sets the contact the SEC requires (`signal filings contact`); see `docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md`.

The owner administers Signal from the command line with the other commands of `python -m deploy_workflow.signal --root /path/to/workflow-folder` (`users`, `sources`, `topics`, `ingest`, `stories`, `threads`, `comments`, `groups`, `digests`, `ai`, `issuers`, `filings`, `market`, `logos`; add `--help` for each). It has no `serve` command.

## Project references

- [`docs/react-workflow.md`](docs/react-workflow.md): connected application setup, proof workflows and release process
- [`docs/COPILOT.md`](docs/COPILOT.md): Copilot setup and environment requirements
- [`METHODOLOGY-REVIEW.md`](METHODOLOGY-REVIEW.md): method revision selection
- [`docs/QUALITY-GATE.md`](docs/QUALITY-GATE.md): changed-code gate and test schedule
- [`AGENTS.md`](AGENTS.md): project workflow and verification requirements

The legacy static Credit OS page assets remain under `apps/issuer-library/credit_os/` as a design and test reference. They are not part of the connected publication.
