"""Synthetic CP-OS acceptance and delivery coverage for an invalid forecast debt path."""

import hashlib
import json
from dataclasses import replace
from pathlib import Path

import pytest
from test_cpos_forecast_review import _cp1
from test_cpos_launch import (
    _without_placeholders,
    context_file,
    forecast_answer,
    good_task,
    issuer_folder,
    named_forecast_block,
)

from deploy_workflow.owners import cpos_launch
from deploy_workflow.owners.cpos import HandoffTask, run_handoffs
from deploy_workflow.run_events import read_events

_WITHHELD = "Analyst debt path, forecast year 3: repayment exceeds the opening debt balance"


def _forecast(repayments: tuple[str, str, str], net_leverage: str = "1.80x") -> str:
    before, payload, after = named_forecast_block().split("```")
    document = json.loads(payload.removeprefix("json\n"))
    document["base_drivers"]["debt_repayment"]["values"] = repayments
    return (
        f"{before}```json\n{json.dumps(document)}\n```{after}\n"
        "### T2H.6 - Credit metrics outputs\n\n"
        "| period | case | gross/net leverage | coverage | FCF/debt | liquidity runway "
        "| definition IDs |\n"
        "| --- | --- | --- | --- | --- | --- | --- |\n"
        f"| FY2026 | Downside | 1.98x / {net_leverage} | 6.36x | 13.08% | Not supplied "
        "| EBITDA / cash interest |\n\n"
    )


def test_overpayment_with_readable_downside_table_withholds_only_forecast(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], caplog: pytest.LogCaptureFixture
) -> None:
    prepared = cpos_launch.prepare(
        context_file(tmp_path, "distressed_restructuring"),
        issuer_folder(tmp_path),
        tmp_path / "prepared",
        config="sol-medium",
        cap="15",
        modules=("CP-2G",),
        prior="none",
    )
    plan = json.loads(prepared.manifest.read_text())
    plan.update(execution="synthetic", provider_cap_usd="0")
    manifest = prepared.directory / "synthetic.json"
    manifest.write_text(json.dumps(plan))
    routes = list(prepared.layout.routes)

    def execute(task: HandoffTask) -> bytes:
        context = {
            "module_id": task.module_id,
            "sources": {key: hashlib.sha256(raw).hexdigest() for key, raw in task.sources.items()},
            "handoffs": {
                key: {"sha256": hashlib.sha256(raw).hexdigest()}
                for key, raw in task.handoffs.items()
            },
        }
        text = forecast_answer(context, routes, _forecast(("100", "200", "301")))
        if task.module_id == "CP-2G":
            text = _without_placeholders(text, ("T2H.6",))
        return text.encode()

    out = tmp_path / "out"
    delivery = run_handoffs(
        manifest, out, execute=execute, check=cpos_launch.checker(prepared.layout), events=out
    )

    receipt = json.loads(delivery.read_text())
    assert "cp_forecast_published" not in receipt
    assert {"CP-1.md", "CP-2G.md", "report-view.json"} <= receipt["files"].keys()
    assert "forecast_exact.json" not in receipt["files"]
    (completed,) = out.glob("completed-*.json")
    completion = json.loads(completed.read_text())
    assert completion["cp_forecast_published"] is False
    assert completion["forecast_failure"] == _WITHHELD
    (refusal,) = [
        event
        for event in read_events(out / "events.jsonl")
        if event["event"] == "model_not_published"
    ]
    assert refusal["reason"] == _WITHHELD
    assert f"Model not published: {_WITHHELD}" in capsys.readouterr().err
    assert f"downside net leverage not checked against Python's: {_WITHHELD}" in caplog.text


def test_valid_debt_path_still_compares_the_stated_downside(tmp_path: Path) -> None:
    _, task, _ = good_task(tmp_path, "CP-2G")
    task = replace(task, handoffs={"CP-1": _cp1("FY2025", "none").encode()})
    assert cpos_launch._forecast_issues(task, _forecast(("100", "200", "300"))) == ()
    (issue,) = cpos_launch._forecast_issues(task, _forecast(("100", "200", "300"), "1.70x"))
    assert "FY2026 1.70x against 1.8040x" in issue
