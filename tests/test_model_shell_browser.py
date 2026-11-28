"""The standalone HTML file rendered by `deploy_vii.render` names modules, not module codes, in its
own navigation and headings (owner ruling 2026-11-12), read in real headless Chrome.

The probe is appended to the rendered file as an inline script (the file's policy allows inline
scripts and nothing else), walks every route the navigator and the rail reach, and writes what it
read to a `<pre id="probe">`. Body content (claims, tables, limitation text) is not scanned."""

import hashlib
import html
import json
import re
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest
from browser_helper import visit

from deploy_vii.contracts import (
    Citation,
    Fact,
    ModuleView,
    ReportTable,
    Run,
    TableColumn,
    TableRow,
    View,
)
from deploy_vii.bindings.shipped import SHIPPED_MAPS
from deploy_vii.render import empty_view, render
from deploy_vii.report_view import _ChartPoint, _refs_by_fact, build, build_index, pathways
from deploy_workflow import markdown_delivery, model_handoff_delivery

pytestmark = pytest.mark.browser

# Hand-written answer key: titles the fixture gives and the words the page owes for them.
MODEL = "Synthetic data foundation"
LIQUIDITY = "Synthetic liquidity bridge"
OUTSIDE = "Synthetic outside module"
UNNAMED = "Unnamed module"  # CP-3 is given its own code as its title
LIMIT_TEXT = "Synthetic liquidity limitation."

PROBE = r"""(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const code = /\bCP-[A-Z0-9]+\b/;
  const out = {hits: [], routes: {}, filter: null, field: null, nav: [], outside: []};
  const attrs = el => [el.getAttribute("title") || "", el.getAttribute("aria-label") || ""];
  const scan = (where, root) => {
    const values = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    if (root.nodeType === 1) values.push(...attrs(root));
    while (walker.nextNode()) {
      const n = walker.currentNode;
      values.push(...(n.nodeType === 3 ? [n.data] : attrs(n)));
    }
    values.filter(v => code.test(v)).forEach(v => out.hits.push(where + ": " + v.slice(0, 80)));
  };
  for (let i = 0; i < 100 && !document.querySelector("#module-list a"); i++) await sleep(50);
  const links = [...document.querySelectorAll("#module-list a, #nav-foot a, [data-dest]")];
  const hashes = [...new Set(links.map(a => a.getAttribute("href")))];
  const rowOf = a => ({href: a.getAttribute("href"), text: a.textContent.trim()});
  out.nav = [...document.querySelectorAll("#module-list a")].map(rowOf);
  out.outside = [...document.querySelectorAll("#nav-foot a")].map(rowOf);
  for (const hash of hashes) {
    location.hash = hash; await sleep(60);
    const where = hash;
    const rec = {h1: document.querySelector("#view-root h1").textContent};
    scan(where + " navigator", document.getElementById("navigator"));
    scan(where + " rail", document.getElementById("rail"));
    scan(where + " h1", document.querySelector("#view-root h1"));
    const titles = [...document.querySelectorAll("#view-root section.block > header h2")];
    rec.panels = titles.map(h => h.textContent);
    titles.forEach(h => scan(where + " panel title", h));
    const table = [...document.querySelectorAll("#view-root table")]
      .find(t => t.querySelector("caption").textContent === "Current report coverage");
    if (table) {
      scan(where + " coverage", table);
      rec.coverageHead = [...table.querySelectorAll("th")].map(c => c.textContent);
      rec.coverage = [...table.querySelectorAll("tbody tr")].map(tr => ({
        cells: [...tr.children].map(c => c.textContent),
        href: (tr.querySelector("a") || {getAttribute: () => null}).getAttribute("href")}));
    }
    const fact = document.querySelector("#view-root .fact-value");
    if (fact) {
      fact.click(); await sleep(60);
      const dts = [...document.querySelectorAll("#inspector-content dt")];
      const field = dts.find(dt => dt.textContent === "Field");
      if (field) {
        const value = field.nextElementSibling;
        out.field = value.textContent; scan(where + " field", value);
      }
    }
    out.routes[hash] = rec;
  }
  location.hash = "#front"; await sleep(60);
  const input = document.getElementById("module-filter");
  input.value = "cp-2d"; input.dispatchEvent(new Event("input")); await sleep(60);
  out.filter = [...document.querySelectorAll("#module-list a")].map(rowOf);
  const pre = document.createElement("pre"); pre.id = "probe";
  pre.textContent = JSON.stringify(out);
  document.body.append(pre);
})();"""


