"""Serve the Credit Snapshot workbook of one admitted, finished run as a download."""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from deploy_workflow import credit_snapshot, credit_snapshot_workbook, http_base, library_index
from deploy_workflow import reference_portfolios as portfolios
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.run_start import reference_portfolio
from deploy_workflow.run_start.submissions import Refused as NoRunStore

from . import artifacts

SNAPSHOT = re.compile(r"/connected/deliverables/([^/]+)/credit-snapshot\.xlsx")
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
_LOG = logging.getLogger(__name__)


def _stores(layout: Layout, folder: str) -> list[portfolios.Store]:
    stores = [portfolios.Store(reference_portfolio.standing_root(layout))]
    try:
        stores.append(reference_portfolio.run_store(layout, folder))
    except NoRunStore:
        pass  # a folder that is not a run id has no run store of its own: standing store only
    return stores


def _plain_folder(path: Path) -> bool:
    """A real directory: a link is not followed, and a missing folder is not one."""
    return path.is_dir() and not path.is_symlink()


def reply(
    match: re.Match[str],
    layout: Layout,
    folder_pattern: re.Pattern[str],
    snapshot: dict[str, Any] | None,
) -> http_base.Reply:
    folder, _ = artifacts.admitted(match[1], folder_pattern, snapshot)
    path = layout.engine / "runs" / folder
    if not _plain_folder(path):
        _LOG.warning(
            "credit snapshot refused for run %r: the run folder is not a plain folder", folder
        )
        raise http_base.refuse(404, "credit snapshot unavailable")
    try:
        run = credit_snapshot.load_run(path, _stores(layout, folder))
        data = credit_snapshot_workbook.workbook_bytes(credit_snapshot.gather(run))
    except library_index.Refused as reason:
        _LOG.warning("credit snapshot refused for run %r: %s", folder, reason)
        raise http_base.refuse(404, "credit snapshot unavailable") from None
    return http_base.Reply(
        200,
        data,
        {
            "Content-Type": XLSX,
            "Content-Disposition": 'attachment; filename="credit-snapshot.xlsx"',
            "Cache-Control": "no-store",
        },
    )
