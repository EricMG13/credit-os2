"""owners/cpos_reader.py and the launcher's `--reading-notes`: notes follow the instructions of the
module they are for, pinned to the source they were written from. Texts here are literal."""

import hashlib
import json

import pytest

from deploy_workflow.owners import cpos_reader
from deploy_workflow.owners.cpos_launch import METHOD_MARK, LaunchRefused, method_text, prepare
from tests.test_cpos_launch import context_file, issuer_folder

SHA = "c" * 64


def notes_folder(tmp_path, name="agreement.jsonl", sha256=SHA, notes="p.3 | Covenant | 7.25x"):
    folder = tmp_path / "notes"
    (folder / "CP-4" / f"{name}.notes.md").parent.mkdir(parents=True)
    (folder / "CP-4" / f"{name}.notes.md").write_text(cpos_reader.notes_file(name, sha256, notes))
    return folder


def put_notes(folder, module, name, sha256, notes="p.1 | topic | value"):
    path = folder / module / f"{name}.notes.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(cpos_reader.notes_file(name, sha256, notes))


AGREEMENT, REPORT = "filings/agreement.jsonl", "annual report 2024.jsonl"


def reading_issuer(tmp_path):
    """The tests' synthetic issuer plus two page-text sources a reader is given: an agreement
    (kind unrecognised) and a file the launcher takes for a financial report."""
    folder = tmp_path / "issuer"
    if folder.exists():
        return folder
    issuer_folder(tmp_path)
    page = json.dumps({"page": 1, "text": "Maximum net leverage 7.25x."}) + "\n"
    (folder / AGREEMENT).write_text(page)
    (folder / REPORT).write_text(page)
    return folder


def test_a_modules_notes_follow_the_rule_under_the_name_of_their_document(tmp_path):
    block = cpos_reader.notes_block(
        "CP-4", notes_folder(tmp_path), {"agreement.jsonl": SHA}, ["agreement.jsonl"]
    )
    assert block == (
        "\n" + cpos_reader.NOTES_RULE + "\n\n### Notes on agreement.jsonl\n\n"
        "p.3 | Covenant | 7.25x\n"
    )
    assert "a finding aid, not a source" in block and "the page governs" in block


def test_no_notes_and_a_module_without_a_reader_give_nothing(tmp_path):
    folder = notes_folder(tmp_path)
    assert cpos_reader.notes_block("CP-4", tmp_path / "elsewhere", {}, []) == ""
    (folder / "CP-6").mkdir()
    (folder / "CP-6" / "a.notes.md").write_text(cpos_reader.notes_file("a", SHA, "n"))
    assert cpos_reader.notes_block("CP-6", folder, {"a": SHA}, ["a"]) == ""  # no reader for it


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
        cpos_reader.notes_block("CP-4", folder, sources, ["agreement.jsonl"])


def test_the_brief_names_the_modules_own_step_titles():
    brief = cpos_reader.reader_brief("CP-4")
    assert (
        "Topics: Controlling Documents and Source Authority; Covenant Feature Register; " in brief
    )
    assert "do not interpret, compare or conclude" in brief


def test_a_launch_with_notes_adds_them_to_that_module_alone_and_pins_them(tmp_path):
    context, issuer = context_file(tmp_path), reading_issuer(tmp_path)
    plain = prepare(context, issuer, tmp_path / "plain", config="sol-medium", cap="15")
    sha256 = plain.plan.sources[AGREEMENT].sha256
    folder = notes_folder(tmp_path, AGREEMENT, sha256)
    noted = prepare(
        context, issuer, tmp_path / "noted", config="sol-medium", cap="15", reading_notes=folder
    )
    for module, pin in plain.plan.instructions.items():
        before = (tmp_path / "plain" / pin.path).read_bytes()
        after = (tmp_path / "noted" / noted.plan.instructions[module].path).read_bytes()
        if module != "CP-4":
            assert after == before, module
            continue
        added = cpos_reader.notes_block("CP-4", folder, {AGREEMENT: sha256}, [AGREEMENT]).encode()
        assert after == before + added
        assert noted.plan.instructions[module].sha256 == hashlib.sha256(after).hexdigest()
        block = after.decode().partition(METHOD_MARK)[2]
        # the library compares the method block alone: the notes after it are not a method change
        assert cpos_reader.without_notes(block) == method_text("CP-4") + "\n"


