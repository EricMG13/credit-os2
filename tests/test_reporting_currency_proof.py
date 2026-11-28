"""PR 2, task 6: a run in the currency its sources report in, through delivery and the library.

SYNTHETIC, DETERMINISTIC PROOF ON CANNED DATA. The fake provider of `test_cpos_launch` replays
hand-written module answers (the retained USD ones with only the currency, the units and the
amounts below changed) through the real launcher, delivery and library build, and the pages are read
in headless Chrome. No provider is called, no paid run is made, and no real non-USD issuer is read:
this proves the wiring for a reporting currency that is not USD, not any analysis.

Pathway: `deep_credit_assessment`, the one pathway that runs CP-1, CP-2D, CP-3C, CP-4C and CP-2G.
Every expected value is a literal worked by hand from the synthetic source text below; none is
computed by production code (docs/rulings/2026-11-16-reporting-currency-from-sources.md).
"""

import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest
import test_cpos_launch as launched
from browser_helper import chrome

from deploy_workflow.inbox import runs as inbox_runs
from react_frontend import make_server

provider = launched.provider  # the fake provider fixture, reused as it is
RUN = launched.RUN_ID
ROOT = launched.ROOT

# The synthetic filing text. The reporting rate is the one the sources state for the reporting.
FILING = (
    "Net sales were 100. The consolidated statements are presented in {code} millions. "
    "Dollar notes of 125 million are carried at {code} 100 million at the rate of 0.80 {code} "
    "per USD stated for the reporting (note 3, p.97)."
)
FILING_NO_RATE = (
    "Net sales were 100. The consolidated statements are presented in {code} millions. "
    "Dollar notes of 125 million are outstanding; the filing states no {code} amount for them."
)
# Where the rate is stated: the locator that must reach Evidence only (P4).
RATE_LOCATOR = "AR note 3, p.97"

T418_HEAD = (
    "| Instrument | Type | Carrying Value | Principal | Drawn | Commitment | Security | Ranking | "
    "Currency | Reporting Currency Amount | FX Rate | Coupon or Margin | Rate Type | "
    "Reference Rate | Spread (bps) | Floor (bps) | Maturity | Annual Amortisation | Source |"
)
NA = "Not applicable"
# Three facilities of one issuer reporting in {code}: its own; a EUR one whose filing states the
# {code} amount (900 EUR = 600 {code}); a USD one converted at the stated rate (125 x 0.80 = 100).
OWN_ROW = (
    "| {code} term loan | Term loan | 700 | 700 | 700 | 700 | Secured | Senior | {code} | 700 "
    f"| {NA} | 6.00% | Fixed | {NA} | {NA} | {NA} | 2030-06-30 | 0 | AR p.86 |"
)
EUR_ROW = (
    "| EUR notes | Notes | 900 | 900 | 900 | 900 | Unsecured | Senior | EUR | 600 "
    f"| {NA} | 5.00% | Fixed | {NA} | {NA} | {NA} | 2031-06-30 | 0 "
    "| AR p.87; {code} amount AR p.88 |"
)
USD_ROW_RATE = (
    "| Dollar notes | Notes | 125 | 125 | 125 | 125 | Unsecured | Senior | USD | 100 "
    f"| 0.80 {{code}}/USD | 7.00% | Fixed | {NA} | {NA} | {NA} | 2032-06-30 | 0 "
    f"| AR p.89; rate {RATE_LOCATOR} |"
)
NO_AMOUNT = "Not supplied: the filing states no {code} amount and the sources state no rate"
USD_ROW_NO_RATE = (
    f"| Dollar notes | Notes | 125 | 125 | 125 | 125 | Unsecured | Senior | USD | {NO_AMOUNT} "
    f"| Not supplied: no rate is stated | 7.00% | Fixed | {NA} | {NA} | {NA} | 2032-06-30 | 0 "
    "| AR p.89 |"
)
# The total that depends on the Dollar notes: contractual principal in the reporting currency
# (700 + 600 + 100 = 1,400 when the rate is stated; otherwise it cannot be calculated).
PRINCIPAL_ROW = "| FY2024 | 1400 | 0 | 1400 | {unit} | Synthetic. |"
PRINCIPAL_ROW_NO_RATE = (
    "| FY2024 | Not supplied: not calculable, the Dollar notes have neither a stated {code} amount "
    "nor a stated rate | Not supplied: synthetic | 1400 | {unit} | Synthetic. |"
)
FINANCIALS = (
    "### Financials and credit metrics\n\n| Metric | Unit | FY2023 | FY2024 |\n"
    "| --- | --- | --- | --- |\n"
    "| Total liquidity at period end | {unit} | 1100 | 1250 |\n"
    "| Free cash flow (operating cash flow less capex), twelve months | {unit} | 80 | 95.5 |\n"
    "| Net debt at period end | {unit} | 1200 | 1125 |\n"
)
STUB = "### Financials and credit metrics\n\n| Item | Value |\n| --- | --- |\n| Observed | 1 |\n"
# CP-2G's forecast: base debt 1,400 (the sum above); the {code} term loan alone is a facility, so
# the other 700 stays in the remainder at the `interest_rate` driver.
FACILITY = {
    "name": "{code} term loan",
    "balance": "700",
    "fixed_rate_pct": "6.00",
    "spread_pct": None,
    "floor_pct": None,
    "reference_rate": None,
    "annual_amortisation": None,
    "maturity": "2030-06-30",
}


