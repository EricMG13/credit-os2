"""Chart periods on the delivery paths (docs/superpowers/specs/2026-11-25-chart-periods.md).

Synthetic points, tables and one synthetic Model module, written here; no issuer evidence. Every
expected order is a literal written from the owner's ruling of 2026-11-25 (oldest fiscal year to
latest, then YTD, LTM, pro forma, forecasts), never read back from the ordering code.
"""

from decimal import Decimal

import pytest

from deploy_vii.contracts import Fact, ModuleView
from deploy_vii.report_view import _ChartPoint
from deploy_workflow import changes, markdown_delivery, model_handoff_delivery
from deploy_workflow import credit_os_catalogue as catalogue


def points(*categories: str, series: tuple[str, ...] = ("Total debt / EBITDA",)):
    """Points as `_numeric_observations` writes them for a period-rows table: row by row."""
    return tuple(
        _ChartPoint(series=name, category=category, fact_id=f"{name}.{category}")
        for category in categories
        for name in series
    )


def drawn(found) -> list[str]:
    return [point.category for point in found]


# ---------------------------------------------------------------- Markdown chart route (defect 3)
def test_ltm_and_pf_sit_after_fiscal_years_and_before_forecasts_oldest_first():
    written = points(
        "FY2026E", "PF FY2024", "LTM Jun 2025", "FY2024", "FY2025E", "LTM", "FY2022", "PF", "FY2023"
    )
    assert drawn(markdown_delivery._chronological(written)) == [
        "FY2022",
        "FY2023",
        "FY2024",
        "LTM Jun 2025",
        "LTM",
        "PF FY2024",
        "PF",
        "FY2025E",
        "FY2026E",
    ]
    assert markdown_delivery._undated_note(written) == ""


def test_two_digit_fiscal_years_are_ordered_not_left_as_written():
    assert drawn(markdown_delivery._chronological(points("FY25", "FY23", "FY24"))) == [
        "FY23",
        "FY24",
        "FY25",
    ]


def test_quarters_mixed_with_fiscal_years_are_placed_by_period_end():
    written = points("FY2024", "Q1 2025", "FY2023", "Q3 2024", "9M 2025", "H1 2024")
    assert drawn(markdown_delivery._chronological(written)) == [
        "FY2023",
        "H1 2024",
        "Q3 2024",
        "FY2024",
        "Q1 2025",
        "9M 2025",  # a year-to-date count is of the ytd class, after every actual period
    ]


def test_a_pro_forma_year_does_not_collide_with_its_fiscal_year():
    written = points("PF FY2024", "LTM Jun 2025", "FY2025", "FY2024")
    assert drawn(markdown_delivery._chronological(written)) == [
        "FY2024",
        "FY2025",
        "LTM Jun 2025",
        "PF FY2024",
    ]


def test_an_unreadable_category_in_the_middle_is_drawn_last_and_stated():
    written = points("FY2024", "Run-rate", "FY2023", "Thereafter", "LTM Jun 2025")
    assert drawn(markdown_delivery._chronological(written)) == [
        "FY2023",
        "FY2024",
        "LTM Jun 2025",
        "Run-rate",
        "Thereafter",
    ]
    assert markdown_delivery._undated_note(written) == (
        " Drawn last, in the order written, because no period could be read from the label: "
        "Run-rate."
    )


def test_a_maturity_ladder_thereafter_bucket_is_last_and_not_a_stated_gap():
    written = points(" thereafter ", "2027", "2026", "Thereafter", "2028")
    assert drawn(markdown_delivery._chronological(written)) == [
        "2026",
        "2027",
        "2028",
        " thereafter ",
        "Thereafter",
    ]
    assert markdown_delivery._undated_note(written) == ""
    # The strict rule reads no period from `2027 and thereafter`: it is the ladder's open bucket,
    # drawn last as written and not stated as a gap. `Hereafter` only contains the letters.
    later = points("2027 and thereafter", "2026", "THEREAFTER (2031+)", "Beyond", "Hereafter")
    assert drawn(markdown_delivery._chronological(later)) == [
        "2026",
        "2027 and thereafter",
        "THEREAFTER (2031+)",
        "Beyond",
        "Hereafter",
    ]
    assert markdown_delivery._undated_note(later) == (
        " Drawn last, in the order written, because no period could be read from the label: "
        "Beyond, Hereafter."
    )