def refused_launch(tmp_path, folder, match):
    with pytest.raises(LaunchRefused, match=match):
        prepare(
            context_file(tmp_path, "deep_credit_assessment"),
            reading_issuer(tmp_path),
            tmp_path / "out",
            config="sol-medium",
            cap="50",
            reading_notes=folder,
        )
    assert not (tmp_path / "out" / "workflow.json").exists()


def test_a_launch_refuses_notes_written_for_another_version_and_writes_nothing(tmp_path):
    folder = notes_folder(tmp_path, AGREEMENT, "e" * 64)
    refused_launch(tmp_path, folder, "--reading-notes: .*this run does not pin")


def test_a_launch_refuses_a_notes_folder_that_does_not_exist(tmp_path):
    refused_launch(tmp_path, tmp_path / "no-such-folder", "--reading-notes: .*not a folder")


def test_a_launch_refuses_a_notes_folder_that_gives_no_module_any_notes(tmp_path):
    (tmp_path / "empty").mkdir()
    refused_launch(tmp_path, tmp_path / "empty", "--reading-notes: .*no notes for any module")


def test_a_launch_refuses_a_reading_that_stopped_before_every_document_was_read(tmp_path):
    """CP-0's reader is given two documents here; the folder has notes on one."""
    plain = prepare(
        context_file(tmp_path, "deep_credit_assessment"),
        reading_issuer(tmp_path),
        tmp_path / "plain",
        config="sol-medium",
        cap="50",
    )
    folder = tmp_path / "partial"
    put_notes(folder, "CP-0", AGREEMENT, plain.plan.sources[AGREEMENT].sha256)
    refused_launch(tmp_path, folder, f"--reading-notes: .*no notes on {REPORT}")


def test_notes_on_a_source_the_reader_is_not_given_or_two_files_on_one_are_refused(tmp_path):
    folder = tmp_path / "notes"
    put_notes(folder, "CP-4", "annual.txt", SHA)
    with pytest.raises(cpos_reader.NotesRefused, match="annual.txt is not a document CP-4's"):
        cpos_reader.notes_block("CP-4", folder, {"annual.txt": SHA}, [AGREEMENT])
    other = tmp_path / "twice"
    put_notes(other, "CP-4", AGREEMENT, SHA)
    (other / "CP-4" / "copy.notes.md").write_text(cpos_reader.notes_file(AGREEMENT, SHA, "n"))
    with pytest.raises(cpos_reader.NotesRefused, match=f"a second file of notes on {AGREEMENT}"):
        cpos_reader.notes_block("CP-4", other, {AGREEMENT: SHA}, [AGREEMENT])


def test_notes_for_one_of_two_documents_name_the_one_left_out(tmp_path):
    folder = tmp_path / "notes"
    put_notes(folder, "CP-4", "a.jsonl", SHA)
    with pytest.raises(cpos_reader.NotesRefused, match="no notes on b.jsonl, which CP-4's reader"):
        cpos_reader.notes_block("CP-4", folder, {"a.jsonl": SHA}, ["a.jsonl", "b.jsonl"])


def test_notes_in_a_subfolder_are_found_in_name_order(tmp_path):
    folder = tmp_path / "notes"
    put_notes(folder, "CP-4", "filings/agreement.jsonl", SHA, "p.1 | Covenant | 7.25x")
    put_notes(folder, "CP-4", "annual.jsonl", SHA, "p.2 | Maturity | 2029")
    block = cpos_reader.notes_block(
        "CP-4",
        folder,
        {"filings/agreement.jsonl": SHA, "annual.jsonl": SHA},
        ["annual.jsonl", "filings/agreement.jsonl"],
    )
    assert block.endswith(
        "### Notes on annual.jsonl\n\np.2 | Maturity | 2029\n\n"
        "### Notes on filings/agreement.jsonl\n\np.1 | Covenant | 7.25x\n"
    )


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


