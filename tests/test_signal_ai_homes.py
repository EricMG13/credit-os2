"""Finding N1 (fourth review): ``ai_call.remove_homes`` removes only the exchange homes Signal's own
calls caused, at the exact place it named them, and never follows a link out of
``cwd/.copilot-home``. Every test works in its own temporary directory (the working directory is
moved there), and each refused shape asserts that the directory outside still exists. SYNTHETIC:
the model is a fake that makes its home as the Copilot adapter does; no call leaves the process.
"""

from __future__ import annotations

import os
import re
import shutil
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import FakeModel, guard, not_sent, ok

from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.signal import ai_call, ai_ledger, store
from deploy_workflow.signal.store import StoreError

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
NAME = re.compile(r"[A-Za-z0-9_-]{1,128}")  # the Copilot adapter's own rule for both names


class HomeModel(FakeModel):
    """SYNTHETIC: makes the home as ``CopilotAdapter._open`` does (refusing one that exists, and a
    name that is not one, as not sent), then answers."""

    def complete(self, request: Any, **kwargs: Any) -> AdapterReply:
        self.requests.append(request)
        digest, reservation = kwargs["invocation_digest"], kwargs["reservation_id"]
        if not NAME.fullmatch(digest) or not NAME.fullmatch(reservation):
            return not_sent()
        home = Path.cwd() / ".copilot-home" / digest / reservation
        try:
            home.mkdir(parents=True)
        except FileExistsError:
            return not_sent()
        (home / "session.json").write_text("{}", encoding="utf-8")
        return ok("{}", usd="0.001")


