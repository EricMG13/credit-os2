import contextlib
import io
from datetime import UTC, datetime

import pytest
from test_signal_feeds import RSS

from deploy_workflow.signal.cli import main
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.fetch import Fetched, FetchRefused
from deploy_workflow.signal.identity import clean_name
from deploy_workflow.signal.store import add_story, open_db, propose_source, role_of


def run(tmp_path, *args):
    out = io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
        code = main(["--root", str(tmp_path), *args])
    return code, out.getvalue()


def run_split(tmp_path, *args):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = main(["--root", str(tmp_path), *args])
    return code, out.getvalue(), err.getvalue()


def test_propose_approve_list(tmp_path, monkeypatch):
    monkeypatch.setattr("deploy_workflow.signal.cli.check_address", lambda url: None)
    assert (
        run(
            tmp_path,
            "sources",
            "propose",
            "Authority",
            "--kind",
            "regulator",
            "--url",
            "https://a.org/f",
            "--by",
            "ak",
        )[0]
        == 0
    )
    code, out = run(tmp_path, "sources", "list")
    assert code == 0 and "proposed" in out and "never checked" in out and "Authority" in out
    assert run(tmp_path, "sources", "approve", "1")[0] == 0
    assert "approved" in run(tmp_path, "sources", "list")[1]


def test_proposing_a_private_address_is_refused(tmp_path):
    code, out = run(
        tmp_path,
        "sources",
        "propose",
        "X",
        "--kind",
        "news",
        "--url",
        "https://127.0.0.1/f",
        "--by",
        "ak",
    )
    assert code == 2 and "plain host name" in out
    assert run(tmp_path, "sources", "list")[1].strip() == ""


def test_proposing_a_name_that_resolves_privately_is_refused(tmp_path, monkeypatch):
    monkeypatch.setattr("deploy_workflow.signal.fetch._resolve", lambda host: ["10.0.0.5"])
    code, out = run(
        tmp_path,
        "sources",
        "propose",
        "X",
        "--kind",
        "news",
        "--url",
        "https://feeds.example.org/f",
        "--by",
        "ak",
    )
    assert code == 2 and "public" in out
    assert run(tmp_path, "sources", "list")[1].strip() == ""


def test_invalid_role_exits_2(tmp_path):
    assert run(tmp_path, "users", "add", "X", "--role", "admin")[0] == 2


class _Clock(datetime):
    @classmethod
    def now(cls, tz=None):
        return cls(2026, 11, 13, 10, 0, tzinfo=tz)


def test_ingest_and_stories_with_recorded_feed(tmp_path, monkeypatch):
    monkeypatch.setattr("deploy_workflow.signal.cli.check_address", lambda url: None)
    monkeypatch.setattr("deploy_workflow.signal.cli.datetime", _Clock)
    monkeypatch.setattr(
        "deploy_workflow.signal.ingest.fetch.fetch", lambda u, e, m: Fetched(RSS, None, None)
    )
    run(
        tmp_path,
        "sources",
        "propose",
        "Authority",
        "--kind",
        "regulator",
        "--url",
        "https://a.org/f",
        "--by",
        "ak",
    )
    run(tmp_path, "sources", "approve", "1")
    code, out = run(tmp_path, "ingest")
    assert code == 0 and "2 new" in out
    code, out = run(tmp_path, "stories")
    # the undated item is shown with the fetch time (10:00), the dated one with its own time
    assert out.splitlines() == [
        "2026-11-13 10:00  Authority  No date",
        "2026-11-13 08:00  Authority  Authority opens review",
    ]


def test_sources_list_shows_why_a_source_is_failing(tmp_path, monkeypatch):
    monkeypatch.setattr("deploy_workflow.signal.cli.check_address", lambda url: None)

    def refuse(u, e, m):
        raise FetchRefused("server answered HTTP 503")

    monkeypatch.setattr("deploy_workflow.signal.ingest.fetch.fetch", refuse)
    run(
        tmp_path,
        "sources",
        "propose",
        "B",
        "--kind",
        "news",
        "--url",
        "https://b.org/f",
        "--by",
        "x",
    )
    run(tmp_path, "sources", "approve", "1")
    run(tmp_path, "ingest")
    out = run(tmp_path, "sources", "list")[1]
    assert "failing" in out and "server answered HTTP 503" in out