DOCUMENTS = [
    {"source": "b-indenture.htm.jsonl", "kind": "indenture"},
    {"source": "10-K.htm.jsonl", "kind": "financial_report"},
    {"source": "a-agreement.htm.jsonl", "kind": "unrecognised"},
    {"source": "annual.pdf", "kind": "financial_report"},
]
ALL = ["10-K.htm.jsonl", "a-agreement.htm.jsonl", "b-indenture.htm.jsonl"]


@pytest.mark.parametrize(
    ("module", "given"),
    [
        ("CP-0", ALL),
        ("CP-1", ["10-K.htm.jsonl"]),
        ("CP-2", ["10-K.htm.jsonl"]),
        ("CP-3", ALL),
        ("CP-4", ["a-agreement.htm.jsonl", "b-indenture.htm.jsonl"]),
        ("CP-5", ALL),
    ],
)
def test_each_reader_is_given_the_documents_its_module_works_from(module, given):
    assert cpos_reader.reader_documents(module, DOCUMENTS) == given


def test_readers_exist_for_the_core_modules_but_cp6_and_each_has_its_own_brief_and_rule():
    assert sorted(cpos_reader.READERS) == ["CP-0", "CP-1", "CP-2", "CP-3", "CP-4", "CP-5"]
    assert "CP-6" not in cpos_reader.READERS  # none of its steps is about what a source says
    briefs = {m: cpos_reader.reader_brief(m) for m in cpos_reader.READERS}
    assert len(set(briefs.values())) == len(briefs)
    for module, reader in cpos_reader.READERS.items():
        assert "Topics: " + "; ".join(reader.topics) + "." in briefs[module]
        rule = cpos_reader.notes_rule(module)
        assert "a finding aid, not a source" in rule and "the page governs" in rule
    assert "each legal document once" in cpos_reader.notes_rule("CP-4")  # as the trial gave it
    assert "each document once" in cpos_reader.notes_rule("CP-1")


# What each module's reader is given from `reading_issuer`, worked out from the readers' kinds.
GIVEN = {
    "CP-0": [REPORT, AGREEMENT],
    "CP-1": [REPORT],
    "CP-2": [REPORT],
    "CP-3": [REPORT, AGREEMENT],
    "CP-5": [REPORT, AGREEMENT],
}


@pytest.mark.parametrize("module", ["CP-0", "CP-1", "CP-2", "CP-3", "CP-5"])
def test_a_launch_gives_each_module_its_own_notes_and_no_other(tmp_path, module):
    context, issuer = context_file(tmp_path, "deep_credit_assessment"), reading_issuer(tmp_path)
    plain = prepare(context, issuer, tmp_path / "plain", config="sol-medium", cap="50")
    folder = tmp_path / "notes"
    for name in GIVEN[module]:
        put_notes(folder, module, name, plain.plan.sources[name].sha256)
    noted = prepare(
        context, issuer, tmp_path / "noted", config="sol-medium", cap="50", reading_notes=folder
    )
    changed = [
        m
        for m, pin in plain.plan.instructions.items()
        if (tmp_path / "plain" / pin.path).read_bytes()
        != (tmp_path / "noted" / noted.plan.instructions[m].path).read_bytes()
    ]
    assert changed == [module]
    text = (tmp_path / "noted" / noted.plan.instructions[module].path).read_text()
    assert text.endswith(f"### Notes on {GIVEN[module][-1]}\n\np.1 | topic | value\n")
    block = text.partition(METHOD_MARK)[2]
    assert cpos_reader.without_notes(block) == method_text(module) + "\n"
