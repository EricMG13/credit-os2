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

Signal is a shared feed of external research: stories, groups and topics, an issuer watchlist and digests. In live mode the application hosts it: the one `python -m react_frontend` command above answers Signal's requests under `/signal/api/` and runs Signal's background loop (fetching the sources the owner approved) on the same port, and the Signal screens are in the application's navigation. There is no second command and no second address. Signal is not hosted in the read-only preview or in synthetic mode, and there the application shows no Signal screen.

Signal makes no model call unless the owner has made a standing ruling for it (`docs/rulings/`), set a monthly cap (`signal ai cap`) and supplied the model adapter's key in the launching environment. The application's environment already carries that key for analysis runs, so the AI pass over new stories and the digest writer run in the hosted loop only when the launching environment also sets `CREDIT_OS_SIGNAL_AI=1` (exactly `1`). Without it the loop is given no key and the AI pass is off: the feed, groups and topics work, no story carries an AI line and digests are paused. Either way no model call is made when a page is read. The owner's `signal ai pass` command (one pass over the new stories) is unchanged and does not need the switch.

Signal also keeps an issuer watchlist (issuers tied to stories by name, alias and SEC filings) and writes one deterministic market backdrop post a day from FRED's public CSV. Both new sources are owner-approved on the command line, and filings are fetched only after the owner sets the contact the SEC requires (`signal filings contact`); see `docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md`.

The owner administers Signal from the command line with the other commands of `python -m deploy_workflow.signal --root /path/to/workflow-folder` (`users`, `sources`, `topics`, `ingest`, `stories`, `threads`, `comments`, `groups`, `digests`, `ai`, `issuers`, `filings`, `market`, `logos`; add `--help` for each). It has no `serve` command.

## Project references

- [`docs/react-workflow.md`](docs/react-workflow.md): connected application setup, proof workflows and release process
- [`docs/COPILOT.md`](docs/COPILOT.md): Copilot setup and environment requirements
- [`METHODOLOGY-REVIEW.md`](METHODOLOGY-REVIEW.md): method revision selection
- [`docs/QUALITY-GATE.md`](docs/QUALITY-GATE.md): changed-code gate and test schedule
- [`AGENTS.md`](AGENTS.md): project workflow and verification requirements

The legacy static Credit OS page assets remain under `apps/issuer-library/credit_os/` as a design and test reference. They are not part of the connected publication.
