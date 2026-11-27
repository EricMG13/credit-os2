"""What a run is expected to do, offline, before Start.

Two parts. `guess_kind` is a conservative guess of an issuer file's document kind from its name and
first pages; a cover phrase on page 1 outranks later pages and the file name, and a page naming two
kinds, or none, is `unrecognised`. `expectations` applies a table of rules to the user's
declarations, the context and those guesses. Both inform; neither blocks a run."""

from __future__ import annotations

import re
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date
from typing import Literal, TypedDict

from deploy_vii.registry import dependencies, edge_rule
from deploy_vii.report_view import _spec_of
from deploy_workflow.context import RunContext
from deploy_workflow.portfolio_workbook import NOT_COLLECTED, PortfolioCheck, count, finding_text

KINDS = (
    "financial_report",
    "earnings_release",
    "credit_agreement",
    "indenture",
    "amendment",
    "intercreditor",
    "compliance_certificate",
    "covenant_review",
    "offering_memorandum",
    "prospectus",
    "lender_presentation",
    "information_memorandum",
    "term_sheet",
    "commitment_letter",
    "ratings",
    "market_quotes",
    "peer_data",
    "management_bridge",
    "portfolio",
    "prior_decision",
    "unrecognised",
)
# Documents that are signed or drafted; a report cannot be "executed" or "draft".
EXECUTABLE = frozenset(
    {
        "credit_agreement",
        "indenture",
        "amendment",
        "intercreditor",
        "offering_memorandum",
        "prospectus",
    }
)
UNRECOGNISED = "unrecognised"


@dataclass(frozen=True)
class Guess:
    kind: str
    signal: str  # What was found and where, for the reader; "" when unrecognised.
    executed: (
        bool | None
    )  # True: execution mark; False: draft mark; None: neither or not a deal document.
    period_end: str | None  # ISO date, financial reports only, when the cover states exactly one.


def _rx(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE)