def test_two_labels_of_one_period_both_stay_in_the_order_written():
    written = points("FY2025", "FY 2024", "FY2024", "FY2023")
    assert drawn(markdown_delivery._chronological(written)) == [
        "FY2023",
        "FY 2024",
        "FY2024",
        "FY2025",
    ]


def test_every_point_is_kept_and_a_category_keeps_its_series_order():
    written = points("PF", "FY2024", "FY2023", series=("Total debt / EBITDA", "Net debt / EBITDA"))
    ordered = markdown_delivery._chronological(written)
    assert [(p.category, p.series) for p in ordered] == [
        ("FY2023", "Total debt / EBITDA"),
        ("FY2023", "Net debt / EBITDA"),
        ("FY2024", "Total debt / EBITDA"),
        ("FY2024", "Net debt / EBITDA"),
        ("PF", "Total debt / EBITDA"),
        ("PF", "Net debt / EBITDA"),
    ]
    assert sorted(p.fact_id for p in ordered) == sorted(p.fact_id for p in written)


def test_a_table_of_only_pro_forma_rows_is_drawn_oldest_first():
    written = points("PF FY2025", "PF", "PF FY2024")
    assert drawn(markdown_delivery._chronological(written)) == ["PF FY2024", "PF FY2025", "PF"]
    assert markdown_delivery._undated_note(written) == ""


def test_the_private_period_parser_is_gone_from_markdown_delivery():
    for name in ("YEAR", "PART", "_period_key"):
        assert not hasattr(markdown_delivery, name), name


# ---------------------------------------------------------------- catalogue reader (defect 4)
def chart(*rows: str) -> list[str]:
    return [
        "### Chart data: leverage",
        "",
        "| Period | Total debt / EBITDA | Reporting unit | Basis and limitation |",
        "| --- | --- | --- | --- |",
        *(f"| {row} | x | Synthetic. |" for row in rows),
        "",
    ]


@pytest.mark.parametrize(
    ("cell", "key"),
    [
        ("FY2024", (0, 2024, 12, 31, 3, 1)),
        ("2024-09-30", (0, 2024, 9, 30, 0, 1)),
        ("FY2024 / 2024-09-30", (0, 2024, 9, 30, 0, 1)),
        ("Q3 2025", (0, 2025, 9, 31, 1, 1)),
        ("9M 2025", (1, 2025, 9, 31, 0, 1)),
        ("LTM Jun 2025", (2, 2025, 6, 31, 0, 1)),
        ("LTM", (2, 10000, 0, 0, 0, 1)),
        ("PF FY2024", (3, 2024, 12, 31, 3, 1)),
        ("FY2025E", (4, 2025, 12, 31, 3, 1)),
    ],
)
def test_period_order_gives_the_rule_key_for_every_class(cell, key):
    assert catalogue.period_order(cell) == key


@pytest.mark.parametrize("cell", ["", "Thereafter", "2024-02-31", "FY2024/26", "Run-rate"])
def test_period_order_is_none_for_a_cell_the_rule_cannot_place(cell):
    assert catalogue.period_order(cell) is None


def test_chart_rows_orders_rows_of_mixed_forms_and_classes():
    lines = chart(
        "FY2025E | 4.0", "PF FY2024 | 4.6", "LTM Jun 2025 | 4.9", "2024-09-30 | 5.0", "FY2023 | 5.4"
    )
    ranked = catalogue.chart_rows(lines, "leverage")
    assert ranked is not None
    assert [row["Period"] for _, row, _ in sorted(ranked, key=lambda item: item[0])] == [
        "FY2023",
        "2024-09-30",
        "LTM Jun 2025",
        "PF FY2024",
        "FY2025E",
    ]
    assert [number for _, _, number in ranked] == [5, 6, 7, 8, 9]  # as written, 1-based lines


