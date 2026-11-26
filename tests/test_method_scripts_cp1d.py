"""CP-1D preserves the bridge join key into its two add-back tables.

Synthetic case, issuer Synthetic Example Co., as of 2026-11-26. The expected IDs
below come from the hand-written CP-1 bridge row order, not the check implementation.
"""

import pytest

from deploy_workflow import method_scripts as ms
from deploy_workflow.owners import cpos_launch


def _table(
    ident: str,
    headers: tuple[str, ...],
    rows: tuple[tuple[str, ...], ...],
    *,
    heading: str = "##",
) -> str:
    header = f"| {' | '.join(headers)} |"
    separator = f"| {' | '.join('---' for _ in headers)} |"
    body = (f"| {' | '.join(row)} |" for row in rows)
    return f"{heading} {ident}\n\n{header}\n{separator}\n" + "\n".join(body)


def _is_id_column(name: str) -> bool:
    return "".join(char for char in name.casefold() if char.isalnum()) == "addbackid"


def _run(
    cp1_ids: tuple[str, ...],
    register_ids: tuple[str, ...],
    assessment_ids: tuple[str, ...],
    *,
    register_headers: tuple[str, ...] = ("Add-Back ID", "Description"),
    assessment_headers: tuple[str, ...] = ("Add-Back ID", "Assessment"),
):
    bridge_rows = (
        ("Reported EBITDA", "100", "Not applicable", "USD millions", "Reported"),
        *tuple(
            (f"Add-back {i}", "5", ident, "USD millions", "Bridge")
            for i, ident in enumerate(cp1_ids, start=1)
        ),
        (
            "Adjusted EBITDA",
            str(100 + 5 * len(cp1_ids)),
            "Not applicable",
            "USD millions",
            "Adjusted",
        ),
    )
    upstream = {
        "CP-1": _table(
            "Chart data: EBITDA bridge",
            ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
            bridge_rows,
            heading="###",
        )
    }
    register = _table(
        "T1D.1",
        register_headers,
        tuple(
            tuple(ident if _is_id_column(name) else "Copied" for name in register_headers)
            for ident in register_ids
        )
        or (tuple("NONE" if _is_id_column(name) else "No add-back" for name in register_headers),),
    )
    assessment = _table(
        "T1D.2",
        assessment_headers,
        tuple(
            tuple(ident if _is_id_column(name) else "Supported" for name in assessment_headers)
            for ident in assessment_ids
        )
        or (
            tuple("NONE" if _is_id_column(name) else "No add-back" for name in assessment_headers),
        ),
    )
    return ms.run(
        "CP-1D",
        f"## Findings\n\n{register}\n\n{assessment}",
        upstream,
    )


def test_cp1d_ids_match_the_cp1_bridge_in_both_addback_registers():
    outcomes = _run(("AB-1", "AB-2"), ("AB-1", "AB-2"), ("AB-1", "AB-2"))

    assert [(item.register, item.status) for item in outcomes] == [
        ("T1D.1", "agreed"),
        ("T1D.2", "agreed"),
    ]


def test_cp1d_keeps_stated_ids_and_skips_interior_no_key_bridge_positions():
    bridge = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "Not supplied: gap", "Not applicable", "USD millions", "Synthetic"),
            (
                "Unidentified adjustment",
                "Not supplied: gap",
                "Not applicable",
                "USD millions",
                "Synthetic",
            ),
            ("Restructuring", "Not supplied: gap", "AB-7", "USD millions", "Synthetic"),
            ("Adjusted EBITDA", "Not supplied: gap", "Not applicable", "USD millions", "Synthetic"),
        ),
        heading="###",
    )
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n"
        "| Not supplied: CP-1 does not state an Add-Back ID for this adjustment | Gap |\n"
        "| AB-7 | Copied |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n"
        "| Not supplied: CP-1 does not state an Add-Back ID for this adjustment | Gap |\n"
        "| AB-7 | Assessed |"
    )

    outcomes = ms.run("CP-1D", response, {"CP-1": bridge})

    assert [outcome.status for outcome in outcomes] == ["agreed", "agreed"]


