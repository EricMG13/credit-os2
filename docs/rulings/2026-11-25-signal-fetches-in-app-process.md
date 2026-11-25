# Signal's fetches of approved sources run in the application's process

by: user
date: 2026-11-25

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line. No provider was called and no live request to a feed, the SEC or FRED was made in making it.

Owner, 2026-11-25: asked what "one app" means, "One process. One start command and one port. The
main app hosts Signal's feed, groups and background fetch itself" (built in ericmg13/credit-os2#83).
Afterwards the owner was given a numbered list of what that change left open. Its item 2 included
whether the audit's offline rule needs a recorded exception, with the recommendation "write a
short ruling like the Teams one", and that the AI-pass ruling's wording was out of date. The owner
said: "your recommendation on 2".

## What is allowed

The application's process (`python -m react_frontend`, live mode) runs Signal's background loop,
which fetches over `https` from sources the owner has approved on the command line: news, regulator,
ratings and research feeds, SEC company filings once the owner has set the SEC contact, FRED's
public series for the market post once that source is approved, and each approved source's logo.
The fetch rules of `docs/superpowers/specs/2026-11-13-signal-design.md` section 5.3 are unchanged.

## What does not change

- Nothing is fetched until the owner approves a source. A new store has none.
- The read-only preview and a synthetic service host no Signal and fetch nothing.
- The interface still loads nothing from another host: the browser calls only the application.
- Signal's model calls are governed by `docs/rulings/2026-11-25-signal-ai-pass.md`, not by this
  record.

## The audit's offline rule

`docs/audit/2026-11-16-final/README.md` ruling R8 says the application works entirely offline, and
that audit left Signal out of scope as a separate service. This is a third recorded exception,
after CP-DR's lookups during a live run and the Teams run cards, limited to the service process
and to owner-approved sources. An audit run against a store with no approved source should find no
request to another host. One found to an approved source's host, to a host that source redirects
to under the fetch rules, or to the address a feed declares for its logo, is this exception and
not a finding. That this is an exception to R8, and not a breach of it, is the planning session's reading
of the owner's answer above.

## Known, not fixed here

- No live fetch has been made by the hosted loop: the first is unproven.
- Signal's log lines have no file and no timestamp in the application: errors reach only the
  terminal it was started from and information lines are dropped, although Signal's status says
  "see the log" (`docs/TODO.md`).
