"""Create a public MSAL client without retaining or logging token-cache entries."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from msal import PublicClientApplication, TokenCache  # type: ignore[import-untyped]

TENANT_ENV = "CREDIT_OS_ENTRA_TENANT"
CLIENT_ENV = "CREDIT_OS_ENTRA_CLIENT"
ACCOUNTS_DIR_ENV = "CREDIT_OS_ACCOUNTS_DIR"
PAIR_REQUIRED = "set both Entra tenant and client IDs"
HTTPS_REQUIRED = "Entra sign-in needs a dedicated HTTPS application hostname"


@dataclass(frozen=True)
class EntraIds:
    """The tenant and public-client ids read together from the launching environment."""

    tenant_id: str
    client_id: str

    @classmethod
    def from_environment(cls, environ: Mapping[str, str]) -> EntraIds | None:
        tenant_id = environ.get(TENANT_ENV)
        client_id = environ.get(CLIENT_ENV)
        if (tenant_id is None) != (client_id is None) or (
            tenant_id is not None and (not tenant_id or not client_id)
        ):
            raise ValueError(PAIR_REQUIRED)
        if tenant_id is None or client_id is None:
            return None
        return cls(tenant_id=tenant_id, client_id=client_id)


@dataclass(frozen=True)
class EntraProvider:
    """The actual MSAL client and independently configured expected issuer."""

    application: PublicClientApplication
    issuer: str


EntraProviderFactory = Callable[[str, str], EntraProvider]


@dataclass(frozen=True)
class EntraRuntimeConfig:
    """Validated live sign-in settings handed from server setup to route construction."""

    tenant_id: str
    client_id: str
    accounts_dir: Path
    provider_factory: EntraProviderFactory


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