def fixture_view() -> View:
    run = Run(
        run_id="shell-test",
        issuer_id="SYN",
        issuer_name="Synthetic Issuer",
        as_of=date(2024, 9, 30),
        case_kind="synthetic",
        pathway="credit_snapshot",
        requested_modules=("CP-1", "CP-2D", "CP-3"),
    )
    base = empty_view(run)
    sha = hashlib.sha256(b"synthetic").hexdigest()
    fact = Fact(
        fact_id="f1",
        label="Synthetic revenue",
        table_id="T4.4",
        row_id="revenue",
        field="value",
        amount=Decimal(1200),
        unit="US$m",
        period="FY2024",
        citations=(
            Citation(source_id="S1", source_sha256=sha, locator="p.1", quote="Synthetic quote."),
        ),
    )
    table = ReportTable(
        table_id="T4.4",
        title="Synthetic revenue",
        columns=(TableColumn(field="value", label="Value"),),
        rows=(TableRow(row_id="revenue", label="Total", fact_ids=("f1",)),),
        row_header="Measure",
    )
    changes: dict[str, dict[str, object]] = {
        "CP-1": {
            "title": MODEL,
            "status": "candidate",
            "artifact_sha256": sha,
            "facts": (fact,),
            "tables": (table,),
        },
        "CP-2D": {"title": LIQUIDITY, "status": "restricted", "limitations": (LIMIT_TEXT,)},
        "CP-1B": {"title": OUTSIDE},
        "CP-3": {"title": "CP-3"},
    }
    modules = tuple(
        ModuleView.model_validate(item.model_dump() | changes.get(item.module_id, {}))
        for item in base.modules
    )
    return base.model_copy(update={"modules": modules})


@pytest.fixture(scope="module")
def seen(tmp_path_factory) -> dict:
    page: Path = tmp_path_factory.mktemp("shell") / "model.html"
    text = render(fixture_view())
    assert "</body>" in text
    page.write_text(text.replace("</body>", f"<script>{PROBE}</script></body>"), encoding="utf-8")
    dom, console = visit(page)
    assert console == []  # No script error and no policy violation.
    return json.loads(html.unescape(re.search(r'<pre id="probe">(.*?)</pre>', dom, re.DOTALL)[1]))


def test_no_module_code_in_the_shells_own_navigation_and_headings(seen):
    assert seen["hits"] == []
    assert len(seen["routes"]) > 10  # Every navigator row, the outside list and the rail.


def test_navigator_rows_name_the_module_and_keep_the_code_in_the_link(seen):
    rows = {row["href"]: row["text"] for row in seen["nav"] + seen["outside"]}
    assert MODEL in rows["#CP-1"] and LIQUIDITY in rows["#CP-2D"]
    assert UNNAMED in rows["#CP-3"] and OUTSIDE in rows["#CP-1B"]
    assert all(href.startswith("#CP-") for href in rows if href != "#front")


def test_page_heading_is_the_module_title(seen):
    heads = {route: item["h1"] for route, item in seen["routes"].items()}
    assert heads["#CP-1"] == MODEL and heads["#CP-2D"] == LIQUIDITY
    assert heads["#CP-3"] == UNNAMED and heads["#CP-1B"] == OUTSIDE


def test_coverage_table_is_module_and_status_with_the_title_as_the_link(seen):
    analysis = seen["routes"]["#analysis"]
    assert analysis["coverageHead"] == ["Module", "Status"]
    by_href = {row["href"]: row["cells"] for row in analysis["coverage"]}
    assert by_href["#CP-1"][0] == MODEL and by_href["#CP-2D"][0] == LIQUIDITY
    assert by_href["#CP-3"][0] == UNNAMED and by_href["#CP-1B"][0] == OUTSIDE
    assert all(len(cells) == 2 for cells in by_href.values())


def test_limitation_panel_is_titled_with_the_module(seen):
    assert LIQUIDITY in seen["routes"]["#limitations"]["panels"]


def test_inspector_field_row_names_the_module_title(seen):
    assert seen["field"] == f"{MODEL} / T4.4 / revenue / value"


def test_typing_a_code_into_the_filter_still_finds_the_module(seen):
    assert [row["href"] for row in seen["filter"]] == ["#CP-2D"]


# --- what a figure says under its chart (chart periods, review item 2) ---------------------------
# The shell draws a figure's `summary` only beside a table; a figure placed above states what the
# reader must know in its table twin's note. Synthetic figures from the two delivery builders,
# drawn by the real shell: the probe reads each figure's X labels and the sentences shown.
FIGURE_PROBE = r"""(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 100 && !document.querySelector("figure.chart-figure"); i++) await sleep(50);
  const out = {};
  document.querySelectorAll("figure.chart-figure").forEach(figure => {
    const said = [...figure.querySelectorAll("p.fig-summary")];
    out[figure.dataset.figId] = {
      said: said.map(p => p.textContent),
      shown: said.map(p => p.getClientRects().length > 0 && p.getBoundingClientRect().height > 0),
      marks: [...new Set([...figure.querySelectorAll(".chart-twin tbody th")]
        .map(th => th.textContent.split(" · ")[1]))],
    };
  });
  const pre = document.createElement("pre"); pre.id = "probe";
  pre.textContent = JSON.stringify(out);
  document.body.append(pre);
})();"""
LEVERAGE = (("FY2024", "2.80"), ("Run-rate", "2.50"), ("FY2023", "3.75"))
COVER = (("FY2024", "4.10"), ("FY2023", "3.60"))
MODEL_PERIODS = ("FY2024", "FY2023")
MODEL_KEYS = (
    "operating_ebitda",
    "issuer_ordinary_ebitda",
    "issuer_as_defined",
    "cfo",
    "cfo_less_capex",
    "opex_magnitude",
)


