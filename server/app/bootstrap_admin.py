import asyncio

from argon2 import PasswordHasher
from sqlalchemy import select

from app.config import get_settings
from app.database import SessionFactory, engine
from app.models import AdminUser, utc_now


async def bootstrap_admin() -> None:
    settings = get_settings()
    if settings.admin_username is None or settings.admin_password is None:
        if settings.environment.lower() == "production":
            raise RuntimeError(
                "ADMIN_USERNAME and ADMIN_PASSWORD are required in production"
            )
        print("Admin bootstrap skipped: credentials are not configured")
        return

    password = settings.admin_password.get_secret_value()
    if len(password) < 10 or password.startswith("replace-with-"):
        raise RuntimeError(
            "ADMIN_PASSWORD must be a non-placeholder value with at least 10 characters"
        )

    hasher = PasswordHasher()
    async with SessionFactory() as session:
        admin = await session.scalar(
            select(AdminUser).where(AdminUser.username == settings.admin_username)
        )
        password_hash = hasher.hash(password)
        if admin is None:
            admin = AdminUser(
                username=settings.admin_username,
                password_hash=password_hash,
            )
            session.add(admin)
            action = "created"
        else:
            admin.password_hash = password_hash
            admin.updated_at = utc_now()
            action = "updated"
        await session.commit()
    print(f"Portal administrator {settings.admin_username!r} {action}")


async def main() -> None:
    try:
        await bootstrap_admin()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

