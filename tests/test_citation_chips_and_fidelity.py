"""S03 C10 fix B: chip inventory hashes, ## Sources lists and quote matching (credit_os_chips),
currency codes, line numbering and label numbers (prose_checks). Expected values are literal."""

import hashlib
import json

import pytest
from credit_os.source import parse_source

from deploy_workflow.credit_os_chips import Pages, chips_for_output, inventory, quote_span
from deploy_workflow.prose_checks import (
    figure_issues,
    lost_values,
    prose_issues,
)

# --- helpers --------------------------------------------------------------------------------


def pages_bytes(*texts):
    return b"".join(
        json.dumps({"page": n, "text": t}).encode() + b"\n" for n, t in enumerate(texts, 1)
    )


def one_run(tmp_path, pages, listed_hash):
    run = tmp_path / "run"
    (run / "source-text").mkdir(parents=True)
    (run / "source-text" / "ar.jsonl").write_bytes(pages)
    return run, {"K": ("ar.jsonl", listed_hash)}


def cite(run, inv, cell):
    sections = [
        {
            "heading": "H",
            "level": 3,
            "line": 1,
            "blocks": [
                {
                    "type": "table",
                    "line": 2,
                    "headers": ["Item", "Basis"],
                    "rows": [{"line": 4, "cells": ["a", cell]}],
                }
            ],
        }
    ]
    return chips_for_output(run, "x/CP-1.md", "CP-1", sections, inv)["x/CP-1.md:4"]


# --- C10-3: the inventory hash is compared as a normalised hex string -----------------------


def test_an_upper_case_inventory_hash_matches_the_files_hexdigest(tmp_path):
    raw = pages_bytes("page one")
    run, inv = one_run(tmp_path, raw, hashlib.sha256(raw).hexdigest().upper())
    (got,) = cite(run, inv, "K, page:1")
    assert got["hash_matches_inventory"] is True


def test_a_backticked_sha256_prefixed_inventory_hash_matches(tmp_path):
    raw = pages_bytes("page one")
    listed = "`sha256:" + hashlib.sha256(raw).hexdigest() + "`"
    run, inv = one_run(tmp_path, raw, listed)
    (got,) = cite(run, inv, "K, page:1")
    assert got["hash_matches_inventory"] is True


def test_a_wrong_inventory_hash_still_fails_the_match(tmp_path):
    raw = pages_bytes("page one")
    run, inv = one_run(tmp_path, raw, "A" * 64)
    (got,) = cite(run, inv, "K, page:1")
    assert got["hash_matches_inventory"] is False


def test_one_file_listed_twice_with_the_same_hash_in_different_case_is_not_ambiguous(tmp_path):
    inv = {"K": ("ar.jsonl", "ab" * 32), "L": ("ar.jsonl", ("ab" * 32).upper())}
    assert Pages(tmp_path, inv).files == {"ar.jsonl": "K"}


def test_one_file_listed_twice_with_different_hashes_stays_ambiguous(tmp_path):
    inv = {"K": ("ar.jsonl", "ab" * 32), "L": ("ar.jsonl", "cd" * 32)}
    assert Pages(tmp_path, inv).files == {"ar.jsonl": None}


# --- C10-4: every line of a multi-line ## Sources block is an entry -------------------------


def test_consecutive_star_lines_of_a_sources_section_are_each_an_inventory_entry():
    a, b = "a" * 64, "b" * 64
    sections = parse_source(f"## Sources\n\n* a.pdf {a}\n* b.pdf {b}\n")
    assert dict(inventory(sections)) == {"a.pdf": ("a.pdf", a), "b.pdf": ("b.pdf", b)}


def test_a_single_dash_line_and_dash_lines_of_a_sources_section_still_read():
    a, b = "a" * 64, "b" * 64
    sections = parse_source(f"## Sources\n\n- a.pdf {a}\n\n- b.pdf {b}\n")
    assert dict(inventory(sections)) == {"a.pdf": ("a.pdf", a), "b.pdf": ("b.pdf", b)}


