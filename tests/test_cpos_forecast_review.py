"""Review fix C5-S1: a flow base under a bare date header is a twelve-month column only when
CP-1's own period tables date that period as twelve months. Hand-written synthetic inputs."""

import json

import pytest

from deploy_workflow.owners import cpos_forecast

_FLOWS = {"revenue": "1000", "ebitda": "300", "interest": "36", "taxes": "20", "wc": "10"}
_FLOWS["capex"] = "40"
_BALANCES = {"fcf": "194", "debt": "600", "cash": "100", "undrawn": "50"}
_PATHS = {
    "revenue_growth": "0.05",
    "ebitda_margin": "0.30",
    "capex_pct_revenue": "0.04",
    "tax_wc_pct_revenue": "0.10",
    "interest_rate": "0.06",
    "dividends": "20",
    "debt_repayment": "50",
}
_PERIOD_ROWS = {
    "twelve": ["| FY2025 | 2024-07-01 | 2025-06-30 |"],
    "nine": ["| 9M 2025 | 2024-10-01 | 2025-06-30 |"],
    "none": [],
    "both": ["| FY2025 | 2024-07-01 | 2025-06-30 |", "| Q4 2025 | 2025-04-01 | 2025-06-30 |"],
}


def _cp1(header: str, periods: str) -> str:
    rows = [
        f"| {k} | {'(10)' if k == 'wc' else v} | USD millions | Synthetic. | 10-K |"
        for k, v in _FLOWS.items()
    ]
    rows += [f"| {k} | {v} | USD millions | Synthetic. | 10-K |" for k, v in _BALANCES.items()]
    period_table = ["| Period | Start | End |", "| --- | --- | --- |", *_PERIOD_ROWS[periods]]
    return "\n".join(
        [
            *(period_table if _PERIOD_ROWS[periods] else []),
            "",
            f"| Line item | {header} | Unit | Basis | Source |",
            "| --- | --- | --- | --- | --- |",
            *rows,
            "",
        ]
    )


def _block(header: str, first_year: int) -> str:
    base = {k: {"amount": v, "reason": None, "row": k, "period": header} for k, v in _FLOWS.items()}
    base |= {
        k: {"amount": v, "reason": None, "row": k, "period": header} for k, v in _BALANCES.items()
    }
    drivers = {
        name: {
            "values": [v] * 3,
            "category": "Analyst Interpretation",
            "rationale": "Synthetic.",
            "limitation": None,
        }
        for name, v in _PATHS.items()
    }
    inputs = {
        "schema_version": "cpos-forecast-inputs/1",
        "base": base,
        "base_drivers": drivers,
        "downside_shock": {"ebitda_decline": "0.20", "rate_increase": "0.10"},
        "years": [
            {
                "year": first_year + i,
                "start": f"{first_year + i - 1}-07-01",
                "end": f"{first_year + i}-06-30",
            }
            for i in range(3)
        ],
        "scope_limits": ["Synthetic; not analytical review."],
    }
    return f"### Forecast inputs (machine-readable)\n\n```json\n{json.dumps(inputs)}\n```\n"


def _parse(header: str, periods: str, first_year: int = 2026):
    return cpos_forecast.parse(_block(header, first_year), _cp1(header, periods), "CP-2G")


def test_bare_interim_date_with_no_twelve_month_dating_is_refused():
    with pytest.raises(ValueError, match="not a period the Forecast page can read"):
        _parse("2025-06-30", "none")


def test_bare_date_that_cp1_dates_as_a_nine_month_period_is_refused():
    with pytest.raises(ValueError, match="not a period the Forecast page can read"):
        _parse("2025-06-30", "nine")


def test_bare_date_that_cp1_dates_as_a_twelve_month_fy_end_is_accepted():
    assert _parse("2025-06-30", "twelve").years[0].year == 2026


def test_fy_label_with_a_date_is_accepted():
    assert _parse("FY2025 / 2025-06-30", "none").years[0].year == 2026


def test_ltm_header_is_accepted():
    assert _parse("LTM 2025-06-30", "none").years[0].year == 2026


_REFUSED = [
    ("(2025-06-30)", "nine"),
    ("2025-06-30 (unaudited)", "nine"),
    ("Period ended 2025-06-30", "nine"),
    ("(2025-06-30)", "none"),
    ("As at 2025-06-30", "none"),
    ("June 2025 (2025-06-30)", "nine"),
    ("1Q25 (2025-03-31)", "none"),
    ("Year ended 2025-06-30", "nine"),
    ("2Q 2025-06-30", "twelve"),
]
_ACCEPTED = [
    ("(2025-06-30)", "twelve"),
    ("Period ended 2025-06-30", "twelve"),
    ("Year ended 2025-06-30", "none"),
    ("Year ended 2025-06-30", "twelve"),
    ("(2025-06-30)", "both"),
    ("Year ended 2025-06-30", "both"),
]


@pytest.mark.parametrize(("header", "periods"), _REFUSED)
def test_a_decorated_date_header_without_twelve_month_dating_is_refused(header, periods):
    with pytest.raises(ValueError, match="not a period the Forecast page can read"):
        _parse(header, periods)


@pytest.mark.parametrize(("header", "periods"), _ACCEPTED)
def test_a_decorated_date_header_with_twelve_month_dating_or_year_is_accepted(header, periods):
    assert _parse(header, periods).years[0].year == 2026


@pytest.mark.parametrize(
    "header",
    [
        "1Q25 (2025-03-31)",
        "2Q 2025-06-30",
        "1H25 (2025-06-30)",
        "Quarter 2025",
        "Half year 2025",
        "Quarter ended 2025",
    ],
)
def test_part_year_headers_do_not_read_as_a_year(header):
    assert cpos_forecast._reads_as_year_or_ltm(header) is False


@pytest.mark.parametrize(
    "header",
    ["FY2024 / 2025-02-01", "Year ended 2024-12-31", "LTM 2025-06-30", "FY2024A", "FY24", "2024"],
)
def test_year_and_ltm_headers_still_read_as_a_year(header):
    assert cpos_forecast._reads_as_year_or_ltm(header) is True