# Words that may qualify a credit agreement or indenture title ("FIRST LIEN", "TERM LOAN", "SENIOR
# NOTES"). A qualified title must be the whole line: the title words, then at most a full stop, a
# date or "dated as of ...". The unqualified reading (`the`, `this`, `amended and restated`) is as
# before and matches the start of a line.
_QUALIFIERS = (
    r"(?:(?:the|this|first|second|third|fourth|fifth|lien|term|loan|senior|secured|unsecured|"
    r"notes|revolving|amended|and|restated) )*"
)
_TITLE_END = (
    r"(?=\s*[.,;:]?\s*(?:\(?dated as of\b.*|[a-z]{3,9} \d{1,2}, \d{4}|\d{1,2} [a-z]{3,9} \d{4})?"
    r"\s*[.,]?$)"
)
# A title line starts with the phrase, so a sentence that merely mentions a document does not count.
LINE_PHRASES: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "financial_report",
        _rx(r"(?:\d{4} )?annual report\b|form 10-[kq]\b|geschäftsbericht|konzernabschluss"),
    ),
    (
        "financial_report",
        _rx(r"(?:group )?consolidated (?:financial statements|statements? of|balance sheet)"),
    ),
    (
        "credit_agreement",
        _rx(
            r"(?:(?:the|this) )?(?:amended and restated )?credit agreement\b"
            rf"|{_QUALIFIERS}credit agreement\b{_TITLE_END}"
        ),
    ),
    (
        "indenture",
        _rx(
            r"(?:(?:the|this) )?(?:(?:\w+ )?supplemental )?indenture\b"
            rf"|{_QUALIFIERS}(?:(?:\w+ )?supplemental )?indenture\b{_TITLE_END}"
        ),
    ),
    ("amendment", _rx(r"amendment no\.? ?\d+|\w+ amendment to\b")),
    ("intercreditor", _rx(r"(?:(?:the|this) )?intercreditor agreement\b")),
    ("compliance_certificate", _rx(r"compliance certificate\b")),
    ("covenant_review", _rx(r"covenant review\b")),
    ("offering_memorandum", _rx(r"(?:(?:confidential|preliminary) )?offering memorandum\b")),
    (
        "prospectus",
        _rx(r"(?:(?:preliminary|base) )?prospectus\b|supplement no\.? ?\d+\b.*\bprospectus\b"),
    ),
    ("lender_presentation", _rx(r"lender presentation\b")),
    ("information_memorandum", _rx(r"information memorandum\b")),
    ("term_sheet", _rx(r"term sheet\b|summary of (?:indicative )?terms and conditions\b")),
    ("commitment_letter", _rx(r"commitment letter\b")),
    ("ratings", _rx(r"rating action\b")),
    ("market_quotes", _rx(r"(?:\w+ )?quotes as of\b|market quotes\b")),
    ("peer_data", _rx(r"peer (?:comparables|data)\b|comparable companies\b")),
    ("management_bridge", _rx(r"management bridge\b")),
    ("portfolio", _rx(r"portfolio holdings\b")),
    ("prior_decision", _rx(r"investment committee decision memo\b")),
)
LINE_PHRASES_BY_KIND = {kind: rx for kind, rx in LINE_PHRASES}
# The kinds a file name is searched for, anywhere in it, when no title-start phrase is found.
NAME_SEARCH_KINDS = ("credit_agreement", "indenture", "amendment")
# Words that make a file name something other than the agreement itself.
_NOT_PRIMARY = _rx(
    r"\b(?:summary|memo\w*|certificate|compliance|comparison|redline|blackline|schedule|exhibit"
    r"|term sheet|presentation)\b"
)
_AMENDMENT_WORD = _rx(r"\bamend")
# Cover wording that HTML filings run into one line, found anywhere on page 1. The SEC form title
# is upper case; the same words in a body sentence are not a cover.
COVER_PHRASES: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "financial_report",
        re.compile(r"\bFORM 10-[KQ]\b|\b(?:ANNUAL|QUARTERLY) REPORT PURSUANT\b"),
    ),
    (
        "earnings_release",
        _rx(
            r"reports? (?:first|second|third|fourth) quarter\b|"
            r"(?:fourth quarter and )?full[- ]year \d{4} results\b|"
            r"earnings (?:release|conference call)\b"
        ),
    ),
)
# A 10-K's contents list, used only when page 1 gives nothing (a cover the reader returns empty).
INDEX_PHRASE = _rx(r"item 1b\.? unresolved staff comments")
EXECUTION_MARK = _rx(r"(?:execution version|executed copy|conformed copy)\b")
DRAFT_MARK = _rx(r"draft\b|preliminary (?:offering memorandum|prospectus)\b")
DRAFT_ANYWHERE = _rx(r"subject to completion|not for execution")

HTML_HEADER = "Visible text of "
_CELL = re.compile(r"^[A-Z]+\d+='")  # A workbook page prints cells as A1='text'.
_PREFIX = re.compile(
    r"^(?:L\d+: ?)?(?:ex(?:hibit)?[- ]?\d+(?:\.\d+)* )?", re.IGNORECASE
)  # captures, EDGAR
MONTHS = (
    *("january", "february", "march", "april", "may", "june", "july"),
    *("august", "september", "october", "november", "december"),
)
GERMAN = (
    *("januar", "februar", "märz", "april", "mai", "juni", "juli"),
    *("august", "september", "oktober", "november", "dezember"),
)
_MONTH = "|".join(MONTHS)
_ENGLISH_DATE = _rx(rf"\b(?:ended|at) ({_MONTH}) (\d{{1,2}}), (\d{{4}})")
_GERMAN_DATE = _rx(rf"\bzum (\d{{1,2}})\. ({'|'.join(GERMAN)}) (\d{{4}})")


def _lines(page: str, first: bool) -> list[str]:
    raw_lines = page.splitlines()
    if first and raw_lines and raw_lines[0].startswith(HTML_HEADER):
        raw_lines = raw_lines[1:]  # The file name is not cover text.
    lines = []
    for raw in raw_lines:
        line = _CELL.sub("", " ".join(raw.replace("\xa0", " ").split())).rstrip("'")
        line = _PREFIX.sub("", line).strip()
        if line:
            lines.append(line)
    return lines


def _wraps(previous: str, line: str) -> bool:
    """True when ``line`` is the wrapped tail of a prose sentence: the previous line stops without
    closing punctuation, and this line is long mixed-case text rather than a short or capitalised
    title."""
    open_prose = len(previous.split()) >= 6 and previous[-1] not in ".!?:;"
    return open_prose and len(line.split()) > 6 and not line.isupper()


