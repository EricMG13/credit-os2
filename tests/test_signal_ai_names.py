"""Fourth review, findings N2, N3 and N9: what bounds the digest writer's paid calls per typed name.

N2: the 30-minute rule and "one paid attempt a period" were bypassed by deleting and re-creating a
digest, or by editing its schedule to the next minute; only the service's day ceiling held. Now a
name gets at most ``digests-per-name`` (default 5) paid digest calls a UTC day, counted in the
ledger (``ai_usage.owner``) and checked in the reserve transaction. N3: a name at its limit, or a
writer stopped for the day, never holds up digests that need no call, nor another name's runs.
N9: calls the adapter did not send count toward neither limit.

SYNTHETIC: every reply comes from ``signal_ai_fakes.FakeModel``; no paid or networked call is made.
Expected counts are written by hand from the scenario, not read from the production code.
"""

from __future__ import annotations

import io
import json
import threading
from contextlib import redirect_stderr, redirect_stdout
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import CONFIG, FakeModel, not_sent, ok, setup

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import ai_digest, ai_ledger, digests, store
from deploy_workflow.signal.cli import main
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.service import Loop

BASE = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
HOLD = Decimal("0.3585")


def _ids(request: TurnRequest) -> list[str]:
    lines = request.messages[1].text.splitlines()
    return [json.loads(line)["id"] for line in lines if line.startswith('{"id"')]


def written(request: TurnRequest) -> Any:
    reply = {"points": [{"lead": "L", "body": "B.", "stories": [_ids(request)[0]]}]}
    return ok(json.dumps(reply), usd="0.006")


def failing(request: TurnRequest) -> Any:
    return ok(json.dumps({"points": [{"lead": "L", "body": "B.", "stories": ["999"]}]}), "0.006")


class World:
    """A store with five stories, a cap of USD 15, and a loop whose clock the test moves."""

    def __init__(self, tmp: Path, answer: Any = written, start: datetime = BASE) -> None:
        self.root = tmp / "root"
        self.db = store.open_db(self.root)
        self.source = store.propose_source(self.db, "Wire", "news", "https://w.example/f", "x")
        for n in reversed(range(5)):  # oldest first, as ingest stores them: ids rise with time
            when = start - timedelta(hours=2 + n)
            entry = Entry(f"Bond story {n}", f"https://w.example/{n}", when, "S.")
            store.add_story(self.db, self.source, entry, when)
        ai_ledger.set_cap(self.db, Decimal(15), start)
        self.at = start
        self.model = FakeModel(answer=answer)
        self.setup = setup(tmp, self.model, clock=lambda: self.at)
        self.loop = Loop(self.root, fetch_fn=_no_fetch, ai=self.setup)

    def tick(self, at: datetime) -> None:
        self.at = at
        self.loop.run_once(at)

    def calls(self, owner: str | None = None) -> int:
        sql = "SELECT COUNT(*) FROM ai_usage WHERE purpose='digest'"
        if owner is None:
            return int(self.db.execute(sql).fetchone()[0])
        return int(self.db.execute(sql + " AND owner=?", (owner,)).fetchone()[0])

    def digest_requests(self) -> int:
        return sum("credit brief" in r.messages[0].text for r in self.model.requests)

    def digest_spent(self) -> Decimal:
        rows = self.db.execute("SELECT settled_usd FROM ai_usage WHERE purpose='digest'")
        return sum((Decimal(r[0]) for r in rows), Decimal(0))

    def digest(
        self, owner: str, schedule: str = "Monthly, day 1, 07:00 UTC", name: str = "D"
    ) -> int:
        form = digests.Form(name, ["All stories"], schedule, "Up to 3 points", "")
        spec = digests.spec_from_form(self.db, owner, form)
        return digests.create(self.db, owner, spec, self.at)


def _no_fetch(*args: object) -> Any:
    raise AssertionError("no fetch in these tests")


# N2: the reviewer's bypasses (review4/a1_digests.py) now stop at 5 paid calls for one name


def test_delete_and_recreate_stops_at_five_paid_calls_for_one_name(tmp_path):
    world = World(tmp_path)
    at = BASE
    for cycle in range(60):
        at += timedelta(minutes=1)
        world.at = at
        ident = world.digest("Mallory", name=f"D{cycle}")
        digests.request_run(world.db, "Mallory", ident, at)
        world.tick(at)
        digests.delete(world.db, "Mallory", ident)
    assert world.calls("Mallory") == 5 and world.digest_requests() == 5
    assert world.digest_spent() == Decimal("0.030")  # 5 x 0.006