def in_currency(text: str, code: str) -> str:
    """The retained USD answer with only its currency and unit changed."""
    return (
        text.replace("US$m", f"{code}m")
        .replace("USD millions", f"{code} millions")
        .replace("| USD |", f"| {code} |")
        .replace("USD 1,250 million", f"{code} 1,250 million")
    )


def once(text: str, old: str, new: str) -> str:
    assert text.count(old) == 1, (old, text.count(old))
    return text.replace(old, new)


def cp1_answer(text: str, code: str, *, rate_stated: bool) -> str:
    """CP-1's retained answer with the synthetic statements, instruments and totals added."""
    unit = f"{code}m"
    usd_row = USD_ROW_RATE if rate_stated else USD_ROW_NO_RATE
    rows = "\n".join(row.format(code=code) for row in (OWN_ROW, EUR_ROW, usd_row))
    t418 = f"### T4.18 Debt instruments\n\n{T418_HEAD}\n{'| --- ' * 19}|\n{rows}\n\n"
    text = once(text, STUB, FINANCIALS.format(unit=unit))
    text = once(text, "| debt | 600 |", "| debt | 1400 |")
    # The maturity schedule must add to the principal (the launcher's tie): 500 + 150 + 750 = 1,400.
    old = f"| FY2027 | Not supplied: the schedule stops here | {unit} | Synthetic. |"
    text = once(text, old, f"| FY2027 | 150 | {unit} | Synthetic. |")
    text = once(
        text, f"| FY2028 | 1,250 | {unit} | Synthetic. |", f"| FY2028 | 750 | {unit} | Synthetic. |"
    )
    principal = PRINCIPAL_ROW if rate_stated else PRINCIPAL_ROW_NO_RATE
    old = f"| FY2024 | {launched.GAP} | {launched.GAP} | 1400 | {unit} | Synthetic. |"
    text = once(text, old, principal.format(unit=unit, code=code))
    return once(text, "## Calculations", f"{t418}## Calculations")


def forecast_block(code: str) -> str:
    base = {
        k: {"amount": v, "reason": None, "row": k, "period": "FY2025"}
        for k, v in launched.BASE.items()
    }
    base["debt"] = {"amount": "1400", "reason": None, "row": "debt", "period": "FY2025"}
    facility = {k: v.format(code=code) if isinstance(v, str) else v for k, v in FACILITY.items()}
    return launched.forecast_block(
        currency=code, scale=1, base=base, years=launched.AFTER_FY2025, facilities=[facility]
    )


class Built:
    """One launched run: its folders, what the launcher printed and the pages read from the
    connected React report."""

    def __init__(self, out: Path, workspace: Path, printed: tuple[str, str]):
        self.out, self.workspace = out, workspace
        self.stdout, self.stderr = printed
        (receipt,) = (out / "deliveries").glob("*/delivery.json")
        self.delivery = receipt.parent
        self.pages: dict[str, str] = {}

    def delivered(self, name: str) -> str:
        return (self.delivery / name).read_text(encoding="utf-8")

    def data(self) -> dict:
        text = (self.workspace / "library/data.js").read_text(encoding="utf-8")
        return json.loads(text.removeprefix("window.CREDIT_OS_DATA=").rstrip().removesuffix(";"))


def plain(dom: str) -> str:
    """A page's visible text."""
    stripped = re.sub(r"(?s)<(script|style)\b.*?</\1>|<[^>]+>", " ", dom)
    return " ".join(html.unescape(stripped).split())


