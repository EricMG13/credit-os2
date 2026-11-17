# Run cards are posted to Microsoft Teams when the service is configured for it

by: user
date: 2026-11-16

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line. No provider was called and nothing was posted to Teams in making it.

Owner, 2026-11-16, in the session that built the sender: cards for run activity only (a run started,
its report is ready, it stopped before publishing, and a summary); the summary at 09:00, 13:00, 17:00
and 21:00 UK time on weekdays, skipped when quiet; every card links to the library; the analyst's
name is required as a first name and one or two initials ("Eric G"). Asked by the PR-manager session
"Is posting run cards to Teams wanted in this version?", the owner said: "Yes, open the PR".

## What is allowed

The run scheduler may post those four cards to one Teams Workflows webhook
(`src/deploy_workflow/inbox/teams.py`). It posts only when the launching environment sets both
`CREDIT_OS_TEAMS_WEBHOOK` and `CREDIT_OS_TEAMS_LINK`; with neither it posts nothing and makes no
request; with one the service refuses to start. The webhook is a secret: it is read from the
environment only, is never logged, stored or shown, and is not passed to launched runs.

## What leaves the machine, to Microsoft

The issuer's name, the pathway, the analyst's name, times, counts, the cap, the run ID and the
address in `CREDIT_OS_TEAMS_LINK` (both inside each card's links) and, for a finished run, the
report's lead bottom line exactly as its module wrote it, with whatever figures that sentence
holds. Nothing else: no document, source reference, file name, path, hash, reason text or spend.

## The audit's offline rule

`docs/audit/2026-11-16-final/README.md` ruling R8 says the application works entirely offline and
names a live model run as the one thing that leaves the machine. This sender is a second, recorded
exception, limited to the service process: the interface still loads nothing from another host, and
a service started without the two variables makes no outbound request. An audit run with the
variables unset should find no request to another host; one found with them set, to the configured
webhook only, is this exception and not a finding. That this is an exception to R8, and not a breach
of it, is the PR-manager session's reading of the owner's answer above.

## Known, not fixed here

- A run queued by the earlier release under a free-text analyst name, whose move into the run folder
  was cut short, is failed after the upgrade with the reason "the submitted documents changed before
  the run could start"; the documents had not changed (the stored name fails the new name rule).
- A webhook reply slower than 10 seconds is treated as failed and retried a minute later, so a card
  Teams accepted late can appear twice.
- A card's links work only for a reader who can reach `CREDIT_OS_TEAMS_LINK`.
- Nothing has been posted to a real Teams channel.
