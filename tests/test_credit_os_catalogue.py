"""The Credit OS catalogue over synthetic library runs (tests/library_fixtures.py). Expected values
are written here from the fixture text, not read back from the code under test."""

import hashlib
import json
from decimal import Decimal
from pathlib import Path

from hypothesis import given, settings
from hypothesis import strategies as st
from library_fixtures import make_run, method

from deploy_workflow.credit_os_catalogue import catalogue, prior_metric
from deploy_workflow.library_index import Library, build_library

ROOT = Path(__file__).resolve().parents[1]
from credit_os import store

quotable = st.from_regex(r"-?[0-9]{1,6}(\.[0-9]{1,4})?", fullmatch=True)
long_quotable = st.from_regex(r"-?[0-9]{1,30}(\.[0-9]{1,28})?", fullmatch=True)
LEVERAGE = "| FY2024 | 6.57 | 4.93 | x | Same basis; pre-dividend cash. D1, D3. |"
COVER = "| FY2024 | 3.29 | x | Issuer EBITDA / cash interest, net. D1. |"
LIQUIDITY = "| 2024-09-30 | 6261 | 843 | US$m | Available RCF only, after letters of credit. |"
CHARTS = f"""
### Chart data: leverage

| Period | Total debt / EBITDA | Net debt / EBITDA | Reporting unit | Basis and limitation |
| --- | --- | --- | --- | --- |
| FY2023 | 6.33 | 5.22 | x | Earlier year. |
{LEVERAGE}

### Chart data: interest cover

| Period | EBITDA / cash interest | Reporting unit | Basis and limitation |
| --- | --- | --- | --- |
| FY2023 | 2.71 | x | Earlier year. |
{COVER}

### Chart data: liquidity

| Period | Cash | Undrawn committed facilities | Reporting unit | Basis and limitation |
| --- | --- | --- | --- | --- |
| 2023-09-30 | 3472 | 755 | US$m | Earlier year. |
{LIQUIDITY}
"""
CONTEXT = {
    "schema": "context/1",
    "run": {
        "run_type": "research",
        "pathway": "credit_snapshot",
        "case_kind": "public",
        "as_of": "2025-03-31",
        "cutoff": "",
        "current_period": "fy-2024",
        "prior_period": "fy-2023",
        "reporting_currency": "USD",
    },
    "identity": {
        "issuer_name": "Northbridge Synthetic Group",
        "issuer_id": "nbg",
        "borrower_name": "",
        "parent_name": "",
        "guarantors": [],
        "aliases": [],
        "listed_equity": True,
        "ticker": "NBG",
        "sector": "Industrials",
        "country": "United States",
        "sponsor": "",
    },
    "deal_terms": [],
    "quotes": [],
    "ratings": [],
    "valuation": {
        "peer_source": "cp_dr_public",
        "basis": "auto",
        "issuer_market": {
            "market_cap_m": "",
            "net_debt_m": "",
            "ev_m": "",
            "ebitda_basis": "LTM",
            "as_of": "",
            "source": "",
        },
        "peers": [],
        "precedents": [],
        "user_multiple": {"value": "", "basis": "LTM", "rationale": ""},
    },
    "assumptions": {k: None for k in ("cp2a", "cp2d", "cp2e", "cp3c", "cp3d", "cp4c")},
    "attachments": {
        "portfolio_workbook": False,
        "prior_case": False,
        "management_bridge": False,
        "legal_documents": "executed",
    },
    "research_questions": [],
}


def pin_context(run_dir: Path, raw: bytes, pinned_sha: str | None = None) -> None:
    """Pin the context as CP-OS does: workflow.json sources["context"], bytes at inputs/<sha256>."""
    digest = hashlib.sha256(raw).hexdigest()
    (run_dir / "inputs").mkdir(exist_ok=True)
    (run_dir / "inputs" / (pinned_sha or digest)).write_bytes(raw)
    workflow = json.loads((run_dir / "workflow.json").read_text())
    workflow["sources"] = {"context": {"path": "context.json", "sha256": pinned_sha or digest}}
    (run_dir / "workflow.json").write_text(json.dumps(workflow))


def built(workspace: Path) -> dict:
    library = build_library(workspace, workspace / "library", method())
    return catalogue(workspace, library)


