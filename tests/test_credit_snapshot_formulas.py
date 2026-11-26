"""The Credit Snapshot workbook's formulas, dropdowns and constants.

No spreadsheet program is run (owner, 2026-11-26): each kind of formula is pinned by the exact text
the writer ships in one named cell for a known row, so a reviewer can evaluate that text by hand;
the rest are structural facts (every function is one Excel knows, every name is a cell the file
holds, no cached value, the lists the dropdowns offer).

SYNTHETIC: the runs are the key's invented "Northbridge" cases (`tests/credit_snapshot_case.py`).
"""

from __future__ import annotations

import io
import re

import credit_snapshot_case as cs
import pytest
from openpyxl import load_workbook
from openpyxl.utils import FORMULAE, column_index_from_string
from test_credit_snapshot_fidelity import RULES
from test_credit_snapshot_workbook import cell_of, listed, sources

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_formulas as fx
from deploy_workflow import credit_snapshot_workbook as writer
from deploy_workflow import recommendation as rec
from deploy_workflow import reference_portfolios as rp

THREE = ("Snapshot", "Inputs", "Matrix")
CLO, LVLN = "CLO portfolio", "Loan index fund (LVLN)"


@pytest.fixture(scope="module")
def full(tmp_path_factory):
    built = cs.build_case(tmp_path_factory.mktemp("full"), cs.CASES["full"])
    return snap.gather(snap.load_run(built.folder, built.stores.both()))


@pytest.fixture(scope="module")
def raw(full):
    return writer.workbook_bytes(full)


@pytest.fixture(scope="module")
def book(raw):
    return load_workbook(io.BytesIO(raw))


@pytest.fixture(scope="module", params=("no_scorecard", "tdg_cp1"))
def bare(request, tmp_path_factory):
    built = cs.build_case(tmp_path_factory.mktemp(request.param), cs.CASES[request.param])
    snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    return load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))


def formulas(book) -> list[tuple[str, str, str]]:
    return [
        (name, cell.coordinate, cell.value)
        for name in THREE
        for row in book[name].iter_rows()
        for cell in row
        if cell.data_type == "f"
    ]


def text_of(book, sheet, block, row, column):
    return cell_of(book, block=block, row=row, column=column, sheet=sheet).value


# --- Structure ------------------------------------------------------------------------------------


def test_every_function_a_formula_uses_is_one_openpyxl_knows(book, bare):
    used = {name for _, _, text in formulas(book) for name in re.findall(r"([A-Z]+)\(", text)}
    assert {"IF", "INDEX", "COUNTIF", "ROUND", "INT", "MIN", "N"} <= used
    for opened in (book, bare):
        found = set()
        for _, _, text in formulas(opened):
            found |= set(re.findall(r"([A-Z][A-Z0-9.]*)\(", re.sub(r'"[^"]*"', "", text)))
        assert found and found <= set(FORMULAE), found - set(FORMULAE)


def test_every_formula_is_a_formula_cell_with_a_formula_row_on_sources_and_no_value(raw, book):
    rows = {(r["Sheet"], r["Cell"]): r for r in sources(book) if r["Kind"] == "formula"}
    cells = {(sheet, cell) for sheet, cell, _ in formulas(book)}
    assert cells == set(rows) and len(cells) > 100
    for sheet, cell, text in formulas(book):
        assert rows[sheet, cell]["Handoff text"] == text
    cached = load_workbook(io.BytesIO(raw), data_only=True)
    assert all(cached[sheet][cell].value is None for sheet, cell in cells)


REFERENCE = re.compile(r"(?:([A-Za-z]+)!)?(\$?[A-Z]{1,3}\$?[0-9]+)(?::(\$?[A-Z]{1,3}\$?[0-9]+))?")


def test_every_name_in_a_formula_is_a_cell_the_file_holds(book, bare):
    for opened in (book, bare):
        analyst = {(r["Sheet"], r["Cell"]) for r in sources(opened) if r["Kind"] == "analyst"}
        for sheet, address, text in formulas(opened):
            for found in REFERENCE.finditer(re.sub(r'"[^"]*"', "", text)):
                named, first, last = found.groups()
                assert named in THREE, (sheet, address, text)
                for end in (first, last):
                    if end is None:
                        continue
                    plain = end.replace("$", "")
                    letters = re.match(r"[A-Z]+", plain).group()
                    number = int(plain[len(letters) :])
                    target = opened[named]
                    assert number <= target.max_row, (sheet, address, end)
                    assert column_index_from_string(letters) <= target.max_column
                if last is None:
                    held = target[first.replace("$", "")]
                    assert held.value not in (None, "") or (named, held.coordinate) in analyst, (
                        sheet,
                        address,
                        first,
                    )


