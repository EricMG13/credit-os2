"""Period chart tables with no body rows, and a malformed liquidity header beside net debt."""

from deploy_workflow.owners.cpos_launch_tables import (
    NET_DEBT,
    OwnerTable,
    _chart_header,
    _net_debt_issues,
    chart_issues,
)

LEVERAGE = OwnerTable("Chart data: leverage", ("Total debt / EBITDA", "Net debt / EBITDA"), "x")
NET_DEBT_TABLE = (
    "### Net debt data\n\n"
    "| Period | Gross debt | Cash | Net debt | Reporting unit | Basis and limitation |\n"
    "| --- | --- | --- | --- | --- | --- |\n"
    "| FY2024 | 100 | 20 | 80 | US$m | b |\n\n"
)


def test_period_table_with_header_and_no_rows_is_refused():
    header = _chart_header(LEVERAGE)
    text = (
        "### Chart data: leverage\n\n"
        f"| {' | '.join(header)} |\n"
        f"| {' | '.join('---' for _ in header)} |\n"
    )
    assert chart_issues(text, LEVERAGE, money="US$m") == (
        "`### Chart data: leverage` needs at least one row.",
    )


def test_net_debt_check_ignores_a_one_cell_liquidity_header():
    text = (
        NET_DEBT_TABLE
        + "### Chart data: liquidity\n\n| Period |\n| --- |\n| FY2024 | 20 | 5 | US$m | b |\n"
    )
    assert NET_DEBT.heading == "Net debt data"
    assert _net_debt_issues(text) == ()


def test_plain_number_is_ungrouped_or_grouped_in_threes():
    from deploy_workflow.owners.cpos_launch_tables import PLAIN_NUMBER

    for good in ("7", "-7", "1,234", "12,345,678", "-1,234.5", "0.25"):
        assert PLAIN_NUMBER.fullmatch(good), good
    for bad in ("1,5", "12,34,5", "1,2345", ",123", "1,234,56"):
        assert PLAIN_NUMBER.fullmatch(bad) is None, bad
