"""The shared manual and account-derived analyst-name rules."""

from __future__ import annotations

ANALYST_NAME_RULE = (
    "Enter your name as your first name and initial, for example Eric G, "
    "or two initials, for example Eric MG."
)
SUBMITTER_AT_MOST = 80
_INITIALS_AT_MOST = 2


def is_analyst_name(text: str) -> bool:
    """Whether ``text`` has the legacy first-name and one/two-capital-initial grammar."""
    first, space, initials = text.partition(" ")
    pieces = first.replace("'", "-").replace("\u2019", "-").split("-")
    return (
        bool(space)
        and all(piece.isalpha() for piece in pieces)
        and 1 <= len(initials) <= _INITIALS_AT_MOST
        and all(letter.isalpha() and letter.isupper() for letter in initials)
    )


def derive_analyst_name(given_name: str | None, family_name: str | None) -> str | None:
    """Derive the current one-initial form from two plain, single-word identity claims."""
    if (
        not isinstance(given_name, str)
        or not isinstance(family_name, str)
        or not given_name.isalpha()
        or not family_name.isalpha()
    ):
        return None
    initial = family_name[0].upper()
    if len(initial) != 1 or not initial.isalpha() or not initial.isupper():
        return None
    result = f"{given_name} {initial}"
    return result if len(result) <= SUBMITTER_AT_MOST and is_analyst_name(result) else None