def _title_continues(previous: str) -> bool:
    """True when ``previous`` is an amendment title ending "to", so the next line finishes it."""
    return bool(LINE_PHRASES_BY_KIND["amendment"].match(previous)) and previous.lower().endswith(
        " to"
    )


def _hits(lines: list[str]) -> dict[str, str]:
    """Kind -> the text that matched, from title lines (a line, or a line joined to the next)."""
    found: dict[str, str] = {}
    for index, line in enumerate(lines):
        if index and _wraps(lines[index - 1], line):
            continue  # A wrapped body line that happens to begin with a document noun.
        if index and _title_continues(lines[index - 1]):
            continue  # The second line of a title wrapped over two lines.
        following = lines[index + 1] if index + 1 < len(lines) else ""
        for candidate in (line, f"{line} {following}"):
            for kind, rx in LINE_PHRASES:
                if match := rx.match(candidate):
                    found.setdefault(kind, match.group(0))
    text = "\n".join(lines)
    for kind, rx in COVER_PHRASES:
        if match := rx.search(text):
            found.setdefault(kind, match.group(0))
    return found


def _name_search(spaced: str) -> dict[str, str]:
    """Kind -> matched words for the deal documents named anywhere in a file name. A name with a
    word of a derived document (summary, certificate, redline, ...) is not classified; a name with
    an amendment word is never a primary agreement."""
    if _NOT_PRIMARY.search(spaced):
        return {}
    kinds = ("amendment",) if _AMENDMENT_WORD.search(spaced) else NAME_SEARCH_KINDS
    found: dict[str, str] = {}
    for kind in kinds:
        if match := LINE_PHRASES_BY_KIND[kind].search(spaced):
            found[kind] = match.group(0).strip()
    return found


def _kind(name: str, lines: list[str], pages: Sequence[str]) -> tuple[str, str]:
    if found := _hits(lines):
        if len(found) > 1:
            return UNRECOGNISED, ""  # Ambiguous cover.
        ((kind, text),) = found.items()
        return kind, f"found {text!r} on page 1"
    for number, page in enumerate(pages, 1):
        if match := INDEX_PHRASE.search(" ".join(page.split())):
            return "financial_report", f"found {match.group(0)!r} on page {number}"
    spaced = " ".join(re.split(r"[-_.]+", name))
    named = _hits([spaced]) or _name_search(spaced)
    if len(named) == 1:
        ((kind, text),) = named.items()
        return kind, f"file name contains {text!r}"
    return UNRECOGNISED, ""


def _executed(kind: str, name: str, lines: list[str]) -> bool | None:
    if kind not in EXECUTABLE:
        return None
    executed = any(EXECUTION_MARK.match(line) for line in lines)
    draft = any(DRAFT_MARK.match(line) or DRAFT_ANYWHERE.search(line) for line in lines)
    if executed != draft:
        return executed
    if executed:
        return None  # An execution mark and a draft mark together settle nothing.
    spaced = " ".join(re.split(r"[-_.]+", name)).lower()
    executed_name, draft_name = "executed" in spaced.split(), "draft" in spaced.split()
    return (
        True
        if executed_name and not draft_name
        else False
        if draft_name and not executed_name
        else None
    )


def _period_end(lines: list[str]) -> str | None:
    text = " ".join(lines)
    dates: set[str] = set()
    for month, day, year in ((m[0], m[1], m[2]) for m in _ENGLISH_DATE.findall(text)):
        dates.add(_iso(year, MONTHS.index(month.lower()) + 1, day))
    for day, month, year in _GERMAN_DATE.findall(text):
        dates.add(_iso(year, GERMAN.index(month.lower()) + 1, day))
    dates.discard("")
    return next(iter(dates)) if len(dates) == 1 else None


def _iso(year: str, month: int, day: str) -> str:
    try:
        return date(int(year), month, int(day)).isoformat()
    except ValueError:
        return ""  # An impossible date is no date.


def guess_kind(name: str, first_pages: Sequence[str]) -> Guess:
    """The likely kind of one file from its name and its first pages (page 1 is the cover)."""
    lines = _lines(first_pages[0], True) if first_pages else []
    kind, signal = _kind(name, lines, first_pages)
    if kind == UNRECOGNISED:
        return Guess(UNRECOGNISED, "", None, None)
    period = _period_end(lines) if kind == "financial_report" else None
    return Guess(kind, signal, _executed(kind, name, lines), period)


