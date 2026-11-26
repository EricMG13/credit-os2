"""One reading of a statement page's unit statement, shared by every owner that stamps MILLIONS.

CP-2E (`Checker.unit_issue`) and CP-4C (`_source_row_issues`) both refuse a cited page that does
not state exactly millions of the run's reporting currency; this is that one rule and its wording.
"""

import re

from deploy_workflow.research.peer_basis import ISO_4217

# A page's unit statement is a unit phrase, read by one pattern (`_UNIT_PHRASE`) whose scale and
# currency come from the same match. Three anchors state a unit: (1) a currency touching its
# scale ("EUR m", "EURm", "€m", "£'000", "$000s", "£ million", "USD, millions", "EUR (millions)",
# "$ in millions", "EUR; amounts in millions"; not before "of <noun>": "ABC, millions of
# customers" is prose); (2) a scale led by "in" or an opening bracket, its currency optionally
# after it ("in millions", "(millions, except per share data)", "(in million EUR)", "(in
# millions, euros)", "(In millions of U.S. dollars)", "(in '000)"); (3) a heading line
# "Millions of yen".
# An amount with a scale word in running prose ("$500 million of euro notes") states nothing, a
# share-count clause ("shares in thousands") and a negated one ("not in millions") neither.
# Every MILLIONS operand is stamped at scale 1e6 of the reporting currency, so the page must state
# exactly millions (as the CP-1 adapters refuse other scales); "million" reads like "millions",
# thousands in any spelling ("000s", "'000") is refused, and a currency sign or code + `m` lower
# case, whole token ("$m", "US$m", "EURm", "£m"), states millions of that currency. Any other
# spelling ("$mm", "USDmn", "EUR M") states none, and its rows are refused.
# Ruling (units): a unit phrase that names a currency other than the book's reporting currency
# is refused, before or after its scale, in word, code and symbol forms; one that names none
# recognised keeps the scale-only reading. "$" is the dollar family (a CAD or AUD book may print
# "$ millions"), "US$" and "U.S. dollars" are USD, "¥" is JPY or CNY, a prefixed dollar ("C$",
# "A$", "HK$") names its own currency, and an unknown one ("J$") names none recognised, so it is
# refused on every book (fail closed). A word shared by several currencies ("kroner", "pesos",
# "rupees", "francs") names one only with its country ("Swiss francs", "Mexican pesos").
_DOLLARS = ("USD", "CAD", "AUD", "NZD", "SGD", "HKD")
# What a unit statement's currency names, by its spelling case-folded without dots or spaces
# ("U.S. Dollars" -> "usdollars"); a three-capital-letter ISO 4217 code names itself.
_NAMED_CURRENCY: dict[str, tuple[str, ...]] = {
    "$": _DOLLARS,
    "dollars": _DOLLARS,
    "us$": ("USD",),
    "usdollars": ("USD",),
    "unitedstatesdollars": ("USD",),
    "c$": ("CAD",),
    "ca$": ("CAD",),
    "canadiandollars": ("CAD",),
    "a$": ("AUD",),
    "au$": ("AUD",),
    "aus$": ("AUD",),
    "australiandollars": ("AUD",),
    "nz$": ("NZD",),
    "newzealanddollars": ("NZD",),
    "s$": ("SGD",),
    "singaporedollars": ("SGD",),
    "hk$": ("HKD",),
    "hongkongdollars": ("HKD",),
    "r$": ("BRL",),
    "mx$": ("MXN",),
    "nt$": ("TWD",),
    "€": ("EUR",),
    "euro": ("EUR",),
    "euros": ("EUR",),
    "£": ("GBP",),
    "pounds": ("GBP",),
    "britishpounds": ("GBP",),
    "sterling": ("GBP",),
    "poundssterling": ("GBP",),
    "¥": ("JPY", "CNY"),
    "yen": ("JPY",),
    "japaneseyen": ("JPY",),
    # a currency word names one only with its country (a bare "kroner", "pesos", "rupees" or
    # "francs" is shared by several currencies and names none recognised)
    "swissfranc": ("CHF",),
    "swissfrancs": ("CHF",),
    "rmb": ("CNY",),
    "renminbi": ("CNY",),
    "yuan": ("CNY",),
    "chineseyuan": ("CNY",),
    "swedishkrona": ("SEK",),
    "swedishkronor": ("SEK",),
    "norwegiankrone": ("NOK",),
    "norwegiankroner": ("NOK",),
    "danishkrone": ("DKK",),
    "danishkroner": ("DKK",),
    "indianrupee": ("INR",),
    "indianrupees": ("INR",),
    "mexicanpeso": ("MXN",),
    "mexicanpesos": ("MXN",),
    "southafricanrand": ("ZAR",),
}
_UNIT_CUR = (  # a currency word, a (prefixed) symbol or a three-capital-letter code
    r"(?i:(?:(?:U\.?S\.?|United\s+States|Canadian|Australian|New\s+Zealand|Singapore|Hong\s+Kong"
    r"|British|Japanese)\s+)?(?:dollars|euros?|(?:pounds\s+)?sterling|pounds|yen))"
    r"|(?i:(?:Chinese\s+)?(?:yuan|renminbi)|Swiss\s+francs?|Swedish\s+kron(?:a|or)"
    r"|(?:Norwegian|Danish)\s+kron(?:e|er)|Indian\s+rupees?|Mexican\s+pesos?"
    r"|South\s+African\s+rand)"
    r"|(?:U\.?S\.?\s?|[A-Z]{1,3})?\$|[€£¥]|[A-Z]{3}"
)
_SCALE = r"(?i:thousands?|millions?|billions?)"
_THOUSANDS_MARK = r"['’]?000(?:['’]?s)?"  # "'000", "000", "000s", "000's"
_AFTER = (  # anchor 2: the currency after the scale, optional
    rf"(?:\s+(?i:of)\s+(?P<of>{_UNIT_CUR})(?![A-Za-z])"
    rf"|\s*(?:[,;]\s*)?(?P<after>{_UNIT_CUR})(?![A-Za-z]))?"
)
# One pattern, three anchors (described in the header). A scale after an amount ("$500 million of
# euro notes") has none of them and states nothing (S03-3-2).
_UNIT_PHRASE = re.compile(
    rf"(?<![A-Za-z0-9$.])(?P<cur>{_UNIT_CUR})"
    rf"(?:(?P<mm>\s*m)(?![A-Za-z0-9])"
    rf"|\s?(?P<k>{_THOUSANDS_MARK})(?![A-Za-z0-9])"
    r"|\s*(?:[;,()]\s*)?(?:(?i:(?:(?:amounts|figures|expressed)\s+)?in)\s+)?"
    rf"(?P<cs>{_SCALE})\b(?!\s+(?i:of)\s+(?!(?:{_UNIT_CUR})(?![A-Za-z]))))"
    r"|(?:(?<!(?i:shares) )(?<!(?i:share) )(?<!(?i:not) )(?<![A-Za-z])(?i:in)\s+|(?<=\()\s*)"
    rf"(?:(?P<s>{_SCALE})\b|(?P<sk>{_THOUSANDS_MARK})(?![A-Za-z0-9])){_AFTER}"
    rf"|(?:^[ \t]*|[,;:]\s*)(?P<ls>(?i:thousands|millions|billions))"
    rf"\s+(?i:of)\s+(?P<lsof>{_UNIT_CUR})(?![A-Za-z])",
    re.MULTILINE,
)
# A share-count clause ("shares in thousands", "weighted-average shares (in thousands)", "share
# counts in thousands") states the unit of a count of shares, not of money; it is read out of the
# page before the unit phrases are.
_SHARE_CLAUSE = re.compile(
    rf"\b(?i:shares?)(?:\s+(?i:outstanding|counts?))?\s*[,:]?\s*\(?\s*(?i:in\s+)?{_SCALE}\b",
)
# A currency named in its own sentence, then the unit sentence ("Presentation currency: EUR.
# Amounts in millions.") is one unit statement, as with a ";" or a line break between the two.
_CURRENCY_SENTENCE = re.compile(
    rf"(?P<head>(?i:\bcurrency\b)\s*:?\s*(?:{_UNIT_CUR}))\."
    rf"(?=\s+(?i:(?:amounts|figures|expressed)\s+)?(?i:in)\s+{_SCALE}\b)"
)
# words and tickers
_AMBIGUOUS_CODES = frozenset({"ALL", "AMD", "TOP", "CUP", "BOB", "SOS", "BAM"})


