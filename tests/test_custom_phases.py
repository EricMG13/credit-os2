"""Offline phase plans and handoff checks.

Prepared cases use synthetic Northbridge Synthetic Group, 2025-03-31. Planner
unit cases have no issuer inputs. No provider responds.
"""

import json
from pathlib import Path

import pytest
from test_cpos_launch import context_file, issuer_folder

from deploy_workflow.owners import cpos_custom, cpos_launch
from deploy_workflow.owners.cpos import HandoffTask, _retain_method_checks


def _prepare(tmp_path: Path, *modules: str) -> cpos_launch.Prepared:
    return cpos_launch.prepare(
        context_file(tmp_path, "custom"),
        issuer_folder(tmp_path),
        tmp_path / "run",
        config="copilot-sol-medium",
        cap=None,
        modules=modules,
    )


def _instructions(prepared: cpos_launch.Prepared, module: str) -> str:
    spec = prepared.plan.instructions[module]
    return (prepared.directory / spec.path).read_text()


def test_intercreditor_adds_the_same_run_structural_map_and_omits_capacity(tmp_path: Path) -> None:
    prepared = _prepare(tmp_path, "CP-4", "CP-4D")
    assert prepared.ordered == ("CP-0", "CP-1", "CP-4")
    assert prepared.plan.run.phase_selection == {"CP-4": ("CP-4B", "CP-4D")}
    text = _instructions(prepared, "CP-4")
    assert "REF_CP-4B_STEPS.md" in text
    assert "#### CP-4D method" in text
    assert "REF_CP-4A_STEPS.md" not in text and "**T4C.4**:" not in text
    assert "Same run" in text
    assert prepared.estimate is not None and prepared.estimate.cap == 9
    assert prepared.estimate.rows[-1].phases == (
        ("Structural priority", "Needed by Intercreditor control."),
        ("Intercreditor control", None),
    )


def test_structural_priority_alone_checks_its_own_registers(tmp_path: Path) -> None:
    prepared = _prepare(tmp_path, "CP-4B", "CP-4")
    text = _instructions(prepared, "CP-4")
    assert "REF_CP-4B_STEPS.md" in text
    assert "#### CP-4D method" not in text and "**T4F.1**:" not in text
    required = [
        "T4.2",
        "T4.3",
        "T4.9",
        "T4.10",
        "T4.11",
        "T4.12",
        "T4.13",
        "T4D.1",
        "T4D.2",
        "T4D.3",
        "T4D.4",
        "T4D.5",
        "T4D.6",
        "T4D.7",
        "T4D.8",
    ]
    filled = "\n".join(f"### {name} Evidence" for name in required)
    assert cpos_launch.register_issues("CP-4", filled, "custom", ("CP-4B",)) == ()
    missing = cpos_launch.register_issues(
        "CP-4", filled.replace("T4D.7", "T4D.70"), "custom", ("CP-4B",)
    )
    assert len(missing) == 1 and missing[0].startswith("Missing registers: T4D.7.")


def test_earnings_scope_includes_core_and_the_embedded_phase(tmp_path: Path) -> None:
    prepared = _prepare(tmp_path, "CP-1D", "CP-1E")
    assert set(prepared.ordered) == {"CP-0", "CP-1", "CP-1D"}
    assert "### CP-1E method" in _instructions(prepared, "CP-1D")
    expected = "T1D.1 T1D.2 T1D.3 T1D.4 T1D.5 T1D.6 T1D.7 T1E.1 T1E.2 T1E.3 T1E.4 T1E.5 T1E.6"
    assert cpos_launch.required_registers("CP-1D", "custom", ("CP-1E",)) == tuple(expected.split())


def test_governance_restores_analytical_cuts_but_keeps_routing_cuts(tmp_path: Path) -> None:
    prepared = _prepare(tmp_path, "CP-1A", "CP-2C")
    restored = ("T2D.2", "T2D.6", "T2D.7", "T2D.8")
    required = cpos_launch.required_registers("CP-1A", "custom", ("CP-2C",))
    assert set(restored) <= set(required)
    assert "T2D.10" not in required and "source_classification" not in required
    cuts = _instructions(prepared, "CP-1A").partition("Register scope in this transport:")[2]
    assert "source_classification" in cuts and "T2D.10" in cuts
    assert all(ident not in cuts for ident in restored)


