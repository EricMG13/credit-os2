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
