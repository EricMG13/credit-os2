"""PR 7a task 2 (owner, 2026-11-26): a custom run's handoff rules, estimate and cap in the launcher.
Offline, synthetic, no provider.

Answer key: `KEY` below is the frozen answer key of the PR (.superpowers/sdd/pr-7a-custom-routing/
answer-key-caps.md), copied as literals: the figures are plain Decimal arithmetic on the layer-1
ruling's "Estimated spend against the caps", not read from production code."""

from __future__ import annotations

import json
import re
from decimal import Decimal
from pathlib import Path
from typing import NamedTuple

import pytest
from library_fixtures import make_custom_run
from test_cpos_launch import context_file, issuer_folder

from deploy_vii import registry
from deploy_vii.contracts import MODULE_ESTIMATE_USD, PATHWAY_MODULES
from deploy_workflow.credit_os_chips import MODULE_NAMES
from deploy_workflow.model.configs import CONFIGS
from deploy_workflow.owners import cpos_custom, cpos_launch
from deploy_workflow.owners.cpos_launch import LaunchRefused, Prepared, main, prepare, run_cap

MEDIUM, HIGH = "copilot-sol-medium", "copilot-sol-high"
HOLD = Decimal("7.17")
CP8_REASON = "Compares this run with the earlier run named in this summary."
SOURCE_REASON = "Every run needs the source register and the financial base."
# Balanced sends these to high effort (`BALANCED_HIGH_MODULES`), written out here from the key.
BALANCED = frozenset({"CP-1A", "CP-1D", "CP-2", "CP-2A", "CP-3", "CP-3C", "CP-4", "CP-4C", "CP-6"})
CHOSEN = {
    "governance": ["CP-1A", "CP-2E"],
    "covenant": ["CP-4"],
    "portfolio": ["CP-6"],
    "full": [m for m in PATHWAY_MODULES["credit_snapshot"] if m != "CP-MODEL"],
    "cpdr": ["CP-DR", "CP-4", "CP-1C"],
}


# (selection, with CP-8, effort, per-module figures in planned order, sum, hold, cap)
class Key(NamedTuple):
    selection: str
    cp8: bool
    effort: str
    per: str
    total: str
    hold: str
    cap: int


