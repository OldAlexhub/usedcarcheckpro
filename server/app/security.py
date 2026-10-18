import hashlib
import hmac
import secrets
import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import DataInstallation, Vault, utc_now

bearer = HTTPBearer(auto_error=False)


def create_secret() -> str:
    return secrets.token_urlsafe(32)


def hash_secret(secret: str) -> bytes:
    return hashlib.sha256(secret.encode("utf-8")).digest()


async def require_vault(
    vault_id: Annotated[uuid.UUID, Header(alias="X-Vault-ID")],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Vault:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing vault secret")

    vault = await session.get(Vault, vault_id)
    supplied_hash = hash_secret(credentials.credentials)
    if vault is None or not hmac.compare_digest(vault.secret_hash, supplied_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid vault credentials",
        )

    vault.last_seen_at = utc_now()
    return vault


async def require_data_installation(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    session: Annotated[AsyncSession, Depends(get_session)],
    install_id: Annotated[
        str | None, Header(alias="X-Install-ID", min_length=16, max_length=64)
    ] = None,
) -> DataInstallation:
    if (
        install_id is None
        or credentials is None
        or credentials.scheme.lower() != "bearer"
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing data-installation secret",
        )

    installation = await session.get(DataInstallation, install_id)
    supplied_hash = hash_secret(credentials.credentials)
    if installation is None or not hmac.compare_digest(
        installation.secret_hash, supplied_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid data-installation credentials",
        )

    installation.last_seen_at = utc_now()
    return installation