def figure_facts(citations: tuple[Citation, ...]) -> tuple[Fact, ...]:
    ratios = tuple(
        Fact(
            fact_id=f"{name}.{period}",
            label=name,
            table_id=name,
            row_id=period,
            field="value",
            amount=Decimal(amount),
            unit="MULTIPLE",
            scale=Decimal(1),
            period=period,
            citations=citations,
        )
        for name, rows in (("leverage", LEVERAGE), ("cover", COVER))
        for period, amount in rows
    )
    history = tuple(
        Fact(
            fact_id=f"history.{key}.{period}",
            label=key,
            table_id="history",
            row_id=key,
            field=period,
            amount=Decimal(100 + place),
            unit="MILLIONS",
            scale=Decimal(1000000),
            currency="USD",
            period=period,
            citations=citations,
        )
        for key in MODEL_KEYS
        for place, period in enumerate(MODEL_PERIODS)
    )
    return (*ratios, *history)


def strip(name: str, title: str, rows: tuple[tuple[str, str], ...]) -> tuple:
    """A strip figure's spec as `markdown_files` hands it to `_strip_figure`."""
    points = tuple(_ChartPoint(title, period, f"{name}.{period}") for period, _ in rows)
    return ("CP-1", title, "x", (title,), markdown_delivery._chronological(points), "multiple")


@pytest.fixture(scope="module")
def figures_seen(tmp_path_factory) -> dict:
    base = fixture_view()
    pathway = next(item for item in pathways() if item.id == base.run.pathway)
    report = build(base, pathway, SHIPPED_MAPS)
    held = next(m for m in base.modules if m.module_id == "CP-1")
    module = held.model_copy(
        update={"facts": (*held.facts, *figure_facts(held.facts[0].citations))}
    )
    view = base.model_copy(
        update={"modules": tuple(module if m is held else m for m in base.modules)}
    )
    passports, index = build_index(view)
    refs = _refs_by_fact(index)
    block = "model-chart-strip"
    figures = (
        markdown_delivery._strip_figure(
            block, module, refs, "S.1", strip("leverage", "Total debt / EBITDA", LEVERAGE)
        ),
        markdown_delivery._strip_figure(
            block, module, refs, "S.2", strip("cover", "Interest cover", COVER)
        ),
        *model_handoff_delivery._model_figures(module, refs, MODEL_PERIODS),
    )
    drawn = {"state": "populated", "kind": "chart", "figures": figures, "note": None}
    blocks = tuple(
        item.model_copy(update=drawn) if item.block_id == block else item for item in report.blocks
    )
    report = report.model_copy(update={"blocks": blocks, "passports": passports, "index": index})
    page: Path = tmp_path_factory.mktemp("figures") / "model.html"
    text = render(view, report)
    assert "</body>" in text
    page.write_text(
        text.replace("</body>", f"<script>{FIGURE_PROBE}</script></body>"), encoding="utf-8"
    )
    dom, console = visit(page)
    assert console == []
    return json.loads(html.unescape(re.search(r'<pre id="probe">(.*?)</pre>', dom, re.DOTALL)[1]))


def test_a_strip_figure_shows_the_reader_the_period_it_could_not_place(figures_seen):
    stated = (
        "Drawn last, in the order written, because no period could be read from the label: "
        "Run-rate."
    )
    assert figures_seen["S.1"] == {
        "said": [stated],
        "shown": [True],
        "marks": ["FY2023", "FY2024", "Run-rate"],
    }


def test_a_strip_figure_with_every_period_placed_says_nothing_more(figures_seen):
    assert figures_seen["S.2"] == {"said": [], "shown": [], "marks": ["FY2023", "FY2024"]}


def test_the_model_figures_show_the_reader_that_they_are_annual_only(figures_seen):
    stated = (
        "Every selected fiscal year, oldest first. This Model carries annual periods only: no "
        "year-to-date, LTM or pro forma column. Distinct definitions and missing observations "
        "retained."
    )
    for fig_id in ("M1", "M2", "M3"):
        assert figures_seen[fig_id] == {
            "said": [stated],
            "shown": [True],
            "marks": ["FY2023", "FY2024"],
        }, fig_id