def test_the_latest_period_is_never_a_pro_forma_or_forecast_row():
    lines = chart("FY2025E | 4.0", "PF FY2025 | 4.6", "FY2024 | 5.0", "FY2023 | 5.4")
    assert catalogue.chart_row(lines, "leverage") == (
        {
            "Period": "FY2024",
            "Total debt / EBITDA": "5.0",
            "Reporting unit": "x",
            "Basis and limitation": "Synthetic.",
        },
        7,
    )


def test_the_latest_period_is_the_ltm_row_when_one_is_stated():
    lines = chart("LTM Jun 2025 | 4.9", "FY2024 | 5.0", "PF | 4.4", "9M 2025 | 4.8")
    found = catalogue.chart_row(lines, "leverage")
    assert found is not None
    assert (found[0]["Period"], found[0]["Total debt / EBITDA"], found[1]) == (
        "LTM Jun 2025",
        "4.9",
        5,
    )


def test_a_table_of_only_pro_forma_and_forecast_rows_has_no_latest_period():
    lines = chart("PF FY2024 | 4.6", "FY2025E | 4.0")
    assert catalogue.chart_rows(lines, "leverage") is not None  # the rows still order
    with pytest.raises(ValueError, match="no row is a reported period"):
        catalogue.chart_row(lines, "leverage")


@pytest.mark.parametrize(
    "rows",
    [
        ("FY2024 | 5.0", "2025-06-30 | 4.8"),
        ("2024-09-30 | 5.0", "Q1 2025 | 4.9", "LTM Jun 2025 | 4.7"),
        ("FY2023 / 2023-09-30 | 5.4", "FY2024 | 5.0", "PF FY2024 | 4.6"),
    ],
)
def test_the_latest_period_is_refused_when_reported_rows_mix_dated_and_fiscal_labels(rows):
    lines = chart(*rows)
    assert catalogue.chart_rows(lines, "leverage") is not None  # charts still draw both
    refusal = "^the reported rows mix dated and fiscal-labelled periods$"
    with pytest.raises(ValueError, match=refusal):
        catalogue.chart_row(lines, "leverage")


def test_the_latest_period_of_dated_rows_and_a_fiscal_pro_forma_row_is_the_latest_date():
    """`FY2024 / 2024-09-30` carries its date; a pro forma row is not a reported one."""
    lines = chart("2025-06-30 | 4.8", "FY2024 / 2024-09-30 | 5.0", "PF FY2025 | 4.4")
    found = catalogue.chart_row(lines, "leverage")
    assert found is not None
    assert (found[0]["Period"], found[0]["Total debt / EBITDA"]) == ("2025-06-30", "4.8")
    assert found[1] == 5


@pytest.mark.parametrize(
    "rows",
    [
        ("FY2024 | 5.0", "FY2024 | 5.1"),
        ("FY 2024 | 5.0", "FY2024 | 5.1"),  # two spellings of one period
        ("FY2024 | 5.0", "2024 | 5.1"),
    ],
)
def test_chart_rows_refuses_two_rows_with_one_key(rows):
    with pytest.raises(ValueError, match="two rows state one period"):
        catalogue.chart_rows(chart(*rows), "leverage")


def test_chart_rows_refuses_an_unreadable_period_between_readable_ones():
    with pytest.raises(ValueError, match="no period that can be ordered"):
        catalogue.chart_rows(chart("FY2023 | 5.4", "Run-rate | 5.0", "FY2024 | 5.1"), "leverage")