def test_editing_the_schedule_to_the_next_minute_stops_at_five_calls(tmp_path):
    world = World(tmp_path)
    ident = world.digest("Mallory", "Daily, 07:00 UTC")
    for minute in range(1, 41):
        at = BASE + timedelta(minutes=2 * minute)
        slot = at + timedelta(minutes=1)
        entry = Entry(f"New {minute}", f"https://w.example/n{minute}", at, "S.")
        store.add_story(world.db, world.source, entry, at)
        form = digests.Form("D", ["All stories"], f"Daily, {slot:%H:%M} UTC", "Up to 3 points", "")
        digests.edit(
            world.db, "Mallory", ident, digests.spec_from_form(world.db, "Mallory", form), at
        )
        world.tick(slot)
    assert world.calls("Mallory") == 5
    runs = world.db.execute("SELECT outcome, COUNT(*) FROM digest_runs GROUP BY 1").fetchall()
    assert [tuple(r) for r in runs] == [("written", 5)]


def test_failed_replies_retried_by_schedule_edits_stop_at_five_paid_calls(tmp_path):
    world = World(tmp_path, failing)
    ident = world.digest("Mallory", "Daily, 07:00 UTC")
    for minute in range(1, 61):
        at = BASE + timedelta(minutes=2 * minute)
        slot = at + timedelta(minutes=1)
        form = digests.Form("D", ["All stories"], f"Daily, {slot:%H:%M} UTC", "Up to 3 points", "")
        digests.edit(
            world.db, "Mallory", ident, digests.spec_from_form(world.db, "Mallory", form), at
        )
        world.tick(slot)
    assert world.calls("Mallory") == 5
    assert world.digest_spent() == Decimal("0.030")


def test_the_name_gets_its_calls_again_after_0000_utc(tmp_path):
    world = World(tmp_path, start=datetime(2026, 11, 25, 23, 0, tzinfo=UTC))
    made = [world.digest("Mallory", name=f"D{k}") for k in range(5)]
    for ident in made:
        digests.request_run(world.db, "Mallory", ident, world.at)
    ai_ledger.set_digests_per_name(world.db, 3, world.at)
    world.tick(world.at)
    assert world.calls("Mallory") == 3
    world.tick(world.at + timedelta(minutes=30))  # still 25 Nov: the two left wait
    assert world.calls("Mallory") == 3
    world.tick(datetime(2026, 11, 26, 0, 1, tzinfo=UTC))
    assert world.calls("Mallory") == 5


def test_two_connections_racing_for_a_names_last_call_let_exactly_one_through(tmp_path):
    root = tmp_path / "root"
    db = store.open_db(root)
    ai_ledger.set_cap(db, Decimal(15), BASE)
    for _ in range(4):
        made = ai_ledger.reserve(db, "digest", CONFIG, HOLD, BASE, ruled_cap=Decimal(15), owner="M")
        ai_ledger.settle(db, made, Decimal("0.001"), "ok", BASE)
    results: list[object] = []
    barrier = threading.Barrier(5)

    def racer() -> None:
        own = store.open_db(root)
        barrier.wait()
        try:
            results.append(
                ai_ledger.reserve(
                    own, "digest", CONFIG, HOLD, BASE, ruled_cap=Decimal(15), owner="M"
                )
            )
        except ai_ledger.Refused as refused:
            results.append(refused)
        own.close()

    workers = [threading.Thread(target=racer) for _ in range(5)]
    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join()
    for _ in range(3):
        racer_serial = store.open_db(root)
        try:
            results.append(
                ai_ledger.reserve(
                    racer_serial, "digest", CONFIG, HOLD, BASE, ruled_cap=Decimal(15), owner="M"
                )
            )
        except ai_ledger.Refused as refused:
            results.append(refused)
        finally:
            racer_serial.close()
    won = [r for r in results if isinstance(r, int)]
    refused = [r for r in results if isinstance(r, ai_ledger.NameFull)]
    assert len(won) == 1 and len(refused) == 7
    assert str(refused[0]) == (
        "this name's digests have made today's 5 model calls, the most a name may make a day;"
        " they wait until 00:00 UTC"
    )
    db.close()


def test_a_digest_reservation_names_its_owner(tmp_path):
    db = store.open_db(tmp_path)
    ai_ledger.set_cap(db, Decimal(15), BASE)
    with pytest.raises(store.StoreError, match="owner"):
        ai_ledger.reserve(db, "digest", CONFIG, HOLD, BASE, ruled_cap=Decimal(15))
    assert db.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 0
    db.close()


def test_the_service_ceiling_still_binds_across_names(tmp_path):
    """50 a UTC day for the service by default: 11 names of 5 digests make 50 calls, not 55."""
    world = World(tmp_path)
    for n in range(11):
        for k in range(5):
            ident = world.digest(f"Visitor {n}", name=f"D{k}")
            digests.request_run(world.db, f"Visitor {n}", ident, world.at)
    for minute in range(8):
        world.tick(BASE + timedelta(minutes=minute))
    assert world.calls() == 50
    assert all(world.calls(f"Visitor {n}") <= 5 for n in range(11))


