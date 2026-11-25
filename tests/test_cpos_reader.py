"""owners/cpos_reader.py and the launcher's `--reading-notes`: notes follow the instructions of the
module they are for, pinned to the source they were written from. Texts here are literal."""

import hashlib

import pytest

from deploy_workflow.owners import cpos_launch, cpos_reader
from deploy_workflow.owners.cpos_launch import METHOD_MARK, LaunchRefused, method_text, prepare
from tests.test_cpos_launch import context_file, issuer_folder

SHA = "c" * 64


def notes_folder(tmp_path, name="agreement.jsonl", sha256=SHA, notes="p.3 | Covenant | 7.25x"):
    folder = tmp_path / "notes" / "CP-4"
    folder.mkdir(parents=True)
    (folder / f"{name}.notes.md").write_text(cpos_reader.notes_file(name, sha256, notes))
    return tmp_path / "notes"


def test_a_modules_notes_follow_the_rule_under_the_name_of_their_document(tmp_path):
    block = cpos_reader.notes_block("CP-4", notes_folder(tmp_path), {"agreement.jsonl": SHA})
    assert block == (
        "\n" + cpos_reader.NOTES_RULE + "\n\n### Notes on agreement.jsonl\n\n"
        "p.3 | Covenant | 7.25x\n"
    )
    assert "a finding aid, not a source" in block and "the page governs" in block


def test_no_notes_and_a_module_without_a_reader_give_nothing(tmp_path):
    folder = notes_folder(tmp_path)
    assert cpos_reader.notes_block("CP-4", tmp_path / "elsewhere", {}) == ""
    (folder / "CP-1").mkdir()
    (folder / "CP-1" / "a.notes.md").write_text(cpos_reader.notes_file("a", SHA, "n"))
    assert cpos_reader.notes_block("CP-1", folder, {"a": SHA}) == ""  # no reader is defined for it


@pytest.mark.parametrize(
    ("sources", "text", "why"),
    [
        ({"agreement.jsonl": "d" * 64}, None, "written for a version of agreement.jsonl"),
        ({}, None, "written for a version of agreement.jsonl"),
        ({"agreement.jsonl": SHA}, f"source: agreement.jsonl sha256 {SHA}\n\n  \n", "no notes"),
        ({"agreement.jsonl": SHA}, "p.3 | Covenant | 7.25x\n", "first line must be"),
    ],
)
def test_notes_for_another_document_or_without_content_are_refused(tmp_path, sources, text, why):
    folder = notes_folder(tmp_path)
    if text is not None:
        (folder / "CP-4" / "agreement.jsonl.notes.md").write_text(text)
    with pytest.raises(cpos_reader.NotesRefused, match=why):
        cpos_reader.notes_block("CP-4", folder, sources)


def test_the_brief_names_the_modules_own_step_titles():
    brief = cpos_reader.reader_brief("CP-4")
    assert (
        "Topics: Controlling Documents and Source Authority; Covenant Feature Register; " in brief
    )
    assert "do not interpret, compare or conclude" in brief


def test_a_launch_with_notes_adds_them_to_that_module_alone_and_pins_them(tmp_path):
    context, issuer = context_file(tmp_path), issuer_folder(tmp_path)
    plain = prepare(context, issuer, tmp_path / "plain", config="sol-medium", cap="15")
    name, spec = next(
        (n, s) for n, s in plain.plan.sources.items() if n != cpos_launch.CONTEXT_SOURCE_ID
    )
    folder = notes_folder(tmp_path, name, spec.sha256)
    noted = prepare(
        context, issuer, tmp_path / "noted", config="sol-medium", cap="15", reading_notes=folder
    )
    for module, pin in plain.plan.instructions.items():
        before = (tmp_path / "plain" / pin.path).read_bytes()
        after = (tmp_path / "noted" / noted.plan.instructions[module].path).read_bytes()
        if module != "CP-4":
            assert after == before, module
            continue
        added = cpos_reader.notes_block("CP-4", folder, {name: spec.sha256}).encode()
        assert after == before + added
        assert noted.plan.instructions[module].sha256 == hashlib.sha256(after).hexdigest()
        block = after.decode().partition(METHOD_MARK)[2]
        # the library compares the method block alone: the notes after it are not a method change
        assert cpos_reader.without_notes(block) == method_text("CP-4") + "\n"


def test_a_launch_refuses_notes_written_for_another_version_and_writes_nothing(tmp_path):
    folder = notes_folder(tmp_path, "annual.txt", "e" * 64)
    with pytest.raises(LaunchRefused, match="--reading-notes: .*this run does not pin"):
        prepare(
            context_file(tmp_path),
            issuer_folder(tmp_path),
            tmp_path / "out",
            config="sol-medium",
            cap="15",
            reading_notes=folder,
        )
    assert not (tmp_path / "out" / "workflow.json").exists()


def test_cp4s_reader_is_given_the_page_text_documents_that_are_not_financial_reports():
    documents = [
        {"source": "b-indenture.htm.jsonl", "kind": "indenture"},
        {"source": "10-K.htm.jsonl", "kind": "financial_report"},
        {"source": "a-agreement.htm.jsonl", "kind": "unrecognised"},
        {"source": "annual.pdf", "kind": "unrecognised"},
    ]
    assert cpos_reader.reader_documents("CP-4", documents) == [
        "a-agreement.htm.jsonl",
        "b-indenture.htm.jsonl",
    ]