def test_cp1d_distinguishes_unknown_gap_bridge_from_known_zero_addbacks():
    table_spec = next(
        table
        for table in cpos_launch.OWNER_TABLES["CP-1"]
        if table.heading.endswith("EBITDA bridge")
    )
    header = ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation")
    cases = (
        (
            "named adjustment with unknown amount and ID",
            (
                (
                    "Reported EBITDA",
                    "Not supplied: synthetic",
                    "Not applicable",
                    "US$m",
                    "Synthetic",
                ),
                (
                    "Restructuring adjustment",
                    "Not supplied: synthetic",
                    "Not applicable",
                    "US$m",
                    "Synthetic",
                ),
                (
                    "Adjusted EBITDA",
                    "Not supplied: synthetic",
                    "Not applicable",
                    "US$m",
                    "Synthetic",
                ),
            ),
            "Not supplied: CP-1 does not state an Add-Back ID for this adjustment",
        ),
        (
            "boundary-only bridge with unknown amounts",
            (
                (
                    "Reported EBITDA",
                    "Not supplied: synthetic",
                    "Not applicable",
                    "US$m",
                    "Synthetic",
                ),
                (
                    "Adjusted EBITDA",
                    "Not supplied: synthetic",
                    "Not applicable",
                    "US$m",
                    "Synthetic",
                ),
            ),
            "Not supplied: CP-1 bridge amounts do not establish whether add-backs exist",
        ),
        (
            "single all-gap row",
            (("EBITDA bridge", "Not supplied: synthetic", "Not applicable", "US$m", "Synthetic"),),
            "Not supplied: CP-1 bridge amounts do not establish whether add-backs exist",
        ),
        (
            "numeric equal boundaries with no adjustment rows",
            (
                ("Reported EBITDA", "100", "Not applicable", "US$m", "Synthetic"),
                ("Adjusted EBITDA", "100", "Not applicable", "US$m", "Synthetic"),
            ),
            "NONE",
        ),
    )

    for name, rows, required_id in cases:
        cp1 = _table("Chart data: EBITDA bridge", header, rows, heading="###")
        assert cpos_launch.chart_issues(cp1, table_spec, money="US$m") == (), name
        response = (
            "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n"
            f"| {required_id} | Synthetic case |\n\n"
            "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n"
            f"| {required_id} | Synthetic case |"
        )
        outcomes = ms.run("CP-1D", response, {"CP-1": cp1})
        assert [outcome.status for outcome in outcomes] == ["agreed", "agreed"], name
        if required_id != "NONE":
            invented_zero = response.replace(required_id, "NONE")
            outcomes = ms.run("CP-1D", invented_zero, {"CP-1": cp1})
            assert [outcome.status for outcome in outcomes] == ["disagreed", "disagreed"], name
        else:
            unverified_gap = response.replace(
                "NONE",
                "Not supplied: CP-1 bridge amounts do not establish whether add-backs exist",
            )
            outcomes = ms.run("CP-1D", unverified_gap, {"CP-1": cp1})
            assert [outcome.status for outcome in outcomes] == ["missing", "missing"], name


@pytest.mark.parametrize("source_id", ("AB*-1", "AB`-1"))
def test_cp1d_does_not_erase_embedded_markdown_characters_from_ids(source_id):
    outcomes = _run((source_id,), ("AB-1",), ("AB-1",))

    assert [outcome.status for outcome in outcomes] == ["disagreed", "disagreed"]


def test_cp1d_allows_markdown_wrapping_around_a_whole_id_cell():
    outcomes = _run(("**AB-1**",), ("`AB-1`",), ("AB-1",))

    assert [outcome.status for outcome in outcomes] == ["agreed", "agreed"]


