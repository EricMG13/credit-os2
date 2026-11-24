"""The fixed tag list the AI pass may choose from (spec 5.5): sectors and credit themes.

A data module, kept short and credit-relevant (spec 8 leaves the list to the builder). A tag the
model gives that is not listed here, spelled exactly so, makes that story's output invalid: no
free text from a model becomes a tag. Changing the list changes only what later stories may get;
stored tags stay as they were written.
"""

from __future__ import annotations

SECTORS: tuple[str, ...] = (
    "Aerospace and defence",
    "Airlines",
    "Autos",
    "Banks",
    "Building materials",
    "Business services",
    "Chemicals",
    "Construction",
    "Consumer goods",
    "Energy",
    "Food",
    "Gaming",
    "Healthcare",
    "Industrials",
    "Insurance",
    "Leisure",
    "Media",
    "Metals and mining",
    "Oil and gas",
    "Packaging",
    "Paper and forest",
    "Pharma",
    "Real estate",
    "Retail",
    "Shipping",
    "Sovereigns",
    "Technology",
    "Telecoms",
    "Transport",
    "Utilities",
)

THEMES: tuple[str, ...] = (
    "Capex",
    "Competition",
    "Covenants",
    "Default",
    "Disposals",
    "Distressed exchange",
    "Dividends",
    "Earnings",
    "Fraud",
    "Guidance",
    "LBO",
    "Leverage",
    "Liquidity",
    "Litigation",
    "M&A",
    "Maturities",
    "Rating actions",
    "Refinancing",
    "Regulation",
    "Restructuring",
)

TAGS: frozenset[str] = frozenset(SECTORS + THEMES)
MAX_TAGS = 3  # per story

if len(TAGS) != len(SECTORS) + len(THEMES):  # a tag listed twice would hide a typo
    raise RuntimeError("a tag is listed twice")