def react_pages(workspace: Path, trace: str) -> dict[str, str]:
    """The report pages of the connected library, read from a read-only service over the run."""
    with TemporaryDirectory(dir=None if os.name == "nt" else "/tmp") as name:  # a short root
        return _react_pages(workspace, Path(name), trace)


def _react_pages(workspace: Path, service: Path, trace: str) -> dict[str, str]:
    dist = ROOT / "web/dist"
    assert (dist / "connected.html").is_file(), "build the pages first: npm --prefix web run build"
    engine = service / "_engine"
    engine.mkdir()
    shutil.copytree(workspace / "runs", engine / "runs", symlinks=True)
    shutil.copytree(workspace / "library", engine / "library", symlinks=True)
    routes = {
        "Overview": "#overview",
        "Changes": "#changes",
        "Modules": "#modules",
        "Forecast": "#forecast",
        "Evidence": "#evidence",
        "Trace": f"#evidence/{trace}",
        **{code: f"#modules/{code}" for code in ("CP-1", "CP-2D", "CP-3C", "CP-4C", "CP-2G")},
        # The module's statements and registers sit behind its records disclosure; the address
        # opens it, so the debt-principal table is read where a reader finds it.
        "CP-1 records": "#modules/CP-1/records",
        "CP-1 principal": "#modules/CP-1/records/Debt%20principal%20to%20carrying%20value",
    }
    with make_server(service, web=dist, read_only=True) as server:
        worker = threading.Thread(target=server.serve_forever)
        worker.start()
        try:
            record = inbox_runs.Record(
                id=RUN,
                pathway="deep_credit_assessment",
                folder=RUN,
                status="finished",
                claimed_at="",
            )
            inbox_runs.save(server.scheduler.layout, record)
            base = f"http://127.0.0.1:{server.server_address[1]}/report/{RUN}"
            binary = chrome()

            def dump(route: str) -> str:
                done = subprocess.run(
                    [
                        binary,
                        "--headless=new",
                        "--disable-gpu",
                        "--window-size=1280,900",
                        "--virtual-time-budget=15000",
                        "--dump-dom",
                        base + route,
                    ],
                    capture_output=True,
                    text=True,
                    timeout=120,
                    check=True,
                )
                return plain(done.stdout)

            with ThreadPoolExecutor(max_workers=4) as pool:
                return dict(zip(routes, pool.map(dump, routes.values()), strict=True))
        finally:
            server.shutdown()
            worker.join()


_BUILT: dict[tuple[str, bool], Built] = {}


def build(code: str, rate_stated: bool, provider_fixture, tmp_path_factory, capsys) -> Built:
    """Launch the deep pathway on the canned answers in `code` once per variant; read its pages."""
    key = (code, rate_stated)
    if key in _BUILT:
        return _BUILT[key]
    tmp_path = tmp_path_factory.mktemp(f"{code}-{'rate' if rate_stated else 'norate'}")
    argv = launched.launch(
        tmp_path, "--live", "--ruling", str(launched.RULING), pathway="deep_credit_assessment"
    )
    argv[argv.index("--out") + 1] = str(tmp_path / "runs" / RUN)
    filing = (FILING if rate_stated else FILING_NO_RATE).format(code=code)
    (tmp_path / "issuer/annual.txt").write_text(filing, encoding="utf-8")
    routes = launched.prepare_routes(tmp_path, "sol-medium", None)
    block = forecast_block(code)

    def answer(context: dict) -> str:
        text = in_currency(launched.forecast_answer(context, routes, block), code)
        if context["module_id"] == "CP-1":
            text = cp1_answer(text, code, rate_stated=rate_stated)
        return text

    provider_fixture.answer = answer
    assert launched.main(argv) == 0
    seen = capsys.readouterr()
    built = Built(tmp_path / "runs" / RUN, tmp_path, (seen.out, seen.err))
    cp1 = built.delivery / "CP-1.md"
    lines = cp1.read_text(encoding="utf-8").splitlines()
    line = next(n for n, text in enumerate(lines, 1) if text.startswith("| Dollar notes |"))
    sha = hashlib.sha256(cp1.read_bytes()).hexdigest()
    trace = f"{RUN}%2Fdeliveries%2F{built.delivery.name}%2FCP-1.md~{sha}-{line}"
    built.pages = react_pages(tmp_path, trace)
    _BUILT[key] = built
    return built


@pytest.fixture
def gbp(provider, tmp_path_factory, capsys) -> Built:
    return build("GBP", True, provider, tmp_path_factory, capsys)