# ---------------------------------------------------------------- changes readers (defect 4)
def cash_flow(*periods: str) -> str:
    """A statement table whose free cash flow row states 10, 20, ... under `periods` in turn."""
    cells = " | ".join(str(10 * place) for place in range(1, len(periods) + 1))
    return "\n".join(
        [
            "### T4.5 Cash flow statement",
            "",
            "| Line item | " + " | ".join(periods) + " | Unit | Basis | Source |",
            "| --- | " + " | ".join("---" for _ in periods) + " | --- | --- | --- |",
            f"| Free cash flow (US$m) | {cells} | USD millions | Synthetic. | Fixture. |",
            "",
        ]
    )


def free_cash_flow(*periods: str):
    seen, reasons = changes._read(cash_flow(*periods))
    return seen.get("free_cash_flow"), reasons.get("free_cash_flow")


def test_the_latest_reported_column_of_a_statement_row():
    found, reason = free_cash_flow("FY2025E", "PF FY2024", "FY2024", "Q1 2025")
    assert reason is None
    # Q1 2025 ends after FY2024; a pro forma or forecast column is never the latest reported.
    assert (found.period, found.value) == ("Q1 2025", "40")


def test_a_statement_row_with_an_ltm_column_reads_the_ltm():
    found, reason = free_cash_flow("LTM Jun 2025", "FY2024", "FY2023")
    assert reason is None
    assert (found.period, found.value) == ("LTM Jun 2025", "10")


def test_a_statement_row_of_only_pro_forma_and_forecast_columns_gives_its_reason():
    assert free_cash_flow("PF FY2024", "FY2025E") == (
        None,
        "has only pro forma or forecast periods in its row",
    )


@pytest.mark.parametrize(
    "periods",
    [
        ("Reported", "Restated"),  # no period in any header cell
        ("FY2024", "FY 2024"),  # two spellings of one period
        ("FY2023", "FY2024", "2024"),
    ],
)
def test_a_statement_row_with_no_period_or_a_repeated_one_is_not_guessed(periods):
    assert free_cash_flow(*periods) == (None, "has periods in its row that cannot be ordered")


def test_a_header_that_is_not_a_period_is_not_a_period_column():
    """`Change vs FY2024` has words the strict rule does not know: it is no period column, so
    the row's latest reported column is FY2024 and the change column is never read as one."""
    found, reason = free_cash_flow("FY2023", "FY2024", "Change vs FY2024")
    assert reason is None
    assert (found.period, found.value) == ("FY2024", "20")


@pytest.mark.parametrize(
    "periods",
    [
        ("FY2024", "2025-06-30"),
        ("2024-09-30", "Q1 2025", "LTM Jun 2025"),
        ("FY2023 / 2023-09-30", "FY2024"),
    ],
)
def test_a_statement_row_mixing_dated_and_fiscal_labelled_columns_has_no_latest(periods):
    """Which of `FY2024` and `2025-06-30` is later depends on the year end: never a guess."""
    assert free_cash_flow(*periods) == (
        None,
        "mixes dated and fiscal-labelled periods in its row, so the latest is not chosen",
    )


def test_a_statement_row_of_dated_columns_alone_reads_the_latest_date():
    found, reason = free_cash_flow("2025-06-30", "FY2024 / 2024-09-30", "FY2025E")
    assert reason is None
    assert (found.period, found.value) == ("2025-06-30", "10")


def maturities(*rows: str) -> str:
    return "\n".join(
        [
            "### Chart data: debt maturities",
            "",
            "| Period | Debt maturing | Reporting unit | Basis and limitation |",
            "| --- | --- | --- | --- |",
            *(f"| {row} | US$m | Synthetic. |" for row in rows),
            "",
        ]
    )


def test_the_maturity_profile_is_in_rule_order_with_the_open_bucket_last():
    before = maturities("Thereafter | 900", "FY2027 | 300", "FY2026 | 200")
    after = maturities("FY2028 | 400", "Thereafter | 500", "2027-06-30 | 250", "FY2026 | 200")
    profile, _ = changes._maturity_profile(before, after)
    assert profile is not None
    assert [row["period"] for row in profile["rows"]] == [
        "FY2026",
        "2027-06-30",
        "FY2027",
        "FY2028",
        "Thereafter",
    ]


