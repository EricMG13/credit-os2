"""The optional ``module_options`` block of ``context.json``."""

import json
from pathlib import Path

import pytest

from deploy_workflow.context import ContextRefused, ModuleOptions, load_context

FIXTURE = json.loads(
    (Path(__file__).resolve().parents[1] / "cases/context/research-minimal.json").read_text(
        encoding="utf-8"
    )
)


def with_key(key: str, value: object) -> bytes:
    return json.dumps({**FIXTURE, key: value}).encode()


def test_a_context_without_module_options_loads_and_equals_the_default():
    ctx = load_context(json.dumps(FIXTURE).encode())
    assert ctx.module_options == ModuleOptions()


def test_module_options_are_read():
    ctx = load_context(
        with_key("module_options", {"cp3_mode": "single_name_rv", "cp6_deep_debate": True})
    )
    assert ctx.module_options.cp3_mode == "single_name_rv"
    assert ctx.module_options.cp6_deep_debate is True


@pytest.mark.parametrize("bad", [{"cp3_mode": "fast"}, {"cp6_deep_debate": "yes"}, {"cp9": 1}])
def test_a_wrong_module_option_is_refused(bad):
    with pytest.raises(ContextRefused):
        load_context(with_key("module_options", bad))


def run_with(**changes: object) -> bytes:
    run = {k: v for k, v in FIXTURE["run"].items() if k != "reporting_currency"}
    return json.dumps({**FIXTURE, "run": {**run, **changes}}).encode()


@pytest.mark.parametrize("changes", [{}, {"reporting_currency": ""}, {"reporting_currency": "GBP"}])
def test_the_reporting_currency_is_optional(changes):
    """docs/rulings/2026-11-16-reporting-currency-from-sources.md: not asked, so absent or blank
    loads; a value given is kept."""
    ctx = load_context(run_with(**changes))
    assert ctx.run.reporting_currency == changes.get("reporting_currency", "")


@pytest.mark.parametrize("bad", ["usd", "US", "USDX"])
def test_a_reporting_currency_given_still_has_to_be_three_uppercase_letters(bad):
    with pytest.raises(ContextRefused) as refused:
        load_context(run_with(reporting_currency=bad))
    assert (
        "run.reporting_currency: use three uppercase letters, such as USD."
        in refused.value.problems
    )