@pytest.fixture
def chf(provider, tmp_path_factory, capsys) -> Built:
    return build("CHF", True, provider, tmp_path_factory, capsys)


@pytest.fixture
def gbp_no_rate(provider, tmp_path_factory, capsys) -> Built:
    return build("GBP", False, provider, tmp_path_factory, capsys)


# What the pages must show, each worked by hand from the synthetic text above. The redesigned pages
# write money with the ISO code (`GBP 2,250m`, `CHF 2,250m`) or state the unit once beside a table
# (`Unit: GBPm`); none may show a dollar sign.
SHOWN = {
    "GBP": {
        "overview": (
            "Revenue GBP 2,250m Better FY2024 Synthetic. from GBP 2,100m in FY2023 (+GBP 150m)",
            "Cash GBP 275m FY2024 Synthetic. from GBP 300m in FY2023 (-GBP 25m)",
        ),
        "net debt": "Earnings against debt and leverage · GBPm",
        "records": "Unit: GBPm Metric FY2023 FY2024 Sources "
        "Total liquidity at period end 1100 1250 "
        "Free cash flow (operating cash flow less capex), twelve months 80 95.5 "
        "Net debt at period end 1200 1125",
        "principal": "Reporting unit: GBPm Period Contractual principal Reconciling items "
        "Carrying value Basis and limitation Sources FY2024 1400 0 1400",
        "unit": "GBP millions",
        "forecast unit": "GBPm",
    },
    "CHF": {
        "overview": (
            "Revenue CHF 2,250m Better FY2024 Synthetic. from CHF 2,100m in FY2023 (+CHF 150m)",
            "Cash CHF 275m FY2024 Synthetic. from CHF 300m in FY2023 (-CHF 25m)",
        ),
        "net debt": "Earnings against debt and leverage · CHFm",
        "records": "Unit: CHFm Metric FY2023 FY2024 Sources "
        "Total liquidity at period end 1100 1250 "
        "Free cash flow (operating cash flow less capex), twelve months 80 95.5 "
        "Net debt at period end 1200 1125",
        "principal": "Reporting unit: CHFm Period Contractual principal Reconciling items "
        "Carrying value Basis and limitation Sources FY2024 1400 0 1400",
        "unit": "CHF millions",
        "forecast unit": "CHFm",
    },
}
# The Financial foundation figure that carries net debt, in every currency: net, cash, gross debt.
NET_DEBT = "FY2024 Net 1,125 · cash 275 · gross debt 1,400"
# The forecast the model's inputs state, worked by hand (revenue 1,000 growing 5%, 4%, 3%; margin
# 30%, 31%, 32%; interest 700 x 6% on the term loan plus 700 x 6% on the remainder = 84 a year;
# taxes and working capital 10% and capex 4% of revenue; distributions 20; no scheduled repayment).
FORECAST_ROWS = (  # the grid opens on totals and the rows charted above; interest is under All rows
    "Model cash from operations 126 145 163",
    "Cash proxy (not issuer free cash flow) 84 102 118",
    "Closing cash 164 246 344",
    "Closing debt 1,400 1,400 1,400",
    "Accessible liquidity 214 296 394",
)
OWNER_ROWS = {  # each module's money tables, as the canned answers write them
    "CP-2D.md": (
        "| Opening accessible liquidity | 900 | {unit} |",
        "| Closing accessible liquidity | 570 | {unit} |",
    ),
    "CP-3C.md": (
        "| FY2026 | 500 | 300 | {unit} |",
        "| FY2027 | 1,250 | Not supplied: no commitment",
    ),
    "CP-4C.md": (
        "| Enterprise value | 2,000 | {unit} |",
        "| Value not distributed | 700 | {unit} |",
    ),
}
OWNER_PAGES = {  # each lead's figure, as written; the unit is checked beside it
    "CP-2D": "Opening accessible liquidity 900 Free cash flow 120 Debt repayment -450 "
    "Closing accessible liquidity 570",
    "CP-3C": "FY2026 500 300 FY2027 1,250 Committed resources, FY2027 Not supplied "
    "No commitment is stated",
    "CP-4C": "Enterprise value 2,000 Restructuring costs -100 Senior secured distribution -1,080 "
    "Unsecured distribution -120 Value not distributed 700",
}