KEY = [
    Key(
        "governance",
        False,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2E 0.66"),
        "1.92",
        "7.17",
        10,
    ),
    Key(
        "governance",
        False,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2E 0.66"),
        "2.03",
        "7.17",
        10,
    ),
    Key(
        "governance",
        False,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2E 0.80"),
        "2.52",
        "7.17",
        10,
    ),
    Key(
        "governance",
        True,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2E 0.66 CP-8 0.26"),
        "2.18",
        "7.17",
        10,
    ),
    Key(
        "governance",
        True,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2E 0.66 CP-8 0.26"),
        "2.29",
        "7.17",
        10,
    ),
    Key(
        "governance",
        True,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2E 0.80 CP-8 0.36"),
        "2.88",
        "7.17",
        11,
    ),
    Key(
        "covenant",
        False,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-4 0.37"),
        "1.08",
        "7.17",
        9,
    ),
    Key(
        "covenant",
        False,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-4 0.37"),
        "1.08",
        "7.17",
        9,
    ),
    Key(
        "covenant",
        False,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-4 0.37"),
        "1.43",
        "7.17",
        9,
    ),
    Key(
        "covenant",
        True,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-4 0.37 CP-8 0.20"),
        "1.28",
        "7.17",
        9,
    ),
    Key(
        "covenant",
        True,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-4 0.37 CP-8 0.20"),
        "1.28",
        "7.17",
        9,
    ),
    Key(
        "covenant",
        True,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-4 0.37 CP-8 0.27"),
        "1.70",
        "7.17",
        9,
    ),
    Key(
        "portfolio",
        False,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2 0.44 CP-3 0.80 CP-5 1.13  CP-6 0.73"),
        "4.36",
        "7.17",
        12,
    ),
    Key(
        "portfolio",
        False,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.13  CP-6 0.99"),
        "5.07",
        "7.17",
        13,
    ),
    Key(
        "portfolio",
        False,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.40  CP-6 0.99"),
        "5.69",
        "7.17",
        13,
    ),
    Key(
        "portfolio",
        True,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-2 0.44 CP-3 0.80 CP-5 1.13  CP-6 0.73 CP-8 0.46"),
        "4.82",
        "7.17",
        12,
    ),
    Key(
        "portfolio",
        True,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.13  CP-6 0.99 CP-8 0.46"),
        "5.53",
        "7.17",
        13,
    ),
    Key(
        "portfolio",
        True,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-2 0.61 CP-3 0.97 CP-5 1.40  CP-6 0.99 CP-8 0.63"),
        "6.32",
        "7.17",
        14,
    ),
    Key(
        "full",
        False,
        "fast",
        (
            "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35  "
            "CP-1D 0.53 CP-2 0.44 CP-4 0.37 CP-2A 0.62 CP-2E 0.66 CP-2D 0.51  "
            "CP-2G 0.41 CP-3C 0.51 CP-3 0.80 CP-5 3.39 CP-6 0.73"
        ),
        "11.38",
        "7.17",
        19,
    ),
    Key(
        "full",
        False,
        "balanced",
        (
            "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35  "
            "CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.66 CP-2D 0.51  "
            "CP-2G 0.41 CP-3C 0.67 CP-3 0.97 CP-5 3.39 CP-6 0.99"
        ),
        "12.84",
        "7.17",
        21,
    ),
    Key(
        "full",
        False,
        "high",
        (
            "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-1B 0.69 CP-DR 0.44 CP-1C 0.46  "
            "CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.80 CP-2D 0.67  "
            "CP-2G 0.77 CP-3C 0.67 CP-3 0.97 CP-5 4.20 CP-6 0.99"
        ),
        "15.10",
        "7.17",
        23,
    ),
    Key(
        "full",
        True,
        "fast",
        (
            "CP-0 0.29 CP-1 0.42 CP-1A 0.55 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35  "
            "CP-1D 0.53 CP-2 0.44 CP-4 0.37 CP-2A 0.62 CP-2E 0.66 CP-2D 0.51  "
            "CP-2G 0.41 CP-3C 0.51 CP-3 0.80 CP-5 3.39 CP-6 0.73 CP-8 1.12"
        ),
        "12.50",
        "7.17",
        20,
    ),
    Key(
        "full",
        True,
        "balanced",
        (
            "CP-0 0.29 CP-1 0.42 CP-1A 0.66 CP-1B 0.52 CP-DR 0.28 CP-1C 0.35  "
            "CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.66 CP-2D 0.51  "
            "CP-2G 0.41 CP-3C 0.67 CP-3 0.97 CP-5 3.39 CP-6 0.99 CP-8 1.12"
        ),
        "13.96",
        "7.17",
        22,
    ),
    Key(
        "full",
        True,
        "high",
        (
            "CP-0 0.43 CP-1 0.63 CP-1A 0.66 CP-1B 0.69 CP-DR 0.44 CP-1C 0.46  "
            "CP-1D 0.94 CP-2 0.61 CP-4 0.37 CP-2A 0.80 CP-2E 0.80 CP-2D 0.67  "
            "CP-2G 0.77 CP-3C 0.67 CP-3 0.97 CP-5 4.20 CP-6 0.99 CP-8 1.53"
        ),
        "16.63",
        "7.17",
        24,
    ),
    Key(
        "cpdr",
        False,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35"),
        "1.71",
        "7.17",
        9,
    ),
    Key(
        "cpdr",
        False,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35"),
        "1.71",
        "7.17",
        9,
    ),
    Key(
        "cpdr",
        False,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-DR 0.44 CP-4 0.37 CP-1C 0.46"),
        "2.33",
        "7.17",
        10,
    ),
    Key(
        "cpdr",
        True,
        "fast",
        ("CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35 CP-8 0.33"),
        "2.04",
        "7.17",
        10,
    ),
    Key(
        "cpdr",
        True,
        "balanced",
        ("CP-0 0.29 CP-1 0.42 CP-DR 0.28 CP-4 0.37 CP-1C 0.35 CP-8 0.33"),
        "2.04",
        "7.17",
        10,
    ),
    Key(
        "cpdr",
        True,
        "high",
        ("CP-0 0.43 CP-1 0.63 CP-DR 0.44 CP-4 0.37 CP-1C 0.46 CP-8 0.45"),
        "2.78",
        "7.17",
        10,
    ),
]
PRESETS = [key for key in KEY if key.selection != "full"]


def _figures(text: str) -> list[tuple[str, Decimal]]:
    words = text.split()
    return [(words[i], Decimal(words[i + 1])) for i in range(0, len(words), 2)]


