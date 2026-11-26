"""A corrupt source that passes its hash check gets a per-source problem and a log line."""

import hashlib
import io
import logging
import zipfile
from pathlib import Path

import pytest

from react_frontend import sources


def _corrupt_workbook() -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr("xl/workbook.xml", "<not xml")
    return buffer.getvalue()


def test_source_with_unparseable_workbook_xml_reports_a_problem_and_logs(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    raw = _corrupt_workbook()
    digest = hashlib.sha256(raw).hexdigest()
    (tmp_path / "run1" / "inputs").mkdir(parents=True)
    (tmp_path / "run1" / "inputs" / digest).write_bytes(raw)
    with caplog.at_level(logging.WARNING, logger="react_frontend.sources"):
        source = sources._source(tmp_path, "run1", "model.xlsx", digest)
    assert source.problem == "source pages unavailable: ParseError"
    assert source.pages == {}
    assert source.raw == raw
    messages = [r.getMessage() for r in caplog.records if r.name == "react_frontend.sources"]
    assert len(messages) == 1
    assert "ParseError" in messages[0]
    assert "model.xlsx" in messages[0]


def _stored(tmp_path: Path, raw: bytes) -> str:
    digest = hashlib.sha256(raw).hexdigest()
    (tmp_path / "run1" / "inputs").mkdir(parents=True)
    (tmp_path / "run1" / "inputs" / digest).write_bytes(raw)
    return digest


def _encrypted_workbook() -> bytes:
    """A workbook whose members carry the zip encryption flag bit."""
    raw = bytearray(_corrupt_workbook())
    for signature, offset in ((b"PK\x03\x04", 6), (b"PK\x01\x02", 8)):
        start = 0
        while (found := raw.find(signature, start)) != -1:
            raw[found + offset] |= 1
            start = found + 4
    return bytes(raw)


def test_encrypted_member_is_a_problem_not_a_crash(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    kind = "RuntimeError"
    digest = _stored(tmp_path, _encrypted_workbook())
    with caplog.at_level(logging.WARNING, logger="react_frontend.sources"):
        source = sources._source(tmp_path, "run1", "model.xlsx", digest)
    assert source.problem == f"source pages unavailable: {kind}"
    assert source.pages == {}
    messages = [r.getMessage() for r in caplog.records if r.name == "react_frontend.sources"]
    assert len(messages) == 1 and kind in messages[0]


def test_unsupported_compression_is_a_problem_not_a_crash(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    raw = _corrupt_workbook()
    digest = _stored(tmp_path, raw)

    def unsupported(name: str, data: bytes) -> list[str]:
        raise NotImplementedError("That compression method is not supported")

    monkeypatch.setattr(sources, "_pages", unsupported)
    source = sources._source(tmp_path, "run1", "model.xlsx", digest)
    assert source.problem == "source pages unavailable: NotImplementedError"


def test_truncated_stream_is_a_problem_not_a_crash(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    raw = _corrupt_workbook()
    digest = _stored(tmp_path, raw)

    def truncated(name: str, data: bytes) -> list[str]:
        raise EOFError("Compressed file ended before the end-of-stream marker was reached")

    monkeypatch.setattr(sources, "_pages", truncated)
    source = sources._source(tmp_path, "run1", "model.xlsx", digest)
    assert source.problem == "source pages unavailable: EOFError"