# The owner's command and the status


def _cli(root: Path, *args: str, ai: Any) -> tuple[int, str]:
    out = io.StringIO()
    with redirect_stdout(out), redirect_stderr(out):
        code = main(["--root", str(root), "ai", *args], ai=ai)
    return code, out.getvalue()


def test_the_owner_sets_the_digest_calls_a_name_and_status_shows_them(tmp_path):
    held = setup(tmp_path)
    root = tmp_path / "store"
    lines = _cli(root, "status", ai=held)[1].splitlines()
    assert "digest calls a name may make a day (UTC): 5" in lines
    assert _cli(root, "digests-per-name", "2", ai=held) == (
        0,
        "digest calls a name a day set to 2\n",
    )
    assert "digest calls a name may make a day (UTC): 2" in _cli(root, "status", ai=held)[1]
    assert _cli(root, "digests-per-name", "1001", ai=held) == (
        2,
        "error: the digest calls a name a day are at most 1000\n",
    )
    assert _cli(root, "digests-per-name", "x", ai=held) == (
        2,
        "error: the digest calls a name a day are a whole number, such as 5\n",
    )


# N3: digests that need no call, and other names, are never held up


def _empty_digest(world: World, owner: str) -> int:
    """A digest covering a topic no story matches: nothing in scope, no call needed."""
    from deploy_workflow.signal import topics

    topics.add_topic(world.db, f"Nothing for {owner}", ["zzqxnostorymatches"], [], owner)
    form = digests.Form(
        "E", [f"Topic: Nothing for {owner}"], "Daily, 07:00 UTC", "Up to 3 points", ""
    )
    return digests.create(world.db, owner, digests.spec_from_form(world.db, owner, form), world.at)


def test_after_the_day_is_full_digests_needing_no_call_still_run(tmp_path):
    """review4/a13_blocked.py: Vera's digest has nothing in scope; it ran only the next day."""
    world = World(tmp_path)
    ai_ledger.set_digests_per_day(world.db, 1, world.at)
    first = world.digest("Mallory", name="A")
    second = world.digest("Mallory", name="B")
    empty = _empty_digest(world, "Vera")
    for owner, ident in (("Mallory", first), ("Mallory", second), ("Vera", empty)):
        digests.request_run(world.db, owner, ident, world.at)
    world.tick(world.at)
    kinds = world.db.execute(
        "SELECT digest_id, kind FROM digest_issues ORDER BY digest_id"
    ).fetchall()
    assert [tuple(k) for k in kinds] == [(first, "written"), (empty, "nothing")]
    assert digests.owned(world.db, "Mallory", second).requested_at == world.at  # still asked
    assert world.loop.digest_error is None  # a limit doing its work is not a fault


def test_a_name_at_its_limit_never_blocks_another_names_runs(tmp_path):
    world = World(tmp_path)
    ai_ledger.set_digests_per_name(world.db, 1, world.at)
    mine = [world.digest("Mallory", name=f"M{k}") for k in range(5)]
    theirs = world.digest("Victor", name="V")
    for ident in mine:
        digests.request_run(world.db, "Mallory", ident, world.at)
    digests.request_run(world.db, "Victor", theirs, world.at)
    world.tick(world.at)
    assert (world.calls("Mallory"), world.calls("Victor")) == (1, 1)
    waiting = [digests.owned(world.db, "Mallory", i).requested_at for i in mine]
    assert waiting.count(None) == 1 and waiting.count(world.at) == 4


@pytest.mark.parametrize("why", ["day full", "not sent"])
def test_the_due_pass_walks_past_a_crowd_of_waiting_digests(tmp_path, why):
    """More digests waiting for a call than one pass runs (200) must not hide one needing none,
    whether the writer stopped for a limit or for a call not sent (a fault the loop shows)."""
    world = World(tmp_path)
    if why == "day full":
        ai_ledger.set_digests_per_day(world.db, 0, world.at)
    else:
        world.model.answer = lambda request: not_sent()
    for n in range(41):
        for k in range(5):
            ident = world.digest(f"Visitor {n}", name=f"D{k}")
            digests.request_run(world.db, f"Visitor {n}", ident, world.at - timedelta(minutes=5))
    empty = _empty_digest(world, "Vera")
    digests.request_run(world.db, "Vera", empty, world.at)
    world.tick(world.at)
    kinds = world.db.execute("SELECT digest_id, kind FROM digest_issues").fetchall()
    assert [tuple(k) for k in kinds] == [(empty, "nothing")]
    assert ai_ledger.digest_calls_on(world.db, world.at) == 0
    assert (world.loop.digest_error is None) == (why == "day full")


# N9: calls the adapter did not send count toward no limit, and their rows do not pile up