def _high(effort: str, modules: tuple[str, ...]) -> frozenset[str]:
    return {"fast": frozenset(), "balanced": BALANCED, "high": frozenset(modules)}[effort]


def _owned() -> frozenset[str]:
    return cpos_launch.custom_owned_modules()


@pytest.mark.parametrize("key", KEY, ids=lambda k: f"{k.selection}-{k.cp8}-{k.effort}")
def test_the_estimate_is_the_answer_keys_per_module_figures_sum_hold_and_cap(key):
    selection, cp8, effort, per, total, hold, cap = key
    done = cpos_custom.complete(CHOSEN[selection], owned=_owned())
    planned = (*done.modules, *(("CP-8",) if cp8 else ()))
    estimate = cpos_custom.estimate(
        done, compared=cp8, high=_high(effort, planned), hold=Decimal(hold)
    )
    assert [(row.module, row.figure) for row in estimate.rows] == _figures(per)
    assert estimate.total == Decimal(total)
    assert estimate.hold == Decimal(hold)
    assert estimate.cap == cap
    for row in estimate.rows:
        assert row.name == MODULE_NAMES[row.module]
        assert row.measured is MODULE_ESTIMATE_USD[row.module].measured


def _earlier_run(tmp_path: Path, completed: tuple[str, ...]) -> None:
    """A listed earlier custom run of the same issuer, as the launcher records one (pathway
    `custom`, selection `explicit`, `requested_modules` the completed list), so CP-8 is planned."""
    make_custom_run(tmp_path / "ws", "prior-1", completed, as_of="2024-12-31")


def _completed(tmp_path: Path, chosen: list[str]) -> tuple[str, ...]:
    """What a first run of `chosen` records as its modules: its own `prepare`, in a workspace of its
    own where no earlier run exists."""
    probe = tmp_path / "probe"
    probe.mkdir()
    first = prepare(
        context_file(probe, "custom"),
        issuer_folder(probe),
        probe / "ws/runs/first",
        config=MEDIUM,
        cap=None,
        modules=chosen,
    )
    return first.plan.run.requested_modules


def _prepared(
    tmp_path: Path,
    chosen: list[str],
    *,
    config: str = MEDIUM,
    cap: str | None = None,
    high: tuple[str, ...] = (),
) -> Prepared:
    workspace = tmp_path / "ws"
    return prepare(
        context_file(tmp_path, "custom"),
        issuer_folder(tmp_path),
        workspace / "runs/cur",
        config=config,
        cap=cap,
        modules=chosen,
        high_modules=high,
    )


@pytest.mark.parametrize("key", PRESETS, ids=lambda k: f"{k.selection}-{k.cp8}-{k.effort}")
def test_prepare_launches_a_custom_run_at_the_answer_keys_cap(tmp_path, key):
    selection, cp8, effort, per, total, hold, cap = key
    if cp8:  # the key's own module list less CP-8: what the earlier run completed
        _earlier_run(tmp_path, tuple(m for m, _ in _figures(per) if m != "CP-8"))
    prepared = _prepared(
        tmp_path,
        CHOSEN[selection],
        config=HIGH if effort == "high" else MEDIUM,
        high=tuple(BALANCED) if effort == "balanced" else (),
    )
    assert prepared.estimate is not None
    assert [(row.module, row.figure) for row in prepared.estimate.rows] == _figures(per)
    assert (prepared.estimate.total, prepared.estimate.hold) == (Decimal(total), Decimal(hold))
    assert prepared.estimate.cap == cap
    assert prepared.plan.provider_cap_usd == Decimal(cap)
    assert ("CP-8" in prepared.ordered) is cp8
    assert Decimal(json.loads(prepared.manifest.read_text())["provider_cap_usd"]) == Decimal(cap)


def test_the_estimates_hold_is_quantized_to_the_cent_like_the_other_figures(tmp_path):
    prepared = _prepared(tmp_path, ["CP-1A", "CP-2E"])
    assert prepared.estimate is not None
    assert str(prepared.estimate.hold) == "7.17"
    done = cpos_custom.complete(["CP-4"], owned=_owned())
    raw = cpos_custom.estimate(done, compared=False, high=frozenset(), hold=Decimal("7.170000"))
    assert str(raw.hold) == "7.17"
    assert raw.cap == cpos_custom.estimate(done, compared=False, high=frozenset(), hold=HOLD).cap