def delivered_cp1(run_dir: Path) -> tuple[str, list[str]]:
    (delivery,) = (run_dir / "deliveries").iterdir()
    path = f"runs/{run_dir.name}/deliveries/{delivery.name}/CP-1.md"
    return path, (delivery / "CP-1.md").read_text().split("\n")


def test_catalogue_lists_only_library_runs(tmp_path):
    make_run(tmp_path, "run-a")
    broken = make_run(tmp_path, "run-b")
    (broken / "workflow.json").unlink()  # library_index leaves a non-launcher run out
    result = built(tmp_path)
    assert [run["id"] for run in result["real"]] == ["run-a"]
    assert result["workspace"] == str(tmp_path)


def test_metrics_quote_the_handoff_row(tmp_path):
    run_dir = make_run(tmp_path, "run-a", cp1_extra=CHARTS)
    path, lines = delivered_cp1(run_dir)
    result = built(tmp_path)
    metrics = result["real"][0]["metrics"]
    expected = {
        "leverage": ("6.57", "x", LEVERAGE),
        "net_leverage": ("4.93", "x", LEVERAGE),
        "coverage": ("3.29", "x", COVER),
        "cash": ("6261", "US$m", LIQUIDITY),
        "undrawn": ("843", "US$m", LIQUIDITY),
    }
    assert set(metrics) == set(expected)
    for key, (value, unit, row) in expected.items():
        metric = metrics[key]
        assert (metric["value"], metric["unit"]) == (value, unit)
        source = result["sources"][metric["source"]]
        assert source["quote"] == row
        assert source["line"] == lines.index(row) + 1
        assert source["path"] == path


def newest_first(charts: str) -> str:
    """CHARTS with each table's earlier-year row moved below the latest one."""
    lines = charts.split("\n")
    for index in range(len(lines) - 2, -1, -1):
        if "Earlier year." in lines[index]:
            lines[index], lines[index + 1] = lines[index + 1], lines[index]
    return "\n".join(lines)


def test_metrics_take_the_latest_period_not_the_last_row(tmp_path):
    run_dir = make_run(tmp_path, "run-a", cp1_extra=newest_first(CHARTS))
    _, lines = delivered_cp1(run_dir)
    result = built(tmp_path)
    metrics = result["real"][0]["metrics"]
    assert {k: m["value"] for k, m in metrics.items()} == {
        "leverage": "6.57",
        "net_leverage": "4.93",
        "coverage": "3.29",
        "cash": "6261",
        "undrawn": "843",
    }
    assert {m["period"] for m in metrics.values()} == {"FY2024", "2024-09-30"}
    for row in (LEVERAGE, COVER, LIQUIDITY):
        quoted = [s for s in result["sources"].values() if s["quote"] == row]
        assert quoted and all(s["line"] == lines.index(row) + 1 for s in quoted)
    assert result["issues"] == []


def test_periods_that_cannot_be_ordered_give_no_metric_and_an_issue(tmp_path):
    charts = CHARTS.replace("| FY2023 | 6.33", "| Q1 FY2023 | 6.33")
    make_run(tmp_path, "run-a", cp1_extra=charts)
    result = built(tmp_path)
    metrics = result["real"][0]["metrics"]
    assert "leverage" not in metrics and "net_leverage" not in metrics
    assert {"coverage", "cash", "undrawn"} <= set(metrics)
    (issue,) = [i for i in result["issues"] if "leverage" in i]
    assert issue.startswith("run-a: CP-1 leverage table has no metric")


def test_not_supplied_is_absent(tmp_path):
    charts = CHARTS.replace("| 3.29 |", "| Not supplied: no cash interest line |")
    charts = charts.replace("| 4.93 |", "| Not supplied: no net debt |")
    make_run(tmp_path, "run-a", cp1_extra=charts)
    metrics = built(tmp_path)["real"][0]["metrics"]
    assert "coverage" not in metrics
    assert "net_leverage" not in metrics
    assert metrics["leverage"]["value"] == "6.57"