# --- Expected outcomes ---------------------------------------------------------------------------

# Said once; the Review renderer shows it beside the list instead of repeating it in every reason.
FORECAST = (
    "Expected from your declarations, files and context; CP-0 confirms during the run; "
    "the model may still find less."
)
OUTCOMES = ("will_refuse", "gap", "limited", "check", "information", "ready")
EVIDENCE = ("per method", "observed offline", "observed live")
ITEM_KEYS = frozenset(
    {"id", "scope", "outcome", "reason", "fix", "basis", "evidence", "counted", "inherited_from"}
)
RUN = "run"
PROPAGATING = ("will_refuse", "limited")  # Most severe first; gap and check never propagate.
AGREEMENTS = ("credit_agreement", "indenture")
# An offering memorandum, prospectus or earnings release alone counts as a financial document here:
# the key needs this looser reading, and that case is unkeyed, so Task 5's back-test checks it.
FINANCIAL_KINDS = ("financial_report", "earnings_release", "offering_memorandum", "prospectus")
# Producer -> consumer degradation, as `deploy_vii.registry.edge_rule` returns it.
Edges = dict[str, dict[str, str]]


class Item(TypedDict):
    id: str
    scope: str
    outcome: str
    reason: str
    fix: str
    basis: str
    evidence: Literal["per method", "observed offline", "observed live"]
    counted: bool
    inherited_from: list[str]  # [] on a row that inherits nothing


def edges_for(ordered: Sequence[str]) -> Edges:
    """Consumer -> {producer: "block" | "restricted"} among the ordered modules."""
    chosen = set(ordered)
    return {
        consumer: {p: edge_rule(consumer, p) for p in sorted(producers & chosen)}
        for consumer, producers in dependencies(tuple(ordered)).items()
        if consumer in chosen
    }


@dataclass(frozen=True)
class Facts:
    """Everything a rule reads. Context values are read as entered; no rule compares two entries."""

    ordered: tuple[str, ...]
    guesses: tuple[Guess, ...]
    context: RunContext
    portfolio: PortfolioCheck = NOT_COLLECTED  # The launcher's search and checks of the workbook.

    def kind(self, *kinds: str) -> Guess | None:
        return next((g for g in self.guesses if g.kind in kinds), None)

    @property
    def legal(self) -> str:
        return self.context.attachments.legal_documents

    @property
    def run_type(self) -> str:
        return self.context.run.run_type

    @property
    def executed_agreement(self) -> bool:
        return any(g.kind in AGREEMENTS and g.executed is True for g in self.guesses)

    @property
    def draft_agreement(self) -> bool:
        return any(g.kind in AGREEMENTS and g.executed is False for g in self.guesses)

    @property
    def talk(self) -> bool:
        terms = self.context.deal_terms
        talk_fields = (
            "talk_spread_bps_low",
            "talk_spread_bps_high",
            "talk_oid_low",
            "talk_oid_high",
        )
        return any(getattr(t, f) for t in terms for f in talk_fields) or any(
            q.kind == "indicative_talk" for q in self.context.quotes
        )

    @property
    def observed_quote(self) -> bool:
        return any(q.kind == "observed" for q in self.context.quotes) or bool(
            self.kind("market_quotes")
        )


def likely(guess: Guess | None) -> str:
    return f" Likely: {guess.kind.replace('_', ' ')} ({guess.signal})." if guess else ""


@dataclass(frozen=True)
class Rule:
    key: str
    scope: str  # A module id or "run".
    condition: Callable[[Facts], bool]
    outcome: str
    reason: str
    fix: str
    basis: str
    evidence: Literal["per method", "observed offline", "observed live"]
    cite: Callable[[Facts], Guess | None] | None = None  # A guessed document the reason names.
    detail: Callable[[Facts], str] | None = None  # Run-specific words after the reason.


