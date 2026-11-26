"""PR 7a task 3 (owner, 2026-11-26): the run start service for a custom run. Offline, synthetic,
no provider, no spend (the fake launcher).

Answer key: the figures are those of `test_custom_estimate.KEY`, the frozen answer key of the PR
(.superpowers/sdd/pr-7a-custom-routing/answer-key-caps.md) copied as literals there. The preset
digest pinned below was computed on `main` (8dcb3c0b) with these same inputs, not read from this
branch's code."""

from __future__ import annotations

import json
import tempfile
import threading
from collections.abc import Callable, Iterator
from dataclasses import replace
from pathlib import Path
from typing import Any

import pytest
from inbox_fixtures import CONTEXT, layout, pump, settings
from library_fixtures import make_run
from test_cpos_launch import context_file
from test_custom_estimate import CHOSEN, KEY, _figures
from test_run_start_service import Service
from test_run_start_submissions import answers_for, upload_issuer

from deploy_workflow.credit_os_chips import MODULE_NAMES
from deploy_workflow.inbox import activity, runs, teams
from deploy_workflow.inbox.layout import Layout, ensure_layout
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.owners import cpos_launch
from deploy_workflow.run_start import service, submissions
from deploy_workflow.run_start.submissions import Refused

pytest_plugins = ["inbox_fixtures"]

SOURCE_REASON = "Every run needs the source register and the financial base."
CP8_REASON = "Compares this run with the earlier run named in this summary."
PAGE_ONLY = {"CP-0", "CP-DR", "CP-2E", "CP-5"}
# Pinned on `main` (8dcb3c0b): folder_digest and bound for the preset inputs of `_pinned_inputs`.
MAIN_PRESET_DIGEST = "f00b3c0aefe401c806fa101cdd41834c67528bcd7757eed473e9aadd74253cbf"
MAIN_PRESET_BOUND = "c6373f7c63ea5025e070b50d533f23c9d45614e6a7e3df48c393ce6d5990fdce"


@pytest.fixture
def lay() -> Iterator[Layout]:
    with tempfile.TemporaryDirectory(prefix="ib", dir="/tmp") as short:
        yield ensure_layout(Path(short))


def custom_answers(tmp_path: Path, chosen: list[str], effort: str = "balanced", **change: Any):
    context = json.loads(context_file(tmp_path, "custom").read_text())
    return answers_for(
        tmp_path, context=context, modules=chosen, level="advanced", effort=effort, **change
    )


# --- the summary ---------------------------------------------------------------------------


@pytest.mark.parametrize("key", KEY, ids=lambda k: f"{k.selection}-{k.cp8}-{k.effort}")
def test_the_summary_of_a_custom_run_is_the_answer_keys_estimate(lay, tmp_path, key):
    sid, _ = upload_issuer(lay, tmp_path)
    if key.cp8:
        make_run(lay.engine, "prior-1", as_of="2024-12-31", pathway="custom")
    got = submissions.summary(lay, sid, custom_answers(tmp_path, CHOSEN[key.selection], key.effort))
    assert got["error"] == "", got["error"]
    estimate = got["estimate"]
    assert [(r["module"], r["usd"]) for r in estimate["rows"]] == [
        (module, f"{value:.2f}") for module, value in _figures(key.per)
    ]
    assert (estimate["sum"], estimate["hold"], estimate["cap"]) == (
        key.total,
        key.hold,
        str(key.cap),
    )
    assert got["cap"] == str(key.cap)
    assert estimate["label"] == "Estimated from earlier runs"
    assert [r["module"] for r in estimate["rows"]] == [m for m in got["modules"] if m != "CP-MODEL"]
    for row in estimate["rows"]:
        assert row["name"] == MODULE_NAMES[row["module"]]
        assert isinstance(row["measured"], bool)
        assert row["modules_page_only"] is (row["module"] in PAGE_ONLY)
        assert "CP-" not in (row["added"] or "")


