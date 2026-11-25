"""Signal's route for source logos (``logos``).

    GET /api/logos/<source id>   -> {"type": "image/png", "data": "<base64>"}

Open to every named user (401 otherwise). An unknown source, one not approved, one with no logo
stored, and any source while the owner has switched logos off are each answered 404 with the same
body, ``{"error": "no logo for this source"}``, so a reply says nothing more about a source. An
icon is at most 32 KiB, so a reply is at most about 44 KiB of JSON.
"""

from __future__ import annotations

import re

from deploy_workflow.http_base import Reply, refuse
from deploy_workflow.signal import logos
from deploy_workflow.signal.routing import ID, Req, Route


def _logo(req: Req) -> Reply:
    _ = req.person  # a named user only (401 otherwise; the service checks it first too)
    found = logos.delivered(req.db, int(req.groups[0]))
    if found is None:
        raise refuse(404, logos.NOT_FOUND)
    return Reply(200, found)


ROUTES: tuple[Route, ...] = (Route("GET", re.compile(f"/api/logos/{ID}"), _logo),)