def statement(currency: str) -> str:
    """A CP-1 income statement whose fixed row states `currency` in its Unit cell."""
    return (
        "\n### T4.4 Income statement\n\n"
        "| Line item | FY2024 | Unit | Basis | Source |\n"
        "| --- | --- | --- | --- | --- |\n"
        f"| EBITDA (Reported) | 100 | {currency} millions | Reported | Fixture. |\n"
    )


def test_identity_from_context(tmp_path):
    run_dir = make_run(tmp_path, "run-a", cp1_findings=statement("USD"))
    pin_context(run_dir, json.dumps(CONTEXT).encode())
    run = built(tmp_path)["real"][0]
    assert (run["issuer"], run["name"], run["sector"], run["country"]) == (
        "NBG",
        "Northbridge Synthetic Group",
        "Industrials",
        "United States",
    )
    assert (run["currency"], run["date"]) == ("USD", "2025-03-31")
    assert (run["period"], run["period_kind"], run["title"]) == (
        "FY-2024",
        "Annual",
        "Full credit assessment",
    )
    assert run["summary"] == "CP-1 bottom line."
    assert run["gaps"] == ["Synthetic fixture only."]


def test_the_currency_is_the_one_cp1_states_not_the_one_the_context_holds(tmp_path):
    """docs/rulings/2026-11-16-reporting-currency-from-sources.md: GBP statements record GBP even
    when the context says USD; USD statements record USD; no money unit records nothing."""
    cases = {"gbp": ("GBP", "GBP"), "usd": ("USD", "USD"), "none": (None, "")}
    for folder, (stated, recorded) in cases.items():
        findings = "" if stated is None else statement(stated)
        run_dir = make_run(tmp_path, folder, cp1_findings=findings, issuer_id=f"i-{folder}")
        pin_context(run_dir, json.dumps(CONTEXT).encode())  # the context says USD in every case
    runs = {run["id"]: run for run in built(tmp_path)["real"]}
    assert {k: runs[k]["currency"] for k in cases} == {k: v[1] for k, v in cases.items()}


def test_a_context_without_a_currency_still_gives_the_run_its_cp1_currency(tmp_path):
    run_dir = make_run(tmp_path, "run-a", cp1_findings=statement("EUR"))
    run = {k: v for k, v in CONTEXT["run"].items() if k != "reporting_currency"}
    pin_context(run_dir, json.dumps({**CONTEXT, "run": run}).encode())
    assert built(tmp_path)["real"][0]["currency"] == "EUR"


def test_context_not_matching_its_pin_is_an_issue_with_empty_fields(tmp_path):
    run_dir = make_run(tmp_path, "run-a")
    pin_context(run_dir, json.dumps(CONTEXT).encode(), pinned_sha="0" * 64)
    result = built(tmp_path)
    run = result["real"][0]
    assert run["issuer"] == "NBG"  # issuer_id upper, not the unpinned ticker
    assert (run["sector"], run["country"], run["currency"], run["period"]) == ("", "", "", "")
    assert any(i.startswith("run-a: context not used") for i in result["issues"])


def test_context_the_rules_refuse_is_an_issue_with_empty_fields(tmp_path):
    run_dir = make_run(tmp_path, "run-a")
    pin_context(run_dir, json.dumps({**CONTEXT, "schema": "other"}).encode())
    result = built(tmp_path)
    assert result["real"][0]["sector"] == ""
    assert any("context not used" in i for i in result["issues"])


def test_run_without_context_leaves_fields_empty(tmp_path):
    make_run(tmp_path, "run-a")
    run = built(tmp_path)["real"][0]
    assert run["issuer"] == "NBG"
    assert (run["sector"], run["country"], run["currency"], run["period"]) == ("", "", "", "")
    assert run["checklist"] is None


def test_store_joins_the_catalogue(tmp_path):
    make_run(tmp_path, "run-a", cp1_extra=CHARTS)
    result = built(tmp_path)
    (artifact,) = result["real"][0]["artifacts"]
    assert artifact["available"] and "/report.html?sha256=" in artifact["href"]
    joined = store.workspace_store(tmp_path, result)
    assert {o["module"] for o in joined["outputs"].values()} == {"CP-0", "CP-1"}
    assert "reports" not in joined  # The delivered report is retired from the library's store.
    assert joined["issues"] == []


