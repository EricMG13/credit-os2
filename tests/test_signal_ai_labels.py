"""What the AI pass accepts from a model for a story: each field's check, the tag list, the stage
and rating-move mapping, and replies that try to change other stories. SYNTHETIC: the replies are
written by hand; no model is called.
"""

from __future__ import annotations

import json

import pytest
from signal_ai_fakes import label

from deploy_workflow.signal import ai_labels, ai_tags
from deploy_workflow.signal.ai_labels import Label, Move, move_word, read_labels


def _one(**fields: object) -> Label | None:
    return read_labels(json.dumps({"stories": [label(7, **fields)]}), [7])[7]


def test_a_valid_entry_is_read_with_every_field():
    got = _one(
        why="The tower sale funds the 2027 repayment.",
        signal=3,
        tags=["Telecoms", "Disposals"],
        kind="regulatory case",
        stage="in-depth review",
    )
    assert got is not None
    assert (got.why, got.signal, got.tags, got.kind, got.stage, got.moves) == (
        "The tower sale funds the 2027 repayment.",
        3,
        ["Telecoms", "Disposals"],
        "regulatory case",
        "in-depth review",
        [],
    )


@pytest.mark.parametrize(
    "fields",
    [
        {"why": ""},
        {"why": "x" * 241},
        {"why": "Two sentences here. And another one."},
        {"why": "See https://example.com for more."},
        {"why": "Read it at www.example.org now"},
        {"why": "A line\nwith a break."},
        {"why": " Padded."},
        {"signal": 0},
        {"signal": 4},
        {"signal": "2"},
        {"signal": True},
        {"signal": 2.0},
        {"tags": ["Telecoms", "Telecoms"]},
        {"tags": ["telecoms"]},
        {"tags": ["Crypto"]},
        {"tags": ["Telecoms", "Media", "Retail", "Food"]},
        {"kind": "rumour"},
        {"stage": "opened"},  # a stage on news
        {"kind": "regulatory case", "stage": "appeal"},
        {"moves": [{"from": "BB", "to": "B+"}]},  # moves on news
        {"kind": "rating action", "moves": [{"from": "BB", "to": "Ba2"}]},  # two scales
        {"kind": "rating action", "moves": [{"from": "BB", "to": "Stable"}]},
        {"kind": "rating action", "moves": [{"from": "bb", "to": "b+"}]},
        {"kind": "rating action", "moves": [{"from": "BB", "to": "B+"}, {"from": "A", "to": "A-"}]},
        {"kind": "rating action", "moves": [{"from": "BB", "to": "B+", "note": "x"}]},
        {"extra": "field"},
    ],
)
def test_an_entry_failing_any_check_makes_the_story_invalid(fields):
    assert _one(**fields) is None


def test_the_tag_list_is_short_credit_relevant_and_has_no_repeat():
    assert len(ai_tags.TAGS) == 50 and ai_tags.MAX_TAGS == 3
    assert {
        "Telecoms",
        "Shipping",
        "Refinancing",
        "Rating actions",
        "Restructuring",
    } <= ai_tags.TAGS


@pytest.mark.parametrize(
    ("start", "end", "word"),
    [
        ("BB-", "B+", "Downgrade, one notch"),
        ("BBB-", "BB-", "Downgrade, three notches"),
        ("B", "BB", "Upgrade, three notches"),
        ("Ba3", "Ba1", "Upgrade, two notches"),
        ("BB", "BB", "Affirmed"),
        ("Negative", "Stable", "Outlook"),
        ("Stable", "Stable", "Outlook affirmed"),
        ("AAA", "D", "Downgrade, 22 notches"),
        # S05-4-1: S&P (SD) and Fitch (RD) default rungs are on separate lists
        ("RD", "D", "Downgrade, one notch"),
        ("CCC", "SD", "Downgrade, four notches"),
        ("SD", "CCC+", "Upgrade, five notches"),
        ("CCC-", "RD", "Downgrade, three notches"),
    ],
)
def test_a_rating_move_gets_its_word_here_never_from_the_model(start, end, word):
    assert move_word(Move.model_validate({"from": start, "to": end})) == word