# --- C10-5: whitespace runs in a quote match any whitespace run in the page -----------------


def test_a_quote_matches_across_a_line_break_in_the_page_text():
    text = "Q3 net\nleverage was 4.1x"
    assert quote_span("net leverage", text) == (3, 15)


def test_a_quote_with_one_space_matches_a_double_space_page_and_literals_still_match():
    assert quote_span("net leverage", "the net  leverage") == (4, 17)
    assert quote_span("alpha", "x alpha y") == (2, 7)
    assert quote_span("alpha beta", "x alpha  gamma") is None


def test_a_quote_found_across_a_line_break_in_a_cited_page(tmp_path):
    raw = pages_bytes("net\nleverage was 4.1x")
    run, inv = one_run(tmp_path, raw, hashlib.sha256(raw).hexdigest())
    (got,) = cite(run, inv, "K, page:1 says “net leverage”")
    assert got["quote_found"] is True


# --- C10-6: currency codes and prefixed dollars are kept as written -------------------------


def lost(old, new):
    return [(x["value"], x["previous_line"]) for x in lost_values(old, new)]


def test_a_changed_iso_currency_code_is_a_lost_value():
    assert lost("Debt CAD 250 million", "Debt AUD 250 million") == [("CAD 250 million", 1)]
    assert lost("Debt CHF 250 million", "Debt JPY 250 million") == [("CHF 250 million", 1)]


def test_a_prefixed_dollar_is_not_read_as_us_dollars():
    assert lost("Debt A$250 million", "Debt $250 million") == [("A$ 250 million", 1)]
    assert lost("Debt HK$250 million", "Debt C$250 million") == [("HK$ 250 million", 1)]


def test_a_code_word_not_next_to_a_figure_is_no_currency():
    # ALL is a currency code, but here a word; the figure carries no currency either way.
    assert lost("ALL lenders agreed 250 million", "Lenders agreed 250 million") == []
    assert lost("ALL lenders agreed USD 250 million", "Lenders agreed USD 250 million") == []


def test_the_currencies_the_module_already_knew_are_unchanged():
    assert lost("Debt USD 250 million", "Debt EUR 250 million") == [("USD 250 million", 1)]
    assert lost("Debt $250 million", "Debt US$250 million") == []
    assert lost("Debt US$250 million", "Debt USD 250 million") == []
    assert lost("Debt £250 million", "Debt GBP 250 million") == []
    assert lost("Debt €250 million", "Debt EUR 250 million") == []
    assert lost("Debt CAD 250 million", "Debt CAD 250 million") == []
    assert lost("Debt $250 million", "Debt 250 million") == [("USD 250 million", 1)]


# --- C10-7: one newline-only splitter for line numbers --------------------------------------

PREFIX = "# Handoff\n\n## Findings\n\n### Bottom line\n\n"


def test_a_form_feed_inside_a_line_does_not_shift_check_line_numbers():
    text = PREFIX + "The view holds.\x0cSee CP-2D.\nIt cites  here.\n"
    issues = prose_issues(text)
    assert [i.split(":")[0] for i in issues] == [
        "Prose check 2 (no module code), line 7",
        "Prose check 9 (no provider citation marker), line 8",
    ]


def test_u2028_and_vertical_tab_do_not_split_a_line_for_lost_values():
    old = "intro\n\nDebt was USD 250 million and more\x0bhere.\nNext USD 300 million\n"
    assert lost(old, "intro\n") == [("USD 250 million", 3), ("USD 300 million", 4)]


def test_a_separator_inside_a_line_does_not_shift_fidelity_line_numbers():
    text = (
        "# H\n\n## Findings\n\n### Bottom line\n\nCredit is mixed.\n\n### Key findings\n\n"
        "Cover was 9.87x.\n\n## Calculations\n\n| ID | Value |\n| --- | --- |\n| C-1 | 3.1x |\n"
    )
    (issue,) = figure_issues(text)
    assert issue.startswith('Fidelity check, line 11: "9.87x"')