def test_a_name_the_workbook_does_not_hold_is_refused_loudly():
    one = fx.At("Matrix", "Nothing", "Row", "Column")
    with pytest.raises(ValueError, match="does not hold"):
        fx.resolve(fx.Formula("=⟦0⟧", (one,)), {})


def test_a_table_lookup_must_be_laid_out_as_the_grid_it_reads():
    cells = tuple(fx.At("Matrix", "T", f"r{i}", "c") for i in range(4))
    where = {("Matrix", "T", f"r{i}", "c"): f"B{i + 1}" for i in range(4)}
    flat = fx.Formula("=SUM(⟦0⟧)", (fx.Span(cells, (2, 2)),))
    with pytest.raises(ValueError, match="grid"):
        fx.resolve(flat, where)
    assert fx.resolve(fx.Formula("=SUM(⟦0⟧)", (fx.Span(cells),)), where) == (
        "=SUM(Matrix!$B$1:$B$4)"
    )


# --- The methodology's constants ------------------------------------------------------------------


def test_the_matrix_holds_each_methodology_constant_once_as_a_rule_cell(book):
    """The key's own `test_every_methodology_constant_is_one_rule_row_on_matrix` compares
    `Counter(RULES)`, which counts each constant by its VALUE (a Counter built from a dict), so it
    cannot pass for any writer; this is the comparison it means."""
    rows = [r for r in sources(book) if r["Kind"] == "rule"]
    assert {r["Sheet"] for r in rows} == {"Matrix"}
    keys = [(r["Block"], r["Row"], r["Column"]) for r in rows]
    assert sorted(keys) == sorted(RULES) and len(set(keys)) == len(keys)
    for row in rows:
        want = RULES[row["Block"], row["Row"], row["Column"]]
        got = book["Matrix"][row["Cell"]].value
        assert got == want and isinstance(got, int | str)
        assert isinstance(got, int) == isinstance(want, int)


def test_the_formulas_read_the_constants_from_those_cells(book):
    def cell(block, row, column):
        return cell_of(book, block=block, row=row, column=column, sheet="Matrix").coordinate

    result = text_of(book, "Matrix", "Result", "Term Loan B", CLO)
    assert "Matrix!$B$55:$F$59" in result
    assert f"Matrix!${cell('Credit Score rules', 'Cap level', 'Value')[0]}$" in result
    edges = text_of(book, "Matrix", "Valuation", "Term Loan B", LVLN)
    for name, _ in fx.BAND_EDGES:
        address = cell("Valuation bands", name, "Difference (bp)")
        assert f"Matrix!${address[0]}${address[1:]}" in edges
    score = text_of(book, "Inputs", "Credit Score from factors", "Credit Score", "Value")
    for name in ("Minimum scored factors", "Floor level"):
        address = cell("Credit Score rules", name, "Value")
        assert f"Matrix!${address[0]}${address[1:]}" in score


# --- Each kind of formula, as written -------------------------------------------------------------


def joined(*parts: str) -> str:
    return "".join(parts)