def test_portfolio_debate_adds_portfolio_fit_for_scoped_security_selection() -> None:
    selection = cpos_custom.complete(["CP-3", "CP-3A", "CP-6"], owned=())
    assert selection.phases == {"CP-3": ("CP-3A", "CP-3B")}
    assert selection.phase_reasons == {"CP-3B": "Needed by Portfolio posture."}


def test_alias_request_without_parent_is_refused() -> None:
    with pytest.raises(cpos_custom.CustomRefused, match="phase of Legal & covenants"):
        cpos_custom.complete(["CP-4D"], owned=())


def test_structural_phase_evidence_checks_match_the_handoff_scope(tmp_path: Path) -> None:
    """Synthetic Northbridge, 2025-03-31. Missing capacity is outside structural scope."""
    prepared = _prepare(tmp_path, "CP-4", "CP-4B")
    task = HandoffTask(prepared.plan.run, "CP-4", b"", {}, {}, 1, ())
    path = tmp_path / "checks.json"
    _retain_method_checks(
        path, task, b"## Request\n\nAnalysis scope: Core analysis and Structural priority.\n"
    )
    checks = json.loads(path.read_text())["checks"]
    assert checks
    assert all("covenant_headroom.py" not in row["script"] for row in checks)
    assert all(row["status"] == "not checked" for row in checks if row["register"] == "T4C.4")


@pytest.mark.parametrize(
    ("module", "phase", "restored", "still_cut"),
    [
        ("CP-2A", "CP-2B", ("T5.1", "T5.2", "T5.3", "T5.4"), ("T5.6", "T2B.3")),
        ("CP-3", "CP-3A", ("T3B.2", "T3B.8", "T3B.11"), ("T3C.1", "T3.4")),
        ("CP-3", "CP-3B", ("T3C.1", "T3C.9"), ("T3B.2", "T3.4")),
        ("CP-5", "CP-5A", ("T5.1", "T5.6", "T5.9"), ("T5B.4", "T5B.8")),
    ],
)
def test_phase_scope_keeps_core_cuts_and_omits_sibling_registers(
    module: str, phase: str, restored: tuple[str, ...], still_cut: tuple[str, ...]
) -> None:
    required = cpos_launch.required_registers(module, "custom", (phase,))
    assert set(restored) <= set(required)
    assert set(still_cut).isdisjoint(required)


def test_recovery_scope_adds_legal_priority_and_security_reach() -> None:
    selection = cpos_custom.complete(["CP-4C", "CP-4", "CP-4A"], owned=())
    assert selection.phases == {"CP-4": ("CP-4A", "CP-4B", "CP-4D")}
    assert selection.phase_reasons == {
        "CP-4D": "Needed by the recovery assessment.",
        "CP-4B": "Needed by Intercreditor control.",
    }


def test_handoff_cannot_report_an_unticked_phase(tmp_path: Path) -> None:
    prepared = _prepare(tmp_path, "CP-4", "CP-4B")
    assert prepared.plan.run.phase_selection == {"CP-4": ("CP-4B",)}
    text = "### T4C.4 Covenant headroom\n\n### T4F.2 Intercreditor priority"
    issues = cpos_launch.register_issues("CP-4", text, "custom", ("CP-4B",))
    assert "Registers outside this analysis scope: T4C.4, T4F.2." in issues


def test_resume_keeps_the_pinned_phase_scope(tmp_path: Path) -> None:
    first = _prepare(tmp_path, "CP-4", "CP-4D")
    pinned = first.manifest.read_bytes()

    def resume(*modules: str) -> cpos_launch.Prepared:
        return cpos_launch.prepare(
            tmp_path / "context.json",
            tmp_path / "issuer",
            tmp_path / "run",
            config="copilot-sol-medium",
            cap="9",
            modules=modules,
        )

    assert resume("CP-4D", "CP-4").manifest.read_bytes() == pinned
    with pytest.raises(cpos_launch.LaunchRefused, match="holds a different request"):
        resume("CP-4", "CP-4B")
    assert first.manifest.read_bytes() == pinned
