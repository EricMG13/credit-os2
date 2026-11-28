"""C10 fix A: wider credit-agreement and indenture titles, wrapped amendment titles, and export
findings that always name their file. Expected values are literal."""

from __future__ import annotations

import pytest

from deploy_vii.inputs.rv_quotes import Issue
from deploy_workflow.portfolio_workbook import finding_text
from deploy_workflow.run_expectations import guess_kind


def _kind(name: str, *lines: str) -> str:
    return guess_kind(name, ["\n".join(lines)] if lines else [""]).kind


@pytest.mark.parametrize(
    ("title", "kind"),
    [
        ("FIRST LIEN CREDIT AGREEMENT", "credit_agreement"),
        ("TERM LOAN CREDIT AGREEMENT", "credit_agreement"),
        ("SECOND AMENDED AND RESTATED CREDIT AGREEMENT", "credit_agreement"),
        ("SENIOR SECURED CREDIT AGREEMENT", "credit_agreement"),
        ("SENIOR NOTES INDENTURE", "indenture"),
    ],
)
def test_qualified_titles_are_recognised(title: str, kind: str) -> None:
    assert _kind("a.pdf", title, "among the Borrower and the Lenders") == kind


@pytest.mark.parametrize("name", ["TDG_Credit_Agreement.pdf", "Executed_Credit_Agreement.pdf"])
def test_file_names_with_an_empty_cover_are_recognised(name: str) -> None:
    assert guess_kind(name, [""]).kind == "credit_agreement"


@pytest.mark.parametrize(
    "line",
    [
        "Lenders under the credit agreement may demand repayment.",
        "The Borrower entered into a credit agreement with the Lenders.",
        "Our senior secured credit agreement matures in 2029.",
    ],
)
def test_prose_mentioning_a_credit_agreement_stays_unrecognised(line: str) -> None:
    assert _kind("notes.txt", line) == "unrecognised"


@pytest.mark.parametrize(
    ("title", "kind"),
    [
        ("CREDIT AGREEMENT", "credit_agreement"),
        ("THIS CREDIT AGREEMENT", "credit_agreement"),
        ("AMENDED AND RESTATED CREDIT AGREEMENT", "credit_agreement"),
        ("SECOND SUPPLEMENTAL INDENTURE", "indenture"),
        ("INDENTURE", "indenture"),
        ("AMENDMENT NO. 3 TO CREDIT AGREEMENT", "amendment"),
    ],
)
def test_titles_recognised_before_stay_recognised(title: str, kind: str) -> None:
    assert _kind("a.pdf", title) == kind


def test_a_file_name_keeps_its_title_start_reading() -> None:
    assert guess_kind("Amendment_No_3_to_Credit_Agreement.pdf", [""]).kind == "amendment"
    assert guess_kind("Credit_Agreement_and_Indenture.pdf", [""]).kind == "credit_agreement"


@pytest.mark.parametrize(
    "lines",
    [
        ("AMENDMENT NO. 3 TO", "CREDIT AGREEMENT"),
        ("FIRST AMENDMENT TO", "CREDIT AGREEMENT"),
    ],
)
def test_a_wrapped_amendment_title_is_the_amendment(lines: tuple[str, ...]) -> None:
    assert _kind("a.pdf", *lines) == "amendment"


def test_an_amendment_line_then_a_separate_agreement_title_stays_ambiguous() -> None:
    assert _kind("a.pdf", "AMENDMENT NO. 3", "CREDIT AGREEMENT") == "unrecognised"


def test_an_export_finding_at_a1_names_its_file() -> None:
    issue = Issue(
        file="exposure.csv", sheet="layout", cell="A1", problem="no sections found", fix="x"
    )
    assert finding_text(issue, export=True) == "exposure.csv, layout, A1: no sections found"


def test_a_workbook_finding_is_unchanged() -> None:
    issue = Issue(file="w.xlsx", sheet="Limits", cell="B4", problem="blank", fix="x")
    assert finding_text(issue) == "Limits!B4: blank"
    assert finding_text(issue, export=False) == "Limits!B4: blank"


# --- C10 fix round 2: regressions against BASE 030805f ---------------------------------------


@pytest.mark.parametrize(
    "name",
    [
        "Executed_Credit_Agreement_summary.pdf",  # BASE: unrecognised
        "TDG_Credit_Agreement_summary_executed.pdf",  # BASE: unrecognised
        "Q3_Credit_Agreement_Compliance_Certificate.pdf",  # BASE: unrecognised
        "Amendment_1_to_Credit_Agreement.pdf",  # BASE: unrecognised
        "TDG_Second_Amendment_Credit_Agreement_executed.pdf",  # BASE: unrecognised
        "TDG_Credit_Agreement_blackline.pdf",  # BASE: unrecognised
    ],
)
def test_a_file_name_with_a_summary_or_amendment_word_is_not_a_primary_agreement(
    name: str,
) -> None:
    assert guess_kind(name, [""]).kind == "unrecognised"


def test_title_start_file_names_with_those_words_keep_their_base_reading() -> None:
    assert guess_kind("Credit_Agreement_Memo.pdf", [""]).kind == "credit_agreement"  # BASE
    assert guess_kind("Second_Amendment_to_Credit_Agreement.pdf", [""]).kind == "amendment"  # BASE
    assert guess_kind("Notes_Indenture_2029.pdf", [""]).kind == "indenture"


@pytest.mark.parametrize(
    "line",
    [
        "The first lien credit agreement permits incremental debt up to USD 100 million.",
        "Senior notes indenture permits more debt",
        "Term loan credit agreement requires hedging",
        "FIRST LIEN CREDIT AGREEMENT among the Borrower",
    ],
)
def test_a_prose_line_with_a_qualifier_is_not_a_title(line: str) -> None:
    assert _kind("notes.txt", line) == "unrecognised"  # BASE: unrecognised


@pytest.mark.parametrize(
    ("line", "kind"),
    [
        ("FIRST LIEN CREDIT AGREEMENT dated as of June 1, 2024", "credit_agreement"),
        (
            "SECOND AMENDED AND RESTATED CREDIT AGREEMENT dated as of 12 June 2024",
            "credit_agreement",
        ),
        ("THE SENIOR NOTES INDENTURE.", "indenture"),
        ("The credit agreement permits more.", "credit_agreement"),  # BASE: title-start
    ],
)
def test_a_qualified_title_with_a_date_or_dot_is_a_title(line: str, kind: str) -> None:
    assert _kind("a.pdf", line) == kind
