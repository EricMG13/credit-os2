"""``_stored(strict=True)`` forgives only a vanished folder; any other walk error is a Refused."""

from __future__ import annotations

import errno
import os
from pathlib import Path

import pytest

from deploy_workflow.run_start import submissions
from deploy_workflow.run_start.submissions import Refused


def _walk_failing_with(error: OSError, monkeypatch: pytest.MonkeyPatch) -> None:
    real_walk = os.walk

    def walk(top, topdown=True, onerror=None, followlinks=False):  # type: ignore[no-untyped-def]
        if onerror is not None:
            onerror(error)
        yield from real_walk(top, topdown=topdown, onerror=onerror, followlinks=followlinks)

    monkeypatch.setattr(os, "walk", walk)


@pytest.mark.parametrize(
    "make_error",
    [
        lambda sub: OSError(errno.EIO, "Input/output error", str(sub)),
        lambda sub: OSError(errno.ESTALE, "Stale file handle", str(sub)),
        lambda sub: OSError(errno.ELOOP, "Too many levels of symbolic links", str(sub)),
        lambda sub: NotADirectoryError(errno.ENOTDIR, "Not a directory", str(sub)),
        lambda sub: PermissionError(errno.EACCES, "Permission denied", str(sub)),
    ],
)
def test_strict_refuses_any_walk_error_except_a_vanished_folder(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, make_error
) -> None:  # type: ignore[no-untyped-def]
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "a.txt").write_text("x")
    _walk_failing_with(make_error(sub), monkeypatch)
    with pytest.raises(Refused) as caught:
        submissions._stored(tmp_path, strict=True)
    assert str(caught.value) == "'sub' cannot be read"


def test_strict_forgives_a_vanished_folder(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (tmp_path / "a.txt").write_text("hello")
    sub = tmp_path / "gone"
    _walk_failing_with(FileNotFoundError(errno.ENOENT, "No such file", str(sub)), monkeypatch)
    assert submissions._stored(tmp_path, strict=True) == {"a.txt": 5}


def test_non_strict_ignores_walk_errors(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (tmp_path / "a.txt").write_text("hello")
    real_walk = os.walk
    seen: list[object] = []

    def walk(top, topdown=True, onerror=None, followlinks=False):  # type: ignore[no-untyped-def]
        seen.append(onerror)
        yield from real_walk(top, topdown=topdown, onerror=onerror, followlinks=followlinks)

    monkeypatch.setattr(os, "walk", walk)
    assert submissions._stored(tmp_path) == {"a.txt": 5}
    assert seen == [None]


def test_walk_root_error_is_shown_as_a_folder(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    error = OSError(errno.EIO, "Input/output error", str(tmp_path))
    _walk_failing_with(error, monkeypatch)
    with pytest.raises(Refused) as caught:
        submissions._stored(tmp_path, strict=True)
    assert str(caught.value) == "'a folder' cannot be read"
