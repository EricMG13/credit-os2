"""Launch the same-origin React frontend and workflow service."""

import argparse
import asyncio
import sys
from pathlib import Path

from deploy_workflow.inbox.startup import STANDING_RULING
from deploy_workflow.model.copilot_adapter import CopilotAdapter
from deploy_workflow.model.turn import ModelSpec

from react_frontend import serve


def _seat_models() -> dict[str, frozenset[str]]:
    spec = ModelSpec("copilot-sol-medium", "copilot", "gpt-6.1-sol", "medium")
    try:
        models = asyncio.run(CopilotAdapter(spec, STANDING_RULING).seat_models())
    except Exception:  # noqa: BLE001 - an optional runtime query must never block offline startup
        models = {}
    if not models:
        print(
            "Copilot seat could not be verified. Start a run remains available for review.",
            file=sys.stderr,
        )
    return models


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True, help="the shared folder")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument(
        "--signal-url",
        default="",
        help="http://<host>:<port>/ of Signal: serves /signal and forwards /signal/api/ to it",
    )
    parser.add_argument(
        "--copilot-preflight",
        action="store_true",
        help="check this seat's model catalogue before serving live run options",
    )
    args = parser.parse_args()
    try:
        models = _seat_models() if args.copilot_preflight else {}
        serve(args.root, port=args.port, signal_url=args.signal_url, copilot_models=models)
    except (OSError, ValueError) as error:
        parser.exit(2, f"{error}\n")
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
