"""Bound publication payloads, source reads and compressed static/API responses."""

from __future__ import annotations

import gzip
import hashlib
import json
import os
import shutil
import threading
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any
from urllib.parse import quote, urlsplit

import pytest

from deploy_workflow import http_base
from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout
from react_frontend import (
    _connected_reply,
    _gzip_quality,
    _library_index,
    _scope_query,
    admission,
    make_server,
    sources,
)
from tests import test_react_frontend as frontend

NAME = "issuer.txt"
RAW = b"issuer source body"
SHA = hashlib.sha256(RAW).hexdigest()
FOLDER = "current"


@pytest.mark.parametrize(
    ("query", "status"),
    [
        ("run=", 400),
        ("run=one&run=two", 400),
        ("run=%GG", 400),
        ("run=%E0%A4%A", 400),
        ("run=..%2Fsecret", 404),
    ],
)
def test_snapshot_scope_query_rejects_invalid_and_traversal_values(query: str, status: int) -> None:
    with pytest.raises(http_base.Reply) as error:
        _scope_query(query)
    assert error.value.status == status


@pytest.fixture
def publication(tmp_path: Path) -> tuple[Layout, dict[str, Any]]:
    layout = Layout(tmp_path)
    run = layout.runs / FOLDER
    (run / "inputs").mkdir(parents=True)
    (run / "inputs" / SHA).write_bytes(RAW)
    (run / "workflow.json").write_text(json.dumps({"sources": {NAME: {"sha256": SHA}}}))
    record = {
        "folder": FOLDER,
        "issuer": "Issuer",
        "issuerKey": "issuer",
        "pathway": "credit_snapshot",
        "asOf": "2026-11-16",
        "period": "2026-Q3",
        "modules": {"CP-1": {"outputs": ["current/CP-1.md"], "default": "current/CP-1.md"}},
        "evidence": {
            "sources": [{"name": NAME, "sha256": SHA}],
            "unused": [],
            "unrecorded": [],
        },
    }
    snapshot = {
        "catalogue": {"real": [{"id": FOLDER, "name": "Issuer", "date": "2026-11-16"}]},
        "workspace": {
            "runs": {"current-key": record},
            "outputs": {
                "current/CP-1.md": {"run": "current-key", "module": "CP-1", "sha256": "a" * 64}
            },
            "handoffs": {"a" * 64: [{"heading": "Current", "level": 2, "line": 1, "blocks": []}]},
            "models": [],
        },
        "chips": {},
        "activity": {"source": "large irrelevant activity field"},
    }
    return layout, snapshot