_SK = "docs/reuse/selected-methods/skills/"
_CP6A_GATE = (
    _SK + "cp-6-ic-debate-challenge/references/REF_CP-6A_STEPS.md REF_CP-6A_01 step 4: "
    "'Mandate/portfolio constraints missing \u2192 exact constraint = [Insufficient Information].'"
)
_CP6A_STALE = (
    _SK + "cp-6-ic-debate-challenge/SKILL.md line 343: 'Treat blanks, formula errors and `#N/A` "
    "as missing; mismatched or stale rows create a gap and cannot become a live constraint or "
    "exposure.'"
)
_FOUND = "owner-path: src/deploy_workflow/portfolio_workbook.py check"


def _workbook_names(f: Facts) -> str:
    return " Found: " + ", ".join(book.source for book in f.portfolio.workbooks) + "."


def _failing(f: Facts) -> str:
    parts = []
    for book in f.portfolio.failing:
        first = book.report.issues[0]
        parts.append(
            f"{book.source}: {count(len(book.report.issues), 'finding')}; first: "
            f"{finding_text(first, export=book.export)}."
        )
    return " " + " ".join(parts)


_STEPS4 = _SK + "cp-4-legal-covenant-interpreter/references/REF_CP-4_STEPS.md"
_CP3 = _SK + "cp-3-relative-value-security-selection/SKILL.md"
_CP3D = _SK + "cp-3d-market-implied-risk/SKILL.md"
_ADD_EXECUTED = (
    "Add the executed agreement to the documents and choose it under Legal documents, "
    "or leave out CP-4."
)
_ADD_QUOTES = "Add observed quotes under Observed quotes, or a quotes file."
_CP4_LIVE = "legal documents declared %r (entered by user)"


def no_legal_documents(context: RunContext) -> bool:
    """The context declares no legal documents, so CP-4 has no executed governing document and
    stops at its source gate. One rule for the forecast's CP-4 rules and the launcher's routing,
    instructions and acceptance of CP-4 (`cpos_launch._layout`, `_instructions`, `checker`)."""
    return context.attachments.legal_documents == "none"