def test_cp1d_does_not_strip_space_padded_literal_asterisks_from_ids():
    outcomes = _run(("* AB-1 *",), ("AB-1",), ("AB-1",))

    assert [outcome.status for outcome in outcomes] == ["disagreed", "disagreed"]


def test_cp1d_blocked_handoff_does_not_require_addback_registers():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),
            ("Adjusted EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),
        ),
        heading="###",
    )
    blocked = "---\nmodule_status: Blocked\n---\n## Findings\nStopped at input gate."

    outcomes = ms.run("CP-1D", blocked, {"CP-1": cp1})

    assert len(outcomes) == 1
    assert outcomes[0].status == "not checked"
    assert "stopped at its gate" in outcomes[0].reason


def test_cp1d_recognizes_blocked_status_in_uniformly_indented_front_matter():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
        (("Reported EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),),
        heading="###",
    )
    blocked = "---\n  module_id: CP-1D\n  module_status: Blocked\n---\n## Findings"

    outcomes = ms.run("CP-1D", blocked, {"CP-1": cp1})

    assert len(outcomes) == 1
    assert outcomes[0].status == "not checked"


def test_cp1d_ignores_unindented_yaml_comments_when_finding_root_status():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
        (("Reported EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),),
        heading="###",
    )
    blocked = "---\n# Gate result\n  module_id: CP-1D\n  module_status: Blocked\n---\n## Findings"

    outcomes = ms.run("CP-1D", blocked, {"CP-1": cp1})

    assert len(outcomes) == 1
    assert outcomes[0].status == "not checked"


def test_cp1d_does_not_treat_nested_blocked_status_as_a_blocked_handoff():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),
            ("Adjusted EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),
        ),
        heading="###",
    )
    nested_status = (
        "---\nmodule_status: Complete\nupstream:\n  module_status: Blocked\n---\n## Findings"
    )

    outcomes = ms.run("CP-1D", nested_status, {"CP-1": cp1})

    assert [outcome.status for outcome in outcomes] == ["missing", "missing"]


def test_cp1d_raw_table_mode_is_opt_in_for_existing_parser_callers():
    handoff = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Add-Back ID"),
        (("Restructuring", "AB*-1"),),
        heading="###",
    )

    assert ms.heading_table(handoff, "Chart data: EBITDA bridge")[1][0][1] == "AB-1"
    assert (
        ms.heading_table(handoff, "Chart data: EBITDA bridge", raw_cells=True)[1][0][1] == "AB*-1"
    )


def test_cp1d_missing_or_reordered_ids_are_sent_back_per_register():
    outcomes = _run(("AB-1", "AB-2"), ("AB-2", "AB-1"), ("AB-1",))

    assert [(item.register, item.status) for item in outcomes] == [
        ("T1D.1", "disagreed"),
        ("T1D.2", "disagreed"),
    ]


def test_cp1d_duplicate_ids_are_sent_back_even_when_the_source_is_duplicate():
    outcomes = _run(("AB-1", "AB-1"), ("AB-1", "AB-1"), ("AB-1", "AB-1"))

    assert [item.status for item in outcomes] == ["disagreed", "disagreed"]
    assert all("duplicated AB-1" in item.reason for item in outcomes)


def test_cp1d_does_not_treat_a_none_row_as_empty_after_a_real_bridge_id():
    outcomes = _run(("AB-1",), ("AB-1", "NONE"), ("AB-1", "NONE"))

    assert [item.status for item in outcomes] == ["disagreed", "disagreed"]
    assert all("unexpected NONE" in item.reason for item in outcomes)


def test_cp1d_old_bridge_without_ids_is_not_blocked():
    cp1 = _table(
        "T4.17",
        ("Step", "Amount", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "100", "USD millions", "Reported"),
            ("Adjusted EBITDA", "100", "USD millions", "Synthetic"),
        ),
    )
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n| NONE | No add-back |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n| NONE | No add-back |"
    )
    outcomes = ms.run("CP-1D", response, {"CP-1": cp1})

    assert [outcome.status for outcome in outcomes] == ["agreed", "agreed"]