def test_story_count_of_others_counts_sources_not_links(tmp_path):
    db = open_db(tmp_path)
    for n in (1, 2):
        propose_source(db, f"S{n}", "news", f"https://s{n}.org/f", "x")
    t = datetime(2026, 11, 13, 9, tzinfo=UTC)
    title = "Authority opens in depth review"
    add_story(db, 1, Entry(title, "https://s1.org/1", t, ""), t)
    add_story(db, 2, Entry(title, "https://s2.org/1", t, ""), t)
    add_story(db, 2, Entry(title, "https://s2.org/2", t, ""), t)
    db.close()
    assert run(tmp_path, "stories")[1].splitlines() == [f"2026-11-13 09:00  S1  {title} (+1)"]


def test_approving_an_unknown_source_exits_2_with_one_line(tmp_path):
    code, out, err = run_split(tmp_path, "sources", "approve", "999")
    assert code == 2 and out == "" and err.splitlines() == ["error: no source with id 999"]


def test_adding_a_user_with_an_empty_name_exits_2(tmp_path):
    code, out, err = run_split(tmp_path, "users", "add", "", "--role", "reader")
    assert code == 2 and out == "" and err.splitlines() == ["error: display name is empty"]


def test_users_add_stores_the_name_the_page_looks_up(tmp_path):
    messy = "  B.   Novak "
    assert run(tmp_path, "users", "add", messy, "--role", "writer")[0] == 0
    db = open_db(tmp_path)
    try:
        assert role_of(db, clean_name(messy)) == "writer"
        assert [row["name"] for row in db.execute("SELECT name FROM users")] == ["B. Novak"]
    finally:
        db.close()


def test_users_add_refuses_a_name_that_cleans_to_nothing_in_one_line(tmp_path):
    code, out, err = run_split(tmp_path, "users", "add", "\u200b \t", "--role", "reader")
    assert code == 2 and out == "" and err.splitlines() == ["error: display name is empty"]


@pytest.mark.parametrize("limit", ["0", "-1", "x"])
def test_stories_limit_must_be_a_positive_integer(tmp_path, limit):
    code, out, err = run_split(tmp_path, "stories", "--limit", limit)
    assert code == 2 and out == ""
    assert err.strip().splitlines()[-1].endswith("--limit: must be an integer >= 1")


def test_topics_add_and_list(tmp_path):
    assert (
        run(
            tmp_path,
            "topics",
            "add",
            "Competition",
            "--keywords",
            "merger review,remedy",
            "--by",
            "ak",
        )[0]
        == 0
    )
    code, out = run(tmp_path, "topics", "list")
    assert code == 0 and len(out.splitlines()) == 1 and "Competition" in out


def test_topic_with_no_keywords_exits_2_with_one_line(tmp_path):
    code, out, err = run_split(tmp_path, "topics", "add", "X", "--keywords", "", "--by", "ak")
    assert code == 2 and out == "" and len(err.splitlines()) == 1


def test_kinds_with_spaces_after_commas_are_trimmed(tmp_path):
    code, _ = run(
        tmp_path,
        "topics",
        "add",
        "T",
        "--keywords",
        "review",
        "--kinds",
        "regulator, news",
        "--by",
        "ak",
    )
    assert code == 0


def _group_store(tmp_path):
    """Desk (everyone) with Mara L's note thread 1 and her comment 1; Spare (everyone) empty."""
    from deploy_workflow.signal import groups, threads
    from deploy_workflow.signal.identity import User

    db = open_db(tmp_path)
    mara = User("Mara L", "writer")
    desk = groups.create_group(db, mara, "Desk", "everyone")
    groups.create_group(db, mara, "Spare", "everyone")
    thread, _ = threads.share(db, mara, desk, threads.Item(None, "Note"), datetime.now(UTC))
    threads.comment(db, mara, thread, "Mine", datetime.now(UTC))
    db.close()


def _count(tmp_path, table):
    db = open_db(tmp_path)
    try:
        return db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    finally:
        db.close()


def test_the_owner_removes_any_comment_leaving_a_line(tmp_path):
    _group_store(tmp_path)
    assert run(tmp_path, "comments", "remove", "1") == (
        0,
        "comment 1 removed; a removed line stays in its thread\n",
    )
    db = open_db(tmp_path)
    row = db.execute("SELECT body, removed_at IS NOT NULL FROM comments WHERE id=1").fetchone()
    db.close()
    assert tuple(row) == ("", 1)
    assert run(tmp_path, "comments", "remove", "9") == (2, "error: no comment with id 9\n")