PINNED = [
    (
        ("Inputs", "Credit Score from factors", "Credit Score", "Value"),
        joined(
            '=IF(COUNT(Snapshot!$A$33:$Q$33)<Matrix!$G$72,"",',
            "MAX(INT((2*SUM(Snapshot!$A$33:$Q$33)+COUNT(Snapshot!$A$33:$Q$33))/(2*COUNT(Snapshot!$A$33:$Q$33))),",
            "IF(OR(Snapshot!$H$33=5,Snapshot!$O$33=5),Matrix!$G$73,0)))",
        ),
    ),
    (
        ("Matrix", "Eligible", "Term Loan B", "CLO portfolio"),
        '=IF(Inputs!$C$11="","",IF(COUNTIF(Matrix!$K$73,Inputs!$C$11)>0,1,0))',
    ),
    (
        ("Matrix", "Median (bp)", "Term Loan B", "Loan index fund (LVLN)"),
        joined(
            '=IF(Matrix!$C$86<>1,"",IF(OR(Inputs!$D$11="",NOT(OR(Inputs!$L$7="percent",',
            'Inputs!$L$7="basis points"))),"",IF(N(IF(AND(Inputs!$C$11="loan",',
            'Inputs!$D$11="BB"),Matrix!$D$16,IF(AND(Inputs!$C$11="loan",Inputs!$D$11="B"),',
            'Matrix!$D$17,"")))>=5,IF(AND(Inputs!$C$11="loan",Inputs!$D$11="BB"),',
            'Matrix!$C$16,IF(AND(Inputs!$C$11="loan",Inputs!$D$11="B"),Matrix!$C$17,',
            '""))*IF(Inputs!$L$7="percent",100,1),"")))',
        ),
    ),
    (
        ("Matrix", "Difference (bp)", "Term Loan B", "Loan index fund (LVLN)"),
        joined(
            '=IF(OR(Matrix!$K$86="",NOT(ISNUMBER(Inputs!$E$11)),',
            'NOT(ISNUMBER(Inputs!$F$11))),"",ROUND(Inputs!$E$11-Matrix!$K$86,6))',
        ),
    ),
    (
        ("Matrix", "Valuation", "Term Loan B", "Loan index fund (LVLN)"),
        joined(
            '=IF(Matrix!$E$94="","",IF(Matrix!$E$94>=Matrix!$C$73,1,',
            "IF(Matrix!$E$94>Matrix!$C$74,2,IF(Matrix!$E$94>=Matrix!$C$75,3,",
            "IF(Matrix!$E$94>Matrix!$C$76,4,5)))))",
        ),
    ),
    (
        ("Matrix", "Limit breach", "Term Loan B", "CLO portfolio"),
        joined(
            '=IF(Matrix!$B$86<>1,"",IF(OR(COUNTA(Matrix!$G$21)>0,',
            '(Inputs!$D$11="IG")*COUNTIF(Matrix!$C$26:$C$27,',
            '"breached")+(Inputs!$D$11="BB")*COUNTIF(Matrix!$E$26:$E$27,',
            '"breached")+(Inputs!$D$11="B")*COUNTIF(Matrix!$G$26:$G$27,',
            '"breached")+(Inputs!$D$11="CCC")*COUNTIF(Matrix!$I$26:$I$27,',
            '"breached")+(Inputs!$D$11="Unrated")*COUNTIF(Matrix!$K$26:$K$27,"breached")>0,',
            "AND(ISNUMBER(Inputs!$F$11),OR(Inputs!$F$11<Matrix!$I$31))),1,0))",
        ),
    ),
    (
        ("Matrix", "Result", "Term Loan B", "CLO portfolio"),
        joined(
            '=IF(OR(Inputs!$F$5="",Matrix!$I$94=""),"",IF(AND(INDEX(Matrix!$B$55:$F$59,',
            "Inputs!$F$5,Matrix!$I$94)<Matrix!$G$76,Matrix!$C$102=1),Matrix!$G$76,",
            "INDEX(Matrix!$B$55:$F$59,Inputs!$F$5,Matrix!$I$94)))",
        ),
    ),
    (
        ("Matrix", "Portfolio result", "CLO portfolio", "Result"),
        joined(
            "=IF(SUM(Matrix!$B$86:$B$90)=0,",
            'IF(COUNT(Matrix!$B$86:$B$90)=ROWS(Matrix!$B$86:$B$90),"n/a",""),',
            'IF(OR(Inputs!$F$5="",COUNT(Matrix!$I$102:$I$106)=0),"",',
            "MIN(Matrix!$I$102:$I$106)))",
        ),
    ),
    (
        ("Matrix", "Portfolio result", "High-yield bond fund (JNK)", "Result"),
        joined(
            "=IF(SUM(Matrix!$E$86:$E$90)=0,",
            'IF(COUNT(Matrix!$E$86:$E$90)=ROWS(Matrix!$E$86:$E$90),"n/a",""),"")',
        ),
    ),
    (
        ("Snapshot", "Recommendation", "CLO portfolio", "Proposed"),
        joined(
            "=IF(ISNUMBER(Matrix!$I$80),INDEX(Matrix!$K$65:$K$69,Matrix!$I$80),",
            "Matrix!$I$80)",
        ),
    ),
    (
        ("Snapshot", "Recommendation", "CLO portfolio", "Recommendation"),
        '=IF(Snapshot!$O$14<>"",Snapshot!$O$14,Snapshot!$M$14)',
    ),
    (
        ("Snapshot", "Recommendation", "CLO portfolio", "Status"),
        joined(
            '=IF(Snapshot!$J$14="","",IF(Snapshot!$J$14="n/a","",IF(Snapshot!$P$14<>"",',
            '"confirmed","proposed")))',
        ),
    ),
    (
        ("Snapshot", "Recommendation", "CLO portfolio", "Weight (%)"),
        "=Matrix!$C$21",
    ),
    (
        ("Snapshot", "Capital structure", "Term Loan B", "Proposed recommendation"),
        joined(
            '=IF(Inputs!$F$5="","",IF(Inputs!$C$11="loan",IF(Matrix!$K$94="","",',
            "INDEX(Matrix!$K$65:$K$69,INDEX(Matrix!$B$55:$F$59,Inputs!$F$5,Matrix!$K$94))),",
            '""))',
        ),
    ),
    (
        ("Snapshot", "Equity value", "Enterprise value", "Value"),
        joined(
            '=IF(Snapshot!$P$8="","",IF(ISNUMBER(Snapshot!$P$5),IF(Snapshot!$P$8="FY2025",',
            'IF(ISNUMBER(Snapshot!$D$65),Snapshot!$P$5+Snapshot!$D$65,""),',
            'IF(Snapshot!$P$8="FY2024",IF(ISNUMBER(Snapshot!$G$65),Snapshot!$P$5+Snapshot!$G$65,""),"")),',
            'IF(ISNUMBER(Snapshot!$P$6),IF(Snapshot!$P$8="FY2025",',
            'IF(ISNUMBER(Snapshot!$M$92),Snapshot!$P$6*Snapshot!$M$92,""),',
            'IF(Snapshot!$P$8="FY2024",IF(ISNUMBER(Snapshot!$O$92),Snapshot!$P$6*Snapshot!$O$92,""),"")),"")))',
        ),
    ),
    (
        ("Snapshot", "Capital structure", "Term Loan B", "% EV"),
        joined(
            "=IF(AND(ISNUMBER(Snapshot!$I$49),ISNUMBER(Snapshot!$P$7),",
            'Snapshot!$E$49=Snapshot!$P$9),IF(Snapshot!$P$7>0,Snapshot!$I$49/Snapshot!$P$7,""),"")',
        ),
    ),
    (
        ("Snapshot", "Key figures", "Value", "Net leverage"),
        "=Snapshot!$D$58",
    ),
    (
        ("Snapshot", "Key figures", "Direction", "Credit Score"),
        joined(
            '=IF(Snapshot!$D$40="Improving","▲",IF(Snapshot!$D$40="Stable","►",',
            'IF(Snapshot!$D$40="Deteriorating","▼","")))',
        ),
    ),
    (
        ("Snapshot", "Key figures", "Value", "Valuation"),
        '=IF(COUNT(Matrix!$I$94:$K$98)=0,"",MIN(Matrix!$I$94:$K$98))',
    ),
    (
        ("Snapshot", "Relative value: loans", "Term Loan B", "Price"),
        '=IF(Inputs!$C$11="loan",IF(Inputs!$F$11="","",Inputs!$F$11),"")',
    ),
    (
        ("Snapshot", "Relative value: loans", "Term Loan B", "Valuation"),
        '=IF(Inputs!$C$11="loan",Matrix!$K$94,"")',
    ),
    (
        ("Matrix", "Held by", "Term Loan B", CLO),
        joined(
            '=IF(OR(Inputs!$F$5="",Matrix!$I$94=""),"",IF(AND(INDEX(Matrix!$B$55:$F$59,',
            "Inputs!$F$5,Matrix!$I$94)<Matrix!$G$76,Matrix!$C$102=1),",
            'MID(IF(Matrix!$G$21<>"","; "&Matrix!$G$21,"")&IF(IF(Inputs!$D$11="IG",Matrix!$C$26,',
            'IF(Inputs!$D$11="BB",Matrix!$E$26,IF(Inputs!$D$11="B",Matrix!$G$26,',
            'IF(Inputs!$D$11="CCC",Matrix!$I$26,IF(Inputs!$D$11="Unrated",Matrix!$K$26,"")))))',
            '="breached","; "&MID(Matrix!$A$26,17,200),"")&IF(IF(Inputs!$D$11="IG",Matrix!$C$27,',
            'IF(Inputs!$D$11="BB",Matrix!$E$27,IF(Inputs!$D$11="B",Matrix!$G$27,',
            'IF(Inputs!$D$11="CCC",Matrix!$I$27,IF(Inputs!$D$11="Unrated",Matrix!$K$27,"")))))',
            '="breached","; "&MID(Matrix!$A$27,17,200),"")&IF(AND(ISNUMBER(Inputs!$F$11),',
            'Inputs!$F$11<Matrix!$I$31),"; "&MID(Matrix!$A$31,17,200),""),3,500),""))',
        ),
    ),
    (
        ("Snapshot", "Recommendation", CLO, "Held to MW"),
        joined(
            "=IF(Matrix!$I$80=Matrix!$G$76,IF(SUMPRODUCT((Matrix!$I$102:$I$106=Matrix!$G$76)*",
            '(Matrix!$G$110:$G$114=""))=0,INDEX(Matrix!$G$110:$G$114,',
            'MATCH(Matrix!$G$76,Matrix!$I$102:$I$106,0)),""),"")',
        ),
    ),
    (
        ("Snapshot", "Capital structure", "Term Loan B", "Status"),
        '=IF(Snapshot!$M$49="","",IF(Snapshot!$P$49<>"","confirmed","proposed"))',
    ),
]