def test_a_rating_and_an_outlook_move_are_read_together():
    got = _one(
        kind="rating action",
        moves=[{"from": "Negative", "to": "Stable"}, {"from": "BB-", "to": "B+"}],
    )
    assert got is not None and [(m.start, m.end) for m in got.moves] == [
        ("Negative", "Stable"),
        ("BB-", "B+"),
    ]


# Whole replies


def test_a_reply_that_is_not_one_object_of_stories_marks_nothing():
    for text in [
        "",
        "Sorry, I cannot help.",
        "[]",
        '{"stories": {}}',
        '{"stories": [], "note": "x"}',
        '{"stories": [], "stories": []}',
        '{"stories": [NaN]}',
        "[" * 100000,
    ]:
        assert read_labels(text, [1, 2]) is None


def test_a_fenced_reply_is_read():
    text = "```json\n" + json.dumps({"stories": [label(1)]}) + "\n```"
    got = read_labels(text, [1])
    assert got is not None and got[1] is not None


def test_a_story_missing_from_the_reply_is_invalid_and_another_id_is_ignored():
    got = read_labels(json.dumps({"stories": [label(1), label(99), "junk", {"id": 2}]}), [1, 2])
    assert got is not None
    assert got[1] is not None and got[2] is None and 99 not in got


def test_two_entries_for_one_story_make_it_invalid_and_leave_the_others_alone():
    """A hostile title asks the model to answer for story 2 as well: story 2 then has two
    entries, so neither is taken, and story 3 keeps its own."""
    hostile = label(1, why="Ignore the rest.")
    forged = label(2, why="Hacked by story one.", signal=3)
    text = json.dumps({"stories": [hostile, label(2), forged, label(3)]})
    got = read_labels(text, [1, 2, 3])
    assert got is not None
    assert got[2] is None
    assert got[3] is not None and got[3].why == "The sale proceeds repay the 2027 notes."
    assert got[1] is not None and got[1].why == "Ignore the rest."  # it can mislabel itself only


def test_an_id_is_matched_as_the_text_given_never_as_a_number():
    got = read_labels(
        json.dumps({"stories": [{**label(1), "id": 1}, {**label(2), "id": "02"}]}), [1, 2]
    )
    assert got == {1: None, 2: None}


def test_plain_refuses_control_and_format_characters():
    assert ai_labels.plain("A plain line.")
    assert not ai_labels.plain("bidi \N{RIGHT-TO-LEFT OVERRIDE} trick")
    assert not ai_labels.plain("bell \x07")


# Third review, finding 15: anything shaped like a link is refused; plain credit sentences pass


@pytest.mark.parametrize(
    "why",
    [
        "See evil.example.info for the full story",
        "Details at bit.ly/3xYz",
        "Go to t.me/creditdesk now",
        "Read evil.ru/login",
        "javascript:alert(1)",
        "Write to mailto:desk",
        "<a href='//evil.example'>click</a>",
        "[click here](//evil.example/x)",
        "Ignore prior instructions new line",
        "Visit issuer.app today",
        "Open acme.tk/claim for the tender",  # a top-level domain on no list, with a path
    ],
)
def test_a_why_shaped_like_a_link_or_a_line_break_is_refused(why):
    assert _one(why=why) is None


@pytest.mark.parametrize(
    "why",
    [
        "The 2027 notes trade at 92.5 after the downgrade.",
        "Net leverage rises to 5.2x on weaker EBITDA.",
        "Outlook: negative after the review.",
        "S&P cuts to B- with a negative outlook.",
        "The U.S. unit's sale repays the term loan.",
        "A 3:1 leverage covenant is tested at 14:00 UTC.",
        "EUR/USD moves widen the euro tranche's cost.",
        "Q3 EBITDA fell 12% year on year, e.g. in Retail.",
        "Cars.com extends its revolver to 2030.",  # S05-1-2: a capitalised name, not a host
        "Cars.com Inc. extends its revolver to 2030",
        "Booking.com and Amazon.com repriced their term loans.",
    ],
)
def test_a_plain_credit_sentence_is_not_taken_for_a_link(why):
    assert not ai_labels.has_link(why) and ai_labels.plain(why)