# --- C10-8: label numbers are not passage figures -------------------------------------------


def fidelity(passage, detail="| ID | Value |\n| --- | --- |\n| C-1 | 3.1x |"):
    text = (
        "# Handoff\n\n## Findings\n\n### Bottom line\n\nCredit is mixed.\n\n"
        f"### Key findings\n\n{passage}\n\n## Calculations\n\n{detail}\n"
    )
    return figure_issues(text)


def test_ordinals_and_tranche_labels_are_not_refused_as_missing_figures():
    assert fidelity("The 2nd lien loan is weak.") == ()
    assert fidelity("The 3rd amendment was signed.") == ()
    assert fidelity("Term loan B-1 matures soon.") == ()
    assert fidelity("The A2 rating was kept.") == ()
    assert fidelity("The 10-K was filed.") == ()


def test_figures_the_handoff_lacks_are_still_refused():
    assert len(fidelity("Leverage is 9.87x.")) == 1
    assert len(fidelity("Leverage is 3.1x and 9.87x.")) == 1
    assert fidelity("Leverage is 3.1x.") == ()
    assert len(fidelity("The 2nd lien loan is 9 times covered.")) == 1
    assert len(fidelity("Version 1.2.3 shipped.")) == 2


def test_a_currency_glued_figure_is_still_checked():
    held = "| ID | Value |\n| --- | --- |\n| C-1 | USD 1,250 million |"
    assert fidelity("Revenue was USD1,250 million.", held) == ()
    assert len(fidelity("Revenue was USD1,300 million.", held)) == 1


# --- C10 fix round 2: regressions against BASE 030805f ---------------------------------------


@pytest.mark.parametrize(
    ("passage", "count"),
    [
        ("Leverage is 9.87x-10.5x.", 2),  # BASE 2
        ("Cover 9.87m-10.1m.", 2),  # BASE 2
        ("Range 987bp-1,100bp.", 2),  # BASE 2
        ("EBITDA-1.5x was seen.", 1),  # BASE 1
        ("Net debt/EBITDA-4.0x was seen.", 1),  # BASE 1
        ("Revenue 987mm.", 1),  # BASE 1
        ("Revenue 987MM.", 1),  # BASE 1
        ("Revenue 987B.", 1),  # BASE 1
        ("Rate 9.87pct.", 1),  # BASE 1
        ("Revenue 987bn.", 1),  # BASE 1
    ],
)
def test_a_figure_with_a_unit_or_decimal_is_always_checked(passage, count):
    assert len(fidelity(passage)) == count


@pytest.mark.parametrize(
    ("old", "new"),
    [
        ("TOP 10 lenders hold 45%", "Top 10 lenders hold 45%"),  # BASE []
        ("ALL 25 facilities", "All 25 facilities"),  # BASE []
        ("ALL 250 lenders agreed", "All 250 lenders agreed"),  # BASE []
        ("TRY 5 times", "Try 5 times"),  # BASE []
        ("MAD 5 million drawn", "Morocco dirham 5 million drawn"),  # BASE []
        ("USD$250 million", "USD 250 million"),  # BASE []
        ("USD 250 million", "USD$250 million"),  # BASE []
        ("A$250 million", "AUD 250 million"),  # BASE []
        ("AUD 250 million", "A$250 million"),  # BASE []
        ("HK$250 million", "HKD 250 million"),  # BASE []
        ("C$250 million", "CAD 250 million"),  # BASE []
    ],
)
def test_word_codes_and_notation_only_currency_changes_lose_nothing(old, new):
    assert lost(old, new) == []


def test_a_prefixed_dollar_to_another_currency_is_still_lost():
    assert lost("Debt A$250 million", "Debt $250 million") == [("A$ 250 million", 1)]
    assert lost("Debt NZ$250 million", "Debt $250 million") == [("NZ$ 250 million", 1)]
    assert lost("Debt CAD 250 million", "Debt AUD 250 million") == [("CAD 250 million", 1)]