@pytest.mark.parametrize(("where", "text"), PINNED, ids=[" / ".join(w[1:]) for w, _ in PINNED])
def test_each_kind_of_formula_is_written_exactly_so(book, where, text):
    sheet, block, row, column = where
    assert text_of(book, sheet, block, row, column) == text


def test_the_formula_cells_of_a_row_follow_the_instrument_not_a_neighbour(book):
    first = text_of(book, "Matrix", "Valuation", "Revolving Credit Facility", LVLN)
    assert first.startswith('=IF(Matrix!$E$95="","",')
    assert "Matrix!$E$94" not in first


def test_a_relative_value_row_names_itself_only_when_its_type_matches(book):
    loans = text_of(book, "Snapshot", "Relative value: loans", "Term Loan B", "Instrument")
    bonds = text_of(book, "Snapshot", "Relative value: bonds", "Term Loan B", "Instrument")
    assert loans == '=IF(Inputs!$C$11="loan",Inputs!$A$11,"")'
    assert bonds == '=IF(Inputs!$C$11="bond",Inputs!$A$11,"")'
    rows = listed(book, "Relative value: loans", column="Row label")
    assert rows == []  # the row's own formula is its name


def test_only_the_credit_score_tile_has_an_arrow_and_only_where_the_handoff_states_a_direction(
    book, bare
):
    arrows = listed(book, "Key figures", row="Direction", kind="formula")
    assert [r["Column"] for r in arrows] == ["Credit Score"]
    assert not [r for r in sources(bare) if r["Block"] == "Key figures" and r["Row"] == "Direction"]


