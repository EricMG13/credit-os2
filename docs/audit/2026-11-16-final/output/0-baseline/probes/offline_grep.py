"""Stage 0 probe: list every address of another host in the built files and the page-serving Python.

Run from the repository root after `npm --prefix web run build`:
    python3 docs/audit/2026-11-16-final/output/0-baseline/probes/offline_grep.py [out.json]
Scans web/dist/ (both surfaces as built), the issuer-library page the service also serves
(apps/issuer-library/credit_os/web/), and the Python that writes or serves pages. For each hit it
records the file, the line (or byte offset in a minified file), the address and 100 characters of
context. Loopback addresses (127.0.0.1, localhost, [::1]) are kept but marked local. Reads only.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path.cwd()
TARGETS = [
    ROOT / "web" / "dist",
    ROOT / "apps" / "issuer-library" / "credit_os" / "web",
    ROOT / "react_frontend",
    ROOT / "proof" / "serve.py",
    ROOT / "src" / "deploy_workflow" / "run_start",
    ROOT / "src" / "deploy_workflow" / "http_base.py",
    ROOT / "apps" / "issuer-library" / "update_library.py",
]
SKIP_SUFFIXES = {".woff2", ".png", ".jpg", ".ico", ".pyc"}
PATTERNS = {
    "absolute URL": re.compile(r"\b(?:https?|wss?|ftp)://[^\s\"'`<>()\\]+", re.I),
    "protocol-relative": re.compile(r"(?<![:\w/])//(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[:/][^\s\"'`<>()]*)?", re.I),
    "@import": re.compile(r"@import\s+[^;]{0,120}"),
    "url()": re.compile(r"url\(\s*['\"]?(?!data:|#)[^)'\"]{0,200}"),
    "<link href>": re.compile(r"<link\b[^>]{0,300}>", re.I),
    "<script src>": re.compile(r"<script\b[^>]{0,300}\bsrc\s*=\s*[^>]{0,200}>", re.I),
    "fetch(": re.compile(r"\bfetch\(\s*[^,)]{0,160}"),
    "WebSocket": re.compile(r"new\s+WebSocket\s*\([^)]{0,160}"),
    "EventSource": re.compile(r"new\s+EventSource\s*\([^)]{0,160}"),
    "sendBeacon": re.compile(r"sendBeacon\s*\([^)]{0,160}"),
    "importScripts": re.compile(r"importScripts\s*\([^)]{0,160}"),
    "XMLHttpRequest": re.compile(r"XMLHttpRequest"),
}
LOCAL = re.compile(r"(?:127\.0\.0\.1|localhost|\[::1\])", re.I)
HOST = re.compile(r"(?:https?|wss?|ftp)?:?//([^/:\s\"'`<>()\\]+)", re.I)


def files() -> list[Path]:
    found: list[Path] = []
    for target in TARGETS:
        if target.is_file():
            found.append(target)
        elif target.is_dir():
            found.extend(
                p
                for p in sorted(target.rglob("*"))
                if p.is_file()
                and p.suffix not in SKIP_SUFFIXES
                and "__pycache__" not in p.parts
                and not p.name.endswith((".test.cjs", ".test.mjs"))
            )
    return found[:1000]


def main() -> None:
    hits = []
    for path in files():
        text = path.read_text(encoding="utf-8", errors="replace")
        minified = any(len(line) > 2000 for line in text.splitlines()[:50])
        for kind, pattern in PATTERNS.items():
            for match in list(pattern.finditer(text))[:1000]:
                value = match.group(0)
                host = HOST.search(value)
                start = max(0, match.start() - 50)
                where = (
                    f"offset {match.start()}"
                    if minified
                    else f"line {text.count(chr(10), 0, match.start()) + 1}"
                )
                hits.append(
                    {
                        "file": path.relative_to(ROOT).as_posix(),
                        "where": where,
                        "kind": kind,
                        "match": value[:200],
                        "host": host.group(1) if host and kind in ("absolute URL", "protocol-relative", "@import", "url()", "<link href>", "<script src>") else None,
                        "local": bool(LOCAL.search(value)),
                        "context": text[start : match.end() + 50].replace("\n", " ")[:300],
                    }
                )
    out = json.dumps({"files": len(files()), "hits": hits}, indent=1)
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(out, encoding="utf-8")
    else:
        print(out)


if __name__ == "__main__":
    main()
