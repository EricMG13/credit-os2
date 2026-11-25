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

Signal is a separate feed service. It is an API and an ingest loop; it serves no page. It makes no model call unless the owner has made a standing ruling for it (`docs/rulings/`), set a monthly cap (`signal ai cap`) and supplied the model adapter's key in the launching environment; only then do the AI pass over new stories and the digest writer call the provider, and only from the service's background loop and the owner's `signal ai pass` command (one pass over the new stories), never when a page is read. Without all three the feed, groups and topics work, no story carries an AI line and digests are paused.

```sh
uv run python -m deploy_workflow.signal --root /path/to/workflow-folder serve --host 127.0.0.1 --port 8766
```

The Signal screens are in the React application. Start `react_frontend` with `--signal-url http://<address>:8766/` (the address and port at which Signal is served) to show them: the application adds Signal to its navigation and passes the screens' requests to the service. Without `--signal-url` no Signal screen is shown. The `Start signal.cmd` entry point in the retained Windows runtime package starts the same service.

## Project references

- [`docs/react-workflow.md`](docs/react-workflow.md): connected application setup, proof workflows and release process
- [`docs/COPILOT.md`](docs/COPILOT.md): Copilot setup and environment requirements
- [`METHODOLOGY-REVIEW.md`](METHODOLOGY-REVIEW.md): method revision selection
- [`docs/QUALITY-GATE.md`](docs/QUALITY-GATE.md): changed-code gate and test schedule
- [`AGENTS.md`](AGENTS.md): project workflow and verification requirements

The legacy static Credit OS page assets remain under `apps/issuer-library/credit_os/` as a design and test reference. They are not part of the connected publication.
