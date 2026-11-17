"""T03 residual: joining service notices must preserve a readable sentence boundary."""

from pathlib import Path

from deploy_workflow.inbox.layout import Layout
from react_frontend.run_activity import _shown


def test_a_following_daily_limit_notice_starts_its_own_sentence(tmp_path: Path) -> None:
    shown = _shown(
        Layout(tmp_path),
        "the library could not be rebuilt (disk full); ended runs wait for it; "
        "daily limit of 30 runs reached; waiting until tomorrow",
    )
    assert shown == (
        "The library could not be rebuilt, so runs that have ended wait to be filed. The service "
        "tries again on each check; if this stays, ask whoever runs the service to check the "
        "service's log. Daily limit of 30 runs reached; waiting until tomorrow"
    )


def test_other_reason_words_are_not_recased(tmp_path: Path) -> None:
    assert _shown(Layout(tmp_path), "daily limit of 30 runs reached; waiting until tomorrow") == (
        "daily limit of 30 runs reached; waiting until tomorrow"
    )