def test_a_custom_folder_resumed_with_other_effort_flags_is_told_the_flags_not_a_cap(tmp_path):
    kw = {"config": MEDIUM, "modules": ["CP-6"]}
    context, sources, out = (
        context_file(tmp_path, "custom"),
        issuer_folder(tmp_path),
        tmp_path / "o",
    )
    prepare(context, sources, out, cap=None, **kw)  # started with no effort flag: cap 12
    with pytest.raises(LaunchRefused) as plain:
        prepare(context, sources, out, cap=None, high_modules=tuple(BALANCED), **kw)
    assert "started at a cap of USD 12" in str(plain.value)
    assert "resume it without --balanced or --high-modules" in str(plain.value)
    assert "--cap" not in str(plain.value)
    out2 = tmp_path / "o2"
    prepare(context, sources, out2, cap=None, high_modules=tuple(BALANCED), **kw)
    with pytest.raises(LaunchRefused) as balanced:
        prepare(context, sources, out2, cap=None, **kw)
    assert "started at a cap of USD 13" in str(balanced.value)
    assert "resume it with --balanced" in str(balanced.value)
    assert "--cap" not in str(balanced.value)
    out3 = tmp_path / "o3"
    whole = {"config": MEDIUM, "modules": CHOSEN["full"]}  # every module at high: USD 23
    prepare(context, sources, out3, cap=None, high_modules=tuple(CHOSEN["full"]), **whole)
    with pytest.raises(LaunchRefused) as named:
        prepare(context, sources, out3, cap=None, **whole)
    assert "started at a cap of USD 23" in str(named.value)
    assert "resume it with the --high-modules it was started with" in str(named.value)
    assert "--cap" not in str(named.value)


@pytest.mark.parametrize(
    "entry", [*cpos_custom.NOT_CHOOSABLE, "CP-L20", "CP-L23", "CP-L30", "CP-L40"]
)
def test_a_refusal_is_in_reader_words_and_never_advises_a_refused_module(entry):
    with pytest.raises(cpos_custom.CustomRefused) as raised:
        cpos_custom.complete(["CP-4", entry], owned=_owned())
    assert "CP-" not in str(raised.value)
    assert "choose Short credit snapshot" not in str(raised.value)


def test_the_phases_of_the_short_credit_snapshot_say_why_it_is_not_offered():
    for alias in ("CP-L20", "CP-L23", "CP-L30", "CP-L40"):
        with pytest.raises(cpos_custom.CustomRefused) as raised:
            cpos_custom.complete([alias], owned=_owned())
        assert str(raised.value) == (
            "Short credit snapshot belongs to the credit screening and cannot be chosen here, "
            "so neither can its phases."
        )


@pytest.mark.parametrize("config", [MEDIUM, HIGH])
@pytest.mark.parametrize("research", [False, True])
@pytest.mark.parametrize("earlier", [False, True])
def test_the_estimates_hold_is_the_hold_the_launcher_checks(tmp_path, config, research, earlier):
    chosen = ["CP-DR", "CP-4"] if research else ["CP-4"]
    if earlier:
        _earlier_run(tmp_path, _completed(tmp_path, chosen))
    prepared = _prepared(tmp_path, chosen, config=config)
    assert prepared.estimate is not None
    assert prepared.estimate.hold == prepared.hold == HOLD
    assert ("CP-DR" in prepared.ordered) is research
    assert ("CP-8" in prepared.ordered) is earlier


# --- completion ---------------------------------------------------------------------------


def test_the_advanced_presets_complete_to_the_registrys_lists():
    assert cpos_custom.complete(CHOSEN["governance"], owned=_owned()).modules == (
        *("CP-0", "CP-1", "CP-1A", "CP-2E"),
    )
    assert cpos_custom.complete(CHOSEN["covenant"], owned=_owned()).modules == (
        *("CP-0", "CP-1", "CP-4"),
    )
    assert cpos_custom.complete(CHOSEN["portfolio"], owned=_owned()).modules == (
        *("CP-0", "CP-1", "CP-1A", "CP-2", "CP-3", "CP-5", "CP-6"),
    )


def test_each_added_module_says_why_and_a_chosen_module_never_does():
    done = cpos_custom.complete(["CP-6"], owned=_owned())
    assert done.reasons == {
        "CP-0": SOURCE_REASON,
        "CP-1": SOURCE_REASON,
        "CP-1A": "Needed by Fundamental credit.",
        "CP-2": "Needed by Security selection and Committee decision.",
        "CP-3": "Needed by Committee decision.",
        "CP-5": "Needed by Committee decision.",
    }
    chosen = cpos_custom.complete(["CP-0", "CP-1", "CP-1A"], owned=_owned())
    assert chosen.modules == ("CP-0", "CP-1", "CP-1A")
    assert chosen.reasons == {}
    assert all("CP-" not in reason for reason in done.reasons.values())


