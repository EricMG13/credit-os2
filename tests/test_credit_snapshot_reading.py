"""Credit Snapshot reading: how handoff text becomes cells (SYNTHETIC handoffs, Northbridge).

Fidelity scope: each test compares the cell texts the reader produced with the handoff text they
come from (literal expected values, written here, not taken from production code).
"""

from __future__ import annotations

from dataclasses import replace

import credit_snapshot_case as cs
import test_credit_snapshot as base

from deploy_workflow import credit_snapshot as snap

BRIDGE_HEAD = """### Chart data: EBITDA bridge

| Step | Amount | Add-Back ID | Reporting unit | Basis and limitation |
|---|---:|---|---|---|
| Reported EBITDA | 100 | Not applicable | USD millions | Opening EBITDA. |
| Synergies | 10 | AB-1 | USD millions | Signed adjustment. |
"""
CLOSING = "| Adjusted EBITDA | {} | Not applicable | USD millions | Closing EBITDA. |\n"
BRIDGE_ROWS = ("Structuring EBITDA", "Less unrealised add-backs", "House EBITDA")


def cell(row, column, text):
    return snap.SnapshotCell("Inputs", "Block", row, column, snap.COPIED, text)


def bridge_snapshot(closing: str):
    prefix, _, _ = base.FIXTURE["CP-1"].partition("### Chart data: EBITDA bridge")
    cp1 = prefix + BRIDGE_HEAD + CLOSING.format(closing)
    return snap.gather(base.run_of(base.full(**{"CP-1": cp1})))


def test_one_duplicate_row_occurrence_takes_one_number_in_every_column():
    cells = [
        cell("Revenue", "Value", "1"),
        cell("Revenue", "Unit", "GBP m"),
        cell("Revenue", "Value", "2"),
        cell("Revenue", "Unit", "EUR m"),
        cell("Revenue (2)", "Value", "3"),
    ]
    got = [(c.row, c.column, c.text) for c in snap._numbered(cells)]
    assert got == [
        ("Revenue", "Value", "1"),
        ("Revenue", "Unit", "GBP m"),
        ("Revenue (3)", "Value", "2"),
        ("Revenue (3)", "Unit", "EUR m"),
        ("Revenue (2)", "Value", "3"),
    ]


def test_a_bridge_closing_amount_that_is_not_a_plain_number_is_a_gap_not_a_recomputed_value():
    for closing in ("$110", "110 (est.)"):
        snapshot = bridge_snapshot(closing)
        for row in BRIDGE_ROWS:
            found = base.one(snapshot, "EBITDA bridge", row, "Value")
            assert (found.kind, found.text) == ("gap", snap.BRIDGE_RECONCILIATION_GAP), closing


def test_a_bridge_closing_amount_that_is_blank_or_a_stated_gap_still_recomputes_structuring():
    for closing in ("", "Not supplied: not disclosed"):
        snapshot = bridge_snapshot(closing)
        found = base.one(snapshot, "EBITDA bridge", "Structuring EBITDA", "Value")
        assert (found.kind, found.text) == ("computed", "110"), closing


def prose_text(section: str, body: str):
    cp1b = base.FIXTURE["CP-1B"]
    head, _, rest = cp1b.partition("### Key findings")
    bottom = head.split("### Bottom line")[0] + "### Bottom line\n" + body + "\n\n"
    cut = bottom + "### Key findings" + rest
    snapshot = snap.gather(base.run_of(base.full(**{"CP-1B": cut})))
    return {c.row: c.text for c in base.where(snapshot, "Historical performance", None, "Text")}


def test_a_line_starting_with_a_hash_and_a_digit_is_a_paragraph_not_a_heading():
    got = prose_text("Bottom line", "#1 operator in the UK by subscribers.\n\nLeverage is 3.1x.")
    assert got["Bottom line 1"] == "#1 operator in the UK by subscribers."
    assert got["Bottom line 2"] == "Leverage is 3.1x."


def test_thematic_breaks_and_comment_only_lines_are_not_paragraphs():
    body = (
        "First point.\n---\n***\n___\n<!-- table-id: T4.12 -->\n"
        "Second point. <!-- note -->\n\nThird point."
    )
    got = prose_text("Bottom line", body)
    assert [got[f"Bottom line {n}"] for n in (1, 2, 3)] == [
        "First point.",
        "Second point. <!-- note -->",
        "Third point.",
    ]
    assert "Bottom line 4" not in got


def test_a_windows_1252_csv_matches_an_issuer_name_with_a_curly_apostrophe(tmp_path):
    company = "Moody’s Holdings"
    header = [h.replace("Δ", "D") for h in base.RV_HEADER]  # the header must be Windows-1252 too
    row = base.rv_row("SYN1", "ABCDEFGHIJK1", company=company)
    lines = [",".join(header), ",".join(row.get(h, "") for h in base.RV_HEADER)]
    path = tmp_path / "rv.csv"
    path.write_bytes("\n".join(lines).encode("cp1252"))
    assert b"\x92" in path.read_bytes()
    case = replace(cs.CASES["full"], issuer_name=company, sources=(("rv.csv", path),))
    built = cs.build_case(tmp_path / "run", case)
    snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    block = {(c.row, c.column): c.text for c in base.where(snapshot, "Market identifiers")}
    assert block[("Row 2", "Company")] == company
