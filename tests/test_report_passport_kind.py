"""The trace drawer's passport names its kind from the citations it actually carries: a known,
non-calculated fact or a claim with no citation opens an uncited passport, never a cited one."""

import hashlib
import html
import json
import re
from datetime import date
from decimal import Decimal

import pytest
from test_library_page_browser import visit

from deploy_vii.contracts import (
    Citation,
    Claim,
    Fact,
    ModuleView,
    ReportTable,
    Run,
    TableColumn,
    TableRow,
)
from deploy_vii.render import empty_view, render

pytestmark = pytest.mark.browser

SHA = hashlib.sha256(b"passport").hexdigest()
CITATION = Citation(source_id="S1", source_sha256=SHA, locator="p.1", quote="Cited quote.")


BANNER = "TEST DATA: invented for testing, not a fact about the issuer."


def page_text(case_kind: str) -> str:
    run = Run(
        run_id="passport-test",
        issuer_id="SYN",
        issuer_name="Synthetic Issuer",
        as_of=date(2024, 9, 30),
        case_kind=case_kind,
        pathway="credit_snapshot",
        requested_modules=("CP-1",),
    )
    facts = tuple(
        Fact(
            fact_id=fact_id,
            label=label,
            table_id="T4.4",
            row_id=row,
            field="value",
            amount=Decimal(100),
            unit="US$m",
            period="FY2024",
            citations=citations,
        )
        for fact_id, row, label, citations in (
            ("f_cited", "revenue", "Cited revenue", (CITATION,)),
            ("f_bare", "ebitda", "Uncited revenue", ()),
        )
    )
    table = ReportTable(
        table_id="T4.4",
        title="Revenue",
        columns=(TableColumn(field="value", label="Value"),),
        rows=tuple(TableRow(row_id=f.row_id, label=f.label, fact_ids=(f.fact_id,)) for f in facts),
        row_header="Measure",
    )
    claims = (
        Claim(claim_id="c_cited", text="Cited claim text.", citations=(CITATION,)),
        Claim(claim_id="c_bare", text="Uncited claim text.", citations=()),
    )
    base = empty_view(run)
    modules = tuple(
        ModuleView.model_validate(
            item.model_dump()
            | (
                {
                    "title": "Synthetic module",
                    "status": "candidate",
                    "artifact_sha256": SHA,
                    "facts": facts,
                    "tables": (table,),
                    "claims": claims,
                }
                if item.module_id == "CP-1"
                else {}
            )
        )
        for item in base.modules
    )
    return render(base.model_copy(update={"modules": modules}))


PROBE = r"""(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const out = {};
  location.hash = "#CP-1"; await sleep(200);
  for (const [name, selector] of [
    ["f_cited", 'button.fact-value[data-fact-id="f_cited"]'],
    ["f_bare", 'button.fact-value[data-fact-id="f_bare"]'],
    ["c_cited", '[data-claim-id="c_cited"] button.source-button'],
    ["c_bare", '[data-claim-id="c_bare"] button.source-button']]) {
    document.querySelector(selector).click(); await sleep(100);
    const card = document.querySelector("section.passport");
    out[name] = {
      class: card.getAttribute("class"),
      heading: card.querySelector(".passport-head .caps").textContent.trim(),
      fields: card.querySelector("dl").textContent,
      banner: card.querySelector(".banner") ? card.querySelector(".banner").textContent : null,
    };
  }
  const pre = document.createElement("pre"); pre.id = "probe";
  pre.textContent = JSON.stringify(out); document.body.append(pre);
})();"""


def passports(tmp_path, case_kind: str) -> dict[str, dict[str, str]]:
    page = tmp_path / "model.html"
    text = page_text(case_kind)
    page.write_text(text.replace("</body>", f"<script>{PROBE}</script></body>"), encoding="utf-8")
    dom, console = visit(page)
    assert console == []
    return json.loads(html.unescape(re.search(r'<pre id="probe">(.*?)</pre>', dom, re.DOTALL)[1]))


def test_a_passport_is_cited_only_when_it_carries_a_citation(tmp_path):
    seen = passports(tmp_path, "public")
    assert seen["f_cited"]["class"] == "passport cited"
    assert seen["f_cited"]["heading"].lower() == "cited"
    assert "Cited quote." in seen["f_cited"]["fields"]
    assert seen["c_cited"]["class"] == "passport cited"
    assert seen["c_cited"]["heading"].lower() == "cited"
    for name in ("f_bare", "c_bare"):
        assert seen[name]["class"] == "passport uncited"
        assert seen[name]["heading"].lower() == "uncited"
        assert "No citation supplied" in seen[name]["fields"]
    for name in ("f_cited", "f_bare", "c_cited", "c_bare"):
        assert seen[name]["banner"] is None


def test_a_synthetic_run_is_synthetic_only_with_a_citation(tmp_path):
    seen = passports(tmp_path, "synthetic")
    assert seen["f_cited"]["class"] == "passport synthetic"
    assert seen["c_cited"]["class"] == "passport synthetic"
    for name in ("f_bare", "c_bare"):
        assert seen[name]["class"] == "passport uncited"
        assert seen[name]["heading"].lower() == "uncited"
    for name in ("f_cited", "f_bare", "c_cited", "c_bare"):
        assert seen[name]["banner"] == BANNER