def test_cp_model_in_a_request_is_accepted_and_changes_nothing():
    assert cpos_custom.complete(["CP-4", "CP-MODEL"], owned=_owned()) == cpos_custom.complete(
        ["CP-4"], owned=_owned()
    )


def test_cp8_is_added_only_by_the_estimate_with_its_fixed_reason():
    done = cpos_custom.complete(["CP-4"], owned=_owned())
    assert "CP-8" not in done.modules
    with_cp8 = cpos_custom.estimate(done, compared=True, high=frozenset(), hold=HOLD)
    without = cpos_custom.estimate(done, compared=False, high=frozenset(), hold=HOLD)
    assert [r.module for r in with_cp8.rows][-1] == "CP-8"
    assert with_cp8.rows[-1].added == CP8_REASON
    assert "CP-8" not in [r.module for r in without.rows]
    assert [r.added for r in without.rows] == [
        SOURCE_REASON,
        SOURCE_REASON,
        None,
    ]


@pytest.mark.parametrize(
    ("entry", "words"),
    [
        ("CP-4A", "a phase of Legal & covenants"),
        ("CP-8", "planned automatically"),
        ("CP-L10", "credit screening"),
        ("CP-MEMO", "The memo is replaced by the deliverables"),
        ("CP-OS", "The run's orchestrator is not a module"),
        ("CP-NOPE", "CP-NOPE"),
    ],
)
def test_what_the_launcher_cannot_complete_is_refused_naming_the_entry(entry, words):
    with pytest.raises(cpos_custom.CustomRefused, match=re.escape(words)) as raised:
        cpos_custom.complete(["CP-4", entry], owned=_owned())
    assert isinstance(raised.value, ValueError)


@pytest.mark.parametrize("entry", ["CP-4A", "CP-8", "CP-L10", "CP-MEMO", "CP-OS", "CP-NOPE"])
def test_the_launcher_turns_a_refused_selection_into_a_launch_refusal(tmp_path, entry):
    with pytest.raises(LaunchRefused):
        _prepared(tmp_path, ["CP-4", entry])
    assert not (tmp_path / "ws/runs/cur").exists()


def test_a_module_that_owns_no_block_of_the_composition_is_flagged_never_refused(tmp_path):
    offered = [
        m.module_id
        for m in registry.modules()
        if m.module_id not in ("CP-8", "CP-L10", "CP-MEMO", "CP-OS", "CP-MODEL")
    ]
    assert {m for m in offered if m not in _owned()} == {"CP-0", "CP-DR", "CP-2E", "CP-5"}
    prepared = _prepared(tmp_path, ["CP-DR", "CP-2E", "CP-4"])
    assert prepared.estimate is not None
    flagged = {r.module for r in prepared.estimate.rows if r.modules_page_only}
    assert flagged == {"CP-0", "CP-DR", "CP-2E"}


# --- the cap --------------------------------------------------------------------------------


def test_a_custom_run_with_no_cap_asked_launches_at_its_computed_cap(tmp_path):
    prepared = _prepared(tmp_path, ["CP-1A", "CP-2E"], cap=None)
    assert prepared.plan.provider_cap_usd == Decimal(10)
    assert run_cap("custom", None) is None  # never the table's USD 50
    assert run_cap("custom", Decimal(10)) == Decimal(10)


def test_the_computed_cap_asked_for_explicitly_is_accepted(tmp_path):
    assert _prepared(tmp_path, ["CP-1A", "CP-2E"], cap="10").plan.provider_cap_usd == Decimal(10)


@pytest.mark.parametrize("asked", ["9", "7.17", "11", "50"])
def test_any_other_cap_is_refused_lower_included(tmp_path, asked):
    with pytest.raises(
        LaunchRefused,
        match=re.escape(
            f"--cap {asked}: this custom selection's cap is USD 10; review the summary again"
        ),
    ):
        _prepared(tmp_path, ["CP-1A", "CP-2E"], cap=asked)
    assert not (tmp_path / "ws/runs/cur").exists()


