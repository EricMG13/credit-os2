"""Apply scheduler admission to every connected view of a native publication."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout


def admitted(snapshot: dict[str, Any], layout: Layout) -> dict[str, Any]:
    """Retain historical publications; hide managed runs until scheduler acceptance.

    Delivery writes the library before the scheduler decides the run's final status.
    A publication alone therefore cannot establish completion for a managed run.
    Historical library folders without a scheduler record retain native admission.
    """
    readable, unreadable = runs.load_readable(layout)
    # Fail closed for the run of an unreadable record file: its stem is the run ID, and a run whose
    # acceptance cannot be read is not shown. Every other publication stays visible.
    unfinished = {record.id for record in readable if record.status != "finished"}
    unreadable_stems = {runs.name_key(Path(name).stem) for name in unreadable}

    def hidden(name: Any) -> bool:
        # A library folder is the run ID; a file system may fold its case, so an unreadable file's
        # stem hides a folder of any case. Readable records' IDs are compared as stored.
        return name in unfinished or (
            isinstance(name, str) and runs.name_key(name) in unreadable_stems
        )

    workspace = snapshot["workspace"]
    published = {key: run for key, run in workspace["runs"].items() if not hidden(run["folder"])}
    if not unfinished and not unreadable_stems:
        return snapshot
    output_ids = {
        output
        for run in published.values()
        for module in run.get("modules", {}).values()
        for output in module["outputs"]
    }
    outputs = {
        key: output
        for key, output in workspace.get("outputs", {}).items()
        if key in output_ids and (not output.get("run") or output["run"] in published)
    }
    hashes = {output["sha256"] for output in outputs.values()}
    return {
        **snapshot,
        "catalogue": {
            **snapshot["catalogue"],
            "real": [run for run in snapshot["catalogue"]["real"] if not hidden(run["id"])],
        },
        "workspace": {
            **workspace,
            "runs": published,
            "outputs": outputs,
            "handoffs": {
                key: value for key, value in workspace.get("handoffs", {}).items() if key in hashes
            },
            "models": [
                model
                for model in workspace.get("models", [])
                if not hidden(model.get("runId")) and not hidden(model.get("runFolder"))
            ],
        },
        "chips": {
            key: value
            for key, value in snapshot["chips"].items()
            if key.rpartition(":")[0] in outputs
        },
    }