def combined_periods(first: str, second: str) -> str:
    """CHARTS with the leverage table's Period cells as real runs write them."""
    return CHARTS.replace("| FY2023 | 6.33", f"| {first} | 6.33").replace(
        "| FY2024 | 6.57", f"| {second} | 6.57"
    )


def test_fiscal_year_with_its_date_is_ordered_by_the_date(tmp_path):
    charts = combined_periods("FY2023 / 2023-09-30", "FY2024 / 2024-09-30")
    make_run(tmp_path, "run-a", cp1_extra=charts)
    result = built(tmp_path)
    metrics = result["real"][0]["metrics"]
    assert metrics["leverage"]["value"] == "6.57"
    assert metrics["leverage"]["period"] == "FY2024 / 2024-09-30"
    assert metrics["net_leverage"]["value"] == "4.93"
    assert result["issues"] == []


def test_fiscal_year_and_date_that_disagree_give_no_metric_and_an_issue(tmp_path):
    charts = combined_periods("FY2023 / 2023-09-30", "FY2024 / 2023-09-30")
    make_run(tmp_path, "run-a", cp1_extra=charts)
    result = built(tmp_path)
    assert "leverage" not in result["real"][0]["metrics"]
    assert [i for i in result["issues"] if "leverage table has no metric" in i]


def test_an_impossible_date_is_not_ordered(tmp_path):
    make_run(tmp_path, "run-a", cp1_extra=CHARTS.replace("| 2024-09-30 |", "| 2024-13-45 |"))
    result = built(tmp_path)
    assert "cash" not in result["real"][0]["metrics"]
    assert [i for i in result["issues"] if "liquidity table has no metric" in i]


def test_a_library_built_by_hand_still_catalogues_without_the_shared_deliveries(tmp_path):
    make_run(tmp_path, "run-a")
    listed = build_library(tmp_path, tmp_path / "library", method())
    assert "run-a" in listed.deliveries
    by_hand = Library(runs=listed.runs)  # no shared deliveries: each is verified again
    assert by_hand.deliveries == {}
    assert catalogue(tmp_path, by_hand)["real"] == catalogue(tmp_path, listed)["real"]


def test_a_delivery_without_a_report_page_has_no_report_link_and_still_catalogues(tmp_path):
    make_run(tmp_path, "run-a", report_page=False)
    listed = build_library(tmp_path, tmp_path / "library", method())
    by_hand = Library(runs=listed.runs)  # verified again here, by the receipt's hash
    for library in (listed, by_hand):
        result = catalogue(tmp_path, library)
        (artifact,) = result["real"][0]["artifacts"]
        assert artifact["available"] is False and artifact["href"] == ""
        assert "no report page" in artifact["issue"]
        assert result["issues"] == []


def published_forecast(tmp_path, report_page, extra=()):
    from deploy_workflow.credit_os_catalogue import MODEL_FILES, delivery_fields

    files = {name: f"{i:064x}" for i, name in enumerate((*MODEL_FILES, "view.json", *extra), 1)}
    if report_page:
        files["report.html"] = "a" * 64
    folder = tmp_path / "runs" / "r1" / "deliveries" / "d1"
    folder.mkdir(parents=True)
    (folder / "delivery.json").write_text(json.dumps({"cp_forecast_published": True}))
    artifacts, _, _ = delivery_fields(
        tmp_path,
        {"id": "r1", "modules": []},
        {},
        [],
        {"folder": "deliveries/d1", "files": files, "view": {}},
    )
    return {a["kind"]: a for a in artifacts}, files


def test_forecast_of_a_delivery_without_a_report_page_is_pinned_to_its_own_file(tmp_path):
    by_kind, files = published_forecast(tmp_path, report_page=False)
    model = by_kind["model"]
    assert model["available"] is True and model["issue"] == ""
    assert model["href"].startswith("/files/runs/r1/deliveries/d1/annual.md")
    assert files["annual.md"] in model["href"]


def test_forecast_prefers_model_html_when_the_delivery_has_it(tmp_path):
    by_kind, files = published_forecast(tmp_path, report_page=False, extra=("model.html",))
    assert by_kind["model"]["href"].startswith("/files/runs/r1/deliveries/d1/model.html")
    assert files["model.html"] in by_kind["model"]["href"]