# ---------------------------------------------------------------- HTML Model M1 to M3 (defect 6)
MODEL_KEYS = (
    "operating_ebitda",
    "issuer_ordinary_ebitda",
    "issuer_as_defined",
    "cfo",
    "cfo_less_capex",
    "opex_magnitude",
)


def model_module(periods: tuple[str, ...]) -> ModuleView:
    """A synthetic CP-MODEL history: each key's amount is 100 + its place in `periods`."""
    facts = tuple(
        Fact(
            fact_id=f"history.{key}.{period}",
            label=key,
            table_id="history",
            row_id=key,
            field=period,
            amount=Decimal(100 + place),
            status="known",
            unit="MILLIONS",
            scale=Decimal(1000000),
            currency="USD",
            period=period,
            basis="Synthetic.",
            value_class="source",
        )
        for key in MODEL_KEYS
        for place, period in enumerate(periods)
    )
    return ModuleView(
        module_id="CP-MODEL",
        title="Synthetic Model",
        aliases=(),
        status="candidate",
        artifact_sha256="0" * 64,
        facts=facts,
    )


def model_refs(module: ModuleView) -> dict[tuple[str, str], tuple[str, ...]]:
    """One synthetic reference per fact, numbered in the order the facts were written."""
    return {
        ("CP-MODEL", fact.fact_id): (f"S{number}",) for number, fact in enumerate(module.facts, 1)
    }


def test_model_figures_draw_every_annual_period_oldest_first():
    periods = ("FY2024", "FY2022", "FY2023")
    module = model_module(periods)
    figures = model_handoff_delivery._model_figures(module, model_refs(module), periods)
    assert [figure.fig_id for figure in figures] == ["M1", "M2", "M3"]
    m3 = figures[2].chart.marks
    assert [mark.label for mark in m3] == ["FY2022", "FY2023", "FY2024"]
    assert [mark.value for mark in m3] == [Decimal(101), Decimal(102), Decimal(100)]
    # opex_magnitude is the sixth key: its facts are numbers 16 to 18 as written (FY2024 first).
    assert [mark.ref_id for mark in m3] == ["S17", "S18", "S16"]
    assert [mark.label for mark in figures[0].chart.marks] == ["FY2022", "FY2023", "FY2024"] * 3
    # The shell draws a plotted chart's table-twin note under it, never an `above` figure's summary.
    stated = (
        "Every selected fiscal year, oldest first. This Model carries annual periods only: no "
        "year-to-date, LTM or pro forma column. Distinct definitions and missing observations "
        "retained."
    )
    assert [(f.placement, f.chart.reason, f.chart.table_twin.note) for f in figures] == [
        ("above", None, stated)
    ] * 3


def test_model_figures_would_place_ltm_and_pf_columns_after_the_fiscal_years():
    """Scope: the figure builder only. `_AnnualReader.validate` admits `FY<year>` historical
    durations alone, so no retained or live layout reaches this with an LTM or PF column; a fact
    id takes no space, so the labels here are the undated ones."""
    periods = ("PF", "LTM", "FY2024", "FY2023")
    module = model_module(periods)
    figures = model_handoff_delivery._model_figures(module, model_refs(module), periods)
    m2 = figures[1].chart.marks[:4]
    assert [mark.label for mark in m2] == ["FY2023", "FY2024", "LTM", "PF"]
    assert [mark.value for mark in m2] == [Decimal(103), Decimal(102), Decimal(101), Decimal(100)]


def test_model_figures_refuse_a_period_that_cannot_be_ordered():
    periods = ("FY2023", "Run-rate")
    with pytest.raises(ValueError, match="model_period: cannot order for the charts: Run-rate"):
        model_handoff_delivery._model_figures(model_module(periods), {}, periods)