# ponytail: the Will refuse wording below is provisional; A-live (Covenant & Refinancing, legal
# documents `none`) records what CP-4 and its consumers do and sets the final text.
RULES: tuple[Rule, ...] = (
    Rule(
        "investment-grade",
        RUN,
        lambda f: f.context.identity.issue_classification == "investment_grade",
        "information",
        "You classified the issue as investment grade. The methods are written for high-yield "
        "and leveraged-loan credit; this forecast does not say whether that changes the "
        "conclusions.",
        "",
        "src/deploy_workflow/owners/cpos_launch.py READER_PERSONA: 'specialising in high yield "
        "credit and leveraged loans'",
        "observed offline",
    ),
    Rule(
        "run-financials-management-claims",
        RUN,
        lambda f: f.kind("financial_report") is None,
        "check",
        "No filed financial report is recognised among the files, so financials are management "
        "claims, not filed statements.",
        "Add the filed annual or quarterly report.",
        _SK + "cp-0-source-readiness/SKILL.md Source hierarchy: '1 \u2014 controlling/primary "
        "filings, executed legal documents and official schedules; 2 \u2014 issuer/agency "
        "releases, presentations, certificates and reports;'",
        "per method",
        cite=lambda f: f.kind("lender_presentation", "information_memorandum"),
    ),
    Rule(
        "cp1-no-financial-report-recognised",
        "CP-1",
        lambda f: f.kind(*FINANCIAL_KINDS) is None,
        "check",
        "No file is recognised as a financial report, earnings release or offering document "
        "with financial pages.",
        "Add the financial report to the documents.",
        "prompts/CP-1.md item 1: 'Preserve every source row's label, sign, unit, quantity type, "
        "entity, period and locator' (CP-1 reads statement rows from the sources)",
        "per method",
    ),
    Rule(
        "cp1c-no-peer-source",
        "CP-1C",
        lambda f: (
            f.context.valuation.peer_source == "none"
            or (f.context.valuation.peer_source == "cp_dr_public" and "CP-DR" not in f.ordered)
        ),
        "gap",
        "CP-1C has no peer set: no peers were chosen, or peers are to come from research and "
        "CP-DR is not in this run.",
        "Choose a peer list under Valuation and peers, or add CP-DR.",
        "src/deploy_workflow/owners/cpos_launch.py: 'Run the complete selected method below on "
        "this issuer's supplied sources'; the cp-1c method would web-discover peers when none are "
        "listed (SKILL.md 212), which app runs cannot do; plan: Task 3 table. Provisional until "
        "Checkpoint A",
        "observed offline",
    ),
    Rule(
        "cp2-primary-no-cp1d",
        "CP-2",
        lambda f: f.run_type == "primary" and "CP-1D" not in f.ordered,
        "gap",
        "This is a new-issue run without CP-1D: the pro forma base row has no add-back verdicts.",
        "Add CP-1D to the modules.",
        "owner-path: docs/superpowers/plans/2026-11-08-plan-3-primary-transactions.md 'CP-1D "
        "supplies each add-back's verdict'; not yet in the CP-2 method text sent",
        "observed offline",
    ),
    Rule(
        "cp2h-no-ratings",
        "CP-2H",
        lambda f: not f.context.ratings and f.kind("ratings") is None,
        "gap",
        "No ratings were entered and no ratings file is recognised, so CP-2H reports "
        "Insufficient Information.",
        "Enter the ratings under Ratings, or add a ratings file.",
        _SK + "cp-2h-ratings-migration-trigger/SKILL.md Canon Core 4: 'Missing/Blocked/mismatch"
        "->[Insufficient Information]+stop/no inference'",
        "per method",
    ),
    Rule(
        "cp3-talk-no-observed-quote",
        "CP-3",
        lambda f: f.talk and not f.observed_quote,
        "limited",
        "Indicative talk was entered, but there is no observed quote among your answers or files.",
        "Add an observed quote under Observed quotes, or a quotes file.",
        _CP3 + " line 405: 'If usable market values are absent, RV must be labelled Unclear'",
        "per method",
    ),
    Rule(
        "cp3-no-quotes-no-talk",
        "CP-3",
        lambda f: not f.context.quotes and not f.talk and f.kind("market_quotes") is None,
        "gap",
        "No quotes and no price talk were entered, and no quotes file is recognised.",
        _ADD_QUOTES,
        _CP3 + " line 405: 'RV conclusions require current market evidence'",
        "per method",
    ),
    Rule(
        "cp3d-no-quotes",
        "CP-3D",
        lambda f: not f.context.quotes and f.kind("market_quotes") is None,
        "gap",
        "No quotes were entered and no quotes file is recognised.",
        _ADD_QUOTES,
        _CP3D + " line 143: 'No trade recommendation, fabricated quote'; line 164: 'current "
        "debt prices, spreads, curves'",
        "per method",
    ),
    Rule(
        "cp4-declared-none",
        "CP-4",
        lambda f: no_legal_documents(f.context),
        "will_refuse",
        "No agreement is chosen among the documents, so CP-4 stops with "
        '"No executed governing document".',
        "Add the executed agreement and choose it under Legal documents, or leave out CP-4.",
        _STEPS4 + " line 31: 'Blocked: No executed governing document. Output blocked message "
        "and STOP.'",
        "per method",
    ),
    Rule(
        "cp4-declared-executed-none-recognised",
        "CP-4",
        lambda f: f.legal == "executed" and not f.executed_agreement,
        "check",
        "You said the agreement is executed, but no file is recognised as an executed credit "
        "agreement or indenture.",
        _ADD_EXECUTED,
        _STEPS4 + " line 31: 'Blocked: No executed governing document.'",
        "per method",
    ),
    Rule(
        "cp4-declared-draft-none-recognised",
        "CP-4",
        lambda f: f.legal == "draft" and not f.draft_agreement,
        "check",
        "You said the agreement is a draft, but no file is recognised as a draft agreement.",
        "Add the draft agreement to the documents.",
        _STEPS4 + " line 373: 'Provisional (partial evidence or draft documents)'",
        "per method",
    ),
    Rule(
        "cp4-declared-draft-or-primary-no-executed-agreement",
        "CP-4",
        lambda f: (
            not no_legal_documents(f.context)
            and (f.legal == "draft" or f.run_type == "primary")
            and not f.executed_agreement
        ),
        "limited",
        "Legal terms are Provisional: this is a new-issue run or the agreement is a draft, and "
        "no executed agreement is recognised.",
        "Add the executed agreement when it exists.",
        _STEPS4 + " line 373: 'Provisional (partial evidence or draft documents)'",
        "per method",
    ),
    Rule(
        "cp4-only-amendment",
        "CP-4",
        lambda f: (
            not no_legal_documents(f.context)
            and f.kind("amendment") is not None
            and not f.kind(*AGREEMENTS)
        ),
        "limited",
        "Only an amendment is recognised and the base agreement not recognised, so the amendment "
        "alone cannot show the covenants it changes.",
        "Add the base credit agreement or indenture.",
        _STEPS4 + " line 24: 'Identify completeness limitations: missing amendments, schedules, "
        "exhibits'; line 340: 'Executed credit agreement / indenture (incl. amendments)'",
        "per method",
        cite=lambda f: f.kind("amendment"),
    ),
    Rule(
        "cp4-governing-terms-rest-on-final-om",
        "CP-4",
        lambda f: (
            not no_legal_documents(f.context)
            and f.run_type in ("secondary", "research")
            and not f.kind(*AGREEMENTS)
            and (om := f.kind("offering_memorandum")) is not None
            and om.executed is not False
        ),
        "limited",
        "Governing terms would rest on a final offering memorandum, which is a summary, not the "
        "governing document.",
        "Add the executed agreement or indenture.",
        _STEPS4 + " line 343: 'Offering memorandum covenant description | Summary of key "
        "provisions; verify against executed doc'",
        "per method",
        cite=lambda f: f.kind("offering_memorandum"),
    ),
    Rule(
        "portfolio-workbook-false",
        "CP-6",
        lambda f: (
            f.context.run.pathway == "portfolio_decision"
            and not f.context.attachments.portfolio_workbook
        ),
        "gap",
        "This is a Portfolio Decision run and no portfolio workbook was chosen.",
        "Add the portfolio workbook and choose it.",
        _SK + "cp-6-ic-debate-challenge/SKILL.md line 343: 'REF_CP-6A_Portfolio_Debate_Inputs"
        ".xlsx is the live consolidated portfolio reference.'",
        "per method",
    ),
    # Owner, 2026-11-15: "yes, wire in the portfolio workbook." and "check data first likely
    # incorrect sums and values" (ruling 2026-11-15-full-assessment-portfolio-workbook). These
    # read the launcher's search and checks, so they fire only where it looked (`collected`).
    Rule(
        "portfolio-workbook-none",
        "CP-6",
        lambda f: (
            f.portfolio.collected
            and f.context.run.pathway in ("credit_snapshot", "deep_credit_assessment", "custom")
            and not f.context.attachments.portfolio_workbook
            and not f.portfolio.workbooks
        ),
        "information",
        "No portfolio workbook chosen: the committee's portfolio posture states that the fund's "
        "mandate and limits were not supplied, so sizing within them is not tested.",
        "Add the fund's workbook, in the layout of the portfolio template, and choose it as the "
        "Portfolio workbook.",
        _CP6A_GATE,
        "per method",
    ),
    Rule(
        "portfolio-workbook-not-found",
        "CP-6",
        lambda f: (
            f.portfolio.collected
            and f.context.attachments.portfolio_workbook
            and not f.portfolio.workbooks
        ),
        "check",
        "You chose a portfolio workbook, but no uploaded file is a workbook in the layout of "
        "the portfolio template or the fund's portfolio export, so none is checked and the "
        "committee takes the fund's limits as not supplied.",
        "Upload the fund's workbook in the layout of the portfolio template, or its export "
        "(mandate, constraints and exposure report CSVs and the holdings workbook), or choose "
        "no portfolio workbook.",
        _FOUND,
        "observed offline",
    ),
    Rule(
        "portfolio-workbook-not-chosen",
        "CP-6",
        lambda f: (
            f.portfolio.collected
            and not f.context.attachments.portfolio_workbook
            and bool(f.portfolio.workbooks)
        ),
        "check",
        "A portfolio workbook or the fund's portfolio export is among the documents but is not "
        "chosen as the portfolio workbook; the modules are told it is there and how its checks "
        "came out.",
        "Choose it as the Portfolio workbook, or remove it.",
        _FOUND,
        "observed offline",
        detail=_workbook_names,
    ),
    Rule(
        "portfolio-workbook-fails-checks",
        "CP-6",
        lambda f: bool(f.portfolio.failing),
        "limited",
        "The portfolio workbook fails the checks of its sums, values and dates. The "
        "modules are told each finding, and the committee's posture cannot rest on a figure "
        "that does not reconcile.",
        "Correct the figures each finding names and upload the workbook again.",
        _CP6A_STALE,
        "observed offline",
        detail=_failing,
    ),
)
SEVERITY = {name: rank for rank, name in enumerate(PROPAGATING)}