def test_a_cap_above_the_ceiling_is_still_refused_whoever_asks():
    with pytest.raises(LaunchRefused, match="above the custom cap"):
        run_cap("custom", Decimal(51))


@pytest.mark.parametrize("config", sorted(set(CONFIGS) - {MEDIUM, HIGH}))
def test_a_custom_run_on_any_other_config_is_refused(tmp_path, config):
    with pytest.raises(
        LaunchRefused,
        match=re.escape("A custom selection is estimated from GPT runs only; choose GPT."),
    ):
        _prepared(tmp_path, ["CP-4"], config=config)


def test_the_requested_modules_are_the_completed_list_in_planned_order(tmp_path):
    prepared = _prepared(tmp_path, ["CP-2E", "CP-1A"])
    assert prepared.plan.run.requested_modules == ("CP-0", "CP-1", "CP-1A", "CP-2E")
    assert prepared.ordered == prepared.plan.run.requested_modules


def test_the_estimate_is_for_custom_runs_only(tmp_path):
    context = context_file(tmp_path, "covenant_refinancing")
    prepared = prepare(
        context, issuer_folder(tmp_path), tmp_path / "out", config="sol-medium", cap="15"
    )
    assert prepared.estimate is None


# --- the efforts the estimate prices are the efforts the launch sends ---------------------


@pytest.mark.parametrize(
    "run",
    [
        ("fast", MEDIUM, ()),
        ("balanced", MEDIUM, ("--balanced",)),
        ("high", HIGH, ()),
        ("high-list", MEDIUM, ("--high-modules", "CP-4", "CP-1")),
    ],
    ids=lambda r: r[0],
)
def test_the_estimates_high_set_is_the_set_main_sends_at_high(tmp_path, monkeypatch, capsys, run):
    effort, config, flags = run
    seen: list[Prepared] = []
    real = cpos_launch._readiness

    def readiness(prepared, *args, **kwargs):
        seen.append(prepared)
        return real(prepared, *args, **kwargs)

    monkeypatch.setattr(cpos_launch, "_readiness", readiness)
    argv = [
        *("--context", str(context_file(tmp_path, "custom"))),
        *("--sources", str(issuer_folder(tmp_path))),
        *("--config", config),
        *("--out", str(tmp_path / "ws/runs/cur")),
        *("--modules", "CP-1A", "CP-4", "CP-2", "CP-2E"),
        *flags,
    ]
    assert main([*argv, "--no-library"]) == 0
    (prepared,) = seen
    out = capsys.readouterr().out
    line = re.search(r"^Effort:\s+high for (.+?); \w+ otherwise$", out, re.MULTILINE)
    sent = set(line[1].split(", ")) if line else set()
    if CONFIGS[config].effort == "high":
        sent = set(prepared.ordered)
    assert prepared.estimate is not None
    assert {row.module for row in prepared.estimate.rows if row.high} == sent
    expected = {
        "fast": set(),
        "balanced": BALANCED & set(prepared.ordered),
        "high": set(prepared.ordered),
        "high-list": {"CP-4", "CP-1"},
    }[effort]
    assert sent == expected


def test_the_readiness_print_has_a_line_per_module_and_the_sum_hold_and_cap(tmp_path, capsys):
    argv = [
        *("--context", str(context_file(tmp_path, "custom"))),
        *("--sources", str(issuer_folder(tmp_path))),
        *("--config", MEDIUM, "--modules", "CP-1A", "CP-2E"),
        *("--out", str(tmp_path / "ws/runs/cur"), "--no-library"),
    ]
    assert main(argv) == 0
    out = capsys.readouterr().out
    for module, figure in (
        ("CP-0", "0.29"),
        ("CP-1", "0.42"),
        ("CP-1A", "0.55"),
        ("CP-2E", "0.66"),
    ):
        assert re.search(rf"^\s+{module}\s+.*{figure}", out, re.MULTILINE), module
    assert re.search(
        r"^Estimate:\s+USD 1\.92 for \d+ modules, hold USD 7\.17, cap USD 10$", out, re.MULTILINE
    )
    assert "Cap:      USD 10 " in out


def test_a_custom_cap_above_the_ceiling_is_not_told_to_ask_lower():
    # A custom run launches only at its computed cap, so a lower --cap is refused too (C13).
    with pytest.raises(LaunchRefused) as raised:
        run_cap("custom", Decimal(51))
    text = str(raised.value)
    assert "lower cap" not in text
    assert "computed from the chosen modules" in text
    assert "leave --cap out" in text