def test_scope_keeps_history_metadata_and_only_valid_comparison_content() -> None:
    earlier = {
        "folder": "earlier",
        "issuerKey": "issuer",
        "pathway": "credit_snapshot",
        "asOf": "2025-11-16",
        "period": "FY2025",
        "modules": {"CP-1": {"outputs": ["earlier/CP-1.md"]}},
    }
    current = {
        "folder": FOLDER,
        "issuerKey": "issuer",
        "pathway": "credit_snapshot",
        "asOf": "2026-11-16",
        "period": "FY2026",
        "modules": {"CP-1": {"outputs": ["current/CP-1.md"]}},
        "changes": {
            "pack": {
                "prior": {"run": "earlier", "as_of": "2025-11-16", "pathway": "credit_snapshot"},
                "current": {"as_of": "2026-11-16", "pathway": "credit_snapshot"},
            }
        },
    }
    same_issuer_history = {
        "folder": "history",
        "issuerKey": "issuer",
        "pathway": "other",
        "period": "Q1",
        "modules": {
            "CP-1": {"outputs": ["history/CP-1.md", "other/CP-1.md"]},
            "CP-2": {"outputs": ["history/CP-2.md"]},
            "CP-3": {"outputs": []},
        },
        "record": {"steps": [{"module": "CP-2"}, {"module": "CP-1"}, {"module": "CP-3"}]},
        "methodChanges": ["CP-2: example method change"],
    }
    unrelated = {
        "folder": "other",
        "issuerKey": "another",
        "pathway": "credit_snapshot",
        "modules": {"CP-1": {"outputs": ["other/CP-1.md"]}},
    }
    outputs = {
        f"{folder}/CP-1.md": {"run": f"{folder}-key", "module": "CP-1", "sha256": folder[0] * 64}
        for folder in ("earlier", "current", "history", "other")
    }
    outputs["history/CP-2.md"] = {"run": "history-key", "module": "CP-2", "sha256": "2" * 64}
    snapshot = {
        "catalogue": {
            "real": [
                {"id": folder, "name": folder}
                for folder in ("earlier", "current", "history", "other")
            ]
        },
        "workspace": {
            "runs": {
                "earlier-key": earlier,
                "current-key": current,
                "history-key": same_issuer_history,
                "other-key": unrelated,
            },
            "outputs": outputs,
            "handoffs": {
                folder[0] * 64: [{"heading": folder, "level": 2, "line": 1, "blocks": []}]
                for folder in ("earlier", "current", "other")
            }
            | {
                "h" * 64: [
                    {"heading": "Request", "level": 2, "blocks": []},
                    {"heading": "Inputs", "level": 3, "blocks": [{"type": "text", "text": "x"}]},
                    {"heading": "Findings", "level": 2, "blocks": []},
                    {"heading": "Bottom line", "level": 3, "blocks": []},
                ],
                "2" * 64: [{"heading": "Unstructured handoff", "level": 1, "blocks": []}],
            },
            "models": [],
        },
        "chips": {
            f"{folder}/CP-1.md:1": [{"file": folder}] for folder in ("earlier", "current", "other")
        },
    }
    scoped = sources.scoped(snapshot, FOLDER)
    assert scoped is not None
    assert set(scoped["workspace"]["runs"]) == {"earlier-key", "current-key", "history-key"}
    assert scoped["workspace"]["runs"]["history-key"] == {
        "folder": "history",
        "issuerKey": "issuer",
        "pathway": "other",
        "period": "Q1",
        "history": {
            "modules": ["CP-2", "CP-1"],
            "earlierFormat": False,
            "earlierMethods": True,
        },
    }
    assert set(scoped["workspace"]["outputs"]) == {"earlier/CP-1.md", "current/CP-1.md"}
    assert set(scoped["workspace"]["handoffs"]) == {"e" * 64, "c" * 64}
    assert set(scoped["chips"]) == {"earlier/CP-1.md:1", "current/CP-1.md:1"}
    assert {row["id"] for row in scoped["catalogue"]["real"]} == {"earlier", "current", "history"}
    assert "activity" not in scoped or scoped["activity"] == {}
    assert sources.scoped(snapshot, "absent") is None
    duplicate = {
        **snapshot,
        "workspace": {
            **snapshot["workspace"],
            "runs": {**snapshot["workspace"]["runs"], "duplicate": current},
        },
    }
    assert sources.scoped(duplicate, FOLDER) is None
    snapshot["workspace"]["handoffs"]["h" * 64][-1]["heading"] = "Reader summary"
    older = sources.scoped(snapshot, FOLDER)
    assert older is not None
    assert older["workspace"]["runs"]["history-key"]["history"]["earlierFormat"] is True


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("gzip", 1.0),
        ("br, gzip;q=0.4", 0.4),
        ("gzip;q=0", 0),
        ("gzip;q=0, *;q=1", 0),
        ("*;q=.5", 0),
        ("gzip;q=2", 0),
        ("gzip;q=0.2, gzip;q=1", 0),
    ],
)
def test_gzip_quality_negotiation(value: str, expected: float) -> None:
    assert _gzip_quality(value) == expected


def test_compact_library_index_omits_report_content_and_activity(
    publication: tuple[Layout, dict[str, Any]],
) -> None:
    layout, snapshot = publication
    snapshot["workspace"]["handoffs"] = {"secret": ["X" * 100_000]}
    snapshot["chips"] = {"output:1": ["Y" * 100_000]}
    snapshot["activity"] = {"private-data": "Z" * 100_000}
    snapshot["catalogue"]["real"][0]["files"] = [
        {"name": f"run-file-{n}", "href": f"../runs/current/run-file-{n}"} for n in range(200)
    ]
    library = layout.engine / "library"
    library.mkdir(parents=True)
    (library / "data.js").write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};")
    reply = _library_index(layout)
    encoded = json.dumps(reply.body)
    assert "secret" not in encoded and "private-data" not in encoded
    assert "run-file" not in encoded
    assert reply.body["catalogue"]["real"] == [
        {"id": FOLDER, "name": "Issuer", "date": "2026-11-16"}
    ]
    assert len(encoded) < 2000
    assert set(reply.body["workspace"]) == {"runs"}
    # The index carries each run's identity and its verified-publication facts, and nothing else.
    assert set(reply.body["workspace"]["runs"]["current-key"]) == {
        "folder",
        "issuerKey",
        "pathway",
        "publicationVerified",
        "lead",
        "assessmentScope",
        "publishedAt",
    }


