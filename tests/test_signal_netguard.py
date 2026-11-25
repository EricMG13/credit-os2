"""The test suite's network guard (``tests/conftest.py``, ``no_real_network``): a Signal test that
reaches the real fetcher, a lookup of a public name or a connection to a public address fails,
also from a background thread, while the loopback address stays open for the service tests. Each
test provokes the guard on purpose and then empties its record, so its own teardown passes. No
request leaves the machine: the guard refuses before any lookup or connection is made."""

from __future__ import annotations

import contextlib
import socket
import threading
from datetime import UTC, datetime
from pathlib import Path

import pytest
import signal_guard

from deploy_workflow.signal import ingest, market, service, store
from deploy_workflow.signal.fetch import fetch

Failed = pytest.fail.Exception


def _taken() -> list[str]:
    held = [what for _, _, what in signal_guard.NETWORK_ATTEMPTS]
    signal_guard.NETWORK_ATTEMPTS.clear()
    return held


def test_the_real_fetch_is_refused_before_it_looks_anything_up():
    with pytest.raises(Failed, match="a Signal test reached the network"):
        fetch("https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany", None, None)
    assert _taken() == ["fetch's lookup of 'www.sec.gov'"]


def test_an_ingest_pass_or_a_market_job_with_the_default_fetch_fails_the_test(tmp_path: Path):
    db = store.open_db(tmp_path)
    source = store.propose_source(db, "Wire", "news", "https://wire.example/rss", "Mara L")
    store.set_source_state(db, source, "approved")
    with pytest.raises(Failed):  # a BaseException: the pass's fail-open does not swallow it
        ingest.run_due(db, datetime(2026, 11, 25, 9, 0, tzinfo=UTC))
    assert _taken() == ["fetch's lookup of 'wire.example'"]
    made = market.propose(db, "Ida Owner", series=market.DEFAULTS[:1])
    store.set_source_state(db, made, "approved")
    db.close()
    loop = service.Loop(tmp_path)
    with pytest.raises(Failed):
        loop.run_once(datetime(2026, 11, 25, 9, 0, tzinfo=UTC))
    assert _taken()[0] == "fetch's lookup of 'wire.example'"


def test_a_lookup_or_connection_from_a_background_thread_is_recorded():
    def reach() -> None:
        with contextlib.suppress(Failed):  # the guard's Failed would end this thread only
            socket.getaddrinfo("public.example", 443)
        with contextlib.suppress(Failed), socket.socket() as sock:
            sock.connect(("192.0.2.1", 443))

    worker = threading.Thread(target=reach, name="worker")
    worker.start()
    worker.join()
    assert [(thread, what) for _, thread, what in signal_guard.NETWORK_ATTEMPTS] == [
        ("worker", "a lookup of 'public.example'"),
        ("worker", "a connection to '192.0.2.1'"),
    ]
    _taken()


@pytest.mark.parametrize("host", ["192.0.2.1", "0x0", "::ffff:0.0.0.0", "a" * 300])
def test_a_lookup_no_name_server_answers_is_let_through(host):
    # An address written in numbers is read on this machine, and a name with a label over 63
    # characters is refused before any query: neither reaches a name server.
    with contextlib.suppress(OSError, UnicodeError):
        socket.getaddrinfo(host, 443)
    assert signal_guard.NETWORK_ATTEMPTS == []


def test_a_lookup_asked_for_numbers_only_is_let_through():
    with contextlib.suppress(OSError):
        socket.getaddrinfo("not an address", None, flags=socket.AI_NUMERICHOST)
    assert signal_guard.NETWORK_ATTEMPTS == []


def test_the_loopback_address_stays_open():
    with socket.socket() as server:
        server.bind(("127.0.0.1", 0))
        server.listen()
        with socket.create_connection(("127.0.0.1", server.getsockname()[1]), timeout=5):
            pass
    assert signal_guard.NETWORK_ATTEMPTS == []
