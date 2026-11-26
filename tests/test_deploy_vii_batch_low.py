"""S11 Low batch: CP-1A claim limitation spelled (1-2), currency-prefixed year (1-3), CP-3 talk
sentence after an abbreviation (4-3). Keys are written by hand from the probes' answer keys."""

import hashlib
from datetime import date
from decimal import Decimal

import pytest

from deploy_vii import business_context as bc
from deploy_vii import prose
from deploy_vii.business_context import Quote
from deploy_vii.contracts import Citation, Fact, Run, Source, Span
from deploy_vii.cp3_relative_value import MarketEvidence, _market_row
from deploy_vii.preparation import PreparedPack

_SHA = "a" * 64
_TEXT = "Acme sells widgets in Germany. Acme is a manufacturing company. Revenue was strong."


def _quote(text: str) -> bc.Quote:
    return bc.Quote(source_id="annual", locator="p1", quote=text)


def _company(aspect: str, text: str, span: str) -> bc.CompanyFact:
    return bc.CompanyFact(
        aspect=aspect,  # type: ignore[arg-type]
        text=text,
        category="Documentary Fact",
        citations=(_quote(span),),
        limitation=None,
    )


def test_claim_limitation_spells_the_figure_reference() -> None:
    run = Run(
        run_id="r1",
        issuer_id="acme",
        issuer_name="Acme",
        as_of=date(2026, 6, 30),
        case_kind="synthetic",
    )
    source = Source(
        source_id="annual",
        name="Annual report",
        status="ready",
        sha256=_SHA,
        spans=(Span(locator="p1", text=_TEXT),),
    )
    pack = PreparedPack(run=run, sources=(source,))
    cite = Citation(
        source_id="annual", source_sha256=_SHA, locator="p1", quote="Revenue was strong"
    )
    rev = Fact(
        fact_id="rev",
        label="Revenue",
        amount=Decimal(1234),
        unit="MILLIONS",
        currency="USD",
        scale=Decimal(1000000),
        period="FY2025",
        citations=(cite,),
    )
    submission = bc.BusinessContextSubmission(
        sources=(
            bc.SourceUse(
                source_id="annual",
                source_class="issuer",
                quality="High",
                period="FY2025",
                entity_covered="Acme",
                data_supplied="Annual report",
                use="Primary",
                citations=(_quote("Acme sells widgets"),),
                limitation=None,
            ),
        ),
        company=(
            _company("business_description", "Sells widgets", "Acme sells widgets"),
            _company("country", "Germany", "in Germany"),
            _company("sector", "Manufacturing", "manufacturing company"),
        ),
        business_lines=(),
        owners=(),
        operating_drivers=(),
        transactions=(),
        events=(),
        governance_and_sponsor=(),
        capital_allocation=(),
        acquisitions=(),
        disclosure_items=(),
        credit_translations=(
            bc.CreditTranslation(
                theme="Revenue Durability",
                evidence="Revenue was strong",
                risk_mechanic="Demand cyclicality",
                credit_implication="Supports servicing",
                confidence="Medium",
                countervailing_conflict_ids=(),
                citations=(_quote("Revenue was strong"),),
                limitation="Revenue of {rev|US$ m} is a single year only",
            ),
        ),
        conflicts=(),
        gaps=(),
        consumers=tuple(
            bc.Consumer(
                module_id=module_id,
                status="READY",
                handoff_item="Context",
                why_it_matters="Needed",
                gap="None",
                required_action="None",
                citations=(),
                flag_topics=(),
            )
            for module_id in bc.cp1a_consumers(pack)
        ),
    )
    assert not bc.validate_business_context(pack, submission, (rev,))
    report = bc.business_context(pack, submission, (rev,))
    claim = next(c for c in report.claims if c.claim_id == "credit_translation.r01")
    assert claim.limitation == "Revenue of 1,234 US$ m is a single year only"


@pytest.mark.parametrize(
    "text",
    [
        "Cash was $2000.",
        "A fee of €2024 applies.",
        "Costs were £1999 in total.",
        "Cash was US$2000 at year end",
    ],
)
def test_currency_prefixed_year_is_a_bare_figure(text: str) -> None:
    assert prose.check(text, refs=(), gaps=())


def test_a_bare_year_label_is_still_allowed() -> None:
    assert not prose.check("Revenue fell in 2024.", refs=(), gaps=())


_TALK = "an observed row quotes a sentence of indicative talk"


def _observed_issues(span: str, quote: str) -> list[str]:
    digest = hashlib.sha256(span.encode()).hexdigest()
    source = Source(
        source_id="MKT",
        name="Dealer run",
        status="ready",
        sha256=digest,
        spans=(Span(locator="p1", text=span),),
        extraction_status="complete",
    )
    run = Run(
        run_id="r1",
        issuer_id="i1",
        issuer_name="Issuer",
        as_of=date(2025, 12, 31),
        case_kind="synthetic",
    )
    row = MarketEvidence(
        source_id="MKT",
        kind="observed",
        quote=Quote(source_id="MKT", locator="p1", quote=quote),
        as_of="December 15, 2025",
        limitation=None,
    )
    pack = PreparedPack(run=run, sources=(source,))
    return _market_row("market_evidence[0]", row, frozenset({"MKT"}), {"MKT": digest}, pack)[0]


@pytest.mark.parametrize(
    ("span", "quote"),
    [
        (
            "Price talk on the U.S. dollar tranche is 7.25% area as of December 15, 2025.",
            "dollar tranche is 7.25% area",
        ),
        (
            (
                "Initial price thoughts for the new 2030 notes are approx. 450 bps over "
                "Treasuries as of December 15, 2025."
            ),
            "450 bps over Treasuries",
        ),
        ("Dealer guidance on December 15, 2025: the 2030 notes c. 98.50 bid.", "98.50 bid"),
    ],
)
def test_talk_sentence_is_not_cut_at_an_abbreviation(span: str, quote: str) -> None:
    assert any(_TALK in issue for issue in _observed_issues(span, quote))


def test_talk_sentence_still_ends_at_a_full_stop() -> None:
    span = "Price talk is 7.25% area. The 2030 notes traded at 98.50 bid on December 15, 2025."
    assert not any(_TALK in i for i in _observed_issues(span, "98.50 bid"))