# --- A run with no scorecard ----------------------------------------------------------------------


def test_with_no_scorecard_the_credit_score_is_a_yellow_cell_the_analyst_fills(bare):
    (row,) = listed(
        bare, "Credit Score from factors", sheet="Inputs", row="Credit Score", kind="analyst"
    )
    cell = bare[row["Sheet"]][row["Cell"]]
    assert cell.value is None and cell.fill.start_color.rgb[-6:] == writer.ANALYST_FILL
    tile = text_of(bare, "Snapshot", "Key figures", "Value", "Credit Score")
    here = f"Inputs!${cell.column_letter}${cell.row}"
    assert tile == f'=IF({here}="","",{here})'


# --- Dropdowns ------------------------------------------------------------------------------------


def lists(book, sheet):
    return {
        frozenset(str(v.sqref).split()): v.formula1
        for v in book[sheet].data_validations.dataValidation
        if v.type == "list"
    }


def addresses(book, block, column, sheet, kind):
    return frozenset(
        r["Cell"]
        for r in sources(book)
        if (r["Sheet"], r["Block"], r["Column"], r["Kind"]) == (sheet, block, column, kind)
    )


def test_the_instrument_dropdowns_offer_the_types_and_the_reference_buckets(book):
    found = lists(book, "Inputs")
    types = addresses(book, "Instruments", "Type", "Inputs", "analyst")
    buckets = addresses(book, "Instruments", "Rating bucket", "Inputs", "analyst")
    assert found[types] == '"loan,bond"'
    assert found[buckets] == '"' + ",".join(rp.BUCKET_NAMES) + '"'
    assert "Unrated" in rp.BUCKET_NAMES and found[buckets].count("Unrated") == 1
    units = addresses(book, "Reference unit", "Unit", "Inputs", "analyst")
    assert found[units] == '"basis points,percent"'
    assert len(found) == 3


def test_the_recommendation_dropdowns_offer_the_five_names_from_the_matrix_cells(book):
    found = lists(book, "Snapshot")
    views = addresses(book, "Recommendation", "Analyst view", "Snapshot", "analyst")
    proposals = addresses(
        book, "Capital structure", "Proposed recommendation", "Snapshot", "formula"
    )
    assert len(found) == 3 and found[views] == found[proposals]  # and the EV period
    first = cell_of(book, block="Scales", row="Recommendation 1", column="Name", sheet="Matrix")
    last = cell_of(book, block="Scales", row="Recommendation 5", column="Name", sheet="Matrix")
    assert (
        found[views]
        == f"Matrix!${first.coordinate[0]}${first.row}:${last.coordinate[0]}${last.row}"
    )
    names = [book["Matrix"].cell(row, first.column).value for row in range(first.row, last.row + 1)]
    assert names == list(rec.RECOMMENDATION_NAMES)


