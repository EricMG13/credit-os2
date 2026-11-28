# Issuer library publication

The active reader is the connected React application described in [Run Credit OS 2](../../docs/react-workflow.md). CP-OS publishes completed runs to the shared workspace; the React server reads the publication and serves the library, run activity, and connected reports over localhost.

## Publisher

`update_library.py` validates completed CP-OS runs and atomically replaces `<workspace>/library/` with:

- `data.js`, containing the catalogue, run store, activity and trace data;
- `downloads/<run>/`, containing the original handoffs and instructions copied byte for byte only after their recorded SHA-256 values are checked, plus `handoffs.zip`.

Every publication reads every file and checks every recorded hash again. Within one process (the scheduler publishes at each run end), what was parsed from bytes with a given SHA-256 is kept in memory and reused, at most 256 MiB, least recently used dropped first (`deploy_workflow.derived`); the published files are the same bytes either way.

The publisher does not create an HTML page or copy a delivered report. It never changes run folders, performs analysis, or calls a provider. Its staging and swap preserve the previous publication if building the next one fails.

CP-OS invokes the publication step after a run completes. For an existing workspace, it can also be run directly:

```sh
uv run python apps/issuer-library/update_library.py --workspace <folder>
```

## Windows runtime package

The retired static HTML/JS frontend (`credit_os/web/`) has been removed; the connected React application under `web/` is the sole frontend.

The legacy Windows runtime package is separate from the connected React application. Use `Run workflow.cmd` to prepare a run offline. The package has no Signal entry point: the application hosts Signal in live mode (see the root README). Live Copilot runs use the connected package or the full CP-OS checkout. Build the embedded package with:

```sh
python apps/issuer-library/packaging/build.py
```

`Smoke-test.ps1` checks the bundled Python, an offline run review, and a publication in a temporary workspace. It makes no provider call. The React release package is built separately with `tools/package_react_windows.py`.
