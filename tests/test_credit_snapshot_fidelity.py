"""The Credit Snapshot answer key and its fidelity check (PR 4, Delivers item 4).

The key is `tests/fixtures/credit_snapshot/` (handoffs, `expected_cells*.json`,
`expected_workings.md`) and `tests/credit_snapshot_case.py`. The implementer of Tasks 2 and 3 edits
none of it. The expected files were written by hand from the handoff text and
`docs/methodology/portfolio-recommendation.md`, never by running `credit_snapshot` or the writer.

Two groups of tests:

- The key itself (pass now): the run folders pass `report_completion` and `verified_delivery`, the
  context pin loads, the references load from a `Store`, every expected copied value is a cell of
  its handoff line, and every hand-derived value equals what `recommendation.py` returns.
- The product against the key (fail until Tasks 2 and 3 exist, with ImportError on
  `deploy_workflow.credit_snapshot` or `credit_snapshot_workbook`): `gather` yields the expected
  cells, and the saved workbook, re-opened with openpyxl, is compared with the handoffs through its
  Sources sheet using this file's own readers (`credit_snapshot_case.pipe_cells`,
  `physical_lines`, `render_number`), not the writer's.

Entry vocabulary of the expected files: `sheet`, `block`, `row`, `column`, `kind` (copied, gap,
computed, entered at run start, analyst), `value`; copied entries also `module` and the 1-based
`line` of the handoff; `number: true` when the cell must hold a number. A table row's `row` is its
first column's cell; a prose paragraph's is `<section> <n>`. See `expected_workings.md`.
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from dataclasses import replace
from datetime import datetime
from decimal import Decimal
from fractions import Fraction
from io import BytesIO
from pathlib import Path

import credit_snapshot_case as cs
import pytest
from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell

from deploy_vii.context import load_context
from deploy_workflow import library_index
from deploy_workflow import recommendation as rec
from deploy_workflow import reference_portfolios as rp
from deploy_workflow.cp2_scorecard import parse_scorecard

READER_SHEETS = ("Snapshot", "Model", "Inputs", "Matrix")
KINDS = ("copied", "gap", "computed", "entered at run start")
SOURCE_KINDS = (*KINDS, "analyst", "label", "formula", "rule")
MODEL_REFERENCE = re.compile(r"=(?:Model|'Model')!\$([A-Z]+)\$([1-9][0-9]*)")
WORDS = {
    "breached": "breached",
    "within": "within",
    "not_read": "not read",
    "does_not_apply": "does not apply",
}
TDG_SCOPE = "retained real CP-1 handoff, TransDigm, as of 2024-09-30, CP-1 blocks only"
DAMAGED = (
    "The stored portfolio 'jnk' cannot be read: its file is damaged or is not a stored portfolio."
)


# The methodology's constants, typed from docs/methodology/portfolio-recommendation.md (sections 2,
# 4, 5, 6 and 7), never imported from recommendation.py. Each is one `rule` row on Matrix:
# (block, row, column) -> the cell's value (a number, or text for a name).
def _rules() -> dict[tuple[str, str, str], int | str]:
    rules: dict[tuple[str, str, str], int | str] = {}
    table = ((1, 2, 2, 3, 3), (2, 2, 3, 3, 4), (2, 3, 3, 4, 4), (3, 3, 4, 4, 5), (3, 4, 4, 5, 5))
    for credit, line in enumerate(table, start=1):  # section 6: row Credit Score, column Valuation
        for valuation, result in enumerate(line, start=1):
            rules["Recommendation table", f"Credit Score {credit}", f"Valuation {valuation}"] = (
                result
            )
    for row, edge in (("Score 1 edge", 100), ("Score 2 edge", 40), ("Score 4 edge", -40)):
        rules["Valuation bands", row, "Difference (bp)"] = edge  # section 5
    rules["Valuation bands", "Score 5 edge", "Difference (bp)"] = -100
    names = {  # section 2; Valuation 2, 3 and 4 are "not named in the approved design"
        "Credit Score": ("Strong", "Good", "Fair", "Weak", "Stressed"),
        "Valuation": ("Very attractive", None, None, None, "Very unattractive"),
        "Recommendation": ("Strong OW", "Modest OW", "MW", "Modest UW", "Strong UW"),
    }
    for scale, words in names.items():
        for level, word in enumerate(words, start=1):
            rules["Scales", f"{scale} {level}", "Level"] = level
            if word is not None:
                rules["Scales", f"{scale} {level}", "Name"] = word
    rules["Credit Score rules", "Minimum scored factors", "Value"] = 12  # section 4
    rules["Credit Score rules", "Floor level", "Value"] = 4
    rules["Credit Score rules", "Floor factor 1", "Value"] = "Liquidity"
    rules["Credit Score rules", "Floor factor 2", "Value"] = "Maturity profile"
    rules["Credit Score rules", "Cap level", "Value"] = 3  # section 7
    return rules


RULES = _rules()


@pytest.fixture(params=list(cs.CASES))
def built(request, tmp_path):
    return cs.build_case(tmp_path, cs.CASES[request.param])


@pytest.fixture
def full(tmp_path):
    return cs.build_case(tmp_path, cs.CASES["full"])


def expected_of(built) -> dict:
    return cs.expected_cells(built.case)


def key_of(entry: dict) -> tuple[str, str, str, str, str]:
    return (entry["sheet"], entry["block"], entry["row"], entry["column"], entry["kind"])


def in_scope(expected: dict, block: str) -> bool:
    return expected["scope_blocks"] is None or block in expected["scope_blocks"]


# --- The key: run folders, context, references (pass now) -----------------------------------------


def test_each_run_folder_passes_report_completion_and_verified_delivery(built):
    completion = library_index.report_completion(built.folder)
    delivery = library_index.verified_delivery(built.folder, completion)
    assert set(delivery["handoffs"]) == set(built.case.handoffs)
    assert completion["delivery_sha256"] == delivery["delivery_sha256"]
    for module, pin in delivery["handoffs"].items():
        raw = library_index.read_pinned(built.folder, pin["path"], pin["sha256"])
        assert raw == built.case.handoffs[module].read_bytes()


def test_a_changed_handoff_no_longer_passes_verified_delivery(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    delivery = cs.verified(built.folder)
    path = built.folder / delivery["handoffs"]["CP-1B"]["path"]
    path.write_bytes(path.read_bytes() + b"\n")
    with pytest.raises(library_index.Refused):
        cs.verified(built.folder)


def test_the_pinned_context_loads_by_its_hash(full):
    completion = library_index.report_completion(full.folder)
    raw_workflow = library_index.read_inside(full.folder, "workflow.json")
    assert completion["workflow_sha256"] == cs.sha256(raw_workflow)
    pin = json.loads(raw_workflow)["sources"]["context"]
    raw = library_index.read_pinned(full.folder, f"inputs/{pin['sha256']}", pin["sha256"])
    context = load_context(raw)
    assert context.identity.sector == "Industrials"
    assert context.run.as_of == cs.AS_OF
    assert [d.instrument for d in context.deal_terms] == ["Term Loan B 2031", "Senior Notes 2032"]
    assert [(r.agency, r.scope) for r in context.ratings] == [
        ("Moody's", "issuer"),
        ("S&P", "issuer"),
        ("Moody's", "facility"),
    ]
    assert [q.kind for q in context.quotes] == ["observed", "indicative_talk"]


@pytest.mark.parametrize("name", ["no_scorecard", "tdg_cp1"])
def test_the_other_runs_pin_no_context(tmp_path, name):
    built = cs.build_case(tmp_path, cs.CASES[name])
    workflow = json.loads((built.folder / "workflow.json").read_text())
    assert "context" not in workflow.get("sources", {})
    assert not (built.folder / "inputs").exists()


def test_references_load_from_a_store(full):
    clo, lvln = full.stores.standing.load("clo"), full.stores.standing.load("lvln")
    assert (len(clo.positions), len(clo.limits), clo.as_of.isoformat()) == (15, 6, "2026-03-20")
    assert (len(lvln.positions), len(lvln.limits), lvln.as_of.isoformat()) == (11, 0, "2026-03-19")
    with pytest.raises(rp.NotStored):
        full.stores.standing.load("jnk")
    assert full.stores.run.keys() == ()


def test_the_reference_less_runs_have_empty_stores(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["no_scorecard"])
    assert built.stores.standing.keys() == () and built.stores.run.keys() == ()


def test_the_synthetic_fixtures_say_so_in_their_first_line():
    for path in sorted(cs.HANDOFFS.glob("*.md")):
        assert "SYNTHETIC" in path.read_text(encoding="utf-8").split("\n", 1)[0], path.name
    first = (cs.FIXTURES / "expected_workings.md").read_text(encoding="utf-8").split("\n", 1)[0]
    assert "synthetic" in first.lower()


def test_each_expected_file_states_its_scope_and_has_unique_keys():
    for case in cs.CASES.values():
        expected = cs.expected_cells(case)
        assert next(iter(expected)) == "scope"
        assert (expected["scope"] == TDG_SCOPE) == (case.name == "tdg_cp1")
        if case.name != "tdg_cp1":
            assert expected["scope"].startswith("synthetic regression")
        keys = [key_of(e) for e in expected["entries"]]
        assert len(keys) == len(set(keys)), case.name
        assert {e["kind"] for e in expected["entries"]} <= {*KINDS, "analyst"}


def test_every_expected_copied_value_is_a_cell_of_its_handoff_line():
    for case in cs.CASES.values():
        for entry in cs.expected_cells(case)["entries"]:
            if entry["kind"] != "copied":
                continue
            if entry["module"] == cs.RV_MODULE:
                text = cs.rv_cell(case, entry["section"], entry["line"], entry["column"])
                assert text == entry["value"], (case.name, entry)
                continue
            raw = cs.physical_lines(case.handoffs[entry["module"]].read_text("utf-8"))[
                entry["line"] - 1
            ]
            held = cs.pipe_cells(raw) if raw.lstrip().startswith("|") else [raw]
            assert entry["value"] in held, (case.name, entry)


def test_the_awkward_cases_are_still_in_the_fixtures():
    cp1 = (cs.HANDOFFS / "CP-1.md").read_text(encoding="utf-8")
    for literal in (
        "| Gross profit | 676.0 | – |",  # a period the table has and leaves empty
        "298.12345678901234567",  # more than 15 significant digits
        "212.0m",  # a unit inside the cell
        "| (40.0) |",  # a bracketed negative stays text
        "| -85.2 | -70.4 |",  # a negative
        "| Revenues, net |",  # the near miss of Revenue
        "| Reporting Currency Amount | FX Rate |",  # T4.18 with them (and none in the other CP-1)
    ):
        assert literal in cp1, literal
    assert "Reporting Currency Amount" not in (cs.HANDOFFS / "CP-1-without-fx.md").read_text(
        "utf-8"
    )
    assert "RESTRUCTURING   COSTS" in (cs.HANDOFFS / "CP-1D.md").read_text(encoding="utf-8")
    assert "| Insufficient Information |" in (cs.HANDOFFS / "CP-1D.md").read_text("utf-8")
    assert "| Market share | Not scored |" in (cs.HANDOFFS / "CP-2.md").read_text("utf-8")


# --- The key against recommendation.py (pass now) -------------------------------------------------


def test_the_credit_score_by_hand_equals_recommendation():
    text = (cs.HANDOFFS / "CP-2.md").read_text(encoding="utf-8")
    scorecard = parse_scorecard(text)
    assert scorecard is not None
    levels = [f.level for f in scorecard.factors if f.level is not None]
    # By hand: 16 factors scored (Market share is Not scored), levels sum to 40, mean 40/16 = 2.5,
    # an exact half rounds toward the weaker score: 3. Liquidity 2 and Maturity profile 3: no floor.
    assert (len(levels), sum(levels)) == (16, 40)
    credit = rec.credit_score(scorecard)
    assert (credit.score, credit.mean, credit.floored) == (3, Fraction(5, 2), False)
    expected = {key_of(e): e for e in cs.expected_cells(cs.CASES["full"])["entries"]}
    assert expected[("Inputs", "Credit Score", "Credit Score", "Value", "computed")]["value"] == "3"


def reading_of(portfolio, bucket, expected):
    return rec.read_limits(
        portfolio,
        sector=expected["cross_check"]["sector"],
        rating_bucket=bucket,
        price=None,
    )


def test_the_hand_derived_reference_values_equal_recommendation(full):
    expected = {key_of(e): e["value"] for e in cs.expected_cells(full.case)["entries"]}
    check = cs.expected_cells(full.case)["cross_check"]
    for item in check["references"]:
        portfolio = full.stores.standing.load(item["key"])
        name = item["name"]
        pairs = {(p.asset_type, p.rating_bucket) for p in portfolio.positions}
        rows = {k[2] for k in expected if k[:2] == ("Matrix", "Reference medians")}
        assert {f"{name} / {a} / {b}" for a, b in pairs} == {r for r in rows if r.startswith(name)}
        for asset, bucket in pairs:
            probe = rec.Instrument("probe", asset, bucket, Decimal(0), Decimal(100))
            valued = rec.valuation(probe, portfolio)
            row = f"{name} / {asset} / {bucket}"

            def got(column, row=row):
                return expected[("Matrix", "Reference medians", row, column, "computed")]

            assert cs.same_figure(str(valued.median_bp), got("Median"))
            assert (str(valued.names), rec.MEASURE_WORDS[valued.measures[0]]) == (
                got("Names"),
                got("Measure"),
            )
            assert got("As of") == rp.long_date(portfolio.as_of)
            assert (valued.names < rec.MIN_NAMES) == (
                ("Matrix", "Reference medians", row, "Note", "computed") in expected
            )
        assert_limits_by_hand(expected, check, item, portfolio)


def assert_limits_by_hand(expected, check, item, portfolio):
    name, parameters = item["name"], item["rating_limits"] + item["price_floors"]
    sector = reading_of(portfolio, None, {"cross_check": check})
    breached = [r.limit.parameter for r in sector if r.outcome == "breached"]
    shown = [
        expected[k]
        for k in expected
        if k[1:3] == ("Breached sector limits", name) and k[0] == "Matrix"
    ]
    assert shown == breached
    unread = [
        r.limit.parameter
        for r in sector
        if r.outcome == "not_read" and r.limit.parameter not in parameters
    ]
    count = expected.get(("Matrix", "Limits not read", name, "Count", "computed"))
    assert count == str(len(unread))
    names = expected.get(("Matrix", "Limits not read", name, "Names", "computed"))
    assert names == ("; ".join(unread) if unread else None)
    for parameter in item["rating_limits"]:
        for bucket in check["buckets"]:
            outcome = next(
                r.outcome
                for r in reading_of(portfolio, bucket, {"cross_check": check})
                if r.limit.parameter == parameter
            )
            row = f"{name} / {parameter}"
            assert expected[("Matrix", "Rating limits", row, bucket, "computed")] == WORDS[outcome]
    for parameter in item["price_floors"]:
        floor = next(r for r in sector if r.limit.parameter == parameter).limit.quantity
        assert expected[
            ("Matrix", "Price floors", f"{name} / {parameter}", "Floor", "computed")
        ] == (str(floor.value))
    weight = rp.issuer_weight(portfolio, borrower=check["issuer"])
    gap = ("Matrix", "Issuer weight", name, "Weight (%)", "gap")
    if item["weight"] is None:
        assert weight.weight is None and weight.matched == 0 and gap in expected
    else:
        assert str(weight.weight) == item["weight"]
        assert (
            expected[("Matrix", "Issuer weight", name, "Weight (%)", "computed")] == item["weight"]
        )


def test_the_number_rule_and_renderer_the_fidelity_test_uses():
    for text in ("2", "-85.2", "1,234.5", "600.0", "0.7875", "123456789012345", "-0.5"):
        assert cs.is_plain_decimal(text), text
    for text in (
        "212.0m",
        "(40.0)",
        "3.73x",
        "12.5%",
        "298.12345678901234567",
        "1,23,4",
        "–",
        "2-3",
    ):
        assert not cs.is_plain_decimal(text), text
    assert cs.render_number(1234.5, "#,##0.0") == "1234.5"
    assert cs.render_number(-2347, "#,##0;(#,##0)") == "-2347"
    assert cs.render_number(0.7875, "0.0000") == "0.7875"
    assert cs.render_number(600.0, "0.0") == "600.0"
    for bad in ("General", "0.00%", "General;General", "#,##0.0;(#,##0)", "0.0E+00"):
        with pytest.raises(AssertionError):
            cs.render_number(1.5, bad)
    assert cs.pipe_cells("| a | b \\| c | |") == ["a", "b | c", ""]
    assert cs.physical_lines("a\r\nb\n") == ["a", "b"]


# --- The product against the key: gather (red until Task 2) ---------------------------------------


def gathered(built):
    from deploy_workflow import credit_snapshot as snapshot

    return snapshot.gather(snapshot.load_run(built.folder, built.stores.both()))


def test_gather_yields_exactly_the_expected_cells(built):
    expected = expected_of(built)
    cells = [c for c in gathered(built).cells() if c.kind in KINDS]
    got = {(c.block, c.row, c.column, c.kind): c for c in cells}
    # One value may be listed twice (a median on Matrix and on Inputs) but never two values.
    assert len({(c.block, c.row, c.column, c.kind, c.text) for c in cells}) == len(got)
    wanted = {key_of(e)[1:]: e for e in expected["entries"] if e["kind"] in KINDS}
    for key, entry in wanted.items():
        assert key in got, f"missing {key}"
        assert cs.same_figure(got[key].text, entry["value"]), (key, got[key].text)
        if entry["kind"] == "copied":
            assert (got[key].module, got[key].line) == (entry["module"], entry["line"]), key
            if "section" in entry:
                assert got[key].section == entry["section"], key
    unexpected = [k for k in got if in_scope(expected, k[0]) and k not in wanted]
    assert unexpected == []
    assert {c.block for c in cells}.isdisjoint(expected["absent_blocks"])


def test_an_unreadable_reference_shows_the_stores_sentence(full):
    (full.stores.standing.root / "jnk.json").write_bytes(b"not a stored portfolio")
    cells = [c for c in gathered(full).cells() if c.block == "Reference status"]
    row = [c for c in cells if c.row == rp.JNK.name]
    assert [(c.column, c.kind, c.text) for c in row] == [("Status", "gap", DAMAGED)]


def test_a_context_the_completion_does_not_pin_is_a_gap_not_a_crash(full):
    from deploy_workflow import credit_snapshot as snapshot

    path = full.folder / "workflow.json"
    path.write_text(json.dumps({**json.loads(path.read_text()), "edited": True}))
    run = snapshot.load_run(full.folder, full.stores.both())
    assert isinstance(run.context, snapshot.ContextGap) and run.context.reason
    cells = snapshot.gather(run).cells()
    assert not [c for c in cells if c.kind == "entered at run start" and c.block != "Header"]


def test_load_run_refuses_what_is_not_verified(tmp_path):
    from deploy_workflow import credit_snapshot as snapshot

    tampered = cs.build_case(tmp_path / "a", cs.CASES["full"])
    delivery = cs.verified(tampered.folder)
    path = tampered.folder / delivery["handoffs"]["CP-2"]["path"]
    path.write_bytes(path.read_bytes() + b"\n")
    with pytest.raises(library_index.Refused):
        snapshot.load_run(tampered.folder, tampered.stores.both())
    unfinished = cs.build_case(tmp_path / "b", cs.CASES["full"])
    for record in unfinished.folder.glob("completed-*.json"):
        record.unlink()
    with pytest.raises(library_index.Refused):
        snapshot.load_run(unfinished.folder, unfinished.stores.both())


# --- The product against the key: the saved workbook (red until Tasks 2 and 3) --------------------


class Opened:
    """The re-opened workbook, its Sources rows and the case it was built from."""

    def __init__(self, built, path: Path):
        self.built = built
        self.expected = expected_of(built)
        self.book = load_workbook(path)
        sheet = self.book["Sources"]
        header = [c.value for c in sheet[1]]
        assert header == list(cs.SOURCES_HEADER)
        self.rows = [
            dict(zip(header, (c.value for c in row), strict=True))
            for row in sheet.iter_rows(min_row=2)
            if any(c.value is not None for c in row)
        ]

    def on_sheets(self):
        return [r for r in self.rows if r["Sheet"] in READER_SHEETS]

    def cell(self, sheet, address):
        return self.book[sheet][address]

    def find(self, entry: dict) -> list[dict]:
        wanted = dict(zip(("Sheet", "Block", "Row", "Column", "Kind"), key_of(entry), strict=True))
        return [r for r in self.rows if all(r[k] == v for k, v in wanted.items())]

    def value_of(self, entry: dict):
        """Resolve a Snapshot Financials link back to the independently expected value."""
        if (entry["sheet"], entry["block"]) == ("Snapshot", "Financials"):
            linked_rows = self.find({**entry, "kind": "formula"})
            origins = self.find({**entry, "sheet": "Model"})
            assert len(linked_rows) == 1, (entry, "Snapshot formula", linked_rows)
            assert len(origins) == 1, (entry, "Model value", origins)
            linked, origin = linked_rows[0], origins[0]
            formula = self.cell("Snapshot", linked["Cell"])
            model = self.cell("Model", origin["Cell"])
            assert formula.data_type == "f", entry
            match = MODEL_REFERENCE.fullmatch(formula.value)
            assert match is not None, entry
            assert "".join(match.groups()) == origin["Cell"], entry
            assert linked["Handoff text"] == formula.value, entry
            assert model.data_type != "f" and formula.number_format == model.number_format, entry
            return model, origin
        found = self.find(entry)
        assert len(found) == 1, (entry, found)
        row = found[0]
        return self.cell(row["Sheet"], row["Cell"]), row

    def text_of(self, entry: dict) -> str:
        cell, _ = self.value_of(entry)
        return cs.shown(cell.value, cell.number_format)


def open_workbook(built, tmp_path):
    from deploy_workflow import credit_snapshot as snapshot
    from deploy_workflow import credit_snapshot_workbook as writer

    run = snapshot.load_run(built.folder, built.stores.both())
    path = tmp_path / "credit-snapshot.xlsx"
    path.write_bytes(writer.workbook_bytes(snapshot.gather(run)))
    return Opened(built, path)


def holds(cell, text: str) -> bool:
    """The cell shows the handoff's text: as text, or, when it holds a number, as its digits (the
    number rule, then the stored number through the cell's own format)."""
    if isinstance(cell.value, int | float) and not isinstance(cell.value, bool):
        plain = text.replace(",", "")
        return (
            cs.is_plain_decimal(text)
            and Decimal(repr(cell.value)) == Decimal(plain)  # the stored number is the figure
            and cs.render_number(cell.value, cell.number_format) == plain  # and shows its digits
        )
    return cell.value == text