def test_the_owner_removes_a_thread_with_its_comments(tmp_path):
    _group_store(tmp_path)
    assert run(tmp_path, "threads", "remove", "1") == (
        0,
        "thread 1 removed with 1 comment line\n",
    )
    assert (_count(tmp_path, "threads"), _count(tmp_path, "comments")) == (0, 0)
    assert run(tmp_path, "threads", "remove", "1") == (2, "error: no thread with id 1\n")


def test_a_group_with_threads_is_deleted_only_with_its_threads(tmp_path):
    _group_store(tmp_path)
    assert run(tmp_path, "groups", "delete", "1") == (
        2,
        "error: a group that holds threads cannot be deleted\n",
    )
    assert run(tmp_path, "groups", "delete", "2") == (0, "group 2 deleted\n")
    assert run(tmp_path, "groups", "delete", "1", "--with-threads") == (0, "group 1 deleted\n")
    assert [_count(tmp_path, t) for t in ("groups", "threads", "comments")] == [0, 0, 0]
    assert run(tmp_path, "groups", "delete", "1") == (2, "error: no group with id 1\n")


def test_the_owner_prunes_old_topic_posts_of_a_group(tmp_path):
    _group_store(tmp_path)
    db = open_db(tmp_path)
    stamp = "2020-01-01T00:00:00+00:00"
    with db:
        db.execute("INSERT INTO topics VALUES(1, 'Plants', '[\"p\"]', '[]', 'Mara L', ?)", (stamp,))
        db.executemany(
            "INSERT INTO threads(group_id, created_at, topic_id, note, last_activity_at)"
            " VALUES(1, ?, 1, 'posted', ?)",
            [(stamp, stamp)] * 2,
        )
    db.close()
    assert run(tmp_path, "groups", "prune", "1", "--older-than", "30") == (
        0,
        "group 1: 2 topic posts removed\n",
    )
    assert _count(tmp_path, "threads") == 1  # the person's note thread stays
    assert run(tmp_path, "groups", "prune", "1", "--older-than", "30") == (
        0,
        "group 1: 0 topic posts removed\n",
    )
    assert run(tmp_path, "groups", "prune", "9", "--older-than", "30") == (
        2,
        "error: no group with id 9\n",
    )
    assert run(tmp_path, "groups", "prune", "1")[0] == 2  # --older-than is required
    assert run(tmp_path, "groups", "prune", "1", "--older-than", "0")[0] == 2


@pytest.mark.parametrize("args", [("threads", "remove", "x"), ("comments", "remove", "0")])
def test_moderation_ids_must_be_positive_integers(tmp_path, args):
    assert run(tmp_path, *args)[0] == 2


# Review finding F6: a command the store or the system refuses answers one sentence and exit 2,
# never a traceback.


@pytest.mark.parametrize(
    ("args", "sentence"),
    [
        (("groups", "prune", "1", "--older-than", "99999999999"), "--older-than: must be"),
        (("groups", "prune", "99999999999999999999", "--older-than", "3"), "id: must be"),
        (("threads", "remove", "99999999999999999999"), "id: must be"),
        (("comments", "remove", str(2**63)), "id: must be"),
        (("sources", "approve", str(2**63)), "id: must be"),
    ],
)
def test_a_number_beyond_what_the_store_holds_is_a_usage_error(tmp_path, args, sentence):
    code, out, err = run_split(tmp_path, *args)
    assert (code, out) == (2, "")
    assert sentence in err.strip().splitlines()[-1]


def test_the_largest_id_the_store_holds_is_accepted_and_answered_as_unknown(tmp_path):
    assert run(tmp_path, "threads", "remove", str(2**63 - 1)) == (
        2,
        f"error: no thread with id {2**63 - 1}\n",
    )
    assert run(tmp_path, "groups", "prune", "1", "--older-than", "36500") == (
        2,
        "error: no group with id 1\n",
    )


def test_a_store_that_is_not_a_database_is_one_sentence_and_exit_two(tmp_path):
    (tmp_path / "signal").mkdir()
    (tmp_path / "signal" / "signal.db").write_text("this is not a database, just text" * 20)
    code, out, err = run_split(tmp_path, "stories")
    assert (code, out) == (2, "")
    store = tmp_path / "signal" / "signal.db"
    assert err.splitlines() == [f"error: the store {store} cannot be used: file is not a database"]


