"""F2: a failure inside connect() happens before any request byte; it is NotSent."""

from collections.abc import Mapping
from typing import Any

import pytest

from deploy_workflow.model.providers import ErrorKind, error_from_transport
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.transport import (
    ConnectTimeout,
    Request,
    TransportError,
    https_transport,
)


def ssl_error() -> BaseException:
    import ssl

    return ssl.SSLCertVerificationError("bad cert")


class _Conn:
    sock: Any = None

    def __init__(self, connect_error: BaseException | None, request_error: BaseException | None):
        self.connect_error, self.request_error = connect_error, request_error
        self.closed = False

    def connect(self) -> None:
        if self.connect_error is not None:
            raise self.connect_error

    def request(self, method: str, url: str, body: bytes, headers: Mapping[str, str]) -> None:
        raise self.request_error or AssertionError("not reached")

    def getresponse(self) -> Any:
        raise AssertionError("not reached")

    def close(self) -> None:
        self.closed = True


class _Timer:
    def start(self) -> None:
        pass

    def cancel(self) -> None:
        pass

    def join(self) -> None:
        pass


class _Sock:
    def settimeout(self, _t: float) -> None:
        pass

    def shutdown(self, _how: int) -> None:
        pass


def _run(connect_error: BaseException | None, request_error: BaseException | None = None) -> Any:
    conn = _Conn(connect_error, request_error)
    conn.sock = _Sock()
    request = Request("https://api.example/x", {}, b"{}")
    try:
        https_transport(
            request, connection_factory=lambda *_: conn, timer_factory=lambda *_: _Timer()
        )
    except TransportError as error:
        return error
    raise AssertionError("no error")


@pytest.mark.parametrize(
    "cause", [TimeoutError(), ConnectionRefusedError("x"), OSError("dns"), ssl_error()]
)
def test_a_connect_failure_is_not_sent(cause: BaseException) -> None:
    error = _run(cause)
    reply = error_from_transport("openai", error, Redactor())
    assert reply.kind is ErrorKind.NOT_SENT


def test_a_connect_timeout_keeps_its_exception_class() -> None:
    assert isinstance(_run(TimeoutError()), ConnectTimeout)


def test_a_failure_after_the_request_starts_stays_charge_unknown() -> None:
    error = _run(None, ConnectionResetError("x"))
    reply = error_from_transport("openai", error, Redactor())
    assert reply.kind is ErrorKind.SENT_CHARGE_UNKNOWN
