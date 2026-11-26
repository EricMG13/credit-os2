"""Model reader zero, missing row, issuer aliases, layout-less
handoff comments. Scope: the readers and build_model's input checks, not a full Model."""

from __future__ import annotations

import hashlib
from decimal import Decimal
from types import SimpleNamespace

import pytest

from deploy_workflow import model_handoff_delivery as mhd
from deploy_workflow.handoff_delivery import mapped_module

HEADINGS = ("Request", "Sources", "Findings", "Calculations", "Gaps", "Next module")


def _reader(lines: list[str]) -> mhd._AnnualReader:
    raw = "\n".join(lines).encode()
    layout = SimpleNamespace(
        anchors={"income": "### Income"},
        rows={"revenue": SimpleNamespace(table="income", label="Revenue")},
    )
    return mhd._AnnualReader(raw, SimpleNamespace(sha256="0" * 64), layout)  # type: ignore[arg-type]


@pytest.mark.parametrize("lexeme", ["(0)", "(0.0)"])
def test_annual_reader_publishes_a_bracketed_zero_as_zero(lexeme: str) -> None:
    reader = _reader(
        ["### Income", "| Item | FY2024 |", "| --- | --- |", f"| Revenue | {lexeme} |"]
    )
    value = reader.read("revenue", "FY2024").value
    assert value == 0
    assert value is not None and not value.is_signed()


@pytest.mark.parametrize("lexeme", ["(0)", "(0.0)"])
def test_quarter_cell_publishes_a_bracketed_zero_as_zero(lexeme: str) -> None:
    value = mhd._quarter_cell(7, [lexeme], 0).value
    assert value == 0
    assert value is not None and not value.is_signed()


def test_quarter_cell_keeps_a_real_negative() -> None:
    assert mhd._quarter_cell(7, ["(1,250.5)"], 0).value == Decimal("-1250.5")


def test_annual_adjusted_with_its_row_as_the_header_is_a_missing_window() -> None:
    lines = [
        "| Total Company EBITDA As Defined | FY2024 |",
        "| --- | --- |",
        "| Other | 1 |",
    ]
    cell = mhd._annual_adjusted(lines, "FY2024")
    assert (cell.value, cell.reason) == (None, "WINDOW_MISSING")


def _handoff(title: str) -> bytes:
    body = [f"## {h}\n\nbody" for h in HEADINGS]
    return "\n".join([f"# {title}", *body, ""]).encode()


def _model_inputs(files: dict[str, bytes]) -> tuple[dict[str, SimpleNamespace], dict[str, bytes]]:
    specs = {k: SimpleNamespace(sha256=hashlib.sha256(v).hexdigest()) for k, v in files.items()}
    return specs, files


RUN = SimpleNamespace(issuer_name="Acme Corp", issuer_id="acme")


def test_build_model_accepts_an_issuer_named_by_a_layout_alias() -> None:
    specs, raw = _model_inputs(
        {"annual": _handoff("Acme Corp CP-1"), "current_synthesis": _handoff("Roadrunner Ltd CP-2")}
    )
    layout = SimpleNamespace(anchors={}, rows={})
    with pytest.raises(ValueError, match="model_rows"):  # past the issuer check, not at it
        mhd.build_model(RUN, specs, raw, layout, ("Roadrunner Ltd",))  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="model_issuer: current_synthesis"):
        mhd.build_model(RUN, specs, raw, layout)  # type: ignore[arg-type]


def test_build_model_names_an_empty_declared_quarter_file() -> None:
    specs, raw = _model_inputs(
        {
            "annual": _handoff("Acme Corp CP-1"),
            "current_synthesis": _handoff("Acme Corp CP-2"),
            "quarter": b"",
        }
    )
    with pytest.raises(ValueError, match="model_issuer: quarter"):
        mhd.build_model(RUN, specs, raw, SimpleNamespace(anchors={}, rows={}))  # type: ignore[arg-type]


def test_layout_less_handoff_ignores_a_commented_stale_gap_row() -> None:
    lines = [
        "# Acme Corp CP-2",
        "## Request",
        "x",
        "## Sources",
        "x",
        "## Findings",
        "**Assessment — fine**",
        "**Thesis — ok**",
        "### Ranked strengths, weaknesses and key risks",
        "**Strengths**",
        "1. Good",
        "**Weaknesses**",
        "1. Bad",
        "## Calculations",
        "x",
        "## Gaps",
        "<!--",
        "| Gap | Note |",
        "| --- | --- |",
        "| OLD | stale |",
        "-->",
        "| Gap | Note |",
        "| --- | --- |",
        "| LIVE | current |",
        "## Next module",
        "x",
    ]
    text = "\n".join(lines)
    view, _ = mapped_module("CP-2", text.encode())
    gaps = next(t for t in view.tables if t.table_id == "T2.12")
    facts = [f for f in view.facts if f.table_id == "T2.12"]
    assert [r.label for r in gaps.rows] == ["LIVE"]
    assert [f.citations[0].locator for f in facts][:1] == ["line 24"]


def test_shown_refuses_a_structural_tail_after_a_closing_comment() -> None:
    with pytest.raises(ValueError, match="m: line 3"):
        mhd._shown(["<!--", "x", "--> | A | B |"], "m")


def test_shown_keeps_a_prose_tail_after_a_closing_comment() -> None:
    assert mhd._shown(["<!--", "x", "--> ok"], "m") == ["", "", " ok"]
