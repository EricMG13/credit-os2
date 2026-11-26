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

In a run, a reader run and an instruction trial, GPT Sol and GPT-6 Luna sessions
open on the seat's long-context tier where the seat lists one. The hold caps a
request at about 3.1 MB (about 815,000 estimated tokens), or the seat's long
budget where that is smaller. Signal stays on the default tier. Claude Opus stays on its
default tier until Copilot's Opus long-tier rates are in the pricing table.
A session is pinned only when the seat's long
budget is at most 1,050,000 tokens and its listed long-tier prices are no dearer than
the rates the hold is priced at; otherwise it opens on the default tier. On the long tier, modules read sources until
a request is 991,808 bytes short of that cap: about 2.1 MB (about 557,000 estimated tokens) when
the seat's long budget is 815,000 tokens or more, less on a smaller budget, and never less than
the default tier's 1.1 MB. On the default tier reads stop at half of what the session's
guard admits, at most 1.1 MB (about 271,000 bytes for GPT Sol's 272,000 tokens). The rest is room for drafts and repairs; above 272,000 tokens calls
may bill at long-context rates. Each
prompt is checked against the tier's limit before it is sent. Copilot may bill
the long tier at long-context rates.

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
still start and are accepted in plan order. Before starting a second or later
module, CP-OS checks whether the remaining budget covers every permitted turn
and attempt of all modules that would be in flight, including hosted search
fees when offered. If the bound exceeds the available budget, CP-OS waits and
runs one module at a time as needed. A module running alone still reserves one
call at a time. Copilot Opus runs serially because its call hold depends on
request size. At the launcher's default 32 turns, Copilot Sol also runs serially
within the pathway caps. The adapter serves every call from one loop thread and
gives each module its own runtime client and session. Width `N` permits up to
`N` active module exchanges. A completed module's session can remain open while
its context is being compacted or its runtime is shutting down in the background.

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
new run folder. Nothing is sent or charged twice.

At a width above 1, Ctrl-C stops new work and waits for the active module
workers to finish. A second Ctrl-C ends that wait. A paid Copilot launch still
runs its bounded adapter shutdown. An outstanding call can settle during
shutdown or leave an open hold. On relaunch, CP-OS reads the saved reservation
and settlement records and stops on any open hold or unanswered request.

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
