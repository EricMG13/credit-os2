"""F3: a key right after a JSON escape ending in a letter or digit is still redacted."""

import json

from deploy_workflow.model.redact import REPLACEMENT, Redactor

KEY = "sk-proj-" + "A" * 30


def test_a_key_after_a_newline_escape_is_redacted() -> None:
    out = Redactor().text(json.dumps({"m": "line\n" + KEY}))
    assert KEY not in out and REPLACEMENT in out


def test_a_key_after_tab_and_unicode_escapes_is_redacted() -> None:
    for lead in ("a\t", "café"):
        out = Redactor().text(json.dumps({"m": lead + KEY}))
        assert KEY not in out, lead


def test_bytes_are_redacted_the_same_way() -> None:
    out = Redactor().bytes_(json.dumps({"m": "line\n" + KEY}).encode())
    assert KEY.encode() not in out


def test_a_word_ending_in_risk_is_not_a_key() -> None:
    text = "the risk-" + "A" * 30 + " remains"
    assert Redactor().text(text) == text


def test_a_key_after_python_repr_escapes_is_redacted() -> None:
    cases = {
        "bytes": repr(("café" + KEY).encode()),
        "x1b": repr("\x1b" + KEY),
        "x7f": repr("\x7f" + KEY),
        "U000e0001": repr("\U000e0001" + KEY),
    }
    for name, text in cases.items():
        assert KEY not in Redactor().text(text), name
        assert KEY.encode() not in Redactor().bytes_(text.encode()), name


def test_an_exception_holding_a_bytes_repr_is_redacted() -> None:
    body = ("café" + KEY).encode()
    assert KEY not in Redactor().exception(ValueError(f"bad body {body!r}"))


def test_a_risk_word_after_a_hex_escape_lookalike_is_still_a_word() -> None:
    text = "the risk-" + "A" * 30 + " remains"
    assert Redactor().bytes_(text.encode()) == text.encode()
