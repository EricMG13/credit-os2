"""Display-only fail-opens keep their return values and now log the cause."""

import logging
from pathlib import Path
from typing import Any

import pytest

from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import ensure_layout
from react_frontend import __main__ as main
from react_frontend import portfolio, run_metadata


def _record(status: runs.Status = "finished") -> runs.Record:
    return runs.Record(
        id="run-x",
        pathway="credit_snapshot",
        folder="run-x",
        status=status,
        claimed_at="2026-10-31T11:00:00Z",
    )


def _messages(caplog: pytest.LogCaptureFixture, name: str) -> list[str]:
    return [
        r.getMessage() for r in caplog.records if r.name == name and r.levelno == logging.WARNING
    ]


def test_attested_logs_why_a_receipt_is_withheld(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    (tmp_path / "f1").mkdir()
    snapshot: dict[str, Any] = {
        "catalogue": {"real": [{"id": "f1"}]},
        "workspace": {
            "runs": {
                "r": {"folder": "f1", "modules": {"CP-6": {"default": "o", "outputs": ["o"]}}}
            },
            "outputs": {},
        },
    }
    with caplog.at_level(logging.WARNING):
        assert portfolio.attested(tmp_path, "f1", snapshot) is None
    [message] = _messages(caplog, "react_frontend.portfolio")
    assert "f1" in message and "KeyError" in message


def test_execution_logs_why_it_is_unknown(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    (tmp_path / "live").mkdir()
    (tmp_path / "live" / "calls.jsonl").write_text("not json\n", encoding="utf-8")
    with caplog.at_level(logging.WARNING):
        result = run_metadata.execution(tmp_path, _record(), {"execution": "live-provider"})
    assert result is None
    [message] = _messages(caplog, "react_frontend.run_metadata")
    assert "run-x" in message and "execution unknown" in message


def test_module_outputs_logs_why_it_is_unavailable(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.WARNING):
        assert run_metadata.module_outputs(tmp_path, _record()) is None
    [message] = _messages(caplog, "react_frontend.run_metadata")
    assert "run-x" in message and "module outputs unavailable" in message


def test_library_admission_logs_why_it_is_unknown(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    layout = ensure_layout(tmp_path)
    with caplog.at_level(logging.WARNING):
        assert run_metadata.library_admission(layout, _record()) is None
    [message] = _messages(caplog, "react_frontend.run_metadata")
    assert "run-x" in message and "admission unknown" in message


def test_one_output_logs_why_a_response_identity_is_unknown(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    reader = run_metadata._Reads(tmp_path)
    context: dict[str, Any] = {"latest": {}, "producers": {}, "hashes": {}, "selected": {}}
    with caplog.at_level(logging.WARNING):
        value = run_metadata._one_output(reader, {}, "CP-2", context)
    assert value == {
        "module": "CP-2",
        "assessment": None,
        "provenance": None,
        "response_sha256": None,
    }
    [message] = _messages(caplog, "react_frontend.run_metadata")
    assert "CP-2" in message and "KeyError" in message


def test_seat_query_failure_is_logged_and_startup_continues(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    async def failing(_adapter: object) -> None:
        raise RuntimeError("private diagnostic")

    monkeypatch.setattr(main.CopilotAdapter, "seat_models", failing)
    with caplog.at_level(logging.WARNING):
        assert main._seat_models() == {}
    [message] = _messages(caplog, "react_frontend.__main__")
    assert "RuntimeError" in message and "private diagnostic" not in message


def test_seat_query_failure_text_stays_off_stderr_in_a_real_run(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    async def failing(_adapter: object) -> None:
        raise RuntimeError("private diagnostic")

    monkeypatch.setattr(main.CopilotAdapter, "seat_models", failing)
    # A real run configures no handler, so logging falls back to its stderr last-resort handler.
    monkeypatch.setattr(logging.getLogger(), "handlers", [])
    assert main._seat_models() == {}
    err = capsys.readouterr().err
    assert "RuntimeError" in err
    assert "private diagnostic" not in err
