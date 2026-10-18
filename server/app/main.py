import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

from app.bootstrap_admin import bootstrap_admin
from app.config import get_settings
from app.database import Base, engine
from app.routes import admin, analytics, data, datasets, health, images, sync, vaults, vin

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_create_schema:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    # Nexus can launch Uvicorn directly instead of executing the Docker CMD.
    # Bootstrap here so every launch path guarantees the configured portal
    # administrator exists and has the current deployment password.
    await bootstrap_admin()
    yield
    await engine.dispose()


app = FastAPI(
    title="Proveh Server",
    version="0.1.0",
    description="Self-hosted vehicle inspection services. No LLMs are used.",
    lifespan=lifespan,
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.admin_session_secret.get_secret_value(),
    session_cookie="proveh_admin",
    max_age=settings.admin_session_hours * 60 * 60,
    same_site="strict",
    https_only=settings.environment.lower() == "production",
)

if settings.cors_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Vault-ID"],
    )


@app.middleware("http")
async def request_metadata(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))[:128]
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.environment.lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    if request.url.path.startswith("/admin"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self'; form-action 'self'; frame-ancestors 'none'"
        )
    return response


@app.get("/", include_in_schema=False)
async def root() -> RedirectResponse:
    """Make the public server address open the administrator portal."""
    return RedirectResponse(url="/admin", status_code=303)


app.include_router(admin.router)

for route in (
    health.router,
    vin.router,
    images.router,
    vaults.router,
    sync.router,
    data.router,
    datasets.router,
    analytics.router,
):
    app.include_router(route, prefix="/api/v1")