def _publish(layout: Layout, snapshot: dict[str, Any]) -> None:
    """Replace the library folder as the publisher does: built beside it, then swapped in."""
    library = layout.engine / "library"
    staging = layout.engine / ".library-new"
    staging.mkdir(parents=True)
    (staging / "data.js").write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};")
    if library.exists():
        shutil.rmtree(library)
    staging.rename(library)


def test_a_publication_is_parsed_once_for_the_same_bytes_and_a_new_one_is_read(
    publication: tuple[Layout, dict[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    layout, snapshot = publication
    parses: list[int] = []
    decode = admission._decoded

    def counted(raw: bytes) -> dict[str, Any]:
        parses.append(len(raw))
        return decode(raw)

    monkeypatch.setattr(admission, "_decoded", counted)
    monkeypatch.setattr(admission, "_kept", None)
    _publish(layout, snapshot)
    for _ in range(3):
        assert _library_index(layout).body["catalogue"]["real"][0]["name"] == "Issuer"
    assert len(parses) == 1
    snapshot["catalogue"]["real"][0]["name"] = "Renamed"
    _publish(layout, snapshot)
    assert _library_index(layout).body["catalogue"]["real"][0]["name"] == "Renamed"
    assert _library_index(layout).body["catalogue"]["real"][0]["name"] == "Renamed"
    assert len(parses) == 2
    shutil.rmtree(layout.engine / "library")
    assert _library_index(layout).body is None and admission.published(layout) is None


def test_a_file_rewritten_in_place_under_the_same_times_is_read_again(
    publication: tuple[Layout, dict[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    layout, snapshot = publication
    monkeypatch.setattr(admission, "_kept", None)
    _publish(layout, snapshot)
    path = layout.engine / "library" / "data.js"
    times = path.stat()
    for name in ("Issuer", "Second", "Third!"):  # the same size and the same file times
        snapshot["catalogue"]["real"][0]["name"] = name
        path.write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};")
        os.utime(path, ns=(times.st_atime_ns, times.st_mtime_ns))
        assert _library_index(layout).body["catalogue"]["real"][0]["name"] == name
    path.write_text("window.CREDIT_OS_DATA={invalid};")
    with pytest.raises(ValueError):
        admission.published(layout)
    path.write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};")
    size = path.stat().st_size
    assert admission.published(layout, limit=size) is not None
    with pytest.raises(ValueError, match="size limit"):
        admission.published(layout, limit=size - 1)


def test_no_reply_changes_the_publication_the_requests_share(
    publication: tuple[Layout, dict[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    layout, snapshot = publication
    monkeypatch.setattr(admission, "_kept", None)
    _publish(layout, snapshot)
    kept = admission.published(layout)
    assert kept is admission.published(layout) and kept == snapshot
    link = f"/connected/sources/{FOLDER}/{SHA}/{quote(NAME, safe='')}"
    replies = {}
    for path in (
        "/connected/library",
        "/connected/reports",
        f"/connected/report/{FOLDER}",
        "/connected/snapshot",
        f"/connected/snapshot?run={FOLDER}",
        link,
        f"{link}?page=1",
        f"/connected/artifacts/{FOLDER}",
        f"/connected/portfolio/{FOLDER}",
    ):
        try:
            reply = _connected_reply(layout, urlsplit(path), {}, {})
        except http_base.Reply as refused:
            reply = refused
        assert reply is not None and reply.status == 200, path
        replies[path] = reply.body
    # The scoped report carries the verified source link; the shared object never gains it.
    scoped = json.loads(replies[f"/connected/snapshot?run={FOLDER}"])
    assert scoped["workspace"]["runs"]["current-key"]["evidence"]["sources"][0]["href"] == link
    assert replies[link] == RAW
    assert admission.published(layout) is kept and kept == snapshot
    assert json.loads(json.dumps(kept)) == json.loads(json.dumps(snapshot))


def _verify_static_compression(server: Any, chunk: bytes) -> None:
    status, packed, headers = frontend.request(
        server, "/connected-assets/app-a1b2c3d4.js", headers={"Accept-Encoding": "gzip"}
    )
    assert status == 200 and headers["Content-Encoding"] == "gzip"
    assert gzip.decompress(packed) == chunk
    assert headers["Vary"] == "Accept-Encoding"
    assert headers["Cache-Control"] == "public, max-age=31536000, immutable"
    status, identity, headers = frontend.request(
        server,
        "/connected-assets/app-a1b2c3d4.js",
        headers={"Accept-Encoding": "gzip;q=0"},
    )
    assert status == 200 and identity == chunk and "Content-Encoding" not in headers
    assert headers["Vary"] == "Accept-Encoding"
    # Stable names (not content-hashed): cached for a day, never immutable. Only a font under
    # /fonts/ is: a page or a licence text there, data.js and the notices get no lifetime.
    for plain in ("/fonts/", "/fonts/licence.txt", "/data.js", "/THIRD-PARTY-NOTICES.md"):
        status, body, headers = frontend.request(server, plain)
        assert status == 200 and body == b"stable", plain
        assert "max-age" not in headers.get("Cache-Control", ""), plain
    for stable in ("/fonts/text-regular.woff2", "/symbol.svg"):
        status, body, headers = frontend.request(server, stable)
        assert status == 200 and body == b"stable", stable
        assert headers["Cache-Control"] == "public, max-age=86400", stable
    status, body, headers = frontend.request(server, "/connected-assets/plain.js")
    assert status == 200 and body == b"stable" and "Cache-Control" not in headers
    status, _, headers = frontend.request(server, "/fonts/absent.woff2")
    assert status == 404 and "max-age" not in headers.get("Cache-Control", "")
    status, html, _ = frontend.request(server, "/")
    assert status == 200 and b"connected</body>" in html


def test_http_source_download_only_checks_requested_file_and_rechecks_hash(
    publication: tuple[Layout, dict[str, Any]],
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    layout, snapshot = publication
    library = layout.engine / "library"
    library.mkdir(parents=True)
    (library / "data.js").write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};")
    layout.state.mkdir(parents=True, exist_ok=True)
    runs.save(
        layout,
        runs.Record(
            id=FOLDER, pathway="credit_snapshot", folder=FOLDER, status="finished", claimed_at=""
        ),
    )
    web = tmp_path / "web"
    web.mkdir()
    (web / "index.html").write_text(
        "<html><head><meta content=\"connect-src 'none'\"></head></html>"
    )
    (web / "connected.html").write_text(
        "<html><head><meta content=\"connect-src 'none'\"></head><body>connected</body></html>"
    )
    (web / "connected-assets").mkdir()
    chunk = b"const report = 'content';\n" * 100
    (web / "connected-assets" / "app-a1b2c3d4.js").write_bytes(chunk)
    (web / "connected-assets" / "plain.js").write_bytes(b"stable")
    (web / "fonts").mkdir()
    (web / "fonts" / "text-regular.woff2").write_bytes(b"stable")
    (web / "symbol.svg").write_bytes(b"stable")
    for plain in ("fonts/index.html", "fonts/licence.txt", "data.js", "THIRD-PARTY-NOTICES.md"):
        (web / plain).write_bytes(b"stable")
    read_calls: list[tuple[str, bool]] = []
    load = sources._source

    def record_read(root: Path, folder: str, name: str, digest: str, *, pages: bool = True):
        read_calls.append((name, pages))
        return load(root, folder, name, digest, pages=pages)

    def no_enrichment(*args: Any, **kwargs: Any) -> Any:
        raise AssertionError("source route must not enrich the report")

    monkeypatch.setattr(sources, "_source", record_read)
    monkeypatch.setattr(sources, "enrich", no_enrichment)
    monkeypatch.setenv("OPENAI_API_KEY", "offline-test")
    with TemporaryDirectory(dir=None if os.name == "nt" else "/tmp") as directory:
        root = Path(directory)
        shutil.copytree(layout.engine, root / "_engine")
        with make_server(root, web=web) as server:
            publication_path = server.scheduler.layout.engine / "library" / "data.js"
            publication_path.parent.mkdir(parents=True, exist_ok=True)
            publication_path.write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};")
            thread = threading.Thread(target=server.serve_forever)
            thread.start()
            try:
                link = f"/connected/sources/{FOLDER}/{SHA}/{quote(NAME, safe='')}"
                status, body, _ = frontend.request(server, link)
                assert status == 200 and body == RAW, (status, body, read_calls)
                assert read_calls == [(NAME, False)]
                (root / "_engine" / "runs" / FOLDER / "inputs" / SHA).write_bytes(b"tampered")
                status, _, _ = frontend.request(server, link)
                assert status == 404
                assert read_calls == [(NAME, False), (NAME, False)]

                _verify_static_compression(server, chunk)
            finally:
                server.shutdown()
                thread.join()