def test_forecast_of_an_earlier_format_delivery_still_shares_the_report_href(tmp_path):
    by_kind, _ = published_forecast(tmp_path, report_page=True)
    assert by_kind["model"]["href"] == by_kind["report"]["href"] != ""
    assert by_kind["model"]["available"] is True


ADJUSTED_CHARTS = CHARTS.replace(
    "| Period | Total debt / EBITDA | Net debt / EBITDA |",
    "| Period | Total debt / adjusted EBITDA | Net debt / adjusted EBITDA |",
).replace("| Period | EBITDA / cash interest |", "| Period | Adjusted EBITDA / cash interest |")


def test_a_run_on_the_adjusted_names_quotes_them_as_the_label_of_its_measures(tmp_path):
    make_run(tmp_path, "run-a", cp1_extra=ADJUSTED_CHARTS)
    metrics = built(tmp_path)["real"][0]["metrics"]
    assert set(metrics) == {"leverage", "net_leverage", "coverage", "cash", "undrawn"}
    expected = {
        "leverage": ("6.57", "Total debt / adjusted EBITDA"),
        "net_leverage": ("4.93", "Net debt / adjusted EBITDA"),
        "coverage": ("3.29", "Adjusted EBITDA / cash interest"),
    }
    for key, (value, label) in expected.items():
        assert (metrics[key]["value"], metrics[key]["label"]) == (value, label)
    assert "label" not in metrics["cash"] and "label" not in metrics["undrawn"]


def test_a_run_on_the_reported_names_carries_no_label_on_its_measures(tmp_path):
    make_run(tmp_path, "run-a", cp1_extra=CHARTS)
    metrics = built(tmp_path)["real"][0]["metrics"]
    assert all("label" not in metric for metric in metrics.values())


ENTERED = [
    {
        "agency": "Moody's",
        "scope": "issuer",
        "rating": "B1",
        "outlook": "Stable",
        "as_of": "2026-09-30",
    },
    {
        "agency": "S&P",
        "scope": "facility",
        "rating": "B+",
        "outlook": "Positive",
        "as_of": "2026-08-15",
    },
]
RATINGS = [
    {
        "label": "B1",
        "agency": "Moody's",
        "scope": "issuer",
        "outlook": "Stable",
        "date": "2026-09-30",
    },
    {
        "label": "B+",
        "agency": "S&P",
        "scope": "facility",
        "outlook": "Positive",
        "date": "2026-08-15",
    },
]


def test_entered_ratings_reach_the_catalogue_in_order(tmp_path):
    run_dir = make_run(tmp_path, "run-a")
    run = {**CONTEXT["run"], "as_of": "2026-10-31"}  # ratings may not postdate the run
    pin_context(run_dir, json.dumps({**CONTEXT, "run": run, "ratings": ENTERED}).encode())
    assert built(tmp_path)["real"][0]["ratings"] == RATINGS


def test_no_ratings_without_context_or_entries_or_with_a_refused_context(tmp_path):
    make_run(tmp_path, "run-a")
    refused = make_run(tmp_path, "run-b")
    pin_context(refused, json.dumps({**CONTEXT, "schema": "other", "ratings": ENTERED}).encode())
    empty = make_run(tmp_path, "run-c")
    pin_context(empty, json.dumps(CONTEXT).encode())
    result = built(tmp_path)
    assert [r["ratings"] for r in result["real"]] == [[], [], []]
    assert sum("context not used" in i for i in result["issues"]) == 1


def one_chart(chart: str, header: str, rows: list[str]) -> str:
    """A single CP-1 chart table; the header cells after Period, then one line per row."""
    cols = ["Period", *header.split(" ; "), "Reporting unit", "Basis and limitation"]
    return "\n".join(
        [f"### Chart data: {chart}", "", "| " + " | ".join(cols) + " |"]
        + ["| " + " | ".join("---" for _ in cols) + " |"]
        + [f"| {row} | Basis. |" for row in rows]
        + [""]
    )


def lev_metrics(tmp_path, rows: list[str]) -> dict:
    charts = one_chart("leverage", "Total debt / EBITDA", rows)
    make_run(tmp_path, "run-a", cp1_extra=charts)
    return built(tmp_path)["real"][0]["metrics"]