def test_every_dropdown_cell_is_an_analyst_cell_or_a_proposal_the_analyst_may_overwrite(book):
    kinds = {(r["Sheet"], r["Cell"]): r["Kind"] for r in sources(book)}
    for sheet in THREE:
        for validation in book[sheet].data_validations.dataValidation:
            for cell in str(validation.sqref).split():
                assert kinds[sheet, cell] in ("analyst", "formula"), (sheet, cell)


def test_the_recommendation_chips_colour_the_five_names_and_never_in_yellow(book):
    rules = {}
    for item in book["Snapshot"].conditional_formatting:
        for rule in item.rules:
            if rule.type == "cellIs":
                rules.setdefault(str(item.sqref), []).append(
                    (rule.formula[0].strip('"'), rule.dxf.fill.bgColor.rgb[-6:])
                )
    assert len(rules) == 2
    for sqref, found in rules.items():
        assert [name for name, _ in found] == list(rec.RECOMMENDATION_NAMES), sqref
        assert [c for _, c in found] == list(writer.CHIP_COLOURS)
        assert all(re.fullmatch(r"[A-Z]+[0-9]+", c) for c in sqref.split())


# --- Layout the formulas rely on, and the leak pattern --------------------------------------------


def test_the_reference_unit_card_has_one_header_over_its_cells(book):
    headers = [
        r for r in listed(book, "Reference unit", sheet="Inputs") if r["Row"].startswith("(header")
    ]
    assert [r["Row"] for r in headers] == ["(header)"]


@pytest.mark.parametrize(
    "text",
    ["CP-1A", "cp-1a", "see cp-2 here", "report.JSON", "notes.Parquet", "x." + "a" * 7]
    + ["A" * 64, "a" * 64, "0123456789ABCDEF" * 4],
)
def test_a_module_id_file_name_or_hash_in_any_case_is_a_leak(text):
    assert writer._leaks(text, "run-1")


@pytest.mark.parametrize(
    "text", ["Cash generation improved.", "EBITDA rose 4.5% in FY2025", "a" * 63, "x.abcdefgh"]
)
def test_ordinary_sentences_are_not_leaks(text):
    assert not writer._leaks(text, "run-1")


def test_each_reference_says_which_asset_types_an_issuers_instruments_can_be_read_in(full):
    kinds = {v.name: (v.kind, v.eligible) for v in full.references}
    assert kinds == {
        CLO: ("clo", ("loan",)),
        LVLN: ("loan_index", ("loan",)),
        "High-yield bond fund (JNK)": ("hy_index", ("bond",)),
    }
    custom = rp.custom("Own book")
    assert snap._eligible(custom) == ("loan", "bond")
    assert snap._eligible(rp.custom("Own loans", asset_type="loan")) == ("loan",)


# --- Fix round 1 ----------------------------------------------------------------------------------


def opened_from(snapshot):
    return load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))


def with_cp2(text, tmp_path):
    from deploy_vii.context import load_context

    handoffs = {m: p.read_bytes() for m, p in cs.ALL_MODULES.items()} | {"CP-2": text.encode()}
    run = snap.SnapshotRun(
        cs.ISSUER_NAME,
        cs.AS_OF,
        "credit_snapshot",
        cs.CASES["full"].run_id,
        handoffs,
        load_context(cs.context_bytes()),
        [],
    )
    return snap.gather(run)


def test_an_emphasised_level_or_view_is_the_value_cp2_read_with_its_text_kept_on_sources(tmp_path):
    text = (cs.HANDOFFS / "CP-2.md").read_text(encoding="utf-8")
    text = text.replace("| Liquidity | 2 |", "| Liquidity | **5** |")
    text = text.replace("| Maturity profile | 3 |", "| Maturity profile | `3` |")
    text = text.replace("| Credit Direction | Stable |", "| Credit Direction | **Stable** |")
    opened = opened_from(with_cp2(text, tmp_path))
    liquidity = listed(opened, "Scorecard", row="Liquidity", column="Level")
    (row,) = liquidity
    assert row["Kind"] == "computed" and row["Handoff text"] == "5"
    cell = opened["Snapshot"][row["Cell"]]
    assert cell.value == 5 and cell.number_format == "0"
    written = [
        r
        for r in sources(opened)
        if (r["Block"], r["Row"], r["Column"]) == ("Scorecard", "Liquidity", "As written")
    ]
    assert [(r["Kind"], r["Handoff text"], r["Sheet"]) for r in written] == [
        ("copied", "**5**", "Sources")
    ]
    assert written[0]["Module"] == "CP-2" and written[0]["Line"] == row["Line"]
    (view,) = listed(opened, "Assessments", row="Credit Direction", column="View")
    assert view["Kind"] == "computed" and opened["Snapshot"][view["Cell"]].value == "Stable"
    maturity = cell_of(opened, block="Scorecard", row="Maturity profile", column="Level")
    assert maturity.value == 3
    # A plain one is still the handoff's own text.
    (scale,) = listed(opened, "Scorecard", row="Scale", column="Level")
    assert scale["Kind"] == "copied"
    assert not [r for r in sources(opened) if (r["Row"], r["Column"]) == ("Scale", "As written")]


