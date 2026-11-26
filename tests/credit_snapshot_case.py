"""Credit Snapshot answer key, part 1: the cases, synthetic references and the run-folder builder.

SYNTHETIC. Every issuer, name and figure here is invented ("Northbridge"); none is issuer, fund or
market data. The handoffs are in `tests/fixtures/credit_snapshot/handoffs/`, written from the
headings, table ids and columns the method files give (`reconciliation.md` of the PR 4 brief,
checked against the method files), not from any reader code. They prove function, not that a real
CP-1A, CP-1B, CP-1C, CP-1D, CP-2 or CP-DR handoff has this shape. The one real handoff is the
retained TransDigm CP-1 (as of 2024-09-30), used for the CP-1 blocks only.

Nothing here is production code: the helper builds finished run folders on top of
`library_fixtures.make_run` (which it does not edit), pins a context, and builds reference
portfolios through `reference_portfolios`' public classes. It also holds the test's own readers (a
pipe splitter, a line counter and a number renderer) so the fidelity comparison does not share the
writer's code.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal
from pathlib import Path

import library_fixtures as lf

from deploy_vii.inputs import portfolio_export as pe
from deploy_workflow import library_index
from deploy_workflow import reference_portfolios as rp

TESTS = Path(__file__).resolve().parent
FIXTURES = TESTS / "fixtures" / "credit_snapshot"
HANDOFFS = FIXTURES / "handoffs"
TDG_CP1 = TESTS / "fixtures" / "live_2026_11_15" / "earnings_update-CP-1-draft3-accepted.md"

ISSUER_ID = "northbridge"
ISSUER_NAME = "Northbridge Holdings plc"
AS_OF = "2026-03-31"
# The four sheets, in order. The test holds the workbook to exactly these.
SHEETS = ("Snapshot", "Inputs", "Matrix", "Sources")
SOURCES_HEADER = (
    *("Sheet", "Cell", "Kind", "Block", "Row", "Column", "Module", "Section", "Line"),
    *("Handoff text", "Handoff sha256", "Run", "As of"),
)


@dataclass(frozen=True)
class Case:
    """One finished run the fidelity test builds: which handoff file stands for each module, the
    pathway, whether a context is pinned and which stores hold references."""

    name: str
    pathway: str
    handoffs: dict[str, Path]
    context: bool
    references: bool
    expected: str  # the expected-cells file in FIXTURES
    issuer_id: str = ISSUER_ID
    issuer_name: str = ISSUER_NAME
    as_of: str = AS_OF

    @property
    def run_id(self) -> str:
        return f"{self.issuer_id}-{self.as_of}-{self.pathway}"


def _h(name: str) -> Path:
    return HANDOFFS / f"{name}.md"


ALL_MODULES = {
    "CP-1": _h("CP-1"),
    "CP-1A": _h("CP-1A"),
    "CP-1B": _h("CP-1B"),
    "CP-1C": _h("CP-1C"),
    "CP-1D": _h("CP-1D"),
    "CP-2": _h("CP-2"),
    "CP-DR": _h("CP-DR"),
}
CASES = {
    # Every module the blocks name, a pinned context and stored references.
    "full": Case("full", "credit_snapshot", ALL_MODULES, True, True, "expected_cells.json"),
    # A pathway without CP-2 and CP-1C (earnings_update), no pinned context, no stored reference,
    # and a CP-1 whose T4.18 has no Reporting Currency Amount or FX Rate.
    "no_scorecard": Case(
        "no_scorecard",
        "earnings_update",
        {
            "CP-1": _h("CP-1-without-fx"),
            "CP-1A": _h("CP-1A"),
            "CP-1B": _h("CP-1B"),
            "CP-1D": _h("CP-1D"),
            "CP-DR": _h("CP-DR"),
        },
        False,
        False,
        "expected_cells_no_scorecard.json",
    ),
    # CP-1 only, the real retained handoff.
    "tdg_cp1": Case(
        "tdg_cp1",
        "earnings_update",
        {"CP-1": TDG_CP1},
        False,
        False,
        "expected_cells_tdg_cp1.json",
        issuer_id="transdigm-group",
        issuer_name="TransDigm Group Incorporated",
        as_of="2024-09-30",
    ),
}


def expected_cells(case: Case) -> dict:
    return json.loads((FIXTURES / case.expected).read_text(encoding="utf-8"))


# --- The pinned context ---------------------------------------------------------------------------


def context_bytes(*, as_of: str = AS_OF, pathway: str = "credit_snapshot") -> bytes:
    """A valid `context/1` file for Northbridge: two deal terms, two quotes, two issuer ratings and
    one facility rating, and a sector (Industrials) that differs from CP-1A's (Capital Goods)."""
    shared = {
        "call_protection": "6 months soft call",
        "provider": "Syndicate desk",
        "as_of": "2026-03-25",
        "floor_pct": "0.5",
        "talk_oid_low": "98.5",
        "talk_oid_high": "99.0",
        "tenor_years": "7",
    }
    terms = [
        {
            **shared,
            "facility_id": "tlb-2031",
            "instrument": "Term Loan B 2031",
            "currency": "USD",
            "size_m": "600",
            "talk_spread_bps_low": "350",
            "talk_spread_bps_high": "375",
            "maturity": "2033-03-31",
            "use_of_proceeds": "Refinance the 2027 term loan and pay fees.",
        },
        {
            **shared,
            "facility_id": "notes-2032",
            "instrument": "Senior Notes 2032",
            "currency": "EUR",
            "size_m": "400",
            "talk_spread_bps_low": "425",
            "talk_spread_bps_high": "450",
            "maturity": "2032-09-01",
            "use_of_proceeds": "Fund the Cedar Valves acquisition.",
        },
    ]
    quote = {"yield_pct": "", "spread_bps": "", "provider": "Syndicate desk"}
    quotes = [
        {
            **quote,
            "facility_id": "tlb-2031",
            "kind": "observed",
            "bid": "98.5",
            "ask": "99.0",
            "price": "98.75",
            "as_of": "2026-03-27",
        },
        {
            **quote,
            "facility_id": "notes-2032",
            "kind": "indicative_talk",
            "bid": "",
            "ask": "",
            "price": "",
            "yield_pct": "6.25",
            "as_of": "2026-03-28",
        },
    ]
    ratings = [
        {"agency": "Moody's", "scope": "issuer", "rating": "B2", "outlook": "Stable"}
        | {"as_of": "2026-03-10"},
        {"agency": "S&P", "scope": "issuer", "rating": "B", "outlook": "Negative"}
        | {"as_of": "2026-03-12"},
        {"agency": "Moody's", "scope": "facility", "rating": "Ba3", "outlook": ""}
        | {"as_of": "2026-03-10"},
    ]
    document = {
        "schema": "context/1",
        "run": {
            "run_type": "primary",
            "pathway": pathway,
            "case_kind": "synthetic",
            "as_of": as_of,
            "current_period": "",
            "prior_period": "",
            "reporting_currency": "GBP",
        },
        "identity": {
            "issuer_name": ISSUER_NAME,
            "issuer_id": ISSUER_ID,
            "borrower_name": "",
            "parent_name": "",
            "guarantors": [],
            "aliases": [],
            "listed_equity": False,
            "ticker": "",
            "sector": "Industrials",
            "country": "United Kingdom",
            "sponsor": "Northbridge Capital LP",
        },
        "deal_terms": terms,
        "quotes": quotes,
        "ratings": ratings,
        "valuation": {
            "peer_source": "none",
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
        "assumptions": dict.fromkeys(("cp2a", "cp2d", "cp2e", "cp3c", "cp3d", "cp4c")),
        "attachments": {
            "portfolio_workbook": False,
            "prior_case": False,
            "management_bridge": False,
            "legal_documents": "executed",
        },
        "research_questions": [],
    }
    return json.dumps(document, indent=2).encode()


# --- Synthetic reference portfolios ---------------------------------------------------------------

STORED_AT = datetime(2026, 3, 22, 9, 0, tzinfo=UTC)


def _limit(row: int, category: str, parameter: str, limit: str, *rest: str) -> rp.Limit:
    """One constraints row; `rest` is current exposure, headroom, status (blank when omitted)."""
    exposure, headroom, status = (*rest, "", "", "")[:3]
    return rp.Limit(
        *("constraints.csv", row, category, parameter, limit, "Hard", exposure, headroom, status),
        "",
        pe.quantity(limit),
    )


def _loan(
    row: int, borrower: str, bucket: str, *, dm: str | None = None, margin: str | None = None
) -> rp.Position:
    return rp.Position(
        row,
        borrower=borrower,
        asset_type="loan",
        rating_bucket=bucket,
        discount_margin=None if dm is None else Decimal(dm),
        margin=None if margin is None else Decimal(margin),
    )


def clo_portfolio() -> rp.Portfolio:
    """The CLO book (levels are discount margins in basis points; weights are percentages).

    BB 5 names, B 7 positions of 6 names (Northbridge twice), CCC 3 names. Six limits: a breached
    sector limit for Industrials, a sector limit for another sector, a breached CCC limit, a
    `B and below` limit, one limit nothing can be read from, and a price floor of 90."""
    spec = [
        *(("BB", name, dm, "10.0") for name, dm in _BB_CLO),
        *(("B", name, dm, w) for name, dm, w in _B_CLO),
        *(("CCC", name, dm, "5.0") for name, dm in _CCC_CLO),
    ]
    positions = tuple(
        rp.Position(
            number,
            borrower=name,
            asset_type="loan",
            rating_bucket=bucket,
            discount_margin=Decimal(dm),
            weight=Decimal(weight),
        )
        for number, (bucket, name, dm, weight) in enumerate(spec, start=1)
    )
    limits = (
        _limit(2, "Sector", "Industrials max", "≤ 20% NAV", "20.0%", "0.0%", "Breach"),
        _limit(3, "Sector", "Utilities max", "≤ 10% NAV", "8.0%", "2.0%", "Pass"),
        _limit(4, "Rating", "CCC max", "≤ 7.5% NAV", "7.9%", "-0.4%", "Breach"),
        _limit(5, "Rating", "B and below max", "≤ 40% NAV", "32.0%", "8.0%", "Pass"),
        _limit(6, "Concentration", "Top 10 obligors", "≤ 30% NAV", "", "", "TBD"),
        _limit(7, "Price", "Minimum price", "≥ 90"),
    )
    return rp.Portfolio(
        *("clo", "CLO portfolio", "clo", date(2026, 3, 20), STORED_AT, ()),
        positions,
        limits,
        columns_found=(
            ("borrower", "Borrower Name"),
            ("weight", "Share of Priced MV (%)"),
            ("discount_margin", "Mid 3Y DM"),
        ),
    )


_BB_CLO = (
    ("Quill Packaging", "250"),
    ("Rowan Logistics", "275"),
    ("Sable Foods", "300"),
    ("Tarn Media", "325"),
    ("Umber Chemicals", "350"),
)
# Northbridge holds two positions: the bucket has 7 positions and 6 names.
_B_CLO = (
    ("Vale Retail", "380", "6.35"),
    ("Wren Health", "410", "6.35"),
    ("Yarrow Energy", "425", "6.35"),
    (ISSUER_NAME, "500", "2.25"),
    ("Zephyr Telecom", "450", "6.35"),
    ("Amber Software", "470", "6.35"),
    (ISSUER_NAME, "520", "1.00"),
)
_CCC_CLO = (("Basil Leisure", "800"), ("Cobalt Mining", "900"), ("Dove Steel", "1000"))


def lvln_portfolio() -> rp.Portfolio:
    """The loan index fund, whose levels are in PERCENT (a `Spread (%)` column): BB 5 names, B 6
    names, no stated weights, no limits, and no Northbridge position."""
    bb = ("2.50", "2.75", "3.00", "3.25", "3.50")
    b = ("3.25", "3.50", "3.75", "4.00", "4.25", "4.50")
    names_bb = ("Juliet Packaging", "Kilo Logistics", "Lima Foods", "Mike Media", "November Chem")
    names_b = ("Delta Retail", "Echo Health", "Foxtrot Energy", "Golf Telecom", "Hotel Software")
    names_b += ("India Leisure",)
    positions = tuple(
        _loan(number, name, bucket, margin=level)
        for number, (bucket, name, level) in enumerate(
            [("BB", n, v) for n, v in zip(names_bb, bb, strict=True)]
            + [("B", n, v) for n, v in zip(names_b, b, strict=True)],
            start=1,
        )
    )
    return rp.Portfolio(
        *("lvln", "Loan index fund (LVLN)", "loan_index", date(2026, 3, 19), STORED_AT, ()),
        positions,
        columns_found=(("borrower", "Name"), ("margin", "Spread (%)")),
    )


@dataclass(frozen=True)
class Stores:
    standing: rp.Store
    run: rp.Store

    def both(self) -> list[rp.Store]:
        return [self.standing, self.run]


def build_stores(root: Path, run_id: str, *, references: bool) -> Stores:
    """The standing store and the run's own store under `root`. With `references`: the CLO book and
    the loan index fund are stored; the high-yield fund is not (and nothing is in the run store)."""
    standing = rp.Store(root / "reference_portfolios")
    run = rp.Store(root / "reference_portfolios" / "runs" / run_id)
    if references:
        standing.save(clo_portfolio())
        standing.save(lvln_portfolio())
    return Stores(standing, run)


# --- A finished run folder ------------------------------------------------------------------------


@dataclass(frozen=True)
class Built:
    case: Case
    folder: Path
    stores: Stores
    handoff_text: dict[str, str]  # module -> the handoff file's text


def build_case(workspace: Path, case: Case) -> Built:
    """A finished run folder for `case` under `workspace/runs/`, accepted by
    `library_index.report_completion` and `verified_delivery`.

    Built on `library_fixtures.make_run` (CP-1 only, a delivery with no report.html), then, in this
    code only: every handoff is replaced or added, the manifest, the delivery's receipt and the
    completion record are re-pinned, and the context (when the case has one) is stored at
    `inputs/<sha256>`, named by `workflow.json`'s `sources.context`, with the completion record's
    `workflow_sha256` set to the workflow file's hash. No global state is touched."""
    run_dir = lf.make_run(
        workspace,
        case.run_id,
        issuer_id=case.issuer_id,
        issuer_name=case.issuer_name,
        as_of=case.as_of,
        modules=("CP-1",),
        pathway=case.pathway,
        report_page=False,
        settled=("0.10",),
    )
    texts = {module: path.read_bytes() for module, path in case.handoffs.items()}
    modules = list(texts)
    delivered = next(iter((run_dir / "deliveries").iterdir()))
    files = json.loads((delivered / "delivery.json").read_text())["files"]
    pins = {}
    for module, raw in texts.items():
        digest = lf.sha(raw)
        path = f"requests/{module}/{digest}/1.response.md"
        lf.put(run_dir / path, raw)
        lf.put(delivered / f"{module}.md", raw)
        files[f"{module}.md"] = digest
        pins[module] = {"path": path, "sha256": digest}
    receipt_sha = lf.put(delivered / "delivery.json", json.dumps({"files": files}).encode())

    def manifest_change(manifest: dict) -> None:
        manifest["handoffs"] = pins
        manifest["run"]["requested_modules"] = modules

    lf.rewrite_manifest(run_dir, manifest_change)
    workflow = json.loads((run_dir / "workflow.json").read_text())
    workflow["run"]["requested_modules"] = modules
    if case.context:
        raw_context = context_bytes(as_of=case.as_of, pathway=case.pathway)
        digest = lf.put(run_dir / "inputs" / lf.sha(raw_context), raw_context)
        workflow["sources"] = {"context": {"path": "context.json", "sha256": digest}}
    workflow_sha = lf.put(run_dir / "workflow.json", json.dumps(workflow).encode())

    def completion_change(record: dict) -> None:
        record["delivery_sha256"] = receipt_sha
        record["modules"] = {module: pin["path"] for module, pin in pins.items()}
        record["module_execution"] = dict.fromkeys(modules, "live-provider")
        record["workflow_sha256"] = workflow_sha

    lf.rewrite_completion(run_dir, completion_change)
    stores = build_stores(workspace, case.run_id, references=case.references)
    return Built(case, run_dir, stores, {m: raw.decode("utf-8") for m, raw in texts.items()})


def verified(folder: Path) -> dict:
    """What `load_run` must start from: the completion record and its verified delivery."""
    completion = library_index.report_completion(folder)
    return library_index.verified_delivery(folder, completion)


# --- The test's own readers (independent of the writer's) -----------------------------------------


def physical_lines(text: str) -> list[str]:
    """Lines split on newlines only (a final newline ends the last line), numbered from 1."""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    return lines[:-1] if lines and lines[-1] == "" else lines


def pipe_cells(line: str) -> list[str]:
    """The cells of one pipe-table row: outer pipes dropped, split on unescaped pipes, trimmed."""
    body = line.strip()
    body = body.removeprefix("|")
    body = body.removesuffix("|")
    return [cell.strip().replace("\\|", "|") for cell in re.split(r"(?<!\\)\|", body)]


PLAIN_NUMBER = re.compile(r"-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?")
FORMAT = re.compile(r"^(?:General|(0|#,##0)((?:\.0+)?)(?:;\(\1\2\))?)$")


def is_plain_decimal(text: str) -> bool:
    """The number rule of the plan's constraint 4: a plain decimal of at most 15 significant
    digits. Units, `x`, `%`, ranges, brackets, footnote marks and longer figures are text."""
    if PLAIN_NUMBER.fullmatch(text) is None:
        return False
    digits = text.replace(",", "").lstrip("-").replace(".", "").lstrip("0")
    return len(digits) <= 15


def render_number(value: object, number_format: str) -> str:
    """A stored number as its cell format shows it, thousands separators and brackets dropped: the
    digits a reader sees, with a minus sign for a negative. Raises for a format the plan does not
    allow (`0`, `0.0...`, `#,##0`, `#,##0.0...` and the bracketed `;(...)` pair of each)."""
    found = FORMAT.match(number_format)
    if found is None or isinstance(value, bool) or not isinstance(value, int | float):
        raise AssertionError(f"cannot render {value!r} in format {number_format!r}")
    exact = Decimal(repr(value))
    if number_format == "General":
        return format(exact.normalize(), "f")
    places = max(len(found[2]) - 1, 0)
    return f"{exact:.{places}f}"


def shown(value: object, number_format: str = "General") -> str:
    """What a cell shows as text: a number through `render_number`, text as it is, blank as ''."""
    if value is None:
        return ""
    if isinstance(value, int | float) and not isinstance(value, bool):
        return render_number(value, number_format)
    return str(value)


def same_figure(shown_text: str, expected: str) -> bool:
    """Equal as text, or, when both read as decimals, equal as numbers (computed values)."""
    if shown_text == expected:
        return True
    try:
        return Decimal(shown_text) == Decimal(expected)
    except ArithmeticError:
        return False


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()