def test_leverage_carries_last_years_value_and_the_exact_change(tmp_path):
    metrics = lev_metrics(tmp_path, ["FY2022 | 3.9 | x", "FY2023 | 4.2 | x", "FY2024 | 4.4 | x"])
    leverage = metrics["leverage"]
    assert (leverage["value"], leverage["period"]) == ("4.4", "FY2024")
    assert leverage["prior"] == {"value": "4.2", "period": "FY2023"}
    assert leverage["change"] == "0.2"


def test_interest_cover_change_keeps_its_trailing_zero_and_sign(tmp_path):
    charts = one_chart(
        "interest cover", "EBITDA / cash interest", ["FY2023 | 4.50 | x", "FY2024 | 4.00 | x"]
    )
    make_run(tmp_path, "run-a", cp1_extra=charts)
    coverage = built(tmp_path)["real"][0]["metrics"]["coverage"]
    assert coverage["prior"] == {"value": "4.50", "period": "FY2023"}
    assert coverage["change"] == "-0.50"


def test_liquidity_changes_for_cash_and_undrawn(tmp_path):
    charts = one_chart(
        "liquidity",
        "Cash ; Undrawn committed facilities",
        ["FY2023 | 300 | 400 | US$m", "FY2024 | 275 | 400 | US$m"],
    )
    make_run(tmp_path, "run-a", cp1_extra=charts)
    metrics = built(tmp_path)["real"][0]["metrics"]
    assert metrics["cash"]["change"] == "-25"
    assert metrics["undrawn"]["change"] == "0"
    assert metrics["undrawn"]["prior"] == {"value": "400", "period": "FY2023"}


def test_an_unchanged_value_has_a_change_of_zero_at_its_written_scale(tmp_path):
    metrics = lev_metrics(tmp_path, ["FY2023 | 2.25 | x", "FY2024 | 2.25 | x"])
    assert metrics["leverage"]["change"] == "0.00"


def test_half_year_prior_is_the_same_half_a_year_earlier():
    # `chart_row` cannot order an `H1 2025` period (the whole table then gives no metric), so the
    # prior rule is checked on the rows directly.
    rows = [
        {"Period": "H1 2024", "Total debt / EBITDA": "4.8", "Reporting unit": "x"},
        {"Period": "H1 2025", "Total debt / EBITDA": "5.1", "Reporting unit": "x"},
    ]
    assert prior_metric(rows, rows[1], "Total debt / EBITDA") == (
        {"value": "4.8", "period": "H1 2024"},
        "0.3",
    )


def test_every_year_in_a_dated_label_is_lowered():
    rows = [
        {"Period": "FY2023 / 2023-09-30", "Cash": "10", "Reporting unit": "US$m"},
        {"Period": "FY2024 / 2024-09-30", "Cash": "12", "Reporting unit": "US$m"},
    ]
    assert prior_metric(rows, rows[1], "Cash") == (
        {"value": "10", "period": "FY2023 / 2023-09-30"},
        "2",
    )


def test_a_label_without_a_four_digit_year_has_no_prior():
    rows = [
        {"Period": "LTM Sep-24", "Cash": "10", "Reporting unit": "US$m"},
        {"Period": "LTM Sep-25", "Cash": "12", "Reporting unit": "US$m"},
    ]
    assert prior_metric(rows, rows[1], "Cash") is None


def test_only_the_latest_and_an_older_non_adjacent_year_gives_no_prior(tmp_path):
    metrics = lev_metrics(tmp_path, ["FY2022 | 3.9 | x", "FY2024 | 4.4 | x"])
    assert "prior" not in metrics["leverage"] and "change" not in metrics["leverage"]
    assert metrics["leverage"]["value"] == "4.4"


def test_a_repeated_prior_period_gives_no_prior(tmp_path):
    make_run(
        tmp_path,
        "run-a",
        cp1_extra=one_chart(
            "leverage",
            "Total debt / EBITDA",
            ["FY2023 | 4.2 | x", "FY2023 | 4.3 | x", "FY2024 | 4.4 | x"],
        ),
    )
    result = built(tmp_path)  # the repeat also makes the table unorderable: no metric at all
    assert "leverage" not in result["real"][0]["metrics"]


