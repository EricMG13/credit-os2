"""Create a public MSAL client without retaining or logging token-cache entries."""

from __future__ import annotations

from typing import Any

from msal import PublicClientApplication, TokenCache  # type: ignore[import-untyped]


class _DiscardingTokenCache(TokenCache):  # type: ignore[misc]
    """Discard MSAL's token event instead of persisting or debug-logging it."""

    def add(self, event: dict[str, Any], now: int | None = None) -> None:
        del event, now


def public_client(
    client_id: str,
    authority: str,
    *,
    instance_discovery: bool = True,
    http_client: Any | None = None,
) -> PublicClientApplication:
    """Build a nonpersistent client; disable discovery only for an offline test authority."""
    return PublicClientApplication(
        client_id,
        authority=authority,
        instance_discovery=instance_discovery,
        enable_pii_log=False,
        token_cache=_DiscardingTokenCache(),
        http_client=http_client,
    )