def test_calls_not_sent_count_toward_no_limit_and_the_loop_says_digests_were_left_due(tmp_path):
    world = World(tmp_path)
    world.model.answer = lambda request: not_sent()
    ident = world.digest("Mallory")
    digests.request_run(world.db, "Mallory", ident, world.at)
    for minute in range(60):
        world.tick(BASE + timedelta(minutes=minute))
        assert world.loop.digest_error is not None and "DigestsLeftDue" in world.loop.digest_error
    assert ai_ledger.digest_calls_on(world.db, world.at) == 0
    assert ai_ledger.name_calls_on(world.db, "Mallory", world.at) == 0
    world.model.answer = written
    world.tick(BASE + timedelta(minutes=61))
    assert world.loop.digest_error is None
    assert (
        world.db.execute("SELECT COUNT(*) FROM digest_issues WHERE kind='written'").fetchone()[0]
        == 1
    )


def test_rows_of_calls_not_sent_are_pruned_after_a_day(tmp_path):
    world = World(tmp_path)
    world.model.answer = lambda request: not_sent()
    ident = world.digest("Mallory")
    digests.request_run(world.db, "Mallory", ident, world.at)
    start = BASE
    for minute in range(0, 3 * 24 * 60, 30):  # every 30 minutes for three days
        world.tick(start + timedelta(minutes=minute))
    rows = world.db.execute(
        "SELECT COUNT(*) FROM ai_usage WHERE outcome LIKE 'not_sent:%'"
    ).fetchone()[0]
    assert rows <= 2 * (24 * 2 + 1)  # at most a day of them, for the two purposes
    assert ai_ledger.totals(world.db, "2026-11").total == 0


def test_a_utc_day_counts_its_own_calls_only(tmp_path):
    db = store.open_db(tmp_path)
    ai_ledger.set_cap(db, Decimal(15), BASE)
    late = datetime(2026, 11, 25, 23, 59, tzinfo=UTC)
    early = datetime(2026, 11, 26, 0, 0, tzinfo=UTC)
    for at in (late, early):
        call = ai_ledger.reserve(db, "digest", CONFIG, HOLD, at, ruled_cap=Decimal(15), owner="M")
        ai_ledger.settle(db, call, Decimal("0.001"), "ok", at)
    assert [ai_ledger.digest_calls_on(db, at) for at in (late, early)] == [1, 1]
    assert [ai_ledger.name_calls_on(db, "M", at) for at in (late, early)] == [1, 1]
    db.close()


def test_pruning_keeps_every_paid_call_and_its_cost(tmp_path):
    db = store.open_db(tmp_path)
    ai_ledger.set_cap(db, Decimal(15), BASE)
    paid = ai_ledger.reserve(db, "stories", CONFIG, HOLD, BASE, ruled_cap=Decimal(15))
    ai_ledger.settle(db, paid, Decimal("0.30"), "ok", BASE)
    free = ai_ledger.reserve(db, "stories", CONFIG, HOLD, BASE, ruled_cap=Decimal(15))
    ai_ledger.settle(db, free, Decimal(0), "not_sent: KeyMissing", BASE)
    later = BASE + timedelta(days=2)
    ai_ledger.reserve(db, "stories", CONFIG, HOLD, later, ruled_cap=Decimal(15))
    ids = [int(r[0]) for r in db.execute("SELECT id FROM ai_usage ORDER BY id")]
    assert ids == [paid, free + 1]  # the call not sent is gone; the paid one stays
    assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.30")
    db.close()


def test_a_name_refused_by_the_ledger_mid_pass_stops_no_other_name(tmp_path):
    """The writer's own check read the limit when the pass began; the owner lowered it meanwhile,
    so the ledger refuses Mallory's call (NameFull): Victor's digest still gets its call."""
    world = World(tmp_path)
    mine = world.digest("Mallory", name="M")
    theirs = world.digest("Victor", name="V")
    digests.request_run(world.db, "Mallory", mine, world.at - timedelta(minutes=1))
    digests.request_run(world.db, "Victor", theirs, world.at)
    with world.db:
        world.db.execute(
            "INSERT INTO ai_usage(purpose, owner, config_id, month, reserved_usd, settled_usd,"
            " status, outcome, reserved_at) VALUES('digest', 'Mallory', ?, '2026-11', '0.3585',"
            " '0.001', 'settled', 'ok', ?)",
            (CONFIG, store._utc_text(world.at - timedelta(hours=1))),
        )
    writer = ai_digest.Writer(world.db, world.model, setup_guard(world), world.at)
    ai_ledger.set_digests_per_name(world.db, 1, world.at)  # after the writer read it (5)
    ran = digests.run_due(world.db, world.at, writer)
    assert [n for n, _ in ran] == [theirs] and ran.waiting == [mine]
    assert writer.stopped is None


def setup_guard(world: World) -> Any:
    return world.setup.guard