def test_two_prior_rows_for_the_label_give_no_prior():
    rows = [
        {"Period": "FY2023", "Cash": "10", "Reporting unit": "US$m"},
        {"Period": "FY2023", "Cash": "11", "Reporting unit": "US$m"},
        {"Period": "FY2024", "Cash": "12", "Reporting unit": "US$m"},
    ]
    assert prior_metric(rows, rows[2], "Cash") is None


def test_an_unquotable_prior_cell_gives_no_prior(tmp_path):
    for cell in ("n.a.", ""):
        metrics = lev_metrics(
            tmp_path / (cell or "empty"), [f"FY2023 | {cell} | x", "FY2024 | 4.4 | x"]
        )
        assert "prior" not in metrics["leverage"] and "change" not in metrics["leverage"]


def test_a_prior_in_another_unit_gives_no_prior(tmp_path):
    metrics = lev_metrics(tmp_path, ["FY2023 | 4.2 | %", "FY2024 | 4.4 | x"])
    assert "prior" not in metrics["leverage"] and "change" not in metrics["leverage"]


def test_a_current_period_without_a_year_gives_no_prior_in_the_catalogue(tmp_path):
    charts = one_chart(
        "liquidity", "Cash ; Undrawn committed facilities", ["LTM Sep-25 | 5 | 6 | US$m"]
    )
    make_run(tmp_path, "run-a", cp1_extra=charts)
    # `LTM Sep-25` cannot be ordered, so the table gives no metric and no comparator either
    assert "cash" not in built(tmp_path)["real"][0]["metrics"]


def test_the_adjusted_twin_column_supplies_the_prior(tmp_path):
    charts = one_chart(
        "leverage",
        "Total debt / adjusted EBITDA",
        ["FY2023 | 3.5 | x", "FY2024 | 3.9 | x"],
    )
    make_run(tmp_path, "run-a", cp1_extra=charts)
    leverage = built(tmp_path)["real"][0]["metrics"]["leverage"]
    assert leverage["label"] == "Total debt / adjusted EBITDA"
    assert leverage["prior"] == {"value": "3.5", "period": "FY2023"}
    assert leverage["change"] == "0.4"


@given(a=quotable, b=quotable)
def test_change_is_the_exact_decimal_difference(a, b):
    rows = [
        {"Period": "FY2023", "Cash": b, "Reporting unit": "US$m"},
        {"Period": "FY2024", "Cash": a, "Reporting unit": "US$m"},
    ]
    prior, change = prior_metric(rows, rows[1], "Cash")
    assert prior == {"value": b, "period": "FY2023"}
    exact = Decimal(a) - Decimal(b)
    assert change == format(abs(exact) if exact == 0 else exact, "f")  # a zero change has no sign


def _change(current, prior):
    rows = [
        {"Period": "FY2023", "Cash": prior, "Reporting unit": "US$m"},
        {"Period": "FY2024", "Cash": current, "Reporting unit": "US$m"},
    ]
    return prior_metric(rows, rows[1], "Cash")[1]


def test_a_long_figure_is_subtracted_exactly():
    assert _change("1234567890123456789012345678.9", "0.1") == "1234567890123456789012345678.8"


def test_a_zero_change_has_no_sign_and_keeps_the_decimals():
    assert _change("-0", "0") == "0"
    assert _change("-0.0", "0.00") == "0.00"
    assert _change("0.50", "0.50") == "0.00"


def test_small_changes_are_unchanged():
    assert _change("4.4", "4.2") == "0.2"
    assert _change("4.00", "4.50") == "-0.50"


def _decimals(text):
    return len(text.partition(".")[2])


def _integer_oracle(current, prior):
    scale = max(_decimals(current), _decimals(prior))

    def scaled(text):
        whole, _, frac = text.partition(".")
        return int(whole + frac.ljust(scale, "0"))

    diff = scaled(current) - scaled(prior)
    digits = str(abs(diff)).rjust(scale + 1, "0")
    point = len(digits) - scale
    body = digits[:point] + ("." + digits[point:] if scale else "")
    return ("-" if diff < 0 else "") + body


@settings(max_examples=200)
@given(a=long_quotable, b=long_quotable)
def test_change_equals_integer_arithmetic_for_long_figures(a, b):
    assert _change(a, b) == _integer_oracle(a, b)