def test_cp1d_compares_stated_ids_without_needing_an_amount_column():
    cp1 = _table(
        "T4.17",
        ("Step", "Add-Back ID"),
        (
            ("Reported EBITDA", "Not applicable"),
            ("Restructuring", "AB-1"),
            ("Adjusted EBITDA", "Not applicable"),
        ),
    )
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n| AB-1 | Copied |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n| AB-1 | Assessed |"
    )

    assert [outcome.status for outcome in ms.run("CP-1D", response, {"CP-1": cp1})] == [
        "agreed",
        "agreed",
    ]


def test_cp1d_compares_every_row_in_a_tagged_adjustment_register():
    cp1 = _table(
        "T4.17",
        ("addback_id", "addback_label", "value"),
        (("AB-1", "Restructuring", "5"), ("AB-2", "Integration", "3"), ("AB-3", "Other", "2")),
    )
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n"
        "| AB-1 | Restructuring |\n| AB-2 | Integration |\n| AB-3 | Other |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n"
        "| AB-1 | Assessed |\n| AB-2 | Assessed |\n| AB-3 | Assessed |"
    )

    assert [outcome.status for outcome in ms.run("CP-1D", response, {"CP-1": cp1})] == [
        "agreed",
        "agreed",
    ]


def test_cp1d_preserves_stated_ids_at_chart_boundary_positions():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID"),
        (
            ("Reported EBITDA", "100", "AB-1"),
            ("Restructuring", "5", "AB-2"),
            ("Adjusted EBITDA", "105", "AB-3"),
        ),
        heading="###",
    )
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n"
        "| AB-1 | Reported |\n| AB-2 | Restructuring |\n| AB-3 | Adjusted |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n"
        "| AB-1 | Reported |\n| AB-2 | Assessed |\n| AB-3 | Adjusted |"
    )

    assert [outcome.status for outcome in ms.run("CP-1D", response, {"CP-1": cp1})] == [
        "agreed",
        "agreed",
    ]


def test_cp1d_legacy_single_row_all_gap_is_an_unknown_bridge_not_an_adjustment():
    cp1 = _table(
        "T4.17",
        ("Step", "Amount", "Reporting unit", "Basis and limitation"),
        (("EBITDA bridge", "Not supplied: synthetic", "USD millions", "Synthetic"),),
    )
    marker = "Not supplied: CP-1 bridge amounts do not establish whether add-backs exist"
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n"
        f"| {marker} | Unknown bridge |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n"
        f"| {marker} | Unknown bridge |"
    )

    assert [outcome.status for outcome in ms.run("CP-1D", response, {"CP-1": cp1})] == [
        "agreed",
        "agreed",
    ]


def test_cp1d_legacy_bridge_requires_explicit_missing_key_for_each_adjustment():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "100", "USD millions", "Synthetic"),
            ("Restructuring", "5", "USD millions", "Synthetic"),
            ("Adjusted EBITDA", "105", "USD millions", "Synthetic"),
        ),
        heading="###",
    )
    missing_key = "Not supplied: CP-1 bridge has no Add-Back ID"
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n"
        f"| {missing_key} | Key unavailable |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n"
        f"| {missing_key} | Key unavailable |"
    )

    assert [outcome.status for outcome in ms.run("CP-1D", response, {"CP-1": cp1})] == [
        "agreed",
        "agreed",
    ]
    invented = response.replace(missing_key, "AB-1")
    assert [outcome.status for outcome in ms.run("CP-1D", invented, {"CP-1": cp1})] == [
        "disagreed",
        "disagreed",
    ]