def run_in(code: str, built: Built) -> None:
    """The synthetic run of `code` reaches delivery and both libraries in `code`."""
    unit, shown = f"{code}m", SHOWN[code]
    assert not any(word in built.stderr for word in ("urrency", "chart", "Library not updated"))
    data = built.data()
    assert data["activity"]["issues"] == [] and data["catalogue"]["issues"] == []
    (record,) = data["catalogue"]["real"]
    assert record["currency"] == code and record["metrics"]["cash"]["unit"] == unit
    completed = json.loads(next(built.out.glob("completed-*.json")).read_text())
    assert completed["cp_forecast_published"] is True and completed["forecast_failure"] is None
    for name, rows in OWNER_ROWS.items():  # CP-2D, CP-3C and CP-4C write their tables in `unit`
        text = built.delivered(name)
        assert all(row.format(unit=unit) in text for row in rows), name
        assert "US$m" not in text
    cp1 = built.delivered("CP-1.md")  # the filing's EUR facility and the converted USD one
    assert "| EUR | 600 | Not applicable |" in cp1
    assert f"| USD | 100 | 0.80 {code}/USD |" in cp1  # 125 x 0.80, the rate the filing states
    exact = json.loads(built.delivered("forecast_exact.json"))
    assert exact["units"] == shown["unit"]
    (loan,) = exact["facility_schedule"]  # the EUR and USD facilities are in the remainder
    assert loan["name"] == f"{code} term loan"
    assert Decimal(loan["years"][0]["interest"]) == Decimal(42)
    assert Decimal(exact["unallocated_debt"]["amount"]) == Decimal(700)
    years = {case: exact["outputs"][case]["years"] for case in ("REFERENCE", "DOWNSIDE")}
    assert [Decimal(y["interest"]["amount"]) for y in years["REFERENCE"]] == [Decimal(84)] * 3
    # The downside case is EBITDA x 0.8 and interest x 1.1 on the same paths: cash proxy
    # 252 - 92.4 - 105 - 42 = 12.6 in FY2026E, then 25.536 and 38.07216.
    assert [Decimal(y["fcf"]["amount"]) for y in years["DOWNSIDE"]] == [
        Decimal("12.6"),
        Decimal("25.536"),
        Decimal("38.07216"),
    ]
    pages = built.pages
    assert all(figure in pages["Overview"] for figure in shown["overview"])
    for name in ("Modules", "CP-1"):
        assert shown["net debt"] in pages[name] and NET_DEBT in pages[name], name
    assert shown["records"] in pages["CP-1 records"]
    assert shown["principal"] in pages["CP-1 principal"]
    for module, text in OWNER_PAGES.items():
        assert text in pages[module] and unit in pages[module], module
    assert shown["unit"] in pages["Forecast"]
    assert all(row in pages["Forecast"] for row in FORECAST_ROWS)
    assert f"Cash proxy, Base case · {shown['forecast unit']} 118 FY2028E" in pages["Forecast"]
    # Net leverage at FY2028E as drawn: base (1,400 - 344) / 359.92 = 2.93x; downside, closing
    # cash 116.21 after three years of 20 distributions, (1,400 - 116.21) / 287.94 = 4.46x.
    assert "2.93x A" in pages["Forecast"] and "4.46x B" in pages["Forecast"]
    names = ("Overview", "Modules", "Forecast", "CP-1", "CP-1 records", "CP-1 principal")
    for name in (*names, "CP-2D", "CP-3C", "CP-4C"):
        assert "US$" not in pages[name] and "$" not in pages[name].replace("US$", ""), name


@pytest.mark.browser
def test_p1_a_gbp_run_is_delivered_and_shown_in_pounds(gbp):
    run_in("GBP", gbp)


@pytest.mark.browser
def test_p2_a_chf_run_is_delivered_and_shown_in_francs(chf):
    run_in("CHF", chf)


@pytest.mark.browser
def test_p3_delivery_and_the_library_carry_and_draw_the_not_calculable_total_the_fixture_writes(
    gbp_no_rate, gbp
):
    reason = (
        "Not supplied: not calculable, the Dollar notes have neither a stated GBP amount nor a "
        "stated rate"
    )
    cells = f"| FY2024 | {reason} | Not supplied: synthetic | 1400 | GBPm | Synthetic. |"
    row = (
        "| USD | Not supplied: the filing states no GBP amount and the sources state no rate "
        "| Not supplied: no rate is stated |"
    )
    delivered = gbp_no_rate.delivered("CP-1.md")
    assert cells in delivered and row in delivered
    page = gbp_no_rate.pages["CP-1 principal"]
    assert (
        f"Reporting unit: GBPm Period Contractual principal Reconciling items Carrying value "
        f"Basis and limitation Sources FY2024 {reason} Not supplied: synthetic 1400" in page
    )
    # Neither a zero nor a partial total (700 + 600 = 1,300, or 700 or 600 alone) stands in.
    files = [p.read_text(encoding="utf-8") for p in gbp_no_rate.delivery.glob("*") if p.is_file()]
    assert not any(re.search(r"\b1,?300\b", text) for text in files)
    partial = r"(?:£\s?|GBP )(?:0|1,300|700|600)m\b"
    assert not any(re.search(partial, t) for t in gbp_no_rate.pages.values())
    # The pages print bare figures too; a bare 1,300 is the partial total whatever its unit.
    assert not any(re.search(r"\b1,?300\b", t) for t in gbp_no_rate.pages.values())
    assert SHOWN["GBP"]["principal"] in gbp.pages["CP-1 principal"]  # with the rate: calculated