def test_the_summary_says_why_each_module_was_added(lay, tmp_path):
    sid, _ = upload_issuer(lay, tmp_path)
    make_run(lay.engine, "prior-1", as_of="2024-12-31", pathway="custom")
    got = submissions.summary(lay, sid, custom_answers(tmp_path, ["CP-6"]))
    rows = {r["module"]: r for r in got["estimate"]["rows"]}
    assert rows["CP-6"]["added"] is None
    assert rows["CP-0"]["added"] == rows["CP-1"]["added"] == SOURCE_REASON
    assert rows["CP-1A"]["added"] == "Needed by Fundamental credit."
    assert rows["CP-8"]["added"] == CP8_REASON
    assert got["estimate"]["rows"][-1]["module"] == "CP-8"


def test_portfolio_fit_at_balanced_shows_cap_13_not_12(lay, tmp_path):
    sid, _ = upload_issuer(lay, tmp_path)
    fast = submissions.summary(lay, sid, custom_answers(tmp_path, ["CP-6"], "fast"))
    balanced = submissions.summary(lay, sid, custom_answers(tmp_path, ["CP-6"], "balanced"))
    assert (fast["cap"], balanced["cap"]) == ("12", "13")


def test_the_issued_cap_is_the_computed_one_and_is_recorded(lay, tmp_path):
    sid, _ = upload_issuer(lay, tmp_path)
    got = submissions.summary(lay, sid, custom_answers(tmp_path, ["CP-4"]))
    assert got["cap"] == "9"
    assert submissions.issued_cap(lay, sid) == "9"


def test_a_completion_refusal_is_the_summarys_error_with_no_digest(lay, tmp_path):
    sid, _ = upload_issuer(lay, tmp_path)
    got = submissions.summary(lay, sid, custom_answers(tmp_path, ["CP-8"]))
    assert "digest" not in got and "planned automatically" in got["error"]
    assert submissions.issued(lay, sid) == ""


def test_the_summarys_digest_binds_the_issued_cap(lay, tmp_path):
    sid, _ = upload_issuer(lay, tmp_path)
    answers = custom_answers(tmp_path, ["CP-4"])
    got = submissions.summary(lay, sid, answers)
    plain = submissions.bound(submissions.digest(lay, sid, answers), "none")
    assert got["digest"] == submissions.bound_cap(plain, got["cap"])
    assert got["digest"] != plain
    assert submissions.bound_cap(plain, "10") != submissions.bound_cap(plain, "9")


def _pinned_inputs(tmp_path: Path):
    answers = answers_for(tmp_path)
    files = tmp_path / "files"
    files.mkdir()
    (files / "a.txt").write_bytes(b"Net sales were 100.")
    return files, answers


def test_a_preset_digest_is_what_main_computed(tmp_path):
    files, answers = _pinned_inputs(tmp_path)
    value = submissions.folder_digest(files, answers)
    assert value == MAIN_PRESET_DIGEST
    assert submissions.bound(value, "prior-1") == MAIN_PRESET_BOUND


def test_a_preset_summary_still_shows_and_records_the_table_cap(lay, tmp_path):
    sid, _ = upload_issuer(lay, tmp_path)
    got = submissions.summary(lay, sid, answers_for(tmp_path))
    assert got["error"] == ""
    assert got["cap"] == "20" and "estimate" not in got
    assert submissions.issued_cap(lay, sid) == "20"
    assert got["digest"] == submissions.bound(
        submissions.digest(lay, sid, answers_for(tmp_path)), "none"
    )


# --- the answers ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("change", "reason"),
    [
        ({"model": "claude"}, "choose GPT"),
        ({"model": "luna", "effort": "xhigh"}, "choose GPT"),
        ({"level": "basic"}, "Custom selection is offered at the Advanced level."),
        ({"level": "standard"}, "Custom selection is offered at the Advanced level."),
        ({"model": "claude", "level": "basic"}, "Custom selection is offered at the Advanced"),
    ],
)
def test_a_custom_run_is_advanced_and_gpt_only(lay, tmp_path, change, reason):
    answers = custom_answers(tmp_path, ["CP-4"])
    answers.update(change)
    with pytest.raises(Refused, match=reason):
        submissions.validated(answers)
    sid, _ = upload_issuer(lay, tmp_path)
    got = submissions.summary(lay, sid, answers)
    assert reason in got["error"] and "digest" not in got