@dataclass(frozen=True)
class Words:
    reason: str
    fix: str
    basis: str
    evidence: Literal["per method", "observed offline", "observed live"]


def _item(
    scope: str, key: str, outcome: str, words: Words, inherited: list[str] | None = None
) -> Item:
    return Item(
        id=f"{scope}:{key}",
        scope=scope,
        outcome=outcome,
        reason=words.reason,
        fix=words.fix,
        basis=words.basis,
        evidence=words.evidence,
        counted=outcome not in ("information", "ready") and not inherited,
        inherited_from=inherited or [],
    )


def _from_rule(rule: Rule, facts: Facts) -> Item:
    reason = rule.reason + (rule.detail(facts) if rule.detail else "")
    reason += likely(rule.cite(facts) if rule.cite else None)
    words = Words(reason, rule.fix, rule.basis, rule.evidence)
    return _item(rule.scope, rule.key, rule.outcome, words)


def _carried(effective: str, edge: str) -> str:
    """The milder of the producer's outcome and what the edge allows."""
    allowed = "will_refuse" if edge == "block" else "limited"
    return max(effective, allowed, key=SEVERITY.__getitem__)


def _inherit(
    module: str, ordered: Sequence[str], edges: Edges, effective: dict[str, str]
) -> Item | None:
    """The one inherited row of a module: its producers, in module order, whose effective outcome
    reaches it through the edge."""
    reaching = {
        p: _carried(effective[p], edges.get(module, {})[p])
        for p in ordered
        if p in effective and p in edges.get(module, {})
    }
    if not reaching:
        return None
    worst = min(reaching.values(), key=SEVERITY.__getitem__)
    names = list(reaching)
    codes = ", ".join(names)
    if worst == "will_refuse":
        reason = f"Expected to refuse because it reads {codes}."
    elif worst == "limited":
        reason = f"Expected to be limited because it reads {codes}."
    else:
        reason = f"Expected to be {worst.replace('_', ' ')} through {codes}, which it reads."
    words = Words(reason, "", "owner-path: deploy_vii.registry.edge_rule", "observed offline")
    return _item(module, f"from:{names[0]}", worst, words, names)