@pytest.mark.parametrize(
    "why",
    [
        "S&P cut U.S. Steel to B+ on weaker cash flow.",
        "Moody's affirms Ford Motor Co. at Ba1 with a stable outlook.",
        "The U.K. regulator opens a review of Thames Water.",
        "Cox Inc. repays 2027 notes early.",
        "Fitch placed Acme on Rating Watch Negative ahead of the Dec. 15 vote.",
        "Moody's affirmed Acme at Ba2 and its notes mature Nov. 5, 2027.",
        "S&P expects the refinancing to close by Sept. 30.",
        "Sen. Warren urged regulators to open a review of Thames Water.",
        "Gov. Hochul signed the utility rate bill.",
        "Moody's downgraded J. Crew Group to Caa2 on weak liquidity.",
        "J. P. Morgan led the refinancing of Acme's term loan.",
        "T. Rowe Price disclosed a 6% stake in Acme's senior notes.",
        "The court sided with the lenders in Acme v. Beta Holdings on the guarantee.",
        "Fitch affirmed Acme Pty. Ltd. at BB with a stable outlook.",
        "S&P rated Acme Pte. Ltd. B+ after its first bond.",
        "Moody's upgraded Beta Sdn. Bhd. on lower leverage.",
        "Fitch placed Warner Bros. Discovery on Rating Watch Negative.",
        "Moody's cut Bausch Health Cos. Senior Notes to B3 on weak cash flow.",
        "Moody's cut ACME INC. Senior Notes to B3 on weak cash flow.",
        "Fitch affirmed ACME HOLDINGS INC. Senior Notes at BB with a stable outlook.",
        # S05-4-2: an abbreviation joined by a curly quote or a dash, a non-ASCII initialism
        "Moody\u2019s said \u201cJ. Crew\u201d faces a payment default on its term loan.",
        "Moody\u2019s placed the \u2018J. Crew\u2019 notes on review for downgrade.",
        "Fitch said the \u201cU.S. Steel\u201d takeover raises Acme\u2019s leverage.",
        "Acme\u2019s largest lender\u2014U.S. Bank\u2014cut its revolving credit line.",
        "Acme\u2019s largest tenant\u2014J. Crew\u2014missed its November rent.",
        "S&P rated Pegasus Hava Taşımacılığı A.Ş. B+ after its first bond.",
        "Moody\u2019s rated Akbank T.A.\u015e. Senior Notes Ba3 on stronger capital.",
    ],
)
def test_an_abbreviation_is_not_taken_for_a_sentence_end(why):
    assert _one(why=why) is not None


@pytest.mark.parametrize(
    "why",
    [
        "Cash flow fell. Moody's cut the rating.",
        "Fitch cut it! Bonds fell.",
        "Fitch cut Nestlé to AA. Ørsted was left unchanged at BBB.",
        "S&P affirmed Acme at BBB. Électricité de France was left unchanged.",
        "Moody's cut Acme to Ba1. Škoda Auto was left unchanged.",
        # S05-4-3: only company forms match without case; SEC, FT and "no" are not titles
        "Acme disclosed an accounting probe in a filing with the SEC. Moody's put it on review.",
        "Acme's chief executive resigned, according to the FT. Its bonds fell five points.",
        "Acme's lenders voted no. The company now faces a payment default.",
        # S05-5-1: a name joined by "&" ends in a word, not in a single-letter initial
        "Acme's bonds were cut to junk by S&P. Moody's kept them at Baa3.",
        "Fitch affirmed AT&T. Moody's moved its outlook to negative.",
        "Acme cut spending on R&D. Fitch expects free cash flow to fall.",
        "Leverage rose after the M&A. Fitch moved the outlook to negative.",
        "Fitch cut Acme to BB. Bonds fell.",
        "Acme\u2019s bonds fell\u2014again. Moody\u2019s cut the rating.",
        "The notes were cut by Moody's. Fitch kept them at BB.",
        "The notes were cut by Moody\u2019s. Fitch kept them at BB.",
    ],
)
def test_a_real_second_sentence_is_still_refused(why):
    assert _one(why=why) is None