def test_the_tiles_show_one_period_the_latest_by_its_stated_end_date(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["tdg_cp1"])
    opened = opened_from(snap.gather(snap.load_run(built.folder, built.stores.both())))
    liquidity = cell_of(opened, block="Key figures", row="Value", column="Liquidity")
    assert opened["Snapshot"][liquidity.coordinate].value.startswith("=Snapshot!")
    target = opened["Snapshot"][liquidity.value[len("=Snapshot!") :].replace("$", "")]
    assert target.value == 6261  # FY2024 cash; the handoff lists FY2023 first
    for tile, row in (("Liquidity", "Cash"), ("Net leverage", "Net debt / EBITDA")):
        reading = cell_of(opened, block="Key figures", row="Reading", column=tile).value
        assert reading == f"{row}, FY2024 / 2024-09-30"


def snapshot_edited(full, edit):
    blocks = tuple(replace_cells(b, edit) if b.sheet == "Snapshot" else b for b in full.blocks)
    from dataclasses import replace

    return replace(full, blocks=blocks)


def replace_cells(block, edit):
    from dataclasses import replace

    return replace(block, cells=tuple(c for cell in block.cells for c in edit(cell)))


def test_a_period_with_no_readable_end_date_leaves_every_tile_a_gap(full):
    from dataclasses import replace

    def edit(cell):
        if cell.block == "Capital structure totals" and cell.column.startswith("FY2024 / "):
            return [replace(cell, column="FY2024")]
        return [cell]

    opened = opened_from(snapshot_edited(full, edit))
    for tile in ("Net leverage", "Interest cover", "Liquidity"):
        (row,) = listed(opened, "Key figures", row="Value", column=tile)
        assert (row["Kind"], row["Handoff text"]) == ("gap", "period order not stated")
        assert opened["Snapshot"][row["Cell"]].value == "period order not stated"


def test_a_tile_whose_source_row_is_absent_is_a_gap_not_a_label(full):
    def edit(cell):
        return [] if cell.block == "Capital structure totals" and cell.row == "Cash" else [cell]

    opened = opened_from(snapshot_edited(full, edit))
    (row,) = listed(opened, "Key figures", row="Value", column="Liquidity")
    assert (row["Kind"], row["Handoff text"]) == ("gap", "not in handoff")
    cover = cell_of(opened, block="Key figures", row="Value", column="Interest cover")
    assert cover.value.startswith("=Snapshot!")


def test_the_enterprise_value_reads_the_period_the_analyst_picks(book):
    (period,) = listed(book, "Equity value", row="EV period", kind="analyst")
    assert book["Snapshot"][period["Cell"]].value is None
    found = lists(book, "Snapshot")
    assert found[frozenset({period["Cell"]})] == '"FY2025,FY2024"'
    text = text_of(book, "Snapshot", "Equity value", "Enterprise value", "Value")
    assert text.count('="FY2024"') == 2 and text.count('="FY2025"') == 2
    assert not hasattr(fx._Builder, "_first") and not hasattr(fx._Builder, "_column")


def test_a_period_with_no_period_picked_or_an_input_blank_gives_a_blank_percent_of_ev(book):
    text = text_of(book, "Snapshot", "Capital structure", "Term Loan B", "% EV")
    assert text.startswith("=IF(AND(ISNUMBER(") and text.count("ISNUMBER(") == 2
    assert "IF(Snapshot!$P$7>0," in text and text.endswith(',"")')


