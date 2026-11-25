"""Notification settings: per user, two switches for each of the four events of spec 5.9.

The switches are the Notifications screen's two channels: "In Signal" (the event raises the count
on the channel rail) and "On the desktop" (stored and delivered for the desktop app to act on; the
service itself sends nothing to a desktop). A user who never set a switch has the default.

Events: replies to my comments, new threads in my groups, high-signal stories in my topics (while
the AI pass is on, a followed topic's rail count says how many strong stories it got in the last
day: ``snapshot._strong_counts``), a digest is ready (read by the digests module).
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass

from deploy_workflow.signal.groups import GroupError, NotFound
from deploy_workflow.signal.store import _write_transaction

CHANNELS = ("inSignal", "onDesktop")  # the snapshot's names for the two switches


@dataclass(frozen=True)
class Event:
    label: str
    in_signal: bool  # the default of each switch
    on_desktop: bool


# In the order the screen lists them. Defaults: every event raises the count in Signal (that is
# where it is read), none goes to the desktop until the user asks for it.
EVENTS: dict[str, Event] = {
    "replies": Event("A reply to one of my comments", True, False),
    "threads": Event("A new thread in one of my groups", True, False),
    "signal": Event("A high-signal story in a topic I follow", True, False),
    "digest": Event("A digest of mine is ready", True, False),
}


def switches(db: sqlite3.Connection, user_name: str) -> dict[str, tuple[bool, bool]]:
    """Every event's (in Signal, on the desktop) for the user, defaults filled in."""
    found = {
        str(row["event"]): (bool(row["in_signal"]), bool(row["on_desktop"]))
        for row in db.execute(
            "SELECT event, in_signal, on_desktop FROM notification_settings WHERE user_name=?",
            (user_name,),
        ).fetchall()
    }
    return {
        key: found.get(key, (event.in_signal, event.on_desktop)) for key, event in EVENTS.items()
    }


def set_switch(
    db: sqlite3.Connection, user_name: str, event: object, channel: object, on: object
) -> None:
    """Set one switch; the event's other switch keeps its value (its default if never set)."""
    if not isinstance(event, str) or event not in EVENTS:
        raise NotFound(f"no notification event {event!r}")
    if not isinstance(channel, str) or channel not in CHANNELS:
        raise GroupError("channel must be 'inSignal' or 'onDesktop'")
    if not isinstance(on, bool):
        raise GroupError("on must be true or false")
    with _write_transaction(db):
        current = list(switches(db, user_name)[event])
        current[CHANNELS.index(channel)] = on
        db.execute(
            "INSERT INTO notification_settings(user_name, event, in_signal, on_desktop)"
            " VALUES(?, ?, ?, ?) ON CONFLICT(user_name, event)"
            " DO UPDATE SET in_signal=excluded.in_signal, on_desktop=excluded.on_desktop",
            (user_name, event, int(current[0]), int(current[1])),
        )