def _based(prior_basis, current_basis):
    rows = [
        {
            "Period": "FY2023",
            "Cash": "10",
            "Reporting unit": "x",
            "Basis and limitation": prior_basis,
        },
        {
            "Period": "FY2024",
            "Cash": "12",
            "Reporting unit": "x",
            "Basis and limitation": current_basis,
        },
    ]
    return prior_metric(rows, rows[1], "Cash")


def test_rows_stating_different_definitions_give_no_comparator():
    assert (
        _based(
            "Gross and net debt over EBITDA As Defined",
            "over EBITDA As Defined; net figure uses year-end cash still holding the USD 4,216 "
            "million accrued dividend, 5.55x pro forma (calculation C11)",
        )
        is None
    )


def test_identical_basis_text_keeps_the_comparator():
    assert _based("Net of cash.", "Net of cash.") == ({"value": "10", "period": "FY2023"}, "2")


def test_basis_differing_only_by_page_digits_or_punctuation_keeps_the_comparator():
    assert _based("Net of cash (page 12).", "Net of cash, 2024; p. 15") is not None


BASIS_COLUMN = "Basis and limitation |"


def test_catalogue_metric_carries_no_prior_across_different_basis(tmp_path):
    head = "| Period | Total debt / EBITDA | Net debt / EBITDA | Reporting unit | " + BASIS_COLUMN
    text = f"""### Chart data: leverage

{head}
| --- | --- | --- | --- | --- |
| FY2023 | 5.87 | 4.84 | x | Gross and net debt over EBITDA As Defined |
| FY2024 | 6.01 | 4.51 | x | Net figure uses year-end cash holding the accrued dividend |
"""
    from deploy_workflow.credit_os_catalogue import handoff_metrics

    metrics = handoff_metrics("x", {"path": "p.md", "sha256": "0" * 64}, text, {}, [])
    for key in ("leverage", "net_leverage"):
        assert "prior" not in metrics[key] and "change" not in metrics[key]


def revenue_metrics(tmp_path, rows: list[str]) -> dict:
    charts = one_chart("revenue and EBITDA", "Revenue ; Adjusted EBITDA", rows)
    make_run(tmp_path, "run-a", cp1_extra=charts)
    return built(tmp_path)["real"][0]["metrics"]


def test_revenue_and_adjusted_ebitda_keep_their_commas_and_the_exact_change(tmp_path):
    metrics = revenue_metrics(
        tmp_path, ["FY2023 | 2,100 | 410 | US$m", "FY2024 | 2,250 | 445.5 | US$m"]
    )
    revenue, ebitda = metrics["revenue"], metrics["adjusted_ebitda"]
    assert (revenue["value"], revenue["unit"], revenue["period"]) == ("2,250", "US$m", "FY2024")
    assert revenue["prior"] == {"value": "2,100", "period": "FY2023"}
    assert revenue["change"] == "150"
    assert ebitda["value"] == "445.5"
    assert ebitda["prior"]["value"] == "410"
    assert ebitda["change"] == "35.5"


def test_a_latest_cell_not_supplied_leaves_only_that_metric_out(tmp_path):
    metrics = revenue_metrics(
        tmp_path,
        [
            "FY2023 | 2,100 | 410 | US$m",
            "FY2024 | 2,250 | Not supplied: the measure is not stated | US$m",
        ],
    )
    assert "adjusted_ebitda" not in metrics
    assert metrics["revenue"]["value"] == "2,250"


def test_a_prior_cell_not_supplied_gives_no_comparator(tmp_path):
    metrics = revenue_metrics(
        tmp_path, ["FY2023 | Not supplied: x | 410 | US$m", "FY2024 | 2,250 | 445.5 | US$m"]
    )
    assert "prior" not in metrics["revenue"] and "change" not in metrics["revenue"]
    assert metrics["adjusted_ebitda"]["change"] == "35.5"


def test_without_the_table_there_is_no_revenue_and_commas_stay_refused_elsewhere(tmp_path):
    metrics = lev_metrics(tmp_path, ["FY2023 | 4.2 | x", "FY2024 | 1,234 | x"])
    assert "revenue" not in metrics and "adjusted_ebitda" not in metrics
    assert "leverage" not in metrics