def test_the_gpt_refusal_says_to_choose_gpt(tmp_path):
    answers = custom_answers(tmp_path, ["CP-4"], model="claude")
    with pytest.raises(Refused) as raised:
        submissions.validated(answers)
    assert str(raised.value) == "A custom selection is estimated from GPT runs only; choose GPT."


def test_a_preset_still_takes_other_models(tmp_path):
    answers = answers_for(tmp_path, level="advanced", model="claude")
    assert submissions.validated(answers)["model"] == "claude"


# --- the service: the shown cap and submit -----------------------------------------------------


@pytest.fixture
def svc(root: Path, fake_env: Callable[[dict[str, Any]], None]) -> Iterator[Service]:
    fake_env({"sleep": 30})
    watcher = Scheduler(settings(root))
    server = service.make_server(watcher, "127.0.0.1", 0)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield Service(watcher, server, root, shown_cap=None)
    server.shutdown()
    server.server_close()
    watcher.close()


def _http_answers(**change: Any) -> dict[str, Any]:
    context = json.loads(json.dumps(CONTEXT))
    context["run"].update(pathway="custom", as_of="2026-11-09")
    context["identity"].update(issuer_id="acme", issuer_name="Acme Corp")
    base: dict[str, Any] = {
        "context": context,
        "modules": ["CP-6"],
        "max_turns": 32,
        "level": "advanced",
        "model": "gpt",
        "effort": "balanced",
        "submitted_by": "Ana L",
    }
    base.update(change)
    return base


def _summary(svc: Service, sid: str, shown: str | None, answers: dict[str, Any]):
    headers = {} if shown is None else {"X-Shown-Cap": shown}
    return svc.call("POST", f"/api/submissions/{sid}/summary", answers, headers=headers)


def _submit(svc: Service, sid: str, shown: str | None, answers, digest: str):
    headers = {} if shown is None else {"X-Shown-Cap": shown}
    body = {"answers": answers, "digest": digest}
    return svc.call("POST", f"/api/submissions/{sid}/submit", body, headers=headers)


def _issued(svc: Service) -> tuple[str, dict[str, Any], dict[str, Any]]:
    sid = svc.new()
    assert svc.upload(sid, "a.txt", b"Net sales were 100.").status == 200
    answers = _http_answers()
    reply = _summary(svc, sid, "50", answers)
    assert reply.status == 200 and reply.json()["error"] == "", reply.body
    return sid, answers, reply.json()


def test_the_custom_summary_needs_the_ceiling_in_the_shown_cap_header(svc):
    sid = svc.new()
    svc.upload(sid, "a.txt", b"Net sales were 100.")
    answers = _http_answers()
    assert _summary(svc, sid, "50", answers).status == 200
    for shown in (None, "12", "13", "49", "50.0", "051", ""):
        reply = _summary(svc, sid, shown, answers)
        assert reply.status == 400, (shown, reply.body)
        assert "this page is out of date" in reply.json()["error"]


def test_a_custom_submit_must_carry_the_cap_the_summary_issued(svc):
    sid, answers, issued = _issued(svc)
    assert issued["cap"] == "13"
    for shown in ("50", None, "12", "14", "013", ""):
        reply = _submit(svc, sid, shown, answers, issued["digest"])
        assert reply.status == 400, (shown, reply.body)
        assert (
            "out of date" in reply.json()["error"]
            or "review the summary" in (reply.json()["error"])
        )
    assert _submit(svc, sid, "13", answers, issued["digest"]).status == 200
    (record,) = runs.load_all(layout(svc.root))
    assert (record.pathway, record.cap) == ("custom", "13")