@pytest.fixture
def work(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    folder = tmp_path / "work"
    folder.mkdir()
    monkeypatch.chdir(folder)
    return folder


@pytest.fixture
def db(tmp_path: Path, work: Path) -> Any:
    opened = store.open_db(tmp_path / "root")
    ai_ledger.set_cap(opened, Decimal(15), NOW)
    yield opened
    opened.close()


def _precious(folder: Path) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    kept = folder / "precious.txt"
    kept.write_text("keep me", encoding="utf-8")
    return kept


def _call(db: Any, g: ai_call.Guard, model: FakeModel | None = None) -> ai_call.Answer:
    prompt = ai_call.Prompt("s", "u", 10)
    return ai_call.call(db, model or HomeModel(), g, "stories", prompt)


def test_a_normal_home_is_removed_with_its_empty_digest_folder_and_nothing_else(tmp_path, work, db):
    other = work / ".copilot-home" / "other-module" / "res-1"
    other.mkdir(parents=True)
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    assert home.is_dir()
    ai_call.remove_homes(g)
    assert not home.parent.exists() and other.is_dir() and g.homes == []


@pytest.mark.parametrize(
    "tampered",
    [
        "q/../../../outside/.copilot-home/X/Y",
        "../../victim",
        "a/b",
        "0123456789ABCDEF",  # upper case is not how the store writes it
        "0123456789abcde",  # 15 digits
        "0123456789abcdef0",
        "0123456789abcdef\n",
        "",
    ],
)
def test_a_hand_edited_store_id_refuses_the_call_before_any_reservation(
    tmp_path, work, db, tampered
):
    outside = _precious(tmp_path / "outside" / ".copilot-home" / "outside" / ".copilot-home")
    db.execute("UPDATE meta SET value=? WHERE key='store_id'", (tampered,))
    db.commit()
    model = HomeModel()
    g = guard(tmp_path, NOW)
    with pytest.raises(StoreError, match="store_id"):
        _call(db, g, model)
    assert model.requests == [] and g.homes == []
    assert db.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 0
    ai_call.remove_homes(g)
    assert outside.exists()


def test_the_reviewers_prepared_layout_with_a_tampered_id_deletes_nothing(tmp_path, work, db):
    """``review4/a3b_homes.py``: before the fix this removed <tmp>/outside/.copilot-home/..."""
    db.execute(
        "UPDATE meta SET value=? WHERE key='store_id'", ("q/../../../outside/.copilot-home/X/Y",)
    )
    db.commit()
    (work / ".copilot-home" / "signal-stories-q").mkdir(parents=True)
    (tmp_path / "outside" / ".copilot-home" / "X" / "Y-1" / "signal-q").mkdir(parents=True)
    victim = _precious(
        tmp_path / "outside" / ".copilot-home" / "outside" / ".copilot-home" / "X" / "Y-1"
    )
    g = guard(tmp_path, NOW)
    with pytest.raises(StoreError):
        _call(db, g, FakeModel(answer=lambda r: not_sent()))
    ai_call.remove_homes(g)
    assert victim.exists()


def test_a_home_named_outside_cwd_copilot_home_is_never_removed(tmp_path, work):
    """Shapes a Guard could hold if its list were built by hand: a grandparent that is not the
    working directory's .copilot-home by its real path, though its name is .copilot-home."""
    elsewhere = tmp_path / "outside" / ".copilot-home" / "signal-stories-x-1" / "signal-x-1"
    kept = _precious(elsewhere)
    dotted = work / ".copilot-home" / "d" / ".." / ".." / ".." / "outside" / ".copilot-home"
    shapes = [
        elsewhere,  # another folder's .copilot-home
        dotted / "signal-stories-x-1" / "signal-x-1",  # resolves outside through ..
        work / ".copilot-home" / "signal-stories-x-1" / ".." / "signal-stories-x-1",
        work / "nested" / ".copilot-home" / "signal-stories-x-1" / "signal-x-1",
    ]
    (work / "nested" / ".copilot-home" / "signal-stories-x-1" / "signal-x-1").mkdir(parents=True)
    nested = _precious(work / "nested" / ".copilot-home" / "signal-stories-x-1" / "signal-x-1")
    ai_call.remove_homes(ai_call.Guard({}, tmp_path, lambda: NOW, list(shapes)))
    assert kept.exists() and nested.exists()


def test_a_home_swapped_for_a_link_is_left_with_its_target(tmp_path, work, db):
    victim = _precious(tmp_path / "victim")
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    shutil.rmtree(home)
    home.symlink_to(victim, target_is_directory=True)
    ai_call.remove_homes(g)
    assert victim.exists() and home.is_symlink()


def test_a_digest_folder_swapped_for_a_link_is_not_followed(tmp_path, work, db):
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    victim = _precious(tmp_path / "victim" / home.name)
    shutil.rmtree(home.parent)
    home.parent.symlink_to(tmp_path / "victim", target_is_directory=True)
    ai_call.remove_homes(g)
    assert victim.exists()


def test_a_home_that_is_a_file_is_left(tmp_path, work, db):
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    shutil.rmtree(home)
    home.write_text("a file", encoding="utf-8")
    ai_call.remove_homes(g)
    assert home.read_text(encoding="utf-8") == "a file"


def test_copilot_home_that_is_a_link_before_the_call_has_nothing_removed(tmp_path, work, db):
    """D3: the adapter makes its home through the link; Signal then removes nothing at all."""
    elsewhere = tmp_path / "elsewhere"
    kept = _precious(elsewhere)
    (work / ".copilot-home").symlink_to(elsewhere, target_is_directory=True)
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    ai_call.remove_homes(g)
    assert kept.exists() and (elsewhere / home.parent.name / home.name).is_dir()


def test_copilot_home_swapped_for_a_link_after_the_call_removes_nothing(tmp_path, work, db):
    """``review4/a3_homes.py`` 2d: before the fix this removed victim/<digest>/<reservation>."""
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    victim = _precious(tmp_path / "victim" / home.parent.name / home.name)
    shutil.rmtree(work / ".copilot-home")
    (work / ".copilot-home").symlink_to(tmp_path / "victim", target_is_directory=True)
    ai_call.remove_homes(g)
    assert victim.exists()


def test_a_link_inside_the_home_is_removed_without_following_it(tmp_path, work, db):
    victim = _precious(tmp_path / "victim")
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    os.symlink(tmp_path / "victim", home / "link-out")
    ai_call.remove_homes(g)
    assert victim.exists() and not home.exists()


def test_a_pre_existing_home_at_signals_exact_name_is_not_removed_after_home_exists(
    tmp_path, work, db
):
    """N12 second half: the adapter refused the call (HomeExists, not sent), so the home there
    is not one this call caused and is not recorded for removal."""
    tag = ai_ledger.store_id(db)
    planted = work / ".copilot-home" / f"signal-stories-{tag}-1" / f"signal-{tag}-1"
    kept = _precious(planted)
    g = guard(tmp_path, NOW)
    answer = _call(db, g)
    assert answer.not_sent and g.homes == []
    ai_call.remove_homes(g)
    assert kept.exists()


def test_a_call_that_raises_still_has_its_home_removed(tmp_path, work, db):
    """A call that raised may have been sent: the home it made is the job's to remove."""

    class Raising(HomeModel):
        def complete(self, request: Any, **kwargs: Any) -> AdapterReply:
            super().complete(request, **kwargs)
            raise RuntimeError("boom")

    g = guard(tmp_path, NOW)
    assert _call(db, g, Raising()).outcome == "raised"
    (home,) = g.homes
    ai_call.remove_homes(g)
    assert not home.exists()


def test_a_home_under_an_earlier_working_directory_is_not_removed_from_the_new_one(
    tmp_path, work, db, monkeypatch
):
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    other = tmp_path / "other"
    same = _precious(other / ".copilot-home" / home.parent.name / home.name)
    monkeypatch.chdir(other)
    ai_call.remove_homes(g)
    assert same.exists() and home.is_dir() and g.homes == []


def test_a_digest_folder_holding_something_else_is_kept(tmp_path, work, db):
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    kept = _precious(home.parent / "another-reservation")
    ai_call.remove_homes(g)
    assert not home.exists() and kept.exists()


class FailsAfterHome(HomeModel):
    """SYNTHETIC: the adapter made the home, then failed before sending (its runtime would not
    start): a not-sent reply for a home this call caused."""

    def complete(self, request: Any, **kwargs: Any) -> AdapterReply:
        super().complete(request, **kwargs)
        return AdapterReply("not_sent", None, None, None, "PreSendFailure", None, None, None)


def test_a_home_the_adapter_made_before_failing_to_send_is_removed(tmp_path, work, db):
    g = guard(tmp_path, NOW)
    assert _call(db, g, FailsAfterHome()).not_sent
    (home,) = g.homes
    ai_call.remove_homes(g)
    assert not home.exists()


def test_a_home_made_by_someone_else_during_the_call_is_not_removed(tmp_path, work, db):
    """The home appears after Signal looked and before the adapter's own mkdir: the adapter
    answers HomeExists, so the home is not this call's."""

    class Raced(FakeModel):
        def complete(self, request: Any, **kwargs: Any) -> AdapterReply:
            home = Path.cwd() / ".copilot-home" / kwargs["invocation_digest"]
            _precious(home / kwargs["reservation_id"])
            return AdapterReply("not_sent", None, None, None, "HomeExists", None, None, None)

    g = guard(tmp_path, NOW)
    assert _call(db, g, Raced()).not_sent and g.homes == []
    tag = ai_ledger.store_id(db)
    kept = work / ".copilot-home" / f"signal-stories-{tag}-1" / f"signal-{tag}-1" / "precious.txt"
    ai_call.remove_homes(g)
    assert kept.exists()


def test_a_call_refused_before_anything_was_made_leaves_nothing_to_remove(
    tmp_path, work, db, caplog
):
    g = guard(tmp_path, NOW)
    assert _call(db, g, FakeModel(answer=lambda r: not_sent())).not_sent
    assert g.homes == []
    ai_call.remove_homes(g)
    assert "could not remove" not in caplog.text


@pytest.mark.parametrize("last", ["..", "."])
def test_a_home_named_dot_or_dot_dot_is_never_removed(tmp_path, work, last):
    """A Guard holding <cwd>/.copilot-home/<d>/.. has the right grandparent by its real path, but
    its last part names the folder above (or the digest folder itself): nothing is removed."""
    digest = work / ".copilot-home" / "signal-stories-x-1"
    kept = _precious(digest / "another-exchange")
    other = _precious(work / ".copilot-home" / "other-module")
    ai_call.remove_homes(ai_call.Guard({}, tmp_path, lambda: NOW, [digest / last]))
    assert kept.exists() and other.exists()


@pytest.mark.parametrize("shape", ["file", "link"])
def test_a_home_that_is_not_a_folder_is_left_without_a_warning(tmp_path, work, db, caplog, shape):
    g = guard(tmp_path, NOW)
    _call(db, g)
    (home,) = g.homes
    shutil.rmtree(home)
    if shape == "file":
        home.write_text("a file", encoding="utf-8")
    else:
        home.symlink_to(_precious(tmp_path / "victim").parent, target_is_directory=True)
    ai_call.remove_homes(g)
    assert home.is_symlink() or home.read_text(encoding="utf-8") == "a file"
    assert "could not remove" not in caplog.text
