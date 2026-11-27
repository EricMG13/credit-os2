"""Completeness columns: a declared column is not satisfied by a different declared column's
header (C12E-6), an unreadable table is not a missing column (C12E-8), and template and joined
critical columns are scanned for placeholders (C12E-10). Expected values are literal."""

import pytest

from deploy_workflow import method_scripts_completeness as mc


def outcomes(
    module: str, text: str, phases: tuple[str, ...] = ()
) -> dict[tuple[str, str], mc.Outcome]:
    return {(o.register, o.figure): o for o in mc.check(module, text, None, phases)}


@pytest.mark.parametrize(
    ("declared", "header", "others", "expected"),
    [
        ("Source", ["Source Trace"], ["Source Trace"], False),
        ("Status", ["Claim Status"], ["Claim Status"], False),
        ("Evidence", ["Evidence Quality"], ["Evidence Quality"], False),
        ("Source", ["Source Trace", "Source (doc)"], ["Source Trace"], True),
        ("Source", ["Source"], ["Source Trace"], True),
        ("Principal", ["Principal amount"], ["Maturity"], True),
        ("Interest", ["Cash interest"], [], True),
        ("Source", ["Source Trace"], [], True),
    ],
)
def test_present_a_header_of_another_declared_column_does_not_satisfy_this_one(
    declared: str, header: list[str], others: list[str], expected: bool
) -> None:
    assert mc._present(declared, header, others) is expected


T3B3_COLUMNS = [
    "Instrument",
    "Price",
    "Spread / Yield / DM",
    "Market Date",
    "Source",
    "Quote Quality",
    "Call Schedule",
    "Covenant Package",
    "Liquidity",
    "Source Trace",
]


def t3b3(columns: list[str]) -> str:
    head = "| " + " | ".join(columns) + " |\n|" + "---|" * len(columns) + "\n"
    row = "| " + " | ".join("x" for _ in columns) + " |\n\n"
    return f"---\nmodule_id: CP-3\n---\n\n## Findings\n\n### T3B.3 - Pricing\n\n{head}{row}"


def test_a_cp3_t3b3_without_source_is_missing_it_though_source_trace_is_there() -> None:
    columns = [c for c in T3B3_COLUMNS if c != "Source"]
    found = outcomes("CP-3", t3b3(columns), ("CP-3A",))[("T3B.3", "columns")]
    assert found.status == "missing"
    assert "`Source`" in found.reason


def test_a_cp3_t3b3_with_every_declared_column_is_agreed() -> None:
    assert outcomes("CP-3", t3b3(T3B3_COLUMNS), ("CP-3A",))[("T3B.3", "columns")].status == "agreed"


def test_a_register_split_with_an_unreadable_table_is_not_checked_not_missing() -> None:
    split = (
        "---\nmodule_id: CP-2E\n---\n\n## Findings\n\n"
        "### T2F.4 - Unhedged Exposure Table\n\n#### Exposure\n\n"
        "| Metric | Amount | Formula / Source | Status |\n|---|---|---|---|\n"
        "| Total debt | USD 2,000m | T2F.2 | Reported |\n\n#### Implication\n\n"
        "| Metric | Credit Implication | Source Trace |\n|---|---|---|\n"
        "| Total debt | S1 |\n\n"
    )
    found = outcomes("CP-2E", split)[("T2F.4", "columns")]
    assert found.status == "not checked"
    assert "a row of 2 cells under 3 columns" in found.reason


def test_tables_with_no_table_read_returns_the_first_reason() -> None:
    text = "### T2F.4 - X\n\n#### A\n\n| a | b |\n|---|---|\n| 1 |\n"
    read = mc.tables(text, "T2F.4")
    assert isinstance(read, str)
    assert read == "T2F.4's table has a row of 1 cells under 2 columns"


def test_a_joined_critical_column_written_as_two_is_scanned_for_placeholders() -> None:
    text = (
        "---\nmodule_id: CP-2E\n---\n\n## Findings\n\n### T2F.3 - Hedges\n\n"
        "| Hedge Type | Notional | Instrument Covered | Rate | Strike | Maturity | "
        "Coverage Status | Source Trace | Limitation |\n|" + "---|" * 9 + "\n"
        "| Swap | 1 | Loan | TBD | 3% | 2027 | Covered | S1 | None |\n\n"
    )
    found = outcomes("CP-2E", text)[("T2F.3", "placeholders")]
    assert found.status == "noted"
    assert "`Rate`" in found.reason


def test_a_template_critical_column_is_scanned_for_placeholders() -> None:
    text = (
        "---\nmodule_id: CP-1B\n---\n\n## Findings\n\n### T4.4 - Statements\n\n"
        "| Line Item | FY2023 | FY2024 | YoY Abs/% | Analyst Note |\n|---|---|---|---|---|\n"
        "| Revenue | TBD | 100 | 5% | ok |\n\n"
    )
    found = outcomes("CP-1B", text)[("T4.4", "placeholders")]
    assert found.status == "noted"
    assert "`FY2023`" in found.reason