def test_a_unit_that_differs_by_period_is_a_gap_not_the_first_periods_unit(tmp_path):
    lines = (cs.HANDOFFS / "CP-1.md").read_text(encoding="utf-8").split("\n")
    start = next(i for i, line in enumerate(lines) if line.startswith("### Net debt data"))
    rows = [i for i in range(start, len(lines)) if lines[i].startswith("|")][2:4]
    edited = list(lines)
    edited[rows[1]] = edited[rows[1]].replace("GBP millions", "GBP thousands")
    handoffs = {m: p.read_bytes() for m, p in cs.ALL_MODULES.items()}
    handoffs["CP-1"] = "\n".join(edited).encode()
    shot = snap.gather(snap.SnapshotRun(cs.ISSUER_NAME, cs.AS_OF, "x", "r", handoffs, None, []))
    units = {
        (c.block, c.row): (c.kind, c.text)
        for c in shot.cells()
        if c.column == "Unit" and c.row in ("Net debt", "Cash")
    }
    assert units["Capital structure totals", "Net debt"] == ("gap", "unit differs by period")
    assert units["Financials", "Cash"] == ("gap", "unit differs by period")


def test_each_proposal_has_a_yellow_confirm_cell_and_a_proposed_tag(book):
    (confirm,) = listed(book, "Capital structure", row="Term Loan B", column="Confirm")
    assert confirm["Kind"] == "analyst"
    assert len(listed(book, "Capital structure", column="Confirm", kind="analyst")) == 5
    status = text_of(book, "Snapshot", "Capital structure", "Term Loan B", "Status")
    assert '"confirmed","proposed"' in status


@pytest.fixture(scope="module")
def with_bonds(tmp_path_factory):
    from datetime import date
    from decimal import Decimal

    built = cs.build_case(tmp_path_factory.mktemp("bonds"), cs.CASES["full"])
    names = ("Ab", "Bc", "Cd", "De", "Ef", "Fg")
    positions = tuple(
        rp.Position(
            i, borrower=n, asset_type="bond", rating_bucket="BB", margin=Decimal(400 + 10 * i)
        )
        for i, n in enumerate(names, 1)
    )
    fund = rp.Portfolio(
        *("jnk", "High-yield bond fund (JNK)", "hy_index", date(2026, 3, 19), cs.STORED_AT, ()),
        positions,
        columns_found=(("borrower", "Name"), ("margin", "Spread")),
    )
    built.stores.standing.save(fund)
    return opened_from(snap.gather(snap.load_run(built.folder, built.stores.both())))


BONDS = [
    (
        ("Snapshot", "Capital structure", "4.50% Senior Notes 2030", "Proposed recommendation"),
        joined(
            '=IF(Inputs!$F$5="","",IF(Inputs!$C$14="loan",IF(Matrix!$I$97="","",',
            "INDEX(Matrix!$K$66:$K$70,INDEX(Matrix!$B$56:$F$60,Inputs!$F$5,Matrix!$I$97))),",
            'IF(Inputs!$C$14="bond",IF(Matrix!$K$97="","",INDEX(Matrix!$K$66:$K$70,',
            'INDEX(Matrix!$B$56:$F$60,Inputs!$F$5,Matrix!$K$97))),"")))',
        ),
    ),
    (
        ("Snapshot", "Relative value: bonds", "4.50% Senior Notes 2030", "Index median (bp)"),
        '=IF(Inputs!$C$14="bond",Matrix!$K$89,"")',
    ),
    (
        ("Snapshot", "Relative value: bonds", "4.50% Senior Notes 2030", "Valuation"),
        '=IF(Inputs!$C$14="bond",Matrix!$K$97,"")',
    ),
    (
        ("Matrix", "Median (bp)", "4.50% Senior Notes 2030", "High-yield bond fund (JNK)"),
        joined(
            '=IF(Matrix!$E$89<>1,"",IF(OR(Inputs!$D$14="",NOT(OR(Inputs!$L$8="percent",',
            'Inputs!$L$8="basis points"))),"",IF(N(IF(AND(Inputs!$C$14="bond",',
            'Inputs!$D$14="BB"),Matrix!$D$17,""))>=5,IF(AND(Inputs!$C$14="bond",',
            'Inputs!$D$14="BB"),Matrix!$C$17,"")*IF(Inputs!$L$8="percent",100,1),"")))',
        ),
    ),
]


@pytest.mark.parametrize(("where", "text"), BONDS, ids=[" / ".join(w[1:]) for w, _ in BONDS])
def test_the_bond_branches_are_written_exactly_so(with_bonds, where, text):
    sheet, block, row, column = where
    assert text_of(with_bonds, sheet, block, row, column) == text


def test_held_by_is_blank_for_a_reference_with_no_limit_to_breach(book):
    assert not [r for r in listed(book, "Held by", sheet="Matrix") if r["Column"] == LVLN]
    assert [r for r in listed(book, "Held by", sheet="Matrix") if r["Column"] == CLO]
