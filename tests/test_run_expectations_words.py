"""The forecast rules' sentences are in the reader's words (owner, 2026-11-16: no raw data)."""

import re
from pathlib import Path

import pytest

from deploy_vii.context import load_context
from deploy_workflow import run_expectations as rx

ADD_QUOTES = "Add observed quotes under Observed quotes, or a quotes file."
ADD_EXECUTED = (
    "Add the executed agreement to the documents and choose it under Legal documents, "
    "or leave out CP-4."
)
FINANCIAL = (
    "No file is recognised as a financial report, earnings release or offering document "
    "with financial pages."
)
PRO_FORMA_FIX = "Add CP-1D to the modules."
LEGAL_FIX = "Add the executed agreement when it exists."

# rule id: (reason, fix); an unchanged cell holds the text at commit 75e04394.
WORDS = {
    "investment-grade": (
        (
            "You classified the issue as investment grade. The methods are written for "
            "high-yield and leveraged-loan credit; this forecast does not say whether that "
            "changes the conclusions."
        ),
        "",
    ),
    "cp1-no-financial-report-recognised": (
        FINANCIAL,
        "Add the financial report to the documents.",
    ),
    "cp1c-no-peer-source": (
        (
            "CP-1C has no peer set: no peers were chosen, or peers are to come from research "
            "and CP-DR is not in this run."
        ),
        "Choose a peer list under Valuation and peers, or add CP-DR.",
    ),
    "cp2-primary-no-cp1d": (
        "This is a new-issue run without CP-1D: the pro forma base row has no add-back verdicts.",
        PRO_FORMA_FIX,
    ),
    "cp2h-no-ratings": (
        (
            "No ratings were entered and no ratings file is recognised, so CP-2H reports "
            "Insufficient Information."
        ),
        "Enter the ratings under Ratings, or add a ratings file.",
    ),
    "cp3-talk-no-observed-quote": (
        "Indicative talk was entered, but there is no observed quote among your answers or files.",
        "Add an observed quote under Observed quotes, or a quotes file.",
    ),
    "cp3-no-quotes-no-talk": (
        "No quotes and no price talk were entered, and no quotes file is recognised.",
        ADD_QUOTES,
    ),
    "cp3d-no-quotes": (
        "No quotes were entered and no quotes file is recognised.",
        ADD_QUOTES,
    ),
    "cp4-declared-none": (
        (
            "No agreement is chosen among the documents, so CP-4 stops with "
            '"No executed governing document".'
        ),
        "Add the executed agreement and choose it under Legal documents, or leave out CP-4.",
    ),
    "cp4-declared-executed-none-recognised": (
        (
            "You said the agreement is executed, but no file is recognised as an executed "
            "credit agreement or indenture."
        ),
        ADD_EXECUTED,
    ),
    "cp4-declared-draft-none-recognised": (
        "You said the agreement is a draft, but no file is recognised as a draft agreement.",
        "Add the draft agreement to the documents.",
    ),
    "cp4-declared-draft-or-primary-no-executed-agreement": (
        (
            "Legal terms are Provisional: this is a new-issue run or the agreement is a draft, "
            "and no executed agreement is recognised."
        ),
        LEGAL_FIX,
    ),
    "portfolio-workbook-false": (
        "This is a Portfolio Decision run and no portfolio workbook was chosen.",
        "Add the portfolio workbook and choose it.",
    ),
}
BY_ID = {rule.key: rule for rule in rx.RULES}


@pytest.mark.parametrize("rule_id", sorted(WORDS))
def test_rule_sentences_are_the_reader_words(rule_id: str) -> None:
    reason, fix = WORDS[rule_id]
    assert (BY_ID[rule_id].reason, BY_ID[rule_id].fix) == (reason, fix)


RAW = (
    "entered by user",
    "declared",
    "(method:",
    "A-live",
    "in Context",
    "the sources",
    "Primary run",
)


@pytest.mark.parametrize("rule", rx.RULES, ids=lambda r: r.key)
def test_no_rule_sentence_holds_a_raw_fragment(rule: rx.Rule) -> None:
    for text in (rule.reason, rule.fix):
        assert not [raw for raw in RAW if raw in text]
        assert re.search(r"'[a-z_]+'", text) is None


def test_inherited_sentence_names_the_codes_that_it_reads() -> None:
    refuse = rx._inherit("CP-4A", ["CP-4"], {"CP-4A": {"CP-4": "block"}}, {"CP-4": "will_refuse"})
    assert refuse is not None
    assert refuse["reason"] == "Expected to refuse because it reads CP-4."
    edges = {"CP-3": {"CP-1": "restrict", "CP-2": "restrict"}}
    limited = rx._inherit("CP-3", ["CP-1", "CP-2"], edges, {"CP-1": "limited", "CP-2": "limited"})
    assert limited is not None
    assert limited["reason"] == "Expected to be limited because it reads CP-1, CP-2."


def test_an_omitted_section_is_named_by_its_reader_title_without_quotes_or_id() -> None:
    case = Path(__file__).resolve().parents[1] / "cases/cpdr-context-cutoff/context.json"
    context = load_context(case.read_bytes())
    [row] = [
        item
        for item in rx.expectations([], [], context, {}, omitted=["what-changed"])
        if item["id"].startswith("run:section-omitted")
    ]
    # The title copied from the specification: src/deploy_vii/report_view.py, _COMPOSITIONS.
    title = "What changed since the last Report"
    assert row["reason"] == f"This pathway does not produce the {title} report section."
    assert "'" not in row["reason"]
    assert "what-changed" not in row["reason"]
