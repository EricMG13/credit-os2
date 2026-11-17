# J6 journey record: static library reader (opens web/dist/index.html from disk, no service)

Started 2026-11-17 08:04 UTC. No service was started. Browser: Chromium headless shell build 1243 (`chrome-headless-shell`), viewport 1440 x 900 unless stated, every host but file:, data:, blob: and loopback blocked in the browser (R8); a blocked request is logged and aborted. Scratch (not committed): `/tmp/jr/j6-scratch/`.

Two data variants, kept apart:
- **shipped**: `file:///home/user/credit-os2/web/dist/index.html` exactly as built (`web/dist/data.js` holds `issuers: []` and no slices; stage 0 already carries this to stage 4).
- **fixture**: a copy of `web/dist` in `/tmp/jr/j6-scratch/dist-fixture/` whose `data.js` was written by `web/scripts/fixture-data.mjs` from `web/fixtures/{library,model,run,signal}.json` (the data the repository's from-disk checks use). Findings from it say "fixture" in `screen`. It is synthetic data (Halden Aerostructures and others), not an issuer run.

Person: the static library reader, a portfolio manager or committee member who was handed the folder and double-clicked `index.html`. Reads the screen, not the code, to decide what to do.

