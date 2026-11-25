---
version: 1
slug: "web-src-pages-connected-startrun-tsx"
primary_target: "web/src/pages/connected/StartRun.tsx"
related_targets: []
---

# Start a run — surface brief

Confirmed by the owner, 2026-11-16. Source critique: `.impeccable/critique/2026-11-16T08-39-46Z__web-src-pages-connected-startrun-tsx.md`.

## Scope and mode

- Target: `web/src/pages/connected/StartRun.tsx`, production-ready, full flow, desktop and 390px.
- Visitor mode: Operate.
- Visual authority: the incumbent system (tokens, Untitled UI components, status badge sets). No new visual world.

## Job

A credit analyst prepares a run that can spend up to its pathway's cap (USD 15 to 40). They know credit, not JSON, module codes or launcher flags.

- Primary action: start a run knowing what it will and will not do.
- Success: before Submit the analyst can say what the run will refuse or limit, and why; no error is ever off-screen; exactly one act is called "Approve".
- Lead with: the service-written readiness reasons, the cap, the pathway's module set.

## Direction

- Four steps: Documents, Purpose, More context, Review and start. The former step 3 ("Confirm what was read") is dropped; what was read is shown once, at the top of the review.
- The review is a decision sheet with three blocks in order: what will run (issuer, as-of date, pathway, purpose, documents read, module count); limits as decisions; cost, the single approval, Submit.
- Focal moment: the limits block. One decision per shared cause, listing the modules affected.

## Interaction and layout

- Stepper: visited steps are clickable; forward only through the step's action. On mobile it reads "Step 2 of 4 · Purpose". Pass four steps through the shared stepper's `steps` prop.
- Each review block has its own Edit link to the step that owns it. Acceptances survive a re-review when the item's id and reason are unchanged.
- Limits: ordered will refuse, gap, limited, check, each with a status badge. A cause and the limits the service says follow from it (`inherited_from`) are one decision; causes with the same fix line and the same acceptance type merge (reason, module names without codes, one checkbox). Items needing no action collapse under a count.
- The page says what blocks Submit, for example "2 decisions left".
- Off the working page: module codes, run ids, launcher flags, "A-live", turns per module, the "Reviewed inputs" JSON. Model and effort show only at the Advanced level.
- Facilities, quotes, ratings and research questions are typed, repeatable rows with a one-line summary when collapsed. A facility's fields group as Identity, Pricing talk, Terms, Source. "At least one facility" shows as required as soon as New issue is chosen.
- Valuation, scenario assumptions and module options stay JSON, at the Advanced level only.
- Errors appear on their field, open its container, scroll and take focus, and clear when fixed; a summary sits beside the step action.
- Focus never falls to the page body after Inspect, Carry over or a failed review. Inspection results are announced.
- Readiness panel: sticky on desktop, a one-line summary above the action on narrow widths. Rows read as status, not pills: Documents inspected, Purpose chosen, Decisions made (n of m), Approved. Purpose reads as met once one is selected.
- Purpose step: the eight pathway cards stay, drawn as radios. Case kind and form level each get one line of help.
- When a prefill resets the as-of date to today, the page says so and shows the prior run's date.
- Mobile: Submit is full width and last.

## States and ranges

- Documents 1 to about 30; limit items 0 to about 15 (roughly 3 to 5 decisions); modules 5 to 15; facilities 0 to 10; quotes 0 to 10; ratings 0 to 6; research questions 0 to 10.
- States: documents empty, inspecting, unreadable, ignored; prefilled from a prior run and the prior-run error note; field-level validation error; zero limits; review stale ("review again"); submit uncertain ("retry is safe"); cap unavailable; synthetic versus paid; Basic, Standard, Advanced.

## Boundaries

- Untouched: the service API and summary shape; the digest-bound submit and the confirmation dialog, including its paid wording; the per-pathway cap, its shown-cap check and the review reset on a pathway change; what the Advanced level unlocks; upload mechanics; the private-case web-search disclosure; Run activity; the older static run pages under `web/src/pages/run/start`.
- Anti-goals: no limit is ever dropped (a grouped decision accepts every item id in it); no new approval semantics; no new dependencies; no backend ids on the working page.

## Constraints

- React 19, Tailwind 4, react-aria, installed Untitled UI components. Any added component comes from the owner's eight listed sources, read live first.
- `web/src/pages/connected/ConnectedApp.test.tsx` and `web/scripts/connected-proof.mjs` pinned five steps and the "Review inputs" and "Approve summary" buttons; they changed with PR A (EricMG13/credit-os2#6) and now pin four steps.
- A fidelity check is recorded in VERIFICATION.md.
- The single final approval is the approval the run-start ruling means: the digest is issued only at the final review.

## Rulings

1. "Reviewed inputs" JSON: removed from the page. Checked 2026-11-16: the run record keeps the inputs (`GET /api/runs/<id>/inputs`).
2. Service-written lines that carry codes or flags are cleaned on the page, not in Python. The rule sentence "Will refuse wording open until A-live." is tied to a frozen answer key and stays until the owner rules on it.
3. Acceptance persistence is keyed by item id plus reason text.
4. The confirmation dialog's title, text and action are untouched; its facts list now restates as-of date, documents read, modules, limits accepted, refusing modules and submitter from the review summary (owner, 2026-11-25: apply all fixes).
5. Implementation plan: `docs/superpowers/plans/2026-11-16-start-run-review-and-rows.md`.
