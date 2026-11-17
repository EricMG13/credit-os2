#!/usr/bin/env bash
# Stage 0, step 8 (static): other-host addresses and loaders in the built static app.
# Usage (from the repo root): bash docs/audit/2026-11-16-final/output/0-baseline/probes/static/offline-grep.sh
set -u
cd web/dist || exit 2
files=(index.html data.js symbol.svg assets/*.css assets/*.js fonts/*.txt THIRD-PARTY-NOTICES.md)
echo "## Absolute and protocol-relative addresses (count, file, address)"
for f in "${files[@]}"; do
  grep -oE "(https?:)?//[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^\"' )>\`]{0,60}|wss?://[^\"' ]{0,60}" "$f" | sort | uniq -c | sed "s|^|$f |"
done
echo "## Scheme strings built at run time"
grep -oE "[\"'\`](https?|wss?):[\"'\`]" assets/*.js | sort | uniq -c
echo "## Loaders in index.html"
grep -oE "<(script|link)[^>]*>" index.html
grep -oE "http-equiv=\"Content-Security-Policy\"[^>]*" -A2 index.html | tr -s ' \n' ' '; echo
echo "## CSS @import and url()"
grep -oE "@import[^;]{0,80}|url\([^)]{0,80}\)" assets/*.css | sort | uniq -c
echo "## Network APIs in the bundle"
grep -oE "\bfetch\(|new WebSocket|XMLHttpRequest|sendBeacon|EventSource|importScripts|new Worker|serviceWorker" assets/*.js | sort | uniq -c
echo "## Binary fonts: embedded http(s) strings"
for f in fonts/*.woff2; do printf '%s ' "$f"; grep -ac "https\?://" "$f"; done
true
