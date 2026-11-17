# J6 journey record: static library reader (opens web/dist/index.html from disk, no service)

Started 2026-11-17 08:04 UTC. No service was started. Browser: Chromium headless shell build 1243 (`chrome-headless-shell`), viewport 1440 x 900 unless stated, every host but file:, data:, blob: and loopback blocked in the browser (R8); a blocked request is logged and aborted. Scratch (not committed): `/tmp/jr/j6-scratch/`.

Two data variants, kept apart:
- **shipped**: `file:///home/user/credit-os2/web/dist/index.html` exactly as built (`web/dist/data.js` holds `issuers: []` and no slices; stage 0 already carries this to stage 4).
- **fixture**: a copy of `web/dist` in `/tmp/jr/j6-scratch/dist-fixture/` whose `data.js` was written by `web/scripts/fixture-data.mjs` from `web/fixtures/{library,model,run,signal}.json` (the data the repository's from-disk checks use). Findings from it say "fixture" in `screen`. It is synthetic data (Halden Aerostructures and others), not an issuer run.

Person: the static library reader, a portfolio manager or committee member who was handed the folder and double-clicked `index.html`. Reads the screen, not the code, to decide what to do.

## Step 1. Open the shipped build from disk (08:05)
- Wanted: see what this library holds. Opened `file:///home/user/credit-os2/web/dist/index.html` (shipped data). Drew in under a second. Requests: 7 (index.html, one script, one stylesheet, `data.js`, `symbol.svg`, two fonts), all `file:`; blocked 0, console messages 0, page errors 0.
- Screen offered: heading "Library", the sentence "This data file holds no library pages", a left rail of five icon-only links (accessible names Library, Model, Run, Signal, Kit) with no visible words and no other control. Nothing says what to do next, who supplies a data file, or where one goes.
- Did: clicked each rail icon in turn. Model: "Financial models / No model has been delivered yet". Run: "Run activity / No run data in this library". Signal: "No Signal data in this library" (out of scope, not audited). Kit: a "Component kit" page of every button, badge and table style, which draws fully and is the only populated screen of the shipped build. Library again: same empty line.
- Guess points: the empty line speaks of "this data file" (the reader never saw a data file); "No model has been delivered yet" reads as if a delivery is pending, while the Library line says the file is empty. Three screens, three wordings of the same fact. The rail icons are the only way to move and carry no text.
- Time to the end of the reachable shipped content: under a minute. There is nothing to read.
- Side effect seen after leaving Kit: a stray element holding the text "FY21" stays in the page (off-screen at y = -20000, still "visible" to assistive technology) on every later page.

## Step 2. Typed addresses on the shipped build (08:12)
- Typed 47 addresses (every route pattern in `web/src/pages/route-table.ts` with made-up ids, bare group addresses, trailing slash, case change, bad escape, query string, empty segment, legacy `#W-...` links), each as a fresh load and again as a change of the hash in the open page. 0 blocked requests, 0 console messages, 0 errors, and both modes agree on every address.
- Library routes with a made-up issuer draw their page title and "This data file holds no library pages". Model routes draw "Financial model / Not found for this run". `#/run/start/<draft>` draws "Start a run / No run data in this library". Unknown or malformed addresses (wrong case, `?x=1`, `//`, `%E0%A4%A`, `#/W-Overview`) draw "Page not found / No page has this address" with no link out of it (the rail is the only way back).
- Every page title (the tab text and the history entry) is "Credit OS".