def test_cp1d_allows_one_missing_key_marker_per_legacy_adjustment():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "100", "USD millions", "Synthetic"),
            ("Restructuring", "5", "USD millions", "Synthetic"),
            ("Integration", "8", "USD millions", "Synthetic"),
            ("Adjusted EBITDA", "113", "USD millions", "Synthetic"),
        ),
        heading="###",
    )
    marker = "Not supplied: CP-1 bridge has no Add-Back ID"
    rows = f"| {marker} | Key unavailable |\n| {marker} | Key unavailable |"
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n"
        f"{rows}\n\n## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n{rows}"
    )

    assert [outcome.status for outcome in ms.run("CP-1D", response, {"CP-1": cp1})] == [
        "agreed",
        "agreed",
    ]


def test_cp1d_empty_bridge_does_not_require_synthetic_addback_ids():
    outcomes = _run((), (), ())

    assert [(item.register, item.status) for item in outcomes] == [
        ("T1D.1", "agreed"),
        ("T1D.2", "agreed"),
    ]


def test_cp1d_empty_bridge_requires_explicit_none_rows():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),
            ("Adjusted EBITDA", "100", "Not applicable", "USD millions", "Synthetic"),
        ),
        heading="###",
    )
    response = (
        "## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n\n"
        "## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |"
    )

    outcomes = ms.run("CP-1D", response, {"CP-1": cp1})

    assert [outcome.status for outcome in outcomes] == ["missing", "missing"]
    assert all("requires one NONE row" in outcome.reason for outcome in outcomes)


def test_cp1d_check_is_included_in_the_retained_check_record():
    cp1 = _table(
        "T4.17",
        ("Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"),
        (
            ("Reported EBITDA", "100", "Not applicable", "USD millions", "Reported"),
            ("Add-back 1", "5", "AB-1", "USD millions", "Bridge"),
            ("Adjusted EBITDA", "105", "Not applicable", "USD millions", "Adjusted"),
        ),
    )
    response = (
        b"## T1D.1\n\n| Add-Back ID | Description |\n| --- | --- |\n| AB-1 | Copied |\n\n"
        b"## T1D.2\n\n| Add-Back ID | Assessment |\n| --- | --- |\n| AB-1 | Supported |"
    )
    record = ms.record("CP-1D", response, {"CP-1": cp1.encode()})

    assert record is not None
    script = ms.CHECKS["CP-1D"][0]
    assert record["scripts"][script] == ms.registered()[script]
    own_checks = [check for check in record["checks"] if check["script"] == script]
    assert [check["status"] for check in own_checks] == ["agreed", "agreed"]


def test_cp1d_refuses_ambiguous_duplicate_addback_id_columns():
    outcomes = _run(
        ("AB-1",),
        ("AB-1",),
        ("AB-1",),
        register_headers=("Add-Back ID", "Description", "add back id"),
    )

    assert [item.status for item in outcomes] == ["missing", "agreed"]
    assert "2 Add-Back ID columns" in outcomes[0].reason


def test_cp1d_refuses_duplicate_addback_id_columns_in_the_assessment_table():
    outcomes = _run(
        ("AB-1",),
        ("AB-1",),
        ("AB-1",),
        assessment_headers=("Add-Back ID", "Assessment", "add back id"),
    )

    assert [item.status for item in outcomes] == ["agreed", "missing"]
    assert "2 Add-Back ID columns" in outcomes[1].reason


def test_cp1d_distinguishes_an_ambiguous_source_header_from_a_legacy_absent_header():
    cp1 = _table(
        "Chart data: EBITDA bridge",
        ("Step", "Amount", "Add-Back ID", "add back id", "Reporting unit"),
        (
            ("Reported EBITDA", "100", "Not applicable", "Not applicable", "USD millions"),
            ("Add-back 1", "5", "AB-1", "AB-1", "USD millions"),
            ("Adjusted EBITDA", "105", "Not applicable", "Not applicable", "USD millions"),
        ),
        heading="###",
    )

    (outcome,) = ms.run("CP-1D", "", {"CP-1": cp1})

    assert outcome.status == "not checked"
    assert "2 Add-Back ID columns" in outcome.reason
