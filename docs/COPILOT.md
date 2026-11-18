# Run Credit OS through GitHub Copilot CLI

Every live CP-OS call uses the local GitHub Copilot CLI runtime through the
pinned Copilot SDK. The deployment seat must enable the models and reasoning
efforts it offers. The connected app can browse reports and prepare runs
offline.

| Connected choice | CLI config | Runtime model |
| --- | --- | --- |
| GPT Sol, Fast or Balanced | `copilot-sol-medium` | `gpt-6.1-sol` |
| GPT Sol, High | `copilot-sol-high` | `gpt-6.1-sol` |
| Claude Opus, Fast or Balanced | `copilot-opus-medium` | `claude-opus-5.5` |
| Claude Opus, High | `copilot-opus-high` | `claude-opus-5.5` |
| GPT-6 Luna, Extra high | `copilot-luna-xhigh` | `gpt-6-luna` |

Balanced applies high on the selected modules in CP-OS's effort map. The
seat must advertise medium and high for that choice.

## Set up the deployment seat

Enable Copilot CLI and the desired models in the enterprise's Copilot policy.
Use the approved pinned SDK and local runtime. From the checkout:

```bash
uv sync --locked
uv run python -m copilot download-runtime
```

Set `COPILOT_CLI_PATH` to the installed runtime executable. Provide
`COPILOT_GITHUB_TOKEN` in the launching environment, or explicitly set
`COPILOT_USE_GH_LOGIN=1` and use the active `gh` account. A supplied Copilot
token takes priority. The run records the authentication mode.

To start the connected app with the choices the deployment seat advertises:

```bash
uv run --locked python -m react_frontend --root /path/to/workflow-folder --copilot-preflight
```

Preflight lists model capabilities. It creates no inference session and sends
no issuer material. If verification fails, the app can still open and prepare
runs. The runtime checks the selected model and effort again at dispatch.

## Launch and review

For a prepared run use the chosen model configuration and the pathway cap:

```bash
uv run python -m deploy_workflow.owners.cpos_launch --context ... --sources ... \
  --config copilot-luna-xhigh --cap 25 --out runs/example
```

A run keeps one module in flight at a time. `--parallel-modules N`, or
`CREDIT_OS_PARALLEL_MODULES=N` in the launching environment (the run start
service passes no flag), lets CP-OS keep up to `N` independent modules in flight
at once, `N` from 2 to 4 (`docs/rulings/2026-11-18-parallel-modules.md`). Modules
still start and are accepted in plan order, and the run's cap covers all of them:
a call that would pass the cap only because another module's hold is open waits
for that call to settle. The adapter serves every call from one loop thread and
gives each module its own runtime client and session, so a run at width `N` holds
up to `N` sessions on the seat.

A width above 1 has not been run against a live provider. Not checked: several
sessions of one run on one seat, the seat's rate limits, and a tool result that
waits for an earlier module (a handler the runtime drops ends as an unknown
charge, which stops the run). Leave the setting unset until a separately
authorized paid run has checked them.

At a width above 1 a stopped run can need more repair than one at a time. When a
module fails, a later module already in flight is halted with its request sent and
no answer kept. After the failed module is repaired, the relaunch stops with
`cpos_interrupted: response not retained for <module>` at each such module:
repair it the same way (a changed instruction gives it a new request) or start a
new run folder. Nothing is sent or charged twice. Ctrl-C at a width above 1 waits
for the calls already out to return before the launcher exits. A second Ctrl-C
exits at once and abandons those calls: their holds stay open, as after a kill,
and the relaunch stops on them as it does after a kill. The ruling lists every
known difference.

Add `--live --ruling docs/rulings/<file>.md` only for a separately authorized
paid CLI run. The ruling must name the configuration. In the connected app,
Submit on the approved summary authorizes the run at the displayed pathway
cap.

Finish or stop pre-cutover direct-provider jobs before upgrading. Review
any pending legacy approval again before starting a run on Copilot.
Historical recordings remain readable with their original model and provider.

## Search and charging

CP-DR can use the approved public lookup tools when the launcher offers them.
Native Copilot web search is unavailable pending deployment proof of the
search query and source records, usage accounting, and a spending bound for
automatic follow-up calls. The SDK's session limit is a soft limit.

Copilot charges are settled from runtime usage. Credit OS reserves for the
runtime's possible output, including reasoning. The adapter disables background
compaction and autonomous continuations, and checks the session context against
limits returned by the seat. Check the intended seat,
reported usage, and the Windows runtime under separate paid authorization.
