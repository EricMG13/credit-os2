"""A tool fault caught for the model is also logged (S02 C2 fix, finding M4)."""

import logging
from pathlib import Path

import pytest

from deploy_workflow.model.handoff import ModuleTools
from tests.test_handoff_loop import GOOD, task


def test_a_checker_fault_is_logged_with_tool_and_traceback_and_still_returned(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    def broken(_task: object, _raw: bytes) -> tuple[str, ...]:
        raise ValueError("checker bug 4711")

    module = ModuleTools(task(), tmp_path, broken)  # type: ignore[arg-type]
    with caplog.at_level(logging.WARNING):
        reply = module.call("write_handoff", {"markdown": GOOD.decode()})
    assert reply == "ERROR: ValueError: checker bug 4711"
    (record,) = [r for r in caplog.records if r.levelno == logging.WARNING]
    assert "write_handoff" in record.getMessage()
    assert "ValueError" in record.getMessage()
    assert record.exc_info is not None and record.exc_info[0] is ValueError
