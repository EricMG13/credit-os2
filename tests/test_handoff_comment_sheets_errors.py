"""A damaged worksheet relationship part never stops source pages (S02 C2 round 3, finding N-A)."""

import dataclasses
import io
import logging
import struct
import zipfile
from pathlib import Path

import pytest

from deploy_workflow.model import handoff
from deploy_workflow.model.handoff import ModuleTools
from tests.test_handoff_loop import task
from tests.test_handoff_workbook_pages import HEAD, ROWS, _book, _two_sheet_book

MEMBER = "xl/worksheets/_rels/sheet1.xml.rels"
MODES = ["deflate", "method", "encrypted"]


def _damaged(raw: bytes, member: str, mode: str) -> bytes:
    """The workbook with `member` deflated and then damaged; every other member stored."""
    source = zipfile.ZipFile(io.BytesIO(raw))
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_STORED) as target:
        for info in source.infolist():
            kind = zipfile.ZIP_DEFLATED if info.filename == member else zipfile.ZIP_STORED
            target.writestr(info.filename, source.read(info.filename), compress_type=kind)
    data = bytearray(buffer.getvalue())
    info = zipfile.ZipFile(io.BytesIO(bytes(data))).getinfo(member)
    off = info.header_offset
    pos = next(
        p
        for p in range(len(data) - 46)
        if data[p : p + 4] == b"PK\x01\x02"
        and struct.unpack_from("<I", data, p + 42)[0] == off
        and bytes(data[p + 46 : p + 46 + len(member)]) == member.encode()
    )
    if mode == "deflate":
        name_len, extra_len = struct.unpack_from("<HH", data, off + 26)
        start = off + 30 + name_len + extra_len
        data[start : start + info.compress_size] = b"\xff" * info.compress_size
    elif mode == "method":
        struct.pack_into("<H", data, off + 8, 99)
        struct.pack_into("<H", data, pos + 10, 99)
    else:
        for at in (off + 6, pos + 8):
            flags = struct.unpack_from("<H", data, at)[0] | 0x1
            struct.pack_into("<H", data, at, flags)
    return bytes(data)


def _comment_free_two_sheets() -> bytes:
    source = zipfile.ZipFile(io.BytesIO(_two_sheet_book()))
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as target:
        for name in source.namelist():
            if not name.startswith("xl/comments"):
                target.writestr(name, source.read(name))
    return buffer.getvalue()


@pytest.mark.parametrize("mode", MODES)
def test_a_damaged_sheet_rels_part_in_a_comment_free_workbook_leaves_both_pages(
    mode: str, tmp_path: Path
) -> None:
    raw = _damaged(_comment_free_two_sheets(), MEMBER, mode)
    notes = HEAD.split("\n", 1)[1]
    assert handoff._workbook_pages(raw) == [
        "Sheet Annual\n" + notes + "B2=1",
        "Sheet Quarterly\n" + notes + "B2=2",
    ]
    base = task()
    module = ModuleTools(
        dataclasses.replace(base, sources={"book.xlsx": raw}),
        tmp_path,
        lambda _task, _raw: (),
    )
    assert len(module.sources["book.xlsx"]["pages"]) == 2


@pytest.mark.parametrize("mode", MODES)
def test_a_comment_free_workbook_does_not_resolve_comment_sheets(
    mode: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(_raw: bytes) -> dict[str, str]:
        raise AssertionError("_comment_sheets called")

    monkeypatch.setattr(handoff, "_comment_sheets", fail)
    assert handoff._workbook_pages(_book(ROWS)) == [HEAD + "B2=20 | C2=7"]


@pytest.mark.parametrize("mode", MODES)
def test_one_bad_sheet_does_not_drop_the_later_sheet_name(
    mode: str, caplog: pytest.LogCaptureFixture
) -> None:
    raw = _damaged(_two_sheet_book(), MEMBER, mode)
    with caplog.at_level(logging.WARNING, logger="deploy_workflow.model.handoff"):
        last = handoff._workbook_pages(raw)[-1]
    assert last == (
        "Cell comments\nxl/comments1.xml B2 by A: 'annual note'\n"
        "Quarterly B2 by B: 'quarterly restated'"
    )
    (record,) = [r for r in caplog.records if r.levelno == logging.WARNING]
    assert record.name == "deploy_workflow.model.handoff"
    assert "Annual" in record.getMessage()
