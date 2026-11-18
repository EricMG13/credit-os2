# Independent modules may run in parallel

by: user
date: 2026-11-18

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line; paid execution still needs its own explicit action. No run has been made with this change, and
the build made no provider call.

Independent analytical modules of one run may be in flight at the same time (owner, 2026-11-18:
"Parallel modules permitted."). That sentence is the whole of the owner's ruling as this build
received it, relayed by the session coordinating the build. The scope below is what this build
gives the permission; each point is the build's choice, not the owner's.

## Scope this build gives it

- Opt-in. A run keeps one module at a time unless it is asked otherwise: `--parallel-modules N` on
  the launcher, or `CREDIT_OS_PARALLEL_MODULES=N` in the launching environment (the run start
  service passes no flag). `N` is 1 to 4; unset, it is 1, and a run behaves as it did before this
  change. `MODULE_WIDTH` and `MAX_MODULE_WIDTH` in `src/deploy_workflow/owners/cpos.py`.
- CP-OS stays the only orchestrator. Modules start in plan order, each once every producer it is
  sent is accepted and a slot is free, and they are accepted in plan order. A module's acceptance
  check reads every handoff the plan lists before it, as one at a time, so which handoffs are
  accepted and their bytes do not depend on which module finishes first. CP-8 still runs last.
- The cap is unchanged. One budget serves every module in flight; spend plus open holds never passes
  the run's pathway cap (`2026-11-15-pathway-tiers-and-caps.md`). A call that would pass it only
  because another module's hold is open waits for that call to settle; one that would pass it on
  settled spend is refused and the run stops as `capped`, as before.
- A plan with retained handoffs runs one at a time whatever is asked.

## Not yet run live

A width above 1 has not been run against a live provider. Not checked: two Copilot sessions of one
run on one seat and the seat's rate limits; a module's `write_handoff` result that waits, possibly
for minutes, until the modules before it are accepted (a handler the runtime drops ends as an
unknown charge, which stops the run); and the Windows runtime. The first live run at a width above
1 is a separately authorized paid run.

## Known differences from one at a time, at a width above 1

- A failure stops new starts at once: the failing module's thread reports it as soon as the
  reply is known bad, before it settles, logs or cleans up, and from that report nothing starts.
  A module after the failed one in the plan had already been started and may have been charged
  for the calls it made before the report. It asks whether it may go on immediately before each
  call and is refused once the report is made; a call that passed that last look before the
  report, or was already with the provider, cannot be recalled, and is settled when it returns.
  Measured on the synthetic case, in two runs of 80 failures each no call began after the report;
  2 and 6 calls began in the fraction of a millisecond between the provider's bad reply and the
  report. One at a time the module would not have started.
- Such a module is left stranded. It was halted with its request retained and no answer, so after
  the failed module alone is repaired the relaunch stops at it with `cpos_interrupted: response not
  retained for <module>`, where a one-at-a-time folder, in which it never started, goes on. Nothing
  is sent for it again and nothing is charged twice. Remedy: repair each module the launch names in
  turn exactly as the failed one is repaired (a changed instruction gives it a new request), or
  start a new run folder. It is not resumed automatically: the executor never sends again an
  exchange whose folder already exists, and that rule was left as it is.
- When a later module's call stops the run (an unknown charge or an overrun), an earlier module
  still in flight is refused its next call and is not accepted; one at a time it would have finished
  first. The run's recorded reason is the stop itself. On a relaunch that earlier module is stranded
  as above.
- When an observer stops the run for review, a module in flight may be accepted on the call it
  already has out and sends no other. If that call brought an accepted handoff the run resumes as
  one at a time; if the module needed another call it is stranded as above.
- An interrupt (Ctrl-C) halts every module in flight and waits for their threads to end, each at
  its next call or check or when the call it has out returns, before the launcher exits with the
  interrupt's status. A second interrupt ends that wait: the launcher exits at once and abandons
  the calls still out, whose holds stay open as after a kill, so the relaunch treats the folder as
  it treats a killed one (it stops on the open holds and the unanswered requests). One at a time
  the launcher exits at once.
  A terminated or killed process ends at once at any width.
- The event log, the call log and the library's copy of the call log are in the order things
  happened, so their line order differs between widths. The call log's contents are the same. The
  event log's are the same except two fields: each launch's `launch_started` states the width, and
  each `turn` event's `spent_usd` is the settled spend at that moment, which depends on which other
  module's call had settled by then.
