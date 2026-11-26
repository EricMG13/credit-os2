"""An unreadable handoff of a module that is not a fixed column still shows in `other`."""

from react_frontend import coverage


def _entry(code: str) -> list[dict[str, object]]:
    workspace = {
        "outputs": {"o1": {"id": "o1", "module": code, "sha256": "a" * 64, "parseError": "bad"}},
        "handoffs": {},
    }
    record = {
        "folder": "r1",
        "pathway": "custom",
        "requested": [code],
        "modules": {code: {"default": "o1", "outputs": ["o1"]}},
    }
    entry, facts = coverage._run_entry(workspace, "r1", record, {})
    assert facts == []
    return entry["other"]  # type: ignore[no-any-return]


def test_unreadable_handoff_of_a_non_column_module_is_listed_in_other() -> None:
    other = _entry("CP-2H")
    assert [(item["code"], item["state"]) for item in other] == [("CP-2H", "unreadable")]


def test_unreadable_handoff_of_a_destination_code_stays_out_of_other() -> None:
    assert _entry("CP-MODEL") == []