def test_the_workbook_has_the_model_and_sources_sheets(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    assert opened.book.sheetnames == list(cs.SHEETS)


def test_synthetic_model_periods_share_one_ordered_axis_even_with_sparse_rows(full):
    """Synthetic Northbridge Holdings plc, 2026-03-31."""
    from deploy_workflow import credit_snapshot as snapshot
    from deploy_workflow import credit_snapshot_workbook as writer

    expected = (
        *(f"Q{quarter} FY{year}" for year in range(2019, 2023) for quarter in range(1, 5)),
        "2023-01-01–2023-03-31",
        "Q1 FY2024 / 2024-03-31",
        "Q3 FY2024",
        "PYTD Sep 2023",
        "H1 2024 / 2024-06-30",
        "YTD Sep 2024",
        "FY2022",
        "FY2023",
        "Prior LTM",
        "LTM Sep 2024",
        "PF Sep 2024",
        "Base FY2025",
        "Base FY2026",
        "Downside FY2025",
        "Downside FY2026",
    )
    cells = (
        snapshot.SnapshotCell("Snapshot", "Financials", "Revenue", "FY2023", "copied", "100"),
        snapshot.SnapshotCell("Snapshot", "Financials", "Revenue", "Q1 FY2024", "copied", "20"),
        snapshot.SnapshotCell("Snapshot", "Financials", "Revenue", "H1 2024", "copied", "47"),
        *(
            snapshot.SnapshotCell("Snapshot", "Financials", "Cash", period, "copied", "15")
            for period in reversed(expected)
            if period != "FY2023"
        ),
    )
    prepared = gathered(full)
    modified = replace(
        prepared,
        blocks=tuple(
            replace(block, cells=cells)
            if (block.sheet, block.name) == ("Snapshot", "Financials")
            else block
            for block in prepared.blocks
        ),
    )
    workbook = load_workbook(BytesIO(writer.workbook_bytes(modified)))
    rows = iter(workbook["Sources"].values)
    headings = next(rows)
    model_headers = [
        dict(zip(headings, values, strict=True))
        for values in rows
        if values[0] == "Model" and values[2] == "label" and str(values[4]).startswith("(header")
    ]
    periods = [row for row in model_headers if row["Column"] in expected]
    financials = [row for row in periods if row["Block"] == "Financials"]
    source = [row for row in periods if row["Block"] == "Source financials"]
    assert {row["Row"] for row in [*financials, *source]} == {"(header)"}
    assert tuple(row["Column"] for row in financials) == expected
    assert tuple(row["Column"] for row in source) == expected
    financial_columns = [workbook["Model"][row["Cell"]].column for row in financials]
    source_columns = [workbook["Model"][row["Cell"]].column for row in source]
    assert financial_columns == source_columns


@pytest.mark.parametrize(
    ("name", "fiscal_end", "statement_row"),
    [
        ("full", "2024-12-31", "Revenue"),  # Synthetic Northbridge Holdings plc, 2026-03-31
        ("tdg_cp1", "2024-09-30", "GROSS PROFIT"),  # Retained TransDigm CP-1, 2024-09-30
    ],
)
def test_model_aligns_the_same_fiscal_year_across_statements_and_ratios(
    tmp_path, name, fiscal_end, statement_row
):
    built = cs.build_case(tmp_path, cs.CASES[name])
    opened = open_workbook(built, tmp_path)
    visible_period = f"FY2024 / {fiscal_end}"
    expected = opened.expected["entries"]
    statement = next(
        entry
        for entry in expected
        if (entry["block"], entry["row"], entry["column"])
        == ("Financials", statement_row, "FY2024")
    )
    ratio = next(
        entry
        for entry in expected
        if (entry["block"], entry["row"], entry["column"])
        == ("Financials", "Total debt / EBITDA", visible_period)
    )
    statement_cell, _ = opened.value_of(statement)
    ratio_cell, _ = opened.value_of(ratio)
    assert statement_cell.column == ratio_cell.column
    (heading,) = opened.find(
        {
            "sheet": "Model",
            "block": "Financials",
            "row": "(header)",
            "column": visible_period,
            "kind": "label",
        }
    )
    header_cell = opened.cell("Model", heading["Cell"])
    assert (header_cell.value, header_cell.column) == (visible_period, statement_cell.column)


@pytest.mark.parametrize(
    "columns_by_row",
    [
        (
            ("Revenue", "FY2024"),
            ("Interest", "FY2024 / 2024-09-30"),
            ("Debt", "FY2024 / 2024-12-31"),
        ),
        (("Revenue", "FY2024"), ("Revenue", "FY2024 / 2024-09-30")),
    ],
)
def test_synthetic_model_preserves_conflicting_period_columns(columns_by_row):
    """Synthetic Northbridge Holdings plc, 2026-03-31."""
    from deploy_workflow import credit_snapshot as snapshot
    from deploy_workflow import credit_snapshot_workbook as writer

    block = snapshot.Block(
        "Model",
        "Financials",
        tuple(
            snapshot.SnapshotCell("Model", "Financials", row, col, "copied", str(index))
            for index, (row, col) in enumerate(columns_by_row, start=1)
        ),
    )
    axis = writer._model_periods({("Model", "Financials"): block})
    assert set(axis.periods) == {col for _, col in columns_by_row}
    assert all(axis.label(col) == col for _, col in columns_by_row)


def _synthetic_bound_model(baseline, forecast, *, history=None):
    from deploy_workflow import credit_snapshot_workbook as writer

    exact = json.dumps(
        {
            "schema_version": "cpos-forecast-exact/1",
            "consumed": {"CP-1.md": baseline.handoff_sha256["CP-1"]},
            **forecast,
        }
    ).encode()
    exact_pin = cs.sha256(exact)
    calculation = {
        "schema_version": "cpos-model/1",
        "forecast_exact_file": "forecast_exact.json",
        "forecast_exact_sha256": exact_pin,
    }
    if history is not None:
        calculation["history"] = {"schema_version": "cpos-history/1", **history}
    files = {
        "forecast_exact.json": exact,
        "calculation.json": json.dumps(calculation).encode(),
    }
    snapshot = replace(
        baseline,
        model_files=files,
        source_sha256=baseline.source_sha256
        | {f"model:{name}": cs.sha256(raw) for name, raw in files.items()},
    )
    book = load_workbook(BytesIO(writer.workbook_bytes(snapshot)))
    sources = iter(book["Sources"].values)
    names = next(sources)
    rows = [dict(zip(names, row, strict=True)) for row in sources if row[0] == "Model"]
    return book["Model"], rows, exact_pin


def test_synthetic_model_displays_exact_percentages_outside_excel_numeric_precision(full):
    """Synthetic Northbridge Holdings plc, 2026-03-31. Shift the written fraction two places."""
    expected = (
        (2026, "0.1234567890123456789012345678", "12.34567890123456789012345678%"),
        (2027, "-0.00001234567890123456789012", "-0.001234567890123456789012%"),
    )
    years = [
        {"year": year, "fcf_to_debt": {"amount": raw, "reason": None}} for year, raw, _ in expected
    ]
    model, rows, pin = _synthetic_bound_model(
        gathered(full), {"outputs": {"REFERENCE": {"years": years}}}
    )
    for year, raw, shown in expected:
        (origin,) = [
            r for r in rows if r["Row"] == "Cash proxy / debt" and r["Column"] == f"Base FY{year}"
        ]
        assert origin["Handoff text"] == raw and origin["Handoff sha256"] == pin
        cell = model[origin["Cell"]]
        assert (cell.data_type, cell.value) == ("s", shown)


def test_synthetic_model_skips_absent_periods_and_traces_model_currency_to_exact_forecast(full):
    """Synthetic Northbridge Holdings plc, 2026-03-31. Only FY2025 has a reporting period."""
    gap = "The issuer states no interest for FY2025."
    no_ytd = "the latest reported period is fiscal year FY2025; there is no year to date"
    no_pf = (
        "pro forma figures are not placed in this column; the financial foundation shows "
        "any it states"
    )
    absent = (
        ("YTD", "YTD", no_ytd),
        ("PYTD", "PYTD", no_ytd),
        (
            "Quarter",
            "QUARTER",
            "the tables holding the named rows print no quarter column that can be read",
        ),
        ("PF LTM", "PF", no_pf),
    )
    columns = [
        {
            "id": "FY2025",
            "label": "FY2025",
            "kind": "FY",
            "reason": None,
            "start": "2025-01-01",
            "end": "2025-12-31",
            "values": {
                "closing_debt": {"amount": "487.5", "reason": None},
                "interest": {"amount": None, "reason": gap},
            },
        },
        *(
            {
                "id": label,
                "kind": kind,
                "label": label,
                "reason": reason,
                "values": {"closing_debt": {"amount": None, "reason": reason}},
            }
            for label, kind, reason in absent
        ),
    ]
    model, rows, pin = _synthetic_bound_model(
        gathered(full),
        {"scale": 1000, "units": "USD millions", "outputs": {}},
        history={"columns": columns},
    )
    hidden = {label for label, _, _ in absent}
    assert not [row for row in rows if row["Column"] in hidden]
    (debt,) = [
        row
        for row in rows
        if row["Row"] == "Closing debt (carrying value)" and row["Column"] == "FY2025"
    ]
    (unit,) = [row for row in rows if row["Row"] == debt["Row"] and row["Column"] == "Unit"]
    (missing,) = [row for row in rows if row["Row"] == "Interest" and row["Column"] == "FY2025"]
    assert (model[debt["Cell"]].value, debt["Section"]) == (487.5, "calculation.json")
    assert (model[unit["Cell"]].value, unit["Section"], unit["Handoff sha256"]) == (
        "USD millions",
        "forecast_exact.json",
        pin,
    )
    assert (model[missing["Cell"]].value, missing["Kind"], missing["Section"]) == (
        "n.a.",
        "gap",
        "calculation.json",
    )
    source_text = cs.SOURCES_HEADER.index("Handoff text")
    assert any(row[source_text] == gap for row in model.parent["Sources"].values)


def test_synthetic_unscaled_model_traces_request_units_to_cp1(full):
    """Synthetic Northbridge Holdings plc, 2026-03-31. Older exact record has no scale fields."""
    baseline = gathered(full)
    lines = baseline.model_handoffs["CP-1"].splitlines(keepends=True)
    assert lines[1].strip() == b"## Request"
    lines[2] = b"USD thousands\n"
    cp1 = b"".join(lines)
    inputs = replace(
        baseline,
        model_handoffs={"CP-1": cp1},
        handoff_sha256=baseline.handoff_sha256 | {"CP-1": cs.sha256(cp1)},
    )
    record = {"year": 2026, "closing_debt": {"amount": "487.5", "reason": None}}
    model, rows, _ = _synthetic_bound_model(inputs, {"outputs": {"REFERENCE": {"years": [record]}}})
    (unit,) = [
        row
        for row in rows
        if row["Row"] == "Closing debt (carrying value)" and row["Column"] == "Unit"
    ]
    assert (model[unit["Cell"]].value, unit["Module"], unit["Section"], unit["Line"]) == (
        "USD thousands",
        "CP-1",
        "Request",
        3,
    )
    assert unit["Handoff sha256"] == cs.sha256(cp1)


def test_synthetic_model_register_keeps_quarter_and_ytd_values_and_their_date_sources(full):
    """Synthetic Northbridge Holdings plc, 2026-03-31. Exact windows disambiguate fiscal labels."""
    from deploy_workflow import credit_snapshot_workbook as writer

    baseline = gathered(full)
    markers = (
        ("Q2 FY2025 / 2025-04-01 to 2025-06-30", "q2", "QUARTER", "2025-04-01", 32),
        ("Q2 FY2025 / 2025-03-01 to 2025-06-30", "q2_long", "QUARTER", "2025-03-01", 41),
        ("Q2 FY2025 / 2025-07-01 to 2025-09-30", "q2_late", "QUARTER", "2025-07-01", 28),
        ("YTD 2025-06-30", "sixmonth", "YTD", "2025-01-01", 64),
        ("FY2025", "year", "FY", "2025-01-01", 120),
    )
    end_date = {
        "q2": "2025-06-30",
        "q2_long": "2025-06-30",
        "q2_late": "2025-09-30",
        "sixmonth": "2025-06-30",
        "year": "2025-12-31",
    }
    quarter = {"q2": 2, "q2_long": 2, "q2_late": 2, "sixmonth": 2, "year": 4}
    dates = {
        marker: f"| {marker} | 2025 | {quarter[marker]} | {kind} | {start} | "
        f"{end_date[marker]} | USD | millions |"
        for _, marker, kind, start, _ in markers
    }
    amounts = {marker: f"| Controls | {marker} | {value} |" for _, marker, _, _, value in markers}
    period_header = (
        "| period_id | fiscal_year | fiscal_quarter | period_type | start_date | end_date | "
        "currency | unit |"
    )
    additions = [
        "",
        "### T4.14 Model Period Register",
        "",
        period_header,
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
        *dates.values(),
        "",
        "### T4.16 Segment Revenue Schedule",
        "",
        "| segment_name | period_id | revenue |",
        "| --- | --- | --- |",
        *amounts.values(),
        "",
    ]
    raw = baseline.model_handoffs["CP-1"] + "\n".join(additions).encode()
    snapshot = replace(
        baseline,
        model_handoffs={"CP-1": raw},
        handoff_sha256=baseline.handoff_sha256 | {"CP-1": cs.sha256(raw)},
    )
    book = load_workbook(BytesIO(writer.workbook_bytes(snapshot)))
    model = book["Model"]
    sources = iter(book["Sources"].values)
    headings = next(sources)
    rows = [
        dict(zip(headings, row, strict=True))
        for row in sources
        if (row[0], row[3]) == ("Model", "Segment data")
    ]
    physical = raw.decode().splitlines()
    columns = {}
    for period, marker, _, start, amount in markers:
        saved = {row["Row"]: row for row in rows if row["Column"] == period}
        value = saved["Controls · Revenue (USD millions)"]
        assert model[value["Cell"]].value == amount
        columns[marker] = model[value["Cell"]].column
        assert value["Section"] == "T4.16 Segment Revenue Schedule"
        assert value["Line"] == physical.index(amounts[marker]) + 1
        for row_name, expected in (("Period start", start), ("Period end", end_date[marker])):
            origin = saved[row_name]
            assert model[origin["Cell"]].value == expected
            assert origin["Handoff text"] == expected
            assert origin["Section"] == "T4.14 Model Period Register"
            assert origin["Line"] == physical.index(dates[marker]) + 1
            assert origin["Handoff sha256"] == cs.sha256(raw)
    assert columns["q2_long"] < columns["q2"] < columns["q2_late"]
    assert columns["q2_late"] < columns["sixmonth"] < columns["year"]


def test_synthetic_retained_model_formats_the_declared_fraction_on_every_measure(full):
    """Synthetic Northbridge Holdings plc, 2026-03-31. The producer declares FRACTION."""
    from deploy_workflow import credit_snapshot_workbook as writer

    baseline = gathered(full)
    files = {
        "annual.md": full.handoff_text["CP-1"].encode(),
        "current_synthesis.md": full.handoff_text["CP-2"].encode(),
    }
    fractions = {"FY2024": "0.25", "FY2025": "0.1234567890123456789012345678"}
    calculation = {
        "schema_version": "retained-handoff-model/1",
        "annual_periods": list(fractions),
        "inputs": {
            name.removesuffix(".md"): {"path": name, "sha256": cs.sha256(raw)}
            for name, raw in files.items()
        },
        "values": {
            year: {"revenue_growth": {"amount": amount, "unit": "FRACTION", "reason": None}}
            for year, amount in fractions.items()
        },
    }
    files["calculation.json"] = json.dumps(calculation).encode()
    snapshot = replace(
        baseline,
        model_files=files,
        source_sha256=baseline.source_sha256
        | {f"model:{name}": cs.sha256(raw) for name, raw in files.items()},
    )
    book = load_workbook(BytesIO(writer.workbook_bytes(snapshot)))
    sources = iter(book["Sources"].values)
    heading = next(sources)
    rows = {
        row[5]: dict(zip(heading, row, strict=True))
        for row in sources
        if (row[0], row[3], row[4], row[7])
        == ("Model", "Financials", "Revenue growth", "calculation.json")
    }
    short = book["Model"][rows["FY2024"]["Cell"]]
    exact = book["Model"][rows["FY2025"]["Cell"]]
    assert (short.value, short.number_format) == (0.25, "0.00%")
    assert (exact.value, exact.data_type) == ("12.34567890123456789012345678%", "s")
    assert rows["FY2025"]["Handoff text"] == fractions["FY2025"]


def test_synthetic_debt_facility_terms_use_registered_periods_on_one_model_row():
    """Synthetic Northbridge Holdings plc, 2026-03-31. One revolver has two dated records."""
    from deploy_workflow import credit_snapshot as snapshot
    from deploy_workflow import credit_snapshot_workbook as writer

    cp1 = b"""# Northbridge Holdings plc
## Findings
### T4.14 Model Period Register

| period_id | fiscal_year | period_type | start_date | end_date | currency | unit |
| --- | --- | --- | --- | --- | --- | --- |
| year_a | 2024 | FY | 2024-01-01 | 2024-12-31 | USD | millions |
| year_b | 2025 | FY | 2025-01-01 | 2025-12-31 | USD | millions |

### T4.18 Debt Facility Register

| facility_id | facility_name | period_id | principal | currency | margin_or_coupon |
| --- | --- | --- | --- | --- | --- |
| fac_a | Revolver | year_a | 120 | USD | 200 bps |
| fac_a | Revolver | year_b | 100 | EUR | 250 bps |
| fac_b | Other facility | unknown_window | 65 | USD | 300 bps |
"""
    run = snapshot.SnapshotRun(
        issuer="Northbridge Holdings plc",
        as_of="2026-03-31",
        pathway="credit_snapshot",
        run_id="synthetic-debt-periods",
        handoffs={"CP-1": cp1},
        context=None,
        references=(),
    )
    book = load_workbook(BytesIO(writer.workbook_bytes(snapshot.gather(run))))
    model = book["Model"]
    raw_rows = iter(book["Sources"].values)
    headings = next(raw_rows)
    sources = [
        dict(zip(headings, row, strict=True))
        for row in raw_rows
        if (row[0], row[3]) == ("Model", "Debt instruments")
    ]
    terms = {row["Column"]: row for row in sources if row["Row"] == "Revolver"}
    expected = {
        "FY2024": 120,
        "FY2025": 100,
        "FY2024 / margin or coupon": "200 bps",
        "FY2025 / margin or coupon": "250 bps",
        "FY2024 / currency": "USD",
        "FY2025 / currency": "EUR",
    }
    assert {label: model[terms[label]["Cell"]].value for label in expected} == expected
    assert {terms[label]["Section"] for label in expected} == {"T4.18 Debt Facility Register"}
    assert len({model[terms[label]["Cell"]].row for label in expected}) == 1
    assert model[terms["Amount basis"]["Cell"]].value == "principal"
    assert not any(label.endswith(" / reporting unit") for label in terms)
    (start,) = [
        row for row in sources if row["Row"] == "Period start" and row["Column"] == "FY2024"
    ]
    assert (model[start["Cell"]].value, start["Section"], start["Line"]) == (
        "2024-01-01",
        "T4.14 Model Period Register",
        7,
    )
    (missing,) = [row for row in sources if row["Row"] == "Other facility" and row["Kind"] == "gap"]
    assert missing["Column"] == "Period not stated"
    assert not any(
        value in {"year_a", "year_b", "unknown_window"} for row in model.values for value in row
    )


def test_sources_rows_are_of_known_kinds_and_one_per_cell(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    assert {r["Kind"] for r in opened.rows} <= set(SOURCE_KINDS)
    assert max(Counter((r["Sheet"], r["Cell"]) for r in opened.on_sheets()).values()) == 1


def check_rv_row(opened, row: dict) -> None:
    """A cell copied from a supplied RV worksheet: Section is the file, Line the 1-based row of the
    sheet, Column the header; the text is that cell read with the stdlib `csv` module."""
    case = opened.built.case
    text = cs.rv_cell(case, row["Section"], int(row["Line"]), row["Column"])
    assert row["Handoff text"] == text, row
    assert holds(opened.cell(row["Sheet"], row["Cell"]), text), row
    assert row["Handoff sha256"] == cs.sha256(dict(case.sources)[row["Section"]].read_bytes()), row


def test_every_copied_sources_row_is_the_handoff_text(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    copied = [r for r in opened.on_sheets() if r["Kind"] == "copied"]
    assert copied
    for row in copied:
        module, text = row["Module"], row["Handoff text"]
        if module == cs.RV_MODULE:
            check_rv_row(opened, row)
            continue
        raw_file = opened.built.handoff_text[module]
        raw = cs.physical_lines(raw_file)[int(row["Line"]) - 1]
        held = cs.pipe_cells(raw) if raw.lstrip().startswith("|") else [raw]
        assert text in held, row
        assert holds(opened.cell(row["Sheet"], row["Cell"]), text), row
        assert row["Handoff sha256"] == cs.sha256(raw_file.encode("utf-8")), row
        assert (row["Run"], row["As of"]) == (opened.built.case.run_id, opened.built.case.as_of)


def test_every_expected_entry_is_written_with_its_kind_and_value(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    for entry in opened.expected["entries"]:
        cell, origin = opened.value_of(entry)
        if entry["kind"] == "copied":
            assert holds(cell, entry["value"]), entry
            assert (origin["Module"], int(origin["Line"])) == (entry["module"], entry["line"])
            assert origin["Section"] == entry.get("section", origin["Section"]), entry
        else:
            text = cs.shown(cell.value, cell.number_format)
            assert cs.same_figure(text, entry["value"]), entry
        if entry.get("number"):
            assert isinstance(cell.value, int | float), entry


def test_nothing_unexpected_is_written(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    wanted = {key_of(e) for e in opened.expected["entries"]}
    for row in opened.on_sheets():
        if row["Sheet"] == "Model":
            continue  # Section 7 adds independently checked lines beyond this Snapshot answer key.
        key = (row["Sheet"], row["Block"], row["Row"], row["Column"], row["Kind"])
        if row["Kind"] in KINDS and in_scope(opened.expected, row["Block"]):
            assert key in wanted, key


def test_hidden_blocks_and_near_misses_are_absent_from_snapshot_views(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    blocks = {r["Block"] for r in opened.on_sheets()}
    assert blocks.isdisjoint(opened.expected["absent_blocks"])
    texts = [
        str(c.value)
        for name in READER_SHEETS
        if name != "Model"  # The Model includes source statement rows outside the Snapshot key.
        for row in opened.book[name].iter_rows()
        for c in row
        if c.value is not None
    ]
    for absent in opened.expected["absent_values"]:
        assert not [t for t in texts if absent in t], absent


def test_basis_lines_stay_on_sources_beside_their_paragraph(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    kept = [str(r["Handoff text"]) for r in opened.rows]
    shown = [
        str(c.value)
        for name in READER_SHEETS
        for row in opened.book[name].iter_rows()
        for c in row
        if c.value is not None
    ]
    for basis in opened.expected["basis_lines"]:
        assert basis["text"] in kept, basis
        assert not [t for t in shown if "Basis:" in t or basis["text"] in t], basis
        lines = cs.physical_lines(opened.built.handoff_text[basis["module"]])
        assert lines[basis["line"] - 1] == basis["text"]


def test_computed_cells_equal_recommendation_on_the_same_inputs(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    expected = opened.expected
    computed = [e for e in expected["entries"] if e["kind"] == "computed"]
    assert all(cs.same_figure(opened.text_of(e), e["value"]) for e in computed)
    text = opened.built.handoff_text.get("CP-2")
    credit = {e["value"] for e in computed if e["block"] == "Credit Score"}
    if text is None:
        assert credit == set()
        return
    scorecard = parse_scorecard(text)
    assert scorecard is not None
    assert credit == {str(rec.credit_score(scorecard).score)}
    for item in expected["cross_check"]["references"]:
        portfolio = opened.built.stores.standing.load(item["key"])
        for entry in (e for e in computed if e["block"] == "Reference medians"):
            name, asset, bucket = entry["row"].split(" / ")
            if name != item["name"] or entry["column"] != "Median" or entry["sheet"] != "Matrix":
                continue
            probe = rec.Instrument("probe", asset, bucket, Decimal(0), Decimal(100))
            assert cs.same_figure(
                opened.text_of(entry), str(rec.valuation(probe, portfolio).median_bp)
            )


def test_no_module_id_hash_file_name_or_run_id_is_on_the_reader_sheets(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    banned = (
        re.compile(r"CP-\w+"),
        re.compile(r"\b[0-9a-f]{64}\b"),
        re.compile(r"\.(?:md|json|jsonl|pdf|htm|html|xlsx|csv)\b"),
        re.compile(re.escape(opened.built.case.run_id)),
    )
    for name in READER_SHEETS:
        for row in opened.book[name].iter_rows():
            for cell in row:
                for pattern in banned:
                    assert not (isinstance(cell.value, str) and pattern.search(cell.value)), (
                        name,
                        cell.coordinate,
                    )


def yellow_rgb(rgb) -> bool:
    """A pale or strong yellow: red and green high, blue clearly lower. Theme and indexed colours
    carry no readable rgb and are not judged."""
    if not isinstance(rgb, str) or len(rgb) not in (6, 8):
        return False
    try:
        red, green, blue = (int(rgb[-6:][i : i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return False
    return red >= 0xF0 and green >= 0xE0 and blue <= min(red, green) - 0x10


def conditional_colours(sheet, coordinate: str | None = None) -> list:
    """Every colour a conditional format on the sheet (or on `coordinate`) uses: colour-scale
    stops, a rule's fill and a data bar's colour."""
    found = []
    for item in sheet.conditional_formatting:
        if coordinate is not None and coordinate not in item.sqref:
            continue
        for rule in item.rules:
            scale = rule.colorScale
            found += [c.rgb for c in scale.color] if scale is not None else []
            fill = rule.dxf.fill if rule.dxf is not None else None
            found += [c.rgb for c in (fill.bgColor, fill.fgColor)] if fill is not None else []
            found += [rule.dataBar.color.rgb] if rule.dataBar is not None else []
    return found


def is_yellow(cell) -> bool:
    """The cell's own fill, or any conditional-format colour that applies to it, is yellow."""
    fill = cell.fill
    own = fill.start_color.rgb if fill.fill_type == "solid" else None
    return yellow_rgb(own) or any(
        yellow_rgb(c) for c in conditional_colours(cell.parent, cell.coordinate)
    )


def test_no_conditional_format_colour_is_yellow(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    for name in READER_SHEETS:
        assert not [c for c in conditional_colours(opened.book[name]) if yellow_rgb(c)], name


def test_yellow_fill_is_the_analyst_cells_and_nothing_else(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    analyst = {(r["Sheet"], r["Cell"]) for r in opened.on_sheets() if r["Kind"] == "analyst"}
    yellow = {
        (name, cell.coordinate)
        for name in READER_SHEETS
        for row in opened.book[name].iter_rows()
        for cell in row
        if not isinstance(cell, MergedCell) and is_yellow(cell)
    }
    assert yellow == analyst


def test_every_non_empty_cell_has_a_sources_row(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    listed = {(r["Sheet"], r["Cell"]) for r in opened.on_sheets()}
    for name in READER_SHEETS:
        for row in opened.book[name].iter_rows():
            for cell in row:
                if cell.value not in (None, ""):
                    assert (name, cell.coordinate) in listed, (name, cell.coordinate)
    formulas = {(r["Sheet"], r["Cell"]) for r in opened.on_sheets() if r["Kind"] == "formula"}
    for name in READER_SHEETS:
        for row in opened.book[name].iter_rows():
            for cell in row:
                is_formula = isinstance(cell.value, str) and cell.value.startswith("=")
                assert is_formula == ((name, cell.coordinate) in formulas), (name, cell.coordinate)


def test_labels_are_not_numbers_and_never_stand_in_for_an_expected_entry(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    wanted = {key_of(e)[:1] + key_of(e)[1:4] for e in opened.expected["entries"]}
    for row in opened.on_sheets():
        if row["Kind"] not in ("label", "formula"):
            continue
        cell = opened.cell(row["Sheet"], row["Cell"])
        assert row["Kind"] != "label" or not isinstance(cell.value, int | float), row
        key = (row["Sheet"], row["Block"], row["Row"], row["Column"])
        if key in wanted:
            assert row["Kind"] == "formula" and key[:2] == ("Snapshot", "Financials"), row


def test_every_methodology_constant_is_one_rule_row_on_matrix(built, tmp_path):
    opened = open_workbook(built, tmp_path)
    rows = [r for r in opened.on_sheets() if r["Kind"] == "rule"]
    assert {r["Sheet"] for r in rows} == {"Matrix"}
    keys = Counter((r["Block"], r["Row"], r["Column"]) for r in rows)
    assert keys == Counter(RULES.keys()), "each constant exactly once, and nothing else"
    for row in rows:
        want = RULES[row["Block"], row["Row"], row["Column"]]
        got = opened.cell(row["Sheet"], row["Cell"]).value
        if isinstance(want, int):
            assert isinstance(got, int | float) and Decimal(repr(got)) == want, row
        else:
            assert got == want, row


def instrument_cell(opened, entry: dict, column: str):
    """The Inputs cell under the `column` header in a joined instrument's row. The row is that of
    the instrument's copied `Bloomberg ID` cell; the header row is the nearest row above it that
    holds the `Bloomberg ID` header in the same column; `column`'s header is on that row."""
    sheet = opened.book["Inputs"]
    (found,) = opened.find({**entry, "column": "Bloomberg ID", "kind": "copied"})
    where = sheet[found["Cell"]]
    above = [
        c.row for c in sheet[where.column_letter] if c.value == "Bloomberg ID" and c.row < where.row
    ]
    (head,) = [c for c in sheet[max(above)] if c.value == column]
    return sheet.cell(row=where.row, column=head.column)


def test_a_joined_instruments_missing_identifier_is_a_blank_unfilled_cell_with_no_sources_row(
    built, tmp_path
):
    opened = open_workbook(built, tmp_path)
    listed = {(r["Sheet"], r["Cell"]) for r in opened.on_sheets()}
    for entry in opened.expected["blank_cells"]:
        cell = instrument_cell(opened, entry, entry["column"])
        assert cell.value in (None, ""), entry
        assert cell.fill.fill_type is None, entry
        assert (entry["sheet"], cell.coordinate) not in listed, entry
        other = instrument_cell(opened, entry, "Bloomberg ID")
        assert other.value not in (None, "") and (entry["sheet"], other.coordinate) in listed


def test_the_rv_worksheet_is_pinned_like_a_run_source_and_has_the_sheets_layout(full):
    raw_workflow = library_index.read_inside(full.folder, "workflow.json")
    pin = json.loads(raw_workflow)["sources"][cs.RV_NAME]
    raw = library_index.read_pinned(full.folder, f"inputs/{pin['sha256']}", pin["sha256"])
    assert raw == (cs.FIXTURES / cs.RV_NAME).read_bytes()
    real = (cs.TESTS / "fixtures" / "market-data" / "it-services.csv").read_text(encoding="utf-8")
    ours = raw.decode("utf-8")
    assert csv.reader(ours.splitlines()).__next__() == next(csv.reader(real.splitlines()))
    assert len(next(csv.reader(ours.splitlines()))) == 25


def test_the_joins_by_hand_rules_t5_d_to_t5_f_leave_only_the_term_loan_b_joined(full):
    """Re-derived here with stdlib only: matched rows, maturities on one matched row and one T4.18
    row, a loan on both sides, and an identifier present (FIGI of 12 capital letters and digits,
    or a Bloomberg ID that is not a vendor error token)."""
    rows = list(csv.reader((cs.FIXTURES / cs.RV_NAME).read_text(encoding="utf-8").splitlines()))
    head, body = rows[0], rows[1:]
    fold = lambda t: " ".join(t.split()).casefold()
    matched = [r for r in body if fold(r[head.index("Company")]) == fold(cs.ISSUER_NAME)]
    assert len(matched) == 6
    day = lambda r: datetime.strptime(r[head.index("Maturity")], "%d-%b-%y").date()
    t418 = full.handoff_text["CP-1"].split("### T4.18")[1].split("### T4.9")[0].splitlines()
    table = [cs.pipe_cells(line) for line in t418 if line.startswith("|")]
    names = table[0]
    joined = []
    for cells in table[2:]:
        kind, when = cells[names.index("Type")].casefold(), cells[names.index("Maturity")]
        same = [r for r in matched if day(r).isoformat() == when]
        others = [c for c in table[2:] if c[names.index("Maturity")] == when]
        loan_side = "loan" in kind
        if len(same) != 1 or len(others) != 1 or not loan_side:
            continue
        row = same[0]
        figi, bbg = row[head.index("FIGI")], row[head.index("Bloomberg ID")]
        identified = re.fullmatch(r"[A-Z0-9]{12}", figi) or (bbg and not bbg.startswith("#"))
        loan_type = row[head.index("Loan Type")]
        if loan_type and not loan_type.startswith("#") and identified:
            joined.append(cells[0])
    assert joined == ["Term Loan B"]
    expected = {key_of(e): e for e in cs.expected_cells(cs.CASES["full"])["entries"]}
    assert ("Inputs", "Instruments", "Term Loan B", "Bloomberg ID", "copied") in expected
    assert ("Inputs", "Instruments", "Term Loan B", "FIGI", "analyst") not in expected
    assert len([k for k in expected if k[:2] == ("Inputs", "Market identifiers")]) == 6 * 9