def test_a_custom_submit_with_no_summary_is_refused(svc):
    sid = svc.new()
    svc.upload(sid, "a.txt", b"Net sales were 100.")
    for shown in ("50", None):
        assert _submit(svc, sid, shown, _http_answers(), "0" * 64).status == 400


def test_a_preset_still_needs_its_table_cap(svc):
    sid = svc.new()
    svc.upload(sid, "a.txt", b"Net sales were 100.")
    answers = _http_answers(modules=[])
    answers["context"]["run"]["pathway"] = "credit_snapshot"
    assert _summary(svc, sid, "50", answers).status == 400
    assert _summary(svc, sid, "30", answers).status == 200


# --- the scheduler -----------------------------------------------------------------------------


def _queued(root: Path, w: Scheduler):
    lay = layout(root)
    sid = submissions.new(lay)
    (submissions.files_folder(lay, sid) / "a.txt").write_bytes(b"Net sales were 100.")
    answers = submissions.validated(_http_answers())
    got = submissions.summary(lay, sid, answers)
    assert got["error"] == "", got["error"]
    return w.submit(sid, answers, str(got["digest"])), got


def test_a_queued_custom_run_launches_at_the_cap_its_summary_issued(root):
    w = Scheduler(settings(root))
    record, got = _queued(root, w)
    assert record.cap == got["cap"] == "13" and record.digest
    argv = runs.command(layout(root), record, Path("c.json"), launcher=("x",), ruling=None)
    assert argv[argv.index("--cap") + 1] == "13"
    assert argv[argv.index("--modules") + 1 :][:1] == ["CP-6"]


def test_a_custom_record_whose_cap_was_edited_is_refused_at_the_recheck(root):
    w = Scheduler(settings(root))
    record, _ = _queued(root, w)
    w._put(replace(record, cap="12"))
    edited = w._approval_digest(replace(record, cap="12"), layout(root).drops / record.id)
    assert edited not in ("", record.digest)  # a digest the approval does not carry
    assert w._approval_digest(record, layout(root).drops / record.id) == record.digest
    pump(w, lambda: [r.status for r in runs.load_all(layout(root))] == ["failed"])
    (after,) = runs.load_all(layout(root))
    assert after.reason == "the submitted documents changed before the run could start"


@pytest.mark.parametrize("edited", ["", "x", "0", "-1", "51", "1e1", "NaN", "9.0", "０９", "09"])
def test_a_custom_record_with_a_hostile_cap_is_refused_not_raised(root, edited):
    w = Scheduler(settings(root))
    record, _ = _queued(root, w)
    folder = layout(root).drops / record.id
    assert w._approval_digest(replace(record, cap=edited), folder) == ""


def test_a_launch_at_another_cap_than_the_computed_one_fails_loud(root, tmp_path):
    w = Scheduler(settings(root))
    record, _ = _queued(root, w)
    argv = runs.command(
        layout(root), replace(record, cap="12"), Path("c.json"), launcher=("x",), ruling=None
    )
    assert argv[argv.index("--cap") + 1] == "12"
    with pytest.raises(cpos_launch.LaunchRefused, match="review the summary again"):
        cpos_launch.prepare(
            context_file(tmp_path, "custom"),
            _source(tmp_path),
            tmp_path / "out",
            config="copilot-sol-medium",
            cap="12",
            modules=["CP-6"],
            high_modules=cpos_launch.BALANCED_HIGH_MODULES,
        )


def _source(tmp_path: Path) -> Path:
    folder = tmp_path / "src"
    folder.mkdir()
    (folder / "a.txt").write_text("Net sales were 100.")
    return folder