def _codes(text: str, phrase: str) -> tuple[str, ...] | None:
    """The ISO codes a phrase's currency ``text`` names: () for an unknown prefixed dollar
    ("J$") or word, None for a three-capital word that is no currency ("CPI")."""
    named = _NAMED_CURRENCY.get(re.sub(r"[\s.]", "", text.casefold()))
    if named is not None or not re.fullmatch(r"[A-Z]{3}", text):
        return named or ()
    if text in ISO_4217 and not (
        text in _AMBIGUOUS_CODES and re.search(r"\bin\b", phrase, re.IGNORECASE)
    ):
        # a word that is also a code ("ALL amounts in millions") names one only before a scale
        return (text,)
    return None


def _unit_phrases(page: str) -> list[tuple[str, str, tuple[str, ...] | None]]:
    """Each unit phrase on the page: (scale, currency text, codes it names); codes is None when
    the phrase names no currency, () when it names one that is not recognised."""
    phrases: list[tuple[str, str, tuple[str, ...] | None]] = []
    read = _CURRENCY_SENTENCE.sub(r"\g<head>;", _SHARE_CLAUSE.sub(" ", page))
    for m in _UNIT_PHRASE.finditer(read):
        text = m["cur"] or m["of"] or m["after"] or m["lsof"] or ""
        codes = _codes(text, m.group()) if text else None
        if (m["mm"] or m["k"]) and codes is None:
            continue  # "CPI m", "ABC000": a symbol form needs a currency
        word = m["cs"] or m["s"] or m["ls"]
        if m["mm"]:
            scale = "millions"
        elif word:
            scale = word.lower().removesuffix("s") + "s"
        else:
            scale = "thousands"  # "'000", "000s"
        phrases.append((scale, text, codes))
    return phrases


def page_unit_issue(page: str, locator: str, currency: str) -> str | None:
    """Why ``page`` (cited at ``locator``) is not in millions of ``currency``, or None."""
    phrases = _unit_phrases(page)
    found = {scale for scale, _, _ in phrases}
    if found and found != {"millions"}:
        return f"{locator} states amounts in {', '.join(sorted(found))}, not millions"
    for _, text, codes in phrases:
        if codes is not None and currency not in codes:
            return (
                f"{locator} states its unit in {text} ({'/'.join(codes) or 'unrecognised'}), "
                f"but the reporting currency is {currency}: restate the unit in {currency}"
            )
    if not found:
        return f"{locator} does not state the unit of its amounts"
    return None
