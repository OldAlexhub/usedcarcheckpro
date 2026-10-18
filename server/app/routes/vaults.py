from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Vault
from app.schemas import VaultCreateRequest, VaultCreateResponse
from app.security import create_secret, hash_secret

router = APIRouter(prefix="/vaults", tags=["vaults"])


@router.post("", response_model=VaultCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_vault(
    request: VaultCreateRequest, session: Annotated[AsyncSession, Depends(get_session)]
) -> VaultCreateResponse:
    secret = create_secret()
    vault = Vault(secret_hash=hash_secret(secret), app_version=request.app_version)
    session.add(vault)
    await session.commit()
    await session.refresh(vault)
    return VaultCreateResponse(vault_id=vault.id, secret=secret)