def test_a_tampered_issued_cap_is_a_refusal(root):
    lay = layout(root)
    w = Scheduler(settings(root))
    sid = submissions.new(lay)
    (submissions.files_folder(lay, sid) / "a.txt").write_bytes(b"Net sales were 100.")
    answers = submissions.validated(_http_answers())
    got = submissions.summary(lay, sid, answers)
    issued = lay.uploads / sid / "issued"
    issued.write_text(issued.read_text().replace("cap=13", "cap=1e1"))
    with pytest.raises(Refused, match="review the summary again"):
        w.submit(sid, answers, str(got["digest"]))


def test_a_preset_record_is_checked_against_the_table_as_before(root):
    w = Scheduler(settings(root))
    lay = layout(root)
    sid = submissions.new(lay)
    (submissions.files_folder(lay, sid) / "a.txt").write_bytes(b"Net sales were 100.")
    answers = _http_answers(modules=[], level="basic")
    answers["context"]["run"]["pathway"] = "credit_snapshot"
    answers = submissions.validated(answers)
    got = submissions.summary(lay, sid, answers)
    record = w.submit(sid, answers, str(got["digest"]))
    folder = lay.drops / record.id
    assert w._approval_digest(record, folder) == record.digest
    assert w._approval_digest(replace(record, cap="19"), folder) == ""


# --- progress views ----------------------------------------------------------------------------

COMPLETED = ["CP-0", "CP-1", "CP-1A", "CP-2", "CP-3", "CP-5", "CP-6"]


def test_a_custom_runs_modules_all_wait_before_it_starts():
    states = activity.module_states("custom", [], ("CP-6",))
    assert states == [*([m, "waiting"] for m in COMPLETED), ["Report", "waiting"]]


def test_a_custom_run_with_no_chosen_module_shows_the_two_that_open_every_run():
    assert [m for m, _ in activity.module_states("custom", [], ())[:-1]] == ["CP-0", "CP-1"]


def test_a_preset_shows_the_modules_it_always_showed():
    assert activity.module_states("credit_snapshot", [], ()) == activity.module_states(
        "credit_snapshot", [], ("CP-4",)
    )


def test_a_queued_custom_run_shows_its_completed_modules_as_waiting(svc):
    sid, answers, issued = _issued(svc)
    run = _submit(svc, sid, issued["cap"], answers, issued["digest"]).json()["run"]
    shown = svc.call("GET", f"/api/runs/{run}").json()
    assert shown["modules"] == [*([m, "waiting"] for m in COMPLETED), ["Report", "waiting"]]


def test_the_teams_progress_counts_the_completed_modules(root):
    w = Scheduler(settings(root))
    record, _ = _queued(root, w)
    assert teams.progress(layout(root), record) == (0, len(COMPLETED))


def test_the_modules_of_a_record_the_rules_refuse_fall_back_to_the_preset_list(caplog):
    states = activity.module_states("custom", [], ("CP-8",))
    assert [m for m, _ in states[:-1]] == ["CP-0", "CP-1"]
    assert "cannot be completed" in caplog.text


def test_a_custom_submit_repeated_after_a_lost_reply_returns_the_first_run(svc):
    sid, answers, issued = _issued(svc)
    first = _submit(svc, sid, issued["cap"], answers, issued["digest"])
    again = _submit(svc, sid, issued["cap"], answers, issued["digest"])
    assert (first.status, again.status) == (200, 200)
    assert again.json()["run"] == first.json()["run"]
    for shown in ("50", None, "12", ""):  # not the cap the run was approved at
        reply = _submit(svc, sid, shown, answers, issued["digest"])
        assert reply.status == 400, (shown, reply.body)
    assert len(runs.load_all(layout(svc.root))) == 1


def test_a_record_with_a_non_text_module_does_not_break_the_views():
    assert [m for m, _ in activity.module_states("custom", [], (["CP-6"], 5))[:-1]] == [
        "CP-0",
        "CP-1",
    ]


@pytest.mark.parametrize(
    "cap", ["1" * 5000, "9" * 4301, "0" * 5000], ids=["ones", "nines", "zeros"]
)
def test_custom_cap_ok_is_total(cap):
    assert submissions.custom_cap_ok(cap) is False