@pytest.mark.browser
def test_p4_the_rate_locator_is_drawn_only_on_evidence(gbp):
    assert RATE_LOCATOR in gbp.pages["Trace"] and "0.80 GBP/USD" in gbp.pages["Trace"]
    for name, text in gbp.pages.items():
        if name != "Trace":
            assert RATE_LOCATOR not in text and "p.97" not in text, name


# The only `US$` or `USD` a GBP or CHF run may carry (P6), each with its reason. The spend and the
# cap are the cost of the run, not the issuer's currency; the other two are the Dollar notes' own
# cells in T4.18 as the filing states them (its `Currency` and its `FX Rate`).
ALLOWED = (
    (r"Provider cap USD 15", "the cap text (the spend and the cap stay in USD)"),
    (r"0\.80 (?:GBP|CHF)/USD", "the Dollar notes' `FX Rate` cell"),
    (r"(?<=\| )USD(?= \| 100 \|)", "the Dollar notes' `Currency` cell (table text)"),
    (r'(?<=")USD(?=", "100", )', "its `Currency` cell (library data)"),
    (r"(?<=Senior )USD(?= 100 )", "the Dollar notes' `Currency` cell (page text)"),
    (
        r"(?<=Currency — )USD(?= Reporting Currency Amount — 100)",
        "its `Currency` cell (the Evidence trace's field list)",
    ),
    (r'(?<="field": "c7",\n {10}"amount": null,\n {10}"text": ")USD', "its `Currency` cell (view)"),
    # `chart_unit` is the money class's tag in the delivery request (`HandoffRoute.chart_unit`,
    # "x" | "US$m" | "%"), the same for every run whatever its currency. It is a scale and
    # decimals class, not a unit: no displayed value reads it. Renaming it is parked (final review
    # of PR 2, 2026-11-16; the strict xfail that stood here could never pass).
    (r'(?<="chart_unit": ")US\$m(?=")', "the request's money class tag (scale and decimals)"),
)


def without_allowed(text: str) -> str:
    """The text with the allowed hits taken out."""
    for pattern, _ in ALLOWED:
        text = re.sub(pattern, "", text)
    return text


def us_dollar_hits(built: Built) -> list[str]:
    """Every delivered or library text of the run that still names `US$` or `USD` once the two
    allowed cells are out: the delivered files, the library's run data (not its design catalogue,
    `workspace.visuals`, which is the same for every run) and every page read."""
    texts = {f"delivered {p.name}": p.read_text("utf-8") for p in built.delivery.glob("*")}
    texts.update(
        {f"request {p.name}": p.read_text("utf-8") for p in built.out.glob("delivery-*.json")}
    )
    data = built.data()
    del data["workspace"]["visuals"]
    texts["library data.js"] = json.dumps(data, ensure_ascii=False)
    texts.update({f"connected page {name}": text for name, text in built.pages.items()})
    return [
        f"{name}: ...{text[max(0, m.start() - 60) : m.end() + 40]}..."
        for name, raw in texts.items()
        for text in (without_allowed(raw),)
        for m in re.finditer(r"US\$|USD", text)
    ]


@pytest.mark.browser
def test_p6_the_gbp_and_chf_runs_show_no_us_dollar_beyond_the_allowed_cells(gbp, chf):
    assert us_dollar_hits(gbp) == []
    assert us_dollar_hits(chf) == []
    # The printed output keeps USD only for the run's cost: the cap and the charge.
    for built in (gbp, chf):
        spend = [line for line in built.stdout.splitlines() if "USD" in line or "US$" in line]
        assert [line.split(":")[0] for line in spend] == ["Cap", "Charged"]