def test_a_root_that_is_a_file_is_one_sentence_and_exit_two(tmp_path):
    root = tmp_path / "not-a-folder"
    root.write_text("x")
    code, out, err = run_split(root, "users", "add", "Zed", "--role", "reader")
    assert (code, out) == (2, "")
    assert err.startswith("error: the store ") and err.count("\n") == 1


# Review finding F4: the owner removes sources and digests on the command line.


def _two_sources(tmp_path):
    db = open_db(tmp_path)
    for n, name in ((1, "Wire"), (2, "Daily")):
        db.execute(
            "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
            " VALUES(?, 'news', ?, 'approved', 'Mara L', 'x')",
            (name, f"https://{name.lower()}.example/feed"),
        )
        db.commit()
        for k in range(3):
            at = datetime(2026, 11, 24, 12, k, tzinfo=UTC)
            add_story(
                db, n, Entry(f"{name} item {k} unique{k}", f"https://x.example/{n}/{k}", at, ""), at
            )
    db.commit()
    db.close()


def test_the_owner_removes_a_source_and_its_stories_only_with_the_flag(tmp_path):
    _two_sources(tmp_path)
    assert run(tmp_path, "sources", "remove", "1") == (
        2,
        "error: source 1 has 3 stories; remove them with it using --with-stories\n",
    )
    assert run(tmp_path, "sources", "remove", "1", "--with-stories") == (
        0,
        "source 1 removed with 3 stories\n",
    )
    assert _count(tmp_path, "stories") == 3
    assert run(tmp_path, "sources", "remove", "1") == (2, "error: no source with id 1\n")
    assert run(tmp_path, "sources", "list")[1].splitlines()[0].startswith("2  approved")
    assert run(tmp_path, "sources", "remove", "0")[0] == 2


def test_a_source_with_no_stories_is_removed_without_the_flag(tmp_path):
    db = open_db(tmp_path)
    propose_source(db, "Proposal", "news", "https://p.example/feed", "Mara L")
    db.close()
    assert run(tmp_path, "sources", "remove", "1") == (0, "source 1 removed\n")
    assert _count(tmp_path, "sources") == 0


def _digest_store(tmp_path):
    from deploy_workflow.signal import digests

    db = open_db(tmp_path)
    when = datetime(2026, 11, 24, 12, tzinfo=UTC)
    for owner, name in (("Mara L", "Brief"), ("Mara L", "Second"), ("Ines K", "Brief")):
        form = digests.Form(name, ["All stories"], "Weekly, Friday 07:00 UTC", "Up to 5 points", "")
        digests.create(db, owner, digests.spec_from_form(db, owner, form), when)
    db.close()


def test_the_owner_lists_and_removes_digests(tmp_path):
    _digest_store(tmp_path)
    code, out = run(tmp_path, "digests", "list")
    assert code == 0 and out.splitlines() == [
        "1  Mara L  weekly  next 2026-11-27 07:00 UTC  Brief",
        "2  Mara L  weekly  next 2026-11-27 07:00 UTC  Second",
        "3  Ines K  weekly  next 2026-11-27 07:00 UTC  Brief",
    ]
    assert run(tmp_path, "digests", "remove", "2") == (0, "digest 2 removed (it was Mara L's)\n")
    assert run(tmp_path, "digests", "remove", "2") == (2, "error: no digest with id 2\n")
    assert run(tmp_path, "digests", "remove", "--owner", "Mara  L") == (
        0,
        "1 digest of Mara L removed\n",
    )
    assert run(tmp_path, "digests", "remove", "--owner", "Mara L") == (
        2,
        "error: Mara L has no digests\n",
    )
    assert [line.split("  ")[1] for line in run(tmp_path, "digests", "list")[1].splitlines()] == [
        "Ines K"
    ]


def test_removing_a_digest_needs_an_id_or_an_owner_not_both(tmp_path):
    _digest_store(tmp_path)
    for args in (("digests", "remove"), ("digests", "remove", "1", "--owner", "Ines K")):
        assert run(tmp_path, *args) == (
            2,
            "error: name one digest by its id, or one person with --owner, not both or neither\n",
        )
    assert _count(tmp_path, "digests") == 3
    assert run(tmp_path, "digests", "list")[0] == 0
