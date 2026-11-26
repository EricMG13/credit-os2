"""The method-script readers on a REAL model handoff: CP-2G from the offline replay of TDG run
20261125-162721-01 (tests/fixtures/live_2026_11_25/CP-2G-replay-tdg.md, copied verbatim).
Expected values are typed by hand from that file's lines 149-163 (T2H.6)."""

from pathlib import Path

from deploy_workflow import method_scripts as ms

REAL = (Path(__file__).parent / "fixtures/live_2026_11_25/CP-2G-replay-tdg.md").read_text(
    encoding="utf-8"
)


def test_a_heading_and_its_table_id_tag_are_one_register():
    table = ms.register_table(REAL, "T2H.6")
    assert not isinstance(table, str), table
    header, rows = table
    assert header[:3] == ["period", "case", "Gross / net leverage (x)"]
    assert len(rows) == 10
    assert rows[7][:3] == ["FY2025", "Downside", "7.39x / 6.66x"]


def test_two_headings_for_one_register_are_still_two():
    text = "#### T2H.6 A\n\n| a |\n|---|\n| 1 |\n\n#### T2H.6 B\n\n| a |\n|---|\n| 2 |\n"
    assert ms.register_table(text, "T2H.6") == "the handoff has 2 T2H.6 registers"


def test_a_tag_after_a_table_belongs_to_a_second_register():
    text = "#### T2H.6 A\n| a |\n|---|\n| 1 |\n\n<!-- table-id: T2H.6 -->\n| a |\n|---|\n| 2 |\n"
    assert ms.register_table(text, "T2H.6") == "the handoff has 2 T2H.6 registers"


def test_a_column_named_without_spacing_around_a_slash_matches_the_spaced_header():
    table = ms.register_table(REAL, "T2H.6")
    assert not isinstance(table, str)
    assert ms.column(table, "gross/net leverage", "T2H.6") == (2, "Gross / net leverage (x)")


def test_the_cp2g_check_reads_the_real_handoff():
    outcomes = ms.run("CP-2G", REAL)
    skipped = [o for o in outcomes if o.status == "not checked" and o.figure == "all"]
    assert skipped == []
    status = {o.figure: o.status for o in outcomes}
    assert status["Net leverage (FY2025, Downside)"] == "agreed"  # T2H.6 line 158: 7.39x / 6.66x
    assert "disagreed" not in status.values()
    assert ms.issues("CP-2G", REAL) == ()