def expectations(  # noqa: PLR0913 - one keyword per forecast input; the portfolio's is new
    ordered: Sequence[str],
    guesses: Sequence[Guess],
    context: RunContext,
    registry: Edges,
    *,
    omitted: Sequence[str] = (),
    portfolio: PortfolioCheck = NOT_COLLECTED,
) -> list[Item]:
    """Expected outcome rows: run first, then each module in order, inherited row last.

    `registry` is `edges_for(ordered)`. Only Will refuse and Limited propagate, transitively through
    each module's effective outcome; Gap and Check never do."""
    facts = Facts(tuple(ordered), tuple(guesses), context, portfolio)
    fired = [
        r for r in RULES if (r.scope == RUN or r.scope in facts.ordered) and r.condition(facts)
    ]
    items = [_from_rule(r, facts) for r in fired if r.scope == RUN]
    items += [
        _item(
            RUN,
            f"section-omitted-{section}",
            "information",
            Words(
                f"This pathway does not produce the {_spec_of(section).title} report section.",
                "",
                "owner-path: src/deploy_workflow/owners/cpos_launch.py _layout (omitted sections)",
                "observed offline",
            ),
        )
        for section in omitted
    ]
    effective: dict[str, str] = {}
    for module in facts.ordered:
        own = [r for r in fired if r.scope == module]
        items += [_from_rule(r, facts) for r in own]
        levels = [r.outcome for r in own if r.outcome in SEVERITY]
        if row := _inherit(module, facts.ordered, registry, effective):
            items.append(row)
            levels.append(row["outcome"])
        if levels:
            effective[module] = min(levels, key=SEVERITY.__getitem__)
    return items


def counted_ids(items: Sequence[Item]) -> list[str]:
    return [i["id"] for i in items if i["counted"]]
